import AppKit
import ImageIO

/** Fixed representations only. Never accepts pasteboard names, arbitrary UTIs or file paths. */
enum NodePasteboard {
    static let nodes=NSPasteboard.PasteboardType("com.oanarinaldi.forma.nodes-json")
    static let svg=NSPasteboard.PasteboardType("public.svg-image")
    static let limit=20_000_000
    static let rasterPixelLimit=16_000_000
    /** Inspect dimensions before pixel decoding, then normalize the first oriented frame to PNG. */
    static func raster(_ data:Data,type:NSPasteboard.PasteboardType)throws->String {
        let failure=NSError(domain:"Clipboard image is invalid or exceeds 20 MB, 8192 pixels per side or 16 million pixels.",code:8)
        guard data.count<=limit,let source=CGImageSourceCreateWithData(data as CFData,[kCGImageSourceShouldCache:false] as CFDictionary),let actual=CGImageSourceGetType(source) as String?,actual==(type == .png ? "public.png":"public.tiff"),let properties=CGImageSourceCopyPropertiesAtIndex(source,0,nil) as? [CFString:Any],let width=properties[kCGImagePropertyPixelWidth] as? NSNumber,let height=properties[kCGImagePropertyPixelHeight] as? NSNumber else{throw failure}
        let w=width.doubleValue,h=height.doubleValue
        guard w.isFinite,h.isFinite,w>=1,h>=1,w<=8192,h<=8192,w*h<=Double(rasterPixelLimit),w.rounded()==w,h.rounded()==h else{throw failure}
        let options:[CFString:Any]=[kCGImageSourceCreateThumbnailFromImageAlways:true,kCGImageSourceCreateThumbnailWithTransform:true,kCGImageSourceThumbnailMaxPixelSize:max(w,h),kCGImageSourceShouldCacheImmediately:true]
        guard let image=CGImageSourceCreateThumbnailAtIndex(source,0,options as CFDictionary),image.width<=8192,image.height<=8192,image.width*image.height<=rasterPixelLimit else{throw failure}
        let output=NSMutableData()
        guard let destination=CGImageDestinationCreateWithData(output,"public.png" as CFString,1,nil) else{throw failure}
        CGImageDestinationAddImage(destination,image,nil)
        guard CGImageDestinationFinalize(destination),output.length<=14_999_000 else{throw NSError(domain:"Normalized clipboard image exceeds 20 MB. Resize it before copying.",code:9)}
        return "data:image/png;base64,"+(output as Data).base64EncodedString()
    }
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
        guard let item=pasteboard.pasteboardItems?.first,let type=item.availableType(from:[nodes,svg,.png,.tiff,.string]) else{return ["kind":"empty"]}
        if type == .png || type == .tiff {
            guard let data=item.data(forType:type) else{throw NSError(domain:"Unable to read clipboard image.",code:8)}
            return ["kind":"image","data":try raster(data,type:type)]
        }
        guard let data=item.data(forType:type),data.count<=limit,let raw=String(data:data,encoding:.utf8) else{throw NSError(domain:"Clipboard content is invalid or exceeds 20 MB.",code:7)}
        if type==nodes{try validateNodes(data)}
        return ["kind":type==nodes ? "nodes":type==svg ? "svg":"text","data":raw]
    }
}
