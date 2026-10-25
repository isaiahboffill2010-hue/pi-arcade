# Test report — 2026-10-25

| Area | Result | Evidence boundary |
|---|---|---|
| Catalog/profile integrity | Pass: 323 unique games, every entry has a core and existing profile | Metadata/configuration only |
| Import and matching | Pass | Temporary real files, recursive scanner and SHA-256 |
| Launch argument security | Pass | Discrete arguments; relative paths rejected |
| Unit/integration suite | Pass: 3 files, 8 tests | Windows development host |
| Electron UI | Pass: 1 Playwright test | Real Electron window; home/settings/controller/library/search flows |
| TypeScript/Vite/Electron build | Pass | Windows x64 host |
| Lint | Pass | Zero errors/warnings |
| Authorized content integrity | Pass | 40,976 bytes; SHA-256 matches manifest |
| Upstream game smoke test | Pass | 2,651 frames; stage 3 and boss state reached by upstream harness |
| Emulator launch | Pass | RetroArch 1.22.2/Mesen loaded mapper-0 ROM and ran to frame limit |
| Save path initialization | Pass | RetroArch created Mesen save/state routing |
| ARM64 directory packaging | Pass | Cross-packaged official Electron ARM64 runtime |
| AppImage | Configured in native ARM CI/Pi installer | Windows `mksquashfs` unavailable |
| Installer fresh/repeat dry-run | Configured in Linux CI | Docker/WSL unavailable locally |
| Cabinet hardware | Blocked | Pi and encoder were not connected |

The automated emulator test proves file/core loading and bounded runtime. It does not prove human gameplay, correct sound, physical controls, or Raspberry Pi performance.
