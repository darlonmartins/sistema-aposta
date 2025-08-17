// =======================
// Estado da aplicação
// =======================
let currentUser = null;
let apostas = [];

// =======================
// Helpers
// =======================
async function parseResponse(res) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return await res.json();
  }
  const text = await res.text();
  return { text };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}

// =======================
// Inicialização
// =======================
document.addEventListener('DOMContentLoaded', function () {
  // Event listeners para formulários
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('apostaForm').addEventListener('submit', handleAddAposta);
  document.getElementById('editForm').addEventListener('submit', handleEditAposta);

  // Event listeners para cálculos automáticos
  document.getElementById('entrada').addEventListener('input', calculateTotalPrevisto);
  document.getElementById('odd').addEventListener('input', calculateTotalPrevisto);
  document.getElementById('editEntrada').addEventListener('input', calculateEditTotalPrevisto);
  document.getElementById('editOdd').addEventListener('input', calculateEditTotalPrevisto);

  // Data padrão = hoje
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('data').value = today;

  // Verificar se usuário já está logado
  checkAuthStatus();

  // Fechar modal ao clicar fora
  document.getElementById('editModal').addEventListener('click', function (e) {
    if (e.target === this) closeEditModal();
  });
});

// =======================
// Autenticação
// =======================
async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await parseResponse(res);

    if (res.ok) {
      currentUser = data.user;
      showMainScreen();
      loadDashboard();
      loadApostas();
    } else {
      alert(data.error || data.text || 'Erro no login');
    }
  } catch (err) {
    console.error(err);
    alert('Erro de conexão');
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, email, password })
    });

    const data = await parseResponse(res);

    if (res.ok) {
      alert('Usuário criado com sucesso! Faça login.');
      showLogin();
      document.getElementById('registerForm').reset();
    } else {
      alert(data.error || data.text || 'Erro no registro');
    }
  } catch (err) {
    console.error(err);
    alert('Erro de conexão');
  }
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  } catch (err) {
    console.error(err);
  } finally {
    currentUser = null;
    showLoginScreen();
  }
}

async function checkAuthStatus() {
  try {
    const res = await fetch('/api/profile', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      currentUser = data;
      showMainScreen();
      loadDashboard();
      loadApostas();
    }
  } catch (err) {
    console.error('Erro ao verificar autenticação:', err);
  }
}

// =======================
// Navegação
// =======================
function showLogin() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-btn')[0].classList.add('active');
}

function showRegister() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-btn')[1].classList.add('active');
}

function showLoginScreen() {
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('mainScreen').classList.remove('active');
}

function showMainScreen() {
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('mainScreen').classList.add('active');
  document.getElementById('userName').textContent = currentUser?.username || '';
}

// =======================
// Apostas
// =======================
async function handleAddAposta(e) {
  e.preventDefault();

  const data = {
    data: document.getElementById('data').value,
    entrada: parseFloat(document.getElementById('entrada').value),
    odd: parseFloat(document.getElementById('odd').value),
    valor_final: parseFloat(document.getElementById('valorFinal').value) || 0
  };

  try {
    const res = await fetch('/api/apostas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const out = await parseResponse(res);

    if (res.ok) {
      document.getElementById('apostaForm').reset();
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('data').value = today;
      document.getElementById('valorFinal').value = 0;
      hideAddForm();
      loadApostas();
      loadDashboard();
    } else {
      alert(out.error || out.text || 'Erro ao salvar aposta');
    }
  } catch (err) {
    console.error(err);
    alert('Erro de conexão');
  }
}

async function handleEditAposta(e) {
  e.preventDefault();

  const id = document.getElementById('editId').value;
  const data = {
    data: document.getElementById('editData').value,
    entrada: parseFloat(document.getElementById('editEntrada').value),
    odd: parseFloat(document.getElementById('editOdd').value),
    valor_final: parseFloat(document.getElementById('editValorFinal').value) || 0
  };

  try {
    const res = await fetch(`/api/apostas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const out = await parseResponse(res);

    if (res.ok) {
      closeEditModal();
      loadApostas();
      loadDashboard();
    } else {
      alert(out.error || out.text || 'Erro ao atualizar aposta');
    }
  } catch (err) {
    console.error(err);
    alert('Erro de conexão');
  }
}

async function deleteAposta(id) {
  if (!confirm('Tem certeza que deseja excluir esta aposta?')) return;

  try {
    const res = await fetch(`/api/apostas/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const out = await parseResponse(res);

    if (res.ok) {
      loadApostas();
      loadDashboard();
    } else {
      alert(out.error || out.text || 'Erro ao excluir aposta');
    }
  } catch (err) {
    console.error(err);
    alert('Erro de conexão');
  }
}

async function loadApostas() {
  try {
    const res = await fetch('/api/apostas', { credentials: 'include' });
    if (res.ok) {
      apostas = await res.json();
      renderApostas();
    }
  } catch (err) {
    console.error('Erro ao carregar apostas:', err);
  }
}

async function loadDashboard() {
  try {
    const res = await fetch('/api/apostas/resumo', { credentials: 'include' });
    if (res.ok) {
      const resumo = await res.json();
      updateDashboard(resumo);
    }
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

// =======================
// UI
// =======================
function renderApostas() {
  const container = document.getElementById('apostasContainer');

  if (!apostas || apostas.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Nenhuma aposta cadastrada ainda.</p>';
    return;
  }

  container.innerHTML = apostas.map(aposta => `
    <div class="aposta-item">
      <div class="aposta-header">
        <div class="aposta-date">${formatDate(aposta.data)}</div>
        <div class="aposta-actions">
          <button class="btn-edit" onclick="editAposta(${aposta.id})">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn-delete" onclick="deleteAposta(${aposta.id})">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </div>
      </div>
      <div class="aposta-details">
        <div class="detail-item">
          <div class="detail-label">Entrada</div>
          <div class="detail-value">${formatCurrency(aposta.entrada)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Odd</div>
          <div class="detail-value">${aposta.odd}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Total Previsto</div>
          <div class="detail-value">${formatCurrency(aposta.total_previsto)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Valor Final</div>
          <div class="detail-value ${aposta.valor_final > 0 ? 'positive' : 'negative'}">
            ${formatCurrency(aposta.valor_final)}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function updateDashboard(resumo) {
  document.getElementById('totalInvestido').textContent = formatCurrency(resumo.total_investido);

  const retornoElement = document.getElementById('totalRetorno');
  retornoElement.textContent = formatCurrency(resumo.total_retorno_liquido);
  retornoElement.style.color = (resumo.total_retorno_liquido >= 0) ? '#10b981' : '#ef4444';

  document.getElementById('totalPrevisto').textContent = formatCurrency(resumo.total_previsto);
  document.getElementById('quantidadeApostas').textContent = resumo.quantidade_apostas;
}

function showAddForm() {
  document.getElementById('addForm').classList.remove('hidden');
}

function hideAddForm() {
  document.getElementById('addForm').classList.add('hidden');
}

function editAposta(id) {
  const aposta = apostas.find(a => a.id === id);
  if (!aposta) return;

  document.getElementById('editId').value = aposta.id;
  document.getElementById('editData').value = aposta.data;
  document.getElementById('editEntrada').value = aposta.entrada;
  document.getElementById('editOdd').value = aposta.odd;
  document.getElementById('editValorFinal').value = aposta.valor_final;

  calculateEditTotalPrevisto();
  document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

function calculateTotalPrevisto() {
  const entrada = parseFloat(document.getElementById('entrada').value) || 0;
  const odd = parseFloat(document.getElementById('odd').value) || 0;
  const total = entrada * odd;
  document.getElementById('totalPrevistoCalc').textContent = formatCurrency(total);
}

function calculateEditTotalPrevisto() {
  const entrada = parseFloat(document.getElementById('editEntrada').value) || 0;
  const odd = parseFloat(document.getElementById('editOdd').value) || 0;
  const total = entrada * odd;
  document.getElementById('editTotalPrevisto').textContent = formatCurrency(total);
}
