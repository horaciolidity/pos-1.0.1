const TEST_EMP = { username: 'empleado', password: '1234', role: 'empleado' };

(function initEmpleado() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  if (!users.some(u => u.role === 'empleado')) {
    users.push(TEST_EMP);
    localStorage.setItem('users', JSON.stringify(users));
  }
})();

document.getElementById('empLoginForm').addEventListener('submit', e => {
  e.preventDefault();
  const user = document.getElementById('empUser').value.trim();
  const pass = document.getElementById('empPass').value;

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const found = users.find(u => u.username === user && u.password === pass && u.role === 'empleado');

  if (found) {
    localStorage.setItem('currentUser', JSON.stringify(found));
    window.location.href = 'index.html';
  } else {
    document.getElementById('empLoginError').textContent = 'Credenciales incorrectas';
  }
});
