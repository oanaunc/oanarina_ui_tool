# Boolean operations with outlined text

This stage implements a **partial UI-15-012** workflow: eligible text is converted to actual glyph-vector operands inside an ordinary live Boolean group. It is not live editable-text Boolean parity. No new persistent schema, font parser, native permission, network permission or MCP tool is added.

## Reachable workflow

Select 2–8 consecutive sibling operands, including 1–4 eligible text layers. In the Design inspector, open **Outlined text Boolean**, choose Union, Subtract from first layer, Intersect or Exclude overlap, and select **Review outlined text Boolean**. The review states the text/character/anchor counts and result area. **Apply outlined text Boolean** performs the complete conversion and Boolean creation in one normal edit.

Apply replaces each text layer with one ordinary path containing its real glyph contours, including counters/holes. Those paths and the ordinary vector operands become children of a normal live Boolean group. The result can be moved, resized, edited as vectors and released with the existing Release Boolean operation; ordinary operand changes continue to recompute the Boolean. Layer-array order determines subtraction. Sources must be consecutive siblings to avoid moving their stacking relationship across unrelated artwork.

**Text contents and typography cease to be editable as text.** The new glyph paths do not retain original text-layer metadata, style links or bindings. One Undo restores the entire original source document, including editable text and its original metadata; redo restores the Boolean. The destructive conversion and vector/raster distinction are shown before Apply. No hidden original text, duplicate child snapshot, automatic glyph-regeneration controller or screenshot fallback is saved. The direct ordinary Boolean commands give text selections guidance to this review workflow; their ordinary-vector behavior is unchanged.

## Actual glyph and font proof

New conversion always invokes the established [static-TTF glyph-outline pipeline](SVG-TEXT-OUTLINES.md), even if a text layer carries a current imported outline cache. Cached/imported paths never bypass proof in this workflow. The plan itself obtains the actual active managed browser faces; a caller cannot supply a fabricated font-context object to mint an authoritative plan.

At review and Apply, document-authored and registered face descriptors/bytes must agree. The exact managed FontFace must remain loaded and active, with complete coverage and no later ambiguous unmanaged same-family face. Restricted embedding flags, conflicting descriptors/bytes, synthetic/fallback faces and missing font readiness refuse. Every selected face's exact descriptor key, bytes and embedding flag are pinned; newly generated glyph paths/native positions must also match at Apply. No font is downloaded or licensed by this workflow, and no proprietary font is added. It uses existing authorized loaded assets only.

The supported pipeline is deliberately narrow: one displayed LTR line of printable ASCII, one exact static uncompressed TrueType `glyf` face per text operand, simple glyphs with the existing side-bearing/cmap/shaping proofs, nonnegative tracking, 1–4,096 design-unit font size and supported physical alignment. Unsupported GSUB substitutions, non-advance GPOS positioning, composites, variable/CFF/color fonts, WOFF2, arbitrary scripts, rich ranges, decorations, links, backgrounds, lists, paragraph overrides, text-on-path, clipping and unsupported typography refuse. Native browser layout supplies actual character origins after glyph identity is established. Headless new conversion refuses; already-saved ordinary vector/Boolean results need no fonts or browser to render or recompute.

## Source eligibility and bounded work

Sources require positive finite boxes, the same opaque solid visible fill, no visible stroke and independent leaf ownership. Existing components/instances/slots, vector networks, width/dynamic/calligraphic profiles, masks, clips, visible effects, automatic layout, forms/media ownership, affected Motion tracks and unsupported blending refuse before mutation. Common fixed affine ancestors and individual signed transforms are supported within the numerical guards. Source layer metadata is inspected before font or Paper geometry work.

Limits:

- 2–8 operands, 1–4 text layers, 64 characters per text layer and 128 total characters.
- 2,048 glyph points across all text operands, charged while decoding before the next glyph; one already-bounded glyph may be decoded before its cumulative charge refuses.
- 2,048 decoded input anchors across all vector/glyph operands; 8,192 result anchors, checked after each Boolean step; 512 compound subpaths.
- 256 KB cumulative generated glyph paths and 256 KB result path data; 2 MB source metadata.
- Ordinary vector operands: 512 saved anchors, 32 KB raw path input and a conservative 512 command-letter inspection each. Repeated coordinate batches can decode more than 2,048 anchors within the byte bound; they refuse **after bounded parsing, before any Boolean operator**, not under a claimed predecode-anchor guarantee.
- Existing font decoder limits remain 10 MB per static TTF and 20 MB decoded distinct font data for one preparation.
- 20,000 current-page layers, 100,000 total document layers, 1,000 pages and 64 acyclic ancestry levels.
- Finite controls/geometry within ±1,000,000 parent-coordinate units and a finite result world envelope within ±1,000,000. Empty filled results currently refuse explicitly.

The exact same existing Paper Boolean engine computes unions, differences, intersections and exclusions. It does not replace glyphs with text boxes. Real quadratic glyph curves become ordinary Paper path geometry with nonzero winding; compound glyph counters are retained.

## Numerical and rendering limits

Saved paths use the existing Paper five-decimal serialization. A preflight bounds amplification of the **known decimal-serialization stages** in design/world units, using the common linear matrix infinity norm:

- Text: half a six-decimal unit, amplified by the individual linear transform, plus half a five-decimal unit for the saved glyph operand and half for the saved live result.
- Ordinary vectors: conservative half-five-decimal input-contour rounding, amplified by absolute path-basis and individual linear transforms, plus half-five-decimal result rounding. Boolean intermediates are not serialized between operators.

The predicted maximum per-axis serialization contribution must be at most **0.01 design/world units**. This corresponds to 0.01 at 1×, not a screen-pixel promise at arbitrary editor zoom or export scale. Common/individual linear and path-basis conditioning is limited to 10,000; nonfinite/collapsed bases refuse. Negative legacy path bases use their absolute amplification without changing legacy renderer/model semantics. Tiny local geometry under a huge parent scale can therefore refuse even if its final world box is otherwise within bounds.

This is not a full numerical proof of Paper's intersection, arc conversion or winding algorithms. Font hinting, quadratic/cubic rasterization, curve intersection and ordinary antialiasing can produce edge-pixel differences. The output consists of unhinted vectors. There is no arbitrary-font/Figma-raster equivalence claim. Actual tests distinguish independent raster compositing from exact equality of the current shared Canvas/export renderer.

## Atomicity, compatibility and interchange

Deep source/file/parent receipts and private minted plans prevent forged or changed-source application. Apply recomputes font/glyph proof, then grants a one-use authorization which expires at the next microtask. It immediately enters the ordinary store transaction; that transaction retains every existing model/controller preflight and final validation. A final validator requires the group and all operands to equal the reviewed nodes exactly and the reconstructed original ancestry/source receipt to match. Controller-induced changes refuse the entire edit.

The inspector tracks permanent source, selection, mode, modal, Motion, font-revision and UI-scale proof, plus immutable local operation/review state. Retained callbacks cannot apply across away-and-back transitions. Blur, hidden document, resize, source changes or local choices invalidate the review and require a fresh current review. Exact active-font proof is repeated on Apply even if an external FontFace change did not publish a normal app revision.

Output uses only established ordinary paths and live `booleanOp` groups, so `.oui` versions 1 and 2 require no migration. Normal save/reopen, clipboard, SVG export and headless Boolean recomputation use existing behavior. SVG output for the resulting vector-only fixture contains neither `<text>` nor font data. Existing Bridge handling for ordinary paths/Booleans applies; there is no new direct binary `.fig` support and no claimed real Figma desktop round trip.

## Reference distinction

The official [Figma Boolean operations reference](https://help.figma.com/hc/en-us/articles/360039957534-Boolean-operations) permits text operands and retains a non-destructive Boolean group. Forma's stage is narrower: the Boolean remains live, but text is first converted destructively into vector operands. Figma's [text-to-vector reference](https://help.figma.com/hc/en-us/articles/360047239073-Convert-text-to-vector-paths) separately describes that loss of text/typography editability. Forma does not claim their combined full behavior or arbitrary font support. Recommend **partial** for UI-15-012; fully live editable text operands remain unimplemented.

## Verification

Headless tests use the bundled open-license Lato TTF's actual O contours, including its counter, and exercise subtraction, signed individual/shared transforms, normal `.oui` path parsing, source ownership/stacking/refusals, cached-outline bypass refusal, aggregate glyph/vector/path/project budgets, malformed imported glyph metadata, source-order-independent ancestry, same-task authorization, huge common transforms, conditioning and valid negative legacy bases. Existing geometry/text-outline tests run alongside them.

Actual browsers cover review without document mutation; one Apply Undo restoring original full text and metadata after font readiness; save/reopen/redo; local/shared signed glyph-hole subtraction; exact current Canvas/export RGBA agreement; independent destination-out raster references with zero hole alpha and no distant painted-silhouette errors; source/font/local away-and-back callbacks; a deliberately different late FontFace and recovery; aggregate glyph limits/substitution refusal; live vector operand edits/Release; malformed file import; layer stacking; expired/forged authorization; atomic post-derive style interference; high-scale refusal; and native keyboard controls at 125%.

No app build, bundle, installer, native package, archive, version, download or website change is part of this source stage.

Final frozen-source validation: 2,396 headless tests in 213 files passed; 31 focused domain/geometry/text-outline tests passed; 42 actual browser cases passed (18 Boolean-text plus 24 existing SVG-text-outline cases); editor and source MCP TypeScript passed. The shared decoder's absent/default point budget and its prior refusal message remain unchanged. Both root and an independent peer reviewed the final kernel/control/rounding guards without a remaining concrete blocker. Private managed port 5384 is stopped.
