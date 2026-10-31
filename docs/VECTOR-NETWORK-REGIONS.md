# Vector network regions

This page describes version 2 graphs: one simple cycle with its fill on the layer. General faces, holes, per-face paint and flatten with fills are in [VECTOR-NETWORK-FACES.md](VECTOR-NETWORK-FACES.md), which replaces the single-cycle limits, refusals and stroke rules stated below wherever they differ.

## Working paths

- Select an eligible ordinary path with one closed contour, optionally accompanied by open contours. **Convert to stroke network** creates the shared topology and its cycle region. Open-contour conversion retains the version 1 forest workflow.
- In **Edit network**, choose two different vertices with **Connect from / Connect to**, then **Connect existing vertices**. Connecting within a tree creates its first cycle region; connecting different trees adds a bridge. A second cycle or crossing refuses before changing the document.
- Click inside the cycle on the canvas, or choose **Select cycle region**. The actual closed cycle, rather than an implicitly closed individual edge or the compatibility fallback, supplies its native SVG hit target. The selection also works when its fill is absent.
- **Fill selected region**, **Region fill color** and **Remove region fill** edit normal layer paint fields. Removal preserves region identity, topology and the last solid color for refill. Actual changes have one Undo; unchanged requests preserve bindings and history. A real paint change detaches competing paint bindings/styles as other authored paint edits do.
- A selected boundary edge cannot be deleted while its region is filled. After explicit fill removal, deleting that boundary edge downgrades the graph to a forest. Deleting a tree branch retains the cycle and region identity. Flattening a filled cycle refuses; remove fill first to flatten its stroke into independent ordinary contours.

The inspector permits at most **one total solid fill paint**, including hidden paints, on version 2 networks. Multiple hidden paints or hidden non-solid paints refuse atomically rather than being discarded by a region edit. This deliberately narrower scope also applies to imported documents.

## Geometry and rendering

Version 2 stores stable owner-local vertex, edge and region IDs. Each region contains a canonical oriented edge boundary. Removing all leaves identifies the unique cycle; its vertices must have degree two within that core. No angular face inference or automatic welding occurs. Every cycle has at least three distinct vertices and stable nonzero area. Exact de Casteljau splitting updates the canonical boundary while retaining the region ID; vertex and independent edge-handle edits retain it too.

The shared renderer and SVG exports use two explicit geometry roles:

1. One closed cycle-only path receives the solid region fill. Branches never enter this path.
2. One compound path containing every edge as an independent open subpath receives the existing centered round stroke. Junctions and crossings within this single stroke painting operation do not stack translucent stroke paint.

Layer opacity, ancestor transforms, reflections and path-basis scaling retain the ordinary Artwork pipeline. The shared control-hull/stroke envelope includes every cycle and branch, so automatic exports use conservative geometry bounds. They are not paint-tight bounds or a promise of extra antialiasing margins; an explicit frame/slice/export viewport remains an intentional crop.

The implementation follows SVG's separate fill/stroke painting and nonzero winding semantics, described in [SVG 2 painting](https://www.w3.org/TR/SVG2/painting.html#FillProperties) and [stroke shape](https://www.w3.org/TR/SVG2/painting.html#StrokeShape). These standards support this independent rendering contract; they do not verify Figma's region tool or arbitrary planar network behavior.

## Compatibility fallback

The outer `.oui` versions 1 and 2 remain readable. Graph version 1 forests and their generated path bytes are unchanged. Graph version 2 is an additive graph subtype with one region. New readers validate both versions before derivation. Older readers that explicitly validate only graph version 1 reject version 2 safely.

Every graph also stores an exactly validated generated ordinary `path` cache. For version 2 this is a deterministic Euler appearance walk: the cycle is traversed once and every bridge is traversed in both directions with reversed cubic controls. Ordinary readers that ignore graph metadata can display this appearance fallback. Its geometric fill agrees mathematically, but browser antialiasing can differ at boundaries; **raster equality is not promised**. The current renderer never fills this retraced walk. Removing fill keeps the fallback deterministic and restores the authoritative single compound stroke in current readers.

Five-decimal SVG presentation matches the existing path convention. Version 2 validates both stored-double geometry and, when different, its rounded presentation geometry, charging the same edge-pair budget. A collapsed vertex, new crossing or unstable zero-area face therefore refuses before publication. The cache must match its graph exactly; editing only ordinary path data refuses atomically.

## Limits and ownership

The existing network limits remain: 256 vertices, 256 edges, degree 16, 64 network layers and 8,192 total vertices/edges per project, 100,000 cumulative edge-pair checks, at most 20,000 page layers and 64 ancestor levels. Rounded-geometry validation may consume a second pair-check pass. Coordinates, control hulls and local/world stroke envelopes must remain inside the documented network bounds.

Networks remain independent leaf Design paths with one positive solid centered round-cap/round-join stroke. Profiles, dashes, arrowheads, effects, masks/clips, auto-layout, components, affected Motion tracks and Smart Animate are refused. Generic contour/Boolean/conversion operations continue to require explicit flattening. Locked or invisible ancestry and invalid/missing source ownership cannot be edited. Source, selection, mode, camera, local editing-session and local connection-candidate changes permanently invalidate retained callbacks. Existing gesture cancellation/foreign-pointer safeguards remain in force.

Clipboard and page copies retain owner-local graph IDs while remapping the owning layer. They do not merge unrelated vertices. Source MCP reads/replacements preserve validated v2 graphs and supports ordinary eligible pose/paint updates; direct graph patches and unsupported geometry/paint changes refuse before saving. Bridge import refuses all network metadata before writing Figma nodes. SVG carries current appearance as ordinary fill and stroke paths, not editable network topology. No binary `.fig` claim is made.

## Verification

Focused tests cover canonical boundaries, cubic split samples, stable identities, promotion/downgrade, second-cycle and malformed-boundary refusal, visible/hidden paint limits, forged path caches, presentation collapse, no-op bindings, one-step Undo, `.oui` import, source MCP atomicity and save/reopen.

Actual browser checks compare authoritative output against separate native cycle-fill and compound-stroke reference geometry with **zero RGBA difference** for local and rotated/reflected/nonuniform/path-basis fixtures. High-degree translucent junctions retain single-paint alpha. A separate legacy-fallback test intentionally uses a bounded antialiasing comparison instead of claiming exact pixels. Interaction checks cover native cycle selection at 125% UI scale, fill/remove/refill, closed-contour conversion, forest closure, cubic branching, destructive guards, stale source/local callbacks, actual SVG appearance reimport and malformed file chooser import.

No release, native build, archive, download or website changes are included.
