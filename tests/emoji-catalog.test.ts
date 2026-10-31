import {describe,expect,it} from 'vitest';
import {node} from '../src/model';
import {colonEmojiToken,emojiCatalog,emojiWithTone,insertEmoji,searchEmoji,skinTones} from '../src/emoji';
import {EMOJI_DATA_UNICODE} from '../src/emoji-data';

const rgi=/^\p{RGI_Emoji}$/v,tones=skinTones.slice(1).map(t=>t[1]),byCode=(code:string)=>emojiCatalog.find(e=>e.code===code)!,find=(q:string,n=24)=>searchEmoji(q,n).map(e=>e.glyph);
describe('emoji catalog',()=>{
 it('covers real Unicode emoji with unique codes and glyphs',()=>{expect(emojiCatalog.length).toBeGreaterThan(1850);expect(EMOJI_DATA_UNICODE).toBe('17.0');expect(new Set(emojiCatalog.map(e=>e.code)).size).toBe(emojiCatalog.length);expect(new Set(emojiCatalog.map(e=>e.glyph)).size).toBe(emojiCatalog.length);});
 it('holds only sequences Unicode recommends, with no stray tone variants',()=>{for(const e of emojiCatalog){expect(rgi.test(e.glyph),e.code).toBe(true);expect(/[\u{1f3fb}-\u{1f3ff}]/u.test(e.glyph),e.code).toBe(false);}});
 it('proves every toneable entry for all five tones',()=>{const toneable=emojiCatalog.filter(e=>e.tone);expect(toneable.length).toBeGreaterThan(250);for(const e of toneable)for(const tone of tones)expect(rgi.test(emojiWithTone(e,tone)),e.code).toBe(true);});
 it('gives every entry a code the colon completion can reach',()=>{for(const e of emojiCatalog){expect(e.code,e.glyph).toMatch(/^[a-zA-Z0-9_+-]{1,40}$/);expect(colonEmojiToken(':'+e.code,e.code.length+1,e.code.length+1)?.query).toBe(e.code);}});
 it('keeps everyday short codes ahead of generated names',()=>{expect(byCode('rocket').glyph).toBe('🚀');expect(byCode('thumbsup').glyph).toBe('👍');expect(find('rocket')[0]).toBe('🚀');expect(find('heart')[0]).toBe('❤️');expect(searchEmoji('thumbsup')[0].code).toBe('thumbsup');expect(byCode('thumbsup').keywords).toContain('thumbs up sign');});
 it('finds flags, keycaps, subdivisions, new emoji, families and roles by plain words',()=>{expect(find('france')).toContain('🇫🇷');expect(find('romania')).toContain('🇷🇴');expect(find('flag jp')).toContain('🇯🇵');expect(find('keycap 7')).toContain('7️⃣');expect(find('england')).toContain('🏴󠁧󠁢󠁥󠁮󠁧󠁿');expect(find('orca')).toContain('🫍');expect(find('family',100)).toContain('👨‍👩‍👧‍👦');expect(find('astronaut')).toEqual(expect.arrayContaining(['👩‍🚀','👨‍🚀','🧑‍🚀']));expect(find('kiss woman man',100)).toContain('👩‍❤️‍💋‍👨');expect(find('red hair woman')).toContain('👩‍🦰');});
 it('matches colon spellings and spaced words alike and stays bounded',()=>{expect(find('flag_fra')).toContain('🇫🇷');expect(find(':woman_rocket:')).toContain('👩‍🚀');expect(find('woman rocket')).toContain('👩‍🚀');expect(searchEmoji('',1000).length).toBe(100);expect(searchEmoji('zzzzqq')).toEqual([]);expect(searchEmoji('a'.repeat(500)).length).toBe(0);});
});
describe('skin tones',()=>{
 const wave=byCode('wave'),coder=byCode('woman_technologist');
 it('inserts the modifier after the base, replacing a presentation selector',()=>{expect(emojiWithTone(wave,'\u{1f3fd}')).toBe('👋🏽');expect(emojiWithTone(coder,'\u{1f3ff}')).toBe('👩🏿‍💻');const selector=emojiCatalog.find(e=>e.tone&&[...e.glyph][1]==='️')!;expect(emojiWithTone(selector,'\u{1f3fb}').includes('️')).toBe(false);});
 it('leaves default and untoneable emoji alone and refuses unknown modifiers',()=>{expect(emojiWithTone(wave,'')).toBe('👋');expect(emojiWithTone(byCode('rocket'),'\u{1f3fd}')).toBe('🚀');expect(()=>emojiWithTone(wave,'x')).toThrow('skin tone');});
 it('inserts toned forms, and refuses anything outside the catalog',()=>{const n=node('text',{text:'Hi '});expect(insertEmoji(n,3,3,'👋🏽').text).toBe('Hi 👋🏽');expect(insertEmoji(n,3,3,'👩🏿‍💻').text).toBe('Hi 👩🏿‍💻');for(const bad of ['🚀🏽','x','<b>','😀😀',''])expect(()=>insertEmoji(n,3,3,bad),bad).toThrow('local catalog');});
});
