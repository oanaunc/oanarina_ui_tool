import {describe,it,expect} from 'vitest';
import {parseDocument} from '../src/model';
import {addSticky,board,createWhiteboardDocument} from '../src/whiteboard';
import {useEditor} from '../src/store';
import {formatTextRange} from '../src/rich-text';
describe('independent rich text derived content review',()=>{
 it('rebases formatted whiteboard author text after its source record changes',()=>{const d=createWhiteboardDocument(),p=d.pages[0];addSticky(d,p.id,{x:0,y:0},'A note','Long author');const sticky=d.whiteboard!.stickies[0],author=p.nodes.find(n=>n.id===sticky.authorId)!;author.textRuns=formatTextRange(author,0,author.text.length,{fontWeight:700});useEditor.getState().load(d);expect(()=>useEditor.getState().edit(doc=>{board(doc).stickies[0].author='A';})).not.toThrow();const saved=useEditor.getState().doc,n=saved.pages[0].nodes.find(n=>n.id===author.id)!;expect(n.text).toBe('A');expect(n.textRuns?.every(r=>r.end<=n.text.length)).toBe(true);expect(parseDocument(JSON.stringify(saved))).toEqual(saved);useEditor.getState().undo();expect(useEditor.getState().doc.pages[0].nodes.find(n=>n.id===author.id)?.text).toBe('Long author');});
});
