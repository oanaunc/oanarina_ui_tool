# Prototype files

File → Export prototype file…, Actions, or the Prototype tab saves a ZIP holding `prototype.html` and a `README.txt`. The HTML file is the whole prototype: a validated snapshot of the current page plus the real presentation renderer. It works offline and needs no Forma install.

There is no hosted link. You host or send the file yourself. A server-backed link will arrive separately.

The download is a ZIP because that format is already allowed by the Mac shell's save path, so no native permission changed.

## What the file contains

Included: every frame on the current page with its hidden layers, variables, styles, the components the page renders or can switch to, and the fonts Forma may embed. Fonts marked as not embeddable are left out and named in the result, and viewers see a fallback font.

Left out: other pages except required component definitions, loose layers outside frames, comments, annotations, developer resources, export settings and file-level review metadata. The snapshot gets a new document identity.

An unencrypted file is not private. Anyone with it can read everything in it, including hidden layers.

## Player

The player is built from `src/components/PrototypePresentation.tsx` by `scripts/prototype-player-plugin.mjs`, on demand in development and as a lazy chunk in production. Nothing generated is committed. The editor store and Motion preview transport are replaced by small stand-ins in `src/player/`, which keeps the file near 900 KB before content.

The snapshot is checked again on load with the same `parseDocument` validation as an opened `.oui`, plus a real first presentation state. A damaged file shows an error and does not play.

The page has `default-src 'none'`, a script hash for the one inline script, no remote connection target, `base-uri 'none'` and `form-action 'none'`. It cannot load or send anything. Links a designer authored open only when a viewer presses them. All user text is rendered by React or inside JSON encoded so it cannot leave its script element.

Differences from in-app presentation: no Motion preview, no return to an editor, English chrome only, and nothing is saved. Reloading restarts the prototype.

## Password

Choosing a password encrypts the snapshot with AES-256-GCM. The key comes from PBKDF2-SHA-256 at 600,000 iterations with a random 16-byte salt, and the IV is a random 12 bytes. Those parameters are stored in the file and authenticated with the ciphertext. All of it runs through Web Crypto. Passwords are at least 8 characters, are compared in composed Unicode form and are never stored.

The file title, file name and project content are absent until decryption. A test searches the output for a canary string.

Limits, stated in the dialog and the README:

- Anyone with both the file and the password has all of the content.
- A weak password can be guessed offline. There is no attempt limit.
- A lost password cannot be recovered, and it cannot be changed or revoked for copies already sent.
- Browsers offer Web Crypto only on secure pages, so a protected file opens from `https://` or directly from a device, not from plain `http://` on another host. The page says so instead of failing silently.

## Embed

The dialog builds an `iframe` snippet from the location you enter. It uses `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"` and deliberately omits `allow-same-origin`, so the prototype cannot reach the host page. Remove the popup tokens if its links should not open tabs. Locations are limited to relative paths and http(s) addresses.

## Phones

At phone widths the player compacts its header and footer, gives controls 44 px targets and respects safe areas. Touch uses the existing pointer path. Frames that do not scroll keep pinch zoom but no longer lose drag gestures to page panning. This was tested with Playwright's iPhone 13 emulation in Chromium, not on a physical phone or in mobile Safari. There is no companion app.

## Comments

Viewers cannot comment in an exported file, and nothing they do reaches the source design. The player says so. Comments on prototypes during in-app presentation are not implemented.

## Access permissions

There are no per-person permissions, because they need accounts and a server. The only access choice is whether the file is encrypted.

## Validation

`tests/prototype-export.test.ts` covers encryption, tampering, Unicode passwords, snapshot privacy, component closure, malformed files, HTML escaping, the script hash, the ZIP, embed refusal and a real player build. `tests/e2e/prototype-share.spec.ts` exports through the dialog and opens the result in a separate browser context, from a bare local server, from `file://`, in a sandboxed iframe and at phone size, with wrong and right passwords, hostile layer text, a blocked request and a recorded request list.

Not validated: the shipping WKWebView save path, real hosting over HTTPS, audio and video playback inside an exported file, and Safari or Firefox.
