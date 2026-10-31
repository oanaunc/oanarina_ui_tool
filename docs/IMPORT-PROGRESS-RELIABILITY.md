# Browser import progress, cancellation and failure reports

Forma now shows a local File import panel for browser File → Open (.oui, Figma Bridge .oui, JSON and the existing supported binary .fig Design subset), and File → Place image or SVG. Byte counts come from FileReader progress events; validation, raster decoding, outgoing recovery and incoming preparation have named indeterminate stages. The panel offers Cancel during asynchronous work and a dismissible cancellation/failure report. Reports identify the format, stage and a fixed, useful error category without copying parser excerpts, source contents, URLs or filesystem paths. No telemetry or upload was added.

Only the current task may publish. A second task aborts the old task. A subscription permanently invalidates a task when its document object, page, selection, mode, Home state, hidden UI, Motion state/time or dialog context changes, even when the user switches away and back. FileReader work is aborted where possible, image callbacks are detached and ignored after cancellation, and the existing .fig worker is terminated. Byte reads have a 30-second wait limit and image decode waits have a 15-second limit. Browser codec internals may keep running after callbacks are detached; the guarantee is no late document insertion or replacement.

## Raster batch insertion

Raster files are read, checked and decoded into a private staged batch. Every file must succeed before any nodes are inserted. The batch adds ordinary editable root image nodes on the original page at the existing import placement, with one Undo step and a final normal document validation. No image from a failed or cancelled batch is partially inserted. Source image bytes and the existing rendering/export paths remain unchanged.

Supported inputs are PNG, JPEG, GIF and WebP, up to 20 MB each, 32 files and 32 MB of aggregate source bytes per batch. Header dimensions are inspected before asking the browser to decode; decoded dimensions are checked too. Each side is at most 16,384 pixels and the aggregate batch is at most 80 million pixels. Existing 20,000-layer page and 50 MB readable-project limits apply before commit. Header checks are not a replacement for native codec validation, and the pixel budget does not promise a fixed browser working-set size or interruptible animated-codec internals.

## SVG review

An SVG is imported separately so the existing choice between editable layers and a sanitized visual asset stays explicit. Mixed SVG/raster selections and multi-SVG selections are refused with instructions to import one SVG at a time. The existing 20 MB / bounded parser / sanitized visual limits remain. Nothing is inserted before the review choice.

SVG review belongs to one exact editor session and one request object. A retained button from an older review cannot confirm a newer review. Selection/page/document/mode changes cancel the old review. Importing editable nodes or a visual asset validates a cloned target project before the single Undoable insertion. DTD and custom entity refusals stay specific; unexpected parser details are replaced with a safe generic explanation.

## Project opening and Figma scope

The selected project has to pass its existing format, schema and data budgets before outgoing recovery is flushed (including dirty zero-history imported or recovered RAM projects) and a prepared incoming document is installed. Cancellation is passed into the existing recovery and repository transaction APIs. The outgoing document remains unchanged on failed or cancelled imports. Existing .fig reduction notices and editable scene behavior remain; this work adds stage reporting and cancellation, not additional Figma compatibility or binary export. Bridge plugin execution inside Figma is outside this local import task.

Synchronous JSON/SVG parsing, schema validation and Figma scene mapping cannot be interrupted midway on the browser main thread. The UI yields before these stages and checks cancellation before the next publication boundary. Percent completion is intentionally not fabricated for those phases. Native picker operations, native bootstrap and the trusted native .oui Open adapter remain unchanged; no native IPC, filesystem or web-serving permission was expanded. Generic artwork insertion APIs explicitly refuse Slides; the existing Slides Image button remains separate and unchanged. Whole-import native progress/cancellation and exact reference acceptance remain unverified.

## Validation

- 13 new headless tests cover task ownership, permanent context invalidation, abort/late callbacks, batch atomicity/Undo, bounds, safe corrupt reporting and stale SVG requests.
- 10 new actual browser cases exercise real FileReader events, real native image decode callbacks, .fig worker termination, staged batch export pixels/Undo/save/reopen, corrupt input reports and retained SVG controls.
- 3 existing SVG browser cases and 10 existing .fig/Open browser cases pass unchanged, including recovery transaction cancellation and native bootstrap API mocks.
- No app build, native package, release archive or website change was made.

Status recommendations: UI-39-040 and UI-53-009 are partial across the complete application because native dialogs and synchronous phases are not interruptible; the listed browser import paths are implemented. UI-53-011 is partial across all import formats; the listed paths now provide bounded, explicit corrupt-input reporting and preserve source data. No reference verification claim is made.

## Startup and detailed-diagnostic compatibility

Browser startup registers an initial clean tracker baseline synchronously only for the untouched startup document/history. Registration is absent-baseline-only: it never clears an explicit dirty marker, and it does not run again on restored or imported documents. This preserves browser File Open's in-memory fallback when local recovery is denied without allowing dirty zero-history RAM artwork to be discarded.

Detailed failure reasons may use an exact, checked-in allowlist of fixed public validator diagnostics. Interpolated messages, unknown errors, JSON parser excerpts and messages with appended source data or URLs are not admitted. The list is static at runtime; changing a validator does not automatically authorize its new message for display. The generic reason remains the fallback for messages outside the list.

Additional regressions cover unavailable-storage opening, delayed startup restoration with edited/replaced documents, trusted diagnostic preservation and private-prefix/suffix spoof refusal. Native bootstrap and trusted native file APIs remain unchanged.
