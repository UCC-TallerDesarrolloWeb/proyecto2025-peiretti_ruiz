// src/api/summaryApi.js
const BASE_URL = "http://localhost:4000/summary";

const recalc = (sum) => {
  const safeRooms = Array.isArray(sum.rooms) ? sum.rooms : [];
  const totalRooms = safeRooms.reduce((acc, r) => acc + (+r.qty || 0), 0);
  const subtotal = safeRooms.reduce((acc, r) => acc + ((+r.qty || 0) * (+r.price || 0)), 0);
  const total = subtotal * (+sum.nights || 0);
  return { ...sum, totalRooms, total };
};

export async function getSummary() {
  const res = await fetch(BASE_URL);
  let data = await res.json();
  return recalc(data);
}

export async function setDates({ checkin, checkout, nights }) {
  const current = await getSummary();
  const updated = recalc({ ...current, checkin, checkout, nights });
  const res = await fetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated),
  });
  return await res.json();
}

export async function syncAllRooms(roomsData) {
  const current = await getSummary();
  const updated = recalc({ ...current, rooms: roomsData });
  const res = await fetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated),
  });
  return await res.json();
}

export async function finalize() {
  const current = await getSummary();
  const finalized = recalc(current);
  const res = await fetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(finalized),
  });
  return await res.json();
}

export async function clearSummary() {
  const empty = { id: 1, checkin: '', checkout: '', nights: 0, rooms: [], totalRooms: 0, total: 0 };
  const res = await fetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(empty),
  });
  return await res.json();
}