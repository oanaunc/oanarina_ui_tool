import {useSyncExternalStore} from 'react';
/** Per-device plugin shortcuts: never part of a project, the package catalog or a grant. */
export const PLUGIN_PREFERENCES_KEY='forma-local-plugin-preferences-v1';
/** auto regenerates on each selection. It stays off until someone turns it on, because every run executes package code. */
export interface CodegenChoice {plugin:string;language:string;auto?:boolean;}
export interface PluginPreferences {favorites:string[];recents:string[];codegen?:CodegenChoice;}
const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9.-]{0,63}$/.test(v),empty:PluginPreferences={favorites:[],recents:[]},listeners=new Set<()=>void>();
export function parsePluginPreferences(raw:string|null):PluginPreferences{try{const v=JSON.parse(raw??'null');if(!v||typeof v!=='object'||Array.isArray(v))return empty;const list=(l:unknown)=>Array.isArray(l)?[...new Set(l.filter(id))].slice(0,32):[],c=v.codegen;return {favorites:list(v.favorites),recents:list(v.recents).slice(0,8),...(c&&id(c.plugin)&&typeof c.language==='string'&&/^[a-z][a-z0-9-]{0,39}$/.test(c.language)?{codegen:{plugin:c.plugin,language:c.language,...(c.auto===true?{auto:true}:{})}}:{})};}catch{return empty;}}
let cached:PluginPreferences|undefined;
function read(){if(!cached){let raw:string|null=null;try{raw=localStorage.getItem(PLUGIN_PREFERENCES_KEY);}catch{/* Shortcuts stay session-only when storage is blocked. */}cached=parsePluginPreferences(raw);}return cached;}
function write(next:PluginPreferences){cached=next;let saved=true;try{localStorage.setItem(PLUGIN_PREFERENCES_KEY,JSON.stringify(next));}catch{saved=false;}listeners.forEach(l=>l());return saved;}
export const pluginPreferences=read;
export function toggleFavoritePlugin(plugin:string){const p=read();if(!id(plugin))return false;return write({...p,favorites:p.favorites.includes(plugin)?p.favorites.filter(v=>v!==plugin):[...p.favorites,plugin].slice(-32)});}
export function recordRecentPlugin(plugin:string){const p=read();if(!id(plugin))return false;return write({...p,recents:[plugin,...p.recents.filter(v=>v!==plugin)].slice(0,8)});}
export function forgetPlugin(plugin:string){const p=read();return write({favorites:p.favorites.filter(v=>v!==plugin),recents:p.recents.filter(v=>v!==plugin),...(p.codegen&&p.codegen.plugin!==plugin?{codegen:p.codegen}:{})});}
export function setCodegenChoice(choice:CodegenChoice|null){const {codegen:_,...rest}=read();return write(choice?{...rest,codegen:choice}:rest);}
export function clearRecentPlugins(){return write({...read(),recents:[]});}
export function usePluginPreferences(){return useSyncExternalStore(l=>{listeners.add(l);return()=>listeners.delete(l);},read,read);}
/** Actions search only preselects a package. Running it stays an explicit per-run choice in the manager. */
let pending:string|undefined;
export function requestPluginSelection(plugin:string){pending=plugin;}
export function takePluginSelection(){const value=pending;pending=undefined;return value??'';}
