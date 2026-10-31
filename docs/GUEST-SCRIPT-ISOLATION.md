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

For a plugin, a stop ends the run with no proposal. For a code layer, the dialog reports it and **Run again** starts a fresh worker. Cancel and Stop remove the frame, which ended the spin at once in the real `WKWebView` test (web content process 99% CPU, then 0%).

## What a guest script cannot do

The mirrored DOM covers elements, text, attributes, `style`, `classList`, `dataset`, forms, selectors, `innerHTML`, event dispatch, `requestAnimationFrame`, `ResizeObserver` and 2D canvas. Across threads, some things cannot be synchronous:

- **Geometry** comes from the last measurement. The first read in a page is accurate. After a change, read it in the next animation frame. `getComputedStyle` returns inline values and measured `width` and `height` only.
- **`preventDefault`** arrives too late for the event that caused it. The frame remembers it and cancels the same event type on that element from the next event on. Submitting a form and following a link are always cancelled.
- **Canvas** `toDataURL` is unavailable, because it is synchronous. Use `toBlob`. Drawing an `<img>` into a canvas is unavailable.
- **Not provided:** `MutationObserver`, `IntersectionObserver`, `DOMParser`, Range and Selection, Shadow DOM, custom elements, `document.write`, ES module scripts. Using one fails visibly instead of pretending to work.
- **Inline handlers** run in the worker, so `this` and `event` work but the `with`-style scope of element properties does not.

CSS animation and transitions run in the frame and are unaffected.

## What this does not cover

- Heavy CSS, or a very large DOM that takes long to lay out, runs on the frame's thread like any page content. The node limit and time-sliced application bound it, but they do not make layout preemptible.
- A worker allocating memory until the process is exhausted is not bounded by Forma. This remains a browser boundary, not an OS sandbox.
- The app itself has not been launched for this. Evidence for the real engine comes from a small `WKWebView` harness that loaded the actual frame and runtime files from a loopback server; Playwright's Chromium and WebKit cover the editor paths.

## Validation

`tests/guest-dom-worker.test.ts` runs the real runtime text in an isolated realm and pins the frame's script hash. `tests/e2e/guest-isolation.spec.ts` covers a synchronous loop, a loop started from an event, a plugin interface loop, a promise chain that never yields, a mutation flood, DOM fidelity and refused reach. Both it and the plugin platform spec pass in Chromium and in Playwright's WebKit.
