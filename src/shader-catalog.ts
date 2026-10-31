import type {ShaderDefinition,ShaderParam} from './shaders';
/** Original Forma shaders. Offline, GLSL ES 1.00 only. Older versions stay here so pinned files keep rendering until updated. */
const n=(key:string,label:string,value:number,min:number,max:number,step=.01,since?:number):ShaderParam=>({key,label,type:'number',value,min,max,step,...(since?{since}:{})});
const c=(key:string,label:string,value:string):ShaderParam=>({key,label,type:'color',value});
const auroraOne=`vec4 shade(vec2 uv){
 float wave=.5+.16*sin(uv.x*4.*u_scale+u_time*u_speed)+.12*(f_fbm(vec2(uv.x*2.*u_scale,u_time*u_speed*.2))-.5);
 float band=exp(-pow((uv.y-wave)*5.,2.));
 return vec4(mix(u_base,u_glow,band),1.);
}`;
const auroraTwo=`vec4 shade(vec2 uv){
 vec3 color=u_base;
 for(int i=0;i<3;i++){
  float f=float(i),t=u_time*u_speed*(.7+.2*f);
  float y=uv.y-.28-.22*f+.12*sin(uv.x*(3.+f)*u_scale+t+f*2.1)+.09*(f_fbm(vec2(uv.x*2.*u_scale,t*.2+f))-.5);
  float band=exp(-y*y*u_softness);
  color=mix(color,i==1?u_accent:u_glow,band*.8);
 }
 return vec4(color,1.);
}`;
export const SHADER_CATALOG:ShaderDefinition[]=[
 {id:'forma.aurora',name:'Aurora Drift',description:'Layered light bands that drift slowly across the layer.',kinds:['fill','effect'],tags:['gradient','light','organic'],animated:true,fallback:['#14213d','#5ee6c5'],params:[c('base','Base','#14213d'),c('glow','Glow','#5ee6c5'),c('accent','Accent','#b56cf2'),n('scale','Scale',1,.2,6),n('speed','Speed',.6,0,4),n('softness','Softness',26,4,80,1,2)],versions:[{version:1,glsl:auroraOne},{version:2,glsl:auroraTwo}]},
 {id:'forma.marble',name:'Liquid Marble',description:'Warped veins that fold into each other like poured ink.',kinds:['fill'],tags:['organic','texture'],animated:true,fallback:['#f1ece2','#27364a'],params:[c('paper','Paper','#f1ece2'),c('ink','Ink','#27364a'),n('scale','Scale',3,.5,12),n('warp','Warp',1.4,0,4),n('speed','Speed',.25,0,2)],versions:[{version:1,glsl:`vec4 shade(vec2 uv){
 vec2 p=uv*u_scale+vec2(u_time*u_speed,0.);
 vec2 q=vec2(f_fbm(p),f_fbm(p+vec2(5.2,1.3)));
 float v=f_fbm(p+q*u_warp*2.);
 float vein=smoothstep(.02,.28,abs(fract(v*5.)-.5));
 return vec4(mix(u_ink,u_paper,vein),1.);
}`}]},
 {id:'forma.mesh',name:'Soft Mesh',description:'Four corner colors with a gentle moving bend between them.',kinds:['fill'],tags:['gradient'],animated:true,fallback:['#ff8a5b','#4a6cf7'],params:[c('topLeft','Top left','#ff8a5b'),c('topRight','Top right','#ffd166'),c('bottomLeft','Bottom left','#4a6cf7'),c('bottomRight','Bottom right','#2ec4b6'),n('bend','Bend',.18,0,.6),n('speed','Speed',.4,0,3)],versions:[{version:1,glsl:`vec4 shade(vec2 uv){
 vec2 p=uv+u_bend*vec2(sin(uv.y*3.1+u_time*u_speed),cos(uv.x*2.7-u_time*u_speed));
 p=clamp(p,0.,1.);
 return vec4(mix(mix(u_topLeft,u_topRight,p.x),mix(u_bottomLeft,u_bottomRight,p.x),p.y),1.);
}`}]},
 {id:'forma.halftone',name:'Halftone Bloom',description:'Print dots that swell around the pointer position.',kinds:['fill','effect'],tags:['print','pattern','interactive'],interactive:true,fallback:['#fff4e0','#d7263d'],params:[c('paper','Paper','#fff4e0'),c('dot','Dot','#d7263d'),n('cell','Cell size',14,3,64,1),n('reach','Reach',.6,.05,1.5)],versions:[{version:1,glsl:`vec4 shade(vec2 uv){
 vec2 px=uv*u_resolution;
 vec2 cell=(fract(px/u_cell)-.5)*u_cell;
 float near=1.-clamp(distance(uv,u_pointer)/u_reach,0.,1.);
 float radius=u_cell*(.14+.34*near);
 float mask=1.-smoothstep(radius-1.,radius+1.,length(cell));
 return vec4(mix(u_paper,u_dot,mask),1.);
}`}]},
 {id:'forma.contours',name:'Contour Lines',description:'Topographic lines traced through slow noise.',kinds:['fill'],tags:['pattern','organic'],animated:true,fallback:['#0f1b2d','#7bdff2'],params:[c('ground','Ground','#0f1b2d'),c('line','Line','#7bdff2'),n('scale','Scale',3,.5,10),n('density','Density',9,2,24,.5),n('speed','Speed',.15,0,2)],versions:[{version:1,glsl:`vec4 shade(vec2 uv){
 float v=f_fbm(uv*u_scale+vec2(0.,u_time*u_speed))*u_density;
 float d=abs(fract(v)-.5);
 float line=1.-smoothstep(.0,.05,d);
 return vec4(mix(u_ground,u_line,line),1.);
}`}]},
 {id:'forma.foil',name:'Iridescent Foil',description:'Angle-shifting spectral sheen for metallic surfaces.',kinds:['fill'],tags:['light','gradient','interactive'],interactive:true,animated:true,fallback:['#c9d6ff','#f5c6ec'],params:[n('angle','Angle',.8,0,6.28),n('bands','Bands',3,.5,12),n('sheen','Sheen',.55,0,1),n('speed','Speed',.3,0,3)],versions:[{version:1,glsl:`vec4 shade(vec2 uv){
 vec2 d=vec2(cos(u_angle),sin(u_angle));
 float phase=dot(uv-u_pointer,d)*u_bands+u_time*u_speed;
 vec3 spectrum=.5+.5*cos(6.2832*(phase+vec3(0.,.33,.67)));
 float glint=pow(1.-clamp(distance(uv,u_pointer),0.,1.),3.);
 return vec4(mix(vec3(.82),spectrum,u_sheen)+glint*.25,1.);
}`}]},
 {id:'forma.grain',name:'Film Grain',description:'Fine moving grain laid over the layer.',kinds:['effect'],tags:['texture','film'],animated:true,fallback:['#808080','#808080'],params:[n('amount','Amount',.45,0,1),n('size','Grain size',1.5,.5,8,.1),n('speed','Speed',12,0,48,1)],versions:[{version:1,glsl:`vec4 shade(vec2 uv){
 float g=f_noise(uv*u_resolution/u_size+vec2(floor(u_time*u_speed)*17.3));
 return vec4(vec3(g),u_amount*abs(g-.5)*2.);
}`}]},
 {id:'forma.scanlines',name:'Scanlines',description:'Horizontal display lines with a slow roll.',kinds:['effect'],tags:['film','pattern'],animated:true,fallback:['#000000','#000000'],params:[c('tint','Tint','#000000'),n('spacing','Spacing',4,1,32,.5),n('amount','Amount',.35,0,1),n('speed','Roll speed',.5,0,8,.1)],versions:[{version:1,glsl:`vec4 shade(vec2 uv){
 float y=uv.y*u_resolution.y/u_spacing+u_time*u_speed;
 return vec4(u_tint,step(.5,fract(y))*u_amount);
}`}]},
 {id:'forma.pixelate',name:'Pixelate',description:'Reads the layer and rebuilds it from square cells. Use Sample layer mode.',kinds:['effect'],tags:['distortion','pixels'],fallback:['#808080','#808080'],params:[n('cells','Cells',24,2,256,1)],versions:[{version:1,glsl:`vec4 shade(vec2 uv){
 vec2 cell=vec2(u_cells,u_cells*u_resolution.y/max(1.,u_resolution.x));
 return f_source((floor(uv*cell)+.5)/cell);
}`}]},
 {id:'forma.channels',name:'Channel Split',description:'Reads the layer and offsets red and blue in opposite directions. Use Sample layer mode.',kinds:['effect'],tags:['distortion','pixels'],fallback:['#808080','#808080'],params:[n('amount','Amount',.02,0,.2,.001)],versions:[{version:1,glsl:`vec4 shade(vec2 uv){
 vec4 r=f_source(uv+vec2(u_amount,0.)),g=f_source(uv),b=f_source(uv-vec2(u_amount,0.));
 return vec4(r.r,g.g,b.b,max(max(r.a,g.a),b.a));
}`}]},
 {id:'forma.ripple',name:'Ripple Field',description:'Concentric rings. Use Displace mode to bend the layer around the pointer.',kinds:['effect'],tags:['distortion','interactive'],interactive:true,animated:true,fallback:['#808080','#808080'],params:[n('rings','Rings',18,2,60,1),n('speed','Speed',2,0,10,.1),n('falloff','Falloff',2.5,.2,10,.1)],versions:[{version:1,glsl:`vec4 shade(vec2 uv){
 vec2 d=uv-u_pointer;
 float r=length(d);
 float w=sin(r*u_rings-u_time*u_speed)*exp(-r*u_falloff);
 vec2 dir=r>.0001?d/r:vec2(0.);
 return vec4(.5+.5*dir*w,.5,1.);
}`}]},
 {id:'forma.spotlight',name:'Spotlight',description:'A soft pool of light that follows the pointer.',kinds:['effect'],tags:['light','interactive'],interactive:true,fallback:['#fff6d8','#fff6d8'],params:[c('light','Light','#fff6d8'),n('radius','Radius',.55,.05,1.5),n('strength','Strength',.8,0,1)],versions:[{version:1,glsl:`vec4 shade(vec2 uv){
 float aspect=u_resolution.x/max(1.,u_resolution.y);
 vec2 d=(uv-u_pointer)*vec2(aspect,1.);
 return vec4(u_light,smoothstep(u_radius,0.,length(d))*u_strength);
}`}]},
];
