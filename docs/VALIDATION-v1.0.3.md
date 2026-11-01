# Forma 1.0.3 validation

Forma 1.0.3 fixes the unreadable block menu in specs, removes most of the canvas lag on large files, matches how specs behave in the tool people are moving from, and finishes most of the import, editing, drawing and prototype items in the improvement list. The register holds 1,844 public requirements: 1,663 implemented, 175 partial and 6 planned.

## Installer

`Forma-1.0.3.dmg` is 39,568,700 bytes, SHA-256 `3ddecfb6cbeef6b49ea159a3d95aec89eeb1d1bf0ce9e9916cbee3ef4279725e`, built from commit `128a00d`. Apple notarization returned Accepted for the app and the disk image, the tickets are stapled, and Gatekeeper reports Notarized Developer ID.

The brand check scanned every file in the app, including the executable, property lists and zips, and found no hits.

## Results

| Check | Result |
| --- | --- |
| Core tests | 4,452 passed |
| Browser interaction checks in Chromium | 2,769 passed, 2 skipped, 4 failed on the last complete run. All 4 are explained below |
| Browser interaction checks in WebKit | 2,582 passed, 2 skipped, 191 failed. None of the 191 passed on 1.0.2. Explained below |
| MCP tests | 134 passed |
| Smoke, from the read-only disk image | Passed |
| Lifecycle | Passed |
| Clipboard | Passed |
| Renderer restart | Passed |
| Design file import | 13 passed |
| Integration | 86 passed |
| Acceptance | 29 of 29 groups passed in one run, without `zoom` |
| Quick Look, thumbnails and Spotlight | Each passed, on a synthetic project, but not all in one run. See below |

Of the four Chromium failures, two were Max width tests that needed to open More options, and one was a test clicking before a file finished opening. All three were fixed and pass. `fonts` passes alone and failed the same way in 1.0.1 and 1.0.2. Those runs predate the last four commits, which changed the spec editor's key handling, the shadow filter and the camera. The spec, effect, export, camera and zoom tests were rerun after those changes and passed, but the complete suites were not.

The 191 WebKit failures were compared with the 1.0.2 code by test name: 189 fail the same way there and the other 2 are new tests that need a Chromium-only API. Most come from the test harness rather than the app: 50 use a Chromium-only debugging API, 14 ask for a clipboard permission WebKit lacks, and most drawing and snapping failures are a constant one-pixel offset in simulated mouse input. They were not each investigated, so a real WebKit bug could be hiding among them. The native groups use real events.

Quick Look previews and thumbnails passed with the app in `/Applications`, where the Spotlight importer's results failed. The Spotlight importer and index checks passed in a run from the disk image, where Quick Look failed because the file type did not resolve. It looks like registration timing on this Mac, not the app, but that is unconfirmed.

## Lag, measured

The test file is synthetic: 60 screens, 5,161 layers, 8,370 text elements' worth of copy, shadows and clipping, and a spec embedding three screens. No real file of this size was available.

| Measure | 1.0.2 | 1.0.3 |
| --- | --- | --- |
| Elements on the canvas after opening | 90,756 | 11,609 |
| Total stalling on open, WebKit | 22.6 s | about 1 s |
| Longest freeze on open, WebKit | 3.4 s | 0.4 s |
| Slowest pan steps right after opening (p95), WebKit | 997 ms | 24 to 39 ms |
| 40 moves of a drag, WebKit | 32 s | about 1 s |

In the real Mac app the file opens zoomed in, where shadows are visible, so it is slower than these browser numbers: the longest freeze is about 300 ms and p95 pan is 113 to 165 ms, with about 2.5 s of total stalling. That is much better, and not yet as smooth as it should be. The 1.0.2 app was not measured the same way.

## Not verified

- Real files. The real spec file used for 1.0.2 was no longer available, so the `spec-file` group did not run on this release.
- Imported images, lists, grids, library links, blurs, crops, multi-color vectors, arrowheads and variable actions. Their field names are checked against a real file's schema, but their behavior is tested only on files written here.
- The new on-canvas handles, the font picker and prototype drags were tested with simulated input and not by hand. The prototype drag code was not run in the Mac app.
- Physical mouse, trackpad and tablet, VoiceOver speech, printers, Intel Macs and older macOS.
- Quick Look and Spotlight on a file containing a Spec.

## Known limits

- Files using stroke color styles or the new text settings need 1.0.3 or later.
- Line heights and line breaking change only for new text and text you edit. Older text keeps its layout until then.
- Selecting text across spec blocks picks whole blocks, not parts of them. There are no toggle blocks.
- Saving back to the original design file format is not available.
- Import limits are listed in the import guide.
