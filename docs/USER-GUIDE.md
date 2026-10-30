# Getting started

Open **Forma.app** on Mac, or run `npm run dev` for the browser editor. The sample has editable desktop/mobile frames; click the home icon to start blank or reopen a recent local file.

- **V** move, **F** frame, **R** rectangle, **O** ellipse, **L** line, **Shift L** arrow, **T** text, **P** cubic pen, **Shift P** pencil, **H** hand, **K** scale, **C** comment. Shape dropdowns include polygon/star. **S** slice and **Shift S** section.
- Drag to create; hold Shift for equal dimensions. Select layers from the canvas or left hierarchy. Shift-click extends selection. Drag a blank area for marquee selection.
- Hold Space to pan. Scroll pans; Command-scroll zooms at the pointer. Shift-1 fits all; Shift-2 fits selection. The zoom menu also provides these actions.
- Drag selection handles to resize. Edit X/Y/W/H, rotation, radius, fill, stroke, opacity and text in the right inspector. In narrow browser views, use **Toggle properties** at the top.
- Double-click text to edit. Choose **Browse Google & Mac fonts** in Typography, or **Resources → Font library**. Search the full catalog; preview a family, then apply it to selected text. Commercial fonts appear only in the native app when installed.
- Command-G groups, Command-Shift-G ungroups, Command-D duplicates. Command-Z undoes and Command-Shift-Z redoes. Object/Arrange menus expose further commands.
- Select a container and choose Row/Stack/Grid in Auto layout. Gap, independent padding, fixed/hug/fill sizing, distribution and wrapping arrange children.
- Create components through Object → Create component; Assets offers live instances. Resources → Components and variants manages descriptions, tags, properties and sets. Select an instance for override reset, swap, variant selection or main-component navigation.
- In Prototype, choose a destination frame for a selected layer. Present and click that layer to navigate. Add interactions, transitions, overlays, variables and conditions; see [prototype controls and limits](PROTOTYPES.md).
- Press C and click the canvas to add a local note. Comments can be resolved/reopened in View → Comments.
- **Command-S** saves a portable `.oui`; Command-Shift-S saves a new copy. Recovery and recent files stay on this device, subject to storage limits. Use File → Save a named version for a local checkpoint.
- Export a selected layer/subtree or the page through **Export**, as SVG, PNG or JPEG, at 1×–4×.
- Choose **File → Figma import / export** for the plugin, supported property guide and visual SVG route. Direct `.fig` is not supported.
- **Command-K** searches available actions. **Help → Feature register** shows implemented, partial and planned requirements. See [implementation limits](IMPLEMENTATION.md) before relying on advanced behavior.

## v0.2 development controls

The source preview adds Text and Vector menus. Enter vector editing from the inspector; drag anchors/handles, Shift-select anchors, Alt-drag independent handles and double-click a segment to insert an anchor. Live booleans are under Vector/Object actions; expand their operands in Layers.

Fill, Stroke and Effects support stacks with add, duplicate, visibility, reorder and remove controls. Expand an item to edit its parameters. Text resizing controls wrap or auto-size text nodes. Resizing and Auto layout sections provide constraints, hug/fill, size limits, independent padding, distribution and wrapping. These development features are not included in the older v0.1 website installer. See the [current validation report](VALIDATION-v0.2-prototypes-workspaces.md) for limits.

## Design systems and motion in 0.2.0-dev.2

**Resources → Variables and modes** creates typed variables, collections, modes and aliases. Use the selected layer's Variables & styles section to bind a property, set a collection mode or inherit its parent's mode. Direct edits detach competing bindings. Removing a variable keeps its last resolved appearance. JSON library import/export transfers local styles and variables with new identifiers.

**Resources → Local design styles** manages reusable paint, text and effect styles. Select artwork and create a style from the inspector; update a linked style from selection to propagate it to consumers.

Click **Motion** in the floating toolbar, or use View → Motion timeline. Select a layer and property, add a starting keyframe, change the current time, then edit the keyframe value or enable Auto key and change the inspector/canvas. Playback samples the timeline without replacing the saved base artwork. Drag keys to change time; Shift-click selects multiple keys. The key editor provides easing and cubic-bezier values. Save reusable animation styles or apply Fade/Rotate/Scale/Resize presets.

Expand **Export animation** to choose GIF or an available video codec, scale, quality and transparency. Export reports progress and can be cancelled. GIF transparency is one-bit; video currently uses an opaque white background. Exports are limited to 1,800 frames, 4,096 pixels per edge and 8 megapixels. MP4/WebM depend on browser encoders and need broader Mac validation.

Recovery and named versions now use a local IndexedDB database. The migration preserves old localStorage backups. Keep explicit `.oui` saves for portable backups; browser storage can still be evicted and an abrupt exit can precede the next recovery write.

## Workspaces, typography and automation in 0.2.0-dev.3

Start **New whiteboard** or **New presentation** from Home or File. Whiteboard adds sticky notes, connectors, tables, mind maps, drawings, stamps, a local timer and voting. Slides adds editable templates, themes, speaker notes, local presenter/audience views, PNG/ZIP and raster PDF. Read the [whiteboard](WHITEBOARD.md) and [Slides](SLIDES.md) guides for controls and remaining scope.

**Character formatting** contains a selectable text editor for range formatting, mixed fonts/colors, links, underline appearance, numeric font axes/OpenType features and styled clipboard. Ordinary text edits keep ranges aligned. Font library also imports TTF/OTF files, filters languages, stores Google favorites and audits missing families. See [rich text](RICH-TEXT.md) and [font licenses/embedding](FONTS.md).

Inspector X/Y/W/H and typography fields accept expressions such as `(40 + 20) * 3`, `+8` and `/2`. Arrow keys adjust the input, Shift multiplies the step by ten and Option by one tenth. Enter commits; Escape cancels the draft. Invalid expressions retain the previous value.

Enable rulers with Shift-R; drag or add/move/remove guides through their controls. Frame Layout guides supports grids/rows/columns and reusable styles. Shift-G toggles layout-guide visibility. Guides & snapping controls object/center/frame/spacing/pixel snaps; Command temporarily bypasses snapping. Hold Option to measure to hovered artwork. The export panel can include visible layout guides.

[Vector endpoint tools](VECTOR-OPERATIONS.md) join/split contours, heal removed anchors and transform selected point groups. Command-J joins two open sibling layers or selected endpoints; Shift-Command-J smooths the join. Healing remains an approximate curve fit.

**Resources → Free local MCP automation** provides a standalone download and configuration for one saved `.oui` file. Save before automation and reopen afterward; live editor synchronization is not implemented. See [MCP setup](../mcp/README.md).

## Editable SVG, masks and selection

Use File → Place image or SVG, or drop an SVG onto the canvas. Review the editable-layer import and any reductions before applying it. The sanitized visual-asset option retains a single image. Cancel leaves the document unchanged. See [SVG scope](SVG-IMPORT.md).

Select sibling layers and choose Object → Use as mask (Control-Command-M). The backmost selected source masks the following artwork. Change alpha/vector/luminance in the inspector, or select the source and release the mask. Selected exports retain necessary mask sources. See [mask controls](MASKS.md).

Normal canvas clicks select a containing object; Command-click selects deeper artwork. Double-click descends one level. With canvas focus, Enter selects children, Shift-Enter selects parents and Tab/Shift-Tab selects siblings. Right-click Select layer picks overlapping artwork. The layer tree supports Shift ranges, Command toggles and arrow navigation. See [selection](SELECTION.md) and [transformed gestures](CANVAS-TRANSFORMS.md).

## Preferences and faster organization

Command-comma opens local Preferences, including nudge distances, drawing defaults, Shift rotation increment, tool retention and navigation behavior. These settings stay outside `.oui` files and project Undo. [Preference details](PREFERENCES.md).

Drag layer rows before/after a sibling or inside an eligible container; use the page-root control to unnest. Type filtering keeps matching ancestors visible. The row context menu supports descendant expansion and previewed batch renaming. [Layer details](LAYER-TREE.md).

Use the circle above a selection to rotate; Shift snaps, and Option-resize keeps the center fixed. Lock the aspect ratio beside the dimensions to preserve each selected layer’s own ratio. Single-layer alignment targets the parent; Shift alignment moves sibling selections as one group. [Transform scope](CANVAS-TRANSFORMS.md).

Command-K searches actions and tools. Use category filters, arrows/Home/End and Enter; Recent retains the last 20 distinct command IDs. Escape closes without leaking keys to the canvas. [Action details](ACTIONS.md).

## Grid, local library and Mac windows

See [responsive grid tracks and cells](GRID-LAYOUT.md), [local file organization](LOCAL-FILES.md), and [Mac document windows](MAC-WINDOWS.md) for the new workflows, save/close safeguards and practical limits.

## Canvas backgrounds and color contrast

Deselect all layers to edit **Page → Canvas color**, hex, opacity and visibility. New pages inherit the current background. **Use theme background** clears its override. Changes support Undo and portable saves, and do not recolor exported artwork. See [page backgrounds](CANVAS-BACKGROUND.md) for compositing and interchange limits.

Expand **Color contrast checker** near the inspector's bottom to check foreground/background colors and foreground opacity. Results include AA/AAA thresholds for normal and large text. **Use selected paint** copies one visible solid paint into the calculator without changing the design. This checks an explicit color pair; automatic document/background analysis remains unfinished. See [contrast checking](CONTRAST.md).

## Page organization and Mac image paste in 0.2.0-dev.9

Preferences now offers **Interface appearance → Follow system**. It responds to light/dark changes on this device; explicit Light/Dark choices and the View theme toggle remain available. The choice is saved locally outside projects. See [preferences](PREFERENCES.md#appearance).

Right-click a page or open its Page actions button to duplicate, rename, move or delete it. With a page focused, Up/Down/Home/End select pages; Option–Shift–Up/Down reorders them; Shift–F10 opens its action menu. Duplication preserves supported page artwork and metadata with fresh internal IDs, while shared libraries remain linked. Deletion refuses surviving references. These changes support Undo and portable saves. Active presentation deck pages use their own slide controls. See [page scope](PAGES.md).

Use **Search page names** to filter by a case-insensitive name substring. Filtering keeps the current canvas open; arrows navigate the visible matches and ordering actions use the full document order. Clear the query with Escape or the clear button. Search is temporary interface state and is not written to your project.

Each Design/Whiteboard page remembers its pan and zoom on this device. Reopening restores its last valid local page choice; camera settings stay outside project files and Undo. New pages start fresh and duplicated pages copy the source view. Hover over or keyboard-focus a page to see one static artwork preview without switching the canvas. See [remembered views](PAGE-VIEWPORTS.md) and [previews](PAGE-THUMBNAILS.md).

In the native Mac app, Command–V can paste PNG or TIFF image data from another app as an embedded editable image. TIFF uses its first oriented frame. Paste supports one-step Undo and saved pixels, including inside the active slide. Encoded data is limited to 20 MB, 8192 pixels per side and 16 million pixels; larger images must be resized before copying. See [raster paste](RASTER-CLIPBOARD.md).

The development source also adds **Edit → Copy as PNG**, **Shift Command C**, for a transparent 2× snapshot of selected artwork. It uses the same pixel limits and does not add an Undo entry. Browser use points to file export. Browser/Windows system image clipboard remains unfinished; the new Mac PNG-copy path still requires final native window acceptance before release. See [Copy as PNG scope](COPY-AS-PNG.md).

Saved-file MCP adds `duplicate_page` and `reorder_page` inside `apply_operations`. Reorder uses the final zero-based page position; duplicate returns its new page ID. Both share the editor's page-reference guards. Read the latest revision before writing, then reopen the saved file in Forma. See [MCP examples and limits](../mcp/README.md#page-operations).
