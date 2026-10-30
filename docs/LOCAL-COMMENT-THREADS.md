# File-local comment threads

Forma supports file-local canvas feedback. This is a shared local editing identity, not an account or authenticated author. Anyone who can edit the file can edit, resolve, reopen or delete its threads. Collaboration accounts, permissions, mentions, notifications, public thread links and remote synchronization remain outside this implementation.

## Reachable workflows

- Press C and click the Design canvas to open the composer. Choose a local display name and write a comment. A click on artwork can anchor the pin to that layer's local axes; clicking empty canvas creates a fixed page position. New threads do not require an anchor.
- Open **View → Comments**, or activate an unresolved canvas pin by pointer, Enter or Space. The file-wide list identifies the page, author, creation time, optional edit time and thread state. Legacy notes explicitly show unknown author / time not recorded.
- Edit the original message or a reply, post/delete replies, resolve/reopen, or delete a local thread. Each successful document change uses the normal one-step Undo/Redo and `.oui` save/reopen path. Editing preserves the original author and creation time; local names apply only to future messages. The display name lasts for this editor session and is not a profile or cloud account.
- Filter all, unresolved or resolved threads; filter authors anywhere in a thread; search page names, authors and message text. Thread results and replies have keyboard-accessible paging. A selected pin opens the result page containing its thread.
- **Jump to comment** navigates to the saved page and centers the current affine world position without editing the document or its Undo history. It returns to the base Design canvas and closes Motion; the comment does not rewrite authored animation.
- Copy an individual original message or reply as plain text. Browser clipboard denial exposes a readonly field containing the actual text, selected for standard Command-C. The Mac shell's ordinary text selection clipboard path can be used; no custom native IPC permission is added. The button does not fabricate layer/SVG clipboard formats. Native acceptance remains a separate check.

The dialog provides a named modal, list/thread structure, real labels, visible authors and semantic `time` elements, keyboard focus containment and Escape return to the opener or canvas. Enter/Space on owned controls do not finish a canvas Pen gesture or start panning. Editing is disabled in Inspect, Motion and Slides; file-local text can still be read. Source/document/page/mode/selection/modal changes invalidate drafts immediately, including same-event away-and-back cycles. Closing and reopening permits a new reviewed draft.

## Optional compatible metadata

Existing `.oui` 1/2 comments keep their original `id`, finite `x/y`, literal `text` and `resolved` fields. Opening or saving an untouched legacy note does not fabricate an author, time, reply array or anchor. Version 1 migrates through the existing version-2 reader without a new required schema.

Optional additions on a comment:

```
author?: string
createdAt?: string
editedAt?: string
replies?: { id, text, author, createdAt, editedAt? }[]
anchor?: { nodeId, x, y }
```

Names are plain text, trimmed, 1–120 characters, without control characters. Bodies are plain text up to 20,000 characters. A thread supports 200 replies and 200,000 total original/reply text characters. Extended threads are bounded to 2,000 per page / 10,000 per file, with 100,000 total replies. Identifiers, dates, anchors, finite coordinates, duplicate extended identities and unknown reply/anchor fields are validated before a loaded document or file is changed. Shared validation applies to editor edits, file import and source MCP replacement.

Legacy metadata-absent notes retain the earlier structural acceptance policy, including old text lengths and literal positions. A long legacy body shows a bounded preview; explicitly saving a reviewed edit replaces the full old text with that draft. Ambiguous legacy identities are displayed without targeting a particular duplicate for writes. Extended metadata cannot reuse such an identity. No permission is inferred from a matching display name.

## Geometry and lifecycle

A cached map resolves node-local anchors through actual parent rotations, reflection and nonuniform scale. Layer resize, transform and same-page reparenting update the displayed position without rewriting the saved comment. New anchors on collapsed or unavailable transforms fall back to a fixed page position. Existing anchors can follow a collapsed position without requiring an inverse.

If the referenced layer is deleted, moved to another page or removed by an instance swap, the thread remains on its original page and explicitly uses its original saved page position. It does not follow an unrelated layer or silently relocate the discussion to a different page. Page duplication creates fresh thread/reply identities and remaps anchors to the copied same-page layers. Authors, timestamps and literal message text are retained. Components and instances do not inherit page discussions.

Anchor traversal allows 1,024 ancestors and 100,000 cumulative chain steps per lookup. An unresolved or unavailable anchor uses its saved position. Display/jump refuses nonfinite or world coordinates outside ±10,000,000 while preserving the source data. Pins are overlay feedback, not painted artwork and not clipped by the referenced layer. Only unresolved pins in the first 2,000 source comments on a page are rendered; resolved threads remain available in the list. Overlapping pins do not have a collision-avoidance layout.

The list indexes at most 10,000 threads, shows 24 threads per result page, and 20 replies per reply page. Legacy identity inspection visits at most 50,000 entries per page; if incomplete, every indexed thread on that page is conservatively read-only and a diagnostic explains the limit. The bound counts visited entries, including repeated IDs. Search scans a bounded two million body characters per query and reports when additional text may match. Long legacy bodies display at most 20,000 characters; the Copy button/manual-copy field is bounded to one million characters. Larger legacy files remain readable without pretending the bounded list searched or rendered every item.

## Privacy and interchange

Comments are private **file content**, not encrypted content. Sharing or saving the original `.oui` file includes its threads and local names. The explicit file-scoped MCP `read_document` and validated `replace_document` operations retain ordinary authorized comment text. Default `assetsOmitted` reads redact embedded assets; they are not a text/privacy redaction promise. No new remote fetch, comment-specific MCP command or server permission is added.

Layer clipboard payloads, local component-library publication packages and artwork SVG/PNG exports omit page discussions. A library snapshot forged to contain comments is refused. Direct page duplication inside a document retains discussions deliberately.

Editable Figma Bridge validates optional comment metadata before Figma mutations, then omits threads with a generic report. The report contains no author, body or private thread ID. Bridge mocks do not establish a real Figma desktop round trip. Frozen distributable archives were not regenerated.

## Source verification and status recommendations

`tests/comment-threads.test.ts` covers version compatibility, real store history, malformed/cumulative atomic refusal, signed affine anchors, cached lookup limits, page duplicate remapping, all-page filters/search bounds, ambiguous legacy IDs, clipboard/library/SVG privacy, Bridge preflight/omission and source-MCP replacement/Undo. `mcp/tests/comment-threads.test.ts` exercises the real source stdio tools, default scoped read, artwork export omission and malformed-write atomicity.

`tests/e2e/local-comment-threads.spec.ts` covers the actual composer, author/time display, original/reply edits, save/reopen, status/author/reply search, Undo, cross-page navigation, keyboard pins, text copy and its denied fallback, retained-handler context races, malformed Open, 125% compact modal controls, anchor lifecycle, read-only modes and bounded paging.

Recommend implemented for the named **file-local** behaviors UI-36-003/004/005/007/011/012/013/014/019 and UI-44-023. The overall comments/collaboration domain remains partial because authenticated authors, permissions, remote collaboration, mention/notification and public-link behaviors are absent. Native and reference-verification statuses remain separate. No finished Figma parity or remote collaboration claim is made.

Final isolated source checks: **1,840 core tests / 156 files**, editor TypeScript, source MCP TypeScript, **29 browser checks** (15 new threads + 14 existing page/accessibility cases), and **71 source MCP checks**. Independent read-only review cleared the final pin proof, bounded identity scan, reply deletion, legacy preservation, graph lifecycle and privacy boundaries. No app/package/archive/native builds were run.

The explicit Export for Figma download also strips whole local threads before serializing the delivery clone. Ordinary .oui saves and authorized project-scoped MCP reads retain them. This is independent of the Bridge preflight, which still validates and reports omission when a user imports an ordinary project file directly.
