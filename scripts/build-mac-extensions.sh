#!/bin/bash
# Embeds the Quick Look preview and thumbnail extensions and the Spotlight importer in an app bundle.
# Called by build-mac.sh after the app binary exists; package-mac.sh later re-signs them with the release identity.
# See docs/MAC-SYSTEM-INTEGRATION.md.
set -euo pipefail
cd "$(dirname "$0")/.."
APP="${1:-build/Forma.app}"
IDENTITY="${2:--}"
WORK="build/extensions"
ENTITLEMENTS="macos/extensions/Extension.entitlements"
rm -rf "$WORK" "$APP/Contents/PlugIns" "$APP/Contents/Library/Spotlight"
mkdir -p "$WORK" "$APP/Contents/PlugIns" "$APP/Contents/Library/Spotlight"
SDK="$(xcrun --show-sdk-path)"
SDK_VERSION="$(xcrun --show-sdk-version)"
VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' macos/Info.plist)"
BUILD="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' macos/Info.plist)"
extension(){ # name id principal point attribute-keys source frameworks...
 local name="$1" id="$2" principal="$3" point="$4" attribute="$5" source="$6"
 shift 6
 local out="$APP/Contents/PlugIns/$name.appex"
 mkdir -p "$out/Contents/MacOS"
 local links=()
 for framework in "$@"; do links+=(-framework "$framework"); done
 for arch in arm64 x86_64; do
  xcrun swiftc macos/extensions/OuiProject.swift macos/extensions/OuiRenderer.swift macos/ProjectFileSafety.swift "$source" -O -parse-as-library -application-extension -module-name "$name" -sdk "$SDK" -target "$arch-apple-macos13.0" -Xlinker -e -Xlinker _NSExtensionMain "${links[@]}" -o "$WORK/$name-$arch"
 done
 lipo -create "$WORK/$name-arm64" "$WORK/$name-x86_64" -output "$out/Contents/MacOS/$name"
 cat > "$out/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleDisplayName</key><string>$name</string>
<key>CFBundleExecutable</key><string>$name</string>
<key>CFBundleIdentifier</key><string>$id</string>
<key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
<key>CFBundleName</key><string>$name</string>
<key>CFBundlePackageType</key><string>XPC!</string>
<key>CFBundleShortVersionString</key><string>$VERSION</string>
<key>CFBundleSupportedPlatforms</key><array><string>MacOSX</string></array>
<key>CFBundleVersion</key><string>$BUILD</string>
<key>DTPlatformName</key><string>macosx</string>
<key>DTSDKName</key><string>macosx$SDK_VERSION</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>NSExtension</key><dict>
<key>NSExtensionAttributes</key><dict>
$attribute
</dict>
<key>NSExtensionPointIdentifier</key><string>$point</string>
<key>NSExtensionPrincipalClass</key><string>$principal</string>
</dict>
</dict></plist>
PLIST
 plutil -lint -s "$out/Contents/Info.plist"
 codesign --force --sign "$IDENTITY" --timestamp=none --entitlements "$ENTITLEMENTS" "$out"
}
TYPES='<array><string>com.oanarinaldi.forma.project</string></array>'
extension FormaQuickLook com.oanarinaldi.uitool.qlpreview FormaPreviewProvider com.apple.quicklook.preview "<key>QLIsDataBasedPreview</key><true/><key>QLSupportedContentTypes</key>$TYPES<key>QLSupportsSearchableItems</key><false/>" macos/extensions/QuickLookPreview.swift Foundation QuickLookUI CoreGraphics CoreText ImageIO UniformTypeIdentifiers
extension FormaThumbnail com.oanarinaldi.uitool.qlthumbnail FormaThumbnailProvider com.apple.quicklook.thumbnail "<key>QLSupportedContentTypes</key>$TYPES<key>QLThumbnailMinimumDimension</key><integer>16</integer>" macos/extensions/QuickLookThumbnail.swift Foundation QuickLookThumbnailing CoreGraphics CoreText ImageIO
# Spotlight still runs classic importers from Contents/Library/Spotlight; on macOS 27 it never called a CSImportExtension.
# Spotlight can keep resolving .oui to the type identifier of earlier releases long after it is gone, so both are claimed.
IMPORTER="$APP/Contents/Library/Spotlight/FormaImporter.mdimporter"
mkdir -p "$IMPORTER/Contents/MacOS"
for arch in arm64 x86_64; do
 xcrun clang -c macos/extensions/importer/plugin.c -O2 -isysroot "$SDK" -target "$arch-apple-macos13.0" -o "$WORK/plugin-$arch.o"
 xcrun swiftc macos/extensions/OuiProject.swift macos/ProjectFileSafety.swift macos/extensions/importer/SpotlightImporter.swift "$WORK/plugin-$arch.o" -O -parse-as-library -module-name FormaImporter -sdk "$SDK" -target "$arch-apple-macos13.0" -framework CoreFoundation -framework CoreServices -framework CoreGraphics -Xlinker -bundle -Xlinker -exported_symbol -Xlinker _FormaImporterFactory -o "$WORK/FormaImporter-$arch"
done
lipo -create "$WORK/FormaImporter-arm64" "$WORK/FormaImporter-x86_64" -output "$IMPORTER/Contents/MacOS/FormaImporter"
cat > "$IMPORTER/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleDevelopmentRegion</key><string>en</string>
<key>CFBundleDocumentTypes</key><array><dict><key>CFBundleTypeRole</key><string>MDImporter</string><key>LSItemContentTypes</key><array><string>com.oanarinaldi.forma.project</string><string>com.oanarinaldi.ui-document</string></array></dict></array>
<key>CFBundleExecutable</key><string>FormaImporter</string>
<key>CFBundleIdentifier</key><string>com.oanarinaldi.uitool.mdimporter</string>
<key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
<key>CFBundleName</key><string>FormaImporter</string>
<key>CFBundlePackageType</key><string>BNDL</string>
<key>CFBundleShortVersionString</key><string>$VERSION</string>
<key>CFBundleVersion</key><string>$BUILD</string>
<key>CFPlugInDynamicRegisterFunction</key><string></string>
<key>CFPlugInDynamicRegistration</key><string>NO</string>
<key>CFPlugInFactories</key><dict><key>84C7168F-3E2F-4912-BC78-E60F2E3B69A3</key><string>FormaImporterFactory</string></dict>
<key>CFPlugInTypes</key><dict><key>8B08C4BF-415B-11D8-B3F9-0003936726FC</key><array><string>84C7168F-3E2F-4912-BC78-E60F2E3B69A3</string></array></dict>
<key>CFPlugInUnloadFunction</key><string></string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
</dict></plist>
PLIST
plutil -lint -s "$IMPORTER/Contents/Info.plist"
codesign --force --sign "$IDENTITY" --timestamp=none "$IMPORTER"
rm -rf "$WORK"
