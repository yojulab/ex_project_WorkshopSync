# 의뢰자 소통용 UI 일련번호 태깅 & 인스펙션 뱃지 시스템 규격
## (Client-Agent UI Tagging & Inspection System for WorkshopSync)

- **적용 대상**: `apps/mobile/` (참석자 전용 앱, Port 30016), `apps/admin/` (관리자 웹 포털, Port 30017)
- **적용 목적**: 의뢰자(기획사/운영자/클라이언트)와 AI 에이전트/개발자 간의 피드백 소통 시, 모호한 묘사 대신 **화면(Page)과 UI 요소(Tag/Element)의 고유 일련번호**를 기반으로 100% 오차 없는 정밀한 커뮤니케이션을 실현함.

---

## 1. 일련번호 부여 규칙 (Serial Numbering Convention)

모든 페이지 및 대화형 UI 요소는 아래 표준 포맷에 따라 유일한 식별 코드를 부여합니다.

### 1-1. 전체 식별자 구조
```text
[화면코드]-[섹션코드]-[태그/요소코드]
예시: S07-SEC02-BTN01
```

### 1-2. 코드 구성 규칙

| 단위 | 코드 체계 | 규칙 및 예시 |
| :--- | :--- | :--- |
| **참석자 앱 화면** | `S{01~13}-{화면명}` | - `S01-LOGIN`: 입장/인증 (코드/QR/이름/전화번호)<br>- `S02-CHECKIN`: 참석 체크인 (애니메이션)<br>- `S03-HOME`: 홈 대시보드 (아젠다/미션/공지 요약)<br>- `S04-INFO`: 워크샵 정보 (일시/장소/조편성/준비물)<br>- `S05-AGENDA`: 아젠다 타임라인 (진행중 강조)<br>- `S06-MISSION`: 미션 목록/상세 (마감 카운트다운)<br>- `S07-UPLOAD`: 작업물 업로드 (미리보기/진행률/CTA)<br>- `S08-DASHBOARD`: 제출 현황 대시보드 (진행률 바)<br>- `S09-GALLERY`: 결과물 같이보기 & 피드백 메모<br>- `S10-VOTE`: 선호도 투표 (자기조 제외/바텀시트)<br>- `S11-RANKING`: 선호도 순위 (집계/공개)<br>- `S12-CELEBRATE`: 우승/최고작업자 축하 화면 (컨페티)<br>- `S13-NOTI`: 알림함 (인앱 알림/읽음 처리) |
| **관리자 웹 화면** | `A{01~09}-{기능명}` | - `A01-ADMIN-LOGIN`: 관리자 로그인<br>- `A02-WORKSHOP-MGMT`: 워크샵 마스터 CRUD<br>- `A03-AGENDA-MISSION`: 아젠다 & 미션 관리<br>- `A04-PARTICIPANT-TEAM`: 참석자 CSV 임포트 & 조 편성<br>- `A05-SUBMISSION-MONITOR`: 실시간 제출 현황 모니터링<br>- `A06-VOTING-OPS`: 투표 시작/마감 & 순위 공개 제어<br>- `A07-AWARD-DISPATCH`: 우승/최고작업자 시상 & 알림 발송<br>- `A08-ANNOUNCEMENT`: 실시간 공지/알림 발송<br>- `A09-REPORT-EXPORT`: 결과 리포트 CSV 내보내기 |
| **섹션 (Section)** | `SEC{01~99}-{영역}` | - `SEC01-HEADER`: 상단 네비게이션/헤더<br>- `SEC02-CTA-FIXED`: 하단 고정 풀폭 CTA 영역 (토스 감성)<br>- `SEC03-CARD-GRID`: 카드 그리드 목록 영역<br>- `SEC04-PREVIEW-PANEL`: 업로드 파일 미리보기 영역<br>- `SEC05-BOTTOM-SHEET`: 바텀시트 확인 모달 영역<br>- `SEC06-FEEDBACK-INPUT`: 카톡식 하단 1줄 피드백 입력창 |
| **요소/태그 (Tag)** | `{타입약어}{01~99}` | - `BTN01`: 버튼 (Button - 하단 CTA 등)<br>- `INP01`: 입력창 (Input Text)<br>- `TAB01`: 하단 5대 탭 아이템 (Tab Item)<br>- `CRD01`: 카드 컴포넌트 (Card)<br>- `MOD01`: 모달/바텀시트 (Modal / BottomSheet)<br>- `BDG01`: 뱃지/라벨 (Badge)<br>- `LST01`: 리스트 아이템 (List Item) |

---

## 2. 단축키 인스펙션 뱃지 기능 규격

모든 프론트엔드 빌드 시 아래 인스펙션 오버레이 메커니즘을 내장합니다.

### 2-1. 단축키 토글 (Toggle Shortcut)
- **전역 단축키**: **`Alt + I`** (Inspection의 I) 또는 **`Ctrl + Shift + T`**
- **동작**:
  - 기본 상태: 비활성화 (운영/학습자 뷰에 방해되지 않도록 숨김).
  - 단축키 입력 시: 화면의 모든 태그에 부여된 시각적 뱃지가 부드러운 페이드인 애니메이션과 함께 즉시 표시됨. 재입력 시 숨김.

### 2-2. 뱃지 시각 스타일 (Badge Styling)
- **위치**: 해당 태그 요소의 좌상단(Top-Left)에 떠 있는 플로팅 핀 형태.
- **디자인**: 토스 블루 / 딥 바이올렛 배경, 흰색 텍스트, 11px 폰트, 둥근 모서리(border-radius: 4px).
- **마우스 호버**: 스케일 1.1배 확대 및 `"클릭 시 4대 정보 복사"` 툴팁 노출.

### 2-3. 원클릭 클립보드 복사 (Click to Copy)
- **동작**:
  1. 의뢰자가 수정하고 싶은 요소의 일련번호 뱃지를 마우스로 클릭.
  2. 클립보드에 **4대 필수 정보(일련번호, 페이지명, URI, 항목명)**가 정돈된 포맷으로 즉시 복사됨 (`navigator.clipboard.writeText`).
     ```text
     - 일련번호: S07-SEC02-BTN01
     - 페이지명: WorkshopSync 작업물 업로드
     - URI: http://localhost:30016/missions/m1/upload
     - 항목명: 최종 작업물 제출하기
     ```
  3. 뱃지 라벨이 1.2초간 녹색 **`[Copied! ✓]`**로 바뀌며 하단에 상세 토스트 알림 발생(`📋 [S07-SEC02-BTN01] 정보 복사 완료! (일련번호/페이지/URI/항목명)`).

---

## 3. 의뢰자-에이전트 협업 소통 시나리오

```text
[의뢰자 (기획자 / 클라이언트)]
  1. Alt + I 를 눌러 화면의 인스펙션 뱃지를 켠다.
  2. 수정하고 싶은 버튼의 뱃지를 클릭한다 -> 일련번호, 페이지명, URI, 항목명이 클립보드 자동 복사.
  3. 채팅창에 붙여넣기(Ctrl+V)하여 요청:
     - 일련번호: S10-SEC02-BTN01
     - 페이지명: 선호도 투표 화면
     - URI: http://localhost:30016/vote
     - 항목명: 투표 확정 바텀시트 확인 버튼
     "위 버튼의 라벨을 '이 조에 1표 투표하기'로 바꾸고 하단 마진을 8px 늘려주세요."

[AI 에이전트]
  1. 'S10-SEC02-BTN01' 및 제공된 URI/페이지명을 통해 해당 파일/엘리먼트를 즉시 추적.
  2. 오차 없이 정확한 컴포넌트의 해당 엘리먼트를 특정하여 0.1초 만에 수정 완료.
```

---

## 4. 프론트엔드 공통 인스펙션 스크립트 규격 (`uiTagHelper.ts`)

참석자 앱(`apps/mobile`, 30016) 및 관리자 웹(`apps/admin`, 30017)에 공통 적용되는 헬퍼:

```typescript
// uiTagHelper.ts — 의뢰자 소통용 UI 일련번호 인스펙션 엔진
export function initUiInspector() {
  let isInspectMode = false;
  
  // 1. 단축키 리스너 (Alt + I 또는 Ctrl + Shift + T)
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.altKey && e.key.toLowerCase() === 'i') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't')) {
      e.preventDefault();
      isInspectMode = !isInspectMode;
      document.body.classList.toggle('ui-inspect-active', isInspectMode);
      showToast(isInspectMode ? '🔍 UI 일련번호 뱃지 활성화 (Alt+I로 닫기)' : 'UI 일련번호 뱃지 숨김');
    }
  });

  // 2. 뱃지 클릭 시 4대 정보 클립보드 복사
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const badge = target.closest('.ui-serial-badge') as HTMLElement | null;
    if (!badge) return;
    e.preventDefault();
    e.stopPropagation();

    const serialId = badge.getAttribute('data-serial-id') || badge.innerText;
    const pageName = document.title || '페이지';
    const uri = window.location.href;
    const container = badge.parentElement;
    let itemName = badge.getAttribute('data-item-name') || container?.getAttribute('data-item-name') || '';
    if (!itemName && container) {
      const clone = container.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.ui-serial-badge').forEach(b => b.remove());
      itemName = (clone.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 40);
    }
    if (!itemName) itemName = serialId;

    const copyText = [
      `- 일련번호: ${serialId}`,
      `- 페이지명: ${pageName}`,
      `- URI: ${uri}`,
      `- 항목명: ${itemName}`
    ].join('\n');

    navigator.clipboard.writeText(copyText).then(() => {
      const originalText = badge.innerText;
      badge.innerText = 'Copied! ✓';
      badge.classList.add('copied');
      setTimeout(() => {
        badge.innerText = originalText;
        badge.classList.remove('copied');
      }, 1200);
      showToast(`📋 [${serialId}] 정보 복사 완료! (일련번호/페이지/URI/항목명)`);
    });
  });

  function showToast(msg: string) {
    let toast = document.getElementById('ui-tagger-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ui-tagger-toast';
      document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.className = 'ui-toast-show';
    setTimeout(() => { if (toast) toast.className = ''; }, 2200);
  }
}
```

---

## 5. 하네스 에이전트 준수 가이드라인

1. **Toss & Kakao UX Specialist**:
   - `apps/mobile/` 컴포넌트 마크업 시 모든 주요 태그에 `data-serial-id="S07-SEC02-BTN01"` 및 일련번호 뱃지 마크업을 기본 구조로 반영하도록 스펙을 설계한다.
2. **Admin Operations Specialist**:
   - `apps/admin/`의 테이블, 액션 버튼, 모달에 `data-serial-id="A04-SEC01-BTN01"` 등의 일련번호 앵커를 설계한다.
3. **Quality & Playwright E2E Assurer**:
   - Playwright 자동화 테스트(T-01~T-13) 작성 시 깨지기 쉬운 CSS 셀렉터 대신 `data-serial-id` 속성을 1순위 테스트 셀렉터(`[data-serial-id="..."]`)로 채택하여 테스트 안정성을 극대화한다.
