import Foundation
import CoreGraphics

/** Bounded read-only view of a .oui project for the system extensions. It keeps the app's 50 MB ceiling and format
 * check, follows no references, reaches no network and never holds a file path: only the file's own content. */
enum OuiError:Error {case invalid}
struct OuiPage {let id:String;let name:String;let nodes:[[String:Any]];let background:String?}
struct OuiProject {
    static let textLimit=256_000,nameLimit=512,listLimit=1024,pageLimit=512
    let name:String;let description:String;let workspace:String;let updated:Date?;let pages:[OuiPage];let coverPage:String?;let coverFrame:String?
    /** Same acceptance as Studio.project: unknown formats and versions show nothing rather than a guess. */
    init(data:Data)throws {
        guard data.count<50_000_000,let doc=try JSONSerialization.jsonObject(with:data) as? [String:Any],doc["format"] as? String=="oanarina-ui",[1,2].contains(doc["version"] as? Int ?? 0),let id=doc["id"] as? String,!id.isEmpty,id.utf8.count<=512,let rawPages=doc["pages"] as? [[String:Any]] else{throw OuiError.invalid}
        name=Self.clean(doc["name"] as? String ?? "",Self.nameLimit);description=Self.clean(doc["description"] as? String ?? "",4096);workspace=doc["workspace"] as? String ?? "design"
        updated=(doc["updatedAt"] as? String).flatMap{ISO8601DateFormatter.fractional.date(from:$0) ?? ISO8601DateFormatter().date(from:$0)}
        pages=rawPages.prefix(Self.pageLimit).map{page in var background:String?;if let value=page["background"] as? [String:Any],value["visible"] as? Bool != false{background=value["color"] as? String};return OuiPage(id:page["id"] as? String ?? "",name:Self.clean(page["name"] as? String ?? "",Self.nameLimit),nodes:page["nodes"] as? [[String:Any]] ?? [],background:background)}
        let cover=doc["fileCover"] as? [String:Any];coverPage=cover?["pageId"] as? String;coverFrame=cover?["frameId"] as? String
    }
    static func clean(_ value:String,_ limit:Int)->String {
        var out="",count=0
        for scalar in value.unicodeScalars{
            if count>=limit{break}
            let code=scalar.value,layout=code==9||code==10||code==13
            if code<32 && !layout{continue};if code>=0x7f && code<0xa0{continue}
            out.unicodeScalars.append(scalar);count+=1
        }
        return out
    }
    var summary:OuiSummary {OuiSummary(self)}
}
extension ISO8601DateFormatter {static let fractional:ISO8601DateFormatter={let f=ISO8601DateFormatter();f.formatOptions=[.withInternetDateTime,.withFractionalSeconds];return f}()}

/** What Spotlight may index: the title, page and layer names, fonts and authored text, each with a hard limit. */
struct OuiSummary {
    let title:String;let details:String;let pages:[String];let layers:[String];let fonts:[String];let text:String;let layerCount:Int
    init(_ project:OuiProject){
        title=project.name;details=project.description;pages=project.pages.prefix(OuiProject.listLimit).map{$0.name}.filter{!$0.isEmpty}
        var seenLayers=Set<String>(),seenFonts=Set<String>(),layerNames:[String]=[],fontNames:[String]=[],body="",bytes=0,count=0
        for page in project.pages{count+=page.nodes.count;for node in page.nodes{
            if let name=node["name"] as? String,!name.isEmpty,layerNames.count<OuiProject.listLimit{let safe=OuiProject.clean(name,OuiProject.nameLimit);if seenLayers.insert(safe).inserted{layerNames.append(safe)}}
            guard node["type"] as? String=="text" else{continue}
            if let family=node["fontFamily"] as? String,!family.isEmpty,fontNames.count<64{let safe=OuiProject.clean(family,128);if seenFonts.insert(safe).inserted{fontNames.append(safe)}}
            if bytes<OuiProject.textLimit,let text=node["text"] as? String,!text.isEmpty{let safe=OuiProject.clean(text,OuiProject.textLimit-bytes);bytes+=safe.utf8.count+1;body+=safe+"\n"}
        }}
        layers=layerNames;fonts=fontNames;text=body;layerCount=count
    }
}

/** One drawable layer. Geometry is checked on the way in, so the renderer can trust every number it reads. */
final class OuiNode {
    let raw:[String:Any];let type:String;let x:CGFloat;let y:CGFloat;let width:CGFloat;let height:CGFloat;let rotation:CGFloat;var children:[OuiNode]=[]
    init?(_ raw:[String:Any]){
        guard let type=raw["type"] as? String,let x=Self.number(raw["x"]),let y=Self.number(raw["y"]),let width=Self.number(raw["width"]),let height=Self.number(raw["height"]),width>=0,height>=0 else{return nil}
        self.raw=raw;self.type=type;self.x=x;self.y=y;self.width=width;self.height=height;self.rotation=Self.number(raw["rotation"]) ?? 0
    }
    static func number(_ value:Any?)->CGFloat? {guard let value=value as? NSNumber else{return nil};let number=value.doubleValue;guard number.isFinite,abs(number)<=10_000_000 else{return nil};return CGFloat(number)}
    var visible:Bool {raw["visible"] as? Bool != false}
    /** Mirrors nodeMatrix in src/transforms.ts: a child's x and y are world values, offset by the parent's. */
    func matrix(parent:OuiNode?)->CGAffineTransform {
        let angle=rotation * .pi/180,c=cos(angle),s=sin(angle),sx:CGFloat=raw["flipX"] as? Bool==true ? -1:1,sy:CGFloat=raw["flipY"] as? Bool==true ? -1:1,cx=width/2,cy=height/2
        return CGAffineTransform(a:c*sx,b:s*sx,c:-s*sy,d:c*sy,tx:x-(parent?.x ?? 0)+cx-c*sx*cx+s*sy*cy,ty:y-(parent?.y ?? 0)+cy-s*sx*cx-c*sy*cy)
    }
    var bounds:CGRect {CGRect(x:0,y:0,width:width,height:height)}
}
struct OuiScene {
    static let layerBudget=20_000
    let roots:[OuiNode];let background:String?;let bounds:CGRect;let skipped:Int
    /** Walks only from true roots, so a parent cycle in a hand-edited file is unreachable rather than an endless loop. */
    init(_ page:OuiPage,focus:String?=nil,budget:inout Int){
        var byId:[String:OuiNode]=[:],kids:[String:[OuiNode]]=[:],top:[OuiNode]=[],skip=0
        for raw in page.nodes.prefix(budget){
            guard let node=OuiNode(raw) else{skip+=1;continue}
            if let id=raw["id"] as? String{byId[id]=node}
            if let parent=raw["parentId"] as? String{kids[parent,default:[]].append(node)}else{top.append(node)}
        }
        if page.nodes.count>budget{skip+=page.nodes.count-budget};budget=max(0,budget-page.nodes.count)
        var placed=Set<ObjectIdentifier>()
        func link(_ node:OuiNode,_ depth:Int){guard depth<128,let id=node.raw["id"] as? String,let children=kids[id] else{return};node.children=children.filter{placed.insert(ObjectIdentifier($0)).inserted};for child in node.children{link(child,depth+1)}}
        for node in top{link(node,0)}
        let shown=top.filter{$0.visible}
        var box=CGRect.null
        for node in shown{box=box.union(node.bounds.applying(node.matrix(parent:nil)))}
        if let focus,let frame=byId[focus],frame.width>0,frame.height>0{box=CGRect(x:frame.x,y:frame.y,width:frame.width,height:frame.height)}
        roots=shown;background=page.background;bounds=box;skipped=skip
    }
}
