import { access } from 'node:fs/promises';import path from 'node:path';
export interface CommandSpec{command:string;args:string[]}
const coreByPlatform:Record<string,string>={NES:'mesen_libretro.so',SNES:'snes9x_libretro.so',Genesis:'genesis_plus_gx_libretro.so',PlayStation:'pcsx_rearmed_libretro.so','Arcade / disc':'fbneo_libretro.so',Arcade:'fbneo_libretro.so'};
export function retroArchCommand(game:{platform:string;filePath:string}):CommandSpec{if(!path.isAbsolute(game.filePath))throw new Error('Game path must be absolute');const core=coreByPlatform[game.platform];if(!core)throw new Error(`Unsupported platform: ${game.platform}`);return{command:'retroarch',args:['--fullscreen','--libretro',path.join(process.env.HOME??'', '.config/retroarch/cores',core),game.filePath]}}
export async function executableExists(name:string){const dirs=(process.env.PATH??'').split(path.delimiter);for(const dir of dirs){try{await access(path.join(dir,name));return true}catch{continue}}return false}
