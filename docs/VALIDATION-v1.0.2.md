# Forma 1.0.2 validation

Forma 1.0.2 makes specs a real block layer, adds saved color styles, corrects how design files are read, and adds Mixed values in number fields. The register holds 1,844 public requirements: **1,658 implemented, 179 partial and 7 planned**. The 34 new implemented rows are Spec page behaviors, and the two new planned rows are spec limits.

## Installer

`Forma-1.0.2.dmg` is 39,435,218 bytes, SHA-256 `b649711ac50d69de3d6533145080f5e1d0e700ac264a502338ab7e22d207cf15`, built from commit `8e488c9`. Apple notarization returned Accepted for the app and the disk image, both tickets are stapled, and Gatekeeper reports Notarized Developer ID. It is a universal build for macOS 13 or later.

The brand check scanned every file in the app, including the executable, property lists and zips, and found no hits.

## Results

| Check | Result |
| --- | --- |
| Core tests | 4,052 passed across 340 files |
| Browser interaction checks | 2,646 passed, 2 skipped, 2 failed on the last complete run |
| Spec and color checks in WebKit | All passed, on an earlier commit of this work |
| MCP tests | 134 passed |
| Smoke, from the read-only disk image | Passed |
| Lifecycle | Passed |
| Clipboard | Passed on a separate run, after a timeout |
| Renderer restart | Passed |
| Design file import | 13 passed |
| Integration | 86 passed |
| Acceptance | 28 of 29 groups passed, without `zoom` |

Of the two browser failures, `fig-scene` used a fixture with the old mask field name and passes now that it uses the real one. `fonts` passes 5 of 5 alone and failed the same way in the 1.0.1 run.

The native groups were run from the final disk image. A first run stopped at `spec-file` after 17 groups passed, and the other 11 groups passed one at a time. `workflow` needed a second try in that later run, and it fails intermittently on 1.0.1 too, when another app is in front.

## Real files

Two real design files were used on this Mac. Neither entered the repository or the website.

- **A file with spec pages.** From the final disk image, the app opened it and its 4 spec pages arrived as Spec layers with 46 blocks, painted on the canvas. A real double-click on one then failed 5 of 5 on that disk image, because of a timing change in the check itself. With the timing restored, a local build of the same app code opened it as 16 blocks in 2 of 3 runs. Double-clicking a Spec passes every run in WebKit.
- **A file with component sets.** It imported with no issues, and Forma's render matches the file's stored preview, compared by eye. Its variants store each property as a typeless copy pointing at the set, which confirms that fix on real data.

Field and enum names were corrected against the schema real files embed. 49 of 55 text layers in the first file use `{100, PERCENT}`, which is Auto line height. Masks, polygons and stars, overlays and variant actions appear in neither file, so those fixes are confirmed by name only and tested on fixtures written here.

## Not verified

- **A physical mouse or trackpad.** The `zoom` group was left out, and its injected events don't arrive on this Mac.
- **Spec tables, code, quotes, images and embedded canvases on real files.**
- **Quick Look, thumbnails and Spotlight on an installed app.** They were not rerun, and files holding a spec have not been tried in them.
- **Hand use.** No person has used this build on screen.
- **Hardware and systems.** VoiceOver speech, printers, tablets, Intel Macs and older macOS.

## Decisions

- Files holding a spec open only in 1.0.2 or later. The file format version is unchanged, and older files open as before.
- Spec pages imported by 1.0.1 stay frames. Import the design file again to get a Spec layer.
- Files past 20,000 layers on a page or 60,000 in a file now import up to the limit and report the rest, rather than being refused.
- `docs/IMPROVEMENTS.md` lists what is left.
