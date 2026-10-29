import {describe,it,expect} from 'vitest';
import {matchesShortcut} from '../src/commands';
const event={key:'k',code:'KeyK',metaKey:true,ctrlKey:false,altKey:false,shiftKey:false};
describe('Mac shortcut normalization',()=>{
 it('matches the Esc menu label to the real Escape key',()=>{expect(matchesShortcut({...event,key:'Escape',code:'Escape',metaKey:false},'Esc')).toBe(true);});
 it('requires the declared modifiers',()=>{expect(matchesShortcut(event,'⌘K')).toBe(true);expect(matchesShortcut(event,'⌥⌘K')).toBe(false);expect(matchesShortcut({...event,shiftKey:true},'⌘K')).toBe(false);});
 it('uses physical keys for Option-generated symbols and shifted digits',()=>{expect(matchesShortcut({...event,key:'˚',altKey:true},'⌥⌘K')).toBe(true);expect(matchesShortcut({...event,key:'*',code:'Digit8',shiftKey:true},'⇧⌘8')).toBe(true);expect(matchesShortcut({...event,key:')',code:'Digit0',metaKey:false,shiftKey:true},'⇧0')).toBe(true);});
 it('supports punctuation and both zoom-in key forms',()=>{expect(matchesShortcut({...event,key:'=',code:'Equal'},'⌘+')).toBe(true);expect(matchesShortcut({...event,key:'+',code:'Equal',shiftKey:true},'⌘+')).toBe(true);expect(matchesShortcut({...event,key:'[',code:'BracketLeft'},'⌘[')).toBe(true);});
});
