import AppKit
import ImageIO

/** Standalone acceptance: compile with NodePasteboard.swift and ProjectFileSafety.swift; never reads/writes .general. */
@main struct RasterPasteboardTests {
    static var checks:[String]=[]
    static func check(_ value:Bool,_ name:String){guard value else{fputs("FAIL: \(name)\n",stderr);exit(1)};checks.append(name)}
    static func encoded(_ width:Int,_ height:Int,_ type:String="public.png",orientation:Int=1)->Data {
        let context=CGContext(data:nil,width:width,height:height,bitsPerComponent:8,bytesPerRow:width*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
        context.setFillColor(CGColor(red:0.8,green:0.2,blue:0.4,alpha:0.5));context.fill(CGRect(x:0,y:0,width:width,height:height))
        let output=NSMutableData(),destination=CGImageDestinationCreateWithData(output,type as CFString,1,nil)!
        CGImageDestinationAddImage(destination,context.makeImage()!,[kCGImagePropertyOrientation:orientation] as CFDictionary);guard CGImageDestinationFinalize(destination) else{exit(1)};return output as Data
    }
    static func rejected(_ data:Data,_ type:NSPasteboard.PasteboardType)->Bool{do{_ = try NodePasteboard.raster(data,type:type);return false}catch{return true}}
    static func main()throws {
        let board=NSPasteboard.withUniqueName();defer{board.releaseGlobally()}
        let png=encoded(3,2),tiff=encoded(3,2,"public.tiff",orientation:6)
        func put(_ type:NSPasteboard.PasteboardType,_ data:Data,text:String?=nil){let item=NSPasteboardItem();item.setData(data,forType:type);if let text=text{item.setString(text,forType:.string)};board.clearContents();check(board.writeObjects([item]),"write private \(type.rawValue) fixture")}
        put(.png,png,text:"Must remain an image")
        let result=try NodePasteboard.read(from:board)
        check(result["kind"]=="image","PNG preferred over plain text")
        let normalized=Data(base64Encoded:result["data"]!.replacingOccurrences(of:"data:image/png;base64,",with:""))!,source=CGImageSourceCreateWithData(normalized as CFData,nil)!,image=CGImageSourceCreateImageAtIndex(source,0,nil)!
        check(image.width==3 && image.height==2,"normalized PNG preserves pixel dimensions")
        check(image.alphaInfo != .none && image.alphaInfo != .noneSkipFirst && image.alphaInfo != .noneSkipLast,"normalized PNG retains alpha channel")
        put(.tiff,tiff)
        let oriented=try NodePasteboard.read(from:board),orientedBytes=Data(base64Encoded:oriented["data"]!.replacingOccurrences(of:"data:image/png;base64,",with:""))!,orientedImage=CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithData(orientedBytes as CFData,nil)!,0,nil)!
        check(oriented["kind"]=="image" && orientedImage.width==2 && orientedImage.height==3,"TIFF first frame is normalized with orientation")
        check(rejected(png,.tiff),"representation type must match encoded data")
        check(rejected(Data("not a picture".utf8),.png),"invalid image rejected")
        check(rejected(Data(repeating:0,count:NodePasteboard.limit+1),.png),"encoded image above20MB rejected")
        check(rejected(encoded(8193,1),.png),"oversize dimensions rejected before pixel decoding")
        check(rejected(encoded(4001,4000),.png),"16million pixel budget enforced")
        put(.png,Data("bad PNG".utf8),text:"No fallback")
        do{_ = try NodePasteboard.read(from:board);check(false,"malformed raster fails closed")}catch{check(true,"malformed raster does not fall back to text")}
        let preferred=NSPasteboardItem();preferred.setData(png,forType:.png);preferred.setString("<svg/>",forType:NodePasteboard.svg);board.clearContents();board.writeObjects([preferred]);check(try NodePasteboard.read(from:board)["kind"]=="svg","editable SVG precedes raster")
        let unsupported=NSPasteboardItem();unsupported.setString("file:///private/unsupported",forType:.fileURL);board.clearContents();board.writeObjects([unsupported]);check(try NodePasteboard.read(from:board)["kind"]=="empty","a copied file that cannot be read yields nothing")
        let folder=FileManager.default.temporaryDirectory.appendingPathComponent("forma-raster-"+UUID().uuidString,isDirectory:true);try FileManager.default.createDirectory(at:folder,withIntermediateDirectories:true);defer{try? FileManager.default.removeItem(at:folder)}
        func copied(_ name:String,_ data:Data)throws->[String:String]{let url=folder.appendingPathComponent(name);try data.write(to:url);let item=NSPasteboardItem();item.setString(url.absoluteString,forType:.fileURL);item.setData(tiff,forType:.tiff);item.setString(name,forType:.string);board.clearContents();board.writeObjects([item]);return try NodePasteboard.read(from:board)}
        let photo=try copied("Photo.jpg",encoded(5,4,"public.jpeg")),bytes=Data(base64Encoded:photo["data"]!.replacingOccurrences(of:"data:image/png;base64,",with:""))!,pixels=CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithData(bytes as CFData,nil)!,0,nil)!
        check(photo["kind"]=="image" && pixels.width==5 && pixels.height==4,"a copied image file wins over Finder's icon and name")
        check(try copied("Notes.txt",Data("words".utf8))["kind"]=="empty","a copied non-image file offers neither icon nor name")
        check(try copied("Drawing.svg",Data("<svg/>".utf8))==["kind":"svg","data":"<svg/>"],"a copied SVG file reads as SVG markup")
        let link=folder.appendingPathComponent("Link.png");try FileManager.default.createSymbolicLink(at:link,withDestinationURL:folder.appendingPathComponent("Photo.jpg"));let linked=NSPasteboardItem();linked.setString(link.absoluteString,forType:.fileURL);board.clearContents();board.writeObjects([linked]);check(try NodePasteboard.read(from:board)["kind"]=="empty","a copied symbolic link is not followed")
        let moving=NSPasteboardItem();moving.setData(encoded(3,2,"com.compuserve.gif"),forType:NodePasteboard.gif);board.clearContents();board.writeObjects([moving]);check(try NodePasteboard.read(from:board)["kind"]=="image","a GIF on the pasteboard normalizes to PNG")
        if CGImageDestinationCopyTypeIdentifiers() as? [String] != nil,(CGImageDestinationCopyTypeIdentifiers() as! [String]).contains("public.heic"){let photoItem=NSPasteboardItem();photoItem.setData(encoded(3,2,"public.heic"),forType:NodePasteboard.heic);board.clearContents();board.writeObjects([photoItem]);check(try NodePasteboard.read(from:board)["kind"]=="image","a HEIC on the pasteboard normalizes to PNG")}
        let rich=NSPasteboardItem();rich.setData(try NSAttributedString(string:"Styled").data(from:NSRange(location:0,length:6),documentAttributes:[.documentType:NSAttributedString.DocumentType.rtf]),forType:.rtf);board.clearContents();board.writeObjects([rich]);check(try NodePasteboard.read(from:board)==["kind":"text","data":"Styled"],"rich text without plain text reads as its words")
        print(String(data:try JSONSerialization.data(withJSONObject:["nativeRasterPasteboard":true,"checks":checks,"count":checks.count],options:[.sortedKeys]),encoding:.utf8)!)
    }
}
