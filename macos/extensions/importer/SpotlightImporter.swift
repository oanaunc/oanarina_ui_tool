import Foundation
import CoreServices

/** Indexes a project's title, description, page and layer names, fonts and authored text for local Spotlight search.
 * Nothing here leaves the Mac: Spotlight stores these in its own on-device index. An invalid file adds nothing. */
@_cdecl("FormaImportMetadata")
public func FormaImportMetadata(_ attributes:CFMutableDictionary,_ path:CFString)->Bool {
    guard let project=try? OuiProject(data:ProjectFileSafety.readBounded(URL(fileURLWithPath:path as String))) else{return false}
    let summary=project.summary,target=attributes as NSMutableDictionary
    func set(_ key:CFString,_ value:Any?){if let value{target[key as String]=value}}
    func list(_ key:CFString,_ values:[String]){if !values.isEmpty{target[key as String]=values}}
    if !summary.title.isEmpty{set(kMDItemTitle,summary.title)}
    if !summary.details.isEmpty{set(kMDItemDescription,summary.details)}
    list(kMDItemKeywords,summary.pages);list(kMDItemLayerNames,summary.layers);list(kMDItemFonts,summary.fonts)
    set(kMDItemNumberOfPages,project.pages.count);set(kMDItemCreator,"Forma");set(kMDItemContentModificationDate,project.updated)
    set(kMDItemTextContent,([summary.title,summary.details]+summary.pages+[summary.text]).filter{!$0.isEmpty}.joined(separator:"\n"))
    return true
}
