/**
 * CSU Room Reservation - Master Data & Constants Module
 */

const BUILDINGS = {
    "신관": {
        name: "신관",
        subtitle: "지하 1층 · 5층 · 6층 교회음악과 연습실",
        floors: [
            {
                name: "B1",
                title: "지하 1층",
                rooms: [
                    { number: "B06", type: "유교", category: "normal" },
                    { number: "B07", type: "유교", category: "normal" },
                    { number: "B08", type: "유교", category: "normal" },
                    { number: "B09", type: "유교", category: "normal" },
                    { number: "B10", type: "유교", category: "normal" },
                    { number: "B11", type: "유교", category: "normal" },
                    { number: "B12", type: "교음(오르간)", category: "organ" },
                    { number: "B13", type: "교음(오르간)", category: "organ" },
                    { number: "B14", type: "아동", category: "normal" },
                    { number: "B15", type: "교음", category: "normal" },
                    { number: "B16", type: "교음", category: "normal" },
                    { number: "B17", type: "교음", category: "normal" },
                    { number: "B18", type: "교음(그랜드)", category: "grand" }
                ]
            },
            {
                name: "5F",
                title: "5층",
                rooms: [
                    { number: "507", type: "교음", category: "normal" },
                    { number: "508", type: "교음", category: "normal" },
                    { number: "509", type: "교음", category: "normal" },
                    { number: "510", type: "교음", category: "normal" }
                ]
            },
            {
                name: "6F",
                title: "6층",
                rooms: [
                    { number: "611", type: "교음", category: "normal" },
                    { number: "612", type: "성악학회실", category: "society" },
                    { number: "613", type: "오르간학회실", category: "society" },
                    { number: "614", type: "관현악학회실", category: "society" },
                    { number: "615", type: "작곡학회실", category: "society" },
                    { number: "616", type: "피아노학회실", category: "society" },
                    { number: "617", type: "교음(오르간)", category: "organ" },
                    { number: "618", type: "교음(오르간)", category: "organ" },
                    { number: "619", type: "교음(오르간)", category: "organ" },
                    { number: "620", type: "교음(오르간)", category: "organ" },
                    { number: "621", type: "교음(오르간)", category: "organ" },
                    { number: "622", type: "교음(그랜드)", category: "grand" },
                    { number: "623", type: "교음", category: "normal" },
                    { number: "624", type: "교음", category: "normal" },
                    { number: "625", type: "교음", category: "normal" },
                    { number: "626", type: "교음", category: "normal" }
                ]
            }
        ]
    },
    "종합관": {
        name: "종합관",
        subtitle: "2층 1호 ~ 12호 교회음악과 연습실",
        floors: [
            {
                name: "2F",
                title: "2층",
                rooms: [
                    { number: "1", type: "업라이트", category: "normal" },
                    { number: "2", type: "피아노", category: "normal" },
                    { number: "3", type: "그랜드", category: "grand" },
                    { number: "4", type: "그랜드", category: "grand" },
                    { number: "5", type: "업라이트 2", category: "normal" },
                    { number: "6", type: "그랜드", category: "grand" },
                    { number: "7", type: "업라이트", category: "normal" },
                    { number: "8", type: "그랜드", category: "grand" },
                    { number: "9", type: "그랜드", category: "grand" },
                    { number: "10", type: "그랜드", category: "grand" },
                    { number: "11", type: "피아노", category: "normal" },
                    { number: "12", type: "업라이트·오르간", category: "organ" }
                ]
            }
        ]
    }
};

const OPERATING_START_HOUR = 9;   // 09:00
const OPERATING_END_HOUR = 22;    // 22:00
const TOTAL_SLOTS = 26;

// 정확한 26개 타임테이블 슬롯 (11:00~11:40, 11:40~12:00 채플 시간표 반영)
const TIME_SLOT_DEFS = [
    { start: "09:00", end: "09:30", hour: 9 },
    { start: "09:30", end: "10:00", hour: 9 },
    { start: "10:00", end: "10:30", hour: 10 },
    { start: "10:30", end: "11:00", hour: 10 },
    { start: "11:00", end: "11:40", hour: 11 },
    { start: "11:40", end: "12:00", hour: 11 },
    { start: "12:00", end: "12:30", hour: 12 },
    { start: "12:30", end: "13:00", hour: 12 },
    { start: "13:00", end: "13:30", hour: 13 },
    { start: "13:30", end: "14:00", hour: 13 },
    { start: "14:00", end: "14:30", hour: 14 },
    { start: "14:30", end: "15:00", hour: 14 },
    { start: "15:00", end: "15:30", hour: 15 },
    { start: "15:30", end: "16:00", hour: 15 },
    { start: "16:00", end: "16:30", hour: 16 },
    { start: "16:30", end: "17:00", hour: 16 },
    { start: "17:00", end: "17:30", hour: 17 },
    { start: "17:30", end: "18:00", hour: 17 },
    { start: "18:00", end: "18:30", hour: 18 },
    { start: "18:30", end: "19:00", hour: 18 },
    { start: "19:00", end: "19:30", hour: 19 },
    { start: "19:30", end: "20:00", hour: 19 },
    { start: "20:00", end: "20:30", hour: 20 },
    { start: "20:30", end: "21:00", hour: 20 },
    { start: "21:00", end: "21:30", hour: 21 },
    { start: "21:30", end: "22:00", hour: 21 }
];

const TIME_SLOTS = TIME_SLOT_DEFS.map((def, idx) => {
    const sMins = timeStrToMinutes(def.start);
    const eMins = timeStrToMinutes(def.end);
    return {
        index: idx,
        hour: def.hour,
        startMinutes: sMins,
        endMinutes: eMins,
        startStr: def.start,
        endStr: def.end,
        duration: eMins - sMins,
        label: `${def.start} ~ ${def.end}`
    };
});

// 스토리지 키 정의
const STORAGE_KEY = "CHONGSHIN_MUSIC_RESERVATIONS_V2";
const LAST_SEARCH_KEY = "CHONGSHIN_LAST_STUDENT_ID";
const ROOM_SETTINGS_KEY = "CHONGSHIN_ROOM_SETTINGS";
const POLICIES_KEY = "CHONGSHIN_BOOKING_POLICIES";
const BOARD_STORAGE_KEY = "CHONGSHIN_MUSIC_BOARD_POSTS_V1";
const FIXED_RESERVATIONS_KEY = "CHONGSHIN_FIXED_RESERVATIONS";

