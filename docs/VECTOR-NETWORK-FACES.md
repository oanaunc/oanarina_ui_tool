# Vector network faces

Version 3 graphs make a network a general planar graph: any number of cycles, faces and holes, each face with its own paint. This covers UI-14-026, 027, 028, 033 and the network side of UI-16-021. It is Forma's own implementation and has not been checked against Figma's reference behavior.

## Working paths

- **Convert to stroke network** accepts any contour path. Coincident anchors weld, every crossing becomes an explicit junction, and each enclosed area becomes a region. A nested contour is a hole in the face around it, and is its own region inside. Faces keep the fill the source path gave them under its own winding rule.
- In **Edit network**, click inside any face, or pick it from **Network region**. Each face has its own color field, Fill and Remove buttons, and the full fill stack, so it can hold solid and gradient paints.
- **Connect existing vertices** or **Draw network branch** across a face splits it, and both parts keep its paint. A connection that crosses an edge adds a junction there. Overlapping an existing edge refuses, because no single junction describes that.
- Deleting a shared edge merges the faces around it, and the larger painted neighbor keeps its paint. Deleting the last edge of a boundary removes that region. **Merge with region N** removes every edge two neighbours share. Delete also removes a selected vertex with its edges.
- **Flatten network to contours** keeps the picture. Without fills it gives one open contour per edge, as before. With one paint stack, filled loops stay closed on the layer with an even-odd fill, and remaining edges stay open. Each further paint stack becomes its own fill layer directly below the stroke layer, in one Undo step.

## Format

`vectorNetwork.version` is now 1 (forest), 2 (one simple cycle, fill on the layer) or 3. A graph takes the smallest version that holds it. One simple cycle with one solid paint stays version 2, so documents not using the new feature save exactly as before. Version 3 never returns to 2, because its paint lives on regions.

A version 3 region is `{id, loops, paints?}`. `loops` holds oriented edge references, and `paints` holds 1–16 solid or gradient paints. Regions are checked against faces derived again from the geometry: a forged, reversed or missing loop refuses, as do unsafe region identities, image and shader paints on a region, and layer-level paint on a version 3 layer. The generated `path` cache is the chained stroke geometry.

Faces come from the rotation system at each shared vertex. Tangent ties compare where curves actually separate. Bridges and dangling branches are removed from a face walk, and the rest splits into simple loops at repeated vertices. A disconnected component inside a face is assigned to the innermost face holding one of its vertices. Region identity follows shared half-edges across edits; a face nobody named gets a deterministic id from its edges.

**Older builds:** a file containing a version 3 graph is refused by earlier Forma builds, as is a network whose stroke now uses dashes, butt or square caps, or non-round joins. Version 1 and 2 graphs with their original strokes still open there.

## Strokes and hierarchy

Networks now take any stack of up to 16 centered strokes, including dashes, caps, joins and gradients, on every graph version. Version 3 graphs, and any graph with a non-default stroke, chain edges through degree-2 vertices, so joins and dashes run through them. At junctions of three or more edges each edge ends in its cap, so butt caps leave a notch there.

A network must keep a visible stroke or a filled region. Fill-only networks are valid and can enter Shape Builder.

Effects, masks, clipping frames, auto-layout ancestors, component definitions, instance copies and layer Motion tracks (position, size, rotation, opacity, scale) no longer refuse. Instance copies stay read-only until detached. An effect region covers the network's control hull.

## Remaining limits

- Crossings are only resolved when edges are created. Moving a vertex or handle across another edge still refuses.
- No region image or shader paints. Region paints do not appear in selection colors or asset usage panels.
- Fill and shader Motion tracks on a network refuse, and Smart Animate of a network refuses.
- A live Boolean operand must still be flattened. Filled regions cannot be operands.
- Bounds: 256 vertices, 256 edges, degree 16 and 100,000 edge-pair checks. Crossing detection uses Paper's cubic intersection with fixed tolerances, not exact predicates.
- Editable Figma Bridge transfer refuses networks. SVG carries the picture as ordinary paths.

## Verification

`tests/vector-network-faces.test.ts` and `tests/vector-network-merge.test.ts` cover area, wheels, holes, deep nesting, bridges, cut vertices, equal-tangent curves, order independence, identity across edits, crossings, conversion by winding rule, forged documents, flatten and the paint editor. `tests/e2e/vector-network-faces.spec.ts` drives conversion, canvas face picking, per-face color, Undo, save, exported pixels, connection and branch crossings, deletion, mixed flatten, effects, masks, auto layout and instance copies in Chromium. WKWebView and the native shell were not run.
