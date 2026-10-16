import React, { useState, useEffect } from 'react';
import {
  mockWorkshop,
  mockAgendas,
  mockTeams,
  mockParticipants,
  mockMissions,
  mockSubmissions,
  mockAwards,
  calculateRanking,
  Participant,
  Submission
} from '@workshopsync/shared';

export type AdminMenu = 'dashboard' | 'workshop' | 'participants' | 'missions' | 'submissions' | 'voting' | 'awards' | 'notice' | 'reports';

export default function App() {
  const [activeMenu, setActiveMenu] = useState<AdminMenu>('dashboard');
  const [workshop, setWorkshop] = useState(mockWorkshop);
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);
  const [submissions, setSubmissions] = useState<Submission[]>(mockSubmissions);
  const [votingStatus, setVotingStatus] = useState<'open' | 'closed'>('open');
  const [isRankingPublished, setIsRankingPublished] = useState(false);
  const [selectedTopWorker, setSelectedTopWorker] = useState(mockParticipants[1].id); // 이수진
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 결과물 상세 미리보기 모달 (대시보드 및 모니터링 연동)
  const [previewSubmission, setPreviewSubmission] = useState<Submission | null>(null);

  // CSV 임포트 모달
  const [showCsvModal, setShowCsvModal] = useState(false);
  // 공지 발송 폼
  const [noticeTarget, setNoticeTarget] = useState('all');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const checkedInCount = participants.filter((p) => !!p.checkedInAt).length;

  // URL Hash 기반 관리자 딥링크 라우팅
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const menu = params.get('menu');
      if (menu && ['dashboard', 'workshop', 'participants', 'missions', 'submissions', 'voting', 'awards', 'notice', 'reports'].includes(menu)) {
        setActiveMenu(menu as AdminMenu);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 메뉴 변경 시 Hash 및 Document Title 동기화
  useEffect(() => {
    const menuTitleMap: Record<string, string> = {
      dashboard: '종합 대시보드',
      workshop: '워크샵 마스터',
      participants: '참석자 & 조 편성 관리',
      missions: '아젠다 & 미션 관리',
      submissions: '제출 현황 모니터링',
      voting: '투표 및 순위 제어',
      awards: '우승 및 시상 발송',
      notice: '공지 및 푸시 발송',
      reports: '결과 리포트 내보내기'
    };
    const title = `${menuTitleMap[activeMenu] || activeMenu} - WorkshopSync 관리자`;
    document.title = title;
    if (window.location.hash !== `#menu=${activeMenu}`) {
      window.history.replaceState(null, '', `#menu=${activeMenu}`);
    }
  }, [activeMenu]);

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
    showToast(isRankingPublished ? '🔒 순위가 다시 비공개(집계 중)로 잠겼습니다.' : '🔓 전체 참석자 앱에 최종 순위표가 공개되었습니다!');
  };

  // 시상 확정 및 알림 발송 (골든 룰 #8)
  const handleDispatchAwards = () => {
    const topWorker = participants.find((p) => p.id === selectedTopWorker);
    showToast(`🏆 1조 우승 및 최고 작업자(${topWorker?.name}) 시상이 확정되어 전체 스마트폰에 컨페티 축하 화면이 전송되었습니다!`);
  };

  // CSV 내보내기 시뮬레이션
  const handleExportCsv = (type: string) => {
    const dummyCsv = `ID,이름,소속,조,체크인여부\n` + participants.map(p => `${p.id},${p.name},${p.company},${p.teamId || '미배정'},${p.checkedInAt ? '완료' : '미참석'}`).join('\n');
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
      {/* 좌측 사이드바 */}
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
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveMenu('dashboard')}
              data-serial-id="A00-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A00-SEC01-NAV01" data-item-name="종합 대시보드 메뉴">A00-SEC01-NAV01</span>
              <span>📊</span>
              <span>종합 대시보드</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'workshop' ? 'active' : ''}`}
              onClick={() => setActiveMenu('workshop')}
              data-serial-id="A02-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A02-SEC01-NAV01" data-item-name="워크샵 마스터 메뉴">A02-SEC01-NAV01</span>
              <span>🏢</span>
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
              <span>📅</span>
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
              <span>📊</span>
              <span>제출 모니터링</span>
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
              <span className="ui-serial-badge" data-serial-id="A07-SEC01-NAV01" data-item-name="우승 시상 관리 메뉴">A07-SEC01-NAV01</span>
              <span>🏆</span>
              <span>우승 & 시상 발송</span>
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
              <span>공지 & 푸시 발송</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveMenu('reports')}
              data-serial-id="A09-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A09-SEC01-NAV01" data-item-name="결과 리포트 내보내기 메뉴">A09-SEC01-NAV01</span>
              <span>📁</span>
              <span>결과 리포트</span>
            </button>
          </li>
        </ul>
      </aside>

      {/* 우측 메인 영역 */}
      <div className="admin-main">
        {/* 탑바 */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>{workshop.title}</span>
            <span className="badge-live">● LIVE 진행 중</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 13, color: 'var(--admin-text-sub)' }}>
              체크인 참석률: <strong>{checkedInCount} / {participants.length}명 ({Math.round((checkedInCount / participants.length) * 100)}%)</strong>
            </span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>운영자: 박소연 팀장</span>
          </div>
        </header>

        {/* 메인 콘텐츠 영역 */}
        <main className="admin-content">
          {/* ================= A-00: 종합 대시보드 ================= */}
          {activeMenu === 'dashboard' && (
            <div>
              {/* 상단 헤더 & 빠른 조작 액션 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }} data-serial-id="A00-SEC01-HDR01">
                <span className="ui-serial-badge" data-serial-id="A00-SEC01-HDR01" data-item-name="대시보드 상단 헤더">A00-SEC01-HDR01</span>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>실시간 워크샵 관제 대시보드</h2>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)' }}>
                    {workshop.title} · {workshop.location} · 현장 진행 상황 실시간 원스크린 모니터링
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-outline"
                    onClick={() => setActiveMenu('notice')}
                    data-serial-id="A00-SEC01-BTN01"
                  >
                    <span className="ui-serial-badge" data-serial-id="A00-SEC01-BTN01" data-item-name="긴급 공지 발송 버튼">A00-SEC01-BTN01</span>
                    📢 긴급 공지 발송
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
                      const port = (import.meta as any).env?.VITE_MOBILE_PORT || '30016';
                      window.open(`${window.location.protocol}//${host}:${port}`, '_blank');
                    }}
                    title="참석자 전용 스마트폰 웹앱을 새 창으로 엽니다"
                    data-serial-id="A00-SEC01-BTN02"
                  >
                    <span className="ui-serial-badge" data-serial-id="A00-SEC01-BTN02" data-item-name="참석자 앱 열기 버튼">A00-SEC01-BTN02</span>
                    📱 참석자 앱 열기
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => handleExportCsv('dashboard_summary')}
                    data-serial-id="A00-SEC01-BTN03"
                  >
                    <span className="ui-serial-badge" data-serial-id="A00-SEC01-BTN03" data-item-name="종합 리포트 CSV 내보내기">A00-SEC01-BTN03</span>
                    📊 종합 리포트 CSV
                  </button>
                </div>
              </div>

              {/* 4대 핵심 KPI 카드 그리드 */}
              <div className="stat-grid" data-serial-id="A00-SEC02-GRD01">
                <span className="ui-serial-badge" data-serial-id="A00-SEC02-GRD01" data-item-name="핵심 KPI 스탯 그리드">A00-SEC02-GRD01</span>
                
                {/* 1. 체크인 참석률 */}
                <div className="stat-card" data-serial-id="A00-SEC02-CRD01">
                  <span className="ui-serial-badge" data-serial-id="A00-SEC02-CRD01" data-item-name="체크인 참석률 카드">A00-SEC02-CRD01</span>
                  <div className="stat-header">
                    <span className="stat-title">현장 체크인 참석률</span>
                    <div className="stat-icon" style={{ background: '#E6F8F0', color: '#03B26C' }}>👥</div>
                  </div>
                  <div className="stat-value">{checkedInCount} / {participants.length}명 ({Math.round((checkedInCount / participants.length) * 100)}%)</div>
                  <div className="stat-desc">
                    <span>미체크인 2명 (최동욱, 오세훈)</span>
                  </div>
                  <div className="dash-progress-track">
                    <div className="dash-progress-bar" style={{ width: `${(checkedInCount / participants.length) * 100}%`, background: '#03B26C' }} />
                  </div>
                </div>

                {/* 2. 조 편성 현황 */}
                <div className="stat-card" data-serial-id="A00-SEC02-CRD02">
                  <span className="ui-serial-badge" data-serial-id="A00-SEC02-CRD02" data-item-name="조 편성 현황 카드">A00-SEC02-CRD02</span>
                  <div className="stat-header">
                    <span className="stat-title">조 편성 현황</span>
                    <div className="stat-icon" style={{ background: '#EBF4FF', color: '#3182F6' }}>🧩</div>
                  </div>
                  <div className="stat-value">{mockTeams.length}개 조 (20명 완편)</div>
                  <div className="stat-desc">
                    <span>조당 평균 4.0명 · 전담 코치 5명 매칭</span>
                  </div>
                  <div className="dash-progress-track">
                    <div className="dash-progress-bar" style={{ width: '100%', background: '#3182F6' }} />
                  </div>
                </div>

                {/* 3. 미션 1 제출 진행률 */}
                <div className="stat-card" data-serial-id="A00-SEC02-CRD03">
                  <span className="ui-serial-badge" data-serial-id="A00-SEC02-CRD03" data-item-name="미션 제출률 카드">A00-SEC02-CRD03</span>
                  <div className="stat-header">
                    <span className="stat-title">미션 1 결과물 제출률</span>
                    <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>📤</div>
                  </div>
                  <div className="stat-value">4 / 5개 조 (80%)</div>
                  <div className="stat-desc">
                    <span>4조(팀 델타) 작성 중 · 마감 14분 전</span>
                  </div>
                  <div className="dash-progress-track">
                    <div className="dash-progress-bar" style={{ width: '80%', background: '#D97706' }} />
                  </div>
                </div>

                {/* 4. 선호도 투표 진행 상황 */}
                <div className="stat-card" data-serial-id="A00-SEC02-CRD04">
                  <span className="ui-serial-badge" data-serial-id="A00-SEC02-CRD04" data-item-name="선호도 투표 현황 카드">A00-SEC02-CRD04</span>
                  <div className="stat-header">
                    <span className="stat-title">선호도 투표 현황</span>
                    <div className="stat-icon" style={{ background: '#F3E8FF', color: '#9333EA' }}>🗳️</div>
                  </div>
                  <div className="stat-value">16 / 20표 (80%)</div>
                  <div className="stat-desc">
                    <span>상태: {votingStatus === 'open' ? 'OPEN 진행 중' : 'CLOSED 마감'} · {isRankingPublished ? '순위 공개됨' : '블라인드 집계 중'}</span>
                  </div>
                  <div className="dash-progress-track">
                    <div className="dash-progress-bar" style={{ width: '80%', background: '#9333EA' }} />
                  </div>
                </div>
              </div>

              {/* 2-컬럼 분할 모니터링 섹션 */}
              <div className="dashboard-split" data-serial-id="A00-SEC03-SPLIT">
                <span className="ui-serial-badge" data-serial-id="A00-SEC03-SPLIT" data-item-name="대시보드 분할 모니터링">A00-SEC03-SPLIT</span>

                {/* 좌측: 실시간 아젠다 & 조별 제출 매트릭스 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* 위젯 1: 현재 진행 아젠다 타임라인 */}
                  <div className="admin-card" data-serial-id="A00-SEC03-WGT01" style={{ margin: 0 }}>
                    <span className="ui-serial-badge" data-serial-id="A00-SEC03-WGT01" data-item-name="현재 아젠다 위젯">A00-SEC03-WGT01</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>⏱️</span>
                        <h3 style={{ fontSize: 16, fontWeight: 800 }}>실시간 진행 세션</h3>
                      </div>
                      <span className="badge-live">● LIVE 진행 중</span>
                    </div>

                    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-primary)' }}>11:00 ~ 13:00 (120분)</span>
                        <span style={{ fontSize: 12, background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                          ⏳ 종료까지 14분 전
                        </span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
                        [미션 1] 조별 비즈니스 문제 정의 및 AI 에이전트 설계안 도출
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--admin-text-sub)' }}>
                        장소: 센터필드 메인 홀 및 각 조별 분임토의실 1~5호 (전담 퍼실리테이터 코칭 진행)
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 13 }}>
                      <span style={{ color: 'var(--admin-text-muted)' }}>
                        다음 세션: <strong>13:00 ~ 14:00 네트워킹 점심 식사 (도시락 배부)</strong>
                      </span>
                      <button
                        className="btn-outline"
                        style={{ fontSize: 12, padding: '4px 10px' }}
                        onClick={() => setActiveMenu('missions')}
                      >
                        아젠다 관리 →
                      </button>
                    </div>
                  </div>

                  {/* 위젯 2: 조별 미션 제출 현황 및 실시간 검토 */}
                  <div className="admin-card" data-serial-id="A00-SEC03-WGT02" style={{ margin: 0 }}>
                    <span className="ui-serial-badge" data-serial-id="A00-SEC03-WGT02" data-item-name="조별 제출 현황 위젯">A00-SEC03-WGT02</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>📋</span>
                        <h3 style={{ fontSize: 16, fontWeight: 800 }}>조별 미션 1 제출 현황</h3>
                      </div>
                      <button
                        className="btn-outline"
                        style={{ fontSize: 12, padding: '4px 10px' }}
                        onClick={() => setActiveMenu('submissions')}
                      >
                        제출 모니터링 상세 →
                      </button>
                    </div>

                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>조</th>
                          <th>제출물 제목</th>
                          <th>버전</th>
                          <th>제출 시각</th>
                          <th>상태</th>
                          <th>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockTeams.map((team) => {
                          const sub = submissions.find((s) => s.teamId === team.id);
                          return (
                            <tr key={team.id}>
                              <td style={{ fontWeight: 700 }}>{team.name}</td>
                              <td>{sub ? sub.title : <span style={{ color: 'var(--admin-text-muted)' }}>미제출 (작성 중)</span>}</td>
                              <td>{sub ? <span style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>v{sub.version}</span> : '-'}</td>
                              <td style={{ fontSize: 12, color: 'var(--admin-text-sub)' }}>
                                {sub ? new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                              <td>
                                {sub ? (
                                  <span style={{ fontSize: 11, background: '#E6F8F0', color: '#03B26C', fontWeight: 800, padding: '3px 8px', borderRadius: 12 }}>
                                    ● 제출완료
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 11, background: '#FEF3C7', color: '#D97706', fontWeight: 800, padding: '3px 8px', borderRadius: 12 }}>
                                    ⏳ 작성중
                                  </span>
                                )}
                              </td>
                              <td>
                                {sub ? (
                                  <button
                                    className="btn-outline"
                                    style={{ fontSize: 11, padding: '3px 8px' }}
                                    onClick={() => setPreviewSubmission(sub)}
                                    title="제출물 상세 및 첨부파일 확인"
                                  >
                                    미리보기
                                  </button>
                                ) : (
                                  <button
                                    className="btn-outline"
                                    style={{ fontSize: 11, padding: '3px 8px', color: '#D97706', borderColor: '#FCD34D' }}
                                    onClick={() => {
                                      showToast(`📢 ${team.name}에 마감 독려 푸시 알림이 발송되었습니다.`);
                                    }}
                                  >
                                    독려 푸시
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 우측: 실시간 투표 득표 순위 & 활동 피드 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* 위젯 3: 실시간 선호도 투표 득표 순위 (관리자 블라인드 해제 뷰) */}
                  <div className="admin-card" data-serial-id="A00-SEC03-WGT03" style={{ margin: 0 }}>
                    <span className="ui-serial-badge" data-serial-id="A00-SEC03-WGT03" data-item-name="실시간 투표 순위 위젯">A00-SEC03-WGT03</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>🏆</span>
                        <h3 style={{ fontSize: 16, fontWeight: 800 }}>실시간 득표 순위</h3>
                      </div>
                      <span style={{ fontSize: 11, background: '#EEF2FF', color: '#4F46E5', fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                        관리자 전용 블라인드 해제
                      </span>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--admin-text-sub)', marginBottom: 14 }}>
                      현재 참가자 앱은 순위가 <strong>{isRankingPublished ? '공개' : '비공개(집계 중)'}</strong> 상태입니다.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                      {calculateRanking(submissions).map((rankItem) => {
                        const team = mockTeams.find((t) => t.id === rankItem.teamId);
                        return (
                          <div
                            key={rankItem.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              borderRadius: 10,
                              background: rankItem.rank === 1 ? 'linear-gradient(90deg, #FEF9C3 0%, #FFFFFF 100%)' : '#F9FAFB',
                              border: rankItem.rank === 1 ? '1.5px solid #FACC15' : '1px solid #E5E7EB'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: 12,
                                background: rankItem.rank === 1 ? '#EAB308' : rankItem.rank === 2 ? '#94A3B8' : rankItem.rank === 3 ? '#B45309' : '#E5E7EB',
                                color: rankItem.rank <= 3 ? '#fff' : '#6B7280'
                              }}>
                                {rankItem.rank}
                              </span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{team?.name || '미배정'}</div>
                                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{rankItem.title}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: 14, color: rankItem.rank === 1 ? '#CA8A04' : 'var(--admin-text-main)' }}>
                                {rankItem.voteCount || 0}표
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{rankItem.percentage}%</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-primary"
                        style={{ flex: 1, fontSize: 12, padding: '8px 10px', background: isRankingPublished ? '#EF4444' : 'var(--admin-primary)' }}
                        onClick={handleTogglePublishRanking}
                      >
                        {isRankingPublished ? '🔒 순위 비공개로 잠금' : '🔓 전체 참석자에게 순위 공개'}
                      </button>
                      <button
                        className="btn-outline"
                        style={{ fontSize: 12, padding: '8px 10px' }}
                        onClick={() => {
                          const nextStatus = votingStatus === 'open' ? 'closed' : 'open';
                          setVotingStatus(nextStatus);
                          showToast(nextStatus === 'open' ? '투표함이 재개되었습니다.' : '투표가 마감되었습니다.');
                        }}
                      >
                        {votingStatus === 'open' ? '투표 마감' : '투표 개시'}
                      </button>
                    </div>
                  </div>

                  {/* 위젯 4: 실시간 시스템 활동 피드 */}
                  <div className="admin-card" data-serial-id="A00-SEC03-WGT04" style={{ margin: 0 }}>
                    <span className="ui-serial-badge" data-serial-id="A00-SEC03-WGT04" data-item-name="실시간 활동 피드 위젯">A00-SEC03-WGT04</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>⚡</span>
                        <h3 style={{ fontSize: 16, fontWeight: 800 }}>실시간 운영 활동 로그</h3>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>SSE 실시간 수신 중</span>
                    </div>

                    <ul className="activity-feed">
                      <li className="activity-row">
                        <span className="activity-time">11:50</span>
                        <span className="activity-badge" style={{ background: '#E6F8F0', color: '#03B26C' }}>제출</span>
                        <div>
                          <strong>2조 (팀 베타)</strong>가 미션 1 최종 작업물을 제출했습니다.
                        </div>
                      </li>
                      <li className="activity-row">
                        <span className="activity-time">11:48</span>
                        <span className="activity-badge" style={{ background: '#E6F8F0', color: '#03B26C' }}>제출</span>
                        <div>
                          <strong>5조 (팀 엡실론)</strong>이 미션 1 결과물을 등록했습니다.
                        </div>
                      </li>
                      <li className="activity-row">
                        <span className="activity-time">11:45</span>
                        <span className="activity-badge" style={{ background: '#EBF4FF', color: '#3182F6' }}>체크인</span>
                        <div>
                          <strong>정예원</strong> (5조) 참석자가 현장 QR 체크인을 완료했습니다.
                        </div>
                      </li>
                      <li className="activity-row">
                        <span className="activity-time">11:42</span>
                        <span className="activity-badge" style={{ background: '#FEF3C7', color: '#D97706' }}>수정</span>
                        <div>
                          <strong>1조 (팀 알파)</strong>가 작업물을 v2로 재업로드했습니다.
                        </div>
                      </li>
                      <li className="activity-row">
                        <span className="activity-time">11:30</span>
                        <span className="activity-badge" style={{ background: '#F3E8FF', color: '#9333EA' }}>공지</span>
                        <div>
                          '점심 식사 도시락 수령 안내' 푸시가 전체 발송되었습니다.
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= A-02: 워크샵 마스터 ================= */}
          {activeMenu === 'workshop' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>워크샵 마스터 설정</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-outline">초대 링크 복사</button>
                  <button className="btn-primary" onClick={() => showToast('워크샵 정보가 저장되었습니다.')}>변경사항 저장</button>
                </div>
              </div>

              <div className="admin-card" data-serial-id="A02-SEC01-CRD01">
                <span className="ui-serial-badge" data-serial-id="A02-SEC01-CRD01" data-item-name="워크샵 기본 정보 카드">A02-SEC01-CRD01</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>워크샵 공식 명칭</label>
                    <input
                      type="text"
                      value={workshop.title}
                      onChange={(e) => setWorkshop({ ...workshop, title: e.target.value })}
                      style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>주최 및 주관사</label>
                    <input
                      type="text"
                      value={workshop.organizerCompany}
                      onChange={(e) => setWorkshop({ ...workshop, organizerCompany: e.target.value })}
                      style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>장소</label>
                    <input
                      type="text"
                      value={workshop.location}
                      onChange={(e) => setWorkshop({ ...workshop, location: e.target.value })}
                      style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 6 }}>워크샵 입장 코드 / 체크인 코드</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        type="text"
                        readOnly
                        value={`입장: ${workshop.joinCode} / 체크인: ${workshop.checkinCode}`}
                        style={{ flex: 1, height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--admin-border)', background: '#F8F9FA', fontWeight: 700 }}
                      />
                      <button className="btn-outline" onClick={() => showToast('체크인 코드가 새로 갱신되었습니다.')}>재발급</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= A-04: 참석자 & 조 편성 ================= */}
          {activeMenu === 'participants' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800 }}>참석자 명단 및 조 편성 매니저</h2>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)', marginTop: 4 }}>총 20명 등록 / 5개 조 편성 완료</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-outline" onClick={() => setShowCsvModal(true)} data-serial-id="A04-SEC01-BTN01">
                    <span className="ui-serial-badge" data-serial-id="A04-SEC01-BTN01" data-item-name="CSV 일괄 등록 버튼">A04-SEC01-BTN01</span>
                    📄 CSV 일괄 등록
                  </button>
                  <button className="btn-primary" onClick={handleAutoAssignTeams} data-serial-id="A04-SEC01-BTN02">
                    <span className="ui-serial-badge" data-serial-id="A04-SEC01-BTN02" data-item-name="자동 조 편성 버튼">A04-SEC01-BTN02</span>
                    🎲 자동 랜덤 조 편성
                  </button>
                </div>
              </div>

              <div className="admin-card" data-serial-id="A04-SEC02-CRD01">
                <span className="ui-serial-badge" data-serial-id="A04-SEC02-CRD01" data-item-name="참석자 명단 테이블">A04-SEC02-CRD01</span>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>참석자 ID</th>
                      <th>이름</th>
                      <th>소속 기업</th>
                      <th>직무 / 역할</th>
                      <th>전화번호</th>
                      <th>소속 조</th>
                      <th>체크인 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => {
                      const t = mockTeams.find((x) => x.id === p.teamId);
                      return (
                        <tr key={p.id}>
                          <td><code>{p.id}</code></td>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.company}</td>
                          <td>{p.roleTitle || '참석자'}</td>
                          <td>{p.phone}</td>
                          <td><span style={{ fontWeight: 700, color: t?.color }}>{t?.name || '미배정'}</span></td>
                          <td>
                            {p.checkedInAt ? (
                              <span style={{ color: 'var(--admin-success)', fontWeight: 700 }}>출석 완료 ({p.checkedInAt.slice(11, 16)})</span>
                            ) : (
                              <span style={{ color: 'var(--admin-text-muted)' }}>미출석</span>
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
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>아젠다 & 미션 마스터</h2>
                <button className="btn-primary" onClick={() => showToast('신규 미션이 등록되었습니다.')}>+ 새 미션 추가</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {mockMissions.map((m) => (
                  <div key={m.id} className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--admin-primary)' }}>미션 {m.order}</span>
                      <span style={{ fontSize: 11, background: '#F2F4F6', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                        마감: {m.dueAt.slice(11, 16)}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{m.title}</div>
                    <p style={{ fontSize: 13, color: 'var(--admin-text-sub)', marginBottom: 14 }}>{m.description}</p>
                    <div style={{ borderTop: '1px solid #F2F4F6', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>투표 대상: {m.votable ? '예 (조별 투표)' : '아니오'}</span>
                      <button className="btn-outline" style={{ fontSize: 12 }}>미션 수정</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= A-05: 제출 모니터링 ================= */}
          {activeMenu === 'submissions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800 }}>조별 작업물 제출 현황 모니터링</h2>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)', marginTop: 4 }}>실시간 업로드 및 버전 관리 매트릭스</p>
                </div>
                <button className="btn-outline" onClick={() => showToast('최신 상태로 새로고침되었습니다.')}>🔄 새로고침</button>
              </div>

              <div className="admin-card" data-serial-id="A05-SEC01-CRD01">
                <span className="ui-serial-badge" data-serial-id="A05-SEC01-CRD01" data-item-name="제출 매트릭스">A05-SEC01-CRD01</span>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>조 명칭</th>
                      <th>제출 상태</th>
                      <th>작업물 명칭</th>
                      <th>버전</th>
                      <th>제출 시각</th>
                      <th>첨부 파일</th>
                      <th>관리 액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => {
                      const t = mockTeams.find((x) => x.id === s.teamId);
                      return (
                        <tr key={s.id}>
                          <td><strong style={{ color: t?.color }}>{t?.name}</strong></td>
                          <td><span style={{ color: 'var(--admin-success)', fontWeight: 800 }}>제출 완료</span></td>
                          <td>{s.title}</td>
                          <td><code>v{s.version}</code></td>
                          <td>{s.submittedAt.slice(11, 19)}</td>
                          <td>{s.files.length}건 (이미지/문서)</td>
                          <td>
                            <button
                              className="btn-outline"
                              style={{ fontSize: 12, padding: '4px 10px' }}
                              onClick={() => alert(`[${t?.name}] 작업물 상세:\n\n${s.comment}\n\n첨부: ${s.files[0]?.url || '없음'}`)}
                            >
                              미리보기
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= A-06: 투표 및 순위 제어 ================= */}
          {activeMenu === 'voting' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800 }}>투표 운영 및 순위 제어</h2>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)', marginTop: 4 }}>
                    골든 룰 #2: 순위 공개 토글 전까지는 참석자 앱에 실시간 득표수가 블라인드 처리됩니다.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      const next = votingStatus === 'open' ? 'closed' : 'open';
                      setVotingStatus(next);
                      showToast(`투표 상태가 [${next === 'open' ? '개시' : '마감'}]으로 변경되었습니다.`);
                    }}
                    data-serial-id="A06-SEC01-BTN01"
                  >
                    <span className="ui-serial-badge" data-serial-id="A06-SEC01-BTN01" data-item-name="투표 개시 마감 토글">A06-SEC01-BTN01</span>
                    {votingStatus === 'open' ? '투표 마감하기 🔒' : '투표 다시 개시 🔓'}
                  </button>
                  <button
                    className="btn-primary"
                    style={{ background: isRankingPublished ? 'var(--admin-danger)' : 'var(--admin-primary)' }}
                    onClick={handleTogglePublishRanking}
                    data-serial-id="A06-SEC01-BTN02"
                  >
                    <span className="ui-serial-badge" data-serial-id="A06-SEC01-BTN02" data-item-name="순위 전체 공개 토글">A06-SEC01-BTN02</span>
                    {isRankingPublished ? '순위 비공개로 되돌리기' : '순위 전체 공개 승인 (Publish)'}
                  </button>
                </div>
              </div>

              {/* 관리자 전용 실시간 득표 모니터링 카드 */}
              <div className="admin-card" data-serial-id="A06-SEC02-CRD01">
                <span className="ui-serial-badge" data-serial-id="A06-SEC02-CRD01" data-item-name="관리자 실시간 득표수">A06-SEC02-CRD01</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>관리자 전용 실시간 득표 집계표 (미션 1)</div>
                  <span style={{ fontSize: 12, color: 'var(--admin-primary)', fontWeight: 700 }}>
                    {isRankingPublished ? '현재 상태: 참석자에게 순위 공개 중 🟢' : '현재 상태: 참석자에게 블라인드 처리 중 🔒'}
                  </span>
                </div>

                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>조 명칭</th>
                      <th>작업물 제목</th>
                      <th>실시간 득표수</th>
                      <th>득표 비율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculateRanking(submissions).map((item) => {
                      const t = mockTeams.find((x) => x.id === item.teamId);
                      return (
                        <tr key={item.id}>
                          <td><strong>{item.rank}위</strong></td>
                          <td><strong style={{ color: t?.color }}>{t?.name}</strong></td>
                          <td>{item.title}</td>
                          <td><strong style={{ color: 'var(--admin-primary)' }}>{item.voteCount}표</strong></td>
                          <td>{item.percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= A-07: 우승 및 최고작업자 시상 ================= */}
          {activeMenu === 'awards' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>우승팀 & 최고 작업자 시상 발송</h2>
                <button
                  className="btn-primary"
                  style={{ background: '#F59E0B' }}
                  onClick={handleDispatchAwards}
                  data-serial-id="A07-SEC01-BTN01"
                >
                  <span className="ui-serial-badge" data-serial-id="A07-SEC01-BTN01" data-item-name="축하 알림 및 컨페티 발송 버튼">A07-SEC01-BTN01</span>
                  🎉 시상 확정 & 전 참석자 컨페티 알림 전송!
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {/* 우승팀 카드 */}
                <div className="admin-card" data-serial-id="A07-SEC02-CRD01">
                  <span className="ui-serial-badge" data-serial-id="A07-SEC02-CRD01" data-item-name="최다 득표 우승팀 카드">A07-SEC02-CRD01</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#D97706', marginBottom: 6 }}>최다 득표 우승팀 자동 산출</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--admin-text-main)', marginBottom: 8 }}>1조 · 생성형 파이오니어 (14표)</div>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)' }}>온보딩 자율형 에이전트 완결성 및 실제 비즈니스 적용성에서 최고 평가 획득</p>
                </div>

                {/* 최고 작업자 선정 드롭다운 */}
                <div className="admin-card" data-serial-id="A07-SEC03-CRD01">
                  <span className="ui-serial-badge" data-serial-id="A07-SEC03-CRD01" data-item-name="최고 작업자 지정 폼">A07-SEC03-CRD01</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-primary)', marginBottom: 6 }}>명예의 최고 작업자 (Top Worker) 선정</div>
                  <div style={{ marginBottom: 12 }}>
                    <select
                      value={selectedTopWorker}
                      onChange={(e) => setSelectedTopWorker(e.target.value)}
                      style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--admin-border)', padding: '0 10px', fontSize: 14, fontWeight: 700 }}
                    >
                      {participants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.company} / {mockTeams.find((t) => t.id === p.teamId)?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)' }}>
                    선정 사유: 온보딩 에이전트의 완성도 높은 프로토타입 UI 디자인 및 신속한 조별 협업 주도
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= A-08: 공지 발송 ================= */}
          {activeMenu === 'notice' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>실시간 공지 및 푸시 알림 발송</h2>
              </div>

              <div className="admin-card" style={{ maxWidth: 700 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>수신 대상</label>
                  <select
                    value={noticeTarget}
                    onChange={(e) => setNoticeTarget(e.target.value)}
                    style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--admin-border)', padding: '0 10px' }}
                  >
                    <option value="all">전체 참석자 (20명)</option>
                    {mockTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>공지 제목</label>
                  <input
                    type="text"
                    placeholder="예: [안내] 10분 후 투표가 종료됩니다"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14 }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>공지 상세 내용</label>
                  <textarea
                    rows={4}
                    placeholder="공지 내용을 입력하세요"
                    value={noticeBody}
                    onChange={(e) => setNoticeBody(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 14, fontFamily: 'inherit' }}
                  />
                </div>

                <button
                  className="btn-primary"
                  onClick={() => {
                    if (!noticeTitle) return alert('제목을 입력하세요');
                    showToast(`📢 전체 참석자 앱에 푸시 공지가 실시간 발송되었습니다!`);
                    setNoticeTitle('');
                    setNoticeBody('');
                  }}
                  data-serial-id="A08-SEC01-BTN01"
                >
                  <span className="ui-serial-badge" data-serial-id="A08-SEC01-BTN01" data-item-name="공지 발송 버튼">A08-SEC01-BTN01</span>
                  실시간 푸시 발송하기
                </button>
              </div>
            </div>
          )}

          {/* ================= A-09: 결과 리포트 ================= */}
          {activeMenu === 'reports' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>결과 리포트 내보내기</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                <div className="admin-card">
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>출석 및 체크인 리포트</div>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)', marginBottom: 14 }}>참석자별 체크인 일시 및 출석률 집계</p>
                  <button className="btn-outline" onClick={() => handleExportCsv('attendance')}>출석 CSV 다운로드</button>
                </div>

                <div className="admin-card">
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>조별 미션 제출 리포트</div>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)', marginBottom: 14 }}>조별/미션별 최종 작업물 링크 및 제출 이력</p>
                  <button className="btn-outline" onClick={() => handleExportCsv('submissions')}>제출 CSV 다운로드</button>
                </div>

                <div className="admin-card">
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>투표 및 순위 통계 리포트</div>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-sub)', marginBottom: 14 }}>최종 득표수, 득표율, 순위 통계 내역</p>
                  <button className="btn-outline" onClick={() => handleExportCsv('votes')}>투표 CSV 다운로드</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CSV 일괄 등록 모달 */}
      {showCsvModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-card" style={{ width: 500, margin: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>참석자 CSV 파일 일괄 등록</div>
            <div style={{ border: '2px dashed var(--admin-border)', borderRadius: 10, padding: 30, textAlign: 'center', marginBottom: 16, background: '#F8F9FA' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 13, color: 'var(--admin-text-sub)' }}>
                이름, 기업명, 전화번호가 포함된 CSV 파일을 드래그하거나 선택하세요
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-outline" onClick={() => setShowCsvModal(false)}>취소</button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowCsvModal(false);
                  showToast('샘플 CSV(20명)가 성공적으로 등록 및 동기화되었습니다.');
                }}
              >
                업로드 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 결과물 상세 미리보기 모달 */}
      {previewSubmission && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="admin-card" style={{ width: 620, maxHeight: '90vh', overflowY: 'auto', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-primary)' }}>
                  {mockTeams.find((t) => t.id === previewSubmission.teamId)?.name} · 버전 v{previewSubmission.version}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{previewSubmission.title}</h3>
              </div>
              <button
                onClick={() => setPreviewSubmission(null)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--admin-text-sub)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 4 }}>핵심 요약 코멘트</label>
              <div style={{ padding: 12, background: '#F8F9FA', borderRadius: 8, fontSize: 13, lineHeight: 1.6 }}>
                {previewSubmission.comment || '별도 코멘트가 없습니다.'}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: 8 }}>
                첨부 파일 ({previewSubmission.files.length}건)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {previewSubmission.files.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 8, border: '1px solid var(--admin-border)', background: '#fff' }}>
                    <div style={{ width: 60, height: 60, borderRadius: 6, overflow: 'hidden', background: '#F2F4F6', flexShrink: 0 }}>
                      <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · {file.mime}</div>
                    </div>
                    <a href={file.url} target="_blank" rel="noreferrer" className="btn-outline" style={{ fontSize: 11, padding: '4px 8px' }}>
                      크게보기 ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-outline" onClick={() => setPreviewSubmission(null)}>닫기</button>
              <button
                className="btn-primary"
                onClick={() => {
                  showToast(`'${previewSubmission.title}' 정상 승인 확인되었습니다.`);
                  setPreviewSubmission(null);
                }}
              >
                검토 승인 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 관리자 토스트 */}
      {toastMsg && (
        <div id="ui-tagger-toast" className="ui-toast-show">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
