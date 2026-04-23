import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const DAILY_API_KEY = functions.config().daily?.api_key || process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1/rooms';

interface CreateVideoRoomRequest {
  circleId: string;
}

interface CreateVideoRoomResponse {
  roomUrl: string;
  token: string;
  roomName: string;
}

/**
 * Cloud Function: Create Daily.co Video Room
 * 
 * Creates a temporary video room for circle video calls
 * Sends push notification to all circle members
 */
export const createVideoRoom = functions.https.onCall(
  async (
    data: CreateVideoRoomRequest,
    context: functions.https.CallableContext
  ): Promise<CreateVideoRoomResponse> => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to create video room'
      );
    }

    const { circleId } = data;
    const callerUid = context.auth.uid;

    if (!circleId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'circleId is required'
      );
    }

    if (!DAILY_API_KEY) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Daily.co API key not configured'
      );
    }

    try {
      // Verify user is member of circle
      const circleRef = admin.firestore().collection('circles').doc(circleId);
      const circleDoc = await circleRef.get();

      if (!circleDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Circle not found');
      }

      const circleData = circleDoc.data();
      const members = circleData?.members || [];
      const isMember = members.some((m: any) => m.uid === callerUid);

      if (!isMember) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'User is not a member of this circle'
        );
      }

      // Get caller's display name
      const userDoc = await admin
        .firestore()
        .collection('users')
        .doc(callerUid)
        .get();
      const callerName = userDoc.data()?.displayName || 'Someone';

      // Create Daily.co room
      const roomName = `circle-${circleId}-${Date.now()}`;
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      const roomResponse = await axios.post(
        DAILY_API_URL,
        {
          name: roomName,
          privacy: 'private',
          properties: {
            exp: expiresAt,
            max_participants: 12,
            enable_screenshare: false,
            enable_chat: false,
            enable_knocking: false,
            start_video_off: false,
            start_audio_off: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const roomUrl = roomResponse.data.url;

      // Create meeting token for secure access
      const tokenResponse = await axios.post(
        `${DAILY_API_URL}/${roomName}/tokens`,
        {
          properties: {
            room_name: roomName,
            is_owner: false,
            exp: expiresAt,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const token = tokenResponse.data.token;

      // Write active call to Firestore
      await circleRef.collection('activeCall').doc('current').set({
        roomUrl,
        roomName,
        token,
        startedByUid: callerUid,
        startedByName: callerName,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt,
        participants: [callerUid],
      });

      // Send push notification to all members except caller
      const otherMembers = members.filter((m: any) => m.uid !== callerUid);

      for (const member of otherMembers) {
        const memberTokensSnapshot = await admin
          .firestore()
          .collection('users')
          .doc(member.uid)
          .collection('pushTokens')
          .get();

        const tokens = memberTokensSnapshot.docs.map(
          (doc) => doc.data().token
        );

        if (tokens.length > 0) {
          const message = {
            notification: {
              title: circleData.name,
              body: `${callerName} started a video call. Tap to join.`,
            },
            data: {
              type: 'video_call',
              circleId,
              roomUrl,
              startedByName: callerName,
            },
            tokens,
          };

          try {
            await admin.messaging().sendMulticast(message);
          } catch (error) {
            console.error(
              `Error sending notification to ${member.uid}:`,
              error
            );
          }
        }
      }

      // Write system message to chat
      const messagesRef = admin
        .database()
        .ref(`circles/${circleId}/messages`)
        .push();

      await messagesRef.set({
        type: 'system',
        text: `${callerName} started a video call`,
        createdAt: Date.now(),
        isSystem: true,
      });

      console.log(`Video room created: ${roomName} for circle ${circleId}`);

      return {
        roomUrl,
        token,
        roomName,
      };
    } catch (error: any) {
      console.error('Error creating video room:', error);

      if (error.response) {
        throw new functions.https.HttpsError(
          'internal',
          `Daily.co API error: ${error.response.data?.error || error.message}`
        );
      }

      throw new functions.https.HttpsError(
        'internal',
        `Failed to create video room: ${error.message}`
      );
    }
  }
);

/**
 * Cloud Function: End Video Call
 * 
 * Cleans up video room and notifies participants
 */
export const endVideoCall = functions.https.onCall(
  async (
    data: { circleId: string },
    context: functions.https.CallableContext
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { circleId } = data;

    try {
      // Delete active call document
      await admin
        .firestore()
        .collection('circles')
        .doc(circleId)
        .collection('activeCall')
        .doc('current')
        .delete();

      console.log(`Video call ended for circle ${circleId}`);

      return { success: true };
    } catch (error: any) {
      console.error('Error ending video call:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to end video call: ${error.message}`
      );
    }
  }
);
