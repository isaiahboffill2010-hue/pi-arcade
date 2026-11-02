#!/usr/bin/env bash
set -euo pipefail
DRY_RUN=false; ENABLE_AUTOSTART=false; ALLOW_NON_PI=false
for arg in "$@";do case "$arg" in --dry-run)DRY_RUN=true;;--enable-autostart)ENABLE_AUTOSTART=true;;--no-autostart)ENABLE_AUTOSTART=false;;--allow-non-pi)ALLOW_NON_PI=true;;*)echo "Unknown argument: $arg" >&2;exit 2;;esac;done
run(){if $DRY_RUN;then printf 'DRY-RUN:';printf ' %q' "$@";printf '\n';else "$@";fi}
log(){printf '[pi-arcade] %s\n' "$*";}
[[ "$(uname -s)" == Linux ]]||{ echo 'ERROR: Linux required';exit 1; }
ARCH="$(uname -m)";MODEL="unknown";[[ -r /proc/device-tree/model ]]&&MODEL="$(tr -d '\0' </proc/device-tree/model)"
if ! $ALLOW_NON_PI;then [[ "$ARCH" == aarch64 ]]||{ echo "ERROR: aarch64 required (found $ARCH)";exit 1; };[[ "$MODEL" == *'Raspberry Pi 5'* ]]||{ echo "ERROR: Raspberry Pi 5 required (found $MODEL)";exit 1; };fi
available_kb=$(df -Pk "$HOME"|awk 'NR==2{print $4}');((available_kb>=4194304))||{ echo 'ERROR: at least 4 GiB free required';exit 1; }
ROOT="$(cd "$(dirname "$0")/.."&&pwd)";APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/pi-arcade";BIN_DIR="$HOME/.local/bin";CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/pi-arcade";GAME_DIR="$HOME/Games/Arcade";SAVE_DIR="$HOME/Games/Arcade-Saves";REPORT="$CONFIG_DIR/install-report.txt"
log "Host: $MODEL / $ARCH";run sudo apt-get update;run sudo apt-get install -y nodejs npm retroarch retroarch-assets joystick evtest curl ca-certificates unzip
if ! $DRY_RUN;then
  NODE_MAJOR="$(node --version 2>/dev/null|sed -E 's/^v([0-9]+).*/\1/'||echo 0)"
  if ((NODE_MAJOR<22));then
    log "Node.js 22 is required by the current build toolchain; installing it from NodeSource"
    NODE_SETUP="$(mktemp)";curl -fsSL https://deb.nodesource.com/setup_22.x -o "$NODE_SETUP";sudo -E bash "$NODE_SETUP";rm -f "$NODE_SETUP";sudo apt-get install -y nodejs
  fi
fi
apt_optional(){if apt-cache show "$1" >/dev/null 2>&1;then run sudo apt-get install -y "$1";else log "Optional package unavailable: $1";fi}
for pkg in libretro-mesen libretro-snes9x libretro-mgba libretro-genesisplusgx libretro-pcsx-rearmed libretro-fbneo libretro-flycast libretro-mame libretro-mame2003-plus;do apt_optional "$pkg";done
CORE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/retroarch/cores";run mkdir -p "$APP_DIR" "$BIN_DIR" "$CONFIG_DIR" "$GAME_DIR" "$SAVE_DIR" "$CORE_DIR" "$HOME/.config/labwc"
core_exists(){ [[ -f "$CORE_DIR/$1_libretro.so"||-f "/usr/lib/aarch64-linux-gnu/libretro/$1_libretro.so"||-f "/usr/lib/libretro/$1_libretro.so" ]];}
ensure_core(){
  local core="$1" archive
  core_exists "$core"&&return 0
  archive="$(mktemp --suffix=.zip)"
  log "Installing official Libretro ARM64 core fallback: $core"
  curl --fail --location --retry 3 "https://buildbot.libretro.com/nightly/linux/aarch64/latest/${core}_libretro.so.zip" -o "$archive"
  unzip -o "$archive" -d "$CORE_DIR"
  sha256sum "$CORE_DIR/${core}_libretro.so">"$CORE_DIR/${core}_libretro.so.sha256"
  rm -f "$archive"
}
if $DRY_RUN;then log 'Would ensure official ARM64 Libretro core fallbacks';else for core in mesen snes9x mgba genesis_plus_gx pcsx_rearmed fbneo flycast mame2003_plus;do ensure_core "$core";done;fi
run npm ci --prefix "$ROOT"
run env PI_ARCADE_ACQUIRE_DIR="$GAME_DIR" npm run acquire:authorized --prefix "$ROOT"
run env PI_ARCADE_GAME_DIR="$GAME_DIR" PI_ARCADE_TEST_LOG_DIR="$CONFIG_DIR/authorized-tests" npm run test:authorized --prefix "$ROOT"
run npm run build --prefix "$ROOT";run npm run package:pi --prefix "$ROOT"
APPIMAGE="$(find "$ROOT/dist" -maxdepth 1 -name '*arm64.AppImage' -print -quit 2>/dev/null||true)";if ! $DRY_RUN&&[[ -z "$APPIMAGE" ]];then echo 'ERROR: ARM64 AppImage was not created';exit 1;fi
if ! $DRY_RUN;then install -m 0755 "$APPIMAGE" "$APP_DIR/pi-arcade.AppImage";install -m 0644 "$ROOT/content/void-lancer/void-lancer.nes" "$GAME_DIR/void-lancer.nes";install -m 0644 "$ROOT/content/void-lancer/LICENSE" "$GAME_DIR/VOID-LANCER-LICENSE";fi
if [[ -n "${PI_ARCADE_MVCX_SOURCE:-}" ]];then if $DRY_RUN;then log "Would prepare user-supplied MVCX assets from $PI_ARCADE_MVCX_SOURCE";else bash "$ROOT/scripts/install-mvcx-pi.sh" "$PI_ARCADE_MVCX_SOURCE" "$GAME_DIR/Marvel vs Capcom X 3.0";fi;fi
LAUNCHER="$BIN_DIR/pi-arcade-launch";if ! $DRY_RUN;then
  printf '%s\n' '#!/usr/bin/env bash' 'set -u' "export PI_ARCADE_GAME_DIR=\"$GAME_DIR\"" "while true; do \"$APP_DIR/pi-arcade.AppImage\" --ozone-platform-hint=auto; code=\$?; [[ \$code -eq 0 ]] && exit 0; logger -t pi-arcade \"launcher crashed with \$code; restarting\"; sleep 2; done" >"$LAUNCHER";chmod 0755 "$LAUNCHER"
fi
if $ENABLE_AUTOSTART;then AUTOSTART="$HOME/.config/labwc/autostart";LINE="$LAUNCHER >>$CONFIG_DIR/launcher.log 2>&1 &";if $DRY_RUN;then log "Would add autostart: $LINE";else touch "$AUTOSTART";grep -Fqx "$LINE" "$AUTOSTART"||printf '\n%s\n' "$LINE">>"$AUTOSTART";fi;fi
if ! $DRY_RUN;then "$APP_DIR/pi-arcade.AppImage" --version >/dev/null 2>&1||true;{ echo "installed_at=$(date -Is)";echo "model=$MODEL";echo "arch=$ARCH";echo "retroarch=$(retroarch --version 2>/dev/null|head -1||true)";echo "game_sha256=$(sha256sum "$GAME_DIR/void-lancer.nes"|awk '{print $1}')";echo 'hardware_test=pending';}>"$REPORT";fi
log "Installation complete. Report: $REPORT";log 'Reboot, then use Settings > Controller test. Start+Select exits games.'
