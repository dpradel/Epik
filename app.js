// app.js
const state = {
  authState: 'authenticated',   // 'login' | 'signup' | 'pre-cadastro' | 'kyc' | 'authenticated'
  mode: 'BR',           // 'BR' | 'US'
  screen: 'home',
  kycStep: 1,           // 1-4 form steps, 5 = success
  kycCompleted: false,
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
  animateCounters();
}

function buildApp() {
  if (state.authState === 'login')        return buildLogin();
  if (state.authState === 'signup')       return buildSignup();
  if (state.authState === 'kyc')          return buildKycForm();
  if (state.authState === 'pre-cadastro' && state.mode === 'BR') return buildShell(buildPreCadastro());
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
    case 'kyc-submit':    setState({ authState: 'authenticated', screen: 'home', mode: 'BR', kycCompleted: true }); break;
    case 'continuar':     setState({ authState: 'authenticated', screen: 'home', mode: 'BR' }); break;
    case 'nav': {
      const navItem = NAV_ITEMS.find(n => n.id === value);
      if (!navItem || !navItem.modes.includes(state.mode)) return;
      setState({ screen: value });
      break;
    }
    case 'mode': {
      const available = NAV_ITEMS.find(n => n.id === state.screen)?.modes.includes(value);
      setState({ mode: value, screen: available ? state.screen : 'home' });
      break;
    }
    case 'toggle-faq': {
      const clicked = e.currentTarget;
      const isOpen = clicked.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) clicked.classList.add('open');
      return;
    }
    case 'toggle-cambio-faq': {
      const clicked = e.currentTarget;
      const isOpen = clicked.classList.contains('open');
      document.querySelectorAll('.cambio-faq-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) clicked.classList.add('open');
      return;
    }
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

function buildTopNav() {
  const items = NAV_ITEMS.map(item => {
    const isActive = state.screen === item.id && state.authState === 'authenticated';
    const isAvailable = item.modes.includes(state.mode);
    const cls = ['nav-item', isActive ? 'active' : '', !isAvailable ? 'dimmed' : ''].filter(Boolean).join(' ');
    const tooltip = !isAvailable
      ? `data-tooltip="Disponível apenas no modo ${item.modes[0] === 'BR' ? 'BR' : 'US'}"`
      : '';
    return `
      <button class="${cls}" data-action="nav" data-value="${item.id}" ${tooltip}>
        <i data-lucide="${item.icon}" style="width:14px;height:14px"></i>
        ${item.label}
      </button>`;
  }).join('');

  return `
    <nav class="app-nav">
      <img src="assets/logo.svg" alt="EPIK" class="app-nav__logo" />
      <div class="app-nav__items">${items}</div>
      <div class="app-nav__right">
        <button class="nav-flag-btn ${state.mode === 'BR' ? 'active' : ''}" data-action="mode" data-value="BR" title="Brasil">
          ${FLAG_BR}
        </button>
        <button class="nav-flag-btn ${state.mode === 'US' ? 'active' : ''}" data-action="mode" data-value="US" title="United States">
          ${FLAG_US}
        </button>
        <button class="nav-icon-btn">
          <i data-lucide="bell" style="width:15px;height:15px"></i>
        </button>
        <button class="nav-user-btn">
          <i data-lucide="user" style="width:14px;height:14px"></i>
          ${state.user.name}
        </button>
      </div>
    </nav>`;
}

function buildShell(contentHtml) {
  return `
    <div class="app-shell">
      ${buildTopNav()}
      <main class="content-area">${contentHtml}</main>
    </div>
    <div class="chat-widget" title="Atendimento" data-action="nav" data-value="atendimento">
      <i data-lucide="message-circle" style="width:22px;height:22px"></i>
    </div>`;
}

// buildHeader() and buildSidebar() removed — replaced by buildTopNav()

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
    <div class="aviso-card aviso-card--${a.tagStyle}">
      <div class="aviso-card__icon-wrap aviso-card__icon-wrap--${a.tagStyle}">
        <i data-lucide="${a.icon}" style="width:16px;height:16px"></i>
      </div>
      <div class="aviso-card__body">
        <div class="aviso-card__title aviso-card__title--${a.tagStyle}">${a.title}</div>
        <div class="aviso-card__desc">${a.desc}</div>
      </div>
    </div>`).join('');

  return `
    <div class="avisos-panel">
      <div class="avisos-panel__header">
        <span class="avisos-panel__header-icon">
          <i data-lucide="bell-dot" style="width:14px;height:14px"></i>
        </span>
        <div>
          <div class="avisos-panel__title">Central de Avisos</div>
          <div class="avisos-panel__subtitle">Novidades e alertas</div>
        </div>
      </div>
      <div class="avisos-cards-grid">${cards}</div>
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
            Completar Cadastro
            <i data-lucide="arrow-right" style="width:16px;height:16px"></i>
          </button>
        </div>
      </div>
      ${buildAvisosPanel()}
    </div>`;
}

// ── Home BR ──
function buildHomeBR() {
  const kycPrompt = !state.kycCompleted ? `
    <div class="kyc-prompt">
      <div class="kyc-prompt__icon">
        <i data-lucide="circle-alert" style="width:14px;height:14px"></i>
      </div>
      <div class="kyc-prompt__text">
        <div class="kyc-prompt__title">Verificação de identidade pendente — ative sua conta nos EUA</div>
      </div>
      <button class="kyc-prompt__btn" data-action="start-kyc">
        Completar
        <i data-lucide="arrow-right" style="width:11px;height:11px"></i>
      </button>
    </div>` : '';

  return `
    <div class="home-br">
      <div class="home-br__left">
        ${kycPrompt}
        <div class="home-br__banner">
          <div class="banner-blob"></div>

          <div class="banner-content">
            <div class="banner-eyebrow">Plataforma de Investimentos</div>
            <h2 class="banner-title">Invista nos melhores mercados do mundo</h2>
            <p class="banner-subtitle">De ações americanas a renda fixa, tudo em um só lugar com a segurança da EPIK.</p>
            <button class="banner-cta">
              Explorar produtos
              <i data-lucide="arrow-right" style="width:14px;height:14px"></i>
            </button>
          </div>
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

  const chartLine = 'M44,118 C70,112 85,100 100,105 C122,112 138,82 160,68 C182,54 196,62 218,52 C240,42 255,48 278,36 C301,24 316,28 340,18 C364,8 390,6 416,5 C438,4 470,5 500,4';
  const chartFill = chartLine + ' L500,138 L44,138 Z';

  return `
    <div class="home-us">
      <div class="home-us__topbar">
        <div class="home-us__greeting">
          <div class="home-us__title">Portfolio Overview</div>
          <div class="home-us__subtitle">Conta Interactive Brokers — Atualizado hoje</div>
        </div>
        <button class="btn-invest" data-action="nav" data-value="trading">Investir</button>
      </div>
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
          <div class="chart-area__header">
            <div class="chart-area__title">Rentabilidade do Portfólio</div>
            <div class="chart-area__period-pills">
              <button class="chart-period-pill">1M</button>
              <button class="chart-period-pill">3M</button>
              <button class="chart-period-pill active">6M</button>
              <button class="chart-period-pill">1A</button>
            </div>
          </div>
          <div class="chart-svg-wrap">
            <svg class="rentabilidade-svg" viewBox="0 0 544 142" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stop-color="rgba(251,189,11,0.22)"/>
                  <stop offset="100%" stop-color="rgba(251,189,11,0)"/>
                </linearGradient>
              </defs>
              <line x1="44" y1="10"  x2="500" y2="10"  stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
              <line x1="44" y1="48"  x2="500" y2="48"  stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
              <line x1="44" y1="86"  x2="500" y2="86"  stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
              <line x1="44" y1="124" x2="500" y2="124" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
              <text x="2"  y="13"  fill="rgba(255,255,255,0.28)" font-size="9" font-family="Inter,sans-serif">62k</text>
              <text x="2"  y="51"  fill="rgba(255,255,255,0.28)" font-size="9" font-family="Inter,sans-serif">55k</text>
              <text x="2"  y="89"  fill="rgba(255,255,255,0.28)" font-size="9" font-family="Inter,sans-serif">49k</text>
              <text x="2"  y="127" fill="rgba(255,255,255,0.28)" font-size="9" font-family="Inter,sans-serif">44k</text>
              <path d="${chartFill}" class="chart-fill-path" fill="url(#rGrad)"/>
              <path d="${chartLine}" class="chart-line-path" stroke="rgba(251,189,11,0.9)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="500" cy="4" r="4" fill="var(--accent-color, #FBBD0B)"/>
              <circle cx="500" cy="4" r="7" fill="rgba(251,189,11,0.2)"/>
              <text x="56"  y="137" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Jan</text>
              <text x="110" y="137" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Fev</text>
              <text x="164" y="137" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Mar</text>
              <text x="218" y="137" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Abr</text>
              <text x="272" y="137" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Mai</text>
              <text x="326" y="137" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Jun</text>
              <text x="380" y="137" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Jul</text>
              <text x="434" y="137" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Ago</text>
              <text x="480" y="137" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Set</text>
            </svg>
          </div>
          <div class="chart-stats-row">
            <div class="chart-stat">
              <div class="chart-stat__label">Início do período</div>
              <div class="chart-stat__value">$44,200</div>
            </div>
            <div class="chart-stat">
              <div class="chart-stat__label">Valor atual</div>
              <div class="chart-stat__value">$48,400</div>
            </div>
            <div class="chart-stat">
              <div class="chart-stat__label">Rentabilidade</div>
              <div class="chart-stat__value"><span class="chart-stat__delta">+9.5%</span></div>
            </div>
            <div class="chart-stat">
              <div class="chart-stat__label">Dividendos recebidos</div>
              <div class="chart-stat__value">$840</div>
            </div>
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
      <div class="cambio-info">
        <div class="cambio-info__block">
          <div class="cambio-info__block-title cambio-info__block-title--warn">
            <i data-lucide="alert-triangle" style="width:14px;height:14px"></i>
            Avisos Importantes
          </div>
          <div class="cambio-aviso-row">
            <i data-lucide="circle-dot" style="width:13px;height:13px"></i>
            Limite de remessa diária: US$ 10.000 por operação
          </div>
          <div class="cambio-aviso-row">
            <i data-lucide="circle-dot" style="width:13px;height:13px"></i>
            Prazo de liquidação: D+2 dias úteis para câmbio comercial
          </div>
          <div class="cambio-aviso-row">
            <i data-lucide="circle-dot" style="width:13px;height:13px"></i>
            Taxa cambial atualizada às 18h de cada dia útil
          </div>
          <div class="cambio-aviso-row">
            <i data-lucide="circle-dot" style="width:13px;height:13px"></i>
            IOF de 0,38% aplicado conforme legislação vigente
          </div>
        </div>
        <div class="cambio-info__block">
          <div class="cambio-info__block-title cambio-info__block-title--info">
            <i data-lucide="help-circle" style="width:14px;height:14px"></i>
            Dúvidas Frequentes
          </div>
          <div class="cambio-faq-item" data-action="toggle-cambio-faq" data-value="0">
            <div class="cambio-faq-row">
              Qual o spread cobrado nas operações de câmbio?
              <i data-lucide="chevron-right" style="width:13px;height:13px"></i>
            </div>
            <div class="cambio-faq-answer">O spread EPIK é de 0,8% sobre a taxa de câmbio comercial do dia. Para operações acima de US$ 5.000 por mês, entre em contato com nosso time para negociar condições especiais.</div>
          </div>
          <div class="cambio-faq-item" data-action="toggle-cambio-faq" data-value="1">
            <div class="cambio-faq-row">
              Posso fazer remessas para contas de terceiros?
              <i data-lucide="chevron-right" style="width:13px;height:13px"></i>
            </div>
            <div class="cambio-faq-answer">Não. Por regulamentação do Banco Central, as remessas via EPIK só podem ser realizadas entre contas de mesma titularidade — sua conta no Brasil e sua conta Interactive Brokers nos EUA.</div>
          </div>
          <div class="cambio-faq-item" data-action="toggle-cambio-faq" data-value="2">
            <div class="cambio-faq-row">
              Como é calculado o IOF nas remessas?
              <i data-lucide="chevron-right" style="width:13px;height:13px"></i>
            </div>
            <div class="cambio-faq-answer">O IOF aplicado é de 0,38% sobre o valor total da remessa em reais, conforme tabela vigente do Decreto nº 6.306/2007 para operações de câmbio de transferências ao exterior.</div>
          </div>
          <div class="cambio-faq-item" data-action="toggle-cambio-faq" data-value="3">
            <div class="cambio-faq-row">
              Quando o valor chega na minha conta americana?
              <i data-lucide="chevron-right" style="width:13px;height:13px"></i>
            </div>
            <div class="cambio-faq-answer">Após a confirmação do PIX/TED, o processamento leva até D+2 dias úteis. O valor aparecerá em dólares diretamente na sua conta Interactive Brokers, já convertido pela taxa acordada.</div>
          </div>
        </div>
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
      <div class="trading-hb-wrap">
        <div class="trading-hb-header">
          <div class="trading-hb-badge">
            <i data-lucide="monitor" style="width:13px;height:13px"></i>
            HB Nelogica — Negociação em Conta Real
          </div>
        </div>
        <img src="assets/Market Depth.png" alt="HB Nelogica — Market Depth" class="trading-hb-img" />
      </div>
    </div>`;
}

// ── Atendimento ──
const FAQ_ITEMS = [
  {
    q: 'O que são IPOs e como participar?',
    a: 'Um IPO (Initial Public Offering) é a abertura de capital de uma empresa na bolsa. Na EPIK, você acessa IPOs americanos diretamente via Interactive Brokers. Acesse Trading, selecione "IPOs Disponíveis" e indique o valor desejado. Disponível para clientes com conta ativa e saldo mínimo de US$ 500.'
  },
  {
    q: 'Como declarar investimentos no exterior no IRPF?',
    a: 'Declare na ficha "Bens e Direitos" do IRPF usando o código 06 (ações/ETFs no exterior). Dividendos recebidos vão em "Rendimentos Sujeitos à Tributação Exclusiva". O Tax Center da EPIK gera relatórios prontos para importação no programa da Receita Federal — acesse em Tax Center → Extrato das Operações.'
  },
  {
    q: 'Como funciona o câmbio EPIK (Ouribank)?',
    a: 'O câmbio é realizado via Ouribank, instituição financeira autorizada pelo Banco Central. Você solicita a remessa em reais, o Ouribank converte pela taxa comercial + spread EPIK de 0,8%, e o valor chega em dólares na sua conta Interactive Brokers em até D+2 úteis. IOF de 0,38% é aplicado conforme legislação.'
  },
  {
    q: 'Quais são os custos operacionais da plataforma?',
    a: 'Custódia: 0,15% a.a. sobre o patrimônio. Ações e ETFs: US$ 0 por operação (zero brokerage). Opções: US$ 0,65 por contrato. Câmbio: spread de 0,8% + IOF 0,38%. Sem taxa de abertura de conta ou manutenção mensal fixa.'
  },
  {
    q: 'Como transferir recursos para minha conta US?',
    a: '1. Acesse Câmbio / Transferência no menu lateral. 2. Informe o valor em reais que deseja enviar. 3. Confirme a taxa de câmbio do dia. 4. Realize PIX ou TED para a conta Ouribank indicada. 5. Em até D+2 úteis, o valor aparece em dólares na sua conta Interactive Brokers.'
  },
];

function buildAtendimento() {
  const faqRows = FAQ_ITEMS.map((item, i) => `
    <div class="faq-item" data-action="toggle-faq" data-value="${i}">
      <div class="faq-item__q">
        ${item.q}
        <i data-lucide="chevron-right" style="width:14px;height:14px"></i>
      </div>
      <div class="faq-item__answer">${item.a}</div>
    </div>`).join('');

  return `
    <div class="atendimento-page">
      <div class="atendimento-hero">
        <div class="atendimento-hero__greeting">Olá ${state.user.name}, como podemos ajudar?</div>
        <div class="search-input-wrap">
          <span class="search-icon"><i data-lucide="search" style="width:15px;height:15px"></i></span>
          <input type="text" placeholder="Escreva o que quer saber aqui..." />
        </div>
      </div>
      <div class="atendimento-body">
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
      </div>
    </div>`;
}

// ── Tax Center ──
function buildTaxCenter() {
  return `
    <div class="tax-page">
      <div class="tax-upload-zone">
        <div class="tax-upload-zone__icon">
          <i data-lucide="upload-cloud" style="width:28px;height:28px"></i>
        </div>
        <div class="tax-upload-zone__text">
          <div class="tax-upload-zone__title">Importar operações</div>
          <div class="tax-upload-zone__sub">Arraste um arquivo ou clique para selecionar — .ofx, .xlsx ou .csv</div>
        </div>
        <button class="tax-upload-zone__btn">Selecionar arquivo</button>
      </div>
      <div class="tax-actions">
        <div class="tax-action-card tax-action-card--amber">
          <div class="tax-action-card__icon-wrap">
            <i data-lucide="book-open" style="width:18px;height:18px"></i>
          </div>
          <div class="tax-action-card__info">
            <div class="tax-action-card__title">Guia IRPF</div>
            <div class="tax-action-card__desc">Como declarar seus investimentos no exterior passo a passo</div>
          </div>
          <button class="tax-action-card__btn">Ver guia</button>
        </div>
        <div class="tax-action-card tax-action-card--violet">
          <div class="tax-action-card__icon-wrap">
            <i data-lucide="pencil" style="width:18px;height:18px"></i>
          </div>
          <div class="tax-action-card__info">
            <div class="tax-action-card__title">Lançamento manual</div>
            <div class="tax-action-card__desc">Registre operações que não constam no arquivo importado</div>
          </div>
          <button class="tax-action-card__btn">Registrar</button>
        </div>
        <div class="tax-action-card tax-action-card--sky">
          <div class="tax-action-card__icon-wrap">
            <i data-lucide="file-down" style="width:18px;height:18px"></i>
          </div>
          <div class="tax-action-card__info">
            <div class="tax-action-card__title">Exportar extrato</div>
            <div class="tax-action-card__desc">Baixe o histórico completo das suas operações em CSV</div>
          </div>
          <button class="tax-action-card__btn">Exportar</button>
        </div>
      </div>
    </div>`;
}

function animateCounters() {
  document.querySelectorAll('.stat-card__value, .chart-stat__value').forEach(el => {
    const text = el.textContent.trim();
    const match = text.match(/^([$R]?)([0-9,]+)(\.[0-9]+)?(%?)$/);
    if (!match) return;
    const prefix = match[1] || '';
    const intPart = match[2].replace(/,/g, '');
    const decPart = match[3] || '';
    const suffix = match[4] || '';
    const target = parseFloat(intPart + decPart);
    if (isNaN(target) || target === 0) return;
    const decimals = decPart ? decPart.length - 1 : 0;
    const duration = 900;
    let startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const val = (target * ease).toFixed(decimals);
      const formatted = parseFloat(val).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      el.textContent = prefix + formatted + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

render();
