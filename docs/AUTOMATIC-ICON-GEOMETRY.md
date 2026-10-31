# Automatic local icon geometry matching

In Inspect, select an eligible vector container to compare its authored geometry with the installed, licensed 1,951-entry Lucide catalog. Matching runs automatically in an owned local worker. Results show known catalog names and previews; Cancel stops the current worker and Retry starts a fresh comparison. Native keyboard activation stays in these controls.

This is a partial implementation of automatic icon detection. It compares normalized vector geometry, not semantic meaning, pixels or provenance. Container viewport dimensions normalize to 24 × 24 units; root placement/rotation, layer names, colors and stroke weights are excluded. Equivalent contour order, path direction and closed-contour starting anchors are accepted within 0.0001 normalized units. Multiple matches remain ambiguous. A match does not establish an asset's origin or license.

The first path supports a transparent container with ordinary visible vector leaves, at most 128 layers, 64 hierarchy levels, 2,048 anchors and 100 KB of source path data. Viewport edges must be 8–2,048 units. Hidden/composited artwork, masks, effects, networks, media, nested clipping and specialized strokes refuse. Geometry with different segmentation, raster artwork, external catalogs, semantic suggestions and automatic replacement are outside this subset.

The main thread sends only bounded numeric contour geometry plus the installed public catalog to the worker. Private layer names, IDs, text, hyperlinks, comments and image/font bytes do not enter its signature. There is no remote recognition or project upload. The catalog is fetched only from the app's fixed local resource, validated, and indexed with bounded decoded-anchor and comparison work. A 15-second deadline, explicit cancellation and source/session invalidation terminate owned work. Late results cannot publish after cancellation or an equal-final source cycle; only known catalog names can produce previews.

Artwork, selection, project persistence, Undo, clipboard and export are unchanged by matching. Optional metadata in `.oui` versions one and two is unchanged. No native IPC or filesystem permission expands. Browser/source tests do not establish native packaged-worker or assistive-technology acceptance. No downloadable app or automation archive is rebuilt for this source continuation.

## Source validation

Eight matching core tests pass, including actual decoded comparison of all 1,951 catalog entries, equivalent direction/order, ambiguity, changed geometry, private-field exclusion and bounded refusal. Together with the existing icon library checks, 15 related core tests pass. Nine new browser cases and six adjacent icon-library cases pass using real workers plus deliberately held worker callbacks for cancellation, deadline, source/local-session cycles and malformed replies. Editor TypeScript passes. Independent peer review identified the container independent-edge-width guard, corrected to use the shared effective stroke width and covered by a width-zero/nonzero-edge fixture.

These source checks do not verify packaged native workers, native assistive technology or Figma reference parity.
