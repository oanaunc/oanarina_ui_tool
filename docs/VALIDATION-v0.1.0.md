# v0.1.0 preview validation

October 29, 2026.

- TypeScript and production Vite build: pass.
- Core document and Figma API mock tests: 19 passed.
- Browser interaction tests: 5 passed at desktop and compact viewport sizes.
- Website: product/guide/privacy render; register contains 1,860 entries; search returns matching entries; no page JavaScript errors; mobile viewport has no horizontal overflow.
- Native production smoke: 146 buttons, 1,860 register entries, 1,959 Google Fonts families, 179 installed Mac font families, native bridge active.
- Universal executable: arm64 and x86_64. Runtime verification performed on Apple silicon only.
- npm audit: no known vulnerabilities reported at validation time.
- Developer ID signatures verified. App and DMG notarization: Accepted. Both tickets stapled. Gatekeeper accepted app and DMG as Notarized Developer ID.
- Installer size: 14.0 MB.
- Installer SHA-256: `9598b4a3939e54c8e471d9daa0dec8ed24c25e91dc687c09135a84d16b8e9bc6`.

Figma editor UI was inspected in the signed-in browser. The bridge's actual Figma desktop development-plugin installation and full round-trip remain unverified; current tests use an API mock. None of these checks establish full Figma parity.
