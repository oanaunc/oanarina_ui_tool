# Remembered page views

The shared Design/Whiteboard canvas remembers each page's pan and zoom on this device. Switching pages restores that page's camera; reopening a project restores its last valid local page choice and available view. If the chosen page was removed from a newer saved file, the editor falls back to an available page. Reopening the same document identity also restores the remembered view rather than overwriting it with load defaults.

These are local interface settings. Camera changes do not modify the `.oui` document, its timestamp, artwork geometry, document Undo/Redo, MCP/export data or native unsaved/dirty status. Saving a project and sending it to another device does not send a camera. The browser demo and native app have separate storage contexts. Camera changes are not cloud synchronization or a substitute for saving artwork.

## Navigation

- Pan, wheel navigation, zoom controls and explicit **Zoom to fit/selection** update the current page's remembered camera.
- A new page starts with the standard fresh view. A duplicated page copies the source page's local camera; later changes are independent. Page filtering and reordering alone do not change the active camera.
- Direct main-component navigation, normal page selection, and Undo/Redo operations that change the active page identity use the same restore path. Explicit Fit still works after restoring a camera.
- Startup waits for document hydration. A stored camera suppresses the delayed initial Fit; without a stored camera, the existing startup Fit and interaction-cancellation safeguards remain in effect. Loading and passive lifecycle events do not save the temporary initial sample view.

The Slides workspace's stage framing, thumbnails and presenter/audience views use their existing separate controls; this implementation does not add per-slide remembered stage cameras. A presentation load still chooses its deck page.

## Local storage and limits

The versioned `oui-page-viewports` cache stores only bounded document/page identifiers, pan/zoom numbers, timestamps and last-page choices. It keeps at most **1,000 cameras** and **1,000 document page choices**. Older records can be evicted. Zoom must be between **0.05× and 8×**; remembered pan coordinates must be finite and within **±10,000,000 screen pixels**. Invalid or oversized cache data is ignored. This is not a `.oui` format change.

Changed metadata is saved after a 250 ms debounce and flushed on pagehide/hidden lifecycle events. Hydration/default resets do not create camera records. Page choices are updated by real page navigation or camera changes. Storage denial, quota failures or private browsing leave usable in-memory cameras for the current renderer; they may be lost on reload. Clearing site/application data also clears these views.

Windows keep their active cameras independent. Pending changes merge with other windows' persisted records before writing, retaining unrelated views; the latest timestamp wins for the same camera/page choice, with the current write winning a tie. There is no continuous synchronization of the currently displayed camera, and simultaneous writes cannot provide a cross-process transactional guarantee. Reopening or switching pages reads the available persisted records. The app's document identity policy still controls which project window opens; this cache does not alter native window ownership.

## Validation

- `npx vitest run tests/page-viewports.test.ts` covers decoding, bounds/eviction, collision-safe identities, debounce/lifecycle flushing, storage denial, multi-window merge/last-page timestamps, same-ID load, generic page navigation, copy/new defaults, Undo/Redo and unchanged native dirty/history state.
- `tests/e2e/page-viewports.spec.ts` exercises actual camera controls, separate pages, saved/reopened projects, same-ID and cross-document opens, removed-page fallback, duplicate/new pages, Fit, filtering/order, held hydration, saved-view startup suppression and unavailable cache storage. Native transport is an IPC fixture; these checks do not claim a Mac shell runtime gate.
- The existing startup-fit, hydration/ready-handshake, page/search and clipboard browser regressions must remain green. No native IPC permissions, project schema or theme preferences are changed by this feature.
