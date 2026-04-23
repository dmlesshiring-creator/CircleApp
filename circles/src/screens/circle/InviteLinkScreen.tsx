import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Modal,
  ActivityIndicator,
  Clipboard,
  ToastAndroid,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../services/firebase';
import { generateInviteToken } from '../../utils/inviteToken';
import {
  buildInviteUrl,
  buildShareMessage,
  buildWhatsAppDeepLink,
} from '../../utils/linkUtils';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { PrivateCircle } from '../../types/circle.types';
import QRCode from 'react-native-qrcode-svg';

interface InviteLinkScreenProps {
  circle: PrivateCircle;
  onClose: () => void;
}

/**
 * InviteLinkScreen - Generate and share invite links
 */
export default function InviteLinkScreen({
  circle,
  onClose,
}: InviteLinkScreenProps) {
  const [loading, setLoading] = useState(false);
  const inviteUrl = buildInviteUrl(circle.inviteToken);
  const shareMessage = buildShareMessage(circle.name, inviteUrl);

  const handleCopyLink = async () => {
    try {
      await Clipboard.setString(inviteUrl);
      ToastAndroid.show('Link copied!', ToastAndroid.SHORT);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: shareMessage,
        title: `Join ${circle.name}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleWhatsApp = async () => {
    try {
      const whatsappLink = buildWhatsAppDeepLink(shareMessage);
      // In a real app, use Linking.openURL(whatsappLink)
      // For now, just show the message
      Alert.alert('Share on WhatsApp', shareMessage, [
        { text: 'Copy Message', onPress: () => Clipboard.setString(shareMessage) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const handleRevokeLink = async () => {
    Alert.alert(
      'Generate New Link',
      'Create a new invite link? The old one will no longer work.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const newToken = generateInviteToken();
              const circleRef = doc(firestore, 'circles', circle.id);
              await updateDoc(circleRef, { inviteToken: newToken });
              // Note: In a real app, would update local state or refresh
              Alert.alert('Success', 'New invite link generated');
            } catch (error) {
              Alert.alert('Error', 'Failed to generate new link');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Text
          style={{
            fontSize: Typography.fontSize.lg,
            fontWeight: Typography.fontWeight.semibold,
            color: Colors.textPrimary,
            flex: 1,
          }}
          numberOfLines={1}
        >
          Invite to {circle.name}
        </Text>

        <TouchableOpacity onPress={onClose}>
          <Text style={{ fontSize: 24, color: Colors.textSecondary }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}>
        {/* QR Code */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: Colors.surfaceAlt,
            }}
          >
            <QRCode value={inviteUrl} size={200} color={Colors.textPrimary} />
          </View>
        </View>

        {/* Invite URL */}
        <View style={{ marginBottom: 32, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: Typography.fontSize.md,
              color: Colors.textSecondary,
              marginBottom: 8,
            }}
          >
            Invite link:
          </Text>

          <TouchableOpacity
            onPress={handleCopyLink}
            style={{
              backgroundColor: Colors.surfaceAlt,
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.md,
                color: Colors.primary,
                fontWeight: Typography.fontWeight.semibold,
                fontFamily: 'monospace',
              }}
            >
              {inviteUrl}
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              fontSize: Typography.fontSize.xs,
              color: Colors.textTertiary,
            }}
          >
            Tap to copy
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ marginBottom: 32, gap: 12 }}>
          {/* Copy Button */}
          <TouchableOpacity
            onPress={handleCopyLink}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.primary,
              borderRadius: 8,
              paddingVertical: 12,
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>📋</Text>
            <Text
              style={{
                fontSize: Typography.fontSize.md,
                fontWeight: Typography.fontWeight.semibold,
                color: Colors.surface,
              }}
            >
              Copy Link
            </Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            onPress={handleShare}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.accent,
              borderRadius: 8,
              paddingVertical: 12,
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>↗️</Text>
            <Text
              style={{
                fontSize: Typography.fontSize.md,
                fontWeight: Typography.fontWeight.semibold,
                color: Colors.surface,
              }}
            >
              Share
            </Text>
          </TouchableOpacity>

          {/* WhatsApp Button */}
          <TouchableOpacity
            onPress={handleWhatsApp}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#25D366',
              borderRadius: 8,
              paddingVertical: 12,
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>💬</Text>
            <Text
              style={{
                fontSize: Typography.fontSize.md,
                fontWeight: Typography.fontWeight.semibold,
                color: Colors.surface,
              }}
            >
              WhatsApp
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info text */}
        <Text
          style={{
            fontSize: Typography.fontSize.sm,
            color: Colors.textSecondary,
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
          }}
        >
          Anyone with this link can join your circle.
        </Text>

        {/* Revoke Link */}
        <TouchableOpacity
          onPress={handleRevokeLink}
          style={{
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              color: Colors.error,
              fontWeight: Typography.fontWeight.semibold,
            }}
          >
            Revoke and generate a new link
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Loading Modal */}
      {loading && (
        <Modal transparent={true} animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color={Colors.surface} />
          </View>
        </Modal>
      )}
    </View>
  );
}
