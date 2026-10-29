# Fonts

The local catalog contains **1,959 open-source Google Fonts families**, retrieved from [Google's official metadata endpoint](https://fonts.google.com/metadata/fonts) on October 29, 2026. This is a dated snapshot. Name/category/script search, popularity/alphabetical ordering and Google family favorites work without sending design content to Google. Custom preview text, weight and italic controls are available. Additional font previews download CSS from `fonts.googleapis.com` and font files from `fonts.gstatic.com`; downloaded files are cached in IndexedDB. A loading state and actionable errors are shown if a download fails.

## Offline and installed fonts

The **24 bundled families** are Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Raleway, Nunito, Work Sans, DM Sans, Space Grotesk, Plus Jakarta Sans, Playfair Display, Cormorant Garamond, Lora, Merriweather, Libre Baskerville, Bebas Neue, Oswald, Caveat, Dancing Script, Pacifico, JetBrains Mono and Fira Code.

The bundle includes **123 genuine italic font files across 17 families**: Cormorant Garamond, DM Sans, Inter, JetBrains Mono, Lato, Libre Baskerville, Lora, Merriweather, Montserrat, Nunito, Open Sans, Playfair Display, Plus Jakarta Sans, Poppins, Raleway, Roboto and Work Sans. Families without italic files may use the browser's synthetic italic. On-demand Google requests include the actual normal/italic styles and variable weight ranges available in the snapshot metadata.

Each bundled family includes its full original OFL license in `public/fonts/*-OFL.txt`. These licenses ship with the Mac app. Further on-demand fonts retain their original open-source licensing; [Google Fonts' source repository](https://github.com/google/fonts) supplies per-family source/license files. The font library links the bundled family license. Downloading fonts does not install them into macOS or Figma.

The native installed-font tab obtains family names through NSFontManager. It does not copy or redistribute installed font binaries. Commercial fonts can be used when separately installed/licensed; they are not bundled with this app. Installed-family detection is native Mac functionality; the browser library offers font-file import instead.

## Local font files and missing fonts

Individual **TTF and OTF** files can be imported, previewed, applied and retained in the local font cache. Import reads the OpenType `name`, `OS/2` and optional `fvar` tables to identify family, weight range, italic style, license text and embedding permissions. Files are validated before registration; one file is limited to 20 MB, and an import to 100 files/100 MB. Font collections and compressed WOFF/WOFF2 local imports are not supported. Imported files that permit embedding can be exported with their original bytes.

Embedding follows OpenType `OS/2.fsType` metadata: installable/editable embedding permits project/SVG embedding; restricted-license, preview/print-only or bitmap-only embedding flags prevent inclusion in editable projects and font-file exports. A missing OS/2 licensing table also prevents embedding. Such fonts remain usable on the current device. Font metadata does not replace the owner's font license.

The top bar warns when a document uses missing font families. Its Resolve action opens the **Document fonts** audit. The audit lists uses across pages, offers downloads for known Google families and replaces all uses—including local text-style references—with an available family. Replacement supports Undo. The warning clears after an imported/downloaded face becomes available. Concurrent registration uses per-face generations so an older asynchronous load cannot overwrite a newer request; reopening revised embedded fonts with the same document ID also refreshes them.

Missing-family detection does not audit every missing weight, glyph, OpenType feature or arbitrary variation axis. Native/application fallback may still be used for unsupported glyphs or styles. Those typography parity requirements remain separate work.

## Portable exports

Explicit `.oui` saves embed the available **used weight/style faces**, including the chosen faces of local text styles. Variable weight files cover all used weights within their range. Text layers select the Unicode-range files needed by their text; text-style metadata retains all available script files for its chosen face so that style can be used offline. The app embeds complete original files; it does not alter/subset font binaries. Unsupported italic uses an available normal fallback. Restricted files and installed proprietary font files are excluded.

SVG and rendered image exports select fonts for the exported text layers. The older family-wide font API remains available for callers that explicitly need all loaded faces. A project above **50 MB in UTF-8 bytes after font embedding is rejected before the download/native writer is invoked**; reduce embedded images or split the document. Reopening a minimal embedded italic file in a fresh browser context with font downloads blocked is covered by a browser test. Recipient SVG applications differ in embedded-font support. The Figma Bridge cannot install fonts and still requires the family/style to be available in Figma.

## Rebuilding the catalog

Use an explicitly saved response from the official metadata endpoint and its retrieval date:

```sh
node scripts/fonts.mjs --metadata /absolute/path/google-fonts.json --snapshot-date 2026-10-29T16:10:09.913Z --reuse-assets
```

`--reuse-assets` makes no network requests, retains the verified normal/italic binaries, stylesheet and licenses, and validates that the expected files exist. Without `--snapshot-date`, the existing catalog retrieval timestamp is retained. Omitting `--reuse-assets` downloads normal and available italic faces through the official CSS API and the original OFL files from `google/fonts`. Download mode stages all font/license data before publishing, and records each immutable font URL and SHA-256 in the new manifest. It fails for missing/unexpected licenses or missing style faces. It is a maintainer command, not an automatic live catalog refresh button.

The format follows the official [Google Fonts CSS API](https://developers.google.com/fonts/docs/css2) and [OpenType table specification](https://learn.microsoft.com/en-us/typography/opentype/spec/). Per-behavior implementation/reference statuses remain in the feature register.
