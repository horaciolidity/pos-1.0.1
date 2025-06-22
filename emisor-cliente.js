// emisor-cliente.js
const canal = new BroadcastChannel('pos_channel');
let totalCliente = 0;

function notificarCliente(nombre, precio) {
  totalCliente += precio;
  canal.postMessage({
    nombre,
    precio,
    totalActual: totalCliente
  });
}
