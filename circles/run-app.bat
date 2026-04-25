@echo off
echo Setting up Android SDK path...
set PATH=%PATH%;C:\Users\Ananya\AppData\Local\Android\Sdk\platform-tools

echo Checking for Android devices...
adb devices

echo.
echo Starting Expo...
npx expo start --android
