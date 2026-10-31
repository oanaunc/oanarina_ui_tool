import Foundation
import QuickLookThumbnailing

/** Finder icon and Quick Look thumbnail of the file cover, or the first page with artwork. */
@objc(FormaThumbnailProvider)
final class FormaThumbnailProvider:QLThumbnailProvider {
    override func provideThumbnail(for request:QLFileThumbnailRequest,_ handler:@escaping(QLThumbnailReply?,Error?)->Void){
        do{
            let project=try OuiProject(data:ProjectFileSafety.readBounded(request.fileURL))
            guard let scene=OuiPreview.cover(project),!scene.bounds.isNull,scene.bounds.width>0,scene.bounds.height>0 else{throw OuiError.invalid}
            let fit=min(request.maximumSize.width/scene.bounds.width,request.maximumSize.height/scene.bounds.height),size=CGSize(width:max(1,scene.bounds.width*fit),height:max(1,scene.bounds.height*fit))
            handler(QLThumbnailReply(contextSize:size,drawing:{context in
                // The bitmap is in device pixels at the request's scale, but the context arrives unscaled.
                let pixels=CGFloat(context.width)/size.width,applied=max(0.01,abs(context.ctm.a)),extra=pixels/applied
                if abs(extra-1)>0.001{context.scaleBy(x:extra,y:extra)}
                OuiRenderer(context).draw(scene,in:CGRect(origin:.zero,size:size),clearColor:CGColor(gray:1,alpha:1));return true
            }),nil)
        }catch{handler(nil,error)}
    }
}
