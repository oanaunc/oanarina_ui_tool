import AppKit
import WebKit
import ImageIO

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
                                self.clipboardRasterTests(destination)
                            }
                        }
                    }
                }
            }
        }
    }
    func clipboardRasterFixture(_ tiff:Bool=false,type:String?=nil)->Data {
        let context=CGContext(data:nil,width:3,height:2,bitsPerComponent:8,bytesPerRow:12,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
        context.setFillColor(CGColor(red:0.8,green:0.2,blue:0.4,alpha:0.5));context.fill(CGRect(x:0,y:0,width:3,height:2))
        let output=NSMutableData(),destination=CGImageDestinationCreateWithData(output,(type ?? (tiff ? "public.tiff":"public.png")) as CFString,1,nil)!
        CGImageDestinationAddImage(destination,context.makeImage()!,[kCGImagePropertyOrientation:tiff ? 6:1] as CFDictionary);if !CGImageDestinationFinalize(destination){smokeFail("raster fixture")};return output as Data
    }
    func clipboardRasterTests(_ destination:DocumentWindow){
        let jpeg=NSPasteboardItem();jpeg.setData(clipboardRasterFixture(type:"public.jpeg"),forType:NodePasteboard.jpeg);nodePasteboard.clearContents();nodePasteboard.writeObjects([jpeg])
        let normalized=try? NodePasteboard.read(from:nodePasteboard);check(normalized?["kind"]=="image" && normalized?["data"]?.hasPrefix("data:image/png;base64,")==true,"native JPEG normalizes to a bounded PNG before reaching the editor")
        let forged=NSPasteboardItem();forged.setData(clipboardRasterFixture(),forType:NodePasteboard.jpeg);nodePasteboard.clearContents();nodePasteboard.writeObjects([forged]);check((try? NodePasteboard.read(from:nodePasteboard))==nil,"pasteboard data must match its declared image type")
        let image=NSPasteboardItem();image.setData(clipboardRasterFixture(),forType:.png);image.setString("Do not paste this fallback",forType:.string);nodePasteboard.clearContents();nodePasteboard.writeObjects([image]);destination.command("paste")
        clipboardWait(destination,"document.querySelectorAll('.layer-row').length===2 && document.body.textContent.includes('Pasted image')"){
            self.check(true,"native PNG takes precedence over text and creates an editable image")
            self.smokeJS(destination,"return await window.__studioSave();"){value in
                self.check(value as? Bool==true,"raster paste saves through native write")
                do{let data=try ProjectFileSafety.readBounded(destination.session.file!),doc=try JSONSerialization.jsonObject(with:data) as! [String:Any],pages=doc["pages"] as! [[String:Any]],nodes=pages.flatMap{$0["nodes"] as! [[String:Any]]},image=nodes.first{$0["type"] as? String=="image"}!
                    self.check(image["width"] as? Int==3 && image["height"] as? Int==2 && (image["image"] as? String)?.hasPrefix("data:image/png;base64,")==true,"saved PNG keeps dimensions and embedded pixels")
                }catch{self.smokeFail(error.localizedDescription)}
                self.smokeJS(destination,"window.__studioCommand('undo');return true;"){_ in
                    self.clipboardWait(destination,"document.querySelectorAll('.layer-row').length===1"){
                        self.check(true,"native raster paste is one undoable edit")
                        let tiff=NSPasteboardItem();tiff.setData(self.clipboardRasterFixture(true),forType:.tiff);self.nodePasteboard.clearContents();self.nodePasteboard.writeObjects([tiff]);destination.command("paste")
                        self.clipboardWait(destination,"document.querySelectorAll('.layer-row').length===2"){
                            self.smokeJS(destination,"return [...document.querySelectorAll('input')].find(e=>e.getAttribute('aria-label')==='W')?.value==='2' && [...document.querySelectorAll('input')].find(e=>e.getAttribute('aria-label')==='H')?.value==='3';"){value in
                                self.check(value as? Bool==true,"native TIFF first frame reaches editor with corrected orientation")
                                let before=destination.state?.revision,bad=NSPasteboardItem();bad.setData(Data("invalid PNG".utf8),forType:.png);bad.setString("Must not fall back",forType:.string);self.nodePasteboard.clearContents();self.nodePasteboard.writeObjects([bad]);destination.command("paste")
                                self.clipboardWait(destination,"document.body.textContent.includes('Clipboard image is invalid')"){
                                    self.check(destination.state?.revision==before,"invalid native raster preserves document without text fallback")
                                    self.clipboardPngCopyTests(destination)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    func clipboardPngCopyTests(_ document:DocumentWindow){
        let revision=document.state?.revision
        smokeJS(document,"document.querySelector('svg.canvas').focus();return true;"){_ in
            document.command("copy-as-png")
            self.clipboardWait(document,"document.body.textContent.includes('Selection copied as PNG to the Mac clipboard.')"){
                guard let item=self.nodePasteboard.pasteboardItems?.first,let data=item.data(forType:.png),let source=CGImageSourceCreateWithData(data as CFData,nil),let image=CGImageSourceCreateImageAtIndex(source,0,nil) else{self.smokeFail("Copy as PNG produces decodable public.png")}
                self.check(image.width==4 && image.height==6,"native Copy as PNG uses actual 2x pixel dimensions")
                self.check(item.types == [.png],"native Copy as PNG publishes only PNG without stale representations")
                let color=NSBitmapImageRep(cgImage:image).colorAt(x:2,y:3)!.usingColorSpace(.deviceRGB)!
                self.check(abs(color.alphaComponent-0.5)<0.04,"native Copy as PNG preserves rendered alpha")
                self.check(document.state?.revision==revision,"native Copy as PNG does not edit document state")
                let command=NSApp.mainMenu?.items.first(where:{$0.title=="Edit"})?.submenu?.items.first(where:{$0.representedObject as? String=="copy-as-png"})
                self.check(command?.keyEquivalent=="c" && command?.keyEquivalentModifierMask==[.command,.shift],"native Edit menu exposes Shift Command C")
                let count=self.nodePasteboard.changeCount
                self.smokeJS(document,"try{await window.desktop.clipboardWrite({png:'data:image/png;base64,AAAA'});return false}catch{return true}"){value in
                    self.check(value as? Bool==true && self.nodePasteboard.changeCount==count,"PNG write grant is single-use and replay preserves pasteboard")
                    document.command("paste")
                    self.clipboardWait(document,"document.querySelectorAll('.layer-row').length===3"){
                        self.smokeJS(document,"return [...document.querySelectorAll('input')].find(e=>e.getAttribute('aria-label')==='W')?.value==='4' && [...document.querySelectorAll('input')].find(e=>e.getAttribute('aria-label')==='H')?.value==='6';"){value in
                            self.check(value as? Bool==true,"copied PNG pastes as an editable native image")
                            self.smokeJS(document,"window.__studioCommand('undo');return true;"){_ in
                                self.clipboardWait(document,"document.querySelectorAll('.layer-row').length===2"){
                                    self.check(true,"copied PNG paste has one undo without a Copy history entry")
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
}
