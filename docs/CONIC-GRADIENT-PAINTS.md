# Angular and diamond gradient paints

Angular and diamond paints used to render from a fixed 256 by 256 PNG stretched over the layer, which pixelated on large shapes and came out empty in headless export. Both now render as vector geometry inside the same object-box pattern, through `src/conic-paints.ts` and `src/components/ConicPaintDefinition.tsx`, so canvas, SVG, raster export and source MCP SVG share one path. No document data changes.

A diamond gradient is linear inside each rotated quadrant, so it is four polygons with four linear gradients: exact at any scale, including stop opacity. An angular gradient has no SVG primitive, so it is a fan of solid wedges. Every stop position is a wedge boundary, which keeps hard stops at their exact angle. Each interval gets one wedge per visible color step, capped at 720 wedges across the full turn, or one wedge per half degree, and at least one per 45 degrees. A very steep multi-stop angular gradient can therefore show single wedge steps at extreme size. Polygons use crisp edges, so neighbouring shapes leave no antialiased seam, even over transparent stops; a hard stop's edge is aliased at device resolution. Both paints stay in normalized box coordinates, as before, so a nonsquare box stretches them.

Stroke paints keep the original layer box, including independent edge rings. The inspector swatches stay CSS previews. Angular and diamond canvas handles are not part of this change.

Validation: `tests/conic-paints.test.ts` and `tests/e2e/conic-paints.spec.ts`, with analytic pixel samples, seam and step checks at 1600 pixels, 4x export detail and Undo. Native and exact Figma reference acceptance are pending.
