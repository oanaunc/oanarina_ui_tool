import {describe,it,expect} from 'vitest';
import {node} from '../src/model';
import {exportSelection} from '../src/transforms';
import {exportSvg} from '../src/files';
describe('independent masked export selection review',()=>{
 it('includes only the active sibling source and selected artwork',()=>{const old=node('ellipse',{id:'old-source',mask:{mode:'alpha'}}),oldArt=node('rectangle',{id:'old-art'}),source=node('ellipse',{id:'source',mask:{mode:'alpha'}}),art=node('rectangle',{id:'selected'}),other=node('rectangle',{id:'unrelated'}),nodes=[old,oldArt,source,art,other],selected=exportSelection(nodes,[art.id]);expect(selected.map(n=>n.id)).toEqual(['source','selected']);const svg=exportSvg(selected);expect(svg).toContain('layer-mask-source');expect(svg).not.toContain('old-source');expect(svg).not.toContain('unrelated');});
 it('preserves ancestor mask and clip geometry for a selected descendant',()=>{const source=node('ellipse',{id:'source',mask:{mode:'vector'}}),owner=node('frame',{id:'owner',x:20,y:30,rotation:25,clip:true}),art=node('rectangle',{id:'selected',parentId:owner.id,x:30,y:40}),other=node('rectangle',{id:'unrelated',parentId:owner.id}),nodes=[source,owner,art,other],selected=exportSelection(nodes,[art.id]);expect(selected.map(n=>n.id)).toEqual(['source','owner','selected']);expect(selected.find(n=>n.id===owner.id)).toMatchObject({exportGhost:true,clip:true,rotation:25,fill:'none'});const svg=exportSvg(selected);expect(svg).toContain('layer-mask-source');expect(svg).toContain('local-clip-owner');expect(svg).not.toContain('data-node-id="unrelated"');});
});
