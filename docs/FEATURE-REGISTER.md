# Oanarina UI Tool — feature register

2018 individually named requirements. 1988 required baseline items; 30 later Oanarina improvements.

This is a working parity specification, not a claim of completeness or of implemented Figma compatibility. Reference links identify category-level starting points; each requirement marked reference-verification-pending still needs an in-app or documentation check. Several OS integration, reliability, and cross-product requirements are Oanarina requirements rather than verified Figma functions. Figma Design is the first implementation target; Draw, Dev Mode, FigJam, Slides, Sites, Buzz and Make remain in scope in later phases. Features introduced by a future Figma update require another audit.

Status: {"implemented":965,"planned":894,"partial":159}. **planned** = not implemented; **partial** = material limits documented; **implemented** = working path with validation evidence. Production parity requires additional accessibility, performance, platform and user acceptance testing even for implemented items. No binary .fig import/export claim is made.

Machine-readable source: public/features.json. Regenerate this document with npm run inventory.

## Mac application

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-01-001 | Native application bundle | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-002 | Finder launch | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-003 | Dock icon | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-004 | Dock recent files | planned | reference-verification-pending |
| UI-01-005 | Finder document associations | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-006 | Double-click to open documents | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-007 | Open With integration | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-008 | Native application menu | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-01-009 | Native File menu | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-01-010 | Native Edit menu | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-01-011 | Native View menu | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-01-012 | Native Object menu | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-01-013 | Native Window menu | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-01-014 | Native Help menu | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-01-015 | About window | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-016 | Application preferences | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-01-017 | Native open dialog | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-018 | Native save dialog | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-019 | Save As dialog | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-020 | Native export destination picker | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-021 | Window close behavior | planned | reference-verification-pending |
| UI-01-022 | Quit application | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-023 | Multiple document windows | planned | Not implemented in this preview. |
| UI-01-024 | Window tabbing | planned | reference-verification-pending |
| UI-01-025 | Minimize window | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-026 | Full-screen window | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-027 | Window restoration | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-028 | Retina display rendering | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-029 | Apple silicon build | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-01-030 | Intel Mac build | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |

## Mac system integration

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-02-001 | Menu accelerator labels | planned | reference-verification-pending |
| UI-02-002 | System font access | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-02-003 | Font installation detection | planned | reference-verification-pending |
| UI-02-004 | Trackpad two-finger panning | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-02-005 | Trackpad pinch zoom | planned | reference-verification-pending |
| UI-02-006 | Mouse wheel zoom | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-02-007 | Middle-button panning | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-02-008 | Spacebar hand navigation | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-02-009 | Context menus | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-02-010 | System clipboard text | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-02-011 | System clipboard images | planned | Not implemented in this preview. |
| UI-02-012 | Clipboard SVG markup | planned | reference-verification-pending |
| UI-02-013 | Drag files from Finder | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-02-014 | Drag assets to Finder | planned | reference-verification-pending |
| UI-02-015 | Quick Look previews | planned | reference-verification-pending |
| UI-02-016 | Spotlight document metadata | planned | reference-verification-pending |
| UI-02-017 | macOS document versions | planned | reference-verification-pending |
| UI-02-018 | Reopen closed documents | planned | reference-verification-pending |
| UI-02-019 | macOS print dialog | planned | reference-verification-pending |
| UI-02-020 | Export through system share sheet | planned | reference-verification-pending |
| UI-02-021 | Accent color preferences | planned | reference-verification-pending |
| UI-02-022 | System appearance following | planned | reference-verification-pending |
| UI-02-023 | Reduced motion preference | planned | reference-verification-pending |
| UI-02-024 | Increased contrast preference | planned | reference-verification-pending |
| UI-02-025 | VoiceOver integration | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-02-026 | Keyboard focus ring | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-02-027 | App sandbox file access | planned | reference-verification-pending |
| UI-02-028 | Offline startup | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-02-029 | App update checking | planned | reference-verification-pending |
| UI-02-030 | Update release notes | planned | reference-verification-pending |

## Home and file browser

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-03-001 | Recent files view | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-03-002 | Draft files view | planned | reference-verification-pending |
| UI-03-003 | Team files view | planned | reference-verification-pending |
| UI-03-004 | Project folders | planned | reference-verification-pending |
| UI-03-005 | File thumbnails | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-03-006 | File list view | planned | reference-verification-pending |
| UI-03-007 | File grid view | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-03-008 | Sort files by name | planned | reference-verification-pending |
| UI-03-009 | Sort files by modified date | planned | reference-verification-pending |
| UI-03-010 | Sort files by owner | planned | reference-verification-pending |
| UI-03-011 | Search files by title | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-03-012 | Filter files by type | planned | reference-verification-pending |
| UI-03-013 | Filter files by project | planned | reference-verification-pending |
| UI-03-014 | Create blank design file | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-03-015 | Create from template | planned | reference-verification-pending |
| UI-03-016 | Duplicate file | planned | reference-verification-pending |
| UI-03-017 | Rename file | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-03-018 | Move file to project | planned | reference-verification-pending |
| UI-03-019 | Copy file link | planned | reference-verification-pending |
| UI-03-020 | Star file | planned | reference-verification-pending |
| UI-03-021 | Pin file | planned | reference-verification-pending |
| UI-03-022 | Archive file | planned | reference-verification-pending |
| UI-03-023 | Trash file | planned | reference-verification-pending |
| UI-03-024 | Restore trashed file | planned | reference-verification-pending |
| UI-03-025 | Permanently remove trashed file | planned | reference-verification-pending |
| UI-03-026 | File ownership display | planned | Not implemented in this preview. |
| UI-03-027 | Last modified display | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-03-028 | File context menu | planned | reference-verification-pending |
| UI-03-029 | Open file in new tab | planned | reference-verification-pending |
| UI-03-030 | Import files from home | planned | reference-verification-pending |

## Navigation and editor shell

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-04-001 | Document title control | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-002 | Document title dropdown | planned | reference-verification-pending |
| UI-04-003 | Breadcrumb navigation | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-004 | Draft location indicator | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-005 | Main application menu button | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-006 | Left sidebar | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-007 | Right sidebar | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-008 | Floating bottom toolbar | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-009 | Toolbar tool groups | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-010 | Tool dropdown menus | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-011 | Tooltips with shortcuts | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-012 | Sidebar collapse | planned | reference-verification-pending |
| UI-04-013 | Sidebar resize | planned | reference-verification-pending |
| UI-04-014 | Hide all editor UI | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-015 | Design mode tab | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-016 | Prototype mode tab | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-017 | Inspect mode tab | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-018 | Draw mode switch | planned | reference-verification-pending |
| UI-04-019 | Dev Mode switch | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-020 | Present button | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-021 | Share button | planned | reference-verification-pending |
| UI-04-022 | Zoom dropdown | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-023 | File save status | planned | reference-verification-pending |
| UI-04-024 | Document loading indicator | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-025 | Empty page state | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-026 | Selection summary | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-027 | Inline error messages | planned | reference-verification-pending |
| UI-04-028 | Toast notifications | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-029 | Help and resources menu | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-04-030 | Connection state indicator | planned | reference-verification-pending |

## Pages and document structure

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-05-001 | Create page | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-05-002 | Rename page | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-05-003 | Duplicate page | planned | reference-verification-pending |
| UI-05-004 | Delete page | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-05-005 | Reorder pages | planned | reference-verification-pending |
| UI-05-006 | Page selection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-05-007 | Page keyboard navigation | planned | reference-verification-pending |
| UI-05-008 | Per-page canvas position | planned | reference-verification-pending |
| UI-05-009 | Per-page zoom level | planned | reference-verification-pending |
| UI-05-010 | Page background color | planned | reference-verification-pending |
| UI-05-011 | Page thumbnail | planned | reference-verification-pending |
| UI-05-012 | Page comments | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-05-013 | Search page names | planned | reference-verification-pending |
| UI-05-014 | Page context menu | planned | reference-verification-pending |
| UI-05-015 | Copy page link | planned | reference-verification-pending |
| UI-05-016 | Move layers between pages | planned | reference-verification-pending |
| UI-05-017 | Paste layers on another page | planned | reference-verification-pending |
| UI-05-018 | Page-level export | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-05-019 | Page loading on demand | planned | reference-verification-pending |
| UI-05-020 | Page section organization | planned | reference-verification-pending |
| UI-05-021 | Page-specific prototype flows | planned | reference-verification-pending |
| UI-05-022 | Page-level developer status | planned | reference-verification-pending |
| UI-05-023 | Page identifier persistence | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-05-024 | Document color profile | planned | reference-verification-pending |
| UI-05-025 | sRGB document profile | planned | reference-verification-pending |
| UI-05-026 | Display P3 document profile | planned | reference-verification-pending |
| UI-05-027 | File description | planned | reference-verification-pending |
| UI-05-028 | File cover selection | planned | reference-verification-pending |
| UI-05-029 | File-level library metadata | planned | reference-verification-pending |
| UI-05-030 | File naming from title | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |

## Canvas navigation

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-06-001 | Infinite canvas | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-002 | Pan with hand tool | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-003 | Temporary hand tool | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-004 | Trackpad pan | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-005 | Zoom in | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-006 | Zoom out | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-007 | Zoom to 100 percent | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-008 | Zoom to fit all | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-009 | Zoom to selection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-010 | Zoom around pointer | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-011 | Zoom with keyboard | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-012 | Fit frame to viewport | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-013 | Previous viewport | planned | reference-verification-pending |
| UI-06-014 | Next viewport | planned | reference-verification-pending |
| UI-06-015 | Canvas scrollbars | planned | reference-verification-pending |
| UI-06-016 | Canvas rulers | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-06-017 | Horizontal guides | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-06-018 | Vertical guides | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-06-019 | Move canvas guide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-06-020 | Delete canvas guide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-06-021 | Lock canvas guides | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-06-022 | Toggle canvas guide visibility | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-06-023 | Toggle pixel grid | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-024 | Toggle outlines | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-025 | Toggle frame names | planned | reference-verification-pending |
| UI-06-026 | Toggle section names | planned | reference-verification-pending |
| UI-06-027 | Toggle comment pins | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-028 | Canvas background contrast | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-06-029 | Overview minimap | planned | reference-verification-pending |
| UI-06-030 | Find selected object on canvas | planned | reference-verification-pending |

## Selection

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-07-001 | Single layer selection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-002 | Multiple layer selection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-003 | Shift-click selection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-004 | Marquee selection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-005 | Select fully enclosed objects | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-006 | Select intersecting objects | planned | reference-verification-pending |
| UI-07-007 | Deep selection through containers | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Parent-default canvas selection, Command deep selection, double-click descent, Enter/Shift-Enter hierarchy and Tab/Shift-Tab siblings with canvas focus. |
| UI-07-008 | Select parent | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Parent-default canvas selection, Command deep selection, double-click descent, Enter/Shift-Enter hierarchy and Tab/Shift-Tab siblings with canvas focus. |
| UI-07-009 | Select child | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Parent-default canvas selection, Command deep selection, double-click descent, Enter/Shift-Enter hierarchy and Tab/Shift-Tab siblings with canvas focus. |
| UI-07-010 | Select next sibling | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Parent-default canvas selection, Command deep selection, double-click descent, Enter/Shift-Enter hierarchy and Tab/Shift-Tab siblings with canvas focus. |
| UI-07-011 | Select previous sibling | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Parent-default canvas selection, Command deep selection, double-click descent, Enter/Shift-Enter hierarchy and Tab/Shift-Tab siblings with canvas focus. |
| UI-07-012 | Select all top-level objects | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-013 | Deselect all | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-014 | Select matching fill | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Current-page matching fills/strokes/text/component identity; hidden and inherited-locked nodes excluded. Text matching uses exact base styling and mixed-run intervals. |
| UI-07-015 | Select matching stroke | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Current-page matching fills/strokes/text/component identity; hidden and inherited-locked nodes excluded. Text matching uses exact base styling and mixed-run intervals. |
| UI-07-016 | Select matching text properties | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Current-page matching fills/strokes/text/component identity; hidden and inherited-locked nodes excluded. Text matching uses exact base styling and mixed-run intervals. |
| UI-07-017 | Select matching component | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Current-page matching fills/strokes/text/component identity; hidden and inherited-locked nodes excluded. Text matching uses exact base styling and mixed-run intervals. |
| UI-07-018 | Select hidden layers through panel | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-019 | Select locked layers through panel | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-020 | Selection bounding box | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-021 | Individual selection outlines | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Individual and hover outlines follow transformed layer bounds. Right-click Select layer lists hit artwork including obscured and locked layers; concealed mask artwork follows SVG hit-testing semantics. |
| UI-07-022 | Multi-selection bounds | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-023 | Hover object outline | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Individual and hover outlines follow transformed layer bounds. Right-click Select layer lists hit artwork including obscured and locked layers; concealed mask artwork follows SVG hit-testing semantics. |
| UI-07-024 | Parent hover outline | planned | reference-verification-pending |
| UI-07-025 | Selection size label | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-026 | Selection context menu | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-07-027 | Keyboard box selection | planned | reference-verification-pending |
| UI-07-028 | Select behind overlapping layer | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Individual and hover outlines follow transformed layer bounds. Right-click Select layer lists hit artwork including obscured and locked layers; concealed mask artwork follows SVG hit-testing semantics. |
| UI-07-029 | Layer picker at pointer | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Individual and hover outlines follow transformed layer bounds. Right-click Select layer lists hit artwork including obscured and locked layers; concealed mask artwork follows SVG hit-testing semantics. |
| UI-07-030 | Preserve selection while panning | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |

## Layer tree

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-08-001 | Hierarchical layer tree | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-002 | Expand layer | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-003 | Collapse layer | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-004 | Expand all descendants | planned | reference-verification-pending |
| UI-08-005 | Collapse all descendants | planned | reference-verification-pending |
| UI-08-006 | Search layers by name | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-007 | Filter layers by type | planned | reference-verification-pending |
| UI-08-008 | Rename layer | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-009 | Batch rename layers | planned | reference-verification-pending |
| UI-08-010 | Layer type icons | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-011 | Component icons | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-012 | Instance icons | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-013 | Hidden layer indicator | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-014 | Locked layer indicator | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-015 | Toggle layer visibility | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-016 | Toggle layer lock | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-017 | Drag reorder layers | planned | reference-verification-pending |
| UI-08-018 | Drag reparent layers | planned | reference-verification-pending |
| UI-08-019 | Nest layers in container | planned | reference-verification-pending |
| UI-08-020 | Reveal selected layer | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Selection reveals and scrolls its ancestor-expanded tree row. Tree uses ARIA selection, arrow navigation, native control activation, contiguous Shift ranges and Command toggles. |
| UI-08-021 | Scroll selected layer into view | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Selection reveals and scrolls its ancestor-expanded tree row. Tree uses ARIA selection, arrow navigation, native control activation, contiguous Shift ranges and Command toggles. |
| UI-08-022 | Layer panel context menu | planned | reference-verification-pending |
| UI-08-023 | Layer tree keyboard navigation | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Selection reveals and scrolls its ancestor-expanded tree row. Tree uses ARIA selection, arrow navigation, native control activation, contiguous Shift ranges and Command toggles. |
| UI-08-024 | Indented hierarchy | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-08-025 | Layer selection range | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Selection reveals and scrolls its ancestor-expanded tree row. Tree uses ARIA selection, arrow navigation, native control activation, contiguous Shift ranges and Command toggles. |
| UI-08-026 | Layer preview thumbnails | planned | reference-verification-pending |
| UI-08-027 | Show exportable layers | planned | reference-verification-pending |
| UI-08-028 | Show ready-for-development layers | planned | reference-verification-pending |
| UI-08-029 | Show prototype-linked layers | planned | reference-verification-pending |
| UI-08-030 | Show layers with comments | planned | reference-verification-pending |

## Frames

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-09-001 | Draw custom frame | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-002 | Frame preset picker | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-003 | Desktop presets | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-004 | Phone presets | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-005 | Tablet presets | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-006 | Watch presets | planned | reference-verification-pending |
| UI-09-007 | Paper presets | planned | reference-verification-pending |
| UI-09-008 | Presentation presets | planned | reference-verification-pending |
| UI-09-009 | Social asset presets | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-010 | Resize frame | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-011 | Frame dimensions | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-012 | Nested frames | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-013 | Frame background fill | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-014 | Frame stroke | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-015 | Frame corner radius | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-016 | Independent frame corners | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-09-017 | Frame opacity | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-018 | Clip frame content | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-019 | Frame without clipping | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-020 | Frame overflow inspection | planned | reference-verification-pending |
| UI-09-021 | Frame contents selection | planned | reference-verification-pending |
| UI-09-022 | Frame selection from layers | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-023 | Convert group to frame | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-024 | Frame current selection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-025 | Resize frame to fit content | planned | reference-verification-pending |
| UI-09-026 | Duplicate frame | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-027 | Rename frame | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-09-028 | Frame-level export settings | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-09-029 | Frame prototype starting point | planned | Not implemented in this preview. |
| UI-09-030 | Frame orientation swap | planned | reference-verification-pending |

## Sections groups and slices

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-10-001 | Draw section | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-002 | Resize section | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-003 | Section fill | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-004 | Section title | planned | reference-verification-pending |
| UI-10-005 | Rename section | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-006 | Move section with contents | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-007 | Nest sections | planned | reference-verification-pending |
| UI-10-008 | Select section contents | planned | reference-verification-pending |
| UI-10-009 | Section ready-for-development status | planned | reference-verification-pending |
| UI-10-010 | Section link | planned | reference-verification-pending |
| UI-10-011 | Group selection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-012 | Ungroup selection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-013 | Nested groups | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-014 | Move group with contents | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-015 | Resize group proportionally | partial | Groups scale their rendered subtree through the existing transform fields. The inspector continues to show intrinsic dimensions; tight child-derived group bounds and full Figma group resize semantics remain incomplete. |
| UI-10-016 | Rename group | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-017 | Group transparency | implemented | v0.2: nested SVG group opacity composites overlapping children once; exported pixel test. |
| UI-10-018 | Group blend mode | planned | reference-verification-pending |
| UI-10-019 | Group bounds from children | planned | reference-verification-pending |
| UI-10-020 | Group export | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-021 | Draw slice | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-022 | Slice dimensions | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-023 | Slice export settings | planned | reference-verification-pending |
| UI-10-024 | Slice export naming | planned | reference-verification-pending |
| UI-10-025 | Toggle slice visibility | planned | reference-verification-pending |
| UI-10-026 | Export overlapping slices | planned | reference-verification-pending |
| UI-10-027 | Select slice through panel | planned | reference-verification-pending |
| UI-10-028 | Remove slice | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-10-029 | Slice export scale | planned | reference-verification-pending |
| UI-10-030 | Slice SVG export | planned | reference-verification-pending |

## Basic shapes

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-11-001 | Draw rectangle | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-002 | Draw square with Shift | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-003 | Rectangle corner radius | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-004 | Independent rectangle corners | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-11-005 | Corner smoothing | planned | reference-verification-pending |
| UI-11-006 | Draw ellipse | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-007 | Draw circle with Shift | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-008 | Ellipse arc start | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-11-009 | Ellipse arc sweep | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-11-010 | Ellipse inner radius | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-11-011 | Draw line | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-012 | Line length | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-013 | Line angle | planned | reference-verification-pending |
| UI-11-014 | Line endpoint positioning | planned | reference-verification-pending |
| UI-11-015 | Draw arrow | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-016 | Arrowhead at start | planned | reference-verification-pending |
| UI-11-017 | Arrowhead at end | planned | reference-verification-pending |
| UI-11-018 | Arrowhead style | planned | reference-verification-pending |
| UI-11-019 | Draw polygon | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-020 | Polygon point count | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-11-021 | Polygon corner radius | planned | reference-verification-pending |
| UI-11-022 | Draw star | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-023 | Star point count | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-11-024 | Star inner radius | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-11-025 | Star corner radius | planned | reference-verification-pending |
| UI-11-026 | Shape fill | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-027 | Shape stroke | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-028 | Shape opacity | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-11-029 | Center-based shape drawing | planned | reference-verification-pending |
| UI-11-030 | Repeat last shape tool | planned | reference-verification-pending |

## Transforms and arrangement

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-12-001 | Move by dragging | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. World-coordinate dragging, oriented single-layer handles, ancestor transforms, subtree scaling and scale keyframes are exercised. Genuine affine skew is rejected atomically; scaled intrinsic dimensions remain visible in the inspector. |
| UI-12-002 | Move by coordinates | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-003 | Nudge by one pixel | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-004 | Large nudge increment | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-005 | Custom nudge distance | planned | reference-verification-pending |
| UI-12-006 | Resize by handles | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. World-coordinate dragging, oriented single-layer handles, ancestor transforms, subtree scaling and scale keyframes are exercised. Genuine affine skew is rejected atomically; scaled intrinsic dimensions remain visible in the inspector. |
| UI-12-007 | Resize by width | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-008 | Resize by height | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-009 | Constrain aspect ratio | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-010 | Aspect-ratio lock control | planned | reference-verification-pending |
| UI-12-011 | Resize from center | planned | reference-verification-pending |
| UI-12-012 | Scale tool | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. World-coordinate dragging, oriented single-layer handles, ancestor transforms, subtree scaling and scale keyframes are exercised. Genuine affine skew is rejected atomically; scaled intrinsic dimensions remain visible in the inspector. |
| UI-12-013 | Scale text with object | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. World-coordinate dragging, oriented single-layer handles, ancestor transforms, subtree scaling and scale keyframes are exercised. Genuine affine skew is rejected atomically; scaled intrinsic dimensions remain visible in the inspector. |
| UI-12-014 | Scale stroke with object | partial | Legacy stroke width/radius scale; advanced stroke stacks and independent corners still require scale-tool propagation. |
| UI-12-015 | Scale corner radius | partial | Legacy stroke width/radius scale; advanced stroke stacks and independent corners still require scale-tool propagation. |
| UI-12-016 | Rotate by handle | planned | reference-verification-pending |
| UI-12-017 | Rotate by degrees | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-018 | Snap rotation increments | planned | reference-verification-pending |
| UI-12-019 | Flip horizontally | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-12-020 | Flip vertically | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-12-021 | Align left edges | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-022 | Align horizontal centers | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-023 | Align right edges | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-024 | Align top edges | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-025 | Align vertical centers | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-026 | Align bottom edges | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-027 | Distribute horizontal spacing | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-028 | Distribute vertical spacing | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-029 | Bring to front | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-030 | Send to back | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-12-031 | Bring forward one layer | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-12-032 | Send backward one layer | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-12-033 | Tidy up selection | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-12-034 | Set equal widths | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-12-035 | Set equal heights | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-12-036 | Smart duplicate with transform | planned | reference-verification-pending |
| UI-12-037 | Custom rotation origin | planned | reference-verification-pending |
| UI-12-038 | Scrub numeric property fields | planned | reference-verification-pending |
| UI-12-039 | Adjust numeric scrubbing speed | planned | reference-verification-pending |
| UI-12-040 | Align a single layer to parent | planned | reference-verification-pending |
| UI-12-041 | Align a selected group to parent | planned | reference-verification-pending |

## Snapping and measurement

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-13-001 | Snap to pixel | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-002 | Snap to half pixel | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-003 | Snap to object edges | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-004 | Snap to object centers | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-005 | Snap to guide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-006 | Snap to frame edge | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-007 | Snap to layout columns | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-008 | Snap to layout rows | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-009 | Snap to equal spacing | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-010 | Smart alignment guides | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-011 | Smart distance labels | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-012 | Measure to parent | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-013 | Measure to sibling | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-014 | Measure to arbitrary object | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-015 | Measure overlapping objects | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-016 | Measure object padding | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-017 | Measure object gap | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-018 | Show selected object coordinates | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-019 | Measurement units in pixels | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-020 | Measurement labels during resize | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-021 | Disable snapping temporarily | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-022 | Persistent snapping preference | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-023 | Show frame dimensions | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-024 | Show rotation while rotating | planned | reference-verification-pending |
| UI-13-025 | Show equal spacing while moving | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-026 | Fine pointer adjustment | planned | reference-verification-pending |
| UI-13-027 | Keyboard coordinate entry | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-028 | Position arithmetic expressions | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-029 | Dimension arithmetic expressions | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Measurements use transformed axis-aligned bounds; arbitrary angled guide snapping is excluded. Inspector fields accept parsed arithmetic and relative +/* operations; multi-selection uses the primary value. |
| UI-13-030 | Device pixel alignment | partial | Whole/half design-pixel alignment works; physical-device-pixel alignment across scale factors is incomplete. |
| UI-13-031 | Snap vector points to geometry | planned | reference-verification-pending |

## Vector pen and editing

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-14-001 | Pen tool | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-14-002 | Add vector point | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-14-003 | Close vector path | planned | reference-verification-pending |
| UI-14-004 | Continue open vector path | planned | reference-verification-pending |
| UI-14-005 | Add straight segment | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-14-006 | Add cubic curve segment | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-007 | Drag bezier handle | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-008 | Independent tangent handles | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-009 | Mirrored tangent handles | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-010 | Aligned tangent handles | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-011 | Corner point | partial | Whole-path smoothing and curve flattening exist; per-point corner/smooth conversion and full vector networks remain incomplete. |
| UI-14-012 | Smooth point | partial | Whole-path smoothing and curve flattening exist; per-point corner/smooth conversion and full vector networks remain incomplete. |
| UI-14-013 | Convert segment to curve | planned | reference-verification-pending |
| UI-14-014 | Convert segment to line | planned | reference-verification-pending |
| UI-14-015 | Insert point on segment | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-016 | Remove vector point | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-017 | Move vector point | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-018 | Multi-select vector points | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-019 | Marquee vector points | planned | reference-verification-pending |
| UI-14-020 | Vector point coordinates | planned | reference-verification-pending |
| UI-14-021 | Join vector endpoints | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Endpoint joins accept two open sibling layers or two selected endpoints. Splitting keeps separate contours in one layer; point transforms normalize bounds. |
| UI-14-022 | Split vector path | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Endpoint joins accept two open sibling layers or two selected endpoints. Splitting keeps separate contours in one layer; point transforms normalize bounds. |
| UI-14-023 | Reverse path direction | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-024 | Open closed path | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-025 | Bend tool | planned | reference-verification-pending |
| UI-14-026 | Vector network branches | planned | reference-verification-pending |
| UI-14-027 | Fill bounded vector region | planned | reference-verification-pending |
| UI-14-028 | Remove vector region fill | planned | reference-verification-pending |
| UI-14-029 | Vector winding rule | planned | reference-verification-pending |
| UI-14-030 | Vector edit mode | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-031 | Exit vector edit mode | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-032 | Round vector corners | planned | reference-verification-pending |
| UI-14-033 | Flatten vector network | partial | Whole-path smoothing and curve flattening exist; per-point corner/smooth conversion and full vector networks remain incomplete. |
| UI-14-034 | Outline vector stroke | planned | reference-verification-pending |
| UI-14-035 | Simplify vector path | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Cubic pen, anchor/handle editing and persisted curves have browser coverage. |
| UI-14-036 | Paste SVG path data | planned | reference-verification-pending |
| UI-14-037 | Smooth join vector endpoints | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Endpoint joins accept two open sibling layers or two selected endpoints. Splitting keeps separate contours in one layer; point transforms normalize bounds. |
| UI-14-038 | Delete vector points and heal path | partial | Delete-and-heal uses tangent-preserving cubic approximation. Exact Figma curve fitting is not claimed. |
| UI-14-039 | Offset vector path | planned | reference-verification-pending |
| UI-14-040 | Offset distance control | planned | reference-verification-pending |
| UI-14-041 | Offset square or round joins | planned | reference-verification-pending |
| UI-14-042 | Vector cut tool | planned | reference-verification-pending |
| UI-14-043 | Slice vectors into separate layers | planned | reference-verification-pending |
| UI-14-044 | Vector eraser tool | planned | reference-verification-pending |
| UI-14-045 | Vector eraser size and shape | planned | reference-verification-pending |
| UI-14-046 | Move or resize a selected point group | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Endpoint joins accept two open sibling layers or two selected endpoints. Splitting keeps separate contours in one layer; point transforms normalize bounds. |
| UI-14-047 | Rotate a selected point group | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Endpoint joins accept two open sibling layers or two selected endpoints. Splitting keeps separate contours in one layer; point transforms normalize bounds. |
| UI-14-048 | Switch vector layer while editing | planned | reference-verification-pending |

## Boolean geometry

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-15-001 | Union shapes | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-002 | Subtract shapes | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-003 | Intersect shapes | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-004 | Exclude overlapping shapes | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-005 | Live boolean group | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-006 | Edit boolean operands | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-007 | Reorder boolean operands | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-008 | Toggle operand visibility | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-009 | Release boolean group | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-010 | Flatten boolean result | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-011 | Nested boolean operations | partial | Nested path operands render; group operands, transformed parent editing, full mixed styling and geometry edge cases need further validation. |
| UI-15-012 | Boolean operation with text | planned | reference-verification-pending |
| UI-15-013 | Boolean operation with vectors | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-014 | Boolean operation with ellipses | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-015 | Boolean operation with rectangles | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-016 | Preserve boolean result fill | partial | Nested path operands render; group operands, transformed parent editing, full mixed styling and geometry edge cases need further validation. |
| UI-15-017 | Preserve boolean result stroke | partial | Nested path operands render; group operands, transformed parent editing, full mixed styling and geometry edge cases need further validation. |
| UI-15-018 | Boolean group bounds | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-019 | Boolean group export | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |
| UI-15-020 | Change boolean operation type | implemented | v0.2: actual Paper.js geometry, live operands, command/inspector paths, undo; analytic rectangle area and browser flatten/edit/export checks. |

## Freehand and Figma Draw

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-16-001 | Pencil freehand drawing | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-16-002 | Pencil smoothing | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-16-003 | Pencil path editing | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-16-004 | Brush drawing | planned | reference-verification-pending |
| UI-16-005 | Brush preset picker | planned | reference-verification-pending |
| UI-16-006 | Vector brush library | planned | reference-verification-pending |
| UI-16-007 | Custom brush creation | planned | reference-verification-pending |
| UI-16-008 | Brush spacing | planned | reference-verification-pending |
| UI-16-009 | Brush direction | planned | reference-verification-pending |
| UI-16-010 | Brush size | planned | reference-verification-pending |
| UI-16-011 | Brush pressure response | planned | reference-verification-pending |
| UI-16-012 | Brush opacity | planned | reference-verification-pending |
| UI-16-013 | Variable width strokes | planned | reference-verification-pending |
| UI-16-014 | Width control points | planned | reference-verification-pending |
| UI-16-015 | Dynamic stroke wiggle | planned | reference-verification-pending |
| UI-16-016 | Dynamic stroke frequency | planned | reference-verification-pending |
| UI-16-017 | Stroke taper | planned | reference-verification-pending |
| UI-16-018 | Calligraphic stroke | planned | reference-verification-pending |
| UI-16-019 | Text on path | planned | reference-verification-pending |
| UI-16-020 | Text path offset | planned | reference-verification-pending |
| UI-16-021 | Shape builder tool | planned | reference-verification-pending |
| UI-16-022 | Lasso vector selection | planned | reference-verification-pending |
| UI-16-023 | Multi-vector editing | planned | reference-verification-pending |
| UI-16-024 | Pattern fills | planned | reference-verification-pending |
| UI-16-025 | Pattern scale | planned | reference-verification-pending |
| UI-16-026 | Pattern rotation | planned | reference-verification-pending |
| UI-16-027 | Repeat pattern offsets | planned | reference-verification-pending |
| UI-16-028 | Noise fill | planned | reference-verification-pending |
| UI-16-029 | Texture fill | planned | reference-verification-pending |
| UI-16-030 | Progressive blur | planned | reference-verification-pending |
| UI-16-031 | Brush import | planned | reference-verification-pending |
| UI-16-032 | Brush export | planned | reference-verification-pending |
| UI-16-033 | Brush reset | planned | reference-verification-pending |
| UI-16-034 | Illustration mode toolbar | planned | reference-verification-pending |
| UI-16-035 | Radial repeat | planned | reference-verification-pending |
| UI-16-036 | Linear repeat | planned | reference-verification-pending |
| UI-16-037 | Stretch brush creation | planned | reference-verification-pending |
| UI-16-038 | Scatter brush creation | planned | reference-verification-pending |
| UI-16-039 | Sample a brush from canvas | planned | reference-verification-pending |

## Fills and colors

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-17-001 | Solid fill | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-17-002 | Hex color entry | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-17-003 | RGB color entry | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-004 | HSL color entry | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-005 | HSB color entry | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-006 | Color alpha channel | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-007 | Color picker saturation control | planned | reference-verification-pending |
| UI-17-008 | Color picker hue control | planned | reference-verification-pending |
| UI-17-009 | Color picker alpha control | planned | reference-verification-pending |
| UI-17-010 | Eyedropper | planned | reference-verification-pending |
| UI-17-011 | Sample canvas color | planned | reference-verification-pending |
| UI-17-012 | Sample screen color | planned | reference-verification-pending |
| UI-17-013 | Multiple fills per layer | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-014 | Reorder fill stack | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-015 | Toggle fill visibility | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-016 | Remove fill | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-17-017 | Duplicate fill | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-018 | Linear gradient | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-019 | Radial gradient | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-020 | Angular gradient | partial | Editable gradient stops/coordinates, saved data and raster SVG patterns; current raster resolution is 256×256, not an unlimited vector gradient. |
| UI-17-021 | Diamond gradient | partial | Editable gradient stops/coordinates, saved data and raster SVG patterns; current raster resolution is 256×256, not an unlimited vector gradient. |
| UI-17-022 | Gradient stop color | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-023 | Gradient stop opacity | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-024 | Insert gradient stop | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-025 | Remove gradient stop | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-026 | Gradient stop position | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-027 | Reverse gradient | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-028 | Gradient rotation | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. SVG gradients are checked by exported pixel colors. |
| UI-17-029 | Gradient handles | planned | reference-verification-pending |
| UI-17-030 | Document color swatches | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-17-031 | Recent colors | planned | reference-verification-pending |
| UI-17-032 | Color style assignment | planned | reference-verification-pending |
| UI-17-033 | Color variable assignment | planned | reference-verification-pending |
| UI-17-034 | Mixed fill selection | planned | reference-verification-pending |
| UI-17-035 | Selection colors panel | planned | reference-verification-pending |
| UI-17-036 | Replace selection color | planned | reference-verification-pending |
| UI-17-037 | Shader fill assignment | planned | reference-verification-pending |
| UI-17-038 | Shader fill parameter controls | planned | reference-verification-pending |
| UI-17-039 | Shader fill stacking | planned | reference-verification-pending |

## Strokes

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-18-001 | Solid stroke | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-18-002 | Stroke color | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-18-003 | Stroke opacity | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-004 | Stroke weight | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-18-005 | Multiple strokes | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-006 | Stroke visibility | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-18-007 | Stroke stack order | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-008 | Stroke align inside | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-009 | Stroke align center | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-010 | Stroke align outside | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-011 | Independent edge strokes | planned | reference-verification-pending |
| UI-18-012 | Stroke join miter | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-013 | Stroke join round | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-18-014 | Stroke join bevel | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-015 | Miter limit | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-016 | Stroke cap butt | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-017 | Stroke cap round | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-18-018 | Stroke cap square | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-019 | Dash pattern | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-020 | Dash gap | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-021 | Dash offset | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-022 | Arrowhead size | planned | reference-verification-pending |
| UI-18-023 | Arrowhead color inheritance | planned | reference-verification-pending |
| UI-18-024 | Gradient stroke | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-18-025 | Image stroke | partial | Image paint controls/rendering exist; crop/tile edge cases and real Figma transfer still need visual coverage. |
| UI-18-026 | Stroke style reuse | planned | reference-verification-pending |
| UI-18-027 | Outline stroke conversion | planned | reference-verification-pending |
| UI-18-028 | Stroke scale behavior | planned | reference-verification-pending |
| UI-18-029 | Per-point stroke width | planned | reference-verification-pending |
| UI-18-030 | Stroke variable binding | planned | reference-verification-pending |
| UI-18-031 | Shader stroke assignment | planned | reference-verification-pending |

## Effects and compositing

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-19-001 | Drop shadow | implemented | v0.2: parameterized effect stacks replace fixed preview controls; legacy files migrate through fallback rendering. |
| UI-19-002 | Inner shadow | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-003 | Layer blur | implemented | v0.2: parameterized effect stacks replace fixed preview controls; legacy files migrate through fallback rendering. |
| UI-19-004 | Background blur | planned | reference-verification-pending |
| UI-19-005 | Shadow x offset | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-006 | Shadow y offset | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-007 | Shadow radius | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-008 | Shadow spread | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-009 | Shadow color | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-010 | Shadow opacity | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-011 | Multiple effects | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-012 | Reorder effects | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-013 | Toggle effect visibility | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-014 | Duplicate effect | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-015 | Remove effect | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-016 | Effect styles | planned | reference-verification-pending |
| UI-19-017 | Normal blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-018 | Pass-through blend mode | planned | reference-verification-pending |
| UI-19-019 | Multiply blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-020 | Screen blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-021 | Overlay blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-022 | Darken blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-023 | Lighten blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-024 | Color dodge blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-025 | Color burn blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-026 | Hard light blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-027 | Soft light blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-028 | Difference blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-029 | Exclusion blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-030 | Hue blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-031 | Saturation blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-032 | Color blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-033 | Luminosity blend mode | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-034 | Layer opacity | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-19-035 | Group isolation | implemented | v0.2: SVG filter stacks and compositing, editable inspector, undo and validation. Browser tests verify inner/drop shadow pixels and group alpha. Each blend mode still needs broader reference acceptance testing. |
| UI-19-036 | Backdrop filter clipping | planned | reference-verification-pending |
| UI-19-037 | Shader effect assignment | planned | reference-verification-pending |
| UI-19-038 | Shader effect parameter controls | planned | reference-verification-pending |
| UI-19-039 | Shader effect stacking | planned | reference-verification-pending |
| UI-19-040 | Shader texture clipping to layer | planned | reference-verification-pending |
| UI-19-041 | Shader version update indicator | planned | reference-verification-pending |

## Images and media

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-20-001 | Import PNG | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-20-002 | Import JPEG | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-20-003 | Import WebP | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-20-004 | Import GIF | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-20-005 | Import SVG | partial | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Reviewed editable SVG layers and sanitized visual fallback are reachable. Full SVG/CSS/filter/mask/clip/typography conformance remains incomplete; see SVG-IMPORT.md. |
| UI-20-006 | Place multiple images | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-20-007 | Drag image onto canvas | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-20-008 | Image fill mode fill | planned | reference-verification-pending |
| UI-20-009 | Image fill mode fit | planned | reference-verification-pending |
| UI-20-010 | Image crop mode | planned | reference-verification-pending |
| UI-20-011 | Image tile mode | planned | reference-verification-pending |
| UI-20-012 | Interactive image crop | planned | reference-verification-pending |
| UI-20-013 | Image scale | planned | reference-verification-pending |
| UI-20-014 | Image rotation | planned | reference-verification-pending |
| UI-20-015 | Replace image | planned | Not implemented in this preview. |
| UI-20-016 | Reset image transform | planned | reference-verification-pending |
| UI-20-017 | Image exposure | planned | reference-verification-pending |
| UI-20-018 | Image contrast | planned | reference-verification-pending |
| UI-20-019 | Image saturation | planned | reference-verification-pending |
| UI-20-020 | Image temperature | planned | reference-verification-pending |
| UI-20-021 | Image tint | planned | reference-verification-pending |
| UI-20-022 | Image highlights | planned | reference-verification-pending |
| UI-20-023 | Image shadows | planned | reference-verification-pending |
| UI-20-024 | Image opacity | planned | reference-verification-pending |
| UI-20-025 | Image masking | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Images participate in alpha/vector/luminance masks, including embedded image transparency and SVG/PNG export. |
| UI-20-026 | Copy image as PNG | planned | reference-verification-pending |
| UI-20-027 | Export original image | planned | reference-verification-pending |
| UI-20-028 | Image file size display | planned | reference-verification-pending |
| UI-20-029 | Animated GIF playback | planned | reference-verification-pending |
| UI-20-030 | Video import | planned | reference-verification-pending |
| UI-20-031 | Video poster frame | planned | reference-verification-pending |
| UI-20-032 | Video playback | planned | reference-verification-pending |
| UI-20-033 | Video loop | planned | reference-verification-pending |
| UI-20-034 | Video audio toggle | planned | reference-verification-pending |
| UI-20-035 | Video start time | planned | reference-verification-pending |
| UI-20-036 | Video prototype playback | planned | reference-verification-pending |

## Typography

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-21-001 | Create text by click | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-002 | Create text by drag | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-003 | Inline text editing | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-004 | Text content inspector | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-005 | Font family selection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-006 | Font family search | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-007 | Font style selection | partial | Normal/italic faces and numeric weights are available; comprehensive named font-face/style discovery and matching remain incomplete. |
| UI-21-008 | Font weight | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-009 | Font size | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-010 | Font size arithmetic | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-21-011 | Line height | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-012 | Letter spacing | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-013 | Paragraph spacing | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Canvas text measurement and single-style wrapping/truncation are tested. |
| UI-21-014 | Paragraph indentation | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Canvas text measurement and single-style wrapping/truncation are tested. |
| UI-21-015 | Auto-width text | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Canvas text measurement and single-style wrapping/truncation are tested. |
| UI-21-016 | Auto-height text | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Canvas text measurement and single-style wrapping/truncation are tested. |
| UI-21-017 | Fixed-size text | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Canvas text measurement and single-style wrapping/truncation are tested. |
| UI-21-018 | Text overflow truncation | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Canvas text measurement and single-style wrapping/truncation are tested. |
| UI-21-019 | Maximum text lines | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Canvas text measurement and single-style wrapping/truncation are tested. |
| UI-21-020 | Text horizontal left | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-021 | Text horizontal center | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-022 | Text horizontal right | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-023 | Text justified alignment | partial | Single-style synthetic italic and line spacing justification exist. Real italic assets, mixed ranges, complex-script shaping and paragraph-level reference fidelity remain incomplete. |
| UI-21-024 | Text vertical top | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Canvas text measurement and single-style wrapping/truncation are tested. |
| UI-21-025 | Text vertical middle | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Canvas text measurement and single-style wrapping/truncation are tested. |
| UI-21-026 | Text vertical bottom | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Canvas text measurement and single-style wrapping/truncation are tested. |
| UI-21-027 | Text fill | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-028 | Text stroke | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Canvas text measurement and single-style wrapping/truncation are tested. |
| UI-21-029 | Text background | planned | Not implemented in this preview. |
| UI-21-030 | Text opacity | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-031 | Text rotation | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-21-032 | Mixed text properties | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Select character ranges in the inspector; mixed styles render and persist with style-preserving clipboard. Paragraph-level styling is separate and absent. |
| UI-21-033 | Character-level styling | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Select character ranges in the inspector; mixed styles render and persist with style-preserving clipboard. Paragraph-level styling is separate and absent. |
| UI-21-034 | Paragraph-level styling | planned | reference-verification-pending |
| UI-21-035 | Font fallback warning | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. True italic font styles, missing-family badge and document-wide replacement. Style-specific missing-face auditing is incomplete. |
| UI-21-036 | Missing font replacement | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. True italic font styles, missing-family badge and document-wide replacement. Style-specific missing-face auditing is incomplete. |

## Advanced typography

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-22-001 | Bold text shortcut | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-22-002 | Italic text shortcut | partial | Synthetic italic; simple single-style paragraph prefixes and uniform indentation. Nested lists, rich ranges and true italic font assets remain planned. |
| UI-22-003 | Underline text | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-22-004 | Strikethrough text | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-22-005 | Uppercase transformation | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-22-006 | Lowercase transformation | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-22-007 | Title case transformation | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. |
| UI-22-008 | Small caps | planned | reference-verification-pending |
| UI-22-009 | Superscript | planned | reference-verification-pending |
| UI-22-010 | Subscript | planned | reference-verification-pending |
| UI-22-011 | Numbered lists | partial | Synthetic italic; simple single-style paragraph prefixes and uniform indentation. Nested lists, rich ranges and true italic font assets remain planned. |
| UI-22-012 | Bulleted lists | partial | Synthetic italic; simple single-style paragraph prefixes and uniform indentation. Nested lists, rich ranges and true italic font assets remain planned. |
| UI-22-013 | Nested lists | planned | reference-verification-pending |
| UI-22-014 | List indentation | partial | Synthetic italic; simple single-style paragraph prefixes and uniform indentation. Nested lists, rich ranges and true italic font assets remain planned. |
| UI-22-015 | Text links | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Reachable selected-range text/link/underline controls and styled/plain clipboard. Exported SVG retains links; native underline rendering needs further visual acceptance. |
| UI-22-016 | Link editing | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Reachable selected-range text/link/underline controls and styled/plain clipboard. Exported SVG retains links; native underline rendering needs further visual acceptance. |
| UI-22-017 | OpenType ligatures | partial | Numeric OpenType tags and variable-axis settings affect supporting font files. Automatic feature discovery/previews, font-specific controls and native parity remain incomplete. |
| UI-22-018 | OpenType alternates | partial | Numeric OpenType tags and variable-axis settings affect supporting font files. Automatic feature discovery/previews, font-specific controls and native parity remain incomplete. |
| UI-22-019 | Stylistic sets | partial | Numeric OpenType tags and variable-axis settings affect supporting font files. Automatic feature discovery/previews, font-specific controls and native parity remain incomplete. |
| UI-22-020 | Variable font axes | partial | Numeric OpenType tags and variable-axis settings affect supporting font files. Automatic feature discovery/previews, font-specific controls and native parity remain incomplete. |
| UI-22-021 | Optical sizing | partial | Numeric OpenType tags and variable-axis settings affect supporting font files. Automatic feature discovery/previews, font-specific controls and native parity remain incomplete. |
| UI-22-022 | Tabular numerals | partial | Numeric OpenType tags and variable-axis settings affect supporting font files. Automatic feature discovery/previews, font-specific controls and native parity remain incomplete. |
| UI-22-023 | Proportional numerals | partial | Numeric OpenType tags and variable-axis settings affect supporting font files. Automatic feature discovery/previews, font-specific controls and native parity remain incomplete. |
| UI-22-024 | Fractions | partial | Numeric OpenType tags and variable-axis settings affect supporting font files. Automatic feature discovery/previews, font-specific controls and native parity remain incomplete. |
| UI-22-025 | Kerning | partial | Numeric OpenType tags and variable-axis settings affect supporting font files. Automatic feature discovery/previews, font-specific controls and native parity remain incomplete. |
| UI-22-026 | Text selection color display | planned | reference-verification-pending |
| UI-22-027 | Copy text content | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Reachable selected-range text/link/underline controls and styled/plain clipboard. Exported SVG retains links; native underline rendering needs further visual acceptance. |
| UI-22-028 | Paste text with style | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Reachable selected-range text/link/underline controls and styled/plain clipboard. Exported SVG retains links; native underline rendering needs further visual acceptance. |
| UI-22-029 | Paste text without style | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Reachable selected-range text/link/underline controls and styled/plain clipboard. Exported SVG retains links; native underline rendering needs further visual acceptance. |
| UI-22-030 | Text style creation | planned | reference-verification-pending |
| UI-22-031 | Text style editing | planned | reference-verification-pending |
| UI-22-032 | Text style detachment | planned | reference-verification-pending |
| UI-22-033 | Text selection find | planned | reference-verification-pending |
| UI-22-034 | Text replacement | planned | reference-verification-pending |
| UI-22-035 | Emoji input | planned | reference-verification-pending |
| UI-22-036 | Bidirectional text | planned | reference-verification-pending |
| UI-22-037 | Right-to-left paragraphs | planned | reference-verification-pending |
| UI-22-038 | Multilingual font fallback | planned | reference-verification-pending |
| UI-22-039 | Text on curve baseline | planned | reference-verification-pending |
| UI-22-040 | Text accessibility description | planned | reference-verification-pending |
| UI-22-041 | Smart quotation and symbol substitution | planned | reference-verification-pending |
| UI-22-042 | Emoji colon-code completion | planned | reference-verification-pending |
| UI-22-043 | Text vertical trim | planned | reference-verification-pending |
| UI-22-044 | Balanced and pretty text wrapping | planned | reference-verification-pending |
| UI-22-045 | Hanging quotation marks | planned | reference-verification-pending |
| UI-22-046 | Hanging list markers | planned | reference-verification-pending |
| UI-22-047 | List item spacing | planned | reference-verification-pending |
| UI-22-048 | Underline style control | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Reachable selected-range text/link/underline controls and styled/plain clipboard. Exported SVG retains links; native underline rendering needs further visual acceptance. |
| UI-22-049 | Underline thickness | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Reachable selected-range text/link/underline controls and styled/plain clipboard. Exported SVG retains links; native underline rendering needs further visual acceptance. |
| UI-22-050 | Underline offset | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Reachable selected-range text/link/underline controls and styled/plain clipboard. Exported SVG retains links; native underline rendering needs further visual acceptance. |
| UI-22-051 | Underline skip ink | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Reachable selected-range text/link/underline controls and styled/plain clipboard. Exported SVG retains links; native underline rendering needs further visual acceptance. |
| UI-22-052 | Underline color | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Reachable selected-range text/link/underline controls and styled/plain clipboard. Exported SVG retains links; native underline rendering needs further visual acceptance. |
| UI-22-053 | OpenType feature previews | planned | reference-verification-pending |
| UI-22-054 | Type settings tabs | planned | reference-verification-pending |
| UI-22-055 | Line-height unit conversion | planned | reference-verification-pending |

## Constraints and resizing

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-23-001 | Horizontal left constraint | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-002 | Horizontal right constraint | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-003 | Horizontal center constraint | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-004 | Horizontal left-right constraint | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-005 | Horizontal scale constraint | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-006 | Vertical top constraint | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-007 | Vertical bottom constraint | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-008 | Vertical center constraint | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-009 | Vertical top-bottom constraint | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-010 | Vertical scale constraint | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-011 | Fixed child width | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-012 | Fixed child height | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-013 | Hug contents width | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-014 | Hug contents height | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-015 | Fill container width | partial | Row/column fill, min/max allocation and nested constraints work. Grid tracks/spans, aspect ratios, deeply nested wrap (>8 stabilization passes), rotated editing and all text/fill sizing combinations need more work. |
| UI-23-016 | Fill container height | partial | Row/column fill, min/max allocation and nested constraints work. Grid tracks/spans, aspect ratios, deeply nested wrap (>8 stabilization passes), rotated editing and all text/fill sizing combinations need more work. |
| UI-23-017 | Minimum width | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-018 | Maximum width | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-019 | Minimum height | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-020 | Maximum height | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-021 | Aspect ratio in layout | planned | reference-verification-pending |
| UI-23-022 | Constraint visualization | planned | reference-verification-pending |
| UI-23-023 | Resize nested constrained frame | partial | Row/column fill, min/max allocation and nested constraints work. Grid tracks/spans, aspect ratios, deeply nested wrap (>8 stabilization passes), rotated editing and all text/fill sizing combinations need more work. |
| UI-23-024 | Ignore auto layout | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-025 | Absolute child position | implemented | v0.2: sizing/constraint inspector, frame resize solver, schema validation, nested constraints and undo tests. Unrotated rectangular layout is the supported scope. |
| UI-23-026 | Preserve constraints on reparenting | planned | reference-verification-pending |
| UI-23-027 | Stretch with layout columns | planned | reference-verification-pending |
| UI-23-028 | Stretch with layout rows | planned | reference-verification-pending |
| UI-23-029 | Relative frame positioning | planned | reference-verification-pending |
| UI-23-030 | Responsive resize preview | partial | Row/column fill, min/max allocation and nested constraints work. Grid tracks/spans, aspect ratios, deeply nested wrap (>8 stabilization passes), rotated editing and all text/fill sizing combinations need more work. |

## Auto layout fundamentals

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-24-001 | Add horizontal auto layout | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-24-002 | Add vertical auto layout | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-24-003 | Remove auto layout | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-24-004 | Auto-layout frame from selection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-24-005 | Change layout flow | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-24-006 | Layout gap | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-24-007 | Uniform padding | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-24-008 | Horizontal padding | partial | Set each edge independently or use uniform padding; no paired horizontal/vertical quick-control yet. |
| UI-24-009 | Vertical padding | partial | Set each edge independently or use uniform padding; no paired horizontal/vertical quick-control yet. |
| UI-24-010 | Independent top padding | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-011 | Independent right padding | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-012 | Independent bottom padding | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-013 | Independent left padding | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-014 | Align children top-left | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-015 | Align children top-center | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-016 | Align children top-right | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-017 | Align children middle-left | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-018 | Align children middle-center | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-019 | Align children middle-right | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-020 | Align children bottom-left | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-021 | Align children bottom-center | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-022 | Align children bottom-right | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-023 | Space-between distribution | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-024 | Space-around distribution | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-025 | Space-evenly distribution | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-026 | Auto gap sizing | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-027 | Reverse stacking order | planned | reference-verification-pending |
| UI-24-028 | Baseline alignment | planned | reference-verification-pending |
| UI-24-029 | Stroke included in layout | planned | reference-verification-pending |
| UI-24-030 | Hidden child exclusion | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-24-031 | Nested auto layout | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-24-032 | Layout resize preview | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-24-033 | Drag reorder layout children | planned | reference-verification-pending |
| UI-24-034 | Insert child into auto layout | planned | reference-verification-pending |
| UI-24-035 | Layout overflow clipping | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |
| UI-24-036 | Negative layout gap | implemented | v0.2: independent padding, main/cross-axis controls and SVG clipping. Core layout solver tests and inspector browser workflows pass. |

## Auto layout grid and wrap

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-25-001 | Grid auto-layout flow | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-25-002 | Grid column count | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-25-003 | Grid row count | planned | reference-verification-pending |
| UI-25-004 | Fixed grid tracks | planned | reference-verification-pending |
| UI-25-005 | Flexible grid tracks | planned | reference-verification-pending |
| UI-25-006 | Hug grid tracks | planned | reference-verification-pending |
| UI-25-007 | Minimum grid track size | planned | reference-verification-pending |
| UI-25-008 | Maximum grid track size | planned | reference-verification-pending |
| UI-25-009 | Column gap | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Both wrap directions have solver tests; wrapping supports layer order with start cross-line placement. |
| UI-25-010 | Row gap | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Both wrap directions have solver tests; wrapping supports layer order with start cross-line placement. |
| UI-25-011 | Grid cell positioning | planned | reference-verification-pending |
| UI-25-012 | Grid column span | planned | reference-verification-pending |
| UI-25-013 | Grid row span | planned | reference-verification-pending |
| UI-25-014 | Grid track drag resize | planned | reference-verification-pending |
| UI-25-015 | Auto-created grid cells | planned | reference-verification-pending |
| UI-25-016 | Empty grid cell display | planned | reference-verification-pending |
| UI-25-017 | Grid item alignment | planned | reference-verification-pending |
| UI-25-018 | Grid item fill sizing | partial | Fixed-count grid and basic child fill sizing exist; track definitions, spans, row sizing and arbitrary grid alignment remain incomplete. |
| UI-25-019 | Grid track ordering | planned | reference-verification-pending |
| UI-25-020 | Nested grid layout | partial | Fixed-count grid and basic child fill sizing exist; track definitions, spans, row sizing and arbitrary grid alignment remain incomplete. |
| UI-25-021 | Horizontal wrap | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Both wrap directions have solver tests; wrapping supports layer order with start cross-line placement. |
| UI-25-022 | Vertical wrap | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Both wrap directions have solver tests; wrapping supports layer order with start cross-line placement. |
| UI-25-023 | Wrap row gap | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Both wrap directions have solver tests; wrapping supports layer order with start cross-line placement. |
| UI-25-024 | Wrap column gap | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Both wrap directions have solver tests; wrapping supports layer order with start cross-line placement. |
| UI-25-025 | Wrap direction | planned | reference-verification-pending |
| UI-25-026 | Wrap alignment | planned | reference-verification-pending |
| UI-25-027 | Grid item absolute position | implemented | v0.2 development: inspector/command, .oui persistence and undo; core tests and browser workflows documented in docs/VALIDATION-v0.2-development.md. Both wrap directions have solver tests; wrapping supports layer order with start cross-line placement. |
| UI-25-028 | Grid layout guide overlay | planned | reference-verification-pending |
| UI-25-029 | Suggest auto layout | planned | reference-verification-pending |
| UI-25-030 | Convert stack to grid | planned | reference-verification-pending |

## Layout guides

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-26-001 | Uniform square grid | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-002 | Column layout guide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-003 | Row layout guide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-004 | Guide count | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-005 | Guide color | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-006 | Guide opacity | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-007 | Guide gutter | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-008 | Guide margin | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-009 | Guide fixed width | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-010 | Guide stretch width | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-011 | Guide center alignment | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-012 | Guide left alignment | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-013 | Guide right alignment | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-014 | Guide top alignment | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-015 | Guide bottom alignment | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-016 | Multiple layout guides | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-017 | Toggle individual guide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-018 | Remove layout guide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-019 | Duplicate layout guide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-020 | Layout guide style | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-021 | Apply layout guide style | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-022 | Edit layout guide style | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-023 | Detach layout guide style | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-024 | Layout guide constraints | partial | Guide geometry participates in snapping; child constraints to individual grid tracks are not implemented. |
| UI-26-025 | Grid visibility shortcut | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-026 | Guide override in instance | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-027 | Per-frame layout guides | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-028 | Guide offset | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-029 | Export guides option | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |
| UI-26-030 | Nested frame guide visibility | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Frame guides, style links, instance override preservation, nested visibility and optional SVG/PNG/JPEG export. |

## Components

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-27-001 | Create main component | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-27-002 | Convert frame to component | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-27-003 | Convert group to component | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-27-004 | Main component icon | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-27-005 | Component naming paths | partial | Slash names and name/tag search work; a complete folder browser is not implemented. |
| UI-27-006 | Component description | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-007 | Component documentation link | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-008 | Component search tags | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-009 | Component preview | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-010 | Main component selection | planned | reference-verification-pending |
| UI-27-011 | Main component navigation | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-012 | Component assets panel | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-27-013 | Insert component instance | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-014 | Instance component reference | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-015 | Detach instance | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-016 | Reset instance | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-017 | Reset text override | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-018 | Reset fill override | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-019 | Reset visibility override | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-020 | Reset size override | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-021 | Instance text override | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-022 | Instance fill override | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-023 | Instance effect override | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-024 | Instance visibility override | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-025 | Instance image override | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-026 | Nested instance override | partial | Nested sources propagate and compatible paths/component keys preserve overrides on swap. Arbitrary nested override combinations, divergent structures and per-binding override granularity remain incomplete. |
| UI-27-027 | Preserve overrides when swapping | partial | Nested sources propagate and compatible paths/component keys preserve overrides on swap. Arbitrary nested override combinations, divergent structures and per-binding override granularity remain incomplete. |
| UI-27-028 | Swap instance | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-029 | Preferred swap values | planned | reference-verification-pending |
| UI-27-030 | Component propagation | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-031 | Component deletion warning | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-032 | Restore missing component | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-033 | Expose nested instance | partial | Nested sources propagate and compatible paths/component keys preserve overrides on swap. Arbitrary nested override combinations, divergent structures and per-binding override granularity remain incomplete. |
| UI-27-034 | Instance accessibility label | planned | reference-verification-pending |
| UI-27-035 | Component thumbnail | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Cross-page sources and source-node identity are supported; missing sources retain their appearance. |
| UI-27-036 | Component organization by folder | partial | Slash names and name/tag search work; a complete folder browser is not implemented. |

## Variants and properties

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-28-001 | Combine components as variants | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-002 | Create component set | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-003 | Variant property names | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-004 | Variant property values | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-005 | Variant selection control | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-006 | Add variant | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-007 | Duplicate variant | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-008 | Remove variant | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-009 | Rename variant | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-010 | Default variant | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-011 | Variant sorting | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-012 | Variant layout in set | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-013 | Variant description | planned | reference-verification-pending |
| UI-28-014 | Text component property | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-015 | Boolean component property | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-016 | Instance-swap component property | partial | Text/boolean properties and nested instance-swap definitions are exposed. Complex nested swaps and property migration across divergent variants need broader validation; multi-selection starts from the first selected instance. |
| UI-28-017 | Variant component property | partial | Text/boolean properties and nested instance-swap definitions are exposed. Complex nested swaps and property migration across divergent variants need broader validation; multi-selection starts from the first selected instance. |
| UI-28-018 | Property default value | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-019 | Property description | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-020 | Expose nested property | partial | Text/boolean properties and nested instance-swap definitions are exposed. Complex nested swaps and property migration across divergent variants need broader validation; multi-selection starts from the first selected instance. |
| UI-28-021 | Bind text property | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-022 | Bind visibility property | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-023 | Bind swap property | partial | Text/boolean properties and nested instance-swap definitions are exposed. Complex nested swaps and property migration across divergent variants need broader validation; multi-selection starts from the first selected instance. |
| UI-28-024 | Hide irrelevant properties | planned | reference-verification-pending |
| UI-28-025 | Property grouping | planned | reference-verification-pending |
| UI-28-026 | Preferred component instances | planned | reference-verification-pending |
| UI-28-027 | Multi-select property editing | partial | Text/boolean properties and nested instance-swap definitions are exposed. Complex nested swaps and property migration across divergent variants need broader validation; multi-selection starts from the first selected instance. |
| UI-28-028 | Variant conflict detection | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Sets have named axes, default insertion, grid arrangement and conflict warnings. |
| UI-28-029 | Interactive variant transitions | planned | reference-verification-pending |
| UI-28-030 | Variant matching on swap | partial | Text/boolean properties and nested instance-swap definitions are exposed. Complex nested swaps and property migration across divergent variants need broader validation; multi-selection starts from the first selected instance. |

## Libraries and design systems

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-29-001 | Local component library | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Local style bindings update consumers; JSON library import remaps identifiers and aliases. |
| UI-29-002 | Local color styles | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Local style bindings update consumers; JSON library import remaps identifiers and aliases. |
| UI-29-003 | Local text styles | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Local style bindings update consumers; JSON library import remaps identifiers and aliases. |
| UI-29-004 | Local effect styles | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Local style bindings update consumers; JSON library import remaps identifiers and aliases. |
| UI-29-005 | Local layout guide styles | planned | reference-verification-pending |
| UI-29-006 | Publish library | planned | reference-verification-pending |
| UI-29-007 | Library publish description | planned | reference-verification-pending |
| UI-29-008 | Library version details | planned | reference-verification-pending |
| UI-29-009 | Enable library in file | planned | reference-verification-pending |
| UI-29-010 | Disable library in file | planned | reference-verification-pending |
| UI-29-011 | Browse available libraries | planned | reference-verification-pending |
| UI-29-012 | Search library assets | planned | reference-verification-pending |
| UI-29-013 | Library asset preview | planned | reference-verification-pending |
| UI-29-014 | Library update notification | planned | reference-verification-pending |
| UI-29-015 | Review library updates | planned | reference-verification-pending |
| UI-29-016 | Accept all library updates | planned | reference-verification-pending |
| UI-29-017 | Accept selected library updates | planned | reference-verification-pending |
| UI-29-018 | Ignore library update | planned | reference-verification-pending |
| UI-29-019 | Deprecate library component | planned | reference-verification-pending |
| UI-29-020 | Library analytics | planned | reference-verification-pending |
| UI-29-021 | Library usage counts | planned | reference-verification-pending |
| UI-29-022 | Library permissions | planned | reference-verification-pending |
| UI-29-023 | Organization library approval | planned | reference-verification-pending |
| UI-29-024 | Move component between libraries | planned | reference-verification-pending |
| UI-29-025 | Swap library source | planned | reference-verification-pending |
| UI-29-026 | Missing library indicator | planned | reference-verification-pending |
| UI-29-027 | Style naming folders | partial | Slash names and search exist; imports preserve existing assets by generating new identifiers. Folder navigation and an interactive conflict-resolution workflow remain incomplete. |
| UI-29-028 | Style descriptions | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Local style bindings update consumers; JSON library import remaps identifiers and aliases. |
| UI-29-029 | Detach style | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Local style bindings update consumers; JSON library import remaps identifiers and aliases. |
| UI-29-030 | Import style | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Local style bindings update consumers; JSON library import remaps identifiers and aliases. |
| UI-29-031 | Export design tokens | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Local style bindings update consumers; JSON library import remaps identifiers and aliases. |
| UI-29-032 | Component documentation page | planned | reference-verification-pending |
| UI-29-033 | Token usage search | planned | reference-verification-pending |
| UI-29-034 | Unused asset detection | planned | reference-verification-pending |
| UI-29-035 | Style conflict resolution | partial | Slash names and search exist; imports preserve existing assets by generating new identifiers. Folder navigation and an interactive conflict-resolution workflow remain incomplete. |
| UI-29-036 | Library change history | planned | reference-verification-pending |

## Variables and tokens

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-30-001 | Color variables | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-002 | Number variables | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-003 | String variables | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-004 | Boolean variables | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-005 | Create variable collection | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-006 | Rename variable collection | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-007 | Delete variable collection | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-008 | Create variable | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-009 | Rename variable | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-010 | Delete variable | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-011 | Duplicate variable | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-012 | Variable description | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-013 | Variable scopes | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-014 | Variable aliases | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-015 | Alias chain display | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-016 | Alias cycle detection | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-017 | Variable search | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-018 | Variable grouping with slashes | partial | Slash-separated names and substring search work; a hierarchical token-group editor is not present. |
| UI-30-019 | Variable modes | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-020 | Create mode | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-021 | Rename mode | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-022 | Delete mode | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-023 | Default mode | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-024 | Per-frame mode | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-025 | Inherit mode from parent | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-026 | Explicit mode override | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-027 | Apply variable to fill | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-028 | Apply variable to stroke | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-029 | Apply variable to radius | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-030 | Apply variable to dimensions | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-031 | Apply variable to gap | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-032 | Apply variable to padding | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-033 | Apply variable to text | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-034 | Apply variable to visibility | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-035 | Variable code syntax | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-036 | Publish variables | planned | reference-verification-pending |
| UI-30-037 | Remote variables | planned | reference-verification-pending |
| UI-30-038 | Variable import | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-039 | Variable export | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |
| UI-30-040 | Missing variable handling | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Aliases are type checked and possible dependency cycles rejected. Missing bindings retain the last literal value; deletions materialize dependent aliases. |

## Prototype connections

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-31-001 | Prototype mode canvas | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-002 | Create navigation link | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-003 | Remove prototype link | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-004 | Link from child layer | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-005 | Link from frame | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-006 | Link to frame | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-007 | Link to section | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-008 | Connection handle | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-009 | Connection path display | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-010 | Select connection | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-011 | Starting flow point | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-012 | Name prototype flow | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-013 | Multiple starting flows | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-014 | Reorder flows | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-015 | Flow description | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-016 | Flow link copying | planned | reference-verification-pending |
| UI-31-017 | Navigate-to action | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-018 | Back action | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-019 | Open-link action | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-020 | Open-overlay action | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-021 | Swap-overlay action | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-022 | Close-overlay action | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-023 | Scroll-to action | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-024 | Change-to-variant action | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-025 | Set-variable action | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-026 | Conditional action | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-027 | Multiple actions on trigger | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-028 | Prototype link inspection | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |
| UI-31-029 | Prototype connection search | partial | Search covers top-level destinations; nested conditional destinations are validated but not fully indexed. |
| UI-31-030 | Broken destination warning | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Section destinations resolve to their first prototype frame. Named flows and visible canvas connections are local. |

## Prototype triggers

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-32-001 | On-click trigger | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-002 | On-drag trigger | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-003 | While-hovering trigger | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-004 | While-pressing trigger | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-005 | Mouse-enter trigger | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-006 | Mouse-leave trigger | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-007 | Mouse-down trigger | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-008 | Mouse-up trigger | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-009 | After-delay trigger | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-010 | Key-down trigger | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-011 | Gamepad trigger | partial | Gamepad input and touch pointer paths are implemented; automated simulated gamepad/pointer checks do not establish physical controller and all native-device acceptance. |
| UI-32-012 | Touch interaction support | partial | Gamepad input and touch pointer paths are implemented; automated simulated gamepad/pointer checks do not establish physical controller and all native-device acceptance. |
| UI-32-013 | Scroll interaction support | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-014 | Trigger delay | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-015 | Keyboard key picker | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-016 | Modifier key triggers | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-017 | Multiple trigger combinations | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-018 | Trigger duplication | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-019 | Trigger removal | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-32-020 | Trigger ordering | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |

## Prototype animation and overlays

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-33-001 | Instant transition | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-002 | Dissolve transition | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-003 | Smart animate transition | partial | Smart animate and interrupted transitions work for supported matched properties. Arbitrary topology/effect/text morphs and exact interruption semantics remain incomplete. |
| UI-33-004 | Move-in transition | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-005 | Move-out transition | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-006 | Push transition | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-007 | Slide-in transition | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-008 | Slide-out transition | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-009 | Animation duration | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-010 | Linear easing | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-011 | Ease-in easing | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-012 | Ease-out easing | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-013 | Ease-in-out easing | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-014 | Custom bezier easing | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-015 | Spring easing | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-016 | Match layers for animation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-017 | Preserve scroll on navigation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-018 | Reset component state on navigation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-019 | Overlay center placement | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-020 | Overlay manual placement | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-021 | Overlay background color | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-022 | Overlay background opacity | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-023 | Close overlay on outside click | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-024 | Overlay overflow | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-025 | Nested overlays | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-026 | Overlay animation direction | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-027 | Smart animate rotation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-028 | Smart animate opacity | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-029 | Smart animate size | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-030 | Smart animate fill | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |
| UI-33-031 | Animation interruption | partial | Smart animate and interrupted transitions work for supported matched properties. Arbitrary topology/effect/text morphs and exact interruption semantics remain incomplete. |
| UI-33-032 | Animation replay | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Compatible image/gradient/solid paint stacks and name-path matching are supported; see PROTOTYPES.md for scope. |

## Advanced prototype behavior

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-34-001 | Prototype variable state | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-002 | Set string variable | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-003 | Set number variable | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-004 | Set boolean variable | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-005 | Set color variable | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-006 | Variable expression editor | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-007 | Arithmetic expressions | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-008 | String expressions | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-009 | Boolean expressions | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-010 | Comparison expressions | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-011 | Logical expressions | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-012 | If branch | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-013 | Else-if branch | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-014 | Else branch | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-015 | Nested conditionals | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-016 | Multi-action ordering | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-017 | Reset variable state | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-018 | Interactive component state | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-019 | Nested interactive components | partial | Variables and authored component variants can model these states, but dedicated control templates and all nested interactive combinations remain incomplete. |
| UI-34-020 | Form input simulation | planned | reference-verification-pending |
| UI-34-021 | Checkbox simulation | partial | Variables and authored component variants can model these states, but dedicated control templates and all nested interactive combinations remain incomplete. |
| UI-34-022 | Radio control simulation | partial | Variables and authored component variants can model these states, but dedicated control templates and all nested interactive combinations remain incomplete. |
| UI-34-023 | Dropdown simulation | partial | Variables and authored component variants can model these states, but dedicated control templates and all nested interactive combinations remain incomplete. |
| UI-34-024 | Progress simulation | partial | Variables and authored component variants can model these states, but dedicated control templates and all nested interactive combinations remain incomplete. |
| UI-34-025 | Cart quantity simulation | partial | Variables and authored component variants can model these states, but dedicated control templates and all nested interactive combinations remain incomplete. |
| UI-34-026 | Conditional navigation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-027 | Variable-bound text rendering | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-028 | Variable-bound layer visibility | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-029 | Variable-bound dimensions | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |
| UI-34-030 | Expression validation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Else-if is authored by nesting a conditional in the else branch; expressions use a bounded parser, not eval. |

## Prototype presentation

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-35-001 | Present selected frame | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-002 | Present starting flow | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-003 | Presentation window | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-004 | Full-screen presentation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-005 | Device frame selection | partial | Device presets/orientation size the viewport without an exact physical device shell; fill crops overflow. Root scroll regions work; nested regions/rotated sticky bounds and exact scroll-to duration remain incomplete. |
| UI-35-006 | Device orientation | partial | Device presets/orientation size the viewport without an exact physical device shell; fill crops overflow. Root scroll regions work; nested regions/rotated sticky bounds and exact scroll-to duration remain incomplete. |
| UI-35-007 | Device background | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-008 | Fit-to-screen scale | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-009 | Actual-size preview | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-010 | Fill-screen preview | partial | Device presets/orientation size the viewport without an exact physical device shell; fill crops overflow. Root scroll regions work; nested regions/rotated sticky bounds and exact scroll-to duration remain incomplete. |
| UI-35-011 | Preview hotspot hints | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-012 | Hide hotspot hints | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-013 | Prototype toolbar | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-014 | Previous frame | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-015 | Next frame | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-016 | Restart flow | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-017 | Back navigation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-018 | Open external prototype link | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-019 | Keyboard navigation in preview | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-020 | Presentation frame picker | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-021 | Prototype comments | planned | reference-verification-pending |
| UI-35-022 | Share prototype link | planned | reference-verification-pending |
| UI-35-023 | Embed prototype | planned | reference-verification-pending |
| UI-35-024 | Prototype password | planned | reference-verification-pending |
| UI-35-025 | Prototype access permissions | planned | reference-verification-pending |
| UI-35-026 | Mobile preview | planned | reference-verification-pending |
| UI-35-027 | Fixed-position layers | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-028 | Sticky-position layers | partial | Device presets/orientation size the viewport without an exact physical device shell; fill crops overflow. Root scroll regions work; nested regions/rotated sticky bounds and exact scroll-to duration remain incomplete. |
| UI-35-029 | Horizontal scroll regions | partial | Device presets/orientation size the viewport without an exact physical device shell; fill crops overflow. Root scroll regions work; nested regions/rotated sticky bounds and exact scroll-to duration remain incomplete. |
| UI-35-030 | Vertical scroll regions | partial | Device presets/orientation size the viewport without an exact physical device shell; fill crops overflow. Root scroll regions work; nested regions/rotated sticky bounds and exact scroll-to duration remain incomplete. |
| UI-35-031 | Two-axis scroll regions | partial | Device presets/orientation size the viewport without an exact physical device shell; fill crops overflow. Root scroll regions work; nested regions/rotated sticky bounds and exact scroll-to duration remain incomplete. |
| UI-35-032 | Scroll overflow setting | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |
| UI-35-033 | Scroll-to animation | partial | Device presets/orientation size the viewport without an exact physical device shell; fill crops overflow. Root scroll regions work; nested regions/rotated sticky bounds and exact scroll-to duration remain incomplete. |
| UI-35-034 | Prototype audio playback | planned | reference-verification-pending |
| UI-35-035 | Prototype video playback | planned | reference-verification-pending |
| UI-35-036 | Presentation reduced motion | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. |

## Comments and annotations

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-36-001 | Add canvas comment | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-36-002 | Comment pin position | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-36-003 | Comment author display | planned | reference-verification-pending |
| UI-36-004 | Comment creation timestamp | planned | reference-verification-pending |
| UI-36-005 | Comment text editing | planned | Not implemented in this preview. |
| UI-36-006 | Delete own comment | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-36-007 | Reply to comment | planned | reference-verification-pending |
| UI-36-008 | Mention collaborator | planned | reference-verification-pending |
| UI-36-009 | Resolve comment | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-36-010 | Reopen comment | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-36-011 | Filter unresolved comments | planned | reference-verification-pending |
| UI-36-012 | Filter resolved comments | planned | reference-verification-pending |
| UI-36-013 | Filter comments by author | planned | reference-verification-pending |
| UI-36-014 | Jump to comment | planned | reference-verification-pending |
| UI-36-015 | Comment thread panel | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-36-016 | Comment notification | planned | reference-verification-pending |
| UI-36-017 | Comment link | planned | reference-verification-pending |
| UI-36-018 | Emoji reaction | planned | reference-verification-pending |
| UI-36-019 | Copy comment text | planned | reference-verification-pending |
| UI-36-020 | Comment on prototype | planned | reference-verification-pending |
| UI-36-021 | Comment permissions | planned | reference-verification-pending |
| UI-36-022 | Annotation tool | planned | reference-verification-pending |
| UI-36-023 | Annotation text | planned | reference-verification-pending |
| UI-36-024 | Annotation category | planned | reference-verification-pending |
| UI-36-025 | Annotation categories management | planned | reference-verification-pending |
| UI-36-026 | Annotated property reference | planned | reference-verification-pending |
| UI-36-027 | Measurement annotation | planned | reference-verification-pending |
| UI-36-028 | Distance annotation | planned | reference-verification-pending |
| UI-36-029 | Developer note | planned | reference-verification-pending |
| UI-36-030 | Annotation visibility | planned | reference-verification-pending |

## Collaboration

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-37-001 | Live multiplayer document | planned | reference-verification-pending |
| UI-37-002 | Remote cursor display | planned | reference-verification-pending |
| UI-37-003 | Remote cursor name | planned | reference-verification-pending |
| UI-37-004 | Collaborator avatar | planned | reference-verification-pending |
| UI-37-005 | Collaborator selection outline | planned | reference-verification-pending |
| UI-37-006 | Follow collaborator | planned | reference-verification-pending |
| UI-37-007 | Stop following collaborator | planned | reference-verification-pending |
| UI-37-008 | Multiplayer text editing | planned | reference-verification-pending |
| UI-37-009 | Conflict-free shape editing | planned | reference-verification-pending |
| UI-37-010 | Remote changes propagation | planned | reference-verification-pending |
| UI-37-011 | Presence status | planned | reference-verification-pending |
| UI-37-012 | Join file notification | planned | reference-verification-pending |
| UI-37-013 | Leave file notification | planned | reference-verification-pending |
| UI-37-014 | Audio collaboration | planned | reference-verification-pending |
| UI-37-015 | Audio mute | planned | reference-verification-pending |
| UI-37-016 | Audio captions | planned | reference-verification-pending |
| UI-37-017 | Canvas spotlight | planned | reference-verification-pending |
| UI-37-018 | Observation mode | planned | reference-verification-pending |
| UI-37-019 | Invite by email | planned | reference-verification-pending |
| UI-37-020 | Invite by link | planned | reference-verification-pending |
| UI-37-021 | Viewer permission | planned | reference-verification-pending |
| UI-37-022 | Editor permission | planned | reference-verification-pending |
| UI-37-023 | Owner permission | planned | reference-verification-pending |
| UI-37-024 | Copy collaboration link | planned | reference-verification-pending |
| UI-37-025 | Link access settings | planned | reference-verification-pending |
| UI-37-026 | Remove collaborator | planned | reference-verification-pending |
| UI-37-027 | Request edit access | planned | reference-verification-pending |
| UI-37-028 | Approve edit request | planned | reference-verification-pending |
| UI-37-029 | Reject edit request | planned | reference-verification-pending |
| UI-37-030 | Offline edits queue | planned | reference-verification-pending |
| UI-37-031 | Reconnect synchronization | planned | reference-verification-pending |
| UI-37-032 | Conflict recovery | planned | reference-verification-pending |
| UI-37-033 | Collaborator activity history | planned | reference-verification-pending |
| UI-37-034 | Session recovery | planned | reference-verification-pending |
| UI-37-035 | Shared selection visibility | planned | reference-verification-pending |
| UI-37-036 | Multiplayer undo isolation | planned | reference-verification-pending |

## History and recovery

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-38-001 | Undo object edits | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-002 | Redo object edits | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-003 | Undo layer creation | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-004 | Undo layer deletion | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-005 | Undo page changes | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-006 | Undo grouping | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-007 | Undo property changes | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-008 | Undo layout changes | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-009 | Undo image placement | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-010 | Undo prototype changes | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-011 | Undo comment edits | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-012 | Autosave project | implemented | v0.2.0-dev.2: transactional IndexedDB documents/active pointer and named snapshots; additive migration preserves old localStorage copies. Browser tests cover migration, restoration/undo and a real embedded image larger than the previous storage quota. |
| UI-38-013 | Local recovery snapshot | implemented | v0.2.0-dev.2: transactional IndexedDB documents/active pointer and named snapshots; additive migration preserves old localStorage copies. Browser tests cover migration, restoration/undo and a real embedded image larger than the previous storage quota. |
| UI-38-014 | Recover after crash | partial | Database recovery and named snapshots persist, but undo stacks remain in memory. Abrupt termination before a pending write, browser eviction and arbitrary corrupt-database repair are not fully handled. Save failures are reported with a .oui backup instruction. |
| UI-38-015 | Named version creation | implemented | v0.2.0-dev.2: transactional IndexedDB documents/active pointer and named snapshots; additive migration preserves old localStorage copies. Browser tests cover migration, restoration/undo and a real embedded image larger than the previous storage quota. |
| UI-38-016 | Version history list | implemented | v0.2.0-dev.2: transactional IndexedDB documents/active pointer and named snapshots; additive migration preserves old localStorage copies. Browser tests cover migration, restoration/undo and a real embedded image larger than the previous storage quota. |
| UI-38-017 | Version author | planned | reference-verification-pending |
| UI-38-018 | Version timestamp | implemented | v0.2.0-dev.2: transactional IndexedDB documents/active pointer and named snapshots; additive migration preserves old localStorage copies. Browser tests cover migration, restoration/undo and a real embedded image larger than the previous storage quota. |
| UI-38-019 | Version description | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-020 | Preview older version | planned | reference-verification-pending |
| UI-38-021 | Restore older version | implemented | v0.2.0-dev.2: transactional IndexedDB documents/active pointer and named snapshots; additive migration preserves old localStorage copies. Browser tests cover migration, restoration/undo and a real embedded image larger than the previous storage quota. |
| UI-38-022 | Duplicate version as new file | planned | reference-verification-pending |
| UI-38-023 | Version link | planned | reference-verification-pending |
| UI-38-024 | Compare versions | planned | reference-verification-pending |
| UI-38-025 | Version change summary | planned | reference-verification-pending |
| UI-38-026 | Branch creation | planned | reference-verification-pending |
| UI-38-027 | Branch review | planned | reference-verification-pending |
| UI-38-028 | Branch merge | planned | reference-verification-pending |
| UI-38-029 | Branch conflict resolution | planned | reference-verification-pending |
| UI-38-030 | Branch archive | planned | reference-verification-pending |
| UI-38-031 | Branch status | planned | reference-verification-pending |
| UI-38-032 | Main branch protection | planned | reference-verification-pending |
| UI-38-033 | Edit history persistence | partial | Database recovery and named snapshots persist, but undo stacks remain in memory. Abrupt termination before a pending write, browser eviction and arbitrary corrupt-database repair are not fully handled. Save failures are reported with a .oui backup instruction. |
| UI-38-034 | File corruption recovery | partial | Database recovery and named snapshots persist, but undo stacks remain in memory. Abrupt termination before a pending write, browser eviction and arbitrary corrupt-database repair are not fully handled. Save failures are reported with a .oui backup instruction. |
| UI-38-035 | Backup export | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-38-036 | Storage quota notification | partial | Database recovery and named snapshots persist, but undo stacks remain in memory. Abrupt termination before a pending write, browser eviction and arbitrary corrupt-database repair are not fully handled. Save failures are reported with a .oui backup instruction. |

## Import and Figma interchange

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-39-001 | Open Oanarina project | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-39-002 | Import Figma Bridge project | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-003 | Export Figma Bridge project | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-004 | Install local Figma Bridge plugin | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-005 | Export selected Figma layers through plugin | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-006 | Export current Figma page through plugin | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-007 | Export all Figma pages through plugin | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-008 | Import Oanarina pages into Figma | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-009 | Preserve layer names across bridge | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-010 | Preserve layer hierarchy across bridge | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-011 | Preserve frame size across bridge | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-012 | Preserve basic shapes across bridge | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-013 | Preserve editable text across bridge | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-014 | Preserve solid fills across bridge | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-015 | Preserve strokes across bridge | partial | v0.2: expanded conversion and API mock tests for cubic contours, paint stacks, supported effects, text metadata and layout. No real desktop round-trip yet; rotations, custom gradient transforms, mixed stroke geometry, component linkage and advanced properties have losses/reports. |
| UI-39-016 | Preserve opacity across bridge | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-017 | Preserve corner radii across bridge | partial | v0.2: expanded conversion and API mock tests for cubic contours, paint stacks, supported effects, text metadata and layout. No real desktop round-trip yet; rotations, custom gradient transforms, mixed stroke geometry, component linkage and advanced properties have losses/reports. |
| UI-39-018 | Preserve visibility across bridge | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-019 | Preserve locks across bridge | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-020 | Preserve image assets across bridge | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-021 | Preserve vector paths across bridge | partial | v0.2: expanded conversion and API mock tests for cubic contours, paint stacks, supported effects, text metadata and layout. No real desktop round-trip yet; rotations, custom gradient transforms, mixed stroke geometry, component linkage and advanced properties have losses/reports. |
| UI-39-022 | Preserve font properties across bridge | partial | v0.2: expanded conversion and API mock tests for cubic contours, paint stacks, supported effects, text metadata and layout. No real desktop round-trip yet; rotations, custom gradient transforms, mixed stroke geometry, component linkage and advanced properties have losses/reports. |
| UI-39-023 | Preserve layout metadata across bridge | partial | v0.2: expanded conversion and API mock tests for cubic contours, paint stacks, supported effects, text metadata and layout. No real desktop round-trip yet; rotations, custom gradient transforms, mixed stroke geometry, component linkage and advanced properties have losses/reports. |
| UI-39-024 | Preserve component identity across bridge | planned | reference-verification-pending |
| UI-39-025 | Preserve prototype links across bridge | partial | Supported mouse/delay navigation, overlays, URL/back/scroll actions and standard/cubic transitions transfer through the bridge. Variable/condition/variant behavior and many input triggers are omitted with reports. Real connected API fixture passed; desktop plugin UI round trip remains unverified. |
| UI-39-026 | Unsupported property report | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-027 | Missing font report | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-028 | Transfer validation errors | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-029 | SVG import from Figma | partial | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. SVG import offers validated editable layers with reduction reports or a sanitized visual asset. Paths, common shapes, groups, transforms, supported text/gradients/use and simple clips work. CSS, filters, arbitrary masks/clip paths and full text/paint semantics remain incomplete. |
| UI-39-030 | SVG export for Figma | partial | Limited supported properties; plugin mock tests pass. Real desktop plugin round trip pending. See figma-plugin/README.md. |
| UI-39-031 | Direct binary fig import | planned | reference-verification-pending |
| UI-39-032 | Direct binary fig export | planned | reference-verification-pending |
| UI-39-033 | Sketch document import | planned | reference-verification-pending |
| UI-39-034 | PDF document import | planned | reference-verification-pending |
| UI-39-035 | Clipboard paste from Figma | planned | reference-verification-pending |
| UI-39-036 | Clipboard copy to Figma | planned | reference-verification-pending |
| UI-39-037 | Figma REST JSON import | planned | reference-verification-pending |
| UI-39-038 | Figma API file retrieval | planned | reference-verification-pending |
| UI-39-039 | Figma asset retrieval | planned | reference-verification-pending |
| UI-39-040 | Import progress and cancellation | planned | reference-verification-pending |

## Export and delivery

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-40-001 | Save editable project | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-40-002 | Save project as new file | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-40-003 | Export selection as SVG | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Transformed visual bounds include strokes/effect padding; selected exports preserve ancestor transforms/clips with non-rendering wrappers. |
| UI-40-004 | Export whole page as SVG | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Transformed visual bounds include strokes/effect padding; selected exports preserve ancestor transforms/clips with non-rendering wrappers. |
| UI-40-005 | Export selection as PNG | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Transformed visual bounds include strokes/effect padding; selected exports preserve ancestor transforms/clips with non-rendering wrappers. |
| UI-40-006 | Export selection as JPEG | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Transformed visual bounds include strokes/effect padding; selected exports preserve ancestor transforms/clips with non-rendering wrappers. |
| UI-40-007 | Export PDF | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-40-008 | Export transparent PNG | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-40-009 | Export at one-times scale | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-40-010 | Export at two-times scale | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-40-011 | Export at three-times scale | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-40-012 | Export at four-times scale | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-40-013 | Custom export scale | planned | reference-verification-pending |
| UI-40-014 | Export width constraint | planned | reference-verification-pending |
| UI-40-015 | Export height constraint | planned | reference-verification-pending |
| UI-40-016 | Export suffix | planned | reference-verification-pending |
| UI-40-017 | Multiple export settings | planned | reference-verification-pending |
| UI-40-018 | Per-layer export presets | planned | reference-verification-pending |
| UI-40-019 | Batch export | planned | reference-verification-pending |
| UI-40-020 | Export selected slices | planned | reference-verification-pending |
| UI-40-021 | Export selected frames | planned | reference-verification-pending |
| UI-40-022 | Export filename sanitization | planned | reference-verification-pending |
| UI-40-023 | SVG text as text | planned | reference-verification-pending |
| UI-40-024 | SVG text as outlines | planned | reference-verification-pending |
| UI-40-025 | SVG include layer IDs | planned | reference-verification-pending |
| UI-40-026 | SVG simplify stroke | planned | reference-verification-pending |
| UI-40-027 | SVG outline stroke | planned | reference-verification-pending |
| UI-40-028 | SVG preserve attributes | planned | reference-verification-pending |
| UI-40-029 | JPEG quality | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-40-030 | PNG color profile | planned | reference-verification-pending |
| UI-40-031 | Export hidden layers preference | planned | reference-verification-pending |
| UI-40-032 | Export overlapping contents option | partial | Visual bounds now include rotated/scaled geometry, strokes and effect padding. Clipping intersections use conservative bounding boxes; text glyph overflow, complex groups and slice-specific options need further work. |
| UI-40-033 | Copy SVG markup | planned | reference-verification-pending |
| UI-40-034 | Copy as PNG | planned | reference-verification-pending |
| UI-40-035 | Export preview | planned | reference-verification-pending |
| UI-40-036 | Export bounds warning | partial | Visual bounds now include rotated/scaled geometry, strokes and effect padding. Clipping intersections use conservative bounding boxes; text glyph overflow, complex groups and slice-specific options need further work. |
| UI-40-037 | Export dimensions limit | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-40-038 | Export cancellation | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-40-039 | Export checksum | planned | reference-verification-pending |
| UI-40-040 | Export assets folder | planned | reference-verification-pending |

## Dev Mode and inspection

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-41-001 | Dev Mode workspace | planned | reference-verification-pending |
| UI-41-002 | Layer CSS generation | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-41-003 | Copy CSS | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-41-004 | CSS units selection | planned | reference-verification-pending |
| UI-41-005 | CSS property list | planned | reference-verification-pending |
| UI-41-006 | iOS property inspection | planned | reference-verification-pending |
| UI-41-007 | Android property inspection | planned | reference-verification-pending |
| UI-41-008 | Color code format | planned | reference-verification-pending |
| UI-41-009 | Layer measurements | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-41-010 | Spacing inspection | planned | reference-verification-pending |
| UI-41-011 | Padding inspection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-41-012 | Gap inspection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-41-013 | Typography inspection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-41-014 | Applied style inspection | planned | reference-verification-pending |
| UI-41-015 | Applied variable inspection | planned | reference-verification-pending |
| UI-41-016 | Variable mode inspection | planned | reference-verification-pending |
| UI-41-017 | Alias chain inspection | planned | reference-verification-pending |
| UI-41-018 | Download selected asset | planned | reference-verification-pending |
| UI-41-019 | Automatic icon detection | planned | reference-verification-pending |
| UI-41-020 | Ready-for-development status | planned | reference-verification-pending |
| UI-41-021 | Completed development status | planned | reference-verification-pending |
| UI-41-022 | Handoff section list | planned | reference-verification-pending |
| UI-41-023 | Handoff annotation display | planned | reference-verification-pending |
| UI-41-024 | Developer links | planned | reference-verification-pending |
| UI-41-025 | Attach issue link | planned | reference-verification-pending |
| UI-41-026 | Attach documentation link | planned | reference-verification-pending |
| UI-41-027 | Attach repository link | planned | reference-verification-pending |
| UI-41-028 | Component playground | planned | reference-verification-pending |
| UI-41-029 | Inspect variant properties | planned | reference-verification-pending |
| UI-41-030 | Inspect instance overrides | planned | reference-verification-pending |
| UI-41-031 | Compare design revisions | planned | reference-verification-pending |
| UI-41-032 | Code Connect component mapping | planned | reference-verification-pending |
| UI-41-033 | Code Connect snippets | planned | reference-verification-pending |
| UI-41-034 | Codegen plugin selection | planned | reference-verification-pending |
| UI-41-035 | VS Code integration | planned | reference-verification-pending |
| UI-41-036 | Dev resource management | planned | reference-verification-pending |

## Actions and keyboard

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-42-001 | Search actions by name | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-42-002 | Search actions by keyword | planned | reference-verification-pending |
| UI-42-003 | Search tool names | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-42-004 | Run action from search | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-42-005 | Search library components | planned | reference-verification-pending |
| UI-42-006 | Search plugins | planned | reference-verification-pending |
| UI-42-007 | Search widgets | planned | reference-verification-pending |
| UI-42-008 | Recent actions | planned | reference-verification-pending |
| UI-42-009 | Keyboard action selection | planned | reference-verification-pending |
| UI-42-010 | Action result categories | planned | reference-verification-pending |
| UI-42-011 | Action shortcut labels | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-42-012 | Keyboard shortcut reference | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-42-013 | Used shortcut highlighting | planned | reference-verification-pending |
| UI-42-014 | Shortcut category tabs | planned | reference-verification-pending |
| UI-42-015 | Keyboard layout preference | planned | reference-verification-pending |
| UI-42-016 | Custom shortcut mapping | planned | reference-verification-pending |
| UI-42-017 | Shortcut conflict warning | planned | reference-verification-pending |
| UI-42-018 | Toolbar keyboard focus | planned | reference-verification-pending |
| UI-42-019 | Panel keyboard navigation | planned | reference-verification-pending |
| UI-42-020 | Layer keyboard traversal | planned | reference-verification-pending |
| UI-42-021 | Escape current tool | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-42-022 | Enter object editing | planned | reference-verification-pending |
| UI-42-023 | Tab next object | planned | reference-verification-pending |
| UI-42-024 | Shift-Tab previous object | planned | reference-verification-pending |
| UI-42-025 | Numeric opacity shortcuts | implemented | v0.2: shared 108-command registry drives browser and Mac menus; physical-key modifier matching has tests. ⌘S works with focused inspector controls. This is not full Figma shortcut parity. |
| UI-42-026 | Tool letter shortcuts | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-42-027 | Menu command shortcuts | implemented | v0.2: shared 108-command registry drives browser and Mac menus; physical-key modifier matching has tests. ⌘S works with focused inspector controls. This is not full Figma shortcut parity. |
| UI-42-028 | Command palette shortcut | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-42-029 | Keyboard zoom shortcuts | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-42-030 | Keyboard presentation shortcuts | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |

## Plugins widgets and extensions

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-43-001 | Plugin discovery | planned | reference-verification-pending |
| UI-43-002 | Plugin installation | planned | reference-verification-pending |
| UI-43-003 | Plugin removal | planned | reference-verification-pending |
| UI-43-004 | Plugin launch | planned | reference-verification-pending |
| UI-43-005 | Plugin favorites | planned | reference-verification-pending |
| UI-43-006 | Recent plugins | planned | reference-verification-pending |
| UI-43-007 | Plugin permissions display | planned | reference-verification-pending |
| UI-43-008 | Plugin iframe UI | planned | reference-verification-pending |
| UI-43-009 | Plugin parameter input | planned | reference-verification-pending |
| UI-43-010 | Plugin message bridge | planned | reference-verification-pending |
| UI-43-011 | Plugin document read API | planned | reference-verification-pending |
| UI-43-012 | Plugin document write API | planned | reference-verification-pending |
| UI-43-013 | Plugin node creation | planned | reference-verification-pending |
| UI-43-014 | Plugin selection API | planned | reference-verification-pending |
| UI-43-015 | Plugin font loading | planned | reference-verification-pending |
| UI-43-016 | Plugin image API | planned | reference-verification-pending |
| UI-43-017 | Plugin export API | planned | reference-verification-pending |
| UI-43-018 | Plugin storage | planned | reference-verification-pending |
| UI-43-019 | Plugin networking permissions | planned | reference-verification-pending |
| UI-43-020 | Plugin error isolation | planned | reference-verification-pending |
| UI-43-021 | Plugin cancellation | planned | reference-verification-pending |
| UI-43-022 | Plugin development manifest | planned | reference-verification-pending |
| UI-43-023 | Plugin reload | planned | reference-verification-pending |
| UI-43-024 | Plugin console | planned | reference-verification-pending |
| UI-43-025 | Widget insertion | planned | reference-verification-pending |
| UI-43-026 | Widget state synchronization | planned | reference-verification-pending |
| UI-43-027 | Widget resizing | planned | reference-verification-pending |
| UI-43-028 | Widget interaction | planned | reference-verification-pending |
| UI-43-029 | Widget property menu | planned | reference-verification-pending |
| UI-43-030 | Widget permissions | planned | reference-verification-pending |
| UI-43-031 | Shader discovery and filtering | planned | reference-verification-pending |
| UI-43-032 | Shader source filtering | planned | reference-verification-pending |
| UI-43-033 | Shader code inspection | planned | reference-verification-pending |
| UI-43-034 | Generate shader fill with agent | planned | reference-verification-pending |
| UI-43-035 | Generate shader effect with agent | planned | reference-verification-pending |
| UI-43-036 | Edit shader with agent | planned | reference-verification-pending |
| UI-43-037 | Generative plugin creation with agent | planned | reference-verification-pending |
| UI-43-038 | Generative plugin prompt editing | planned | reference-verification-pending |

## Accessibility and localization

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-44-001 | Accessible button names | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-44-002 | Accessible tool names | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-44-003 | Accessible menu items | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-44-004 | Accessible form labels | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-44-005 | Accessible selection announcements | planned | reference-verification-pending |
| UI-44-006 | Screen-reader document outline | planned | reference-verification-pending |
| UI-44-007 | Keyboard-only layer creation | planned | reference-verification-pending |
| UI-44-008 | Keyboard-only selection | planned | reference-verification-pending |
| UI-44-009 | Keyboard-only transform | planned | reference-verification-pending |
| UI-44-010 | Keyboard-only property editing | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-44-011 | Keyboard-only export | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-44-012 | Visible focus indicators | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-44-013 | Logical focus order | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-44-014 | Focus trapping in dialogs | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-44-015 | Escape closes dialogs | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-44-016 | Contrast compliant controls | planned | reference-verification-pending |
| UI-44-017 | Larger UI scaling | planned | reference-verification-pending |
| UI-44-018 | Reduced motion mode | planned | reference-verification-pending |
| UI-44-019 | Color-independent selection indicators | planned | reference-verification-pending |
| UI-44-020 | High-contrast selection | planned | reference-verification-pending |
| UI-44-021 | Accessible tooltips | planned | reference-verification-pending |
| UI-44-022 | Accessible error announcements | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-44-023 | Accessible comment threads | planned | reference-verification-pending |
| UI-44-024 | English interface | planned | reference-verification-pending |
| UI-44-025 | Romanian interface | planned | reference-verification-pending |
| UI-44-026 | Additional language packs | planned | reference-verification-pending |
| UI-44-027 | Localized menu text | planned | reference-verification-pending |
| UI-44-028 | Localized dates | planned | reference-verification-pending |
| UI-44-029 | Locale number formatting | planned | reference-verification-pending |
| UI-44-030 | Right-to-left UI layout | planned | reference-verification-pending |

## Preferences and document settings

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-45-001 | Light theme | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-45-002 | Dark theme | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-45-003 | Follow system theme | planned | reference-verification-pending |
| UI-45-004 | UI scale preference | planned | reference-verification-pending |
| UI-45-005 | Font preview preference | planned | reference-verification-pending |
| UI-45-006 | Nudge amount preference | planned | reference-verification-pending |
| UI-45-007 | Rotation snapping preference | planned | reference-verification-pending |
| UI-45-008 | Default frame fill | planned | reference-verification-pending |
| UI-45-009 | Default shape fill | planned | reference-verification-pending |
| UI-45-010 | Default stroke color | planned | reference-verification-pending |
| UI-45-011 | Default text style | planned | reference-verification-pending |
| UI-45-012 | Autosave interval | planned | reference-verification-pending |
| UI-45-013 | Recovery retention | planned | reference-verification-pending |
| UI-45-014 | Recent file limit | planned | reference-verification-pending |
| UI-45-015 | Export destination preference | planned | reference-verification-pending |
| UI-45-016 | Export naming preference | planned | reference-verification-pending |
| UI-45-017 | Default export format | planned | reference-verification-pending |
| UI-45-018 | Color picker format preference | planned | reference-verification-pending |
| UI-45-019 | Pixel snapping preference | planned | reference-verification-pending |
| UI-45-020 | Canvas wheel behavior | planned | reference-verification-pending |
| UI-45-021 | Zoom sensitivity | planned | reference-verification-pending |
| UI-45-022 | Trackpad behavior | planned | reference-verification-pending |
| UI-45-023 | Comment notification preference | planned | reference-verification-pending |
| UI-45-024 | Multiplayer cursor preference | planned | reference-verification-pending |
| UI-45-025 | Profile display name | planned | reference-verification-pending |
| UI-45-026 | Profile avatar | planned | reference-verification-pending |
| UI-45-027 | Crash report opt-in | planned | reference-verification-pending |
| UI-45-028 | Usage analytics opt-in | planned | reference-verification-pending |
| UI-45-029 | Reset preferences | planned | reference-verification-pending |
| UI-45-030 | Preferences persistence | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-45-031 | Keep drawing tool selected preference | planned | reference-verification-pending |
| UI-45-032 | Hover highlighting preference | planned | reference-verification-pending |
| UI-45-033 | Rename duplicate layers preference | planned | reference-verification-pending |
| UI-45-034 | Selection dimensions visibility preference | planned | reference-verification-pending |
| UI-45-035 | Hide UI during property changes preference | planned | reference-verification-pending |
| UI-45-036 | Smart quotes and symbols preference | planned | reference-verification-pending |
| UI-45-037 | Flip objects while resizing preference | planned | reference-verification-pending |
| UI-45-038 | Keyboard zoom targets selection preference | planned | reference-verification-pending |
| UI-45-039 | Invert zoom direction preference | planned | reference-verification-pending |
| UI-45-040 | Control-click context menu preference | planned | reference-verification-pending |
| UI-45-041 | Number-key opacity preference | planned | reference-verification-pending |
| UI-45-042 | Legacy outlines rendering preference | planned | reference-verification-pending |
| UI-45-043 | Command-Option rotation preference | planned | reference-verification-pending |
| UI-45-044 | AI audio notification preference | planned | reference-verification-pending |
| UI-45-045 | Open design links in desktop preference | planned | reference-verification-pending |
| UI-45-046 | Show Agents navigation preference | planned | reference-verification-pending |
| UI-45-047 | Scroll wheel zoom preference | planned | reference-verification-pending |
| UI-45-048 | Right-button drag panning preference | planned | reference-verification-pending |
| UI-45-049 | Vector geometry snapping preference | planned | reference-verification-pending |
| UI-45-050 | Object snapping preference | planned | reference-verification-pending |
| UI-45-051 | Helper accessibility settings | planned | reference-verification-pending |
| UI-45-052 | Helper permission settings | planned | reference-verification-pending |

## Teams accounts and administration

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-46-001 | Account sign-in | planned | reference-verification-pending |
| UI-46-002 | Account sign-out | planned | reference-verification-pending |
| UI-46-003 | Account profile | planned | reference-verification-pending |
| UI-46-004 | Account avatar | planned | reference-verification-pending |
| UI-46-005 | Team creation | planned | reference-verification-pending |
| UI-46-006 | Team renaming | planned | reference-verification-pending |
| UI-46-007 | Team deletion | planned | reference-verification-pending |
| UI-46-008 | Team member invitation | planned | reference-verification-pending |
| UI-46-009 | Team member removal | planned | reference-verification-pending |
| UI-46-010 | Team role changes | planned | reference-verification-pending |
| UI-46-011 | Project creation | planned | reference-verification-pending |
| UI-46-012 | Project renaming | planned | reference-verification-pending |
| UI-46-013 | Project archiving | planned | reference-verification-pending |
| UI-46-014 | Project permissions | planned | reference-verification-pending |
| UI-46-015 | Organization creation | planned | reference-verification-pending |
| UI-46-016 | Organization settings | planned | reference-verification-pending |
| UI-46-017 | Workspace switching | planned | reference-verification-pending |
| UI-46-018 | Seat assignment | planned | reference-verification-pending |
| UI-46-019 | Viewer seats | planned | reference-verification-pending |
| UI-46-020 | Developer seats | planned | reference-verification-pending |
| UI-46-021 | Full editor seats | planned | reference-verification-pending |
| UI-46-022 | Billing settings | planned | reference-verification-pending |
| UI-46-023 | Subscription plan display | planned | reference-verification-pending |
| UI-46-024 | Payment history | planned | reference-verification-pending |
| UI-46-025 | Domain verification | planned | reference-verification-pending |
| UI-46-026 | Single sign-on | planned | reference-verification-pending |
| UI-46-027 | SCIM provisioning | planned | reference-verification-pending |
| UI-46-028 | Audit log | planned | reference-verification-pending |
| UI-46-029 | Security policy | planned | reference-verification-pending |
| UI-46-030 | Guest management | planned | reference-verification-pending |
| UI-46-031 | Content ownership transfer | planned | reference-verification-pending |
| UI-46-032 | Export restriction | planned | reference-verification-pending |
| UI-46-033 | Public link restriction | planned | reference-verification-pending |
| UI-46-034 | Data retention policy | planned | reference-verification-pending |
| UI-46-035 | Regional data residency | planned | reference-verification-pending |
| UI-46-036 | Account deletion | planned | reference-verification-pending |

## Community and resources

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-47-001 | Community file browsing | planned | reference-verification-pending |
| UI-47-002 | Community search | planned | reference-verification-pending |
| UI-47-003 | Community category filter | planned | reference-verification-pending |
| UI-47-004 | Community file preview | planned | reference-verification-pending |
| UI-47-005 | Community file duplication | planned | reference-verification-pending |
| UI-47-006 | Community creator profiles | planned | reference-verification-pending |
| UI-47-007 | Community file likes | planned | reference-verification-pending |
| UI-47-008 | Community bookmarks | planned | reference-verification-pending |
| UI-47-009 | Community collections | planned | reference-verification-pending |
| UI-47-010 | Publish community file | planned | reference-verification-pending |
| UI-47-011 | Community file description | planned | reference-verification-pending |
| UI-47-012 | Community cover image | planned | reference-verification-pending |
| UI-47-013 | Community version update | planned | reference-verification-pending |
| UI-47-014 | Community comments | planned | reference-verification-pending |
| UI-47-015 | Community license display | planned | reference-verification-pending |
| UI-47-016 | Report community content | planned | reference-verification-pending |
| UI-47-017 | Template gallery | planned | reference-verification-pending |
| UI-47-018 | Template preview | planned | reference-verification-pending |
| UI-47-019 | Template insertion | planned | reference-verification-pending |
| UI-47-020 | UI kit browsing | planned | reference-verification-pending |
| UI-47-021 | Icon library browsing | planned | reference-verification-pending |
| UI-47-022 | Illustration library browsing | planned | reference-verification-pending |
| UI-47-023 | Education resources | planned | reference-verification-pending |
| UI-47-024 | Tutorial files | planned | reference-verification-pending |
| UI-47-025 | In-app onboarding | planned | reference-verification-pending |
| UI-47-026 | First-run canvas tour | planned | reference-verification-pending |
| UI-47-027 | Tool contextual help | planned | reference-verification-pending |
| UI-47-028 | Help center links | planned | reference-verification-pending |
| UI-47-029 | Release notes panel | planned | reference-verification-pending |
| UI-47-030 | Feedback submission | planned | reference-verification-pending |

## FigJam whiteboarding

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-48-001 | Create whiteboard file | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-002 | Infinite whiteboard | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-003 | Sticky notes | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-004 | Sticky note colors | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-005 | Sticky note text | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-006 | Sticky note author | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-007 | Freehand marker | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-008 | Highlighter | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-009 | Eraser | partial | Whole-stroke eraser, three-shape palette, persisted local timer/voting and ephemeral local laser work. General partial-stroke erasing, full FigJam shapes and shared sessions remain absent. |
| UI-48-010 | Shape palette | partial | Whole-stroke eraser, three-shape palette, persisted local timer/voting and ephemeral local laser work. General partial-stroke erasing, full FigJam shapes and shared sessions remain absent. |
| UI-48-011 | Shape text | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-012 | Straight connector | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-013 | Elbow connector | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-014 | Curved connector | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-015 | Connector arrowheads | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-016 | Connector labels | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-017 | Diagram sections | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-018 | Mind map creation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-019 | Table creation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-020 | Table rows | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-021 | Table columns | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-022 | Table cell editing | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-023 | Timer | partial | Whole-stroke eraser, three-shape palette, persisted local timer/voting and ephemeral local laser work. General partial-stroke erasing, full FigJam shapes and shared sessions remain absent. |
| UI-48-024 | Voting session | partial | Whole-stroke eraser, three-shape palette, persisted local timer/voting and ephemeral local laser work. General partial-stroke erasing, full FigJam shapes and shared sessions remain absent. |
| UI-48-025 | Stamps | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-026 | Emoji reactions | planned | reference-verification-pending |
| UI-48-027 | Cursor chat | planned | reference-verification-pending |
| UI-48-028 | Laser pointer | partial | Whole-stroke eraser, three-shape palette, persisted local timer/voting and ephemeral local laser work. General partial-stroke erasing, full FigJam shapes and shared sessions remain absent. |
| UI-48-029 | Music session | planned | reference-verification-pending |
| UI-48-030 | Templates | planned | reference-verification-pending |
| UI-48-031 | Whiteboard widgets | planned | reference-verification-pending |
| UI-48-032 | Code blocks | planned | reference-verification-pending |
| UI-48-033 | Image placement | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-034 | Link previews | planned | reference-verification-pending |
| UI-48-035 | Whiteboard comments | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |
| UI-48-036 | Whiteboard export | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local board metadata, table/mind-map/connector edits and logical object duplication are validated. |

## Figma Slides presentations

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-49-001 | Create slide deck | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-002 | Slide thumbnail navigation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-003 | Add slide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-004 | Duplicate slide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-005 | Delete slide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-006 | Reorder slides | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-007 | Slide templates | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-008 | Slide themes | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-009 | Title slide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-010 | Section slide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-011 | Image slide | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-012 | Grid slide layout | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-013 | Editable slide text | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-014 | Slide shapes | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-015 | Slide components | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-016 | Slide notes | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-017 | Presenter view | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-018 | Audience view | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-019 | Presentation timer | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-020 | Slide transition | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-021 | Prototype embeds | planned | reference-verification-pending |
| UI-49-022 | Video embeds | planned | reference-verification-pending |
| UI-49-023 | Live polls | planned | reference-verification-pending |
| UI-49-024 | Slide comments | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-025 | Collaborator presentation | planned | reference-verification-pending |
| UI-49-026 | Deck sharing | planned | reference-verification-pending |
| UI-49-027 | Slide export PDF | partial | Working locally generated PDF has one page per visible slide, using rendered 1.5x slide images. Vector/text PDF editability is not implemented. |
| UI-49-028 | Slide export images | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |
| UI-49-029 | PowerPoint interchange | planned | reference-verification-pending |
| UI-49-030 | Slide aspect ratio | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Local notes, editable canvas, scoped clipboard, themes, templates, presenter/audience modes and PNG/ZIP exports; no cloud presenting. |

## Figma Sites publishing

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-50-001 | Create site project | planned | reference-verification-pending |
| UI-50-002 | Site page tree | planned | reference-verification-pending |
| UI-50-003 | Site navigation links | planned | reference-verification-pending |
| UI-50-004 | Responsive breakpoint editor | planned | reference-verification-pending |
| UI-50-005 | Desktop breakpoint | planned | reference-verification-pending |
| UI-50-006 | Tablet breakpoint | planned | reference-verification-pending |
| UI-50-007 | Mobile breakpoint | planned | reference-verification-pending |
| UI-50-008 | Breakpoint property overrides | planned | reference-verification-pending |
| UI-50-009 | Responsive stack | planned | reference-verification-pending |
| UI-50-010 | Responsive grid | planned | reference-verification-pending |
| UI-50-011 | Site interactions | planned | reference-verification-pending |
| UI-50-012 | Hover effects | planned | reference-verification-pending |
| UI-50-013 | Scroll effects | planned | reference-verification-pending |
| UI-50-014 | Site animations | planned | reference-verification-pending |
| UI-50-015 | CMS collection | planned | reference-verification-pending |
| UI-50-016 | CMS item editor | planned | reference-verification-pending |
| UI-50-017 | CMS binding | planned | reference-verification-pending |
| UI-50-018 | Published preview | planned | reference-verification-pending |
| UI-50-019 | Staging preview | planned | reference-verification-pending |
| UI-50-020 | Publish website | planned | reference-verification-pending |
| UI-50-021 | Unpublish website | planned | reference-verification-pending |
| UI-50-022 | Custom domain | planned | reference-verification-pending |
| UI-50-023 | Site title metadata | planned | reference-verification-pending |
| UI-50-024 | Site description metadata | planned | reference-verification-pending |
| UI-50-025 | Open Graph image | planned | reference-verification-pending |
| UI-50-026 | Favicon | planned | reference-verification-pending |
| UI-50-027 | Site accessibility settings | planned | reference-verification-pending |
| UI-50-028 | Site form | planned | reference-verification-pending |
| UI-50-029 | Site embed | planned | reference-verification-pending |
| UI-50-030 | Site analytics | planned | reference-verification-pending |

## Figma Buzz assets

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-51-001 | Create branded asset project | planned | reference-verification-pending |
| UI-51-002 | Brand template gallery | planned | reference-verification-pending |
| UI-51-003 | Template locking | planned | reference-verification-pending |
| UI-51-004 | Editable content slots | planned | reference-verification-pending |
| UI-51-005 | Editable image slots | planned | reference-verification-pending |
| UI-51-006 | Brand color constraints | planned | reference-verification-pending |
| UI-51-007 | Brand font constraints | planned | reference-verification-pending |
| UI-51-008 | Bulk text replacement | planned | reference-verification-pending |
| UI-51-009 | Bulk image replacement | planned | reference-verification-pending |
| UI-51-010 | Asset spreadsheet input | planned | reference-verification-pending |
| UI-51-011 | Social size presets | planned | reference-verification-pending |
| UI-51-012 | Marketing batch variations | planned | reference-verification-pending |
| UI-51-013 | Asset approval workflow | planned | reference-verification-pending |
| UI-51-014 | Asset version history | planned | reference-verification-pending |
| UI-51-015 | Bulk asset export | planned | reference-verification-pending |
| UI-51-016 | Campaign asset folders | planned | reference-verification-pending |
| UI-51-017 | Shared brand library | planned | reference-verification-pending |
| UI-51-018 | Template duplication | planned | reference-verification-pending |
| UI-51-019 | Template publishing | planned | reference-verification-pending |
| UI-51-020 | Brand asset search | planned | reference-verification-pending |

## Figma Make and AI workflows

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-52-001 | Generate interface from prompt | planned | reference-verification-pending |
| UI-52-002 | Edit generated interface by prompt | planned | reference-verification-pending |
| UI-52-003 | Attach design reference | planned | reference-verification-pending |
| UI-52-004 | Attach selected frame context | planned | reference-verification-pending |
| UI-52-005 | Inspect generated code | planned | reference-verification-pending |
| UI-52-006 | Edit generated code | planned | reference-verification-pending |
| UI-52-007 | Run generated preview | planned | reference-verification-pending |
| UI-52-008 | Preview responsive layout | planned | reference-verification-pending |
| UI-52-009 | Revert generated edit | planned | reference-verification-pending |
| UI-52-010 | Version generated project | planned | reference-verification-pending |
| UI-52-011 | Generated application publishing | planned | reference-verification-pending |
| UI-52-012 | Data source connection | planned | reference-verification-pending |
| UI-52-013 | Generated app environment variables | planned | reference-verification-pending |
| UI-52-014 | Generate image | planned | reference-verification-pending |
| UI-52-015 | Edit image with prompt | planned | reference-verification-pending |
| UI-52-016 | Remove image background | planned | reference-verification-pending |
| UI-52-017 | Replace image content | planned | reference-verification-pending |
| UI-52-018 | Generate text alternatives | planned | reference-verification-pending |
| UI-52-019 | Rewrite selected text | planned | reference-verification-pending |
| UI-52-020 | Translate selected text | planned | reference-verification-pending |
| UI-52-021 | Rename layers automatically | planned | reference-verification-pending |
| UI-52-022 | Search assets semantically | planned | reference-verification-pending |
| UI-52-023 | Find similar designs | planned | reference-verification-pending |
| UI-52-024 | Suggest layout structure | planned | reference-verification-pending |
| UI-52-025 | Generate prototype interactions | planned | reference-verification-pending |
| UI-52-026 | Prompt history | planned | reference-verification-pending |
| UI-52-027 | AI action cancellation | planned | reference-verification-pending |
| UI-52-028 | AI usage display | planned | reference-verification-pending |
| UI-52-029 | AI output feedback | planned | reference-verification-pending |
| UI-52-030 | AI data sharing controls | planned | reference-verification-pending |

## Performance and reliability

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-53-001 | Large document loading | partial | A real multi-megabyte image recovery test passes. Animation export reports progress and supports cancellation, with 1,800-frame / 4,096-edge / 8-megapixel limits. Large-tree virtualization and comprehensive performance work remain. |
| UI-53-002 | Progressive page loading | planned | reference-verification-pending |
| UI-53-003 | Viewport culling | planned | reference-verification-pending |
| UI-53-004 | Large layer tree virtualization | planned | reference-verification-pending |
| UI-53-005 | Image decode scheduling | planned | reference-verification-pending |
| UI-53-006 | Font loading status | planned | reference-verification-pending |
| UI-53-007 | Asset cache management | planned | reference-verification-pending |
| UI-53-008 | Document write atomicity | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Recovery writes document and active reference in one IndexedDB transaction. Explicit native saves remain atomic. |
| UI-53-009 | Import cancellation | planned | reference-verification-pending |
| UI-53-010 | Long operation progress | partial | A real multi-megabyte image recovery test passes. Animation export reports progress and supports cancellation, with 1,800-frame / 4,096-edge / 8-megapixel limits. Large-tree virtualization and comprehensive performance work remain. |
| UI-53-011 | Corrupt import reporting | planned | reference-verification-pending |
| UI-53-012 | Unsupported version reporting | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-53-013 | Document schema migration | implemented | v0.2: validates version 1/2, migrates v1 to v2, rejects unsupported versions; core and bridge mock coverage. |
| UI-53-014 | Duplicate ID detection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-53-015 | Cycle detection in hierarchy | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-53-016 | Missing parent detection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-53-017 | Invalid numeric value detection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-53-018 | Image size limits | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-53-019 | Export memory limits | partial | A real multi-megabyte image recovery test passes. Animation export reports progress and supports cancellation, with 1,800-frame / 4,096-edge / 8-megapixel limits. Large-tree virtualization and comprehensive performance work remain. |
| UI-53-020 | Local disk error handling | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-53-021 | Autosave failure reporting | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Recovery writes document and active reference in one IndexedDB transaction. Explicit native saves remain atomic. |
| UI-53-022 | Recoverable operation failure | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-53-023 | Renderer crash recovery | planned | reference-verification-pending |
| UI-53-024 | Safe mode startup | planned | reference-verification-pending |
| UI-53-025 | Offline resource availability | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-53-026 | Missing asset placeholders | planned | reference-verification-pending |
| UI-53-027 | Undo history memory bound | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-53-028 | Background save scheduling | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Recovery writes document and active reference in one IndexedDB transaction. Explicit native saves remain atomic. |
| UI-53-029 | Multi-window file conflict detection | planned | reference-verification-pending |
| UI-53-030 | Consistent document serialization | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Recovery writes document and active reference in one IndexedDB transaction. Explicit native saves remain atomic. |

## Oanarina improvements after parity

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-54-001 | Searchable parity feature register | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-54-002 | Per-feature implementation status | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-54-003 | Per-feature evidence links | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-54-004 | Per-feature verification notes | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-54-005 | Transfer compatibility report | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-54-006 | Offline-first project library | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-54-007 | Local project thumbnails | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-54-008 | Named local snapshots | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-54-009 | No-account editing workflow | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-54-010 | Design health report | planned | reference-verification-pending |
| UI-54-011 | Accessibility contrast audit | planned | reference-verification-pending |
| UI-54-012 | Missing font audit | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Family audit includes character-range font families. |
| UI-54-013 | Unused style audit | planned | reference-verification-pending |
| UI-54-014 | Detached instance audit | planned | reference-verification-pending |
| UI-54-015 | Duplicate color audit | planned | reference-verification-pending |
| UI-54-016 | Token consistency audit | planned | reference-verification-pending |
| UI-54-017 | Batch rename preview | planned | reference-verification-pending |
| UI-54-018 | Multi-format export queue | planned | reference-verification-pending |
| UI-54-019 | Document minimap navigation | planned | reference-verification-pending |
| UI-54-020 | Command usage learning | planned | reference-verification-pending |
| UI-54-021 | Custom workspace layouts | planned | reference-verification-pending |
| UI-54-022 | Side-by-side device preview | planned | reference-verification-pending |
| UI-54-023 | Design-to-code export presets | planned | reference-verification-pending |
| UI-54-024 | Cross-tool color palette exchange | planned | reference-verification-pending |
| UI-54-025 | Reusable personal starter kits | planned | reference-verification-pending |
| UI-54-026 | One-click bug report bundle | planned | reference-verification-pending |
| UI-54-027 | Local automation API | planned | reference-verification-pending |
| UI-54-028 | Scriptable batch transforms | planned | reference-verification-pending |
| UI-54-029 | Privacy dashboard | planned | reference-verification-pending |
| UI-54-030 | Windows portability layer | planned | reference-verification-pending |

## Google and installed font library

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-55-001 | Full Google Fonts family catalog | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-002 | Font family name search | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-003 | Font category filter | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-004 | Font popularity ordering | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-005 | Alphabetical font ordering | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-006 | Bundled offline font filter | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-007 | Custom font specimen text | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-008 | Font specimen preview | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-009 | Download font on demand | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-010 | Persistent downloaded font cache | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-011 | Apply font to text selection | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-012 | Google font weight metadata | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-013 | Google font script metadata | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-014 | Font designer attribution | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-015 | Variable font weight downloading | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-55-016 | Per-font license attribution | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-017 | Bundled popular font families | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-018 | Installed Mac font discovery | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-019 | Installed Mac font application | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-020 | Embed downloaded fonts in project | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-55-021 | Reload embedded project fonts | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-022 | Embed available fonts in SVG | partial | Working basic path with limits; see docs/IMPLEMENTATION.md. Full reference behavior remains incomplete. |
| UI-55-023 | Font download progress | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-024 | Font download error handling | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-025 | Font family fallback | implemented | Working preview path; validated by core/browser tests or native smoke. Exact reference parity still needs per-feature audit. |
| UI-55-026 | Google catalog refresh command | planned | Catalog refresh is a maintainer script with an explicit snapshot path; a user-facing live refresh command is not implemented. |
| UI-55-027 | Font language filter | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. True italic faces, language filtering, Google favorites, local TTF/OTF import/export and family audit. Embedding restrictions are honored; unsupported font formats are rejected. |
| UI-55-028 | Font favorites | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. True italic faces, language filtering, Google favorites, local TTF/OTF import/export and family audit. Embedding restrictions are honored; unsupported font formats are rejected. |
| UI-55-029 | Font italic styles | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. True italic faces, language filtering, Google favorites, local TTF/OTF import/export and family audit. Embedding restrictions are honored; unsupported font formats are rejected. |
| UI-55-030 | Local font file import | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. True italic faces, language filtering, Google favorites, local TTF/OTF import/export and family audit. Embedding restrictions are honored; unsupported font formats are rejected. |
| UI-55-031 | Local font file export | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. True italic faces, language filtering, Google favorites, local TTF/OTF import/export and family audit. Embedding restrictions are honored; unsupported font formats are rejected. |
| UI-55-032 | Missing font audit | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. True italic faces, language filtering, Google favorites, local TTF/OTF import/export and family audit. Embedding restrictions are honored; unsupported font formats are rejected. |

## Motion workspace and timeline

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-56-001 | Motion mode switch | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-002 | Motion inspector tab | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-56-003 | Keyframe timeline panel | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-004 | Expand timeline | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-005 | Collapse timeline | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-006 | Resize timeline panel | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-007 | Timeline tracks | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-008 | Track names | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-009 | Track expansion | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-010 | Track collapse | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-011 | Track selection | partial | Track selection currently selects its layer. Bezier values are edited numerically; a curve graph remains planned. Canvas frame preview works; fullscreen prototype integration is incomplete. MediaRecorder export is codec dependent: WebM is encoded and decoded in Chromium; Mac MP4 requires native end-to-end validation. |
| UI-56-012 | Track visibility | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-013 | Current-time control | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-014 | Duration control | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-015 | Timeline time format | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-016 | Timeline loop toggle | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-017 | Play timeline | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-018 | Pause timeline | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-019 | Restart timeline | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-020 | Scrub playhead | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-021 | Timeline zoom in | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-022 | Timeline zoom out | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-023 | Pinch timeline zoom | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-56-024 | Timeline horizontal scroll | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-025 | Timeline vertical scroll | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-026 | Space-drag timeline navigation | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-56-027 | Add keyframe by double click | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-028 | Select keyframe | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-029 | Multi-select keyframes | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-030 | Marquee keyframes | planned | reference-verification-pending |
| UI-56-031 | Move keyframe | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-032 | Delete keyframe | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-033 | Duplicate keyframe | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-034 | Copy keyframe | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-035 | Paste keyframe | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-036 | Auto-keyframing toggle | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-037 | Position animation track | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-038 | Size animation track | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-039 | Rotation animation track | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-040 | Opacity animation track | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-041 | Fill animation track | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-042 | Corner-radius animation track | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-043 | Scale animation track | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-044 | Text animation track | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-045 | Keyframe easing | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-046 | Keyframe bezier editor | partial | Track selection currently selects its layer. Bezier values are edited numerically; a curve graph remains planned. Canvas frame preview works; fullscreen prototype integration is incomplete. MediaRecorder export is codec dependent: WebM is encoded and decoded in Chromium; Mac MP4 requires native end-to-end validation. |
| UI-56-047 | Animation style creation | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-048 | Animation style application | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-049 | Animation style management | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-050 | Frame animation preview | partial | Track selection currently selects its layer. Bezier values are edited numerically; a curve graph remains planned. Canvas frame preview works; fullscreen prototype integration is incomplete. MediaRecorder export is codec dependent: WebM is encoded and decoded in Chromium; Mac MP4 requires native end-to-end validation. |
| UI-56-051 | Top-level animated frame detection | planned | reference-verification-pending |
| UI-56-052 | Export animation MP4 | partial | Track selection currently selects its layer. Bezier values are edited numerically; a curve graph remains planned. Canvas frame preview works; fullscreen prototype integration is incomplete. MediaRecorder export is codec dependent: WebM is encoded and decoded in Chromium; Mac MP4 requires native end-to-end validation. |
| UI-56-053 | Export animation GIF | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-054 | Export animation WebM | partial | Track selection currently selects its layer. Bezier values are edited numerically; a curve graph remains planned. Canvas frame preview works; fullscreen prototype integration is incomplete. MediaRecorder export is codec dependent: WebM is encoded and decoded in Chromium; Mac MP4 requires native end-to-end validation. |
| UI-56-055 | Animation frame-rate setting | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-056 | Animation quality setting | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-057 | Animation export duration | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-058 | Animation loop export | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-059 | Motion reduced-motion behavior | planned | reference-verification-pending |
| UI-56-060 | Animated property reset | implemented | v0.2.0-dev.2: reachable UI, version-two project persistence, validation and undo; core/browser checks in docs/VALIDATION-v0.2-systems-motion.md. Reference acceptance remains separately pending. Real sampled artwork, cubic-bezier/standard/spring easing and text holds. GIF frame structure and browser decoding are tested. Canvas move/resize and inspector autokeys keep base artwork separate. |
| UI-56-061 | Animated shader preview | planned | reference-verification-pending |
| UI-56-062 | Interactive shader preview | planned | reference-verification-pending |
| UI-56-063 | Shader parameter keyframes | planned | reference-verification-pending |

## Agents and code workspace

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-57-001 | Agents navigation panel | planned | reference-verification-pending |
| UI-57-002 | Agent connection picker | planned | reference-verification-pending |
| UI-57-003 | Agent availability indicator | planned | reference-verification-pending |
| UI-57-004 | Agent task prompt | planned | reference-verification-pending |
| UI-57-005 | Agent design context | planned | reference-verification-pending |
| UI-57-006 | Agent selection context | planned | reference-verification-pending |
| UI-57-007 | Agent change review | planned | reference-verification-pending |
| UI-57-008 | Accept agent edit | planned | reference-verification-pending |
| UI-57-009 | Reject agent edit | planned | reference-verification-pending |
| UI-57-010 | Agent activity log | planned | reference-verification-pending |
| UI-57-011 | Agent conversation history | planned | reference-verification-pending |
| UI-57-012 | Agent cancellation | planned | reference-verification-pending |
| UI-57-013 | Agent permissions display | planned | reference-verification-pending |
| UI-57-014 | Agent design tool access | planned | reference-verification-pending |
| UI-57-015 | Code tool in toolbar | planned | reference-verification-pending |
| UI-57-016 | Code block placement | planned | reference-verification-pending |
| UI-57-017 | Runnable code layer | planned | reference-verification-pending |
| UI-57-018 | Code layer property controls | planned | reference-verification-pending |
| UI-57-019 | Code layer preview | planned | reference-verification-pending |
| UI-57-020 | Code layer source editing | planned | reference-verification-pending |
| UI-57-021 | On-canvas agent prompt | planned | reference-verification-pending |
| UI-57-022 | Agent prompt voice dictation | planned | reference-verification-pending |
| UI-57-023 | Agent file and image attachments | planned | reference-verification-pending |
| UI-57-024 | Agent library context | planned | reference-verification-pending |
| UI-57-025 | Design-system mentions in agent prompts | planned | reference-verification-pending |
| UI-57-026 | Parallel agent prompts | planned | reference-verification-pending |
| UI-57-027 | Agent chat visibility controls | planned | reference-verification-pending |
| UI-57-028 | Undo an agent change | planned | reference-verification-pending |
| UI-57-029 | Detached desktop agent window | planned | reference-verification-pending |
| UI-57-030 | Agent MCP connector context | planned | reference-verification-pending |
| UI-57-031 | Reusable agent skills | planned | reference-verification-pending |
| UI-57-032 | Agent web search | planned | reference-verification-pending |
| UI-57-033 | Agent comment review | planned | reference-verification-pending |
| UI-57-034 | Agent design critique | planned | reference-verification-pending |
| UI-57-035 | Agent raster-to-vector conversion | planned | reference-verification-pending |

## Live interface verification additions

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-58-001 | Vertical navigation rail | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-002 | File navigation rail entry | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-003 | Agents navigation rail entry | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-004 | Assets navigation rail entry | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-005 | Tools navigation rail entry | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-006 | Variables navigation rail entry | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-007 | Toolbelt mode selector | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-008 | Text tool dropdown | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-009 | Dedicated Text main menu | implemented | v0.2: separate browser/native Text and Vector menus, generated from shared commands. Exact menu contents remain incomplete. |
| UI-58-010 | Dedicated Vector main menu | implemented | v0.2: separate browser/native Text and Vector menus, generated from shared commands. Exact menu contents remain incomplete. |
| UI-58-011 | File-browser shared files tab | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-012 | File-browser shared folders tab | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-013 | File-browser AI prompt area | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-014 | Missing fonts button | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Missing-font badge opens the document audit. |
| UI-58-015 | Prototype view dropdown | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-016 | Multiplayer tools dropdown | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-017 | Frame preset archive | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-018 | Foldable device closed preset | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-019 | Foldable device open preset | planned | observed-in-signed-in-Figma-2026-10-29 |
| UI-58-020 | Motion timeline accessibility summary | planned | observed-in-signed-in-Figma-2026-10-29 |

## Free local MCP integration

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-59-001 | Local stdio MCP server | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-002 | No-account MCP startup | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-003 | No API key requirement for local MCP | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-004 | No server usage charge or subscription | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-005 | Explicit selected-project scope | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-006 | Discoverable MCP tool schemas | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-007 | Project summary resource | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-008 | Inspect project metadata and revision | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-009 | Search and paginate project nodes | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-010 | Read complete saved document | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-011 | Read local design system through MCP | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-012 | Atomic document operation batches | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-013 | Validated complete document replacement | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-014 | Undo MCP transaction | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-015 | Validate selected project through MCP | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-016 | Export vector SVG through MCP | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-017 | SHA-256 revision preconditions | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-018 | Reject stale MCP writes | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-019 | Shared editor and MCP document validators | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-020 | Validate operations before mutation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-021 | Atomic temporary-file commit | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-022 | Exclusive per-project writer lock | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-023 | Reject project-file symlinks | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-024 | Canonicalize project parent directories | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-025 | Bound MCP inputs and responses | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-026 | Reject arbitrary filesystem paths in tools | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-027 | No shell or script evaluation | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-028 | No network listener for local server | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-029 | Propagate component and variable edits through MCP | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-030 | Offline saved-file MCP editing | implemented | v0.2.0-dev.3: reachable authoring/playback path, undo/persistence and validation where applicable. Core/browser/native evidence and limits: docs/VALIDATION-v0.2-prototypes-workspaces.md. Reference acceptance remains separate. Saved-file stdio server, nine tools, SDK client integration and standalone bundle checked. Vector-only SVG rejects raster/image dependencies and headless text measurement is approximate. |
| UI-59-031 | Live editor document synchronization | planned | reference-verification-pending |
| UI-59-032 | Live editor selection access | planned | reference-verification-pending |
| UI-59-033 | Live editor screenshot capture | planned | reference-verification-pending |
| UI-59-034 | MCP raster artwork export | planned | reference-verification-pending |
| UI-59-035 | MCP image asset import | planned | reference-verification-pending |
| UI-59-036 | MCP installed-font query | planned | reference-verification-pending |
| UI-59-037 | Coordinate native editor and MCP writers | partial | MCP writers coordinate with an exclusive project lock; the native editor does not yet participate. Avoid editing the same file concurrently. |
| UI-59-038 | Durable MCP undo history | partial | Last twenty transaction snapshots support undo in the running server; they are not persisted across restarts. |

## Layer masks

| ID | Required behavior | Status | Verification / limits |
| --- | --- | --- | --- |
| UI-60-001 | Use layer as mask | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-002 | Group selected layers into mask object | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-003 | Alpha mask mode | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-004 | Vector mask mode | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-005 | Luminance mask mode | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-006 | Change mask mode | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-007 | Release layer mask | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-008 | Select mask source | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-009 | Sibling stacking mask scope | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-010 | Stop mask scope at next mask | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-011 | Nested mask objects | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-012 | Use text as mask | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-013 | Use group as mask | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-014 | Image transparency masks | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-015 | Gradient transparency masks | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-016 | Stroke region masks | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-017 | Blur feathering masks | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-018 | Independent mask and artwork movement | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-019 | Independent mask and artwork resizing | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-020 | Add layers to mask object | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-021 | Mask source artwork consumption | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-022 | Mask keyboard shortcut | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-023 | Mask outlines view | planned | Mask outlines view, tree mask/target indicators and hover mode previews remain absent. |
| UI-60-024 | Mask layer and target indicators | planned | Mask outlines view, tree mask/target indicators and hover mode previews remain absent. |
| UI-60-025 | Preview mask modes on hover | planned | Mask outlines view, tree mask/target indicators and hover mode previews remain absent. |
| UI-60-026 | Preserve masks in SVG export | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |
| UI-60-027 | Render masks in raster export | implemented | v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate. Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified. |

## Reference starting points

- [toolbar](https://help.figma.com/hc/en-us/articles/360041064174-Access-design-tools-from-the-toolbar)
- [overview](https://help.figma.com/hc/en-us/articles/15297425105303-Explore-design-files)
- [sidebar](https://help.figma.com/hc/en-us/articles/360039831974-Explore-the-navigation-bar-and-left-sidebar)
- [keyboard](https://help.figma.com/hc/en-us/articles/360040328653-Use-Figma-products-with-a-keyboard)
- [layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout-in-Figma)
- [grid](https://help.figma.com/hc/en-us/articles/31289469907863-Use-the-grid-auto-layout-flow)
- [masks](https://help.figma.com/hc/en-us/articles/360040450253-Masks)
- [guides](https://help.figma.com/hc/en-us/articles/360040450513-Create-layout-guides)
- [draw](https://www.figma.com/draw/)
- [dev](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode-in-Figma)
- [proto](https://help.figma.com/hc/en-us/articles/14506587589399-Use-variables-in-prototypes)
- [plugin](https://developers.figma.com/docs/plugins/)
