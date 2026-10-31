export type FramePresetCategory='Desktop'|'Phone & tablet'|'Social'|'Watch'|'Paper'|'Presentation'|'Foldable'|'Archive';
export interface FramePreset {id:string;category:FramePresetCategory;name:string;width:number;height:number;description?:string;foldableState?:'closed'|'open';pairId?:string;}
/** Dimensions are logical canvas pixels. Paper is rounded from physical size at 96 CSS pixels/inch. */
export const framePresets:readonly FramePreset[]=[
 {id:'desktop',category:'Desktop',name:'Desktop',width:1440,height:1024},
 {id:'macbook-air',category:'Desktop',name:'MacBook Air',width:1440,height:900},
 {id:'phone',category:'Phone & tablet',name:'iPhone',width:393,height:852},
 {id:'tablet',category:'Phone & tablet',name:'iPad',width:834,height:1194},
 {id:'social-square',category:'Social',name:'Social square',width:1080,height:1080},
 {id:'watch-small',category:'Watch',name:'Watch small',width:184,height:224},
 {id:'watch-large',category:'Watch',name:'Watch large',width:198,height:242},
 {id:'watch-ultra',category:'Watch',name:'Watch extra large',width:205,height:251},
 {id:'paper-a5',category:'Paper',name:'A5',width:559,height:794},
 {id:'paper-a4',category:'Paper',name:'A4',width:794,height:1123},
 {id:'paper-a3',category:'Paper',name:'A3',width:1123,height:1587},
 {id:'paper-letter',category:'Paper',name:'US Letter',width:816,height:1056},
 {id:'paper-legal',category:'Paper',name:'US Legal',width:816,height:1344},
 {id:'paper-tabloid',category:'Paper',name:'US Tabloid',width:1056,height:1632},
 {id:'presentation-wide',category:'Presentation',name:'Presentation 16:9',width:1920,height:1080},
 {id:'presentation-standard',category:'Presentation',name:'Presentation 4:3',width:1024,height:768},
 {id:'presentation-16-10',category:'Presentation',name:'Presentation 16:10',width:1920,height:1200},
 {id:'foldable-closed',category:'Foldable',name:'Foldable closed',width:360,height:800,pairId:'forma-book',foldableState:'closed',description:'Forma book-style reference size; generic logical canvas, not a named device.'},
 {id:'foldable-open',category:'Foldable',name:'Foldable open',width:720,height:800,pairId:'forma-book',foldableState:'open',description:'Forma book-style reference size; generic logical canvas, not a named device.'},
 {id:'archive-iphone-se-1',category:'Archive',name:'iPhone SE (1st generation)',width:320,height:568,description:'Archived Apple UIKit size in points, mapped one-to-one to canvas pixels.'},
 {id:'archive-iphone-8',category:'Archive',name:'iPhone 8',width:375,height:667,description:'Archived Apple UIKit size in points, mapped one-to-one to canvas pixels.'},
 {id:'archive-iphone-8-plus',category:'Archive',name:'iPhone 8 Plus',width:414,height:736,description:'Archived Apple UIKit size in points, mapped one-to-one to canvas pixels.'},
 {id:'archive-iphone-x',category:'Archive',name:'iPhone X',width:375,height:812,description:'Archived Apple UIKit size in points, mapped one-to-one to canvas pixels.'},
 {id:'archive-ipad-air-2',category:'Archive',name:'iPad Air 2',width:768,height:1024,description:'Archived Apple UIKit size in points, mapped one-to-one to canvas pixels.'},
 {id:'archive-ipad-pro-12-9-2',category:'Archive',name:'iPad Pro 12.9-inch (2nd generation)',width:1024,height:1366,description:'Archived Apple UIKit size in points, mapped one-to-one to canvas pixels.'},
];
export function matchingFramePresets(query:string,category:FramePresetCategory|'all'='all'){const tokens=query.trim().toLocaleLowerCase().replace(/(\d)\s*[×x]\s*(\d)/g,'$1 $2').replace(/\b(?:px|pixels)\b/g,' ').split(/\s+/).filter(Boolean);return framePresets.filter(p=>(category==='all'||p.category===category)&&tokens.every(token=>`${p.category} ${p.name} ${p.width} ${p.height} ${p.foldableState??''}`.toLocaleLowerCase().includes(token)));}
