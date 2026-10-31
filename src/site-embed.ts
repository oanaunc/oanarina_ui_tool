import type {SiteEmbed} from './site';
const KEEP=new Set(['a','abbr','b','blockquote','br','caption','cite','code','col','colgroup','dd','div','dl','dt','em','figcaption','figure','h1','h2','h3','h4','h5','h6','hr','i','img','li','ol','p','pre','q','s','small','span','strong','sub','sup','table','tbody','td','tfoot','th','thead','tr','u','ul']);
const REMOVE_WITH_CONTENT=new Set(['script','style','iframe','object','embed','noscript','template','svg','math','title','textarea','xmp','noembed','noframes','plaintext','frameset','applet','audio','video','canvas','select','form']);
const VOID=new Set(['br','col','hr','img']);
const ATTRIBUTES=new Set(['alt','colspan','dir','height','href','lang','rowspan','src','title','width']);
const URL_OK=/^(?:https?:\/\/|mailto:)[^\s"'<>]+$/i,IMAGE_OK=/^(?:https:\/\/[^\s"'<>]+|data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=]+)$/i;
const attribute=(value:string)=>value.replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function readAttributes(html:string,from:number){const attributes:[string,string][]=[],n=html.length,space=/\s/;let i=from;while(i<n){while(i<n&&(space.test(html[i])||html[i]==='/'))i++;if(i>=n)return null;if(html[i]==='>')return {attributes,end:i+1};let name='';while(i<n&&!/[\s/>=]/.test(html[i]))name+=html[i++];while(i<n&&space.test(html[i]))i++;let value='';if(html[i]==='='){i++;while(i<n&&space.test(html[i]))i++;const quote=html[i];if(quote==='"'||quote==="'"){const end=html.indexOf(quote,i+1);if(end<0)return null;value=html.slice(i+1,end);i=end+1;}else while(i<n&&!/[\s>]/.test(html[i]))value+=html[i++];}if(name)attributes.push([name.toLowerCase(),value]);}return null;}
/** Rebuilds markup from parsed tokens, so nothing reaches the output unless a rule emitted it. The sandbox and CSP remain the boundary. */
export function sanitizeEmbedHtml(html:string){let out='',i=0;const n=html.length,escapeText=(t:string)=>t.replace(/</g,'&lt;').replace(/>/g,'&gt;');
 while(i<n){const open=html.indexOf('<',i);if(open<0){out+=escapeText(html.slice(i));break;}out+=escapeText(html.slice(i,open));
  if(html.startsWith('<!--',open)){const end=html.indexOf('-->',open+4);if(end<0)break;i=end+3;continue;}
  if(html[open+1]==='!'||html[open+1]==='?'){const end=html.indexOf('>',open);if(end<0)break;i=end+1;continue;}
  const closing=html[open+1]==='/',start=open+(closing?2:1),nameMatch=/^[a-zA-Z][a-zA-Z0-9:-]*/.exec(html.slice(start,start+64));if(!nameMatch){out+='&lt;';i=open+1;continue;}
  const name=nameMatch[0].toLowerCase(),tag=readAttributes(html,start+nameMatch[0].length);if(!tag)break;const {attributes}=tag;i=tag.end;
  if(REMOVE_WITH_CONTENT.has(name)){if(closing)continue;const lower=html.toLowerCase(),end=lower.indexOf('</'+name,i);if(end<0)break;const close=html.indexOf('>',end);if(close<0)break;i=close+1;continue;}
  if(!KEEP.has(name))continue;if(closing){if(!VOID.has(name))out+=`</${name}>`;continue;}
  const kept=attributes.filter(([key,val])=>ATTRIBUTES.has(key)&&(key==='href'?URL_OK.test(val):key==='src'?name==='img'&&IMAGE_OK.test(val):true)).map(([key,val])=>` ${key}="${attribute(val)}"`).join('');out+=`<${name}${kept}>`;
 }return out;}
export function embedSandbox(e:SiteEmbed){return [e.allowScripts&&'allow-scripts',e.kind==='url'&&e.allowScripts&&e.allowSameOrigin&&'allow-same-origin'].filter(Boolean).join(' ');}
const STRICT="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; font-src https: data:; form-action 'none'; base-uri 'none'",SCRIPTED="default-src 'none'; script-src 'unsafe-inline' https:; style-src 'unsafe-inline' https:; img-src https: data:; font-src https: data:; connect-src https:; media-src https:; frame-src https:; form-action 'none'; base-uri 'none'";
/** The full document placed in `srcdoc`. Callers must attribute-escape the result. */
export function embedDocument(e:SiteEmbed){return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${e.allowScripts?SCRIPTED:STRICT}"><style>body{margin:0;font-family:system-ui,sans-serif}img{max-width:100%}</style></head><body>${e.allowScripts?e.html:sanitizeEmbedHtml(e.html)}</body></html>`;}
