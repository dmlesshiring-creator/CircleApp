/**
 * EXAMPLE: ChatInput with Offline Message Queue
 * 
 * This shows how to integrate the message queue in your chat input component.
 * Copy the relevant parts into your actual ChatInput.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { ref, push, set } from 'firebase/database';
import { db, auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { useOffline, useOfflineSync } from '../../hooks/useOffline';
import {
  addToQueue,
  flushQueue,
  getQueue,
  type QueuedMessage,
} from '../../services/messageQueue.service';

interface ChatInputProps {
  circleId: string;
  onMessageSent?: () => void;
}

export const ChatInputExample: React.FC<ChatInputProps> = ({
  circleId,
  onMessageSent,
}) => {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<QueuedMessage[]>([]);
  
  const { isOnline } = useOffline();
  const currentUser = auth.currentUser;

  // Load pending messages on mount
  useEffect(() => {
    loadPendingMessages();
  }, [circleId]);

  // Flush queue when back online
  useOfflineSync(async () => {
    console.log('Back online, flushing message queue...');
    await flushQueue(circleId);
    await loadPendingMessages();
    onMessageSent?.();
  });

  const loadPendingMessages = async () => {
    const queue = await getQueue(circleId);
    setPendingMessages(queue.filter((msg) => msg.status === 'pending'));
  };

  const handleSend = async () => {
    if (!messageText.trim() || !currentUser) return;

    const text = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      if (!isOnline) {
        // Add to queue when offline
        const queuedMessage = await addToQueue(
          circleId,
          text,
          currentUser.uid,
          currentUser.displayName || 'Unknown'
        );

        // Update pending messages list
        setPendingMessages((prev) => [...prev, queuedMessage]);

        console.log('Message queued for offline sending');
      } else {
        // Send immediately when online
        await sendMessage(text);
      }

      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!currentUser) return;

    const messagesRef = ref(db, `circles/${circleId}/messages`);
    const newMessageRef = push(messagesRef);

    await set(newMessageRef, {
      type: 'text',
      text,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Unknown',
      createdAt: Date.now(),
    });
  };

  return (
    <View style={styles.container}>
      {/* Show pending message count when offline */}
      {!isOnline && pendingMessages.length > 0 && (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingText}>
            ⏱ {pendingMessages.length} message{pendingMessages.length > 1 ? 's' : ''} pending
          </Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
          placeholderTextColor={Colors.textTertiary}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!messageText.trim() || sending}
        >
          <Text style={styles.sendButtonText}>
            {sending ? '...' : '➤'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Show offline indicator */}
      {!isOnline && (
        <Text style={styles.offlineText}>
          📡 You're offline. Messages will send when you're back online.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pendingBanner: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
  },
  pendingText: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 20,
    color: Colors.surface,
  },
  offlineText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
});
