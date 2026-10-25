# Pi Arcade

A controller-first Electron launcher for a Raspberry Pi 5 single-player arcade cabinet. The current milestone is a buildable launcher foundation—not a claim of completed cabinet validation.

## Desktop development

Requirements: Node.js 22+ and npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

Keyboard preview: `Tab` moves focus, arrow keys work in standard controls, `Enter` selects, and `Escape` returns home. Native controller calibration requires the cabinet.

## Raspberry Pi installation

Use Raspberry Pi OS 64-bit Desktop on a Pi 5. Copy this repository to the Pi and run:

```sh
bash scripts/install-pi.sh --dry-run
bash scripts/install-pi.sh --enable-autostart
```

The installer refuses non-Linux, non-aarch64, and non-Pi-5 hosts; checks free space; installs RetroArch and controller diagnostics; builds an ARM64 AppImage; and optionally appends an idempotent labwc autostart entry. It does not reflash the Pi, run the launcher as root, download commercial ROMs, or alter saves.

To remove only the launcher while preserving ROMs, saves, RetroArch and diagnostics:

```sh
bash scripts/uninstall-pi.sh
```

## Controls and importing

The USB encoder is intentionally not assigned fixed button numbers. Encoder firmware varies. Import legally obtained `.nes`, `.sfc`, `.smc`, `.md`, `.gen`, `.cue`, `.chd`, or arcade `.zip` files from Settings. Arcade ZIP sets remain intact. Each installed entry receives a control profile; production calibration will bind physical inputs to those logical actions.

## Legal content

No copyrighted game files or cover art are bundled. Supported catalog entries and installed games are separate concepts. The importer only indexes user-supplied files; it does not download ROMs.

See [PROJECT_STATUS.md](PROJECT_STATUS.md), [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md), and [docs/HARDWARE_TEST.md](docs/HARDWARE_TEST.md).
