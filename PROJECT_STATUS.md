# Project status — 2026-10-25

## Completed without Raspberry Pi hardware

- Full Electron/React launcher screens: home, installed library, categories, joystick search keyboard, favorites, details, visual control preview, settings, import, live controller test, and diagnostics.
- Secure context-isolated CommonJS preload; renderer has no Node access; narrow IPC only.
- Persistent settings, favorites, recent plays, play counts, controller configuration, verification history, backups, and restore.
- Recursive import, extension/platform detection, normalized catalog matching, custom entries, integrity hashing, and installed/catalog separation.
- 715 unique catalog records and ten reusable control profiles, including title-accurate Mortal Kombat, Marvel vs. Capcom, Tekken, six-button fighter, console, shooter, platform, classic-arcade and digital-racing layouts.
- RetroArch executable/core detection, safe argument arrays, fullscreen per-game configs, generated input mappings, save states, logging, single-process ownership, clean exit, and focus restoration.
- Staged verification for file, checksum, emulator/core/config, launch, five-second stability, termination, and logged result storage.
- One redistributable game installed in the repository with complete provenance, plus 12 checksum-pinned games acquired directly from MAME's authorized ROM page at install time.
- One-command Pi installer, safe uninstall, crash restart loop, labwc autostart, apt-first/official-Libretro-fallback core installation, content acquisition, launch-test report generation, and CI dry-run coverage.

## Measured results

- VOID LANCER source build and upstream smoke test passed.
- Official RetroArch 1.22.2 + Mesen loaded the ROM successfully on Windows. Mesen reported mapper 0, 32 KiB PRG, 8 KiB CHR, 256×240 geometry and 60.0998 FPS nominal timing; frame-limited execution returned without an immediate failure.
- Official RetroArch 1.22.2 + MAME 2003-Plus launched all 12 acquired arcade sets, observed ROM loading/video geometry, and cleanly unloaded each core. Car Polo's driver reports missing sound emulation, so its result is video/input only.
- Unit/integration: 11 passed.
- Electron Playwright navigation smoke test: 1 passed.
- TypeScript/Vite/Electron production build: passed.
- ESLint: passed with zero warnings.
- Content checksum/license verification: passed.
- Linux ARM64 unpacked Electron package: passed. Windows cross-host AppImage compression remains unavailable; native ARM CI/Pi build is configured.

## Physical-only blockers

- USB encoder VID/PID, button indices, keyboard-vs-gamepad mode, reconnect behavior, and actual Start+Select hold must be recorded on the cabinet.
- Raspberry Pi Wayland fullscreen/focus, audio selection/latency, temperature, frame pacing and autostart reboot must be measured on the Pi.
- A real person must verify gameplay visuals, sound and physical control correctness. Automated launch evidence is not that claim.
- Commercial games require lawful user-supplied files and, for PlayStation, any legally required BIOS. Their catalog metadata is not installation evidence.

Current exact library accounting: 715 supported catalog entries; 13 real game files available after authorized acquisition; 13 successful emulator launches on the Windows development host; 702 catalog entries awaiting lawful user-supplied files. Raspberry Pi and physical-controller gameplay remain untested.
