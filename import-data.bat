@echo off
REM Script Windows pour importer les données
REM Usage: import-data.bat [chemin_vers_fichier.json] [--clear]

set IMPORT_FILE=%1
if "%IMPORT_FILE%"=="" set IMPORT_FILE=data-export.json

set CLEAR_FLAG=%2
if "%CLEAR_FLAG%"=="--clear" (
    echo 🗑️  Mode: Remplacement des données existantes
) else (
    echo ➕ Mode: Ajout des données (sans remplacer)
)

echo 📦 Import des données depuis: %IMPORT_FILE%
cd backend

if "%CLEAR_FLAG%"=="--clear" (
    call node migrations/importData.js ..\%IMPORT_FILE% --clear
) else (
    call node migrations/importData.js ..\%IMPORT_FILE%
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Import terminé avec succès !
) else (
    echo.
    echo ❌ Erreur lors de l'import
    exit /b 1
)
