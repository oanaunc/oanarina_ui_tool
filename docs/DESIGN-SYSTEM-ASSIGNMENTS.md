# Unreleased local style and variable assignment

The Design system inspector applies local paint, text and effect styles, scoped
variables, and collection modes through one validated edit. Multi-selection now
retains each target's own unrelated style IDs, variable bindings and mode maps.
Inherited locks are skipped; text-only assignments skip incompatible layers.
Creating a style requires an unlocked, compatible source layer. Assignment
controls are disabled in Motion because these edit base document properties.

A style removes variable bindings only for the properties that style owns. A
variable removes only styles that compete for the bound property. Detachment
retains the last materialized appearance. Changes support Undo/Redo, recovery,
.oui save/reopen and the existing library machinery. A post-derivation check
refuses an assignment a managed component would discard, before committing it.

Paint styles may include stacks and gradients, and effect styles retain the
supported effect stack. These are local document styles and variables. Remote
publication, full library parity, shader effects and native screen sampling are
separate unfinished requirements. Reference verification remains pending.

Validation: design-system-actions.test.ts checks unrelated map preservation,
lock inheritance, variable scopes, mode independence, style creation, invalid
selection refusal, no-op detachment and post-derivation rejection. Browser tests
exercise the real selectors, rendered paint/effect output, multi-selection, Undo,
save/recovery/reopen and locks. Shared lock resolution also covers a reversed
20,000-layer hierarchy without recursion or cached mutable-input assumptions.
