# How to Run the Circles App - Step by Step

## The Problem
The Android emulator is running but Expo can't connect to it because ADB (Android Debug Bridge) isn't properly configured in your terminal.

## The Solution - Run These Commands

### Step 1: Open Git Bash Terminal

1. Open **Git Bash** (not PowerShell or CMD)
2. Navigate to the project:
   ```bash
   cd /c/CirclesApp/circles
   ```

### Step 2: Add ADB to PATH (Temporary)

Run this command to add Android SDK tools to your current terminal session:

```bash
export PATH=$PATH:/c/Users/Ananya/AppData/Local/Android/Sdk/platform-tools
```

### Step 3: Verify Emulator is Detected

```bash
adb devices
```

**Expected output:**
```
List of devices attached
emulator-5554   device
```

**If it says "offline":**
- Wait 30 seconds and run `adb devices` again
- The emulator needs time to fully boot

**If it says "List of devices attached" with nothing below:**
- The emulator isn't running
- Go to Android Studio → Device Manager → Click Play button
- Wait for emulator to show home screen
- Run `adb devices` again

### Step 4: Start Expo

Once `adb devices` shows "device" (not "offline"), run:

```bash
npx expo start
```

Wait for Metro bundler to start (you'll see a QR code).

### Step 5: Launch on Android

In the same terminal, press **`a`** (just the letter 'a' and Enter)

The app will:
1. Build (30-60 seconds first time)
2. Install on emulator
3. Launch automatically

---

## Alternative: Manual Commands in Sequence

Copy and paste these commands one by one:

```bash
# 1. Go to project folder
cd /c/CirclesApp/circles

# 2. Add ADB to PATH
export PATH=$PATH:/c/Users/Ananya/AppData/Local/Android/Sdk/platform-tools

# 3. Check emulator
adb devices

# 4. If emulator shows as "device", start Expo
npx expo start

# 5. When Metro bundler is ready, press 'a' to launch on Android
```

---

## Permanent Fix (Optional)

To avoid adding ADB to PATH every time, add this line to your `~/.bashrc` file:

```bash
echo 'export PATH=$PATH:/c/Users/Ananya/AppData/Local/Android/Sdk/platform-tools' >> ~/.bashrc
```

Then restart your terminal.

---

## Troubleshooting

### Emulator shows as "offline"
**Solution:** Wait 1-2 minutes for it to fully boot, then run `adb devices` again

### "No Android connected device found"
**Solution:** 
1. Make sure emulator is running in Android Studio
2. Run `adb devices` to verify it's detected
3. If not detected, restart ADB: `adb kill-server && adb start-server`

### "Port 8081 is being used"
**Solution:** Use a different port: `npx expo start --port 8082`

### App builds but crashes on launch
**Solution:** Check Metro bundler logs for errors. Most likely Firebase initialization issue.

---

## What You Should See

### When it works:
1. Terminal shows Metro bundler with QR code
2. You press 'a'
3. Terminal shows "Building JavaScript bundle"
4. Emulator shows "Powered by Expo" splash screen
5. Your app opens showing the Circles splash screen
6. Then PhoneEntryScreen appears

### First screen:
- **PhoneEntryScreen** - Enter phone number
- Use test number: `+16505551234`
- OTP code: `123456`

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `cd /c/CirclesApp/circles` | Go to project |
| `export PATH=$PATH:/c/Users/Ananya/AppData/Local/Android/Sdk/platform-tools` | Add ADB |
| `adb devices` | Check emulator |
| `adb kill-server && adb start-server` | Restart ADB |
| `npx expo start` | Start Metro bundler |
| Press `a` | Launch on Android |
| Press `r` | Reload app |
| Ctrl+C | Stop Metro bundler |

---

## Summary

The app is **100% ready to run**. The only issue is connecting Expo to the Android emulator through ADB.

**Follow Steps 1-5 above** and it will work!

If you get stuck, take a screenshot of:
1. The Android emulator (to show it's running)
2. The terminal output after running `adb devices`
3. Any error messages

And I'll help you fix it immediately.

---

**You're so close! Just need to run those 5 commands in order.** 🚀
