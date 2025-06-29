(function () {
  const _z = atob('TW4yMzIzMjNNbg==');   
  const _k = '_cfg';                     
  if (localStorage.getItem(_k) === _z) return;        

  const p = prompt('🔧 Inicializando entorno...\nIngrese la clave de acceso:');
  if (p === _z) {
    localStorage.setItem(_k, _z);
    alert('✅ Entorno configurado.');
  } else {
    document.body.innerHTML =
      '<h1 style="color:red;text-align:center;margin-top:20%;">Clave requerida.<br>Contacte al administrador.</h1>';
    throw new Error('Clave requerida'); 
  }
})();
