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
};
