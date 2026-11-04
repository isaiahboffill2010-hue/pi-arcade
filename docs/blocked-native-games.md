# Blocked native-game artifact audit

Audit date: 2026-11-03. Source artifacts remain in the external `for codex` folder and are not redistributed by this repository.

| Artifact | SHA-256 | Observed package evidence | ARM64 recovery requirement |
| --- | --- | --- | --- |
| `Blitz.exe` | `3c862989219e1fe5afea777bc9612c1d3f51b9397dba060bf3e5e82f10fe2ad8` | Unsigned x64 PE. Ikemen/MUGEN controller names, OpenAL/SDL and embedded game data are present. Windows opens a responsive `Ikemen GO` window. No separate `data`, `chars`, `stages`, motif or configuration tree was supplied. | Obtain the developer-distributed unpacked game tree or source/package manifest. The embedded Windows payload cannot be represented as an Ikemen data installation merely by substituting the ARM64 engine. |
| `LiminalPlace.exe` | `4dad0db5654285bb436b50f6fd01213d1caf7d3266ec60654a60d4ff04f572e8` | Unsigned x64 PE, only 145,920 bytes. It opens a window titled `Error`; no adjacent assets, engine runtime, manifest or data directory exists. | Obtain the complete release containing its assets and engine runtime, then reassess its engine and Linux support. |
| `RE KART 0.9.exe` | `0dd170906a42d0b7cee82fc22d8e6eeed355b02d9fc76e69030801874bc4cf5d` | Unsigned x64 Unity bootstrap executable, version `2021.3.19.13201743`. It imports `UnityPlayer.dll`, but that DLL and the required `_Data` directory are absent; the process exits immediately. | Obtain the complete developer build. A Windows Unity bootstrap cannot reconstruct omitted assets or produce a Linux ARM64 player. |
| `FazKarts.exe` | `f09b3d2a6724d43c3b766bc1140e7bc5ddae1134078ddc39e5996dd41e618f23` | Unsigned x64 Unity bootstrap executable, version `2021.3.45.8976527`. It imports `UnityPlayer.dll`, but that DLL and the required `_Data` directory are absent; the process exits immediately. | Obtain the complete developer build or project/source with an authorized Linux ARM64 export. |
| `nw.exe` | `bce8d58f61a6841be5b362a5e03566f98942a8ef29b665363b70bb0dea0e69e8` | Unsigned x64 NW.js/node-webkit runtime. Chromium/NW runtime strings are present, but `package.json`, `package.nw`, `nw_elf.dll` and application content are absent. This is not a game. | Supply the actual NW.js application package. NW.js has Linux ARM64 builds, but a runtime without the application cannot be integrated. |
| `Bendy in the Lost Realities.exe` | `2e1623c296937b80a9ef0c4e7919bf0c851f240f0f1aff26cd4ca131f15bed4c` | Unsigned x86 PE with Clickteam Fusion runtime imports (`MMFS2.dll`). The 727 MB single-file Windows build opens a responsive game-titled window. No source project or Linux runtime export is present. | Obtain source and an engine/runtime capable of an authorized ARM64 export. The x86 executable cannot run natively on Raspberry Pi OS ARM64. |
| `fnaf-ue-1-v1.0.3.exe` | `3909225e541f3d2516849968a6a37a13ab1c55fcae0f281681606eeb57f05d30` | Unsigned x86 Clickteam Fusion build; metadata reports `Horror Game` version `1.0.3`, and Clickteam/MMF runtime and Direct3D modules are embedded. Windows opens `FNaF Ultimate Edition`. | Obtain the Fusion project and an authorized ARM64-capable export/runtime. No native Raspberry Pi ARM64 Clickteam player was supplied. |
| `FNAF 1 REMAKE.exe` | `0fc38db0e216533093a9b8dd7faa8d9ef2587e6055768e70c5db496be7b1c71c` | Unsigned x86 Clickteam Fusion single-file build (`MMFS2.dll`). It exits immediately on Windows and supplies no adjacent assets, logs or project. | Obtain a complete working release and source/project for any Linux conversion. |

All eight files passed the existing ClamAV discovery scan, but none is signed. A clean signature scan does not establish publisher trust or platform compatibility. None should be marked Ready on Raspberry Pi until a complete, authorized package passes a native ARM64 launch, controller, fullscreen and clean-exit test.

Primary upstream compatibility evidence:

- Ikemen GO documents a native `LinuxARM` build, but it requires a normal reusable game data tree: <https://github.com/ikemen-engine/Ikemen-GO/blob/develop/BUILDING.md>
- NW.js publishes Linux ARM64 runtimes, while its application still requires a `package.json`/package payload: <https://github.com/nwjs/nw.js/blob/main/docs/For%20Users/Getting%20Started.md>

## Follow-up Game Jolt package recovery

On 2026-11-03, shortcut files added to `for codex` were resolved to their existing Game Jolt installation directories. The originals were left untouched and confidently matched files were copied under the external `Prepared-Games/Recovered-Native` directory.

| Prepared package | Recovered structure | Windows result | Raspberry Pi status |
| --- | --- | --- | --- |
| FazKarts | `FazKarts.exe`, `UnityPlayer.dll`, `FazKarts_Data`, Mono runtime and plugins | Opens a `FazKarts` Unity window, but did not become responsive during the bounded loading test | Windows x64 Unity player only; no Linux ARM64 player supplied |
| RE KART 0.9 | `RE KART 0.9.exe`, `UnityPlayer.dll`, `RE KART 0.9_Data`, Mono runtime and plugins | Responsive `RE KART 0.9` window | Windows x64 Unity player only; no Linux ARM64 player supplied |
| FNAF 1 Remake | `FNAF 1 REMAKE.exe`, 639 MB `.dat`, and required Clickteam `Modules` | Still exits immediately | Windows Clickteam package; no ARM64 runtime or source supplied |
| LiminalPlace / The Backrooms Realism | Game Jolt launcher plus complete Unreal `data/Windows` tree, shipping executable, PAK/UCAS/UTOC and prerequisite files | Responsive `LiminalPlace-Win64-Shipping` process and `LiminalPlace` window | Windows x64 Unreal package only; no Linux ARM64 build supplied |
| Sonic Time Twisted | Executable, `data.win`, audio, controller database, translations and DirectX library | Responsive `Sonic Time Twisted` window | Windows x86 GameMaker build; no native ARM64 runner supplied |
| Clickertale | `nw.exe`, `package.nw`, NW/Chromium DLLs, resources and locale | Responsive `Clickertale` NW.js window | Application assets are recovered, but cabinet suitability and compatibility with a current ARM64 NW.js runtime are unverified |

The Bendy shortcut contains only `Promo.jpg`; the FNAF Ultimate Edition shortcut contains only a manifest; and the `OSF` shortcut contains only `Sonic.pck` without a proven matching executable. Those files were not associated or copied by guesswork.
