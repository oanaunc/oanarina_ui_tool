# Unreleased color workflows

Solid fill and stroke inspectors include an HSV saturation/brightness square, hue,
saturation, brightness and alpha sliders, HEX/RGB/HSL/HSB input, and 24 device-local
recent colors. Dragging previews locally and commits one undoable edit at release;
Escape, pointer cancellation and window blur discard an unfinished drag. Hue is
retained at white/black so subsequent saturation/brightness edits behave usefully.

The Selection colors panel inspects selected layer trees, including hidden layers
and excluding hidden paint entries and slice geometry. It lists solid paints,
gradient stops, strokes and rich text run RGB values. Replacement preserves alpha,
skips layers with inherited locks, and commits one undoable, validated edit. Only
changed channels detach their corresponding bindings/styles; unrelated bindings
remain intact. Managed properties that would overwrite the requested edit are
refused atomically. The panel shows up to 100 colors; narrow a selection for more.

Sample canvas color rasterizes a bounded snapshot of the visible artwork (up to
1600×1000), including the saved page background and excluding editor handles,
labels and guides. Click a pixel or use arrow keys and Enter. Transparency is
preserved. This samples the artwork export, not an OS screenshot or an exact
physical display pixel. Unsupported/failed rendering reports an error.

Sample screen color uses the browser EyeDropper API only when available, which
the shipping WKWebView does not provide. On Mac, Edit > Sample Screen Color
(Control-Command-C) runs the system NSColorSampler from the shell and hands the
one clicked color to the open picker. See
[Mac system integration](MAC-SYSTEM-INTEGRATION.md).
Delayed sampling results are discarded after document, selection, page or editor
mode changes; unmount aborts pending screen sampling. Figma screen-picker parity
remains unimplemented. Gradient canvas handles and shader fills remain separate
unfinished work.

Validation: tests/color-workflows.test.ts covers conversions, context guards,
recent-color validation, inherited locks, undo/redo/save, unchanged binding
preservation, atomic refusal and deep hierarchies. Browser interaction tests in
tests/e2e/color-workflows.spec.ts verify gestures/cancellation, actual canvas
pixel picking, replacement persistence/undo, recent colors, hue preservation,
unsupported screen API and a delayed API callback after a mode switch.

## Color styles

A color style is a named color saved in the file. Layers link to it, so changing the style changes every layer that uses it.

- **Save one.** Select a layer, click its fill or stroke chip, then choose **Save as color style** under Recent colors. Give it a name and press Create style. The layer is now linked to it. A slash in the name makes a folder, like `Brand/Olive`.
- **Apply one.** Click a fill or stroke chip and open the **Styles** tab. Search if you need to, then click a style. For several selected layers, use the Paint style row in the inspector, or the Stroke color style row when their strokes differ.
- **Change one.** Hover a style in the Styles tab and click its edit button. Changes reach every layer using it, in one Undo. Styles & colors in the left panel lists them too.
- **Stop using one.** A linked fill or stroke shows the style's name, with a Detach style button beside it. The layer keeps its color. Changing that color by hand in the Custom tab also detaches it, and deleting a style leaves its layers with the color they had. Changing a stroke's weight does not.

Styles belong to the file they were saved in. To use them in another file, publish that file as a local library and install it there.

Color styles apply to fills, including text, and to strokes. On a stroke, the style sets the first stroke's color. Its weight and any other strokes stay the layer's own, and a style holding several fills gives the stroke the top visible one. A saved stroke style in the Design system section is a separate thing that holds a whole stroke with its weight, and a stroke uses one or the other.

## Gradient styles

A style can hold a gradient. Gradient fills and strokes show the same **Custom** and **Styles** tabs in their settings, so a gradient saves as a style, applies, shows its name and detaches as a color does. The style's edit view changes its type, stops and angle, and every layer using it follows in one Undo. Switching the type there turns a style solid or gradient everywhere it is used. Canvas gradient handles work on a layer's own gradient, not on a style. A style holding several fills, an image or a shader is changed in Manage styles.
