import type {WrapRange} from './text-wrap';
const segmenter=(granularity:'grapheme'|'word')=>typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity}):undefined,clusters=segmenter('grapheme'),words=segmenter('word');
export function graphemes(text:string){return clusters?Array.from(clusters.segment(text),s=>s.segment):Array.from(text);}
/** Spaces a line may end on. No-break spaces and joiners are left out, so they hold their neighbors together. */
const SPACE=/^[ \t  -  -  　]+$/u;
const GLUE=/[  ‑ ⁠﻿]/u;
/** Ideographs, kana and full-width forms take a break on either side. Hangul is left out: Korean lines break between words. */
const WIDE=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Bopomofo}\p{Script=Yi}\p{Emoji_Presentation}　-〿！-ﾟ]/u;
/** Closing marks, CJK punctuation, small kana, iteration and prolonged sound marks, which may not start a line. */
const NO_START=/^[\p{Pe}\p{Pf}!%,.:;?'"/\-‐–·°¢‰‱′″‴℃℉…‥‼⁇⁈⁉、。，．：；！？％～〜゠・ーｰ々〻ゝゞヽヾ〆゛゜ぁぃぅぇぉっゃゅょゎゕゖァィゥェォッャュョヮヵヶㇰ-ㇿｧ-ｯ｡､｣･ﾞﾟ]/u;
/** Opening marks and currency signs, which stay with what follows. */
const NO_END=/[\p{Ps}\p{Pi}'"$£¥€₩￥＄￡￦]$/u;
const COMPLEX=/[\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
/** Thai and its neighbors write no spaces between words, so a line can only end where a dictionary finds one. */
function wordEnds(text:string){const ends=new Set<number>();if(words&&COMPLEX.test(text))for(const s of words.segment(text))ends.add(s.index);return ends;}
function breakAllowed(prior:string|undefined,a:string,b:string,offset:number,ends:Set<number>){if(GLUE.test(a)||GLUE.test(b))return false;if(a==='​')return true;if(NO_START.test(b)||NO_END.test(a))return false;if(COMPLEX.test(a)&&COMPLEX.test(b))return ends.has(offset);if(a==='–'||a==='‐')return true;if(a==='-'||a==='/')return prior!==undefined&&!SPACE.test(prior)&&!/\p{Nd}/u.test(b);if(a==='—'||a==='―'||b==='—'||b==='―')return a!==b;return WIDE.test(a)||WIDE.test(b);}
/** A paragraph cut wherever a line may end. Follows the common Unicode line breaking rules, with East Asian kinsoku; a run of spaces is its own piece. */
export function lineBreakTokens(text:string):string[]{if(!/[^\x20-\x2c\x2e\x30-\x7e]/.test(text))return text.match(/ +|[^ ]+/g)??[''];const parts=graphemes(text),ends=wordEnds(text),tokens:string[]=[];let token='',at=0;for(let i=0;i<parts.length;i++){const part=parts[i];if(token){const before=parts[i-1],space=SPACE.test(part);if(SPACE.test(before)!==space||!space&&breakAllowed(parts[i-2],before,part,at,ends)){tokens.push(token);token='';}}token+=part;at+=part.length;}tokens.push(token);return tokens;}
/** The pieces that hold words, for wrapping that weighs where each line ends. */
export function lineBreakUnits(text:string):WrapRange[]{const units:WrapRange[]=[];let at=0;for(const token of lineBreakTokens(text)){if(token.trim())units.push({from:at,to:at+token.length});at+=token.length;}return units;}
