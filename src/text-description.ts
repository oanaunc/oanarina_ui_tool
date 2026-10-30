import type {DesignDocument,DesignNode} from './model';
import {isLocked} from './model';
export const TEXT_DESCRIPTION_LIMIT=2000;
export function validateTextDescription(value:unknown){if(value!==undefined&&(typeof value!=='string'||value.length>TEXT_DESCRIPTION_LIMIT||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(value)))throw Error('Text description must be plain text up to 2000 characters.');}
export function validateTextDescriptions(doc:Pick<DesignDocument,'pages'>){for(const page of doc.pages)for(const n of page.nodes){validateTextDescription(n.textDescription);if(n.textDescription!==undefined&&n.type!=='text')throw Error('A text accessibility description requires a text layer.');}}
export function setTextDescription(doc:DesignDocument,pageId:string,id:string,value:string){validateTextDescription(value);const page=doc.pages.find(p=>p.id===pageId),n=page?.nodes.find(n=>n.id===id);if(!page||n?.type!=='text')throw Error('Select an existing text layer.');if(isLocked(n,page.nodes))throw Error('Unlock this text layer and its ancestors first.');const normalized=value.replace(/\r\n?/g,'\n');if(normalized.trim())n.textDescription=normalized;else delete n.textDescription;}
export function textAccessibleName(n:DesignNode){return n.accessibilityLabel||n.text||n.name;}
