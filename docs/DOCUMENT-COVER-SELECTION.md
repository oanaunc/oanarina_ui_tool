# Local file cover selection

The document title menu and File menu expose **File cover…**. Choose a page and an existing authored frame, preview it, then use it for the Home file grid and list. Reset returns to the first-page preview. Choosing/resetting is one Undo operation and is saved in .oui versions 1 and 2 without a version bump. This is an independent, bounded local workflow; reference-app thumbnail parity is unverified.

## Rendering policy

**Frame viewport cover · includes visible page overlap.** The image crops the complete authored page to the frame’s local viewport using the inverse complete frame transform. It retains ordinary ancestor transforms, clipping, masks, effects, page background and overlapping page artwork. It does not isolate a frame subtree and silently discard those contexts. Signed/nonuniform transforms and nested rotation are supported through the shared Artwork SVG renderer. Slice subtrees use the existing export omission policy. Static video/GIF covers use the saved poster rather than live playback. Selection outlines, canvas names, guides and editing overlays are omitted.

The chosen page supports at most 500 layers and 4 MB in UTF-8 bytes of serialized/rendered artwork plus embedded fonts. Generated images fit inside 560 × 320 CSS-independent image pixels. Positive, visible, invertible frame bounds are required when choosing a cover. A saved choice that later becomes hidden, collapsed, oversized, or otherwise unrenderable remains chosen and displays **Cover unavailable** with an explanation. It never silently substitutes the first page. Legacy files without a cover retain first-page/empty preview behavior, within the same preview budgets.

Each preview uses a render-only namespace for node and paint/stroke identifiers inside its own self-contained SVG image. Cached files sharing internal IDs cannot bind to each other’s clip/filter/paint definitions. Source IDs, outlines, paints and document history are not modified while rendering.

## Fonts and platform limits

Covers embed the actual allowed faces used by their SVG image. Cached files do not register their own faces globally merely to render in Home. When an authored embedded face differs from the currently loaded same-family face (including a more exact foreign weight, style or Unicode subset), or has not been loaded, a local diagnostic asks the user to open the file first, or reload Forma if a conflicting registered face remains. Non-embeddable faces and conflicting duplicate authored descriptors are refused for that cover. This avoids rendering a cached file with a known conflicting measurement face or corrupting the current document’s fonts. Valid saved text outlines do not require font measurement.

The shared text layout still uses the current platform’s loaded font metrics. Fonts without embedded authored data follow currently available/system fallback behavior; native installed-font availability, shaping/glyph parity, and native VoiceOver behavior have not been verified by these browser tests. No glyph-coverage guarantee is made. Images are SVG data images rather than font registration into Home’s document. Embedded-face coverage and same-family conflict refusal are browser-tested.

## Metadata and lifecycle

Optional root metadata is `fileCover: {pageId: string, frameId: string}`. It must resolve to exactly one existing frame on exactly one existing page; unknown keys, malformed values, ambiguous or dangling references reject before imported document mutation. Absent legacy fields remain absent. Existing valid empty page identifiers remain literal references; this change does not alter the shared parser’s preexisting node-identifier policy.

Deleting/type-changing the chosen frame or deleting its page clears the unchanged previous choice in the same transaction. Undo restores it. Reordering pages retains the choice. Copying a page leaves the original chosen frame selected. Moving that frame or a containing subtree to another page updates its page reference while preserving identity. Whole-file duplication preserves internal references inside the new document. Clipboard and reusable-library publication do not copy the root cover into independent reusable assets.

Editor application callbacks capture the originating document and dialog session; an intervening context transition invalidates retained callbacks even when the UI returns to the same apparent state. File covers do not require unlocking a visible frame because they change file metadata rather than frame content.

The source MCP document validator accepts and preserves valid cover metadata; authored deletion clears it atomically and Undo restores it. No new cover-specific MCP command or filesystem capability is added. Standalone editable Figma Bridge import validates cover references before creating pages and explicitly reports that cover selection is omitted. No binary .fig thumbnail exchange or real Figma desktop round trip is claimed.

## Verification

Focused headless tests cover .oui1/2 and absent-field compatibility, malformed-reference refusal, set/reset no-ops, deletion/type change, page copy/reorder, identity-preserving move, whole-file clone, render-only namespaces, signed geometry, empty page IDs, preview budgets and font-face proof. Focused browser checks exercise actual menu selection, Undo, native browser download and real file-chooser reopen, grid/list image pixels from two cached files with identical IDs, complete-page masks/clips/overlaps/background, signed affine viewport pixels, stale same-event callbacks, chosen-frame deletion/reorder, and actual embedded-font SVG pixel coverage/conflict diagnostics. A direct source MCP test covers deletion/Undo and malformed replacement refusal. Figma Bridge assertions use API mocks, not desktop reference acceptance.
