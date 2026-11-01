import {numericExpression} from './guides';
const SCALE:Record<string,number>={px:1,pt:1,deg:1,'°':1,rem:16,em:16};
/** Percentages read against `percentOf`, or the field's current value when nothing larger holds it. After * or / a percentage is a plain ratio, so 100 * 50% is 50. */
export function expandUnits(raw:string,current=0,percentOf?:number){return raw.replace(/(\d*\.?\d+(?:e[+-]?\d+)?)\s*(%|px|pt|rem|em|deg|°)(?![a-z%°])/gi,(_,digits:string,unit:string,at:number)=>{const n=Number(digits),key=unit.toLowerCase();if(key!=='%')return String(n*SCALE[key]);return String(/[*/]\s*$/.test(raw.slice(0,at))?n/100:n/100*(percentOf??current));});}
/** Arithmetic with units, parsed locally like every number field. */
export const unitExpression=(raw:string,current=0,percentOf?:number)=>numericExpression(expandUnits(raw,current,percentOf),current);
