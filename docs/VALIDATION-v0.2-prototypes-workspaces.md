# v0.2.0-dev.3 prototypes, workspaces and typography

Development source checkpoint, October 29, 2026. This is not complete Figma parity or a new notarized release. The public installer remains v0.1.0. The register contains 1,991 requirements in 59 categories: 924 implemented, 158 partial and 909 planned. Reference verification is separate from implementation status.

## Delivered paths

- Prototype interactions include ordered actions, variables and bounded expressions, conditions, navigation/back/links, overlays, variant changes, keyboard/delay/gamepad/pointer triggers and root scrolling. Authoring has flow metadata, canvas connections, search and destination warnings. Presentation handles transitions, smart animation of supported properties, nested overlays, variable state, motion sampling, fixed/sticky positioning, hints, scale and fullscreen where available. Exact device shells, nested scroll regions and complex animation semantics remain partial. See PROTOTYPES.md.
- Ruler/layout guides support grids/rows/columns, colors, count/gutter/margins/alignment, styles, frame overrides and optional artwork export. Canvas movement/resizing snaps to objects, centers, guides, frame/layout edges and adjacent equal gaps; Option measures transformed axis-aligned bounds. Inspector fields parse arithmetic and retain full precision when untouched. Arbitrarily angled guide snaps and grid-track child constraints remain incomplete.
- Whiteboard has real editable stickies, anchored three-route connectors, sections, tables, mind maps, stamps, marker/highlighter ink, whole-stroke erasing, and local timer/voting/laser. Copy/paste remaps logical metadata. Connector geometry accounts for rotated, reflected and scaled parent groups. Shared sessions, cursor chat, music/widgets and full FigJam catalog remain absent. See WHITEBOARD.md.
- Slides has editable templates/themes, thumbnails/order, text/shapes/images/live components, scoped clipboard, notes, local comments, presenter/audience views, timer, transitions, hidden slides, aspect resizing, PNG/ZIP and raster PDF. Export cancellation is tested. PDF pages contain rendered slide images. PowerPoint, cloud sharing/presenting, polls and playable video/prototype embeds remain absent. See SLIDES.md.
- Character ranges support mixed fonts, weights/styles/sizes/colors, tracking, links, decorations, numeric font axes/OpenType tags and underline appearance. Layout measures mixed faces and supports grapheme-safe wrapping/truncation. Styled/plain clipboard, inert HTML extraction, Unicode validation, component-property/variable/whiteboard content reconciliation and reusable base typography styles are covered. Complete inline-canvas range editing, paragraph runs and text shaping parity remain incomplete. See RICH-TEXT.md.
- Fonts include a 1,959-family Google snapshot, 24 offline families, 262 bundled face files including 123 true italic files across 17 families, language filtering, Google favorites, local TTF/OTF import/export, missing-family audit/replacement, and used-face/script embedding with license flags and a 50 MB project limit. Commercial fonts remain locally licensed user assets. See FONTS.md.
- A free standalone local MCP server exposes nine stdio tools for one selected saved project. Atomic revision-checked transactions, scoped paths, validation, propagation, rollback/undo, bounded responses and vector SVG are tested with the real SDK client and a bundle launched outside this repository. Live editor synchronization and coordinated native writers remain unfinished. See ../mcp/README.md.
- Vector endpoint joins, smooth joins, contour splitting, approximate healing and selected-point scale/rotation have validation, normalized geometry, instance ownership protection, undo and persistence. Offset/cut/eraser/network tools remain absent. See VECTOR-OPERATIONS.md.
- The original generated app icon now builds into the Mac iconset. The Mac and experimental Electron save allowlists accept the new font/PDF/ZIP export types; no broader path access was added.

## Verification

Final consolidated results are below. Focused checks are documented in each workflow guide; they do not replace platform acceptance.

| Check | Result |
| --- | --- |
| Core `npm test` | 298 tests passed in 24 files |
| MCP type check and tests | 19 passed, including real SDK stdio communication and standalone bundle outside checkout |
| Universal Mac build | Passed, Apple silicon and Intel compilation; development ad-hoc signing |
| Native startup smoke | Passed: 151 buttons, 1,991 requirements, 1,959 Google families, 179 installed Mac families; canvas capture and MP4/WebM capabilities advertised |
| Production browser suite | 87 interaction tests passed against the production build in 37 seconds |
| Development-only repository concurrency check | Passed: 25 simultaneous named-version saves retain 20 unique snapshots transactionally |
| Whitespace/source review | `git diff --check` passed; independent reviewer fixes included |

The production browser run uses the built Vite assets on a separate preview port. One repository concurrency check directly imports the development TypeScript module and is run separately on Vite development. Two old text-content selectors were made exact after the new range editor introduced another accessible field. The large-image check exposed timing-sensitive shortcut registration at startup. Global shortcuts now attach in a layout effect before the first interactive paint; the picker also remains attached until change/cancel. The final production run passed the real 9.9 MB base64 PNG import and database recovery check. The native app was also opened and its sample editor visually inspected through desktop control.

Native smoke is an Apple silicon runtime check. Intel compilation does not establish Intel runtime acceptance. Full VoiceOver, localization, large-document performance, physical input devices and native visual typography acceptance remain incomplete. Vite retains its large-chunk and public-font-stylesheet build notices. No new notarization was submitted.

## Connected Figma evidence and desktop inspection

A disposable synthetic five-node composition exercised bridge node conversion against the actual connected API. A separate read confirmed three stretch columns/gutter/margin, a page ruler guide, vertical frame overflow, click navigation with dissolve/easing, centered text and diagonal editable vector geometry. Runtime grid validation rejected keys accepted by the generic typing; the implementation and strict mock were corrected. The sanitized fixture is tests/fixtures/bridge-prototype-roundtrip.json.

The final screenshot request hit the connected service's Starter-plan call limit. This fixture reused an existing synthetic page because page removal was unavailable in that connection. It is not a desktop development-plugin UI round trip. Browser reference menus were inspected read-only. Figma desktop subsequently ran from Applications, but computer control continued resolving its launcher identifier and could not attach to the main editor. No private Figma reference content/identifiers or screenshots are committed.

The bridge reports mixed character styling, font axes/OpenType and unsupported prototype behavior as reductions. Binary .fig interchange, arbitrary round-trip fidelity and the wider Figma suite remain unfinished. The expanded audit/register is a tracked specification rather than a claim that all original buttons/screens or apps have been completed.
