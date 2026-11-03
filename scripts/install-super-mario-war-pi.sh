#!/usr/bin/env bash
set -euo pipefail
[[ $# -eq 2 ]] || { echo "Usage: $0 SOURCE_DIR DESTINATION" >&2; exit 2; }
SOURCE_DIR="$(cd "$1" && pwd)"
DESTINATION="$2"
[[ "$(uname -s)" == Linux && "$(uname -m)" == aarch64 ]] || { echo 'ARM64 Linux required' >&2; exit 1; }
[[ -f "$SOURCE_DIR/CMakeLists.txt" && -d "$SOURCE_DIR/data" ]] || { echo 'Complete Super Mario War recursive source checkout required' >&2; exit 1; }
sudo apt-get update
sudo apt-get install -y build-essential cmake ninja-build libsdl3-dev libsdl3-image-dev libsdl3-mixer-dev zlib1g-dev libtoml11-dev libenet-dev
BUILD_DIR="$(mktemp -d)"
trap 'rm -rf -- "$BUILD_DIR"' EXIT
cmake -S "$SOURCE_DIR" -B "$BUILD_DIR" -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build "$BUILD_DIR" --target smw --parallel "$(nproc)"
install -d "$DESTINATION/data"
install -m 0755 "$BUILD_DIR/smw" "$DESTINATION/smw"
cp -a "$SOURCE_DIR/data/." "$DESTINATION/data/"
printf '%s\n' '{"id":"pc:super-mario-war","windowsExecutable":"smw.exe","linuxExecutable":"smw","args":["--datadir","data"]}' > "$DESTINATION/.pi-arcade-native.json"
echo "Installed Super Mario War to $DESTINATION"
