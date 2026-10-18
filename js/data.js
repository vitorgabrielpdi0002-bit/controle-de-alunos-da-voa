/**
 * VOA Vôlei - Camada de Dados e Armazenamento (LocalStorage)
 * Gerencia Atletas, Chamadas, Mensalidades e Perfil
 */

const STORAGE_KEY_ATHLETES = 'voa_volei_athletes_v2';
const STORAGE_KEY_ATTENDANCE = 'voa_volei_attendance_v2';
const STORAGE_KEY_FINANCES = 'voa_volei_finances_v2';
const STORAGE_KEY_PROFILE = 'voa_volei_profile_v2';

// Categorias Oficiais
export const CATEGORIES = [
  { id: 'sub11', name: 'Sub-11', label: 'Sub-11 (Até 11 anos)', minAge: 6, maxAge: 11, color: '#06b6d4' },
  { id: 'sub13', name: 'Sub-13', label: 'Sub-13 (12-13 anos)', minAge: 12, maxAge: 13, color: '#3b82f6' },
  { id: 'sub15', name: 'Sub-15', label: 'Sub-15 (14-15 anos)', minAge: 14, maxAge: 15, color: '#f59e0b' },
  { id: 'sub17', name: 'Sub-17', label: 'Sub-17 (16-17 anos)', minAge: 16, maxAge: 17, color: '#10b981' },
  { id: 'sub19', name: 'Sub-19', label: 'Sub-19 (18-19 anos)', minAge: 18, maxAge: 19, color: '#8b5cf6' },
  { id: 'adulto', name: 'Adulto', label: 'Adulto (20+ anos)', minAge: 20, maxAge: 99, color: '#ec4899' }
];

export const POSITIONS = [
  'Levantador',
  'Ponteiro',
  'Central',
  'Oposto',
  'Líbero',
  'Iniciante / Geral'
];

// Fundamentos Oficiais de Voleibol para Avaliação Técnica (Scouting)
export const EVALUATION_SKILLS = [
  { id: 'saque', name: 'Saque', icon: '🏐', desc: 'Potência, direcionamento e consistência no saque' },
  { id: 'toque', name: 'Toque', icon: '🤲', desc: 'Postura de mãos, precisão e levantamento' },
  { id: 'manchete', name: 'Manchete', icon: '🛡️', desc: 'Passe, recepção de saque e defesa baixa' },
  { id: 'precisaoAtaque', name: 'Precisão de Ataque', icon: '🎯', desc: 'Visão de quadra, diagonais e paralelas' },
  { id: 'acertoAtaque', name: 'Acerto de Ataque', icon: '💥', desc: 'Finalização de jogadas, potência e pontuação' },
  { id: 'posicionamento', name: 'Posicionamento', icon: '🧭', desc: 'Leitura tática, cobertura e recomposição' },
  { id: 'volumeJogo', name: 'Volume de Jogo', icon: '⚡', desc: 'Raça, velocidade e recuperação de bolas' }
];

// Dados iniciais realistas para o app já vir pronto para uso
const INITIAL_ATHLETES = [
  {
    id: 'at_1',
    name: 'Gabriel Souza',
    birthDate: '2011-04-12',
    gender: 'M',
    category: 'sub15',
    categories: ['sub15', 'sub17'], // Joga na sua categoria (Sub-15) e acima (Sub-17)
    position: 'Levantador',
    phone: '11987654321',
    monthlyFee: 150,
    active: true,
    createdAt: '2026-01-10',
    evaluation: {
      saque: 8.0,
      toque: 9.5,
      manchete: 8.0,
      precisaoAtaque: 7.0,
      acertoAtaque: 6.5,
      posicionamento: 9.0,
      volumeJogo: 8.5,
      notes: 'Excelente visão tática e distribuição veloz pelo meio.',
      updatedAt: '2026-10-10'
    },
    evaluationHistory: [
      {
        id: 'eval_gabriel_1',
        date: '2026-08-15',
        average: 7.2,
        notes: 'Início dos treinamentos de levantamento e passe.',
        skills: { saque: 7.0, toque: 8.0, manchete: 7.0, precisaoAtaque: 6.5, acertoAtaque: 6.0, posicionamento: 8.0, volumeJogo: 7.5 }
      },
      {
        id: 'eval_gabriel_2',
        date: '2026-09-18',
        average: 7.7,
        notes: 'Evolução consistente na postura de mãos e defesa.',
        skills: { saque: 7.5, toque: 9.0, manchete: 7.5, precisaoAtaque: 7.0, acertoAtaque: 6.0, posicionamento: 8.5, volumeJogo: 8.0 }
      },
      {
        id: 'eval_gabriel_3',
        date: '2026-10-10',
        average: 8.1,
        notes: 'Excelente visão tática e distribuição veloz pelo meio.',
        skills: { saque: 8.0, toque: 9.5, manchete: 8.0, precisaoAtaque: 7.0, acertoAtaque: 6.5, posicionamento: 9.0, volumeJogo: 8.5 }
      }
    ]
  },
  {
    id: 'at_2',
    name: 'Beatriz Lima',
    birthDate: '2012-08-20',
    gender: 'F',
    category: 'sub15',
    categories: ['sub15', 'sub17'],
    position: 'Ponteira',
    phone: '11976543210',
    monthlyFee: 150,
    active: true,
    createdAt: '2026-01-15',
    evaluation: {
      saque: 8.5,
      toque: 7.0,
      manchete: 8.5,
      precisaoAtaque: 9.0,
      acertoAtaque: 8.5,
      posicionamento: 8.0,
      volumeJogo: 8.5,
      notes: 'Ataque potente na paralela e saque flutuante agressivo.',
      updatedAt: '2026-10-12'
    },
    evaluationHistory: [
      {
        id: 'eval_bia_1',
        date: '2026-08-20',
        average: 7.4,
        notes: 'Boa força física, desenvolvendo precisão.',
        skills: { saque: 7.5, toque: 6.5, manchete: 7.5, precisaoAtaque: 8.0, acertoAtaque: 7.5, posicionamento: 7.0, volumeJogo: 7.5 }
      },
      {
        id: 'eval_bia_2',
        date: '2026-10-12',
        average: 8.3,
        notes: 'Ataque potente na paralela e saque flutuante agressivo.',
        skills: { saque: 8.5, toque: 7.0, manchete: 8.5, precisaoAtaque: 9.0, acertoAtaque: 8.5, posicionamento: 8.0, volumeJogo: 8.5 }
      }
    ]
  },
  {
    id: 'at_3',
    name: 'Lucas Martins',
    birthDate: '2010-02-14',
    gender: 'M',
    category: 'sub17',
    categories: ['sub17', 'sub19'],
    position: 'Central',
    phone: '11965432109',
    monthlyFee: 150,
    active: true,
    createdAt: '2026-02-01',
    evaluation: {
      saque: 7.5,
      toque: 6.5,
      manchete: 7.0,
      precisaoAtaque: 8.5,
      acertoAtaque: 9.0,
      posicionamento: 8.5,
      volumeJogo: 8.0,
      notes: 'Tempo de bloqueio excelente e ataque rápido pelo meio.',
      updatedAt: '2026-10-08'
    },
    evaluationHistory: [
      {
        id: 'eval_lucas_1',
        date: '2026-09-01',
        average: 7.3,
        notes: 'Ajuste de alcance e salto vertical.',
        skills: { saque: 7.0, toque: 6.0, manchete: 6.5, precisaoAtaque: 8.0, acertoAtaque: 8.5, posicionamento: 7.5, volumeJogo: 7.5 }
      },
      {
        id: 'eval_lucas_2',
        date: '2026-10-08',
        average: 7.9,
        notes: 'Tempo de bloqueio excelente e ataque rápido pelo meio.',
        skills: { saque: 7.5, toque: 6.5, manchete: 7.0, precisaoAtaque: 8.5, acertoAtaque: 9.0, posicionamento: 8.5, volumeJogo: 8.0 }
      }
    ]
  },
  {
    id: 'at_4',
    name: 'Ana Carolina Silva',
    birthDate: '2015-06-18',
    gender: 'F',
    category: 'sub11',
    categories: ['sub11', 'sub13'], // 11 anos jogando Sub-11 e Sub-13
    position: 'Iniciante / Geral',
    phone: '11954321098',
    monthlyFee: 130,
    active: true,
    createdAt: '2026-02-10'
  },
  {
    id: 'at_5',
    name: 'Matheus Henrique',
    birthDate: '2013-11-05',
    gender: 'M',
    category: 'sub13',
    categories: ['sub13', 'sub15'],
    position: 'Oposto',
    phone: '11943210987',
    monthlyFee: 140,
    active: true,
    createdAt: '2026-02-20'
  },
  {
    id: 'at_6',
    name: 'Larissa Rocha',
    birthDate: '2010-09-30',
    gender: 'F',
    category: 'sub17',
    categories: ['sub17'],
    position: 'Líbero',
    phone: '11932109876',
    monthlyFee: 150,
    active: true,
    createdAt: '2026-03-01',
    evaluation: {
      saque: 6.5,
      toque: 8.5,
      manchete: 9.5,
      precisaoAtaque: 5.5,
      acertoAtaque: 5.0,
      posicionamento: 9.5,
      volumeJogo: 10.0,
      notes: 'Destaque absoluto em recepção, cobertura de ataque e defesa.',
      updatedAt: '2026-10-15'
    }
  },
  {
    id: 'at_7',
    name: 'Enzo Ferrari',
    birthDate: '2016-03-25',
    gender: 'M',
    category: 'sub11',
    categories: ['sub11', 'sub13', 'sub15'], // 10 anos jogando Sub-11, Sub-13 e Sub-15!
    position: 'Iniciante / Geral',
    phone: '11921098765',
    monthlyFee: 130,
    active: true,
    createdAt: '2026-03-10'
  },
  {
    id: 'at_8',
    name: 'Sophia Ferreira',
    birthDate: '2014-01-19',
    gender: 'F',
    category: 'sub13',
    categories: ['sub13', 'sub15'],
    position: 'Levantadora',
    phone: '11910987654',
    monthlyFee: 140,
    active: true,
    createdAt: '2026-03-15'
  },
  {
    id: 'at_9',
    name: 'Felipe Nascimento',
    birthDate: '2008-07-08',
    gender: 'M',
    category: 'sub19',
    categories: ['sub19', 'adulto'],
    position: 'Ponteiro',
    phone: '11909876543',
    monthlyFee: 160,
    active: true,
    createdAt: '2026-03-20',
    evaluation: {
      saque: 9.0,
      toque: 7.5,
      manchete: 8.0,
      precisaoAtaque: 8.5,
      acertoAtaque: 9.0,
      posicionamento: 8.5,
      volumeJogo: 8.5,
      notes: 'Poder de ataque no fundo de quadra (pipe) e saque viagem veloz.',
      updatedAt: '2026-10-14'
    }
  },
  {
    id: 'at_10',
    name: 'Camila Duarte',
    birthDate: '2008-12-11',
    gender: 'F',
    category: 'sub19',
    categories: ['sub19', 'adulto'],
    position: 'Central',
    phone: '11998761234',
    monthlyFee: 160,
    active: true,
    createdAt: '2026-04-01'
  }
];

const INITIAL_PROFILE = {
  name: 'Vitor Gabriel',
  role: 'Treinador Principal',
  email: 'voleiacademyolympic@gmail.com',
  academy: 'VOA Academy',
  phone: '77981419995',
  bio: 'Treinador de voleibol dedicado à formação de atletas e alto rendimento.'
};

// Funções de Cálculo Auxiliares (Regra de Federação Esportiva por Ano de Nascimento)
export function getBirthYear(birthDateStr) {
  if (!birthDateStr) return new Date().getFullYear();
  const parts = String(birthDateStr).split('-');
  return parseInt(parts[0], 10) || new Date().getFullYear();
}

// Idade Esportiva Oficial: ano corrente - ano de nascimento (Padrão CBV / Federações)
export function calculateSportAge(birthDateStr) {
  if (!birthDateStr) return 0;
  const birthYear = getBirthYear(birthDateStr);
  const currentYear = new Date().getFullYear();
  return Math.max(0, currentYear - birthYear);
}

// Idade em anos (usada para exibição e categoria)
export function calculateAge(birthDateStr) {
  return calculateSportAge(birthDateStr);
}

// Sugestão de categoria oficial baseada no Ano de Nascimento
export function calculateCategory(birthDateStr) {
  const sportAge = calculateSportAge(birthDateStr);
  if (sportAge <= 11) return 'sub11';
  if (sportAge <= 13) return 'sub13';
  if (sportAge <= 15) return 'sub15';
  if (sportAge <= 17) return 'sub17';
  if (sportAge <= 19) return 'sub19';
  return 'adulto';
}

export function getCategoryObj(categoryId) {
  return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[2];
}

export function athleteCanPlayCategory(athlete, categoryId) {
  if (!athlete) return false;
  if (!categoryId || categoryId === 'all') return true;
  const cats = athlete.categories && Array.isArray(athlete.categories) && athlete.categories.length > 0
    ? athlete.categories
    : [athlete.category];
  return cats.includes(categoryId);
}

// Funções Auxiliares de Avaliação Técnica
export function calculateOverallRating(evalObj) {
  if (!evalObj) return null;
  const skills = ['saque', 'toque', 'manchete', 'precisaoAtaque', 'acertoAtaque', 'posicionamento', 'volumeJogo'];
  let sum = 0;
  let count = 0;
  for (const s of skills) {
    if (typeof evalObj[s] === 'number') {
      sum += evalObj[s];
      count++;
    }
  }
  return count > 0 ? Number((sum / count).toFixed(1)) : null;
}

export function getEvaluationLevel(score) {
  if (score === null || score === undefined) return { label: 'Não avaliado', color: '#94a3b8' };
  if (score >= 9.0) return { label: 'Elite / Destaque', color: '#f59e0b' };
  if (score >= 7.5) return { label: 'Avançado', color: '#10b981' };
  if (score >= 6.0) return { label: 'Bom Rendimento', color: '#3b82f6' };
  if (score >= 4.5) return { label: 'Em Desenvolvimento', color: '#f97316' };
  return { label: 'Iniciante / Básico', color: '#ef4444' };
}

// ==========================================================================
// STORE PRINCIPAL
// ==========================================================================
export const store = {
  // ATLETAS
  getAthletes() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ATHLETES);
      let athletes = data ? JSON.parse(data) : null;
      if (!athletes || !Array.isArray(athletes) || athletes.length === 0) {
        this.saveAthletes(INITIAL_ATHLETES);
        return [...INITIAL_ATHLETES];
      }
      // Garante que todo atleta possua o array categories e suporte a evaluation e evaluationHistory
      athletes = athletes.map(a => {
        if (!a.categories || !Array.isArray(a.categories) || a.categories.length === 0) {
          a.categories = [a.category || 'sub15'];
        }
        if (a.evaluation === undefined) {
          const init = INITIAL_ATHLETES.find(ia => ia.id === a.id);
          a.evaluation = init && init.evaluation ? init.evaluation : null;
        }
        if (!a.evaluationHistory || !Array.isArray(a.evaluationHistory) || a.evaluationHistory.length === 0) {
          const init = INITIAL_ATHLETES.find(ia => ia.id === a.id);
          if (init && Array.isArray(init.evaluationHistory) && init.evaluationHistory.length > 0) {
            a.evaluationHistory = [...init.evaluationHistory];
          } else if (a.evaluation) {
            a.evaluationHistory = [{
              id: 'eval_init_' + a.id,
              date: a.evaluation.updatedAt || '2026-10-18',
              average: calculateOverallRating(a.evaluation),
              notes: a.evaluation.notes || '',
              skills: { ...a.evaluation }
            }];
          } else {
            a.evaluationHistory = [];
          }
        }
        return a;
      });
      return athletes;
    } catch (e) {
      console.error('Erro ao ler atletas do LocalStorage:', e);
      return [...INITIAL_ATHLETES];
    }
  },

  saveAthletes(athletes) {
    try {
      localStorage.setItem(STORAGE_KEY_ATHLETES, JSON.stringify(athletes));
    } catch (e) {
      console.error('Erro ao salvar atletas no LocalStorage:', e);
    }
  },

  getAthleteById(id) {
    return this.getAthletes().find(a => a.id === id) || null;
  },

  saveAthleteEvaluation(athleteId, evaluation) {
    const athletes = this.getAthletes();
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      athlete.evaluation = evaluation;
      if (!Array.isArray(athlete.evaluationHistory)) {
        athlete.evaluationHistory = [];
      }

      const evalDate = evaluation.updatedAt || new Date().toISOString().split('T')[0];
      const avg = calculateOverallRating(evaluation);

      const existingIdx = athlete.evaluationHistory.findIndex(h => h.date === evalDate);
      const newEntry = {
        id: 'eval_' + Date.now(),
        date: evalDate,
        average: avg,
        notes: evaluation.notes || '',
        skills: { ...evaluation }
      };

      if (existingIdx !== -1) {
        athlete.evaluationHistory[existingIdx] = newEntry;
      } else {
        athlete.evaluationHistory.push(newEntry);
      }

      // Ordena cronologicamente por data
      athlete.evaluationHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

      this.saveAthletes(athletes);
      return athlete;
    }
    return null;
  },

  addAthlete(athlete) {
    const athletes = this.getAthletes();
    const newAthlete = {
      ...athlete,
      id: 'at_' + Date.now(),
      active: true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    athletes.unshift(newAthlete);
    this.saveAthletes(athletes);
    return newAthlete;
  },

  updateAthlete(id, updatedFields) {
    const athletes = this.getAthletes();
    const index = athletes.findIndex(a => a.id === id);
    if (index !== -1) {
      athletes[index] = { ...athletes[index], ...updatedFields };
      this.saveAthletes(athletes);
      return athletes[index];
    }
    return null;
  },

  deleteAthlete(id) {
    const athletes = this.getAthletes().filter(a => a.id !== id);
    this.saveAthletes(athletes);
  },

  // CHAMADA / PRESENÇAS
  // Estrutura: { [dateStr]: { [athleteId]: 'presente' | 'falta' } }
  getAttendances() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Erro ao ler attendances:', e);
      return {};
    }
  },

  getAttendanceForDate(dateStr) {
    const all = this.getAttendances();
    return all[dateStr] || null;
  },

  saveAttendanceForDate(dateStr, recordsMap) {
    const all = this.getAttendances();
    all[dateStr] = {
      records: recordsMap,
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(all));
      return true;
    } catch (e) {
      console.error('Erro ao salvar attendance:', e);
      return false;
    }
  },

  // FINANCEIRO / MENSALIDADES
  // Estrutura: { [monthKey]: { [athleteId]: { paid: boolean, paidAt?: string, amount: number } } }
  // Ex: monthKey = '2026-10'
  getFinances() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_FINANCES);
      if (!data) {
        // Inicializa pagamentos para o mês corrente para teste
        const defaultFin = this.generateInitialFinances();
        this.saveFinances(defaultFin);
        return defaultFin;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler finances:', e);
      return {};
    }
  },

  saveFinances(finances) {
    try {
      localStorage.setItem(STORAGE_KEY_FINANCES, JSON.stringify(finances));
    } catch (e) {
      console.error('Erro ao salvar finances:', e);
    }
  },

  generateInitialFinances() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const athletes = this.getAthletes();
    const monthData = {};
    athletes.forEach((ath, idx) => {
      // 70% pagos, 30% pendentes para teste
      const isPaid = idx % 3 !== 0;
      monthData[ath.id] = {
        paid: isPaid,
        amount: ath.monthlyFee || 150,
        paidAt: isPaid ? `${currentMonth}-05` : null
      };
    });
    return { [currentMonth]: monthData };
  },

  getFinancesForMonth(monthKey) {
    const finances = this.getFinances();
    return finances[monthKey] || {};
  },

  togglePaymentStatus(monthKey, athleteId, amount) {
    const finances = this.getFinances();
    if (!finances[monthKey]) {
      finances[monthKey] = {};
    }
    const current = finances[monthKey][athleteId];
    const newStatus = !(current && current.paid);
    finances[monthKey][athleteId] = {
      paid: newStatus,
      amount: amount || 150,
      paidAt: newStatus ? new Date().toISOString().split('T')[0] : null
    };
    this.saveFinances(finances);
    return newStatus;
  },

  // PERFIL DO TREINADOR
  getProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROFILE);
      let profile = data ? JSON.parse(data) : INITIAL_PROFILE;
      let changed = false;
      if (profile.email !== 'voleiacademyolympic@gmail.com' || profile.phone !== '77981419995') {
        profile.email = 'voleiacademyolympic@gmail.com';
        profile.phone = '77981419995';
        changed = true;
      }
      if (profile.academy !== 'VOA Academy') {
        profile.academy = 'VOA Academy';
        changed = true;
      }
      if (changed) {
        this.saveProfile(profile);
      }
      return profile;
    } catch (e) {
      return INITIAL_PROFILE;
    }
  },

  saveProfile(profile) {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Erro ao salvar profile:', e);
    }
  },

  // BACKUP E RESTAURAÇÃO
  exportAllDataJSON() {
    const exportObj = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      athletes: this.getAthletes(),
      attendances: this.getAttendances(),
      finances: this.getFinances(),
      profile: this.getProfile()
    };
    return JSON.stringify(exportObj, null, 2);
  },

  importAllDataJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.athletes && Array.isArray(data.athletes)) {
        this.saveAthletes(data.athletes);
      }
      if (data.attendances) {
        localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(data.attendances));
      }
      if (data.finances) {
        this.saveFinances(data.finances);
      }
      if (data.profile) {
        this.saveProfile(data.profile);
      }
      return true;
    } catch (e) {
      console.error('Erro ao importar JSON:', e);
      return false;
    }
  },

  resetAllData() {
    localStorage.removeItem(STORAGE_KEY_ATHLETES);
    localStorage.removeItem(STORAGE_KEY_ATTENDANCE);
    localStorage.removeItem(STORAGE_KEY_FINANCES);
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    this.saveAthletes(INITIAL_ATHLETES);
    this.saveFinances(this.generateInitialFinances());
    this.saveProfile(INITIAL_PROFILE);
  }
};
