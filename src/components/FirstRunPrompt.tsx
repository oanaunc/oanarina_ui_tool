import {useFirstRunOffer} from '../first-run';
import {notifyError} from '../files';
import {startLearningTour} from '../learning-tour';
import {useEditor} from '../store';
/** Inline in the menu bar: never a modal, never takes focus and never covers the canvas. */
export default function FirstRunPrompt(){const {offered,finish}=useFirstRunOffer(),s=useEditor(),ready=!s.modal&&!s.home&&!s.uiHidden&&!s.motionOpen&&s.mode==='design'&&s.doc.workspace!=='slides';if(!offered||!ready)return null;return <div className="first-run-prompt" role="group" aria-label="First run tour offer"><span>New to Forma?</span><button onClick={e=>{try{startLearningTour(e.currentTarget);finish('started');}catch(error){notifyError(error);}}}>Take the canvas tour</button><button aria-label="Dismiss the canvas tour offer" onClick={()=>finish('dismissed')}>Not now</button></div>;}
