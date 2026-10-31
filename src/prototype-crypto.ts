/** Password encryption for exported prototypes: AES-256-GCM, keyed by PBKDF2-SHA-256, through Web Crypto only.
 * This is encryption of the file, not a gate in the page: without the password the payload cannot be read.
 * It cannot help a person who has both the file and the password, and a weak password can be guessed offline. */
export const PROTOTYPE_PBKDF2_ITERATIONS=600_000,PROTOTYPE_PASSWORD_MIN=8,PROTOTYPE_PASSWORD_MAX=1024;
const MIN_ITERATIONS=100_000,MAX_ITERATIONS=10_000_000,SALT_BYTES=16,IV_BYTES=12,TAG_BYTES=16;
export interface PrototypeCipher {cipher:'AES-GCM';kdf:'PBKDF2';hash:'SHA-256';iterations:number;salt:string;iv:string;ciphertext:string;}
export class PrototypePasswordError extends Error {constructor(){super('That password does not open this prototype.');this.name='PrototypePasswordError';}}
export class PrototypeCryptoUnavailable extends Error {constructor(){super('This browser only offers encryption on secure pages. Open the file from https:// or directly from this device.');this.name='PrototypeCryptoUnavailable';}}
export const prototypeCryptoAvailable=()=>typeof crypto!=='undefined'&&!!crypto.subtle;
/** Chunked so a large payload does not overflow the argument list. */
export function bytesToBase64(bytes:Uint8Array){const chunks:string[]=[],size=3*8192;for(let at=0;at<bytes.length;at+=size)chunks.push(btoa(String.fromCharCode(...bytes.subarray(at,at+size))));return chunks.join('');}
export function base64ToBytes(value:string){if(!/^[A-Za-z0-9+/]*={0,2}$/.test(value)||value.length%4)throw Error('Invalid encoded data.');const raw=atob(value),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes;}
export function validatePrototypePassword(password:string){if(typeof password!=='string'||password.length<PROTOTYPE_PASSWORD_MIN||password.length>PROTOTYPE_PASSWORD_MAX)throw Error('Use a password of '+PROTOTYPE_PASSWORD_MIN+' to '+PROTOTYPE_PASSWORD_MAX+' characters.');return password;}
/** Composed form, so the same typed password works whichever keyboard or system entered it. */
const passwordBytes=(password:string)=>new TextEncoder().encode(password.normalize('NFC'));
/** Authenticated with the ciphertext, so changing the stored parameters fails decryption instead of weakening it. */
const parameters=(iterations:number)=>new TextEncoder().encode('forma-prototype:1:AES-GCM:PBKDF2:SHA-256:'+iterations);
const buffer=(bytes:Uint8Array):ArrayBuffer=>bytes.slice().buffer;
async function derive(password:string,salt:Uint8Array,iterations:number){const material=await crypto.subtle.importKey('raw',buffer(passwordBytes(password)),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:buffer(salt),iterations},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
export async function encryptPrototype(plaintext:string,password:string,iterations=PROTOTYPE_PBKDF2_ITERATIONS):Promise<PrototypeCipher>{
 if(!prototypeCryptoAvailable())throw new PrototypeCryptoUnavailable();validatePrototypePassword(password);if(!Number.isInteger(iterations)||iterations<MIN_ITERATIONS||iterations>MAX_ITERATIONS)throw Error('Invalid key derivation strength.');
 const salt=crypto.getRandomValues(new Uint8Array(SALT_BYTES)),iv=crypto.getRandomValues(new Uint8Array(IV_BYTES)),key=await derive(password,salt,iterations),sealed=await crypto.subtle.encrypt({name:'AES-GCM',iv:buffer(iv),additionalData:buffer(parameters(iterations)),tagLength:TAG_BYTES*8},key,buffer(new TextEncoder().encode(plaintext)));
 return {cipher:'AES-GCM',kdf:'PBKDF2',hash:'SHA-256',iterations,salt:bytesToBase64(salt),iv:bytesToBase64(iv),ciphertext:bytesToBase64(new Uint8Array(sealed))};
}
/** Refuses anything but the one supported shape before any work, including an iteration count chosen to stall the page. */
export function validatePrototypeCipher(value:unknown):PrototypeCipher{
 const c=value as PrototypeCipher;if(!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).some(k=>!['cipher','kdf','hash','iterations','salt','iv','ciphertext'].includes(k))||c.cipher!=='AES-GCM'||c.kdf!=='PBKDF2'||c.hash!=='SHA-256'||!Number.isInteger(c.iterations)||c.iterations<MIN_ITERATIONS||c.iterations>MAX_ITERATIONS||typeof c.salt!=='string'||typeof c.iv!=='string'||typeof c.ciphertext!=='string')throw Error('This protected prototype file is damaged.');
 let salt,iv,sealed;try{salt=base64ToBytes(c.salt);iv=base64ToBytes(c.iv);sealed=base64ToBytes(c.ciphertext);}catch{throw Error('This protected prototype file is damaged.');}if(salt.length!==SALT_BYTES||iv.length!==IV_BYTES||sealed.length<=TAG_BYTES)throw Error('This protected prototype file is damaged.');return c;
}
export async function decryptPrototype(value:unknown,password:string){
 const c=validatePrototypeCipher(value);if(!prototypeCryptoAvailable())throw new PrototypeCryptoUnavailable();if(typeof password!=='string'||!password.length||password.length>PROTOTYPE_PASSWORD_MAX)throw new PrototypePasswordError();
 const key=await derive(password,base64ToBytes(c.salt),c.iterations);let opened:ArrayBuffer;try{opened=await crypto.subtle.decrypt({name:'AES-GCM',iv:buffer(base64ToBytes(c.iv)),additionalData:buffer(parameters(c.iterations)),tagLength:TAG_BYTES*8},key,buffer(base64ToBytes(c.ciphertext)));}catch{throw new PrototypePasswordError();}
 return new TextDecoder('utf-8',{fatal:true}).decode(opened);
}
