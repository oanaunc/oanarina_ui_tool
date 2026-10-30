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

Metadata is optional and additive to existing `.oui` documents. Plain-text fields, lengths, distinct preference arrays and property types are validated before imported or edited data becomes live. Mutations honor inherited locks; whole managed-child swaps must use the outer exposed properties. Accessibility labels may be overridden on a managed nested instance. Duplication deep-clones metadata and remaps internal references.

Saved suggestions whose components are deleted remain explicitly unavailable in their original document and can be removed. Copy across files includes available preferred component dependencies with fresh identities; unavailable suggestions are omitted with a generic warning so a destination identity collision cannot bind them accidentally. Suggestions never promise remote library availability.

Instance export profiles now participate in the existing override mechanism: inherited profiles follow the main until overridden, an instance's own profile survives source changes, and reset restores the latest inherited profile. Export delivery controls still independently enforce their supported layer/managed-child boundaries.

Limits: main canvas navigation is available in Design and Whiteboard documents; Slides use their separate deck workspace. Property groups are one level. Preferred lists allow up to 100 entries and search displays at most 200 matches at once. Accessible SVG labels and CSS comments do not generate a production HTML app or an accessibility audit. Editable Figma transfer explicitly reports these new metadata channels as omitted; `.fig` binary compatibility and a real desktop plugin round trip are not claimed.

Validation: 14 new core tests cover validation, atomic refusal, synchronization, override/reset, copying, variants, lock/cycle safety and Bridge API-contract omission behavior. Seven browser checks cover manager-to-inspector flows, actual artwork swaps, cross-page navigation, descriptions, accessibility and save/reopen/undo. The Bridge checks use a mock and are not real Figma acceptance.

Source validation passed `npm test` (840 tests in 79 files), TypeScript compilation, all seven component-workflow browser checks and the existing mock-exported-instance Bridge interaction. The separate browser test **“the downloadable bridge archive contains the current component transfer implementation”** does not pass: the frozen downloadable ZIP predates current source. Regenerating that resource is deferred under the user's instruction to implement remaining features before producing more builds or packages. No ZIP or native release was generated for this change.
