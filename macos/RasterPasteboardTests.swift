import AppKit
import ImageIO

/** Standalone acceptance: compile with NodePasteboard.swift; never reads/writes .general. */
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
        let unsupported=NSPasteboardItem();unsupported.setString("file:///private/unsupported",forType:.fileURL);board.clearContents();board.writeObjects([unsupported]);check(try NodePasteboard.read(from:board)["kind"]=="empty","file URLs are never read as images")
        print(String(data:try JSONSerialization.data(withJSONObject:["nativeRasterPasteboard":true,"checks":checks,"count":checks.count],options:[.sortedKeys]),encoding:.utf8)!)
    }
}
