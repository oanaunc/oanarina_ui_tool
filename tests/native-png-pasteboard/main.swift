import AppKit
import ImageIO

// Standalone boundary check: one private pasteboard, no app window or HTTP server.
let board=NSPasteboard.withUniqueName(),generalCount=NSPasteboard.general.changeCount
var checks:[String]=[]
func check(_ condition:Bool,_ label:String){guard condition else{fputs("PNG pasteboard check failed: \(label)\n",stderr);exit(1)};checks.append(label)}
func fixture(_ width:Int,_ height:Int,_ type:String="public.png")->Data {
 let context=CGContext(data:nil,width:width,height:height,bitsPerComponent:8,bytesPerRow:width*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
 context.setFillColor(CGColor(red:1,green:0,blue:0,alpha:0.5));context.fill(CGRect(x:0,y:0,width:width,height:height))
 let output=NSMutableData(),destination=CGImageDestinationCreateWithData(output,type as CFString,1,nil)!
 CGImageDestinationAddImage(destination,context.makeImage()!,nil);check(CGImageDestinationFinalize(destination),"fixture encode \(width)x\(height)");return output as Data
}
func url(_ data:Data)->String{"data:image/png;base64,"+data.base64EncodedString()}
do{
 var order=ClipboardCommandOrder()
 let pendingPng=order.advance(),textCopy=order.advance()
 check(!order.isCurrent(pendingPng)&&order.isCurrent(textCopy),"new native text-copy intent invalidates an older pending PNG route")
 let rendererCopy=order.advance()
 check(!order.isCurrent(textCopy)&&order.isCurrent(rendererCopy),"renderer authorization invalidates an older native focus-query completion")
 var routed:[String]=[]
 for (token,name) in [(rendererCopy,"newest"),(textCopy,"older"),(pendingPng,"oldest")] {if order.isCurrent(token){routed.append(name)}}
 check(routed == ["newest"],"reversed asynchronous focus completions route only the latest clipboard command")
 let sentinel=NSPasteboardItem();sentinel.setString("private sentinel",forType:.string);board.clearContents();board.writeObjects([sentinel])
 let data=fixture(4,6),written=try NodePasteboard.write(["png":url(data)],to:board)
 check(written,"fixed PNG write succeeds")
 guard let item=board.pasteboardItems?.first,let png=item.data(forType:.png),let source=CGImageSourceCreateWithData(png as CFData,nil),let image=CGImageSourceCreateImageAtIndex(source,0,nil) else{check(false,"actual PNG decodes");exit(1)}
 check(item.types == [.png],"only public.png is published, without stale editable/SVG/text types")
 check(image.width==4&&image.height==6,"written PNG keeps exact pixel dimensions")
 let bitmap=NSBitmapImageRep(cgImage:image),color=bitmap.colorAt(x:2,y:3)!.usingColorSpace(.deviceRGB)!
 check(abs(color.alphaComponent-0.5)<0.02&&color.redComponent>0.98,"written PNG preserves alpha and color")
 let validCount=board.changeCount,validData=png
 let invalid:[[String:Any]]=[
  ["png":"data:image/png;base64,AAAA"],
  ["png":"data:image/png;base64,"+String(repeating:"A",count:20_000_000)],
  ["png":url(fixture(8193,1))],
  ["png":url(fixture(4001,4000))],
  ["png":url(fixture(3,2,"public.tiff"))],
  ["png":url(Data("<svg xmlns='http://www.w3.org/2000/svg'/>".utf8))],
  ["png":url(data),"text":"not allowed"],
  ["type":"public.png","data":url(data)]
 ]
 for (index,value) in invalid.enumerated(){do{_ = try NodePasteboard.write(value,to:board);check(false,"invalid PNG representation \(index) must reject")}catch{check(board.changeCount==validCount&&board.pasteboardItems?.first?.data(forType:.png)==validData,"invalid PNG representation \(index) preserves existing pasteboard")}}
 check(NSPasteboard.general.changeCount==generalCount,"general user clipboard was not modified")
 board.releaseGlobally();print(String(data:try JSONSerialization.data(withJSONObject:["nativePngPasteboard":true,"checks":checks,"count":checks.count]),encoding:.utf8)!)
}catch{board.releaseGlobally();fputs("PNG pasteboard error: \(error.localizedDescription)\n",stderr);exit(1)}
