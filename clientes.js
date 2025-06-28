/*────────────────────────────────────────────────────────
  CLIENTES – CRUD + cuenta corriente
────────────────────────────────────────────────────────*/
const LS_KEY_CLIENTES = "clientes";

/* Utilidades de almacenamiento */
function getClientes() {
  return JSON.parse(localStorage.getItem(LS_KEY_CLIENTES)) || [];
}
function saveClientes(arr) {
  localStorage.setItem(LS_KEY_CLIENTES, JSON.stringify(arr));
}

/* ─── Modal control ───────────────────────────────────*/
function abrirModalClientes() {
  document.getElementById("modal-clientes").style.display = "block";
  renderTablaClientes();
}
function cerrarModalClientes() {
  document.getElementById("modal-clientes").style.display = "none";
  limpiarFormCliente();
}
window.onclick = e => {
  if (e.target.id === "modal-clientes") cerrarModalClientes();
};

/* ─── CRUD ────────────────────────────────────────────*/
function guardarCliente(e) {
  e.preventDefault();
  const id       = document.getElementById("cliente-id").value;
  const nombre   = document.getElementById("cliente-nombre").value.trim();
  const telefono = document.getElementById("cliente-telefono").value.trim();

  if (!nombre) return alert("El nombre es obligatorio");

  const lista = getClientes();
  if (id) {
    // Editar
    const c = lista.find(c => c.id === id);
    if (c) { c.nombre = nombre; c.telefono = telefono; }
  } else {
    // Alta
    lista.push({
      id: crypto.randomUUID(),
      nombre,
      telefono,
      saldo: 0,
      historial: []
    });
  }

  saveClientes(lista);
  renderTablaClientes();
  limpiarFormCliente();
}
function editarCliente(id) {
  const c = getClientes().find(c => c.id === id);
  if (!c) return;
  document.getElementById("cliente-id").value       = c.id;
  document.getElementById("cliente-nombre").value   = c.nombre;
  document.getElementById("cliente-telefono").value = c.telefono;
}
function eliminarCliente(id) {
  if (!confirm("¿Eliminar este cliente?")) return;
  const lista = getClientes().filter(c => c.id !== id);
  saveClientes(lista);
  renderTablaClientes();
}
function limpiarFormCliente() {
  document.getElementById("cliente-id").value = "";
  document.getElementById("cliente-nombre").value = "";
  document.getElementById("cliente-telefono").value = "";
}

/* ─── Tabla visual ───────────────────────────────────*/
function renderTablaClientes() {
  const tbody = document.getElementById("tabla-clientes");
  tbody.innerHTML = "";
  getClientes().forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.nombre}</td>
      <td>${c.telefono || '-'}</td>
      <td>$${c.saldo.toFixed(2)}</td>
      <td>
        <button onclick="editarCliente('${c.id}')">✏️</button>
        <button onclick="eliminarCliente('${c.id}')">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

/*────────────────────────────────────────────────────────
  ASIGNAR VENTA ACTUAL AL CLIENTE SELECCIONADO
────────────────────────────────────────────────────────*/
function asignarAVentaCliente() {
  const clientes = getClientes();
  if (clientes.length === 0) return alert("No hay clientes guardados");

  const nombre = prompt(
    "Ingresa el nombre del cliente EXACTO (o parte) para buscar:"
  );
  if (!nombre) return;

  const coincidencias = clientes.filter(c =>
    c.nombre.toLowerCase().includes(nombre.toLowerCase())
  );
  if (coincidencias.length === 0) return alert("Cliente no encontrado");

  let cliente;
  if (coincidencias.length === 1) {
    cliente = coincidencias[0];
  } else {
    const lista = coincidencias.map((c, i) => `${i + 1}) ${c.nombre}`).join("\n");
    const idx = prompt("Resultados:\n" + lista + "\n\nElige el número:");
    cliente = coincidencias[idx - 1];
  }
  if (!cliente) return alert("Selección inválida");

  // Total actual del carrito
  const total = parseFloat(document.getElementById('total-price').textContent);
  if (total <= 0) return alert("Carrito vacío");

  /* Capturar productos */
  const productos = Array.from(document.querySelectorAll('#cart li')).map(li => {
    const cantidad = parseFloat(li.querySelector('.quantity')?.textContent || '1');
    const precio   = parseFloat(li.querySelector('.price')?.textContent  || '0');
    return { detalle: li.textContent.trim(), cantidad, precio };
  });

  /* Actualizar cliente */
  cliente.saldo += total;
  cliente.historial.push({
    fecha: new Date().toLocaleString(),
    productos,
    total
  });
  saveClientes(clientes);

  alert(`Venta cargada a ${cliente.nombre}. Nuevo saldo: $${cliente.saldo.toFixed(2)}`);

  /* Registrar la venta también en el sistema normal */
  finalizeSale('cuenta cliente');
}
