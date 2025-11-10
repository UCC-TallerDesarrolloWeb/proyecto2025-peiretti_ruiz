// src/pages/Payment.jsx
import {useEffect, useState} from 'react'
import Input from '@components/Input'
import '@styles/_payment.scss'

import {
    keepDigits, isDigits, isExpiryMMYY, formatPrice,
    normalizeMMYY, isExpiredMMYY, formatCardGroups
} from '@utils/validation'

import {
    sanitizeName,
    sanitizeEmail,
    sanitizePhone,
    validateContact,
    CONTACT_LIMITS,
} from '@utils/contactValidation'

// API (json-server)
import {getSummary, clearSummary} from '@api/summaryApi'

const INITIAL_FORM = {
    fname: '', lname: '', email: '', phone: '',
    card: '', namec: '', exp: '', cvv: '',
    address: '', country: '', zip: ''
}

export default function Payment() {
    const [sum, setSum] = useState(null)
    const [form, setForm] = useState(INITIAL_FORM)
    const [err, setErr] = useState({})
    const set = (k, v) => setForm(s => ({...s, [k]: v}))

    // Carga el resumen desde la API. Si no hay, vuelve a Booking.
    useEffect(() => {
        (async () => {
            const d = await getSummary()
            if (!d || (d.totalRooms === 0 && d.nights === 0)) {
                window.location.replace('/booking')
                return
            }
            setSum(d)
        })()
    }, [])

    const validate = () => {
        // Validación compartida (sin exigir message)
        const {errors: sharedErrs} = validateContact(
            {fname: form.fname, lname: form.lname, email: form.email, phone: form.phone},
            {requireMessage: false}
        )
        const e = {...sharedErrs}

        const cn = keepDigits(form.card)
        if (!cn || cn.length < 13 || cn.length > 19) e.card = 'Invalid card number'

        if (!sanitizeName(form.namec)) e.namec = 'Letters only'

        if (!isExpiryMMYY(form.exp)) e.exp = 'Invalid MM/YY'
        else if (isExpiredMMYY(form.exp)) e.exp = 'Card expired'

        if (keepDigits(form.cvv).length !== 3) e.cvv = 'CVV 3 digits'

        if (!form.address) e.address = 'Required'
        if (!form.country) e.country = 'Select a country'
        if (form.zip && !isDigits(form.zip)) e.zip = 'Digits only'

        setErr(e)
        return Object.keys(e).length === 0
    }

    const submit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        alert('Payment successful! Confirmation sent.')

        // SOLO limpia cuando el pago es exitoso
        await clearSummary()
        setForm(INITIAL_FORM)
        setErr({})

        // Redirige a home
        window.location.replace('/')
    }

    if (!sum) return null

    return (
        <div className="pay-wrap">
            <h1 className="titulo titulo-payment">PAYMENT</h1>

            <div className="pay-grid">
                {/* FORM */}
                <section className="card">
                    <h2>Guest & Payment details</h2>

                    <form className="pay-form" onSubmit={submit} noValidate>
                        {/* Personales */}
                        <Input label="First name" value={form.fname}
                               onChange={e => set('fname', sanitizeName(e.target.value))} error={err.fname}/>
                        <Input label="Last name" value={form.lname}
                               onChange={e => set('lname', sanitizeName(e.target.value))} error={err.lname}/>
                        <Input label="Email" type="email" value={form.email}
                               onChange={e => set('email', sanitizeEmail(e.target.value))} error={err.email}/>
                        <Input label="Phone" value={form.phone}
                               onChange={e => set('phone', sanitizePhone(e.target.value).slice(0, CONTACT_LIMITS.phoneMax))}
                               error={err.phone}/>

                        <hr/>

                        {/* Tarjeta */}
                        <Input label="Card number" value={form.card}
                               onChange={e => set('card', formatCardGroups(e.target.value))}
                               error={err.card}/>
                        <Input label="Name on card" value={form.namec}
                               onChange={e => set('namec', sanitizeName(e.target.value))} error={err.namec}/>
                        <Input label="Expiry (MM/YY)" value={form.exp}
                               onChange={e => set('exp', normalizeMMYY(e.target.value))} error={err.exp}/>
                        <Input label="CVV" value={form.cvv}
                               onChange={e => set('cvv', keepDigits(e.target.value).slice(0, 3))} error={err.cvv}/>

                        <hr/>

                        {/* Billing */}
                        <div className="field field-full">
                            <label htmlFor="address">Billing address</label>
                            <input id="address" name="address" autoComplete="address-line1" maxLength={40}
                                   value={form.address} onChange={e => set('address', e.target.value)}/>
                            <div role="alert" aria-live="polite" className="field-error">{err.address || ''}</div>
                        </div>

                        <div className="field">
                            <label htmlFor="country">Country</label>
                            <select id="country" name="country" value={form.country}
                                    onChange={e => set('country', e.target.value)}>
                                <option value="">Select…</option>
                                <option>Argentina</option>
                                <option>Chile</option>
                                <option>Uruguay</option>
                                <option>Brazil</option>
                                <option>United States</option>
                                <option>Spain</option>
                            </select>
                            <div role="alert" aria-live="polite" className="field-error">{err.country || ''}</div>
                        </div>

                        <div className="field">
                            <label htmlFor="zip">ZIP/Postal code</label>
                            <input id="zip" name="zip" autoComplete="postal-code" inputMode="numeric" maxLength={4}
                                   placeholder="____" value={form.zip}
                                   onChange={e => set('zip', keepDigits(e.target.value).slice(0, 4))}/>
                            <div role="alert" aria-live="polite" className="field-error">{err.zip || ''}</div>
                        </div>

                        <div className="field-full">
                            <button className="btn-primary btn-pay">Pay now</button>
                        </div>

                        <p className="field-full payment-note muted">
                            Your card will be charged the total shown. You'll receive a confirmation email.
                        </p>
                    </form>
                </section>

                {/* RESUMEN */}
                <aside className="resumen">
                    <h3 className="resumen-title">Your Reservation</h3>
                    <div className="resumen-line"><span>Check-In:</span><span>{sum.checkin}</span></div>
                    <div className="resumen-line"><span>Check-Out:</span><span>{sum.checkout}</span></div>
                    <div className="resumen-line"><span>Nights:</span><span>{sum.nights}</span></div>

                    <div id="sum-rooms">
                        {sum.rooms.map(r => (
                            <div className="sum-row" key={r.id}>
                                <span>{r.qty} {r.name}</span>
                                <strong>{formatPrice(r.qty * r.price * sum.nights)}</strong>
                            </div>
                        ))}
                    </div>

                    <div className="resumen-total"><span>Total</span><span>{formatPrice(sum.total)}</span></div>
                    <p className="modify-selection">
                        <a href="/booking">Modify selection</a>
                    </p>
                </aside>
            </div>
        </div>
    )
}