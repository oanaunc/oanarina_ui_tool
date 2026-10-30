# v0.2.0-dev.9 validation — pages, raster clipboard and recovery

Date: 2026-10-30. Product: Forma. Development source checkpoint; final release validation is underway. The register contains **2,022 requirements: 1,059 implemented, 168 partial and 795 planned**. This is not complete Figma parity. The machine-readable [feature register](../public/features.json) and [implementation limits](IMPLEMENTATION.md) remain authoritative.

## Source scope

The Pages list adds duplication, drag/keyboard ordering, contextual actions, roving keyboard navigation, guarded deletion and temporary name filtering. Supported artwork and page metadata receive fresh internal identities; references to shared libraries and external local mains remain linked. Narrow overrides preserve copied internal links through component propagation without freezing unrelated main properties. Split component sets/mind maps and active presentation deck pages are refused. Document operations have one-step Undo and validated persistence; filtering does not edit the document. See [page scope](PAGES.md).

Design/Whiteboard pages remember bounded device-local pan/zoom and the last valid page choice, including same-ID reopen and page-changing Undo/Redo. Hydration gates cache tracking and stored cameras suppress the delayed initial Fit. One static hover/focus preview renders current page artwork with isolated SVG definitions, full-content bounds, transparency and no canvas/document mutation. Independent review caught and fixed stale hover timers after scroll and potentially quadratic namespace work on crafted imported IDs. See [camera scope](PAGE-VIEWPORTS.md) and [preview scope](PAGE-THUMBNAILS.md).

Preferences also adds live Follow system appearance with legacy-compatible explicit overrides, storage-event updates, reset and honest storage errors. It stays outside projects/history; four core and 12 independently run appearance/preferences/startup browser checks pass. Actual native appearance acceptance remains pending. The page-owned prototype-flow path now has a two-page authoring/Undo/recovery/explicit .oui-open/presentation regression.

Native PNG/TIFF Paste normalizes the first oriented frame to embedded PNG, preserving alpha and enforcing encoded/dimension/pixel limits before full decoding. The renderer revalidates input and checks that the document/page/target remains current after decoding. Insertion is an ordinary image layer with one Undo and saved pixels, including the active-slide route. See [raster scope](RASTER-CLIPBOARD.md).

The new native Copy as PNG source produces a transparent 2× raster snapshot of selected artwork, using the existing export renderer and its documented bounds. It is read-only and uses a fixed PNG representation through the existing single-use clipboard authorization boundary. Stale renders are canceled on document/page/selection/motion changes, editable focus or newer clipboard intents. The register keeps this command **partial until final native window acceptance**. Browser tests use an IPC fixture, not AppKit. See [PNG-copy scope](COPY-AS-PNG.md).

Saved-file MCP adds duplicate/reorder operations and shared guarded page deletion. Mixed batches reconcile component/layout/rich-text state at page-operation boundaries. A reorder-only transaction with no net change preserves exact bytes, revision, mtime and Undo history while still checking its revision and lock. Actual stdio schemas and saved-file Undo/reopen have coverage. See [MCP contract](../mcp/README.md#page-operations).

Browser startup waits for recovery before presenting editable controls, accepting keyboard edits or scheduling/flushing autosave. Controlled delayed IndexedDB tests reproduced the lost-inspector-draft and initial-sample recovery races, including forced hidden/pagehide events; regressions cover both. Storage-unavailable startup permits in-memory editing with a warning. Native ready-handshake commands become eligible after model hydration and document acknowledgment, before a potentially synchronous `desktop.ready` command callback.

## Additional integrated workflows

File information adds a plain multiline optional description, explicit Save/Cancel/Clear, real read-only project facts, a 10,000-unit limit and one-step Undo. Older documents remain compatible. Imported line endings and whitespace remain byte-identical until an explicit edit; restoring an older snapshot removes a newer optional description. Validation runs after derived state reconciliation and before timestamps/history change. MCP inspection and asset-omitted reads preserve a validated top-level description, including literal text beginning `data:image`; nested asset-shaped values retain the existing redaction rules. The outside-repository bundled-server test verifies the actual packaged behavior. See [file information](FILE-INFORMATION.md).

The new Move to page workflow transfers supported complete layer trees while preserving IDs, world geometry, paint order and shared definitions. It validates both the cloned candidate and the actual derived store result. Independent review caught interleaved flat-array paint order and unnecessary root-instance transform overrides; regressions now verify ordering and later live component rotation/flip/scale inheritance. Unsafe partial structures, incompatible page timelines and split references are refused. This requirement remains partial. See [move scope](MOVE-LAYERS.md).

Device-local sidebar controls collapse and resize both editor sidebars without changing the document, history or camera. Pointer and keyboard controls retain a minimum canvas width and responsive layouts; requested widths survive temporary viewport constraints. Review caught a narrow-viewport allocation that moved the grabbed edge backward; the allocator and pointer/keyboard regressions now cover that case. See [sidebar scope](SIDEBAR-LAYOUT.md).

Help and Actions expose bounded bundled release history, with the current source marked development and the existing dev.8 installer accurately identified. It is not a native updater. Generic dialog Escape now stops propagation before closing, preserving the canvas selection/tool and discarding unsaved description drafts. An independently reproduced Actions test setup race also now waits for the hydrated canvas before sending its shortcut. See [release history](RELEASE-NOTES.md).

## Evidence and acceptance boundaries

The isolated implementations passed core/build checks and independent targeted review before integration. Actual browser flows include page context/keyboard/drag operations, saved/reopened references, PNG/TIFF input, active-slide containment and decoding deliberately held across a page change. Four independently reproduced page-reference bugs were fixed and regressed: split component sets, inherited interactions, implicit swap defaults and split mind maps.

The earlier source checkpoint `a241a6b` passed **571 core tests across 54 files**, **221 production browser tests across 53 files**, **two development-module repository tests**, and **37 MCP tests plus its TypeScript check**. The additional integrated workflows pass **602 core tests across 58 files**, **two development-module repository tests** and **39 MCP tests plus its TypeScript check**; **240 production browser tests across 57 files pass** in 6.1 minutes. Independent final integration review also passes 29 targeted core checks, 25 source browser checks and five additional dialog-Escape/selection checks. The standalone bundled MCP server also passes its outside-repository/no-dependency-folder test. The full universal AppKit/WKWebView build succeeds for arm64 and x86_64; strict ad-hoc signature verification and bundled archive comparisons pass. This is a development build, not a notarized dev.9 release.

A combined core run exposed unnecessary camera-map sorting/rebuilding during every update and timed out its 1,000-view eviction case. Trimming now runs only when each independent map exceeds its bound; serialization still sorts by timestamp. The full core run passes without increasing timeouts, and the final ten camera checks include protection of a refreshed old record during the next eviction.

The first integrated browser run passed 219 and failed two motion setup clicks during a shared macOS sleep. Both traces paused together for about 977 seconds; the power log confirms Sleep at 02:34:44 +0200 and DarkWake at 02:51:02. All five motion checks passed in 5.4 seconds on rerun. The complete 221-test run then passed in 1.7 minutes under a test-process-scoped keep-awake assertion, without unlocking the Mac, changing permanent power settings or increasing test timeouts.

Earlier recovery investigation proved the initial-sample/inspector races and an ambiguous page-row selector; explicit regressions cover them. An earlier missing-row large-image import failure did not reproduce in 12 independent repetitions and subsequent integrated runs. Its original cause remains unknown; those repetitions are not a claim of a causal fix.

Integrated source at `63e2528` passed **20 standalone native PNG/order checks and 15 ImageIO raster checks**, with valid JSON and empty stderr. They use unique private NSPasteboards and do not launch a document window. MCP has **37 passing tests** plus its TypeScript check. The earlier isolated raster app passed 21 actual WKWebView/private-pasteboard checks; the new combined clipboard harness expects **29 checks**, including outgoing PNG, and still requires final runtime acceptance.

No test writes the user's general clipboard. Native document-window harnesses use nonpersistent WebKit storage, temporary files and isolated sessions; user projects, library records and saved windows remain outside them.

## Release status

The publicly downloadable notarized release remains **0.2.0-dev.8**. Do not publish the first dev.9 candidate preserved under `build/dev9-first-candidate/`: it predates the startup recovery fixes even though that earlier artifact received notarization.

Final dev.9 native window testing is blocked because the Mac is locked. The clipboard harness correctly rejected its inactive window; readiness/origin/nonce guards were not relaxed. The saved `oanarina-notary` Keychain profile was also inaccessible during the lock. Unlock locally, confirm native access and recheck the existing profile before diagnosing credential loss or rebuilding release artifacts. Passwords must not be supplied in chat or source. Rebuild the final integrated source, then require app/DMG Accepted results, stapling, Gatekeeper validation and exact native smoke JSON before publishing a new download.

## Website film

The public [Forma page](https://www.oanarinaldi.com/forma.html) uses the shared site header structure and a new graphic brand film generated from original artwork with Higgsfield. Scroll moves the video timeline forward and backward. It is labeled artistic brand imagery; actual app tutorial footage remains separate. Desktop/mobile/reduced-motion controls, public page behavior and exact downloadable release hashes passed publication checks. [Artwork, prompts and media provenance](https://www.oanarinaldi.com/docs/media/forma-brand-film/README.md) are public. Website commit `49470e1609a6ce59dfc624ef3315e1828390045d` was deployed successfully; its app download is still dev.8.

## Remaining scope

Page links, page sections and broader suite requirements remain unfinished. Moving layers between pages is partial with the explicit refusals described above. Duplicate does not clone the single active presentation deck; use its slide controls. Whiteboard timer/voting stays document-wide and existing votes remain on original nodes. Raster clipboard supports PNG/TIFF data only, first frame, without source metadata or file promises; no browser/Windows system-image or private Figma editable clipboard is claimed.

Actual Figma desktop component/background round trips, binary `.fig`, cloud collaboration, complete suite parity, full VoiceOver/localization/large-document performance acceptance and Windows release remain unfinished.

## Development artifact record

These are local, unpublished dev.9 build inputs/results, not public installer hashes:

- Universal native executable: SHA-256 `1e1f8874987177b48d2e3735db38c8556e6ef3c5f770e7c035684e20ef8cdedb`.
- Packaged renderer `index-CSyfaZJG.js`: SHA-256 `741b99ea02f8677e8e9cde7a6537a2de52c3bd97d5aab16db82407d9cf9ccb79`.
- Figma bridge ZIP: 28,708 bytes; SHA-256 `1fec8bfc42d64aec03128a392a42500ffe7027a7ce04043b6b1847359d6bc1d1`.
- Standalone MCP ZIP: 474,462 bytes; SHA-256 `78646c11df4cd2f7f01ba30fb8e327906287c7344bfbe734853a66efd3e6f326`.

App-bundled ZIPs match these source build inputs. The bundle retains `com.oanarinaldi.uitool`, short version 0.2.0 and build 10. Latest local evidence is in `build/test-core-integrated-dev9-workflows.log`, `build/test-production-dev9-workflows.log`, `build/test-development-dev9-workflows.log`, `build/test-mcp-dev9-workflows.log`, `build/check-mcp-dev9-workflows.log`, `build/build-mac-dev9-workflows.log` and `build/dev9-workflows-artifacts.json`. The earlier checkpoint logs remain available separately. Native UI release gates and a new final signed/notarized artifact are still required.
