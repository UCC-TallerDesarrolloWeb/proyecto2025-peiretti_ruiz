import '@styles/index.scss'

export default function About() {
  return (
    <>
      <section className="imagen-acostada">
        {/* en /public podés poner Imagenes/imagenabout.png; se referencia directo */}
        <img src="/Imagenes/imagenabout.png" alt="Atardecer en Santorini" />
      </section>

      <section className="container about">
        <h1 className="titulo">About us</h1>

        <div className="grid-2">
          <article>
            <h2>Nuestra esencia</h2>
            <p>
              Santorini Blue nace del amor por la isla y su cultura. Somos un pequeño hotel
              independiente enfocado en hospitalidad genuina, descanso y experiencias locales.
            </p>
            <p>
              Apostamos por proveedores de cercanía, gastronomía mediterránea y un servicio
              personalizado para cada huésped.
            </p>
          </article>

          <aside className="card">
            <h3>Servicios</h3>
            <ul className="lista-check">
              <li>Desayuno artesanal</li>
              <li>Piscina con vista</li>
              <li>Traslados (a pedido)</li>
              <li>Wi-Fi de alta velocidad</li>
              <li>Asesoría de tours</li>
            </ul>
          </aside>
        </div>

        <div className="mosaico">
          <figure>
            <img src="/images/about1.jpg" alt="Balcón con vistas al Egeo" />
            <figcaption>Habitaciones con balcón</figcaption>
          </figure>
          <figure>
            <img src="/images/about2.jpg" alt="Piscina infinita" />
            <figcaption>Piscina infinita</figcaption>
          </figure>
          <figure>
            <img src="/images/about3.jpg" alt="Desayuno mediterráneo" />
            <figcaption>Sabores mediterráneos</figcaption>
          </figure>
        </div>
      </section>
    </>
  )
}
