import '@styles/_home.scss'
import hero from '@assets/principal.jpg' // hero = imagen de fondo

export default function Home() {
    return (
        // section funciona como contenedor del hero
        <section
            className="hero"
            style={{'--hero-bg': `url(${hero})`}}
        >
            <h1 id="titulo-principal">Welcome to Santorini Blue</h1>
        </section>
    )
}

// la imagen  del hero está en /src/assets/ y Vite la renombra con hash al hacer el build, por lo que la única forma de referenciarla correctamente es importándola en JS y pasándola como variable CSS.
// si estuviera en public, no haria falta el style