import { useEffect } from 'react';
import { useState } from 'react';
import { formatPrice } from '@utils/format.js';  
import '@styles/store.scss';

const Store = () => {
    const [products, setProducts] = useState([]);

    const [selected, setSelected] = useState(null);

    const BASE_URL = 'http://localhost:4000/productos';
    const fetchProducts = async () => {
        try {
            const response = await fetch(BASE_URL);
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error en realizar un get en el servicio: ', error);
        }
    }

    useEffect(() => {
        fetchProducts();
    }, [] );

    

    return (
        <>
        <section className='catalogo'>
        { products.map((product) => (
            <div key={product.id} className='card-prod'>
                <p>{product.nombre}</p>
                <img src={'/productos/${product.image}'} alt={product.imagen} />
                <p>{formatPrice(product.precio)}</p>
                <button onClick={() => setSelected(product)}>Ver detalle</button>
            </div>
        )) }
        </section>
        { selected && <div className='modalHabitacion'>
            <h2>Detalle de la Habitacion</h2>
            <p>{selected.nombre}</p>
            <p>{selected.precio}</p>
            <button onClick={() => setSelected(null)}>Cerrar Modal</button>
        </div>}
        </>
    )
    
}

export default Store;