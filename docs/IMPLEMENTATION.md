# Preview implementation and limits

The register describes the target, not a completed clone. **Implemented** means the narrow named behavior has a working preview path and core, browser or native smoke evidence. It does not mean that every Figma edge case, exact menu position, shortcut layout, accessibility behavior or performance characteristic has been matched. **Partial** records a reduced path; **planned** records work not present. Category references are starting points, not individual evidence for every requirement.

## Current working workflows

Draw rectangles, ellipses, lines, arrows, default stars/polygons, frames, sections, slices, text and freehand paths. Select in canvas or the hierarchical layer tree, move, resize, nudge, align, distribute, group and reorder. Edit coordinates, dimensions, angle, fill, stroke, opacity, corners, typography, fixed shadow and blur through the inspector. Make pages, basic components and snapshots. Basic row, stack and fixed-column grid layout arrange children using gap and uniform padding. Preview frame navigation, add local canvas comments, inspect basic CSS and export project/visual files.

## Important limits

- **Reference UI:** the current live Figma editor includes a vertical File/Agents/Assets/Tools/Variables rail, Code tool and Design/Draw/Motion/Dev toolbelt. The preview uses a simplified shell. Exact original buttons, nested menus, dialogs and shortcuts are not all implemented. The signed-in inspection identified these differences and the register includes them.
- **Drawing:** pen paths support straight segments. No bezier/vector-network editing, boolean geometry, variable-width strokes, advanced Draw brushes, true arrowhead controls or ellipse arcs. Negative-direction line drawing and path resizing need fuller geometry handling.
- **Transforms:** positions are stored as absolute canvas coordinates. Parent rotation is not propagated as a full transform matrix to descendants. Resize does not implement all constraints. Rotation uses the inspector. Multi-selection with both ancestors and descendants requires further normalization.
- **Rendering:** one fill, one stroke, uniform corners, fixed two-stop gradient, fixed shadow, simple blur. No fill stacks, arbitrary gradient stops, blend modes, nonuniform strokes, masks or complex effects. Sections are basic containers. Slices are not a complete region export workflow.
- **Text:** single-style text and explicit newlines; no rich-text ranges, automatic paragraph wrapping, OpenType controls, italics, variable-axis UI or complex script layout controls. System font availability differs between machines.
- **Layout:** basic fixed positioning for row/column/grid; no hug/fill sizing, responsive constraints, spans, wrap, per-edge padding or smart layout inference. Rulers are decorative coordinate labels, not accurate dynamic guides; guide creation is not implemented.
- **Components:** local main components can be copied into instances and reset manually. Edits do not live-propagate; variants, properties, override tracking, shared libraries and cross-page component resolution are not complete.
- **Prototype:** click-to-frame links and a scaled presentation view with previous/next. No interaction graph, real navigation history, transitions, overlays, conditional expressions, state variables, scrolling behavior or devices.
- **Collaboration:** comments and snapshots are local. No remote users, live multiplayer, permissions, accounts, notifications, branching, review service or cloud sync.
- **Storage:** browser recovery and named snapshots use local storage and are quota limited. On explicit save, native atomic files and browser downloads produce `.oui`. Large font/image payloads may exceed browser recovery storage; save a file when warned. Named snapshot history is local and separate from portable project data.
- **Interchange:** SVG imports as one sanitized visual asset. SVG exports preserve editable text when supported by the receiving app. `.oui` bridge supports a subset of Figma nodes/properties, with reports. No direct `.fig`, Sketch or PDF import/export. Read the bridge compatibility guide before transferring important work.
- **Fonts:** catalog browsing and 24 offline families are implemented. Additional families need internet on first download. Italic variants, every variable axis, proprietary font redistribution and arbitrary font installation/import are not implemented. Figma needs its own access to fonts. Portable assets increase file size.
- **Developer tools:** basic CSS generation only. No Code Connect, production code generator, real Dev Mode workflow integrations or plugin runtime compatibility.
- **Platform:** native universal Mac build is verified on this Apple silicon machine. Intel is cross-compiled; runtime behavior on an Intel Mac has not been tested. Electron/Windows is experimental, not shipped. The app starts a fixed-port resource server bound to 127.0.0.1:51981; startup fails safely if occupied.
- **Accessibility:** labels, focus styling and dialog keyboard handling are a starting point. Complete VoiceOver and keyboard-only canvas support, localization, contrast and performance audits remain outstanding.

## Validation

`npm test`: 19 tests covering model round-trips, malformed projects, hierarchy invariants, undo, grouping, copying, alignment, layout, plugin imports/exports against a mock, loss reports and rollback. `npm run test:e2e`: five workflows covering the sample, feature register/home, rectangle editing/history/save/reload/SVG, text/fonts/comments/palette, plugin download and compact layout. Native `--smoke-test` checks that the production bundle renders and the native bridge responds. This is a base suite, not exhaustive testing of the entire register.

## Next implementation stages

1. Match observed navigation and full menus; finish a complete command registry and accurate shortcut reference.
2. Harden canvas transforms, selection, pen/vector geometry, import/export fidelity and large document storage.
3. Implement full text layout and font styles, responsive auto layout and constraints.
4. Complete components, variants, properties, styles and variables.
5. Validate Figma Bridge on Figma desktop and expand supported properties; separately investigate binary `.fig` compatibility.
6. Implement full prototypes, motion, developer workflows and extension APIs.
7. Add collaboration/backend and wider Figma suite workflows, then validate Mac parity before Windows delivery.
