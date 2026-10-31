# Interface language and locale formatting

Forma's web interface runs on a small typed translation layer in `src/i18n.ts`. It has no dependency and no network access. The language is a device preference stored in local storage under `oui-language`, outside `.oui` files, Undo and project history.

## Using it

Wrap a visible string and read it during render:

```ts
import {t,tn,formatDateTime,formatNumber} from '../i18n';
t('Save project');
t('Open {name}',{name:doc.name});
tn(files.length,'{count} file','{count} files');
```

The English source string is the key, so `t()` returns it unchanged in English. The role-name selectors in the browser tests depend on that. Text with no translation falls back to English per string, so wrapping a label can never produce a blank control. `Editor` subscribes at the root and re-renders the tree when the language changes, so components only need the import. A `memo` component must call `useT()` itself. Translate at render time, not in a module-level constant: keep the English key in the constant and call `t(labels[id])` at the use site.

## Catalogs

- `src/i18n/messages.ts` is the English source catalog and defines the `Message` type.
- `src/i18n/ro.ts` is typed `Record<Message,…>`, so a message missing from Romanian is a compile error.
- `src/i18n/ar.ts` is typed `Partial<…>` and covers menus, tools and main chrome only.

To add a language, add a catalog file and one row in `languagePacks`. `t()` also accepts strings outside `messages`, which keeps adoption cheap: new text shows in English until it is added to the catalogs. `tests/i18n.test.ts` checks that every Romanian entry keeps its placeholders and uses comma-below ș and ț rather than the cedilla forms.

Plurals use `Intl.PluralRules`. A catalog keys the English plural and may give each CLDR category. Romanian has three: `1 fișier`, `2 fișiere`, `20 de fișiere`.

## Coverage

Coverage is measured, not estimated. `tests/i18n.test.ts` counts `t()` calls with a Romanian entry against JSX text and label attributes still written directly in `src`. At this writing that is 446 of 2,529 occurrences, or 17.6%. Every command, menu group and toolbar tool is translated. Preferences, the action palette, Home, file information, text search, shortcut help and the keyboard dialogs are translated, and `tests/e2e/localization.spec.ts` fails if a catalog string appears there in English. Inspector panels, canvas and layer context menus, the document outline's rows, toasts, most validation messages and long-form dialogs such as Figma transfer stay in English.

The Mac menu bar is native and defined in `macos/main.swift`. It stays in English, so localized menu text applies to the web menu bar only. The Romanian and Arabic catalogs were written for this project and have not had native-speaker review. Arabic is labeled as a preview.

## Dates and numbers

Display dates, counts and percentages go through `formatDateTime`, `formatNumber` and `formatPercent`. In English these use the device region, matching earlier behavior. Other languages use their own conventions: Romanian shows `31.10.2026, 10:23`, `1.234,5` and `60 %`. Arabic keeps Western digits so chrome matches numeric fields.

`NumberField` shows the language's decimal mark and accepts it on input, including inside arithmetic such as `2,5*2`. Point input stays valid, and `1,2,3` is still refused. Stored values are ordinary numbers, so changing language never changes a document. Raw numbers elsewhere in the inspector, such as dimension badges and `toFixed` readouts, are not localized yet.

## Right-to-left layout

A right-to-left pack sets `dir="rtl"` on the root element. Flex and grid rows mirror automatically, and `src/components/rtl.css` covers the physical offsets in older stylesheets, so left-to-right layout is unchanged. Sidebar resizing and arrow keys in the toolbar and menu bar follow the visual direction. English and user-named text keep their own reading direction through `unicode-bidi: plaintext`.

The canvas stays left-to-right, so artwork coordinates, rulers and text layers are identical in every language. `tests/e2e/localization.spec.ts` asserts that artwork geometry matches English exactly.

Stylesheets for Slides, Whiteboard, Motion and prototype panels have not been audited for right-to-left use.
