# Stretch brushes and the Draw toolbar

These are bounded Forma workflows, not Figma Draw brush-format compatibility. Reference verification is separate.

## Stretch brushes (UI-16-037)

Select one eligible closed vector, open **Reusable vector brush → Sample vector as brush**, tick **Stretch along the stroke**, review and save. An existing sampled brush can be switched with the same checkbox in Brush controls. Source eligibility is the [sampling subset](VECTOR-SCATTER-BRUSH.md).

A stroke produces one group holding one ordinary filled path. The art's 0–100 horizontal basis maps to the whole stroke length, and its vertical basis maps across a band of **Brush size × aspect**. There is no document metadata or `.oui` change: older readers see an ordinary path, and it edits, saves and exports like any other. Art corners stay corners, art edges bend with the stroke, and holes and the winding rule are kept. The brush color tints the silhouette and brush opacity applies to the one path.

The spine is a Catmull-Rom curve through the pointer samples, after dropping samples closer than 2 units so that slow mouse input does not read as facets. Normals use a window-averaged tangent. Each source segment is subdivided by how much of the stroke it spans, and handles come from the chain rule through the warp, so warped cubics are a bounded approximation of the true warp.

Pressure scales thickness when **Size follows pressure** is on. Opacity pressure does not apply, because one path has one opacity, and that control is disabled. Spacing, direction, angle and scatter do not apply and are hidden; a preset cannot hold both stretch and scatter.

A tap or a stroke under 1 unit places the art at its natural proportions along the stroke direction, or along +X for a pure tap. This also keeps the first sample of a drag valid.

Limits: 1,024 pointer samples, 8,192 anchors and 1 MB of path data, with the same draft cancellation as other brushes. Density drops rather than failing on dense art, down to one piece per source segment. A turn tighter than half the band folds the inner edge, and overlapping folds can show small nonzero or even-odd gaps. There is no tiling, no fixed-length end caps and no continuous warp of paints.

Local presets stay `forma-brush-presets` version 1 with one additive optional `stretch` field. Older preset readers refuse that field; `.oui` files are unaffected.

## Draw toolbar (UI-16-034)

In Draw mode the toolbar adds two menus after the shape and text tools.

- **Brush presets** lists built-in and saved brushes, marks stretch brushes, and chooses one and activates Brush in one step.
- **Illustration tools** reaches Edit points, Bend segments, Cut path, Erase path, Lasso points, Shape builder, Offset, Outline stroke, Separate regions, and Linear and Radial repeat.

Canvas tools need the Move tool and point editing, so a tool entry switches to Move and enters point editing first. That is the same step as **Edit vector points**, including converting a primitive to a path with its own Undo step. If the tool then refuses, for example Cut on a filled shape, its message appears and point editing stays open. With no selection nothing changes and a message appears.

Every entry runs the guarded path of its existing control, so all refusals and limits of those tools stand. Menus close on any editor context change, so a retained choice cannot act on a different selection. The menus use the toolbar's own keyboard model: Arrow Down opens, arrows move and Escape returns focus. They are checked on screen at 1100, 900 and 760 px. They are view state only and there is no separate Draw inspector.

These entries are not registered commands, so they are absent from Actions search and keyboard customization.

## Validation

- `tests/brush-stretch.test.ts`: straight and curved spines, holes, corners, taps, pressure, segmentation, noise, the anchor budget, malformed settings, the geometry limit, preset and library round trips, and a real sampled source saved through `parseDocument` and edited.
- `tests/e2e/illustration-tools.spec.ts`: real sampling, drawing, one Undo and Redo, save and reload, exported band pixels inside and outside the thickness, control switching, JSON export, taps, mouse and keyboard menus, refusal without selection, all four canvas tools, Shape builder, an existing dialog, stale menus and three widths.

Not tested: physical tablets, WKWebView, or any comparison with Figma.
