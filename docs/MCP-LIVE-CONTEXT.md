# MCP and the open editor

This is **partial, file-based coordination between the free local MCP server and an open Forma Mac window**. It is not a live collaboration channel. It opens no network listener, adds no renderer-to-shell message type and accepts no request from outside the app. The saved `.oui` file stays the only thing MCP writes.

## Saved-file synchronization

Each second the shell compares the bound file's identity, size and modification time, and only on a change reads and hashes it. It skips the check while a save is running, a sheet is open, or `<project>.oanarina-mcp.lock` exists, so a writer's transaction is never read half-way.

| Window state | What happens |
| --- | --- |
| No unsaved changes | The file replaces the window's document as one Undo step. Page and surviving selection are kept. The window stays clean and the file becomes the new save baseline. |
| A field has focus, a pointer is down, or Motion, a dialog or Home is open | Reload waits and retries about every three seconds. |
| Unsaved changes | The edits stay. A notice appears once. Save still offers Cancel, Save As or Overwrite. Returning to a clean state, by Undo for example, then adopts the waiting file. |
| Malformed file, or another document's identity | Refused with a notice. The window does not change. |

Limits: sync runs one way, from the saved file into clean windows. MCP tools never see unsaved editor state through the file. Latency is one to four seconds. Only the Mac shell does this; the browser preview and Electron groundwork do not.

## Sharing live context

Reading the selection or a screenshot needs an explicit opt-in per window: **Resources → Share Live Editor Context with MCP**. The window must be bound to a saved file. A consent sheet states what is shared, including unsaved changes. The setting belongs to the window session, never to the `.oui` file.

While on, the shell pulls a small state object from the renderer once a second and, only if the document, page, selection or viewport changed, publishes `<project>.oanarina-live.json` beside the project:

- document and page identity and names, selected layer IDs, viewport, dirty flag and saved SHA-256 revision;
- a WKWebView snapshot of the window, including editor panels, at most 1,600 pixels wide;
- the current selection, or the page with nothing selected, rendered by the editor as PNG at one pixel per unit, with a 4,096-pixel longest side and a 16-million-pixel limit.

The file is mode 0600, replaced atomically, created without following links, and bounded to 24 MB. Forma never reads it back, so it cannot become a way to control the app. Turning sharing off, changing the window's file or closing the window removes it. A crash can leave it behind; the reader then treats a dead publisher as sharing being off, and the file stays until the project is next shared or it is deleted by hand. It can include private artwork, so a synced folder syncs it too while sharing is on.

| Tool | Returns |
| --- | --- |
| `read_live_editor` | Page, selection resolved against the saved file (each flagged `inSavedFile`), viewport, dirty flag, `matchesSavedFile`, capture time |
| `read_live_screenshot` | MCP image content of the latest window snapshot plus capture details |
| `export_live_artwork_png` | MCP image content of the editor-rendered selection or page plus capture details |

All three fail with a clear message when sharing is off, Forma is not running, the sidecar is malformed or belongs to another document. The reader treats the sidecar as untrusted: strict field and size validation, no link following, and canonical base64 with a PNG signature check.

Limits: read-only, so an agent cannot change the selection. Output is the latest publication, not an on-demand capture; `capturedAt` says when. A minimized window or background tab publishes without a screenshot. Raster export needs an open opted-in editor because the server has no renderer of its own, and it covers only the current selection or page at 1×. The standalone `oanarina-mcp.zip` does not include these tools until it is rebuilt.

## Why a file

A socket or request channel would give the running app a new externally reachable surface, and the project rule is never to open another port or broaden native IPC. The shell therefore pulls from its own renderer through the existing page-world call path and writes one fixed sibling path that the renderer never sees or chooses. If a later decision allows a real local channel, on-demand capture, selection writes and unsaved-state reads become possible; none of those is claimed here.

## Validation

`mcp/tests/live-context.test.ts` covers parsing and refusals, dead publishers, foreign documents, planted links, oversized files and real stdio image content. `tests/desktop-native.test.ts` and `tests/e2e/mac-integration.spec.ts` cover reload decisions and renderer output. The actual cross-process path runs in `FORMA_SMOKE_REPO=/path/to/repo build/Forma.app/Contents/MacOS/OanarinaUITool --integration-smoke-test`: a separate Node process commits a real transaction that appears in the open window, and reads the published selection and screenshot back. Tested on one Mac only. No test uses a real MCP host application.
