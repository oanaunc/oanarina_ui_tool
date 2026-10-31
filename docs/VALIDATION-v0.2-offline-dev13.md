# Forma 0.2.0-dev.13 validation

Forma is a local-first, offline Mac design app. This preview follows the [local platform batches](UNRELEASED-LOCAL-PLATFORM-BATCHES.md) with a further pass on components, drawing, typography, libraries and offline resources. At release the register held 2,022 named requirements across 60 categories: **1,490 implemented, 332 partial and 200 planned**. On October 31, 2026, 183 online-only requirements were retired as out of scope, leaving 17 planned. Implementation and Figma reference verification stay separate, and complete parity remains unfinished.

## Added after the local platform batches

| Area | Reachable behavior | Explicit limits |
| --- | --- | --- |
| Components | Nested instance overrides at any depth, exposed nested properties, swap properties through exposed chains, layer overrides that follow unique names on swap. | Slot-bearing components refuse. Bridge transfer of nested overrides is unvalidated. |
| [Published variables](LOCAL-LIBRARY-VARIABLES.md) | Snapshots publish collections with modes and aliases. Consumers hold a linked read-only copy with mode mapping, update review and detach. | Sharing is by snapshot file, with no live sync. |
| Drawing | [Stretch brushes](STRETCH-BRUSHES.md), illustration menus, a straight knife, area eraser on filled shapes, curve-aware Shape Builder, round and square path work, width points and taper presets. | Width profiles convert curves to straight anchors. Knife needs solid fills without visible strokes. |
| Typography | Keyboard lists, real font table reach, variable axes from `fvar`, 1,903 emoji with colon completion, text around closed shapes. | Table data needs TTF or OTF. WOFF2 downloads expose only `wght`. Installed fonts stay unknown. |
| Layout | Automatic bounds for plain groups, nested baselines, grid row and column insertion, drag reorder, Apply scale to values. | Rotated, masked, clipped and animated groups skip automatic bounds. |
| Prototypes | Nested scroll regions, sticky layers in rotated parents, generic device shells, Smart animate for scale, strokes, effects and text, jump-free interruption. | Shells are generic drawings. Shape morphing and rich text size do not animate. |
| Export | [Standalone prototype player](PROTOTYPE-SHARING.md) with optional AES-GCM password, vector PDF for solid shapes, wider text outlining. | No hosted link. PDF keeps text, images and effects raster. |
| [Resources](RESOURCE-LIBRARY.md) | Two original UI kits, eight illustrations, six guides and three tutorial files, all offline. | Small fixed set in English. |

## Behavior changes worth knowing

- Installed variable collections are read-only until detached, including in existing files.
- A saved auto layout with a rotated or scaled child reflows the next time its page is edited.
- Files using shaders, a color profile, code layers, nested property overrides or the foldable, laptop and watch device shells are refused by older builds. Legacy files open unchanged.

## Results

Combined source passes **3,383 core tests across 291 files**, **123 MCP tests**, editor and MCP TypeScript checks and the production build.

The final complete browser run recorded **2,328 passed, 5 failed and 1 skipped**. Three of the five pass alone at low load, so they are load-sensitive. Two were test defects: a locator ambiguous against the error announcer, and a module lookup that outgrew the browser's 250-entry resource timing buffer. After correcting those, the four affected spec files pass 40 of 40. A complete rerun after these test-only fixes was not performed.

A universal build passes the native smoke, lifecycle (37), clipboard (31), renderer restart, synthetic `.fig` import (13) and integration (85) checks, run in sequence in a foreground session. A separate session reported the clipboard and integration checks failing on unchanged source, while the same checks passed here. Window focus is the likely cause but is not proven, and neither are two earlier "second tab active" timeouts.

Not done: real Figma desktop round trips, real PowerPoint or Keynote opens, VoiceOver, physical trackpad, tablet and printer checks, and acceptance of Display P3, shaders and journal replay inside the shipping WKWebView shell. Intel runtime was not validated on real hardware. Quick Look and Spotlight extensions did not run and are not included.
