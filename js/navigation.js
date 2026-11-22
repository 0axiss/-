/**
 * CSU Room Reservation - Screen Navigation & Room Browsing Module
 */

let currentScreen = "building-screen";
let selectedBuilding = "신관";
let selectedFloor = null;
let selectedRoom = null;

let statusDate = new Date();
let statusViewMode = "timeline"; // 'timeline' or 'list'

let overviewBuilding = "신관";
let overviewDate = new Date();

let isHistoryInitialized = false;
let lastBackPressTime = 0;
let isExiting = false;

function navTo(screenId, pushHistory = true) {
    const prevScreen = currentScreen;

    document.querySelectorAll(".view-screen").forEach(el => {
        el.classList.remove("active");
    });

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add("active");
        currentScreen = screenId;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    updateBottomNav(screenId);

    if (screenId === "overview-screen") {
        renderOverviewDashboard();
    } else if (screenId === "my-screen") {
        if (typeof initMyScreen === "function") initMyScreen();
    } else if (screenId === "board-screen") {
        if (typeof renderBoardScreen === "function") renderBoardScreen();
    } else if (screenId === "room-screen" && !pushHistory) {
        if (typeof renderFloorTabsAndRooms === "function") {
            const titleEl = document.getElementById("room-screen-building-name");
            if (titleEl && selectedBuilding) titleEl.textContent = selectedBuilding;
            renderFloorTabsAndRooms();
        }
    } else if (screenId === "time-screen" && !pushHistory) {
        if (typeof renderTimeScreen === "function" && selectedRoom) {
            renderTimeScreen();
        }
    }

    // 모바일 브라우저 및 안드로이드 하단 물리/제스처 뒤로가기 버튼 히스토리 스택 연동
    if (pushHistory) {
        try {
            if (!isHistoryInitialized) {
                isHistoryInitialized = true;
                history.replaceState({ screen: screenId, root: true }, "");
                history.pushState({ screen: screenId }, "");
            } else if (prevScreen !== screenId) {
                history.pushState({ screen: screenId }, "");
            }
        } catch (e) {
            console.warn("Browser history pushState warning:", e);
        }
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

    // 타임테이블 화면(time-screen) 하단 고정 예약 신청 버튼 표시 토글
    const timeActionBar = document.getElementById("timetable-bottom-action-bar");
    if (timeActionBar) {
        timeActionBar.style.display = (screenId === "time-screen") ? "block" : "none";
    }
}

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

function selectBuilding(buildingName) {
    if (!BUILDINGS[buildingName]) return;
    selectedBuilding = buildingName;

    const titleEl = document.getElementById("room-screen-building-name");
    if (titleEl) titleEl.textContent = buildingName;

    renderFloorTabsAndRooms();
    navTo("room-screen");
}

function renderFloorTabsAndRooms(activeFloorName = "ALL") {
    const b = BUILDINGS[selectedBuilding];
    if (!b) return;

    const tabsContainer = document.getElementById("floor-tabs-container");
    const roomsContainer = document.getElementById("rooms-container");
    if (!tabsContainer || !roomsContainer) return;

    tabsContainer.innerHTML = "";

    const allTab = document.createElement("button");
    allTab.className = `floor-tab-btn ${activeFloorName === "ALL" ? "active" : ""}`;
    allTab.textContent = `전체 (${getTotalRoomsInBuilding(b)}실)`;
    allTab.onclick = () => renderFloorTabsAndRooms("ALL");
    tabsContainer.appendChild(allTab);

    b.floors.forEach(floor => {
        const tab = document.createElement("button");
        tab.className = `floor-tab-btn ${activeFloorName === floor.name ? "active" : ""}`;
        tab.textContent = `${floor.name} (${floor.rooms.length}실)`;
        tab.onclick = () => renderFloorTabsAndRooms(floor.name);
        tabsContainer.appendChild(tab);
    });

    roomsContainer.innerHTML = "";
    const todayStr = formatDateKey(new Date());
    const activeReservationsToday = getActiveReservations(todayStr, selectedBuilding);

    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const targetFloors = activeFloorName === "ALL"
        ? b.floors
        : b.floors.filter(f => f.name === activeFloorName);

    const unavailableRooms = [];
    const roomSettings = getRoomSettings();

    targetFloors.forEach(floor => {
        const availRooms = [];

        floor.rooms.forEach(room => {
            const rKey = `${selectedBuilding}_${room.number}`;
            const rSetting = roomSettings[rKey];
            const isRoomAvailable = !rSetting || rSetting.isAvailable !== false;

            if (isRoomAvailable) {
                availRooms.push(room);
            } else {
                unavailableRooms.push({
                    floor: floor,
                    room: room,
                    setting: rSetting
                });
            }
        });

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
                const isCurrentlyOccupied = activeReservationsToday.some(r => {
                    if (r.room !== room.number) return false;
                    const s = timeStrToMinutes(r.startTime);
                    const e = timeStrToMinutes(r.endTime);
                    return nowMins >= s && nowMins < e;
                });

                const todayCount = activeReservationsToday.filter(r => r.room === room.number).length;

                const card = document.createElement("div");
                card.className = "room-card-item";

                card.onclick = () => {
                    selectRoom(floor, room);
                };

                const badgeInfo = getRoomBadgeInfo(selectedBuilding, room);
                let badgeClass = "";
                if (room.category === "organ") badgeClass = "organ";
                else if (room.category === "grand") badgeClass = "grand";
                else if (room.category === "society") badgeClass = "society";

                card.innerHTML = `
                    <div class="rci-top">
                        <span class="rci-number">${escapeHtml(getRoomDisplayName(selectedBuilding, room.number))}</span>
                        <span class="rci-status-dot ${isCurrentlyOccupied ? 'occupied' : ''}" title="${isCurrentlyOccupied ? '현재 사용중' : '현재 비어있음'}"></span>
                    </div>
                    ${badgeInfo.label ? `<span class="rci-badge ${badgeInfo.color ? '' : badgeClass}" style="${buildBadgeColorStyle(badgeInfo.color)}">${escapeHtml(badgeInfo.label)}</span>` : '<span class="rci-badge">일반 연습실</span>'}
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
                showToast(`현재 ${getRoomDisplayName(selectedBuilding, room.number)} 연습실은 이용이 불가합니다 (${reasonText}).`, "error");
            };

            card.innerHTML = `
                <div class="rci-top">
                    <div style="display:flex; align-items:baseline; gap:6px;">
                        <span class="rci-number" style="color:var(--gray-500);">${escapeHtml(getRoomDisplayName(selectedBuilding, room.number))}</span>
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

    if (typeof renderTimeScreen === "function") renderTimeScreen();
    navTo("time-screen");
}

function openOverviewForCurrentBuilding() {
    overviewBuilding = selectedBuilding;
    navTo("overview-screen");
}

function openRoomStatusScreen() {
    if (!selectedRoom || !selectedFloor) return;

    statusDate = new Date(selectedDate);
    document.getElementById("status-nav-sub").textContent = `${selectedBuilding} · ${getRoomDisplayName(selectedBuilding, selectedRoom.number)} (${selectedRoom.type || '연습실'})`;

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

    const totalMinutes = (OPERATING_END_HOUR - OPERATING_START_HOUR) * 60;
    const totalHeight = 520;

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
    const dayOpenStatus = checkDailyOpenStatus(dateKey);

    const totalRooms = getTotalRoomsInBuilding(b);
    const now = new Date();
    const isToday = formatDateKey(now) === dateKey;
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const roomSettings = getRoomSettings();
    let busyRoomsNow = 0;
    let disabledRoomsCount = 0;

    b.floors.forEach(f => {
        f.rooms.forEach(r => {
            const rKey = `${overviewBuilding}_${r.number}`;
            const isAvail = !roomSettings[rKey] || roomSettings[rKey].isAvailable !== false;
            if (!isAvail) {
                disabledRoomsCount++;
            } else if (isToday) {
                const isBusy = activeRes.some(res => {
                    return res.room === r.number && nowMins >= res.startMin && nowMins < res.endMin;
                });
                if (isBusy) busyRoomsNow++;
            }
        });
    });

    const activeRoomsTotal = dayOpenStatus.isOpen ? Math.max(0, totalRooms - disabledRoomsCount) : 0;
    const availableNow = Math.max(0, activeRoomsTotal - busyRoomsNow);
    const totalResCount = activeRes.length;

    if (statsRow) {
        statsRow.innerHTML = `
            <div class="stat-pill">전체 <strong>${totalRooms}</strong>실</div>
            <div class="stat-pill avail">지금 예약가능 <strong>${isToday ? availableNow : activeRoomsTotal}</strong>실</div>
            <div class="stat-pill reserved">오늘 예약 <strong>${totalResCount}</strong>건</div>
        `;
    }

    roomsList.innerHTML = "";
    const totalDayMins = (OPERATING_END_HOUR - OPERATING_START_HOUR) * 60;

    b.floors.forEach(floor => {
        const floorSec = document.createElement("div");
        floorSec.className = "overview-floor-section";

        const title = document.createElement("div");
        title.className = "overview-floor-title";
        title.textContent = `${floor.name} (${floor.title}) · ${floor.rooms.length}실`;
        floorSec.appendChild(title);

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

            let barSegmentsHtml = "";
            if (!isRoomAvailable) {
                barSegmentsHtml = `<div class="orc-blocked-full" style="width:100%; height:100%; background:repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 6px, #e2e8f0 6px, #e2e8f0 12px); border-radius:4px;" title="이용 불가"></div>`;
            } else {
                roomRes.forEach(r => {
                    const leftPercent = ((r.startMin - OPERATING_START_HOUR * 60) / totalDayMins) * 100;
                    const widthPercent = ((r.endMin - r.startMin) / totalDayMins) * 100;
                    barSegmentsHtml += `<div class="orc-booked-segment" style="left:${leftPercent}%; width:${widthPercent}%;" title="${r.startTime}~${r.endTime}"></div>`;
                });
            }

            let badgeText = "예약가능";
            let badgeClass = "orc-badge";

            if (!isRoomAvailable) {
                badgeText = "예약 불가";
                badgeClass = "orc-badge disabled";
            } else if (!dayOpenStatus.isOpen) {
                // 일요일 휴관 / 지난 날짜 / 당일 예약 오픈 전·미래 날짜는 예약 불가 표시
                badgeText = dayOpenStatus.isSunday ? "휴관" : "예약 불가";
                badgeClass = "orc-badge disabled";
            } else if (isCurrentlyOccupied) {
                badgeText = "사용중";
                badgeClass = "orc-badge busy";
            } else if (roomRes.length > 0) {
                badgeText = `${roomRes.length}건 예약`;
                badgeClass = "orc-badge";
            }

            card.innerHTML = `
                <div class="orc-info">
                    <span class="orc-room-num">${escapeHtml(getRoomDisplayName(overviewBuilding, room.number))}</span>
                    <span class="orc-room-type">${escapeHtml(getRoomBadgeInfo(overviewBuilding, room).label || '연습실')}</span>
                </div>
                <div class="orc-timeline-bar">
                    ${barSegmentsHtml}
                </div>
                <span class="${badgeClass}">
                    ${badgeText}
                </span>
            `;

            floorSec.appendChild(card);
        });

        roomsList.appendChild(floorSec);
    });
}

// =============================================================================
// 모바일 브라우저 및 안드로이드(갤럭시/삼성폰 등) 하단 시스템 뒤로가기 버튼 처리 엔진
// =============================================================================

function getActiveModalId() {
    const modals = [
        "board-auth-modal",
        "inquiry-modal",
        "board-detail-modal",
        "cancel-modal",
        "success-modal",
        "reservation-modal"
    ];
    for (const id of modals) {
        const el = document.getElementById(id);
        if (el) {
            const display = window.getComputedStyle(el).display;
            if (display !== "none") {
                return id;
            }
        }
    }
    return null;
}

function closeActiveModalById(modalId) {
    if (modalId === "board-auth-modal" && typeof closeBoardAuthModal === "function") {
        closeBoardAuthModal();
        return true;
    }
    if (modalId === "inquiry-modal" && typeof closeInquiryModal === "function") {
        closeInquiryModal();
        return true;
    }
    if (modalId === "board-detail-modal" && typeof closeBoardDetailModal === "function") {
        closeBoardDetailModal();
        return true;
    }
    if (modalId === "cancel-modal" && typeof closeCancelModal === "function") {
        closeCancelModal();
        return true;
    }
    if (modalId === "success-modal" && typeof closeSuccessModal === "function") {
        closeSuccessModal();
        return true;
    }
    if (modalId === "reservation-modal" && typeof closeReservationModal === "function") {
        closeReservationModal();
        return true;
    }
    const el = document.getElementById(modalId);
    if (el) {
        el.style.display = "none";
        return true;
    }
    return false;
}

window.addEventListener("popstate", (e) => {
    if (isExiting) return;

    // 1. 열려 있는 모달 창이 있다면 폰 뒤로가기 시 모달부터 닫음 (화면 이탈 방지)
    const activeModalId = getActiveModalId();
    if (activeModalId) {
        closeActiveModalById(activeModalId);
        // 모달만 닫히고 현재 보고 있던 화면을 유지하도록 히스토리 상태 1개 복원
        history.pushState({ screen: currentScreen }, "");
        return;
    }

    // 2. 히스토리 상태에 이전 화면 정보가 있는 경우
    if (e.state && e.state.screen) {
        const targetScreen = e.state.screen;

        // 메인 홈 화면(루트)에서 뒤로가기를 눌렀을 때
        if (e.state.root || (targetScreen === "building-screen" && currentScreen === "building-screen")) {
            const now = Date.now();
            if (now - lastBackPressTime < 2000) {
                isExiting = true;
                history.back();
                return;
            } else {
                lastBackPressTime = now;
                history.pushState({ screen: "building-screen" }, "");
                if (typeof showToast === "function") {
                    showToast("'뒤로' 버튼을 한 번 더 누르면 종료됩니다.", "normal");
                }
                return;
            }
        }

        // 바로 이전 화면으로 안전하게 전환
        navTo(targetScreen, false);
        return;
    }

    // 3. e.state가 없거나 null인 경우 (외부 링크 진입 등)
    if (currentScreen !== "building-screen") {
        navTo("building-screen", false);
        history.pushState({ screen: "building-screen" }, "");
    } else {
        const now = Date.now();
        if (now - lastBackPressTime < 2000) {
            isExiting = true;
            history.back();
        } else {
            lastBackPressTime = now;
            history.pushState({ screen: "building-screen" }, "");
            if (typeof showToast === "function") {
                showToast("'뒤로' 버튼을 한 번 더 누르면 종료됩니다.", "normal");
            }
        }
    }
});

