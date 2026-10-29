# v0.2.0-dev.7 validation — component interchange

Date: 2026-10-29. Product: Forma. This preview advances the supported editable Figma Bridge subset; it is not complete Figma parity or binary `.fig` compatibility.

## Scope and acceptance boundary

The bridge exports selected artwork with bounded, deduplicated cross-page component dependencies. Component sets are retained as native variant metadata; instances retain explicit source correspondence and supported override/property values. Import uses real Plugin API `createInstance()`, generated descendant mapping and native component property/variant methods. It retains inherited fields, restores original painter order after dependency-first creation and rolls back newly created pages on failures. See [the bridge contract](../figma-plugin/README.md).

Strict API-contract mocks test live source propagation, opaque generated child IDs, same-name sibling mapping, nested dependencies, differing/default/explicit overrides, property IDs and typing, fonts, variant switches, preflight errors and injected failures. Browser acceptance also imports a mock-API-exported project through the actual bridge dialog, edits its main, resets an override and checks its portable `.oui` save. The downloadable archive is checked against the current bridge implementation.

These tests do not establish actual Figma component acceptance. The connected-API attempt was stopped by the account's tool quota before any component content operation. The current desktop attachment is unavailable. No user Figma files, private IDs or account settings were changed or committed. Earlier connected shape/text/prototype fixtures do not establish component behavior.

## Current checks

- Core: **510 tests in 45 files passed**.
- TypeScript and production Vite build passed.
- Production browser: **174 tests passed**, 1.2 minutes, at a dedicated production preview origin `127.0.0.1:51987`, with existing-server reuse disabled. Output: `build/test-production-dev7`; log: `build/test-browser-dev7.log`. The two new checks cover the packaged ZIP and actual editor import/edit/reset/save workflow.
- Final Developer ID signed/stapled app: standard smoke and **37 actual native lifecycle checks passed**, with isolated storage and temporary files. Strict signature and staple validation passed; the universal binary contains arm64 and x86_64. Smoke reported Forma, 63 buttons, 2,021 feature entries, 1,959 Google families and 179 installed families. Intel execution remains untested; codec capability flags alone are not complete native encoding acceptance.
- Final app and DMG: Apple notarization **Accepted**, staple successful, Gatekeeper **Notarized Developer ID**; `npm run package:mac` exited 0. Log: `build/package-dev7.log`.
- Installer: `Forma-0.2.0-dev.7.dmg`, **32,465,919 bytes**; SHA-256 `ef3481fe8ec96cd44685717177809beec15cf1212a0b801bab408e0b1e02068a`.
- Bridge ZIP: **28,245 bytes**; SHA-256 `91d73fce077c56b0a9da9e4dd2be2de8ca67a455646449b325006fcfec9e5082`. The MCP archive is unchanged from dev.6 (same SHA-256); its previously accepted 27-test evidence remains applicable.
- Final native evidence for this session: `/tmp/forma-dev7-final-standard.stdout`, `/tmp/forma-dev7-final-lifecycle.stdout`, with empty respective stderr logs and valid strict signature output. No user project data or saved window sessions were modified by the harness.

Independent review found and reproduced three importer defects: dependency-first creation changed painter order, semibold overrides could select the wrong font style, and a root-bound visibility default could disappear. Regressions now pass after explicit sibling reordering, shared exact font-style matching, and detaching unsupported root-bound controls while retaining effective artwork. Unknown stale property values are reported. A mismatched source artwork/property default is reported because native property binding can materialize its default on the main.

## Website correction

Forma now uses the same `contact-area / bg-overlay / editor-breadcrumb` structure and shared scroll-video engine as Archi Tool and Photo Editor. The shared pinned header maps scroll position to video time, with motion controls, skip behavior and reduced-motion fallback. The product hero also uses the existing site's shared markup. Website verification and deployment have their own repository history.

## Register and limits

The register now has **2,021 requirements: 1,042 implemented, 162 partial and 817 planned**. Component identity across the bridge moves from planned to **partial**, because actual desktop component acceptance and fidelity work remain. Three missing slot requirements were added as planned after checking [Figma's public component-property documentation](https://developers.figma.com/docs/plugins/working-with-component-properties/): slot definition, editable instance content and reset. They are not implemented or counted as completed work.

Nested structural swaps, unsupported override fields and ambiguous trees become detached editable frames with transfer notes. Root-bound and multi-target controls, slots, exposed nested controls, variable bindings, preferred swap suggestions, persistent published-library identity and full property descriptions remain unfinished. Variant defaults follow Figma's spatial rule; differing Forma defaults are reported without rearranging artwork. Import/export bounds are documented in the bridge guide. Other geometry, typography, layout, image and prototype reductions from earlier previews still apply.

Full Figma suite parity, direct binary `.fig`, cloud collaboration and complete platform/accessibility/performance acceptance remain unfinished. This release adds optional component metadata without changing the `.oui` document version.
