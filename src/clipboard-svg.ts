/** Many tools copy SVG only as plain text. A whole pasted SVG document goes to the same reviewed import as
 * a real SVG representation. Text that merely mentions an svg tag stays text. */
const LEAD=/^\s*(<\?xml\b[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*(<!doctype\s+svg\b[^>]*>\s*)?/i;
export function isSvgMarkup(text:string|undefined){if(!text)return false;const body=text.slice(LEAD.exec(text)?.[0].length??0);return /^<svg[\s>]/i.test(body)&&/<\/svg>\s*(<!--[\s\S]*?-->\s*)*$/i.test(body);}
