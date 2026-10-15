import { Workshop, Agenda, Team, Participant, Mission, Submission, Feedback, Award, NotificationItem, GlobalActivityLog } from './types';

export const mockWorkshops: Workshop[] = [
  {
    id: 'ws-2026-ai',
    title: '2026 하반기 AI 에이전트 서비스 혁신 워크샵',
    description: '기업 현장의 업무 자동화와 고객 경험 혁신을 위한 생성형 AI 에이전트 기획 및 실전 프로토타이핑 워크샵',
    category: 'AI / 생성형 모델',
    organizerCompany: '(주)넥스트웨이브 이노베이션 & 글로벌 테크 파트너스',
    location: '판교 스타트업 캠퍼스 2동 컨퍼런스홀 A (경기 성남시 분당구 판교로 289)',
    locationDetail: '지하 1층 주차 가능 (무료 주차권 지급), 대중교통 이용 시 판교역 1번 출구 셔틀버스 운행',
    startAt: '2026-10-15T09:30:00+09:00',
    endAt: '2026-10-15T18:00:00+09:00',
    status: 'live',
    joinCode: 'WS2026',
    checkinCode: 'CHECK777',
    notice: '📢 오후 16:30부터 각 조별 결과물 선호도 투표가 시작됩니다. 자기 조에는 투표할 수 없으니 타 조의 작업물을 꼼꼼히 확인해 주세요!',
    prepItems: [
      '개인 노트북 및 충전기 (멀티탭 조별 배치 완료)',
      '신분증 또는 명함 (출입증 발급용)',
      '조별 슬라이드 작성 툴 (Figma / Canva / Google Slides 등)'
    ],
    resultsPublic: false,
    votingStatus: 'open',
    createdAt: '2026-10-10T09:00:00+09:00'
  },
  {
    id: 'ws-2026-cloud',
    title: '2026 클라우드 네이티브 MSA 아키텍처 해커톤',
    description: '쿠버네티스와 서비스 메시 기반의 대규모 트래픽 탄력 분산 아키텍처 설계 및 장애 대응 실전 스프린트',
    category: '클라우드 / 인프라',
    organizerCompany: '클라우드 인프라 엔지니어링 협회',
    location: '강남 드림플러스 지하 1층 이벤트홀 (서울 서초구 강남대로 311)',
    locationDetail: '강남역 5번 출구 도보 5분, 본 건물 주차 불가 (인근 공영주차장 이용 권장)',
    startAt: '2026-10-15T10:00:00+09:00',
    endAt: '2026-10-15T19:00:00+09:00',
    status: 'live',
    joinCode: 'CLOUD26',
    checkinCode: 'MSA888',
    notice: '⚡ 13:00부터 조별 쿠버네티스 카오스 엔지니어링 미션 1차가 개시됩니다. 로컬 k8s 클러스터 접근 권한을 확인하세요.',
    prepItems: [
      'Docker Desktop & kubectl 설치 완료된 노트북',
      'AWS / GCP 클라우드 크레딧 활성화 계정',
      '조별 아키텍처 다이어그램 툴 (Excalidraw 등)'
    ],
    resultsPublic: false,
    votingStatus: 'before',
    createdAt: '2026-10-11T11:00:00+09:00'
  },
  {
    id: 'ws-2026-design',
    title: '2026 글로벌 B2B SaaS 프로덕트 디자인 스프린트',
    description: '실리콘밸리 엔터프라이즈 UX 패턴과 디자인 시스템 토큰을 활용한 B2B SaaS 신규 대시보드 리디자인 스프린트',
    category: '디자인 / UX',
    organizerCompany: '디자인 길드 코리아 & 프로덕트 디자인 포럼',
    location: '여의도 파크원 타워2 14층 대회의실 (서울 영등포구 여의대로 108)',
    locationDetail: '여의도역 3번 출구 지하 통로 연결, 게스트 등록 후 출입증 수령 필수',
    startAt: '2026-10-18T09:00:00+09:00',
    endAt: '2026-10-18T18:00:00+09:00',
    status: 'ready',
    joinCode: 'DESIGN26',
    checkinCode: 'UX999',
    notice: '🎨 워크샵 시작 전 Figma 최신 버전 업데이트 및 사전 배포된 디자인 시스템 컴포넌트 라이브러리를 임포트해주세요.',
    prepItems: [
      'Figma 프로페셔널 계정 로그인 기기',
      '필기도구 및 포스트잇 (현장 제공 외 개인용)',
      '자사 제품 대시보드 스크린샷 3종'
    ],
    resultsPublic: false,
    votingStatus: 'before',
    createdAt: '2026-10-12T14:00:00+09:00'
  },
  {
    id: 'ws-2026-data',
    title: '2026 빅데이터 & LLM 파이프라인 실전 캠프',
    description: '대용량 임베딩 벡터 서치 엔진 구축과 실시간 RAG 파이프라인 최적화 집중 실습',
    category: '데이터 엔지니어링',
    organizerCompany: '데이터 사이언스 얼라이언스',
    location: '양재 aT센터 제2전시장 3층 세미나룸 (서울 서초구 강남대로 27)',
    locationDetail: '신분당선 양재시민의숲역 4번 출구 직결, 전일 주차 50% 할인권 지급',
    startAt: '2026-10-10T09:00:00+09:00',
    endAt: '2026-10-10T18:00:00+09:00',
    status: 'closed',
    joinCode: 'DATA26',
    checkinCode: 'LLM000',
    notice: '🎉 워크샵이 성공적으로 종료되었습니다! 결과물과 수상작 명단은 결과 탭에서 확인하실 수 있습니다.',
    prepItems: [
      'Python 3.11 환경 및 GPU 클라우드 인스턴스',
      'HuggingFace 토큰 준비'
    ],
    resultsPublic: true,
    votingStatus: 'closed',
    createdAt: '2026-10-05T08:00:00+09:00'
  },
  {
    id: 'ws-2026-fintech',
    title: '2026 디지털 금융 혁신 & 오픈뱅킹 해커톤',
    description: '마이데이터 API와 금융 보안 가이드라인을 준수한 차세대 자산관리 및 결제 UX 아이디어 프로토타이핑',
    category: '금융 / 핀테크',
    organizerCompany: '핀테크 이노베이션 랩',
    location: '을지로 파인에비뉴 A동 8층 대회의실 (서울 중구 을지로 100)',
    locationDetail: '을지로3가역 12번 출구 바로 앞',
    startAt: '2026-10-25T09:30:00+09:00',
    endAt: '2026-10-25T18:30:00+09:00',
    status: 'ready',
    joinCode: 'FINTECH',
    checkinCode: 'FIN123',
    notice: '💳 참가자 사전 설문조사를 작성해주시면 조 편성 시 희망 금융 직무를 우선 반영합니다.',
    prepItems: [
      '신분증, 명함 20매 (네트워킹용)',
      '노트북 및 개인 개발 환경'
    ],
    resultsPublic: false,
    votingStatus: 'before',
    createdAt: '2026-10-14T10:00:00+09:00'
  }
];

export const mockWorkshop: Workshop = mockWorkshops[0];

export const mockAgendas: Agenda[] = [
  {
    id: 'ag-1',
    workshopId: 'ws-2026-ai',
    order: 1,
    title: '입장 등록 및 웰컴 티타임 & 네트워킹',
    description: '현장 QR 체크인, 네임택 수령, 조별 테이블 착석 및 아이스브레이킹',
    startAt: '09:30',
    endAt: '10:00',
    speaker: '운영사무국 박소연 팀장'
  },
  {
    id: 'ag-2',
    workshopId: 'ws-2026-ai',
    order: 2,
    title: '키노트: 2026 실전 자율형 AI 에이전트 아키텍처',
    description: 'LLM 툴콜링, 멀티에이전트 협업 패턴, 기업 환경 적용 실패/성공 사례 분석',
    startAt: '10:00',
    endAt: '11:00',
    speaker: '넥스트웨이브 CTO 이정훈 박사'
  },
  {
    id: 'ag-3',
    workshopId: 'ws-2026-ai',
    order: 3,
    title: '[미션 1] 조별 비즈니스 문제 정의 및 에이전트 워크플로우 설계',
    description: '고객 페인포인트 발굴, 에이전트 프롬프트/도구 설계, 조별 기획안 1차 제출',
    startAt: '11:00',
    endAt: '13:00',
    speaker: '각 조 전담 퍼실리테이터'
  },
  {
    id: 'ag-4',
    workshopId: 'ws-2026-ai',
    order: 4,
    title: '[미션 2] 프로토타입 구현 및 결과물 업로드 (점심 & 스프린트)',
    description: '샌드위치 런치 케이터링 제공, 조별 최종 시연 자료 및 화면 캡처 업로드',
    startAt: '13:00',
    endAt: '16:00',
    speaker: '참석자 전원 자율 스프린트'
  },
  {
    id: 'ag-5',
    workshopId: 'ws-2026-ai',
    order: 5,
    title: '결과물 같이보기, 모바일 선호도 투표 및 우승팀 시상',
    description: '전체 조 갤러리 피드백 공유, 블라인드 투표 진행, 1위 우승팀 및 최고작업자 발표 & 축하 연출',
    startAt: '16:00',
    endAt: '17:30',
    speaker: '총괄 디렉터 최성민 상무'
  }
];

export const mockTeams: Team[] = [
  { id: 'team-1', workshopId: 'ws-2026-ai', name: '1조 · 생성형 파이오니어', color: '#10B981', tableNumber: 1, memberIds: ['p-01', 'p-02', 'p-03', 'p-04'] },
  { id: 'team-2', workshopId: 'ws-2026-ai', name: '2조 · 오토메이션 랩', color: '#3B82F6', tableNumber: 2, memberIds: ['p-05', 'p-06', 'p-07', 'p-08'] },
  { id: 'team-3', workshopId: 'ws-2026-ai', name: '3조 · 넥스트 비전', color: '#8B5CF6', tableNumber: 3, memberIds: ['p-09', 'p-10', 'p-11', 'p-12'] },
  { id: 'team-4', workshopId: 'ws-2026-ai', name: '4조 · 딥 싱크', color: '#F59E0B', tableNumber: 4, memberIds: ['p-13', 'p-14', 'p-15', 'p-16'] },
  { id: 'team-5', workshopId: 'ws-2026-ai', name: '5조 · 스마트 에이전트', color: '#EC4899', tableNumber: 5, memberIds: ['p-17', 'p-18', 'p-19', 'p-20'] }
];

export const mockParticipants: Participant[] = [
  // 1조 (기본 로그인 테스트 사용자: 김민우)
  { id: 'p-01', workshopId: 'ws-2026-ai', name: '김민우', phone: '010-3849-2910', phoneLast4: '2910', company: '현대오토에버', roleTitle: '플랫폼 개발팀 팀장', type: 'client', teamId: 'team-1', checkedInAt: '2026-10-15T09:28:10+09:00', status: 'registered' },
  { id: 'p-02', workshopId: 'ws-2026-ai', name: '이수진', phone: '010-9182-3491', phoneLast4: '3491', company: '카카오뱅크', roleTitle: '프로덕트 디자이너', type: 'client', teamId: 'team-1', checkedInAt: '2026-10-15T09:32:00+09:00', status: 'registered' },
  { id: 'p-03', workshopId: 'ws-2026-ai', name: '박태양', phone: '010-1283-4920', phoneLast4: '4920', company: '토스랩', roleTitle: '백엔드 엔지니어', type: 'consumer', teamId: 'team-1', checkedInAt: '2026-10-15T09:35:12+09:00', status: 'registered' },
  { id: 'p-04', workshopId: 'ws-2026-ai', name: '정유나', phone: '010-8291-0394', phoneLast4: '0394', company: '넥슨코리아', roleTitle: '데이터 분석가', type: 'consumer', teamId: 'team-1', checkedInAt: '2026-10-15T09:29:45+09:00', status: 'registered' },

  // 2조
  { id: 'p-05', workshopId: 'ws-2026-ai', name: '박도현', phone: '010-5542-8831', phoneLast4: '8831', company: '신한은행', roleTitle: 'AI전략부 수석', type: 'client', teamId: 'team-2', checkedInAt: '2026-10-15T09:25:11+09:00', status: 'registered' },
  { id: 'p-06', workshopId: 'ws-2026-ai', name: '한지민', phone: '010-6671-2940', phoneLast4: '2940', company: '라인플러스', roleTitle: 'ML 엔지니어', type: 'consumer', teamId: 'team-2', checkedInAt: '2026-10-15T09:30:19+09:00', status: 'registered' },
  { id: 'p-07', workshopId: 'ws-2026-ai', name: '윤재호', phone: '010-3391-7721', phoneLast4: '7721', company: '당근마켓', roleTitle: '서비스 기획 매니저', type: 'consumer', teamId: 'team-2', checkedInAt: '2026-10-15T09:38:00+09:00', status: 'registered' },
  { id: 'p-08', workshopId: 'ws-2026-ai', name: '송지우', phone: '010-4412-8890', phoneLast4: '8890', company: 'SK텔레콤', roleTitle: '클라우드 아키텍트', type: 'client', teamId: 'team-2', checkedInAt: '2026-10-15T09:26:40+09:00', status: 'registered' },

  // 3조
  { id: 'p-09', workshopId: 'ws-2026-ai', name: '정하나', phone: '010-4421-9982', phoneLast4: '9982', company: '쿠팡', roleTitle: '시니어 PO', type: 'client', teamId: 'team-3', checkedInAt: '2026-10-15T09:21:05+09:00', status: 'registered' },
  { id: 'p-10', workshopId: 'ws-2026-ai', name: '오세훈', phone: '010-9938-1240', phoneLast4: '1240', company: '우아한형제들', roleTitle: '프론트엔드 리드', type: 'consumer', teamId: 'team-3', checkedInAt: '2026-10-15T09:33:50+09:00', status: 'registered' },
  { id: 'p-11', workshopId: 'ws-2026-ai', name: '문채원', phone: '010-7718-2931', phoneLast4: '2931', company: '네이버', roleTitle: 'UX 리서처', type: 'consumer', teamId: 'team-3', checkedInAt: '2026-10-15T09:31:10+09:00', status: 'registered' },
  { id: 'p-12', workshopId: 'ws-2026-ai', name: '배준성', phone: '010-3382-6619', phoneLast4: '6619', company: 'LG CNS', roleTitle: 'AI 솔루션 컨설턴트', type: 'client', teamId: 'team-3', checkedInAt: '2026-10-15T09:36:20+09:00', status: 'registered' },

  // 4조
  { id: 'p-13', workshopId: 'ws-2026-ai', name: '최준혁', phone: '010-7712-3344', phoneLast4: '3344', company: '삼성전자', roleTitle: '선임 연구원', type: 'client', teamId: 'team-4', checkedInAt: '2026-10-15T09:20:10+09:00', status: 'registered' },
  { id: 'p-14', workshopId: 'ws-2026-ai', name: '임예린', phone: '010-2294-8812', phoneLast4: '8812', company: '스마일게이트', roleTitle: 'AI 게임 기획자', type: 'consumer', teamId: 'team-4', checkedInAt: '2026-10-15T09:34:00+09:00', status: 'registered' },
  { id: 'p-15', workshopId: 'ws-2026-ai', name: '하동훈', phone: '010-5591-2283', phoneLast4: '2283', company: '무신사', roleTitle: '풀스택 엔지니어', type: 'consumer', teamId: 'team-4', checkedInAt: '2026-10-15T09:37:12+09:00', status: 'registered' },
  { id: 'p-16', workshopId: 'ws-2026-ai', name: '서지현', phone: '010-8849-1102', phoneLast4: '1102', company: 'CJ ENM', roleTitle: '콘텐츠 테크 매니저', type: 'client', teamId: 'team-4', checkedInAt: '2026-10-15T09:27:50+09:00', status: 'registered' },

  // 5조
  { id: 'p-17', workshopId: 'ws-2026-ai', name: '강서연', phone: '010-6623-1122', phoneLast4: '1122', company: '엔씨소프트', roleTitle: 'NLP 테크 리더', type: 'client', teamId: 'team-5', checkedInAt: '2026-10-15T09:24:30+09:00', status: 'registered' },
  { id: 'p-18', workshopId: 'ws-2026-ai', name: '권민석', phone: '010-1192-8834', phoneLast4: '8834', company: '비바리퍼블리카', roleTitle: '보안 아키텍트', type: 'consumer', teamId: 'team-5', checkedInAt: '2026-10-15T09:30:45+09:00', status: 'registered' },
  { id: 'p-19', workshopId: 'ws-2026-ai', name: '조유진', phone: '010-4491-0021', phoneLast4: '0021', company: '야놀자', roleTitle: '그로스 마케터', type: 'consumer', teamId: 'team-5', checkedInAt: '2026-10-15T09:39:10+09:00', status: 'registered' },
  { id: 'p-20', workshopId: 'ws-2026-ai', name: '안태경', phone: '010-9923-5511', phoneLast4: '5511', company: 'KT', roleTitle: '디지털 전환 PM', type: 'client', teamId: 'team-5', checkedInAt: '2026-10-15T09:22:15+09:00', status: 'registered' }
];

export const mockMissions: Mission[] = [
  {
    id: 'm-1',
    workshopId: 'ws-2026-ai',
    order: 1,
    title: '[조별 미션 1] 고객 온보딩 자율형 AI 에이전트 서비스 설계안',
    description: '기업 신규 고객의 복잡한 서류 제출과 심사 과정을 3분 안에 대화로 끝내는 멀티에이전트 워크플로우를 기획하고, 프롬프트 구조와 예외 처리 시나리오를 작성하세요.',
    scope: 'team',
    submitTypes: ['image', 'doc', 'link'],
    dueAt: '2026-10-15T13:00:00+09:00',
    votable: true,
    votingStatus: 'open',
    rankingPublished: false
  },
  {
    id: 'm-2',
    workshopId: 'ws-2026-ai',
    order: 2,
    title: '[조별 미션 2] 실전 프로토타입 시연 영상 및 슬라이드 제출',
    description: '실제 데모 화면 녹화 영상(MP4) 또는 인터랙티브 피그마 프로토타입 링크를 조별 최종 결과물로 제출해 주세요. 심사위원 및 전체 참석자 투표의 핵심 기준이 됩니다.',
    scope: 'team',
    submitTypes: ['video', 'link', 'doc'],
    dueAt: '2026-10-15T16:30:00+09:00',
    votable: true,
    votingStatus: 'before',
    rankingPublished: false
  }
];

export const mockSubmissions: Submission[] = [
  {
    id: 'sub-1',
    workshopId: 'ws-2026-ai',
    missionId: 'm-1',
    scope: 'team',
    teamId: 'team-1',
    participantId: 'p-01',
    title: '1조 · 스마트 온보딩 3분 에이전트 「온디(On-D)」',
    comment: '복잡한 신용 심사 및 서류 검증을 카카오톡 대화형으로 2.5분 만에 완료하는 자율형 에이전트 설계서입니다. OCR 검증 및 이상 징후 탐지 룰을 탑재했습니다.',
    files: [
      {
        id: 'f-1',
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        name: '온디_아키텍처_플로우차트.png',
        size: 2450000,
        mime: 'image/png'
      },
      {
        id: 'f-2',
        url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
        name: '온디_카카오톡UI_프로토타입.png',
        size: 3100000,
        mime: 'image/png'
      }
    ],
    links: ['https://figma.com/@team1/on-d-prototype'],
    status: 'submitted',
    submittedAt: '2026-10-15T12:45:10+09:00',
    version: 2,
    voteCount: 14
  },
  {
    id: 'sub-2',
    workshopId: 'ws-2026-ai',
    missionId: 'm-1',
    scope: 'team',
    teamId: 'team-2',
    participantId: 'p-05',
    title: '2조 · 금융 세무 서류 자동 분석 에이전트 「핀세이버」',
    comment: 'PDF 세금계산서와 손익계산서를 업로드하면 LLM이 항목별 세액 공제 항목을 99.2% 정확도로 산출하고 환급 예상액을 계산해 주는 자동화 모델.',
    files: [
      {
        id: 'f-3',
        url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        name: '핀세이버_재무대시보드.png',
        size: 1980000,
        mime: 'image/png'
      }
    ],
    links: ['https://notion.so/team2/finsaver-whitepaper'],
    status: 'submitted',
    submittedAt: '2026-10-15T12:51:22+09:00',
    version: 1,
    voteCount: 11
  },
  {
    id: 'sub-3',
    workshopId: 'ws-2026-ai',
    missionId: 'm-1',
    scope: 'team',
    teamId: 'team-3',
    participantId: 'p-09',
    title: '3조 · 이커머스 입점사 24/7 CS 해결사 「셀러봇」',
    comment: '배송 지연, 단순 변심 환불, 교환 등 18개 표준 CS 시나리오에 대해 사람 상담사 개입 없이 94% 종결 처리하는 멀티턴 에이전트.',
    files: [
      {
        id: 'f-4',
        url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
        name: '셀러봇_상담성공률_분석표.png',
        size: 2800000,
        mime: 'image/png'
      }
    ],
    links: ['https://github.com/team3-sellerbot/demo'],
    status: 'submitted',
    submittedAt: '2026-10-15T12:58:05+09:00',
    version: 1,
    voteCount: 9
  },
  {
    id: 'sub-4',
    workshopId: 'ws-2026-ai',
    missionId: 'm-1',
    scope: 'team',
    teamId: 'team-4',
    participantId: 'p-13',
    title: '4조 · 의료 건강검진 결과 맞춤 케어 「메디버디」',
    comment: '건강검진표를 사진 촬영하여 업로드하면 5개 만성질환 위험도를 지수화하고 주치의 상담 질문 리스트를 자동 작성해 주는 헬스케어 비서.',
    files: [
      {
        id: 'f-5',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
        name: '메디버디_검진표분석_화면.png',
        size: 3400000,
        mime: 'image/png'
      }
    ],
    links: ['https://medibuddy.framer.website'],
    status: 'submitted',
    submittedAt: '2026-10-15T12:49:50+09:00',
    version: 3,
    voteCount: 7
  },
  {
    id: 'sub-5',
    workshopId: 'ws-2026-ai',
    missionId: 'm-1',
    scope: 'team',
    teamId: 'team-5',
    participantId: 'p-17',
    title: '5조 · 스마트 물류 실시간 화물 배차 「로지마스터」',
    comment: '기상 악화 및 고속도로 정체 상황을 실시간 반영해 화물차 최적 경로 재계산 및 유류비 14% 절감 솔루션 제안.',
    files: [
      {
        id: 'f-6',
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
        name: '로지마스터_배차맵.png',
        size: 2100000,
        mime: 'image/png'
      }
    ],
    links: ['https://logimaster.app'],
    status: 'submitted',
    submittedAt: '2026-10-15T12:59:15+09:00',
    version: 1,
    voteCount: 5
  }
];

export const mockFeedbacks: Feedback[] = [
  {
    id: 'fb-1',
    workshopId: 'ws-2026-ai',
    submissionId: 'sub-1',
    authorId: 'p-05',
    authorName: '박도현',
    authorTeamName: '2조 오토메이션 랩',
    content: '카카오톡 대화형 UI가 너무 매끄럽네요! 특히 이상 거래 탐지 룰을 온보딩 단계에 녹여낸 점이 인상 깊습니다 👍',
    createdAt: '2026-10-15T13:10:20+09:00'
  },
  {
    id: 'fb-2',
    workshopId: 'ws-2026-ai',
    submissionId: 'sub-1',
    authorId: 'p-09',
    authorName: '정하나',
    authorTeamName: '3조 넥스트 비전',
    content: '신규 고객 입장에서 번거로운 서류 작성이 정말 간편해질 것 같아요. 완성도가 매우 높습니다!',
    createdAt: '2026-10-15T13:15:44+09:00'
  },
  {
    id: 'fb-3',
    workshopId: 'ws-2026-ai',
    submissionId: 'sub-2',
    authorId: 'p-01',
    authorName: '김민우',
    authorTeamName: '1조 생성형 파이오니어',
    content: 'OCR 오류 보정 알고리즘을 프롬프트 체인으로 엮은 설계가 매우 실용적입니다.',
    createdAt: '2026-10-15T13:22:11+09:00'
  },
  {
    id: 'fb-4',
    workshopId: 'ws-2026-ai',
    submissionId: 'sub-3',
    authorId: 'p-13',
    authorName: '최준혁',
    authorTeamName: '4조 딥 싱크',
    content: '18개 시나리오 세분화가 놀랍습니다. 실제 CS 센터 비용 절감 지표도 설득력 있어요.',
    createdAt: '2026-10-15T13:28:00+09:00'
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    workshopId: 'ws-2026-ai',
    targetType: 'all',
    type: 'vote',
    title: '🗳️ [미션 1] 선호도 투표가 시작되었습니다!',
    body: '타 조의 결과물을 갤러리에서 둘러보고 가장 뛰어난 결과물에 소중한 1표를 행사해 주세요. (자기 조 투표는 불가합니다)',
    createdAt: '2026-10-15T14:00:00+09:00',
    read: false
  },
  {
    id: 'notif-2',
    workshopId: 'ws-2026-ai',
    targetType: 'all',
    type: 'notice',
    title: '☕ 케이터링 안내: 커피와 다과가 준비되었습니다',
    body: '컨퍼런스홀 로비 2층에 스페셜티 커피와 핑거푸드가 비치되어 있으니 자유롭게 이용 바랍니다.',
    createdAt: '2026-10-15T11:30:00+09:00',
    read: true
  },
  {
    id: 'notif-3',
    workshopId: 'ws-2026-ai',
    targetType: 'all',
    type: 'mission',
    title: '⏰ [미션 1] 제출 마감 15분 전입니다',
    body: '조별 대표 1인이 반드시 [제출하기] 버튼을 눌러야 최종 반영됩니다.',
    createdAt: '2026-10-15T12:45:00+09:00',
    read: true
  },
  {
    id: 'notif-4',
    workshopId: 'ws-2026-ai',
    targetType: 'participant',
    targetId: 'p-01',
    type: 'notice',
    title: '✅ 김민우님, 현장 체크인이 완료되었습니다',
    body: '테이블 번호 1번(1조 · 생성형 파이오니어)에 착석해 주시기 바랍니다.',
    createdAt: '2026-10-15T09:28:15+09:00',
    read: true
  }
];

export const mockAwards: Award[] = [
  {
    id: 'award-1',
    workshopId: 'ws-2026-ai',
    type: 'winningTeam',
    teamId: 'team-1',
    teamName: '1조 · 생성형 파이오니어',
    reason: '자율형 멀티에이전트 완결성 및 실제 비즈니스 적용성에서 최다 득표(14표) 달성',
    announcedAt: '2026-10-15T17:15:00+09:00'
  },
  {
    id: 'award-2',
    workshopId: 'ws-2026-ai',
    type: 'topWorker',
    participantId: 'p-02',
    participantName: '이수진 (카카오뱅크 / 1조)',
    reason: '온보딩 에이전트의 완성도 높은 프로토타입 UI 디자인 및 신속한 조별 협업 주도',
    announcedAt: '2026-10-15T17:15:00+09:00'
  }
];

export const mockGlobalActivityLogs: GlobalActivityLog[] = [
  {
    id: 'log-1',
    workshopId: 'ws-2026-ai',
    workshopTitle: '2026 하반기 AI 에이전트 서비스 혁신 워크샵',
    type: 'submission',
    message: '1조 · 생성형 파이오니어가 [미션 1] 결과물(v2)을 성공적으로 제출했습니다.',
    timestamp: '2026-10-15T15:42:10+09:00'
  },
  {
    id: 'log-2',
    workshopId: 'ws-2026-cloud',
    workshopTitle: '2026 클라우드 네이티브 MSA 아키텍처 해커톤',
    type: 'checkin',
    message: '최동현 참석자(AWS 코리아 / 3조)가 현장 체크인을 완료했습니다.',
    timestamp: '2026-10-15T15:38:00+09:00'
  },
  {
    id: 'log-3',
    workshopId: 'ws-2026-ai',
    workshopTitle: '2026 하반기 AI 에이전트 서비스 혁신 워크샵',
    type: 'vote',
    message: '참석자들의 선호도 투표가 실시간으로 집계되고 있습니다 (누적 18표).',
    timestamp: '2026-10-15T15:35:12+09:00'
  },
  {
    id: 'log-4',
    workshopId: 'ws-2026-cloud',
    workshopTitle: '2026 클라우드 네이티브 MSA 아키텍처 해커톤',
    type: 'submission',
    message: '2조 · 카오스 몽키팀이 [카나리 배포 파이프라인] 결과물을 최초 등록했습니다.',
    timestamp: '2026-10-15T15:20:45+09:00'
  },
  {
    id: 'log-5',
    workshopId: 'ws-2026-design',
    workshopTitle: '2026 글로벌 B2B SaaS 프로덕트 디자인 스프린트',
    type: 'status_change',
    message: '참가자 16명 사전 설문 응답 및 조 편성(4개 조) 사전 배정이 완료되었습니다.',
    timestamp: '2026-10-15T14:10:00+09:00'
  },
  {
    id: 'log-6',
    workshopId: 'ws-2026-data',
    workshopTitle: '2026 빅데이터 & LLM 파이프라인 실전 캠프',
    type: 'notice',
    message: '워크샵 최종 시상식 종료 및 참석자 수료증 발송이 완료되었습니다.',
    timestamp: '2026-10-10T18:30:00+09:00'
  }
];
