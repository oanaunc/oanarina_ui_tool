#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build > /tmp/oanarina-ui-vite-build.log
mkdir -p build release build/icon.iconset
if [ -f public/app-icon-v2.png ]; then
 sips -z 1024 1024 public/app-icon-v2.png --out build/icon-1024.png > /dev/null
else
 swift scripts/icon.swift build/icon-1024.png
fi
rm -f build/icon.iconset/*.png
for size in 16 32 128 256 512; do
 sips -z "$size" "$size" build/icon-1024.png --out "build/icon.iconset/icon_${size}x${size}.png" > /dev/null
 double=$((size * 2))
 sips -z "$double" "$double" build/icon-1024.png --out "build/icon.iconset/icon_${size}x${size}@2x.png" > /dev/null
done
iconutil -c icns build/icon.iconset -o public/icon.icns
APP="build/Forma.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp macos/Info.plist "$APP/Contents/Info.plist"
cp LICENSE "$APP/Contents/Resources/LICENSE.txt"
cp public/icon.icns "$APP/Contents/Resources/icon.icns"
rm -rf "$APP/Contents/Resources/editor"
ditto dist "$APP/Contents/Resources/editor"
SDK="$(xcrun --show-sdk-path)"
for arch in arm64 x86_64; do
 xcrun swiftc macos/main.swift macos/NativeSmoke.swift macos/ProjectFileSafety.swift macos/NodePasteboard.swift macos/ClipboardNativeSmoke.swift macos/LiveContext.swift macos/NativeIntegration.swift macos/IntegrationNativeSmoke.swift macos/NativeDrop.swift macos/NativeServices.swift macos/ServicesNativeSmoke.swift macos/extensions/OuiProject.swift macos/extensions/OuiRenderer.swift macos/AcceptanceNativeSmoke.swift -O -sdk "$SDK" -target "$arch-apple-macos13.0" -framework AppKit -framework WebKit -framework PDFKit -o "build/OanarinaUITool-$arch"
done
lipo -create build/OanarinaUITool-arm64 build/OanarinaUITool-x86_64 -output "$APP/Contents/MacOS/OanarinaUITool"
# A sandboxed extension's container belongs to its signer, and macOS raises a consent prompt when an ad-hoc copy and a
# release copy share one on the same Mac, so use the release identity here when this Mac has it.
IDENTITY="${SIGNING_IDENTITY:-16B4420E76E5FB9B5EB8C984B5A54C07D7E8B739}"
security find-identity -v -p codesigning | grep -q "$IDENTITY" || IDENTITY=-
bash scripts/build-mac-extensions.sh "$APP" "$IDENTITY"
codesign --force --sign "$IDENTITY" --timestamp=none "$APP"
printf 'Built %s\n' "$APP"
