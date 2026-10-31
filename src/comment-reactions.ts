import {emojiName,knownEmoji} from './emoji';
/** Bounded file-local reactions from the local emoji catalog; names are labels, not authenticated identities. */
export const COMMENT_REACTION_CHOICES=[{emoji:'👍',name:'Thumbs up'},{emoji:'❤️',name:'Heart'},{emoji:'🎉',name:'Celebrate'},{emoji:'👀',name:'Eyes'},{emoji:'✅',name:'Check'},{emoji:'💡',name:'Idea'},{emoji:'👏',name:'Clap'},{emoji:'🤔',name:'Thinking'}] as const;
export interface CommentReaction {emoji:string;authors:string[];}
export const COMMENT_REACTION_GROUPS=24;
export const reactionName=(emoji:string)=>COMMENT_REACTION_CHOICES.find(c=>c.emoji===emoji)?.name??emojiName(emoji);
export interface ReactionBudget {groups:number;authors:number;}
const controls=/[\u0000-\u001f\u007f-\u009f]/;
export function validateCommentReactions(value:unknown,budget:ReactionBudget){
 if(value===undefined)return;
 if(!Array.isArray(value)||!value.length||value.length>COMMENT_REACTION_GROUPS)throw Error('Use 1–24 local comment reactions, or omit reactions.');
 const seen=new Set<string>();
 for(const r of value){
  if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).some(k=>!['emoji','authors'].includes(k))||!knownEmoji(r.emoji)||seen.has(r.emoji)||!Array.isArray(r.authors)||!r.authors.length||r.authors.length>50)throw Error('Invalid local comment reaction (up to 50 distinct display names per emoji).');
  seen.add(r.emoji);if(++budget.groups>20_000)throw Error('Too many local comment reaction groups (20,000 per file).');const authors=new Set<string>();
  for(const author of r.authors){if(typeof author!=='string'||!author.length||author.length>120||author.trim()!==author||controls.test(author)||authors.has(author))throw Error('Invalid or duplicated local reaction display name.');authors.add(author);if(++budget.authors>100_000)throw Error('Too many local reaction display names (100,000 per file).');}
 }
}
export function toggledCommentReactions(current:CommentReaction[]|undefined,emoji:string,author:string):CommentReaction[]|undefined{
 if(!knownEmoji(emoji))throw Error('Choose an emoji from the local catalog.');
 const next=(current??[]).map(r=>({...r,authors:[...r.authors]})),existing=next.find(r=>r.emoji===emoji);
 if(existing){const i=existing.authors.indexOf(author);if(i>=0){existing.authors.splice(i,1);if(!existing.authors.length)next.splice(next.indexOf(existing),1);}else{if(existing.authors.length>=50)throw Error('This reaction already has 50 local display names.');existing.authors.push(author);}}
 else{if(next.length>=COMMENT_REACTION_GROUPS)throw Error('This comment already has 24 different reactions.');next.push({emoji,authors:[author]});}
 return next.length?next:undefined;
}
