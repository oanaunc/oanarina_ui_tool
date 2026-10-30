# Box selection and parent hover outlines

Forma's source editor adds three local selection workflows. Exact Figma shortcut, geometry and interaction reference acceptance remains pending.

**Edit → Select layers in box…**, action search, or **Option Command B** opens a keyboard-accessible numerical selection box. X/Y are page coordinates; positive width and height define its size. Choose touching or fully contained layout bounds, and replace, add to, or subtract from the current selection. A live canvas rectangle and count preview the matches. Apply returns focus to the canvas; Escape or Cancel restores the opener. Tab stays within the dialog. Numeric values must be finite and within ±1,000,000.

With Move/Scale active, dragging empty canvas selects fully contained layout bounds. **Option** changes the same gesture to touching bounds, including when pressed or released without moving the pointer. **Shift** retains the selection from the start of the drag. The rectangle, dashed touching indicator and count update together. Blur, pointer cancellation, Escape or changed document/page/selection/camera/tool/editing context cancel the preview. In Motion, pointer boxes follow the displayed sampled geometry; numerical selection requires Motion and vector editing to be closed.

**Preferences → Movement and drawing → Show parent hover outline** adds a dashed outline around the immediately containing layer when hovering nested artwork. It is off by default, respects the main hover-highlight preference, excludes hidden/inherited-locked ancestry and follows transformed parent geometry. Leaving the canvas clears hover outlines. The preference stays local, separate from saved projects.

## Geometry and limits

Selection uses world-axis-aligned **layout rectangles**, computed through the complete rotation, reflection and scale chain. Containers and their children are independent candidates. Hidden and inherited-locked nodes are excluded; eligible component-managed children remain selectable for inspection. These are layout-box matches, not pixel or painted-path intersections: transparency, masks, clipping, effects and stroke extension do not change matching. A rotated rectangle's world bounding box can therefore intersect a selection box without its painted shape crossing it. Nonfinite projected bounds from extreme legacy scale chains are omitted rather than crashing the editor. Path bending outside stored layer bounds does not expand these layout boxes.

The immutable page index resolves ancestry iteratively, independent of node array order, and is covered by a reversed 20,000-layer fixture. Cycles and duplicate identifiers fail validation. Selection and previews change no document data, exported SVG or undo history. Imported file validation and `.oui` version compatibility remain unchanged. Parent-hover preference migration preserves older custom settings.

## Validation

`tests/selection-box.test.ts` covers transformed ancestry, containment/intersection/edge semantics, inherited eligibility, large hierarchies, extreme numeric input, operation merging and stale preview cancellation. `tests/preferences.test.ts` covers the added local preference and legacy migration. `tests/e2e/selection-box.spec.ts` exercises actual keyboard focus, numerical operations, live Option/Shift pointer behavior, cancellation, Motion sampling, persisted preferences and unchanged saved artwork. Existing selection and document-accessibility interactions remain in the combined browser validation.

Native WKWebView pointer/shortcut/assistive-technology acceptance is deferred with builds frozen. No native IPC, package, release, download or website changes are part of this source pass.
