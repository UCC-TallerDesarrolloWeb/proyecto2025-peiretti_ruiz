const BASE_URL = 'http://localhost:4000/cart';

export async function addToCart(product) {
    const newItem = {
        productId: product.id,
        nombre: product.nombre,
        unitPrice: product.precio,
        qty: 1,
        Imagen: product.imagen
    }
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {"content-type": "application/json"},
        body: JSON.stringify(newItem)
        });
    if (!res.ok) throw new Error('Error al agregar al carrito');
    return await res.json();
}   
    
