#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build > /tmp/oanarina-ui-vite-build.log
mkdir -p build release build/icon.iconset
swift scripts/icon.swift build/icon-1024.png
rm -f build/icon.iconset/*.png
for size in 16 32 128 256 512; do
 sips -z "$size" "$size" build/icon-1024.png --out "build/icon.iconset/icon_${size}x${size}.png" > /dev/null
 double=$((size * 2))
 sips -z "$double" "$double" build/icon-1024.png --out "build/icon.iconset/icon_${size}x${size}@2x.png" > /dev/null
done
iconutil -c icns build/icon.iconset -o public/icon.icns
APP="build/Oanarina UI Tool.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp macos/Info.plist "$APP/Contents/Info.plist"
cp LICENSE "$APP/Contents/Resources/LICENSE.txt"
cp public/icon.icns "$APP/Contents/Resources/icon.icns"
rm -rf "$APP/Contents/Resources/editor"
ditto dist "$APP/Contents/Resources/editor"
SDK="$(xcrun --show-sdk-path)"
for arch in arm64 x86_64; do
 xcrun swiftc macos/main.swift -O -sdk "$SDK" -target "$arch-apple-macos13.0" -framework AppKit -framework WebKit -o "build/OanarinaUITool-$arch"
done
lipo -create build/OanarinaUITool-arm64 build/OanarinaUITool-x86_64 -output "$APP/Contents/MacOS/OanarinaUITool"
codesign --force --sign - "$APP"
printf 'Built %s\n' "$APP"
