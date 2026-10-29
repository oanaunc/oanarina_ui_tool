import type {Page} from './model';
/** Paint a translucent canvas color over the application's neutral canvas, below all artwork. */
export function canvasBackgroundImage(background:Page['background']):string|undefined{
 if(!background?.visible)return undefined;
 const rgb=[1,3,5].map(i=>parseInt(background.color.slice(i,i+2),16)).join(',');
 const color=`rgba(${rgb},${background.opacity})`;return `linear-gradient(${color},${color})`;
}
