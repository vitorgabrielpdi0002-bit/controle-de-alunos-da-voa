/**
 * VOA VÔLEI - APLICATIVO MOBILE & WEB
 * Controle de Alunos, Chamada Rápida e Mensalidades
 */

import {
  store,
  CATEGORIES,
  POSITIONS,
  EVALUATION_SKILLS,
  calculateAge,
  calculateCategory,
  calculateSportAge,
  getBirthYear,
  getCategoryObj,
  calculateOverallRating,
  getEvaluationLevel
} from './data.js';

// ==========================================================================
// ESTADO GLOBAL DO APP
// ==========================================================================
const state = {
  activeTab: 'view-chamada',

  // Chamada
  chamadaDate: new Date().toISOString().split('T')[0],
  chamadaGender: 'all',
  chamadaCategory: 'all',
  chamadaRecords: {}, // { [athleteId]: 'presente' | 'falta' }

  // Atletas
  atletasGender: 'all',
  atletasCategory: 'all',
  atletasSearch: '',

  // Financeiro
  financeMonthKey: new Date().toISOString().slice(0, 7), // '2026-10'
  financeStatus: 'all',

  // Modal / Edição
  selectedAthleteId: null
};

// ==========================================================================
// INICIALIZAÇÃO
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupChamadaModule();
  setupAtletasModule();
  setupFinanceiroModule();
  setupPerfilModule();
  setupModals();
  setupPublicEnrollmentModule();
  setupShareEnrollmentModal();

  // Carrega estado inicial
  loadChamadaForCurrentDate();
  renderAtletasList();
  renderFinanceiro();
  updateProfileStats();

  // Se a URL contiver parâmetro ?inscricao=1 ou hash #inscricao, abre diretamente a tela do aluno
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('inscricao') === '1' || window.location.hash === '#inscricao') {
    switchTab('view-inscricao-publica');
  }
});

// ==========================================================================
// NAVEGAÇÃO ENTRE ABAS
// ==========================================================================
function setupNavigation() {
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      switchTab(targetId);
    });
  });

  // Botão Rápido de Adicionar no Top Bar
  const btnQuickAdd = document.getElementById('btnQuickAddAthlete');
  if (btnQuickAdd) {
    btnQuickAdd.addEventListener('click', () => {
      openAthleteModal(null);
    });
  }
}

export function switchTab(tabId) {
  state.activeTab = tabId;

  // Atualiza classes ativas nas abas
  document.querySelectorAll('.app-view').forEach(view => {
    view.classList.toggle('active', view.id === tabId);
  });

  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === tabId);
  });

  // Esconde barra inferior de navegação na tela de auto-inscrição pública de atletas
  const bottomNav = document.querySelector('.app-bottom-nav');
  const topBarActions = document.querySelector('.top-bar-actions');
  if (bottomNav) {
    bottomNav.style.display = tabId === 'view-inscricao-publica' ? 'none' : 'flex';
  }
  if (topBarActions) {
    topBarActions.style.display = tabId === 'view-inscricao-publica' ? 'none' : 'flex';
  }

  // Atualizações pontuais ao entrar na aba
  if (tabId === 'view-chamada') {
    renderChamadaList();
  } else if (tabId === 'view-atletas') {
    renderAtletasList();
  } else if (tabId === 'view-financeiro') {
    renderFinanceiro();
  } else if (tabId === 'view-perfil') {
    updateProfileStats();
  }

  // Scroll to top suave ao mudar de aba
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// MÓDULO 1: CHAMADA DO TREINO
// ==========================================================================
function setupChamadaModule() {
  const dateInput = document.getElementById('chamadaDateInput');
  const btnPrev = document.getElementById('btnPrevDate');
  const btnNext = document.getElementById('btnNextDate');
  const btnToggleAll = document.getElementById('btnToggleAllAttendance');
  const btnFinalizar = document.getElementById('btnFinalizarChamada');

  // Inicializa data no input
  if (dateInput) {
    dateInput.value = state.chamadaDate;
    dateInput.addEventListener('change', (e) => {
      if (e.target.value) {
        state.chamadaDate = e.target.value;
        loadChamadaForCurrentDate();
      }
    });
  }

  // Navegação de dias (anterior / próximo)
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      const d = new Date(state.chamadaDate + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      state.chamadaDate = d.toISOString().split('T')[0];
      if (dateInput) dateInput.value = state.chamadaDate;
      loadChamadaForCurrentDate();
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const d = new Date(state.chamadaDate + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      state.chamadaDate = d.toISOString().split('T')[0];
      if (dateInput) dateInput.value = state.chamadaDate;
      loadChamadaForCurrentDate();
    });
  }

  // Filtros de Gênero
  const genderPills = document.querySelectorAll('#chamadaGenderFilters .pill-btn');
  genderPills.forEach(pill => {
    pill.addEventListener('click', () => {
      genderPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.chamadaGender = pill.getAttribute('data-gender');
      renderChamadaList();
    });
  });

  // Filtros de Categoria
  const catPills = document.querySelectorAll('#chamadaCategoryFilters .pill-btn-cat');
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.chamadaCategory = pill.getAttribute('data-category');
      renderChamadaList();
    });
  });

  // Marcar Todos Presentes
  if (btnToggleAll) {
    btnToggleAll.addEventListener('click', toggleAllAttendanceVisible);
  }

  // Finalizar Chamada
  if (btnFinalizar) {
    btnFinalizar.addEventListener('click', finalizeChamada);
  }
}

function loadChamadaForCurrentDate() {
  updateDateDisplays();

  // Verifica se já existia registro salvo para esta data
  const existingAttendance = store.getAttendanceForDate(state.chamadaDate);
  if (existingAttendance && existingAttendance.records) {
    state.chamadaRecords = { ...existingAttendance.records };
  } else {
    // Inicializa todos com falta/neutro por padrão
    const athletes = store.getAthletes().filter(a => a.active);
    const initialMap = {};
    athletes.forEach(a => {
      initialMap[a.id] = 'falta';
    });
    state.chamadaRecords = initialMap;
  }

  renderChamadaList();
}

function updateDateDisplays() {
  const datePretty = document.getElementById('chamadaDatePretty');
  const dateTitle = document.getElementById('chamadaDateDisplay');
  
  const d = new Date(state.chamadaDate + 'T12:00:00');
  const optionsShort = { weekday: 'short', day: 'numeric', month: 'short' };
  const optionsLong = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = state.chamadaDate === todayStr;

  const shortFormatted = d.toLocaleDateString('pt-BR', optionsShort);
  const longFormatted = d.toLocaleDateString('pt-BR', optionsLong);

  if (datePretty) {
    datePretty.textContent = (isToday ? 'Hoje, ' : '') + shortFormatted.charAt(0).toUpperCase() + shortFormatted.slice(1);
  }
  if (dateTitle) {
    dateTitle.textContent = (isToday ? 'Hoje • ' : '') + longFormatted.charAt(0).toUpperCase() + longFormatted.slice(1);
  }
}

function getFilteredAthletesForChamada() {
  const athletes = store.getAthletes().filter(a => a.active);
  return athletes.filter(a => {
    if (state.chamadaGender !== 'all' && a.gender !== state.chamadaGender) {
      return false;
    }
    if (state.chamadaCategory !== 'all') {
      const cats = a.categories && Array.isArray(a.categories) && a.categories.length > 0
        ? a.categories
        : [a.category];
      if (!cats.includes(state.chamadaCategory)) {
        return false;
      }
    }
    return true;
  });
}

function renderChamadaList() {
  const container = document.getElementById('chamadaListContainer');
  if (!container) return;

  const filtered = getFilteredAthletesForChamada();
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
        <p style="font-size: 16px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">Nenhum atleta nesta categoria</p>
        <span style="font-size: 13px;">Altere os filtros acima ou cadastre novos atletas.</span>
      </div>
    `;
    updateChamadaCounters(0, 0);
    return;
  }

  let presentCount = 0;

  const html = filtered.map(athlete => {
    const status = state.chamadaRecords[athlete.id] || 'falta';
    const isPresent = status === 'presente';
    if (isPresent) presentCount++;

    const initials = getInitials(athlete.name);
    const age = calculateAge(athlete.birthDate);
    const baseCat = getCategoryObj(athlete.category).name;
    const cats = athlete.categories && Array.isArray(athlete.categories) && athlete.categories.length > 0
      ? athlete.categories
      : [athlete.category];
    
    // Categorias superiores que ele também joga
    const extraCats = cats.filter(c => c !== athlete.category).map(c => getCategoryObj(c).name);
    const catLabel = extraCats.length > 0
      ? `${baseCat} (+${extraCats.join(', ')})`
      : baseCat;

    const pos = athlete.position || 'Geral';

    return `
      <div class="athlete-call-card ${isPresent ? 'is-present' : 'is-absent'}" id="callCard_${athlete.id}">
        <div class="athlete-call-info">
          <div class="athlete-avatar-badge">${initials}</div>
          <div class="athlete-text-wrap">
            <span class="athlete-name">${escapeHTML(athlete.name)}</span>
            <span class="athlete-meta">${age} anos • ${catLabel} • ${pos}</span>
          </div>
        </div>
        
        <div class="presence-toggle-actions">
          <button type="button" 
                  class="btn-presence-toggle btn-absent ${!isPresent ? 'active' : ''}" 
                  onclick="window.togglePresence('${athlete.id}', 'falta')"
                  title="Ausente">
            ✕
          </button>
          <button type="button" 
                  class="btn-presence-toggle btn-present ${isPresent ? 'active' : ''}" 
                  onclick="window.togglePresence('${athlete.id}', 'presente')"
                  title="Presente">
            ✓
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
  updateChamadaCounters(presentCount, filtered.length);
}

// Exposta para onclick inline
window.togglePresence = function(athleteId, status) {
  state.chamadaRecords[athleteId] = status;
  renderChamadaList();
};

function toggleAllAttendanceVisible() {
  const visible = getFilteredAthletesForChamada();
  if (visible.length === 0) return;

  // Se todos os visíveis já estão presentes, desmarca todos. Caso contrário, marca todos presentes.
  const allPresent = visible.every(a => state.chamadaRecords[a.id] === 'presente');
  const targetStatus = allPresent ? 'falta' : 'presente';

  visible.forEach(a => {
    state.chamadaRecords[a.id] = targetStatus;
  });

  renderChamadaList();

  const label = targetStatus === 'presente' ? 'Todos marcados presentes!' : 'Presenças desmarcadas';
  showToast(label, 'info');
}

function updateChamadaCounters(presentCount, totalCount) {
  const numElem = document.getElementById('chamadaPresentCount');
  const totalElem = document.getElementById('chamadaTotalCount');
  const badgeCard = document.getElementById('chamadaCounterBadge');
  const footerBadge = document.getElementById('btnFinalizarBadge');
  const toggleAllLabel = document.getElementById('btnToggleAllLabel');

  if (numElem) numElem.textContent = presentCount;
  if (totalElem) totalElem.textContent = totalCount;
  if (footerBadge) footerBadge.textContent = `${presentCount} Presentes`;

  if (badgeCard) {
    badgeCard.classList.toggle('all-present', totalCount > 0 && presentCount === totalCount);
  }

  if (toggleAllLabel) {
    const allPresent = totalCount > 0 && presentCount === totalCount;
    toggleAllLabel.textContent = allPresent ? 'DESMARCAR TODOS' : 'MARCAR TODOS PRESENTES';
  }
}

function finalizeChamada() {
  const visible = getFilteredAthletesForChamada();
  if (visible.length === 0) {
    showToast('Não há atletas nesta seleção para salvar.', 'error');
    return;
  }

  // Salva no LocalStorage
  store.saveAttendanceForDate(state.chamadaDate, state.chamadaRecords);
  
  let presentCount = 0;
  visible.forEach(a => {
    if (state.chamadaRecords[a.id] === 'presente') presentCount++;
  });

  showToast(`✓ Chamada finalizada com sucesso! (${presentCount}/${visible.length} presentes)`, 'success');
  updateProfileStats();
}

// ==========================================================================
// MÓDULO 2: ATLETAS
// ==========================================================================
function setupAtletasModule() {
  const btnAdd = document.getElementById('btnAddNewAthlete');
  const searchInput = document.getElementById('athleteSearchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => openAthleteModal(null));
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.atletasSearch = e.target.value.toLowerCase().trim();
      if (btnClearSearch) {
        btnClearSearch.style.display = state.atletasSearch ? 'block' : 'none';
      }
      renderAtletasList();
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      state.atletasSearch = '';
      btnClearSearch.style.display = 'none';
      renderAtletasList();
    });
  }

  // Filtros de Gênero Atletas
  const genderPills = document.querySelectorAll('#atletasGenderFilters .pill-btn');
  genderPills.forEach(pill => {
    pill.addEventListener('click', () => {
      genderPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.atletasGender = pill.getAttribute('data-gender');
      renderAtletasList();
    });
  });

  // Filtros de Categoria Atletas
  const catPills = document.querySelectorAll('#atletasCategoryFilters .pill-btn-cat');
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.atletasCategory = pill.getAttribute('data-category');
      renderAtletasList();
    });
  });
}

function getFilteredAthletesList() {
  const athletes = store.getAthletes().filter(a => a.active);
  return athletes.filter(a => {
    if (state.atletasGender !== 'all' && a.gender !== state.atletasGender) {
      return false;
    }
    if (state.atletasCategory !== 'all') {
      const cats = a.categories && Array.isArray(a.categories) && a.categories.length > 0
        ? a.categories
        : [a.category];
      if (!cats.includes(state.atletasCategory)) {
        return false;
      }
    }
    if (state.atletasSearch && !a.name.toLowerCase().includes(state.atletasSearch)) {
      return false;
    }
    return true;
  });
}

function renderAtletasList() {
  const container = document.getElementById('atletasCardsContainer');
  const countLabel = document.getElementById('atletasSubtitleCount');
  if (!container) return;

  const filtered = getFilteredAthletesList();
  const allAthletes = store.getAthletes().filter(a => a.active);

  if (countLabel) {
    countLabel.textContent = `${allAthletes.length} aluno${allAthletes.length !== 1 ? 's' : ''} cadastrado${allAthletes.length !== 1 ? 's' : ''}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
        <p style="font-size: 16px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">Nenhum atleta encontrado</p>
        <span style="font-size: 13px;">Tente limpar a busca ou adicione um novo aluno.</span>
        <div style="margin-top: 14px;">
          <button type="button" class="btn-primary-add" onclick="window.openAthleteModal(null)" style="margin: 0 auto;">
            + Novo Aluno
          </button>
        </div>
      </div>
    `;
    return;
  }

  const currentFinances = store.getFinancesForMonth(state.financeMonthKey);

  const html = filtered.map(athlete => {
    const initials = getInitials(athlete.name);
    const age = calculateAge(athlete.birthDate);
    const isPaid = currentFinances[athlete.id] && currentFinances[athlete.id].paid;
    const phone = athlete.phone ? athlete.phone.replace(/\D/g, '') : '';

    const cats = athlete.categories && Array.isArray(athlete.categories) && athlete.categories.length > 0
      ? athlete.categories
      : [athlete.category];

    const catBadgesHtml = cats.map(c => {
      const isBase = c === athlete.category;
      const cObj = getCategoryObj(c);
      return `<span class="cat-pill-badge ${isBase ? 'base' : 'upper'}">${cObj.name}${isBase ? ' (Base)' : ' ↑'}</span>`;
    }).join(' ');

    const rating = calculateOverallRating(athlete.evaluation);
    const level = getEvaluationLevel(rating);

    return `
      <div class="athlete-info-card" onclick="window.viewAthleteDetails('${athlete.id}')">
        <div class="athlete-card-header">
          <div class="athlete-card-title-wrap">
            <div class="athlete-avatar-badge">${initials}</div>
            <div class="athlete-text-wrap">
              <span class="athlete-name">${escapeHTML(athlete.name)}</span>
              <span class="athlete-meta">${age} anos • ${athlete.position || 'Geral'}</span>
              ${rating !== null ? `
                <div class="athlete-rating-chip" style="background: ${level.color}18; color: ${level.color}; border: 1px solid ${level.color}35;">
                  ★ ${rating.toFixed(1)} • ${level.label}
                </div>
              ` : `
                <div class="athlete-rating-chip unrated">
                  ★ Sem avaliação
                </div>
              `}
              <div class="cat-badges-wrap" style="margin-top: 4px;">
                ${catBadgesHtml}
              </div>
            </div>
          </div>
          <span class="tag-badge ${isPaid ? 'paid' : 'pending'}">
            ${isPaid ? '✓ Pago' : '✕ Pendente'}
          </span>
        </div>

        <div class="athlete-card-footer">
          <span style="font-size: 12px; color: var(--text-muted);">
            Mensalidade: <strong>R$ ${athlete.monthlyFee || 150},00</strong>
          </span>

          <div class="athlete-card-actions" onclick="event.stopPropagation()">
            <button type="button" class="btn-card-action btn-eval" onclick="window.openEvaluationModal('${athlete.id}')" title="Avaliar Fundamentos (Saque, Toque, Manchete...)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </button>
            ${phone ? `
              <a href="https://wa.me/55${phone}" target="_blank" class="btn-card-action btn-whatsapp" title="Abrir WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </a>
            ` : ''}
            <button type="button" class="btn-card-action" onclick="window.openAthleteModal('${athlete.id}')" title="Editar Atleta">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// ==========================================================================
// MÓDULO 3: MENSALIDADES / FINANCEIRO
// ==========================================================================
function setupFinanceiroModule() {
  const btnPrev = document.getElementById('btnPrevMonth');
  const btnNext = document.getElementById('btnNextMonth');

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      changeFinanceMonth(-1);
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      changeFinanceMonth(1);
    });
  }

  const statusPills = document.querySelectorAll('#financeStatusFilters .pill-btn');
  statusPills.forEach(pill => {
    pill.addEventListener('click', () => {
      statusPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.financeStatus = pill.getAttribute('data-status');
      renderFinanceiro();
    });
  });
}

function changeFinanceMonth(delta) {
  const [year, month] = state.financeMonthKey.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  const newY = d.getFullYear();
  const newM = String(d.getMonth() + 1).padStart(2, '0');
  state.financeMonthKey = `${newY}-${newM}`;
  renderFinanceiro();
}

function renderFinanceiro() {
  updateFinanceMonthDisplay();

  const athletes = store.getAthletes().filter(a => a.active);
  const finances = store.getFinancesForMonth(state.financeMonthKey);

  let totalReceived = 0;
  let totalPending = 0;
  let countPaid = 0;
  let countPending = 0;

  athletes.forEach(a => {
    const fee = a.monthlyFee || 150;
    const isPaid = finances[a.id] && finances[a.id].paid;
    if (isPaid) {
      totalReceived += fee;
      countPaid++;
    } else {
      totalPending += fee;
      countPending++;
    }
  });

  const totalExpected = totalReceived + totalPending;
  const percentage = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;

  // Atualiza KPIs
  const kpiRec = document.getElementById('kpiReceivedValue');
  const kpiRecCount = document.getElementById('kpiReceivedCount');
  const kpiPend = document.getElementById('kpiPendingValue');
  const kpiPendCount = document.getElementById('kpiPendingCount');
  const kpiTotal = document.getElementById('kpiTotalExpected');
  const kpiProgressText = document.getElementById('kpiProgressPercentage');
  const kpiProgressBar = document.getElementById('kpiProgressBar');

  if (kpiRec) kpiRec.textContent = formatCurrency(totalReceived);
  if (kpiRecCount) kpiRecCount.textContent = `${countPaid} pago${countPaid !== 1 ? 's' : ''}`;
  if (kpiPend) kpiPend.textContent = formatCurrency(totalPending);
  if (kpiPendCount) kpiPendCount.textContent = `${countPending} pendente${countPending !== 1 ? 's' : ''}`;
  if (kpiTotal) kpiTotal.textContent = formatCurrency(totalExpected);
  if (kpiProgressText) kpiProgressText.textContent = `${percentage}%`;
  if (kpiProgressBar) kpiProgressBar.style.width = `${percentage}%`;

  // Renderiza lista filtrada
  const listContainer = document.getElementById('financesListContainer');
  if (!listContainer) return;

  const filteredAthletes = athletes.filter(a => {
    const isPaid = finances[a.id] && finances[a.id].paid;
    if (state.financeStatus === 'paid' && !isPaid) return false;
    if (state.financeStatus === 'pending' && isPaid) return false;
    return true;
  });

  if (filteredAthletes.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 32px 16px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">
        Nenhum aluno com o status selecionado neste mês.
      </div>
    `;
    return;
  }

  const monthName = getMonthName(state.financeMonthKey);

  const html = filteredAthletes.map(athlete => {
    const fee = athlete.monthlyFee || 150;
    const isPaid = finances[athlete.id] && finances[athlete.id].paid;
    const phone = athlete.phone ? athlete.phone.replace(/\D/g, '') : '';
    const cat = getCategoryObj(athlete.category).name;

    // Mensagem amigável de cobrança via WhatsApp
    const whatsappMsg = encodeURIComponent(
      `Olá! Lembramos que a mensalidade de voleibol da VOA Academy referente a ${monthName} de ${athlete.name} (R$ ${fee},00) está disponível. Chave PIX: voleiacademyolympic@gmail.com. Contato: (77) 98141-9995. Bons treinos! 🏐`
    );

    return `
      <div class="finance-item-card">
        <div class="finance-item-info">
          <span class="finance-item-name">${escapeHTML(athlete.name)}</span>
          <span class="finance-item-fee">${cat} • R$ ${fee},00 / mês</span>
        </div>

        <div class="finance-item-actions">
          ${!isPaid && phone ? `
            <a href="https://wa.me/55${phone}?text=${whatsappMsg}" target="_blank" class="btn-card-action btn-whatsapp" title="Enviar Cobrança WhatsApp">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </a>
          ` : ''}

          <button type="button" 
                  class="btn-toggle-payment ${isPaid ? 'is-paid' : 'is-pending'}" 
                  onclick="window.toggleAthletePayment('${athlete.id}', ${fee})">
            ${isPaid ? '✓ Pago' : 'Marcar Pago'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  listContainer.innerHTML = html;
}

window.toggleAthletePayment = function(athleteId, amount) {
  const newStatus = store.togglePaymentStatus(state.financeMonthKey, athleteId, amount);
  renderFinanceiro();
  renderAtletasList();
  showToast(newStatus ? 'Mensalidade marcada como paga!' : 'Mensalidade marcada como pendente.', 'info');
};

function updateFinanceMonthDisplay() {
  const display = document.getElementById('currentMonthDisplay');
  if (display) {
    display.textContent = getMonthName(state.financeMonthKey);
  }
}

function getMonthName(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return monthName.charAt(0).toUpperCase() + monthName.slice(1);
}

// ==========================================================================
// MÓDULO 4: PERFIL & FERRAMENTAS
// ==========================================================================
function setupPerfilModule() {
  const profile = store.getProfile();
  
  const nameElem = document.getElementById('profileCoachName');
  const roleElem = document.getElementById('profileCoachRole');
  const emailElem = document.getElementById('profileCoachEmail');
  const phoneElem = document.getElementById('profileCoachPhone');
  const academyElem = document.getElementById('profileCoachAcademy');

  if (nameElem) nameElem.textContent = profile.name || 'Vitor Gabriel';
  if (roleElem) roleElem.textContent = profile.role || 'TREINADOR';
  if (emailElem) emailElem.textContent = profile.email || 'voleiacademyolympic@gmail.com';
  if (phoneElem) phoneElem.textContent = '(77) 98141-9995';
  if (academyElem) academyElem.textContent = profile.academy || 'VOA Academy';

  // Ação de Sair
  const btnLogout = document.getElementById('btnLogoutProfile');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      showToast('Sessão do treinador finalizada.', 'info');
    });
  }
}

function updateProfileStats() {
  const athletes = store.getAthletes().filter(a => a.active);
  const attendances = store.getAttendances();
  const attKeys = Object.keys(attendances);

  const statAthletes = document.getElementById('profileStatAthletes');
  const statAttendances = document.getElementById('profileStatAttendances');
  const statRate = document.getElementById('profileStatRate');

  if (statAthletes) statAthletes.textContent = athletes.length;
  if (statAttendances) statAttendances.textContent = attKeys.length;

  if (statRate) {
    if (attKeys.length === 0) {
      statRate.textContent = '100%';
    } else {
      let totalChecks = 0;
      let totalPresents = 0;
      attKeys.forEach(k => {
        const records = attendances[k].records || {};
        Object.values(records).forEach(st => {
          totalChecks++;
          if (st === 'presente') totalPresents++;
        });
      });
      const rate = totalChecks > 0 ? Math.round((totalPresents / totalChecks) * 100) : 100;
      statRate.textContent = `${rate}%`;
    }
  }
}

// ==========================================================================
// MODAIS: NOVO/EDITAR ATLETA & DETALHES
// ==========================================================================
function setupModals() {
  const modalAthlete = document.getElementById('athleteModal');
  const btnCloseModal = document.getElementById('btnCloseAthleteModal');
  const btnCancelModal = document.getElementById('btnCancelAthleteModal');
  const formAthlete = document.getElementById('athleteForm');

  const modalDetail = document.getElementById('athleteDetailModal');
  const btnCloseDetail = document.getElementById('btnCloseDetailModal');
  const btnCloseDetailBtn = document.getElementById('btnCloseDetailModalBtn');
  const btnEditFromDetail = document.getElementById('btnEditCurrentAthlete');
  const btnDeleteFromDetail = document.getElementById('btnDeleteCurrentAthlete');

  // Fechar Modal Atleta
  [btnCloseModal, btnCancelModal].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        if (modalAthlete) modalAthlete.classList.remove('open');
      });
    }
  });

  // Fechar Modal Detalhes
  [btnCloseDetail, btnCloseDetailBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        if (modalDetail) modalDetail.classList.remove('open');
      });
    }
  });

  // Estado temporário das categorias selecionadas no modal
  let modalSelectedCategories = new Set(['sub15']);

  function updateAthleteCalcCard(birthDate, categoryId) {
    const card = document.getElementById('athleteCalcCard');
    const yearVal = document.getElementById('calcYearVal');
    const ageVal = document.getElementById('calcAgeVal');
    const catVal = document.getElementById('calcCatVal');
    const yearHint = document.getElementById('formYearHint');
    if (!card) return;

    if (!birthDate) {
      if (yearVal) yearVal.textContent = '----';
      if (ageVal) ageVal.textContent = '-- anos';
      if (catVal) catVal.textContent = '--';
      if (yearHint) yearHint.textContent = 'Informe a data';
      return;
    }

    const birthYear = getBirthYear(birthDate);
    const sportAge = calculateSportAge(birthDate);
    const chosenCat = categoryId || calculateCategory(birthDate);
    const catObj = getCategoryObj(chosenCat);

    if (yearVal) yearVal.textContent = birthYear;
    if (ageVal) ageVal.textContent = `${sportAge} anos`;
    if (catVal) {
      catVal.textContent = catObj.name;
      catVal.style.color = catObj.color || 'var(--primary)';
    }
    if (yearHint) {
      yearHint.textContent = `Nasc. ${birthYear} (${sportAge} anos)`;
    }
  }

  function renderModalCategoriesPills(baseCategory) {
    const container = document.getElementById('formCategoriesPills');
    if (!container) return;

    // Se o conjunto estiver vazio, adiciona a categoria base
    if (baseCategory && modalSelectedCategories.size === 0) {
      modalSelectedCategories.add(baseCategory);
    }

    const html = CATEGORIES.map(cat => {
      const isSelected = modalSelectedCategories.has(cat.id);
      const isBase = cat.id === baseCategory;

      return `
        <button type="button" 
                class="cat-chip-pill ${isSelected ? 'selected' : ''} ${isBase ? 'is-base' : ''}" 
                data-cat-id="${cat.id}">
          <div class="chip-left-meta">
            <span class="chip-color-dot" style="background: ${cat.color};"></span>
            <span class="chip-cat-name">${cat.name}</span>
          </div>
          <div class="chip-right-meta">
            ${isBase ? '<span class="chip-base-tag">Base</span>' : ''}
            <span class="chip-action-icon">${isSelected ? '✓' : '+'}</span>
          </div>
        </button>
      `;
    }).join('');

    container.innerHTML = html;

    container.querySelectorAll('.cat-chip-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.getAttribute('data-cat-id');
        const currentBase = document.getElementById('formCategory').value;

        if (modalSelectedCategories.has(catId)) {
          // Permite desmarcar livremente se houver mais de uma categoria
          if (modalSelectedCategories.size > 1) {
            modalSelectedCategories.delete(catId);
          } else {
            showToast('Selecione pelo menos uma categoria para o atleta.', 'info');
          }
        } else {
          modalSelectedCategories.add(catId);
        }

        renderModalCategoriesPills(currentBase);
      });
    });
  }

  // Calcular Categoria ao alterar data de nascimento (Regra por Ano de Nascimento + Liberdade Manual)
  const birthInput = document.getElementById('formBirthDate');
  const catSelect = document.getElementById('formCategory');
  const yearHint = document.getElementById('formYearHint');

  const onBirthDateUpdate = () => {
    if (!birthInput || !birthInput.value) {
      updateAthleteCalcCard('', '');
      return;
    }
    const suggested = calculateCategory(birthInput.value);
    if (catSelect) catSelect.value = suggested;

    updateAthleteCalcCard(birthInput.value, suggested);

    // CORREÇÃO: Limpa qualquer categoria anterior e seleciona APENAS a categoria do ano inserido!
    modalSelectedCategories = new Set([suggested]);
    renderModalCategoriesPills(suggested);
  };

  if (birthInput && catSelect) {
    birthInput.addEventListener('change', onBirthDateUpdate);
    birthInput.addEventListener('input', onBirthDateUpdate);
  }

  if (catSelect) {
    catSelect.addEventListener('change', () => {
      updateAthleteCalcCard(birthInput ? birthInput.value : '', catSelect.value);
      // Ao mudar manualmente a categoria principal, também ajusta a seleção
      modalSelectedCategories = new Set([catSelect.value]);
      renderModalCategoriesPills(catSelect.value);
    });
  }

  // Formatação automática do telefone / WhatsApp
  const phoneInput = document.getElementById('formPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 6) {
        e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
      } else if (v.length > 2) {
        e.target.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      } else if (v.length > 0) {
        e.target.value = `(${v}`;
      } else {
        e.target.value = '';
      }
    });
  }

  // Expandir / Recolher Seção de Avaliação Técnica Inicial no Formulário
  const btnToggleFormEval = document.getElementById('btnToggleFormEval');
  const formEvalContent = document.getElementById('formEvalContent');
  const formEvalSection = document.getElementById('formEvalSection');
  const formEvalBadge = document.getElementById('formEvalBadge');
  if (btnToggleFormEval && formEvalContent) {
    btnToggleFormEval.addEventListener('click', () => {
      const isHidden = formEvalContent.style.display === 'none';
      formEvalContent.style.display = isHidden ? 'block' : 'none';
      if (formEvalSection) formEvalSection.classList.toggle('open', isHidden);
      if (formEvalBadge) formEvalBadge.textContent = isHidden ? 'Recolher ▴' : 'Preencher ▾';
    });
  }

  // Submeter Formulário Atleta
  if (formAthlete) {
    formAthlete.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const id = document.getElementById('formAthleteId').value;
      const name = document.getElementById('formName').value.trim();
      const birthDate = document.getElementById('formBirthDate').value;
      const gender = document.getElementById('formGender').value;
      const category = document.getElementById('formCategory').value;
      const position = document.getElementById('formPosition').value;
      const phone = document.getElementById('formPhone').value.trim();
      const monthlyFee = parseFloat(document.getElementById('formMonthlyFee').value) || 150;

      // Garante que a categoria base esteja nas categorias do atleta
      modalSelectedCategories.add(category);
      const categories = Array.from(modalSelectedCategories);

      if (!name || !birthDate) {
        showToast('Preencha o nome e a data de nascimento.', 'error');
        return;
      }

      // Coleta Avaliação Técnica se preenchida
      const evalData = {};
      let hasAnyEval = false;
      EVALUATION_SKILLS.forEach(skill => {
        const inp = document.getElementById(`formSkill_${skill.id}`);
        if (inp && inp.value !== '') {
          const val = parseFloat(inp.value);
          if (!isNaN(val)) {
            evalData[skill.id] = Math.min(10, Math.max(1, val));
            hasAnyEval = true;
          }
        }
      });
      const formSkillNotes = document.getElementById('formSkill_notes');
      if (formSkillNotes && formSkillNotes.value.trim()) {
        evalData.notes = formSkillNotes.value.trim();
        hasAnyEval = true;
      }

      if (hasAnyEval) {
        // Preenche notas faltantes com nota 7.0 padrão
        EVALUATION_SKILLS.forEach(skill => {
          if (evalData[skill.id] === undefined) {
            evalData[skill.id] = 7.0;
          }
        });
        evalData.updatedAt = new Date().toISOString().split('T')[0];
      }

      if (id) {
        // Atualização
        const updatePayload = {
          name,
          birthDate,
          gender,
          category,
          categories,
          position,
          phone,
          monthlyFee
        };
        if (hasAnyEval) {
          updatePayload.evaluation = evalData;
        }
        store.updateAthlete(id, updatePayload);
        showToast('Atleta atualizado com sucesso!', 'success');
      } else {
        // Criação
        const newPayload = {
          name,
          birthDate,
          gender,
          category,
          categories,
          position,
          phone,
          monthlyFee
        };
        if (hasAnyEval) {
          newPayload.evaluation = evalData;
        }
        store.addAthlete(newPayload);
        showToast('Novo atleta cadastrado com sucesso!', 'success');
      }

      if (modalAthlete) modalAthlete.classList.remove('open');
      renderAtletasList();
      renderChamadaList();
      renderFinanceiro();
      updateProfileStats();
    });
  }

  // Ações no Modal de Detalhes
  if (btnEditFromDetail) {
    btnEditFromDetail.addEventListener('click', () => {
      if (modalDetail) modalDetail.classList.remove('open');
      if (state.selectedAthleteId) {
        openAthleteModal(state.selectedAthleteId);
      }
    });
  }

  if (btnDeleteFromDetail) {
    btnDeleteFromDetail.addEventListener('click', () => {
      if (!state.selectedAthleteId) return;
      const ath = store.getAthleteById(state.selectedAthleteId);
      if (!ath) return;

      if (confirm(`Tem certeza que deseja remover o(a) atleta ${ath.name}?`)) {
        store.deleteAthlete(state.selectedAthleteId);
        if (modalDetail) modalDetail.classList.remove('open');
        showToast('Atleta excluído com sucesso.', 'info');
        renderAtletasList();
        renderChamadaList();
        renderFinanceiro();
        updateProfileStats();
      }
    });
  }

  window.openAthleteModal = function(athleteId) {
    const modal = document.getElementById('athleteModal');
    const title = document.getElementById('modalAthleteTitle');
    const form = document.getElementById('athleteForm');

    if (!modal || !form) return;

    form.reset();

    if (athleteId) {
      const athlete = store.getAthleteById(athleteId);
      if (!athlete) return;

      title.textContent = 'Editar Atleta';
      document.getElementById('formAthleteId').value = athlete.id;
      document.getElementById('formName').value = athlete.name;
      document.getElementById('formBirthDate').value = athlete.birthDate;
      document.getElementById('formGender').value = athlete.gender;
      document.getElementById('formCategory').value = athlete.category;
      document.getElementById('formPosition').value = athlete.position || 'Iniciante / Geral';
      document.getElementById('formPhone').value = athlete.phone || '';
      document.getElementById('formMonthlyFee').value = athlete.monthlyFee || 150;

      const initialCats = athlete.categories && Array.isArray(athlete.categories) && athlete.categories.length > 0
        ? athlete.categories
        : [athlete.category];
      modalSelectedCategories = new Set(initialCats);
      renderModalCategoriesPills(athlete.category);
      updateAthleteCalcCard(athlete.birthDate, athlete.category);

      // Preenche avaliação existente no formulário
      if (athlete.evaluation) {
        EVALUATION_SKILLS.forEach(skill => {
          const inp = document.getElementById(`formSkill_${skill.id}`);
          if (inp) inp.value = athlete.evaluation[skill.id] !== undefined ? athlete.evaluation[skill.id] : '';
        });
        const notesInp = document.getElementById('formSkill_notes');
        if (notesInp) notesInp.value = athlete.evaluation.notes || '';
        if (formEvalContent) formEvalContent.style.display = 'block';
        if (formEvalSection) formEvalSection.classList.add('open');
        if (formEvalBadge) formEvalBadge.textContent = 'Avaliado ✓';
      } else {
        EVALUATION_SKILLS.forEach(skill => {
          const inp = document.getElementById(`formSkill_${skill.id}`);
          if (inp) inp.value = '';
        });
        const notesInp = document.getElementById('formSkill_notes');
        if (notesInp) notesInp.value = '';
        if (formEvalContent) formEvalContent.style.display = 'none';
        if (formEvalSection) formEvalSection.classList.remove('open');
        if (formEvalBadge) formEvalBadge.textContent = 'Preencher ▾';
      }
    } else {
      title.textContent = 'Novo Aluno';
      document.getElementById('formAthleteId').value = '';
      document.getElementById('formName').value = '';
      document.getElementById('formBirthDate').value = '';
      document.getElementById('formGender').value = 'M';
      
      document.getElementById('formCategory').value = 'sub15';
      document.getElementById('formPosition').value = 'Iniciante / Geral';
      document.getElementById('formPhone').value = '';
      document.getElementById('formMonthlyFee').value = '150';

      modalSelectedCategories = new Set(['sub15']);
      renderModalCategoriesPills('sub15');
      updateAthleteCalcCard('', '');

      // Limpa campos de avaliação
      EVALUATION_SKILLS.forEach(skill => {
        const inp = document.getElementById(`formSkill_${skill.id}`);
        if (inp) inp.value = '';
      });
      const notesInp = document.getElementById('formSkill_notes');
      if (notesInp) notesInp.value = '';
      if (formEvalContent) formEvalContent.style.display = 'none';
      if (formEvalSection) formEvalSection.classList.remove('open');
      if (formEvalBadge) formEvalBadge.textContent = 'Preencher ▾';
    }

    modal.classList.add('open');
  };

  window.viewAthleteDetails = function(athleteId) {
    const athlete = store.getAthleteById(athleteId);
    if (!athlete) return;

    state.selectedAthleteId = athleteId;

    const modal = document.getElementById('athleteDetailModal');
    const content = document.getElementById('athleteDetailContent');
    if (!modal || !content) return;

    const age = calculateAge(athlete.birthDate);
    const cat = getCategoryObj(athlete.category);
    const phone = athlete.phone || 'Não informado';
    const finances = store.getFinancesForMonth(state.financeMonthKey);
    const isPaid = finances[athlete.id] && finances[athlete.id].paid;

    const cats = athlete.categories && Array.isArray(athlete.categories) && athlete.categories.length > 0
      ? athlete.categories
      : [athlete.category];

    const catBadgesHtml = cats.map(c => {
      const isBase = c === athlete.category;
      const cObj = getCategoryObj(c);
      return `<span class="cat-pill-badge ${isBase ? 'base' : 'upper'}">${cObj.name}${isBase ? ' (Base)' : ' ↑'}</span>`;
    }).join(' ');

    // Calcula presenças deste atleta
    const attendances = store.getAttendances();
    let totalTreinos = 0;
    let totalPresencas = 0;
    Object.values(attendances).forEach(att => {
      if (att.records && att.records[athlete.id] !== undefined) {
        totalTreinos++;
        if (att.records[athlete.id] === 'presente') totalPresencas++;
      }
    });

    const frequencia = totalTreinos > 0 ? Math.round((totalPresencas / totalTreinos) * 100) : 100;

    const rating = calculateOverallRating(athlete.evaluation);
    const level = getEvaluationLevel(rating);

    let evaluationSectionHtml = '';
    if (athlete.evaluation && rating !== null) {
      const skillBarsHtml = EVALUATION_SKILLS.map(skill => {
        const val = typeof athlete.evaluation[skill.id] === 'number' ? athlete.evaluation[skill.id] : 5;
        const percent = Math.min(100, Math.max(0, (val / 10) * 100));
        let barColor = '#ef4444';
        if (val >= 9.0) barColor = 'linear-gradient(90deg, #F59E0B, #FF8533)';
        else if (val >= 7.5) barColor = 'linear-gradient(90deg, #10B981, #34D399)';
        else if (val >= 6.0) barColor = 'linear-gradient(90deg, #3B82F6, #60A5FA)';
        else if (val >= 4.5) barColor = 'linear-gradient(90deg, #F97316, #FB923C)';

        return `
          <div class="detail-skill-bar-row">
            <div class="detail-skill-meta">
              <span class="detail-skill-label">
                <span>${skill.icon}</span>
                <span>${skill.name}</span>
              </span>
              <span class="detail-skill-val">${val.toFixed(1)} <span style="font-size: 10px; color: var(--text-muted);">/10</span></span>
            </div>
            <div class="detail-progress-track">
              <div class="detail-progress-fill" style="width: ${percent}%; background: ${barColor};"></div>
            </div>
          </div>
        `;
      }).join('');

      evaluationSectionHtml = `
        <div class="detail-eval-section">
          <div class="detail-eval-header">
            <div>
              <span class="detail-eval-title">Avaliação Técnica de Fundamentos</span>
              <span class="detail-eval-date">Último scout em ${formatDateBR(athlete.evaluation.updatedAt || '2026-10-18')}</span>
            </div>
            <div class="detail-eval-badge-wrap">
              <span class="detail-eval-score-num">★ ${rating.toFixed(1)}</span>
              <span class="detail-eval-level" style="color: ${level.color};">${level.label}</span>
            </div>
          </div>

          <!-- Gráfico Visual de Radar dos Dados Técnicos com a Média no Centro e Topo -->
          <div class="eval-radar-wrapper" style="margin: 10px 0 14px; background: rgba(0,0,0,0.25); border-color: rgba(255,107,0,0.2);">
            ${renderVolleyballRadarSvg(athlete.evaluation, 290, 270)}
          </div>

          <div class="detail-skills-bars-grid">
            ${skillBarsHtml}
          </div>

          ${athlete.evaluation.notes ? `
            <div class="detail-eval-notes">
              <strong>Observações do Treinador:</strong>
              <p>${escapeHTML(athlete.evaluation.notes)}</p>
            </div>
          ` : ''}

          <!-- Gráfico e Histórico da Evolução das Médias a Cada Avaliação -->
          ${renderEvaluationHistorySectionHtml(athlete)}

          <div style="margin-top: 14px;">
            <button type="button" class="btn-open-eval-from-detail" onclick="window.openEvaluationModal('${athlete.id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Nova Avaliação Técnica / Atualizar Notas</span>
            </button>
          </div>
        </div>
      `;
    } else {
      evaluationSectionHtml = `
        <div class="detail-eval-empty">
          <div class="empty-eval-icon">⭐</div>
          <div class="empty-eval-text">
            <strong>Atleta ainda não avaliado</strong>
            <span>Avalie saque, toque, manchete, ataque, posicionamento e volume.</span>
          </div>
          <button type="button" class="btn-open-eval-from-detail" onclick="window.openEvaluationModal('${athlete.id}')">
            ⭐ Fazer Avaliação Técnica
          </button>
        </div>
      `;
    }

    content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 8px;">
        <div class="athlete-avatar-badge" style="width: 52px; height: 52px; font-size: 18px;">
          ${getInitials(athlete.name)}
        </div>
        <div>
          <h3 style="font-size: 18px; font-weight: 800; color: #fff;">${escapeHTML(athlete.name)}</h3>
          <span style="font-size: 13px; color: var(--primary); font-weight: 700;">${cat.name} • ${athlete.position || 'Geral'}</span>
        </div>
      </div>

      <div class="detail-row">
        <span class="detail-label">Idade</span>
        <span class="detail-value">${age} anos</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Data de Nascimento</span>
        <span class="detail-value">${formatDateBR(athlete.birthDate)}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Gênero</span>
        <span class="detail-value">${athlete.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Categorias que Pode Jogar</span>
        <div class="detail-value" style="display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px;">
          ${catBadgesHtml}
        </div>
      </div>

      <div class="detail-row">
        <span class="detail-label">WhatsApp / Telefone</span>
        <span class="detail-value">${phone}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Mensalidade</span>
        <span class="detail-value">R$ ${athlete.monthlyFee || 150},00</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Status Mensal (${getMonthName(state.financeMonthKey)})</span>
        <span class="detail-value" style="color: ${isPaid ? 'var(--success)' : 'var(--warning)'}; font-weight: 800;">
          ${isPaid ? '✓ PAGO' : '✕ PENDENTE'}
        </span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Frequência em Treinos</span>
        <span class="detail-value">${frequencia}% (${totalPresencas}/${totalTreinos} treinos)</span>
      </div>

      ${evaluationSectionHtml}
    `;

    modal.classList.add('open');
  };

  // ==========================================================================
  // GERADOR DO GRÁFICO HEPTAGONAL DE RADAR (SCOUTING DE DADOS)
  // ==========================================================================
  function renderVolleyballRadarSvg(evalObj, width = 300, height = 270) {
    if (!evalObj) return '';
    const skills = EVALUATION_SKILLS;
    const n = skills.length; // 7 fundamentos
    const cx = width / 2;
    const cy = height / 2 + 12;
    const maxR = Math.min(width, height) * 0.31;

    // Calcula a média geral atual da avaliação
    const avg = calculateOverallRating(evalObj) || 7.0;
    const level = getEvaluationLevel(avg);

    // Níveis concêntricos heptagonais (2.5, 5.0, 7.5, 10.0)
    const levels = [0.25, 0.5, 0.75, 1.0];
    let gridPolygonsHtml = '';
    levels.forEach(lvl => {
      const r = maxR * lvl;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
      }
      const isOuter = lvl === 1.0;
      gridPolygonsHtml += `<polygon points="${pts.join(' ')}" fill="${isOuter ? 'rgba(255,255,255,0.02)' : 'none'}" stroke="rgba(255,255,255,${isOuter ? '0.15' : '0.07'})" stroke-width="${isOuter ? '1.5' : '1'}" />`;
    });

    // Eixos radiais do centro a cada vértice
    let spokesHtml = '';
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const x = (cx + maxR * Math.cos(angle)).toFixed(1);
      const y = (cy + maxR * Math.sin(angle)).toFixed(1);
      spokesHtml += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="2 2" />`;
    }

    // Polígono de dados e pontos de cada fundamento
    const dataPoints = [];
    let dotsHtml = '';
    let labelsHtml = '';

    for (let i = 0; i < n; i++) {
      const skill = skills[i];
      const val = typeof evalObj[skill.id] === 'number' ? evalObj[skill.id] : 7.0;
      const clampedVal = Math.min(10, Math.max(1, val));
      const r = (clampedVal / 10) * maxR;
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      dataPoints.push(`${px.toFixed(1)},${py.toFixed(1)}`);

      // Ponto no vértice
      dotsHtml += `
        <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5" fill="#FFFFFF" stroke="#FF6B00" stroke-width="2">
          <title>${skill.name}: ${clampedVal.toFixed(1)}</title>
        </circle>
      `;

      // Posicionamento do rótulo
      const labelR = maxR + 18;
      const lx = cx + labelR * Math.cos(angle);
      const ly = cy + labelR * Math.sin(angle);

      let textAnchor = 'middle';
      const cosVal = Math.cos(angle);
      if (cosVal > 0.3) textAnchor = 'start';
      else if (cosVal < -0.3) textAnchor = 'end';

      const shortName = skill.name.replace(' de Ataque', '');
      labelsHtml += `
        <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" 
              text-anchor="${textAnchor}" 
              dominant-baseline="central" 
              font-size="9.5" 
              font-weight="700" 
              fill="#cbd5e1">
          ${skill.icon} ${shortName} <tspan fill="#FF8533" font-weight="900">${clampedVal.toFixed(1)}</tspan>
        </text>
      `;
    }

    const gradId = 'radarGrad_' + Math.random().toString(36).substr(2, 6);

    return `
      <svg class="volleyball-radar-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="${gradId}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FF6B00" stop-opacity="0.5" />
            <stop offset="70%" stop-color="#F59E0B" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#FF6B00" stop-opacity="0.05" />
          </radialGradient>
        </defs>

        <!-- Top Header Pill: Média Geral da Avaliação no Gráfico -->
        <g class="radar-top-pill">
          <rect x="${(cx - 95).toFixed(1)}" y="5" width="190" height="24" rx="12" 
                fill="#0e1422" stroke="${level.color}75" stroke-width="1.3" />
          <text x="${cx}" y="17" text-anchor="middle" dominant-baseline="central" 
                font-size="10.5" font-weight="800" fill="#cbd5e1">
            Média Geral: <tspan fill="${level.color}" font-weight="900">★ ${avg.toFixed(1)}</tspan> (${level.label})
          </text>
        </g>

        ${gridPolygonsHtml}
        ${spokesHtml}

        <!-- Polígono Preenchido de Fundamentos -->
        <polygon points="${dataPoints.join(' ')}" 
                 fill="url(#${gradId})" 
                 stroke="#FF6B00" 
                 stroke-width="2.2" 
                 stroke-linejoin="round" />

        ${dotsHtml}
        ${labelsHtml}

        <!-- Central Hub: Média do Atleta no Centro do Gráfico -->
        <g class="radar-center-hub">
          <circle cx="${cx}" cy="${cy}" r="22" fill="#0c101a" stroke="${level.color}" stroke-width="2.2" />
          <circle cx="${cx}" cy="${cy}" r="17" fill="${level.color}20" />
          <text x="${cx}" y="${cy - 3}" text-anchor="middle" dominant-baseline="central" 
                font-size="13" font-weight="900" fill="#FFFFFF">${avg.toFixed(1)}</text>
          <text x="${cx}" y="${cy + 8}" text-anchor="middle" dominant-baseline="central" 
                font-size="6.5" font-weight="800" fill="${level.color}" letter-spacing="0.08em">MÉDIA</text>
        </g>
      </svg>
    `;
  }

  // ==========================================================================
  // GRÁFICO DE EVOLUÇÃO DAS MÉDIAS POR AVALIAÇÃO
  // ==========================================================================
  function renderEvaluationHistorySvg(historyArray, width = 290, height = 120) {
    if (!historyArray || !Array.isArray(historyArray) || historyArray.length < 2) return '';

    const padL = 32;
    const padR = 32;
    const padT = 22;
    const padB = 26;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const n = historyArray.length;

    const scores = historyArray.map(h => typeof h.average === 'number' ? h.average : 7.0);
    let minVal = Math.min(...scores);
    let maxVal = Math.max(...scores);
    if (minVal === maxVal) {
      minVal = Math.max(1, minVal - 1);
      maxVal = Math.min(10, maxVal + 1);
    }
    const yMin = Math.max(1, minVal - 0.5);
    const yMax = Math.min(10, maxVal + 0.5);

    const coords = historyArray.map((h, i) => {
      const x = padL + (i / (n - 1)) * plotW;
      const y = padT + (1 - (scores[i] - yMin) / (yMax - yMin)) * plotH;
      return { x, y, score: scores[i], date: h.date };
    });

    const polylinePoints = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const areaPoints = `${coords[0].x.toFixed(1)},${(height - padB).toFixed(1)} ${polylinePoints} ${coords[n - 1].x.toFixed(1)},${(height - padB).toFixed(1)}`;

    const gradId = 'historyGrad_' + Math.random().toString(36).substr(2, 6);

    // Linhas de grade sutis
    const gridLines = [yMin, (yMin + yMax) / 2, yMax].map(v => {
      const y = padT + (1 - (v - yMin) / (yMax - yMin)) * plotH;
      return `<line x1="${padL - 6}" y1="${y.toFixed(1)}" x2="${width - padR + 6}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2 2" />`;
    }).join('');

    // Pontos com a nota média e datas
    const pointsHtml = coords.map((c, i) => {
      const isLast = i === n - 1;
      const lvl = getEvaluationLevel(c.score);
      const dateFormatted = formatDateBR(c.date).slice(0, 5); // '18/10'

      return `
        <g class="history-point-group">
          <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${isLast ? '5' : '4'}" 
                  fill="#FFFFFF" stroke="${lvl.color}" stroke-width="${isLast ? '3' : '2'}" />
          <text x="${c.x.toFixed(1)}" y="${(c.y - 10).toFixed(1)}" text-anchor="middle" 
                font-size="10" font-weight="900" fill="${lvl.color}">
            ★ ${c.score.toFixed(1)}
          </text>
          <text x="${c.x.toFixed(1)}" y="${(height - padB + 15).toFixed(1)}" text-anchor="middle" 
                font-size="9" font-weight="700" fill="#94a3b8">
            ${dateFormatted}
          </text>
        </g>
      `;
    }).join('');

    return `
      <svg class="eval-history-chart-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FF6B00" stop-opacity="0.38" />
            <stop offset="100%" stop-color="#FF6B00" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        ${gridLines}

        <!-- Área sombreada sob a curva -->
        <polygon points="${areaPoints}" fill="url(#${gradId})" />

        <!-- Linha da curva de evolução da média -->
        <polyline points="${polylinePoints}" fill="none" stroke="#FF6B00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        ${pointsHtml}
      </svg>
    `;
  }

  // ==========================================================================
  // RENDERIZAÇÃO DA SEÇÃO DE HISTÓRICO DE MÉDIAS
  // ==========================================================================
  function renderEvaluationHistorySectionHtml(athlete) {
    const history = athlete.evaluationHistory || [];
    if (history.length === 0) return '';

    const scores = history.map(h => typeof h.average === 'number' ? h.average : 7.0);
    const latestAvg = scores[scores.length - 1];
    const firstAvg = scores[0];
    const diff = Number((latestAvg - firstAvg).toFixed(1));

    let evolutionBadgeHtml = '';
    if (history.length >= 2) {
      if (diff > 0) {
        evolutionBadgeHtml = `<span class="eval-evolution-badge up">▲ +${diff} pontos</span>`;
      } else if (diff < 0) {
        evolutionBadgeHtml = `<span class="eval-evolution-badge down">▼ ${diff} pontos</span>`;
      } else {
        evolutionBadgeHtml = `<span class="eval-evolution-badge stable">= Estável</span>`;
      }
    }

    const itemsHtml = history.slice().reverse().map((h, idx) => {
      const isLatest = idx === 0;
      const hLevel = getEvaluationLevel(h.average);
      const dateStr = formatDateBR(h.date);

      return `
        <div class="eval-history-item ${isLatest ? 'is-latest' : ''}">
          <div class="eval-history-item-top">
            <div class="eval-history-left">
              <span class="eval-history-badge" style="background: ${hLevel.color}20; color: ${hLevel.color}; border: 1px solid ${hLevel.color}50;">
                ★ ${h.average ? h.average.toFixed(1) : '-'}
              </span>
              <div class="eval-history-meta">
                <span class="eval-history-title">${isLatest ? 'Avaliação Atual' : `Avaliação #${history.length - idx}`}</span>
                <span class="eval-history-date">${dateStr} • ${hLevel.label}</span>
              </div>
            </div>
            ${isLatest ? '<span class="eval-latest-tag">Mais Recente</span>' : ''}
          </div>
          ${h.notes ? `<div class="eval-history-note">"${escapeHTML(h.notes)}"</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="eval-history-card">
        <div class="eval-history-header">
          <div class="eval-history-title-wrap">
            <span class="eval-history-icon">📈</span>
            <div>
              <span class="eval-history-title">Evolução da Média por Avaliação</span>
              <span class="eval-history-sub">${history.length} avaliação${history.length > 1 ? 'ões' : ''} registrada${history.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          ${evolutionBadgeHtml}
        </div>

        ${history.length >= 2 ? `
          <div class="eval-history-svg-wrapper">
            ${renderEvaluationHistorySvg(history, 280, 120)}
          </div>
        ` : ''}

        <div class="eval-history-list">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // MÓDULO DE AVALIAÇÃO TÉCNICA (SCOUTING DE FUNDAMENTOS)
  // ==========================================================================
  const modalEval = document.getElementById('athleteEvaluationModal');
  const btnCloseEval = document.getElementById('btnCloseEvalModal');
  const btnCancelEval = document.getElementById('btnCancelEvalModal');
  const formEval = document.getElementById('athleteEvaluationForm');

  if (btnCloseEval) {
    btnCloseEval.addEventListener('click', () => {
      if (modalEval) modalEval.classList.remove('open');
    });
  }

  if (btnCancelEval) {
    btnCancelEval.addEventListener('click', () => {
      if (modalEval) modalEval.classList.remove('open');
    });
  }

  window.openEvaluationModal = function(athleteId) {
    const athlete = store.getAthleteById(athleteId);
    if (!athlete || !modalEval) return;

    // Fecha o modal de detalhes caso esteja aberto
    const detailModal = document.getElementById('athleteDetailModal');
    if (detailModal) detailModal.classList.remove('open');

    const idInput = document.getElementById('evalAthleteId');
    const nameHeader = document.getElementById('evalAthleteNameHeader');
    const subtitle = document.getElementById('evalAthleteSubtitle');
    const notesInput = document.getElementById('evalNotes');
    const dateInput = document.getElementById('evalDate');
    const container = document.getElementById('evalSkillsContainer');

    idInput.value = athlete.id;
    nameHeader.textContent = athlete.name;
    const catObj = getCategoryObj(athlete.category);
    subtitle.textContent = `${catObj.name} • ${athlete.position || 'Geral'}`;

    const currentEval = athlete.evaluation || {};
    notesInput.value = currentEval.notes || '';
    dateInput.value = currentEval.updatedAt || new Date().toISOString().split('T')[0];

    // Renderizar os 7 fundamentos com controles numéricos diretos e sliders
    container.innerHTML = EVALUATION_SKILLS.map(skill => {
      const initialVal = typeof currentEval[skill.id] === 'number' ? currentEval[skill.id] : 7.0;
      const ticksHtml = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => {
        const isActive = Math.round(initialVal) === v;
        const leftPercent = ((v - 1) / 9) * 100;
        return `<span class="scale-marker-tick ${isActive ? 'active' : ''}" 
                      style="left: calc(10px + (100% - 20px) * ${((v - 1) / 9).toFixed(4)});" 
                      data-val="${v}" 
                      data-skill-id="${skill.id}">${v}</span>`;
      }).join('');

      return `
        <div class="skill-eval-item" data-skill-id="${skill.id}">
          <div class="skill-eval-header">
            <div class="skill-name-wrap">
              <span class="skill-icon">${skill.icon}</span>
              <div>
                <span class="skill-title">${skill.name}</span>
                <span class="skill-desc">${skill.desc}</span>
              </div>
            </div>
            <div class="skill-input-control">
              <button type="button" class="btn-step-num" data-action="dec" data-skill-id="${skill.id}" title="Diminuir 0.5" aria-label="Diminuir">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <input type="number" min="1" max="10" step="0.5" value="${initialVal.toFixed(1)}" 
                     class="skill-num-input" id="num_${skill.id}" data-skill-id="${skill.id}">
              <button type="button" class="btn-step-num" data-action="inc" data-skill-id="${skill.id}" title="Aumentar 0.5" aria-label="Aumentar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          </div>
          <div class="skill-slider-wrap">
            <input type="range" min="1" max="10" step="0.5" value="${initialVal}" 
                   class="skill-range-slider" id="slider_${skill.id}" data-skill-id="${skill.id}">
            <div class="skill-scale-markers" id="markers_${skill.id}">
              ${ticksHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    function updateActiveMarker(skillId, val) {
      const markersWrap = document.getElementById(`markers_${skillId}`);
      if (markersWrap) {
        const rounded = Math.round(val);
        markersWrap.querySelectorAll('.scale-marker-tick').forEach(t => {
          const tVal = parseInt(t.getAttribute('data-val'), 10);
          t.classList.toggle('active', tVal === rounded);
        });
      }
    }

    // Listener para botões de incremento/decremento [−] e [+]
    container.querySelectorAll('.btn-step-num').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const skillId = btn.getAttribute('data-skill-id');
        const numInput = document.getElementById(`num_${skillId}`);
        const slider = document.getElementById(`slider_${skillId}`);
        if (!numInput || !slider) return;

        let currentVal = parseFloat(numInput.value) || 7.0;
        if (action === 'dec') {
          currentVal = Math.max(1.0, currentVal - 0.5);
        } else if (action === 'inc') {
          currentVal = Math.min(10.0, currentVal + 0.5);
        }

        numInput.value = currentVal.toFixed(1);
        slider.value = currentVal;
        updateActiveMarker(skillId, currentVal);
        recalcEvalModalOverall();
      });
    });

    // Listener para digitação direta no campo de número
    container.querySelectorAll('.skill-num-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const skillId = input.getAttribute('data-skill-id');
        const slider = document.getElementById(`slider_${skillId}`);
        let val = parseFloat(e.target.value);
        if (isNaN(val)) return;
        val = Math.min(10, Math.max(1, val));
        if (slider) slider.value = val;
        updateActiveMarker(skillId, val);
        recalcEvalModalOverall();
      });

      input.addEventListener('blur', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 10) val = 10;
        e.target.value = val.toFixed(1);
        const skillId = input.getAttribute('data-skill-id');
        const slider = document.getElementById(`slider_${skillId}`);
        if (slider) slider.value = val;
        updateActiveMarker(skillId, val);
        recalcEvalModalOverall();
      });
    });

    // Listener interativo para cada slider dos fundamentos
    container.querySelectorAll('.skill-range-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const skillId = slider.getAttribute('data-skill-id');
        const numInput = document.getElementById(`num_${skillId}`);
        const val = parseFloat(e.target.value);
        if (numInput) {
          numInput.value = val.toFixed(1);
        }
        updateActiveMarker(skillId, val);
        recalcEvalModalOverall();
      });
    });

    // Listener para clique direto nos números da régua (1 a 10)
    container.querySelectorAll('.scale-marker-tick').forEach(tick => {
      tick.addEventListener('click', () => {
        const skillId = tick.getAttribute('data-skill-id');
        const targetVal = parseFloat(tick.getAttribute('data-val'));
        const numInput = document.getElementById(`num_${skillId}`);
        const slider = document.getElementById(`slider_${skillId}`);
        if (numInput) numInput.value = targetVal.toFixed(1);
        if (slider) slider.value = targetVal;
        updateActiveMarker(skillId, targetVal);
        recalcEvalModalOverall();
      });
    });

    recalcEvalModalOverall();
    modalEval.classList.add('open');
  };

  function recalcEvalModalOverall() {
    const sliders = document.querySelectorAll('#evalSkillsContainer .skill-range-slider');
    let sum = 0;
    let count = 0;
    const currentSkills = {};

    sliders.forEach(s => {
      const val = parseFloat(s.value) || 0;
      const skillId = s.getAttribute('data-skill-id');
      if (skillId) {
        currentSkills[skillId] = val;
      }
      sum += val;
      count++;
    });

    const avg = count > 0 ? (sum / count) : 0;
    const overallScoreEl = document.getElementById('evalOverallScore');
    const levelBadgeEl = document.getElementById('evalLevelBadge');

    if (overallScoreEl) overallScoreEl.textContent = avg.toFixed(1);
    if (levelBadgeEl) {
      const level = getEvaluationLevel(avg);
      levelBadgeEl.textContent = level.label;
      levelBadgeEl.style.color = level.color;
      levelBadgeEl.style.borderColor = level.color + '60';
      levelBadgeEl.style.background = level.color + '22';
    }

    // Atualiza o gráfico de radar dos dados em tempo real com a média no gráfico
    const radarWrapper = document.getElementById('evalRadarWrapper');
    if (radarWrapper && count > 0) {
      radarWrapper.innerHTML = renderVolleyballRadarSvg(currentSkills, 290, 270);
    }
  }

  if (formEval) {
    formEval.addEventListener('submit', (e) => {
      e.preventDefault();
      const athleteId = document.getElementById('evalAthleteId').value;
      if (!athleteId) return;

      const newEval = {
        updatedAt: document.getElementById('evalDate').value || new Date().toISOString().split('T')[0],
        notes: document.getElementById('evalNotes').value.trim()
      };

      EVALUATION_SKILLS.forEach(skill => {
        const numInput = document.getElementById(`num_${skill.id}`);
        const slider = document.getElementById(`slider_${skill.id}`);
        const val = numInput ? parseFloat(numInput.value) : (slider ? parseFloat(slider.value) : 7.0);
        newEval[skill.id] = isNaN(val) ? 7.0 : Math.min(10, Math.max(1, val));
      });

      store.saveAthleteEvaluation(athleteId, newEval);
      showToast('Avaliação técnica salva com sucesso!', 'success');

      if (modalEval) modalEval.classList.remove('open');
      renderAtletasList();

      // Reabre a ficha do atleta com a avaliação e o gráfico de dados atualizados imediatamente
      window.viewAthleteDetails(athleteId);
    });
  }
}

// ==========================================================================
// TOAST NOTIFICATIONS & UTILITÁRIOS
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-msg ${type}`;
  toast.innerHTML = `
    <span>${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 2800);
}

function getInitials(name) {
  if (!name) return 'AT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCurrency(val) {
  return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// MÓDULO 6: AUTO-INSCRIÇÃO PÚBLICA DE ATLETAS (ALUNO / RESPONSÁVEL)
// ==========================================================================
function setupPublicEnrollmentModule() {
  const form = document.getElementById('publicEnrollmentForm');
  const birthInput = document.getElementById('pubAthleteBirthDate');
  const catSelect = document.getElementById('pubAthleteCategory');
  const phoneInput = document.getElementById('pubAthletePhone');

  const calcYear = document.getElementById('pubCalcYear');
  const calcAge = document.getElementById('pubCalcAge');
  const calcCat = document.getElementById('pubCalcCat');

  const formContainer = document.getElementById('publicEnrollmentFormContainer');
  const successCard = document.getElementById('publicSuccessCard');
  const successSummary = document.getElementById('publicSuccessSummary');
  const btnWaConfirm = document.getElementById('btnPublicWhatsAppConfirm');
  const btnReset = document.getElementById('btnResetPublicEnrollment');
  const btnReturnAdmin = document.getElementById('btnReturnToAdmin');

  // Máscara de telefone interativa (XX) XXXXX-XXXX
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 10) {
        v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
      } else if (v.length > 0) {
        v = v.replace(/^(\d*)/, '($1');
      }
      e.target.value = v;
    });
  }

  // Cálculo em tempo real de idade e categoria oficial CBV
  function updateLiveCalculation(birthDate) {
    if (!birthDate) {
      if (calcYear) calcYear.textContent = '----';
      if (calcAge) calcAge.textContent = '-- anos';
      if (calcCat) calcCat.textContent = '--';
      return;
    }

    const birthYear = getBirthYear(birthDate);
    const sportAge = calculateSportAge(birthDate);
    const autoCatId = calculateCategory(birthDate);
    const catObj = getCategoryObj(autoCatId);

    if (calcYear) calcYear.textContent = birthYear;
    if (calcAge) calcAge.textContent = `${sportAge} anos`;
    if (calcCat) {
      calcCat.textContent = catObj.name;
      calcCat.style.color = catObj.color || 'var(--primary)';
    }

    // Pré-seleciona categoria no select automaticamente
    if (catSelect && autoCatId) {
      catSelect.value = autoCatId;
    }
  }

  if (birthInput) {
    birthInput.addEventListener('change', (e) => {
      updateLiveCalculation(e.target.value);
    });
    birthInput.addEventListener('input', (e) => {
      updateLiveCalculation(e.target.value);
    });
  }

  // Submissão da Auto-Inscrição do Aluno
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('pubAthleteName')?.value.trim();
      const gender = document.querySelector('input[name="pubAthleteGender"]:checked')?.value || 'M';
      const birthDate = birthInput?.value;
      const category = catSelect?.value || calculateCategory(birthDate);
      const position = document.getElementById('pubAthletePosition')?.value || 'Iniciante';
      const rawPhone = phoneInput?.value || '';
      const cleanPhone = rawPhone.replace(/\D/g, '');
      const responsible = document.getElementById('pubAthleteResponsible')?.value.trim() || '';
      const notes = document.getElementById('pubAthleteNotes')?.value.trim() || '';

      if (!name || !birthDate || !cleanPhone) {
        showToast('Por favor, preencha os campos obrigatórios (*)', 'error');
        return;
      }

      if (cleanPhone.length < 10) {
        showToast('Por favor, informe um número de WhatsApp válido com DDD.', 'error');
        return;
      }

      const sportAge = calculateSportAge(birthDate);
      const catObj = getCategoryObj(category);

      // Criação direta do novo atleta na base de dados
      const newAthlete = {
        name,
        birthDate,
        gender,
        category,
        categories: [category],
        position,
        phone: cleanPhone,
        monthlyFee: 150,
        responsible: responsible || undefined,
        notes: notes || undefined,
        active: true,
        evaluation: null,
        evaluationHistory: []
      };

      store.addAthlete(newAthlete);

      // Atualiza listagens do painel administrativo
      renderAtletasList();
      updateProfileStats();
      if (state.activeTab === 'view-chamada') {
        renderChamadaList();
      }

      showToast('🎉 Inscrição recebida com sucesso! Seja bem-vindo(a)!', 'success');

      // Preenche resumo na tela de confirmação
      if (successSummary) {
        successSummary.innerHTML = `
          <div class="summary-row">
            <span class="summary-lbl">Atleta:</span>
            <span class="summary-val">${escapeHTML(name)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-lbl">Nasc.:</span>
            <span class="summary-val">${formatDateBR(birthDate)} (${sportAge} anos)</span>
          </div>
          <div class="summary-row">
            <span class="summary-lbl">Categoria CBV:</span>
            <span class="summary-val" style="color: ${catObj.color || 'var(--primary)'};">${catObj.name}</span>
          </div>
          <div class="summary-row">
            <span class="summary-lbl">Posição:</span>
            <span class="summary-val">${escapeHTML(position)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-lbl">Naipe:</span>
            <span class="summary-val">${gender === 'M' ? 'Masculino' : 'Feminino'}</span>
          </div>
          <div class="summary-row">
            <span class="summary-lbl">WhatsApp:</span>
            <span class="summary-val">${escapeHTML(phoneInput?.value || cleanPhone)}</span>
          </div>
          ${responsible ? `
          <div class="summary-row">
            <span class="summary-lbl">Responsável:</span>
            <span class="summary-val">${escapeHTML(responsible)}</span>
          </div>
          ` : ''}
          ${notes ? `
          <div class="summary-row">
            <span class="summary-lbl">Obs / Histórico:</span>
            <span class="summary-val" style="font-weight:400; font-size:11.5px;">${escapeHTML(notes)}</span>
          </div>
          ` : ''}
        `;
      }

      // Link para o WhatsApp do Treinador Vitor Gabriel (77 98141-9995)
      if (btnWaConfirm) {
        const msgCoach = `Olá Treinador Vitor Gabriel! 🏐\nAcabei de realizar minha inscrição na *VOA Academy*:\n\n👤 *Atleta:* ${name}\n⚧ *Naipe:* ${gender === 'M' ? 'Masculino' : 'Feminino'}\n📅 *Nascimento:* ${formatDateBR(birthDate)} (${sportAge} anos)\n🏆 *Categoria:* ${catObj.name}\n🎯 *Posição:* ${position}\n📱 *Contato:* ${phoneInput?.value || cleanPhone}${responsible ? `\n👨‍👩‍👧 *Responsável:* ${responsible}` : ''}${notes ? `\n📝 *Observação:* ${notes}` : ''}\n\nGostaria de confirmar minha participação e saber sobre os horários dos treinos!`;
        btnWaConfirm.href = `https://wa.me/5577981419995?text=${encodeURIComponent(msgCoach)}`;
      }

      // Alterna para visualização do card de sucesso
      if (formContainer) formContainer.style.display = 'none';
      if (successCard) {
        successCard.style.display = 'block';
        successCard.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Fazer outra inscrição
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (form) form.reset();
      updateLiveCalculation(null);
      if (successCard) successCard.style.display = 'none';
      if (formContainer) {
        formContainer.style.display = 'block';
        formContainer.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Retornar ao painel do treinador
  if (btnReturnAdmin) {
    btnReturnAdmin.addEventListener('click', () => {
      // Remove parâmetros de inscrição da URL se existirem
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      switchTab('view-atletas');
    });
  }
}

// ==========================================================================
// MÓDULO 7: MODAL DE COMPARTILHAMENTO DE INSCRIÇÃO & QR CODE
// ==========================================================================
function setupShareEnrollmentModal() {
  const modal = document.getElementById('shareEnrollmentModal');
  const btnClose = document.getElementById('btnCloseShareModal');
  const btnCancel = document.getElementById('btnCancelShareModal');

  const btnOpenTop = document.getElementById('btnOpenShareEnrollment');
  const btnOpenAtletas = document.getElementById('btnShareEnrollmentAtletas');
  const btnOpenPerfil = document.getElementById('btnShareEnrollmentPerfil');

  const inputUrl = document.getElementById('shareEnrollmentLinkInput');
  const btnCopy = document.getElementById('btnCopyEnrollmentLink');
  const btnWaDirect = document.getElementById('btnShareWhatsAppDirect');
  const btnPreview = document.getElementById('btnPreviewPublicEnrollment');
  const qrImg = document.getElementById('enrollmentQrImg');
  const btnPrint = document.getElementById('btnPrintEnrollmentPoster');

  // Constrói a URL pública de auto-inscrição (com suporte a rede local Wi-Fi)
  function getEnrollmentUrl() {
    let origin = window.location.origin;
    // Se o treinador estiver no PC via localhost, usa o IP da rede local para que o celular e o QR code funcionem na mesma rede Wi-Fi
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const port = window.location.port ? `:${window.location.port}` : '';
      origin = `http://192.168.3.41${port}`;
    }
    const pathname = window.location.pathname;
    return `${origin}${pathname}?inscricao=1`;
  }

  function openShareModal() {
    const url = getEnrollmentUrl();
    if (inputUrl) {
      inputUrl.value = url;
    }

    // Configura imagem do QR Code em alta resolução via QR Server API
    if (qrImg) {
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=0f1420&bgcolor=ffffff&qzone=1`;
      qrImg.src = qrApiUrl;
    }

    // Mensagem pronta para enviar no WhatsApp
    if (btnWaDirect) {
      const inviteMsg = `🏐 *VOA ACADEMY - Inscrições Abertas!*\n\nVenha treinar voleibol de alto nível com o *Treinador Vitor Gabriel* na VOA Academy!\n\nFaça sua auto-inscrição online no link oficial:\n👉 ${url}\n\nCategorias Sub-13, Sub-15, Sub-17, Sub-19 e Adulto (Masculino e Feminino)!`;
      btnWaDirect.href = `https://wa.me/?text=${encodeURIComponent(inviteMsg)}`;
    }

    if (modal) {
      modal.classList.add('open');
    }
  }

  function closeShareModal() {
    if (modal) {
      modal.classList.remove('open');
    }
  }

  // Gatilhos de abertura
  [btnOpenTop, btnOpenAtletas, btnOpenPerfil].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openShareModal();
      });
    }
  });

  // Gatilhos de fechamento
  [btnClose, btnCancel].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', closeShareModal);
    }
  });

  // Copiar link
  if (btnCopy && inputUrl) {
    btnCopy.addEventListener('click', async () => {
      const url = inputUrl.value || getEnrollmentUrl();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          inputUrl.select();
          document.execCommand('copy');
        }
        btnCopy.classList.add('copied');
        btnCopy.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Copiado!</span>
        `;
        showToast('Link de inscrição copiado para a área de transferência!', 'success');
        setTimeout(() => {
          btnCopy.classList.remove('copied');
          btnCopy.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>Copiar</span>
          `;
        }, 2200);
      } catch (err) {
        inputUrl.select();
        showToast('Selecione e copie o link no campo de texto.', 'info');
      }
    });
  }

  // Botão para testar tela do aluno
  if (btnPreview) {
    btnPreview.addEventListener('click', () => {
      closeShareModal();
      switchTab('view-inscricao-publica');
    });
  }

  // Botão de imprimir cartaz oficial para a quadra
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }
}
