# Offline Sketch document import

Forma can open a supported local `.sketch` ZIP through **File → Import Sketch document…**, or browser **Open project…**. Conversion runs in an owned worker and the user reviews counted reductions before opening a new editable project. The current project remains unchanged during reading, conversion and review. Existing reviewed-import repository delivery retains dirty source recovery and rolls back an unaccepted candidate with ownership checks. Opening starts a new project with empty Undo history; subsequent edits have normal Undo/Redo and `.oui` save/reopen. No document-version change was needed.

This is a **partial UI-39-033 implementation**, not complete Sketch compatibility. The Mac shared HTML picker is reachable without expanding native IPC. Native shell Open/associations and a real native Sketch comparison have not been verified.

## Editable supported subset

- Referenced pages, artboards and ordinary groups; axis-aligned parent-local saved frames become Forma coordinates.
- Unedited rectangular primitives, canonical oval primitives and straight open/closed path contours. Rectangle corner points must traverse adjacent corners. Standard fixed rectangle radii and SVG ellipse geometry have counted rasterization notices.
- One enabled solid fill and one enabled solid border, with basic alignment/caps/joins/dash values. Disabled definitions are omitted and counted. Native border-option enable-state, dash phase and rasterization are disclosed reductions requiring comparison.
- Text remains editable with one base style and the literal saved PostScript font descriptor. Rich ranges, font-name/weight resolution, detailed paragraph behavior and native glyph shaping are explicitly reduced. Installed/fallback font availability affects layout; imported files do not trigger a new font service.
- Embedded local PNG/JPEG bitmap layers, stretched to their saved frames. Headers and actual browser decoding must agree before review. Missing/nonlocal/unsupported references become visible editable gray rectangles with a notice, never network requests.

Every import has a reduction summary. Gradients/patterns become neutral gray paints; effects, prototype behavior, library links, layout/constraint rules, comments/user data and export settings are not transferred. Notices are shown before opening and retained in the new document description. Original source IDs become fresh local IDs. The original `.sketch` is never overwritten.

Nonzero rotation/reflection or explicit transform objects, arbitrary curves/rounded vector anchors, edited or explicitly open rectangle/oval primitives, symbols, Boolean groups, masks, unknown layer classes, multiple enabled paint/border stacks and unsafe geometry refuse the **whole** import before replacement. Unsupported nodes are not silently deleted. Raster-only preview files are not used as a substitute for editable conversion.

## Boundaries and cancellation

The archive reader validates central/local headers, sizes, flags, exact ranges, CRCs and duplicate names before publication. Only stored/deflate ZIP entries are supported; encrypted, multipart, ZIP64, link/special-file, traversal or unaccounted-data archives refuse. No path is extracted. Only `document.json` and referenced page JSON are interpreted; ignored previews and user records never execute. Asset references are local archive keys only.

Bounds are 20 MB input, 64 MB expanded bytes, 2,048 entries, 8 MB per JSON entry, 10 MB other entries, 256-byte ASCII ZIP names, 50 pages, 5,000 layers, 64 layer levels, 100,000 points, 500,000 scheduled JSON values and one million text characters. Repeated embedded image strings count each serialized node occurrence—including both legacy image and paint image fields—toward a 40 MB output preflight; a final 50 MB project guard remains before document parsing. Page titles and text are bounded too. Unique referenced images are limited to 128, 4,096 pixels per edge, eight million pixels each and 32 million aggregate pixels.

FileReader exposes actual byte progress and abort; archive entry progress is actual worker completion. The worker is terminated after 15 seconds, cancellation or source invalidation. Bitmap validation has a 30-second aggregate abortable deadline and the existing 15-second per-decode bound. Browser codecs may finish internal work after cancellation, but owned callbacks are cleared and cannot publish. Synchronous parsing, bounded inflation and JSON/model validation are not cooperatively interruptible; worker termination bounds their wall-clock lifetime, not instantaneous JS allocation/total browser RSS. Output accounting prevents repeated-asset amplification before full-document serialization, but ordinary parser/intermediate strings still consume memory.

Picker, entry and review receipts are invalidated permanently on source/page/mode/modal changes, including synchronous away/back cycles. Old callbacks cannot open a replacement context or confirm a newer review. Reports use fixed local error codes and do not echo raw source errors, URLs or private payloads. Ordinary `.oui`, direct `.fig`, SVG, REST JSON and PDF defaults retain their existing paths.

## Source reference and verification

The independent converter follows the official [Sketch file format introduction](https://developer.sketch.com/file-format/) and [JavaScript API geometry reference](https://developer.sketch.com/reference/api/). The archived MIT [official schema repository](https://github.com/sketch-hq/sketch-document), inspected at commit `4493900abbfa49ae82fbcb8ad85cccf2cc2256b0`, establishes the referenced-page structure and closed enum/object fields. Its archived status does not establish full current/native-format parity. No schema implementation was vendored and no dependency was added.

Synthetic fixtures exercise real ZIP/worker conversion, editable geometry and exported colors, local PNG decoding/damaged-image refusal, multipage conversion, progress/cancel/deadline cleanup, stale picker/review callbacks, dirty recovery denial and reviewed repository rollback. Core tests cover archive corruption/traversal/encryption, malformed/unsupported atomic refusal, adjacent corner ordering, scheduled-value bounds and repeated-image serialized-output amplification. User Sketch files or private artifacts are not test fixtures.
