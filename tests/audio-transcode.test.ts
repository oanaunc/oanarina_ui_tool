import {describe,expect,it} from 'vitest';
import {AUDIO_LIMITS,canonicalPcmWav,inspectPcmWav} from '../src/prototype-audio';
import {audioTargetRate,encodePcm16Wav,localAudioClip} from '../src/audio-transcode';
describe('saved audio',()=>{
 it('writes canonical PCM16 that the strict reader accepts, clipping out of range samples',()=>{const left=Float32Array.from([0,1,-1,2]),right=Float32Array.from([.5,-.5,0,-2]),bytes=encodePcm16Wav([left,right],44100),info=inspectPcmWav(bytes,true);expect(info).toMatchObject({sampleRate:44100,channels:2,frames:4});const v=new DataView(bytes.buffer,44);expect(v.getInt16(4,true)).toBe(32767);expect(v.getInt16(8,true)).toBe(-32768);expect(v.getInt16(12,true)).toBe(32767);expect(v.getInt16(14,true)).toBe(-32768);});
 it('keeps the source rate when the clip fits and lowers it only as far as the budget needs',()=>{expect(audioTargetRate(44100,2,10)).toBe(44100);expect(audioTargetRate(96000,2,1)).toBe(AUDIO_LIMITS.maxRate);const rate=audioTargetRate(48000,2,60);expect(rate).toBeLessThan(48000);expect(rate*2*2*60+44).toBeLessThanOrEqual(AUDIO_LIMITS.bytes);expect(audioTargetRate(44100,1,60)).toBe(44100);});
 it('takes a plain WAV without touching the decoder',async()=>{const bytes=encodePcm16Wav([new Float32Array(8000)],8000),out=await localAudioClip(bytes.buffer.slice(0) as ArrayBuffer);expect(out.transcoded).toBe(false);expect(out.info.frames).toBe(8000);expect(canonicalPcmWav(out.bytes).info.sampleRate).toBe(8000);});
});
