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
                dailyOpenHour: parsed.dailyOpenHour !== undefined ? Number(parsed.dailyOpenHour) : 5
            };
        }
    } catch (e) {}
    return {
        maxDurationHours: 2,
        maxDailyBookingsPerUser: 2,
        bookingAdvanceDays: 0,
        cancelDeadlineMinutes: 30,
        dailyOpenHour: 5
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
