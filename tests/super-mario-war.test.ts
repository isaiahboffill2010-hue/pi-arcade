import{describe,expect,it}from'vitest';
import{catalog}from'../src/catalog.js';
import{profiles}from'../src/data.js';

describe('Super Mario War integration',()=>{
 it('is gated behind a real native installation',()=>{const game=catalog.find(entry=>entry.id==='pc:super-mario-war');expect(game).toMatchObject({title:'Super Mario War',emulator:'native',installed:false,profileId:'super-mario-war',core:'super-mario-war'});expect(game?.source?.redistributable).toBe(false)});
 it('has game-specific cabinet instructions',()=>{const profile=profiles.find(entry=>entry.id==='super-mario-war');expect(profile?.bindings.map(binding=>binding.action)).toEqual(expect.arrayContaining(['Jump / Confirm','Turbo / Run / Fire / Pick up','Use stored item','Pause']));expect(profile?.bindings).toHaveLength(11)});
});
