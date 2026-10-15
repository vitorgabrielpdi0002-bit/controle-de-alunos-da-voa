# 🦅 VOA Sports - Sistema de Gestão de Atletas, Frequência e Mensalidades

Sistema completo, moderno e intuitivo desenvolvido para a **VOA Sports**, oferecendo controle total de atletas das categorias de base e rendimento, agenda e chamadas de treino em tempo real, além de gestão financeira com baixa de mensalidades, recibos oficiais e integração com WhatsApp.

---

## ⚡ Organização Oficial das Turmas e Treinos

### 1. 👥 Estrutura das 2 Turmas Principais
- 👶 **Turma Pequenos (6 a 14 anos):**
  - **Dias de Treino:** **Terça-feira, Quinta-feira e Sábado**
  - Foco em iniciação esportiva, coordenação motora, fundamentos e jogos lúdicos.
- 🏆 **Turma Grandes (14 anos acima):**
  - **Dias de Treino:** **Segunda-feira, Quinta-feira e Sábado**
  - Foco em tática coletiva, condicionamento físico, força e alta intensidade.
- ⚡ **Atletas de Exceção ("Jogam no Grande"):**
  - Atletas que têm idade dos Pequenos (ex: Sub-13 destaque), mas que **treinam e jogam também na Turma dos Grandes**.
  - O sistema identifica esses atletas com badge especial `⚡ Joga no Grande (Exceção)`.
  - Na chamada de presença do treino dos Grandes, os atletas de exceção **aparecem automaticamente na lista de presença**, permitindo registrar sua frequência!

### 2. 🏅 Categorias de Base e Competição
Para efeitos de federação, torneios e fichas cadastrais, os atletas continuam classificados por faixas etárias:
- 🔵 **Sub-11 Masculino** e 🟣 **Sub-11 Feminino** (6 a 11 anos • Turma Pequenos)
- 🔵 **Sub-13 Masculino** e 🟣 **Sub-13 Feminino** (12 e 13 anos • Turma Pequenos / Exceções)
- 🟠 **Sub-16 Masculino** e 🟢 **Sub-16 Feminino** (14 a 16 anos • Turma Grandes)
- 🔴 **Sub-18 Masculino** e 🟣 **Sub-18 Feminino** (17 e 18 anos • Turma Grandes)

---

## 📅 Agenda de Treinos & Chamada de Presença
- **Gerar Grade Semanal Automática:** Botão com 1 clique para gerar os treinos oficiais da semana:
  - **Segunda-feira:** Turma Grandes (17:30 - 19:15)
  - **Terça-feira:** Turma Pequenos (16:00 - 17:30)
  - **Quinta-feira:** Turma Pequenos (15:30 - 17:00) e Turma Grandes (17:15 - 19:00)
  - **Sábado:** Turma Pequenos (08:30 - 10:00) e Turma Grandes (10:15 - 12:00)
- **Chamada Interativa na Quadra:**
  - Botão **"Marcar Todos como Presentes"** para agilidade do treinador.
  - Seleção rápida de **Presente**, **Falta** e **Falta Justificada**.
  - Contador ao vivo e taxa de presença.

---

### 3. 💰 Controle Financeiro & Mensalidades
- **Acompanhamento de Status:**
  - 🟢 **PAGO:** Identifica data do pagamento, método (Pix, Cartão, Dinheiro, TED) e recibo.
  - 🟡 **PENDENTE:** Mensalidade do mês dentro do prazo de vencimento.
  - 🔴 **EM ATRASO:** Identificação visual imediata de mensalidades vencidas não pagas.
  - 🟣 **ISENTO / BOLSISTA:** Tratamento específico para atletas com bolsa integral.
- **Indicadores Financeiros (KPIs):**
  - Total Arrecadado no Mês
  - Total Pendente a Vencer
  - Total em Atraso
  - Taxa de Adimplência (%)
- **Ações Rápidas:**
  - **Dar Baixa / Registrar Pagamento:** Registra o valor, método de pagamento e gera código de recibo.
  - **Emitir Recibo Oficial:** Recibo pronto com logotipo da VOA Sports, CNPJ, dados do atleta, valor e assinatura (formatado para impressão ou salvar em PDF).
  - **Lembrar no WhatsApp:** Mensagem pré-formatada cordial informando o valor, data de vencimento e chave Pix para os pais.

---

### 4. 📊 Dashboard Executivo & Relatórios
- Painel com resumo dos treinos do dia, alertas urgentes de mensalidades vencidas e distribuição visual dos atletas por categoria.
- **Exportação CSV:** Exporte listas de atletas e relatórios financeiros para abrir no Excel ou Google Planilhas.
- **Backup & Restauração JSON:** Faça download de cópia de segurança completa ou restaure em qualquer computador.
- **Suporte a Tema Escuro e Claro:** Alternância rápida com design esportivo de alto padrão.

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js instalado (v18+)

### Instalação e Execução
```bash
# 1. Instalar as dependências (caso não tenha instalado)
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev
```

O sistema estará acessível em: **`http://localhost:5173/`**

### Gerar Pacote de Produção
```bash
npm run build
```

---

## 🛠️ Tecnologias Utilizadas
- **HTML5 Semântico**
- **CSS3 Puro** (Design System com variáveis, Glassmorphism, temas Dark/Light e estilização `@media print`)
- **JavaScript Moderno (ES Modules)**
- **Vite** (Dev server ultrarrápido)
- **LocalStorage API** (Persistência dos dados sem necessidade de banco de dados externo)
