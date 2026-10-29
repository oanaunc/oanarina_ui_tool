# Implementation and limits

The register describes the target, not a completed clone. **Implemented** means the narrow named behavior has a reachable working path and validation evidence. **Partial** records material limits; **planned** records absent behavior. Reference verification is tracked separately. Complete Figma parity requires additional visual, accessibility, performance, platform and user acceptance testing.

## Current source versus public release

The source is **0.2.0-dev.1**, with 508 implemented, 111 partial and 1,241 planned requirements. The public website still distributes the signed/notarized **v0.1.0** preview. See [v0.1 validation](VALIDATION-v0.1.0.md) for that release and [v0.2 development validation](VALIDATION-v0.2-development.md) for the current source.

## Working development workflows

The editor draws frames, sections, slices, basic shapes, editable cubic curves and freehand paths. It supports selection, grouping, ordering, numeric transforms, live boolean operands, curve anchors/tangents, shape geometry, single-style text wrapping/formatting, fill/stroke stacks, gradients, blend modes and effect stacks. Responsive stacks include fixed/hug/fill sizing, independent padding, gaps, alignment, wrapping, size limits and frame resize constraints. Project edits have history and versioned `.oui` serialization.

Pages, basic local components, manual instance reset, snapshots, local comments, simple click-to-frame presentation, basic CSS inspection and SVG/PNG/JPEG export are present. The font catalog includes 1,959 families, with 24 bundled offline and installed Mac font discovery. The Figma development plugin converts a subset of editable nodes and properties through `.oui`, with known-loss reports.

## Material limits

- The shell does not match every observed Figma rail, toolbelt, submenu, shortcut or dialog. The shared 108-command registry is a subset. Motion, Agents/Code, full Draw, Dev Mode and the wider suite remain largely planned.
- Positions are stored as absolute coordinates. Nested SVG rendering propagates transforms, but editing/selection overlays within rotated or reflected containers need world-matrix handling. Booleans with text, arbitrary groups and full vector networks are incomplete.
- Single-style text does not support rich ranges, full paragraph styling or advanced OpenType controls. Italic is synthetic; actual italic font assets remain planned. Lists are simple prefixes.
- Angular/diamond gradients are raster patterns. No full masks, background blur, variable-width strokes or advanced Draw brushes. Tight exports can crop outer effects/rotated overflow because visual export bounds are incomplete.
- The layout solver implements stacks and basic fixed-count grids. Grid tracks/spans, baseline alignment, all aspect-ratio/auto-size interactions and deep wrap stabilization remain incomplete.
- Components copy into instances and reset manually. Live propagation, variants, properties, overrides, shared libraries and cross-page references are incomplete. Variables/tokens have not been implemented.
- Prototypes have basic click navigation only. Full transitions, overlays, conditions, scrolling, devices and motion are unfinished.
- Comments and snapshots are local. No cloud collaboration, accounts, permissions, notifications, branches or backend sync.
- Recovery/recent files/snapshots still use quota-limited localStorage. Explicit native saves are atomic `.oui` files. Use saved files for durable portable backups and large documents.
- SVG import is a sanitized visual asset. No direct binary `.fig`, Sketch or PDF interchange. Bridge tests are API mocks; real Figma desktop transfer remains unverified. Read the [bridge guide](../figma-plugin/README.md) and inspect every transfer.
- Native Mac builds are universal; runtime tests were on Apple silicon only. Windows/Electron is experimental. Complete VoiceOver, keyboard-only canvas, localization, large-document and performance acceptance work remains.

The [development validation report](VALIDATION-v0.2-development.md) lists checks and practical limits. Future work must keep the per-feature register honest and expand tests with real behaviors rather than marking entire categories complete.
