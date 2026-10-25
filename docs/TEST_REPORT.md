# Test report — 2026-10-25

Host: Windows x64, Node.js 24.19.0. This is a development-host report, not cabinet certification.

| Check | Result |
|---|---|
| Vitest | Passed: 2 files, 4 tests |
| ESLint | Passed: zero warnings/errors |
| TypeScript + Vite + Electron compilation | Passed |
| Linux ARM64 Electron directory packaging | Passed after package-entry correction |
| AppImage assembly on Windows | Blocked: electron-builder's cross-host `mksquashfs` helper was unavailable (`ENOENT`) |
| Raspberry Pi execution | Blocked: no Pi accessible |
| USB encoder test | Blocked: no arcade HID controller detected |
| Actual game launch/runtime/exit | Blocked: no emulator or legally supplied game file on host |

The tests verify recognized-extension import behavior, installed/file-verified state, safe argument-array command construction, path preservation, and rejection of relative or unsupported launches. They do not verify emulation, visuals, physical input, sound, or performance.
