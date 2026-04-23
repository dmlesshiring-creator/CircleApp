import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface FullScreenPromptModalProps {
  visible: boolean;
  circleId: string;
  circleName: string;
  onKeepAsMemory: () => void;
  onLetGo: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FullScreenPromptModal: React.FC<FullScreenPromptModalProps> = ({
  visible,
  circleId,
  circleName,
  onKeepAsMemory,
  onLetGo,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.icon}>🚂</Text>
          <Text style={styles.title}>Your journey is over</Text>
          <Text style={styles.subtitle}>{circleName} has been archived.</Text>

          <Text style={styles.description}>
            Transit circles are automatically archived 24 hours after the journey date.
            You can keep this circle as a memory or let it go.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.keepButton}
              onPress={onKeepAsMemory}
              activeOpacity={0.8}
            >
              <Text style={styles.keepButtonText}>Keep as Memory</Text>
              <Text style={styles.keepButtonSubtext}>
                Move to Past Circles (read-only)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.letGoButton}
              onPress={onLetGo}
              activeOpacity={0.8}
            >
              <Text style={styles.letGoButtonText}>Let it Go</Text>
              <Text style={styles.letGoButtonSubtext}>
                Remove from your circles
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            Other members can still access this circle if they choose to keep it.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 20,
  },
  keepButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  keepButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.surface,
    marginBottom: 4,
  },
  keepButtonSubtext: {
    fontSize: 13,
    color: Colors.surface,
    opacity: 0.8,
  },
  letGoButton: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  letGoButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  letGoButtonSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  note: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
