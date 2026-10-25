#!/usr/bin/env bash
set -euo pipefail
DRY_RUN=false
ENABLE_AUTOSTART=false
for arg in "$@"; do case "$arg" in --dry-run) DRY_RUN=true;; --enable-autostart) ENABLE_AUTOSTART=true;; *) echo "Unknown argument: $arg" >&2; exit 2;; esac; done
run(){ if $DRY_RUN; then printf 'DRY-RUN: '; printf '%q ' "$@"; printf '\n'; else "$@"; fi; }
[[ "$(uname -s)" == Linux ]] || { echo 'ERROR: Raspberry Pi OS/Linux required'; exit 1; }
[[ "$(uname -m)" == aarch64 ]] || { echo 'ERROR: 64-bit ARM (aarch64) required'; exit 1; }
[[ -r /proc/device-tree/model ]] && grep -qi 'Raspberry Pi 5' /proc/device-tree/model || { echo 'ERROR: Raspberry Pi 5 not detected'; exit 1; }
available_kb=$(df -Pk "$HOME" | awk 'NR==2 {print $4}')
(( available_kb >= 4194304 )) || { echo 'ERROR: at least 4 GiB free space required'; exit 1; }
APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/pi-arcade"
BIN_DIR="$HOME/.local/bin"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/pi-arcade"
echo "Installing Pi Arcade to $APP_DIR"
run sudo apt-get update
run sudo apt-get install -y retroarch joystick unclutter
run mkdir -p "$APP_DIR" "$BIN_DIR" "$CONFIG_DIR" "$HOME/Games/Arcade" "$HOME/.config/labwc"
run npm ci
run npm run build
run npm run package:pi
if ! $DRY_RUN; then cp -a dist dist-electron package.json "$APP_DIR/"; fi
if $ENABLE_AUTOSTART; then
  AUTOSTART="$HOME/.config/labwc/autostart"
  LINE="$BIN_DIR/pi-arcade-launch >>$CONFIG_DIR/launcher.log 2>&1 &"
  if ! $DRY_RUN; then
    printf '#!/usr/bin/env bash\nexec npx electron "%s" --no-sandbox\n' "$APP_DIR" > "$BIN_DIR/pi-arcade-launch"
    chmod +x "$BIN_DIR/pi-arcade-launch"
    touch "$AUTOSTART"
    grep -Fqx "$LINE" "$AUTOSTART" || printf '\n%s\n' "$LINE" >> "$AUTOSTART"
  else echo "DRY-RUN: add autostart line: $LINE"; fi
fi
echo "Install complete. Hardware validation is still required on the cabinet."
