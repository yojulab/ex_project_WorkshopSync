# AGENTS.md — 에이전트 팀 행동 강령 및 표준 지침

본 워크스페이스는 [GEMINI.md](file:///apps/ex_project_WorkshopSync/GEMINI.md), [.agents/rules/harness-engineering.md](file:///apps/ex_project_WorkshopSync/.agents/rules/harness-engineering.md), [.agents/rules/workshop-domain.md](file:///apps/ex_project_WorkshopSync/.agents/rules/workshop-domain.md), [.agents/rules/workshop-terminology.md](file:///apps/ex_project_WorkshopSync/.agents/rules/workshop-terminology.md), [.agents/rules/ui-tagging-inspection.md](file:///apps/ex_project_WorkshopSync/.agents/rules/ui-tagging-inspection.md), [.agents/rules/git-workflow.md](file:///apps/ex_project_WorkshopSync/.agents/rules/git-workflow.md)에 정의된 하네스 엔지니어링 체계를 따릅니다.

---

## 1. 에이전트 필수 준수 사항

1. **상시 룰 참조**:
   - 작업을 시작하기 전 반드시 [GEMINI.md](file:///apps/ex_project_WorkshopSync/GEMINI.md), 도메인 룰([.agents/rules/workshop-domain.md](file:///apps/ex_project_WorkshopSync/.agents/rules/workshop-domain.md)), 워크샵 용어 및 비즈니스 룰([.agents/rules/workshop-terminology.md](file:///apps/ex_project_WorkshopSync/.agents/rules/workshop-terminology.md)), UI 태깅 인스펙션 룰([.agents/rules/ui-tagging-inspection.md](file:///apps/ex_project_WorkshopSync/.agents/rules/ui-tagging-inspection.md)), Git 워크플로우 룰([.agents/rules/git-workflow.md](file:///apps/ex_project_WorkshopSync/.agents/rules/git-workflow.md))을 준수한다.
2. **포트 30015부터 시작하는 3대 독립 서비스 규격 엄수**:
   - **`30015`**: REST API 서버 (`apps/api`)
   - **`30016`**: 참석자 전용 앱 (`apps/mobile` PWA)
   - **`30017`**: 관리자 웹 포털 (`apps/admin`)
   - 세 서비스는 독립적으로 빌드/기동되며 통신은 REST API (`/api/v1`) 및 SSE 스트림으로만 수행한다.
3. **의뢰자 소통용 UI 일련번호 태깅 및 4대 정보 뱃지 복사 규정 준수**:
   - 모든 화면과 주요 인터랙션 태그 요소에 고유 일련번호(`[S07-SEC02-BTN01]`, `[A04-SEC01-BTN01]`)를 부여하여 의뢰자와 정밀하게 소통한다.
   - 단축키 **`Alt + I`**로 뱃지 표시/숨김 토글을 지원하고, 뱃지 클릭 시 **4대 핵심 정보(일련번호, 페이지명, URI, 항목명)**가 클립보드에 정돈되어 복사(`[Copied! ✓]`)되도록 설계 및 검증한다.
4. **WorkshopSync 10대 비즈니스 골든 룰 엄수**:
   - 자기 조 투표 불가, 실시간 득표수 비공개(순위 공개 전 블라인드), 마감 시간 후 업로드 엄격 차단, 체크인 최초 시각 보존, 조별 제출물 단일화 및 버전 관리, 토스풍 하단 고정 풀폭 CTA, 카카오톡식 5대 하단 탭(`홈`·`미션`·`결과물`·`투표/순위`·`알림`), SSE 실시간 푸시 & 컨페티 우승 축하 화면을 절대 준수한다.
5. **기획/아키텍처 단계 준수 (비개발 원칙)**:
   - **본 단계에서는 소스코드 개발을 진행하지 않습니다.**
   - 개발팀, 기획팀, 인프라팀이 상호 합의하고 즉시 스프린트에 착수할 수 있도록 아키텍처 다이어그램, DDL/스키마, WBS, 인터페이스 명세, 테스트 시나리오 기획에 집중합니다.
6. **알맞은 업무 종료 시 Git Commit 필수화**:
   - 모든 에이전트는 기획/아키텍처 문서 생성, 스펙 갱신, 검증 완료 등 유의미한 작업 단위 완료 시 **반드시 원자적 Git Commit을 수행**한다.
   - 커밋 메시지 컨벤션을 준수하며, `.env` 등 민감 파일이 스테이징되지 않도록 사전 점검한다.
7. **역할과 스킬의 분리**:
   - 에이전트는 본인의 정의된 책임(Who) 범위를 벗어나지 않는다.
   - 구체적인 실행 절차(How)는 `.agents/skills/`에 정의된 스킬 가이드를 따른다.
8. **루프 엔지니어링과 상태 영속화**:
   - 반복 루프 작업 수행 시 세션 메모리에 의존하지 않고, 항상 디스크의 상태 파일([.agents/loop/state.json](file:///apps/ex_project_WorkshopSync/.agents/loop/state.json), [.agents/loop/task.md](file:///apps/ex_project_WorkshopSync/.agents/loop/task.md))과 Git 커밋에 진행 상황을 원자적으로 기록한다.
   - 사전에 정의된 검증 기준과 완료 약속(Completion Promise)이 기계적으로 입증되었을 때에만 약속 토큰을 출력하고 종료한다.
9. **무한 폴링 금지**:
   - 백그라운드 태스크나 메시지를 기다릴 때 루프를 돌며 상태를 조회하지 않는다. Antigravity의 반응형 웨이크업(Reactive Wakeup) 시스템에 맡기고 도구 호출을 종료한다.
10. **자가 진화 참여**:
    - 작업 완료 후 오류 패턴이나 사용자 피드백이 발생하면 [harness-evolve](file:///apps/ex_project_WorkshopSync/.agents/skills/harness-evolve/SKILL.md) 스킬을 통해 시스템 지식으로 일반화하여 환류한다.
