import { useEffect, useState } from 'react'
import { load, remove } from '@utils/storage'
import Input from '@components/Input'
import { keepDigits, keepLetters, isLetters, isDigits, isEmailBasic, isExpiryMMYY, formatPrice } from '@utils/validation'

export default function Payment() {
  const [sum, setSum] = useState(null)

  useEffect(() => {
    const d = load('sb_checkout')
    if (!d || !d.total) window.location.replace('/booking')
    setSum(d)
  }, [])

  const [form, setForm] = useState({ fname:'', lname:'', email:'', phone:'', card:'', namec:'', exp:'', cvv:'' })
  const [err, setErr] = useState({})

  const set = (k, v) => setForm(s => ({ ...s, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.fname || !isLetters(form.fname)) e.fname = 'First name: letters only'
    if (!form.lname || !isLetters(form.lname)) e.lname = 'Last name: letters only'
    if (!form.email || !isEmailBasic(form.email)) e.email = 'Invalid email'
    if (form.phone && !isDigits(form.phone)) e.phone = 'Digits only'
    const cn = keepDigits(form.card)
    if (!cn || cn.length < 13 || cn.length > 19) e.card = 'Invalid card number'
    if (!form.namec || !isLetters(form.namec)) e.namec = 'Letters only'
    if (!isExpiryMMYY(form.exp)) e.exp = 'Invalid MM/YY'
    if (keepDigits(form.cvv).length !== 3) e.cvv = 'CVV 3 digits'
    setErr(e)
    return Object.keys(e).length === 0
  }

  const submit = (e) => {
    e.preventDefault()
    if (!validate()) return
    alert('Payment successful! Confirmation sent.')
    remove('sb_checkout')
  }

  if (!sum) return null

  return (
    <div className="pay-wrap">
      <h1 className="titulo titulo-payment">PAYMENT</h1>
      <div className="pay-grid">
        <section className="card">
          <h2>Guest & Payment details</h2>
          <form className="pay-form" onSubmit={submit} noValidate>
            <Input label="First name" value={form.fname} onChange={e=>set('fname', keepLetters(e.target.value))} error={err.fname}/>
            <Input label="Last name"  value={form.lname} onChange={e=>set('lname', keepLetters(e.target.value))} error={err.lname}/>
            <Input label="Email" type="email" value={form.email} onChange={e=>set('email', e.target.value)} error={err.email}/>
            <Input label="Phone" value={form.phone} onChange={e=>set('phone', keepDigits(e.target.value))} error={err.phone}/>
            <hr/>
            <Input label="Card number" value={form.card} onChange={e=>{
              const digits = keepDigits(e.target.value).slice(0,19)
              const groups = []
              for (let i=0;i<digits.length;i+=4) groups.push(digits.slice(i,i+4))
              set('card', groups.join(' '))
            }} error={err.card}/>
            <Input label="Name on card" value={form.namec} onChange={e=>set('namec', keepLetters(e.target.value))} error={err.namec}/>
            <Input label="Expiry (MM/YY)" value={form.exp} onChange={e=>{
              const d = keepDigits(e.target.value).slice(0,4)
              set('exp', d.length<=2? d : `${d.slice(0,2)}/${d.slice(2)}`)
            }} error={err.exp}/>
            <Input label="CVV" value={form.cvv} onChange={e=>set('cvv', keepDigits(e.target.value).slice(0,3))} error={err.cvv}/>
            <div className="field-full"><button className="btn-primary btn-pay">Pay now</button></div>
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
        </aside>
      </div>
    </div>
  )
}
