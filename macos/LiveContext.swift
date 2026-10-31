import AppKit
import WebKit
import Darwin

/** One-way, opt-in publication to a fixed sibling of a saved project. Forma never reads this file back,
 * adds no listener and accepts no request through it. The renderer never sees or chooses its path. */
enum LiveContextFile {
    static let limit=24_000_000,imageLimit=11_000_000,screenshotWidth=1600
    static func url(_ project:URL)->URL {URL(fileURLWithPath:project.path+".oanarina-live.json")}
    static func remove(_ project:URL){Darwin.unlink(url(project).path)}
    static func write(_ data:Data,to url:URL)throws {
        guard data.count<=limit else{throw NSError(domain:"Live editor context exceeds its size limit.",code:1)}
        let temporary=url.deletingLastPathComponent().appendingPathComponent("."+url.lastPathComponent+"."+UUID().uuidString+".tmp")
        let descriptor=Darwin.open(temporary.path,O_WRONLY|O_CREAT|O_EXCL|O_NOFOLLOW,mode_t(0o600))
        guard descriptor>=0 else{throw NSError(domain:NSPOSIXErrorDomain,code:Int(errno))}
        var failure:Int32=0
        data.withUnsafeBytes{bytes in var offset=0;while offset<bytes.count{let written=Darwin.write(descriptor,bytes.baseAddress!+offset,bytes.count-offset);if written<=0{failure=errno;return};offset+=written}}
        Darwin.close(descriptor)
        guard failure==0,Darwin.rename(temporary.path,url.path)==0 else{let code=failure==0 ? errno:failure;Darwin.unlink(temporary.path);throw NSError(domain:NSPOSIXErrorDomain,code:Int(code))}
    }
    /** Fit to the published width in pixels, whatever the display scale. */
    static func png(_ image:NSImage)->[String:Any]? {
        guard let source=image.cgImage(forProposedRect:nil,context:nil,hints:nil),source.width>0 else{return nil}
        let width=min(screenshotWidth,source.width),height=max(1,source.height*width/source.width)
        guard let context=CGContext(data:nil,width:width,height:height,bitsPerComponent:8,bytesPerRow:0,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue) else{return nil}
        context.interpolationQuality = .high;context.draw(source,in:CGRect(x:0,y:0,width:width,height:height))
        guard let fitted=context.makeImage(),let data=NSBitmapImageRep(cgImage:fitted).representation(using:.png,properties:[:]),data.count<=imageLimit else{return nil}
        return ["mime":"image/png","width":width,"height":height,"data":data.base64EncodedString()]
    }
    /** The renderer's answer is untrusted input to a file other tools read. */
    static func snapshot(_ body:[String:Any],documentId:String)->(key:String,record:[String:Any])? {
        guard let key=body["key"] as? String,key.utf8.count<=3_000_000,body["documentId"] as? String==documentId,let name=body["documentName"] as? String,name.utf8.count<=4096,let pageId=body["pageId"] as? String,!pageId.isEmpty,pageId.utf8.count<=512,let pageName=body["pageName"] as? String,pageName.utf8.count<=4096,let selection=body["selection"] as? [String],selection.count<=5000,selection.allSatisfy({!$0.isEmpty&&$0.utf8.count<=512}),let dirty=body["dirty"] as? Bool,let view=body["viewport"] as? [String:Any],let zoom=view["zoom"] as? Double,let x=view["panX"] as? Double,let y=view["panY"] as? Double,zoom.isFinite,x.isFinite,y.isFinite else{return nil}
        var record:[String:Any]=["format":"forma-live-context","version":1,"pid":Int(ProcessInfo.processInfo.processIdentifier),"documentId":documentId,"documentName":name,"pageId":pageId,"pageName":pageName,"selection":selection,"dirty":dirty,"viewport":["zoom":zoom,"panX":x,"panY":y]]
        record["artwork"]=NSNull()
        if let art=body["artwork"] as? [String:Any]{guard let data=art["data"] as? String,data.utf8.count<=(imageLimit/3+1)*4,let width=art["width"] as? Int,let height=art["height"] as? Int,(1...16384).contains(width),(1...16384).contains(height),["selection","page"].contains(art["scope"] as? String ?? ""),Data(base64Encoded:String(data.prefix(16)))?.starts(with:[0x89,0x50,0x4e,0x47]) == true else{return nil};record["artwork"]=["mime":"image/png","width":width,"height":height,"scope":art["scope"]!,"data":data]}
        return (key,record)
    }
}
struct LiveState {
    var stamp:[Int]?;var retryAt:TimeInterval=0;var syncing=false;var pending:String?;var refused:String?
    var key="";var visible=false;var publishing=false;var startedAt:TimeInterval=0
}

extension Studio {
    /** Only integration runs enable these in tests: other smoke checks write the bound file deliberately. */
    func startLiveTimer(){guard !smoke||CommandLine.arguments.contains("--integration-smoke-test") else{return};let timer=Timer(timeInterval:1,repeats:true){[weak self] _ in self?.documents.forEach{$0.liveTick()}};RunLoop.main.add(timer,forMode:.common)}
}
extension DocumentWindow {
    func liveTick(){syncSavedFile();publishLive()}
    /** The saved file stays the shared source of truth. MCP writers hold the same lock and revision rules as Save. */
    func syncSavedFile(){
        guard ready,let file=session.file,let current=state,!saveInFlight,!closing,window.attachedSheet==nil,!live.syncing else{return}
        let now=ProcessInfo.processInfo.systemUptime;guard now>=live.retryAt else{return}
        if live.pending != nil,!current.dirty{live.pending=nil;live.stamp=nil}
        var info=stat();guard lstat(file.path,&info)==0,info.st_mode & S_IFMT == S_IFREG else{return}
        let stamp=[Int(info.st_ino),Int(info.st_size),Int(info.st_mtimespec.tv_sec),Int(info.st_mtimespec.tv_nsec)]
        guard stamp != live.stamp else{return}
        guard !FileManager.default.fileExists(atPath:file.path+".oanarina-mcp.lock") else{return}
        live.stamp=stamp
        guard let data=try? ProjectFileSafety.readBounded(file) else{return}
        let fingerprint=ProjectFileSafety.fingerprint(data)
        guard fingerprint != session.fingerprint,fingerprint != live.pending,fingerprint != live.refused else{return}
        guard let(raw,id)=try? studio.project(data),id==current.id else{live.refused=fingerprint;externalNotice("The saved file changed outside Forma but is not a valid copy of this project. It was not loaded.");return}
        live.syncing=true
        web.callAsyncJavaScript("return await window.__studioNative('external-document',raw);",arguments:["raw":raw],in:nil,in:.page){[weak self] result in
            guard let self else{return};self.live.syncing=false
            switch (try? result.get()) as? String{
            case "reloaded":self.session.fingerprint=fingerprint;self.live.pending=nil;self.studio.persistSessions()
            case "dirty":self.live.pending=fingerprint;self.externalNotice("The saved file changed outside Forma. Your unsaved edits are kept; Save will ask before replacing it.")
            case "busy":self.live.stamp=nil;self.live.retryAt=now+3
            default:self.live.refused=fingerprint}
        }
    }
    func externalNotice(_ text:String){web.callAsyncJavaScript("return await window.__studioNative('external-notice',text);",arguments:["text":text],in:nil,in:.page,completionHandler:nil)}
    func publishLive(){
        let now=ProcessInfo.processInfo.systemUptime
        if live.publishing&&now-live.startedAt>15{live.publishing=false}
        guard session.shareLive,ready,session.file != nil,let saved=session.fingerprint,let id=state?.id,!live.publishing,!saveInFlight else{return}
        let visible=window.isVisible && !window.isMiniaturized;live.publishing=true;live.startedAt=now
        web.callAsyncJavaScript("return await window.__studioNative('live-context',previous);",arguments:["previous":visible==live.visible ? live.key:""],in:nil,in:.page){[weak self] result in
            guard let self else{return}
            guard case .success(let value)=result,let body=value as? [String:Any],body["unchanged"]==nil,let(key,base)=LiveContextFile.snapshot(body,documentId:id) else{self.live.publishing=false;return}
            let publish:(NSImage?)->Void={[weak self] image in
                guard let self else{return}
                var record=base;record["savedRevision"]=self.session.fingerprint ?? saved;record["capturedAt"]=ISO8601DateFormatter().string(from:Date());record["screenshot"]=image.flatMap(LiveContextFile.png) ?? NSNull()
                let target=self.session.file.map(LiveContextFile.url)
                DispatchQueue.global(qos:.utility).async{
                    var failed=false
                    if let target,let data=try? JSONSerialization.data(withJSONObject:record){do{try LiveContextFile.write(data,to:target)}catch{failed=true}}else{failed=true}
                    DispatchQueue.main.async{self.live.publishing=false;if !failed{self.live.key=key;self.live.visible=visible};if !self.session.shareLive,let file=self.session.file{LiveContextFile.remove(file)}}
                }
            }
            guard visible else{publish(nil);return}
            let configuration=WKSnapshotConfiguration();configuration.afterScreenUpdates=true
            self.web.takeSnapshot(with:configuration){image,_ in publish(image)}
        }
    }
    /** Consent names exactly what leaves the window, and that it includes unsaved content. */
    func toggleLiveContext(){
        if session.shareLive{session.shareLive=false;live.key="";studio.persistSessions();return}
        guard session.file != nil else{return}
        let alert=NSAlert();alert.messageText="Share this window with local MCP tools?";alert.informativeText="While sharing is on, Forma keeps a private file beside this project containing its current page, selection, a screenshot of this window and rendered artwork, including unsaved changes. Local programs you run can read it. It stays on this Mac and is removed when you turn sharing off or close the window.";alert.addButton(withTitle:"Share");alert.addButton(withTitle:"Cancel")
        alert.beginSheetModal(for:window){response in if response == .alertFirstButtonReturn{self.session.shareLive=true;self.live.key="";self.studio.persistSessions();self.publishLive()}}
        if studio.smoke,let index=studio.smokeAlertResponse{studio.smokeAlertResponse=nil;DispatchQueue.main.async{alert.buttons[index].performClick(nil)}}
    }
}
