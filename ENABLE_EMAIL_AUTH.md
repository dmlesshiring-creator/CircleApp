# Enable Email/Password Authentication in Firebase

## Quick Steps:

1. Go to **Firebase Console**: https://console.firebase.google.com/
2. Select your **CircleApp** project
3. Click **Authentication** in the left sidebar
4. Click **Sign-in method** tab
5. Click **Email/Password**
6. Toggle **Enable** to ON
7. Click **Save**

That's it! No billing required.

## Test the App:

### Option 1: Create New Account
- Email: `your@email.com`
- Password: `test123` (min 6 characters)
- Click "Sign Up"

### Option 2: Use Test Account
- Email: `test@circles.app`
- Password: `test123`
- Click "Sign In"

(You'll need to create this test account first by signing up with it)

---

## Why Email Auth is Better for Testing:

✅ **No billing required** (Phone auth needs Blaze plan)
✅ **Works immediately** (No SMS delays)
✅ **Easy to test** (No need for real phone numbers)
✅ **Works in Expo Go** (No native modules needed)

---

## The App Will Now:

1. Show **Email/Password sign-in screen** instead of phone
2. Let users **sign up** or **sign in**
3. Continue to **onboarding** (Display Name → Avatar → Bio → Intent)
4. Then show the **main app**

---

**Go enable Email/Password in Firebase Console now, then reload the app!** 🚀
