# Typography, grids, local assets and export source continuation

This continues the [layout/media/SVG source pass](UNRELEASED-LAYOUT-MEDIA-EXPORT.md). The register now has **1,194 implemented, 182 partial and 646 planned requirements**, out of 2,022. Eleven more named requirements have validated implementation paths. PDF and PNG color-profile delivery add working partial paths; the earlier stroke-in-layout row is corrected from planned to partial to match its already documented limits. Exact Figma reference verification remains separate and pending; Forma is not a finished clone.

No app build, production bundle, installer, notarization submission, downloadable Bridge/MCP archive, version change or website deployment was generated. Existing dev.12 downloads remain unchanged. Source pushes run source checks without dispatching the manual Mac build job.

| Area | Reachable source behavior | Limits |
| --- | --- | --- |
| [Text variants](TYPE-VARIANTS.md) | Small caps, superscript and subscript for whole layers and rich character ranges; shared rendering/measurement, actual SVG glyphs, HTML clipboard, local styles/components, source MCP, Undo and portable files. | Small caps depends on browser/font shaping. Positioned text uses fixed 65% scale and baseline shifts; exact OpenType/Figma metrics remain unverified. Headless widths are approximate. |
| [Grid ordering](GRID-TRACK-ORDERING.md) | Row/column moves and contiguous blocks reorder track definitions with occupied cells, with preview, preserved spans, Undo, save and an atomic source MCP operation. | Automatic participating objects become explicit. Split spans and affected locked/managed cells are refused. Strict fixed row counts and layout suggestions remain unfinished. |
| [Local assets and styles](ASSET-USAGE.md) | Search linked token/alias/prototype/style/guide/component usages, navigate cross-page locations, export read-only reports, inspect conservative unreferenced candidates, and navigate slash-name folders. Local text/guide style paths are verified; updating text styles from selection is corrected. | Unknown/dynamic lookups and work caps are uncertain. External and literal consumers are not inferred; candidates are not deletion proof. No cloud library publication or delete-unused workflow. |
| [Design PDF](DESIGN-PDF-AND-PNG.md) | Combined or multi-frame PDF, transformed/overlap crops, hidden snapshots, guides, resolution independent of physical page size, immutable rendering and cancellation. | Flattened raster PDF; editable vectors/text and live hyperlinks remain unfinished. |
| [PNG color metadata](DESIGN-PDF-AND-PNG.md) | Browser-default, explicit sRGB-tagged and untagged output in profiles, combined exports and checksum ZIP assets, with validated settings and exact image-data preservation. | sRGB delivery only. Display P3, custom ICC, CMYK and wider document color management remain unfinished. |

Document metadata remains additive; existing `.oui` versions one and two are supported. Grid track arrays now support the solver's existing 4,096-track bound, with matching Bridge preflight. Shared validators reject malformed imported/stored values before mutation. The Bridge reports unsupported text/grid/export settings as omissions; source mocks do not establish a real Figma desktop round trip. No native IPC or resource-server permission was expanded.

Independent reviews checked PDF snapshot/crop/cancellation boundaries and text shaping, and found/fixed issues in grid hidden-axis placement and asset inspection. Alias-path allocation is bounded even for long chains; known text-property literals are not counted as component links; rejected/stale style drafts restore actual values. Uncertainty remains visible when scan budgets or dynamic expressions prevent a complete static answer. Fixtures contain only generated test data.

## Validation

Final integrated source validation on October 30, 2026 passes **997 core tests in 92 files**, **479 browser interaction checks**, **45 saved-file MCP source/protocol tests**, and both editor/MCP TypeScript checks. Tests ran directly against frozen source on a separate loopback browser origin, leaving the user's open document intact. A fresh local `.oui` backup was retained before applying the source update.

The browser run includes immediate keyboard Open without a prior pointer action. A test-only correction arms file-picker interception before navigation, avoiding Playwright's asynchronous subscription race; no production shortcut change was required. The final complete rerun passes all 479 cases.

The downloadable Bridge/source comparison, standalone bundled MCP acceptance, production bundle, native/WKWebView save/render smoke and real Figma desktop reference/round-trip checks remain deferred under the build/archive freeze. No deferred check is counted as passed.

Use `npm run dev` for the updated editor source. Installing the unchanged dev.12 download does not install these changes. The [feature register](FEATURE-REGISTER.md) retains every remaining partial/planned requirement.
