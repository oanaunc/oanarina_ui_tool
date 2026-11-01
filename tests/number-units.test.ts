import {beforeEach,describe,expect,it} from 'vitest';
import {applyEach,mixedField} from '../src/mixed-field';
import {expandUnits,unitExpression} from '../src/number-units';
import {useEditor} from '../src/store';
describe('units in number fields',()=>{
 it('reads pixels, points, rem and em',()=>{expect(unitExpression('10px')).toBe(10);expect(unitExpression('10 PX')).toBe(10);expect(unitExpression('12pt')).toBe(12);expect(unitExpression('1rem')).toBe(16);expect(unitExpression('1.5rem')).toBe(24);expect(unitExpression('2em')).toBe(32);expect(unitExpression('45deg')).toBe(45);expect(unitExpression('45°')).toBe(45);});
 it('reads a percentage of the parent, or of the current value with no parent',()=>{expect(unitExpression('50%',120,400)).toBe(200);expect(unitExpression('50%',120)).toBe(60);expect(unitExpression('100%',120,400)).toBe(400);expect(unitExpression('33.5%',0,200)).toBe(67);});
 it('mixes units with plain math',()=>{expect(unitExpression('100% - 20',0,400)).toBe(380);expect(unitExpression('50% + 1rem',0,200)).toBe(116);expect(unitExpression('(1rem + 8px) * 2')).toBe(48);expect(unitExpression('2rem*3')).toBe(96);expect(unitExpression('120 + 8')).toBe(128);});
 it('keeps relative entries relative',()=>{expect(unitExpression('+1rem',100)).toBe(116);expect(unitExpression('+10%',100,400)).toBe(140);expect(unitExpression('+10%',100)).toBe(110);expect(unitExpression('*50%',100,400)).toBe(50);expect(unitExpression('/2',100)).toBe(50);});
 it('reads a percentage after * or / as a ratio',()=>{expect(unitExpression('100 * 50%',0,400)).toBe(50);expect(expandUnits('8/50%',0,400)).toBe('8/0.5');});
 it('leaves scientific notation and unknown words alone',()=>{expect(unitExpression('1e2')).toBe(100);expect(()=>unitExpression('10xyz')).toThrow();expect(()=>unitExpression('10pxx')).toThrow();expect(()=>unitExpression('alert(1)')).toThrow();expect(()=>unitExpression('50%%',0,100)).toThrow();});
 beforeEach(()=>useEditor.getState().newDocument());
 it('resolves a percentage against each selected layer with one Undo',()=>{const s=()=>useEditor.getState(),a=s().add('frame',{width:400,height:100}),b=s().add('frame',{x:600,width:200,height:100}),x=s().add('rectangle',{parentId:a,width:10,height:10}),y=s().add('rectangle',{parentId:b,width:10,height:10}),nodes=()=>s().doc.pages[0].nodes,find=(id:string)=>nodes().find(n=>n.id===id)!,field=mixedField([find(x),find(y)],'width',{sizingX:'fixed'},n=>nodes().find(p=>p.id===n.parentId));field.onEachPercent!((current,base)=>unitExpression('50%',current,base));expect(find(x).width).toBe(200);expect(find(y).width).toBe(100);s().undo();expect(find(x).width).toBe(10);expect(find(y).width).toBe(10);});
 it('passes each layer to a change',()=>{const s=()=>useEditor.getState(),a=s().add('rectangle',{width:30});applyEach([a],'width',(current,n)=>current+n.height);expect(s().doc.pages[0].nodes.find(n=>n.id===a)!.width).toBe(30+s().doc.pages[0].nodes.find(n=>n.id===a)!.height);});
});
