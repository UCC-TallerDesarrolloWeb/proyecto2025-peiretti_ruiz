/**
 * ============================
 * Santorini Blue - Booking JS
 * ============================
 * Validations, calculations and unified modals
 * (simplified and organized version)
 */

/* ======= UTILITIES ======= */
const formatPrice = n => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(+n || 0);
const parseISODate = v => (v ? new Date(v + "T00:00:00") : null);
const calcNights = (inD, outD) => (!inD || !outD ? 0 : Math.max(0, (outD - inD) / 86400000));
const pluralize = (n, s, p = s + "s") => `${n} ${n === 1 ? s : p}`;

// letters and spaces
const isLetterOrSpace = ch => ch === " " || ch.toLowerCase() !== ch.toUpperCase();
const keepLetters = s => [...(s || "")].filter(isLetterOrSpace).join("");
const isLetters = s => s.trim().length > 0 && [...s.trim()].every(isLetterOrSpace);

// digits (0-9)
const isDigit = ch => ch >= "0" && ch <= "9";
const keepDigits = s => [...(s || "")].filter(isDigit).join("");
const isDigits = s => s.length > 0 && [...s].every(isDigit);

// email has @ and . in valid positions
const isEmailBasic = s => {
    const t = (s || "").trim();
    const at = t.indexOf("@");
    const dot = t.lastIndexOf(".");
    return at > 0 && dot > at + 1 && dot < t.length - 1;
};

// MM/YY (month 01..12)
const isExpiryMMYY = s => {
    const t = (s || "").trim();
    if (t.length !== 5 || t[2] !== "/") return false;
    const mm = t.slice(0, 2), yy = t.slice(3);
    if (!isDigits(mm) || !isDigits(yy)) return false;
    const m = Number(mm);
    return m >= 1 && m <= 12;
};


/* ======= MODAL ======= */
const bindModalHandlers = (overlay) => {
    if (!overlay || overlay.dataset.bound) return;

    const hide = () => {
        overlay.style.display = "none";
        overlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    };

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) hide();
    });
    overlay.querySelector(".modal-close")?.addEventListener("click", hide);
    overlay.querySelector("#modal-ok")?.addEventListener("click", hide);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay.style.display === "grid") hide();
    });

    overlay.dataset.bound = "1";
};

const ensureModal = () => {
    let overlay = document.getElementById("app-modal");
    if (!overlay) {
        document.body.insertAdjacentHTML(
            "beforeend",
            `<div id="app-modal" class="modal-backdrop" aria-hidden="true">
         <div class="modal" role="dialog" aria-modal="true">
           <button class="modal-close" aria-label="Close">×</button>
           <h3 id="modal-title">Error</h3>
           <div id="modal-msg"></div>
           <div class="modal-actions">
             <button id="modal-ok" class="btn-continue" type="button">OK</button>
           </div>
         </div>
       </div>`
        );
        overlay = document.getElementById("app-modal");
    }
    bindModalHandlers(overlay);
    return overlay;
};

const showModal = (msg, t = "Error") => {
    const o = ensureModal();
    o.querySelector("#modal-title").textContent = t;
    o.querySelector("#modal-msg").innerHTML = Array.isArray(msg)
        ? `<ul class="modal-list">${msg.map(m => `<li>${m}</li>`).join("")}</ul>`
        : String(msg);
    o.style.display = "grid";
    o.removeAttribute("aria-hidden");
    document.body.style.overflow = "hidden";
};

const showErrorAndClear = (el, msg) => {
    if (!el) return showModal(msg);
    el.value = "";
    el.focus();
    el.classList.add("is-error");
    el.addEventListener("input", () => el.classList.remove("is-error"), {once: true});
    showModal(msg);
};

/* ======= VALIDATIONS ======= */
const validateDates = (inEl, outEl) => {
    const inD = parseISODate(inEl.value), outD = parseISODate(outEl.value), today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!inD || !outD) return showErrorAndClear(outEl, "Complete Check-in and Check-out.");
    if (inD < today) return showErrorAndClear(inEl, "The check-in date cannot be earlier than today.");
    if (outD <= inD) return showErrorAndClear(outEl, "The check-out date must be after the check-in date.");
    return true;
};

const validateRoomQty = i => {
    const n = +i.value || 0;
    if (n < 0 || n > 9) {
        showErrorAndClear(i, "Invalid amount (0–9).");
        return 0;
    }
    return n;
};

/* ======= BOOKING ======= */
const computeTotal = (q, n) => (q.std * 200 + q.sup * 300 + q.fam * 400) * (n || 0);

/* -- FILTER BY SELECT "Room and guests" -- */
const setVisibilityByQtyName = (qtyName, visible) => {
    const input = document.querySelector(`input[name="${qtyName}"]`);
    const card = input?.closest(".room-card");
    if (card) card.style.display = visible ? "" : "none";
    if (input) {
        input.disabled = !visible;
        if (!visible && input.value !== "0") {
            input.value = "0";
            input.dispatchEvent(new Event("input", {bubbles: true}));
        }
    }
};

const filterRoomsByGuests = () => {
    const sel = document.getElementById("guests");
    if (!sel) return;
    const val = sel.value; // "all" | "1" | "2" | "3-5"
    let only = "all";
    if (val === "1") only = "std";
    else if (val === "2") only = "sup";
    else if (val === "3-5") only = "fam";

    setVisibilityByQtyName("std_qty", only === "all" || only === "std");
    setVisibilityByQtyName("sup_qty", only === "all" || only === "sup");
    setVisibilityByQtyName("fam_qty", only === "all" || only === "fam");
};

/* -- COUNTER − / + (updates summary) -- */
const stepQty = (qtyName, delta) => {
    const input = document.querySelector(`input[name="${qtyName}"]`);
    if (!input || input.disabled) return;
    const min = Number(input.min ?? 0);
    const max = Number(input.max ?? 9);
    let val = Number(input.value || 0) + delta;
    if (val < min) val = min;
    if (val > max) val = max;
    input.value = String(val);

    input.dispatchEvent(new Event("input", {bubbles: true}));
    const inEl = document.getElementById("checkin");
    const outEl = document.getElementById("checkout");
    updateSummary(inEl, outEl);
};

document.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-action="inc"],[data-action="dec"]');
    if (!btn) return;
    const name = btn.getAttribute("data-target");
    stepQty(name, btn.dataset.action === "inc" ? 1 : -1);
});

const updateSummary = (inEl, outEl) => {
    const inD = parseISODate(inEl.value), outD = parseISODate(outEl.value);
    const n = calcNights(inD, outD);
    const q = {
        std: validateRoomQty(document.querySelector('[name="std_qty"]')),
        sup: validateRoomQty(document.querySelector('[name="sup_qty"]')),
        fam: validateRoomQty(document.querySelector('[name="fam_qty"]'))
    };
    const total = computeTotal(q, n);

    const muted = document.querySelectorAll(".resumen-line .muted");
    if (muted[0]) muted[0].textContent = inEl.value || "—";
    if (muted[1]) muted[1].textContent = outEl.value || "—";

    document.getElementById("summary-total").textContent = formatPrice(total);

    const list = document.getElementById("summary-items");
    const items = Object.entries(q).filter(([, v]) => v > 0)
        .map(([id, v]) => `<li>
        <span>${pluralize(v, id === "fam" ? "Family Suite" : id === "sup" ? "Superior Room" : "Standard Room")}${n ? `, ${pluralize(n, "night")}` : ""}</span>
        <button type="button" class="line-remove" data-id="${id}">×</button>
      </li>`).join("");
    list.innerHTML = items;
    document.querySelector(".resumen-warn").hidden = !!items;

    list.onclick = e => {
        const id = e.target.dataset.id;
        if (!id) return;
        const input = document.querySelector(`[name="${id}_qty"]`);
        input.value = "0";
        input.dispatchEvent(new Event("input", {bubbles: true}));
        updateSummary(inEl, outEl);
    };
};

/* -- Submit of search form -- */
const handleSubmit = e => {
    e.preventDefault();
    const inEl = document.getElementById("checkin"), outEl = document.getElementById("checkout");
    if (!validateDates(inEl, outEl)) return;
    filterRoomsByGuests();          // filter when clicking Search
    updateSummary(inEl, outEl);     // and refresh summary
};

/* -- RESTORE from localStorage when returning from payment -- */
const restoreFromCheckout = () => {
    let d;
    try {
        d = JSON.parse(localStorage.getItem("sb_checkout") || "{}");
    } catch {
        d = {};
    }
    if (!d || !d.checkin || !d.checkout) return;

    // Set dates
    const inEl = document.getElementById("checkin");
    const outEl = document.getElementById("checkout");
    if (inEl) inEl.value = d.checkin;
    if (outEl) outEl.value = d.checkout;

    // Reset quantities to 0
    const stdEl = document.querySelector('input[name="std_qty"]');
    const supEl = document.querySelector('input[name="sup_qty"]');
    const famEl = document.querySelector('input[name="fam_qty"]');
    if (stdEl) stdEl.value = "0";
    if (supEl) supEl.value = "0";
    if (famEl) famEl.value = "0";

    // Load saved quantities
    (d.rooms || []).forEach(r => {
        const map = {std: stdEl, sup: supEl, fam: famEl};
        const el = map[r.id];
        if (el) el.value = String(r.qty || 0);
    });

    // Adjust guests select based on selection
    const guests = document.getElementById("guests");
    if (guests) {
        const hasStd = (d.rooms || []).some(r => r.id === "std");
        const hasSup = (d.rooms || []).some(r => r.id === "sup");
        const hasFam = (d.rooms || []).some(r => r.id === "fam");
        guests.value =
            hasStd && !hasSup && !hasFam ? "1" :
                !hasStd && hasSup && !hasFam ? "2" :
                    !hasStd && !hasSup && hasFam ? "3-5" : "all";
        filterRoomsByGuests();
    }

    // Refresh summary
    updateSummary(inEl, outEl);
};

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".book-form");
    if (!form) return;
    const inEl = document.getElementById("checkin"), outEl = document.getElementById("checkout");

    ["input", "change"].forEach(ev => {
        [inEl, outEl].forEach(el => el?.addEventListener(ev, () => updateSummary(inEl, outEl)));
        document.querySelectorAll('[name$="_qty"]').forEach(el => el.addEventListener(ev, () => updateSummary(inEl, outEl)));
    });

    form.addEventListener("submit", handleSubmit);

    /* -- Continue → payment.html (DIRECT listener on button) -- */
    const contBtn = document.querySelector(".resumen .btn-payment");
    contBtn?.addEventListener("click", handleContinue);

    /* -- Restore if there's sb_checkout (return from payment) -- */
    restoreFromCheckout();
});

/* == Continue logic - REFACTORED to reuse validateDates == */
const handleContinue = () => {
    const inEl = document.getElementById("checkin");
    const outEl = document.getElementById("checkout");

    // ✅ Reuse existing date validation
    if (!validateDates(inEl, outEl)) return;

    const checkin = inEl.value;
    const checkout = outEl.value;
    const inDate = parseISODate(checkin);
    const outDate = parseISODate(checkout);
    const nights = calcNights(inDate, outDate);

    const qty = {
        std: validateRoomQty(document.querySelector('input[name="std_qty"]')),
        sup: validateRoomQty(document.querySelector('input[name="sup_qty"]')),
        fam: validateRoomQty(document.querySelector('input[name="fam_qty"]')),
    };
    const totalRooms = qty.std + qty.sup + qty.fam;
    const total = computeTotal(qty, nights);

    // Only validate what's specific to Continue
    if (totalRooms === 0)
        return showModal("Please add rooms.", "Error");

    const data = {
        checkin, checkout, nights,
        rooms: [
            ...(qty.std ? [{id: "std", name: "Standard Room", qty: qty.std, price: 200}] : []),
            ...(qty.sup ? [{id: "sup", name: "Superior Room", qty: qty.sup, price: 300}] : []),
            ...(qty.fam ? [{id: "fam", name: "Family Suite", qty: qty.fam, price: 400}] : []),
        ],
        totalRooms,
        total
    };

    localStorage.setItem("sb_checkout", JSON.stringify(data));
    window.location.href = "payment.html";
};

/* ======= ROOM DETAILS ======= */
const ROOMS = {
    std: {t: "Standard Room", c: "1 adult max", s: "30 m²", a: ["Balcony", "AC", "Smart TV", "Mini-fridge"]},
    sup: {t: "Superior Room", c: "2 adults max", s: "40 m²", a: ["Sea view", "King bed", "Rain shower", "Smart TV"]},
    fam: {t: "Family Suite", c: "Up to 5 guests", s: "45 m²", a: ["Kitchenette", "Terrace", "2 bathrooms", "Crib"]}
};

const openRoomDetails = btn => {
    const id = btn.dataset.room;
    const d = ROOMS[id];
    document.getElementById("room-title").textContent = d.t;
    document.getElementById("room-capacity").textContent = d.c;
    document.getElementById("room-size").textContent = d.s;
    document.getElementById("room-amenities").innerHTML = d.a.map(a => `<li>${a}</li>`).join("");
    document.getElementById("room-modal").style.display = "grid";
    document.body.style.overflow = "hidden";
};

document.addEventListener("click", e => {
    const b = e.target.closest("[data-action='room-details']");
    if (b) {
        e.preventDefault();
        openRoomDetails(b);
    }
    if (e.target.classList.contains("room-close") || e.target.id === "room-modal") {
        document.getElementById("room-modal").style.display = "none";
        document.body.style.overflow = "";
    }
});

/* ======= CONTACT FORM ======= */
document.addEventListener("DOMContentLoaded", () => {
    const f = document.querySelector(".contact-form");
    if (!f) return;

    const fname = document.getElementById("fname");
    const lname = document.getElementById("lname");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");

    // live filters (without regex)
    fname?.addEventListener("input", () => fname.value = keepLetters(fname.value));
    lname?.addEventListener("input", () => lname.value = keepLetters(lname.value));
    phone?.addEventListener("input", () => phone.value = keepDigits(phone.value));

    f.addEventListener("submit", (e) => {
        e.preventDefault();

        const n = (fname?.value || "").trim();
        const l = (lname?.value || "").trim();
        const m = (email?.value || "").trim();
        const p = (phone?.value || "").trim();

        if (!n || !l || !m) {
            return showModal("Complete all required fields.", "Error");
        }
        if (!isLetters(n) || !isLetters(l)) {
            return showModal("First and Last Name: letters only.", "Error");
        }
        if (!isEmailBasic(m)) {
            return showModal("Invalid email.", "Error");
        }
        if (p && !isDigits(p)) {
            return showModal("Telephone: numbers only.", "Error");
        }

        showModal("Message sent!", "OK");
        f.reset();
    });
});


/* ======= PAYMENT (simple validation) ======= */
document.addEventListener("DOMContentLoaded", () => {
    const f = document.getElementById("pay-form");
    if (!f) return;

    // --- summary
    let d = {};
    try {
        d = JSON.parse(localStorage.getItem("sb_checkout") || "{}");
    } catch (e) {
        d = {}; // if JSON is corrupt, continue with empty object
    }

    // if there's no valid data, redirect safely
    if (!d || typeof d.total !== "number" || d.total <= 0) {
        location.href = "booking.html";
        return; // stop execution
    }

    const money = (n) => formatPrice(n);

    // assign summary data with default values
    document.getElementById("sum-in").textContent = d.checkin || "—";
    document.getElementById("sum-out").textContent = d.checkout || "—";
    document.getElementById("sum-nights").textContent = d.nights ?? "—";
    document.getElementById("sum-total").textContent = money(d.total || 0);

    // render rooms only if it's a valid array
    const rooms = Array.isArray(d.rooms) ? d.rooms : [];
    document.getElementById("sum-rooms").innerHTML = rooms
        .map(
            (r) =>
                `<div class="sum-row"><span>${r.qty} ${r.name}</span><strong>${money(
                    r.qty * r.price * d.nights
                )}</strong></div>`
        )
        .join("");

    // refs
    const fname = document.getElementById("fname");
    const lname = document.getElementById("lname");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const card = document.getElementById("card");
    const namec = document.getElementById("nameoncard"); // Name on card
    const exp = document.getElementById("exp");
    const cvv = document.getElementById("cvv");

    // live filters (without regex)
    fname?.addEventListener("input", () => (fname.value = keepLetters(fname.value)));
    lname?.addEventListener("input", () => (lname.value = keepLetters(lname.value)));
    namec?.addEventListener("input", () => (namec.value = keepLetters(namec.value)));
    phone?.addEventListener("input", () => (phone.value = keepDigits(phone.value)));
    cvv?.addEventListener("input", () => (cvv.value = keepDigits(cvv.value).slice(0, 3)));

    // card: keep digits and format 4-4-4-4
    card?.addEventListener("input", () => {
        const digits = keepDigits(card.value).slice(0, 19); // allows 13–19
        const groups = [];
        for (let i = 0; i < digits.length; i += 4) groups.push(digits.slice(i, i + 4));
        card.value = groups.join(" ").trim();
    });

    // expiry: keep digits and auto "/" → MM/YY
    exp?.addEventListener("input", () => {
        const digits = keepDigits(exp.value).slice(0, 4); // MMYY
        exp.value =
            digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
    });

    // form validation
    f.addEventListener("submit", (e) => {
        e.preventDefault();

        const n = (fname?.value || "").trim();
        const l = (lname?.value || "").trim();
        const m = (email?.value || "").trim();
        const p = (phone?.value || "").trim();
        const cn = keepDigits(card?.value || "");
        const nc = (namec?.value || "").trim();
        const ex = (exp?.value || "").trim();
        const cv = keepDigits(cvv?.value || "");

        if (!n || !l || !m || !cn || !nc || !ex || !cv) {
            return showModal("Complete all required fields.", "Error");
        }
        if (!isLetters(n) || !isLetters(l) || !isLetters(nc)) {
            return showModal("Names must consist of only letters.", "Error");
        }
        if (!isEmailBasic(m)) {
            return showModal("Invalid email.", "Error");
        }
        if (p && !isDigits(p)) {
            return showModal("Telephone: numbers only.", "Error");
        }
        if (!isDigits(cn) || cn.length < 13 || cn.length > 19) {
            return showModal("Invalid card number.", "Error");
        }
        if (!isExpiryMMYY(ex)) {
            return showModal("Invalid date (MM/YY).", "Error");
        }
        if (!isDigits(cv) || cv.length !== 3) {
            return showModal("Invalid CVV (3 numbers).", "Error");
        }

        showModal("Payment successful! Confirmation sent.", "Payment");
        localStorage.removeItem("sb_checkout");
        f.reset();
    });
});