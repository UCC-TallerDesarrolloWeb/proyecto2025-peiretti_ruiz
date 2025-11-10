// src/pages/Booking.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateDates, calcNights, parseISODate, formatPrice, pluralize } from '@utils/validation'
import Filters from '@components/Filters'
import '@styles/_booking.scss'

// Mock de habitaciones local (imágenes/nombres/precios)
import db from '@data/db.json'
const ALL_ROOMS = db.rooms

// API (json-server)
import { setDates, upsertRoom, finalize } from '@api/summaryApi'

const PRICES = { std: 200, sup: 300, fam: 400 }

export default function Booking() {
  const nav = useNavigate()

  // filtros controlados por Filters.jsx
  const [filters, setFilters] = useState({
    checkin: '',
    checkout: '',
    type: 'all', // std | sup | fam | all
  })

  const [dateErr, setDateErr] = useState('')
  const [qty, setQty] = useState({ std: 0, sup: 0, fam: 0 })
  const [filteredRooms, setFilteredRooms] = useState(null) // null = mostrar todas

  const nights = useMemo(
    () => calcNights(parseISODate(filters.checkin), parseISODate(filters.checkout)),
    [filters.checkin, filters.checkout]
  )

  // Total local (para el aside)
  const total = useMemo(() => {
    const sum = qty.std * PRICES.std + qty.sup * PRICES.sup + qty.fam * PRICES.fam
    return sum * (nights || 0)
  }, [qty, nights])

  const roomsShown = filteredRooms ?? ALL_ROOMS

  // Sincroniza fechas con la API cuando estén completas y válidas
  useEffect(() => {
    const err = validateDates(filters.checkin, filters.checkout)
    if (!err) {
      setDates({ checkin: filters.checkin, checkout: filters.checkout, nights }).catch(() => {})
    }
    // limpiamos error visual cuando cambian
    setDateErr('')
  }, [filters.checkin, filters.checkout, nights])

  // Sincroniza cantidades con la API cada vez que cambian
  useEffect(() => {
    const sync = async () => {
      await upsertRoom({ id: 'std', name: 'Standard Room', price: PRICES.std, qty: qty.std })
      await upsertRoom({ id: 'sup', name: 'Superior Room', price: PRICES.sup, qty: qty.sup })
      await upsertRoom({ id: 'fam', name: 'Family Suite',  price: PRICES.fam, qty: qty.fam })
    }
    sync().catch(() => {})
  }, [qty])

  const onSearch = (e) => {
    e.preventDefault()
    const err = validateDates(filters.checkin, filters.checkout)
    if (err) { setDateErr(err); return }
    setDateErr('')

    // aplicar filtro por tipo
    let r = ALL_ROOMS
    if (filters.type !== 'all') {
      r = r.filter(x => x.id === filters.type)
    }
    setFilteredRooms(r)
  }

  const continuePayment = async () => {
  const err = validateDates(filters.checkin, filters.checkout)
  if (err) return setDateErr(err)

  const totalRooms = qty.std + qty.sup + qty.fam
  if (!totalRooms) return setDateErr('Please add rooms.')

  try {
    // 1) Persistir cantidades vigentes de forma explícita
    await Promise.all([
      upsertRoom({ id: 'std', name: 'Standard Room', price: PRICES.std, qty: qty.std }),
      upsertRoom({ id: 'sup', name: 'Superior Room', price: PRICES.sup,  qty: qty.sup }),
      upsertRoom({ id: 'fam', name: 'Family Suite',  price: PRICES.fam, qty: qty.fam }),
    ])

    // 2) Persistir fechas/nights justo antes del finalize
    await setDates({ checkin: filters.checkin, checkout: filters.checkout, nights })

    // 3) Recalcular en el server y navegar
    await finalize()
    nav('/payment')
  } catch {
    setDateErr('Could not proceed. Try again.')
  }
}


  return (
    <>
      {/* Imagen superior */}
      <section className="imagen-acostada">
        <img src="public/images/imagenBook.png" alt="Santorini sea view" />
      </section>

      <section className="container book">
        <h2 className="titulo titulo-book">BOOK A ROOM</h2>

        {/* Formulario de filtros + botón Search */}
        <form className="book-form" onSubmit={onSearch} noValidate>
          <Filters filters={filters} onChange={setFilters} />

          <div className="search">
            <button type="submit" className="btn-buscar">Search</button>
          </div>
        </form>

        {/* error de fecha visible */}
        {dateErr && <p className="field-error" style={{ textAlign: 'center' }}>{dateErr}</p>}

        {/* Lista + Resumen */}
        <div className="rooms rooms-layout rooms--spaced">
          <div className="rooms-list">
            <h3 className="sr-titulo">Select room</h3>

            {roomsShown.map(r => (
              <article className="room-card" key={r.id}>
                <img className="room-img" src={r.img} alt={r.name} />

                <div className="room-body">
                  <header className="room-head">
                    <h4 className="room-name">{r.name}</h4>
                    <div className="room-price">{formatPrice(r.price)}</div>
                  </header>

                  <ul className="room-meta">
                    <li>👤 {r.meta[0]}</li>
                    <li>▢ {r.meta[1]}</li>
                  </ul>

                  <a className="room-more" href="#" onClick={(e) => e.preventDefault()}>
                    {r.desc}
                  </a>

                  <div className="room-cant">
                    <span className="qty-label">Add rooms</span>
                    <div className="counter nojs">
                      <button type="button"
                              onClick={() => setQty(s => ({ ...s, [r.id]: Math.max(0, (s[r.id] || 0) - 1) }))}>−</button>
                      <input
                        inputMode="numeric"
                        value={qty[r.id] || 0}
                        onChange={e => {
                          const n = Math.max(0, Math.min(9, Number(e.target.value || 0)))
                          setQty(s => ({ ...s, [r.id]: n }))
                        }}
                      />
                      <button type="button"
                              onClick={() => setQty(s => ({ ...s, [r.id]: Math.min(9, (s[r.id] || 0) + 1) }))}>+</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="resumen">
            <h3 className="resumen-title">Your Reservation</h3>
            <div className="resumen-line"><span>Check-In:</span><span>{filters.checkin || '—'}</span></div>
            <div className="resumen-line"><span>Check-Out:</span><span>{filters.checkout || '—'}</span></div>
            <hr className="resumen-sep" />

            <ul className="resumen-items">
              {Object.entries(qty).filter(([, v]) => v > 0).map(([id, v]) => (
                <li key={id}>
                  <span>
                    {pluralize(v, id === 'fam' ? 'Family Suite' : id === 'sup' ? 'Superior Room' : 'Standard Room')}
                    {nights ? `, ${pluralize(nights, 'night')}` : ''}
                  </span>
                  <button type="button" className="line-remove" onClick={() => setQty(s => ({ ...s, [id]: 0 }))}>×</button>
                </li>
              ))}
            </ul>

            <p className="resumen-warn" hidden={Object.values(qty).some(v => v > 0)}>Please add rooms</p>
            <hr className="resumen-sep" />

            <div className="resumen-total"><span>Total</span><span>{formatPrice(total)}</span></div>
            <button type="button" className="btn-continue" onClick={continuePayment}>Continue</button>
          </aside>
        </div>
      </section>
    </>
  )
}
