# Open a local Figma Design file

In the Mac app or browser editor, choose **File → Open project…**, then select a supported `.fig` file. The Mac Open panel and Finder **Open With → Forma** use the same import path. Forma registers as an alternate viewer/importer; it does not take ownership of Figma's file type.

Forma decodes the selected archive locally and validates the converted document and embedded raster pixels before opening it. The original file is never served through the local HTTP server or uploaded by the importer. Additional font downloads follow the existing font-library settings and are separate from document decoding. The source archive thumbnail is not used as a substitute for the document.

After import, review **Figma import report**, then edit the converted project. Save a `.oui` copy. On Mac the imported project starts dirty, has no source-file save binding, and its first Save requires a destination. Cancelling Save keeps the imported document open and unsaved. Native saves refuse a `.fig` destination. Reopening an already imported source focuses its existing window. Recovery uses the converted local project, not a writeable `.fig` binding.

## Supported subset and reductions

- Public Design pages, supported shapes/frames/groups, local transforms, order, opacity, visibility and supported paints, strokes and effects.
- Referenced embedded static PNG/JPEG assets. Encoded dimensions are checked before pixel decoding, and pixels are decoded before import acceptance, with an 8,192-pixel edge limit, 16-million-pixel surface limit and 20 MB encoded-image limit. Unsupported, corrupt or excessively large assets can refuse the import.
- Editable text with supported font and paragraph properties. When source glyph geometry is available and supported, an additive saved outline preserves its original appearance. Editing text, typography, rich-text styling or text layout invalidates that preserved outline and uses the actual editable text with available fonts. Moving the layer and changing its overall color/opacity remain ordinary edits.
- Main components stay main components, and instances stay live instances with their overrides. Nested overrides follow their full source path. Editing a main reaches every unoverridden copy. Mains kept outside the visible pages (library copies, soft-deleted mains) are added to an **Imported components** page so their instances keep working.
- Component sets become variant sets, in their stored property order. Text, Boolean and instance-swap properties become component properties when one layer consumes them.
- Auto layout, constraints, min and max sizes, and absolute children stay live. Local paint, text and effect styles and variable collections with every mode become real Forma styles and variables, linked where the layer agrees with them.
- Vector anchors, masks, image crops, gradient handles, corner smoothing, independent stroke weights, mixed text ranges and prototype links and flows map to native Forma data.
- Supported native annotation blocks can retain their own embedded visual snapshots as image layers. Their native rich-document editing and CRDT content are not imported as equivalent editable annotations.

The report lists what stayed live and every known reduction; it is not a guarantee of complete appearance or behavior parity. Stored positions win over live structure: before the file opens, Forma runs its own edit pipeline on a copy, and any instance, auto layout frame, Boolean or style link that would move or change the stored artwork is dropped to plain layers and reported, so the first edit cannot rearrange the file. Unsupported containers or malformed input fail before replacing the current artwork; a missing or unreadable image stays a marked placeholder you can replace.

**Evidence limit.** Every test here uses generated files. The field names come from what the existing mapper already reads and from public format research, not from a Figma schema the tests can check against. Where a real file names a field differently, that feature falls back to the plain result and the rest of the import is unaffected. A real-file comparison is still pending. Compatibility with every `.fig` file is not claimed.

Files and converted projects must be smaller than 50 MB, at most 20,000 layers per page and 60,000 in total. [Container limits](FIG-CONTAINER.md) also apply. A new File Open supersedes and aborts the previous operation; editing or changing the current document/page cancels a pending browser import, including a queued local recovery transaction. Failed or cancelled imports must not replace the active recovery identity.

Binary `.fig` export is not implemented and stays planned: a file only Forma could read would be a `.oui` wearing the wrong extension, and without a reference schema nothing here could show that Figma opens it. Use `.oui` for Forma projects, the supported [Figma Bridge](../figma-plugin/README.md) subset for editable return transfers, or SVG for visual exchange. A successful import is not a full-fidelity Figma round trip.

## Validation boundary

Committed tests use generated synthetic schemas, archives and artwork. Container, scene, raster, edit/undo, save/reopen, cancellation and native lifecycle checks are separate gates. Private user archives, decoded content, images, identifiers and comparison screenshots remain local and are not public fixtures. A low-resolution archive thumbnail can assist a local comparison but does not establish exact live-Figma acceptance.
