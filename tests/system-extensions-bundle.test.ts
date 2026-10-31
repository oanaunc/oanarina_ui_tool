import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
describe('Quick Look and Spotlight bundle wiring',()=>{
 const plist=read('macos/Info.plist'),build=read('scripts/build-mac-extensions.sh'),pack=read('scripts/package-mac.sh');
 it('declares .oui as the Forma project type and keeps the earlier identifier without a tag',()=>{
  expect(plist).toMatch(/<string>com\.oanarinaldi\.forma\.project<\/string>\s*<key>UTTypeTagSpecification<\/key>[\s\S]*?<string>oui<\/string>/);
  expect(plist).toMatch(/<string>com\.oanarinaldi\.ui-document<\/string>\s*<\/dict>/);
 });
 it('declares a Forma-owned imported type for .fig and uses it in the document types',()=>{
  expect(plist).toMatch(/<key>UTImportedTypeDeclarations<\/key>\s*<array>\s*<dict>\s*<key>UTTypeIdentifier<\/key>\s*<string>com\.oanarinaldi\.forma\.design-file<\/string>[\s\S]*?<string>fig<\/string>/);
  expect(plist).toMatch(/<key>LSItemContentTypes<\/key>\s*<array>\s*<string>com\.oanarinaldi\.forma\.design-file<\/string>/);
  expect(read('macos/main.swift')).toContain('UTType(importedAs:"com.oanarinaldi.forma.design-file")');
 });
 it('points every extension and the importer at that type',()=>{
  expect(build).toContain("TYPES='<array><string>com.oanarinaldi.forma.project</string></array>'");
  expect(build).toContain('<string>com.oanarinaldi.forma.project</string><string>com.oanarinaldi.ui-document</string>');
 });
 it('signs nested code before the app, with the sandbox entitlements on extensions',()=>{
  const importer=pack.indexOf('FormaImporter.mdimporter'),extensions=pack.indexOf('.appex'),app=pack.indexOf('--sign "$IDENTITY" "$APP"\n');
  expect(importer).toBeGreaterThan(0);expect(extensions).toBeGreaterThan(importer);expect(app).toBeGreaterThan(extensions);
  expect(pack).toContain('--entitlements macos/extensions/Extension.entitlements');
  expect(read('macos/extensions/Extension.entitlements')).toContain('com.apple.security.app-sandbox');
 });
});
