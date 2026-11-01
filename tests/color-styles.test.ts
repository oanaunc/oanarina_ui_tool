import {describe,expect,it} from 'vitest';
import {deleteStyle,nextStyleName,renameStyle,setStyleColor,stylePaint,styleFolder,styleIsSolid,swatchBackground} from '../src/color-styles';
import {applyDesignSystems,createStyle} from '../src/design-systems';
import {blankDocument,node} from '../src/model';
import {createPaint} from '../src/paints';
const file=()=>{const d=blankDocument(),a=node('rectangle',{id:'a',fill:'#675d42',paints:[createPaint('#675d42')]}),b=node('text',{id:'b',fill:'#000000'});d.pages[0].nodes=[a,b];const id=createStyle(d,a,'paint','Olive');a.styleIds={paint:id};b.styleIds={paint:id};applyDesignSystems(d);return {d,a,b,id};};
describe('color styles',()=>{
 it('reads a saved fill back as one color',()=>{const {d}=file(),style=d.styles![0];expect(stylePaint(style)).toEqual({color:'#675d42',opacity:1});expect(styleIsSolid(style)).toBe(true);expect(swatchBackground(style)).toBe('#675d42');});
 it('changes every layer that uses it, and keeps opacity and the paint id',()=>{const {d,a,b,id}=file(),paint=d.styles![0].value.paints![0].id;setStyleColor(d,id,'#112233',.5);applyDesignSystems(d);for(const n of [a,b])expect(n.fill).toBe('#112233');expect(a.paints?.[0]).toMatchObject({id:paint,color:'#112233',opacity:.5});});
 it('tells a gradient style apart from one color',()=>{const paint=createPaint('#000000');paint.type='linear';expect(styleIsSolid({value:{paints:[paint]}})).toBe(false);expect(swatchBackground({value:{paints:[{...paint,stops:[{id:'1',position:0,color:'#000000',opacity:1},{id:'2',position:1,color:'#ffffff',opacity:1}]}]}})).toContain('linear-gradient');});
 it('needs a real name, and folders come from a slash',()=>{const {d,id}=file();expect(()=>renameStyle(d,id,'  ')).toThrow(/name/);renameStyle(d,id,' Brand/Olive ','Accent');expect(d.styles![0]).toMatchObject({name:'Brand/Olive',description:'Accent'});expect(styleFolder('Brand/Dark/Olive')).toEqual({folder:'Brand/Dark',label:'Olive'});expect(styleFolder('Olive')).toEqual({folder:'',label:'Olive'});});
 it('leaves layers their color when a style is deleted',()=>{const {d,a,id}=file();deleteStyle(d,id);applyDesignSystems(d);expect(d.styles).toEqual([]);expect(a.styleIds?.paint).toBeUndefined();expect(a.fill).toBe('#675d42');expect(()=>deleteStyle(d,id)).toThrow(/no longer exists/);});
 it('offers the next free name',()=>{expect(nextStyleName()).toBe('Color 1');expect(nextStyleName([{name:'Color 1'},{name:'Color 3'}])).toBe('Color 2');});
});
