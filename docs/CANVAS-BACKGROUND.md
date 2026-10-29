# Page canvas backgrounds

Deselect all layers in Design mode. The **Page** inspector offers a color picker, six-digit hex input, opacity, and **Show background**. Edits affect the current page only and support undo/redo and portable `.oui` persistence. New pages inherit a copy of the current page's background, including opacity/visibility. Editing the new page does not change its source page.

**Use theme background** clears the optional page override. Older documents without the optional property keep the application's neutral theme background. Translucent overrides are composited over that neutral canvas. Theme changes affect this neutral base; opaque explicit page colors stay unchanged. This intentional theme-following fallback differs from Figma's theme-at-file-creation default.

Canvas color does not recolor artwork or enter SVG/raster exports, prototype presentation, whiteboard or slide backgrounds; those workspaces retain their own settings. The Figma Bridge reads/writes the public PageNode single-solid `backgrounds` property, including opacity and visibility. API-contract mocks validate that path, not actual Figma desktop acceptance. Unsupported page background paints are reported and omitted.

The optional `Page.background` field is `{color: '#rrggbb', opacity: 0…1, visible: boolean}`. Both the editor and bridge validate it before mutation; no document version change is required. Existing v1/v2 documents remain compatible.

Reference: [Figma canvas background controls](https://help.figma.com/hc/en-us/articles/360041064814-Change-the-background-color-of-the-canvas) and [PageNode API](https://developers.figma.com/docs/plugins/api/PageNode/).

Validation covers compatible old files, malformed input rejection, color/alpha/visibility rendering, undo, independent page inheritance, portable saves, unchanged artwork export, and a mock bridge import/export.
