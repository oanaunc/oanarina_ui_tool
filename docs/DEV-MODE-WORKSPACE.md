# Dev Mode workspace

The **Dev Mode** toolbar button, the Inspect tab and the Inspect command all enter one workspace. A green bar marks it, states that artwork is read-only and counts layers marked ready or completed. **Exit Dev Mode** returns to Design.

The toolbar drops to Move, Hand, Scale and Comment, with Motion, Actions and resources still available. The right panel holds the existing handoff list, annotations, Inspect properties, platform properties, spacing, asset download, developer resources, Code Connect and the code generator list.

## What read-only covers

- **Canvas:** dragging a layer, resize and rotate handles and double-click editing do nothing. Selection and marquee still work. A placement click with a creation tool only returns to Move.
- **Keyboard:** arrow nudges and number-key opacity are ignored.
- **Commands:** Object, Vector, Arrange, Text and Page commands, creation tools, cut, paste, duplicate, delete, rename, import and placement refuse from menus, Actions and shortcuts with a visible message. Text find, view, zoom, navigation, copy, export and file commands still run.

Handoff status, annotations, comments, developer resources and Code Connect stay editable because they are the purpose of the workspace. They keep their own guards and one Undo step each. Undo and Redo stay available so those edits can be reversed.

## Limits

This is a local inspection workspace. There are no seats, permissions, shared handoff or cloud libraries. See [VS Code integration](VSCODE-INTEGRATION.md) for the editor path.

The Layers panel disables its visibility and lock toggles and inline rename in Dev Mode. Every editor edit also passes one store check, which refuses any change outside handoff metadata (annotations, developer resources, status, comments, Code Connect and export settings), so a dialog cannot change artwork either. Read-only protects the open editor, not the file on disk: an MCP write or another app can still change a saved file. Native and reference acceptance are pending.

`tests/e2e/dev-mode-workspace.spec.ts` covers the workspace, reduced tools, unchanged document bytes across canvas gestures, keyboard and command refusal, and metadata edits with Undo.
