# Offline Figma JSON import and local navigation links

This continues the snapping, source replacement, comment and SVG-text checkpoint. It implements reachable subsets of four previously planned named requirements, with explicit limits. The register records 1,317 implemented, 278 partial and 427 planned requirements. Forma remains an independent editor with substantial partial and planned parity work; this is not a completed clone.

| Area | Reachable behavior | Limits |
| --- | --- | --- |
| [Offline REST JSON](FIGMA-REST-JSON-IMPORT.md) | Choose a local Figma GET-file JSON response or bare DOCUMENT, inspect reductions, and open a validated new editable project after retaining current edits. Supports documented geometry, plain text, solid/eligible gradient paints and affine transforms. | Partial. Components detach, unsupported paints/images have disclosed neutral placeholders, booleans use baked geometry, metadata reduces, and unsupported transform contexts refuse. No API retrieval, asset downloading or full-fidelity claim. |
| [Local file/page links](LOCAL-NAVIGATION-LINKS.md) | Copy opaque exact identity references; explicitly review and open a matching current file or unchanged untrashed browser-local repository target. Page links fit its bounded affine artwork. | Partial. No public hosting, account permissions, network lookup or OS scheme handler. Mac cross-file opening explicitly refuses; open the matching `.oui` first. |
| [Local named-flow links](LOCAL-NAVIGATION-LINKS.md) | Review/open the exact named flow, including multiple flows sharing one start frame; presenter selection/restart retains that flow identity. | Partial. Same bounded local matching and native cross-file limits; no hosted prototype sharing URL. |

Local repository opening checks exact reviewed bytes and Trash state, retains dirty current artwork before replacement, and owns its reload pointer through a transaction generation. A context cancellation after commit rolls back only that operation's pointer/unchanged owned metadata; newer writes in another window are preserved. Failed rollback has a visible recovery instruction. No user project files, private IDs or screenshots are published as reference artifacts.

The existing `.oui` versions one and two remain compatible. No native IPC, arbitrary filesystem access, resource-server binding or font redistribution permission expands. The dedicated local JSON picker is reachable in the shared editor including Mac; this does not establish native AppKit acceptance.

## Validation

Combined source `bdf26a0` passes **2,293 core tests in 201 files**, **95 direct-source MCP checks**, both editor/MCP TypeScript checks, and **all 1,613 browser cases** in its complete development-source sweep. The earlier full core run exposed the old large-font allocation timeout; the corrected encoder from the preceding checkpoint passes this full run without relaxing test timeouts. Reconciliation onto the preceding accepted checkpoint changes documentation/history only; its runtime/test tree is identical. The first combined focused run also passes 51 browser cases (12 offline JSON, 17 local navigation, 15 existing comments, seven comment links) and 21 domain core checks. Independent review corrected legacy mask interpretation and pass-through reductions, pre-picker proof ownership, Strict Mode lifecycle setup, page camera ordering and transactional repository cancellation/delivery. Domain reports retain the precise standalone results and limits.

The downloadable Bridge archive/source-comparison case is excluded because its archive remains frozen.

No app/native build, package, release/version bump, signing/notarization, downloadable automation/source archive refresh or website deployment is created. Dev.12 downloads stay frozen. Browser adapters and API mocks do not establish real Figma plugin round trips or native clipboard/assistive-technology acceptance.
