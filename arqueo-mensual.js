/*────────────────────────────────────────────────────────
  ARQUEO MENSUAL
────────────────────────────────────────────────────────*/
function verArqueoMensual() {
  const ventas = JSON.parse(localStorage.getItem('sales')) || [];
  const ahora  = new Date();
  const mes    = ahora.getMonth();
  const año    = ahora.getFullYear();

  const filtradas = ventas.filter(v => {
    const d = new Date(v.timestamp);
    return d.getMonth() === mes && d.getFullYear() === año;
  });

  let totalMes = 0;
  filtradas.forEach(v => {
    v.cart.forEach(p => totalMes += p.price * p.quantity);
  });

  alert(`🗓  Arqueo de ${ahora.toLocaleString('es-AR', { month:'long', year:'numeric' })}\n` +
        `Ventas: ${filtradas.length}\n` +
        `Total facturado: $${totalMes.toFixed(2)}`);
}
