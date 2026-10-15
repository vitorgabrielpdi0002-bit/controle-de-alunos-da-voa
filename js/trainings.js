/**
 * VOA Sports - Módulo de Agenda de Treinos e Frequência / Presença
 * Agendamento de Treinos, Chamada Interativa, Registro de Presença e Faltas
 */

import { store, CATEGORIES, getCategoryById } from './data.js';
import { ICONS, formatDate, renderCategoryBadge, getInitials, openModal, closeModal, showToast } from './ui.js';

let selectedCategoryFilter = 'all';
let currentCheckinTrainingId = null;

export function initTrainingsModule() {
  renderTrainingCategoryChips();
  renderTrainings();
  setupEventListeners();
}

function renderTrainingCategoryChips() {
  const container = document.getElementById('trainingCategoryChips');
  if (!container) return;

  const trainings = store.getTrainings();

  let html = `
    <div class="chip ${selectedCategoryFilter === 'all' ? 'active' : ''}" data-cat="all">
      Todos os Treinos (${trainings.length})
    </div>
  `;

  CATEGORIES.forEach(cat => {
    const count = trainings.filter(t => t.categoryId === cat.id).length;
    html += `
      <div class="chip ${selectedCategoryFilter === cat.id ? 'active' : ''}" data-cat="${cat.id}">
        ${cat.code} (${count})
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      selectedCategoryFilter = chip.dataset.cat;
      renderTrainingCategoryChips();
      renderTrainings();
    });
  });
}

export function renderTrainings() {
  const container = document.getElementById('trainingsContainer');
  if (!container) return;

  let list = store.getTrainings();

  if (selectedCategoryFilter !== 'all') {
    list = list.filter(t => t.categoryId === selectedCategoryFilter);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
        <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 14px;">Nenhum treino agendado para esta seleção.</p>
        <button class="btn btn-primary" id="btnEmptyNewTraining">
          ${ICONS.plus} Agendar Novo Treino
        </button>
      </div>
    `;
    const btn = document.getElementById('btnEmptyNewTraining');
    if (btn) btn.addEventListener('click', () => openTrainingModal());
    return;
  }

  container.innerHTML = list.map(training => {
    const cat = getCategoryById(training.categoryId);
    const isToday = training.date === todayStr;
    const isDone = training.status === 'concluido';

    // Calculate attendance numbers
    const totalAthletesInCat = store.getAthletes().filter(a => a.categoryId === training.categoryId && a.status === 'ativo').length;
    const presentCount = training.attendance.filter(a => a.status === 'presente').length;
    const rate = totalAthletesInCat > 0 ? Math.round((presentCount / totalAthletesInCat) * 100) : 0;

    return `
      <div class="training-card ${isToday ? 'today' : ''}" data-id="${training.id}">
        <div class="training-card-header">
          <div class="training-date-box">
            <span class="training-date-day">${formatDate(training.date)}</span>
            <span class="training-time">${training.startTime} - ${training.endTime}</span>
          </div>
          ${renderCategoryBadge(training.categoryId)}
        </div>

        <div class="training-focus">
          ${training.focus || 'Treino Técnico/Tático'}
        </div>

        <div class="training-meta">
          <div class="training-meta-item">
            ${ICONS.mapPin}
            <span>${training.location || 'Quadra Principal VOA'}</span>
          </div>
          <div class="training-meta-item">
            ${ICONS.user}
            <span>${training.coach || 'Comissão Técnica VOA'}</span>
          </div>
        </div>

        <div class="training-stats-bar">
          <div>
            Status: <span style="color: ${isDone ? '#10b981' : '#38bdf8'}; font-weight: 700;">${isDone ? 'Concluído' : 'Agendado'}</span>
          </div>
          <div>
            Presença: <span style="color: ${rate >= 75 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444'}">${presentCount}/${totalAthletesInCat} (${rate}%)</span>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: auto;">
          <button class="btn ${isDone ? 'btn-secondary' : 'btn-primary'} btn-sm btn-checkin" data-id="${training.id}" style="flex: 1;">
            ${ICONS.check} ${isDone ? 'Ver/Editar Chamada' : 'Fazer Chamada'}
          </button>
          <button class="btn btn-secondary btn-sm btn-edit-training" data-id="${training.id}" title="Editar Detalhes">
            ${ICONS.edit}
          </button>
          <button class="btn btn-secondary btn-sm btn-delete-training" data-id="${training.id}" title="Excluir Treino">
            ${ICONS.trash}
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Event handlers
  container.querySelectorAll('.btn-checkin').forEach(btn => {
    btn.addEventListener('click', () => openAttendanceCheckinModal(btn.dataset.id));
  });

  container.querySelectorAll('.btn-edit-training').forEach(btn => {
    btn.addEventListener('click', () => openTrainingModal(btn.dataset.id));
  });

  container.querySelectorAll('.btn-delete-training').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja cancelar e excluir este treino?')) {
        store.deleteTraining(btn.dataset.id);
        showToast('Treino excluído.', 'success');
        renderTrainingCategoryChips();
        renderTrainings();
      }
    });
  });
}

function setupEventListeners() {
  const btnNewTraining = document.getElementById('btnNewTraining');
  if (btnNewTraining) {
    btnNewTraining.addEventListener('click', () => openTrainingModal());
  }

  const formTraining = document.getElementById('trainingForm');
  if (formTraining) {
    formTraining.addEventListener('submit', (e) => {
      e.preventDefault();
      saveTrainingFromForm();
    });
  }

  // Attendance Save Button
  const btnSaveAttendance = document.getElementById('btnSaveAttendance');
  if (btnSaveAttendance) {
    btnSaveAttendance.addEventListener('click', () => saveAttendanceCheckin());
  }

  // "Marcar Todos como Presentes"
  const btnMarkAllPresent = document.getElementById('btnMarkAllPresent');
  if (btnMarkAllPresent) {
    btnMarkAllPresent.addEventListener('click', () => {
      document.querySelectorAll('.attendance-item').forEach(item => {
        item.querySelectorAll('.att-btn').forEach(b => b.classList.remove('active'));
        const btnPres = item.querySelector('.att-btn.presente');
        if (btnPres) btnPres.classList.add('active');
      });
      updateAttendanceSummaryCounters();
    });
  }
}

export function openTrainingModal(trainingId = null) {
  const modalTitle = document.getElementById('trainingModalTitle');
  const form = document.getElementById('trainingForm');
  const trainingIdInput = document.getElementById('trainingFormId');

  const todayStr = new Date().toISOString().split('T')[0];

  if (trainingId) {
    const training = store.getTrainingById(trainingId);
    if (!training) return;
    if (modalTitle) modalTitle.textContent = 'Editar Treino';
    if (trainingIdInput) trainingIdInput.value = training.id;

    document.getElementById('trainingFormCategory').value = training.categoryId;
    document.getElementById('trainingFormDate').value = training.date;
    document.getElementById('trainingFormStartTime').value = training.startTime;
    document.getElementById('trainingFormEndTime').value = training.endTime;
    document.getElementById('trainingFormLocation').value = training.location || 'Quadra Principal VOA';
    document.getElementById('trainingFormCoach').value = training.coach || 'Prof. Carlos Eduardo';
    document.getElementById('trainingFormFocus').value = training.focus || '';
  } else {
    if (modalTitle) modalTitle.textContent = 'Agendar Novo Treino';
    if (trainingIdInput) trainingIdInput.value = '';
    form.reset();
    document.getElementById('trainingFormDate').value = todayStr;
    document.getElementById('trainingFormStartTime').value = '16:00';
    document.getElementById('trainingFormEndTime').value = '17:30';
    document.getElementById('trainingFormLocation').value = 'Quadra Principal VOA';
    document.getElementById('trainingFormCoach').value = 'Prof. Carlos Eduardo';
  }

  openModal('trainingModal');
}

function saveTrainingFromForm() {
  const trainingId = document.getElementById('trainingFormId').value;
  const data = {
    categoryId: document.getElementById('trainingFormCategory').value,
    date: document.getElementById('trainingFormDate').value,
    startTime: document.getElementById('trainingFormStartTime').value,
    endTime: document.getElementById('trainingFormEndTime').value,
    location: document.getElementById('trainingFormLocation').value.trim(),
    coach: document.getElementById('trainingFormCoach').value.trim(),
    focus: document.getElementById('trainingFormFocus').value.trim()
  };

  if (!data.date || !data.startTime) {
    showToast('Informe a data e os horários do treino!', 'error');
    return;
  }

  if (trainingId) {
    store.updateTraining(trainingId, data);
    showToast('Treino atualizado com sucesso!', 'success');
  } else {
    store.addTraining(data);
    showToast('Treino agendado com sucesso!', 'success');
  }

  closeModal('trainingModal');
  renderTrainingCategoryChips();
  renderTrainings();
}

export function openAttendanceCheckinModal(trainingId) {
  const training = store.getTrainingById(trainingId);
  if (!training) return;
  currentCheckinTrainingId = trainingId;

  const cat = getCategoryById(training.categoryId);
  const athletes = store.getAthletes().filter(a => a.categoryId === training.categoryId && a.status === 'ativo');

  const titleEl = document.getElementById('checkinModalTitle');
  const subtitleEl = document.getElementById('checkinModalSubtitle');
  if (titleEl) titleEl.textContent = `Chamada: ${cat.name}`;
  if (subtitleEl) subtitleEl.textContent = `Treino do dia ${formatDate(training.date)} • ${training.startTime} às ${training.endTime} (${training.location})`;

  const listContainer = document.getElementById('attendanceChecklist');
  if (!listContainer) return;

  if (athletes.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        Nenhum atleta ativo cadastrado nesta categoria (${cat.name}).
      </div>
    `;
    openModal('attendanceModal');
    return;
  }

  // Build checklist
  listContainer.innerHTML = athletes.map(athlete => {
    const existing = training.attendance.find(a => a.athleteId === athlete.id);
    const status = existing ? existing.status : 'presente'; // default to presente for rapid check
    const note = existing ? existing.note || '' : '';
    const initials = getInitials(athlete.name);

    return `
      <div class="attendance-item" data-athlete-id="${athlete.id}">
        <div class="attendance-item-athlete">
          <div class="mini-avatar" style="background: ${cat.bg}; border: 1px solid ${cat.color}; color: ${cat.color};">
            ${initials}
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.9rem;">${athlete.name}</div>
            <div style="font-size: 0.74rem; color: var(--text-dim);">${athlete.position || 'Atleta'}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <input type="text" class="attendance-note-input" placeholder="Obs (opcional)" value="${note}" title="Observação individual">
          <div class="attendance-toggle-group">
            <button type="button" class="att-btn presente ${status === 'presente' ? 'active' : ''}" data-val="presente">Presente</button>
            <button type="button" class="att-btn ausente ${status === 'ausente' ? 'active' : ''}" data-val="ausente">Falta</button>
            <button type="button" class="att-btn justificada ${status === 'justificada' ? 'active' : ''}" data-val="justificada">Justificada</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach button toggle handlers
  listContainer.querySelectorAll('.attendance-item').forEach(item => {
    item.querySelectorAll('.att-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        item.querySelectorAll('.att-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateAttendanceSummaryCounters();
      });
    });
  });

  updateAttendanceSummaryCounters();
  openModal('attendanceModal');
}

function updateAttendanceSummaryCounters() {
  const items = document.querySelectorAll('.attendance-item');
  let pres = 0;
  let aus = 0;
  let just = 0;

  items.forEach(item => {
    const activeBtn = item.querySelector('.att-btn.active');
    if (activeBtn) {
      const val = activeBtn.dataset.val;
      if (val === 'presente') pres++;
      else if (val === 'ausente') aus++;
      else if (val === 'justificada') just++;
    }
  });

  const total = items.length;
  const rate = total > 0 ? Math.round((pres / total) * 100) : 0;

  const countBadge = document.getElementById('attendanceLiveCount');
  if (countBadge) {
    countBadge.innerHTML = `
      <span style="color: #10b981; font-weight: 800;">${pres} Presentes</span> • 
      <span style="color: #ef4444; font-weight: 800;">${aus} Faltas</span> • 
      <span style="color: #f59e0b; font-weight: 800;">${just} Justificadas</span> • 
      <span style="color: #38bdf8; font-weight: 800;">${rate}% Presença</span>
    `;
  }
}

function saveAttendanceCheckin() {
  if (!currentCheckinTrainingId) return;

  const attendanceArray = [];
  document.querySelectorAll('.attendance-item').forEach(item => {
    const athleteId = item.dataset.athleteId;
    const activeBtn = item.querySelector('.att-btn.active');
    const noteInput = item.querySelector('.attendance-note-input');
    
    attendanceArray.push({
      athleteId,
      status: activeBtn ? activeBtn.dataset.val : 'presente',
      note: noteInput ? noteInput.value.trim() : ''
    });
  });

  store.saveAttendance(currentCheckinTrainingId, attendanceArray);
  showToast('Chamada de presença salva com sucesso!', 'success');
  closeModal('attendanceModal');
  renderTrainings();
}
