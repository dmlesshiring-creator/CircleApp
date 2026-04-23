export type CircleCategory =
  | 'travel'
  | 'fitness'
  | 'music'
  | 'food'
  | 'hobby'
  | 'neighbourhood'
  | 'professional'
  | 'other';

export type JoinMode = 'open' | 'approval';

export type TransitMode = 'train' | 'flight' | 'bus';

export interface OpenCircle {
  id: string;
  name: string;
  category: CircleCategory;
  pitch: string;
  location?: string;
  city?: string;
  transitMode?: TransitMode;
  transitRoute?: string;
  transitDate?: string;
  tags: string[];
  joinMode: JoinMode;
  creatorUid: string;
  creatorName: string;
  creatorAvatar: string;
  creatorJoinYear: number;
  memberCount: number;
  members: string[]; // uids only
  joinRequests?: string[]; // uids
  createdAt: number;
  isArchived: boolean;
  isPromoted?: boolean;
}
