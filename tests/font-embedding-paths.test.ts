import {it,expect} from 'vitest';
import {blankDocument,node} from '../src/model';
import {useEditor} from '../src/store';
import {exportSvg,serializedProject} from '../src/files';
import {googleFontUrl} from '../src/fonts';
import type {FontAsset} from '../src/font-data';
const face=(weight:string,extra:Partial<FontAsset>={}):FontAsset=>({family:'Example',weight,data:'data:font/ttf;base64,'+btoa('font-'+weight),source:'google',embeddable:true,...extra});
function load(fonts:FontAsset[],text='Hello',fontWeight=400){const d=blankDocument(),n=node('text',{id:'t',text,fontFamily:'Example',fontWeight});d.fonts=fonts;d.pages[0].nodes=[n];useEditor.getState().load(d);return useEditor.getState().doc.pages[0].nodes;}
it('requests a single continuous weight range for a variable family',()=>{const url=googleFontUrl({family:'Example Sans',category:'Sans',subsets:[],weights:[400],italicWeights:[],axes:[{tag:'wght',min:100,max:900}],popularity:1,designers:[],bundled:false});expect(decodeURIComponent(url)).toContain('Example Sans:wght@100..900');});
it('saving a project embeds exactly the faces its text uses',()=>{load([face('400'),face('700')]);const saved=JSON.parse(serializedProject());expect(saved.fonts.map((f:FontAsset)=>f.weight)).toEqual(['400']);});
it('a variable font file covers any used weight with one embedded face',()=>{load([face('100 900')],'Hello',650);expect(JSON.parse(serializedProject()).fonts.map((f:FontAsset)=>f.weight)).toEqual(['100 900']);});
it('never embeds a face whose license forbids it, in the project or in SVG',()=>{const nodes=load([face('400',{embeddable:false})]);expect(JSON.parse(serializedProject()).fonts??[]).toHaveLength(0);expect(exportSvg(nodes)).not.toContain('@font-face');});
it('SVG export carries the used face as an inline font without touching the document',()=>{const nodes=load([face('400'),face('700')]),before=useEditor.getState().doc,svg=exportSvg(nodes);expect(svg).toContain('@font-face');expect(svg).toContain(btoa('font-400'));expect(svg).not.toContain(btoa('font-700'));expect(useEditor.getState().doc).toBe(before);});
