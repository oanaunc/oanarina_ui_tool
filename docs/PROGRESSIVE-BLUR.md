# Progressive blur

The Effects inspector provides **Progressive blur**, with editable start/end radii, direction, and start/end percentages. Add an effect and select its type. It works on ordinary shapes, images, text, and bounded container subtrees through the shared Artwork renderer, including stacked paints and effects. Each accepted control change is one Undo step. Effects can be hidden, duplicated, reordered and removed. Existing effect styles, component propagation/instance overrides, clipboard transfer and .oui persistence retain the new parameters.

**This is a partial implementation: a bounded nine-level approximation, not an exact continuously variable Gaussian or native Figma effect.** The renderer computes nine uniformly blurred versions of the preceding effect-stack image and linearly blends neighboring levels according to position. It produces a real spatial change in blur. It does not substitute one whole-layer Gaussian for the requested progression. The fixed level count limits rendering work; certain artwork can reveal changes in the interpolation derivative. Native Mac/WebKit and Figma reference acceptance remain unverified.

## Coordinates and composition

The nominal layer box defines a projected directional axis. At 0° the axis runs left to right, at 90° top to bottom; diagonal angles use the actual pixel aspect ratio. Start/end percentages select a portion of this axis, at least 1% apart. Outside this portion, the nearest endpoint radius stays constant. Radii can increase, decrease, be equal, or both be zero.

Direction and radii live in the filter coordinate system: before the layer's outer translation/rotation and after its own inner flip/scale, matching the placement of Forma's existing layer filter. Consequently own flip/scale changes the artwork inside the nominal effect box; it does not also flip or scale this directional field. Ancestor transformations transform the complete result normally. This coordinate policy is explicit and is not a claim of exact Figma transform behavior.

Each generated weight is a self-contained SVG containing only a rectangle and a linear gradient. Its viewBox and feImage placement map the complete filter region one to one. Triangular weights form a partition of unity, including both endpoints and outside the axis. The renderer multiplies each blurred input by its weight alpha and adds premultiplied results with arithmetic composites. It does not stack weighted layers with source-over, which would introduce seams and incorrect alpha. Equal endpoint radii collapse to the ordinary single Gaussian operation; two zero radii preserve the input.

Filter operations use sRGB, like the existing effect renderer. Effect list order follows the existing reverse-stack pipeline: progressive blur consumes the previous stack result. Ordinary shadows retain their existing SourceAlpha semantics. Alpha/luminance sibling masks receive the filtered result; vector masks deliberately ignore effects under existing vector-mask rules. Container clipping occurs on its contents before its own filter, so blurred pixels can extend beyond that content clip. Ancestor clips still constrain the result.

These primitives follow the [W3C Filter Effects specification](https://www.w3.org/TR/filter-effects-1/), particularly feImage, feGaussianBlur and arithmetic feComposite. Browser pixel tests, rather than the specification alone, provide the implementation evidence.

## Data and validation

The existing effect array adds a real `progressive-blur` discriminator. Common `radius` stores the end radius. Its required optional-type metadata is:

```
progressive: {
  startRadius: number,
  angle: number,
  start: number,
  end: number
}
```

Start/end radii are 0–128 design pixels, angle ±3,600°, and start/end normalized to 0–1 with a minimum 0.01 span. Offsets and spread must be zero for this type. Common color/opacity fields remain part of the shared effect record; as with ordinary layer blur, those shadow parameters do not control the blur. Progressive metadata on another effect type, unknown metadata keys and nonfinite/out-of-range values are refused. Switching type removes incompatible metadata.

Legacy documents/effect types and their absent fields are unchanged. New data saves and reopens with the current .oui version 1/2 reader, without a format-number bump or migration. Earlier Forma readers can refuse this new effect discriminator. Imported input is validated before document mutation. Source MCP `update_node` and design-system operations use the same validation; no new asset endpoint, filesystem access or external service is introduced.

Metadata/count preflight occurs before geometric region work and before editor derivation. The final document is checked again after normal component/style/layout derivation. All counts include hidden entries and reusable style definitions as well as applied layer entries. Limits are:

- Two progressive effects per stack and 32 entries per document across definitions and layers.
- At most 64 million summed filter-region pixels, counting each applied progressive entry.
- Each filter region at most 4,096 pixels per axis and 16 million pixels.
- Each filtered subtree at most 512 layers, 64 acyclic levels, and 200,000 geometry inspection units (text/path/outline characters plus eight per anchor).

Over-budget or controlled edits refuse atomically, preserving styles, document and Undo history. Invisible progressive effects still need valid bounded source geometry; activating an invisible effect can require additional padding and therefore be refused if it exceeds the region budget.

## Bounds and fonts

A progressive filter's conservative region includes nominal box geometry, curved control bounds, bounded raw SVG paths/imported text outlines, stroke/miter/arrow bounds, descendant transformations/effects and the maximum endpoint radius. Own flip/scale is applied before its own blur padding. Descendant rotation/effect padding is retained in the correct order. Clip and mask reductions are not used to shrink this region, so a large clipped-away child can cause an explicit budget refusal.

SVG Gaussian tails are bounded to the existing four-standard-deviation outer padding. Export and sibling-mask bounds include the same progressive subtree region; group overflow is not silently cut to its nominal box. Region boxes are conservative, not tight Bézier/paint/alpha bounds. Ordinary effects without progressive blur retain their previous filter-region branch.

Plain text uses the shared line layout and generous two-em glyph/marker overhang padding. These are layout/font metric bounds, not a proof for every possible installed font's ink. Imported retained outlines use their actual vector geometry. Headless text measurement and installed-font availability keep the existing documented approximation limits. Fonts are not uploaded by this workflow.

## Interchange and checks

Editor SVG/raster exports use the actual shared effect renderer. Source MCP SVG uses the same self-contained filter and reports the nine-level approximation and absence of native effect editability. Existing SVG receiver/filter/font support limits remain. The standalone Figma Bridge refuses this unsupported effect before creating a page or nodes; it does not convert it into a shadow or silently export a uniform blur. Bridge export from Figma still explicitly reports its existing progressive-to-uniform downgrade. Binary .fig progressive import/export parity is not added by this pass.

Core tests cover axes/weights, safe mask images, metadata/version compatibility, legacy effects, count/style/pixel/geometry budgets, transformed subtree/export/mask bounds, raw paths and imported outlines, effect pipeline order, styles/components/clipboard, Undo/Redo, atomic refusal, standalone Bridge refusal and scoped source MCP operations. Actual browser checks cover sharp-to-blurred pixels in Canvas/editor SVG/headless SVG, semitransparent seam/alpha/color preservation, signed direction/extents/diagonal axes, masks, own transforms/overflow/clipping, equal/zero radii, ordinary shadow order, controls, saved reopening, styles/components/clipboard, retained callbacks/numeric drafts, locks, and the inspector at 1280×720 with 125% UI scale. Synthetic local fixtures are used throughout. No native builds, release packages or reference-parity claim are part of this pass.

## Motion compatibility

The first implementation accepted geometry keys whose sampled frame could exceed the source filter-region budget. For example, a 100×100 layer with a 1→100 horizontal-scale track passed base validation but failed during sampled rendering. This is now refused before imported/editor/scoped-MCP mutation and before `sampleMotion` clones or renders a frame.

Progressive-filtered subtrees currently support **opacity and fill Motion only**. Nonempty x/y/width/height/rotation/radius/scaleX/scaleY/text tracks anywhere under a progressive root are refused, including constant tracks and hidden tracks/effects. This conservative restriction avoids having to guess easing/spring extrema or font/layout bounds between keys. It also applies when an effect style, component derivation or Motion style introduces the combination. Unapplied reusable Motion-style definitions may still exist. Unrelated geometry animation remains available outside filtered subtrees, and ancestor transforms outside a filtered subtree retain the normal renderer behavior. Remove incompatible geometry/text keys or remove the progressive effect to use those animations.

Focused regressions cover the original accepted-source/sampled-render failure, atomic imported-file/keyframe/Motion-style/scoped-MCP refusal, hidden and descendant tracks, unrelated animation, and actual allowed opacity scrub/playback pixels with no page errors. This is an explicit partial Motion policy, not a promise of animated progressive geometry.

Temporary canvas drafts are checked before publication, including resize/move/point edits and Bend, crop, gradient, eraser and multi-vector callback previews. Exceeding a progressive-region budget cancels the gesture and clears its draft; releasing the pointer cannot commit an earlier partial scene. The same full-project count/region check includes reusable style definitions and other pages. Modifier-only updates cross the same boundary.

Prototype variable and variant derivation is checked before a state/action result is returned or installed. Smart Animate involving a progressive-filtered presented frame/overlay subtree is explicitly refused: spring overshoot, intermediate rotations and entering/exiting effect copies do not have a proven bounded region. Instant, dissolve and move transitions remain available. A later font-metric change can invalidate a previously safe transient presenter state; a local presentation boundary pauses that presentation with an explanation and Back/Retry controls, preserving the source document and history. Retry restarts transient presentation state. This is a refusal policy rather than continuous geometry-Motion compatibility; progressive blur remains partial.
