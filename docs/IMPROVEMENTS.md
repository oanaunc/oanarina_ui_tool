# Forma improvement list

This lists what is missing, wrong or unfinished in Forma. It comes from every report sent by our tester, the 2,058 rows of the feature register, our validation records, Forma's source, and a code review against FigCraft, an MIT-licensed design app. Part 7 lists all 186 unfinished register rows.

Sizes: **S** is under a day, **M** is a few days, **L** is a week or more. "Done in 1.0.2" means the fix shipped in that release.

## Why people are unhappy

Nearly every complaint so far has one cause: Forma does the thing, but not the way a designer's hands expect. The feature register says 1,658 features are implemented. That counts whether a feature exists and works, not whether it feels right.

- **No designer has used Forma while it was being built.** One tester has found every serious problem, one at a time, by email.
- **Our tests agreed with our own guesses.** Import tests used field names I had assumed, so they passed while the names were wrong. Masks never imported, and nothing showed it until today.
- **Forma has been checked against only one real file.** Most imported files were never tried.
- **Features exist but are hard to find.** Saved colors worked already, behind a tiny `+` our tester never found.

## 1. Stop losing people's work and trust

These matter most, because they make a file look broken.

| # | Problem | Size | Status |
| --- | --- | --- | --- |
| 1 | Auto line height was read as 1.0. 49 of 55 text layers in the real file use it, and text collapses on first edit | M | Done in 1.0.2 |
| 2 | Masks never imported, because Forma read a field that doesn't exist | S | Done in 1.0.2 |
| 3 | Every polygon became a hexagon and every star got 5 points | S | Done in 1.0.2 |
| 4 | Miter limits were ignored, and a one-sided stroke became a full box | S | Done in 1.0.2 |
| 5 | Variant swaps, drag and hover triggers, and overlay position and scrim imported wrongly | M | Done in 1.0.2 |
| 6 | Groups imported as clipping frames, cutting off shadows | S | Done in 1.0.2 |
| 7 | Auto layout frames stopped hugging on first edit, and space-around was lost | S | Done in 1.0.2 |
| 8 | One odd value, such as a frame with only a maximum width, could refuse the whole file | S | Done in 1.0.2 |
| 9 | Ordinary-size files were refused outright at 2 million values or 20,000 layers. Large files now import, keeping what fits | M | Done in 1.0.2 |
| 10 | Typing `+10` with several layers selected put them all at the same position | S | Done in 1.0.2 |
| 11 | Component properties were lost on variants | M | Done in 1.0.2 |
| 12 | Dark-mode frames using library colors could show the wrong mode | S | Done in 1.0.2 |
| 13 | One image that won't decode still refuses the whole file, despite the promise of a placeholder | S | Done in 1.0.3 |
| 14 | A repeated image counts every time toward the 48 MB limit, so image-heavy files are refused. Store each image once | M | Done in 1.0.3, with a 340 MB image limit |
| 15 | Library colors and styles referenced by key aren't followed to the file's copy | M | Done in 1.0.3 |
| 16 | Saved line breaks are ignored in rich text, so it rewraps with local fonts | M | Done in 1.0.3 |
| 17 | Rich text is forced to a fixed size and stops auto-resizing after import | M | Done in 1.0.3 |
| 18 | Background blur, progressive blur and many variable bindings are dropped on import | M | Partial: imported blur stays on one independent shape per page, and line height, border sides, effect fields, gradient stops and later fills stay plain values |
| 19 | Lists, text case, leading trim, hanging punctuation and skip ink are dropped from imported text | M | Partial: text case stays literal characters, and checklists become bullets |
| 20 | Grid auto layout imports as plain positioned layers | M | Done in 1.0.3 |
| 21 | Multi-color flattened icons come in as one color, and per-point arrowheads vanish | M | Partial: multi-color vectors lose their anchors, and arrowheads work on one open path |
| 22 | Non-uniform and rotated image crops become a full stretch | M | Done in 1.0.3 |
| 23 | Resized instances without stored positions don't follow constraints | M | Partial: groups in such instances don't scale their contents |
| 24 | Set-variable and conditional prototype actions are dropped, though Forma supports them | M | Done in 1.0.3 |
| 25 | Files can't be saved back to the original format, which leaves people stuck in Forma | L | Not done: a writer can't be checked here without the original app, so it stays out |

## 2. Daily editing that feels wrong

| # | What a designer notices | Size | Status |
| --- | --- | --- | --- |
| 26 | The font picker in the panel is a plain list of 7 fonts. It needs search, recents and live preview on the canvas | M | Done in 1.0.3 |
| 27 | Padding and gaps can't be dragged on the canvas, only typed | M | Done in 1.0.3 |
| 28 | Corner radius has no handle on the canvas, and star and arc handles are missing | M | Done in 1.0.3 |
| 29 | Text has no real Auto line height, and lines don't round to whole pixels, so hug frames get values like 33.6 | M | Done in 1.0.3 |
| 30 | Hugging text ignores max width and never wraps | S | Done in 1.0.3 |
| 31 | Lines break only at spaces. They need hyphens, slashes and proper Chinese, Japanese and Korean rules | S | Done in 1.0.3 |
| 32 | Arrow keys don't reorder children in auto layout, and dragging into a grid cell isn't supported | M | Partial: one layer at a time for grid cells |
| 33 | No smart spacing handles for a row or grid of loose layers, only one-shot Tidy | M | Done in 1.0.3, for evenly spaced selections |
| 34 | Thin lines are hard to grab, and on tiny layers the handles get in the way of moving them | S | Done in 1.0.3 |
| 35 | The K Scale tool keeps old numbers in the panel, with a separate Apply button | M | Partial: instances, animated layers, main components and mirrored scales keep a stored scale |
| 36 | Snapping rechecks every layer on each pointer move, and deep layers compete as targets, so it gets noisy and slow on big pages | M | Done in 1.0.3 |
| 37 | Number fields don't take units or percentages | S | Done in 1.0.3 |
| 38 | Automatic grid tracks shrink below their content | S | Done in 1.0.3 |
| 39 | Rotated or flipped groups never refit around their children | S | Done in 1.0.3 |
| 40 | No Paste over selection | S | Done in 1.0.3 |
| 41 | The right panel ends in a long list of collapsed extras, which makes it look busy and hides what matters | M | Done in 1.0.3 |
| 42 | Stroke colors can't use color styles, only fills | M | Done in 1.0.3 |
| 43 | Color styles and the picker don't handle gradient styles in the panel | M | Done in 1.0.3, except styles with several paints, images or shaders |
| 44 | Find and replace doesn't look inside specs, and text selection can't cross blocks in a spec | M | Done in 1.0.3: drag across blocks picks whole blocks |
| 45 | OKLCH and CSS color names are missing from color fields | S | Done in 1.0.3 |

## 3. Drawing and vectors

| # | What a designer notices | Size | Status |
| --- | --- | --- | --- |
| 46 | Cut, knife and eraser don't work on branching vector networks | L | Done in 1.0.3 |
| 47 | Shape builder refuses strokes and open paths | M | Done in 1.0.3 |
| 48 | Filled regions can't be selected and dragged in vector edit mode | M | Done in 1.0.3 |
| 49 | Tablet pressure is unverified, and drawing has 14 partial features (part 7) | L | Partial: 13 drawing rows remain, and tablet pressure is unverified |

## 4. Prototypes

| # | What a designer notices | Size | Status |
| --- | --- | --- | --- |
| 50 | Drag transitions play by time and don't follow the finger, so swipes feel fake | M | Done in 1.0.3 |
| 51 | 13 prototype features are partial (part 7) | L | Partial: see part 7 |

## 5. Things we have never proved

Each of these could hide bugs like the ones above.

| # | Gap | Size | Status |
| --- | --- | --- | --- |
| 52 | Real mouse and trackpad: no physical device has tried the zoom work | S | Open |
| 53 | Spec tables, code, images and embeds on real files. The file we have holds only headings, paragraphs and lists | M | Open |
| 54 | Slower Macs, Intel Macs and older macOS | M | Open |
| 55 | VoiceOver speech, printers and tablets | M | Open |
| 56 | Quick Look, thumbnails and Spotlight weren't rerun for recent releases | S | Rerun for 1.0.3 on a synthetic project: each part passed, not all in one run |
| 57 | Translated interface text hasn't been reviewed by a native speaker | M | Open |
| 58 | Native checks depend on keyboard focus and fail when another app is in front, which hides real failures | S | Done in 1.0.2 |

## 6. How we work

These prevent the next round of complaints, so they matter as much as any feature.

| # | Change | Size | Status |
| --- | --- | --- | --- |
| 59 | Build a set of 20 to 30 real files that cover masks, variants, overlays, libraries and big files. Test every release against them | M | Needs files from you |
| 60 | Check each import field against the schema real files embed, automatically, so a wrong name can't pass again | S | Done in 1.0.3 |
| 61 | Get three to five working designers to do a real task on screen. Watch where they stall | M | Needs people |
| 62 | Compare common actions side by side with the tool people are moving from, on video | L | Needs people |
| 63 | Add a Send feedback button with the app version, file size and a local report, sent only when the person chooses | S | Done in 1.0.3: Help → Send feedback saves a local report |
| 64 | Measure the register differently: add a "feels right" status that only a person can set | S | Open |

## 7. Every unfinished feature in the register

### Accessibility and localization (9)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-44-007 | Keyboard-only layer creation | Guarded keyboard insertion dialog for eleven layer types, including paths typed as points, with bounded geometry, Undo and save. Freehand, media and workspace-specific objects remain unfinished. See docs/DOCUMENT-ACCESSIBILITY.md. |
| UI-44-010 | Keyboard-only property editing | Keyboard-only edits of position, size (with arithmetic), hex fill and the color slider are validated with Undo. Canvas-only gestures such as gradient handles have not been audited for numeric equivalents on every property. |
| UI-44-016 | Contrast compliant controls | Text, accent and focus tokens pass 4.5:1 and 3:1 in both themes. Rendered text passes in the editor, menus, Home, 25 dialogs and while hovering menu items and toolbar buttons. Two failures found this way were fixed. Control boundaries meet 3:1 only in Increased contrast. |
| UI-44-017 | Larger UI scaling | Interface scale reaches 150% with persisted presets, scoped chrome layout and canvas-coordinate correction. A real click at 150% selects the right layer in the shipped shell. |
| UI-44-018 | Reduced motion mode | Partial: existing Follow system / Reduce / Allow interface-motion setting persists locally, responds to OS/storage changes and scopes chrome effects/scrolling. Editor Motion pauses when reduction activates; explicit Play remains authored preview without loop. |
| UI-44-020 | High-contrast selection | Partial: persistent local black/white layer/hover/box selection outlines, resize/rotation handles and vector anchor activity on Design/Whiteboard canvas; screen-space SVG pixel, keyboard, persistence and no-artwork-mutation checks. |
| UI-44-026 | Additional language packs | Unchanged by decision: the user said nothing has to be translated, so no language work was done. Language packs are one catalog file plus one registry row. One additional pack ships, a labeled Arabic preview covering menus, tools and main chrome. No user-installable packs and no native review. |
| UI-44-029 | Locale number formatting | Unchanged by decision: no localization work was done. Counts and percentages use Intl, and NumberField shows and accepts the decimal comma, including in arithmetic. Raw inspector readouts and dimension badges are not localized. |
| UI-44-030 | Right-to-left UI layout | Unchanged by decision: no localization work was done. Arabic sets dir=rtl and the main chrome mirrors, including menus, toolbar arrows and sidebar resizing. Canvas geometry matches English exactly. Slides, Whiteboard, Motion and prototype panel styles are not audited. |

### Actions and keyboard (2)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-42-016 | Custom shortcut mapping | Turn a default off and replace it, including with bare or Shift letters. Extra shortcuts now also run in Motion and vector editing, and remapped Bold, Italic and Underline work while text is open. |
| UI-42-017 | Shortcut conflict warning | Tool-key reservations are in place, and turning a default back on is refused when its key is taken, naming the conflict. Forma cannot see shortcuts other apps register. |

### Advanced prototype behavior (1)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-34-020 | Form input simulation | Labeled text, textarea, number, checkbox, radio and select simulation uses native presenter controls with typed variable defaults, and now also works inside slide embeds. Values reset on restart. |

### Advanced typography (12)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-22-017 | OpenType ligatures | Ligature tables are read for imported TTF, OTF and WOFF2 fonts. Installed fonts in the Mac app keep measured width notes. |
| UI-22-018 | OpenType alternates | Alternates are read from tables for imported TTF, OTF and WOFF2 fonts. Installed fonts in the Mac app keep measured notes. |
| UI-22-019 | Stylistic sets | Stylistic sets and their names are read from tables for imported TTF, OTF and WOFF2 fonts. Installed fonts in the Mac app keep measured notes. |
| UI-22-020 | Variable font axes | Axes come from the font file for imported TTF, OTF and WOFF2 fonts, and sliders preview on the canvas with one Undo on release. A partly selected range previews on release only. Installed fonts in the Mac app use measured ranges. |
| UI-22-021 | Optical sizing | opsz comes from the font file for imported fonts, with the same live preview. Installed fonts in the Mac app use measured ranges. |
| UI-22-022 | Tabular numerals | Table-level reach covers imported TTF, OTF and WOFF2 fonts. Installed fonts in the Mac app keep measured notes. |
| UI-22-023 | Proportional numerals | Table-level reach covers imported TTF, OTF and WOFF2 fonts. Installed fonts in the Mac app keep measured notes. |
| UI-22-024 | Fractions | Table-level reach covers imported TTF, OTF and WOFF2 fonts. Installed fonts in the Mac app keep measured notes. |
| UI-22-025 | Kerning | Table-level reach covers imported TTF, OTF and WOFF2 fonts. Installed fonts in the Mac app keep measured notes. |
| UI-22-035 | Emoji input | Adds the system Edit > Emoji & Symbols item. The item is verified; insertion by a person is not. Other earlier limits stand. |
| UI-22-043 | Text vertical trim | Trim now also holds with registered variable axes, small capitals, raised text, stylistic sets and most features. Custom axes and features that resize capitals keep ordinary geometry. |
| UI-22-045 | Hanging quotation marks | Quotes now hang in left, right, center and justified paragraphs, including right-to-left and mixed text. Lists, ellipsis tails, tabs and explicit bidi controls keep ordinary placement. |

### Agents and code workspace (3)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-57-017 | Runnable code layer | Validated HTML, CSS and JS run on explicit Run only, in a no-network frame whose scripts sit in a terminable worker. The 5-second watchdog stops runaway code. Canvas shows the raster preview; mirrored DOM limits apply, now with MutationObserver and viewport IntersectionObserver. |
| UI-57-019 | Code layer preview | Captured PNG up to 2× and 2,048 px, with none, current or stale state. Pixel-checked in Chromium, Playwright WebKit and a real WKWebView harness. It is a DOM snapshot, frame fonts only. |
| UI-57-024 | Agent library context | MCP read_library_context returns allowlisted metadata, provenance, versions and dependency IDs for the scoped saved file, with bounded revision-pinned pagination and explicit omissions, and it was called in the standalone bundle. |

### Auto layout fundamentals (1)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-24-029 | Stroke included in layout | Stroke inclusion covers linear, grid, gap, padding, fill and wrap, transformed children, arrowheads, and now miter tips on polygons, stars, paths and lines up to the miter limit. Tips add one even outset on all sides, vector networks are not measured, and shadows are excluded. |

### Basic shapes (1)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-11-005 | Corner smoothing | Corner smoothing now works on rectangles, frame-like boxes, polygons and stars through the shared path, with zero keeping the saved path. The polygon and star curve is an approximation, and general paths are not smoothed. Check source metadata for polygons and stars, which was not exercised. |

### Boolean geometry (1)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-15-012 | Boolean operation with text | Character ranges with different font, size, weight, style or tracking outline in Booleans and SVG outlines, and a range color change refuses. Still printable ASCII, exact static TTF, and text stops being editable as text. |

### Canvas navigation (2)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-06-025 | Toggle frame names | View and Actions toggles cover eligible nested frame and main component names. Names on one row now stop short of the next name and step aside when no letter fits. Foreground artwork can still cover a name, and clipped, masked, managed, slice and Boolean owners stay suppressed. |
| UI-06-026 | Toggle section names | View and Actions toggles cover eligible nested section names. Names on one row now stop short of the next name and step aside when no letter fits. Foreground artwork can still cover a name, and clipped, masked, managed, slice and Boolean owners stay suppressed. |

### Comments and annotations (1)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-36-017 | Comment link | Local thread links work, and replies now have their own links that open the right reply page and focus that reply. An OS link handler and opening another file from a pasted link are absent, because that needs wider native permissions. |

### Community and resources (1)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-47-025 | In-app onboarding | Adds the first-run offer to existing opt-in guidance, and Getting started now links to guides and practice files. The tour stays optional and six steps long. Other limits unchanged. |

### Components (1)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-27-027 | Preserve overrides when swapping | Property values follow name and type. Layer overrides follow component key or path, then same type and name with repeated names paired in order, and on a swap the only unmatched layer of its type on each side. |

### Dev Mode and inspection (5)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-41-019 | Automatic icon detection | Partial: Inspect automatically compares eligible transparent vector-container geometry with all 1,951 installed licensed Lucide icons in a bounded local worker. |
| UI-41-028 | Component playground | Reachable Assets and Inspect component playground derives an isolated fresh default instance. Try exact variants, exposed text, Boolean and swap values and supported nested swaps, reset without touching the source, and from Design insert the tried values as a real linked instance in one Undo. |
| UI-41-032 | Code Connect component mapping | Inspect maps a component or component set to a code component per language with source path, property and value maps, stored in the optional validated document array with one Undo. Mappings travel in local library snapshots and a file's own mapping wins. |
| UI-41-033 | Code Connect snippets | Generates copyable snippets from the instance's real variant and property values for TSX, JSX, Vue, Svelte, HTML, Swift and Kotlin, with optional {{prop}} templates and nested swap mappings. Text is never executed and is not compiler-checked. |
| UI-41-035 | VS Code integration | VS Code connects through the local MCP server: the MCP setup dialog shows a .vscode/mcp.json configuration and a code --add-mcp command. Real VS Code 1.140.0 accepted that command in a throwaway profile, and a test launches the server from the generated configuration. |

### Effects and compositing (3)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-19-004 | Background blur | The target can now keep other effects, its parent frame can sit at any depth, and a clipping frame lets text and overflow into the backdrop. One target per page, group parents, masks and presentation remain limits. |
| UI-19-018 | Pass-through blend mode | Explicit pass-through controls on eligible unpainted containers with real nonisolated child blending and Undo. Motion, presentation, components, reduced group opacity and broader masking remain unsupported, and the Bridge is mock-tested only. |
| UI-19-036 | Backdrop filter clipping | The same target clip applies to nested targets in frame-local coordinates at any depth. General backdrop roots remain unsupported. |

### Export and delivery (7)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-40-007 | Export PDF | Keep shapes as vectors now writes opaque linear and radial fills as PDF shadings, and Print and Share use the same vector plan instead of flattening. Rich text, non-Latin text, transparent gradient stops, angular and diamond gradients, effects, blends and masks stay raster. |
| UI-40-024 | SVG text as outlines | Outlines now cover Latin letters with accents, common punctuation and currency signs, as well as composite glyphs and wrapped lines. Combining marks, other scripts, run colors and variable, CFF, color or WOFF2 fonts still refuse. |
| UI-40-026 | SVG simplify stroke | Unchanged. Opt-in simplification covers supported miter rectangles and circles and refuses unsupported geometry before download. Arbitrary vector networks and ellipse approximations remain out of scope. |
| UI-40-027 | SVG outline stroke | Unchanged. Opt-in outlines cover supported solid strokes with refusal before download. Effects, text, paint stacks, masks and markers remain unsupported. |
| UI-40-030 | PNG color profile | Unchanged. sRGB, untagged and Display P3 PNG output work, verified through real decoders. Custom ICC profiles are absent, and PNG has no CMYK form. |
| UI-40-036 | Export bounds warning | Unchanged. Export reports hidden targets, collapsed transforms, excessive raster sizes and broken images. Mask and rotated clip intersections and text glyph overflow remain conservative. |
| UI-40-040 | Export assets folder | Batch delivery gives one ZIP with assets and a checksum manifest. Writing into a folder is absent, because it would need a new native permission, and earlier exports are not kept in sync. |

### Sites (2)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-50-011 | Site interactions | Each layer can run up to 8 ordered click steps: toggle, show, hide, scroll to, move focus or copy text. Any step can wait on whether another layer is showing, with keyboard support. A step aimed at a layer inside a repeated list has no effect, and no visitor code runs. |
| UI-50-029 | Site embed | An https address or HTML in a sandboxed iframe, with YouTube, Vimeo, Spotify and Loom share links rewritten to player addresses. Preview now shows script-free HTML inline with remote images removed. Web addresses and scripted HTML still show a note in preview, because the app must not contact anyone. |

### Slides (4)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-49-021 | Prototype embeds | Embeds run every trigger including gamepad, plus Smart animate, Motion timelines and form controls, in a snapshot with no live link. Overlays open centered with no overlay transition, nested scroll regions and sound actions do not run in an embed, and interruption is not handled. |
| UI-49-023 | Live polls | The presenter tallies with buttons or number keys, bars show in Presenter and audience views, counts persist, and each count is an Undo step. Counting is manual because an offline app has no audience connection. |
| UI-49-027 | Slide export PDF | Slide PDFs now use the design PDF pipeline: shapes are real paths, images are image objects, links are live, and text uses embedded font subsets where it can. Text and effects that cannot be PDF objects stay as raster areas in place with a searchable layer, and Display P3 decks flatten. |
| UI-49-029 | PowerPoint interchange | Linear and radial gradients, one outer and one inner shadow, dashes, caps, joins and embedded video work both ways. Angular gradients, spread shadows and text effects flatten, and charts and SmartArt are omitted with notices. Not opened in PowerPoint or Keynote. |

### Fills and colors (2)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-17-010 | Eyedropper | Edit > Sample Screen Color runs the system sampler from the shell, and the result goes to the open picker with one Undo or else to recent colors. A person's sampler click is untested, and the in-page button only points to the menu because the renderer may not start the sampler. |
| UI-17-012 | Sample screen color | Same native path. Display P3 files keep the wide sampled coordinates. A person's sampler click is not tested. |

### Frames (2)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-09-020 | Frame overflow inspection | The selected frame inspector shows an isolated image with the frame clip off, plus painted descendant bounds and candidate selection. Nested clips, masks and occlusion may conceal candidates, so exact pixel overflow is not proven. |
| UI-09-025 | Resize frame to fit content | Fit offers children, descendants and painted bounds, and Keep fitted to contents follows direct children in the same Undo. Mask, Boolean and slice roles still refuse the wider fits, and occlusion is not considered. |

### Free local MCP integration (4)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-59-031 | Live editor document synchronization | The Mac shell reloads a clean window within about 1-4 s after a saved-file change, honoring the MCP lock, as one Undo step that keeps surviving selection. Dirty windows keep their edits and Save still asks; sync is one way, so MCP cannot see unsaved state. docs/MCP-LIVE-CONTEXT.md. |
| UI-59-032 | Live editor selection access | read_live_editor returns page, selection and viewport from an opt-in per-window sidecar beside the saved project, resolved against the saved file. Read-only, shows the latest publication, needs a saved file and an open window. |
| UI-59-033 | Live editor screenshot capture | read_live_screenshot returns an actual WKWebView snapshot of the whole window, including panels, up to 1,600 px wide. Republished on change rather than on demand; a minimized window or background tab has none. |
| UI-59-034 | MCP raster artwork export | export_live_artwork_png returns the selection or page rendered by the open editor at 1×, longest side 4,096 px. There is no headless raster export, because the server has no renderer. |

### Drawing (14)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-16-004 | Brush drawing | Primitive, sampled, scatter and stretch brushes draw editable output with draft cancellation and one Undo. Native tablet acceptance and uncertain clipped or masked container ownership remain open. |
| UI-16-006 | Vector brush library | Local library holds primitive, sampled, scatter and stretch presets with bounded JSON import and export. Hosted or shared libraries are absent. |
| UI-16-007 | Custom brush creation | Named brushes can be primitive, sampled or stretch and persist locally. Multi-color art is absent. |
| UI-16-011 | Brush pressure response | Supplied pen or touch pressure sets size and opacity response with a configurable minimum, and a mouse uses full pressure. Real Chromium pen input is tested; a physical tablet and pressure in the Mac app remain unverified. |
| UI-16-015 | Dynamic stroke wiggle | The width wave now has a Smoothen control and repeatable irregular bumps, with a seamless closed seam, alongside exact splits. Effects, masks, instances and Motion are valid; live Booleans refuse and networks stay unsupported. |
| UI-16-018 | Calligraphic stroke | Nib sweeps curved and closed contours, and effects, masks, instances and Motion are valid. Pressure and tilt remain absent; auto layout and live Booleans refuse. |
| UI-16-021 | Shape builder tool | Sources may now have different colors: a merged region takes the color of the topmost shape over the first region picked, and what remains keeps its colors. Fill-only networks are sources. Opaque unstroked sources are still required, and the very-fast-drag note stands. |
| UI-16-023 | Multi-vector editing | Multi-vector anchor drags snap to geometry outside the moving contours, though handles do not. Shared networks, cross-layer topology and anchor-fragment Cut remain absent. |
| UI-16-024 | Pattern fills | Editable local pattern tile source with up to 64 bounded primitives, staged Apply with one Undo, shared SVG rendering and local persistence. Arbitrary live document-layer pattern sources remain absent. |
| UI-16-030 | Progressive blur | A real spatially varying nine-level blur with start and end radii and direction across shared rendering and exports, within strict budgets. Exact continuous effect and interchange parity are absent. |
| UI-16-031 | Brush import | Forma brush JSON imports validate before use, including the stretch field. Third-party brush formats are unsupported. |
| UI-16-032 | Brush export | Selected-brush and whole-library JSON export includes stretch settings. No third-party format. |
| UI-16-038 | Scatter brush creation | Deterministic scatter is unchanged. Continuous warp exists only as the separate stretch brush, and a preset cannot be both. |
| UI-16-039 | Sample a brush from canvas | A sampled silhouette can become a stamp or a stretch brush. Source limits are unchanged. |

### Google and installed font library (1)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-55-026 | Google catalog refresh command | Installed catalog snapshot reload validates before replacing the last good snapshot, and bounded family downloads support queueing, cancellation and retry. Live upstream catalog synchronization remains absent. |

### History and recovery (3)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-38-027 | Branch review | Conflicts plus structural base→branch and base→main summaries with previews; "Mark as reviewed" stamps the exact branch revision with the local profile label. Single-user: no other reviewers, comments on the review or pixel diff. |
| UI-38-032 | Main branch protection | Per-file toggle refuses direct edits to main and requires a review of the current branch revision to merge. Self-imposed, no permissions; Undo/Redo stay available; MCP and direct .oui writes are outside the guard. |
| UI-38-034 | File corruption recovery | A stored file failing validation opens recovery choices from startup, Home or Storage: newest version as a copy, reported repaired copy, raw download; the record is never changed. Does not repair an IndexedDB database that cannot open. |

### Home and file browser (2)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-03-019 | Copy file link | Copy file link works from the file browser and Local links, and a clipboard failure shows an error. The Mac app still asks you to open the matching .oui file, because the renderer is not given file paths. |
| UI-03-029 | Open file in new tab | Browser only: opens through a fragment that is cleared after load, and refuses files already open in this or another tab. The Mac app uses separate windows, not tabs. |

### Images and media (1)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-20-005 | Import SVG | Reviewed editable SVG layers cover stylesheets, filters, masks, clips, curved text, per-character positions and image patterns, with reports for reductions. Full SVG, CSS and typography conformance remains incomplete. |

### Import and interchange (8)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-39-029 | SVG import from | Editable SVG import now also matches structural pseudo classes, :not and sibling combinators, places markers as editable layers at each vertex, and keeps radial focal points on canvas and in SVG, raster and vector PDF output. Pixel comparisons with the source SVG pass, using SVGs written here. |
| UI-39-030 | SVG export for | SVG export works, but no export has been checked against a real design app. |
| UI-39-031 | Direct binary fig import | Offline .fig import keeps live structure in one cancellable worker. Spec pages open as Spec layers you edit block by block, read from the real block format and verified on one real file of headings, paragraphs and bullet lists; other block kinds follow the file schema only. |
| UI-39-033 | Sketch document import | Offline .sketch import is unchanged. Smart layout, native glyph layout and bitmap crop polygons are reduced, and it is tested with synthetic files only. |
| UI-39-034 | PDF document import | PDF import is unchanged. Patterns, mesh gradients, soft masks and image masks keep the page as an image, and it is tested with synthetic PDFs only. |
| UI-39-035 | Clipboard paste from | On Mac, Paste reads a base64 fig-kiwi payload from the clipboard's HTML through the .fig worker with Cancel, validation and one Undo. It is tested only with self-authored payloads in a publicly researched shape, and no real clipboard capture has been decoded. |
| UI-39-036 | Clipboard copy to | Copy selection as SVG places SVG markup on the clipboard as text and as an SVG flavor. Whether another app accepts that paste is untested, and Forma writes no fig-kiwi clipboard payload. |
| UI-39-037 | REST JSON import | Local REST JSON import keeps components, variants, auto layout, styles and prototypes live. Text, Boolean and instance-swap properties are now live, and library mains are rebuilt from their first instance on an Imported components page, so a rebuilt main shows that instance's overrides as defaults. |

### Layout guides (1)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-26-024 | Layout guide constraints | Guide snapping and durable direct-parent column and row span bindings work, with Undo, save and source automation. Arbitrary nested or rotated track relationships, alignment and offset-pin variants, and generated responsive CSS are unfinished. |

### Libraries and design systems (11)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-29-006 | Publish library | Adds collection choice and a changes-since-last-cached-version list by fingerprint. No hosted or team publishing. |
| UI-29-011 | Browse available libraries | Adds search across cached libraries. No hosted or community discovery. |
| UI-29-013 | Library asset preview | Set previews now show any variant. The 256-layer, geometry and SVG budgets and font-metric limits remain. |
| UI-29-015 | Review library updates | Adds named variable and mode review with up to 200 changed values, 24 shown, and in-use removed or retyped variables can be mapped from the review. No unrestricted visual diff or merge. |
| UI-29-016 | Accept all library updates | Removed or retyped variables in use can be mapped to an incoming variable of the same type, which retargets layers, aliases, form inputs and prototype actions, or detached with their values kept. All apply in one Undo. Prototype expressions that name a variable in text are not rewritten. |
| UI-29-017 | Accept selected library updates | Same variable decisions apply to selected updates, with the dependency closure, and component conflicts can be replaced explicitly. Prototype expressions that name a variable in text are not rewritten. Nothing is hosted. |
| UI-29-020 | Library analytics | An explicit scan counts current references in the local project library plus the open file: files, versions, instances, layers and unused assets, up to 2,000 files. It cannot see other people or devices, .oui files never opened here, history or trends, Trash or branch copies, and the panel says so. |
| UI-29-021 | Library usage counts | Now also counted across device files and for styles, variables and guides, on top of current-file instance counts. No organization, cloud or longitudinal data. |
| UI-29-024 | Move component between libraries | Consumer-side repair: after a source removal is accepted, a group is re-homed to a cached library with the same topology. Local IDs, instances and overrides are kept in one Undo, and the next review offers the new definition. Sources are not edited. |
| UI-29-032 | Component documentation page | Generated pages stay linked to their component. The inspector shows each as up to date or out of date when its source text changes, and Update page rebuilds generated text and examples in one Undo while keeping added layers. |
| UI-29-035 | Style conflict resolution | Style, guide, collection and component conflicts now all offer explicit Replace with library version or Keep my version as local. Keeping a component refuses while another installed group nests it. No merge. Folder navigation limit unchanged. |

### Live interface verification additions (2)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-58-018 | Foldable device closed preset | A labeled generic Forma book-style foldable closed layout (360 × 800) is searchable and insertable independently or as an undoable pair. It does not claim a named device, hinge, posture, safe areas or an exact hardware preset; see docs/FRAME-PRESET-ARCHIVE.md. |
| UI-58-019 | Foldable device open preset | A labeled generic Forma book-style foldable open layout (720 × 800) is searchable and insertable independently or as an undoable pair. It does not claim a named device, hinge, posture, safe areas or an exact hardware preset; see docs/FRAME-PRESET-ARCHIVE.md. |

### Mac system integration (9)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-02-005 | Trackpad pinch zoom | Safari gesture events zoom the canvas around the pointer with the wheel path's limits. Tested with synthetic DOM events on real WKWebView; no physical trackpad. |
| UI-02-014 | Drag assets to Finder | The Export dialog preview drags as WebKit's own NSFilePromiseProvider, named by the shell, with no new message; the promise's real write produced the exported image. Canvas layers and Assets cannot be dragged. Finder's side of the drop was not exercised. |
| UI-02-015 | Quick Look previews | Signed builds include a Quick Look preview and thumbnail extension for .oui. Both were proven in real system hosts, and invalid files fall back to the system view. |
| UI-02-017 | macOS document versions | Save stores the replaced bytes via NSFileVersion. File, Revert To lists versions, and Browse All Versions opens a sheet that previews each version from its own bytes and restores it as one Undo step. |
| UI-02-020 | Export through system share sheet | Share opens the system picker with a private temporary file, and Share As chooses PNG, PDF or the Forma project. macOS proposes services. No service was carried through to delivery. |
| UI-02-021 | Accent color preferences | Eight local accent presets plus the macOS accent color, sent by the shell and updated when it changes, adjusted to pass 4.5:1 in both themes. Stored outside .oui. Some older chrome and canvas selection overlays keep fixed violet values. |
| UI-02-023 | Reduced motion preference | prefers-reduced-motion in WKWebView equals the macOS setting as it stood (off); the setting was not toggled. Earlier limits stand. |
| UI-02-024 | Increased contrast preference | prefers-contrast in WKWebView equals the macOS setting as it stood (off); the setting was not toggled. Canvas selection keeps its own option. |
| UI-02-025 | VoiceOver integration | Working basic path with limits; see docs/IMPLEMENTATION.md. Real AXUIElement reads confirm the window and controls from the shell, and failures now speak assertively. VoiceOver speech, rotor and page-level accessibility were not tested. Full reference behavior remains incomplete. |

### Motion workspace and timeline (1)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-56-050 | Frame animation preview | Explicit sampled-frame preview with authored viewport, transport, fullscreen, navigation and reduced-motion policy, and native frame scrolling. Frames whose only motion is shader time open too. |

### Navigation and editor shell (2)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-04-018 | Draw mode switch | Draw switches the toolbelt to direct Pen, Pencil and Brush buttons plus shapes and Text, via toolbar or View → Draw mode. View state only: no saved state, no history entry, no separate Draw inspector. |
| UI-04-027 | Inline error messages | Recovery write failures have a persistent inline alert with Retry recovery and Save .oui file. Failures that go through the shared error path now stay on screen until dismissed. Refusals that post a plain message still fade after four seconds. |

### Forma extras (4)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-54-011 | Accessibility contrast audit | Automatic per-text-layer WCAG audit over painter order, with opacity compositing, worst gradient stop, worst text range and a one-Undo lightness fix. Images are not sampled: image, video, blend, partial-overlap, rotated, non-rectangular and theme-canvas backgrounds report "not evaluated". |
| UI-54-023 | Design-to-code export presets | File → Design-to-code export generates HTML/CSS, React, SwiftUI and Compose plus five token formats, with seven built-in presets and saved presets. Output is approximate with listed reductions: images and vectors are placeholders, and gradients, effects and mixed text are reduced. |
| UI-54-024 | Cross-tool color palette exchange | Resources → palette exchange reads and writes .ase, .aco, .gpl, .sketchpalette, .swatches, design tokens JSON, CSS and hex lists, and also reads Tailwind-shaped JSON, with bounded validation and one-Undo import. Solid opaque colors only; CMYK and LAB convert without a profile. |
| UI-54-027 | Local automation API | mcp/automation.ts is a source-checkout JSON CLI using the same transactions, validators and locks as MCP. No installed binary, stable API promise or in-app scripting host. |

### Pages and document structure (4)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-05-015 | Copy page link | Local page links work inside the open file, and in a browser they can open another saved file. On the Mac a link to another file still refuses, because each file has its own window and nothing may map a document identifier to a file path without widening native permissions. |
| UI-05-016 | Move layers between pages | Move to page transfers complete layer trees with stable identities, world geometry, live component inheritance and owned flows and motion, as one Undo step. Unsafe inherited appearance, split graph, prototype, mask, transform, timeline and deck cases refuse atomically. |
| UI-05-026 | Display P3 document profile | The canvas uses Display P3, and PNG, JPG and SVG keep it. PDF is converted to sRGB, and GIF, video, clipboard and slides use the same default without a color test. In WebKit, pattern and image filter paints clip to sRGB. Panel swatches stay sRGB because they are native color controls. |
| UI-05-028 | File cover selection | A reachable cover picker with search and reset uses any page frame, saved and undoable, with cached grid and list images, a 500 layer and 4 MB preview budget, and static posters. Exact thumbnail parity in the native file browser and against the reference is unverified. |

### Performance and reliability (9)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-53-001 | Large document loading | Measured benchmark added and dense pages mount in batches; 20,000 layers first frame ~1.4 s vs ~5.8 s single pass (dev server, Chromium, M3 Max). The whole document is still parsed and kept in memory. See docs/PERFORMANCE-BENCHMARK.md. |
| UI-53-002 | Progressive page loading | Pages with 3,000+ in-view layers mount root subtrees in ~800-layer batches with a progress indicator; pixels match the single-pass scene. Not applied to one dominant root, masks/blur fallbacks, drafts or non-Design views; later edits re-render in one pass. |
| UI-53-003 | Viewport culling | Partial: bounded conservative whole-root-subtree culling on the Design/Whiteboard canvas, with opt-out, selected/editing retention, exact immutable source index and measured viewport. Real omitted DOM/defs plus on/off pixels, pan/zoom/resize/Undo/export checks. |
| UI-53-005 | Image decode scheduling | Page images decode in a bounded queue when a page opens, two at a time, nearest the view first, up to 256, and stop when the page changes. No speedup is claimed, and WebKit can still decode an image synchronously if it paints first. See docs/PERFORMANCE-BENCHMARK.md. |
| UI-53-009 | Import cancellation | Terminable workers now stop .fig conversion and REST conversion immediately, as well as decoding, Sketch and PDF work. Synchronous .oui, SVG and final validation stages and native dialogs remain outside cancellation. |
| UI-53-010 | Long operation progress | Imports add a converting stage with layers converted, alongside byte, stage, page and animation export progress. Merge and status checks on large files still have no progress or cancellation. |
| UI-53-011 | Corrupt import reporting | Fixed .fig conversion limits and structural faults are now reported by name through the exact allowlist; other parser text stays hidden. Unsupported formats still get a report only, and repair stays .oui only. |
| UI-53-019 | Export memory limits | Note change only: animation export reports progress, cancels, and keeps its 1,800-frame, 4,096-edge and 8-megapixel limits. Layer tree virtualization exists; broader performance acceptance remains. |
| UI-53-026 | Missing asset placeholders | Missing or unreadable .fig images open as replaceable image placeholders, shown as a transparent checkerboard on the canvas only, instead of refusing the file. They select and move like any layer, and the inspector states the problem. Export leaves them empty. |

### Plugins widgets and extensions (10)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-43-008 | Plugin iframe UI | ui HTML up to 100 KB in an opaque frame; scripts run in a terminable worker and cannot freeze the editor. The mirrored DOM now has MutationObserver and viewport IntersectionObserver. |
| UI-43-009 | Plugin parameter input | Strict typed inputs through trusted host controls with a copied snapshot. Fields can list this file's pages, layers, components, styles or variables, passing only the chosen ID, and can show or hide on an earlier field. Package code cannot compute suggestions while the form is open. |
| UI-43-011 | Plugin document read API | Reads add fills, radius, typography, child IDs, a parentId filter, image and export reads, and with assets:read this file's styles, variables, collections and components plus each layer's assignments. Comments, annotations, code source and style values stay excluded. |
| UI-43-012 | Plugin document write API | Up to 20 reviewed forma.commit proposals per run, each one Undo step, plus a final propose. Adds delete, reparent and effects, with subtree ownership checks shown in review. Component properties, variants, slots, shader effects and geometry updates on rich or controlled layers stay out of reach. |
| UI-43-013 | Plugin node creation | Creates rectangle, ellipse, text, image, frame, group, section, component, instance, vector, line, polygon and star, nested with parent-relative coordinates, and masks at creation. Instances take name, position, visibility and opacity only. No slots or code layers. |
| UI-43-019 | Plugin networking permissions | No network by default. Requires manifest allowedOrigins (exact https or loopback origins), reviewed display and a per-run network:fetch grant, enforced in the host and again by a separate frame that narrows its own connect-src; tests show zero requests to unlisted origins. |
| UI-43-023 | Plugin reload | Reload installed local catalog or replace a reviewed package; explicit rerun creates a fresh worker and invalidates old grants/handlers. No automatic code/file watching or external development runtime. See docs/LOCAL-COMMAND-PLUGINS.md. |
| UI-43-027 | Widget resizing | Canvas handles and size fields resize within package limits, and host layout regenerates the layers from the saved view. Code runs once with a resize event after a resize settles, not on each drag step or after Undo. Text layout is estimated. |
| UI-43-028 | Widget interaction | Host hit targets send an action name to a fresh worker, one Undo step per event, with host-owned text input. Targets follow a rotated widget, and buttons can declare a host hover tint. No hover events in code and no timers, because every update is an Undo step. |
| UI-43-032 | Shader source filtering | Filters between Forma bundled and This file. No team, community or account sources exist. |

### Preferences and document settings (5)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-45-004 | UI scale preference | Scale reaches 150%, with presets at 135% and 150%. Menu bar, top bar, toolbar, sidebars, menus and root dialogs were checked at 1440×900, 1280×720 and 1024×640, with exact drawing and sidebar drag. Main menus cap to the window. |
| UI-45-015 | Export destination preference | Browser builds offer downloads or a save prompt per export, with Cancel and a visible fallback. The Mac app shows the save panel for every export. |
| UI-45-022 | Trackpad behavior | Two-finger panning and modifier/wheel zoom work through shared wheel events. Preferences add Pinch to zoom and Pinch speed. Tested with gesture events in WebKit; physical trackpad acceptance and per-device customization remain incomplete. |
| UI-45-036 | Smart quotes and symbols preference | Toggle also appears in Preferences, and substitution also applies to inline canvas text. Text on path, paste and composition keep their source; rules remain English only. |
| UI-45-052 | Helper permission settings | Preferences, Local helper has a real permission for the one local helper: clearing it stops every window sharing live context with the MCP helper and disables that command. It does not govern saved .oui files, which any tool the person runs can read. |

### Prototype animation and overlays (2)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-33-003 | Smart animate transition | Rectangles, ellipses, polygons, stars and paths morph, including different contour counts and open against closed shapes. Outlines over 1,024 curves cross-fade. Strokes and effects interpolate when they pair and fade when they do not. |
| UI-33-031 | Animation interruption | Every frame transition and overlay now interrupts without a jump. Going back reverses a move, push or dissolve, a third frame leaves from the frozen picture on screen, overlays turn around from where they are, and state changes no longer snap a running transition. |

### Prototype connections (1)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-31-016 | Flow link copying | Opaque named-flow links keep exact flow identity in presenter launch, dropdown and restart. Review and open work in the same file, and in a browser for saved files. On the Mac a link to another file refuses for the same permission reason as page links. There are no hosted prototype URLs. |

### Prototype presentation (7)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-35-005 | Device frame selection | Generic drawn shells for phone, foldable, tablet, laptop, desktop and watch. The frame still sets the viewport, and no real device artwork or hardware dimensions are claimed. |
| UI-35-022 | Share prototype link | Export prototype file saves a ZIP with one offline HTML player and a README, validated on load and blocked from network requests by its page policy. There is no hosted URL, so you host or send the file yourself. |
| UI-35-023 | Embed prototype | The dialog generates a copyable sandboxed iframe snippet, tested playing inside a sandboxed iframe on a host page. It embeds a file you host. |
| UI-35-024 | Prototype password | Real AES-256-GCM encryption with a PBKDF2 key at 600,000 iterations. Anyone with the file and password has the content, weak passwords can be guessed offline, a password cannot be recovered or revoked, and files open only from https or locally. |
| UI-35-026 | Mobile preview | The exported player works at phone widths with touch, 44 pixel controls and safe areas, tested with iPhone 13 emulation in Chromium and in a one-off WebKit check. Not tested on a physical phone, and there is no companion app. |
| UI-35-034 | Prototype audio playback | Local MP3, AAC, WAV, AIFF, FLAC or Ogg up to 60 seconds, saved in the file as WAV. Plays from presenter controls, on arrival at a frame, or from Play sound and Stop sound actions that run across frames, and sounds overlap. |
| UI-35-035 | Prototype video playback | Embedded MP4 and WebM playback in prototypes with transforms, clips, loop, mute, start time and a new non-destructive end time. Nonrectangular clips and masks require manual Play, codec and autoplay policies apply, and remote media and real transcoding are absent. |

### Prototype triggers (2)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-32-011 | Gamepad trigger | Gamepad triggers run in presentation, the exported player and slide embeds. Tested with simulated input only, not with a physical controller or in the native app. |
| UI-32-012 | Touch interaction support | Touch pointer paths work and were tested with simulated touch, including a tap in WebKit phone emulation. Not tested on a physical device. |

### Sections groups and slices (3)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-10-010 | Section link | Local section links work. Operating system deep links and cross-file resolution are absent. |
| UI-10-018 | Group blend mode | Blend modes and isolation are usable on groups, and pass-through has its own bounded path under UI-19-018. Not retested in this batch. |
| UI-10-019 | Group bounds from children | Groups, and sections and frames that opt in to Keep fitted to contents, refit around their children in the editor and now in headless automation edits. Rotated, flipped, clipped, masked, painted, fill-sized or animated groups keep their saved bounds. |

### Strokes (3)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-18-025 | Image stroke | Stroke and fill with one image paint match across tile, crop, fit, scale and offset, and image strokes now crop on the canvas. The Bridge transfer is still not a real round trip. |
| UI-18-027 | Outline stroke conversion | Same as UI-14-034: stacks, arrowheads, unlike fills, SVG export and paints held in place. Radial and image frames on flipped or unevenly scaled layers stay close rather than exact, and visible effects still refuse. |
| UI-18-028 | Stroke scale behavior | Fixed-width compensation also covers point-width profiles, keeping anchor ratios. Managed, locked, Boolean and Motion paths refuse, and direct scripted transforms keep literal semantics. |

### Transforms and arrangement (2)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-12-014 | Scale stroke with object | K Scale still saves a scale. Apply scale to values now also handles rich text runs, paragraph overrides, masks, vector networks and inner scales, and a nested instance carries the scale itself. |
| UI-12-015 | Scale corner radius | Apply scale to values turns an even scale into real corner radii, including independent corners, across the wider set of layers it now accepts. It refuses main components, an instance as the scaled layer, Booleans, text on a path, layout guides, code layers, widgets and animated layers. |

### Variants and properties (4)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-28-029 | Interactive variant transitions | Partial: reusable receiving-instance variant actions, nested materialized ownership, separate reaction binding, hover/press restoration, transient deterministic/collision-safe IDs, Undo/save/library closure and bounded presentation. |
| UI-28-031 | Component slot definition | Slots can list up to 32 preferred components and can require them, which applies through the slot controls but not to pasted content. Slot-bearing mains stay outside other components and instances, and nested template inheritance remains absent. |
| UI-28-032 | Editable instance slot content | Customized slots accept slot-bearing instances of other mains, with their own slots, Undo, save and copy. Preferred components list first and a slot can require them. Main defaults, managed layers and self nesting refuse. Bounded islands remain. Older builds refuse these files. |
| UI-28-033 | Reset instance slot content | Reset removes nested slot content, including nested slot-bearing instances, in one Undo. No native slot round trip. |

### Vector pen and editing (4)

| ID | Feature | Current state and limits |
| --- | --- | --- |
| UI-14-034 | Outline vector stroke | Outlining now covers stroke stacks, arrowheads, unlike fills and SVG export, and gradient and image paints stay where they were on the canvas, including on rotated layers. Radial and image frames on flipped or unevenly scaled layers stay close rather than exact, and visible effects still refuse. |
| UI-14-042 | Vector cut tool | Scissors now also cut at existing anchors, and the Knife follows a freehand path, with Shift for straight. A drawn line that stops inside a shape runs on through it. No cuts on general vector networks. |
| UI-14-043 | Slice vectors into separate layers | The Knife slices along a drawn path or closed loop into editable pieces in an identity-preserving group with one Undo. Gradient and image fills stay in place, strokes stay on each piece and effects stay on the group. |
| UI-14-044 | Vector eraser tool | The fill eraser cuts true arcs, closes the layer box on what is left, keeps gradient and image fills in place, and erasing everything removes the layer in one Undo. Open unstroked fills and layers with effects now work. Flipped layers keep their box, and networks stay unsupported. |

### Not started (7)

| ID | Feature | Why |
| --- | --- | --- |
| UI-02-027 | App sandbox file access | Not adopted. A sandboxed probe passed the basic smoke, save, export and drop, so the local server and clipboard work, but it failed the integration run. |
| UI-05-019 | Page loading on demand | Not implemented. A file is one validated JSON document, and undo, the crash journal, component sync and validation all need every page in memory. Loading pages on demand cannot be made safe for every existing file without redesigning those parts. |
| UI-39-032 | Direct binary fig export | No working path. A file only Forma could read would be a .oui with the wrong extension, and no reference schema exists here to show that any other app opens it. |
| UI-45-051 | Helper accessibility settings | No working path, and none is meaningful today: Forma runs no background helper and asks macOS for no Accessibility permission, so there is nothing to set. The Preferences guide says so. |
| UI-54-030 | Windows portability layer | Not started. Mac is the priority and electron/ stays experimental, so no time was spent here. |
| UI-61-035 | Find and replace inside specs | Find and replace reads text layers only, so words in a spec are not searched yet. |
| UI-61-036 | Collapsible toggle blocks | Absent. The real block format has no toggle kind, so a file could not carry one. |
