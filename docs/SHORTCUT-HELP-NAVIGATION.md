# Shortcut help and toolbar keyboard navigation

Unreleased source; exact Figma reference verification and native Mac acceptance
remain separate. No key bindings, native IPC/menu definitions, custom shortcut
settings, document schema or release archives are changed by this workflow.

## Reachable behavior

Open Help → Keyboard shortcuts, or use Control Shift ?. The dialog derives every
assigned command shortcut from the actual `commands` list instead of maintaining
a second list of unavailable commands. It also describes temporary Space-drag
Hand navigation, selected-layer nudge/opacity and contextual Enter/Escape editing.
Commands without assigned shortcuts are not advertised as having one. Search
matches all query words across labels, categories, binding text and context notes.

Categories are accessible tabs with one Tab stop, selected state and a linked
result panel. Left/Right wrap, Home/End go to the first/last category, and pointer,
Enter and Space activation work. A Used this session filter and reset control
operate independently of the project. The modal Tab trap includes the active tab
and result panel, skipping inactive tabs. Controls remain reachable at 1280×720
and 125% UI scale.

Highlights record named **editor keyboard dispatches**, not arbitrary typed keys
or the existing general Actions history. The private command dispatcher records
registered `handleKey` inputs after synchronous command acceptance; immediate
refusals are excluded. A menu click, Action palette call, toolbar activation,
programmatic `runCommand`, or native callback without keyboard provenance does
not count. Dispatched asynchronous file/clipboard requests can later be cancelled
or fail; the UI explains that a highlight does not promise operation completion.

History is session-only, per renderer window, and contains at most 64 distinct
named entries with last binding, source, order and a count capped at 999. It does
not store raw keyboard input, project IDs, text, file names or paths, and is not
written to `.oui`, recovery data or localStorage. Clearing highlights has no Undo
entry because it changes no document data. Nudge/opacity entries require an
actual selected-layer value change; temporary Hand requires a completed Space
pan with a changed camera. Local context handlers outside this documented catalog
(such as numeric inspector key adjustments and detailed vector/Motion point
controls) retain their existing behavior but are not globally key-logged.

Tab into the Design tools toolbar. Left/Right and Home/End move focus through all
existing top-level tool/options/action controls, wrapping without activating a
tool or changing selection. Up/Down opens a grouped tool menu at its first/last
item. Within the menu, Up/Down and Home/End move focus; Enter/Space activates, and
Escape closes the menu and returns focus to the options button. Pointer choice
and ordinary Tab departure remain available. Modified arrow
keys are left to existing shortcuts. Menus invalidate on source/context changes,
including away-and-back mode changes before React renders.

Toolbar and shortcut-help Space/Enter handling is scoped to their own controls;
it does not bubble into the canvas's temporary Hand or Pen handlers. In-progress
Pen content survives toolbar submenu Escape. Subtool choices now expose semantic
menu/menuitem roles; the existing brush/shape browser helpers use those roles.
Canvas drawing key/gesture algorithms are unchanged apart from read-only usage
bookkeeping after a successful temporary Hand pan. The bookkeeping has its own
transient exact-source/context/pointer/capture receipt and expected camera value.
Only pan-generated camera changes advance that receipt; external changes and
interruption invalidate it without modifying the existing pan algorithm.

## Validation and recommendations

- `npm test`: 1,801 core tests / 151 files pass, including seven new dispatch,
  filtering, bounded-history, context and roving-index checks.
- Editor `tsc --noEmit` and `npm run mcp:check` pass.
- Twenty new actual browser checks cover keyboard-only help, highlights/reset,
  non-keyboard exclusion, keyboard category/search controls, modal focus trap,
  contextual changed-value inputs, toolbar roving/submenus/Space safety, retained
  context refusal, Shift activation, both Tab directions, and an in-progress Pen
  path. Interrupted
  Space pans (blur/resize/hidden/capture loss/foreign pointers/source/camera/mode/
  scale) never receive a completed-use highlight. The 125%/short-window case checks
  actual dialog bounds and root scroll containment.
- 78 adjacent actual browser checks pass across Actions, canvas navigation,
  document accessibility, workflow preferences, interface Motion, shape drawing
  and brush drawing.

Recommended UI-42-013, UI-42-014 and UI-42-018 implementation status: implemented
for the explicit shared-editor behavior above; reference acceptance remains
pending. Native app keyboard/menu forwarding is not relabeled as verified. No
claim for UI-42-015 keyboard-layout preferences, UI-42-016 custom mappings or
UI-42-017 mapping-conflict warnings. Other tool-specific keyboard help remains
separate from this command catalog.
