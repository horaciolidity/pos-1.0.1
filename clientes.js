/*────────────────────────────────────────────────────────
  CLIENTES – CRUD + cuenta corriente + historial de ventas
────────────────────────────────────────────────────────*/
const LS_KEY_CLIENTES = "clientes";

/* ──────────────────── Utilidades de almacenamiento ─────────────────── */
function getClientes() {
  return JSON.parse(localStorage.getItem(LS_KEY_CLIENTES)) || [];
}
function saveClientes(arr) {
  localStorage.setItem(LS_KEY_CLIENTES, JSON.stringify(arr));
}

/* ──────────────────────── Modal ABM de clientes ────────────────────── */
function abrirModalClientes() {
  document.getElementById("modal-clientes").style.display = "block";
  renderTablaClientes();
}
function cerrarModalClientes() {
  document.getElementById("modal-clientes").style.display = "none";
  limpiarFormCliente();
}

function abrirDetalleCliente(id) {
  const cliente = getClientes().find(c => c.id === id);
  if (!cliente) return;

  // Mostrar título con total de deuda debajo
  document.getElementById("detalle-nombre-cliente").innerHTML =
    `Historial de ventas – ${cliente.nombre}<br><small>💰 Total adeudado: $${cliente.saldo.toFixed(2)}</small>`;

  const tbody = document.getElementById("tabla-detalle-cliente");
  tbody.innerHTML = "";

  if (!cliente.historial || cliente.historial.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" style="text-align:center;">Sin ventas registradas</td>`;
    tbody.appendChild(tr);
  } else {
    cliente.historial.forEach(reg => {
      const [fecha, hora] = reg.fecha.split(",").map(t => t.trim());
      reg.productos.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${fecha}</td>
          <td>${hora}</td>
          <td>${p.detalle}</td>
          <td>${p.cantidad}</td>
          <td>$${p.precio.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });
    });
  }

  document.getElementById("modal-detalle-cliente").style.display = "block";
}

function cerrarModalDetalleCliente() {
  document.getElementById("modal-detalle-cliente").style.display = "none";
}

/* ─────────────────────────── CRUD ──────────────────────────────────── */
function guardarCliente(e) {
  e.preventDefault();
  const id       = document.getElementById("cliente-id").value;
  const nombre   = document.getElementById("cliente-nombre").value.trim();
  const telefono = document.getElementById("cliente-telefono").value.trim();
  if (!nombre) return alert("El nombre es obligatorio.");

  const lista = getClientes();
  if (id) {
    /* Editar */
    const c = lista.find(c => c.id === id);
    if (c) { c.nombre = nombre; c.telefono = telefono; }
  } else {
    /* Alta */
    lista.push({
      id: crypto.randomUUID(),
      nombre,
      telefono,
      saldo: 0,
      historial: []       // ← importante para el detalle luego
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

/* ──────────── Render de tabla con nueva columna “Detalle” ──────────── */
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
        <button onclick="abrirVisorHistorialCliente('${c.id}')" title="Ver historial">👁️</button>

      </td>
      <td>
        <button class="btn-detalle" onclick="abrirDetalleCliente('${c.id}')">
          Ver historial
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
}

/* ──────────────── Asignar venta de carrito al cliente ──────────────── */
function asignarAVentaCliente() {
  const clientes = getClientes();
  if (clientes.length === 0) return alert("No hay clientes guardados");

  const nombre = prompt("Ingresa el nombre del cliente (o parte) a buscar:");
  if (!nombre) return;

  const coincidencias = clientes.filter(c =>
    c.nombre.toLowerCase().includes(nombre.toLowerCase())
  );
  if (coincidencias.length === 0) return alert("Cliente no encontrado");

  let cliente;
  if (coincidencias.length === 1) {
    cliente = coincidencias[0];
  } else {
    const lista = coincidencias
      .map((c, i) => `${i + 1}) ${c.nombre}`)
      .join("\n");
    const idx = prompt("Resultados:\n" + lista + "\n\nElige el número:");
    cliente = coincidencias[idx - 1];
  }
  if (!cliente) return alert("Selección inválida");

  /* Total actual del carrito */
  const total = parseFloat(document.getElementById("total-price").textContent);
  if (total <= 0) return alert("Carrito vacío");

  /* Capturar productos del carrito */
  const productos = Array.from(document.querySelectorAll("#cart li")).map(li => {
    const cantidad = parseFloat(
      li.querySelector(".quantity")?.textContent || "1"
    );
    const precio = parseFloat(
      li.querySelector(".price")?.textContent || "0"
    );
    return { detalle: li.textContent.trim(), cantidad, precio };
  });

  /* Actualizar cliente */
  cliente.saldo += total;
  cliente.historial.push({
    fecha: new Date().toLocaleString(), // “dd/mm/aaaa, HH:MM:SS”
    productos,
    total
  });
  saveClientes(clientes);
// Guardamos cuál cliente quedó “activo” para que el visor-cliente lo sepa
localStorage.setItem('clienteSeleccionado', cliente.id);

  alert(
    `Venta cargada a ${cliente.nombre}. Nuevo saldo: $${cliente.saldo.toFixed(2)}`
  );

  /* Registrar la venta también en el sistema normal */
  finalizeSale("cuenta cliente");
}

/* ──────────────── Cerrar modales haciendo click fuera ──────────────── */
window.onclick = e => {
  if (e.target.id === "modal-clientes")        cerrarModalClientes();
  if (e.target.id === "modal-detalle-cliente") cerrarModalDetalleCliente();
};
