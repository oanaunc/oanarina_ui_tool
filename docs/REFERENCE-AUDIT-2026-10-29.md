# Figma reference audit — October 29, 2026

This audit records additional parity requirements found in the signed-in browser interface and current primary documentation. It does not establish complete coverage of Figma, implementation parity, or successful interchange. A visible menu item confirms that a control exists; it does not prove its behavior has been reproduced in Oanarina.

No reference document contents, file identifiers, account details or private screenshots are included here. Reference inspection was read-only: opening menus and inspecting controls, without editing the reference artwork.

## Surfaces and limits

- Browser editor: the main agent inspected the existing signed-in Figma tab. Generic menu observations below were supplied by that inspection. The independent audit agent's CUA inventory did not expose that browser, so it could not independently repeat those browser reads.
- Mac desktop: the first attempt reached a helper installation alert. After installation in Applications, repeated computer-control retries listed Figma as running, but the real bundle ID returned “Invalid app,” the application path resolved to the `com.figma.Desktop.dua` launcher, and the inner desktop bundle timed out. The main desktop editor remains inaccessible to this control connection; these failures do not establish desktop/browser equivalence.
- Official documentation: additional named behaviors were checked against the Figma Help Center pages linked below. Availability may depend on account, seat, plan, platform, browser capabilities and beta rollout. Documentation support is separate from an in-app behavior test.
- Oanarina MCP: its requirements come from the repository's [MCP guide](../mcp/README.md), rather than a claim that Figma offers an equivalent free server or equivalent tool semantics.

## Browser menu observations

The Vector menu exposed joining, smoothing a join, deleting points while healing the path, splitting vectors, simplifying paths and offsetting vector geometry. The observed Mac shortcuts included Command-J for joining, Shift-Command-J for smooth joining, and Shift-Delete for deleting with healing. Existing requirements already covered ordinary joining, splitting and simplification; their IDs remain `UI-14-021`, `UI-14-022` and `UI-14-035`.

The Preferences menu exposed separate geometry, object and pixel snapping controls; tool persistence; hover highlighting; duplicate naming; dimensions display; temporary UI hiding during adjustments; smart punctuation; flipping during resize; keyboard zoom targeting; inverted zoom; Control-click menus; number-key opacity; legacy outlines; modifier-assisted rotation; AI audio notifications; opening links in the desktop app; Agents visibility; wheel zoom; right-button panning; themes; color profiles; keyboard layout; accessibility/helper permissions; and nudge settings.

Several of those were already represented: numeric opacity shortcuts (`UI-42-025`), keyboard layout (`UI-42-015`), nudge amount (`UI-45-006`), document profile (`UI-05-024`) and theme choices (`UI-45-001`–`003`). The new requirements describe missing preference controls, without claiming that the controls are implemented or that changing them was tested in the reference file.

## Documentation-backed gaps

| Added requirement area | Evidence and practical meaning |
| --- | --- |
| Rotation origin, numeric scrubbing and alignment to a parent | [Alignment, rotation, position and dimensions](https://help.figma.com/hc/en-us/articles/360039956914-Adjust-alignment-rotation-position-and-dimensions) documents moving the rotation pivot, dragging property fields at adjustable speeds, and parent-relative alignment. It also distinguishes geometry snapping from object and pixel snapping. |
| Vector cutting, erasing and selected-point transforms | [Editing vector layers](https://help.figma.com/hc/en-us/articles/360039957634-Edit-vector-layers) documents tools that cut paths, remove areas of vector geometry, transform a point selection and switch edited layers. These are separate behaviors from merely deleting an anchor. |
| Offset geometry | [Offsetting a vector path](https://help.figma.com/hc/en-us/articles/33792861450263-Offset-a-vector-path) documents signed offset distance and the choice of corner treatment. These extend the earlier path-editing specification. |
| Brush types and sampling | [Illustration tools](https://help.figma.com/hc/en-us/articles/31440438150935-Draw-with-illustration-tools) distinguishes brushes stretched along a stroke from repeated brush motifs, and describes sampling an existing stroke's visual settings. |
| Text details | [Text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties) documents text trimming, alternative wrapping algorithms, hanging punctuation/list markers, list spacing, underline appearance controls, feature previews and line-height units. These are missing from the earlier generic text and underline requirements. |
| Smart punctuation and emoji completion | [Emoji and smart symbols](https://help.figma.com/hc/en-us/articles/360039957174-Add-emojis-and-smart-symbols-to-text) documents character substitution and completion beyond simply accepting emoji input. |
| Shader rendering and controls | [Using shaders](https://help.figma.com/hc/en-us/articles/41175721167767-Find-and-use-shaders) describes procedural fills, stroke use, effects that process existing pixels, stacks, configurable parameters, clipping, version updates, interactive previews and motion keyframes. These are not equivalent to a static bitmap or ordinary gradient. |
| Shader and plugin generation | [Creating shaders](https://help.figma.com/hc/en-us/articles/41147702210071-Create-shaders-with-the-Figma-agent) and [generating plugins](https://help.figma.com/hc/en-us/articles/43028920030743-Generate-plugins-with-the-Figma-agent) document agent-assisted authoring and iteration. Running an existing classic plugin does not fulfill these requirements. |
| Agent workflows | [Working with the agent](https://help.figma.com/hc/en-us/articles/37998629035799-Work-with-the-Figma-agent-in-design-files) documents voice input, attachments, library references, simultaneous tasks, chat visibility, undo, a detached desktop chat, skills, MCP connectors, web lookup, design critique and image vectorization. Each remains separate from merely displaying an Agents tab. |

## Additional SVG, mask and selection audit

The new layer-mask category adds 27 independently named behaviors, retaining existing requirement IDs. [Figma masks](https://help.figma.com/hc/en-us/articles/360040450253-Masks) documents alpha/vector/luminance modes, source stacking, nesting and mask interaction. [Layer selection](https://help.figma.com/hc/en-us/articles/360040449873-Select-layers-and-objects) documents parent-default hits, Command deep selection, double-click descent, hierarchy/sibling keys, overlap picking and layer-panel ranges. Implementation tests establish Oanarina behavior; direct desktop reference acceptance remains pending. Editable SVG import is checked against synthetic public SVG fixtures and the rendered output, with a reduction report for unsupported constructs.

## Free local MCP requirements

A new final category specifies the independent Oanarina server, so existing category numbers and feature IDs remain stable. The requirements include an account-free local stdio process, explicit project scope, no server usage subscription, schemas and summary resources, revision checking, validation, atomic writes and bounded inputs. The [official MCP server guide](https://modelcontextprotocol.io/docs/develop/build-server) provides protocol background; repository behavior is specified by the local MCP guide and checked separately by implementation tests.

The source lists nine tools: `inspect_project`, `read_nodes`, `read_document`, `read_design_system`, `apply_operations`, `replace_document`, `undo_transaction`, `validate_project` and `export_svg`. The new category names their actual responsibilities rather than inventing additional shipped tools.

Live document synchronization, live selection reads, editor screenshots, raster exports, asset imports, installed-font queries, coordination with native-editor writers and durable undo are also explicit requirements. Their presence in the specification does not claim they work in the current saved-file server. Model/host pricing remains separate from the local server's lack of usage charges.

## Register change policy

Additions are appended inside their corresponding groups in `scripts/inventory.mjs`; the MCP category is appended after all existing categories. No previous feature is removed or reordered. No implementation statuses are assigned by this audit. The register must be generated and implementation evidence recorded separately by the main agent.

This is an expanding requirements audit, not a complete inventory of every account setting, conditional submenu, contextual inspector, enterprise capability or product in the Figma suite. Further audits are still needed for selection-dependent controls, plugins, Draw internals, collaboration, Dev Mode, FigJam, Slides, Sites, Buzz, Make and native editor behavior.
