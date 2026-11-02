# Marvel vs. Capcom X 3.0 integration

The original archive is a Windows MUGEN 1.0 distribution. Its executable is an unsigned 32-bit x86 PE and is never used on Raspberry Pi. The launcher runs user-supplied game assets with the open-source Ikemen GO engine instead.

## Verified source identity and safety boundary

- Archive SHA-256: `cb20d3cdc84abfd1e74aee91465f5b4aff4eacc5e43e7bcc5cdffe33f03fc0ec`
- 1,811 archive entries; no absolute or parent-traversal paths
- Microsoft Defender found no detection in the archive or extracted tree using signatures `1.461.215.0` on 2026-10-26
- Original engine: unsigned PE32 x86 MUGEN, SHA-256 `e7d31a8c1fcdfb88d214e42bee5c61e62e21049ef4fd5562e8abdb6439a74151`
- Windows compatibility engine: official Ikemen GO v1.0.0 ZIP, SHA-256 `9338eaeb68599ceb13b0867819a091ea3f92eba58077e800b4540b7a1f9c3731`

Antivirus scanning reduces risk but is not a proof of safety. The launcher does not execute the archive's MUGEN executable, DLLs, ASI hook, or authoring utilities on the Pi.

## Controls

The character command files establish the six logical MUGEN controls: `x/y/z` are light/medium/heavy punch and `a/b/c` are light/medium/heavy kick. Tag is `z+c`; assist is `y+b`. Pi Arcade maps B1-B6 in that order and leaves B7-B8 unused. It writes both Ikemen keyboard and SDL controller sections before every launch. Because USB encoder SDL mappings vary, verify the actual encoder once on Pi hardware; keyboard-mode encoders use the generated key map directly.

## Installation

On Windows, run `powershell -ExecutionPolicy Bypass -File scripts/prepare-mvcx-windows.ps1`, then scan the destination's parent folder in Pi Arcade.

On Raspberry Pi OS 64-bit, transfer only the extracted game tree you are authorized to use, install Go 1.27+, then run `bash scripts/install-mvcx-pi.sh /path/to/Marvel-vs-Capcom-X-root`. The script builds the pinned Ikemen GO v1.0.0 ARM64 target locally and excludes Windows executables, DLLs, ASI files, and legacy tools from the Pi installation.

## Redistribution and permissions

Ikemen GO is open source under its upstream licenses, but the Marvel and Capcom names, characters, audiovisual assets, screenpack, stages, music, and community character packs have separate copyrights and no blanket redistribution permission was found in this archive. The bundled license texts cover engine libraries, not the complete game content. Therefore the game tree, archive, compatible installation, screenshots containing copyrighted assets, and derived asset bundle must not be committed, uploaded, or included in releases without written permission from every relevant rightsholder and contributor. The repository contains only integration code and preparation instructions.

## Known compatibility boundary

Ikemen supports MUGEN resources and has an official `LinuxARM` build target. MugenHook is Windows-specific and does not load; most hook features are disabled in this pack, but its tag-mode menu patch is enabled. The characters also contain their own tag and assist states, so fights may work while menu flow or presentation differs. Case-sensitive filename mismatches and character-specific engine quirks still require Pi hardware playtesting.

The Windows Ikemen motif load reports missing definitions for `Deadpool MvsC2/Deadpool MvsC2_unotag.def` and `CvS_Ultron`, along with placeholder/template roster lines and several nonfatal screenpack parser warnings. The remaining roster loads and the engine stays running. These upstream content defects are not replaced with unlicensed downloads.
