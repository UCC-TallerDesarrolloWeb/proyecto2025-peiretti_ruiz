import '@styles/index.scss'

export default function Contact() {
  return (
    <>
      <section className="imagen-acostada">
        <img src="/Imagenes/imagencontact.png" alt="Private balcony with Aegean Sea view" />
      </section>

      <section className="container">
        <h1 className="titulo">Contact the Resort</h1>

        <div className="grid-2">
          {/* Datos de contacto */}
          <aside className="card contact-box">
            <h2>We’re here to help</h2>
            <p className="muted">Phone Support (24/7)</p>
            <p className="contact-big">+54 9 351 815 1351</p>

            <div className="contact-social">
              <a aria-label="Instagram"
                 className="soc soc-ig"
                 href="https://www.instagram.com/p/DPKSImIDDjq/?img_index=4&igsh=ZG9sbXh6eHU5bGVu"
                 target="_blank" rel="noopener">Instagram</a>

              <a aria-label="X / Twitter"
                 className="soc soc-x"
                 href="https://x.com/worldipictures/status/1825208695044596010?s=48&t=rODdoYJSeQAQYfGSVWoi_A"
                 target="_blank" rel="noopener">X</a>

              <a aria-label="Facebook"
                 className="soc soc-fb"
                 href="https://www.facebook.com/share/17Pcqp5GcP/?mibextid=wwXIfr"
                 target="_blank" rel="noopener">Facebook</a>
            </div>
          </aside>

          {/* Formulario */}
          <form className="card form contact-form" onSubmit={(e)=>e.preventDefault()} noValidate>
            <h2>Send us a message</h2>

            <div className="field">
              <label htmlFor="c-name">Full name</label>
              <input id="c-name" name="name" type="text" placeholder="Your name" required />
            </div>

            <div className="field">
              <label htmlFor="c-email">Email</label>
              <input id="c-email" name="email" type="email" placeholder="you@email.com" required />
            </div>

            <div className="field">
              <label htmlFor="c-msg">Message</label>
              <textarea id="c-msg" name="message" rows={5} placeholder="How can we help?" required />
            </div>

            <button className="btn btn-primary">Send</button>
            <p className="muted">We usually reply within 24 hours.</p>
          </form>
        </div>

        {/* Mapa */}
        <div className="mapa">
          <iframe
            title="Santorini Blue location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6288.393877"
            style={{ border: 0, width: '100%', height: '360px' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </section>
    </>
  )
}
