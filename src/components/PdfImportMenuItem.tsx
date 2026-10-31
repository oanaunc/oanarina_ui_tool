import {t} from '../i18n';
import {useLayoutEffect,useRef} from 'react';
import {captureColorContext,sameColorContext} from '../color-edit-context';
import {choosePdfImport} from '../pdf-import';
import {useEditor} from '../store';
type Proof={origin:ReturnType<typeof captureColorContext>;valid:boolean};
/** The receipt belongs to both this menu opening and the exact source session. */
export default function PdfImportMenuItem({current,close}:{current:()=>boolean;close:()=>void}){const s=useEditor(),live=useRef<Proof|null>(null);if(!live.current?.valid||!sameColorContext(live.current.origin,s))live.current={origin:captureColorContext(s),valid:true};const proof=live.current;
 useLayoutEffect(()=>{if(live.current===proof&&sameColorContext(proof.origin,useEditor.getState()))proof.valid=true;const off=useEditor.subscribe(next=>{if(!sameColorContext(proof.origin,next))proof.valid=false;});return()=>{proof.valid=false;off();};},[proof]);
 return <button role="menuitem" onKeyDown={e=>{if(e.key===' '||e.key==='Enter')e.stopPropagation();}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter')e.stopPropagation();}} onClick={()=>{if(!proof.valid||live.current!==proof||!current()||!sameColorContext(proof.origin,useEditor.getState()))return;close();choosePdfImport(proof.origin);}}><span>{t('Import PDF pages…')}</span><kbd/></button>;
}
