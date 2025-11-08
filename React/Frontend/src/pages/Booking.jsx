// src/pages/Booking.jsx
import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { save } from '@utils/storage'
import { validateDates, calcNights, parseISODate, formatPrice, pluralize } from '@utils/validation'
import '@styles/_booking.scss'

import db from '@data/db.json'
const ROOMS = db.rooms

const PRICES = { std: 200, sup: 300, fam: 400 }

export default function Booking() {
  const nav = useNavigate()

  const [checkin, setIn] = useState('')
  const [checkout, setOut] = useState('')
  const [qty, setQty] = useState({ std: 0, sup: 0, fam: 0 })
  const [dateErr, setDateErr] = useState('')

  const nights = useMemo(
    () => calcNights(parseISODate(checkin), parseISODate(checkout)),
    [checkin, checkout]
  )

  const total = useMemo(() => {
    const sum = qty.std * PRICES.std + qty.sup * PRICES.sup + qty.fam * PRICES.fam
    return sum * (nights || 0)
  }, [qty, nights])

  const onSearch = (e) => {
    e.preventDefault()
    const err = validateDates(checkin, checkout)
    setDateErr(err || '')
  }

  const continuePayment = () => {
    const err = validateDates(checkin, checkout)
    if (err) return setDateErr(err)
    const totalRooms = qty.std + qty.sup + qty.fam
    if (!totalRooms) return setDateErr('Please add rooms.')

    save('sb_checkout', {
      checkin, checkout, nights,
      rooms: [
        ...(qty.std ? [{ id:'std', name:'Standard Room', qty: qty.std, price: PRICES.std }] : []),
        ...(qty.sup ? [{ id:'sup', name:'Superior Room', qty: qty.sup, price: PRICES.sup }] : []),
        ...(qty.fam ? [{ id:'fam', name:'Family Suite', qty: qty.fam, price: PRICES.fam }] : []),
      ],
      totalRooms,
      total
    })
    nav('/payment')
  }

  useEffect(() => { setDateErr('') }, [checkin, checkout])

  return (
    <>
      {/* imagen superior */}
      <section className="imagen-acostada">
        {/* en public/images */}
        <img src="public/images/imagenBook.png" alt="Santorini sea view" />
      </section>

      <section className="container book">
        <h2 className="titulo titulo-book">BOOK A ROOM</h2>

        {/* Buscador */}
        <form className="book-form" onSubmit={onSearch} noValidate>
          <div className="campo">
            <label>Check-in and check-out</label>
            <div className="rango-fecha">
              <input
                type="date"
                value={checkin}
                onChange={e => setIn(e.target.value)}
                min={new Date().toISOString().slice(0,10)}
              />
              <span className="dash">—</span>
              <input
                type="date"
                value={checkout}
                onChange={e => setOut(e.target.value)}
                min={checkin || new Date().toISOString().slice(0,10)}
              />
            </div>
            <div role="alert" aria-live="polite" className="field-error">{dateErr}</div>
          </div>

          <div className="campo">
            <label>Room and guests</label>
            <select defaultValue="all">
              <option value="all">Show all rooms</option>
              <option value="std">Standard</option>
              <option value="sup">Superior</option>
              <option value="fam">Family Suite</option>
            </select>
          </div>

          <div className="search">
            <button type="submit" className="btn-buscar">Search</button>
          </div>
        </form>

        {/* Lista + Resumen */}
        <div className="rooms rooms-layout rooms--spaced">
          <div className="rooms-list">
            <h3 className="sr-titulo">Select room</h3>

            {ROOMS.map(r => (
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

                  <a className="room-more" href="#" onClick={e => e.preventDefault()}>
                    {r.desc}
                  </a>

                  <div className="room-cant">
                    <span className="qty-label">Add rooms</span>
                    <div className="counter nojs">
                      <button type="button" onClick={() => setQty(s => ({ ...s, [r.id]: Math.max(0, s[r.id]-1) }))}>−</button>
                      <input
                        inputMode="numeric"
                        value={qty[r.id]}
                        onChange={e => {
                          const n = Math.max(0, Math.min(9, Number(e.target.value || 0)))
                          setQty(s => ({ ...s, [r.id]: n }))
                        }}
                      />
                      <button type="button" onClick={() => setQty(s => ({ ...s, [r.id]: Math.min(9, s[r.id]+1) }))}>+</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="resumen">
            <h3 className="resumen-title">Your Reservation</h3>
            <div className="resumen-line"><span>Check-In:</span><span>{checkin || '—'}</span></div>
            <div className="resumen-line"><span>Check-Out:</span><span>{checkout || '—'}</span></div>
            <hr className="resumen-sep" />

            <ul className="resumen-items">
              {Object.entries(qty).filter(([,v])=>v>0).map(([id,v])=>(
                <li key={id}>
                  <span>
                    {pluralize(v, id==='fam'?'Family Suite':id==='sup'?'Superior Room':'Standard Room')}
                    {nights ? `, ${pluralize(nights,'night')}` : ''}
                  </span>
                  <button type="button" className="line-remove" onClick={()=>setQty(s=>({...s,[id]:0}))}>×</button>
                </li>
              ))}
            </ul>

            <p className="resumen-warn" hidden={Object.values(qty).some(v=>v>0)}>Please add rooms</p>
            <hr className="resumen-sep" />

            <div className="resumen-total"><span>Total</span><span>{formatPrice(total)}</span></div>
            <button type="button" className="btn-continue" onClick={continuePayment}>Continue</button>
          </aside>
        </div>
      </section>
    </>
  )
}
