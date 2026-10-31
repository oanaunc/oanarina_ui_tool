/** Truthful local data inventory. tests/privacy-dashboard.test.ts scans src/ so a new store or network call must be declared here. */
export interface StoredEntry {key:string;label:string;holds:string;projectContent:boolean;clearable?:boolean;}
export const localStorageCatalog:readonly StoredEntry[]=[
 {key:'oui-preferences',label:'Preferences',holds:'Editor settings and default colors and fonts.',projectContent:false},
 {key:'oui-theme',label:'Appearance',holds:'Light, dark or system theme.',projectContent:false},
 {key:'oui-interface-motion',label:'Interface motion',holds:'Reduced motion choice.',projectContent:false},
 {key:'oui-keyboard-preferences',label:'Keyboard shortcuts',holds:'Custom shortcuts and keyboard layout.',projectContent:false},
 {key:'oui-language',label:'Interface language',holds:'The interface language you chose.',projectContent:false},
 {key:'oui-interface-accent',label:'Accent color',holds:'The interface accent color you chose.',projectContent:false},
 {key:'oui-interface-contrast',label:'Interface contrast',holds:'Your interface contrast choice.',projectContent:false},
 {key:'forma-workspace-preferences',label:'Workspace preferences',holds:'Canvas gesture, export naming, export destination and Trash retention choices.',projectContent:false},
 {key:'forma-first-run',label:'First-run offer',holds:'A marker that the canvas tour was offered. No document data.',projectContent:false},
 {key:'forma-local-plugin-preferences-v1',label:'Plugin favorites and recents',holds:'Plugin IDs you starred or ran recently. No document data.',projectContent:false,clearable:true},
 {key:'oui-panel-layout',label:'Sidebar layout',holds:'Sidebar widths and collapsed state.',projectContent:false},
 {key:'forma-workspace-layouts-v1',label:'Workspace layouts',holds:'Names you gave saved layouts, with their panel and view settings.',projectContent:false,clearable:true},
 {key:'oui-page-viewports',label:'Page viewports',holds:'Zoom and scroll per page, keyed by document and page ID.',projectContent:false},
 {key:'oui-last-shape-tool',label:'Last shape tool',holds:'Which shape tool was used last.',projectContent:false},
 {key:'oui-file-browser',label:'File browser view',holds:'Sort and view choices on the Home screen.',projectContent:false},
 {key:'oui-action-history',label:'Recent actions',holds:'Up to 20 command IDs. No document data.',projectContent:false,clearable:true},
 {key:'forma-command-usage-v1',label:'Command usage',holds:'Run counts per command ID, only while learning is on. No document data.',projectContent:false,clearable:true},
 {key:'oui-recent-colors',label:'Recent colors',holds:'Up to 24 colors you picked.',projectContent:false,clearable:true},
 {key:'oui-font-favorites',label:'Font favorites',holds:'Font family names you starred.',projectContent:false},
 {key:'forma-local-profile',label:'Local profile',holds:'The name and avatar you entered for local comments.',projectContent:false},
 {key:'forma-brush-library-v1',label:'Brush library',holds:'Your custom brush presets.',projectContent:false},
 {key:'forma-brush-settings-v1',label:'Brush settings',holds:'The active brush settings.',projectContent:false},
 {key:'forma-batch-scripts-v1',label:'Batch scripts',holds:'Batch transform scripts you saved.',projectContent:false,clearable:true},
 {key:'forma-code-presets-v1',label:'Code export presets',holds:'Code export presets you saved.',projectContent:false,clearable:true},
 {key:'oui-library-revision',label:'Library revision',holds:'A marker that tells other windows the project library changed.',projectContent:false},
 {key:'oui-active',label:'Legacy recovery copy',holds:'A project copy from an older version, migrated on first launch.',projectContent:true},
];
export const databaseCatalog:readonly StoredEntry[]=[
 {key:'oanarina-projects',label:'Project library',holds:'Your local projects, recovery copies and version history. Manage these from Home.',projectContent:true},
 {key:'oanarina-fonts',label:'Font cache',holds:'Font files you downloaded. Manage these in the Font library.',projectContent:false},
 {key:'forma-starter-kits',label:'Starter kits',holds:'Project starter kits you saved.',projectContent:true},
 {key:'forma-component-libraries',label:'Component libraries',holds:'Local component library snapshots.',projectContent:true},
 {key:'forma-local-plugin-catalog-v1',label:'Local plugins',holds:'Plugin packages you installed.',projectContent:false},
 {key:'forma-local-plugin-data-v1',label:'Plugin storage',holds:'Values local plugins saved with storage access. Removing a plugin clears its values.',projectContent:false},
 {key:'forma-local-widget-catalog-v1',label:'Local widgets',holds:'Widget packages you installed.',projectContent:false},
];
export interface NetworkDisclosure {host:string;when:string;sends:string;}
/** The complete list of outbound destinations in this source. Everything else is same-origin. */
export const networkDisclosures:readonly NetworkDisclosure[]=[
 {host:'fonts.googleapis.com, fonts.gstatic.com',when:'Only when a project or the Font library asks for a catalog family that is neither bundled, cached nor installed.',sends:'The font family and weights in a normal web request, which also reveals your IP address and app version to Google. Never project content.'},
{host:'Origins you approve for a local plugin',when:'Only while a plugin that lists those origins runs and you grant it network access for that run. No plugin has network access by default, and the plugin frame cannot reach any other origin.',sends:'Whatever that plugin chooses to send, which can include anything you let it read during that run. Forma adds nothing of its own.'},
];
export const privacyStatements:readonly string[]=[
 'Forma has no account, analytics, telemetry, crash reporting, advertising or cloud sync.',
 'Your projects, comments, images and fonts stay on this device. Forma itself never uploads them; a local plugin you grant network access can send what you let it read.',
 'Bug report bundles, exports and reports are files you save yourself. Forma does not transmit them.',
 'Links you click, such as the online guide or a layer hyperlink, open in your default browser.',
];
export const nativeStatements:readonly string[]=[
 'The Mac app serves its own interface from 127.0.0.1:51981, which only this computer can reach.',
 'macOS keeps the recent files list, and Forma stores open window sessions in its app preferences so it can restore them.',
];
export interface LocalStorageRow {key:string;bytes:number;entry?:StoredEntry;}
export interface LocalStorageInventory {rows:LocalStorageRow[];bytes:number;unknown:number;readable:boolean;}
export function readLocalStorageInventory(storage:Pick<Storage,'length'|'key'|'getItem'>|undefined):LocalStorageInventory{
 const catalog=new Map(localStorageCatalog.map(e=>[e.key,e])),rows:LocalStorageRow[]=[];
 try{if(!storage)return {rows,bytes:0,unknown:0,readable:false};for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key===null)continue;rows.push({key,bytes:new Blob([key,storage.getItem(key)??'']).size,entry:catalog.get(key)});}}catch{return {rows:[],bytes:0,unknown:0,readable:false};}
 rows.sort((a,b)=>b.bytes-a.bytes||a.key.localeCompare(b.key));return {rows,bytes:rows.reduce((sum,r)=>sum+r.bytes,0),unknown:rows.filter(r=>!r.entry).length,readable:true};
}
export interface DatabaseRow {entry:StoredEntry;exists:boolean;records:number|null;}
/** Counts records only; values are never read. Absent databases are not opened, because opening would create them. */
export async function readDatabaseInventory(factory:IDBFactory|undefined):Promise<{rows:DatabaseRow[];measured:boolean}>{
 const unmeasured=()=>({rows:databaseCatalog.map(entry=>({entry,exists:false,records:null})),measured:false});
 if(!factory||typeof factory.databases!=='function')return unmeasured();let names:Set<string>;
 try{names=new Set((await factory.databases()).map(d=>d.name??''));}catch{return unmeasured();}
 const count=(name:string)=>new Promise<number|null>(resolve=>{const request=factory.open(name);request.onerror=()=>resolve(null);request.onblocked=()=>resolve(null);request.onsuccess=()=>{const db=request.result,stores=[...db.objectStoreNames];if(!stores.length){db.close();resolve(0);return;}try{const tx=db.transaction(stores),counts=stores.map(s=>tx.objectStore(s).count());tx.oncomplete=()=>{db.close();resolve(counts.reduce((sum,c)=>sum+c.result,0));};tx.onerror=()=>{db.close();resolve(null);};tx.onabort=()=>{db.close();resolve(null);};}catch{db.close();resolve(null);}};});
 return {rows:await Promise.all(databaseCatalog.map(async entry=>names.has(entry.key)?{entry,exists:true,records:await count(entry.key)}:{entry,exists:false,records:0})),measured:true};
}
/** The page's own Content-Security-Policy is the enforced allowlist, so this reads the policy rather than restating it. */
export function connectPolicy(csp:string|null|undefined){if(!csp)return null;const directive=csp.split(';').map(s=>s.trim()).find(s=>/^connect-src\s/i.test(s));return directive?directive.split(/\s+/).slice(1):null;}
export const policyHosts=(sources:readonly string[])=>sources.filter(s=>/^https?:/i.test(s)).map(s=>new URL(s).hostname);
export interface ObservedRequest {host:string;requests:number;}
export function observedRequests(entries:readonly {name:string}[],origin:string):ObservedRequest[]{const hosts=new Map<string,number>(),home=new URL(origin).host;for(const e of entries){let url:URL;try{url=new URL(e.name);}catch{continue;}if(!['http:','https:','ws:','wss:'].includes(url.protocol)||url.host===home)continue;hosts.set(url.host,(hosts.get(url.host)??0)+1);}return [...hosts].map(([host,requests])=>({host,requests})).sort((a,b)=>b.requests-a.requests||a.host.localeCompare(b.host));}
export const formatBytes=(bytes:number)=>bytes<1024?bytes+' B':bytes<1048576?(bytes/1024).toFixed(1)+' KB':bytes<1073741824?(bytes/1048576).toFixed(1)+' MB':(bytes/1073741824).toFixed(2)+' GB';
