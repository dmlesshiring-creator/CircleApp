# ✅ EAS CLI Installed! Now Deploy Your App

## Step 1: Open a NEW Terminal Window

**Important**: Close this terminal and open a NEW one so it recognizes the `eas` command.

### How to Open New Terminal:
- **VS Code**: Click Terminal → New Terminal
- **Windows**: Press `Win + R`, type `cmd`, press Enter
- **Git Bash**: Open Git Bash from Start menu

---

## Step 2: Verify EAS CLI

In the NEW terminal, run:

```bash
eas --version
```

You should see something like:
```
eas-cli/14.2.0 win32-x64 node-v20.x.x
```

✅ If you see a version number, continue!
❌ If you see "command not found", run: `npm install -g eas-cli` again

---

## Step 3: Login to Expo

### If you have an Expo account:

```bash
eas login
```

Enter your username and password.

### If you DON'T have an Expo account:

```bash
npx expo register
```

Fill in:
- **Username**: (choose a username, e.g., "ananya-circles")
- **Email**: your-email@example.com
- **Password**: (choose a strong password)

Then login:
```bash
eas login
```

You should see:
```
✔ Logged in as your-username
```

---

## Step 4: Navigate to Project

```bash
cd C:\CirclesApp\circles
```

---

## Step 5: Configure EAS (First Time Setup)

```bash
eas build:configure
```

**Answer the questions:**

1. **"Would you like to automatically create an EAS project?"**
   - Type: `Y`
   - Press Enter

2. **"Generate a new Android Keystore?"**
   - Type: `Y`
   - Press Enter

You'll see:
```
✔ Created EAS project
✔ Generated Android credentials
✔ Updated app.json
```

---

## Step 6: BUILD YOUR APK! 🚀

```bash
eas build --platform android --profile preview
```

**What happens:**

1. **Uploading** (2 minutes):
   ```
   ✔ Compressing project files
   ✔ Uploading to EAS Build
   ```

2. **Queued** (0-5 minutes):
   ```
   ⏱️  Build queued...
   ```

3. **Building** (10-15 minutes):
   ```
   🔨 Building...
   📦 Installing dependencies...
   🔧 Compiling Android app...
   ```

4. **DONE!** ✅
   ```
   ✔ Build finished
   
   📱 Download APK:
   https://expo.dev/artifacts/eas/abc123xyz.apk
   
   🔗 Build details:
   https://expo.dev/accounts/yourname/projects/circles/builds/abc123
   ```

**COPY THAT LINK!** That's your APK download link!

---

## Step 7: Test Your APK

### On Your Android Phone:

1. Open the download link in your phone's browser
2. Download the APK (50-80 MB)
3. If prompted, enable "Install from unknown sources":
   - Settings → Security → Install unknown apps → Chrome → Allow
4. Install the APK
5. Open "Circles" app
6. Test it! 🎉

### Share with Friends:

Send them the download link via WhatsApp/Email/Telegram!

---

## 📋 Complete Command Sequence

**Copy and paste these one by one in a NEW terminal:**

```bash
# 1. Verify EAS is installed
eas --version

# 2. Login (or register first if needed)
eas login

# 3. Go to project
cd C:\CirclesApp\circles

# 4. Configure EAS (first time only)
eas build:configure

# 5. Build APK
eas build --platform android --profile preview
```

---

## ⏱️ Timeline

| Step | Time |
|------|------|
| Verify & Login | 2 min |
| Configure EAS | 2 min |
| Upload project | 2 min |
| Build APK | 10-15 min |
| **TOTAL** | **~20 min** |

---

## 🆘 Troubleshooting

### "eas: command not found" (even in new terminal)

**Solution 1**: Check npm global path
```bash
npm config get prefix
```

Should show something like: `C:\Users\YourName\AppData\Roaming\npm`

**Solution 2**: Add to PATH manually
1. Search "Environment Variables" in Windows
2. Edit "Path" variable
3. Add: `C:\Users\YourName\AppData\Roaming\npm`
4. Restart terminal

**Solution 3**: Use npx instead
```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

---

### "Build failed"

**Check logs:**
```bash
eas build:list
```

Click on the failed build URL to see detailed error logs.

**Common fixes:**
1. Make sure you're in the circles folder: `cd C:\CirclesApp\circles`
2. Check internet connection
3. Try again: `eas build --platform android --profile preview`

---

### "Invalid credentials"

**Solution:**
```bash
eas logout
eas login
```

Re-enter your username and password.

---

## ✅ Success Checklist

- [ ] Opened NEW terminal
- [ ] `eas --version` shows version number
- [ ] Logged in with `eas login`
- [ ] Navigated to `C:\CirclesApp\circles`
- [ ] Ran `eas build:configure` (first time only)
- [ ] Ran `eas build --platform android --profile preview`
- [ ] Build completed successfully
- [ ] Got download link
- [ ] Tested APK on phone
- [ ] Shared link with friends

---

## 🎉 After Your First Build

**You'll have:**
- ✅ A download link for your APK
- ✅ A build details page on expo.dev
- ✅ An app you can share with anyone
- ✅ Real testing on real devices

**Next steps:**
1. Test thoroughly on your phone
2. Share with 5-10 friends for feedback
3. Fix any bugs
4. Build again with: `eas build --platform android --profile preview`

---

## 💡 Pro Tip

**Keep the build page bookmarked!**

Your builds page: `https://expo.dev/accounts/your-username/projects/circles/builds`

You can always:
- Download APKs again
- See build history
- Check build logs
- Share links

---

## 🚀 Ready? Start Now!

**Open a NEW terminal and run:**

```bash
eas --version
eas login
cd C:\CirclesApp\circles
eas build:configure
eas build --platform android --profile preview
```

**In 20 minutes, you'll have your APK!** 🎉

---

## 📞 Need Help?

If stuck, check:
1. This guide's troubleshooting section
2. Build logs: `eas build:list`
3. Expo docs: https://docs.expo.dev/build/introduction/

**You've got this!** 💪
