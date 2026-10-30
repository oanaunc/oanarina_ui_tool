# Frame-relative positioning and retained constraints

The Design inspector now offers Frame X and Frame Y for a single layer inside a frame, main component or instance. The nearest such ancestor is shown as the reference. These coordinates describe the layer's **layout origin before its own rotation, reflection and scale**, expressed in the reference frame's axes through any intervening transformed groups. They are not the rotated artwork's bounding-box corner.

## Status recommendations

- **UI-23-029 — Relative frame positioning: implemented locally.** Both numerical coordinates apply together in one guarded document transaction, with Undo/Redo and normal `.oui` save/reopen. The affine calculation supports rotated, reflected and nonuniformly scaled ancestors, including nonsingular combinations that produce skew. Moving a container translates its descendants without changing their own transforms or dimensions.
- **UI-23-026 — Preserve constraints on reparenting: implemented for the existing five constraint modes.** Actual Layers drag/drop, move to page root, and Group/Ungroup retain `start`, `end`, `center`, `stretch` and `scale` flags. Existing world-preserving reparenting retains representable world geometry. A shared constraint pass now checks ownership before using a previous parent/child baseline: reparenting and resizing the destination in the same transaction cannot apply the old parent's baseline to the new relationship. A later independent destination resize uses the new baseline normally. This also applies to validated source MCP batches.
- **UI-23-027 / UI-23-028 — Stretch to layout columns/rows: planned.** No persistent child-to-guide binding or responsive span solver was added.
- **UI-26-024 — Responsive layout guides: remains partial.** Existing guides and snapping are available, but this work does not add persistent guide IDs or responsive child bindings. A one-time resize would not establish that behavior.

Reference verification against the original app remains pending. This source work does not establish complete Figma parity.

## Guards and limits

Frame-position drafts capture their document, page, selection and editor context. Native selection changes and mode transitions invalidate them immediately, including a transition away and back. Edits require the visible Design canvas with Motion closed and no modal. Tree drags have the same captured-context check; stale drops cannot commit after a native mode cycle. Shared Group/Ungroup also refuse Motion and non-Design contexts while ordinary Actions-palette grouping remains reachable.

Numerical positioning refuses inherited locks, managed instance descendants, auto-layout flow children, derived boolean results, generated whiteboard text/table cells and Slides workspace artwork. Absolute auto-layout children and linked instance roots remain editable. A final post-derivation check rejects a position overwritten by another layout/component/workspace owner instead of silently recording an ineffective edit. Every translated descendant is checked before any coordinate is mutated. Coordinates must be finite and within the existing ±1,000,000 document range.

Ancestor traversal accepts at most 1024 ancestors and explicitly refuses deeper paths, cycles, missing parents and singular/collapsed transforms. Relative translation itself does not decompose affine transforms. **Reparenting** retains the existing stricter representability rule: if the new local transform would require unsupported skew, it refuses the move. Auto-layout destinations may derive positions through their layout rules; retaining constraints does not disable those rules or promise frozen world geometry when a flow layout controls placement.

No document field, file version, migration or MCP operation/schema was added. Existing supported `.oui` versions remain compatible. Headless code shares the constraint-owner correction. No public links, external file access or new native permissions are involved.

## Validation

- Full source core suite: 1107 checks across 101 files passed; the exact 1024-ancestor boundary was additionally verified in the focused 16-check suite after clarifying the traversal boundary.
- Shared editor and MCP TypeScript checks passed without emitting output.
- Nine new actual browser checks and eight existing Layers checks passed on a private development server. They exercise transformed rendered coordinates, one Undo/Redo, save/reopen, invalid/stale drafts, inherited locks, managed children, auto-layout flow/absolute behavior, Motion refusal, interrupted native-mode drags, real transformed reparenting and later resize, context-menu Ungroup, ordinary Actions grouping, and unique React sibling keys when switching among frame/group/layer inspectors.
- Direct-source MCP checks cover a reparent-plus-destination-resize batch, a subsequent independent resize, Undo, saved output and atomic refusal of a later malformed constraint value.

No build, bundle, native package, archive, version, website or central feature-register generation was performed. Native smoke checks are outside this shared-source change; download artifacts remain untouched under the user's build freeze.
