const canal = new BroadcastChannel('pos_channel');

function enviarCarritoAlCliente() {
  const cartList = document.getElementById('cart');
  const items = Array.from(cartList.children).map(item => {
    return {
      nombre: item.querySelector('span').textContent.split(' - ')[0].trim(),
      cantidad: parseFloat(item.querySelector('.quantity').textContent),
      precioUnitario: parseFloat(item.querySelector('.price').textContent) /
                      parseFloat(item.querySelector('.quantity').textContent),
    };
  });

  canal.postMessage({
    tipo: 'carrito',
    productos: items
  });
}

function resetCliente() {
  canal.postMessage({ tipo: 'reset' });
}
