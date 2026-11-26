#!/usr/bin/env bash
set -euo pipefail
rule=/etc/polkit-1/rules.d/49-pi-arcade-network.rules
sudo tee "$rule" >/dev/null <<'EOF'
polkit.addRule(function(action, subject) {
  var allowed = [
    "org.freedesktop.NetworkManager.network-control",
    "org.freedesktop.NetworkManager.settings.modify.own",
    "org.freedesktop.NetworkManager.settings.modify.system",
    "org.freedesktop.NetworkManager.wifi.scan",
    "org.freedesktop.NetworkManager.wifi.share.protected"
  ];
  if (subject.user == "isaiah" && subject.isInGroup("netdev") && allowed.indexOf(action.id) >= 0) {
    return polkit.Result.YES;
  }
});
EOF
sudo chmod 0644 "$rule"
sudo systemctl reload polkit 2>/dev/null || true
echo "Pi Arcade NetworkManager policy installed."
