# Design workflow pass

A working session through the real interface: pointer, keyboard, menus and panels, driven by Playwright against the editor, with screenshots read at every stage. Nothing was written to the store. Four pieces of work were built from a blank file:

1. A phone screen with a button component set (Default, Hover, Disabled), a card component, text styles, color variables with Light and Dark modes, an auto layout list and three instances with overrides.
2. A desktop dashboard with a sidebar, a KPI row of instances, a bar chart drawn from rectangles, a table-like list and an inserted Lucide icon.
3. A two-screen prototype with Smart animate navigation, an interactive hover variant and an overlay, then presented.
4. PNG at 2x, SVG, PDF and a saved `.oui`, reopened and compared: page data was byte-identical.

Findings are ordered roughly by how much they got in the way. Regression coverage is `tests/design-workflow.test.ts` and `tests/e2e/design-workflow.spec.ts`.

## Found and fixed

### Text

| Finding | Fix |
| --- | --- |
| Typing after T went in front of the placeholder: "ContinueYour text". | New text and Enter select all. Double-click places the caret at the end. |
| The inline editor was a white box in a generic style, wrapped at the old width and hid nothing underneath, so edited text looked nothing like the result. | `CanvasTextEditor` takes the layer's weight, style, tracking, line height, alignment and color, is transparent, grows with auto-width text, and the painted layer steps aside. |
| Default text was dark ink on the dark canvas: effectively invisible after Escape. | The factory ink turns light on a dark backdrop. A chosen default is respected. |
| After Escape focus fell to the page, so Enter did nothing and the next letter ran a tool shortcut. | Escape and Cmd+Enter return focus to the canvas, without a focus ring around it. |
| Empty text layers stayed behind as invisible layers. | Clearing the text removes the layer, with Undo. |
| Every text layer was called "Text". | The name follows the words until it is renamed. |
| Selection handles sat on top of text being edited. | Hidden while editing. |
| Fill container did nothing on auto-width text. | It now switches the layer to auto height, so columns fill. |

### Everyday canvas gestures

| Finding | Fix |
| --- | --- |
| Option-drag did not duplicate at all. | Copies in place, moves the copy, settles as one Undo step, and Cmd+D repeats the offset. |
| Dragging a layer onto a frame did not put it in the frame, and dragging out did not take it out. | `canvas-reparent.ts`: the deepest open frame under the pointer receives it, with a highlight; auto layout parents take it at the pointer position; leaving a frame returns it to the page. Frames nest only when they fit entirely. Command keeps a plain move. |
| X and Y showed page coordinates for nested layers, so typing 16 threw a child out of its frame. | Single selections read and write from the enclosing frame, through groups. |
| Coordinates read like `-211.215385`. | Fields show two places (three under 1); focus reveals stored precision. Stored values are unchanged. |
| The file said "Whole pixels" while drawing ignored it. | Drawing follows the file's pixel alignment unless the preference overrides it. |
| Undo emptied the selection. | Layers that still exist stay selected. |
| Ungroup dropped the selection. | The released children stay selected. |
| Cmd+D replaced the clipboard. | The clipboard is left alone, also for Option-drag. |
| Cmd+D after editing a label or resizing a sibling applied a hidden scale, which threw auto layout children out of line. In some cases it refused. | Content-sized dimensions are not treated as scale, and auto layout children always duplicate ordinarily. |
| Duplicating a screen stacked it 24 px off the original. | A top-level frame lands beside itself. |
| Copy and paste properties did not exist. | ⌥⌘C and ⌥⌘V, in the Edit menu, with one Undo. Held per window, not on the system clipboard. |
| Alignment had no keys and no distribute control. | ⌥A/D/W/S/H/V, ⌃⌥H/V, ⌃⌥T, and two distribute buttons in the bar. |
| A new file opened at 70%. | A fresh blank file opens at 100%. |
| Zoom to fit put the bottom of a screen under the toolbar. | Fit reserves the toolbar's height. |
| Edge handles covered small layers. | Faded below 72 screen pixels and still draggable. |

### Auto layout

| Finding | Fix |
| --- | --- |
| Shift+A on one text made a frame named "Group", 24 px padding, no hug, and clipped the text. | Wrapping hugs, never clips, numbers frames and adds 10 px only around a single child. |
| Shift+A always made a row with gap 24, whatever was drawn. | Direction, gap and visual order are read from the layers. |
| Shift+A on an existing stack flipped it to a row. | It wraps instead. A free frame keeps its size and reads insets from its children. |
| "Padding" sat beside the paired fields and went stale once they differed. | Horizontal and vertical padding lead; the uniform field moved into More layout options. |
| Alignment needed two dropdowns. | A nine-point align grid. |
| "Analyze auto layout" sat under Resizing beneath a paragraph. | It is now in Auto layout, with the explanation as a tooltip. |

### Panels

| Finding | Fix |
| --- | --- |
| Fill started about 2,700 px down the frame inspector, which was 6,556 px tall. | Order is now position, component, auto layout, resizing, typography, layer, fill, stroke, effects, selection colors, export, then everything else. Fill is on the first screen. |
| The full color picker was always open, 500 px per paint. | A one-line row of swatch, hex and alpha. The swatch opens the picker. |
| Fill variable and text style sat in a distant Design system list. | Each binding sits in its own section with a compact row and a + for "create style". |
| The Layers list began 590 px down. | About 300 px: one-line title, filters behind a toggle, expand and collapse as icons, page search only with two or more pages, divider as an icon, a quieter root drop target. |
| Layer names truncated at shallow depth because hidden buttons kept their space. | The buttons overlay on hover. |
| The layer preview popped up on click and after 200 ms of hover. | Pointer focus no longer opens it; hover waits 650 ms. Keyboard focus keeps 200 ms. |
| Nothing selected showed a long guides list and a sales note. | Guides fold away. The panel fits one screen. |
| Long prose filled Frame actions, masks, relative position, selection colors, stroke scaling, SVG options and exports. | Moved to tooltips or small disclosures, or shown only when it applies. |
| The Export action sat below every option. | It is beside scale and format. |
| Stroke and effects stacked every field. | Two-column rows with color first. |
| Rename was a modal, with the name unselected, so typing appended to it. | Inline in Layers: Cmd+R or double-click, Tab walks on, Escape cancels. The modal stays for multi-selection and selects its text. |
| File opened with Branches and Storage, in history order. | Menus read in working order with separators (`menu-order.ts`), in the in-app menu bar. |
| "1 layers updated; 0 locked or incompatible layers skipped." and "1 overrides". | Correct singulars, and zero counts are dropped. |

### Components, variables, prototype, icons

| Finding | Fix |
| --- | --- |
| Combine as variants opened a large dialog, left five layers selected, named the set "Component set" and copied radius to it. | It selects the set, takes the shared slash name and resets the container's look. `VariantInspector` names set, properties and values in place, and Add variant is one click. |
| Variant values were duplicates when members shared a name. | Distinct values, and setting a value renames the member `State=Hover`. |
| Instances were named "Card / instance" and landed at the page root. | They take the component's name and land beside the main. |
| Instance layers showed six reset buttons and "No exposed properties are available in this bounded component inspection." | Resets fold into one disclosure; the sentence is gone. |
| Variable colors had no hex field and modes were hidden. | Each mode has a typed hex, and modes are open. |
| Prototype opened with Form input simulation, and Quick navigation listed every nested frame. | Interactions lead, form and audio last, and only screens are offered. |
| Raw values such as `smart-animate`, and "1 actions". | Readable labels and singulars. |
| A backward connection drew a wide S across the canvas, and a focused one drew a huge blue box. | Connections leave and arrive on facing sides, and focus restyles the line. |
| Icons landed at (80, 80) on the page in dark ink, sized 48. | They land in one selected unlocked frame at 24 px, in a color that shows. |

### Behavior changes worth noting

- `snapDrawingEndpoint` now honors the document's pixel alignment; one unit assertion changed with it.
- Number fields show fewer decimals until focused; `number-precision.spec.ts` asserts both forms.
- Nested frame labels are off by default because their chips covered content. They show when the frame or its parent is selected. **View > Show nested frame names** restores them, and that local preference stays out of `.oui`. `canvas-names.spec.ts` enables it.
- Filters and the color picker take one extra click, so specs that use them now make that click.
- `.oui` data is unchanged: no new document fields.

## Found and not fixed

- **Text box height.** A single auto-sized line is as tall as its font size, so line height does not add to the box. Stacks of text sit tight. Changing it would move saved layouts, so it needs its own decision.
- **Double-click caret.** It lands at the end of the text, not under the pointer, because the editor is a textarea.
- **Rich text in the inline editor.** Mixed runs show the layer's base style while editing and return on commit.
- **Native Mac menu.** `macos/main.swift` builds its own menus. The new commands and order reach the in-app menu bar, Actions and keyboard, not the native menu bar. The native build was not exercised in this pass.
- **Rotation handle.** Its stem can sit over a frame's name on small frames.
- **Size label.** It shows numbers only, without Hug or Fill.
- **Export file names.** A 2x PNG is named `Phone.png`, not `Phone@2x.png`.
- **Component duplicates.** Cmd+D on a main makes another main, not an instance.
- **Bound fills.** A fill bound to a variable still shows the hex rather than the variable's name.
- **Canvas order in Layers.** Within auto layout the tree lists the last child first, which is easy to misread when frames are duplicated. Two identically named layers made this mistake easy to repeat during the session.
- **Console noise.** A React warning about `clipPath` casing appears from a preview render, and a CSP refusal of one blob worker appears at startup. Neither visibly affected the work; the sources were not traced.
- **Dev-only crash.** "Maximum update depth" in `CanvasImageDiagnostics` appeared twice after `store.ts` was hot-reloaded. It looks like two module instances of the store, but that was not proven, and it did not appear after a server restart.
