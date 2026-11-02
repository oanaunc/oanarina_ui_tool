# Forma 1.0.4 validation

Forma 1.0.4 makes panning, zooming, clicking and nudging on large files much lighter, and finishes the library, export, background blur, spec, text and K scaling items on the improvement list that could be finished on this Mac.

## Installer

`Forma-1.0.4.dmg` is 39,762,356 bytes, SHA-256 `e723b72a761abc5a898862b634b1db27cc6c0f42d92ca1b8a4b2ae38b5eb44dd`, built from commit `8b2f1f6`. Apple notarization returned Accepted for the app and the disk image, the tickets are stapled, and Gatekeeper reports Notarized Developer ID.

The brand check scanned every file in the app, including the executable, property lists and zips, and found no hits.

## Results

| Check | Result |
| --- | --- |
| Core tests | 4,618 passed |
| Browser interaction checks in Chromium | 2,817 passed, 2 skipped, 1 failed. Explained below |
| Browser interaction checks in WebKit | 2,625 passed, 2 skipped, 193 failed. Explained below |
| MCP tests | 134 passed |
| Smoke, from the read-only disk image | Passed |
| Lifecycle | 37 passed |
| Clipboard | 38 passed |
| Renderer restart | Passed |
| Design file import | 13 passed |
| Integration | 86 passed |
| Acceptance | 29 of 29 groups, 123 checks passed in one run, without `zoom` |
| Thumbnails | Passed with the app temporarily in `/Applications`. The Quick Look preview and Spotlight were not rechecked. Their native code has not changed since 1.0.3 |

The Chromium failure, a damaged file recovering from a named version, passed 5 of 5 runs alone.

The WebKit failures were compared with the 1.0.3 run by test name. 189 fail on 1.0.3 too, and most of those come from the test harness: a Chromium-only debugging API, clipboard permissions and a constant 1 px mouse offset. Four had passed in the 1.0.3 run:

- Copying a masked layer as PNG: the output pixels are the same as 1.0.3, now trimmed tightly to the mask as intended. The test's threshold was out of date and is fixed.
- Font picker recents: passes when rerun.
- A replaced local widget, and held audio resume: these fail intermittently on 1.0.3 as well, in repeated runs of the same tests. They failed every time in repeated runs of 1.0.4, so a real change in how often they fail cannot be ruled out. Both read the page without waiting, which is how they fail on 1.0.3.

A WebKit report that clicked nested frame names missed was checked by hand-placed clicks: a real click at the name selects the frame.

## Lag, measured

The test file is synthetic: 60 screens, 5,161 layers, shadows and clipping, and a spec embedding three screens. No real file of this size was available. Mac app numbers are three runs from the notarized disk image.

| Measure, in the real Mac app | 1.0.3 | 1.0.4 |
| --- | --- | --- |
| Slowest pan steps right after opening (p95) | 113 to 165 ms | 25 to 32 ms |
| Longest freeze on open | about 300 ms | 211 to 288 ms |
| Total stalling on open | about 2.5 s | about 1.3 s |
| Elements on the canvas after opening | not recorded | 5,977 |

| Measure, Playwright WebKit, with other work on the machine | 1.0.3 | 1.0.4 |
| --- | --- | --- |
| Slow pan, p95 | 131 to 193 ms | 18 to 30 ms |
| Wheel zoom, p95 | 108 to 120 ms | 34 to 36 ms |
| Blank screens during a sweep | 93 to 240 of 330 to 583 checks | 0 |
| Blank screens during a long zoom out | about 2,000 of 2,500 | 0 and 4 |
| Click a frame, worst frame | 129 to 138 ms | 82 to 96 ms |
| Arrow nudge, worst frame | 238 to 267 ms | 119 to 123 ms |
| Freeze when a gesture ends | 104 to 166 ms | 55 to 85 ms |

Nudge and click are faster but not instant, and undo is unchanged. The first edit after opening pays one full text pass.

## Not verified

- Real files. The real spec file was not available, so the `spec-file` group did not run on this release.
- Imported variable bindings, checklists, arrowheads, images, lists, grids, library links, blurs, crops and multi-color vectors. Field names are checked against a real file's schema, but behavior is tested only on files written here.
- PDFs were read with Poppler, not Preview or Acrobat. PowerPoint round trips were not opened in PowerPoint or Keynote.
- Mac app memory use with the larger painted canvas, and whether a shadow stand-in ever flashes when it first shows.
- Physical mouse, trackpad and tablet, VoiceOver speech, printers, Intel Macs and older macOS. The `zoom` group cannot run here because injected wheel events do not arrive.
- The eye button on a style's paint row was not rechecked by eye after a stray underline fix.

## Behavior changes in existing files

- Text menu Uppercase, Lowercase and Title case now set a live setting and toggle off, instead of rewriting the text. Title case leaves the other letters alone.
- Hanging quotes now also apply in lists, tabs and ellipsis tails.
- A constraint resizing a group now scales the group's contents, including on ordinary frame resizing.
- Copying or exporting masked artwork comes out tighter, because bounds stop at the mask.

## Known limits

- Files with several background blurs on a page, or specs with toggle blocks, need 1.0.4 or later.
- Background blur refuses text and groups. In the Mac web view, a blur over nothing opaque fades at its region edge.
- PDF effects stay as pictures, and a page-level blur flattens that page.
- Saving back to the original design file format is not available.
- A person's verdict on how each feature feels is now tracked in `docs/feels-right.json`. It holds none yet.
