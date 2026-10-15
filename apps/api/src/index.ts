import http from 'http';
import { URL } from 'url';
import {
  mockWorkshops,
  mockAgendas,
  mockTeams,
  mockParticipants,
  mockMissions,
  mockSubmissions,
  mockFeedbacks,
  mockNotifications,
  mockAwards,
  mockGlobalActivityLogs,
  canVoteForSubmission,
  calculateRanking,
  Workshop,
  GlobalActivityLog,
  Participant,
  Team,
  Mission,
  Submission
} from '@workshopsync/shared';

const PORT = process.env.PORT || process.env.API_PORT || 30015;

// In-Memory Realtime State Store
let workshopsState: Workshop[] = [...mockWorkshops];
let participantsState: Participant[] = [...mockParticipants];
let teamsState: Team[] = [...mockTeams];
let missionsState: Mission[] = [...mockMissions];
let submissionsState: Submission[] = [...mockSubmissions];
let feedbacksState = [...mockFeedbacks];
let notificationsState = [...mockNotifications];
let awardsState = [...mockAwards];
let globalActivityLogsState: GlobalActivityLog[] = [...mockGlobalActivityLogs];
let votesState: { voterId: string; missionId: string; submissionId: string; teamId: string; workshopId: string }[] = [];

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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'X-Server-Time': new Date().toISOString()
  });
  res.end(JSON.stringify(data));
}

// 워크샵별 집계 통계 산출 헬퍼
function getWorkshopStats(wsId: string) {
  const wsParticipants = participantsState.filter((p) => p.workshopId === wsId);
  const checkedIn = wsParticipants.filter((p) => !!p.checkedInAt).length;
  const wsTeams = teamsState.filter((t) => t.workshopId === wsId);
  const wsMissions = missionsState.filter((m) => m.workshopId === wsId);
  const wsSubmissions = submissionsState.filter((s) => s.workshopId === wsId);
  const wsVotes = votesState.filter((v) => v.workshopId === wsId);

  return {
    workshopId: wsId,
    totalParticipants: wsParticipants.length,
    checkedInCount: checkedIn,
    checkinRate: wsParticipants.length > 0 ? Math.round((checkedIn / wsParticipants.length) * 100) : 0,
    teamCount: wsTeams.length,
    missionCount: wsMissions.length,
    submissionCount: wsSubmissions.length,
    votingCount: wsVotes.length
  };
}

// 활동 로그 추가 헬퍼
function logActivity(wsId: string, wsTitle: string, type: GlobalActivityLog['type'], message: string) {
  const log: GlobalActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    workshopId: wsId,
    workshopTitle: wsTitle,
    type,
    message,
    timestamp: new Date().toISOString()
  };
  globalActivityLogsState.unshift(log);
  if (globalActivityLogsState.length > 100) {
    globalActivityLogsState.pop();
  }
  broadcastSSE('activity.logged', log);
  return log;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;
  const method = req.method || 'GET';
  const query = parsedUrl.searchParams;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'X-Server-Time': new Date().toISOString()
    });
    return res.end();
  }

  // SSE Stream: /api/v1/workshops/:id/stream or /api/v1/stream
  if (pathname.endsWith('/stream')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
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
      return sendJson(res, 200, {
        success: true,
        service: 'WorkshopSync API',
        status: 'online',
        port: PORT,
        workshopsCount: workshopsState.length,
        liveWorkshopsCount: workshopsState.filter((w) => w.status === 'live').length
      });
    }

    // 2. 관리자 종합 관제 Overview API
    if (pathname === '/api/v1/admin/overview' && method === 'GET') {
      const totalWorkshops = workshopsState.length;
      const liveWorkshops = workshopsState.filter((w) => w.status === 'live').length;
      const readyWorkshops = workshopsState.filter((w) => w.status === 'ready').length;
      const closedWorkshops = workshopsState.filter((w) => w.status === 'closed').length;
      const totalParticipants = participantsState.length;
      const totalCheckedIn = participantsState.filter((p) => !!p.checkedInAt).length;
      const avgCheckinRate = totalParticipants > 0 ? Math.round((totalCheckedIn / totalParticipants) * 100) : 0;
      const totalSubmissions = submissionsState.length;

      const workshopsWithStats = workshopsState.map((ws) => ({
        ...ws,
        stats: getWorkshopStats(ws.id)
      }));

      return sendJson(res, 200, {
        success: true,
        data: {
          summary: {
            totalWorkshops,
            liveWorkshops,
            readyWorkshops,
            closedWorkshops,
            totalParticipants,
            totalCheckedIn,
            avgCheckinRate,
            totalSubmissions
          },
          workshops: workshopsWithStats,
          recentActivityLogs: globalActivityLogsState.slice(0, 15)
        }
      });
    }

    // 3. 관리자 전사 비상 공지 브로드캐스트
    if (pathname === '/api/v1/admin/broadcast' && method === 'POST') {
      const body = await parseBody(req);
      const { title, message, targetStatus = 'live' } = body;

      const targetWorkshops = targetStatus === 'all'
        ? workshopsState
        : workshopsState.filter((w) => w.status === targetStatus);

      targetWorkshops.forEach((ws) => {
        notificationsState.unshift({
          id: `notif-broadcast-${Date.now()}-${ws.id}`,
          workshopId: ws.id,
          targetType: 'all',
          type: 'notice',
          title: title || '📢 [운영 본부 긴급 공지]',
          body: message || '',
          createdAt: new Date().toISOString(),
          read: false
        });
      });

      logActivity(
        'global',
        '전체 워크샵',
        'notice',
        `운영 본부에서 ${targetWorkshops.length}개 워크샵 대상으로 전사 긴급 공지를 발송했습니다: "${title}"`
      );

      broadcastSSE('admin.broadcast', { title, message, count: targetWorkshops.length });
      return sendJson(res, 200, { success: true, count: targetWorkshops.length });
    }

    // 4. 워크샵 복제 API: POST /api/v1/workshops/:id/duplicate
    if (pathname.startsWith('/api/v1/workshops/') && pathname.endsWith('/duplicate') && method === 'POST') {
      const sourceId = pathname.split('/')[4];
      const source = workshopsState.find((w) => w.id === sourceId);
      if (!source) {
        return sendJson(res, 404, { success: false, error: { code: 'NOT_FOUND', message: '복제 대상 워크샵을 찾을 수 없습니다.' } });
      }

      const newId = `ws-${Date.now()}`;
      const duplicatedWorkshop: Workshop = {
        ...source,
        id: newId,
        title: `${source.title} (복제본)`,
        status: 'ready',
        joinCode: `CPY${Math.floor(1000 + Math.random() * 9000)}`,
        checkinCode: `CHK${Math.floor(100 + Math.random() * 900)}`,
        resultsPublic: false,
        votingStatus: 'before',
        createdAt: new Date().toISOString()
      };

      workshopsState.unshift(duplicatedWorkshop);

      // 원본의 팀 구조 복제
      const sourceTeams = teamsState.filter((t) => t.workshopId === sourceId);
      sourceTeams.forEach((st, idx) => {
        teamsState.push({
          id: `team-${newId}-${idx + 1}`,
          workshopId: newId,
          name: st.name,
          color: st.color,
          tableNumber: st.tableNumber,
          memberIds: []
        });
      });

      logActivity(newId, duplicatedWorkshop.title, 'status_change', `'${source.title}' 기반으로 새 워크샵이 복제되었습니다.`);
      broadcastSSE('workshop.created', duplicatedWorkshop);

      return sendJson(res, 201, {
        success: true,
        data: {
          ...duplicatedWorkshop,
          stats: getWorkshopStats(newId)
        }
      });
    }

    // 5. 워크샵 목록 조회 및 신규 생성: /api/v1/workshops
    if (pathname === '/api/v1/workshops') {
      if (method === 'GET') {
        const statusFilter = query.get('status');
        const searchKeyword = query.get('search')?.toLowerCase();

        let list = [...workshopsState];
        if (statusFilter && statusFilter !== 'all') {
          list = list.filter((w) => w.status === statusFilter);
        }
        if (searchKeyword) {
          list = list.filter(
            (w) =>
              w.title.toLowerCase().includes(searchKeyword) ||
              w.organizerCompany.toLowerCase().includes(searchKeyword) ||
              w.location.toLowerCase().includes(searchKeyword) ||
              (w.category && w.category.toLowerCase().includes(searchKeyword))
          );
        }

        const data = list.map((w) => ({
          ...w,
          stats: getWorkshopStats(w.id)
        }));

        return sendJson(res, 200, { success: true, count: data.length, data });
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        if (!body.title) {
          return sendJson(res, 400, { success: false, error: { code: 'REQUIRED_FIELD', message: '워크샵 제목은 필수 입력 항목입니다.' } });
        }

        const newId = body.id || `ws-${Date.now()}`;
        const newWorkshop: Workshop = {
          id: newId,
          title: body.title,
          description: body.description || '',
          category: body.category || '일반 워크샵',
          organizerCompany: body.organizerCompany || '운영사무국',
          location: body.location || '사무국 지정 장소',
          locationDetail: body.locationDetail || '',
          startAt: body.startAt || new Date().toISOString(),
          endAt: body.endAt || new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
          status: body.status || 'ready',
          joinCode: body.joinCode || `WS${Math.floor(1000 + Math.random() * 9000)}`,
          checkinCode: body.checkinCode || `CHK${Math.floor(100 + Math.random() * 900)}`,
          notice: body.notice || '워크샵에 오신 것을 환영합니다! 조별 테이블을 확인해 주세요.',
          prepItems: body.prepItems || ['노트북 및 충전기', '신분증/명함'],
          resultsPublic: false,
          votingStatus: 'before',
          createdAt: new Date().toISOString()
        };

        workshopsState.unshift(newWorkshop);

        // 기본 4개 조 자동 생성
        const defaultColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
        for (let i = 1; i <= 4; i++) {
          teamsState.push({
            id: `team-${newId}-${i}`,
            workshopId: newId,
            name: `${i}조 · 스프린트팀`,
            color: defaultColors[i - 1] || '#6B7280',
            tableNumber: i,
            memberIds: []
          });
        }

        // 기본 미션 1개 생성
        missionsState.push({
          id: `mission-${newId}-1`,
          workshopId: newId,
          order: 1,
          title: '[미션 1] 아이디어 기획 및 결과물 등록',
          description: '팀별 핵심 가치 제안 및 프로토타입 결과물을 작성하여 업로드해 주세요.',
          scope: 'team',
          submitTypes: ['image', 'doc', 'link'],
          dueAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
          votable: true,
          votingStatus: 'before',
          rankingPublished: false
        });

        logActivity(newId, newWorkshop.title, 'status_change', `신규 워크샵 '${newWorkshop.title}'이 개설되었습니다.`);
        broadcastSSE('workshop.created', newWorkshop);

        return sendJson(res, 201, {
          success: true,
          data: {
            ...newWorkshop,
            stats: getWorkshopStats(newId)
          }
        });
      }
    }

    // 6. 개별 워크샵 단일 조회 / 수정 / 삭제: /api/v1/workshops/:id
    const wsIdMatch = pathname.match(/^\/api\/v1\/workshops\/([a-zA-Z0-9_-]+)$/);
    if (wsIdMatch) {
      const wsId = wsIdMatch[1];
      const index = workshopsState.findIndex((w) => w.id === wsId);

      if (index === -1) {
        return sendJson(res, 404, { success: false, error: { code: 'NOT_FOUND', message: '해당 워크샵을 찾을 수 없습니다.' } });
      }

      if (method === 'GET') {
        return sendJson(res, 200, {
          success: true,
          data: {
            ...workshopsState[index],
            stats: getWorkshopStats(wsId)
          }
        });
      }

      if (method === 'PUT') {
        const body = await parseBody(req);
        const prevStatus = workshopsState[index].status;
        const updated: Workshop = {
          ...workshopsState[index],
          ...body,
          id: wsId // ID 불변
        };

        workshopsState[index] = updated;

        if (body.status && body.status !== prevStatus) {
          logActivity(
            wsId,
            updated.title,
            'status_change',
            `워크샵 운영 상태가 [${prevStatus.toUpperCase()}]에서 [${body.status.toUpperCase()}]로 변경되었습니다.`
          );
        }

        broadcastSSE('workshop.updated', updated);
        return sendJson(res, 200, {
          success: true,
          data: {
            ...updated,
            stats: getWorkshopStats(wsId)
          }
        });
      }

      if (method === 'DELETE') {
        if (workshopsState.length <= 1) {
          return sendJson(res, 400, {
            success: false,
            error: { code: 'CANNOT_DELETE_LAST', message: '최소 1개 이상의 워크샵이 유지되어야 하므로 삭제할 수 없습니다.' }
          });
        }

        const deleted = workshopsState.splice(index, 1)[0];
        // 연관 데이터 정리
        participantsState = participantsState.filter((p) => p.workshopId !== wsId);
        teamsState = teamsState.filter((t) => t.workshopId !== wsId);
        missionsState = missionsState.filter((m) => m.workshopId !== wsId);
        submissionsState = submissionsState.filter((s) => s.workshopId !== wsId);

        logActivity(wsId, deleted.title, 'status_change', `워크샵 '${deleted.title}'이 삭제되었습니다.`);
        broadcastSSE('workshop.deleted', { id: wsId });

        return sendJson(res, 200, { success: true, message: '워크샵이 안전하게 삭제되었습니다.', deletedId: wsId });
      }
    }

    // 7. 참석자 로그인 (모바일 PWA 연동 - joinCode로 일치하는 워크샵 매칭)
    if (pathname === '/api/v1/auth/participant/login' && method === 'POST') {
      const body = await parseBody(req);
      const { joinCode, name, phone } = body;
      const cleanPhone = (phone || '').replace(/\D/g, '');

      // 1) joinCode 일치하는 워크샵 탐색
      const targetWorkshop = workshopsState.find(
        (w) => w.joinCode.toUpperCase() === (joinCode || '').trim().toUpperCase()
      );

      if (!targetWorkshop) {
        return sendJson(res, 400, {
          success: false,
          error: { code: 'INVALID_CODE', message: '입력하신 워크샵 참여 코드가 유효하지 않습니다.' }
        });
      }

      // 2) 해당 워크샵에 등록된 참석자인지 확인
      const participant = participantsState.find(
        (p) =>
          p.workshopId === targetWorkshop.id &&
          p.name.trim() === (name || '').trim() &&
          p.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-4))
      );

      if (!participant) {
        return sendJson(res, 401, {
          success: false,
          error: { code: 'PARTICIPANT_NOT_FOUND', message: `'${targetWorkshop.title}' 사전 등록 명단과 일치하는 참석자 정보를 찾을 수 없습니다.` }
        });
      }

      const team = teamsState.find((t) => t.id === participant.teamId);

      return sendJson(res, 200, {
        success: true,
        data: {
          token: `mock-jwt-token-for-${participant.id}`,
          participant,
          team,
          workshop: targetWorkshop
        }
      });
    }

    // 8. 체크인
    if (pathname.includes('/checkin') && method === 'POST') {
      const body = await parseBody(req);
      const { participantId, checkinCode } = body;

      const pIndex = participantsState.findIndex((p) => p.id === participantId);
      if (pIndex !== -1) {
        const ws = workshopsState.find((w) => w.id === participantsState[pIndex].workshopId);
        if (checkinCode && ws && checkinCode !== ws.checkinCode) {
          return sendJson(res, 400, { success: false, error: { code: 'INVALID_CHECKIN_CODE', message: '체크인 코드가 일치하지 않습니다.' } });
        }

        if (!participantsState[pIndex].checkedInAt) {
          participantsState[pIndex].checkedInAt = new Date().toISOString();
        }

        if (ws) {
          logActivity(ws.id, ws.title, 'checkin', `${participantsState[pIndex].name} 참석자(${participantsState[pIndex].company})가 현장 체크인했습니다.`);
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

    // 9. Agendas
    if (pathname.includes('/agendas') && method === 'GET') {
      const wsId = query.get('workshopId');
      const list = wsId ? mockAgendas.filter((a) => a.workshopId === wsId) : mockAgendas;
      return sendJson(res, 200, { success: true, data: list });
    }

    // 10. Teams
    if (pathname.includes('/teams') && method === 'GET') {
      const wsId = query.get('workshopId');
      const list = wsId ? teamsState.filter((t) => t.workshopId === wsId) : teamsState;
      return sendJson(res, 200, { success: true, data: list });
    }

    // 11. Participants
    if (pathname.includes('/participants') && method === 'GET') {
      const wsId = query.get('workshopId');
      const list = wsId ? participantsState.filter((p) => p.workshopId === wsId) : participantsState;
      return sendJson(res, 200, { success: true, data: list });
    }

    // 12. Missions
    if (pathname.includes('/missions') && !pathname.includes('/submissions') && !pathname.includes('/votes') && method === 'GET') {
      const wsId = query.get('workshopId');
      const list = wsId ? missionsState.filter((m) => m.workshopId === wsId) : missionsState;
      return sendJson(res, 200, { success: true, data: list });
    }

    // 13. Submissions
    if (pathname.includes('/submissions') && method === 'GET') {
      const wsId = query.get('workshopId');
      const list = wsId ? submissionsState.filter((s) => s.workshopId === wsId) : submissionsState;
      return sendJson(res, 200, { success: true, data: list });
    }

    // 14. Submit New / Update Submission
    if (pathname.includes('/submissions') && method === 'POST') {
      const body = await parseBody(req);
      const mission = missionsState.find((m) => m.id === body.missionId);
      if (!mission) {
        return sendJson(res, 404, { success: false, error: { code: 'MISSION_NOT_FOUND', message: '미션을 찾을 수 없습니다.' } });
      }

      if (new Date().getTime() > new Date(mission.dueAt).getTime()) {
        return sendJson(res, 400, { success: false, error: { code: 'DEADLINE_PASSED', message: '미션 마감 시각이 경과하여 제출할 수 없습니다.' } });
      }

      const existingIndex = submissionsState.findIndex((s) => s.missionId === body.missionId && s.teamId === body.teamId);
      let savedSubmission: Submission;

      const ws = workshopsState.find((w) => w.id === (body.workshopId || mission.workshopId));
      const team = teamsState.find((t) => t.id === body.teamId);

      if (existingIndex !== -1) {
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
          workshopId: ws?.id || mission.workshopId,
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
        submissionsState.push(savedSubmission);
      }

      if (ws) {
        logActivity(
          ws.id,
          ws.title,
          'submission',
          `${team?.name || '조별팀'}이 [${mission.title}] 결과물(v${savedSubmission.version})을 제출했습니다.`
        );
      }

      broadcastSSE('submission.updated', savedSubmission);
      return sendJson(res, 200, { success: true, data: savedSubmission });
    }

    // 15. Preference Vote (골든 룰 #1 자기 조 투표 금지)
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

      const prevVoteIndex = votesState.findIndex((v) => v.voterId === voterId && v.missionId === missionId);
      if (prevVoteIndex !== -1) {
        const prevTeamId = votesState[prevVoteIndex].teamId;
        const prevSub = submissionsState.find((s) => s.teamId === prevTeamId && s.missionId === missionId);
        if (prevSub && prevSub.voteCount && prevSub.voteCount > 0) prevSub.voteCount--;
        votesState.splice(prevVoteIndex, 1);
      }

      votesState.push({
        voterId,
        missionId,
        submissionId,
        teamId: submission.teamId || '',
        workshopId: submission.workshopId
      });

      if (typeof submission.voteCount === 'number') {
        submission.voteCount++;
      } else {
        submission.voteCount = 1;
      }

      broadcastSSE('voting.activity', { missionId });
      return sendJson(res, 200, { success: true, data: { votedSubmissionId: submissionId, teamId: submission.teamId } });
    }

    // 16. Ranking (골든 룰 #2 블라인드 득표수)
    if (pathname.includes('/ranking') && method === 'GET') {
      const missionId = pathname.split('/')[4] || 'm-1';
      const mission = missionsState.find((m) => m.id === missionId);

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

    // 17. Feedbacks
    if (pathname.includes('/feedbacks') && method === 'GET') {
      const wsId = query.get('workshopId');
      const list = wsId ? feedbacksState.filter((f) => f.workshopId === wsId) : feedbacksState;
      return sendJson(res, 200, { success: true, data: list });
    }
    if (pathname.includes('/feedbacks') && method === 'POST') {
      const body = await parseBody(req);
      const newFeedback = {
        id: `fb-${Date.now()}`,
        workshopId: body.workshopId || workshopsState[0].id,
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

    // 18. Notifications
    if (pathname.includes('/notifications') && method === 'GET') {
      const wsId = query.get('workshopId');
      const list = wsId ? notificationsState.filter((n) => n.workshopId === wsId) : notificationsState;
      return sendJson(res, 200, { success: true, data: list });
    }

    // 19. Awards
    if (pathname.includes('/awards') && method === 'GET') {
      const wsId = query.get('workshopId');
      const list = wsId ? awardsState.filter((a) => a.workshopId === wsId) : awardsState;
      return sendJson(res, 200, { success: true, data: list });
    }

    // 20. Admin Operations
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
        const ws = workshopsState.find((w) => w.id === m.workshopId);
        if (ws) {
          logActivity(ws.id, ws.title, 'vote', `[${m.title}] 최종 순위 및 투표 결과가 전체 참가자에게 공개되었습니다.`);
        }
        broadcastSSE('ranking.published', { missionId: mId });
      }
      return sendJson(res, 200, { success: true, data: { missionId: mId, rankingPublished: true } });
    }

    // 관리자: 시상 확정 & 축하 발송 (골든 룰 #8 SSE + 컨페티)
    if (pathname === '/api/v1/admin/workshops/awards/dispatch' && method === 'POST') {
      const body = await parseBody(req);
      const wsId = body.workshopId || workshopsState[0].id;
      const ws = workshopsState.find((w) => w.id === wsId);

      if (body.winningTeamId) {
        const team = teamsState.find((t) => t.id === body.winningTeamId);
        awardsState = [
          {
            id: `award-${Date.now()}`,
            workshopId: wsId,
            type: 'winningTeam',
            teamId: body.winningTeamId,
            teamName: team?.name || '우승팀',
            reason: body.reason || '최고 득표 우승',
            announcedAt: new Date().toISOString()
          }
        ];
      }

      if (ws) {
        logActivity(ws.id, ws.title, 'status_change', `최종 시상식이 확정되어 모바일 앱으로 컨페티 축하 화면이 전송되었습니다.`);
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
  console.log(`   - Multi-Workshops: ${workshopsState.length}개 워크샵 로드됨`);
  console.log(`   - SSE Stream: http://0.0.0.0:${PORT}/api/v1/workshops/${mockWorkshops[0].id}/stream`);
});
