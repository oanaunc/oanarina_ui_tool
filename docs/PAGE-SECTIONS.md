# Page dividers and local section organization

UI-05-020 is a partial implementation of page organization. It follows the [documented Figma page-divider convention](https://help.figma.com/hc/en-us/articles/360038511293-Create-and-manage-pages): a blank page with a leading hyphen in its name is a divider. It does not invent nested folders or claim exact native Figma sidebar parity.

Use **Add page divider** above the Pages search to insert an empty named divider after the active page, or choose **Insert page divider after this page** from Page actions. A blank page's menu also offers **Use as page divider** and a divider's menu offers **Restore ordinary page**. These are real page/name/order changes, each using the existing one-transaction Undo and portable .oui save/reopen paths. A divider remains selectable: its blank canvas, rename, page actions, thumbnail and ordinary page controls remain available. Creation inherits the current page's canvas background. It does not move existing page artwork or create a hidden controller.

The divider's heading visually introduces subsequent pages until the next divider. Reorder/drag moves the selected page alone in canonical document order; it does not implicitly move all following pages. Existing page IDs, ordering, duplicate/delete behavior, camera restoration, handoff badges and comments remain unchanged. Duplicating a blank divider preserves its naming convention; adding artwork or other owned content makes it an ordinary page automatically. Undo restores the previous appearance. A content-bearing legacy page beginning with a hyphen stays an ordinary page with its original name and artwork intact.

For safety, divider classification also requires no comments, canvas guides, prototype flows or Motion tracks. The presentation deck page cannot become a divider. This is deliberately narrower than inferring blankness solely from visible artwork; empty nonvisual page settings and canvas background remain accessible on the selectable divider. No new .oui metadata or migrations are introduced, and .oui 1/2 readers retain the ordinary blank pages and names.

## Collapse, search and keyboard

Each heading has an accessible **Collapse/Expand page section** button. Collapse is transient interface state: it never edits the document, selection, camera, history, dirty state or saved file. If the active page is inside a collapsed section, the current-page-hidden notice stays visible and its canvas remains active. The heading remains reachable for expansion.

Search matches ordinary page names and divider headings. A heading-label match reveals its following section pages; a child match retains its heading for context. Search temporarily reveals collapsed matches without changing collapsed choices, and clearing search restores the original collapsed view. It never silently clears the query or switches the canvas. A different document identity resets the local query/collapse state.

Existing Up/Down/Home/End page navigation uses the visible rows, including selectable divider headings. Option–Shift–Up/Down and page drag/drop still operate on full canonical indexes, preserving collapsed or filtered pages. Space and Enter activate the new native buttons without starting canvas gestures. The page context menu remains keyboard accessible and scrolls when its additional actions exceed a short viewport. Ordinary page context actions and thumbnail behavior retain their existing paths.

Source subscriptions permanently invalidate retained actions, disclosures, search callbacks, menu delivery and drag receipts across source/context changes, including away-and-back cycles. Menus cannot retarget a replacement page; missing menu targets are checked before rendering. Pending focus has its own one-use source/local receipt so an old scheduled callback cannot steal focus after a mode, modal, tab or query change. Fresh rendered controls can retry normally.

## Validation

Pure tests cover blank/content/deck classification, preserved absence/legacy names, canonical collapse/search ordering, one-Undo creation/conversion, .oui 1/2 parsing, lifecycle and a 1,000-page linear-read fixture. Existing source MCP name/order operations persist the convention without a new protocol surface; an actual source transaction/Undo regression exercises this route.

Actual browser checks cover creation/restoration, content lifecycle, original artwork retention, actual downloaded save/reopen, collapse/search canvas invariance, canonical drag/keyboard ordering, 125% short-window native button activation, menu-source replacement/removal, permanent source/local callback refusal and fresh recovery. Existing page/search/thumbnail browser checks remain in the validation set.

Native AppKit builds, release/archive regeneration and real Figma desktop divider round trips are deferred under the user's build freeze. No hosted collaboration or nested page folder behavior is claimed.
