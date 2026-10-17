@echo off
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..\

echo Copying P2 Career, Objectives & Dashboard files into frontend...
xcopy /E /Y /I "%SCRIPT_DIR%frontend\src\features\roadmap\*" "%ROOT_DIR%frontend\src\features\roadmap\"
xcopy /E /Y /I "%SCRIPT_DIR%frontend\src\features\onboarding\*" "%ROOT_DIR%frontend\src\features\onboarding\"
xcopy /E /Y /I "%SCRIPT_DIR%frontend\src\components\*" "%ROOT_DIR%frontend\src\components\"

echo.
echo [SUCCESS] Files copied successfully into frontend!
echo Run git add and commit as instructed in P2\README.md.
pause
