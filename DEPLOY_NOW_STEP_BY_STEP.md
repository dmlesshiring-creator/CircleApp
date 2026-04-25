# 🚀 Deploy Circles App - Step by Step

## You're About to Build Your First APK!

In 20 minutes, you'll have a download link to share with anyone for testing.

---

## Step 1: Install EAS CLI

Open a **new terminal** (not the one running Metro) and run:

```bash
npm install -g eas-cli
```

**Wait for it to complete.** You'll see:
```
added 1 package in 5s
```

---

## Step 2: Create Expo Account (if you don't have one)

### Option A: If you already have an Expo account
```bash
eas login
```

Enter your username and password.

### Option B: If you need to create an account
```bash
npx expo register
```

Fill in:
- Username: (choose a username)
- Email: your-email@example.com
- Password: (choose a strong password)

Then login:
```bash
eas login
```

---

## Step 3: Navigate to Your Project

```bash
cd C:\CirclesApp\circles
```

---

## Step 4: Configure EAS (First Time Only)

```bash
eas build:configure
```

**You'll be asked some questions:**

1. **"Would you like to automatically create an EAS project for @your-username/circles?"**
   - Type: `Y` (Yes)
   - Press Enter

2. **"Generate a new Android Keystore?"**
   - Type: `Y` (Yes)
   - Press Enter

**This will**:
- Create an EAS project
- Link it to your Expo account
- Generate signing keys for Android
- Update your app.json with project ID

---

## Step 5: Build Your APK! 🎉

```bash
eas build --platform android --profile preview
```

**What happens now:**

1. **Uploading project** (1-2 minutes)
   ```
   ✔ Compressing project files
   ✔ Uploading to EAS Build
   ```

2. **Queued for build** (0-5 minutes)
   ```
   ⏱️  Build queued...
   ```

3. **Building** (10-15 minutes)
   ```
   🔨 Building...
   Installing dependencies...
   Compiling Android app...
   ```

4. **Build complete!** ✅
   ```
   ✔ Build finished
   
   📱 Install and run the app:
   https://expo.dev/artifacts/eas/abc123xyz.apk
   
   🔗 Build details:
   https://expo.dev/accounts/yourname/projects/circles/builds/abc123
   ```

**COPY THAT DOWNLOAD LINK!** That's your APK!

---

## Step 6: Test Your APK

### On Your Phone:

1. **Open the download link** on your Android phone
2. **Download the APK** (it's about 50-80 MB)
3. **Enable "Install from unknown sources"** if prompted:
   - Settings → Security → Unknown sources → Enable
   - Or: Settings → Apps → Special access → Install unknown apps → Chrome → Allow
4. **Install the APK**
5. **Open Circles app**
6. **Test it!** 🎉

### Share with Others:

Just send them the download link via:
- WhatsApp
- Email
- Telegram
- SMS

They follow the same steps to install!

---

## 🎯 Expected Timeline

| Step | Time | What You'll See |
|------|------|-----------------|
| Install EAS CLI | 1 min | `added 1 package` |
| Login/Register | 2 min | `Logged in as username` |
| Configure EAS | 2 min | `Project created` |
| Upload project | 2 min | `✔ Uploading to EAS Build` |
| Queue time | 0-5 min | `⏱️ Build queued` |
| Build time | 10-15 min | `🔨 Building...` |
| **Total** | **~20 min** | **Download link!** |

---

## 📱 What You'll Get

**Download Link Example:**
```
https://expo.dev/artifacts/eas/a1b2c3d4e5f6.apk
```

**Build Details Page:**
```
https://expo.dev/accounts/yourname/projects/circles/builds/abc123
```

From the build details page, you can:
- Download the APK
- See build logs
- Share the link
- View build status

---

## 🆘 Troubleshooting

### "eas: command not found"

**Solution:**
```bash
npm install -g eas-cli
```

Then close and reopen your terminal.

---

### "Project not configured"

**Solution:**
```bash
cd C:\CirclesApp\circles
eas build:configure
```

---

### "Build failed"

**Check the logs:**
```bash
eas build:list
```

Click on the failed build to see error details.

**Common fixes:**
1. Make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. Check for syntax errors:
   ```bash
   npx expo start --check
   ```

3. Try again:
   ```bash
   eas build --platform android --profile preview
   ```

---

### "APK won't install on phone"

**Solutions:**
1. Enable "Install from unknown sources"
2. Check Android version (need Android 6.0+)
3. Free up storage space (need ~200 MB)
4. Uninstall old version first

---

## 📋 Quick Command Reference

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Navigate to project
cd C:\CirclesApp\circles

# Configure (first time only)
eas build:configure

# Build APK
eas build --platform android --profile preview

# Check build status
eas build:list

# View specific build
eas build:view [build-id]
```

---

## 🎬 After Your First Build

### Test Thoroughly:
- ✅ Sign up with email
- ✅ Create a circle
- ✅ Send messages
- ✅ Create plans
- ✅ Upload photos
- ✅ Test all features

### Share with Friends:
- Send download link to 5-10 friends
- Ask them to test
- Collect feedback

### Fix Bugs:
- Make code changes
- Build again:
  ```bash
  eas build --platform android --profile preview
  ```
- Share new link

---

## 💡 Pro Tips

1. **Keep Metro running** - Don't close the Expo server, open a new terminal for EAS

2. **Build takes time** - First build is slower, subsequent builds are faster

3. **Save the link** - Bookmark your build page for easy access

4. **Version numbers** - Update version in app.json before each build:
   ```json
   "version": "1.0.1",
   "android": {
     "versionCode": 2
   }
   ```

5. **Check builds** - View all your builds at: https://expo.dev/

---

## ✅ Success Checklist

- [ ] EAS CLI installed
- [ ] Logged into Expo account
- [ ] Project configured with `eas build:configure`
- [ ] Build started with `eas build --platform android --profile preview`
- [ ] Build completed successfully
- [ ] Download link received
- [ ] APK tested on phone
- [ ] App works correctly
- [ ] Link shared with testers

---

## 🚀 Ready? Let's Go!

**Open a NEW terminal** (keep Metro running in the other one) and run:

```bash
npm install -g eas-cli
eas login
cd C:\CirclesApp\circles
eas build:configure
eas build --platform android --profile preview
```

**Then wait ~20 minutes and you'll have your APK!** 🎉

---

## 📞 Need Help?

If you get stuck:
1. Check the error message
2. Look at build logs: `eas build:list`
3. Try the troubleshooting section above
4. Check Expo docs: https://docs.expo.dev/build/introduction/

**You've got this!** 💪
