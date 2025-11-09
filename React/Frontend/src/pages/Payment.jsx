import { useEffect, useState } from 'react'
import { load, remove } from '@utils/storage'
import Input from '@components/Input'
import {
  keepDigits, isDigits, isExpiryMMYY, formatPrice
} from '@utils/validation'
import {
  sanitizeName,
  sanitizeEmail,
  sanitizePhone,
  validateContact,
  CONTACT_LIMITS,
} from '@utils/contactValidation'
import '@styles/_payment.scss'

const INITIAL_FORM = {
  fname:'', lname:'', email:'', phone:'',
  card:'', namec:'', exp:'', cvv:'',
  address:'', country:'', zip:''
}

export default function Payment() {
  const [sum, setSum] = useState(null)

  useEffect(() => {
    const d = load('sb_checkout')
    if (!d || !d.total) window.location.replace('/booking')
    setSum(d)
  }, [])

  const [form, setForm] = useState(INITIAL_FORM)
  const [err, setErr] = useState({})

  const set = (k, v) => setForm(s => ({ ...s, [k]: v }))

  // Chequeo de vencimiento (MM/YY)
  const isExpired = (mmYY) => {
    if (!mmYY || mmYY.length !== 5) return true
    const [mmStr, yyStr] = mmYY.split('/')
    const mm = Number(mmStr)
    const fullYear = 2000 + Number(yyStr)
    // Último día del mes a las 23:59:59
    const expDate = new Date(fullYear, mm, 0, 23, 59, 59)
    return expDate < new Date()
  }

  const validate = () => {
    // 1) Validación compartida usando contactValidation.js
    const { errors: sharedErrs } = validateContact({
      fname: form.fname,
      lname: form.lname,
      email: form.email,
      phone: form.phone,  // opcional; se valida max length y dígitos
    })

    // 2) Validaciones específicas de pago
    const e = { ...sharedErrs }

    const cn = keepDigits(form.card)
    if (!cn || cn.length < 13 || cn.length > 19) e.card = 'Invalid card number'

    // "Name on card" solo letras (reutilizamos sanitizeName para la UI, acá validamos que no quede vacío tras sanear)
    if (!sanitizeName(form.namec)) e.namec = 'Letters only'

    if (!isExpiryMMYY(form.exp)) {
      e.exp = 'Invalid MM/YY'
    } else if (isExpired(form.exp)) {
      e.exp = 'Card expired'
    }

    if (keepDigits(form.cvv).length !== 3) e.cvv = 'CVV 3 digits'

    if (!form.address) e.address = 'Required'
    if (!form.country) e.country = 'Select a country'
    if (form.zip && !isDigits(form.zip)) e.zip = 'Digits only'

    setErr(e)
    return Object.keys(e).length === 0
  }

  const submit = (e) => {
    e.preventDefault()
    if (!validate()) return

    alert('Payment successful! Confirmation sent.')
    remove('sb_checkout')
    setForm(INITIAL_FORM)  // limpia campos, NO pone la página en blanco
    setErr({})
  }

  if (!sum) return null

  return (
    <div className="pay-wrap">
      <h1 className="titulo titulo-payment">PAYMENT</h1>
      <div className="pay-grid">
        <section className="card">
          <h2>Guest & Payment details</h2>
          <form className="pay-form" onSubmit={submit} noValidate>
            {/* Campos compartidos con sanitización desde contactValidation */}
            <Input
              label="First name"
              value={form.fname}
              onChange={e => set('fname', sanitizeName(e.target.value))}
              error={err.fname}
            />
            <Input
              label="Last name"
              value={form.lname}
              onChange={e => set('lname', sanitizeName(e.target.value))}
              error={err.lname}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={e => set('email', sanitizeEmail(e.target.value))}
              error={err.email}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={e => set('phone', sanitizePhone(e.target.value).slice(0, CONTACT_LIMITS.phoneMax))}
              error={err.phone}
            />

            <hr/>

            {/* Datos de tarjeta */}
            <Input
              label="Card number"
              value={form.card}
              onChange={e => {
                const digits = keepDigits(e.target.value).slice(0,19)
                const groups = []
                for (let i=0; i<digits.length; i+=4) groups.push(digits.slice(i,i+4))
                set('card', groups.join(' '))
              }}
              error={err.card}
            />
            <Input
              label="Name on card"
              value={form.namec}
              onChange={e => set('namec', sanitizeName(e.target.value))}
              error={err.namec}
            />
            <Input
              label="Expiry (MM/YY)"
              value={form.exp}
              onChange={e => {
                const d = keepDigits(e.target.value).slice(0,4)
                set('exp', d.length <= 2 ? d : `${d.slice(0,2)}/${d.slice(2)}`)
              }}
              error={err.exp}
            />
            <Input
              label="CVV"
              value={form.cvv}
              onChange={e => set('cvv', keepDigits(e.target.value).slice(0,3))}
              error={err.cvv}
            />

            <hr />

            {/* Billing */}
            <div className="field field-full">
              <label htmlFor="address">Billing address</label>
              <input
                id="address"
                name="address"
                autoComplete="address-line1"
                maxLength={40}
                value={form.address}
                onChange={e => set('address', e.target.value)}
              />
              <div role="alert" aria-live="polite" className="field-error">
                {err.address || ''}
              </div>
            </div>

            <div className="field">
              <label htmlFor="country">Country</label>
              <select
                id="country"
                name="country"
                value={form.country}
                onChange={e => set('country', e.target.value)}
              >
                <option value="">Select…</option>
                <option>Argentina</option>
                <option>Chile</option>
                <option>Uruguay</option>
                <option>Brazil</option>
                <option>United States</option>
                <option>Spain</option>
              </select>
              <div role="alert" aria-live="polite" className="field-error">
                {err.country || ''}
              </div>
            </div>

            <div className="field">
              <label htmlFor="zip">ZIP/Postal code</label>
              <input
                id="zip"
                name="zip"
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={4}
                placeholder="____"
                value={form.zip}
                onChange={e => set('zip', keepDigits(e.target.value).slice(0,4))}
              />
              <div role="alert" aria-live="polite" className="field-error">
                {err.zip || ''}
              </div>
            </div>

            <div className="field-full">
              <button className="btn-primary btn-pay">Pay now</button>
            </div>

            <p className="field-full payment-note muted">
              Your card will be charged the total shown. You’ll receive a confirmation email.
            </p>
          </form>
        </section>

        <aside className="resumen">
          <h3 className="resumen-title">Your Reservation</h3>
          <div className="resumen-line"><span>Check-In:</span><span>{sum.checkin}</span></div>
          <div className="resumen-line"><span>Check-Out:</span><span>{sum.checkout}</span></div>
          <div className="resumen-line"><span>Nights:</span><span>{sum.nights}</span></div>
          <div id="sum-rooms">
            {sum.rooms.map(r=>(
              <div className="sum-row" key={r.id}>
                <span>{r.qty} {r.name}</span>
                <strong>{formatPrice(r.qty * r.price * sum.nights)}</strong>
              </div>
            ))}
          </div>
          <div className="resumen-total"><span>Total</span><span>{formatPrice(sum.total)}</span></div>
          <p style={{marginTop: 8}}>
            <a href="/booking">Modify selection</a>
          </p>
        </aside>
      </div>
    </div>
  )
}
