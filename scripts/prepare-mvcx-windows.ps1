param(
  [string]$Archive = 'C:\Users\kingp\Downloads\marvel-vs-capcom-x-3-0-final-update.rar',
  [string]$Destination = "$env:USERPROFILE\Games\Arcade\Marvel vs Capcom X 3.0",
  [string]$ExpectedArchiveSha256 = 'cb20d3cdc84abfd1e74aee91465f5b4aff4eacc5e43e7bcc5cdffe33f03fc0ec'
)
$ErrorActionPreference = 'Stop'
$engineVersion = 'v1.0.0'
$engineSha256 = '9338eaeb68599ceb13b0867819a091ea3f92eba58077e800b4540b7a1f9c3731'
$engineUrl = "https://github.com/ikemen-engine/Ikemen-GO/releases/download/$engineVersion/Ikemen_GO-$engineVersion-windows.zip"
if (!(Test-Path -LiteralPath $Archive -PathType Leaf)) { throw "Archive not found: $Archive" }
if (Test-Path -LiteralPath $Destination) { throw "Destination must not already exist: $Destination" }
$actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $Archive).Hash.ToLowerInvariant()
if ($ExpectedArchiveSha256 -and $actual -ne $ExpectedArchiveSha256.ToLowerInvariant()) { throw "Archive SHA-256 mismatch. Expected $ExpectedArchiveSha256, got $actual" }
$entries = @(tar -tf $Archive)
if (!$entries.Count) { throw 'Archive contains no entries or could not be read.' }
$unsafe = @($entries | Where-Object { $_ -match '(^|[\\/])\.\.([\\/]|$)' -or $_ -match '^[\\/]' -or $_ -match '^[A-Za-z]:' })
if ($unsafe.Count) { throw "Unsafe archive member path: $($unsafe[0])" }
if (Get-Command Start-MpScan -ErrorAction SilentlyContinue) {
  Start-MpScan -ScanType CustomScan -ScanPath $Archive
  $hits = @(Get-MpThreatDetection | Where-Object { ($_.Resources -join "`n") -like "*$Archive*" })
  if ($hits.Count) { throw 'Microsoft Defender reported a threat for the archive.' }
}
$temp = Join-Path ([IO.Path]::GetTempPath()) ("pi-arcade-mvcx-" + [guid]::NewGuid().ToString('N'))
$engineZip = Join-Path $temp 'ikemen.zip'; $engineRoot = Join-Path $temp 'engine'; $gameRoot = Join-Path $temp 'game'
New-Item -ItemType Directory -Path $engineRoot,$gameRoot,$Destination | Out-Null
try {
  tar -xf $Archive -C $gameRoot
  if ($LASTEXITCODE -ne 0) { throw "RAR extraction/integrity test failed with exit code $LASTEXITCODE" }
  $source = Get-ChildItem -LiteralPath $gameRoot -Directory | Select-Object -First 1
  if (!$source -or !(Test-Path -LiteralPath (Join-Path $source.FullName 'data\mugen1\system.def'))) { throw 'Expected MUGEN data tree was not found.' }
  Invoke-WebRequest -UseBasicParsing -Uri $engineUrl -OutFile $engineZip
  $downloadHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $engineZip).Hash.ToLowerInvariant()
  if ($downloadHash -ne $engineSha256) { throw "Ikemen archive SHA-256 mismatch: $downloadHash" }
  Expand-Archive -LiteralPath $engineZip -DestinationPath $engineRoot
  robocopy $engineRoot $Destination /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -gt 7) { throw "Ikemen copy failed: $LASTEXITCODE" }
  robocopy $source.FullName $Destination /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -gt 7) { throw "Game asset copy failed: $LASTEXITCODE" }
  @{schema=1;gameId='mugen:marvel-vs-capcom-x-3-0';sourceArchiveSha256=$actual;engine='Ikemen GO';engineVersion=$engineVersion;engineArchiveSha256=$engineSha256;redistributable=$false} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $Destination '.pi-arcade-mvcx.json') -Encoding utf8
  if (Get-Command Start-MpScan -ErrorAction SilentlyContinue) { Start-MpScan -ScanType CustomScan -ScanPath $Destination }
  Write-Host "Prepared MVCX installation: $Destination"
} finally {
  if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
}
