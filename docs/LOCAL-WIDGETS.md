# Local widgets

A local widget is a small interactive object on a Design or Whiteboard canvas, backed by a local JSON package you import. This is a **Forma-specific local workflow**, not Figma Widget API compatibility or a community catalog. Other people cannot see or use a widget's state unless you send them the file.

Open **Assets → Local widgets**, **Widgets** in the whiteboard toolbar, or **Local widgets…** in Actions. Import a package, review what it asks for, and install it. Installing, reopening a file and reloading the app never run package code. Code runs when you insert, use or refresh a widget, and at the [extra moments](#extra-runs) a package declares. Actions has a **Widgets** tab that searches installed packages by name, description and ID, and inserts one with the keyboard.

## Package

A package is one JSON file of at most 200 KB, with JavaScript of at most 100 KB:

```json
{"format":"forma-local-widget","version":1,"id":"my.counter","name":"Counter","description":"Counts","permissions":[],"size":{"width":240,"height":130},"resizable":true,"minSize":{"width":180,"height":110},"maxSize":{"width":600,"height":400},"initialState":{"count":0},"code":"..."}
```

`permissions` may include `selection:read` and `page:read`. There is no write or network permission. `minSize`, `maxSize` and `events` are optional. At most 16 packages or 2 MB are installed, in a separate local catalog that is not part of any document.

Each event runs the code once in a new worker, through the same opaque sandbox as [local command plugins](LOCAL-COMMAND-PLUGINS.md), with the same 15-second deadline and message budgets. Code reads its input and returns one update:

```js
const input = await forma.readParameters();
// {event:'render'|'action'|'resize'|'hover'|'timer', action?, value?, hovered?, live?, undo?, state, size:{width,height}}
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

- **Interaction:** Forma places its own transparent buttons over generated widget buttons, following the widget's rotation. A press sends only the action name to a fresh worker. A button's optional `hoverFill` tints it under the pointer in the host, with no guest code running. Each press is one Undo step. If the saved state changed while a run was in progress, its result is refused.
- **Input:** `{type:'input',action,value,placeholder}` draws a field as ordinary layers. Selecting it opens a host-owned text box in place, and Enter or leaving the box sends the text as `value` with that action. Escape discards it. Guest code never touches the box.
- **Properties:** selecting a widget opens a host-rendered panel with its menu, permissions, console, **Refresh widget** and **Convert to layers**.
- **Resizing:** the frame's canvas handles and size fields work when the package allows it, clamped to its limits. Layers are regenerated from the saved view. Code runs once with `event:'resize'` after a resize settles, and its result joins the resize's own Undo step, so one Undo restores the old size and the old view together. If another edit landed first, the result keeps a step of its own, so that edit stays separately undoable. Undo during that short wait cancels the run. After an Undo or Redo that changes the size, code runs again with `undo:true`, and its view shows for the restored size. That run changes neither the document nor the state, and adds no step.
- **State:** state and view are saved on the frame, so they follow Undo, duplicate, copy, paste, page moves and `.oui` save and reopen. A duplicate has independent state. Synchronization means the state, its layers and the saved file stay together on this device. Nothing is shared live between people or windows.
- **Permissions:** grants are per package, shown in the panel, revocable, and end when the app reloads. Replacing a package clears them, and they are never saved in a file. A read without a grant is refused. In a whiteboard, reads return the same redacted layer fields as command plugins.

## Extra runs

`"events"` asks for more moments to run. Each one is listed at review, and each is off unless declared, so existing packages run exactly as before.

```json
{"events":["hover","timer","live-resize"]}
```

- **`hover`:** the pointer entered or left a button or field. Input has `action` and `hovered`. Forma waits at least 100 ms between runs and delivers only the newest hover, so read it as what is under the pointer now, not as a list of every move.
- **`timer`:** return `timer:{delayMs}` from any update, between 500 ms and 60 seconds, and code runs with `event:'timer'` after that delay. Each answer has to ask again, or the timer ends. Four widgets can run timers at once.
- **`live-resize`:** during a handle drag, code runs with `event:'resize'` and `live:true`, up to about ten times a second, with the size the handles show.

These runs produce a **live view**, which is shown on the canvas and in the panel menu but stays out of the document. They add no Undo step, do not mark the file edited, cannot interrupt another gesture and never appear in exports. The next press, refresh or settled resize starts from the live state and commits it as one ordinary Undo step. Otherwise it is gone when the app reloads. If the saved state changes, through Undo for example, the live view is dropped and the next run starts from the saved state.

Each run has 1.5 seconds and a fresh worker, one at a time per widget and four across the window. A press ends a hover or timer run in flight first, so a click never races one. After three failures in a row a widget stops these runs until you use it again, and the console says so. A timer exists only because code asked for one this session, so opening a file starts nothing. It pauses while the window is hidden, a dialog is open or its page is not showing, and it stops when the widget is deleted, the file closes or the package changes.

Package code is never saved in documents. A file opened without its package shows its last generated layers and marks the widget **Not installed**. Installing a package with the same ID makes it usable again, so a package's ID is what links it to saved widgets.

## Limits

There is no remote catalog, automatic update, publishing, widget import from other tools, custom drawing or images. Hover covers buttons and fields, not the whole frame. A timer does not run while the app is closed, and live state is not saved until something commits it. Widgets do not run in Slides: a copy pasted into a deck stays as ordinary artwork. They cannot live inside components, and a document holds at most 512. Text layout is estimated from character counts, so wrapped text can differ slightly from the rendered result. The sandbox is a browser boundary, not an OS sandbox, as described for command plugins. Native WKWebView behavior has not been smoke-tested.

## Validation

`tests/local-widgets.test.ts` covers manifests, refused output, layout, stale results, resizing, conversion, malformed saved widgets, live views and the amended Undo step. `tests/e2e/local-widgets.spec.ts` runs real packages through the real sandbox in Chromium and WebKit: inert import, interaction with Undo, saved state with no code in the file, canvas-handle resizing, menu controls, permissions, DOM and network denial, crash recovery, Actions search, duplicates, removed packages, hover, timers, live resizing, a hanging hover answer and resizing after Undo.
