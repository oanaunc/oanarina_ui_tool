# Forma 1.0.5 validation

Forma 1.0.5 adds rounded corners on any vector, a fuller Move to page, SVG import that no longer refuses browser-readable files, outlines from more font formats, and more plugin, widget, playground, code mapping and layout guide work. It also fixes typed inspector values vanishing when a font finished loading, a bug that shipped in 1.0.4.

## Installer

`Forma-1.0.5.dmg` is 40,508,767 bytes, SHA-256 `4d9bfb9459f610fa0c4a936f96dcfa449618349ed84bfd90e9f9de0bae4d4da8`, built from commit `279bc0d`. Apple notarization returned Accepted for the app and the disk image, the tickets are stapled, and Gatekeeper reports Notarized Developer ID. The app on the read-only disk image matches the signed build file for file (385 files).

The brand check scanned every file in the app, including the executable, property lists and zips, and found no hits.

The build scripts now ask `xcrun` for the macOS SDK explicitly. After an Xcode update on this Mac, the default SDK path pointed at the Command Line Tools copy, which Xcode's `xcodebuild` could not read, and the first packaging attempt failed before signing.

## Results

| Check | Result |
| --- | --- |
| Core tests | 4,802 passed |
| Browser interaction checks in Chromium | 2,883 passed, 3 skipped, 0 failed |
| Browser interaction checks in WebKit | 2,696 passed, 2 skipped, 188 failed. Explained below |
| MCP tests | 136 passed |
| Smoke, from the read-only disk image | Passed. Explained below |
| Lifecycle | 37 passed |
| Clipboard | 38 passed |
| Renderer restart | 3 passed |
| Design file import | 13 passed |
| Integration | 86 passed |
| Acceptance | 29 of 29 groups, 127 checks passed in one run, twice, without `zoom`, `open-lag` and `spec-file` |
| Quick Look | 12 passed with the app temporarily in `/Applications`: thumbnails, both preview pages, and no artwork for future, truncated, huge or linked files |
| Spotlight | Not verified on this Mac. Explained below |

The browser runs were on source `e6bd78c`. Commits after it change only version labels, release notes and the build scripts' SDK lookup.

## Native checks that failed first

Each failure was rerun against 1.0.4 on the same Mac, alternating versions so both ran under the same load. An Android emulator and Android Studio were using about 7 CPU cores at the time.

- The smoke camera step, waiting for a native zoom command to settle, failed once on 1.0.5 and once on 1.0.4. It passed 2 of 2 reruns on 1.0.5.
- Acceptance stopped at `workflow` in the first three full runs of 1.0.5, before the text editor took focus, and once at `keyboard`, on the focus ring. With the same load on both, 1.0.5 then passed the full run 2 of 3 and 1.0.4 passed 3 of 3. The `workflow` and `keyboard` groups pass on both when run alone or after the groups that preceded the failures, except `plugin` followed by `workflow`, which fails 3 of 3 on 1.0.4 and 1.0.5 alike.
- The design file import check needs its synthetic file in the environment. It passed once that was supplied.

A real change in how often the focus steps time out under heavy load cannot be ruled out.

## Spotlight

The Spotlight importer list on this Mac still names old development copies of the app, one in an agent worktree and one on a disk image that is no longer mounted, so `mdimport` imports `.oui` files with a stale type. Clearing that list needs administrator rights. 1.0.4 fails the same six Spotlight checks here today. The importer's code has not changed since 1.0.4; only the SDK it was built with has.

## WebKit failures

The WebKit failures were compared with the 1.0.4 and 1.0.3 runs by test name. 185 also fail on 1.0.3, mostly from the test harness: a Chromium-only debugging API, clipboard permissions and a constant 1 px mouse offset. Two are not in the 1.0.4 list:

- Font cache cleanup also fails on 1.0.4 source, 2 of 3 runs.
- The font picker "clicking away reverts" check failed 1 of 6 repeats. It was not run on 1.0.4.

Seven tests that failed on 1.0.4 pass now, including the replaced local widget and held audio checks.

## Not verified

- Real files. No real design file was available, so the `spec-file` group did not run, and rounded corners on imported vectors were tested only on files written here.
- SVG import was swept over 1,600 SVG files on this Mac and 411 written cases, not over files from other people.
- PDFs were read with Poppler, not Preview or Acrobat.
- Physical mouse, trackpad and tablet, VoiceOver speech, printers, Intel Macs and older macOS. The `zoom` group cannot run here because injected wheel events do not arrive.

## Behavior changes in existing files

- Polygons and stars with corner smoothing change shape slightly.
- A very large corner radius on a strongly curved side can land differently than before.
- SVG files that used to be refused now import, with a report of what was left out.
- Text that used to become a picture in WebKit PDFs may stay as text.

## Known limits

- Past 128 curved corners on one layer, a simpler curve is used.
- Rotated or skewed elliptical gradients still become circles in website export.
- Widget hover and timer state is lost on reload unless a press saves it.
- A drag still cancels if a font finishes loading during it.
