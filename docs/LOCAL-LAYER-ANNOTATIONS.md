# Local layer annotations

The Inspect sidebar exposes **Layer annotations** for one selected layer. Add and edit plain note text, developer notes, stored numeric property references, authored box measurements, or a distance to another layer. Existing notes can be searched, edited and deleted. A local category manager creates, renames, recolors and deletes categories; deleting one preserves its notes as uncategorized. Categories belong to this layer’s annotation set, not to a document-global taxonomy.

Notes and category edits are staged until Save. Each successful edit is one Undo transaction and persists in .oui versions 1 and 2. Context-invalidated drafts refuse application instead of moving into another selection. Cancel discards the draft. Hidden/locked/managed annotations remain readable in Inspect; changing them requires an editable unlocked source. Component roots inherit one atomic annotation set and can override it; generated children are read-only. Resetting the existing component annotation override restores current source data. Main edits update linked copies on normal component derivation.

## Actual reference semantics

Property annotations read only the closed stored numeric fields `x`, `y`, `width`, `height`, `rotation`, `opacity`, `fontSize` and `strokeWidth`. They show current authored values rather than a copied string. A stored stroke or text field is not a guarantee about a multi-stroke stack’s visible ink or a loaded font’s glyph metrics.

Measurement annotations calculate the length of the authored local width edge, height edge, or box diagonal after the complete affine transform, including signed/nonuniform ancestor scales and rotation. These are box vectors, **not a visual axis-aligned bounding box**, glyph bounds, effect bounds or stroke outlines. Distance annotations join the two authored box centers in page/world coordinates. They do not measure nearest visual edges or automatic spacing gaps. Values update as referenced geometry changes. Center distances become explicitly unavailable when absolute-coordinate floating-point precision cannot support the displayed hundredth of a pixel. Box-vector lengths avoid translation subtraction. Deleted, missing or unavailable targets show an explicit unavailable result; the note survives, and Undo restoring the target restores the live value.

Internal distance references follow page copies, ordinary copied subtrees and component materialization. Cross-file clipboard targets outside the copied graph are explicitly made unavailable, with one notice; a coincident destination ID cannot silently retarget them. Copied ancestor ghost groups omit unrelated annotation metadata. Source and instance internal references map through their respective graph IDs. External targets of inherited component annotations are unavailable in generated copies rather than being guessed across ownership/page boundaries.

## Visibility and handoff

A saved per-layer checkbox controls its markers. **Show annotation markers on canvas** is an ephemeral editor preference and does not alter document history or exports. Markers are HTML siblings of the SVG, carry only counts, and use the authored transformed top-right box point. They are editing indicators rather than clipped artwork, not canvas annotation text. They appear in Inspect while Motion and modal editing are closed. Hidden/zero-opacity ancestry hides the marker. There is no dedicated pointer-driven annotation drawing tool in this stage.

The expandable **Handoff annotations across pages** searches notes, layer/page names, kinds and category names; filter developer notes or other kinds, page through 50 rows, and navigate an actual annotated layer without changing content/history/visibility. Live referenced values are shown when inspecting their owner. This is local file handoff information, separate from comment threads, assignments, developer resources and cloud collaboration.

## Validation, persistence and privacy

The optional node `annotations` object contains local `categories`, `items` and optional `visible`. Unknown fields, invalid kinds, malformed scalar/reference values, duplicate local IDs and missing local categories are refused before document publication. Bounds are 32 categories and 32 notes per layer, 2,000 plain-text characters per note, 512 annotation items in the complete derived document, 20,000 page layers/256 ancestors for geometry, and 100,000 document layers for the handoff scan. A distance target may deliberately be unavailable; a category reference must resolve inside its own annotation set. Legacy files without annotations retain absent metadata without migration/version changes.

Ordinary `.oui` saves, whole-file duplication and authorized source MCP project reads/replacements retain private annotations. No annotation text is automatically included in project summaries, error messages, logs or public artwork. Shared Artwork/SVG/PNG/PDF rendering does not draw annotation metadata. Canvas count markers are HTML and never enter the SVG export tree.

**Export for Figma** removes annotations and related override keys from a clone, also dropping opaque library ownership/publication data whose baseline strings might retain private annotation metadata. The source document remains unchanged. Standalone editable Figma Bridge import validates annotations before creating pages and emits only a generic omission notice. An annotation-only override does not detach an otherwise supported linked instance. No native Figma annotation API or desktop round trip is claimed.

Reusable library publication removes private annotations/related override keys before computing source fingerprints and emits one generic warning. Incoming reusable snapshots with annotations are refused. Installed consumer-library policies and normal whole-project saves remain intact. This stage adds no network service, filesystem permission, paid requirement, global category sharing or code-completion verification.

The dedicated pointer annotation tool, document-global category manager, arbitrary property types, edge-gap/dimensional constraint annotations and native/reference-app acceptance remain partial or unverified rather than being represented as complete.

Combined delivery also strips file-local comment threads before serializing Export for Figma. The ordinary editable .oui keeps both comments and annotations; the source document and Undo history are unchanged by delivery preparation.
