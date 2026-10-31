# Native acceptance

Chromium tests cannot show what the shipped shell does. `--acceptance-smoke-test` runs the built renderer in the real AppKit/WKWebView shell against synthetic projects in a temporary folder and a nonpersistent WebKit store, and each check asserts bytes, pixels or editor state that came back through the real path.

```sh
npm run build:mac
build/Forma.app/Contents/MacOS/OanarinaUITool --acceptance-smoke-test
```

`FORMA_ACCEPTANCE=shader,crash` limits a run to named groups. It needs the app port free and, like the clipboard and integration smokes, a logged-in session where a window can become key. It takes about a minute and briefly enters full screen.

## Failures it found

These passed every browser test and failed in the shell.

- **In-page file pickers did nothing.** WebKit treats a missing `runOpenPanelWith` delegate as Cancel, so every `<input type=file>` was dead: Import images, PDF and Sketch import, plugin and widget packages, audio, fonts, brand and slide assets. The shell now shows a real open panel for the main frame only. The page receives a File, never a path.
- **Real exports were refused.** The native extension list had 12 entries, so PowerPoint, Markdown, palettes, CSS, HTML, Swift, Kotlin and TSX exports failed with "Unsupported format". The list now names every inert format the editor produces, each still behind a save panel. `.command`, `.sh`, `.app`, `.pkg` and `.terminal` are refused before any panel.
- **Safe mode lost the file.** Its placeholder took over the window session, so Restart normally opened the placeholder and the file binding was gone. An untouched placeholder now reports itself and leaves the session alone.
- **Element full screen did not exist.** `requestFullscreen` was undefined until `isElementFullscreenEnabled` was set, so Slides and prototype full screen silently stayed in the window.

## What was proven

| Area | Evidence |
| --- | --- |
| Display P3 | WebKit computes `color(display-p3 …)`. Real WKWebView pixels of a P3 fill convert to the display's sRGB as color management predicts. The exported PNG is tagged Display P3 by ImageIO and keeps the P3 coordinates. |
| Shaders | Real WebGL, corner pixels in the exported PNG, `WEBGL_lose_context`, and a SIGKILL of the WebKit GPU process: the context is lost, restored, and the shader repaints in the same renderer. |
| Crash recovery | SIGKILL of WebContent after a journal write. The same window returns, the journal replays, and that edit plus the Undo history stored before the kill both undo. |
| Undo history | Also survives an ordinary close and Reopen Closed Window in a new renderer. |
| Safe mode | Two starts ended by a real kill enter safe mode. Restart normally returns to the same document and file binding. |
| Code layers | Inert until Run, opaque origin, fetch removed, preview pixels read back from the saved `.oui`. |
| Plugins and widgets | Packages from real files, a worker and an interface frame in opaque origins, network refused, reviewed Apply, widget Undo. |
| Save | Save As, PNG, JPG, SVG, PDF, 15 further extensions, and refusals. |
| ZIP exports | Prototype player, Sites and brand assets pass `unzip -t`. The prototype and site open in a bridge-free WebKit view. `.pptx` is a valid package. |
| Animation | MP4 decoded by AVFoundation with frames showing the layer moving. WebM decoded by WebKit. |
| Finder drops | Real file URLs through WKWebView's drag destination methods: PNG under the pointer with Undo, batches, TIFF and HEIC conversion, SVG review, PDF and Sketch workers, mixed-drop refusal, `.oui` opening in its own window. |
| Finder drags | A dragged export preview starts WebKit's own `NSFilePromiseProvider`, named by the shell. The promise's real write produces the exported image. |
| Sampler | The menu item and everything after the sampler's answer, including Undo and Display P3 coordinates. |
| Installed fonts | Every named face of a family, with Core Text advance widths proving each CSS weight reaches that face. |
| Keyboard | Real Tab and Shift-Tab events through AppKit reach buttons, fields and selects, and `:focus-visible` matches. |
| Interface scale | A real click at 125% selects the layer under it. |

## What was not proven

- **VoiceOver.** Nothing here shows VoiceOver speaking. `AXUIElement` reads the shell's own window title and controls and confirms WKWebView publishes a remote accessibility element for its page. Without the Accessibility permission macOS refuses the crossing into WebContent (`kAXErrorCannotComplete`, -25204), so roles and names inside the page stay unread.
- **The sampler's own click.** `NSColorSampler` runs out of process and cannot be driven from the app. A person has to confirm the loupe.
- **A person's drag.** Drops use a test `NSDraggingInfo` with a real pasteboard, against WebKit's real destination code. The Finder side of a drag out was not exercised; the promise delegate Finder calls was.
- **Save panel choices.** On this macOS the save panel is remote and refuses `ok:`, so acceptance presents the real panel and supplies the destination itself. Cancel is real.
- **Older macOS.** One Mac on macOS 27. MediaRecorder codecs and canvas tainting differ by WebKit version.
- **The foreignObject fallback.** macOS 27's WebKit did not taint a `foreignObject` canvas, but older WebKit does. The code layer's DOM painter runs only on `SecurityError`, so its check forces that error and verifies the painted pixels.
- **System preference changes.** `prefers-reduced-motion` and `prefers-contrast` match the macOS setting as it stood. The settings were not changed.
- **The system clipboard.** `navigator.clipboard.writeText`, used by Copy link and code buttons, is not exercised, because smokes never touch the person's clipboard.

## Image decode scheduling

Measured in the real WKWebView with six 12-megapixel JPEGs in SVG patterns, the worst frame gap was about 120 ms with the default, with `decoding="async"`, and after decoding everything first. A scheduler would change nothing measurable here, so none was added.
