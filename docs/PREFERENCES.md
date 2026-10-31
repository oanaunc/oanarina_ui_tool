# Local preferences

Open **File → Preferences…**, press **Command-comma**, or use the Mac application's Preferences command. These settings belong to the current app/browser on this device. They are stored outside `.oui` documents, so importing, saving, undoing or sharing a project does not copy someone else's preferences. The native Mac app and a browser preview have separate local origins and therefore separate settings.

Changes save immediately. **Reset preferences** restores the defaults below while preserving project data and existing artwork. Corrupt, unsupported-version or oversized stored data falls back to validated defaults. If local storage is blocked or full, the dialog reports the failure and does not claim the new value was saved.

## Appearance

**Interface appearance** offers Dark, Light and Follow system. The initial default remains Dark; an existing saved Light/Dark choice is preserved. Follow system responds immediately to the device's `prefers-color-scheme` changes. It colors the interface and the theme-based canvas backdrop; explicit page backgrounds and artwork colors keep their saved values. It does not rewrite `.oui`, dirty the document or add Undo entries.

**View → Toggle light / dark theme** chooses the opposite explicit theme and leaves Follow system. The preference survives reopening and changes propagate between open editors on the same origin through storage events. Reset preferences returns appearance to Dark. A denied storage write reports an error and preserves the current choice. The legacy local key `oui-theme` stores only `light`, `dark` or `system`; no migration of project data is required.

The media-query binding is shared browser code used by WKWebView. Browser emulation and real same-origin storage-event tests cover its behavior; the native integration run changes the application appearance while running and confirms the actual WKWebView and editor theme follow in both directions. Accent colors, increased contrast and UI scaling are separate requirements.

## Movement and drawing

- **Small nudge / Large nudge:** arrow keys use the small distance, while Shift-arrow uses the large distance. Defaults are 1 and 10 pixels. Both can be customized, including fractional distances.
- **Rotation snap increment:** Shift-dragging the rotation handle uses this angle in degrees. The default is 15°.
- **Keep drawing tool:** retains a drawing tool after placing a shape, text or completed pen path, so the next placement can use it again. The default returns to selection/move.
- **Highlight hovered layers:** controls the eligible-layer outline under the pointer.
- **Show selection dimensions:** controls the width × height badge; it does not hide the selected artwork's outline or resize handles.

## Navigation

- **Zoom with wheel:** plain wheel/trackpad scrolling zooms when enabled; otherwise it pans. Command/control scrolling continues to zoom. The default is plain scrolling to pan.
- **Zoom sensitivity:** multiplies wheel zoom speed; 1 is the original speed. Values range from 0.05 to 5.
- **Invert zoom direction:** reverses the wheel zoom direction.
- **Pan with right mouse button:** enables right-button dragging to pan. An ordinary right-click layer menu is disabled in this mode; Control-click remains a context-menu path. The default leaves the normal right-click menu available.

## New artwork defaults

Frame fill, shape fill, filled-shape stroke enablement, stroke color and width are configurable. Frame/shape fills can be transparent. Lines, arrows and pen/freehand paths retain a visible stroke color/width even when filled-shape strokes are disabled; a deliberately chosen zero stroke width is still respected.

New text has configurable color, family, size, numeric weight, normal/italic style and line height. Choose a family available through the app's font workflows. Saving a default family does not install a font. Placing text may use the normal font loading/fallback behavior; font licensing and embedding permissions remain unchanged.

These defaults affect caller-integrated creation paths, including canvas drawing and the editor's node-add helper. Explicit properties supplied by templates or other insertion actions take precedence. Existing layers keep their properties when preferences change or reset. A palette/template may intentionally specify its own design values.

## Trackpad, outlines, notifications and the local helper

These are stored with the workspace preferences, outside `.oui`.

- **Pinch to zoom** and **Pinch speed** control the Mac app's trackpad pinch. Speed is an exponent on the gesture's scale, so pinching out and back returns to where it began. No physical trackpad was exercised.
- **Outline rendering** is Layer shapes or Legacy bounding boxes for View → Outlines. Mask outlines keep their shapes.
- **Status messages stay for** sets how long a message stays at the bottom of the window. Forma posts nothing to Notification Center.
- **Allow live context for the local MCP helper** stops every window sharing and disables Resources → Share Live Editor Context with MCP when cleared.

Forma runs no background helper, so there are no helper accessibility settings: it asks macOS for no Accessibility permission.

## Validation and implementation

`src/preferences.ts` exposes a frozen typed snapshot through `getPreferences`/`usePreferences`, plus `updatePreferences`, `resetPreferences`, `reloadPreferences`, subscriptions and `drawingDefaults(type)`. The local key is `oui-preferences`, with a version-one envelope. Booleans, color syntax, font strings, finite numeric bounds and known keys are validated before a write. Unknown keys and prototype-pollution fields cannot become settings. Browser storage events refresh subscribed views across windows of the same origin.

`tests/preferences.test.ts` covers defaults, immutable snapshots, versioned persistence/reload, invalid/corrupt data, reset isolation, cross-window notifications, blocked storage and creation properties. `tests/e2e/preferences.spec.ts` exercises actual dialog controls and consumers: custom nudge, shape/frame/text defaults, retained tools, hover/dimension visibility, wheel speed/inversion, right-button pan and context menu behavior, custom Shift rotation, saved/reloaded settings, reset without changing project artwork, and recovery from corrupt stored preferences.

This implements a defined local preference set. It is not a claim of complete Figma settings parity. Accent controls, cursor choices, UI scaling/language, pressure/touchpad calibration, configurable native shortcuts and broader system integration remain separate requirements.

Canvas gesture, export naming, export destination and Trash retention choices are stored separately. See docs/EDITOR-SHELL.md.

## Language, accent and contrast
