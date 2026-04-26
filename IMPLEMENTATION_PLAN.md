# Circles App - Complete Implementation Plan

## Current Status Analysis

Based on the screenshots and PRD, the app has:
- ✅ Authentication (Email/Password sign-in working)
- ✅ Basic navigation (Discover, Circles, Plans, Profile tabs)
- ✅ Open Feed UI with category filters
- ✅ Empty states for Circles and Plans
- ✅ Profile screen with basic menu

## Missing Critical Features (Priority Order)

### Phase 1: Core Functionality (Week 1-2)

#### 1. Open Discovery (Pillar 2) - HIGH PRIORITY
- [ ] Create Open Circle flow (all 5 steps)
- [ ] Open Circle detail screen with join functionality
- [ ] Transit circle creation with train/flight/bus search
- [ ] Interest & neighborhood circle creation
- [ ] Circle card rendering with all fields
- [ ] Join/Request to join functionality
- [ ] Real-time member count updates
- [ ] Transit circle auto-archive (24h after journey)
- [ ] Feed search by train/flight number
- [ ] Location-based filtering
- [ ] Keyword search across circles
- [ ] Report & moderation system

#### 2. Private Circles (Pillar 1) - HIGH PRIORITY
- [ ] Create Private Circle flow
- [ ] Circle invite link generation
- [ ] Join via invite link
- [ ] Circle list view
- [ ] Circle detail/chat screen
- [ ] Member list with roles (Admin/Member/Guest)
- [ ] Circle settings (rename, remove members, archive)

#### 3. Chat & Communication - HIGH PRIORITY
- [ ] Real-time messaging (Firebase Realtime DB)
- [ ] Text messages with emoji support
- [ ] GIF picker integration (Giphy/Tenor)
- [ ] Message reactions (emoji)
- [ ] Swipe-to-reply (threaded replies)
- [ ] Delete for me / delete for everyone
- [ ] Message delivery indicators
- [ ] Unread badge counts
- [ ] Push notifications for new messages

### Phase 2: Advanced Features (Week 3-4)

#### 4. The Planner - CRITICAL FEATURE
- [ ] Plan creation UI (Meal/Movie/Trip/Custom)
- [ ] Plan types with smart suggestions:
  - Meal: Restaurant search (Zomato/Google Places API)
  - Movie: Film search (TMDB API)
  - Trip: Destination, dates, budget
  - Custom: Free-form
- [ ] RSVP system (Going/Maybe/Can't make it)
- [ ] Live RSVP count display
- [ ] Nudge non-responders
- [ ] 24h reminder notifications
- [ ] Day-of location sharing (opt-in)
- [ ] Post-event photo upload prompt
- [ ] Plan archive after event
- [ ] Availability check (calendar poll)
- [ ] Plan card in chat
- [ ] Plan detail screen

#### 5. Polls
- [ ] Create poll in chat
- [ ] Poll types: single choice, multiple choice, 1-5 star rating
- [ ] Real-time results display
- [ ] Close poll and pin result
- [ ] Quick-poll templates

#### 6. Memory Lane
- [ ] Shared photo gallery per circle
- [ ] Photo upload to gallery
- [ ] Tag photos to plans
- [ ] Filter by month or plan
- [ ] Photo captions and reactions
- [ ] Gallery view UI

#### 7. Expense Splitting
- [ ] Add expense form
- [ ] Split equally or custom amounts
- [ ] Running balance display
- [ ] Settle up with UPI deep links (GPay/PhonePe/Paytm)
- [ ] Expense history per plan
- [ ] Expense list view

### Phase 3: Communication & Media (Week 5)

#### 8. Video Calls
- [ ] Integrate Daily.co or Jitsi SDK
- [ ] Initiate group video call
- [ ] Push notifications for call
- [ ] Support up to 12 participants
- [ ] In-call controls (mute, camera, speaker, flip, end)
- [ ] Local recording (opt-in)
- [ ] Save recording to device prompt

#### 9. User Profile & Identity
- [ ] Edit profile screen
- [ ] Display name update
- [ ] Profile photo upload
- [ ] Bio editing (80 char max)
- [ ] Activity status toggle
- [ ] Profile visibility settings

### Phase 4: Monetization (Week 6)

#### 10. Circles+ Subscription
- [ ] RevenueCat integration
- [ ] Subscription plans (monthly ₹99-199, annual ₹799)
- [ ] Upgrade prompt sheet
- [ ] Feature gating (free vs premium)
- [ ] Subscription status display
- [ ] Manage subscription screen

#### 11. Plan Boosts
- [ ] In-app purchase for plan boost (₹29-49)
- [ ] Packing list feature
- [ ] Countdown timer
- [ ] Booking links integration

#### 12. Year in Circles Recap
- [ ] Annual recap generation (December)
- [ ] Stats: circles joined, plans created, photos shared
- [ ] Shareable recap card

#### 13. Open Feed Monetization
- [ ] Promoted circle cards (CPM/CPC)
- [ ] Verified badge for organizations
- [ ] Transit affiliate links (IRCTC/MakeMyTrip)
- [ ] Restaurant affiliate (Zomato)

### Phase 5: Safety & Moderation (Week 7)

#### 14. Content Moderation
- [ ] Profanity filter (Google Perspective API)
- [ ] Spam detection
- [ ] Duplicate card detection
- [ ] Bot detection
- [ ] Report system (Spam, Inappropriate, Misleading, Harassment)
- [ ] Auto-hide after 5 reports
- [ ] Admin moderation dashboard (web)
- [ ] User suspension system

#### 15. In-Circle Safety
- [ ] Block user functionality
- [ ] Leave circle
- [ ] Remove member (admin)
- [ ] Report member

### Phase 6: Performance & Polish (Week 8)

#### 16. Offline Support
- [ ] Cache last 100 messages per circle
- [ ] Cache planner events
- [ ] Cache Open Feed cards
- [ ] Queue draft messages
- [ ] Auto-send on reconnection
- [ ] Offline indicator banner

#### 17. Push Notifications
- [ ] Firebase Cloud Messaging setup
- [ ] New message notifications
- [ ] Plan created/updated notifications
- [ ] RSVP reminders
- [ ] Member joined notifications
- [ ] Transit circle match notifications

#### 18. Performance Optimizations
- [ ] Image optimization (expo-image)
- [ ] FlatList optimizations
- [ ] Code splitting
- [ ] Firestore composite indexes
- [ ] Cold start optimization (<2s target)
- [ ] Chat delivery optimization (<500ms target)

#### 19. Accessibility
- [ ] VoiceOver/TalkBack support
- [ ] Minimum tap targets (44x44)
- [ ] Color contrast compliance (WCAG AA)
- [ ] Font scaling support
- [ ] Accessibility labels

### Phase 7: Additional Features

#### 20. Settings & Privacy
- [ ] App settings screen
- [ ] Privacy settings
- [ ] Notification preferences
- [ ] Data export (GDPR)
- [ ] Account deletion
- [ ] Help & Support
- [ ] Terms of Service
- [ ] Privacy Policy

#### 21. Onboarding
- [ ] Welcome flow
- [ ] "What brings you to Circles?" prompt
- [ ] First-time user tutorial
- [ ] Permission requests (notifications, location, camera)

## Technical Debt & Infrastructure

- [ ] Error boundary implementation
- [ ] Crash reporting (Sentry)
- [ ] Analytics (Firebase Analytics)
- [ ] A/B testing framework
- [ ] Deep linking setup
- [ ] App Store/Play Store metadata
- [ ] Privacy policy & terms
- [ ] GDPR compliance
- [ ] Data retention policies

## API Integrations Required

1. **Firebase Services**
   - ✅ Auth (Email/Password)
   - [ ] Realtime Database (chat)
   - ✅ Firestore (data)
   - [ ] Storage (media)
   - [ ] Cloud Messaging (push notifications)
   - [ ] Cloud Functions (backend logic)

2. **Third-Party APIs**
   - [ ] Giphy/Tenor (GIFs)
   - [ ] TMDB (movies)
   - [ ] Zomato/Google Places (restaurants)
   - [ ] Google Maps (geocoding, location)
   - [ ] Indian Railways API (train data)
   - [ ] IATA (flight lookup)
   - [ ] Google Perspective API (moderation)
   - [ ] Daily.co or Jitsi (video calls)
   - [ ] RevenueCat (subscriptions)
   - [ ] IRCTC/MakeMyTrip (transit affiliate)

3. **Payment Integration**
   - [ ] UPI deep links (GPay, PhonePe, Paytm)
   - [ ] App Store/Play Store IAP

## Estimated Timeline

- **Phase 1 (Core)**: 2 weeks
- **Phase 2 (Advanced)**: 2 weeks  
- **Phase 3 (Communication)**: 1 week
- **Phase 4 (Monetization)**: 1 week
- **Phase 5 (Safety)**: 1 week
- **Phase 6 (Performance)**: 1 week
- **Phase 7 (Additional)**: 1 week

**Total: 9 weeks for full implementation**

## Next Steps

1. Start with Open Discovery (Create Circle flow)
2. Implement Private Circles (Create & Join)
3. Build Chat functionality
4. Implement The Planner
5. Add remaining features in priority order

---

**Note**: This is a comprehensive plan. We'll implement features incrementally, testing each one before moving to the next.
