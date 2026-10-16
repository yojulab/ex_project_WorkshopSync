import http from 'http';
import { URL } from 'url';
import {
  mockWorkshop,
  mockAgendas,
  mockTeams,
  mockParticipants,
  mockMissions,
  mockSubmissions,
  mockFeedbacks,
  mockNotifications,
  mockAwards,
  canVoteForSubmission,
  calculateRanking
} from '@workshopsync/shared';

const PORT = process.env.PORT || process.env.API_PORT || 30015;

// In-Memory Realtime State Store
let workshopState = { ...mockWorkshop };
let participantsState = [...mockParticipants];
let teamsState = [...mockTeams];
let missionsState = [...mockMissions];
let submissionsState = [...mockSubmissions];
let feedbacksState = [...mockFeedbacks];
let notificationsState = [...mockNotifications];
let awardsState = [...mockAwards];
let votesState: { voterId: string; missionId: string; submissionId: string; teamId: string }[] = [];

// SSE 연결 클라이언트 목록
const sseClients: http.ServerResponse[] = [];

function broadcastSSE(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(payload);
    } catch (e) {
      // ignore
    }
  });
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': '*',
    'X-Server-Time': new Date().toISOString()
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;
  const method = req.method || 'GET';

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
      'X-Server-Time': new Date().toISOString()
    });
    return res.end();
  }

  // SSE Stream: /api/v1/workshops/:id/stream
  if (pathname.endsWith('/stream')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    });
    res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);
    sseClients.push(res);

    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
    return;
  }

  try {
    // 1. Health Check
    if (pathname === '/api/v1/health') {
      return sendJson(res, 200, { success: true, service: 'WorkshopSync API', status: 'online', port: PORT });
    }

    // 2. Auth: Participant Login
    if (pathname === '/api/v1/auth/participant/login' && method === 'POST') {
      const body = await parseBody(req);
      const { joinCode, name, phone } = body;
      const cleanPhone = (phone || '').replace(/\D/g, '');

      if (joinCode !== workshopState.joinCode) {
        return sendJson(res, 400, { success: false, error: { code: 'INVALID_CODE', message: '워크샵 코드가 올바르지 않습니다.' } });
      }

      const participant = participantsState.find(
        (p) => p.name.trim() === (name || '').trim() && p.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-4))
      );

      if (!participant) {
        return sendJson(res, 401, {
          success: false,
          error: { code: 'PARTICIPANT_NOT_FOUND', message: '사전 등록 명단과 일치하는 참석자 정보를 찾을 수 없습니다.' }
        });
      }

      const team = teamsState.find((t) => t.id === participant.teamId);

      return sendJson(res, 200, {
        success: true,
        data: {
          token: `mock-jwt-token-for-${participant.id}`,
          participant,
          team,
          workshop: workshopState
        }
      });
    }

    // 3. Workshop Info
    if (pathname.startsWith('/api/v1/workshops/') && pathname.split('/').length === 5 && method === 'GET') {
      return sendJson(res, 200, { success: true, data: workshopState });
    }

    // 4. Checkin
    if (pathname.includes('/checkin') && method === 'POST') {
      const body = await parseBody(req);
      const { participantId, checkinCode } = body;

      if (checkinCode && checkinCode !== workshopState.checkinCode) {
        return sendJson(res, 400, { success: false, error: { code: 'INVALID_CHECKIN_CODE', message: '체크인 코드가 일치하지 않습니다.' } });
      }

      const pIndex = participantsState.findIndex((p) => p.id === participantId);
      if (pIndex !== -1) {
        if (!participantsState[pIndex].checkedInAt) {
          participantsState[pIndex].checkedInAt = new Date().toISOString();
        }
        broadcastSSE('participant.checkedin', { participantId, checkedInAt: participantsState[pIndex].checkedInAt });
        return sendJson(res, 200, {
          success: true,
          data: {
            checkedInAt: participantsState[pIndex].checkedInAt,
            participant: participantsState[pIndex]
          }
        });
      }
      return sendJson(res, 404, { success: false, error: { code: 'NOT_FOUND', message: '참석자를 찾을 수 없습니다.' } });
    }

    // 5. Agendas
    if (pathname.includes('/agendas') && method === 'GET') {
      return sendJson(res, 200, { success: true, data: mockAgendas });
    }

    // 6. Teams
    if (pathname.includes('/teams') && method === 'GET') {
      return sendJson(res, 200, { success: true, data: teamsState });
    }

    // 7. Participants
    if (pathname.includes('/participants') && method === 'GET') {
      return sendJson(res, 200, { success: true, data: participantsState });
    }

    // 8. Missions
    if (pathname.includes('/missions') && !pathname.includes('/submissions') && !pathname.includes('/votes') && method === 'GET') {
      return sendJson(res, 200, { success: true, data: missionsState });
    }

    // 9. Submissions (Gallery)
    if (pathname.includes('/submissions') && method === 'GET') {
      return sendJson(res, 200, { success: true, data: submissionsState });
    }

    // 10. Submit New / Update Submission
    if (pathname.includes('/submissions') && method === 'POST') {
      const body = await parseBody(req);
      const mission = missionsState.find((m) => m.id === body.missionId);
      if (!mission) {
        return sendJson(res, 404, { success: false, error: { code: 'MISSION_NOT_FOUND', message: '미션을 찾을 수 없습니다.' } });
      }

      // 마감 여부 검증
      if (new Date().getTime() > new Date(mission.dueAt).getTime()) {
        return sendJson(res, 400, { success: false, error: { code: 'DEADLINE_PASSED', message: '미션 마감 시각이 경과하여 제출할 수 없습니다.' } });
      }

      const existingIndex = submissionsState.findIndex((s) => s.missionId === body.missionId && s.teamId === body.teamId);
      let savedSubmission;

      if (existingIndex !== -1) {
        // 기존 제출물 업데이트 (버전 증가)
        submissionsState[existingIndex] = {
          ...submissionsState[existingIndex],
          title: body.title || submissionsState[existingIndex].title,
          comment: body.comment || submissionsState[existingIndex].comment,
          files: body.files || submissionsState[existingIndex].files,
          links: body.links || submissionsState[existingIndex].links,
          version: submissionsState[existingIndex].version + 1,
          submittedAt: new Date().toISOString()
        };
        savedSubmission = submissionsState[existingIndex];
      } else {
        savedSubmission = {
          id: `sub-${Date.now()}`,
          workshopId: workshopState.id,
          missionId: body.missionId,
          scope: 'team',
          teamId: body.teamId,
          participantId: body.participantId || 'p-01',
          title: body.title || '신규 작업물',
          comment: body.comment || '',
          files: body.files || [],
          links: body.links || [],
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          version: 1,
          voteCount: 0
        };
        submissionsState.push(savedSubmission as any);
      }

      broadcastSSE('submission.updated', savedSubmission);
      return sendJson(res, 200, { success: true, data: savedSubmission });
    }

    // 11. Preference Vote (골든 룰 #1 자기 조 투표 금지)
    if (pathname.includes('/votes') && method === 'POST') {
      const body = await parseBody(req);
      const { voterId, missionId, submissionId } = body;

      const voter = participantsState.find((p) => p.id === voterId);
      const submission = submissionsState.find((s) => s.id === submissionId);

      if (!voter || !submission) {
        return sendJson(res, 400, { success: false, error: { code: 'INVALID_REQUEST', message: '투표자 또는 결과물 정보를 찾을 수 없습니다.' } });
      }

      const check = canVoteForSubmission(voter.teamId, submission.teamId);
      if (!check.canVote) {
        return sendJson(res, 400, {
          success: false,
          error: { code: 'SELF_VOTE_FORBIDDEN', message: check.reason || '자기 조에는 투표할 수 없습니다.' }
        });
      }

      // 투표 기록 업데이트
      const prevVoteIndex = votesState.findIndex((v) => v.voterId === voterId && v.missionId === missionId);
      if (prevVoteIndex !== -1) {
        const prevTeamId = votesState[prevVoteIndex].teamId;
        const prevSub = submissionsState.find((s) => s.teamId === prevTeamId && s.missionId === missionId);
        if (prevSub && prevSub.voteCount && prevSub.voteCount > 0) prevSub.voteCount--;
        votesState.splice(prevVoteIndex, 1);
      }

      votesState.push({ voterId, missionId, submissionId, teamId: submission.teamId || '' });
      if (typeof submission.voteCount === 'number') {
        submission.voteCount++;
      } else {
        submission.voteCount = 1;
      }

      broadcastSSE('voting.activity', { missionId });
      return sendJson(res, 200, { success: true, data: { votedSubmissionId: submissionId, teamId: submission.teamId } });
    }

    // 12. Ranking (골든 룰 #2 블라인드 득표수)
    if (pathname.includes('/ranking') && method === 'GET') {
      const missionId = pathname.split('/')[4] || 'm-1';
      const mission = missionsState.find((m) => m.id === missionId);

      // 관리자가 순위를 공개하기 전에는 참석자에게 403 차단
      if (mission && !mission.rankingPublished) {
        return sendJson(res, 403, {
          success: false,
          error: { code: 'RANKING_NOT_PUBLISHED', message: '아직 투표 집계 중입니다. 관리자가 순위를 공개하면 확인하실 수 있습니다.' }
        });
      }

      const missionSubmissions = submissionsState.filter((s) => s.missionId === missionId);
      const ranking = calculateRanking(missionSubmissions);
      return sendJson(res, 200, { success: true, data: ranking });
    }

    // 13. Feedbacks
    if (pathname.includes('/feedbacks') && method === 'GET') {
      return sendJson(res, 200, { success: true, data: feedbacksState });
    }
    if (pathname.includes('/feedbacks') && method === 'POST') {
      const body = await parseBody(req);
      const newFeedback = {
        id: `fb-${Date.now()}`,
        workshopId: workshopState.id,
        submissionId: body.submissionId,
        authorId: body.authorId,
        authorName: body.authorName || '참석자',
        authorTeamName: body.authorTeamName || '조원',
        content: body.content,
        createdAt: new Date().toISOString()
      };
      feedbacksState.push(newFeedback);
      broadcastSSE('feedback.added', newFeedback);
      return sendJson(res, 200, { success: true, data: newFeedback });
    }

    // 14. Notifications
    if (pathname.includes('/notifications') && method === 'GET') {
      return sendJson(res, 200, { success: true, data: notificationsState });
    }

    // 15. Awards
    if (pathname.includes('/awards') && method === 'GET') {
      return sendJson(res, 200, { success: true, data: awardsState });
    }

    // 16. Admin Operations
    if (pathname === '/api/v1/admin/auth/login' && method === 'POST') {
      return sendJson(res, 200, {
        success: true,
        data: { token: 'admin-super-token-2026', admin: { email: 'admin@workshopsync.io', name: '총괄 운영자', role: 'admin' } }
      });
    }

    // 관리자: 순위 공개 토글
    if (pathname.includes('/admin/missions/') && pathname.endsWith('/ranking/publish') && method === 'POST') {
      const mId = pathname.split('/')[5];
      const m = missionsState.find((x) => x.id === mId);
      if (m) {
        m.rankingPublished = true;
        broadcastSSE('ranking.published', { missionId: mId });
      }
      return sendJson(res, 200, { success: true, data: { missionId: mId, rankingPublished: true } });
    }

    // 관리자: 시상 확정 & 축하 발송 (골든 룰 #8 SSE + 컨페티)
    if (pathname === '/api/v1/admin/workshops/awards/dispatch' && method === 'POST') {
      const body = await parseBody(req);
      if (body.winningTeamId) {
        const team = teamsState.find((t) => t.id === body.winningTeamId);
        awardsState = [
          {
            id: `award-${Date.now()}`,
            workshopId: workshopState.id,
            type: 'winningTeam',
            teamId: body.winningTeamId,
            teamName: team?.name || '우승팀',
            reason: body.reason || '최고 득표 우승',
            announcedAt: new Date().toISOString()
          }
        ];
      }
      broadcastSSE('award.announced', awardsState);
      return sendJson(res, 200, { success: true, data: awardsState });
    }

    // Fallback 404
    sendJson(res, 404, { success: false, error: { code: 'NOT_FOUND', message: `경로를 찾을 수 없습니다: ${pathname}` } });
  } catch (err: any) {
    sendJson(res, 500, { success: false, error: { code: 'INTERNAL_ERROR', message: err.message || '서버 오류' } });
  }
});

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 [Port: ${PORT}] WorkshopSync REST API 서버가 성공적으로 시작되었습니다.`);
  console.log(`   - Base URL: http://0.0.0.0:${PORT}/api/v1`);
  console.log(`   - SSE Stream: http://0.0.0.0:${PORT}/api/v1/workshops/${mockWorkshop.id}/stream`);
});
