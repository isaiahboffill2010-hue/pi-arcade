import{randomBytes}from'node:crypto';
export type PhoneControl='up'|'down'|'left'|'right'|'a'|'b'|'x'|'y'|'l'|'r'|'start'|'select';
export interface PhoneClient{token:string;slot:number;connected:boolean;expiresAt:number;lastSeen:number;held:Set<PhoneControl>}
export class PhoneSessions{
 private clients=new Map<string,PhoneClient>();private slots=new Map<number,string>();
 constructor(readonly maxSlots=4,readonly graceMs=15000){}
 claim(requested?:number,token?:string,now=Date.now()){this.sweep(now);if(token){const old=this.clients.get(token);if(old&&(!old.connected||old.expiresAt>now)){old.connected=true;old.expiresAt=0;old.lastSeen=now;return old}}
  const slot=requested&&requested>=1&&requested<=this.maxSlots&&!this.slots.has(requested)?requested:[...Array(this.maxSlots)].findIndex((_,i)=>!this.slots.has(i+1))+1;if(slot<1||slot>this.maxSlots)return undefined;
  const next:PhoneClient={token:randomBytes(18).toString('base64url'),slot,connected:true,expiresAt:0,lastSeen:now,held:new Set()};this.clients.set(next.token,next);this.slots.set(slot,next.token);return next}
 get(token:string){return this.clients.get(token)}
 touch(token:string,now=Date.now()){const c=this.clients.get(token);if(c){c.lastSeen=now;c.connected=true}return c}
 disconnect(token:string,now=Date.now()){const c=this.clients.get(token);if(c){c.connected=false;c.expiresAt=now+this.graceMs;c.held.clear()}return c}
 release(token:string){const c=this.clients.get(token);if(!c)return;this.clients.delete(token);if(this.slots.get(c.slot)===token)this.slots.delete(c.slot)}
 sweep(now=Date.now()){for(const c of this.clients.values())if(!c.connected&&c.expiresAt<=now)this.release(c.token)}
 snapshot(){return[...this.clients.values()].map(c=>({slot:c.slot,connected:c.connected})).sort((a,b)=>a.slot-b.slot)}
}
export const phonePlayerLimit=(game?:{id:string;players?:number;platform?:string})=>{if(!game)return 4;if(game.platform==='Nintendo 64')return 1;const verified:Record<string,number>={'genesis:street-fighter-ii-special-champion-edition':2,'snes:nba-jam':2,'snes:super-bomberman-5':2,'snes:super-mario-kart':2};return verified[game.id]??1};
