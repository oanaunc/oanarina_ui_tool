# File information and description

Choose **File → File information…**, or find **File information** in Actions. The dialog shows the current file name, project ID, workspace, `.oui` format version, total pages/layers and the document's actual last-change timestamp. It does not invent a creation date, author, cloud owner, storage location or filesystem path. The project ID is read-only selectable text.

The optional description is plain multiline text up to **10,000 UTF-16 code units** (the same length limit used by the textarea). Text such as HTML, Markdown or URLs stays literal; there is no rich formatting or automatic link execution. Tabs and line breaks are allowed. NUL, other C0 controls except tab/CR/LF, DEL and C1 controls are refused. Editing normalizes CR/CRLF line endings to LF and preserves other nonempty text, including leading/trailing spaces.

**Save description** makes one document edit, with Undo/Redo and the normal dirty/recovery behavior. **Clear description** only clears the draft; saving empty or whitespace-only text removes the optional field. Cancel, Escape and closing the dialog discard uncommitted drafts. Unchanged submissions do not add history or change the timestamp. Imported CR/CRLF or whitespace-only descriptions remain untouched until an explicit edit or Clear; merely opening the dialog does not enable saving a normalized value. If the file identity or stored description changed while a draft was open, its save is rejected instead of overwriting newer data. Renaming remains available through the existing Rename file action.

## Compatibility and persistence

`DesignDocument.description?:string` is optional within the existing `.oui` v2 format. Older v1/v2 documents without it still open without a migration or invented default. Shared document parsing validates incoming values before import/replacement. The UI validates before editing; the shared metadata validator can also run in the store's final validation pipeline.

Portable `.oui` saves/open, local recovery, named snapshots and local project duplication preserve the field through their existing whole-document paths. Restoring a snapshot that predates description removes the newer optional field, with Undo available. This is a targeted description fix; restoration of other optional document keys is unchanged. It is distinct from local Home folder/archive/star metadata. SVG, PNG and other artwork exports do not carry a project description. The current Figma Bridge has no mapping to a Figma file description and reconstructs its document on export; **do not rely on a Figma round trip preserving this metadata**. Direct binary `.fig` support remains unavailable.

The existing free saved-file MCP keeps nine tools and the same file/revision/lock boundary. `inspect_project` includes `description` only when present. `read_document` preserves description prose even if it begins with a `data:image/` string; nested description keys and actual image/font assets are still redacted unless assets are requested. Only the validated top-level description is exempt. `replace_document` uses shared validation and can edit or remove description with the normal revision and Undo guarantees. No new metadata write operation, native IPC, clipboard permission or arbitrary path access was added.

## Validation

- `tests/document-metadata.test.ts`: legacy compatibility, literal Unicode text, serialization/duplication, bounds/control rejection before mutation, line ending/empty normalization, stale snapshot refusal and editor no-op/Undo behavior.
- `tests/e2e/file-information.spec.ts`: File menu and Actions, actual facts/read-only ID, unchanged project/history, literal multiline editing, explicit portable save/open plus recovery reload, Cancel/Escape, saved clearing with Undo/Redo, UI length cap and invalid imports preserving the current project.
- `mcp/tests/document-metadata.test.ts`: actual stdio tool schema/count, optional metadata, read/redaction behavior, on-disk replace, malformed/oversized/stale refusal without byte/revision changes and Undo of clear/replacement.

Native WKWebView window acceptance remains separate while the Mac is locked.
