# Local widgets

A local widget is a small interactive object on a Design or Whiteboard canvas, backed by a local JSON package you import. This is a **Forma-specific local workflow**, not Figma Widget API compatibility or a community catalog. Other people cannot see or use a widget's state unless you send them the file.

Open **Assets → Local widgets**, **Widgets** in the whiteboard toolbar, or **Local widgets…** in Actions. Import a package, review what it asks for, and install it. Installing, reopening a file and reloading the app never run package code. Code runs only when you insert, use or refresh a widget. Actions has a **Widgets** tab that searches installed packages by name, description and ID, and inserts one with the keyboard.

## Package

A package is one JSON file of at most 200 KB, with JavaScript of at most 100 KB:

```json
{"format":"forma-local-widget","version":1,"id":"my.counter","name":"Counter","description":"Counts","permissions":[],"size":{"width":240,"height":130},"resizable":true,"minSize":{"width":180,"height":110},"maxSize":{"width":600,"height":400},"initialState":{"count":0},"code":"..."}
```

`permissions` may include `selection:read` and `page:read`. There is no write or network permission. `minSize` and `maxSize` are optional. At most 16 packages or 2 MB are installed, in a separate local catalog that is not part of any document.

Each event runs the code once in a new worker, through the same opaque sandbox as [local command plugins](LOCAL-COMMAND-PLUGINS.md), with the same 15-second deadline and message budgets. Code reads its input and returns one update:

```js
const input = await forma.readParameters();
// {event:'render'|'action', action?, value?, state, size:{width,height}}
let count = Number(input.state.count || 0);
if (input.action === 'add') count++;
await forma.propose({
  state: {count},
  view: {type: 'stack', padding: 12, gap: 8, fill: '#ece6f6', children: [
    {type: 'text', text: 'Count ' + count, fontSize: 18, bold: true},
    {type: 'button', label: 'Add', action: 'add'}
  ]},
  menu: [{type: 'action', label: 'Reset', action: 'reset'}]
});
```

A view uses only `stack`, `text`, `button`, `box` and `input`, with at most 200 nodes and 8 levels. Forma lays it out and generates ordinary layers from it. Guest code supplies data, never markup or event handlers. State is at most 32 KB of plain JSON, and a view at most 64 KB. A menu has at most 12 `action`, `toggle`, `choice`, `color` and `separator` items. `forma.log` writes to a bounded console in the widget panel.

## On the canvas

- **Interaction:** Forma places its own transparent buttons over generated widget buttons. A press sends only the action name to a fresh worker. Each update is one Undo step. If the saved state changed while a run was in progress, its result is refused.
- **Input:** `{type:'input',action,value,placeholder}` draws a field as ordinary layers. Selecting it opens a host-owned text box in place, and Enter or leaving the box sends the text as `value` with that action. Escape discards it. Guest code never touches the box.
- **Properties:** selecting a widget opens a host-rendered panel with its menu, permissions, console, **Refresh widget** and **Convert to layers**.
- **Resizing:** the frame's canvas handles and size fields work when the package allows it, clamped to its limits. Layers are regenerated from the saved view. Code receives the new size with its next event but does not run on each resize.
- **State:** state and view are saved on the frame, so they follow Undo, duplicate, copy, paste, page moves and `.oui` save and reopen. A duplicate has independent state. Synchronization means the state, its layers and the saved file stay together on this device. Nothing is shared live between people or windows.
- **Permissions:** grants are per package, shown in the panel, revocable, and end when the app reloads. Replacing a package clears them, and they are never saved in a file. A read without a grant is refused. In a whiteboard, reads return the same redacted layer fields as command plugins.

Package code is never saved in documents. A file opened without its package shows its last generated layers and marks the widget **Not installed**. Installing a package with the same ID makes it usable again, so a package's ID is what links it to saved widgets.

## Limits

There is no remote catalog, automatic update, publishing, Figma widget import, custom drawing, images, input fields, hover, timers or background work. Widgets do not run in Slides: a copy pasted into a deck stays as ordinary artwork. They cannot live inside components, and a document holds at most 512. Text layout is estimated from character counts, so wrapped text can differ slightly from the rendered result. Hit targets follow the bounding box of a rotated widget. The sandbox is a browser boundary, not an OS sandbox, as described for command plugins. Native WKWebView behavior has not been smoke-tested.

## Validation

`tests/local-widgets.test.ts` covers manifests, refused output, layout, stale results, resizing, conversion and malformed saved widgets. `tests/e2e/local-widgets.spec.ts` runs real packages through the real sandbox in Chromium: inert import, interaction with Undo, saved state with no code in the file, canvas-handle resizing, menu controls, permissions, DOM and network denial, crash recovery, Actions search, duplicates and removed packages.
