import {describe,it,expect} from 'vitest';
import {node} from '../src/model';
import {shareUnchangedNodes} from '../src/share-nodes';
const page=(nodes:ReturnType<typeof node>[])=>({id:'p',nodes});
describe('sharing unchanged layers after an edit',()=>{
 it('reuses layers that match and keeps the ones that changed',()=>{const a=node('rectangle',{id:'a'}),b=node('rectangle',{id:'b'}),next=page(structuredClone([a,b]));next.nodes[1].x=50;shareUnchangedNodes([page([a,b])],[next]);expect(next.nodes[0]).toBe(a);expect(next.nodes[1]).not.toBe(b);expect(next.nodes[1].x).toBe(50);});
 it('reuses the whole list when nothing changed, and notices order, added and removed layers',()=>{const a=node('rectangle',{id:'a'}),b=node('rectangle',{id:'b'}),old=page([a,b]),same=page(structuredClone([a,b])),turned=page(structuredClone([b,a])),fewer=page(structuredClone([a]));shareUnchangedNodes([old],[same]);expect(same.nodes).toBe(old.nodes);shareUnchangedNodes([old],[turned]);expect(turned.nodes.map(n=>n.id)).toEqual(['b','a']);expect(turned.nodes).not.toBe(old.nodes);shareUnchangedNodes([old],[fewer]);expect(fewer.nodes).toEqual([a]);});
 it('compares inside nested values and leaves new pages alone',()=>{const a=node('rectangle',{id:'a',effects:[]}),changed=structuredClone(a);changed.effects=[{id:'e'} as never];const next=page([changed]);shareUnchangedNodes([page([a])],[next]);expect(next.nodes[0]).toBe(changed);const fresh={id:'new',nodes:[node('rectangle',{id:'a'})]},held=fresh.nodes[0];shareUnchangedNodes([page([a])],[fresh]);expect(fresh.nodes[0]).toBe(held);});
});
