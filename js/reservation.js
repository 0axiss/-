/**
 * CSU Room Reservation - Booking Submission & My Reservations Module
 */

let cancelTargetReservation = null;

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

    const check = checkOverlap(dateKey, selectedBuilding, selectedRoom.number, startMin, endMin);
    if (check.overlap) {
        showToast("선택하신 시간대에 이미 확정된 예약이 존재합니다.", "error");
        renderSlotsGrid();
        return;
    }

    document.getElementById("modal-summary-room").textContent = `${selectedBuilding} ${selectedRoom.number}호 (${selectedRoom.type || '연습실'})`;
    document.getElementById("modal-summary-date").textContent = `${formatDateDisplay(selectedDate)} (${getShortDayName(selectedDate)})`;

    const durMins = endMin - startMin;
    const h = Math.floor(durMins / 60);
    const m = durMins % 60;
    const durStr = `${h > 0 ? h + '시간 ' : ''}${m > 0 ? m + '분' : ''}`;
    document.getElementById("modal-summary-time").textContent = `${startStr} ~ ${endStr} (총 ${durStr})`;

    const lastSid = localStorage.getItem(LAST_SEARCH_KEY);
    if (lastSid) {
        const idInput = document.getElementById("input-res-sid");
        if (idInput && !idInput.value) idInput.value = lastSid;

        // 동일 학생의 동일 연습실 쿨다운 대기 확인
        const cdCheck = checkRoomCooldownConflict(dateKey, selectedBuilding, selectedRoom.number, startMin, endMin, lastSid, "");
        if (cdCheck.hasConflict) {
            alert(cdCheck.message);
            return;
        }
    }

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
    const pinInput = document.getElementById("input-res-pin");
    const submitBtn = document.getElementById("btn-submit-booking");

    const name = nameInput.value.trim();
    const sid = sidInput.value.trim();
    const phone = phoneInput.value.trim();
    const pin = pinInput ? pinInput.value.trim() : "";

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
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        showToast("본인 확인용 비밀번호를 숫자 4자리로 입력해주세요.", "error");
        if (pinInput) pinInput.focus();
        return;
    }

    const startStr = TIME_SLOTS[selectedStartSlotIdx].startStr;
    const endStr = TIME_SLOTS[selectedEndSlotIdx].endStr;
    const startMin = timeStrToMinutes(startStr);
    const endMin = timeStrToMinutes(endStr);
    const dateKey = formatDateKey(selectedDate);

    // 정책 검증 0: 일요일 완전 차단 및 당일 예약 오픈 검사
    const targetDateObj0 = new Date(selectedDate);
    if (targetDateObj0.getDay() === 0) {
        alert("일요일은 연습실을 운영하지 않습니다. (예약 불가)");
        return;
    }

    const openStatus = checkDailyOpenStatus(dateKey);
    if (!openStatus.isOpen) {
        alert(openStatus.message);
        return;
    }

    const todayStr = formatDateKey(new Date());
    if (dateKey !== todayStr) {
        alert("연습실 예약은 오직 이용 당일(오늘)만 신청할 수 있습니다.");
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
    const targetDateObj1 = new Date(selectedDate);
    targetDateObj1.setHours(0, 0, 0, 0);
    const diffDays = Math.round((targetDateObj1 - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        showToast("지난 날짜는 예약할 수 없습니다.", "error");
        return;
    }
    const maxAdvance = policies.bookingAdvanceDays !== undefined ? policies.bookingAdvanceDays : 0;
    if (diffDays > maxAdvance) {
        alert(`사전 예약은 불가합니다. 연습실 예약은 이용 당일 새벽 0${policies.dailyOpenHour || 5}:00부터 가능합니다.`);
        return;
    }

    // 정책 검증 2: 1일 최대 예약 횟수 검증
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

    // 정책 검증 3: 동일 학생의 타 연습실 동시간대 중복 예약 방지
    const timeConflictBooking = myTodayBookings.find(r => {
        const rStartMin = r.startMin !== undefined ? r.startMin : timeStrToMinutes(r.startTime);
        const rEndMin = r.endMin !== undefined ? r.endMin : timeStrToMinutes(r.endTime);
        return (startMin < rEndMin && endMin > rStartMin);
    });

    if (timeConflictBooking) {
        const bldName = timeConflictBooking.building || "연습실";
        const roomName = timeConflictBooking.room ? `${timeConflictBooking.room}호` : "";
        alert(`[중복 예약 불가]\n이미 동일한 시간대에 ${bldName} ${roomName} (${timeConflictBooking.startTime}~${timeConflictBooking.endTime}) 예약이 있습니다.\n기존 예약을 취소하신 후 다시 신청해주세요.`);
        return;
    }

    // 정책 검증 4: 동일 연습실 연속 예약 방지 쿨다운 검증 (이전 예약 종료 후 일정 시간 대기)
    const cooldownCheck = checkRoomCooldownConflict(dateKey, selectedBuilding, selectedRoom.number, startMin, endMin, sid, phone, all);
    if (cooldownCheck.hasConflict) {
        alert(cooldownCheck.message);
        return;
    }

    // 로컬 사전 중복 체크
    const preCheck = checkOverlap(dateKey, selectedBuilding, selectedRoom.number, startMin, endMin);
    if (preCheck.overlap) {
        if (preCheck.conflict && preCheck.conflict.isBlocked) {
            alert(`해당 시간대는 시설 점검(${preCheck.conflict.name})으로 인해 예약할 수 없습니다.`);
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
        password: pin,
        status: "confirmed",
        createdAt: new Date().toISOString()
    };

    // Firebase 트랜잭션 기반 원자적 예약 (동시접속 충돌 방지)
    if (typeof remoteDb !== "undefined" && remoteDb && isRemoteSyncReady) {
        if (submitBtn) {
            submitBtn.disabled = true;
            const btnSpan = submitBtn.querySelector("span");
            if (btnSpan) btnSpan.textContent = "예약 처리 중...";
        }

        remoteDb.ref("reservations").transaction(function(currentData) {
            const list = currentData ? (Array.isArray(currentData) ? currentData : Object.values(currentData)) : [];

            const serverConflict = list.some(r => {
                if (r.status === "cancelled") return false;
                if (r.date !== dateKey) return false;
                if (r.building !== selectedBuilding) return false;
                if (r.room !== selectedRoom.number) return false;
                const rStart = r.startMin !== undefined ? r.startMin : timeStrToMinutes(r.startTime);
                const rEnd = r.endMin !== undefined ? r.endMin : timeStrToMinutes(r.endTime);
                return (startMin < rEnd && endMin > rStart);
            });

            if (serverConflict) {
                return; // abort transaction
            }

            // 서버 트랜잭션 내 동일 학생 쿨다운 검증 (독점 방지)
            const serverCooldown = checkRoomCooldownConflict(dateKey, selectedBuilding, selectedRoom.number, startMin, endMin, sid, phone, list);
            if (serverCooldown.hasConflict) {
                return; // abort transaction
            }

            list.push(newReservation);
            return list;

        }, function(error, committed, snapshot) {
            if (submitBtn) {
                submitBtn.disabled = false;
                const btnSpan = submitBtn.querySelector("span");
                if (btnSpan) btnSpan.textContent = "즉시 예약 확정하기";
            }

            if (error) {
                console.error("예약 트랜잭션 오류:", error);
                alert("네트워크 오류로 예약에 실패했습니다. 다시 시도해주세요.");
                return;
            }

            if (!committed) {
                alert("죄송합니다. 방금 다른 학생이 해당 시간을 예약하였습니다.\n다른 시간을 선택해주세요.");
                closeReservationModal();
                renderSlotsGrid();
                syncDropdownsWithSelection();
                return;
            }

            const serverList = snapshot.val();
            if (serverList) {
                const arr = Array.isArray(serverList) ? serverList : Object.values(serverList);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
                updateHeaderBadge();
            }

            localStorage.setItem(LAST_SEARCH_KEY, sid);
            sessionStorage.setItem("csu_res_session_pin", pin);
            closeReservationModal();
            nameInput.value = "";
            phoneInput.value = "";
            if (pinInput) pinInput.value = "";

            openSuccessModal(newReservation);
            renderSlotsGrid();
            syncDropdownsWithSelection();
            showToast("예약이 즉시 확정되었습니다!", "success");

        }, false);

    } else {
        const updatedAll = getAllReservations();
        updatedAll.push(newReservation);
        saveAllReservations(updatedAll);

        localStorage.setItem(LAST_SEARCH_KEY, sid);
        sessionStorage.setItem("csu_res_session_pin", pin);
        closeReservationModal();
        nameInput.value = "";
        phoneInput.value = "";
        if (pinInput) pinInput.value = "";
        openSuccessModal(newReservation);
        renderSlotsGrid();
        syncDropdownsWithSelection();
        showToast("예약이 즉시 확정되었습니다!", "success");
    }
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
        <div class="rsc-row">
            <span class="rsc-label">본인 확인 비밀번호</span>
            <strong class="rsc-val" style="color:var(--primary); font-weight:700;">${res.password ? res.password : '••••'} (4자리)</strong>
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

function initMyScreen() {
    const input = document.getElementById("search-student-id");
    const pinInput = document.getElementById("search-pin");
    const saved = localStorage.getItem(LAST_SEARCH_KEY);
    if (saved && input && !input.value) {
        input.value = saved;
    }
    const sessionPin = sessionStorage.getItem("csu_res_session_pin");
    if (sessionPin && pinInput && !pinInput.value) {
        pinInput.value = sessionPin;
    }
    if (input && input.value && pinInput && pinInput.value) {
        searchMyReservations();
    }
}

function searchMyReservations() {
    const input = document.getElementById("search-student-id");
    const pinInput = document.getElementById("search-pin");
    const container = document.getElementById("my-res-container");
    if (!input || !container) return;

    const query = input.value.trim();
    const pin = pinInput ? pinInput.value.trim() : "";

    if (!query) {
        showToast("학번을 입력해주세요.", "error");
        input.focus();
        return;
    }

    if (!pin) {
        showToast("비밀번호 4자리를 입력해주세요.", "error");
        if (pinInput) pinInput.focus();
        return;
    }

    if (pin.length !== 4) {
        showToast("비밀번호는 숫자 4자리여야 합니다.", "error");
        if (pinInput) pinInput.focus();
        return;
    }

    localStorage.setItem(LAST_SEARCH_KEY, query);
    sessionStorage.setItem("csu_res_session_pin", pin);
    updateHeaderBadge();

    const cleanQuery = query.replace(/[^0-9]/g, "");
    const all = getAllReservations();

    // 1. 학번 또는 연락처로 해당 학생의 예약 검색
    const studentReservations = all.filter(r => {
        const sid = (r.studentId || "").trim();
        const phClean = (r.phone || "").replace(/[^0-9]/g, "");
        return sid === query || phClean === cleanQuery;
    });

    if (studentReservations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h4>예약 내역이 없습니다</h4>
                <p>'${escapeHtml(query)}'로 등록된 연습실 예약이 존재하지 않습니다.<br>학번을 다시 확인해주세요.</p>
            </div>
        `;
        return;
    }

    // 2. 비밀번호(PIN) 검증
    // 구 데이터(password 없는 예약)의 경우: 전화번호 뒷 4자리 또는 학번 뒷 4자리를 임시 암호로 인정하여 호환 지원
    const matched = studentReservations.filter(r => {
        if (r.password) {
            return String(r.password).trim() === pin;
        } else {
            const ph = (r.phone || "").replace(/[^0-9]/g, "");
            const ph4 = ph.length >= 4 ? ph.slice(-4) : "";
            const sid4 = (r.studentId || "").slice(-4);
            return pin === ph4 || pin === sid4;
        }
    });

    if (matched.length === 0) {
        showToast("비밀번호 4자리가 일치하지 않습니다.", "error");
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔒</div>
                <h4>비밀번호가 일치하지 않습니다</h4>
                <p>해당 학번의 예약 내역이 존재하지만, <strong>비밀번호 4자리가 일치하지 않아</strong> 열람할 수 없습니다.<br>비밀번호를 분실하신 경우 학과 사무실/관리자에게 문의해주세요.</p>
            </div>
        `;
        return;
    }

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

    if (cancelTargetReservation.password) {
        const sessionPin = sessionStorage.getItem("csu_res_session_pin");
        if (sessionPin !== cancelTargetReservation.password) {
            const inputPin = prompt("예약 취소 본인 확인을 위해 4자리 비밀번호를 입력해주세요:");
            if (!inputPin || inputPin.trim() !== cancelTargetReservation.password) {
                alert("비밀번호가 일치하지 않아 예약을 취소할 수 없습니다.");
                return;
            }
        }
    }

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

    if (currentScreen === "time-screen") {
        renderSlotsGrid();
        syncDropdownsWithSelection();
    } else if (currentScreen === "overview-screen") {
        renderOverviewDashboard();
    }
}

