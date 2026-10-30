import {useEffect,useState} from 'react';
import {videoDataInfo} from '../media';
/** Only validated embedded bytes become runtime Blob URLs. No remote media URLs. */
export function useVideoSource(data:string,enabled=true){const [current,setCurrent]=useState<{data:string;url:string}>();useEffect(()=>{if(!enabled)return;const info=videoDataInfo(data),raw=atob(info.payload),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)),source=URL.createObjectURL(new Blob([bytes],{type:info.mime}));setCurrent({data,url:source});return()=>URL.revokeObjectURL(source);},[data,enabled]);return enabled&&current?.data===data?current.url:undefined;}
