/** Fixed script shipped with every exported site. It holds no user data, and its hash is pinned by the preview guest. */
export const SITE_RUNTIME=`(function(){'use strict';
var root=document.documentElement,preview=root.hasAttribute('data-site-preview'),respect=root.hasAttribute('data-site-reduced');
root.classList.add('js');
function reduced(){return respect&&matchMedia('(prefers-reduced-motion: reduce)').matches;}
function all(selector){return Array.prototype.slice.call(document.querySelectorAll(selector));}
function reveal(){var items=all('[data-site-reveal]');if(!items.length)return;if(reduced()||!('IntersectionObserver' in window)){items.forEach(function(el){el.classList.add('site-in');});return;}var seen=new IntersectionObserver(function(entries){entries.forEach(function(entry){var el=entry.target;if(entry.isIntersecting){el.classList.add('site-in');if(el.hasAttribute('data-site-once'))seen.unobserve(el);}else if(!el.hasAttribute('data-site-once'))el.classList.remove('site-in');});},{threshold:0.1});items.forEach(function(el){seen.observe(el);});}
function parallax(){var items=all('[data-site-parallax]');if(!items.length||reduced())return;var queued=false,moved=new Map();function run(){queued=false;var middle=innerHeight/2;items.forEach(function(el){var rect=el.getBoundingClientRect(),shift=moved.get(el)||0,speed=Number(el.getAttribute('data-site-parallax'))||0,next=Math.round((rect.top-shift+rect.height/2-middle)*-speed*100)/100;moved.set(el,next);el.style.translate='0 '+next+'px';});}function queue(){if(!queued){queued=true;requestAnimationFrame(run);}}addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);run();}
function sample(stops,key,p){var a=null,b=null;stops.forEach(function(s){if(s[key]===undefined)return;if(a===null||s.offset<=p)a=s;if(b===null&&s.offset>=p)b=s;});if(a===null)return undefined;if(b===null)b=a;var span=b.offset-a.offset,t=span>0?Math.max(0,Math.min(1,(p-a.offset)/span)):0;return a[key]+(b[key]-a[key])*t;}
function scrollLinks(){var items=all('[data-site-scroll]').map(function(el){try{return {el:el,link:JSON.parse(el.getAttribute('data-site-scroll'))};}catch(e){return null;}}).filter(Boolean);if(!items.length||reduced())return;var queued=false,shifts=new Map();function run(){queued=false;var height=innerHeight;items.forEach(function(item){var el=item.el,rect=el.getBoundingClientRect(),own=shifts.get(el)||0,top=rect.top-own,span=height+rect.height,trip=span>0?Math.max(0,Math.min(1,(height-top)/span)):0,range=item.link.end-item.link.start,p=Math.max(0,Math.min(1,(trip-item.link.start)/range)),stops=item.link.keyframes,o=sample(stops,'opacity',p),x=sample(stops,'x',p),y=sample(stops,'y',p),s=sample(stops,'scale',p),r=sample(stops,'rotate',p);shifts.set(el,y===undefined?0:y);if(o!==undefined)el.style.opacity=String(o);if(x!==undefined||y!==undefined)el.style.translate=(x||0)+'px '+(y||0)+'px';if(s!==undefined)el.style.scale=String(s);if(r!==undefined)el.style.rotate=r+'deg';});}function queue(){if(!queued){queued=true;requestAnimationFrame(run);}}addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);run();}
/* A repeated list has many copies of a layer. A click reaches the copy in its own item, and from outside a list, the first one. */
function resolve(from,id){var item=from.closest&&from.closest('[data-site-item]'),own=function(list){for(var i=0;i<list.length;i++)if(list[i].getAttribute('data-site-ref')===id)return list[i];return null;};if(item){if(item.getAttribute('data-site-ref')===id)return item;var found=own(item.querySelectorAll('[data-site-ref]'));if(found)return found;}return document.getElementById(id)||own(document.querySelectorAll('[data-site-ref]'));}
function toggles(){function act(el){var target=resolve(el,el.getAttribute('data-site-toggle'));if(!target)return;var mode=el.getAttribute('data-site-click'),hidden=mode==='show'?target.classList.remove('site-hidden')||false:mode==='hide'?target.classList.add('site-hidden')||true:target.classList.toggle('site-hidden');el.setAttribute('aria-expanded',hidden?'false':'true');}all('[data-site-toggle]').forEach(function(el){el.addEventListener('click',function(){act(el);});el.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();act(el);}});});}
function actions(){function visible(el){return !el.classList.contains('site-hidden')&&getComputedStyle(el).display!=='none';}function run(el){var steps;try{steps=JSON.parse(el.getAttribute('data-site-actions'));}catch(e){return;}steps.forEach(function(step){var when=step.when&&resolve(el,step.when.target);if(step.when&&(!when||visible(when)!==(step.when.state==='visible')))return;var target=step.target&&resolve(el,step.target);if(step.kind==='copy'){if(navigator.clipboard)navigator.clipboard.writeText(step.text).catch(function(){});return;}if(!target)return;if(step.kind==='scroll')target.scrollIntoView({behavior:reduced()?'auto':'smooth'});else if(step.kind==='focus'){if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus();}else target.classList[step.kind==='show'?'remove':step.kind==='hide'?'add':'toggle']('site-hidden');});}all('[data-site-actions]').forEach(function(el){el.addEventListener('click',function(){run(el);});el.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();run(el);}});});}
function forms(){all('form[data-site-form]').forEach(function(form){form.addEventListener('submit',function(event){var status=form.querySelector('.site-form-status'),endpoint=form.getAttribute('data-site-form');if(preview){event.preventDefault();if(status)status.textContent='Preview only. The form is valid, and nothing was sent.';return;}if(!endpoint){event.preventDefault();if(status)status.textContent='This form is not connected to a service, so nothing was sent.';}});});}
function previewLinks(){if(!preview)return;document.addEventListener('click',function(event){var link=event.target.closest&&event.target.closest('a');if(!link)return;event.preventDefault();var path=link.getAttribute('data-site-path'),hash=link.getAttribute('data-site-hash');if(path){parent.postMessage({kind:'navigate',path:path,hash:hash||''},'*');return;}if(hash){var target=document.getElementById(hash);if(target)target.scrollIntoView();return;}parent.postMessage({kind:'external',url:link.href},'*');});}
function ready(){reveal();parallax();scrollLinks();toggles();actions();forms();previewLinks();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
`;
export const SITE_BASE_CSS=`*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--site-background,#fff)}
.node{position:relative;margin:0;padding:0;min-width:0}
a.node,.node a{color:inherit}
a.node{text-decoration:none}
img.node{display:block}
iframe.node{display:block;border:0}
.site-hidden{display:none!important}
.site-rich>:first-child{margin-top:0}
.site-rich>:last-child{margin-bottom:0}
.site-skip{position:absolute;left:12px;top:-64px;z-index:1000;padding:10px 16px;background:#fff;color:#111;font:600 16px system-ui,sans-serif;border-radius:6px}
.site-skip:focus{top:12px}
:focus-visible{outline:3px solid var(--site-focus);outline-offset:2px}
[data-site-toggle],[data-site-actions]{cursor:pointer}
.site-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.site-field label{font:500 14px/1.4 system-ui,sans-serif;color:#3b3741}
.site-check{display:flex;align-items:center;gap:8px;font:400 14px/1.4 system-ui,sans-serif;color:#3b3741}
.site-field input,.site-field textarea,.site-field select{width:100%;min-height:44px;padding:10px 12px;border:1px solid #8f8999;border-radius:8px;background:#fff;color:#1f1d24;font:400 16px/1.4 system-ui,sans-serif}
.site-field textarea{min-height:96px;resize:vertical}
.site-submit{align-self:flex-start;min-height:44px;padding:10px 20px;border:0;border-radius:8px;background:var(--site-accent,#5b3fb5);color:#fff;font:600 15px/1.2 system-ui,sans-serif;cursor:pointer}
.site-form-status{margin:0;min-height:20px;font:400 14px/1.4 system-ui,sans-serif;color:#3b3741}
.site-embed-note{display:flex;align-items:center;justify-content:center;padding:16px;text-align:center;background:#efecf3;color:#3b3741;font:400 14px/1.4 system-ui,sans-serif}
@keyframes forma-fade-in{from{opacity:0}}
@keyframes forma-slide-up{from{opacity:0;translate:0 32px}}
@keyframes forma-zoom-in{from{opacity:0;scale:.9}}
@keyframes forma-pulse{50%{scale:1.05}}
@keyframes forma-float{50%{translate:0 -10px}}
`;
export const SITE_REDUCED_CSS=`@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}*,*::before,*::after{animation:none!important;transition:none!important}.js [data-site-reveal]{opacity:1!important;translate:none!important;scale:none!important}}
`;
