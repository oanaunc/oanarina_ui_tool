import type {LocalPlugin} from './local-plugin-manifest';
import type {PluginPreferences} from './local-plugin-preferences';
const normalize=(s:string)=>s.normalize('NFKD').replace(/[̀-ͯ]/g,'').toLocaleLowerCase();
/** Favorites, then recents, then name order; every query word must occur in the name, description or ID. */
export function rankPluginSearch(plugins:readonly LocalPlugin[],query:string,prefs:PluginPreferences){const terms=normalize(query).trim().split(/\s+/).filter(Boolean),rank=(p:LocalPlugin)=>{const favorite=prefs.favorites.includes(p.id),recent=prefs.recents.indexOf(p.id);return favorite?0:recent>=0?1+recent:20;};return plugins.filter(p=>{const text=normalize(p.name+' '+p.description+' '+p.id);return terms.every(t=>text.includes(t));}).map(plugin=>({plugin,rank:rank(plugin),tag:prefs.favorites.includes(plugin.id)?'Favorite':prefs.recents.includes(plugin.id)?'Recent':''})).sort((a,b)=>a.rank-b.rank||a.plugin.name.localeCompare(b.plugin.name));}
