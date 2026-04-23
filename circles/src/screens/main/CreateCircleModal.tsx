import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import CreateCircleStep1 from './CreateCircleStep1';
import CreateCircleStep2 from './CreateCircleStep2';
import CreateCircleStep3 from './CreateCircleStep3';

interface CreateCircleData {
  type: 'friends' | 'family' | 'office' | 'custom';
  name: string;
  tagline: string;
  photoUrl?: string;
}

interface CreateCircleModalProps {
  onClose: () => void;
  onSuccess: (circleId: string, circleName: string) => void;
}

/**
 * CreateCircleModal - Bottom sheet modal with 3-step circle creation flow
 */
export default function CreateCircleModal({
  onClose,
  onSuccess,
}: CreateCircleModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [circleData, setCircleData] = useState<CreateCircleData>({
    type: 'friends',
    name: '',
    tagline: '',
    photoUrl: undefined,
  });

  const handleStep1Complete = (data: Partial<CreateCircleData>) => {
    setCircleData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleStep2Complete = (photoUrl?: string) => {
    setCircleData((prev) => ({ ...prev, photoUrl }));
    setStep(3);
  };

  const handleStep2Back = () => {
    setStep(1);
  };

  const handleStep3Back = () => {
    setStep(2);
  };

  const handleStep3Complete = (createdCircleId: string) => {
    onSuccess(createdCircleId, circleData.name);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Header with close button */}
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
          }}
        >
          Create a Circle
        </Text>

        <TouchableOpacity onPress={onClose}>
          <Text style={{ fontSize: 24, color: Colors.textSecondary }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Step indicator */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: s <= step ? Colors.primary : Colors.border,
            }}
          />
        ))}
      </View>

      {/* Step content */}
      <View style={{ flex: 1 }}>
        {step === 1 && (
          <CreateCircleStep1
            onNext={handleStep1Complete}
            initialData={circleData}
          />
        )}
        {step === 2 && (
          <CreateCircleStep2
            onNext={handleStep2Complete}
            onBack={handleStep2Back}
          />
        )}
        {step === 3 && (
          <CreateCircleStep3
            circleData={circleData}
            onBack={handleStep3Back}
            onSuccess={handleStep3Complete}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
