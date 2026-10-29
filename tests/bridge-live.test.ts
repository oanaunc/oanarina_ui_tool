import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseDocument} from '../src/model';

it('loads the sanitized prototype and guide fixture returned by the real connected Figma API',()=>{
 const d=parseDocument(readFileSync('tests/fixtures/bridge-prototype-roundtrip.json','utf8')),p=d.pages[0];
 expect(p.nodes).toHaveLength(5);expect(p.guides?.[0]).toMatchObject({axis:'x',position:100});
 const screen=p.nodes.find(n=>n.name==='Screen A')!,button=p.nodes.find(n=>n.name==='Continue button')!,label=p.nodes.find(n=>n.name==='Continue label')!,line=p.nodes.find(n=>n.name==='Diagonal line')!;
 expect(screen.layoutGuides?.[0]).toMatchObject({type:'columns',count:3,gutter:16,margin:20,alignment:'stretch'});
 expect(screen.prototypeScroll).toBe('vertical');expect(button.reactions?.[0].actions[0]).toMatchObject({type:'navigate',targetId:p.nodes.find(n=>n.name==='Screen B')!.id,transition:{type:'dissolve',easing:'ease-out'}});
 expect(button.reactions?.[0].actions[0].transition?.duration).toBeCloseTo(300,3);expect(label).toMatchObject({text:'Continue',width:150,height:30,verticalAlign:'middle'});expect(line).toMatchObject({type:'path',path:'M 0 0 L 120 60',width:120,height:60});
});
