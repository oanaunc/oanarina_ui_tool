# MCP undo, fonts and command-line automation

These are source features of the free local server. The frozen `oanarina-mcp.zip` does not include them until it is rebuilt.

## Durable Undo

`undo_transaction` now survives a server restart. Before each successful transaction, the server writes the replaced file to a private hidden folder beside the project, `.<name>.oui.oanarina-mcp-history`, then records it in a manifest. The folder is mode 0700 and its files 0600. History holds the latest 20 transactions and at most 250 MB, always keeping the newest; a single entry is bounded by the 50 MB project limit.

An entry can be undone only while the project is byte-identical to that entry's result. After a Forma save or any other external change, `undo_transaction` refuses and leaves the file alone, because undoing would discard work the history never saw. The next transaction starts a fresh stack from that state. Multi-step Undo keeps working across restarts.

Failed, stale and no-op transactions record nothing. A failed history write aborts the transaction. A crash between recording and the atomic file replacement leaves the older stack usable. Missing, malformed, tampered, linked or foreign history refuses Undo and never touches the project; a bad manifest is replaced by the next successful transaction.

`read_undo_history` reports the count, size, timestamps and availability, never content. `clear_undo_history` permanently deletes the retained copies and does not change the project.

The hidden folder holds older versions of the design, including content later deleted from it. It moves with the folder, syncs with synced folders and is included if the folder is shared. Use `clear_undo_history` before sharing a folder. There is no MCP Redo.

## Installed fonts

`list_installed_fonts` lists family names and styles from fonts in the standard folders of the machine running the server: `/System/Library/Fonts`, `/Library/Fonts` and `~/Library/Fonts` on macOS, with fixed equivalents for Windows and Linux. It reads only font directories and `name` tables, for `.ttf`, `.otf`, `.ttc` and `.otc`, up to 20,000 files. It takes no path, follows no link and returns no file location or font bytes. Names starting with a period are hidden system faces. `includeDocumentUsage` adds each family the saved project uses, with whether it is installed or embedded.

Results are held for five seconds. macOS on-demand fonts and legacy `.dfont` files are not listed, so the list can differ from Font Book. A listed font is not a license to embed it. Runtime tested on macOS only.

## Command-line automation

`mcp/automation.ts` gives shell scripts the same project transactions without an MCP host:

```sh
node mcp/node_modules/tsx/dist/cli.mjs --tsconfig mcp/tsconfig.json mcp/automation.ts --project /absolute/Design.oui inspect
```

Commands are `inspect`, `validate`, `read-nodes`, `apply`, `undo`, `undo-status`, `fonts`, `live` and `export-svg`. `apply` reads a JSON array of operations from standard input, validated by the same schema as `apply_operations`, and requires `--revision`. Results are JSON on standard output; failures are JSON on standard error with exit status 1. It uses the same locks, revision checks and Undo history as the server, opens no listener and accepts no scripts or evaluated code.

This is a source-checkout command-line interface. There is no installed binary, stable versioned API promise or in-app scripting host.

## Validation

`node scripts/test-mcp-source.mjs` runs `mcp/tests/undo-history.test.ts`, `installed-fonts.test.ts` and `automation.test.ts` with the rest of the source suite, including real restarted stdio servers and spawned command-line runs.
