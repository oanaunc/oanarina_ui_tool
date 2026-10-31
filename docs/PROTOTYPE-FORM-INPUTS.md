# Prototype form input simulation

UI-34-020 is a bounded partial implementation. In the Prototype inspector, select a leaf rectangle, frame, main component or instance root, choose **Form input simulation**, bind a matching document variable, and apply. Definition changes use the normal document transaction, Undo and .oui save/reopen. No metadata is added to older files unless the author applies a definition.

Five real native controls are available: single-line text, multiline textarea, finite number, checkbox and select. Each has an accessible label and an authored disabled state. Text supports placeholder/length bounds, numbers support min/max/step, and select options use unique literal values. The resolved variable value supplies the default; defaults in the bound collection's modes must all satisfy the control. Inherited mode choices and bounded aliases use the existing variable resolver. Invalid defaults, missing/type-mismatched variables and unsupported settings refuse atomically rather than coercing values.

Only ordinary, steady, top-level-frame prototype viewports install the native controls. The same Artwork hierarchy carries their SVG foreignObject transforms, square rectangular clips, visibility, opacity and painter order. Fully clipped or collapsed controls do not enter keyboard focus. These use browser appearance and a system font; they do not reproduce the authored box's exact skin. Existing controls remain static artwork in the design canvas, Motion preview, transitions, nested frame viewports and static exports. Suspended presentation contexts explain this limit.

Typing changes only the presenter's existing temporary variable state. Other artwork bound to that variable updates through shared component/design-system/layout derivation and final validation. Definitions, saved defaults, selection, history and recovery documents never receive entered values. Number drafts can remain invalid locally with a readable error, then recover; Restart and Reset variable state also clear unchanged-value local drafts and errors. Ordinary frame navigation retains accepted values, while Restart, reset, closing and reopening return to authored defaults. Composition is held locally until completion, caret/focus survive accepted typing, and input key/pointer events are contained from prototype reactions and editor shortcuts. Escape releases field focus before a subsequent Escape closes presentation. A definition/source/page/mode/selection/font context change permanently invalidates old controls; fresh presentation can retry.

## Supported source and budgets

- Design files only; leaf box edges from 24 to 2,000 units.
- At most 256 definitions including generated instances; at most 64 visible controls in the active viewport.
- Affected pages: 20,000 layers. Source index: 100,000 unique layer IDs. Control ancestry: 64 levels with a shared 100,000-visit budget.
- Variable aliases: 64 levels, 20,000 uncached reference visits. Bound collections: up to 128 modes. Default resolution is cached by variable and resolved mode context.
- Labels: 120 characters. Placeholder: 200. Text: 1–2,000 characters, default 1,024. Select: 1–32 options. Number bounds: finite within ±1,000,000.
- Affected masks, mask stacks, live Booleans, media, slices, visible effects, Motion tracks and non-square clips refuse before publication. Ordinary unrelated artwork remains available.
- Authoring requires an unlocked hierarchy and an editable source outside managed instance children. Component inheritance and the explicit prototypeInput override channel use normal synchronization/reset behavior.

The implementation does not submit forms, execute code, perform authentication, fetch remote data, or expose password/file inputs. It does not add radio groups, native validation popups, arbitrary custom control styling, mobile virtual-keyboard configuration, complex clipping/effect composition or nested-frame interactive viewports. Native WKWebView behavior and a real Figma reference round trip remain unverified.

## Interchange and privacy

`prototypeInput` is additive optional .oui 1/2 node metadata, strictly validated before editing/derivation and again after derived geometry. Generic edits and source MCP batches cannot bypass typed/default/geometry validation. Clipboard packages close variable/alias dependencies and remap them on cross-file paste. Same-file page copies preserve their document-global variable references. Whiteboard/Slides paste explicitly becomes static editable artwork without input controllers. Local component-library publication includes the bound variable dependency and install remaps it; no runtime presenter state is in a publication. The component playground strips simulation metadata.

SVG/raster export contains saved base artwork, never native controls or entered values. SVG description, Dev CSS warnings and the Bridge report disclose the static reduction. The Bridge source validates control settings/references/defaults before creating nodes, then omits interactive semantics; API mocks are not a real Figma desktop round trip. The MCP library-context summary includes the form-variable dependency without expanding runtime state. Existing local permissions and native IPC are unchanged. Older readers may ignore this optional metadata and show only saved artwork.

## Validation evidence

Synthetic fixtures cover strict schema/defaults/aliases/modes, legacy .oui compatibility, atomic generic/import refusal, inheritance/override/reset, typed copy/page/library remapping, bounds/visibility/performance and Bridge mock reduction. Source MCP checks exercise actual persisted transactions and whole-batch refusal. Actual browser checks cover five controls, reflected artwork, caret/composition, finite-number recovery, reset/navigation, authoring Undo, source cycles/fresh recovery, save/reopen/runtime privacy, static SVG reduction and signed affine clipping/painter pixels at 125% UI scale.

App/native/standalone MCP builds, download archives, signing and release validation are deliberately deferred under the user's build freeze.
