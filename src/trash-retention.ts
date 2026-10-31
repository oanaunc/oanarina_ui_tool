import type {LocalFileEntry} from './file-browser';
import {listLocalFiles,permanentlyDeleteDocument} from './repository';
const DAY=86400000;
/** Only files already in Trash past the chosen age qualify. Open, unparsable and future-dated entries are always kept. */
export function expiredTrashIds(entries:readonly LocalFileEntry[],days:number,now:number,openIds:readonly string[]=[]){if(!Number.isInteger(days)||days<0||!Number.isFinite(now))throw Error('Invalid Trash retention.');if(!days)return[];return entries.filter(({doc,metadata:m})=>{const at=m.trashedAt?Date.parse(m.trashedAt):NaN;return !m.deleted&&Number.isFinite(at)&&at<=now&&now-at>days*DAY&&!openIds.includes(doc.id);}).map(e=>e.doc.id);}
/** Each removal uses the permanent-delete path, so a failure keeps that file and stops the sweep. */
export async function applyTrashRetention(days:number,openIds:readonly string[],now=Date.now()){if(!days)return 0;const {entries}=await listLocalFiles();let removed=0;for(const id of expiredTrashIds(entries,days,now,openIds)){await permanentlyDeleteDocument(id,openIds);removed++;}return removed;}
