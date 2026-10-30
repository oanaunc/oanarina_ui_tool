# Layout, media and SVG source implementation

This report records the preceding source pass. See the [typography, grids, local assets and export continuation](UNRELEASED-TYPE-GRID-ASSETS.md) for the current register and later validation. Counts below are the snapshot for this pass.

This continues the [preceding editor implementation](UNRELEASED-IMPLEMENTATION.md) after dev.12. The source register now has **1,183 implemented, 180 partial and 659 planned requirements**, out of 2,022 individually named requirements. Twenty-three more requirements have working implementation paths in this pass; three moved from partial and twenty from planned. Exact Figma reference verification remains pending. Forma is still an independent app in staged implementation, with substantial parity work unfinished.

No Mac app, production bundle, installer, notarization submission, downloadable Bridge/MCP ZIP, version change or website deployment was created. Existing dev.12 downloads remain unchanged. Automatic source CI does not package a Mac app; that workflow still requires an explicit manual build input.

| Area | Reachable source behavior | Limits |
| --- | --- | --- |
| [Shape drawing](SHAPE-DRAWING-WORKFLOWS.md) | Option draws six basic shapes from their center, Shift constrains live, transformed/Motion parents retain their original tracks, and last-shape repeat is available through toolbar, Actions, context menu and Option+R. | Shape creation edits base geometry. Corner smoothing remains planned. Shift+R remains rulers. |
| [Auto layout](AUTO-LAYOUT-COMPLETION.md) | Aspect-aware fill/stretch with a preserved ratio hint, paired padding, mask-preserving reverse paint/hit order, sibling insertion, reverse wrapping and seven wrap alignments. | Incompatible hard size limits take precedence. Baseline/stroke inclusion remain partial for transformed/complex geometry. Generated Dev CSS and editable Bridge do not reproduce all settings. |
| [SVG delivery](SVG-EXPORT-OPTIONS.md) | Editable text, stable IDs, safe attribute/style formatting, saved profile flags, hidden-layer export preference, overlapping-page crops for frame bounds and Copy selection as SVG. | New glyph outlining and stroke conversion remain planned. Complex export bounds retain conservative limits. Native clipboard acceptance awaits a future authorized build. |
| [Embedded media](EMBEDDED-MEDIA.md) | Bounded local MP4/WebM import/replacement, saved posters, canvas and prototype playback, loop/mute/start options, exact original-byte export, plus verified animated GIF placement and playback. | Native codecs/autoplay policy apply. Static exports, Motion and Bridge use posters. Whole-source looping starts at zero; the saved start time applies on load/restart. Nonrectangular clips/masks conservatively require manual Play. No Slides video import, video rendering, trimming or transcoding. |

All added project fields are optional. Version-one/two `.oui` compatibility is preserved. Validators run before document mutation; stored edits use the existing Undo, instance override and persistence paths. Asynchronous workflows abort on stale targets or contexts. Video runtime uses bounded embedded sources converted to scoped Blob URLs; no remote media URL, filesystem access or native IPC permission was added.

Independent reviews checked the merged mask/stacking paths, aspect-ratio preservation under incompatible min/max limits, clipboard dependency provenance, export formatting/resource concealment, and actual video visibility. The media review reproduced and verified fixes for offscreen audio and duplicated corner clipping. A visible video pauses on viewport exit; a completely clipped video receives no live source. Tests use locally generated graphics and tone fixtures, without private Figma documents or screenshots.

## Validation

Final integration on October 30, 2026 passes **940 core tests in 86 files**, **450 browser interaction checks**, **41 saved-file MCP source/protocol tests**, and both editor/MCP TypeScript checks. These checks run directly without creating packages. The full browser suite ran against a frozen-source development server on a separate loopback port using synthetic fixtures. It did not change the user's document. The source command registry was then regenerated to include Place video in future Mac menus; no native app was generated.

The downloadable Bridge/source comparison and bundled standalone MCP acceptance remain deferred while archives are frozen. No production bundle, native/WKWebView codec or clipboard smoke, notarization, or real Figma desktop round-trip acceptance is claimed. These source results cannot establish those outcomes.

Run the source editor with `npm run dev`. Installing the unchanged dev.12 download does not install this source work. The [feature register](FEATURE-REGISTER.md) keeps the remaining partial and planned requirements explicit.
