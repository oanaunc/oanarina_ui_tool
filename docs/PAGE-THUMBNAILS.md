# On-demand page thumbnails

Hover over a page row or give the row keyboard focus to preview its static artwork after a short delay. Focusing a row directly does not select that page. The existing arrow/Home/End page navigation still selects visible pages, and Option–Shift–Up/Down still reorders using the complete document order.

Only one preview is rendered at a time. There is no hidden renderer or cached bitmap per page. A document with 1,000 pages still mounts only the requested page's artwork. The thumbnail fits all page layers through the existing `Artwork` and `visualBounds` paths; it does not silently drop layers or crop a large page to its first frame. Very spread-out artwork consequently appears small.

The preview uses render-only node/parent IDs in a separate namespace. Clip paths, masks, gradients, patterns and effects cannot reuse the active canvas's normal node IDs. These shallow render clones never enter document state. The tooltip has no node interaction callbacks or hyperlink anchors and accepts no pointer events. It cannot select artwork, follow prototype/text links, change camera/selection or add history entries.

Escape dismisses the preview while retaining row focus. Leaving or blurring the row also closes it. Page menus, dragging, search changes, any document edit/Undo/replacement, modals and viewport resizing close it. Scrolling dismisses shown previews and cancels pending hover previews. A still-pending keyboard-focus preview waits for scrolling to settle only while the same connected row remains focused and visible; this supports automatic focus scrolling without resurrecting old hover requests. Opening it again always renders current artwork. The popup is clamped within desktop, narrow and short viewports. The page row describes its named preview for assistive technology. Blank pages say **Empty page / No artwork on this page** instead of showing invented content.

## Scope and limits

This is a page-row preview, not the separate document-browser cover thumbnail feature. It shows the page's base static artwork; it does not sample animation playback, play prototypes, show comments/guides/selections or include the infinite canvas background. Transparency appears over a checkerboard. Hidden layers and masks render as they do in the editor. An otherwise nonempty page can appear blank when its artwork is hidden, fully transparent or masked away.

Rendering, bounds and fonts inherit the editor's existing limits, including conservative effect bounds, approximate clipping bounds and platform/font differences. Missing fonts use the same fallback as artwork elsewhere. No new document fields, persistent caches, native IPC or permissions were introduced.

## Validation

- `tests/page-thumbnail.test.ts`: isolated render-only IDs and hierarchy transforms, negative/distant full-content bounds and desktop/mobile/short-viewport geometry.
- `tests/e2e/page-thumbnails.spec.ts`: real decoded shape, image transparency and sibling-mask pixels; unchanged active canvas/project/history; off-page hover/focus; current-page SVG-ID isolation; keyboard dismissal; live edit/Undo refresh; empty pages; search/menu/drag/modal/project cleanup; mobile placement and one preview in a 1,000-page document.
- Existing page organization and page-search browser checks remain applicable to the preserved roving focus, filtered navigation, canonical ordering, drag and context actions.

These browser checks do not claim native WKWebView acceptance while the Mac is locked.
