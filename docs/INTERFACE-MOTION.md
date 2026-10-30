# Interface motion preference

File → Preferences → **Interface motion** is a local editor setting:

- **Follow system** (default) follows `prefers-reduced-motion` and responds to live system changes.
- **Reduce interface motion** applies a scoped policy to editor chrome animations, transitions and supported scrolling containers.
- **Allow interface motion** permits chrome effects independently of the system preference. It does not introduce any effects.

**Reset interface motion** removes this override and resumes following the system. Reset preferences also resets it. The separate `oui-interface-motion` storage key does not change `.oui` contents, selection, camera, document timestamps, dirty state, recovery snapshots or undo history. Same-origin windows receive saved changes and clearing through storage events.

Storage writes happen before notifying the interface. A denied write or reset reports an error and preserves the previous saved choice. If reading storage is unavailable, the editor follows the system. If the system media query itself is unavailable, Follow system uses the quieter, reduced policy. Explicit Allow remains available if local storage works.

## Scope and practical effect

The current editor chrome is already largely immediate: this audit found no custom chrome autoplay, animated spinner/skeleton, or explicit smooth-scroll consumer. The new policy is a protective CSS rule for named chrome surfaces, their interactive controls, and named scrolling containers. It does not add a fade or other effect solely to demonstrate a preference. In the present interface, changing this setting can therefore have little visible effect.

The rule avoids blanket descendant selectors. Document SVG artwork, page-thumbnail SVG contents, prototype artwork, Slides artwork and motion timeline playback are not targeted. It also does not control macOS wheel momentum, browser scrolling physics, or every future interface animation automatically; new chrome effects must use the scoped surfaces or explicitly consume the preference.

Authored animation remains separate:

- Explicit timeline Play continues to play, and animation exports retain authored timing and bytes.
- Prototype presentation retains its existing per-file reduced-motion setting and system-preference behavior.
- Slides presentation retains its existing system reduced-motion CSS behavior.
- Allow interface motion does not override either presentation's existing system/file policy. The local setting is deliberately labeled **Interface motion**, rather than an app-wide authored-playback override.

## Verification and limits

Core checks cover strict enum/default handling, persistence errors, live media updates, storage events, subscription cleanup and legacy media listeners. Browser checks exercise the reachable Preferences controls, reload, actual other-window storage synchronization, live system changes, reset and denied storage. A synthetic chrome animation/transition fixture verifies the protective CSS policy and artwork exclusion; it is a test fixture, not a production animation. Actual timeline playback and identical GIF export bytes verify that deliberate authored motion remains intact. An actual Slides presentation checks that its existing system policy remains separate.

Recommend **UI-02-023 Reduced motion preference: partial**: the local/system chrome policy is reachable, but broad app-wide motion/accessibility parity is not claimed. Actual WKWebView/Mac preference acceptance remains unverified while the Mac is locked; no native IPC, file format, export settings or installer resources were changed.
