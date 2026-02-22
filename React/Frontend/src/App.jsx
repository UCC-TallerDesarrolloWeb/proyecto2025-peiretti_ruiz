import {BrowserRouter, Routes, Route} from 'react-router-dom' // BrowserRouter es el componente que envuelve toda la aplicación y permite usar las rutas. Routes es el componente que contiene todas las rutas. Route es el componente que define una ruta específica.
import Layout from '@components/Layout' // Layout es el "esqueleto" de la página: header + footer + <Outlet/>
import {lazy} from 'react'  // lazy es una función que permite cargar un componente de forma asíncrona, es decir, solo cuando se necesite. Esto mejora el rendimiento 

const Home = lazy(() => import('@pages/Home'))
const Booking = lazy(() => import('@pages/Booking'))
const Payment = lazy(() => import('@pages/Payment'))
const About = lazy(() => import('@pages/About'))
const Contact = lazy(() => import('@pages/Contact'))

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout/>}>
                    <Route path="/" element={<Home/>}/>
                    <Route path="/booking" element={<Booking/>}/>
                    <Route path="/payment" element={<Payment/>}/>
                    <Route path="/about" element={<About/>}/>
                    <Route path="/contact" element={<Contact/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}