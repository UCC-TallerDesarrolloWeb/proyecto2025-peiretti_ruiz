import {useState} from 'react'
import '@styles/_contact.scss'
import {
    sanitizeName,
    sanitizeEmail,
    sanitizePhone,
    sanitizeMessage,
    validateContact,
    CONTACT_LIMITS,
} from '@utils/contactValidation'

export default function Contact() {
    const [form, setForm] = useState({
        fname: '',
        lname: '',
        email: '',
        ccode: '+30',
        phone: '',
        message: '',
    })

    const [err, setErr] = useState({})

    const set = (k, v) => setForm((s) => ({...s, [k]: v}))

    const submit = (e) => {
        e.preventDefault()
        const {ok, errors} = validateContact(form)
        setErr(errors)
        if (!ok) return

        alert('Message sent successfully! We will contact you soon.')
        setForm({fname: '', lname: '', email: '', ccode: '+30', phone: '', message: ''})
        setErr({})
    }

    return (
        <>
            <section className="imagen-acostada">
                <img src="/images/imagencontact.png" alt="Private balcony with Aegean Sea view"/>
            </section>

            <section className="container">
                <h1 className="titulo">Contact the Resort</h1>

                {/* Redes sociales */}
                <div className="contact-social">
                    <a href="https://www.instagram.com/..." aria-label="Instagram" target="_blank" rel="noopener">
                        <img src="/images/instaLogo.png" alt="Instagram" className="soc" />
                    </a>
                    <a href="https://x.com/..." aria-label="Twitter" target="_blank" rel="noopener">
                        <img src="/images/twitLogo.png" alt="Twitter" className="soc" />
                    </a>
                    <a href="https://www.facebook.com/..." aria-label="Facebook" target="_blank" rel="noopener">
                        <img src="/images/faceLogo.png" alt="Facebook" className="soc" />
                    </a>
                </div>

                {/* Mapa */}
                <div className="mapa">
                    <iframe
                        title="Santorini Blue location"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6288.393877956319!2d25.4297!3d36.4624!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1499cbf3e1f3df1f%3A0x4c8cb2c7b1b8d9b!2sOia%2C%20Santorini!5e0!3m2!1sen!2sgr!4v0000000000000"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                    />
                </div>

                {/* Formulario con validación */}
                <form className="contact-form" noValidate onSubmit={submit}>
                    <div className="field">
                        <label htmlFor="fname">First name *</label>
                        <input
                            id="fname"
                            name="fname"
                            type="text"
                            placeholder="Write your name"
                            value={form.fname}
                            onChange={(e) => set('fname', sanitizeName(e.target.value))}
                            required
                        />
                        <div role="alert" aria-live="polite" className="field-error">
                            {err.fname || ''}
                        </div>
                    </div>

                    <div className="field">
                        <label htmlFor="lname">Last name *</label>
                        <input
                            id="lname"
                            name="lname"
                            type="text"
                            placeholder="Write your last name"
                            value={form.lname}
                            onChange={(e) => set('lname', sanitizeName(e.target.value))}
                            required
                        />
                        <div role="alert" aria-live="polite" className="field-error">
                            {err.lname || ''}
                        </div>
                    </div>

                    <div className="field">
                        <label htmlFor="email">Email *</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@mail.com"
                            value={form.email}
                            onChange={(e) => set('email', sanitizeEmail(e.target.value))}
                            required
                        />
                        <div role="alert" aria-live="polite" className="field-error">
                            {err.email || ''}
                        </div>
                    </div>

                    <div className="field phone-field">
                        <label htmlFor="phone">Phone</label>
                        <div className="phone-input">
                            <select
                                aria-label="Country code"
                                name="ccode"
                                value={form.ccode}
                                onChange={(e) => set('ccode', e.target.value)}
                            >
                                <option value="+30">+30</option>
                                <option value="+54">+54</option>
                                <option value="+34">+34</option>
                                <option value="+44">+44</option>
                                <option value="+1">+1</option>
                            </select>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                inputMode="tel"
                                placeholder="___ ___ ___"
                                maxLength={CONTACT_LIMITS.phoneMax}
                                value={form.phone}
                                onChange={(e) => set('phone', sanitizePhone(e.target.value))}
                            />
                        </div>
                        <div role="alert" aria-live="polite" className="field-error">
                            {err.phone || ''}
                        </div>
                    </div>

                    <div className="field field-full">
                        <label htmlFor="message">Type your message here...</label>
                        <textarea
                            id="message"
                            name="message"
                            rows={6}
                            maxLength={CONTACT_LIMITS.msgMax}
                            placeholder="Max 500 characters"
                            value={form.message}
                            onChange={(e) => set('message', sanitizeMessage(e.target.value))}
                        />
                        <div role="alert" aria-live="polite" className="field-error">
                            {err.message || ''}
                        </div>
                    </div>

                    <div className="actions">
                        <button className="btn btn-primary" type="submit">
                            Submit
                        </button>
                    </div>
                </form>
            </section>
        </>
    )
}
