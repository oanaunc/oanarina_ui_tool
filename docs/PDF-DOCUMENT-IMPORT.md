# Offline PDF page import

UI-39-034 is **partial**: shared File → Import PDF pages… selects a local PDF on Mac or in a browser; browser File → Open also accepts `.pdf`. The native Open adapter, OS document associations and IPC permissions are unchanged. No native build or WKWebView acceptance is claimed by this source pass.

Forma parses the selected bytes in an owned offline worker, rasterizes at 96 dpi and reviews the result before replacing the current project. Each PDF page becomes one embedded PNG image on a separate Forma page. Those images support ordinary selection, crop, replacement, transform, Undo and `.oui` save/reopen. Opening itself starts a new project with empty history and fresh IDs; it is not an undoable insertion into the previous file. The original PDF is unchanged. There is no editable PDF text/vector conversion, PDF round-trip, selectable source text or source attachment in the resulting project.

The review explicitly excludes annotations (including link/form appearances), interactive fields, actions, JavaScript, attachments, media and interactive layers. Colors, unsupported fonts and advanced PDF graphics may differ, and should be checked in the page previews. Password-protected PDFs refuse promptly; no password UI or credential storage is added. Unsupported or corrupt input uses fixed diagnostics, without parser excerpts, action URLs, attachment names or source content. Review cancellation leaves the source document/history unchanged. Source/mode/modal/selection away-and-back transitions permanently invalidate both picker and review callbacks.

## Dependency and resource boundary

`pdfjs-dist` is pinned to official Mozilla release **5.4.624** (Apache 2.0). Version 6.4.299 requires Node 22.13, so it was not selected: this app's existing Node 22.12 toolchain support is preserved. Standard font and CMap license notices are in `public/licenses/pdfjs-dist.txt`. Only statically enumerated package CMaps and standard fonts are reachable through the custom resource factories. Their module URLs follow Vite's existing relative `base: './'`; the existing native server serves packaged assets beneath its editor resource root. No arbitrary file path, user project serving or IPC permission is added. Production packaging/native resource loading has not been run under the user's build freeze.

The worker receives bytes, never a PDF URL; worker fetch and XHR are denied. Main-thread supporting resource fetches only accept exact filenames present in the static package map, same-origin or module-generated data URLs, omit credentials, and reject redirects. PDF.js font-face publication, system fonts, JavaScript evaluation, XFA, WebAssembly/image-decoder and offscreen image-decoder paths are disabled. The PDF viewer and action/attachment APIs are not used. Imported text is not sent to a font service, and other project/global fonts are not registered for the PDF.

The pinned PDF.js display helper can resolve a partial operator list before propagating a strict worker stream error. Forma therefore also watches the owned worker's **pinned internal structured StreamKind.ERROR protocol**, checking the source, target and stream ID and refusing with a fixed message. It never parses or logs the error payload. This dependency must be re-reviewed and its genuine oversized-image regression retained on parser upgrades; no global console interception is used.

## Budgets and cancellation

- Input: 8 bytes–20 MB; 1–32 pages.
- At 96 dpi: positive dimensions up to 4,096 pixels per edge, 8 million pixels per page, 40 million page pixels total. All page viewports are checked before page canvases are allocated.
- Intermediate Canvas allocation: 8 million pixels each and 40 million active pixels including the current page canvas.
- Drawing lists: 100,000 operations per page, 300,000 total.
- Encoded PNG data: 24 MB total; the finished document must remain below the `.oui` readable size limit.
- Supporting assets: 128 requests, 2 MB per response, 16 MB aggregate, streamed with byte checks.
- Parsing/rendering deadline: 45 seconds. FileReader has the shared 30-second read deadline.

These are **not hard parser memory bounds**. PDF.js can allocate parser/decompression structures and a complete operator list before the operation count is available; individual internal image buffers are not a preallocated memory reservation. The worker deadline and termination bound task lifetime and prevent publication, rather than proving a hostile compressed PDF cannot create a temporary memory peak. Cancel aborts byte/resource reads, cancels active rendering and terminates the owned worker; a codec or browser PNG callback already in progress may finish internally, but cannot commit after cancellation. Cleanup is idempotent and does not replace the sanitized failure.

Dirty current work, including zero-history dirty/recovered work, must be retained before opening. Reviewed imported-file delivery owns a repository active-pointer generation until synchronous editor publication; cancellation after storage commit rolls back only that generation and cannot overwrite a newer window's active choice. Candidate payload and metadata are removed only if both still exactly match this import's owned snapshot; a newer metadata-only or payload-only change preserves both. A storage-only failure may use the existing clean-source in-memory fallback, with a visible `.oui` backup warning. Source invalidation never becomes a fallback success.

## Verification

Synthetic public fixtures cover multipage colors and actual Helvetica text, malformed/signature/page/geometry limits, a real 9,000 × 9,000 embedded image, a locally generated password-protected PDF, action/URI suppression, chooser/review cancellation, retained callbacks, owned repository rollback, normal image Undo and `.oui` save/reopen. Browser checks exercise the actual worker and raster pipeline; they are not Figma, Preview.app or native codec parity checks.
