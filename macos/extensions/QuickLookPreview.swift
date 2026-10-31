import Foundation
import OSLog
import QuickLookUI
import UniformTypeIdentifiers

/** Data-based preview: Quick Look gets a PDF built in this sandboxed process. A file it cannot accept fails the request,
 * so the system falls back to its generic icon view instead of showing partial or guessed content.
 * The one log line holds counts only, and is how scripts/smoke-mac-extensions.sh sees a preview reach the host. */
@objc(FormaPreviewProvider)
final class FormaPreviewProvider:QLPreviewProvider,QLPreviewingController {
    func providePreview(for request:QLFilePreviewRequest)async throws->QLPreviewReply {
        let project=try OuiProject(data:ProjectFileSafety.readBounded(request.fileURL)),data=OuiPreview.pdf(project)
        guard !data.isEmpty else{throw OuiError.invalid}
        let reply=QLPreviewReply(dataOfContentType:.pdf,contentSize:CGSize(width:960,height:600)){_ in data}
        reply.title=project.name
        Logger(subsystem:"com.oanarinaldi.uitool.qlpreview",category:"preview").notice("served \(project.pages.count,privacy:.public) pages, \(data.count,privacy:.public) bytes")
        return reply
    }
}
