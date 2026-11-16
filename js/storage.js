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
            floor: "5F",
            room: "507",
            roomType: "교음",
            date: formatDateKey(new Date()),
            startTime: "14:00",
            endTime: "16:00",
            startMin: 840,
            endMin: 960,
            name: "김하늘",
            studentId: "20231022",
            phone: "010-4444-6666",
            status: "confirmed",
            createdAt: new Date().toISOString()
        },
        {
            id: "CSU-1001-03",
            building: "신관",
            floor: "6F",
            room: "622",
            roomType: "교음(그랜드)",
            date: formatDateKey(new Date()),
            startTime: "16:30",
            endTime: "18:00",
            startMin: 990,
            endMin: 1080,
            name: "박은혜",
            studentId: "20221033",
            phone: "010-7777-8888",
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
            startTime: "13:00",
            endTime: "15:00",
            startMin: 780,
            endMin: 900,
            name: "최다윗",
            studentId: "20241044",
            phone: "010-9999-1111",
            status: "confirmed",
            createdAt: new Date().toISOString()
        }
    ];

    saveAllReservations(sampleList);
    return sampleList;
}

