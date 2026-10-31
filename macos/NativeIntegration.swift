import AppKit
import WebKit
import PDFKit
import CoreText
import UniformTypeIdentifiers

/** System services driven from the shell. The renderer gets no new message type; each feature pulls
 * bounded content from it through the existing page-world call path and keeps file URLs native. */
extension Studio:NSMenuItemValidation {
    static let selectionCommands:Set<String>=["cut","copy","copy-as-png","delete","duplicate","rename","select-child","select-parent","select-next-sibling","select-previous-sibling","select-same-fill","select-same-stroke","select-same-text","group","ungroup","frame-selection","component","mask","mask-alpha","mask-vector","mask-luminance","move-to-page","lock","hide","flip-x","flip-y","rotate-left","rotate-right","rotate-180","forward","backward","front","back","auto-layout","union","subtract","intersect","exclude","flatten","fit-selection","find-selection","left","center","right","top","middle","bottom"]
    static let checkableCommands:Set<String>=["grid","snap","rulers","outlines","frame-names","section-names","canvas-scrollbars","overview-minimap"]
    func nativeCommand(_ id:String)->Bool {
        switch id{
        case "native-print":active?.printDocument()
        case "native-share":active?.shareDocument()
        case "native-revert":active?.revertToSaved()
        case "native-live-context":active?.toggleLiveContext()
        case "native-sample-color":active?.sampleScreenColor()
        case "native-guide":NSWorkspace.shared.open(URL(string:"https://www.oanarinaldi.com/ui-tool-guide.html")!)
        default:return false}
        return true
    }
    func validateMenuItem(_ item:NSMenuItem)->Bool {
        guard let id=item.representedObject as? String else{return true}
        let document=active
        if id=="native-print"||id=="native-share"{return document?.ready==true&&document?.delivering==false}
        if id=="native-sample-color"{return document?.ready==true&&document?.colorSampler==nil}
        if id=="native-revert"{return document?.ready==true&&document?.session.file != nil&&document?.state?.dirty==true}
        if id=="native-live-context"{item.state=document?.session.shareLive==true ? .on:.off;return document?.ready==true&&document?.session.file != nil}
        guard let menu=document?.state?.menu else{return true}
        if Self.checkableCommands.contains(id){item.state=menu.checked.contains(id) ? .on:.off}
        if menu.editing{return true}
        if id=="undo"{return menu.undo};if id=="redo"{return menu.redo}
        return !Self.selectionCommands.contains(id)||menu.selection
    }
    /** Single-key shortcuts belong to the renderer, which must keep seeing them in text fields, so they are shown but never bound. */
    func shortcutLabel(_ item:NSMenuItem,_ shortcut:String){
        let style=NSMutableParagraphStyle();style.tabStops=[NSTextTab(textAlignment:.right,location:310)]
        let text=NSMutableAttributedString(string:item.title+"\t"+shortcut,attributes:[.font:NSFont.menuFont(ofSize:0),.paragraphStyle:style])
        text.addAttribute(.foregroundColor,value:NSColor.secondaryLabelColor,range:NSRange(location:item.title.utf16.count+1,length:shortcut.utf16.count))
        item.attributedTitle=text
    }
    func addRevertMenu(_ menu:NSMenu){let revert=NSMenu(title:"Revert To");revert.delegate=self;versionMenu=revert;let item=NSMenuItem(title:"Revert To",action:nil,keyEquivalent:"");item.submenu=revert;menu.addItem(item)}
    func versionItems(_ menu:NSMenu){
        menu.removeAllItems();let target=NSMenuItem(title:"Last Saved File",action:#selector(menuAction(_:)),keyEquivalent:"");target.target=self;target.representedObject="native-revert";menu.addItem(target)
        let versions=active?.systemVersions() ?? [];menu.addItem(.separator())
        for version in versions.prefix(20){let item=NSMenuItem(title:version.modificationDate.map{DateFormatter.localizedString(from:$0,dateStyle:.medium,timeStyle:.short)} ?? "Earlier version",action:#selector(restoreVersion(_:)),keyEquivalent:"");item.target=self;item.representedObject=version;menu.addItem(item)}
        if versions.isEmpty{let empty=NSMenuItem(title:"No Earlier macOS Versions",action:nil,keyEquivalent:"");empty.isEnabled=false;menu.addItem(empty)}
    }
    @objc func restoreVersion(_ sender:NSMenuItem){if let version=sender.representedObject as? NSFileVersion{active?.restoreSystemVersion(version)}}
    func captureTabGroups(){for document in documents{let group=document.window.tabbedWindows ?? [];document.session.tabGroup=group.count>1 ? documents.first{$0.window===group[0]}?.session.sessionId:nil}}
    /** Window sessions survive relaunch; their tabs regroup once every window exists. */
    func arrangeRestoredTabs(){for (_,members) in Dictionary(grouping:documents.filter{$0.session.tabGroup != nil},by:{$0.session.tabGroup!}) where members.count>1{for member in members.dropFirst(){members[0].window.addTabbedWindow(member.window,ordered:.above)}}}
    func observeSystemFonts(){
        // Core Text posts on the local center when any process, Font Book or a font manager changes the registered set.
        CFNotificationCenterAddObserver(CFNotificationCenterGetLocalCenter(),Unmanaged.passUnretained(self).toOpaque(),{_,observer,_,_,_ in guard let observer else{return};let studio=Unmanaged<Studio>.fromOpaque(observer).takeUnretainedValue();DispatchQueue.main.async{studio.systemFontsChanged()}},kCTFontManagerRegisteredFontsChangedNotification,nil,.deliverImmediately)
        NotificationCenter.default.addObserver(forName:NSFont.fontSetChangedNotification,object:nil,queue:.main){[weak self] _ in self?.systemFontsChanged()}
    }
    /** Names and CSS-reachable traits of one installed family, the same kind of data as the family list. Never a font file or path.
     * Width variants share a family's weights, and CSS weight alone cannot reach them, so they are left out. */
    static func installedFaces(_ family:String)->[[String:Any]] {
        let scale:[(CGFloat,Int)]=[(-0.8,100),(-0.6,200),(-0.4,300),(0,400),(0.23,500),(0.3,600),(0.4,700),(0.56,800),(0.62,900)]
        var faces:[[String:Any]]=[],seen=Set<String>()
        for member in NSFontManager.shared.availableMembers(ofFontFamily:family) ?? [] {
            guard member.count>=2,let postscript=member[0] as? String,let label=member[1] as? String,faces.count<64 else{continue}
            let font=CTFontCreateWithName(postscript as CFString,12,nil)
            guard let traits=CTFontCopyTraits(font) as? [CFString:Any],let weight=traits[kCTFontWeightTrait] as? CGFloat else{continue}
            let slant=traits[kCTFontSlantTrait] as? CGFloat ?? 0,width=traits[kCTFontWidthTrait] as? CGFloat ?? 0,symbolic=CTFontGetSymbolicTraits(font)
            guard abs(width)<0.05 else{continue}
            let css=scale.min{abs($0.0-weight)<abs($1.0-weight)}!.1,italic=symbolic.contains(.traitItalic)||abs(slant)>0.02
            if seen.insert("\(css):\(italic)").inserted{faces.append(["label":label,"postscript":postscript,"weight":css,"italic":italic])}
        }
        return faces
    }
    /** Layout and naming tables of one installed face, so the inspector can say what a font declares. Never outlines, a whole file or a path, and the renderer keeps them in memory only.
     * Size-limited per table; AAT and kern tables are named, not sent, because they mean the absence of GSUB or GPOS proves nothing. */
    static func installedLayoutTables(_ family:String,italic:Bool)->[String:Any] {
        let designs:[String:NSFontDescriptor.SystemDesign]=["system-ui":.default,"-apple-system":.default,"ui-sans-serif":.default,"ui-serif":.serif,"ui-monospace":.monospaced,"ui-rounded":.rounded]
        let font:CTFont
        if let design=designs[family],let descriptor=NSFont.systemFont(ofSize:12).fontDescriptor.withDesign(design),let system=NSFont(descriptor:descriptor,size:12){font=system as CTFont}
        else{
            let faces=installedFaces(family)
            let same=faces.filter{$0["italic"] as? Bool==italic}
            guard let face=(same.first{$0["weight"] as? Int==400} ?? same.first ?? faces.first),let postscript=face["postscript"] as? String else{return [:]}
            font=CTFontCreateWithName(postscript as CFString,12,nil)
        }
        var out:[String:Any]=[:]
        for (name,tag) in [("GSUB",kCTFontTableGSUB),("GPOS",kCTFontTableGPOS),("name",kCTFontTableName),("cmap",kCTFontTableCmap),("fvar",kCTFontTableFvar)] {
            if let table=CTFontCopyTable(font,CTFontTableTag(tag),[]) as Data?,!table.isEmpty,table.count<=4_000_000{out[name]=table.base64EncodedString()}
        }
        let legacy=[("morx",kCTFontTableMorx),("kern",kCTFontTableKern)].filter{CTFontCopyTable(font,CTFontTableTag($0.1),[]) != nil}.map{$0.0}
        if !legacy.isEmpty{out["legacy"]=legacy}
        return out
    }
    func systemFontsChanged(){fontRefresh?.cancel();let work=DispatchWorkItem{[weak self] in guard let self else{return};for document in self.documents where document.ready{document.web.callAsyncJavaScript("return await window.__studioNative('fonts-changed');",arguments:[:],in:nil,in:.page,completionHandler:nil)}};fontRefresh=work;DispatchQueue.main.asyncAfter(deadline:.now()+0.3,execute:work)}
}

extension DocumentWindow {
    /** Bytes stay in memory until a system service needs them; only this shell ever knows a path. */
    func deliver(_ kind:String,_ completion:@escaping(String,String,Data)->Void){
        guard ready,!delivering else{return};delivering=true
        web.callAsyncJavaScript("return await window.__studioNative('delivery',kind);",arguments:["kind":kind],in:nil,in:.page){[weak self] result in
            guard let self else{return};self.delivering=false
            switch result{
            case .failure(let error):self.studio.showError(kind=="print" ? "Unable to prepare the document for printing":"Unable to prepare the document for sharing",error,window:self.window)
            case .success(let value):
                guard let body=value as? [String:Any],let name=body["name"] as? String,let mime=body["mime"] as? String,["application/pdf","image/png"].contains(mime),let encoded=body["data"] as? String,encoded.utf8.count<150_000_000,let data=Data(base64Encoded:encoded) else{self.studio.showError("Unable to prepare the document",NSError(domain:"The editor returned an invalid document.",code:1),window:self.window);return}
                completion(name,mime,data)
            }
        }
    }
    /** The shell starts the system sampler; the page only ever receives the one color a person clicked. */
    func sampleScreenColor(){
        guard ready,colorSampler==nil else{return}
        let sampler=NSColorSampler();colorSampler=sampler
        if studio.smoke,let scripted=studio.smokeScreenColor{finishSample(scripted);return}
        sampler.show{[weak self] color in self?.finishSample(color)}
    }
    func finishSample(_ color:NSColor?){
        colorSampler=nil
        func hex(_ space:NSColorSpace)->String? {color?.usingColorSpace(space).map{c in "#"+[c.redComponent,c.greenComponent,c.blueComponent].map{String(format:"%02x",Int((min(1,max(0,$0))*255).rounded()))}.joined()}}
        guard let srgb=hex(.sRGB),let p3=hex(.displayP3),ready else{return}
        web.callAsyncJavaScript("return await window.__studioNative('screen-color',value);",arguments:["value":["srgb":srgb,"p3":p3]],in:nil,in:.page){[weak self] result in if case .failure(let error)=result,let self{self.studio.showError("Unable to use the sampled color",error,window:self.window)}}
    }
    /** `destination` skips the panel so the same real print job can be verified without a person. */
    func printDocument(destination:URL?=nil,completion:((Int)->Void)?=nil){
        deliver("print"){_,_,data in
            guard let pdf=PDFDocument(data:data),pdf.pageCount>0,let info=NSPrintInfo.shared.copy() as? NSPrintInfo else{self.studio.showError("Unable to print",NSError(domain:"The print document is invalid.",code:2),window:self.window);return}
            if let destination{info.jobDisposition = .save;info.dictionary()[NSPrintInfo.AttributeKey.jobSavingURL]=destination}
            guard let operation=pdf.printOperation(for:info,scalingMode:.pageScaleToFit,autoRotate:true) else{self.studio.showError("Unable to print",NSError(domain:"macOS could not prepare this print job.",code:3),window:self.window);return}
            operation.jobTitle=self.state?.name ?? "Forma";operation.showsPrintPanel=destination==nil;operation.showsProgressPanel=destination==nil
            if destination==nil{operation.runModal(for:self.window,delegate:nil,didRun:nil,contextInfo:nil)}else{_ = operation.run()}
            completion?(pdf.pageCount)
        }
    }
    func shareDocument(present:Bool=true,completion:((URL)->Void)?=nil){
        deliver("share"){name,mime,data in
            let safe=(name as NSString).lastPathComponent.replacingOccurrences(of:"/",with:"-"),base=(safe as NSString).deletingPathExtension,file=(base.isEmpty ? "Forma":base)+(mime=="image/png" ? ".png":".pdf")
            if let previous=self.shareDirectory{try? FileManager.default.removeItem(at:previous)}
            let directory=FileManager.default.temporaryDirectory.appendingPathComponent("forma-share-"+UUID().uuidString,isDirectory:true),url=directory.appendingPathComponent(file)
            do{try FileManager.default.createDirectory(at:directory,withIntermediateDirectories:true,attributes:[.posixPermissions:0o700]);try data.write(to:url,options:[.atomic]);try FileManager.default.setAttributes([.posixPermissions:0o600],ofItemAtPath:url.path)}catch{self.studio.showError("Unable to share",error,window:self.window);return}
            self.shareDirectory=directory;completion?(url)
            guard present else{return}
            let picker=NSSharingServicePicker(items:[url]);picker.delegate=self;self.sharePicker=picker
            picker.show(relativeTo:NSRect(x:self.web.bounds.maxX-160,y:self.web.bounds.maxY-40,width:1,height:1),of:self.web,preferredEdge:.minY)
        }
    }
    func sharingServicePicker(_ picker:NSSharingServicePicker,sharingServicesForItems items:[Any],proposedSharingServices proposed:[NSSharingService])->[NSSharingService] {studio.smokeShareServices=proposed.count;return proposed}
    func sharingServicePicker(_ picker:NSSharingServicePicker,didChoose service:NSSharingService?){if service==nil{sharePicker=nil}}
    /** Keeps what Save is about to replace, so every version is a state the file really held. */
    func recordSystemVersion(_ url:URL){guard !studio.smoke||CommandLine.arguments.contains("--integration-smoke-test"),FileManager.default.fileExists(atPath:url.path) else{return};_ = try? NSFileVersion.addOfItem(at:url,withContentsOf:url,options:[])}
    func systemVersions()->[NSFileVersion] {session.file.flatMap{NSFileVersion.otherVersionsOfItem(at:$0)}?.sorted{($0.modificationDate ?? .distantPast)>($1.modificationDate ?? .distantPast)} ?? []}
    func restoreSystemVersion(_ version:NSFileVersion){do{try restoreBytes(ProjectFileSafety.readBounded(version.url))}catch{studio.showError("Unable to restore this version",error,window:window)}}
    func revertToSaved(){guard let file=session.file else{return};do{let data=try ProjectFileSafety.readBounded(file),fingerprint=ProjectFileSafety.fingerprint(data);try restoreBytes(data,request:"revert"){self.session.fingerprint=fingerprint}}catch{studio.showError("Unable to revert",error,window:window)}}
    func restoreBytes(_ data:Data,request:String="restore-version",completion:(()->Void)?=nil)throws {
        let(raw,id)=try studio.project(data);guard id==state?.id else{throw NSError(domain:"This version belongs to another project.",code:6)}
        web.callAsyncJavaScript("return await window.__studioNative(request,raw);",arguments:["request":request,"raw":raw],in:nil,in:.page){[weak self] result in if case .success=result{completion?()}; if case .failure(let error)=result,let self{self.studio.showError("Unable to restore this version",error,window:self.window)}}
    }
}
