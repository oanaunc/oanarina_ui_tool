# Bundled release history

Open **Help → Release notes**, or find **Release notes** in Actions. The panel shows the app's reported version, a dated bundled history, development/preview labels, changes and scope notes. It does not edit a project or create Undo history.

Development entries have no installer link. A downloadable preview entry can show its public Mac installer, file size, notarization label and SHA-256 checksum. Opening that link uses the browser; installing an earlier preview remains an explicit user choice. The panel does not silently update or replace the application. The bundled history is a snapshot, not a live update check; update discovery and native updater integration remain separate requirements.

`public/release-notes.json` is packaged with the editor, so reading it requires no account or external release API. Maintain it alongside a release: describe an artifact as notarized only after the app and DMG have Accepted results, stapling and Gatekeeper validation. The current development entry and the public dev.8 preview remain distinct while dev.9 native acceptance is pending.

The parser bounds entries and text, rejects duplicate versions, disallows development download links and restricts installer links to the public Oanarina UI Tool download directory over HTTPS without credentials/query/fragment. Invalid or unavailable bundled data displays an error with Retry; no unvalidated download link is shown. Notes render as plain text.

`tests/release-history.test.ts` validates the shipped history and unsafe metadata rejection. `tests/e2e/release-notes.spec.ts` checks Help and Actions, exact source/preview labeling, read-only saved bytes/Undo and failed-load Retry. Native Help-menu placement and live version checking are outside this panel's browser acceptance.
