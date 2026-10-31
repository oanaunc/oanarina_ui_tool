# Recovery and reliability

Everything here stays on this device. The repository document remains the source of truth; each layer below can fail on its own without affecting a normal open.

## Persisted Undo

Undo and Redo survive a reload, crash or window close. The stacks are stored as layer-level patches (`src/edit-history.ts`), so a one-layer edit on a 20,000-layer page costs about a kilobyte rather than a copy of the file. The record is written in the same transaction as the recovery copy, so a crash cannot leave document and history disagreeing.

Bounds: 60 steps, 12 MB in total, 6 MB per step. The newest steps are kept and a chain never skips a link, so a very large step ends what can be restored beyond it. At most 40 ms per save goes to encoding new steps; later saves extend the chain. Restoring validates every step with the full document validators, yielding between steps, and stops at the first bad one. A record whose content digest does not match the opened document is ignored. If history alone exceeds quota, it is dropped and the document still saves. An explicit file open starts a fresh history. In-memory Undo still holds 100 steps, so older steps do not survive a reload.

## Write-ahead journal

Between autosaves, a small note in `localStorage` records the patch from the stored revision to the current one, normally within about 60 ms of an edit. After a crash, it replays only onto that exact stored revision, as one Undo step, with a notice. A stale, invalid or foreign note is discarded. Notes over 2 MB are not written; the last autosave then applies. A journal is ignored while another live window has the file.

This narrows the loss window; it does not eliminate it. Edits inside the throttle window, oversize edits, and anything lost when the operating system or machine itself fails can still be lost. Keep `.oui` backups.

## Damaged files

A stored file that fails validation opens **This file could not be opened** at startup, from Home, or from File → Storage and recovery. The stored record is never changed. Options create new files: the newest named version as a copy, or a repaired copy that keeps each page, layer, comment and setting passing the full validators, lifts orphaned children to the page, and reports what it removed. The raw data can be downloaded. Home skips records too malformed to display, and Storage still lists them.

File → Open of a damaged `.oui` reports a fixed category without source text and, when the JSON is a supported Forma project, offers **Open a repaired copy**. Malformed JSON and unknown versions are not repairable. The Mac file bootstrap and document-open paths use the same fixed categories.

## Storage reporting

File → **Storage and recovery…** shows device usage against quota, whether the browser has marked storage durable, and measured sizes for files, embedded assets, versions, branches and persisted Undo. *Clear Undo history of closed files* removes convenience data only. Durable storage is requested only by an explicit button because the browser may prompt.

A notice fires once per level at 80% and 95%, re-arming when usage falls, checked at startup and at most once a minute after saves. A failed write reports that storage is full rather than a generic error. Forma has no separate decoded-image cache to manage; embedded images are part of each file, so they are reported, not purged.

## Several windows

Each window holds a Web Lock for its document, and a second window is told the file is open elsewhere. The note clears when the other window closes or crashes, because the browser releases its lock. BroadcastChannel carries save notices. `saveDocument` then compares the stored revision with the one this window last saw, inside the write transaction, so a stale window never overwrites newer work, including a clean window flushing on close. With neither API, the comparison still protects the data and the conflict appears on the next write.

The conflict banner offers **Load the newer version**, **Keep mine as a copy** (this window continues on a new file) or **Overwrite with this window**. Nothing is merged and there is no live synchronization. The Mac app already focuses an open document instead of duplicating it, so this path is a safeguard there; the conflict flow itself is validated in the browser build.

## Renderer failure

When the Mac renderer process dies, the same window reloads through the normal navigation and reopens its document from recovery. More than three failures in 60 seconds pause on a Try Again sheet. `--renderer-restart-smoke-test` kills the real WebContent process and checks window, document and a fresh editor. A render exception shows Reload, Restart in safe mode and Save a .oui backup, and writes one last recovery copy only if the state still validates. In a browser, a crashed tab is reloaded by the user, and the journal and history apply on the next start.

## Safe mode

Help → **Restart in safe mode**, `?safe-mode=1`, the crash screen, or two failed starts within ten minutes start without reopening the last file. Fonts are not loaded, plugins stay off, and persisted Undo and journals are not replayed. A start counts as failed when its marker survives without a clean exit or a settled three seconds; Web Locks distinguish dead starts from windows still starting, and quick reloads never count. An explicitly opened file still opens. Safe mode's empty placeholder is not saved, so **Restart normally** returns to your file. Preferences and the document model are not reset.

Validation: `tests/edit-history.test.ts`, `tests/crash-journal.test.ts`, `tests/document-repair.test.ts`; `tests/e2e/recovery-reliability.spec.ts` uses real `Page.crash` renderer kills, real second windows and simulated quota errors; `tests/e2e/startup-safety.spec.ts` covers repair, safe mode, start loops and native-bootstrap shims. Native: `--smoke-test`, `--lifecycle-smoke-test` and `--renderer-restart-smoke-test` on an arm64 development build. The journal replay and the conflict banner have not been driven inside WKWebView, and quota behavior uses simulated errors rather than a full disk.
