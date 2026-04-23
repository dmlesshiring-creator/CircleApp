# Step 38: Transit Affiliate Links - Quick Start Guide

## What Was Built

Transit booking affiliate integration that shows booking banners for train and flight circles, allowing non-members to book tickets via IRCTC and MakeMyTrip with pre-filled information.

## Files Created

```
circles/src/services/transit.service.ts          (3.5 KB)
circles/src/components/feed/TransitBookingBanner.tsx  (3.9 KB)
```

## Files Modified

```
circles/src/screens/feed/OpenCircleDetailScreen.tsx
circles/src/components/feed/FeedCard.tsx
```

## How It Works

### 1. User Flow (Non-Member)

```
User sees transit circle in feed
  ↓
Booking banner appears (if future date)
  ↓
User taps "Book now →" or "Search flights →"
  ↓
Analytics tracked to Firestore
  ↓
In-app browser opens with pre-filled booking page
  ↓
User completes booking on IRCTC/MakeMyTrip
  ↓
Affiliate commission earned
```

### 2. Banner Display Logic

**Shows banner when:**
- ✅ Circle has transit details (mode, route, date)
- ✅ Transit date is in the FUTURE
- ✅ User is NOT a member

**Hides banner when:**
- ❌ User is already a member (they have a ticket)
- ❌ Transit date is in the past (archived)
- ❌ Not a transit circle

### 3. Banner Variants

**Train Banner** (Light Teal):
```
🚆 Book your train ticket
   Route pre-filled on IRCTC
   [Book now →]
```

**Flight Banner** (Light Blue):
```
✈️ Find flights on MakeMyTrip
   BLR-DEL · 15 Jan
   [Search flights →]
```

## Testing

### Quick Test Scenarios

1. **Train Circle (Non-Member)**:
   - Open feed → See train circle card
   - Verify light teal banner appears
   - Tap "Book now →"
   - Verify IRCTC opens with train number

2. **Flight Circle (Non-Member)**:
   - Open feed → See flight circle card
   - Verify light blue banner appears
   - Tap "Search flights →"
   - Verify MakeMyTrip opens with route

3. **Member Check**:
   - Join a transit circle
   - Verify banner disappears

4. **Past Date Check**:
   - View archived transit circle
   - Verify banner does NOT appear

### Test URLs

**IRCTC Example**:
```
https://www.irctc.co.in/nget/train-search?trainNumber=12163&journeyDate=20260125&affiliateCode=CIRCLES2026
```

**MakeMyTrip Example**:
```
https://www.makemytrip.com/flight/search?from=BLR&to=DEL&depart=25/01/2026&tripType=O&adults=1&children=0&infants=0&class=E&intl=false&campaign=circles_app&affiliate=CIRCLES2026
```

## Analytics

Every booking button tap creates this event:

```typescript
/analytics/{eventId}:
{
  type: 'transit_affiliate_click',
  transitMode: 'train' | 'flight',
  route: '12163 Chennai-Mumbai',
  date: '2026-01-25',
  circleId: 'abc123',
  uid: 'user123',
  timestamp: 1735689600000
}
```

### Query Analytics

```typescript
// Get all affiliate clicks
const q = query(
  collection(firestore, 'analytics'),
  where('type', '==', 'transit_affiliate_click')
);

// Get clicks by mode
const trainClicks = query(
  collection(firestore, 'analytics'),
  where('type', '==', 'transit_affiliate_click'),
  where('transitMode', '==', 'train')
);

// Get clicks for specific circle
const circleClicks = query(
  collection(firestore, 'analytics'),
  where('type', '==', 'transit_affiliate_click'),
  where('circleId', '==', 'abc123')
);
```

## Revenue Tracking

### Setup Affiliate Accounts

1. **IRCTC Affiliate Program**:
   - Visit: https://www.irctc.co.in/affiliate
   - Register with affiliate code: `CIRCLES2026`
   - Track conversions via IRCTC dashboard

2. **MakeMyTrip Affiliate Program**:
   - Visit: https://www.makemytrip.com/affiliates
   - Register with campaign: `circles_app`
   - Track conversions via MMT dashboard

### Expected Revenue

**Conservative Estimate**:
- 1000 transit circles/month
- 10 members per circle
- 30% click-through rate (3000 clicks)
- 20% conversion rate (600 bookings)
- ₹50 average commission
- **Monthly Revenue**: ₹30,000

**Optimistic Estimate**:
- 2000 transit circles/month
- 15 members per circle
- 40% click-through rate (12,000 clicks)
- 25% conversion rate (3000 bookings)
- ₹75 average commission
- **Monthly Revenue**: ₹2.25 lakhs

## Troubleshooting

### Banner Not Showing

**Check:**
1. Is it a transit circle? (`transitMode`, `transitRoute`, `transitDate` exist)
2. Is the date in the future? (not archived)
3. Is the user NOT a member?
4. Is `shouldShowBookingBanner()` returning true?

### Link Not Opening

**Check:**
1. Is `expo-web-browser` installed? (should be v55.0.14)
2. Is the URL correctly formatted?
3. Check console for errors
4. Verify network connectivity

### Analytics Not Tracking

**Check:**
1. Is Firebase initialized?
2. Is user authenticated?
3. Check Firestore rules (allow write to `/analytics`)
4. Check console for errors
5. Verify `trackAffiliateClick()` is called before opening browser

## Code Reference

### Import the Banner

```typescript
import { TransitBookingBanner } from '../../components/feed/TransitBookingBanner';
```

### Add Conditional Logic

```typescript
const shouldShowBookingBanner = () => {
  if (!circle?.transitDate) return false;
  
  const now = new Date();
  const transitDate = new Date(circle.transitDate);
  if (transitDate < now) return false;
  
  if (isMember) return false;
  
  return true;
};
```

### Render the Banner

```typescript
{shouldShowBookingBanner() && (
  <TransitBookingBanner
    transitMode={circle.transitMode}
    transitRoute={circle.transitRoute}
    transitDate={circle.transitDate}
    circleId={circle.id}
  />
)}
```

## Next Steps

1. **Test all scenarios** (see Testing section above)
2. **Register affiliate accounts** (IRCTC, MakeMyTrip)
3. **Monitor analytics** (query `/analytics` collection)
4. **Track conversions** (via affiliate dashboards)
5. **Calculate ROI** (commissions vs development cost)

## Support

For issues or questions:
- Check `STEP_38_TRANSIT_AFFILIATE_COMPLETE.md` for detailed implementation
- Check `PHASE_3_MONETIZATION_COMPLETE.md` for overall monetization strategy
- Check `STEPS_35-38_SUMMARY.md` for all Phase 3 features

---

**Status**: ✅ Complete and ready for testing
**Estimated Testing Time**: 30 minutes
**Estimated Revenue**: ₹30,000 - ₹2.25 lakhs per month
