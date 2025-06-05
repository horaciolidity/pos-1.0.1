document.addEventListener('DOMContentLoaded', () => {
    displayProducts();
    updateTotalPrice();
});

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
      cost: price, // asumimos que el costo es el mismo que precio al crear
    };

    if (existingProductIndex !== -1) {
      // Si el producto ya existe, solo actualizamos la cantidad
      products[existingProductIndex].quantity += quantity;
    } else {
      products.push(newProduct);
    }

    saveProducts(products);
    displayProducts();
    updateTotalPrice();
    clearForm();

  }
}



function clearForm() {
    document.getElementById('product-code').value = '';
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-quantity').value = ''; // Limpiar el campo de cantidad
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

  // Guardar venta en localStorage
  const ventas = getVentas();
  ventas.push({
    code: product.code,
    name: product.name,
    cantidadVendida: quantity,
    unit: product.unit,
    price: product.price,
    precioFinal: precioFinal,
    cost: product.cost,
    rendimiento: (precioFinal / product.cost).toFixed(2),
    isBulk: product.isBulk
  });
  saveVentas(ventas);

  updateCartSummary();
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

    if (existingItem) {
        const quantitySpan = existingItem.querySelector('.quantity');
        const currentQuantity = parseInt(quantitySpan.textContent);

        if (currentQuantity > 1) {
            const newQuantity = currentQuantity - 1; // Decrementa la cantidad
            quantitySpan.textContent = newQuantity; // Actualiza la cantidad en la interfaz
        } else {
            existingItem.remove(); // Si la cantidad es 1, elimina el producto del carrito
        }
        updateTotalPrice(); // Actualiza el total
    }
}

// Función para aumentar la cantidad de un producto en el carrito
function addQuantity(code) {
    const cartList = document.getElementById('cart');
    const existingItem = Array.from(cartList.children).find(item => item.dataset.code === code);

    if (existingItem) {
        const quantitySpan = existingItem.querySelector('.quantity');
        const newQuantity = parseInt(quantitySpan.textContent) + 1; // Incrementa la cantidad
        quantitySpan.textContent = newQuantity; // Actualiza la cantidad en la interfaz
        updateTotalPrice(); // Actualiza el total
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
    const totalVendido = localStorage.getItem('totalVendido');
    const ventasModal = document.getElementById('ventas-modal');
    const ventasDetalle = document.getElementById('ventas-detalle');
    const totalVendidoModal = document.getElementById('total-vendido-modal');

    ventasDetalle.innerHTML = ''; // Limpiar el detalle de ventas
    const products = getProducts();

    let productosVendidos = '';
    products.forEach(product => {
       if (product.sold > 0) { 
    productosVendidos += `
        <li>${product.name} - Precio: $${product.price} - Cantidad vendida: ${product.sold}</li>
    `;
}

    });

    ventasDetalle.innerHTML = productosVendidos || '<li>No hay productos vendidos aún.</li>';
    totalVendidoModal.textContent = totalVendido ? totalVendido : '0.00';
    
    ventasModal.style.display = 'block'; // Mostrar el modal
}

// Cerrar el modal
const closeModal = document.querySelector('.close');
closeModal.onclick = function() {
    document.getElementById('ventas-modal').style.display = 'none';
};

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
    // Eliminar el total vendido del almacenamiento local
    localStorage.removeItem('totalVendido');
    
    // Obtener los productos almacenados
    const products = getProducts();

    // Restablecer las cantidades vendidas (sold) de todos los productos
    products.forEach(product => {
        product.sold = 0; // Reiniciar las ventas a 0
    });

    // Guardar los productos actualizados
    saveProducts(products);

    // Actualizar la interfaz de usuario
    displayProducts();

    alert('Total Vendido y ventas anteriores limpiados para el nuevo turno.');
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
// Apertura de caja
function setOpeningCash() {
    const input = document.getElementById('opening-cash');
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
        localStorage.setItem('openingCash', value.toFixed(2));
        alert('Caja iniciada con $' + value.toFixed(2));
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

function finalizeSale() {
  const cartItems = document.querySelectorAll('#cart li');
  if (cartItems.length === 0) {
    alert('El carrito está vacío');
    return;
  }

  const cart = [];
  const products = getProducts();
  let hasStockIssue = false;

  cartItems.forEach(item => {
    const code = item.dataset.code;
    const name = item.querySelector('span').textContent.split(' - ')[0].trim();
    const quantity = parseFloat(item.querySelector('.quantity').textContent);
    const price = parseFloat(item.querySelector('.price').textContent);
    const unit = item.textContent.includes('kg') ? 'kg' : item.textContent.includes('litro') ? 'litro' : 'unidad';

    const product = products.find(p => p.code === code);
    if (product && product.quantity >= quantity) {
      product.quantity -= quantity;
      product.sold = (product.sold || 0) + quantity;
    } else {
      alert(`No hay suficiente stock de ${name}`);
      hasStockIssue = true;
    }

    cart.push({ code, name, quantity, price, unit });
  });

  if (hasStockIssue) return;

  // 🟨 Solicitar desglose de pago
  const efectivo = parseFloat(prompt("Monto pagado en efectivo:", "0")) || 0;
  const transferencia = parseFloat(prompt("Monto pagado por transferencia:", "0")) || 0;
  const paymentDetail = `Efectivo: $${efectivo.toFixed(2)} - Transferencia: $${transferencia.toFixed(2)}`;

  // Guardar venta
  saveSale(cart, paymentDetail);

  saveProducts(products);
  document.getElementById('cart').innerHTML = '';
  document.getElementById('total-price').textContent = '0.00';
  alert('Venta registrada correctamente');
  displayProducts();
  updateTotalPrice();
}


function showSalesSummary() {
  const sales = JSON.parse(localStorage.getItem('sales')) || [];
  let summary = '';
  let totalCash = 0;
  let totalTransfer = 0;

  sales.forEach((sale, index) => {
    summary += `🧾 Venta #${index + 1} - ${sale.timestamp}\n`;
    summary += `Método de pago: ${sale.paymentMethod}\n`;

    sale.cart.forEach(p => {
      summary += `  - ${p.name} (${p.unit})\n    Cant: ${p.quantity}\n    Total: $${p.price.toFixed(2)}\n`;
    });

    const saleTotal = sale.cart.reduce((acc, p) => acc + p.price, 0);
    summary += `  Total de esta venta: $${saleTotal.toFixed(2)}\n\n`;

    if (sale.paymentMethod.includes('Efectivo')) {
      const match = sale.paymentMethod.match(/Efectivo: \$([0-9.]+)/);
      if (match) totalCash += parseFloat(match[1]);
    }
    if (sale.paymentMethod.includes('Transferencia')) {
      const match = sale.paymentMethod.match(/Transferencia: \$([0-9.]+)/);
      if (match) totalTransfer += parseFloat(match[1]);
    }
  });

  summary += `\nApertura de caja: $${getOpeningCash().toFixed(2)}`;
  summary += `\nTotal efectivo: $${totalCash.toFixed(2)}`;
  summary += `\nTotal transferencia: $${totalTransfer.toFixed(2)}`;
  summary += `\nTotal vendido: $${(totalCash + totalTransfer).toFixed(2)}`;

  const textarea = document.getElementById('sales-summary');
  textarea.value = summary;
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

// Reiniciar las ventas y la apertura
function resetDay() {
    localStorage.removeItem('sales');
    localStorage.removeItem('openingCash');
    alert('Caja y ventas reiniciadas');
    document.getElementById('sales-summary').value = '';
}





// Función para verificar el stock y mostrar alertas
function checkStock(product) {
    if (product.quantity < 5) { // Por ejemplo, menos de 5 unidades
        alert(`Quedan solo ${product.quantity} unidades de ${product.name}.`);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden'); // Añade la clase para iniciar la transición
        setTimeout(() => {
            loadingScreen.style.display = 'none'; // Oculta completamente después de la transición
        }, 500); // Tiempo de la transición (0.5 segundos)
    }, 4000); // Desaparece después de 2 segundos
});
