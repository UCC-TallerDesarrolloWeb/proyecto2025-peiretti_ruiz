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
