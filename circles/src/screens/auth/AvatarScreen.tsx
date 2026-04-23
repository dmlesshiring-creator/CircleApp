import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Routes } from '../../constants/routes';
import Svg, { Circle as SvgCircle, Polygon, Rect, Path } from 'react-native-svg';

/**
 * Progress Indicator Dots
 */
const ProgressDots: React.FC<{ current: number; total: number }> = ({
  current,
  total,
}) => (
  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
    {[...Array(total)].map((_, i) => (
      <View
        key={i}
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: i < current ? Colors.primary : Colors.border,
        }}
      />
    ))}
  </View>
);

/**
 * Preset Avatar Interface
 */
interface PresetAvatar {
  id: string;
  label: string;
  bgColor: string;
  icon: React.ReactNode;
}

/**
 * Preset avatars with simple geometric shapes
 */
const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'person-blue',
    label: 'Person',
    bgColor: '#0066CC',
    icon: (
      <Svg width="40" height="40" viewBox="0 0 40 40">
        <SvgCircle cx="20" cy="12" r="6" fill="#FFFFFF" />
        <Polygon points="20,20 14,32 26,32" fill="#FFFFFF" />
      </Svg>
    ),
  },
  {
    id: 'star-yellow',
    label: 'Star',
    bgColor: '#FFB800',
    icon: (
      <Svg width="40" height="40" viewBox="0 0 40 40">
        <Polygon
          points="20,5 26,18 40,18 29,26 33,39 20,32 7,39 11,26 0,18 14,18"
          fill="#FFFFFF"
        />
      </Svg>
    ),
  },
  {
    id: 'leaf-green',
    label: 'Leaf',
    bgColor: '#2ECC71',
    icon: (
      <Svg width="40" height="40" viewBox="0 0 40 40">
        <Path d="M 20 5 Q 30 15 25 30 Q 20 32 15 30 Q 10 15 20 5" fill="#FFFFFF" />
      </Svg>
    ),
  },
  {
    id: 'sun-orange',
    label: 'Sun',
    bgColor: '#FF6B35',
    icon: (
      <Svg width="40" height="40" viewBox="0 0 40 40">
        <SvgCircle cx="20" cy="20" r="8" fill="#FFFFFF" />
        <Rect x="18" y="4" width="4" height="4" fill="#FFFFFF" />
        <Rect x="18" y="32" width="4" height="4" fill="#FFFFFF" />
        <Rect x="4" y="18" width="4" height="4" fill="#FFFFFF" />
        <Rect x="32" y="18" width="4" height="4" fill="#FFFFFF" />
      </Svg>
    ),
  },
  {
    id: 'moon-purple',
    label: 'Moon',
    bgColor: '#9B59B6',
    icon: (
      <Svg width="40" height="40" viewBox="0 0 40 40">
        <Path
          d="M 15 10 Q 25 10 25 20 Q 25 30 15 30 Q 20 25 20 20 Q 20 15 15 10"
          fill="#FFFFFF"
        />
      </Svg>
    ),
  },
  {
    id: 'wave-teal',
    label: 'Wave',
    bgColor: '#1A6B5A',
    icon: (
      <Svg width="40" height="40" viewBox="0 0 40 40">
        <Path
          d="M 5 20 Q 10 15 15 20 T 25 20 T 35 20"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Path
          d="M 5 28 Q 10 23 15 28 T 25 28 T 35 28"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },
  {
    id: 'mountain-brown',
    label: 'Mountain',
    bgColor: '#8B4513',
    icon: (
      <Svg width="40" height="40" viewBox="0 0 40 40">
        <Polygon points="5,35 15,15 25,25 35,10 35,35" fill="#FFFFFF" />
      </Svg>
    ),
  },
  {
    id: 'spark-pink',
    label: 'Spark',
    bgColor: '#E84393',
    icon: (
      <Svg width="40" height="40" viewBox="0 0 40 40">
        <Polygon
          points="20,5 23,15 33,15 25,21 28,31 20,25 12,31 15,21 7,15 17,15"
          fill="#FFFFFF"
        />
      </Svg>
    ),
  },
];

/**
 * AvatarScreen - Step 2 of 3 onboarding
 */
export default function AvatarScreen({ navigation }: any) {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_AVATARS[0].id);
  const setAvatarUrl = useAuthStore((state) => state.setAvatarUrl);

  const handleContinue = () => {
    const preset = PRESET_AVATARS.find((a) => a.id === selectedPreset);
    if (preset) {
      setAvatarUrl(`preset:${preset.id}`);
    }
    navigation.navigate(Routes.BIO);
  };

  const handleSkip = () => {
    setAvatarUrl(`preset:${PRESET_AVATARS[0].id}`);
    navigation.navigate(Routes.BIO);
  };

  const handleTapPreview = () => {
    Alert.alert('Choose Avatar', 'Select an option', [
      { text: 'Take photo', onPress: () => {} },
      { text: 'Choose from library', onPress: () => {} },
      { text: 'Use an avatar', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const currentAvatar = PRESET_AVATARS.find((a) => a.id === selectedPreset);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.surface }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    >
      {/* Progress Indicator */}
      <View style={{ marginTop: 32, marginBottom: 40 }}>
        <ProgressDots current={2} total={3} />
      </View>

      {/* Heading */}
      <Text
        style={{
          fontSize: Typography.fontSize.xxxl,
          fontWeight: Typography.fontWeight.bold,
          color: Colors.textPrimary,
          marginBottom: 32,
          textAlign: 'center',
        }}
      >
        Pick a photo
      </Text>

      {/* Large Avatar Preview */}
      {currentAvatar && (
        <TouchableOpacity
          onPress={handleTapPreview}
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: currentAvatar.bgColor,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 40,
            alignSelf: 'center',
          }}
        >
          {currentAvatar.icon}
        </TouchableOpacity>
      )}

      {/* Preset Avatars Grid */}
      <Text
        style={{
          fontSize: Typography.fontSize.sm,
          color: Colors.textSecondary,
          marginBottom: 12,
        }}
      >
        Choose a style:
      </Text>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginBottom: 40,
        }}
      >
        {PRESET_AVATARS.map((avatar) => (
          <TouchableOpacity
            key={avatar.id}
            onPress={() => setSelectedPreset(avatar.id)}
            style={{
              width: '23%',
              aspectRatio: 1,
              borderRadius: 32,
              backgroundColor: avatar.bgColor,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
              borderWidth: selectedPreset === avatar.id ? 3 : 0,
              borderColor: Colors.primary,
              position: 'relative',
            }}
          >
            {avatar.icon}
            {selectedPreset === avatar.id && (
              <View
                style={{
                  position: 'absolute',
                  bottom: -8,
                  right: -8,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: Colors.success,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: Colors.surface,
                    fontSize: 14,
                    fontWeight: 'bold',
                  }}
                >
                  ✓
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Continue Button */}
      <TouchableOpacity
        onPress={handleContinue}
        style={{
          backgroundColor: Colors.accent,
          borderRadius: 8,
          paddingVertical: 14,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: Typography.fontSize.md,
            fontWeight: Typography.fontWeight.semibold,
            color: Colors.surface,
          }}
        >
          Continue →
        </Text>
      </TouchableOpacity>

      {/* Skip Link */}
      <TouchableOpacity onPress={handleSkip} style={{ paddingVertical: 12 }}>
        <Text
          style={{
            fontSize: Typography.fontSize.md,
            color: Colors.primary,
            textAlign: 'center',
            fontWeight: Typography.fontWeight.semibold,
          }}
        >
          Skip for now
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
