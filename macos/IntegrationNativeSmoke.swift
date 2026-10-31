import AppKit
import WebKit
import CoreText
import ImageIO
import PDFKit

/** Real AppKit menus and tabs, WebKit, Core Text, NSFileVersion and print services against synthetic
 * temporary projects. `FORMA_SMOKE_REPO` enables the cross-process MCP writer and reader checks. */
extension Studio {
    typealias Step=(@escaping()->Void)->Void
    func runSteps(_ steps:[Step],_ done:@escaping()->Void){guard let first=steps.first else{done();return};first{DispatchQueue.main.async{self.runSteps(Array(steps.dropFirst()),done)}}}
    func until(_ name:String,seconds:TimeInterval=12,_ condition:@escaping()->Bool,_ then:@escaping()->Void){
        let end=ProcessInfo.processInfo.systemUptime+seconds
        func poll(){if condition(){then();return};if ProcessInfo.processInfo.systemUptime>end{smokeFail("Timed out: "+name)};let timer=Timer(timeInterval:0.05,repeats:false){_ in poll()};RunLoop.main.add(timer,forMode:.common)}
        poll()
    }
    func later(_ seconds:TimeInterval,_ then:@escaping()->Void){let timer=Timer(timeInterval:seconds,repeats:false){_ in then()};RunLoop.main.add(timer,forMode:.common)}
    func integrationMenu(_ title:String)->NSMenu {guard let menu=NSApp.mainMenu?.items.first(where:{$0.title==title})?.submenu else{smokeFail("native menu "+title)};return menu}
    func menuItem(_ menu:NSMenu,_ id:String)->NSMenuItem {guard let item=menu.items.first(where:{$0.representedObject as? String==id||$0.title==id}) else{smokeFail("menu item "+id)};return item}
    func invoke(_ menu:NSMenu,_ id:String){let item=menuItem(menu,id);menu.update();guard item.isEnabled else{smokeFail("menu item disabled: "+id)};menu.performActionForItem(at:menu.index(of:item))}
    func integrationProject(name:String="Integration",fontFamily:String="Inter")->Data {
        func layer(_ id:String,_ type:String,_ title:String,_ x:Int)->[String:Any]{return ["id":id,"type":type,"name":title,"parentId":NSNull(),"x":x,"y":100,"width":200,"height":100,"rotation":0,"fill":"#e4d8f5","stroke":"","strokeWidth":2,"opacity":1,"radius":0,"visible":true,"locked":false,"text":"Base","fontSize":24,"fontFamily":fontFamily,"fontWeight":400,"textAlign":"left","lineHeight":1.3,"letterSpacing":0,"path":"","points":[],"image":"","shadow":false,"blur":0,"layout":"none","gap":16,"padding":24,"columns":3,"clip":false,"componentId":NSNull(),"targetId":NSNull(),"gradient":false]}
        let raw=json(["format":"oanarina-ui","version":2,"id":"native-integration","name":name,"updatedAt":"2026-10-31T00:00:00.000Z","colors":[],"pages":[["id":"integration-page","name":"Artwork","nodes":[layer("integration-a","rectangle","Card A",100),layer("integration-b","rectangle","Card B",340),layer("integration-text","text","Label",100)],"comments":[]]]])
        return Data(raw.utf8)
    }
    func runIntegrationSmoke(_ initial:DocumentWindow){
        guard smokeStage==0 else{return};smokeStage=1
        later(170){if !self.smokeFinishing{self.smokeFail("Integration acceptance timeout")}}
        let directory=FileManager.default.temporaryDirectory.appendingPathComponent("forma-integration-"+UUID().uuidString,isDirectory:true),file=directory.appendingPathComponent("Integration.oui");smokeDirectory=directory
        do{try FileManager.default.createDirectory(at:directory,withIntermediateDirectories:true);try integrationProject(fontFamily:"Fxrmax").write(to:file)}catch{smokeFail(error.localizedDescription)}
        smokeReadyOverride={document in
            initial.closeApproved()
            document.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
            self.runSteps([{self.integrationMenus(document,$0)},{self.integrationAccelerators($0)},{self.integrationMenuState(document,$0)},{self.integrationFonts(document,$0)},{self.integrationPinch(document,$0)},{self.integrationAppearance(document,$0)},{self.integrationVersions(document,file,$0)},{self.integrationPrint(document,directory,$0)},{self.integrationShare(document,$0)},{self.integrationDiskSync(document,file,$0)},{self.integrationLive(document,file,$0)},{self.integrationTabs(document,$0)}]){
                self.smokeFinishing=true;let sidecar=LiveContextFile.url(file);document.closeApproved()
                self.check(!FileManager.default.fileExists(atPath:sidecar.path),"closing a shared window removes its live context")
                try? NSFileVersion.removeOtherVersionsOfItem(at:file);try? FileManager.default.removeItem(at:directory)
                print(self.json(["nativeIntegration":true,"count":self.smokeChecks.count,"checks":self.smokeChecks]));fflush(stdout);self.smokeTerminate()
            }
        }
        guard openURL(file) else{smokeFail("Integration project could not be opened")}
    }
    func js(_ document:DocumentWindow,_ source:String,_ completion:@escaping(Any?)->Void){document.web.callAsyncJavaScript(source,arguments:[:],in:nil,in:.page){result in switch result{case .success(let value):completion(value);case .failure(let error):self.smokeFail(((error as NSError).userInfo["WKJavaScriptExceptionMessage"] as? String ?? error.localizedDescription)+" in "+source.prefix(120))}}}
    func command(_ document:DocumentWindow,_ id:String,_ then:@escaping()->Void){js(document,"await window.__studioCommand(\(json(id)));return true;"){_ in then()}}

    func integrationMenus(_ document:DocumentWindow,_ done:@escaping()->Void){
        let bar=NSApp.mainMenu!,application=integrationMenu("Forma"),file=integrationMenu("File"),edit=integrationMenu("Edit"),view=integrationMenu("View"),object=integrationMenu("Object"),window=integrationMenu("Window"),help=integrationMenu("Help")
        check(bar.items.first?.title=="Forma" && bar.items.last?.title=="Help" && bar.items[bar.items.count-2].title=="Window","native menu bar keeps application first, then Window and Help last")
        for title in ["About Forma","Preferences…","Services","Hide Forma","Hide Others","Show All","Quit Forma"]{_ = menuItem(application,title)}
        check(NSApp.servicesMenu===menuItem(application,"Services").submenu,"native application menu has a system Services submenu")
        check(menuItem(application,"Hide Others").keyEquivalentModifierMask==[.option,.command] && menuItem(application,"Show All").action==#selector(NSApplication.unhideAllApplications(_:)),"native application menu has Hide Others and Show All")
        for id in ["new","open","save","save-as","export","native-share","native-print","Open Recent","Revert To"]{_ = menuItem(file,id)}
        check(menuItem(file,"native-print").keyEquivalent=="p" && menuItem(file,"Revert To").submenu===versionMenu,"native File menu has Print, Share, Open Recent and Revert To")
        for id in ["undo","redo","cut","copy","copy-as-png","paste","select-all"]{_ = menuItem(edit,id)}
        for id in ["Show Tab Bar","Enter Full Screen","zoom-in","grid"]{_ = menuItem(view,id)}
        check(menuItem(view,"Enter Full Screen").keyEquivalentModifierMask==[.control,.command],"native View menu has full screen and tab bar controls")
        for title in ["Minimize","Zoom","Show Previous Tab","Show Next Tab","Move Tab to New Window","Merge All Windows","Close","Bring All to Front"]{_ = menuItem(window,title)}
        check(NSApp.windowsMenu===window && window.items.contains{$0.title=="Bring All to Front"},"native Window menu is the system window list with tab commands")
        check(NSApp.helpMenu===help && menuItem(help,"native-guide").target===self,"native Help menu is the system help menu with Forma Guide")
        invoke(application,"about")
        clipboardWait(document,"document.querySelector('[role=dialog]')"){
            self.check(true,"native application About item reaches the editor")
            self.js(document,"document.querySelector('[role=dialog] [aria-label=\"Close dialog\"], [role=dialog] button')?.click();return true;"){_ in
                self.clipboardWait(document,"!document.querySelector('[role=dialog]')"){
                    self.invoke(edit,"select-all")
                    self.until("selection reaches native state",{document.state?.menu?.selection==true}){
                        self.check(true,"native Edit Select all reaches the editor")
                        self.invoke(object,"group")
                        self.until("Object Group edit",{document.state?.dirty==true}){
                            self.check(true,"native Object Group edits the document")
                            self.invoke(edit,"undo")
                            self.until("Edit Undo returns to saved",{document.state?.dirty==false}){self.check(true,"native Edit Undo restores saved content");self.invoke(help,"shortcuts")
                                self.clipboardWait(document,"document.querySelector('[role=dialog]')"){self.check(true,"native Help item reaches the editor")
                                    self.js(document,"document.querySelector('[role=dialog] [aria-label=\"Close dialog\"], [role=dialog] button')?.click();return true;"){_ in self.clipboardWait(document,"!document.querySelector('[role=dialog]')",done)}
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    func integrationAccelerators(_ done:@escaping()->Void){
        guard let data=try? Data(contentsOf:resources.appendingPathComponent("commands.json")),let rows=try? JSONSerialization.jsonObject(with:data) as? [[String]] else{smokeFail("command registry")}
        var bound=0,labelled=0
        for row in rows where row.count==4 && !row[3].isEmpty && row[0] != "preferences" && row[0] != "about" && row[2] != "Tools"{
            let item=menuItem(integrationMenu(row[2]),row[0])
            if !item.keyEquivalent.isEmpty{bound+=1;if !item.keyEquivalentModifierMask.intersection([.command,.control]).isEmpty{continue};smokeFail("unmodified native binding: "+row[0])}
            guard item.attributedTitle?.string==row[1]+"\t"+row[3] else{smokeFail("missing shortcut label: "+row[0])};labelled+=1
        }
        check(bound>30&&labelled>15,"every native command shortcut shows \(bound) bound and \(labelled) label-only accelerators")
        func walk(_ menu:NSMenu){for item in menu.items{if let sub=item.submenu{walk(sub)};if !item.keyEquivalent.isEmpty,item.keyEquivalentModifierMask.intersection([.command,.control]).isEmpty{smokeFail("single-key native binding would capture typing: "+item.title)}}}
        walk(NSApp.mainMenu!);check(true,"no native menu binding captures unmodified typing");done()
    }
    func integrationMenuState(_ document:DocumentWindow,_ done:@escaping()->Void){
        let edit=integrationMenu("Edit"),view=integrationMenu("View"),undo=menuItem(edit,"undo"),redo=menuItem(edit,"redo"),copy=menuItem(edit,"copy"),grid=menuItem(view,"grid")
        js(document,"await window.__studioCommand('deselect');return true;"){_ in
            self.until("menu state clears selection",{document.state?.menu?.selection==false}){
                edit.update();self.check(!copy.isEnabled,"native Copy disables without a selection")
                self.check(redo.isEnabled==(document.state?.menu?.redo==true),"native Redo follows editor history")
                let before=grid.state
                self.invoke(view,"grid")
                self.until("grid check state",{document.state?.menu?.checked.contains("grid")==(before == .off)}){
                    view.update();self.check(grid.state != before,"native View check mark follows the canvas grid")
                    self.invoke(view,"grid")
                    self.command(document,"select-all"){
                        self.until("menu selection",{document.state?.menu?.selection==true}){
                            edit.update();self.check(copy.isEnabled,"native Copy enables with a selection")
                            self.js(document,"const i=document.createElement('input');i.id='forma-menu-probe';document.body.appendChild(i);await window.__studioCommand('deselect');i.focus();return true;"){_ in
                                self.until("editing focus reaches native state",{document.state?.menu?.editing==true}){
                                    edit.update();self.check(copy.isEnabled && undo.isEnabled,"native text commands stay enabled while a field has focus")
                                    self.js(document,"document.getElementById('forma-menu-probe').remove();return true;"){_ in done()}
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    func integrationFonts(_ document:DocumentWindow,_ done:@escaping()->Void){
        // Same-length rename of a bundled open font gives a family no machine has installed.
        guard var font=try? Data(contentsOf:resources.appendingPathComponent("fonts/caveat-0.ttf")) else{smokeFail("font fixture")}
        let old=Data("Caveat".utf16.flatMap{[UInt8($0>>8),UInt8($0&255)]}),new=Data("Fxrmax".utf16.flatMap{[UInt8($0>>8),UInt8($0&255)]})
        var search=font.startIndex;while let range=font.range(of:old,in:search..<font.endIndex){font.replaceSubrange(range,with:new);search=range.upperBound}
        let url=smokeDirectory!.appendingPathComponent("Probe.ttf");do{try font.write(to:url)}catch{smokeFail(error.localizedDescription)}
        check(!NSFontManager.shared.availableFontFamilies.contains("Fxrmax"),"font fixture family starts uninstalled")
        clipboardWait(document,"document.querySelector('[aria-label=\"Resolve missing fonts\"]')?.title.includes('Fxrmax')"){
            self.check(true,"renderer reports the uninstalled family as missing")
            var error:Unmanaged<CFError>?
            guard CTFontManagerRegisterFontsForURL(url as CFURL,.process,&error) else{self.smokeFail("process font registration")}
            self.clipboardWait(document,"!document.querySelector('[aria-label=\"Resolve missing fonts\"]')?.title.includes('Fxrmax')"){
                self.check(NSFontManager.shared.availableFontFamilies.contains("Fxrmax"),"Core Text lists the newly registered family")
                self.check(true,"renderer clears the missing font without reopening after installation")
                self.js(document,"return (await window.desktop.fonts()).includes('Fxrmax');"){value in
                    self.check(value as? Bool==true,"native font list includes the new family")
                    CTFontManagerUnregisterFontsForURL(url as CFURL,.process,nil)
                    self.clipboardWait(document,"document.querySelector('[aria-label=\"Resolve missing fonts\"]')?.title.includes('Fxrmax')"){self.check(true,"renderer reports removal of an installed family");self.integrationUserFont(document,url,done)}
                }
            }
        }
    }
    /** A file placed in the user font folder is what Font Book's install does, and it reaches this process from fontd, not from itself. */
    func integrationUserFont(_ document:DocumentWindow,_ source:URL,_ done:@escaping()->Void){
        let folder=FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Fonts",isDirectory:true),file=folder.appendingPathComponent("FormaSmokeProbe.ttf")
        try? FileManager.default.removeItem(at:file)
        do{try FileManager.default.createDirectory(at:folder,withIntermediateDirectories:true);try FileManager.default.copyItem(at:source,to:file)}catch{smokeFail(error.localizedDescription)}
        clipboardWait(document,"!document.querySelector('[aria-label=\"Resolve missing fonts\"]')?.title.includes('Fxrmax')"){
            self.check(true,"a font file installed in the user font folder clears the missing font without reopening")
            try? FileManager.default.removeItem(at:file)
            self.clipboardWait(document,"document.querySelector('[aria-label=\"Resolve missing fonts\"]')?.title.includes('Fxrmax')"){self.check(true,"removing it from the folder reports it missing again");done()}
        }
    }
    func integrationPinch(_ document:DocumentWindow,_ done:@escaping()->Void){
        let read="document.querySelector('svg.canvas > g[transform]').getAttribute('transform')"
        js(document,"const before=\(read),el=document.querySelector('svg.canvas'),r=el.getBoundingClientRect(),x=r.left+300,y=r.top+200,native=typeof GestureEvent==='function',fire=(type,scale)=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.assign(e,{scale,clientX:x,clientY:y});el.dispatchEvent(e);return e.defaultPrevented;};const prevented=[fire('gesturestart',1),fire('gesturechange',1.5),fire('gesturechange',2)];fire('gestureend',2);await new Promise(r=>setTimeout(r,120));const after=\(read);fire('gesturestart',1);fire('gesturechange',1e-9);fire('gesturechange',Number.NaN);fire('gestureend',1);await new Promise(r=>setTimeout(r,120));return {native,prevented:prevented.every(Boolean),before,after,clamped:\(read)};"){value in
            guard let result=value as? [String:Any] else{self.smokeFail("pinch report")}
            self.check(result["native"] as? Bool==true,"this WebKit exposes GestureEvent, the pinch delivery path")
            self.check(result["prevented"] as? Bool==true && result["before"] as? String != result["after"] as? String,"pinch gesture events zoom the canvas camera")
            self.check((result["clamped"] as? String)?.contains("NaN")==false,"invalid pinch scale leaves a finite camera")
            done()
        }
    }
    func integrationAppearance(_ document:DocumentWindow,_ done:@escaping()->Void){
        js(document,"localStorage.setItem('oui-theme','system');window.dispatchEvent(new StorageEvent('storage',{key:'oui-theme'}));return true;"){_ in
            NSApp.appearance=NSAppearance(named:.darkAqua)
            self.clipboardWait(document,"matchMedia('(prefers-color-scheme: dark)').matches && document.querySelector('.app.theme-dark')"){
                self.check(true,"actual WKWebView follows macOS dark appearance")
                NSApp.appearance=NSAppearance(named:.aqua)
                self.clipboardWait(document,"!matchMedia('(prefers-color-scheme: dark)').matches && document.querySelector('.app.theme-light')"){
                    self.check(true,"actual WKWebView follows macOS light appearance while running")
                    NSApp.appearance=nil
                    self.js(document,"localStorage.removeItem('oui-theme');window.dispatchEvent(new StorageEvent('storage',{key:'oui-theme'}));return true;"){_ in done()}
                }
            }
        }
    }
    func integrationVersions(_ document:DocumentWindow,_ file:URL,_ done:@escaping()->Void){
        guard let first=try? Data(contentsOf:file) else{smokeFail("version fixture")}
        check(document.systemVersions().isEmpty,"new project has no macOS versions")
        js(document,"await window.__studioCommand('page');await new Promise(r=>setTimeout(r,100));return await window.__studioSave();"){value in
            self.check(value as? Bool==true,"Save completes while recording a version")
            let versions=document.systemVersions()
            self.check(versions.count==1 && (try? Data(contentsOf:versions[0].url))==first,"Save stores the replaced bytes in the macOS version store")
            self.check(versions[0].url.path.contains(".DocumentRevisions-V100"),"versions live in the system document store")
            self.versionItems(self.versionMenu!)
            self.check(self.versionMenu!.items.contains{$0.representedObject is NSFileVersion},"Revert To lists macOS versions")
            let saved=try! Data(contentsOf:file)
            self.later(0.1){
                self.restoreVersion(self.versionMenu!.items.first{$0.representedObject is NSFileVersion}!)
                self.until("version restore marks window edited",{document.state?.dirty==true}){
                    self.check((try? Data(contentsOf:file))==saved,"restoring a version leaves the saved file alone until Save")
                    self.js(document,"await window.__studioCommand('undo');return true;"){_ in
                        self.until("undo returns to saved content",{document.state?.dirty==false}){
                            self.check(true,"a restored version is one Undo step")
                            self.js(document,"await window.__studioCommand('page');return true;"){_ in
                                self.until("edit before revert",{document.state?.dirty==true}){
                                    self.command("native-revert")
                                    self.until("revert clears dirty",{document.state?.dirty==false}){self.check(true,"Revert To Last Saved File returns to disk content");done()}
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    func integrationPrint(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        let output=directory.appendingPathComponent("Printed.pdf")
        document.printDocument(destination:output){pages in
            self.until("print job writes its file",{FileManager.default.fileExists(atPath:output.path)}){
                guard let printed=PDFDocument(url:output) else{self.smokeFail("printed PDF")}
                self.check(pages>=1 && printed.pageCount>=1,"real macOS print job produces PDF pages from editor artwork")
                document.printDocument()
                self.until("print dialog sheet",{document.window.attachedSheet != nil}){
                    guard let sheet=document.window.attachedSheet else{self.smokeFail("print sheet")}
                    self.check(sheet.title=="Print" && String(describing:type(of:sheet.contentView!))=="PMPrintPanelView","Print… presents the macOS print dialog as a sheet on its window")
                    document.window.endSheet(sheet,returnCode:.cancel)
                    self.until("print dialog dismissed",{document.window.attachedSheet==nil},done)
                }
            }
        }
    }
    func integrationShare(_ document:DocumentWindow,_ done:@escaping()->Void){
        js(document,"await window.__studioCommand('deselect');return true;"){_ in
            document.shareDocument(present:false){pdf in
                self.check(PDFDocument(url:pdf) != nil && pdf.pathExtension=="pdf","Share prepares a PDF of the page without a selection")
                self.check(((try? FileManager.default.attributesOfItem(atPath:pdf.path))?[.posixPermissions] as? NSNumber)?.intValue==0o600,"shared file is private")
                let first=pdf.deletingLastPathComponent()
                self.command(document,"select-all"){
                    self.later(0.2){document.shareDocument(present:false){png in
                        self.check(png.pathExtension=="png" && NSImage(contentsOf:png) != nil,"Share prepares a 2x PNG of a selection")
                        self.check(!FileManager.default.fileExists(atPath:first.path),"each share removes its previous temporary file")
                        self.smokeShareServices=nil
                        self.later(1.2){document.sharePicker?.close()}
                        document.shareDocument()
                        self.until("share picker opens",{self.smokeShareServices != nil},{
                            self.check((self.smokeShareServices ?? 0)>0,"Share… opens the system picker, which proposes \(self.smokeShareServices ?? 0) services for the file")
                            self.later(0.2,done)
                        })
                    }}
                }
            }
        }
    }
    func writeExternal(_ file:URL,_ edit:(inout [String:Any])->Void){do{var object=try JSONSerialization.jsonObject(with:Data(contentsOf:file)) as! [String:Any];edit(&object);try JSONSerialization.data(withJSONObject:object).write(to:file,options:.atomic)}catch{smokeFail(error.localizedDescription)}}
    /** Runs the repository's real transaction code in a separate process. */
    func runCli(_ arguments:[String],input:String="",_ completion:@escaping([String:Any])->Void){
        guard let root=ProcessInfo.processInfo.environment["FORMA_SMOKE_REPO"] else{smokeFail("FORMA_SMOKE_REPO is required for cross-process checks")}
        let process=Process(),out=Pipe(),inp=Pipe(),err=Pipe();process.executableURL=URL(fileURLWithPath:"/usr/bin/env");process.arguments=["node",root+"/mcp/node_modules/tsx/dist/cli.mjs","--tsconfig",root+"/mcp/tsconfig.json",root+"/mcp/automation.ts"]+arguments;process.standardOutput=out;process.standardInput=inp;process.standardError=err;process.currentDirectoryURL=URL(fileURLWithPath:root)
        do{try process.run()}catch{smokeFail(error.localizedDescription)}
        DispatchQueue.global().async{
            try? inp.fileHandleForWriting.write(contentsOf:Data(input.utf8));try? inp.fileHandleForWriting.close()
            let data=out.fileHandleForReading.readDataToEndOfFile(),failure=err.fileHandleForReading.readDataToEndOfFile();process.waitUntilExit()
            DispatchQueue.main.async{guard process.terminationStatus==0,let value=try? JSONSerialization.jsonObject(with:data) as? [String:Any] else{self.smokeFail("automation CLI: "+(String(data:failure,encoding:.utf8) ?? ""))};completion(value)}
        }
    }
    func integrationDiskSync(_ document:DocumentWindow,_ file:URL,_ done:@escaping()->Void){
        let lock=URL(fileURLWithPath:file.path+".oanarina-mcp.lock")
        js(document,"await window.__studioCommand('deselect');await window.__studioSave();return true;"){_ in
            self.until("clean baseline",{document.state?.dirty==false}){
                self.writeExternal(file){$0["name"]="Changed on disk"}
                self.until("clean window reloads external save",{document.state?.name=="Changed on disk"}){
                    self.until("reload settles on the file",{document.state?.dirty==false&&document.session.fingerprint==(try? ProjectFileSafety.current(file))}){
                    self.check(true,"reload of a clean window stays clean and adopts the file as the save baseline")
                    self.js(document,"await window.__studioCommand('undo');return true;"){_ in
                        self.until("reload undoes",{document.state?.name != "Changed on disk"}){
                            self.check(document.state?.dirty==true,"undoing a reload is one step and marks the window edited")
                            self.js(document,"await window.__studioCommand('redo');return true;"){_ in
                                self.until("reload redoes",{document.state?.name=="Changed on disk" && document.state?.dirty==false}){
                                    self.mcpWriterStep(document,file,lock,done)
                                }
                            }
                        }
                    }
                    }
                }
            }
        }
    }
    func mcpWriterStep(_ document:DocumentWindow,_ file:URL,_ lock:URL,_ done:@escaping()->Void){
        runCli(["--project",file.path,"inspect"]){info in
            guard let revision=info["revision"] as? String else{self.smokeFail("automation revision")}
            self.runCli(["--project",file.path,"apply","--revision",revision],input:"[{\"op\":\"rename_document\",\"name\":\"Written by MCP\"},{\"op\":\"create_node\",\"pageId\":\"integration-page\",\"id\":\"from-mcp\",\"type\":\"rectangle\",\"properties\":{\"name\":\"From MCP\",\"x\":40,\"y\":300,\"width\":90,\"height\":60}}]"){_ in
                self.until("open window shows the MCP transaction",{document.state?.name=="Written by MCP"}){
                    self.js(document,"return [...document.querySelectorAll('.layer-row')].some(r=>r.textContent.includes('From MCP'));"){value in
                        self.check(value as? Bool==true && document.state?.dirty==false,"separate-process MCP transaction appears in the open clean window")
                        try? Data("held by writer".utf8).write(to:lock)
                        self.writeExternal(file){$0["name"]="Behind a lock"}
                        self.later(2.3){
                            self.check(document.state?.name=="Written by MCP","shell waits while a project lock is held")
                            try? FileManager.default.removeItem(at:lock)
                            self.until("reload after lock release",{document.state?.name=="Behind a lock"}){
                                self.check(true,"shell reloads after the writer releases its lock")
                                self.dirtySyncStep(document,file,done)
                            }
                        }
                    }
                }
            }
        }
    }
    func dirtySyncStep(_ document:DocumentWindow,_ file:URL,_ done:@escaping()->Void){
        js(document,"await window.__studioCommand('page');return true;"){_ in
            self.until("dirty before external",{document.state?.dirty==true}){
                self.writeExternal(file){$0["name"]="External while dirty"}
                let external=try! Data(contentsOf:file)
                self.clipboardWait(document,"document.body.textContent.includes('Your unsaved edits are kept')"){
                    self.check(document.state?.dirty==true && document.state?.name=="Behind a lock","dirty window keeps its edits and is told about the external change")
                    self.smokeConflictResponses=[0]
                    self.smokeJS(document,"return await window.__studioSave();"){value in
                        self.check(value as? Bool==false && (try? Data(contentsOf:file))==external,"Save from a dirty window still asks before replacing the external file")
                        self.js(document,"await window.__studioCommand('undo');return true;"){_ in
                            self.until("returning to clean adopts the pending file",{document.state?.name=="External while dirty" && document.state?.dirty==false}){
                                self.check(true,"a window that becomes clean adopts the pending external file")
                                self.busySyncStep(document,file,done)
                            }
                        }
                    }
                }
            }
        }
    }
    func busySyncStep(_ document:DocumentWindow,_ file:URL,_ done:@escaping()->Void){
        js(document,"const i=document.createElement('input');i.id='forma-sync-probe';document.body.appendChild(i);i.focus();return true;"){_ in
            self.writeExternal(file){$0["name"]="After editing"}
            self.later(2.3){
                self.check(document.state?.name=="External while dirty","shell defers reload while a field is being edited")
                self.js(document,"document.getElementById('forma-sync-probe').remove();return true;"){_ in
                    self.until("deferred reload",{document.state?.name=="After editing"},{
                        self.check(true,"deferred reload completes after editing ends")
                        let valid=try! Data(contentsOf:file)
                        try! Data("{ not a project".utf8).write(to:file,options:.atomic)
                        self.clipboardWait(document,"document.body.textContent.includes('not a valid copy of this project')"){
                            self.check(document.state?.name=="After editing" && document.state?.dirty==false,"malformed external file is refused without touching the window")
                            self.writeExternal2(file,valid){$0["id"]="another-document";$0["name"]="Foreign"}
                            self.later(2.3){
                                self.check(document.state?.name=="After editing","a file with another document identity is refused")
                                try! valid.write(to:file,options:.atomic)
                                self.later(1.5){done()}
                            }
                        }
                    })
                }
            }
        }
    }
    func writeExternal2(_ file:URL,_ source:Data,_ edit:(inout [String:Any])->Void){do{var object=try JSONSerialization.jsonObject(with:source) as! [String:Any];edit(&object);try JSONSerialization.data(withJSONObject:object).write(to:file,options:.atomic)}catch{smokeFail(error.localizedDescription)}}
    func liveRecord(_ file:URL)->[String:Any]? {(try? Data(contentsOf:LiveContextFile.url(file))).flatMap{try? JSONSerialization.jsonObject(with:$0) as? [String:Any]}}
    func decodedPng(_ value:Any?)->(Int,Int)? {guard let image=value as? [String:Any],let text=image["data"] as? String,let bytes=Data(base64Encoded:text),let source=CGImageSourceCreateWithData(bytes as CFData,nil),CGImageSourceGetType(source) as String?=="public.png",let decoded=CGImageSourceCreateImageAtIndex(source,0,nil),decoded.width==image["width"] as? Int,decoded.height==image["height"] as? Int else{return nil};return (decoded.width,decoded.height)}
    func integrationLive(_ document:DocumentWindow,_ file:URL,_ done:@escaping()->Void){
        let sidecar=LiveContextFile.url(file)
        check(!FileManager.default.fileExists(atPath:sidecar.path),"no live context exists before opting in")
        smokeAlertResponse=1;command("native-live-context")
        later(1.5){
            self.check(!document.session.shareLive && !FileManager.default.fileExists(atPath:sidecar.path),"declining the consent sheet shares nothing")
            let item=self.menuItem(self.integrationMenu("Resources"),"native-live-context");self.integrationMenu("Resources").update();self.check(item.state == .off && item.isEnabled,"sharing control is off and available for a saved project")
            self.smokeAlertResponse=0;self.command("native-live-context")
            self.until("sidecar published",{self.liveRecord(file)?["screenshot"] as? [String:Any] != nil},{
                guard let record=self.liveRecord(file) else{self.smokeFail("live record")}
                self.integrationMenu("Resources").update();self.check(item.state == .on,"sharing control shows its on state")
                let attributes=try? FileManager.default.attributesOfItem(atPath:sidecar.path)
                self.check((attributes?[.posixPermissions] as? NSNumber)?.intValue==0o600,"live context file is private")
                self.check(record["format"] as? String=="forma-live-context" && record["documentId"] as? String=="native-integration" && record["pid"] as? Int==Int(ProcessInfo.processInfo.processIdentifier),"live context identifies its document and publisher")
                self.check(record["savedRevision"] as? String==(try? ProjectFileSafety.current(file)) && record["dirty"] as? Bool==false,"live context carries the saved revision")
                guard let shot=self.decodedPng(record["screenshot"]) else{self.smokeFail("screenshot PNG")}
                self.check(shot.0>100 && shot.0<=1600,"actual WKWebView snapshot decodes as a PNG up to 1,600 pixels wide (\(shot.0)x\(shot.1))")
                let art=record["artwork"] as? [String:Any]
                self.check(self.decodedPng(art) != nil && art?["scope"] as? String=="page","page artwork renders through the editor")
                self.command(document,"select-all"){
                    self.until("selection published",{(self.liveRecord(file)?["selection"] as? [String])?.isEmpty==false},{
                        let selected=self.liveRecord(file)!
                        self.check(((selected["artwork"] as? [String:Any])?["scope"] as? String)=="selection" && self.decodedPng(selected["artwork"]) != nil,"selection change republishes selection artwork")
                        self.runCli(["--project",file.path,"live"]){summary in
                            self.check((summary["selectionCount"] as? Int ?? 0)>=2 && summary["matchesSavedFile"] as? Bool==true,"separate-process MCP reader resolves the live selection")
                            self.check((summary["screenshot"] as? [String:Any])?["width"] as? Int==shot.0,"separate-process MCP reader sees the screenshot")
                            self.liveDirtyStep(document,file,done)
                        }
                    })
                }
            })
        }
    }
    func liveDirtyStep(_ document:DocumentWindow,_ file:URL,_ done:@escaping()->Void){
        let sidecar=LiveContextFile.url(file),victim=file.deletingLastPathComponent().appendingPathComponent("victim.txt")
        js(document,"await window.__studioCommand('page');return true;"){_ in
            self.until("dirty published",{self.liveRecord(file)?["dirty"] as? Bool==true},{
                self.check(true,"unsaved edits are flagged in the live context")
                do{try Data("keep".utf8).write(to:victim);try FileManager.default.removeItem(at:sidecar);try FileManager.default.createSymbolicLink(at:sidecar,withDestinationURL:victim)}catch{self.smokeFail(error.localizedDescription)}
                self.js(document,"await window.__studioCommand('undo');return true;"){_ in
                    self.until("symlink replaced",{(try? FileManager.default.destinationOfSymbolicLink(atPath:sidecar.path))==nil},{
                        self.check((try? Data(contentsOf:victim))==Data("keep".utf8),"publishing replaces a planted link instead of writing through it")
                        self.command("native-live-context")
                        self.until("sidecar removed",{!FileManager.default.fileExists(atPath:sidecar.path)},{
                            self.check(!document.session.shareLive,"turning sharing off removes the live context")
                            self.later(1.6){
                                self.check(!FileManager.default.fileExists(atPath:sidecar.path),"nothing republishes after sharing is off")
                                self.session(document,share:true);self.until("republished for close check",{self.liveRecord(file) != nil},done)
                            }
                        })
                    })
                }
            })
        }
    }
    func session(_ document:DocumentWindow,share:Bool){document.session.shareLive=share;document.live.key=""}
    func integrationTabRestore(_ document:DocumentWindow,_ done:@escaping()->Void){
        smokeReadyOverride={second in
            self.smokeReadyOverride={third in
                document.window.addTabbedWindow(second.window,ordered:.above);document.window.addTabbedWindow(third.window,ordered:.above)
                self.captureTabGroups()
                let groups=Set(self.documents.compactMap{$0.session.tabGroup})
                self.check(groups.count==1 && self.documents.allSatisfy{$0.session.tabGroup != nil},"tab membership is captured in window sessions")
                self.check(WindowSession(second.session.record)?.tabGroup==second.session.tabGroup,"tab membership roundtrips through the saved session record")
                second.window.moveTabToNewWindow(nil);third.window.moveTabToNewWindow(nil)
                self.until("windows separated",{self.documents.allSatisfy{($0.window.tabbedWindows?.count ?? 1)<=1}},{
                    for member in self.documents{member.session.tabGroup=groups.first}
                    self.arrangeRestoredTabs()
                    self.check(document.window.tabbedWindows?.count==3,"restored sessions regroup into their tab group")
                    for member in [second,third]{member.closeApproved()}
                    self.until("restored tabs closed",{self.documents.count==1},done)
                })
            }
            self.createWindow(bootstrap:["kind":"new","command":"new"])
        }
        createWindow(bootstrap:["kind":"new","command":"new"])
    }
    func integrationTabs(_ document:DocumentWindow,_ done:@escaping()->Void){
        smokeReadyOverride={second in
            document.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
            let window=self.integrationMenu("Window")
            self.check(document.window.tabbingIdentifier==second.window.tabbingIdentifier,"document windows share a tabbing identity")
            document.window.addTabbedWindow(second.window,ordered:.above)
            self.check(document.window.tabbedWindows?.count==2 && document.window.tabGroup?.windows.count==2,"two document windows join one native tab group")
            second.window.makeKeyAndOrderFront(nil)
            self.until("second tab active",{NSApp.activate(ignoringOtherApps:true);second.window.makeKeyAndOrderFront(nil);return NSApp.keyWindow===second.window}){
                self.check(self.active===second,"menu commands target the selected tab")
                NSApp.sendAction(#selector(NSWindow.selectNextTab(_:)),to:nil,from:window)
                self.until("next tab",{NSApp.keyWindow===document.window}){
                    self.check(self.active===document,"Show Next Tab moves key focus between document tabs")
                    second.window.makeKeyAndOrderFront(nil)
                    self.until("second key",{NSApp.activate(ignoringOtherApps:true);second.window.makeKeyAndOrderFront(nil);return NSApp.keyWindow===second.window}){
                        NSApp.sendAction(#selector(NSWindow.moveTabToNewWindow(_:)),to:nil,from:window)
                        self.until("detached",{(second.window.tabbedWindows?.count ?? 1)<=1}){
                            self.check(self.documents.count==2 && !(document.window.tabbedWindows?.contains(second.window) ?? false),"Move Tab to New Window detaches one document")
                            NSApp.sendAction(#selector(NSWindow.mergeAllWindows(_:)),to:nil,from:window)
                            self.until("merged",{document.window.tabbedWindows?.count==2}){
                                self.check(true,"Merge All Windows gathers document windows into tabs")
                                second.window.performClose(nil)
                                self.until("tab closed",{self.documents.count==1}){
                                    self.check(self.documents.first===document && document.window.isVisible,"closing one tab keeps its sibling document open")
                                    self.integrationTabRestore(document,done)
                                }
                            }
                        }
                    }
                }
            }
        }
        createWindow(bootstrap:["kind":"new","command":"new"])
    }
}
