@echo off
REM This script increments the version number in index.html to force cache refresh
REM Run this after making changes to JavaScript or CSS files

echo Bumping version number...

REM Get current timestamp as version
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set version=%datetime:~0,14%

REM Update version in index.html using PowerShell
powershell -Command "(Get-Content index.html) -replace 'v=[0-9.]+', 'v=%version%' | Set-Content index.html"

echo Version updated to: %version%
echo Cache will be refreshed on next page load.
pause
