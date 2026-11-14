/**
 * CSU Room Reservation - Application Entry Point & Bootstrapping
 */

function initApp() {
    // 최초 실행 시 기본 샘플 데이터 구성
    const existing = getAllReservations();
    if (!existing || existing.length === 0) {
        if (typeof generateSampleData === "function") {
            generateSampleData();
        }
    }

    // 게시판 기본 공지 확인
    if (typeof initDefaultBoardPosts === "function") {
        initDefaultBoardPosts();
    }

    // 헤더 배지 카운트 갱신
    if (typeof updateHeaderBadge === "function") {
        updateHeaderBadge();
    }

    // 초기 화면 진입
    navTo("building-screen");
}

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

