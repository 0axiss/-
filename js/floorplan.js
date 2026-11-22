/**
 * CSU Room Reservation - Floor Plan (연습실 약도) Module
 * 약도 이미지가 준비된 층은 image 경로를 채우면 자동으로 표시됩니다. (image: "" → 준비 중)
 */

const FLOOR_PLANS = {
    "신관": [
        { floor: "B1", label: "지하 1층", image: "images/floorplan-new-B1.jpg" },
        { floor: "5F", label: "5층", image: "" },
        { floor: "6F", label: "6층", image: "" }
    ],
    "종합관": [
        { floor: "2F", label: "2층", image: "" }
    ]
};

let floorplanBuilding = "신관";
let floorplanFloor = "B1";
let floorplanZoom = 1;

function openFloorplanScreen() {
    navTo("floorplan-screen");
}

function renderFloorplanScreen() {
    const bTabs = document.getElementById("fp-building-tabs");
    const fTabs = document.getElementById("fp-floor-tabs");
    const view = document.getElementById("fp-view");
    if (!bTabs || !fTabs || !view) return;

    bTabs.innerHTML = "";
    Object.keys(FLOOR_PLANS).forEach(name => {
        const btn = document.createElement("button");
        btn.className = `floor-tab-btn ${name === floorplanBuilding ? "active" : ""}`;
        btn.textContent = name;
        btn.onclick = () => {
            floorplanBuilding = name;
            const first = FLOOR_PLANS[name].find(p => p.image) || FLOOR_PLANS[name][0];
            floorplanFloor = first.floor;
            floorplanZoom = 1;
            renderFloorplanScreen();
        };
        bTabs.appendChild(btn);
    });

    fTabs.innerHTML = "";
    FLOOR_PLANS[floorplanBuilding].forEach(p => {
        const btn = document.createElement("button");
        btn.className = `floor-tab-btn ${p.floor === floorplanFloor ? "active" : ""}`;
        btn.textContent = p.label;
        btn.onclick = () => {
            floorplanFloor = p.floor;
            floorplanZoom = 1;
            renderFloorplanScreen();
        };
        fTabs.appendChild(btn);
    });

    const plan = FLOOR_PLANS[floorplanBuilding].find(p => p.floor === floorplanFloor);
    if (plan && plan.image) {
        view.innerHTML = `
            <div class="fp-zoom-bar">
                <button type="button" class="fp-zoom-btn" onclick="changeFloorplanZoom(-0.5)" aria-label="축소">−</button>
                <span class="fp-zoom-label" id="fp-zoom-label">100%</span>
                <button type="button" class="fp-zoom-btn" onclick="changeFloorplanZoom(0.5)" aria-label="확대">+</button>
                <button type="button" class="fp-zoom-btn reset" onclick="changeFloorplanZoom(0)">원래대로</button>
            </div>
            <div class="fp-image-scroll">
                <img id="fp-image" src="${plan.image}" alt="${floorplanBuilding} ${plan.label} 연습실 약도" style="width:100%;">
            </div>
            <p class="fp-hint">확대 후 화면을 밀어서 이동할 수 있습니다.</p>
        `;
        floorplanZoom = 1;
    } else {
        view.innerHTML = `
            <div class="fp-empty">
                <strong>${floorplanBuilding} ${plan ? plan.label : ""} 약도는 준비 중입니다.</strong>
                <span>곧 추가될 예정입니다.</span>
            </div>
        `;
    }
}

function changeFloorplanZoom(delta) {
    const img = document.getElementById("fp-image");
    const label = document.getElementById("fp-zoom-label");
    if (!img) return;

    floorplanZoom = delta === 0 ? 1 : Math.min(3, Math.max(1, floorplanZoom + delta));
    img.style.width = `${floorplanZoom * 100}%`;
    if (label) label.textContent = `${Math.round(floorplanZoom * 100)}%`;
}
