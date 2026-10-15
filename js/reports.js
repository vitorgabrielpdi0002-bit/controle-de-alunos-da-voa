/**
 * VOA Sports - Módulo de Relatórios, Configurações e Backup
 * Estatísticas por Categoria, Exportação CSV e Backup JSON
 */

import { store, CATEGORIES, getCategoryById } from './data.js';
import { ICONS, formatCurrency, showToast } from './ui.js';
import { renderAthletes } from './athletes.js';
import { renderTrainings } from './trainings.js';
import { renderFinancialKPIs, renderPaymentsTable } from './finances.js';
import { renderDashboardKPIs, renderTodayTrainingsSection, renderFinancialAlertsSection, renderCategoryDistribution } from './dashboard.js';

export function initReportsModule() {
  renderCategoryBreakdownTable();
  setupExportAndBackupListeners();
  loadConfigForm();
}

export function renderCategoryBreakdownTable() {
  const container = document.getElementById('categoryBreakdownTableBody');
  if (!container) return;

  const athletes = store.getAthletes();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const payments = store.getPayments(currentMonth);
  const trainings = store.getTrainings().filter(t => t.status === 'concluido');

  container.innerHTML = CATEGORIES.map(cat => {
    const catAthletes = athletes.filter(a => a.categoryId === cat.id && a.status === 'ativo');
    
    // Revenue for this cat in current month
    let collected = 0;
    let pending = 0;
    catAthletes.forEach(a => {
      const p = payments.find(pay => pay.athleteId === a.id);
      if (p) {
        if (p.status === 'pago') collected += Number(p.amount) || 0;
        else if (p.status !== 'isento') pending += Number(p.amount) || 0;
      }
    });

    // Attendance rate
    const catTrainings = trainings.filter(t => t.categoryId === cat.id);
    let totalPresent = 0;
    let totalPossible = 0;
    catTrainings.forEach(t => {
      totalPossible += catAthletes.length;
      totalPresent += t.attendance.filter(att => att.status === 'presente').length;
    });

    const attRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 100;

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: ${cat.color};"></span>
            <strong>${cat.name}</strong>
          </div>
        </td>
        <td><strong>${catAthletes.length}</strong> atletas</td>
        <td>
          <span style="color: ${attRate >= 75 ? '#10b981' : '#f59e0b'}; font-weight: 700;">
            ${catTrainings.length > 0 ? `${attRate}% (${catTrainings.length} treinos)` : 'Sem treinos'}
          </span>
        </td>
        <td style="color: #10b981; font-weight: 700;">${formatCurrency(collected)}</td>
        <td style="color: ${pending > 0 ? '#ef4444' : '#64748b'}; font-weight: 700;">${formatCurrency(pending)}</td>
      </tr>
    `;
  }).join('');
}

function setupExportAndBackupListeners() {
  // Export Athletes CSV
  const btnExpAthletes = document.getElementById('btnExportAthletesCSV');
  if (btnExpAthletes) {
    btnExpAthletes.addEventListener('click', () => {
      const athletes = store.getAthletes();
      let csv = 'ID,Nome,Apelido,Nascimento,Genero,Categoria,Responsavel,WhatsApp,Mensalidade,Status\n';
      athletes.forEach(a => {
        const cat = getCategoryById(a.categoryId);
        csv += `"${a.id}","${a.name}","${a.nickname || ''}","${a.birthDate}","${a.gender}","${cat.name}","${a.guardianName || ''}","${a.guardianPhone || ''}","${a.monthlyFee}","${a.status}"\n`;
      });
      downloadFile(csv, 'atletas_voa_sports.csv', 'text/csv');
      showToast('Planilha de atletas exportada!', 'success');
    });
  }

  // Export Financial CSV
  const btnExpFinances = document.getElementById('btnExportFinancesCSV');
  if (btnExpFinances) {
    btnExpFinances.addEventListener('click', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const payments = store.getPayments(currentMonth);
      let csv = 'MesRef,Atleta,Categoria,Responsavel,Valor,Vencimento,Status,DataPagamento,Metodo,Recibo\n';
      payments.forEach(p => {
        const a = store.getAthleteById(p.athleteId);
        const cat = a ? getCategoryById(a.categoryId).name : '';
        csv += `"${p.monthRef}","${a ? a.name : ''}","${cat}","${a ? a.guardianName : ''}","${p.amount}","${p.dueDate}","${p.status}","${p.paidDate || ''}","${p.paymentMethod || ''}","${p.receiptCode || ''}"\n`;
      });
      downloadFile(csv, `financeiro_voa_${currentMonth}.csv`, 'text/csv');
      showToast('Planilha financeira exportada!', 'success');
    });
  }

  // JSON Backup Export
  const btnExportJSON = document.getElementById('btnExportBackupJSON');
  if (btnExportJSON) {
    btnExportJSON.addEventListener('click', () => {
      const json = store.exportAllDataJSON();
      downloadFile(json, `backup_voa_sports_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
      showToast('Backup completo exportado com sucesso!', 'success');
    });
  }

  // JSON Backup Import
  const inputImportJSON = document.getElementById('inputImportJSON');
  if (inputImportJSON) {
    inputImportJSON.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const success = store.importDataJSON(event.target.result);
        if (success) {
          showToast('Dados restaurados com sucesso!', 'success');
          refreshAllUI();
        } else {
          showToast('Erro ao importar arquivo JSON de backup!', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // Reset to Sample Demo Data
  const btnResetData = document.getElementById('btnResetDemoData');
  if (btnResetData) {
    btnResetData.addEventListener('click', () => {
      if (confirm('Atenção: Deseja restaurar os dados de demonstração da VOA Sports? Suas alterações serão substituídas pelos dados padrão.')) {
        store.resetAllData();
        showToast('Dados de demonstração restaurados!', 'success');
        refreshAllUI();
      }
    });
  }

  // Config Form
  const formConfig = document.getElementById('academyConfigForm');
  if (formConfig) {
    formConfig.addEventListener('submit', (e) => {
      e.preventDefault();
      store.config.academyName = document.getElementById('cfgAcademyName').value.trim();
      store.config.cnpj = document.getElementById('cfgCnpj').value.trim();
      store.config.pixKey = document.getElementById('cfgPixKey').value.trim();
      store.config.pixType = document.getElementById('cfgPixType').value;
      store.config.phone = document.getElementById('cfgPhone').value.trim();
      store.config.address = document.getElementById('cfgAddress').value.trim();
      store.saveConfig();
      showToast('Configurações da VOA Sports salvas com sucesso!', 'success');
    });
  }
}

function loadConfigForm() {
  const cfg = store.config;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };
  setVal('cfgAcademyName', cfg.academyName);
  setVal('cfgCnpj', cfg.cnpj);
  setVal('cfgPixKey', cfg.pixKey);
  setVal('cfgPixType', cfg.pixType);
  setVal('cfgPhone', cfg.phone);
  setVal('cfgAddress', cfg.address);
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function refreshAllUI() {
  renderAthletes();
  renderTrainings();
  renderFinancialKPIs();
  renderPaymentsTable();
  renderDashboardKPIs();
  renderTodayTrainingsSection();
  renderFinancialAlertsSection();
  renderCategoryDistribution();
  renderCategoryBreakdownTable();
  loadConfigForm();
}
