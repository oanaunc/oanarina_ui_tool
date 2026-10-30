# Frame presets and inspector actions

This implementation adds real editor paths in the Assets sidebar and single-frame Design inspector. It does not change the document format, native permissions, or Figma binary export.

## Presets

Assets → Frame presets groups existing desktop, phone/tablet and social sizes with three Watch sizes, six Paper sizes, and three Presentation aspect ratios. Asset search matches preset names, categories and dimensions. Selecting a preset creates an editable ordinary frame through the existing insertion transaction and fits the viewport; Undo removes that insertion.

Watch dimensions are logical interface pixels (184 × 224, 198 × 242, 205 × 251), not physical display resolution or a guarantee of device-specific safe areas. Paper presets round physical dimensions at 96 CSS pixels per inch: A5 559 × 794, A4 794 × 1123, A3 1123 × 1587, US Letter 816 × 1056, Legal 816 × 1344 and Tabloid 1056 × 1632. These are RGB canvas sizes; CMYK, bleed, physical print calibration and printer support are separate features. Presentation frames are 1920 × 1080 (16:9), 1024 × 768 (4:3), and 1920 × 1200 (16:10).

## Frame inspector

- **Swap orientation** exchanges authored width and height without rotating artwork. It keeps the frame center fixed, sets fixed sizing, and uses existing child constraints/layout behavior for the new size. Size limits, inherited locks, managed instance descendants, generated workspace frame ownership and auto-layout placement are guarded.
- **Select frame contents** selects visible unlocked **direct children**, in front-to-back layer order. It skips hidden and inherited-locked children and does not recursively select grandchildren. It changes selection only, with no document edit or Undo entry.
- **Fit frame to content** uses the union of all direct child rectangular geometry in the frame's own axes, including hidden children and child rotation/reflection/scale. It excludes stroke/effect padding and does not recursively expand child frame bounds to include overflowing grandchildren. It rebases child transforms so every descendant retains its world transform and size. Original child constraint fields (including absent fields) are restored in the uncommitted candidate before full document validation. One successful transaction gives one Undo entry and ordinary .oui persistence.

Fit remains **partial**: it supports ordinary free-layout frames, not auto-layout frames (use Hug contents), managed instances/main component subtrees, motion-controlled hierarchies, or generated slide/sticky/table frames. Collapsed transforms, nested scales whose composed world geometry overflows, incompatible size limits, and any downstream layout/component change that would alter child artwork are refused atomically. This is an intentional appearance-preservation limit, not a claim of full Figma fit behavior or reference verification.

## Verification

`tests/frame-actions.test.ts` covers transformed ancestors, negative offsets, hidden bounds, source immutability, size/ownership/lock guards, collapsed transforms, direct child selection, end/stretch constraints at zero offsets, one-edit Undo/Redo, and .oui parse/save compatibility. `tests/e2e/frame-workflows.spec.ts` exercises actual preset/inspector controls, saved dimensions, Undo/Redo, selection, fit geometry, reopen, and error atomicity in the production renderer. No private files or general system clipboard are used.

Isolated branch validation: full `npm test` passed 662 tests in 66 files; `npm run build` passed; all four new browser checks passed against the production build. Native build/smoke and feature-register reconciliation belong to integration of this source batch, not a claim of an already shipped Mac release.

Independent-review follow-up: finite source and candidate dimensions/matrix entries are checked explicitly before tolerance comparisons, including the fitted frame. Thirteen frame core tests now pass, including a valid .oui hierarchy with 82 nested scales that overflows only after world-transform composition and an atomic refused store transaction. TypeScript compilation also passes for this follow-up.

The finite check also covers all four transformed layer corners: finite matrix entries alone do not guarantee that a large rectangle has finite world bounds. A 77-level synthetic hierarchy with finite world coefficients near 1e308 and a large final rectangle now refuses atomically. All 14 frame core tests and TypeScript compilation pass after this boundary regression.
