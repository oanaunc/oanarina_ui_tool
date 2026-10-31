# Brand projects

A brand project is a local `.oui` Design file with optional `brand` data: a kit, templates and assets. It opens with **Assets**, **Templates**, **Kit** and **Layers** tabs in the left sidebar. An asset selected on the canvas shows its editable content in the right sidebar. Older Forma builds open the same file as an ordinary Design file and do not enforce its locks.

Everything here runs on this device and is shared by passing files.

## Starting a project

- **File → New brand project** or the **New brand project** tile on the Files screen creates an empty project with Assets and Templates pages.
- **Templates → Brand → Campaign starter** creates a project with a sample kit, six published templates across five categories and one draft asset. All of it is original Forma example content.

## Templates

A template is a top-level frame on the Templates page. Create one from a size preset, or adopt a frame you drew.

- A **draft** can be edited freely. Mark text or image layers as **slots**. Text slots can optionally allow brand colors or brand fonts and can have a character limit. Slot names must be unique in a template because they map to spreadsheet columns. `name` and `size` are reserved.
- **Publish** requires at least one slot. In Refuse mode it also requires every value in the frame to be in the kit. A published frame is frozen until you unpublish it. Publishing makes the template available in this project. It sends nothing anywhere.
- **Duplicate** creates an independent draft with remapped slots.
- **Unpublish** does not change existing assets. A later publish raises the revision, and assets built earlier are reported as built from an earlier revision.

## Assets and locks

Using a published template creates a self-contained copy on the Assets page. Instances are detached and style, variable and prototype references are dropped, so updating a component, style or template never changes an existing asset.

Locks live in the shared rule `validateBrandMutations`, which runs inside the editor's `edit` path and inside the MCP transaction path. Panels, canvas gestures, keyboard shortcuts, paste, reorder, grouping, Layers actions and `apply_operations` / `replace_document` all reach the same check, and a refused edit leaves the document and Undo history unchanged.

| Target | Allowed |
| --- | --- |
| Asset frame | Rename, move as a whole, delete while editable |
| Slot, Draft or Changes needed | Slot content, plus color or font where the template allows it |
| Slot, In review or Approved | Nothing until the asset is reopened |
| Every other layer in an asset | Nothing |
| Layer tree inside an asset | No additions, removals, reparenting or reordering |
| Published template frame | Move and rename only |

Annotations, developer resources and export settings stay available on locked layers because they do not change the artwork. Page comments work as usual.

Each asset records a fingerprint of its locked styling. A file edited outside Forma can still change locked values. Forma does not refuse to open such a file. The Kit tab and MCP `validate_project` report the difference. Derived text and auto layout geometry are excluded so font reflow does not read as tampering.

Copying an asset frame and pasting it creates ordinary layers, not an asset. Use **Duplicate** on the asset instead. Those layers are still subject to brand value checks on the Assets page, and bulk export does not include them.

## Brand kit

The kit holds named colors and font family names. An empty list applies no check for that kind of value. The choice is yours in **When a value is outside the kit**:

- **Refuse the edit** stops any new out-of-brand fill, stroke, gradient stop, shadow, text range color or font family on the Assets page, including pasted layers and new shapes.
- **Allow and flag it** permits the edit and lists it in **Brand audit**.

Draft templates are always flagged rather than refused, and Refuse mode blocks them at publish. Values already on a layer do not block unrelated edits if the kit changes later. Pixels inside images are not analyzed. Other pages you add are outside these checks.

Fonts are names only. Forma never copies font files into a brand package. Commercial fonts must be installed and licensed on each Mac.

## Spreadsheet batches

**Batch from spreadsheet** accepts pasted CSV or TSV, or a `.csv`, `.tsv` or `.txt` file up to 5 MB, 500 rows and 64 columns. Parsing is strict: ragged rows, stray quotes, repeated or blank headings and control characters are refused with their line number.

The review maps each column to a slot, `name`, `size` or Ignore. An unmapped column blocks the batch. Each row shows what will happen and why it cannot. Empty cells keep template content. Image cells name attached local files by file name. Web addresses are never fetched and inline data is refused.

**Create** writes every asset in one edit, so one Undo removes the whole batch. Every row becomes a real editable asset with the same locks. A column named `size` overrides the sizes chosen for that row.

## Sizes

Sizes are reference values and platforms change theirs. Adding a size creates a separate asset. Full-bleed layers stretch, text keeps its relative width and scales its type, and other layers scale uniformly around their mapped center. This is a proportional fit, not a redesign, so check tall and very wide results. Size variations need an asset built from the template's current published revision. Older assets can still be duplicated.

## Bulk edit

**Bulk edit** works on the checked assets, or all assets when none are checked. It offers literal find and replace, setting a slot, and replacing an image slot. One image fills every target. Several images map in list order and must match the editable target count exactly. Assets in review or approved are skipped and reported, and one Undo reverts the operation.

## Local status

Status moves Draft → In review → Approved, or In review → Changes needed. Approved assets can be reopened to Draft. Status is a label you set on this device. It records when it changed, not who changed it, and it does not notify anyone. It does freeze slots, which the store enforces.

## Versions

Each status change also records the asset's slot content automatically, keeping the latest 12 entries per asset. **Asset history** in the status section restores any entry as an undoable edit while the asset is editable. An image over 256 KB is not kept in that history, and stays as it is on restore.

**Asset versions** compares one asset against the file's named local versions and can restore that asset's slot content as an undoable edit. It reads the existing 20-per-file named versions. Autosaves are not listed, and locked styling is not compared because it does not change.

## Bulk export

**Export assets** renders frames through the shared delivery pipeline into one ZIP with a manifest and checksums: PNG, JPG or SVG at 1x to 3x, up to 200 assets and 100 MB per archive, optionally approved only.

## Campaign folders

Campaign folders are the local file browser's folders. Set one from the Kit tab or the Files screen. A folder groups whole projects, not individual assets. Filter the Files screen by **Brand projects**. File search also matches kit names, template and asset names, and text slot content for brand projects.

## Sharing

**Export package** writes a `.formabrand.json` file with the kit and published templates, flattened and with no font files. **Import package** validates the whole file, shows what will be added, and merges additively: this project's kit only grows and its templates stay untouched. Importing the same revision again skips it.

Sharing means passing that file by hand. There is no live link, update notification or central library. A published local component library can also be installed in a brand project for use in templates, and a project can be saved as a personal starter kit. Both already work through their own local features.

## Limits

2,000 assets, 200 templates, 64 slots per template, 64 colors and 32 fonts per kit, 200 batches, 5,000 characters per text slot, 20,000 layers per page and 50 MB per project.

Because every asset is a full copy, large images inside templates or slots multiply quickly. A batch or image replacement that would pass 50 MB is refused.
