# Local agent library context

Source MCP exposes `read_library_context` for the one saved `.oui` file explicitly
selected at server launch. It reads the shared validated document and returns its
SHA-256 revision. It never writes the file, changes editor selection or accesses
other project files, network catalogs or the operating-system profile.

The metadata index includes installed local-library dependencies and asset groups,
current publication/version history, independent main components and variant
sets, local styles, variable collections/modes, variables and layout-guide styles.
Rows preserve stable IDs and provenance. Disabled libraries and missing assets
remain visible with their status; this tool does not insert or update them.
Validated deprecation reasons are user-facing metadata and may appear, shortened
to the text limit. History includes the latest ten known versions and a count;
version descriptions are omitted. This is saved-file context, not discovery of
the browser's library cache or live cloud libraries.

Component summaries list up to 32 named property definitions and bounded direct
references from their authored/generated subtree: nested components, styles,
variables, selected modes, guides, exposed swaps and prototype actions. Nested
main definitions form explicit dependency links. Variables expose alias IDs and
mode IDs, not scalar values. Mode/individual-guide availability is explicitly
`unknown`; this tool does not infer effective values, evaluate expressions,
recursively expand dependency closures or promise that every reference can be
instantiated. Missing typed references report unavailable. Generated/managed main
copies are excluded from reusable rows and are not available component targets.

Node bodies, text content, paint/effect values, library edit baselines, images,
fonts, comments, annotations, author/profile data, prototype expressions/URLs and
unknown optional metadata are omitted by construction. Names and validated
deprecation text are still user data, never agent instructions. Other existing
MCP read tools have their own broader output policies; this metadata-only policy
applies to `read_library_context`.

Use `scope` (`all`, `local`, `installed`, `publication`), an optional installed
`libraryId`, `kind`, and a query over row names, kinds and IDs. Pagination defaults
to 25 rows, accepts 1–100 rows, and returns `nextOffset`. Every nonzero `offset`
requires `expectedRevision` from the preceding response. Changed files refuse
stale pagination; restart at offset zero. Stable ordering follows saved library
and document definition order for that revision. This is a read snapshot, not a
file lock against subsequent external edits.

Inspection visits at most 100,000 layers, retains 20,000 rows and permits 200,000
reference/metadata visits. Cached iterative parent traversal does not repeatedly
scan the page; nearest-main ownership paths retain cumulative depth and are
limited to 256 layers in either saved source order. Dependency
summaries retain 64 unique references per row. Metadata text is limited to 300
UTF-16 code units; identifiers over 512 units, empty identifiers and asset-valued
identifiers are omitted rather than truncated. Index limits and shortened names
produce diagnostics. Response pages stop before 2 MB of row JSON and return a
continuation offset; very large valid sources can refuse the inspection budget
without modifying the file.

Validation includes actual SDK stdio discovery, filtered metadata reads, revision
pagination/refusal, strict unknown-input rejection and byte-for-byte source-file
preservation. Synthetic secrets cover node/default/variable/style/version bodies,
author/profile fields and unknown embedded assets. Headless checks cover cached
20,000-layer ancestry, reference limits, namespace collisions, legacy-ID omission
and response pagination. UI-57-024 remains a local-source partial workflow with
reference verification pending. Native/plugin agent integration, remote libraries
and bundled-server distribution remain outside this change. No standalone MCP
bundle, native package or production build was generated.
