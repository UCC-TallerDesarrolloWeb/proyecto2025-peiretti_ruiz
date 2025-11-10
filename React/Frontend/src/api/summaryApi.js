// src/api/summaryApi.js
const BASE_URL = "http://localhost:4000/summary";

const emptySummary = () => ({
  id: 1,
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

/** GET - Obtener el resumen actual */
export async function getSummary() {
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) {
      console.error('Error al obtener summary:', res.status);
      return emptySummary();
    }
    const data = await res.json();
    return recalc({ ...emptySummary(), ...data });
  } catch (e) {
    console.error('Error en getSummary:', e);
    return emptySummary();
  }
}

/** PUT/PATCH - Actualizar el resumen */
async function updateSummary(data) {
  try {
    // Usar PATCH para actualizar solo los campos enviados
    const res = await fetch(BASE_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      throw new Error(`Failed to update summary: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('Error en updateSummary:', error);
    throw error;
  }
}

/** Establecer fechas del resumen */
export async function setDates({ checkin, checkout, nights }) {
  try {
    const current = await getSummary();
    const updated = recalc({ ...current, checkin, checkout, nights });
    return await updateSummary(updated);
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
      // Eliminar habitación si cantidad es 0
      if (i !== -1) rooms.splice(i, 1);
    } else if (i === -1) {
      // Agregar nueva habitación
      rooms.push({ id, name, price, qty });
    } else {
      // Actualizar habitación existente
      rooms[i] = { id, name, price, qty };
    }

    const updated = recalc({ ...current, rooms });
    return await updateSummary(updated);
  } catch (e) {
    console.error('Error en upsertRoom:', e);
    throw e;
  }
}

/** Sincronizar todas las habitaciones de una vez */
export async function syncAllRooms(roomsData) {
  try {
    const current = await getSummary();
    const updated = recalc({ ...current, rooms: roomsData });
    return await updateSummary(updated);
  } catch (e) {
    console.error('Error en syncAllRooms:', e);
    throw e;
  }
}

/** Finalizar y recalcular el resumen */
export async function finalize() {
  try {
    const current = await getSummary();
    const finalized = recalc(current);
    return await updateSummary(finalized);
  } catch (error) {
    console.error("Error in finalize:", error);
    throw error;
  }
}

/** Limpiar el resumen */
export async function clearSummary() {
  try {
    const empty = emptySummary();
    await updateSummary(empty);
    return true;
  } catch (error) {
    console.error("Error in clearSummary:", error);
    throw error;
  }
}