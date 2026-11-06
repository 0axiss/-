/**
 * 총신대학교 교회음악과 연습실 관리자 시스템 코어 엔진 (admin.js)
 * Executive Control & Security Engine for Practice Room Reservation
 */

// =================================================================
// 1. 공통 상수 및 스토리지 키 정의
// =================================================================
const STORAGE_KEY = "CHONGSHIN_MUSIC_RESERVATIONS_V2";     // 학생 예약 저장소와 100% 동일
const ADMIN_STORAGE_KEY = "CHONGSHIN_ADMIN_ACCOUNTS";       // 관리자 계정 저장소
const ADMIN_SESSION_KEY = "CHONGSHIN_ADMIN_SESSION";       // 관리자 인증 세션 토큰
const ROOM_SETTINGS_KEY = "CHONGSHIN_ROOM_SETTINGS";       // 연습실 상태 및 점검 차단
const POLICIES_KEY = "CHONGSHIN_BOOKING_POLICIES";         // 예약 정책 설정
const AUDIT_LOGS_KEY = "CHONGSHIN_ADMIN_LOGS";             // 관리자 감사 로그
const BOARD_STORAGE_KEY = "CHONGSHIN_MUSIC_BOARD_POSTS_V1"; // 게시판 데이터 저장소

const OPERATING_START_HOUR = 9;   // 09:00
const OPERATING_END_HOUR = 22;    // 22:00

// 26개 시간 슬롯 목록 (기존 script.js와 100% 동일한 순서 및 11:00~11:40 채플 반영)
const TIME_SLOT_DEFS = [
    { start: "09:00", end: "09:30", hour: 9 },
    { start: "09:30", end: "10:00", hour: 9 },
    { start: "10:00", end: "10:30", hour: 10 },
    { start: "10:30", end: "11:00", hour: 10 },
    { start: "11:00", end: "11:40", hour: 11 },
    { start: "11:40", end: "12:00", hour: 11 },
    { start: "12:00", end: "12:30", hour: 12 },
    { start: "12:30", end: "13:00", hour: 12 },
    { start: "13:00", end: "13:30", hour: 13 },
    { start: "13:30", end: "14:00", hour: 13 },
    { start: "14:00", end: "14:30", hour: 14 },
    { start: "14:30", end: "15:00", hour: 14 },
    { start: "15:00", end: "15:30", hour: 15 },
    { start: "15:30", end: "16:00", hour: 15 },
    { start: "16:00", end: "16:30", hour: 16 },
    { start: "16:30", end: "17:00", hour: 16 },
    { start: "17:00", end: "17:30", hour: 17 },
    { start: "17:30", end: "18:00", hour: 17 },
    { start: "18:00", end: "18:30", hour: 18 },
    { start: "18:30", end: "19:00", hour: 18 },
    { start: "19:00", end: "19:30", hour: 19 },
    { start: "19:30", end: "20:00", hour: 19 },
    { start: "20:00", end: "20:30", hour: 20 },
    { start: "20:30", end: "21:00", hour: 20 },
    { start: "21:00", end: "21:30", hour: 21 },
    { start: "21:30", end: "22:00", hour: 21 }
];

const TIME_SLOTS = TIME_SLOT_DEFS.map((def, idx) => {
    const sMins = timeStrToMinutes(def.start);
    const eMins = timeStrToMinutes(def.end);
    return {
        index: idx,
        hour: def.hour,
        startMinutes: sMins,
        endMinutes: eMins,
        startStr: def.start,
        endStr: def.end,
        label: `${def.start} ~ ${def.end}`
    };
});

// 기본 건물 및 연습실 정의 (신관 33실 + 종합관 12실)
const BASE_BUILDINGS = {
    "신관": {
        name: "신관",
        subtitle: "지하 1층 · 5층 · 6층 교회음악과 연습실",
        floors: [
            {
                name: "B1",
                title: "지하 1층",
                rooms: [
                    { number: "B06", type: "유교", category: "normal" },
                    { number: "B07", type: "유교", category: "normal" },
                    { number: "B08", type: "유교", category: "normal" },
                    { number: "B09", type: "유교", category: "normal" },
                    { number: "B10", type: "유교", category: "normal" },
                    { number: "B11", type: "유교", category: "normal" },
                    { number: "B12", type: "교음(오르간)", category: "organ" },
                    { number: "B13", type: "교음(오르간)", category: "organ" },
                    { number: "B14", type: "아동", category: "normal" },
                    { number: "B15", type: "교음", category: "normal" },
                    { number: "B16", type: "교음", category: "normal" },
                    { number: "B17", type: "교음", category: "normal" },
                    { number: "B18", type: "교음(그랜드)", category: "grand" }
                ]
            },
            {
                name: "5F",
                title: "5층",
                rooms: [
                    { number: "507", type: "교음", category: "normal" },
                    { number: "508", type: "교음", category: "normal" },
                    { number: "509", type: "교음", category: "normal" },
                    { number: "510", type: "교음", category: "normal" }
                ]
            },
            {
                name: "6F",
                title: "6층",
                rooms: [
                    { number: "611", type: "교음", category: "normal" },
                    { number: "612", type: "성악학회실", category: "society" },
                    { number: "613", type: "오르간학회실", category: "society" },
                    { number: "614", type: "관현악학회실", category: "society" },
                    { number: "615", type: "작곡학회실", category: "society" },
                    { number: "616", type: "피아노학회실", category: "society" },
                    { number: "617", type: "교음(오르간)", category: "organ" },
                    { number: "618", type: "교음(오르간)", category: "organ" },
                    { number: "619", type: "교음(오르간)", category: "organ" },
                    { number: "620", type: "교음(오르간)", category: "organ" },
                    { number: "621", type: "교음(오르간)", category: "organ" },
                    { number: "622", type: "교음(그랜드)", category: "grand" },
                    { number: "623", type: "교음", category: "normal" },
                    { number: "624", type: "교음", category: "normal" },
                    { number: "625", type: "교음", category: "normal" },
                    { number: "626", type: "교음", category: "normal" }
                ]
            }
        ]
    },
    "종합관": {
        name: "종합관",
        subtitle: "2층 1호 ~ 12호 교회음악과 연습실",
        floors: [
            {
                name: "2F",
                title: "2층",
                rooms: [
                    { number: "1", type: "업라이트", category: "normal" },
                    { number: "2", type: "피아노", category: "normal" },
                    { number: "3", type: "그랜드", category: "grand" },
                    { number: "4", type: "그랜드", category: "grand" },
                    { number: "5", type: "업라이트 2", category: "normal" },
                    { number: "6", type: "그랜드", category: "grand" },
                    { number: "7", type: "업라이트", category: "normal" },
                    { number: "8", type: "그랜드", category: "grand" },
                    { number: "9", type: "그랜드", category: "grand" },
                    { number: "10", type: "그랜드", category: "grand" },
                    { number: "11", type: "피아노", category: "normal" },
                    { number: "12", type: "업라이트·오르간", category: "organ" }
                ]
            }
        ]
    }
};

// =================================================================
// 2. 유틸리티 함수
// =================================================================
function timeStrToMinutes(str) {
    if (!str) return 0;
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTimeStr(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function formatDateDisplay(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

let toastTimer = null;
function showAdminToast(msg, type = "normal") {
    const toast = document.getElementById("admin-toast");
    if (!toast) return;

    toast.textContent = msg;
    toast.className = `admin-toast show ${type}`;

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.className = "admin-toast";
    }, 3000);
}

// 안전한 비밀번호 해시 생성기 (SHA-256)
async function hashPassword(pw) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pw + "_CSU_CHURCH_MUSIC_SALT_2026");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// =================================================================
// 3. 보안 및 인증 가드 (Security Guard & Auth Controller)
// =================================================================

// 초기 관리자 계정 초기화 (최초 1회 안전 등록)
async function initAdminAccounts() {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) {
        // 최초 기본 관리자: admin / admin1234!
        const defaultHash = await hashPassword("admin1234!");
        const initialAccounts = [
            {
                id: "admin",
                name: "마스터 관리자",
                role: "super_admin",
                passwordHash: defaultHash,
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(initialAccounts));
        console.log("🛡️ 관리자 마스터 계정 초기화 완료 (admin / admin1234!)");
    }
}

// 현재 세션 토큰 검증 (Security Guard)
function checkAdminAuth() {
    const rawSession = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!rawSession) return false;

    try {
        const session = JSON.parse(rawSession);
        // 세션 만료 시간 검사 (8시간)
        const now = Date.now();
        if (session.expiresAt && now > session.expiresAt) {
            localStorage.removeItem(ADMIN_SESSION_KEY);
            return false;
        }
        return session;
    } catch (e) {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        return false;
    }
}

// 로그인 실행
async function handleAdminLogin() {
    const idInput = document.getElementById("admin-id");
    const pwInput = document.getElementById("admin-pw");
    const id = idInput.value.trim();
    const pw = pwInput.value.trim();

    if (!id || !pw) {
        showAdminToast("아이디와 비밀번호를 모두 입력해주세요.", "error");
        return;
    }

    const rawAccounts = localStorage.getItem(ADMIN_STORAGE_KEY);
    const accounts = rawAccounts ? JSON.parse(rawAccounts) : [];

    const inputHash = await hashPassword(pw);
    const matched = accounts.find(a => a.id === id && a.passwordHash === inputHash);

    if (matched) {
        // 세션 생성 (8시간 유효)
        const session = {
            id: matched.id,
            name: matched.name,
            role: matched.role,
            token: "CSU-ADMIN-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8),
            expiresAt: Date.now() + 8 * 60 * 60 * 1000
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

        addAuditLog("LOGIN", `관리자 '${matched.name}' 로그인 성공`, "정상 로그인");
        showAdminToast(`${matched.name}님 환영합니다!`, "success");

        idInput.value = "";
        pwInput.value = "";
        renderAppByAuth();
    } else {
        showAdminToast("아이디 또는 비밀번호가 일치하지 않습니다.", "error");
        pwInput.focus();
    }
}

// 로그아웃
function handleAdminLogout() {
    if (!confirm("관리자 세션을 종료하고 로그아웃하시겠습니까?")) return;
    const session = checkAdminAuth();
    if (session) {
        addAuditLog("LOGOUT", `관리자 '${session.name}' 로그아웃`, "사용자 요청");
    }
    localStorage.removeItem(ADMIN_SESSION_KEY);
    showAdminToast("안전하게 로그아웃되었습니다.", "normal");
    renderAppByAuth();
}

// 비밀번호 변경
async function changeAdminPassword() {
    const session = checkAdminAuth();
    if (!session) {
        showAdminToast("세션이 만료되었습니다. 다시 로그인해주세요.", "error");
        renderAppByAuth();
        return;
    }

    const curPw = document.getElementById("input-cur-admin-pw").value.trim();
    const newPw = document.getElementById("input-new-admin-pw").value.trim();
    const confirmPw = document.getElementById("input-confirm-admin-pw").value.trim();

    if (!curPw || !newPw || !confirmPw) {
        showAdminToast("모든 비밀번호 필드를 입력해주세요.", "error");
        return;
    }

    if (newPw !== confirmPw) {
        showAdminToast("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.", "error");
        return;
    }

    if (newPw.length < 8) {
        showAdminToast("보안을 위해 비밀번호는 8자 이상이어야 합니다.", "error");
        return;
    }

    const rawAccounts = localStorage.getItem(ADMIN_STORAGE_KEY);
    const accounts = rawAccounts ? JSON.parse(rawAccounts) : [];
    const idx = accounts.findIndex(a => a.id === session.id);

    if (idx === -1) {
        showAdminToast("계정 정보를 찾을 수 없습니다.", "error");
        return;
    }

    const curHash = await hashPassword(curPw);
    if (accounts[idx].passwordHash !== curHash) {
        showAdminToast("현재 비밀번호가 일치하지 않습니다.", "error");
        return;
    }

    accounts[idx].passwordHash = await hashPassword(newPw);
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(accounts));

    document.getElementById("input-cur-admin-pw").value = "";
    document.getElementById("input-new-admin-pw").value = "";
    document.getElementById("input-confirm-admin-pw").value = "";

    addAuditLog("PASSWORD_CHANGE", `관리자 '${session.name}' 비밀번호 변경`, "보안 정책에 따른 변경");
    showAdminToast("관리자 비밀번호가 성공적으로 변경되었습니다.", "success");
}

// 권한 상태에 따른 UI 전환
function renderAppByAuth() {
    const session = checkAdminAuth();
    const loginScreen = document.getElementById("admin-login-screen");
    const mainPortal = document.getElementById("admin-main-portal");

    if (session) {
        loginScreen.style.display = "none";
        mainPortal.style.display = "flex";
        document.getElementById("current-admin-name").textContent = `${session.name} (${session.id})`;
        initDashboard();
    } else {
        loginScreen.style.display = "flex";
        mainPortal.style.display = "none";
    }
}

// =================================================================
// 4. 데이터 엔진 계층 (Data Engine)
// =================================================================

// 전체 예약 목록 읽기
function getAllReservations() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("예약 데이터 읽기 오류:", e);
        return [];
    }
}

// 전체 예약 목록 저장
function saveAllReservations(list) {
    // 보안 검증: 관리자 세션이 없으면 저장 거부
    if (!checkAdminAuth()) {
        showAdminToast("비인가 접근입니다. 저장 권한이 없습니다.", "error");
        return false;
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return true;
    } catch (e) {
        console.error("예약 데이터 저장 오류:", e);
        showAdminToast("데이터 저장에 실패했습니다.", "error");
        return false;
    }
}

// 연습실 설정 및 차단 저장소 읽기
function getRoomSettings() {
    try {
        const raw = localStorage.getItem(ROOM_SETTINGS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function saveRoomSettings(settings) {
    if (!checkAdminAuth()) return false;
    localStorage.setItem(ROOM_SETTINGS_KEY, JSON.stringify(settings));
    return true;
}

// 예약 정책 설정 읽기
function getBookingPolicies() {
    try {
        const raw = localStorage.getItem(POLICIES_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) { }

    // 기본 정책
    return {
        maxDurationHours: 2,
        maxDailyBookingsPerUser: 2,
        bookingAdvanceDays: 0, // 당일 전용 (사전 예약 불가)
        cancelDeadlineMinutes: 30,
        dailyOpenHour: 5 // 당일 예약 시스템 오픈 시각 (새벽 5시)
    };
}

function saveBookingPolicies(policies) {
    if (!checkAdminAuth()) return false;
    localStorage.setItem(POLICIES_KEY, JSON.stringify(policies));
    return true;
}

// 감사 로그 기록 엔진
function addAuditLog(action, target, reason = "", details = "") {
    const session = checkAdminAuth();
    const adminId = session ? `${session.name} (${session.id})` : "System";

    const logItem = {
        id: "LOG-" + Date.now().toString().slice(-6),
        adminId: adminId,
        action: action,
        target: target,
        reason: reason,
        details: details,
        timestamp: new Date().toISOString()
    };

    try {
        const raw = localStorage.getItem(AUDIT_LOGS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(logItem); // 최신순
        // 최대 1,000건 보관
        if (list.length > 1000) list.pop();
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(list));
    } catch (e) {
        console.error("감사 로그 저장 실패:", e);
    }
}

function getAuditLogs() {
    try {
        const raw = localStorage.getItem(AUDIT_LOGS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

// 중복 검증 (관리자용 엄격한 충돌 체크)
function checkOverlapAdmin(dateStr, building, roomNum, startMin, endMin, excludeId = null) {
    const all = getAllReservations();
    for (const res of all) {
        if (res.status === "cancelled") continue;
        if (excludeId && res.id === excludeId) continue;
        if (res.date === dateStr && res.building === building && res.room === roomNum) {
            const s = timeStrToMinutes(res.startTime);
            const e = timeStrToMinutes(res.endTime);
            if (startMin < e && endMin > s) {
                return { overlap: true, conflict: res };
            }
        }
    }

    // 연습실 점검 차단 시간대와도 중복 검사
    const roomSettings = getRoomSettings();
    const rKey = `${building}_${roomNum}`;
    const rSet = roomSettings[rKey];
    if (rSet && rSet.blockedSlots) {
        for (const slot of rSet.blockedSlots) {
            if (slot.date === dateStr) {
                const bs = timeStrToMinutes(slot.startTime);
                const be = timeStrToMinutes(slot.endTime);
                if (startMin < be && endMin > bs) {
                    return {
                        overlap: true,
                        conflict: {
                            name: `[시설점검 차단: ${slot.reason}]`,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            isBlock: true
                        }
                    };
                }
            }
        }
    }

    return { overlap: false };
}

// =================================================================
// 5. 탭 전환 및 메인 컨트롤러
// =================================================================
let currentTab = "dashboard";

function switchAdminTab(tabName) {
    currentTab = tabName;

    // 탭 버튼 스타일 갱신
    document.querySelectorAll(".admin-tab-btn").forEach((btn, idx) => {
        const names = ["dashboard", "reservations", "rooms", "policies", "audit", "board"];
        if (names[idx] === tabName) btn.classList.add("active");
        else btn.classList.remove("active");
    });

    // 탭 컨텐츠 갱신
    document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
    });
    const targetPane = document.getElementById(`pane-${tabName}`);
    if (targetPane) targetPane.classList.add("active");

    // 탭별 렌더링 호출
    if (tabName === "dashboard") renderDashboard();
    else if (tabName === "reservations") renderReservationsTable();
    else if (tabName === "rooms") renderRoomsManager();
    else if (tabName === "policies") renderPoliciesForm();
    else if (tabName === "audit") renderAuditLogsList();
    else if (tabName === "board") renderAdminBoardPanels();
}

// =================================================================
// 6. TAB 1: 운영 대시보드 렌더링 (Dashboard)
// =================================================================
function initDashboard() {
    renderDashboard();
    updateBadgesCount();
    // 30초마다 대시보드 실시간 자동 갱신
    setInterval(() => {
        if (currentTab === "dashboard") renderDashboard();
    }, 30000);
}

function updateBadgesCount() {
    const all = getAllReservations();
    const activeCount = all.filter(r => r.status === "confirmed").length;
    document.getElementById("badge-total-res").textContent = activeCount;

    const logs = getAuditLogs();
    document.getElementById("badge-total-logs").textContent = logs.length;
}

function renderDashboard() {
    const all = getAllReservations();
    const todayStr = formatDateKey(new Date());

    // 1. 오늘의 전체 예약 수
    const todayReservations = all.filter(r => r.date === todayStr);
    const todayConfirmed = todayReservations.filter(r => r.status === "confirmed");
    const todayCancelled = todayReservations.filter(r => r.status === "cancelled");

    document.getElementById("kpi-today-count").innerHTML = `${todayConfirmed.length}<span style="font-size:16px;">건 (전체 ${todayReservations.length})</span>`;
    document.getElementById("kpi-today-date").textContent = `${formatDateDisplay(new Date())} 기준`;

    // 2. 현재 실시간 이용 중인 연습실
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const currentlyUsing = todayConfirmed.filter(r => {
        return nowMins >= r.startMin && nowMins < r.endMin;
    });

    document.getElementById("kpi-now-using").innerHTML = `${currentlyUsing.length}<span style="font-size:16px;">실</span>`;
    document.getElementById("kpi-now-time").textContent = `현재 시각 ${minutesToTimeStr(nowMins)} 기준`;

    // 3. 오늘 취소 건수
    document.getElementById("kpi-today-cancel").innerHTML = `${todayCancelled.length}<span style="font-size:16px;">건</span>`;

    // 4. 실시간 이용 중 테이블 렌더링
    const tbodyUsing = document.getElementById("tbody-current-using");
    tbodyUsing.innerHTML = "";

    if (currentlyUsing.length === 0) {
        tbodyUsing.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:32px; color:var(--gray-400);">
                    현재 시각(${minutesToTimeStr(nowMins)}) 이용 중인 연습실이 없습니다. 모든 연습실이 비어 있습니다.
                </td>
            </tr>
        `;
    } else {
        currentlyUsing.forEach(r => {
            const remainMins = r.endMin - nowMins;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${r.building}</strong> ${r.floor || ''}</td>
                <td><span style="font-size:15px; font-weight:700; color:var(--primary);">${r.room}호</span></td>
                <td><span class="badge-room-type">${escapeHtml(r.roomType || '일반')}</span></td>
                <td><strong>${r.startTime} ~ ${r.endTime}</strong></td>
                <td><strong>${escapeHtml(r.name)}</strong> (${r.studentId})</td>
                <td>${escapeHtml(r.phone)}</td>
                <td><span style="color:var(--danger); font-weight:700;">약 ${remainMins}분 남음</span></td>
                <td>
                    <button class="btn-action cancel" onclick="openAdminCancelModal('${r.id}')">직권 취소</button>
                </td>
            `;
            tbodyUsing.appendChild(tr);
        });
    }

    // 5. 최근 접수된 예약 5건
    const tbodyRecentBookings = document.getElementById("tbody-recent-bookings");
    tbodyRecentBookings.innerHTML = "";
    const recent5 = [...all].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);

    if (recent5.length === 0) {
        tbodyRecentBookings.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--gray-400);">예약 내역이 없습니다.</td></tr>`;
    } else {
        recent5.forEach(r => {
            const tr = document.createElement("tr");
            const isConfirmed = r.status === "confirmed";
            tr.innerHTML = `
                <td>${r.date} ${r.startTime}</td>
                <td><strong>${r.building} ${r.room}호</strong></td>
                <td>${escapeHtml(r.name)} (${r.studentId})</td>
                <td><span class="badge-status ${isConfirmed ? 'confirmed' : 'cancelled'}">${isConfirmed ? '확정' : '취소됨'}</span></td>
            `;
            tbodyRecentBookings.appendChild(tr);
        });
    }

    // 6. 최근 취소된 예약 5건
    const tbodyRecentCancels = document.getElementById("tbody-recent-cancels");
    tbodyRecentCancels.innerHTML = "";
    const cancels5 = all.filter(r => r.status === "cancelled")
        .sort((a, b) => new Date(b.cancelledAt || 0) - new Date(a.cancelledAt || 0))
        .slice(0, 5);

    if (cancels5.length === 0) {
        tbodyRecentCancels.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--gray-400);">취소된 예약 내역이 없습니다.</td></tr>`;
    } else {
        cancels5.forEach(r => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${r.date} ${r.startTime}</td>
                <td><strong>${r.building} ${r.room}호</strong></td>
                <td>${escapeHtml(r.name)} (${r.studentId})</td>
                <td style="color:var(--danger); font-size:12px;">${escapeHtml(r.cancelReason || '학생 본인 취소')}</td>
            `;
            tbodyRecentCancels.appendChild(tr);
        });
    }

    updateBadgesCount();
}

// =================================================================
// 7. TAB 2: 전체 예약 관리 렌더링 & 필터 (Reservations Manager)
// =================================================================
let filterState = {
    date: "",
    building: "ALL",
    room: "",
    keyword: "",
    status: "ALL"
};

function applyReservationFilters() {
    filterState.date = document.getElementById("filter-date").value;
    filterState.building = document.getElementById("filter-building").value;
    filterState.room = document.getElementById("filter-room").value.trim().toLowerCase();
    filterState.keyword = document.getElementById("filter-keyword").value.trim().toLowerCase();
    filterState.status = document.getElementById("filter-status").value;

    renderReservationsTable();
}

function resetReservationFilters() {
    document.getElementById("filter-date").value = "";
    document.getElementById("filter-building").value = "ALL";
    document.getElementById("filter-room").value = "";
    document.getElementById("filter-keyword").value = "";
    document.getElementById("filter-status").value = "ALL";

    applyReservationFilters();
}

function renderReservationsTable() {
    const all = getAllReservations();
    const tbody = document.getElementById("tbody-all-reservations");
    const countEl = document.getElementById("filtered-res-count");

    // 필터링 적용
    const filtered = all.filter(r => {
        if (filterState.date && r.date !== filterState.date) return false;
        if (filterState.building !== "ALL" && r.building !== filterState.building) return false;
        if (filterState.room && !r.room.toLowerCase().includes(filterState.room)) return false;
        if (filterState.status !== "ALL" && r.status !== filterState.status) return false;
        if (filterState.keyword) {
            const n = (r.name || "").toLowerCase();
            const s = (r.studentId || "").toLowerCase();
            const p = (r.phone || "").replace(/[^0-9]/g, "");
            const kwClean = filterState.keyword.replace(/[^0-9]/g, "");
            const matchName = n.includes(filterState.keyword);
            const matchSid = s.includes(filterState.keyword);
            const matchPhone = kwClean.length >= 3 && p.includes(kwClean);
            if (!matchName && !matchSid && !matchPhone) return false;
        }
        return true;
    });

    // 최신 날짜 및 시간순 정렬
    filtered.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.startMin - a.startMin;
    });

    countEl.textContent = `총 ${filtered.length}건의 예약이 조회되었습니다 (전체 ${all.length}건 중)`;
    tbody.innerHTML = "";

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align:center; padding:40px; color:var(--gray-400);">
                    조건에 해당하는 예약 내역이 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(res => {
        const isCancelled = res.status === "cancelled";
        const tr = document.createElement("tr");
        if (isCancelled) tr.classList.add("cancelled");

        const durMins = res.endMin - res.startMin;
        const h = Math.floor(durMins / 60);
        const m = durMins % 60;
        const durStr = `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm' : ''}`;

        tr.innerHTML = `
            <td><code style="font-size:12px; font-weight:700;">${res.id}</code></td>
            <td><strong>${res.date}</strong></td>
            <td>${res.startTime} ~ ${res.endTime} <span style="font-size:11px; color:var(--gray-400);">(${durStr})</span></td>
            <td><strong>${res.building}</strong></td>
            <td><span class="badge-room-type">${escapeHtml(res.roomType || '일반')}</span> <strong style="color:var(--primary); font-size:14px;">${res.room}호</strong></td>
            <td><strong>${escapeHtml(res.name)}</strong></td>
            <td>${escapeHtml(res.studentId)}</td>
            <td>${escapeHtml(res.phone)}</td>
            <td>
                <span class="badge-status ${isCancelled ? 'cancelled' : 'confirmed'}">
                    ${isCancelled ? (res.cancelledBy === 'admin' || (res.cancelReason && res.cancelReason.includes('관리자')) ? '관리자에 의한 취소' : '학생 본인 취소') : '예약확정'}
                </span>
            </td>
            <td style="max-width:180px; font-size:12px; color:${isCancelled ? 'var(--danger)' : 'var(--gray-500)'};">
                ${isCancelled ? escapeHtml(res.cancelReason || '사유 미기재') : (res.adminNote ? escapeHtml(res.adminNote) : '-')}
            </td>
            <td>
                <div class="table-actions">
                    ${!isCancelled ? `
                        <button class="btn-action edit" onclick="openEditModal('${res.id}')">수정</button>
                        <button class="btn-action cancel" onclick="openAdminCancelModal('${res.id}')">취소</button>
                    ` : `
                        <button class="btn-action detail" onclick="showReservationDetail('${res.id}')">상세</button>
                    `}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 엑셀 / CSV 내보내기 (한글 깨짐 없는 BOM 추가)
function exportReservationsCSV() {
    const all = getAllReservations();
    if (all.length === 0) {
        showAdminToast("내보낼 예약 데이터가 없습니다.", "error");
        return;
    }

    let csvContent = "\uFEFF예약번호,예약일자,시작시간,종료시간,건물,연습실,악기유형,예약자,학번,연락처,상태,취소사유,신청일시\n";

    all.forEach(r => {
        const row = [
            `"${r.id}"`,
            `"${r.date}"`,
            `"${r.startTime}"`,
            `"${r.endTime}"`,
            `"${r.building}"`,
            `"${r.room}호"`,
            `"${(r.roomType || '').replace(/"/g, '""')}"`,
            `"${(r.name || '').replace(/"/g, '""')}"`,
            `"${r.studentId}"`,
            `"${r.phone}"`,
            `"${r.status === 'confirmed' ? '예약확정' : '취소됨'}"`,
            `"${(r.cancelReason || '').replace(/"/g, '""')}"`,
            `"${new Date(r.createdAt || Date.now()).toLocaleString()}"`
        ];
        csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `chongshin_reservations_${formatDateKey(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAdminToast("CSV 엑셀 파일이 다운로드되었습니다.", "success");
}

// 예약 상세 보기
function showReservationDetail(resId) {
    const all = getAllReservations();
    const res = all.find(r => r.id === resId);
    if (!res) return;

    alert(`[예약 상세 정보]\n\n• 예약번호: ${res.id}\n• 일자: ${res.date}\n• 시간: ${res.startTime} ~ ${res.endTime}\n• 공간: ${res.building} ${res.room}호 (${res.roomType})\n• 예약자: ${res.name} (학번: ${res.studentId})\n• 연락처: ${res.phone}\n• 상태: ${res.status === 'confirmed' ? '예약확정' : '취소 완료'}\n• 신청시각: ${new Date(res.createdAt).toLocaleString()}\n${res.status === 'cancelled' ? `• 취소사유: ${res.cancelReason || '없음'}\n• 취소시각: ${new Date(res.cancelledAt || 0).toLocaleString()}` : ''}`);
}

// =================================================================
// 8. 예약 수정 모달 제어 (Edit Reservation)
// =================================================================
let currentEditingRes = null;

function openEditModal(resId) {
    const all = getAllReservations();
    const target = all.find(r => r.id === resId);
    if (!target) return;

    currentEditingRes = target;

    document.getElementById("edit-res-id").value = target.id;
    document.getElementById("edit-display-id").value = `${target.id} (${target.name} 학생)`;
    document.getElementById("edit-res-date").value = target.date;
    document.getElementById("edit-res-building").value = target.building;

    // 방 목록 채우기
    populateEditRoomOptions(target.building, target.room);

    // 시작/종료 시간 채우기
    populateEditTimeOptions(target.startTime, target.endTime);

    document.getElementById("edit-res-name").value = target.name;
    document.getElementById("edit-res-sid").value = target.studentId;
    document.getElementById("edit-res-phone").value = target.phone;
    document.getElementById("edit-change-reason").value = "";

    document.getElementById("modal-edit-reservation").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("modal-edit-reservation").style.display = "none";
    currentEditingRes = null;
}

function onEditBuildingChange() {
    const b = document.getElementById("edit-res-building").value;
    populateEditRoomOptions(b);
}

function populateEditRoomOptions(buildingName, selectedRoom = null) {
    const select = document.getElementById("edit-res-room");
    select.innerHTML = "";

    const b = BASE_BUILDINGS[buildingName];
    if (!b) return;

    b.floors.forEach(f => {
        const optGroup = document.createElement("optgroup");
        optGroup.label = `${f.name} (${f.title})`;

        f.rooms.forEach(r => {
            const opt = document.createElement("option");
            opt.value = r.number;
            opt.textContent = `${r.number}호 (${r.type || '연습실'})`;
            if (selectedRoom && r.number === selectedRoom) opt.selected = true;
            optGroup.appendChild(opt);
        });

        select.appendChild(optGroup);
    });
}

function populateEditTimeOptions(curStart, curEnd) {
    const sSelect = document.getElementById("edit-res-start");
    const eSelect = document.getElementById("edit-res-end");

    sSelect.innerHTML = "";
    eSelect.innerHTML = "";

    TIME_SLOTS.forEach(s => {
        const optS = document.createElement("option");
        optS.value = s.startStr;
        optS.textContent = s.startStr;
        if (s.startStr === curStart) optS.selected = true;
        sSelect.appendChild(optS);

        const optE = document.createElement("option");
        optE.value = s.endStr;
        optE.textContent = s.endStr;
        if (s.endStr === curEnd) optE.selected = true;
        eSelect.appendChild(optE);
    });
}

// 수정 제출 및 엄격한 중복 검증
function submitEditReservation() {
    if (!currentEditingRes) return;

    const resId = document.getElementById("edit-res-id").value;
    const date = document.getElementById("edit-res-date").value;
    const building = document.getElementById("edit-res-building").value;
    const room = document.getElementById("edit-res-room").value;
    const startTime = document.getElementById("edit-res-start").value;
    const endTime = document.getElementById("edit-res-end").value;
    const name = document.getElementById("edit-res-name").value.trim();
    const sid = document.getElementById("edit-res-sid").value.trim();
    const phone = document.getElementById("edit-res-phone").value.trim();
    const reason = document.getElementById("edit-change-reason").value.trim();

    const startMin = timeStrToMinutes(startTime);
    const endMin = timeStrToMinutes(endTime);

    if (startMin >= endMin) {
        showAdminToast("종료 시간은 시작 시간보다 뒤여야 합니다.", "error");
        return;
    }

    if (!reason) {
        showAdminToast("수정 사유를 입력해주세요 (감사 로그 기록용).", "error");
        document.getElementById("edit-change-reason").focus();
        return;
    }

    // 엄격한 중복 검증 (자신의 ID 제외)
    const check = checkOverlapAdmin(date, building, room, startMin, endMin, resId);
    if (check.overlap) {
        if (check.conflict.isBlock) {
            alert(`[시간 중복 불가]\n선택하신 시간대에 시설 점검 차단 일정이 있습니다: ${check.conflict.name}`);
        } else {
            alert(`[시간 중복 불가]\n해당 시간대에 이미 다른 학생의 예약이 존재합니다!\n(기존 예약: ${check.conflict.name} 학생 / ${check.conflict.startTime}~${check.conflict.endTime})`);
        }
        return;
    }

    const all = getAllReservations();
    const idx = all.findIndex(r => r.id === resId);
    if (idx === -1) return;

    const oldInfo = `${all[idx].date} ${all[idx].startTime}~${all[idx].endTime} (${all[idx].building} ${all[idx].room}호)`;

    all[idx].date = date;
    all[idx].building = building;
    all[idx].room = room;
    all[idx].startTime = startTime;
    all[idx].endTime = endTime;
    all[idx].startMin = startMin;
    all[idx].endMin = endMin;
    all[idx].name = name;
    all[idx].studentId = sid;
    all[idx].phone = phone;
    all[idx].adminNote = `관리자 수정: ${reason}`;
    all[idx].updatedAt = new Date().toISOString();

    saveAllReservations(all);

    const newInfo = `${date} ${startTime}~${endTime} (${building} ${room}호)`;
    addAuditLog("RESERVATION_EDIT", `${resId} (${name})`, reason, `[변경전] ${oldInfo} → [변경후] ${newInfo}`);

    closeEditModal();
    renderReservationsTable();
    renderDashboard();
    showAdminToast("예약 정보가 정상적으로 수정되었습니다.", "success");
}

// =================================================================
// 9. 관리자 직권 취소 모달 제어 (Admin Cancel)
// =================================================================
let cancelTargetId = null;

function openAdminCancelModal(resId) {
    const all = getAllReservations();
    const target = all.find(r => r.id === resId);
    if (!target) return;

    cancelTargetId = resId;
    document.getElementById("cancel-target-id").value = resId;

    const preview = document.getElementById("cancel-preview-box");
    preview.innerHTML = `
        <strong>• 예약 번호:</strong> ${target.id}<br>
        <strong>• 일자 및 시간:</strong> ${target.date} (${target.startTime} ~ ${target.endTime})<br>
        <strong>• 공간:</strong> ${target.building} ${target.room}호 (${target.roomType || '연습실'})<br>
        <strong>• 예약 학생:</strong> ${escapeHtml(target.name)} (학번: ${target.studentId}, 연락처: ${target.phone})
    `;

    document.getElementById("input-cancel-reason").value = "";
    document.getElementById("modal-admin-cancel").style.display = "flex";
}

function closeAdminCancelModal() {
    document.getElementById("modal-admin-cancel").style.display = "none";
    cancelTargetId = null;
}

function submitAdminCancel() {
    if (!cancelTargetId) return;

    const reason = document.getElementById("input-cancel-reason").value.trim();
    if (!reason) {
        showAdminToast("취소 사유를 반드시 입력해주세요.", "error");
        document.getElementById("input-cancel-reason").focus();
        return;
    }

    const all = getAllReservations();
    const idx = all.findIndex(r => r.id === cancelTargetId);
    if (idx === -1) return;

    const target = all[idx];
    target.status = "cancelled";
    target.cancelledAt = new Date().toISOString();
    target.cancelledBy = "admin";
    target.cancelReason = `[관리자 직권 취소] ${reason}`;

    saveAllReservations(all);

    addAuditLog("RESERVATION_CANCEL", `${target.id} (${target.name} 학생)`, reason, `${target.building} ${target.room}호 (${target.date} ${target.startTime}~${target.endTime})`);

    closeAdminCancelModal();
    renderReservationsTable();
    renderDashboard();
    showAdminToast("예약이 정상적으로 직권 취소되었습니다. 해당 시간이 개방되었습니다.", "success");
}

// 관리자 직접 예약 생성 모달 열기 (학생 대리 예약)
function openAdminCreateModal() {
    // 임시로 수정 모달을 활용하거나 샘플 예약
    const studentName = prompt("예약할 학생의 이름을 입력하세요:", "홍길동");
    if (!studentName) return;
    const studentId = prompt("예약할 학생의 학번을 입력하세요:", "20241001");
    if (!studentId) return;

    const todayStr = formatDateKey(new Date());
    const resId = "CSU-ADM-" + Date.now().toString().slice(-6);

    const newRes = {
        id: resId,
        building: "신관",
        floor: "B1",
        room: "B12",
        roomType: "교음(오르간)",
        date: todayStr,
        startTime: "16:00",
        endTime: "17:00",
        startMin: 960,
        endMin: 1020,
        name: studentName,
        studentId: studentId,
        phone: "010-0000-0000",
        status: "confirmed",
        adminNote: "관리자 직접 등록",
        createdAt: new Date().toISOString()
    };

    // 중복 검사
    const check = checkOverlapAdmin(newRes.date, newRes.building, newRes.room, newRes.startMin, newRes.endMin);
    if (check.overlap) {
        alert("해당 시간대에 이미 예약이 있어 직접 등록할 수 없습니다. 예약 수정 기능을 이용해주세요.");
        return;
    }

    const all = getAllReservations();
    all.push(newRes);
    saveAllReservations(all);

    addAuditLog("RESERVATION_CREATE", `${resId} (${studentName})`, "관리자 직접 대리 예약");
    renderReservationsTable();
    renderDashboard();
    showAdminToast("관리자 대리 예약이 확정되었습니다.", "success");
}

// =================================================================
// 10. TAB 3: 연습실 및 점검 관리 (Rooms & Facility Manager)
// =================================================================
let roomFilterBuilding = "신관";

function filterRoomBuilding(bName) {
    roomFilterBuilding = bName;
    document.getElementById("btn-seg-shin").classList.toggle("active", bName === "신관");
    document.getElementById("btn-seg-jong").classList.toggle("active", bName === "종합관");
    renderRoomsManager();
}

function renderRoomsManager() {
    const grid = document.getElementById("rooms-manage-grid");
    grid.innerHTML = "";

    const b = BASE_BUILDINGS[roomFilterBuilding];
    if (!b) return;

    const roomSettings = getRoomSettings();
    const todayStr = formatDateKey(new Date());

    b.floors.forEach(floor => {
        // 운영중지/사용불가 연습실이 젤 밑에 보이도록 정렬
        const sortedRooms = [...floor.rooms].sort((a, b) => {
            const aKey = `${b.name}_${a.number}`;
            const bKey = `${b.name}_${b.number}`;
            const aSettings = roomSettings[aKey] || { isAvailable: true };
            const bSettings = roomSettings[bKey] || { isAvailable: true };
            const aAvail = aSettings.isAvailable !== false ? 1 : 0;
            const bAvail = bSettings.isAvailable !== false ? 1 : 0;
            return bAvail - aAvail;
        });

        sortedRooms.forEach(room => {
            const rKey = `${b.name}_${room.number}`;
            const settings = roomSettings[rKey] || { isAvailable: true, blockedSlots: [] };
            const isAvail = settings.isAvailable !== false;

            const card = document.createElement("div");
            card.className = `room-manage-card ${isAvail ? '' : 'disabled'}`;

            // 오늘 이후 차단 일정 수 계산
            const activeBlocks = (settings.blockedSlots || []).filter(s => s.date >= todayStr);

            let blockedHtml = "";
            if (activeBlocks.length > 0) {
                blockedHtml = `
                    <div class="rmc-blocked-box">
                        <strong>🚧 예약 차단 일정 (${activeBlocks.length}건):</strong><br>
                        ${activeBlocks.map(s => `• ${s.date} ${s.startTime}~${s.endTime} (${escapeHtml(s.reason)})`).join('<br>')}
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="rmc-top">
                    <div class="rmc-title-area">
                        <h4>${room.number}호 연습실</h4>
                        <span>${b.name} ${floor.name} (${floor.title})</span>
                    </div>
                    <label class="toggle-switch" title="연습실 전체 개방 여부 토글">
                        <input type="checkbox" ${isAvail ? 'checked' : ''} onchange="toggleRoomAvailable('${rKey}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="rmc-body">
                    <div class="rmc-spec-row">
                        <span style="color:var(--gray-500);">악기/공간 구분</span>
                        <strong style="color:var(--primary);">${escapeHtml(room.type || '일반')}</strong>
                    </div>
                    <div class="rmc-spec-row">
                        <span style="color:var(--gray-500);">운영 상태</span>
                        <span class="badge-status ${isAvail ? 'confirmed' : 'cancelled'}">
                            ${isAvail ? '정상 운영 중' : '전면 이용 중지'}
                        </span>
                    </div>
                    ${blockedHtml}
                </div>
                <div class="rmc-footer">
                    <button class="btn-action edit" onclick="openBlockRoomModal('${rKey}', '${b.name} ${room.number}호')">점검/시간 차단</button>
                    ${activeBlocks.length > 0 ? `<button class="btn-action cancel" onclick="clearRoomBlocks('${rKey}')">차단 해제</button>` : ''}
                </div>
            `;

            grid.appendChild(card);
        });
    });
}

// 전체 개방 여부 토글
function toggleRoomAvailable(rKey, isAvailable) {
    const settings = getRoomSettings();
    if (!settings[rKey]) settings[rKey] = { isAvailable: true, blockedSlots: [] };
    settings[rKey].isAvailable = isAvailable;
    saveRoomSettings(settings);

    addAuditLog("ROOM_STATUS_TOGGLE", rKey, isAvailable ? "연습실 정상 운영 개방" : "연습실 전면 이용 중지 설정");
    showAdminToast(`${rKey}의 운영 상태가 ${isAvailable ? '정상 개방' : '이용 중지'}로 변경되었습니다.`, "success");
    renderRoomsManager();
}

// 특정 시간대 차단 모달 제어
let blockTargetKey = null;

function openBlockRoomModal(rKey, displayName) {
    blockTargetKey = rKey;
    document.getElementById("block-room-key").value = rKey;
    document.getElementById("block-target-room-name").textContent = `${displayName} 점검 차단 설정`;

    const todayStr = formatDateKey(new Date());
    document.getElementById("block-date").value = todayStr;

    // 시작/종료 셀렉트 채우기
    const sSelect = document.getElementById("block-start-time");
    const eSelect = document.getElementById("block-end-time");
    sSelect.innerHTML = "";
    eSelect.innerHTML = "";

    TIME_SLOTS.forEach(s => {
        const optS = document.createElement("option");
        optS.value = s.startStr;
        optS.textContent = s.startStr;
        sSelect.appendChild(optS);

        const optE = document.createElement("option");
        optE.value = s.endStr;
        optE.textContent = s.endStr;
        eSelect.appendChild(optE);
    });

    sSelect.value = "13:00";
    eSelect.value = "15:00";
    document.getElementById("block-reason").value = "피아노 정기 조율 및 점검";

    checkBlockConflicts();
    document.getElementById("modal-block-room").style.display = "flex";
}

function closeBlockRoomModal() {
    document.getElementById("modal-block-room").style.display = "none";
    blockTargetKey = null;
}

// 기존 예약 충돌 실시간 감지
function checkBlockConflicts() {
    const rKey = document.getElementById("block-room-key").value;
    if (!rKey) return;

    const [building, room] = rKey.split("_");
    const date = document.getElementById("block-date").value;
    const startStr = document.getElementById("block-start-time").value;
    const endStr = document.getElementById("block-end-time").value;

    const startMin = timeStrToMinutes(startStr);
    const endMin = timeStrToMinutes(endStr);

    const alertBox = document.getElementById("block-conflict-alert");
    const conflictList = document.getElementById("conflict-bookings-list");

    const all = getAllReservations();
    const conflicts = all.filter(r => {
        if (r.status === "cancelled") return false;
        if (r.building === building && r.room === room && r.date === date) {
            return startMin < r.endMin && endMin > r.startMin;
        }
        return false;
    });

    if (conflicts.length > 0) {
        alertBox.style.display = "block";
        conflictList.innerHTML = conflicts.map(c => `
            <div>• <strong>${escapeHtml(c.name)}</strong> 학생 (${c.studentId}, ${c.phone}) - 이용시간: ${c.startTime}~${c.endTime}</div>
        `).join("");
    } else {
        alertBox.style.display = "none";
        conflictList.innerHTML = "";
    }
}

// 시간 차단 제출
function submitBlockRoomSlot() {
    if (!blockTargetKey) return;

    const [building, room] = blockTargetKey.split("_");
    const date = document.getElementById("block-date").value;
    const startTime = document.getElementById("block-start-time").value;
    const endTime = document.getElementById("block-end-time").value;
    const reason = document.getElementById("block-reason").value.trim();

    const startMin = timeStrToMinutes(startTime);
    const endMin = timeStrToMinutes(endTime);

    if (startMin >= endMin) {
        showAdminToast("종료 시간은 시작 시간보다 뒤여야 합니다.", "error");
        return;
    }

    if (!reason) {
        showAdminToast("차단 사유를 입력해주세요.", "error");
        return;
    }

    // 기존 충돌 예약이 있다면 자동 직권 취소 처리
    const all = getAllReservations();
    let cancelledCount = 0;
    all.forEach(r => {
        if (r.status === "confirmed" && r.building === building && r.room === room && r.date === date) {
            if (startMin < r.endMin && endMin > r.startMin) {
                r.status = "cancelled";
                r.cancelledAt = new Date().toISOString();
                r.cancelledBy = "admin";
                r.cancelReason = `[시설 점검 차단] ${reason}`;
                cancelledCount++;
            }
        }
    });

    if (cancelledCount > 0) {
        saveAllReservations(all);
    }

    // 룸 설정에 차단 슬롯 추가
    const settings = getRoomSettings();
    if (!settings[blockTargetKey]) settings[blockTargetKey] = { isAvailable: true, blockedSlots: [] };
    if (!settings[blockTargetKey].blockedSlots) settings[blockTargetKey].blockedSlots = [];

    settings[blockTargetKey].blockedSlots.push({
        date: date,
        startTime: startTime,
        endTime: endTime,
        reason: reason,
        createdAt: new Date().toISOString()
    });

    saveRoomSettings(settings);

    addAuditLog("ROOM_BLOCK", blockTargetKey, reason, `${date} ${startTime}~${endTime} (충돌 예약 ${cancelledCount}건 자동 취소)`);

    closeBlockRoomModal();
    renderRoomsManager();
    renderDashboard();
    renderReservationsTable();

    showAdminToast(`차단 설정이 완료되었습니다.${cancelledCount > 0 ? ` (충돌된 기존 예약 ${cancelledCount}건 자동 취소)` : ''}`, "success");
}

function clearRoomBlocks(rKey) {
    if (!confirm(`${rKey}에 설정된 모든 점검/차단 일정을 해제하시겠습니까?`)) return;

    const settings = getRoomSettings();
    if (settings[rKey]) {
        settings[rKey].blockedSlots = [];
        saveRoomSettings(settings);
    }

    addAuditLog("ROOM_BLOCK_CLEAR", rKey, "모든 차단 일정 해제");
    showAdminToast("차단 일정이 모두 해제되었습니다.", "success");
    renderRoomsManager();
}

// 새 연습실 등록 모달
function openAddRoomModal() {
    document.getElementById("room-form-mode").value = "add";
    document.getElementById("room-form-modal-title").textContent = "새 연습실 등록";
    document.getElementById("rf-building").value = roomFilterBuilding;
    document.getElementById("rf-floor").value = "";
    document.getElementById("rf-number").value = "";
    document.getElementById("rf-type").value = "";
    document.getElementById("modal-room-form").style.display = "flex";
}

function closeRoomFormModal() {
    document.getElementById("modal-room-form").style.display = "none";
}

function submitRoomForm() {
    const building = document.getElementById("rf-building").value;
    const floor = document.getElementById("rf-floor").value.trim();
    const number = document.getElementById("rf-number").value.trim();
    const type = document.getElementById("rf-type").value.trim();
    const category = document.getElementById("rf-category").value;

    if (!floor || !number || !type) {
        showAdminToast("모든 필수 입력값을 작성해주세요.", "error");
        return;
    }

    // BASE_BUILDINGS에 추가
    const b = BASE_BUILDINGS[building];
    if (b) {
        let f = b.floors.find(fl => fl.name === floor);
        if (!f) {
            f = { name: floor, title: `${floor}층`, rooms: [] };
            b.floors.push(f);
        }

        const existing = f.rooms.find(r => r.number === number);
        if (existing) {
            existing.type = type;
            existing.category = category;
        } else {
            f.rooms.push({ number, type, category });
        }
    }

    addAuditLog("ROOM_CREATE", `${building} ${number}호`, `새 연습실 등록 (${type})`);
    closeRoomFormModal();
    renderRoomsManager();
    showAdminToast("연습실이 성공적으로 등록되었습니다.", "success");
}

// =================================================================
// 11. TAB 4: 예약 정책 설정 (Policies)
// =================================================================
function renderPoliciesForm() {
    const p = getBookingPolicies();
    document.getElementById("policy-max-hours").value = p.maxDurationHours || 2;
    document.getElementById("policy-daily-max").value = p.maxDailyBookingsPerUser || 2;
    document.getElementById("policy-advance-days").value = p.bookingAdvanceDays !== undefined ? p.bookingAdvanceDays : 0;
    document.getElementById("policy-cancel-minutes").value = p.cancelDeadlineMinutes !== undefined ? p.cancelDeadlineMinutes : 30;
    const openSelect = document.getElementById("policy-open-hour");
    if (openSelect) openSelect.value = p.dailyOpenHour !== undefined ? p.dailyOpenHour : 5;
}

function savePolicies() {
    const maxHours = parseFloat(document.getElementById("policy-max-hours").value);
    const dailyMax = parseInt(document.getElementById("policy-daily-max").value, 10);
    const advanceDays = parseInt(document.getElementById("policy-advance-days").value, 10);
    const cancelMins = parseInt(document.getElementById("policy-cancel-minutes").value, 10);
    const openHour = parseInt(document.getElementById("policy-open-hour").value, 10);

    if (dailyMax < 1 || advanceDays < 0) {
        showAdminToast("사전 예약 일수는 0일 이상(0일=당일 전용), 일일 횟수는 1 이상이어야 합니다.", "error");
        return;
    }

    const policies = {
        maxDurationHours: maxHours,
        maxDailyBookingsPerUser: dailyMax,
        bookingAdvanceDays: advanceDays,
        cancelDeadlineMinutes: cancelMins,
        dailyOpenHour: isNaN(openHour) ? 5 : openHour,
        updatedAt: new Date().toISOString()
    };

    saveBookingPolicies(policies);
    addAuditLog("POLICY_UPDATE", "예약 정책 변경", `1회 최대 ${maxHours}시간, 1일 최대 ${dailyMax}회, 사전 ${advanceDays}일, 취소마감 ${cancelMins}분전, 당일오픈 새벽 ${openHour}시`);
    showAdminToast("예약 정책이 성공적으로 저장되었으며 학생 예약 시스템에 즉시 반영됩니다.", "success");
}

// =================================================================
// 12. TAB 5: 감사 로그 / 작업 이력 (Audit Logs)
// =================================================================
function renderAuditLogsList() {
    const list = getAuditLogs();
    const container = document.getElementById("audit-logs-list");
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--gray-400);">기록된 관리자 작업 로그가 없습니다.</div>`;
        return;
    }

    list.forEach(log => {
        const item = document.createElement("div");
        item.className = "audit-item";

        let badgeClass = "edit";
        let actionKor = "작업";
        if (log.action.includes("CANCEL")) { badgeClass = "cancel"; actionKor = "예약 취소"; }
        else if (log.action.includes("BLOCK")) { badgeClass = "block"; actionKor = "시설 차단"; }
        else if (log.action.includes("POLICY")) { badgeClass = "policy"; actionKor = "정책 변경"; }
        else if (log.action.includes("LOGIN")) { badgeClass = "policy"; actionKor = "로그인"; }
        else if (log.action.includes("EDIT")) { badgeClass = "edit"; actionKor = "예약 수정"; }

        item.innerHTML = `
            <div class="audit-left">
                <span class="audit-badge ${badgeClass}">${actionKor}</span>
                <div>
                    <div class="audit-desc">${escapeHtml(log.target)} - ${escapeHtml(log.reason)}</div>
                    <div class="audit-meta">
                        작업자: <strong>${escapeHtml(log.adminId)}</strong> · 일시: ${new Date(log.timestamp).toLocaleString()}
                        ${log.details ? ` · <span style="color:var(--gray-500);">${escapeHtml(log.details)}</span>` : ''}
                    </div>
                </div>
            </div>
            <code style="font-size:11px; color:var(--gray-400);">${log.id}</code>
        `;

        container.appendChild(item);
    });

    document.getElementById("badge-total-logs").textContent = list.length;
}

function clearOldAuditLogs() {
    if (!confirm("최근 100건을 제외한 이전 감사 로그를 정리하시겠습니까?")) return;
    const list = getAuditLogs();
    const kept = list.slice(0, 100);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(kept));
    showAdminToast("오래된 로그가 정리되었습니다.", "success");
    renderAuditLogsList();
}

// =================================================================
// 13. TAB 6: 게시판 관리 엔진 (공지사항 & 학생 실명 문의사항)
// =================================================================
let adminBoardSubtab = "notice";
let currentEditingInquiryId = null;

function getAdminBoardPosts() {
    try {
        const raw = localStorage.getItem(BOARD_STORAGE_KEY);
        if (raw !== null) {
            return JSON.parse(raw);
        }
        return [];
    } catch (e) {
        return [];
    }
}

function saveAdminBoardPosts(posts) {
    if (!checkAdminAuth()) {
        showAdminToast("관리자 인증 세션이 만료되었습니다. 다시 로그인해주세요.", "error");
        return false;
    }
    localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(posts));
    updateAdminBoardBadges();
    return true;
}

// 브라우저 탭 간 실시간 변경 감지 (학생 화면에서 새 문의글 등록 시 관리자 화면 즉시 갱신!)
window.addEventListener("storage", (e) => {
    if (e.key === BOARD_STORAGE_KEY) {
        updateAdminBoardBadges();
        if (currentTab === "board") {
            if (adminBoardSubtab === "notice") renderAdminNoticeTable();
            else renderAdminInquiryTable();
        }
    }
});

function updateAdminBoardBadges() {
    const badge = document.getElementById("badge-total-board");
    if (!badge) return;

    const posts = getAdminBoardPosts();
    // 답변 대기 중인 문의 수 확인
    const waitingCount = posts.filter(p => p.category === "inquiry" && !p.answer).length;
    badge.textContent = waitingCount > 0 ? `대기 ${waitingCount}` : posts.length;
    if (waitingCount > 0) {
        badge.style.background = "#ef4444";
        badge.style.color = "white";
    } else {
        badge.style.background = "var(--gray-200)";
        badge.style.color = "var(--gray-700)";
    }
}

function renderAdminBoardPanels() {
    updateAdminBoardBadges();
    switchAdminBoardSubtab(adminBoardSubtab);
}

function switchAdminBoardSubtab(subtab) {
    adminBoardSubtab = subtab;

    const btnNotice = document.getElementById("btn-admin-subtab-notice");
    const btnInquiry = document.getElementById("btn-admin-subtab-inquiry");
    const pNotice = document.getElementById("admin-notice-panel");
    const pInquiry = document.getElementById("admin-inquiry-panel");

    if (subtab === "notice") {
        if (btnNotice) { btnNotice.className = "btn-action edit"; }
        if (btnInquiry) { btnInquiry.className = "btn-action detail"; }
        if (pNotice) pNotice.style.display = "block";
        if (pInquiry) pInquiry.style.display = "none";
        renderAdminNoticeTable();
    } else {
        if (btnNotice) { btnNotice.className = "btn-action detail"; }
        if (btnInquiry) { btnInquiry.className = "btn-action edit"; }
        if (pNotice) pNotice.style.display = "none";
        if (pInquiry) pInquiry.style.display = "block";
        renderAdminInquiryTable();
    }
}

// -------------------------------------------------------------
// 공지사항 관리 (관리자 전용 작성 및 수정/삭제)
// -------------------------------------------------------------
function renderAdminNoticeTable() {
    const tbody = document.getElementById("tbody-admin-notices");
    if (!tbody) return;

    tbody.innerHTML = "";
    const posts = getAdminBoardPosts();
    const notices = posts.filter(p => p.category === "notice");

    // 중요 공지 상단, 그 다음 최신순
    notices.sort((a, b) => {
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (notices.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--gray-500);">등록된 공지사항이 없습니다. [➕ 새 공지사항 작성] 버튼을 눌러 등록하세요.</td></tr>`;
        return;
    }

    notices.forEach(n => {
        const tr = document.createElement("tr");
        const dateStr = n.createdAt ? n.createdAt.slice(0, 10) : "";

        tr.innerHTML = `
            <td>
                ${n.isImportant ? '<span class="badge-status blocked" style="background:#fef3c7; color:#b45309;">★ 중요</span>' : '<span class="badge-status confirmed">일반</span>'}
            </td>
            <td>
                <strong style="color:var(--gray-900); font-size:14px;">${escapeHtml(n.title)}</strong>
                <p style="font-size:12px; color:var(--gray-500); margin:4px 0 0; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(n.content)}</p>
            </td>
            <td>${escapeHtml(n.authorName || '관리실')}</td>
            <td>${dateStr}</td>
            <td style="text-align:center;">
                <div style="display:flex; justify-content:center; gap:6px;">
                    <button class="btn-action edit" onclick="openAdminNoticeModal('${n.id}')">수정</button>
                    <button class="btn-action cancel" onclick="deleteAdminNotice('${n.id}')">삭제</button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function openAdminNoticeModal(noticeId = null) {
    if (!checkAdminAuth()) {
        showAdminToast("관리자 권한이 필요합니다.", "error");
        return;
    }

    const modal = document.getElementById("modal-admin-notice");
    const titleEl = document.getElementById("admin-notice-modal-title");
    const idInput = document.getElementById("admin-notice-id");
    const titleInput = document.getElementById("admin-notice-title");
    const impCheckbox = document.getElementById("admin-notice-important");
    const contentInput = document.getElementById("admin-notice-content");
    const btnSave = document.getElementById("btn-save-notice");

    if (!modal) return;

    if (noticeId) {
        const posts = getAdminBoardPosts();
        const found = posts.find(p => p.id === noticeId);
        if (found) {
            titleEl.textContent = "공지사항 수정";
            idInput.value = found.id;
            titleInput.value = found.title;
            impCheckbox.checked = !!found.isImportant;
            contentInput.value = found.content;
            btnSave.textContent = "공지사항 수정 저장";
        }
    } else {
        titleEl.textContent = "새 공지사항 작성";
        idInput.value = "";
        titleInput.value = "";
        impCheckbox.checked = false;
        contentInput.value = "";
        btnSave.textContent = "공지사항 등록";
    }

    modal.style.display = "flex";
}

function closeAdminNoticeModal() {
    const modal = document.getElementById("modal-admin-notice");
    if (modal) modal.style.display = "none";
}

function submitAdminNotice() {
    if (!checkAdminAuth()) return;

    const idInput = document.getElementById("admin-notice-id");
    const titleInput = document.getElementById("admin-notice-title");
    const impCheckbox = document.getElementById("admin-notice-important");
    const contentInput = document.getElementById("admin-notice-content");

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const isImportant = impCheckbox.checked;
    const noticeId = idInput.value;

    if (!title || !content) {
        showAdminToast("제목과 내용을 모두 입력해주세요.", "error");
        return;
    }

    const posts = getAdminBoardPosts();

    if (noticeId) {
        // 기존 공지 수정
        const idx = posts.findIndex(p => p.id === noticeId);
        if (idx !== -1) {
            posts[idx].title = title;
            posts[idx].content = content;
            posts[idx].isImportant = isImportant;
            posts[idx].updatedAt = new Date().toISOString();

            saveAdminBoardPosts(posts);
            addAuditLog("NOTICE_UPDATE", `공지사항 수정: [${title}]`, "내용 및 중요도 변경");
            showAdminToast("공지사항이 성공적으로 수정되었습니다.", "success");
        }
    } else {
        // 새 공지 등록
        const newNotice = {
            id: "NOTICE-" + Date.now(),
            category: "notice",
            title: title,
            content: content,
            authorName: "교회음악과 관리실",
            authorId: "admin",
            visibility: "public",
            isImportant: isImportant,
            createdAt: new Date().toISOString(),
            answer: null
        };

        posts.unshift(newNotice);
        saveAdminBoardPosts(posts);
        addAuditLog("NOTICE_CREATE", `새 공지사항 등록: [${title}]`, isImportant ? "중요 공지" : "일반 공지");
        showAdminToast("새 공지사항이 등록되었으며 학생 화면에 즉시 게시됩니다.", "success");
    }

    closeAdminNoticeModal();
    renderAdminNoticeTable();
}

function deleteAdminNotice(noticeId) {
    if (!checkAdminAuth()) return;

    const posts = getAdminBoardPosts();
    const target = posts.find(p => p.id === noticeId);
    if (!target) return;

    if (!confirm(`공지사항 [${target.title}]을(를) 정말 삭제하시겠습니까?`)) return;

    const remaining = posts.filter(p => p.id !== noticeId);
    saveAdminBoardPosts(remaining);
    addAuditLog("NOTICE_DELETE", `공지사항 삭제: [${target.title}]`, "관리자 삭제");
    showAdminToast("공지사항이 삭제되었습니다.", "success");
    renderAdminNoticeTable();
}

// -------------------------------------------------------------
// 학생 실명 문의사항 관리 (비공개/전체공개 확인 및 공식 답변)
// -------------------------------------------------------------
function renderAdminInquiryTable() {
    const tbody = document.getElementById("tbody-admin-inquiries");
    const filterEl = document.getElementById("filter-inquiry-status");
    if (!tbody) return;

    tbody.innerHTML = "";
    const filterVal = filterEl ? filterEl.value : "ALL";

    const posts = getAdminBoardPosts();
    let inquiries = posts.filter(p => p.category === "inquiry");

    if (filterVal === "WAITING") {
        inquiries = inquiries.filter(p => !p.answer);
    } else if (filterVal === "ANSWERED") {
        inquiries = inquiries.filter(p => !!p.answer);
    }

    // 최신순 정렬
    inquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (inquiries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--gray-500);">해당 조건의 학생 문의사항이 없습니다.</td></tr>`;
        return;
    }

    inquiries.forEach(inq => {
        const tr = document.createElement("tr");
        const dateStr = inq.createdAt ? inq.createdAt.slice(0, 10) : "";
        const isSecret = inq.visibility === "staff";
        const isAnswered = !!inq.answer;

        tr.innerHTML = `
            <td>
                ${isSecret 
                    ? '<span class="badge-status" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1;">🔒 관계자</span>'
                    : '<span class="badge-status confirmed">🌐 전체공개</span>'}
            </td>
            <td>
                <strong style="color:var(--gray-900); font-size:14px;">${escapeHtml(inq.title)}</strong>
                <p style="font-size:12px; color:var(--gray-500); margin:4px 0 0; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(inq.content)}</p>
            </td>
            <td>
                <strong style="color:var(--primary);">${escapeHtml(inq.authorName)}</strong>
                <span style="font-size:12px; color:var(--gray-500);">(${escapeHtml(inq.authorId)})</span>
            </td>
            <td>${dateStr}</td>
            <td style="text-align:center;">
                ${isAnswered 
                    ? '<span class="badge-status confirmed" style="background:#dcfce7; color:#15803d;">✓ 답변완료</span>'
                    : '<span class="badge-status blocked" style="background:#fef2f2; color:#b91c1c;">답변대기</span>'}
            </td>
            <td style="text-align:center;">
                <div style="display:flex; justify-content:center; gap:6px;">
                    <button class="btn-action edit" onclick="openAdminInquiryModal('${inq.id}')">
                        ${isAnswered ? '답변확인/수정' : '답변작성'}
                    </button>
                    <button class="btn-action cancel" onclick="deleteAdminInquiryDirect('${inq.id}')">삭제</button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function openAdminInquiryModal(inquiryId) {
    if (!checkAdminAuth()) return;

    const modal = document.getElementById("modal-admin-inquiry");
    if (!modal) return;

    const posts = getAdminBoardPosts();
    const found = posts.find(p => p.id === inquiryId);
    if (!found) return;

    currentEditingInquiryId = inquiryId;

    document.getElementById("admin-inquiry-id").value = found.id;
    document.getElementById("admin-inquiry-title").textContent = found.title;
    document.getElementById("admin-inquiry-author").textContent = found.authorName;
    document.getElementById("admin-inquiry-sid").textContent = found.authorId;
    document.getElementById("admin-inquiry-date").textContent = found.createdAt ? found.createdAt.slice(0, 10) : "";
    document.getElementById("admin-inquiry-content").textContent = found.content;

    const visBadge = document.getElementById("admin-inquiry-vis-badge");
    if (found.visibility === "staff") {
        visBadge.className = "badge-status";
        visBadge.style.background = "#f1f5f9";
        visBadge.style.color = "#475569";
        visBadge.textContent = "🔒 관계자에게만 공개 (비공개)";
    } else {
        visBadge.className = "badge-status confirmed";
        visBadge.textContent = "🌐 전체 공개";
    }

    const answerStatus = document.getElementById("admin-answer-status");
    const answerInput = document.getElementById("admin-inquiry-answer");

    if (found.answer) {
        answerStatus.textContent = `(최근 답변: ${found.answer.createdAt ? found.answer.createdAt.slice(0, 10) : ''})`;
        answerInput.value = found.answer.content || "";
    } else {
        answerStatus.textContent = "(답변 미작성 상태)";
        answerInput.value = "";
    }

    modal.style.display = "flex";
}

function closeAdminInquiryModal() {
    const modal = document.getElementById("modal-admin-inquiry");
    if (modal) modal.style.display = "none";
    currentEditingInquiryId = null;
}

function saveAdminAnswer() {
    if (!checkAdminAuth() || !currentEditingInquiryId) return;

    const answerInput = document.getElementById("admin-inquiry-answer");
    const content = answerInput ? answerInput.value.trim() : "";

    if (!content) {
        showAdminToast("답변 내용을 입력해주세요.", "error");
        return;
    }

    const posts = getAdminBoardPosts();
    const target = posts.find(p => p.id === currentEditingInquiryId);
    if (!target) return;

    target.answer = {
        content: content,
        author: "교회음악과 관리실",
        createdAt: new Date().toISOString()
    };

    saveAdminBoardPosts(posts);
    addAuditLog("INQUIRY_ANSWER", `학생 문의 답변: [${target.title}]`, `작성자: ${target.authorName}(${target.authorId})`);
    showAdminToast("공식 답변이 저장되었으며 학생 화면에 즉시 반영됩니다.", "success");

    closeAdminInquiryModal();
    renderAdminInquiryTable();
}

function deleteAdminInquiryDirect(inquiryId) {
    if (!checkAdminAuth()) return;

    const posts = getAdminBoardPosts();
    const target = posts.find(p => p.id === inquiryId);
    if (!target) return;

    if (!confirm(`[${target.title}] 문의글을 정말 삭제하시겠습니까?`)) return;

    const remaining = posts.filter(p => p.id !== inquiryId);
    saveAdminBoardPosts(remaining);
    addAuditLog("INQUIRY_DELETE", `학생 문의 삭제: [${target.title}]`, `작성자: ${target.authorName}(${target.authorId})`);
    showAdminToast("문의글이 삭제되었습니다.", "success");
    renderAdminInquiryTable();
}

function deleteAdminInquiry() {
    if (!currentEditingInquiryId) return;
    deleteAdminInquiryDirect(currentEditingInquiryId);
    closeAdminInquiryModal();
}

// =================================================================
// 14. 앱 초기화 (App Bootstrapping)
// =================================================================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. 관리자 마스터 계정 초기화 확인
    await initAdminAccounts();

    // 2. 권한 검증 및 화면 상태 표시
    renderAppByAuth();

    // 3. 게시판 배지 갱신
    updateAdminBoardBadges();
});
