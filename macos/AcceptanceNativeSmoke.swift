import AppKit
import WebKit
import ImageIO
import AVFoundation
import Darwin

/** Real-shell acceptance: the shipped renderer, real WKWebView, real panels and a real WebContent kill,
 * against synthetic projects in a temporary folder and a nonpersistent store. Each check asserts bytes,
 * pixels or editor state that came back through the real path. */
extension Studio {
    var acceptanceFilter:Set<String>? {ProcessInfo.processInfo.environment["FORMA_ACCEPTANCE"].map{Set($0.split(separator:",").map(String.init))}}
    func acceptanceSteps(_ document:DocumentWindow,_ directory:URL)->[(String,Step)] {
        return [("open-panel",{self.acceptOpenPanel(document,directory,$0)}),("save",{self.acceptSaveAs(document,directory,$0)}),("export",{self.acceptDesignExports(document,directory,$0)}),("folder",{self.acceptAssetFolder(document,directory,$0)}),("zip",{self.acceptProjectZips(document,directory,$0)}),("p3",{self.acceptDisplayP3(document,directory,$0)}),("shader",{self.acceptShaders(document,directory,$0)}),("code",{self.acceptCodeLayer(document,directory,$0)}),("painter",{self.acceptCodePainter(document,directory,$0)}),("plugin",{self.acceptPlugin(document,directory,$0)}),("widget",{self.acceptWidget(document,directory,$0)}),("video",{self.acceptVideo(document,directory,$0)}),("crash",{self.acceptCrash(document,directory,$0)}),("undo-reopen",{self.acceptUndoReopen(document,$0)}),("drop",{self.acceptDrop(document,directory,$0)}),("workflow",{self.acceptWorkflow(document,directory,$0)}),("sampler",{self.acceptSampler(document,$0)}),("fonts",{self.acceptInstalledFaces(document,$0)}),("ax",{self.acceptAccessibility(document,$0)}),("keyboard",{self.acceptKeyboard(document,$0)}),("interface",{self.acceptInterface(document,$0)}),("font-export",{self.acceptExportedFont(document,directory,$0)}),("pdf",{self.acceptPdfDrop(document,directory,$0)}),("sketch",{self.acceptSketchDrop(document,directory,$0)}),("drag",{self.acceptDragOut(document,directory,$0)})]
    }
    func runAcceptanceSmoke(_ initial:DocumentWindow){
        if let complete=smokeReadyOverride{smokeReadyOverride=nil;complete(initial);return}
        guard smokeStage==0 else{return};smokeStage=1
        later(420){if !self.smokeFinishing{self.smokeFail("Acceptance timeout after \(self.smokeChecks.count) checks: \(self.smokeChecks.last ?? "")")}}
        let directory=FileManager.default.temporaryDirectory.appendingPathComponent("forma-acceptance-"+UUID().uuidString,isDirectory:true);smokeDirectory=directory
        do{try FileManager.default.createDirectory(at:directory,withIntermediateDirectories:true)}catch{smokeFail(error.localizedDescription)}
        initial.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
        let chosen=acceptanceSteps(initial,directory).filter{acceptanceFilter?.contains($0.0) ?? true}
        runSteps(chosen.map{step in {next in fputs("acceptance group: "+step.0+"\n",stderr);step.1(next)}}){
            self.smokeFinishing=true;for document in Array(self.documents){document.closeApproved()};try? FileManager.default.removeItem(at:directory)
            print(self.json(["nativeAcceptance":true,"count":self.smokeChecks.count,"checks":self.smokeChecks]));fflush(stdout);exit(0)
        }
    }
    func acceptOpenPanel(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        js(document,"window.__fp=[];const i=document.createElement('input');i.type='file';i.multiple=true;i.id='accept-file';i.addEventListener('change',()=>window.__fp.push([...i.files].map(f=>[f.name,f.size,f.type])));i.addEventListener('cancel',()=>window.__fp.push('cancel'));document.body.appendChild(i);i.click();return true;"){_ in
            self.until("open panel appears",{self.smokeOpenPanels==1}){
                self.clipboardWait(document,"window.__fp.length===1 && window.__fp[0]==='cancel'"){
                    self.check(true,"input file click reaches a real NSOpenPanel and Cancel reports cancel")
                    let file=directory.appendingPathComponent("Chosen.png");do{try self.clipboardRasterFixture().write(to:file)}catch{self.smokeFail(error.localizedDescription)}
                    self.smokeOpenFiles=[file]
                    self.js(document,"document.getElementById('accept-file').click();return true;"){_ in
                        self.clipboardWait(document,"window.__fp.length===2"){
                            self.js(document,"const r=window.__fp[1],f=document.getElementById('accept-file').files[0],b=new Uint8Array(await f.arrayBuffer());document.getElementById('accept-file').remove();return {name:r[0][0],size:r[0][1],type:r[0][2],path:f.webkitRelativePath||'',full:Object.keys(f).length,head:b[1]};"){value in
                                guard let body=value as? [String:Any] else{self.smokeFail("file report")}
                                self.check(body["name"] as? String=="Chosen.png" && body["type"] as? String=="image/png" && body["head"] as? Int==0x50,"chosen file reaches the page with its real bytes")
                                self.check((body["path"] as? String)=="","the page receives no filesystem path")
                                done()
                            }
                        }
                    }
                }
            }
        }
    }
    func acceptSaveAs(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        smokeSaveDirectory=directory
        js(document,"await window.__studioCommand('page');await new Promise(r=>setTimeout(r,100));await window.__studioCommand('save-as');return true;"){_ in
            let target=directory.appendingPathComponent((document.state?.name ?? "Untitled")+".oui")
            self.until("Save As writes",{FileManager.default.fileExists(atPath:target.path)}){
                self.check(document.session.file?.lastPathComponent==target.lastPathComponent,"Save As binds the window to the panel destination")
                self.check((try? self.readProject(target)) != nil,"Save As bytes pass native project validation")
                document.session.file=nil;document.session.fingerprint=nil
                done()
            }
        }
    }
    /** Finds a control by accessible name, and names what exists when it is missing, so a renamed control fails loudly. */
    static let domHelpers="const names=r=>[...r.querySelectorAll('button,[role=tab],[role=menuitem]')].map(b=>(b.getAttribute('aria-label')||b.textContent).trim()).filter(Boolean),find=(name,r=document)=>[...r.querySelectorAll('button,[role=tab],[role=menuitem]')].find(b=>(b.getAttribute('aria-label')||b.textContent).trim()===name),click=(name,r=document)=>{const b=find(name,r);if(!b)throw Error('No control '+name+': '+names(r).slice(0,120).join(' | '));if(b.disabled)throw Error('Disabled control '+name);b.click();return true;},pick=(label,value)=>{const e=document.querySelector(`[aria-label=\"${label}\"]`);if(!e)throw Error('No field '+label);const set=Object.getOwnPropertyDescriptor(e.constructor.prototype,'value').set;set.call(e,value);e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));return true;},wait=async(test,what,ms=8000)=>{const end=performance.now()+ms;for(;;){const v=await test();if(v)return v;if(performance.now()>end)throw Error('Timed out: '+what+' / '+status()+' / '+document.body.innerText.slice(0,300));await new Promise(r=>setTimeout(r,25));}},status=()=>[...document.querySelectorAll('[role=status],[role=alert]')].map(e=>e.textContent).join(' | ');"
    func page(_ document:DocumentWindow,_ source:String,_ completion:@escaping(Any?)->Void){js(document,Self.domHelpers+source,completion)}
    func acceptanceDocument(_ id:String,_ name:String,extra:[String:Any]=[:],pageExtra:[String:Any]=[:],edit:((inout [[String:Any]])->Void)?=nil)->String {
        func layer(_ id:String,_ type:String,_ title:String,_ x:Int,_ y:Int,_ width:Int,_ height:Int,parent:Any=NSNull())->[String:Any]{return ["id":id,"type":type,"name":title,"parentId":parent,"x":x,"y":y,"width":width,"height":height,"rotation":0,"fill":"#e4d8f5","stroke":"","strokeWidth":2,"opacity":1,"radius":0,"visible":true,"locked":false,"text":"Base","fontSize":24,"fontFamily":"Inter","fontWeight":400,"textAlign":"left","lineHeight":1.3,"letterSpacing":0,"path":"","points":[],"image":"","shadow":false,"blur":0,"layout":"none","gap":16,"padding":24,"columns":3,"clip":false,"componentId":NSNull(),"targetId":NSNull(),"gradient":false]}
        var card=layer("accept-rect","rectangle","Card",120,120,120,80,parent:"accept-frame");card["fill"]="#ff0000"
        var nodes=[layer("accept-frame","frame","Frame one",100,100,200,160),card,layer("accept-text","text","Label",120,210,160,32,parent:"accept-frame"),layer("accept-frame-2","frame","Frame two",400,100,200,160)]
        edit?(&nodes)
        var artwork:[String:Any]=["id":id+"-page","name":"Artwork","nodes":nodes,"comments":[]];for (key,value) in pageExtra{artwork[key]=value}
        var doc:[String:Any]=["format":"oanarina-ui","version":2,"id":id,"name":name,"updatedAt":"2026-10-31T00:00:00.000Z","colors":[],"pages":[artwork]]
        for (key,value) in extra{doc[key]=value}
        return json(doc)
    }
    func loadDocument(_ document:DocumentWindow,_ raw:String,_ then:@escaping()->Void){page(document,"if(!await window.__studioDocument(\(json(raw))))throw Error('Fixture refused');await wait(()=>!status().includes('Loading fonts')&&document.fonts.status==='loaded','fonts settle');await new Promise(r=>setTimeout(r,200));await wait(()=>!status().includes('Loading fonts'),'fonts settle');return true;"){_ in then()}}
    func saved(_ directory:URL,_ name:String,seconds:TimeInterval=30,_ then:@escaping(URL,Data)->Void){let url=directory.appendingPathComponent(name);until("native save of "+name,seconds:seconds,{FileManager.default.fileExists(atPath:url.path)}){guard let data=try? Data(contentsOf:url),!data.isEmpty else{self.smokeFail("empty native save "+name)};then(url,data)}}
    func zipEntries(_ url:URL)->[String] {
        func run(_ arguments:[String])->(Int32,String){let process=Process(),out=Pipe();process.executableURL=URL(fileURLWithPath:"/usr/bin/unzip");process.arguments=arguments;process.standardOutput=out;process.standardError=Pipe();do{try process.run()}catch{smokeFail(error.localizedDescription)};let data=out.fileHandleForReading.readDataToEndOfFile();process.waitUntilExit();return (process.terminationStatus,String(data:data,encoding:.utf8) ?? "")}
        guard run(["-tq",url.path]).0==0 else{smokeFail("unzip integrity failed for "+url.lastPathComponent)}
        return run(["-Z1",url.path]).1.split(separator:"\n").map(String.init)
    }
    func decoded(_ data:Data)->CGImage? {CGImageSourceCreateWithData(data as CFData,nil).flatMap{CGImageSourceCreateImageAtIndex($0,0,nil)}}
    /** One raw 8-bit RGB sample, in the image's own encoded coordinates, with no color conversion. */
    func sample(_ image:CGImage,_ x:Int,_ y:Int)->[Int] {
        guard image.bitsPerComponent==8,let data=image.dataProvider?.data,let bytes=CFDataGetBytePtr(data) else{smokeFail("8-bit image data expected")}
        let at=y*image.bytesPerRow+x*image.bitsPerPixel/8;return (0..<3).map{Int(bytes[at+$0])}
    }
    func close(_ a:[Int],_ b:[Int],_ tolerance:Int)->Bool {a.count==b.count && zip(a,b).allSatisfy{abs($0-$1)<=tolerance}}
    func clickExport(_ document:DocumentWindow,_ format:String,_ then:@escaping()->Void){
        page(document,"await window.__studioCommand('export');await wait(()=>document.querySelector('[role=dialog]'),'export dialog');pick('Export file format',\(json(format)));await new Promise(r=>setTimeout(r,120));click('Export '+\(json(format.uppercased())),document.querySelector('[role=dialog]'));return true;"){_ in then()}
    }
    func closeDialog(_ document:DocumentWindow,_ then:@escaping()->Void){page(document,"const d=document.querySelector('[role=dialog]');if(d)click('Close dialog',d);await wait(()=>!document.querySelector('[role=dialog]'),'dialog closed');return true;"){_ in then()}}
    /** The shell picks the place, in a new folder beside anything already there, and the renderer learns nothing about it. */
    func acceptAssetFolder(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        smokeSaveDirectory=directory
        let exported={()->[URL] in ((try? FileManager.default.contentsOfDirectory(at:directory,includingPropertiesForKeys:nil)) ?? []).filter{FileManager.default.fileExists(atPath:$0.appendingPathComponent("manifest.json").path)}}
        func export(_ then:@escaping(Any?)->Void){page(document,"await window.__studioCommand('select-all');await window.__studioCommand('export');await wait(()=>find('Export to folder…'),'folder control');click('Export to folder…');await wait(()=>document.body.innerText.includes('Export ready.'),'folder export finished');const d=document.querySelector('[role=dialog]');if(d)click('Close dialog',d);await wait(()=>!document.querySelector('[role=dialog]'),'dialog closed');return true;",then)}
        loadDocument(document,acceptanceDocument("accept-folder","Folder Assets")){
            export{_ in
                self.until("first asset folder",seconds:30,{exported().count==1}){
                    let assets=(try? FileManager.default.contentsOfDirectory(atPath:exported()[0].appendingPathComponent("assets").path)) ?? []
                    self.check(!assets.isEmpty,"Export to folder writes assets and a manifest into a new folder in the chosen place (\(assets.count) assets)")
                    export{_ in
                        self.until("second asset folder",seconds:30,{exported().count==2}){
                            let leftovers=((try? FileManager.default.contentsOfDirectory(atPath:directory.path)) ?? []).filter{$0.hasPrefix(".forma-export-")}
                            self.check(leftovers.isEmpty,"A second folder export makes a new folder and leaves no staging folder behind")
                            done()
                        }
                    }
                }
            }
        }
    }
    func acceptDesignExports(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        smokeSaveDirectory=directory
        loadDocument(document,acceptanceDocument("accept-export","Exports")){
            self.page(document,"await window.__studioCommand('select-all');await window.__studioCommand('export');await wait(()=>find('Export SVG')||find('Export PNG'),'combined export dialog');pick('Export file format','png');await wait(()=>find('Export PNG'),'PNG control');click('Export PNG');return true;"){_ in
                self.saved(directory,"Exports.png"){url,data in
                    guard let image=self.decoded(data) else{self.smokeFail("exported PNG decode")}
                    self.check(image.width>=500 && self.close(self.sample(image,50,50),[255,0,0],2),"Export dialog PNG arrives through native save with real pixels (\(image.width)x\(image.height))")
                    self.closeDialog(document){
                        self.page(document,"await window.__studioCommand('select-all');await window.__studioCommand('export');await wait(()=>find('Export PDF'),'pdf control');click('Export PDF');return true;"){_ in
                            self.saved(directory,"Exports.pdf"){_,data in
                                self.check(data.starts(with:Array("%PDF-".utf8)),"Export dialog PDF arrives through native save")
                                self.closeDialog(document){
                                    self.page(document,"await window.__studioCommand('select-all');await window.__studioCommand('export');await wait(()=>find('Export SVG')||find('Export PNG'),'combined export dialog');pick('Export file format','jpg');await wait(()=>find('Export JPG'),'JPG control');click('Export JPG');return true;"){_ in
                                        self.saved(directory,"Exports.jpg"){_,data in
                                            guard let image=self.decoded(data) else{self.smokeFail("exported JPG decode")}
                                            self.check(data.starts(with:[0xff,0xd8]) && self.close(self.sample(image,50,50),[255,0,0],12),"Export dialog JPG arrives through native save with real pixels")
                                            self.closeDialog(document){
                                                self.page(document,"await window.__studioCommand('select-all');await window.__studioCommand('export');await wait(()=>find('Export SVG')||find('Export PNG'),'combined export dialog');pick('Export file format','svg');await wait(()=>find('Export SVG'),'SVG control');click('Export SVG');return true;"){_ in
                                                    self.saved(directory,"Exports.svg"){_,data in
                                                        self.check(String(data:data,encoding:.utf8)?.contains("<svg")==true && XMLParser(data:data).parse(),"Export dialog SVG arrives through native save as well-formed XML")
                                                        self.closeDialog(document){self.acceptSaveFormats(document,directory,done)}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    func acceptDisplayP3(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        smokeSaveDirectory=directory
        let color=CGColor(colorSpace:CGColorSpace(name:CGColorSpace.displayP3)!,components:[0x33/255.0,0xcc/255.0,0x1a/255.0,1])!
        guard let converted=color.converted(to:CGColorSpace(name:CGColorSpace.sRGB)!,intent:.defaultIntent,options:nil)?.components else{smokeFail("P3 expected conversion")}
        let expected=converted.prefix(3).map{Int(($0*255).rounded())}
        let green:(inout [[String:Any]])->Void={nodes in nodes[1]["fill"]="#33cc1a";nodes[1]["name"]="P3 card"}
        loadDocument(document,acceptanceDocument("accept-p3","Wide",extra:["colorProfile":"display-p3"],edit:green)){
            self.page(document,"await new Promise(r=>setTimeout(r,400));const g=document.querySelector('#forma-design-canvas [data-node-id=\"accept-rect\"]');if(!g)throw Error('No canvas layer');const shape=g.querySelector('rect,path')||g,r=shape.getBoundingClientRect();return {fill:getComputedStyle(shape).fill,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,gamut:matchMedia('(color-gamut: p3)').matches};"){value in
                guard let body=value as? [String:Any],let x=body["x"] as? Double,let y=body["y"] as? Double else{self.smokeFail("P3 canvas layer")}
                self.check((body["fill"] as? String)?.hasPrefix("color(display-p3")==true,"WebKit computes the canvas fill as a Display P3 color")
                let configuration=WKSnapshotConfiguration();configuration.rect=CGRect(x:x-2,y:y-2,width:4,height:4);configuration.afterScreenUpdates=true
                document.web.takeSnapshot(with:configuration){image,_ in
                    guard let cg=image?.cgImage(forProposedRect:nil,context:nil,hints:nil) else{self.smokeFail("P3 snapshot")}
                    let rep=NSBitmapImageRep(cgImage:cg).colorAt(x:cg.width/2,y:cg.height/2)?.usingColorSpace(.sRGB)
                    let seen=[rep?.redComponent ?? 0,rep?.greenComponent ?? 0,rep?.blueComponent ?? 0].map{Int(($0*255).rounded())}
                    self.check(self.close(seen,expected,5),"actual WKWebView pixels of a P3 fill are color managed to the display (\(seen) expected \(expected))")
                    self.page(document,"await window.__studioCommand('deselect');document.querySelector('[data-layer-id=\"accept-rect\"]').click();await new Promise(r=>setTimeout(r,120));return true;"){_ in
                        self.clickExport(document,"png"){
                            self.saved(directory,"P3 card.png"){_,data in
                                guard let image=self.decoded(data) else{self.smokeFail("P3 PNG decode")}
                                self.check(image.colorSpace?.name==CGColorSpace.displayP3,"exported PNG is tagged Display P3 as ImageIO reads it")
                                self.check(self.close(self.sample(image,image.width/2,image.height/2),[0x33,0xcc,0x1a],3),"exported PNG keeps the Display P3 coordinates in its pixels")
                                self.closeDialog(document,done)
                            }
                        }
                    }
                }
            }
        }
    }
    func shaderDocument()->String {
        let shader:[String:Any]=["shaderId":"forma.mesh","version":1,"params":["topLeft":"#ff0000","topRight":"#00ff00","bottomLeft":"#0000ff","bottomRight":"#ffffff","bend":0,"speed":0.4],"time":0,"animate":false,"seed":1]
        let paint:[String:Any]=["id":"shader-paint","type":"shader","visible":true,"opacity":1,"color":"#ff8a5b","angle":0,"cx":0.5,"cy":0.5,"radius":0.5,"stops":[["id":"s1","position":0,"color":"#ff8a5b","opacity":1],["id":"s2","position":1,"color":"#4a6cf7","opacity":1]],"shader":shader]
        return acceptanceDocument("accept-shader","Shaded"){nodes in nodes[1]["paints"]=[paint];nodes[1]["name"]="Shaded"}
    }
    func acceptShaders(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        smokeSaveDirectory=directory
        js(document,"const real=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options){const c=real.call(this,type,options);if(type==='webgl'&&!window.__formaGl)window.__formaGl=c;return c;};return true;"){_ in
            self.loadDocument(document,self.shaderDocument()){
                self.page(document,"const image=()=>document.querySelector('#forma-design-canvas pattern[id^=\"fill-accept-rect\"] image')?.getAttribute('href');await wait(image,'shader raster on canvas');const gl=window.__formaGl;return {gl:!!gl,renderer:gl&&gl.getParameter(gl.VERSION),href:image().slice(0,30),status:status()};"){value in
                    self.check((value as? [String:Any])?["gl"] as? Bool==true,"real WebGL context drives the shader paint in WKWebView")
                    self.page(document,"document.querySelector('[data-layer-id=\"accept-rect\"]').click();await new Promise(r=>setTimeout(r,150));return true;"){_ in
                        self.clickExport(document,"png"){
                            self.saved(directory,"Shaded.png"){_,data in
                                guard let image=self.decoded(data) else{self.smokeFail("shader PNG decode")}
                                let w=image.width-3,h=image.height-3,tl=self.sample(image,2,2),tr=self.sample(image,w,2),bl=self.sample(image,2,h),br=self.sample(image,w,h)
                                self.check(self.close(tl,[255,0,0],40)&&self.close(tr,[0,255,0],40)&&self.close(bl,[0,0,255],40)&&self.close(br,[255,255,255],40),"exported shader pixels land at the right corners in WebKit")
                                self.closeDialog(document){self.acceptContextLoss(document,done)}
                            }
                        }
                    }
                }
            }
        }
    }
    func acceptContextLoss(_ document:DocumentWindow,_ done:@escaping()->Void){
        page(document,"const gl=window.__formaGl,ext=gl.getExtension('WEBGL_lose_context'),image=()=>document.querySelector('#forma-design-canvas pattern[id^=\"fill-accept-rect\"] image')?.getAttribute('href');const before=image();await wait(()=>!!before,'before');ext.loseContext();await wait(()=>gl.isContextLost(),'lost');await wait(()=>!image(),'fallback painted after loss',4000);const lost=!image();ext.restoreContext();await wait(()=>!gl.isContextLost(),'restored',5000);await wait(image,'shader back after restore',5000);return {lost,same:image()===before};"){value in
            let body=value as? [String:Any]
            self.check(body?["lost"] as? Bool==true,"context loss in WKWebView drops to the static fallback")
            self.check(body?["same"] as? Bool==true,"context restore repaints identical shader pixels")
            self.acceptGpuProcessLoss(document,done)
        }
    }
    /** A real GPU process death, the failure WEBGL_lose_context only imitates. */
    func acceptGpuProcessLoss(_ document:DocumentWindow,_ done:@escaping()->Void){
        guard let pid=document.web.value(forKey:"_gpuProcessIdentifier") as? Int32,pid>0 else{fputs("GPU process identity unavailable: real GPU kill skipped\n",stderr);done();return}
        js(document,"window.__gpu=[];const c=window.__formaGl.canvas;c.addEventListener('webglcontextlost',()=>window.__gpu.push('lost'));c.addEventListener('webglcontextrestored',()=>window.__gpu.push('restored'));return true;"){_ in
            guard Darwin.kill(pid,SIGKILL)==0 else{self.smokeFail("GPU process signal")}
            self.page(document,"const image=()=>document.querySelector('#forma-design-canvas pattern[id^=\"fill-accept-rect\"] image')?.getAttribute('href');await wait(()=>window.__gpu.includes('restored'),'GPU context restored',12000);await wait(image,'shader back after GPU process death',6000);return window.__gpu.join(' ');"){value in
                self.check(value as? String=="lost restored","a killed GPU process loses the WebGL context and the shader repaints in the same renderer (\(value as? String ?? ""))")
                done()
            }
        }
    }
    func acceptCodeLayer(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        smokeSaveDirectory=directory
        let code:[String:Any]=["version":1,"html":"<div id=\"m\">start</div><div id=\"box\"></div>","css":"html,body{margin:0;height:100%;background:#00ff00}#box{position:absolute;left:10px;top:10px;width:60px;height:60px;background:#0000ff;border-radius:4px}#m{position:absolute;left:100px;top:100px;font:40px sans-serif;color:#000}","js":"document.getElementById('m').textContent='ran';parent.postMessage({forma:'probe',origin:self.origin,fetch:typeof fetch},'*');","properties":[],"values":[:],"preview":"none"]
        loadDocument(document,acceptanceDocument("accept-code","Code"){nodes in nodes[1]["type"]="code";nodes[1]["name"]="Widget";nodes[1]["code"]=code;nodes[1]["parentId"]=NSNull();nodes[1]["x"]=40;nodes[1]["y"]=40;nodes[1]["width"]=320;nodes[1]["height"]=200}){
            self.page(document,"document.querySelector('[data-layer-id=\"accept-rect\"]').click();await wait(()=>find('Edit code'),'code inspector');click('Edit code');await wait(()=>find('Run code'),'code dialog');const frames=document.querySelectorAll('[data-guest-frame]').length;window.__probe=[];addEventListener('message',e=>{if(e.data?.forma==='probe')window.__probe.push([e.origin,e.data.origin,e.data.fetch]);});click('Run code');await wait(()=>document.querySelector('[data-guest-frame]')&&window.__probe.length,'guest ran');return {framesBefore:frames,probe:window.__probe[0],sandbox:document.querySelector('[data-guest-frame]').getAttribute('sandbox')};"){value in
                let body=value as? [String:Any],probe=body?["probe"] as? [Any]
                self.check(body?["framesBefore"] as? Int==0,"code source stays inert until explicit Run")
                self.check(probe?[0] as? String=="null" && probe?[1] as? String=="null" && probe?[2] as? String=="undefined","code runs in an opaque WKWebView frame with fetch removed")
                self.page(document,"click('Save code and preview');await wait(()=>!document.querySelector('.code-layer-dialog'),'dialog closes after preview',8000);return true;"){_ in
                    document.session.file=directory.appendingPathComponent("Code.oui")
                    self.js(document,"return await window.__studioSave();"){_ in
                        guard let data=try? ProjectFileSafety.readBounded(directory.appendingPathComponent("Code.oui")),let doc=try? JSONSerialization.jsonObject(with:data) as? [String:Any],let pages=doc["pages"] as? [[String:Any]],let target=(pages[0]["nodes"] as? [[String:Any]])?.first(where:{$0["id"] as? String=="accept-rect"}),let paints=target["paints"] as? [[String:Any]],let image=paints.first(where:{$0["type"] as? String=="image"})?["image"] as? String,let bytes=Data(base64Encoded:String(image.split(separator:",").last ?? "")),let decoded=self.decoded(bytes) else{self.smokeFail("code preview missing from saved project")}
                        self.check(self.close(self.sample(decoded,decoded.width*280/320,decoded.height*170/200),[0,255,0],3)&&self.close(self.sample(decoded,decoded.width*40/320,decoded.height*40/200),[0,0,255],3),"code layer preview captured in WebKit holds the real rendered pixels")
                        document.session.file=nil
                        done()
                    }
                }
            }
        }
    }
    func pluginPackage(_ directory:URL,_ name:String,_ package:[String:Any])->URL {let file=directory.appendingPathComponent(name);do{try Data(json(package).utf8).write(to:file)}catch{smokeFail(error.localizedDescription)};return file}
    /** macOS 27's WebKit does not taint these canvases, but the app supports macOS 13, where WebKit does. Guest scripts run in a worker, so a user script in the frame makes the first read fail exactly as a tainted canvas would. */
    func acceptCodePainter(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        document.web.configuration.userContentController.addUserScript(WKUserScript(source:"if(window!==top){const real=HTMLCanvasElement.prototype.toDataURL;let thrown=false;HTMLCanvasElement.prototype.toDataURL=function(...a){if(!thrown&&this.width>=300){thrown=true;throw new DOMException('tainted','SecurityError');}return real.apply(this,a);};}",injectionTime:.atDocumentStart,forMainFrameOnly:false))
        let code:[String:Any]=["version":1,"html":"<div id=\"box\"></div><p id=\"m\">Painted text</p><input id=\"f\" value=\"Field\"><canvas id=\"c\" width=\"40\" height=\"40\"></canvas>","css":"html,body{margin:0;height:100%;background:#00ff00}#box{position:absolute;left:10px;top:10px;width:60px;height:60px;background:#0000ff;border-radius:6px;border-top:6px solid #ff0000}#m{position:absolute;left:100px;top:90px;margin:0;font:32px sans-serif;color:#000}#f{position:absolute;left:100px;top:150px}#c{position:absolute;left:240px;top:20px}","js":"document.getElementById('c').getContext('2d').fillStyle='#ff00ff';document.getElementById('c').getContext('2d').fillRect(0,0,40,40);","properties":[],"values":[:],"preview":"none"]
        loadDocument(document,acceptanceDocument("accept-painter","Painter"){nodes in nodes[1]["type"]="code";nodes[1]["name"]="Painter";nodes[1]["code"]=code;nodes[1]["parentId"]=NSNull();nodes[1]["x"]=40;nodes[1]["y"]=40;nodes[1]["width"]=320;nodes[1]["height"]=200}){
            self.page(document,"document.querySelector('[data-layer-id=\"accept-rect\"]').click();await wait(()=>find('Edit code'),'code inspector');click('Edit code');await wait(()=>find('Run code'),'code dialog');click('Run code');await wait(()=>document.querySelector('[data-guest-frame]'),'guest');await new Promise(r=>setTimeout(r,300));click('Save code and preview');await wait(()=>!document.querySelector('.code-layer-dialog'),'dialog closes after preview',8000);return true;"){_ in
                document.session.file=directory.appendingPathComponent("Painter.oui")
                self.js(document,"return await window.__studioSave();"){_ in
                    guard let data=try? ProjectFileSafety.readBounded(directory.appendingPathComponent("Painter.oui")),let doc=try? JSONSerialization.jsonObject(with:data) as? [String:Any],let pages=doc["pages"] as? [[String:Any]],let target=(pages[0]["nodes"] as? [[String:Any]])?.first(where:{$0["id"] as? String=="accept-rect"}),let paints=target["paints"] as? [[String:Any]],let image=paints.first(where:{$0["type"] as? String=="image"})?["image"] as? String,let bytes=Data(base64Encoded:String(image.split(separator:",").last ?? "")),let decoded=self.decoded(bytes) else{self.smokeFail("painted preview missing from saved project")}
                    let scale=decoded.width/320
                    func at(_ x:Int,_ y:Int)->[Int]{self.sample(decoded,x*scale,y*scale)}
                    var dark=0;for y in 95..<125{for x in 100..<300{if at(x,y).reduce(0,+)<120{dark+=1}}}
                    self.check(self.close(at(300,190),[0,255,0],3)&&self.close(at(40,50),[0,0,255],3)&&self.close(at(40,12),[255,0,0],3)&&self.close(at(260,40),[255,0,255],3),"the DOM painter draws background, box, per-side border and canvas pixels in WebKit")
                    self.check(dark>200,"the DOM painter draws real text glyphs (\(dark) dark samples)")
                    document.session.file=nil;document.session.fingerprint=nil;done()
                }
            }
        }
    }
    func acceptPlugin(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        let code="const selection=await forma.readSelection();await forma.propose({operations:[{op:\"update\",nodeId:selection[0].id,properties:{x:145}}]});let reach='none';try{await fetch('/');reach='network';}catch{reach='refused';}await forma.log('sandbox '+reach+' '+typeof document);"
        let file=pluginPackage(directory,"plugin.json",["format":"forma-local-plugin","version":1,"id":"local.accept","name":"Acceptance","description":"Acceptance package","permissions":["selection:read","document:write"],"code":code])
        let console="document.querySelector('[aria-label=\"Plugin console\"]')?.textContent??''"
        loadDocument(document,acceptanceDocument("accept-plugin","Plugin")){
            self.page(document,"document.querySelector('[data-layer-id=\"accept-rect\"]').click();if(!find('Local plugins'))click('Assets');await wait(()=>find('Local plugins'),'plugin entry');click('Local plugins');await wait(()=>find('Import local plugin package'),'plugin dialog');return true;"){_ in
                self.smokeOpenFiles=[file]
                // A real click runs inside the gesture; an await in the same script would lose it, as WebKit then refuses the chooser.
                self.page(document,"click('Import local plugin package');return true;"){_ in
                    self.page(document,"await wait(()=>find('Install local package'),'review from a real file');click('Install local package');await wait(()=>find('Run local plugin'),'installed');for(const e of document.querySelectorAll('input[type=checkbox][aria-label^=Grant]'))if(!e.checked)e.click();await new Promise(r=>setTimeout(r,100));click('Run local plugin');await wait(()=>find('Apply reviewed plugin proposal'),'proposal from sandbox worker',12000);await wait(()=>(\(console)).includes('sandbox'),'worker console',12000);return \(console);"){value in
                        self.check((value as? String)?.contains("sandbox refused undefined")==true,"plugin worker runs in the WKWebView sandbox with no DOM and network refused")
                        self.page(document,"click('Apply reviewed plugin proposal');await wait(()=>!find('Apply reviewed plugin proposal'),'plugin proposal applied');await new Promise(r=>setTimeout(r,120));return true;"){_ in
                            self.acceptPluginInterface(document,directory,done)
                        }
                    }
                }
            }
        }
    }
    func acceptPluginInterface(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        let html="<!doctype html><html><body style=\"margin:0;background:#00ff00\"><p id=\"out\">waiting</p><script>onmessage=e=>{document.getElementById(\"out\").textContent=JSON.stringify(e.data.pluginMessage);parent.postMessage({pluginMessage:{action:\"reply\",origin:self.origin,hasStorage:(()=>{try{return typeof localStorage.length}catch{return \"denied\"}})()}},\"*\");};</script></body></html>"
        let code="forma.ui.onMessage(async m=>{await forma.log('from ui '+JSON.stringify(m));forma.close();});await forma.ui.show();await forma.ui.postMessage({hello:'from worker'});await forma.log('shown');"
        let file=pluginPackage(directory,"plugin-ui.json",["format":"forma-local-plugin","version":1,"id":"local.acceptui","name":"Acceptance UI","description":"Interface package","permissions":["ui:show"],"code":code,"ui":["html":html,"width":320,"height":160]])
        smokeOpenFiles=[file]
        let console="document.querySelector('[aria-label=\"Plugin console\"]')?.textContent??''"
        page(document,"click('Import local plugin package');return true;"){_ in
            self.page(document,"await wait(()=>find('Install local package'),'interface review');click('Install local package');await wait(()=>document.querySelector('[aria-label=\"Installed plugin\"]').value==='local.acceptui','interface installed');await wait(()=>find('Run local plugin'),'run control');for(const e of document.querySelectorAll('input[type=checkbox][aria-label^=Grant]'))if(!e.checked)e.click();await new Promise(r=>setTimeout(r,100));click('Run local plugin');await wait(()=>(\(console)).includes('from ui'),'mediated reply from the interface frame',8000);return {text:\(console),};"){value in
                let text=(value as? [String:Any])?["text"] as? String ?? ""
                self.check(text.contains("\"action\":\"reply\"") && text.contains("\"origin\":\"null\"") && text.contains("denied"),"plugin interface iframe is opaque in WKWebView and exchanges mediated messages")
                self.page(document,"click('Close local plugins');await wait(()=>!document.querySelector('[role=dialog]'),'plugin dialog closes');return true;"){_ in done()}
            }
        }
    }
    /** Every format the editor really exports must pass the shell's list, and anything a Mac would execute must not. */
    func acceptSaveFormats(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        let accepted=["accept.md","accept.ase","accept.aco","accept.gpl","accept.sketchpalette","accept.swatches","accept.hex","accept.css","accept.html","accept.xml","accept.tsx","accept.swift","accept.kt","accept.jpeg","accept.webp"],refused=["accept.command","accept.sh","accept.app","accept.pkg","accept.terminal","accept"]
        js(document,"const results={};for(const name of \(json(accepted+refused))){results[name]=await window.desktop.save(name,'data').then(v=>String(v),e=>'refused');}return results;"){value in
            guard let results=value as? [String:String] else{self.smokeFail("save format report")}
            self.check(accepted.allSatisfy{results[$0]=="true" && FileManager.default.fileExists(atPath:directory.appendingPathComponent($0).path)},"native save accepts each format the editor exports (\(accepted.count) extensions)")
            self.check(refused.allSatisfy{results[$0]=="refused" && !FileManager.default.fileExists(atPath:directory.appendingPathComponent($0).path)},"native save refuses executable and unnamed formats before any panel")
            done()
        }
    }
    func acceptProjectZips(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        smokeSaveDirectory=directory
        runSteps([{self.acceptPrototypeZip(document,directory,$0)},{self.acceptSiteZip(document,directory,$0)},{self.acceptPowerPoint(document,directory,$0)},{self.acceptBrand(document,directory,$0)}],done)
    }
    /** Loads an exported page in a fresh WKWebView with no bridge, as a person's browser engine would. */
    func openExported(_ html:URL,root:URL,_ report:String,_ completion:@escaping(Any?)->Void){
        let configuration=WKWebViewConfiguration();configuration.websiteDataStore = .nonPersistent()
        let view=WKWebView(frame:NSRect(x:0,y:0,width:900,height:700),configuration:configuration),holder=NSWindow(contentRect:view.frame,styleMask:[.titled],backing:.buffered,defer:false);holder.contentView=view;holder.isReleasedWhenClosed=false;holder.orderBack(nil)
        view.loadFileURL(html,allowingReadAccessTo:root)
        until("exported page loads",{!view.isLoading}){
            self.later(0.4){view.callAsyncJavaScript(report,arguments:[:],in:nil,in:.page){result in
                holder.orderOut(nil)
                switch result{case .success(let value):completion(value);case .failure(let error):self.smokeFail("exported page: "+((error as NSError).userInfo["WKJavaScriptExceptionMessage"] as? String ?? error.localizedDescription))}
            }}
        }
    }
    func unzipped(_ archive:URL)->URL {
        let folder=archive.deletingPathExtension().appendingPathExtension("unzipped");try? FileManager.default.createDirectory(at:folder,withIntermediateDirectories:true)
        let process=Process();process.executableURL=URL(fileURLWithPath:"/usr/bin/unzip");process.arguments=["-oq",archive.path,"-d",folder.path];process.standardOutput=Pipe();process.standardError=Pipe();do{try process.run();process.waitUntilExit()}catch{smokeFail(error.localizedDescription)};return folder
    }
    func acceptPrototypeZip(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        loadDocument(document,acceptanceDocument("accept-prototype","Player")){
            self.page(document,"await window.__studioCommand('share-prototype');await wait(()=>document.querySelector('.prototype-share'),'prototype dialog');await wait(()=>find('Save prototype ZIP')&&!find('Save prototype ZIP').disabled,'prototype ready');click('Save prototype ZIP');return true;"){_ in
                self.saved(directory,"Player-prototype.zip"){url,_ in
                    let entries=self.zipEntries(url)
                    guard let html=entries.first(where:{$0.hasSuffix(".html")}) else{self.smokeFail("prototype ZIP has no HTML: \(entries)")}
                    self.check(true,"prototype player ZIP saved natively and passes unzip integrity (\(entries.count) entries)")
                    let folder=self.unzipped(url)
                    self.openExported(folder.appendingPathComponent(html),root:folder,"await new Promise(r=>setTimeout(r,500));return {text:document.body.innerText,nodes:document.querySelectorAll('svg *').length,external:performance.getEntriesByType('resource').filter(e=>/^https?:/.test(e.name)).length};"){value in
                        let body=value as? [String:Any]
                        self.check((body?["nodes"] as? Int ?? 0)>0 && body?["external"] as? Int==0,"exported prototype plays its frame offline in a bridge-free WebKit view")
                        self.page(document,"click('Close prototype export');await wait(()=>!document.querySelector('.prototype-share'),'prototype dialog closes');return true;"){_ in done()}
                    }
                }
            }
        }
    }
    func acceptSiteZip(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        smokeReadyOverride={site in
            self.page(site,"await wait(()=>find('Export site'),'site bar');click('Preview');await wait(()=>document.querySelector('iframe[title=\"Site preview\"]'),'site preview frame');await new Promise(r=>setTimeout(r,600));const r=document.querySelector('iframe[title=\"Site preview\"]').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+80,sandbox:document.querySelector('iframe[title=\"Site preview\"]').getAttribute('sandbox'),error:document.querySelector('.site-preview-error')?.textContent??''};"){value in
                guard let body=value as? [String:Any] else{self.smokeFail("site preview report")}
                self.check(body["error"] as? String=="" && body["sandbox"] as? String=="allow-scripts allow-forms","Sites preview frame opens in WKWebView")
                let shot=WKSnapshotConfiguration();shot.rect=CGRect(x:(body["x"] as? Double ?? 0)-150,y:(body["y"] as? Double ?? 0)-60,width:300,height:200);shot.afterScreenUpdates=true
                site.web.takeSnapshot(with:shot){image,_ in
                    guard let cg=image?.cgImage(forProposedRect:nil,context:nil,hints:nil) else{self.smokeFail("site snapshot")}
                    let rep=NSBitmapImageRep(cgImage:cg);var seen=Set<Int>();for y in stride(from:0,to:rep.pixelsHigh,by:4){for x in stride(from:0,to:rep.pixelsWide,by:4){if let c=rep.colorAt(x:x,y:y){seen.insert(Int(c.redComponent*31)<<10|Int(c.greenComponent*31)<<5|Int(c.blueComponent*31))}}}
                    self.check(seen.count>1,"Sites preview frame paints page content in WKWebView (\(seen.count) distinct colors)")
                self.page(site,"click('Export site');await wait(()=>find('Export site ZIP')&&!find('Export site ZIP').disabled,'site export ready');click('Export site ZIP');return document.title;"){_ in
                    self.until("site archive",{(try? FileManager.default.contentsOfDirectory(atPath:directory.path))?.contains{$0.hasSuffix("-site.zip")}==true}){
                        let name=(try! FileManager.default.contentsOfDirectory(atPath:directory.path)).first{$0.hasSuffix("-site.zip")}!,url=directory.appendingPathComponent(name)
                        self.later(0.3){
                            let entries=self.zipEntries(url)
                            guard entries.contains("index.html") else{self.smokeFail("site ZIP has no index.html: \(entries)")}
                            self.check(true,"Sites ZIP saved natively and passes unzip integrity (\(entries.count) entries)")
                            let folder=self.unzipped(url)
                            self.openExported(folder.appendingPathComponent("index.html"),root:folder,"return {title:document.title,boxes:document.querySelectorAll('.node').length,css:document.styleSheets.length};"){value in
                                let body=value as? [String:Any]
                                self.check((body?["css"] as? Int ?? 0)>0,"exported site opens in a bridge-free WebKit view with its stylesheet")
                                site.closeApproved();document.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
                                self.until("site window closed",{self.documents.count==1},done)
                            }
                        }
                    }
                }
                }
            }
        }
        js(document,"await window.__studioCommand('new-site');return true;"){_ in}
    }
    func acceptPowerPoint(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        smokeReadyOverride={deck in
            self.page(deck,"await wait(async()=>{await window.__studioCommand('export');await new Promise(r=>setTimeout(r,150));return document.querySelector('[aria-label=\"Export slide deck\"]');},'deck export');click('Export PowerPoint');return true;"){_ in
                let name=(deck.state?.name ?? "Untitled")+".pptx"
                self.saved(directory,name){url,data in
                    let entries=self.zipEntries(url)
                    self.check(entries.contains("ppt/presentation.xml") && entries.contains("[Content_Types].xml"),"PowerPoint export saves natively as a valid .pptx package (\(data.count) bytes, \(entries.count) parts)")
                    deck.closeApproved();document.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
                    self.until("deck window closed",{self.documents.count==1},done)
                }
            }
        }
        command("new-slides")
    }
    func acceptBrand(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        page(document,"await window.__studioCommand('templates');await wait(()=>document.querySelector('.template-gallery'),'gallery');const b=[...document.querySelectorAll('.template-choice')].find(b=>b.textContent.includes('Campaign starter'));if(!b)throw Error('No Campaign starter');b.click();await new Promise(r=>setTimeout(r,250));return names(document.querySelector('.template-gallery')).filter(n=>/use|create|open|start/i.test(n)).join(' | ');"){value in
            let label=(value as? String)?.split(separator:"|").map{$0.trimmingCharacters(in:.whitespaces)}.first{$0.lowercased().hasPrefix("use") || $0.lowercased().hasPrefix("create") || $0.lowercased().hasPrefix("open")} ?? ""
            self.smokeReadyOverride={brand in
                self.page(brand,"await wait(()=>find('Export assets')&&!find('Export assets').disabled,'export assets').catch(()=>click('Assets'));await wait(()=>find('Export assets')&&!find('Export assets').disabled,'export assets');click('Export assets');const dialog=()=>document.querySelector('[role=dialog]');await wait(dialog,'brand export dialog');pick('Export scope','all');await new Promise(r=>setTimeout(r,200));const b=await wait(()=>names(dialog()).find(n=>/^Export \\d+ assets?$/.test(n)),'brand export button');click(b,dialog());return b;"){value in
                    self.until("brand archive",{(try? FileManager.default.contentsOfDirectory(atPath:directory.path))?.contains{$0.contains("assets") && $0.hasSuffix(".zip")}==true},{
                        let name=(try! FileManager.default.contentsOfDirectory(atPath:directory.path)).first{$0.contains("assets") && $0.hasSuffix(".zip")}!,url=directory.appendingPathComponent(name)
                        self.later(0.3){
                            let entries=self.zipEntries(url)
                            self.check(entries.contains("manifest.json") && entries.contains{$0.hasSuffix(".png")},"brand assets ZIP saved natively with its manifest and rendered assets (\(entries.count) entries)")
                            brand.closeApproved();document.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
                            self.until("brand window closed",{self.documents.count==1},done)
                        }
                    })
                }
            }
            self.page(document,"click(\(self.json(label)),document.querySelector('.template-gallery'));return true;"){_ in}
        }
    }
    func acceptWidget(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        let code="const input=await forma.readParameters();let count=Number(input.state.count||0),note=input.state.note||'';if(input.event==='action'){if(input.action==='add')count++;if(input.action==='net'){try{await fetch('/');note='network reached';}catch{note='network refused';}}}await forma.propose({state:{count,note},view:{type:'stack',padding:12,gap:8,fill:'#ece6f6',children:[{type:'text',text:'Count '+count,fontSize:16,bold:true},{type:'text',text:note||'-',fontSize:12},{type:'stack',direction:'horizontal',gap:6,children:[{type:'button',label:'Add',action:'add',grow:true},{type:'button',label:'Net',action:'net',grow:true}]}]}});"
        let package:[String:Any]=["format":"forma-local-widget","version":1,"id":"local.counter","name":"Counter","description":"Counts things","permissions":[],"code":code,"size":["width":240,"height":150],"resizable":true,"minSize":["width":180,"height":120],"maxSize":["width":640,"height":420],"initialState":["count":0]]
        let file=directory.appendingPathComponent("widget.json");do{try Data(json(package).utf8).write(to:file)}catch{smokeFail(error.localizedDescription)}
        loadDocument(document,acceptanceDocument("accept-widget","Widgets")){
            self.page(document,"await window.__studioCommand('local-widgets');await wait(()=>document.querySelector('[aria-label=\"Choose widget package\"]'),'widget manager');return true;"){_ in
                self.smokeOpenFiles=[file]
                self.js(document,"document.querySelector('[aria-label=\"Choose widget package\"]').click();return true;"){_ in
                    let label="[...document.querySelectorAll('svg.canvas text[opacity]')].map(t=>t.textContent).join(' ')"
                    self.page(document,"await wait(()=>find('Install widget'),'widget review from a real file');click('Install widget');await wait(()=>find('Insert Counter'),'widget installed');click('Insert Counter');await wait(()=>\(label).includes('Count 0'),'widget drew from its sandbox',10000);click('Counter: Add');await wait(()=>\(label).includes('Count 1'),'widget action ran in its sandbox',10000);click('Counter: Net');await wait(()=>\(label).includes('network refused'),'widget network refused',10000);await window.__studioCommand('undo');await wait(()=>\(label).includes('Count 1')&&!\(label).includes('network refused'),'widget undo',5000);return true;"){_ in
                        self.check(true,"widget package installs from a real file, draws, acts and undoes through its sandbox in WKWebView")
                        self.check(true,"widget network request is refused inside the WKWebView sandbox")
                        done()
                    }
                }
            }
        }
    }
    func acceptVideo(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        smokeSaveDirectory=directory
        let raw=acceptanceDocument("accept-motion","Animated",pageExtra:["motion":["duration":1,"fps":24,"loop":false,"tracks":[["id":"t1","nodeId":"accept-rect","property":"x","visible":true,"keyframes":[["id":"k1","time":0,"value":120,"easing":"linear"],["id":"k2","time":1,"value":180,"easing":"linear"]]]]]])
        func record(_ format:String,_ then:@escaping(URL,Data)->Void){
            page(document,"const open=()=>document.querySelector('.animation-export');if(!document.querySelector('.motion-timeline'))await window.__studioCommand('motion');await wait(open,'motion export section');open().open=true;await wait(()=>document.querySelector('[aria-label=\"Animation export format\"]'),'export format');pick('Animation export format',\(json(format)));await new Promise(r=>setTimeout(r,80));click('Export animation');return true;"){_ in
                self.saved(directory,"Animated."+format,seconds:25,then)
            }
        }
        loadDocument(document,raw){
            self.page(document,"await window.__studioCommand('select-all');return true;"){_ in
                record("mp4"){url,data in
                    self.check(data.count>200 && data.subdata(in:4..<8)==Data("ftyp".utf8),"MP4 animation export saves natively with an ISO media header (\(data.count) bytes)")
                    self.acceptMp4(url){
                        record("webm"){url,data in
                            self.check(data.starts(with:[0x1a,0x45,0xdf,0xa3]),"WebM animation export saves natively with an EBML header (\(data.count) bytes)")
                            self.page(document,"const bytes=Uint8Array.from(atob(\(self.json(data.base64EncodedString()))),c=>c.charCodeAt(0)),v=document.createElement('video');v.muted=true;v.src=URL.createObjectURL(new Blob([bytes],{type:'video/webm'}));const result=await new Promise(r=>{v.onloadedmetadata=()=>r({w:v.videoWidth,h:v.videoHeight,d:v.duration});v.onerror=()=>r({error:v.error?.message??'decode failed'});setTimeout(()=>r({error:'no metadata'}),6000);});await window.__studioCommand('motion');return result;"){value in
                                let body=value as? [String:Any]
                                self.check((body?["w"] as? Int ?? 0)>0,"this WebKit decodes the WebM it recorded")
                                done()
                            }
                        }
                    }
                }
            }
        }
    }
    /** AVFoundation is a second, independent decoder: frames must exist and must differ as the layer moves. */
    func acceptMp4(_ url:URL,_ done:@escaping()->Void){
        let asset=AVURLAsset(url:url)
        asset.loadTracks(withMediaType:.video){tracks,error in DispatchQueue.main.async{
            guard let track=tracks?.first else{self.smokeFail("MP4 has no video track: \(String(describing:error))")}
            let generator=AVAssetImageGenerator(asset:asset);generator.requestedTimeToleranceAfter = .zero;generator.requestedTimeToleranceBefore = .zero
            generator.generateCGImageAsynchronously(for:CMTime(seconds:0.05,preferredTimescale:600)){first,_,_ in generator.generateCGImageAsynchronously(for:CMTime(seconds:max(0.3,CMTimeGetSeconds(track.timeRange.duration)-0.1),preferredTimescale:600)){last,_,_ in DispatchQueue.main.async{
                guard let first,let last else{self.smokeFail("AVFoundation could not decode the MP4 frames")}
                func bytes(_ image:CGImage)->Data {let context=CGContext(data:nil,width:64,height:64,bitsPerComponent:8,bytesPerRow:256,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!;context.draw(image,in:CGRect(x:0,y:0,width:64,height:64));return Data(bytes:context.data!,count:256*64)}
                let a=bytes(first),b=bytes(last),changed=zip(a,b).filter{abs(Int($0)-Int($1))>24}.count
                self.check(CMTimeGetSeconds(track.timeRange.duration)>0.4 && changed>40,"AVFoundation decodes the MP4 and its frames show the layer moving (\(changed) changed samples)")
                done()
            }}}
        }}
    }
    func rendererPid(_ document:DocumentWindow)->Int32 {guard let pid=document.web.value(forKey:"_webProcessIdentifier") as? Int32,pid>0 else{smokeFail("renderer process identity")};return pid}
    func killRenderer(_ document:DocumentWindow){guard Darwin.kill(rendererPid(document),SIGKILL)==0 else{smokeFail("renderer signal")}}
    /** Two edits: the first reaches the repository with its Undo history, the second exists only in the journal when the WebContent process is killed. */
    func acceptCrash(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        loadDocument(document,acceptanceDocument("accept-crash","Crash")){
            let key="forma-crash-journal-v1:accept-crash"
            let pages="[...document.querySelectorAll('.pages-list button')].length"
            self.js(document,"await window.__studioCommand('page');const end=performance.now()+6000;while(performance.now()<end){const s=await window.__studioState();if(!localStorage.getItem(\(self.json(key)))&&window.__studioState)break;await new Promise(r=>setTimeout(r,20));}await new Promise(r=>setTimeout(r,1400));return true;"){_ in
                self.smokeReadyOverride={restored in
                    self.check(restored===document,"the same window returns after a real WebContent kill")
                    self.page(restored,"await wait(()=>document.querySelector('[data-canvas]'),'canvas after kill');await wait(()=>document.body.textContent.includes('Recovered edits from the interrupted session'),'journal replay toast');return {pages:\(pages),text:status()};"){value in
                        let count=(value as? [String:Any])?["pages"] as? Int
                        self.check(true,"write-ahead journal replays after a real renderer kill (\(count ?? -1) pages)")
                        self.acceptCrashUndo(restored,count ?? 0,directory,done)
                    }
                }
                self.js(document,"const before=localStorage.getItem(\(self.json(key)));await window.__studioCommand('page');for(let i=0;i<400;i++){const v=localStorage.getItem(\(self.json(key)));if(v&&v!==before)return v.length;await new Promise(r=>setTimeout(r,2));}throw Error('Journal entry was never written');"){value in
                    self.check((value as? Int ?? 0)>0,"journal entry exists before the kill")
                    self.killRenderer(document)
                }
            }
        }
    }
    func acceptCrashUndo(_ document:DocumentWindow,_ count:Int,_ directory:URL,_ done:@escaping()->Void){
        let pages="[...document.querySelectorAll('.pages-list button')].length"
        page(document,"const first=\(pages);await window.__studioCommand('undo');await wait(()=>\(pages)<first,'undo removes the replayed journal edit');const second=\(pages);await window.__studioCommand('undo');await wait(()=>\(pages)<second,'undo reaches history saved before the kill');return first;"){value in
            self.check(true,"replayed edit and the Undo history stored before the kill both undo in the new renderer")
            document.session.file=directory.appendingPathComponent("Crash.oui")
            self.js(document,"const saved=await window.__studioSave();await new Promise(r=>setTimeout(r,3300));return saved;"){value in self.check(value as? Bool==true,"the recovered project saves to a file before the start failures");self.acceptSafeMode(document,done)}
        }
    }
    /** Undo stored with the recovery copy, read back by a new renderer after an ordinary close and Reopen Closed Window. */
    func acceptUndoReopen(_ document:DocumentWindow,_ done:@escaping()->Void){
        smokeReadyOverride={second in
            self.loadDocument(second,self.acceptanceDocument("accept-reopen","Reopened")){
                let key="forma-crash-journal-v1:accept-reopen",pages="document.querySelectorAll('.pages-list button').length"
                self.page(second,"const before=\(pages);await window.__studioCommand('page');await wait(()=>\(pages)>before,'second page');await wait(()=>localStorage.getItem(\(self.json(key))),'journal written').catch(()=>{});await wait(()=>!localStorage.getItem(\(self.json(key))),'journal cleared by autosave');await new Promise(r=>setTimeout(r,300));return before;"){value in
                    guard let before=value as? Int else{self.smokeFail("page count")}
                    self.smokeReadyOverride={third in
                        self.page(third,"await wait(()=>document.querySelector('[data-canvas]'),'reopened canvas');await wait(()=>\(pages)>\(before),'reopened pages');return true;"){_ in
                            self.until("reopened Undo reaches the menu",{third.state?.menu?.undo==true},{
                                self.page(third,"await window.__studioCommand('undo');await wait(()=>\(pages)===\(before),'undo after reopen');return true;"){_ in
                                    self.check(third !== second && third.session.documentId=="accept-reopen","Reopen Closed Window restores the project in a new renderer")
                                    self.check(true,"Undo history saved with the project still undoes after close and reopen")
                                    third.closeApproved();document.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
                                    self.until("reopened window closed",{self.documents.count==1},done)
                                }
                            })
                        }
                    }
                    second.closeApproved();self.command("reopen-closed")
                }
            }
        }
        createWindow(bootstrap:["kind":"new","command":"new"])
    }
    /** Starts that die before they prove healthy leave boot markers, the real trigger for safe mode. The first kill only ends a healthy session. */
    func acceptSafeMode(_ document:DocumentWindow,_ done:@escaping()->Void){
        document.rendererExits=[]
        let bound=document.session.file
        smokeReadyOverride={first in
            self.smokeReadyOverride={second in
                self.smokeReadyOverride={third in
                    self.page(third,"await wait(()=>document.querySelector('.safe-mode-banner'),'safe mode banner');return document.querySelector('.safe-mode-banner').textContent;"){value in
                        self.check((value as? String)?.contains("did not finish starting twice")==true,"two starts ended by a real renderer kill enter safe mode")
                        self.smokeReadyOverride={normal in
                            self.page(normal,"await wait(()=>document.querySelector('[data-canvas]'),'normal start');return !!document.querySelector('.safe-mode-banner');"){value in
                                self.check(value as? Bool==false && normal.state?.name=="Crash" && normal.session.file==bound,"Restart normally returns to the same document and file binding after safe mode")
                                done()
                            }
                        }
                        self.page(third,"click('Restart normally');return true;"){_ in}
                    }
                }
                self.killRenderer(second)
            }
            self.killRenderer(first)
        }
        killRenderer(document)
    }
    /** A person's click on the screen cannot be scripted, so this drives the menu item and everything after the sampler's answer. */
    /** Builds a small screen the way a person does: real mouse and key events through AppKit into the shipped editor, then the saved file is read back. */
    func acceptWorkflow(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        typealias Point=(CGFloat,CGFloat)
        let codes:[Character:UInt16]=["f":3,"r":15,"t":17,"v":9,"H":4,"e":14,"l":37,"o":31]
        func drag(_ from:Point,_ to:Point,_ flags:NSEvent.ModifierFlags=[],_ then:@escaping()->Void){
            self.mouse(document,.leftMouseDown,from.0,from.1,flags)
            func step(_ i:Int){
                if i>5{self.mouse(document,.leftMouseUp,to.0,to.1,flags);self.later(0.25){then()};return}
                let t=CGFloat(i)/5;self.mouse(document,.leftMouseDragged,from.0+(to.0-from.0)*t,from.1+(to.1-from.1)*t,flags);self.later(0.03){step(i+1)}
            }
            self.later(0.05){step(1)}
        }
        func press(_ text:String,_ then:@escaping()->Void){
            for c in text{self.key(document,String(c),codes[c] ?? 0)}
            self.later(0.15){then()}
        }
        func saved(_ name:String)->[[String:Any]]{
            guard let data=try? ProjectFileSafety.readBounded(directory.appendingPathComponent(name)),let doc=try? JSONSerialization.jsonObject(with:data) as? [String:Any],let pages=doc["pages"] as? [[String:Any]],let nodes=pages[0]["nodes"] as? [[String:Any]] else{self.smokeFail("workflow file missing")}
            return nodes
        }
        let edit=integrationMenu("Edit")
        loadDocument(document,acceptanceDocument("accept-workflow","Workflow"){nodes in nodes.removeAll()}){
            self.page(document,"await window.__studioCommand('deselect');const r=document.querySelector('#forma-design-canvas').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,r.width,r.height];"){value in
                guard let at=value as? [Double] else{self.smokeFail("canvas point")}
                let x=CGFloat(at[0]),y=CGFloat(at[1])
                document.window.makeFirstResponder(document.web)
                press("f"){drag((x-200,y-150),(x+100,y+200)){
                    press("r"){drag((x-150,y-100),(x-50,y-20)){
                        press("t"){
                            self.mouse(document,.leftMouseDown,x-150,y+60);self.mouse(document,.leftMouseUp,x-150,y+60)
                            self.later(0.3){
                                self.page(document,"await wait(()=>document.activeElement?.getAttribute('aria-label')==='Edit text','canvas text editor focused');return true;"){_ in
                                    press("Hello"){
                                        self.key(document,"\u{1b}",53)
                                        self.later(0.3){
                                            press("r"){drag((x+160,y-100),(x+240,y-20)){
                                                drag((x+200,y-60),(x+20,y+120)){
                                                    self.mouse(document,.leftMouseDown,x-300,y+260);self.mouse(document,.leftMouseUp,x-300,y+260)
                                                    self.later(0.2){drag((x-100,y-60),(x+10,y-60),[.option]){
                                                        self.later(0.2){
                                                            document.session.file=directory.appendingPathComponent("Workflow.oui")
                                                            self.js(document,"return await window.__studioSave();"){_ in
                                                                let nodes=saved("Workflow.oui"),frames=nodes.filter{$0["type"] as? String=="frame"},rects=nodes.filter{$0["type"] as? String=="rectangle"},texts=nodes.filter{$0["type"] as? String=="text"},frame=frames.first?["id"] as? String
                                                                self.check(frames.count==1,"dragging with the Frame tool draws one frame (\(frames.count))")
                                                                self.check(texts.count==1 && texts.first?["text"] as? String=="Hello","typing after the Text tool replaces the placeholder (\(texts.first?["text"] as? String ?? "none"))")
                                                                self.check(frame != nil && texts.first?["parentId"] as? String==frame,"text placed in a frame belongs to that frame")
                                                                self.check(rects.count==3,"drawing two rectangles and Option-dragging one gives three (\(rects.count))")
                                                                self.check(rects.count==3 && rects.allSatisfy{$0["parentId"] as? String==frame},"a rectangle dragged in from the page joins the frame, with the others")
                                                                self.invoke(edit,"undo")
                                                                self.later(0.3){
                                                                    self.js(document,"return await window.__studioSave();"){_ in
                                                                        self.check(saved("Workflow.oui").filter{$0["type"] as? String=="rectangle"}.count==2,"one Undo removes the whole Option-drag copy")
                                                                        self.invoke(edit,"redo")
                                                                        self.later(0.3){
                                                                            self.js(document,"return await window.__studioSave();"){_ in
                                                                                guard let data=try? ProjectFileSafety.readBounded(directory.appendingPathComponent("Workflow.oui")) else{self.smokeFail("workflow reopen")}
                                                                                self.loadDocument(document,String(decoding:data,as:UTF8.self)){
                                                                                    self.page(document,"await wait(()=>document.querySelectorAll('[data-layer-id]').length===5,'five layers after reopening');return [...document.querySelectorAll('#forma-design-canvas text')].map(e=>e.textContent).join(' ');"){value in
                                                                                        self.check((value as? String)?.contains("Hello")==true,"the saved screen reopens and paints its text")
                                                                                        document.session.file=nil;document.session.fingerprint=nil;done()
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }}
                                                }
                                            }}
                                        }
                                    }
                                }
                            }
                        }
                    }}
                }}
            }
        }
    }
    func acceptSampler(_ document:DocumentWindow,_ done:@escaping()->Void){
        let edit=integrationMenu("Edit"),item=menuItem(edit,"native-sample-color")
        check(item.keyEquivalent=="c" && item.keyEquivalentModifierMask==[.control,.command],"Edit has Sample Screen Color on Control-Command-C")
        let fill="getComputedStyle(document.querySelector('#forma-design-canvas [data-node-id=\"accept-rect\"] rect, #forma-design-canvas [data-node-id=\"accept-rect\"] path')).fill"
        smokeScreenColor=NSColor(colorSpace:.sRGB,components:[0.2,0.4,0.6,1],count:4)
        loadDocument(document,acceptanceDocument("accept-sampler","Sampler")){
            self.page(document,"await window.__studioCommand('deselect');return true;"){_ in
                self.invoke(edit,"native-sample-color")
                self.page(document,"return await wait(()=>[...document.querySelectorAll('[role=status]')].map(e=>e.textContent).find(t=>t.startsWith('Sampled ')),'sampled toast');"){value in
                    self.check((value as? String)?.contains("#336699")==true,"with no color picker open the sampled color goes to recent colors")
                    self.page(document,"document.querySelector('[data-layer-id=\"accept-rect\"]').click();await wait(()=>document.querySelector('.paint-color-chip'),'color chip');document.querySelector('.paint-color-chip').click();await wait(()=>find('Sample canvas color'),'color picker');return \(fill);"){before in
                        self.invoke(edit,"native-sample-color")
                        self.page(document,"await wait(()=>\(fill)==='rgb(51, 102, 153)','sampled fill',4000);click('Sample screen color');await wait(()=>document.body.textContent.includes('Sample Screen Color'),'in-page guidance');await window.__studioCommand('undo');await wait(()=>\(fill)===\(self.json(before as? String ?? "")),'one undo',4000);return true;"){_ in
                            self.check(true,"the sampled color fills the open color picker's target with one Undo")
                            self.acceptSamplerP3(document,edit,done)
                        }
                    }
                }
            }
        }
    }
    func acceptSamplerP3(_ document:DocumentWindow,_ edit:NSMenu,_ done:@escaping()->Void){
        let fill="getComputedStyle(document.querySelector('#forma-design-canvas [data-node-id=\"accept-rect\"] rect, #forma-design-canvas [data-node-id=\"accept-rect\"] path')).fill"
        smokeScreenColor=NSColor(colorSpace:.displayP3,components:[0,1,0,1],count:4)
        loadDocument(document,acceptanceDocument("accept-sampler-p3","Sampler P3",extra:["colorProfile":"display-p3"])){
            self.page(document,"document.querySelector('[data-layer-id=\"accept-rect\"]').click();await wait(()=>document.querySelector('.paint-color-chip'),'color chip');document.querySelector('.paint-color-chip').click();await wait(()=>find('Sample canvas color'),'color picker');return true;"){_ in
                self.invoke(edit,"native-sample-color")
                self.page(document,"return await wait(()=>\(fill).startsWith('color(display-p3 0 1 0'),'wide sampled fill',4000);"){_ in
                    self.check(true,"a Display P3 file keeps the wide sampled coordinates instead of a clipped sRGB copy")
                    self.smokeScreenColor=nil
                    done()
                }
            }
        }
    }
    /** Core Text measures the same named face independently, so a width match means CSS weight really reached that face. */
    func acceptInstalledFaces(_ document:DocumentWindow,_ done:@escaping()->Void){
        guard let family=["Helvetica Neue","Avenir Next","Avenir"].first(where:{(Studio.installedFaces($0).count)>=4}) else{smokeFail("no multi-face system family")}
        let faces=Studio.installedFaces(family),sample="Hamburgefonstiv 0123"
        func advance(_ postscript:String)->Double {let font=NSFont(name:postscript,size:64)!;return Double((sample as NSString).size(withAttributes:[.font:font]).width)}
        loadDocument(document,acceptanceDocument("accept-faces","Faces"){nodes in nodes[2]["fontFamily"]=family}){
            self.page(document,"const raw=await window.desktop.fontFaces(\(self.json(family))),paths=JSON.stringify(raw).includes('/'),refused=await window.desktop.fontFaces('No such family'),long=await window.desktop.fontFaces('x'.repeat(300)).then(()=>'accepted',()=>'refused');const canvas=document.createElement('canvas').getContext('2d'),widths=raw.map(f=>{canvas.font=(f.italic?'italic ':'')+f.weight+' 64px '+JSON.stringify(\(self.json(family)));return [f.postscript,canvas.measureText(\(self.json(sample))).width];});return {count:raw.length,paths,refused:refused.length,long,widths};"){value in
                guard let body=value as? [String:Any],let widths=body["widths"] as? [[Any]] else{self.smokeFail("installed faces report")}
                self.check(body["paths"] as? Bool==false && (body["count"] as? Int ?? 0)==faces.count,"the font message returns \(faces.count) named faces of \(family) with no path")
                self.check(body["refused"] as? Int==0 && body["long"] as? String=="refused","an unknown family has no faces and an oversized name is refused")
                let matched=widths.filter{abs(($0[1] as? Double ?? 0)-advance($0[0] as? String ?? ""))<1.5}.count
                self.check(matched==widths.count,"CSS weight reaches each named face, by Core Text advance width (\(matched)/\(widths.count))")
                self.page(document,"document.querySelector('[data-layer-id=\"accept-text\"]').click();const s=await wait(()=>document.querySelector('select[aria-label=\"Font style\"]')?.options.length>=\(faces.count)&&document.querySelector('select[aria-label=\"Font style\"]'),'face list in the inspector');return [...s.options].map(o=>o.textContent);"){value in
                    let labels=value as? [String] ?? []
                    self.check(labels.count>=faces.count && faces.allSatisfy{labels.contains($0["label"] as? String ?? "")},"the Font style select lists the installed faces by name (\(labels.joined(separator:", ")))")
                    let light=faces.first{$0["weight"] as? Int != 400 && $0["italic"] as? Bool==false}!
                    self.page(document,"pick('Font style',\(self.json("\(light["weight"]!)")));await wait(()=>document.querySelector('#forma-design-canvas [data-node-id=\"accept-text\"] text')?.getAttribute('font-weight')===\(self.json("\(light["weight"]!)")),'canvas text weight');await window.__studioCommand('undo');return true;"){_ in
                        self.check(true,"choosing a face sets its weight on the canvas with one Undo")
                        done()
                    }
                }
            }
        }
    }
    func axValue(_ element:AXUIElement,_ attribute:String)->(AXError,AnyObject?) {var value:AnyObject?;let error=AXUIElementCopyAttributeValue(element,attribute as CFString,&value);return (error,value)}
    func axWalk(_ element:AXUIElement,_ depth:Int,_ visit:(String,String,String,AXUIElement)->Void,_ budget:inout Int){
        guard budget>0,depth<40 else{return};budget-=1
        let role=axValue(element,kAXRoleAttribute).1 as? String ?? "",title=axValue(element,kAXTitleAttribute).1 as? String ?? "",description=axValue(element,kAXDescriptionAttribute).1 as? String ?? ""
        visit(role,title,description,element)
        for child in axValue(element,kAXChildrenAttribute).1 as? [AXUIElement] ?? []{axWalk(child,depth+1,visit,&budget)}
    }
    /** Without the Accessibility permission macOS refuses to cross into the WebContent process (kAXErrorCannotComplete), so this cannot read ARIA.
     * It proves what is reachable: the shell's own AX tree, and that WKWebView hands assistive software a bridge to its page. */
    func acceptAccessibility(_ document:DocumentWindow,_ done:@escaping()->Void){
        loadDocument(document,acceptanceDocument("accept-ax","Accessible")){
            self.later(0.3){
                let app=AXUIElementCreateApplication(getpid()),(error,windows)=self.axValue(app,kAXWindowsAttribute)
                guard error == .success,let window=(windows as? [AXUIElement])?.first else{self.smokeFail("AX application windows: \(error.rawValue)")}
                var budget=2000,roles:[String:Int]=[:],title=""
                self.axWalk(window,0,{role,name,_,_ in roles[role,default:0]+=1;if role=="AXWindow"{title=name}},&budget)
                self.check(title=="Accessible" && (roles["AXButton"] ?? 0)>=3,"AXUIElement reads the real window title and its controls from the shell")
                let bridge=document.web.accessibilityChildren()?.first as? NSObject
                self.check(bridge.map{String(describing:type(of:$0))}=="NSAccessibilityRemoteUIElement","WKWebView exposes a remote accessibility element for its page")
                let webApp=AXUIElementCreateApplication(self.rendererPid(document)),(crossing,_)=self.axValue(webApp,kAXChildrenAttribute)
                self.check(AXIsProcessTrusted() || crossing != .success,"page-level AX stays unverified here: AXIsProcessTrusted=\(AXIsProcessTrusted()), WebContent read error \(crossing.rawValue)")
                done()
            }
        }
    }
    func key(_ document:DocumentWindow,_ characters:String,_ code:UInt16,_ flags:NSEvent.ModifierFlags=[]){
        for type in [NSEvent.EventType.keyDown,.keyUp]{guard let event=NSEvent.keyEvent(with:type,location:.zero,modifierFlags:flags,timestamp:ProcessInfo.processInfo.systemUptime,windowNumber:document.window.windowNumber,context:nil,characters:characters,charactersIgnoringModifiers:characters,isARepeat:false,keyCode:code) else{smokeFail("key event")};document.window.sendEvent(event)}
    }
    /** Real key events through AppKit. This Mac has the system keyboard navigation setting at its default. */
    func acceptKeyboard(_ document:DocumentWindow,_ done:@escaping()->Void){
        let emoji=menuItem(integrationMenu("Edit"),"Emoji & Symbols")
        check(emoji.action==#selector(NSApplication.orderFrontCharacterPalette(_:)) && NSApp.responds(to:emoji.action!),"Edit offers the system Emoji & Symbols panel")
        loadDocument(document,acceptanceDocument("accept-keys","Keys")){
            self.page(document,"document.querySelector('[data-layer-id=\"accept-rect\"]').click();document.querySelector('[aria-label=\"Zoom in\"]').focus();window.__tabs=[];document.addEventListener('focusin',e=>window.__tabs.push(e.target.tagName),true);return true;"){_ in
                document.window.makeFirstResponder(document.web)
                func press(_ left:Int){
                    if left>0{self.key(document,"\t",48);self.later(0.08){press(left-1)};return}
                    self.page(document,"const seen=window.__tabs.slice(),last=document.activeElement.getAttribute('aria-label')||document.activeElement.textContent;return {seen,ring:document.activeElement.matches(':focus-visible'),last};"){value in
                        let body=value as? [String:Any],seen=body?["seen"] as? [String] ?? []
                        self.check(seen.count==6 && seen.contains("BUTTON") && seen.contains("INPUT"),"real Tab key events move focus through buttons and fields in WKWebView (\(seen.joined(separator:" ")))")
                        self.check(body?["ring"] as? Bool==true,"keyboard focus matches :focus-visible, so the focus ring shows")
                        self.key(document,"\u{19}",48,[.shift])
                        self.later(0.1){
                            self.page(document,"return window.__tabs.length;"){value in
                                self.check(value as? Int==7,"Shift-Tab moves focus back");done()
                            }
                        }
                    }
                }
                press(6)
            }
        }
    }
    /** WebKit reads system settings the same way a person's Mac would; this reports what the shell sees on this Mac rather than changing it. */
    func acceptInterface(_ document:DocumentWindow,_ done:@escaping()->Void){
        let workspace=NSWorkspace.shared,reduce=workspace.accessibilityDisplayShouldReduceMotion,contrast=workspace.accessibilityDisplayShouldIncreaseContrast
        loadDocument(document,acceptanceDocument("accept-interface","Interface")){
            self.page(document,"return {motion:matchMedia('(prefers-reduced-motion: reduce)').matches,contrast:matchMedia('(prefers-contrast: more)').matches};"){value in
                let body=value as? [String:Any]
                self.check(body?["motion"] as? Bool==reduce,"prefers-reduced-motion in WKWebView equals the macOS setting (\(reduce))")
                self.check(body?["contrast"] as? Bool==contrast,"prefers-contrast in WKWebView equals the macOS setting (\(contrast))")
                self.page(document,"await window.__studioCommand('preferences');await wait(()=>document.querySelector('[aria-label=\"Interface scale\"]'),'preferences');pick('Interface scale','1.25');await new Promise(r=>setTimeout(r,200));click('Close dialog',document.querySelector('[role=dialog]'));await wait(()=>!document.querySelector('[role=dialog]'),'preferences closed');await window.__studioCommand('deselect');await new Promise(r=>setTimeout(r,300));const r=document.querySelector('#forma-design-canvas [data-node-id=\"accept-frame-2\"]').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};"){value in
                    guard let at=value as? [String:Any],let x=at["x"] as? Double,let y=at["y"] as? Double else{self.smokeFail("scaled layer point")}
                    document.window.makeFirstResponder(document.web)
                    self.mouse(document,.leftMouseDown,CGFloat(x),CGFloat(y));self.mouse(document,.leftMouseUp,CGFloat(x),CGFloat(y))
                    self.until("scaled click selects",{document.state?.menu?.selection==true},{
                        self.page(document,"return document.querySelector('.layer-row.selected, [role=treeitem][aria-selected=true]')?.textContent??'';"){value in
                            self.check((value as? String)?.contains("Frame two")==true,"at 125% interface scale a real click selects the layer under it in WebKit")
                            self.page(document,"await window.__studioCommand('preferences');await wait(()=>document.querySelector('[aria-label=\"Interface scale\"]'),'preferences');pick('Interface scale','1');await new Promise(r=>setTimeout(r,120));click('Close dialog',document.querySelector('[role=dialog]'));await wait(()=>!document.querySelector('[role=dialog]'),'preferences closed');return [typeof document.documentElement.requestFullscreen,document.fullscreenEnabled];"){value in
                                let fullscreen=value as? [Any]
                                self.check(fullscreen?[0] as? String=="function" && fullscreen?[1] as? Bool==true,"element full screen is available to presentations in WKWebView")
                                self.js(document,"const e=document.createElement('div');e.id='accept-full';e.style.background='#123';document.body.appendChild(e);window.__full=[];document.addEventListener('fullscreenchange',()=>window.__full.push(document.fullscreenElement?.id??'none'));document.addEventListener('fullscreenerror',()=>window.__full.push('error'));e.requestFullscreen().catch(x=>window.__full.push('rejected:'+x.name));return true;"){_ in
                                    self.page(document,"await wait(()=>window.__full.length,'full screen response',6000);const first=window.__full[0];if(first==='accept-full'){await new Promise(r=>setTimeout(r,900));await document.exitFullscreen();await wait(()=>window.__full.includes('none'),'exit full screen',6000);}document.getElementById('accept-full').remove();return first;"){value in
                                        self.check(value as? String=="accept-full","requestFullscreen enters and leaves real full screen from WKWebView")
                                        self.later(1.2,done)
                                    }
                                }
                            }
                        }
                    })
                }
            }
        }
    }
    func acceptExportedFont(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        smokeSaveDirectory=directory
        loadDocument(document,acceptanceDocument("accept-font","Fonts"){nodes in nodes=[nodes[2]];nodes[0]["parentId"]=NSNull();nodes[0]["name"]="Script";nodes[0]["x"]=40;nodes[0]["y"]=40;nodes[0]["width"]=900;nodes[0]["height"]=120;nodes[0]["fontFamily"]="Caveat";nodes[0]["fontSize"]=72;nodes[0]["text"]="Hamburgefonstiv";nodes[0]["fill"]="#000000"}){
            self.page(document,"await document.fonts.load('72px Caveat');await new Promise(r=>setTimeout(r,300));const c=document.createElement('canvas').getContext('2d');c.font='72px Caveat';const script=c.measureText('Hamburgefonstiv').width;c.font='72px Helvetica';const fallback=c.measureText('Hamburgefonstiv').width;document.querySelector('[data-layer-id=\"accept-text\"]').click();await new Promise(r=>setTimeout(r,150));return [script,fallback];"){value in
                guard let widths=value as? [Double] else{self.smokeFail("font widths")}
                self.clickExport(document,"png"){
                    self.saved(directory,"Script.png"){_,data in
                        guard let image=self.decoded(data),let provider=image.dataProvider?.data,let bytes=CFDataGetBytePtr(provider) else{self.smokeFail("font PNG")}
                        var left=image.width,right=0;for y in 0..<image.height{for x in 0..<image.width{let at=y*image.bytesPerRow+x*image.bitsPerPixel/8;if bytes[at+3]>128{left=min(left,x);right=max(right,x)}}}
                        let ink=Double(right-left+1)
                        self.check(abs(ink-widths[0])<widths[0]*0.12 && abs(widths[0]-widths[1])>widths[0]*0.15,"exported PNG text uses the embedded font in WebKit, not a fallback (\(Int(ink)) px ink, \(Int(widths[0])) px expected, \(Int(widths[1])) px fallback)")
                        self.closeDialog(document,done)
                    }
                }
            }
        }
    }
    /** The module worker path of the Sketch importer, entered through a real Finder drop of a package zip made by /usr/bin/zip. */
    func acceptSketchDrop(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        let folder=directory.appendingPathComponent("sketch-source",isDirectory:true),pages=folder.appendingPathComponent("pages",isDirectory:true),file=directory.appendingPathComponent("Drawing.sketch")
        let frame:[String:Any]=["_class":"rect","x":20,"y":30,"width":120,"height":80],fill:[String:Any]=["_class":"fill","isEnabled":true,"fillType":0,"color":["_class":"color","red":1,"green":0,"blue":0,"alpha":1]]
        let shape:[String:Any]=["_class":"rectangle","do_objectID":"Red","name":"Sketch red","rotation":0,"isFlippedHorizontal":false,"isFlippedVertical":false,"isVisible":true,"isLocked":false,"booleanOperation":-1,"frame":frame,"style":["_class":"style","contextSettings":["_class":"graphicsContextSettings","blendMode":0,"opacity":1],"fills":[fill],"borders":[]]]
        let page:[String:Any]=["_class":"page","do_objectID":"page-source","name":"Sketch page","layers":[shape]],root:[String:Any]=["_class":"document","pages":[["_class":"MSJSONFileReference","_ref_class":"MSImmutablePage","_ref":"pages/page-source"]]]
        do{try FileManager.default.createDirectory(at:pages,withIntermediateDirectories:true);try Data(json(root).utf8).write(to:folder.appendingPathComponent("document.json"));try Data(json(page).utf8).write(to:pages.appendingPathComponent("page-source.json"));let process=Process();process.executableURL=URL(fileURLWithPath:"/usr/bin/zip");process.currentDirectoryURL=folder;process.arguments=["-qr",file.path,"document.json","pages"];try process.run();process.waitUntilExit()}catch{smokeFail(error.localizedDescription)}
        loadDocument(document,acceptanceDocument("accept-sketch","Before Sketch")){
            self.page(document,"const r=document.querySelector('#forma-design-canvas').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];"){value in
                guard let at=value as? [Double] else{self.smokeFail("canvas point")}
                self.dropOnWindow(document,[file],x:CGFloat(at[0]),y:CGFloat(at[1]))
                self.page(document,"await wait(()=>find('Open editable project')&&!find('Open editable project').disabled,'Sketch review from the real worker',15000);click('Open editable project');await wait(()=>[...document.querySelectorAll('.layer-row')].some(r=>r.textContent.includes('Sketch red')),'Sketch layer',8000);return true;"){_ in
                    self.check(true,"a .sketch dropped from Finder runs its module worker in WKWebView and opens editable layers after review")
                    done()
                }
            }
        }
    }
    /** Worker, CMap and raster paths of the PDF importer, entered through a real Finder drop. */
    func acceptPdfDrop(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        let file=directory.appendingPathComponent("Pages.pdf");var box=CGRect(x:0,y:0,width:200,height:120)
        guard let context=CGContext(file as CFURL,mediaBox:&box,nil) else{smokeFail("PDF fixture")}
        context.beginPDFPage(nil);context.setFillColor(CGColor(red:1,green:0,blue:0,alpha:1));context.fill(CGRect(x:0,y:0,width:200,height:120));context.endPDFPage();context.closePDF()
        loadDocument(document,acceptanceDocument("accept-pdf","Before PDF")){
            self.page(document,"const r=document.querySelector('#forma-design-canvas').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];"){value in
                guard let at=value as? [Double] else{self.smokeFail("canvas point")}
                self.dropOnWindow(document,[file],x:CGFloat(at[0]),y:CGFloat(at[1]))
                self.page(document,"await wait(()=>find('Open PDF pages as project')&&!find('Open PDF pages as project').disabled,'PDF review from the real parser worker',15000);click('Open PDF pages as project');await wait(()=>[...document.querySelectorAll('#forma-design-canvas [data-node-id] *')].some(e=>getComputedStyle(e).fill==='rgb(255, 0, 0)'),'PDF page shape',10000);return document.title;"){_ in
                    self.check(true,"a PDF dropped from Finder runs its parser worker in WKWebView and opens its page image after review")
                    done()
                }
            }
        }
    }
    func mouse(_ document:DocumentWindow,_ type:NSEvent.EventType,_ x:CGFloat,_ y:CGFloat,_ flags:NSEvent.ModifierFlags=[]){
        let point=document.web.convert(NSPoint(x:x,y:y),to:nil)
        guard let event=NSEvent.mouseEvent(with:type,location:point,modifierFlags:flags,timestamp:ProcessInfo.processInfo.systemUptime,windowNumber:document.window.windowNumber,context:nil,eventNumber:1,clickCount:1,pressure:1) else{smokeFail("mouse event")}
        document.window.sendEvent(event)
    }
    /** Drags through the real WebKit drag destination methods with a real pasteboard holding real file URLs. */
    func dropOnWindow(_ document:DocumentWindow,_ files:[URL],x:CGFloat,y:CGFloat){
        let board=NSPasteboard.withUniqueName();board.clearContents();board.writeObjects(files as [NSURL])
        let drag=SmokeDrag(board,document.web.convert(NSPoint(x:x,y:y),to:nil),document.window)
        let entered=document.web.draggingEntered(drag);_ = document.web.draggingUpdated(drag)
        later(0.25){
            let updated=document.web.draggingUpdated(drag)
            self.later(0.15){
                if entered==[] && updated==[]{self.smokeFail("WebKit refused the drag")}
                if document.web.prepareForDragOperation(drag){_ = document.web.performDragOperation(drag);document.web.concludeDragOperation(drag)}else{self.smokeFail("WebKit refused the drop")}
            }
        }
    }
    func acceptDrop(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        let png=directory.appendingPathComponent("Dropped.png"),tiff=directory.appendingPathComponent("Scan.tiff"),svg=directory.appendingPathComponent("Vector.svg"),heic=directory.appendingPathComponent("Photo.heic"),project=directory.appendingPathComponent("Dropped project.oui")
        do{try clipboardRasterFixture().write(to:png);try clipboardRasterFixture(type:"public.tiff").write(to:tiff);try Data("<svg xmlns='http://www.w3.org/2000/svg' width='60' height='40'><rect width='60' height='40' fill='#123456'/></svg>".utf8).write(to:svg);try Data(acceptanceDocument("accept-dropped","Dropped project").utf8).write(to:project)}catch{smokeFail(error.localizedDescription)}
        let heicData=clipboardRasterFixture(type:"public.heic");var hasHeic=false;if !heicData.isEmpty{hasHeic=(try? heicData.write(to:heic)) != nil}
        let rows="[...document.querySelectorAll('.layer-row')].map(r=>r.textContent)"
        func canvasPoint(_ then:@escaping(CGFloat,CGFloat)->Void){self.page(document,"const r=document.querySelector('#forma-design-canvas').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];"){value in guard let p=value as? [Double] else{self.smokeFail("canvas point")};then(p[0],p[1])}}
        loadDocument(document,acceptanceDocument("accept-drop","Drops"){nodes in nodes.removeAll()}){
            canvasPoint{x,y in
                self.dropOnWindow(document,[png],x:x,y:y)
                self.page(document,"await wait(()=>\(rows).some(t=>t.includes('Dropped.png')),'dropped PNG layer');await window.__studioCommand('undo');await wait(()=>!\(rows).some(t=>t.includes('Dropped.png')),'drop undo');await window.__studioCommand('redo');await wait(()=>\(rows).some(t=>t.includes('Dropped.png')),'drop redo');const n=document.querySelector('#forma-design-canvas [data-node-id]');const r=n?.getBoundingClientRect();return r?[r.left+r.width/2,r.top+r.height/2]:null;"){value in
                    guard let at=value as? [Double] else{self.smokeFail("dropped image on canvas")}
                    self.check(abs(at[0]-Double(x))<4 && abs(at[1]-Double(y))<4,"Finder PNG dropped through WebKit lands under the pointer with one Undo")
                    self.dropOnWindow(document,[tiff],x:x,y:y)
                    self.page(document,"await wait(()=>\(rows).some(t=>t.includes('Scan.png')),'converted TIFF layer',10000);return true;"){_ in
                        self.check(true,"a TIFF dropped from Finder converts to an embedded PNG layer")
                        self.acceptDropHeic(document,hasHeic ? heic:nil,x,y){
                            self.dropOnWindow(document,[svg],x:x,y:y)
                            self.page(document,"await wait(()=>document.querySelector('[role=dialog]')&&document.body.textContent.includes('Import editable layers'),'SVG review after drop');click('Cancel SVG import');return true;"){_ in
                                self.check(true,"an SVG dropped from Finder reaches the validated import review")
                                self.dropOnWindow(document,[png,tiff],x:x,y:y)
                                self.page(document,"await wait(()=>\(rows).filter(t=>t.includes('Dropped.png')||t.includes('Scan.png')).length>=4,'batch of two images',10000);return true;"){_ in
                                self.check(true,"two images dropped together import as one batch")
                                self.dropOnWindow(document,[png,project],x:x,y:y)
                                self.later(0.8){
                                    self.page(document,"return await wait(()=>status().includes('one project')||document.body.textContent.includes('one project'),'mixed drop refusal');"){_ in
                                        self.check(self.documents.count==1,"a project mixed with images is refused without opening anything")
                                        self.smokeReadyOverride={opened in
                                            self.check(opened !== document && opened.session.file?.lastPathComponent=="Dropped project.oui" && opened.state?.name=="Dropped project","a .oui dropped on the window opens in its own saved-file window through the shell")
                                            let count=self.documents.count;self.dropOnWindow(document,[project],x:x,y:y)
                                            self.later(0.8){
                                                self.check(self.documents.count==count,"dropping an already open project focuses its window")
                                                opened.closeApproved();document.window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
                                                self.until("dropped project closed",{self.documents.count==1},done)
                                            }
                                        }
                                        self.dropOnWindow(document,[project],x:x,y:y)
                                    }
                                }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    func acceptDropHeic(_ document:DocumentWindow,_ file:URL?,_ x:CGFloat,_ y:CGFloat,_ done:@escaping()->Void){
        guard let file else{print("HEIC encoder unavailable: skipped");done();return}
        dropOnWindow(document,[file],x:x,y:y)
        page(document,"await wait(()=>[...document.querySelectorAll('.layer-row')].some(t=>t.textContent.includes('Photo.png')),'converted HEIC layer',10000);return true;"){_ in
            self.check(true,"a HEIC dropped from Finder converts to an embedded PNG layer");done()
        }
    }
    /** The promise is WebKit's own. Finder would call this same delegate; a real Finder drop needs a person's mouse. */
    func acceptDragOut(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        loadDocument(document,acceptanceDocument("accept-drag","Drags")){
            self.page(document,"document.querySelector('[data-layer-id=\"accept-rect\"]').click();await new Promise(r=>setTimeout(r,120));await window.__studioCommand('export');await wait(()=>document.querySelector('[role=dialog]'),'export dialog');pick('Export file format','png');await new Promise(r=>setTimeout(r,120));for(const d of document.querySelectorAll('[role=dialog] details'))if(/preview/i.test(d.querySelector('summary').textContent)){d.open=true;break;}const i=await wait(()=>document.querySelector('.export-preview img'),'export preview');await i.decode();const r=i.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];"){value in
                guard let at=value as? [Double] else{self.smokeFail("preview point")}
                var finished=false
                document.web.smokeDragSession={items in
                    guard let provider=items.first?.item as? NSFilePromiseProvider,let delegate=provider.delegate else{self.smokeFail("WebKit drag is not a file promise")}
                    self.check(provider.fileType=="public.png","WebKit starts a native file promise for the dragged export preview")
                    self.later(0.3){
                        let name=delegate.filePromiseProvider(provider,fileNameForType:provider.fileType),target=directory.appendingPathComponent("promised-"+name)
                        self.check(name=="Card.png","the promised file carries the export name, not WebKit's Unknown (\(name))")
                        delegate.filePromiseProvider(provider,writePromiseTo:target){error in DispatchQueue.main.async{
                            guard error==nil,let data=try? Data(contentsOf:target),let image=self.decoded(data) else{self.smokeFail("file promise write: \(String(describing:error))")}
                            self.check(self.close(self.sample(image,image.width/2,image.height/2),[255,0,0],2),"the promise writes the real exported image bytes (\(data.count) bytes)")
                            finished=true;done()
                        }}
                    }
                }
                let x=CGFloat(at[0]),y=CGFloat(at[1])
                self.mouse(document,.leftMouseDown,x,y)
                self.later(0.15){self.mouse(document,.leftMouseDragged,x+5,y+5)
                    self.later(0.15){self.mouse(document,.leftMouseDragged,x+20,y+20)
                        self.later(0.15){self.mouse(document,.leftMouseDragged,x+60,y+60)
                            self.later(4){if !finished{self.smokeFail("WebKit did not start a drag from the export preview")}}
                        }
                    }
                }
            }
        }
    }
}

/** A real NSDraggingInfo for WebKit's drag destination; AppKit does not expose a constructor for one. */
final class SmokeDrag:NSObject,NSDraggingInfo {
    let draggingPasteboard:NSPasteboard;let draggingLocation:NSPoint;weak var draggingDestinationWindow:NSWindow?
    init(_ board:NSPasteboard,_ location:NSPoint,_ window:NSWindow){draggingPasteboard=board;draggingLocation=location;draggingDestinationWindow=window}
    var draggingSourceOperationMask:NSDragOperation {.copy}
    var draggedImageLocation:NSPoint {draggingLocation}
    var draggedImage:NSImage? {nil}
    var draggingSource:Any? {nil}
    var draggingSequenceNumber:Int {1}
    func slideDraggedImage(to screenPoint:NSPoint){}
    override func namesOfPromisedFilesDropped(atDestination dropDestination:URL)->[String]? {nil}
    var draggingFormation:NSDraggingFormation {get{.none}set{}}
    var animatesToDestination:Bool {get{false}set{}}
    var numberOfValidItemsForDrop:Int {get{1}set{}}
    func enumerateDraggingItems(options:NSDraggingItemEnumerationOptions,for view:NSView?,classes:[AnyClass],searchOptions:[NSPasteboard.ReadingOptionKey:Any],using block:@escaping(NSDraggingItem,Int,UnsafeMutablePointer<ObjCBool>)->Void){}
    var springLoadingHighlight:NSSpringLoadingHighlight {.none}
    func resetSpringLoading(){}
}
