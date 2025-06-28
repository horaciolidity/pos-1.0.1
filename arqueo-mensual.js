function verArqueoMensual() {
  const ventas = JSON.parse(localStorage.getItem('sales')) || [];
  const now    = new Date();
  const mes    = now.getMonth();
  const year   = now.getFullYear();

  /* Filtrado seguro usando timestampIso (o timestampMs) */
  const delMes = ventas.filter(v => {
    const d = v.timestampIso ? new Date(v.timestampIso)
                             : (v.timestampMs ? new Date(v.timestampMs) : new Date(v.timestamp));
    return d.getMonth() === mes && d.getFullYear() === year;
  });

  /* Sumatoria */
  let totalMes = 0;
  delMes.forEach(v => {
    v.cart.forEach(p => totalMes += p.price * p.quantity);
  });

  alert(`🗓 Arqueo ${now.toLocaleString('es-AR', { month:'long', year:'numeric' })}\n` +
        `Ventas: ${delMes.length}\n` +
        `Total facturado: $${totalMes.toFixed(2)}`);
}
