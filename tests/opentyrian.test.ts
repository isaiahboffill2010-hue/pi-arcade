import{describe,expect,it}from'vitest';
import{readFile}from'node:fs/promises';
import{catalog}from'../src/catalog.js';
import{profiles}from'../src/data.js';

describe('OpenTyrian integration',()=>{
 it('requires a real native marker before becoming installed',()=>{expect(catalog.find(game=>game.id==='pc:opentyrian')).toMatchObject({installed:false,emulator:'native',core:'opentyrian',profileId:'opentyrian-6',pi5Expectation:'excellent'})});
 it('matches the engine default six-button order',()=>{const bindings=profiles.find(profile=>profile.id==='opentyrian-6')?.bindings.filter(binding=>binding.button!==undefined);expect(bindings?.map(binding=>[binding.physical,binding.button])).toEqual([['B1',0],['B2',1],['B3',2],['B4',3],['B5',4],['B6',5]])});
 it('forces fullscreen with aspect-correct scaling on Pi',async()=>{const installer=await readFile(new URL('../scripts/install-opentyrian-pi.sh',import.meta.url),'utf8');expect(installer).toContain("item fullscreen 0");expect(installer).toContain("item scaling_mode 'Fit 4:3'");expect(installer).toContain('"linuxExecutable":"opentyrian"')});
 it('does not pass RetroArch-only flags to native games',async()=>{const verifier=await readFile(new URL('../electron/services/verification.ts',import.meta.url),'utf8');expect(verifier).toContain("game.emulator==='retroarch'?[...spec.args,'--verbose']:spec.args")});
});
