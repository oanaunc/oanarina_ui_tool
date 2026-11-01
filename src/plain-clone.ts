/** Documents are plain data, and copying them by hand is several times faster than structuredClone, which also re-copies every image string. Anything else falls back to it. */
export function plainClone<T>(value:T):T{
 if(typeof value!=='object'||value===null)return value;
 if(Array.isArray(value)){const out=new Array(value.length);for(let i=0;i<value.length;i++)out[i]=plainClone(value[i]);return out as T;}
 const prototype=Object.getPrototypeOf(value);if(prototype!==Object.prototype&&prototype!==null)return structuredClone(value);
 const out:Record<string,unknown>={};for(const key in value as Record<string,unknown>)out[key]=plainClone((value as Record<string,unknown>)[key]);return out as T;
}
/** Equal as they would save: a field holding undefined counts as absent, and the first difference ends the comparison. */
export function savedEqual(a:unknown,b:unknown):boolean{
 if(a===b)return true;if(typeof a!=='object'||typeof b!=='object'||a===null||b===null)return false;
 if(Array.isArray(a)){if(!Array.isArray(b)||a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(!savedEqual(a[i]??null,b[i]??null))return false;return true;}
 if(Array.isArray(b))return false;const x=a as Record<string,unknown>,y=b as Record<string,unknown>;
 for(const key in x)if(x[key]!==undefined&&!savedEqual(x[key],y[key]))return false;
 for(const key in y)if(y[key]!==undefined&&x[key]===undefined)return false;return true;
}
