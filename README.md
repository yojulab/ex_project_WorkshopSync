# WorkshopSync (워크샵싱크)

> **실시간 워크샵 운영 & 참석자 인터랙션 올인원 플랫폼**  
> 모바일 최적화 참석자 앱(Toss & Kakao UX), 실시간 관리자 웹 포털, 고성능 REST API & SSE 스트리밍 엔진으로 구성된 3대 독립 서비스 모노레포 플랫폼입니다.

---

## 📑 목차
1. [시스템 아키텍처 및 포트 체계](#1-시스템-아키텍처-및-포트-체계)
2. [외부 도메인 / Any IP / Any Host 접속 규격](#2-외부-도메인--any-ip--any-host-접속-규격)
3. [개발 및 운영 환경 요구사항](#3-개발-및-운영-환경-요구사항)
4. [설치 및 컴파일 (Build)](#4-설치-및-컴파일-build)
5. [서비스 실행 및 운영 관리 (run_port.sh)](#5-서비스-실행-및-운영-관리-run_portsh)
6. [환경 변수 설정 가이드 (.env)](#6-환경-변수-설정-가이드-env)
7. [의뢰자 소통용 UI inspect 뱃지 시스템](#7-의뢰자-소통용-ui-inspect-뱃지-시스템)
8. [WorkshopSync 10대 비즈니스 골든 룰](#8-workshopsync-10대-비즈니스-골든-룰)
9. [모노레포 디렉토리 구조](#9-모노레포-디렉토리-구조)
10. [운영 트러블슈팅 및 로그 모니터링](#10-운영-트러블슈팅-및-로그-모니터링)

---

## 1. 시스템 아키텍처 및 포트 체계

WorkshopSync는 **포트 30015부터 시작하는 3대 독립 서비스 규격**을 엄격히 준수합니다. 각 서비스는 독립 빌드 및 개별 기동이 가능하며, 상호 통신은 REST API(`/api/v1`) 및 SSE(Server-Sent Events) 스트림으로만 수행됩니다.

| 포트 | 서비스명 | 디렉토리 | 기술 스택 | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| **`30015`** | **REST API 서버** | `apps/api` | Node.js, Express, TypeScript, SSE | 비즈니스 로직, 데이터 영속화, 실시간 SSE 스트림 브로드캐스트 |
| **`30016`** | **참석자 전용 앱** | `apps/mobile` | React 18, Vite, PWA, CSS Modules | 토스풍 UX(여백/큰글씨/CTA) + 카카오톡식 5대 하단 탭, max-width 480px |
| **`30017`** | **관리자 웹 포털** | `apps/admin` | React 18, Vite, Desktop Web | 워크샵 마스터 CRUD, 참석자/조 편성, 미션/투표/시상 원스크린 관제 |
| `-` | **공통 라이브러리** | `packages/shared` | TypeScript | 도메인 모델(12대 스키마), 공통 상수, 유효성 검증 규칙, Mock 시드 데이터 |

---

## 2. 외부 도메인 / Any IP / Any Host 접속 규격

운영 및 개발 시 사내 프라이빗 IP, 클라우드 호스트, 도메인 역방향 프록시(`eighth.axfoundly.com`, Cloudflare, Nginx 등) 환경에서 차단 없이 접속할 수 있도록 전방위 Any Host/IP 체계가 적용되어 있습니다.

### 주요 반영 사항
1. **Vite 5.4.12+ Host Header 차단 해제**:
   - `apps/mobile/vite.config.ts` 및 `apps/admin/vite.config.ts`의 `server.allowedHosts: true`, `preview.allowedHosts: true` 적용
   - `Blocked request. This host ("...") is not allowed` 오류를 원천 차단하고 임의 도메인/IP 접속 허용
2. **0.0.0.0 바인딩 및 전방위 CORS / PNA 지원**:
   - API 및 Vite 웹 서버 모두 `0.0.0.0` 인터페이스 바인딩
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`
   - `Access-Control-Allow-Headers: *`
   - `Access-Control-Allow-Private-Network: true` (최신 크롬 브라우저의 로컬/프라이빗 네트워크 API 호출 차단 방지)
3. **프론트엔드 내장 `/api` 리버스 프록시**:
   - 참석자 앱(`30016`) 및 관리자 포털(`30017`) 접근 시, 동일 도메인의 `/api` 경로 요청이 내부 API 서버(`30015`)로 자동 전달되어 포트 노출 없이도 단일 포트 통신 가능
4. **Any Port 동적 바인딩 지원**:
   - 환경 변수(`PORT`, `API_PORT`, `MOBILE_PORT`, `ADMIN_PORT`) 지정 시 기본 30015~30017 포트 외 임의 포트로 유연하게 기동 가능

---

## 3. 개발 및 운영 환경 요구사항

- **Node.js**: `v18.18.0` 이상 (LTS `v20.x` 권장)
- **npm**: `v9.x` 이상 (워크스페이스 모노레포 지원)
- **운영체제**: Linux (Ubuntu 20.04+, Debian, RHEL), macOS, Windows WSL2
- **권장 유틸리티**: `curl`, `fuser` (또는 `lsof`, `netstat`)

---

## 4. 설치 및 컴파일 (Build)

### 4.1 의존성 설치
프로젝트 루트 디렉토리에서 전체 모노레포 패키지를 일괄 설치합니다:
```bash
npm install
```

### 4.2 컴파일 및 빌드 스크립트 (`compile.sh`)
통합 컴파일러를 통해 의존성 순서(`@workshopsync/shared` -> `apps/*`)에 맞춰 안정적으로 빌드합니다.

```bash
# 전체 서비스 일괄 컴파일 (shared + API + Mobile + Admin)
./compile.sh all
# 또는
. compile.sh all

# 공통 라이브러리만 단독 컴파일
./compile.sh shared

# 개별 서비스 컴파일
./compile.sh 30015   # REST API 서버 컴파일 (tsc)
./compile.sh 30016   # 참석자 모바일 앱 컴파일 (vite build)
./compile.sh 30017   # 관리자 웹 포털 컴파일 (vite build)
```

---

## 5. 서비스 실행 및 운영 관리 (run_port.sh)

루트에 위치한 `run_port.sh` 스크립트를 통해 3대 독립 서비스를 손쉽게 기동, 중지, 재시작, 상태 점검할 수 있습니다.

### 5.1 주요 명령어 요약

| 목적 | 명령어 | 설명 |
| :--- | :--- | :--- |
| **운영 모드 전체 기동** | `./run_port.sh all`<br>`./run_port.sh start all` | 프로덕션 모드로 30015, 30016, 30017 일괄 백그라운드 기동 |
| **개발 모드 전체 기동** | `./run_port.sh dev all` | HMR(Hot Module Replacement) 지원 개발 모드로 기동 |
| **전체 서비스 중지** | `./run_port.sh stop all` | 30015, 30016, 30017 포트 점유 프로세스 안전 종료 |
| **전체 서비스 재시작** | `./run_port.sh restart all` | 프로세스 안전 종료 후 프로덕션 모드로 재기동 |
| **서비스 상태 점검** | `./run_port.sh status` | 포트 가동 여부, PID, 접속 URL 실시간 확인 |

### 5.2 개별 서비스 단위 제어
특정 서비스만 선택하여 제어할 수 있습니다:
```bash
# API 서버 (30015)만 제어
./run_port.sh start 30015
./run_port.sh stop 30015
./run_port.sh restart 30015

# 참석자 앱 (30016)만 제어
./run_port.sh start 30016
./run_port.sh stop 30016

# 관리자 포털 (30017)만 제어
./run_port.sh start 30017
./run_port.sh stop 30017
```

### 5.3 표준 접속 URL
서비스 기동 후 브라우저를 통해 아래 주소로 접속합니다:
- **참석자 전용 앱 (PWA)**: `http://<서버IP_또는_도메인>:30016`
- **관리자 웹 포털**: `http://<서버IP_또는_도메인>:30017`
- **REST API 루트 및 헬스체크**: `http://<서버IP_또는_도메인>:30015/api/v1/health`

---

## 6. 환경 변수 설정 가이드 (.env)

기본적으로 별도의 `.env` 파일 없이도 표준 규격(포트 30015, 30016, 30017)으로 즉시 작동하도록 설계되어 있습니다. 포트 변경이나 외부 바인딩이 필요한 경우 환경 변수를 지정할 수 있습니다.

### API 서버 (`apps/api`)
```env
PORT=30015               # API 서버 리슨 포트 (기본값: 30015)
HOST=0.0.0.0             # 리슨 바인딩 호스트 (기본값: 0.0.0.0)
NODE_ENV=production      # 실행 환경 (production | development)
```

### 참석자 모바일 앱 (`apps/mobile`)
```env
PORT=30016               # 모바일 앱 웹서버 포트 (기본값: 30016)
VITE_PORT=30016          # Vite 바인딩 포트
API_PORT=30015           # 연동할 백엔드 API 포트 (프록시 대상)
```

### 관리자 웹 포털 (`apps/admin`)
```env
PORT=30017               # 관리자 웹 포털 포트 (기본값: 30017)
VITE_ADMIN_PORT=30017    # Vite 바인딩 포트
API_PORT=30015           # 연동할 백엔드 API 포트 (프록시 대상)
```

---

## 7. 의뢰자 소통용 UI inspect 뱃지 시스템

의뢰자와 개발팀 간 정밀하고 신속한 피드백 소통을 위해 **UI inspect 시스템**이 프론트엔드 전반에 탑재되어 있습니다.

### 사용 방법
1. **토글 단축키**: 화면 어디서나 **`Alt + I`**를 누르면 모든 주요 UI 요소 위에 일련번호 뱃지가 표시/숨김 처리됩니다.
2. **원클릭 복사**: 뱃지를 클릭하면 클립보드에 의뢰자 보고용 **4대 핵심 정보**가 정돈된 포맷으로 즉시 복사됩니다.
   ```text
   [S07-SEC02-BTN01] S-07 미션 상세/제출 (URI: #/missions/m-01, 항목: 최종 결과물 제출 버튼)
   ```
3. **일련번호 체계**:
   - 모바일 참석자 앱: `[Sxx-SECxx-xxx]` (예: `[S01-SEC01-BTN01]`, `[S07-SEC02-INP01]`)
   - 관리자 웹 포털: `[Axx-SECxx-xxx]` (예: `[A01-SEC01-BTN01]`, `[A04-SEC01-TBL01]`)

---

## 8. WorkshopSync 10대 비즈니스 골든 룰

WorkshopSync의 모든 모듈과 API는 아래 10대 비즈니스 골든 룰을 철저히 준수합니다:

1. **자기 조 투표 엄격 차단**: 본인이 속한 조의 제출물에는 투표할 수 없으며, UI 상 비활성화 및 서버 400 차단이 이중 적용됩니다.
2. **실시간 득표수 비공개 (블라인드 투표)**: 투표 진행 중에는 참석자 화면에 실시간 득표수가 공개되지 않으며, 관리자가 '순위 공개'를 승인한 시점에만 공개됩니다.
3. **마감 시간 후 업로드 엄격 차단**: 미션 마감 시각이 경과하면 제출 버튼이 비활성화되며 서버에서 업로드가 즉시 거부됩니다.
4. **체크인 멱등성 보존**: 참석자가 중복 체크인을 시도하더라도 최초 체크인 일시(`checkedInAt`)가 영구 보존됩니다.
5. **조별 제출물 단일화 및 버전 관리**: 1개 조당 미션별 단 1개의 공식 제출물만 허용되며, 재제출 시 버전(`v1`, `v2`, ...)이 자동 증가합니다.
6. **토스풍 하단 고정 풀폭 CTA**: 모바일 폼 작성 시 하단 고정 100% 폭 CTA 버튼으로 엄지손가락 터치 동선을 극대화합니다.
7. **카카오톡식 5대 하단 탭**: `홈` · `미션` · `결과물` · `투표/순위` · `알림` 구조로 사용자가 1초 만에 주요 기능으로 이동합니다.
8. **SSE 실시간 브로드캐스트**: 투표 개시, 미션 등록, 공지 알림이 Server-Sent Events를 통해 새로고침 없이 참석자 앱으로 즉시 푸시됩니다.
9. **컨페티 우승 축하 화면**: 관리자의 최종 시상식 발표 시 전 참석자 앱에 컨페티(꽃가루) 애니메이션과 함께 우승팀 축하 카드가 노출됩니다.
10. **관리자 원스크린 종합 관제**: 워크샵 현황, 체크인율, 미션 제출 현황, 투표 참여율을 한 화면에서 실시간으로 모니터링합니다.

---

## 9. 모노레포 디렉토리 구조

```text
ex_project_WorkshopSync/
├── apps/
│   ├── api/                      # [Port 30015] REST API & SSE 스트리밍 서버
│   │   ├── src/index.ts          # API 엔드포인트 및 인메모리/MongoDB 라우터
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── mobile/                   # [Port 30016] 참석자 전용 PWA 앱
│   │   ├── src/                  # App.tsx (S-01 ~ S-13 화면), index.css
│   │   ├── vite.config.ts        # allowedHosts: true, /api 프록시 연계
│   │   └── package.json
│   └── admin/                    # [Port 30017] 관리자 데스크톱 웹 포털
│       ├── src/                  # App.tsx (A-01 ~ A-09 관제 화면), index.css
│       ├── vite.config.ts        # allowedHosts: true, /api 프록시 연계
│       └── package.json
├── packages/
│   └── shared/                   # 모노레포 공통 패키지 (@workshopsync/shared)
│       ├── src/
│       │   ├── types/            # 12대 MongoDB/도메인 타입 정의
│       │   ├── models/           # 비즈니스 규칙 및 검증 엔진
│       │   ├── mocks/            # 초기 시드 데이터
│       │   └── index.ts
│       └── package.json
├── logs/                         # 서비스 실행 로그 (workshopsync_*.log)
├── compile.sh                    # 통합 빌드/컴파일 스크립트
├── run_port.sh                   # 통합 서비스 수명주기 매니저
├── GEMINI.md                     # 하네스 헌장 및 아키텍처 규칙
├── AGENTS.md                     # 에이전트 행동 강령
└── README.md                     # 본 문서
```

---

## 10. 운영 트러블슈팅 및 로그 모니터링

### 10.1 로그 실시간 모니터링
기동된 서비스의 로그는 `logs/` 디렉토리에 일자별로 자동 저장됩니다:
```bash
# REST API 로그 실시간 확인
tail -f logs/workshopsync_api_$(date +%Y%m%d).log

# 참석자 앱 로그 실시간 확인
tail -f logs/workshopsync_mobile_$(date +%Y%m%d).log

# 관리자 포털 로그 실시간 확인
tail -f logs/workshopsync_admin_$(date +%Y%m%d).log
```

### 10.2 포트 충돌(Port Conflict) 시 조치
기존 프로세스가 비정상 종료되어 포트가 잠겨있는 경우:
```bash
# 전체 서비스 중지 스크립트 실행
./run_port.sh stop all

# 특정 포트 강제 점유 해제 (필요시)
fuser -k 30015/tcp 30016/tcp 30017/tcp 2>/dev/null || true

# 서비스 재기동
./run_port.sh restart all
```

### 10.3 외부 호스트 접속 시 Blocked Request 오류 발생 시
- 증상: `Blocked request. This host ("...") is not allowed`
- 해결: `apps/mobile/vite.config.ts` 및 `apps/admin/vite.config.ts`의 `allowedHosts: true`가 설정되어 있는지 확인하고, `./compile.sh all && ./run_port.sh restart all`을 수행합니다.

---

### 💡 기여 및 지원
시스템 문의 및 이슈 보고는 프로젝트 이슈 트래커 또는 슬랙 `#workshopsync-ops` 채널을 이용해 주시기 바랍니다.
