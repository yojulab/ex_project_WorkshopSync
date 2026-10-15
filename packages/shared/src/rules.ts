import { Submission } from './types';

export function canVoteForSubmission(voterTeamId: string | undefined, targetTeamId: string | undefined): { canVote: boolean; reason?: string } {
  if (!voterTeamId) {
    return { canVote: false, reason: '소속된 조가 없는 참석자는 투표할 수 없습니다.' };
  }
  if (!targetTeamId) {
    return { canVote: false, reason: '대상 결과물의 조 정보가 올바르지 않습니다.' };
  }
  if (voterTeamId === targetTeamId) {
    return { canVote: false, reason: '자신의 조에는 투표할 수 없습니다. (공정성 골든 룰 #1)' };
  }
  return { canVote: true };
}

export function isMissionExpired(dueAt: string): boolean {
  return new Date().getTime() > new Date(dueAt).getTime();
}

export interface RankedSubmission extends Submission {
  rank: number;
  percentage: number;
}

export function calculateRanking(submissions: Submission[]): RankedSubmission[] {
  const sorted = [...submissions].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
  const totalVotes = sorted.reduce((sum, s) => sum + (s.voteCount || 0), 0);

  let currentRank = 1;
  return sorted.map((sub, index) => {
    if (index > 0 && (sub.voteCount || 0) < (sorted[index - 1].voteCount || 0)) {
      currentRank = index + 1;
    }
    const pct = totalVotes > 0 ? Math.round(((sub.voteCount || 0) / totalVotes) * 100) : 0;
    return {
      ...sub,
      rank: currentRank,
      percentage: pct
    };
  });
}
