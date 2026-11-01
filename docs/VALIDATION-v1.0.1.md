# Forma 1.0.1 validation

Forma 1.0.1 fixes four reports from real use: spec pages, mouse wheel flicker, the color and gradient panel, and the missing image placeholder. The register holds 1,808 public requirements: **1,624 implemented, 179 partial and 5 planned**. These counts did not change.

## Installer

`Forma-1.0.1.dmg` is 39,440,512 bytes, SHA-256 `cf0cc8743c1e3644ae736c6f222607476c6a8bbbbf208eb00d334be42718e142`, built from commit `1b0f737`. Apple notarization returned Accepted for the app and the disk image, both tickets are stapled, and Gatekeeper reports Notarized Developer ID. It is a universal build for macOS 13 or later. Intel runtime is not validated on real hardware.

The brand check scanned every file in the app, including the executable, property lists and zips, and found no hits.

## Results

| Check | Result |
| --- | --- |
| Core tests | 4,014 passed across 337 files |
| Browser interaction checks | 2,616 passed, 2 skipped, 6 failed on the last complete run, before the fix below |
| Browser checks rerun after that fix | Page camera, navigation and every spec that uses the wheel: 255 passed |
| MCP tests | 133 passed |
| Smoke, from a read-only mount of the final installer | Passed |
| Lifecycle | 37 passed |
| Clipboard | 38 passed |
| Renderer restart | Passed |
| Synthetic design file import | 13 passed |
| Integration | 86 passed |
| Acceptance, 27 groups, without `zoom` | 119 passed |

Of the six browser failures, four were a real bug: a page switch during a wheel glide was overwritten when the glide ended. It is fixed, with a test. The other two, `fonts` and `frame-delivery`, pass alone. The complete browser suite was not rerun after the fix.

## The four reports

**Spec pages.** A real design file held the cause: a page is a block whose content is in child blocks, and the old reader dropped them, which left an empty frame. Its four pages and 54 blocks now import as editable text, and the words match the file's stored preview images in the page checked by eye. All four pages were compared by layer count and text, not by pixels.

**Mouse wheel.** In the real WebKit view, slow wheel steps moved through 85 or more camera positions, with no single frame stepping more than 5%, frames at 15 ms or less at the 95th percentile, and no scaled copies. This held over about 330 layers, and again with 16 full-size screenshots added. The steps were synthetic events through the app's own wheel handler.

**Color panel, gradient bar and missing image.** Covered by new browser checks, including dragging a stop as one Undo step, adding by click, removing by keyboard, the panel staying on screen, and dragging a placeholder.

## Not verified

- **A physical mouse.** The acceptance group `zoom` injects real Command-scroll events, and they did not reach the app in automated runs on this Mac, as in 1.0.0. Whether the flicker is gone for a person using a real mouse is unconfirmed until someone tries it.
- **The spec page in the final app.** The real file was imported in the editor in a browser, and the installed app ran the synthetic import. The real file was not opened in the installed app.
- **Other spec block kinds.** The real file holds headings, paragraphs and bullet lists. Tables, code, quotes, rules, to-do items, images and embeds follow field names from the file's schema and are tested only with self-authored fixtures.
- **Slower Macs.** Below about 25 frames per second, Forma falls back to scaling a copy of the canvas between redraws, and that path can still shimmer. It was never triggered here.
- **Unchanged since 1.0.0, not rerun.** Quick Look, thumbnails and Spotlight on an installed app, and Open With for `.fig` files.
- **Hardware and systems.** VoiceOver speech, physical trackpads, printers, tablets, Intel Macs and older macOS.

## Decisions

- The color panel floats beside the inspector. Saturation and Brightness sliders are gone: the square and the HSB fields replace them.
- The inline gradient preview was removed in favor of the one gradient bar, which always shows the ramp left to right. Angle and center stay as fields and canvas handles.
- A spec page drops its hidden preview layer when every block was read. It stays hidden in the frame only when something was left out.
- A spec page with any block that cannot be proven keeps its stored image rather than showing partial words.
