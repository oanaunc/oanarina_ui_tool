# Oanarina UI Tool MCP

A free local MCP server for the saved `.oui` document you select explicitly. It uses stdio, runs without an account/API key, and opens no network listener. There is no usage charge or subscription in this server. AI hosts and models are separate products with their own terms.

## Standalone download

Current development Mac app users can download `oanarina-mcp.zip` from the app’s MCP help, unzip it, and launch `node /absolute/path/server.mjs --project /absolute/path/Design.oui` with Node.js 22 or newer. All runtime code and licenses are included; no npm installation is needed for that download. No live editor synchronization is claimed.

## Install and connect

Use Node.js 22 or newer and a checkout of this repository:

```sh
npm ci
npm --prefix mcp ci
```

Add this server to any MCP host supporting local stdio servers. Replace the example project path with your `.oui` file. Use absolute paths for both script arguments. Directly launch Node/tsx, as below, so npm's normal progress output cannot enter the protocol stream.

```json
{
  "mcpServers": {
    "oanarina-ui": {
      "command": "node",
      "args": [
        "/Users/oanarinaldi/Desktop/oanarina_ui_tool/mcp/node_modules/tsx/dist/cli.mjs",
        "--tsconfig",
        "/Users/oanarinaldi/Desktop/oanarina_ui_tool/mcp/tsconfig.json",
        "/Users/oanarinaldi/Desktop/oanarina_ui_tool/mcp/server.ts",
        "--project",
        "/absolute/path/My Design.oui"
      ]
    }
  }
}
```

Append `--create` to create an empty document if that exact path does not exist. Without it, an existing valid `.oui` file is required. The directory must already exist. Save changes in the Mac editor before using the server, then reopen the saved file to see MCP edits. Live synchronization with an already open editor is not implemented.

Version-one `.oui` projects can be read and migrate to version two when written. Use the current development editor to reopen MCP-edited files; compatibility with the older public v0.1.0 installer is not claimed.

## Tools

| Tool | Behavior |
| --- | --- |
| `inspect_project` | Document/page metadata, layer counts and current SHA-256 revision |
| `read_nodes` | Search, filter IDs and paginate layers; asset bytes omitted by default |
| `read_document` | Complete JSON, optionally including assets; maximum response 5 MB |
| `read_design_system` | Typed variables, collections/modes, local styles and component sets |
| `apply_operations` | Atomic batches of up to 500 node/page/design-system edits |
| `replace_document` | Validated complete document replacement for advanced model features |
| `undo_transaction` | Restore the previous successful MCP transaction; last 20 in memory |
| `validate_project` | Run the editor's shared document validators |
| `export_svg` | Return SVG for vector/text pages; reject images and browser-raster fills |

The resource `oanarina://project/summary` provides current metadata. Tool schemas are discoverable through MCP. Every write requires a `revision` returned by a read. Stale revisions fail without changing the file.

`apply_operations` supports `rename_document`, `create_page`, `rename_page`, `delete_page`, `create_node`, `update_node`, `delete_node` and `set_design_system`. Nodes can specify an optional unique `id` when created, so children can reference parents created earlier in the same atomic batch. Node `properties` use the shared `.oui` node fields; changing `id` or `type` through an update is rejected. Deleting a frame also deletes its descendants; deleting an owned instance child records a visibility override. Moving a container moves its descendants.

A minimal operation batch, after obtaining the revision and page ID:

```json
{
  "revision": "SHA256_FROM_INSPECT_PROJECT",
  "operations": [
    {"op":"create_node","pageId":"PAGE_ID","id":"card","type":"frame","properties":{"name":"Card","x":100,"y":100,"width":320,"height":200}},
    {"op":"create_node","pageId":"PAGE_ID","type":"text","properties":{"parentId":"card","name":"Heading","x":124,"y":124,"text":"Created locally."}}
  ]
}
```

## File handling and limits

All tools are scoped to the one launch-time project. Tools accept no filesystem paths, shell commands, scripts or eval code. Individual file symlinks are refused, parent directory symlinks are canonicalized at launch, and `.oui` files are limited to 50 MB. Inputs are validated before writes using the same component, variable, prototype and motion validators as the editor. Components and design-system values propagate before saving. Headless text measurements are approximate; review automatic wrapping and size in the Mac app.

Writes use a per-project exclusive lock, a temporary sibling file, fsync and atomic rename. Hashes are checked immediately before committing. The lock coordinates MCP processes, while the Mac editor does not yet participate in it: do not edit the same file concurrently in another app. An external write in the final check-to-rename interval cannot be excluded by the filesystem API. A crash before rename retains the old file; a crash after rename retains the validated new file. Undo history clears when this process ends. A crash can leave `<project>.oanarina-mcp.lock`; verify no MCP process is using the project before manually removing that lock.

SVG output uses the editor's actual vector renderer and escapes text. It never writes a path, fetches URLs or evaluates document content. Image layers, image paints, angular/diamond raster paints are refused so output cannot depend on browser decoding or external assets. Text wrapping uses approximate headless metrics; installed font files are not copied. Project-embedded fonts are included only where embedding is permitted. Responses are capped at 5 MB. Binary `.fig` support and direct Figma cloud control are outside this server.

## Validation and dependencies

```sh
npm run mcp:test
```

Tests cover atomic rollback, stale revisions, concurrent writers, scope/symlink rejection, locks, undo, invalid geometry, design-system cycles, hierarchy edits, deterministic/escaped SVG, and an actual SDK client communicating with the spawned server over stdio.

Uses the current stable official MCP SDK v2 packages (`@modelcontextprotocol/server` and test client `@modelcontextprotocol/client`, pinned to 2.4.0), verified October 29, 2026. Source/API references: [official first server guide](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-server), [SDK repository](https://github.com/modelcontextprotocol/typescript-sdk). Dependencies are locked in `package-lock.json`. The server itself is MIT licensed as part of this repository; dependency licenses remain their own.
