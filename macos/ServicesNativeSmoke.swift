import AppKit
import WebKit
import PDFKit

/** Real-shell checks for the system accent, share formats, the export folder, version links and the version browser. */
extension Studio {
    func acceptServices(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        runSteps([{self.acceptAccent(document,$0)},{self.acceptShareKinds(document,$0)},{self.acceptVersionLink(document,directory,$0)},{self.acceptBrowser(document,directory,$0)},{self.acceptLargeScale(document,$0)},{self.acceptHelperPermission(document,directory,$0)}],done)
    }
    func acceptAccent(_ document:DocumentWindow,_ done:@escaping()->Void){
        loadDocument(document,acceptanceDocument("accept-accent","Accent")){
            self.page(document,"await window.__studioCommand('preferences');await wait(()=>document.querySelector('[aria-label=\"Accent color\"]'),'preferences');pick('Accent color','system');await new Promise(r=>setTimeout(r,150));const app=document.querySelector('.app'),before=getComputedStyle(app).getPropertyValue('--accent').trim();await window.__studioNative('system-accent','#ff0000');await new Promise(r=>setTimeout(r,150));const after=getComputedStyle(app).getPropertyValue('--accent').trim();let refused=false;try{await window.__studioNative('system-accent','red; }');}catch{refused=true;}await window.__studioNative('system-accent',\(self.json(Self.systemAccent ?? "#007aff")));pick('Accent color','forma');await new Promise(r=>setTimeout(r,120));const attr=document.documentElement.getAttribute('data-accent');click('Close dialog',document.querySelector('[role=dialog]'));await wait(()=>!document.querySelector('[role=dialog]'),'preferences closed');return {before,after,refused,attr};"){value in
                let body=value as? [String:Any],before=body?["before"] as? String ?? "",after=body?["after"] as? String ?? ""
                self.check(before.hasPrefix("#") && before != after,"the macOS accent reaches the interface tokens and follows a change (\(before) then \(after))")
                self.check(body?["refused"] as? Bool==true,"a malformed accent is refused")
                self.check(body?["attr"] is NSNull || body?["attr"]==nil,"the built-in accent still works after leaving the system one")
                done()
            }
        }
    }
    func acceptShareKinds(_ document:DocumentWindow,_ done:@escaping()->Void){
        loadDocument(document,acceptanceDocument("accept-share","Sharing")){
            let share=self.menuItem(self.integrationMenu("File"),"Share As").submenu
            self.check(share?.items.count==3,"File offers three explicit share formats")
            document.shareDocument(kind:"share-project",present:false){url in
                self.check(url.lastPathComponent=="Sharing.oui" && (try? self.readProject(url))?.1=="accept-share","Share As Forma Project prepares a validated project")
                document.shareDocument(kind:"share-png",present:false){url in
                    guard let data=try? Data(contentsOf:url),let image=self.decoded(data) else{self.smokeFail("share PNG")}
                    self.check(url.pathExtension=="png" && image.width>0,"Share As PNG works with nothing selected (\(image.width)x\(image.height))")
                    document.shareDocument(kind:"share-pdf",present:false){url in
                        self.check((try? Data(contentsOf:url))?.starts(with:Array("%PDF-".utf8))==true,"Share As PDF prepares a real PDF");done()
                    }
                }
            }
        }
    }
    func acceptVersionLink(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        check(Self.versionLinkDocument("forma-version:%5B2%2C%22a%22%2C%22b%22%5D")==nil && Self.versionLinkDocument("https://example.com/x")==nil && Self.versionLinkDocument("forma-version:%5B1%2C%22a%22%5D")==nil,"unsupported version links are refused before any lookup")
        check((Bundle.main.object(forInfoDictionaryKey:"CFBundleURLTypes") as? [[String:Any]])?.first?["CFBundleURLSchemes"] as? [String]==[Self.versionScheme],"the bundle registers the version link scheme")
        loadDocument(document,acceptanceDocument("accept-link","Linked")){
            self.page(document,"await window.__studioCommand('snapshot');const f=await wait(()=>document.querySelector('[role=dialog] form')||document.querySelector('form'),'snapshot form');const i=f.querySelector('input');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,'Checkpoint');i.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,60));f.requestSubmit();await wait(()=>!document.querySelector('form'),'snapshot saved');await new Promise(r=>setTimeout(r,200));const db=await new Promise((ok,no)=>{const q=indexedDB.open('oanarina-projects');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error);});const rows=await new Promise((ok,no)=>{const q=db.transaction('snapshots').objectStore('snapshots').index('documentId').getAll('accept-link');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error);});db.close();const d=document.querySelector('[role=dialog]');if(d)click('Close dialog',d);await wait(()=>!document.querySelector('[role=dialog]'),'dialogs closed');return rows[0].id;"){value in
                guard let snapshot=value as? String else{self.smokeFail("snapshot id")}
                let encoded=self.json([1,"accept-link",snapshot]).addingPercentEncoding(withAllowedCharacters:.alphanumerics) ?? ""
                // The same Get URL Apple event Launch Services sends for a clicked link, delivered through the registered handler.
                let event=NSAppleEventDescriptor(eventClass:AEEventClass(kInternetEventClass),eventID:AEEventID(kAEGetURL),targetDescriptor:.currentProcess(),returnID:AEReturnID(kAutoGenerateReturnID),transactionID:AETransactionID(kAnyTransactionID))
                event.setParam(NSAppleEventDescriptor(string:Self.versionScheme+":"+encoded),forKeyword:AEKeyword(keyDirectObject))
                do{_ = try event.sendEvent(options:[.noReply],timeout:3)}catch{self.smokeFail("Get URL event: \(error)")}
                self.page(document,"await wait(()=>find('Copy local version link')&&!find('Copy local version link').disabled,'linked preview from the shell');click('Close dialog',document.querySelector('[role=dialog]'));await wait(()=>!document.querySelector('[role=dialog]'),'history closed');return true;"){_ in
                    self.check(true,"an external version link opens the read-only preview in its project window")
                    let file=directory.appendingPathComponent("Linked recent.oui")
                    do{try Data(self.acceptanceDocument("accept-link-recent","Linked recent").utf8).write(to:file)}catch{self.smokeFail(error.localizedDescription)}
                    self.smokeRecentProjects=[file]
                    self.smokeReadyOverride={opened in
                        self.page(opened,"await wait(()=>document.querySelector('[role=dialog]')&&document.body.textContent.includes('Version history'),'history opened from a recent file');return true;"){_ in
                            self.check(opened.state?.id=="accept-link-recent","a link to a closed project opens that recent file first")
                            self.smokeRecentProjects=nil;opened.closeApproved();document.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
                            self.until("recent closed",{self.documents.count==1},done)
                        }
                    }
                    self.openVersionLink(Self.versionScheme+":"+(self.json([1,"accept-link-recent","none"]).addingPercentEncoding(withAllowedCharacters:.alphanumerics) ?? ""))
                }
            }
        }
    }
    func acceptBrowser(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        let raw=acceptanceDocument("accept-browse","Current"),file=directory.appendingPathComponent("Browse.oui")
        do{try Data(acceptanceDocument("accept-browse","Earlier").utf8).write(to:file);_ = try NSFileVersion.addOfItem(at:file,withContentsOf:file,options:[]);try Data(raw.utf8).write(to:file)}catch{smokeFail(error.localizedDescription)}
        loadDocument(document,raw){
            document.session.file=file;document.session.documentId="accept-browse"
            let versions=document.systemVersions(),item=self.menuItem(self.integrationMenu("File"),"Revert To").submenu
            self.check(!versions.isEmpty,"the version store holds the earlier bytes")
            if let item{self.versionItems(item);self.check(item.items.contains{$0.representedObject as? String=="native-browse-versions"},"Revert To offers Browse All Versions")}
            let browser=VersionBrowser(document,versions)
            self.check(browser.table.numberOfRows==versions.count && browser.preview.document?.pageCount==1 && browser.restore.isEnabled,"the version browser lists versions and previews the selected one from its own bytes")
            self.check(browser.detail.stringValue.hasPrefix("Earlier"),"the browser names the version's own project title")
            document.versionBrowser=browser
            document.window.beginSheet(browser.panel){_ in document.versionBrowser=nil}
            self.later(0.2){
                browser.apply()
                self.until("restored version",{document.state?.name=="Earlier"}){
                    self.check(true,"Restore replaces the window from that version")
                    self.js(document,"return await window.__studioCommand('undo');"){_ in
                        self.until("undone restore",{document.state?.name=="Current"}){
                            self.check(true,"one Undo returns to the current design")
                            try? NSFileVersion.removeOtherVersionsOfItem(at:file);document.session.file=nil;document.session.fingerprint=nil;done()
                        }
                    }
                }
            }
        }
    }
    func acceptHelperPermission(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        let file=directory.appendingPathComponent("Helper.oui"),raw=acceptanceDocument("accept-helper","Helper")
        do{try Data(raw.utf8).write(to:file)}catch{smokeFail(error.localizedDescription)}
        loadDocument(document,raw){
            document.session.file=file;document.session.documentId="accept-helper";document.session.shareLive=true
            let toggle:(Bool)->String={"await window.__studioCommand('preferences');const e=await wait(()=>document.querySelector('[aria-label=\"Allow live context for the local MCP helper\"]'),'helper toggle');if(e.checked!==\($0))e.click();await new Promise(r=>setTimeout(r,150));click('Close dialog',document.querySelector('[role=dialog]'));await wait(()=>!document.querySelector('[role=dialog]'),'preferences closed');return true;"}
            self.page(document,toggle(false)){_ in
                self.until("sharing stops",{document.session.shareLive==false}){
                    let resources=self.integrationMenu("Resources");resources.update()
                    self.check(self.menuItem(resources,"native-live-context").isEnabled==false,"clearing the helper permission stops sharing and disables the command")
                    self.page(document,toggle(true)){_ in
                        self.later(0.3){
                            resources.update();self.check(self.menuItem(resources,"native-live-context").isEnabled,"allowing it again returns the command, still off until chosen")
                            document.session.file=nil;document.session.fingerprint=nil;done()
                        }
                    }
                }
            }
        }
    }
    func acceptLargeScale(_ document:DocumentWindow,_ done:@escaping()->Void){
        loadDocument(document,acceptanceDocument("accept-scale","Scale")){
            let scale:(String)->String={"await window.__studioCommand('preferences');await wait(()=>document.querySelector('[aria-label=\"Interface scale\"]'),'preferences');pick('Interface scale','\($0)');await new Promise(r=>setTimeout(r,200));click('Close dialog',document.querySelector('[role=dialog]'));await wait(()=>!document.querySelector('[role=dialog]'),'preferences closed');"}
            self.page(document,scale("1.5")+"await window.__studioCommand('deselect');await new Promise(r=>setTimeout(r,300));const r=document.querySelector('#forma-design-canvas [data-node-id=\"accept-frame-2\"]').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};"){value in
                guard let at=value as? [String:Any],let x=at["x"] as? Double,let y=at["y"] as? Double else{self.smokeFail("scaled point")}
                document.window.makeFirstResponder(document.web)
                self.mouse(document,.leftMouseDown,CGFloat(x),CGFloat(y));self.mouse(document,.leftMouseUp,CGFloat(x),CGFloat(y))
                self.until("150% click selects",{document.state?.menu?.selection==true}){
                    self.page(document,"const row=document.querySelector('.layer-row.selected, [role=treeitem][aria-selected=true]')?.textContent??'';"+scale("1")+"return row;"){value in
                        self.check((value as? String)?.contains("Frame two")==true,"at 150% interface scale a real click selects the layer under it in WebKit");done()
                    }
                }
            }
        }
    }
}
