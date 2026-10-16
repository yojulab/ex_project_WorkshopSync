import React, { useState, useEffect } from 'react';
import {
  mockWorkshops,
  mockAgendas,
  mockTeams,
  mockParticipants,
  mockMissions,
  mockSubmissions,
  mockAwards,
  mockGlobalActivityLogs,
  calculateRanking,
  Workshop,
  WorkshopStatus,
  GlobalActivityLog,
  Participant,
  Submission
} from '@workshopsync/shared';

export type AdminMenu =
  | 'all-workshops'
  | 'global-monitoring'
  | 'dashboard'
  | 'workshop'
  | 'participants'
  | 'missions'
  | 'submissions'
  | 'voting'
  | 'awards'
  | 'notice'
  | 'reports';

export default function App() {
  const [activeMenu, setActiveMenu] = useState<AdminMenu>('all-workshops');

  // Multi-Workshop State
  const [workshops, setWorkshops] = useState<Workshop[]>(mockWorkshops);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>(mockWorkshops[0].id);

  // Active Workshop Derived
  const currentWorkshop = workshops.find((w) => w.id === selectedWorkshopId) || workshops[0];

  // Workshop Sub-resources State
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);
  const [submissions, setSubmissions] = useState<Submission[]>(mockSubmissions);
  const [votingStatus, setVotingStatus] = useState<'open' | 'closed'>('open');
  const [isRankingPublished, setIsRankingPublished] = useState(false);
  const [selectedTopWorker, setSelectedTopWorker] = useState(mockParticipants[1]?.id || 'p-02');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Global Monitoring Logs
  const [globalLogs, setGlobalLogs] = useState<GlobalActivityLog[]>(mockGlobalActivityLogs);

  // Multi-Workshop List Filters & Controls
  const [wsFilterStatus, setWsFilterStatus] = useState<'all' | 'live' | 'ready' | 'closed'>('all');
  const [wsSearchKeyword, setWsSearchKeyword] = useState('');
  const [wsViewMode, setWsViewMode] = useState<'grid' | 'table'>('grid');

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [previewSubmission, setPreviewSubmission] = useState<Submission | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // New Workshop Form State
  const [newWsForm, setNewWsForm] = useState({
    title: '',
    category: 'AI / 생성형 모델',
    organizerCompany: '(주)이노베이션 랩',
    location: '판교 스타트업 캠퍼스 2동 컨퍼런스홀',
    locationDetail: '지하 1층 주차 가능',
    startAt: '2026-10-20T09:30:00+09:00',
    endAt: '2026-10-20T18:00:00+09:00',
    joinCode: 'WS2027',
    checkinCode: 'CHK777',
    notice: '새로운 워크샵에 오신 것을 환영합니다! 조별 좌석을 확인해주세요.',
    prepItems: '개인 노트북 및 충전기\n신분증/명함'
  });

  // Edit Workshop Form State
  const [editWsForm, setEditWsForm] = useState<Workshop | null>(null);

  // Broadcast Alert Form State
  const [broadcastTitle, setBroadcastTitle] = useState('🚨 [운영 본부 긴급 공지]');
  const [broadcastBody, setBroadcastBody] = useState('전체 참가자 여러분, 10분 후 중간 집계 및 티타임이 시작됩니다.');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'live'>('live');

  // Notice Form State in Notice Tab
  const [noticeTarget, setNoticeTarget] = useState('all');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const checkedInCount = participants.filter((p) => !!p.checkedInAt).length;

  // URL Hash Deep Linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const menu = params.get('menu');
      const wsId = params.get('wsId');
      if (wsId && workshops.some((w) => w.id === wsId)) {
        setSelectedWorkshopId(wsId);
      }
      if (
        menu &&
        [
          'all-workshops',
          'global-monitoring',
          'dashboard',
          'workshop',
          'participants',
          'missions',
          'submissions',
          'voting',
          'awards',
          'notice',
          'reports'
        ].includes(menu)
      ) {
        setActiveMenu(menu as AdminMenu);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [workshops]);

  // Sync Document Title & Hash
  useEffect(() => {
    const menuTitleMap: Record<AdminMenu, string> = {
      'all-workshops': '워크샵 종합 관리 센터',
      'global-monitoring': '실시간 전사 모니터링',
      dashboard: `[${currentWorkshop.title}] 관제 대시보드`,
      workshop: `[${currentWorkshop.title}] 워크샵 마스터`,
      participants: `[${currentWorkshop.title}] 참석자 & 조 편성`,
      missions: `[${currentWorkshop.title}] 아젠다 & 미션`,
      submissions: `[${currentWorkshop.title}] 제출 현황 모니터링`,
      voting: `[${currentWorkshop.title}] 투표 및 순위 제어`,
      awards: `[${currentWorkshop.title}] 우승 및 시상`,
      notice: `[${currentWorkshop.title}] 공지 및 푸시`,
      reports: `[${currentWorkshop.title}] 결과 리포트`
    };
    document.title = `${menuTitleMap[activeMenu] || 'WorkshopSync 관리자'} - WorkshopSync`;
    const newHash = `#menu=${activeMenu}&wsId=${selectedWorkshopId}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, [activeMenu, selectedWorkshopId, currentWorkshop]);

  // 복수 워크샵 필터링
  const filteredWorkshops = workshops.filter((w) => {
    const matchStatus = wsFilterStatus === 'all' || w.status === wsFilterStatus;
    const matchKeyword =
      !wsSearchKeyword ||
      w.title.toLowerCase().includes(wsSearchKeyword.toLowerCase()) ||
      w.organizerCompany.toLowerCase().includes(wsSearchKeyword.toLowerCase()) ||
      w.location.toLowerCase().includes(wsSearchKeyword.toLowerCase()) ||
      (w.category && w.category.toLowerCase().includes(wsSearchKeyword.toLowerCase()));
    return matchStatus && matchKeyword;
  });

  // 종합 통계 계산
  const totalWorkshops = workshops.length;
  const liveCount = workshops.filter((w) => w.status === 'live').length;
  const readyCount = workshops.filter((w) => w.status === 'ready').length;
  const closedCount = workshops.filter((w) => w.status === 'closed').length;

  // 워크샵 선택 및 대시보드로 이동
  const handleSelectAndGo = (wsId: string) => {
    setSelectedWorkshopId(wsId);
    setActiveMenu('dashboard');
    const target = workshops.find((w) => w.id === wsId);
    showToast(`👉 '${target?.title}' 워크샵 운영 화면으로 전환되었습니다.`);
  };

  // 워크샵 상태 변경 (READY ↔ LIVE ↔ CLOSED)
  const handleChangeWorkshopStatus = (wsId: string, newStatus: WorkshopStatus) => {
    setWorkshops((prev) =>
      prev.map((w) => (w.id === wsId ? { ...w, status: newStatus } : w))
    );
    const target = workshops.find((w) => w.id === wsId);
    const log: GlobalActivityLog = {
      id: `log-${Date.now()}`,
      workshopId: wsId,
      workshopTitle: target?.title || '워크샵',
      type: 'status_change',
      message: `'${target?.title}' 상태가 [${newStatus.toUpperCase()}]로 변경되었습니다.`,
      timestamp: new Date().toISOString()
    };
    setGlobalLogs((prev) => [log, ...prev]);
    showToast(`⚙️ '${target?.title}' 상태가 [${newStatus.toUpperCase()}]로 업데이트되었습니다.`);
  };

  // 워크샵 복제
  const handleDuplicateWorkshop = (wsId: string) => {
    const source = workshops.find((w) => w.id === wsId);
    if (!source) return;

    const newId = `ws-${Date.now()}`;
    const duplicated: Workshop = {
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

    setWorkshops([duplicated, ...workshops]);
    const log: GlobalActivityLog = {
      id: `log-${Date.now()}`,
      workshopId: newId,
      workshopTitle: duplicated.title,
      type: 'status_change',
      message: `'${source.title}' 기반으로 복제 워크샵이 생성되었습니다.`,
      timestamp: new Date().toISOString()
    };
    setGlobalLogs((prev) => [log, ...prev]);
    showToast(`📋 '${source.title}' 워크샵이 복제되어 새로 등록되었습니다.`);
  };

  // 워크샵 삭제
  const handleDeleteWorkshop = (wsId: string) => {
    if (workshops.length <= 1) {
      showToast('⚠️ 최소 1개 이상의 워크샵이 유지되어야 합니다.');
      return;
    }
    const target = workshops.find((w) => w.id === wsId);
    if (confirm(`정말로 '${target?.title}' 워크샵을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.`)) {
      setWorkshops((prev) => prev.filter((w) => w.id !== wsId));
      if (selectedWorkshopId === wsId) {
        const remain = workshops.filter((w) => w.id !== wsId);
        setSelectedWorkshopId(remain[0].id);
      }
      showToast(`🗑️ '${target?.title}' 워크샵이 삭제되었습니다.`);
    }
  };

  // 신규 워크샵 생성 제출
  const handleCreateWorkshopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsForm.title.trim()) {
      alert('워크샵 제목을 입력해 주세요.');
      return;
    }

    const newId = `ws-${Date.now()}`;
    const created: Workshop = {
      id: newId,
      title: newWsForm.title,
      description: '참석자 중심의 실전 워크샵 및 산출물 스프린트',
      category: newWsForm.category,
      organizerCompany: newWsForm.organizerCompany,
      location: newWsForm.location,
      locationDetail: newWsForm.locationDetail,
      startAt: newWsForm.startAt,
      endAt: newWsForm.endAt,
      status: 'ready',
      joinCode: newWsForm.joinCode.toUpperCase(),
      checkinCode: newWsForm.checkinCode.toUpperCase(),
      notice: newWsForm.notice,
      prepItems: newWsForm.prepItems.split('\n').filter(Boolean),
      resultsPublic: false,
      votingStatus: 'before',
      createdAt: new Date().toISOString()
    };

    setWorkshops([created, ...workshops]);
    setSelectedWorkshopId(newId);
    setShowCreateModal(false);

    const log: GlobalActivityLog = {
      id: `log-${Date.now()}`,
      workshopId: newId,
      workshopTitle: created.title,
      type: 'status_change',
      message: `신규 워크샵 '${created.title}'이 개설되었습니다.`,
      timestamp: new Date().toISOString()
    };
    setGlobalLogs((prev) => [log, ...prev]);
    showToast(`🎉 신규 워크샵 '${created.title}'이 성공적으로 개설되었습니다!`);
  };

  // 워크샵 수정 저장
  const handleUpdateWorkshopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWsForm) return;

    setWorkshops((prev) =>
      prev.map((w) => (w.id === editWsForm.id ? { ...editWsForm } : w))
    );
    setShowEditModal(false);
    showToast(`💾 '${editWsForm.title}' 정보가 수정되었습니다.`);
  };

  // 전사 비상 공지 브로드캐스트
  const handleBroadcastAlert = () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      alert('공지 제목과 내용을 입력하세요.');
      return;
    }
    const targetWsList = broadcastTarget === 'all'
      ? workshops
      : workshops.filter((w) => w.status === 'live');

    const log: GlobalActivityLog = {
      id: `log-${Date.now()}`,
      workshopId: 'global',
      workshopTitle: '전사 운영 본부',
      type: 'notice',
      message: `운영 본부에서 ${targetWsList.length}개 워크샵 대상으로 전사 긴급 공지를 발송했습니다: "${broadcastTitle}"`,
      timestamp: new Date().toISOString()
    };
    setGlobalLogs((prev) => [log, ...prev]);
    setShowBroadcastModal(false);
    showToast(`📢 ${targetWsList.length}개 워크샵 전체 참석자 모바일 앱으로 비상 공지가 전송되었습니다!`);
  };

  // 자동 랜덤 조 편성
  const handleAutoAssignTeams = () => {
    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    const updated = shuffled.map((p, idx) => ({
      ...p,
      teamId: mockTeams[idx % mockTeams.length].id
    }));
    setParticipants(updated);
    showToast('🎲 20명의 참석자가 5개 조에 균등하게 자동 재배정되었습니다.');
  };

  // 순위 공개 토글
  const handleTogglePublishRanking = () => {
    setIsRankingPublished(!isRankingPublished);
    showToast(
      isRankingPublished
        ? '🔒 순위가 다시 비공개(집계 중)로 잠겼습니다.'
        : '🔓 전체 참석자 앱에 최종 순위표가 공개되었습니다!'
    );
  };

  // 시상 확정 및 알림 발송 (골든 룰 #8)
  const handleDispatchAwards = () => {
    const topWorker = participants.find((p) => p.id === selectedTopWorker);
    showToast(
      `🏆 1조 우승 및 최고 작업자(${topWorker?.name}) 시상이 확정되어 전체 스마트폰에 컨페티 축하 화면이 전송되었습니다!`
    );
  };

  // CSV 내보내기 시뮬레이션
  const handleExportCsv = (type: string) => {
    const dummyCsv =
      `ID,이름,소속,조,체크인여부\n` +
      participants
        .map(
          (p) =>
            `${p.id},${p.name},${p.company},${p.teamId || '미배정'},${
              p.checkedInAt ? '완료' : '미참석'
            }`
        )
        .join('\n');
    const blob = new Blob([dummyCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `workshopsync_${type}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`📊 ${type} 리포트 CSV가 다운로드되었습니다.`);
  };

  return (
    <div className="admin-layout">
      {/* ================= 좌측 사이드바 ================= */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <span style={{ fontSize: 24 }}>⚡</span>
          <div>
            <div className="sidebar-title">WorkshopSync</div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>
              관리자 웹 포털 {typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : ':30017'}
            </div>
          </div>
        </div>

        <ul className="sidebar-menu">
          {/* 1. 전사 종합 관리 허브 */}
          <li style={{ padding: '4px 10px', fontSize: 11, fontWeight: 800, color: '#6B7280', letterSpacing: 0.5 }}>
            통합 워크샵 관제
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'all-workshops' ? 'active' : ''}`}
              onClick={() => setActiveMenu('all-workshops')}
              data-serial-id="A10-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A10-SEC01-NAV01" data-item-name="워크샵 종합 관리 메뉴">A10-SEC01-NAV01</span>
              <span>🏢</span>
              <span>워크샵 종합 관리</span>
              <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 10, fontSize: 11 }}>
                {workshops.length}
              </span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'global-monitoring' ? 'active' : ''}`}
              onClick={() => setActiveMenu('global-monitoring')}
              data-serial-id="A11-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A11-SEC01-NAV01" data-item-name="실시간 전사 모니터링 메뉴">A11-SEC01-NAV01</span>
              <span>📡</span>
              <span>실시간 전사 모니터링</span>
              <span style={{ marginLeft: 'auto', background: '#03B26C', width: 8, height: 8, borderRadius: '50%' }} />
            </button>
          </li>

          {/* 2. 현재 선택된 워크샵 개별 운영 메뉴 */}
          <li style={{ padding: '12px 10px 4px 10px', fontSize: 11, fontWeight: 800, color: '#6B7280', letterSpacing: 0.5, borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8 }}>
            선택 워크샵 운영
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveMenu('dashboard')}
              data-serial-id="A00-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A00-SEC01-NAV01" data-item-name="종합 대시보드 메뉴">A00-SEC01-NAV01</span>
              <span>📊</span>
              <span>관제 대시보드</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'workshop' ? 'active' : ''}`}
              onClick={() => setActiveMenu('workshop')}
              data-serial-id="A02-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A02-SEC01-NAV01" data-item-name="워크샵 마스터 메뉴">A02-SEC01-NAV01</span>
              <span>⚙️</span>
              <span>워크샵 마스터</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveMenu('participants')}
              data-serial-id="A04-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A04-SEC01-NAV01" data-item-name="참석자 및 조 관리 메뉴">A04-SEC01-NAV01</span>
              <span>👥</span>
              <span>참석자 & 조 편성</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'missions' ? 'active' : ''}`}
              onClick={() => setActiveMenu('missions')}
              data-serial-id="A03-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A03-SEC01-NAV01" data-item-name="아젠다 및 미션 관리 메뉴">A03-SEC01-NAV01</span>
              <span>🎯</span>
              <span>아젠다 & 미션</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveMenu('submissions')}
              data-serial-id="A05-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A05-SEC01-NAV01" data-item-name="제출 현황 모니터링 메뉴">A05-SEC01-NAV01</span>
              <span>📁</span>
              <span>제출 현황 모니터링</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'voting' ? 'active' : ''}`}
              onClick={() => setActiveMenu('voting')}
              data-serial-id="A06-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A06-SEC01-NAV01" data-item-name="투표 및 순위 제어 메뉴">A06-SEC01-NAV01</span>
              <span>🗳️</span>
              <span>투표 & 순위 제어</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'awards' ? 'active' : ''}`}
              onClick={() => setActiveMenu('awards')}
              data-serial-id="A07-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A07-SEC01-NAV01" data-item-name="우승 및 시상 메뉴">A07-SEC01-NAV01</span>
              <span>🏆</span>
              <span>우승 및 시상</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'notice' ? 'active' : ''}`}
              onClick={() => setActiveMenu('notice')}
              data-serial-id="A08-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A08-SEC01-NAV01" data-item-name="공지 및 푸시 발송 메뉴">A08-SEC01-NAV01</span>
              <span>📢</span>
              <span>공지 및 푸시</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveMenu('reports')}
              data-serial-id="A09-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A09-SEC01-NAV01" data-item-name="결과 리포트 내보내기 메뉴">A09-SEC01-NAV01</span>
              <span>📈</span>
              <span>결과 리포트</span>
            </button>
          </li>
        </ul>
      </aside>

      {/* ================= 우측 메인 영역 ================= */}
      <div className="admin-main">
        {/* ================= 상단 탑바 (워크샵 스위처 탑재) ================= */}
        <header className="admin-topbar">
          <div className="workshop-switcher-container" data-serial-id="A00-SEC00-SEL01">
            <span className="ui-serial-badge" data-serial-id="A00-SEC00-SEL01" data-item-name="워크샵 전환 셀렉터">A00-SEC00-SEL01</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-muted)' }}>현재 운영 워크샵:</span>
            <select
              value={selectedWorkshopId}
              onChange={(e) => {
                setSelectedWorkshopId(e.target.value);
                const ws = workshops.find((w) => w.id === e.target.value);
                showToast(`🏢 '${ws?.title}' 워크샵으로 운영 컨텍스트가 전환되었습니다.`);
              }}
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--admin-text-main)',
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-border)',
                background: '#F8FAFC',
                cursor: 'pointer',
                maxWidth: 360,
                outline: 'none'
              }}
            >
              {workshops.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.status === 'live' ? '🟢 [LIVE] ' : ws.status === 'ready' ? '🟡 [READY] ' : '⚪ [CLOSED] '}
                  {ws.title}
                </option>
              ))}
            </select>

            {currentWorkshop.status === 'live' && (
              <span className="badge-status-live">
                <span className="pulse-dot" /> LIVE 진행 중
              </span>
            )}
            {currentWorkshop.status === 'ready' && (
              <span className="badge-status-ready">🟡 접수 및 준비 중</span>
            )}
            {currentWorkshop.status === 'closed' && (
              <span className="badge-status-closed">⚪ 종료됨</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn-outline"
              onClick={() => setActiveMenu('all-workshops')}
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <span>🏢</span> 전체 워크샵 관리
            </button>
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <span>+</span> 새 워크샵 개설
            </button>
            <div style={{ borderLeft: '1px solid var(--admin-border)', height: 24, margin: '0 4px' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-main)' }}>
              총괄 디렉터 최성민 상무
            </span>
          </div>
        </header>

        {/* ================= 메인 콘텐츠 영역 ================= */}
        <main className="admin-content">
          {/* ================= A-10: 워크샵 종합 관리 센터 ================= */}
          {activeMenu === 'all-workshops' && (
            <div>
              {/* 상단 헤더 & 컨트롤 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }} data-serial-id="A10-SEC01-HDR01">
                <span className="ui-serial-badge" data-serial-id="A10-SEC01-HDR01" data-item-name="워크샵 종합 관리 헤더">A10-SEC01-HDR01</span>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
                    🏢 워크샵 종합 관리 센터
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)' }}>
                    전사 모든 워크샵의 개설, 실시간 진행 현황, 조 편성, 참여 코드 배포 및 상태를 종합 관리합니다.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
                      const port = (import.meta as any).env?.VITE_MOBILE_PORT || '30016';
                      window.open(`${window.location.protocol}//${host}:${port}`, '_blank');
                    }}
                    title="참석자 전용 스마트폰 웹앱을 새 창으로 엽니다"
                  >
                    📱 참석자 앱 열기
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => setActiveMenu('global-monitoring')}
                    data-serial-id="A10-SEC01-BTN01"
                  >
                    <span className="ui-serial-badge" data-serial-id="A10-SEC01-BTN01" data-item-name="실시간 전사 모니터링 이동 버튼">A10-SEC01-BTN01</span>
                    <span>📡 실시간 관제탑</span>
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setShowCreateModal(true)}
                    data-serial-id="A10-SEC01-BTN02"
                  >
                    <span className="ui-serial-badge" data-serial-id="A10-SEC01-BTN02" data-item-name="새 워크샵 만들기 버튼">A10-SEC01-BTN02</span>
                    <span>+ 새 워크샵 개설</span>
                  </button>
                </div>
              </div>

              {/* 상단 4대 종합 통계 카드 */}
              <div className="stat-grid">
                <div className="stat-card" data-serial-id="A10-SEC01-STA01">
                  <span className="ui-serial-badge" data-serial-id="A10-SEC01-STA01" data-item-name="총 워크샵 통계">A10-SEC01-STA01</span>
                  <div className="stat-header">
                    <span className="stat-title">전체 개설 워크샵</span>
                    <span className="stat-icon" style={{ background: '#EFF6FF', color: '#3182F6' }}>🏢</span>
                  </div>
                  <div className="stat-value">{totalWorkshops}개</div>
                  <div className="stat-desc">운영 및 아카이브 등록 전체</div>
                </div>

                <div className="stat-card" data-serial-id="A10-SEC01-STA02">
                  <span className="ui-serial-badge" data-serial-id="A10-SEC01-STA02" data-item-name="실시간 진행 통계">A10-SEC01-STA02</span>
                  <div className="stat-header">
                    <span className="stat-title">실시간 진행 중 (LIVE)</span>
                    <span className="stat-icon" style={{ background: '#E6F8F0', color: '#03B26C' }}>🟢</span>
                  </div>
                  <div className="stat-value" style={{ color: '#03B26C' }}>{liveCount}개</div>
                  <div className="stat-desc">참석자 모바일 앱 활성화 및 투표 가동</div>
                </div>

                <div className="stat-card" data-serial-id="A10-SEC01-STA03">
                  <span className="ui-serial-badge" data-serial-id="A10-SEC01-STA03" data-item-name="준비 대기 통계">A10-SEC01-STA03</span>
                  <div className="stat-header">
                    <span className="stat-title">준비 및 접수 중 (READY)</span>
                    <span className="stat-icon" style={{ background: '#FFF8E6', color: '#D97706' }}>🟡</span>
                  </div>
                  <div className="stat-value" style={{ color: '#D97706' }}>{readyCount}개</div>
                  <div className="stat-desc">명단 사전 등록 및 아젠다 세팅 중</div>
                </div>

                <div className="stat-card" data-serial-id="A10-SEC01-STA04">
                  <span className="ui-serial-badge" data-serial-id="A10-SEC01-STA04" data-item-name="종료 통계">A10-SEC01-STA04</span>
                  <div className="stat-header">
                    <span className="stat-title">종료 및 시상 완료 (CLOSED)</span>
                    <span className="stat-icon" style={{ background: '#F1F5F9', color: '#64748B' }}>⚪</span>
                  </div>
                  <div className="stat-value" style={{ color: '#64748B' }}>{closedCount}개</div>
                  <div className="stat-desc">결과물 보관 및 리포트 열람 가능</div>
                </div>
              </div>

              {/* 검색 및 필터 컨트롤 바 */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: '14px 18px',
                  border: '1px solid var(--admin-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20
                }}
                data-serial-id="A10-SEC01-CTR01"
              >
                <span className="ui-serial-badge" data-serial-id="A10-SEC01-CTR01" data-item-name="필터 및 검색 바">A10-SEC01-CTR01</span>

                {/* 상태 필터 탭 */}
                <div className="filter-tab-group">
                  <button
                    className={`filter-tab ${wsFilterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setWsFilterStatus('all')}
                  >
                    전체 ({workshops.length})
                  </button>
                  <button
                    className={`filter-tab ${wsFilterStatus === 'live' ? 'active' : ''}`}
                    onClick={() => setWsFilterStatus('live')}
                  >
                    🟢 진행 중 ({liveCount})
                  </button>
                  <button
                    className={`filter-tab ${wsFilterStatus === 'ready' ? 'active' : ''}`}
                    onClick={() => setWsFilterStatus('ready')}
                  >
                    🟡 준비 중 ({readyCount})
                  </button>
                  <button
                    className={`filter-tab ${wsFilterStatus === 'closed' ? 'active' : ''}`}
                    onClick={() => setWsFilterStatus('closed')}
                  >
                    ⚪ 종료 ({closedCount})
                  </button>
                </div>

                {/* 검색 입력 및 뷰 모드 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="워크샵명, 주최사, 장소 검색..."
                    value={wsSearchKeyword}
                    onChange={(e) => setWsSearchKeyword(e.target.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      fontSize: 13,
                      width: 260,
                      outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', border: '1px solid var(--admin-border)', borderRadius: 8, overflow: 'hidden' }}>
                    <button
                      onClick={() => setWsViewMode('grid')}
                      style={{
                        padding: '7px 12px',
                        border: 'none',
                        background: wsViewMode === 'grid' ? '#EAEFF5' : '#fff',
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                      title="카드 그리드 뷰"
                    >
                      🔲 카드
                    </button>
                    <button
                      onClick={() => setWsViewMode('table')}
                      style={{
                        padding: '7px 12px',
                        border: 'none',
                        background: wsViewMode === 'table' ? '#EAEFF5' : '#fff',
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                      title="목록 테이블 뷰"
                    >
                      📜 테이블
                    </button>
                  </div>
                </div>
              </div>

              {/* 워크샵 카드 그리드 뷰 */}
              {wsViewMode === 'grid' && (
                <div className="workshop-grid" data-serial-id="A10-SEC02-GRD01">
                  <span className="ui-serial-badge" data-serial-id="A10-SEC02-GRD01" data-item-name="워크샵 그리드 영역">A10-SEC02-GRD01</span>
                  {filteredWorkshops.map((ws, idx) => {
                    const isSelected = ws.id === selectedWorkshopId;
                    return (
                      <div
                        key={ws.id}
                        className={`workshop-card ${isSelected ? 'is-selected' : ''}`}
                        data-serial-id={`A10-SEC02-CRD0${idx + 1}`}
                      >
                        <span className="ui-serial-badge" data-serial-id={`A10-SEC02-CRD0${idx + 1}`} data-item-name={`${ws.title} 카드`}>
                          A10-SEC02-CRD0{idx + 1}
                        </span>

                        <div className="workshop-card-top">
                          <span className="workshop-category-tag">{ws.category || '일반 워크샵'}</span>
                          {ws.status === 'live' && (
                            <span className="badge-status-live">
                              <span className="pulse-dot" /> LIVE
                            </span>
                          )}
                          {ws.status === 'ready' && (
                            <span className="badge-status-ready">🟡 READY</span>
                          )}
                          {ws.status === 'closed' && (
                            <span className="badge-status-closed">⚪ CLOSED</span>
                          )}
                        </div>

                        <h3
                          className="workshop-card-title"
                          onClick={() => handleSelectAndGo(ws.id)}
                          title="클릭 시 이 워크샵 운영 화면으로 이동"
                        >
                          {ws.title}
                        </h3>

                        <div className="workshop-meta-row">
                          <span>🏢</span> <strong>{ws.organizerCompany}</strong>
                        </div>
                        <div className="workshop-meta-row">
                          <span>📍</span> <span>{ws.location}</span>
                        </div>
                        <div className="workshop-meta-row">
                          <span>📅</span> <span>{new Date(ws.startAt).toLocaleDateString()} ({new Date(ws.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ~ {new Date(ws.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                        </div>

                        {/* 입장 코드 및 체크인 코드 */}
                        <div className="workshop-code-box">
                          <div className="workshop-code-item">
                            <span style={{ color: 'var(--admin-text-muted)' }}>입장코드:</span>
                            <span className="workshop-code-val">{ws.joinCode}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ws.joinCode);
                                showToast(`📋 '${ws.joinCode}' 입장 코드가 복사되었습니다.`);
                              }}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12 }}
                              title="코드 복사"
                            >
                              📋
                            </button>
                          </div>
                          <div className="workshop-code-item">
                            <span style={{ color: 'var(--admin-text-muted)' }}>체크인:</span>
                            <span className="workshop-code-val" style={{ background: '#FEF3C7', color: '#92400E' }}>
                              {ws.checkinCode}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ws.checkinCode);
                                showToast(`📋 '${ws.checkinCode}' 체크인 코드가 복사되었습니다.`);
                              }}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12 }}
                              title="코드 복사"
                            >
                              📋
                            </button>
                          </div>
                        </div>

                        {/* 진행 진척도 통계 */}
                        <div className="workshop-metrics-grid">
                          <div>
                            <div className="workshop-metric-val">
                              {ws.id === 'ws-2026-ai' ? '18/20명' : ws.id === 'ws-2026-cloud' ? '22/24명' : ws.id === 'ws-2026-data' ? '32/32명' : '0/16명'}
                            </div>
                            <div className="workshop-metric-lbl">
                              체크인 ({ws.id === 'ws-2026-ai' ? '90%' : ws.id === 'ws-2026-cloud' ? '92%' : ws.id === 'ws-2026-data' ? '100%' : '0%'})
                            </div>
                          </div>
                          <div>
                            <div className="workshop-metric-val">
                              {ws.id === 'ws-2026-ai' ? '5개 조' : ws.id === 'ws-2026-cloud' ? '6개 조' : ws.id === 'ws-2026-data' ? '8개 조' : '4개 조'}
                            </div>
                            <div className="workshop-metric-lbl">조 편성</div>
                          </div>
                          <div>
                            <div className="workshop-metric-val">
                              {ws.id === 'ws-2026-ai' ? '5/5 제출' : ws.id === 'ws-2026-cloud' ? '4/6 제출' : ws.id === 'ws-2026-data' ? '8/8 완료' : '대기중'}
                            </div>
                            <div className="workshop-metric-lbl">결과물</div>
                          </div>
                        </div>

                        {/* 카드 하단 액션 버튼들 */}
                        <div className="workshop-card-footer">
                          <button
                            className="btn-primary"
                            onClick={() => handleSelectAndGo(ws.id)}
                            style={{ flex: 1, padding: '8px 12px', fontSize: 12 }}
                          >
                            👉 이 워크샵 운영하기
                          </button>

                          {ws.status === 'ready' && (
                            <button
                              className="btn-outline"
                              onClick={() => handleChangeWorkshopStatus(ws.id, 'live')}
                              style={{ fontSize: 11, color: '#03B26C', fontWeight: 700 }}
                              title="LIVE 시작"
                            >
                              🟢 시작
                            </button>
                          )}
                          {ws.status === 'live' && (
                            <button
                              className="btn-outline"
                              onClick={() => handleChangeWorkshopStatus(ws.id, 'closed')}
                              style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}
                              title="종료 마감"
                            >
                              ⚪ 종료
                            </button>
                          )}
                          {ws.status === 'closed' && (
                            <button
                              className="btn-outline"
                              onClick={() => handleChangeWorkshopStatus(ws.id, 'live')}
                              style={{ fontSize: 11, color: '#3182F6', fontWeight: 700 }}
                              title="재오픈"
                            >
                              🔄 재오픈
                            </button>
                          )}

                          <button
                            className="btn-outline"
                            onClick={() => handleDuplicateWorkshop(ws.id)}
                            style={{ fontSize: 11 }}
                            title="워크샵 복제"
                          >
                            📋 복제
                          </button>
                          <button
                            className="btn-outline"
                            onClick={() => {
                              setEditWsForm(ws);
                              setShowEditModal(true);
                            }}
                            style={{ fontSize: 11 }}
                            title="설정 수정"
                          >
                            ⚙️ 수정
                          </button>
                          <button
                            className="btn-outline"
                            onClick={() => handleDeleteWorkshop(ws.id)}
                            style={{ fontSize: 11, color: '#EF4444' }}
                            title="삭제"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 워크샵 테이블 뷰 */}
              {wsViewMode === 'table' && (
                <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }} data-serial-id="A10-SEC02-TBL01">
                  <span className="ui-serial-badge" data-serial-id="A10-SEC02-TBL01" data-item-name="워크샵 테이블 영역">A10-SEC02-TBL01</span>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>상태</th>
                        <th>워크샵명</th>
                        <th>카테고리</th>
                        <th>주최사</th>
                        <th>장소</th>
                        <th>입장 / 체크인 코드</th>
                        <th>일시</th>
                        <th>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkshops.map((ws) => (
                        <tr key={ws.id}>
                          <td>
                            {ws.status === 'live' && <span className="badge-status-live">🟢 LIVE</span>}
                            {ws.status === 'ready' && <span className="badge-status-ready">🟡 READY</span>}
                            {ws.status === 'closed' && <span className="badge-status-closed">⚪ CLOSED</span>}
                          </td>
                          <td style={{ fontWeight: 800 }}>
                            <span
                              style={{ cursor: 'pointer', color: 'var(--admin-primary)' }}
                              onClick={() => handleSelectAndGo(ws.id)}
                            >
                              {ws.title}
                            </span>
                          </td>
                          <td><span className="workshop-category-tag">{ws.category}</span></td>
                          <td>{ws.organizerCompany}</td>
                          <td>{ws.location}</td>
                          <td>
                            <code>{ws.joinCode}</code> / <code>{ws.checkinCode}</code>
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--admin-text-sub)' }}>
                            {new Date(ws.startAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn-primary"
                                onClick={() => handleSelectAndGo(ws.id)}
                                style={{ padding: '4px 8px', fontSize: 11 }}
                              >
                                운영
                              </button>
                              <button
                                className="btn-outline"
                                onClick={() => handleDuplicateWorkshop(ws.id)}
                                style={{ padding: '4px 8px', fontSize: 11 }}
                              >
                                복제
                              </button>
                              <button
                                className="btn-outline"
                                onClick={() => {
                                  setEditWsForm(ws);
                                  setShowEditModal(true);
                                }}
                                style={{ padding: '4px 8px', fontSize: 11 }}
                              >
                                수정
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= A-11: 실시간 전사 모니터링 ================= */}
          {activeMenu === 'global-monitoring' && (
            <div>
              {/* 상단 헤더 & 비상 공지 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }} data-serial-id="A11-SEC01-HDR01">
                <span className="ui-serial-badge" data-serial-id="A11-SEC01-HDR01" data-item-name="실시간 전사 모니터링 헤더">A11-SEC01-HDR01</span>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
                    📡 실시간 전사 모니터링 관제탑
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)' }}>
                    동시 가동 중인 모든 워크샵의 체크인율, 미션 진척도, 투표 참여 현황을 한눈에 비교하고 실시간 이벤트를 관제합니다.
                  </p>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => setShowBroadcastModal(true)}
                  style={{ background: '#EF4444', display: 'flex', alignItems: 'center', gap: 6 }}
                  data-serial-id="A11-SEC01-BTN01"
                >
                  <span className="ui-serial-badge" data-serial-id="A11-SEC01-BTN01" data-item-name="전사 비상 공지 버튼">A11-SEC01-BTN01</span>
                  <span>🚨 전사 비상 공지 발송</span>
                </button>
              </div>

              {/* 2단 스플릿 뷰: 좌측 실시간 비교 패널 / 우측 실시간 이벤트 스트림 */}
              <div className="dashboard-split">
                {/* 좌측: 동시 진행 워크샵 실시간 상태 비교 */}
                <div>
                  <div className="admin-card" data-serial-id="A11-SEC02-PNL01">
                    <span className="ui-serial-badge" data-serial-id="A11-SEC02-PNL01" data-item-name="동시 진행 워크샵 실시간 비교">A11-SEC02-PNL01</span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
                      🟢 실시간 가동 워크샵 운영 지표 비교
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {workshops.filter((w) => w.status === 'live').map((ws) => {
                        const checkinPct = ws.id === 'ws-2026-ai' ? 90 : 92;
                        const subPct = ws.id === 'ws-2026-ai' ? 100 : 67;
                        const votePct = ws.id === 'ws-2026-ai' ? 85 : 45;

                        return (
                          <div
                            key={ws.id}
                            style={{
                              background: '#F8FAFC',
                              borderRadius: 12,
                              padding: 16,
                              border: '1px solid #E2E8F0'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <div>
                                <span style={{ fontSize: 15, fontWeight: 800 }}>{ws.title}</span>
                                <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginLeft: 8 }}>
                                  ({ws.location})
                                </span>
                              </div>
                              <button
                                className="btn-outline"
                                onClick={() => handleSelectAndGo(ws.id)}
                                style={{ padding: '4px 10px', fontSize: 11 }}
                              >
                                세부 운영 ➔
                              </button>
                            </div>

                            {/* 지표 1: 체크인율 */}
                            <div style={{ marginBottom: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                                <span>체크인 진행률</span>
                                <span style={{ color: '#03B26C' }}>{checkinPct}%</span>
                              </div>
                              <div className="dash-progress-track">
                                <div className="dash-progress-bar" style={{ width: `${checkinPct}%`, background: '#03B26C' }} />
                              </div>
                            </div>

                            {/* 지표 2: 결과물 제출율 */}
                            <div style={{ marginBottom: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                                <span>조별 결과물 제출</span>
                                <span style={{ color: '#3182F6' }}>{subPct}%</span>
                              </div>
                              <div className="dash-progress-track">
                                <div className="dash-progress-bar" style={{ width: `${subPct}%`, background: '#3182F6' }} />
                              </div>
                            </div>

                            {/* 지표 3: 투표 참여율 */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                                <span>선호도 투표 참여</span>
                                <span style={{ color: '#8B5CF6' }}>{votePct}%</span>
                              </div>
                              <div className="dash-progress-track">
                                <div className="dash-progress-bar" style={{ width: `${votePct}%`, background: '#8B5CF6' }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 우측: 전사 실시간 활동 이벤트 피드 */}
                <div>
                  <div className="admin-card" data-serial-id="A11-SEC02-TIM01">
                    <span className="ui-serial-badge" data-serial-id="A11-SEC02-TIM01" data-item-name="전사 실시간 활동 타임라인">A11-SEC02-TIM01</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800 }}>⚡ 실시간 전사 활동 피드</h3>
                      <span style={{ fontSize: 11, color: '#03B26C', fontWeight: 800 }}>● Live SSE 연결됨</span>
                    </div>

                    <ul className="activity-feed">
                      {globalLogs.map((log) => (
                        <li key={log.id} className="activity-row">
                          <span className="activity-time">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span
                                className="activity-badge"
                                style={{
                                  background:
                                    log.type === 'submission' ? '#EBF5FF' :
                                    log.type === 'checkin' ? '#E6F8F0' :
                                    log.type === 'vote' ? '#F3E8FF' :
                                    log.type === 'notice' ? '#FEE2E2' : '#F1F5F9',
                                  color:
                                    log.type === 'submission' ? '#1D4ED8' :
                                    log.type === 'checkin' ? '#047857' :
                                    log.type === 'vote' ? '#6D28D9' :
                                    log.type === 'notice' ? '#B91C1C' : '#475569'
                                }}
                              >
                                {log.type.toUpperCase()}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                                {log.workshopTitle}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--admin-text-main)', lineHeight: 1.4 }}>
                              {log.message}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= A-00: 개별 워크샵 관제 대시보드 ================= */}
          {activeMenu === 'dashboard' && (
            <div>
              {/* 상단 헤더 & 빠른 조작 액션 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }} data-serial-id="A00-SEC01-HDR01">
                <span className="ui-serial-badge" data-serial-id="A00-SEC01-HDR01" data-item-name="대시보드 상단 헤더">A00-SEC01-HDR01</span>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
                    실시간 워크샵 관제 대시보드
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)' }}>
                    {currentWorkshop.title} · {currentWorkshop.location} · 현장 진행 상황 실시간 모니터링
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-outline"
                    onClick={() => setActiveMenu('all-workshops')}
                  >
                    🏢 전체 워크샵 목록
                  </button>
                  <button
                    className="btn-outline"
                    onClick={handleAutoAssignTeams}
                    data-serial-id="A00-SEC01-BTN01"
                  >
                    <span className="ui-serial-badge" data-serial-id="A00-SEC01-BTN01" data-item-name="랜덤 조 편성 버튼">A00-SEC01-BTN01</span>
                    <span>🎲 조 자동 재배정</span>
                  </button>
                  <button
                    className="btn-outline"
                    onClick={handleTogglePublishRanking}
                    data-serial-id="A00-SEC01-BTN02"
                  >
                    <span className="ui-serial-badge" data-serial-id="A00-SEC01-BTN02" data-item-name="순위 공개/비공개 토글">A00-SEC01-BTN02</span>
                    <span>{isRankingPublished ? '🔒 순위 비공개 잠금' : '🔓 순위 앱 공개'}</span>
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleDispatchAwards}
                    data-serial-id="A00-SEC01-BTN03"
                  >
                    <span className="ui-serial-badge" data-serial-id="A00-SEC01-BTN03" data-item-name="시상 확정 발송 버튼">A00-SEC01-BTN03</span>
                    <span>🏆 시상 확정 & 전사 축하</span>
                  </button>
                </div>
              </div>

              {/* 4대 주요 지표 카드 */}
              <div className="stat-grid">
                <div className="stat-card" data-serial-id="A00-SEC02-STA01">
                  <span className="ui-serial-badge" data-serial-id="A00-SEC02-STA01" data-item-name="참석자 체크인 통계 카드">A00-SEC02-STA01</span>
                  <div className="stat-header">
                    <span className="stat-title">현장 체크인율</span>
                    <span className="stat-icon" style={{ background: '#E6F8F0', color: '#03B26C' }}>👥</span>
                  </div>
                  <div className="stat-value">{checkedInCount} / {participants.length}명</div>
                  <div className="stat-desc">
                    <span style={{ color: '#03B26C', fontWeight: 700 }}>
                      {Math.round((checkedInCount / participants.length) * 100)}% 출석 완료
                    </span>
                    (미체크인 {participants.length - checkedInCount}명)
                  </div>
                </div>

                <div className="stat-card" data-serial-id="A00-SEC02-STA02">
                  <span className="ui-serial-badge" data-serial-id="A00-SEC02-STA02" data-item-name="조 편성 현황 카드">A00-SEC02-STA02</span>
                  <div className="stat-header">
                    <span className="stat-title">편성된 조</span>
                    <span className="stat-icon" style={{ background: '#EFF6FF', color: '#3182F6' }}>🏢</span>
                  </div>
                  <div className="stat-value">{mockTeams.length}개 조</div>
                  <div className="stat-desc">조당 평균 4명 배정 완료 (테이블 1~5)</div>
                </div>

                <div className="stat-card" data-serial-id="A00-SEC02-STA03">
                  <span className="ui-serial-badge" data-serial-id="A00-SEC02-STA03" data-item-name="미션 결과물 제출율 카드">A00-SEC02-STA03</span>
                  <div className="stat-header">
                    <span className="stat-title">결과물 제출 현황</span>
                    <span className="stat-icon" style={{ background: '#FFF8E6', color: '#FF9F0A' }}>📁</span>
                  </div>
                  <div className="stat-value">{submissions.length} / {mockTeams.length}조</div>
                  <div className="stat-desc">
                    <span style={{ color: '#03B26C', fontWeight: 700 }}>100% 제출 완료</span> (평균 v1.4 수정)
                  </div>
                </div>

                <div className="stat-card" data-serial-id="A00-SEC02-STA04">
                  <span className="ui-serial-badge" data-serial-id="A00-SEC02-STA04" data-item-name="선호도 투표 현황 카드">A00-SEC02-STA04</span>
                  <div className="stat-header">
                    <span className="stat-title">선호도 투표 상태</span>
                    <span className="stat-icon" style={{ background: '#F5F3FF', color: '#8B5CF6' }}>🗳️</span>
                  </div>
                  <div className="stat-value">{votingStatus === 'open' ? '실시간 집계 중' : '투표 마감'}</div>
                  <div className="stat-desc">
                    순위 공개 상태: <strong style={{ color: isRankingPublished ? '#03B26C' : '#F04452' }}>
                      {isRankingPublished ? '앱 공개 완료' : '블라인드 잠금'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 실시간 조별 현황 & 활동 피드 */}
              <div className="dashboard-split">
                <div className="admin-card" data-serial-id="A00-SEC03-GRD01">
                  <span className="ui-serial-badge" data-serial-id="A00-SEC03-GRD01" data-item-name="조별 테이블 착석 및 제출 현황">A00-SEC03-GRD01</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800 }}>조별 테이블 착석 & 결과물 제출 실시간 현황</h3>
                    <span style={{ fontSize: 12, color: 'var(--admin-text-sub)' }}>5개 조 운영</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {mockTeams.map((t) => {
                      const teamMembers = participants.filter((p) => p.teamId === t.id);
                      const checkedMembers = teamMembers.filter((p) => !!p.checkedInAt);
                      const sub = submissions.find((s) => s.teamId === t.id);

                      return (
                        <div
                          key={t.id}
                          style={{
                            background: '#F8F9FA',
                            borderRadius: 10,
                            padding: '12px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                background: t.color,
                                display: 'inline-block'
                              }}
                            />
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 800 }}>{t.name} (테이블 {t.tableNumber})</div>
                              <div style={{ fontSize: 12, color: 'var(--admin-text-sub)' }}>
                                출석 {checkedMembers.length} / {teamMembers.length}명
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {sub ? (
                              <span
                                style={{
                                  background: '#E6F8F0',
                                  color: '#03B26C',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  padding: '4px 10px',
                                  borderRadius: 8
                                }}
                              >
                                제출완료 (v{sub.version})
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: '#FEE2E2',
                                  color: '#F04452',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  padding: '4px 10px',
                                  borderRadius: 8
                                }}
                              >
                                미제출
                              </span>
                            )}
                            <button
                              className="btn-outline"
                              style={{ fontSize: 11, padding: '4px 8px' }}
                              onClick={() => {
                                if (sub) setPreviewSubmission(sub);
                                else showToast(`${t.name}은 아직 결과물을 제출하지 않았습니다.`);
                              }}
                            >
                              결과물 보기
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="admin-card" data-serial-id="A00-SEC04-LOG01">
                  <span className="ui-serial-badge" data-serial-id="A00-SEC04-LOG01" data-item-name="워크샵 실시간 활동 로그">A00-SEC04-LOG01</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800 }}>현장 실시간 로그</h3>
                    <span style={{ fontSize: 12, color: '#03B26C', fontWeight: 700 }}>● 실시간 반영 중</span>
                  </div>

                  <ul className="activity-feed">
                    <li className="activity-row">
                      <span className="activity-time">15:42</span>
                      <div>
                        <span className="activity-badge" style={{ background: '#E6F8F0', color: '#03B26C' }}>제출</span>
                        <span style={{ marginLeft: 6, fontWeight: 700 }}>1조 생성형 파이오니어</span>
                        <div style={{ color: 'var(--admin-text-sub)', marginTop: 2 }}>[미션 1] 최종 슬라이드 (v2) 업로드 완료</div>
                      </div>
                    </li>
                    <li className="activity-row">
                      <span className="activity-time">15:35</span>
                      <div>
                        <span className="activity-badge" style={{ background: '#EFF6FF', color: '#3182F6' }}>투표</span>
                        <span style={{ marginLeft: 6, fontWeight: 700 }}>익명 투표자</span>
                        <div style={{ color: 'var(--admin-text-sub)', marginTop: 2 }}>타 조 결과물 선호도 투표 행사 (총 18표 집계)</div>
                      </div>
                    </li>
                    <li className="activity-row">
                      <span className="activity-time">09:38</span>
                      <div>
                        <span className="activity-badge" style={{ background: '#FFF8E6', color: '#FF9F0A' }}>체크인</span>
                        <span style={{ marginLeft: 6, fontWeight: 700 }}>윤재호 (당근마켓)</span>
                        <div style={{ color: 'var(--admin-text-sub)', marginTop: 2 }}>현장 QR 체크인 완료 (테이블 2번 배정)</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ================= A-02: 워크샵 마스터 ================= */}
          {activeMenu === 'workshop' && (
            <div className="admin-card" data-serial-id="A02-SEC01-FRM01">
              <span className="ui-serial-badge" data-serial-id="A02-SEC01-FRM01" data-item-name="워크샵 마스터 설정 폼">A02-SEC01-FRM01</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>🏢 워크샵 마스터 정보 및 공지 설정</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>워크샵명</label>
                  <input
                    type="text"
                    value={currentWorkshop.title}
                    onChange={(e) => {
                      const updated = { ...currentWorkshop, title: e.target.value };
                      setWorkshops((prev) => prev.map((w) => (w.id === currentWorkshop.id ? updated : w)));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>주최사 / 주관 부서</label>
                  <input
                    type="text"
                    value={currentWorkshop.organizerCompany}
                    onChange={(e) => {
                      const updated = { ...currentWorkshop, organizerCompany: e.target.value };
                      setWorkshops((prev) => prev.map((w) => (w.id === currentWorkshop.id ? updated : w)));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14 }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>워크샵 장소 및 상세 안내</label>
                  <input
                    type="text"
                    value={currentWorkshop.location}
                    onChange={(e) => {
                      const updated = { ...currentWorkshop, location: e.target.value };
                      setWorkshops((prev) => prev.map((w) => (w.id === currentWorkshop.id ? updated : w)));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14, marginBottom: 6 }}
                  />
                  <input
                    type="text"
                    value={currentWorkshop.locationDetail || ''}
                    placeholder="오시는 길 / 주차 안내 / 셔틀 정보"
                    onChange={(e) => {
                      const updated = { ...currentWorkshop, locationDetail: e.target.value };
                      setWorkshops((prev) => prev.map((w) => (w.id === currentWorkshop.id ? updated : w)));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>참석자 입장 코드 (비밀번호)</label>
                  <input
                    type="text"
                    value={currentWorkshop.joinCode}
                    onChange={(e) => {
                      const updated = { ...currentWorkshop, joinCode: e.target.value };
                      setWorkshops((prev) => prev.map((w) => (w.id === currentWorkshop.id ? updated : w)));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14, fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>현장 체크인 코드</label>
                  <input
                    type="text"
                    value={currentWorkshop.checkinCode}
                    onChange={(e) => {
                      const updated = { ...currentWorkshop, checkinCode: e.target.value };
                      setWorkshops((prev) => prev.map((w) => (w.id === currentWorkshop.id ? updated : w)));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14, fontWeight: 800 }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>상단 강조 공지사항</label>
                  <textarea
                    rows={3}
                    value={currentWorkshop.notice}
                    onChange={(e) => {
                      const updated = { ...currentWorkshop, notice: e.target.value };
                      setWorkshops((prev) => prev.map((w) => (w.id === currentWorkshop.id ? updated : w)));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14, fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  className="btn-primary"
                  onClick={() => showToast(`💾 '${currentWorkshop.title}' 마스터 설정이 성공적으로 저장되었습니다.`)}
                  data-serial-id="A02-SEC01-BTN01"
                >
                  <span className="ui-serial-badge" data-serial-id="A02-SEC01-BTN01" data-item-name="마스터 저장 버튼">A02-SEC01-BTN01</span>
                  설정 저장 완료
                </button>
              </div>
            </div>
          )}

          {/* ================= A-04: 참석자 & 조 편성 관리 ================= */}
          {activeMenu === 'participants' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }} data-serial-id="A04-SEC01-HDR01">
                <span className="ui-serial-badge" data-serial-id="A04-SEC01-HDR01" data-item-name="참석자 관리 상단 헤더">A04-SEC01-HDR01</span>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800 }}>👥 참석자 명단 및 조 편성 매니저</h2>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)' }}>
                    {currentWorkshop.title} 사전 등록 참석자 20명 관리 및 조별 테이블 배정
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-outline"
                    onClick={() => setShowCsvModal(true)}
                    data-serial-id="A04-SEC01-BTN01"
                  >
                    <span className="ui-serial-badge" data-serial-id="A04-SEC01-BTN01" data-item-name="CSV 업로드 버튼">A04-SEC01-BTN01</span>
                    📥 CSV 명단 업로드
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleAutoAssignTeams}
                    data-serial-id="A04-SEC01-BTN02"
                  >
                    <span className="ui-serial-badge" data-serial-id="A04-SEC01-BTN02" data-item-name="자동 조 편성 버튼">A04-SEC01-BTN02</span>
                    🎲 조 자동 균등 배정
                  </button>
                </div>
              </div>

              <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }} data-serial-id="A04-SEC02-TBL01">
                <span className="ui-serial-badge" data-serial-id="A04-SEC02-TBL01" data-item-name="참석자 명단 테이블">A04-SEC02-TBL01</span>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>참석자 ID</th>
                      <th>이름</th>
                      <th>전화번호</th>
                      <th>소속 기업 / 역할</th>
                      <th>구분</th>
                      <th>소속 조 (테이블)</th>
                      <th>체크인 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => {
                      const team = mockTeams.find((t) => t.id === p.teamId);
                      return (
                        <tr key={p.id}>
                          <td><code>{p.id}</code></td>
                          <td style={{ fontWeight: 800 }}>{p.name}</td>
                          <td>{p.phone}</td>
                          <td>{p.company} · {p.roleTitle || '참석자'}</td>
                          <td>
                            <span
                              style={{
                                background: p.type === 'client' ? '#EFF6FF' : '#F5F3FF',
                                color: p.type === 'client' ? '#3182F6' : '#8B5CF6',
                                fontSize: 11,
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: 6
                              }}
                            >
                              {p.type === 'client' ? '발주사' : '수요자'}
                            </span>
                          </td>
                          <td>
                            {team ? (
                              <span style={{ fontWeight: 700, color: team.color }}>
                                ● {team.name}
                              </span>
                            ) : (
                              <span style={{ color: '#9CA3AF' }}>미배정</span>
                            )}
                          </td>
                          <td>
                            {p.checkedInAt ? (
                              <span style={{ color: '#03B26C', fontWeight: 800, fontSize: 12 }}>
                                ✓ 체크인 완료 ({new Date(p.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            ) : (
                              <span style={{ color: '#9CA3AF', fontSize: 12 }}>미출석</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= A-03: 아젠다 & 미션 관리 ================= */}
          {activeMenu === 'missions' && (
            <div className="admin-card" data-serial-id="A03-SEC01-LST01">
              <span className="ui-serial-badge" data-serial-id="A03-SEC01-LST01" data-item-name="아젠다 및 미션 관리 목록">A03-SEC01-LST01</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>📅 타임테이블 아젠다 & 조별 미션 규격</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mockAgendas.map((ag) => (
                  <div
                    key={ag.id}
                    style={{
                      border: '1px solid var(--admin-border)',
                      borderRadius: 10,
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#3182F6' }}>
                        {ag.startAt} - {ag.endAt} ({ag.speaker})
                      </span>
                      <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>{ag.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--admin-text-sub)', marginTop: 2 }}>{ag.description}</div>
                    </div>
                    <button
                      className="btn-outline"
                      style={{ fontSize: 12 }}
                      onClick={() => showToast(`'${ag.title}' 아젠다 수정창을 엽니다.`)}
                    >
                      편집
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= A-05: 제출 현황 모니터링 ================= */}
          {activeMenu === 'submissions' && (
            <div className="admin-card" data-serial-id="A05-SEC01-GRD01">
              <span className="ui-serial-badge" data-serial-id="A05-SEC01-GRD01" data-item-name="결과물 갤러리 및 모니터링">A05-SEC01-GRD01</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800 }}>📁 [미션 1] 조별 결과물 제출 모니터링 & 갤러리</h2>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)' }}>
                    각 조별 슬라이드, 문서, 와이어프레임 이미지 제출본 실시간 확인
                  </p>
                </div>
                <button
                  className="btn-outline"
                  onClick={() => handleExportCsv('submissions')}
                >
                  📥 제출 현황 다운로드
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {submissions.map((sub) => {
                  const team = mockTeams.find((t) => t.id === sub.teamId);
                  return (
                    <div
                      key={sub.id}
                      style={{
                        border: '1px solid var(--admin-border)',
                        borderRadius: 12,
                        padding: 16,
                        background: '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: team?.color || '#3182F6' }}>
                          ● {team?.name}
                        </span>
                        <span style={{ fontSize: 11, background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
                          v{sub.version}
                        </span>
                      </div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{sub.title}</h4>
                      <p style={{ fontSize: 12, color: 'var(--admin-text-sub)', marginBottom: 12, lineHeight: 1.4 }}>
                        {sub.comment || '조별 결과물 제출 설명이 등록되었습니다.'}
                      </p>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 12 }}>
                        제출 시각: {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <button
                        className="btn-primary"
                        style={{ width: '100%', fontSize: 12 }}
                        onClick={() => setPreviewSubmission(sub)}
                      >
                        상세 파일 및 슬라이드 보기
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= A-06: 투표 및 순위 제어 ================= */}
          {activeMenu === 'voting' && (
            <div>
              <div className="admin-card" data-serial-id="A06-SEC01-CTR01">
                <span className="ui-serial-badge" data-serial-id="A06-SEC01-CTR01" data-item-name="투표 및 순위 공개 제어기">A06-SEC01-CTR01</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800 }}>🗳️ 선호도 투표 현황 및 최종 순위표 공개 제어</h2>
                    <p style={{ fontSize: 13, color: 'var(--admin-text-sub)' }}>
                      골든 룰 #2: 관리자가 순위를 공개하기 전까지 참석자 스마트폰에는 득표수가 블라인드 처리됩니다.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        setVotingStatus(votingStatus === 'open' ? 'closed' : 'open');
                        showToast(`투표가 [${votingStatus === 'open' ? '마감' : '개시'}]되었습니다.`);
                      }}
                    >
                      {votingStatus === 'open' ? '⛔ 투표 마감하기' : '▶️ 투표 재개'}
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleTogglePublishRanking}
                    >
                      {isRankingPublished ? '🔒 순위 비공개 잠금' : '🔓 순위 앱 공개'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 순위표 테이블 */}
              <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }} data-serial-id="A06-SEC02-RNK01">
                <span className="ui-serial-badge" data-serial-id="A06-SEC02-RNK01" data-item-name="실시간 득표 및 순위 테이블">A06-SEC02-RNK01</span>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>조 이름</th>
                      <th>결과물 제목</th>
                      <th>득표수</th>
                      <th>비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculateRanking(submissions).map((item) => {
                      const team = mockTeams.find((t) => t.id === item.teamId);
                      return (
                        <tr key={item.submissionId}>
                          <td>
                            <strong style={{ fontSize: 16, color: item.rank === 1 ? '#D97706' : '#191F28' }}>
                              {item.rank === 1 ? '🥇 1위' : item.rank === 2 ? '🥈 2위' : item.rank === 3 ? '🥉 3위' : `${item.rank}위`}
                            </strong>
                          </td>
                          <td style={{ fontWeight: 800 }}>{team?.name || '조별팀'}</td>
                          <td>{item.title}</td>
                          <td>
                            <strong style={{ color: '#3182F6', fontSize: 15 }}>{item.voteCount}표</strong>
                          </td>
                          <td>
                            {item.rank === 1 && (
                              <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
                                최우수상 대상
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= A-07: 우승 및 시상 ================= */}
          {activeMenu === 'awards' && (
            <div className="admin-card" data-serial-id="A07-SEC01-AWD01">
              <span className="ui-serial-badge" data-serial-id="A07-SEC01-AWD01" data-item-name="우승팀 및 시상 발송 폼">A07-SEC01-AWD01</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>🏆 우승팀 시상 및 참석자 스마트폰 축하 발송</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>
                    최우수 우승 조 선택
                  </label>
                  <select
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14 }}
                  >
                    <option value="team-1">1조 · 생성형 파이오니어 (최다 득표 14표)</option>
                    <option value="team-2">2조 · 오토메이션 랩 (11표)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>
                    MVP 최고 작업자 선택
                  </label>
                  <select
                    value={selectedTopWorker}
                    onChange={(e) => setSelectedTopWorker(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14 }}
                  >
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.company} / {mockTeams.find((t) => t.id === p.teamId)?.name || '미배정'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn-primary"
                  onClick={handleDispatchAwards}
                  style={{ background: '#D97706', padding: '10px 20px', fontSize: 14 }}
                >
                  🎉 시상 확정 및 스마트폰 전체 컨페티 발송
                </button>
              </div>
            </div>
          )}

          {/* ================= A-08: 공지 및 푸시 ================= */}
          {activeMenu === 'notice' && (
            <div className="admin-card" data-serial-id="A08-SEC01-NOT01">
              <span className="ui-serial-badge" data-serial-id="A08-SEC01-NOT01" data-item-name="공지 및 푸시 발송 폼">A08-SEC01-NOT01</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>📢 현장 실시간 공지 및 푸시 알림 발송</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>
                    발송 대상
                  </label>
                  <select
                    value={noticeTarget}
                    onChange={(e) => setNoticeTarget(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14 }}
                  >
                    <option value="all">전체 참석자 스마트폰 (20명)</option>
                    <option value="team-1">1조 · 생성형 파이오니어만</option>
                    <option value="team-2">2조 · 오토메이션 랩만</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>
                    공지 제목
                  </label>
                  <input
                    type="text"
                    placeholder="예: ☕ 로비 2층 다과 준비 안내"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>
                    공지 내용
                  </label>
                  <textarea
                    rows={4}
                    placeholder="참석자들에게 실시간으로 전송할 안내 메시지를 입력하세요."
                    value={noticeBody}
                    onChange={(e) => setNoticeBody(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14, fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      if (!noticeTitle.trim()) {
                        alert('제목을 입력해주세요.');
                        return;
                      }
                      showToast(`📢 [${noticeTitle}] 공지가 실시간으로 전송되었습니다.`);
                      setNoticeTitle('');
                      setNoticeBody('');
                    }}
                  >
                    실시간 푸시 알림 발송
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= A-09: 결과 리포트 ================= */}
          {activeMenu === 'reports' && (
            <div className="admin-card" data-serial-id="A09-SEC01-REP01">
              <span className="ui-serial-badge" data-serial-id="A09-SEC01-REP01" data-item-name="결과 리포트 내보내기 폼">A09-SEC01-REP01</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>📈 결과 리포트 및 감사 로그 내보내기</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ border: '1px solid var(--admin-border)', borderRadius: 12, padding: 18 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>📊 참석자 명단 및 체크인 기록 (CSV)</h4>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)', marginBottom: 14 }}>
                    참석자 20명의 사전 등록 정보 및 현장 최초 체크인 타임스탬프 기록
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => handleExportCsv('participants')}
                  >
                    참석자 CSV 다운로드
                  </button>
                </div>
                <div style={{ border: '1px solid var(--admin-border)', borderRadius: 12, padding: 18 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>🗳️ 투표 집계 및 최종 순위표 (CSV)</h4>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)', marginBottom: 14 }}>
                    조별 제출물 득표수, 순위표 및 참가자 선호도 투표 감사 로그
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => handleExportCsv('voting_ranking')}
                  >
                    투표 결과 CSV 다운로드
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= 모달 1: 새 워크샵 개설 모달 ================= */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✨ 신규 워크샵 개설</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateWorkshopSubmit}>
              <div className="modal-body">
                <div className="form-field">
                  <label className="form-label">워크샵 명칭 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 2026 하반기 생성형 AI 에이전트 해커톤"
                    value={newWsForm.title}
                    onChange={(e) => setNewWsForm({ ...newWsForm, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label className="form-label">카테고리</label>
                    <select
                      value={newWsForm.category}
                      onChange={(e) => setNewWsForm({ ...newWsForm, category: e.target.value })}
                      className="form-select"
                    >
                      <option value="AI / 생성형 모델">AI / 생성형 모델</option>
                      <option value="클라우드 / 인프라">클라우드 / 인프라</option>
                      <option value="디자인 / UX">디자인 / UX</option>
                      <option value="데이터 엔지니어링">데이터 엔지니어링</option>
                      <option value="금융 / 핀테크">금융 / 핀테크</option>
                      <option value="일반 워크샵">일반 워크샵</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">주최사 / 부서 *</label>
                    <input
                      type="text"
                      required
                      value={newWsForm.organizerCompany}
                      onChange={(e) => setNewWsForm({ ...newWsForm, organizerCompany: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">개최 장소 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 강남 드림플러스 지하 1층 이벤트홀"
                    value={newWsForm.location}
                    onChange={(e) => setNewWsForm({ ...newWsForm, location: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label className="form-label">참석자 입장 코드 (비밀번호) *</label>
                    <input
                      type="text"
                      required
                      value={newWsForm.joinCode}
                      onChange={(e) => setNewWsForm({ ...newWsForm, joinCode: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">현장 체크인 코드 *</label>
                    <input
                      type="text"
                      required
                      value={newWsForm.checkinCode}
                      onChange={(e) => setNewWsForm({ ...newWsForm, checkinCode: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">안내 공지사항</label>
                  <textarea
                    rows={2}
                    value={newWsForm.notice}
                    onChange={(e) => setNewWsForm({ ...newWsForm, notice: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)}>취소</button>
                <button type="submit" className="btn-primary">🎉 워크샵 개설 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 모달 2: 워크샵 정보 수정 모달 ================= */}
      {showEditModal && editWsForm && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">⚙️ 워크샵 정보 수정</h3>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateWorkshopSubmit}>
              <div className="modal-body">
                <div className="form-field">
                  <label className="form-label">워크샵 명칭</label>
                  <input
                    type="text"
                    required
                    value={editWsForm.title}
                    onChange={(e) => setEditWsForm({ ...editWsForm, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label className="form-label">운영 상태</label>
                    <select
                      value={editWsForm.status}
                      onChange={(e) => setEditWsForm({ ...editWsForm, status: e.target.value as WorkshopStatus })}
                      className="form-select"
                    >
                      <option value="ready">🟡 READY (준비 및 접수 중)</option>
                      <option value="live">🟢 LIVE (실시간 진행 중)</option>
                      <option value="closed">⚪ CLOSED (종료 및 시상 완료)</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">카테고리</label>
                    <input
                      type="text"
                      value={editWsForm.category || ''}
                      onChange={(e) => setEditWsForm({ ...editWsForm, category: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">장소</label>
                  <input
                    type="text"
                    value={editWsForm.location}
                    onChange={(e) => setEditWsForm({ ...editWsForm, location: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label className="form-label">입장 코드</label>
                    <input
                      type="text"
                      value={editWsForm.joinCode}
                      onChange={(e) => setEditWsForm({ ...editWsForm, joinCode: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">체크인 코드</label>
                    <input
                      type="text"
                      value={editWsForm.checkinCode}
                      onChange={(e) => setEditWsForm({ ...editWsForm, checkinCode: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">상단 공지</label>
                  <textarea
                    rows={3}
                    value={editWsForm.notice}
                    onChange={(e) => setEditWsForm({ ...editWsForm, notice: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowEditModal(false)}>취소</button>
                <button type="submit" className="btn-primary">💾 변경 사항 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 모달 3: 전사 비상 공지 브로드캐스트 모달 ================= */}
      {showBroadcastModal && (
        <div className="modal-overlay" onClick={() => setShowBroadcastModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#EF4444' }}>🚨 전사 비상 공지 브로드캐스트</h3>
              <button className="modal-close-btn" onClick={() => setShowBroadcastModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: 12, borderRadius: 8, fontSize: 13, color: '#B91C1C' }}>
                ⚠️ 본 공지는 현재 진행 중인 모든 워크샵에 참여하고 있는 전체 참석자의 스마트폰 화면에 즉시 팝업 알림으로 전송됩니다.
              </div>

              <div className="form-field">
                <label className="form-label">발송 대상</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value as any)}
                  className="form-select"
                >
                  <option value="live">현재 LIVE 진행 중인 모든 워크샵 ({liveCount}개 워크샵)</option>
                  <option value="all">전체 등록 워크샵 ({totalWorkshops}개 워크샵)</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">공지 제목</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label className="form-label">공지 내용</label>
                <textarea
                  rows={4}
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  className="form-textarea"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowBroadcastModal(false)}>취소</button>
              <button className="btn-primary" style={{ background: '#EF4444' }} onClick={handleBroadcastAlert}>
                🚨 즉시 전사 브로드캐스트
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 모달 4: 결과물 슬라이드 상세 뷰어 ================= */}
      {previewSubmission && (
        <div className="modal-overlay" onClick={() => setPreviewSubmission(null)}>
          <div className="modal-dialog" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: 12, color: 'var(--admin-primary)', fontWeight: 800 }}>
                  {mockTeams.find((t) => t.id === previewSubmission.teamId)?.name} (v{previewSubmission.version})
                </span>
                <h3 className="modal-title">{previewSubmission.title}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setPreviewSubmission(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', marginBottom: 4 }}>기획 의도 및 요약</div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{previewSubmission.comment}</div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>제출 첨부 파일</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {previewSubmission.files.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      border: '1px solid var(--admin-border)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700 }}>📄 {f.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginLeft: 8 }}>
                        ({Math.round(f.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      className="btn-outline"
                      style={{ fontSize: 11 }}
                      onClick={() => showToast(`'${f.name}' 파일을 다운로드합니다.`)}
                    >
                      다운로드
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setPreviewSubmission(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 모달 5: CSV 업로드 모달 ================= */}
      {showCsvModal && (
        <div className="modal-overlay" onClick={() => setShowCsvModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📥 참석자 명단 CSV 일괄 업로드</h3>
              <button className="modal-close-btn" onClick={() => setShowCsvModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ border: '2px dashed var(--admin-border)', borderRadius: 12, padding: 30, textAlign: 'center' }}>
                <span style={{ fontSize: 32 }}>📁</span>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>CSV 파일을 이곳에 드래그하거나 선택하세요</div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                  필수 컬럼: 이름, 전화번호, 소속회사, 구분(발주사/수요자)
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowCsvModal(false)}>취소</button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowCsvModal(false);
                  showToast('📥 20명의 사전 등록 참석자 명단이 정상적으로 반영되었습니다.');
                }}
              >
                업로드 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            background: 'rgba(25, 31, 40, 0.95)',
            color: '#fff',
            padding: '12px 22px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 10000,
            backdropFilter: 'blur(4px)'
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
