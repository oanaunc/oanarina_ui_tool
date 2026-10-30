# Large layer-tree virtualization

The Layers sidebar now uses a cached hierarchy index and a real scroll window for large pages. The implementation is source-only; it does not claim canvas artwork culling, universally fast document derivation, or unlimited whole-app nesting.

## Reachable behavior

The existing File/Layers sidebar automatically windows lists with more than 200 visible rows. It retains the original reversed stored sibling order, including ancestors and the existing search/type/status filter semantics. Auto-layout stacking changes artwork painting, not this navigator's stored order. Smaller lists render all visible rows through the same hierarchy model.

At a logical viewport height H, the window renders approximately `ceil(H / 31) + 14` rows, with at most one additional focused row and one native drag-source row retained. There is a full-height scroll plane for all actual visible layers; offscreen layers are real document layers, not placeholder counts. The browser interaction fixture verifies fewer than 80 rendered layer rows on a valid 20,000-layer page. Canvas artwork and other panels can still have their own DOM and geometry costs.

Rows retain their 31-pixel logical height under UI scale. Long names elide without changing height. ResizeObserver and local scroll measurements use `clientHeight` / `scrollTop`, so 125% sidebar zoom and short/resized windows do not introduce physical/logical coordinate drift. One stable row container is retained when collapse or filtering crosses the virtualization threshold, preserving keyboard focus.

- Up/Down and Home/End select actual visible rows and bring offscreen targets into the scroll window. Shift ranges use complete visible tree order, including offscreen rows.
- Right/Left expand, collapse, enter children and return to parents. Expand/collapse descendants and all existing context-menu actions stay reachable.
- External canvas/native selection expands its ancestors and reveals the selected layer. User search, type and status filters are kept. If they exclude the selection, a notice explains why the row is absent rather than silently changing those filters.
- Native HTML drag/reorder/reparent uses the existing guarded geometry planner, world-preserving transforms, Undo and save path. Only a single drag-source row is pinned while scrolling. Repeated drag-over events on the same source/destination/zone reuse the preflight result; a new context invalidates it.
- Keyboard context menus can return focus to a retained active row. The existing delegated layer-thumbnail behavior remains bounded and cancels on scroll/context/drag as before.

Keyboard rows expose true `aria-level`, `aria-posinset`, `aria-setsize`, selection and expansion state. Filtered sibling metadata describes the complete logical filtered sibling set, not just the mounted window. Visual indentation stops growing after six levels so a deeply nested layer remains readable in a narrow sidebar; its full hierarchy depth is still conveyed by ARIA.

Selection, focus, collapse, filtering and scroll remain view state and do not change the saved document, camera, Undo or `.oui` schema. Actual drag/reparent or existing layer actions retain their normal document history. Hidden and locked layers remain inspectable in the tree. Cached inherited lock and managed-instance ownership control drag availability without repeatedly walking each row's ancestors.

## Context safety

A pending offscreen keyboard focus request captures its current document, page, selection, editor mode, modal, Motion state and Layers tab after its own selection change. A temporary subscription permanently invalidates the request on context transitions, including same-event source/mode/modal/Assets away-and-back cycles. It is disposed after the frame callback, a replacement request or unmount. A new keyboard request can still work normally. The callback does not steal focus after another control receives it. Scroll and resize alone do not invalidate the document context.

Drag context proofs retain the existing source guards and inherited-lock/instance/workspace refusals. Virtualization does not grant new edit permissions or change Motion authoring.

## Linear hierarchy and compatible parsing

`layer-tree-index.ts` builds a map, reversed child lists, preorder, depth and inherited ownership in linear node work. An iterative visible flatten handles collapse and propagates direct name/type/status matches to ancestors in reverse preorder. Ancestor reveal, descendant-container expansion and visible index lookup avoid per-row whole-page searches. Indexing and flattening do not recurse, including a 20,000-node chain.

`visibleLayerRows` uses the same iterative index for existing range/move/rename ordering consumers. Invalid duplicate IDs, missing parents or unreachable cycles produce an explicit local tree diagnostic; a misleading partial hierarchy is not painted.

The `.oui` reader's ancestor validation now uses a node map and proven paths. It keeps per-node settings/flag checks in their original order, including checks on already-proven ancestors. Original missing-parent / cycle failures, page-local duplicate checks, file versions and historical empty-string/falsy root policy remain intact. No acceptance expansion, migration or required metadata field is introduced. Forward, reverse and interleaved 20,000-node chain fixtures count parent reads independently; late missing/cycle failures are atomic.

This is not a claim that all other subsystems can edit/render a 20,000-deep document. Existing canvas rendering, layout derivation, exports, thumbnail depth limits and geometry operations have separate behavior and limits. The actual 20,000-layer UI fixture uses a valid flat page of hidden layers to isolate tree scalability; other browser fixtures exercise visible layered artwork, real drag/reparent, context menus and save/Undo.

## Layer-status comments filter

The existing intersection filter now uses current durable-anchor positions and legacy saved page-position fallback, matching comment pins. Resolved comments still participate. It supports at most 10,000 pins on a page and two million bounding-box candidate intersections per request. Invalid/unavailable world geometry or excessive work produces a local diagnostic and no claimed matching result. Degenerate zero-area transforms contain no inspectable pin area. A comment is not otherwise transferred, duplicated or exported by this filter.

## Verification and status

`tests/layer-tree-index.test.ts` verifies source order, hierarchy/ARIA metadata, inherited ownership, combined filter closure, 20,000-deep iterative work, full-range selection, bounded scroll windows, invalid-tree refusals, legacy empty parent roots and comment intersection/refusal boundaries. `tests/layer-parent-validation.test.ts` independently covers chain orders, operation counts, late errors and reader compatibility.

`tests/e2e/layer-tree-virtualization.spec.ts` exercises a 20,000-layer page with bounded tree DOM, real offscreen keyboard/range selection, external selection/filter notices, nested collapse/expand, real drag plus a scrolled HTML drag-source case, world-preserving reparent/Undo/save, context-menu focus, 125%/resized/sidebar controls and permanent scheduled-focus cancellation with a fresh retry. Existing layer-tree, thumbnail, section and short-sidebar suites are also checked.

Recommend **UI-53-004 implemented** for the named large layer-tree virtualization workflow. Individual native/reference verification remains separate. Other performance requirements and arbitrary whole-app depth remain outside this claim. No build, bundle, app package, release archive or website artifact was produced.

Final isolated verification: **1,851 core checks / 158 files**, editor TypeScript, source MCP TypeScript, **71 source MCP checks**, and **34 focused/adjacent browser checks** (8 new virtualization, 26 existing layer/thumbnail/section/short-sidebar). The existing section test was updated to assert the truthful anchored-versus-legacy pin explanation. Independent helper and parent DOM/focus reviews cleared the final source. The private dev server is stopped after verification.
