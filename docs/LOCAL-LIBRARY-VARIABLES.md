# Published variables, analytics and moves in local libraries

Unreleased source. Everything here runs on this device and travels as a `.forma-library.json` snapshot file through the [local library path](LOCAL-COMPONENT-LIBRARIES.md). There is no hosted publishing, team sharing or live sync. Figma reference acceptance is separate and has not been done.

## Publish variables

**Assets → Libraries → Publish current file** lists every variable collection with its variable and mode counts. All are published by default, as before. Clearing **Publish collection …** records the exclusion in `libraryPublication.excludedCollections`, in one Undo step, so the next publish remembers it. An excluded collection leaves the snapshot entirely. Publishing refuses, by name, when a published variable aliases an excluded one or a published component layer or prototype action uses one. A file can publish variables alone.

**Prepare publication** compares the prepared version with the newest cached snapshot of the same library by asset fingerprint and lists added, changed and removed groups. With no cached version it says so rather than reporting no changes.

## Linked read-only copies

Enabling a library that holds collections installs a copy owned by the saved dependency. **Assets → Libraries → Linked variable collections** lists them with library, version and variable count. Layers bind them through the existing Design system inspector, including across modes.

A linked copy is read-only. The variables manager disables its controls and says why, and `validateLinkedVariableMutations` in the store's `edit` path refuses any other route, so a disabled control is not the only protection. The refusal covers names, values, modes, scopes and deleting the collection. Choosing a mode stays with the consumer, because that choice is saved in the file's `variableModes` rather than in the copy.

The saved-file MCP tools write `.oui` files without going through that store path. Such an edit is not refused there, but the edit baseline still catches it: the group shows as a conflict and cannot be overwritten without an explicit choice.

## Update review and mode mapping

Importing a newer snapshot opens **Variable update review** beside the existing asset rows. Each changed collection lists modes added, renamed and removed, variables added, renamed, retyped and removed, and up to 200 changed values in the file's own terms, with 24 shown. Local IDs stay stable through renames, so bindings and mode choices survive.

Removals need a decision when they are in use:

- A removed mode that a layer or the document uses refuses until it is mapped to an incoming mode. Accepting moves those saved choices in the same Undo step. An unused removed mode is listed and needs no mapping.
- A removed variable used by layers or by another collection's alias refuses until **Detach those bindings and keep their current values** is checked. Aliases are baked to their current value through the existing variable removal.
- A removed variable used by a prototype action refuses until it is mapped to an incoming variable of the same type. **Map … to** retargets its layers, aliases, form inputs and prototype actions. Expressions that name a variable in text are not rewritten.
- A type change on a variable in use refuses until it is mapped the same way, or, when no prototype action uses it, until **Detach those bindings** is checked.

Accepting is one Undo step. Partial selections still take the dependency closure.

## Detach

**Detach …** explains the result and asks for confirmation. The copy becomes ordinary local variables with the same IDs, values and bindings, only the ownership records go, and Undo restores the link. Collections that alias the detached one go with it, and the confirmation names them. A later update offers the library's collection as new and adds it beside the local copy. It never overwrites the detached one.

## Conflict resolution

A style, guide or collection edited after installation shows as a conflict in review, and Accept refuses as before. The row now offers two explicit choices. **Replace with library version** discards the local edit for that group. **Keep my version as local** detaches it, and a later accept can add the library's version beside it. Neither merges. Component and variant-set groups get the same two choices: replacing keeps instances linked and their ordinary override checks still apply, and keeping refuses while another installed group nests that component.

## Analytics

**Library analytics on this device** counts current references when you press **Scan files on this device**. It reads the local project library plus the open document, so unsaved work counts, and it can be cancelled. It reports, per library, the files using it, their versions, how many are behind the newest version seen, placed instances, generated nested instances, layers using its styles, variables or guides, and assets unused in the scanned files. At most 2,000 files are read, and unreadable or excess files are counted as skipped.

The panel states what it cannot see: other people, other devices, `.oui` files never opened on this device, any history or trend over time, Trash, branch copies, and copied definitions that no longer belong to a library. No request leaves the device.

## Moving a component between libraries

This is a consumer-side repair, not a source edit. When a source library has removed a component and the removal has been accepted, its cached definition is marked removed. If a cached snapshot of another library publishes the same component, **Move component between libraries** re-homes the group: definitions and instances keep their local IDs and overrides, and only ownership moves, in one Undo step. Forma does not edit either source library, and the source files must be changed and published first.

Matching reuses the source-swap rules: same layer topology, unique sibling type and name, same properties and slots. Edited definitions, a target already installed, and changed slot identities refuse. The group keeps its old fingerprint, so the new library's next review shows it as changed, and accepting updates the definition in place.

## File-level library metadata

**File → File information… → Library details** shows publication state, version count and libraries used, and edits owner, license, contact and tags as plain text. The fields are saved in `libraryPublication.metadata`, copied into each snapshot as `fileMetadata`, and shown when a consumer reviews that snapshot. Saving is one Undo step. They are never treated as links or markup.

## Other changes

Disabling a library hides its definitions from the Assets component browser, with a count, and existing instances stay linked. Its styles and variables stay available in the inspector pickers. Set previews can show any variant. Available libraries can be searched when more than one is cached.

## Compatibility

All new data is additive and absent until used. `.oui` versions are unchanged. Snapshots stay schema one with an optional `fileMetadata`. Legacy files whose collections were edited locally open normally and show those groups as conflicts.

## Validation

`tests/library-variables.test.ts` and `tests/library-analytics-move.test.ts` cover publication exclusion and refusals, every store refusal path, Undo, save and reopen, review output, mode mapping, removal decisions, detach closure, conflict choices, malformed metadata and decisions, analytics bounds and skipped files, and move refusals. `tests/e2e/library-variables.spec.ts` drives the same paths in a real browser, using synthetic data only. Not run: a native WKWebView pass, a real second device, and any Figma comparison.
