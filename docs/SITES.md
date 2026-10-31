# Local Sites workspace

A Forma site is a `.oui` project with `workspace: 'site'`. It is edited locally and leaves the app only as static files you export and host yourself. This is a local implementation, not complete Figma Sites parity. Forma has no hosting: publishing, unpublishing, custom domains, hosted staging and analytics do not exist here.

Create one from **File → New site** or the **New site** starter on the file screen. Each site page is a canvas page with one top-level root frame, so the canvas, layer tree and inspector work as they do in Design. Only the root frame's layers are exported; other layers on the page are reported as outside the root.

The workspace adds a tool bar (Design/Preview, breakpoint, Site panel, Export site) and a Site panel with four tabs.

## Pages

The page tree supports add, child, duplicate, delete, reorder, nest and unnest, all through document history. A page's slug sets its output folder. The home page is written at the site root and adds no folder to its children. `assets` is reserved, slugs are unique per level, and a site always keeps one top-level static home page. Pages added or removed from the regular page list join or leave the site automatically. Duplicating from the Site panel keeps breakpoint values and interactions; the regular page list and copy and paste carry only canvas layers. Design-only tools that are unavailable in a Whiteboard, such as brushes, resize previews and local plugins, are also unavailable in a site.

## Breakpoints

Desktop is the page design width and resizes page roots. Every other breakpoint applies at or below its own width as a `max-width` media query and inherits every wider one. Tablet and Mobile always exist. **Settings → Custom breakpoints** adds up to four more, named, each 240 pixels or wider, narrower than Desktop and with its own width. Removing one removes its overrides. Widths are 240 to 3,840 pixels and Tablet must stay wider than Mobile.

### Editing on the canvas

**Breakpoint frames** in the tool bar shows each breakpoint as a real frame beside the Desktop root, at its width, with its overrides and with auto layout and constraints applied. Every ordinary tool works on them. Choosing a breakpoint in the tool bar selects its frame and brings it into view.

- An edit on a frame becomes an override for that breakpoint, one Undo step, and Desktop is untouched. Moving, resizing, restyling, editing text in place and changing effects, strokes, fills, layout and opacity are all captured. A value set back to what the breakpoint would inherit removes the override.
- Dragging the side of a breakpoint frame changes that breakpoint's width. A width the rules refuse puts the frame back.
- Deleting a layer on a frame hides it at that breakpoint. It stays at the others.
- A layer drawn inside a frame joins the Desktop tree at the matching position, so it exists at every width. Hide it per breakpoint if it should not.
- Reordering layers, renaming them and changing anything that is not an override property on a frame is not kept: the frame rebuilds from Desktop plus overrides after every edit. Text styled in ranges on Desktop shows as plain text once a breakpoint overrides its words.
- Frames show static canvas content, so a repeated list appears as its single template layer.

Frames are saved in the file with the setting. Turning them off removes the frames and keeps every override. They are never exported. A site that has never turned them on saves exactly as before. Older Forma builds refuse a file that uses breakpoint frames, custom breakpoints or any of the new motion, filter and rich text data below.

### Breakpoint values

**Layer → Breakpoint values** edits the same overrides as numbers. Width, height, offsets, visibility, opacity, corner radius, fill, stroke color and width, sizing, text content, text size, line height, letter spacing, weight and alignment, and frame layout, grid columns, padding, gap, justification, alignment and wrap are typed and range-checked. Effects and gradient fills are set on a frame and reset from this panel. Anything else is refused. When the words differ, the export ships each version and CSS shows the right one, with no script.

## Layout mapping

Auto layout maps to CSS flexbox and grid using the same fields as the layout solver: direction, gap, padding, justification, alignment, wrap, fixed/hug/fill sizing and minimum and maximum sizes. Grid placements for explicitly placed layers come from the solver's `placeGrid` at each breakpoint. Automatic children use CSS auto placement, so a column override reflows them. Frames without auto layout position children absolutely using their constraints, and do not reflow; `Layer → Stack`, `Grid` and **Stack on mobile** insert or set responsive structures. A `layout` override can turn an absolute frame into a stack on one breakpoint.

Limits: `fr` tracks ignore a maximum size because CSS cannot express it, first-on-top stacking order is not exported, and text wraps by browser measurement rather than the canvas measurement. Vector shapes, masks, boolean results, text on a path, outlined text, adjusted or cropped images and progressive blur render through the canvas Artwork renderer as inline SVG and do not reflow. Gradient and image strokes export as solid color and dashed strokes as solid. Video exports as its poster image. The export dialog lists each case.

## Links and interactions

- **Link**: a site page, web address (`http`, `https`, `mailto`, `tel`, never embedded credentials), section on any page, or the current collection item. Links are real `<a>` elements with relative paths and `aria-current`. Nested links are dropped.
- **Navigation** inserts a real link for each top-level page, as a `nav` landmark. It does not update itself when pages change later.
- **Click** toggles, shows or hides another layer on the same page, with keyboard support and `aria-expanded`.
- **Hover** sets scale, opacity, vertical move, fill and text color, and also applies on keyboard focus.
- **Scroll** offers fade, slide-up or zoom reveal once or every time, plus parallax speed. **Scroll timeline** plays keyframes against scroll position: progress is 0 when the layer's top enters at the bottom of the window and 1 when its bottom leaves at the top, with a start and end inside that range. The exported script samples the keyframes on scroll, and does nothing under reduced motion.
- **Animation** offers five presets (fade in, slide up, zoom in, pulse, float) or custom keyframes, with duration, delay, loop and easing. Keyframes hold opacity, position, scale and rotation at offsets from 0 to 1, up to 16, and export as CSS `@keyframes`. Motion is defined once and does not vary by breakpoint.

## CMS

Collections are local records stored in the project: up to 50 collections, 50 fields and 2,000 items each. Field types are text, long text, rich text, number, yes/no, date, image and URL, and values are validated by type. Items have slugs and may be drafts; drafts are never exported. Items can be reordered and duplicated. Changing a field's type keeps values that remain valid and clears the others.

Rich text is stored as plain source, so a saved value cannot carry markup. It supports `#` headings, `**bold**`, `*italic*`, `` `code` ``, `[links](https://example.com)`, `-` and `1.` lists and `>` quotes. Everything else stays literal, and links outside http, https and mailto stay text. A text layer bound to a rich text field exports block content.

Set **Repeat for collection** on a layer to render it once per published item, with optional limit, sort and up to 16 list filters. Filters run before the limit, and all of them must match. Rules are is, is not, contains, is more than, is less than, has a value, is empty, is yes and is no. Bind text layers to text fields and image, rectangle or frame layers to image fields. Set a page's **Collection page** to generate one page per item at `<page path>/<item slug>/`. A layer's **Collection item** link goes there. References between collections and CSV import are not available. Bound layers outside a matching list or collection page keep their canvas content and are reported. Unknown or missing values render empty rather than inventing content.

## Metadata and accessibility

Site title, description and URL, Open Graph image and favicon are set in **Settings**, with per-page title, description and Open Graph overrides. Collection pages use the item's first text, long text and image fields. Open Graph images need the site URL to be absolute, and the export warns otherwise. The site URL is never contacted.

Settings cover page language, skip link, reduced motion and focus ring color. **Layer → Meaning** sets heading and landmark tags, a section id and alternative text. Each page gets exactly one `main`. The export warns about missing or repeated H1 headings and images without alternative text. It does not test color contrast or keyboard order.

## Forms and embeds

**Form** creates a real labelled form with client-side validation. The canvas shows stand-in layers; the export renders native controls. A static site has no server, so Forma never receives submissions. Without an `https` endpoint, submitting shows "This form is not connected to a service, so nothing was sent." and the page's policy blocks form posts. With an endpoint, the browser posts directly to it, and that service's behavior is outside Forma.

**Embed** is an `https` address or HTML, always in a sandboxed `iframe` with no referrer. YouTube, Vimeo, Spotify and Loom share links become their player addresses, with scripts and own-origin access on because those players need them. Forma does not contact them; only a visitor's browser does, in the exported site. HTML is rebuilt from an allow-list and stays in an opaque origin behind its own content security policy. Enabling scripts keeps the HTML as written and adds only `allow-scripts`. Same-origin access is offered only for address embeds with scripts on, because some third-party players need their own origin. Top-level navigation and popups are never allowed.

## Preview

**Preview** shows the export output at the selected breakpoint width, scaled to fit. It runs in an opaque sandboxed frame whose policy permits only two pinned scripts and no network. Links between pages navigate within it. External links stay put, embeds show a note, and forms validate without sending. It is a local view, not a hosted preview or a shareable address.

## Export

**Export site** reviews warnings and writes a ZIP to a location you choose, through the existing save path. The archive holds an `index.html` per page, `assets/site.css`, `assets/site.js`, optional `assets/fonts.css` and raster images. All paths are relative, so a site works from any folder of a static host and from disk. Forma does not write an unpacked folder.

Generated HTML escapes all user text. CSS only receives validated numbers, colors and escaped font names. Each page carries a content security policy, widened only for that page's embeds and form endpoint. SVG images stay inline as image data so they cannot be opened as same-origin documents. Only open-license fonts Forma has loaded are included; others use the fallback stack and are reported. Archives are capped at 200 MB.

## Validation

`tests/site-breakpoints.test.ts` runs breakpoint frames through the real editor transaction: capture, inheritance, reset, Undo, deletion, adoption, width dragging, auto layout, constraints, save and reopen, and no export or file change when unused. It also covers custom breakpoints, wider overrides, keyframes, the runtime's sampling against the model, filters and rich text escaping. `tests/e2e/site-breakpoints.spec.ts` drags a layer on a Tablet frame, edits text in place on a Mobile frame, adds and removes a custom breakpoint, and checks each result in Preview.

`tests/site.test.ts` covers the model, reconciliation with generic page commands, malformed `.oui` input, escaping, CSS injection, sanitizing, CMS expansion, metadata, ZIP paths and the pinned preview policy. `tests/e2e/sites.spec.ts` drives the app, downloads the ZIP, serves it from a throwaway local server, and asserts DOM, computed styles and geometry at three widths, solver agreement on Desktop, hover, reveal, parallax, toggles, form refusal, embed sandboxing, item pages and no outside requests. It also opens the export from disk with reduced motion, and round-trips a saved `.oui` to byte-identical output. This is not a reference comparison with Figma Sites, and the native Mac shell was not exercised.
