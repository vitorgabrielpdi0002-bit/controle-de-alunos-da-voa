/**
 * VOA Sports - Aplicação Principal (Router de Abas, Tema, Inicialização)
 */

import { initAthletesModule } from './athletes.js';
import { initTrainingsModule } from './trainings.js';
import { initFinancesModule } from './finances.js';
import { initDashboardModule, renderDashboardKPIs, renderTodayTrainingsSection, renderFinancialAlertsSection, renderCategoryDistribution } from './dashboard.js';
import { initReportsModule, renderCategoryBreakdownTable } from './reports.js';
import { closeModal, ICONS } from './ui.js';
import { store } from './data.js';

let activeTab = 'dashboard';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupTabRouting();
  setupModalDismissals();
  setupMobileDrawer();

  // Initialize all feature modules
  initDashboardModule();
  initAthletesModule();
  initTrainingsModule();
  initFinancesModule();
  initReportsModule();
});

function setupTabRouting() {
  const navItems = document.querySelectorAll('.nav-item');
  const pageViews = document.querySelectorAll('.page-view');
  const pageTitle = document.getElementById('headerPageTitle');
  const pageSubtitle = document.getElementById('headerPageSubtitle');

  const titles = {
    dashboard: { title: 'Dashboard Executivo', sub: 'Visão geral de treinos, atletas e financeiro da academia' },
    athletes: { title: 'Gestão de Atletas', sub: 'Categorias Sub-11, Sub-13, Sub-16 e Sub-18 (Masc / Fem)' },
    trainings: { title: 'Agenda de Treinos & Presença', sub: 'Controle de chamadas, faltas justificadas e histórico' },
    finances: { title: 'Controle de Mensalidades', sub: 'Acompanhamento de pagamentos, vencimentos e recibos' },
    reports: { title: 'Relatórios & Configurações', sub: 'Desempenho por categoria, exportação CSV e backup' }
  };

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.dataset.tab;
      if (!targetTab) return;

      activeTab = targetTab;

      // Update Nav active states
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Update Views
      pageViews.forEach(view => {
        if (view.id === `view-${targetTab}`) {
          view.classList.add('active');
        } else {
          view.classList.remove('active');
        }
      });

      // Update Header Text
      if (titles[targetTab]) {
        if (pageTitle) pageTitle.textContent = titles[targetTab].title;
        if (pageSubtitle) pageSubtitle.textContent = titles[targetTab].sub;
      }

      // Close mobile drawer if open
      const sidebar = document.getElementById('appSidebar');
      if (sidebar) sidebar.classList.remove('open');

      // Refresh dynamic metrics on tab change
      if (targetTab === 'dashboard') {
        renderDashboardKPIs();
        renderTodayTrainingsSection();
        renderFinancialAlertsSection();
        renderCategoryDistribution();
      } else if (targetTab === 'reports') {
        renderCategoryBreakdownTable();
      }
    });
  });
}

function setupModalDismissals() {
  // Close buttons with data-close
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      closeModal(modalId);
    });
  });

  // Click outside modal-card on modal-overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // ESC key to dismiss
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(overlay => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
  });
}

function initTheme() {
  const currentTheme = store.config.theme || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);

  const themeBtn = document.getElementById('btnThemeToggle');
  if (themeBtn) {
    updateThemeIcon(themeBtn, currentTheme);
    themeBtn.addEventListener('click', () => {
      const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      store.config.theme = newTheme;
      store.saveConfig();
      updateThemeIcon(themeBtn, newTheme);
    });
  }
}

function updateThemeIcon(btn, theme) {
  btn.innerHTML = theme === 'light' ? ICONS.moon : ICONS.sun;
  btn.title = theme === 'light' ? 'Mudar para Tema Escuro' : 'Mudar para Tema Claro';
}

function setupMobileDrawer() {
  const menuBtn = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('appSidebar');
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}
