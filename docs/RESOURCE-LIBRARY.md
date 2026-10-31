# Bundled resource library

Resources → UI kits, illustrations and tutorials… opens original Forma content that is installed with the app. It works offline and makes no requests. There is no community, publishing or download behind it. All of it is released under the repository's MIT license.

| Tab | Contents | Actions |
| --- | --- | --- |
| UI kits | Core controls and Mobile parts, built from real main components, with one variant set | Open as new file, or insert on this page in one Undo |
| Illustrations | Eight small vector scenes | Insert on this page as editable vectors in one Undo |
| Tutorials | Your first prototype, Variables and conditions, Components and variants | Open as new file |
| Guides | Six short articles on hierarchy, spacing, color, prototyping, components and accessibility | Read, and open a related tutorial where one exists |

Search filters by name and description. Browsing and previewing do not edit the current file.

Kits and tutorials reuse the template gallery's validated path, so they are real independent `.oui` documents. Insertion remaps identities through the clipboard transfer planner. Illustrations go through the editable SVG importer and are refused if conversion is not complete.

Tutorials are ordinary files. Their instructions sit on the frames, and their buttons, overlays, variables, conditions and variant changes are real prototype interactions you can inspect and edit.

## Limits

- Kits use Inter by name, so text follows whatever Inter is available.
- Kit components are not listed in Actions component search until inserted into a file.
- Tutorials are read at your own pace. Nothing checks whether a step was completed.
- Content is English, and guides are not translated.

## Validation

`tests/resource-library.test.ts` validates every document, size bounds, component insertion, illustration conversion and the tutorial interactions through the real action engine. `tests/e2e/resource-library.spec.ts` covers browsing without mutation or outside requests, one-Undo insertion and opening a tutorial and playing it. That browser check found a real defect the headless test could not see: button labels drawn above their buttons swallowed clicks.
