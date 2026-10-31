# Archived and foldable frame presets

Open **Assets → Frame presets**. Use **Preset category** to show Archive or Foldable, or use **Search layers and assets** to search names, categories, states and dimensions. Searches such as `archive iPhone SE`, `foldable open` and `360 × 800 px` work. Preset buttons support ordinary Enter/Space activation and visible keyboard focus. Dimensions are labeled **logical canvas px**. The original 17 presets remain available, and ordinary frame drawing and inspector dimension editing remain unchanged.

## Archive sources

Archive contains six older Apple interface sizes. The numbers come from the **UIKit Size (Points)** column of Apple's [archived iOS Device Compatibility Reference, Displays](https://developer.apple.com/library/archive/documentation/DeviceInformation/Reference/iOSDeviceCompatibility/Displays/Displays.html), viewed 2026-10-31. Forma maps one point to one logical canvas pixel; these are not native panel resolutions.

| Preset | Logical size |
| --- | --- |
| iPhone SE, first generation | 320 × 568 |
| iPhone 8 | 375 × 667 |
| iPhone 8 Plus | 414 × 736 |
| iPhone X | 375 × 812 |
| iPad Air 2 | 768 × 1024 |
| iPad Pro 12.9-inch, second generation | 1024 × 1366 |

[Figma's frame documentation](https://help.figma.com/hc/en-us/articles/360041539473-Frames-in-Figma-Design) describes preset categories including Archive. This pass implements Forma's own sourced archive selection workflow. It does not assert an exhaustive or dimension-identical copy of Figma's current archive catalog. Archive frames contain ordinary editable artwork, without device shells, status bars or safe-area simulation.

## Foldable reference sizes

**Foldable closed** is 360 × 800 logical px; **Foldable open** is 720 × 800 logical px. These are explicitly labeled **Forma book-style reference sizes**. They are generic design choices, not dimensions verified for a named device or for Figma's preset list. Both are searchable and insert independently. **Insert closed and open frames** inserts the corresponding pair as separate sibling frames, with 80 px between them, in one Undo transaction. The frames do not share content or simulate a hinge, cutout, viewport insets, posture changes or a responsive application runtime.

Android's [fold-aware layout documentation](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/make-your-app-fold-aware) distinguishes folding state, orientation, separating behavior, occlusion and fold bounds. A static design rectangle is not that runtime information. The two generic canvases are useful starting points for narrow and expanded layouts; real-device work must use that device's actual app window and folding information.

## Insertion and safety

Preset insertion uses ordinary frame nodes and the existing creation defaults. A new frame is placed at y=100 and 80 logical px to the right of the greatest authored `x + width` on the current page (x=80 on an empty page), then the camera fits the new selection. Placement preserves the existing authored-bounds rule; it is not collision detection for transformed or effect-painted artwork. A selected layer is never the destination: a locked or managed selection remains untouched, and new frames are top-level siblings. Successful insertion clears vector editing state. Design/Whiteboard canvas frames are supported; slide generation is excluded.

The shared insertion helper accepts one or two frames, at most 20,000 resulting page layers, positive finite sizes up to 1,000,000 logical px and finite placement within ±1,000,000. It scans placement iteratively and validates the complete candidate before publication. A final derivation check verifies inserted names, parent, position and dimensions. Invalid input and unsupported contexts create no document/history entry. The picker permanently invalidates old handlers across document, page, selection, Design mode, Motion, dialog, UI/home, asset-tab and filter changes; a current retry remains usable. Focused button Enter/Space stays local so canvas Space-to-pan does not swallow activation.

Individual insertion and paired insertion each use one normal Undo entry, support Redo, save and reopen. Frames persist through `.oui` versions one and two without a new schema field. Changing the catalog later cannot resize saved artwork. The headless helper remains usable without a DOM; camera fitting is browser-only. Existing source MCP and Bridge paths see ordinary frame geometry, with no new capabilities or preset-specific document metadata.

Validation includes sourced catalog sizes/unique IDs, category/state/dimension search, headless legacy/default/custom size behavior, real component/locked selection preservation, pair placement, Undo/Redo and `.oui` compatibility, invalid/context/placement/layer-budget refusal and a near-20k-layer placement check. Actual browser checks cover keyboard placement, paired/individual foldable frames, genuine save/reopen, source/filter away-and-back guards, ordinary dimension editing, existing frame workflows and 125% narrow-sidebar containment.

Candidate register assessment: UI-58-017 has a real reachable archive workflow with the scoped six-device catalog; full Figma catalog reference parity remains unverified. UI-58-018/019 have working generic closed/open preset workflows but remain **partial** against the device/Figma reference requirement until actual target dimensions are verified. No app build, package, archive file, website or release metadata is changed.
