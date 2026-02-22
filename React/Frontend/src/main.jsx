import React from 'react'
import ReactDOM from 'react-dom/client' // ReactDOM es el puente entre React y el navegador
import App from './App.jsx' // El componente raíz que contiene toda la app (rutas, layout, páginas)

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App/> // Renderiza el componente App dentro del elemento con id "root" en el HTML. Esto es lo que hace que la
        aplicación se muestre en el navegador.
    </React.StrictMode>
)
