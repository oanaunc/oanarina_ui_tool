# Interface accessibility

This covers application-wide keyboard, focus, contrast and tooltip behavior in the shared web editor. `docs/DOCUMENT-ACCESSIBILITY.md` covers document-specific announcements and outlines. Everything here was validated in Chromium through Playwright. Native macOS VoiceOver, Full Keyboard Access and WKWebView behavior have not been acceptance-tested, and no file under `macos/` changed.

`src/components/InterfaceAccessibility.tsx` mounts once at the app root and owns these behaviors, so individual dialogs and panels do not reimplement them.

## Keyboard

F6 and Shift+F6 cycle the visible regions: menu bar, layers sidebar, canvas, toolbar and properties sidebar, or the Slides workspace. Collapsed sidebars are skipped, and an open dialog keeps focus. F6 is also how keyboard users leave the canvas, where Tab and Shift+Tab select sibling layers.

The menu bar follows the ARIA menu bar pattern and is one Tab stop. Left and Right move between menus, Down and Up open a menu at its first or last item, Home and End jump, and Escape closes and returns to the trigger. Tab order runs header, menu bar, layers, canvas. Each layer row's lock and hide buttons are still separate Tab stops, so long documents have long sidebars to Tab through; F6 skips them.

Validated keyboard-only paths include export through the dialog to a real download, and editing position, size, fill and color through inspector fields with arithmetic and Undo. Canvas-only gestures such as on-canvas gradient handles rely on numeric equivalents where those exist; not every property has been audited.

## Dialogs

`watchDialogFocus` in `src/focus-management.ts` tracks every `aria-modal` dialog. It moves focus in on open if the dialog did not, wraps Tab at the edges, pulls stray focus back, and returns focus to the opener on close. It works alongside dialogs that have their own handling. `tests/e2e/accessibility-sweep.spec.ts` opens 36 dialog states and checks names, initial focus, Tab containment, a visible indicator at each stop, Escape and focus return. All 29 components that render a modal dialog handle Escape.

## Focus and selection

The `--focus-ring` token gives a 2px outline on every focusable control, 3px in Increased contrast. The default light-theme ring moved from 2.3:1 to at least 3:1 against panels. Text fields previously relied on a 1px border change.

Selected and active states also change shape, not only color: an inset bar on pages and list options, a marker under the active tool, an underline on open menus and a bottom edge on pressed toggles. Tools report `aria-pressed`, and panel tabs report `aria-current`.

## Tooltips

Native `title` tooltips never appear for keyboard users. When a titled control receives keyboard focus, Forma shows the same text in a `role="tooltip"` bubble, linked through `aria-describedby` when it adds to the control's name. Escape dismisses it without moving focus. In the toolbar and top chrome that Escape is consumed; in dialogs and menus it also continues to the surface, so one press closes them. Pointer hover still uses the native tooltip. Bubbles ignore pointer events, so they cannot block a click.

## Error announcements

`notifyError` now also speaks through one assertive live region. Inline validation errors already use `role="alert"`. Other failures that are only passed to the toast store remain polite status messages, because the toast has no error type yet.

## Contrast

`tests/interface-contrast.test.ts` reads the shipped CSS tokens and computes WCAG ratios for text, accents and focus indicators on every surface, in both themes, Increased contrast and all accent choices. `tests/e2e/interface-contrast.spec.ts` measures rendered text against its composited background across the editor, menus, four dialogs and Home. Artwork, disabled controls and text over images are excluded.

Default `--muted` changed to meet 4.5:1: `#99949f` to `#a39ea9` in dark, and `#8f8897` to `#6b6473` in light, which was 3.4:1 before. Field and control boundaries meet 3:1 only in Increased contrast; the standard theme's subtle fields were kept as designed. Hover states and every dialog in the app have not been measured.

## Preferences

Preferences → **Accent and contrast** stores two device values outside `.oui`: `oui-interface-accent` and `oui-interface-contrast`.

- Accent has eight presets, each passing the same ratio checks in both themes, and in the Mac app **macOS accent color**. The shell sends the system color and sends it again when it changes. It moves toward white or black until it clears 4.5:1 on every surface of each theme, and text on it picks black or white the same way. Accents recolor focus, selection and active controls. Some older chrome and canvas selection overlays use fixed violet values that do not follow them.
- Interface contrast offers Follow system, Increase contrast and Standard. Follow system reads `prefers-contrast: more`, live. Increased contrast strengthens text, control borders and focus rings. Canvas selection keeps its own **High-contrast selection outlines** option.

Reset preferences clears both, along with the language.

## Error announcements

`notifyError` and any toast worded as a failure speak through one assertive live region, once. `isFailureMessage` in `src/error-announcements.ts` decides from the wording, because toasts carry no type. `tests/platform-preferences.test.ts` holds it to the failure toasts in the app today.
