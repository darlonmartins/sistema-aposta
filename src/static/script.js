// Estado da aplicação
let currentUser = null;
let apostas = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Definir data padrão como hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('data').value = today;
    
    // Verificar se usuário já está logado
    checkAuthStatus();
});

// Funções de autenticação
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showMainScreen();
            loadDashboard();
            loadApostas();
        } else {
            alert(data.error || 'Erro no login');
        }
    } catch (error) {
        alert('Erro de conexão');
        console.error(error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Usuário criado com sucesso! Faça login.');
            showLogin();
            // Limpar formulário
            document.getElementById('registerForm').reset();
        } else {
            alert(data.error || 'Erro no registro');
        }
    } catch (error) {
        alert('Erro de conexão');
        console.error(error);
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        showLoginScreen();
    } catch (error) {
        console.error(error);
        // Mesmo com erro, fazer logout local
        currentUser = null;
        showLoginScreen();
    }
}

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/profile');
        if (response.ok) {
            const data = await response.json();
            currentUser = data;
            showMainScreen();
            loadDashboard();
            loadApostas();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
}

// Funções de navegação
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
    document.getElementById('userName').textContent = currentUser.username;
}

// Funções de apostas
async function handleAddAposta(e) {
    e.preventDefault();
    
    const data = {
        data: document.getElementById('data').value,
        entrada: parseFloat(document.getElementById('entrada').value),
        odd: parseFloat(document.getElementById('odd').value),
        valor_final: parseFloat(document.getElementById('valorFinal').value) || 0
    };
    
    try {
        const response = await fetch('/api/apostas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            document.getElementById('apostaForm').reset();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('data').value = today;
            document.getElementById('valorFinal').value = 0;
            hideAddForm();
            loadApostas();
            loadDashboard();
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao salvar aposta');
        }
    } catch (error) {
        alert('Erro de conexão');
        console.error(error);
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
        const response = await fetch(`/api/apostas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeEditModal();
            loadApostas();
            loadDashboard();
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao atualizar aposta');
        }
    } catch (error) {
        alert('Erro de conexão');
        console.error(error);
    }
}

async function deleteAposta(id) {
    if (!confirm('Tem certeza que deseja excluir esta aposta?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/apostas/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadApostas();
            loadDashboard();
        } else {
            alert('Erro ao excluir aposta');
        }
    } catch (error) {
        alert('Erro de conexão');
        console.error(error);
    }
}

async function loadApostas() {
    try {
        const response = await fetch('/api/apostas');
        if (response.ok) {
            apostas = await response.json();
            renderApostas();
        }
    } catch (error) {
        console.error('Erro ao carregar apostas:', error);
    }
}

async function loadDashboard() {
    try {
        const response = await fetch('/api/apostas/resumo');
        if (response.ok) {
            const resumo = await response.json();
            updateDashboard(resumo);
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function renderApostas() {
    const container = document.getElementById('apostasContainer');
    
    if (apostas.length === 0) {
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
                    <div class="detail-value ${aposta.valor_final > 0 ? 'positive' : 'negative'}">${formatCurrency(aposta.valor_final)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateDashboard(resumo) {
    document.getElementById('totalInvestido').textContent = formatCurrency(resumo.total_investido);
    
    // Corrigir a exibição do retorno líquido
    const retornoElement = document.getElementById('totalRetorno');
    retornoElement.textContent = formatCurrency(resumo.total_retorno_liquido);
    
    // Adicionar classe para cor baseada no valor (positivo = verde, negativo = vermelho)
    if (resumo.total_retorno_liquido >= 0) {
        retornoElement.style.color = '#10b981'; // Verde
    } else {
        retornoElement.style.color = '#ef4444'; // Vermelho
    }
    
    document.getElementById('totalPrevisto').textContent = formatCurrency(resumo.total_previsto);
    document.getElementById('quantidadeApostas').textContent = resumo.quantidade_apostas;
}

// Funções de UI
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

// Funções utilitárias
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// Fechar modal ao clicar fora
document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeEditModal();
    }
});

