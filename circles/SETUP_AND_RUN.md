# Circles App - Setup and Run Guide

## Prerequisites

Before running the app, ensure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Expo CLI** (will be installed with dependencies)
4. **Firebase Project** (see Firebase Setup below)
5. **iOS Simulator** (Mac only) or **Android Emulator** or **Physical Device**

---

## Quick Start (If Firebase is Already Configured)

```bash
# 1. Navigate to the circles directory
cd circles

# 2. Install dependencies
npm install

# 3. Start the development server
npm start

# 4. Choose your platform:
# - Press 'i' for iOS Simulator (Mac only)
# - Press 'a' for Android Emulator
# - Press 'w' for Web
# - Scan QR code with Expo Go app on physical device
```

---

## Full Setup (First Time)

### Step 1: Install Dependencies

```bash
cd circles
npm install
```

### Step 2: Firebase Setup

#### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "Circles" (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

#### 2.2 Enable Firebase Services

**Authentication:**
1. Go to Authentication → Sign-in method
2. Enable "Phone" provider
3. Add test phone numbers (for development):
   - Phone: +1 650-555-1234
   - Code: 123456

**Realtime Database:**
1. Go to Realtime Database → Create Database
2. Choose location (us-central1 recommended)
3. Start in **test mode** (for development)
4. Security rules will be updated later

**Firestore:**
1. Go to Firestore Database → Create database
2. Start in **test mode** (for development)
3. Choose location (same as Realtime Database)

**Storage:**
1. Go to Storage → Get started
2. Start in **test mode** (for development)

**Cloud Messaging (FCM):**
1. Go to Project Settings → Cloud Messaging
2. Note the Server Key (for push notifications)

#### 2.3 Get Firebase Config

1. Go to Project Settings → General
2. Scroll to "Your apps"
3. Click "Add app" → Web (</>) icon
4. Register app with nickname "Circles Web"
5. Copy the firebaseConfig object

#### 2.4 Create .env File

Create a `.env` file in the `circles` directory:

```bash
# Copy the example
cp .env.example .env

# Edit with your Firebase config
nano .env  # or use your preferred editor
```

Fill in your Firebase configuration:

```env
# Firebase Configuration
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=circles-xxxxx.firebaseapp.com
FIREBASE_PROJECT_ID=circles-xxxxx
FIREBASE_DATABASE_URL=https://circles-xxxxx-default-rtdb.firebaseio.com
FIREBASE_STORAGE_BUCKET=circles-xxxxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# External APIs (Optional for now)
GIPHY_API_KEY=your_giphy_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
PERSPECTIVE_API_KEY=your_perspective_key_here
```

### Step 3: Firebase Security Rules

#### Firestore Rules

Go to Firestore → Rules and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Private circles
    match /circles/{circleId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.members;
    }
    
    // Public circles (Open Feed)
    match /public_circles/{circleId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.creatorUid || 
         request.auth.uid in resource.data.members);
    }
    
    // Reports
    match /reports/{reportId} {
      allow read: if false; // Only admins via Cloud Functions
      allow create: if request.auth != null;
    }
    
    // Analytics
    match /analytics/{eventId} {
      allow read: if false; // Only admins
      allow create: if request.auth != null;
    }
  }
}
```

#### Realtime Database Rules

Go to Realtime Database → Rules and paste:

```json
{
  "rules": {
    "circles": {
      "$circleId": {
        "messages": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    }
  }
}
```

#### Storage Rules

Go to Storage → Rules and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /circles/{circleId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 4: Deploy Firestore Indexes

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in the project
firebase init firestore

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Step 5: Run the App

```bash
# Start the development server
npm start

# Or run directly on a platform:
npm run ios      # iOS Simulator (Mac only)
npm run android  # Android Emulator
npm run web      # Web browser
```

---

## Platform-Specific Setup

### iOS (Mac only)

1. Install Xcode from App Store
2. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
3. Install iOS Simulator
4. Run: `npm run ios`

### Android

1. Install Android Studio
2. Install Android SDK (API 33 or higher)
3. Create an Android Virtual Device (AVD)
4. Start the emulator
5. Run: `npm run android`

### Physical Device

1. Install Expo Go app from App Store or Play Store
2. Run: `npm start`
3. Scan the QR code with your device camera (iOS) or Expo Go app (Android)

---

## Troubleshooting

### "Firebase config is undefined"

**Problem:** Environment variables not loaded.

**Solution:**
1. Ensure `.env` file exists in `circles` directory
2. Restart the development server: `npm start`
3. Clear cache: `expo start -c`

### "Module not found"

**Problem:** Dependencies not installed.

**Solution:**
```bash
rm -rf node_modules
npm install
```

### "Firebase: Error (auth/invalid-phone-number)"

**Problem:** Phone number format incorrect.

**Solution:**
- Use E.164 format: +[country code][number]
- Example: +1 650-555-1234 (US)
- Example: +91 98765 43210 (India)

### "Network request failed"

**Problem:** Firebase project not configured or network issue.

**Solution:**
1. Check Firebase console is accessible
2. Verify `.env` file has correct values
3. Check internet connection
4. Restart development server

### iOS Simulator not opening

**Problem:** Xcode not installed or simulator not configured.

**Solution:**
```bash
# Open Xcode
open -a Simulator

# Or install Xcode from App Store
```

### Android Emulator not starting

**Problem:** AVD not created or Android SDK not configured.

**Solution:**
1. Open Android Studio
2. Tools → AVD Manager
3. Create Virtual Device
4. Choose Pixel 4 or similar
5. Download system image (API 33+)
6. Start emulator

---

## Development Workflow

### Hot Reload

The app supports hot reload. Changes to code will automatically refresh the app.

### Debug Menu

- **iOS Simulator**: Cmd + D
- **Android Emulator**: Cmd + M (Mac) or Ctrl + M (Windows/Linux)
- **Physical Device**: Shake the device

### Useful Commands

```bash
# Clear cache and restart
npm start -- --clear

# Reset Metro bundler cache
npm start -- --reset-cache

# Run with specific port
npm start -- --port 8081

# Check for TypeScript errors
npx tsc --noEmit

# Format code
npx prettier --write "src/**/*.{ts,tsx}"
```

---

## Testing Accounts

For development, use these test accounts:

**Test User 1:**
- Phone: +1 650-555-1234
- OTP: 123456

**Test User 2:**
- Phone: +1 650-555-5678
- OTP: 123456

(Configure these in Firebase Console → Authentication → Sign-in method → Phone → Test phone numbers)

---

## External APIs (Optional)

### Giphy API (for GIF search)

1. Go to [Giphy Developers](https://developers.giphy.com/)
2. Create an account
3. Create an app
4. Copy API key to `.env`

### Google Maps API (for location/city)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Geocoding API
3. Create API key
4. Copy to `.env`

### Perspective API (for content moderation)

1. Go to [Perspective API](https://perspectiveapi.com/)
2. Request access
3. Get API key
4. Copy to `.env`

**Note:** The app will work without these APIs, but some features will be limited.

---

## Production Build

### iOS

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios
```

### Android

```bash
# Build for Android
eas build --platform android
```

---

## Next Steps

1. ✅ Complete Firebase setup
2. ✅ Run the app
3. ✅ Test user registration
4. ✅ Create a test circle
5. ✅ Send test messages
6. 📖 Read `STEPS_39-41_COMPLETE.md` for accessibility and performance optimizations
7. 📖 Read `STEP_41_FINAL_QA_CHECKLIST.md` for QA testing
8. 🚀 Deploy to TestFlight/Play Console for beta testing

---

## Support

For issues or questions:
1. Check Firebase Console for errors
2. Check Expo DevTools for logs
3. Check `TROUBLESHOOTING.md` (if available)
4. Review implementation documentation in project root

---

**Happy Coding! 🎉**
