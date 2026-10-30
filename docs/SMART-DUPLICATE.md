# Smart duplication — unreleased source

Duplicate (⌘D) starts with the existing 24 px world offset. Move, rotate, reflect or resize that copy, then duplicate it again to repeat the visual affine transform from the preceding source to its copy. Subsequent copies use the current layer styles and subtree. Each duplication is one Undo entry, and generated geometry persists through ordinary .oui save/open.

Repeated visual scaling uses the existing layer scale fields; the copied width, height and vector path basis stay intact. This matches the Scale tool's model. Camera navigation and switching between Move and Scale retain the sequence. Changing selection, page, editor mode, tool outside Move/Scale, document, or Undo/redo clears it. No sequence bookkeeping is saved.

A repeat that requires unsupported skew, exceeds document bounds, or is rearranged by auto layout is refused atomically. The next Duplicate starts a fresh ordinary sequence. A collapsed dimension cannot become a nonzero repeated scaling basis. Limits: 128 selected roots, 2,000 copied layers, 20,000 indexed layers and 64 ancestor levels.

Validation: 10 core tests and 4 browser interaction tests cover keyboard duplication, fields, visible SVG scaling, affine parents, multiselection, context resets, atomic layout refusal, Undo and saved reopening. The accompanying existing workflow preference browser checks passed (16 combined). Reference verification against Figma is pending.
