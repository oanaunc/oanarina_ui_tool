import {describe,expect,it} from 'vitest';
import {TITLE_MENU_GROUPS,titleMenuPrefixMatch} from '../src/title-menu';
import {commands} from '../src/commands';

describe('document title menu contract',()=>{
 it('references distinct registered local File commands with existing shortcut metadata',()=>{
  const ids=TITLE_MENU_GROUPS.flat(),registered=new Map(commands.map(c=>[c[0],c]));expect(new Set(ids).size).toBe(ids.length);for(const id of ids){const command=registered.get(id)!;expect(command).toBeDefined();expect(command[2]).toBe('File');}expect(ids).toContain('rename-file');expect(ids).toContain('file-info');expect(registered.get('save')![3]).toBe('⌘S');expect(ids.some(id=>/share|publish|cloud|team/.test(id))).toBe(false);
 });
 it('finds normalized prefixes and wraps from any active item without fuzzy or regular-expression execution',()=>{
  const labels=['Rename file…','Save project','Save project as…','Éxport…'];expect(titleMenuPrefixMatch(labels,'save',0)).toBe(1);expect(titleMenuPrefixMatch(labels,'s',2)).toBe(2);expect(titleMenuPrefixMatch(labels,'s',3)).toBe(1);expect(titleMenuPrefixMatch(labels,'EXPORT',1)).toBe(3);expect(titleMenuPrefixMatch(labels,'r',-1)).toBe(0);expect(titleMenuPrefixMatch(labels,'[',0)).toBe(-1);expect(titleMenuPrefixMatch(labels,'',0)).toBe(-1);expect(titleMenuPrefixMatch([],'s',0)).toBe(-1);
 });
});
