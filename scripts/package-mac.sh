#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
IDENTITY="${SIGNING_IDENTITY:-16B4420E76E5FB9B5EB8C984B5A54C07D7E8B739}"
PROFILE="${NOTARY_PROFILE-oanarina-notary}"
npm test
./scripts/build-mac.sh
APP="build/Oanarina UI Tool.app"
DMG="release/Oanarina-UI-Tool-0.1.0.dmg"
codesign --force --timestamp --options runtime --sign "$IDENTITY" "$APP"
codesign --verify --deep --strict "$APP"
notarize(){
 xcrun notarytool submit "$1" --keychain-profile "$PROFILE" --wait --output-format json > "$2"
 python3 - "$2" <<'PY'
import json,sys
r=json.load(open(sys.argv[1]));print('Notarization:',r.get('status'))
if r.get('status')!='Accepted':sys.exit('Notarization did not succeed')
PY
}
if [[ -n "$PROFILE" ]]; then
 ditto -c -k --keepParent "$APP" release/notarize.zip
 notarize release/notarize.zip build/notary-app.json
 xcrun stapler staple "$APP"
fi
STAGE="$(mktemp -d build/dmg.XXXXXX)"
trap 'rm -rf "$STAGE"' EXIT
ditto "$APP" "$STAGE/Oanarina UI Tool.app"
ln -s /Applications "$STAGE/Applications"
cp LICENSE "$STAGE/License.txt"
hdiutil create -volname 'Oanarina UI Tool' -srcfolder "$STAGE" -ov -format UDZO "$DMG"
codesign --force --sign "$IDENTITY" --timestamp "$DMG"
if [[ -n "$PROFILE" ]]; then
 notarize "$DMG" build/notary-dmg.json
 xcrun stapler staple "$DMG"
 spctl --assess --type execute --verbose=2 "$APP"
 spctl --assess --type open --context context:primary-signature --verbose=2 "$DMG"
fi
(cd release && shasum -a 256 Oanarina-UI-Tool-0.1.0.dmg > SHA256SUMS.txt)
ls -lh "$DMG"
