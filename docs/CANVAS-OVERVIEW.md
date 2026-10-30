# Canvas scrollbars and overview

View → Show canvas scrollbars and View → Show overview minimap enable independent local navigation controls. Both commands also appear in Actions. They default to hidden and persist in the device-local preferences envelope. Existing preference values migrate without resetting other settings. Neither preference is saved in a project or exported artwork.

The scrollbars support track clicks, thumb dragging, arrow keys, Page Up/Down and Home/End. Arrow steps represent 24 screen pixels; Shift-arrows move 80% of the viewport. Cross-axis arrows cannot nudge selected artwork. The schematic overview supports click-to-center, dragging the visible viewport, arrows, page keys and Home to center artwork (or the origin on an empty page). Existing global Previous/Next viewport shortcuts work while these controls are focused.

The overview shows axis-aligned outlines of visible layers and the current viewport. It uses the same sampled motion nodes as Canvas, accounts for inherited transforms and hidden ancestors, intersects ancestor clipping bounds, and excludes boolean operands and non-artwork group/slice records. It is a schematic navigation aid: it does not reproduce imagery, text shaping, stroke/effect expansion, precise rotated clipping or mask pixels.

Geometry traversal is iterative and bounded to the existing 20,000-layer page limit. It does not recursively walk deep parent chains or search the entire page for every parent. At most 1,500 outlines are drawn; additional valid layer bounds still contribute to navigation extents. Truncated input, invalid/cyclic/duplicate records, nonfinite transforms and transformed geometry beyond ±10,000,000 world units are skipped or reported. No large spread operation depends on document layer count.

Scroll ranges include padded artwork and the currently visible canvas. Empty pages have an origin-centered workspace spanning three viewport widths/heights. The camera retains the editor's 5–800% zoom and ±10,000,000 pan-offset bounds. A far-away valid viewport remains navigable at minimum zoom; controls produce finite, bounded cameras. Drag projection and ranges freeze at pointer-down so changing the viewport cannot shift the mapping under the pointer.

Dragging previews the camera live and commits one viewport-history destination at release. Escape, pointer cancellation/lost capture, window blur, viewport resize, hiding a navigator, page/document changes, same-ID file reopening, modal transitions and motion scrubbing cancel the gesture. A newer camera command supersedes it; an old gesture cannot subsequently restore its former camera. Canceled previews restore the original page-camera cache. Navigation never edits the document, adds artwork undo steps, changes its timestamp or marks the native document dirty.

## Validation

Synthetic fixtures cover transformed/hidden/clipped artwork, motion sampling, reverse-ordered 20,000-deep hierarchies, bounded outline rendering, cycles/duplicate IDs/invalid values, extreme camera centers, scrollbar endpoints and camera transaction lifecycle. Production browser checks exercise both View/Actions paths, local persistence, pointer and keyboard navigation, focused global shortcuts, document/undo/native dirty isolation, page/reopen/zoom interruption and all cancel paths.

The full core suite passed 684 tests across 68 files, and the production build passed. Twenty focused production browser cases passed across navigator, viewport-history, remembered-page-camera and preferences suites before the final navigator-visibility cancellation regression. The final navigator suite passed all seven cases after that fix; an eighth responsive-layout case passed separately. Synthetic desktop and narrow-layout screenshots were visually inspected. Twenty-two distinct production browser cases passed across the validation runs.

No private project fixture, user screenshot, native IPC permission or document-format field was added. Figma reference verification remains pending. These features do not imply complete Figma parity.
