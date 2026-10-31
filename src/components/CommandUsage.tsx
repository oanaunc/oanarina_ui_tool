import {useMemo,useSyncExternalStore} from 'react';
import {useEditor} from '../store';
import {commands,runCommand} from '../commands';
import {shortcutLabel,useKeyboardPreferences} from '../keyboard-preferences';
import {clearCommandUsage,commandTips,frequentCommands,getCommandUsage,setCommandLearning,subscribeCommandUsage} from '../command-usage';
import './local-tools.css';
export default function CommandUsage(){
 const s=useEditor(),usage=useSyncExternalStore(subscribeCommandUsage,getCommandUsage),keyboard=useKeyboardPreferences(commands),rows=useMemo(()=>commands.map(c=>[c[0],c[1],c[2],shortcutLabel(c,keyboard)] as const),[keyboard]),ids=useMemo(()=>rows.map(r=>r[0] as string),[rows]),frequent=useMemo(()=>frequentCommands(usage,ids,10),[usage,ids]),tips=useMemo(()=>commandTips(usage,rows),[usage,rows]),label=(id:string)=>rows.find(r=>r[0]===id)?.[1]??id,total=Object.values(usage.commands).reduce((sum,c)=>sum+c.runs,0);
 return <div className="local-tool command-usage">
  <p className="dialog-description">When this is on, Forma counts which commands you run so it can surface them in Actions and suggest shortcuts. Counts stay on this device, hold command names and tallies only, and never include your work.</p>
  <label className="check-row"><input aria-label="Learn from command use" type="checkbox" checked={usage.enabled} onChange={e=>setCommandLearning(e.target.checked)}/>Learn from my command use on this device</label>
  <p role="status">{usage.enabled?total+' commands counted.':total?'Learning is off. '+total+' earlier counts are kept until you clear them.':'Learning is off. Nothing is being counted.'}</p>
  <section aria-label="Frequently used commands"><h3>Frequently used</h3>{frequent.length?<ul className="tool-list">{frequent.map(id=><li key={id}><span>{label(id)}</span><small>{usage.commands[id].runs} runs</small><button onClick={()=>{s.set({modal:null});runCommand(id);}}>Run</button></li>)}</ul>:<p className="small-note">Commands appear here after three runs. These also appear at the top of Actions.</p>}</section>
  <section aria-label="Shortcut suggestions"><h3>Suggestions</h3>{tips.length?<ul className="tool-list">{tips.map(t=><li key={t.id}><span>{t.kind==='use-shortcut'?<>You ran <strong>{t.label}</strong> {t.runs} times, mostly without its shortcut <kbd>{t.shortcut}</kbd>.</>:<><strong>{t.label}</strong> has no shortcut and you ran it {t.runs} times.</>}</span>{t.kind==='assign-shortcut'&&<button onClick={()=>s.set({modal:'preferences'})}>Open Preferences</button>}</li>)}</ul>:<p className="small-note">No suggestions yet. A tip needs five runs of a command that has a shortcut, or ten of one that has none.</p>}</section>
  <div className="button-row"><button disabled={!Object.keys(usage.commands).length} onClick={clearCommandUsage}>Clear counts</button></div>
 </div>;
}
