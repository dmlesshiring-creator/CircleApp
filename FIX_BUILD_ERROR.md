# Fix Build Error - Package Lock Out of Sync

## The Problem
The package-lock.json is out of sync with package.json, causing the Expo build to fail.

## The Solution
You need to regenerate the package-lock.json file.

---

## 🔧 Quick Fix (Do This Now!)

### Step 1: Open PowerShell

Navigate to your project:
```powershell
cd C:\CirclesApp\circles
```

### Step 2: Delete Old Lock File

```powershell
Remove-Item package-lock.json
```

### Step 3: Regenerate Lock File

```powershell
npm install
```

This will create a fresh package-lock.json that matches your package.json.

### Step 4: Commit and Push

```powershell
git add package-lock.json
git commit -m "Fix package-lock.json sync issue"
```

Then push using GitHub Desktop (File → Push origin)

### Step 5: Rebuild on Expo

Go back to https://expo.dev/ and create a new build!

---

## ✅ Complete Commands (Copy & Paste)

```powershell
cd C:\CirclesApp\circles
Remove-Item package-lock.json -Force
npm install
git add package-lock.json
git commit -m "Fix package-lock.json"
```

Then push using GitHub Desktop!

---

## 🎯 After Fixing

1. Push to GitHub using GitHub Desktop
2. Go to https://expo.dev/accounts/srikanthsriram/projects/circles-app
3. Click "Builds" → "Create a build"
4. Select Android + preview
5. Wait 15-20 minutes
6. Download your APK! 🎉

---

## 💡 Why This Happened

The package-lock.json file tracks exact versions of all dependencies. When it gets out of sync with package.json, npm ci (used by Expo builds) fails. Regenerating it fixes the issue.

---

## 🆘 If This Doesn't Work

Try this alternative:

```powershell
cd C:\CirclesApp\circles
Remove-Item package-lock.json -Force
Remove-Item node_modules -Recurse -Force
npm install
```

This does a completely fresh install.

---

**Do this now and your build will work!** 🚀
