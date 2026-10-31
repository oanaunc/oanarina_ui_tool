# Local reports and automation tools

These tools share one dialog shell (`src/components/LocalToolDialog.tsx`), run only on this device and appear in the menus and Actions. Preferences here stay out of `.oui` files. This is a source implementation, not a Figma reference verification or native release acceptance result.

## Privacy dashboard (UI-54-029)

Help → **Privacy dashboard…** reports what Forma stores and what can leave the device. Forma has no account, analytics, telemetry, crash reporting, advertising or cloud sync, and never uploads project content.

Forma does make one kind of outbound request, so the dashboard does not claim otherwise: when a project or the Font library needs a catalog family that is neither bundled, cached nor installed, Forma downloads it from `fonts.googleapis.com` and `fonts.gstatic.com`. That request reveals the family and weights, plus the IP address and app version any web request reveals. It carries no project content. There is no switch to disable it yet.

The dashboard reads the live local settings and their sizes, counts database records without reading values, and never opens an absent database, since opening would create it. If listing is unavailable it says “Not measured” rather than zero. It reads the page's enforced `connect-src` policy and lists other hosts actually contacted this session from Resource Timing. Recent actions, recent colors, command counts, layouts and saved scripts or presets can be cleared after a confirmation. Projects, fonts and plugins are removed from their own managers.

`tests/privacy-dashboard.test.ts` scans `src/` so a new storage key, database, network primitive or absolute fetch target fails the build until it is declared, and checks the page policy and that the Mac shell has no networking client.

## Bug report bundle (UI-54-026)

Help → **Create bug report bundle…** saves a ZIP you can share as you choose. Forma never transmits it. By default it holds your description, app version, environment, numeric and enumerated preferences, recent command IDs, storage size, redacted runtime errors and structural document counts. It holds no names, text, colors, IDs, paths or artwork.

Including the document is an explicit per-bundle opt-in. The checkbox is always off at the start, resets after each saved bundle, and adds a separately named `document.oui`. `report.json` remains free of project content either way, and the dialog previews it before saving.

Runtime errors are captured from `window` error and rejection events and the render error boundary, kept in memory for the session (50 at most) and redacted twice: for quotes, paths, URLs, data, IDs and email addresses at capture, and against the current document's strings when bundling. Toast messages are not captured. A canary test proves no document string reaches the archive.

## Color palette exchange (UI-54-024)

Resources → **Import or export color palette…** reads and writes `.ase`, `.aco`, `.gpl`, `.sketchpalette`, Procreate `.swatches`, design token JSON, CSS custom properties and hex lists, and also reads Tailwind-shaped color JSON. Content is sniffed, so renamed files still parse. Files are limited to 5 MB and 4,096 colors, and every file is validated before anything changes.

Export sources are the document palette, color variables, paint styles, or colors used in layers. Import adds to the palette, skipping colors already present, or creates a new variable collection, with one Undo. Only opaque solid colors transfer: alpha is dropped with a warning, CMYK and LAB convert without a color profile and say so, and groups become slash names. Procreate palettes hold 30 colors. Text lists read eight-digit values as AARRGGBB. Round trips are tested here against the writers and a hand-built binary file, not the other applications.

## Batch transforms (UI-54-028)

Object → **Batch transforms…** runs a declarative JSON script: steps with a scope (selection, page, document), a filter (type, name and text globs, visible, fill) and operations (`set`, `offset`, `scale`, `round`, `rename`, `replace-color`, `replace-text`). Scripts are data, never evaluated; unknown fields refuse the whole script, and globs match in linear time. For JavaScript automation, use Local plugins.

Preview runs on a private copy and lists every change. Apply runs in one editor edit with one Undo and is disabled once the document changes. Moving a layer moves its descendants, and a child of an offset parent moves once. Locked and component-managed layers are skipped and counted, values clamp to field limits, and edited fields detach their bindings like any manual edit. Scripts can be saved on this device (32) or exported. There are no conditionals, loops or variables, and Motion and Presentations are refused.

## Design-to-code export (UI-54-023)

File → **Design-to-code export…** generates a starting point from the selection, or the page. Targets are HTML and CSS, React inline styles, SwiftUI and Jetpack Compose, plus tokens as CSS custom properties with mode blocks, Tailwind theme JSON, DTCG JSON, Swift constants and Android resources. Seven built-in presets can be adjusted and saved on this device (units, root size, indent, variable use).

Output is approximate. Auto layout becomes flex or stacks and free layouts become absolute positions or offsets. Text is escaped per language. Each reduction is listed: images and vectors become placeholders, gradients and effects are not reproduced, only the top paint is used, mixed text uses the base style, and prototypes are not generated. The generated native code is not compiled here. The limit is 2,000 layers. The legacy Copy as CSS command and Inspect are unchanged.

## Export queue (UI-54-018)

File → **Export queue…** adds the selection in preset format sets (Web, iOS, Android, Review) or a custom SVG, PNG or JPG row. Each row is a snapshot taken when added, using the shared export pipeline, so rows from several pages can sit together. The queue survives closing the dialog for the session, renders sequentially, isolates failures, cancels, retries failed rows, and saves a ZIP whose manifest lists anything missing. It holds 200 files and 100 MB. PDF remains in Export, nothing is persisted, and files are not checksummed as in the batch archive.

## Command usage learning (UI-54-020)

Help → **Command usage…** is off by default. When on, it stores run counts per command ID on this device and nothing else. Commands with three runs appear under **Frequently used** in Actions, ranked with a 30-day half-life. A tip appears after five runs of a command mostly run without its shortcut, or ten of one with none. Everyday commands such as Undo are excluded. Turning learning off stops counting and hides the Actions section; **Clear counts** deletes the data. Native menu commands count like any command, and arrow-key or tool-key actions that bypass commands do not.

## Workspace layouts (UI-54-021)

View → **Workspace layouts…** saves named arrangements on this device (24): sidebar widths and collapse, the left tab, rulers, pixel grid, outlines, overview minimap and canvas scrollbars. Applying one is immediate and never edits a document. Layouts are device-local, so they are neither exported nor shared, cannot be assigned shortcuts, and do not move panels, because Forma has no dockable panels.

## Side-by-side device preview (UI-54-022)

View → **Side-by-side device preview…** reflows one frame at up to six device or custom sizes through the same preview derivation as Responsive resize, side by side, with the overflow count for each size. Each slot uses a private copy, so nothing reaches the document or Undo, and a refused size reports only in its own card. Previews are static images of Design frames: prototypes do not run, and they do not update while the dialog is closed. The 16 MB and frame preview limits of Responsive resize apply.

## Validation

`tests/privacy-dashboard.test.ts`, `tests/local-automation.test.ts` and `tests/e2e/local-tools.spec.ts`. Native builds were not rerun for these web-layer changes.
