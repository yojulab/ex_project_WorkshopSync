import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
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
  calculateRanking,
  Participant,
  Submission,
  Feedback
} from '@workshopsync/shared';

export default function App() {
  // 인증 및 기본 참석자 상태 (초기 로그인: 김민우 / 1조)
  const [currentUser, setCurrentUser] = useState<Participant | null>(mockParticipants[0]);
  const [activeTab, setActiveTab] = useState<'home' | 'mission' | 'gallery' | 'vote' | 'noti'>('home');
  const [currentView, setCurrentView] = useState<'main' | 'login' | 'checkin' | 'info' | 'agenda' | 'upload' | 'dashboard' | 'celebrate'>('main');

  // 작업물, 피드백, 투표, 알림 등 상태
  const [submissions, setSubmissions] = useState<Submission[]>(mockSubmissions);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(mockFeedbacks);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [myVote, setMyVote] = useState<string | null>(null); // submissionId
  const [isRankingPublished, setIsRankingPublished] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 업로드 폼 상태
  const [uploadTitle, setUploadTitle] = useState('1조 · 생성형 AI 온보딩 자동화 설계서 (수정본)');
  const [uploadComment, setUploadComment] = useState('사전 심사 로직을 개선하여 처리 시간을 3분에서 2분으로 단축했습니다.');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // 피드백 입력
  const [feedbackInput, setFeedbackInput] = useState('');
  const [selectedSubmissionForFeedback, setSelectedSubmissionForFeedback] = useState<Submission | null>(null);

  // 투표 확인 바텀시트
  const [voteTargetSubmission, setVoteTargetSubmission] = useState<Submission | null>(null);

  // 체크인 입력
  const [checkinInput, setCheckinInput] = useState('');
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const myTeam = mockTeams.find((t) => t.id === currentUser?.teamId);

  // 축하 컨페티 실행 함수
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 300);
  };

  // 체크인 처리
  const handleCheckin = (codeToUse?: string) => {
    const code = codeToUse || checkinInput;
    if (code !== mockWorkshop.checkinCode) {
      alert('체크인 코드가 올바르지 않습니다. (현장 코드: CHECK777)');
      return;
    }
    setCheckinSuccess(true);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        checkedInAt: currentUser.checkedInAt || new Date().toISOString()
      });
    }
    triggerConfetti();
    showToast('🎉 참석 체크인이 완료되었습니다!');
    setTimeout(() => {
      setCheckinSuccess(false);
      setCurrentView('main');
    }, 1800);
  };

  // 투표 실행 (골든 룰 #1: 자기 조 투표 금지)
  const handleExecuteVote = () => {
    if (!voteTargetSubmission || !currentUser) return;

    if (voteTargetSubmission.teamId === currentUser.teamId) {
      alert('🚨 [골든 룰 위반] 자신이 속한 조에는 투표할 수 없습니다!');
      setVoteTargetSubmission(null);
      return;
    }

    setMyVote(voteTargetSubmission.id);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === voteTargetSubmission.id ? { ...s, voteCount: (s.voteCount || 0) + 1 } : s))
    );
    setVoteTargetSubmission(null);
    triggerConfetti();
    showToast(`🗳️ '${voteTargetSubmission.title}'에 1표를 행사했습니다!`);
  };

  // 작업물 업로드 완료
  const handleUploadSubmit = () => {
    setIsUploading(true);
    setUploadProgress(20);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // 새 제출물 갱신
          setSubmissions((prev) =>
            prev.map((s) =>
              s.teamId === currentUser?.teamId
                ? {
                    ...s,
                    title: uploadTitle,
                    comment: uploadComment,
                    version: s.version + 1,
                    submittedAt: new Date().toISOString()
                  }
                : s
            )
          );
          triggerConfetti();
          showToast('🚀 조별 작업물이 성공적으로 제출되었습니다!');
          setCurrentView('main');
          setActiveTab('mission');
          return 100;
        }
        return p + 25;
      });
    }, 150);
  };

  // 피드백 등록
  const handleAddFeedback = (subId: string) => {
    if (!feedbackInput.trim() || !currentUser) return;
    const newFb: Feedback = {
      id: `fb-${Date.now()}`,
      workshopId: mockWorkshop.id,
      submissionId: subId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorTeamName: myTeam?.name || '참석자',
      content: feedbackInput.trim(),
      createdAt: new Date().toISOString()
    };
    setFeedbacks([newFb, ...feedbacks]);
    setFeedbackInput('');
    showToast('💬 피드백 메모가 등록되었습니다.');
  };

  // 1. [S-01] 입장 / 로그인 화면
  if (currentView === 'login' || !currentUser) {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>⚡</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)', letterSpacing: -0.6 }}>WorkshopSync</h1>
          <p style={{ fontSize: 15, color: 'var(--text-sub)', marginTop: 6 }}>2026 하반기 AI 에이전트 서비스 혁신 워크샵</p>
        </div>

        <div className="toss-card" data-serial-id="S01-SEC01-CRD01" style={{ padding: 24 }}>
          <span className="ui-serial-badge" data-serial-id="S01-SEC01-CRD01" data-item-name="입장 인증 카드">S01-SEC01-CRD01</span>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', display: 'block', marginBottom: 6 }}>워크샵 코드</label>
            <input
              type="text"
              defaultValue="WS2026"
              style={{ width: '100%', height: 48, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 16, fontWeight: 600 }}
              data-serial-id="S01-SEC01-INP01"
            />
            <span className="ui-serial-badge" data-serial-id="S01-SEC01-INP01" data-item-name="워크샵 코드 입력창">S01-SEC01-INP01</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', display: 'block', marginBottom: 6 }}>이름</label>
            <input
              type="text"
              defaultValue="김민우"
              style={{ width: '100%', height: 48, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 16 }}
              data-serial-id="S01-SEC01-INP02"
            />
            <span className="ui-serial-badge" data-serial-id="S01-SEC01-INP02" data-item-name="이름 입력창">S01-SEC01-INP02</span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', display: 'block', marginBottom: 6 }}>전화번호 (사전 등록 정보)</label>
            <input
              type="text"
              defaultValue="010-3849-2910"
              style={{ width: '100%', height: 48, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 16 }}
              data-serial-id="S01-SEC01-INP03"
            />
            <span className="ui-serial-badge" data-serial-id="S01-SEC01-INP03" data-item-name="전화번호 입력창">S01-SEC01-INP03</span>
          </div>

          <button
            className="btn-cta"
            onClick={() => {
              setCurrentUser(mockParticipants[0]);
              setCurrentView('main');
              showToast('👋 김민우님, 반갑습니다!');
            }}
            data-serial-id="S01-SEC02-BTN01"
          >
            <span className="ui-serial-badge" data-serial-id="S01-SEC02-BTN01" data-item-name="워크샵 입장하기 버튼">S01-SEC02-BTN01</span>
            워크샵 입장하기
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>💡 별도 회원가입 없이 사전 등록 명단으로 바로 입장합니다.</p>
        </div>
      </div>
    );
  }

  // 2. [S-02] 참석 체크인 화면
  if (currentView === 'checkin') {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setCurrentView('main')} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>←</button>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>현장 참석 체크인</h2>
        </div>

        {checkinSuccess ? (
          <div className="toss-card" style={{ textAlign: 'center', padding: '48px 20px', marginTop: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>체크인 완료!</h3>
            <p style={{ fontSize: 15, color: 'var(--text-sub)', marginTop: 8 }}>
              {currentUser.name}님, 1조(테이블 1번) 착석을 환영합니다.
            </p>
          </div>
        ) : (
          <div className="toss-card" data-serial-id="S02-SEC01-CRD01" style={{ padding: 24 }}>
            <span className="ui-serial-badge" data-serial-id="S02-SEC01-CRD01" data-item-name="체크인 입력 카드">S02-SEC01-CRD01</span>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 140, height: 140, margin: '0 auto 16px', background: '#F2F4F6', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, border: '2px dashed #CBD5E1' }}>
                📷
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>현장 스크린의 QR코드를 카메라로 스캔하거나<br />체크인 코드 8자리를 입력해 주세요.</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', display: 'block', marginBottom: 6 }}>체크인 코드</label>
              <input
                type="text"
                placeholder="예: CHECK777"
                value={checkinInput}
                onChange={(e) => setCheckinInput(e.target.value.toUpperCase())}
                style={{ width: '100%', height: 48, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 16, fontWeight: 700, textAlign: 'center', letterSpacing: 2 }}
                data-serial-id="S02-SEC01-INP01"
              />
              <span className="ui-serial-badge" data-serial-id="S02-SEC01-INP01" data-item-name="체크인 코드 입력창">S02-SEC01-INP01</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setCheckinInput('CHECK777')}
                style={{ flex: 1, height: 38, background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                테스트 코드 (CHECK777) 채우기
              </button>
            </div>

            <button
              className="btn-cta"
              onClick={() => handleCheckin()}
              data-serial-id="S02-SEC02-BTN01"
            >
              <span className="ui-serial-badge" data-serial-id="S02-SEC02-BTN01" data-item-name="체크인 확인 CTA 버튼">S02-SEC02-BTN01</span>
              체크인 완료하기
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. [S-04] 워크샵 상세 정보 화면
  if (currentView === 'info') {
    return (
      <div className="main-content" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setCurrentView('main')} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>←</button>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>워크샵 정보 및 조 편성</h2>
        </div>

        <div className="toss-card" data-serial-id="S04-SEC01-CRD01">
          <span className="ui-serial-badge" data-serial-id="S04-SEC01-CRD01" data-item-name="워크샵 상세 정보 카드">S04-SEC01-CRD01</span>
          <div className="card-label">일시 및 장소</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📅 2026. 10. 15 (목) 09:30 ~ 18:00</div>
          <div style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 8 }}>📍 {mockWorkshop.location}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', background: '#F8F9FA', padding: 10, borderRadius: 10 }}>{mockWorkshop.locationDetail}</div>
        </div>

        <div className="toss-card" data-serial-id="S04-SEC02-CRD01">
          <span className="ui-serial-badge" data-serial-id="S04-SEC02-CRD01" data-item-name="조 편성 명단">S04-SEC02-CRD01</span>
          <div className="card-label">조 편성 안내 (총 5개 조 / 20명)</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mockTeams.map((team) => {
              const members = mockParticipants.filter((p) => p.teamId === team.id);
              const isMyTeam = team.id === currentUser.teamId;
              return (
                <div key={team.id} style={{ border: isMyTeam ? '2px solid var(--primary)' : '1px solid var(--border-color)', borderRadius: 14, padding: 14, background: isMyTeam ? '#F0F6FF' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: team.color }}>{team.name}</div>
                    {isMyTeam && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: '#fff', padding: '2px 8px', borderRadius: 8, border: '1px solid var(--primary)' }}>내 소속 조</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {members.map((m) => (
                      <span key={m.id} style={{ fontSize: 12, background: isMyTeam ? '#fff' : '#F2F4F6', padding: '4px 8px', borderRadius: 6, color: 'var(--text-main)' }}>
                        {m.name} ({m.company})
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 4. [S-05] 아젠다 타임라인 화면
  if (currentView === 'agenda') {
    return (
      <div className="main-content" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setCurrentView('main')} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>←</button>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>아젠다 타임라인</h2>
        </div>

        <div className="toss-card" data-serial-id="S05-SEC01-CRD01">
          <span className="ui-serial-badge" data-serial-id="S05-SEC01-CRD01" data-item-name="타임라인 리스트">S05-SEC01-CRD01</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {mockAgendas.map((item, index) => {
              const isCurrent = index === 2; // 현재 진행 세션
              return (
                <div key={item.id} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: isCurrent ? 'var(--primary)' : '#CBD5E1', border: isCurrent ? '3px solid #EBF4FF' : 'none', marginTop: 4 }}></div>
                    {index < mockAgendas.length - 1 && <div style={{ width: 2, flex: 1, background: '#E2E8F0', marginTop: 4 }}></div>}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? 'var(--primary)' : 'var(--text-muted)' }}>{item.startAt} - {item.endAt}</span>
                      {isCurrent && <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: 'var(--primary)', padding: '2px 6px', borderRadius: 8 }}>진행 중 🔥</span>}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{item.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 5. [S-07] 작업물 업로드 화면
  if (currentView === 'upload') {
    return (
      <div className="main-content" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setCurrentView('main')} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>←</button>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>작업물 업로드 (1조)</h2>
        </div>

        <div className="toss-card" data-serial-id="S07-SEC01-CRD01">
          <span className="ui-serial-badge" data-serial-id="S07-SEC01-CRD01" data-item-name="작업물 입력 카드">S07-SEC01-CRD01</span>
          <div className="card-label">미션 1 · 고객 온보딩 자율형 AI 에이전트 설계안</div>

          <div style={{ marginBottom: 16, marginTop: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', display: 'block', marginBottom: 6 }}>작업물 제목</label>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              style={{ width: '100%', height: 46, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 15, fontWeight: 600 }}
              data-serial-id="S07-SEC01-INP01"
            />
            <span className="ui-serial-badge" data-serial-id="S07-SEC01-INP01" data-item-name="작업물 제목 입력">S07-SEC01-INP01</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', display: 'block', marginBottom: 6 }}>핵심 요약 코멘트</label>
            <textarea
              rows={3}
              value={uploadComment}
              onChange={(e) => setUploadComment(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14, fontFamily: 'inherit' }}
              data-serial-id="S07-SEC01-INP02"
            />
            <span className="ui-serial-badge" data-serial-id="S07-SEC01-INP02" data-item-name="코멘트 입력창">S07-SEC01-INP02</span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', display: 'block', marginBottom: 6 }}>첨부 파일 (이미지 2건 등록됨)</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 80, height: 80, borderRadius: 12, background: '#F2F4F6', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img src={mockSubmissions[0].files[0].url} alt="img1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ width: 80, height: 80, borderRadius: 12, background: '#F2F4F6', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img src={mockSubmissions[0].files[1].url} alt="img2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ width: 80, height: 80, borderRadius: 12, border: '2px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>➕</span>
                <span>추가</span>
              </div>
            </div>
          </div>

          {isUploading && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <span>업로드 중...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s' }}></div>
              </div>
            </div>
          )}

          <button
            className="btn-cta"
            disabled={isUploading}
            onClick={handleUploadSubmit}
            data-serial-id="S07-SEC02-BTN01"
          >
            <span className="ui-serial-badge" data-serial-id="S07-SEC02-BTN01" data-item-name="최종 제출하기 CTA">S07-SEC02-BTN01</span>
            {isUploading ? '업로드 진행 중...' : '최종 작업물 제출하기 (v2)'}
          </button>
        </div>
      </div>
    );
  }

  // 6. [S-12] 우승 축하 화면
  if (currentView === 'celebrate') {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 20, textAlign: 'center', background: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button onClick={() => setCurrentView('main')} style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>닫기 ✕</button>
        </div>

        <div style={{ fontSize: 64, marginTop: 16, marginBottom: 10 }}>🏆</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)', letterSpacing: -0.6 }}>축하합니다!</h2>
        <p style={{ fontSize: 15, color: 'var(--text-sub)', marginTop: 4 }}>2026 하반기 AI 에이전트 혁신 워크샵 영예의 우승</p>

        <div className="toss-card" data-serial-id="S12-SEC01-CRD01" style={{ marginTop: 24, textAlign: 'center', padding: 24, border: '2px solid #F59E0B' }}>
          <span className="ui-serial-badge" data-serial-id="S12-SEC01-CRD01" data-item-name="우승팀 축하 카드">S12-SEC01-CRD01</span>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#D97706', background: '#FEF3C7', display: 'inline-block', padding: '4px 10px', borderRadius: 12, marginBottom: 10 }}>최다 득표 우승팀 (1위)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>{mockAwards[0].teamName}</div>
          <div style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.6 }}>"{mockAwards[0].reason}"</div>
        </div>

        <div className="toss-card" data-serial-id="S12-SEC02-CRD01" style={{ textAlign: 'center', padding: 20 }}>
          <span className="ui-serial-badge" data-serial-id="S12-SEC02-CRD01" data-item-name="최고 작업자 카드">S12-SEC02-CRD01</span>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', display: 'inline-block', padding: '4px 10px', borderRadius: 12, marginBottom: 8 }}>명예의 최고 작업자 (Top Worker)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>{mockAwards[1].participantName}</div>
          <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{mockAwards[1].reason}</div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            className="btn-cta"
            onClick={triggerConfetti}
            data-serial-id="S12-SEC03-BTN01"
          >
            <span className="ui-serial-badge" data-serial-id="S12-SEC03-BTN01" data-item-name="꽃가루 다시 날리기">S12-SEC03-BTN01</span>
            🎉 꽃가루 한 번 더 터뜨리기!
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // [메인 5대 탭 뷰 영역]
  // ==========================================
  return (
    <>
      {/* 상단 헤더 */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span className="header-title">WorkshopSync</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="header-badge">{myTeam?.name || '참석자'}</span>
          <button
            onClick={() => setCurrentView('login')}
            style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 탭 콘텐츠 */}
      <main className="main-content">
        {/* ---------------- 탭 1: [홈 (S-03)] ---------------- */}
        {activeTab === 'home' && (
          <div>
            {/* 체크인 안내 배너 */}
            <div
              className="toss-card"
              data-serial-id="S03-SEC01-CRD01"
              style={{ background: 'linear-gradient(135deg, #3182F6 0%, #1B64DA 100%)', color: '#fff', padding: 22 }}
            >
              <span className="ui-serial-badge" data-serial-id="S03-SEC01-CRD01" data-item-name="환영 및 체크인 상태 카드">S03-SEC01-CRD01</span>
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.9, marginBottom: 4 }}>
                {currentUser?.name}님 ({currentUser?.company})
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
                {currentUser?.checkedInAt ? '현장 체크인 완료 ✅' : '아직 체크인 전입니다 ⚠️'}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {!currentUser?.checkedInAt && (
                  <button
                    onClick={() => setCurrentView('checkin')}
                    style={{ background: '#fff', color: 'var(--primary)', border: 'none', padding: '8px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    현장 체크인하기 →
                  </button>
                )}
                <button
                  onClick={() => setCurrentView('info')}
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                >
                  조 편성 & 정보
                </button>
              </div>
            </div>

            {/* 현재 진행 아젠다 강조 배너 */}
            <div className="toss-card" data-serial-id="S03-SEC02-CRD01" onClick={() => setCurrentView('agenda')} style={{ cursor: 'pointer' }}>
              <span className="ui-serial-badge" data-serial-id="S03-SEC02-CRD01" data-item-name="현재 아젠다 하이라이트">S03-SEC02-CRD01</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="card-label">현재 진행 세션</span>
                <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>전체 보기 →</span>
              </div>
              <div className="card-title" style={{ fontSize: 18 }}>[미션 1] 조별 비즈니스 문제 정의 및 설계안</div>
              <div className="card-desc">11:00 ~ 13:00 (각 조 전담 퍼실리테이터 코칭 진행 중)</div>
            </div>

            {/* 내 미션 현황 카드 */}
            <div className="toss-card" data-serial-id="S03-SEC03-CRD01">
              <span className="ui-serial-badge" data-serial-id="S03-SEC03-CRD01" data-item-name="내 미션 현황 카드">S03-SEC03-CRD01</span>
              <div className="card-label">우리 조 미션 현황</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>미션 1: 온보딩 에이전트 기획안</div>
                  <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 700, marginTop: 2 }}>● 최종 제출 완료 (v2)</div>
                </div>
                <button
                  onClick={() => setCurrentView('upload')}
                  style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  수정/재제출
                </button>
              </div>
            </div>

            {/* 최근 긴급 공지 */}
            <div className="toss-card" data-serial-id="S03-SEC04-CRD01">
              <span className="ui-serial-badge" data-serial-id="S03-SEC04-CRD01" data-item-name="최근 공지 카드">S03-SEC04-CRD01</span>
              <div className="card-label">운영국 공지</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginTop: 4 }}>
                {mockWorkshop.notice}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- 탭 2: [미션 (S-06, S-08)] ---------------- */}
        {activeTab === 'mission' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>워크샵 미션 목록</h2>
              <button
                onClick={() => setCurrentView('upload')}
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                + 작업물 업로드
              </button>
            </div>

            {mockMissions.map((m) => {
              const isDue = m.id === 'm-1'; // 미션 1은 마감됨
              return (
                <div key={m.id} className="toss-card" data-serial-id={`S06-SEC01-CRD0${m.order}`}>
                  <span className="ui-serial-badge" data-serial-id={`S06-SEC01-CRD0${m.order}`} data-item-name={`미션 ${m.order} 카드`}>
                    {`S06-SEC01-CRD0${m.order}`}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: isDue ? '#64748B' : 'var(--primary)' }}>
                      {isDue ? '마감 완료' : '진행 중'}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, background: isDue ? '#F1F5F9' : '#FEF3C7', color: isDue ? '#64748B' : '#B45309', padding: '3px 8px', borderRadius: 8 }}>
                      {isDue ? '제출 마감' : 'D-Day 마감 16:30'}
                    </span>
                  </div>
                  <div className="card-title" style={{ fontSize: 17 }}>{m.title}</div>
                  <div className="card-desc" style={{ marginBottom: 12 }}>{m.description}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F2F4F6', paddingTop: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>제출 형식: {m.submitTypes.join(', ')}</span>
                    <button
                      onClick={() => setCurrentView('upload')}
                      style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      제출물 보기
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 전체 조 제출 현황 대시보드 요약 (S-08) */}
            <div className="toss-card" data-serial-id="S08-SEC01-CRD01">
              <span className="ui-serial-badge" data-serial-id="S08-SEC01-CRD01" data-item-name="제출 현황 대시보드">S08-SEC01-CRD01</span>
              <div className="card-label">실시간 조별 제출 진행률 (미션 1)</div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mockTeams.map((t) => (
                  <div key={t.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                      <span>{t.name}</span>
                      <span style={{ color: 'var(--success)' }}>100% (제출 완료)</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: '#F2F4F6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%', background: t.color }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- 탭 3: [결과물 같이보기 (S-09)] ---------------- */}
        {activeTab === 'gallery' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>결과물 같이보기 & 피드백</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {submissions.map((sub, idx) => {
                const subTeam = mockTeams.find((t) => t.id === sub.teamId);
                const subFeedbacks = feedbacks.filter((f) => f.submissionId === sub.id);
                return (
                  <div key={sub.id} className="toss-card" data-serial-id={`S09-SEC01-CRD0${idx + 1}`}>
                    <span className="ui-serial-badge" data-serial-id={`S09-SEC01-CRD0${idx + 1}`} data-item-name={`${subTeam?.name} 결과물 카드`}>
                      {`S09-SEC01-CRD0${idx + 1}`}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: subTeam?.color }}></span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: subTeam?.color }}>{subTeam?.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>v{sub.version}</span>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>{sub.title}</div>
                    <p style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 12 }}>{sub.comment}</p>

                    {sub.files.length > 0 && (
                      <div style={{ width: '100%', height: 180, borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
                        <img src={sub.files[0].url} alt={sub.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    {/* 카카오톡식 가벼운 피드백 댓글 영역 */}
                    <div style={{ background: '#F8F9FA', borderRadius: 12, padding: 12, marginTop: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 8 }}>
                        💬 참석자 피드백 메모 ({subFeedbacks.length}건)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                        {subFeedbacks.map((fb) => (
                          <div key={fb.id} style={{ fontSize: 12, color: 'var(--text-main)', background: '#fff', padding: '6px 10px', borderRadius: 8, border: '1px solid #ECEFF2' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{fb.authorName}: </span>
                            {fb.content}
                          </div>
                        ))}
                      </div>

                      {/* 1줄 입력창 */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text"
                          placeholder="가벼운 응원/피드백 메모를 남겨보세요"
                          value={selectedSubmissionForFeedback?.id === sub.id ? feedbackInput : ''}
                          onFocus={() => setSelectedSubmissionForFeedback(sub)}
                          onChange={(e) => {
                            setSelectedSubmissionForFeedback(sub);
                            setFeedbackInput(e.target.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddFeedback(sub.id);
                          }}
                          style={{ flex: 1, height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 12 }}
                          data-serial-id={`S09-SEC02-INP0${idx + 1}`}
                        />
                        <button
                          onClick={() => handleAddFeedback(sub.id)}
                          style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          전송
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- 탭 4: [선호도 투표 / 순위 (S-10, S-11)] ---------------- */}
        {activeTab === 'vote' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>선호도 투표 & 순위</h2>
              {/* 관리자 모의 순위 공개 토글 버튼 */}
              <button
                onClick={() => {
                  setIsRankingPublished(!isRankingPublished);
                  showToast(isRankingPublished ? '🔒 순위가 비공개(집계 중)로 전환되었습니다.' : '🔓 관리자에 의해 최종 순위가 공개되었습니다!');
                }}
                style={{ fontSize: 11, fontWeight: 700, background: isRankingPublished ? '#FEECEE' : 'var(--primary-light)', color: isRankingPublished ? 'var(--danger)' : 'var(--primary)', border: 'none', padding: '5px 10px', borderRadius: 8, cursor: 'pointer' }}
              >
                {isRankingPublished ? '관리자: 순위 가리기' : '관리자: 순위 공개 토글'}
              </button>
            </div>

            {/* 골든 룰 #1: 자기 조 투표 불가 안내 배너 */}
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 16px', borderRadius: 14, marginBottom: 16, fontSize: 13, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🛡️</span>
              <div>
                <strong>공정성 골든 룰 적용:</strong> 자신이 속한 <strong>'{myTeam?.name}'</strong>에는 투표할 수 없으며 타 조에 1표를 행사할 수 있습니다.
              </div>
            </div>

            {/* 순위 공개 상태 (S-11) */}
            {isRankingPublished ? (
              <div className="toss-card" data-serial-id="S11-SEC01-CRD01" style={{ border: '2px solid #F59E0B' }}>
                <span className="ui-serial-badge" data-serial-id="S11-SEC01-CRD01" data-item-name="최종 순위표">S11-SEC01-CRD01</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div className="card-label" style={{ color: '#D97706' }}>🏆 최종 집계 결과 (순위 공개됨)</div>
                  <button
                    onClick={() => setCurrentView('celebrate')}
                    style={{ background: '#F59E0B', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    축하 화면 보기 🎉
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {calculateRanking(submissions).map((rankItem) => {
                    const rTeam = mockTeams.find((t) => t.id === rankItem.teamId);
                    const is1st = rankItem.rank === 1;
                    return (
                      <div
                        key={rankItem.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: 12,
                          background: is1st ? '#FEF3C7' : '#F8F9FA',
                          border: is1st ? '1px solid #FCD34D' : '1px solid #ECEFF2'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: is1st ? '#D97706' : 'var(--text-muted)' }}>
                            {is1st ? '👑 1위' : `${rankItem.rank}위`}
                          </span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{rTeam?.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{rankItem.title}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: is1st ? '#D97706' : 'var(--primary)' }}>
                            {rankItem.voteCount}표
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>({rankItem.percentage}%)</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* 순위 공개 전 블라인드 집계 중 상태 (S-11 블라인드) */
              <div className="toss-card" style={{ textAlign: 'center', padding: '24px 16px', background: '#F8F9FA' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>실시간 득표수는 블라인드 처리 중입니다</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  운영자가 모든 투표 마감 후 순위를 공개하면 이곳에 전체 랭킹이 오픈됩니다.
                </div>
              </div>
            )}

            {/* 투표 후보 목록 (S-10) */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>투표 후보 조 목록</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {submissions.map((sub, idx) => {
                  const sTeam = mockTeams.find((t) => t.id === sub.teamId);
                  const isMyTeam = sub.teamId === currentUser?.teamId;
                  const isVotedByMe = myVote === sub.id;

                  return (
                    <div
                      key={sub.id}
                      className="toss-card"
                      data-serial-id={`S10-SEC01-CRD0${idx + 1}`}
                      style={{
                        opacity: isMyTeam ? 0.6 : 1,
                        border: isVotedByMe ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: isVotedByMe ? '#F0F6FF' : '#fff'
                      }}
                    >
                      <span className="ui-serial-badge" data-serial-id={`S10-SEC01-CRD0${idx + 1}`} data-item-name={`${sTeam?.name} 투표 카드`}>
                        {`S10-SEC01-CRD0${idx + 1}`}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: sTeam?.color }}>{sTeam?.name}</span>
                        {isMyTeam && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', background: 'var(--danger-light)', padding: '2px 8px', borderRadius: 8 }}>
                            우리 조 투표 불가 🚫
                          </span>
                        )}
                        {isVotedByMe && (
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 8 }}>
                            내가 투표함 ✓
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{sub.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 12 }}>{sub.comment}</div>

                      <button
                        disabled={isMyTeam}
                        onClick={() => setVoteTargetSubmission(sub)}
                        style={{
                          width: '100%',
                          height: 42,
                          background: isMyTeam ? '#E5E7EB' : isVotedByMe ? 'var(--primary)' : 'var(--primary-light)',
                          color: isMyTeam ? '#9CA3AF' : isVotedByMe ? '#fff' : 'var(--primary)',
                          border: 'none',
                          borderRadius: 12,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: isMyTeam ? 'not-allowed' : 'pointer'
                        }}
                        data-serial-id={`S10-SEC02-BTN0${idx + 1}`}
                      >
                        <span className="ui-serial-badge" data-serial-id={`S10-SEC02-BTN0${idx + 1}`} data-item-name={`${sTeam?.name} 투표 버튼`}>
                          {`S10-SEC02-BTN0${idx + 1}`}
                        </span>
                        {isMyTeam ? '우리 조에는 투표할 수 없습니다' : isVotedByMe ? '이 조에 투표 완료 (변경 가능)' : '이 조에 1표 투표하기'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- 탭 5: [알림함 (S-13)] ---------------- */}
        {activeTab === 'noti' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>알림함</h2>
              <button
                onClick={() => {
                  setNotifications(notifications.map((n) => ({ ...n, read: true })));
                  showToast('모든 알림을 읽음 처리했습니다.');
                }}
                style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                모두 읽음
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notifications.map((item, idx) => (
                <div
                  key={item.id}
                  className="toss-card"
                  data-serial-id={`S13-SEC01-CRD0${idx + 1}`}
                  style={{
                    padding: 16,
                    background: item.read ? '#fff' : '#F0F6FF',
                    border: item.read ? '1px solid var(--border-color)' : '1px solid #BFDBFE'
                  }}
                >
                  <span className="ui-serial-badge" data-serial-id={`S13-SEC01-CRD0${idx + 1}`} data-item-name="알림 아이템">
                    {`S13-SEC01-CRD0${idx + 1}`}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{item.title}</span>
                    {!item.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }}></span>}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 하단 고정 투표 확인 바텀시트 모달 */}
      {voteTargetSubmission && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="toss-card" data-serial-id="S10-SEC03-MOD01" style={{ width: '100%', maxWidth: 480, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 24, margin: 0 }}>
            <span className="ui-serial-badge" data-serial-id="S10-SEC03-MOD01" data-item-name="투표 확인 바텀시트">S10-SEC03-MOD01</span>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>선호도 투표 확인</div>
            <div style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 20 }}>
              <strong>'{voteTargetSubmission.title}'</strong>에 소중한 1표를 행사하시겠습니까? (투표 마감 전까지 변경 가능합니다)
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setVoteTargetSubmission(null)}
                style={{ flex: 1, height: 48, background: '#F2F4F6', color: 'var(--text-main)', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleExecuteVote}
                style={{ flex: 2, height: 48, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                data-serial-id="S10-SEC03-BTN01"
              >
                <span className="ui-serial-badge" data-serial-id="S10-SEC03-BTN01" data-item-name="투표 확정 버튼">S10-SEC03-BTN01</span>
                투표하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카카오톡식 5대 하단 탭 바 (홈, 미션, 결과물, 투표/순위, 알림) */}
      <nav className="bottom-tab-bar" data-serial-id="SXX-SEC07-TABBAR">
        <span className="ui-serial-badge" data-serial-id="SXX-SEC07-TABBAR" data-item-name="카카오톡식 5대 하단 탭">SXX-SEC07-TABBAR</span>
        <button
          className={`tab-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => { setActiveTab('home'); setCurrentView('main'); }}
          data-serial-id="SXX-SEC07-TAB01"
        >
          <span className="ui-serial-badge" data-serial-id="SXX-SEC07-TAB01" data-item-name="홈 탭">SXX-SEC07-TAB01</span>
          <span className="tab-icon">🏠</span>
          <span>홈</span>
        </button>

        <button
          className={`tab-item ${activeTab === 'mission' ? 'active' : ''}`}
          onClick={() => { setActiveTab('mission'); setCurrentView('main'); }}
          data-serial-id="SXX-SEC07-TAB02"
        >
          <span className="ui-serial-badge" data-serial-id="SXX-SEC07-TAB02" data-item-name="미션 탭">SXX-SEC07-TAB02</span>
          <span className="tab-icon">🎯</span>
          <span>미션</span>
        </button>

        <button
          className={`tab-item ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => { setActiveTab('gallery'); setCurrentView('main'); }}
          data-serial-id="SXX-SEC07-TAB03"
        >
          <span className="ui-serial-badge" data-serial-id="SXX-SEC07-TAB03" data-item-name="결과물 탭">SXX-SEC07-TAB03</span>
          <span className="tab-icon">🖼️</span>
          <span>결과물</span>
        </button>

        <button
          className={`tab-item ${activeTab === 'vote' ? 'active' : ''}`}
          onClick={() => { setActiveTab('vote'); setCurrentView('main'); }}
          data-serial-id="SXX-SEC07-TAB04"
        >
          <span className="ui-serial-badge" data-serial-id="SXX-SEC07-TAB04" data-item-name="투표/순위 탭">SXX-SEC07-TAB04</span>
          <span className="tab-icon">🗳️</span>
          <span>투표/순위</span>
        </button>

        <button
          className={`tab-item ${activeTab === 'noti' ? 'active' : ''}`}
          onClick={() => { setActiveTab('noti'); setCurrentView('main'); }}
          data-serial-id="SXX-SEC07-TAB05"
        >
          <span className="ui-serial-badge" data-serial-id="SXX-SEC07-TAB05" data-item-name="알림 탭">SXX-SEC07-TAB05</span>
          <span className="tab-icon">🔔</span>
          <span>알림</span>
          {notifications.some((n) => !n.read) && <span className="tab-badge">N</span>}
        </button>
      </nav>

      {/* 인앱 토스트 팝업 */}
      {toastMessage && (
        <div id="ui-tagger-toast" className="ui-toast-show">
          {toastMessage}
        </div>
      )}
    </>
  );
}
