#!/usr/bin/env bash
# WorkshopSync - 서비스 재시작 스크립트 (run_port.sh로 통합 위임)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${PROJECT_DIR}/run_port.sh" restart "${1:-all}"