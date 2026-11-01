import {effectsFor} from './effects';
import {fontAssetKey,parseFontFile} from './font-data';
import type {DesignNode} from './model';
import {fillsFor,strokesFor} from './paints';
import {exactOutlineFont,nativeOutlinePositions} from './svg-text-outlines';
import type {OutlineFontContext} from './svg-text-outlines';
import {currentTextOutline} from './text-outline';
import {textLines} from './text-layout';
import {parseOutlineTtf} from './ttf-outline';
import {glyphsMatchBrowser} from './design-pdf-proof';
/** A face used on any page. Glyphs gather across the document, so one subset serves every page. */
export interface PdfFace {key:string;bytes:Uint8Array;used:Map<number,string>;}
export interface PdfTextRun {gids:number[];xs:number[];y:number;}
export interface PdfTextPlan {face:string;size:number;color:string;opacity:number;runs:PdfTextRun[];}
export interface PdfTextContext {fonts:OutlineFontContext;faces:Map<string,PdfFace>;parsed:Map<string,ReturnType<typeof parseOutlineTtf>>;positions?:typeof nativeOutlinePositions;proof?:typeof glyphsMatchBrowser;proved?:number;}
const LATIN=/^[\x20-\x7e\n -ɏ‐-‧‰-⁞₠-₿]*$/;
const LIMIT={characters:20000,faces:32,proofs:1024};
/** Why a layer stays a picture. Listed so a new typography feature cannot quietly misprint. */
function unsupported(n:DesignNode){if(n.type!=='text'||n.textPath||n.textRuns?.length||n.fontFallbacks?.length||n.smallCaps||n.textPosition&&n.textPosition!=='normal'||n.decorations?.length||n.underline||n.clip||n.textAlign==='justify'||n.textDirection==='rtl'||n.paragraphStyles?.length||n.listStyle&&n.listStyle!=='none'||n.maxLines||n.textOverflow==='ellipsis'||n.hangingQuotes||n.hangingPunctuation||n.textVerticalTrim==='cap-height'||n.textBackground||n.fillRule==='evenodd')return true;if(Object.keys(n.fontAxes??{}).length||Object.entries(n.fontFeatures??{}).some(([tag,v])=>tag!=='kern'||![0,1].includes(v)))return true;if(strokesFor(n).some(s=>s.visible&&s.paint.visible&&s.paint.opacity>0&&s.width>0)||effectsFor(n).some(e=>e.visible)||n.shadow||n.blur)return true;if(n.blendMode&&n.blendMode!=='normal'||n.isolate)return true;return !Number.isFinite(n.fontSize)||n.fontSize<1||n.fontSize>4096||n.text.length>LIMIT.characters||!LATIN.test(n.text);}
const toBytes=(data:string)=>{const raw=atob(data.slice(data.indexOf(',')+1));return Uint8Array.from(raw,c=>c.charCodeAt(0));};
function faceFor(n:DesignNode,shown:string,c:PdfTextContext){const asset=exactOutlineFont(n,shown,c.fonts),key=fontAssetKey(asset);let font=c.parsed.get(key),face=c.faces.get(key);if(!font||!face){if(c.faces.size>=LIMIT.faces)throw Error('Too many font faces to embed.');const bytes=toBytes(asset.data);if(!parseFontFile(bytes.buffer).embeddable)throw Error('This font forbids embedding.');font=parseOutlineTtf(bytes.buffer as ArrayBuffer);face={key,bytes,used:new Map()};c.parsed.set(key,font);c.faces.set(key,face);}return {font,face};}
/** Glyph runs at the browser's own character origins, so kerning and tracking match the canvas. Returns undefined to keep this layer as a raster area. */
export function pdfTextPlan(n:DesignNode,c:PdfTextContext):PdfTextPlan|undefined{if(unsupported(n)||currentTextOutline(n)!==undefined)return undefined;const fills=fillsFor(n).filter(p=>p.visible&&p.opacity>0);if(fills.length!==1||fills[0].type!=='solid'||!/^#[0-9a-f]{6}$/i.test(fills[0].color))return undefined;try{const lines=textLines(n);if(lines.some(line=>line.direction!=='ltr'||line.marker))return undefined;const shown=lines.map(line=>line.text).join('');if(!shown.trim())return undefined;const {font,face}=faceFor(n,shown,c),place=c.positions??nativeOutlinePositions,runs:PdfTextRun[]=[],pending:[number,string][]=[];for(const line of lines){if(!line.text)continue;const chars=Array.from(line.text);if(chars.length!==line.text.length)return undefined;const gids=chars.map(ch=>font.charGlyph(ch,true));if(gids.some(g=>!g))return undefined;const positions=place(n,line);let plain=true;try{font.shaping(gids);}catch{plain=false;}if(!plain){c.proved=(c.proved??0)+1;if(c.proved>LIMIT.proofs||!(c.proof??glyphsMatchBrowser)(n,line,gids.map(g=>g?font.glyph(g):{contours:[],advance:0}),positions,font.units))return undefined;}runs.push({gids,xs:positions.map(p=>p.x),y:positions[0].y});chars.forEach((ch,i)=>pending.push([gids[i],ch]));}for(const [gid,ch] of pending)if(!face.used.has(gid))face.used.set(gid,ch);return {face:face.key,size:n.fontSize,color:fills[0].color,opacity:fills[0].opacity*n.opacity,runs};}catch{return undefined;}}
