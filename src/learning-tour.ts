import {create} from 'zustand';
import {useEditor} from './store';
import {captureLearningSession} from './learning-context';
import {learningCanFocus} from './learning-target';
import {learningTourSteps} from './editor-learning';
interface TourRequest{session:ReturnType<typeof captureLearningSession>;opener:HTMLElement|SVGSVGElement|null;}
interface TourState{entry:'overview'|'tool';request:TourRequest|null;step:{index:number};focusTicket:object;}
export const useLearningTour=create<TourState>(()=>({entry:'overview',request:null,step:{index:0},focusTicket:{}}));
export function openLearning(entry:TourState['entry']){useLearningTour.setState({entry});useEditor.getState().set({modal:'learning'});}
export function tourCurrent(request:TourRequest,step?:TourState['step']){const live=useLearningTour.getState(),s=useEditor.getState();return !!request&&live.request===request&&(!step||step===live.step)&&request.session.current()&&!s.modal&&!s.home&&!s.uiHidden&&!s.motionOpen&&s.mode==='design'&&s.doc.workspace!=='slides';}
export function startLearningTour(opener:TourRequest['opener']=document.activeElement as HTMLElement|null){const s=useEditor.getState();if(s.modal||s.home||s.uiHidden||s.motionOpen||s.mode!=='design'||s.doc.workspace==='slides')throw Error('Open a Design or Whiteboard document in Design mode with the interface visible and Motion closed.');const old=useLearningTour.getState().request;old?.session.dispose();let request:TourRequest|undefined;const session=captureLearningSession(()=>{if(request)stopLearningTour(request);});request={session,opener};useLearningTour.setState({request,step:{index:0},focusTicket:{}});return request;}
export function changeLearningStep(request:TourRequest,step:TourState['step'],index:number){if(!tourCurrent(request,step)||!Number.isInteger(index)||index<0||index>=learningTourSteps.length)return false;useLearningTour.setState({step:{index},focusTicket:{}});return true;}
export function stopLearningTour(request:TourRequest){if(useLearningTour.getState().request!==request)return false;request.session.dispose();useLearningTour.setState({request:null,focusTicket:{}});return true;}
/** A focus request is one-use, source/local owned and permanently cancelled by window blur. */
export function scheduleLearningFocus(current:()=>boolean,target:()=>HTMLElement|SVGSVGElement|null){let valid=true;const session=captureLearningSession(),blur=()=>{valid=false;};window.addEventListener('blur',blur,{once:true});const frame=requestAnimationFrame(()=>{try{if(valid&&session.current()&&current()&&document.hasFocus()){const element=target();if(element?.isConnected&&learningCanFocus(element))element.focus({preventScroll:true});}}finally{session.dispose();window.removeEventListener('blur',blur);}});return()=>{valid=false;cancelAnimationFrame(frame);session.dispose();window.removeEventListener('blur',blur);};}

export function finishLearningTour(request:TourRequest,step:TourState['step']){if(!tourCurrent(request,step))return;const opener=request.opener;stopLearningTour(request);const ticket=useLearningTour.getState().focusTicket;scheduleLearningFocus(()=>useLearningTour.getState().request===null&&useLearningTour.getState().focusTicket===ticket,()=>opener?.isConnected?opener:document.querySelector<SVGSVGElement>('#forma-design-canvas'));}
