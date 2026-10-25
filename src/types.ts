export type VerificationState='not-tested'|'file-verified'|'launch-verified'|'input-verified'|'runtime-verified'|'hardware-tested'|'passed'|'failed'|'blocked';
export type Action='confirm'|'back'|'start'|'coin'|'exit'|'up'|'down'|'left'|'right'|'favorite';
export type Platform='Arcade'|'NES'|'SNES'|'Genesis'|'Sega CD'|'Neo Geo'|'PlayStation';
export type Genre='Fighting'|'Arcade Classics'|'Platform'|'Racing'|'Shooting'|'Puzzle'|'Sports'|'Action'|'Beat em up';
export interface Binding{physical:string;action:string;retroPad?:string;button?:number;key?:string}
export interface ControlProfile{id:string;style:string;bindings:Binding[];exitCombo:{actions:Action[];holdMs:number};notes:string[];verified:VerificationState;maxPlayers:number;limitations?:string[]}
export interface Game{id:string;title:string;platform:Platform;genre:Genre;description:string;emulator:string;core:string;filePath?:string;installed:boolean;favorite:boolean;profileId:string;verification:VerificationState;year?:number;manufacturer?:string;aliases?:string[];lastPlayed?:string;playCount?:number;source?:ContentSource;romSet?:string;romSetVersion?:string;bios?:string[];players?:number;gameplayButtons?:number;joystick?:'digital'|'analog'|'dual-stick'|'wheel'|'trackball'|'light-gun';pi5Expectation?:'excellent'|'good'|'variable'|'unsupported';hardwareNotes?:string[]}
export interface ContentSource{url:string;license:string;version:string;sha256?:string;redistributable:boolean}
export interface Diagnostic{name:string;status:'ok'|'warning'|'error';detail:string}
export interface LaunchResult{ok:boolean;error?:string;pid?:number;logPath?:string}
export interface TestResult{id:string;gameId:string;stage:string;state:VerificationState;timestamp:string;detail:string;durationMs?:number;versions?:Record<string,string>}
export interface ControllerConfig{id:string;gamepadId:string;mapping:Record<Action,number|string>;physicalMapping?:Record<string,number|string>;deadzone:number;repeatDelayMs:number;repeatRateMs:number;exitHoldMs:number}
export interface Settings{volume:number;muted:boolean;videoDriver:string;audioDriver:string;integerScale:boolean;autosave:boolean;showUninstalled:boolean;libraryPaths:string[];controller?:ControllerConfig}
export interface AppState{games:Game[];settings:Settings;recentIds:string[];testResults:TestResult[]}
export interface ArcadeApi{loadState:()=>Promise<AppState>;saveSettings:(settings:Settings)=>Promise<AppState>;toggleFavorite:(id:string)=>Promise<AppState>;scanLibrary:(paths:string[])=>Promise<AppState>;launchGame:(id:string)=>Promise<LaunchResult>;diagnostics:()=>Promise<Diagnostic[]>;runVerification:(id?:string)=>Promise<TestResult[]>;exportData:()=>Promise<{ok:boolean;path?:string}>;importData:()=>Promise<AppState|undefined>;saveController:(controller:ControllerConfig)=>Promise<AppState>;platform:()=>Promise<{platform:string;arch:string}>;onGameExited:(callback:(id:string)=>void)=>()=>void;}
declare global{interface Window{arcade?:ArcadeApi}}
