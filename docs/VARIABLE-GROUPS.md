# Variable groups

A variable group exists only through slash-separated names, so `color/brand/primary` sits in the groups `color` and `color / brand`. Spaces around a slash are ignored when grouping. There is no stored group record, no format change and nothing to migrate: older files show their tree as soon as the Variables manager opens, and the Bridge, CSS and library export paths keep reading the same names.

The Variables manager shows a tree for the chosen collection, with recursive counts. Choosing a group filters the table to that group and its nested groups, combined with search, and + Variable creates a uniquely named variable inside it. A chosen group can be renamed one level at a time, moved to another group or the top level, ungrouped so its contents lift one level, or deleted with its variables. Rename, move and ungroup keep variable identities, so bindings and aliases stay intact. Delete uses the shared variable removal, which materializes bindings to their last values.

Each operation changes every affected variable inside one edit, so one Undo restores all of them. A name collision in the collection or a move into the group's own subtree refuses before anything changes. Groups are per collection. Dragging variables between groups, and multiple-variable selection, are not implemented; renaming one variable with a slash path moves it.

Validation: `tests/variable-groups.test.ts` and `tests/e2e/variable-groups.spec.ts`. Native and exact Figma reference acceptance are pending.
