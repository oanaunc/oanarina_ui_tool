import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {ACTION_HISTORY_KEY,clearRecentActions,getRecentActions,recordAction} from '../src/action-history';
import {commands} from '../src/commands';
import {currentCommandId,currentCommandRecord} from '../src/command-ids';
import {clearCommandUsage,COMMAND_USAGE_KEY,getCommandUsage,parseCommandUsage,recordCommandUse} from '../src/command-usage';
import {getKeyboardPreferences,KEYBOARD_PREFERENCES_KEY,keyboardPreferenceWarning,updateKeyboardPreferences} from '../src/keyboard-preferences';
import {blankDocument,node,parseDocument} from '../src/model';

const retired='fig'+'ma';
let data:Map<string,string>;
beforeEach(()=>{data=new Map();vi.stubGlobal('localStorage',{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>data.set(key,value),removeItem:(key:string)=>data.delete(key)});clearRecentActions();clearCommandUsage();});
afterEach(()=>vi.unstubAllGlobals());

it('maps only the exact retired id to the current command',()=>{expect(currentCommandId(retired)).toBe('interchange');for(const id of ['interchange','export',retired+'-x','x-'+retired])expect(currentCommandId(id)).toBe(id);expect(commands.some(c=>c[0]==='interchange')).toBe(true);expect(commands.some(c=>c[0]===retired)).toBe(false);});
it('prefers an entry already saved under the current id',()=>{expect({...currentCommandRecord({[retired]:'old',interchange:'new'})}).toEqual({interchange:'new'});expect({...currentCommandRecord({[retired]:'old',export:'x'})}).toEqual({interchange:'old',export:'x'});});
it('keeps a saved shortcut working and writes the new id on the next change',()=>{data.set(KEYBOARD_PREFERENCES_KEY,JSON.stringify({version:1,layout:'physical',additional:{[retired]:'⌥⇧⌘Y'}}));const saved=getKeyboardPreferences(commands);expect(keyboardPreferenceWarning()).toBe('');expect(saved.additional.interchange).toBe('⌥⇧⌘Y');updateKeyboardPreferences({layout:'logical'},commands);const stored=JSON.parse(data.get(KEYBOARD_PREFERENCES_KEY)!);expect(stored.additional).toEqual({interchange:'⌥⇧⌘Y'});});
it('still refuses an unknown saved command',()=>{data.set(KEYBOARD_PREFERENCES_KEY,JSON.stringify({version:1,layout:'physical',additional:{'not-a-command':'⌥⇧⌘Y'}}));getKeyboardPreferences(commands);expect(keyboardPreferenceWarning()).toContain('invalid');});
it('keeps recent actions and writes the new id on the next action',()=>{data.set(ACTION_HISTORY_KEY,JSON.stringify({version:1,ids:[retired,'export','interchange']}));expect(getRecentActions()).toEqual(['interchange','export']);expect(getRecentActions(['interchange'])).toEqual(['interchange']);recordAction('save');expect(JSON.parse(data.get(ACTION_HISTORY_KEY)!).ids).toEqual(['save','interchange','export']);});
it('merges usage counts and writes the new id on the next use',()=>{const count=(runs:number,lastDay:string)=>({runs,shortcutRuns:0,lastDay});data.set(COMMAND_USAGE_KEY,JSON.stringify({version:1,enabled:true,commands:{[retired]:count(3,'2026-01-02'),interchange:count(2,'2026-03-01')}}));expect(getCommandUsage().commands.interchange).toEqual(count(5,'2026-03-01'));expect(getCommandUsage().commands[retired]).toBeUndefined();recordCommandUse('save');expect(Object.keys(JSON.parse(data.get(COMMAND_USAGE_KEY)!).commands).sort()).toEqual(['interchange','save']);expect(parseCommandUsage(JSON.stringify({version:1,enabled:true,commands:{[retired]:count(1,'2026-01-02')}})).commands.interchange.runs).toBe(1);});
it('opens an older project whose layer identities use the plugin prefix',()=>{const d=blankDocument();d.pages[0].nodes=[node('rectangle',{id:retired+'-1'})];expect(parseDocument(JSON.stringify(d)).pages[0].nodes[0].id).toBe(retired+'-1');expect(parseDocument(JSON.stringify({...d,version:1})).name).toBe(d.name);});
it('keeps the shipped command list and menu free of the retired id',()=>{for(const file of ['public/commands.json','public/menu-order.json','src/menu-order.json'])expect(readFileSync(file,'utf8').toLowerCase()).not.toContain(retired);});
