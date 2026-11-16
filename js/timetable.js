/**
 * CSU Room Reservation - Timetable & Slot Selection Module
 */

let selectedDate = new Date(); // 예약 화면 기준 날짜
let selectedStartSlotIdx = null;
let selectedEndSlotIdx = null;

// 새벽 05:00 당일 예약 오픈 상태 및 날짜 판별 (일요일 휴관 / 오직 당일 새벽 5시 이후에만 예약 가능)
function checkDailyOpenStatus(targetDateStr) {
    const policies = getBookingPolicies();
    const openHour = policies.dailyOpenHour !== undefined ? Number(policies.dailyOpenHour) : 5;

    // 0. 일요일: 상시 예약 완전 차단 (휴관)
    const targetDateObj = new Date(targetDateStr + "T00:00:00");
    if (targetDateObj.getDay() === 0) {
        return {
            isOpen: false,
            isSunday: true,
            statusType: "SUNDAY",
            openHour: openHour,
            title: "일요일 휴관",
            badgeText: "🔒",
            subText: "",
            alertClass: "sunday",
            alertIcon: "🔒",
            message: "일요일은 연습실을 운영하지 않습니다."
        };
    }

    const now = new Date();
    const todayStr = formatDateKey(now);

    // 1. 과거 날짜: 화면 확인(조회)은 가능하나 예약 신청은 불가
    if (targetDateStr < todayStr) {
        return {
            isOpen: false,
            isPast: true,
            statusType: "PAST",
            openHour: openHour,
            title: "지난 날짜",
            badgeText: "🔒",
            subText: "",
            alertClass: "past",
            alertIcon: "🔒",
            message: "지난 날짜는 예약할 수 없습니다."
        };
    }

    // 2. 미래 날짜 (내일 이후): 화면 확인(조회)은 가능하나 사전 예약 불가 (오직 당일 새벽 5시부터 오픈)
    if (targetDateStr > todayStr) {
        return {
            isOpen: false,
            isFuture: true,
            statusType: "FUTURE",
            openHour: openHour,
            title: "당일 예약제",
            badgeText: "🔒",
            subText: "",
            alertClass: "future",
            alertIcon: "🔒",
            message: `연습실 예약은 이용 당일 새벽 0${openHour}:00부터 가능합니다.`
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
            badgeText: "🔒",
            subText: "",
            alertClass: "before-open",
            alertIcon: "🔒",
            message: `새벽 0${openHour}:00 이후 예약 가능합니다.`
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

function renderTimeScreen() {
    if (!selectedRoom || !selectedFloor) return;

    document.getElementById("time-screen-nav-sub").textContent = `${selectedBuilding} · ${selectedFloor.name}`;
    document.getElementById("time-screen-room-name").textContent = `${selectedRoom.number}호`;

    document.getElementById("rh-type-tag").textContent = selectedRoom.type || "일반 연습실";
    document.getElementById("rh-room-title").textContent = `${selectedRoom.number}호 연습실`;
    document.getElementById("rh-floor-info").textContent = `${selectedBuilding} ${selectedFloor.title} (${selectedFloor.name}) · 30분 단위 예약`;

    updateDateDisplay();

    selectedStartSlotIdx = null;
    selectedEndSlotIdx = null;

    renderSlotsGrid();
    syncDropdownsWithSelection();
}

function updateDateDisplay() {
    const dateStr = formatDateDisplay(selectedDate);
    const dayStr = getDayOfWeekName(selectedDate);
    const dateKey = formatDateKey(selectedDate);
    const openStatus = checkDailyOpenStatus(dateKey);

    const dnDisplayDate = document.getElementById("dn-display-date");
    const dnDisplayDay = document.getElementById("dn-display-day");
    const dnStatusBadge = document.getElementById("dn-status-badge");

    if (dnDisplayDate) dnDisplayDate.textContent = dateStr;
    if (dnDisplayDay) {
        dnDisplayDay.textContent = dayStr;
        if (openStatus.isOpen) {
            dnDisplayDay.style.background = "#dcfce7";
            dnDisplayDay.style.color = "#15803d";
        } else {
            dnDisplayDay.style.background = "#f1f5f9";
            dnDisplayDay.style.color = "#475569";
        }
    }

    if (dnStatusBadge) {
        if (!openStatus.isOpen) {
            dnStatusBadge.style.display = "inline-flex";
            dnStatusBadge.textContent = "🔒 예약 불가";
        } else {
            dnStatusBadge.style.display = "none";
        }
    }

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

function renderSlotsGrid() {
    const container = document.getElementById("slots-grid");
    if (!container) return;

    container.innerHTML = "";
    const dateKey = formatDateKey(selectedDate);
    const openStatus = checkDailyOpenStatus(dateKey);
    const activeRes = getActiveReservations(dateKey, selectedBuilding, selectedRoom.number);

    const track = document.createElement("div");
    track.className = "timetable-track";

    let availableSlotCount = 0;
    let firstAvailableCardRef = null; // 첫 번째 예약 가능 슬롯 참조 (자동 스크롤용)
    const currentSelectedCount = (selectedStartSlotIdx !== null && selectedEndSlotIdx !== null)
        ? (selectedEndSlotIdx - selectedStartSlotIdx + 1)
        : 0;

    const now = new Date();
    const isToday = openStatus.isOpen || openStatus.statusType === "BEFORE_OPEN";
    const nowMins = now.getHours() * 60 + now.getMinutes();

    for (let h = OPERATING_START_HOUR; h < OPERATING_END_HOUR; h++) {
        const hourBlock = document.createElement("div");
        hourBlock.className = "timetable-hour-block";

        const hourCol = document.createElement("div");
        hourCol.className = "tt-hour-col";
        hourCol.innerHTML = `
            <span class="tt-hour-badge">${String(h).padStart(2, '0')}:00</span>
            <div class="tt-hour-line"></div>
        `;
        hourBlock.appendChild(hourCol);

        const slotsGroup = document.createElement("div");
        slotsGroup.className = "tt-slots-group";

        const hourSlotIndices = [(h - OPERATING_START_HOUR) * 2, (h - OPERATING_START_HOUR) * 2 + 1];

        hourSlotIndices.forEach(idx => {
            const slot = TIME_SLOTS[idx];
            if (!slot) return;

            const bookedRes = activeRes.find(r => {
                const s = timeStrToMinutes(r.startTime);
                const e = timeStrToMinutes(r.endTime);
                return slot.startMinutes < e && slot.endMinutes > s;
            });

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

            // 고정예약(레슨 등 반복) 충돌 검사
            const fixedConflict = checkFixedReservationConflict(dateKey, selectedBuilding, selectedRoom.number, slot.startMinutes, slot.endMinutes);
            const fixedSlotInfo = fixedConflict.hasConflict ? fixedConflict.fixed : null;

            const isPastSlot = isToday && slot.endMinutes <= nowMins;
            const isReserved = !!bookedRes || !!blockedSlotInfo || !!fixedSlotInfo || !openStatus.isOpen || isPastSlot;
            if (openStatus.isOpen && !isReserved) availableSlotCount++;

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
            } else if (fixedSlotInfo) {
                badgeText = "📌 고정 예약";
                const dayNames = ["일","월","화","수","목","금","토"];
                subText = `🔒 ${escapeHtml(fixedSlotInfo.title || '레슨')} (매주 ${dayNames[fixedSlotInfo.dayOfWeek]}요일)`;
                dotColor = "#7c3aed";
                badgeStyle = "background:#ede9fe; color:#5b21b6; border:1px solid #ddd6fe;";
            } else if (bookedRes) {
                badgeText = "예약 마감";
                subText = `🔒 예약 완료 (${maskName(bookedRes.name)} 님)`;
                dotColor = "#ef4444";
                badgeStyle = "background:#fee2e2; color:#991b1b; border:1px solid #fecaca;";
            } else if (!openStatus.isOpen) {
                badgeText = "🔒";
                subText = "";
                dotColor = "#9ca3af";
                badgeStyle = "background:#f1f5f9; color:#64748b; border:1px solid #e2e8f0;";
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
                    ${subText ? `<span class="tt-slot-subtext">${subText}</span>` : ''}
                </div>
                <span class="tt-slot-badge" style="${badgeStyle}">${badgeText}</span>
            `;

            if (openStatus.isOpen && !isReserved && !isPastSlot) {
                card.onclick = () => onSlotClick(slot.index);
                // 첫 번째 예약 가능 슬롯에 마킹 (자동 스크롤 대상)
                if (!firstAvailableCardRef) {
                    firstAvailableCardRef = card;
                    card.setAttribute("data-first-available", "true");
                }
            } else if (!openStatus.isOpen) {
                card.onclick = () => showToast(openStatus.message, "error");
            } else if (blockedSlotInfo) {
                card.onclick = () => showToast(`해당 시간은 시설 점검 중입니다. (${escapeHtml(blockedSlotInfo.reason || '이용 제한')})`, "error");
            } else if (fixedSlotInfo) {
                const dayNames = ["일","월","화","수","목","금","토"];
                card.onclick = () => showToast(`해당 시간은 고정 예약(${escapeHtml(fixedSlotInfo.title || '레슨')}) 시간대로 매주 ${dayNames[fixedSlotInfo.dayOfWeek]}요일에 지정되어 있습니다.`, "error");
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

    // 오늘 날짜이고 예약 가능한 슬롯이 있으면, 첫 번째 예약 가능 슬롯으로 자동 스크롤
    if (firstAvailableCardRef && openStatus.isOpen) {
        // 약간의 지연 후 스크롤 (DOM 렌더링 완료 후 작동하도록)
        setTimeout(() => {
            const cardTop = firstAvailableCardRef.getBoundingClientRect().top + window.scrollY;
            const offset = 100; // 헤더 고정 오프셋
            window.scrollTo({ top: cardTop - offset, behavior: "smooth" });
        }, 60);
    }

    const counterEl = document.getElementById("tt-avail-counter");
    if (counterEl) {
        if (!openStatus.isOpen) {
            counterEl.textContent = "🔒";
            counterEl.style.background = "#f1f5f9";
            counterEl.style.color = "#64748b";
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

    const reserveBtn = document.getElementById("btn-proceed-reserve");
    if (reserveBtn && !openStatus.isOpen) {
        reserveBtn.disabled = true;
        const btnSpan = reserveBtn.querySelector(".btn-text");
        if (btnSpan) {
            btnSpan.textContent = "🔒";
        }
    }

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

    const lastSid = localStorage.getItem(LAST_SEARCH_KEY);
    if (lastSid) {
        const cdCheck = checkRoomCooldownConflict(dateKey, selectedBuilding, selectedRoom.number, clickedSlot.startMinutes, clickedSlot.endMinutes, lastSid, "");
        if (cdCheck.hasConflict) {
            showToast(`[대기시간 안내] ${selectedRoom.number}호는 이전 예약 2시간 뒤(${cdCheck.allowedAfterTime})부터 예약 가능합니다.`, "normal");
        }
    }

    const policies = getBookingPolicies();
    const maxAllowedSlots = Math.round((policies.maxDurationHours || 2) * 2);
    const maxHoursLabel = policies.maxDurationHours || 2;

    if (selectedStartSlotIdx === null || selectedEndSlotIdx === null) {
        selectedStartSlotIdx = slotIdx;
        selectedEndSlotIdx = slotIdx;
    } else if (selectedStartSlotIdx === slotIdx && selectedEndSlotIdx === slotIdx) {
        selectedStartSlotIdx = null;
        selectedEndSlotIdx = null;
    } else if (slotIdx === selectedEndSlotIdx && selectedEndSlotIdx > selectedStartSlotIdx) {
        selectedEndSlotIdx = slotIdx - 1;
    } else if (slotIdx === selectedStartSlotIdx && selectedEndSlotIdx > selectedStartSlotIdx) {
        selectedStartSlotIdx = slotIdx + 1;
    } else if (slotIdx === selectedEndSlotIdx + 1) {
        const newCount = selectedEndSlotIdx - selectedStartSlotIdx + 2;
        if (newCount > maxAllowedSlots) {
            showToast(`1회 최대 ${maxAllowedSlots}개 슬롯(${maxHoursLabel}시간)까지만 연속 예약할 수 있습니다.`, "error");
        } else {
            selectedEndSlotIdx = slotIdx;
        }
    } else if (slotIdx === selectedStartSlotIdx - 1) {
        const newCount = selectedEndSlotIdx - selectedStartSlotIdx + 2;
        if (newCount > maxAllowedSlots) {
            showToast(`1회 최대 ${maxAllowedSlots}개 슬롯(${maxHoursLabel}시간)까지만 연속 예약할 수 있습니다.`, "error");
        } else {
            selectedStartSlotIdx = slotIdx;
        }
    } else {
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
        startSelect.innerHTML = `<option value="">🔒</option>`;
        endSelect.innerHTML = `<option value="">🔒</option>`;

        if (timeSummary) timeSummary.textContent = "🔒";
        if (statusBadge) statusBadge.textContent = "🔒";
        if (summaryBox) summaryBox.classList.remove("error");
        if (reserveBtn) {
            reserveBtn.disabled = true;
            const btnSpan = reserveBtn.querySelector(".btn-text");
            if (btnSpan) btnSpan.textContent = "🔒";
        }
        return;
    }

    startSelect.disabled = false;
    endSelect.disabled = false;

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

    updateEndSelectOptions();

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

    let validEndTimes = [];
    for (let step = 1; step <= maxSlots; step++) {
        const targetSlotIdx = startSlotIdx + step - 1;
        if (targetSlotIdx >= TIME_SLOTS.length) break;

        const targetSlot = TIME_SLOTS[targetSlotIdx];
        const overlapResult = checkOverlap(dateKey, selectedBuilding, selectedRoom.number, startSlot.startMinutes, targetSlot.endMinutes);
        if (overlapResult.overlap) {
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
        opt.textContent = "🔒 시간 중복";
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
        selectedEndSlotIdx = sIdx;
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

