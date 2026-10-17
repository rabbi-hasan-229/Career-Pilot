@echo off
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..\

echo Copying P1 Roadmap and Schedule files into frontend...
xcopy /E /Y /I "%SCRIPT_DIR%frontend\src\features\roadmap\*" "%ROOT_DIR%frontend\src\features\roadmap\"
xcopy /E /Y /I "%SCRIPT_DIR%frontend\src\components\*" "%ROOT_DIR%frontend\src\components\"

echo.
echo [SUCCESS] Files copied successfully into frontend!
echo Run git add and commit as instructed in P1\README.md.
pause
