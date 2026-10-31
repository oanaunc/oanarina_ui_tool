import Foundation
import CoreGraphics
import CoreText
import ImageIO

/** Draws a page with Core Graphics, with no renderer process. This is a deliberate simplification of the editor's output:
 * solid, linear and radial paints, strokes, opacity, clipping, images, shapes, paths and plain text. Effects, masks, blend
 * modes, rich runs, conic paints and shaders are not drawn, and only embedded data images load, so nothing is fetched. */
enum OuiColor {
    static func parse(_ raw:String?,opacity:CGFloat=1)->CGColor? {
        guard var value=raw?.trimmingCharacters(in:.whitespaces).lowercased(),!value.isEmpty,value != "none",value != "transparent" else{return nil}
        func make(_ r:CGFloat,_ g:CGFloat,_ b:CGFloat,_ a:CGFloat)->CGColor {CGColor(srgbRed:r,green:g,blue:b,alpha:a*opacity)}
        if value.hasPrefix("#"){
            value.removeFirst();if value.count==3||value.count==4{value=value.map{"\($0)\($0)"}.joined()};guard [6,8].contains(value.count),let bits=UInt64(value,radix:16) else{return nil}
            let rgba=value.count==8 ? bits:(bits<<8)|0xff
            return make(CGFloat((rgba>>24)&255)/255,CGFloat((rgba>>16)&255)/255,CGFloat((rgba>>8)&255)/255,CGFloat(rgba&255)/255)
        }
        guard value.hasPrefix("rgb"),let open=value.firstIndex(of:"("),let close=value.lastIndex(of:")"),open<close else{return nil}
        let parts=value[value.index(after:open)..<close].split(whereSeparator:{",/ ".contains($0)}).compactMap{Double($0)};guard parts.count>=3 else{return nil}
        return make(CGFloat(parts[0])/255,CGFloat(parts[1])/255,CGFloat(parts[2])/255,parts.count>3 ? CGFloat(parts[3]):1)
    }
}
enum OuiPath {
    /** The SVG path subset the editor writes. Arcs and anything else stop parsing there; what came before still draws. */
    static func parse(_ text:String)->CGPath? {
        guard text.utf8.count<=2_000_000 else{return nil}
        var tokens:[Substring]=[];var index=text.startIndex
        while index<text.endIndex{
            let c=text[index]
            if c.isLetter && c != "e" && c != "E"{tokens.append(text[index...index]);index=text.index(after:index);continue}
            if c.isWhitespace||c==","{index=text.index(after:index);continue}
            var end=index;if c=="-"||c=="+"{end=text.index(after:end)};var dot=false
            while end<text.endIndex{let d=text[end];if d.isNumber{end=text.index(after:end)}else if d=="." && !dot{dot=true;end=text.index(after:end)}else if d=="e"||d=="E"{end=text.index(after:end);if end<text.endIndex,"+-".contains(text[end]){end=text.index(after:end)}}else{break}}
            if end==index{return nil};tokens.append(text[index..<end]);index=end
        }
        let path=CGMutablePath();var at=0,command:Character=" ",p=CGPoint.zero,start=CGPoint.zero
        func next()->CGFloat? {guard at<tokens.count,let value=Double(tokens[at]),value.isFinite,abs(value)<=1e7 else{return nil};at+=1;return CGFloat(value)}
        while at<tokens.count{
            if let c=tokens[at].first,c.isLetter{command=c;at+=1;if "Zz".contains(c){if !path.isEmpty{path.closeSubpath()};p=start;continue}}
            let relative=command.isLowercase,base=relative ? p:.zero
            switch command.uppercased(){
            case "M":guard let x=next(),let y=next() else{return path};p=CGPoint(x:x+base.x,y:y+base.y);start=p;path.move(to:p);command=relative ? "l":"L"
            case "L":guard let x=next(),let y=next(),!path.isEmpty else{return path};p=CGPoint(x:x+base.x,y:y+base.y);path.addLine(to:p)
            case "H":guard let x=next(),!path.isEmpty else{return path};p=CGPoint(x:x+base.x,y:p.y);path.addLine(to:p)
            case "V":guard let y=next(),!path.isEmpty else{return path};p=CGPoint(x:p.x,y:y+base.y);path.addLine(to:p)
            case "C":guard let a=next(),let b=next(),let c=next(),let d=next(),let x=next(),let y=next(),!path.isEmpty else{return path};let end=CGPoint(x:x+base.x,y:y+base.y);path.addCurve(to:end,control1:CGPoint(x:a+base.x,y:b+base.y),control2:CGPoint(x:c+base.x,y:d+base.y));p=end
            case "Q":guard let a=next(),let b=next(),let x=next(),let y=next(),!path.isEmpty else{return path};let end=CGPoint(x:x+base.x,y:y+base.y);path.addQuadCurve(to:end,control:CGPoint(x:a+base.x,y:b+base.y));p=end
            default:return path}
        }
        return path
    }
}
final class OuiRenderer {
    static let imageEdge=1600,imageBudget=48
    let context:CGContext;var images=0
    init(_ context:CGContext){self.context=context}
    /** Fits the scene into `target` (bottom-left origin) and paints it inside a flip to the design's top-left space. */
    func draw(_ scene:OuiScene,in target:CGRect,clearColor:CGColor?){
        context.saveGState();defer{context.restoreGState()}
        if let clearColor{context.setFillColor(clearColor);context.fill(target)}
        guard !scene.bounds.isNull,scene.bounds.width>0,scene.bounds.height>0 else{return}
        let fit=min(target.width/scene.bounds.width,target.height/scene.bounds.height),width=scene.bounds.width*fit,height=scene.bounds.height*fit
        context.clip(to:target);context.translateBy(x:target.minX+(target.width-width)/2,y:target.minY+(target.height-height)/2+height);context.scaleBy(x:fit,y:-fit);context.translateBy(x:-scene.bounds.minX,y:-scene.bounds.minY)
        context.clip(to:scene.bounds)
        if let background=OuiColor.parse(scene.background){context.setFillColor(background);context.fill(scene.bounds)}
        for node in scene.roots{draw(node,parent:nil,depth:0)}
    }
    func draw(_ node:OuiNode,parent:OuiNode?,depth:Int){
        guard node.visible,depth<128 else{return}
        context.saveGState();defer{context.restoreGState()}
        context.concatenate(node.matrix(parent:parent))
        let opacity=OuiNode.number(node.raw["opacity"]).map{max(0,min(1,$0))} ?? 1
        guard opacity>0 else{return}
        if opacity<1{context.setAlpha(opacity);context.beginTransparencyLayer(auxiliaryInfo:nil)};defer{if opacity<1{context.endTransparencyLayer()}}
        if node.type=="text"{text(node)}else if node.type != "group" && node.type != "slice"{paint(node)}
        if node.raw["clip"] as? Bool==true,node.type != "group"{context.addPath(outline(node) ?? CGPath(rect:node.bounds,transform:nil));context.clip()}
        for child in node.children{draw(child,parent:node,depth:depth+1)}
    }
    func outline(_ node:OuiNode)->CGPath? {
        let w=node.width,h=node.height,box=node.bounds
        switch node.type{
        case "ellipse":return CGPath(ellipseIn:box,transform:nil)
        case "polygon","star":
            let star=node.type=="star",count=max(3,min(100,Int(OuiNode.number(node.raw["pointCount"]) ?? (star ? 5:6))))*(star ? 2:1),inner=max(0.01,min(0.99,OuiNode.number(node.raw["innerRadius"]) ?? 0.43)),path=CGMutablePath()
            for i in 0..<count{let a=CGFloat(i) * .pi*2/CGFloat(count) - .pi/2,r=star&&i%2==1 ? inner:1,p=CGPoint(x:w/2+cos(a)*w/2*r,y:h/2+sin(a)*h/2*r);if i==0{path.move(to:p)}else{path.addLine(to:p)}};path.closeSubpath();return path
        case "line","arrow":let path=CGMutablePath();path.move(to:.zero);path.addLine(to:CGPoint(x:w,y:h));return path
        case "path":
            guard let raw=node.raw["path"] as? String,!raw.isEmpty,let path=OuiPath.parse(raw) else{return nil}
            let sourceW=OuiNode.number(node.raw["pathWidth"]) ?? 0,sourceH=OuiNode.number(node.raw["pathHeight"]) ?? 0
            var scale=CGAffineTransform(scaleX:sourceW>0 ? w/sourceW:1,y:sourceH>0 ? h/sourceH:1);return path.copy(using:&scale)
        default:
            if let corners=node.raw["corners"] as? [NSNumber],corners.count==4,corners.contains(where:{$0.doubleValue>0}){
                let limit=min(w,h)/2,r=corners.map{max(0,min(limit,CGFloat(truncating:$0)))},path=CGMutablePath()
                path.move(to:CGPoint(x:r[0],y:0));path.addLine(to:CGPoint(x:w-r[1],y:0));path.addArc(tangent1End:CGPoint(x:w,y:0),tangent2End:CGPoint(x:w,y:r[1]),radius:r[1]);path.addLine(to:CGPoint(x:w,y:h-r[2]));path.addArc(tangent1End:CGPoint(x:w,y:h),tangent2End:CGPoint(x:w-r[2],y:h),radius:r[2]);path.addLine(to:CGPoint(x:r[3],y:h));path.addArc(tangent1End:CGPoint(x:0,y:h),tangent2End:CGPoint(x:0,y:h-r[3]),radius:r[3]);path.addLine(to:CGPoint(x:0,y:r[0]));path.addArc(tangent1End:.zero,tangent2End:CGPoint(x:r[0],y:0),radius:r[0]);path.closeSubpath();return path
            }
            let radius=max(0,min(min(w,h)/2,OuiNode.number(node.raw["radius"]) ?? 0))
            return radius>0 ? CGPath(roundedRect:box,cornerWidth:radius,cornerHeight:radius,transform:nil):CGPath(rect:box,transform:nil)
        }
    }
    func paint(_ node:OuiNode){
        guard let shape=outline(node) else{return}
        let open=["line","arrow"].contains(node.type),evenOdd=node.raw["fillRule"] as? String=="evenodd",paints=node.raw["paints"] as? [[String:Any]]
        if !open{
            if let paints,!paints.isEmpty{for paint in paints where paint["visible"] as? Bool != false{fill(paint,node,shape,evenOdd)}}
            else if let color=OuiColor.parse(node.raw["fill"] as? String){context.addPath(shape);context.setFillColor(color);context.fillPath(using:evenOdd ? .evenOdd:.winding)}
            if let image=node.raw["image"] as? String,!image.isEmpty{fillImage(image,node,shape)}
        }
        if let strokes=node.raw["strokes"] as? [[String:Any]],!strokes.isEmpty{
            for stroke in strokes where stroke["visible"] as? Bool != false{guard let paint=stroke["paint"] as? [String:Any],let color=OuiColor.parse(paint["color"] as? String,opacity:OuiNode.number(paint["opacity"]) ?? 1),let width=OuiNode.number(stroke["width"]),width>0 else{continue};context.addPath(shape);context.setStrokeColor(color);context.setLineWidth(width);context.strokePath()}
        }else if let color=OuiColor.parse(node.raw["stroke"] as? String),let width=OuiNode.number(node.raw["strokeWidth"]),width>0{context.addPath(shape);context.setStrokeColor(color);context.setLineWidth(width);context.strokePath()}
    }
    func fill(_ paint:[String:Any],_ node:OuiNode,_ shape:CGPath,_ evenOdd:Bool){
        let opacity=OuiNode.number(paint["opacity"]) ?? 1,kind=paint["type"] as? String ?? "solid"
        switch kind{
        case "image":if let image=paint["image"] as? String{context.saveGState();context.setAlpha(opacity);fillImage(image,node,shape);context.restoreGState()}
        case "linear","radial":
            let stops=((paint["stops"] as? [[String:Any]]) ?? []).prefix(64).compactMap{stop->(CGFloat,CGColor)? in guard let at=OuiNode.number(stop["position"]),let color=OuiColor.parse(stop["color"] as? String,opacity:(OuiNode.number(stop["opacity"]) ?? 1)*opacity) else{return nil};return(max(0,min(1,at)),color)}.sorted{$0.0<$1.0}
            guard stops.count>=2,let gradient=CGGradient(colorsSpace:CGColorSpace(name:CGColorSpace.sRGB),colors:stops.map{$0.1} as CFArray,locations:stops.map{$0.0}) else{return}
            context.saveGState();context.addPath(shape);if evenOdd{context.clip(using:.evenOdd)}else{context.clip()}
            if kind=="radial"{let c=CGPoint(x:node.width*(OuiNode.number(paint["cx"]) ?? 0.5),y:node.height*(OuiNode.number(paint["cy"]) ?? 0.5));context.drawRadialGradient(gradient,startCenter:c,startRadius:0,endCenter:c,endRadius:max(node.width,node.height)*(OuiNode.number(paint["radius"]) ?? 0.5),options:[.drawsBeforeStartLocation,.drawsAfterEndLocation])}
            else{let angle=(OuiNode.number(paint["angle"]) ?? 0) * .pi/180,dx=cos(angle)*node.width/2,dy=sin(angle)*node.height/2,c=CGPoint(x:node.width/2,y:node.height/2);context.drawLinearGradient(gradient,start:CGPoint(x:c.x-dx,y:c.y-dy),end:CGPoint(x:c.x+dx,y:c.y+dy),options:[.drawsBeforeStartLocation,.drawsAfterEndLocation])}
            context.restoreGState()
        default:
            let color=OuiColor.parse(paint["color"] as? String,opacity:opacity) ?? ((paint["stops"] as? [[String:Any]])?.first.flatMap{OuiColor.parse($0["color"] as? String,opacity:opacity)})
            guard kind != "shader",let color else{return};context.addPath(shape);context.setFillColor(color);context.fillPath(using:evenOdd ? .evenOdd:.winding)
        }
    }
    /** Only inline raster data: a remote or file reference in a hand-made project is never followed. */
    func fillImage(_ value:String,_ node:OuiNode,_ shape:CGPath){
        guard images<Self.imageBudget,value.hasPrefix("data:image/"),!value.hasPrefix("data:image/svg"),let comma=value.firstIndex(of:","),value[..<comma].hasSuffix(";base64"),let data=Data(base64Encoded:String(value[value.index(after:comma)...])) else{return}
        images+=1
        guard let source=CGImageSourceCreateWithData(data as CFData,[kCGImageSourceShouldCache:false] as CFDictionary),let image=CGImageSourceCreateThumbnailAtIndex(source,0,[kCGImageSourceCreateThumbnailFromImageAlways:true,kCGImageSourceCreateThumbnailWithTransform:true,kCGImageSourceThumbnailMaxPixelSize:Self.imageEdge,kCGImageSourceShouldCacheImmediately:true] as CFDictionary) else{return}
        let scale=max(node.width/CGFloat(image.width),node.height/CGFloat(image.height)),w=CGFloat(image.width)*scale,h=CGFloat(image.height)*scale
        context.saveGState();context.addPath(shape);context.clip();context.translateBy(x:(node.width-w)/2,y:(node.height+h)/2);context.scaleBy(x:1,y:-1);context.draw(image,in:CGRect(x:0,y:0,width:w,height:h));context.restoreGState()
    }
    func text(_ node:OuiNode){
        guard let value=node.raw["text"] as? String,!value.isEmpty else{return}
        let size=max(1,min(2048,OuiNode.number(node.raw["fontSize"]) ?? 16)),family=node.raw["fontFamily"] as? String ?? "",weight=OuiNode.number(node.raw["fontWeight"]) ?? 400
        let traits:[CFString:Any]=[kCTFontWeightTrait:(weight-400)/500*0.6,kCTFontSymbolicTrait:node.raw["fontStyle"] as? String=="italic" ? CTFontSymbolicTraits.traitItalic.rawValue:0]
        let font=CTFontCreateWithFontDescriptor(CTFontDescriptorCreateWithAttributes([kCTFontFamilyNameAttribute:family.isEmpty ? "Helvetica":family,kCTFontTraitsAttribute:traits] as CFDictionary),size,nil)
        let color=(node.raw["paints"] as? [[String:Any]])?.first(where:{$0["visible"] as? Bool != false}).flatMap{OuiColor.parse($0["color"] as? String,opacity:OuiNode.number($0["opacity"]) ?? 1)} ?? OuiColor.parse(node.raw["fill"] as? String) ?? CGColor(gray:0,alpha:1)
        var alignment:CTTextAlignment=["center":.center,"right":.right,"justify":.justified][node.raw["textAlign"] as? String ?? ""] ?? .left
        var leading=size*(OuiNode.number(node.raw["lineHeight"]) ?? 1.2);if let fixed=OuiNode.number(node.raw["lineHeightPx"]),fixed>0{leading=fixed}
        let style=withUnsafePointer(to:&alignment){a in withUnsafePointer(to:&leading){h in [CTParagraphStyleSetting(spec:.alignment,valueSize:MemoryLayout<CTTextAlignment>.size,value:a),CTParagraphStyleSetting(spec:.minimumLineHeight,valueSize:MemoryLayout<CGFloat>.size,value:h),CTParagraphStyleSetting(spec:.maximumLineHeight,valueSize:MemoryLayout<CGFloat>.size,value:h)].withUnsafeBufferPointer{CTParagraphStyleCreate($0.baseAddress!,$0.count)}}}
        let attributes:[CFString:Any]=[kCTFontAttributeName:font,kCTForegroundColorAttributeName:color,kCTParagraphStyleAttributeName:style,kCTKernAttributeName:OuiNode.number(node.raw["letterSpacing"]) ?? 0]
        guard let string=CFAttributedStringCreate(nil,OuiProject.clean(value,20_000) as CFString,attributes as CFDictionary) else{return}
        let setter=CTFramesetterCreateWithAttributedString(string),width=node.raw["textResize"] as? String=="auto-width" ? CGFloat(1_000_000):max(1,node.width),limit=CGSize(width:width,height:CGFloat.greatestFiniteMagnitude)
        let needed=CTFramesetterSuggestFrameSizeWithConstraints(setter,CFRange(location:0,length:0),nil,limit,nil).height+1,box=max(needed,node.height),align=node.raw["verticalAlign"] as? String,offset=align=="middle" ? (node.height-needed)/2:align=="bottom" ? node.height-needed:0
        let frame=CTFramesetterCreateFrame(setter,CFRange(location:0,length:0),CGPath(rect:CGRect(x:0,y:0,width:width,height:box),transform:nil),nil)
        // A y-up box is pinned to the layer's top so Core Text keeps glyphs upright inside the flipped page.
        context.saveGState();context.textMatrix = .identity;context.translateBy(x:0,y:box+max(0,offset));context.scaleBy(x:1,y:-1);CTFrameDraw(frame,context);context.restoreGState()
    }
}

/** PDF and bitmap entry points shared by the preview and thumbnail extensions. */
enum OuiPreview {
    static let pageLimit=32,edge:CGFloat=1600
    static func scenes(_ project:OuiProject)->(scenes:[(OuiPage,OuiScene)],omitted:Int) {
        var budget=OuiScene.layerBudget;let shown=project.pages.prefix(pageLimit).map{page in(page,OuiScene(page,budget:&budget))}
        return(shown,project.pages.count-shown.count)
    }
    /** The chosen file cover when it still resolves, otherwise the first page with visible artwork. */
    static func cover(_ project:OuiProject)->OuiScene? {
        var budget=OuiScene.layerBudget
        if let id=project.coverPage,let page=project.pages.first(where:{$0.id==id}){return OuiScene(page,focus:project.coverFrame,budget:&budget)}
        for page in project.pages{var attempt=budget;let scene=OuiScene(page,budget:&attempt);if !scene.bounds.isNull{return scene}};return nil
    }
    /** One PDF page per document page, sized to its artwork. The only document info written is the project's own title. */
    static func pdf(_ project:OuiProject)->Data {
        let output=NSMutableData();var box=CGRect(x:0,y:0,width:960,height:600);let title=project.name.isEmpty ? "Forma project":project.name
        guard let consumer=CGDataConsumer(data:output as CFMutableData),let context=CGContext(consumer:consumer,mediaBox:&box,[kCGPDFContextTitle:title,kCGPDFContextCreator:"Forma"] as CFDictionary) else{return Data()}
        let renderer=OuiRenderer(context),(scenes,omitted)=Self.scenes(project)
        func page(_ media:CGRect,_ draw:(CGRect)->Void){var rect=media;let info=[kCGPDFContextMediaBox:NSData(bytes:&rect,length:MemoryLayout<CGRect>.size)] as CFDictionary;context.beginPDFPage(info);draw(media);context.endPDFPage()}
        for (index,entry) in scenes.enumerated(){
            let scene=entry.1,empty=scene.bounds.isNull,bounds=empty ? box:scene.bounds,fit=min(edge/max(bounds.width,bounds.height,1),2),media=CGRect(x:0,y:0,width:max(160,bounds.width*fit),height:max(120,bounds.height*fit))
            page(media){target in renderer.draw(scene,in:target,clearColor:CGColor(gray:0.95,alpha:1));if empty{label(context,"\(entry.0.name.isEmpty ? "Page \(index+1)":entry.0.name) is empty")};if index==scenes.count-1,omitted>0{label(context,"\(omitted) more pages open in Forma")}}
        }
        if scenes.isEmpty{page(box){_ in label(context,"This project has no pages")}}
        context.closePDF();return output as Data
    }
    static func label(_ context:CGContext,_ text:String){
        guard let ui=CTFontCreateUIFontForLanguage(.system,13,nil),let string=CFAttributedStringCreate(nil,text as CFString,[kCTFontAttributeName:ui,kCTForegroundColorAttributeName:CGColor(gray:0.3,alpha:1)] as CFDictionary) else{return}
        context.saveGState();context.textMatrix = .identity;context.textPosition=CGPoint(x:16,y:14);CTLineDraw(CTLineCreateWithAttributedString(string),context);context.restoreGState()
    }
}
