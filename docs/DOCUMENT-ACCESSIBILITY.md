# Document accessibility and keyboard workflows

This source adds browser/DOM accessibility behavior to the shared Design and Whiteboard editor. Native macOS VoiceOver speech, rotor navigation, braille and WKWebView accessibility have not been acceptance-tested. ARIA attributes and browser interaction tests are not a substitute for that testing. No native build or distribution archive is changed.

## Selection announcements

An atomic polite live region announces page, selected layer names/types, inherited hidden/locked status and managed-instance status. Single selections include stored X/Y, dimensions and rotation, so keyboard nudges and property transforms receive updated context. Selection bursts/drag updates are coalesced after 120 ms; stale timers are cancelled. Names and multi-selection details are bounded, with a total count and at most three names. No selection is also announced. Home, Slides and open dialogs suppress editor announcements rather than competing with those interfaces. This does not provide complete speech feedback for every editor action.

## Document outline

View → **Document outline…** (Option–Command–L) opens a read-only page hierarchy. Its page selector works across the document; search includes names/types/state text and keeps matching ancestors. Hidden, inherited-locked and managed instance children stay inspectable. Tree items expose names, types/states, selected state, hierarchy levels, sibling position/count and expanded state. Arrow Up/Down, Home/End, Right/Left and Enter/Space provide keyboard navigation and explicit layer selection. Moving focus does not select or edit a layer. Selecting a target navigates to its real page, closes the outline and focuses the canvas; hidden hierarchy remains hidden and is identified in Layers.

Only 100 hierarchy rows render at once. Arrow navigation and Home/End cross those render pages; Previous/Next controls and search are also available. Computation walks the saved hierarchy iteratively without recursively copying ancestor paths. IDs are compared as data, never interpolated into CSS selectors. The outline refuses removed targets and Slides navigation. Local focus, search, expansion and selection are ephemeral UI state: inspecting/selecting does not modify the document or create history entries.

## Keyboard creation, selection and transforms

Object → **Insert layer with keyboard…** (Option–Command–N) creates frames, sections, slices, rectangles, ellipses, lines, arrows, polygons, stars and text. Native form fields accept name, X/Y and positive width/height (lines and arrows allow one zero axis, but not two); text has a content field. Geometry is finite and bounded before calling the existing `add`/drawing-default pipeline, which validates the derived document before commit. This deliberately inserts at the current page root: a selected locked/hidden/managed parent is not an insertion target. Changed document/page/selection/mode/modal contexts, Motion, Home, Inspect and Slides refuse the operation. Successful insertion is one ordinary undoable edit, persisted with the existing .oui schema (versions 1 and 2). Escape/cancel creates no layer. Freehand and pen-point drawing, imported media and application-specific Whiteboard/Slides objects are not represented by this basic insertion form.

Existing canvas Tab/Shift–Tab sibling navigation and Enter/Shift–Enter child/parent selection use eligibility rules that exclude hidden and inherited-locked targets. Existing Layers keyboard navigation supports explicit inspection of those layers instead. The new outline complements both paths. Canvas Arrow keys nudge, Shift uses the configured larger nudge, and keyboard editing of existing X/Y/W/H/Rotation fields provides numerical transforms. Existing store/command guards retain inherited locks and component override behavior. Tests verify move/resize/rotate, Undo/save, and refusal to move an inherited-locked child. This is not a claim that every drawing gesture or property has an equivalent keyboard operation.

Canvas accessible help describes these entry points. The outline and insertion dialogs set initial focus, wrap Tab/Shift–Tab around available controls, contain programmatic focus, close from input fields with Escape, and restore the opener on cancel (or the canvas on successful navigation/creation). These changes apply to these two dialogs; whole-application focus-trapping parity remains partial.

## Validation

`tests/document-accessibility.test.ts` covers unordered hierarchy/inherited states, collapsing/search ancestors, managed descendants, bounded announcements, stale/Slides targets, every basic insertion type, invalid geometry, .oui version compatibility and Undo.

`tests/e2e/document-accessibility.spec.ts` exercises real shortcuts/menus and accessible DOM names/descriptions, rapid consecutive tree keys, render-page navigation, read-only hidden/managed inspection, cross-page navigation, keyboard-only text creation and numerical transforms, save/reopen/Undo, invalid/stale insertion, announcement updates, and the new dialogs’ focus behavior. Native assistive-technology acceptance and full Figma reference verification remain pending.
