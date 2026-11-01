import AppKit
import WebKit
import Darwin

/** Opt-in native integration checks. Smoke runs use an isolated, nonpersistent WebKit store. */
extension Studio {
    // Sheet completion callbacks can run before AppKit has unwound the previous
    // modal/termination loop. Start the next synthetic Quit from the default loop.
    func lifecycleQuitWhenIdle(_ document:DocumentWindow,deadline:TimeInterval?=nil){
        let end=deadline ?? ProcessInfo.processInfo.systemUptime+5
        let timer=Timer(timeInterval:0.05,repeats:false){_ in
            if !self.quitting && !document.closing && document.window.attachedSheet==nil && NSApp.modalWindow==nil{NSApp.terminate(nil)}
            else if ProcessInfo.processInfo.systemUptime>=end{self.smokeFail("Lifecycle Quit did not return to idle after cancellation")}
            else{self.lifecycleQuitWhenIdle(document,deadline:end)}
        }
        RunLoop.main.add(timer,forMode:.default)
    }
    func finishLifecycleSmoke(){
        guard smokeFinishing,smokeChecks.count==37,documents.isEmpty else{smokeFail("Lifecycle terminated before completion (\(smokeChecks.count)/37 checks, stage \(smokeStage))")}
        print(json(["nativeLifecycle":true,"checks":smokeChecks,"count":smokeChecks.count]));fflush(stdout)
    }
    func smokeTerminate(){let timer=Timer(timeInterval:0,repeats:false){_ in NSApp.terminate(nil)};RunLoop.main.add(timer,forMode:.common);RunLoop.main.add(timer,forMode:.modalPanel)}
    func smokeFail(_ message:String)->Never {fputs("Native smoke failed: \(message)\n",stderr);exit(1)}
    func check(_ condition:Bool,_ name:String){if !condition{smokeFail(name)};smokeChecks.append(name)}
    func smokeJS(_ document:DocumentWindow,_ source:String,_ completion:@escaping(Any)->Void){document.web.callAsyncJavaScript(source,arguments:[:],in:nil,in:.page){result in switch result{case .success(let value):completion(value);case .failure(let error):self.smokeFail(((error as NSError).userInfo["WKJavaScriptExceptionMessage"] as? String ?? error.localizedDescription)+" in "+source.prefix(160))}}}
    func runSmoke(_ document:DocumentWindow){
        if let complete=smokeReadyOverride{smokeReadyOverride=nil;complete(document);return}
        if CommandLine.arguments.contains("--acceptance-smoke-test"){runAcceptanceSmoke(document);return}
        if CommandLine.arguments.contains("--fig-import-smoke-test"){runFigImportSmoke(document);return}
        if CommandLine.arguments.contains("--integration-smoke-test"){runIntegrationSmoke(document);return}
        if CommandLine.arguments.contains("--clipboard-smoke-test"){runClipboardSmoke(document);return}
        if CommandLine.arguments.contains("--lifecycle-smoke-test"){runLifecycleSmoke(document);return}
        if CommandLine.arguments.contains("--renderer-restart-smoke-test"){runRendererRestartSmoke(document);return}
        guard smokeStage==0 else{return};smokeStage=1
        verifyNavigationMenu(document){
            self.smokeJS(document,"const features=await fetch('./features.json').then(r=>r.json());const fonts=await fetch('./font-catalog.json').then(r=>r.json());const installed=await window.desktop.fonts();if(features.length<1000||fonts.families.length<1900||installed.length===0||document.querySelectorAll('button').length<50)throw Error('Native smoke check failed');return JSON.stringify({videoMp4:typeof MediaRecorder!=='undefined'&&MediaRecorder.isTypeSupported('video/mp4'),videoWebM:typeof MediaRecorder!=='undefined'&&MediaRecorder.isTypeSupported('video/webm'),canvasCapture:typeof HTMLCanvasElement.prototype.captureStream==='function',title:document.title,buttons:document.querySelectorAll('button').length,bridge:!!window.desktop,features:features.length,googleFonts:fonts.families.length,installedFonts:installed.length});"){value in guard let text=value as? String,let data=text.data(using:.utf8),var report=(try? JSONSerialization.jsonObject(with:data)) as? [String:Any] else{self.smokeFail("standard renderer smoke report")};report["nativeNavigation"]=Array(self.smokeChecks.prefix(7));report["nativeTextSearch"]=Array(self.smokeChecks.dropFirst(7));print(self.json(report));fflush(stdout);self.smokeTerminate()}
        }
    }
    // Kills the real WebContent process and requires the same window to return on the same document.
    func runRendererRestartSmoke(_ document:DocumentWindow){
        guard smokeStage==0 else{return};smokeStage=1
        guard let id=document.state?.id else{smokeFail("renderer restart baseline")}
        guard let pid=document.web.value(forKey:"_webProcessIdentifier") as? Int32,pid>0 else{smokeFail("renderer process identity")}
        smokeJS(document,"window.__beforeRendererExit=true;return true;"){_ in
            let timer=Timer(timeInterval:1.5,repeats:false){_ in
                self.smokeReadyOverride={restored in
                    self.check(restored===document,"same window after renderer exit")
                    self.check(restored.state?.id==id,"same document after renderer exit")
                    self.smokeJS(restored,"for(let i=0;i<100&&!document.querySelector('[data-canvas]');i++)await new Promise(r=>setTimeout(r,50));return window.__beforeRendererExit===undefined&&!!document.querySelector('[data-canvas]');"){value in
                        self.check(value as? Bool==true,"fresh renderer drew the editor")
                        print(self.json(["rendererRestart":true,"checks":self.smokeChecks]));fflush(stdout);self.smokeTerminate()
                    }
                }
                guard Darwin.kill(pid,SIGKILL)==0 else{self.smokeFail("renderer process signal")}
            }
            RunLoop.main.add(timer,forMode:.default)
        }
    }
    // Exercise real AppKit menu key equivalents against the isolated renderer camera.
    func verifyNavigationMenu(_ document:DocumentWindow,_ completion:@escaping()->Void){
        guard let view=NSApp.mainMenu?.items.first(where:{$0.title=="View"})?.submenu else{smokeFail("native View menu")}
        for (id,key) in [("previous-viewport",String(UnicodeScalar(0xF702)!)),("next-viewport",String(UnicodeScalar(0xF703)!)),("find-selection","f")]{
            guard let item=view.items.first(where:{$0.representedObject as? String==id}) else{smokeFail("native navigation command registered")}
            check(item.keyEquivalent==key && item.keyEquivalentModifierMask==[.option,.command] && item.target===self && item.action == #selector(menuAction(_:)),"native shortcut registered: \(id)")
        }
        let read="return await new Promise((resolve,reject)=>{const end=performance.now()+5000;function tick(){const value=document.querySelector('svg.canvas > g[transform]')?.getAttribute('transform');if(value){resolve(value);return;}if(performance.now()>end){reject(Error('Canvas did not mount after native ready'));return;}setTimeout(tick,25);}tick();});"
        smokeJS(document,read){value in
            guard let initial=value as? String,!initial.isEmpty else{self.smokeFail("initial camera transform")}
            let dirty=document.state?.dirty
            self.command("zoom-in")
            self.waitForCamera(document,initial,equal:false){zoomed in
                self.check(zoomed != initial,"native Zoom in reaches renderer")
                self.performNavigationKey(0xF702,keyCode:123)
                self.waitForCamera(document,initial,equal:true){_ in
                    self.check(true,"native Option-Command-Left restores camera")
                    self.performNavigationKey(0xF703,keyCode:124)
                    self.waitForCamera(document,zoomed,equal:true){_ in
                        self.check(document.state?.dirty==dirty,"native camera history keeps document dirty state")
                        self.check(true,"native Option-Command-Right restores forward camera")
                        self.verifyTextSearchMenu(document,completion)
                    }
                }
            }
        }
    }
    func verifyTextSearchMenu(_ document:DocumentWindow,_ completion:@escaping()->Void){
        guard let text=NSApp.mainMenu?.items.first(where:{$0.title=="Text"})?.submenu,let item=text.items.first(where:{$0.representedObject as? String=="text-find"}) else{smokeFail("native Text Find menu")}
        check(item.keyEquivalent=="f" && item.keyEquivalentModifierMask==[.command],"native Find uses Command-F only")
        let dirty=document.state?.dirty
        func findKey(){guard let event=NSEvent.keyEvent(with:.keyDown,location:.zero,modifierFlags:[.command],timestamp:ProcessInfo.processInfo.systemUptime,windowNumber:0,context:nil,characters:"f",charactersIgnoringModifiers:"f",isARepeat:false,keyCode:3),NSApp.mainMenu?.performKeyEquivalent(with:event)==true else{self.smokeFail("AppKit Find key dispatch")}}
        findKey()
        let wait="return await new Promise((resolve,reject)=>{const end=performance.now()+5000;function tick(){const input=document.querySelector('.text-search-dialog input[type=search]');if(input&&document.activeElement===input){resolve(true);return;}if(performance.now()>end){reject(Error('Native Find did not focus query'));return;}setTimeout(tick,25);}tick();});"
        smokeJS(document,wait){_ in
            self.check(true,"native Command-F opens focused text search")
            self.smokeJS(document,"const query=document.querySelector('.text-search-dialog input[type=search]');query.value='native query';query.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.text-search-dialog textarea').focus();return true;"){_ in
                findKey()
                self.smokeJS(document,wait){_ in
                    self.check(true,"repeated native Command-F refocuses query")
                    self.smokeJS(document,"const input=document.querySelector('.text-search-dialog input[type=search]');if(input.selectionStart!==0||input.selectionEnd!==input.value.length)throw Error('Find query not selected');input.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return await new Promise((resolve,reject)=>{const end=performance.now()+5000;function tick(){if(!document.querySelector('.text-search-dialog')){resolve(true);return;}if(performance.now()>end){reject(Error('Find did not close'));return;}setTimeout(tick,25);}tick();});"){_ in
                        self.check(true,"native Find selects query and closes with Escape")
                        self.check(document.state?.dirty==dirty,"native Find keeps document dirty state")
                        completion()
                    }
                }
            }
        }
    }
    func performNavigationKey(_ scalar:UInt32,keyCode:UInt16){
        let key=String(UnicodeScalar(scalar)!)
        guard let event=NSEvent.keyEvent(with:.keyDown,location:.zero,modifierFlags:[.option,.command],timestamp:ProcessInfo.processInfo.systemUptime,windowNumber:0,context:nil,characters:key,charactersIgnoringModifiers:key,isARepeat:false,keyCode:keyCode),NSApp.mainMenu?.performKeyEquivalent(with:event)==true else{smokeFail("AppKit navigation key dispatch")}
    }
    func waitForCamera(_ document:DocumentWindow,_ expected:String,equal:Bool,_ completion:@escaping(String)->Void){
        let source="const expected=\(json(expected)),equal=\(equal ? "true":"false");return await new Promise((resolve,reject)=>{const end=performance.now()+5000;function tick(){const current=document.querySelector('svg.canvas > g[transform]')?.getAttribute('transform');if(typeof current==='string'&&((current===expected)===equal)){resolve(current);return;}if(performance.now()>end){reject(Error('Native camera command did not settle'));return;}setTimeout(tick,25);}tick();});"
        smokeJS(document,source){value in guard let result=value as? String else{self.smokeFail("camera response")};completion(result)}
    }
    func verifySavedRestore(_ closed:DocumentWindow,_ completion:@escaping()->Void){
        guard let file=closed.session.file else{smokeFail("saved restore fixture")}
        do{var external=try JSONSerialization.jsonObject(with:Data(contentsOf:file)) as! [String:Any];external["name"]="Disk revision after close";try JSONSerialization.data(withJSONObject:external).write(to:file,options:.atomic)}catch{smokeFail(error.localizedDescription)}
        smokeReadyOverride={restored in
            self.check(restored.state?.name=="Disk revision after close" && restored.state?.dirty==false,"clean saved-session restore loads changed disk contents")
            self.check(restored.session.fingerprint==(try? ProjectFileSafety.current(file)),"restored disk revision becomes save baseline")
            restored.closeApproved();completion()
        }
        restore(closed.session)
    }
    func verifyDiskPrimitives(){
        let directory=smokeDirectory!,regular=directory.appendingPathComponent("bounded-file"),symlink=directory.appendingPathComponent("symbolic-file"),fifo=directory.appendingPathComponent("fifo-file"),large=directory.appendingPathComponent("large-file")
        do{
            try Data("bounded input".utf8).write(to:regular)
            try FileManager.default.createSymbolicLink(atPath:symlink.path,withDestinationPath:regular.path)
            do{_ = try ProjectFileSafety.readBounded(symlink);smokeFail("symbolic input accepted")}catch{check(true,"bounded project read rejects symlinks")}
            guard mkfifo(fifo.path,mode_t(0o600))==0 else{smokeFail("FIFO fixture")}
            do{_ = try ProjectFileSafety.readBounded(fifo);smokeFail("FIFO input accepted")}catch{check(true,"FIFO project read rejects without blocking")}
            FileManager.default.createFile(atPath:large.path,contents:Data());let handle=try FileHandle(forWritingTo:large);try handle.truncate(atOffset:50_000_000);try handle.close()
            do{_ = try ProjectFileSafety.readBounded(large);smokeFail("oversize input accepted")}catch{check(true,"bounded project read rejects oversized file")}
            let missing=directory.appendingPathComponent("missing.oui")
            if case .conflict(nil)=try ProjectFileSafety.write(Data("draft".utf8),to:missing,expected:"previous-revision",checkRevision:true){check(!FileManager.default.fileExists(atPath:missing.path),"external deletion requires explicit overwrite")}else{smokeFail("missing saved project overwritten")}
        }catch{smokeFail(error.localizedDescription)}
    }
    func verifyBundledDownload(_ document:DocumentWindow,_ completion:@escaping()->Void){
        smokeBundleCompletion={name,response in
            self.check(name=="oanarina-mcp.zip"&&response == .cancel,"native MCP bundled ZIP opens cancellable save panel")
            DispatchQueue.main.asyncAfter(deadline:.now()+0.1){completion()}
        }
        smokeJS(document,"const link=document.createElement('a');link.href='./oanarina-mcp.zip';link.download='oanarina-mcp.zip';document.body.appendChild(link);link.click();link.remove();return true;"){_ in}
    }
    func verifySaveGuards(_ document:DocumentWindow,_ completion:@escaping()->Void){
        guard let url=document.session.file,let original=try? Data(contentsOf:url),let raw=String(data:original,encoding:.utf8),let before=document.state else{smokeFail("save guard fixture")}
        document.ready=false;document.command("page")
        document.save(["name":"First.oui","data":raw]){value,error in
            self.check(error != nil && (try? Data(contentsOf:url))==original,"pre-ready save rejected without changing bytes")
            document.ready=true
            let id=document.session.documentId;document.session.documentId="wrong-window-identity"
            document.save(["name":"First.oui","data":raw]){value,error in
                self.check(error != nil && (try? Data(contentsOf:url))==original,"mismatched session save rejected")
                document.session.documentId=id
                self.smokeJS(document,"return await window.__studioState();"){state in
                    self.check((state as? [String:Any])?["revision"] as? Int==before.revision,"pre-ready menu command ignored")
                    let lock=URL(fileURLWithPath:url.path+".oanarina-mcp.lock")
                    do{try Data("native test lock".utf8).write(to:lock)}catch{self.smokeFail(error.localizedDescription)}
                    document.save(["name":"First.oui","data":raw]){value,error in
                        self.check(error != nil && (try? Data(contentsOf:url))==original,"MCP lock prevents native overwrite")
                        try? FileManager.default.removeItem(at:lock)
                        do{var external=try JSONSerialization.jsonObject(with:original) as! [String:Any];external["name"]="External revision";try JSONSerialization.data(withJSONObject:external).write(to:url,options:.atomic)}catch{self.smokeFail(error.localizedDescription)}
                        let external=try! Data(contentsOf:url)
                        self.smokeConflictResponses=[0]
                        self.smokeJS(document,"return await window.__studioSave();"){value in
                            self.check(value as? Bool==false && (try? Data(contentsOf:url))==external,"external conflict Cancel preserves external bytes")
                            self.smokeConflictResponses=[1];self.smokeCancelSavePanels=true
                            self.smokeJS(document,"return await window.__studioSave();"){value in
                                self.check(value as? Bool==false && (try? Data(contentsOf:url))==external,"external conflict Save As cancellation preserves external bytes")
                                self.smokeCancelSavePanels=false;self.smokeConflictResponses=[2]
                                self.smokeJS(document,"return await window.__studioSave();"){value in
                                    self.check(value as? Bool==true && (try? Data(contentsOf:url))==original,"explicit Overwrite replaces approved external revision")
                                    self.verifyBundledDownload(document,completion)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    func runLifecycleSmoke(_ document:DocumentWindow){
        if smokeStage==0 {
            smokeStage=1
            smokeDirectory=FileManager.default.temporaryDirectory.appendingPathComponent("oanarina-native-lifecycle-"+UUID().uuidString,isDirectory:true)
            do{try FileManager.default.createDirectory(at:smokeDirectory!,withIntermediateDirectories:true)}catch{smokeFail(error.localizedDescription)}
            DispatchQueue.main.asyncAfter(deadline:.now()+45){if !self.smokeFinishing{self.smokeFail("Lifecycle timeout at stage \(self.smokeStage)")}}
            verifyDiskPrimitives()
            check(document.state?.dirty==false,"new window starts clean")
            smokeJS(document,"return await window.desktop.newWindow('new-whiteboard');"){_ in}
        } else if smokeStage==1 {
            smokeStage=2;guard let first=documents.first,first !== document else{smokeFail("second independent window missing")}
            check(first.web !== document.web && documents.count==2,"independent WKWebViews")
            check(first.state?.id != document.state?.id,"unique new document identities")
            check(document.state?.name=="Untitled whiteboard","new workspace routes into new window")
            first.session.file=smokeDirectory!.appendingPathComponent("First.oui")
            smokeJS(first,"window.__studioCommand('page');await new Promise(r=>setTimeout(r,80));if(!await window.__studioSave())throw Error('Save did not complete');return await window.__studioState();"){value in
                guard let result=value as? [String:Any] else{self.smokeFail("save state result")};self.check(result["dirty"] as? Bool==false,"save completion clears dirty state")
                self.verifySaveGuards(first){
                self.check(document.state?.dirty==false,"saving first window leaves second clean")
                let url=first.session.file!;self.check(FileManager.default.fileExists(atPath:url.path),"project bytes written")
                let previous=self.documents.count;_ = self.openURL(url);self.check(self.documents.count==previous,"opening an existing file focuses its window")
                self.smokeJS(first,"window.__studioCommand('page');return await window.__studioState();"){_ in
                    self.smokeAlertResponse=1
                    first.requestClose{allowed in
                        self.check(!allowed && self.documents.contains(where:{$0===first}),"Cancel keeps dirty window open")
                        self.smokeAlertResponse=0
                        DispatchQueue.main.asyncAfter(deadline:.now()+0.1){first.requestClose{allowed in
                            self.check(allowed && first.state?.dirty==false,"Save close awaits saved acknowledgment")
                            first.closeApproved();self.check(self.documents.count==1,"closing one window leaves its peer")
                            self.verifySavedRestore(first){self.smokeJS(document,"window.__studioCommand('page');return await window.__studioState();"){_ in
                                self.smokeAlertResponse=2
                                DispatchQueue.main.asyncAfter(deadline:.now()+0.1){document.requestClose{allowed in
                                    self.check(allowed,"Dont Save explicitly approves close")
                                    document.closeApproved();self.check(self.documents.isEmpty,"last document closes without quitting app")
                                    self.command("reopen-closed")
                                }}
                            }}
                        }}
                    }
                }
                }
            }
        } else if smokeStage==2 {
            smokeStage=3
            check(document.state?.name=="Untitled whiteboard" && document.state?.dirty==true,"reopen closed window restores its own dirty recovery")
            smokeJS(document,"return {ids:await window.desktop.openDocumentIds(),state:await window.__studioState()};"){value in
                guard let result=value as? [String:Any],let ids=result["ids"] as? [String] else{self.smokeFail("open document identities")}
                self.check(ids==[document.state!.id],"open document API reflects live windows")
                self.smokeAlertResponse=0;self.smokeCancelSavePanels=true
                document.requestClose{allowed in
                    self.smokeCancelSavePanels=false
                    self.check(!allowed && document.state?.dirty==true,"cancelled save panel prevents close")
                    self.smokeAlertResponse=1
                    self.smokeQuitResult={allowed in
                        self.check(!allowed && self.documents.count==1,"cancelled dirty quit preserves window")
                        self.smokeQuitResult=nil
                        document.lastCloseDiscarded=true
                        self.check(self.sessionForQuit(document)==nil,"discarded unsaved draft does not restore automatically")
                        document.session.file=self.smokeDirectory!.appendingPathComponent("Second.oui")
                        let discarded=self.sessionForQuit(document)!
                        self.check(discarded.reopenFromFile && !discarded.dirty,"discarded saved session restores disk version")
                        self.check(WindowSession(discarded.record)?.documentId==discarded.documentId,"window session metadata roundtrips")
                        document.lastCloseDiscarded=false
                        self.smokeAlertResponse=0
                        self.smokeQuitResult={allowed in
                            self.check(allowed && self.documents.isEmpty,"successful Quit saves and closes remaining window")
                            self.check(self.quitSessions.count==1 && !self.quitSessions[0].dirty,"successful Quit retains clean session for relaunch")
                            self.check(FileManager.default.fileExists(atPath:document.session.file!.path),"Quit Save wrote project bytes")
                            self.smokeQuitResult=nil;self.smokeFinishing=true
                            if let directory=self.smokeDirectory{try? FileManager.default.removeItem(at:directory)}
                        }
                        self.lifecycleQuitWhenIdle(document)
                    }
                    self.lifecycleQuitWhenIdle(document)
                }
            }
        }
    }
}

/** Synthetic bytes supplied by the test runner; no user project or persistent app state is used. */
extension Studio {
    func runFigImportSmoke(_ initial:DocumentWindow){
        guard smokeStage==0 else{return};smokeStage=1
        guard let raw=ProcessInfo.processInfo.environment["FORMA_SMOKE_FIG_BASE64"],raw.count<100_000,let data=Data(base64Encoded:raw) else{smokeFail("Missing bounded synthetic .fig fixture")}
        let directory=FileManager.default.temporaryDirectory.appendingPathComponent("forma-native-fig-"+UUID().uuidString,isDirectory:true),source=directory.appendingPathComponent("Synthetic.fig"),destination=directory.appendingPathComponent("Converted.oui")
        do{try FileManager.default.createDirectory(at:directory,withIntermediateDirectories:true);try data.write(to:source,options:.atomic)}catch{smokeFail(error.localizedDescription)}
        smokeDirectory=directory
        let fingerprint=ProjectFileSafety.fingerprint(data)
        DispatchQueue.main.asyncAfter(deadline:.now()+35){if !self.smokeFinishing{self.smokeFail("Native .fig import timed out")}}
        smokeReadyOverride={imported in
            self.check(imported !== initial && self.documents.count==2,"selected fig opens an independent document window")
            self.check(imported.session.file==nil && imported.session.dirty,"fig import starts unsaved without source save binding")
            self.check(imported.state?.dirty==true,"renderer reports imported project dirty before ready")
            self.check(imported.importedSource==source,"source reference stays native only")
            self.check(imported.bootstrap["data"]==nil,"selected binary payload released after ready")
            let count=self.documents.count;self.check(self.openURL(source)&&self.documents.count==count,"reopening selected fig focuses its imported window")
            self.smokeCancelSavePanels=true
            self.smokeJS(imported,"return await window.__studioSave();"){value in
                self.check(value as? Bool==false && imported.session.file==nil,"first Save requires a new destination and Cancel preserves unsaved state")
                self.check((try? ProjectFileSafety.current(source))==fingerprint,"cancelled Save leaves original fig bytes unchanged")
                self.smokeCancelSavePanels=false;imported.session.file=destination
                self.smokeJS(imported,"if(!await window.__studioSave())throw Error('Converted .oui save failed');return await window.__studioState();"){value in
                    guard let state=value as? [String:Any] else{self.smokeFail("Converted project state missing")}
                    self.check(state["dirty"] as? Bool==false,"successful converted oui save clears dirty state")
                    self.check((try? self.readProject(destination)) != nil,"converted oui passes native saved-project validation")
                    self.check((try? ProjectFileSafety.current(source))==fingerprint,"successful converted save leaves original fig unchanged")
                    imported.session.file=source
                    self.smokeJS(imported,"return await window.__studioSave();"){value in
                        self.check(value as? Bool==false,"native save refuses a fig source destination even if misbound")
                        self.check((try? ProjectFileSafety.current(source))==fingerprint,"refused fig overwrite preserves exact source fingerprint")
                        self.smokeFinishing=true
                        print(self.json(["nativeFigImport":true,"count":self.smokeChecks.count,"checks":self.smokeChecks]));fflush(stdout)
                        imported.closeApproved();initial.closeApproved();try? FileManager.default.removeItem(at:directory);self.smokeTerminate()
                    }
                }
            }
        }
        guard openURL(source) else{smokeFail("Synthetic fig could not be selected")}
    }
}
