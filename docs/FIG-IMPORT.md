# Open a local Figma Design file

In the Mac app or browser editor, choose **File → Open project…**, then select a supported `.fig` file. The Mac Open panel and Finder **Open With → Forma** use the same import path. Forma registers as an alternate viewer/importer; it does not take ownership of Figma's file type.

Forma decodes the selected archive locally and validates the converted document and embedded raster pixels before opening it. The original file is never served through the local HTTP server or uploaded by the importer. Additional font downloads follow the existing font-library settings and are separate from document decoding. The source archive thumbnail is not used as a substitute for the document.

After import, review **Figma import report**, then edit the converted project. Save a `.oui` copy. On Mac the imported project starts dirty, has no source-file save binding, and its first Save requires a destination. Cancelling Save keeps the imported document open and unsaved. Native saves refuse a `.fig` destination. Reopening an already imported source focuses its existing window. Recovery uses the converted local project, not a writeable `.fig` binding.

## Supported subset and reductions

- Public Design pages, supported shapes/frames/groups, local transforms, order, opacity, visibility and supported paints, strokes and effects.
- Referenced embedded static PNG/JPEG assets. Images are checked before allocation and decoded before import acceptance, with an 8,192-pixel edge limit, 16-million-pixel surface limit and 20 MB encoded-image limit. Unsupported, corrupt or excessively large assets can refuse the import.
- Editable text with supported font and paragraph properties. When source glyph geometry is available and supported, an additive saved outline preserves its original appearance. Editing text, typography, rich-text styling or text layout invalidates that preserved outline and uses the actual editable text with available fonts. Moving the layer and changing its overall color/opacity remain ordinary edits.
- Main components and instances can become detached editable frames, with supported current property/slot values applied. Live library linkage and complete override semantics are not preserved.
- Supported native annotation blocks can retain their own embedded visual snapshots as image layers. Their native rich-document editing and CRDT content are not imported as equivalent editable annotations.

The report identifies known reductions; it is not a guarantee of complete appearance or behavior parity. Variable/library bindings retain supported current values. Complete auto-layout, prototype, collaboration, advanced paint/text/vector semantics and the other Figma products are not promised by this importer. Unsupported containers or malformed input fail before replacing the current artwork.

Files and converted projects must be smaller than 50 MB. [Container limits](FIG-CONTAINER.md) also apply. A new File Open supersedes and aborts the previous operation; editing or changing the current document/page cancels a pending browser import, including a queued local recovery transaction. Failed or cancelled imports must not replace the active recovery identity.

Binary `.fig` export is not implemented. Use `.oui` for Forma projects, the supported [Figma Bridge](../figma-plugin/README.md) subset for editable return transfers, or SVG for visual exchange. A successful import is not a full-fidelity Figma round trip.

## Validation boundary

Committed tests use generated synthetic schemas, archives and artwork. Container, scene, raster, edit/undo, save/reopen, cancellation and native lifecycle checks are separate gates. Private user archives, decoded content, images, identifiers and comparison screenshots remain local and are not public fixtures. A low-resolution archive thumbnail can assist a local comparison but does not establish exact live-Figma acceptance.
