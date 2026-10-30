import {it,expect} from 'vitest';
import {node} from '../src/model';
import {constraintGuides,constraintParent,useConstraintGuides} from '../src/constraint-guides';
import {point,worldMatrix} from '../src/transforms';
it('shows the independent horizontal and vertical pin modes in parent axes',()=>{
 const p=node('frame',{x:100,y:80,width:500,height:400}),n=node('rectangle',{parentId:p.id,x:140,y:110,width:80,height:60,constraintX:'start',constraintY:'end'}),nodes=[p,n];
 expect(constraintGuides(n,nodes)).toEqual([{axis:'x',mode:'start',from:{x:100,y:140},to:{x:140,y:140}},{axis:'y',mode:'end',from:{x:180,y:170},to:{x:180,y:480}}]);
 n.constraintX='center';n.constraintY='stretch';expect(constraintGuides(n,nodes)).toHaveLength(3);expect(constraintGuides(n,nodes)[0]).toMatchObject({from:{x:350,y:140},to:{x:180,y:140}});
 n.constraintX='scale';expect(constraintGuides(n,nodes).filter(g=>g.axis==='x')).toHaveLength(2);
});
it('honors rotated, reflected and scaled ancestors without applying the child rotation twice',()=>{
 const root=node('frame',{x:20,y:30,rotation:31,motionScaleX:1.4,motionScaleY:.7}),p=node('frame',{parentId:root.id,x:40,y:60,width:300,height:200,rotation:-22,flipX:true}),n=node('rectangle',{parentId:p.id,x:80,y:90,width:80,height:60,rotation:47,constraintX:'end'}),nodes=[root,p,n],expected=point(worldMatrix(p,nodes),120,60),line=constraintGuides(n,nodes)[0];expect(line.from.x).toBeCloseTo(expected.x);expect(line.from.y).toBeCloseTo(expected.y);expect(line.to).toEqual(point(worldMatrix(p,nodes),300,60));
});
it('omits page roots, plain groups and flowing auto-layout children',()=>{
 const p=node('frame',{layout:'horizontal'}),n=node('rectangle',{parentId:p.id});expect(constraintGuides(n,[p,n])).toEqual([]);n.ignoreLayout=true;expect(constraintParent(n,[p,n])).toBe(p);p.type='group';expect(constraintGuides(n,[p,n])).toEqual([]);n.parentId=null;expect(constraintGuides(n,[p,n])).toEqual([]);
});
it('keeps showing guides as view state without changing document data',()=>{const n=node('rectangle'),before=JSON.stringify(n);useConstraintGuides.getState().setVisible(true);expect(useConstraintGuides.getState().visible).toBe(true);expect(JSON.stringify(n)).toBe(before);useConstraintGuides.getState().setVisible(false);});
