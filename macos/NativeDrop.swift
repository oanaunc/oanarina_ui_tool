import AppKit
import WebKit

/** Finder drags need no renderer message. Project files open in the shell through the same validated path as
 * File > Open; every other drop stays with WebKit, whose File objects carry bytes and names but never a path. */
final class EditorWebView:WKWebView {
    weak var owner:DocumentWindow?
    var smokeDragSession:(([NSDraggingItem])->Void)?;var promise:NamedFilePromise?
    func projects(_ info:NSDraggingInfo)->[URL] {
        guard let urls=info.draggingPasteboard.readObjects(forClasses:[NSURL.self],options:[.urlReadingFileURLsOnly:true]) as? [URL],!urls.isEmpty,urls.allSatisfy({["oui","fig"].contains($0.pathExtension.lowercased())}) else{return []}
        return urls
    }
    override func draggingEntered(_ info:NSDraggingInfo)->NSDragOperation {projects(info).isEmpty ? super.draggingEntered(info):.copy}
    override func draggingUpdated(_ info:NSDraggingInfo)->NSDragOperation {projects(info).isEmpty ? super.draggingUpdated(info):.copy}
    override func prepareForDragOperation(_ info:NSDraggingInfo)->Bool {projects(info).isEmpty ? super.prepareForDragOperation(info):true}
    override func performDragOperation(_ info:NSDraggingInfo)->Bool {
        let chosen=projects(info);guard !chosen.isEmpty else{return super.performDragOperation(info)}
        guard let studio=owner?.studio else{return false}
        for url in chosen{_ = studio.openURL(url)};return true
    }
    /** WebKit hands a dragged image to AppKit as a real file promise, so no renderer message is involved. It names blob images Unknown,
     * so the shell pulls the editor's own file name; the extension stays WebKit's, and the bytes and the write stay WebKit's too. */
    override func beginDraggingSession(with items:[NSDraggingItem],event:NSEvent,source:NSDraggingSource)->NSDraggingSession {
        if let provider=items.first?.item as? NSFilePromiseProvider,let original=provider.delegate{
            let namer=NamedFilePromise(original);promise=namer;provider.delegate=namer
            callAsyncJavaScript("return await window.__studioNative('drag-asset-name');",arguments:[:],in:nil,in:.page){[weak namer] result in if case .success(let value)=result,let name=value as? String{namer?.rename(name)}}
        }
        smokeDragSession?(items);smokeDragSession=nil;return super.beginDraggingSession(with:items,event:event,source:source)
    }
    override func concludeDragOperation(_ info:NSDraggingInfo?){if let info,!projects(info).isEmpty{return};super.concludeDragOperation(info)}
}

/** Names the file WebKit promised; everything else goes to WebKit's own delegate. */
final class NamedFilePromise:NSObject,NSFilePromiseProviderDelegate {
    let original:NSFilePromiseProviderDelegate;var name:String?
    init(_ original:NSFilePromiseProviderDelegate){self.original=original}
    /** Untrusted editor text: one path component, bounded, and never able to change the promised type. */
    func rename(_ raw:String){let leaf=(raw as NSString).lastPathComponent,base=((leaf as NSString).deletingPathExtension).trimmingCharacters(in:.whitespacesAndNewlines);guard !base.isEmpty,base.utf8.count<=200,!base.hasPrefix("."),!base.contains("\0") else{return};name=base}
    func filePromiseProvider(_ provider:NSFilePromiseProvider,fileNameForType type:String)->String {
        let fallback=original.filePromiseProvider(provider,fileNameForType:type);guard let name else{return fallback};let ext=(fallback as NSString).pathExtension;return ext.isEmpty ? name:name+"."+ext
    }
    func filePromiseProvider(_ provider:NSFilePromiseProvider,writePromiseTo url:URL,completionHandler:@escaping(Error?)->Void){original.filePromiseProvider(provider,writePromiseTo:url,completionHandler:completionHandler)}
    func operationQueue(for provider:NSFilePromiseProvider)->OperationQueue {original.operationQueue?(for:provider) ?? .main}
}
