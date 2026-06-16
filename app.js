// app.js
const state = {
  authState: 'login',   // 'login' | 'signup' | 'pre-cadastro' | 'kyc' | 'authenticated'
  mode: 'BR',           // 'BR' | 'US'
  screen: 'home',
  kycStep: 1,           // 1-4 form steps, 5 = success
  user: { name: 'Érico' },
};

function setState(patch) {
  Object.assign(state, patch);
  render();
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = buildApp();
  attachEvents();
  if (window.lucide) lucide.createIcons();
}

function buildApp() {
  if (state.authState === 'login')         return buildLogin();
  if (state.authState === 'signup')        return buildSignup();
  if (state.authState === 'kyc')           return buildKycForm();
  if (state.authState === 'pre-cadastro')  return buildShell(buildPreCadastro());
  return buildShell(buildScreen());
}

function buildScreen() {
  switch (state.screen) {
    case 'home':         return state.mode === 'BR' ? buildHomeBR() : buildHomeUS();
    case 'cambio':       return buildCambio();
    case 'posicao':      return buildPosicao();
    case 'trading':      return buildTrading();
    case 'atendimento':  return buildAtendimento();
    case 'tax-center':   return buildTaxCenter();
    default:             return buildHomeBR();
  }
}

function attachEvents() {
  document.querySelectorAll('[data-action]').forEach(el => {
    el.removeEventListener('click', handleAction);
    el.addEventListener('click', handleAction);
  });
}

function handleAction(e) {
  e.preventDefault();
  const action = e.currentTarget.dataset.action;
  const value  = e.currentTarget.dataset.value;
  switch (action) {
    case 'login':         setState({ authState: 'pre-cadastro' }); break;
    case 'signup':        setState({ authState: 'signup' }); break;
    case 'back-to-login': setState({ authState: 'login' }); break;
    case 'submit-signup': setState({ authState: 'kyc', kycStep: 1 }); break;
    case 'start-kyc':     setState({ authState: 'kyc', kycStep: 1 }); break;
    case 'kyc-next':      setState({ kycStep: Math.min(state.kycStep + 1, 5) }); break;
    case 'kyc-prev':      setState({ kycStep: Math.max(state.kycStep - 1, 1) }); break;
    case 'kyc-submit':    setState({ authState: 'authenticated', screen: 'home', mode: 'BR' }); break;
    case 'continuar':     setState({ authState: 'authenticated', screen: 'home', mode: 'BR' }); break;
    case 'nav':           setState({ screen: value }); break;
    case 'mode':          setState({ mode: value, screen: 'home' }); break;
  }
}

// ── Nav Items ──
const NAV_ITEMS = [
  { id: 'home',        label: 'Home',        icon: 'house',            modes: ['BR','US'] },
  { id: 'cambio',      label: 'Câmbio',      icon: 'arrow-right-left', modes: ['BR']      },
  { id: 'posicao',     label: 'Posição',     icon: 'briefcase',        modes: ['US']      },
  { id: 'trading',     label: 'Trading',     icon: 'trending-up',      modes: ['US']      },
  { id: 'atendimento', label: 'Atendimento', icon: 'headphones',       modes: ['BR','US'] },
  { id: 'tax-center',  label: 'Tax Center',  icon: 'file-text',        modes: ['BR','US'] },
];

// ── Mini SVG flags (no emojis) ──
const FLAG_BR = `<svg width="26" height="18" viewBox="0 0 26 18" xmlns="http://www.w3.org/2000/svg">
  <rect width="26" height="18" fill="#009C3B" rx="3"/>
  <polygon points="13,3 23,9 13,15 3,9" fill="#FFDF00"/>
  <circle cx="13" cy="9" r="4.2" fill="#002776"/>
  <circle cx="13" cy="9" r="1.8" fill="white" opacity="0.2"/>
</svg>`;

const FLAG_US = `<svg width="26" height="18" viewBox="0 0 26 18" xmlns="http://www.w3.org/2000/svg">
  <rect width="26" height="18" fill="#B22234" rx="3"/>
  <rect y="1.38" width="26" height="1.38" fill="white"/>
  <rect y="4.15" width="26" height="1.38" fill="white"/>
  <rect y="6.92" width="26" height="1.38" fill="white"/>
  <rect y="9.69" width="26" height="1.38" fill="white"/>
  <rect y="12.46" width="26" height="1.38" fill="white"/>
  <rect y="15.23" width="26" height="1.38" fill="white"/>
  <rect width="10.4" height="9.69" fill="#3C3B6E" rx="0"/>
</svg>`;

function buildHeader() {
  return `
    <header class="app-header">
      <img src="assets/logo.svg" alt="EPIK" class="app-header__logo" />
      <div class="app-header__right">
        <button class="app-header__notifications">
          <i data-lucide="bell" style="width:16px;height:16px"></i>
        </button>
        <button class="app-header__user">
          <i data-lucide="user" style="width:14px;height:14px"></i>
          ${state.user.name}
        </button>
      </div>
    </header>`;
}

function buildSidebar() {
  const items = NAV_ITEMS
    .filter(item => item.modes.includes(state.mode))
    .map(item => {
      const isActive = state.screen === item.id && state.authState === 'authenticated';
      return `
        <button
          class="sidebar__item${isActive ? ' active' : ''}"
          data-action="nav"
          data-value="${item.id}">
          <i data-lucide="${item.icon}" style="width:15px;height:15px"></i>
          ${item.label}
        </button>`;
    }).join('');
  return `<nav class="sidebar">${items}</nav>`;
}

function buildShell(contentHtml) {
  return `
    <div class="app-shell">
      ${buildHeader()}
      ${buildSidebar()}
      <main class="content-area">${contentHtml}</main>
    </div>
    <div class="chat-widget" title="Atendimento" data-action="nav" data-value="atendimento">
      <i data-lucide="message-circle" style="width:22px;height:22px"></i>
    </div>`;
}

function buildFlagSwitcher() {
  return `
    <div class="flag-switcher">
      <button class="flag-btn ${state.mode === 'BR' ? 'active' : ''}" data-action="mode" data-value="BR" title="Brasil">
        ${FLAG_BR}
      </button>
      <button class="flag-btn ${state.mode === 'US' ? 'active' : ''}" data-action="mode" data-value="US" title="United States">
        ${FLAG_US}
      </button>
    </div>`;
}

// ── Avisos Data ──
const AVISOS = [
  {
    tag: 'EVENTO', tagStyle: 'purple', icon: 'map-pin',
    title: 'Missão NY 2026',
    desc: 'Participe da nossa jornada em Nova York e amplie seus horizontes'
  },
  {
    tag: 'PRODUTO', tagStyle: 'cyan', icon: 'trending-up',
    title: 'Alugue suas ações',
    desc: 'Gere renda extra com aluguel de ações da sua carteira'
  },
  {
    tag: 'OFERTA', tagStyle: 'gold', icon: 'percent',
    title: 'Renda Fixa EPIK',
    desc: 'CDBs e LCIs disponíveis. Invista a partir de R$ 1.000'
  },
  {
    tag: 'SOCIAL', tagStyle: 'green', icon: 'share-2',
    title: 'Siga a EPIK',
    desc: '@epik_invest — novidades e conteúdo exclusivo'
  },
];

function buildAvisosPanel() {
  const cards = AVISOS.map(a => `
    <div class="aviso-card">
      <div class="aviso-card__meta">
        <span class="aviso-card__icon"><i data-lucide="${a.icon}" style="width:11px;height:11px;color:var(--text-dim)"></i></span>
        <span class="aviso-tag aviso-tag--${a.tagStyle}">${a.tag}</span>
      </div>
      <div class="aviso-card__title">${a.title}</div>
      <div class="aviso-card__desc">${a.desc}</div>
    </div>`).join('');

  return `
    <div class="avisos-panel">
      <div class="avisos-panel__header">
        <span class="avisos-panel__header-icon">
          <i data-lucide="bell-dot" style="width:15px;height:15px"></i>
        </span>
        <div>
          <div class="avisos-panel__title">Central de Avisos</div>
          <div class="avisos-panel__subtitle">Novidades e alertas</div>
        </div>
      </div>
      ${cards}
    </div>`;
}

// ── Login ──
function buildLogin() {
  return `
    <div class="login-page">
      <div class="login-card">
        <img src="assets/logo.svg" alt="EPIK" class="login-card__logo" />
        <p class="login-card__title">Acesse sua conta</p>
        <div class="form-fields">
          <div class="form-group">
            <label>E-mail</label>
            <input type="email" placeholder="seu@email.com" />
          </div>
          <div class="form-group">
            <label>Senha</label>
            <input type="password" placeholder="••••••••" />
          </div>
        </div>
        <button class="btn-primary" data-action="login">Entrar</button>
        <p class="login-footer">
          Não tem conta?
          <a href="#" data-action="signup">Criar conta</a>
        </p>
      </div>
    </div>`;
}

// ── Signup ──
function buildSignup() {
  return `
    <div class="login-page">
      <div class="login-card login-card--wide">
        <div class="login-card__back">
          <button class="btn-ghost btn-ghost--sm" data-action="back-to-login">
            <i data-lucide="arrow-left" style="width:13px;height:13px"></i>
            Voltar
          </button>
        </div>
        <img src="assets/logo.svg" alt="EPIK" class="login-card__logo" />
        <p class="login-card__title">Criar sua conta</p>
        <p class="login-card__subtitle">Comece sua jornada de investimentos globais</p>
        <div class="form-fields">
          <div class="form-grid-2">
            <div class="form-group">
              <label>Nome Completo</label>
              <input type="text" placeholder="Seu nome completo" />
            </div>
            <div class="form-group">
              <label>E-mail</label>
              <input type="email" placeholder="seu@email.com" />
            </div>
            <div class="form-group">
              <label>CPF</label>
              <input type="text" placeholder="000.000.000-00" />
            </div>
            <div class="form-group">
              <label>Data de Nascimento</label>
              <input type="date" />
            </div>
            <div class="form-group">
              <label>Senha</label>
              <input type="password" placeholder="Mínimo 8 caracteres" />
            </div>
            <div class="form-group">
              <label>Confirmar Senha</label>
              <input type="password" placeholder="Repita sua senha" />
            </div>
          </div>
          <label class="checkbox-label">
            <input type="checkbox" />
            Aceito os <a href="#">Termos de Uso</a> e a <a href="#">Política de Privacidade</a>
          </label>
        </div>
        <button class="btn-primary" data-action="submit-signup">
          Criar conta
          <i data-lucide="arrow-right" style="width:16px;height:16px"></i>
        </button>
        <p class="login-footer">
          Já tem conta?
          <a href="#" data-action="back-to-login">Entrar</a>
        </p>
      </div>
    </div>`;
}

// ── KYC Form ──
const KYC_STEPS = [
  { label: 'Dados',    icon: 'user'               },
  { label: 'Endereço', icon: 'map-pin'            },
  { label: 'Perfil',   icon: 'sliders-horizontal' },
  { label: 'Docs',     icon: 'file-check'         },
];

const KYC_TITLES    = ['Dados Pessoais', 'Endereço', 'Perfil de Investidor', 'Documentos'];
const KYC_SUBTITLES = [
  'Informações básicas para abertura de conta',
  'Endereço residencial atual',
  'Suitability — personalizamos sua experiência',
  'Validação de identidade e residência',
];

function buildKycStepContent() {
  switch (state.kycStep) {
    case 1: return `
      <div class="form-grid-2">
        <div class="form-group">
          <label>Nome Completo</label>
          <input type="text" placeholder="Seu nome completo" />
        </div>
        <div class="form-group">
          <label>CPF</label>
          <input type="text" placeholder="000.000.000-00" />
        </div>
        <div class="form-group">
          <label>Data de Nascimento</label>
          <input type="date" />
        </div>
        <div class="form-group">
          <label>Telefone</label>
          <input type="tel" placeholder="+55 (11) 90000-0000" />
        </div>
        <div class="form-group">
          <label>Nacionalidade</label>
          <select>
            <option>Brasileiro(a)</option>
            <option>Outro</option>
          </select>
        </div>
        <div class="form-group">
          <label>Estado Civil</label>
          <select>
            <option>Solteiro(a)</option>
            <option>Casado(a)</option>
            <option>Divorciado(a)</option>
          </select>
        </div>
      </div>`;

    case 2: return `
      <div class="form-fields">
        <div class="form-grid-2">
          <div class="form-group">
            <label>CEP</label>
            <input type="text" placeholder="00000-000" />
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select>
              <option>SP</option><option>RJ</option><option>MG</option>
              <option>RS</option><option>PR</option><option>SC</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Rua / Avenida</label>
          <input type="text" placeholder="Av. Paulista" />
        </div>
        <div class="form-grid-3">
          <div class="form-group">
            <label>Número</label>
            <input type="text" placeholder="1000" />
          </div>
          <div class="form-group">
            <label>Complemento</label>
            <input type="text" placeholder="Apto 42" />
          </div>
          <div class="form-group">
            <label>Bairro</label>
            <input type="text" placeholder="Bela Vista" />
          </div>
        </div>
        <div class="form-group">
          <label>Cidade</label>
          <input type="text" placeholder="São Paulo" />
        </div>
      </div>`;

    case 3: return `
      <div>
        <div class="kyc-question">
          <div class="kyc-question__label">Qual é seu objetivo principal de investimento?</div>
          <div class="kyc-options">
            <button class="kyc-option-card">
              <i data-lucide="shield" style="width:20px;height:20px"></i>
              Preservar Capital
            </button>
            <button class="kyc-option-card">
              <i data-lucide="percent" style="width:20px;height:20px"></i>
              Renda Regular
            </button>
            <button class="kyc-option-card selected">
              <i data-lucide="trending-up" style="width:20px;height:20px"></i>
              Crescimento
            </button>
            <button class="kyc-option-card">
              <i data-lucide="zap" style="width:20px;height:20px"></i>
              Alta Rentabilidade
            </button>
          </div>
        </div>
        <div class="kyc-question">
          <div class="kyc-question__label">Qual é sua tolerância ao risco?</div>
          <div class="kyc-options">
            <button class="kyc-option-card">Conservador</button>
            <button class="kyc-option-card selected">Moderado</button>
            <button class="kyc-option-card">Arrojado</button>
            <button class="kyc-option-card">Agressivo</button>
          </div>
        </div>
      </div>`;

    case 4: return `
      <div>
        <p style="font-size:13px;color:var(--text-dim);margin-bottom:20px;line-height:1.6">
          Envie os documentos abaixo para validação. Aceitamos JPG, PNG e PDF (até 10MB por arquivo).
        </p>
        <div class="upload-cards">
          <div class="upload-card">
            <i data-lucide="credit-card" style="width:28px;height:28px"></i>
            <div class="upload-card__name">RG ou CNH</div>
            <span class="upload-card__status">Aguardando</span>
            <span class="upload-card__cta">Enviar</span>
          </div>
          <div class="upload-card">
            <i data-lucide="file-text" style="width:28px;height:28px"></i>
            <div class="upload-card__name">Comprov. Residência</div>
            <span class="upload-card__status">Aguardando</span>
            <span class="upload-card__cta">Enviar</span>
          </div>
          <div class="upload-card">
            <i data-lucide="camera" style="width:28px;height:28px"></i>
            <div class="upload-card__name">Selfie + Documento</div>
            <span class="upload-card__status">Aguardando</span>
            <span class="upload-card__cta">Capturar</span>
          </div>
        </div>
      </div>`;

    default: return '';
  }
}

function buildKycForm() {
  if (state.kycStep === 5) {
    return `
      <div class="kyc-page">
        <div class="kyc-container" style="align-items:center">
          <img src="assets/logo.svg" alt="EPIK" class="kyc-logo" />
          <div class="kyc-card" style="width:100%;max-width:520px;text-align:center">
            <div class="kyc-success">
              <div class="kyc-success__icon-wrap">
                <i data-lucide="check-circle-2" style="width:38px;height:38px"></i>
              </div>
              <h2 class="kyc-success__title">Cadastro Concluído!</h2>
              <p class="kyc-success__text">
                Sua documentação foi enviada e está sendo analisada.<br/>
                Em breve você receberá a confirmação por e-mail.
              </p>
              <div class="kyc-success__partners">
                <span>Processando em</span>
                <div class="kyc-success__partner-tags">
                  <span class="partner-tag">Ideal DTVM</span>
                  <span class="partner-tag">Ouribank</span>
                  <span class="partner-tag">Plural</span>
                  <span class="partner-tag">IB</span>
                </div>
              </div>
              <button class="btn-primary btn-primary--lg" data-action="kyc-submit">
                Começar a Investir
                <i data-lucide="arrow-right" style="width:16px;height:16px"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  const stepperHtml = KYC_STEPS.map((s, i) => {
    const num = i + 1;
    const isCompleted = state.kycStep > num;
    const isActive    = state.kycStep === num;
    const cls    = isCompleted ? 'completed' : isActive ? 'active' : '';
    const circle = isCompleted
      ? `<i data-lucide="check" style="width:13px;height:13px"></i>`
      : `${num}`;
    return `
      <div class="kyc-step-item ${cls}">
        <div class="kyc-step-circle">${circle}</div>
        <div class="kyc-step-label">${s.label}</div>
      </div>`;
  }).join('');

  const currentStep = KYC_STEPS[state.kycStep - 1];
  const isLastStep  = state.kycStep === 4;

  const prevBtn = state.kycStep > 1
    ? `<button class="btn-ghost" data-action="kyc-prev">
         <i data-lucide="arrow-left" style="width:14px;height:14px"></i>
         Anterior
       </button>`
    : `<div></div>`;

  return `
    <div class="kyc-page">
      <div class="kyc-container">
        <div class="kyc-header">
          <img src="assets/logo.svg" alt="EPIK" class="kyc-logo" />
          <div class="kyc-progress-text">Etapa ${state.kycStep} de 4</div>
        </div>
        <div class="kyc-stepper">${stepperHtml}</div>
        <div class="kyc-card">
          <div class="kyc-card__header">
            <i data-lucide="${currentStep.icon}" style="width:24px;height:24px" class="kyc-card__icon"></i>
            <div>
              <div class="kyc-card__title">${KYC_TITLES[state.kycStep - 1]}</div>
              <div class="kyc-card__subtitle">${KYC_SUBTITLES[state.kycStep - 1]}</div>
            </div>
          </div>
          ${buildKycStepContent()}
        </div>
        <div class="kyc-nav">
          ${prevBtn}
          <button class="btn-primary btn-primary--lg" data-action="kyc-next">
            ${isLastStep ? 'Finalizar' : 'Próximo'}
            <i data-lucide="arrow-right" style="width:16px;height:16px"></i>
          </button>
        </div>
      </div>
    </div>`;
}

// ── Pre-Cadastro ──
const PARTNERS = [
  { icon: 'building-2',  name: 'Ideal DTVM',         desc: 'KYC Brasil'   },
  { icon: 'landmark',    name: 'Ouribank',            desc: 'Câmbio'       },
  { icon: 'globe',       name: 'Plural',              desc: 'Conta US'     },
  { icon: 'bar-chart-2', name: 'Interactive Brokers', desc: 'Portfólio'    },
  { icon: 'monitor',     name: 'Nelogica',            desc: 'Trading'      },
];

function buildPreCadastro() {
  const pipeline = PARTNERS.map(p => `
    <div class="partner-step">
      <div class="partner-step__icon-wrap">
        <i data-lucide="${p.icon}" style="width:16px;height:16px"></i>
      </div>
      <div class="partner-step__name">${p.name}</div>
      <div class="partner-step__desc">${p.desc}</div>
      <div class="partner-step__badge">Pendente</div>
    </div>`).join('');

  return `
    <div class="pre-cadastro">
      <div class="pre-cadastro__main">
        ${buildFlagSwitcher()}
        <div class="pre-cadastro__hero">
          <div class="pre-cadastro__hero-icon">
            <i data-lucide="user-check" style="width:28px;height:28px"></i>
          </div>
          <h2 class="pre-cadastro__title">Finalize seu Cadastro</h2>
          <p class="pre-cadastro__subtitle">
            Para operar nos mercados americanos, precisamos verificar sua identidade
            e abrir contas nos nossos parceiros certificados.
          </p>
        </div>
        <div class="partner-pipeline">${pipeline}</div>
        <div class="pre-cadastro__actions">
          <button class="btn-primary btn-primary--lg" data-action="start-kyc">
            <i data-lucide="arrow-right" style="width:16px;height:16px"></i>
            Completar Cadastro
          </button>
          <button class="btn-ghost" data-action="continuar">Acessar depois</button>
        </div>
      </div>
      ${buildAvisosPanel()}
    </div>`;
}

// ── Home BR ──
function buildHomeBR() {
  return `
    <div class="home-br">
      <div class="home-br__main">
        ${buildFlagSwitcher()}
        <div class="home-br__banner">
          <div class="banner-content">
            <div class="banner-eyebrow">Plataforma de Investimentos</div>
            <h2 class="banner-title">Invista nos melhores mercados do mundo</h2>
            <p class="banner-subtitle">De ações americanas a renda fixa, tudo em um só lugar com a segurança da EPIK.</p>
            <button class="banner-cta">
              <i data-lucide="arrow-right" style="width:14px;height:14px"></i>
              Explorar produtos
            </button>
          </div>
          <svg class="banner-deco" viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 70 C25 58, 45 25, 75 32 C105 39, 120 12, 150 18 C170 22, 185 8, 220 12"
                  stroke="rgba(251,189,11,0.45)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path d="M0 80 C30 72, 55 48, 85 55 C115 62, 135 34, 165 28 C185 24, 200 18, 220 22"
                  stroke="rgba(251,189,11,0.15)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            <path d="M0 85 C40 80, 70 62, 100 68 C130 74, 155 52, 180 44 C200 38, 210 34, 220 36"
                  stroke="rgba(251,189,11,0.07)" stroke-width="1" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      ${buildAvisosPanel()}
    </div>`;
}

// ── Home US ──
function buildHomeUS() {
  const legendItems = [
    { color: 'var(--accent)', name: 'ETFs',       pct: '68%' },
    { color: '#00BCD4',       name: 'Ações',      pct: '18%' },
    { color: '#7C4DFF',       name: 'Opções',     pct: '9%'  },
    { color: '#FF7043',       name: 'Renda Fixa', pct: '5%'  },
  ];
  const legend = legendItems.map(l => `
    <div class="carteira-legend-item">
      <div class="carteira-legend-dot" style="background:${l.color}"></div>
      <span class="carteira-legend-item__name">${l.name}</span>
      <span class="carteira-legend-item__pct">${l.pct}</span>
    </div>`).join('');

  return `
    <div class="home-us">
      ${buildFlagSwitcher()}
      <div class="stat-cards-row">
        <div class="stat-card">
          <div class="stat-card__label">Saldo Conta Investimento</div>
          <div class="stat-card__value">$48,400.00</div>
          <div class="stat-card__badge">
            <i data-lucide="trending-up" style="width:10px;height:10px"></i>
            +3.2%
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Total Investido</div>
          <div class="stat-card__value">$25,900.00</div>
          <div class="stat-card__sub">IB Balance</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Total Consolidado</div>
          <div class="stat-card__value">$74,300.00</div>
          <div class="stat-card__sub">Portfolio + Conta</div>
        </div>
      </div>
      <div class="home-us__body">
        <div class="chart-area">
          <div class="chart-area__tabs">
            <button class="chart-tab active">Ações</button>
            <button class="chart-tab">Posição</button>
          </div>
          <div class="chart-placeholder">
            <i data-lucide="bar-chart-2" style="width:32px;height:32px"></i>
            Gráfico de Rentabilidade
          </div>
        </div>
        <div class="carteira-panel">
          <div class="carteira-panel__title">Minha Carteira</div>
          <div class="donut-placeholder"></div>
          <div class="carteira-legend">${legend}</div>
        </div>
      </div>
    </div>`;
}

// ── Câmbio ──
function buildCambio() {
  return `
    <div class="cambio-page">
      <div class="page-header-flag">${buildFlagSwitcher()}</div>
      <div class="page-title">O que você deseja fazer?</div>
      <div class="placeholder-block">
        <i data-lucide="arrow-right-left" style="width:40px;height:40px"></i>
        <div class="placeholder-block__label">Remessa para sua conta global</div>
        <div class="placeholder-block__sub">Interface Ouribank</div>
      </div>
      <div class="page-footer-link">
        <i data-lucide="info" style="width:14px;height:14px"></i>
        Avisos Importantes &amp; Dúvidas
      </div>
    </div>`;
}

// ── Posição ──
const PORTFOLIO = [
  { name: 'ETFs',       pct: 68, value: '$32,500' },
  { name: 'Ações',      pct: 18, value: '$8,700'  },
  { name: 'Opções',     pct: 9,  value: '$4,350'  },
  { name: 'Renda Fixa', pct: 5,  value: '$2,400'  },
];

const ASSETS = [
  { ticker: 'SPY',  nome: 'SPDR S&P 500',    aloc: '28%', valor: '$13,600' },
  { ticker: 'QQQ',  nome: 'Invesco QQQ',      aloc: '22%', valor: '$10,700' },
  { ticker: 'AAPL', nome: 'Apple Inc.',       aloc: '12%', valor: '$5,800'  },
  { ticker: 'NVDA', nome: 'NVIDIA Corp.',     aloc: '8%',  valor: '$3,900'  },
  { ticker: 'TLT',  nome: 'iShares 20Y Bond', aloc: '5%',  valor: '$2,400'  },
];

function buildPosicao() {
  const rows = PORTFOLIO.map(p => `
    <div class="asset-row">
      <div class="asset-row__name">${p.name}</div>
      <div class="asset-row__bar-wrap"><div class="asset-row__bar" style="width:${p.pct}%"></div></div>
      <div class="asset-row__value">${p.value}</div>
    </div>`).join('');

  const tableRows = ASSETS.map(a => `
    <tr>
      <td><strong style="color:var(--accent)">${a.ticker}</strong></td>
      <td>${a.nome}</td>
      <td>${a.aloc}</td>
      <td>${a.valor}</td>
    </tr>`).join('');

  return `
    <div class="posicao-page">
      ${buildFlagSwitcher()}
      <div class="stat-cards-row">
        <div class="stat-card">
          <div class="stat-card__label">Saldo Conta Investimento</div>
          <div class="stat-card__value">$48,400.00</div>
          <div class="stat-card__sub">Portfolio Account — IB Web API</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Total Investido</div>
          <div class="stat-card__value">$25,900.00</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Total Consolidado</div>
          <div class="stat-card__value">$74,300.00</div>
        </div>
      </div>
      <div class="posicao-carteira">
        <div class="posicao-carteira__title">Minha Carteira — Por Classe de Ativo</div>
        ${rows}
        <table class="assets-table" style="margin-top:20px">
          <thead>
            <tr><th>Ticker</th><th>Nome</th><th>Alocação</th><th>Valor</th></tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div>`;
}

// ── Trading ──
function buildTrading() {
  return `
    <div class="trading-page">
      ${buildFlagSwitcher()}
      <div class="trading-label">HB Nelogica</div>
      <div class="trading-sublabel">Negociação em conta real</div>
      <div class="trading-placeholder">
        <i data-lucide="monitor" style="width:52px;height:52px"></i>
        <div class="trading-placeholder__text">[ HB Nelogica ]</div>
        <div class="trading-placeholder__note">Espaço reservado para integração</div>
      </div>
    </div>`;
}

// ── Atendimento ──
const FAQ_ITEMS = [
  'O que são IPOs e como participar?',
  'Como declarar investimentos no exterior no IRPF?',
  'Como funciona o câmbio EPIK (Ouribank)?',
  'Quais são os custos operacionais da plataforma?',
  'Como transferir recursos para minha conta US?',
];

function buildAtendimento() {
  const faqRows = FAQ_ITEMS.map(q => `
    <div class="faq-item">
      <div class="faq-item__q">
        ${q}
        <i data-lucide="chevron-right" style="width:14px;height:14px"></i>
      </div>
    </div>`).join('');

  return `
    <div class="atendimento-page">
      ${buildFlagSwitcher()}
      <div class="atendimento-hero">
        <div class="atendimento-hero__greeting">Olá ${state.user.name}, como podemos ajudar?</div>
        <div class="search-input-wrap">
          <span class="search-icon"><i data-lucide="search" style="width:15px;height:15px"></i></span>
          <input type="text" placeholder="Escreva o que quer saber aqui..." />
        </div>
      </div>
      <div class="faq-section">
        <div class="section-title">Perguntas Frequentes</div>
        ${faqRows}
      </div>
      <div class="contact-section">
        <div class="section-title">Fale Conosco</div>
        <div class="contact-row">
          <span class="contact-icon"><i data-lucide="phone" style="width:16px;height:16px"></i></span>
          Telefone: +55 (11) 0000-0000
        </div>
        <div class="contact-row">
          <span class="contact-icon"><i data-lucide="message-circle" style="width:16px;height:16px"></i></span>
          WhatsApp: +55 (11) 90000-0000
        </div>
      </div>
    </div>`;
}

// ── Tax Center ──
function buildTaxCenter() {
  return `
    <div class="tax-page">
      ${buildFlagSwitcher()}
      <div class="tax-import-area">
        <i data-lucide="upload-cloud" style="width:44px;height:44px"></i>
        <div class="tax-import-area__label">Importar Operações</div>
      </div>
      <div class="tax-actions">
        <div class="tax-action-card">
          <i data-lucide="book-open" style="width:24px;height:24px"></i>
          <div class="tax-action-card__label">Guia IRPF</div>
          <button class="tax-action-card__btn">Acessar</button>
          <div class="tax-action-card__note">Conteúdo via FAQ / Atendimento</div>
        </div>
        <div class="tax-action-card">
          <i data-lucide="plus-circle" style="width:24px;height:24px"></i>
          <div class="tax-action-card__label">Cadastrar Operações</div>
          <button class="tax-action-card__btn">Cadastrar</button>
        </div>
        <div class="tax-action-card">
          <i data-lucide="download" style="width:24px;height:24px"></i>
          <div class="tax-action-card__label">Extrato das Operações</div>
          <button class="tax-action-card__btn">Gerar CSV</button>
        </div>
      </div>
    </div>`;
}

render();
