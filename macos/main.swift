import AppKit
import WebKit
import UniformTypeIdentifiers
import Network

final class Studio: NSObject, NSApplicationDelegate, WKScriptMessageHandlerWithReply, WKNavigationDelegate, WKUIDelegate {
    var server: LocalServer?
    var window: NSWindow!
    var web: WKWebView!
    var paths: [String: URL] = [:]
    var pending: URL?
    var editorReady=false
    var resources: URL { Bundle.main.resourceURL!.appendingPathComponent("editor") }
    let bridge = #"""
    (()=>{const api=window.webkit.messageHandlers.studio;let command,documentHandler;
    window.desktop={
      save:(name,data,base64=false,saveAs=false)=>api.postMessage({type:'save',name,data,base64,saveAs}),
      open:()=>api.postMessage({type:'open'}),fonts:()=>api.postMessage({type:'fonts'}),
      onCommand:fn=>{command=fn;return()=>{command=null}},onDocument:fn=>{documentHandler=fn;return()=>{documentHandler=null}}
    };
    window.__studioCommand=id=>command&&command(id);
    window.__studioDocument=raw=>documentHandler&&documentHandler(raw);
    })();
    """#
    func applicationDidFinishLaunching(_ notification: Notification) {
        let config=WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "studio")
        config.userContentController.addUserScript(WKUserScript(source:bridge,injectionTime:.atDocumentStart,forMainFrameOnly:true))
        web=WKWebView(frame:.zero,configuration:config)
        web.navigationDelegate=self; web.uiDelegate=self
        window=NSWindow(contentRect:NSRect(x:0,y:0,width:1480,height:940),styleMask:[.titled,.closable,.miniaturizable,.resizable],backing:.buffered,defer:false)
        window.title="Oanarina UI Tool";window.minSize=NSSize(width:760,height:550)
        window.contentView=web;window.center();window.setFrameAutosaveName("OanarinaStudioWindow")
        makeMenus()
        do {
            server = try LocalServer(root:resources)
            server!.start { [weak self] error in
                DispatchQueue.main.async { guard let self else{return};if let error {let alert=NSAlert();alert.messageText="Unable to start local editor";alert.informativeText=error.localizedDescription;alert.runModal();NSApp.terminate(nil);return}
                    self.web.load(URLRequest(url:URL(string:"http://127.0.0.1:51981/index.html")!))
                }
            }
        } catch {NSApp.terminate(nil)}
        if !CommandLine.arguments.contains("--smoke-test") {window.makeKeyAndOrderFront(nil)}
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender:NSApplication)->Bool { false }
    func applicationShouldHandleReopen(_ sender:NSApplication,hasVisibleWindows flag:Bool)->Bool {window.makeKeyAndOrderFront(nil);return true}
    func application(_ sender:NSApplication,openFiles filenames:[String]) {
        if let path=filenames.first { let url=URL(fileURLWithPath:path);if web==nil{pending=url}else{openURL(url)} }
        sender.reply(toOpenOrPrint:.success)
    }
    func json(_ value:Any)->String {(try? String(data:JSONSerialization.data(withJSONObject:value,options:[.fragmentsAllowed]),encoding:.utf8)) ?? "null"}
    func command(_ id:String){
        let native:[String:String] = ["copy":"copy:","cut":"cut:","paste":"paste:","undo":"undo:","redo":"redo:","select-all":"selectAll:"]
        web.evaluateJavaScript("!!document.activeElement?.closest('input,textarea,[contenteditable=true]')") { [weak self] result,_ in
            guard let self else{return}
            if let edit=native[id],result as? Bool == true {NSApp.sendAction(Selector(edit),to:nil,from:nil)}
            else{self.web.evaluateJavaScript("window.__studioCommand(\(self.json(id)))",completionHandler:nil)}
        }
    }
    @objc func menuAction(_ sender:NSMenuItem){if let id=sender.representedObject as? String{command(id)}}
    func add(_ menu:NSMenu,_ title:String,_ id:String,_ key:String="",_ modifiers:NSEvent.ModifierFlags = [.command]) {
        let item=NSMenuItem(title:title,action:#selector(menuAction(_:)),keyEquivalent:key);item.target=self;item.representedObject=id;item.keyEquivalentModifierMask=modifiers;menu.addItem(item)
    }
    func accelerator(_ raw:String)->(String,NSEvent.ModifierFlags){
        var modifiers=NSEvent.ModifierFlags();if raw.contains("⌘"){modifiers.insert(.command)};if raw.contains("⌃"){modifiers.insert(.control)};if raw.contains("⌥"){modifiers.insert(.option)};if raw.contains("⇧"){modifiers.insert(.shift)}
        guard modifiers.contains(.command)||modifiers.contains(.control) else{return ("",[])}
        var key=raw;for glyph in ["⌘","⌃","⌥","⇧"]{key=key.replacingOccurrences(of:glyph,with:"")};key=key.lowercased();if key=="↵"{key="\r"};if key=="+"{key="="};if key=="−"||key=="–"{key="-"};return(key,modifiers)
    }
    func makeMenus(){
        let bar=NSMenu();NSApp.mainMenu=bar
        func section(_ title:String)->NSMenu{let item=NSMenuItem(title:title,action:nil,keyEquivalent:"");bar.addItem(item);let menu=NSMenu(title:title);item.submenu=menu;return menu}
        let application=section("Oanarina UI Tool");add(application,"About Oanarina UI Tool","about");application.addItem(.separator());add(application,"Toggle Light / Dark Appearance","theme");application.addItem(.separator());application.addItem(NSMenuItem(title:"Hide Oanarina UI Tool",action:#selector(NSApplication.hide(_:)),keyEquivalent:"h"));application.addItem(NSMenuItem(title:"Quit Oanarina UI Tool",action:#selector(NSApplication.terminate(_:)),keyEquivalent:"q"))
        let data=try? Data(contentsOf:resources.appendingPathComponent("commands.json"));let commands=(data.flatMap{try? JSONSerialization.jsonObject(with:$0)}) as? [[String]] ?? []
        for group in ["File","Edit","View","Object","Text","Arrange","Vector","Page","Prototype","Resources","Help"] {
            let menu=section(group);if group=="Help"{NSApp.helpMenu=menu}
            for row in commands where row.count==4&&row[2]==group {let (key,flags)=accelerator(row[3]);add(menu,row[1],row[0],key,flags)}
        }
        let win=section("Window");NSApp.windowsMenu=win;win.addItem(NSMenuItem(title:"Minimize",action:#selector(NSWindow.performMiniaturize(_:)),keyEquivalent:"m"));win.addItem(NSMenuItem(title:"Zoom",action:#selector(NSWindow.performZoom(_:)),keyEquivalent:""));let close=NSMenuItem(title:"Close",action:#selector(NSWindow.performClose(_:)),keyEquivalent:"w");win.addItem(close);let full=NSMenuItem(title:"Enter Full Screen",action:#selector(NSWindow.toggleFullScreen(_:)),keyEquivalent:"f");full.keyEquivalentModifierMask=[.control,.command];win.addItem(full);if let help=bar.items.first(where:{$0.title=="Help"}){bar.removeItem(help);bar.addItem(help)}
    }
    func read(_ url:URL)throws->String {
        let info=try url.resourceValues(forKeys:[.fileSizeKey]);guard (info.fileSize ?? 0)<50_000_000 else{throw NSError(domain:"Project exceeds 50 MB",code:1)}
        let data=try Data(contentsOf:url);guard let text=String(data:data,encoding:.utf8),let doc=try JSONSerialization.jsonObject(with:data) as? [String:Any],doc["format"] as? String == "oanarina-ui",[1,2].contains(doc["version"] as? Int ?? 0),let id=doc["id"] as? String else{throw NSError(domain:"Invalid Oanarina project",code:2)}
        paths[id]=url;return text
    }
    func openURL(_ url:URL){if !editorReady{pending=url;return};do{let text=try read(url);web.evaluateJavaScript("window.__studioDocument(\(json(text)))",completionHandler:nil)}catch{let alert=NSAlert();alert.messageText="Unable to open project";alert.informativeText=error.localizedDescription;alert.runModal()}}
    func userContentController(_ userContentController:WKUserContentController,didReceive message:WKScriptMessage,replyHandler:@escaping(Any?,String?)->Void){
        guard message.frameInfo.isMainFrame,message.frameInfo.securityOrigin.host=="127.0.0.1",message.frameInfo.securityOrigin.port==51981,let body=message.body as? [String:Any],let type=body["type"] as? String else{replyHandler(nil,"Invalid request");return}
        if type=="fonts"{replyHandler(NSFontManager.shared.availableFontFamilies.sorted(),nil);return}
        if type=="open"{let panel=NSOpenPanel();panel.allowedContentTypes=[UTType(filenameExtension:"oui") ?? .json,.json];panel.allowsMultipleSelection=false;panel.canChooseDirectories=false;panel.beginSheetModal(for:window){response in guard response == .OK,let url=panel.url else{replyHandler(NSNull(),nil);return};do{replyHandler(try self.read(url),nil)}catch{replyHandler(nil,error.localizedDescription)}};return}
        guard type=="save",let raw=body["data"] as? String,raw.utf8.count<150_000_000,let name=body["name"] as? String else{replyHandler(nil,"Invalid export");return}
        let safe=(name as NSString).lastPathComponent,ext=(safe as NSString).pathExtension.lowercased();guard ["oui","png","jpg","svg","json","gif","webm","mp4"].contains(ext) else{replyHandler(nil,"Unsupported format");return}
        let bytes:Data? = body["base64"] as? Bool == true ? Data(base64Encoded:raw) : raw.data(using:.utf8)
        guard let bytes else{replyHandler(nil,"Invalid file data");return}
        var projectId:String?
        if ext=="oui"{guard let doc=(try? JSONSerialization.jsonObject(with:bytes)) as? [String:Any],doc["format"] as? String == "oanarina-ui",let id=doc["id"] as? String else{replyHandler(nil,"Invalid project");return};projectId=id}
        func write(_ url:URL){do{try bytes.write(to:url,options:.atomic);if let id=projectId{self.paths[id]=url};replyHandler(true,nil)}catch{replyHandler(nil,error.localizedDescription)}}
        if let id=projectId,body["saveAs"] as? Bool != true,let url=paths[id]{write(url);return}
        let panel=NSSavePanel();panel.nameFieldStringValue=safe;panel.allowedContentTypes=[UTType(filenameExtension:ext) ?? .data];panel.beginSheetModal(for:window){response in guard response == .OK,let url=panel.url else{replyHandler(false,nil);return};write(url)}
    }
    func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!){editorReady=true;if let file=pending{pending=nil;openURL(file)}
        if CommandLine.arguments.contains("--smoke-test") {DispatchQueue.main.asyncAfter(deadline:.now()+4){
            self.web.callAsyncJavaScript("const features=await fetch('./features.json').then(r=>r.json());const fonts=await fetch('./font-catalog.json').then(r=>r.json());const installed=await window.desktop.fonts();if(features.length<1000||fonts.families.length<1900||installed.length===0||document.querySelectorAll('button').length<50)throw Error('Native smoke check failed');const videoMp4=typeof MediaRecorder!=='undefined'&&MediaRecorder.isTypeSupported('video/mp4');const videoWebM=typeof MediaRecorder!=='undefined'&&MediaRecorder.isTypeSupported('video/webm');return JSON.stringify({videoMp4,videoWebM,canvasCapture:typeof HTMLCanvasElement.prototype.captureStream==='function',title:document.title,buttons:document.querySelectorAll('button').length,bridge:!!window.desktop,features:features.length,googleFonts:fonts.families.length,installedFonts:installed.length});",arguments:[:],in:nil,in:.page) { result in
                switch result {case .success(let value):print(value);fflush(stdout);NSApp.terminate(nil);case .failure(let error):fputs(error.localizedDescription+"\n",stderr);exit(1)}
            }
        }}
    }
    func webView(_ webView:WKWebView,decidePolicyFor action:WKNavigationAction,decisionHandler:@escaping(WKNavigationActionPolicy)->Void){guard let url=action.request.url else{decisionHandler(.cancel);return};if url.host=="127.0.0.1",url.port==51981 {
            if url.path=="/figma-bridge.zip" {decisionHandler(.cancel);let panel=NSSavePanel();panel.nameFieldStringValue="figma-bridge.zip";panel.beginSheetModal(for:window){response in if response == .OK,let destination=panel.url {do{let data=try Data(contentsOf:self.resources.appendingPathComponent("figma-bridge.zip"));try data.write(to:destination,options:.atomic)}catch{}}};return}
            if action.navigationType == .other {decisionHandler(.allow)}else{decisionHandler(.cancel)}
        }else{decisionHandler(.cancel)}}
    func webView(_ webView:WKWebView,runJavaScriptAlertPanelWithMessage message:String,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping()->Void){let alert=NSAlert();alert.messageText=message;alert.beginSheetModal(for:window){_ in completionHandler()}}
    func webView(_ webView:WKWebView,createWebViewWith configuration:WKWebViewConfiguration,for action:WKNavigationAction,windowFeatures:WKWindowFeatures)->WKWebView?{if let url=action.request.url,["https","http"].contains(url.scheme?.lowercased() ?? ""){NSWorkspace.shared.open(url)};return nil}
    func webView(_ webView:WKWebView,decidePolicyFor response:WKNavigationResponse,decisionHandler:@escaping(WKNavigationResponsePolicy)->Void){decisionHandler(.allow)}
}

final class LocalServer {
    let root: URL
    let listener: NWListener
    let queue=DispatchQueue(label:"com.oanarinaldi.ui-resources")
    init(root:URL)throws {
        self.root=root.standardizedFileURL
        let parameters=NWParameters.tcp
        parameters.requiredLocalEndpoint = .hostPort(host:"127.0.0.1",port:51981)
        listener=try NWListener(using:parameters)
    }
    func start(_ ready:@escaping(Error?)->Void) {
        var finished=false
        listener.stateUpdateHandler={state in
            if case .ready=state,!finished{finished=true;ready(nil)}
            if case .failed(let error)=state,!finished{finished=true;ready(error)}
        }
        listener.newConnectionHandler={ [weak self] connection in
            guard let self else{connection.cancel();return}
            connection.start(queue:self.queue)
            self.receive(connection,Data())
        }
        listener.start(queue:queue)
    }
    func receive(_ connection:NWConnection,_ previous:Data) {
        connection.receive(minimumIncompleteLength:1,maximumLength:8192){data,_,complete,error in
            guard error==nil,let data else{connection.cancel();return}
            var buffer=previous;buffer.append(data)
            if buffer.count>16384{connection.cancel();return}
            guard let request=String(data:buffer,encoding:.utf8),request.contains("\r\n\r\n") else{if complete{connection.cancel()}else{self.receive(connection,buffer)};return}
            let parts=request.components(separatedBy:"\r\n")[0].split(separator:" ")
            guard parts.count==3,["GET","HEAD"].contains(String(parts[0])) else{connection.cancel();return}
            let resource=String(parts[1]).components(separatedBy:"?")[0].removingPercentEncoding ?? ""
            guard !resource.contains("\0"),!resource.contains("\\") else{connection.cancel();return}
            let relative=resource=="/" ? "index.html":String(resource.dropFirst())
            let file=self.root.appendingPathComponent(relative).standardizedFileURL
            guard file.path.hasPrefix(self.root.path+"/") else{connection.cancel();return}
            let bytes=(try? Data(contentsOf:file))
            let mime=["html":"text/html; charset=utf-8","js":"text/javascript; charset=utf-8","css":"text/css; charset=utf-8","json":"application/json","svg":"image/svg+xml","png":"image/png","ttf":"font/ttf","woff2":"font/woff2","zip":"application/zip"][file.pathExtension] ?? "application/octet-stream"
            let body=bytes ?? Data("Not found".utf8)
            let header="HTTP/1.1 \(bytes==nil ? "404 Not Found":"200 OK")\r\nContent-Type: \(mime)\r\nContent-Length: \(body.count)\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n"
            var response=Data(header.utf8);if parts[0] != "HEAD" {response.append(body)}
            connection.send(content:response,completion:.contentProcessed{_ in connection.cancel()})
        }
    }
}

let app=NSApplication.shared
let delegate=Studio()
app.delegate=delegate
app.setActivationPolicy(.regular)
app.run()
