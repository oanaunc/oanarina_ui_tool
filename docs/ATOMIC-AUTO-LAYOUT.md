# Atomic auto-layout wrapping

Adding auto layout to a selection now creates its wrapping frame and applies the
initial horizontal layout in one document transaction. Shared derivation and
validation run before the frame, child positions, selection or Undo entry are
published. For example, an unsupported calligraphic path or text-on-path layer
reports its existing hierarchy refusal without leaving an empty or ordinary
wrapping frame behind. The same refusal applies when such a layer is nested in
a selected group.

Ordinary selections receive one complete layout operation and one Undo entry.
Adding layout to an existing single frame, component or group continues to use
one patch. Ordinary Group and Frame Selection retain their existing behavior;
the new optional initial-layout argument is used only when explicitly supplied.
There is no document-schema or native-command API change.

Validation covers direct and nested special-layer refusals, source/selection and
Undo/Redo preservation, ordinary horizontal and vertical child geometry,
ordinary Group world poses and Actions reachability, inherited locks, and oui1/2
round trips. Actual browser checks exercise Shift+A, an additional shortcut,
save/Undo/Redo and the existing App native-command callback adapter. The adapter
test is a browser mock, not a real AppKit menu or Figma round trip. Native app and
production builds remain deferred under the user's build freeze.
