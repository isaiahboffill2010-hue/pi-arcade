export type VerificationState = 'not-tested'|'file-verified'|'launch-verified'|'input-verified'|'runtime-verified'|'hardware-tested'|'passed'|'failed'|'blocked';
export type Action = 'confirm'|'back'|'start'|'coin'|'exit'|'up'|'down'|'left'|'right';
export interface Binding { physical: string; action: string; button?: number; key?: string }
export interface ControlProfile { id:string; style:string; bindings:Binding[]; exitCombo:{actions:Action[];holdMs:number}; notes:string[]; verified:VerificationState }
export interface Game { id:string; title:string; platform:string; genre:string; description:string; emulator:string; filePath?:string; installed:boolean; favorite:boolean; profileId:string; verification:VerificationState }
export interface Diagnostic { name:string; status:'ok'|'warning'|'error'; detail:string }
export interface LaunchResult { ok:boolean; error?:string; pid?:number }
export interface ArcadeApi { scanLibrary:(paths:string[])=>Promise<Game[]>; launchGame:(game:Game)=>Promise<LaunchResult>; diagnostics:()=>Promise<Diagnostic[]>; platform:()=>Promise<{platform:string;arch:string}> }
declare global { interface Window { arcade?: ArcadeApi } }
