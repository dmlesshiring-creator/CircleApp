#!/bin/bash

# Add ADB to PATH
export PATH=$PATH:"/c/Users/Ananya/AppData/Local/Android/Sdk/platform-tools"

echo "Checking for Android devices..."
adb devices

echo ""
echo "Starting Expo..."
npx expo start --android
