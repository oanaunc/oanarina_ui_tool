# Local Slides workspace

Oanarina presentations use the same editable `.oui` document model as Design. This is a local presentation implementation, not complete Figma Slides parity.

Create a presentation from **File → New presentation**. A deck opens with a title slide. Use the thumbnail rail to select a slide; drag thumbnails or use their up/down controls to reorder them. The toolbar adds one of five editable templates: blank, title, section, image, or three-column grid. Duplicate and delete work through document history. At least one slide remains in a deck.

Four local themes update the template background, text and accent colors. Slide aspect ratios include 16:9, 4:3 and 16:10, plus custom dimensions from 160 to 4,096 pixels per edge. Resizing scales existing content. Template text remains ordinary editable text; shapes, decoded local PNG/JPEG/WebP/GIF images and live components can also be inserted. The canvas supports selection and dragging; the layer inspector edits position, size, color and text. Layer changes, notes, theme changes and deck order share the editor's Undo/Redo and `.oui` persistence.

Speaker notes are stored per slide. Presenter view shows the current slide, notes, next slide and elapsed timer with pause/resume/reset. Audience view displays the slide without the notes panel. These are two views in the current app window; simultaneous presenter/audience windows on separate displays are not implemented. Navigation uses Previous/Next, arrows, Page Up/Page Down, Home/End or Space; Escape closes presentation and B toggles a black screen. Hidden slides remain editable and are skipped when presenting or exporting a deck. Available transitions are none, fade and slide in; reduced-motion preferences disable animation.

Comments are local annotations on a slide. They can be added, resolved and reopened. Their slide ownership follows deck reordering; duplicating a slide does not duplicate its comments. They do not create a cloud review thread or collaboration session.

## Export

- **Save .oui** keeps editable shapes, text, images, components, notes, comments and deck metadata. Available font files are embedded by the used weight/style and scripts, including local text styles, subject to font embedding permissions and the existing 50 MB project limit.
- **Current slide PNG** exports the active slide at its document pixel dimensions.
- **All visible slides as PNG ZIP** creates one standard ZIP archive containing numbered PNG files in presentation order.
- **Export PDF** creates one PDF page for each visible slide, preserving the slide aspect ratio and document title. Each page contains rendered slide artwork at 1.5× pixel resolution; PDF text and vector objects are rasterized. Notes and comments are not exported into the images/PDF.

Image/PDF deck exports are limited to 200 visible slides. PNG dimensions are limited to 8,192 pixels per edge and 32 million pixels per slide. ZIP exports and accumulated PNG data for PDF exports are capped at 200 MB. Long deck exports expose progress and a Cancel action; cancellation prevents the file download. PDF generation uses the open-source MIT-licensed `pdf-lib` package locally; dependency licenses are included in `public/THIRD-PARTY-NOTICES.txt`. No file upload, paid service or account is involved.

## Remaining scope

PowerPoint import/export, embedded playable prototypes/videos, live polls, collaborative presenting, cloud deck sharing, a second audience window, rich presentation charts and comprehensive Figma Slides template/theme parity remain unimplemented. Direct binary `.fig` support remains outside this workspace. The existing SVG/Figma Bridge limitations still apply to transfers of the underlying artwork; a Figma Slides deck is not reconstructed by the bridge.

## Validation

`tests/slides.test.ts` validates editable templates, independent duplication, ordering with child geometry, deletion, themes, aspect changes, live component insertion, hidden slides, input validation, PDF page parsing and ZIP payload structure. `tests/e2e/slides.spec.ts` exercises the actual workspace, canvas drag and image decode, speaker notes, hidden-slide presenter navigation, timer/audience controls, comments, `.oui` persistence, PDF parsing and decoded PNG images from ZIP exports.
