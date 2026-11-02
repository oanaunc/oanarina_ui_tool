# Guest script isolation

Plugin interfaces and code layers run other people's HTML, CSS and JavaScript. Before this change a guest `while(true){}` froze Forma for good. Guest scripts now run in a dedicated worker, so a runaway script costs only that worker.

## Why a frame cannot fix it

Measured on 2026-10-31 in a real `WKWebView` (WebKit 22625, macOS 27.0.1), with a page on `127.0.0.1` and a spinning guest:

| Guest placement | Page thread after the loop starts |
| --- | --- |
| `sandbox="allow-scripts"` iframe | blocked, no answer in 4 s |
| cross-origin iframe, `localhost` against `127.0.0.1` | blocked, no answer in 4 s |
| sandboxed and cross-origin iframe | blocked, no answer in 4 s |
| Worker inside the opaque frame | answers in 0 ms, and `terminate()` works |
| A second `WKWebView` | separate process, page answers in 0 ms |

This WebKit gives every iframe the page's thread, so nothing in the page can run while a frame spins, and a watchdog on that thread never gets a turn. Same-thread frames cannot be fixed with a timer, a heartbeat or a `sandbox` attribute.

A second `WKWebView` would work, but it needs new native IPC and new native views, which this project keeps closed, and it would leave the browser preview unprotected. The worker works in every engine with no native change.

## How it works

1. `src/guest-frame.ts` opens `public/local-guest-frame.html` in the same opaque frame as before. Its CSP pins one trusted script by hash, so no guest script can run in that frame. `script-src-attr` is `'none'`.
2. The frame parses guest markup with `DOMParser`, which does not execute it, removes scripts, `on*` attributes and refused elements (`iframe`, `object`, `embed`, `base`, `meta`, `link`, `noscript`), and adopts the rest. HTML and CSS render straight away.
3. The scripts go to a Blob worker running `src/guest-dom-worker.js`. Each is loaded as its own classic script, so one failing script does not stop the next and top-level declarations are shared. Its CSP is inherited: no `connect-src`, no `unsafe-eval`. Workers, `fetch`, `XMLHttpRequest`, sockets, `importScripts`, IndexedDB and `postMessage` are removed before guest code starts.
4. The worker's mirrored DOM batches changes per task. The frame applies them as checked data in 8 ms slices. Canvas drawing goes to an `OffscreenCanvas`, and each finished task sends a bitmap to the real element.
5. Events go the other way, with input values, checked state and scroll offsets synced first. Pointer, wheel and scroll events are coalesced to one per frame.

## Limits

These are enforced in the frame, which keeps running whatever the worker does.

| Limit | Value | Result |
| --- | --- | --- |
| Script not yielding | 5 s, watchdog ticks once a second | worker stopped, reported, markup stays |
| Live nodes | 200,000 | guest error, or stop if the frame's own count is exceeded |
| Queued operations | 400,000 | worker stopped |
| One text or attribute value | 2,000,000 characters | refused, or worker stopped |
| Elements with tracked geometry | 2,000 | further elements read their last value |
| `DOMParser` input | 2,000,000 characters | refused |
| Nodes from one parse | 100,000 | refused for HTML, `parsererror` for XML |
| Parser depth | 512 levels | HTML nests no deeper, XML answers `parsererror` |
| Custom element definitions | 500 | refused |

For a plugin, a stop ends the run with no proposal. For a code layer, the dialog reports it and **Run again** starts a fresh worker. Cancel and Stop remove the frame, which ended the spin at once in the real `WKWebView` test (web content process 99% CPU, then 0%).

## What a guest script cannot do

The mirrored DOM covers elements, text, attributes, `style`, `classList`, `dataset`, forms, selectors, `innerHTML`, `template`, event dispatch, `requestAnimationFrame`, `ResizeObserver`, `MutationObserver`, `IntersectionObserver` with the viewport as its root, 2D canvas, `DOMParser`, `XMLSerializer`, custom elements and Shadow DOM. Across threads, some things cannot be synchronous:

- **Geometry** comes from the last measurement. The first read in a page is accurate. After a change, read it in the next animation frame. `getComputedStyle` returns inline values and measured `width` and `height` only.
- **`preventDefault`** arrives after the event, so the frame decides first. Submitting a form and following a link are cancelled outright, on the first event. A link to `#id` is cancelled too, and scrolls from the worker unless a listener cancelled it. For a few key defaults the frame cancels the key, waits for the worker, and replays the default if nothing cancelled it: Enter in a `textarea`, Tab when another control in the page can take focus, and arrow, page, Home, End and Space keys away from form controls. Anything else is remembered per element, event type and key, and cancelled from the next matching event, so stopping Tab in a field no longer stops typing in it. If a later event was not cancelled after all, the frame forgets that. Printable keys are never held, because replaying text would break input methods, so a filter on typed characters lets the first press of each key through. Tab at either end of the page leaves the frame on its first press, because the frame cannot move focus into the editor for it. Wheel and touch defaults stay as they were.
- **Canvas** `toDataURL` is unavailable, because it is synchronous. Use `toBlob`. Drawing an `<img>` into a canvas is unavailable.
- **Observers** see only what the guest's own script does. `MutationObserver` reports records in one microtask, and an edit the person makes in a field shows through its `input` event instead. `IntersectionObserver` updates with geometry, a frame late, and refuses a custom root.
- **`DOMParser`** runs in the worker, on a bounded parser written for this runtime, and builds a separate document that the frame never sees. Its images do not load, its handler attributes stay text and its scripts never run. Inserting a node into the page sends it to the frame, where the usual checks apply and handler attributes become live, as they do in a browser. XML is strict: malformed input gives a document with a `parsererror` root, and a document type with an internal subset is refused, so entity expansion cannot happen. CDATA becomes plain text, and processing instructions are dropped.
- **Custom elements** run wholly in the worker, so `define`, upgrades, `connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`, `get`, `getName`, `whenDefined` and `upgrade` reach nothing a guest script could not already do. The frame sees an unknown tag and ordinary mutations. Customized built-ins and `attachInternals` are not provided, and `adoptedCallback` never runs.
- **Shadow DOM** mirrors to a real shadow root in the frame, so `<style>`, `<slot>`, `:host` and `::slotted` behave natively. A `closed` root is closed only to guest code: the frame always opens the real one so it can forward events. Inside the mirror, selectors and child lists stop at the root, composed events cross to the host with their target retargeted, and non-composed events stay inside. Declarative shadow roots in parsed markup and `adoptedStyleSheets` are not provided. A code layer's captured preview leaves out shadow content, because a clone of the document does not carry it.
- **Not provided:** Range and Selection, `document.write`, ES module scripts. Using one fails visibly instead of pretending to work.
- **Inline handlers** run in the worker, so `this` and `event` work but the `with`-style scope of element properties does not.

CSS animation and transitions run in the frame and are unaffected.

## What this does not cover

- Heavy CSS, or a very large DOM that takes long to lay out, runs on the frame's thread like any page content. The node limit and time-sliced application bound it, but they do not make layout preemptible.
- A worker allocating memory until the process is exhausted is not bounded by Forma. This remains a browser boundary, not an OS sandbox.
- The app itself has not been launched for this. Evidence for the real engine comes from a small `WKWebView` harness that loaded the actual frame, runtime and guardian files from a loopback server. There, DOM mutation, inline handlers, canvas and animation frames worked, `fetch`, `eval`, `importScripts` and nested workers were denied, the guardian worker completed a host request, and a code layer capture returned a PNG with correct pixels. Playwright's Chromium and WebKit cover the editor paths.

## Validation

`tests/guest-dom-worker.test.ts` runs the real runtime text in an isolated realm and pins the frame's script hash. `tests/e2e/guest-isolation.spec.ts` covers a synchronous loop, a loop started from an event, a plugin interface loop, a promise chain that never yields, a mutation flood, DOM fidelity, refused reach, parsing, custom elements and shadow roots in the real frame, and held key defaults. Both it and the plugin platform spec pass in Chromium and in Playwright's WebKit.
