# Oanarina Bridge for Figma

Local development plugin for exchanging **supported editable layers** through `.oui` JSON. This is an independent plugin using Figma's public Plugin API. It does not read or write binary `.fig` files.

1. In Figma **desktop**, open a design file, then Plugins → Development → Import plugin from manifest.
2. Choose `manifest.json` in this folder. Run **Oanarina Bridge** from Development plugins.
3. Export selection, current page, or all pages. Open the resulting `.oui` in Oanarina through File → Open project.
4. In Oanarina, save/export a `.oui`. In the plugin, choose that file to add editable pages to Figma.

Supported: page structure, hierarchy, frame dimensions, layer names, rectangles, ellipses, default polygons and stars, lines, first vector path, single-style text, solid fills, first solid stroke, opacity, uniform corners, visibility, lock state, embedded raster images, basic row/column layout metadata. Fonts fall back with a report. Import creates new pages and rolls them back if any layer fails.

Limits: groups and sections import as frames; instances import as independent frames; variants, overrides and live component linkage are not maintained. Multiple fills/strokes, mixed text ranges, gradients, image adjustments/crops, nonuniform corners, parent rotation, complex vectors, auto layout alignment/sizing/grid, shadows and blur, variables, annotations, comments and prototype reactions are not faithfully preserved. Many detected reductions are listed in the transfer report; the report is not an exhaustive loss detector. Use SVG for visual fidelity and inspect every transfer. Embedded SVG images in `.oui` are rejected by the editable bridge; export and place SVG separately.

Automated tests use an API mock to check interchange and rollback. A real Figma desktop round-trip remains required before production compatibility can be claimed. Figma may restrict development plugins based on account/organization policy.

Public API references: https://developers.figma.com/docs/plugins/ and https://developers.figma.com/docs/plugins/api/properties/nodes-exportasync/.
