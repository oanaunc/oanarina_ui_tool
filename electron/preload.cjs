const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
 save:(name,data,base64=false,saveAs=false)=>ipcRenderer.invoke('file:save',{name,data,base64,saveAs}),
 open:()=>ipcRenderer.invoke('file:open'),
 onCommand:fn=>{const cb=(_e,id)=>fn(id);ipcRenderer.on('command',cb);return()=>ipcRenderer.removeListener('command',cb);},
 onDocument:fn=>{const cb=(_e,raw)=>fn(raw);ipcRenderer.on('document',cb);return()=>ipcRenderer.removeListener('document',cb);}
});
