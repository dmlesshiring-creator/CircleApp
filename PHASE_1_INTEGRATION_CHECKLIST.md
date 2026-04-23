# Phase 1 Integration & Offline Support - Checklist

## Overview
This document provides a comprehensive checklist for Phase 1 completion, including offline support integration and verification of all features.

---

## 📁 Files Created for Offline Support

### Core Offline Functionality

✅ **`circles/src/hooks/useOffline.ts`**
- Detects network connectivity using `@react-native-community/netinfo`
- Exports `isOnline` and `wasOffline` states
- `useOfflineSync()` hook for triggering sync operations
- Automatically resets `wasOffline` after 1 second

✅ **`circles/src/components/shared/OfflineBanner.tsx`**
- Thin yellow banner at top of screen
- Shows "You're offline — showing cached content"
- Slides in/out with animation based on connection state
- Positioned below status bar

✅ **`circles/src/components/shared/ScreenLayout.tsx`**
- Wrapper component for all main screens
- Includes OfflineBanner automatically
- Consistent layout across app

✅ **`circles/src/services/messageQueue.service.ts`**
- Message queueing for offline sending
- Functions:
  - `addToQueue()`: Add message to queue
  - `getQueue()`: Get all queued messages
  - `updateMessageStatus()`: Update message status
  - `removeFromQueue()`: Remove sent message
  - `sendQueuedMessage()`: Send single message
  - `flushQueue()`: Send all pending messages
  - `clearQueue()`: Clear all messages
  - `getPendingCount()`: Get count of pending messages

### Updated Screens with Offline Support

✅ **`circles/src/screens/main/FeedScreen.tsx`** (updated)
- Loads from cache first, then fetches live data
- Saves successful loads to AsyncStorage (`feed_cache`)
- Uses `useOfflineSync()` to refresh when back online
- Wrapped in `ScreenLayout` for offline banner

✅ **`circles/src/screens/circle/CirclePlannerScreen.tsx`** (updated)
- Caches plans to AsyncStorage (`plans_{circleId}`)
- Loads from cache on mount
- Uses `useOfflineSync()` to refresh when back online
- Wrapped in `ScreenLayout` for offline banner

---

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd circles
npm install @react-native-community/netinfo @react-native-async-storage/async-storage
```

### 2. Configure Metro Bundler (if needed)

Add to `metro.config.js`:
```javascript
module.exports = {
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
  },
};
```

### 3. Link Native Modules (if using bare React Native)

```bash
cd ios && pod install && cd ..
```

### 4. Update Screens

Wrap all main screens with `ScreenLayout`:

```typescript
import { ScreenLayout } from '../../components/shared/ScreenLayout';

export const YourScreen = () => {
  return (
    <ScreenLayout>
      {/* Your screen content */}
    </ScreenLayout>
  );
};
```

### 5. Implement Message Queue in Chat

Update `ChatInput.tsx` to use message queue when offline:

```typescript
import { useOffline } from '../../hooks/useOffline';
import { addToQueue, flushQueue } from '../../services/messageQueue.service';

const { isOnline } = useOffline();

const handleSend = async () => {
  if (!isOnline) {
    // Add to queue
    const queuedMessage = await addToQueue(
      circleId,
      messageText,
      currentUser.uid,
      currentUser.displayName
    );
    
    // Show in local list with pending indicator
    setMessages((prev) => [...prev, {
      ...queuedMessage,
      isPending: true,
    }]);
  } else {
    // Send immediately
    await sendMessage();
  }
};

// Flush queue when back online
useOfflineSync(() => {
  flushQueue(circleId);
});
```

---

## ✅ Phase 1 Feature Checklist

### Authentication & Onboarding

- [ ] **Splash Screen**
  - [ ] Shows app logo/branding
  - [ ] Checks auth state on load
  - [ ] Navigates to appropriate screen (auth or home)
  - [ ] Handles loading states gracefully

- [ ] **Phone Entry Screen**
  - [ ] Accepts phone number input
  - [ ] Validates phone format (India: +91)
  - [ ] Sends OTP via Firebase Auth
  - [ ] Shows loading state during send
  - [ ] Handles errors (invalid number, rate limit)

- [ ] **OTP Screen**
  - [ ] Shows 6-digit OTP input
  - [ ] Auto-focuses on first digit
  - [ ] Verifies OTP with Firebase Auth
  - [ ] Creates Firestore user doc on success
  - [ ] **CRITICAL**: No phone number in Firestore doc
  - [ ] Navigates to onboarding or home

- [ ] **Display Name Screen**
  - [ ] Accepts first name input (required)
  - [ ] Validates name (no special chars)
  - [ ] Saves to Firestore `/users/{uid}`
  - [ ] Navigates to avatar screen

- [ ] **Avatar Screen**
  - [ ] Shows avatar picker (camera/gallery)
  - [ ] Uploads to Firebase Storage
  - [ ] Saves URL to Firestore
  - [ ] Allows skip (default avatar)
  - [ ] Navigates to bio screen

- [ ] **Bio Screen**
  - [ ] Accepts bio text (max 80 chars)
  - [ ] Runs content moderation check
  - [ ] Blocks inappropriate content
  - [ ] Saves to Firestore
  - [ ] Allows skip
  - [ ] Navigates to home

### Private Circles

- [ ] **Circle Creation**
  - [ ] 3-step wizard (name, type, members)
  - [ ] Validates circle name
  - [ ] Writes to Firestore `/circles/{circleId}`
  - [ ] Correct schema: name, type, members array, inviteToken
  - [ ] Generates unique invite token
  - [ ] Creator added as admin
  - [ ] Navigates to circle screen

- [ ] **Invite Link Generation**
  - [ ] Generates QR code with invite URL
  - [ ] URL format: `circles.app/join/{inviteToken}`
  - [ ] Copy link button works
  - [ ] Share button opens native share sheet
  - [ ] WhatsApp deep link works
  - [ ] Revoke link regenerates token

- [ ] **Invite Link Deep Link**
  - [ ] App handles `circles.app/join/*` URLs
  - [ ] Extracts invite token from URL
  - [ ] If authenticated: joins circle immediately
  - [ ] If not authenticated: saves token, completes auth, then joins
  - [ ] Finds circle by inviteToken in Firestore
  - [ ] Adds user to members array
  - [ ] Navigates to circle screen
  - [ ] **Test on simulator**: Use `xcrun simctl openurl booted "circles://join/test-token"`

### Group Chat

- [ ] **Chat Screen**
  - [ ] Loads messages from Realtime DB
  - [ ] Real-time updates with `onValue` listener
  - [ ] Messages sorted by createdAt (newest at bottom)
  - [ ] Own messages: right-aligned, primary color
  - [ ] Others' messages: left-aligned, white background, shows name + avatar
  - [ ] System messages: centered, grey italic
  - [ ] Caches last 100 messages to AsyncStorage
  - [ ] Loads from cache first, then syncs

- [ ] **Send Message**
  - [ ] Text input with multiline support
  - [ ] Send button disabled when empty
  - [ ] Writes to Realtime DB `/circles/{circleId}/messages`
  - [ ] Updates circle's lastMessageAt in Firestore
  - [ ] If offline: adds to queue with pending indicator
  - [ ] When back online: flushes queue automatically

- [ ] **Message Queue (Offline)**
  - [ ] Messages saved to AsyncStorage when offline
  - [ ] Shows clock icon for pending messages
  - [ ] Flushes queue when back online
  - [ ] Sends messages in order
  - [ ] Removes from queue after successful send
  - [ ] Updates UI to remove pending indicator

### Event Planning

- [ ] **Planner Screen**
  - [ ] Shows "Upcoming" and "Past" sections
  - [ ] Plans sorted by date
  - [ ] Each plan shows: type icon, title, date, time, location, RSVP summary
  - [ ] User's RSVP status shown with color
  - [ ] Tap plan → navigates to detail screen
  - [ ] Floating "+" button → create plan screen
  - [ ] Caches plans to AsyncStorage
  - [ ] Loads from cache first

- [ ] **Create Plan Screen**
  - [ ] Step 1: Choose type (Meal/Movie/Trip/Custom)
  - [ ] Step 2: Fill details (conditional by type)
  - [ ] Step 3: Review & publish
  - [ ] Writes to Firestore `/circles/{circleId}/plans/{planId}`
  - [ ] Writes plan_card message to Realtime DB
  - [ ] Updates circle's lastMessageAt
  - [ ] Sends FCM push notification to members
  - [ ] Navigates back to planner screen

- [ ] **Plan Detail Screen**
  - [ ] Shows all plan details
  - [ ] RSVP buttons at bottom (Going/Maybe/Can't)
  - [ ] Updates Firestore on RSVP
  - [ ] Shows RSVP counts
  - [ ] Real-time updates

- [ ] **RSVP Buttons**
  - [ ] Three buttons with correct colors
  - [ ] Selected state: filled background + checkmark
  - [ ] Updates Firestore `/circles/{circleId}/plans/{planId}/rsvps/{uid}`
  - [ ] Immediate UI feedback

### Open Feed

- [ ] **Feed Screen**
  - [ ] "Discover" header with search icon
  - [ ] Category filter bar (sticky)
  - [ ] Location selector
  - [ ] Loads first 20 cards from Firestore
  - [ ] Filters by category when selected
  - [ ] Infinite scroll loads more
  - [ ] Pull-to-refresh works
  - [ ] Skeleton loading on first load
  - [ ] Empty state when no results
  - [ ] Floating "+" FAB
  - [ ] Caches feed to AsyncStorage
  - [ ] Loads from cache first

- [ ] **Feed Card**
  - [ ] Shows all required fields
  - [ ] Category tag color-coded
  - [ ] Time posted (relative)
  - [ ] Pitch text expandable
  - [ ] Tags in horizontal scroll
  - [ ] Join button (open mode)
  - [ ] Request button (approval mode)
  - [ ] Report button opens bottom sheet
  - [ ] Joined state shows checkmark

- [ ] **Create Open Circle**
  - [ ] Step 1: Category selection
  - [ ] Step 2: Name + pitch
  - [ ] Step 3: Context (transit or location)
  - [ ] Step 4: Tags (up to 5)
  - [ ] Step 5: Join mode + publish
  - [ ] **Runs content moderation check**
  - [ ] Blocks if toxicity score ≥ 0.7
  - [ ] Shows user-friendly error message
  - [ ] Writes to Firestore `/public_circles/{cardId}`
  - [ ] Navigates to detail screen

- [ ] **Circle Detail Screen**
  - [ ] Header with name, member count, category
  - [ ] Two tabs: Chat and Info
  - [ ] Chat tab: full chat for members, preview for non-members
  - [ ] Info tab: pitch, context, tags, creator, members
  - [ ] Transit countdown for transit circles
  - [ ] Leave button works

### Content Moderation

- [ ] **Moderation Check**
  - [ ] Integrated in CreateOpenCircleScreen
  - [ ] Checks circle name and pitch
  - [ ] Uses Google Perspective API
  - [ ] Threshold: 0.7
  - [ ] Blocks unsafe content
  - [ ] Shows friendly error message
  - [ ] Falls back to local check if API fails
  - [ ] Logs API failures

- [ ] **Report Flow**
  - [ ] Report button opens bottom sheet
  - [ ] 4 options: Spam, Inappropriate, Misleading, Harassment
  - [ ] Writes to `/reports/{reportId}`
  - [ ] Counts reports in last 24h
  - [ ] Auto-hides card at 5 reports
  - [ ] Shows confirmation toast
  - [ ] Prevents duplicate reports

### Push Notifications

- [ ] **Setup**
  - [ ] Requests permission on app load
  - [ ] Gets Expo Push Token
  - [ ] Saves token to Firestore `/users/{uid}/pushTokens/{tokenId}`
  - [ ] Configures notification handlers

- [ ] **Foreground Notifications**
  - [ ] Shows in-app banner (not OS notification)
  - [ ] Banner slides down from top
  - [ ] Auto-dismisses after 4 seconds
  - [ ] Swipe up to dismiss
  - [ ] Tap to navigate

- [ ] **Background Notifications**
  - [ ] OS notification shows in tray
  - [ ] Tap opens app and navigates
  - [ ] Badge count updates

- [ ] **Notification Types**
  - [ ] New member: navigates to CircleScreen
  - [ ] New plan: navigates to PlanDetailScreen
  - [ ] RSVP nudge: navigates to PlanDetailScreen
  - [ ] Plan reminder: navigates to PlanDetailScreen
  - [ ] Transit match: navigates to FeedScreen
  - [ ] Archive prompt: shows modal

- [ ] **Cloud Functions**
  - [ ] `onNewMember`: sends notification when member joins
  - [ ] `onNewPlan`: sends notification when plan created
  - [ ] `sendRSVPNudges`: scheduled daily for plans in 3 days
  - [ ] `sendPlanReminders`: scheduled daily for plans tomorrow

### Transit Circle Auto-Archive

- [ ] **Cloud Function**
  - [ ] `archiveTransitCircles`: runs every hour
  - [ ] Queries circles with transitDate < (now - 24h)
  - [ ] Sets isArchived: true
  - [ ] Sends FCM push to all members
  - [ ] Notification data includes circleId and action

- [ ] **Archive Prompt Modal**
  - [ ] Shows when notification tapped
  - [ ] Full-screen modal with overlay
  - [ ] "Your journey is over" message
  - [ ] Two buttons: Keep as Memory / Let it Go
  - [ ] Keep: adds to user's pastCircles
  - [ ] Let Go: removes user from members
  - [ ] Dismisses after action

### Offline Support

- [ ] **Network Detection**
  - [ ] `useOffline()` hook detects connection state
  - [ ] `isOnline` reflects current state
  - [ ] `wasOffline` true when transitioning to online
  - [ ] Triggers sync operations on reconnect

- [ ] **Offline Banner**
  - [ ] Shows yellow banner when offline
  - [ ] Message: "You're offline — showing cached content"
  - [ ] Slides in/out with animation
  - [ ] Positioned below status bar
  - [ ] Visible on all main screens

- [ ] **Feed Caching**
  - [ ] Saves feed to AsyncStorage on successful load
  - [ ] Loads from cache first on mount
  - [ ] Fetches live data in background
  - [ ] Refreshes when back online

- [ ] **Plans Caching**
  - [ ] Saves plans to AsyncStorage per circle
  - [ ] Loads from cache first on mount
  - [ ] Syncs with Firestore in background
  - [ ] Refreshes when back online

- [ ] **Message Queue**
  - [ ] Messages saved to queue when offline
  - [ ] Shows pending indicator (clock icon)
  - [ ] Flushes queue when back online
  - [ ] Sends in order with small delays
  - [ ] Removes from queue after send
  - [ ] Updates UI to remove pending indicator

---

## 🧪 Testing Procedures

### Test Offline Mode

1. **Enable Airplane Mode**
   - iOS: Settings → Airplane Mode ON
   - Android: Settings → Network → Airplane Mode ON

2. **Test Feed**
   - Open feed screen
   - Verify cached content loads
   - Verify offline banner shows
   - Try to create circle (should fail gracefully)

3. **Test Chat**
   - Open chat screen
   - Send message
   - Verify message shows with pending indicator
   - Verify message saved to queue

4. **Test Plans**
   - Open planner screen
   - Verify cached plans load
   - Try to create plan (should fail gracefully)

5. **Disable Airplane Mode**
   - Turn off airplane mode
   - Verify offline banner disappears
   - Verify feed refreshes automatically
   - Verify queued messages send
   - Verify pending indicators removed

### Test Deep Links

**iOS Simulator**:
```bash
xcrun simctl openurl booted "circles://join/test-token-123"
```

**Android Emulator**:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "circles://join/test-token-123"
```

### Test Push Notifications

1. **Test Local Notification**:
```typescript
import { sendLocalNotification } from './services/notification.service';

await sendLocalNotification(
  'Test Title',
  'Test message',
  { type: 'new_member', circleId: 'test-123', memberName: 'John' }
);
```

2. **Test Cloud Function**:
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendTest = httpsCallable(functions, 'sendTestNotification');
await sendTest({ title: 'Test', body: 'Test message' });
```

### Test Content Moderation

1. **Test Safe Content**:
   - Create circle with normal name and pitch
   - Should pass moderation

2. **Test Unsafe Content**:
   - Create circle with toxic language
   - Should block with error message

3. **Test API Failure**:
   - Remove API key temporarily
   - Should fall back to local check
   - Should log failure

### Test Auto-Archive

1. **Create Transit Circle**:
   - Set transitDate to yesterday
   - Wait for hourly function to run
   - Verify circle archived
   - Verify notification sent

2. **Test Archive Prompt**:
   - Tap notification
   - Verify modal shows
   - Test "Keep as Memory"
   - Test "Let it Go"

---

## 🐛 Common Issues & Solutions

### Issue: Offline banner not showing

**Solution**:
- Verify `@react-native-community/netinfo` installed
- Check `ScreenLayout` wraps your screen
- Test with airplane mode

### Issue: Messages not sending when back online

**Solution**:
- Verify `useOfflineSync()` hook used
- Check `flushQueue()` called in sync callback
- Verify Firebase Realtime DB rules allow writes

### Issue: Cache not loading

**Solution**:
- Verify `@react-native-async-storage/async-storage` installed
- Check cache keys match (e.g., `feed_cache`, `plans_{circleId}`)
- Clear cache and test: `AsyncStorage.clear()`

### Issue: Deep links not working

**Solution**:
- Verify `app.config.ts` has correct scheme
- Check URL format matches: `circles://join/{token}`
- Test with simulator command
- Verify navigation ref set

### Issue: Push notifications not received

**Solution**:
- Verify physical device (not simulator)
- Check permissions granted
- Verify Expo Push Token saved to Firestore
- Check Cloud Function logs for errors
- Test with local notification first

### Issue: Content moderation not working

**Solution**:
- Verify Perspective API key configured
- Check API key restrictions
- Test with known toxic phrase
- Check console for API errors
- Verify fail-open strategy working

---

## 📊 Performance Targets

- [ ] **App Cold Start**: < 2 seconds
- [ ] **Chat Message Delivery**: < 500ms
- [ ] **Feed Load**: < 1.5 seconds
- [ ] **Cache Load**: < 200ms
- [ ] **Offline Banner Animation**: Smooth 60fps
- [ ] **Message Queue Flush**: < 100ms per message

---

## 🔐 Security Checklist

- [ ] **Phone Numbers**: Never stored in Firestore (only in Firebase Auth)
- [ ] **API Keys**: Stored in environment variables, not committed
- [ ] **Firestore Rules**: Per-circle data isolation enforced
- [ ] **Content Moderation**: All user-generated content checked
- [ ] **Report System**: Auto-hide at 5 reports
- [ ] **Push Tokens**: Only user can write their own tokens
- [ ] **Deep Links**: Validate invite tokens before joining

---

## 📝 Final Checklist

- [ ] All dependencies installed
- [ ] All screens wrapped in `ScreenLayout`
- [ ] Message queue integrated in chat
- [ ] Offline sync hooks added to all screens
- [ ] Cache keys consistent across app
- [ ] Deep link handling configured
- [ ] Push notification handlers set up
- [ ] Content moderation integrated
- [ ] Cloud Functions deployed
- [ ] Firestore security rules updated
- [ ] All features tested on physical device
- [ ] Offline mode tested thoroughly
- [ ] Performance targets met
- [ ] Security checklist completed

---

## 🎉 Phase 1 Complete!

Once all items are checked, Phase 1 is complete and ready for user testing!

**Next Steps**:
- Deploy to TestFlight (iOS) / Internal Testing (Android)
- Gather user feedback
- Monitor analytics and crash reports
- Plan Phase 2 features
