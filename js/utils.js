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

/**
 * 텍스트 내 인터넷 주소(URL) 및 전화번호, 이메일을 감지하여
 * 클릭/터치 시 바로 연결되는 안전한 <a> 태그로 자동 변환 (Autolink)
 */
function linkifyText(text) {
    if (!text) return "";
    let safe = escapeHtml(text);

    const tokens = [];
    const makeToken = (html) => {
        const id = `___AUTOLINK_TOKEN_${tokens.length}___`;
        tokens.push({ id, html });
        return id;
    };

    // 1. URL 감지 (http://, https://, www.)
    const urlRegex = /(https?:\/\/[^\s<"'()]+|www\.[^\s<"'()]+)/gi;
    safe = safe.replace(urlRegex, (matched) => {
        let cleanUrl = matched;
        let suffix = "";
        const trailingPunct = /[.,;:!?)\]]+$/;
        const matchPunct = cleanUrl.match(trailingPunct);
        if (matchPunct) {
            suffix = matchPunct[0];
            cleanUrl = cleanUrl.slice(0, -suffix.length);
        }
        const href = cleanUrl.toLowerCase().startsWith("http") ? cleanUrl : `https://${cleanUrl}`;
        const tag = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="board-autolink link" title="새 창으로 링크 열기">${cleanUrl}</a>`;
        return makeToken(tag) + suffix;
    });

    // 2. 이메일 감지
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    safe = safe.replace(emailRegex, (matched) => {
        const tag = `<a href="mailto:${matched}" class="board-autolink email" title="이메일 보내기">${matched}</a>`;
        return makeToken(tag);
    });

    // 3. 한국 전화번호 감지 (010, 02, 031~064, 1588 등)
    const phoneRegex = /(01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}|02[-\s.]?\d{3,4}[-\s.]?\d{4}|0[3-6][1-5][-\s.]?\d{3,4}[-\s.]?\d{4}|1[5678]\d{2}[-\s.]?\d{4})/g;
    safe = safe.replace(phoneRegex, (matched) => {
        const cleanDigits = matched.replace(/[^0-9]/g, "");
        const tag = `<a href="tel:${cleanDigits}" class="board-autolink tel" title="전화 걸기 (${cleanDigits})">${matched}</a>`;
        return makeToken(tag);
    });

    // 4. 모든 토큰을 실제 HTML 태그로 복원
    tokens.forEach(t => {
        safe = safe.replace(t.id, t.html);
    });

    return safe;
}


