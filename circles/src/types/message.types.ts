export interface Message {
  id: string;
  circleId: string;
  senderUid: string;
  senderName: string;
  senderAvatar: string;
  text?: string;
  gifUrl?: string;
  imageUrl?: string;
  reactions: Record<string, string[]>; // emoji -> [uid]
  replyTo?: { id: string; text: string; senderName: string };
  createdAt: number;
  deletedForAll: boolean;
  isSystem: boolean; // for "[Name] joined" messages
  isPending?: boolean; // for offline queued messages
}
