/**
 * CSU Room Reservation - Utility Functions Module
 */

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

let toastTimer = null;
function showToast(msg, type = "normal") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = msg;
    toast.className = `app-toast show ${type}`;

    // 스크린 리더(TalkBack/VoiceOver) 실시간 음성 전달
    announceA11y(msg);

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.className = "app-toast";
    }, 2800);
}

// 스크린 리더 전용 실시간 음성 안내 낭독 헬퍼
function announceA11y(msg) {
    if (!msg) return;
    const announcer = document.getElementById("a11y-announcer");
    if (announcer) {
        announcer.textContent = "";
        setTimeout(() => {
            announcer.textContent = msg;
        }, 50);
    }
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

function maskName(name) {
    if (!name) return "학생";
    if (name.length <= 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

