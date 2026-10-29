# Local whiteboard workspace

Oanarina now has an editable local whiteboard workspace. It reuses the design editor's layers, canvas, document files, undo and export renderer. It is a development implementation, not complete FigJam parity or a multiplayer whiteboard service.

Choose **File → New whiteboard**. The whiteboard toolbar appears above the canvas. Projects use the existing `.oui` format with `workspace: "whiteboard"` and optional versioned `whiteboard` metadata; older design documents remain compatible.

## Working tools

- **Sticky notes:** choose one of six colors, enter a local author label, and add a note. Its frame, body and author remain ordinary editable layers. The note panel edits the selected note's text and author. Moving or resizing the frame updates its text areas.
- **Shapes and text:** the palette offers rectangles, ellipses and diamonds, with centered editable text. A separate text tool inserts standalone text. Standard layer controls remain available.
- **Sections:** add a named section and use the shared canvas/layer controls to move, resize, rename and organize it. Inserting new objects does not automatically infer section membership.
- **Connectors:** choose two layers on the same page, then create a straight, elbow or curved connection. Set its label, color, and start/end arrowheads in the connector panel. Connections follow ordinary movement and resizing of their endpoints. Rectangle/diamond anchors respect transforms; ellipse anchors follow the ellipse contour. The paths, arrowheads and captions are rendered as ordinary vector/text layers.
- **Tables:** add a 3 × 3 table, edit cell text, append rows/columns, and remove the final row or column. Resizing the table frame resizes its grid. Existing cell content and IDs survive row/column insertions in the underlying model. The UI currently exposes append/remove-last operations.
- **Mind maps:** create an initial topic with two connected child topics, select a topic and add more branches. Topics are ordinary editable shapes and text; curved connectors follow their positions.
- **Marker and highlighter:** draw ordinary vector paths. Highlighter strokes use translucent color. Press Escape to return to selection.
- **Eraser:** drag across marker/highlighter strokes to remove whole strokes. Hit testing follows sampled path segments, so a diagonal stroke is not erased merely by touching an empty part of its bounding box. This does not provide partial-stroke erasing or erase arbitrary shapes.
- **Stamps:** place a persistent emoji/symbol from a small palette. Stamps are editable text layers, distinct from temporary multiplayer reactions.
- **Laser:** drag to show a temporary local pointer trail. It fades automatically and does not alter the saved document or undo history.
- **Timer:** set a duration, start, pause or reset it. An absolute deadline preserves the countdown across a saved/reloaded document. Completion stops at zero. The timer belongs to this device and has no shared session or audio notification.
- **Local voting:** start a named session with a per-participant vote budget, enter a local participant name, select a layer and add/remove votes. Close/reopen the session and inspect totals. Votes persist in `.oui`, and deleting voted layers prunes their votes. Names are local labels; they are neither authenticated identities nor separate connected participants.
- **Images, comments and export:** use the shared image/SVG import or drag-and-drop, local comment pins, and SVG/PNG/JPEG export. A browser workflow verifies image placement, persisted comments and actual SVG output containing whiteboard text and an embedded image. Comment pins and temporary pointers are editor overlays, not artwork in the export.

## Document model and validation

`src/whiteboard.ts` provides `createWhiteboardDocument`, `validateWhiteboard` and `updateWhiteboard`, plus focused creation/edit helpers. Metadata tracks sticky parts, connector endpoints and derived artwork, table cells, mind map topics, drawn strokes, the timer and local votes.

Imports use strict validation before the document is loaded. Validation checks supported workspace/data versions, layer references and types, ownership conflicts, same-page relationships, table coordinates and dimensions, timer values, voting budgets and duplicate records. Derived layout runs after the shared editor's geometry/layout pass. Deleting endpoint layers removes their associated connector artwork; deleting normal drawing layers removes their drawing metadata.

The intended limits include 50 rows and 20 columns per table, at least one row/column, a timer of up to 24 hours, and 1–100 votes per local participant. Shared document limits still apply. File writes, recovery and native file access continue through the existing application paths.

## Current limitations

This workspace does not include shared cursors, authenticated voting, synchronized timers, cursor chat, music sessions, widgets, an external template gallery, code blocks, remote link metadata previews, or temporary multiplayer emoji reactions.

The shape and stamp palettes are small. Connector routing uses direct geometric routes rather than obstacle avoidance; arbitrary path endpoints use geometric bounds, and there are no manual connector bend handles. Section membership is explicit layer hierarchy. Mind map layout is a simple left-to-right branch arrangement rather than an automatic layout engine.

The eraser removes whole marker/highlighter strokes. Curve hit testing uses the available sampled vector points, not an exact curve-distance solver. Highlighters use transparency rather than a specialized ink compositor.

Copying or duplicating a sticky/table/connector-owned child promotes the selection to the whole logical object. Paste remaps metadata IDs and preserves sticky authors, table contents/styles, drawing kinds and complete mind-map relationships when a whole map is copied. Connections between copied topics are retained. A connector copied alone on the same page can retain its original anchors; without both endpoints in a cross-page/document transfer, it becomes static editable geometry. Copying only one mind-map branch preserves ordinary topic artwork unless all topics are included. Global timer/voting sessions are not duplicated. Removing a table cell's layer can regenerate an empty cell; use table controls for structural deletion.

Whiteboard connections follow base document edits. Motion preview does not recompute connector anchors for every animation sample. The whiteboard toolbar and panels reuse the existing application shell and are not a complete reproduction of FigJam's interface or shortcuts. Accessibility and native user-acceptance testing remain necessary.

## Validation evidence

- `tests/whiteboard.test.ts`: creation and serialization, sticky layout, shape text, connector routes/arrows/labels, ellipse anchors, endpoint cleanup, stable table cells, table resizing, mind map branches, timer deadlines, local voting budgets, malformed metadata rejection, drawing erasure and shared undo.
- `tests/e2e/whiteboard.spec.ts`: reachable editor workflows for notes/authors/colors/stamps; anchored connectors; table editing and undo; mind map branches; drawing/erasing/laser; timer and local voting; image import, comments and SVG export.
- `build/screenshots/dev-whiteboard.png`: synthetic test document only.

## Feature-register recommendations

These recommendations distinguish reachable creation/edit paths from limits of the corresponding FigJam requirement. They do not mark the whole whiteboard app complete. The main status recorder applies them separately.

| IDs | Recommendation | Evidence or limit |
| --- | --- | --- |
| `UI-48-001`–`008` | Implemented | Create a local whiteboard; inherited infinite pan/zoom; sticky note creation, colors, text, author labels; marker/highlighter vectors. |
| `UI-48-009` | Partial | Whole-stroke eraser for drawn ink; no partial-stroke or general-object erasing. |
| `UI-48-010` | Partial | Reachable three-shape palette; full FigJam shape catalog absent. |
| `UI-48-011`–`022` | Implemented | Editable shape text, three connector routes, arrowheads, labels, sections, mind map creation, and table creation/row/column/cell editing. Routing and structural UI limits above remain explicit. |
| `UI-48-023`–`024` | Partial | Working persisted local timer/voting; no shared participants or synchronization. |
| `UI-48-025` | Implemented | Persistent editable emoji stamps. |
| `UI-48-026`–`027` | Planned | Temporary emoji reactions and cursor chat absent. |
| `UI-48-028` | Partial | Ephemeral local laser trail; no remote cursor broadcast. |
| `UI-48-029`–`032` | Planned | Music, templates, widgets and code blocks absent. |
| `UI-48-033` | Implemented | Shared image placement works in whiteboard documents. |
| `UI-48-034` | Planned | Remote link preview metadata/cards absent. |
| `UI-48-035`–`036` | Implemented | Shared local comments and actual SVG/PNG/JPEG artwork export paths. |

This yields 24 implemented, 5 partial and 7 planned requirements in this category, subject to independent review and the main validation run.
