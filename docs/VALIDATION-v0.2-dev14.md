# Forma 0.2.0-dev.14 validation

This preview ships fixes found by running Forma inside its real Mac shell, together with the motion, organizing and inspection batches. The register holds 2,022 requirements: **1,538 implemented, 287 partial, 13 planned and 184 retired**. Implementation and Figma reference verification stay separate.

## Fixed in the shipped app

Chromium tests could not show these. All were present in dev.13 and earlier.

| Defect | Effect | Fix |
| --- | --- | --- |
| The shell had no open panel delegate | Every `<input type=file>` silently did nothing: images, PDF, Sketch, fonts, plugins, widgets, audio, brand and slide assets | Main-frame open panel on the app's origin. The page receives bytes and never a path. |
| The save allow-list was too small | PowerPoint, Markdown, palette, CSS, HTML, Swift, Kotlin and TSX exports failed as unsupported | Inert export formats are allowed behind the save panel. Executable types and extensionless names are refused. |
| Element full screen was off | Slides and prototype full screen stayed in the window | Enabled, with real enter and exit checks. |
| Safe mode's placeholder took over the session | Restart normally lost the file binding | The placeholder no longer owns the session. |

Two more were found while merging. H.264 High in `quality` latency mode never returned a frame in WKWebView and would have hung export; it now runs in `realtime` mode with a stall watchdog and Baseline fallback. Forma's WebM writer used fixed eight-byte EBML sizes, which WebKit refuses and other players accept; sizes are now minimal, and a test proves every seek and cue offset lands on its element.

## Added

[Video export](ANIMATION-VIDEO-EXPORT.md) with audio, [prototype comments](PROTOTYPE-COMMENTS.md), canvas annotation and measurement, sRGB and Display P3 conversion, real group resizing, automatic section and frame fit, SwiftUI, UIKit, Compose and XML output, layout-aware shortcuts, interface scale to 150%, shape morphing, nested slots, nested background blur on frames with one solid fill, shaders that sample layer pixels, fuller vector PDF, Finder drops, system clipboard text, images and SVG, and installed font faces. See the [native acceptance record](NATIVE-ACCEPTANCE.md).

## Behavior changes

- Dragging a group handle now resizes its layers rather than storing a scale. Already-scaled groups keep their behavior.
- Rotated Fill children in auto layout change the next time their page is edited.
- Files using nested slot-bearing instances, nested background blur, sampling shaders or the new annotation fields are refused by older builds. Legacy files open unchanged.

## Results

Combined source passes **3,526 core tests across 301 files**, **123 MCP tests**, editor and MCP TypeScript checks and the production build.

The complete browser run on this code recorded **2,404 passed, 2 failed and 1 skipped**. Both failures pass alone at low load, so they are load-sensitive. After that run the WebM writer changed; its core tests and `animation-video` pass, and a complete browser rerun was not performed.

A universal build passes native smoke, lifecycle (37), clipboard (38), renderer restart, synthetic `.fig` import (13), integration (85) and acceptance (85) checks.

Not done: VoiceOver inside the page, because macOS refuses the crossing without the Accessibility permission; a person's physical Finder drag, sampler click, trackpad, tablet and printer; Intel hardware; older macOS; real Figma, PowerPoint and Keynote round trips. Android output is uncompiled.
