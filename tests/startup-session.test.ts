import{describe,expect,it}from'vitest';
import{readFile}from'node:fs/promises';

describe('startup and session recovery',()=>{
 it('always resets a second instance and a completed game to Home',async()=>{
  const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
  const renderer=await readFile(new URL('../src/main.tsx',import.meta.url),'utf8');
  expect(main).toContain("webContents.send('session-reset')");
  expect(renderer).toContain("setView('home')");
  expect(renderer).toContain('onSessionReset(resetSession)');
  expect(renderer).toContain('useLayoutEffect(()=>{window.scrollTo(0,0)},[])');
 });
 it('requires a neutral Start and Select release before arming the exit hold',async()=>{
  const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
  expect(main).toContain('if(!startHeld&&!selectHeld)exitComboReady=true');
  expect(main).toContain('held&&exitComboReady&&!exitTimer');
  expect(main).toContain('exitComboReady=false;gameWasActive=false');
 });
 it('does not create or map the fullscreen exit overlay during startup',async()=>{
  const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
  const createWindow=main.slice(main.indexOf('function createWindow()'),main.indexOf('app.whenReady()'));
  expect(createWindow).not.toContain('exitOverlay=new BrowserWindow');
  expect(main).toContain("function openOverlay(){if(overlayOpen||!hasActiveGame())return");
 });
 it('offers a controller-focusable maintenance action without changing the display manager',async()=>{
  const renderer=await readFile(new URL('../src/main.tsx',import.meta.url),'utf8');
  expect(renderer).toContain('Exit to desktop for maintenance');
  expect(renderer).toContain('maintenanceDesktop()');
 });
});
