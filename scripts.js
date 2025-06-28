
const session = JSON.parse(localStorage.getItem('currentUser')) || { role: 'empleado' };
const isAdmin = session.role === 'admin';

if (!session) {
  // Si alguien entra directo sin login, mándalo al de empleado
  window.location.href = 'login_empleado.html';
}

/* Ocultá/Deshabilitá botones admin-only apenas cargue el DOM */
document.addEventListener('DOMContentLoaded', () => {
  if (!isAdmin) {
    document.querySelectorAll('.admin-only').forEach(btn => {
      // elegí el efecto que prefieras: ocultar o solo deshabilitar
      // btn.style.display = 'none';
      btn.disabled = true;
    });
  }
});





document.addEventListener('DOMContentLoaded', () => {
    displayProducts();
    updateTotalPrice();
    renderClientes();
    refrescarListaClientes();

    const input = document.getElementById('opening-cash');
    const yaInicioCaja = localStorage.getItem('openingCashSet') === 'true';
    if (yaInicioCaja) input.disabled = true;

    // Animación de carga (si existe)
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }, 4000);
});



/* =========================================================
   CLIENTES – helpers
   =========================================================*/
function getClientes()        { return JSON.parse(localStorage.getItem('clientes')) || []; }
function saveClientes(data)   { localStorage.setItem('clientes', JSON.stringify(data)); }

/* estado global para la venta en curso */
let clienteSeleccionado = null;



function getProducts() {
    return JSON.parse(localStorage.getItem('products')) || [];
}

function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
}


function addProduct() {
    const code = document.getElementById('product-code').value.trim();
    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value.trim());
    const quantity = parseFloat(document.getElementById('product-quantity').value.trim());
    const cost = parseFloat(document.getElementById('product-cost').value.trim());
    const unit = document.getElementById('product-unit').value;
    const isBulk = (unit === 'kg' || unit === 'litro');

    if (code && name && price > 0 && quantity > 0) {
        const products = getProducts();
        const existingProductIndex = products.findIndex(p => p.code === code);

        const newProduct = {
            code,
            name,
            price,
            quantity,
            unit,
            isBulk,
            cost,
        };

        if (existingProductIndex !== -1) {
            products[existingProductIndex].quantity += quantity;
        } else {
            products.push(newProduct);
        }

        saveProducts(products);
        displayProducts();
        updateTotalPrice();
        if (typeof enviarCarritoAlCliente === 'function') {
            enviarCarritoAlCliente();
        }

        clearForm();
    }
}

/* ---------- Buscador dinámico ---------- */
const clienteInput = document.getElementById('cliente-input');
const clienteLista = document.getElementById('lista-clientes');

function refrescarListaClientes(filtro = '') {
  const filtroNorm = filtro.toLowerCase();

  const html = getClientes()
    .filter(c => {
      const nombre = (c.name || c.nombre || '').toLowerCase(); // ← Fallbacks
      return nombre.includes(filtroNorm);
    })
    .map(c => {
      const nombre = c.name || c.nombre || 'Sin nombre';
      const saldo  = (+c.saldo || 0).toFixed(2);
      return `<li data-id="${c.id}">${nombre} – saldo $${saldo}</li>`;
    })
    .join('');

  clienteLista.innerHTML = html || '<li class="mute">Sin coincidencias</li>';
}



function clearForm() {
    document.getElementById('product-code').value = '';
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-quantity').value = '';
    document.getElementById('product-cost').value = '';
}

function searchProduct() {
    const code = document.getElementById('search-code').value.trim();
    const products = getProducts();
    const product = products.find(p => p.code === code);

    const resultDiv = document.getElementById('product-result');
    resultDiv.innerHTML = '';

    if (product) {
        resultDiv.innerHTML = `
            <p>Nombre: ${product.name}</p>
            <p>Precio: $${product.price.toFixed(2)}</p>
            <p>Cantidad: ${product.quantity}</p>

            <button onclick="deleteProduct('${product.code}')">Eliminar</button>
            <button onclick="editProduct('${product.code}')">Editar</button>
        `;
    } else {
        resultDiv.innerHTML = '<p>Producto no encontrado</p>';
    }
}

function displayProducts() {
    const products = getProducts();
    const productsList = document.getElementById('products');
    productsList.innerHTML = '';

    products.forEach(product => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${product.code} - ${product.name} - $${product.price.toFixed(2)} - Cantidad: ${product.quantity}</span>
            <button onclick="deleteProduct('${product.code}')">Eliminar</button>
            <button onclick="editProduct('${product.code}')">Editar</button>
            <button onclick="updateProduct('${product.code}')">Actualizar</button> <!-- Botón de actualizar -->
        `;
        productsList.appendChild(li);
    });
}

// Nueva función para actualizar el producto
function updateProduct(code) {
    const products = getProducts();
    const product = products.find(p => p.code === code);
    const newQuantity = prompt('Ingrese la nueva cantidad para el producto:', product.quantity);
    if (newQuantity !== null) {
        const quantityNumber = parseInt(newQuantity);
        if (quantityNumber >= 0) {
            product.quantity = quantityNumber; // Actualiza la cantidad del producto
            saveProducts(products); // Guarda el inventario actualizado
            displayProducts(); // Actualiza la vista de productos
            updateTotalPrice();
            enviarCarritoAlCliente();

            alert(`Cantidad de ${product.name} actualizada a ${quantityNumber}.`);
        } else {
            alert('Por favor, ingrese una cantidad válida.');
        }
    }
}



function deleteProduct(code) {
    let products = getProducts();
    products = products.filter(p => p.code !== code);
    saveProducts(products);
    displayProducts();
}

function editProduct(code) {
    const products = getProducts();
    const product = products.find(p => p.code === code);

    if (product) {
        document.getElementById('product-code').value = product.code;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        deleteProduct(code);
    }
}

function scanProduct() {
    const code = document.getElementById('scan-code').value.trim();
    const products = getProducts();
    const product = products.find(p => p.code === code);

    if (product) {
        const cartList = document.getElementById('cart');
        const existingItem = Array.from(cartList.children).find(item => item.dataset.code === product.code);

        // Verifica si el producto ya está en el carrito
        if (existingItem) {
            // Solo se actualiza la cantidad en el carrito, no se descuenta del inventario
            const quantitySpan = existingItem.querySelector('.quantity');
            const newQuantity = parseInt(quantitySpan.textContent) + 1; // Incrementa la cantidad en el carrito
            quantitySpan.textContent = newQuantity; // Actualiza la cantidad en la interfaz
        } else {
            // Solo se añade al carrito si hay stock
            addToCart(product);
            document.getElementById('scan-code').value = ''; // Limpia el campo de escaneo
            updateTotalPrice(); // Actualiza el total
            checkStock(product); // Verifica el stock y muestra alertas
        }
    } else {
        alert('Producto no encontrado');
    }
}
function addToCart(product) {
  const cartList = document.getElementById('cart');
  const existingItem = Array.from(cartList.children).find(item => item.dataset.code === product.code);

  let quantity = 1;
  if (product.isBulk) {
    const input = prompt(`Ingrese la cantidad en ${product.unit} para "${product.name}" (ej: 0.300):`);
    const parsed = parseFloat(input);
    if (isNaN(parsed) || parsed <= 0) {
      alert("Cantidad inválida");
      return;
    }
    quantity = parsed;
  }

  const precioFinal = quantity * product.price;

  if (existingItem) {
    const quantitySpan = existingItem.querySelector('.quantity');
    const newQuantity = parseFloat(quantitySpan.textContent) + quantity;
    quantitySpan.textContent = newQuantity.toFixed(3);

    const priceSpan = existingItem.querySelector('.price');
    const newPrice = parseFloat(priceSpan.textContent) + precioFinal;
    priceSpan.textContent = newPrice.toFixed(2);
  } else {
    const li = document.createElement('li');
    li.dataset.code = product.code;
    li.innerHTML = `
      <span>
        ${product.name} - <span class="quantity">${quantity.toFixed(3)}</span> ${product.unit} -
        $<span class="price">${precioFinal.toFixed(2)}</span>
      </span>
      <button onclick="addQuantity('${product.code}')">+</button>
      <button onclick="removeQuantity('${product.code}')">-</button>
      <button onclick="editCartItemPrice('${product.code}')">Editar $</button>
    `;
    cartList.appendChild(li);
  }

  if (typeof notificarCliente === 'function') {
    notificarCliente(product.name, product.price, quantity);
  }

  updateTotalPrice();

  if (typeof enviarCarritoAlCliente === 'function') {
    enviarCarritoAlCliente();
  }
}

function editCartItemPrice(code) {
  const cartList = document.getElementById('cart');
  const item = Array.from(cartList.children).find(item => item.dataset.code === code);
  if (!item) return;

  const currentPrice = parseFloat(item.querySelector('.price').textContent);
  const newPrice = parseFloat(prompt("Ingrese el nuevo precio total para este producto:", currentPrice.toFixed(2)));

  if (isNaN(newPrice) || newPrice <= 0) {
    alert("Precio inválido.");
    return;
  }

  const priceSpan = item.querySelector('.price');
  if (priceSpan) {
    priceSpan.textContent = newPrice.toFixed(2);
  }

  updateTotalPrice();
}






function removeQuantity(code) {
  const cartList = document.getElementById('cart');
  const existingItem = Array.from(cartList.children).find(item => item.dataset.code === code);
  const products = getProducts();
  const product = products.find(p => p.code === code);

  if (existingItem && product) {
    const quantitySpan = existingItem.querySelector('.quantity');
    const priceSpan = existingItem.querySelector('.price');

    const currentQuantity = parseFloat(quantitySpan.textContent);

    if (currentQuantity > 1) {
      const newQuantity = currentQuantity - 1;
      quantitySpan.textContent = newQuantity.toFixed(3);

      const newPrice = newQuantity * product.price;
      priceSpan.textContent = newPrice.toFixed(2);
    } else {
      existingItem.remove();
    }

    updateTotalPrice();

    if (typeof enviarCarritoAlCliente === 'function') {
      enviarCarritoAlCliente();
    }
  }
}

function addQuantity(code) {
  const cartList = document.getElementById('cart');
  const existingItem = Array.from(cartList.children).find(item => item.dataset.code === code);
  const products = getProducts();
  const product = products.find(p => p.code === code);

  if (existingItem && product) {
    const quantitySpan = existingItem.querySelector('.quantity');
    const priceSpan = existingItem.querySelector('.price');

    const currentQuantity = parseFloat(quantitySpan.textContent);
    const newQuantity = currentQuantity + 1;
    quantitySpan.textContent = newQuantity.toFixed(3);

    const newPrice = newQuantity * product.price;
    priceSpan.textContent = newPrice.toFixed(2);

    updateTotalPrice();
  }
    if (typeof enviarCarritoAlCliente === 'function') {
  enviarCarritoAlCliente();
}

}

function updateTotalPrice() {
  const cartList = document.getElementById('cart');
  let total = 0;

  Array.from(cartList.children).forEach(item => {
    const priceElement = item.querySelector('.price');
    if (priceElement) {
      const price = parseFloat(priceElement.textContent);
      total += price;
    }
  });

  const totalPriceElement = document.getElementById('total-price');
  if (totalPriceElement) {
    totalPriceElement.textContent = total.toFixed(2);
  }
}


function checkout() {
    const total = parseFloat(document.getElementById('total-price').textContent);
    let totalVendido = parseFloat(localStorage.getItem('totalVendido')) || 0;
    totalVendido += total;
    localStorage.setItem('totalVendido', totalVendido.toFixed(2));

    const cartItems = document.querySelectorAll('#cart li');
    const products = getProducts();

    const quantitiesToDeduct = {};
    let hasStockIssue = false; // Verifica problemas de stock

    cartItems.forEach(item => {
        const productCode = item.dataset.code; // Obtener el código del producto
        const quantity = parseInt(item.querySelector('.quantity').textContent);
        const product = products.find(p => p.code === productCode);
        
        if (product) {
            if (product.quantity < quantity) {
                alert(`No hay suficiente stock de ${product.name}. Solo quedan ${product.quantity} unidades.`);
                hasStockIssue = true; 
                return; 
            }
            quantitiesToDeduct[productCode] = quantity; // Almacena la cantidad a deducir
        }
    });

    if (hasStockIssue) {
        return; // Detener si hay problemas de stock
    }

   // Actualizar el inventario
Object.entries(quantitiesToDeduct).forEach(([code, quantity]) => {
    const product = products.find(p => p.code === code);
    if (product) {
        product.quantity -= quantity; // Restar la cantidad vendida
        product.sold = (product.sold || 0) + quantity; // Registrar la cantidad vendida
    }
});

    saveProducts(products); // Guarda el inventario actualizado
    document.getElementById('cart').innerHTML = ''; // Limpiar el carrito
    document.getElementById('total-price').textContent = '0.00'; // Resetear total
    alert('Compra finalizada. El inventario ha sido actualizado.');

    displayProducts(); // Actualiza la vista
}

function consultarTotalVendido() {
  const ventasModal       = document.getElementById('ventas-modal');
  const ventasDetalle     = document.getElementById('ventas-detalle');
  const totalVendidoModal = document.getElementById('total-vendido-modal');
  const ventas            = getVentas(); // historial real
  const productos         = getProducts();
  const clientes          = JSON.parse(localStorage.getItem('clientes')) || [];

  let totalReal = 0;
  let ventasHtml = '';

  if (ventas.length > 0) {
    ventasHtml += `<h3>Detalle de ventas realizadas</h3>`;
    ventas.forEach((venta, i) => {
      const fecha = venta.timestamp || venta.date || venta.timestampIso || venta.dateISO || '---';
      const cliente = clientes.find(c => c.id === venta.clientId);
      const nombreCliente = cliente ? cliente.name : '—';

      const items = (venta.cart || venta.products || []).map(p => {
        const qty = p.qty || p.quantity;
        return `<li>${qty}× ${p.name}</li>`;
      }).join('');

      const totalVenta = venta.total || (venta.cart || []).reduce((s, p) => s + p.price * p.quantity, 0);
      totalReal += totalVenta;

      ventasHtml += `
        <li>
          <strong>${fecha}</strong> – $${totalVenta.toFixed(2)} – Cliente: ${nombreCliente}
          <ul>${items}</ul>
        </li>`;
    });
  } else {
    ventasHtml = '<p>No hay ventas registradas.</p>';
  }

  // Productos vendidos
  let productosHtml = '';
  productos.forEach(p => {
    if (p.sold > 0) {
      productosHtml += `<li>${p.name} - Precio: $${p.price} - Cantidad vendida: ${p.sold}</li>`;
    }
  });
  if (!productosHtml) productosHtml = '<li>No hay productos vendidos aún.</li>';

  // Clientes con deuda
  const deudores = clientes.filter(c => parseFloat(c.saldo || 0) > 0);
  let deudoresHtml = '';
  let totalDeuda = 0;

  if (deudores.length > 0) {
    deudoresHtml += '<hr><h3>Clientes con deuda</h3>';
    deudores.forEach((c, i) => {
      const deuda = parseFloat(c.saldo).toFixed(2);
      totalDeuda += parseFloat(c.saldo);
      deudoresHtml += `<li>${i + 1}. ${c.name || c.nombre} — Tel: ${c.telefono || '---'} — Debe $${deuda}</li>`;
    });
    deudoresHtml += `<p><strong>Total deuda acumulada: $${totalDeuda.toFixed(2)}</strong></p>`;
  } else {
    deudoresHtml += '<p>No hay clientes con deuda.</p>';
  }

  ventasDetalle.innerHTML = `
    ${ventasHtml}
    <hr><h3>Resumen por producto</h3>
    <ul>${productosHtml}</ul>
    ${deudoresHtml}
  `;

  totalVendidoModal.textContent = '$' + totalReal.toFixed(2);
  ventasModal.style.display = 'block';
}

// Cierre del modal
document.querySelector('.close').onclick = () =>
  document.getElementById('ventas-modal').style.display = 'none';

// Descargar detalle de ventas
function downloadVentas() {
    const totalVendido = localStorage.getItem('totalVendido') || '0.00';
    const products = getProducts(); // Asegúrate de que esta función trae correctamente los productos
    let detalle = `Total Vendido: $${totalVendido}\n\nProductos Vendidos:\n`;

    // Iterar sobre los productos vendidos
    products.forEach(product => {
        // Solo incluir los productos que se vendieron
        if (product.sold && product.sold > 0) {
            detalle += `${product.name} - Precio: $${product.price} - Cantidad vendida: ${product.sold}\n`;
        }
    });

    // Generar archivo de texto
    const blob = new Blob([detalle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ventas_detalle.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Detectar clic fuera del modal para cerrar
window.onclick = function(event) {
    const ventasModal = document.getElementById('ventas-modal');
    if (event.target === ventasModal) {
        ventasModal.style.display = 'none';
    }
};




function limpiarTotalVendido() {
    // Borrar total de vendido (por compatibilidad)
    localStorage.removeItem('totalVendido');

    // Borrar historial real de ventas
    localStorage.removeItem('ventas');

    // Borrar apertura de caja
    localStorage.removeItem('openingCash');
    localStorage.setItem('openingCashSet', 'false');

    // Resetear 'sold' en los productos
    const products = getProducts();
    products.forEach(product => {
        product.sold = 0;
    });
    saveProducts(products);

    // Actualizar interfaz
    displayProducts();
    document.getElementById("sales-summary").value = '';
    document.getElementById("opening-cash").disabled = false;

    alert('Turno reiniciado. Todo el historial fue limpiado.');
     if (typeof resetCliente === 'function') {
        resetCliente();
    }
}


document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const contents = e.target.result;
            processFileContents(contents);
        };
        reader.readAsText(file);
    }
}

function processFileContents(contents) {
    const products = parseProducts(contents);
    saveProductsToLocalStorage(products);
    displayProducts();
}

function parseProducts(contents) {
    const lines = contents.split('\n');
    const products = lines.map(line => {
        const parts = line.split(',');
        if (parts.length !== 4) { // Ahora esperamos 4 partes: código, nombre, precio y cantidad
            console.error('Formato de producto inválido:', line);
            return null; // Omitir líneas mal formateadas
        }
        const [code, name, price, quantity] = parts;
        return {
            code: code.trim(),
            name: name.trim(),
            price: parseFloat(price.trim()),
            quantity: parseInt(quantity.trim()) // Procesar la cantidad
        };
    }).filter(product => product !== null); // Filtrar productos nulos
    return products;
}

function saveProductsToLocalStorage(products) {
    const existingProducts = getProducts();
    const updatedProducts = existingProducts.concat(products);
    saveProducts(updatedProducts);
}

function loadProducts() {
    const products = getProducts();
    displayProducts(products);
}

function downloadProducts() {
    const products = getProducts();
    const contents = products.map(p => `${p.code}, ${p.name}, ${p.price}, ${p.quantity}`).join('\n');
    const blob = new Blob([contents], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productos.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
function setOpeningCash() {
    const input = document.getElementById('opening-cash');
    const value = parseFloat(input.value.trim());
    if (!isNaN(value) && value >= 0) {
        localStorage.setItem('openingCash', value.toFixed(2));
        input.disabled = true;
        alert("Caja iniciada con $" + value.toFixed(2));
    } else {
        alert("Ingrese un monto válido");
    }
}




function getOpeningCash() {
    return parseFloat(localStorage.getItem('openingCash')) || 0;
}

// Guardar una venta en LocalStorage
function saveSale(cart, paymentMethod) {
    const sales = JSON.parse(localStorage.getItem('sales')) || [];
    const timestamp = new Date().toLocaleString();
    sales.push({ cart, paymentMethod, timestamp });
    localStorage.setItem('sales', JSON.stringify(sales));
}

function finalizeSale(method) {
  /* 1) Validaciones básicas ----------------------------------------- */
  const cartItems = document.querySelectorAll('#cart li');
  if (cartItems.length === 0) { alert('El carrito está vacío'); return; }

  const products = getProducts();
  const cart     = [];
  let   hasStock = false;

  /* 2) Datos de FECHA ya al inicio ---------------------------------- */
  const fechaObj     = new Date();
  const timestamp    = fechaObj.toLocaleString();   // legible
  const timestampIso = fechaObj.toISOString();      // ISO
  const timestampMs  = fechaObj.getTime();

  /* 3) Recorremos carrito y actualizamos inventario ----------------- */
  cartItems.forEach(item => {
    const code       = item.dataset.code;
    const quantity   = parseFloat(item.querySelector('.quantity').textContent);
    const totalPrice = parseFloat(item.querySelector('.price').textContent);
    const product    = products.find(p => p.code === code);

    if (product && product.quantity >= quantity) {
      product.quantity -= quantity;
      product.sold      = (product.sold || 0) + quantity;
    } else {
      alert(`No hay suficiente stock de ${product?.name || code}`);
      hasStock = true;
    }

    cart.push({
      code,
      name     : product.name,
      price    : totalPrice / quantity,  // unitario
      quantity,
      cost     : product.cost || 0
    });
  });
  if (hasStock) return;   // aborta si hay problemas de stock

  /* 4) Totales y ganancia ------------------------------------------- */
  const totalVenta = cart.reduce((s,p)=> s + p.price * p.quantity, 0);
  const costoVenta = cart.reduce((s,p)=> s + p.cost  * p.quantity, 0);
  const ganancia   = totalVenta - costoVenta;

  /* 5) Construimos la venta ----------------------------------------- */
  const novedades = prompt("¿Desea agregar alguna novedad sobre esta venta? (opcional)") || "";
  const venta = {
    id        : timestampMs.toString(),
    timestamp,
    timestampIso,
    timestampMs,
    cart,
    total     : totalVenta,
    profit    : ganancia,
    clientId  : clienteSeleccionado?.id || null,
    paymentMethod : method,
    novedades
  };

  /* 6) Guardamos en localStorage.sales ------------------------------ */
  const ventas = getVentas();
  ventas.push(venta);
  saveVentas(ventas);

  /* 7) Historial del cliente ---------------------------------------- */
  if (clienteSeleccionado) {
    const clientes = getClientes();
    const cli      = clientes.find(c => c.id === clienteSeleccionado.id);
    cli.saldo     = (+cli.saldo || 0) + totalVenta;
    cli.historial = cli.historial || [];
    cli.historial.push({
      dateISO : timestampIso,
      items   : cart,
      total   : totalVenta
    });
    saveClientes(clientes);
  }

  /* 8) Persistimos inventario y limpiamos interfaz ------------------ */
  saveProducts(products);
  document.getElementById('cart').innerHTML = '';
  document.getElementById('total-price').textContent = '0.00';
  clienteSeleccionado = null;
  alert(`Venta registrada con pago: ${method}`);

  displayProducts();
  updateTotalPrice();
  const canal = new BroadcastChannel('pos_channel');
  canal.postMessage({ tipo: 'venta' });
}

function showSalesSummary() {
  /*-------------------------------------------------------
    1) Traemos ventas guardadas
  -------------------------------------------------------*/
  const sales = JSON.parse(localStorage.getItem('sales')) || [];

  /* Variables acumuladoras */
  let summary        = '';
  let totalCash      = 0;
  let totalTransfer  = 0;
  let totalCliente   = 0;
  let totalCostos    = 0;
  let totalGanancia  = 0;

  /*-------------------------------------------------------
    2) Recorremos todas las ventas
  -------------------------------------------------------*/
  sales.forEach((sale, index) => {
    summary += `🧾 Venta #${index + 1} - ${sale.timestamp} - Método: ${sale.paymentMethod}\n`;

    let ventaSubtotal = 0;
    let ventaCosto    = 0;

    /* Detalle de productos */
    sale.cart.forEach(p => {
      const q        = parseFloat(p.quantity);
      const priceU   = parseFloat(p.price);
      const costU    = parseFloat(p.cost || 0);
      const subTotal = q * priceU;
      const costTot  = q * costU;
      const profit   = subTotal - costTot;

      ventaSubtotal += subTotal;
      ventaCosto    += costTot;

      summary += `  🛒 ${q} x ${p.name} | Precio u.: $${priceU.toFixed(2)} | Costo u.: $${costU.toFixed(2)} | Subtotal: $${subTotal.toFixed(2)} | Ganancia: $${profit.toFixed(2)}\n`;
    });

    /* Ganancia por venta */
    const gananciaVenta = ventaSubtotal - ventaCosto;
    totalCostos   += ventaCosto;
    totalGanancia += gananciaVenta;

    /* Resumen por venta */
    summary += `  💲 Total venta: $${ventaSubtotal.toFixed(2)}\n`;
    summary += `  📦 Costo total: $${ventaCosto.toFixed(2)}\n`;
    summary += `  📈 Ganancia: $${gananciaVenta.toFixed(2)}\n`;

    if (sale.novedades && sale.novedades.trim() !== '') {
      summary += `  📝 Novedades: ${sale.novedades}\n`;
    }
    summary += '\n';

    /* Clasificamos por método de pago */
    const method = sale.paymentMethod.toLowerCase();
    if (method.includes('efectivo'))        totalCash     += ventaSubtotal;
    else if (method.includes('transfer'))   totalTransfer += ventaSubtotal;
    else if (method.includes('cuenta'))     totalCliente  += ventaSubtotal;
  });

  /*-------------------------------------------------------
    3) Totales finales
  -------------------------------------------------------*/
  const totalFacturado = totalCash + totalTransfer + totalCliente;

  summary += `🔓 Apertura de caja: $${getOpeningCash().toFixed(2)}\n`;
  summary += `💰 Total efectivo: $${totalCash.toFixed(2)}\n`;
  summary += `💳 Total transferencia: $${totalTransfer.toFixed(2)}\n`;
  summary += `🧾 Total cuenta cliente: $${totalCliente.toFixed(2)}\n`;
  summary += `📦 Costo total de productos vendidos: $${totalCostos.toFixed(2)}\n`;
  summary += `📈 Ganancia total: $${totalGanancia.toFixed(2)}\n`;
  summary += `💵 Total facturado: $${totalFacturado.toFixed(2)}`;

  /*-------------------------------------------------------
    4) Mostramos en el textarea
  -------------------------------------------------------*/
  document.getElementById('sales-summary').value = summary;
}




function payWithTransfer() {
    finalizeSale('Transferido');
}
// Descargar el resumen como archivo de texto
function downloadSummary() {
    const text = document.getElementById('sales-summary').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'arqueo_caja.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}



/* =========================================================
   VENTAS – helpers  (todo irá a localStorage.sales)
   =========================================================*/
function getVentas()        { return JSON.parse(localStorage.getItem('sales')) || []; }
function saveVentas(data)   { localStorage.setItem('sales', JSON.stringify(data)); }




// Función para verificar el stock y mostrar alertas
function checkStock(product) {
    if (product.quantity < 5) { // Por ejemplo, menos de 5 unidades
        alert(`Quedan solo ${product.quantity} unidades de ${product.name}.`);
    }
}



function resetDay() {
    localStorage.removeItem('sales');
    localStorage.removeItem('openingCash');
    localStorage.removeItem('openingCashSet');
    localStorage.removeItem('totalVendido');

    const products = getProducts();
    products.forEach(p => p.sold = 0);
    saveProducts(products);

    document.getElementById("sales-summary").value = "";
    document.getElementById("opening-cash").disabled = false;

    displayProducts();

    // 👉 Agregado
    if (typeof resetCliente === 'function') {
        resetCliente();
    }

    alert("Caja, ventas y arqueo limpiados exitosamente.");
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('currentUser');   // borra la sesión
  window.location.href = 'login_empleado.html';
});

/* ---------- Tabla de clientes ---------- */
function formatearFecha(iso){
  const d=new Date(iso);
  return d.toLocaleDateString()+' '+d.toLocaleTimeString();
}

function tablaHistorial(hist) {

  // Si no es array o está vacío
  if (!Array.isArray(hist) || hist.length === 0) {
    return '<em>Sin ventas registradas</em>';
  }

  return `<table class="subtabla">
    <thead><tr><th>Fecha</th><th>Productos</th><th>Total</th></tr></thead>
    <tbody>${
      hist.map(h => {
        // ⬇⬇  Fallbacks defensivos  ⬇⬇
        const fecha  = h.dateISO || h.fecha || h.timestampIso || h.timestamp || '---';
        const items  = Array.isArray(h.items) ? h.items : [];
        const lista  = items.length
          ? items.map(i => `<li>${(i.quantity || i.qty || 0)}× ${i.name || i.product || '—'}</li>`).join('')
          : '<li>—</li>';
        const total  = (h.total !== undefined) ? h.total : 0;

        return `<tr>
          <td>${formatearFecha(fecha)}</td>
          <td><ul>${lista}</ul></td>
          <td>$${(+total).toFixed(2)}</td>
        </tr>`;
      }).join('')
    }</tbody>
  </table>`;
}



function renderClientes(){
  const tbody = document.getElementById('tabla-clientes'); 
  const clientes=getClientes();
  tbody.innerHTML=clientes.map(c=>`
    <tr>
      <td>${c.name}</td>
      <td>$${(+c.saldo).toFixed(2)}</td>
      <td>
        <button data-id="${c.id}" class="ver-detalle">Detalle</button>
        <button data-id="${c.id}" class="reset-saldo danger">Resetear</button>
      </td>
    </tr>
    <tr id="det-${c.id}" class="hidden">
      <td colspan="3">${c.historial?.length?tablaHistorial(c.historial):'<em>Sin ventas</em>'}</td>
    </tr>`
  ).join('');
}

/* clicks detalle / reset */
document.addEventListener('click', e=>{
  if(e.target.matches('.ver-detalle')){
    document.getElementById('det-'+e.target.dataset.id).classList.toggle('hidden');
  }
  if(e.target.matches('.reset-saldo')){
    if(!confirm('¿Resetear cuenta de este cliente?'))return;
    const clientes=getClientes();
    const cli=clientes.find(c=>c.id===e.target.dataset.id);
    cli.saldo=0; cli.historial=[];
    saveClientes(clientes);
    renderClientes();
  }
});



function soloAdmin(fn) {
  return (...args) => {
    if (!isAdmin) {
      alert('Acción reservada al administrador');
      return;
    }
    return fn(...args);
  };
}

/* Re-asigná tus funciones críticas */
addProduct            = soloAdmin(addProduct);
deleteProduct         = soloAdmin(deleteProduct);
editProduct           = soloAdmin(editProduct);
updateProduct         = soloAdmin(updateProduct);
consultarTotalVendido = soloAdmin(consultarTotalVendido);
limpiarTotalVendido   = soloAdmin(limpiarTotalVendido);
setOpeningCash        = soloAdmin(setOpeningCash);

