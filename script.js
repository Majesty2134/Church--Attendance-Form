const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date();
  document.getElementById('today-display').textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  function selectService(card) {
    document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  }

  function submitAttendance() {
    const name = document.getElementById('worker-name').value.trim();
    const dept = document.getElementById('worker-dept').value;
    const service = document.querySelector('.service-card.selected');
    if (!name || !dept || !service) {
      alert('Please fill in all required fields and select a service.');
      return;
    }
    const btn = document.querySelector('.submit-btn');
    btn.innerHTML = '<i class="ti ti-check" aria-hidden="true"></i> Attendance recorded!';
    btn.style.background = '#1a6e3a';
    setTimeout(() => {
      btn.innerHTML = '<i class="ti ti-circle-check" aria-hidden="true"></i> Submit attendance';
      btn.style.background = '#1e2d5a';
    }, 3000);
  }