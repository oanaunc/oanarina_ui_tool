# Fonts

Catalog: 1,959 open-source Google Fonts families retrieved from https://fonts.google.com/metadata/fonts on October 29, 2026. It is a snapshot, not a promise to include fonts added after that date. Search is local; on-demand previews fetch font CSS from `fonts.googleapis.com` and binaries from `fonts.gstatic.com`. No design content is included in those requests. Designer and script metadata is shown in the library.

Offline families: Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Raleway, Nunito, Work Sans, DM Sans, Space Grotesk, Plus Jakarta Sans, Playfair Display, Cormorant Garamond, Lora, Merriweather, Libre Baskerville, Bebas Neue, Oswald, Caveat, Dancing Script, Pacifico, JetBrains Mono, Fira Code.

Each bundled family includes its original OFL license in `public/fonts/*-OFL.txt`. These files also ship inside the Mac app. Additional on-demand fonts retain their original open-source licenses; their Google Fonts family page and https://github.com/google/fonts provide source and license details. Downloaded families are not automatically installed into macOS or Figma.

The native font tab discovers installed family names through NSFontManager. It does not copy or redistribute proprietary font files. Popular commercial fonts can be used when installed and licensed by the user. The application cannot legally bundle every commercial font.

Explicit project saves embed available downloaded/bundled font data for the families used in the document. Embedded fonts are restored when opened. Available fonts can also be embedded in SVG exports; recipient applications differ in support. The bridge cannot install fonts into Figma. Its font fallback report remains important.

The catalog refresh helper `scripts/fonts.mjs` currently expects the metadata snapshot at `/tmp/oanarina-google-fonts.json`. Download a new snapshot explicitly, then run that script to rebuild the catalog, offline assets and licenses. Downloads fail if a required license is missing.
