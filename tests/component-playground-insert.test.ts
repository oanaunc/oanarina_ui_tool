import {expect,it} from 'vitest';
import {componentPlaygroundFixture} from './helpers/component-playground-fixture';
import {defaultPlaygroundConfig,insertPlaygroundInstance} from '../src/component-playground';
import {useEditor} from '../src/store';
it('inserts tried property values as a linked instance in one store edit',()=>{const d=componentPlaygroundFixture();useEditor.getState().load(d);const config=defaultPlaygroundConfig('main-a'),before=useEditor.getState().doc;let id='';useEditor.getState().edit(x=>{id=insertPlaygroundInstance(x,x.pages[0].id,config,{x:900,y:900});});const live=useEditor.getState();expect(live.past.at(-1)).toBe(before);expect(live.doc.pages[0].nodes.find(n=>n.id===id)).toMatchObject({type:'instance',componentId:'main-a',x:900,y:900});live.undo();expect(useEditor.getState().doc.pages[0].nodes.some(n=>n.id===id)).toBe(false);});
