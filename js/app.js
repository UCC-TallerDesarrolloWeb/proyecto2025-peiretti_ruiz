/**
 * ============================
 * Santorini Blue - Booking JS
 * ============================
 * Un solo archivo JS para todas las páginas.
 * Cada sección arranca buscando un elemento clave de su página,
 * y si no lo encuentra, no hace nada (if (!f) return).
 */

const formatPrice = n =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(+n || 0);
// Intl.NumberFormat: API del navegador para formatear números según región.
// "en-US" + currency: convierte 200 → "$200.00"
// +n convierte string a número. || 0 evita NaN si n es undefined

const parseISODate = v => (v ? new Date(v + "T00:00:00") : null);
// Convierte "2025-12-01" (string del input date) a un objeto Date de JS.
// Le agrega T00:00:00 para forzar que sea medianoche hora local.

const calcNights = (inD, outD) => (!inD || !outD ? 0 : Math.max(0, (outD - inD) / 86400000));
// Resta dos fechas. En JS, restar Dates da milisegundos.
// 86400000 = milisegundos en un día (1000ms * 60s * 60min * 24h)
// Math.max(0, ...) evita números negativos si las fechas están al revés

const pluralize = (n, s, p = s + "s") => `${n} ${n === 1 ? s : p}`;
// Pluraliza palabras automáticamente. pluralize(1, "night") → "1 night", pluralize(3, "night") → "3 nights"

const isLetterOrSpace = ch => ch === " " || ch.toLowerCase() !== ch.toUpperCase();
// Detecta si un carácter es letra o espacio. (minusculas<>mayusculas)

const keepLetters = s => [...(s || "")].filter(isLetterOrSpace).join("");
// Se usa en los inputs de nombre: cada vez que el usuario escribe, se filtran los caracteres no permitidos.

const isLetters = s => s.trim().length > 0 && [...s.trim()].every(isLetterOrSpace);
// Valida que un string no esté vacío y que TODOS sus caracteres sean letras/espacios.
// Se usa al hacer submit para validar nombres.

const isDigit = ch => ch >= "0" && ch <= "9";
// Compara caracteres por su código ASCII. "0" a "9" son dígitos.

const keepDigits = s => [...(s || "")].filter(isDigit).join("");
// Igual que keepLetters pero solo deja pasar dígitos 0-9.

const isDigits = s => s.length > 0 && [...s].every(isDigit);
// Valida que todos los caracteres sean dígitos.

const isEmailBasic = s => {
    const t = (s || "").trim();
    const at = t.indexOf("@");         // posición del @
    const dot = t.lastIndexOf(".");    // posición del último punto
    return at > 0 && dot > at + 1 && dot < t.length - 1;
    // at > 0: hay algo antes del @
    // dot > at + 1: hay algo entre @ y el punto
    // dot < t.length - 1: hay algo después del punto
};

const isExpiryMMYY = s => {
    const t = (s || "").trim();
    if (t.length !== 5 || t[2] !== "/") return false;
    // Debe ser exactamente "MM/YY" → 5 caracteres con / en el medio
    const mm = t.slice(0, 2), yy = t.slice(3);
    // slice(0,2) → "12", slice(3) (desde 3 al final) → "26", si fuera 12/26
    if (!isDigits(mm) || !isDigits(yy)) return false;
    const m = Number(mm);
    return m >= 1 && m <= 12; // Mes válido entre 01 y 12
};

const bindModalHandlers = (overlay) => {
    if (!overlay || overlay.dataset.bound) return;
    // overlay.dataset.bound: si ya se le asignaron los listeners, no los repite.
    // Evita que al abrir el modal muchas veces se acumulen listeners duplicados.

    const hide = () => {
        overlay.style.display = "none";
        overlay.setAttribute("aria-hidden", "true"); // lo oculta para lectores de pantalla
        document.body.style.overflow = "";           // restaura el scroll del body
    };

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) hide();
        // Cierra el modal si el usuario hace click en el fondo oscuro (el backdrop), pero NO si hace click dentro del .modal en sí.
    });

    overlay.querySelector(".modal-close")?.addEventListener("click", hide); // para cerrar modal de la x

    overlay.querySelector("#modal-ok")?.addEventListener("click", hide); // para cerrar modal del OK

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay.style.display === "grid") hide();
        // Cierra el modal al presionar Escape, pero solo si el modal está visible.
    });

    overlay.dataset.bound = "1"; // Marca que los listeners ya fueron asignados
};

const ensureModal = () => {
    const overlay = document.getElementById("app-modal");
    bindModalHandlers(overlay);
    return overlay;
};
// busca el modal en el HTML, le agrega los listeners y lo devuelve

const showModal = (msg, t = "Error") => {
    // t = "Error" es el valor por defecto del título 
    const o = ensureModal();
    o.querySelector("#modal-title").textContent = t;
    o.querySelector("#modal-msg").innerHTML = Array.isArray(msg)
        ? `<ul class="modal-list">${msg.map(m => `<li>${m}</li>`).join("")}</ul>`
        : String(msg);
    // Si msg es un array, genera una lista HTML. Si es string, lo muestra directo (en el proyecto simepre son strings)
    o.style.display = "grid";          // lo hace visible 
    o.removeAttribute("aria-hidden");  // lo hace accesible para lectores de pantalla
    document.body.style.overflow = "hidden"; // bloquea el scroll del fondo mientras el modal está abierto
};

const showErrorAndClear = (el, msg) => {
    if (!el) return showModal(msg); // si no hay elemento, solo muestra el modal
    el.value = "";       // limpia el input con error
    el.focus();          // pone el cursor en ese input
    el.classList.add("is-error"); // agrega borde rojo 
    el.addEventListener("input", () => el.classList.remove("is-error"), { once: true });
    // En cuanto el usuario empieza a escribir, el borde rojo desaparece.
    showModal(msg);
};

const validateDates = (inEl, outEl) => {
    const inD = parseISODate(inEl.value);
    const outD = parseISODate(outEl.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // resetea a medianoche para comparar solo fechas, no horas

    if (!inD || !outD) return showErrorAndClear(outEl, "Complete Check-in and Check-out.");
    if (inD < today) return showErrorAndClear(inEl, "The check-in date cannot be earlier than today.");
    if (outD <= inD) return showErrorAndClear(outEl, "The check-out date must be after the check-in date.");
    return true; 
};

const validateRoomQty = i => {
    const n = +i.value || 0; // +i.value convierte string a número
    if (n < 0 || n > 9) {
        showErrorAndClear(i, "Invalid amount (0–9).");
        return 0;
    }
    return n;
};

// BOOKING 

const computeTotal = (q, n) => (q.std * 200 + q.sup * 300 + q.fam * 400) * (n || 0);
// Precio por noche × cantidad de habitaciones × noches
// q = { std: 1, sup: 0, fam: 2 }, n = 3 noches

const setVisibilityByQtyName = (qtyName, visible) => {
    const input = document.querySelector(`input[name="${qtyName}"]`);
    const card = input?.closest(".room-card");
    // closest() sube por el DOM buscando el ancestro más cercano que coincida con el selector.
    // Desde el input sube hasta encontrar .room-card (el article que contiene todo).

    if (card) card.style.display = visible ? "" : "none";
    // visible true → muestra la card, visible false → oculta la card

    if (input) {
        input.disabled = !visible;
        // si la card está oculta, el input queda bloqueado
        if (!visible && input.value !== "0") { 
            input.value = "0"; // resetea el valor a 0 si era necesario
            input.dispatchEvent(new Event("input", { bubbles: true }));
            // Esto hace que updateSummary se ejecute y actualice el total.
        }
    }
}; // muestra u oculta una card de habitación según el filtro de huéspedes

const filterRoomsByGuests = () => {
    const sel = document.getElementById("guests");
    if (!sel) return;
    const val = sel.value; // "all" | "1" | "2" | "3-5"
    let only = "all";
    if (val === "1") only = "std";
    else if (val === "2") only = "sup";
    else if (val === "3-5") only = "fam";

    // Muestra u oculta cada card según la selección
    setVisibilityByQtyName("std_qty", only === "all" || only === "std");
    setVisibilityByQtyName("sup_qty", only === "all" || only === "sup");
    setVisibilityByQtyName("fam_qty", only === "all" || only === "fam");
};

const stepQty = (qtyName, delta) => {
    // delta = 1 (botón +) o -1 (botón −)
    const input = document.querySelector(`input[name="${qtyName}"]`);
    if (!input || input.disabled) return;

    const min = Number(input.min ?? 0); // si min es null/undefined, usa 0
    const max = Number(input.max ?? 9);
    let val = Number(input.value || 0) + delta;
    if (val < min) val = min;
    if (val > max) val = max;
    input.value = String(val);

    const inEl = document.getElementById("checkin");
    const outEl = document.getElementById("checkout");
    updateSummary(inEl, outEl);
};

// Listener global para los botones + y − de TODAS las cards
document.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-action="inc"],[data-action="dec"]');
    // En vez de poner un listener en cada botón, se usa "event delegation": un solo listener en document captura TODOS los clicks.
    // closest() verifica si el click fue en un botón con data-action inc/dec.
    if (!btn) return;
    const name = btn.getAttribute("data-target"); // ej: "std_qty"
    stepQty(name, btn.dataset.action === "inc" ? 1 : -1);
});

// --------------------------------------------------------------------------------

const updateSummary = (inEl, outEl) => {
    const inD = parseISODate(inEl.value);
    const outD = parseISODate(outEl.value);
    const n = calcNights(inD, outD);

    const q = {
        std: validateRoomQty(document.querySelector('[name="std_qty"]')),
        sup: validateRoomQty(document.querySelector('[name="sup_qty"]')),
        fam: validateRoomQty(document.querySelector('[name="fam_qty"]'))
    };
    const total = computeTotal(q, n);

    // Actualiza las fechas mostradas en el aside
    const muted = document.querySelectorAll(".resumen-line .muted");
    if (muted[0]) muted[0].textContent = inEl.value || "—";
    if (muted[1]) muted[1].textContent = outEl.value || "—";

    document.getElementById("summary-total").textContent = formatPrice(total);

    // Genera el HTML de los items del resumen
    const list = document.getElementById("summary-items");
    const items = Object.entries(q)
        // Object.entries({ std: 1, sup: 0, fam: 2 }) → [["std", 1], ["sup", 0], ["fam", 2]]
        .filter(([, v]) => v > 0) // solo habitaciones con cantidad > 0. [, v] ignora la clave.
        .map(([id, v]) => `<li>
            <span>${pluralize(v, id === "fam" ? "Family Suite" : id === "sup" ? "Superior Room" : "Standard Room")}${n ? `, ${pluralize(n, "night")}` : ""}</span>
            <button type="button" class="line-remove" data-id="${id}">×</button>
        </li>`).join(""); // join("") une todos los strings sin separador

    list.innerHTML = items;
    document.querySelector(".resumen-warn").hidden = !!items;
    // items convierte el string a boolean: si items es "" (vacío) → false → muestra la advertencia

    // Listener para los botones × de eliminar habitación del resumen
    list.onclick = e => {
        const id = e.target.dataset.id; // "std", "sup" o "fam"
        if (!id) return;
        const input = document.querySelector(`[name="${id}_qty"]`);
        input.value = "0";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        updateSummary(inEl, outEl);
    };
};

const handleSubmit = e => {
    e.preventDefault(); // evita que el form recargue la página
    const inEl = document.getElementById("checkin");
    const outEl = document.getElementById("checkout");
    if (!validateDates(inEl, outEl)) return;
    filterRoomsByGuests();
    updateSummary(inEl, outEl);
};

const restoreFromCheckout = () => {
    // Si el usuario vuelve de payment.html con "Modify selection",
    // restaura las fechas y cantidades que tenía antes.
    let d;
    try {
        d = JSON.parse(localStorage.getItem("sb_checkout") || "{}");
        // localStorage solo guarda strings. JSON.parse convierte el string de vuelta a objeto.
        // try/catch: si el JSON está corrupto (poco probable pero posible), no tira error.
    } catch {
        d = {};
    }
    if (!d || !d.checkin || !d.checkout) return; // no hay nada guardado, termina

    const inEl = document.getElementById("checkin");
    const outEl = document.getElementById("checkout");
    if (inEl) inEl.value = d.checkin;
    if (outEl) outEl.value = d.checkout;

    const stdEl = document.querySelector('input[name="std_qty"]');
    const supEl = document.querySelector('input[name="sup_qty"]');
    const famEl = document.querySelector('input[name="fam_qty"]');
    if (stdEl) stdEl.value = "0";
    if (supEl) supEl.value = "0";
    if (famEl) famEl.value = "0";

    (d.rooms || []).forEach(r => {
        const map = { std: stdEl, sup: supEl, fam: famEl };
        const el = map[r.id]; // busca el input correspondiente a esa habitación
        if (el) el.value = String(r.qty || 0);
    });

    // Restaura el select de huéspedes según qué tipos de habitación había
    const guests = document.getElementById("guests");
    if (guests) {
        const hasStd = (d.rooms || []).some(r => r.id === "std");
        // .some() devuelve true si AL MENOS UN elemento cumple la condición
        const hasSup = (d.rooms || []).some(r => r.id === "sup");
        const hasFam = (d.rooms || []).some(r => r.id === "fam");
        guests.value =
            hasStd && !hasSup && !hasFam ? "1" :
            !hasStd && hasSup && !hasFam ? "2" :
            !hasStd && !hasSup && hasFam ? "3-5" : "all";
        // Ternario encadenado: si solo hay std → "1", solo sup → "2", solo fam → "3-5", cualquier otra combo → "all"
        filterRoomsByGuests();
    }

    updateSummary(inEl, outEl);
};

// Punto de entrada principal para booking.html
document.addEventListener("DOMContentLoaded", () => {
    // DOMContentLoaded: se dispara cuando el HTML terminó de parsearse (no espera imágenes ni CSS).
    // Es similar a lo que hace defer en el <script>, pero permite tener lógica más explícita.
    const form = document.querySelector(".book-form");
    if (!form) return; // no estamos en booking.html, termina

    const inEl = document.getElementById("checkin");
    const outEl = document.getElementById("checkout");

    // Actualiza el resumen en tiempo real cuando cambian fechas o cantidades
    ["input", "change"].forEach(ev => {
        [inEl, outEl].forEach(el => el?.addEventListener(ev, () => updateSummary(inEl, outEl)));
        document.querySelectorAll('[name$="_qty"]').forEach(el => el.addEventListener(ev, () => updateSummary(inEl, outEl)));
        // name$="_qty": selector de atributo que termina en "_qty" → std_qty, sup_qty, fam_qty
    });

    form.addEventListener("submit", handleSubmit);

    const contBtn = document.querySelector(".resumen .btn-payment");
    contBtn?.addEventListener("click", handleContinue);

    restoreFromCheckout();
});

const handleContinue = () => {
    const inEl = document.getElementById("checkin");
    const outEl = document.getElementById("checkout");
    if (!validateDates(inEl, outEl)) return;

    const checkin = inEl.value;
    const checkout = outEl.value;
    const nights = calcNights(parseISODate(checkin), parseISODate(checkout));

    const qty = {
        std: validateRoomQty(document.querySelector('input[name="std_qty"]')),
        sup: validateRoomQty(document.querySelector('input[name="sup_qty"]')),
        fam: validateRoomQty(document.querySelector('input[name="fam_qty"]')),
    };
    const totalRooms = qty.std + qty.sup + qty.fam;
    const total = computeTotal(qty, nights);

    if (totalRooms === 0) return showModal("Please add rooms.", "Error");

    // Arma el objeto con toda la info de la reserva
    const data = {
        checkin, checkout, nights,
        rooms: [
            ...(qty.std ? [{ id: "std", name: "Standard Room", qty: qty.std, price: 200 }] : []),
            ...(qty.sup ? [{ id: "sup", name: "Superior Room", qty: qty.sup, price: 300 }] : []),
            ...(qty.fam ? [{ id: "fam", name: "Family Suite", qty: qty.fam, price: 400 }] : []),
            // ...(condicion ? [valor] : []) es el patrón para agregar condicionalmente a un array.
            // Si qty.std es 0 (falsy), agrega [] (nada). Si es > 0, agrega el objeto.
        ],
        totalRooms,
        total
    };

    localStorage.setItem("sb_checkout", JSON.stringify(data));
    // JSON.stringify convierte el objeto a string para guardarlo en localStorage.
    // localStorage solo puede guardar strings.

    window.location.href = "payment.html"; // navega a la página de pago
};


/* =============================================
   ROOM DETAILS MODAL
   ============================================= */

// Objeto con los datos de cada habitación. Clave = id usado en data-room del HTML.
const ROOMS = {
    std: { t: "Standard Room", c: "1 adult max", s: "30 m²", a: ["Balcony", "AC", "Smart TV", "Mini-fridge"], img: "Imagenes/standardRoom.png" },
    sup: { t: "Superior Room", c: "2 adults max", s: "40 m²", a: ["Sea view", "King bed", "Rain shower", "Smart TV"], img: "Imagenes/superiorRoom.png" },
    fam: { t: "Family Suite", c: "Up to 5 guests", s: "45 m²", a: ["Kitchenette", "Terrace", "2 bathrooms", "Crib"], img: "Imagenes/familySuite.png" }
};

const openRoomDetails = btn => {
    const id = btn.dataset.room; // "std", "sup" o "fam" (viene de data-room en el HTML)
    const d = ROOMS[id];         // busca en el objeto ROOMS con esa clave

    // Rellena el modal con los datos de esa habitación
    document.getElementById("room-title").textContent = d.t;
    document.getElementById("room-capacity").textContent = d.c;
    document.getElementById("room-size").textContent = d.s;
    document.getElementById("room-amenities").innerHTML = d.a.map(a => `<li>${a}</li>`).join("");
    document.getElementById("room-photo").src = d.img;

    document.getElementById("room-modal").style.display = "grid";
    document.body.style.overflow = "hidden"; // bloquea scroll del fondo
};

// Listener global para abrir y cerrar el modal de habitación
document.addEventListener("click", e => {
    const b = e.target.closest("[data-action='room-details']");
    if (b) {
        e.preventDefault(); // evita que el href="#" scrollee al top de la página
        openRoomDetails(b);
    }
    // Cierra el modal si se hace click en el × o en el backdrop
    if (e.target.classList.contains("room-close") || e.target.id === "room-modal") {
        document.getElementById("room-modal").style.display = "none";
        document.body.style.overflow = "";
    }
});


/* =============================================
   CONTACT FORM
   ============================================= */

document.addEventListener("DOMContentLoaded", () => {
    const f = document.querySelector(".contact-form");
    if (!f) return; // no estamos en contact.html, termina

    const fname = document.getElementById("fname");
    const lname = document.getElementById("lname");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");

    // Filtros en tiempo real: cada vez que el usuario escribe, se filtran caracteres no válidos
    fname?.addEventListener("input", () => fname.value = keepLetters(fname.value));
    lname?.addEventListener("input", () => lname.value = keepLetters(lname.value));
    phone?.addEventListener("input", () => phone.value = keepDigits(phone.value));

    f.addEventListener("submit", (e) => {
        e.preventDefault();

        const n = (fname?.value || "").trim(); // trim() saca espacios al inicio y final
        const l = (lname?.value || "").trim();
        const m = (email?.value || "").trim();
        const p = (phone?.value || "").trim();

        // Validaciones en orden: primero campos vacíos, luego formato
        if (!n || !l || !m) return showModal("Complete all required fields.", "Error");
        if (!isLetters(n) || !isLetters(l)) return showModal("First and Last Name: letters only.", "Error");
        if (!isEmailBasic(m)) return showModal("Invalid email.", "Error");
        if (p && !isDigits(p)) return showModal("Telephone: numbers only.", "Error");
        // p && ...: solo valida el teléfono si tiene algo escrito (es opcional)

        showModal("Message sent!", "OK");
        f.reset(); // limpia todos los campos del formulario
    });
});


/* =============================================
   PAYMENT
   ============================================= */

document.addEventListener("DOMContentLoaded", () => {
    const f = document.getElementById("pay-form");
    if (!f) return; // no estamos en payment.html, termina

    // Lee los datos guardados por booking.html
    let d = {};
    try {
        d = JSON.parse(localStorage.getItem("sb_checkout") || "{}");
    } catch (e) {
        d = {};
    }

    // Si no hay datos válidos, redirige a booking (no tiene sentido estar en payment sin reserva)
    if (!d || typeof d.total !== "number" || d.total <= 0) {
        location.href = "booking.html";
        return;
    }

    // Rellena el resumen lateral con los datos de la reserva
    document.getElementById("sum-in").textContent = d.checkin || "—";
    document.getElementById("sum-out").textContent = d.checkout || "—";
    document.getElementById("sum-nights").textContent = d.nights ?? "—";
    // ?? (nullish coalescing): si d.nights es null o undefined usa "—", pero si es 0 usa 0
    document.getElementById("sum-total").textContent = formatPrice(d.total || 0);

    const rooms = Array.isArray(d.rooms) ? d.rooms : [];
    document.getElementById("sum-rooms").innerHTML = rooms
        .map(r => `<div class="sum-row">
            <span>${r.qty} ${r.name}</span>
            <strong>${formatPrice(r.qty * r.price * d.nights)}</strong>
        </div>`).join("");

    // Referencias a los inputs del formulario
    const fname = document.getElementById("fname");
    const lname = document.getElementById("lname");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const card  = document.getElementById("card");
    const namec = document.getElementById("nameoncard");
    const exp   = document.getElementById("exp");
    const cvv   = document.getElementById("cvv");

    // Filtros en tiempo real
    fname?.addEventListener("input", () => fname.value = keepLetters(fname.value));
    lname?.addEventListener("input", () => lname.value = keepLetters(lname.value));
    namec?.addEventListener("input", () => namec.value = keepLetters(namec.value));
    phone?.addEventListener("input", () => phone.value = keepDigits(phone.value));
    cvv?.addEventListener("input", () => cvv.value = keepDigits(cvv.value).slice(0, 3));
    // .slice(0, 3): aunque maxlength="3" ya lo limita en el HTML, esto lo refuerza por JS

    // Formatea el número de tarjeta como 4111 1111 1111 1111 mientras se escribe
    card?.addEventListener("input", () => {
        const digits = keepDigits(card.value).slice(0, 16); // máximo 16 dígitos
        const groups = [];
        for (let i = 0; i < digits.length; i += 4) groups.push(digits.slice(i, i + 4));
        // Recorre de 4 en 4: slice(0,4) → "4111", slice(4,8) → "1111", etc.
        card.value = groups.join(" ").trim(); // une con espacios: "4111 1111 1111 1111"
    });

    // Formatea la expiración como MM/YY mientras se escribe
    exp?.addEventListener("input", () => {
        const digits = keepDigits(exp.value).slice(0, 4); // máximo 4 dígitos: MMYY
        exp.value = digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
        // Si el usuario escribió "12": muestra "12"
        // Si escribió "1226": muestra "12/26"
    });

    // Validación al enviar
    f.addEventListener("submit", (e) => {
        e.preventDefault();

        const n  = (fname?.value || "").trim();
        const l  = (lname?.value || "").trim();
        const m  = (email?.value || "").trim();
        const p  = (phone?.value || "").trim();
        const cn = keepDigits(card?.value || "");  // solo los dígitos del número de tarjeta
        const nc = (namec?.value || "").trim();
        const ex = (exp?.value || "").trim();
        const cv = keepDigits(cvv?.value || "");

        if (!n || !l || !m || !cn || !nc || !ex || !cv)
            return showModal("Complete all required fields.", "Error");
        if (!isLetters(n) || !isLetters(l) || !isLetters(nc))
            return showModal("Names must consist of only letters.", "Error");
        if (!isEmailBasic(m))
            return showModal("Invalid email.", "Error");
        if (p && !isDigits(p))
            return showModal("Telephone: numbers only.", "Error");
        if (!isDigits(cn) || cn.length < 13 || cn.length > 19)
            return showModal("Invalid card number.", "Error");
        if (!isExpiryMMYY(ex))
            return showModal("Invalid date (MM/YY).", "Error");
        if (!isDigits(cv) || cv.length !== 3)
            return showModal("Invalid CVV (3 numbers).", "Error");

        showModal("Payment successful! Confirmation sent.", "Payment");
        localStorage.removeItem("sb_checkout"); // limpia los datos de la reserva
        f.reset();
    });
});