# v0.2.0-dev.10 validation — local Figma Design import

Forma remains an unfinished independent design editor. The register has 2,022 requirements: 1,062 implemented, 169 partial and 791 planned. Direct binary `.fig` import is **partial**. Binary `.fig` export remains planned. Implementation status is separate from exact Figma reference verification.

## Reviewed behavior

File Open uses an isolated worker for bounded archive/schema decoding, then validates supported scene geometry, composed world coordinates, referenced image pixels and the actual saved-file size before document replacement. No schema code is executed. Decoding, image assets and conversion stay local. Figma source paths are not exposed to the renderer or served through HTTP.

The importer preserves a supported static Design subset. Instances become detached editable layers with supported current values. Native annotation blocks can retain their own embedded visual snapshots. Original text outlines preserve supported appearance until typography/layout edits require editable-font rendering. Known reductions are shown after import. See [import workflow](FIG-IMPORT.md), [container limits](FIG-CONTAINER.md) and [scene limits](FIG-SCENE.md).

Mac imports start dirty in independent windows without a `.fig` save binding. The first Save requires a destination; Save/Cancel and explicit refusal of a `.fig` destination are tested. Browser File Open now flushes outgoing edits before replacing a document, cancels stale workers and aborts pending recovery writes. Unsaved edits that cannot be retained require a `.oui` backup before replacement.

## Evidence

- Final source: 652 core tests across 65 files; production build succeeds.
- Standalone MCP: 39 tests and TypeScript check pass.
- Independent container review: 13 core checks and three real production-worker browser checks under a no-eval content policy pass.
- Independent final raster review: five source-browser checks and 23 scene/bridge core checks pass, including the 64-million-unique-pixel cap before image allocation.
- Independent IndexedDB checks confirm that cancelled queued writes do not replace active recovery, and that immediate File Open retains outgoing edits. Regression tests reproduced the old loss before confirming the fix.
- Private local acceptance opens the original supplied archive through the production File Open chooser, saves/reopens `.oui`, retains page content/identities and verifies the original bytes remain unchanged. Local screenshots were inspected, including a zoomed reader. Private files, decoded content, identifiers and screenshots are excluded from source and public website artifacts. This is not a live Figma pixel-parity or full-format acceptance claim.
- A candidate native build passes 13 synthetic `.fig` import/save checks using an isolated WebKit store and owned temporary files. No user project or general clipboard is used by the native harness.

The first full production invocation passed 267 browser checks but also collected two source-module repository tests; those failed because a production server does not expose `/src/repository.ts`. These tests must run against the development server. The correctly selected final production invocation passes all **267 checks** in one uninterrupted run (2.1 minutes). Both source-module repository checks also pass against the development server. Native release acceptance results are recorded below when completed; no failed invocation is described as green.

## Release boundary

Dev.9's accepted/stapled artifact is retained locally and was held from public release while this importer was added. Dev.10 publication requires its own app and DMG Accepted responses, stapling, Gatekeeper checks and exact-artifact native smoke results. Public download metadata must describe the actual published artifact.
