import AppKit
let image=NSImage(size:NSSize(width:1024,height:1024))
image.lockFocus()
NSColor(calibratedRed:0.14,green:0.13,blue:0.16,alpha:1).setFill()
NSBezierPath(roundedRect:NSRect(x:20,y:20,width:984,height:984),xRadius:220,yRadius:220).fill()
let rect=NSBezierPath(roundedRect:NSRect(x:304,y:260,width:416,height:504),xRadius:62,yRadius:62)
rect.lineWidth=54
NSColor(calibratedRed:0.91,green:0.70,blue:0.83,alpha:1).setStroke();rect.stroke()
let div=NSBezierPath();div.move(to:NSPoint(x:304,y:566));div.line(to:NSPoint(x:720,y:566));div.move(to:NSPoint(x:492,y:566));div.line(to:NSPoint(x:492,y:260));div.lineWidth=54;NSColor(calibratedRed:0.66,green:0.83,blue:0.88,alpha:1).setStroke();div.stroke()
image.unlockFocus()
let bitmap=NSBitmapImageRep(data:image.tiffRepresentation!)!
try bitmap.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:CommandLine.arguments[1]))
