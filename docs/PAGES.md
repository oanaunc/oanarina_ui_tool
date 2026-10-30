# Local page organization

The design workspace's **Pages** list supports selection, duplication, rename, deletion and ordering. Right-click a page, use its visible-on-hover **Page actions** button, or focus its row and press **Shift–F10** to open the same actions. The menu also works with arrow keys, Home, End, Enter and Escape; Escape returns focus to the active page. Existing document-level New Page and Delete Page actions remain available.

With a page row focused, **Up/Down**, **Home** and **End** select another page. **Option–Shift–Up/Down** moves the focused page one position. Drag a page to the upper or lower half of another row to place it before or after that page. These keys are handled by the page list and do not nudge selected canvas layers. The list scrolls for large projects and retains a keyboard tab stop. Switching pages clears layer/vector selection and stops motion playback and resets its playhead so an edit cannot continue on a stale page.

## Search page names

Use **Search page names** above the list to filter by a case-insensitive name substring; surrounding spaces are ignored. Matching pages keep their existing document order. Typing a query never changes the active page or canvas, even when that page no longer appears in the list. The result count indicates when the current page is hidden. Clear with the field's **Clear page search** button or **Escape**; no matches leaves the search field and clear button available.

From the search field, **Down** selects/focuses the first match and **Up** the last. On a visible page row, arrows, Home and End navigate only the visible matches. Page actions keep operating on the complete document: moving up/down moves one position in the full page order, and dropping before/after a visible row uses that row's full-document position. Hidden pages are preserved. Rename, duplicate, delete, saving and Undo retain the current query; closing a page rename returns focus to a visible row or the search field if no match remains. Merely returning focus does not switch to another canvas.

The query is temporary interface state, separate from `.oui`, dirty state and Undo. Opening a different document clears it. It is not a global shortcut, content search or fuzzy/regular-expression search.

## Duplication and references

Duplicate Page inserts a uniquely named copy immediately after its source. It preserves canvas background, artwork geometry and hierarchy, own/inherited variable-mode distinctions, comments, canvas/layout guides, prototype settings/flows/interactions and the motion timeline. Page/layer identities, component-set identities and owned comment/guide/flow/reaction/action/track/keyframe identities are regenerated. Internal node references follow the copied artwork; references to definitions on other pages retain their original identity. Shared fonts, styles, variables, collections, guide styles and animation styles remain shared within the document. Text, names, URLs, expressions and arbitrary metadata values are not rewritten merely because they happen to contain an ID string.

Copied instances of copied mains link to the new mains. Instances of mains on other pages keep their existing main link. If such a main supplies an interaction that targets copied artwork, the copied instance receives the required link/interaction override. An implicit instance-swap default targeting a copied main becomes a typed property value on that copied instance. These narrow changes preserve the copy's internal behavior through later component synchronization while other main changes still propagate. Legacy instance metadata is hydrated on a clone, preserving existing overrides without mutating a document merely to prepare its copy.

Whiteboard-owned stickies, tables, self-contained connectors, mind maps and drawings follow duplicated page artwork. The timer and voting session remain document-wide; existing votes stay on original layers and are not duplicated. A mind map or component set split across pages must be moved together onto one page before duplication or deletion. Duplicating/deleting the active presentation deck page is refused: the current document schema has one deck; use the presentation workspace to duplicate/manage individual slides.

## Safety, history and limits

Duplicate, reorder and delete are each one undoable document edit. Saving a portable `.oui` retains the resulting pages and order. Deletion removes the deleted page's owned component-set and whiteboard metadata; it refuses to proceed when surviving layers, component controls, prototype actions (including conditional branches), flows or motion tracks still reference its artwork. It never silently detaches those links. At least one page remains.

Operations validate a cloned document before committing. The existing limits of **1,000 pages**, **20,000 layers per page** and **50 MB per project** apply; oversized changes fail before document mutation. New-page canvas background inheritance is preserved. Reordering and selection retain page IDs. Per-page saved canvas position/zoom, page thumbnails, page links, page sections and moving layers between pages remain separate work; these controls do not claim them or exact Figma reference parity.

## Validation

- `npx vitest run tests/pages.test.ts` covers typed reference remapping and preserved strings/shared libraries, own/inherited modes, actual store derivation and later component edits, legacy compatibility, whiteboard records, guarded deletion, single undo, validated persistence and limits.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5195 PLAYWRIGHT_SERVER_COMMAND='npm run dev -- --port 5195 --strictPort' npx playwright test tests/e2e/pages.spec.ts` exercises the actual context menu, editable copied instances, serialized save/reopen, keyboard focus/rename/order, drag placement, deletion refusal and undo. Its native file transport is an IPC fixture; Mac shell acceptance is checked separately.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5197 PLAYWRIGHT_SERVER_COMMAND='npm run dev -- --port 5197 --strictPort' npx playwright test tests/e2e/page-search.spec.ts` covers case-insensitive filtering without canvas/history mutation, visible-match keyboard focus, canonical ordering through hidden pages, contextual duplication, drag/drop, rename-away focus, saved project boundaries and document-switch reset. These are browser interaction checks; they do not claim a native shell test.
