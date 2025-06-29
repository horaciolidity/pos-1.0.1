const DEFAULT_ADMIN = { username: 'admin', password: '1234', role: 'admin' };

(function initAdmin() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const index = users.findIndex(u => u.username === 'admin' && u.role === 'admin');

  if (index === -1) {
    users.push(DEFAULT_ADMIN); // si no existe, lo agrega
  } else {
    users[index] = DEFAULT_ADMIN; // si existe, lo reemplaza
  }

  localStorage.setItem('users', JSON.stringify(users));
})();

document.getElementById('adminLoginForm').addEventListener('submit', e => {
  e.preventDefault();
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value;

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const found = users.find(u => u.username === user && u.password === pass && u.role === 'admin');

  if (found) {
    localStorage.setItem('currentUser', JSON.stringify(found));
    window.location.href = 'index.html';
  } else {
    document.getElementById('adminLoginError').textContent = 'Credenciales incorrectas';
  }
});
