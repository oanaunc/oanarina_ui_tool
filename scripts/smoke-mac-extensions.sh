#!/bin/bash
# Proves the Quick Look and Spotlight parts of a signed app with a synthetic project, on this Mac, through the real hosts.
#   scripts/smoke-mac-extensions.sh /Applications/Forma.app
# The app must be signed by a real identity and be the only registered copy of the document type: macOS will not run ad-hoc
# extensions for Quick Look, and Spotlight lists importers only from an installed app. qlmanage -p aborts on macOS 27 even
# for Apple's own extensions, so the preview runs in a real QLPreviewView instead.
set -uo pipefail
cd "$(dirname "$0")/.."
APP="${1:-/Applications/Forma.app}"
[ -d "$APP/Contents/PlugIns/FormaQuickLook.appex" ] || { printf 'No extensions in %s\n' "$APP" >&2; exit 2; }
ROOT="$(mktemp -d "${TMPDIR:-/tmp}/forma-extensions.XXXXXX")"
WORK="$ROOT/files"
# Spotlight skips temporary folders, so the indexed copy needs an ordinary home folder.
INDEXED="$(mktemp -d "$HOME/forma-spotlight-smoke.XXXXXX")"
trap 'rm -rf "$ROOT" "$INDEXED"' EXIT
mkdir -p "$WORK"
FAILED=0
check(){ if eval "$2"; then printf 'PASS %s\n' "$1"; else printf 'FAIL %s\n' "$1"; FAILED=1; fi; }
cat > "$ROOT/thumb.swift" <<'SWIFT'
import AppKit
import QuickLookThumbnailing
let request=QLThumbnailGenerator.Request(fileAt:URL(fileURLWithPath:CommandLine.arguments[1]),size:CGSize(width:256,height:256),scale:2,representationTypes:.thumbnail)
QLThumbnailGenerator.shared.generateBestRepresentation(for:request){rep,error in
 guard let rep else{print("none");exit(1)}
 let image=rep.cgImage,bitmap=NSBitmapImageRep(cgImage:image)
 try? bitmap.representation(using:.png,properties:[:])?.write(to:URL(fileURLWithPath:CommandLine.arguments[2]))
 print(image.width,image.height);exit(0)
}
DispatchQueue.main.asyncAfter(deadline:.now()+20){print("timeout");exit(1)}
dispatchMain()
SWIFT
cat > "$ROOT/preview.swift" <<'SWIFT'
import AppKit
import Quartz
final class Item:NSObject,QLPreviewItem{let previewItemURL:URL?;init(_ url:URL){previewItemURL=url}}
final class Host:NSObject,NSApplicationDelegate{
 let item:Item;var window:NSWindow!;init(_ url:URL){item=Item(url)}
 func applicationDidFinishLaunching(_ note:Notification){
  window=NSWindow(contentRect:NSRect(x:80,y:80,width:800,height:600),styleMask:[.titled],backing:.buffered,defer:false)
  let view=QLPreviewView(frame:window.contentView!.bounds,style:.normal)!;window.contentView!.addSubview(view);view.previewItem=item;window.orderFront(nil)
  DispatchQueue.main.asyncAfter(deadline:.now()+6){exit(0)}
 }
}
let app=NSApplication.shared,host=Host(URL(fileURLWithPath:CommandLine.arguments[1]));app.delegate=host;app.setActivationPolicy(.accessory);app.run()
SWIFT
xcrun swiftc -O "$ROOT/thumb.swift" -o "$ROOT/thumb" 2>/dev/null
xcrun swiftc -O "$ROOT/preview.swift" -framework Quartz -o "$ROOT/preview" 2>/dev/null
cp tests/fixtures/system-extensions.oui "$WORK/synthetic.oui"
printf '{"format":"oanarina-ui","version":99,"id":"x","pages":[]}' > "$WORK/future.oui"
printf '{"format":"oanarina-ui","version":2,"id":"x","pages":[' > "$WORK/truncated.oui"
dd if=/dev/zero of="$WORK/huge.oui" bs=1m count=0 seek=51 2>/dev/null
ln -s "$WORK/synthetic.oui" "$WORK/link.oui"
check 'the file resolves to the Forma project type' "mdls -name kMDItemContentType '$WORK/synthetic.oui' | grep -q com.oanarinaldi.forma.project"
codesign --verify --deep --strict "$APP" 2>/dev/null
check 'the bundle verifies with its nested code' "[ $? -eq 0 ]"
SIZE="$("$ROOT/thumb" "$WORK/synthetic.oui" "$WORK/thumb.png")"
printf 'thumbnail %s\n' "$SIZE"
# The fixture's cover is 390:640. The system's JSON text thumbnail is square, so only the extension can pass this.
check 'thumbnail has the artwork shape, so it came from the extension' "[ '$SIZE' = '312 512' ]"
red="$(python3 -I - "$WORK/thumb.png" <<'PY'
import sys,zlib,struct
d=open(sys.argv[1],'rb').read();i=8;idat=b''
while i<len(d):
    n,t=struct.unpack('>I4s',d[i:i+8])
    if t==b'IHDR':w,h,bits,color=struct.unpack('>IIBB',d[i+8:i+18])
    if t==b'IDAT':idat+=d[i+8:i+8+n]
    i+=12+n
c={2:3,6:4}[color];raw=zlib.decompress(idat);s=w*c;rows=[];prev=bytearray(s);p=0
for y in range(h):
    f=raw[p];line=bytearray(raw[p+1:p+1+s]);p+=1+s
    for x in range(s):
        a=line[x-c] if x>=c else 0;b=prev[x];z=prev[x-c] if x>=c else 0
        if f==1:line[x]=(line[x]+a)&255
        elif f==2:line[x]=(line[x]+b)&255
        elif f==3:line[x]=(line[x]+(a+b)//2)&255
        elif f==4:
            q=a+b-z;pa,pb,pz=abs(q-a),abs(q-b),abs(q-z);line[x]=(line[x]+(a if pa<=pb and pa<=pz else b if pb<=pz else z))&255
    rows.append(line);prev=line
print(sum(1 for r in rows[:h//4] for x in range(0,s,c) if r[x+2]>180 and r[x]<170))
PY
)"
check "the upper quarter holds the violet hero, so the art fills the bitmap ($red px)" "[ '${red:-0}' -gt 5000 ]"
SINCE="$(date '+%Y-%m-%d %H:%M:%S')"
"$ROOT/preview" "$WORK/synthetic.oui" > /dev/null 2>&1
SERVED="$(log show --start "$SINCE" --style compact --predicate 'subsystem == "com.oanarinaldi.uitool.qlpreview"' --info 2>/dev/null | grep -c 'served 2 pages')"
check 'the preview extension served both pages to a real QLPreviewView' "[ '$SERVED' -ge 1 ]"
# Quick Look resolves a symbolic link itself, so its thumbnail is the target's. The preview path reads with no-follow.
for bad in future truncated huge link; do
 SINCE="$(date '+%Y-%m-%d %H:%M:%S')"
 if [ "$bad" != link ]; then
  "$ROOT/thumb" "$WORK/$bad.oui" "$WORK/$bad.png" > "$WORK/$bad.size" 2>/dev/null
  check "$bad file gets no artwork thumbnail" "! grep -q '^312 512' '$WORK/$bad.size'"
 fi
 "$ROOT/preview" "$WORK/$bad.oui" > /dev/null 2>&1
 SERVED="$(log show --start "$SINCE" --style compact --predicate 'subsystem == "com.oanarinaldi.uitool.qlpreview"' --info 2>/dev/null | grep -c 'served')"
 check "$bad file gets no generated preview" "[ '$SERVED' -eq 0 ]"
done
check 'Spotlight lists the importer' "mdimport -L 2>&1 | grep -q FormaImporter.mdimporter"
mdimport -t -d3 "$WORK/synthetic.oui" > "$WORK/import.txt" 2>&1
check 'importer returned the title' "grep -q 'kMDItemTitle = \"Synthetic Atlas Study\"' '$WORK/import.txt'"
check 'importer returned layer text' "grep -q 'Quartzite harbor lanterns' '$WORK/import.txt'"
check 'importer returned the second page' "grep -q 'Archive notes' '$WORK/import.txt'"
check 'importer returned the page count' "grep -q 'kMDItemNumberOfPages = 2' '$WORK/import.txt'"
check 'indexed text has no file path' "! grep 'kMDItemTextContent' '$WORK/import.txt' | grep -q '$WORK'"
for bad in future truncated huge; do
 mdimport -t -d2 "$WORK/$bad.oui" > "$WORK/$bad-import.txt" 2>&1
 check "$bad file yields no indexed title" "! grep -q 'kMDItemTitle' '$WORK/$bad-import.txt'"
done
cp tests/fixtures/system-extensions.oui "$INDEXED/Atlas.oui"
mdimport -i "$INDEXED/Atlas.oui" > /dev/null 2>&1
for _ in 1 2 3 4 5 6 7 8 9 10 11 12; do sleep 2; mdls -name kMDItemTitle "$INDEXED/Atlas.oui" | grep -q 'Synthetic Atlas Study' && break; done
check 'mdls reports the title from the real index' "mdls -name kMDItemTitle '$INDEXED/Atlas.oui' | grep -q 'Synthetic Atlas Study'"
check 'mdfind finds the file by its layer text' "mdfind -onlyin '$INDEXED' 'Quartzite' 2>/dev/null | grep -q Atlas.oui"
exit "$FAILED"
