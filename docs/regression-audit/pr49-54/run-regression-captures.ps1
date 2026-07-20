param(
  [string]$FixturePath = "docs\regression-audit\pr49-54\fixture\cote-particuliers-lovable-output.yaml",
  [string]$OutputRoot = "docs\regression-audit\pr49-54",
  [string]$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
)

$states = @(
  @{ Name = "pre-pr49"; Sha = "9eec8d7b0db67d7963ae2748d268d0d47cace5a6" },
  @{ Name = "pr49"; Sha = "6434117c03f25a6eb7a3c464e9fc462024acddbb" },
  @{ Name = "pr50"; Sha = "c0f4f7f354f67754c3a19fff499cece1baf8b1bb" },
  @{ Name = "pr51"; Sha = "898c803b946cc5e205002437f323dc590ff44e51" },
  @{ Name = "pr52"; Sha = "ec1ba0e16ebe2a144b157bf16df76b9ec823937c" },
  @{ Name = "pr53"; Sha = "01667d5dc77f170662d6d9c7099f14a1f2dfdd45" },
  @{ Name = "pr54"; Sha = "2042dddc2897f46fc4212a1a9ac7577a47887a90" },
  @{ Name = "current"; Sha = "origin/main" }
)

$shots = @(
  @{ Name = "mobile-390-full"; Width = 390; Height = 2200 },
  @{ Name = "mobile-390-hero"; Width = 390; Height = 900 },
  @{ Name = "mobile-390-properties"; Width = 390; Height = 1500 },
  @{ Name = "desktop-1440-hero"; Width = 1440; Height = 900 },
  @{ Name = "desktop-1440-properties"; Width = 1440; Height = 1500 }
)

if (-not (Test-Path $FixturePath)) {
  throw "Fixture exacte absente: $FixturePath. Importer le LovableOutput Cote Particuliers original avant de lancer l'audit visuel."
}

foreach ($state in $states) {
  $dir = Join-Path $OutputRoot $state.Name
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  "Etat $($state.Name) ($($state.Sha)) pret pour capture avec fixture $FixturePath" | Set-Content -Path (Join-Path $dir "README.txt")
}

Write-Host "Ce script prepare la matrice et refuse de capturer tant que l'import deterministic de la fixture dans chaque worktree n'est pas branche."
Write-Host "Chrome declare: $ChromePath"
Write-Host "Shots attendus:"
$shots | ForEach-Object { Write-Host "- $($_.Name): $($_.Width)x$($_.Height)" }
