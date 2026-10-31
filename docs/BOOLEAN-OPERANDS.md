# Boolean operands and result style

Live Boolean groups recompute through `updateBooleans` in `src/geometry.ts` after every document edit, from the editor store and the source MCP transaction alike.

## Operands

A vector, shape or nested Boolean operand contributes its own geometry. A plain group contributes the union of its visible subtree through the group's own rotation, flip and scale, recursively, so a selected group no longer collapses to its bounding box. A group with no visible children contributes nothing. Text or an image anywhere inside a group refuses with the existing conversion guidance before any mutation. Frames, sections, components and instances keep their box geometry as operands.

Nested Booleans recompute deepest first, by hierarchy depth rather than stored array order. Operand order is the stored sibling order, so subtraction is order-sensitive as before. Hidden operands are excluded.

An empty result, such as an intersection of disjoint shapes, stores an empty path, keeps the last box so the layer stays selectable, and recovers when the operands overlap again.

## Transforming the Boolean itself

A Boolean's box is derived, and recomputation normalizes its rotation and flips to zero. The store and MCP derivation now compare each Boolean with its previous document state. When its size, rotation, flip or scale changed, the transform is baked into the direct operands before recomputation, so the rotate handle, flip commands, the width and height fields, resize handles and constraint-driven resizes all persist instead of snapping back. The old box comes from the operands' current bounds, which keeps north and west resize anchors exact.

Shapes and nested Booleans take the new size directly, with no lingering scale, and a nested Boolean bakes the change into its own operands in the same pass. A plain group keeps the scale on its own transform, which its subtree inherits. A nonuniform resize of a rotated operand would need skew and refuses atomically with the existing skew message. Callers without a previous document, such as prototype copies and the responsive preview, keep plain normalization. A pure position change never bakes: moving a Boolean moves its operands through the existing owned-subtree path.

## Result fill and stroke

The result takes the first operand's complete paint stack, stroke stack, paint and stroke style links and fill and stroke variable bindings. With a group as first operand, the first drawn leaf in its subtree supplies them. Result style lives on the Boolean, is independent of the operands after creation, and survives operand edits, Undo, save and reopen, because recomputation changes geometry fields only. Which operand supplies the style is Forma's documented rule: exact Figma selection order for this choice is not verified.

## Validation

`tests/boolean-operands.test.ts` covers group recursion, transformed groups, ordering, baking, refusal, empty results, holes and islands, and style retention. `tests/e2e/boolean-operands.spec.ts` checks exported pixels for real holes and gradient results, the canvas rotate and resize helpers through the store, Undo and saved documents. Editable Figma Bridge transfer of live Booleans and native acceptance are outside this validation.
