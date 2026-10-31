import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {INTERFACE_ACCENTS,parseInterfaceAccent,parseInterfaceContrast,resolvedInterfaceContrast} from '../src/interface-accessibility';
import {nextPanelRegion,trappedTabIndex} from '../src/focus-management';

/** Reads the shipped CSS, so a token edit cannot silently regress these ratios. */
const styles=readFileSync('src/styles.css','utf8'),accessibility=readFileSync('src/components/interface-accessibility.css','utf8');
type Tokens=Record<string,string>;
function tokens(css:string,selector:string):Tokens{const at=css.indexOf(selector+'{');if(at<0)throw Error('Missing '+selector);const body=css.slice(at+selector.length+1,css.indexOf('}',at));return Object.fromEntries(body.split(';').filter(line=>line.startsWith('--')).map(line=>{const [key,value]=line.split(':');return [key,value];}));}
function rgb(hex:string){const v=hex.slice(1),full=v.length<=4?[...v].map(c=>c+c).join(''):v,n=[0,2,4,6].map(i=>parseInt(full.slice(i,i+2),16));return {r:n[0],g:n[1],b:n[2],a:Number.isNaN(n[3])?1:n[3]/255};}
const over=(top:string,under:string)=>{const t=rgb(top),u=rgb(under),mix=(a:number,b:number)=>Math.round(a*t.a+b*(1-t.a)).toString(16).padStart(2,'0');return '#'+mix(t.r,u.r)+mix(t.g,u.g)+mix(t.b,u.b);};
const luminance=(hex:string)=>{const {r,g,b}=rgb(hex),f=(c:number)=>{const v=c/255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};return .2126*f(r)+.7152*f(g)+.0722*f(b);};
const ratio=(a:string,b:string)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const dark={...tokens(styles,'.app'),...tokens(accessibility,'.app')},light={...dark,...tokens(styles,'.theme-light'),...tokens(accessibility,'.app.theme-light')};
const scheme=(label:string,t:Tokens)=>[label,t] as const;
const more=(base:Tokens,selector:string)=>({...base,...tokens(accessibility,selector)});
const schemes=[scheme('dark',dark),scheme('light',light),scheme('dark increased',more(dark,':root[data-contrast=more] .app')),scheme('light increased',more(light,':root[data-contrast=more] .app.theme-light'))];
const accents=INTERFACE_ACCENTS.filter(id=>id!=='forma').flatMap(id=>[scheme(id+' dark',{...dark,...tokens(accessibility,`:root[data-accent=${id}] .app`)}),scheme(id+' light',{...light,...tokens(accessibility,`:root[data-accent=${id}] .app.theme-light`)})]);

describe('interface color tokens',()=>{
 for(const [label,t] of schemes)it(`${label}: text and icons meet 4.5:1 on every surface`,()=>{for(const surface of [t['--panel'],t['--field'],t['--canvas'],over(t['--hover'],t['--panel'])])for(const text of [t['--text'],t['--muted']])expect(ratio(text,surface),`${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);expect(ratio(t['--accent'],t['--panel'])).toBeGreaterThanOrEqual(4.5);});
 for(const [label,t] of [...schemes,...accents])it(`${label}: focus and selection indicators meet 3:1`,()=>{for(const surface of [t['--panel'],t['--field'],t['--canvas']])expect(ratio(t['--focus-ring'],surface),`focus on ${surface}`).toBeGreaterThanOrEqual(3);expect(ratio(t['--accent-fill'],t['--panel'])).toBeGreaterThanOrEqual(3);expect(ratio(t['--on-accent'],t['--accent-fill'])).toBeGreaterThanOrEqual(4.5);});
 for(const [label,t] of schemes.slice(2))it(`${label}: control boundaries meet 3:1`,()=>{for(const surface of [t['--panel'],t['--canvas']])expect(ratio(over(t['--line'],surface),surface),surface).toBeGreaterThanOrEqual(3);});
 it('checks real values',()=>{expect(dark['--muted']).toBe('#a39ea9');expect(light['--muted']).toBe('#6b6473');expect(accents).toHaveLength(14);});
});
describe('accent and contrast preferences',()=>{
 it('falls back from malformed stored values',()=>{for(const value of ['neon','',null,7])expect(parseInterfaceAccent(value)).toBe('forma');for(const value of ['high','',null,0])expect(parseInterfaceContrast(value)).toBe('system');expect(parseInterfaceAccent('green')).toBe('green');expect(parseInterfaceContrast('more')).toBe('more');});
 it('lets an explicit choice override the system',()=>{expect(resolvedInterfaceContrast('system',true)).toBe(true);expect(resolvedInterfaceContrast('system',false)).toBe(false);expect(resolvedInterfaceContrast('standard',true)).toBe(false);expect(resolvedInterfaceContrast('more',false)).toBe(true);});
});
describe('focus containment arithmetic',()=>{
 it('wraps only at the edges and pulls outside focus back',()=>{expect(trappedTabIndex(2,3,false)).toBe(0);expect(trappedTabIndex(0,3,true)).toBe(2);expect(trappedTabIndex(1,3,false)).toBeNull();expect(trappedTabIndex(-1,3,false)).toBe(0);expect(trappedTabIndex(-1,3,true)).toBe(2);expect(trappedTabIndex(0,0,false)).toBeNull();});
 it('cycles panel regions in both directions',()=>{expect(nextPanelRegion(-1,4,false)).toBe(0);expect(nextPanelRegion(-1,4,true)).toBe(3);expect(nextPanelRegion(3,4,false)).toBe(0);expect(nextPanelRegion(0,4,true)).toBe(3);expect(nextPanelRegion(0,0,false)).toBe(-1);});
});
