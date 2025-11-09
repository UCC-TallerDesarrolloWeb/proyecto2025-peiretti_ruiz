import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Layout from '@components/Layout'
import {lazy} from 'react'

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
