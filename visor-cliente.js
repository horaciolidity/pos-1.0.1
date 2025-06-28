const canal = new BroadcastChannel('pos_channel');
const lista = document.getElementById('lista');
const total = document.getElementById('total');

canal.onmessage = (e) => {
  const data = e.data;

  if (data.tipo === 'carrito') {
    lista.innerHTML = '';
    let totalFinal = 0;

    data.productos.forEach(p => {
      const subtotal = p.precioUnitario * p.cantidad;
      const li = document.createElement('li');
      li.textContent = `${p.cantidad} x ${p.nombre} ($${p.precioUnitario.toFixed(2)}) = $${subtotal.toFixed(2)}`;
      lista.appendChild(li);
      totalFinal += subtotal;
    });

    total.textContent = totalFinal.toFixed(2);
  }

  if (data.tipo === 'reset') {
    lista.innerHTML = '';
    total.textContent = '0.00';
  }

  if (data.tipo === 'despedida') {
    lista.innerHTML = '';
    const mensaje = document.createElement('li');
    mensaje.textContent = 'GRACIAS Y VUELVA PRONTO';
    mensaje.style.textAlign = 'center';
    mensaje.style.fontSize = '40px';
    mensaje.style.color = '#ffff00';
    mensaje.style.textShadow = '0 0 10px #ff0';
    lista.appendChild(mensaje);

    total.textContent = '0.00';

    // Restaurar a estado inicial luego de 10 segundos
    setTimeout(() => {
      lista.innerHTML = '';
      total.textContent = '0.00';
    }, 10000);
  }
};


function cargarHistorialCliente() {
  const id = localStorage.getItem('clienteSeleccionado');
  const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
  const c = clientes.find(cl => cl.id === id);
  const divHist = document.getElementById('historial');
  const tbody   = document.getElementById('tablaHistorial');

  if (!c) {
    divHist.style.display = 'none';
    return;
  }

  // Cabeceras
  document.getElementById('tituloHistorial').textContent =
    `Historial de ventas – ${c.nombre}`;
  document.getElementById('deudaHistorial').textContent =
    `💰 Total adeudado: $${c.saldo.toFixed(2)}`;

  // Tabla
  tbody.innerHTML = '';
  if (!c.historial || c.historial.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;">Sin ventas registradas</td></tr>';
  } else {
    c.historial.forEach(reg => {
      const [f,h] = reg.fecha.split(',').map(t=>t.trim());
      reg.productos.forEach(p=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${f}</td><td>${h}</td>
          <td>${p.detalle}</td><td>${p.cantidad}</td>
          <td>$${p.precio.toFixed(2)}</td>`;
        tbody.appendChild(tr);
      });
    });
  }
}

/* -----------------------------------------------------------
   3) Toggle de la vista historial
----------------------------------------------------------- */
document.getElementById('toggleHistorial').addEventListener('click',()=>{
  const div = document.getElementById('historial');
  if(div.style.display==='none'||!div.style.display){
    cargarHistorialCliente();
    div.style.display='block';
    document.getElementById('toggleHistorial').textContent='Ocultar historial';
  }else{
    div.style.display='none';
    document.getElementById('toggleHistorial').textContent='Ver historial del cliente';
  }
});
