import '@styles/_home.scss'
import hero from '@assets/principal.jpg'

export default function Home() {
    return (
        <section
            className="hero"
            style={{backgroundImage: `url(${hero})`}}
        >
            <h1 id="titulo-principal">Welcome to Santorini Blue</h1>
            {/* si querés el CTA aquí, usa Link para SPA */}
            {/* <Link className="btn-primary" to="/booking">Book a room</Link> */}
        </section>
    )
}
