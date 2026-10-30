import type {DesignDocument,DesignNode} from './model';
export function validateTextBackground(value:unknown){if(value!==undefined&&(typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value)))throw Error('Text background must be a solid six-digit hex color.');}
export function validateTextBackgrounds(doc:Pick<DesignDocument,'pages'>){for(const page of doc.pages)for(const n of page.nodes){validateTextBackground(n.textBackground);if(n.textBackground!==undefined&&n.type!=='text')throw Error('A text background requires a text layer.');}}
export function textBackgroundColor(n:DesignNode,vector=false){return n.type==='text'&&n.textBackground?(vector?'#ffffff':n.textBackground):undefined;}
