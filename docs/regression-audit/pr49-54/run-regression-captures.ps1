param(
  [string]$FixturePath = "src\golden-demos\cote-particuliers-tarbes\lovable-output.yaml"
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

if (-not (Test-Path $FixturePath)) {
  throw "Fixture exacte absente: $FixturePath. Importer le LovableOutput original Cote Particuliers avant de lancer l'audit."
}

foreach ($state in $states) {
  New-Item -ItemType Directory -Force -Path "docs\regression-audit\pr49-54\$($state.Name)" | Out-Null
  New-Item -ItemType Directory -Force -Path "docs\regression-audit\pr49-54\diagnostics" | Out-Null
}

Write-Host "Fixture presente. Lancement de la matrice a implementer avec worktrees propres."
