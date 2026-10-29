import AppKit
import WebKit

/** Actual two-WKWebView acceptance; uses a private NSPasteboard, never the user's clipboard. */
extension Studio {
    func clipboardWait(_ document:DocumentWindow,_ condition:String,_ completion:@escaping()->Void){
        smokeJS(document,"for(let i=0;i<100;i++){if(\(condition))return true;await new Promise(r=>setTimeout(r,25));}throw Error('Clipboard UI condition timed out: '+\(json(condition)));"){_ in completion()}
    }
    func clipboardFixture()->String {
        func layer(_ id:String,_ type:String,_ name:String,_ parent:Any=NSNull(),_ x:Int=100,_ y:Int=100)->[String:Any]{return ["id":id,"type":type,"name":name,"parentId":parent,"x":x,"y":y,"width":200,"height":100,"rotation":0,"fill":"#e4d8f5","stroke":"","strokeWidth":2,"opacity":1,"radius":0,"visible":true,"locked":false,"text":"Base","fontSize":24,"fontFamily":"Inter","fontWeight":400,"textAlign":"left","lineHeight":1.3,"letterSpacing":0,"path":"","points":[],"image":"","shadow":false,"blur":0,"layout":"none","gap":16,"padding":24,"columns":3,"clip":false,"componentId":NSNull(),"targetId":NSNull(),"gradient":false]}
        var main=layer("clipboard-main","component","Clipboard main"),label=layer("clipboard-label","text","Clipboard label","clipboard-main",110,110),instance=layer("clipboard-instance","instance","Clipboard instance",NSNull(),400,200),copy=layer("clipboard-instance-label","text","Clipboard label","clipboard-instance",410,210)
        main["componentMetadata"]=["properties":[["id":"title","name":"Title","type":"text","targetId":"clipboard-label","defaultValue":"Base","description":""]]]
        label["height"]=32;copy["height"]=32;copy["text"]="Clipboard override";copy["sourceId"]="clipboard-label";copy["instanceRootId"]="clipboard-instance";copy["overrideKeys"]=["text"]
        instance["componentId"]="clipboard-main";instance["sourceId"]="clipboard-main";instance["overrideKeys"]=[];instance["propertyValues"]=["title":"Clipboard override"]
        return json(["format":"oanarina-ui","version":2,"id":"native-clipboard-source","name":"Clipboard source","updatedAt":"2026-10-29T00:00:00.000Z","colors":[],"pages":[["id":"clipboard-art","name":"Artwork","nodes":[instance,copy],"comments":[]],["id":"clipboard-library","name":"Library","nodes":[main,label],"comments":[]]]])
    }
    func runClipboardSmoke(_ source:DocumentWindow){
        guard smokeStage==0 else{return};smokeStage=1
        DispatchQueue.main.asyncAfter(deadline:.now()+40){if !self.smokeFinishing{self.smokeFail("Clipboard acceptance timeout")}}
        smokeDirectory=FileManager.default.temporaryDirectory.appendingPathComponent("forma-clipboard-smoke-"+UUID().uuidString,isDirectory:true)
        do{try FileManager.default.createDirectory(at:smokeDirectory!,withIntermediateDirectories:true)}catch{smokeFail(error.localizedDescription)}
        source.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
        smokeJS(source,"return await window.__studioDocument(\(json(clipboardFixture())));"){value in
            self.check(value as? Bool==true,"source synthetic document opened")
            self.smokeJS(source,"window.__studioCommand('select-all');return true;"){_ in
                source.command("copy")
                self.clipboardWait(source,"document.body.textContent.includes('Selection copied to the Mac clipboard.')"){
                    guard let raw=try? NodePasteboard.read(from:self.nodePasteboard)["data"],let bytes=raw.data(using:.utf8),let payload=try? JSONSerialization.jsonObject(with:bytes) as? [String:Any],let project=payload["project"] as? [String:Any],let pages=project["pages"] as? [[String:Any]] else{self.smokeFail("custom clipboard representation")}
                    self.check(pages.count==2,"native Copy includes component dependencies")
                    self.check(self.nodePasteboard.availableType(from:[NodePasteboard.svg]) != nil && self.nodePasteboard.availableType(from:[.string]) != nil,"native Copy publishes SVG and text fallbacks")
                    let changeCount=self.nodePasteboard.changeCount,revision=source.state?.revision
                    self.smokeJS(source,"[...document.querySelectorAll('.pages-list button')].find(b=>b.textContent.includes('Library')).click();window.__studioCommand('select-all');return true;"){_ in
                        source.command("cut")
                        self.clipboardWait(source,"document.body.textContent.includes('Instances or other layers still use this main component.')"){
                            self.check(self.nodePasteboard.changeCount==changeCount && source.state?.revision==revision,"referenced-main Cut preserves source and pasteboard before write")
                            self.smokeJS(source,"[...document.querySelectorAll('.pages-list button')].find(b=>b.textContent.includes('Artwork')).click();window.__studioCommand('select-all');return true;"){_ in
                                self.smokeReadyOverride={destination in self.clipboardDestination(source,destination)}
                                self.createWindow(bootstrap:["kind":"new","command":"new"])
                            }
                        }
                    }
                }
            }
        }
    }
    func clipboardDestination(_ source:DocumentWindow,_ destination:DocumentWindow){
        destination.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true);destination.command("paste")
        clipboardWait(destination,"document.querySelectorAll('.layer-row').length===2"){
            self.smokeJS(destination,"window.__studioCommand('rotate-right');return true;"){_ in
                destination.session.file=self.smokeDirectory!.appendingPathComponent("Pasted.oui")
                self.smokeJS(destination,"return await window.__studioSave();"){value in
                    self.check(value as? Bool==true,"pasted artwork saves through acknowledged native write")
                    do{let data=try ProjectFileSafety.readBounded(destination.session.file!),doc=try JSONSerialization.jsonObject(with:data) as! [String:Any],pages=doc["pages"] as! [[String:Any]],nodes=pages.flatMap{$0["nodes"] as! [[String:Any]]},instance=nodes.first{$0["type"] as? String=="instance"}!,mainId=instance["componentId"] as! String
                        self.check(mainId != "clipboard-main" && nodes.contains{$0["id"] as? String==mainId && $0["type"] as? String=="component"},"cross-window instance references freshly remapped local main")
                        self.check(instance["rotation"] as? Int==90,"pasted layer remains editable")
                        self.check(nodes.contains{$0["instanceRootId"] as? String==instance["id"] as? String && $0["text"] as? String=="Clipboard override"},"instance text override survives native transfer and save")
                    }catch{self.smokeFail(error.localizedDescription)}
                    self.smokeJS(destination,"window.__studioCommand('undo');window.__studioCommand('undo');return true;"){_ in
                        self.clipboardWait(destination,"document.querySelectorAll('.layer-row').length===0"){
                            self.check(true,"one paste undo removes artwork plus dependencies after edit undo")
                            source.window.makeKeyAndOrderFront(nil);source.command("cut")
                            self.clipboardWait(source,"document.querySelectorAll('.layer-row').length===0"){
                                self.check(true,"native Cut removes source only after successful pasteboard write")
                                self.clipboardExternalTests(destination)
                            }
                        }
                    }
                }
            }
        }
    }
    func clipboardExternalTests(_ destination:DocumentWindow){
        destination.window.makeKeyAndOrderFront(nil)
        smokeJS(destination,"try{await window.desktop.clipboardRead();return false}catch{return true}"){value in
            self.check(value as? Bool==true,"ungranted public bridge read rejected")
            self.smokeJS(destination,"try{await window.webkit.messageHandlers.studio.postMessage({type:'clipboardRead',nonce:'forged',token:'forged'});return false}catch{return true}"){value in
                self.check(value as? Bool==true,"forged clipboard nonce rejected")
                let item=NSPasteboardItem();item.setString("External native text",forType:.string);self.nodePasteboard.clearContents();self.nodePasteboard.writeObjects([item]);destination.command("paste")
                self.clipboardWait(destination,"document.querySelectorAll('.layer-row').length===1 && document.body.textContent.includes('External native text')"){
                    self.check(true,"external plain text becomes editable text instead of stale local layers")
                    let before=destination.state?.revision,invalid=NSPasteboardItem();invalid.setString("{}",forType:NodePasteboard.nodes);invalid.setString("Must not fall back",forType:.string);self.nodePasteboard.clearContents();self.nodePasteboard.writeObjects([invalid]);destination.command("paste")
                    self.clipboardWait(destination,"document.body.textContent.includes('Invalid Forma clipboard data.')"){
                        self.check(destination.state?.revision==before,"malformed custom UTI does not mutate document or fall back")
                        let svg=NSPasteboardItem();svg.setString("<svg xmlns='http://www.w3.org/2000/svg' width='60' height='40'><rect width='60' height='40'/></svg>",forType:NodePasteboard.svg);self.nodePasteboard.clearContents();self.nodePasteboard.writeObjects([svg]);destination.command("paste")
                        self.clipboardWait(destination,"document.querySelector('[role=dialog]') && document.body.textContent.includes('Import editable layers')"){
                            self.check(true,"external SVG reaches validated import review")
                            self.smokeJS(destination,"[...document.querySelectorAll('button')].find(b=>b.textContent==='Cancel SVG import').click();return true;"){_ in
                                self.smokeFinishing=true;for document in Array(self.documents){document.closeApproved()};self.nodePasteboard.releaseGlobally();if let directory=self.smokeDirectory{try? FileManager.default.removeItem(at:directory)}
                                print(self.json(["nativeClipboard":true,"checks":self.smokeChecks,"count":self.smokeChecks.count]));fflush(stdout);self.smokeTerminate()
                            }
                        }
                    }
                }
            }
        }
    }
}
