# Code layers

A code layer is an additive `type:'code'` node holding your own HTML, CSS and JavaScript. Choose **Code layer** in the toolbar (or `tool-code` in Actions), click for a 400 × 300 block or drag to size it. The code dialog opens straight away. Double placement and the panel's **Edit code** both reach the same dialog.

This is a Forma-specific local feature. It is not Figma Sites or Figma Make code layers, no reference verification has been done, and nothing here is an agent feature.

## What runs, and when

The dialog edits four tabs: HTML, CSS, JavaScript and Properties. **Run code** composes one document from them and shows it in a live frame sized to the layer. **Save code and preview** writes the source, values and a freshly captured preview in one Undo step.

Code from a file never runs on open, reload, import, paste or selection. The only automatic run is the built-in starter template, whose text Forma wrote itself. **Run code** approves that exact source for the rest of this session, in memory only. After that, property controls may re-run it off-screen to refresh the preview. If you edit text after a run and save, your edited source runs for the capture. If you save source you never ran, nothing executes: the earlier preview is kept and marked stale.

## Sandbox

Each run loads the bundled `local-guest-frame.html` into an `iframe` with only `sandbox="allow-scripts"`, so its origin is opaque. The frame's own CSP denies `connect-src`, `frame-src`, `worker-src`, `object-src`, `form-action` and `base-uri`; images, fonts and media may only be inline `data:` or `blob:`. WebRTC has no CSP directive, so the bootstrap removes it and the connection constructors in the realm that guest markup then shares. Navigating the frame elsewhere is refused by the editor's own `frame-src` fallback. Source reaches the frame as message data, is written into that same document and is never placed in the editor realm.

Browser tests cover opaque origin, denied fetch, XHR, WebSocket, Worker, remote image, storage and parent DOM access, and zero requests reaching a local counter server, including a self-navigation attempt.

**Limit:** the opaque frame shares the editor's thread. Measured in Chromium through Playwright, a `while(true){}` in guest DOM code blocks the page and Forma cannot interrupt it. That is why code never runs without an explicit action, and the dialog says so. Recovery is closing the app and reopening; autosave recovery applies. The plugin worker sandbox does not have this limit because it uses a terminable worker, but DOM code cannot run in a worker.

## Properties

Declare controls in the Properties tab as a JSON array of up to 24 entries: `key`, `label`, optional `description`, `type` (`text`, `number`, `boolean`, `color` or `choice`), `default`, and `maxLength`, `min`/`max` or `options`. Malformed declarations are refused before anything is saved. The Design panel shows one control per declared property. Each change is one Undo step and is validated against its declaration.

Code reads `forma.props` and subscribes with `forma.onProps(fn)`. CSS reads `var(--forma-key)`. Values live in the layer. If the source has been run this session, the control also refreshes the preview; otherwise the value commits and the preview is marked stale without running anything.

## Preview

The canvas never runs code. The layer's artwork is an ordinary image paint holding a captured PNG, so canvas, thumbnails, selection, component instances and prototypes all treat it as a raster. The Design panel shows the preview state: none, current or stale.

Capture happens inside the frame: the live DOM is cloned, canvases and form state are copied in, CSSOM rules are collected, and the result is drawn through an SVG `foreignObject` image into a PNG at up to 2× scale and 2,048 pixels on a side. It is a snapshot, so animation stops at the capture moment. Remote content cannot appear because the frame cannot load it, and fonts are limited to what the frame itself can use: the document's editor fonts are not available inside it. A guest can post its own PNG in place of the capture; the host accepts only a bounded `data:image/png` for that layer's own preview, so this cannot affect anything else.

**Limit:** WebKit may refuse to rasterize `foreignObject` content. Capture has only been exercised in Chromium. If capture fails, the source still saves, the old preview stays, and the state reads stale. Native WKWebView has not been smoke-tested.

## Export and transfer

| Path | What happens to a code layer |
| --- | --- |
| PNG, JPG, SVG, PDF and the plugin export API | The captured preview image is embedded as a raster. Source is not included. A layer with no preview exports its dark placeholder fill. |
| Figma Bridge | Sent as a rectangle with the preview as an image fill, with a line in the transfer report. `prepareFigmaDelivery` blanks the source first. |
| `.oui` save, recovery, version snapshots, clipboard within Forma | Source, values and preview are preserved. |
| MCP | Reads preserve the data. `create_node` does not offer the `code` kind. |
| Local plugins | Reads list the layer's type, name and geometry, never its source, and plugin updates refuse it. |
| Inspect | Lists source, values and preview state as read-only text. The approximate CSS covers only the box. |

Older Forma versions refuse a file containing a code layer, because they do not know the node kind. No migration is needed for existing files, which never carry the field.

## Limits

- Code runs only in the dialog. The canvas, Present mode and prototypes show the raster preview, not a live layer.
- Editing requires an unlocked layer that is not part of a component instance. Edit the main component instead.
- Source is limited to 200,000 characters per language. Dependencies, imports and package managers are not available, since the frame has no network.
- Properties are declared as JSON rather than through a form.
- Source editing is a plain text area: no syntax highlighting, completion or inline errors beyond errors the running code reports.

## Validation

`tests/code-layer.test.ts` covers additive parsing, refusal of malformed source, kinds, properties and values, property bounds, safe value embedding, single-step edits with truthful preview state, editability, Undo, inspection, redacted plugin reads and Bridge delivery through the plugin mock. `tests/e2e/code-layers.spec.ts` exercises the real toolbar and canvas, pixel-checked captured previews, drag sizing, no execution from files, source and property refusal, controls with Undo, sandbox denial with a counting server, export without source, and locked layers.
