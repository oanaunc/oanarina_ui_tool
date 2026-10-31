import {describe,expect,it} from 'vitest';
import {blankDocument,node} from '../src/model';
import {drawingDefaults} from '../src/preferences';
import {validateRichTextDocument} from '../src/rich-text';
import {textBodyHeight,textLines,textOffsetAt,updateTextMetrics} from '../src/text-layout';
import {textOutlineSignature} from '../src/text-outline';
describe('text line box',()=>{
 const text=(extra:object={})=>node('text',{text:'One\nTwo',fontSize:20,lineHeight:1.5,width:200,height:10,textResize:'auto-height',...extra} as never);
 it('saved text keeps its geometry and new text sums its line heights',()=>{const old=text(),fresh=text({textLineBox:true});updateTextMetrics([old,fresh]);expect(textLines(old).map(l=>l.y)).toEqual([20,50]);expect(old.height).toBe(50);expect(fresh.height).toBe(60);const [first,second]=textLines(fresh);expect(second.y-first.y).toBe(30);expect(first.y).toBeGreaterThan(20);expect(first.lineBottom).toBe(30);});
 it('centers glyphs by half-leading and honors a pixel line height and paragraph spacing',()=>{const n=text({textLineBox:true,lineHeightPx:40,paragraphSpacing:6});updateTextMetrics([n]);expect(n.height).toBe(86);const [a,b]=textLines(n);expect(a.y).toBeCloseTo((40-24)/2+19);expect(b.y-a.y).toBe(46);});
 it('keeps the outer box for bottom alignment and a cap-height trim still stops at the baseline',()=>{const n=text({textLineBox:true,textResize:'fixed',height:100,verticalAlign:'bottom'}),lines=textLines(n);expect(lines.at(-1)!.lineBottom).toBeCloseTo(100);expect(textBodyHeight(lines)).toBeCloseTo(100);const trimmed=text({textLineBox:true,textVerticalTrim:'cap-height'}),last=textLines(trimmed).at(-1)!;expect(textBodyHeight(textLines(trimmed))).toBeCloseTo(last.y);});
 it('is on for new text, refreshes cached outlines and validates',()=>{expect(drawingDefaults('text').textLineBox).toBe(true);const n=text();expect(textOutlineSignature(n)).not.toBe(textOutlineSignature({...n,textLineBox:true}));const d=blankDocument();d.pages[0].nodes=[node('rectangle',{textLineBox:true})];expect(()=>validateRichTextDocument(d)).toThrow('Line box');d.pages[0].nodes=[{...text(),textLineBox:'yes' as never}];expect(()=>validateRichTextDocument(d)).toThrow('Line box');});
});
describe('textOffsetAt',()=>{
 const width=(chars:number,size=20)=>chars*size*.55;
 it('finds the nearest boundary on the hit line',()=>{const n=node('text',{text:'Hello\nWorld',fontSize:20,width:300,height:60});expect(textOffsetAt(n,{x:width(2)+1,y:5})).toBe(2);expect(textOffsetAt(n,{x:width(3)-1,y:30})).toBe(9);expect(textOffsetAt(n,{x:-50,y:30})).toBe(6);expect(textOffsetAt(n,{x:999,y:999})).toBe(11);expect(textOffsetAt(n,{x:999,y:5})).toBe(5);});
 it('follows alignment and keeps surrogate pairs whole',()=>{const n=node('text',{text:'abcd',fontSize:20,width:300,height:30,textAlign:'right'});expect(textOffsetAt(n,{x:300-width(1),y:5})).toBe(3);const emoji=node('text',{text:'a😀b',fontSize:20,width:300,height:30});expect([0,1,3,4]).toContain(textOffsetAt(emoji,{x:width(1)+3,y:5}));});
 it('measures right to left text from the right edge',()=>{const n=node('text',{text:'אבגד',fontSize:20,width:300,height:30,textDirection:'rtl',textAlign:'right'});expect(textOffsetAt(n,{x:300-width(1),y:5})).toBe(1);expect(textOffsetAt(n,{x:300-width(3),y:5})).toBe(3);});
 it('walks an embedded Latin run left to right inside a right to left line',()=>{const n=node('text',{text:'אב ABC גד',fontSize:20,width:300,height:30,textDirection:'rtl',textAlign:'right'}),total=width(9),left=300-total;expect(textOffsetAt(n,{x:left+width(3)+width(1),y:5})).toBe(4);});
 it('skips list markers and resolves an empty paragraph',()=>{const n=node('text',{text:'One\n\nThree',fontSize:20,width:300,height:90,listStyle:'bullet'} as never);expect(textOffsetAt(n,{x:0,y:5})).toBe(0);const blank=node('text',{text:'One\n\nThree',fontSize:20,lineHeight:1.2,width:300,height:90});expect(textOffsetAt(blank,{x:40,y:30})).toBe(4);});
});
