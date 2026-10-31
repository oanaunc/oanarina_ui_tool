import {disabledLibraryDefinitions} from '../library-lifecycle';
import type {DesignNode} from '../model';
import type {StrokeStyle} from '../paints';
import {useEditor} from '../store';
import {bindSelectedVariable} from '../design-system-actions';
import {strokeEntryBinding} from '../design-systems';
import {notifyError} from '../files';
import {t} from '../i18n';
/** Color and width tokens for one stack entry. The first entry's tokens stay in the layer's Design system fields. */
export default function StrokeEntryVariables({n,stroke,index}:{n:DesignNode;stroke:StrokeStyle;index:number}){
 const s=useEditor(),rows=([['stroke','color',t('color variable')],['strokeWidth','number',t('width variable')]] as const).flatMap(([kind,type,label])=>{const field=strokeEntryBinding(kind,stroke.id),bound=n.variableBindings?.[field],hidden=disabledLibraryDefinitions(s.doc).variables,vars=s.doc.variables?.filter(v=>v.type===type&&(!v.scopes.length||v.scopes.includes(kind))&&(!hidden.has(v.id)||v.id===bound))??[];return vars.length||bound?[{field,bound,vars,label,missing:!!bound&&!vars.some(v=>v.id===bound)}]:[];});
 if(!rows.length||!index&&!rows.some(r=>r.bound))return null;
 const bind=(field:ReturnType<typeof strokeEntryBinding>,id:string)=>{try{const live=useEditor.getState();live.edit(d=>{bindSelectedVariable(d,live.pageId,[n.id],field,id);});}catch(error){notifyError(error);}};
 return <div className="stroke-entry-variables">{rows.map(row=><label className="system-field" key={row.field}><span>{t('Stroke')} {index+1} {row.label}</span><select aria-label={`${t('Stroke')} ${index+1} ${row.label}`} disabled={s.motionOpen} value={row.bound??''} onChange={e=>bind(row.field,e.target.value)}><option value="">{t('Literal value')}</option>{row.missing&&<option value={row.bound}>{t('Missing variable')}</option>}{row.vars.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select>{row.missing&&<small role="status">{t('Variable missing; last value retained.')}</small>}</label>)}</div>;
}
