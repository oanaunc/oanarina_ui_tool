# Local profiles and named-version authors

Preferences → Local profile saves an optional display name and avatar on this device. The name appears in the file browser and initials/avatar appear in the editor and file browser. This is a user-entered local label, not a verified account, shared identity or cloud profile. No identity is inferred from the computer user.

Names are trimmed, NFC-normalized, limited to 120 UTF-16 units and reject control/bidirectional-override characters. Avatars accept PNG, JPEG or WebP files up to 10 MB and 16 million decoded pixels; bounded header inspection precedes actual browser decoding. A square center crop is re-encoded into a 128×128 PNG, stripping source metadata. Stored avatars accept only bounded embedded PNG thumbnails, never remote URLs or SVG markup. Codec failure falls back to the initial. Preparation has Cancel and a 15-second deadline; profile changes, Preferences departure and unmount invalidate late publication.

Save local display name explicitly commits its current draft. Avatar changes retain an unsaved name draft. Remove local avatar and Reset local profile affect only this profile. Existing project state, Undo history, file-browser organization, fonts and other preferences are preserved. Blocked storage fails before publication. Invalid existing profile data falls back for display without silently deleting its stored value; cross-window storage changes refresh current values. Old retained controls cannot overwrite a newer draft/profile or cross a Preferences session; freshly rendered controls can retry.

New named versions capture a copy of the current nonempty author name and optional PNG avatar **when saving starts**, before the asynchronous database open. Subsequent profile changes/reset preserve earlier author labels. Existing snapshots without an author remain valid and display “Author not recorded.” Author metadata is validated when listing/reading snapshots; malformed entries are hidden with diagnostics and retained in storage. Version previews show their own saved author, while restoring or duplicating uses only the saved design document.

The version author is optional metadata in the existing local snapshot record, separate from `.oui` artwork. No `.oui` version or IndexedDB schema version changes. Exported projects, clipboard transfers, MCP document data and duplicated designs do not acquire this device's profile or snapshot author labels. Structural version comparisons do not attribute individual edits.

UI-45-025, UI-45-026 and UI-38-017 remain **partial**, with reference verification pending: no authenticated identity, collaboration attribution, organization avatar management, historical edit authorship, remote sync or exact Figma/native acceptance is claimed.

## Validation

Six focused profile unit checks plus existing version-review checks cover normalized/bounded names, strict metadata, PNG headers, immutable author capture, corrupt storage, cross-window changes and blocked reads/writes. Actual browser checks cover local persistence/reset and artwork/Undo invariance; live second-window updates; real crop dimensions/pixels; draft preservation; invalid raster/storage refusal; retained controls and fresh retry; cancellation across unmount/session cycles; immutable authors and legacy snapshots; corrupt snapshot diagnostics without deletion; and native Enter/Space at 125% in a short window. Combined-source results are recorded in the checkpoint report.

No app/native build, package, release bump, notarization, downloadable archive refresh or website deployment is created. Native/system storage and assistive-technology acceptance remain separate from browser tests.
