import {create} from 'zustand';
import {useEditor} from './store';
import {AUDIO_LIMITS,audioDataUrl,canonicalPcmWav} from './prototype-audio';
import type {PrototypeAudio} from './prototype-audio';
import {PrototypePcmPlayer} from './prototype-audio-player';
import type {AudioPlaybackState} from './prototype-audio-player';
/** A session on this device only: the clip stays in memory, is never written to the document, and stops with the board. */
interface MusicState {name:string;media:PrototypeAudio|null;playback:AudioPlaybackState;docId:string;error:string;}
const idle:AudioPlaybackState={phase:'stopped',position:0,error:''};
export const useWhiteboardMusic=create<MusicState>(()=>({name:'',media:null,playback:idle,docId:'',error:''}));
const belongs=()=>{const s=useEditor.getState(),m=useWhiteboardMusic.getState();return !s.home&&s.doc.id===m.docId&&s.doc.workspace==='whiteboard';};
let player:PrototypePcmPlayer|undefined;
const owned=()=>player??=new PrototypePcmPlayer(belongs,playback=>useWhiteboardMusic.setState({playback}));
export async function chooseMusicFile(file:File){if(file.size>AUDIO_LIMITS.bytes)throw Error('Choose a local PCM16 WAV up to 8 MB.');const {bytes,info}=canonicalPcmWav(new Uint8Array(await file.arrayBuffer())),media:PrototypeAudio={kind:'wav-pcm16',data:audioDataUrl(bytes),sampleRate:info.sampleRate,channels:info.channels,frames:info.frames,loop:true,volume:.8};owned().stop();useWhiteboardMusic.setState({name:file.name.slice(0,200),media,playback:idle,docId:useEditor.getState().doc.id,error:''});}
export function playMusic(){const media=useWhiteboardMusic.getState().media;if(media)void owned().play(media);}
export function pauseMusic(){const media=useWhiteboardMusic.getState().media;if(media)owned().pause(media);}
export function stopMusic(){player?.stop();useWhiteboardMusic.setState({playback:idle});}
/** Web Audio gain is fixed per voice, so a live change resumes from the same position with the new settings. */
export function setMusicOptions(patch:Partial<Pick<PrototypeAudio,'loop'|'volume'>>){const m=useWhiteboardMusic.getState(),media=m.media;if(!media)return;const next={...media,...patch},playing=m.playback.phase==='playing';if(playing)owned().pause(media);useWhiteboardMusic.setState({media:next});if(playing)void owned().play(next);}
export function clearMusic(){stopMusic();useWhiteboardMusic.setState({name:'',media:null,docId:'',error:''});}
useEditor.subscribe(s=>{const m=useWhiteboardMusic.getState();if(m.media&&(s.home||s.doc.id!==m.docId))clearMusic();});
