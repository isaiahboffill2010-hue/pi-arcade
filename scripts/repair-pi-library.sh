#!/usr/bin/env bash
set -euo pipefail

PREPARED_GAME_DIR="${1:-$HOME/Arcade-Game-Library/Prepared-Games}"
LAUNCHER="$HOME/.local/bin/pi-arcade-launch"

[[ "$(uname -s)" == Linux && "$(uname -m)" == aarch64 ]] || { echo 'ARM64 Linux is required' >&2; exit 1; }
[[ -d "$PREPARED_GAME_DIR" ]] || { echo "Prepared game directory not found: $PREPARED_GAME_DIR" >&2; exit 1; }
[[ -f "$LAUNCHER" ]] || { echo "Pi Arcade launcher not found: $LAUNCHER" >&2; exit 1; }

BACKUP="$LAUNCHER.before-prepared-games"
[[ -e "$BACKUP" ]] || cp -p "$LAUNCHER" "$BACKUP"
TEMP="$(mktemp)"
trap 'rm -f -- "$TEMP"' EXIT
awk -v root="$PREPARED_GAME_DIR" '
  /^export PI_ARCADE_GAME_DIR=/ { print "export PI_ARCADE_GAME_DIR=\"" root "\""; found=1; next }
  { print }
  END { if (!found) exit 42 }
' "$LAUNCHER" > "$TEMP" || { echo 'Launcher has no PI_ARCADE_GAME_DIR assignment; left unchanged' >&2; exit 1; }
install -m 0755 "$TEMP" "$LAUNCHER"

OPENTYRIAN="$PREPARED_GAME_DIR/Authorized/opentyrian/opentyrian"
if [[ -f "$OPENTYRIAN" ]]; then chmod 0755 "$OPENTYRIAN"; fi

echo "Pi Arcade will scan: $PREPARED_GAME_DIR"
echo "Backup retained at: $BACKUP"
echo 'Restart Pi Arcade (or reboot once) to rescan the library.'
echo 'Native marker status:'
while IFS= read -r -d '' marker; do
  root="${marker%/*}"
  linux_executable="$(sed -n 's/.*"linuxExecutable"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$marker")"
  if [[ -n "$linux_executable" && -f "$root/$linux_executable" ]]; then
    printf 'READY   %s -> %s\n' "$marker" "$linux_executable"
  else
    printf 'BLOCKED %s -> missing %s\n' "$marker" "${linux_executable:-linuxExecutable field}"
  fi
done < <(find "$PREPARED_GAME_DIR" -name .pi-arcade-native.json -type f -print0)
