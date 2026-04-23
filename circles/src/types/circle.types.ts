export type CircleType = 'friends' | 'family' | 'office' | 'custom';

export type MemberRole = 'admin' | 'member' | 'guest';

export interface CircleMember {
  uid: string;
  displayName: string;
  avatarUrl: string;
  role: MemberRole;
  joinedAt: number;
}

export interface PrivateCircle {
  id: string;
  name: string;
  tagline?: string;
  type: CircleType;
  photoUrl?: string;
  creatorUid: string;
  members: CircleMember[];
  inviteToken: string;
  createdAt: number;
  isArchived: boolean;
  lastMessageAt?: number;
  lastMessagePreview?: string;
  unreadCount?: number;
}
