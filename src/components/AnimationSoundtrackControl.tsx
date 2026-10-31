import {useMemo,useRef} from 'react';
import {soundtrackAvailable} from '../animation-export';
import type {AnimationFormat} from '../animation-export';
import {attachedSoundtrack,pickedSoundtrack,soundtrackChoices} from '../animation-audio';
import type {AnimationSoundtrack} from '../animation-audio';
import type {DesignNode} from '../model';
import {AUDIO_LIMITS} from '../prototype-audio';
import {notifyError} from '../files';
import {useT} from '../i18n';
/** The picked sound lasts for this export session only; it is never written into the file. */
export default function AnimationSoundtrackControl({format,nodes,selection,value,onChange}:{format:AnimationFormat;nodes:DesignNode[];selection:string[];value:AnimationSoundtrack|null;onChange:(value:AnimationSoundtrack|null)=>void}){const t=useT(),input=useRef<HTMLInputElement>(null),choices=useMemo(()=>soundtrackChoices(nodes,selection),[nodes,selection]);if(!soundtrackAvailable(format))return format==='gif'?null:<span className="timeline-note">{t('Audio needs a newer macOS.')}</span>;const pick=async(file:File|undefined)=>{if(!file)return;try{if(file.size>AUDIO_LIMITS.bytes)throw Error('Prototype audio requires a local PCM16 little-endian WAV, mono/stereo, 8–48 kHz, up to 60 seconds and 8 MB.');onChange(pickedSoundtrack(file.name,new Uint8Array(await file.arrayBuffer())));}catch(error){notifyError(error);}};const current=value?choices.findIndex(c=>c.name===value.name):-1;return <><select aria-label={t('Animation soundtrack')} value={value?current>=0?String(current):'picked':'none'} onChange={e=>{const v=e.target.value;if(v==='none')onChange(null);else if(v==='pick'){input.current?.click();}else if(v!=='picked')onChange(attachedSoundtrack(choices[Number(v)]));}}><option value="none">{t('No sound')}</option>{choices.map((c,i)=><option key={c.id} value={i}>{c.name}</option>)}{value&&current<0&&<option value="picked">{value.name}</option>}<option value="pick">{t('Choose WAV…')}</option></select><input ref={input} hidden type="file" accept=".wav,audio/wav" aria-label={t('Choose animation soundtrack file')} onChange={e=>{void pick(e.target.files?.[0]);e.target.value='';}}/></>;}
