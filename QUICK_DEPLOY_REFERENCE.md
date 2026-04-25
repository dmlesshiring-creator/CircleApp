# 🚀 Quick Deploy Reference

## 3 Ways to Deploy Circles App

---

## 1️⃣ FREE APK (Fastest - 15 minutes)

**Perfect for**: Quick beta testing with friends

```bash
# One-time setup
npm install -g eas-cli
eas login

# Build APK
cd circles
eas build --platform android --profile preview
```

**Result**: Download link you can share with anyone
**Example**: `https://expo.dev/artifacts/eas/abc123.apk`

**Testers**:
1. Click link on Android phone
2. Download APK
3. Enable "Install from unknown sources"
4. Install and test!

---

## 2️⃣ GOOGLE PLAY INTERNAL ($25 one-time)

**Perfect for**: Professional beta testing

### Setup (One-time):
1. Create account: https://play.google.com/console
2. Pay $25 registration fee
3. Create app in console
4. Fill in app details

### Build & Upload:
```bash
# Build production AAB
cd circles
eas build --platform android --profile production

# Download AAB from Expo dashboard
# Upload to Play Console → Internal Testing
# Add tester emails
# Share testing link
```

**Testers**:
1. Click testing link
2. Accept invitation
3. Install from Play Store
4. Test!

---

## 3️⃣ WEB VERSION (Vercel - FREE)

**Perfect for**: Demo and marketing

```bash
# Build web version
cd circles
npx expo export:web

# Deploy to Vercel
npm i -g vercel
cd web-build
vercel --prod
```

**Result**: Public URL like `https://circles-app.vercel.app`

**Note**: Limited functionality (no push notifications, camera, etc.)

---

## 📊 Quick Comparison

| Method | Cost | Time | Install Ease | Best For |
|--------|------|------|--------------|----------|
| **APK** | FREE | 15 min | ⭐⭐⭐⭐ | Quick testing |
| **Play Internal** | $25 | 1-2 days | ⭐⭐⭐⭐⭐ | Professional beta |
| **Web** | FREE | 5 min | ⭐⭐⭐⭐⭐ | Demo/marketing |

---

## 🎯 Recommended Path

### Today:
```bash
npm install -g eas-cli
eas login
cd circles
eas build --platform android --profile preview
```
→ Share APK with 5-10 testers

### This Week:
- Collect feedback
- Fix critical bugs
- Test with more users

### Next Week:
- Create Play Console account ($25)
- Upload to Internal Testing
- Add 20-50 beta testers

### Next Month:
- Polish based on feedback
- Submit to Play Store
- Launch! 🎉

---

## 🆘 Quick Help

**Check build status**:
```bash
eas build:list
```

**View build logs**:
```bash
eas build:view [build-id]
```

**Troubleshooting**:
- Build failed? Check `eas build:list` for logs
- APK won't install? Enable "Install from unknown sources"
- Need help? Check BUILD_AND_DEPLOY_GUIDE.md

---

## ✅ Start Now!

```bash
npm install -g eas-cli && eas login
```

Then run:
```bash
cd circles
eas build --platform android --profile preview
```

**You'll have a shareable APK in 15 minutes!** 🚀
