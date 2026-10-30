export type TextWrap='normal'|'balance'|'pretty';
export interface WrapRange {from:number;to:number;}
export const TEXT_WRAP_LIMITS={words:64,units:8192,lines:16,measurements:2100,paragraphs:32,totalMeasurements:4096} as const;
export function validateTextWrap(value:unknown){if(value!==undefined&&!['normal','balance','pretty'].includes(value as string))throw Error('Text wrapping must be Normal, Balance or Pretty.');}
/** Optimize only legal word boundaries with the existing greedy line count. Undefined means normal fallback. */
export function optimizeTextWrap(text:string,greedy:readonly WrapRange[],measure:(from:number,to:number)=>number,firstWidth:number,restWidth:number,mode:TextWrap):WrapRange[]|undefined{
 if(mode==='normal'||text.length>TEXT_WRAP_LIMITS.units||greedy.length<2||greedy.length>TEXT_WRAP_LIMITS.lines||!Number.isFinite(firstWidth)||!Number.isFinite(restWidth)||Math.min(firstWidth,restWidth)<=0||/[^\S ]/u.test(text))return;
 const words=[...text.matchAll(/\S+/gu)].map(m=>({from:m.index,to:m.index+m[0].length}));if(words.length>TEXT_WRAP_LIMITS.words||words.length<greedy.length)return;
 const starts=new Map(words.map((w,i)=>[w.from,i])),ends=new Map(words.map((w,i)=>[w.to,i+1]));let previous=0;const original:{from:number;to:number}[]=[];
 for(const range of greedy){const a=starts.get(range.from),b=ends.get(range.to);if(a===undefined||b===undefined||a!==previous||b<=a)return;original.push({from:a,to:b});previous=b;}if(previous!==words.length)return;
 let calls=0;const widths=new Map<string,number>(),width=(a:number,b:number)=>{const key=a+':'+b;if(widths.has(key))return widths.get(key)!;if(++calls>TEXT_WRAP_LIMITS.measurements)throw Error('wrap-budget');const value=measure(words[a].from,words[b-1].to);if(!Number.isFinite(value)||value<0)throw Error('wrap-metrics');widths.set(key,value);return value;};
 const cost=(line:number,a:number,b:number)=>{const available=line===0?firstWidth:restWidth,w=width(a,b);if(w>available+.01)return Infinity;const slack=Math.max(0,(available-w)/available),last=line===greedy.length-1;if(mode==='balance')return slack*slack;const orphan=last?(b-a===1?2:0)+2*Math.pow(Math.max(0,.3-w/available)/.3,2):0;return slack*slack*(last?.05:1)+orphan;};
 try{const count=greedy.length,n=words.length,scores=Array.from({length:count+1},()=>Array<number>(n+1).fill(Infinity)),next=Array.from({length:count},()=>Array<number>(n+1).fill(-1));scores[count][n]=0;
  for(let line=count-1;line>=0;line--)for(let a=n-(count-line);a>=line;a--)for(let b=a+1;b<=n-(count-line-1);b++){const score=cost(line,a,b)+scores[line+1][b];if(score<scores[line][a]-1e-10){scores[line][a]=score;next[line][a]=b;}}
  const originalCost=original.reduce((sum,r,i)=>sum+cost(i,r.from,r.to),0);if(!Number.isFinite(scores[0][0]))return;if(scores[0][0]>=originalCost-1e-8)return greedy.map(r=>({...r}));const result:WrapRange[]=[];let at=0;for(let line=0;line<count;line++){const end=next[line][at];if(end<=at)return;result.push({from:words[at].from,to:words[end-1].to});at=end;}return result;
 }catch(error){if(error instanceof Error&&['wrap-budget','wrap-metrics'].includes(error.message))return;throw error;}
}
