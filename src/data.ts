import type { ControlProfile, Game } from './types';
export const profiles:ControlProfile[]=[
 {id:'classic-one',style:'Joystick + 1 button',bindings:[{physical:'Joystick',action:'Move'},{physical:'B1',action:'Action'},{physical:'Start',action:'Start'},{physical:'Select',action:'Coin'}],exitCombo:{actions:['start','coin'],holdMs:2000},notes:['Hold Start + Coin for 2 seconds to exit.'],verified:'not-tested'},
 {id:'platform-two',style:'Joystick + 2 buttons',bindings:[{physical:'Joystick',action:'Move'},{physical:'B1',action:'Jump'},{physical:'B2',action:'Run / Attack'},{physical:'Start',action:'Start'},{physical:'Select',action:'Select'}],exitCombo:{actions:['start','coin'],holdMs:2000},notes:[],verified:'not-tested'},
 {id:'fighter-six',style:'Six-button fighter',bindings:[{physical:'Joystick',action:'Move'},{physical:'B1',action:'Light Punch'},{physical:'B2',action:'Medium Punch'},{physical:'B3',action:'Heavy Punch'},{physical:'B4',action:'Light Kick'},{physical:'B5',action:'Medium Kick'},{physical:'B6',action:'Heavy Kick'}],exitCombo:{actions:['start','coin'],holdMs:2000},notes:['Per-game overrides may replace this generic layout.'],verified:'not-tested'}
];
export const catalog:Game[]=[
 {id:'content-demo',title:'Import a Game',platform:'Any supported platform',genre:'Setup',description:'Add legally obtained ROMs from Settings → Import Library.',emulator:'auto',installed:false,favorite:false,profileId:'classic-one',verification:'not-tested'}
];
