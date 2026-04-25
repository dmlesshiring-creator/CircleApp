# 🚀 Build and Deploy Circles App - Step by Step Guide

## ✅ What I've Set Up For You

1. **eas.json** - Build configuration with 3 profiles:
   - `development` - For development builds with debugging
   - `preview` - For testing (APK format, easy to share)
   - `production` - For Play Store submission (AAB format)

2. **app.json** - Updated with:
   - Android package name: `com.circles.app`
   - iOS bundle identifier: `com.circles.app`
   - Version code: 1
   - Required permissions (Camera, Storage, Notifications)

---

## 📱 OPTION 1: Quick Testing (FREE - Recommended to Start)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

If you don't have an Expo account:
```bash
npx expo register
```

Then login:
```bash
eas login
```

### Step 3: Configure Your Project

```bash
cd circles
eas build:configure
```

This will:
- Link your project to Expo
- Add project ID to app.json
- Set up build credentials

### Step 4: Build Android APK (Preview Build)

```bash
eas build --platform android --profile preview
```

**What happens**:
- ⏱️ Takes 10-20 minutes
- ☁️ Builds on Expo's servers (no need for Android Studio!)
- 📦 Creates APK file
- 🔗 Gives you a download link

**Example output**:
```
✔ Build finished
https://expo.dev/accounts/yourname/projects/circles/builds/abc123

Download: https://expo.dev/artifacts/eas/abc123.apk
```

### Step 5: Share with Testers

1. Copy the download link
2. Send to testers via WhatsApp/Email
3. They download APK on Android phone
4. Enable "Install from unknown sources" in Settings
5. Install and test!

---

## 🏪 OPTION 2: Google Play Internal Testing (Professional)

### Prerequisites:
- Google Play Developer account ($25 one-time)
- Completed app information

### Step 1: Create Google Play Developer Account

1. Go to: https://play.google.com/console
2. Pay $25 registration fee
3. Complete account setup

### Step 2: Create App in Play Console

1. Click "Create app"
2. Fill in:
   - App name: **Circles**
   - Default language: **English (India)**
   - App type: **App**
   - Free or paid: **Free**
3. Accept declarations
4. Click "Create app"

### Step 3: Set Up App Details

**Store Listing**:
- App name: Circles
- Short description: Stay connected with your closest circles
- Full description: (Write compelling description)
- App icon: Upload 512x512 PNG
- Screenshots: Upload 2-8 screenshots

**Content Rating**:
- Complete questionnaire
- Get rating certificate

**Target Audience**:
- Age group: 13+
- Target countries: India (or worldwide)

### Step 4: Build Production AAB

```bash
cd circles
eas build --platform android --profile production
```

This creates an **AAB** (Android App Bundle) file - required for Play Store.

### Step 5: Upload to Internal Testing

1. In Play Console, go to **Testing → Internal testing**
2. Click "Create new release"
3. Upload the AAB file (download from EAS build page)
4. Add release notes:
   ```
   Initial beta release
   - Email authentication
   - Create and join circles
   - Real-time chat
   - Plan events
   - Share photos
   ```
5. Click "Review release" → "Start rollout to Internal testing"

### Step 6: Add Testers

1. Go to **Testing → Internal testing → Testers**
2. Create email list:
   ```
   tester1@gmail.com
   tester2@gmail.com
   tester3@gmail.com
   ```
3. Save
4. Copy the testing link
5. Share with testers

**Testers will**:
- Click the link
- Accept invitation
- Install from Play Store (marked as "Internal Test")
- Start testing!

---

## 🌐 OPTION 3: Web Version (Vercel Deployment)

### Step 1: Test Web Locally

```bash
cd circles
npx expo start --web
```

Open http://localhost:8081 in browser

### Step 2: Build for Production

```bash
npx expo export:web
```

This creates a `web-build` folder with static files.

### Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd web-build
vercel --prod
```

**Or use Vercel Dashboard**:
1. Go to https://vercel.com
2. Click "New Project"
3. Import from Git or upload `web-build` folder
4. Deploy!

**Result**: You get a URL like `https://circles-app.vercel.app`

**Note**: Web version limitations:
- No push notifications
- No native camera/gallery access
- Different UX than mobile
- Good for demo/marketing only

---

## 📊 COMPARISON TABLE

| Method | Cost | Time | Best For | Ease of Install |
|--------|------|------|----------|-----------------|
| **Expo Go** | FREE | Instant | Dev testing | ⭐⭐⭐⭐⭐ (Just scan QR) |
| **EAS Preview (APK)** | FREE | 15 min | Beta testing | ⭐⭐⭐⭐ (Download link) |
| **Play Internal** | $25 | 1-2 days | Professional beta | ⭐⭐⭐⭐⭐ (Play Store) |
| **Web (Vercel)** | FREE | 5 min | Demo/marketing | ⭐⭐⭐⭐⭐ (Just URL) |

---

## 🎯 RECOMMENDED WORKFLOW

### Week 1: Internal Testing
```bash
# Build preview APK
eas build --platform android --profile preview

# Share download link with 5-10 close testers
# Collect feedback
```

### Week 2: Wider Beta
```bash
# Pay $25 for Play Console
# Set up Internal Testing track
# Build production AAB
eas build --platform android --profile production

# Upload to Play Console
# Add 20-50 beta testers
```

### Week 3-4: Polish & Prepare
- Fix bugs from beta feedback
- Complete Play Store listing
- Create screenshots and promotional graphics
- Write app description

### Week 5: Public Launch
- Move from Internal → Closed → Open Testing
- Submit for review
- Launch on Play Store! 🎉

---

## 🔧 TROUBLESHOOTING

### Build Failed?

**Check**:
1. All dependencies are compatible
2. No syntax errors in code
3. Firebase credentials are correct
4. Run `eas build:list` to see error logs

### APK Won't Install?

**Solutions**:
1. Enable "Install from unknown sources"
2. Check Android version (minimum: Android 6.0)
3. Ensure enough storage space
4. Try uninstalling old version first

### Play Console Rejected?

**Common issues**:
1. Missing privacy policy
2. Incomplete content rating
3. Missing app icon/screenshots
4. Permissions not justified

---

## 📝 NEXT STEPS - CHOOSE YOUR PATH

### Path A: Quick Testing (Start Here!)
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Build preview
cd circles
eas build --platform android --profile preview

# Wait 15 minutes, get download link, share with testers!
```

### Path B: Professional Beta Testing
1. Complete Path A first
2. Create Google Play Developer account ($25)
3. Set up app in Play Console
4. Build production AAB
5. Upload to Internal Testing
6. Add testers by email

### Path C: Web Demo
```bash
# Build web version
cd circles
npx expo export:web

# Deploy to Vercel
cd web-build
vercel --prod

# Share URL with anyone!
```

---

## 💡 PRO TIPS

1. **Start with Preview builds** - They're free and fast
2. **Test with 5-10 users first** - Catch major bugs early
3. **Use Internal Testing** - More professional than APK links
4. **Deploy web version** - Great for demos and marketing
5. **Keep version numbers updated** - Increment for each release

---

## 🆘 NEED HELP?

**Common Commands**:
```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Cancel a build
eas build:cancel

# Check account info
eas whoami

# Update credentials
eas credentials
```

**Resources**:
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Play Console: https://play.google.com/console
- Expo Dashboard: https://expo.dev/

---

## ✅ READY TO BUILD?

Run these commands now:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Navigate to project
cd circles

# Start your first build!
eas build --platform android --profile preview
```

**In 15 minutes, you'll have a shareable APK!** 🎉
