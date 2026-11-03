export type VerificationState='not-tested'|'file-verified'|'launch-verified'|'input-verified'|'runtime-verified'|'hardware-tested'|'passed'|'failed'|'blocked';
export type Action='confirm'|'back'|'start'|'coin'|'exit'|'up'|'down'|'left'|'right'|'favorite';
export type Platform='Arcade'|'Atari 2600'|'NES'|'SNES'|'Genesis'|'Sega CD'|'Neo Geo'|'PlayStation'|'Game Boy'|'Game Boy Color'|'GBA'|'Nintendo DS'|'Nintendo 64'|'PC'|'MUGEN';
export type Genre='Fighting'|'Arcade Classics'|'Platform'|'Racing'|'Shooting'|'Puzzle'|'Sports'|'Action'|'Beat em up';
export interface Binding{physical:string;action:string;retroPad?:string;button?:number;key?:string}
export type PhysicalControl='UP'|'DOWN'|'LEFT'|'RIGHT'|'B1'|'B2'|'B3'|'B4'|'B5'|'B6'|'B7'|'B8'|'START'|'SELECT';
export type PhysicalInput={kind:'gamepad-button';index:number}|{kind:'gamepad-axis';axis:number;direction:-1|1}|{kind:'keyboard';code:string};
export interface GameInputBinding{physical:PhysicalControl;action:string;retroPad?:string;targetKey?:string}
export interface GameInputProfile{gameId:string;templateId:string;adapter:'retroarch'|'mame'|'fbneo'|'standalone-keyboard';bindings:GameInputBinding[];updatedAt:string}
export interface ControlProfile{id:string;style:string;bindings:Binding[];exitCombo:{actions:Action[];holdMs:number};notes:string[];verified:VerificationState;maxPlayers:number;limitations?:string[]}
export interface Game{id:string;title:string;platform:Platform;genre:Genre;description:string;emulator:string;core:string;filePath?:string;artworkPath?:string;workingDirectory?:string;launchArgs?:string[];installed:boolean;favorite:boolean;profileId:string;verification:VerificationState;year?:number;manufacturer?:string;aliases?:string[];lastPlayed?:string;playCount?:number;source?:ContentSource;romSet?:string;romSetVersion?:string;bios?:string[];players?:number;gameplayButtons?:number;joystick?:'digital'|'analog'|'dual-stick'|'wheel'|'trackball'|'light-gun';pi5Expectation?:'excellent'|'good'|'variable'|'unsupported';hardwareNotes?:string[]}
export interface ContentSource{url:string;license:string;version:string;sha256?:string;redistributable:boolean}
export interface Diagnostic{name:string;status:'ok'|'warning'|'error';detail:string}
export interface LaunchResult{ok:boolean;error?:string;pid?:number;logPath?:string}
export interface TestResult{id:string;gameId:string;stage:string;state:VerificationState;timestamp:string;detail:string;durationMs?:number;versions?:Record<string,string>}
export interface ControllerConfig{id:string;gamepadId:string;deviceKey?:string;mode?:'gamepad'|'keyboard';mapping:Record<Action,number|string>;physicalMapping?:Partial<Record<PhysicalControl,PhysicalInput|number|string>>;deadzone:number;repeatDelayMs:number;repeatRateMs:number;exitHoldMs:number}
export interface Settings{volume:number;muted:boolean;videoDriver:string;audioDriver:string;integerScale:boolean;autosave:boolean;showUninstalled:boolean;libraryPaths:string[];controller?:ControllerConfig;gameInputProfiles:Record<string,GameInputProfile>}
export interface AppState{games:Game[];settings:Settings;recentIds:string[];testResults:TestResult[]}
export interface NativeControllerState{connected:boolean;id:string;mapping:string;buttons:boolean[];axes:number[];backend:'linux-js'|'none'}
export interface ArcadeApi{loadState:()=>Promise<AppState>;saveSettings:(settings:Settings)=>Promise<AppState>;toggleFavorite:(id:string)=>Promise<AppState>;scanLibrary:(paths:string[])=>Promise<AppState>;launchGame:(id:string)=>Promise<LaunchResult>;diagnostics:()=>Promise<Diagnostic[]>;runVerification:(id?:string)=>Promise<TestResult[]>;exportData:()=>Promise<{ok:boolean;path?:string}>;importData:()=>Promise<AppState|undefined>;saveController:(controller:ControllerConfig)=>Promise<AppState>;saveGameInputProfile:(profile:GameInputProfile)=>Promise<AppState>;platform:()=>Promise<{platform:string;arch:string}>;controllerState:()=>Promise<NativeControllerState>;onControllerState:(callback:(state:NativeControllerState)=>void)=>()=>void;onGameExited:(callback:(id:string)=>void)=>()=>void;}
declare global{interface Window{arcade?:ArcadeApi}}
