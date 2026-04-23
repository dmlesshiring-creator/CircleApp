# Step 41: Final QA Checklist

## Overview

This document provides a comprehensive QA checklist for the Circles app before production launch.

---

## SECURITY CHECKLIST

### ✅ Phone Number Privacy

**Requirement:** Phone numbers must NEVER appear in Firestore - only in Firebase Auth.

**Checks:**

1. **Search all Firestore writes:**
```bash
# Search for phoneNumber field writes
grep -r "phoneNumber" circles/src/ --include="*.ts" --include="*.tsx"
grep -r "phone:" circles/src/ --include="*.ts" --include="*.tsx"
grep -r "mobile" circles/src/ --include="*.ts" --include="*.tsx"
```

**Expected:** No Firestore writes containing phone numbers.

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

2. **PhoneEntryScreen.tsx:**
```typescript
// File: circles/src/screens/auth/PhoneEntryScreen.tsx

// VERIFY: Phone number is only passed to Firebase Auth
const handleSendOTP = async () => {
  // Phone number goes to Firebase Auth ONLY
  await signInWithPhoneNumber(auth, phoneNumber);
  
  // Phone number is NOT stored in Zustand
  // Phone number is NOT passed to Firestore
  // Phone number is NOT passed beyond OTPScreen
};
```

**Expected:** Phone number only used for Firebase Auth, never stored.

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

3. **Firestore /users/{uid} document:**
```typescript
// Check user document structure
const userDoc = {
  uid: string,
  displayName: string,
  avatarUrl: string,
  bio: string,
  joinYear: number,
  subscription: string,
  subscriptionExpiresAt: number,
  // NO phoneNumber field
  // NO phone field
  // NO mobile field
};
```

**Expected:** User document contains NO phone-related fields.

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Firestore Security Rules

**Requirement:** Non-members cannot read circle data.

**Test:**
```javascript
// Firebase Console → Firestore → Rules → Rules Playground

// Test 1: Non-member tries to read circle
match /circles/{circleId} {
  allow read: if request.auth != null && 
    request.auth.uid in resource.data.members;
}

// Simulate:
// - Auth UID: user123
// - Circle ID: circle456
// - Circle members: ['user789', 'user101']
// - Expected: DENIED
```

**Expected:** Read denied for non-members.

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Invite Link Security

**Requirement:** Same invite link cannot be used twice by same user.

**Test:**
```typescript
// Test scenario:
// 1. User joins circle via invite link
// 2. User tries to use same link again
// 3. Expected: Rejected

// Implementation check:
const handleJoinViaInvite = async (inviteToken: string) => {
  const circleQuery = query(
    collection(firestore, 'circles'),
    where('inviteToken', '==', inviteToken)
  );
  
  const snapshot = await getDocs(circleQuery);
  const circle = snapshot.docs[0]?.data();
  
  // Check if user is already a member
  if (circle.members.some(m => m.uid === currentUid)) {
    Alert.alert('Already a Member', 'You are already part of this circle');
    return; // REJECT
  }
  
  // Add user to circle
  await addMember(circle.id, currentUid);
};
```

**Expected:** Second use of same link by same user is rejected.

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Content Moderation

**Requirement:** Cards with toxicity > 0.7 must be blocked.

**Test:**
```typescript
// Test scenario:
// 1. Create open circle with toxic content
// 2. Expected: Blocked before write

// Implementation check (Cloud Function):
exports.moderateOpenCircle = functions.firestore
  .document('public_circles/{circleId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    // Call Perspective API
    const toxicityScore = await analyzeToxicity(data.pitch);
    
    if (toxicityScore > 0.7) {
      // Block the card
      await snap.ref.update({
        isHidden: true,
        moderationReason: 'toxic_content',
      });
      
      // Notify creator
      await sendNotification(data.creatorUid, 'Your post was blocked due to inappropriate content');
    }
  });
```

**Expected:** Toxic content (score > 0.7) is blocked.

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

## FEATURE CHECKLIST (Phase 1)

### ✅ User Registration & Onboarding

**Test:**
1. Open app (not logged in)
2. Enter phone number
3. Receive OTP
4. Enter OTP
5. Complete onboarding (display name, avatar, bio)
6. Verify Firestore user document created

**Expected:**
- User document created in `/users/{uid}`
- Contains: displayName, avatarUrl, bio, joinYear
- Does NOT contain: phoneNumber

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Create Private Circle

**Test:**
1. Tap "Create Circle" on HomeScreen
2. Fill in circle details (name, type)
3. Tap "Create"
4. Verify circle appears in list
5. Tap circle → View invite link
6. Verify invite link generated

**Expected:**
- Circle created in `/circles/{circleId}`
- Invite link format: `circles://invite/{inviteToken}`
- Creator is admin

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Join via Invite Link

**Test:**
1. Copy invite link from first user
2. Open link on second device/user
3. Verify deep link opens app
4. Tap "Join Circle"
5. Verify second user added to circle

**Expected:**
- Deep link opens app
- User added to circle members
- User can see circle in HomeScreen

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Real-Time Messaging

**Test:**
1. User A sends message in circle
2. Verify User B receives message immediately
3. Verify message appears in both users' chat
4. Check timestamp is correct

**Expected:**
- Message delivery < 500ms
- Message appears in real-time (no refresh needed)
- Sender name and avatar correct

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ GIF Search

**Test:**
1. Open chat
2. Tap GIF button
3. Search for "happy"
4. Verify GIFs appear
5. Tap a GIF
6. Verify GIF sent as message

**Expected:**
- GIF search returns results
- GIF appears in chat
- GIF is clickable/viewable

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Plan Creation & RSVP

**Test:**
1. Open circle
2. Tap "Plans" tab
3. Tap "Create Plan"
4. Fill in plan details (meal/movie/trip/custom)
5. Publish plan
6. Verify plan appears in planner
7. Verify push notification sent to members
8. Tap RSVP button (Going/Maybe/Can't Make)
9. Verify RSVP count updates

**Expected:**
- Plan created in `/circles/{circleId}/plans/{planId}`
- Push notification sent
- RSVP updates in real-time

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Open Feed

**Test:**
1. Open Feed tab
2. Verify 20 cards load
3. Scroll down
4. Verify more cards load (pagination)
5. Pull to refresh
6. Verify feed refreshes

**Expected:**
- Feed loads < 1.5 seconds
- 20 cards per page
- Pagination works
- Refresh works

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Create Open Circle

**Test:**
1. Tap FAB on FeedScreen
2. Fill in open circle details
3. Select category
4. Add tags
5. Publish
6. Verify card appears in feed

**Expected:**
- Card created in `/public_circles/{circleId}`
- Card appears in feed immediately
- Card is searchable by category

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Transit Circle Auto-Archive

**Test:**
1. Create transit circle with date = today + 1 day
2. Wait 25 hours (or manually set date to past)
3. Verify circle is archived
4. Verify circle no longer appears in feed

**Expected:**
- Circle archived 24 hours after transit date
- `isArchived` = true
- No longer in feed

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Report Button

**Test:**
1. Open feed card
2. Tap "Report"
3. Select reason (spam/inappropriate/etc.)
4. Submit report
5. Verify report written to Firestore
6. Create 4 more reports for same card
7. Verify card auto-hidden after 5 reports

**Expected:**
- Report written to `/reports/{reportId}`
- Card hidden after 5 reports in 24 hours
- `isHidden` = true

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

## PERFORMANCE CHECK

### ✅ Cold Start

**Test:**
1. Force quit app
2. Clear app from memory
3. Tap app icon
4. Measure time to first screen

**Target:** < 2 seconds

**Actual:** _____ ms

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Feed Load

**Test:**
1. Clear cache
2. Open Feed tab
3. Measure time to first 10 cards rendered

**Target:** < 1.5 seconds

**Actual:** _____ ms

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Chat Message Delivery

**Test:**
1. Open chat
2. Send message
3. Measure time from tap to message appearing

**Target:** < 500ms

**Actual:** _____ ms

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

## OFFLINE CHECK

### ✅ Offline Banner

**Test:**
1. Open app (online)
2. Turn off WiFi and mobile data
3. Verify offline banner appears at top

**Expected:**
- Orange banner with "You're offline" message
- Banner appears immediately

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Cached Messages

**Test:**
1. Open chat (online)
2. Scroll through messages
3. Turn off network
4. Verify messages still visible

**Expected:**
- Last 100 messages cached
- Messages visible offline
- No loading spinner

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Cached Feed

**Test:**
1. Open feed (online)
2. Scroll through cards
3. Turn off network
4. Close and reopen feed
5. Verify cards still visible

**Expected:**
- Last 20 cards cached
- Cards visible offline
- Offline banner shown

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Message Queueing

**Test:**
1. Open chat
2. Turn off network
3. Type and send message
4. Verify message shows with "pending" indicator (clock icon)
5. Turn on network
6. Verify message sends automatically

**Expected:**
- Message queued offline
- Clock icon shown
- Auto-sends when online
- Clock icon disappears

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Offline Sync

**Test:**
1. Send 3 messages offline
2. Turn on network
3. Verify all 3 messages send in order
4. Verify no duplicates

**Expected:**
- All queued messages send
- Correct order maintained
- No duplicates

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

## ACCESSIBILITY CHECK

### ✅ Screen Reader

**Test:**
1. Enable TalkBack (Android) or VoiceOver (iOS)
2. Navigate through FeedScreen
3. Verify all cards announced correctly
4. Navigate through CircleChatScreen
5. Verify all messages announced with sender name

**Expected:**
- All elements have accessibility labels
- No "unlabeled button" announcements
- Logical navigation order

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Font Scaling

**Test:**
1. Settings → Display → Font Size → Largest
2. Open app
3. Verify all text scales correctly
4. Verify no text truncation
5. Verify all buttons remain tappable

**Expected:**
- All text scales
- No layout breaks
- Buttons remain 44x44 minimum

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Color Contrast

**Test:**
1. Take screenshots of all screens
2. Use WebAIM Contrast Checker
3. Verify all text passes WCAG AA (4.5:1 for body, 3:1 for large)

**Expected:**
- textPrimary on background: 17.8:1 ✅
- textSecondary on surface: 4.6:1 ✅
- textTertiary on surface: 3.5:1 ✅
- White on primary: 4.8:1 ✅

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

## SUBSCRIPTION CHECK (Phase 3)

### ✅ Purchase Flow

**Test:**
1. Tap "Upgrade to Circles+"
2. Select monthly plan
3. Complete purchase
4. Verify subscription status updates
5. Verify Firestore updated

**Expected:**
- RevenueCat purchase succeeds
- Firestore `/users/{uid}` updated with subscription
- Features unlocked immediately

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

### ✅ Feature Gating

**Test:**
1. As free user, try to create 2nd circle
2. Verify upgrade prompt shown
3. As free user, try to add 16th member
4. Verify upgrade prompt shown

**Expected:**
- Free users blocked at limits
- Upgrade prompt shown
- Circles+ users not blocked

**Status:** ⬜ Not Checked / ✅ Pass / ❌ Fail

---

## CRITICAL BUGS TO FIX

### Issues Found

1. **Issue:** _____________________
   **Severity:** Critical / High / Medium / Low
   **Status:** ⬜ Open / ✅ Fixed

2. **Issue:** _____________________
   **Severity:** Critical / High / Medium / Low
   **Status:** ⬜ Open / ✅ Fixed

3. **Issue:** _____________________
   **Severity:** Critical / High / Medium / Low
   **Status:** ⬜ Open / ✅ Fixed

---

## FINAL SIGN-OFF

### Security
- [ ] Phone numbers never in Firestore
- [ ] Security rules tested
- [ ] Invite links secure
- [ ] Content moderation working

### Features
- [ ] Registration & onboarding
- [ ] Private circles
- [ ] Real-time messaging
- [ ] Plans & RSVP
- [ ] Open feed
- [ ] Transit circles
- [ ] Reporting

### Performance
- [ ] Cold start < 2s
- [ ] Feed load < 1.5s
- [ ] Chat delivery < 500ms
- [ ] 60 FPS scrolling

### Offline
- [ ] Offline banner
- [ ] Cached messages
- [ ] Cached feed
- [ ] Message queueing
- [ ] Auto-sync

### Accessibility
- [ ] Screen reader support
- [ ] Font scaling
- [ ] Color contrast
- [ ] 44x44 tap targets

### Subscription (if Phase 3 deployed)
- [ ] Purchase flow
- [ ] Feature gating
- [ ] Restore purchases

---

## LAUNCH READINESS

**Overall Status:**

⬜ **NOT READY** - Critical issues remain
⬜ **READY WITH ISSUES** - Minor issues, can launch
✅ **READY TO LAUNCH** - All checks passed

**Sign-off:**
- QA Lead: _________________ Date: _______
- Tech Lead: _________________ Date: _______
- Product Manager: _________________ Date: _______

---

**Next Steps:**
1. Fix all critical and high-severity bugs
2. Re-test failed checks
3. Deploy to TestFlight/Play Console (beta)
4. Conduct beta testing (50-100 users)
5. Monitor crash reports and analytics
6. Fix any beta issues
7. Submit for App Store/Play Store review
8. Launch! 🚀
