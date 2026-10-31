/** Dev Mode inspects a file without changing its artwork. Handoff status, annotations, resources and Code Connect keep their own guarded panels. */
export const DEV_MODE_TOOLS=['move','hand','comment'];
const blockedCategories=new Set(['Object','Vector','Arrange','Page']);
const blockedCommands=new Set(['cut','paste','duplicate','delete','rename','rename-file','file-cover','import','import-sketch','import-pdf','place-video','selection-box','keyboard-insert','control-button','control-toggle','control-checkbox','control-radio']);
const allowedInBlocked=new Set(['text-find']);
export function devModeRefuses(mode:string,id:string,category:string|undefined){if(mode!=='inspect'||allowedInBlocked.has(id))return false;if(category==='Tools')return !DEV_MODE_TOOLS.includes(id.replace(/^tool-/,''));return blockedCommands.has(id)||category==='Text'||!!category&&blockedCategories.has(category);}
/** Unmodified keys that nudge or set opacity on the selection. Tool letters are covered by the canvas: a placement click only returns to Move. */
export const devModeRefusesKey=(mode:string,key:string)=>mode==='inspect'&&(key.startsWith('arrow')||/^[0-9]$/.test(key));
export const devModeBlocksPlacement=(mode:string,tool:string)=>mode==='inspect'&&!['move','scale','hand','comment'].includes(tool);
