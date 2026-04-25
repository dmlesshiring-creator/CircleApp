@echo off
echo ========================================
echo   Link Circles App to Expo Account
echo ========================================
echo.
echo This will link your project to Expo so you can build from the website!
echo.
pause

cd /d "%~dp0"

echo.
echo Step 1: Logging in to Expo...
call npx eas-cli login

echo.
echo Step 2: Configuring project...
call npx eas-cli build:configure

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Now you can:
echo 1. Go to: https://expo.dev/accounts/[your-username]/projects/circles
echo 2. Click "Build" button
echo 3. Select "Android" and "Preview"
echo 4. Wait 15-20 minutes
echo 5. Download your APK!
echo.
pause
