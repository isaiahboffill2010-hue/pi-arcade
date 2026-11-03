import{readFile}from'node:fs/promises';import{describe,expect,it}from'vitest';
describe('Pi prepared-game discovery',()=>{it('scans the deployed library outside Downloads',async()=>{const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');expect(main).toContain("path.join(app.getPath('home'),'Arcade-Game-Library','Prepared-Games')")})});
