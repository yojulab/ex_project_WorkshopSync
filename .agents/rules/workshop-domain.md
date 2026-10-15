# WorkshopSync 워크샵 관리 플랫폼 도메인 엔지니어링 가이드

- **문서 참조**: `docs/initial_PRD.md` (v1.0 워크샵 참석자 전용 앱 작업지시서)
- **프로젝트 명칭**: **WorkshopSync (워크샵 관리 앱 - 참석자 앱 + 관리자 웹 + REST API)**
- **핵심 목표**: 워크샵 참석자가 스마트폰 앱으로 입장/인증 → 참석 체크 → 아젠다/미션 확인 → 조별·개인 작업물 업로드 → 대시보드 → 결과물 같이보기/피드백 → 선호도 투표 → 순위 및 우승 축하 알림까지 **워크샵 전 과정을 단일 앱에서** 완결하고, 운영자는 관리자 웹에서 설정 및 모니터링을 실시간으로 수행함.
- **핵심 UX 원칙**:
  1. **토스(Toss) 앱 UI 감성**: 큰 타이포그래피, 한 화면 한 목적, 카드형 레이아웃, 하단 고정 풀폭 CTA 버튼, 여백이 넉넉한 단순한 화면, 성공/완료 마이크로 인터랙션(컨페티 연출).
  2. **카카오톡 앱 방식 인터랙션**: 하단 5대 탭 네비게이션(`홈` · `미션` · `결과물` · `투표/순위` · `알림`), 인앱 알림/토스트/뱃지, 채팅형 가벼운 피드백 메모, 이미지/파일 업로드 미리보기 및 실시간 진행률.
  3. **모바일 우선(Mobile-First)**: 참석자 앱은 모바일 뷰포트(max-width 480px 중앙 정렬) 기준의 PWA로 개발.
- **포트 할당 체계 (Port 30015부터 시작)**:
  - **`30015`**: REST API 서버 (`apps/api` - Node.js + Express + TypeScript)
  - **`30016`**: 참석자 전용 앱 (`apps/mobile` - React 18 + Vite + PWA)
  - **`30017`**: 관리자 웹 포털 (`apps/admin` - React 18 + Vite + Desktop Web)
- **프로젝트 원칙**:
  > **※ 본 단계는 기획 및 상세 아키텍처 수립 단계입니다.**
  > **본 단계에서는 실제 소스코드 개발을 진행하지 않으며**, 개발팀, 기획팀, 인프라팀이 즉시 스프린트에 착수할 수 있도록 명세서, 인터페이스 정의, 스키마, WBS, 테스트 시나리오 기획에 집중합니다.
  > **모든 유의미한 작업 단위 완료 시에는 반드시 원자적 Git Commit을 수행합니다.**

---

## 1. 3대 타겟 모노레포 구조 및 기술 스택

```text
WorkshopSync/
├── apps/
│   ├── mobile/             # [Port 30016] 참석자 앱 (React 18 PWA, Toss풍 UI, max-width 480px)
│   ├── admin/              # [Port 30017] 관리자 웹 (React 18, 데스크톱 UI, Ant Design/MUI)
│   └── api/                # [Port 30015] REST API 서버 (Node.js, Express, TypeScript, Mongoose)
├── packages/
│   └── shared/             # 공용 TypeScript 인터페이스, DTO, 상수
├── tests/                  # Playwright E2E & API 자동화 테스트 슈트 (T-01 ~ T-13)
├── docs/                   # initial_PRD.md 등 기획/아키텍처 산출물
├── run_port.sh             # 30015 / 30016 / 30017 통합 포트 매니저 스크립트
├── .env.example            # 공통 환경 변수 템플릿
└── package.json            # npm/pnpm workspaces 루트
```

### 1-1. 프로젝트별 기술 스택 규격

| 타겟 구분 | 권장 기술 스택 | 기본 포트 | 핵심 역할 및 아키텍처 규격 |
| :--- | :--- | :--- | :--- |
| **apps/api** | Node.js, Express, TypeScript, Mongoose, Zod, JWT, Multer, SSE | **30015** | **핵심 REST API 및 실시간 서버**. Base `/api/v1`, MongoDB 트랜잭션, 파일 업로드 스트림, SSE 토스트 브로드캐스트, 비즈니스 규칙 검증. |
| **apps/mobile** | React 18, Vite, TypeScript, React Router, TanStack Query, `vite-plugin-pwa` | **30016** | **참석자 전용 스마트폰 앱 (PWA)**. 모바일 뷰포트(max-width 480px), 토스풍 깔끔한 UI(풀폭 하단 CTA, 컨페티 연출), 카카오톡식 5대 하단 탭, UI 인스펙터 뱃지 내장. |
| **apps/admin** | React 18, Vite, TypeScript, Ant Design 또는 MUI, React Router | **30017** | **운영자 전용 관리 웹 (Desktop Web)**. 워크샵/아젠다/미션 관리, 참석자 CSV 일괄 등록 & 조 편성, 실시간 대시보드, 투표 오픈/종료, 순위 공개 제어, 우승팀/최고 작업자 시상 발송. |
| **tests** | Playwright (Headless/Headed), TypeScript | - | **E2E 및 API 자동 검증 슈트**. 모바일 디바이스 에뮬레이션(iPhone 13, Pixel 7) + 관리자 데스크톱 크로스 브라우징, T-01 ~ T-13 전수 시나리오 자동 검증. |

---

## 2. MongoDB 데이터 모델 규격

모든 컬렉션은 Mongoose 스키마로 엄격히 타이핑하며, 필수 무결성 인덱스를 적용합니다:

| 컬렉션명 | 주요 필드 명세 | 인덱스 및 제약 조건 |
| :--- | :--- | :--- |
| **`admins`** | `_id`, `email`, `passwordHash`, `name`, `role`, `createdAt`, `updatedAt` | `email` unique |
| **`workshops`** | `_id`, `title`, `description`, `organizerCompany`, `location`, `startAt`, `endAt`, `status`(`ready`\|`live`\|`closed`), `joinCode`, `notice`, `resultsPublic`(boolean), `votingStatus`(`before`\|`open`\|`closed`), `createdAt` | `joinCode` unique |
| **`agendas`** | `_id`, `workshopId`, `order`, `title`, `description`, `startAt`, `endAt` | `(workshopId, order)` index |
| **`teams`** | `_id`, `workshopId`, `name`, `color`, `memberIds[]` | `(workshopId, name)` index |
| **`participants`** | `_id`, `workshopId`, `name`, `phone`, `company`, `type`(`client`\|`consumer`), `teamId`, `checkedInAt`, `status`, `tokenVersion` | **`unique(workshopId, phone)`** |
| **`missions`** | `_id`, `workshopId`, `title`, `description`, `scope`(`team`\|`individual`), `submitTypes[]`(`image`\|`doc`\|`video`\|`link`\|`text`), `dueAt`, `order` | `(workshopId, order)` index |
| **`submissions`** | `_id`, `workshopId`, `missionId`, `scope`, `teamId`?, `participantId`, `title`, `comment`, `files[{url,mime,size,name}]`, `links[]`, `status`(`draft`\|`submitted`), `submittedAt`, `version` | `(workshopId, missionId, teamId)` index |
| **`votes`** | `_id`, `workshopId`, `missionId`, `voterId`, `submissionId`(또는 `teamId`), `createdAt` | **`unique(voterId, missionId)`** |
| **`feedbacks`** | `_id`, `workshopId`, `submissionId`, `authorId`, `content`, `createdAt`, `updatedAt` | `(submissionId, createdAt)` index |
| **`awards`** | `_id`, `workshopId`, `type`(`winningTeam`\|`topWorker`), `teamId`?, `participantId`?, `reason`, `announcedAt` | `(workshopId, type)` index |
| **`notifications`** | `_id`, `workshopId`, `targetType`(`all`\|`team`\|`participant`), `targetId`?, `type`(`award`\|`notice`\|`mission`\|`vote`), `title`, `body`, `createdAt` | `(workshopId, targetType, targetId)` index |
| **`notificationReads`** | `_id`, `notificationId`, `participantId`, `readAt` | `unique(notificationId, participantId)` |

---

## 3. 핵심 비즈니스 규칙 및 가드레일

### 3-1. 인증 및 체크인
- **참석자 인증**: 워크샵 코드 + 이름 + 전화번호를 사전 등록 명단(`participants`)과 대조 검증 → 참석자용 JWT 발급 (만료: 워크샵 종료 + 1일). 별도 회원가입 없음.
- **참석 확인 (체크인)**: 워크샵 상태가 `live`이거나 시작 N분 전부터 가능. 중복 체크인 요청 시 최초 체크인 시각(`checkedInAt`)을 보존하고 멱등하게 성공 응답. 완료 시 체크 애니메이션 노출.

### 3-2. 작업물 제출 및 마감
- **조별 미션 (`scope: team`)**: 같은 조에 속한 참석자라면 누구나 제출 및 수정 가능 (조당 최종 1개 제출물 유지, 버전 번호 증가 관리).
- **개인 미션 (`scope: individual`)**: 본인 작업물 1건만 제출/수정 가능.
- **엄격한 마감 통제**: 미션 마감시간(`dueAt`) 이후의 신규 제출 및 수정은 서버 미들웨어에서 `400 Bad Request`로 엄격 차단 (관리자 수동 예외 허용 플래그 존재 시에만 허용).
- **파일 제약**: 허용 MIME 타입(`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`, `video/mp4`), 파일당 최대 용량 `UPLOAD_MAX_SIZE_MB`(기본 50MB).

### 3-3. 선호도 투표 (Gamification Core)
- **투표 활성화 조건**: 관리자가 해당 미션의 투표를 개시(`votingStatus = open`)했을 때만 가능.
- **자기 조 투표 불가**: 조별 결과물 투표 시 **자신이 소속된 조(`participant.teamId`)의 제출물에는 절대로 투표할 수 없음** (서버 로직 강제 검증).
- **1인 1표 원칙 및 변경 허용**: 미션당 1인 1표 (`unique(voterId, missionId)` 인덱스). 투표 마감 전까지는 기존 표를 철회하고 다른 후보로 변경 가능 (마지막 표 유효).
- **실시간 득표수 블라인드**: 투표 진행 중에는 참석자 앱에 실시간 득표수를 일절 노출하지 않으며, 관리자가 '순위 공개'(`ranking/publish`)를 실행한 시점에만 공개.

### 3-4. 순위 산출, 우승팀 및 최고 작업자 시상
- **조별 순위**: 득표수 내림차순 정렬, 동률 시 공동 순위(또는 최초 득표 도달 시각 우선) 적용.
- **우승팀 (`winningTeam`)**: 최고 득표 1위 조 (복수 미션 시 점수 합산).
- **최고 작업자 (`topWorker`)**: 개인 미션 결과 기반 또는 관리자 재량 지정.
- **축하 파이프라인**: 관리자가 수상 결과를 확정(`POST /admin/workshops/:id/awards`)하는 즉시, 전체 참석자에게 SSE 알림 발송 + 참석자 앱 전체 화면에 컨페티(꽃가루) 축하 화면(S-12) 자동 트리거.

### 3-5. 실시간 동기화 및 알림
- **SSE (Server-Sent Events)**: `/api/v1/workshops/:id/stream` 엔드포인트를 통해 제출 현황 대시보드 갱신, 투표 상태 변경, 순위 공개, 축하 알림을 참석자 앱에 지연 없이 실시간 브로드캐스트.

---

## 4. 화면 및 기능 목록 명세

### 4-1. 참석자 전용 앱 (13대 화면)
- **하단 5대 탭 네비게이션**: `[홈]` · `[미션]` · `[결과물]` · `[투표/순위]` · `[알림]`

| 화면 ID | 화면 명칭 | 주요 UI 요소 및 인터랙션 |
| :--- | :--- | :--- |
| **S-01** | **입장/인증 화면** | 워크샵 코드 입력 / QR 스캔 버튼, 이름·전화번호 입력창, 하단 고정 풀폭 "입장하기" CTA 버튼 |
| **S-02** | **참석 체크인 화면** | 현장 QR 스캔 / 체크인 코드 입력, 체크인 성공 인터랙션 (녹색 체크마크 애니메이션) |
| **S-03** | **홈 대시보드** | 참석자 환영 인사, 워크샵 요약 카드, 실시간 진행 아젠다 강조 배너, 내 미션 현황 카드, 최근 공지 |
| **S-04** | **워크샵 상세 정보** | 워크샵 일시, 장소(지도/오시는 길), 주최사, 조 편성 명단 및 내 조원 확인, 준비물 안내 |
| **S-05** | **아젠다 타임라인** | 세로형 타임라인 레이아웃, 현재 진행 중인 세션 실시간 강조 표시, 지난 세션 체크 |
| **S-06** | **미션 목록 및 상세** | 조별/개인 미션 카드, 마감 D-Day/시간 카운트다운 타이머, 상태 뱃지 (`미제출`\|`작성중`\|`제출완료`\|`마감`) |
| **S-07** | **작업물 업로드 화면** | 파일 첨부/카메라 촬영, 썸네일 미리보기, 업로드 진행률 바(%), 링크/설명 입력창, 하단 고정 "제출하기" CTA |
| **S-08** | **제출 현황 대시보드** | 조별 제출 진행률 막대, 개인 제출 여부 인디케이터, 전체 워크샵 제출률 도넛 차트 (SSE 자동 갱신) |
| **S-09** | **결과물 같이보기 갤러리** | 조별/미션별 필터링 그리드, 가로 스와이프 상세 뷰어, 카카오톡식 하단 1줄 피드백 메모 입력창 및 목록 |
| **S-10** | **선호도 투표 화면** | 조별 결과물 후보 카드 목록 (내 조는 '투표 불가' 비활성 처리), 선택 시 바텀시트 확인 → 투표 완료 연출 |
| **S-11** | **선호도 순위 화면** | 관리자 공개 전 '집계 중' 안내 화면, 공개 후 1~N위 랭킹 리스트 (1위 왕관 골드 하이라이트), 득표율 표시 |
| **S-12** | **우승 축하 화면** | 전체 화면 화려한 컨페티(꽃가루) 파티클 애니메이션, 우승팀 및 최고 작업자 프로필 카드, 축하 공유 버튼 |
| **S-13** | **알림함** | 인앱 알림 목록, 미확인 뱃지 카운트, 공지/투표/시상 유형별 아이콘, 탭 시 읽음 처리 및 해당 화면 딥링크 |

### 4-2. 관리자 웹 (9대 기능)

| 기능 ID | 기능 명칭 | 상세 설명 |
| :--- | :--- | :--- |
| **A-01** | **관리자 로그인** | 이메일/비밀번호 기반 인증, JWT Access & Refresh 토큰 발급 |
| **A-02** | **워크샵 마스터 관리** | 워크샵 생성/수정/삭제, 상태 전이(`ready` → `live` → `closed`), 초대 코드 및 입장 QR코드 자동 발급 |
| **A-03** | **아젠다 & 미션 관리** | 시간대별 아젠다 편성, 조별/개인 미션 생성, 제출 형식 및 마감 일시 설정 |
| **A-04** | **참석자 & 조 편성 관리** | 사전 등록 참석자 CSV 파일 일괄 업로드, 조 편성(수동 배정 또는 자동 랜덤 배정), 실시간 체크인 현황 |
| **A-05** | **제출 현황 모니터링** | 조별/미션별 실시간 제출 상태 그리드, 제출물 즉시 미리보기 및 부적절 콘텐츠 삭제/반려 조치 |
| **A-06** | **투표 운영 및 순위 제어** | 미션별 투표 개시(`open`) 및 종료(`closed`), 비공개 득표수 확인, 순위 전체 참석자 공개(`publish`) 토글 |
| **A-07** | **우승 및 최고 작업자 시상** | 최고 득표 우승팀 자동 산출, 최고 작업자 선정(관리자 지정), 축하 알림 및 컨페티 이벤트 일괄 발송 |
| **A-08** | **실시간 공지/알림 발송** | 전체 참석자 또는 특정 조를 타겟으로 긴급 공지 푸시 발송 (SSE 즉시 전달) |
| **A-09** | **결과 리포트 내보내기** | 참석자 출석률, 미션 제출률, 투표 결과 데이터 CSV 일괄 다운로드 |

---

## 5. 환경 변수 (`.env`) 표준 규격

포트 30015부터 시작하는 표준 포트 매핑 규격을 준수합니다:

```dotenv
# ===== 공통 환경 설정 =====
NODE_ENV=development

# ===== REST API 서버 (Port: 30015) =====
API_PORT=30015
API_BASE_URL=http://localhost:30015
CORS_ORIGINS=http://localhost:30016,http://localhost:30017

# ===== MongoDB 데이터베이스 =====
MONGODB_URI=mongodb://localhost:27017/workshopsync
MONGODB_DB_NAME=workshopsync
MONGODB_URI_TEST=mongodb://localhost:27017/workshopsync_test

# ===== 보안 및 JWT 인증 =====
JWT_SECRET=workshopsync-super-secret-key-2026
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=14d
PARTICIPANT_TOKEN_EXPIRES_IN=3d

# ===== 파일 및 미디어 업로드 =====
UPLOAD_DIR=./uploads
UPLOAD_MAX_SIZE_MB=50
UPLOAD_ALLOWED_MIME=image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4

# ===== 참석자 모바일 웹앱 (Port: 30016) =====
VITE_API_BASE_URL=http://localhost:30015/api/v1
VITE_APP_NAME=WorkshopSync 참석자 앱
VITE_PORT=30016

# ===== 관리자 웹 (Port: 30017) =====
VITE_ADMIN_PORT=30017

# ===== Playwright 자동화 테스트 (E2E) =====
E2E_API_URL=http://localhost:30015
E2E_MOBILE_URL=http://localhost:30016
E2E_ADMIN_URL=http://localhost:30017
ADMIN_SEED_EMAIL=admin@workshopsync.io
ADMIN_SEED_PASSWORD=workshop2026!
```

---

## 6. 테스트 계획 (Playwright T-01 ~ T-13)

| 테스트 ID | 대상 컨텍스트 | 시나리오 및 검증 항목 |
| :--- | :--- | :--- |
| **T-01** | 모바일 PWA | 워크샵 코드 + 이름 + 전화번호로 로그인 성공 후 S-02 참석 체크인 애니메이션 검증 |
| **T-02** | 모바일 PWA | S-03 홈 대시보드에서 워크샵 정보, 현재 아젠다, 내 미션 카드 렌더링 확인 |
| **T-03** | 모바일 PWA | 미션 상세 진입 → S-07 이미지 파일 업로드 → S-08 대시보드에 '제출 완료' 상태 즉시 반영 검증 |
| **T-04** | 모바일 PWA | 마감시간 경과 후 작업물 업로드 시도 시 '마감되었습니다' 안내 및 제출 버튼 비활성화 검증 |
| **T-05** | 모바일 PWA | S-08 대시보드의 조별/전체 제출 수치와 DB 실제 제출 건수 정합성 검증 |
| **T-06** | 모바일 PWA | S-09 결과물 갤러리에서 이미지 뷰어 열람, 카카오톡식 피드백 메모 작성/수정/삭제 E2E 검증 |
| **T-07** | 모바일 PWA | S-10 선호도 투표 시 **자기 조 제출물 투표 불가(비활성)** 검증 및 타 조 투표/변경 정상 처리 검증 |
| **T-08** | 멀티 컨텍스트 | 관리자 웹에서 '순위 공개' 클릭 시 모바일 앱 S-11 화면에 1초 이내에 순위 리스트 실시간 노출 검증 |
| **T-09** | 멀티 컨텍스트 | 관리자 웹에서 우승팀 확정 및 시상 발송 시 모바일 앱에 SSE 토스트 및 S-12 컨페티 축하 화면 자동 실행 검증 |
| **T-10** | 관리자 웹 | A-02~A-04 워크샵 생성, 아젠다/미션 설정, 참석자 CSV 임포트 및 자동 조 편성 기능 정상 동작 검증 |
| **T-11** | REST API | 타 워크샵 데이터 접근 차단 및 일반 참석자 토큰으로 `/admin/*` API 호출 시 `403 Forbidden` 반환 검증 |
| **T-12** | REST API | 50MB 초과 파일 업로드 차단, 미허용 확장자 차단, 중복 투표 차단 입력 검증(Zod) 검증 |
| **T-13** | 시각/반응형 | 모바일 뷰포트(iPhone 13, 390x844) 및 태블릿 환경에서 토스풍 카드/풀폭 CTA UI 비주얼 회귀 테스트 |
