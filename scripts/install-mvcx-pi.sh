#!/usr/bin/env bash
set -euo pipefail
SOURCE="${1:-}"; DEST="${2:-$HOME/Games/Arcade/Marvel vs Capcom X 3.0}"
VERSION=v1.0.0; COMMIT=81c6da71d689625e20db79586815b695da00dd6d
[[ -n "$SOURCE" && -d "$SOURCE" ]] || { echo 'Usage: install-mvcx-pi.sh /path/to/extracted/MUGEN/root [destination]' >&2; exit 2; }
[[ "$(uname -s)" == Linux && "$(uname -m)" == aarch64 ]] || { echo 'ERROR: native aarch64 Linux is required' >&2; exit 1; }
[[ -f "$SOURCE/data/mugen1/system.def" && -f "$SOURCE/data/mugen1/select.def" && -d "$SOURCE/chars" ]] || { echo 'ERROR: source is not the expected MVCX MUGEN root' >&2; exit 1; }
[[ ! -e "$DEST" ]] || { echo "ERROR: destination already exists: $DEST" >&2; exit 1; }
sudo apt-get update
sudo apt-get install -y git make gcc g++ pkg-config nasm yasm rsync libsdl2-dev libxmp-dev curl ca-certificates
command -v go >/dev/null || { echo 'ERROR: install Go 1.27+ from go.dev before building Ikemen GO v1.0.0' >&2; exit 1; }
go version | grep -Eq 'go1\.(2[7-9]|[3-9][0-9])' || { echo 'ERROR: Ikemen GO v1.0.0 requires Go 1.27+' >&2; exit 1; }
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/pi-arcade/ikemen-$VERSION"
if [[ ! -d "$CACHE/.git" ]]; then git clone --depth 1 --branch "$VERSION" https://github.com/ikemen-engine/Ikemen-GO.git "$CACHE"; fi
[[ "$(git -C "$CACHE" rev-parse HEAD)" == "$COMMIT" ]] || { echo 'ERROR: Ikemen source revision mismatch' >&2; exit 1; }
make -C "$CACHE" Ikemen_GO_LinuxARM
BIN="$(find "$CACHE" -type f -name Ikemen_GO_LinuxARM -print -quit)"; [[ -n "$BIN" ]] || { echo 'ERROR: ARM64 Ikemen binary was not produced' >&2; exit 1; }
mkdir -p "$DEST"
for item in data external font sound stages chars; do [[ -e "$CACHE/$item" ]] && rsync -a "$CACHE/$item" "$DEST/"; done
rsync -a --exclude='*.exe' --exclude='*.dll' --exclude='*.asi' --exclude='old_tools/' "$SOURCE/" "$DEST/"
install -m 0755 "$BIN" "$DEST/Ikemen_GO_LinuxARM"
cat >"$DEST/.pi-arcade-mvcx.json" <<EOF
{"schema":1,"gameId":"mugen:marvel-vs-capcom-x-3-0","engine":"Ikemen GO","engineVersion":"$VERSION","engineCommit":"$COMMIT","redistributable":false}
EOF
echo "Installed MVCX for ARM64: $DEST"
echo 'In Pi Arcade, choose Import games and scan the parent Arcade directory.'
