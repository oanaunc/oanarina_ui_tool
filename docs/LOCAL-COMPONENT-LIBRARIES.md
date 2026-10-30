# Local published component libraries

Unreleased source. This is a local snapshot workflow, separate from Figma reference
acceptance. It does not implement cloud library hosting, team permissions,
organization approval, analytics or live collaboration. Existing downloads and
native releases have not been rebuilt.

## Reachable workflow

In the Design Assets panel, expand **Libraries**. **Publish current file** prepares
all reusable main components/complete variant sets, local styles, guide styles and
variable collections. Name, positive integer version and a description are saved
in an immutable snapshot. Unrelated page artwork and comments are excluded. The
source file records publication history in one Undo step. Download a
`.forma-library.json` file from the cached version history and import that file in
another document. Importing a snapshot caches it; it does not modify the document
until **Enable library in file** or an update acceptance action.

Available libraries have version history, descriptions, manual review/download
and explicit cache removal. Search and page through the asset list. Component
previews use standalone SVG images, so SVG definitions cannot collide with the
live canvas. Style, variable and guide definitions have bounded textual previews.
A set preview/insertion uses its default component; the ordinary local component
browser can inspect the other installed variants. Large previews explicitly
refuse instead of rendering incomplete artwork.

Enable installs editable cached definitions on a dedicated library page and
saves a dependency with stable source-to-local IDs. **Insert linked instance**
creates a real linked component instance at the visible canvas center.
**Go to cached source** navigates to its editable main. The existing style/token
inspector can use installed shared styles and variables. Disable blocks this
library widget's insertion and suppresses its update notification; definitions,
instances and their links remain editable. Cached definitions remain visible in
the ordinary local asset browser, even while the library widget is disabled.

Import a newer local snapshot to receive a local update notification. Review
shows per-group added/changed/unchanged/removed state, local conflicts, installed
version, bounded before/after previews and layer/scalar-change/instance counts.
Accept selected updates automatically includes the displayed required dependency
groups. Accept all includes all incoming groups and source-removal records. Each
acceptance is one Undo step and survives `.oui` save/reopen. Ignore suppresses
that snapshot's notification, while manual review remains available. No folder
watching, network polling or automatic acceptance occurs.

Source-removed groups retain cached definitions and receive a missing-source
status. Missing cache files have a separate notice; editable consumers continue
to work. Explicit cache removal never deletes saved files, installed definitions
or consumer artwork. Publication history and accepted source history are bounded
lists of immutable local versions, rather than a remote audit service.

## Data, update ownership and safeguards

Optional `libraryPublication` and `componentLibraries` metadata are additive in
`.oui` versions 1 and 2. Legacy files keep absent fields absent. Packages have a
validated schema-one manifest and closed reusable graph. Nested components,
preferred/swap references, all-mode aliases, styles, variables, guide links and
component property IDs are remapped consistently. SHA-256 fingerprints describe
content equality; they are not publisher authentication or signatures.

Accepted definitions have exact local edit baselines including page ownership.
Updates refuse locally changed definitions, moved definitions, inherited locks,
managed ownership and removal/type changes that would discard instance overrides
or saved component property values. Existing root placement and lock values are
retained; child edits are conflicts. External instance overrides remain owned by
the consumer. A private exact-origin install proof skips override tracking only
for the replaced definition IDs, so changed nested source instances do not invent
consumer overrides. Final normal component/style/layout derivation, reference
checks and full project validation run before the atomic commit. General MCP
editing does not acquire a privileged install path.

Removing installed variables/modes is conservatively refused. Removing source
asset groups never silently deletes local definitions. Changes that orphan
surviving consumer component, preferred, property or prototype references refuse.
There is no automatic merge/force-overwrite/detach conflict resolution. Rollbacks
can be explicitly reviewed as an older cached snapshot, with the same safeguards.

Cross-document clipboard transfer creates ordinary local editable definitions
and displays an ownership notice. It does not transfer publication/dependency
ownership; forged clipboard ownership metadata is refused. Same-document consumer
page copies keep their original linked mains. A copied definition page (or local
copy/duplicate of a definition) creates local copies and displays a notice; the
original dependency maps continue owning only the original definitions.

Document-changing controls require the live Design Assets context, outside Motion,
Home, hidden UI and other modal contexts. Source document/page/selection/mode/tab
changes invalidate retained handlers, including away-and-back changes in one
event. Asynchronous import/publication checks its origin again after each await.
Slides library use is refused. Package/source parsing and baseline shape/JSON/
budget checks precede document mutation. UI comparison/refusal errors stay in the
library widget rather than crashing the editor.

## Fonts and rendering limits

Only affirmatively redistributable fonts may enter a package: an explicit
OFL-1.1, Apache-2.0, MIT or CC0-1.0 SPDX declaration, or the recognized SIL Open Font
License / Apache 2.0 license title. `embeddable: true`, installed status or user
origin alone do not grant redistribution permission. Other font references stay
in the graph with an install-licensed-font notice. Packages do not silently bundle
commercial fonts. No font catalog or proprietary user font files are published.

Previews preserve the reusable source layout; metrics can differ when source
fonts are unavailable. Component source placement is its own reusable coordinate
system, not unrelated surrounding page artwork. Variable-dependent prototype
expressions/conditional actions explicitly refuse publication until a faithful
expression remap exists. Package graphs have no source page flows or Motion data.
The Bridge validates optional metadata and reports its omission; cached components
transfer as local Figma definitions. Existing editable style/token Bridge
materialization limits still apply. API mocks are not a real desktop round trip.

## Bounds

- Snapshot 20 MB, reusable graph 20,000 layers, hierarchy depth 128; 512 asset groups.
- Source/destination inspection 100,000 layers; destination hierarchy lock walk 256.
- Cumulative destination subtree traversal 100,000 visits and canonical comparison
  20 MB; canonical traversal 2 million entries / depth 256 per value.
- At most eight dependencies and 30,000 qualified reference maps per document;
  cumulative saved baseline strings 12 MB. Project result still must fit 50 MB.
- Cache: 128 snapshots, 50 per family, 200 MB total. No automatic pruning.
- At most 1,000 variants per set / 10,000 total; full closed sets are required.
- Lists show 24 asset groups per page; previews require at most 256 layers,
  200,000 text/path/point/range units, 8,192-unit extents and 4 MB rendered SVG.
- Version histories/ignore lists retain 50 entries. Change detail shows at most
  50 field names, with an explicit 2 million property work refusal.

## Validation and register recommendations

Source checks: `npm test` (1,743 core tests / 143 files), editor `tsc --noEmit`,
`npm run mcp:check`, and `node scripts/test-mcp-source.mjs` (62 source MCP tests).
`tests/local-component-library.test.ts` covers reusable graph closure, font
permission, SHA vectors, stable remapping, styles/all-mode aliases, nested/direct
consumer overrides, destructive conflicts, page moves, missing definitions,
metadata compatibility/atomic malformed rejection, clipboard/page ownership,
private override proof, Bridge preflight/report and source MCP persistence.

Nine focused actual browser cases and 28 adjacent component-assets, page,
native-clipboard mock and design-system browser cases pass. The focused suite
covers publication/download privacy and Undo,
import/search/isolated preview/enable/linked insertion/save, reviewed update
acceptance preserving overrides, disable/ignore/missing cache, malformed `.oui`
baselines through Open, retained context cycles, concurrent immutable cache
writes, 24-row pagination and keyboard controls at 1280×720 / 125% UI scale.
The selected-dependency workflow additionally verifies actual Canvas paint,
style/token consumers across save/reopen/source update, and locked-definition
refusal. No source/archive parity claim is made: the test
`the downloadable bridge archive contains the current component transfer implementation`
is deferred under the user's no-build/archive freeze. Native shell smoke,
notarization and real Figma plugin round-trip acceptance remain pending.

Suggested register outcomes (parent reconciles centrally): UI-29-006 through 018,
026 and 036 have real local snapshot paths; retain **partial** where the named
requirement assumes hosted/team libraries, live detection or unrestricted graph
updates. Description/version/search/history/ignore controls themselves are
implemented for the explicit local scope. UI-29-013 remains partial due bounded
preview/set/default/font limitations. UI-29-035 remains partial: conflicts are
identified and safely refused, with no interactive merge. No claim for 019–025,
032, permissions, analytics, organization approval or library-source replacement.

## Automatic font reflow follow-up

A late embedded font can legitimately change auto-sized text and hug component
geometry after installation. `refreshFonts` now captures exactly clean cached
component/set groups before its existing synchronous font/layout/component
recalculation. A private, one-use receipt binds that immutable source document
and unchanged library ownership/version/maps metadata. Only those previously
clean groups receive the resulting derived baseline. Explicit edits, page moves,
geometry edits and existing conflicts keep their original baselines; ordinary
editing never invokes this path. No override tracking bypass or MCP capability
is added.

Pre-existing baselines must remain untouched during derivation, clean definitions
must remain present, and metadata/project budgets are checked before publication.
The existing refresh failure catch retains the live document and Undo history,
bumps only the font revision and reports that text reflow could not be applied.
The operation shares the existing 100,000 cumulative subtree visits / 20 MB
canonical baseline budget, bounds ownership metadata inspection at 20 MB, and
retains 12 MB aggregate baselines and the 50 MB project result limit.

Four focused core checks cover clean versus edited baselines, page moves,
geometry conflicts, normal editing, forged/reused/changed-ownership receipts and
atomic bounded refusal. Two actual browser checks delay registration of an
embedded open-license face: real text/hug widths change after loading, the clean
main remains updateable, consumer overrides survive source v2 with one Undo/save,
and an explicitly edited source remains conflicted. The 28 adjacent fonts,
loading-context and local-library browser checks also pass. Native and Figma
reference acceptance are unchanged.
