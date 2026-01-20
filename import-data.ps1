# Script PowerShell pour importer les données
# Usage: .\import-data.ps1 [chemin_vers_fichier.json] [-Clear]

param(
    [string]$ImportFile = "data-export.json",
    [switch]$Clear
)

if ($Clear) {
    Write-Host "🗑️  Mode: Remplacement des données existantes" -ForegroundColor Yellow
} else {
    Write-Host "➕ Mode: Ajout des données (sans remplacer)" -ForegroundColor Cyan
}

Write-Host "📦 Import des données depuis: $ImportFile" -ForegroundColor Cyan
Write-Host ""

Set-Location backend

if ($Clear) {
    node migrations/importData.js "..\$ImportFile" --clear
} else {
    node migrations/importData.js "..\$ImportFile"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Import terminé avec succès !" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'import" -ForegroundColor Red
    exit 1
}

Set-Location ..
