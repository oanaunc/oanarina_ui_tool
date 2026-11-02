# Spec pages

A spec is a page of blocks that lives on the canvas as one layer. Layers lists it as a Spec, with its own icon.

## Making and opening one

- **New spec.** Open the Text tool menu and choose Spec, then click the canvas. A page 850 wide opens, ready to type. Drag instead of clicking to choose its width and starting height.
- **Open.** Double-click a spec, press Return with it selected, or use Edit in the Inspector.
- **Close.** Press Escape or click outside it.

An open page saves as you pause. Undo afterwards takes the whole editing session back in one step. Inside the page, Undo walks back typing and block changes.

## Blocks

Type `/` for a menu of blocks and keep typing to filter it. Arrow keys and Return choose, and Escape leaves.

| Block | Type at the start of a line |
| --- | --- |
| Heading 1 to 6 | `#` to `######`, then a space |
| Bulleted list | `-`, `*` or `+`, then a space |
| Numbered list | `1.`, then a space |
| To-do | `[]`, then a space |
| Quote | `>`, then a space |
| Code | three backticks |
| Divider | `---` |
| Toggle, Table, Image, Frame | Slash menu only |

Inside a line, `**bold**`, `*italic*`, `~~strike~~`, `` `code` `` and `[links](https://example.com)` show as formatting once the caret leaves the line. Command-B, I, E, K and Shift-Command-S add them.

- Return starts a new block, and lists continue. Shift-Return starts a new line in the same block.
- Backspace at the start of a line removes its style first, then joins it to the line above.
- Tab and Shift-Tab indent list items.
- Shift-Command-Up and Down move a block. So does dragging the handle that appears beside it.
- Click that handle to turn a block into another kind, duplicate it or delete it.

## Toggles

`/toggle` makes a line with an arrow that opens and closes the blocks it holds. It starts open, with the caret on its title.

- Click the arrow, or press Command-Return in the title, to open or close it. The state saves with the page, and closed blocks don't paint on the canvas or show in exports.
- Return at the end of an open title goes to the first line inside. Return in a closed title starts the next toggle, and Return in an empty one turns it back into a line.
- Tab moves a line into the toggle right above it. Shift-Tab moves it back out, once a list item has no indent left.
- Shift-Command-Up and Down, and dragging a handle, move blocks in and out. Dragging right of the line under a toggle's last block keeps the block inside.
- Backspace at the start of a title turns the toggle into a line, and what it held stays on the page below it.
- Toggles nest up to 8 levels, and everything inside them counts towards the page's 4,000 blocks.
- To open or close a toggle, open the page first. An arrow on the canvas is only painted.
- Command-A selects the block's words. Press it again to select every block, then copy as Markdown or delete.

## Live frames

`/frame` lists the frames in the file, current page first. An embedded frame is a reference, so it repaints when the frame changes and the page resizes with it. If the frame is deleted, the block says so. Specs do not show inside each other.

Frames come from the open file only. Boards and other files can't be embedded.

## Markdown and agents

Copy as Markdown in the Inspector gives the page as plain Markdown, and pasting Markdown on a plain line makes blocks. Inspect shows the same Markdown. A toggle is a `<details>` element with a `<summary>` title, and `<details open>` when it's open, which is also what an agent reads and writes.

A local agent reaches specs through Forma's MCP server, which runs on your Mac over stdio with no network. `read_spec` lists specs or returns one as Markdown, and the `update_spec` operation replaces a page from Markdown. Embedded frames appear as `forma://layer/<id>` links, and those IDs work with `read_nodes`. Images appear as `forma://image/<id>`, without their bytes. Keep those references in an update to keep the blocks they point at.

## Outputs

SVG, PNG, JPG and PDF export render a spec as artwork, including live frames. Generated code uses its text and boxes, without frames.

## Limits

- Selecting text stays inside one block. To take several, select every block with Command-A twice.
- Code blocks have no syntax coloring.
- A spec can't hold other layers. Put layers in a frame and embed it.
- Files holding a spec open only in Forma 1.0.2 or later. Builds up to 1.0.3 refuse a spec with a toggle in it.

Each block's words live in the `.oui` file as block data, and what the canvas paints is derived from them. See `src/spec.ts` and `src/spec-layers.ts`.
