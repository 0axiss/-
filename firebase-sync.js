/**
 * CSU Room Reservation - Firebase Realtime Cloud Synchronization Engine
 * 모든 사용자(학생, 관리자) 간의 실시간 데이터 공유를 담당합니다.
 */

const FIREBASE_DB_URL = "https://csu-room-default-rtdb.firebaseio.com";

const SYNC_STORAGE_KEY = "CHONGSHIN_MUSIC_RESERVATIONS_V2";
const SYNC_ROOM_SETTINGS_KEY = "CHONGSHIN_ROOM_SETTINGS";
const SYNC_POLICIES_KEY = "CHONGSHIN_BOOKING_POLICIES";
const SYNC_BOARD_KEY = "CHONGSHIN_MUSIC_BOARD_POSTS_V1";

let remoteDb = null;
let isRemoteSyncReady = false;

// 1. Firebase 인스턴스 초기화
try {
    if (typeof firebase !== "undefined") {
        if (!firebase.apps.length) {
            firebase.initializeApp({
                databaseURL: FIREBASE_DB_URL
            });
        }
        remoteDb = firebase.database();
        isRemoteSyncReady = true;
        console.log("🔥 [Firebase] 실시간 클라우드 DB 연결 성공:", FIREBASE_DB_URL);
    } else {
        console.warn("⚠️ [Firebase] SDK가 로드되지 않아 오프라인 로컬 저장소 모드로 작동합니다.");
    }
} catch (err) {
    console.error("❌ [Firebase] 초기화 중 오류 발생:", err);
}

// 2. 클라우드로 즉시 데이터 전송 (Helper Functions)
function pushReservationsToCloud(list) {
    if (!remoteDb) return;
    try {
        remoteDb.ref("reservations").set(list || []).catch(e => {
            console.error("클라우드 예약 저장 실패:", e);
        });
    } catch (e) { }
}

function pushBoardPostsToCloud(posts) {
    if (!remoteDb) return;
    try {
        remoteDb.ref("boardPosts").set(posts || []).catch(e => {
            console.error("클라우드 게시판 저장 실패:", e);
        });
    } catch (e) { }
}

function pushPoliciesToCloud(policies) {
    if (!remoteDb) return;
    try {
        remoteDb.ref("policies").set(policies || {}).catch(e => {
            console.error("클라우드 정책 저장 실패:", e);
        });
    } catch (e) { }
}

function pushRoomSettingsToCloud(settings) {
    if (!remoteDb) return;
    try {
        remoteDb.ref("roomSettings").set(settings || {}).catch(e => {
            console.error("클라우드 연습실 설정 저장 실패:", e);
        });
    } catch (e) { }
}

// 3. 실시간 변경 감지 리스너 (Remote ➡️ All Clients)
if (remoteDb) {
    // A. 예약 내역 실시간 동기화
    remoteDb.ref("reservations").on("value", snapshot => {
        const val = snapshot.val();
        if (val !== null && val !== undefined) {
            const list = Array.isArray(val) ? val : Object.values(val);
            localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(list));

            // 학생 화면 실시간 갱신
            if (typeof updateHeaderBadge === "function") updateHeaderBadge();
            if (typeof currentScreen !== "undefined") {
                if (currentScreen === "time-screen" && typeof renderSlotsGrid === "function") {
                    renderSlotsGrid();
                    if (typeof syncDropdownsWithSelection === "function") syncDropdownsWithSelection();
                } else if (currentScreen === "overview-screen" && typeof renderOverviewDashboard === "function") {
                    renderOverviewDashboard();
                } else if (currentScreen === "my-screen" && typeof searchMyReservations === "function") {
                    searchMyReservations();
                }
            }

            // 관리자 화면 실시간 갱신
            if (typeof renderReservationsTable === "function") renderReservationsTable();
            if (typeof renderDashboard === "function") renderDashboard();
            if (typeof renderTimetableGrid === "function") renderTimetableGrid();
        } else {
            // 클라우드가 비어있으면 로컬 데이터로 초기 시딩
            const local = localStorage.getItem(SYNC_STORAGE_KEY);
            if (local) {
                try {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        remoteDb.ref("reservations").set(parsed);
                    }
                } catch (e) { }
            }
        }
    });

    // B. 게시판(공지사항 & 문의) 실시간 동기화
    remoteDb.ref("boardPosts").on("value", snapshot => {
        const val = snapshot.val();
        if (val !== null && val !== undefined) {
            const posts = Array.isArray(val) ? val : Object.values(val);
            localStorage.setItem(SYNC_BOARD_KEY, JSON.stringify(posts));

            // 학생 화면 갱신
            if (typeof updateBoardBadges === "function") updateBoardBadges();
            if (typeof currentScreen !== "undefined" && currentScreen === "board-screen") {
                if (typeof renderBoardList === "function") renderBoardList();
            }

            // 관리자 화면 갱신
            if (typeof updateAdminBoardBadges === "function") updateAdminBoardBadges();
            if (typeof currentTab !== "undefined" && currentTab === "board") {
                if (typeof adminBoardSubtab !== "undefined") {
                    if (adminBoardSubtab === "notice" && typeof renderAdminNoticeTable === "function") {
                        renderAdminNoticeTable();
                    } else if (adminBoardSubtab === "inquiry" && typeof renderAdminInquiryTable === "function") {
                        renderAdminInquiryTable();
                    }
                }
            }
        } else {
            // 클라우드가 비어있으면 초기 샘플 공지사항 시딩
            const local = localStorage.getItem(SYNC_BOARD_KEY);
            if (local) {
                try {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        remoteDb.ref("boardPosts").set(parsed);
                    }
                } catch (e) { }
            }
        }
    });

    // C. 예약 정책 설정 실시간 동기화
    remoteDb.ref("policies").on("value", snapshot => {
        const val = snapshot.val();
        if (val !== null && val !== undefined) {
            localStorage.setItem(SYNC_POLICIES_KEY, JSON.stringify(val));

            // 학생 화면 반영 (오픈 시간 및 슬롯 카운트)
            if (typeof currentScreen !== "undefined" && currentScreen === "time-screen" && typeof renderSlotsGrid === "function") {
                renderSlotsGrid();
            }

            // 관리자 설정 폼 반영
            if (typeof renderPolicySettings === "function") renderPolicySettings();
        } else {
            const local = localStorage.getItem(SYNC_POLICIES_KEY);
            if (local) {
                try {
                    remoteDb.ref("policies").set(JSON.parse(local));
                } catch (e) { }
            }
        }
    });

    // D. 연습실 운영 상태 및 점검 차단 일정 실시간 동기화
    remoteDb.ref("roomSettings").on("value", snapshot => {
        const val = snapshot.val();
        if (val !== null && val !== undefined) {
            localStorage.setItem(SYNC_ROOM_SETTINGS_KEY, JSON.stringify(val));

            // 학생 화면 반영 (운영 중지 연습실 즉시 비활성화)
            if (typeof currentScreen !== "undefined") {
                if (currentScreen === "room-screen" && typeof renderRooms === "function") {
                    renderRooms();
                } else if (currentScreen === "time-screen" && typeof renderSlotsGrid === "function") {
                    renderSlotsGrid();
                }
            }

            // 관리자 화면 반영
            if (typeof renderRoomsManager === "function") renderRoomsManager();
        } else {
            const local = localStorage.getItem(SYNC_ROOM_SETTINGS_KEY);
            if (local) {
                try {
                    remoteDb.ref("roomSettings").set(JSON.parse(local));
                } catch (e) { }
            }
        }
    });
}
