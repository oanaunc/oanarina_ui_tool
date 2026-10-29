import {describe,expect,it} from 'vitest';
import {parseDocument} from '../src/model';
import {allNodes,synchronizeComponents} from '../src/components-model';
import {createFigmaMock} from './helpers/figma-mock';

describe('component export dependencies and editable source correspondence',()=>{
 it('exports only selected artwork plus deduplicated cross-page mains and retains per-child overrides after synchronization',async()=>{
  const mock=createFigmaMock(),{api}=mock,art=api.currentPage,library=api.createPage();await api.setCurrentPageAsync(library);
  const main=api.createComponent();Object.assign(main,{name:'Button',x:300,y:400,width:200,height:80});
  const first=api.createText(),second=api.createText();for(const text of [first,second]){main.appendChild(text);text.name='Repeated name';text.x=10;}
  Object.assign(first,{y:10,characters:'Inherited'});Object.assign(second,{y:40,characters:'Original'});
  await api.setCurrentPageAsync(art);const a=main.createInstance(),b=main.createInstance();Object.assign(a,{x:30,y:60});Object.assign(b,{x:300,y:60});a.children[1].characters='Override';
  art.selection=[a,b];const output=await mock.exportDocument('selection');expect(output.type).toBe('exported');
  const doc=parseDocument(JSON.stringify(output.data)),nodes=allNodes(doc),copy=nodes.find(n=>n.id===a.id)!;
  expect(doc.pages).toHaveLength(2);expect(nodes.filter(n=>n.id===main.id)).toHaveLength(1);expect(nodes.filter(n=>n.type==='component')).toHaveLength(1);
  expect(copy).toMatchObject({type:'instance',componentId:main.id,sourceId:main.id});
  const inherited=nodes.find(n=>n.instanceRootId===a.id&&n.sourceId===first.id)!,overridden=nodes.find(n=>n.instanceRootId===a.id&&n.sourceId===second.id)!;
  expect(inherited.overrideKeys).not.toContain('text');expect(overridden.overrideKeys).toContain('text');expect(overridden.id).not.toContain(second.id);
  nodes.find(n=>n.id===first.id)!.text='Main changed';nodes.find(n=>n.id===second.id)!.text='Main second changed';synchronizeComponents(doc);
  expect(allNodes(doc).find(n=>n.id===inherited.id)?.text).toBe('Main changed');expect(allNodes(doc).find(n=>n.id===overridden.id)?.text).toBe('Override');
  expect(parseDocument(JSON.stringify(doc)).pages).toHaveLength(2);
 });

 it('retains nested source ownership without interpreting opaque generated IDs',async()=>{
  const mock=createFigmaMock(),{api}=mock,inner=api.createComponent(),text=api.createText();inner.name='Inner';inner.appendChild(text);text.characters='Inner text';
  const outer=api.createComponent(),nested=inner.createInstance();outer.name='Outer';outer.appendChild(nested);nested.x=12;nested.y=14;
  const instance=outer.createInstance();instance.x=500;instance.children[0].children[0].characters='Nested override';api.currentPage.selection=[instance];
  const output=await mock.exportDocument('selection');expect(output.type).toBe('exported');const doc=parseDocument(JSON.stringify(output.data)),nodes=allNodes(doc),outerChild=nodes.find(n=>n.id===instance.children[0].id)!;
  expect(outerChild).toMatchObject({type:'instance',instanceRootId:instance.id,sourceId:nested.id,componentId:inner.id});
  const nestedCopy=nodes.find(n=>n.id===instance.children[0].children[0].id)!;expect(nestedCopy.sourceId).toBe(nested.children[0].id);expect(nestedCopy.instanceRootId).toBe(instance.id);
  synchronizeComponents(doc);expect(allNodes(doc).find(n=>n.id===nestedCopy.id)?.text).toBe('Nested override');
 });

 it('detaches an outer instance with a nested swap rather than asserting false correspondence',async()=>{
  const mock=createFigmaMock(),{api}=mock,a=api.createComponent(),b=api.createComponent();a.appendChild(api.createRectangle());b.appendChild(api.createRectangle());
  const outer=api.createComponent(),nested=a.createInstance();outer.appendChild(nested);const instance=outer.createInstance();instance.children[0].swapComponent(b);api.currentPage.selection=[instance];
  const output=await mock.exportDocument('selection');expect(output.type).toBe('exported');const doc=parseDocument(JSON.stringify(output.data)),copy=allNodes(doc).find(n=>n.id===instance.id)!;
  expect(copy).toMatchObject({type:'frame',componentId:null});expect(copy.sourceId).toBeUndefined();expect(output.report.join(' ')).toContain('nested swap');
  expect(allNodes(doc).find(n=>n.id===instance.children[0].id)).toMatchObject({type:'instance',componentId:b.id});
 });

 it('exports complete variant sets with full property identities and independently editable instance values',async()=>{
  const mock=createFigmaMock(),{api}=mock,a=api.createComponent(),b=api.createComponent(),ta=api.createText(),tb=api.createText();
  a.name='State=Default, Size=Small';b.name='State=Hover, Size=Large';a.appendChild(ta);b.appendChild(tb);b.x=200;
  const set=api.combineAsVariants([a,b],api.currentPage),property=set.addComponentProperty('Label','TEXT','Base');set.name='Buttons';ta.componentPropertyReferences={characters:property};tb.componentPropertyReferences={characters:property};
  const instance=b.createInstance();instance.setProperties({[property]:'Custom'});api.currentPage.selection=[instance];
  const output=await mock.exportDocument('selection');expect(output.type).toBe('exported');const doc=parseDocument(JSON.stringify(output.data)),nodes=allNodes(doc);
  expect(doc.componentSets).toMatchObject([{containerId:set.id,propertyNames:['State','Size'],defaultComponentId:a.id,variants:[{componentId:a.id,values:{State:'Default',Size:'Small'}},{componentId:b.id,values:{State:'Hover',Size:'Large'}}]}]);
  expect(nodes.find(n=>n.id===b.id)?.componentMetadata?.properties).toMatchObject([{id:property,targetId:tb.id,type:'text',defaultValue:'Base'}]);
  expect(nodes.find(n=>n.id===instance.id)?.propertyValues).toEqual({[property]:'Custom'});synchronizeComponents(doc);
  expect(allNodes(doc).find(n=>n.instanceRootId===instance.id&&n.sourceId===tb.id)?.text).toBe('Custom');
 });

 it('materializes multi-target properties and preserves metadata without inventing separate controls',async()=>{
  const mock=createFigmaMock(),{api}=mock,main=api.createComponent(),a=api.createText(),b=api.createText();main.appendChild(a);main.appendChild(b);
  Object.assign(main,{description:'Useful component',documentationLinks:[{uri:'https://example.com/guide'}]});const property=main.addComponentProperty('Shared','TEXT','Same');a.componentPropertyReferences={characters:property};b.componentPropertyReferences={characters:property};
  const instance=main.createInstance();instance.setProperties({[property]:'Shared override'});api.currentPage.selection=[instance];
  const output=await mock.exportDocument('selection');expect(output.type).toBe('exported');const doc=parseDocument(JSON.stringify(output.data)),nodes=allNodes(doc);
  expect(nodes.find(n=>n.id===main.id)?.componentMetadata).toEqual({description:'Useful component',documentation:'https://example.com/guide'});expect(nodes.find(n=>n.id===instance.id)?.propertyValues).toBeUndefined();
  expect(nodes.filter(n=>n.instanceRootId===instance.id&&n.type==='text').map(n=>n.text)).toEqual(['Shared override','Shared override']);expect(output.report.join(' ')).toContain('one supported target');
 });

 it('keeps inherited property defaults live while retaining explicit differing property values',async()=>{
  const mock=createFigmaMock(),{api}=mock,main=api.createComponent(),text=api.createText();main.appendChild(text);text.characters='Default';
  const property=main.addComponentProperty('Label','TEXT','Default');text.componentPropertyReferences={characters:property};const inherited=main.createInstance(),overridden=main.createInstance();overridden.setProperties({[property]:'Override'});api.currentPage.selection=[inherited,overridden];
  const output=await mock.exportDocument('selection');expect(output.type).toBe('exported');const doc=parseDocument(JSON.stringify(output.data)),nodes=allNodes(doc);
  expect(nodes.find(n=>n.id===inherited.id)?.propertyValues).toBeUndefined();expect(nodes.find(n=>n.id===overridden.id)?.propertyValues).toEqual({[property]:'Override'});
  nodes.find(n=>n.id===main.id)!.componentMetadata!.properties![0].defaultValue='Updated default';synchronizeComponents(doc);
  expect(allNodes(doc).find(n=>n.instanceRootId===inherited.id&&n.sourceId===text.id)?.text).toBe('Updated default');expect(allNodes(doc).find(n=>n.instanceRootId===overridden.id&&n.sourceId===text.id)?.text).toBe('Override');
 });

 it('promotes a selected variant to its complete dependency set and restores invisible-child traversal settings',async()=>{
  const mock=createFigmaMock(),{api}=mock,a=api.createComponent(),b=api.createComponent();a.name='State=A';b.name='State=B';b.x=200;const set=api.combineAsVariants([a,b],api.currentPage);api.currentPage.selection=[a];api.skipInvisibleInstanceChildren=true;
  const output=await mock.exportDocument('selection');expect(output.type).toBe('exported');const doc=parseDocument(JSON.stringify(output.data));expect(doc.componentSets?.[0].containerId).toBe(set.id);expect(doc.componentSets?.[0].variants).toHaveLength(2);expect(new Set(allNodes(doc).map(n=>n.id)).size).toBe(3);expect(api.skipInvisibleInstanceChildren).toBe(true);
 });

 it('preserves explicit equal-value overrides and refuses an over-budget dependency graph',async()=>{
  const mock=createFigmaMock(),{api}=mock,main=api.createComponent(),text=api.createText();main.appendChild(text);text.characters='Same';const instance=main.createInstance();instance.children[0].characters='Same';api.currentPage.selection=[instance];
  const output=await mock.exportDocument('selection');expect(output.type).toBe('exported');const doc=parseDocument(JSON.stringify(output.data)),copy=allNodes(doc).find(n=>n.instanceRootId===instance.id)!;expect(copy.overrideKeys).toContain('text');
  const oversized=createFigmaMock(),root=oversized.api.createFrame();for(let i=0;i<20000;i++)root.appendChild(oversized.api.createRectangle());oversized.api.currentPage.selection=[root];const refused=await oversized.exportDocument('selection');expect(refused).toMatchObject({type:'error'});expect(refused.message).toContain('20,000');
 });
});
