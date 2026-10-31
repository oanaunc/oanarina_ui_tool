# Forma 0.2.0-dev.15 validation

This preview reworks the everyday design flow from real use and fixes a redone edit being lost on reload. The register holds 2,022 requirements: **1,591 implemented, 232 partial, 13 planned and 186 retired**. Retired requirements are out of scope and do not count as implemented. The two newest retirements, the Romanian interface and translated menus, were dropped because they are not needed. The existing Romanian and Arabic packs stay as optional preferences and get no further work.

## Fixed in the shipped app

| Defect | Effect | Fix |
| --- | --- | --- |
| The crash journal was cleared on a timer after Redo | A reload or quit within about a second of Redo, longer on large files, replayed the undone state over the redone edit. Present in dev.14 and earlier. | The journal clears the moment Redo reaches the saved revision, and pending notes flush on `pagehide`. Under load the test failed 10 of 16 runs before this and passes 16 of 16 after. |
| The code layer painter referred to a variable left behind in `capture` | Where WebKit taints the capture canvas, as on older macOS, previews failed with "Can't find variable: root" | The painter uses `document.documentElement`, and a test bars the name. A frame user script forces this path in native acceptance, because guest scripts now run in a worker. |
| A click on anything in a screen selected the whole screen | Dragging or Option-dragging an object moved or copied the entire frame | Page-level frames and sections work as artboards. Their empty area and name still select them, and Command-click and double-click are unchanged. |
| Dragging across frames could reparent a site breakpoint mirror | A tablet or phone override was lost | Canvas reparenting leaves mirrors alone, in both directions. |

## Added

The [design workflow pass](DESIGN-WORKFLOW-PASS.md) built a mobile screen, a dashboard and a prototype through the interface and fixed what got in the way. Native menus now use the same order as the in-app menus, from `src/menu-order.json`.

Import gained live structure for [.fig](FIG-IMPORT.md), [Sketch](SKETCH-DOCUMENT-IMPORT.md), [SVG](SVG-IMPORT.md) and [PDF](PDF-DOCUMENT-IMPORT.md). Vector networks gained planar faces and holes, strokes run on curves and closed contours, and [guest scripts run in a worker](GUEST-SCRIPT-ISOLATION.md) that can be stopped.

## Behavior changes

- A canvas click now selects an object on a page-level frame instead of the frame.
- Nested frame labels are off by default, with a toggle in View.
- Dragging an auto layout child out of its container now moves it out, with one Undo.
- Guest canvases cannot use `toDataURL` or draw an `<img>`. `drawImage` with an image reports that clearly.

## Results

On final source, before the version bump: **3,850 core tests across 324 files**, **2,514 browser interaction checks** with 1 skipped, **128 MCP tests**, editor and MCP TypeScript checks and the production build all pass. An earlier full browser run had nine failures. Four were real interactions between merged batches and are fixed above or updated in their specs, and five passed on a calmer rerun. They all pass in the final run.

Native acceptance now includes a design flow driven by real mouse and key events through AppKit: draw a frame, add a rectangle, type text, drag a rectangle in from the page, Option-drag a copy, Undo, Redo, save and reopen. It found the selection problem above. The acceptance run on the build before the final commits also found three stale steps, which assumed a same-thread guest, an unfolded color picker and raster-only PDF pages.

## Not verified

- Nobody has used this build by hand. The real-event flow runs inside the app, but access to drive the app from outside was declined, so no person or outside tool has watched it on screen.
- `.fig` and Sketch import are tested on self-authored fixtures only, with field names unverified against files from those apps.
- VoiceOver in-page, Intel hardware, physical trackpads, older macOS, real PowerPoint and Figma round trips remain open. The older macOS path above is forced by a test on macOS 27, not run on an older system.
- Found and not fixed: a single auto-sized text line is only as tall as its font size, double-click puts the caret at the end of text, and a 2x PNG is not named `@2x`. See [the design pass notes](DESIGN-WORKFLOW-PASS.md).

Installer details are published on the Forma website after notarization and Gatekeeper validation.
