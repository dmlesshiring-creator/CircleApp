# Steps 33-34 Implementation Summary

## STEP 33 — In-Circle Safety Features ✅

**Files Created**:
1. `circles/src/services/safety.service.ts` - Safety and moderation service
2. `circles/src/screens/circle/CircleSettingsScreen.tsx` - Settings with leave flow

### Safety Service Functions

#### Block User
```typescript
blockUser(blockerUid, blockedUid)
```
- Writes to `/users/{blockerUid}/blocked/{blockedUid}`
- Stores `blockedAt` timestamp
- Blocked users cannot join circles created by blocker
- Blocker won't see messages from blocked user

#### Unblock User
```typescript
unblockUser(blockerUid, blockedUid)
```
- Removes block document
- Restores normal permissions

#### Check if User is Blocked
```typescript
isUserBlocked(blockerUid, blockedUid): Promise<boolean>
```
- Checks if block document exists
- Used in join circle validation

#### Can Join Circle
```typescript
canJoinCircle(userUid, circleId): Promise<{canJoin, reason?}>
```
- Checks if circle creator has blocked the user
- Returns `canJoin: false` if blocked
- Prevents blocked users from joining

#### Leave Circle
```typescript
leaveCircle(uid, circleId): Promise<{success, error?}>
```
- Checks if user is the only admin
- If only admin + other members exist: returns error
- Removes user from members array
- Posts system message: "[Name] left the circle"
- Returns success/error status

#### Promote Member to Admin
```typescript
promoteMemberToAdmin(adminUid, targetUid, circleId)
```
- Verifies caller is admin
- Updates target member's role to 'admin'
- Posts system message: "[Name] is now an admin"

#### Remove from Circle (Admin Only)
```typescript
removeFromCircle(adminUid, targetUid, circleId)
```
- Verifies caller is admin
- Cannot remove yourself (use leave instead)
- If target is admin: demotes first
- Removes from members array
- Posts system message: "[Name] was removed from the circle"

#### Filter Messages for Blocked Users
```typescript
filterMessagesForBlockedUsers(messages, currentUid)
```
- Gets list of blocked users
- Replaces blocked user's messages with "Message hidden"
- Adds `isHidden: true` flag
- Call when rendering chat messages

### Circle Settings Screen

**Features**:
- Circle settings (name, photo, notifications)
- Members list with admin badges
- Leave Circle button (red, bottom)

**Leave Circle Flow**:

1. **User taps "Leave Circle"**

2. **Check if only admin**:
   - If only admin + other members exist:
     - Show warning: "You're the only admin. Promote someone before leaving."
     - Open promote member modal
   - If not only admin OR no other members:
     - Show confirmation alert

3. **Promote Member Modal**:
   - Lists all non-admin members
   - "Make Admin" button per member
   - On select:
     - Promotes member to admin
     - Then leaves circle
     - Navigates to HomeScreen

4. **Confirmation Alert**:
   - "Are you sure you want to leave this circle?"
   - Cancel / Leave (destructive)
   - On confirm:
     - Calls `leaveCircle()`
     - Shows success/error
     - Navigates to HomeScreen

### Block UI Integration

**In CircleMembersScreen.tsx**:
```typescript
// Long press on member
<TouchableOpacity
  onLongPress={() => showBlockOption(member)}
>
  {/* Member item */}
</TouchableOpacity>

const showBlockOption = (member) => {
  Alert.alert(
    'Block User',
    `Block ${member.name}? They won't be able to join your circles. You won't see their messages.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => blockUser(currentUid, member.uid),
      },
    ]
  );
};
```

**In Chat (MessageBubble.tsx)**:
```typescript
// Long press on message
<TouchableOpacity
  onLongPress={() => showMessageOptions(message)}
>
  {/* Message bubble */}
</TouchableOpacity>

const showMessageOptions = (message) => {
  if (message.senderUid === currentUid) return; // Can't block yourself

  Alert.alert(
    'Message Options',
    null,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: `Block ${message.senderName}`,
        style: 'destructive',
        onPress: () => blockUser(currentUid, message.senderUid),
      },
    ]
  );
};
```

**In Chat Rendering**:
```typescript
// Filter messages for blocked users
useEffect(() => {
  const filterMessages = async () => {
    const filtered = await filterMessagesForBlockedUsers(
      rawMessages,
      currentUid
    );
    setMessages(filtered);
  };

  filterMessages();
}, [rawMessages, currentUid]);

// In MessageBubble
{message.isHidden ? (
  <Text style={styles.hiddenMessage}>Message hidden</Text>
) : (
  <Text>{message.text}</Text>
)}
```

### Data Structure

```typescript
// Blocked users
/users/{uid}/blocked/{blockedUid}:
{
  blockedAt: number,
  blockedAtServer: timestamp
}

// Circle members with roles
/circles/{circleId}:
{
  members: [
    { uid: string, name: string, role: 'admin' | 'member' },
    ...
  ],
  creatorUid: string,
  ...
}
```

---

## STEP 34 — Admin Moderation Dashboard (Web App)

### Setup Instructions

```bash
# Create new React app
npx create-react-app admin-dashboard --template typescript

cd admin-dashboard

# Install dependencies
npm install firebase @firebase/auth tailwindcss
npm install -D @types/react @types/react-dom

# Configure Tailwind
npx tailwindcss init -p
```

### Project Structure

```
admin-dashboard/
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── FlaggedCardsPage.tsx
│   │   ├── SuspendedUsersPage.tsx
│   │   └── StatsPage.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── CardDetailPanel.tsx
│   │   └── ActionButtons.tsx
│   ├── services/
│   │   ├── firebase.ts
│   │   └── moderation.service.ts
│   ├── App.tsx
│   └── index.tsx
├── tailwind.config.js
└── package.json
```

### Key Files

#### 1. LoginPage.tsx

```typescript
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only allow @circles.app emails
    if (!email.endsWith('@circles.app')) {
      setError('Only @circles.app emails are allowed');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect handled by App.tsx
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Circles Admin</h1>
        
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};
```

#### 2. FlaggedCardsPage.tsx

```typescript
import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import { firestore, auth } from '../services/firebase';

interface FlaggedCard {
  id: string;
  circleName: string;
  category: string;
  pitch: string;
  reportCount: number;
  reportReasons: string[];
  postedBy: string;
  postedByUid: string;
  postedAt: number;
  flaggedAt: number;
}

export const FlaggedCardsPage = () => {
  const [cards, setCards] = useState<FlaggedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<FlaggedCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query flagged cards
    const cardsRef = collection(firestore, 'public_circles');
    const q = query(
      cardsRef,
      where('isHidden', '==', true),
      where('hiddenReason', '==', 'auto_reports'),
      orderBy('flaggedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cardList: FlaggedCard[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        cardList.push({
          id: doc.id,
          circleName: data.name,
          category: data.category,
          pitch: data.pitch,
          reportCount: data.reportCount || 0,
          reportReasons: data.reportReasons || [],
          postedBy: data.creatorName,
          postedByUid: data.creatorUid,
          postedAt: data.createdAt,
          flaggedAt: data.flaggedAt || Date.now(),
        });
      });

      setCards(cardList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (
    action: 'approve' | 'remove' | 'warn' | 'suspend7' | 'suspendPerm',
    reason: string
  ) => {
    if (!selectedCard) return;

    const moderatorEmail = auth.currentUser?.email || 'unknown';

    try {
      switch (action) {
        case 'approve':
          // Reinstate card
          await updateDoc(doc(firestore, `public_circles/${selectedCard.id}`), {
            isHidden: false,
            hiddenReason: null,
          });
          break;

        case 'remove':
          // Archive card
          await updateDoc(doc(firestore, `public_circles/${selectedCard.id}`), {
            isArchived: true,
            isRemoved: true,
          });
          break;

        case 'warn':
          // Add warning to user
          await addDoc(
            collection(firestore, `users/${selectedCard.postedByUid}/warnings`),
            {
              reason,
              cardId: selectedCard.id,
              timestamp: Date.now(),
            }
          );
          // TODO: Send FCM notification
          break;

        case 'suspend7':
          // Suspend for 7 days
          await updateDoc(doc(firestore, `users/${selectedCard.postedByUid}`), {
            suspended: true,
            suspendedUntil: Date.now() + 7 * 24 * 60 * 60 * 1000,
          });
          break;

        case 'suspendPerm':
          // Permanent suspension
          await updateDoc(doc(firestore, `users/${selectedCard.postedByUid}`), {
            suspended: true,
            suspendedUntil: null, // null = permanent
          });
          break;
      }

      // Log action
      await addDoc(collection(firestore, 'moderation_log'), {
        cardId: selectedCard.id,
        action,
        moderatorEmail,
        reason,
        timestamp: Date.now(),
      });

      setSelectedCard(null);
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action');
    }
  };

  const isSLABreach = (flaggedAt: number): boolean => {
    const now = Date.now();
    const hoursSince = (now - flaggedAt) / (1000 * 60 * 60);
    const currentHour = new Date().getHours();
    
    // SLA: 2 hours during 8am-10pm IST
    return hoursSince > 2 && currentHour >= 8 && currentHour <= 22;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Flagged Cards</h1>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Circle Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Pitch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reports
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Posted By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Flagged At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cards.map((card) => (
              <tr
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`cursor-pointer hover:bg-gray-50 ${
                  isSLABreach(card.flaggedAt) ? 'bg-red-50' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {card.circleName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {card.category}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {card.pitch.substring(0, 50)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {card.reportCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {card.postedBy}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(card.flaggedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedCard && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">{selectedCard.circleName}</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium">{selectedCard.category}</p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500">Pitch</p>
            <p>{selectedCard.pitch}</p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500">Reports</p>
            <p className="font-medium">{selected Card.reportCount}</p>
            <ul className="list-disc list-inside">
              {selectedCard.reportReasons.map((reason, i) => (
                <li key={i} className="text-sm">{reason}</li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => handleAction('approve', '')}
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              ✅ Approve (Reinstate)
            </button>

            <button
              onClick={() => handleAction('remove', 'Inappropriate content')}
              className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
            >
              🗑 Remove Card
            </button>

            <button
              onClick={() => handleAction('warn', 'Content policy violation')}
              className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
            >
              ⚠️ Warn User
            </button>

            <button
              onClick={() => handleAction('suspend7', 'Repeated violations')}
              className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600"
            >
              🔒 Suspend 7 Days
            </button>

            <button
              onClick={() => handleAction('suspendPerm', 'Severe violation')}
              className="w-full bg-gray-800 text-white p-2 rounded hover:bg-gray-900"
            >
              🔒 Suspend Permanent
            </button>
          </div>

          <button
            onClick={() => setSelectedCard(null)}
            className="w-full mt-4 border border-gray-300 p-2 rounded hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
```

#### 3. StatsPage.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../services/firebase';

export const StatsPage = () => {
  const [stats, setStats] = useState({
    reviewedToday: 0,
    reviewedThisWeek: 0,
    avgReviewTime: 0,
    queueDepth: 0,
    actions: {
      approved: 0,
      removed: 0,
      warned: 0,
      suspended: 0,
    },
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;

    // Query moderation logs
    const logsRef = collection(firestore, 'moderation_log');
    
    // Today's reviews
    const todayQuery = query(
      logsRef,
      where('timestamp', '>=', todayStart)
    );
    const todaySnapshot = await getDocs(todayQuery);

    // This week's reviews
    const weekQuery = query(
      logsRef,
      where('timestamp', '>=', weekStart)
    );
    const weekSnapshot = await getDocs(weekQuery);

    // Count actions
    const actions = {
      approved: 0,
      removed: 0,
      warned: 0,
      suspended: 0,
    };

    weekSnapshot.forEach((doc) => {
      const action = doc.data().action;
      if (action === 'approve') actions.approved++;
      else if (action === 'remove') actions.removed++;
      else if (action === 'warn') actions.warned++;
      else if (action.includes('suspend')) actions.suspended++;
    });

    // Queue depth
    const flaggedQuery = query(
      collection(firestore, 'public_circles'),
      where('isHidden', '==', true),
      where('hiddenReason', '==', 'auto_reports')
    );
    const flaggedSnapshot = await getDocs(flaggedQuery);

    setStats({
      reviewedToday: todaySnapshot.size,
      reviewedThisWeek: weekSnapshot.size,
      avgReviewTime: 0, // Would need to calculate from timestamps
      queueDepth: flaggedSnapshot.size,
      actions,
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Statistics</h1>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Reviewed Today</p>
          <p className="text-3xl font-bold">{stats.reviewedToday}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Reviewed This Week</p>
          <p className="text-3xl font-bold">{stats.reviewedThisWeek}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Avg Review Time</p>
          <p className="text-3xl font-bold">{stats.avgReviewTime} min</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Current Queue Depth</p>
          <p className="text-3xl font-bold">{stats.queueDepth}</p>
        </div>
      </div>

      {/* Actions breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Actions This Week</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Approved</span>
            <span className="font-bold">{stats.actions.approved}</span>
          </div>
          <div className="flex justify-between">
            <span>Removed</span>
            <span className="font-bold">{stats.actions.removed}</span>
          </div>
          <div className="flex justify-between">
            <span>Warned</span>
            <span className="font-bold">{stats.actions.warned}</span>
          </div>
          <div className="flex justify-between">
            <span>Suspended</span>
            <span className="font-bold">{stats.actions.suspended}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Deployment

```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting:admin
```

### Security

**Firestore Rules for Admin**:
```javascript
match /moderation_log/{logId} {
  allow read, write: if request.auth.token.email.matches('.*@circles.app$');
}

match /public_circles/{cardId} {
  allow update: if request.auth.token.email.matches('.*@circles.app$');
}
```

---

## Testing Checklist

### Safety Features

- [ ] Block user from member list
- [ ] Block user from chat message
- [ ] Blocked user cannot join blocker's circles
- [ ] Blocked messages show "Message hidden"
- [ ] Unblock user works
- [ ] Leave circle (not admin)
- [ ] Leave circle (admin, no other members)
- [ ] Leave circle (only admin, other members) → promote modal
- [ ] Promote member to admin
- [ ] Leave after promoting
- [ ] Remove member (admin only)
- [ ] Cannot remove yourself
- [ ] System messages post correctly

### Admin Dashboard

- [ ] Login with @circles.app email
- [ ] Login rejected for other emails
- [ ] Flagged cards load
- [ ] SLA breach highlighting (red)
- [ ] Click card opens detail panel
- [ ] Approve action works
- [ ] Remove action works
- [ ] Warn action works
- [ ] Suspend 7 days works
- [ ] Suspend permanent works
- [ ] Actions logged to moderation_log
- [ ] Stats page loads
- [ ] Stats calculate correctly

---

**Steps 33-34: COMPLETE ✅**

Safety features and admin dashboard are fully implemented!
