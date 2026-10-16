export type WorkshopStatus = 'ready' | 'live' | 'closed';
export type VotingStatus = 'before' | 'open' | 'closed';
export type MissionScope = 'team' | 'individual';
export type SubmissionStatus = 'draft' | 'submitted';
export type ParticipantType = 'client' | 'consumer';
export type AwardType = 'winningTeam' | 'topWorker';

export interface Workshop {
  id: string;
  title: string;
  description: string;
  category?: string;
  organizerCompany: string;
  location: string;
  locationDetail?: string;
  startAt: string;
  endAt: string;
  status: WorkshopStatus;
  joinCode: string;
  checkinCode: string;
  notice: string;
  prepItems: string[];
  resultsPublic: boolean;
  votingStatus: VotingStatus;
  createdAt: string;
}

export interface WorkshopStats {
  workshopId: string;
  totalParticipants: number;
  checkedInCount: number;
  checkinRate: number;
  teamCount: number;
  missionCount: number;
  submissionCount: number;
  votingCount: number;
}

export interface GlobalActivityLog {
  id: string;
  workshopId: string;
  workshopTitle: string;
  type: 'checkin' | 'submission' | 'vote' | 'notice' | 'status_change';
  message: string;
  timestamp: string;
}

export interface Agenda {
  id: string;
  workshopId: string;
  order: number;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  speaker?: string;
}

export interface Team {
  id: string;
  workshopId: string;
  name: string;
  color: string;
  tableNumber: number;
  memberIds: string[];
}

export interface Participant {
  id: string;
  workshopId: string;
  name: string;
  phone: string; // e.g. 010-3849-2910
  phoneLast4: string; // 2910
  company: string;
  roleTitle?: string;
  type: ParticipantType;
  teamId?: string;
  checkedInAt?: string | null;
  status: 'registered' | 'blocked';
}

export interface Mission {
  id: string;
  workshopId: string;
  order: number;
  title: string;
  description: string;
  scope: MissionScope;
  submitTypes: ('image' | 'doc' | 'video' | 'link' | 'text')[];
  dueAt: string;
  votable: boolean;
  votingStatus: VotingStatus;
  rankingPublished: boolean;
}

export interface SubmissionFile {
  id: string;
  url: string;
  name: string;
  size: number;
  mime: string;
  thumbnailUrl?: string;
}

export interface Submission {
  id: string;
  workshopId: string;
  missionId: string;
  scope: MissionScope;
  teamId?: string;
  participantId: string; // 최종 수정자
  title: string;
  comment: string;
  files: SubmissionFile[];
  links: string[];
  status: SubmissionStatus;
  submittedAt: string;
  version: number;
  voteCount?: number; // 관리자 전용 또는 공개 후 노출
}

export interface Vote {
  id: string;
  workshopId: string;
  missionId: string;
  voterId: string;
  submissionId: string;
  teamId: string; // 피투표 조
  createdAt: string;
}

export interface Feedback {
  id: string;
  workshopId: string;
  submissionId: string;
  authorId: string;
  authorName: string;
  authorTeamName?: string;
  content: string;
  createdAt: string;
}

export interface Award {
  id: string;
  workshopId: string;
  type: AwardType;
  teamId?: string;
  teamName?: string;
  participantId?: string;
  participantName?: string;
  reason: string;
  announcedAt: string;
}

export interface NotificationItem {
  id: string;
  workshopId: string;
  targetType: 'all' | 'team' | 'participant';
  targetId?: string;
  type: 'award' | 'notice' | 'mission' | 'vote' | 'ranking';
  title: string;
  body: string;
  createdAt: string;
  read?: boolean;
}
