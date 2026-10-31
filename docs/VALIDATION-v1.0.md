# Forma 1.0.0 validation

The register holds 1,808 public requirements: **1,624 implemented, 179 partial and 5 planned**. Retired requirements are out of scope and are not shown in the app or on the website.

## Installer

`Forma-1.0.0.dmg` is 39,437,723 bytes, SHA-256 `ac38d7bfa50cf1d1a1dc3ffc1a73a20ca60e81b25911a5e4d40ea0272ae57472`. Apple notarization returned Accepted for the app and the disk image, both tickets are stapled, and Gatekeeper reports Notarized Developer ID. It is a universal build for macOS 13 or later, with Quick Look, thumbnail and Spotlight extensions signed inside. Intel runtime is not validated on real hardware.

The brand check scanned every file in the app, including the executable, property lists and zips, and found no hits.

## Results

| Check | Result |
| --- | --- |
| Core tests | 4,003 passed across 337 files |
| Browser interaction checks | 2,617 passed, 2 skipped, 2 failed on the last complete run |
| MCP tests | 133 passed |
| Smoke, from a read-only mount of a quarantined copy | Passed |
| Lifecycle | 37 passed |
| Clipboard | 38 passed |
| Renderer restart | Passed |
| Synthetic design file import | 13 passed |
| Integration | 86 passed |
| Acceptance, 25 groups | 112 passed |
| Quick Look, thumbnails and Spotlight on the installed app | Passed in real system hosts |

Of the two browser failures, `canvas-navigation` read a timing-dependent expectation and passes after its spec was corrected, and `fonts` passes alone 3 of 3 and fails only under load.

Forma appears in Open With for `.fig` files on a Mac where another app owns that type.

## Not verified on the final installer

- **Real wheel events.** The acceptance group `zoom` injects real Command-scroll events. It passed 5 of 5 on the same zoom code, measuring about 60 fps over 330 layers, then stopped receiving injected events on this Mac on the final runs, including on a local build that had just passed. The product code did not change between them. Scripted wheel tests pass in browsers.
- **Hand use.** No person has used this build on screen. The real-input workflow runs inside the app.
- **Real files.** `.fig` and Sketch import are tested on self-authored files only. Field names, including those read for spec blocks, are assumed rather than proven, so a spec block may stay an image, and the import report says so.
- **Hardware and systems.** VoiceOver speech, physical trackpads, printers, tablets, Intel Macs and older macOS. The older macOS capture path is forced by a test on macOS 27.

## Decisions

- Folder export and a panel-free export folder were removed, and so were installed font table reads, to keep native permissions unchanged.
- The app sandbox stays off: a sandboxed test build failed the integration run.
- The bridge plugin left the build, so its requirements are retired.
- Saved files that use tile offsets paint differently, because offsets now shift the whole repeat.
- Files using the newest features are refused by older builds. Legacy files open unchanged.
