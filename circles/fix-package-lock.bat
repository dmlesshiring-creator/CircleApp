@echo off
echo Fixing package-lock.json...
cd /d "%~dp0"
del package-lock.json
npm install
echo Done!
pause
