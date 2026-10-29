import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blankDocument,node} from '../../src/model';
import {exportPageSvg} from '../svg';
import {createPaint} from '../../src/paints';
test('SVG export renders supported artwork deterministically and escapes user text',()=>{const d=blankDocument();d.pages[0].nodes=[node('rectangle',{x:20,y:30,width:100,height:40,fill:'#ff0000'}),node('text',{x:30,y:40,text:'<script>alert(1)</script>',width:300,height:40})];const first=exportPageSvg(d,d.pages[0].id),second=exportPageSvg(d,d.pages[0].id);assert.equal(first.svg,second.svg);assert.match(first.svg,/<svg/);assert.match(first.svg,/&lt;script&gt;/);assert.ok(!first.svg.includes('<script>'));assert.equal(first.warnings.length,1);});
test('SVG export refuses images and browser-only raster paints',()=>{const d=blankDocument();d.pages[0].nodes=[node('image',{image:'data:image/svg+xml;base64,AAAA'})];assert.throws(()=>exportPageSvg(d,d.pages[0].id),/vector\/text/);d.pages[0].nodes=[node('rectangle',{paints:[createPaint('#000000','angular')]})];assert.throws(()=>exportPageSvg(d,d.pages[0].id),/vector\/text/);});
test('headless SVG export preserves a supported vector mask',()=>{const d=blankDocument();d.pages[0].nodes=[node('ellipse',{name:'Mask',x:20,y:20,width:100,height:100,mask:{mode:'vector'}}),node('rectangle',{x:0,y:0,width:200,height:150,fill:'#ff0000'})];const result=exportPageSvg(d,d.pages[0].id);assert.match(result.svg,/<mask/);assert.match(result.svg,/mask="url\(#/);assert.match(result.svg,/#ff0000/);});
