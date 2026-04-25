@echo off
set ANDROID_HOME=C:\Users\Ananya\AppData\Local\Android\Sdk
set PATH=%PATH%;C:\Users\Ananya\AppData\Local\Android\Sdk\platform-tools
cd /d C:\CirclesApp\circles
npx expo start --android
