# Mac system integration

These shell features use real AppKit, Core Text and PDFKit services. None adds a renderer-to-shell message type or a listening port: the shell pulls bounded content from its own renderer, and file URLs never reach the page. Three existing messages carry optional additions: a strictly validated `menu` object on the `state` report, which can only enable or check menu items; a `placeholder` flag on the same report, which only stops safe mode's empty document from taking over the window session; and a `family` name on the `fonts` message, which answers that family's named faces.

## Menus

- **Forma** has About, Preferences, the system Services submenu, Hide, Hide Others, Show All and Quit.
- **File** adds Open Recent, Reopen Closed Window, Revert To, Share… and Print….
- **Edit** enables Undo and Redo from editor history. Selection commands disable with no selection. Everything stays enabled while a text field has focus, so standard text editing keeps working. It adds Sample Screen Color and the system Emoji & Symbols panel.
- **View** adds Show Tab Bar and Enter Full Screen. Grid, snap, rulers, outlines, frame and section names, scrollbars and minimap show check marks from editor state.
- **Object**, **Text**, **Arrange**, **Vector**, **Page**, **Prototype** and **Resources** are generated from the shared command registry.
- **Window** is the system window list, with Minimize, Zoom, tab commands, Close and Bring All to Front.
- **Help** is the system Help menu, so macOS adds menu search. It adds Forma Guide, which opens the public guide in the default browser only when chosen.

Every registry shortcut appears on its menu item. Commands with Command or Control use real key equivalents. Single-key and Shift-only shortcuts such as `⇧A` or `⌫` are display-only labels, deliberately not bound, because binding them would capture typing and they already reach the editor. Extra shortcuts a person adds in keyboard preferences do not appear in the native menus. Items exist only for commands the editor has; there is no claim of matching another product's menu contents.

## Window tabs

Document windows share one tabbing identity and follow the system "Prefer tabs" setting. Merge All Windows, Move Tab to New Window, Show Next and Previous Tab, and Show Tab Bar work as usual. Each tab keeps its own WKWebView, document and save state; closing one leaves its siblings. Tab groups return with restored window sessions on relaunch, except that a restored session can only regroup windows that reopen.

## Files from Finder

Dropping `.oui` or `.fig` files anywhere on a window opens them in the shell through the same validated path as File → Open, in their own windows. A file that is already open focuses its window. Other drops stay with WebKit, whose File objects carry bytes and a name but never a path. On the design canvas images land under the pointer as one Undo step, TIFF, HEIC, BMP and AVIF convert to PNG when this Mac can decode them, SVG goes to the import review, and PDF and Sketch files go to their reviews. One document may be dropped at a time, and a document mixed with images is refused. The Slides workspace and the Files screen do not take dropped images.

Copying a file in Finder and pasting on the canvas reads that file in the shell, so an image pastes its real pixels rather than Finder's icon. Only images and SVG paste; another file type pastes nothing, and the path never reaches the page. Only the first copied file is read.

## Drag to Finder

The preview image in the Export dialog can be dragged to Finder. WebKit makes this a real file promise holding the exact export bytes, and the shell only asks the editor for the file name. Canvas layers and the Assets panel cannot be dragged out, because that would need a new renderer-to-shell message.

## Screen colors

**Edit → Sample Screen Color** (Control-Command-C) starts the system color sampler. The shell starts it and the page receives only the color a person clicked. An open color picker takes the color with one Undo step; with none open it goes to recent colors. Display P3 files keep the wide coordinates. The in-page Sample screen color button cannot start the sampler, because that would need a new renderer-to-shell message, so on Mac it points to the menu command.

## Installed fonts

The Font style select lists an installed family's own faces by name. Width variants such as Condensed are left out, because CSS weight alone cannot reach them. Names and weights come from Core Text; no file or path is exposed.

The shell listens for Core Text registered-font changes and `NSFont` font-set changes, then the editor refreshes its installed list, text metrics, the Missing Fonts control and an open Font Library, without reopening the project. The acceptance run registers and unregisters a uniquely named font in process scope; installing through Font Book was not exercised.

## Trackpad pinch

WKWebView reports a pinch as Safari `gesturestart/gesturechange/gestureend` events rather than Control-wheel events. The canvas handles them with the same zoom limits as the wheel path, keeping the point under the fingers fixed. The acceptance run confirms `GestureEvent` exists in this WebKit and drives synthetic DOM events against the real canvas. **A physical trackpad was not exercised**, so this remains partial.

## macOS versions

Save first stores the bytes it is about to replace in the system document version store through `NSFileVersion`. **File → Revert To** lists up to 20 versions by date. Choosing one replaces the window's content as one Undo step and leaves the saved file alone until Save. **Last Saved File** returns to the file on disk, also as one Undo step, and is clean.

**File → Revert To → Browse All Versions…** opens a sheet that lists the same versions, previews the selected one from its own bytes with the Quick Look renderer, and restores it as one Undo step.

Limits: this is not `NSDocument`, so it is Forma's own sheet rather than the system's full-screen browser, and its preview is the simplified one. Versions are recorded only by Save, so autosaved recovery states and MCP transactions are not separate versions, although a transaction's result is stored when a later Save replaces it. Storage follows macOS rules and failure to record a version never blocks Save. It is separate from Forma's own version history.

## Print and Share

**File → Print…** shows the macOS print dialog as a sheet for the selection, or for each outermost frame of the page, or the page artwork when there are no frames. Slides print each visible slide. Pages are flattened 2× raster PDFs from the editor's PDF path, so printed text is not vector.

**File → Share…** prepares a private temporary file, a 2× PNG of a selection or otherwise the same PDF, and shows the system share picker. **File → Share As** chooses PNG, PDF or the Forma project itself; a shared project passes the same validation as Save. The file is removed on the next share or when the window closes. The acceptance run confirms the picker opens and proposes services; no service was carried through to delivery. 

## Export destination

**File → Export Destination** is Ask Every Time or Choose Folder…. With a folder chosen, exports from every window go there with no panel. A repeat takes the next free name and never overwrites. If the folder is gone or refuses the write, the save panel returns. The folder lives in the shell's own defaults and the renderer is told only that an export finished. Saving a `.oui` is unaffected.

## Version links

Forma registers the `forma-version:` scheme, so a link copied from Version history opens from Finder, Notes or `open`. The shell reads the document id and refuses anything else. If that project is open its window comes forward. If not, up to ten recent files are checked for that id. Otherwise an alert asks you to open the project. The renderer then checks the whole reference against its own document and shows the read-only preview, with the same restore rules as a pasted link. Saved versions stay in this Mac's local storage, so a link does nothing on another Mac.

## Appearance and clipboard images

Setting the application appearance while running changes the actual WKWebView's `prefers-color-scheme` and the editor theme in both directions, which is the code path used when the system appearance changes. Explicit JPEG pasteboard images now use the same bounded normalization as PNG and TIFF; pasteboard bytes must match their declared type.

## Not done

- **Dragging canvas layers to Finder**: starting a native drag from the canvas needs a new renderer-to-shell message, which the current rule against broadening IPC excludes. Needs a decision. The Export dialog preview can be dragged.
- **App Sandbox**: not adopted. A copy under a separate bundle identifier, with the sandbox, network server, network client, print and user-selected file entitlements, passed `--smoke-test` and the save, export and drop acceptance groups, so the 127.0.0.1:51981 server, WKWebView, the clipboard and panels work. It failed `--integration-smoke-test` at the MCP checks, which spawn `node`, and it cannot ship for three reasons those runs do not reach, because their files sit inside the container. Save takes a sibling `.oanarina-mcp.lock` next to the project, and live context writes a sibling `.oanarina-live.json`, neither of which a user-selected file grants. Window restoration stores paths, which need security-scoped bookmarks. And WebKit's data store moves into the container, so every existing person's local files, recovery copies and versions would disappear unless a container migration is built and tested against real data.
- **Update checks and release notes**: there is no release feed to read. They need one published first.

## Quick Look and Spotlight

Finder previews and thumbnails come from two sandboxed app extensions in `Contents/PlugIns`, `FormaQuickLook` and `FormaThumbnail`. Spotlight search comes from a classic importer, `Contents/Library/Spotlight/FormaImporter.mdimporter`. `scripts/build-mac-extensions.sh` builds all three, `build-mac.sh` runs it and `package-mac.sh` signs them inside out, before the app.

All three share `macos/extensions/OuiProject.swift`, which keeps the app's 50 MB ceiling and format check, reads with no-follow and holds no path. Preview and thumbnail draw with `OuiRenderer.swift`, a Core Graphics simplification of the editor: solid, linear and radial paints, strokes, opacity, clipping, shapes, paths, embedded images and plain text. Effects, masks, blend modes, rich runs, conic paints and shaders are not drawn, and only inline raster data loads, so nothing is fetched. Text uses installed fonts and otherwise a system fallback, since the bundled fonts are not in the extension. A file that fails validation falls back to the system's generic view and is indexed with no project data.

The Spotlight importer gives the title, description, page and layer names, fonts, page count, the Forma creator and up to 256 KB of authored text to the on-device index. Nothing is sent anywhere.

Things this Mac taught, kept here because each one looked like something else:

- `qlmanage -p` aborts on macOS 27 inside `EXConcreteExtension` with a nil dictionary key, for Apple's own Icon Composer extension as well. It says nothing about ours. A real `QLPreviewView` works, which is what the smoke uses.
- Spotlight never called a `CSImportExtension` on macOS 27, though `mdimport -e` listed it, so the importer is the classic bundle.
- Extensions are refused or skipped when ad-hoc signed. `build-mac.sh` therefore signs with the release identity when this Mac has it. A sandboxed extension's container belongs to its signer: an ad-hoc run followed by a signed one left `secinitd` waiting on a consent prompt, which looks like a hang. The first attempts used the identifiers `com.oanarinaldi.uitool.quicklook`, `.thumbnail` and `.spotlight`, whose containers are stuck that way on this Mac, so they are not reused.
- `.oui` is now `com.oanarinaldi.forma.project`. The earlier identifier, `com.oanarinaldi.ui-document`, stays declared with no file extension, conforming to the new one. Thumbnails never reached the extension under the earlier identifier, while any other identifier worked with the same declaration, and Spotlight keeps resolving `.oui` to it after it is gone, so the importer claims both. The file format did not change.
- macOS lists a third-party importer only for an app registered in `/Applications`, and registration takes several seconds to reach Spotlight.
- Extensions in `/Applications` are enabled by default. A build elsewhere needs `pluginkit -a` and `pluginkit -e use`.

To verify, install a signed copy in `/Applications`, wait a few seconds, then run `scripts/smoke-mac-extensions.sh /Applications/Forma.app`. It proves the thumbnail by its shape and pixels through `QLThumbnailGenerator`, the preview through a real `QLPreviewView` and the extension's own log line, the importer with `mdimport -t`, and the real index with `mdls` and `mdfind`, plus refusal of future, truncated, oversized and symbolic-link input. Finder's own Space-bar panel and icon drawing were not exercised directly: they use these same services.

## Validation

After `npm run build:mac`:

```sh
FORMA_SMOKE_REPO="$PWD" build/Forma.app/Contents/MacOS/OanarinaUITool --integration-smoke-test
```

See [Native acceptance](NATIVE-ACCEPTANCE.md) for `--acceptance-smoke-test`, which covers exports, recovery, frames and Finder paths. The integration run uses temporary synthetic projects, a nonpersistent WebKit store and real menus, tabs, print and version services. It removes the versions it creates. `FORMA_SMOKE_REPO` enables the separate-process MCP checks. Tested on one Mac only, with the app port free.
