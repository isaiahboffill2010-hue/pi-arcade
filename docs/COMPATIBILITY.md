# Compatibility baseline

| Component | Current decision | Evidence level |
|---|---|---|
| Raspberry Pi OS | 64-bit Desktop, current Bookworm-or-newer release | Raspberry Pi documentation: Wayland/labwc is the supported default |
| Launcher | Electron Linux ARM64 | Electron publishes Linux arm64 binaries |
| Autostart | Per-user labwc autostart | Raspberry Pi kiosk guidance; never root |
| RetroArch | Distribution package first; official Libretro aarch64 buildbot fallback with recorded SHA-256 | Package availability varies between Raspberry Pi OS releases |
| Encoder | USB HID, gamepad or keyboard mode discovered at runtime | Exact bundled encoder not authoritatively verified |

File routing supports NES, SNES, Genesis, Sega CD, PlayStation cue sheets, CHD, and intact arcade ZIP sets. Ambiguous cue/CHD files are matched by known title metadata before falling back to PlayStation. Routing means recognized/importable, not performance-verified. Analog, light-gun, trackball, wheel, dual-player, N64, PS2, and newer-console games are flagged rather than represented as verified for this one-stick cabinet.

Primary references:

- https://www.raspberrypi.com/documentation/computers/configuration.html
- https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/
- https://www.electronjs.org/docs/latest/tutorial/installation
- https://docs.libretro.com/guides/rpi/
