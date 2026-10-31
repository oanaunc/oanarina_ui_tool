# Local file branches

File → **Branches…** forks the open file on this device. A branch is a separate working copy with its own recovery, version history and persisted Undo; the file it came from is **main**. Each branch keeps the exact document it started from (the base snapshot), so a merge is a real three-way comparison of base, main and branch by stable page and layer identity.

Branches are local. They are not shared, have no accounts or other reviewers, and are not written into `.oui` saves. Saving a `.oui` while on a branch exports that branch's working copy as an independent file; branch records do not travel with it. Back up important work.

## Lifecycle

- **Create**: name a branch (1–80 plain characters; `main` is reserved; names are unique per file, up to 50 branches). Main, its base snapshot, the working copy and the registry entry commit in one IndexedDB transaction, so a failed fork leaves nothing behind. Branches cannot be nested. A file that repeats layer identities across pages is refused because a merge could not tell those layers apart.
- **Switch**: the browser build reloads the same window after retaining the outgoing file. The Mac app keeps one document per window, so a branch or main opens in its own window, whose title names the branch.
- **Status**: every row reports real comparisons: changes ahead of main, behind main, conflicts, merged or archived.
- **Review**: conflicts, then a page-by-page structural summary of base → branch and base → main, reusing the version comparison and its previews. *Mark as reviewed* stamps the exact branch revision with the local profile name, if one is set.
- **Merge**: resolved only from main. All conflicts must be answered and the merged project must pass the same validators as a saved file. The merge is one ordinary Undo step on main. A merged branch stays listed and can be reopened; because the merge is three-way, repeating it after an Undo is safe.
- **Archive**: hides a branch and refuses edits to it; Restore brings it back. Only an archived branch can be deleted from the device.
- **Protect main**: a per-file setting. Direct edits to main are refused with a notice, and a merge needs a review of the current branch revision; any later branch edit invalidates that review. Undo and Redo stay available on main, including for a merge. This protects against your own mistakes; there are no permissions behind it. Permanently deleting main removes its branches, base snapshots and persisted Undo.

## Merge rules

`src/branch-merge.ts` is a pure function, tested headlessly without a browser. Inputs are revalidated and never mutated. Unresolved conflicts preview as main; `committedMerge` refuses until each is answered.

- Layers merge property by property. Coupled properties merge as one unit so nothing is torn: tree position, vector geometry, text content, fill, stroke, position and size. Instance override lists merge as sets.
- Both sides changing the same unit is one conflict per layer, choosing main or branch for those units only.
- A deletion against an edit is one conflict at the highest deleted layer. Keeping it restores the keeper's complete subtree; keeping the deletion also drops layers the other side added inside. A layer that was merely moved into a deleted parent falls back to its surviving location.
- Pages merge by identity; deleting a page the other side changed is a conflict, and a clean deletion takes its layers along, except a layer the other side moved to a surviving page. Separate deletions that would remove every page are a conflict. A child always follows its root's page.
- Stacking merges among siblings, so reordering different parents never conflicts. Divergent order among the same siblings is a conflict, as is divergent page order.
- Move cycles, where each side moves a layer inside the other, are reported and resolved by choosing one hierarchy.
- Variables, collections, styles, component sets, comments, flows, guides, slides and whiteboard records merge by identity, recursively. `fileCover`, library provenance, motion timelines, canvas backgrounds and prototype settings merge whole.
- A deleted component, variable, style or collection that a surviving reference needs is a conflict grouped by target. Keeping the target restores it (a component with its subtree). Keeping the deletion leaves a supported orphan instance, materializes aliases to their literal values through the same code as deleting a variable, or clears the binding. Component sets drop removed variants automatically.
- When both sides changed pages, components resynchronize so an added instance receives a merged component edit, and auto layout reflows on pages both sides changed. Conflict summaries show short values and never embedded asset bytes.

Limits: identity-based, so a layer deleted and recreated counts as a new layer. Text does not merge within a string. A prototype link to a layer deleted on the other side stays dangling, as it does when deleting that layer directly. Reviews are structural, not a pixel diff. There is no "update branch from main" yet. Merging waits for the branch's latest local save; in the Mac app an unsaved edit in another window is included after its next autosave. 100,000 layers, 50 MB and a bounded comparison budget apply. No comparison with Figma's branching has been verified.

## Storage

Records live in the existing `metadata` store under `branch-registry-v1` and `branch-base-v1:<id>`, without a database version change, and the working copy is an ordinary `documents` record hidden from Home. Nothing is added to the `.oui` schema, so older files and older app versions are unaffected. A malformed registry never hides files or blocks an open file; it reports as no branches.

Validation: 41 headless merge cases covering add, delete, edit and move on both sides, components, variables, styles, pages, workspaces and identity laws, including 250 seeded random two-sided edit runs (`FORMA_MERGE_SEEDS` raises the count; 6,000 passed once locally); six model cases; nine browser cases in `tests/e2e/branches.spec.ts` covering reload, one-step Undo, per-conflict choices, protection and review invalidation, archive, failed fork, permanent deletion, damaged base and a 125% short window.
