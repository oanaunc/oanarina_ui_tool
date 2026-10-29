import AppKit

/** Fixed representations only. Never accepts pasteboard names, arbitrary UTIs or file paths. */
enum NodePasteboard {
    static let nodes=NSPasteboard.PasteboardType("com.oanarinaldi.forma.nodes-json")
    static let svg=NSPasteboard.PasteboardType("public.svg-image")
    static let limit=20_000_000
    static func validateNodes(_ bytes:Data)throws {
        guard bytes.count<=limit,let value=try JSONSerialization.jsonObject(with:bytes) as? [String:Any],value["format"] as? String=="forma-clipboard",value["version"] as? Int==1,let project=value["project"] as? [String:Any],project["format"] as? String=="oanarina-ui",let pages=project["pages"] as? [[String:Any]],!pages.isEmpty,pages.count<=1000,let roots=value["roots"] as? [String],!roots.isEmpty else{throw NSError(domain:"Invalid Forma clipboard data.",code:1)}
        var count=0;for page in pages{guard let layers=page["nodes"] as? [[String:Any]] else{throw NSError(domain:"Invalid clipboard layers.",code:2)};count+=layers.count;guard count<=20000 else{throw NSError(domain:"Clipboard exceeds 20,000 layers.",code:3)}}
    }
    static func write(_ representations:[String:Any],to pasteboard:NSPasteboard = .general)throws->Bool {
        guard Set(representations.keys)==Set(["nodes","svg","text"]),let raw=representations["nodes"] as? String,let drawing=representations["svg"] as? String,let text=representations["text"] as? String else{throw NSError(domain:"Unsupported clipboard representations.",code:4)}
        guard raw.utf8.count+drawing.utf8.count+text.utf8.count<=limit else{throw NSError(domain:"Copy fewer layers: clipboard representations exceed 20 MB.",code:5)}
        let data=Data(raw.utf8),svgData=Data(drawing.utf8),textData=Data(text.utf8)
        guard data.count+svgData.count+textData.count<=limit else{throw NSError(domain:"Copy fewer layers: clipboard representations exceed 20 MB.",code:5)}
        try validateNodes(data)
        let item=NSPasteboardItem();guard item.setData(data,forType:nodes),item.setData(svgData,forType:svg),item.setData(textData,forType:.string) else{throw NSError(domain:"Unable to prepare clipboard data.",code:6)}
        pasteboard.clearContents();return pasteboard.writeObjects([item])
    }
    static func read(from pasteboard:NSPasteboard = .general)throws->[String:String] {
        guard let item=pasteboard.pasteboardItems?.first,let type=item.availableType(from:[nodes,svg,.string]) else{return ["kind":"empty"]}
        guard let data=item.data(forType:type),data.count<=limit,let raw=String(data:data,encoding:.utf8) else{throw NSError(domain:"Clipboard content is invalid or exceeds 20 MB.",code:7)}
        if type==nodes{try validateNodes(data)}
        return ["kind":type==nodes ? "nodes":type==svg ? "svg":"text","data":raw]
    }
}
