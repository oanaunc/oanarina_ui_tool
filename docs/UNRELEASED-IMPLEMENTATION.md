# Source implementation after dev.12

This report records the preceding implementation pass. See the [layout, media and SVG continuation](UNRELEASED-LAYOUT-MEDIA-EXPORT.md) for the current register and later validation. Counts below are the snapshot for this pass.

This is implementation work in the shared editor and saved-file MCP source. No new Mac application, installer, notarization submission, downloadable Bridge/MCP archive, version bump or website deployment was produced for this pass. The existing dev.12 downloads remain unchanged. Source pushes now run source checks; producing a Mac development app requires the separate manual CI input.

The [feature register](FEATURE-REGISTER.md) contains 2,022 individually named requirements: **1,160 implemented, 183 partial and 679 planned**. Compared with the dev.12 register, 85 more requirements have reached implemented status. One hundred rows have new implementation evidence or documented limits. These are implementation statuses; exact Figma reference verification remains separate and pending. Forma is not a finished Figma clone.

## Reachable changes

| Area | Working source paths | Material limits |
| --- | --- | --- |
| [Image editing](IMAGE-EDITING.md) | Fit/crop/tile controls, pan/scale/rotation, seven tone adjustments, replacement, reset, source download/size and PNG-copy integration. | Crop uses an interactive inspector preview; full canvas crop handles and perspective remain unfinished. Native clipboard uses the existing API; no new native acceptance run. |
| [Vector editing](VECTOR-WORKFLOWS.md) | Endpoint continuation/closing, segment and point controls, transformed point selection/coordinates, winding and validated SVG path replacement. Motion anchor/tangent dragging uses sampled transforms and preserves base transforms and tracks. | Straight-corner fillets work; general curved-corner rounding is unfinished. Motion topology conversion, continuation and deletion remain guarded. |
| [Lines and shapes](LINE-AND-ARROW-WORKFLOWS.md) | World-space line endpoints/length/angle, independent arrow heads and size, stroke paint inheritance, transformed export bounds, polygon/star radii and reverse-direction drawing. | Compound paths use the first open contour for heads; exact Figma reference acceptance remains pending. |
| [Colors](COLOR-WORKFLOWS.md) | HSV square/ranges, HEX/RGB/HSL/HSB, alpha, recent colors, artwork pixel sampling and selected-tree RGB inspection/replacement. | Screen sampling requires a browser EyeDropper API; WKWebView has no new native screen sampler. Full mixed paint-stack editing remains unfinished. |
| [Design-system assignments](DESIGN-SYSTEM-ASSIGNMENTS.md) | Local styles and scoped color-variable assignment preserve unrelated bindings, honor inherited locks and refuse discarded managed edits atomically. | Local design systems; cloud-library equivalence is not claimed. |
| [Numeric editing](NUMERIC-SCRUBBING.md) | Label scrubbing, fast/precision modifiers, one release commit, typed-draft context guards and cancellation. | Shared numeric fields preview their value locally; specialized controls retain their own editors. |
| [Constraint guides](CONSTRAINT-GUIDES.md) | Transformed parent-axis constraint visualization with a view-only toggle. | Positional children only; flowing auto-layout children are excluded. |
| [Sections and Layers](SECTION-WORKFLOWS.md) | Section titles/contents/readiness, guarded nesting and fit, local section links, and exportable/ready/prototype/comment filters. | OS/cloud links, pass-through compositing, automatic group bounds and layer-attached comments remain unfinished. |
| [Preferences](WORKFLOW-PREFERENCES.md) | Font specimens, recovery interval, recent-file limit, export/color defaults, duplicate naming, zoom targeting, Control-click and numeric opacity have real consumers. UI scaling adjusts interface surfaces independently of artwork. | Native UI-scale acceptance awaits a future authorized build. Keyboard zoom uses the existing native command adapter. |
| [Components](COMPONENT-WORKFLOWS.md) | Nearest-main navigation, preferred property swaps, variant descriptions, property groups, accessible instance labels and override/reset behavior. Clipboard dependencies are closed and remapped. | Local recommendations and one-level groups; remote libraries and exact nested preferred-instance semantics remain unfinished/unverified. New Bridge metadata omissions are explicit. |
| [Asset delivery](EXPORT-DELIVERY.md) | SVG/PNG/JPG profiles on selected layers, instance roots and managed children; scale/width/height sizing, suffixes, JPEG quality, preview, batch ZIP assets and SHA-256 manifests. | No arbitrary native output-folder synchronization or Design PDF export. Complex clipping/text bounds retain documented conservative behavior. |
| Saved-file MCP | Newly editable metadata uses the same document validators and atomic revision/Undo protocol. | Live editor synchronization and the newer standalone downloadable bundle remain deferred. No listener or native IPC permission was added. |

All new document metadata is optional. Existing version-one/two `.oui` files remain supported; import and store boundaries validate input before live mutation. Pointer and asynchronous workflows include stale target/context and inherited-lock guards. Tests use synthetic documents; no private Figma files or screenshots are published.

Open now works from focused inspector inputs as well as the menu. It commits the current valid draft before choosing a file; cancelling the chooser preserves that edit. A real browser regression covers cancel, portable save and reopening the saved image settings.

Escape/Enter can always leave vector editing after the source becomes locked, managed or unavailable. Locked/managed geometry is not normalized, Motion entry/exit remains read-only, and closing the mode adds no hidden Undo transaction. Entry and topology-edit guards remain enforced.

## Validation

Final integration validation on October 30, 2026 passes **878 core tests in 82 files**, **399 browser interaction checks**, both editor/MCP TypeScript checks and **40 saved-file MCP source/protocol tests**. Browser checks ran against the development source on a separate loopback port with synthetic fixtures. They cover actual export pixels, portable save/reopen, Undo/Redo, locks, stale targets and interrupted gestures. Independent reviews also examined Motion/vector gesture safety, inherited locks, instance overrides, clipboard reference closure and batch-export bounds.

The bundled standalone MCP acceptance check and the downloadable Bridge/source comparison are intentionally deferred while release resources are frozen. They remain in the test suite and in the manually requested build workflow; source validation does not count them as passed. No new native/WKWebView smoke, production bundle, notarization or Figma desktop round-trip acceptance is claimed for this integration pass.

Use `node scripts/test-mcp-source.mjs` for saved-file MCP source checks without regenerating downloads. The normal `npm run mcp:test` command retains its packaging pretest for a future authorized build.

Run the editor from source with `npm run dev`. The development source contains these changes; installing the unchanged dev.12 download does not.

## Remaining scope

The 183 partial and 679 planned requirements remain explicit in the register. Major unfinished areas include cloud collaboration/accounts, broader plugin/widget hosting, advanced Draw/Dev Mode behavior, Sites/Make/Agents, exact interchange fidelity, binary `.fig` export, and additional Mac/accessibility/reference acceptance. No placeholder or list entry is counted as a working implementation.
