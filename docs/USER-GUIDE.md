# Getting started

Open **Oanarina UI Tool.app** on Mac, or run `npm run dev` for the browser editor. The sample has editable desktop/mobile frames; click the home icon to start blank or reopen a recent local file.

- **V** move, **F** frame, **R** rectangle, **O** ellipse, **L** line, **Shift L** arrow, **T** text, **P** straight-segment pen, **Shift P** pencil, **H** hand, **K** scale, **C** comment. Shape dropdowns include polygon/star. **S** slice and **Shift S** section.
- Drag to create; hold Shift for equal dimensions. Select layers from the canvas or left hierarchy. Shift-click extends selection. Drag a blank area for marquee selection.
- Hold Space to pan. Scroll pans; Command-scroll zooms at the pointer. Shift-1 fits all; Shift-2 fits selection. The zoom menu also provides these actions.
- Drag selection handles to resize. Edit X/Y/W/H, rotation, radius, fill, stroke, opacity and text in the right inspector. In narrow browser views, use **Toggle properties** at the top.
- Double-click text to edit. Choose **Browse Google & Mac fonts** in Typography, or **Resources → Font library**. Search the full catalog; preview a family, then apply it to selected text. Commercial fonts appear only in the native app when installed.
- Command-G groups, Command-Shift-G ungroups, Command-D duplicates. Command-Z undoes and Command-Shift-Z redoes. Object/Arrange menus expose further commands.
- Select a container and choose Row/Stack/Grid in Auto layout. Gap and padding arrange children using fixed dimensions.
- Create components through Object → Create component; Assets offers instances. Instances currently need a manual reset to receive component changes.
- In Prototype, choose a destination frame for a selected layer. Present and click that layer to navigate. This preview supports simple frame navigation.
- Press C and click the canvas to add a local note. Comments can be resolved/reopened in View → Comments.
- **Command-S** saves a portable `.oui`; Command-Shift-S saves a new copy. Recovery and recent files stay on this device, subject to storage limits. Use File → Save a named version for a local checkpoint.
- Export a selected layer/subtree or the page through **Export**, as SVG, PNG or JPEG, at 1×–4×.
- Choose **File → Figma import / export** for the plugin, supported property guide and visual SVG route. Direct `.fig` is not supported.
- **Command-K** searches available actions. **Help → Feature register** shows implemented, partial and planned requirements. See [implementation limits](IMPLEMENTATION.md) before relying on advanced behavior.

## v0.2 development controls

The source preview adds Text and Vector menus. Enter vector editing from the inspector; drag anchors/handles, Shift-select anchors, Alt-drag independent handles and double-click a segment to insert an anchor. Live booleans are under Vector/Object actions; expand their operands in Layers.

Fill, Stroke and Effects support stacks with add, duplicate, visibility, reorder and remove controls. Expand an item to edit its parameters. Text resizing controls wrap or auto-size a single-style text node. Resizing and Auto layout sections provide constraints, hug/fill, size limits, independent padding, distribution and wrapping. These development features are not included in the older v0.1 website installer. See the development validation report for limits.
