import {ChevronDown} from 'lucide-react';
import {commands,runCommand} from '../commands';
import {formatPercent,t} from '../i18n';
import {shortcutLabel,useKeyboardPreferences} from '../keyboard-preferences';
import {useEditor} from '../store';
const PERCENTS=[25,50,75,100,150,200,400],ACTIONS=[['in','zoom-in','Zoom in'],['out','zoom-out','Zoom out'],['fit','fit','Zoom to fit'],['selection','fit-selection','Zoom to selection']] as const;
/** The percent is the control: a native menu keeps Mac popup behavior and keyboard use with no extra overlay code. */
export default function ZoomControl(){const zoom=useEditor(v=>v.zoom),keyboard=useKeyboardPreferences(commands),value=Math.round(zoom*100),key=(id:string)=>{const c=commands.find(c=>c[0]===id);return c?shortcutLabel(c,keyboard):'';};
 return <label className="zoom-control"><select aria-label={t('Canvas zoom')} value={value} onChange={e=>{const v=e.target.value,action=ACTIONS.find(a=>a[0]===v);if(action)runCommand(action[1]);else useEditor.getState().setCamera({zoom:Number(v)/100});}}>{ACTIONS.map(([id,command,label])=><option key={id} value={id}>{t(label)+(key(command)?'  ·  '+key(command):'')}</option>)}<option disabled>──────</option>{!PERCENTS.includes(value)&&<option value={value}>{formatPercent(value)}</option>}{PERCENTS.map(v=><option key={v} value={v}>{formatPercent(v)}</option>)}</select><ChevronDown size={11} aria-hidden="true"/></label>;}
