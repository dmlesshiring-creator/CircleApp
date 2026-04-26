import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { firestore, auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';

interface Message {
  id: string;
  text: string;
  senderUid: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: Timestamp;
  type: 'text' | 'system';
}

interface SimpleChatViewProps {
  circleId: string;
  circleType: 'private' | 'public';
}

export const SimpleChatView: React.FC<SimpleChatViewProps> = ({ circleId, circleType }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!circleId) return;

    const collectionPath = circleType === 'private' 
      ? `circles/${circleId}/messages`
      : `public_circles/${circleId}/messages`;

    const messagesRef = collection(firestore, collectionPath);
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedMessages: Message[] = [];
        snapshot.forEach((doc) => {
          fetchedMessages.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(fetchedMessages.reverse());
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [circleId, circleType]);

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const collectionPath = circleType === 'private'
        ? `circles/${circleId}/messages`
        : `public_circles/${circleId}/messages`;

      const messagesRef = collection(firestore, collectionPath);
      await addDoc(messagesRef, {
        text: messageText,
        senderUid: currentUser.uid,
        senderName: currentUser.displayName || 'Unknown',
        senderAvatar: currentUser.photoURL || '',
        createdAt: serverTimestamp(),
        type: 'text',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderUid === currentUser?.uid;
    const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].senderUid !== item.senderUid);
    const showName = !isOwnMessage && showAvatar;

    if (item.type === 'system') {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isOwnMessage && styles.messageRowOwn]}>
        {!isOwnMessage && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.senderName.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={styles.avatarSpacer} />
            )}
          </View>
        )}
        <View style={[styles.messageBubble, isOwnMessage && styles.messageBubbleOwn]}>
          {showName && <Text style={styles.senderName}>{item.senderName}</Text>}
          <Text style={[styles.messageText, isOwnMessage && styles.messageTextOwn]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, isOwnMessage && styles.messageTimeOwn]}>
            {item.createdAt?.toDate?.()?.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            }) || ''}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>Be the first to say hi! 👋</Text>
          </View>
        }
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.surface,
  },
  avatarSpacer: {
    width: 32,
  },
  messageBubble: {
    maxWidth: '70%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageBubbleOwn: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  messageTextOwn: {
    color: Colors.surface,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: Colors.surface,
    opacity: 0.8,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMessageText: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: Colors.textTertiary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 16,
    color: Colors.textPrimary,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.surface,
  },
});
