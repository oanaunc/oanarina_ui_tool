# Grid track ordering

UI-25-019 has a reachable local workflow in Design → Layout → Column tracks / Row tracks. Each of the first 256 track cards has Move earlier / Move later controls. The block form reaches every supported track: select a first track, contiguous track count and final first position, then Apply. Its preview shows original track numbers in their proposed order. UI numbers start at one; the source MCP operation uses zero-based indexes.

The operation moves track definitions and the objects occupying those tracks together. It preserves layer order, span lengths, the untouched axis and unused trailing track definitions. Visible flow children are assigned their actual collision-resolved cells before moving; automatic placements therefore become explicit. Row moves preserve the current resolved row count as a minimum, including empty trailing rows. This is necessary to keep reordered track definitions attached to their cells.

An operation that would make a spanning object's cells discontinuous is refused before mutation. Move its complete span as a block or edit the span first. Hidden children remap only an explicit value on the moved axis; a missing value stays automatic even when the other axis is explicit. Absolute children are untouched. Hidden objects are not assigned synthetic resolved cells.

Ordering requires an editable grid container and unlocked affected hierarchies. Instance roots and managed grid containers must be edited through their main component or detached. Main-grid changes propagate to instances while explicit cell overrides remain overrides. The inspector checks its live document, page, selection, mode and modal context. One successful operation creates one Undo entry; refused operations preserve document and history. A final derived-state check rejects cell metadata overwritten by a controlling source.

The pure operation is shared with source MCP `apply_operations`:

```json
{"op":"reorder_grid_tracks","pageId":"selected-page","nodeId":"grid","axis":"column","from":0,"count":2,"to":3}
```

`to` means the block's final first index after its removal. The server derives preceding edits before planning and validates the resulting cells after derivation; later operations can intentionally edit them again. Invalid batches do not write the scoped file. No-op moves retain file bytes, revision and Undo history. Existing MCP file authorization and stdio boundaries are unchanged.

## Limits and status

- UI-25-019: implemented locally with safe refusal for split spans. Native Figma reference verification remains pending; arbitrary noncontiguous track groups and track drag handles are not supplied by this workflow.
- UI-25-003: remains partial. The existing Rows field is a minimum, and rows grow to retain objects. Strict fixed row counts, overflow policy and automatic creation of extra columns are not implemented here.
- UI-25-029: remains planned. No auto-layout suggestion engine or placeholder action was added.
- Track definitions and reorder indexes support up to 4096 tracks; spans remain limited to 256 and the solver retains its 1,000,000-cell/work limits. Existing customization cards show the first 256 tracks; the block ordering form reaches later tracks. Automatic overflow can produce more than 4096 rows in an otherwise valid legacy document; ordering that axis is refused with an instruction to reduce overflow.
- `.oui` versions one and two remain accepted without new required fields. The track-array validation limit broadens from 256 to 4096. Malformed imports are rejected before mutation.
- SVG/raster exports use the shared resolved geometry. Editable Figma Bridge validates grid metadata with the same per-field/track limits but explicitly omits native track definitions and cell assignments, retaining saved positioned children. API mock checks do not establish a real desktop Figma round trip or direct binary `.fig` fidelity.
- This source change does not regenerate download archives, native apps, release versions or website assets. Bundled Bridge/MCP downloads consequently do not contain it until an explicitly authorized later build.

## Verification

`tests/grid-ordering.test.ts` covers permutations, mixed spans, collision-resolved placements, hidden/absolute children, locked/managed hierarchies, v1/v2 persistence, Undo/Redo, component propagation, bounds and atomic validation. `tests/bridge-grid-ordering.test.ts` checks preflight refusal and explicit omissions against the public API mock. `tests/e2e/grid-ordering.spec.ts` exercises actual inspector actions, legal/refused span moves, row minimums, track 300, PNG pixel positions, inherited locks, instance refusal, target draft reset and malformed import refusal. `mcp/tests/grid-ordering.test.ts` checks scoped files, mixed batches, no-ops, Undo and the actual source stdio schema. Release artifact comparisons are intentionally outside this source-only validation.
