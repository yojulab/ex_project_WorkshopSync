import os
import time
from playwright.sync_api import sync_playwright

# 캡처 디렉토리 생성
DOCS_SCREENSHOTS = '/apps/ex_project_WorkshopSync/docs/screenshots'
ARTIFACT_SCREENSHOTS = '/root/.gemini/antigravity-ide/brain/46be9433-b537-4dae-81ee-701817d2cf68/screenshots'
os.makedirs(DOCS_SCREENSHOTS, exist_ok=True)
os.makedirs(ARTIFACT_SCREENSHOTS, exist_ok=True)

def save_screen(page, filename):
    p1 = os.path.join(DOCS_SCREENSHOTS, filename)
    p2 = os.path.join(ARTIFACT_SCREENSHOTS, filename)
    page.screenshot(path=p1, full_page=False)
    page.screenshot(path=p2, full_page=False)
    print(f"📸 Saved: {filename}")

def run():
    print("🚀 Starting Playwright Headless screen capture...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        )

        # -------------------------------------------------------------
        # 1. 모바일 앱 (Port 30016) - 모바일 뷰포트 (iPhone 13 390x844)
        # -------------------------------------------------------------
        mobile_context = browser.new_context(
            viewport={'width': 414, 'height': 896},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        m_page = mobile_context.new_page()

        # S-01: 입장 화면
        m_page.goto('http://127.0.0.1:30016/#view=login')
        m_page.wait_for_timeout(500)
        save_screen(m_page, 'mobile_s01_login.png')

        # S-02: 체크인 화면
        m_page.goto('http://127.0.0.1:30016/#view=checkin')
        m_page.wait_for_timeout(500)
        save_screen(m_page, 'mobile_s02_checkin.png')

        # S-03: 홈 대시보드
        m_page.goto('http://127.0.0.1:30016/#tab=home')
        m_page.wait_for_timeout(600)
        save_screen(m_page, 'mobile_s03_home.png')

        # S-04: 워크샵 상세 정보 & 조 편성
        m_page.goto('http://127.0.0.1:30016/#view=info')
        m_page.wait_for_timeout(500)
        save_screen(m_page, 'mobile_s04_info.png')

        # S-05: 아젠다 타임라인
        m_page.goto('http://127.0.0.1:30016/#view=agenda')
        m_page.wait_for_timeout(500)
        save_screen(m_page, 'mobile_s05_agenda.png')

        # S-06: 미션 목록
        m_page.goto('http://127.0.0.1:30016/#tab=mission')
        m_page.wait_for_timeout(500)
        save_screen(m_page, 'mobile_s06_mission.png')

        # S-07: 작업물 업로드
        m_page.goto('http://127.0.0.1:30016/#view=upload')
        m_page.wait_for_timeout(500)
        save_screen(m_page, 'mobile_s07_upload.png')

        # S-09: 결과물 갤러리 & 피드백
        m_page.goto('http://127.0.0.1:30016/#tab=gallery')
        m_page.wait_for_timeout(600)
        save_screen(m_page, 'mobile_s09_gallery.png')

        # S-10: 선호도 투표 화면 (1조 비활성화 상태 확인)
        m_page.goto('http://127.0.0.1:30016/#tab=vote')
        m_page.wait_for_timeout(600)
        save_screen(m_page, 'mobile_s10_vote.png')

        # S-11: 순위 공개 토글 후 순위표 캡처
        try:
            m_page.locator("button:has-text('관리자: 순위 공개 토글')").click()
            m_page.wait_for_timeout(500)
            save_screen(m_page, 'mobile_s11_ranking.png')
        except Exception as e:
            print("Error toggling ranking:", e)

        # S-12: 우승 축하 화면 (컨페티)
        m_page.goto('http://127.0.0.1:30016/#view=celebrate')
        m_page.wait_for_timeout(700)
        save_screen(m_page, 'mobile_s12_celebrate.png')

        # S-13: 알림함
        m_page.goto('http://127.0.0.1:30016/#tab=noti')
        m_page.wait_for_timeout(500)
        save_screen(m_page, 'mobile_s13_noti.png')

        # UI 인스펙션 뱃지 활성화 상태 (?inspect=1)
        m_page.goto('http://127.0.0.1:30016/?inspect=1#tab=home')
        m_page.wait_for_timeout(600)
        save_screen(m_page, 'mobile_inspect_badge.png')

        mobile_context.close()

        # -------------------------------------------------------------
        # 2. 관리자 웹 포털 (Port 30017) - 데스크톱 뷰포트 (1366x768)
        # -------------------------------------------------------------
        admin_context = browser.new_context(
            viewport={'width': 1366, 'height': 768},
            device_scale_factor=1
        )
        a_page = admin_context.new_page()

        # A-02: 워크샵 마스터
        a_page.goto('http://127.0.0.1:30017/#menu=workshop')
        a_page.wait_for_timeout(600)
        save_screen(a_page, 'admin_a02_workshop.png')

        # A-04: 참석자 & 조 편성
        a_page.goto('http://127.0.0.1:30017/#menu=participants')
        a_page.wait_for_timeout(600)
        save_screen(a_page, 'admin_a04_participants.png')

        # A-03: 아젠다 & 미션 관리
        a_page.goto('http://127.0.0.1:30017/#menu=missions')
        a_page.wait_for_timeout(600)
        save_screen(a_page, 'admin_a03_missions.png')

        # A-05: 제출 현황 모니터링
        a_page.goto('http://127.0.0.1:30017/#menu=submissions')
        a_page.wait_for_timeout(600)
        save_screen(a_page, 'admin_a05_submissions.png')

        # A-06: 투표 및 순위 제어
        a_page.goto('http://127.0.0.1:30017/#menu=voting')
        a_page.wait_for_timeout(600)
        save_screen(a_page, 'admin_a06_voting.png')

        # A-07: 우승 및 시상 발송
        a_page.goto('http://127.0.0.1:30017/#menu=awards')
        a_page.wait_for_timeout(600)
        save_screen(a_page, 'admin_a07_awards.png')

        # A-08: 공지 및 푸시 발송
        a_page.goto('http://127.0.0.1:30017/#menu=notice')
        a_page.wait_for_timeout(600)
        save_screen(a_page, 'admin_a08_notice.png')

        # A-09: 결과 리포트
        a_page.goto('http://127.0.0.1:30017/#menu=reports')
        a_page.wait_for_timeout(600)
        save_screen(a_page, 'admin_a09_reports.png')

        # 관리자 UI 인스펙션 뱃지 활성화 상태 (?inspect=1)
        a_page.goto('http://127.0.0.1:30017/?inspect=1#menu=voting')
        a_page.wait_for_timeout(600)
        save_screen(a_page, 'admin_inspect_badge.png')

        admin_context.close()
        browser.close()

    print("🎉 All screens captured successfully!")

if __name__ == '__main__':
    run()
