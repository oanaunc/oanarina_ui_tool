import {useEffect,useState} from 'react';
import {listDocuments} from './repository';
export const FIRST_RUN_KEY='forma-first-run';
export type FirstRunState='pending'|'started'|'dismissed'|'existing';
const states:readonly FirstRunState[]=['pending','started','dismissed','existing'];
/** Null means no receipt. Corrupt data reads as finished so a damaged value cannot re-offer guidance forever. */
export function decodeFirstRun(raw:string|null):FirstRunState|null{if(raw===null)return null;try{const v=JSON.parse(raw);return v?.version===1&&states.includes(v.state)?v.state:'dismissed';}catch{return 'dismissed';}}
export const firstRunOffer=(receipt:FirstRunState|null,storedDocuments:number):FirstRunState=>receipt??(storedDocuments>0?'existing':'pending');
function write(state:FirstRunState){localStorage.setItem(FIRST_RUN_KEY,JSON.stringify({version:1,state}));}
/** Offered once per app origin. An offer that cannot be remembered is not made. */
export function useFirstRunOffer(){const [offered,setOffered]=useState(false);useEffect(()=>{let live=true;void(async()=>{try{const receipt=decodeFirstRun(localStorage.getItem(FIRST_RUN_KEY)),state=receipt??firstRunOffer(null,(await listDocuments()).length);if(receipt===null)write(state);if(live)setOffered(state==='pending');}catch{/* Blocked storage skips the offer; Help still has the tour. */}})();return()=>{live=false;};},[]);return {offered,finish:(state:'started'|'dismissed')=>{try{write(state);}catch{/* The offer still closes for this session. */}setOffered(false);}};}
