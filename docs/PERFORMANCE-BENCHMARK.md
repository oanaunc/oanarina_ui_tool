# Performance benchmark

`tests/e2e/performance-benchmark.spec.ts` is a repeatable measurement, skipped unless requested:

```
FORMA_BENCH=1 FORMA_BENCH_OUT=/tmp/forma-bench.json npx playwright test tests/e2e/performance-benchmark.spec.ts --workers=1
```

It builds a two-page document of plain rectangles in the running editor and reports the median of 3–6 runs. It compares batched mounting with the single pass by raising the threshold at runtime, and generates every fixture in the page, so no user content is involved.

Recorded 2026-10-31 on an Apple M3 Max, headless Chromium 156, Vite development server, viewport 1512×982:

| Measurement | 2,000 layers per page | 20,000 layers per page |
| --- | --- | --- |
| Open file: first frame, batched | 360 ms | 1,420 ms |
| Open file: first frame, single pass | 346 ms | 5,835 ms |
| Open file: all batches mounted | 349 ms | 2,165 ms |
| Switch page: first frame, batched | 199 ms | 1,117 ms |
| Switch page: first frame, single pass | 194 ms | 1,713 ms |
| Recovery write | 8 ms | 79 ms |
| Recovery read | 4 ms | 39 ms |
| Three-way merge | 127 ms | 1,276 ms |
| History encode and restore, one step | 35 ms | 348 ms |

Opening 36 images of 1600×1200 pixels took 218 ms to the first frame, which was also the longest task.

Read these as relative numbers. The development server runs React's development build under StrictMode, which a production build does not, and plain rectangles are not representative artwork. WKWebView has not been measured. They are not promises for other documents or machines, and no comparison with Figma has been made.

## Progressive page loading

A page with at least 3,000 layers in view mounts complete root subtrees in batches of about 800 layers per frame, with a *Loading page* indicator (`src/progressive-page.ts`). At 20,000 layers the first frame arrived about four times sooner when opening a file and about 35% sooner when switching pages; the rest of that first frame is other editor work. Total mount work is similar, spread across frames.

Batches stay until the render list changes, then the page returns to the single-pass scene, and a browser check confirms matching pixels. Batching does not apply to a page where one root owns nearly everything, to scenes the viewport culler keeps whole (root masks, background blur, pass-through blending), during drafts, or to Motion and other non-Design views. A later edit on a dense page still re-renders it in one pass. The whole document is still parsed and held in memory, so this is progressive *mounting*, not on-demand page data.

## Image decode scheduling

`src/image-decode-queue.ts` decodes a page's embedded raster images when it opens, two at a time, nearest the view first, up to 256, and stops when the page changes. Decoded images stay held until then, so the canvas finds them ready. It reads only inline data and changes no artwork.

The fixture above showed no long task a queue would address in Chromium, so no speedup is claimed. This spreads decoding out and orders it; WebKit can still decode an image synchronously if it paints before the queue reaches it, and pixels are not held back until decoded.
