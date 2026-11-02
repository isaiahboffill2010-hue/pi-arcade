# TS-UAIB-OP V1.0 cabinet wiring

This plan uses only labels verified as switch inputs on this board family. Match the printed label on the PCB; do not infer a connector from its position alone.

## Physical connections

Use each supplied two-wire harness as a complete circuit. Connect its two spades to the microswitch `COM` and `NO` terminals. Do not use `NC`, and do not connect an illuminated button's LED terminals to an input connector.

| Panel position | Cabinet control | PCB label | MVCX action | USB code |
|---|---|---|---|---|
| Top row 1 | B1 | K1 | Light Punch | Capture in launcher |
| Top row 2 | B2 | K2 | Medium Punch | Capture in launcher |
| Top row 3 | B3 | K3 | Heavy Punch | Capture in launcher |
| Top row 4 | B7 | K7 | Unused by MVCX; available to other games | Capture in launcher |
| Bottom row 1 | B4 | K4 | Light Kick | Capture in launcher |
| Bottom row 2 | B5 | K5 | Medium Kick | Capture in launcher |
| Bottom row 3 | B6 | K6 | Heavy Kick | Capture in launcher |
| Bottom row 4 | B8 | K8 | Unused by MVCX; available to other games | Capture in launcher |
| Small system button | Start | ST | Start / confirm | Capture in launcher |
| Small system button | Select | SE | Pause / back | Capture in launcher |
| Joystick up switch | Up | AU | Up / jump | Capture in launcher |
| Joystick down switch | Down | AD | Down / crouch | Capture in launcher |
| Joystick left switch | Left | AL | Move left | Capture in launcher |
| Joystick right switch | Right | AR | Move right | Capture in launcher |

`K1` through `K8`, `ST`, `SE`, and `AU/AD/AL/AR` are verified label meanings. The reported HID button/axis numbers are deliberately not prefilled: connector numbering is not guaranteed to equal USB numbering.

## Joystick connection decision

For a joystick with four independent microswitches, use the four labeled two-pin inputs `AU`, `AD`, `AL`, and `AR`. This avoids any uncertainty about the larger header's pin order. Each direction switch uses its own two-wire harness to `COM` and `NO`.

The board-family documentation calls the five-pin joystick header `J4`, but the exact pin-one orientation of the photographed `TS-UAIB-OP V1.0` revision has not been electrically verified. Leave that header unused unless its keyed harness and pin order are confirmed with continuity testing. Never rotate a powered connector as an experiment.

Do not wire gameplay controls to `TURBO`, `AUTO`, `CLR`, or `MODE`; those are special-function inputs rather than independent game buttons.

## Calibration

### Windows

1. Wire all controls with USB disconnected, inspect for loose strands, then connect USB.
2. Confirm a game controller appears in Windows (`Get-PnpDevice -PresentOnly` or the Game Controllers control panel).
3. Open Pi Arcade → Settings → Controller test & calibration.
4. Select **Begin connector calibration**.
5. Activate exactly the requested labeled control, then release it. The wizard records the actual Gamepad API button or axis code.
6. Complete all 14 controls and select **Save verified mapping**.
7. Reopen the screen and press each control once. Confirm only the expected entry lights.
8. Open MVCX's control preview and confirm the physical connector labels and fighting actions before launch.

### Raspberry Pi OS

1. Before launching Electron, identify the device with `lsusb` and `cat /proc/bus/input/devices`.
2. Install/use `evtest` or `jstest-gtk`, select only the TS-UAIB device, and exercise every direction and button.
3. Record the event code for each PCB label. Do not copy Windows button numbers; Linux/SDL numbering may differ.
4. Launch Pi Arcade and repeat its connector calibration in the Pi Electron build.
5. Launch MVCX, verify menu navigation first, then test all six attacks in Training or Versus mode.
6. Verify `ST` starts/accepts, `SE` opens the pause/back path, and exiting returns focus to Pi Arcade.

## Verification status

- Physical label meanings: documented.
- Exact five-pin `J4` order/orientation: **unverified; do not use in this plan**.
- Windows HID identity and button codes: **not detected at implementation time; calibration required with the encoder connected**.
- Raspberry Pi HID/SDL codes: **requires Pi hardware**.
- MVCX logical actions: configured per game; K7/K8 remain available for other game profiles.

Sources: the [board-family manual](https://manuals.plus/ae/3256807057190643), the [documented zero-delay HID/pinout investigation](https://www.s-config.com/zero-delay-usb-joystick-encoder/comment-page-2/), and a [matching PCB-label wiring discussion](https://forum.arcadecontrols.com/index.php?topic=158240.0).
