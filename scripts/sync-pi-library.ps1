param(
  [string]$PiHost = 'isaiah@10.0.0.219',
  [string]$Source = 'C:\Users\kingp\Downloads\Arcade-Game-Library\Prepared-Games',
  [string]$Remote = '/home/isaiah/Arcade-Game-Library/Prepared-Games',
  [string]$KeyPath = "$env:USERPROFILE\.ssh\pi_arcade_codex",
  [switch]$UpdateApplication,
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
if (!(Test-Path -LiteralPath $Source -PathType Container)) { throw "Prepared game directory is missing: $Source" }
if (!(Test-Path -LiteralPath $KeyPath -PathType Leaf)) { throw "SSH key is missing: $KeyPath" }

$manifestName = '.pi-arcade-sync-manifest.json'
$files = Get-ChildItem -LiteralPath $Source -File -Recurse | Where-Object Name -ne $manifestName
$items = foreach ($file in $files) {
  $relative = [IO.Path]::GetRelativePath($Source, $file.FullName).Replace('\','/')
  [pscustomobject]@{ path = $relative; size = $file.Length; sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName).Hash.ToLowerInvariant() }
}
$local = [ordered]@{ schema = 1; generatedAt = (Get-Date).ToUniversalTime().ToString('o'); items = @($items) }
$temp = Join-Path ([IO.Path]::GetTempPath()) ('pi-arcade-sync-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp | Out-Null
try {
  $remoteManifest = Join-Path $temp 'remote.json'
  & scp -q -i $KeyPath -o BatchMode=yes -o ConnectTimeout=8 "${PiHost}:$Remote/$manifestName" $remoteManifest 2>$null
  $known = @{}
  if ($LASTEXITCODE -eq 0 -and (Test-Path -LiteralPath $remoteManifest)) {
    foreach ($item in (Get-Content -Raw -LiteralPath $remoteManifest | ConvertFrom-Json).items) { $known[$item.path] = $item.sha256 }
  }
  $changed = @($items | Where-Object { $known[$_.path] -ne $_.sha256 })
  Write-Host "Prepared files: $($items.Count); changed/new: $($changed.Count); unchanged: $($items.Count-$changed.Count)"
  if ($DryRun) { $changed.path; return }

  $batch = Join-Path $temp 'upload.sftp'
  $commands = [Collections.Generic.List[string]]::new()
  $commands.Add("-mkdir `"$Remote`"")
  $directories = $changed.path | ForEach-Object { [IO.Path]::GetDirectoryName($_).Replace('\','/') } | Where-Object { $_ } | Sort-Object -Unique
  foreach ($directory in $directories) {
    $current = $Remote
    foreach ($part in $directory.Split('/')) { $current += "/$part"; $commands.Add("-mkdir `"$current`"") }
  }
  foreach ($item in $changed) {
    $sourceFile = Join-Path $Source $item.path
    $commands.Add("put -p `"$sourceFile`" `"$Remote/$($item.path)`"")
  }
  $manifestFile = Join-Path $temp $manifestName
  $local | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestFile -Encoding utf8
  $commands.Add("put -p `"$manifestFile`" `"$Remote/$manifestName`"")
  $commands | Set-Content -LiteralPath $batch -Encoding utf8
  & sftp -q -i $KeyPath -o BatchMode=yes -b $batch $PiHost
  if ($LASTEXITCODE -ne 0) { throw "SFTP synchronization failed with exit code $LASTEXITCODE" }
  if ($UpdateApplication) {
    & ssh -i $KeyPath -o BatchMode=yes $PiHost 'cd /home/isaiah/pi-arcade && git pull --ff-only && npm ci && npm test && npm run package:pi:dir'
    if ($LASTEXITCODE -ne 0) { throw "Application update failed with exit code $LASTEXITCODE" }
  }
  Write-Host "Synchronization complete. No remote files were deleted."
} finally {
  Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
}
