# Shaders and document color profiles

Forma shaders are WebGL 1 fragment programs. Display P3 is a per-file working space. Both are additive: a file that uses neither gains no new keys and exports the same bytes as before.

## Shader data

`Paint.type==='shader'` and `Effect.type==='shader'` hold a `ShaderBinding`: shader ID, pinned version, parameter values, poster time, seed and an `animate` flag. A paint keeps its `color` and `stops` as the static fallback.

- **Bundled shaders** live in `src/shader-catalog.ts`. They are original to Forma, use no third-party code and need no network.
- **File shaders** live in `DesignDocument.shaders`. They start as a duplicate of any shader and keep up to 16 append-only versions. Up to 64 fit in a file, each version up to 20,000 characters.
- **Pinned versions.** A binding keeps its version until the user presses Update shader. Superseded source stays available, so a pinned layer renders as it did when it was saved. A newer version shows an update indicator on the layer's controls.
- **Missing shaders.** Bindings that point at a shader not in the file are valid. Pasting into another file does not bring a file shader along. The layer shows its fallback and the inspector says why.

## Containment

Everything that touches GL is in `src/shader-runtime.ts`.

| Risk | Handling |
| --- | --- |
| Unsafe source | `shaderSourceIssue` refuses `#extension`, `#version`, `#pragma`, `#include`, `#line`, samplers, `discard`, direct `gl_FragColor` writes, non-ASCII and oversized source before compiling. Imported files are checked before they become the document. |
| Data access | Shaders receive uniforms only. No textures are ever bound, so a shader cannot read layer pixels, file data or other images. Output reaches only a private canvas, and the result is a PNG string in a cache. Shader code has no route to the document. |
| Loops | WebGL 1 GLSL rejects `while` and non-constant `for` bounds at compile time. |
| Compile failure | Reported in the source editor with the compiler log, and in the preview status. The layer paints its fallback. A bad shader cannot be saved from the editor; one arriving in a file fails safely. |
| Slow draws | Frames draw in 48-row bands, syncing after each band. Past the budget (250 ms live, 4 s export) the frame is abandoned and retried at half resolution. Below 32 px it reports `budget` and paints the fallback. The affordable size is remembered, so an expensive animation pays once. |
| Context loss | `webglcontextlost` clears programs and cached frames, and affected layers repaint with the fallback. `webglcontextrestored` rebuilds state and repaints. |
| No WebGL | `acquire()` returns null and every caller receives `unavailable`. Headless tests, the document model and static rendering work without a GPU. |

The band sync bounds time between checks; it cannot interrupt a single band already on the GPU. A pathological shader is limited by the band size and, beyond that, by the browser's own GPU watchdog, which surfaces as context loss.

## One render path

`bindingFrame` is the only route to pixels. Paints become an SVG `<pattern>` containing an `<image>`, or a clipped `<image>` for Display P3 fills (see Limits). Overlay effects become an `feImage` in the existing effect filter. Because the canvas, thumbnails, prototypes and `exportSvg` all render `Artwork`, the same code serves every output.

| Output | Shader result | Resolution |
| --- | --- | --- |
| Canvas | PNG frame in the SVG | Up to 1024 px per edge at 1x or 2x device scale; 384 px during Motion playback |
| SVG | Embedded PNG. Shader source and animation are not exported; a `<desc>` says so | Up to 2048 px per edge at the export scale |
| PNG and JPG | The SVG above, rasterized | Same limit, so larger exports upscale the texture |
| PDF | Page raster of the SVG above | Same limit |
| GIF and video | Sampled frame by frame | Same limit, and the export's 4096 px bound |

The canvas does not re-raster on zoom, so a shader looks soft at high zoom. Exports are unaffected.

## Effects

Overlay mode composites the generated texture with a blend mode and opacity. Clip texture to layer intersects it with the layer's alpha through `feComposite`. Turning clipping off draws the whole layer box, with an optional outset.

Displace mode feeds red and green into `feDisplacementMap`, which bends the rendered layer.

Effect shaders generate a texture. They do not sample the layer in GLSL, because SVG filters cannot pass rendered pixels to WebGL synchronously. Effects that need to read the layer inside the shader are not available.

## Motion

- `sampleMotion` adds playhead time to animated bindings on sampled copies. The saved poster time never changes.
- Tracks use the property `shader:<fill|stroke|effect>:<id>:<param>`. Numbers interpolate, and colors interpolate per channel.
- A track whose paint was removed is ignored. Shader tracks are left out of portable animation styles because they name a specific paint.
- The Motion inspector offers Keyframe buttons for each parameter and an Interactive shader preview toggle. The toggle feeds the pointer to the hovered layer on the canvas. Pointer state is transient: it is not saved, not undoable and absent from exports.
- The inspector preview plays only when asked. With Reduce Motion on it stops after one short run.
- Frame preview requires ordinary changing keyframes, so a layer with only shader time does not open that preview. Interactive pointer input does not reach Motion frame preview or prototypes.

## Document color profile

`DesignDocument.colorProfile` is `'display-p3'`, or absent for sRGB. Writing sRGB deletes the key. Change it in File information. It is one Undo step.

Changing the profile **assigns**: saved hex values stay the same and their meaning changes. There is no convert action that rewrites values to keep their appearance.

In a Display P3 file, `displayColor` writes `color(display-p3 r g b)` for solid fills, gradient stops, shadows, text runs, text backgrounds and the canvas background. Angular and diamond gradient rasters, pattern and noise tiles and shader frames are generated in document coordinates and tagged P3. Limits below cover where an engine then clips them. Imported images keep their own embedded profile and are color-managed by the browser, so an sRGB image looks the same in either profile.

| Output | Display P3 file |
| --- | --- |
| Canvas | Wide colors on a capable display; clipped to sRGB elsewhere |
| PNG, default | Rendered on a `display-p3` canvas, tagged with cICP (12, 13, 0, 1), an iCCP Display P3 profile, gAMA and cHRM |
| PNG, Tag sRGB or Untagged | Converted to sRGB and clipped |
| JPG | Rendered on a `display-p3` canvas; the engine embeds an ICC profile. Verified in Chromium and WebKit |
| SVG | CSS `color(display-p3 ...)` values. Browsers honor them; tools without CSS Color 4 may not, including Forma's own SVG import |
| PDF | Converted to sRGB and clipped |
| GIF, WebM, MP4 | Converted to sRGB and clipped |
| Clipboard PNG, slide PNG and slide PDF | Converted to sRGB and clipped |

PDF conversion is covered by a pixel test. GIF, video, clipboard and slide output rely on the same sRGB canvas default and have no dedicated color test.

An sRGB file can still choose Tag Display P3 for a PNG. Its colors convert accurately into P3 coordinates, so the image looks the same and no gamut is gained.

The ICC profile comes from `src/display-p3-icc.ts`, a small ICC v4.3 matrix/shaper profile built from the published primaries, so no third-party profile bytes ship.

### Limits

- WebKit, the engine behind the Mac app, flattens SVG `<pattern>` tiles and `feImage` into an sRGB buffer. Measured by drawing SVG into a `display-p3` canvas, these keep correct hues but clip to sRGB in WebKit and stay wide in Chromium: angular and diamond gradients, pattern, noise and texture fills, image fills, shader strokes, and shader effects. Solid fills, linear and radial gradients, shadows, text, and solids under filters stay wide in both.
- That measurement used Playwright's WebKit build in the raster export path. The live canvas inside the Mac app's WKWebView has not been measured.
- Shader fills in a Display P3 file avoid this by drawing the frame through the layer's clip instead of a pattern, so they stay wide in both engines. Vector-network fills still use the pattern.
- Swatches, chips and the native color input in panels are sRGB previews. The picker's main square does render in P3.
- The picker's note states whether the current value is outside sRGB and gives its clipped equivalent.
- Screen sampling converts sRGB results to P3 coordinates, so a screen color already outside sRGB is clipped by the browser before Forma sees it.
- Thumbnails of files other than the open one render as sRGB.
- CMYK and custom ICC profiles are not supported.
- Unmanaged color is not offered.

## Figma Bridge

The bridge refuses shader paints, in the same way it refuses editable surfaces. Use SVG or PNG to carry their appearance. This is an original local implementation; shader parity with Figma has not been verified.

## Sampling layer pixels

**Sample layer** is a third shader effect mode. The layer and its contents are drawn once, without the layer's own effects and in its unrotated axes, at up to 1024 px, then bound as a texture that source reads through `f_source(uv)`. Direct `sampler` and `texture` use stays refused. Pixelate and Channel Split are bundled examples. The output replaces the layer at that point in the stack, so effects below it in the stack are not seen by the shader.

The pixels arrive a moment after the layer changes, and the layer shows unfiltered until they do. Canvas sampling repeats while the layer animates. Animation export draws each frame's sample before writing it. A static SVG, PNG or PDF export uses the sample the canvas already made, and says so if one was not ready. The self-contained prototype player has no SVG writer, so sampled effects pass through there, and the inspector preview shows them with an empty texture.

Files using this mode store `shaderMode: "sample"`, which older Forma builds refuse. Nothing changes for files that do not use it.

## Timeline and presentation

The timeline's property picker lists shader parameters for the selected layers, alongside the Motion inspector buttons. A frame whose only animation is a shader on time opens Preview animated frame. Interactive shaders follow the pointer in frame preview and in prototypes, as they do on the Motion canvas with the toggle on. The pointer is never saved or exported.
