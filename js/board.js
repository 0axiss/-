/**
 * CSU Room Reservation - Communication Board Module (Notice & Inquiry)
 */

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
            visibility: "public",
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
            visibility: "staff",
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
                <span>학과 관리실 공식 공지사항</span>
            `;
        }
        if (btnWrite) btnWrite.style.display = "none";
    } else {
        if (btnNotice) btnNotice.classList.remove("active");
        if (btnInquiry) btnInquiry.classList.add("active");
        if (subInfo) {
            subInfo.innerHTML = `
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

    const filtered = allPosts.filter(p => p.category === currentBoardCategory);

    filtered.sort((a, b) => {
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:40px 20px; text-align:center;">
                <h4 style="font-size:15px; color:var(--gray-800); margin-bottom:4px;">등록된 ${currentBoardCategory === 'notice' ? '공지사항이' : '문의글이'} 없습니다</h4>
                <p style="font-size:13px; color:var(--gray-500);">${currentBoardCategory === 'notice' ? '새로운 공지사항이 등록되면 이곳에 표시됩니다.' : '궁금한 점이 있다면 [문의글 작성] 버튼을 눌러 남겨주세요.'}</p>
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
            if (post.isImportant) badgesHtml += `<span class="bpc-badge badge-important">중요</span>`;
        } else {
            if (isSecret) {
                badgesHtml += `<span class="bpc-badge badge-secret">관계자 공개</span>`;
            } else {
                badgesHtml += `<span class="bpc-badge badge-public">전체 공개</span>`;
            }

            if (isAnswered) {
                badgesHtml += `<span class="bpc-badge badge-answered">답변 완료</span>`;
            } else {
                badgesHtml += `<span class="bpc-badge badge-waiting">답변 대기</span>`;
            }
        }

        const dateStr = post.createdAt ? post.createdAt.slice(0, 10).replace(/-/g, '.') : '';
        const titleHtml = escapeHtml(post.title);

        let snippetText = "";
        if (isSecret) {
            snippetText = "관계자 공개 글입니다.";
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
                    ${post.category === "inquiry" ? `<button type="button" class="btn-card-delete" onclick="event.stopPropagation(); deleteStudentInquiry('${post.id}')">삭제</button>` : ''}
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
    if (post.category === "notice" || post.visibility === "public") {
        openBoardDetailModal(post);
        return;
    }

    const mySavedSid = localStorage.getItem(LAST_SEARCH_KEY) || "";
    if (mySavedSid && mySavedSid === post.authorId) {
        openBoardDetailModal(post);
        return;
    }

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
        ? (post.isImportant ? "중요 공지사항" : "일반 공지사항")
        : (post.visibility === "staff" ? "관계자 공개" : "전체 공개");

    document.getElementById("post-detail-title").textContent = post.title;

    const metaBox = document.getElementById("post-detail-meta");
    const dateStr = post.createdAt ? post.createdAt.slice(0, 10).replace(/-/g, '.') : '';
    metaBox.innerHTML = `
        <span><strong>작성자:</strong> ${escapeHtml(post.authorName)} ${post.authorId && post.authorId !== 'admin' ? `(${escapeHtml(post.authorId)})` : ''}</span>
        <span><strong>등록일:</strong> ${dateStr}</span>
    `;

    document.getElementById("post-detail-body").innerHTML = typeof linkifyText === "function"
        ? linkifyText(post.content)
        : escapeHtml(post.content);

    const answerBox = document.getElementById("post-answer-box");
    if (post.category === "inquiry") {
        if (post.answer) {
            answerBox.style.display = "block";
            const aDate = post.answer.createdAt ? post.answer.createdAt.slice(0, 10).replace(/-/g, '.') : '';
            document.getElementById("post-answer-date").textContent = `${escapeHtml(post.answer.author || '관리실')} · ${aDate}`;
            document.getElementById("post-answer-content").innerHTML = typeof linkifyText === "function"
                ? linkifyText(post.answer.content)
                : escapeHtml(post.answer.content);
        } else {
            answerBox.style.display = "block";
            document.getElementById("post-answer-date").textContent = "접수 완료";
            document.getElementById("post-answer-content").textContent = "관리자가 내용을 확인 중입니다. 빠른 시일 내에 답변드리겠습니다.";
        }
    } else {
        answerBox.style.display = "none";
    }

    const footer = document.getElementById("board-detail-footer");
    if (footer) {
        if (post.category === "inquiry") {
            footer.innerHTML = `
                <button type="button" class="btn-post-delete" onclick="deleteStudentInquiry('${post.id}')">
                    <span>글 삭제</span>
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

function deleteStudentInquiry(postId) {
    const allPosts = getAllBoardPosts();
    const target = allPosts.find(p => p.id === postId);
    if (!target) {
        showToast("삭제할 문의글을 찾을 수 없습니다.", "error");
        return;
    }

    const savedSid = localStorage.getItem(LAST_SEARCH_KEY) || "";
    if (savedSid && savedSid === target.authorId) {
        // 본인 확인 완료
    } else {
        const inputSid = prompt("작성자 본인 확인을 위해 작성 시 입력한 학번을 입력해주세요:");
        if (!inputSid) return;
        if (inputSid.trim() !== target.authorId) {
            alert("학번이 일치하지 않습니다. 본인이 작성한 글만 삭제할 수 있습니다.");
            return;
        }
    }

    let confirmMsg = `[${target.title}]\n문의글을 정말 삭제하시겠습니까?`;
    if (target.answer) {
        confirmMsg = `이미 관리자 답변이 완료된 문의글입니다.\n정말 삭제하시겠습니까? (삭제 시 복구 불가)`;
    }

    if (!confirm(confirmMsg)) return;

    const remaining = allPosts.filter(p => p.id !== postId);
    saveAllBoardPosts(remaining);

    closeBoardDetailModal();
    renderBoardList();
    showToast("문의글이 삭제되었습니다.", "success");
}

function openInquiryModal() {
    const modal = document.getElementById("inquiry-modal");
    if (!modal) return;

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

    const radios = document.getElementsByName("inquiry-visibility");
    let visibility = "staff";
    radios.forEach(r => {
        if (r.checked) visibility = r.value;
    });

    const newPost = {
        id: "INQUIRY-" + Date.now() + "-" + Math.floor(Math.random() * 900 + 100),
        category: "inquiry",
        title: title,
        content: content,
        authorName: name,
        authorId: sid,
        visibility: visibility,
        isImportant: false,
        createdAt: new Date().toISOString(),
        answer: null
    };

    const posts = getAllBoardPosts();
    posts.unshift(newPost);
    saveAllBoardPosts(posts);

    localStorage.setItem(LAST_SEARCH_KEY, sid);

    showToast("문의글이 성공적으로 등록되었습니다.", "success");
    closeInquiryModal();

    titleInput.value = "";
    contentInput.value = "";

    switchBoardCategory("inquiry");
}

