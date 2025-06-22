// visor-cliente.js
const canal = new BroadcastChannel('pos_channel');
const lista = document.getElementById('lista');
const total = document.getElementById('total');

canal.onmessage = (e) => {
  const data = e.data;

  if (data.tipo === 'producto') {
    const { nombre, precio, cantidad, subtotal, totalActual } = data;
    const li = document.createElement('li');
    li.textContent = `${cantidad} x ${nombre} ($${precio.toFixed(2)}) = $${subtotal.toFixed(2)}`;
    lista.appendChild(li);
    total.textContent = totalActual.toFixed(2);
  }

  if (data.tipo === 'reset') {
    lista.innerHTML = '';
    total.textContent = '0.00';
  }
};
