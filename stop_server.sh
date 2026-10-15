#!/usr/bin/env bash
# WorkshopSync - 서비스 종료 스크립트 (run_port.sh 안전 위임)
# ※ exec를 제거하고, source / 직접 실행 모두에서 터미널이 닫히지 않도록 보호합니다.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARG="${1:-all}"

# 서브셸로 run_port.sh 실행하여 현재 터미널 세션 보존
if [ "$ARG" = "status" ]; then
  bash "${PROJECT_DIR}/run_port.sh" status
else
  bash "${PROJECT_DIR}/run_port.sh" stop "$ARG"
fi
EXIT_CODE=$?

# source(.)로 실행된 경우 exit를 호출하면 터미널 창이 닫히므로 return 처리
if (return 0 2>/dev/null); then
  return $EXIT_CODE 2>/dev/null || true
else
  exit $EXIT_CODE
fi

