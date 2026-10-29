import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
if(JSON.parse(fs.readFileSync('package.json','utf8')).version!=='0.2.0-dev.7')throw Error('This recorder belongs to v0.2.0-dev.7.');
const features=JSON.parse(fs.readFileSync('public/features.json','utf8'));
const bridge=features.find(f=>f.id==='UI-39-024');
bridge.status='partial';
bridge.notes='v0.2.0-dev.7: dependency-aware selected/page exports, explicit source correspondence, real createInstance import path, supported overrides, variant sets and single-target scalar/swap controls. Strict live-inheritance API-contract mocks and editor workflows validate the supported subset. Nested structural swaps, unsupported overrides and root bindings detach with reports; multi-target properties/slots/library identity are reduced. Actual desktop component round-trip acceptance remains unverified; connected API quota blocked that attempt. See figma-plugin/README.md and docs/VALIDATION-v0.2-component-bridge.md.';
bridge.verification='implementation-validated; reference-verification-pending';
for(const f of features.filter(f=>f.category==='Variants and properties'&&['Component slot definition','Editable instance slot content','Reset instance slot content'].includes(f.name))){
 f.source='https://developers.figma.com/docs/plugins/working-with-component-properties/';
 f.verification='official-docs-verified-2026-10-29; implementation-planned';
 f.notes='Figma SLOT properties and editable/resettable instance slot content are documented in the public Plugin API. This workflow is not implemented in Forma or its editable bridge.';
}
fs.writeFileSync('public/features.json',JSON.stringify(features,null,2)+'\n');
execFileSync(process.execPath,['scripts/inventory.mjs'],{stdio:'inherit'});
