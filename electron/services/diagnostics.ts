import os from'node:os';import{executablePath}from'./emulators.js';
export async function diagnostics(){const pi=os.platform()==='linux'&&os.arch()==='arm64';const retro=await executablePath();return[
 {name:'Host',status:pi?'ok' as const:'warning' as const,detail:`${os.platform()} ${os.arch()}${pi?'':' — deploy to Raspberry Pi for hardware tests'}`},
 {name:'RetroArch',status:retro?'ok' as const:'error' as const,detail:retro??'Executable not found'},
 {name:'Memory',status:os.totalmem()>4e9?'ok' as const:'warning' as const,detail:`${(os.totalmem()/1073741824).toFixed(1)} GiB total`},
 {name:'Display session',status:process.env.WAYLAND_DISPLAY||process.env.DISPLAY?'ok' as const:'warning' as const,detail:process.env.WAYLAND_DISPLAY?'Wayland':process.env.DISPLAY?'X11':'No Linux display session on this host'},
 {name:'Controller',status:'warning' as const,detail:'Use Controller Test to calibrate the cabinet; button indices are device-specific'}]}
