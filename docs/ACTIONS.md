# Action search

Open Actions with **⌘K**, **⌘/**, or the search button in the header. The palette lists the editor's shared command registry. Search matches all entered words against command names, IDs, categories, shortcut labels and a curated set of related words. For example, `settings` finds Preferences, `typeface` finds the font library and `slide deck` finds New presentation.

Choose a category to narrow results. With an empty search, recent actions appear first, followed by the remaining commands grouped by category. The Recent category shows only history. Shortcut labels appear where a command has a registered shortcut. The Tools category also selects the editor’s registered drawing and navigation tools. External plugins, widgets and library assets are not searched.

Keep focus in the search input and use **↑ / ↓** to move through results, **Home / End** for the first or last result, **Enter** to run, and **Escape** to close. Arrow navigation wraps around. Modified text-editing shortcuts, including ⌘A, remain available in the input. Tab stays within the dialog. A command runs through the same path as its menu entry, including its existing undo and validation behavior.

The most recent 20 distinct command IDs are saved in local storage under `oui-action-history`, outside `.oui` projects. Menu and keyboard command invocations are recorded even while the palette is closed; opening Actions itself is excluded. History records invocations, including commands that have no effect on the current selection. It contains no project names, content or paths. **Clear recent actions** removes only that history. If local storage is blocked, commands still run and history remains available for the current session.

Validation: `tests/action-history.test.ts`, `tests/action-search.test.ts`, and `tests/e2e/actions.spec.ts` cover bounded and validated persistence, corrupt data and storage failures, category/alias search, keyboard navigation, actual rotation and undo, closed-palette menu history, reload, clearing, text-input shortcuts, tool selection and modal focus.
