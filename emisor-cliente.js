const canal = new BroadcastChannel('pos_channel');
let totalCliente = 0;

function notificarCliente(nombre, precio, cantidad) {
  const subtotal = precio * cantidad;
  totalCliente += subtotal;
  canal.postMessage({
    tipo: 'producto',
    nombre,
    precio,
    cantidad,
    subtotal,
    totalActual: totalCliente
  });
}
function resetCliente() {
  totalCliente = 0;
  canal.postMessage({ tipo: 'reset' });
}
