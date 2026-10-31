# Offline editable icon library

Resources / Actions → **Free icon library…** opens an installed snapshot of **1,951 Lucide 0.577.0 icons**. Multiword name search, 36-item pagination and a selected artwork preview keep catalog browsing bounded. Size, color, stroke weight and page-root position are configurable. The library works without an external marketplace, account or network font dependency.

Insertion uses the existing validated editable SVG importer. Every catalog entry has been checked to produce complete ordinary frame/path/line geometry without embedded images. An insert creates fresh IDs in one Undo step, preserves existing locked selections and survives `.oui` save/reopen. Design and Whiteboard are supported; a Whiteboard icon is ordinary artwork, without a special logical record. Slide-deck insertion remains disabled because slide ownership has a separate workflow. Existing selection and locked/managed containers are never insertion targets.

The catalog is a source asset generated from the installed, pinned `lucide-react` dependency by `node scripts/generate-icon-catalog.mjs`. The generator refuses a different dependency version pending review. The complete ISC license, including Feather MIT portions, ships at `public/licenses/lucide.txt` and is reachable from the dialog. Icon entries are library content, not 1,951 new feature-register requirements. This scoped implementation addresses UI-47-021; it makes no claim of matching Figma's external community or icon marketplace.

## Validation and limits

- The installed response is bounded by actual streamed bytes to 1 MB; catalog metadata, unique canonical names, primitive tags and geometry attributes are strictly checked before rendering. Unknown fields, active markup, external references and malformed names refuse with an explicit retry path. The catalog contains 457,243 bytes in this snapshot.
- SVG generation escapes attribute values and allows only seven ordinary shape tags. The importer and project validator run against an independent draft before the current document changes. Existing 20,000-layer page and 50 MB project limits apply.
- Size is 8–2,048 px, stroke weight 0.25–8 in the source 24 px basis, color six-digit hexadecimal and finite root position within ±1,000,000. The existing SVG importer may further refuse geometry whose translated coordinates exceed its bounds. Rejected input leaves document/history unchanged.
- Permanent document/page/selection/workspace/UI context receipts and synchronous option generations reject retained callbacks after source or option changes. Fresh controls recover. Fetch cleanup cancels late work after closing.
- Seven headless tests cover every icon's editable import, source independence, placement/ID remapping, `.oui` validation, malformed input and streamed limits. Six actual browser workflows cover search/pagination, rendered colored SVG pixels, locked selection, Undo/save/reopen, retained callbacks, retry, Whiteboard insertion and 125% short-window keyboard focus/Space/Escape.

These are source/browser checks. No new native package, release build, external marketplace round trip or exact Figma reference acceptance is implied.
