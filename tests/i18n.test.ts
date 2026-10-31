import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {commands} from '../src/commands';
import {numericExpression} from '../src/guides';
import {blankDocument} from '../src/model';
import {applyDocumentLanguage,formatDateTime,formatEditableNumber,formatNumber,formatPercent,getLanguage,getLanguageChoice,intlLocale,LANGUAGE_KEY,languageDirection,languagePacks,matchLanguage,normalizeNumberInput,parseLanguageChoice,resetLanguage,resolvedLanguage,subscribeLanguage,t,tn,updateLanguage} from '../src/i18n';
import {messages} from '../src/i18n/messages';
import {ro} from '../src/i18n/ro';
import {ar} from '../src/i18n/ar';
import type {PluralForms} from '../src/i18n/types';

const store=new Map<string,string>();
let denied=false;
beforeEach(()=>{store.clear();denied=false;vi.stubGlobal('localStorage',{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{if(denied)throw Error('denied');store.set(k,v);},removeItem:(k:string)=>{if(denied)throw Error('denied');store.delete(k);}});resetLanguage();});
afterEach(()=>{denied=false;resetLanguage();vi.unstubAllGlobals();});
const placeholders=(s:string)=>[...s.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort().join();
const texts=(value:string|PluralForms)=>typeof value==='string'?[value]:Object.values(value).filter((v):v is string=>!!v);

describe('English source',()=>{
 it('returns every source string byte for byte',()=>{for(const message of messages)expect(t(message)).toBe(message);for(const c of commands)expect(t(c[1])).toBe(c[1]);});
 it('interpolates only named values, once, and leaves unknown placeholders visible',()=>{expect(t('Open {name}',{name:'{count} $& a'})).toBe('Open {count} $& a');expect(t('Open {name}')).toBe('Open {name}');expect(t('Open {name}',{other:1})).toBe('Open {name}');});
 it('never resolves object prototype keys or blank text',()=>{updateLanguage('ro');expect(t('constructor')).toBe('constructor');expect(t('__proto__')).toBe('__proto__');expect(t('Not in any catalog')).toBe('Not in any catalog');});
 it('keeps English count wording',()=>{expect(tn(1,'{count} file','{count} files')).toBe('1 file');expect(tn(0,'{count} file','{count} files')).toBe('0 files');expect(tn(2,'{count} action','{count} actions')).toBe('2 actions');});
});
describe('language packs',()=>{
 it('has a complete, well-formed Romanian catalog',()=>{
  expect(Object.keys(ro).sort()).toEqual([...messages].sort());
  for(const message of messages){const value=ro[message];for(const text of texts(value)){expect(text.trim(),message).not.toBe('');expect(placeholders(text),message).toBe(placeholders(message));expect(text,message).not.toMatch(/[şţŞŢ]/);}}
 });
 it('is really translated rather than copied',()=>{const copied=messages.filter(m=>ro[m]===m).sort();expect(copied).toEqual(['Design','Figma Bridge','Forma','Name · A–Z','Name · Z–A','Normal','Text','Transparent','Vector'].filter(x=>x!=='Name · A–Z'&&x!=='Name · Z–A'));});
 it('keeps Arabic keys and placeholders valid',()=>{for(const [key,value] of Object.entries(ar)){expect(messages).toContain(key);for(const text of texts(value!))if(key!=='{count} file'&&!/^(لا ملفات|ملف واحد|ملفان)$/.test(text))expect(placeholders(text),key).toBe(placeholders(key));}});
 it('every pack declares a direction',()=>{expect(languageDirection('en')).toBe('ltr');expect(languageDirection('ro')).toBe('ltr');expect(languageDirection('ar')).toBe('rtl');expect(Object.keys(languagePacks)).toEqual(['en','ro','ar']);});
 it('uses Romanian plural categories',()=>{updateLanguage('ro');expect(tn(1,'{count} file','{count} files')).toBe('1 fișier');expect(tn(2,'{count} file','{count} files')).toBe('2 fișiere');expect(tn(19,'{count} file','{count} files')).toBe('19 fișiere');expect(tn(20,'{count} file','{count} files')).toBe('20 de fișiere');expect(tn(101,'{count} file','{count} files')).toBe('101 fișiere');});
 it('falls back per string, never to a blank label',()=>{updateLanguage('ar');expect(t('Save project')).toBe('حفظ المشروع');expect(t('Local snapping')).toBe('Local snapping');});
});
describe('language preference',()=>{
 it('defaults to English and validates stored values',()=>{expect(getLanguageChoice()).toBe('en');for(const value of ['fr','','EN',null,1,{},'system ','__proto__'])expect(parseLanguageChoice(value)).toBe('en');expect(parseLanguageChoice('system')).toBe('system');store.set(LANGUAGE_KEY,'klingon');expect(getLanguageChoice()).toBe('en');});
 it('resolves system languages through regional tags',()=>{expect(matchLanguage(['ro-RO','en'])).toBe('ro');expect(matchLanguage(['fr-CA','ar-EG'])).toBe('ar');expect(matchLanguage(['fr','de'])).toBe('en');expect(matchLanguage([])).toBe('en');expect(resolvedLanguage('system',['ro'])).toBe('ro');expect(resolvedLanguage('ar',['ro'])).toBe('ar');});
 it('notifies, persists and resets outside the document',()=>{const seen:string[]=[],off=subscribeLanguage(()=>seen.push(getLanguage()));updateLanguage('ro');expect(store.get(LANGUAGE_KEY)).toBe('ro');expect(t('Undo')).toBe('Anulează');resetLanguage();expect(store.has(LANGUAGE_KEY)).toBe(false);expect(t('Undo')).toBe('Undo');off();expect(seen).toEqual(['ro','en']);});
 it('refuses invalid or unsaved choices without changing the language',()=>{expect(()=>updateLanguage('fr' as never)).toThrow('valid interface language');updateLanguage('ro');denied=true;expect(()=>updateLanguage('en')).toThrow('could not be saved');expect(getLanguage()).toBe('ro');expect(()=>resetLanguage()).toThrow('could not be reset');});
 it('never adds language data to a project',()=>{updateLanguage('ro');const raw=JSON.stringify(blankDocument());expect(raw).not.toContain(LANGUAGE_KEY);expect(raw).not.toMatch(/"language"/);});
 it('applies lang and dir to the given root only',()=>{const root={lang:'',dir:''} as HTMLElement;applyDocumentLanguage('ar',root);expect([root.lang,root.dir]).toEqual(['ar','rtl']);applyDocumentLanguage('ro',root);expect([root.lang,root.dir]).toEqual(['ro','ltr']);});
});
describe('locale formatting',()=>{
 it('keeps device formatting for English and uses language conventions otherwise',()=>{expect(intlLocale('en')).toBeUndefined();expect(formatNumber(1234.5)).toBe((1234.5).toLocaleString());updateLanguage('ro');expect(formatNumber(1234.5)).toBe('1.234,5');expect(formatPercent(60)).toBe('60 %');expect(formatPercent(12.5)).toBe('12,5 %');resetLanguage();expect(formatPercent(60)).toBe('60%');});
 it('formats dates through Intl and refuses invalid input',()=>{const when='2026-03-05T14:07:00Z',options={dateStyle:'long',timeStyle:'short',timeZone:'UTC'} as const;expect(formatDateTime(when)).toBe(new Date(when).toLocaleString());updateLanguage('ro');expect(formatDateTime(when,options)).toContain('5 martie 2026');expect(formatDateTime('not a date')).toBe('Dată necunoscută');});
 it('uses Western digits for Arabic so numeric chrome matches field input',()=>{updateLanguage('ar');expect(formatNumber(1234)).toMatch(/^1[,٬]?234$/);expect(formatDateTime('2026-03-05T14:07:00Z',{year:'numeric',timeZone:'UTC'})).toContain('2026');});
 it('round-trips decimal commas without changing English input',()=>{expect(normalizeNumberInput('1,5')).toBe('1,5');expect(formatEditableNumber(1.5)).toBe('1.5');updateLanguage('ro');expect(formatEditableNumber(1.5)).toBe('1,5');expect(formatEditableNumber(-20)).toBe('-20');expect(normalizeNumberInput('1,5')).toBe('1.5');expect(normalizeNumberInput('1.5')).toBe('1.5');expect(numericExpression(normalizeNumberInput('2,5*2'),0)).toBe(5);expect(normalizeNumberInput(formatEditableNumber(0.125))).toBe('0.125');expect(normalizeNumberInput('1,2,3')).toBe('1,2,3');expect(()=>numericExpression(normalizeNumberInput('1,2,3'),0)).toThrow();});
});
describe('measured coverage',()=>{
 const covered=(list:readonly string[])=>list.filter(text=>Object.hasOwn(ro,text)).length/list.length;
 const walk=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(dir,entry.name)):/\.tsx$/.test(entry.name)?[join(dir,entry.name)]:[]);
 /** Static count of user-visible literals: translated t() calls versus JSX text and labels still written directly. */
 function literalCoverage(){let translated=0,direct=0;for(const file of walk('src')){const source=readFileSync(file,'utf8');for(const m of source.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)+)'/g))if(Object.hasOwn(ro,m[1]))translated++;else direct++;direct+=[...source.matchAll(/\b(?:aria-label|title|placeholder)="[^"]*[A-Za-z][^"]*"/g)].length;direct+=[...source.matchAll(/(?<![=-])>\s*[A-Z][a-z]+[^<>{}=;&|\n]*</g)].length;}return {translated,direct,ratio:translated/(translated+direct)};}
 it('covers the web menu commands and tools',()=>{expect(covered(commands.map(c=>c[1]))).toBeGreaterThanOrEqual(.97);expect(covered([...new Set(commands.map(c=>c[2]))])).toBe(1);});
 it('reports whole-interface coverage honestly',()=>{const {translated,direct,ratio}=literalCoverage();console.info(`Romanian interface literal coverage: ${translated}/${translated+direct} (${(ratio*100).toFixed(1)}%)`);expect(ratio).toBeGreaterThan(.1);expect(ratio).toBeLessThan(.9);});
});
