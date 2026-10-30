# Offline Figma container decoding

`decodeFigFile(bytes, {signal?})` in `src/fig-container.ts` reads a `.fig` byte array entirely on the device. It creates a dedicated module worker, transfers a copy of the bounded input, and terminates that worker after success, failure, cancellation, or a 15-second work limit. The original input remains usable. It does not fetch assets, extract files to disk, execute schema code, or mutate an editor document.

The result is `{version,message,images,metadata?,thumbnail?}`. `message` contains the raw embedded Kiwi `Message`, including `nodeChanges` and `blobs`; image keys are normalized 40-character hexadecimal asset hashes. Byte vectors and assets are `Uint8Array`; 64-bit integers are decimal strings to preserve precision. Missing fields remain missing. Scene mapping, format reductions, image decoding, and final `.oui` validation belong to the separate import layer. Successful container decoding alone does not establish Figma visual or editing parity.

## Supported containers

- A standalone `fig-kiwi` payload, or an ordinary single-disk ZIP containing `canvas.fig`, optional `meta.json`/`thumbnail.png`, and `images/<40 hex characters>`.
- Exactly two length-prefixed canvas chunks: an embedded binary Kiwi schema and its `Message`. Each can use raw DEFLATE or one Zstandard frame.
- ZIP stored/DEFLATE entries, with directory/local-header agreement, exact ranges, no overlapping or hidden data, and CRC-32 validation. All entries are inspected before any entry is expanded. Directory data descriptors are validated when present.
- Zstandard raw, RLE, and compressed blocks; optional content checksum (XXH64) is verified. Window/content sizes and block boundaries are checked before calling the decompressor.
- Kiwi enum/struct/message values, native primitive types, arrays, nested messages, and byte vectors, interpreted from the supplied schema. No generated functions or `eval` are used. Prototype-related and non-identifier schema names are rejected, with `Map` and null-prototype records used for lookups/output.

ZIP64, encryption, multipart archives, filesystem links, arbitrary ZIP paths/extra files, Zstandard dictionaries/skippable/concatenated frames, additional canvas chunks, unknown enum values/fields, and unsafe or inconsistent schema definitions are refused. A valid file using those extensions needs a supported Figma export or a future decoder extension; it is never silently truncated into an apparently complete scene. `fig-kiwi` version values are retained, but version alone does not promise compatibility with every historical/future schema.

## Resource limits

All size values below are binary MiB. `src/fig-limits.ts` and `src/fig-kiwi.ts` define the enforced limits.

| Resource | Limit |
| --- | --- |
| Input | 50 MiB |
| ZIP entries / total expanded bytes | 2,048 / 100 MiB |
| Canvas / each image / thumbnail / metadata | 32 / 32 / 8 / 1 MiB |
| Expanded embedded schema / message | 2 / 64 MiB |
| Zstandard window / blocks per frame | 64 MiB / 8,192 |
| Schema definitions / fields / fields per definition | 2,048 / 40,000 / 2,048 |
| Message nesting / root node changes | 64 / 20,000 |
| Decoded values (including reserved array slots) / array length | 2,000,000 / 1,000,000 |
| Total byte vectors / string bytes / single string | 64 / 16 / 1 MiB |
| Metadata nesting / values | 32 / 50,000 |
| Worker wall-clock work | 15 seconds |

DEFLATE uses a fixed output buffer with one extra overflow byte. Zstandard allocates only after header/window checks and stops when streamed output exceeds its cap. Intermediate allocations and decoded JavaScript objects still consume more memory than their binary byte counts; exceptionally complex files may be refused or hit the worker work limit. The synchronous `decodeFigContainerInWorker` core exists for the worker and headless tests: **untrusted interactive imports must use `decodeFigFile`**, whose independent timeout can stop decompression loops. No direct main-thread synchronous decoder path is provided by the import API.

## Provenance and tests

Wire-format research uses the primary [Kiwi binary schema/byte buffer implementation](https://github.com/evanw/kiwi), [OpenFig parser research](https://github.com/OpenFig-org/openfig-core), and [Zstandard format specification](https://github.com/meta/zstd/blob/dev/doc/zstd_compression_format.md). The interpreter is local code; executable schema compilers and OpenFig runtime code are not dependencies. Compression dependencies are pinned MIT packages [fflate 0.8.3](https://github.com/101arrowz/fflate) and [fzstd 0.1.1](https://github.com/101arrowz/fzstd), with licenses in `public/THIRD-PARTY-NOTICES.txt`.

`tests/fig-container.test.ts` uses generated synthetic schemas/scenes/archives, including adversarial names, malformed lengths/headers, resource limits, CRC/checksum errors, deep nesting, and exact integer/UTF-8 preservation. The isolated production worker fixture builds with `npx vite build --config tests/fixtures/fig-decoder.vite.ts`; `tests/browser-decoder/fig-container.spec.ts` runs with `npx playwright test --config tests/fixtures/fig-decoder.playwright.ts` against that preview to verify real module-worker decoding under a no-eval content policy, malformed input rejection, cancellation, and repeat use. User files, decoded private text/IDs/assets, and private screenshots are not fixtures and must not be committed or published.
