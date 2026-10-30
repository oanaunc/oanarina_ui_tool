# Inspect and deliver a frame

This batch adds selected-frame controls to the existing Design and Prototype inspectors. It preserves the optional version-two `.oui` model, existing prototype flows and the native permission boundary. Reference verification against Figma remains separate from these independent behaviors.

## Inspect overflow

Select one frame in Design, then expand **Inspect frame overflow**. The inspector displays a static rendered preview with only that frame's clipping disabled. Its original clip value and artwork are unchanged. Nested clipping, masks, transforms and effects still use the normal renderer. A dashed rectangle identifies the selected frame's own bounds. While Motion is open, inspection uses the currently sampled artwork.

The list identifies **potential** overflow using descendant rectangular geometry with stroke/effect padding, projected into the frame's axes. Hidden descendants are excluded. Selecting a candidate reveals that layer; **Select potential overflowing layers** selects the complete candidate set, while the list displays at most 100 rows.

This behavior remains partial. Rectangular bounds are conservative: nested clips, masks, rounded paths, empty containers and occlusion may conceal a listed candidate. The list is not a pixel visibility proof or an automatic clipping repair. The preview can show the supported rendered result, but does not reproduce every Figma render behavior. Collapsed transforms, nonfinite geometry and hierarchies beyond 256 levels are refused with a message. Inspection, previewing and selection do not create document Undo entries or dirty the file.

## Set a selected frame's prototype start

Select one eligible outer frame. In **Design → Prototype starting point**, choose **Set as default prototype start**. The same control is available for a selected frame in Prototype. It reuses that frame's first existing flow, retaining its ID/name/description, and moves it to the first position. If none exists, it creates one there. All other flows are retained. The first flow is the existing presentation model's default when no selected artwork chooses another screen.

The change is one document transaction with Undo/Redo and `.oui` persistence. **Present from this frame** opens the actual prototype viewer at that frame without editing artwork. Presentation is available for locked artwork; changing a start requires an unlocked hierarchy. It does not create a navigation interaction.

Supported starting frames are visible ordinary outer frames with positive dimensions, including frames inside groups/sections, with no containing frame. Hidden ancestors, managed instance children, generated slide/sticky/table frames and excessive hierarchies are refused. Slides use their existing presentation controls. The Prototype panel still supports named/description editing, multiple flows, reordering and removal. Its starting-frame choices use eligible unlocked frames. An older saved unsupported or missing target remains visible as **Unavailable saved starting frame**; opening the panel does not silently replace that record.

## Save frame export profiles

Select a frame and use **Frame export settings** in the Design inspector or the main Export dialog. Both edit the same saved settings. An untouched frame shows one default SVG/1×/frame-bounds profile without changing the document. The first setting change saves it on that frame. Add or remove profiles, change SVG/PNG/JPG, choose 1×–4×, set a filename suffix, choose bounds and optionally include layout guides. Explicitly removing every row stores an empty list; **Add export setting** restores a row.

Profiles are additive `DesignNode.exportSettings` data, limited to 20 rows. Each has a distinct local ID, a supported format, a whole scale from 1 through 4, a bounded filename suffix, `frame` or `artwork` bounds, and a boolean guide choice. Validation runs at file parsing and shared editor/MCP transaction boundaries. Invalid input fails before the active document changes. New settings remain readable through the existing version-one/two parser, and ordinary document Undo/Redo preserves changes. Managed instance children and inherited locks protect profile edits; read-only export remains available.

Each row exports individually:

- **Frame bounds** removes the selected frame's world rotation/scale with an SVG wrapper matrix and uses its authored width and height as the output viewport. Descendant geometry, including affine skew from nonuniform ancestors, remains intact. Required ancestor masks and clips are retained; the root output viewport crops to the frame rectangle.
- **Artwork bounds** uses the existing world-oriented visual-bounds export, including its conservative bounds behavior. The frame's current clipping remains in effect.
- **SVG** remains vector artwork, with width/height scaled by the chosen output factor and the source viewBox retained. **PNG** preserves transparency. **JPG** composites onto white.

Raster output is limited to 16,384 pixels per side and 80 million actual rounded output pixels. The exporter snapshots the selected frame, settings, sampled artwork and embedded-font SVG before asynchronous image rendering or Save begins. Changing projects while that operation is pending cannot retarget it or mark the replacement project saved. Each download uses a sanitized frame name plus the validated suffix.

Frame export settings remain partial relative to the full interchange roadmap: PDF, width/height resolution constraints, advanced color/export options, batch execution and complete Figma export parity are absent. Profile metadata is local `.oui` data; transferring it through the Figma Bridge or binary export is not claimed. Existing general selection/page exports retain their separate behavior.

## Validation

Committed tests use synthetic artwork only. Core checks cover malformed profiles and atomic store refusal, old/new parsing, Undo/Redo, geometry limits, transformed clipping, flow identity/default semantics, inherited locks, a full 20,000-frame page, and changing projects during a pending raster export. Production browser checks inspect actual overflow-preview pixels, SVG dimensions, PNG transparency, JPG white pixels, persisted profiles, rejected imports, existing unsupported flow preservation and actual prototype presentation.

Isolated validation passed the complete **686-test / 68-file** core suite, production build, and final **13** focused core checks after adding the zero-dimension starting-frame guard. The relevant browser run passed 25 checks and exposed a changed single-frame Export button label in an existing guide-export check. Preserving that original label fixed the regression: the focused guide/profile pair passed **2/2**, and the final frozen frame-delivery suite passed **5/5**, including actual presentation. No timeouts or product timing were relaxed. The earlier flow test was corrected to reselect its frame after the existing Undo/Redo behavior cleared selection.

Native build/smoke verification and register reconciliation belong to integration of this batch. No private design files, Figma IDs or screenshots are included, and no native IPC or filesystem permissions are expanded.

Source follow-up: frame overflow images now use isolated shared-renderer SVG images with font embedding and bounded required context, preventing Canvas SVG-definition collisions. Conservative overflow status remains partial. Responsive resize analysis, Apply guards and current context/payload limits are documented in [Responsive frame resize preview](RESPONSIVE-RESIZE-PREVIEW.md).
