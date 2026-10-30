import {it,expect} from 'vitest';
import {node} from '../src/model';
import {createPaint} from '../src/paints';
import {textSelectionColors,textColorPickerValue} from '../src/text-selection-colors';

it('reports effective character overrides while preserving the renderer’s layer-stack inheritance semantics',()=>{
 const n=node('text',{text:'abcdef',fill:'#202027',paints:[createPaint('#123456','linear')],textRuns:[{start:1,end:3,fill:'#ff000080'},{start:3,end:5,fill:'#202027'}]}),before=structuredClone(n),s=textSelectionColors(n,0,6);
 expect(s.rows).toEqual([{kind:'layer',color:'',units:4},{kind:'override',color:'#FF000080',units:2}]);expect(s.fills).toEqual([{type:'linear',opacity:1}]);expect(n).toEqual(before);
});
it('normalizes equivalent literal color spellings without merging overrides with inherited paints',()=>{
 const n=node('text',{text:'abcdef',fill:'#ffffff',textRuns:[{start:0,end:1,fill:'#fff'},{start:1,end:2,fill:'#FFFFFFFF'},{start:2,end:3,fill:'#ffffff'},{start:3,end:4,fill:'#f008'},{start:4,end:5,fill:'none'}]});
 expect(textSelectionColors(n,0,6).rows).toEqual([{kind:'override',color:'#FFFFFF',units:2},{kind:'layer',color:'',units:2},{kind:'override',color:'#FF000088',units:1},{kind:'override',color:'none',units:1}]);
});
it('safe selections include complete surrogate pairs and caret/empty text report no guessed color',()=>{
 const n=node('text',{text:'A😀B',textRuns:[{start:1,end:3,fill:'#123456'}]});expect(textSelectionColors(n,2,3)).toMatchObject({start:1,end:3,caret:false,rows:[{kind:'override',color:'#123456',units:2}]});expect(textSelectionColors(n,2,2)).toMatchObject({start:1,end:1,caret:true,rows:[]});expect(textSelectionColors(node('text',{text:''}),0,0).rows).toEqual([]);
});
it('hidden or zero-opacity layer paints are excluded but stored overrides are retained honestly',()=>{
 const a=createPaint('#000000'),b=createPaint('#ffffff');a.visible=false;b.opacity=0;const n=node('text',{text:'ab',paints:[a,b],textRuns:[{start:0,end:1,fill:'#ff0000'}]});expect(textSelectionColors(n,0,2)).toMatchObject({fills:[],total:2,rows:[{kind:'override',color:'#FF0000',units:1},{kind:'layer',color:'',units:1}]});
});
it('large selections preserve exact distinct-style counts while bounding displayed rows',()=>{
 const n=node('text',{text:'x'.repeat(1000),textRuns:Array.from({length:1000},(_,i)=>({start:i,end:i+1,fill:'#'+i.toString(16).padStart(6,'0')}))}),s=textSelectionColors(n,0,1000);expect(s.total).toBe(1000);expect(s.rows).toHaveLength(128);expect(s.rows[127].color).toBe('#00007F');
});
it('rejects malformed ranges and nontext targets without touching their data',()=>{const n=node('text',{text:'hello'}),before=structuredClone(n);for(const [a,b] of [[-1,1],[0,6],[2,1],[NaN,2],[0,.5]])expect(()=>textSelectionColors(n,a,b)).toThrow();expect(()=>textSelectionColors(node('rectangle'),0,1)).toThrow();expect(n).toEqual(before);});
it('opaque picker swatches retain RGB for shorthand/alpha colors without rewriting stored values',()=>{for(const [input,rgb] of [['#f008','#FF0000'],['#abcdef12','#ABCDEF'],['#abc','#AABBCC'],['none','#202027']])expect(textColorPickerValue(input)).toBe(rgb);});
