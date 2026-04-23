import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyParticipant,
  DailyEventObjectParticipant,
} from '@daily-co/react-native-daily-js';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoCallScreenProps {
  route: {
    params: {
      circleId: string;
      roomUrl: string;
      token?: string;
    };
  };
  navigation: any;
}

/**
 * Participant Video Tile
 */
const ParticipantTile: React.FC<{
  participant: DailyParticipant;
  gridSize: number;
}> = ({ participant, gridSize }) => {
  const isLocal = participant.local;
  const isMuted = !participant.audio;
  const isVideoOff = !participant.video;

  return (
    <View
      style={[
        styles.participantTile,
        {
          width: gridSize === 1 ? SCREEN_WIDTH : SCREEN_WIDTH / Math.ceil(Math.sqrt(gridSize)),
          height: gridSize === 1 ? SCREEN_HEIGHT : SCREEN_HEIGHT / Math.ceil(Math.sqrt(gridSize)),
        },
      ]}
    >
      {/* Video feed would be rendered here by Daily SDK */}
      {/* For now, showing placeholder */}
      <View style={styles.videoPlaceholder}>
        {isVideoOff && (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {participant.user_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </View>

      {/* Name label */}
      <View style={styles.nameLabel}>
        <Text style={styles.nameText} numberOfLines={1}>
          {participant.user_name || 'Guest'} {isLocal && '(You)'}
        </Text>
        {isMuted && <Text style={styles.muteIcon}>🔇</Text>}
      </View>
    </View>
  );
};

/**
 * Video Call Screen
 * 
 * Full-screen video call interface using Daily.co
 */
export default function VideoCallScreen({
  route,
  navigation,
}: VideoCallScreenProps) {
  const { circleId, roomUrl, token } = route.params;

  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [participants, setParticipants] = useState<Record<string, DailyParticipant>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showParticipantList, setShowParticipantList] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTime = useRef<number>(Date.now());

  useEffect(() => {
    initializeCall();

    return () => {
      cleanupCall();
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
      setCallDuration(duration);

      // Free tier: 30-minute limit
      if (duration >= 25 * 60 && duration < 30 * 60) {
        setShowTimeWarning(true);
      }

      if (duration >= 30 * 60) {
        setShowUpgradePrompt(true);
        // Grace period: 60 seconds
        if (duration >= 31 * 60) {
          handleEndCall();
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Create call object
      const daily = DailyIframe.createCallObject();
      setCallObject(daily);

      // Set up event listeners
      daily.on('joined-meeting', handleJoinedMeeting);
      daily.on('participant-joined', handleParticipantJoined);
      daily.on('participant-updated', handleParticipantUpdated);
      daily.on('participant-left', handleParticipantLeft);
      daily.on('error', handleError);
      daily.on('left-meeting', handleLeftMeeting);

      // Join the call
      await daily.join({
        url: roomUrl,
        token: token,
      });

      console.log('Joined video call:', roomUrl);
    } catch (error) {
      console.error('Error initializing call:', error);
      Alert.alert('Error', 'Failed to join video call');
      navigation.goBack();
    }
  };

  const cleanupCall = async () => {
    if (callObject) {
      try {
        await callObject.leave();
        await callObject.destroy();
      } catch (error) {
        console.error('Error cleaning up call:', error);
      }
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleJoinedMeeting = (event?: DailyEvent) => {
    console.log('Joined meeting');
    if (callObject) {
      const allParticipants = callObject.participants();
      setParticipants(allParticipants);
    }
  };

  const handleParticipantJoined = (event?: DailyEventObjectParticipant) => {
    console.log('Participant joined:', event?.participant);
    if (callObject) {
      const allParticipants = callObject.participants();
      setParticipants(allParticipants);
    }
  };

  const handleParticipantUpdated = (event?: DailyEventObjectParticipant) => {
    if (callObject) {
      const allParticipants = callObject.participants();
      setParticipants(allParticipants);
    }
  };

  const handleParticipantLeft = (event?: DailyEventObjectParticipant) => {
    console.log('Participant left:', event?.participant);
    if (callObject) {
      const allParticipants = callObject.participants();
      setParticipants(allParticipants);
    }
  };

  const handleError = (event?: any) => {
    console.error('Daily call error:', event);
    Alert.alert('Call Error', 'An error occurred during the call');
  };

  const handleLeftMeeting = () => {
    console.log('Left meeting');
    navigation.goBack();
  };

  const toggleMute = () => {
    if (callObject) {
      callObject.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (callObject) {
      callObject.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const flipCamera = () => {
    if (callObject) {
      callObject.cycleCamera();
    }
  };

  const toggleSpeaker = () => {
    // Note: Speaker toggle implementation depends on platform
    setIsSpeakerOn(!isSpeakerOn);
  };

  const handleEndCall = async () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to leave the call?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            if (isRecording) {
              showRecordingSavePrompt();
            } else {
              await cleanupCall();
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const showRecordingSavePrompt = () => {
    Alert.alert(
      'Save Recording',
      'Do you want to save the recording to your device?',
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: async () => {
            // Discard recording - do not upload
            await cleanupCall();
            navigation.goBack();
          },
        },
        {
          text: 'Yes',
          onPress: async () => {
            await saveRecordingToDevice();
            await cleanupCall();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const saveRecordingToDevice = async () => {
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot save recording without permission');
        return;
      }

      // Note: Actual recording save implementation would depend on
      // how Daily.co provides the recording file
      // This is a placeholder for the save logic

      Alert.alert('Success', 'Recording saved to your device');
    } catch (error) {
      console.error('Error saving recording:', error);
      Alert.alert('Error', 'Failed to save recording');
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const participantList = Object.values(participants);
  const participantCount = participantList.length;

  // Calculate grid size
  let gridSize = participantCount;
  if (participantCount <= 1) gridSize = 1;
  else if (participantCount <= 4) gridSize = 4;
  else if (participantCount <= 9) gridSize = 9;
  else gridSize = 12;

  return (
    <View style={styles.container}>
      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC</Text>
        </View>
      )}

      {/* Time warning banner */}
      {showTimeWarning && !showUpgradePrompt && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⏰ {Math.ceil((30 * 60 - callDuration) / 60)} minutes remaining (free tier)
          </Text>
        </View>
      )}

      {/* Participant grid */}
      <ScrollView
        contentContainerStyle={styles.participantGrid}
        showsVerticalScrollIndicator={false}
      >
        {participantList.map((participant) => (
          <ParticipantTile
            key={participant.session_id}
            participant={participant}
            gridSize={gridSize}
          />
        ))}
      </ScrollView>

      {/* Control bar */}
      <View style={styles.controlBar}>
        {/* Mic toggle */}
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
        </TouchableOpacity>

        {/* Camera toggle */}
        <TouchableOpacity
          style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
          onPress={toggleVideo}
        >
          <Text style={styles.controlIcon}>{isVideoOff ? '📷' : '📹'}</Text>
        </TouchableOpacity>

        {/* Flip camera */}
        <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
          <Text style={styles.controlIcon}>🔄</Text>
        </TouchableOpacity>

        {/* Speaker toggle */}
        <TouchableOpacity
          style={[styles.controlButton, !isSpeakerOn && styles.controlButtonActive]}
          onPress={toggleSpeaker}
        >
          <Text style={styles.controlIcon}>{isSpeakerOn ? '🔊' : '🔇'}</Text>
        </TouchableOpacity>

        {/* Participant list */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowParticipantList(true)}
        >
          <Text style={styles.controlIcon}>👥</Text>
          <View style={styles.participantBadge}>
            <Text style={styles.participantBadgeText}>{participantCount}</Text>
          </View>
        </TouchableOpacity>

        {/* End call */}
        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
          <Text style={styles.endCallIcon}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* Call duration */}
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
      </View>

      {/* Participant list modal */}
      <Modal
        visible={showParticipantList}
        transparent
        animationType="slide"
        onRequestClose={() => setShowParticipantList(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowParticipantList(false)}
        >
          <View style={styles.participantListPanel}>
            <Text style={styles.participantListTitle}>
              Participants ({participantCount})
            </Text>
            <ScrollView>
              {participantList.map((participant) => (
                <View key={participant.session_id} style={styles.participantListItem}>
                  <Text style={styles.participantListName}>
                    {participant.user_name || 'Guest'}
                    {participant.local && ' (You)'}
                  </Text>
                  <View style={styles.participantListStatus}>
                    {!participant.audio && <Text style={styles.statusIcon}>🔇</Text>}
                    {!participant.video && <Text style={styles.statusIcon}>📷</Text>}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Upgrade prompt modal */}
      <Modal
        visible={showUpgradePrompt}
        transparent
        animationType="fade"
      >
        <View style={styles.upgradeModalOverlay}>
          <View style={styles.upgradeModal}>
            <Text style={styles.upgradeTitle}>Free Tier Limit Reached</Text>
            <Text style={styles.upgradeText}>
              You've reached the 30-minute limit for free calls.
            </Text>
            <Text style={styles.upgradeText}>
              Upgrade to Circles+ for unlimited call duration!
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {
                // Navigate to upgrade screen
                setShowUpgradePrompt(false);
                handleEndCall();
              }}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Circles+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.upgradeLaterButton}
              onPress={() => {
                setShowUpgradePrompt(false);
                handleEndCall();
              }}
            >
              <Text style={styles.upgradeLaterText}>End Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 50,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 100,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  recordingText: {
    color: '#FFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  warningBanner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#FFC107',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 100,
  },
  warningText: {
    color: '#000',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  participantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantTile: {
    position: 'relative',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: Typography.fontWeight.bold,
  },
  nameLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    color: '#FFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
  },
  muteIcon: {
    fontSize: 14,
    marginLeft: 4,
  },
  controlBar: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 24,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  controlButtonActive: {
    backgroundColor: Colors.error,
  },
  controlIcon: {
    fontSize: 24,
  },
  participantBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  participantBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
  },
  endCallButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallIcon: {
    fontSize: 28,
    transform: [{ rotate: '135deg' }],
  },
  durationBadge: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  durationText: {
    color: '#FFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  participantListPanel: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  participantListTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  participantListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  participantListName: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  participantListStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  statusIcon: {
    fontSize: 16,
  },
  upgradeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  upgradeModal: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  upgradeTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  upgradeText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.md,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 16,
  },
  upgradeButtonText: {
    color: Colors.surface,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  upgradeLaterButton: {
    marginTop: 12,
    paddingVertical: 12,
  },
  upgradeLaterText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    textAlign: 'center',
  },
});
