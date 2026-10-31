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
        return [("open-panel",{self.acceptOpenPanel(document,directory,$0)}),("save",{self.acceptSaveAs(document,directory,$0)}),("export",{self.acceptDesignExports(document,directory,$0)}),("zip",{self.acceptProjectZips(document,directory,$0)}),("p3",{self.acceptDisplayP3(document,directory,$0)}),("shader",{self.acceptShaders(document,directory,$0)}),("code",{self.acceptCodeLayer(document,directory,$0)}),("plugin",{self.acceptPlugin(document,directory,$0)}),("widget",{self.acceptWidget(document,directory,$0)}),("video",{self.acceptVideo(document,directory,$0)}),("crash",{self.acceptCrash(document,directory,$0)}),("drop",{self.acceptDrop(document,directory,$0)}),("drag",{self.acceptDragOut(document,directory,$0)})]
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
                                self.closeDialog(document,done)
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
            done()
        }
    }
    func acceptCodeLayer(_ document:DocumentWindow,_ directory:URL,_ done:@escaping()->Void){
        smokeSaveDirectory=directory
        let code:[String:Any]=["version":1,"html":"<div id=\"m\">start</div><div id=\"box\"></div>","css":"html,body{margin:0;height:100%;background:#00ff00}#box{position:absolute;left:10px;top:10px;width:60px;height:60px;background:#0000ff;border-radius:4px}#m{position:absolute;left:100px;top:100px;font:40px sans-serif;color:#000}","js":"document.getElementById('m').textContent='ran';parent.postMessage({forma:'probe',origin:self.origin,fetch:typeof fetch},'*');const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.getContext('2d').drawImage(img,0,0);let t='clean';try{c.toDataURL();}catch(e){t=e.name;}parent.postMessage({forma:'taint',value:t},'*');};img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"2\" height=\"2\"><foreignObject width=\"2\" height=\"2\"><div xmlns=\"http://www.w3.org/1999/xhtml\"></div></foreignObject></svg>');","properties":[],"values":[:],"preview":"none"]
        loadDocument(document,acceptanceDocument("accept-code","Code"){nodes in nodes[1]["type"]="code";nodes[1]["name"]="Widget";nodes[1]["code"]=code;nodes[1]["parentId"]=NSNull();nodes[1]["x"]=40;nodes[1]["y"]=40;nodes[1]["width"]=320;nodes[1]["height"]=200}){
            self.page(document,"document.querySelector('[data-layer-id=\"accept-rect\"]').click();await wait(()=>find('Edit code'),'code inspector');click('Edit code');await wait(()=>find('Run code'),'code dialog');const frames=document.querySelectorAll('[data-guest-frame]').length;window.__probe=[];addEventListener('message',e=>{if(e.data?.forma==='probe')window.__probe.push([e.origin,e.data.origin,e.data.fetch]);if(e.data?.forma==='taint')window.__taint=e.data.value;});click('Run code');await wait(()=>document.querySelector('[data-guest-frame]')&&window.__probe.length&&window.__taint,'guest ran');return {framesBefore:frames,probe:window.__probe[0],sandbox:document.querySelector('[data-guest-frame]').getAttribute('sandbox')};"){value in
                let body=value as? [String:Any],probe=body?["probe"] as? [Any]
                self.check(body?["framesBefore"] as? Int==0,"code source stays inert until explicit Run")
                self.check(probe?[0] as? String=="null" && probe?[1] as? String=="null" && probe?[2] as? String=="undefined","code runs in an opaque WKWebView frame with fetch removed")
                self.page(document,"click('Save code and preview');await wait(()=>!document.querySelector('.code-layer-dialog'),'dialog closes after preview',8000);return window.__taint;"){value in
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
        page(document,"\(json("")) ;const first=\(pages);await window.__studioCommand('undo');await wait(()=>\(pages)<first,'undo removes the replayed journal edit');const second=\(pages);await window.__studioCommand('undo');await wait(()=>\(pages)<second,'undo reaches history saved before the kill');return first;"){value in
            self.check(true,"replayed edit and the Undo history stored before the kill both undo in the new renderer")
            self.page(document,"await new Promise(r=>setTimeout(r,3300));return true;"){_ in self.acceptSafeMode(document,done)}
        }
    }
    /** Starts that die before they prove healthy leave boot markers, the real trigger for safe mode. The first kill only ends a healthy session. */
    func acceptSafeMode(_ document:DocumentWindow,_ done:@escaping()->Void){
        document.rendererExits=[]
        smokeReadyOverride={first in
            self.smokeReadyOverride={second in
                self.smokeReadyOverride={third in
                    self.page(third,"await wait(()=>document.querySelector('.safe-mode-banner'),'safe mode banner');return document.querySelector('.safe-mode-banner').textContent;"){value in
                        self.check((value as? String)?.contains("did not finish starting twice")==true,"two starts ended by a real renderer kill enter safe mode")
                        self.smokeReadyOverride={normal in
                            self.page(normal,"await wait(()=>document.querySelector('[data-canvas]'),'normal start');return !!document.querySelector('.safe-mode-banner');"){value in
                                self.check(value as? Bool==false && normal.state?.name=="Crash","Restart normally returns to the same file after safe mode")
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
    func mouse(_ document:DocumentWindow,_ type:NSEvent.EventType,_ x:CGFloat,_ y:CGFloat){
        let point=document.web.convert(NSPoint(x:x,y:y),to:nil)
        guard let event=NSEvent.mouseEvent(with:type,location:point,modifierFlags:[],timestamp:ProcessInfo.processInfo.systemUptime,windowNumber:document.window.windowNumber,context:nil,eventNumber:1,clickCount:1,pressure:1) else{smokeFail("mouse event")}
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
