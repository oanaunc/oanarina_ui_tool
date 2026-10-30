# Unreleased numeric property scrubbing

Drag a label beside a shared numeric property field to adjust its value. Each CSS
pixel adjusts one step; Shift increases speed ten times and Option uses one tenth
of a step. Modifiers can change during a drag without jumping the value. The field
previews locally, with one edit on pointer release. Geometry, typography and
layout inspector fields using NumberField support the gesture. Specialized image,
vector-point and prototype controls retain their separate editors.

Escape, pointer cancellation, lost capture, window blur/hidden, changing document,
selection, page or mode, and opening another dialog discard unfinished scrubs.
Command shortcuts cancel the draft before running. Values are bounded and finite;
locks inherited through the selected hierarchy disable document number fields.
Preference dialogs continue to edit preferences independently of selected locks.
Keyboard users can activate the label to focus the existing arithmetic field;
its arrow keys, expressions and precision modifiers remain available.

Validation: numeric-scrub.test.ts checks speed, bounds and malformed inputs.
Browser tests verify a single Undo step, save persistence, changing speed, lock
refusal, and Escape/blur/pointercancel/modal interruption. This does not claim
exact Figma reference acceptance or a live artwork preview while scrubbing.
