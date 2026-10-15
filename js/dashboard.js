/**
 * VOA Sports - Módulo Dashboard
 * Visão Geral de Treinos do Dia, Alertas Financeiros e Distribuição por Categorias
 */

import { store, CATEGORIES, getCategoryById } from './data.js';
import { ICONS, formatCurrency, formatDate, renderCategoryBadge, getInitials, getWhatsAppUrl } from './ui.js';
import { openAttendanceCheckinModal, openTrainingModal } from './trainings.js';
import { openRecordPaymentModal } from './finances.js';
import { openAthleteFormModal } from './athletes.js';

export function initDashboardModule() {
  renderDashboardKPIs();
  renderTodayTrainingsSection();
  renderFinancialAlertsSection();
  renderCategoryDistribution();
  setupDashboardQuickActions();
}

export function renderDashboardKPIs() {
  const athletes = store.getAthletes().filter(a => a.status === 'ativo');
  const trainings = store.getTrainings();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const payments = store.getPayments(currentMonth);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrainings = trainings.filter(t => t.date === todayStr);

  const latePayments = payments.filter(p => p.status === 'atrasado');
  const paidPayments = payments.filter(p => p.status === 'pago');

  let totalCollected = 0;
  paidPayments.forEach(p => {
    totalCollected += Number(p.amount) || 0;
  });

  const elAthletes = document.getElementById('dashKpiAthletes');
  const elTrainings = document.getElementById('dashKpiTrainings');
  const elCollected = document.getElementById('dashKpiCollected');
  const elLate = document.getElementById('dashKpiLate');

  if (elAthletes) elAthletes.textContent = athletes.length;
  if (elTrainings) elTrainings.textContent = `${todayTrainings.length} hoje`;
  if (elCollected) elCollected.textContent = formatCurrency(totalCollected);
  if (elLate) elLate.textContent = `${latePayments.length} pendências`;
}

export function renderTodayTrainingsSection() {
  const container = document.getElementById('dashTodayTrainingsList');
  if (!container) return;

  const trainings = store.getTrainings();
  const todayStr = new Date().toISOString().split('T')[0];
  let todayList = trainings.filter(t => t.date === todayStr);

  // If no trainings today, show upcoming 3 trainings
  const isUpcoming = todayList.length === 0;
  if (isUpcoming) {
    todayList = trainings.slice(0, 3);
  }

  const titleEl = document.getElementById('dashTrainingsTitle');
  if (titleEl) {
    titleEl.textContent = isUpcoming ? 'Próximos Treinos Agendados' : 'Treinos de Hoje';
  }

  if (todayList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 25px; color: var(--text-muted); font-size: 0.88rem;">
        Nenhum treino agendado. Clique abaixo para agendar uma sessão.
      </div>
    `;
    return;
  }

  container.innerHTML = todayList.map(training => {
    const cat = getCategoryById(training.categoryId);
    const isDone = training.status === 'concluido';

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); margin-bottom: 10px; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="background: ${cat.bg}; color: ${cat.color}; border: 1px solid ${cat.color}40; padding: 6px 12px; border-radius: var(--radius-md); font-weight: 800; font-size: 0.85rem;">
            ${training.startTime}
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.95rem;">${cat.name}</div>
            <div style="font-size: 0.78rem; color: var(--text-dim);">${training.focus || 'Treino Técnico'} • ${training.location}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="btn ${isDone ? 'btn-secondary' : 'btn-primary'} btn-sm btn-dash-checkin" data-id="${training.id}">
            ${ICONS.check} ${isDone ? 'Ver Chamada' : 'Fazer Chamada'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-dash-checkin').forEach(btn => {
    btn.addEventListener('click', () => openAttendanceCheckinModal(btn.dataset.id));
  });
}

export function renderFinancialAlertsSection() {
  const container = document.getElementById('dashFinancialAlertsList');
  if (!container) return;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const payments = store.getPayments(currentMonth);
  const lateList = payments.filter(p => p.status === 'atrasado');

  if (lateList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 25px; color: #10b981; font-size: 0.88rem; font-weight: 700; background: rgba(16, 185, 129, 0.08); border-radius: var(--radius-md); border: 1px solid rgba(16, 185, 129, 0.2);">
        ✓ Nenhuma mensalidade em atraso no momento! Todas as contas em dia.
      </div>
    `;
    return;
  }

  container.innerHTML = lateList.slice(0, 5).map(payment => {
    const athlete = store.getAthleteById(payment.athleteId);
    if (!athlete) return '';

    const cat = getCategoryById(athlete.categoryId);
    const msg = `Olá, ${athlete.guardianName || athlete.name}! Lembramos da mensalidade do atleta ${athlete.name} na VOA Sports (${formatCurrency(payment.amount)}). Chave Pix: ${store.config.pixKey}.`;
    const waUrl = getWhatsAppUrl(athlete.guardianPhone, msg);

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--bg-card); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-md); margin-bottom: 8px; gap: 10px; flex-wrap: wrap;">
        <div>
          <div style="font-weight: 700; font-size: 0.9rem;">${athlete.name}</div>
          <div style="font-size: 0.76rem; color: var(--accent-rose); font-weight: 600;">
            Venceu dia ${formatDate(payment.dueDate)} • ${formatCurrency(payment.amount)}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 6px;">
          ${athlete.guardianPhone ? `
            <a href="${waUrl}" target="_blank" class="btn btn-secondary btn-sm" style="color: #25d366;" title="Cobrar WhatsApp">
              ${ICONS.whatsapp} Cobrar
            </a>
          ` : ''}
          <button class="btn btn-success btn-sm btn-dash-pay" data-id="${payment.id}">
            Baixar
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-dash-pay').forEach(btn => {
    btn.addEventListener('click', () => openRecordPaymentModal(btn.dataset.id));
  });
}

export function renderCategoryDistribution() {
  const container = document.getElementById('dashCategoryStatsContainer');
  if (!container) return;

  const athletes = store.getAthletes().filter(a => a.status === 'ativo');
  const total = athletes.length || 1;

  container.innerHTML = CATEGORIES.map(cat => {
    const count = athletes.filter(a => a.categoryId === cat.id).length;
    const pct = Math.round((count / total) * 100);

    return `
      <div class="category-stat-row">
        <div class="cat-stat-name">${cat.code}</div>
        <div class="cat-stat-bar-outer">
          <div class="cat-stat-bar-inner" style="width: ${pct}%; background: ${cat.color};"></div>
        </div>
        <div class="cat-stat-count" style="color: ${cat.color};">${count}</div>
      </div>
    `;
  }).join('');
}

function setupDashboardQuickActions() {
  const btnNewAth = document.getElementById('dashBtnNewAthlete');
  if (btnNewAth) btnNewAth.addEventListener('click', () => openAthleteFormModal());

  const btnNewTr = document.getElementById('dashBtnNewTraining');
  if (btnNewTr) btnNewTr.addEventListener('click', () => openTrainingModal());
}
