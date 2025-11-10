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
import { getSummary, setDates, finalize, syncAllRooms } from '@api/summaryApi.js'

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
  const [isLoading, setIsLoading] = useState(true)

  // Cargar el resumen al montar el componente
  useEffect(() => {
    (async () => {
      try {
        const summary = await getSummary()
        console.log('📥 Resumen cargado en Booking:', summary)
        
        // Si hay datos previos, restaurar filters y qty
        if (summary.checkin && summary.checkout) {
          setFilters(prev => ({
            ...prev,
            checkin: summary.checkin,
            checkout: summary.checkout
          }))
        }
        
        // Restaurar cantidad de habitaciones
        if (Array.isArray(summary.rooms) && summary.rooms.length > 0) {
          const newQty = { std: 0, sup: 0, fam: 0 }
          summary.rooms.forEach(room => {
            if (room.id in newQty) {
              newQty[room.id] = room.qty
            }
          })
          setQty(newQty)
          console.log('♻️ Cantidades restauradas:', newQty)
        }
      } catch (e) {
        console.error('Error al cargar resumen:', e)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

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

  // Limpia error visual cuando cambian las fechas
  useEffect(() => {
    if (filters.checkin || filters.checkout) {
      setDateErr('')
    }
  }, [filters.checkin, filters.checkout])

  const onSearch = (e) => {
    e.preventDefault()
    const err = validateDates(filters.checkin, filters.checkout)
    if (err) { 
      setDateErr(err)
      return 
    }
    setDateErr('')

    // aplicar filtro por tipo
    let r = ALL_ROOMS
    if (filters.type !== 'all') {
      r = r.filter(x => x.id === filters.type)
    }
    setFilteredRooms(r)
  }

  const continuePayment = async () => {
    // Validar fechas
    const err = validateDates(filters.checkin, filters.checkout)
    if (err) {
      setDateErr(err)
      return
    }

    // Validar que haya al menos una habitación seleccionada
    const totalRooms = qty.std + qty.sup + qty.fam
    if (!totalRooms) {
      setDateErr('Please add at least one room.')
      return
    }

    try {
      console.log('🔄 Iniciando continuePayment...')
      console.log('📅 Fechas:', { checkin: filters.checkin, checkout: filters.checkout, nights })
      
      // Construir array de habitaciones con cantidades > 0
      const roomsData = []
      if (qty.std > 0) {
        roomsData.push({ id: 'std', name: 'Standard Room', price: PRICES.std, qty: qty.std })
      }
      if (qty.sup > 0) {
        roomsData.push({ id: 'sup', name: 'Superior Room', price: PRICES.sup, qty: qty.sup })
      }
      if (qty.fam > 0) {
        roomsData.push({ id: 'fam', name: 'Family Suite', price: PRICES.fam, qty: qty.fam })
      }

      console.log('🏠 Habitaciones a sincronizar:', roomsData)

      // Paso 1: Sincronizar fechas
      console.log('📤 Paso 1: Sincronizando fechas...')
      const datesResult = await setDates({ 
        checkin: filters.checkin, 
        checkout: filters.checkout, 
        nights 
      })
      console.log('✅ Fechas sincronizadas:', datesResult)
      
      // Paso 2: Sincronizar habitaciones
      console.log('📤 Paso 2: Sincronizando habitaciones...')
      const roomsResult = await syncAllRooms(roomsData)
      console.log('✅ Habitaciones sincronizadas:', roomsResult)
      
      // Paso 3: Finalizar
      console.log('📤 Paso 3: Finalizando...')
      const finalResult = await finalize()
      console.log('✅ Reserva finalizada:', finalResult)
      
      console.log('✨ ¡Listo! Navegando a payment...')
      // Navegar a payment
      nav('/payment')
    } catch (error) {
      console.error('❌ Error al proceder al pago:', error)
      console.error('Detalles del error:', {
        message: error.message,
        stack: error.stack
      })
      setDateErr(`Error: ${error.message || 'Could not proceed to payment. Please try again.'}`)
    }
  }

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading...</p>
  }

  return (
    <>
      {/* Imagen superior */}
      <section className="imagen-acostada">
        <img src="/images/imagenbook.png" alt="Santorini sea view" />
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
        {dateErr && <p className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}>{dateErr}</p>}

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
                      <button 
                        type="button"
                        onClick={() => setQty(s => ({ ...s, [r.id]: Math.max(0, (s[r.id] || 0) - 1) }))}
                        aria-label={`Decrease ${r.name} quantity`}
                      >
                        −
                      </button>
                      <input
                        inputMode="numeric"
                        value={qty[r.id] || 0}
                        onChange={e => {
                          const n = Math.max(0, Math.min(9, Number(e.target.value || 0)))
                          setQty(s => ({ ...s, [r.id]: n }))
                        }}
                        aria-label={`${r.name} quantity`}
                      />
                      <button 
                        type="button"
                        onClick={() => setQty(s => ({ ...s, [r.id]: Math.min(9, (s[r.id] || 0) + 1) }))}
                        aria-label={`Increase ${r.name} quantity`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="resumen">
            <h3 className="resumen-title">Your Reservation</h3>
            <div className="resumen-line">
              <span>Check-In:</span>
              <span>{filters.checkin || '—'}</span>
            </div>
            <div className="resumen-line">
              <span>Check-Out:</span>
              <span>{filters.checkout || '—'}</span>
            </div>
            <hr className="resumen-sep" />

            <ul className="resumen-items">
              {Object.entries(qty).filter(([, v]) => v > 0).map(([id, v]) => (
                <li key={id}>
                  <span>
                    {pluralize(v, id === 'fam' ? 'Family Suite' : id === 'sup' ? 'Superior Room' : 'Standard Room')}
                    {nights ? `, ${pluralize(nights, 'night')}` : ''}
                  </span>
                  <button 
                    type="button" 
                    className="line-remove" 
                    onClick={() => setQty(s => ({ ...s, [id]: 0 }))}
                    aria-label={`Remove ${id === 'fam' ? 'Family Suite' : id === 'sup' ? 'Superior Room' : 'Standard Room'}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <p className="resumen-warn" hidden={Object.values(qty).some(v => v > 0)}>
              Please add rooms
            </p>
            <hr className="resumen-sep" />

            <div className="resumen-total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <button type="button" className="btn-continue" onClick={continuePayment}>
              Continue
            </button>
          </aside>
        </div>
      </section>
    </>
  )
}