# v0.2.0-dev.8 validation — Mac clipboard and canvas inspection

Date: 2026-10-30. Product: Forma. This is a signed/notarized Mac development preview, not complete Figma parity. The register contains **2,022 requirements: 1,045 implemented, 164 partial and 813 planned**.

## Implemented scope

Native Copy/Cut/Paste now transfers supported editable selections between independent Mac document windows. Transfers include required component/variant definitions, styles, variables, guide styles and used embeddable fonts, with fresh destination identities and one undoable edit. An exact same-session copy receipt can preserve existing local links. Incoming references are validated before mutation; coincident IDs never authorize binding to unrelated destination definitions. Failed or stale writes do not remove source artwork. Cutting mains still referenced by surviving content is refused before writing.

The implementation preserves legacy instance overrides, inherited versus owned variable modes, component definition context, and fixed nonpainting ancestor containers. Regressions exercise the actual derived store pipeline, including component propagation, design-system resolution and layout. Whole-set Cut removes its metadata atomically; Undo restores it. See [clipboard contract](NATIVE-CLIPBOARD.md).

Per-page canvas color, opacity and visibility persist in `.oui`, inherit on new pages and support Undo/theme reset. Canvas color stays outside artwork exports and prototype backgrounds. The optional field remains compatible with older v1/v2 files; its single-solid Figma Bridge path has API-contract mock coverage. See [canvas background scope](CANVAS-BACKGROUND.md).

The inspector also provides a nonmutating explicit color-pair contrast checker, with foreground alpha compositing and unrounded AA/AAA comparisons. This is not an automatic canvas/document accessibility audit. See [contrast scope](CONTRAST.md).

## Validation

- **535 core tests in 48 files passed**, including the final packaging run. TypeScript and production Vite build passed.
- **182 production browser checks passed** at an isolated production origin, with existing-server reuse disabled. Log: `build/test-browser-production-dev8.log`; output: `build/test-production-dev8`. The final renderer remains `index-Dwcexzai.js`, SHA-256 `456e406e92a039b7d95944f1553c464b236de5bccab1a695a4329c3a822cc1f7`.
- **2 development-module repository checks passed** on a separate development server. These tests deliberately import source modules and do not run against a static production preview. Final log: `build/test-browser-development-dev8-final.log`. Development dependency scanning is now restricted to `index.html`, avoiding native installer staging's `/Applications` shortcut.
- The final bridge archive was rechecked through the actual download UI, with editable import/main-edit/reset/save acceptance and a public guide-link regression. Log: `build/test-dev8-publish-bridge.log`. App-bundled bridge/MCP archive hashes match their public build inputs.
- **27 MCP tests and MCP type checking passed**, including real stdio SDK discovery, selected-file editing, revision/lock checks and packaged server behavior. Logs: `build/test-mcp-dev8.log`, `build/check-mcp-dev8.log`.
- The exact final Developer ID signed/stapled app passed standard native smoke, **15 actual clipboard checks and 37 native lifecycle checks**. All three exited zero with parsed JSON reports; respective stderr logs were empty. Clipboard tests use two real WKWebViews and an isolated named pasteboard, never the user's general clipboard. Native state reported Forma, 66 buttons, 2,022 requirements, 1,959 Google families and 179 installed families.
- Strict signature, staple and universal arm64/x86_64 validation passed; native build number is **9**. Apple accepted both app and DMG, stapling succeeded, Gatekeeper reported **Notarized Developer ID**, and `npm run package:mac` exited zero. Log: `build/package-dev8-publish.log`. Runtime checks used Apple silicon; Intel hardware remains untested. Codec capability flags alone are not complete native video-encoding acceptance.
- Final native evidence: `/tmp/forma-dev8-publish-{standard,clipboard,lifecycle,signature,staple}.{stdout,stderr}`. The app exited and released port 51981. User projects, saved sessions and general clipboard were not modified by the harness.

An earlier candidate's lifecycle test twice exited without a report. The identical signed binary later passed all 37 checks from an isolated working directory; the initial cause was not established. The harness now waits for the default run loop and idle sheets before a synthetic Quit, reports success at actual termination, and fails incomplete termination. An intentionally incomplete diagnostic fixture exited one at 5/37 checks without a success report. Normal product quit logic is unchanged. Earlier unpublished candidates remain outside release outputs for audit.

## Final artifacts

- `Forma-0.2.0-dev.8.dmg`: **31,747,674 bytes**; SHA-256 `9d6ec589ee35058b1e7b55aa87214dd6d6cc7a390459aa06405a9e23dd90a716`.
- `figma-bridge.zip`: **28,708 bytes**; SHA-256 `062cb2e6886a5f983d80beea20ec6f4603c80b5c7ef23dbfc75d9522f1d91337`.
- `oanarina-mcp.zip`: **469,687 bytes**; SHA-256 `a080dff8f70b3f6be56406fdc8ba132e68a14a4a90c65ca846fa5fcae34c7462`.

The companion website has separate publication and public-download checks. Its generated graphics film is artistic branding, not footage demonstrating implemented app behavior; tutorial recordings retain their own capture provenance. Public guide links do not require application repository access.

## Remaining acceptance and scope

Clipboard limits include 20 MB combined representations, 20,000 layers, 100,000-character external text, supported geometry/reference closure, and no raster-image or private Figma clipboard. External SVG uses reviewed design-canvas import; SVG into slides/containers is refused. Variable/conditional prototype actions, timelines, comments and page backgrounds do not travel through this clipboard. Root external context can be materialized; copied definitions are independent across documents. See the full contract before relying on advanced transfers.

Actual Figma desktop component and page-background round trips remain unverified. The account's connected-tool quota blocked the previous component acceptance attempt; mocks do not replace it. Direct binary `.fig`, cloud collaboration, full Figma suite parity, complete VoiceOver/localization/large-document performance and Windows release work remain unfinished. [Implementation limits](IMPLEMENTATION.md) and the per-feature register remain authoritative.
