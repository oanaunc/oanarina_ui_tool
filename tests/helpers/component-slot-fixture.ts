import {blankDocument,node} from '../../src/model';
import {insertInstance,synchronizeComponents} from '../../src/components-model';
import {defineComponentSlot} from '../../src/component-slot-actions';
export function componentSlotFixture(){const d=blankDocument(),p=d.pages[0];p.nodes=[node('component',{id:'main',width:300,height:200}),node('frame',{id:'area',parentId:'main',x:20,y:20,width:250,height:150}),node('text',{id:'default',parentId:'area',x:30,y:30,text:'Default',width:100,height:30})];defineComponentSlot(d,'main','area','Content');insertInstance(d,p.id,'main',{id:'instance',x:400,y:0});synchronizeComponents(d);return d;}
