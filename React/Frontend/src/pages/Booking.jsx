// src/pages/Booking.jsx
import {useEffect, useState, useMemo} from 'react'
import {useNavigate} from 'react-router-dom'
import {validateDates, calcNights, parseISODate, formatPrice, pluralize} from '@utils/validation'
import Filters from '@components/Filters'
import * as SummaryAPI from '@api/summaryAppi'
import '@styles/_booking.scss'

import db from '@data/db.json'

const ALL_ROOMS = db.rooms

const PRICES = {std: 200, sup: 300, fam: 400}

export default function Booking() {
    const nav = useNavigate()

    // filtros controlados por Filters.jsx
    const [filters, setFilters] = useState({
        checkin: '',
        checkout: '',
        type: 'all',     // std | sup | fam | all
    })

    const [dateErr, setDateErr] = useState('')
    const [filteredRooms, setFilteredRooms] = useState(null) // null = mostrar todas
    const [qty, setQty] = useState({std: 0, sup: 0, fam: 0}) // espejo local del resumen

    // noches según fechas
    const nights = useMemo(
        () => calcNights(parseISODate(filters.checkin), parseISODate(filters.checkout)),
        [filters.checkin, filters.checkout]
    )

    // total local (para vista rápida); el final lo guarda summaryAppi
    const total = useMemo(() => {
        const sum = qty.std * PRICES.std + qty.sup * PRICES.sup + qty.fam * PRICES.fam
        return sum * (nights || 0)
    }, [qty, nights])

    const roomsShown = filteredRooms ?? ALL_ROOMS

    // Al montar, traer el resumen y poblar qty/fechas
    useEffect(() => {
        (async () => {
            const sum = await SummaryAPI.getSummary()
            // set qty desde lo que haya guardado
            const q = {std: 0, sup: 0, fam: 0}
            for (const r of sum.rooms) q[r.id] = r.qty
            setQty(q)
            // set fechas si existían
            if (sum.checkin || sum.checkout) {
                setFilters(s => ({...s, checkin: sum.checkin || '', checkout: sum.checkout || ''}))
            }
        })()
    }, [])

    // SEARCH (filtrar listado)
    const onSearch = (e) => {
        e.preventDefault()
        const err = validateDates(filters.checkin, filters.checkout)
        if (err) {
            setDateErr(err)
            return
        }
        setDateErr('')

        let r = ALL_ROOMS
        if (filters.type !== 'all') r = r.filter(x => x.id === filters.type)
        setFilteredRooms(r)
    }

    // helper para actualizar qty local + API resumen
    const setQtyAndSync = async (room, nextQty) => {
        // limitar 0..9
        const q = Math.max(0, Math.min(9, Number(nextQty || 0)))
        setQty(s => ({...s, [room.id]: q}))
        await SummaryAPI.upsertRoom({
            id: room.id,
            name: room.name,
            price: room.price,
            qty: q
        })
    }

    // Continuar al pago: guarda fechas + nights en API y recalcula resumen
    const continuePayment = async () => {
        const err = validateDates(filters.checkin, filters.checkout)
        if (err) return setDateErr(err)

        await SummaryAPI.setDates({
            checkin: filters.checkin,
            checkout: filters.checkout,
            nights
        })
        await SummaryAPI.finalize()
        nav('/payment')
    }

    useEffect(() => {
        // si cambian fechas o tipo, quitamos error de fechas
        setDateErr('')
    }, [filters.checkin, filters.checkout, filters.type])

    return (
        <>
            {/* Imagen superior */}
            <section className="imagen-acostada">
                <img src="/images/imagenBook.png" alt="View of Santorini Blue resort"/>
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

                {/* error de fecha visible (debajo del form) */}
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
                                                onClick={() => setQtyAndSync(r, (qty[r.id] || 0) - 1)}
                                            >−
                                            </button>
                                            <input
                                                inputMode="numeric"
                                                value={qty[r.id] || 0}
                                                onChange={e => setQtyAndSync(r, e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setQtyAndSync(r, (qty[r.id] || 0) + 1)}
                                            >+
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <aside className="resumen">
                        <h3 className="resumen-title">Your Reservation</h3>
                        <div className="resumen-line"><span>Check-In:</span><span>{filters.checkin || '—'}</span></div>
                        <div className="resumen-line"><span>Check-Out:</span><span>{filters.checkout || '—'}</span>
                        </div>
                        <hr className="resumen-sep"/>

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
                                        onClick={() => setQtyAndSync(
                                            {
                                                id,
                                                name: id === 'fam' ? 'Family Suite' : id === 'sup' ? 'Superior Room' : 'Standard Room',
                                                price: PRICES[id]
                                            },
                                            0
                                        )}
                                    >×
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <p className="resumen-warn" hidden={Object.values(qty).some(v => v > 0)}>Please add rooms</p>
                        <hr className="resumen-sep"/>

                        <div className="resumen-total"><span>Total</span><span>{formatPrice(total)}</span></div>
                        <button type="button" className="btn-continue" onClick={continuePayment}>Continue</button>
                    </aside>
                </div>
            </section>
        </>
    )
}
