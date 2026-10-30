# Local development handoff

Forma’s Inspect sidebar includes **Development handoff** for the current page and exactly one selected layer. The page actions menu can open this panel. Choose **Ready for development**, **Completed development**, or **No development status**. Page and layer status are independent. Each real change is one Undo operation, saved in .oui versions 1 and 2. A status records the author’s local handoff decision; it does not verify that code has been implemented.

The expandable **Handoff list across pages** searches marked names, page names, kinds, statuses and hidden/locked/managed state. Filter ready/completed items and scope to sections, pages or layers. Only 50 results render at once. Showing a page or layer navigates the actual document without changing status, visibility, lock state, document history or layer content. Hidden and locked layers remain navigable in Layers. The Layers panel has shared ready/completed filters and accessible status badges; pages also expose status badges.

## Metadata and compatibility

Optional `developmentStatus` on pages and nodes accepts exactly `none`, `ready` or `completed`. Absent legacy data stays absent unless authored. An explicit enum is authoritative, including `none`. A section without the enum falls back to its existing `readyForDevelopment` boolean. New section status edits maintain the compatibility flag; the existing section checkbox clears the explicit enum when it changes the legacy flag, so it remains usable. Resetting a page removes its enum. Resetting a previously marked layer stores explicit `none`, which can override an inherited component status.

Status is nonvisual metadata valid on every node kind. An authored section-to-other-kind conversion preserves effective status and removes its unchanged section-only compatibility flag in the same transaction. Malformed imports are not normalized this way. Clipboard-selected nodes and component dependencies retain status; ancestor ghost groups retain rendering context but omit unrelated handoff metadata. Page duplication retains page and node status in the copied graph. Source component status changes propagate normally to linked instances; instance roots may own explicit status overrides, and the existing override reset restores inheritance. Generated/managed instance children are read-only through these controls.

Updates refuse inherited locks and managed-child ownership. Page status remains editable independently of locked layer content. Motion must be closed before editing or navigating handoff items. Originating document, page, selection, mode and session are rechecked; same-event away/back retained callbacks cannot apply stale changes. Read-only search/filter/pagination does not edit the document.

The list refuses documents exceeding 100,000 pages plus layers and hierarchies deeper than 256 ancestors. These are inspection limits, not new global file-model limits. A visible diagnostic replaces an unsupported list; no partial list is presented as complete. Existing per-page/model and file-size validation still applies.

## Interchange limits

Shared imported-file validation rejects malformed enums before publishing a document. Source MCP node create/update accepts the optional field with normal metadata validation and guarded layer status updates; page status can be preserved through source project replacement. This adds no filesystem permission or developer-service endpoint. Editable Figma Bridge import validates page/node statuses before creating pages and explicitly omits them. A purely local status override does not require flattening an otherwise supported linked instance. Bridge tests use API mocks; no native Figma developer-status API or desktop round trip has been verified.

No cloud handoff synchronization, assignments, developer annotations, resource backend, Code Connect, external completion check, or native assistive-technology acceptance is claimed. These remain separate workflows.

## Verification

Headless cases cover legacy absence and .oui1/2, explicit/fallback precedence, invalid-import atomicity, no-op history, Undo/reset, locks and managed children, source/instance overrides and reset inheritance, page copying, clipboard ghost cleanup, section conversion and bounded cross-page indexing. Browser checks exercise the actual page context menu and Inspect controls, ready/completed layer filters/badges, local list search/scope/pagination, cross-page hidden/locked navigation, retained callbacks, genuine download/file-chooser save/reopen and compact 125% UI. Focused source MCP and Bridge cases validate persistence, omission and refusal paths. Native builds and release packages were intentionally excluded under the user’s source-only freeze.
