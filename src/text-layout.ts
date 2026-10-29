import type {DesignNode} from './model';
export interface TextLine {text:string;x:number;y:number;width:number;paragraphEnd:boolean;}
let context:CanvasRenderingContext2D|null=null;
function measure(text:string,n:DesignNode){if(typeof document!=='undefined'&&!context)context=document.createElement('canvas').getContext('2d');if(context)context.font=`${n.fontStyle??'normal'} ${n.fontWeight} ${n.fontSize}px "${n.fontFamily}"`;return (context?context.measureText(text).width:text.length*n.fontSize*.55)+Math.max(0,text.length-1)*n.letterSpacing;}
export function textLines(n:DesignNode,truncate=true):TextLine[]{
 const lines:TextLine[]=[],width=Math.max(1,n.width),indent=n.paragraphIndent??0,lineHeight=n.fontSize*n.lineHeight,spacing=n.paragraphSpacing??0;let y=n.fontSize;
 for(const [index,raw] of n.text.split('\n').entries()){
  const prefix=n.listStyle==='bullet'?'• ':n.listStyle==='number'?`${index+1}. `:'',paragraph=prefix+raw;
  const words=paragraph.split(/(\s+)/);let line='';let first=true;
  const append=(last:boolean)=>{lines.push({text:line,x:first?indent:0,y,width:measure(line,n),paragraphEnd:last});y+=lineHeight;first=false;line='';};
  if(n.textResize==='auto-width'){line=paragraph;append(true);}else{
   for(const word of words){if(!line.trim()&&!word.trim())continue;const available=width-(first?indent:0);if(measure(line+word,n)<=available){line+=word;continue;}if(line.trim()){line=line.trimEnd();append(false);}if(measure(word,n)<=width){line=word.trimStart();continue;}
    for(const char of word){if(line&&measure(line+char,n)>width-(first?indent:0))append(false);line+=char;}
   }append(true);
  }y+=spacing;
 }
 let result=lines;
 const max=n.maxLines&&n.maxLines>0?n.maxLines:Infinity;
 const byHeight=n.textResize==='fixed'&&n.textOverflow==='ellipsis'?Math.max(1,Math.floor(n.height/lineHeight)):Infinity;
 if(truncate&&Math.min(max,byHeight)<lines.length){result=lines.slice(0,Math.min(max,byHeight));const tail={...result.at(-1)!};while(tail.text&&measure(tail.text+'…',n)>width-tail.x)tail.text=tail.text.slice(0,-1);tail.text+='…';tail.width=measure(tail.text,n);tail.paragraphEnd=true;result[result.length-1]=tail;}
 const height=result.length?result.at(-1)!.y:0,offset=n.verticalAlign==='middle'?Math.max(0,(n.height-height)/2):n.verticalAlign==='bottom'?Math.max(0,n.height-height):0;
 return result.map(line=>({...line,y:line.y+offset}));
}
export function updateTextMetrics(nodes:DesignNode[]){for(const n of nodes){if(n.type!=='text'||!n.textResize||n.textResize==='fixed')continue;if(n.textResize==='auto-width'){n.width=Math.max(1,...n.text.split('\n').map((text,i)=>measure((n.listStyle==='bullet'?'• ':n.listStyle==='number'?`${i+1}. `:'')+text,n)+(n.paragraphIndent??0)));}const lines=textLines(n,false);n.height=Math.max(n.fontSize,lines.at(-1)?.y??n.fontSize);}}
