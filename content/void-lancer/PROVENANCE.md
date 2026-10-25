# VOID LANCER provenance

- Upstream: https://github.com/Riyoway/void-lancer-nes
- Version: 1.0.0 source state retrieved 2026-10-25
- License: MIT; the unmodified upstream license is included beside the ROM.
- Build: `py tools/build.py`
- Upstream validation: `py tools/smoke_test.py` passed (`frames=2651`, stage 3, boss reached).
- ROM size: 40,976 bytes
- SHA-256: `5eb801aca68131a3d17fa82d8901d46f6098b878d1e00cd1c47d00c001c2405a`
- Format: iNES, mapper 0, 32 KiB PRG ROM, 8 KiB CHR ROM, vertical mirroring.

Desktop execution validation used official RetroArch 1.22.2 and the Mesen libretro core. The core loaded the ROM as mapper 0 at 60.0998 FPS nominal timing and reached the configured frame limit without an immediate launch failure. This is launch/runtime evidence, not physical gameplay or cabinet verification.
