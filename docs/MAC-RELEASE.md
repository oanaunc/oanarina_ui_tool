# Building and releasing on Mac

`npm run build:mac` builds a universal AppKit/WKWebView app at `build/Oanarina UI Tool.app`. The native binary includes arm64 and x86_64 slices and targets macOS 13+. Xcode Command Line Tools, Node 22.12+, npm, iconutil and sips are needed. The editor's packaged public resources are served only over loopback, not LAN interfaces. Native bridge messages are accepted only from the app's main-frame origin.

`npm run package:mac` runs tests and a native build, signs with the configured Developer ID, optionally notarizes through the existing `oanarina-notary` keychain profile, creates a DMG in `release/`, and records a SHA-256 checksum. Set `SIGNING_IDENTITY` and `NOTARY_PROFILE` for another developer account. Set `NOTARY_PROFILE` to an empty string to skip notarization. Unsigned development builds use ad-hoc signing; public releases should use Developer ID and notarization.

Only describe a release as notarized after both app and DMG submissions return Accepted, tickets are stapled, and Gatekeeper checks pass. Intel is cross-compiled and still requires a real Intel runtime check. No Windows release is included.
