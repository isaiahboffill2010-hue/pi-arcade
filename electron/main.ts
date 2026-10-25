import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanLibrary } from './services/library.js';
import { diagnostics } from './services/diagnostics.js';
import { launchGame } from './services/launcher.js';
const here=path.dirname(fileURLToPath(import.meta.url));
function createWindow(){const win=new BrowserWindow({fullscreen:process.env.NODE_ENV==='production',autoHideMenuBar:true,backgroundColor:'#080914',webPreferences:{preload:path.join(here,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});const dev=process.env.VITE_DEV_SERVER_URL;if(dev)void win.loadURL(dev);else void win.loadFile(path.join(here,'../dist/index.html'));}
app.whenReady().then(()=>{ipcMain.handle('platform',()=>({platform:process.platform,arch:process.arch}));ipcMain.handle('diagnostics',diagnostics);ipcMain.handle('scan-library',async(_e,paths:string[])=>{if(!paths.length){const r=await dialog.showOpenDialog({properties:['openDirectory']});paths=r.filePaths}return scanLibrary(paths)});ipcMain.handle('launch-game',(_e,game)=>launchGame(game));createWindow()});
app.on('window-all-closed',()=>app.quit());
