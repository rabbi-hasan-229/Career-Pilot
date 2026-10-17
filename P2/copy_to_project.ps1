# PowerShell script to copy P2 files into the project frontend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

Write-Host "Copying P2 Career, Objectives & Dashboard files into frontend..." -ForegroundColor Cyan

Copy-Item -Path "$scriptDir\frontend\src\features\roadmap\*" -Destination "$rootDir\frontend\src\features\roadmap\" -Force
Copy-Item -Path "$scriptDir\frontend\src\features\onboarding\*" -Destination "$rootDir\frontend\src\features\onboarding\" -Force
Copy-Item -Path "$scriptDir\frontend\src\components\*" -Destination "$rootDir\frontend\src\components\" -Force

Write-Host "Files successfully copied into frontend/src!" -ForegroundColor Green
Write-Host "You can now run: git add frontend/src/features/roadmap frontend/src/features/onboarding frontend/src/components" -ForegroundColor Yellow
