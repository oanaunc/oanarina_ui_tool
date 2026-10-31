import {create} from 'zustand';
import {useEditor} from './store';
import type {AudioPlaybackState} from './prototype-audio-player';
export const MUSIC_LIMITS={bytes:100_000_000,seconds:600} as const;
const AUDIO_UNREADABLE='This audio file could not be read. Try an MP3, AAC, WAV, AIFF, FLAC or Ogg file.';
export interface MusicClip {duration:number;loop:boolean;volume:number;}
/** A session on this device only: the decoded track stays in memory, is never written to the document, and stops with the board. */
interface MusicState {name:string;media:MusicClip|null;playback:AudioPlaybackState;docId:string;error:string;}
const idle:AudioPlaybackState={phase:'stopped',position:0,error:''};
export const useWhiteboardMusic=create<MusicState>(()=>({name:'',media:null,playback:idle,docId:'',error:''}));
const belongs=()=>{const s=useEditor.getState(),m=useWhiteboardMusic.getState();return !s.home&&s.doc.id===m.docId&&s.doc.workspace==='whiteboard';};
let track:AudioBuffer|null=null,voice:{context:AudioContext;source:AudioBufferSourceNode;gain:GainNode;started:number;offset:number}|null=null,offset=0;
const position=()=>{const v=voice,m=useWhiteboardMusic.getState().media;if(!v||!m)return offset;const t=v.offset+v.context.currentTime-v.started;return m.loop?t%m.duration:Math.min(m.duration,t);};
function silence(){const v=voice;voice=null;if(!v)return;v.source.onended=null;try{v.source.stop();}catch{/* It may have ended already. */}v.source.disconnect();v.gain.disconnect();void v.context.close().catch(()=>{});}
const publish=(phase:AudioPlaybackState['phase'],error='')=>useWhiteboardMusic.setState({playback:{phase,position:offset,error}});
export async function chooseMusicFile(file:File){if(file.size>MUSIC_LIMITS.bytes)throw Error('Choose an audio file up to 100 MB.');let decoded:AudioBuffer;try{decoded=await new OfflineAudioContext(2,1,44100).decodeAudioData(await file.arrayBuffer());}catch{throw Error(AUDIO_UNREADABLE);}if(decoded.duration>MUSIC_LIMITS.seconds)throw Error('A music session plays tracks up to 10 minutes long.');silence();offset=0;track=decoded;useWhiteboardMusic.setState({name:file.name.slice(0,200),media:{duration:decoded.duration,loop:true,volume:.8},playback:idle,docId:useEditor.getState().doc.id,error:''});}
export async function playMusic(){const media=useWhiteboardMusic.getState().media;if(!media||!track||!belongs())return;silence();if(offset>=media.duration)offset=0;publish('loading');try{const context=new AudioContext(),source=context.createBufferSource(),gain=context.createGain();source.buffer=track;source.loop=media.loop;gain.gain.value=media.volume;source.connect(gain);gain.connect(context.destination);await context.resume();if(!belongs()||useWhiteboardMusic.getState().media===null){void context.close();return;}const started=context.currentTime;voice={context,source,gain,started,offset};source.onended=()=>{if(voice?.source===source){offset=0;silence();publish('stopped');}};source.start(0,offset);publish('playing');}catch{silence();publish('stopped','Audio playback is unavailable here.');}}
export function pauseMusic(){if(!voice)return;offset=position();silence();publish('paused');}
export function stopMusic(){silence();offset=0;useWhiteboardMusic.setState({playback:idle});}
/** Volume and loop apply to the running voice, so a change never restarts the track. */
export function setMusicOptions(patch:Partial<Pick<MusicClip,'loop'|'volume'>>){const media=useWhiteboardMusic.getState().media;if(!media)return;useWhiteboardMusic.setState({media:{...media,...patch}});if(voice){if(patch.volume!==undefined)voice.gain.gain.value=patch.volume;if(patch.loop!==undefined)voice.source.loop=patch.loop;}}
export function clearMusic(){stopMusic();track=null;useWhiteboardMusic.setState({name:'',media:null,docId:'',error:''});}
useEditor.subscribe(s=>{const m=useWhiteboardMusic.getState();if(m.media&&(s.home||s.doc.id!==m.docId))clearMusic();});
