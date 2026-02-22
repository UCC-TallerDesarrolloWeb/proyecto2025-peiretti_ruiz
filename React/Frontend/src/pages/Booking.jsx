import {useEffect, useMemo, useState, useCallback} from 'react'
// useEffect → ejecuta código cuando el componente monta o cambian dependencias
// useMemo → memoriza un valor calculado, solo recalcula si cambian sus dependencias
// useState → maneja estado local del componente
// useCallback → memoriza una función, evita recrearla en cada render
import {useNavigate} from 'react-router-dom'
import {validateDates, calcNights, parseISODate, formatPrice, pluralize} from '@utils/validation'
import Filters from '@components/Filters'
import '@styles/_booking.scss'
import '@styles/_roomModal.scss'

// Mock de habitaciones local (imágenes/nombres/precios)
import db from '@data/db.json'

const ALL_ROOMS = db.rooms

// API (json-server)
import {getSummary, setDates, finalize, syncAllRooms} from '@api/summaryApi.js'

const PRICES = {std: 200, sup: 300, fam: 400}

export default function Booking() {
    const nav = useNavigate()

    // filtros controlados por Filters.jsx
    const [filters, setFilters] = useState({
        checkin: '',
        checkout: '',
        type: 'all', // std | sup | fam | all
    })

    const [dateErr, setDateErr] = useState('')
    const [qty, setQty] = useState({std: 0, sup: 0, fam: 0}) // cantidad de cada tipo de habitación seleccionada
    const [filteredRooms, setFilteredRooms] = useState(null) // habitaciones que cumplen los filtros, null = no se ha buscado aún
    const [isLoading, setIsLoading] = useState(true)

    const [open, setOpen] = useState(false) // controla si el modal de detalles de habitación está abierto o cerrado
    const [activeRoom, setActiveRoom] = useState(null) // guarda la habitación actualmente seleccionada para mostrar sus detalles en el modal. null = no hay habitación seleccionada

    const openModal = useCallback((room) => {
        setActiveRoom(room)
        setOpen(true)
    }, [])

    const closeModal = useCallback(() => {
        setOpen(false)
        setTimeout(() => setActiveRoom(null), 200)
    }, [])

    // ESC para cerrar
    useEffect(() => {
        if (!open) return // si el modal no está abierto, no hace nada
        const onKey = (e) => e.key === 'Escape' && closeModal()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, closeModal])

    // Cargar el resumen al montar el componente
    useEffect(() => {
        (async () => {
            setIsLoading(false)

            try {
                const summary = await Promise.race([
                    getSummary(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
                    // Si getSummary tarda más de 3 segundos → lanza error "timeout"
                ])

                // Si había fechas guardadas en la sesión anterior, las restaura
                if (summary?.checkin && summary?.checkout) {
                    setFilters(prev => ({
                        ...prev,
                        checkin: summary.checkin,
                        checkout: summary.checkout
                    }))
                }
                // Si había habitaciones guardadas, restaura las cantidades
                if (Array.isArray(summary?.rooms) && summary.rooms.length > 0) {
                    const newQty = {std: 0, sup: 0, fam: 0}
                    summary.rooms.forEach(room => {
                        if (room.id in newQty) {
                            newQty[room.id] = room.qty
                        }
                    })
                    setQty(newQty)
                }
            } catch (e) {
                console.warn('Could not load previous data:', e.message)
            }
        })()
    }, [])

    const nights = useMemo( // solo recalcula nights si cambian checkin o checkout
        () => Math.round(calcNights(parseISODate(filters.checkin), parseISODate(filters.checkout))),
        [filters.checkin, filters.checkout]
    )

    // Total local (para el aside)
    const total = useMemo(() => { // Solo recalcula si cambian qty o nights
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

    // boton Search
    const onSearch = (e) => {
        e.preventDefault() // evita que el formulario recargue la página al hacer submit
        const err = validateDates(filters.checkin, filters.checkout)
        if (err) {
            setDateErr(err)
            return
        }
        setDateErr('')
        let r = ALL_ROOMS
        if (filters.type !== 'all') {
            r = r.filter(x => x.id === filters.type) // filtra por tipo si no es "all"
        }
        setFilteredRooms(r)
    }

    // boton Continue
    const continuePayment = async () => {
        const err = validateDates(filters.checkin, filters.checkout)
        if (err) return setDateErr(err)

        const totalRooms = qty.std + qty.sup + qty.fam
        if (!totalRooms) return setDateErr('Please add at least one room.')

        try {
            const roomsData = []
            if (qty.std > 0) roomsData.push({id: 'std', name: 'Standard Room', price: PRICES.std, qty: qty.std})
            if (qty.sup > 0) roomsData.push({id: 'sup', name: 'Superior Room', price: PRICES.sup, qty: qty.sup})
            if (qty.fam > 0) roomsData.push({id: 'fam', name: 'Family Suite', price: PRICES.fam, qty: qty.fam})

            // 1. Guardar fechas y noches (nights como entero)
            await setDates({
                checkin: filters.checkin,
                checkout: filters.checkout,
                nights: Math.round(nights)
            })

            // 2. Guardar habitaciones
            await syncAllRooms(roomsData)

            // 3. Recalcular y persistir todo con PUT
            await finalize()

            nav('/payment')
        } catch (error) {
            console.error('Error proceeding to payment:', error)
            setDateErr(`Error: ${error.message || 'Could not proceed to payment. Please try again.'}`)
        }
    }

    if (isLoading) {
        return <p className="loading-message">Loading...</p>
    }

    return (
        <>
            {/* Imagen superior */}
            <section className="imagen-acostada">
                <img src="/images/imagenbook.png" alt="Santorini sea view"/>
            </section>

            <section className="container book">
                <h2 className="titulo titulo-book">BOOK A ROOM</h2>

                {/* Formulario de filtros + botón Search */}
                <form className="book-form" onSubmit={onSearch} noValidate>
                    <Filters filters={filters} onChange={setFilters}/>

                    <div className="search">
                        <button type="submit" className="btn-buscar">Search</button>
                    </div>
                </form>

                {/* error de fecha visible bajo el formulario */}
                {dateErr && <p className="field-error">{dateErr}</p>}

                {/* Lista + Resumen */}
                <div className="rooms rooms-layout rooms--spaced">
                    <div className="rooms-list">
                        <h3 className="sr-titulo">Select room</h3>

                        {roomsShown.map(r => (
                            <article className="room-card" key={r.id}>
                                <img className="room-img" src={r.img} alt={r.name}/>

                                <div className="room-body">
                                    <header className="room-head">
                                        <h4 className="room-name">{r.name}</h4>
                                        <div className="room-price">{formatPrice(r.price)}</div>
                                    </header>

                                    <ul className="room-meta">
                                        <li>👤 {r.meta?.[0]}</li>
                                        <li>▢ {r.meta?.[1]}</li>
                                    </ul>

                                    <button
                                        type="button"
                                        className="link-like room-more"
                                        onClick={() => openModal(r)}
                                        aria-haspopup="dialog"
                                        aria-controls="room-dialog"
                                    >
                                        {r.desc || 'More details'}
                                    </button>

                                    <div className="room-cant">
                                        <span className="qty-label">Add rooms</span>
                                        <div className="counter no-js">
                                            <button
                                                type="button"
                                                onClick={() => setQty(s => ({
                                                    ...s,
                                                    [r.id]: Math.max(0, (s[r.id] || 0) - 1) // decrementa pero no deja bajar de 0
                                                }))}
                                                aria-label={`Decrease ${r.name} quantity`}
                                            >
                                                −
                                            </button>
                                            <input
                                                inputMode="numeric"
                                                value={qty[r.id] || 0}
                                                onChange={e => {
                                                    const n = Math.max(0, Math.min(9, Number(e.target.value || 0)))
                                                    setQty(s => ({...s, [r.id]: n}))
                                                }}
                                                aria-label={`${r.name} quantity`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setQty(s => ({
                                                    ...s,
                                                    [r.id]: Math.min(9, (s[r.id] || 0) + 1)
                                                }))}
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
                            {/* || '—' → si no hay fecha muestra un guión */}
                        </div>
                        <div className="resumen-line">
                            <span>Check-Out:</span>
                            <span>{filters.checkout || '—'}</span>
                        </div>
                        <hr className="resumen-sep"/>

                        <ul className="resumen-items">
                            {Object.entries(qty).filter(([, v]) => v > 0).map(([id, v]) => (  // solo las que tienen qty > 0
                                <li key={id}>
                                    <span>
                                        {pluralize(v, id === 'fam' ? 'Family Suite' : id === 'sup' ? 'Superior Room' : 'Standard Room')}
                                        {nights ? `, ${pluralize(nights, 'night')}` : ''}
                                    </span>
                                    <button
                                        type="button"
                                        className="line-remove"
                                        onClick={() => setQty(s => ({...s, [id]: 0}))}
                                        aria-label={`Remove ${id === 'fam' ? 'Family Suite' : id === 'sup' ? 'Superior Room' : 'Standard Room'}`}
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Se oculta si hay al menos una habitación seleccionada */}
                        <p className="resumen-warn" hidden={Object.values(qty).some(v => v > 0)}>
                            Please add rooms
                        </p>
                        <hr className="resumen-sep"/>

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

            {/* Modal (Room Details) */}
            <div
                className="room-backdrop"
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeModal() // solo cierra si se hace click en el backdrop, no en el contenido del modal
                }}
                aria-hidden={!open}
            >
                {activeRoom && (
                    <div className="room-dialog" id="room-dialog" role="dialog" aria-modal="true"
                         aria-labelledby="room-title">
                        <button className="room-close" onClick={closeModal} aria-label="Close">×</button>

                        <div className="room-media">
                            <img className="room-photo" src={activeRoom.img} alt={activeRoom.name}/>
                        </div>

                        <div className="room-info">
                            <h3 id="room-title">{activeRoom.name}</h3>

                            <div className="room-overview">
                                <div title="Max guests">👤 <span>{activeRoom.meta?.[0] || '—'}</span></div>
                                <div title="Room size">▢ <span>{activeRoom.meta?.[1] || '—'}</span></div>
                            </div>

                            <p className="room-overview-desc">
                                {activeRoom.about || 'Comfortable room with elegant décor and all the essentials for a pleasant stay.'}
                            </p>

                            <h4 className="room-subttl">About this room</h4>
                            <p className="room-about">{activeRoom.longAbout || activeRoom.about || ''}</p>

                            <h4 className="room-subttl">Amenities</h4>
                            <ul className="room-amenities">
                                {(activeRoom.amenities ?? ['Sea view', 'Rain shower', 'King bed', 'Smart TV']).map((a, i) => (
                                    <li key={i}>{a}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}