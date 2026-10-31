import type {Page} from './model';
import type {DocumentColorProfile} from './color-profile';
/** Paint a translucent canvas color over the application's neutral canvas, below all artwork. */
export function canvasBackgroundImage(background:Page['background'],profile?:DocumentColorProfile):string|undefined{
 if(!background?.visible)return undefined;
 const rgb=[1,3,5].map(i=>parseInt(background.color.slice(i,i+2),16)).join(',');
 const color=profile==='display-p3'?`color(display-p3 ${rgb.split(',').map(v=>Number(v)/255).join(' ')} / ${background.opacity})`:`rgba(${rgb},${background.opacity})`;return `linear-gradient(${color},${color})`;
}
