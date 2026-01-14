@echo off
echo ========================================
echo   UE5 Material Editor - Lint Check
echo ========================================
echo.
echo Running ESLint...
echo.
npx eslint . --ext .js
echo.
echo ========================================
echo   Lint check complete!
echo ========================================
pause
