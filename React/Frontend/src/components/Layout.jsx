import {Outlet, NavLink} from 'react-router-dom'
import '@styles/layout.scss'
import Footer from '@components/Footer'

export default function Layout() {
    return (
        <>
            <header className="header">
                <nav aria-label="Principal">
                    <ul className="nav container">
                        <li><NavLink to="/">Home</NavLink></li>
                        <li><NavLink to="/booking">Book a Room</NavLink></li>
                        <li><NavLink to="/about">About</NavLink></li>
                        <li><NavLink to="/contact">Contact</NavLink></li>
                    </ul>
                </nav>
            </header>

            <main className="main-content container">
                <Outlet/>
                {/* Outlet es donde aparece la página activa según la ruta
                ej: si estoy en /booking → aparece Booking.jsx acá
                container → clase SCSS que limita el ancho y centra */}
            </main>

            <Footer/>
        </>
    )
}
