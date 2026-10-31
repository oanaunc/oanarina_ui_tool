import {it,expect} from 'vitest';
import {validateInputValue,validatePrototypeInput} from '../src/prototype-input';
import type {PrototypeInput} from '../src/prototype-input';
import {prototypeInputFixture} from './helpers/prototype-input-fixture';
import {parseDocument} from '../src/model';
const radio=(extra:Partial<PrototypeInput>={}):PrototypeInput=>({version:1,kind:'radio',variableId:'choice',label:'Color',options:[{label:'Red',value:'red'},{label:'Blue',value:'blue'}],...extra});
it('validates radio definitions like select options and refuses unrelated settings',()=>{expect(()=>validatePrototypeInput(radio())).not.toThrow();for(const bad of [radio({options:[]}),radio({options:undefined}),radio({options:[{label:'A',value:'a'},{label:'B',value:'a'}]}),radio({placeholder:'x'}),radio({min:1})])expect(()=>validatePrototypeInput(bad)).toThrow();});
it('accepts only authored radio values',()=>{const p=radio();expect(()=>validateInputValue(p,'blue')).not.toThrow();for(const value of ['green',1,true])expect(()=>validateInputValue(p,value)).toThrow();});
it('a saved radio definition reopens and stays optional for older controls',()=>{const d=prototypeInputFixture(),field=d.pages[0].nodes.find(n=>n.id==='select')!;field.prototypeInput=radio();const reopened=parseDocument(JSON.stringify(d)).pages[0].nodes.find(n=>n.id==='select')!;expect(reopened.prototypeInput?.kind).toBe('radio');field.prototypeInput={...radio(),kind:'unknown' as never};expect(()=>parseDocument(JSON.stringify(d))).toThrow();});
