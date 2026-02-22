import {useId} from "react";
// useId → genera IDs únicos y accesibles automáticamente

/**
 * Parametros que recibe
 *  - filters → objeto con { checkin, checkout, type } que vive en Booking.jsx
 *  - onChange → función para actualizar los filtros en Booking.jsx
 *
 * Este componente NO tiene estado propio, es completamente controlado
 * por Booking.jsx a través de props. Solo se encarga de mostrar los campos
 */

export default function Filters({filters, onChange}) {
    const idIn = useId();
    const idOut = useId();
    const idType = useId();

    const set = (k, v) => onChange({...filters, [k]: v});

    return (
        <>
            {/* Fechas */}
            <div className="campo">
                <label>Check-in and check-out</label>
                <div className="rango-fecha">
                    <input
                        id={idIn}
                        type="date"
                        value={filters.checkin}
                        onChange={(e) => set("checkin", e.target.value)}
                        min={new Date().toISOString().slice(0, 10)} // slice(0,10)   → "2026-02-22"
                        // min → no permite seleccionar fechas anteriores a hoy, 
                    />
                    <span className="dash">—</span>
                    <input
                        id={idOut}
                        type="date"
                        value={filters.checkout}
                        onChange={(e) => set("checkout", e.target.value)}
                        min={filters.checkin || new Date().toISOString().slice(0, 10)}
                        // min del checkout → si hay checkin elegido, no puede ser menor a ese, sino no puede ser menor a hoy
                    />
                </div>
                {/* reserva espacio p/ error (alineación) */}
                <div className="field-error" aria-hidden="true"></div>
            </div>

            {/* Tipo de habitación */}
            <div className="campo">
                <label htmlFor={idType}>Room and guests</label>
                <select
                    id={idType}
                    value={filters.type}
                    onChange={(e) => set("type", e.target.value)}
                >
                    <option value="all">Show all rooms</option>
                    <option value="std">Standard</option>
                    <option value="sup">Superior</option>
                    <option value="fam">Family Suite</option>
                </select>
                {/* reserva espacio p/ error (alineación) */}
                <div className="field-error" aria-hidden="true"></div>
            </div>
        </>
    );
}
