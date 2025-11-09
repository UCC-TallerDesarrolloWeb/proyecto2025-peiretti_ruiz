import { useId } from "react";

/**
 * Props:
 *  - filters: { checkin, checkout, type, priceMin?, priceMax? }
 *  - onChange: (nextFilters) => void
 *
 * No hace submit; el parent maneja el botón "Search".
 * Renderiza con las mismas clases que tu CSS (_booking.scss).
 */

export default function Filters({ filters, onChange }) {
  const idIn = useId();
  const idOut = useId();
  const idType = useId();

  const set = (k, v) => onChange({ ...filters, [k]: v });

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
            min={new Date().toISOString().slice(0, 10)}
          />
          <span className="dash">—</span>
          <input
            id={idOut}
            type="date"
            value={filters.checkout}
            onChange={(e) => set("checkout", e.target.value)}
            min={filters.checkin || new Date().toISOString().slice(0, 10)}
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
