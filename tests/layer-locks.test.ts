import {it,expect} from 'vitest';
import {node} from '../src/model';
import {layerLocks,selectionHasLocked} from '../src/layer-locks';
it('resolves inherited locks across reversed 20,000-layer snapshots without recursion',()=>{const nodes=Array.from({length:20000},(_,i)=>node('group',{id:'n'+i,parentId:i?'n'+(i-1):null,locked:i===1})).reverse(),locks=layerLocks(nodes);expect(locks.get('n0')).toBe(false);expect(locks.get('n1')).toBe(true);expect(locks.get('n19999')).toBe(true);expect(selectionHasLocked(nodes,['n0'])).toBe(false);expect(selectionHasLocked(nodes,['n0','n19999'])).toBe(true);nodes.find(n=>n.id==='n1')!.locked=false;expect(selectionHasLocked(nodes,['n19999'])).toBe(false);});
it('rejects cycles instead of hanging during UI lock checks',()=>{const a=node('group',{id:'a',parentId:'b'}),b=node('group',{id:'b',parentId:'a'});expect(()=>layerLocks([a,b])).toThrow(/cycle/);});
