import {useState} from 'react';
import {COLOR_PROFILES,validateColorProfile} from '../color-profile';
import type {DocumentColorProfile} from '../color-profile';
import {useEditor} from '../store';
/** Assigning keeps saved coordinates and changes appearance; it is one Undo step. sRGB is written back as absence so legacy files stay identical. */
export default function ColorProfileControl(){
 const s=useEditor(),profile=s.doc.colorProfile??'srgb',[error,setError]=useState('');
 const change=(value:DocumentColorProfile)=>{try{validateColorProfile(value);if(value===profile)return;s.edit(d=>{if(value==='srgb')delete d.colorProfile;else d.colorProfile=value;});setError('');}catch(e){setError(e instanceof Error?e.message:'The color profile could not be changed.');}};
 return <div className="file-information-profile"><label><span>Color profile</span><select aria-label="Document color profile" value={profile} onChange={e=>change(e.target.value as DocumentColorProfile)}>{COLOR_PROFILES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></label><small>{profile==='display-p3'?'Saved color values are Display P3 coordinates. PNG and JPG are tagged Display P3 and SVG uses CSS color(display-p3). PDF, GIF, video and clipboard PNG convert to sRGB.':'Saved color values are sRGB. Assigning Display P3 keeps the same values and renders them wider on capable displays.'}</small>{error&&<p className="file-information-error" role="alert">{error}</p>}</div>;
}
