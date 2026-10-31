/**
 * The character each physical key types on a named layout. Shortcuts then follow the letter printed on the key,
 * with Option held too, which a reported `key` cannot show. Keys a table leaves out keep their US position, so
 * punctuation shortcuts stay reachable on layouts that hide those symbols behind Option.
 */
export const namedKeyboardLayouts={
 qwertz:{label:'QWERTZ (German, Central European)',keys:{KeyY:'z',KeyZ:'y'}},
 azerty:{label:'AZERTY (French, Belgian)',keys:{KeyA:'q',KeyQ:'a',KeyW:'z',KeyZ:'w',Semicolon:'m',KeyM:','}},
 dvorak:{label:'Dvorak',keys:{KeyQ:"'",KeyW:',',KeyE:'.',KeyR:'p',KeyT:'y',KeyY:'f',KeyU:'g',KeyI:'c',KeyO:'r',KeyP:'l',BracketLeft:'/',BracketRight:'=',KeyS:'o',KeyD:'e',KeyF:'u',KeyG:'i',KeyH:'d',KeyJ:'h',KeyK:'t',KeyL:'n',Semicolon:'s',Quote:'-',KeyZ:';',KeyX:'q',KeyC:'j',KeyV:'k',KeyB:'x',KeyN:'b',Comma:'w',Period:'v',Slash:'z',Minus:'[',Equal:']'}},
 colemak:{label:'Colemak',keys:{KeyE:'f',KeyR:'p',KeyT:'g',KeyY:'j',KeyU:'l',KeyI:'u',KeyO:'y',KeyP:';',KeyS:'r',KeyD:'s',KeyF:'t',KeyG:'d',KeyJ:'n',KeyK:'e',KeyL:'i',Semicolon:'o',KeyN:'k'}},
} as const satisfies Record<string,{label:string;keys:Record<string,string>}>;
export type NamedKeyboardLayout=keyof typeof namedKeyboardLayouts;
export const namedLayoutKey=(layout:string,code:string|undefined)=>Object.hasOwn(namedKeyboardLayouts,layout)&&code?(namedKeyboardLayouts[layout as NamedKeyboardLayout].keys as Record<string,string>)[code]:undefined;
export const isNamedKeyboardLayout=(layout:unknown):layout is NamedKeyboardLayout=>typeof layout==='string'&&Object.hasOwn(namedKeyboardLayouts,layout);
