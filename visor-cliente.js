/* visor-cliente.js  —  reemplazo total
   Muestra carrito en vivo + historial del cliente SIN botón
------------------------------------------------------------- */

/* Canal de comunicación con la caja */
const canal = new BroadcastChannel('pos_channel');

/* Elementos de la pantalla */
const lista  = document.getElementById('lista');
const total  = document.getElementById('total');

/* -----------------------------------------------------------
   1) Render del carrito que llega desde la caja
----------------------------------------------------------- */
function renderCarrito(productos = []) {
  lista.innerHTML = '';
  let totalFinal = 0;

  productos.forEach(p => {
    const subtotal = p.precioUnitario * p.cantidad;
    const li = document.createElement('li');
    li.textContent =
      `${p.cantidad} x ${p.nombre} ($${p.precioUnitario.toFixed(2)}) = $${subtotal.toFixed(2)}`;
    lista.appendChild(li);
    totalFinal += subtotal;
  });

  total.textContent = totalFinal.toFixed(2);
}

/* -----------------------------------------------------------
   2) Historial del cliente activo (se muestra siempre)
----------------------------------------------------------- */
function cargarHistorialCliente() {
  const id        = localStorage.getItem('clienteSeleccionado');
  const clientes  = JSON.parse(localStorage.getItem('clientes')) || [];
  const c         = clientes.find(cl => cl.id === id);

  const divHist   = document.getElementById('historial');
  const tbody     = document.getElementById('tablaHistorial');

  /* Si no hay cliente seleccionado, ocultamos la sección */
  if (!c) {
    divHist.style.display = 'none';
    return;
  }
  divHist.style.display = 'block';

  /* Cabeceras */
  document.getElementById('tituloHistorial').textContent =
    `Historial de ventas – ${c.nombre}`;
  document.getElementById('deudaHistorial').textContent =
    `💰 Total adeudado: $${c.saldo.toFixed(2)}`;

  /* Tabla */
  tbody.innerHTML = '';

  if (!c.historial || c.historial.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;">Sin ventas registradas</td></tr>';
    return;
  }

  c.historial.forEach(reg => {
    const [fecha, hora] = reg.fecha.split(',').map(t => t.trim());
    reg.productos.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fecha}</td>
        <td>${hora}</td>
        <td>${p.detalle}</td>
        <td>${p.cantidad}</td>
        <td>$${p.precio.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    });
  });
}

/* -----------------------------------------------------------
   3) Inicializar historial al cargar la página
----------------------------------------------------------- */
cargarHistorialCliente();

/* -----------------------------------------------------------
   4) Escuchar mensajes de la caja
----------------------------------------------------------- */
canal.onmessage = e => {
  const data = e.data;

  if (data.tipo === 'carrito') {
    renderCarrito(data.productos);
  }

  if (data.tipo === 'reset') {
    renderCarrito([]);
  }

  if (data.tipo === 'despedida') {
    renderCarrito([]);
    const msg = document.createElement('li');
    msg.textContent = 'GRACIAS Y VUELVA PRONTO';
    msg.style.cssText =
      'text-align:center;font-size:40px;color:#ffff00;text-shadow:0 0 10px #ff0';
    lista.appendChild(msg);
    setTimeout(() => renderCarrito([]), 10000);
  }

  /* Tras cada evento, refrescamos historial en tiempo real */
  cargarHistorialCliente();
};
