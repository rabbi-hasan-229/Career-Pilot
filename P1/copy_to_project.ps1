# PowerShell script to copy P1 files into the project frontend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

Write-Host "Copying P1 Roadmap & Schedule files into frontend..." -ForegroundColor Cyan

Copy-Item -Path "$scriptDir\frontend\src\features\roadmap\*" -Destination "$rootDir\frontend\src\features\roadmap\" -Force -Recurse
Copy-Item -Path "$scriptDir\frontend\src\components\*" -Destination "$rootDir\frontend\src\components\" -Force -Recurse

Write-Host "Files successfully copied into frontend/src!" -ForegroundColor Green
Write-Host "You can now run: git add frontend/src/features/roadmap frontend/src/components" -ForegroundColor Yellow
