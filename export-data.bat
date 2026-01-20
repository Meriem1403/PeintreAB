@echo off
REM Script Windows pour exporter les données
echo 📦 Export des données de la base de données...
cd backend
call npm run export-data
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Export terminé avec succès !
    echo 📁 Fichier créé : data-export.json
) else (
    echo.
    echo ❌ Erreur lors de l'export
    exit /b 1
)
