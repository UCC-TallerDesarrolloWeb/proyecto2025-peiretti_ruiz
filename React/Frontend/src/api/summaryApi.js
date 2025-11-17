// src/api/summaryApi.js
const BASE_URL = "http://localhost:4000/summary";

const recalc = (sum) => {
    const safeRooms = Array.isArray(sum.rooms) ? sum.rooms : [];
    const totalRooms = safeRooms.reduce((acc, r) => acc + (+r.qty || 0), 0);
    const subtotal = safeRooms.reduce((acc, r) => acc + ((+r.qty || 0) * (+r.price || 0)), 0);
    const total = subtotal * (+sum.nights || 0);
    return {...sum, totalRooms, total};
};

export async function getSummary() {
    const res = await fetch(BASE_URL);
    let data = await res.json();
    return recalc(data);
}

export async function setDates({checkin, checkout, nights}) {
    const res = await fetch(BASE_URL, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({checkin, checkout, nights})
    });
    return res.json();
}

export async function syncAllRooms(roomsData) {
    const res = await fetch(BASE_URL, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({rooms: roomsData})
    });
    return res.json();
}

export async function finalize() {
    // Recalcula el total antes de finalizar
    const summary = await getSummary();
    const res = await fetch(BASE_URL, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(summary)
    });
    return res.json();
}

export async function clearSummary() {
    const res = await fetch(BASE_URL, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            checkin: "",
            checkout: "",
            nights: 0,
            rooms: [],
            totalRooms: 0,
            total: 0
        })
    });
    return res.json();
}