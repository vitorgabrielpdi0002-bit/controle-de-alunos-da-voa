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

  // Rows for the 2 Turmas first
  const pequenosAthletes = athletes.filter(a => a.groupId === 'pequenos' && a.status === 'ativo');
  const grandesAthletes = athletes.filter(a => a.groupId === 'grandes' && a.status === 'ativo');
  const exceptions = athletes.filter(a => a.playsUp === true && a.status === 'ativo');

  let html = `
    <!-- Linhas das 2 Turmas Principais -->
    <tr style="background: rgba(6, 182, 212, 0.08); font-weight: 800;">
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 12px; height: 12px; border-radius: 50%; background: #06b6d4;"></span>
          <span style="color: #06b6d4;">👶 TURMA PEQUENOS (6 a 14 anos) • Ter/Qui/Sáb</span>
        </div>
      </td>
      <td><strong>${pequenosAthletes.length}</strong> atletas</td>
      <td><span style="color: #06b6d4;">Oficial 3x/semana</span></td>
      <td colspan="2" style="font-size: 0.8rem; color: var(--text-muted);">${exceptions.length} atletas jogam também no Grande</td>
    </tr>

    <tr style="background: rgba(245, 158, 11, 0.08); font-weight: 800;">
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;"></span>
          <span style="color: #f59e0b;">🏆 TURMA GRANDES (14+ anos) • Seg/Qui/Sáb</span>
        </div>
      </td>
      <td><strong>${grandesAthletes.length}</strong> atletas</td>
      <td><span style="color: #f59e0b;">Oficial 3x/semana</span></td>
      <td colspan="2" style="font-size: 0.8rem; color: #fbbf24;">Recebe convocação das exceções</td>
    </tr>

    <tr style="border-bottom: 2px solid var(--border-subtle);"><td colspan="5" style="padding: 4px; background: transparent;"></td></tr>
  `;

  html += CATEGORIES.map(cat => {
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
    const catTrainings = trainings.filter(t => t.categoryId === cat.id || t.categoryId === 'all');
    let totalPresent = 0;
    let totalPossible = 0;
    catTrainings.forEach(t => {
      totalPossible += catAthletes.length;
      totalPresent += t.attendance.filter(att => att.status === 'presente' && catAthletes.some(ca => ca.id === att.athleteId)).length;
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
            ${catTrainings.length > 0 ? `${attRate}% frequência` : 'Sem registros'}
          </span>
        </td>
        <td style="color: #10b981; font-weight: 700;">${formatCurrency(collected)}</td>
        <td style="color: ${pending > 0 ? '#ef4444' : '#64748b'}; font-weight: 700;">${formatCurrency(pending)}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = html;
}

function setupExportAndBackupListeners() {
  // Export Athletes CSV
  const btnExpAthletes = document.getElementById('btnExportAthletesCSV');
  if (btnExpAthletes) {
    btnExpAthletes.addEventListener('click', () => {
      const athletes = store.getAthletes();
      let csv = 'ID,Nome,Apelido,Nascimento,Genero,Turma,ExcecaoJogaGrande,Categoria,Responsavel,WhatsApp,Mensalidade,Status\n';
      athletes.forEach(a => {
        const cat = getCategoryById(a.categoryId);
        const turma = a.groupId === 'grandes' ? 'Grandes (14+)' : 'Pequenos (6-14)';
        const jogaGrande = a.playsUp ? 'SIM' : 'NAO';
        csv += `"${a.id}","${a.name}","${a.nickname || ''}","${a.birthDate}","${a.gender}","${turma}","${jogaGrande}","${cat.name}","${a.guardianName || ''}","${a.guardianPhone || ''}","${a.monthlyFee}","${a.status}"\n`;
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
