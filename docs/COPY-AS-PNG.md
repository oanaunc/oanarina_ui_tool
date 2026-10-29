# Mac Copy as PNG

In the native Mac app, select artwork and choose **Edit → Copy as PNG**, find the action in Actions, or press **Shift Command C**. The native menu uses the same command registry as the editor. This shortcut and the default **2×** output match Figma’s current [Copy as PNG documentation](https://help.figma.com/hc/en-us/articles/4409078832791-Copy-and-paste-objects). This is an independently implemented Mac path, not complete Figma clipboard parity.

The command uses the existing selected-artwork export closure, visual bounds and SVG renderer, then rasterizes that result onto a transparent PNG surface. Supported ancestor transforms/clipping, sibling masks, paints, embedded images, effects and typography follow the same renderer as PNG export. It does not include unrelated artwork or paint the page canvas backdrop. Existing export limitations, including conservative effect/crop bounds and font rendering differences, still apply. It copies the sampled animation state when the timeline is open; pause playback first.

Copying does not add an image layer, change the document, dirty it or create an Undo entry. Pasting the resulting PNG into Forma follows the existing raster paste path and is a separate undoable image insertion; one PNG pixel becomes one document unit. The output is a raster snapshot, without editable layer/component information. Ordinary Copy continues to publish editable Forma layers, SVG and text.

## Limits and cancellation

- Raster output is exactly 2× the supported export bounds, rounded up to whole pixels. It must fit **8192 pixels per side and 16 million pixels**. An oversized selection is refused before allocating the decoder or raster surface; there is no silent downscaling.
- The PNG data URL must fit **20 MB including base64 encoding**. Native normalization also keeps the resulting transfer within that limit, so the effective binary allowance is about 15 MB. Large or noisy output can be refused after encoding. Select less artwork or use file export.
- A document/page/selection or animation-state change during rendering cancels before writing. Escape clears the selection and therefore cancels a pending render. A newer Copy/Cut/Paste or PNG copy invalidates an older PNG render so it cannot consume the newer command’s grant. A pasteboard write already dispatched/completed cannot be recalled.
- Failed rendering/encoding, cancellation, rejected native validation or a refused native write leaves artwork intact. Validation prepares the fixed PNG item before replacing existing pasteboard content. An OS-level pasteboard write failure after clearing cannot guarantee restoration of previous content; the command reports failure.
- Authorization retains the existing two-second single-use command window. Very slow rendering can expire safely; copy less artwork and retry. There is no background clipboard access or permission expansion.

The browser reports that this command requires the Mac app and points to ordinary PNG export. Outgoing TIFF/JPEG, browser-system PNG copying, Windows and Figma’s private editable clipboard are outside this implementation. Incoming native PNG/TIFF remains the separate supported raster paste path.

## Fixed native boundary

`clipboardWrite` accepts either the existing exact `{nodes, svg, text}` representations or one exact `{png}` data URL. It never accepts arbitrary UTIs, pasteboard names, file paths or mixed PNG/fallback representations. Swift checks the encoded budget, actual ImageIO PNG type, dimensions and decoded pixels before creating the `public.png` item. The PNG path publishes only that representation, replacing stale editable/SVG/text representations.

The active initialized window, main frame, loopback origin, private nonce, trusted event dispatch, captured IPC sender and fresh single-use token checks remain unchanged. Native menu commands issue their own grants; focused text controls do not trigger canvas PNG copying. Direct, synthetic, delayed or replayed writes are refused. Native tests use only unique private pasteboards, never the user’s general clipboard.

## Validation

- `tests/png-clipboard.test.ts`: scale, finite dimensions, edge/pixel guards before browser allocation and shortcut collision checks.
- `tests/e2e/copy-as-png.spec.ts`: actual decoded PNG pixels/alpha, transformed clipped mask coverage, keyboard/editor-menu/Actions entry points, saved project unchanged, cancellation, superseded copies, encoded limits, failed writes, focused inputs, browser limits and the shipped grant bridge’s synthetic/expired/replay rejection. These use an IPC fixture, not AppKit acceptance.
- `tests/native-png-pasteboard/main.swift`: a standalone ImageIO/private-NSPasteboard test of real PNG dimensions/alpha, exact representation types and malformed/wrong-type/size rejection while preserving existing clipboard content.
- `macos/ClipboardNativeSmoke.swift`: the real WKWebView command generates and decodes PNG on a private pasteboard, checks native menu shortcut, unchanged project state and replay rejection, then pastes and undoes an editable image. Native runtime acceptance must be run after an isolated app build and a coordinated lease of port 51981.
