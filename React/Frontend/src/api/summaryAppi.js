// src/api/summaryAppi.js
const KEY = 'sb_checkout'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

const load = () => {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || null
    } catch {
        return null
    }
}
const save = (v) => localStorage.setItem(KEY, JSON.stringify(v))

// Normaliza el shape del resumen
const emptySummary = () => ({
    checkin: '',
    checkout: '',
    nights: 0,
    rooms: [],        // [{ id, name, qty, price }]
    totalRooms: 0,
    total: 0
})

const recalc = (sum) => {
    const totalRooms = sum.rooms.reduce((acc, r) => acc + (r.qty || 0), 0)
    const subtotal = sum.rooms.reduce((acc, r) => acc + (r.qty * r.price), 0)
    const total = subtotal * (sum.nights || 0)
    sum.totalRooms = totalRooms
    sum.total = total
    return sum
}

/** GET (read) */
export async function getSummary() {
    await delay(150)
    return load() || emptySummary()
}

/** POST/PUT (set fechas) */
export async function setDates({checkin, checkout, nights}) {
    await delay(150)
    const cur = load() || emptySummary()
    const next = recalc({...cur, checkin, checkout, nights})
    save(next)
    return next
}

/** PATCH (agregar/actualizar una habitación por id) */
export async function upsertRoom({id, name, price, qty}) {
    await delay(150)
    const cur = load() || emptySummary()

    // si qty=0 => eliminar del resumen
    let rooms = [...cur.rooms]
    const i = rooms.findIndex(r => r.id === id)

    if (!qty || qty <= 0) {
        if (i !== -1) rooms.splice(i, 1)
    } else if (i === -1) {
        rooms.push({id, name, price, qty})
    } else {
        rooms[i] = {...rooms[i], qty, price, name}
    }

    const next = recalc({...cur, rooms})
    save(next)
    return next
}

/** DELETE (limpiar resumen) */
export async function clearSummary() {
    await delay(150)
    save(emptySummary())
    return {ok: true}
}

/** Utilidad: recalcular y persistir (por si necesitás) */
export async function finalize() {
    await delay(100)
    const cur = load() || emptySummary()
    const next = recalc(cur)
    save(next)
    return next
}
