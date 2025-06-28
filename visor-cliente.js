/* ============================================================
   VISOR CLIENTE
   - Carrito en vivo   ← canal "pos_channel"
   - Historial on-demand← canal "cliente_channel"
============================================================ */

/////////////////////////////
// 1) REFERENCIAS DOM
/////////////////////////////
const lista      = document.getElementById('lista');
const totalSpan  = document.getElementById('total');
const divHist    = document.getElementById('historial');
const tituloHist = document.getElementById('tituloHistorial');
const deudaHist  = document.getElementById('deudaHistorial');
const tbodyHist  = document.getElementById('tablaHistorial');

/////////////////////////////
// 2) CANALES
/////////////////////////////
const canalCarrito  = new BroadcastChannel('pos_channel');      // carrito en vivo
const canalControl  = new BroadcastChannel('cliente_channel');  // mostrar/ocultar historial

/////////////////////////////
// 3) ESTADO LOCAL
/////////////////////////////
let historialActivo   = false;
let clienteActivoId   = null;

/////////////////////////////
// 4) RENDER CARRITO
/////////////////////////////
function renderCarrito(productos = []) {
  lista.innerHTML = '';
  let total = 0;

  productos.forEach(p => {
    const subtotal = p.precioUnitario * p.cantidad;
    const li = document.createElement('li');
    li.textContent = `${p.cantidad} x ${p.nombre} ($${p.precioUnitario.toFixed(2)}) = $${subtotal.toFixed(2)}`;
    lista.appendChild(li);
    total += subtotal;
  });

  totalSpan.textContent = total.toFixed(2);
}

/////////////////////////////
// 5) RENDER / LIMPIAR HISTORIAL
/////////////////////////////
function renderHistorial(clienteId) {
  const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
  const c = clientes.find(cli => cli.id === clienteId);

  if (!c) { clearHistorial(); return; }

  // Cabeceras
  tituloHist.textContent = `Historial de ventas – ${c.nombre}`;
  deudaHist.textContent  = `💰 Total adeudado: $${c.saldo.toFixed(2)}`;

  // Tabla
  tbodyHist.innerHTML = '';
  if (!c.historial || c.historial.length === 0) {
    tbodyHist.innerHTML =
      '<tr><td colspan="5" style="text-align:center;">Sin ventas registradas</td></tr>';
  } else {
    c.historial.forEach(reg => {
      const [f,h] = reg.fecha.split(',').map(t => t.trim());
      reg.productos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${f}</td><td>${h}</td>
          <td>${p.detalle}</td><td>${p.cantidad}</td>
          <td>$${p.precio.toFixed(2)}</td>`;
        tbodyHist.appendChild(tr);
      });
    });
  }

  divHist.style.display = 'block';
  historialActivo = true;
  clienteActivoId = clienteId;
}

function clearHistorial() {
  divHist.style.display = 'none';
  tbodyHist.innerHTML   = '';
  historialActivo       = false;
  clienteActivoId       = null;
}

/////////////////////////////
// 6) ESCUCHAR CANAL CONTROL
/////////////////////////////
canalControl.onmessage = ev => {
  const { tipo, clienteId } = ev.data;

  if (tipo === 'mostrar_historial') {
    renderHistorial(clienteId);
  }

  if (tipo === 'ocultar_historial') {
    clearHistorial();
  }
};

/////////////////////////////
// 7) ESCUCHAR CARRITO EN VIVO
/////////////////////////////
canalCarrito.onmessage = ev => {
  const data = ev.data;

  if (data.tipo === 'carrito')        renderCarrito(data.productos);
  if (data.tipo === 'reset')          renderCarrito([]);
  if (data.tipo === 'despedida') {
    renderCarrito([]);
    const msg = document.createElement('li');
    msg.textContent = 'GRACIAS Y VUELVA PRONTO';
    msg.style.cssText = 'text-align:center;font-size:40px;color:#ff0;text-shadow:0 0 10px #ff0';
    lista.appendChild(msg);
    setTimeout(() => renderCarrito([]), 10000);
  }

  /* Si el historial está activo → refrescar deuda y tabla */
  if (historialActivo && clienteActivoId) renderHistorial(clienteActivoId);
};
