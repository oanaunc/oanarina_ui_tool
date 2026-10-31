# Local platform batches

This pass follows the [sampled brushes, guidance and plugin inputs checkpoint](UNRELEASED-SAMPLED-BRUSHES-LEARNING-PLUGIN-INPUTS.md). Eleven independent batches landed together. The register holds 2,022 named requirements: **1,470 implemented, 337 partial and 215 planned**, up from 1,320, 317 and 385. Implementation and Figma reference verification stay separate, and full parity remains unfinished.

| Area | Reachable behavior | Explicit limits |
| --- | --- | --- |
| [Design health](DESIGN-HEALTH.md) and [local tools](LOCAL-TOOLS.md) | Seven headless audits with layer navigation and undoable fixes, a contrast audit, transfer forecast, export queue, palette exchange, code export, batch transforms, workspace layouts, side-by-side device preview, bug bundles and a privacy dashboard. | Rule counts, not a quality score. Code output is approximate and not compiled. Palette formats are tested with Forma's own writers and one hand-built file. |
| [Interface language](INTERFACE-LANGUAGE.md) and [accessibility](INTERFACE-ACCESSIBILITY.md) | Typed catalogs with full Romanian and an Arabic preview, RTL chrome, Intl dates and numbers, focus management, F6 regions and a measured keyboard and contrast sweep. | Romanian covers about 18% of interface literals, measured by test. VoiceOver and Full Keyboard Access are not verified, and no native speaker has reviewed the catalogs. |
| [Editor shell](EDITOR-SHELL.md) | Navigation rail, toolbelt modes, Draw mode, save and connection labels, inline errors, behavior preferences, file ownership labels and tabs. | Local labels, no accounts. New behavior preferences default to off. |
| [Local branches](LOCAL-BRANCHES.md) and [recovery](RECOVERY-RELIABILITY.md) | Three-way merge by layer identity with conflict resolution, branch review and protection, crash journal, persisted Undo, corrupt-file recovery, safe mode, renderer restart and multi-window conflict detection. | Single user. Protection is self-imposed. Journal replay is not validated inside WKWebView. Quota handling is tested with simulated errors. |
| [Shaders and color profiles](SHADERS-AND-COLOR-PROFILES.md) | WebGL shader fills, strokes and effects with ten original shaders, version pinning, Motion keyframes and a Display P3 document profile. | Shaders cannot sample layer pixels. Changing a profile assigns rather than converts. WebKit clips pattern paints to sRGB. Not exercised in the real shell. |
| [Sites](SITES.md) | Pages, breakpoints, overrides, CMS, interactions, metadata, forms, sandboxed embeds, local preview and static ZIP export. | No hosting, so Publish, Unpublish, staging, custom domains and analytics stay planned. Forms have no backend. |
| [Brand assets](BRAND-ASSETS.md) | Store-enforced template locks and slots, brand constraints, CSV batches, approvals, version compare, bulk export and a package format. | Single user. Sharing means passing a package file. |
| [Widgets](LOCAL-WIDGETS.md), [PowerPoint](POWERPOINT-INTERCHANGE.md), [Slides](SLIDES.md) and [Whiteboard](WHITEBOARD.md) | Sandboxed local widgets, .pptx read and write, video and prototype embeds, local polls, partial-stroke eraser, 22 shapes and no-fetch link cards. | No real PowerPoint or Keynote round trip yet; Quick Look rendered the output. Everything shared stays local. |
| [Code layers](CODE-LAYERS.md), [Code Connect](CODE-CONNECT.md), [Dev Mode](DEV-MODE-WORKSPACE.md) and [plugins](LOCAL-COMMAND-PLUGINS.md) | Sandboxed runnable code layers, hand-authored mappings and snippets, a guarded workspace, plugin interface, storage, image, font and export APIs, and allowlisted plugin networking. | Guest frames share the editor thread, so a runaway script can freeze the app. Dev Mode is an interface guard. No Figma API compatibility. |
| [MCP live context](MCP-LIVE-CONTEXT.md), [automation](MCP-LOCAL-AUTOMATION.md) and [Mac integration](MAC-SYSTEM-INTEGRATION.md) | One-way clean-window sync, opt-in live context, durable MCP Undo, a JSON automation CLI, native tabs, print, share, document versions and full native menus. | No new port or renderer request type. The opt-in sidecar can hold private artwork beside the project until sharing ends. No physical trackpad, printer or delivered share was tested. |
| Editor depth | Keyboard lists with Roman and composite numbering, exact [vector conic paints](CONIC-GRADIENT-PAINTS.md), [Boolean operands](BOOLEAN-OPERANDS.md), rounded edge strokes, multi-instance properties, [variable groups](VARIABLE-GROUPS.md), layout drag reorder, prototype radio and form simulations and timed scroll-to. | See each register note. Conic paints stop at 720 wedges and hard stops alias at device resolution. |

## Privacy

Forma's source is scanned for storage keys, network primitives and outbound targets. The dashboard states what is true: catalog fonts that are not bundled, cached or installed come from Google Fonts, which reveals the family, IP address and app version, and this cannot yet be turned off. Local plugins can reach only origins you grant for a run. Project content is never sent by Forma itself.

## Compatibility

New `.oui` data is additive and absent until used. Legacy files open unchanged. Files that use shaders, a color profile or code layers are refused by older builds; older builds open brand projects as ordinary Design files without enforcing locks.

## Validation

On October 31, 2026, combined source passes **3,117 core tests across 269 files**, **123 MCP tests** and editor and MCP TypeScript checks. The production build passes.

The final complete browser run recorded **2,211 passed, 8 failed and 1 skipped** on the same application source. Five of the eight pass alone at low load: `geometry-renderer-integration`, `motion-presentation`, `owned-edit-delivery`, `text-input-workflows` and one Sites preview check, so they are load-sensitive under parallel runs. Three were test defects and are corrected: a Sites read racing the next animation frame, a stale storage-full expectation and a locator ambiguous against the new error announcer. A complete rerun after those test-only fixes was not performed.

A universal build passes `--smoke-test`, lifecycle, clipboard, renderer restart, integration and synthetic `.fig` import checks. The integration run timed out twice during authoring at "second tab active" on development builds; the cause is unproven.

Merging exposed real defects the separate batches could not see. A Motion summary shrank the track area to 58 px. Page rows showed a focus tooltip over their own preview. Six storage keys and two databases were undeclared in the privacy dashboard, and plugin networking contradicted its "one outbound request" statement. The raster gradient and the Display P3 path had to be reconciled so vector conic paints keep profile colors.

Not done: a real Figma desktop round trip, real PowerPoint or Keynote opens, VoiceOver, physical trackpad and printer checks, and acceptance of Display P3, shaders and journal replay inside WKWebView. No app build, installer, notarization, version bump or website deployment is generated. Existing dev.12 downloads remain frozen.

Use `npm run dev` for these source changes.
