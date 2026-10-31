# Linear and radial repeat

Forma provides **Object → Linear repeat…** and **Object → Radial repeat…**, also searchable in Actions. Select one source layer or container subtree. The original remains in place. The real Design canvas shows staged copies while the focus-managed dialog is open. Apply inserts the reviewed copies in one Undo step; Cancel or Escape discards the preview. Export and Save always use the document, never the staged canvas.

**Apply repeat** creates ordinary editable layers. Changing the original later does not update them; copied component instances retain their normal links to their main definition.

**Keep live** stores one layer with optional `liveRepeat` settings instead. Copies render from the source subtree in the same stacking position, so every edit, effect and Motion track on the source reaches them. The canvas, SVG, PNG and export bounds all include them, and clicking a copy selects the source. The Layer section edits count, steps, or pivot offset, angle and rotation, and the radial pivot moves with the layer. **Expand to layers** writes ordinary copies in one Undo step, and **Remove repeat** keeps only the source. Copies cannot be edited individually without expanding. A live repeat cannot be a mask, Boolean or instance child, sit directly in auto layout or inside a Boolean, or nest; a page allows 4,096 copies. Editable Figma Bridge transfer refuses it. An older build ignores the field and shows only the source.

## Controls and coordinates

- Count is 2–64, including the original.
- Linear X/Y steps are signed **world-coordinate translations per copy**, measured between corresponding points. They are not edge gaps or local axes. Zero steps intentionally overlap copies. The initial X step is source width plus 24; transformed sources can need a different world step.
- Radial pivot X/Y are world coordinates. A signed angle step rotates each successive copy around the pivot. **Distribute full circle** sets the step to 360/count. Radius changes the pivot along the existing pivot-to-source-center direction, keeping the original fixed; at zero radius the direction defaults to the world X axis. Moving the pivot recomputes the displayed radius.
- **Rotate each copy** rotates the source's complete world transform as it follows the orbit. Turning this off translates copies along the same circular orbit while retaining the source's world orientation.
- Source transforms, dimensions, opacity, paint/stroke stacks, effects, internal masks, and nested parent geometry are copied. Ordinary source styles and variable links remain linked. Source copies keep the same parent, ancestor clipping, and preceding sibling mask context.

The staged copies use the normal Artwork renderer. There is no alternate thumbnail approximation. The dialog's light backdrop blocks document editing; use the current camera to review the result. Changing camera, document, selection, tool, editor mode, UI scale, Motion, or an exclusive canvas-editing mode invalidates the session. Window blur, resize, and hidden-document state also cancel its preview. Close and reopen to continue. A retained callback cannot revive a canceled session.

## Copy identity and structure

The existing copy/remap and world-preserving reparent helpers allocate fresh node and reaction IDs, remap internal targets, and preserve references to outside definitions. All descendants are copied together. Main definitions and main-definition-containing subtrees are refused; use an instance instead. Instance roots retain their source link and overrides, and their generated children keep ownership under the copied root.

Copies are inserted immediately after the source root in its sibling paint order. This is deliberate even if a valid flat file interleaves source descendants after later sibling roots: a later mask must not become the copied roots' preceding mask. Descendant drawing order remains unchanged within each copied parent. The original node IDs and outside references are untouched. Page flows and animation tracks are not duplicated.

Before committing, normal layout/component/style derivation runs in the existing store transaction. Repeat verifies the resulting sibling order, IDs, parent structure, geometry, appearance and references against the reviewed plan. An incompatible controller refuses the complete transaction before history or document mutation. New instance override bookkeeping may be normalized by the shared component engine.

## Explicit limits

Only the visible Design workspace with Motion, outlines, and point editing closed is supported. The selected root and ancestors must be visible/unlocked. Managed instance children, mask-source roots or ancestors, live boolean ancestors, main-definition ancestors, and sources with their own responsive guide bindings are refused. A source subtree with animation tracks is refused; existing ancestor animation is not duplicated. A layout-owned source must first be made absolute; its direct parent must have fixed sizing. Parent control that still changes any reviewed node is refused atomically.

World rotation beneath a nonuniform ancestor can require skew, which the current node transform model cannot represent. Such radial rotations are refused, never approximated. Orbit-only radial placement and linear translations remain available when representable. Collapsed transforms are refused. This pass does not introduce skew matrices, multi-source repeat sets, repeat handles, animation repeat objects, persistent repeat settings, or new file schema.

Each source subtree is limited to 512 layers, each result to 4,096 new layers and 20,000 page layers, and the existing project to 20,000 total layers. Complete source/result project payloads are preflighted against the existing bounded 16 MB preview traversal before large clones/serialization. No embedded asset is silently omitted. Coordinates/geometry must pass existing .oui validation, including transform and ±1,000,000 position limits. Large repeat images/fonts can therefore hit the payload budget earlier than the layer count limit.

Materialized layers save/reopen in existing .oui versions 1/2 and use existing SVG/raster export paths. No special live-repeat metadata is sent to the Figma Bridge. Figma/native repeat parity and actual Figma round-trip acceptance are unverified.

## Source verification

Core tests cover copy identities/internal references, signed world translations with reflected/nonuniform ancestors, signed radial pivot/radius geometry, orbit-only orientation, skew refusal, inherited ownership restrictions, descendant and sibling masks with adversarial flat ordering, instance copies, payload/count bounds, invalid input, retained contexts, post-derive atomic refusal, and Undo/Redo/persistence. Browser checks exercise the actual Object menu, on-canvas previews, signed steps, radial controls, transform/mask/opacity/procedural-paint pixels, SVG export pixels, genuine File → Open, staged Save/export immutability, cancellation and retained callbacks, instances, controller refusal, and a 1280×720 viewport at 125% UI scale. These are synthetic local fixtures; no user images or private Figma files are uploaded.
