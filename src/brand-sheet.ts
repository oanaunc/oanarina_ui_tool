import {uid} from './model';
import type {DesignDocument} from './model';
import {BRAND_LIMITS,assertSlotText,brandOf,brandSize,brandSizes,brandTemplate,createBrandAsset,brandPage,brandFrameNodes,validateBrandName} from './brand-assets';
import type {BrandImage,BrandSlot} from './brand-assets';
import {embeddedImageInfo} from './image-paint';
export const BRAND_SHEET_LIMITS={bytes:5_000_000,rows:500,columns:64,cell:BRAND_LIMITS.text,header:120} as const;
export interface BrandSheet {delimiter:','|'\t';headers:string[];rows:string[][];lines:number[];}
const fail=(line:number,message:string)=>Error(`Line ${line}: ${message}`);
const controls=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/;
function detectDelimiter(raw:string):','|'\t'{let quoted=false;for(const c of raw){if(c==='"')quoted=!quoted;else if(!quoted){if(c==='\t')return '\t';if(c==='\n'||c==='\r')break;}}return ',';}
/** RFC 4180 state machine. Nothing is coerced: ragged rows, stray quotes and control characters are errors. */
export function parseBrandSheet(input:string,delimiter?:','|'\t'):BrandSheet{
 if(typeof input!=='string')throw Error('Choose a CSV or TSV file.');if(new TextEncoder().encode(input).length>BRAND_SHEET_LIMITS.bytes)throw Error('Spreadsheets support up to 5 MB.');
 const raw=input.replace(/^﻿/,'');if(!raw.trim())throw Error('This spreadsheet is empty.');
 const sep=delimiter??detectDelimiter(raw),rows:string[][]=[],lines:number[]=[];let row:string[]=[],cell='',line=1,rowLine=1,quoted=false,wasQuoted=false,i=0;
 const endCell=()=>{if(cell.length>BRAND_SHEET_LIMITS.cell)throw fail(rowLine,`a cell exceeds ${BRAND_SHEET_LIMITS.cell.toLocaleString('en-US')} characters.`);if(controls.test(cell))throw fail(rowLine,'a cell contains a control character.');row.push(cell);cell='';wasQuoted=false;if(row.length>BRAND_SHEET_LIMITS.columns)throw fail(rowLine,`spreadsheets support up to ${BRAND_SHEET_LIMITS.columns} columns.`);};
 const endRow=()=>{endCell();rows.push(row);lines.push(rowLine);if(rows.length>BRAND_SHEET_LIMITS.rows+1)throw Error(`Spreadsheets support up to ${BRAND_SHEET_LIMITS.rows} rows.`);row=[];rowLine=line;};
 while(i<raw.length){const c=raw[i];
  if(quoted){if(c==='"'){if(raw[i+1]==='"'){cell+='"';i+=2;continue;}quoted=false;i++;continue;}if(c==='\n'||c==='\r'&&raw[i+1]!=='\n')line++;cell+=c==='\r'?raw[i+1]==='\n'?'':'\n':c;i++;continue;}
  if(c==='"'){if(cell||wasQuoted)throw fail(line,'a quote must start the cell and double any quote inside it.');quoted=true;wasQuoted=true;i++;continue;}
  if(wasQuoted&&c!==sep&&c!=='\n'&&c!=='\r')throw fail(line,'text follows a closing quote.');
  if(c===sep){endCell();i++;continue;}
  if(c==='\n'||c==='\r'){i+=c==='\r'&&raw[i+1]==='\n'?2:1;line++;endRow();continue;}
  cell+=c;i++;
 }
 if(quoted)throw fail(rowLine,'a quoted cell is not closed.');if(cell||row.length||wasQuoted)endRow();
 while(rows.length&&rows.at(-1)!.every(v=>!v.trim())){rows.pop();lines.pop();}
 if(rows.length<2)throw Error('Add a header row and at least one data row.');
 const headers=rows[0].map(h=>h.trim()),seen=new Set<string>();headers.forEach((h,index)=>{if(!h)throw fail(lines[0],`column ${index+1} has no heading.`);if(h.length>BRAND_SHEET_LIMITS.header)throw fail(lines[0],`the heading “${h.slice(0,40)}…” is too long.`);const key=h.toLocaleLowerCase();if(seen.has(key))throw fail(lines[0],`the heading “${h}” is repeated.`);seen.add(key);});
 const body=rows.slice(1),bodyLines=lines.slice(1);body.forEach((r,index)=>{if(r.length!==headers.length)throw fail(bodyLines[index],`expected ${headers.length} cells, found ${r.length}.`);});
 if(body.length>BRAND_SHEET_LIMITS.rows)throw Error(`Spreadsheets support up to ${BRAND_SHEET_LIMITS.rows} rows.`);
 return {delimiter:sep,headers,rows:body,lines:bodyLines};
}
export type BrandColumnTarget={kind:'name'}|{kind:'size'}|{kind:'slot';slotId:string}|{kind:'ignore'}|{kind:'unmapped'};
export function defaultBrandMapping(sheet:BrandSheet,slots:readonly BrandSlot[]):BrandColumnTarget[]{return sheet.headers.map(h=>{const key=h.toLocaleLowerCase();if(key==='name')return {kind:'name'};if(key==='size')return {kind:'size'};const slot=slots.find(s=>s.name.toLocaleLowerCase()===key);return slot?{kind:'slot',slotId:slot.id}:{kind:'unmapped'};});}
export interface BrandReviewRow {index:number;line:number;name:string;sizeId?:string;text:Record<string,string>;images:Record<string,string>;issues:string[];notes:string[];}
export interface BrandSheetReview {templateId:string;errors:string[];notes:string[];rows:BrandReviewRow[];}
export type BrandImageFiles=ReadonlyMap<string,BrandImage>;
export const brandImageKey=(name:string)=>name.trim().split(/[\\/]/).pop()!.toLocaleLowerCase();
/** Nothing touches the document here. Each row states exactly what would be written or why it cannot be. */
export function reviewBrandSheet(d:Pick<DesignDocument,'pages'|'brand'>,templateId:string,sheet:BrandSheet,mapping:readonly BrandColumnTarget[],images:BrandImageFiles,sizeIds:readonly string[]=[]):BrandSheetReview{
 const t=brandTemplate(d,templateId),errors:string[]=[],notes:string[]=[];if(t.status!=='published')errors.push('Publish this template before creating a batch.');if(mapping.length!==sheet.headers.length)throw Error('Map every spreadsheet column.');
 sheet.headers.forEach((h,i)=>{if(mapping[i].kind==='unmapped')errors.push(`Choose a slot for the column “${h}”, or ignore it.`);if(mapping[i].kind==='ignore')notes.push(`The column “${h}” will be ignored.`);});
 const used=new Set<string>();mapping.forEach((m,i)=>{const key=m.kind==='slot'?m.slotId:m.kind;if(m.kind==='ignore'||m.kind==='unmapped')return;if(used.has(key))errors.push(`Two columns write the same target. Check “${sheet.headers[i]}”.`);used.add(key);});
 for(const m of mapping)if(m.kind==='slot'&&!t.slots.some(s=>s.id===m.slotId))errors.push('A column points at a slot that no longer exists.');
 const unmapped=t.slots.filter(s=>!used.has(s.id)).map(s=>s.name);if(unmapped.length)notes.push(`Keeping template content for ${unmapped.join(', ')}.`);
 const unknownSize=sizeIds.find(id=>!brandSize(id));if(unknownSize)errors.push('Choose known size presets.');
 const names=new Set<string>(),rows=sheet.rows.map((cells,index)=>{const row:BrandReviewRow={index,line:sheet.lines[index],name:'',text:{},images:{},issues:[],notes:[]};let filled=false;
  mapping.forEach((m,i)=>{const value=cells[i];if(m.kind==='name'){if(value.trim()){try{row.name=validateBrandName(value,'Asset name');filled=true;}catch(e){row.issues.push((e as Error).message);}}}
   else if(m.kind==='size'){if(value.trim()){const key=value.trim().toLocaleLowerCase(),size=brandSizes.find(s=>s.id===key||s.name.toLocaleLowerCase()===key);if(!size)row.issues.push(`“${value}” is not a size preset.`);else row.sizeId=size.id;}}
   else if(m.kind==='slot'){const slot=t.slots.find(s=>s.id===m.slotId);if(!slot)return;if(!value){row.notes.push(`${slot.name}: keeps template content.`);return;}filled=true;if(slot.kind==='text'){try{assertSlotText(slot,value);row.text[slot.id]=value;}catch(e){row.issues.push((e as Error).message);}}else{const ref=value.trim();if(/^https?:/i.test(ref))row.issues.push(`${slot.name}: web addresses are not fetched. Attach “${ref.slice(0,60)}” as a local image.`);else if(ref.startsWith('data:')){try{embeddedImageInfo(ref);row.issues.push(`${slot.name}: attach image files instead of inline data.`);}catch{row.issues.push(`${slot.name}: this inline image is invalid.`);}}else if(!images.has(brandImageKey(ref)))row.issues.push(`${slot.name}: “${ref}” is not attached.`);else row.images[slot.id]=brandImageKey(ref);}}});
  if(!filled)row.issues.push('This row has no values.');if(!row.name)row.name=`${t.name.slice(0,BRAND_LIMITS.name-8)} ${index+1}`;const key=row.name.toLocaleLowerCase();if(names.has(key))row.notes.push('Another row uses this name; exports stay unique.');names.add(key);return row;});
 const clean=rows.filter(r=>!r.issues.length),perRow=(r:BrandReviewRow)=>r.sizeId?1:Math.max(1,sizeIds.length),total=clean.reduce((n,r)=>n+perRow(r),0),brand=brandOf(d);
 if(brand.assets.length+total>BRAND_LIMITS.assets)errors.push(`This batch would exceed the ${BRAND_LIMITS.assets.toLocaleString('en-US')} asset limit.`);
 if(t.status==='published'){const page=brandPage(d,'asset'),layers=brandFrameNodes(brandPage(d,'template'),t.frameId).length*total;if(page.nodes.length+layers>BRAND_LIMITS.pageNodes)errors.push('This batch would exceed the 20,000-layer page limit.');}
 return {templateId,errors,notes,rows};
}
export interface BrandBatchPlan {name:string;templateId:string;review:BrandSheetReview;include:readonly number[];sizeIds:readonly string[];images:BrandImageFiles;now?:string;}
/** Commit reviewed rows as real assets in one mutation, so one Undo removes the whole batch. */
export function applyBrandBatch(d:DesignDocument,plan:BrandBatchPlan){
 const name=validateBrandName(plan.name,'Batch name'),brand=brandOf(d),now=plan.now??new Date().toISOString();if(plan.review.templateId!==plan.templateId)throw Error('Review this spreadsheet again for the chosen template.');if(plan.review.errors.length)throw Error(plan.review.errors[0]);
 const chosen=new Set(plan.include),rows=plan.review.rows.filter(r=>chosen.has(r.index));if(!rows.length)throw Error('Choose at least one row.');const bad=rows.find(r=>r.issues.length);if(bad)throw Error(`Line ${bad.line}: ${bad.issues[0]}`);if(brand.batches.length>=BRAND_LIMITS.batches)throw Error('A brand project keeps up to 200 batches.');
 const batch={id:uid(),name,createdAt:now,rows:rows.length,assets:0},ids:string[]=[];brand.batches.push(batch);
 for(const row of rows){const images=Object.fromEntries(Object.entries(row.images).map(([slot,key])=>{const image=plan.images.get(key);if(!image)throw Error(`Line ${row.line}: an attached image is missing.`);return [slot,image];})),sizes=row.sizeId?[row.sizeId]:plan.sizeIds.length?plan.sizeIds:[undefined];for(const sizeId of sizes){const size=sizeId?brandSize(sizeId):undefined,asset=createBrandAsset(d,plan.templateId,{name:sizes.length>1&&size?`${row.name.slice(0,BRAND_LIMITS.name-size.name.length-3)} · ${size.name}`:row.name,sizeId,batchId:batch.id,text:row.text,images,now});ids.push(asset.id);}}
 batch.assets=ids.length;return ids;
}
