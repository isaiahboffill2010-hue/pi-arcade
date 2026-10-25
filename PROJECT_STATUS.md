# Project status — 2026-10-25

## Verified on the development host

- Windows x64 host, Node.js 24.19.0 and Git 2.53.0 detected.
- Workspace began empty and was not a Git repository.
- No RetroArch, MAME, FBNeo, accessible Raspberry Pi, or detected arcade HID controller was available.
- Secure Electron process separation, UI, local importer, RetroArch command adapter, and diagnostics implemented.
- Automated results: 4/4 tests passed, lint passed, and renderer/Electron production compilation passed.
- Linux ARM64 runtime packaging reached a complete unpacked application. AppImage compression is blocked on this Windows host because the cross-host `mksquashfs` helper is unavailable; the same packaging command remains in the Pi-native installer.

## Not yet claimable

- Raspberry Pi ARM64 package execution, Wayland fullscreen/focus recovery, physical encoder mapping, audio/video latency, emulator core availability, real game launch/runtime/exit, frame performance, and boot autostart all require the actual Pi and cabinet.
- No game has been acquired or launched. Commercial ROMs are not included.
- The exact encoder bundled with the referenced Micro Center kit could not be confirmed from an authoritative accessible product specification; calibration is therefore mandatory.

## Next hardware milestone

Run `scripts/install-pi.sh --dry-run`, then install on the Pi. Connect the encoder and execute the checklist in `docs/HARDWARE_TEST.md`. Supply one legally obtained game file or select an explicitly licensed homebrew title whose official download can be checksum-pinned.
