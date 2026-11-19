/**
 * CSU Room Reservation - Storage & Data Access Module
 */

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
                dailyOpenHour: parsed.dailyOpenHour !== undefined ? Number(parsed.dailyOpenHour) : 5,
                roomCooldownHours: parsed.roomCooldownHours !== undefined ? Number(parsed.roomCooldownHours) : 2
            };
        }
    } catch (e) {}
    return {
        maxDurationHours: 2,
        maxDailyBookingsPerUser: 2,
        bookingAdvanceDays: 0,
        cancelDeadlineMinutes: 30,
        dailyOpenHour: 5,
        roomCooldownHours: 2
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

/**
 * 연습실 번호 아래 표시되는 구분 배지(오르간/그랜드 등)의 관리자 지정 문구/색상 조회
 * @returns {{ label: string, color: string|null }} color 가 null 이면 기본 스타일 사용
 */
function getRoomBadgeInfo(building, room) {
    const settings = getRoomSettings();
    const s = settings[`${building}_${room.number}`] || {};
    const label = (s.badgeLabel && String(s.badgeLabel).trim()) ? String(s.badgeLabel).trim() : "";
    const color = /^#[0-9a-fA-F]{6}$/.test(s.badgeColor || "") ? s.badgeColor : null;
    return { label: label || room.type || "", color: color };
}

// 배지 색상(HEX)으로부터 inline style 생성 (연한 배경 + 진한 글씨 + 테두리)
function buildBadgeColorStyle(hex) {
    if (!hex) return "";
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `background:rgba(${r},${g},${b},0.14); color:${hex}; border:1px solid rgba(${r},${g},${b},0.35);`;
}

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
        if (typeof updateHeaderBadge === "function") updateHeaderBadge();
        if (typeof pushReservationsToCloud === "function") {
            pushReservationsToCloud(list);
        }
    } catch (e) {
        console.error("저장소 쓰기 오류:", e);
        showToast("예약 데이터 저장에 실패했습니다.", "error");
    }
}

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

function checkOverlap(dateStr, building, roomNum, startMin, endMin, excludeId = null) {
    const list = getActiveReservations(dateStr, building, roomNum);
    for (const res of list) {
        if (excludeId && res.id === excludeId) continue;
        const resStart = timeStrToMinutes(res.startTime);
        const resEnd = timeStrToMinutes(res.endTime);
        if (startMin < resEnd && endMin > resStart) {
            return {
                overlap: true,
                conflict: res
            };
        }
    }

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

/**
 * 동일 학생의 동일 연습실 연속 독점 방지 쿨다운 검증
 * (예: 9:00~11:00 예약 시 2시간 뒤인 13:00부터 재예약 가능)
 */
function checkRoomCooldownConflict(dateKey, building, roomNum, startMin, endMin, studentId, phone, reservationsList = null, excludeId = null) {
    const policies = getBookingPolicies();
    const cooldownHours = policies.roomCooldownHours !== undefined ? Number(policies.roomCooldownHours) : 2;
    if (cooldownHours <= 0) {
        return { hasConflict: false };
    }
    const cooldownMins = Math.round(cooldownHours * 60);

    const list = reservationsList || getAllReservations();
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";
    const cleanSid = studentId ? String(studentId).trim() : "";

    if (!cleanSid && !cleanPhone) {
        return { hasConflict: false };
    }

    for (const r of list) {
        if (r.status === "cancelled") continue;
        if (excludeId && r.id === excludeId) continue;
        if (r.date !== dateKey) continue;
        if (r.building !== building || r.room !== roomNum) continue;

        // 동일 학생 여부 (학번 또는 연락처 일치)
        const rPhone = r.phone ? r.phone.replace(/[^0-9]/g, "") : "";
        const rSid = r.studentId ? String(r.studentId).trim() : "";

        const isSameStudent = (cleanSid && rSid && cleanSid === rSid) ||
                              (cleanPhone && rPhone && cleanPhone === rPhone);

        if (!isSameStudent) continue;

        const pStart = r.startMin !== undefined ? r.startMin : timeStrToMinutes(r.startTime);
        const pEnd = r.endMin !== undefined ? r.endMin : timeStrToMinutes(r.endTime);

        // 1. 기존 예약 종료 직후 쿨다운 미경과 검사 (이전 예약 종료 후 cooldownMins 지나야 시작 가능)
        if (startMin >= pEnd && startMin < pEnd + cooldownMins) {
            const allowedAfter = minutesToTimeStr(pEnd + cooldownMins);
            return {
                hasConflict: true,
                type: "after",
                prevBooking: r,
                cooldownHours: cooldownHours,
                allowedAfterTime: allowedAfter,
                message: `[동일 연습실 재예약 대기 시간 안내]\n독점 방지 정책에 따라 동일 연습실(${building} ${roomNum}호)은 이전 예약(${r.startTime}~${r.endTime}) 종료 후 ${cooldownHours}시간 뒤인 ${allowedAfter}부터 재예약할 수 있습니다.`
            };
        }

        // 2. 기존 예약 시작 직전 쿨다운 미경과 검사 (새 예약 종료 시점이 기존 예약 시작 전 cooldownMins 이전이어야 함)
        if (endMin <= pStart && endMin > pStart - cooldownMins) {
            const allowedBefore = minutesToTimeStr(Math.max(0, pStart - cooldownMins));
            return {
                hasConflict: true,
                type: "before",
                prevBooking: r,
                cooldownHours: cooldownHours,
                allowedBeforeTime: allowedBefore,
                message: `[동일 연습실 재예약 대기 시간 안내]\n독점 방지 정책에 따라 동일 연습실(${building} ${roomNum}호)은 기존 예약(${r.startTime}~${r.endTime}) 시작 ${cooldownHours}시간 전인 ${allowedBefore} 이전에만 예약할 수 있습니다.`
            };
        }

        // 3. 중복 시간대 검사 (시간 겹침)
        if (startMin < pEnd && endMin > pStart) {
            return {
                hasConflict: true,
                type: "overlap",
                prevBooking: r,
                cooldownHours: cooldownHours,
                message: `이미 본인이 신청한 기존 예약(${r.startTime}~${r.endTime})과 시간이 겹칩니다.`
            };
        }
    }

    return { hasConflict: false };
}

/**
 * 고정예약 목록 조회
 */
function getFixedReservations() {
    try {
        const raw = localStorage.getItem(FIXED_RESERVATIONS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 특정 날짜(요일) + 연습실에 고정예약 충돌이 있는지 검사
 * @param {string} dateKey - 날짜 문자열 (YYYY-MM-DD)
 * @param {string} building - 건물명
 * @param {string} roomNum - 연습실 호수
 * @param {number} startMin - 시작 분
 * @param {number} endMin - 종료 분
 * @returns {{ hasConflict: boolean, fixed?: object }}
 */
function checkFixedReservationConflict(dateKey, building, roomNum, startMin, endMin) {
    const list = getFixedReservations();
    if (!list || list.length === 0) return { hasConflict: false };

    const dateObj = new Date(dateKey + "T00:00:00");
    const dayOfWeek = dateObj.getDay(); // 0=일, 1=월, ...

    for (const fr of list) {
        if (!fr.isActive) continue;
        if (fr.building !== building || fr.room !== roomNum) continue;
        if (fr.dayOfWeek !== dayOfWeek) continue;

        const frStart = timeStrToMinutes(fr.startTime);
        const frEnd = timeStrToMinutes(fr.endTime);

        if (startMin < frEnd && endMin > frStart) {
            return { hasConflict: true, fixed: fr };
        }
    }

    return { hasConflict: false };
}

/**
 * 층별 정기 이용금지 목록 조회
 */
function getFloorProhibitions() {
    try {
        const raw = localStorage.getItem(FLOOR_PROHIBITIONS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 특정 날짜(요일) + 건물 + 층에 층별 정기 이용금지 충돌이 있는지 검사
 * @param {string} dateKey - 날짜 문자열 (YYYY-MM-DD)
 * @param {string} building - 건물명 ("신관", "종합관")
 * @param {string} floor - 층 코드 ("B1", "5F", "6F", "2F")
 * @param {number} startMin - 시작 분
 * @param {number} endMin - 종료 분
 * @returns {{ hasConflict: boolean, prohibition?: object }}
 */
function checkFloorProhibitionConflict(dateKey, building, floor, startMin, endMin) {
    const list = getFloorProhibitions();
    if (!list || list.length === 0) return { hasConflict: false };

    const dateObj = new Date(dateKey + "T00:00:00");
    const dayOfWeek = dateObj.getDay(); // 0=일, 1=월, ...

    for (const fp of list) {
        if (!fp.isActive) continue;
        if (fp.building !== building) continue;
        // 특정 층 또는 건물 전체 층("ALL") 매칭
        if (fp.floor !== "ALL" && fp.floor !== floor) continue;
        if (fp.dayOfWeek !== dayOfWeek) continue;

        const fpStart = timeStrToMinutes(fp.startTime);
        const fpEnd = timeStrToMinutes(fp.endTime);

        if (startMin < fpEnd && endMin > fpStart) {
            return { hasConflict: true, prohibition: fp };
        }
    }

    return { hasConflict: false };
}

// 기존에 생성되어 남아있던 시스템 샘플 더미 예약 자동 정리 (더 이상 자체 생성하지 않음)
function cleanupSampleReservations() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return;
        
        // 샘플 데이터 ID (CSU-1001-xx) 또는 더미 데이터 필터링
        const cleaned = list.filter(r => !r.id || !r.id.startsWith("CSU-1001-"));
        if (cleaned.length !== list.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
            if (typeof pushReservationsToCloud === "function") {
                pushReservationsToCloud(cleaned);
            }
        }
    } catch (e) {
        console.warn("샘플 예약 데이터 정리 중 오류:", e);
    }
}

function generateSampleData() {
    // 자체 샘플 예약 생성 중지 (빈 배열 반환)
    return [];
}

