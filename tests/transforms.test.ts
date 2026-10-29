import {describe,it,expect} from 'vitest';
import {node} from '../src/model';
import {exportSelection,point,visualBounds,worldMatrix} from '../src/transforms';
import {createEffect} from '../src/effects';
describe('transformed export bounds',()=>{
 it('includes the rotated rectangle corners',()=>{const n=node('rectangle',{width:100,height:20,rotation:90});const b=visualBounds([n]);expect(b.x).toBeCloseTo(40);expect(b.y).toBeCloseTo(-40);expect(b.width).toBeCloseTo(20);expect(b.height).toBeCloseTo(100);});
 it('composes ancestor rotation and reflected/scaled children',()=>{const parent=node('group',{x:100,y:100,width:100,height:100,rotation:90}),child=node('rectangle',{parentId:parent.id,x:100,y:100,width:20,height:20});expect(point(worldMatrix(child,[parent,child]),0,0)).toEqual({x:200,y:100});const scaled=node('rectangle',{width:100,height:100,motionScaleX:2,motionScaleY:2});expect(visualBounds([scaled])).toEqual({x:-50,y:-50,width:200,height:200});});
 it('extends the canvas to include visible effects and strokes',()=>{const n=node('rectangle',{width:100,height:100,effects:[{...createEffect(),x:20,y:0,radius:0,spread:0}]});expect(visualBounds([n]).width).toBe(140);});
 it('clips descendant overflow while excluding hidden geometry',()=>{const parent=node('frame',{width:100,height:100}),child=node('rectangle',{parentId:parent.id,x:80,y:80,width:100,height:100}),hidden=node('rectangle',{x:500,visible:false});expect(visualBounds([parent,child,hidden])).toEqual({x:0,y:0,width:100,height:100});});
 it('preserves ancestor transforms on selected exports without exporting their background',()=>{const parent=node('frame',{width:100,height:100,rotation:90}),child=node('rectangle',{parentId:parent.id,width:20,height:20}),other=node('rectangle',{parentId:parent.id,x:50});const exported=exportSelection([parent,child,other],[child.id]);expect(exported).toHaveLength(2);expect(exported[0]).toMatchObject({exportGhost:true,paints:[],strokes:[]});const b=visualBounds(exported);expect(b.x).toBeCloseTo(80);expect(b.y).toBeCloseTo(0);expect(b.width).toBeCloseTo(20);expect(b.height).toBeCloseTo(20);});
});
