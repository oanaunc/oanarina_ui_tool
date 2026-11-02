# Component playground

UI-41-028 remains **partial**: Forma provides a bounded component experiment on a temporary instance, with slot content and click interactions. It never changes the source until Insert. This is not a complete Dev Mode workspace or a verified Figma playground equivalent.

## Reachable workflow

Select one main component or an instance in Inspect and choose **Open component playground**, or choose the button on a local Assets card. Asset variants use that card's exact selected main. The dialog creates a fresh temporary instance from the main's defaults; selected saved-instance overrides are deliberately not imported. It offers the main's exact variant-set members, exposed text/Boolean/instance-swap properties, ordinary authored nested-instance swaps that are not owned by an exposed swap property, and the main's slots. Variant changes discard temporary values. Reset restores the current variant's defaults. All exposed properties stay visible, including properties irrelevant under current Boolean values, so hidden content can always be restored.

Property edits call the existing guarded component property/swap helpers on an unpublished dependency project. Instance materialization, source correspondence, token/style/mode resolution, guide bindings, text metrics, constraints, layout and final special-geometry validation use the shared editor/prototype derivation. Preview IDs are deterministic and collision-checked through that shared path. Ordinary nested swaps modify only the temporary definition before materialization. Root/source-target inherited locks disable temporary mutations; reading locked defaults and choosing a different available variant remain possible.

The preview is shared exported SVG with the current font assets, displayed in an isolated image rather than inline SVG. This keeps renderer definition IDs out of the editor DOM and stops anything in the artwork from running. No export/download or persistent playground state is offered. Until Insert, the current document object, selection, history and authored metadata do not change. Saving afterwards follows ordinary export behavior, including normal font embedding; no temporary values appear in the saved artwork.

**Insert instance on canvas** places the variant, property values, nested swaps and slot content in the controls as one real linked instance in one Undo step. It is available from Design and disabled in Dev Mode.

## Slots

Each slot on the chosen main shows a control. **Default content** keeps following the main, **Empty** clears the slot, and **Custom layers** holds up to eight text, rectangle or component instance layers. A preferred-only slot offers only its preferred components, and the preferred ones come first otherwise. Custom content uses the same slot actions as the instance slot editor, on the temporary project for the preview and on the document for Insert, so an inserted instance is an ordinary customized slot with `slotOverrides`. A nested swap inside default slot content stops applying once that slot is customized, and its control is hidden. Without a layout, custom layers stack down the slot frame in order. Layers cannot be moved, resized or restyled here. Do that on the canvas after Insert.

## Click interactions

Layers with an enabled click interaction show as marked areas over the preview. Activating one, by pointer or keyboard, resolves it with the same interactive action resolver and prototype runner that presentation uses, with the temporary project as the document. The state lives in the session only. It never reaches the document, Undo or Insert, and Reset or any control change clears it. A note says when an interaction state is showing, because Insert uses the controls and not that state.

Only actions that stay inside the temporary project run: `change-variant` on the receiving instance (`targetScope: self`), `set-variable` and `conditional` with those inside. A reaction containing anything else is removed whole and counted in a note, so navigation, overlays, links, audio and scrolling still need the full prototype, and their URLs and targets never enter the temporary project. Hover, press, drag, key and delay triggers do not run here. Variant changes are immediate, with no transition or smart animate. A change-variant with an explicit target also needs the full prototype, because a generated copy cannot resolve a target inside its main.

The other variants an interaction reaches join the temporary project, within the same 32-main and 1,500-layer limits. When they do not fit, the component previews as artwork and says so instead of refusing.

## Dependency and privacy boundaries

The temporary project includes only the chosen definition and its required component dependencies, plus fixed non-layout definition ancestors needed for inherited mode/guide context. It retains necessary styles, tokens, modes, guide styles and font assets in memory. Fresh instances use ordinary root-insertion mode semantics; definition ancestor modes continue to affect the definitions themselves. Inner guide-owner references use the shared generated-instance remapping.

The project has no source comments, library ownership/publication, file cover, Whiteboard/Slides controllers, private annotations, developer resource links, target links or node/rich-range hyperlinks. Prototype actions are limited to the click interactions above. Typography and literal artwork text remain. Unrelated source artwork and pages are excluded. Source fonts are used locally through existing font/export rules; this workflow does not publish or redistribute a library package.

Whiteboard files can preview ordinary components, but any retained node participating in a note, table, code card, connector, drawing or mind-map controller causes an explicit refusal. Unrelated Whiteboard controllers do not block an ordinary component. This avoids silently stripping controller semantics from affected artwork.

## Refusals and bounds

The source must have distinct nonempty layer identities (at most 512 UTF-16 units), distinct page identities with no layer/page collision, same-page parents and at most 64 acyclic hierarchy levels. Source inspection is capped at 5,000 nodes, 128 ordinary mains, a conservative 20 MB payload estimate and two million payload visits. This cap is checked before copying embedded assets. Derived payload is capped by the same estimate before JSON parsing.

A retained closure is limited to 1,500 layers and 32 component mains, with a conservative expansion estimate of 500 layers per definition and 10,000 total derived layers. The actual displayed instance is capped at 500 layers. Variant inspection allows 10,000 memberships and at most 128 distinct variants of one unambiguous set. Controls allow 32 exposed properties, 32 ordinary nested instances, eight layers per slot, 64 marked interactive areas, 10,000 UTF-16 units per text value and 512-unit value identities. Whiteboard controller reference inspection stops at 50,000 references. Artwork plus used-font payload is conservatively capped at four million bytes before rendering (including globally loaded used fonts); rendered SVG is additionally capped at four million characters; no partial or silently truncated preview is displayed.

Slot-bearing instances inside another main, missing/circular component dependencies, main components nested in another main, Slides, definition roots or ancestors owned by masks/live Booleans/slices/video, automatic/hug/guide-bound definition ancestors and invalid final derivations refuse with an explanation. A variant set's own container is the exception: its grid is frozen at the saved geometry in the temporary project, so sets made with Combine as variants open normally. Other automatic-layout ancestors still refuse. Documentation examples keep the narrower original rules. No arbitrary layer editing in slots, full prototype playback, responsive viewport authoring, multi-instance playground, remote library browser, Code Connect, plugins or cloud execution is claimed.

## Context and accessibility

The request binds the exact source document, page, selection, mode, left tab and font revision. Any departure—including an away-and-back cycle—permanently closes the old session. Motion, Home, hidden UI, Slides and other modal contexts cannot launch a fresh session. Local controls synchronously advance a receipt before publishing temporary state; retained callbacks cannot overwrite a later property/variant/reset choice. Assets launchers also bind their local variant choice. Fresh rendered controls may recover normally.

The dialog has a labeled focus trap, native form controls, contained Space/Enter activation, Escape dismissal and a scrollable short-window layout. 125% UI scale is covered in actual Chromium interaction tests. Native Mac reference verification remains pending; no AppKit menu, IPC or packaging was changed.

## Validation

Focused core cases cover deterministic source correspondence, real text/Boolean/swaps, variant reset, token modes, responsive guide remapping, source immutability, private link omission, Whiteboard refusals, source order/depth, prototype-like IDs, collisions and payload/graph limits. `tests/component-playground-slots.test.ts` covers slot content, preferred-only refusal, circular content, insertion, the interaction runner, removed actions and the artwork fallback. Actual browser cases cover real red/blue/green preview pixels, selected overrides versus defaults, keyboard reset/Boolean controls, 125% sizing, retained local/source handlers, fresh recovery, inherited locks, exact Assets variant launch, isolated SVG definitions, save/reopen invariance, slot insertion with one Undo and clicking interaction areas by pointer and keyboard with real pixels. Full source core, both TypeScript projects and source MCP checks are run without generating production bundles. See the implementation report for final counts; binary/plugin round trips and native release checks are not part of this source-only pass.
