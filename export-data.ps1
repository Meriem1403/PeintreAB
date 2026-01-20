# Script PowerShell pour exporter les données
Write-Host "📦 Export des données de la base de données..." -ForegroundColor Cyan
Write-Host ""

Set-Location backend

npm run export-data

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Export terminé avec succès !" -ForegroundColor Green
    Write-Host "📁 Fichier créé : data-export.json" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'export" -ForegroundColor Red
    exit 1
}

Set-Location ..
