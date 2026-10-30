# Mask outlines and temporary mode previews

UI-60-023 and UI-60-025 now have shared-editor paths. This is local source implementation evidence; exact Figma reference behavior and native WKWebView acceptance remain separate.

## Dedicated geometry view

View → **Mask outlines view**, or the **Mask outlines view** checkbox in the Layer mask inspector, switches the canvas to geometry inspection. Teal identifies mask source paths and source-group descendants; purple identifies affected sibling artwork and its descendants; gray provides the remaining geometry context. Nested sources retain their own source classification, and source-group content is distinguished from masked target artwork. Arrowhead outlines use the same arrow-tip/path helpers as regular artwork.

This mode uses the shared artwork hierarchy, shape/text paths, transforms, reflections, scales and local/ancestor clips. Sibling mask consumption is deliberately bypassed to reveal the geometry of source and concealed artwork. Hidden layers/hierarchies remain hidden. Zero/partial opacity does not hide geometry outlines; effects, paint colors and blend modes do not determine outline appearance. Group/container boxes are geometry context, not a claim that every point inside them contributes mask coverage. Actual stroke thickness/blur boundaries, raster alpha edges and luminance contours are not traced. This is a path inspection mode, not an alpha-contour extractor.

Ordinary canvas editing/selection remains available. Enabling/disabling the view is not an edit; a later intentional drawing or transform still uses normal editor transactions. Escape from a canvas gesture cancels that gesture as usual while closing the view. Ephemeral outlines reset on document replacement/edit, page, editor mode, modal, Home, hidden UI and Motion context changes, even when no temporary mode preview exists. Selection can move between layers while inspecting the view.

## Mode previews

Select a mask source or one of its directly masked siblings. The inspector keeps its existing saved **Mask mode** selector and adds three explicit **Preview … mask** buttons. Hover or keyboard focus previews Alpha, Vector or Luminance on the canvas. Pointer exit/blur restores the prior view; when both are active, pointer hover takes precedence and then returns to the focused mode. Escape and window/document deactivation cancel temporary previews. Enter/click on these preview buttons never applies the mode; the saved selector remains the commit path.

A preview substitutes one source's `mask.mode` in an immutable canvas node array and renders it through the existing artwork mask engine. Other nodes and embedded assets retain their references. This preserves actual same-parent stack boundaries, nested mask semantics, effects, paint alpha/brightness, and hierarchy transforms. A mode preview temporarily pauses both outline views to show the filled mask result, then restores the chosen outline view. Locked sources can be previewed because previewing does not change them.

Preview state captures the live document reference, page, selection, editor mode, modal, Home/hidden UI and Motion state; changed contexts cancel it. A canvas pointer interaction clears a temporary preview before an editing gesture starts. Removed sources and invalid modes are rejected. An old pointer exit cannot revive a cancelled preview.

## Persistence, exports and limits

Both views live in an independent ephemeral UI store. No document/schema fields, migrations, project assets, native permissions or IPC were added. They create no document history entries and do not change `.oui` saving. SVG/PNG/JPEG export and headless rendering call the normal artwork renderer without editor view options, preserving the saved mask interpretation. A preview does not promise altered export output.

Mode previews inherit the documented local mask renderer contract, including opaque nested mask evaluation inside an outer vector source. They do not establish exact Figma nested/effect/font equivalence. Preview controls are available for the source or its direct sibling run; for a descendant affected by an ancestor's sibling mask, select that source/root to preview it. Slides has its own renderer and is excluded. Video masks continue to use the existing poster contract. Native VoiceOver and native renderer acceptance remain unverified.

## Evidence

`tests/mask-view.test.ts` verifies nested/interleaved source/target classification, one-source structural sharing, malformed source/mode refusal, read-only locked sources, unchanged history/export output, and cancellation across editor contexts without depending on a browser.

`tests/e2e/mask-view.spec.ts` verifies real hover/focus controls and actual canvas alpha values, unchanged saves/history/SVG during active preview, source/group colors and reflected/rotated ancestor matrices/clips, hidden and transparent sources, cancellation, normal Undo behavior and Escape during an active transform. Adjacent mask/indicator browser checks cover alpha images, vector image outlines, luminance, stroke-only masks, blur, group/glyph coverage, nested sources and large source scales. No native builds, release archives or central feature register edits are part of this source task.
