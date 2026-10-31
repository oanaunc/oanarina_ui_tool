# Editor shell, workspace preferences and file ownership

Forma remains an independent local editor in development. This page records what these shell behaviors do today and where they stop. None of them needs an account, a server or a network connection, and none adds data to `.oui` files.

## Navigation rail

A vertical tab list sits at the left edge of the left sidebar, inside the sidebar's width, so the canvas does not move. File and Assets drive the same `leftTab` state as the existing tabs, which stay in place. Tools lists the existing dialogs: Actions, fonts, icons, templates, components, styles, colors, asset usage, MCP setup and local plugins. Variables lists the file's collections, modes and default values, and opens Variables and modes. Both replace the left panel in view only; the layer panel stays mounted and returns when File or Assets is chosen, or when any other path changes the left tab.

Keyboard: the rail has one Tab stop. Up, Down, Home and End move and activate entries. The rail hides with a collapsed left sidebar and below 850 px wide. The File and Assets tabs remain the path in those states.

## Toolbelt, Draw mode and tool menus

The toolbar's Toolbelt mode control switches between Design tools and Draw tools. Draw shows Pen, Pencil and Brush as direct buttons, with shapes and Text beside them, and picks Pencil unless a drawing tool is already active. View → Draw mode does the same. Returning to Design tools restores the full toolbar and the Move tool. The mode is view state: it is not saved, makes no document edit and adds no Undo step. Draw also adds [Brush presets and Illustration tools menus](STRETCH-BRUSHES.md#draw-toolbar-ui-16-034). Draw has no separate inspector. The selector hides below 1000 px wide, where View → Draw mode still works.

The Text tool now has a dropdown with Text, Text on path and Find and replace text. Text on path converts one selected contour path with the same validation and Undo as the inspector. Any other selection is refused with a message.

The menu beside the Present button starts a presentation from the selection or first frame, starts any saved flow on the current page, or opens Prototype mode. It only reads saved flows. Slides keeps its own presentation controls.

## Status in the top bar

The save label is derived from the editor's own timestamps: Saving…, Saved locally, Saved to .oui or Not saved. It never shows a path, because the renderer does not receive file paths. If a recovery write fails, a persistent alert stays under the menu bar with Retry recovery and Save .oui file until a write succeeds. Other failures keep their field-level messages or toasts.

The connection label reports `navigator.onLine`, which describes the device's network interface and not whether a site is reachable. Forma has no sync service, so this label only tells you whether font downloads and guide links can work. Editing and local saves continue offline.

## Workspace preferences

These are stored under `forma-workspace-preferences`, outside `.oui`, and Reset preferences clears them.

- **Flip objects while resizing** (off by default): a handle dragged past the opposite edge mirrors the layer, using the same flip fields as Flip horizontal and vertical. Undo restores it. Text, groups, the Scale tool and Motion keep the 1 px stop. Multi-selections flip around their shared box unless they contain text or a group.
- **Rotate with Command-Option** (off by default): holding both keys while dragging on the canvas rotates the current selection with the Move or Scale tool. Locked selections refuse it. Without the preference, that drag keeps its existing behavior. Other platforms have no equivalent binding yet.
- **Hide canvas UI during property changes** (off by default): selection outlines and handles hide while a number field is scrubbed, a slider or color field is dragged, or an inspector field receives input, and return 800 ms later. Artwork, selection and history are unaffected.
- **Smart quotes and symbols**: the existing preference is now in Preferences and also applies to inline canvas text. Text on a path, pasted text and composition keep their source characters.
- **Export file names**: layer name, file name - layer name, or page name - layer name. This covers Export dialog files and the files inside asset ZIPs. Suffixes stay last. Animation, PDF and Slides exports keep their own names.
- **Export destination**: browser downloads, or a save prompt for each export where the browser offers `showSaveFilePicker`. Cancelling exports nothing. If the prompt is refused, for example after a long render, the file goes to browser downloads with a message. The Mac app uses its own save panel, or the folder chosen in File → Export Destination, so this choice is not offered there.
- **Keep files in Trash**: until removed, or 7, 30 or 90 days. Past that age, Trash files and their named versions are permanently removed when the file browser opens. This cannot be undone. It runs only in the file browser, keeps any file open in an editor window this app can see, and never touches files outside Trash.

## File ownership, links and tabs

An owner label is local metadata, never an account. It records the local profile display name when a file is first saved on this device or duplicated. Files saved with no profile name, opened `.oui` files and imported projects show Owner not recorded until you choose Set owner in the file menu, which has Undo. Renaming your profile does not rewrite existing labels. Owner · A–Z sorts by label, then by name, with unrecorded files last.

Copy file link in the file menu produces the same opaque local link as Local links. Open in new tab (browser only) opens the file in its own tab, using a URL fragment that is cleared after load. A file open in this tab or in another tab is refused, because two editors on one document would overwrite each other's recovery copy. Detection relies on `BroadcastChannel` and a 150 ms reply window. The Mac app already opens each file in its own window.

## First run

On the first launch with an empty local library, the menu bar offers the canvas tour inline. It does not start itself, take focus, cover the canvas or edit anything. Taking or dismissing it records a receipt under `forma-first-run`; existing libraries record a receipt with no offer. The offer waits for Design mode with no dialog open and is hidden below 1000 px wide. Help → Learning & canvas tour stays available.

## Motion summary

The timeline carries a text summary of tracks, layers, keyframes, duration, frame rate and looping, referenced by `aria-describedby`. Timeline as text lists each track's layer, property, key count and time range, up to 100 tracks. The summary does not announce playback or edits.
