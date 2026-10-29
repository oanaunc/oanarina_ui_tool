import {describe,it,expect} from 'vitest';
import {blankDocument,node,parseDocument} from '../src/model';
import {createEffect,effectPadding,effectsFor} from '../src/effects';
import {currentPage,useEditor} from '../src/store';
describe('effect stacks',()=>{
 it('preserves legacy shadow and blur with equivalent parameters',()=>{const n=node('rectangle',{shadow:true,blur:6});expect(effectsFor(n)).toMatchObject([{type:'drop-shadow',y:5,radius:16,opacity:.18},{type:'layer-blur',radius:12}]);expect(effectsFor({...n,effects:[]})).toEqual([]);});
 it('round-trips multiple effects and group isolation',()=>{const d=blankDocument();d.pages[0].nodes=[node('group',{isolate:true,effects:[{...createEffect('inner-shadow'),spread:3,x:12},createEffect('layer-blur')]})];expect(parseDocument(JSON.stringify(d))).toEqual(d);});
 it('rejects invalid colors, types and non-finite or unbounded parameters',()=>{for(const patch of [{color:'url(http://bad)'},{type:'background-blur'},{radius:-1},{radius:1001},{spread:NaN},{opacity:2},{x:10001}]){const d=blankDocument();d.pages[0].nodes=[node('rectangle',{effects:[{...createEffect(),...patch} as ReturnType<typeof createEffect>]})];expect(()=>parseDocument(JSON.stringify(d))).toThrow();}});
 it('supports undo and redo after effect modifications',()=>{const s=()=>useEditor.getState();s().newDocument();const id=s().add('rectangle');s().patch([id],{effects:[createEffect()]});s().undo();expect(currentPage().nodes[0].effects).toBeUndefined();s().redo();expect(currentPage().nodes[0].effects).toHaveLength(1);});
 it('includes visible outer effects in the filter region',()=>{const e={...createEffect(),x:20,y:5,radius:10,spread:4};expect(effectPadding([e])).toBe(44);expect(effectPadding([{...e,visible:false},{...e,type:'inner-shadow'}])).toBe(0);});
});
