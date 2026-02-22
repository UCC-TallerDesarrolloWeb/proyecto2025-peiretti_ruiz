const BASE_URL = "http://localhost:4000/summary/1"; // URL base del endpoint en json-server
// BASE_URL siempre apunta al mismo objeto con el id 1

// Recalcula totalRooms y total localmente sin depender del servidor
const recalc = (sum) => {
    const safeRooms = Array.isArray(sum.rooms) ? sum.rooms : [];
    // si sum.rooms no es un array (undefined, null) usa array vacío

    const totalRooms = safeRooms.reduce((acc, r) => acc + (+r.qty || 0), 0);
    // reduce recorre el array acumulando valores
    // +r.qty → convierte qty a número por si viene como string
    // resultado: suma de todas las cantidades de habitaciones
    // r=rooms, acc=acumulador, acc inicia en 0

    const subtotal = safeRooms.reduce((acc, r) => acc + ((+r.qty || 0) * (+r.price || 0)), 0);
    // subtotal = suma de (qty × precio) de cada habitación
    // sin multiplicar por noches todavía

    const total = subtotal * (+sum.nights || 0);
    // total final = subtotal × noches

    return {...sum, totalRooms, total};
    // devuelve el objeto original con totalRooms y total recalculados
};

// Lee el resumen actual desde json-server
// Lo usa Booking al montar (restaurar datos previos) y Payment al montar
export async function getSummary() {
    const res = await fetch(BASE_URL);
    let data = await res.json();
    return recalc(data); // siempre recalcula antes de devolver
}

// Actualiza solo las fechas y las noches, no toca las habitaciones
export async function setDates({checkin, checkout, nights}) {
    const res = await fetch(BASE_URL, {
        method: 'PATCH',
        // PATCH → modifica solo los campos que se le pasan, no reemplaza todo el objeto
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({checkin, checkout, nights})
        // solo manda estos tres campos, el resto queda igual en el servidor
    });
    return res.json();
}

// Reemplaza el array de habitaciones completo
// Se llama desde Booking cuando el usuario hace click en Continue
export async function syncAllRooms(roomsData) {
    const res = await fetch(BASE_URL, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({rooms: roomsData})
        // roomsData → array con solo las habitaciones que tienen qty > 0
    });
    return res.json();
}

// Lee el resumen actual, recalcula los totales y hace un PUT completo
// Se llama como último paso antes de navegar a Payment
export async function finalize() {
    const summary = await getSummary();
    const res = await fetch(BASE_URL, {
        method: 'PUT', // reemplaza todo el objeto en el servidor con los datos que le mando
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            id: 1,
            checkin: summary.checkin,
            checkout: summary.checkout,
            nights: summary.nights,
            rooms: summary.rooms,
            totalRooms: summary.totalRooms,
            total: summary.total
        })
    });
    return res.json();
}

// Resetea el resumen a valores vacíos después de un pago exitoso
// Deja el objeto en json-server listo para una nueva reserva (vacio)
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