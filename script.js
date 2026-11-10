/**
 * 총신대학교 교회음악과 온라인 연습실 예약 시스템
 * Chongshin University Department of Church Music
 * Practice Room Online Reservation System Engine
 */

// =================================================================
// 1. 연습실 데이터 정의 (신관 33실 + 종합관 12실)
// =================================================================
const BUILDINGS = {
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
// 2. 예약 가능 시간 슬롯 (사용자 지정 정확한 26개 타임테이블 순서)
// =================================================================
const OPERATING_START_HOUR = 9;   // 09:00
const OPERATING_END_HOUR = 22;    // 22:00
const TOTAL_SLOTS = 26;

// 사용자가 지정한 정확한 26개 슬롯 목록 (11:00~11:40, 11:40~12:00 채플 시간표 반영)
const TIME_SLOT_DEFS = [
    { start: "09:00", end: "09:30", hour: 9 },
    { start: "09:30", end: "10:00", hour: 9 },
    { start: "10:00", end: "10:30", hour: 10 },
    { start: "10:30", end: "11:00", hour: 10 },
    { start: "11:00", end: "11:40", hour: 11 }, // 11:00~11:40
    { start: "11:40", end: "12:00", hour: 11 }, // 11:40~12:00
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
        duration: eMins - sMins,
        label: `${def.start} ~ ${def.end}`
    };
});

// 시간 문자열 변환 유틸
function minutesToTimeStr(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeStrToMinutes(str) {
    if (!str) return 0;
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
}

// =================================================================
// 3. 시스템 상태 변수 (State Management)
// =================================================================
const STORAGE_KEY = "CHONGSHIN_MUSIC_RESERVATIONS_V2";
const LAST_SEARCH_KEY = "CHONGSHIN_LAST_STUDENT_ID";
const ROOM_SETTINGS_KEY = "CHONGSHIN_ROOM_SETTINGS";
const POLICIES_KEY = "CHONGSHIN_BOOKING_POLICIES";
const BOARD_STORAGE_KEY = "CHONGSHIN_MUSIC_BOARD_POSTS_V1";

// 관리자 설정 정책 및 룸 상태 헬퍼
function getBookingPolicies() {
    try {
        const raw = localStorage.getItem(POLICIES_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                maxDurationHours: parsed.maxDurationHours || 2,
                maxDailyBookingsPerUser: parsed.maxDailyBookingsPerUser || 2,
                bookingAdvanceDays: parsed.bookingAdvanceDays !== undefined ? Number(parsed.bookingAdvanceDays) : 0,
                cancelDeadlineMinutes: parsed.cancelDeadlineMinutes !== undefined ? Number(parsed.cancelDeadlineMinutes) : 30,
                dailyOpenHour: parsed.dailyOpenHour !== undefined ? Number(parsed.dailyOpenHour) : 5
            };
        }
    } catch (e) {}
    return {
        maxDurationHours: 2,
        maxDailyBookingsPerUser: 2,
        bookingAdvanceDays: 0, // 당일 전용 (사전예약 불가)
        cancelDeadlineMinutes: 30,
        dailyOpenHour: 5 // 새벽 5시 오픈
    };
}

function getRoomSettings() {
    try {
        const raw = localStorage.getItem(ROOM_SETTINGS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

// 새벽 05:00 당일 예약 오픈 상태 및 날짜 판별 (오직 당일 새벽 5시 이후에만 예약 가능)
function checkDailyOpenStatus(targetDateStr) {
    const policies = getBookingPolicies();
    const openHour = policies.dailyOpenHour !== undefined ? Number(policies.dailyOpenHour) : 5;

    const now = new Date();
    const todayStr = formatDateKey(now);

    // 1. 과거 날짜: 화면 확인(조회)은 가능하나 예약 신청은 불가
    if (targetDateStr < todayStr) {
        return {
            isOpen: false,
            isPast: true,
            statusType: "PAST",
            openHour: openHour,
            title: "지난 날짜 (조회 전용)",
            badgeText: "조회 전용",
            subText: "🔒 지난 날짜는 예약할 수 없습니다 (조회 전용)",
            alertClass: "past",
            alertIcon: "📅",
            message: "지난 날짜는 예약 현황 조회만 가능하며 예약할 수 없습니다."
        };
    }

    // 2. 미래 날짜 (내일 이후): 화면 확인(조회)은 가능하나 사전 예약 불가 (오직 당일 새벽 5시부터 오픈)
    if (targetDateStr > todayStr) {
        return {
            isOpen: false,
            isFuture: true,
            statusType: "FUTURE",
            openHour: openHour,
            title: "당일 예약제 (사전 예약 불가)",
            badgeText: "당일 오픈",
            subText: `🔒 해당 날짜 당일 새벽 0${openHour}:00부터 예약 가능 (조회 전용)`,
            alertClass: "future",
            alertIcon: "🔒",
            message: `사전 예약은 지원되지 않습니다. 연습실 예약은 이용 당일 새벽 0${openHour}:00부터 가능합니다. (현재는 현황 조회만 가능)`
        };
    }

    // 3. 당일(오늘): 오픈 시간(새벽 5시) 이전이면 오픈 대기 (예약 불가)
    if (openHour > 0 && now.getHours() < openHour) {
        return {
            isOpen: false,
            isBeforeOpen: true,
            statusType: "BEFORE_OPEN",
            openHour: openHour,
            title: "당일 예약 오픈 대기 중",
            badgeText: "오픈 대기",
            subText: `🔒 새벽 0${openHour}:00 이후 예약 가능 (현재 예약 불가 시간)`,
            alertClass: "before-open",
            alertIcon: "⏰",
            message: `당일 연습실 예약 시스템은 매일 새벽 0${openHour}:00에 정식 오픈됩니다. (새벽 5시 이후 예약 가능)`
        };
    }

    // 4. 당일(오늘) + 오픈 시각 이후: 오늘 예약 가능!
    return {
        isOpen: true,
        isToday: true,
        statusType: "OPEN",
        openHour: openHour,
        message: "예약 가능"
    };
}

let currentScreen = "building-screen";
let selectedBuilding = "신관";
let selectedFloor = null;
let selectedRoom = null;
let selectedDate = new Date(); // 예약 화면 기준 날짜

// 슬롯 선택 상태 (인덱스: 0 ~ 25)
let selectedStartSlotIdx = null;
let selectedEndSlotIdx = null;

// 특정 방 예약 현황 화면 상태
let statusDate = new Date();
let statusViewMode = "timeline"; // 'timeline' or 'list'

// 전체 현황판 상태
let overviewBuilding = "신관";
let overviewDate = new Date();

// 예약 취소 진행 상태
let cancelTargetReservation = null;

// =================================================================
// 4. 로컬 스토리지 데이터베이스 엔진 (자체 저장소)
// =================================================================
function getAllReservations() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.error("저장소 읽기 오류:", e);
        return [];
    }
}

function saveAllReservations(list) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        updateHeaderBadge();
        if (typeof pushReservationsToCloud === "function") {
            pushReservationsToCloud(list);
        }
    } catch (e) {
        console.error("저장소 쓰기 오류:", e);
        showToast("예약 데이터 저장에 실패했습니다.", "error");
    }
}

// 유효한(취소되지 않은) 예약 조회
function getActiveReservations(dateStr, building, roomNum) {
    const all = getAllReservations();
    return all.filter(r => {
        if (r.status === "cancelled") return false;
        if (dateStr && r.date !== dateStr) return false;
        if (building && r.building !== building) return false;
        if (roomNum && r.room !== roomNum) return false;
        return true;
    });
}

// 중복 예약 검증: 겹치는 유효 예약 및 시설 점검 차단 시간대 확인
function checkOverlap(dateStr, building, roomNum, startMin, endMin, excludeId = null) {
    const list = getActiveReservations(dateStr, building, roomNum);
    for (const res of list) {
        if (excludeId && res.id === excludeId) continue;
        const resStart = timeStrToMinutes(res.startTime);
        const resEnd = timeStrToMinutes(res.endTime);
        // 시간이 겹치는 조건: startMin < resEnd && endMin > resStart
        if (startMin < resEnd && endMin > resStart) {
            return {
                overlap: true,
                conflict: res
            };
        }
    }

    // 관리자가 등록한 특정 시간대 시설 점검 차단 일정 검사
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
                            name: `시설 점검 (${slot.reason || '이용 제한'})`,
                            isBlocked: true
                        }
                    };
                }
            }
        }
    }

    return { overlap: false };
}

// =================================================================
// 5. 날짜 포맷팅 및 날짜 조작 유틸
// =================================================================
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

function getDayOfWeekName(d) {
    const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    return days[d.getDay()];
}

function getShortDayName(d) {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[d.getDay()];
}

// =================================================================
// 6. 화면 이동 및 네비게이션 제어
// =================================================================
function navTo(screenId) {
    // 모든 화면 숨김
    document.querySelectorAll(".view-screen").forEach(el => {
        el.classList.remove("active");
    });

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add("active");
        currentScreen = screenId;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // 하단 네비게이션 버튼 활성화 갱신
    updateBottomNav(screenId);

    // 화면별 진입 이벤트
    if (screenId === "overview-screen") {
        renderOverviewDashboard();
    } else if (screenId === "my-screen") {
        initMyScreen();
    } else if (screenId === "board-screen") {
        renderBoardScreen();
    }
}

function updateBottomNav(screenId) {
    const bReserve = document.getElementById("bnav-reserve");
    const bOverview = document.getElementById("bnav-overview");
    const bMy = document.getElementById("bnav-my");
    const bBoard = document.getElementById("bnav-board");

    [bReserve, bOverview, bMy, bBoard].forEach(btn => btn && btn.classList.remove("active"));

    if (screenId === "building-screen" || screenId === "room-screen" || screenId === "time-screen" || screenId === "room-status-screen") {
        if (bReserve) bReserve.classList.add("active");
    } else if (screenId === "overview-screen") {
        if (bOverview) bOverview.classList.add("active");
    } else if (screenId === "my-screen") {
        if (bMy) bMy.classList.add("active");
    } else if (screenId === "board-screen") {
        if (bBoard) bBoard.classList.add("active");
    }
}

// 상단 헤더 내 예약 배지 카운트 갱신
function updateHeaderBadge() {
    const badge = document.getElementById("my-badge-count");
    if (!badge) return;

    const savedSid = localStorage.getItem(LAST_SEARCH_KEY);
    if (!savedSid) {
        badge.style.display = "none";
        return;
    }

    const todayStr = formatDateKey(new Date());
    const all = getAllReservations();
    const myCount = all.filter(r =>
        r.status === "confirmed" &&
        (r.studentId === savedSid || r.phone.replace(/[^0-9]/g, "") === savedSid.replace(/[^0-9]/g, "")) &&
        r.date >= todayStr
    ).length;

    if (myCount > 0) {
        badge.textContent = myCount;
        badge.style.display = "flex";
    } else {
        badge.style.display = "none";
    }
}

// =================================================================
// 7. 건물 및 연습실 선택 (Building & Room Screens)
// =================================================================
function selectBuilding(buildingName) {
    if (!BUILDINGS[buildingName]) return;
    selectedBuilding = buildingName;

    // 연습실 목록 화면 타이틀 설정
    const titleEl = document.getElementById("room-screen-building-name");
    if (titleEl) titleEl.textContent = buildingName;

    // 층별 탭 및 목록 생성
    renderFloorTabsAndRooms();

    navTo("room-screen");
}

function renderFloorTabsAndRooms(activeFloorName = "ALL") {
    const b = BUILDINGS[selectedBuilding];
    if (!b) return;

    const tabsContainer = document.getElementById("floor-tabs-container");
    const roomsContainer = document.getElementById("rooms-container");
    if (!tabsContainer || !roomsContainer) return;

    // 층 탭 렌더링
    tabsContainer.innerHTML = "";

    // 전체 탭
    const allTab = document.createElement("button");
    allTab.className = `floor-tab-btn ${activeFloorName === "ALL" ? "active" : ""}`;
    allTab.textContent = `전체 (${getTotalRoomsInBuilding(b)}실)`;
    allTab.onclick = () => renderFloorTabsAndRooms("ALL");
    tabsContainer.appendChild(allTab);

    // 각 층별 탭
    b.floors.forEach(floor => {
        const tab = document.createElement("button");
        tab.className = `floor-tab-btn ${activeFloorName === floor.name ? "active" : ""}`;
        tab.textContent = `${floor.name} (${floor.rooms.length}실)`;
        tab.onclick = () => renderFloorTabsAndRooms(floor.name);
        tabsContainer.appendChild(tab);
    });

    // 방 목록 렌더링
    roomsContainer.innerHTML = "";
    const todayStr = formatDateKey(new Date());
    const activeReservationsToday = getActiveReservations(todayStr, selectedBuilding);

    // 현재 시각 분
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const targetFloors = activeFloorName === "ALL"
        ? b.floors
        : b.floors.filter(f => f.name === activeFloorName);

    // 사용 불가한 방들을 한곳에 모을 배열 (층수별로 구분하지 않고 묶음)
    const unavailableRooms = [];
    const roomSettings = getRoomSettings();

    // 1. 각 층별 "사용 가능한" 연습실만 렌더링
    targetFloors.forEach(floor => {
        const availRooms = [];

        floor.rooms.forEach(room => {
            const rKey = `${selectedBuilding}_${room.number}`;
            const rSetting = roomSettings[rKey];
            const isRoomAvailable = !rSetting || rSetting.isAvailable !== false;

            if (isRoomAvailable) {
                availRooms.push(room);
            } else {
                // 사용 불가한 방은 floor 정보와 함께 별도 수집
                unavailableRooms.push({
                    floor: floor,
                    room: room,
                    setting: rSetting
                });
            }
        });

        // 사용 가능한 방이 해당 층에 있을 경우에만 층 박스 렌더링
        if (availRooms.length > 0) {
            const floorBox = document.createElement("div");
            floorBox.className = "floor-group-box";

            const fHeader = document.createElement("div");
            fHeader.className = "floor-group-header";
            fHeader.innerHTML = `
                <div class="fgh-left">
                    <h3>${floor.name}</h3>
                    <span>${floor.title}</span>
                </div>
                <span class="fgh-count">${availRooms.length}개 연습실</span>
            `;
            floorBox.appendChild(fHeader);

            const grid = document.createElement("div");
            grid.className = "room-cards-grid";

            availRooms.forEach(room => {
                // 현재 사용 중인지 체크
                const isCurrentlyOccupied = activeReservationsToday.some(r => {
                    if (r.room !== room.number) return false;
                    const s = timeStrToMinutes(r.startTime);
                    const e = timeStrToMinutes(r.endTime);
                    return nowMins >= s && nowMins < e;
                });

                // 오늘 남은 예약 건수
                const todayCount = activeReservationsToday.filter(r => r.room === room.number).length;

                const card = document.createElement("div");
                card.className = "room-card-item";

                card.onclick = () => {
                    selectRoom(floor, room);
                };

                // 뱃지 스타일 클래스
                let badgeClass = "";
                if (room.category === "organ") badgeClass = "organ";
                else if (room.category === "grand") badgeClass = "grand";
                else if (room.category === "society") badgeClass = "society";

                card.innerHTML = `
                    <div class="rci-top">
                        <span class="rci-number">${room.number}호</span>
                        <span class="rci-status-dot ${isCurrentlyOccupied ? 'occupied' : ''}" title="${isCurrentlyOccupied ? '현재 사용중' : '현재 비어있음'}"></span>
                    </div>
                    ${room.type ? `<span class="rci-badge ${badgeClass}">${escapeHtml(room.type)}</span>` : '<span class="rci-badge">일반 연습실</span>'}
                    <div class="rci-footer">
                        <span class="rci-live-text ${isCurrentlyOccupied ? 'busy' : 'avail'}">
                            ${isCurrentlyOccupied ? '● 현재 사용중' : '○ 이용 가능'}
                        </span>
                        <span>오늘 예약 ${todayCount}건</span>
                    </div>
                `;
                grid.appendChild(card);
            });

            floorBox.appendChild(grid);
            roomsContainer.appendChild(floorBox);
        } else if (activeFloorName !== "ALL") {
            // 해당 층에 사용 가능한 연습실이 없는 경우 안내
            const floorBox = document.createElement("div");
            floorBox.className = "floor-group-box";
            floorBox.innerHTML = `
                <div class="floor-group-header">
                    <div class="fgh-left">
                        <h3>${floor.name}</h3>
                        <span>${floor.title}</span>
                    </div>
                </div>
                <div style="padding:24px 16px; text-align:center; background:var(--gray-50); border-radius:12px; color:var(--gray-500); font-size:13px;">
                    이 층의 모든 연습실은 현재 점검 중으로 하단 '예약 불가 연습실'에 분류되었습니다.
                </div>
            `;
            roomsContainer.appendChild(floorBox);
        }
    });

    // 2. "예약 불가 연습실" 섹션 (층수별로 구분하지 않고 따로 묶어서 표시)
    if (unavailableRooms.length > 0) {
        const unavailBox = document.createElement("div");
        unavailBox.className = "floor-group-box unavailable-section";

        const uHeader = document.createElement("div");
        uHeader.className = "floor-group-header unavailable-header";
        uHeader.innerHTML = `
            <div class="fgh-left">
                <span class="unavail-tag-icon">🔒</span>
                <h3>예약 불가 연습실</h3>
                <span>시설 점검 및 운영 중지</span>
            </div>
            <span class="fgh-count" style="color:var(--danger); font-weight:800;">${unavailableRooms.length}개실</span>
        `;
        unavailBox.appendChild(uHeader);

        const uGrid = document.createElement("div");
        uGrid.className = "room-cards-grid unavailable-grid";

        unavailableRooms.forEach(({ floor, room, setting }) => {
            const card = document.createElement("div");
            card.className = "room-card-item disabled-room";

            const reasonText = (setting && setting.reason) ? setting.reason : "시설 점검 중";

            card.onclick = () => {
                showToast(`현재 ${room.number}호 연습실은 이용이 불가합니다 (${reasonText}).`, "error");
            };

            card.innerHTML = `
                <div class="rci-top">
                    <div style="display:flex; align-items:baseline; gap:6px;">
                        <span class="rci-number" style="color:var(--gray-500);">${room.number}호</span>
                        <span style="font-size:11px; font-weight:700; color:var(--gray-400);">${floor.name}</span>
                    </div>
                    <span class="rci-status-dot" style="background:#94a3b8;" title="예약 불가"></span>
                </div>
                <span class="rci-badge" style="background:#e2e8f0; color:#64748b;">${escapeHtml(room.type || '일반')}</span>
                <div class="rci-footer" style="border-top-color:#e2e8f0;">
                    <span class="rci-live-text" style="color:#ef4444; font-size:11.5px; font-weight:700;">
                        🚫 예약 불가
                    </span>
                    <span style="font-size:10.5px; color:#94a3b8;">${escapeHtml(reasonText)}</span>
                </div>
            `;
            uGrid.appendChild(card);
        });

        unavailBox.appendChild(uGrid);
        roomsContainer.appendChild(unavailBox);
    }
}

function getTotalRoomsInBuilding(buildingObj) {
    return buildingObj.floors.reduce((acc, f) => acc + f.rooms.length, 0);
}

function selectRoom(floorObj, roomObj) {
    const roomSettings = getRoomSettings();
    const rKey = `${selectedBuilding}_${roomObj.number}`;
    const rSetting = roomSettings[rKey];
    if (rSetting && rSetting.isAvailable === false) {
        showToast("현재 해당 연습실은 시설 점검 등으로 이용이 중지되었습니다.", "error");
        return;
    }

    selectedFloor = floorObj;
    selectedRoom = roomObj;

    // 시간 선택 화면 렌더링
    renderTimeScreen();
    navTo("time-screen");
}

function openOverviewForCurrentBuilding() {
    overviewBuilding = selectedBuilding;
    navTo("overview-screen");
}

// =================================================================
// 8. 날짜 및 시간 슬롯 선택 (Time & Booking Screen)
// =================================================================
function renderTimeScreen() {
    if (!selectedRoom || !selectedFloor) return;

    // 상단 네비게이션 텍스트
    document.getElementById("time-screen-nav-sub").textContent = `${selectedBuilding} · ${selectedFloor.name}`;
    document.getElementById("time-screen-room-name").textContent = `${selectedRoom.number}호`;

    // 방 히어로 카드 갱신
    document.getElementById("rh-type-tag").textContent = selectedRoom.type || "일반 연습실";
    document.getElementById("rh-room-title").textContent = `${selectedRoom.number}호 연습실`;
    document.getElementById("rh-floor-info").textContent = `${selectedBuilding} ${selectedFloor.title} (${selectedFloor.name}) · 30분 단위 예약`;

    // 날짜 헤더 갱신
    updateDateDisplay();

    // 슬롯 선택 초기화 (기본: 첫 비어있는 슬롯 자동 선택 또는 초기화)
    selectedStartSlotIdx = null;
    selectedEndSlotIdx = null;

    // 슬롯 매트릭스 렌더링
    renderSlotsGrid();

    // 드롭다운 옵션 및 요약 갱신
    syncDropdownsWithSelection();
}

function updateDateDisplay() {
    const dateStr = formatDateDisplay(selectedDate);
    const dayStr = getDayOfWeekName(selectedDate);
    const dateKey = formatDateKey(selectedDate);
    const openStatus = checkDailyOpenStatus(dateKey);

    const dnDisplayDate = document.getElementById("dn-display-date");
    const dnDisplayDay = document.getElementById("dn-display-day");

    if (dnDisplayDate) dnDisplayDate.textContent = dateStr;
    if (dnDisplayDay) {
        let tagText = dayStr;
        if (openStatus.isOpen) {
            tagText = `${dayStr} · 오늘 (예약 가능)`;
            dnDisplayDay.style.background = "#dcfce7";
            dnDisplayDay.style.color = "#15803d";
        } else if (openStatus.statusType === "FUTURE") {
            tagText = `${dayStr} · 내일/미래 (조회 전용)`;
            dnDisplayDay.style.background = "#eff6ff";
            dnDisplayDay.style.color = "#1d4ed8";
        } else if (openStatus.statusType === "PAST") {
            tagText = `${dayStr} · 어제/과거 (조회 전용)`;
            dnDisplayDay.style.background = "#f3f4f6";
            dnDisplayDay.style.color = "#4b5563";
        } else if (openStatus.statusType === "BEFORE_OPEN") {
            tagText = `${dayStr} · 오늘 (새벽 0${openStatus.openHour}:00 오픈)`;
            dnDisplayDay.style.background = "#fef2f2";
            dnDisplayDay.style.color = "#b91c1c";
        }
        dnDisplayDay.textContent = tagText;
    }

    // 네이티브 date input 동기화
    const nativeInput = document.getElementById("native-date-input");
    if (nativeInput) {
        nativeInput.value = dateKey;
    }
}

function changeDate(deltaDays) {
    selectedDate = new Date(selectedDate.getTime() + deltaDays * 24 * 60 * 60 * 1000);
    updateDateDisplay();
    selectedStartSlotIdx = null;
    selectedEndSlotIdx = null;
    renderSlotsGrid();
    syncDropdownsWithSelection();
}

function triggerDatePicker() {
    const input = document.getElementById("native-date-input");
    if (!input) return;

    input.onchange = (e) => {
        if (e.target.value) {
            const parts = e.target.value.split('-');
            selectedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            updateDateDisplay();
            selectedStartSlotIdx = null;
            selectedEndSlotIdx = null;
            renderSlotsGrid();
            syncDropdownsWithSelection();
        }
    };

    if (typeof input.showPicker === 'function') {
        input.showPicker();
    } else {
        input.focus();
    }
}

// 타임테이블 스케줄 렌더링 (09:00 ~ 22:00 시간표 뷰 - 30분 단위 버튼 최대 4개/2시간 지원)
function renderSlotsGrid() {
    const container = document.getElementById("slots-grid");
    if (!container) return;

    container.innerHTML = "";
    const dateKey = formatDateKey(selectedDate);

    // 당일 새벽 05:00 오픈 여부 확인
    const openStatus = checkDailyOpenStatus(dateKey);

    // 예약 불가 상태 알림 배너 렌더링 (과거, 미래, 오픈 대기)
    if (!openStatus.isOpen) {
        const alertDiv = document.createElement("div");
        alertDiv.className = `daily-open-alert ${openStatus.alertClass || ''}`;
        
        let alertDesc = "";
        if (openStatus.statusType === "PAST") {
            alertDesc = `<strong>📅 지난 날짜 예약 현황 (조회 전용)</strong><br>과거 날짜는 연습실 예약 현황 확인만 가능하며 신규 예약 신청은 불가합니다.`;
        } else if (openStatus.statusType === "FUTURE") {
            alertDesc = `<strong>🔒 당일 예약제 운영 안내 (조회 전용)</strong><br>연습실 예약은 <strong>이용 당일 새벽 0${openStatus.openHour}:00부터</strong> 가능합니다. 사전 예약은 지원되지 않으며 현황 확인만 가능합니다.`;
        } else {
            alertDesc = `<strong>⏰ 당일 예약 오픈 대기 안내</strong><br>오늘의 연습실 예약 시스템은 <strong>매일 새벽 0${openStatus.openHour}:00</strong>에 정식 오픈됩니다. (새벽 5시 이후 예약 가능)`;
        }

        alertDiv.innerHTML = `
            <span>${openStatus.alertIcon || '⚠️'}</span>
            <div>${alertDesc}</div>
        `;
        container.appendChild(alertDiv);
    }

    // 해당 날짜, 해당 방의 활성 예약 목록
    const activeRes = getActiveReservations(dateKey, selectedBuilding, selectedRoom.number);

    // 전체 트랙 컨테이너
    const track = document.createElement("div");
    track.className = "timetable-track";

    let availableSlotCount = 0;
    const currentSelectedCount = (selectedStartSlotIdx !== null && selectedEndSlotIdx !== null)
        ? (selectedEndSlotIdx - selectedStartSlotIdx + 1)
        : 0;

    const now = new Date();
    const isToday = openStatus.isOpen || openStatus.statusType === "BEFORE_OPEN";
    const nowMins = now.getHours() * 60 + now.getMinutes();

    // 09시부터 21시까지 (13개 시간 그룹)
    for (let h = OPERATING_START_HOUR; h < OPERATING_END_HOUR; h++) {
        const hourBlock = document.createElement("div");
        hourBlock.className = "timetable-hour-block";

        // 좌측 시간 표시 컬럼
        const hourCol = document.createElement("div");
        hourCol.className = "tt-hour-col";
        hourCol.innerHTML = `
            <span class="tt-hour-badge">${String(h).padStart(2, '0')}:00</span>
            <div class="tt-hour-line"></div>
        `;
        hourBlock.appendChild(hourCol);

        // 우측 슬롯 그룹 (정각 슬롯 + 30분 슬롯)
        const slotsGroup = document.createElement("div");
        slotsGroup.className = "tt-slots-group";

        const hourSlotIndices = [(h - OPERATING_START_HOUR) * 2, (h - OPERATING_START_HOUR) * 2 + 1];

        hourSlotIndices.forEach(idx => {
            const slot = TIME_SLOTS[idx];
            if (!slot) return;

            // 해당 슬롯과 겹치는 예약 탐색
            const bookedRes = activeRes.find(r => {
                const s = timeStrToMinutes(r.startTime);
                const e = timeStrToMinutes(r.endTime);
                return slot.startMinutes < e && slot.endMinutes > s;
            });

            // 관리자가 등록한 시설 점검 차단 탐색
            const roomSettings = getRoomSettings();
            const rKey = `${selectedBuilding}_${selectedRoom.number}`;
            const rSet = roomSettings[rKey];
            let blockedSlotInfo = null;
            if (rSet && rSet.blockedSlots) {
                blockedSlotInfo = rSet.blockedSlots.find(bs => {
                    if (bs.date !== dateKey) return false;
                    const s = timeStrToMinutes(bs.startTime);
                    const e = timeStrToMinutes(bs.endTime);
                    return slot.startMinutes < e && slot.endMinutes > s;
                });
            }

            // 오늘 당일이지만 이용 시간이 지난 슬롯인지 확인 (종료 시간이 현재보다 지난 경우)
            const isPastSlot = isToday && slot.endMinutes <= nowMins;

            const isReserved = !!bookedRes || !!blockedSlotInfo || !openStatus.isOpen || isPastSlot;
            if (openStatus.isOpen && !isReserved) availableSlotCount++;

            // 선택 여부 판별
            let isSelected = false;
            let isStart = false;
            let isEnd = false;
            let slotPositionNum = 0;

            if (selectedStartSlotIdx !== null && selectedEndSlotIdx !== null) {
                if (slot.index >= selectedStartSlotIdx && slot.index <= selectedEndSlotIdx) {
                    isSelected = true;
                    slotPositionNum = slot.index - selectedStartSlotIdx + 1;
                    if (slot.index === selectedStartSlotIdx) isStart = true;
                    if (slot.index === selectedEndSlotIdx) isEnd = true;
                }
            }

            const card = document.createElement("div");
            let cardClasses = ['tt-slot-card'];
            if (isReserved) cardClasses.push('reserved');
            if (isSelected) cardClasses.push('selected');
            if (isStart) cardClasses.push('selected-start');
            if (isEnd) cardClasses.push('selected-end');
            if (!openStatus.isOpen) {
                cardClasses.push('locked-before-open');
                if (openStatus.statusType === "FUTURE") cardClasses.push('future-locked');
                if (openStatus.statusType === "PAST") cardClasses.push('past-locked');
            }
            if (isPastSlot) cardClasses.push('past-time-slot');
            card.className = cardClasses.join(' ');

            const policies = getBookingPolicies();
            const maxSlots = Math.round((policies.maxDurationHours || 2) * 2);

            let badgeText = "+ 30분 선택";
            let subText = "터치하여 추가/선택";
            let dotColor = "";
            let badgeStyle = "";

            if (blockedSlotInfo) {
                badgeText = "점검 차단";
                subText = `🔒 시설 점검 (${escapeHtml(blockedSlotInfo.reason || '이용 제한')})`;
                dotColor = "#f59e0b";
                badgeStyle = "background:#fef3c7; color:#92400e; border:1px solid #fde68a;";
            } else if (bookedRes) {
                badgeText = "예약 마감";
                subText = `🔒 예약 완료 (${maskName(bookedRes.name)} 님)`;
                dotColor = "#ef4444";
                badgeStyle = "background:#fee2e2; color:#991b1b; border:1px solid #fecaca;";
            } else if (!openStatus.isOpen) {
                badgeText = openStatus.badgeText;
                subText = openStatus.subText;
                if (openStatus.statusType === "FUTURE") {
                    dotColor = "#3b82f6";
                    badgeStyle = "background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;";
                } else if (openStatus.statusType === "PAST") {
                    dotColor = "#9ca3af";
                    badgeStyle = "background:#f3f4f6; color:#4b5563; border:1px solid #e5e7eb;";
                } else {
                    dotColor = "#ef4444";
                    badgeStyle = "background:#fef2f2; color:#b91c1c; border:1px solid #fecaca;";
                }
            } else if (isPastSlot) {
                badgeText = "시간 경과";
                subText = "⏱️ 이용 시간이 지난 슬롯입니다";
                dotColor = "#9ca3af";
                badgeStyle = "background:#f3f4f6; color:#6b7280; border:1px solid #e5e7eb;";
            } else if (isSelected) {
                const totalText = `${currentSelectedCount * 30}분`;
                if (currentSelectedCount === 1) {
                    badgeText = `✓ 30분 (1/${maxSlots})`;
                    subText = `터치하여 해제하거나 다음 시간 터치 시 연장 (최대 ${maxSlots}개)`;
                } else if (currentSelectedCount === maxSlots) {
                    badgeText = isEnd ? `★ 최대 ${policies.maxDurationHours}시간 (${maxSlots}/${maxSlots})` : `선택 (${slotPositionNum}/${maxSlots})`;
                    subText = `최대 ${policies.maxDurationHours}시간 선택 완료 · 터치하여 축소 가능`;
                } else {
                    badgeText = isEnd ? `✓ ${totalText} (${currentSelectedCount}/${maxSlots})` : `선택 (${slotPositionNum}/${currentSelectedCount})`;
                    subText = `현재 ${currentSelectedCount}개 선택됨 · 추가로 더 터치 가능 (최대 ${maxSlots}개)`;
                }
            }

            card.innerHTML = `
                <div class="tt-slot-left">
                    <div class="tt-slot-time-row">
                        <span class="tt-slot-dot" style="${dotColor ? `background:${dotColor};` : ''}"></span>
                        <span class="tt-slot-time">${slot.startStr} ~ ${slot.endStr}</span>
                    </div>
                    <span class="tt-slot-subtext">${subText}</span>
                </div>
                <span class="tt-slot-badge" style="${badgeStyle}">${badgeText}</span>
            `;

            if (openStatus.isOpen && !isReserved && !isPastSlot) {
                card.onclick = () => onSlotClick(slot.index);
            } else if (!openStatus.isOpen) {
                card.onclick = () => showToast(openStatus.message, "error");
            } else if (blockedSlotInfo) {
                card.onclick = () => showToast(`해당 시간은 시설 점검 중입니다. (${escapeHtml(blockedSlotInfo.reason || '이용 제한')})`, "error");
            } else if (bookedRes) {
                card.onclick = () => showToast(`이미 다른 학생(${maskName(bookedRes.name)} 님)이 예약한 시간대입니다.`, "error");
            } else if (isPastSlot) {
                card.onclick = () => showToast("이미 이용 시간이 지난 시간대는 예약할 수 없습니다.", "error");
            }

            slotsGroup.appendChild(card);
        });

        hourBlock.appendChild(slotsGroup);
        track.appendChild(hourBlock);
    }

    container.appendChild(track);

    // 상단 가이드/카운터 갱신
    const counterEl = document.getElementById("tt-avail-counter");
    if (counterEl) {
        if (!openStatus.isOpen) {
            if (openStatus.statusType === "PAST") {
                counterEl.textContent = "📅 지난 날짜 (조회 전용)";
                counterEl.style.background = "#f3f4f6";
                counterEl.style.color = "#4b5563";
            } else if (openStatus.statusType === "FUTURE") {
                counterEl.textContent = `🔒 당일 새벽 0${openStatus.openHour}:00 오픈 (사전 예약 불가)`;
                counterEl.style.background = "#eff6ff";
                counterEl.style.color = "#1d4ed8";
            } else {
                counterEl.textContent = `🔒 새벽 0${openStatus.openHour}:00 오픈 전 (예약 대기)`;
                counterEl.style.background = "#fef2f2";
                counterEl.style.color = "#b91c1c";
            }
        } else if (currentSelectedCount > 0) {
            const h = Math.floor((currentSelectedCount * 30) / 60);
            const m = (currentSelectedCount * 30) % 60;
            const durStr = `${h > 0 ? h + '시간 ' : ''}${m > 0 ? m + '분' : ''}`;
            const policies = getBookingPolicies();
            const maxSlots = Math.round((policies.maxDurationHours || 2) * 2);
            counterEl.textContent = `선택: ${currentSelectedCount}개/최대 ${maxSlots}개 (${durStr})`;
            counterEl.style.background = "var(--primary)";
            counterEl.style.color = "white";
        } else {
            counterEl.textContent = `${availableSlotCount}/26개 슬롯 예약 가능`;
            counterEl.style.background = "var(--primary-bg)";
            counterEl.style.color = "var(--primary)";
        }
    }

    // 하단 예약 버튼 상태 동기화
    const reserveBtn = document.getElementById("btn-proceed-reserve");
    if (reserveBtn && !openStatus.isOpen) {
        reserveBtn.disabled = true;
        const btnSpan = reserveBtn.querySelector(".btn-text");
        if (btnSpan) {
            if (openStatus.statusType === "PAST") btnSpan.textContent = "지난 날짜는 예약 불가 (조회 전용)";
            else if (openStatus.statusType === "FUTURE") btnSpan.textContent = `이용 당일 새벽 0${openStatus.openHour}:00부터 예약 가능`;
            else btnSpan.textContent = `새벽 0${openStatus.openHour}:00 오픈 후 예약 가능`;
        }
    }

    // 실시간 상태 배지 갱신
    updateLiveStatusBadge(activeRes);
}

function updateLiveStatusBadge(activeRes) {
    const badge = document.getElementById("rh-live-status");
    if (!badge) return;

    const todayStr = formatDateKey(new Date());
    const currentStr = formatDateKey(selectedDate);

    if (todayStr === currentStr) {
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const isBusy = activeRes.some(r => {
            const s = timeStrToMinutes(r.startTime);
            const e = timeStrToMinutes(r.endTime);
            return nowMins >= s && nowMins < e;
        });

        if (isBusy) {
            badge.textContent = "사용 중";
            badge.style.background = "rgba(239, 68, 68, 0.2)";
            badge.style.color = "#fca5a5";
            badge.style.borderColor = "rgba(239, 68, 68, 0.4)";
        } else {
            badge.textContent = "이용 가능";
            badge.style.background = "rgba(16, 185, 129, 0.2)";
            badge.style.color = "#6ee7b7";
            badge.style.borderColor = "rgba(16, 185, 129, 0.4)";
        }
    } else {
        badge.textContent = `${activeRes.length}건 예약됨`;
        badge.style.background = "rgba(59, 130, 246, 0.2)";
        badge.style.color = "#93c5fd";
        badge.style.borderColor = "rgba(59, 130, 246, 0.4)";
    }
}

// 30분 단위 버튼 터치/클릭 처리 핸들러 (어떤 시간이든 첫 선택 가능, 반드시 연속된 시간만 최대 4개 슬롯/2시간 선택)
function onSlotClick(slotIdx) {
    const dateKey = formatDateKey(selectedDate);
    const openStatus = checkDailyOpenStatus(dateKey);
    if (!openStatus.isOpen) {
        showToast(openStatus.message, "error");
        return;
    }

    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const clickedSlot = TIME_SLOTS[slotIdx];
    if (clickedSlot.endMinutes <= nowMins) {
        showToast("이미 이용 시간이 지난 시간대는 예약할 수 없습니다.", "error");
        return;
    }

    const activeRes = getActiveReservations(dateKey, selectedBuilding, selectedRoom.number);

    // 슬롯이 예약되었는지 확인하는 헬퍼
    const isSlotBooked = (idx) => {
        const s = TIME_SLOTS[idx];
        if (!s) return true;
        return activeRes.some(r => {
            const rs = timeStrToMinutes(r.startTime);
            const re = timeStrToMinutes(r.endTime);
            return s.startMinutes < re && s.endMinutes > rs;
        });
    };

    if (isSlotBooked(slotIdx)) {
        showToast("이미 다른 학생이 예약한 시간대입니다.", "error");
        return;
    }

    const policies = getBookingPolicies();
    const maxAllowedSlots = Math.round((policies.maxDurationHours || 2) * 2);
    const maxHoursLabel = policies.maxDurationHours || 2;

    // 1. 아무것도 선택되지 않은 상태: 사용자가 누른 시간을 즉시 시작 슬롯으로 1개 선택!
    if (selectedStartSlotIdx === null || selectedEndSlotIdx === null) {
        selectedStartSlotIdx = slotIdx;
        selectedEndSlotIdx = slotIdx;
    }
    // 2. 단 1개만 선택되어 있고, 같은 슬롯을 다시 누른 경우 -> 선택 해제
    else if (selectedStartSlotIdx === slotIdx && selectedEndSlotIdx === slotIdx) {
        selectedStartSlotIdx = null;
        selectedEndSlotIdx = null;
    }
    // 3. 현재 선택된 구간의 마지막(종료) 슬롯을 누른 경우 -> 1개 축소
    else if (slotIdx === selectedEndSlotIdx && selectedEndSlotIdx > selectedStartSlotIdx) {
        selectedEndSlotIdx = slotIdx - 1;
    }
    // 4. 현재 선택된 구간의 첫(시작) 슬롯을 누른 경우 -> 1개 축소
    else if (slotIdx === selectedStartSlotIdx && selectedEndSlotIdx > selectedStartSlotIdx) {
        selectedStartSlotIdx = slotIdx + 1;
    }
    // 5. 현재 선택 구간의 바로 다음 슬롯을 클릭 (연속으로 뒤로 1개 추가)
    else if (slotIdx === selectedEndSlotIdx + 1) {
        const newCount = selectedEndSlotIdx - selectedStartSlotIdx + 2;
        if (newCount > maxAllowedSlots) {
            showToast(`1회 최대 ${maxAllowedSlots}개 슬롯(${maxHoursLabel}시간)까지만 연속 예약할 수 있습니다.`, "error");
        } else {
            selectedEndSlotIdx = slotIdx;
        }
    }
    // 6. 현재 선택 구간의 바로 이전 슬롯을 클릭 (연속으로 앞으로 1개 추가)
    else if (slotIdx === selectedStartSlotIdx - 1) {
        const newCount = selectedEndSlotIdx - selectedStartSlotIdx + 2;
        if (newCount > maxAllowedSlots) {
            showToast(`1회 최대 ${maxAllowedSlots}개 슬롯(${maxHoursLabel}시간)까지만 연속 예약할 수 있습니다.`, "error");
        } else {
            selectedStartSlotIdx = slotIdx;
        }
    }
    // 7. 한 타임 이상 건너뛴 슬롯을 누른 경우:
    else {
        const spanCount = slotIdx - selectedStartSlotIdx + 1;
        let canExtendContinuous = false;

        if (slotIdx > selectedStartSlotIdx && spanCount <= maxAllowedSlots) {
            let hasOverlap = false;
            for (let i = selectedStartSlotIdx; i <= slotIdx; i++) {
                if (isSlotBooked(i)) {
                    hasOverlap = true;
                    break;
                }
            }
            if (!hasOverlap) {
                canExtendContinuous = true;
            }
        }

        if (canExtendContinuous) {
            selectedEndSlotIdx = slotIdx;
        } else {
            selectedStartSlotIdx = slotIdx;
            selectedEndSlotIdx = slotIdx;
        }
    }

    renderSlotsGrid();
    syncDropdownsWithSelection();
}

// 드롭다운 및 요약 박스 동기화
function syncDropdownsWithSelection() {
    const startSelect = document.getElementById("start-time-select");
    const endSelect = document.getElementById("end-time-select");
    const timeSummary = document.getElementById("dsb-time-text");
    const statusBadge = document.getElementById("dsb-status-badge");
    const summaryBox = document.getElementById("duration-summary-box");
    const reserveBtn = document.getElementById("btn-proceed-reserve");

    if (!startSelect || !endSelect) return;

    const dateKey = formatDateKey(selectedDate);
    const openStatus = checkDailyOpenStatus(dateKey);

    if (!openStatus.isOpen) {
        startSelect.disabled = true;
        endSelect.disabled = true;
        startSelect.innerHTML = `<option value="">선택 불가 (조회 전용)</option>`;
        endSelect.innerHTML = `<option value="">선택 불가 (조회 전용)</option>`;

        let summaryText = "";
        let badgeLabel = "";
        let btnText = "";

        if (openStatus.statusType === "PAST") {
            summaryText = "지난 날짜는 예약 현황 확인만 가능합니다. (예약 신청 불가)";
            badgeLabel = "과거 조회";
            btnText = "지난 날짜는 예약 불가 (조회 전용)";
        } else if (openStatus.statusType === "FUTURE") {
            summaryText = `사전 예약은 지원되지 않으며, 이용 당일 새벽 0${openStatus.openHour}:00부터 예약 가능합니다.`;
            badgeLabel = "사전예약 불가";
            btnText = `이용 당일 새벽 0${openStatus.openHour}:00부터 예약 가능`;
        } else {
            summaryText = `매일 새벽 0${openStatus.openHour}:00에 당일 예약 시스템이 오픈됩니다.`;
            badgeLabel = "오픈 대기";
            btnText = `새벽 0${openStatus.openHour}:00 오픈 후 예약 가능`;
        }

        if (timeSummary) timeSummary.textContent = summaryText;
        if (statusBadge) statusBadge.textContent = badgeLabel;
        if (summaryBox) summaryBox.classList.remove("error");
        if (reserveBtn) {
            reserveBtn.disabled = true;
            const btnSpan = reserveBtn.querySelector(".btn-text");
            if (btnSpan) btnSpan.textContent = btnText;
        }
        return;
    }

    startSelect.disabled = false;
    endSelect.disabled = false;

    // 시작 시간 옵션 렌더링 (09:00 ~ 21:30)
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    startSelect.innerHTML = `<option value="">시작 시간 선택</option>`;
    TIME_SLOTS.forEach(slot => {
        const opt = document.createElement("option");
        opt.value = slot.startStr;
        const isPastSlot = slot.endMinutes <= nowMins;
        if (isPastSlot) {
            opt.textContent = `${slot.startStr} (시간 경과)`;
            opt.disabled = true;
        } else {
            opt.textContent = slot.startStr;
        }
        startSelect.appendChild(opt);
    });

    if (selectedStartSlotIdx !== null) {
        startSelect.value = TIME_SLOTS[selectedStartSlotIdx].startStr;
    } else {
        startSelect.value = "";
    }

    // 종료 시간 옵션 갱신
    updateEndSelectOptions();

    // 요약 표시 업데이트
    if (selectedStartSlotIdx !== null && selectedEndSlotIdx !== null) {
        const startSlot = TIME_SLOTS[selectedStartSlotIdx];
        const endSlot = TIME_SLOTS[selectedEndSlotIdx];
        const durationMins = endSlot.endMinutes - startSlot.startMinutes;
        const slotCount = selectedEndSlotIdx - selectedStartSlotIdx + 1;
        const hours = Math.floor(durationMins / 60);
        const mins = durationMins % 60;
        const durText = `${hours > 0 ? hours + '시간 ' : ''}${mins > 0 ? mins + '분' : ''}`;

        const policies = getBookingPolicies();
        const maxSlots = Math.round((policies.maxDurationHours || 2) * 2);

        timeSummary.textContent = `${startSlot.startStr} ~ ${endSlot.endStr} (총 ${durText}, ${slotCount}개 슬롯)`;
        statusBadge.textContent = `${slotCount}/${maxSlots}개 선택`;
        summaryBox.classList.remove("error");
        reserveBtn.disabled = false;
        const btnSpan = reserveBtn.querySelector(".btn-text");
        if (btnSpan) btnSpan.textContent = "이 시간으로 예약 신청하기";
    } else {
        timeSummary.textContent = "타임테이블에서 원하는 시간 버튼을 터치해주세요";
        statusBadge.textContent = "시간 미선택";
        summaryBox.classList.remove("error");
        reserveBtn.disabled = true;
        const btnSpan = reserveBtn.querySelector(".btn-text");
        if (btnSpan) btnSpan.textContent = "이 시간으로 예약 신청하기";
    }
}

function updateEndSelectOptions() {
    const startSelect = document.getElementById("start-time-select");
    const endSelect = document.getElementById("end-time-select");
    if (!startSelect || !endSelect) return;

    const startStr = startSelect.value;
    const startSlotIdx = TIME_SLOTS.findIndex(s => s.startStr === startStr);
    if (startSlotIdx === -1) return;

    const startSlot = TIME_SLOTS[startSlotIdx];
    const dateKey = formatDateKey(selectedDate);

    endSelect.innerHTML = "";

    const policies = getBookingPolicies();
    const maxSlots = Math.round((policies.maxDurationHours || 2) * 2);

    // 시작 슬롯부터 최대 maxSlots 슬롯까지 가능한 종료시간 계산
    let validEndTimes = [];
    for (let step = 1; step <= maxSlots; step++) {
        const targetSlotIdx = startSlotIdx + step - 1;
        if (targetSlotIdx >= TIME_SLOTS.length) break;

        const targetSlot = TIME_SLOTS[targetSlotIdx];

        // startSlot.startMinutes 부터 targetSlot.endMinutes 사이에 중복 예약이 있는지 검사
        const overlapResult = checkOverlap(dateKey, selectedBuilding, selectedRoom.number, startSlot.startMinutes, targetSlot.endMinutes);
        if (overlapResult.overlap) {
            // 중간에 막히면 더 이상 늘릴 수 없음
            break;
        }

        const totalMins = targetSlot.endMinutes - startSlot.startMinutes;
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        const durText = `${h > 0 ? h + '시간 ' : ''}${m > 0 ? m + '분' : ''}`;
        const label = `${targetSlot.endStr} (${durText}, ${step}개)`;

        validEndTimes.push({ value: targetSlot.endStr, label, slotEndIdx: targetSlotIdx });
    }

    if (validEndTimes.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "예약 불가(시간 중복)";
        endSelect.appendChild(opt);
        return;
    }

    validEndTimes.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item.value;
        opt.textContent = item.label;
        endSelect.appendChild(opt);
    });

    if (selectedEndSlotIdx !== null) {
        const curEndStr = TIME_SLOTS[selectedEndSlotIdx].endStr;
        const found = validEndTimes.find(item => item.value === curEndStr);
        if (found) {
            endSelect.value = curEndStr;
        } else {
            endSelect.value = validEndTimes[0].value;
            selectedEndSlotIdx = validEndTimes[0].slotEndIdx;
        }
    } else {
        endSelect.value = validEndTimes[0].value;
        selectedEndSlotIdx = validEndTimes[0].slotEndIdx;
    }
}

function onStartTimeChange() {
    const startSelect = document.getElementById("start-time-select");
    const sIdx = TIME_SLOTS.findIndex(s => s.startStr === startSelect.value);
    if (sIdx !== -1) {
        selectedStartSlotIdx = sIdx;
        selectedEndSlotIdx = sIdx; // 기본 1개 슬롯
    }
    updateEndSelectOptions();
    renderSlotsGrid();
    syncDropdownsWithSelection();
}

function onEndTimeChange() {
    const endSelect = document.getElementById("end-time-select");
    const eIdx = TIME_SLOTS.findIndex(s => s.endStr === endSelect.value);
    if (eIdx !== -1) {
        selectedEndSlotIdx = eIdx;
    }
    renderSlotsGrid();
    syncDropdownsWithSelection();
}

// =================================================================
// 9. 예약 신청 모달 및 확정 처리 (Booking Submission)
// =================================================================
function openReservationModal() {
    const dateKey = formatDateKey(selectedDate);
    const openStatus = checkDailyOpenStatus(dateKey);
    if (!openStatus.isOpen) {
        showToast(openStatus.message, "error");
        return;
    }

    if (selectedStartSlotIdx === null || selectedEndSlotIdx === null) {
        showToast("예약하실 시간을 먼저 선택해주세요.", "error");
        return;
    }

    const startStr = TIME_SLOTS[selectedStartSlotIdx].startStr;
    const endStr = TIME_SLOTS[selectedEndSlotIdx].endStr;
    const startMin = timeStrToMinutes(startStr);
    const endMin = timeStrToMinutes(endStr);

    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (endMin <= nowMins) {
        showToast("이미 이용 시간이 지난 시간대는 예약할 수 없습니다.", "error");
        return;
    }

    // 중복 체크 최종 검증
    const check = checkOverlap(dateKey, selectedBuilding, selectedRoom.number, startMin, endMin);
    if (check.overlap) {
        showToast("선택하신 시간대에 이미 확정된 예약이 존재합니다.", "error");
        renderSlotsGrid();
        return;
    }

    // 모달 요약 정보 설정
    document.getElementById("modal-summary-room").textContent = `${selectedBuilding} ${selectedRoom.number}호 (${selectedRoom.type || '연습실'})`;
    document.getElementById("modal-summary-date").textContent = `${formatDateDisplay(selectedDate)} (${getShortDayName(selectedDate)})`;

    const durMins = endMin - startMin;
    const h = Math.floor(durMins / 60);
    const m = durMins % 60;
    const durStr = `${h > 0 ? h + '시간 ' : ''}${m > 0 ? m + '분' : ''}`;
    document.getElementById("modal-summary-time").textContent = `${startStr} ~ ${endStr} (총 ${durStr})`;

    // 기존 저장된 본인 학번이 있다면 자동 입력
    const lastSid = localStorage.getItem(LAST_SEARCH_KEY);
    if (lastSid) {
        const idInput = document.getElementById("input-res-sid");
        if (idInput && !idInput.value) idInput.value = lastSid;
    }

    // 모달 열기
    const modal = document.getElementById("reservation-modal");
    if (modal) modal.style.display = "flex";
}

function closeReservationModal() {
    const modal = document.getElementById("reservation-modal");
    if (modal) modal.style.display = "none";
}

function submitReservation() {
    const nameInput = document.getElementById("input-res-name");
    const sidInput = document.getElementById("input-res-sid");
    const phoneInput = document.getElementById("input-res-phone");

    const name = nameInput.value.trim();
    const sid = sidInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name) {
        showToast("예약자 이름을 입력해주세요.", "error");
        nameInput.focus();
        return;
    }
    if (!sid) {
        showToast("학번을 입력해주세요.", "error");
        sidInput.focus();
        return;
    }
    if (!phone || phone.length < 10) {
        showToast("올바른 연락처(휴대전화 번호)를 입력해주세요.", "error");
        phoneInput.focus();
        return;
    }

    const startStr = TIME_SLOTS[selectedStartSlotIdx].startStr;
    const endStr = TIME_SLOTS[selectedEndSlotIdx].endStr;
    const startMin = timeStrToMinutes(startStr);
    const endMin = timeStrToMinutes(endStr);
    const dateKey = formatDateKey(selectedDate);

    // 정책 검증 0: 당일 예약 및 새벽 오픈 검사
    const openStatus = checkDailyOpenStatus(dateKey);
    if (!openStatus.isOpen) {
        alert(`[예약 불가 안내]\n${openStatus.message}`);
        return;
    }

    const todayStr = formatDateKey(new Date());
    if (dateKey !== todayStr) {
        alert("[예약 불가 안내]\n연습실 예약은 오직 이용 당일(오늘)만 신청할 수 있습니다.\n(어제나 내일 등 다른 날짜는 현황 조회만 가능합니다)");
        return;
    }

    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (endMin <= nowMins) {
        showToast("이미 이용 시간이 지난 시간대는 예약할 수 없습니다.", "error");
        return;
    }

    // 정책 검증 1: 사전 예약 가능 날짜 범위 검증
    const policies = getBookingPolicies();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDateObj = new Date(selectedDate);
    targetDateObj.setHours(0, 0, 0, 0);
    const diffDays = Math.round((targetDateObj - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        showToast("지난 날짜는 예약할 수 없습니다.", "error");
        return;
    }
    const maxAdvance = policies.bookingAdvanceDays !== undefined ? policies.bookingAdvanceDays : 0;
    if (diffDays > maxAdvance) {
        alert(`사전 예약은 불가합니다. 연습실 예약은 이용 당일 새벽 0${policies.dailyOpenHour || 5}:00부터 가능합니다.`);
        return;
    }

    // 정책 검증 2: 1일 최대 예약 횟수 검증 (학생 학번 또는 연락처 기준)
    const all = getAllReservations();
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const myTodayBookings = all.filter(r =>
        r.status === "confirmed" &&
        r.date === dateKey &&
        (r.studentId === sid || (r.phone && r.phone.replace(/[^0-9]/g, "") === cleanPhone))
    );
    const maxDaily = policies.maxDailyBookingsPerUser || 2;
    if (myTodayBookings.length >= maxDaily) {
        alert(`하루 최대 예약 횟수(1인당 하루 최대 ${maxDaily}회)를 초과하였습니다.\n기존 예약을 취소하시거나 다른 날짜를 이용해주세요.`);
        return;
    }

    // 정책 검증 3: 동일 학생의 타 연습실 동시간대 중복 예약 방지 (건물/층/호실 무관)
    // 예: 신관 5층에서 11:00에 예약 중이면 다른 건물이나 신관의 다른 연습실에서 겹치는 시간대 예약 불가
    const timeConflictBooking = myTodayBookings.find(r => {
        const rStartMin = r.startMin !== undefined ? r.startMin : timeStrToMinutes(r.startTime);
        const rEndMin = r.endMin !== undefined ? r.endMin : timeStrToMinutes(r.endTime);
        // 시간이 겹치는 조건 (StartA < EndB && EndA > StartB)
        return (startMin < rEndMin && endMin > rStartMin);
    });

    if (timeConflictBooking) {
        const bldName = timeConflictBooking.building || "연습실";
        const roomName = timeConflictBooking.room ? `${timeConflictBooking.room}호` : "";
        const floorName = timeConflictBooking.floor ? `(${timeConflictBooking.floor})` : "";

        alert(`[중복 예약 불가]\n이미 동일한 시간대에 ${bldName} ${roomName} (${timeConflictBooking.startTime}~${timeConflictBooking.endTime}) 예약이 있습니다.\n기존 예약을 취소하신 후 다시 신청해주세요.`);
        return;
    }

    // 다시 한 번 엄격한 중복 체크
    const check = checkOverlap(dateKey, selectedBuilding, selectedRoom.number, startMin, endMin);
    if (check.overlap) {
        if (check.conflict && check.conflict.isBlocked) {
            alert(`해당 시간대는 시설 점검(${check.conflict.name})으로 인해 예약할 수 없습니다.`);
        } else {
            alert("죄송합니다. 방금 다른 학생이 해당 시간을 예약하였습니다. 다른 시간을 선택해주세요.");
        }
        closeReservationModal();
        renderSlotsGrid();
        syncDropdownsWithSelection();
        return;
    }

    // 고유 예약 번호 생성
    const resId = "CSU-" + Date.now().toString().slice(-6) + "-" + Math.floor(Math.random() * 900 + 100);

    const newReservation = {
        id: resId,
        building: selectedBuilding,
        floor: selectedFloor.name,
        room: selectedRoom.number,
        roomType: selectedRoom.type || "일반 연습실",
        date: dateKey,
        startTime: startStr,
        endTime: endStr,
        startMin: startMin,
        endMin: endMin,
        name: name,
        studentId: sid,
        phone: phone,
        status: "confirmed",
        createdAt: new Date().toISOString()
    };

    // 저장소에 저장
    const updatedAll = getAllReservations();
    updatedAll.push(newReservation);
    saveAllReservations(updatedAll);

    // 마지막 학번 기억
    localStorage.setItem(LAST_SEARCH_KEY, sid);

    // 모달 닫기
    closeReservationModal();

    // 폼 초기화
    nameInput.value = "";
    phoneInput.value = "";

    // 예약 완료 확인증 팝업 표시
    openSuccessModal(newReservation);

    // 현재 화면 슬롯 즉시 재렌더링
    renderSlotsGrid();
    syncDropdownsWithSelection();
    showToast("예약이 즉시 확정되었습니다!", "success");
}

function openSuccessModal(res) {
    const modal = document.getElementById("success-modal");
    const passCard = document.getElementById("success-pass-card");
    if (!modal || !passCard) return;

    const durMins = res.endMin - res.startMin;
    const h = Math.floor(durMins / 60);
    const m = durMins % 60;
    const durStr = `${h > 0 ? h + '시간 ' : ''}${m > 0 ? m + '분' : ''}`;

    passCard.innerHTML = `
        <div class="rsc-row">
            <span class="rsc-label">예약 번호</span>
            <strong class="rsc-val">${res.id}</strong>
        </div>
        <div class="rsc-row">
            <span class="rsc-label">예약 공간</span>
            <strong class="rsc-val">${res.building} ${res.room}호 (${res.roomType})</strong>
        </div>
        <div class="rsc-row">
            <span class="rsc-label">예약 일자</span>
            <strong class="rsc-val">${res.date} (${getShortDayName(new Date(res.date))})</strong>
        </div>
        <div class="rsc-row highlight">
            <span class="rsc-label">이용 시간</span>
            <strong class="rsc-val color-blue">${res.startTime} ~ ${res.endTime} (${durStr})</strong>
        </div>
        <div class="rsc-row">
            <span class="rsc-label">예약자 정보</span>
            <strong class="rsc-val">${res.name} (${res.studentId})</strong>
        </div>
    `;

    modal.style.display = "flex";
}

function closeSuccessModal() {
    const modal = document.getElementById("success-modal");
    if (modal) modal.style.display = "none";
}

function closeSuccessModalAndGo(screenId) {
    closeSuccessModal();
    navTo(screenId);
}

// =================================================================
// 10. 해당 방 상세 예약 현황 (Room Status Screen)
// =================================================================
function openRoomStatusScreen() {
    if (!selectedRoom || !selectedFloor) return;

    statusDate = new Date(selectedDate);
    document.getElementById("status-nav-sub").textContent = `${selectedBuilding} · ${selectedRoom.number}호 (${selectedRoom.type || '연습실'})`;

    updateStatusScreenDate();
    navTo("room-status-screen");
}

function updateStatusScreenDate() {
    document.getElementById("status-date-text").textContent = formatDateDisplay(statusDate);
    document.getElementById("status-day-text").textContent = getDayOfWeekName(statusDate);
    renderStatusScreenContent();
}

function changeStatusDate(deltaDays) {
    statusDate = new Date(statusDate.getTime() + deltaDays * 24 * 60 * 60 * 1000);
    updateStatusScreenDate();
}

function switchStatusView(mode) {
    statusViewMode = mode;
    const btnTimeline = document.getElementById("btn-view-timeline");
    const btnList = document.getElementById("btn-view-list");

    if (btnTimeline && btnList) {
        if (mode === "timeline") {
            btnTimeline.classList.add("active");
            btnList.classList.remove("active");
        } else {
            btnTimeline.classList.remove("active");
            btnList.classList.add("active");
        }
    }

    renderStatusScreenContent();
}

function renderStatusScreenContent() {
    const timelineContainer = document.getElementById("status-timeline-container");
    const listContainer = document.getElementById("status-list-container");
    if (!timelineContainer || !listContainer) return;

    const dateKey = formatDateKey(statusDate);
    const activeRes = getActiveReservations(dateKey, selectedBuilding, selectedRoom.number);

    if (statusViewMode === "timeline") {
        timelineContainer.style.display = "block";
        listContainer.style.display = "none";
        renderStatusTimeline(timelineContainer, activeRes);
    } else {
        timelineContainer.style.display = "none";
        listContainer.style.display = "flex";
        renderStatusList(listContainer, activeRes);
    }
}

function renderStatusTimeline(container, resList) {
    container.innerHTML = "";

    const axis = document.createElement("div");
    axis.className = "timeline-axis";

    const totalMinutes = (OPERATING_END_HOUR - OPERATING_START_HOUR) * 60; // 780분
    const totalHeight = 520; // px

    // 시간 축 눈금 표시
    for (let h = OPERATING_START_HOUR; h <= OPERATING_END_HOUR; h++) {
        const topPx = ((h - OPERATING_START_HOUR) * 60 / totalMinutes) * totalHeight;

        const label = document.createElement("div");
        label.className = "axis-hour-label";
        label.style.top = `${topPx}px`;
        label.textContent = `${String(h).padStart(2, '0')}:00`;
        axis.appendChild(label);

        const line = document.createElement("div");
        line.className = "axis-grid-line";
        line.style.top = `${topPx}px`;
        axis.appendChild(line);
    }

    // 예약 막대 렌더링
    if (resList.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.className = "empty-state";
        emptyMsg.style.margin = "40px 0 0 20px";
        emptyMsg.innerHTML = `
            <div class="empty-icon">📅</div>
            <h4>예약된 내역이 없습니다</h4>
            <p>이 날짜는 연습실 전체 시간대 이용이 가능합니다.</p>
        `;
        container.appendChild(axis);
        container.appendChild(emptyMsg);
        return;
    }

    resList.forEach(res => {
        const block = document.createElement("div");
        block.className = "timeline-block";

        const startM = timeStrToMinutes(res.startTime);
        const endM = timeStrToMinutes(res.endTime);

        const topPx = ((startM - OPERATING_START_HOUR * 60) / totalMinutes) * totalHeight;
        const heightPx = Math.max(((endM - startM) / totalMinutes) * totalHeight, 26);

        block.style.top = `${topPx}px`;
        block.style.height = `${heightPx}px`;

        block.innerHTML = `
            <div class="tb-name">${maskName(res.name)} (${res.studentId ? res.studentId.slice(0, 4) + '****' : '재학생'})</div>
            <div class="tb-time">${res.startTime} ~ ${res.endTime}</div>
        `;
        axis.appendChild(block);
    });

    container.appendChild(axis);
}

function renderStatusList(container, resList) {
    container.innerHTML = "";

    if (resList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h4>예약된 내역이 없습니다</h4>
                <p>선택하신 날짜에는 예약된 일정이 없습니다.</p>
            </div>
        `;
        return;
    }

    resList.sort((a, b) => a.startMin - b.startMin);

    resList.forEach(res => {
        const item = document.createElement("div");
        item.className = "res-item-card";
        item.innerHTML = `
            <div class="ric-left">
                <div class="ric-name-row">
                    <span class="ric-name">${maskName(res.name)}</span>
                    <span class="ric-sid">${res.studentId ? res.studentId.slice(0, 4) + '****' : ''}</span>
                </div>
                <span class="ric-time">⏱️ ${res.startTime} ~ ${res.endTime}</span>
            </div>
            <span class="ric-status-pill">예약 확정</span>
        `;
        container.appendChild(item);
    });
}

function maskName(name) {
    if (!name) return "학생";
    if (name.length <= 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

// =================================================================
// 11. 전체 연습실 종합 현황판 (Overview Screen Dashboard)
// =================================================================
function setOverviewBuilding(buildingName) {
    overviewBuilding = buildingName;
    const segShin = document.getElementById("seg-shingwan");
    const segJong = document.getElementById("seg-jonghap");

    if (segShin && segJong) {
        if (buildingName === "신관") {
            segShin.classList.add("active");
            segJong.classList.remove("active");
        } else {
            segShin.classList.remove("active");
            segJong.classList.add("active");
        }
    }

    renderOverviewDashboard();
}

function changeOverviewDate(deltaDays) {
    overviewDate = new Date(overviewDate.getTime() + deltaDays * 24 * 60 * 60 * 1000);
    renderOverviewDashboard();
}

function renderOverviewDashboard() {
    const dateText = document.getElementById("overview-date-text");
    const dayText = document.getElementById("overview-day-text");
    const statsRow = document.getElementById("overview-stats-row");
    const roomsList = document.getElementById("overview-rooms-list");

    if (!dateText || !roomsList) return;

    dateText.textContent = formatDateDisplay(overviewDate);
    dayText.textContent = getDayOfWeekName(overviewDate);

    const b = BUILDINGS[overviewBuilding];
    if (!b) return;

    const dateKey = formatDateKey(overviewDate);
    const activeRes = getActiveReservations(dateKey, overviewBuilding);

    // 실시간 통계 계산
    const totalRooms = getTotalRoomsInBuilding(b);
    const now = new Date();
    const isToday = formatDateKey(now) === dateKey;
    const nowMins = now.getHours() * 60 + now.getMinutes();

    let busyRoomsNow = 0;
    if (isToday) {
        b.floors.forEach(f => {
            f.rooms.forEach(r => {
                const isBusy = activeRes.some(res => {
                    return res.room === r.number && nowMins >= res.startMin && nowMins < res.endMin;
                });
                if (isBusy) busyRoomsNow++;
            });
        });
    }

    const availableNow = totalRooms - busyRoomsNow;
    const totalResCount = activeRes.length;

    if (statsRow) {
        statsRow.innerHTML = `
            <div class="stat-pill">전체 <strong>${totalRooms}</strong>실</div>
            <div class="stat-pill avail">지금 예약가능 <strong>${isToday ? availableNow : totalRooms}</strong>실</div>
            <div class="stat-pill reserved">오늘 예약 <strong>${totalResCount}</strong>건</div>
        `;
    }

    // 층별 룸 타임라인 렌더링
    roomsList.innerHTML = "";

    const totalDayMins = (OPERATING_END_HOUR - OPERATING_START_HOUR) * 60;

    b.floors.forEach(floor => {
        const floorSec = document.createElement("div");
        floorSec.className = "overview-floor-section";

        const title = document.createElement("div");
        title.className = "overview-floor-title";
        title.textContent = `${floor.name} (${floor.title}) · ${floor.rooms.length}실`;
        floorSec.appendChild(title);

        const roomSettings = getRoomSettings();
        // 사용불가한 연습실이 젤 밑(맨 아래)에 보이도록 정렬
        const sortedRooms = [...floor.rooms].sort((a, b) => {
            const aKey = `${overviewBuilding}_${a.number}`;
            const bKey = `${overviewBuilding}_${b.number}`;
            const aAvail = (!roomSettings[aKey] || roomSettings[aKey].isAvailable !== false) ? 1 : 0;
            const bAvail = (!roomSettings[bKey] || roomSettings[bKey].isAvailable !== false) ? 1 : 0;
            return bAvail - aAvail;
        });

        sortedRooms.forEach(room => {
            const rKey = `${overviewBuilding}_${room.number}`;
            const isRoomAvailable = !roomSettings[rKey] || roomSettings[rKey].isAvailable !== false;

            const card = document.createElement("div");
            card.className = `overview-row-card ${isRoomAvailable ? '' : 'disabled-room'}`;
            if (!isRoomAvailable) {
                card.style.opacity = "0.55";
            }
            card.onclick = () => {
                if (!isRoomAvailable) {
                    showToast("현재 해당 연습실은 시설 점검 등으로 이용이 중지되었습니다.", "error");
                    return;
                }
                selectedBuilding = overviewBuilding;
                selectRoom(floor, room);
            };

            const roomRes = activeRes.filter(r => r.room === room.number);
            const isCurrentlyOccupied = isToday && roomRes.some(r => nowMins >= r.startMin && nowMins < r.endMin);

            // 미니 타임라인 막대 생성
            let barSegmentsHtml = "";
            roomRes.forEach(r => {
                const leftPercent = ((r.startMin - OPERATING_START_HOUR * 60) / totalDayMins) * 100;
                const widthPercent = ((r.endMin - r.startMin) / totalDayMins) * 100;
                barSegmentsHtml += `<div class="orc-booked-segment" style="left:${leftPercent}%; width:${widthPercent}%;" title="${r.startTime}~${r.endTime}"></div>`;
            });

            card.innerHTML = `
                <div class="orc-info">
                    <span class="orc-room-num">${room.number}호</span>
                    <span class="orc-room-type">${escapeHtml(room.type || '연습실')}</span>
                </div>
                <div class="orc-timeline-bar">
                    ${barSegmentsHtml}
                </div>
                <span class="orc-badge ${isCurrentlyOccupied ? 'busy' : ''}">
                    ${isCurrentlyOccupied ? '사용중' : (roomRes.length > 0 ? `${roomRes.length}건 예약` : '예약가능')}
                </span>
            `;

            floorSec.appendChild(card);
        });

        roomsList.appendChild(floorSec);
    });
}

// =================================================================
// 12. 내 예약 확인 및 예약 취소 (My Reservations & Cancellation)
// =================================================================
function initMyScreen() {
    const input = document.getElementById("search-student-id");
    const saved = localStorage.getItem(LAST_SEARCH_KEY);
    if (saved && input && !input.value) {
        input.value = saved;
        searchMyReservations();
    }
}

function searchMyReservations() {
    const input = document.getElementById("search-student-id");
    const container = document.getElementById("my-res-container");
    if (!input || !container) return;

    const query = input.value.trim();
    if (!query) {
        showToast("학번 또는 전화번호를 입력해주세요.", "error");
        input.focus();
        return;
    }

    // 학번 저장
    localStorage.setItem(LAST_SEARCH_KEY, query);
    updateHeaderBadge();

    const cleanQuery = query.replace(/[^0-9]/g, "");
    const all = getAllReservations();

    const matched = all.filter(r => {
        const sid = (r.studentId || "").trim();
        const phClean = (r.phone || "").replace(/[^0-9]/g, "");
        return sid === query || phClean === cleanQuery || phClean.includes(cleanQuery);
    });

    if (matched.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h4>예약 내역이 없습니다</h4>
                <p>'${escapeHtml(query)}'로 등록된 연습실 예약이 존재하지 않습니다.<br>학번이나 예약 시 입력한 전화번호를 다시 확인해주세요.</p>
            </div>
        `;
        return;
    }

    // 최신 날짜순 정렬
    matched.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.startMin - a.startMin;
    });

    container.innerHTML = "";

    matched.forEach(res => {
        const isCancelled = res.status === "cancelled";
        const card = document.createElement("div");
        card.className = `my-res-card ${isCancelled ? 'cancelled' : ''}`;

        const durMins = res.endMin - res.startMin;
        const h = Math.floor(durMins / 60);
        const m = durMins % 60;
        const durStr = `${h > 0 ? h + '시간 ' : ''}${m > 0 ? m + '분' : ''}`;

        const isAdminCancel = isCancelled && (res.cancelledBy === "admin" || (res.cancelReason && res.cancelReason.includes("관리자")));
        let badgeText = "예약 확정";
        let badgeClass = "";
        if (isCancelled) {
            badgeClass = "cancelled";
            badgeText = isAdminCancel ? "관리자에 의한 취소" : "본인 취소 완료";
        }

        card.innerHTML = `
            <div class="mrc-header">
                <span class="mrc-room-title">${res.building} ${res.room}호 (${escapeHtml(res.roomType)})</span>
                <span class="mrc-badge ${badgeClass}" style="${isAdminCancel ? 'background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; font-weight:700;' : ''}">
                    ${badgeText}
                </span>
            </div>
            <div class="mrc-details">
                <div class="mrc-row">
                    <span>예약 번호</span>
                    <strong>${res.id}</strong>
                </div>
                <div class="mrc-row">
                    <span>예약 일시</span>
                    <strong>${res.date} (${getShortDayName(new Date(res.date))}) · ${res.startTime} ~ ${res.endTime} (${durStr})</strong>
                </div>
                <div class="mrc-row">
                    <span>예약자 정보</span>
                    <strong>${escapeHtml(res.name)} (${res.studentId})</strong>
                </div>
                <div class="mrc-row">
                    <span>신청 일시</span>
                    <span style="font-size:11px; color:var(--gray-400);">${new Date(res.createdAt).toLocaleString()}</span>
                </div>
                ${isCancelled ? `
                <div class="mrc-row" style="color:var(--danger); background:var(--danger-bg); padding:8px 12px; border-radius:8px; margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:var(--danger); font-weight:700;">취소 사유</span>
                    <strong style="color:var(--danger); font-size:12.5px;">${escapeHtml(res.cancelReason || (isAdminCancel ? '관리자에 의한 직권 취소' : '학생 본인 취소'))}</strong>
                </div>
                ` : ''}
            </div>
            ${!isCancelled ? `
                <div class="mrc-actions">
                    <button class="btn-card-cancel" onclick="confirmCancelReservation('${res.id}')">예약 취소하기</button>
                </div>
            ` : ''}
        `;

        container.appendChild(card);
    });
}

function confirmCancelReservation(resId) {
    const all = getAllReservations();
    const target = all.find(r => r.id === resId);
    if (!target) return;

    // 관리자 예약 취소 마감 시각 정책 검증 (cancelDeadlineMinutes)
    const policies = getBookingPolicies();
    const deadlineMins = policies.cancelDeadlineMinutes !== undefined ? policies.cancelDeadlineMinutes : 30;

    if (deadlineMins > 0) {
        const todayStr = formatDateKey(new Date());
        if (target.date === todayStr) {
            const now = new Date();
            const nowMins = now.getHours() * 60 + now.getMinutes();
            if (target.startMin - nowMins < deadlineMins) {
                const msg = `[예약 취소 불가] 시작 ${deadlineMins}분 전까지만 온라인 취소가 가능합니다. (현재 취소 마감 경과)`;
                showToast(msg, "error");
                alert(`${msg}\n관리자(교회음악과 사무실)에게 문의해주시기 바랍니다.`);
                return;
            }
        } else if (target.date < todayStr) {
            const msg = "이미 이용 일자가 지난 과거 예약은 취소할 수 없습니다.";
            showToast(msg, "error");
            alert(msg);
            return;
        }
    }

    cancelTargetReservation = target;

    const modal = document.getElementById("cancel-modal");
    const infoBox = document.getElementById("cancel-target-info");
    if (!modal || !infoBox) return;

    infoBox.innerHTML = `
        <div class="rsc-row">
            <span class="rsc-label">예약 번호</span>
            <strong>${target.id}</strong>
        </div>
        <div class="rsc-row">
            <span class="rsc-label">공간</span>
            <strong>${target.building} ${target.room}호</strong>
        </div>
        <div class="rsc-row">
            <span class="rsc-label">일시</span>
            <strong class="color-blue">${target.date} · ${target.startTime} ~ ${target.endTime}</strong>
        </div>
        <div class="rsc-row">
            <span class="rsc-label">예약자</span>
            <strong>${target.name} (${target.studentId})</strong>
        </div>
    `;

    modal.style.display = "flex";
}

function closeCancelModal() {
    const modal = document.getElementById("cancel-modal");
    if (modal) modal.style.display = "none";
    cancelTargetReservation = null;
}

function executeCancellation() {
    if (!cancelTargetReservation) return;

    const all = getAllReservations();
    const idx = all.findIndex(r => r.id === cancelTargetReservation.id);

    if (idx !== -1) {
        all[idx].status = "cancelled";
        all[idx].cancelledAt = new Date().toISOString();
        all[idx].cancelledBy = "user";
        all[idx].cancelReason = "학생 본인 직접 취소";
        saveAllReservations(all);

        showToast("예약이 정상적으로 취소되었습니다. 해당 시간이 다시 개방되었습니다.", "success");
    }

    closeCancelModal();
    searchMyReservations();

    // 현재 화면이 시간 화면이면 슬롯 갱신
    if (currentScreen === "time-screen") {
        renderSlotsGrid();
        syncDropdownsWithSelection();
    } else if (currentScreen === "overview-screen") {
        renderOverviewDashboard();
    }
}

// =================================================================
// 13. 데이터 백업, 샘플 데이터 생성 및 초기화 (관리 및 테스트)
// =================================================================
function generateSampleData() {
    const sampleList = [
        {
            id: "CSU-1001-01",
            building: "신관",
            floor: "B1",
            room: "B12",
            roomType: "교음(오르간)",
            date: formatDateKey(new Date()),
            startTime: "10:00",
            endTime: "11:30",
            startMin: 600,
            endMin: 690,
            name: "이찬양",
            studentId: "20241011",
            phone: "010-3333-5555",
            status: "confirmed",
            createdAt: new Date().toISOString()
        },
        {
            id: "CSU-1001-02",
            building: "신관",
            floor: "B1",
            room: "B12",
            roomType: "교음(오르간)",
            date: formatDateKey(new Date()),
            startTime: "14:00",
            endTime: "16:00",
            startMin: 840,
            endMin: 960,
            name: "박피아노",
            studentId: "20231045",
            phone: "010-7777-8888",
            status: "confirmed",
            createdAt: new Date().toISOString()
        },
        {
            id: "CSU-1001-03",
            building: "신관",
            floor: "6F",
            room: "612",
            roomType: "성악학회실",
            date: formatDateKey(new Date()),
            startTime: "13:00",
            endTime: "15:00",
            startMin: 780,
            endMin: 900,
            name: "김성악",
            studentId: "20241078",
            phone: "010-1234-5678",
            status: "confirmed",
            createdAt: new Date().toISOString()
        },
        {
            id: "CSU-1001-04",
            building: "종합관",
            floor: "2F",
            room: "3",
            roomType: "그랜드",
            date: formatDateKey(new Date()),
            startTime: "09:30",
            endTime: "11:30",
            startMin: 570,
            endMin: 690,
            name: "정건반",
            studentId: "20221099",
            phone: "010-9999-1111",
            status: "confirmed",
            createdAt: new Date().toISOString()
        }
    ];

    saveAllReservations(sampleList);
    showToast("테스트용 샘플 예약 데이터 4건이 생성되었습니다.", "success");

    // 화면 갱신
    if (currentScreen === "time-screen") {
        renderSlotsGrid();
        syncDropdownsWithSelection();
    } else if (currentScreen === "overview-screen") {
        renderOverviewDashboard();
    } else if (currentScreen === "my-screen") {
        searchMyReservations();
    }
}

function resetAllReservations() {
    if (!confirm("모든 예약 데이터를 영구 초기화하시겠습니까? (취소 불가)")) return;
    localStorage.removeItem(STORAGE_KEY);
    saveAllReservations([]);
    showToast("모든 예약 데이터가 초기화되었습니다.", "success");

    if (currentScreen === "time-screen") {
        renderSlotsGrid();
        syncDropdownsWithSelection();
    } else if (currentScreen === "overview-screen") {
        renderOverviewDashboard();
    } else if (currentScreen === "my-screen") {
        searchMyReservations();
    }
}

function exportReservationsJSON() {
    const all = getAllReservations();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(all, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `chongshin_music_reservations_${formatDateKey(new Date())}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast("예약 데이터 백업 파일이 다운로드되었습니다.", "success");
}

// =================================================================
// 14. UI 편의 유틸리티 (토스트, 전화번호 포맷팅, 이스케이프)
// =================================================================
let toastTimer = null;
function showToast(msg, type = "normal") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = msg;
    toast.className = `app-toast show ${type}`;

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.className = "app-toast";
    }, 2800);
}

function formatPhoneNumber(input) {
    let val = input.value.replace(/[^0-9]/g, "");
    if (val.length > 3 && val.length <= 7) {
        val = val.slice(0, 3) + "-" + val.slice(3);
    } else if (val.length > 7) {
        val = val.slice(0, 3) + "-" + val.slice(3, 7) + "-" + val.slice(7, 11);
    }
    input.value = val;
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

// =================================================================
// 15. 연습실 소통 게시판 모듈 (공지게시판 & 실명 문의게시판)
// =================================================================
let currentBoardCategory = "notice"; // 'notice' or 'inquiry'
let secretTargetPost = null;

function getAllBoardPosts() {
    try {
        const raw = localStorage.getItem(BOARD_STORAGE_KEY);
        if (raw !== null) {
            return JSON.parse(raw);
        }
        return initDefaultBoardPosts();
    } catch (e) {
        console.error("게시판 데이터 로드 오류:", e);
        return [];
    }
}

function saveAllBoardPosts(posts) {
    try {
        localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(posts));
        updateBoardBadges();
        if (typeof pushBoardPostsToCloud === "function") {
            pushBoardPostsToCloud(posts);
        }
    } catch (e) {
        console.error("게시판 데이터 저장 오류:", e);
    }
}

function initDefaultBoardPosts() {
    // 로컬스토리지에 이미 키가 존재하면 (글이 수정/삭제되어 빈 배열인 경우 포함) 절대 덮어쓰지 않음!
    const existingRaw = localStorage.getItem(BOARD_STORAGE_KEY);
    if (existingRaw !== null) {
        try {
            return JSON.parse(existingRaw);
        } catch (e) {}
    }

    const samplePosts = [
        {
            id: "NOTICE-1",
            category: "notice",
            title: "[공지] 2026학년도 연습실 이용 수칙 및 당일 예약제(새벽 5시 오픈) 시행 안내",
            content: "샬롬! 총신대학교 교회음악과 연습실 운영위원회입니다.\n\n연습실 이용 질서 확립과 공평한 배분을 위해 다음과 같이 운영됩니다.\n\n1. 연습실 예약은 '당일 예약제'로 운영되며, 매일 새벽 05:00에 정식 오픈됩니다.\n2. 1인당 1회 최대 2시간, 하루 최대 2회까지 예약 가능합니다.\n3. 입실 후 보면대 및 피아노 상태를 확인하고, 퇴실 시 냉난방기와 조명을 반드시 소등해주세요.\n\n문의사항이나 건의사항은 '문의게시판'을 통해 실명으로 남겨주시면 관리자가 성심껏 답변드리겠습니다.",
            authorName: "교회음악과 관리실",
            authorId: "admin",
            visibility: "public",
            isImportant: true,
            createdAt: "2026-11-01T09:00:00.000Z",
            answer: null
        },
        {
            id: "NOTICE-2",
            category: "notice",
            title: "[시설] 신관 B12호 파이프 오르간 정기 점검 및 관리 안내",
            content: "신관 지하 1층 B12호 오르간 연습실의 정기 조율 및 청소가 매주 월요일 오전에 진행됩니다.\n학생 여러분의 많은 양해와 협조 부탁드립니다.",
            authorName: "교회음악과 관리실",
            authorId: "admin",
            visibility: "public",
            isImportant: false,
            createdAt: "2026-11-03T14:20:00.000Z",
            answer: null
        },
        {
            id: "INQUIRY-1",
            category: "inquiry",
            title: "신관 203호 그랜드피아노 최고음부 건반 조율 요청드립니다.",
            content: "안녕하세요, 피아노과 2학년 홍길동입니다.\n신관 203호 야마하 그랜드피아노의 최고음부 건반 하나가 약간 걸리는 현상이 있습니다.\n확인 및 조율 부탁드립니다. 항상 감사합니다!",
            authorName: "홍길동",
            authorId: "20241001",
            visibility: "public", // 전체 공개
            isImportant: false,
            createdAt: "2026-11-04T11:30:00.000Z",
            answer: {
                content: "홍길동 학생 안녕하세요, 조율사님께 전달하여 금일 오후 3시 점검 및 조율 완료하였습니다. 제보 감사드립니다!",
                author: "교회음악과 관리실",
                createdAt: "2026-11-04T16:00:00.000Z"
            }
        },
        {
            id: "INQUIRY-2",
            category: "inquiry",
            title: "B12호에 두고 온 악보(바흐 오르간 전집) 보관 여부 문의",
            content: "어제 저녁 8시경 B12호에서 연습 후 보면대에 검은색 바흐 오르간 악보집을 두고 온 것 같습니다.\n혹시 관리실에서 보관 중이신지 확인 부탁드립니다.",
            authorName: "김은혜",
            authorId: "20231502",
            visibility: "staff", // 관계자에게 공개 (비공개)
            isImportant: false,
            createdAt: "2026-11-05T09:10:00.000Z",
            answer: {
                content: "김은혜 학생 안녕하세요, 해당 악보집 현재 제2종합관 2층 학과 사무실에서 안전하게 보관 중입니다. 근무시간 내에 학생증 지참 후 방문하여 수령하시기 바랍니다.",
                author: "교회음악과 관리실",
                createdAt: "2026-11-05T10:30:00.000Z"
            }
        }
    ];
    localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(samplePosts));
    return samplePosts;
}

// 브라우저 탭 간 실시간 변경 감지 (어드민에서 수정/삭제 시 학생 화면 즉시 실시간 반영!)
window.addEventListener("storage", (e) => {
    if (e.key === BOARD_STORAGE_KEY) {
        updateBoardBadges();
        if (currentScreen === "board-screen") {
            renderBoardList();
        }
    }
});

function renderBoardScreen() {
    updateBoardBadges();
    switchBoardCategory(currentBoardCategory);
}

function refreshBoardPosts() {
    updateBoardBadges();
    renderBoardList();
    showToast("게시판 목록이 최신으로 갱신되었습니다.", "normal");
}

function updateBoardBadges() {
    const posts = getAllBoardPosts();
    const noticeCount = posts.filter(p => p.category === "notice").length;
    const inquiryCount = posts.filter(p => p.category === "inquiry").length;

    const bNotice = document.getElementById("bcat-notice-count");
    const bInquiry = document.getElementById("bcat-inquiry-count");
    if (bNotice) bNotice.textContent = noticeCount;
    if (bInquiry) bInquiry.textContent = inquiryCount;
}

function switchBoardCategory(category) {
    currentBoardCategory = category;

    const btnNotice = document.getElementById("bcat-notice");
    const btnInquiry = document.getElementById("bcat-inquiry");
    const subInfo = document.getElementById("bsb-info-text");
    const btnWrite = document.getElementById("btn-write-inquiry");

    if (category === "notice") {
        if (btnNotice) btnNotice.classList.add("active");
        if (btnInquiry) btnInquiry.classList.remove("active");
        if (subInfo) {
            subInfo.innerHTML = `
                <span class="bsb-icon">📢</span>
                <span>학과 관리실 공식 공지사항</span>
            `;
        }
        if (btnWrite) btnWrite.style.display = "none";
    } else {
        if (btnNotice) btnNotice.classList.remove("active");
        if (btnInquiry) btnInquiry.classList.add("active");
        if (subInfo) {
            subInfo.innerHTML = `
                <span class="bsb-icon">🔒</span>
                <span>실명제로 운영되는 문의게시판입니다.</span>
            `;
        }
        if (btnWrite) btnWrite.style.display = "inline-flex";
    }

    renderBoardList();
}

function renderBoardList() {
    const container = document.getElementById("board-list-container");
    if (!container) return;

    container.innerHTML = "";
    const allPosts = getAllBoardPosts();
    const mySavedSid = localStorage.getItem(LAST_SEARCH_KEY) || "";

    const filtered = allPosts.filter(p => p.category === currentBoardCategory);

    // 정렬: 중요 공지 상단 -> 그 다음 최신순
    filtered.sort((a, b) => {
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:40px 20px; text-align:center;">
                <div class="empty-icon" style="font-size:36px; margin-bottom:8px;">${currentBoardCategory === 'notice' ? '📢' : '💬'}</div>
                <h4 style="font-size:15px; color:var(--gray-800); margin-bottom:4px;">등록된 ${currentBoardCategory === 'notice' ? '공지사항이' : '문의글이'} 없습니다</h4>
                <p style="font-size:13px; color:var(--gray-500);">${currentBoardCategory === 'notice' ? '새로운 공지사항이 등록되면 이곳에 표시됩니다.' : '궁금한 점이 있다면 [실명 문의글 작성] 버튼을 눌러 남겨주세요.'}</p>
            </div>
        `;
        return;
    }

    filtered.forEach(post => {
        const card = document.createElement("div");
        card.className = `board-post-card ${post.isImportant ? 'important' : ''}`;

        const isSecret = post.visibility === "staff";
        const isAnswered = !!post.answer;

        let badgesHtml = "";
        if (post.category === "notice") {
            badgesHtml += `<span class="bpc-badge badge-notice">공지</span>`;
            if (post.isImportant) badgesHtml += `<span class="bpc-badge badge-important">★ 중요</span>`;
        } else {
            // 문의글 배지
            if (isSecret) {
                badgesHtml += `<span class="bpc-badge badge-secret">🔒 관계자 공개</span>`;
            } else {
                badgesHtml += `<span class="bpc-badge badge-public">🌐 전체 공개</span>`;
            }

            if (isAnswered) {
                badgesHtml += `<span class="bpc-badge badge-answered">✓ 답변 완료</span>`;
            } else {
                badgesHtml += `<span class="bpc-badge badge-waiting">답변 대기</span>`;
            }
        }

        const dateStr = post.createdAt ? post.createdAt.slice(0, 10).replace(/-/g, '.') : '';
        const titleHtml = isSecret
            ? `🔒 ${escapeHtml(post.title)}`
            : escapeHtml(post.title);

        let snippetText = "";
        if (isSecret) {
            snippetText = "🔒 관계자(관리자) 및 작성자 본인만 열람 가능한 비공개 문의입니다.";
        } else {
            snippetText = escapeHtml(post.content);
        }

        card.innerHTML = `
            <div class="bpc-top-row">
                <div class="bpc-badges">${badgesHtml}</div>
                <span class="bpc-date">${dateStr}</span>
            </div>
            <h4 class="bpc-title">${titleHtml}</h4>
            <p class="bpc-snippet">${snippetText}</p>
            <div class="bpc-bottom-row">
                <span class="bpc-author">작성자: ${escapeHtml(post.authorName)}${post.authorId && post.authorId !== 'admin' ? ` (${maskStudentId(post.authorId)})` : ''}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    ${post.category === "inquiry" ? `<button type="button" class="btn-card-delete" onclick="event.stopPropagation(); deleteStudentInquiry('${post.id}')">🗑️ 삭제</button>` : ''}
                    <span style="font-size:12px; color:var(--primary); font-weight:600;">상세보기 ›</span>
                </div>
            </div>
        `;

        card.onclick = () => handlePostClick(post);
        container.appendChild(card);
    });
}

function maskStudentId(sid) {
    if (!sid) return "";
    if (sid.length <= 4) return sid;
    return sid.slice(0, 4) + "****";
}

function handlePostClick(post) {
    // 1. 공지사항이거나 전체 공개 문의글인 경우 -> 누구나 즉시 열람
    if (post.category === "notice" || post.visibility === "public") {
        openBoardDetailModal(post);
        return;
    }

    // 2. 관계자 공개글(비공개 문의)인 경우
    const mySavedSid = localStorage.getItem(LAST_SEARCH_KEY) || "";

    // 만약 현재 기기에 저장된 학번이 작성자 학번과 일치하면 바로 열람!
    if (mySavedSid && mySavedSid === post.authorId) {
        openBoardDetailModal(post);
        return;
    }

    // 본인 확인 팝업 열기
    secretTargetPost = post;
    const authModal = document.getElementById("board-auth-modal");
    const sidInput = document.getElementById("input-auth-sid");
    if (authModal) {
        if (sidInput) sidInput.value = "";
        authModal.style.display = "flex";
        if (sidInput) sidInput.focus();
    }
}

function verifyAndOpenSecretPost() {
    if (!secretTargetPost) return;

    const sidInput = document.getElementById("input-auth-sid");
    const inputSid = sidInput ? sidInput.value.trim() : "";

    if (!inputSid) {
        showToast("학번을 입력해주세요.", "error");
        return;
    }

    if (inputSid === secretTargetPost.authorId) {
        closeBoardAuthModal();
        showToast("작성자 본인 확인이 완료되었습니다.", "success");
        openBoardDetailModal(secretTargetPost);
    } else {
        showToast("학번이 일치하지 않습니다. (작성자 본인 또는 관계자만 열람 가능)", "error");
    }
}

function closeBoardAuthModal() {
    const authModal = document.getElementById("board-auth-modal");
    if (authModal) authModal.style.display = "none";
    secretTargetPost = null;
}

function openBoardDetailModal(post) {
    const modal = document.getElementById("board-detail-modal");
    if (!modal) return;

    document.getElementById("post-detail-category").textContent = post.category === "notice"
        ? (post.isImportant ? "📢 중요 공지사항" : "📢 일반 공지사항")
        : (post.visibility === "staff" ? "🔒 1:1 비공개 문의" : "💬 전체 공개 문의");

    document.getElementById("post-detail-title").textContent = post.title;

    const metaBox = document.getElementById("post-detail-meta");
    const dateStr = post.createdAt ? post.createdAt.slice(0, 10).replace(/-/g, '.') : '';
    metaBox.innerHTML = `
        <span><strong>작성자:</strong> ${escapeHtml(post.authorName)} ${post.authorId && post.authorId !== 'admin' ? `(${escapeHtml(post.authorId)})` : ''}</span>
        <span><strong>등록일:</strong> ${dateStr}</span>
    `;

    document.getElementById("post-detail-body").textContent = post.content;

    // 답변 표시
    const answerBox = document.getElementById("post-answer-box");
    if (post.category === "inquiry") {
        if (post.answer) {
            answerBox.style.display = "block";
            const aDate = post.answer.createdAt ? post.answer.createdAt.slice(0, 10).replace(/-/g, '.') : '';
            document.getElementById("post-answer-date").textContent = `${escapeHtml(post.answer.author || '관리실')} · ${aDate}`;
            document.getElementById("post-answer-content").textContent = post.answer.content;
        } else {
            answerBox.style.display = "block";
            document.getElementById("post-answer-date").textContent = "접수 완료";
            document.getElementById("post-answer-content").textContent = "관리자가 내용을 확인 중입니다. 빠른 시일 내에 답변드리겠습니다.";
        }
    } else {
        answerBox.style.display = "none";
    }

    // 모달 푸터 버튼 동적 렌더링 (문의글인 경우 글 삭제 버튼 노출)
    const footer = document.getElementById("board-detail-footer");
    if (footer) {
        if (post.category === "inquiry") {
            footer.innerHTML = `
                <button type="button" class="btn-post-delete" onclick="deleteStudentInquiry('${post.id}')">
                    <span>🗑️ 글 삭제</span>
                </button>
                <button type="button" class="btn-secondary" style="min-width: 90px; height: 44px;" onclick="closeBoardDetailModal()">닫기</button>
            `;
        } else {
            footer.innerHTML = `
                <button type="button" class="btn-secondary full" style="height: 44px;" onclick="closeBoardDetailModal()">닫기</button>
            `;
        }
    }

    modal.style.display = "flex";
}

function closeBoardDetailModal() {
    const modal = document.getElementById("board-detail-modal");
    if (modal) modal.style.display = "none";
}

// 학생 문의글 삭제 처리 (본인 학번 검증 후 클라우드 동기화)
function deleteStudentInquiry(postId) {
    const allPosts = getAllBoardPosts();
    const target = allPosts.find(p => p.id === postId);
    if (!target) {
        showToast("삭제할 문의글을 찾을 수 없습니다.", "error");
        return;
    }

    // 1. 작성자 본인 학번 확인
    const savedSid = localStorage.getItem(LAST_SEARCH_KEY) || "";
    if (savedSid && savedSid === target.authorId) {
        // 현재 기기에 저장된 학번과 일치
    } else {
        const inputSid = prompt("작성자 본인 확인을 위해 작성 시 입력한 학번을 입력해주세요:");
        if (!inputSid) return;
        if (inputSid.trim() !== target.authorId) {
            alert("학번이 일치하지 않습니다. 본인이 작성한 글만 삭제할 수 있습니다.");
            return;
        }
    }

    // 2. 관리자 답변 여부에 따른 안내
    let confirmMsg = `[${target.title}]\n문의글을 정말 삭제하시겠습니까?`;
    if (target.answer) {
        confirmMsg = `이미 관리자 답변이 완료된 문의글입니다.\n정말 삭제하시겠습니까? (삭제 시 복구 불가)`;
    }

    if (!confirm(confirmMsg)) return;

    // 3. 배열에서 제거 후 저장 (로컬 + Firebase 클라우드 자동 동기화)
    const remaining = allPosts.filter(p => p.id !== postId);
    saveAllBoardPosts(remaining);

    // 4. 모달 닫기 및 화면 갱신
    closeBoardDetailModal();
    renderBoardList();
    showToast("문의글이 삭제되었습니다.", "success");
}

// 실명 문의글 작성
function openInquiryModal() {
    const modal = document.getElementById("inquiry-modal");
    if (!modal) return;

    // 기존 저장된 학번이 있다면 자동 입력
    const savedSid = localStorage.getItem(LAST_SEARCH_KEY) || "";
    const sidInput = document.getElementById("input-inquiry-sid");
    if (sidInput && !sidInput.value && savedSid) {
        sidInput.value = savedSid;
    }

    modal.style.display = "flex";
}

function closeInquiryModal() {
    const modal = document.getElementById("inquiry-modal");
    if (modal) modal.style.display = "none";
}

function onVisibilityChange() {
    const radios = document.getElementsByName("inquiry-visibility");
    let val = "staff";
    radios.forEach(r => {
        if (r.checked) val = r.value;
    });

    const lStaff = document.getElementById("vis-label-staff");
    const lPublic = document.getElementById("vis-label-public");

    if (val === "staff") {
        lStaff && lStaff.classList.add("selected");
        lPublic && lPublic.classList.remove("selected");
    } else {
        lPublic && lPublic.classList.add("selected");
        lStaff && lStaff.classList.remove("selected");
    }
}

function submitInquiryPost() {
    const nameInput = document.getElementById("input-inquiry-name");
    const sidInput = document.getElementById("input-inquiry-sid");
    const titleInput = document.getElementById("input-inquiry-title");
    const contentInput = document.getElementById("input-inquiry-content");

    const name = nameInput.value.trim();
    const sid = sidInput.value.trim();
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    // 1. 실명 필수 검증 (사용자 요구사항!)
    if (!name) {
        showToast("게시판은 실명제로 운영됩니다. 본인의 실명을 입력해주세요.", "error");
        nameInput.focus();
        return;
    }
    if (!sid) {
        showToast("실명 인증 및 본인 확인을 위해 학번을 입력해주세요.", "error");
        sidInput.focus();
        return;
    }
    if (!title) {
        showToast("문의 제목을 입력해주세요.", "error");
        titleInput.focus();
        return;
    }
    if (!content) {
        showToast("문의 내용을 입력해주세요.", "error");
        contentInput.focus();
        return;
    }

    // 공개 범위 선택 읽기 (핵심 요구사항!)
    const radios = document.getElementsByName("inquiry-visibility");
    let visibility = "staff"; // 기본: 관계자에게 공개
    radios.forEach(r => {
        if (r.checked) visibility = r.value;
    });

    const newPost = {
        id: "INQUIRY-" + Date.now() + "-" + Math.floor(Math.random() * 900 + 100),
        category: "inquiry",
        title: title,
        content: content,
        authorName: name, // 실명
        authorId: sid,     // 학번
        visibility: visibility, // 'public' or 'staff'
        isImportant: false,
        createdAt: new Date().toISOString(),
        answer: null
    };

    const posts = getAllBoardPosts();
    posts.unshift(newPost); // 최신글을 맨 앞에
    saveAllBoardPosts(posts);

    // 본인 학번 로컬 저장 (추후 편의)
    localStorage.setItem(LAST_SEARCH_KEY, sid);

    showToast("문의글이 성공적으로 등록되었습니다.", "success");
    closeInquiryModal();

    // 폼 초기화
    titleInput.value = "";
    contentInput.value = "";

    // 문의게시판 탭으로 이동 및 갱신
    switchBoardCategory("inquiry");
}

// =================================================================
// 16. 초기화 (App Bootstrapping)
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
    // 만약 최초 실행이라 데이터가 없다면 샘플 데이터 4건 자동 구성
    const existing = getAllReservations();
    if (!existing || existing.length === 0) {
        generateSampleData();
    }

    // 게시판 초기 데이터 확인
    initDefaultBoardPosts();

    // 헤더 배지 갱신
    updateHeaderBadge();

    // 초기 화면 진입
    navTo("building-screen");
});
