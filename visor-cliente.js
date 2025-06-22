const canal = new BroadcastChannel('pos_channel');
const lista = document.getElementById('productos');
const total = document.getElementById('total');

canal.onmessage = (e) => {
  const { nombre, precio, totalActual } = e.data;
  const li = document.createElement('li');
  li.textContent = `${nombre} - $${precio.toFixed(2)}`;
  lista.appendChild(li);
  total.textContent = totalActual.toFixed(2);
};
