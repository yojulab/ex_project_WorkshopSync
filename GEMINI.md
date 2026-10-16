# GEMINI.md — WorkshopSync 워크샵 관리 플랫폼 하네스 헌장

> **Antigravity & Gemini 하네스 엔지니어링 시스템 가동 중**
> 본 프로젝트는 Claude Code의 `revfactory/harness` 및 `ralph-loop` 아키텍처를 Google Antigravity 및 Gemini 실행 환경에 맞춰 완벽히 재구성하고, **`docs/initial_PRD.md` (v1.0 워크샵 참석자 전용 앱 작업지시서)**와 **포트 30015부터 시작하는 3대 독립 서비스 아키텍처**, 그리고 **의뢰자 소통용 UI 태깅 인스펙션 시스템**에 최적화된 하네스 규칙 체계를 준수합니다.

---

## 1. 하네스 시스템 트리거 및 라우팅 포인터

사용자의 요청 키워드에 따라 아래 스킬과 룰을 즉시 참조하여 작업을 수행합니다:

| 사용자 요청 키워드 | 대상 스킬 / 룰 | 설명 |
| :--- | :--- | :--- |
| **"하네스 구성해줘"**, **"하네스 설계"**, **"에이전트 팀 만들어줘"** | [.agents/skills/harness/SKILL.md](file:///apps/ex_project_WorkshopSync/.agents/skills/harness/SKILL.md) | 프로젝트 도메인 분석 후 최적의 에이전트 팀과 스킬 설계 |
| **"하네스 회고"**, **"하네스 피드백 반영"**, **"하네스 진화"** | [.agents/skills/harness-evolve/SKILL.md](file:///apps/ex_project_WorkshopSync/.agents/skills/harness-evolve/SKILL.md) | 실행 델타 포착, 원리 일반화, 룰 및 에이전트 지속 개선 |
| **"루프 실행"**, **"ralph loop"**, **"끝날 때까지 반복"**, **"자율 루프"** | [.agents/skills/ralph-loop/SKILL.md](file:///apps/ex_project_WorkshopSync/.agents/skills/ralph-loop/SKILL.md) | Ralph Loop 자율 반복 실행, 완료 약속 및 서킷 브레이커 관리 |
| **UI 일련번호 태깅 & UI inspect 뱃지** | [.agents/rules/ui-tagging-inspection.md](file:///apps/ex_project_WorkshopSync/.agents/rules/ui-tagging-inspection.md) | 화면/태그 일련번호 체계, `Alt+I` 단축키 토글, 뱃지 클릭 시 4대 정보 복사 |
| **워크샵 도메인 용어 & 10대 골든 룰** | [.agents/rules/workshop-terminology.md](file:///apps/ex_project_WorkshopSync/.agents/rules/workshop-terminology.md) | 워크샵 도메인 전문 용어, 자기 조 투표 금지, 블라인드 득표, 마감 엄격 차단 등 10대 수칙 |
| **WorkshopSync 도메인 & PRD 규격** | [.agents/rules/workshop-domain.md](file:///apps/ex_project_WorkshopSync/.agents/rules/workshop-domain.md) | MongoDB 12대 스키마, 13대 화면(S-01~13), 관리자 9대 기능(A-01~09), 포트 30015+ 스펙 |
| **Git 커밋 규약 & 업무 종료 수칙** | [.agents/rules/git-workflow.md](file:///apps/ex_project_WorkshopSync/.agents/rules/git-workflow.md) | 업무 종료 시 Git Commit 필수화, 원자적 커밋, 메시지 컨벤션 |
| **하네스 아키텍처 & 품질 원칙** | [.agents/rules/harness-engineering.md](file:///apps/ex_project_WorkshopSync/.agents/rules/harness-engineering.md) | 6대 팀 패턴, 5대 품질 검증, 점진적 공개 원칙 |
| **루프 엔지니어링 원칙 & 서킷 브레이커** | [.agents/rules/loop-engineering.md](file:///apps/ex_project_WorkshopSync/.agents/rules/loop-engineering.md) | Iteration > Perfection, 상태 디스크 영속화, 서킷 브레이커 규정 |

---

## 2. WorkshopSync 핵심 업무 지시 원칙 및 개발 가드레일

1. **기획 및 상세 아키텍처 수립 단계 준수 (비개발 원칙)**:
   - **※ 본 단계에서는 실제 소스코드 개발을 진행하지 않습니다.**
   - 개발팀, 기획팀, 인프라팀이 상호 합의하고 즉시 스프린트에 착수할 수 있도록 구체적인 스펙, WBS, 인터페이스 정의, DDL/스키마 및 테스트 시나리오 수립에 집중합니다.
2. **서버별 사용 포트 30015부터 시작하는 3대 독립 서비스 체계**:
   - **`30015`**: REST API 서버 (`apps/api` — Node.js + Express + TypeScript + Mongoose + SSE)
   - **`30016`**: 참석자 전용 앱 (`apps/mobile` — React 18 + Vite + PWA, Toss/카카오톡 감성, max-width 480px)
   - **`30017`**: 관리자 웹 포털 (`apps/admin` — React 18 + Vite + Desktop Web, Ant Design/MUI)
   - 앱과 관리자 웹은 **서로 독립 빌드/배포**하며, 모든 데이터 연동은 REST API (`/api/v1`) 및 SSE 스트림으로만 수행합니다.
3. **의뢰자 소통용 UI 일련번호 태깅 및 4대 정보 뱃지 복사 규정**:
   - 모든 화면과 컴포넌트 태그에 고유 일련번호(`[S07-SEC02-BTN01]`, `[A04-SEC01-BTN01]`)를 부여합니다.
   - 단축키 **`Alt + I`**로 뱃지 표시/숨김 토글을 지원하고, **뱃지 클릭 시 4대 핵심 정보(일련번호, 페이지명, URI, 항목명)가 클립보드에 자동 복사(Copy)**되어 의뢰자가 피드백에 1초 만에 활용할 수 있도록 구현합니다.
4. **WorkshopSync 10대 비즈니스 골든 룰 절대 준수**:
   - 자기 조 투표 금지(UI 비활성화 & 서버 400 차단), 실시간 득표수 비공개(관리자 공개 시 노출), 마감 시간 후 업로드 엄격 차단, 체크인 멱등성 보존, 조별 제출물 단일화 및 버전 관리, 토스풍 하단 고정 풀폭 CTA, 카카오톡식 5대 하단 탭(`홈`·`미션`·`결과물`·`투표/순위`·`알림`), SSE 실시간 푸시 & 컨페티 우승 축하 화면을 철저히 반영합니다.
5. **알맞은 업무 종료 시 Git Commit 의무화**:
   - 모든 에이전트는 기획/아키텍처 문서 생성, 룰 갱신, 검증 완료 등 유의미한 작업 단위를 완수했을 때 **반드시 원자적 Git Commit을 수행**합니다.
   - 커밋 전 `.env` 등 민감 정보 누출 방지 및 `.gitignore` 적용 여부를 엄격히 확인합니다.
6. **모노레포 타겟 분리 구조**:
   - `apps/mobile/` (참석자 앱, Toss 모바일 UX + 카카오톡 탭/알림, max-width 480px)
   - `apps/admin/` (관리자 웹, 워크샵/조/미션/투표/시상 원스크린 모니터링)
   - `apps/api/` (REST API 서버, Node.js + Express, MongoDB 12대 컬렉션, SSE)
   - `packages/shared/` (공통 타입/인터페이스/상수)
   - `tests/` (Playwright E2E + API 테스트 T-01 ~ T-13 슈트)

---

## 3. WorkshopSync 하네스 전담 에이전트 팀 (Roles)

| 에이전트 롤 | 모델 티어 | 주 임무 및 전담 산출물 |
| :--- | :--- | :--- |
| **Workshop System Architect** | Gemini Pro | 전체 모노레포 아키텍처, MongoDB 12대 스키마 및 인덱스 설계, REST API 규격, .env 관리 체계, 포트(30015, 30016, 30017) 아키텍처 설계 |
| **Toss & Kakao UX Specialist** | Gemini Pro/Flash | 참석자 전용 앱(`apps/mobile`, 30016) PWA UX/UI. 토스풍(큰 폰트, 여백, 카드, 하단 고정 풀폭 CTA, 컨페티 완료 연출) + 카카오톡식 5대 탭(`홈`·`미션`·`결과물`·`투표/순위`·`알림`), 채팅형 피드백 메모, **UI 일련번호 태깅([Sxx-SECxx-xxx]) 및 Alt+I 인스펙션 규격** |
| **Admin Operations Specialist** | Gemini Pro/Flash | 관리자 웹(`apps/admin`, 30017) 워크샵 마스터 CRUD, CSV 참석자 등록, 조 편성 매니저, 미션/투표/순위 공개 오퍼레이션, 우승팀/최고 작업자 시상 발송, 실시간 대시보드 |
| **Workshop Rules & Gamification Specialist** | Gemini Pro | 워크샵 비즈니스 규칙 엔진(자기 조 투표 방지, 마감 시한 엄격 통제, 득표 산출, 동률 처리, 순위 계산, 시상 파이프라인 및 감사 로그) |
| **Realtime & Media Specialist** | Gemini Flash | SSE 실시간 알림 파이프라인, Multer 미디어/파일 업로드(미리보기, 진행률, 압축), 대시보드 실시간 브로드캐스트 |
| **Quality & Playwright E2E Assurer** | Gemini Pro | Playwright 자동화 테스트 슈트(T-01~T-13 시나리오), 모바일 에뮬레이션(iPhone 13/Pixel 7) + 관리자 데스크톱 크로스 브라우징, **UI 일련번호 기반 안정적 셀렉터 검증** |

---

## 4. 하네스 변경 이력 (Harness Changelog)

| 일자 | 변경 내용 | 대상 | 사유 |
| :--- | :--- | :--- | :--- |
| **2026-10-15** | WorkshopSync 프로젝트 맞춤형 하네스 전면 전환 | 전체 하네스 시스템 | `docs/initial_PRD.md` v1.0 작업지시서 반영 및 워크샵 참석자 전용 앱 도메인으로 전면 개편 |
| **2026-10-15** | 서버별 사용 포트 30015부터 시작 체계 확립 | `GEMINI.md`, `AGENTS.md`, `run_port.sh`, 도메인 룰 | 사용자 요청: API(30015), 참석자 앱 PWA(30016), 관리자 웹(30017) 표준 포트 매핑 |
| **2026-10-15** | WorkshopSync 도메인 가이드 및 10대 비즈니스 골든 룰 탑재 | `workshop-domain.md`, `workshop-terminology.md`, `plugin.json` | MongoDB 12대 스키마, 13대 화면(S-01~13), 관리자 9대 기능(A-01~09), 자기 조 투표 불가 등 10대 골든 룰 탑재 |
| **2026-10-15** | 의뢰자 소통용 UI 일련번호 태깅 체계 WorkshopSync 규격화 | `ui-tagging-inspection.md`, `GEMINI.md`, `AGENTS.md` | S01~S13 모바일 화면 및 A01~A09 관리자 화면 식별자 체계 수립, `Alt+I` 단축키 및 4대 정보 원클릭 복사 유지 |
| **2026-10-15** | 통합 포트 매니저 스크립트 30015+ 개편 | `run_port.sh`, `compile.sh`, `start_server.sh` 등 | 30015(API), 30016(Mobile), 30017(Admin) 개별/일괄 기동, 컴파일, 중지, 상태 점검 기능 지원 |
| **2026-10-16** | UI inspect 태그 뱃지 고도화 및 규격 통일 | `inspector.ts`, `admin/src/index.css`, `ui-tagging-inspection.md` | 용어 'UI inspect' 통일, 뱃지 사이즈 1단계 축소(9.5px), 관리자 좌측 메뉴 뱃지 위치 좌상단 일치화 |
| **2026-10-16** | 운영 모드 Any Port 및 전방위 CORS 접속 지원 체계 수립 | `run_port.sh`, `apps/*/vite.config.ts`, `apps/api`, `apps/admin` | 사용자 요청: 운영 환경에서 임의 포트 바인딩(`strictPort: false`, `process.env.PORT`), 외부 호스트 `0.0.0.0`, 전방위 CORS 허용(`*`) 반영 |
| **2026-10-16** | 빌드 파이프라인 @workshopsync/shared 사전 컴파일 및 source 호출 라우팅 강화 | `run_port.sh`, `compile.sh`, `packages/shared/package.json` | `. compile.sh` 실행 시 source 환경 인식 및 API 빌드 전 shared 패키지 자동 컴파일 연계 |
| **2026-10-16** | Vite server/preview Any Host 및 외부 도메인 접근 허용 (`allowedHosts: true`) | `apps/mobile/vite.config.ts`, `apps/admin/vite.config.ts` | 외부 도메인/IP(예: `eighth.axfoundly.com` 등) 호스트 검증 차단 해제 및 Any Host 전면 허용 |
| **2026-10-16** | API Any Host & PNA CORS 적용, 프론트엔드 /api 프록시 연계 및 개발/운영 README.md 작성 | `apps/api`, `apps/mobile`, `apps/admin`, `run_port.sh`, `README.md` | 사용자 요청: API 전방위 Any Host/PNA 허용, Vite /api 프록시 연계, 개발 및 운영 종합 지침 README.md 수립 |
| **2026-10-16** | apps/api 전면 Vite Config 관리 체계 전환 (`vite.config.ts`) | `apps/api/vite.config.ts`, `apps/api/index.html`, `apps/api/package.json`, `run_port.sh` | 사용자 요청: API 서버를 3대 서비스 표준과 동일하게 `vite.config.ts`, `vite build`, `vite preview` 체계로 전면 전환 및 실시간 API 대시보드 탑재 |

