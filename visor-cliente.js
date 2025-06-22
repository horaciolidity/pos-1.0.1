const canal = new BroadcastChannel('pos_channel');
const lista = document.getElementById('lista');
const total = document.getElementById('total');

const carritoCliente = {};

canal.onmessage = (e) => {
  const data = e.data;

  if (data.tipo === 'producto') {
    const { nombre, precio, cantidad } = data;

    if (!carritoCliente[nombre]) {
      carritoCliente[nombre] = {
        cantidad: 0,
        precio: precio
      };
    }

    carritoCliente[nombre].cantidad += cantidad;

    renderCarritoCliente();
  }

  if (data.tipo === 'reset') {
    Object.keys(carritoCliente).forEach(k => delete carritoCliente[k]);
    renderCarritoCliente();
  }
};

function renderCarritoCliente() {
  lista.innerHTML = '';
  let totalActual = 0;

  for (const [nombre, info] of Object.entries(carritoCliente)) {
    const subtotal = info.precio * info.cantidad;
    totalActual += subtotal;

    const li = document.createElement('li');
    li.textContent = `${info.cantidad} x ${nombre} ($${info.precio.toFixed(2)}) = $${subtotal.toFixed(2)}`;
    lista.appendChild(li);
  }

  total.textContent = totalActual.toFixed(2);
}
