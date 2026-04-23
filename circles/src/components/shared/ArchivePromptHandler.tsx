import React from 'react';
import { useNotificationHandler } from '../../services/notification.handler';
import { FullScreenPromptModal } from './FullScreenPromptModal';

/**
 * Component to handle archive prompt notifications globally
 * Place this in your root navigator or App.tsx
 */
export const ArchivePromptHandler: React.FC = () => {
  const {
    archivePrompt,
    handleKeepAsMemory,
    handleLetGo,
  } = useNotificationHandler();

  if (!archivePrompt) return null;

  return (
    <FullScreenPromptModal
      visible={!!archivePrompt}
      circleId={archivePrompt.circleId}
      circleName={archivePrompt.circleName}
      onKeepAsMemory={handleKeepAsMemory}
      onLetGo={handleLetGo}
    />
  );
};
