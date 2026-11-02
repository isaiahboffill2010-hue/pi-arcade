# Pi Arcade

Pi Arcade is a controller-first fullscreen launcher for a Raspberry Pi 5 single-player cabinet. It separates a 715-title compatibility catalog from the installed library, applies per-game RetroArch configuration, explains controls before play, monitors emulator processes, and restores launcher focus on exit.

## Raspberry Pi installation

Start with current Raspberry Pi OS 64-bit Desktop, connect the Pi to the internet, then run:

```sh
git clone https://github.com/isaiahboffill2010-hue/pi-arcade.git
cd pi-arcade
chmod +x install.sh
./install.sh
sudo reboot
```

The installer verifies Pi 5/aarch64/free space, installs Node, RetroArch and required Libretro cores, builds the ARM64 AppImage natively, downloads and checksum-verifies 12 games from MAME's authorized ROM page, installs the bundled open-source game, creates game/save/config directories, and adds an idempotent per-user labwc autostart entry. It never reflashes storage, runs the launcher as root, modifies user ROMs, or removes maintenance access.

After reboot, open **Settings → Controller test & calibration**, verify every physical input, save the controller, and run **Diagnostics → Verify all installed games**. The exact USB encoder identifiers and indices cannot be known until it is connected.

## Authorized playable games

VOID LANCER 1.0.0 is built from its MIT-licensed upstream source and included as a redistributable NES ROM. Its checksum, license, build procedure, and validation evidence are in [`content/void-lancer/PROVENANCE.md`](content/void-lancer/PROVENANCE.md).

The catalog includes metadata for 12 games available from MAME's official ROM page, but the Pi installer does not download optional game archives. Copy externally acquired games into the Pi game directory and let the launcher detect them. Only bundled, redistributable content is verified automatically.

## Supported files

- NES: `.nes` → Mesen
- SNES: `.sfc`, `.smc` → Snes9x
- Genesis: `.md`, `.gen` → Genesis Plus GX
- PlayStation: `.cue`, `.chd` → PCSX-ReARMed
- Arcade and Neo Geo: intact `.zip` sets → FinalBurn Neo or MAME according to catalog metadata

Importing recursively scans up to four levels, matches normalized filenames to catalog entries, preserves arcade archives, and creates custom entries for unknown supported files. A catalog entry is never presented as installed until a real file is discovered.

## Desktop development and verification

```sh
npm ci
npm test
npm run lint
npm run verify:content
npm run build
npm run test:e2e
```

GitHub Actions repeats tests on Windows and Linux, performs two installer dry-runs, and creates an ARM64 AppImage on an ARM runner.

## Maintenance

- Settings and library data are written atomically with a backup in Electron's user-data directory.
- Export/restore is available under Settings.
- Per-game logs and verification history are retained.
- Automatic save-state loading/saving is configurable.
- `bash scripts/uninstall-pi.sh` removes the launcher and autostart entry while preserving games, saves, RetroArch, and configuration.

See [hardware acceptance](docs/HARDWARE_TEST.md), [compatibility](docs/COMPATIBILITY.md), [test evidence](docs/TEST_REPORT.md), and [current limitations](PROJECT_STATUS.md).

Marvel vs. Capcom X 3.0 is supported as a user-supplied MUGEN asset pack through a native Ikemen GO build; its copyrighted files are deliberately excluded from the repository. See [MVCX integration](docs/MVCX_INTEGRATION.md) for verified hashes, preparation, controls, ARM64 limitations, and redistribution requirements.
