import AppKit
import PDFKit
import WebKit

/** Shell services that take nothing new from the renderer: each pushes bounded values down the existing page-world path. */
extension Studio {
    static let versionScheme="forma-version"
    static var systemAccent:String? {NSColor.controlAccentColor.usingColorSpace(.sRGB).map{c in "#"+[c.redComponent,c.greenComponent,c.blueComponent].map{String(format:"%02x",Int((min(1,max(0,$0))*255).rounded()))}.joined()}}
    func observeSystemAccent(){NotificationCenter.default.addObserver(forName:NSColor.systemColorsDidChangeNotification,object:nil,queue:.main){[weak self] _ in self?.documents.filter{$0.ready}.forEach{$0.pushSystemAccent()}}}
    func addShareMenu(_ menu:NSMenu){
        let submenu=NSMenu(title:"Share As"),item=NSMenuItem(title:"Share As",action:nil,keyEquivalent:"")
        add(submenu,"PNG Image…","native-share-png");add(submenu,"PDF Document…","native-share-pdf");add(submenu,"Forma Project…","native-share-project");item.submenu=submenu;menu.addItem(item)
    }
    func registerVersionLinks(){NSAppleEventManager.shared().setEventHandler(self,andSelector:#selector(receiveLink(_:reply:)),forEventClass:AEEventClass(kInternetEventClass),andEventID:AEEventID(kAEGetURL))}
    @objc func receiveLink(_ event:NSAppleEventDescriptor,reply:NSAppleEventDescriptor){if let raw=event.paramDescriptor(forKeyword:AEKeyword(keyDirectObject))?.stringValue{openVersionLink(raw)}}
    /** Only the document id is read here. The renderer revalidates the whole reference against its own repository. */
    static func versionLinkDocument(_ raw:String)->String? {
        guard raw.utf8.count<=4096,raw.hasPrefix(versionScheme+":"),let decoded=String(raw.dropFirst(versionScheme.count+1)).removingPercentEncoding,let data=decoded.data(using:.utf8),let parts=try? JSONSerialization.jsonObject(with:data) as? [Any],parts.count==3,parts[0] as? Int==1,let id=parts[1] as? String,parts[2] is String,!id.isEmpty,id.utf8.count<=512 else{return nil}
        return id
    }
    func refuseVersionLink(_ text:String){let alert=NSAlert();alert.messageText="This version link cannot be opened.";alert.informativeText=text;if let window=active?.window{alert.beginSheetModal(for:window,completionHandler:nil)}else{alert.runModal()}}
    /** Waits for launch and for a document it just opened, then falls back to a recent file with the same project id. */
    func openVersionLink(_ raw:String,attempt:Int=0,searched:Bool=false){
        guard let id=Self.versionLinkDocument(raw) else{refuseVersionLink("It is not a Forma version link.");return}
        if !started{retry(attempt<120,0.25){self.openVersionLink(raw,attempt:attempt+1,searched:searched)};return}
        if let document=documents.first(where:{$0.state?.id==id||$0.session.documentId==id}){
            guard document.ready else{retry(attempt<120,0.25){self.openVersionLink(raw,attempt:attempt+1,searched:searched)};return}
            document.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
            document.web.callAsyncJavaScript("return await window.__studioNative('version-link',value);",arguments:["value":raw],in:nil,in:.page){[weak self] result in if case .failure(let error)=result{self?.refuseVersionLink(error.localizedDescription)}}
            return
        }
        if !searched,let file=recentProjects.first(where:{(try? self.readProject($0))?.1==id}),openURL(file){openVersionLink(raw,attempt:attempt,searched:true);return}
        refuseVersionLink("Open the project it belongs to, then use the link again. The saved version stays on this Mac.")
    }
    var recentProjects:[URL] {smokeRecentProjects ?? Array(NSDocumentController.shared.recentDocumentURLs.filter{$0.pathExtension.lowercased()=="oui"}.prefix(10))}
    private func retry(_ allowed:Bool,_ seconds:TimeInterval,_ work:@escaping()->Void){guard allowed else{refuseVersionLink("Forma could not finish opening the project.");return};DispatchQueue.main.asyncAfter(deadline:.now()+seconds,execute:work)}
}

extension DocumentWindow {
    func pushSystemAccent(){guard ready,let accent=Studio.systemAccent else{return};web.callAsyncJavaScript("return await window.__studioNative('system-accent',value);",arguments:["value":accent],in:nil,in:.page,completionHandler:nil)}
    func browseVersions(){
        guard session.file != nil else{return}
        let browser=VersionBrowser(self,systemVersions());versionBrowser=browser
        window.beginSheet(browser.panel){[weak self] _ in self?.versionBrowser=nil}
    }
}

/** The system's Time Machine style browser belongs to NSDocument, which this shell does not use.
 * This lists the same versions and previews each with the Quick Look renderer, from the version's own bytes. */
final class VersionBrowser:NSObject,NSTableViewDataSource,NSTableViewDelegate {
    let panel=NSPanel(contentRect:NSRect(x:0,y:0,width:860,height:560),styleMask:[.titled,.resizable,.docModalWindow],backing:.buffered,defer:false)
    let table=NSTableView(),preview=PDFView(),restore=NSButton(title:"Restore",target:nil,action:nil),detail=NSTextField(labelWithString:"")
    let versions:[NSFileVersion];unowned let owner:DocumentWindow
    init(_ owner:DocumentWindow,_ versions:[NSFileVersion]){
        self.owner=owner;self.versions=versions;super.init()
        panel.title="Browse Versions";panel.minSize=NSSize(width:620,height:420)
        let column=NSTableColumn(identifier:.init("date"));column.title="Saved";column.width=220;table.addTableColumn(column);table.dataSource=self;table.delegate=self;table.allowsEmptySelection=false;table.setAccessibilityLabel("macOS versions of this file")
        let scroll=NSScrollView();scroll.documentView=table;scroll.hasVerticalScroller=true;scroll.translatesAutoresizingMaskIntoConstraints=false
        preview.autoScales=true;preview.translatesAutoresizingMaskIntoConstraints=false;preview.setAccessibilityLabel("Version preview")
        let cancel=NSButton(title:"Done",target:self,action:#selector(done));cancel.keyEquivalent="\u{1b}"
        restore.target=self;restore.action=#selector(apply);restore.keyEquivalent="\r";restore.isEnabled=false
        detail.lineBreakMode = .byTruncatingTail
        for view in [cancel,restore,detail]{view.translatesAutoresizingMaskIntoConstraints=false}
        let content=panel.contentView!;[scroll,preview,cancel,restore,detail].forEach{content.addSubview($0)}
        NSLayoutConstraint.activate([scroll.leadingAnchor.constraint(equalTo:content.leadingAnchor,constant:12),scroll.topAnchor.constraint(equalTo:content.topAnchor,constant:12),scroll.widthAnchor.constraint(equalToConstant:240),scroll.bottomAnchor.constraint(equalTo:restore.topAnchor,constant:-12),preview.leadingAnchor.constraint(equalTo:scroll.trailingAnchor,constant:12),preview.trailingAnchor.constraint(equalTo:content.trailingAnchor,constant:-12),preview.topAnchor.constraint(equalTo:scroll.topAnchor),preview.bottomAnchor.constraint(equalTo:scroll.bottomAnchor),restore.trailingAnchor.constraint(equalTo:content.trailingAnchor,constant:-12),restore.bottomAnchor.constraint(equalTo:content.bottomAnchor,constant:-12),cancel.trailingAnchor.constraint(equalTo:restore.leadingAnchor,constant:-8),cancel.centerYAnchor.constraint(equalTo:restore.centerYAnchor),detail.leadingAnchor.constraint(equalTo:content.leadingAnchor,constant:12),detail.trailingAnchor.constraint(lessThanOrEqualTo:cancel.leadingAnchor,constant:-12),detail.centerYAnchor.constraint(equalTo:restore.centerYAnchor)])
        table.reloadData();if versions.isEmpty{detail.stringValue="No earlier macOS versions. Saving again records one."}else{table.selectRowIndexes([0],byExtendingSelection:false);show(0)}
    }
    func numberOfRows(in table:NSTableView)->Int {versions.count}
    func tableView(_ table:NSTableView,viewFor column:NSTableColumn?,row:Int)->NSView? {NSTextField(labelWithString:versions[row].modificationDate.map{DateFormatter.localizedString(from:$0,dateStyle:.medium,timeStyle:.short)} ?? "Earlier version")}
    func tableViewSelectionDidChange(_ note:Notification){show(table.selectedRow)}
    func show(_ row:Int){
        guard versions.indices.contains(row),let data=try? ProjectFileSafety.readBounded(versions[row].url),let project=try? OuiProject(data:data),let pdf=PDFDocument(data:OuiPreview.pdf(project)) else{preview.document=nil;restore.isEnabled=false;detail.stringValue="This version cannot be read.";return}
        preview.document=pdf;restore.isEnabled=true;detail.stringValue="\(project.name), \(project.pages.count) \(project.pages.count==1 ? "page":"pages"). Preview is simplified."
    }
    @objc func done(){owner.window.endSheet(panel)}
    @objc func apply(){guard versions.indices.contains(table.selectedRow) else{return};let version=versions[table.selectedRow];done();owner.restoreSystemVersion(version)}
}
