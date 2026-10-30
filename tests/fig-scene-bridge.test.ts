import {expect,it} from 'vitest';
import {createFigmaMock} from './helpers/figma-mock';
import {blankDocument,node} from '../src/model';
import {createPaint} from '../src/paints';
it('reports stretch reduction and sends an admitted FILL mode to the public Figma API mock',async()=>{const d=blankDocument(),paint=createPaint('#000000','image');Object.assign(paint,{image:'data:image/png;base64,iVBORw0KGgo=',imageWidth:1,imageHeight:1,scaleMode:'stretch'});d.pages[0].nodes=[node('rectangle',{name:'Stretched asset',paints:[paint]})];const mock=createFigmaMock(),result=await mock.importDocument(d);expect(result.type,result.message).toBe('imported');expect(mock.api.currentPage.children[0].fills[0].scaleMode).toBe('FILL');expect(result.report.join(' ')).toContain('stretch image fill approximated with FILL');});
