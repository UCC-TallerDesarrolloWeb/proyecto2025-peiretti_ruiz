export const formatPrice = (price) => {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS", 
    style: "currency",
    }).format(price);
  };
  