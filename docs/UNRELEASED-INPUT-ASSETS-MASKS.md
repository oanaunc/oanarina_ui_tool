# Text input, component assets, mask views and pointer precision

This continues the [editor workflow source pass](UNRELEASED-EDITOR-WORKFLOWS.md). The register now records **1,220 implemented, 184 partial and 618 planned requirements**, out of 2,022. Nine more named local requirements have validated paths; two emoji requirements gain explicitly partial implementations. Exact Figma reference acceptance remains separate and pending. Forma is not a finished clone.

| Area | Reachable source behavior | Limits |
| --- | --- | --- |
| [Pointer precision](POINTER-PRECISION.md) | Control provides finer movement, resize, rotation and vector-point/handle adjustment. Rotation feedback reflects snapped/stored angles; fine entry anchors to displayed geometry. Existing transforms, Motion, Undo and persistence remain in use. | Drawing/marquee/pan retain ordinary sensitivity. Normal snapping can quantize when re-enabled. Native pointer/trackpad acceptance remains pending. |
| [Mask views](MASK-VIEWS.md) | Geometry outlines distinguish sources, masked targets and context. Hover/focus previews Alpha/Vector/Luminance using the shared renderer without altering saved modes or exports. Escape and changed contexts cancel ephemeral views. | Path inspection does not trace raster-alpha/luminance contours; opacity/effects are bypassed in outlines. Descendants affected by ancestor masks use source/root controls. |
| [Local component assets](COMPONENT-ASSETS-BROWSER.md) | Slash folders, breadcrumbs, search/tag/page filters, variant choice/paging, explicit previews, source navigation and linked insertion across pages. Naming-path changes retain canvas parents and support Undo/save. | Local file only; bounded indexing/previews disclose omitted metadata. Oversized legacy sets remain readable but refuse unsafe path mutations. Global component-creation parity remains partial. |
| [Text inputs](TEXT-INPUT-WORKFLOWS.md) | Plain text accessibility descriptions, true fixed-pixel leading alongside multiplier/percent units, paragraph inheritance, styles/components, clipboard, source MCP and Bridge metadata. | Native VoiceOver/font-metric/reference acceptance remains pending. The legacy multiplier is a last-conversion fallback snapshot. Type-settings tabs remain planned. |
| [Emoji inputs](TEXT-INPUT-WORKFLOWS.md) | Searchable local Unicode picker, colon-code suggestions and explicit acceptance, with rich selection, guarded context, Undo/save and IME handling. | Partial: an 81-entry starter catalog, platform-dependent glyphs, no native OS picker, complete emoji namespace, skin-tone or flag controls. |

Document fields are additive and preserve reading existing `.oui` versions one and two. Validators reject malformed text-description/pixel-leading metadata before mutation. The Bridge source uses native pixel leading and omission reporting for unsupported metadata; API mocks do not establish a real Figma desktop round trip. No native IPC or loopback resource permissions change.

Review found and fixed precision entry jumping away from snaps, Escape swallowing an active drag in mask-outline mode, stale emoji-picker bookkeeping suppressing later text commits, spread-based height calculations overflowing on large valid text, missing variant options beyond page one, and unbounded catalog construction. Asset-preview SVG definitions are isolated from the canvas. Inspector CSS converts fixed leading into its chosen px/rem length unit.

## Validation

Final integrated source validation on October 30, 2026 passes **1,091 core tests in 100 files**, **554 browser interaction checks**, **48 saved-file MCP source/protocol tests**, and both editor/MCP TypeScript checks. The complete browser run passes on the frozen combined source. New browser fixtures use generated artwork, including actual pixels, mask coverage, SVG baselines, pointer gestures and clipboard/save behavior. Test origins remain separate from the user's open design, which was backed up locally before applying the source update.

No app build, installer, notarization, distribution archive, version change or website deployment is generated. Existing dev.12 downloads stay unchanged. Production/native/WKWebView checks, standalone bundled MCP acceptance, downloadable Bridge/source comparison and real Figma reference acceptance remain deferred under the build/archive freeze; none is counted as passed.

Use `npm run dev` for this source. Installing the unchanged download does not install these updates. The [feature register](FEATURE-REGISTER.md) retains every remaining partial/planned requirement.
