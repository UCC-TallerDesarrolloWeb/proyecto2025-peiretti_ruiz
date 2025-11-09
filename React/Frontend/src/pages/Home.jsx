import '@styles/_home.scss'
import hero from '@assets/principal.jpg'

export default function Home() {
    return (
        <section
            className="hero"
            style={{backgroundImage: `url(${hero})`}}
        >
            <h1 id="titulo-principal">Welcome to Santorini Blue</h1>
        </section>
    )
}
