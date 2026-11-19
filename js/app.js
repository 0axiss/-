/**
 * CSU Room Reservation - Application Entry Point & Bootstrapping
 */

function initApp() {
    // 기존에 생성되어 남아있던 샘플 더미 예약 자동 정리 (더 이상 자체 샘플을 생성하지 않음)
    if (typeof cleanupSampleReservations === "function") {
        cleanupSampleReservations();
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

