param(
  [string]$BaseUrl = "http://127.0.0.1:4174/demo/template-immobilier",
  [string]$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe",
  [string]$OutputDir = "docs\visual-audit\pr55\premium\sd"
)

$viewports = @(1440, 1280, 1024, 768, 430, 390, 375, 320)

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

foreach ($width in $viewports) {
  $height = if ($width -ge 1024) { 2200 } else { 1800 }
  $kind = if ($width -ge 1024) { "desktop" } else { "mobile" }
  $file = Join-Path $OutputDir "$kind-$width-current-sd.png"
  & $ChromePath --headless --disable-gpu --hide-scrollbars --window-size="$width,$height" --screenshot="$file" "$BaseUrl?pr55=$width"
}
