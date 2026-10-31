# Local whiteboard workspace

Oanarina now has an editable local whiteboard workspace. It reuses the design editor's layers, canvas, document files, undo and export renderer. It is a development implementation, not complete FigJam parity or a multiplayer whiteboard service.

Choose **File → New whiteboard**. The whiteboard toolbar appears above the canvas. Projects use the existing `.oui` format with `workspace: "whiteboard"` and optional versioned `whiteboard` metadata; older design documents remain compatible.

## Working tools

- **Sticky notes:** choose one of six colors, enter a local author label, and add a note. Its frame, body and author remain ordinary editable layers. The note panel edits the selected note's text and author. Moving or resizing the frame updates its text areas.
- **Shapes and text:** the palette offers 22 shapes, including triangles, polygons, a star, arrows, a speech bubble, a database and a document, with centered editable text. New catalog shapes are closed vector layers. A separate text tool inserts standalone text. Standard layer controls remain available.
- **Sections:** add a named section and use the shared canvas/layer controls to move, resize, rename and organize it. Inserting new objects does not automatically infer section membership.
- **Connectors:** choose two layers on the same page, then create a straight, elbow or curved connection. Set its label, color, and start/end arrowheads in the connector panel. Connections follow ordinary movement and resizing of their endpoints. Rectangle/diamond anchors respect transforms; ellipse anchors follow the ellipse contour. The paths, arrowheads and captions are rendered as ordinary vector/text layers.
- **Tables:** add a 3 × 3 table, edit cell text, append rows/columns, and remove the final row or column. Resizing the table frame resizes its grid. Existing cell content and IDs survive row/column insertions in the underlying model. The UI currently exposes append/remove-last operations.
- **Mind maps:** create an initial topic with two connected child topics, select a topic and add more branches. Topics are ordinary editable shapes and text; curved connectors follow their positions.
- **Marker and highlighter:** draw ordinary vector paths. Highlighter strokes use translucent color. Press Escape to return to selection.
- **Eraser:** drag across marker/highlighter strokes to cut out the part you touch. Each surviving piece becomes its own drawing layer with the same paint, one drag is one Undo, and a stroke with nothing left is removed. **Eraser options** sets the brush size or switches to whole-stroke erasing. Locked strokes, shapes and other artwork are left alone.
- **Stamps:** place a persistent emoji/symbol from a small palette. Stamps are editable text layers, distinct from temporary multiplayer reactions.
- **Reactions:** choose **React**, pick an emoji and click the board. It floats and fades on this screen only, without touching the document or Undo. Nobody else sees it, since there is no shared session.
- **Link cards:** **Link** makes a card from an address, title, description and optional local image that you enter. Forma never contacts the address, so nothing is scraped or fetched: the host name comes from the address you typed. See [limits below](#link-cards).
- **Music session:** **Music** plays a PCM WAV you choose (up to 60 seconds and 8 MB), with play, pause, stop, loop and volume, through the same player as prototype audio. It runs on this device only and the clip is never saved in the file.
- **Widgets:** **Widgets** opens [local widgets](LOCAL-WIDGETS.md).
- **Laser:** drag to show a temporary local pointer trail. It fades automatically and does not alter the saved document or undo history.
- **Timer:** set a duration, start, pause or reset it. An absolute deadline preserves the countdown across a saved/reloaded document. Completion stops at zero. The timer belongs to this device and has no shared session or audio notification.
- **Local voting:** start a named session with a per-participant vote budget, enter a local participant name, select a layer and add/remove votes. Close/reopen the session and inspect totals. Votes persist in `.oui`, and deleting voted layers prunes their votes. Names are local labels; they are neither authenticated identities nor separate connected participants.
- **Images, comments and export:** use the shared image/SVG import or drag-and-drop, local comment pins, and SVG/PNG/JPEG export. A browser workflow verifies image placement, persisted comments and actual SVG output containing whiteboard text and an embedded image. Comment pins and temporary pointers are editor overlays, not artwork in the export.

## Document model and validation

`src/whiteboard.ts` provides `createWhiteboardDocument`, `validateWhiteboard` and `updateWhiteboard`, plus focused creation/edit helpers. Metadata tracks sticky parts, connector endpoints and derived artwork, table cells, mind map topics, drawn strokes, the timer and local votes.

Imports use strict validation before the document is loaded. Validation checks supported workspace/data versions, layer references and types, ownership conflicts, same-page relationships, table coordinates and dimensions, timer values, voting budgets and duplicate records. Derived layout runs after the shared editor's geometry/layout pass. Deleting endpoint layers removes their associated connector artwork; deleting normal drawing layers removes their drawing metadata.

The intended limits include 50 rows and 20 columns per table, at least one row/column, a timer of up to 24 hours, and 1–100 votes per local participant. Shared document limits still apply. File writes, recovery and native file access continue through the existing application paths.

## Current limitations

This workspace does not include shared cursors, authenticated voting, synchronized timers, cursor chat, shared music sessions, a remote widget catalog, an external template gallery, remote link metadata previews, or reactions other people can see.

The stamp palette is small, and the shape palette has not been compared item by item with FigJam. Resizing a catalog shape scales its outline but not its text box. Connector routing uses direct geometric routes rather than obstacle avoidance; arbitrary path endpoints use geometric bounds, and there are no manual connector bend handles. Section membership is explicit layer hierarchy. Mind map layout is a simple left-to-right branch arrangement rather than an automatic layout engine.

Erased strokes are cut along their sampled centerline and the brush radius plus half the stroke width, so a stored curve becomes straight segments once it is cut. Whole-stroke hit testing uses the available sampled vector points, not an exact curve-distance solver. Highlighters use transparency rather than a specialized ink compositor.

Copying or duplicating a sticky/table/connector-owned child promotes the selection to the whole logical object. Paste remaps metadata IDs and preserves sticky authors, table contents/styles, drawing kinds and complete mind-map relationships when a whole map is copied. Connections between copied topics are retained. A connector copied alone on the same page can retain its original anchors; without both endpoints in a cross-page/document transfer, it becomes static editable geometry. Copying only one mind-map branch preserves ordinary topic artwork unless all topics are included. Global timer/voting sessions are not duplicated. Removing a table cell's layer can regenerate an empty cell; use table controls for structural deletion.

<a id="link-cards"></a>Link cards accept http and https addresses without credentials, up to 2,048 characters. Titles reach 300 characters, descriptions 1,000, and a card image is a local image up to 2 MB. Saved cards are validated on open. The card's layers are generated from its record, so edit them in the panel rather than on the canvas. **Open link** hands the address to the browser only when you press it.

Whiteboard connections follow base document edits. Motion preview does not recompute connector anchors for every animation sample. The whiteboard toolbar and panels reuse the existing application shell and are not a complete reproduction of FigJam's interface or shortcuts. Accessibility and native user-acceptance testing remain necessary.

## Validation evidence

- `tests/whiteboard-eraser.test.ts`, `tests/document-embeds.test.ts` and `tests/e2e/whiteboard-extras.spec.ts`: exact partial cuts, rotated and resized strokes, Undo, the shape catalog, no-request link cards, local reactions and real Web Audio playback.
- `tests/whiteboard.test.ts`: creation and serialization, sticky layout, shape text, connector routes/arrows/labels, ellipse anchors, endpoint cleanup, stable table cells, table resizing, mind map branches, timer deadlines, local voting budgets, malformed metadata rejection, drawing erasure and shared undo.
- `tests/e2e/whiteboard.spec.ts`: reachable editor workflows for notes/authors/colors/stamps; anchored connectors; table editing and undo; mind map branches; drawing/erasing/laser; timer and local voting; image import, comments and SVG export.
- `build/screenshots/dev-whiteboard.png`: synthetic test document only.

## Feature-register recommendations

These recommendations distinguish reachable creation/edit paths from limits of the corresponding FigJam requirement. They do not mark the whole whiteboard app complete. The main status recorder applies them separately.

| IDs | Recommendation | Evidence or limit |
| --- | --- | --- |
| `UI-48-001`–`008` | Implemented | Create a local whiteboard; inherited infinite pan/zoom; sticky note creation, colors, text, author labels; marker/highlighter vectors. |
| `UI-48-009` | Implemented | Partial and whole-stroke erasing of drawn ink with one Undo. |
| `UI-48-010` | Partial | Reachable 22-shape palette; not compared item by item with FigJam. |
| `UI-48-011`–`022` | Implemented | Editable shape text, three connector routes, arrowheads, labels, sections, mind map creation, and table creation/row/column/cell editing. Routing and structural UI limits above remain explicit. |
| `UI-48-023`–`024` | Partial | Working persisted local timer/voting; no shared participants or synchronization. |
| `UI-48-025` | Implemented | Persistent editable emoji stamps. |
| `UI-48-026` | Partial | Temporary local emoji reactions; nobody else can see them. |
| `UI-48-027` | Planned | Cursor chat needs other people. |
| `UI-48-028` | Partial | Ephemeral local laser trail; no remote cursor broadcast. |
| `UI-48-029` | Partial | Local WAV playback on this device; no shared session. |
| `UI-48-031` | Partial | Local sandboxed widgets; no catalog or other participants. |
| `UI-48-033` | Implemented | Shared image placement works in whiteboard documents. |
| `UI-48-034` | Partial | Cards from metadata you enter; Forma never fetches the address. |
| `UI-48-035`–`036` | Implemented | Shared local comments and actual SVG/PNG/JPEG artwork export paths. |

The main status recorder sets the final counts, subject to independent review and the main validation run.
