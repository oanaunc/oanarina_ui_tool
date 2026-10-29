import AppKit
import WebKit
import UniformTypeIdentifiers
import Network

struct DocumentState {
    let id:String; let name:String; let revision:Int; let dirty:Bool
    init?(_ body:[String:Any]) {guard let id=body["id"] as? String,!id.isEmpty,id.utf8.count<=512,let name=body["name"] as? String,name.utf8.count<=4096,let revision=body["revision"] as? Int,revision>=0,let dirty=body["dirty"] as? Bool else{return nil};self.id=id;self.name=name;self.revision=revision;self.dirty=dirty}
}
struct WindowSession {
    var sessionId:String; var documentId:String?; var file:URL?; var dirty:Bool; var frame:String?;var reopenFromFile:Bool;var fingerprint:String?
    var record:[String:Any] {var record:[String:Any]=["sessionId":sessionId,"dirty":dirty,"reopenFromFile":reopenFromFile];record["documentId"]=documentId;record["file"]=file?.path;record["frame"]=frame;record["fingerprint"]=fingerprint;return record}
    init(sessionId:String=UUID().uuidString,documentId:String?=nil,file:URL?=nil,dirty:Bool=true,frame:String?=nil,reopenFromFile:Bool=false,fingerprint:String?=nil){self.sessionId=sessionId;self.documentId=documentId;self.file=file;self.dirty=dirty;self.frame=frame;self.reopenFromFile=reopenFromFile;self.fingerprint=fingerprint}
    init?(_ record:[String:Any]) {guard let id=record["sessionId"] as? String,UUID(uuidString:id) != nil else{return nil};self.init(sessionId:id,documentId:record["documentId"] as? String,file:(record["file"] as? String).map{URL(fileURLWithPath:$0)},dirty:record["dirty"] as? Bool ?? true,frame:record["frame"] as? String,reopenFromFile:record["reopenFromFile"] as? Bool ?? false,fingerprint:record["fingerprint"] as? String)}
}
final class Studio:NSObject,NSApplicationDelegate,NSMenuDelegate {
    let smokeDataStore=WKWebsiteDataStore.nonPersistent();var smokeStage=0;var smokeAlertResponse:Int?;var smokeConflictResponses:[Int]=[];var smokeBundleCompletion:((String,NSApplication.ModalResponse)->Void)?;var smokeReadyOverride:((DocumentWindow)->Void)?;var smokeCancelSavePanels=false;var smokeFinishing=false;var smokeQuitResult:((Bool)->Void)?;var smokeChecks:[String]=[];var smokeDirectory:URL?;var server:LocalServer?; var documents:[DocumentWindow]=[];var pendingFiles:[URL]=[];var started=false;var restoringSessions=false;var quitting=false;var quitSessions:[WindowSession]=[];var lastClosed:WindowSession?;var recentMenu:NSMenu?
    let clipboardSmokeBoard=NSPasteboard.withUniqueName();var nodePasteboard:NSPasteboard {smoke ? clipboardSmokeBoard:.general}
    var resources:URL {Bundle.main.resourceURL!.appendingPathComponent("editor")}
    var smoke:Bool {CommandLine.arguments.contains("--smoke-test")||CommandLine.arguments.contains("--lifecycle-smoke-test")||CommandLine.arguments.contains("--clipboard-smoke-test")}
    var active:DocumentWindow? {documents.first(where:{$0.window===NSApp.keyWindow}) ?? documents.first(where:{$0.window===NSApp.mainWindow}) ?? documents.last}
    func json(_ value:Any)->String {(try? String(data:JSONSerialization.data(withJSONObject:value,options:[.fragmentsAllowed]),encoding:.utf8)) ?? "null"}
    func applicationDidFinishLaunching(_ notification:Notification){
        makeMenus()
        do{server=try LocalServer(root:resources);server!.start{[weak self] error in DispatchQueue.main.async{
            guard let self else{return};if let error{self.showError("Unable to start local editor",error);exit(1)};self.started=true;self.restoringSessions=true
            let priorSessions=self.smoke ? nil:UserDefaults.standard.array(forKey:"OanarinaWindowSessions") as? [[String:Any]];if !self.smoke,let records=priorSessions{for record in records{if let session=WindowSession(record){self.restore(session)}}}
            let files=self.pendingFiles;self.pendingFiles=[];for file in files{self.openURL(file)}
            if self.documents.isEmpty{self.createWindow(bootstrap:self.smoke || priorSessions != nil ? ["kind":"new","command":"new"]:["kind":"recovery","restoreActive":true])};self.restoringSessions=false;self.persistSessions()
        }}}catch{showError("Unable to start local editor",error);exit(1)}
    }
    func restore(_ session:WindowSession){
        if session.reopenFromFile || !session.dirty,let file=session.file{do{let(raw,id)=try readProject(file);var saved=session;saved.documentId=id;saved.dirty=false;saved.reopenFromFile=false;createWindow(session:saved,bootstrap:["kind":"file","raw":raw,"explicitOpen":false])}catch{let alert=NSAlert();alert.messageText="The saved project cannot be reopened.";alert.informativeText=error.localizedDescription+"\nYou can try its last local recovery copy, which may include previously discarded changes.";alert.addButton(withTitle:"Open Local Recovery");alert.addButton(withTitle:"Skip");if alert.runModal() == .alertFirstButtonReturn{var recovery=session;recovery.file=nil;recovery.dirty=true;recovery.reopenFromFile=false;createWindow(session:recovery,bootstrap:["kind":"recovery","documentId":recovery.documentId ?? "","dirty":true])}}}
        else{createWindow(session:session,bootstrap:["kind":"recovery","documentId":session.documentId ?? "","dirty":session.dirty])}
    }
    func sessionForQuit(_ document:DocumentWindow)->WindowSession? {var session=document.session;if document.lastCloseDiscarded{guard session.file != nil else{return nil};session.reopenFromFile=true;session.dirty=false};return session}

    @discardableResult func createWindow(session:WindowSession=WindowSession(),bootstrap:[String:Any])->DocumentWindow {let document=DocumentWindow(studio:self,session:session,bootstrap:bootstrap);documents.append(document);document.load();if !smoke{document.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)};persistSessions();return document}
    func persistSessions(){guard !smoke,!restoringSessions else{return};UserDefaults.standard.set((quitting ? quitSessions:[]).map{$0.record}+documents.map{$0.session.record},forKey:"OanarinaWindowSessions")}
    func closed(_ document:DocumentWindow){lastClosed=document.session;documents.removeAll{$0===document};persistSessions()}
    func applicationShouldTerminateAfterLastWindowClosed(_ sender:NSApplication)->Bool {false}
    func applicationShouldHandleReopen(_ sender:NSApplication,hasVisibleWindows flag:Bool)->Bool {if !flag{if let document=active{document.window.makeKeyAndOrderFront(nil)}else{createWindow(bootstrap:["kind":"new","command":"new"])}};return true}
    func application(_ sender:NSApplication,openFiles filenames:[String]){if started{for file in filenames{openURL(URL(fileURLWithPath:file))}}else{pendingFiles.append(contentsOf:filenames.map{URL(fileURLWithPath:$0)})};sender.reply(toOpenOrPrint:.success)}
    func applicationShouldTerminate(_ sender:NSApplication)->NSApplication.TerminateReply {if smoke && (!CommandLine.arguments.contains("--lifecycle-smoke-test") || smokeFinishing){return .terminateNow};if quitting{return .terminateLater};quitting=true;quitSessions=[];let closingDocuments=Array(documents);let turn=Timer(timeInterval:0,repeats:false){_ in self.closeForQuit(closingDocuments)};RunLoop.main.add(turn,forMode:.common);RunLoop.main.add(turn,forMode:.modalPanel);return .terminateLater}
    func closeForQuit(_ remaining:[DocumentWindow]){guard let first=remaining.first else{quitting=false;smokeQuitResult?(true);NSApp.reply(toApplicationShouldTerminate:true);return};guard documents.contains(where:{$0===first}) else{closeForQuit(Array(remaining.dropFirst()));return};first.requestClose{allowed in if allowed{if let session=self.sessionForQuit(first){self.quitSessions.append(session)};first.closeApproved();self.closeForQuit(Array(remaining.dropFirst()))}else{self.quitting=false;self.quitSessions=[];self.persistSessions();NSApp.reply(toApplicationShouldTerminate:false);self.smokeQuitResult?(false)}}}
    func applicationWillTerminate(_ notification:Notification){if CommandLine.arguments.contains("--lifecycle-smoke-test"){finishLifecycleSmoke()}}
    func showError(_ title:String,_ error:Error,window:NSWindow?=nil){let alert=NSAlert();alert.messageText=title;alert.informativeText=error.localizedDescription;if let window{alert.beginSheetModal(for:window,completionHandler:nil)}else{alert.runModal()}}
    func readProject(_ url:URL)throws->(String,String){return try project(ProjectFileSafety.readBounded(url))}
    func project(_ data:Data)throws->(String,String){guard data.count<50_000_000,let text=String(data:data,encoding:.utf8),let doc=try JSONSerialization.jsonObject(with:data) as? [String:Any],doc["format"] as? String=="oanarina-ui",[1,2].contains(doc["version"] as? Int ?? 0),let id=doc["id"] as? String,!id.isEmpty,id.utf8.count<=512 else{throw NSError(domain:"Invalid Oanarina project",code:2)};return(text,id)}
    @discardableResult func openURL(_ url:URL)->Bool {let canonical=url.standardizedFileURL.resolvingSymlinksInPath();if let existing=documents.first(where:{$0.session.file?.standardizedFileURL.resolvingSymlinksInPath()==canonical}){existing.window.makeKeyAndOrderFront(nil);return true};do{let(raw,id)=try readProject(canonical);if let existing=documents.first(where:{$0.state?.id==id||$0.session.documentId==id}){existing.window.makeKeyAndOrderFront(nil);return true};createWindow(session:WindowSession(documentId:id,file:canonical,dirty:false),bootstrap:["kind":"file","raw":raw]);return true}catch{showError("Unable to open project",error,window:active?.window);return false}}
    func openRaw(_ raw:String)throws->Bool {let(text,id)=try project(Data(raw.utf8));if let existing=documents.first(where:{$0.state?.id==id||$0.session.documentId==id}){existing.window.makeKeyAndOrderFront(nil);return true};createWindow(session:WindowSession(documentId:id,dirty:true),bootstrap:["kind":"recovery","raw":text,"dirty":true]);return true}
    func chooseOpen(_ owner:DocumentWindow?,completion:@escaping()->Void){let panel=NSOpenPanel();panel.allowedContentTypes=[UTType(filenameExtension:"oui") ?? .json,.json];panel.allowsMultipleSelection=true;panel.canChooseDirectories=false;let finish:(NSApplication.ModalResponse)->Void={response in if response == .OK{for url in panel.urls{self.openURL(url)}};completion()};if let owner{panel.beginSheetModal(for:owner.window,completionHandler:finish)}else{panel.begin(completionHandler:finish)}}
    func command(_ id:String){if ["new","new-whiteboard","new-slides","sample"].contains(id){createWindow(bootstrap:["kind":"new","command":id]);return};if id=="open"{chooseOpen(active){};return};if id=="reopen-closed"{if let session=lastClosed{lastClosed=nil;createWindow(session:session,bootstrap:["kind":"recovery","documentId":session.documentId ?? "","dirty":session.dirty])};return};active?.command(id)}
    @objc func menuAction(_ sender:NSMenuItem){if let id=sender.representedObject as? String{command(id)}}
    @objc func openRecent(_ sender:NSMenuItem){if let url=sender.representedObject as? URL{_ = openURL(url)}}
    @objc func clearRecent(_ sender:Any?){NSDocumentController.shared.clearRecentDocuments(sender)}
    func add(_ menu:NSMenu,_ title:String,_ id:String,_ key:String="",_ flags:NSEvent.ModifierFlags=[.command]){let item=NSMenuItem(title:title,action:#selector(menuAction(_:)),keyEquivalent:key);item.target=self;item.representedObject=id;item.keyEquivalentModifierMask=flags;menu.addItem(item)}
    func accelerator(_ raw:String)->(String,NSEvent.ModifierFlags){var flags=NSEvent.ModifierFlags();if raw.contains("⌘"){flags.insert(.command)};if raw.contains("⌃"){flags.insert(.control)};if raw.contains("⌥"){flags.insert(.option)};if raw.contains("⇧"){flags.insert(.shift)};guard flags.contains(.command)||flags.contains(.control) else{return("",[])};var key=raw;for glyph in ["⌘","⌃","⌥","⇧"]{key=key.replacingOccurrences(of:glyph,with:"")};key=key.lowercased();if key=="↵"{key="\r"};if key=="+"{key="="};if key=="−"||key=="–"{key="-"};return(key,flags)}
    func recentItems(_ menu:NSMenu){menu.removeAllItems();for url in NSDocumentController.shared.recentDocumentURLs.prefix(10){let item=NSMenuItem(title:url.lastPathComponent,action:#selector(openRecent(_:)),keyEquivalent:"");item.target=self;item.representedObject=url;menu.addItem(item)};if menu.items.isEmpty{let empty=NSMenuItem(title:"No Recent Projects",action:nil,keyEquivalent:"");empty.isEnabled=false;menu.addItem(empty)};menu.addItem(.separator());let clear=NSMenuItem(title:"Clear Menu",action:#selector(clearRecent(_:)),keyEquivalent:"");clear.target=self;menu.addItem(clear)}
    func menuNeedsUpdate(_ menu:NSMenu){if menu===recentMenu{recentItems(menu)}}
    func applicationDockMenu(_ sender:NSApplication)->NSMenu? {let menu=NSMenu();add(menu,"New Design Window","new");add(menu,"New Whiteboard Window","new-whiteboard");add(menu,"New Slides Window","new-slides");menu.addItem(.separator());for url in NSDocumentController.shared.recentDocumentURLs.prefix(5){let item=NSMenuItem(title:url.lastPathComponent,action:#selector(openRecent(_:)),keyEquivalent:"");item.target=self;item.representedObject=url;menu.addItem(item)};return menu}
    func makeMenus(){let bar=NSMenu();NSApp.mainMenu=bar;func section(_ title:String)->NSMenu{let item=NSMenuItem(title:title,action:nil,keyEquivalent:"");bar.addItem(item);let menu=NSMenu(title:title);item.submenu=menu;return menu};let application=section("Forma");add(application,"About Forma","about");add(application,"Preferences…","preferences",",");application.addItem(.separator());add(application,"Toggle Light / Dark Appearance","theme");application.addItem(.separator());application.addItem(NSMenuItem(title:"Hide Forma",action:#selector(NSApplication.hide(_:)),keyEquivalent:"h"));application.addItem(NSMenuItem(title:"Quit Forma",action:#selector(NSApplication.terminate(_:)),keyEquivalent:"q"));let data=try? Data(contentsOf:resources.appendingPathComponent("commands.json")),commands=(data.flatMap{try? JSONSerialization.jsonObject(with:$0)}) as? [[String]] ?? [];for group in ["File","Edit","View","Object","Text","Arrange","Vector","Page","Prototype","Resources","Help"]{let menu=section(group);if group=="Help"{NSApp.helpMenu=menu};for row in commands where row.count==4&&row[2]==group&&row[0] != "preferences"{let(key,flags)=accelerator(row[3]);add(menu,row[1],row[0],key,flags)};if group=="File"{let recent=NSMenu(title:"Open Recent");recent.delegate=self;recentMenu=recent;let item=NSMenuItem(title:"Open Recent",action:nil,keyEquivalent:"");item.submenu=recent;menu.addItem(item);add(menu,"Reopen Closed Window","reopen-closed","t",[.shift,.command])}};let win=section("Window");NSApp.windowsMenu=win;win.addItem(NSMenuItem(title:"Minimize",action:#selector(NSWindow.performMiniaturize(_:)),keyEquivalent:"m"));win.addItem(NSMenuItem(title:"Zoom",action:#selector(NSWindow.performZoom(_:)),keyEquivalent:""));win.addItem(NSMenuItem(title:"Close",action:#selector(NSWindow.performClose(_:)),keyEquivalent:"w"));let full=NSMenuItem(title:"Enter Full Screen",action:#selector(NSWindow.toggleFullScreen(_:)),keyEquivalent:"f");full.keyEquivalentModifierMask=[.control,.command];win.addItem(full);if let help=bar.items.first(where:{$0.title=="Help"}){bar.removeItem(help);bar.addItem(help)}}
}

final class DocumentWindow:NSObject,WKScriptMessageHandlerWithReply,WKNavigationDelegate,WKUIDelegate,NSWindowDelegate {
    unowned let studio:Studio;let window:NSWindow;let web:WKWebView;let clipboardNonce=UUID().uuidString;var clipboardGrant:(token:String,kind:String,expires:TimeInterval)?;var session:WindowSession;let bootstrap:[String:Any];var state:DocumentState?;var ready=false;var bootstrapped=false;var closing=false;var approved=false;var lastCloseDiscarded=false;var saveInFlight=false
    static let bridge=#"""
    (()=>{const api=window.webkit.messageHandlers.studio,clipboardNonce='__FORMA_CLIPBOARD_NONCE__',usedEvents=new WeakSet(),eventPhase=Object.getOwnPropertyDescriptor(Event.prototype,'eventPhase').get,apply=Reflect.apply,send=api.postMessage.bind(api);let command,documentHandler,saveHandler,stateHandler,clipboardGrant;
    const clipboardOperation=async(type,representations)=>{const grant=clipboardGrant;clipboardGrant=null;if(!grant||grant.kind!==type||performance.now()>grant.expires)throw Error('Use an explicit Copy, Cut or Paste action to access the Mac clipboard.');await grant.ready;return send({type,nonce:clipboardNonce,token:grant.token,...(representations?{representations}:{})})};window.desktop={
      save:(name,data,base64=false,saveAs=false)=>api.postMessage({type:'save',name,data,base64,saveAs}),open:()=>api.postMessage({type:'open'}),fonts:()=>api.postMessage({type:'fonts'}),
      newWindow:(command='new')=>api.postMessage({type:'new',command}),openDocument:raw=>api.postMessage({type:'openDocument',raw}),openDocumentIds:()=>api.postMessage({type:'openDocumentIds'}),
      beginClipboard:(event,id)=>{if(!event||!event.isTrusted||apply(eventPhase,event,[])===0||usedEvents.has(event)||!['copy','cut','paste'].includes(id))throw Error('Clipboard access requires a trusted command event.');usedEvents.add(event);const token=crypto.randomUUID(),kind=id==='paste'?'clipboardRead':'clipboardWrite';clipboardGrant={token,kind,expires:performance.now()+2000,ready:send({type:'clipboardAuthorize',nonce:clipboardNonce,token,kind})};},
      clipboardWrite:representations=>clipboardOperation('clipboardWrite',representations),clipboardRead:()=>clipboardOperation('clipboardRead'),
      bootstrap:()=>api.postMessage({type:'bootstrap'}),ready:()=>api.postMessage({type:'ready'}),reportDocument:state=>api.postMessage({type:'state',state}),
      onCommand:fn=>{command=fn;return()=>{command=null}},onDocument:fn=>{documentHandler=fn;return()=>{documentHandler=null}},onSaveRequested:fn=>{saveHandler=fn;return()=>{saveHandler=null}},onStateRequested:fn=>{stateHandler=fn;return()=>{stateHandler=null}}
    };window.__studioCommand=(id,token)=>{if(token&&['copy','cut','paste'].includes(id))clipboardGrant={token,kind:id==='paste'?'clipboardRead':'clipboardWrite',expires:performance.now()+2000,ready:Promise.resolve(true)};return command&&command(id)};window.__studioDocument=raw=>documentHandler&&documentHandler(raw);window.__studioSave=()=>saveHandler?saveHandler():Promise.resolve(false);window.__studioState=()=>{if(!stateHandler)throw Error('The editor has not initialized');return stateHandler()};})();
    """#
    init(studio:Studio,session:WindowSession,bootstrap:[String:Any]){self.studio=studio;self.session=session;self.bootstrap=bootstrap;if session.file != nil,bootstrap["kind"] as? String=="file",let raw=bootstrap["raw"] as? String{self.session.fingerprint=ProjectFileSafety.fingerprint(Data(raw.utf8))};let config=WKWebViewConfiguration();config.websiteDataStore = studio.smoke ? studio.smokeDataStore : .default();web=WKWebView(frame:.zero,configuration:config);window=NSWindow(contentRect:NSRect(x:0,y:0,width:1480,height:940),styleMask:[.titled,.closable,.miniaturizable,.resizable],backing:.buffered,defer:false);super.init();config.userContentController.addScriptMessageHandler(self,contentWorld:.page,name:"studio");config.userContentController.addUserScript(WKUserScript(source:Self.bridge.replacingOccurrences(of:"__FORMA_CLIPBOARD_NONCE__",with:clipboardNonce),injectionTime:.atDocumentStart,forMainFrameOnly:true));web.navigationDelegate=self;web.uiDelegate=self;window.delegate=self;window.isReleasedWhenClosed=false;window.title="Forma";window.minSize=NSSize(width:760,height:550);window.contentView=web;if let frame=session.frame{window.setFrame(NSRectFromString(frame),display:false);window.setFrame(window.constrainFrameRect(window.frame,to:nil),display:false)}else if let previous=studio.documents.last{window.setFrame(previous.window.frame.offsetBy(dx:24,dy:-24),display:false)}else{window.center()}}
    func load(){web.load(URLRequest(url:URL(string:"http://127.0.0.1:51981/index.html")!))}
    func apply(_ next:DocumentState){state=next;guard ready else{return};if session.documentId != nil&&session.documentId != next.id{session.file=nil;session.fingerprint=nil};session.documentId=next.id;session.dirty=next.dirty;window.title=next.name.isEmpty ? "Untitled":next.name;window.isDocumentEdited=next.dirty;window.representedURL=session.file;studio.persistSessions()}
    func command(_ id:String){guard ready else{return};let native=["copy":"copy:","cut":"cut:","paste":"paste:","undo":"undo:","redo":"redo:","select-all":"selectAll:"];web.evaluateJavaScript("!!document.activeElement?.closest('input,textarea,[contenteditable=true]')"){[weak self] result,_ in guard let self,self.ready else{return};if let edit=native[id],result as? Bool==true{self.window.makeKeyAndOrderFront(nil);NSApp.sendAction(Selector(edit),to:nil,from:nil)}else{let token=["copy","cut","paste"].contains(id) ? UUID().uuidString:nil;if let token{self.clipboardGrant=(token,id=="paste" ? "clipboardRead":"clipboardWrite",ProcessInfo.processInfo.systemUptime+2)};self.web.evaluateJavaScript("window.__studioCommand(\(self.studio.json(id)),\(self.studio.json(token as Any)))",completionHandler:nil)}}}
    func windowShouldClose(_ sender:NSWindow)->Bool {if approved{return true};requestClose{if $0{self.closeApproved()}};return false}
    func closeApproved(){approved=true;window.close()}
    func windowWillClose(_ notification:Notification){web.stopLoading();web.configuration.userContentController.removeScriptMessageHandler(forName:"studio",contentWorld:.page);web.navigationDelegate=nil;web.uiDelegate=nil;studio.closed(self)}
    func windowDidMove(_ notification:Notification){session.frame=NSStringFromRect(window.frame);studio.persistSessions()}
    func windowDidResize(_ notification:Notification){session.frame=NSStringFromRect(window.frame);studio.persistSessions()}
    func requestClose(_ completion:@escaping(Bool)->Void){guard !closing,!saveInFlight,window.attachedSheet==nil else{completion(false);return};closing=true;lastCloseDiscarded=false;if !ready{if bootstrapped{closeUnavailable(completion)}else{closing=false;completion(true)};return};web.callAsyncJavaScript("return await window.__studioState();",arguments:[:],in:nil,in:.page){[weak self] result in guard let self else{completion(false);return};switch result{case .success(let value):guard let body=value as? [String:Any],let next=DocumentState(body) else{self.closeUnavailable(completion);return};self.apply(next);if !next.dirty{self.closing=false;completion(true)}else{self.confirmClose(completion)};case .failure:self.closeUnavailable(completion)}}}
    func confirmClose(_ completion:@escaping(Bool)->Void){let alert=NSAlert();alert.messageText="Save changes to \(state?.name ?? "this project")?";alert.informativeText="Your changes will be lost from this window if you close without saving. A local recovery copy is kept when storage is available.";alert.addButton(withTitle:"Save");alert.addButton(withTitle:"Cancel");alert.addButton(withTitle:"Don’t Save");alert.buttons[1].keyEquivalent="\u{1b}";alert.beginSheetModal(for:window){response in if response == .alertFirstButtonReturn{self.web.callAsyncJavaScript("return await window.__studioSave();",arguments:[:],in:nil,in:.page){result in switch result{case .success(let value):if value as? Bool==true,self.state?.dirty==false{self.closing=false;completion(true)}else{self.closing=false;completion(false)};case .failure(let error):self.closing=false;self.studio.showError("Project could not be saved",error,window:self.window);completion(false)}}}else{self.closing=false;self.lastCloseDiscarded=response == .alertThirdButtonReturn;completion(self.lastCloseDiscarded)}};if studio.smoke,let index=studio.smokeAlertResponse{studio.smokeAlertResponse=nil;DispatchQueue.main.async{alert.buttons[index].performClick(nil)}}}
    func closeUnavailable(_ completion:@escaping(Bool)->Void){let alert=NSAlert();alert.messageText="The editor cannot confirm that this project is saved.";alert.informativeText="Cancel to keep this window open. Closing may lose changes that have not reached local recovery.";alert.addButton(withTitle:"Cancel");alert.addButton(withTitle:"Close Without Saving");alert.beginSheetModal(for:window){response in self.closing=false;self.lastCloseDiscarded=response == .alertSecondButtonReturn;completion(self.lastCloseDiscarded)}}
    func userContentController(_ controller:WKUserContentController,didReceive message:WKScriptMessage,replyHandler:@escaping(Any?,String?)->Void){guard message.webView===web,message.frameInfo.isMainFrame,message.frameInfo.securityOrigin.protocol=="http",message.frameInfo.securityOrigin.host=="127.0.0.1",message.frameInfo.securityOrigin.port==51981,let body=message.body as? [String:Any],let type=body["type"] as? String else{replyHandler(nil,"Invalid request");return};switch type{
    case "fonts":replyHandler(NSFontManager.shared.availableFontFamilies.sorted(),nil)
    case "clipboardAuthorize","clipboardWrite","clipboardRead":
        guard ready,state?.id==session.documentId,window.isKeyWindow,body["nonce"] as? String==clipboardNonce else{replyHandler(nil,"Clipboard access requires the active initialized editor window.");return}
        if type=="clipboardAuthorize"{guard let token=body["token"] as? String,UUID(uuidString:token) != nil,let kind=body["kind"] as? String,["clipboardRead","clipboardWrite"].contains(kind) else{replyHandler(nil,"Invalid clipboard authorization.");return};clipboardGrant=(token,kind,ProcessInfo.processInfo.systemUptime+2);replyHandler(true,nil);return}
        guard let grant=clipboardGrant,grant.token==body["token"] as? String,grant.kind==type,ProcessInfo.processInfo.systemUptime<=grant.expires else{replyHandler(nil,"Clipboard access needs a fresh explicit command.");return}
        clipboardGrant=nil
        do{if type=="clipboardRead"{replyHandler(try NodePasteboard.read(from:studio.nodePasteboard),nil)}else{guard let representations=body["representations"] as? [String:Any] else{replyHandler(nil,"Invalid clipboard representations.");return};replyHandler(try NodePasteboard.write(representations,to:studio.nodePasteboard),nil)}}catch{replyHandler(nil,error.localizedDescription)}
    case "bootstrap":if bootstrapped,let id=session.documentId{replyHandler(["kind":"recovery","documentId":id,"dirty":session.dirty],nil)}else{replyHandler(bootstrap,nil)}
    case "ready":guard let current=state else{replyHandler(nil,"No document has initialized");return};ready=true;bootstrapped=true;apply(current);replyHandler(true,nil);if session.file != nil{if !studio.smoke{NSDocumentController.shared.noteNewRecentDocumentURL(session.file!)}};if studio.smoke{studio.runSmoke(self)}
    case "state":guard let raw=body["state"] as? [String:Any],let next=DocumentState(raw) else{replyHandler(nil,"Invalid document state");return};apply(next);replyHandler(true,nil)
    case "new":guard let command=body["command"] as? String,["new","new-whiteboard","new-slides","sample"].contains(command) else{replyHandler(nil,"Invalid window command");return};studio.command(command);replyHandler(true,nil)
    case "open":studio.chooseOpen(self){replyHandler(NSNull(),nil)}
    case "openDocumentIds":replyHandler(studio.documents.compactMap{$0.state?.id ?? $0.session.documentId},nil)
    case "openDocument":guard let raw=body["raw"] as? String else{replyHandler(nil,"Invalid project");return};do{replyHandler(try studio.openRaw(raw),nil)}catch{replyHandler(nil,error.localizedDescription)}
    case "save":save(body,reply:replyHandler)
    default:replyHandler(nil,"Unsupported request")}}
    func save(_ body:[String:Any],reply:@escaping(Any?,String?)->Void){
        guard ready,let current=state,session.documentId==current.id else{reply(nil,"The document has not finished opening");return}
        guard !saveInFlight,let raw=body["data"] as? String,raw.utf8.count<150_000_000,let name=body["name"] as? String else{reply(nil,"Another save is in progress or export is invalid");return}
        let safe=(name as NSString).lastPathComponent,ext=(safe as NSString).pathExtension.lowercased()
        guard ["oui","png","jpg","svg","json","gif","webm","mp4","ttf","otf","pdf","zip"].contains(ext) else{reply(nil,"Unsupported format");return}
        guard let bytes=body["base64"] as? Bool==true ? Data(base64Encoded:raw):raw.data(using:.utf8) else{reply(nil,"Invalid file data");return}
        var projectId:String?
        if ext=="oui"{do{let(_,id)=try studio.project(bytes);guard id==state?.id else{reply(nil,"The saved project does not belong to this window");return};projectId=id}catch{reply(nil,error.localizedDescription);return}}
        saveInFlight=true
        func fail(_ error:Error){self.saveInFlight=false;reply(nil,error.localizedDescription)}
        func chooseDestination(){let panel=NSSavePanel();panel.nameFieldStringValue=safe;panel.allowedContentTypes=[UTType(filenameExtension:ext) ?? .data];panel.beginSheetModal(for:self.window){response in guard response == .OK,let url=panel.url else{self.saveInFlight=false;reply(false,nil);return};write(url,expected:nil,checkRevision:false)};if self.studio.smoke && self.studio.smokeCancelSavePanels{DispatchQueue.main.async{panel.cancel(nil)}}}
        func write(_ url:URL,expected:String?,checkRevision:Bool){
            do{
                let canonical=url.standardizedFileURL.resolvingSymlinksInPath()
                if self.studio.documents.contains(where:{$0 !== self && $0.session.file?.standardizedFileURL.resolvingSymlinksInPath()==canonical}){throw NSError(domain:"This file is already open in another window. Choose a different filename.",code:3)}
                if let id=projectId{
                    guard self.ready,self.state?.id==id,self.session.documentId==id else{throw NSError(domain:"The window document changed while saving.",code:4)}
                    switch try ProjectFileSafety.write(bytes,to:canonical,expected:expected,checkRevision:checkRevision){
                    case .conflict(let observed):
                        let alert=NSAlert();alert.messageText=observed==nil ? "The saved project was removed outside Forma.":"The saved project changed outside Forma."
                        alert.informativeText="Overwrite replaces that external version with this window's contents. Save As keeps a separate copy."
                        alert.addButton(withTitle:"Cancel");alert.addButton(withTitle:"Save As…");alert.addButton(withTitle:"Overwrite")
                        alert.beginSheetModal(for:self.window){response in DispatchQueue.main.async{if response == .alertThirdButtonReturn{write(canonical,expected:observed,checkRevision:true)}else if response == .alertSecondButtonReturn{chooseDestination()}else{self.saveInFlight=false;reply(false,nil)}}}
                        if self.studio.smoke,!self.studio.smokeConflictResponses.isEmpty{let choice=self.studio.smokeConflictResponses.removeFirst();DispatchQueue.main.async{alert.buttons[choice].performClick(nil)}}
                        return
                    case .written:break
                    }
                    self.session.file=canonical;self.session.documentId=id;self.session.fingerprint=ProjectFileSafety.fingerprint(bytes);self.window.representedURL=canonical
                    if !self.studio.smoke{NSDocumentController.shared.noteNewRecentDocumentURL(canonical)};self.studio.persistSessions()
                }else{try bytes.write(to:canonical,options:.atomic)}
                self.saveInFlight=false;reply(true,nil)
            }catch{fail(error)}
        }
        if projectId != nil,body["saveAs"] as? Bool != true,let url=session.file{write(url,expected:session.fingerprint,checkRevision:true)}else{chooseDestination()}
    }

    func webView(_ webView:WKWebView,didStartProvisionalNavigation navigation:WKNavigation!){ready=false}
    func webViewWebContentProcessDidTerminate(_ webView:WKWebView){ready=false}
    func webView(_ webView:WKWebView,decidePolicyFor action:WKNavigationAction,decisionHandler:@escaping(WKNavigationActionPolicy)->Void){guard let url=action.request.url else{decisionHandler(.cancel);return};if url.scheme=="http",url.host=="127.0.0.1",url.port==51981{if ["/figma-bridge.zip","/oanarina-mcp.zip"].contains(url.path){let name=String(url.path.dropFirst());decisionHandler(.cancel);let panel=NSSavePanel();panel.nameFieldStringValue=name;panel.allowedContentTypes=[UTType.zip];panel.beginSheetModal(for:window){response in if response == .OK,let destination=panel.url{do{let data=try Data(contentsOf:self.studio.resources.appendingPathComponent(name));try data.write(to:destination,options:.atomic)}catch{self.studio.showError("Unable to save bundled ZIP",error,window:self.window)}};if self.studio.smoke,let complete=self.studio.smokeBundleCompletion{self.studio.smokeBundleCompletion=nil;complete(name,response)}};if studio.smoke,studio.smokeBundleCompletion != nil{DispatchQueue.main.async{panel.cancel(nil)}};return};decisionHandler(action.navigationType == .other ? .allow:.cancel)}else{decisionHandler(.cancel)}}
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
