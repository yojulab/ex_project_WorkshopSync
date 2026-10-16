#!/usr/bin/env bash
# ==============================================================================
# WorkshopSync - 포트 관리 및 컴파일 통합 스크립트 (run_port.sh)
#
# [포트 할당 체계 (Port 30015부터 시작)]
#   • 30015 : REST API 서버      (apps/api    - Node.js/Express)
#   • 30016 : 참석자 전용 앱     (apps/mobile - React 18 PWA)
#   • 30017 : 관리자 웹 포털     (apps/admin  - React 18 Web)
#
# [사용법]
#   ./run_port.sh [명령어] [대상]
#   ./compile.sh  [대상]             (컴파일 단축 실행)
#
# [주요 명령어]
#   • start (또는 prod) [all|30015|30016|30017] : 운영 모드 기동 (기본값)
#   • dev               [all|30015|30016|30017] : 개발 모드(HMR) 기동
#   • build (또는 compile) [all|30015|30016|30017] : 컴파일 / 빌드
#   • stop              [all|30015|30016|30017] : 서비스 종료
#   • restart           [all|30015|30016|30017] : 재시작
#   • status                                    : 포트 가동 상태 점검
#
# [간편 축약 실행 예시]
#   • ./run_port.sh all             -> 전체 서비스 운영 모드 기동
#   • ./run_port.sh 30015           -> 30015 단일 API 운영 모드 기동
#   • ./compile.sh all              -> 전체 서비스 일괄 컴파일
#   • ./run_port.sh stop all        -> 전체 서비스 일괄 중지
#   • ./run_port.sh status          -> 현재 포트 및 PID 점검
# ==============================================================================

set -uo pipefail

# source(.)로 호출되었는지 검사하여 터미널 강제 종료 방지
(return 0 2>/dev/null) && _RUN_PORT_SOURCED=1 || _RUN_PORT_SOURCED=0

safe_exit() {
  local code=${1:-0}
  if [ "$_RUN_PORT_SOURCED" -eq 1 ]; then
    return "$code" 2>/dev/null || true
  else
    exit "$code"
  fi
}

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${PROJECT_DIR}/logs"
TODAY=$(date +"%Y%m%d")
mkdir -p "$LOG_DIR"

# 기본 포트 및 환경변수(any port) 바인딩 지원
API_PORT="${API_PORT:-30015}"
MOBILE_PORT="${MOBILE_PORT:-${VITE_PORT:-30016}}"
ADMIN_PORT="${ADMIN_PORT:-${VITE_ADMIN_PORT:-30017}}"

# 터미널 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# 하위 워크스페이스 .bin 심볼릭 링크 자동 점검 및 복원 (vite / tsc : not found 방지)
ensure_bin_links() {
  local root_bin="${PROJECT_DIR}/node_modules/.bin"
  if [ -d "$root_bin" ]; then
    for sub in apps/mobile apps/admin apps/api packages/shared; do
      if [ -d "${PROJECT_DIR}/${sub}" ]; then
        mkdir -p "${PROJECT_DIR}/${sub}/node_modules"
        if [ ! -e "${PROJECT_DIR}/${sub}/node_modules/.bin" ]; then
          ln -s "../../../node_modules/.bin" "${PROJECT_DIR}/${sub}/node_modules/.bin" 2>/dev/null || true
        fi
      fi
    done
  fi
}
ensure_bin_links

# 포트 활성 여부 점검 (fuser 및 python3 초고속 안전망)
is_port_in_use() {
  local port=$1
  if command -v fuser >/dev/null 2>&1; then
    if fuser "${port}/tcp" >/dev/null 2>&1; then
      return 0
    fi
  fi
  if command -v python3 >/dev/null 2>&1; then
    if python3 -c "import socket; s=socket.socket(); s.settimeout(0.1); exit(0 if s.connect_ex(('127.0.0.1', ${port}))==0 else 1)" 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

# 안전 PID 필터: 현재 셸($$), 부모 셸($PPID), init(1) 등 보호 대상 제외
filter_safe_pids() {
  local raw_pids="$1"
  local my_pid=$$
  local parent_pid=${PPID:-0}
  local safe_list=""

  for p in $raw_pids; do
    if [[ "$p" =~ ^[0-9]+$ ]]; then
      if [ "$p" -ne 1 ] && [ "$p" -ne "$my_pid" ] && [ "$p" -ne "$parent_pid" ]; then
        safe_list="${safe_list} ${p}"
      fi
    fi
  done
  echo "$safe_list" | xargs
}

# 포트 점유 PID 획득 (fuser -> PID 파일 -> 정밀 pgrep 순차 확인 및 안전 필터 적용)
get_port_pids() {
  local port=$1
  local pids=""

  # 1. fuser로 해당 포트 TCP 리스닝 프로세스 PID 확인
  if command -v fuser >/dev/null 2>&1; then
    pids=$(fuser "${port}/tcp" 2>/dev/null || true)
  fi

  # 2. PID 파일 확인
  if [ -z "$pids" ]; then
    local meta
    meta=$(get_service_meta "$port")
    local ws_path
    ws_path=$(echo "$meta" | cut -d: -f1)
    local sname
    sname=$(basename "$ws_path")
    local pid_file="${LOG_DIR}/${sname}.pid"
    if [ -f "$pid_file" ]; then
      local saved_pid
      saved_pid=$(cat "$pid_file" 2>/dev/null || true)
      if [ -n "$saved_pid" ] && kill -0 "$saved_pid" 2>/dev/null; then
        pids="$saved_pid"
      fi
    fi
  fi

  # 3. 정밀 pgrep fallback (터미널 셸/에디터 등이 오폭되지 않도록 정밀 한정)
  if [ -z "$pids" ]; then
    case "$port" in
      "$API_PORT"|30015) pids=$(pgrep -f "node.*(${port}|apps/api/dist)" 2>/dev/null || true) ;;
      "$MOBILE_PORT"|30016) pids=$(pgrep -f "vite.*(${port}|apps/mobile)" 2>/dev/null || true) ;;
      "$ADMIN_PORT"|30017) pids=$(pgrep -f "vite.*(${port}|apps/admin)" 2>/dev/null || true) ;;
      *) pids=$(pgrep -f "(node|vite).*${port}" 2>/dev/null || true) ;;
    esac
  fi

  # 4. 현재 터미널 셸($$), 부모 터미널($PPID) 절대 보호 필터링
  filter_safe_pids "$pids"
}

# 서비스 메타데이터 조회: 이름, 워크스페이스/폴더경로, 빌드산출물 파일
get_service_meta() {
  local port=$1
  case "$port" in
    "$API_PORT"|30015|api) echo "apps/api:REST API 서버 (Express):dist/index.js" ;;
    "$MOBILE_PORT"|30016|mobile) echo "apps/mobile:참석자 전용 앱 (React PWA):dist/index.html" ;;
    "$ADMIN_PORT"|30017|admin) echo "apps/admin:관리자 웹 포털 (React Web):dist/index.html" ;;
    *) echo "apps/mobile:커스텀 서비스:dist/index.html" ;;
  esac
}

# ------------------------------------------------------------------------------
# 1. 컴파일 (Build / Compile)
# ------------------------------------------------------------------------------
ensure_build_deps() {
  if [ -f "${PROJECT_DIR}/package.json" ] && [ ! -d "${PROJECT_DIR}/node_modules" ]; then
    echo -e "${YELLOW}⚠ 의존성 모듈 미설치 감지 → npm install 진행...${NC}"
    (cd "${PROJECT_DIR}" && npm install) || return 1
    ensure_bin_links
  fi
}

_SHARED_BUILT=0

build_shared() {
  if [ "$_SHARED_BUILT" -eq 1 ]; then
    return 0
  fi
  local shared_dir="${PROJECT_DIR}/packages/shared"
  if [ -d "$shared_dir" ] && [ -f "$shared_dir/package.json" ]; then
    ensure_build_deps || return 1
    echo -e "🔨 [공통 라이브러리] ${BOLD}@workshopsync/shared${NC} 컴파일 시작..."
    if (cd "$shared_dir" && npm run build); then
      echo -e "   ${GREEN}✓ [공통 라이브러리] 컴파일 완료${NC}\n"
      _SHARED_BUILT=1
      return 0
    else
      echo -e "   ${RED}✗ [공통 라이브러리] 컴파일 실패!${NC}\n"
      return 1
    fi
  fi
  return 0
}

build_service() {
  local port=$1
  local meta
  meta=$(get_service_meta "$port")
  local ws_path=$(echo "$meta" | cut -d: -f1)
  local title=$(echo "$meta" | cut -d: -f2)

  if [ ! -d "${PROJECT_DIR}/${ws_path}" ]; then
    echo -e "   ${YELLOW}ℹ [:${port}] ${title} 디렉토리(${ws_path})가 아직 준비되지 않았습니다. (스킵)${NC}\n"
    return 0
  fi

  ensure_build_deps || { echo -e "   ${RED}✗ 의존성 점검 실패${NC}"; return 1; }
  build_shared || { echo -e "   ${RED}✗ 공통 라이브러리 사전 빌드 실패${NC}"; return 1; }
  echo -e "🔨 [:${port}] ${BOLD}${title}${NC} 컴파일 시작..."

  if [ -f "${PROJECT_DIR}/${ws_path}/package.json" ]; then
    if (cd "${PROJECT_DIR}/${ws_path}" && npm run build); then
      echo -e "   ${GREEN}✓ [:${port}] 컴파일 완료${NC}\n"
      return 0
    else
      echo -e "   ${RED}✗ [:${port}] 컴파일 실패!${NC}\n"
      return 1
    fi
  else
    echo -e "   ${YELLOW}⚠ [:${port}] package.json이 없어 빌드를 건너뜁니다.${NC}\n"
    return 0
  fi
}

cmd_build() {
  local target=${1:-all}
  echo -e "${CYAN}=================================================================${NC}"
  echo -e "${CYAN} 📦 WorkshopSync 컴파일 매니저 (대상: ${target})${NC}"
  echo -e "${CYAN}=================================================================${NC}"

  case "$target" in
    shared)
      build_shared
      ;;
    "$API_PORT"|30015|api)    build_service "$API_PORT" ;;
    "$MOBILE_PORT"|30016|mobile) build_service "$MOBILE_PORT" ;;
    "$ADMIN_PORT"|30017|admin)  build_service "$ADMIN_PORT" ;;
    all)
      build_shared
      build_service "$API_PORT"
      build_service "$MOBILE_PORT"
      build_service "$ADMIN_PORT"
      echo -e "${GREEN}${BOLD}🎉 모든 서비스 컴파일 점검 완료!${NC}"
      ;;
    [0-9]*)
      build_service "$target"
      ;;
    *)
      echo -e "${RED}잘못된 대상입니다: ${target} (사용 가능: all, shared, ${API_PORT}, ${MOBILE_PORT}, ${ADMIN_PORT} 또는 임의 포트 번호)${NC}"
      safe_exit 1
      ;;
  esac
}

# ------------------------------------------------------------------------------
# 2. 프로세스 종료 (Stop)
# ------------------------------------------------------------------------------
stop_service() {
  local port=$1
  local meta
  meta=$(get_service_meta "$port")
  local ws_path
  ws_path=$(echo "$meta" | cut -d: -f1)
  local service_name
  service_name=$(basename "$ws_path")
  local pid_file="${LOG_DIR}/${service_name}.pid"
  local title
  title=$(echo "$meta" | cut -d: -f2)
  local pids
  pids=$(get_port_pids "$port")

  echo -n -e "🛑 [:${port}] ${title} 중지 중... "
  if [ -n "$pids" ]; then
    kill -15 $pids 2>/dev/null || true
    sleep 1
    local remain_pids
    remain_pids=$(get_port_pids "$port")
    if [ -n "$remain_pids" ]; then
      kill -9 $remain_pids 2>/dev/null || true
    fi
    rm -f "$pid_file" 2>/dev/null || true
    echo -e "${YELLOW}종료 완료 (PID: ${pids})${NC}"
  else
    rm -f "$pid_file" 2>/dev/null || true
    echo -e "${NC}실행 중인 프로세스 없음${NC}"
  fi
}

cmd_stop() {
  local target=${1:-all}
  case "$target" in
    "$API_PORT"|30015|api)    stop_service "$API_PORT" ;;
    "$MOBILE_PORT"|30016|mobile) stop_service "$MOBILE_PORT" ;;
    "$ADMIN_PORT"|30017|admin)  stop_service "$ADMIN_PORT" ;;
    all)
      stop_service "$API_PORT"
      stop_service "$MOBILE_PORT"
      stop_service "$ADMIN_PORT"
      ;;
    [0-9]*)
      stop_service "$target"
      ;;
    *)
      echo -e "${RED}잘못된 대상입니다: ${target}${NC}"
      safe_exit 1
      ;;
  esac
}

# ------------------------------------------------------------------------------
# 3. 서비스 기동 (Start / Prod / Dev)
# ------------------------------------------------------------------------------
start_service() {
  local port=$1
  local mode=$2 # prod | dev
  local meta
  meta=$(get_service_meta "$port")
  local ws_path=$(echo "$meta" | cut -d: -f1)
  local title=$(echo "$meta" | cut -d: -f2)
  local build_file=$(echo "$meta" | cut -d: -f3)
  local service_name=$(basename "$ws_path")
  local log_file="${LOG_DIR}/workshopsync_${service_name}_${TODAY}.log"
  local pid_file="${LOG_DIR}/${service_name}.pid"

  if [ ! -d "${PROJECT_DIR}/${ws_path}" ]; then
    echo -e "⚠️ [:${port}] ${title} 디렉토리(${ws_path})가 아직 생성되지 않았습니다."
    echo -e "   ※ 기획 및 상세 아키텍처 수립 단계이거나 구현 전 상태입니다."
    return 0
  fi

  # 운영 모드인데 빌드 산출물이 없으면 자동 컴파일 선행
  if [ "$mode" = "prod" ] && [ -n "$build_file" ] && [ ! -f "${PROJECT_DIR}/${ws_path}/${build_file}" ]; then
    echo -e "⚠️ [:${port}] 빌드 산출물이 없어 사전 컴파일을 자동 실행합니다..."
    build_service "$port" || return 1
  fi

  # 기존 점유 프로세스 정리
  stop_service "$port" >/dev/null 2>&1

  echo -e "🚀 [:${port}] ${BOLD}${title}${NC} 기동 중 (${mode} 모드)..."
  cd "${PROJECT_DIR}/${ws_path}"

  local actual_api_port="${API_PORT:-30015}"
  if [ "$mode" = "prod" ]; then
    nohup env NODE_ENV=production HOSTNAME="0.0.0.0" PORT="$port" API_PORT="$actual_api_port" VITE_PORT="$port" npm run start -- --host 0.0.0.0 --port "$port" > "$log_file" 2>&1 &
    local new_pid=$!
    echo "$new_pid" > "$pid_file"
  else
    nohup env NODE_ENV=development HOSTNAME="0.0.0.0" PORT="$port" API_PORT="$actual_api_port" VITE_PORT="$port" npm run dev -- --host 0.0.0.0 --port "$port" > "$log_file" 2>&1 &
    local new_pid=$!
    echo "$new_pid" > "$pid_file"
  fi

  cd "${PROJECT_DIR}"
  echo -e "   로그: ${log_file}"

  # 포트 바인딩 확인 (최대 5초 대기)
  for i in {1..5}; do
    if is_port_in_use "$port"; then
      echo -e "   ${GREEN}✓ [:${port}] ONLINE 기동 성공 (PID: $(get_port_pids "$port"))${NC}\n"
      return 0
    fi
    sleep 1
  done

  echo -e "   ${YELLOW}⏳ [:${port}] 초기화 진행 중 (상태 확인: ./run_port.sh status)${NC}\n"
}

cmd_start() {
  local mode=$1
  local target=${2:-all}

  echo -e "${CYAN}=================================================================${NC}"
  echo -e "${CYAN} 🎯 WorkshopSync 서비스 기동 매니저 (모드: ${mode}, 대상: ${target})${NC}"
  echo -e "${CYAN}=================================================================${NC}"

  case "$target" in
    "$API_PORT"|30015|api)    start_service "$API_PORT" "$mode" ;;
    "$MOBILE_PORT"|30016|mobile) start_service "$MOBILE_PORT" "$mode" ;;
    "$ADMIN_PORT"|30017|admin)  start_service "$ADMIN_PORT" "$mode" ;;
    all)
      start_service "$API_PORT" "$mode"
      start_service "$MOBILE_PORT" "$mode"
      start_service "$ADMIN_PORT" "$mode"
      ;;
    [0-9]*)
      echo -e "${YELLOW}ℹ [:${target}] 지정된 커스텀 포트로 기동합니다.${NC}"
      start_service "$target" "$mode"
      ;;
    *)
      echo -e "${RED}잘못된 대상입니다: ${target}${NC}"
      safe_exit 1
      ;;
  esac
}

# ------------------------------------------------------------------------------
# 4. 상태 점검 (Status)
# ------------------------------------------------------------------------------
cmd_status() {
  echo -e "${CYAN}=================================================================${NC}"
  echo -e "${CYAN} 🎯 WorkshopSync 통합 서비스 상태 점검 (Any Port / Any Host 대응)${NC}"
  echo -e "${CYAN}=================================================================${NC}"

  for port in "$API_PORT" "$MOBILE_PORT" "$ADMIN_PORT"; do
    local meta
    meta=$(get_service_meta "$port")
    local title=$(echo "$meta" | cut -d: -f2)
    local pids
    pids=$(get_port_pids "$port")

    if is_port_in_use "$port" || [ -n "$pids" ]; then
      echo -e "  • [:${port}] ${BOLD}${title}${NC} : ${GREEN}ONLINE${NC} (PID: ${pids:-확인중}) ✓"
    else
      echo -e "  • [:${port}] ${BOLD}${title}${NC} : ${RED}STOPPED${NC}"
    fi
  done

  echo -e "\n🌐 표준 접속 URL 안내 (0.0.0.0 any port / any host 허용):"
  echo -e "   - REST API 서버     : http://0.0.0.0:${API_PORT}  (Base: /api/v1)"
  echo -e "   - 참석자 전용 앱(PWA): http://0.0.0.0:${MOBILE_PORT}  (Toss & Kakao UX)"
  echo -e "   - 관리자 웹 포털    : http://0.0.0.0:${ADMIN_PORT}  (Desktop Web)"
  echo -e "${CYAN}=================================================================${NC}"
}

# ------------------------------------------------------------------------------
# 메인 CLI 라우팅
# ------------------------------------------------------------------------------
MAIN_ARG="${1:-}"
SCRIPT_BASE=$(basename "${BASH_SOURCE[0]:-$0}")

# compile.sh로 직접 호출되거나 source(.)로 호출된 경우 compile 모드로 자동 라우팅
if [ "$SCRIPT_BASE" = "compile.sh" ]; then
  cmd_build "${MAIN_ARG:-all}"
  _RET=$?
  if [ "$_RUN_PORT_SOURCED" -eq 1 ]; then
    return "$_RET" 2>/dev/null || true
  else
    exit "$_RET"
  fi
fi

case "$MAIN_ARG" in
  build|compile)
    cmd_build "${2:-all}"
    ;;
  start|prod)
    cmd_start "prod" "${2:-all}"
    ;;
  dev)
    cmd_start "dev" "${2:-all}"
    ;;
  stop)
    cmd_stop "${2:-all}"
    ;;
  restart)
    cmd_stop "${2:-all}"
    sleep 1
    cmd_start "prod" "${2:-all}"
    ;;
  status)
    cmd_status
    ;;
  "$API_PORT"|"$MOBILE_PORT"|"$ADMIN_PORT"|30015|30016|30017|api|mobile|admin|all|[0-9]*)
    cmd_start "prod" "$MAIN_ARG"
    ;;
  "")
    cmd_status
    echo -e "\n💡 ${BOLD}간편 사용 가이드:${NC}"
    echo -e "   • ./run_port.sh all              (운영 모드 전체 기동)"
    echo -e "   • ./run_port.sh dev all          (개발 모드 전체 기동)"
    echo -e "   • ./run_port.sh compile all      (전체 컴파일 / 빌드, 또는 ./compile.sh all)"
    echo -e "   • ./run_port.sh stop all         (전체 프로세스 종료)"
    echo -e "   • ./run_port.sh restart all      (전체 재시작)"
    echo -e "   • ./run_port.sh status           (가동 상태 점검)"
    echo -e "   ※ 대상 자리에 30015, 30016, 30017 또는 임의의 포트 번호를 지정하여 개별 제어 가능\n"
    ;;
  *)
    echo -e "${RED}알 수 없는 명령어: ${MAIN_ARG}${NC}"
    echo -e "사용법: ./run_port.sh [start|dev|build|stop|restart|status] [all|30015|30016|30017|임의포트]"
    safe_exit 1
    ;;
esac
