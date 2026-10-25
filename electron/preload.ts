import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('arcade',{platform:()=>ipcRenderer.invoke('platform'),diagnostics:()=>ipcRenderer.invoke('diagnostics'),scanLibrary:(paths:string[])=>ipcRenderer.invoke('scan-library',paths),launchGame:(game:unknown)=>ipcRenderer.invoke('launch-game',game)});
