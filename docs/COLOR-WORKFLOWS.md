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
