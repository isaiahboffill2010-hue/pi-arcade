#!/usr/bin/env bash
set -euo pipefail
APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/pi-arcade"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/pi-arcade"
AUTOSTART="$HOME/.config/labwc/autostart"
LINE="$HOME/.local/bin/pi-arcade-launch >>$CONFIG_DIR/launcher.log 2>&1 &"
echo "This removes the launcher only. Games, saves, RetroArch, and $CONFIG_DIR are preserved."
rm -rf -- "$APP_DIR"
rm -f -- "$HOME/.local/bin/pi-arcade-launch"
if [[ -f "$AUTOSTART" ]]; then sed -i "\|^${LINE//|/\\|}$|d" "$AUTOSTART"; fi
echo 'Pi Arcade launcher removed; user data preserved.'
