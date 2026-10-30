import {describe,expect,it} from 'vitest';
import {node} from '../src/model';
import {layerPreviewGeometry,layerPreviewIndex} from '../src/layer-thumbnail';
import {worldMatrix} from '../src/transforms';

describe('bounded layer preview geometry',()=>{
 it('retains ancestor transforms and clips without unrelated ancestor paint or siblings',()=>{
  const frame=node('frame',{id:'f',x:100,y:50,width:200,height:100,rotation:27,clip:true,fill:'#ff0000'}),child=node('rectangle',{id:'c',parentId:'f',x:120,y:60,width:20,height:30}),other=node('rectangle',{id:'unrelated',parentId:'f'}),nodes=[frame,child,other],before=JSON.stringify(nodes),g=layerPreviewGeometry(layerPreviewIndex(nodes),'c');
  expect(g.nodes.map(n=>n.id)).toEqual(['f','c']);expect(g.nodes[0].exportGhost).toBe(true);expect(g.nodes[0].clip).toBe(true);expect(g.nodes[0].paints).toEqual([]);expect(worldMatrix(g.nodes[1],g.nodes)).toEqual(worldMatrix(child,nodes));expect(JSON.stringify(nodes)).toBe(before);
 });
 it('keeps the selected subtree and relevant ancestor and sibling masks only',()=>{
  const mask=node('ellipse',{id:'mask',mask:{mode:'vector'}}),group=node('group',{id:'g'}),child=node('rectangle',{id:'c',parentId:'g'}),innerMask=node('ellipse',{id:'inner',parentId:'g',mask:{mode:'alpha'}}),inner=node('rectangle',{id:'inner-child',parentId:'inner'}),target=node('rectangle',{id:'target',parentId:'g'}),nodes=[mask,group,child,innerMask,inner,target,node('rectangle',{id:'other'})];
  const g=layerPreviewGeometry(layerPreviewIndex(nodes),'target');expect(new Set(g.nodes.map(n=>n.id))).toEqual(new Set(['mask','g','inner','inner-child','target']));expect(g.nodes.find(n=>n.id==='g')?.exportGhost).toBe(true);
  const all=layerPreviewGeometry(layerPreviewIndex(nodes),'g');expect(all.nodes).toHaveLength(6);
 });
 it('handles small subtrees on a large reverse-ordered page without previewing unrelated layers',()=>{
  const nodes=Array.from({length:20000},(_,i)=>node('rectangle',{id:'n'+i}));nodes.push(node('rectangle',{id:'child',parentId:'parent'}),node('group',{id:'parent'}));const g=layerPreviewGeometry(layerPreviewIndex(nodes),'child');expect(g.nodes.map(n=>n.id)).toEqual(['child','parent']);
 });
 it('refuses oversized subtrees, missing ancestors and cycles rather than dropping artwork',()=>{
  const nodes=[node('group',{id:'g'}),...Array.from({length:500},(_,i)=>node('rectangle',{id:'c'+i,parentId:'g'}))];expect(()=>layerPreviewGeometry(layerPreviewIndex(nodes),'g')).toThrow('500');expect(()=>layerPreviewGeometry(layerPreviewIndex([node('rectangle',{id:'a',parentId:'missing'})]),'a')).toThrow('missing');expect(()=>layerPreviewGeometry(layerPreviewIndex([node('group',{id:'a',parentId:'b'}),node('group',{id:'b',parentId:'a'})]),'a')).toThrow('cycles');
 });
 it('uses slice crop geometry and refuses large whole-page slice previews',()=>{
  const slice=node('slice',{id:'slice',x:100,y:80,width:50,height:60,rotation:30}),shape=node('rectangle'),g=layerPreviewGeometry(layerPreviewIndex([shape,slice]),'slice');expect(g.nodes).toEqual([shape]);expect(g.viewport).toEqual({x:0,y:0,width:50,height:60});expect(g.transform).toBeDefined();expect(()=>layerPreviewGeometry(layerPreviewIndex([slice,...Array.from({length:500},()=>node('rectangle'))]),'slice')).toThrow('500');
 });
 it('reports hidden layers and invalid geometry as unavailable',()=>{
  expect(()=>layerPreviewGeometry(layerPreviewIndex([node('rectangle',{id:'h',visible:false})]),'h')).toThrow('visible');expect(()=>layerPreviewGeometry(layerPreviewIndex([]),'absent')).toThrow('no longer');
 });
});
