# Cabinet hardware acceptance test

Do not mark a stage passed without recording date, Pi OS version, launcher version, emulator/core version, controller USB vendor/product IDs, and relevant logs.

1. Run `uname -a`, `cat /proc/device-tree/model`, `retroarch --version`, `lsusb`, and `cat /proc/bus/input/devices`.
2. Run `jstest /dev/input/js0`; record every joystick axis and button index. If no joystick device exists, record keyboard HID events with `evtest` instead.
3. Verify neutral input, all four directions, eight action buttons, Start, and Select. Check disconnect/reconnect and held-key repeat.
4. Launch the app normally and confirm fullscreen, hidden pointer, focus, audio device and controller navigation.
5. Import a legally obtained game and verify its hash, core, control preview, launch, 60-second runtime, Start+Select exit, process termination and focus restoration.
6. Repeat with joystick-only, two-button, four-button and six-button profiles as suitable legal test content becomes available.
7. Reboot twice and confirm labwc autostart and crash recovery. Confirm SSH or terminal maintenance access remains available.

Verification states progress only as evidence permits: not tested → file verified → launch verified → input configuration verified → runtime verified → hardware tested → passed. Record failures and blockers without skipping stages.
