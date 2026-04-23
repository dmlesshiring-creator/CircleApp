export type PlanType = 'meal' | 'movie' | 'trip' | 'custom';

export type RSVPStatus = 'going' | 'maybe' | 'cantmake';

export interface Plan {
  id: string;
  circleId: string;
  type: PlanType;
  title: string;
  date: string; // ISO date string
  time?: string;
  location?: string;
  details: Record<string, any>;
  creatorUid: string;
  creatorName: string;
  rsvps: Record<string, RSVPStatus>; // uid -> status
  createdAt: number;
  isArchived: boolean;
}
