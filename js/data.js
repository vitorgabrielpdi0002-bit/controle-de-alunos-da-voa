/**
 * VOA Sports - Sistema de Gestão de Atletas, Frequência e Mensalidades
 * Módulo de Dados e Armazenamento (LocalStorage)
 */

export const CATEGORIES = [
  { id: 'sub11_m', name: 'Sub-11 Masculino', code: 'Sub-11 M', minAge: 7, maxAge: 11, gender: 'M', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  { id: 'sub11_f', name: 'Sub-11 Feminino', code: 'Sub-11 F', minAge: 7, maxAge: 11, gender: 'F', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  { id: 'sub13_m', name: 'Sub-13 Masculino', code: 'Sub-13 M', minAge: 12, maxAge: 13, gender: 'M', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  { id: 'sub13_f', name: 'Sub-13 Feminino', code: 'Sub-13 F', minAge: 12, maxAge: 13, gender: 'F', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  { id: 'sub16_m', name: 'Sub-16 Masculino', code: 'Sub-16 M', minAge: 14, maxAge: 16, gender: 'M', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'sub16_f', name: 'Sub-16 Feminino', code: 'Sub-16 F', minAge: 14, maxAge: 16, gender: 'F', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { id: 'sub18_m', name: 'Sub-18 Masculino', code: 'Sub-18 M', minAge: 17, maxAge: 18, gender: 'M', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  { id: 'sub18_f', name: 'Sub-18 Feminino', code: 'Sub-18 F', minAge: 17, maxAge: 18, gender: 'F', color: '#d946ef', bg: 'rgba(217, 70, 239, 0.15)' },
];

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || {
    id: 'unknown',
    name: 'Geral',
    code: 'Geral',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)'
  };
}

export function calculateAge(birthDateString) {
  if (!birthDateString) return null;
  const birth = new Date(birthDateString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function suggestCategory(birthDateString, gender = 'M') {
  const age = calculateAge(birthDateString);
  if (age === null) return 'sub13_m';

  if (age <= 11) return gender === 'F' ? 'sub11_f' : 'sub11_m';
  if (age <= 13) return gender === 'F' ? 'sub13_f' : 'sub13_m';
  if (age <= 16) return gender === 'F' ? 'sub16_f' : 'sub16_m';
  return gender === 'F' ? 'sub18_f' : 'sub18_m';
}

const STORAGE_KEY_ATHLETES = 'voa_athletes_v1';
const STORAGE_KEY_TRAININGS = 'voa_trainings_v1';
const STORAGE_KEY_PAYMENTS = 'voa_payments_v1';
const STORAGE_KEY_CONFIG = 'voa_config_v1';

// Initial Sample Data for rich out-of-the-box experience
export const INITIAL_ATHLETES = [
  // Sub-11 Masculino
  {
    id: 'ath-1',
    name: 'Lucas Gabriel Silveira',
    nickname: 'Luquinhas',
    birthDate: '2015-04-12',
    gender: 'M',
    categoryId: 'sub11_m',
    guardianName: 'Marcos Silveira (Pai)',
    guardianPhone: '11987654321',
    athletePhone: '',
    monthlyFee: 130,
    dueDay: 10,
    status: 'ativo',
    position: 'Meio-campo / Armador',
    medicalNotes: 'Nenhuma restrição',
    createdAt: '2026-02-10'
  },
  {
    id: 'ath-2',
    name: 'Enzo Rodrigues Alves',
    nickname: 'Enzo',
    birthDate: '2016-08-22',
    gender: 'M',
    categoryId: 'sub11_m',
    guardianName: 'Fernanda Alves (Mãe)',
    guardianPhone: '11981112233',
    athletePhone: '',
    monthlyFee: 130,
    dueDay: 5,
    status: 'ativo',
    position: 'Atacante',
    medicalNotes: 'Usa bombinha para asma preventiva',
    createdAt: '2026-03-01'
  },
  // Sub-11 Feminino
  {
    id: 'ath-3',
    name: 'Sofia Helena Martins',
    nickname: 'Sofi',
    birthDate: '2015-11-05',
    gender: 'F',
    categoryId: 'sub11_f',
    guardianName: 'Camila Martins (Mãe)',
    guardianPhone: '11972345678',
    athletePhone: '',
    monthlyFee: 130,
    dueDay: 10,
    status: 'ativo',
    position: 'Ala Esquerda',
    medicalNotes: 'Alérgica a frutos do mar',
    createdAt: '2026-02-15'
  },
  {
    id: 'ath-4',
    name: 'Lara Beatriz Santos',
    nickname: 'Larinha',
    birthDate: '2016-01-30',
    gender: 'F',
    categoryId: 'sub11_f',
    guardianName: 'Renato Santos (Pai)',
    guardianPhone: '11993456789',
    athletePhone: '',
    monthlyFee: 130,
    dueDay: 10,
    status: 'ativo',
    position: 'Goleira',
    medicalNotes: '',
    createdAt: '2026-03-12'
  },
  // Sub-13 Masculino
  {
    id: 'ath-5',
    name: 'Matheus Felipe Costa',
    nickname: 'Theus',
    birthDate: '2013-05-18',
    gender: 'M',
    categoryId: 'sub13_m',
    guardianName: 'Juliana Costa (Mãe)',
    guardianPhone: '11974561234',
    athletePhone: '11974561235',
    monthlyFee: 140,
    dueDay: 10,
    status: 'ativo',
    position: 'Zagueiro Central',
    medicalNotes: '',
    createdAt: '2026-01-15'
  },
  {
    id: 'ath-6',
    name: 'Davi Lucca Ribeiro',
    nickname: 'Davi',
    birthDate: '2014-02-14',
    gender: 'M',
    categoryId: 'sub13_m',
    guardianName: 'Paulo Ribeiro (Pai)',
    guardianPhone: '11985672345',
    athletePhone: '',
    monthlyFee: 140,
    dueDay: 5,
    status: 'ativo',
    position: 'Volante',
    medicalNotes: '',
    createdAt: '2026-02-01'
  },
  // Sub-13 Feminino
  {
    id: 'ath-7',
    name: 'Isabella Moreira Lima',
    nickname: 'Bella',
    birthDate: '2013-09-09',
    gender: 'F',
    categoryId: 'sub13_f',
    guardianName: 'Patricia Moreira (Mãe)',
    guardianPhone: '11988776655',
    athletePhone: '11988776656',
    monthlyFee: 140,
    dueDay: 10,
    status: 'ativo',
    position: 'Meia Ofensiva',
    medicalNotes: '',
    createdAt: '2026-01-20'
  },
  {
    id: 'ath-8',
    name: 'Manuela Nogueira Cruz',
    nickname: 'Manu',
    birthDate: '2014-07-25',
    gender: 'F',
    categoryId: 'sub13_f',
    guardianName: 'Eduardo Cruz (Pai)',
    guardianPhone: '11991234567',
    athletePhone: '',
    monthlyFee: 0,
    dueDay: 10,
    status: 'ativo',
    position: 'Pivô / Centroavante',
    medicalNotes: 'Atleta Bolsista de Alto Rendimento',
    createdAt: '2026-02-05'
  },
  // Sub-16 Masculino
  {
    id: 'ath-9',
    name: 'Gabriel Henrique Duarte',
    nickname: 'Biel',
    birthDate: '2010-03-14',
    gender: 'M',
    categoryId: 'sub16_m',
    guardianName: 'Marcelo Duarte (Pai)',
    guardianPhone: '11976549876',
    athletePhone: '11976549877',
    monthlyFee: 150,
    dueDay: 10,
    status: 'ativo',
    position: 'Extremo Direito',
    medicalNotes: '',
    createdAt: '2025-10-10'
  },
  {
    id: 'ath-10',
    name: 'Pedro Arthur Mendes',
    nickname: 'Pedrão',
    birthDate: '2011-06-30',
    gender: 'M',
    categoryId: 'sub16_m',
    guardianName: 'Aline Mendes (Mãe)',
    guardianPhone: '11984321098',
    athletePhone: '11984321099',
    monthlyFee: 150,
    dueDay: 5,
    status: 'ativo',
    position: 'Goleiro Titular',
    medicalNotes: '',
    createdAt: '2025-11-02'
  },
  // Sub-16 Feminino
  {
    id: 'ath-11',
    name: 'Julia Cristina Barbosa',
    nickname: 'Juju',
    birthDate: '2010-12-19',
    gender: 'F',
    categoryId: 'sub16_f',
    guardianName: 'Cristiane Barbosa (Mãe)',
    guardianPhone: '11998761234',
    athletePhone: '11998761235',
    monthlyFee: 150,
    dueDay: 10,
    status: 'ativo',
    position: 'Armadora Central',
    medicalNotes: '',
    createdAt: '2025-09-18'
  },
  {
    id: 'ath-12',
    name: 'Beatriz Vasconcelos',
    nickname: 'Bia',
    birthDate: '2011-04-08',
    gender: 'F',
    categoryId: 'sub16_f',
    guardianName: 'Jorge Vasconcelos (Pai)',
    guardianPhone: '11973216549',
    athletePhone: '',
    monthlyFee: 150,
    dueDay: 10,
    status: 'ativo',
    position: 'Lateral Defensiva',
    medicalNotes: 'Recuperada de entorse no tornozelo',
    createdAt: '2025-10-25'
  },
  // Sub-18 Masculino
  {
    id: 'ath-13',
    name: 'Felipe Augusto Toledo',
    nickname: 'Toledo',
    birthDate: '2008-07-11',
    gender: 'M',
    categoryId: 'sub18_m',
    guardianName: 'Ricardo Toledo (Pai)',
    guardianPhone: '11987654320',
    athletePhone: '11987654322',
    monthlyFee: 160,
    dueDay: 10,
    status: 'ativo',
    position: 'Capitão / Meio-Campo',
    medicalNotes: '',
    createdAt: '2025-05-10'
  },
  {
    id: 'ath-14',
    name: 'Nicolas Santana Prado',
    nickname: 'Nico',
    birthDate: '2009-01-20',
    gender: 'M',
    categoryId: 'sub18_m',
    guardianName: 'Silvia Santana (Mãe)',
    guardianPhone: '11981239876',
    athletePhone: '11981239877',
    monthlyFee: 160,
    dueDay: 5,
    status: 'ativo',
    position: 'Centroavante',
    medicalNotes: '',
    createdAt: '2025-06-15'
  },
  // Sub-18 Feminino
  {
    id: 'ath-15',
    name: 'Camila Vitória Ferreira',
    nickname: 'Mila',
    birthDate: '2008-10-04',
    gender: 'F',
    categoryId: 'sub18_f',
    guardianName: 'Valéria Ferreira (Mãe)',
    guardianPhone: '11996541230',
    athletePhone: '11996541231',
    monthlyFee: 160,
    dueDay: 10,
    status: 'ativo',
    position: 'Extrema / Ponta',
    medicalNotes: '',
    createdAt: '2025-07-01'
  },
  {
    id: 'ath-16',
    name: 'Giovanna Rocha Dias',
    nickname: 'Gio',
    birthDate: '2009-05-15',
    gender: 'F',
    categoryId: 'sub18_f',
    guardianName: 'Marcos Dias (Pai)',
    guardianPhone: '11983457890',
    athletePhone: '11983457891',
    monthlyFee: 160,
    dueDay: 10,
    status: 'ativo',
    position: 'Goleira',
    medicalNotes: '',
    createdAt: '2025-08-12'
  }
];

export const INITIAL_TRAININGS = [
  {
    id: 'tr-1',
    categoryId: 'sub13_m',
    date: '2026-10-15',
    startTime: '15:00',
    endTime: '16:30',
    location: 'Quadra Principal VOA',
    coach: 'Prof. Carlos Eduardo',
    focus: 'Fundamentos de Passe e Transição Rápida',
    attendance: [
      { athleteId: 'ath-5', status: 'presente', note: '' },
      { athleteId: 'ath-6', status: 'presente', note: 'Excelente intensidade' }
    ],
    status: 'concluido'
  },
  {
    id: 'tr-2',
    categoryId: 'sub16_f',
    date: '2026-10-15',
    startTime: '16:45',
    endTime: '18:15',
    location: 'Quadra 2 / Arena VOA',
    coach: 'Profa. Juliana Rossi',
    focus: 'Organização Defensiva e Bloqueio',
    attendance: [
      { athleteId: 'ath-11', status: 'presente', note: '' },
      { athleteId: 'ath-12', status: 'ausente', note: 'Avisou compromisso escolar' }
    ],
    status: 'concluido'
  },
  {
    id: 'tr-3',
    categoryId: 'sub11_m',
    date: '2026-10-16',
    startTime: '09:00',
    endTime: '10:30',
    location: 'Quadra Principal VOA',
    coach: 'Prof. Carlos Eduardo',
    focus: 'Domínio de Bola e Jogos Lúdicos',
    attendance: [],
    status: 'agendado'
  },
  {
    id: 'tr-4',
    categoryId: 'sub11_f',
    date: '2026-10-16',
    startTime: '10:30',
    endTime: '12:00',
    location: 'Quadra Principal VOA',
    coach: 'Profa. Juliana Rossi',
    focus: 'Coordenação Motora e Finalização',
    attendance: [],
    status: 'agendado'
  },
  {
    id: 'tr-5',
    categoryId: 'sub18_m',
    date: '2026-10-16',
    startTime: '17:00',
    endTime: '19:00',
    location: 'Campo de Treinamento VOA',
    coach: 'Prof. Roberto Martins',
    focus: 'Tática Coletiva e Bola Parada',
    attendance: [],
    status: 'agendado'
  },
  {
    id: 'tr-6',
    categoryId: 'sub18_f',
    date: '2026-10-17',
    startTime: '09:30',
    endTime: '11:00',
    location: 'Quadra Principal VOA',
    coach: 'Profa. Juliana Rossi',
    focus: 'Simulação de Jogo e Velocidade',
    attendance: [],
    status: 'agendado'
  }
];

export const INITIAL_PAYMENTS = [
  // Mês de Outubro de 2026 (2026-10)
  {
    id: 'pay-1',
    athleteId: 'ath-1',
    monthRef: '2026-10',
    amount: 130,
    dueDate: '2026-10-10',
    status: 'pago',
    paidDate: '2026-10-09',
    paymentMethod: 'Pix',
    receiptCode: 'VOA-202610-001',
    notes: 'Pago adiantado via Pix'
  },
  {
    id: 'pay-2',
    athleteId: 'ath-2',
    monthRef: '2026-10',
    amount: 130,
    dueDate: '2026-10-05',
    status: 'pago',
    paidDate: '2026-10-05',
    paymentMethod: 'Cartão de Débito',
    receiptCode: 'VOA-202610-002',
    notes: 'Pago na recepção'
  },
  {
    id: 'pay-3',
    athleteId: 'ath-3',
    monthRef: '2026-10',
    amount: 130,
    dueDate: '2026-10-10',
    status: 'atrasado',
    paidDate: null,
    paymentMethod: null,
    receiptCode: null,
    notes: 'Vencido há 5 dias - Enviar lembrete'
  },
  {
    id: 'pay-4',
    athleteId: 'ath-4',
    monthRef: '2026-10',
    amount: 130,
    dueDate: '2026-10-10',
    status: 'atrasado',
    paidDate: null,
    paymentMethod: null,
    receiptCode: null,
    notes: ''
  },
  {
    id: 'pay-5',
    athleteId: 'ath-5',
    monthRef: '2026-10',
    amount: 140,
    dueDate: '2026-10-10',
    status: 'pago',
    paidDate: '2026-10-10',
    paymentMethod: 'Pix',
    receiptCode: 'VOA-202610-005',
    notes: ''
  },
  {
    id: 'pay-6',
    athleteId: 'ath-6',
    monthRef: '2026-10',
    amount: 140,
    dueDate: '2026-10-05',
    status: 'pago',
    paidDate: '2026-10-04',
    paymentMethod: 'Dinheiro',
    receiptCode: 'VOA-202610-006',
    notes: ''
  },
  {
    id: 'pay-7',
    athleteId: 'ath-7',
    monthRef: '2026-10',
    amount: 140,
    dueDate: '2026-10-10',
    status: 'atrasado',
    paidDate: null,
    paymentMethod: null,
    receiptCode: null,
    notes: ''
  },
  {
    id: 'pay-8',
    athleteId: 'ath-8',
    monthRef: '2026-10',
    amount: 0,
    dueDate: '2026-10-10',
    status: 'isento',
    paidDate: '2026-10-01',
    paymentMethod: 'Bolsa',
    receiptCode: 'VOA-BOLSA-008',
    notes: 'Atleta Bolsista Integral'
  },
  {
    id: 'pay-9',
    athleteId: 'ath-9',
    monthRef: '2026-10',
    amount: 150,
    dueDate: '2026-10-10',
    status: 'pago',
    paidDate: '2026-10-08',
    paymentMethod: 'Pix',
    receiptCode: 'VOA-202610-009',
    notes: ''
  },
  {
    id: 'pay-10',
    athleteId: 'ath-10',
    monthRef: '2026-10',
    amount: 150,
    dueDate: '2026-10-05',
    status: 'atrasado',
    paidDate: null,
    paymentMethod: null,
    receiptCode: null,
    notes: ''
  },
  {
    id: 'pay-11',
    athleteId: 'ath-11',
    monthRef: '2026-10',
    amount: 150,
    dueDate: '2026-10-10',
    status: 'pago',
    paidDate: '2026-10-10',
    paymentMethod: 'Cartão de Crédito',
    receiptCode: 'VOA-202610-011',
    notes: ''
  },
  {
    id: 'pay-12',
    athleteId: 'ath-12',
    monthRef: '2026-10',
    amount: 150,
    dueDate: '2026-10-10',
    status: 'pago',
    paidDate: '2026-10-09',
    paymentMethod: 'Pix',
    receiptCode: 'VOA-202610-012',
    notes: ''
  },
  {
    id: 'pay-13',
    athleteId: 'ath-13',
    monthRef: '2026-10',
    amount: 160,
    dueDate: '2026-10-10',
    status: 'pago',
    paidDate: '2026-10-07',
    paymentMethod: 'Pix',
    receiptCode: 'VOA-202610-013',
    notes: ''
  },
  {
    id: 'pay-14',
    athleteId: 'ath-14',
    monthRef: '2026-10',
    amount: 160,
    dueDate: '2026-10-05',
    status: 'atrasado',
    paidDate: null,
    paymentMethod: null,
    receiptCode: null,
    notes: 'Pai informou que pagará no dia 20'
  },
  {
    id: 'pay-15',
    athleteId: 'ath-15',
    monthRef: '2026-10',
    amount: 160,
    dueDate: '2026-10-10',
    status: 'pago',
    paidDate: '2026-10-10',
    paymentMethod: 'Pix',
    receiptCode: 'VOA-202610-015',
    notes: ''
  },
  {
    id: 'pay-16',
    athleteId: 'ath-16',
    monthRef: '2026-10',
    amount: 160,
    dueDate: '2026-10-10',
    status: 'pago',
    paidDate: '2026-10-10',
    paymentMethod: 'Transferência Bancária',
    receiptCode: 'VOA-202610-016',
    notes: ''
  }
];

export const INITIAL_CONFIG = {
  academyName: 'VOA Sports Academy',
  cnpj: '38.452.891/0001-44',
  pixKey: 'pix@voasports.com.br',
  pixType: 'Email',
  phone: '(11) 98765-4321',
  address: 'Av. dos Esportes, 1200 - São Paulo, SP',
  defaultFee: 140,
  defaultDueDay: 10,
  theme: 'dark'
};

// Data Store Class
class DataStore {
  constructor() {
    this.athletes = this.load(STORAGE_KEY_ATHLETES, INITIAL_ATHLETES);
    this.trainings = this.load(STORAGE_KEY_TRAININGS, INITIAL_TRAININGS);
    this.payments = this.load(STORAGE_KEY_PAYMENTS, INITIAL_PAYMENTS);
    this.config = this.load(STORAGE_KEY_CONFIG, INITIAL_CONFIG);
  }

  load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn(`Erro ao carregar do localStorage (${key}):`, e);
      return fallback;
    }
  }

  saveAthletes() {
    localStorage.setItem(STORAGE_KEY_ATHLETES, JSON.stringify(this.athletes));
  }

  saveTrainings() {
    localStorage.setItem(STORAGE_KEY_TRAININGS, JSON.stringify(this.trainings));
  }

  savePayments() {
    localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(this.payments));
  }

  saveConfig() {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
  }

  resetAllData() {
    this.athletes = JSON.parse(JSON.stringify(INITIAL_ATHLETES));
    this.trainings = JSON.parse(JSON.stringify(INITIAL_TRAININGS));
    this.payments = JSON.parse(JSON.stringify(INITIAL_PAYMENTS));
    this.config = JSON.parse(JSON.stringify(INITIAL_CONFIG));
    this.saveAthletes();
    this.saveTrainings();
    this.savePayments();
    this.saveConfig();
  }

  // Athletes methods
  getAthletes() {
    return this.athletes;
  }

  getAthleteById(id) {
    return this.athletes.find(a => a.id === id);
  }

  addAthlete(athleteData) {
    const id = 'ath-' + Date.now();
    const newAthlete = {
      ...athleteData,
      id,
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.athletes.unshift(newAthlete);
    this.saveAthletes();

    // Generate current month fee record for this athlete
    const currentMonth = new Date().toISOString().slice(0, 7);
    this.ensurePaymentRecord(newAthlete, currentMonth);

    return newAthlete;
  }

  updateAthlete(id, athleteData) {
    const index = this.athletes.findIndex(a => a.id === id);
    if (index !== -1) {
      this.athletes[index] = { ...this.athletes[index], ...athleteData };
      this.saveAthletes();
      return this.athletes[index];
    }
    return null;
  }

  deleteAthlete(id) {
    this.athletes = this.athletes.filter(a => a.id !== id);
    this.saveAthletes();
    // Also remove from trainings attendance if needed
  }

  // Trainings methods
  getTrainings() {
    return this.trainings.sort((a, b) => (b.date + ' ' + b.startTime).localeCompare(a.date + ' ' + a.startTime));
  }

  getTrainingById(id) {
    return this.trainings.find(t => t.id === id);
  }

  addTraining(trainingData) {
    const id = 'tr-' + Date.now();
    const newTraining = {
      ...trainingData,
      id,
      attendance: trainingData.attendance || [],
      status: trainingData.status || 'agendado'
    };
    this.trainings.unshift(newTraining);
    this.saveTrainings();
    return newTraining;
  }

  updateTraining(id, trainingData) {
    const index = this.trainings.findIndex(t => t.id === id);
    if (index !== -1) {
      this.trainings[index] = { ...this.trainings[index], ...trainingData };
      this.saveTrainings();
      return this.trainings[index];
    }
    return null;
  }

  deleteTraining(id) {
    this.trainings = this.trainings.filter(t => t.id !== id);
    this.saveTrainings();
  }

  saveAttendance(trainingId, attendanceArray) {
    const training = this.getTrainingById(trainingId);
    if (training) {
      training.attendance = attendanceArray;
      training.status = 'concluido';
      this.saveTrainings();
      return training;
    }
    return null;
  }

  // Payments methods
  getPayments(monthRef = null) {
    let list = this.payments;
    if (monthRef) {
      list = list.filter(p => p.monthRef === monthRef);
    }
    // Update dynamically late status if not paid and passed dueDate
    const today = new Date().toISOString().split('T')[0];
    list.forEach(p => {
      if (p.status !== 'pago' && p.status !== 'isento') {
        if (p.dueDate && p.dueDate < today) {
          p.status = 'atrasado';
        } else {
          p.status = 'pendente';
        }
      }
    });
    return list;
  }

  getPaymentById(id) {
    return this.payments.find(p => p.id === id);
  }

  ensurePaymentRecord(athlete, monthRef) {
    const existing = this.payments.find(p => p.athleteId === athlete.id && p.monthRef === monthRef);
    if (!existing) {
      const year = monthRef.split('-')[0];
      const month = monthRef.split('-')[1];
      const dueDay = String(athlete.dueDay || 10).padStart(2, '0');
      const dueDate = `${year}-${month}-${dueDay}`;
      const isFree = Number(athlete.monthlyFee) === 0;

      const newPayment = {
        id: 'pay-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        athleteId: athlete.id,
        monthRef,
        amount: Number(athlete.monthlyFee) || 0,
        dueDate,
        status: isFree ? 'isento' : (new Date().toISOString().split('T')[0] > dueDate ? 'atrasado' : 'pendente'),
        paidDate: isFree ? `${year}-${month}-01` : null,
        paymentMethod: isFree ? 'Bolsa' : null,
        receiptCode: isFree ? `VOA-BOLSA-${athlete.id.slice(-4)}` : null,
        notes: isFree ? 'Bolsista' : ''
      };
      this.payments.push(newPayment);
      this.savePayments();
      return newPayment;
    }
    return existing;
  }

  syncPaymentsForMonth(monthRef) {
    this.athletes.forEach(athlete => {
      if (athlete.status === 'ativo') {
        this.ensurePaymentRecord(athlete, monthRef);
      }
    });
  }

  recordPayment(paymentId, { paidDate, paymentMethod, notes, customAmount }) {
    const payment = this.getPaymentById(paymentId);
    if (payment) {
      payment.status = 'pago';
      payment.paidDate = paidDate || new Date().toISOString().split('T')[0];
      payment.paymentMethod = paymentMethod || 'Pix';
      payment.notes = notes || '';
      if (customAmount !== undefined && customAmount !== null) {
        payment.amount = Number(customAmount);
      }
      if (!payment.receiptCode) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        payment.receiptCode = `VOA-${payment.monthRef.replace('-', '')}-${rand}`;
      }
      this.savePayments();
      return payment;
    }
    return null;
  }

  cancelPayment(paymentId) {
    const payment = this.getPaymentById(paymentId);
    if (payment) {
      const today = new Date().toISOString().split('T')[0];
      payment.status = payment.dueDate < today ? 'atrasado' : 'pendente';
      payment.paidDate = null;
      payment.paymentMethod = null;
      this.savePayments();
      return payment;
    }
    return null;
  }

  // Backup and Export
  exportAllDataJSON() {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      config: this.config,
      athletes: this.athletes,
      trainings: this.trainings,
      payments: this.payments
    }, null, 2);
  }

  importDataJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.athletes) && Array.isArray(data.trainings)) {
        this.athletes = data.athletes;
        this.trainings = data.trainings;
        this.payments = data.payments || [];
        if (data.config) this.config = { ...this.config, ...data.config };
        this.saveAthletes();
        this.saveTrainings();
        this.savePayments();
        this.saveConfig();
        return true;
      }
    } catch (e) {
      console.error('Falha ao importar JSON:', e);
    }
    return false;
  }
}

export const store = new DataStore();
