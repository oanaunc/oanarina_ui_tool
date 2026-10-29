/** WCAG 2.x sRGB relative luminance. Threshold comparisons use the unrounded ratio. */
export function contrastRatio(foreground:string,background:string,opacity=1):number {
 const rgb=(hex:string)=>{if(!/^#[0-9a-f]{6}$/i.test(hex))throw Error('Use a six-digit hexadecimal color.');return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);};
 if(!Number.isFinite(opacity)||opacity<0||opacity>1)throw Error('Opacity must be between zero and one.');
 const back=rgb(background),front=rgb(foreground).map((v,i)=>v*opacity+back[i]*(1-opacity));
 const luminance=(color:number[])=>color.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 const a=luminance(front),b=luminance(back);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
export function contrastResults(ratio:number){return {normalAA:ratio>=4.5,normalAAA:ratio>=7,largeAA:ratio>=3,largeAAA:ratio>=4.5};}
