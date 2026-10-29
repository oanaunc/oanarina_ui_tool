# Oanarina Bridge for Figma

Local development plugin for exchanging **supported editable layers** through `.oui` JSON. This is an independent plugin using Figma's public Plugin API. It does not read or write binary `.fig` files.

1. In Figma **desktop**, open a design file, then Plugins → Development → Import plugin from manifest.
2. Choose `manifest.json` in this folder. Run **Oanarina Bridge** from Development plugins.
3. Export selection, current page, or all pages. Open the resulting `.oui` in Oanarina through File → Open project.
4. In Oanarina, save/export a `.oui`. In the plugin, choose that file to add editable pages to Figma.

Development conversion covers page structure, names/hierarchy, basic shapes, configurable polygons/stars/arcs, cubic vector paths, single-style text metadata, fill paint stacks, shared stroke geometry, supported shadows/blur, independent corners and row/column layout metadata. Fonts fall back with a report. Import creates new pages and rolls them back if an operation fails. Both version-one and version-two `.oui` documents are accepted.

Limits: gradients and rotation origin alignment are approximate. Complex gradient scale/skew, crop/rotation edge cases, mixed stroke widths/dashes, some sizing combinations and rich text need further work. Vector contours are fitted to the layer bounds, so contour offsets need review. Groups and sections import as frames; instances become independent frames. Boolean results become editable paths without operand linkage. Variants, overrides, live component identity, variables, annotations, comments, reactions and full grid layout are not maintained. Known reductions appear in the report, which is not an exhaustive loss detector. SVG assets embedded in `.oui` are rejected by editable import; export/place SVG separately.

Automated tests use an API mock to check interchange and rollback. Synthetic fixtures were also imported/exported through the connected Figma Plugin API on October 29, 2026: eight editable layers covered text, shapes, effects, vectors and auto layout, with a separate text auto-height regression check. That check fixed layout activation changing fixed dimensions and sizing assignments resetting text auto-height. The sanitized exported fixture is checked by the local document parser. This is not the desktop development-plugin UI path; a real desktop round-trip remains required before production compatibility can be claimed. Figma may restrict development plugins based on account/organization policy.

Public API references: https://developers.figma.com/docs/plugins/ and https://developers.figma.com/docs/plugins/api/properties/nodes-exportasync/.
