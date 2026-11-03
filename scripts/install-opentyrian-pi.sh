#!/usr/bin/env bash
set -euo pipefail
[[ $# -eq 2 ]] || { echo "Usage: $0 OFFICIAL_ARM64_ARCHIVE DESTINATION" >&2; exit 2; }
ARCHIVE="$(realpath "$1")"
DESTINATION="$2"
[[ "$(uname -s)" == Linux && "$(uname -m)" == aarch64 ]] || { echo 'ARM64 Linux required' >&2; exit 1; }
[[ -f "$ARCHIVE" ]] || { echo "Archive not found: $ARCHIVE" >&2; exit 1; }
WORK="$(mktemp -d)"
trap 'rm -rf -- "$WORK"' EXIT
tar -xzf "$ARCHIVE" -C "$WORK"
SOURCE="$WORK/opentyrian"
[[ -x "$SOURCE/opentyrian" && -d "$SOURCE/data" && -f "$SOURCE/licenses/Tyrian.txt" ]] || { echo 'Incomplete or unexpected official OpenTyrian package' >&2; exit 1; }
install -d "$DESTINATION"
cp -a "$SOURCE/." "$DESTINATION/"
chmod 0755 "$DESTINATION/opentyrian"
printf '%s\n' '{"id":"pc:opentyrian","windowsExecutable":"opentyrian.exe","linuxExecutable":"opentyrian","args":[]}' > "$DESTINATION/.pi-arcade-native.json"
printf '%s\n' 'section video' '  item fullscreen 0' '  item scaler Scale2x' "  item scaling_mode 'Fit 4:3'" > "$DESTINATION/opentyrian.cfg"
echo "Installed OpenTyrian to $DESTINATION"
