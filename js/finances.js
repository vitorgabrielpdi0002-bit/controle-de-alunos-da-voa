/**
 * VOA Sports - Módulo Financeiro e Controle de Mensalidades
 * Controle de Pagamentos, Status (Pago, Pendente, Atrasado), Recibos e Cobrança WhatsApp
 */

import { store, CATEGORIES, getCategoryById } from './data.js';
import { ICONS, formatCurrency, formatDate, formatMonthName, renderCategoryBadge, getInitials, getWhatsAppUrl, openModal, closeModal, showToast } from './ui.js';

let selectedMonth = '2026-10'; // Default current reference month
let selectedStatusFilter = 'all';
let selectedGroupFilter = 'all';
let selectedCategoryFilter = 'all';
let searchQuery = '';
let currentPayingPaymentId = null;

export function initFinancesModule() {
  const today = new Date().toISOString().slice(0, 7);
  selectedMonth = today || '2026-10';

  store.syncPaymentsForMonth(selectedMonth);

  renderMonthSelector();
  renderFinancialKPIs();
  renderPaymentsTable();
  setupEventListeners();
}

function renderMonthSelector() {
  const container = document.getElementById('financeMonthDisplay');
  if (container) {
    container.textContent = formatMonthName(selectedMonth);
  }
}

export function renderFinancialKPIs() {
  const payments = store.getPayments(selectedMonth);
  
  let totalCollected = 0;
  let totalPending = 0;
  let totalLate = 0;
  let countPaid = 0;
  let countTotalPayable = 0;

  payments.forEach(p => {
    if (p.status === 'isento') return;

    countTotalPayable++;
    if (p.status === 'pago') {
      totalCollected += Number(p.amount) || 0;
      countPaid++;
    } else if (p.status === 'atrasado') {
      totalLate += Number(p.amount) || 0;
    } else {
      totalPending += Number(p.amount) || 0;
    }
  });

  const rate = countTotalPayable > 0 ? Math.round((countPaid / countTotalPayable) * 100) : 0;

  const elCollected = document.getElementById('kpiTotalCollected');
  const elPending = document.getElementById('kpiTotalPending');
  const elLate = document.getElementById('kpiTotalLate');
  const elRate = document.getElementById('kpiAdherenceRate');

  if (elCollected) elCollected.textContent = formatCurrency(totalCollected);
  if (elPending) elPending.textContent = formatCurrency(totalPending);
  if (elLate) elLate.textContent = formatCurrency(totalLate);
  if (elRate) elRate.textContent = `${rate}% (${countPaid}/${countTotalPayable})`;
}

export function renderPaymentsTable() {
  const container = document.getElementById('paymentsTableBody');
  if (!container) return;

  let list = store.getPayments(selectedMonth);

  // Filter by group (Pequenos / Grandes)
  if (selectedGroupFilter !== 'all') {
    list = list.filter(p => {
      const ath = store.getAthleteById(p.athleteId);
      return ath && ath.groupId === selectedGroupFilter;
    });
  }

  // Filter by category
  if (selectedCategoryFilter !== 'all') {
    list = list.filter(p => {
      const ath = store.getAthleteById(p.athleteId);
      return ath && ath.categoryId === selectedCategoryFilter;
    });
  }

  // Filter by status
  if (selectedStatusFilter !== 'all') {
    list = list.filter(p => p.status === selectedStatusFilter);
  }

  // Filter by search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(p => {
      const ath = store.getAthleteById(p.athleteId);
      if (!ath) return false;
      return ath.name.toLowerCase().includes(q) ||
        (ath.guardianName && ath.guardianName.toLowerCase().includes(q));
    });
  }

  if (list.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
          Nenhuma mensalidade encontrada para os filtros aplicados neste mês.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = list.map(payment => {
    const athlete = store.getAthleteById(payment.athleteId);
    if (!athlete) return '';

    const cat = getCategoryById(athlete.categoryId);
    const initials = getInitials(athlete.name);
    const grpName = athlete.groupId === 'grandes' ? 'Turma Grandes' : 'Turma Pequenos';
    const grpColor = athlete.groupId === 'grandes' ? '#f59e0b' : '#06b6d4';

    // WhatsApp Reminder text
    const config = store.config;
    const msg = `Olá, ${athlete.guardianName || athlete.name}! Mensagem da ${config.academyName}. Informamos que a mensalidade de ${formatMonthName(payment.monthRef)} do atleta ${athlete.name} no valor de ${formatCurrency(payment.amount)} está com vencimento em ${formatDate(payment.dueDate)}. Chave Pix para pagamento: ${config.pixKey} (${config.pixType}). Em caso de dúvidas, estamos à disposição!`;
    const waUrl = getWhatsAppUrl(athlete.guardianPhone, msg);

    let actionsHtml = '';
    if (payment.status === 'pago') {
      actionsHtml = `
        <button class="btn btn-secondary btn-sm btn-print-receipt" data-id="${payment.id}" title="Emitir Recibo Oficial">
          ${ICONS.receipt} Recibo
        </button>
        <button class="btn btn-secondary btn-sm btn-cancel-payment" data-id="${payment.id}" title="Estornar / Reabrir Pagamento" style="color: var(--accent-rose);">
          ${ICONS.x}
        </button>
      `;
    } else if (payment.status === 'isento') {
      actionsHtml = `
        <button class="btn btn-secondary btn-sm btn-print-receipt" data-id="${payment.id}" title="Declaração de Bolsa">
          ${ICONS.receipt} Bolsa
        </button>
      `;
    } else {
      actionsHtml = `
        <button class="btn btn-success btn-sm btn-receive-payment" data-id="${payment.id}">
          ${ICONS.check} Baixar
        </button>
        ${athlete.guardianPhone ? `
          <a href="${waUrl}" target="_blank" class="btn btn-secondary btn-sm" style="color: #25d366;" title="Lembrar no WhatsApp">
            ${ICONS.whatsapp} Cobrar
          </a>
        ` : ''}
      `;
    }

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="mini-avatar" style="width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; background: ${cat.bg}; border: 1px solid ${cat.color}; color: ${cat.color};">
              ${initials}
            </div>
            <div>
              <div style="font-weight: 700;">${athlete.name}</div>
              <div style="font-size: 0.75rem; color: ${grpColor}; font-weight: 700;">
                ${grpName} • ${cat.code}
                ${athlete.playsUp ? '<span style="color: #ef4444;" title="Joga no Grande (Exceção)"> ⚡ Exceção</span>' : ''}
              </div>
            </div>
          </div>
        </td>
        <td>
          <div>${athlete.guardianName || 'Próprio Atleta'}</div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">${athlete.guardianPhone || '-'}</div>
        </td>
        <td>
          <div style="font-weight: 700;">${formatDate(payment.dueDate)}</div>
          <div style="font-size: 0.72rem; color: var(--text-dim);">Dia ${athlete.dueDay || 10}</div>
        </td>
        <td>
          <div style="font-weight: 800; font-size: 0.95rem;">${payment.status === 'isento' ? '<span style="color: #a78bfa;">Isento</span>' : formatCurrency(payment.amount)}</div>
        </td>
        <td>
          <span class="status-pill ${payment.status}">${payment.status.toUpperCase()}</span>
          ${payment.paidDate ? `<div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 3px;">Pago em ${formatDate(payment.paidDate)} (${payment.paymentMethod || 'Pix'})</div>` : ''}
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${actionsHtml}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach table event handlers
  container.querySelectorAll('.btn-receive-payment').forEach(btn => {
    btn.addEventListener('click', () => openRecordPaymentModal(btn.dataset.id));
  });

  container.querySelectorAll('.btn-print-receipt').forEach(btn => {
    btn.addEventListener('click', () => openReceiptModal(btn.dataset.id));
  });

  container.querySelectorAll('.btn-cancel-payment').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Deseja estornar e reabrir esta mensalidade?')) {
        store.cancelPayment(btn.dataset.id);
        showToast('Pagamento cancelado e retornado para pendente.', 'success');
        renderFinancialKPIs();
        renderPaymentsTable();
      }
    });
  });
}

function setupEventListeners() {
  // Month navigation
  const btnPrevMonth = document.getElementById('btnPrevMonth');
  if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', () => changeMonth(-1));
  }

  const btnNextMonth = document.getElementById('btnNextMonth');
  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => changeMonth(1));
  }

  const btnCurrentMonth = document.getElementById('btnCurrentMonth');
  if (btnCurrentMonth) {
    btnCurrentMonth.addEventListener('click', () => {
      selectedMonth = new Date().toISOString().slice(0, 7);
      store.syncPaymentsForMonth(selectedMonth);
      renderMonthSelector();
      renderFinancialKPIs();
      renderPaymentsTable();
    });
  }

  // Filter dropdowns
  const filterStatus = document.getElementById('filterPaymentStatus');
  if (filterStatus) {
    filterStatus.addEventListener('change', (e) => {
      selectedStatusFilter = e.target.value;
      renderPaymentsTable();
    });
  }

  const filterGroup = document.getElementById('filterPaymentGroup');
  if (filterGroup) {
    filterGroup.addEventListener('change', (e) => {
      selectedGroupFilter = e.target.value;
      renderPaymentsTable();
    });
  }

  const filterCat = document.getElementById('filterPaymentCategory');
  if (filterCat) {
    filterCat.addEventListener('change', (e) => {
      selectedCategoryFilter = e.target.value;
      renderPaymentsTable();
    });
  }

  const searchInput = document.getElementById('searchPayment');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderPaymentsTable();
    });
  }

  // Record Payment Form Submit
  const formPayment = document.getElementById('recordPaymentForm');
  if (formPayment) {
    formPayment.addEventListener('submit', (e) => {
      e.preventDefault();
      confirmRecordPayment();
    });
  }

  // Print Receipt Button
  const btnPrintReceipt = document.getElementById('btnPrintReceiptAction');
  if (btnPrintReceipt) {
    btnPrintReceipt.addEventListener('click', () => {
      window.print();
    });
  }
}

function changeMonth(delta) {
  const [yearStr, monthStr] = selectedMonth.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + delta;

  if (month > 12) {
    month = 1;
    year++;
  } else if (month < 1) {
    month = 12;
    year--;
  }

  selectedMonth = `${year}-${String(month).padStart(2, '0')}`;
  store.syncPaymentsForMonth(selectedMonth);
  renderMonthSelector();
  renderFinancialKPIs();
  renderPaymentsTable();
}

export function openRecordPaymentModal(paymentId) {
  const payment = store.getPaymentById(paymentId);
  if (!payment) return;
  currentPayingPaymentId = paymentId;

  const athlete = store.getAthleteById(payment.athleteId);
  if (!athlete) return;

  const todayStr = new Date().toISOString().split('T')[0];

  document.getElementById('payModalAthleteName').textContent = `${athlete.name} (${athlete.guardianName || 'Sem responsável'})`;
  document.getElementById('payModalRefMonth').textContent = formatMonthName(payment.monthRef);
  document.getElementById('payModalDueDate').textContent = formatDate(payment.dueDate);
  document.getElementById('payModalAmount').value = payment.amount;
  document.getElementById('payModalDate').value = todayStr;
  document.getElementById('payModalMethod').value = 'Pix';
  document.getElementById('payModalNotes').value = '';

  openModal('recordPaymentModal');
}

function confirmRecordPayment() {
  if (!currentPayingPaymentId) return;

  const amount = parseFloat(document.getElementById('payModalAmount').value) || 0;
  const paidDate = document.getElementById('payModalDate').value;
  const paymentMethod = document.getElementById('payModalMethod').value;
  const notes = document.getElementById('payModalNotes').value.trim();

  store.recordPayment(currentPayingPaymentId, {
    customAmount: amount,
    paidDate,
    paymentMethod,
    notes
  });

  showToast('Pagamento registrado com sucesso!', 'success');
  closeModal('recordPaymentModal');
  renderFinancialKPIs();
  renderPaymentsTable();
}

export function openReceiptModal(paymentId) {
  const payment = store.getPaymentById(paymentId);
  if (!payment) return;

  const athlete = store.getAthleteById(payment.athleteId);
  if (!athlete) return;

  const cat = getCategoryById(athlete.categoryId);
  const config = store.config;

  const container = document.getElementById('receiptPrintableContent');
  if (!container) return;

  const isFree = payment.status === 'isento';
  const receiptTitle = isFree ? 'DECLARAÇÃO DE BOLSA ESPORTIVA' : 'RECIBO DE PAGAMENTO DE MENSALIDADE';

  container.innerHTML = `
    <div class="receipt-wrapper">
      <div class="receipt-header">
        <div class="receipt-logo-group">
          <img src="/assets/logo.jpg" alt="VOA Sports" class="receipt-logo-img">
          <div>
            <h2>${config.academyName}</h2>
            <div style="font-size: 0.8rem; color: #64748b;">CNPJ: ${config.cnpj} • Tel: ${config.phone}</div>
            <div style="font-size: 0.8rem; color: #64748b;">${config.address}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div class="receipt-badge">${isFree ? 'BOLSA 100%' : 'PAGO'}</div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #64748b; margin-top: 6px;">Nº ${payment.receiptCode || 'VOA-RECIBO'}</div>
        </div>
      </div>

      <div class="receipt-body">
        <h3 style="font-size: 1.15rem; font-weight: 800; text-align: center; color: #0f172a; margin-bottom: 8px;">
          ${receiptTitle}
        </h3>

        <p>
          Declaramos para os devidos fins que recebemos de <strong>${athlete.guardianName || athlete.name}</strong> a importância referente à mensalidade esportiva do(a) atleta <strong>${athlete.name}</strong>, inscrito(a) na categoria <strong>${cat.name}</strong>.
        </p>

        <div class="receipt-amount-box">
          <div>
            <div style="font-size: 0.78rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Mês de Referência</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #0284c7;">${formatMonthName(payment.monthRef)}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.78rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Valor Recebido</div>
            <div class="receipt-amount-val">${isFree ? 'ISENTO (BOLSA)' : formatCurrency(payment.amount)}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; padding: 14px; border-radius: 8px; font-size: 0.88rem;">
          <div><strong>Data do Pagamento:</strong> ${formatDate(payment.paidDate || payment.dueDate)}</div>
          <div><strong>Forma de Pagamento:</strong> ${payment.paymentMethod || 'Pix'}</div>
          <div><strong>Data de Vencimento:</strong> ${formatDate(payment.dueDate)}</div>
          <div><strong>Observações:</strong> ${payment.notes || 'Nenhuma'}</div>
        </div>

        <div class="receipt-signatures">
          <div class="sig-line">
            Coordenação Administrativa VOA Sports
          </div>
          <div class="sig-line">
            Responsável / Aluno
          </div>
        </div>
      </div>
    </div>
  `;

  openModal('receiptModal');
}
