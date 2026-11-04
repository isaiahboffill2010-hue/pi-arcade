import{describe,expect,it}from'vitest';
import{readFile}from'node:fs/promises';

describe('live library refresh',()=>{
 it('reloads external scan results when the launcher regains focus or visibility',async()=>{
  const source=await readFile(new URL('../src/main.tsx',import.meta.url),'utf8');
  expect(source).toContain("window.addEventListener('focus',onFocus)");
  expect(source).toContain("document.addEventListener('visibilitychange',onVisibility)");
  expect(source).toContain("document.visibilityState==='visible'");
  expect(source).toContain("window.removeEventListener('focus',onFocus)");
  expect(source).toContain("document.removeEventListener('visibilitychange',onVisibility)");
  expect(source).toContain('current===request');
 });
});
