# How to Build APK for Testing

## Quick Steps

### Option 1: Build from Expo Website (Recommended)

1. Go to https://expo.dev/accounts/srikanthsriram/projects/circles-app/builds
2. Click **"Create a build"** or **"New build"** button
3. Fill in the form:
   - **Platform**: Select **Android**
   - **Git ref**: `main`
   - **EAS Build profile**: Type **`preview`** (lowercase, not "Preview")
   - **Environment**: Select **Preview**
   - **EAS Submit**: Leave unchecked
4. Click **"Confirm"**
5. Wait 10-15 minutes for the build to complete
6. Download the **APK** file (not AAB)
7. Transfer to your Android phone and install

### Option 2: Build from Command Line

```bash
cd circles
eas build --platform android --profile preview
```

Wait for the build to complete, then download the APK from the provided link.

## Important Notes

- **preview** profile creates **APK** files (for direct installation)
- **production** profile creates **AAB** files (for Play Store only)
- Always use **preview** profile for testing on your device

## Build Profiles Explained

| Profile | Output | Use Case |
|---------|--------|----------|
| **development** | APK | Development builds with Expo Go |
| **preview** | APK | Testing builds for direct installation |
| **production** | AAB | Play Store submission |

## Troubleshooting

### If build fails with package-lock.json error:
The latest commit should have fixed this. Make sure you've pushed the latest changes to GitHub.

### If you get AAB instead of APK:
You selected "production" profile instead of "preview". Create a new build with the correct profile.

### If the app crashes on startup:
Check the Firebase configuration in `.env` file is correct.

---

## Current Build Status

✅ Latest commit pushed to GitHub
✅ Package dependencies fixed
✅ EAS configuration correct

**Ready to build!** Just select the **preview** profile when creating the build.
