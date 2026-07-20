param(
  [string]$BaseUrl = "http://127.0.0.1:4174",
  [string]$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe",
  [string]$OutputRoot = "docs\visual-audit\golden"
)

$demos = @(
  @{ Slug = "cote-particuliers-tarbes"; Route = "/golden/cote-particuliers-tarbes" },
  @{ Slug = "commercial-real"; Route = "/golden/commercial-real" }
)
$shots = @(
  @{ Name = "desktop-1440-full"; Width = 1440; Height = 2400 },
  @{ Name = "desktop-1440-hero"; Width = 1440; Height = 900 },
  @{ Name = "desktop-1440-cards"; Width = 1440; Height = 1600 },
  @{ Name = "desktop-1440-footer"; Width = 1440; Height = 2600 },
  @{ Name = "mobile-390-full"; Width = 390; Height = 2200 },
  @{ Name = "mobile-390-hero"; Width = 390; Height = 900 },
  @{ Name = "mobile-390-cards"; Width = 390; Height = 1600 },
  @{ Name = "mobile-390-navigation"; Width = 390; Height = 900 },
  @{ Name = "mobile-390-footer"; Width = 390; Height = 2200 }
)

foreach ($demo in $demos) {
  $outputDir = Join-Path $OutputRoot "$($demo.Slug)\sd"
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
  foreach ($shot in $shots) {
    $file = Join-Path $outputDir "$($shot.Name).png"
    & $ChromePath --headless --disable-gpu --hide-scrollbars --window-size="$($shot.Width),$($shot.Height)" --screenshot="$file" "$BaseUrl$($demo.Route)?golden=$($shot.Name)"
    if ($LASTEXITCODE -ne 0) {
      throw "Capture failed for $($demo.Slug) $($shot.Name)"
    }
  }
}
