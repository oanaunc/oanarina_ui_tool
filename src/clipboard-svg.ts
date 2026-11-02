/** Many tools copy SVG only as plain text. A whole pasted SVG document goes to the same reviewed import as
 * a real SVG representation. Text that merely mentions an svg tag stays text. This runs on the main thread on every
 * text paste, so both scans below are hand written and linear, and neither looks past a fixed window. */
export const SVG_MARKUP_WINDOW=1_000_000;
const blank=(c:string)=>c.trim()==='';
/** Past instructions, comments and whitespace, or -1 when one never closes. */
function skipProlog(text:string,from:number){let at=from;for(;;){while(at<text.length&&blank(text[at]))at++;if(text.startsWith('<?',at)){const end=text.indexOf('?>',at+2);if(end<0)return -1;at=end+2;}else if(text.startsWith('<!--',at)){const end=text.indexOf('-->',at+4);if(end<0)return -1;at=end+3;}else return at;}}
/** Past an svg document type and its internal subset, or -1 when it names something else or never closes. */
function skipDoctype(text:string,from:number){if(text.slice(from,from+9).toLowerCase()!=='<!doctype')return from;let at=from+9;if(at>=text.length||!blank(text[at]))return -1;while(at<text.length&&blank(text[at]))at++;if(text.slice(at,at+3).toLowerCase()!=='svg'||/[\w:.-]/.test(text[at+3]??''))return -1;at+=3;let quote='',subset=false;for(;at<text.length;at++){const c=text[at];if(quote){if(c===quote)quote='';}else if(c==='"'||c==="'")quote=c;else if(subset&&text.startsWith('<!--',at)){const end=text.indexOf('-->',at+4);if(end<0)return -1;at=end+2;}else if(c==='[')subset=true;else if(c===']')subset=false;else if(c==='>'&&!subset)return at+1;}return -1;}
/** Back over trailing comments to the closing tag, one comment at a time. */
function closesSvg(text:string){let end=text.length;for(;;){while(end>0&&blank(text[end-1]))end--;if(end<3||text.slice(end-3,end)!=='-->')break;end=text.lastIndexOf('<!--',end-3);if(end<0)return false;}return /<\/(?:[\w-]+:)?svg>$/i.test(text.slice(Math.max(0,end-128),end));}
export function isSvgMarkup(text:string|undefined){if(!text)return false;const head=text.slice(0,SVG_MARKUP_WINDOW);let at=skipProlog(head,0);if(at<0)return false;at=skipDoctype(head,at);if(at<0)return false;at=skipProlog(head,at);if(at<0)return false;return /^<(?:[\w-]+:)?svg[\s>]/i.test(head.slice(at,at+128))&&closesSvg(text.slice(-SVG_MARKUP_WINDOW));}
