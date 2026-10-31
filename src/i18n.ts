import {useSyncExternalStore} from 'react';
import type {LanguagePack,MessageValues,PluralForms} from './i18n/types';
import type {Message} from './i18n/messages';
import {ar} from './i18n/ar';
import {ro} from './i18n/ro';

/** The interface language is a device preference, stored outside .oui like appearance and motion. */
export type Language='en'|'ro'|'ar';
export type LanguageChoice='system'|Language;
export const LANGUAGE_KEY='oui-language';
/** Adding a language means adding one catalog file and one row here; nothing else branches on language. */
export const languagePacks:Readonly<Record<Language,LanguagePack>>=Object.freeze({
 en:{name:'English',status:'source',direction:'ltr',messages:{}},
 ro:{name:'Română',status:'partial',direction:'ltr',messages:ro},
 ar:{name:'العربية',status:'preview',direction:'rtl',messages:ar},
});
const languages=Object.keys(languagePacks) as Language[],listeners=new Set<()=>void>();
export function parseLanguageChoice(raw:unknown):LanguageChoice{return raw==='system'||languages.includes(raw as Language)?raw as LanguageChoice:'en';}
/** Regional tags fall back to their base language; an unsupported list stays on the English source. */
export function matchLanguage(tags:readonly string[]):Language{for(const tag of tags){const base=String(tag).toLowerCase().split(/[-_]/)[0] as Language;if(languages.includes(base))return base;}return 'en';}
function systemTags():readonly string[]{try{return typeof navigator==='undefined'?[]:navigator.languages?.length?navigator.languages:[navigator.language];}catch{return [];}}
export function getLanguageChoice():LanguageChoice{try{return typeof localStorage==='undefined'?'en':parseLanguageChoice(localStorage.getItem(LANGUAGE_KEY));}catch{return 'en';}}
export function resolvedLanguage(choice:LanguageChoice,tags:readonly string[]=systemTags()):Language{return choice==='system'?matchLanguage(tags):choice;}
let active:Language=resolvedLanguage(getLanguageChoice());
function refresh(){active=resolvedLanguage(getLanguageChoice());for(const listener of [...listeners])listener();}
function storage(e:StorageEvent){if(e.key===LANGUAGE_KEY||e.key===null)refresh();}
export function subscribeLanguage(listener:()=>void){if(!listeners.size&&typeof window!=='undefined'){window.addEventListener('storage',storage);window.addEventListener('languagechange',refresh);}listeners.add(listener);return()=>{listeners.delete(listener);if(!listeners.size&&typeof window!=='undefined'){window.removeEventListener('storage',storage);window.removeEventListener('languagechange',refresh);}};}
export function getLanguage():Language{return active;}
export function useLanguageChoice(){return useSyncExternalStore(subscribeLanguage,getLanguageChoice,()=>'en' as const);}
/** Persist first: a refused write never claims a saved language. */
export function updateLanguage(choice:LanguageChoice){if(choice!=='system'&&!languages.includes(choice))throw Error('Choose a valid interface language.');try{localStorage.setItem(LANGUAGE_KEY,choice);}catch{throw Error('Interface language could not be saved. Allow local storage or free some storage space.');}refresh();}
export function resetLanguage(){try{localStorage.removeItem(LANGUAGE_KEY);}catch{throw Error('Interface language could not be reset. Allow local storage or free some storage space.');}refresh();}
export const languageDirection=(language:Language=active)=>languagePacks[language].direction;
export const isRtl=()=>languageDirection()==='rtl';
/** Only the interface direction changes; artwork, canvas geometry and .oui data stay independent of it. */
export function watchLanguage(apply:(language:Language)=>void){const update=()=>apply(active),off=subscribeLanguage(update);update();return off;}
export function applyDocumentLanguage(language:Language=active,root:HTMLElement=document.documentElement){root.lang=language;root.dir=languageDirection(language);}

const interpolate=(text:string,values?:MessageValues)=>values?text.replace(/\{(\w+)\}/g,(whole,key:string)=>Object.hasOwn(values,key)?String(values[key]):whole):text;
function translated(source:string,language:Language){const catalog=languagePacks[language].messages;return Object.hasOwn(catalog,source)?catalog[source]:undefined;}
/**
 * Translate an English source string, e.g. `t('Save project')` or `t('Export {name}',{name})`.
 * English output is the source string itself, and anything without a translation stays in English,
 * so wrapping a label can never change the English interface or leave a blank control.
 */
export function t(source:Message|(string&{}),values?:MessageValues){const found=active==='en'?undefined:translated(source,active);return interpolate(typeof found==='string'?found:source,values);}
/** Count-aware text. Catalogs key on the English plural and may give every CLDR category their language uses. */
export function tn(count:number,singular:Message|(string&{}),plural:Message|(string&{}),values?:MessageValues){const merged={count:formatNumber(count),...values},found=active==='en'?undefined:translated(plural,active);if(found&&typeof found==='object'){const category=new Intl.PluralRules(active).select(count) as keyof PluralForms;return interpolate(found[category]??found.other,merged);}return interpolate(typeof found==='string'?found:count===1?singular:plural,merged);}
/** Subscribe a component to language changes; call the returned `t`, or the module `t` outside React. */
export function useT(){useSyncExternalStore(subscribeLanguage,getLanguage,()=>'en' as const);return t;}

/** English keeps the device's own region, as before; other languages use their own conventions. */
export const intlLocale=(language:Language=active)=>language==='en'?undefined:language==='ar'?'ar-u-nu-latn':language;
export function formatNumber(value:number,options?:Intl.NumberFormatOptions){return value.toLocaleString(intlLocale(),options);}
export function formatPercent(percent:number,options?:Intl.NumberFormatOptions){return active==='en'?`${percent}%`:(percent/100).toLocaleString(intlLocale(),{style:'percent',maximumFractionDigits:2,...options});}
export function formatDateTime(value:Date|string|number,options?:Intl.DateTimeFormatOptions){const date=new Date(value);return Number.isNaN(date.getTime())?t('Unknown date'):date.toLocaleString(intlLocale(),options);}
/** Editable numbers keep a plain machine form with only the decimal mark localized, so round trips stay exact. */
const decimalMark=()=>new Intl.NumberFormat(intlLocale()).formatToParts(1.5).find(part=>part.type==='decimal')?.value??'.';
export function formatEditableNumber(value:number){const text=String(value),mark=active==='en'?'.':decimalMark();return mark==='.'?text:text.replace('.',mark);}
/** Accept the active language's decimal comma between digits. Point input and arithmetic stay valid, and "1,2,3" stays an error. */
export function normalizeNumberInput(text:string){if(active==='en'||decimalMark()==='.')return text;return text.replace(/(^|[^\d,.])(\d+),(\d+)(?![\d,.])/g,'$1$2.$3');}
