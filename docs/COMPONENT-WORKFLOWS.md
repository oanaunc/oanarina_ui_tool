# Local component workflows

The component manager and instance inspector now offer real local workflows for the following feature-register entries. Reference verification remains pending; these changes do not establish complete Figma parity.

| Entry | Reachable behavior |
| --- | --- |
| UI-27-010 Main component selection | “Go to main component” resolves the nearest selected nested instance's actual main, including another page. The manager also offers “Select main on canvas.” Navigation leaves the document and undo history unchanged. Hidden mains are selected in Layers with an explanatory message. |
| UI-27-029 Preferred swap values | An exposed instance-swap property's searchable preferred list appears first in its instance selector. Actual application updates generated artwork and rejects recursive dependencies. |
| UI-27-034 Instance accessibility label | The selected instance has a plain-text label, preserved as an instance override during synchronization. Canvas and exported SVG expose its `aria-label` and image role; Dev CSS includes a safely escaped documentation comment. Reset, detach, undo and saved-file reopening preserve the intended behavior. |
| UI-28-013 Variant description | Each variant has a separate multiline description in the manager, shown for its current instance variant and copied when duplicating it. |
| UI-28-025 Property grouping | Each property has an optional group name. Instance controls render as named fieldsets, preserving group and property order. |
| UI-28-026 Preferred component instances | Main components may recommend other local mains for the whole-instance swap selector. This is a local recommendation workflow; equivalence to Figma's preferred nested-instance/property behavior has not been reference-verified. |

Metadata is optional and additive to existing `.oui` documents. Plain-text fields, lengths, distinct preference arrays and property types are validated before imported or edited data becomes live. The new metadata mutations honor inherited locks; whole managed-child swaps must use the outer exposed properties. Accessibility labels may be overridden on a managed nested instance. Duplication deep-clones metadata and remaps internal references.

All Component Manager editing callbacks now use the same guard before mutation, including existing name, property, variant value, ordering, default, remove and duplicate actions. Editing a variant-set definition requires the container and every member to be unlocked through its ancestor chain; the manager disables definition fields and actions when that condition fails. Main navigation remains available. Validation also rejects stale set membership before invoking an edit.

Saved suggestions whose components are deleted remain explicitly unavailable in their original document and can be removed. Copy across files includes available preferred component dependencies with fresh identities; unavailable suggestions are omitted with a generic warning so a destination identity collision cannot bind them accidentally. Independently supplied clipboard payloads must resolve both preferred-reference channels to actual component definitions inside that payload; malformed or destination-only references are rejected before paste mutation. Suggestions never promise remote library availability.

Instance export profiles now participate in the existing override mechanism: inherited profiles follow the main until overridden, an instance's own profile survives source changes, and reset restores the latest inherited profile. Export delivery supports independent profiles on instance roots and managed children while enforcing inherited locks and validating the result after component reconciliation.

Limits: main canvas navigation is available in Design and Whiteboard documents; Slides use their separate deck workspace. Property groups are one level. Preferred lists allow up to 100 entries and search displays at most 200 matches at once. Accessible SVG labels and CSS comments do not generate a production HTML app or an accessibility audit. Editable Figma transfer explicitly reports these new metadata channels as omitted; `.fig` binary compatibility and a real desktop plugin round trip are not claimed.

Validation: 17 new core tests cover validation, atomic refusal, synchronization, override/reset, copying, variants, lock/cycle safety and Bridge API-contract omission behavior. Nine browser checks cover manager-to-inspector flows, actual artwork swaps, cross-page navigation, descriptions, accessibility and save/reopen/undo. The Bridge checks use a mock and are not real Figma acceptance.

Source validation passed `npm test` (843 tests in 79 files), TypeScript compilation, all nine component-workflow browser checks and the existing mock-exported-instance Bridge interaction. The separate browser test **“the downloadable bridge archive contains the current component transfer implementation”** does not pass: the frozen downloadable ZIP predates current source. Regenerating that resource is deferred under the user's instruction to implement remaining features before producing more builds or packages. No ZIP or native release was generated for this change.

## Multiple selected instances

When two or more instance roots are selected, up to 200, the inspector replaces the single-instance controls with **Shared instance properties**, so an edit never lands on the first layer alone. Properties appear when every selected instance's main has one with the same name and type; a value that differs shows as Mixed. Variant axes appear when every instance belongs to a set with that axis, and only values every set offers are listed. Each change applies through the per-instance property and swap validation inside one edit, so one Undo restores all of them and any refused instance, such as a locked one, refuses the whole change. A selection mixing instances with other layers shows no component controls.

## Property values across a swap

Each main component owns its property IDs. A swap, including a variant change, copies each value to the new main's property with the same name and type. Values with no match stay stored, so swapping back restores them, while an edit made after the swap wins on the way back.

## Nested instances inside an instance

Selecting a nested instance inside an outer instance shows its own controls: **Swap nested instance**, its variant axes and its component properties. The change applies to that outer instance only; the main components and other instances stay as they are.

- A property value is stored on the nested layer as an override (`propertyValues` in `overrideKeys`) holding only the values set at this level, then applied over the artwork inherited from the main. Overrides made in the parent main on that nested branch therefore stay.
- A direct swap regenerates that branch from the new main. Generated layer IDs and their overrides stay stable across later synchronization, and the swapped layer keeps its parent-given sizing, constraints, grid placement, visibility and lock. If a main exposes a swap of that layer, the swap writes the owning property rather than a separate override.
- Reset this layer and Reset all overrides restore the authored nested instance.
- Slot-bearing components stay outside other components, so swapping one in refuses, as do recursive dependencies, missing mains and locked layers. All refusals happen before the edit is published.

**Expose properties to instances** on a nested instance in a main (optional `exposeNestedProperties`) lists it on outer instances. A deeper nested instance is listed only when every generated instance on the way down is exposed too, up to 64 rows.

When a swap changes structure, an override follows its matching layer by component key or path, then by a unique layer of the same type and name, without its old position. A renamed layer or an ambiguous name has no match. One overridden variable binding (optional `overrideBindings`) leaves the other bindings following the main; instance overrides saved before this field keep whole-object behavior.

Validation: `tests/nested-instances.test.ts` covers Undo, reopen, main edits, three-level exposure, swap property routing, cross-file copying, refusals and malformed input. `tests/e2e/nested-instances.spec.ts` drives the inspector. A real Figma round trip is not claimed.
