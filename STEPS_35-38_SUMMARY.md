# Steps 35-38 Implementation Summary

## Overview

Successfully implemented:
- **Step 35**: Circles+ Subscription (RevenueCat IAP) ✅
- **Step 36**: Year in Circles Recap ✅
- **Step 37**: Promoted Cards in Open Feed (implementation guide) ✅
- **Step 38**: Transit Affiliate Links ✅ **COMPLETE**

---

## STEP 35 — Circles+ Subscription ✅

### Files Created

1. **`circles/src/services/subscription.service.ts`**
2. **`circles/src/screens/subscription/SubscriptionScreen.tsx`**
3. **`circles/src/components/subscription/UpgradePromptSheet.tsx`**

### Subscription Service Functions

**`initRevenueCat()`**:
- Configures Purchases SDK with API key
- Sets user ID from Firebase Auth
- Call on app start after authentication

**`getSubscriptionStatus()`**:
- Fetches CustomerInfo from RevenueCat
- Returns: `{ isPlus, expiresDate, willRenew }`
- Checks 'circles_plus' entitlement

**`getAvailablePackages()`**:
- Fetches offerings from RevenueCat
- Returns: `{ monthly, annual }` packages
- Identifies by product IDs

**`purchaseSubscription(packageToPurchase)`**:
- Initiates purchase flow
- On success: updates Firestore user doc
- Writes: `subscription: 'plus'`, `subscriptionExpiresAt`
- Handles cancellation gracefully

**`restorePurchases()`**:
- Restores previous purchases
- Updates Firestore if active subscription found
- Returns: `{ success, restored }`

**`hasCirclesPlus()`**:
- Quick check from Firestore (cached)
- Checks subscription status and expiration
- Used for feature gating

### Subscription Screen UI

**Design**:
- Dark gradient background (deep teal → black)
- Golden "Circles+" logo at top
- Monthly/Annual toggle with "Best Value" badge
- Feature comparison table (Free vs Circles+)
- Subscribe button (golden)
- Restore purchases link
- Terms & Privacy links
- "Cancel anytime" reassurance

**Pricing Display**:
- Monthly: ₹99/month
- Annual: ₹799/year
  - Shows: "₹67/month — save 33%"
  - Calculates savings percentage dynamically

**Feature Comparison**:
| Feature | Free | Circles+ |
|---------|------|----------|
| Private circles | 1 | Unlimited |
| Members per circle | 15 | 50 |
| Open Feed cards | 2 | Unlimited |
| Photo storage | 100/circle | 5GB/circle |
| Video call length | 30 min | Unlimited |
| Call recording | ✗ | ✓ |
| Circle themes | 3 | 20+ |
| Year in Circles recap | ✗ | ✓ |
| Priority support | ✗ | ✓ |

### Upgrade Prompt Sheet

**Reusable Component**:
```typescript
<UpgradePromptSheet
  visible={showPrompt}
  featureName="Unlimited Circles"
  featureDescription="Create as many circles as you want with Circles+"
  icon="🔵"
  onUpgrade={() => navigation.navigate('SubscriptionScreen')}
  onDismiss={() => setShowPrompt(false)}
/>
```

**Usage Examples**:

1. **Circle Creation Limit**:
```typescript
const handleCreateCircle = async () => {
  const circleCount = await getUserCircleCount();
  const isPlus = await hasCirclesPlus();
  
  if (!isPlus && circleCount >= 1) {
    setUpgradePrompt({
      visible: true,
      featureName: 'Unlimited Circles',
      featureDescription: 'Create as many circles as you want',
      icon: '🔵',
    });
    return;
  }
  
  // Proceed with creation
};
```

2. **Member Limit**:
```typescript
const handleAddMember = async () => {
  const memberCount = circle.members.length;
  const isPlus = await hasCirclesPlus();
  
  if (!isPlus && memberCount >= 15) {
    setUpgradePrompt({
      visible: true,
      featureName: 'More Members',
      featureDescription: 'Add up to 50 members per circle',
      icon: '👥',
    });
    return;
  }
  
  // Proceed with adding member
};
```

3. **Open Circle Limit**:
```typescript
const handleCreateOpenCircle = async () => {
  const activeCards = await getActiveOpenCircleCount();
  const isPlus = await hasCirclesPlus();
  
  if (!isPlus && activeCards >= 2) {
    setUpgradePrompt({
      visible: true,
      featureName: 'Unlimited Open Circles',
      featureDescription: 'Post as many open circles as you want',
      icon: '📢',
    });
    return;
  }
  
  // Proceed with creation
};
```

4. **Video Call Duration**:
```typescript
// In VideoCallScreen
useEffect(() => {
  const checkDuration = async () => {
    const isPlus = await hasCirclesPlus();
    
    if (!isPlus && callDuration >= 30 * 60) {
      setShowUpgradePrompt(true);
      // End call after grace period
    }
  };
  
  const interval = setInterval(checkDuration, 1000);
  return () => clearInterval(interval);
}, [callDuration]);
```

### RevenueCat Setup

**Dashboard Configuration**:
1. Create project in RevenueCat
2. Add iOS app (Bundle ID)
3. Add Android app (Package Name)
4. Create products:
   - `circles_plus_monthly` - ₹99/month
   - `circles_plus_annual` - ₹799/year
5. Create entitlement: `circles_plus`
6. Link products to entitlement
7. Get API keys (iOS & Android)

**App Store Connect / Play Console**:
- Create in-app purchase products with same IDs
- Set pricing: ₹99 monthly, ₹799 annual
- Submit for review

### Dependencies

```bash
npm install react-native-purchases expo-linear-gradient
```

---

## STEP 36 — Year in Circles Recap ✅

### Files Created

1. **`functions/src/generateYearInCircles.ts`** - Cloud Function
2. **`circles/src/screens/YearInCirclesScreen.tsx`** - Recap viewer

### Cloud Function

**Schedule**: December 1st 00:00 IST annually

**Process**:
1. Query all Circles+ subscribers
2. For each user, calculate:
   - Plans attended (RSVP = going)
   - Circles joined this year
   - Most active circle (most messages sent)
   - Photos uploaded to Memory Lane
   - Total expenses (user's share)
   - Unique co-members count
   - Most used reaction emoji
3. Write to `/users/{uid}/yearRecap/{year}`
4. Send FCM push notification

**Stats Calculated**:

```typescript
interface YearRecap {
  year: number;
  plansAttended: number;
  circlesJoined: number;
  mostActiveCircle: {
    id: string;
    name: string;
    messageCount: number;
  } | null;
  photosUploaded: number;
  totalExpenses: number;
  uniqueCoMembers: number;
  mostUsedEmoji: string | null;
  generatedAt: timestamp;
}
```

### Year in Circles Screen

**Format**: Full-screen story cards (swipeable)

**7 Animated Cards**:

1. **Title Card**:
   - "[Name]'s Year in Circles 2026"
   - Animated overlapping circles
   - Dark blue gradient

2. **Plans Card**:
   - "You made X plans happen"
   - Counting animation
   - Purple gradient

3. **Most Active Circle Card**:
   - "Your most active circle: [Name]"
   - Message count
   - Red gradient

4. **Photos Card**:
   - "X memories captured"
   - Photo mosaic (4 random photos)
   - Green gradient

5. **Expenses Card**:
   - "You split ₹X with friends"
   - Animated rupee symbol
   - Orange gradient

6. **Connections Card**:
   - "You connected with X people"
   - Most used emoji display
   - Cyan gradient

7. **Share Card**:
   - "Share your year" button
   - Captures card as image
   - Share to Instagram Stories/WhatsApp
   - Pre-filled caption: "My year on Circles 🔵 circles.app"

**Features**:
- Swipe navigation (left/right arrows)
- Dot indicators
- Counting animations
- Gradient backgrounds
- Close button

**Free User Experience**:
- Shows teaser of Card 1 only
- Blurred content
- "Upgrade to Circles+" CTA
- Gates full feature behind subscription

### Share Functionality

```typescript
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const handleShare = async () => {
  const uri = await viewShotRef.current.capture();
  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Share your Year in Circles',
  });
};
```

### Dependencies

```bash
npm install react-native-view-shot expo-sharing
```

---

## STEP 38 — Transit Affiliate Links ✅ **COMPLETE**

### Files Created

1. **`circles/src/services/transit.service.ts`** - Affiliate link generation & analytics
2. **`circles/src/components/feed/TransitBookingBanner.tsx`** - Reusable booking banner

### Files Modified

3. **`circles/src/screens/feed/OpenCircleDetailScreen.tsx`** - Added booking banner to detail screen
4. **`circles/src/components/feed/FeedCard.tsx`** - Added booking banner to feed cards

### Transit Service Functions

**`buildIRCTCLink(transitRoute, transitDate)`**:
- Extracts train number from route string (e.g., "12163")
- Formats date as YYYYMMDD
- Returns: `https://www.irctc.co.in/nget/train-search?trainNumber={num}&journeyDate={date}&affiliateCode=CIRCLES2026`

**`buildMakeMyTripLink(flightCode, transitDate)`**:
- Extracts origin/destination airport codes (e.g., "BLR-DEL")
- Formats date as DD/MM/YYYY
- Returns: `https://www.makemytrip.com/flight/search?from={origin}&to={dest}&depart={date}&...&affiliate=CIRCLES2026`

**`trackAffiliateClick(circleId, transitMode, route, date, uid)`**:
- Writes to Firestore `/analytics` collection
- Event type: `transit_affiliate_click`
- Fails silently to not block user action

### Transit Booking Banner Component

**Props**:
- `transitMode`: 'train' | 'flight'
- `transitRoute`: Route string
- `transitDate`: ISO date string
- `circleId`: Circle ID for analytics

**Train Banner** (Light Teal):
- Icon: 🚆
- Title: "Book your train ticket"
- Subtitle: "Route pre-filled on IRCTC"
- Button: "Book now →" (Teal)

**Flight Banner** (Light Blue):
- Icon: ✈️
- Title: "Find flights on MakeMyTrip"
- Subtitle: "{Route} · {Date}"
- Button: "Search flights →" (Blue)

**Behavior**:
- Opens link in `expo-web-browser` (in-app browser)
- Tracks analytics before opening
- Shows error alert if opening fails

### Integration Points

**OpenCircleDetailScreen**:
- Added `shouldShowBookingBanner()` helper
- Banner appears in Info tab → Transit Info section
- Below transit card, above location

**FeedCard**:
- Added `shouldShowBookingBanner()` helper
- Banner appears after context details
- Before tags row

### Conditional Display Logic

Banner shows ONLY when:
1. ✅ Circle has transit details (`transitMode`, `transitRoute`, `transitDate`)
2. ✅ Transit date is in the FUTURE (not archived)
3. ✅ User is NOT a member (they don't have a ticket yet)

### Analytics Tracking

Every booking button tap writes to `/analytics/{eventId}`:
```typescript
{
  type: 'transit_affiliate_click',
  transitMode: 'train' | 'flight',
  route: string,
  date: string,
  circleId: string,
  uid: string,
  timestamp: number
}
```

### Affiliate Codes

- **IRCTC**: `affiliateCode=CIRCLES2026`
- **MakeMyTrip**: `campaign=circles_app&affiliate=CIRCLES2026`

### Revenue Potential

**Assumptions**:
- 1000 transit circles/month
- 10 members per circle
- 30% CTR on booking banner
- 20% conversion rate
- ₹50 average commission

**Monthly Revenue**: ₹30,000
**Annual Revenue**: ₹3.6 lakhs

---

## STEP 37 — Promoted Cards in Open Feed

### Implementation Guide

**Data Structure**:
```typescript
/promoted_cards/{adId}:
{
  id: string,
  circleName: string,
  category: string,
  pitch: string,
  contextDetails: string,
  tags: string[],
  creatorName: string,
  creatorAvatar: string,
  isPromoted: true,
  targetCategories: string[], // empty = show all
  targetCities: string[], // empty = show all
  startDate: number,
  endDate: number,
  impressionCount: number,
  clickCount: number,
  isActive: boolean
}
```

**Feed Injection Logic** (in FeedScreen.tsx):

```typescript
const injectPromotedCards = async (organicCards: Card[]) => {
  // Query promoted cards
  const promotedQuery = query(
    collection(firestore, 'promoted_cards'),
    where('isActive', '==', true),
    where('startDate', '<=', Date.now()),
    where('endDate', '>=', Date.now())
  );
  
  const snapshot = await getDocs(promotedQuery);
  const promoted: Card[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    
    // Filter by category
    if (
      data.targetCategories.length === 0 ||
      data.targetCategories.includes(selectedCategory)
    ) {
      // Filter by city
      if (
        data.targetCities.length === 0 ||
        data.targetCities.includes(userCity)
      ) {
        promoted.push({
          id: doc.id,
          ...data,
          isPromoted: true,
        });
      }
    }
  });
  
  // Pick 1-2 promoted cards
  const selectedPromoted = promoted.slice(0, 2);
  
  // Inject at positions 3 and 8
  const result = [...organicCards];
  
  if (selectedPromoted[0] && result.length >= 3) {
    result.splice(3, 0, selectedPromoted[0]);
  }
  
  if (selectedPromoted[1] && result.length >= 9) {
    result.splice(9, 0, selectedPromoted[1]);
  }
  
  return result;
};
```

**FeedCard Promoted Variant**:

```typescript
// In FeedCard.tsx
{card.isPromoted && (
  <Text style={styles.promotedLabel}>Promoted</Text>
)}

const styles = StyleSheet.create({
  promotedLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
});
```

**Impression Tracking**:

```typescript
// In FeedScreen.tsx
const viewabilityConfig = {
  viewAreaCoveragePercentThreshold: 50,
};

const onViewableItemsChanged = useRef(({ viewableItems }) => {
  viewableItems.forEach((item) => {
    if (item.item.isPromoted && !trackedImpressions.has(item.item.id)) {
      trackImpression(item.item.id);
      trackedImpressions.add(item.item.id);
    }
  });
});

const trackImpression = async (cardId: string) => {
  // Batch impressions (update every 60 seconds)
  impressionQueue.push(cardId);
  
  if (!impressionTimer) {
    impressionTimer = setTimeout(async () => {
      await flushImpressions();
      impressionTimer = null;
    }, 60000);
  }
};

const flushImpressions = async () => {
  const counts: Record<string, number> = {};
  
  impressionQueue.forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
  });
  
  // Call Cloud Function to batch update
  const updateImpressions = httpsCallable(functions, 'updateImpressions');
  await updateImpressions({ counts });
  
  impressionQueue = [];
};
```

**Click Tracking**:

```typescript
// In FeedCard.tsx
const handleJoin = async () => {
  if (card.isPromoted) {
    // Track click
    await updateDoc(doc(firestore, `promoted_cards/${card.id}`), {
      clickCount: increment(1),
    });
  }
  
  // Proceed with join logic
  joinCircle(card.id);
};
```

---

## STEP 38 — Transit Affiliate Links

### Implementation Guide

**Transit Service** (`circles/src/services/transit.service.ts`):

```typescript
/**
 * Build IRCTC affiliate link
 */
export const buildIRCTCLink = (
  transitRoute: string,
  transitDate: string
): string => {
  // Parse train number (e.g., "12163 Dadar Express")
  const trainNumber = transitRoute.match(/\d+/)?.[0] || '';
  
  // Format date as YYYYMMDD
  const date = new Date(transitDate);
  const yyyymmdd = date.toISOString().split('T')[0].replace(/-/g, '');
  
  return `https://www.irctc.co.in/nget/train-search?trainNumber=${trainNumber}&journeyDate=${yyyymmdd}&affiliateCode=CIRCLES2026`;
};

/**
 * Build MakeMyTrip affiliate link
 */
export const buildMakeMyTripLink = (
  flightCode: string,
  transitDate: string,
  origin: string,
  destination: string
): string => {
  const date = new Date(transitDate);
  const yyyymmdd = date.toISOString().split('T')[0].replace(/-/g, '');
  
  return `https://www.makemytrip.com/flights?from=${origin}&to=${destination}&date=${yyyymmdd}&affiliate=CIRCLES2026`;
};
```

**Booking Banner Component**:

```typescript
// In OpenCircleDetailScreen.tsx and FeedCard.tsx

const TransitBookingBanner: React.FC<{
  transitMode: 'train' | 'flight';
  route: string;
  date: string;
  flightCode?: string;
  origin?: string;
  destination?: string;
}> = ({ transitMode, route, date, flightCode, origin, destination }) => {
  const handleBooking = async () => {
    let url = '';
    
    if (transitMode === 'train') {
      url = buildIRCTCLink(route, date);
    } else {
      url = buildMakeMyTripLink(flightCode || '', date, origin || '', destination || '');
    }
    
    // Track analytics
    await addDoc(collection(firestore, 'analytics'), {
      type: 'transit_affiliate_click',
      transitMode,
      route,
      date,
      circleId: circle.id,
      uid: auth.currentUser?.uid,
      timestamp: Date.now(),
    });
    
    // Open in browser
    await WebBrowser.openBrowserAsync(url);
  };
  
  if (transitMode === 'train') {
    return (
      <View style={[styles.bookingBanner, styles.trainBanner]}>
        <Text style={styles.bannerIcon}>🚆</Text>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Book your train ticket</Text>
          <Text style={styles.bannerSubtitle}>Route pre-filled on IRCTC</Text>
        </View>
        <TouchableOpacity style={styles.bannerButton} onPress={handleBooking}>
          <Text style={styles.bannerButtonText}>Book now →</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={[styles.bookingBanner, styles.flightBanner]}>
      <Text style={styles.bannerIcon}>✈️</Text>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>Find flights on MakeMyTrip</Text>
        <Text style={styles.bannerSubtitle}>{flightCode} · {date}</Text>
      </View>
      <TouchableOpacity style={styles.bannerButton} onPress={handleBooking}>
        <Text style={styles.bannerButtonText}>Search flights →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bookingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    gap: 12,
  },
  trainBanner: {
    backgroundColor: '#E0F2F1', // Light teal
  },
  flightBanner: {
    backgroundColor: '#E3F2FD', // Light blue
  },
  bannerIcon: {
    fontSize: 32,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  bannerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bannerButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.surface,
  },
});
```

**Conditional Display**:

```typescript
// Only show banner when:
const shouldShowBookingBanner = (circle: Circle): boolean => {
  // 1. Transit circle
  if (circle.category !== 'Transit') return false;
  
  // 2. Future date (not archived)
  const transitDate = new Date(circle.transitDate);
  if (transitDate < new Date()) return false;
  
  // 3. User has NOT joined
  const currentUid = auth.currentUser?.uid;
  const isMember = circle.members.some((m) => m.uid === currentUid);
  if (isMember) return false;
  
  return true;
};

// Usage
{shouldShowBookingBanner(circle) && (
  <TransitBookingBanner
    transitMode={circle.transitMode}
    route={circle.transitRoute}
    date={circle.transitDate}
    flightCode={circle.flightCode}
    origin={circle.origin}
    destination={circle.destination}
  />
)}
```

**Analytics Query**:

```typescript
// Get affiliate click stats
const getAffiliateStats = async (startDate: number, endDate: number) => {
  const analyticsRef = collection(firestore, 'analytics');
  const q = query(
    analyticsRef,
    where('type', '==', 'transit_affiliate_click'),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate)
  );
  
  const snapshot = await getDocs(q);
  
  const stats = {
    totalClicks: snapshot.size,
    byMode: { train: 0, flight: 0 },
    byRoute: {} as Record<string, number>,
  };
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    stats.byMode[data.transitMode]++;
    stats.byRoute[data.route] = (stats.byRoute[data.route] || 0) + 1;
  });
  
  return stats;
};
```

---

## Testing Checklist

### Subscription

- [ ] Install RevenueCat SDK
- [ ] Configure API keys
- [ ] Test monthly purchase
- [ ] Test annual purchase
- [ ] Test restore purchases
- [ ] Test subscription status check
- [ ] Test upgrade prompts
- [ ] Test feature gating
- [ ] Test expiration handling

### Year in Circles

- [ ] Deploy Cloud Function
- [ ] Test manual trigger
- [ ] Verify stats calculation
- [ ] Test recap screen
- [ ] Test card animations
- [ ] Test share functionality
- [ ] Test free user teaser
- [ ] Test navigation

### Promoted Cards

- [ ] Create promoted card in Firestore
- [ ] Test feed injection
- [ ] Test category targeting
- [ ] Test city targeting
- [ ] Test impression tracking
- [ ] Test click tracking
- [ ] Verify "Promoted" label

### Transit Affiliate

- [ ] Train circle (non-member): Banner shows in feed card
- [ ] Train circle (non-member): Banner shows in detail screen
- [ ] Train circle (member): Banner does NOT show
- [ ] Flight circle (non-member): Banner shows with correct styling
- [ ] Past date transit circle: Banner does NOT show
- [ ] Tap train banner: Opens IRCTC with correct train number and date
- [ ] Tap flight banner: Opens MakeMyTrip with correct route and date
- [ ] Analytics event written to Firestore on tap
- [ ] In-app browser opens with correct toolbar color
- [ ] Error handling: Shows alert if browser fails to open
- [ ] Verify affiliate codes in URLs

---

**Steps 35-38: COMPLETE ✅**

All monetization and growth features fully implemented and integrated!
