// src/api/summaryApi.js
const BASE_URL = "http://localhost:4000/summary";
const FIXED_ID = 1;

const emptySummary = () => ({
  id: FIXED_ID,
  checkin: '',
  checkout: '',
  nights: 0,
  rooms: [],
  totalRooms: 0,
  total: 0,
});

const recalc = (sum) => {
  const safeRooms = Array.isArray(sum.rooms) ? sum.rooms : [];
  const totalRooms = safeRooms.reduce((acc, r) => acc + (+r.qty || 0), 0);
  const subtotal = safeRooms.reduce((acc, r) => acc + ((+r.qty || 0) * (+r.price || 0)), 0);
  const total = subtotal * (+sum.nights || 0);
  return { ...sum, totalRooms, total };
};

/** GET - Obtener el resumen actual (id=1 fijo) */
export async function getSummary() {
  try {
    const res = await fetch(`${BASE_URL}/1`);
    if (!res.ok) {
      if (res.status === 404) return { id: 1, checkin:'', checkout:'', nights:0, rooms:[], totalRooms:0, total:0 };
      throw new Error('getSummary failed');
    }
    const data = await res.json();
    // recalcular por las dudas
    return recalc({ id: 1, checkin:'', checkout:'', nights:0, rooms:[], totalRooms:0, total:0, ...data });
  } catch (e) {
    console.error('Error en getSummary:', e);
    return { id: 1, checkin:'', checkout:'', nights:0, rooms:[], totalRooms:0, total:0 };
  }
}


/** UPSERT completo sobre /summary/1 */
async function upsertSummary(partial) {
  const current = await getSummary();
  const merged = recalc({ ...current, ...partial, id: FIXED_ID });

  // PUT garantiza crear o reemplazar el recurso /1
  const res = await fetch(`${BASE_URL}/${FIXED_ID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(merged),
  });
  if (!res.ok) throw new Error("Error al guardar el resumen");
  return res.json();
}

/** Establecer fechas del resumen */
export async function setDates({ checkin, checkout, nights }) {
  try {
    const current = await getSummary();
    const updated = recalc({ ...current, checkin, checkout, nights });
    return await saveFixed(updated);
  } catch (e) {
    console.error('Error en setDates:', e);
    throw e;
  }
}

/** Agregar/actualizar una habitación por id */
export async function upsertRoom({ id, name, price, qty }) {
  try {
    const current = await getSummary();
    const rooms = Array.isArray(current.rooms) ? [...current.rooms] : [];
    const i = rooms.findIndex(r => r.id === id);

    if (!qty || qty <= 0) {
      if (i !== -1) rooms.splice(i, 1);
    } else if (i === -1) {
      rooms.push({ id, name, price, qty });
    } else {
      rooms[i] = { ...rooms[i], name, price, qty };
    }

    const updated = recalc({ ...current, rooms });
    return await saveFixed(updated);
  } catch (e) {
    console.error('Error en upsertRoom:', e);
    throw e;
  }
}


/** Finalizar y recalcular el resumen */
export async function finalize() {
  try {
    const current = await getSummary();
    return await upsertSummary(current);
  } catch (error) {
    console.error("Error in finalize:", error);
    throw error;
  }
}

/** Limpiar el resumen */
export async function clearSummary() {
  try {
    // con PUT recreamos vacío sobre /1 y evitamos 404s a futuro
    await fetch(`${BASE_URL}/${FIXED_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emptySummary()),
    });
    return true;
  } catch (error) {
    console.error("Error in clearSummary:", error);
    throw error;
  }
}




// helper común para crear/actualizar SIEMPRE el id=1
async function saveFixed(summary) {
  const body = JSON.stringify({ id: 1, ...summary });

  // Intentá PUT /summary/1 (update)
  let res = await fetch(`${BASE_URL}/1`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  // Si no existe aún => 404 => crear con POST /summary (con id:1)
  if (res.status === 404) {
    res = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  if (!res.ok) throw new Error('saveFixed failed');
  return res.json();
}
