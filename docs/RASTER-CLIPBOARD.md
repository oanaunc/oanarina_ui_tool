# Mac raster image paste

The native Mac app reads fixed PNG/TIFF pasteboard representations only on explicit Paste. It prefers Forma editable data and SVG, then PNG, TIFF and ordinary text. An invalid preferred representation fails without falling back to another type or to a previous local copy.

Paste inserts on the design canvas or inside the active slide container. An imported image is an ordinary editable image layer: move, resize, crop, delete, save and undo it with the editor's existing image tools. The first image frame is normalized to PNG with orientation applied. Pixel dimensions become document dimensions, regardless of DPI metadata. PNG alpha survives. The saved `.oui` embeds the normalized image, so it does not depend on a clipboard provider or external file.

ImageIO checks encoded size and source pixel dimensions before decoding pixels: maximum 20 MB encoded, 8192 pixels on each side, and 16 million pixels total. The normalized PNG is limited to 14,999,000 bytes so its data URI stays within the shared 20 MB transfer boundary. The renderer checks the PNG header and pixel limits before its own decode, validates the decoded dimensions, and checks that the original document/page/target remains current. Full project validation happens before a single undoable edit. Existing 50 MB project limits still apply.

TIFF pages beyond the first, animation and source metadata are not retained. There is no Finder/file URL import, file promise handling, HTML/RTF image extraction, arbitrary UTI IPC, automatic clipboard monitor or arbitrary image clipboard write. Ordinary Copy publishes editable Forma data, SVG and text; the separate [Copy as PNG](COPY-AS-PNG.md) command publishes a bounded PNG snapshot. Browser preview and Windows system image clipboard remain unfinished. System clipboard images therefore remain **partial** in the feature register.

## Validation

- `npx vitest run tests/raster-clipboard.test.ts`: malformed encodings and oversized headers fail before allocating an Image.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:51991 PLAYWRIGHT_SERVER_COMMAND='npx vite --host 127.0.0.1 --port 51991 --strictPort' npx playwright test tests/e2e/native-clipboard.spec.ts`: actual renderer Paste/edit/save/undo/redo, active-slide containment, invalid/oversized input and an image decode deliberately held across a page change. The browser uses an IPC fixture.
- `xcrun swiftc macos/NodePasteboard.swift macos/RasterPasteboardTests.swift -O -target arm64-apple-macos13.0 -framework AppKit -framework ImageIO -o /tmp/forma-raster-pasteboard-tests` then `/tmp/forma-raster-pasteboard-tests`: 15 checks using an isolated named pasteboard. Dimensions, alpha, TIFF orientation, representation identity, encoded/pixel limits, priority, malformed input and unsupported file URLs.
- After `npm run build:mac`, `build/Forma.app/Contents/MacOS/OanarinaUITool --clipboard-smoke-test`: 21 actual WKWebView/private pasteboard checks, including all earlier editable clipboard paths plus PNG insertion/save/undo, oriented TIFF and invalid raster rejection. This does not read or write the user's general clipboard.

Source references: Apple's [pasteboard types](https://developer.apple.com/documentation/appkit/nspasteboard/pasteboardtype), [ImageIO source inspection](https://developer.apple.com/documentation/imageio/cgimagesource) and [thumbnail transform option](https://developer.apple.com/documentation/imageio/kcgimagesourcecreatethumbnailwithtransform). These are native API and implementation checks; they do not claim a Figma desktop clipboard round trip or full parity.
