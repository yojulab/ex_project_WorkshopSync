import React, { useState } from 'react';
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

export default function App() {
  const [activeMenu, setActiveMenu] = useState<'workshop' | 'participants' | 'missions' | 'submissions' | 'voting' | 'awards' | 'notice' | 'reports'>('workshop');
  const [workshop, setWorkshop] = useState(mockWorkshop);
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);
  const [submissions, setSubmissions] = useState<Submission[]>(mockSubmissions);
  const [votingStatus, setVotingStatus] = useState<'open' | 'closed'>('open');
  const [isRankingPublished, setIsRankingPublished] = useState(false);
  const [selectedTopWorker, setSelectedTopWorker] = useState(mockParticipants[1].id); // 이수진
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
            <div style={{ fontSize: 11, color: '#6B7280' }}>관리자 웹 포털 :30017</div>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'workshop' ? 'active' : ''}`}
              onClick={() => setActiveMenu('workshop')}
              data-serial-id="A02-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A02-SEC01-NAV01" data-item-name="워크샵 마스터 메뉴">A02-SEC01-NAV01</span>
              <span>🏢</span> 워크샵 마스터 (A-02)
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveMenu('participants')}
              data-serial-id="A04-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A04-SEC01-NAV01" data-item-name="참석자 및 조 관리 메뉴">A04-SEC01-NAV01</span>
              <span>👥</span> 참석자 & 조 편성 (A-04)
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'missions' ? 'active' : ''}`}
              onClick={() => setActiveMenu('missions')}
              data-serial-id="A03-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A03-SEC01-NAV01" data-item-name="아젠다 및 미션 관리 메뉴">A03-SEC01-NAV01</span>
              <span>📅</span> 아젠다 & 미션 (A-03)
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveMenu('submissions')}
              data-serial-id="A05-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A05-SEC01-NAV01" data-item-name="제출 현황 모니터링 메뉴">A05-SEC01-NAV01</span>
              <span>📊</span> 제출 모니터링 (A-05)
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'voting' ? 'active' : ''}`}
              onClick={() => setActiveMenu('voting')}
              data-serial-id="A06-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A06-SEC01-NAV01" data-item-name="투표 및 순위 제어 메뉴">A06-SEC01-NAV01</span>
              <span>🗳️</span> 투표 & 순위 제어 (A-06)
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'awards' ? 'active' : ''}`}
              onClick={() => setActiveMenu('awards')}
              data-serial-id="A07-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A07-SEC01-NAV01" data-item-name="우승 시상 관리 메뉴">A07-SEC01-NAV01</span>
              <span>🏆</span> 우승 & 시상 발송 (A-07)
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'notice' ? 'active' : ''}`}
              onClick={() => setActiveMenu('notice')}
              data-serial-id="A08-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A08-SEC01-NAV01" data-item-name="공지 및 푸시 발송 메뉴">A08-SEC01-NAV01</span>
              <span>📢</span> 공지 & 푸시 발송 (A-08)
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeMenu === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveMenu('reports')}
              data-serial-id="A09-SEC01-NAV01"
            >
              <span className="ui-serial-badge" data-serial-id="A09-SEC01-NAV01" data-item-name="결과 리포트 내보내기 메뉴">A09-SEC01-NAV01</span>
              <span>📁</span> 결과 리포트 (A-09)
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
          {/* ================= A-02: 워크샵 마스터 ================= */}
          {activeMenu === 'workshop' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>워크샵 마스터 설정 (A-02)</h2>
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
                  <h2 style={{ fontSize: 22, fontWeight: 800 }}>참석자 명단 및 조 편성 매니저 (A-04)</h2>
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
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>아젠다 & 미션 마스터 (A-03)</h2>
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
                  <h2 style={{ fontSize: 22, fontWeight: 800 }}>조별 작업물 제출 현황 모니터링 (A-05)</h2>
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
                  <h2 style={{ fontSize: 22, fontWeight: 800 }}>투표 운영 및 순위 제어 (A-06)</h2>
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
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>우승팀 & 최고 작업자 시상 발송 (A-07)</h2>
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
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>실시간 공지 및 푸시 알림 발송 (A-08)</h2>
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
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>결과 리포트 내보내기 (A-09)</h2>
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

      {/* 관리자 토스트 */}
      {toastMsg && (
        <div id="ui-tagger-toast" className="ui-toast-show">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
