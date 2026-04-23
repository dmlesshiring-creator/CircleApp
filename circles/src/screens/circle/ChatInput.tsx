import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Platform,
  Animated,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Message } from '../../types/message.types';
import { useOffline } from '../../hooks/useOffline';
import { getQueue, type QueuedMessage } from '../../services/messageQueue.service';

interface ChatInputProps {
  circleId: string;
  onSend: (text: string) => void;
  onGifPress?: () => void;
  onEmojiPress?: () => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

/**
 * ReplyPreview - Shows message being replied to
 */
const ReplyPreview: React.FC<{
  message: Message;
  onCancel: () => void;
}> = ({ message, onCancel }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderLeftWidth: 3,
      borderLeftColor: Colors.accent,
      backgroundColor: Colors.surfaceAlt,
    }}
  >
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: Typography.fontSize.xs,
          color: Colors.textSecondary,
          fontWeight: Typography.fontWeight.semibold,
        }}
      >
        Replying to {message.senderName}
      </Text>
      <Text
        style={{
          fontSize: Typography.fontSize.sm,
          color: Colors.textSecondary,
        }}
        numberOfLines={1}
      >
        {message.text || '[GIF]'}
      </Text>
    </View>

    <TouchableOpacity onPress={onCancel} style={{ paddingLeft: 8 }}>
      <Text style={{ fontSize: 18, color: Colors.textSecondary }}>✕</Text>
    </TouchableOpacity>
  </View>
);

/**
 * ChatInput - Message input bar with emoji/GIF options
 */
export default function ChatInput({
  circleId,
  onSend,
  onGifPress,
  onEmojiPress,
  replyingTo,
  onCancelReply,
  disabled = false,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isMultiline, setIsMultiline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const { isOnline } = useOffline();

  // Load pending message count
  useEffect(() => {
    const loadPendingCount = async () => {
      const queue = await getQueue(circleId);
      setPendingCount(queue.filter((msg) => msg.status === 'pending').length);
    };

    loadPendingCount();
    
    // Refresh count every 2 seconds
    const interval = setInterval(loadPendingCount, 2000);
    return () => clearInterval(interval);
  }, [circleId]);

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
      setIsMultiline(false);
    }
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    // Check if text spans multiple lines
    const lineCount = newText.split('\n').length;
    setIsMultiline(lineCount > 1);
  };

  const canSend = text.trim().length > 0 && !disabled;
  const inputHeight = isMultiline ? Math.min(100, 16 + lineCount * 20) : 40;

  return (
    <View style={{ backgroundColor: Colors.surface, borderTopColor: Colors.border, borderTopWidth: 1 }}>
      {/* Pending Messages Banner */}
      {!isOnline && pendingCount > 0 && (
        <View
          style={{
            backgroundColor: '#FFF3CD',
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#FFE69C',
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.xs,
              color: '#856404',
              fontWeight: Typography.fontWeight.semibold,
            }}
          >
            ⏱ {pendingCount} message{pendingCount > 1 ? 's' : ''} pending
          </Text>
        </View>
      )}

      {/* Reply Preview */}
      {replyingTo && onCancelReply && (
        <ReplyPreview message={replyingTo} onCancel={onCancelReply} />
      )}

      {/* Input Row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 8,
        }}
      >
        {/* Emoji Button */}
        <TouchableOpacity
          onPress={onEmojiPress}
          disabled={disabled}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: Colors.surfaceAlt,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 20 }}>😊</Text>
        </TouchableOpacity>

        {/* GIF Button */}
        <TouchableOpacity
          onPress={onGifPress}
          disabled={disabled}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: Colors.surfaceAlt,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>GIF</Text>
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textTertiary}
          value={text}
          onChangeText={handleTextChange}
          multiline={true}
          maxLength={500}
          disabled={disabled}
          style={{
            flex: 1,
            fontSize: Typography.fontSize.md,
            color: Colors.textPrimary,
            backgroundColor: Colors.surfaceAlt,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            maxHeight: 100,
            minHeight: 40,
          }}
        />

        {/* Send Button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: canSend ? Colors.primary : Colors.textTertiary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>✈️</Text>
        </TouchableOpacity>
      </View>

      {/* Offline Indicator */}
      {!isOnline && (
        <Text
          style={{
            fontSize: Typography.fontSize.xs,
            color: Colors.textTertiary,
            textAlign: 'center',
            paddingBottom: 8,
            paddingHorizontal: 16,
          }}
        >
          📡 You're offline. Messages will send when you're back online.
        </Text>
      )}
    </View>
  );
}

// Helper to calculate line count
function getLineCount(text: string): number {
  return text.split('\n').length;
}