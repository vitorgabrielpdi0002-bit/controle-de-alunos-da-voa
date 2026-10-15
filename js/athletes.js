/**
 * VOA Sports - Módulo de Gestão de Atletas
 * Listagem, Filtros por Turmas (Pequenos 6-14 / Grandes 14+) e Exceções, Cadastro e Ficha
 */

import { store, CATEGORIES, GROUPS, getCategoryById, getGroupById, calculateAge, suggestCategory, suggestGroup } from './data.js';
import { ICONS, formatCurrency, formatDate, renderCategoryBadge, renderGroupBadge, getInitials, getWhatsAppUrl, openModal, closeModal, showToast } from './ui.js';

let selectedGroupFilter = 'all'; // 'all', 'pequenos', 'grandes', 'exceptions'
let selectedCategoryFilter = 'all';
let searchQuery = '';
let currentViewingAthleteId = null;

export function initAthletesModule() {
  renderCategoryFilterChips();
  renderAthletes();
  setupEventListeners();
}

function renderCategoryFilterChips() {
  const container = document.getElementById('athleteCategoryChips');
  if (!container) return;

  const athletes = store.getAthletes();
  const pequenosCount = athletes.filter(a => a.groupId === 'pequenos').length;
  const grandesCount = athletes.filter(a => a.groupId === 'grandes').length;
  const exceptionsCount = athletes.filter(a => a.playsUp === true).length;
  
  let html = `
    <!-- Filtros das 2 Turmas Principais e Exceções -->
    <div style="display: flex; flex-wrap: wrap; gap: 8px; width: 100%; margin-bottom: 8px;">
      <div class="chip ${selectedGroupFilter === 'all' && selectedCategoryFilter === 'all' ? 'active' : ''}" data-filter-type="group" data-val="all">
        Todos os Atletas (${athletes.length})
      </div>
      <div class="chip ${selectedGroupFilter === 'pequenos' ? 'active' : ''}" data-filter-type="group" data-val="pequenos" style="border-color: rgba(6,182,212,0.4);">
        👶 Turma Pequenos (6 a 14) • Ter/Qui/Sáb (${pequenosCount})
      </div>
      <div class="chip ${selectedGroupFilter === 'grandes' ? 'active' : ''}" data-filter-type="group" data-val="grandes" style="border-color: rgba(245,158,11,0.4);">
        🏆 Turma Grandes (14+) • Seg/Qui/Sáb (${grandesCount})
      </div>
      <div class="chip ${selectedGroupFilter === 'exceptions' ? 'active' : ''}" data-filter-type="group" data-val="exceptions" style="border-color: rgba(239,68,68,0.4); color: #f87171;">
        ⚡ Exceções: Jogam no Grande (${exceptionsCount})
      </div>
    </div>

    <!-- Filtros Secundários de Categoria de Competição -->
    <div style="display: flex; flex-wrap: wrap; gap: 6px; width: 100%; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
      <span style="font-size: 0.73rem; color: var(--text-dim); align-self: center; margin-right: 4px; font-weight: 700;">Categorias:</span>
      ${CATEGORIES.map(cat => {
        const count = athletes.filter(a => a.categoryId === cat.id).length;
        return `
          <div class="chip ${selectedCategoryFilter === cat.id ? 'active' : ''}" data-filter-type="cat" data-val="${cat.id}" style="padding: 4px 10px; font-size: 0.74rem;">
            ${cat.code} (${count})
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.filterType;
      const val = chip.dataset.val;

      if (type === 'group') {
        selectedGroupFilter = val;
        selectedCategoryFilter = 'all';
      } else {
        selectedCategoryFilter = selectedCategoryFilter === val ? 'all' : val;
        selectedGroupFilter = 'all';
      }

      renderCategoryFilterChips();
      renderAthletes();
    });
  });
}

export function renderAthletes() {
  const container = document.getElementById('athletesContainer');
  if (!container) return;

  let list = store.getAthletes();

  // Filter by group or exception
  if (selectedGroupFilter === 'pequenos') {
    list = list.filter(a => a.groupId === 'pequenos');
  } else if (selectedGroupFilter === 'grandes') {
    list = list.filter(a => a.groupId === 'grandes');
  } else if (selectedGroupFilter === 'exceptions') {
    list = list.filter(a => a.playsUp === true);
  }

  // Filter by category
  if (selectedCategoryFilter !== 'all') {
    list = list.filter(a => a.categoryId === selectedCategoryFilter);
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(a => 
      a.name.toLowerCase().includes(q) ||
      (a.nickname && a.nickname.toLowerCase().includes(q)) ||
      (a.guardianName && a.guardianName.toLowerCase().includes(q)) ||
      (a.position && a.position.toLowerCase().includes(q))
    );
  }

  const countBadge = document.getElementById('athletesCountBadge');
  if (countBadge) countBadge.textContent = `${list.length} atletas`;

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
        <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 14px;">Nenhum atleta encontrado com os filtros selecionados.</p>
        <button class="btn btn-primary" id="btnEmptyNewAthlete">
          ${ICONS.plus} Cadastrar Novo Atleta
        </button>
      </div>
    `;
    const btnEmpty = document.getElementById('btnEmptyNewAthlete');
    if (btnEmpty) btnEmpty.addEventListener('click', () => openAthleteFormModal());
    return;
  }

  container.innerHTML = list.map(athlete => {
    const cat = getCategoryById(athlete.categoryId);
    const age = calculateAge(athlete.birthDate);
    const initials = getInitials(athlete.name);
    const feeText = athlete.monthlyFee > 0 ? formatCurrency(athlete.monthlyFee) : '<span style="color: #a78bfa">Bolsista</span>';
    const waUrl = getWhatsAppUrl(athlete.guardianPhone, `Olá, ${athlete.guardianName}! Mensagem da coordenação da VOA Sports sobre o atleta ${athlete.name}.`);

    return `
      <div class="athlete-card" data-id="${athlete.id}">
        <div class="athlete-card-header">
          <div class="athlete-avatar" style="background: ${cat.bg}; border-color: ${cat.color}; color: ${cat.color};">
            ${initials}
          </div>
          <div class="athlete-card-info">
            <h4 class="athlete-name" title="${athlete.name}">${athlete.name}</h4>
            <div class="athlete-nickname">${athlete.nickname ? `"${athlete.nickname}" • ` : ''}${age !== null ? `${age} anos` : ''}</div>
            
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
              <div>${renderGroupBadge(athlete.groupId, athlete.playsUp)}</div>
              <div>${renderCategoryBadge(athlete.categoryId)}</div>
            </div>
          </div>
        </div>

        <div class="athlete-card-details">
          <div class="detail-row">
            <span>Posição / Foco:</span>
            <span>${athlete.position || 'Não informada'}</span>
          </div>
          <div class="detail-row">
            <span>Dias de Treino:</span>
            <span style="font-size: 0.75rem; color: #38bdf8;">
              ${athlete.groupId === 'grandes' ? 'Segunda, Quinta e Sábado' : athlete.playsUp ? 'Ter/Qui/Sáb + Treina no Grande!' : 'Terça, Quinta e Sábado'}
            </span>
          </div>
          <div class="detail-row">
            <span>Responsável:</span>
            <span title="${athlete.guardianName}">${athlete.guardianName || 'Próprio'}</span>
          </div>
          <div class="detail-row">
            <span>Mensalidade:</span>
            <span>${feeText} (Venc. dia ${athlete.dueDay || 10})</span>
          </div>
        </div>

        <div class="athlete-card-actions">
          <button class="btn btn-secondary btn-sm btn-view-athlete" data-id="${athlete.id}">
            ${ICONS.user} Ficha
          </button>
          ${athlete.guardianPhone ? `
            <a href="${waUrl}" target="_blank" class="btn btn-secondary btn-sm" style="color: #25d366;" title="Conversar no WhatsApp">
              ${ICONS.whatsapp} WhatsApp
            </a>
          ` : ''}
          <button class="btn btn-secondary btn-sm btn-edit-athlete" data-id="${athlete.id}" title="Editar">
            ${ICONS.edit}
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach card event listeners
  container.querySelectorAll('.btn-view-athlete').forEach(btn => {
    btn.addEventListener('click', () => viewAthleteDetails(btn.dataset.id));
  });

  container.querySelectorAll('.btn-edit-athlete').forEach(btn => {
    btn.addEventListener('click', () => openAthleteFormModal(btn.dataset.id));
  });
}

function setupEventListeners() {
  const searchInput = document.getElementById('searchAthletes');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderAthletes();
    });
  }

  const btnNewAthlete = document.getElementById('btnNewAthlete');
  if (btnNewAthlete) {
    btnNewAthlete.addEventListener('click', () => openAthleteFormModal());
  }

  // Birth date auto-calculate category and group in the form
  const birthInput = document.getElementById('athleteFormBirthDate');
  const genderInput = document.getElementById('athleteFormGender');
  const groupSelect = document.getElementById('athleteFormGroup');
  const categorySelect = document.getElementById('athleteFormCategory');
  const ageFeedback = document.getElementById('athleteAgeFeedback');

  function updateCategoryAndGroupSuggestion() {
    if (birthInput && birthInput.value) {
      const age = calculateAge(birthInput.value);
      const gender = genderInput ? genderInput.value : 'M';
      const suggestedCat = suggestCategory(birthInput.value, gender);
      const suggestedGrp = suggestGroup(birthInput.value);

      if (ageFeedback) {
        const grpName = suggestedGrp === 'grandes' ? 'Turma Grandes (14+)' : 'Turma Pequenos (6 a 14)';
        ageFeedback.textContent = `Idade: ${age} anos • Turma sugerida: ${grpName} • Categoria: ${getCategoryById(suggestCat).name}`;
      }

      if (groupSelect && (!groupSelect.dataset.manualOverride || groupSelect.dataset.manualOverride === 'false')) {
        groupSelect.value = suggestedGrp;
      }

      if (categorySelect && (!categorySelect.dataset.manualOverride || categorySelect.dataset.manualOverride === 'false')) {
        categorySelect.value = suggestedCat;
      }
    }
  }

  if (birthInput) birthInput.addEventListener('change', updateCategoryAndGroupSuggestion);
  if (genderInput) genderInput.addEventListener('change', updateCategoryAndGroupSuggestion);
  
  if (groupSelect) {
    groupSelect.addEventListener('change', () => {
      groupSelect.dataset.manualOverride = 'true';
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      categorySelect.dataset.manualOverride = 'true';
    });
  }

  // Athlete Form Submit
  const form = document.getElementById('athleteForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveAthleteFromForm();
    });
  }
}

export function openAthleteFormModal(athleteId = null) {
  const modalTitle = document.getElementById('athleteModalTitle');
  const form = document.getElementById('athleteForm');
  const athleteIdInput = document.getElementById('athleteFormId');
  const groupSelect = document.getElementById('athleteFormGroup');
  const categorySelect = document.getElementById('athleteFormCategory');
  const playsUpCheckbox = document.getElementById('athleteFormPlaysUp');
  const ageFeedback = document.getElementById('athleteAgeFeedback');

  if (groupSelect) groupSelect.dataset.manualOverride = 'false';
  if (categorySelect) categorySelect.dataset.manualOverride = 'false';
  if (ageFeedback) ageFeedback.textContent = '';

  if (athleteId) {
    const athlete = store.getAthleteById(athleteId);
    if (!athlete) return;
    if (modalTitle) modalTitle.textContent = 'Editar Atleta';
    if (athleteIdInput) athleteIdInput.value = athlete.id;

    document.getElementById('athleteFormName').value = athlete.name || '';
    document.getElementById('athleteFormNickname').value = athlete.nickname || '';
    document.getElementById('athleteFormBirthDate').value = athlete.birthDate || '';
    document.getElementById('athleteFormGender').value = athlete.gender || 'M';
    if (groupSelect) groupSelect.value = athlete.groupId || 'pequenos';
    if (playsUpCheckbox) playsUpCheckbox.checked = Boolean(athlete.playsUp);
    document.getElementById('athleteFormCategory').value = athlete.categoryId || 'sub13_m';
    document.getElementById('athleteFormGuardian').value = athlete.guardianName || '';
    document.getElementById('athleteFormGuardianPhone').value = athlete.guardianPhone || '';
    document.getElementById('athleteFormAthletePhone').value = athlete.athletePhone || '';
    document.getElementById('athleteFormFee').value = athlete.monthlyFee !== undefined ? athlete.monthlyFee : 140;
    document.getElementById('athleteFormDueDay').value = athlete.dueDay || 10;
    document.getElementById('athleteFormPosition').value = athlete.position || '';
    document.getElementById('athleteFormStatus').value = athlete.status || 'ativo';
    document.getElementById('athleteFormNotes').value = athlete.medicalNotes || '';
  } else {
    if (modalTitle) modalTitle.textContent = 'Novo Atleta';
    if (athleteIdInput) athleteIdInput.value = '';
    form.reset();
    if (groupSelect) groupSelect.value = 'pequenos';
    if (playsUpCheckbox) playsUpCheckbox.checked = false;
    document.getElementById('athleteFormFee').value = 140;
    document.getElementById('athleteFormDueDay').value = 10;
    document.getElementById('athleteFormGender').value = 'M';
    document.getElementById('athleteFormStatus').value = 'ativo';
  }

  openModal('athleteModal');
}

function saveAthleteFromForm() {
  const athleteId = document.getElementById('athleteFormId').value;
  const playsUpEl = document.getElementById('athleteFormPlaysUp');

  const data = {
    name: document.getElementById('athleteFormName').value.trim(),
    nickname: document.getElementById('athleteFormNickname').value.trim(),
    birthDate: document.getElementById('athleteFormBirthDate').value,
    gender: document.getElementById('athleteFormGender').value,
    groupId: document.getElementById('athleteFormGroup').value,
    playsUp: playsUpEl ? playsUpEl.checked : false,
    categoryId: document.getElementById('athleteFormCategory').value,
    guardianName: document.getElementById('athleteFormGuardian').value.trim(),
    guardianPhone: document.getElementById('athleteFormGuardianPhone').value.trim(),
    athletePhone: document.getElementById('athleteFormAthletePhone').value.trim(),
    monthlyFee: parseFloat(document.getElementById('athleteFormFee').value) || 0,
    dueDay: parseInt(document.getElementById('athleteFormDueDay').value, 10) || 10,
    position: document.getElementById('athleteFormPosition').value.trim(),
    status: document.getElementById('athleteFormStatus').value,
    medicalNotes: document.getElementById('athleteFormNotes').value.trim(),
  };

  if (!data.name) {
    showToast('Informe o nome completo do atleta!', 'error');
    return;
  }

  if (athleteId) {
    store.updateAthlete(athleteId, data);
    showToast('Atleta atualizado com sucesso!', 'success');
  } else {
    store.addAthlete(data);
    showToast('Atleta cadastrado com sucesso!', 'success');
  }

  closeModal('athleteModal');
  renderCategoryFilterChips();
  renderAthletes();
}

export function viewAthleteDetails(athleteId) {
  const athlete = store.getAthleteById(athleteId);
  if (!athlete) return;
  currentViewingAthleteId = athleteId;

  const cat = getCategoryById(athlete.categoryId);
  const grp = getGroupById(athlete.groupId);
  const age = calculateAge(athlete.birthDate);
  const initials = getInitials(athlete.name);

  // Calculate attendance rate (both in their group and games/trainings where they participated)
  const trainings = store.getTrainings().filter(t => t.status === 'concluido');
  let totalSessions = 0;
  let presentCount = 0;
  let absentCount = 0;
  let justifiedCount = 0;

  trainings.forEach(t => {
    const att = t.attendance.find(a => a.athleteId === athlete.id);
    if (att) {
      totalSessions++;
      if (att.status === 'presente') presentCount++;
      else if (att.status === 'justificada') justifiedCount++;
      else absentCount++;
    }
  });

  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

  // Payments history
  const payments = store.getPayments().filter(p => p.athleteId === athlete.id);

  const container = document.getElementById('athleteDetailsContent');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 18px; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px solid var(--border-subtle);">
      <div class="athlete-avatar" style="width: 64px; height: 64px; font-size: 1.4rem; background: ${cat.bg}; border-color: ${cat.color}; color: ${cat.color};">
        ${initials}
      </div>
      <div>
        <h3 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 4px;">${athlete.name}</h3>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
          ${renderGroupBadge(athlete.groupId, athlete.playsUp)}
          ${renderCategoryBadge(athlete.categoryId)}
        </div>
        <div style="font-size: 0.82rem; color: var(--text-muted);">
          ${age !== null ? `${age} anos` : ''} • Nasc. ${formatDate(athlete.birthDate)} • Dias de treino: <strong style="color: #38bdf8;">${grp.daysShort}</strong>
        </div>
      </div>
    </div>

    ${athlete.playsUp ? `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: #fca5a5;">
        <span>⚡</span>
        <div>
          <strong>Atleta de Exceção:</strong> Este atleta é da faixa dos Pequenos (${age} anos), mas foi promovido e <strong>treina/joga também na Turma dos Grandes</strong> (Seg/Qui/Sáb).
        </div>
      </div>
    ` : ''}

    <!-- Quick Stats in Details -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
      <div style="background: var(--bg-card); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: center;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Presença Treinos</div>
        <div style="font-size: 1.3rem; font-weight: 800; color: #10b981;">${attendanceRate}%</div>
        <div style="font-size: 0.72rem; color: var(--text-dim);">${presentCount} de ${totalSessions} treinos</div>
      </div>
      <div style="background: var(--bg-card); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: center;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Mensalidade</div>
        <div style="font-size: 1.3rem; font-weight: 800; color: #38bdf8;">${athlete.monthlyFee > 0 ? formatCurrency(athlete.monthlyFee) : 'Bolsa'}</div>
        <div style="font-size: 0.72rem; color: var(--text-dim);">Venc. Todo dia ${athlete.dueDay || 10}</div>
      </div>
      <div style="background: var(--bg-card); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: center;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Turma Principal</div>
        <div style="font-size: 1.15rem; font-weight: 800; color: ${grp.color};">${grp.name}</div>
        <div style="font-size: 0.72rem; color: var(--text-dim);">${athlete.position || 'Geral'}</div>
      </div>
    </div>

    <!-- Info Sections -->
    <div style="display: flex; flex-direction: column; gap: 18px;">
      <div style="background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); padding: 16px;">
        <h4 style="font-size: 0.88rem; font-weight: 800; color: #38bdf8; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
          ${ICONS.user} Dados de Contato e Responsável
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.86rem;">
          <div><strong style="color: var(--text-dim);">Responsável:</strong> ${athlete.guardianName || 'Não informado'}</div>
          <div><strong style="color: var(--text-dim);">WhatsApp Resp:</strong> ${athlete.guardianPhone ? `<a href="${getWhatsAppUrl(athlete.guardianPhone)}" target="_blank" style="color: #25d366; font-weight: 700;">${athlete.guardianPhone} ↗</a>` : 'Não informado'}</div>
          <div><strong style="color: var(--text-dim);">Tel Atleta:</strong> ${athlete.athletePhone || 'Não informado'}</div>
          <div><strong style="color: var(--text-dim);">Observações Médicas:</strong> ${athlete.medicalNotes || 'Nenhuma restrição registrada'}</div>
        </div>
      </div>

      <div style="background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); padding: 16px;">
        <h4 style="font-size: 0.88rem; font-weight: 800; color: #38bdf8; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
          ${ICONS.wallet} Histórico Recente de Mensalidades
        </h4>
        ${payments.length === 0 ? '<p style="color: var(--text-dim); font-size: 0.85rem;">Nenhum registro de mensalidade ainda.</p>' : `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${payments.slice(0, 4).map(p => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-input); border-radius: var(--radius-sm); font-size: 0.82rem;">
                <div><strong>Ref: ${p.monthRef}</strong> - Venc. ${formatDate(p.dueDate)}</div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>${formatCurrency(p.amount)}</span>
                  <span class="status-pill ${p.status}">${p.status.toUpperCase()}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  // Edit / Delete buttons in footer
  const btnEditDetail = document.getElementById('btnEditAthleteDetail');
  if (btnEditDetail) {
    btnEditDetail.onclick = () => {
      closeModal('athleteDetailsModal');
      openAthleteFormModal(athleteId);
    };
  }

  const btnDeleteAthlete = document.getElementById('btnDeleteAthlete');
  if (btnDeleteAthlete) {
    btnDeleteAthlete.onclick = () => {
      if (confirm(`Tem certeza que deseja excluir o cadastro do atleta ${athlete.name}?`)) {
        store.deleteAthlete(athleteId);
        showToast('Atleta removido com sucesso.', 'success');
        closeModal('athleteDetailsModal');
        renderCategoryFilterChips();
        renderAthletes();
      }
    };
  }

  openModal('athleteDetailsModal');
}
