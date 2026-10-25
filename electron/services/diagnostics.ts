import os from 'node:os';import { executableExists } from './emulators.js';
export async function diagnostics(){const pi=os.platform()==='linux'&&os.arch()==='arm64';const retro=await executableExists(process.platform==='win32'?'retroarch.exe':'retroarch');return[
 {name:'Host',status:pi?'ok':'warning',detail:`${os.platform()} ${os.arch()}${pi?'':' — deploy to Raspberry Pi for hardware tests'}`},
 {name:'RetroArch',status:retro?'ok':'error',detail:retro?'Executable found':'Executable not found'},
 {name:'Memory',status:os.totalmem()>4e9?'ok':'warning',detail:`${(os.totalmem()/1073741824).toFixed(1)} GiB total`},
 {name:'Controller',status:'warning',detail:'Use Settings → Controller calibration on the cabinet; browser Gamepad events are device-specific'}]}
