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
