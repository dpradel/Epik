// app.js
const state = {
  authState: 'authenticated',   // 'login' | 'signup' | 'pre-cadastro' | 'kyc' | 'authenticated'
  mode: 'BR',           // 'BR' | 'US'
  screen: 'home',
  kycStep: 1,           // 1-6 form steps, 7 = success
  kycCompleted: false,
  user: { name: 'Érico', lastName: 'Monteiro', email: 'erico.monteiro@email.com' },
};

const kycSuit = { answers: [], done: false, profile: null };
let kycNavDir = 1; // 1 = forward, -1 = backward

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
  if (state.authState === 'kyc' && state.kycStep === 5) initSuitChat();
}

function buildApp() {
  if (state.authState === 'login')        return buildLogin();
  if (state.authState === 'signup')       return buildSignup();
  if (state.authState === 'kyc')          return buildKycForm();
  if (state.authState === 'pre-cadastro' && state.mode === 'BR') return buildShell(buildPreCadastro());
  return buildShell(buildScreen());
}

function buildScreen() {
  const navItem = NAV_ITEMS.find(n => n.id === state.screen);
  if (navItem && !navItem.modes.includes(state.mode)) {
    return buildLockedScreen(navItem);
  }
  switch (state.screen) {
    case 'home':           return state.mode === 'BR' ? buildHomeBR() : buildHomeUS();
    case 'cambio':         return buildCambio();
    case 'posicao':        return buildPosicao();
    case 'trading':        return buildTrading();
    case 'atendimento':    return buildAtendimento();
    case 'tax-center':     return buildTaxCenter();
    case 'configuracoes':  return buildConfiguracoes();
    case 'seguranca':      return buildSeguranca();
    case 'editar-perfil':  return buildEditarPerfil();
    default:               return buildHomeBR();
  }
}

function buildLockedScreenGhost() {
  switch (state.screen) {
    case 'trading':    return buildTrading();
    case 'posicao':    return buildPosicao();
    case 'cambio':     return buildCambio();
    case 'tax-center': return buildTaxCenter();
    default:           return '<div style="height:100%"></div>';
  }
}

function buildLockedScreen(navItem) {
  const requiredMode = navItem.modes[0];
  const flagLabel = requiredMode === 'BR' ? 'modo BR' : 'modo US';
  return `
    <div class="locked-screen">
      <div class="locked-screen__bg">${buildLockedScreenGhost()}</div>
      <div class="locked-screen__overlay"></div>
      <div class="locked-screen__card">
        <div class="locked-screen__icon">
          <i data-lucide="lock" style="width:20px;height:20px"></i>
        </div>
        <div class="locked-screen__title">${navItem.label}</div>
        <div class="locked-screen__desc">Esta página está disponível apenas no ${flagLabel}.</div>
        <button class="locked-screen__btn" data-action="mode" data-value="${requiredMode}">
          Ativar ${flagLabel}
        </button>
      </div>
    </div>`;
}

function animateModeToggle(newMode, callback) {
  const thumb = document.querySelector('.mode-toggle__thumb');
  if (thumb) {
    thumb.classList.toggle('mode-toggle__thumb--right', newMode === 'US');
    document.querySelectorAll('.mode-toggle__opt').forEach(o => {
      o.classList.toggle('active', o.dataset.value === newMode);
    });
    setTimeout(callback, 300);
  } else {
    callback();
  }
}

function attachEvents() {
  document.querySelectorAll('[data-action]').forEach(el => {
    el.removeEventListener('click', handleAction);
    el.addEventListener('click', handleAction);
  });
  document.removeEventListener('click', closeDropdowns);
  document.addEventListener('click', closeDropdowns);
}

function closeDropdowns(e) {
  if (!e.target.closest('.nav-icon-btn') && !e.target.closest('.notif-dropdown')) {
    document.querySelector('.notif-dropdown')?.classList.remove('open');
  }
  if (!e.target.closest('.nav-user-btn') && !e.target.closest('.user-menu-dropdown')) {
    document.querySelector('.user-menu-dropdown')?.classList.remove('open');
  }
}

function handleAction(e) {
  e.preventDefault();
  const action = e.currentTarget.dataset.action;
  const value  = e.currentTarget.dataset.value;
  switch (action) {
    case 'login':         setState({ authState: 'authenticated', screen: 'home' }); break;
    case 'signup':        setState({ authState: 'signup' }); break;
    case 'back-to-login': setState({ authState: 'login' }); break;
    case 'submit-signup':
      kycSuit.answers = []; kycSuit.done = false; kycSuit.profile = null;
      setState({ authState: 'kyc', kycStep: 1 }); break;
    case 'start-kyc':
      kycSuit.answers = []; kycSuit.done = false; kycSuit.profile = null;
      setState({ authState: 'kyc', kycStep: 1 }); break;
    case 'kyc-next':      kycNavDir = 1;  setState({ kycStep: Math.min(state.kycStep + 1, 7) }); break;
    case 'kyc-prev':      kycNavDir = -1; setState({ kycStep: Math.max(state.kycStep - 1, 1) }); break;
    case 'kyc-submit':    setState({ authState: 'authenticated', screen: 'home', mode: 'BR', kycCompleted: true }); break;
    case 'kyc-goto': {
      kycNavDir = parseInt(value) >= state.kycStep ? 1 : -1;
      setState({ kycStep: parseInt(value) });
      break;
    }
    case 'suit-answer': {
      const qIdx = parseInt(e.currentTarget.dataset.qidx);
      const oIdx  = parseInt(e.currentTarget.dataset.oidx);
      const q = SUIT_QUESTIONS[qIdx];
      if (q.multi) {
        e.currentTarget.classList.toggle('selected');
        const wrap = e.currentTarget.closest('.suit-answers');
        const hasAny = wrap.querySelectorAll('.suit-answer-btn.selected').length > 0;
        const confirmBtn = document.querySelector(`.suit-confirm-btn[data-qidx="${qIdx}"]`);
        if (confirmBtn) confirmBtn.disabled = !hasAny;
        return;
      }
      const container = document.getElementById('suit-chat');
      const wrap = e.currentTarget.closest('.suit-answers');
      wrap.querySelectorAll('.suit-answer-btn').forEach(b => { b.disabled = true; b.classList.remove('selected'); });
      e.currentTarget.classList.add('selected');
      const ansText = q.opts[oIdx];
      kycSuit.answers.push({ q: q.q, a: ansText });
      setTimeout(() => {
        suitAppendUserMsg(container, ansText);
        suitAdvanceChat(container);
      }, 220);
      return;
    }
    case 'suit-confirm': {
      const qIdx = parseInt(e.currentTarget.dataset.qidx);
      const q = SUIT_QUESTIONS[qIdx];
      const container = document.getElementById('suit-chat');
      const wrap = document.querySelector(`.suit-answers[data-qidx="${qIdx}"]`);
      const selected = [...wrap.querySelectorAll('.suit-answer-btn.selected')];
      const text = selected.map(b => b.textContent.trim()).join(', ');
      wrap.querySelectorAll('.suit-answer-btn').forEach(b => b.disabled = true);
      e.currentTarget.disabled = true;
      kycSuit.answers.push({ q: q.q, a: text });
      setTimeout(() => {
        suitAppendUserMsg(container, text);
        suitAdvanceChat(container);
      }, 220);
      return;
    }
    case 'suit-retry': {
      kycSuit.answers = [];
      kycSuit.done = false;
      kycSuit.profile = null;
      initSuitChat();
      const nextBtn = document.getElementById('kyc-next-btn');
      if (nextBtn) nextBtn.setAttribute('disabled', '');
      return;
    }
    case 'continuar':     setState({ authState: 'authenticated', screen: 'home', mode: 'BR' }); break;
    case 'nav': {
      const navItem = NAV_ITEMS.find(n => n.id === value);
      if (!navItem) return;
      if (!navItem.modes.includes(state.mode)) {
        const targetMode = navItem.modes[0];
        animateModeToggle(targetMode, () => setState({ mode: targetMode, screen: value }));
      } else {
        setState({ screen: value });
      }
      return;
    }
    case 'mode': {
      const newMode = value;
      if (newMode === state.mode) return;
      animateModeToggle(newMode, () => setState({ mode: newMode }));
      return;
    }
    case 'set-screen': {
      document.querySelector('.user-menu-dropdown')?.classList.remove('open');
      setState({ screen: value });
      return;
    }
    case 'toggle-faq': {
      const clicked = e.currentTarget;
      const isOpen = clicked.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) clicked.classList.add('open');
      return;
    }
    case 'select-kyc-option': {
      const group = e.currentTarget.closest('.kyc-options');
      group?.querySelectorAll('.kyc-option-card').forEach(c => c.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      return;
    }
    case 'toggle-cambio-faq': {
      const clicked = e.currentTarget;
      const isOpen = clicked.classList.contains('open');
      document.querySelectorAll('.cambio-faq-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) clicked.classList.add('open');
      return;
    }
    case 'toggle-notif': {
      document.querySelector('.user-menu-dropdown')?.classList.remove('open');
      document.querySelector('.notif-dropdown')?.classList.toggle('open');
      e.stopPropagation();
      return;
    }
    case 'toggle-user-menu': {
      document.querySelector('.notif-dropdown')?.classList.remove('open');
      document.querySelector('.user-menu-dropdown')?.classList.toggle('open');
      e.stopPropagation();
      return;
    }
    case 'edit-profile': {
      document.querySelector('.user-menu-dropdown')?.classList.remove('open');
      setState({ screen: 'editar-perfil' });
      return;
    }
    case 'logout': {
      document.querySelector('.user-menu-dropdown')?.classList.remove('open');
      setState({ authState: 'login', screen: 'home', kycCompleted: false });
      return;
    }
    case 'toggle-chart-period': {
      const d = CHART_PERIODS[value];
      if (!d) return;
      document.querySelectorAll('.chart-period-pill').forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const fillPath = d.line + ' L500,138 L44,138 Z';
      document.getElementById('chart-line')?.setAttribute('d', d.line);
      document.getElementById('chart-fill')?.setAttribute('d', fillPath);
      // Move endpoint dot to the last coordinate of the new path
      const endMatch = d.line.match(/(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)\s*$/);
      if (endMatch) {
        const ex = endMatch[1], ey = endMatch[2];
        document.getElementById('chart-dot')?.setAttribute('cx', ex);
        document.getElementById('chart-dot')?.setAttribute('cy', ey);
        document.getElementById('chart-dot-halo')?.setAttribute('cx', ex);
        document.getElementById('chart-dot-halo')?.setAttribute('cy', ey);
      }
      const xLabels = document.querySelectorAll('.chart-x-label');
      d.labels.forEach((lbl, i) => { if (xLabels[i]) xLabels[i].textContent = lbl; });
      const statStart = document.getElementById('chart-stat-start');
      if (statStart) statStart.querySelector('.chart-stat__value').textContent = d.start;
      const statRet = document.getElementById('chart-stat-ret');
      if (statRet) statRet.querySelector('.chart-stat__value').innerHTML = `<span class="chart-stat__delta">${d.ret}</span>`;
      const statDiv = document.getElementById('chart-stat-div');
      if (statDiv) statDiv.querySelector('.chart-stat__value').textContent = d.div;
      return;
    }
  }
}

// ── Notifications Data ──
const NOTIFICATIONS = [
  { icon: 'trending-up',  color: 'emerald', title: 'Portfólio em alta',       desc: 'Seus ETFs subiram 3,2% nas últimas 24h',               time: '2h',      unread: true  },
  { icon: 'arrow-right-left', color: 'amber', title: 'Câmbio favorável',      desc: 'USD/BRL abaixo de R$ 5,20 — boa hora para remessa',    time: '5h',      unread: true  },
  { icon: 'shield-check', color: 'violet',  title: 'Documento aprovado',      desc: 'Sua CNH foi verificada com sucesso',                   time: 'Ontem',   unread: false },
  { icon: 'file-text',    color: 'sky',     title: 'Tax Center disponível',   desc: 'Importe suas operações de 2024 para o IRPF',           time: '3 dias',  unread: false },
];

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
    const cls = ['nav-item', isActive ? 'active' : ''].filter(Boolean).join(' ');
    return `
      <button class="${cls}" data-action="nav" data-value="${item.id}">
        <i data-lucide="${item.icon}" style="width:14px;height:14px"></i>
        ${item.label}
      </button>`;
  }).join('');

  return `
    <nav class="app-nav">
      <img src="assets/logo.svg" alt="EPIK" class="app-nav__logo" />
      <div class="app-nav__items">${items}</div>
      <div class="app-nav__right">
        <div class="mode-toggle">
          <div class="mode-toggle__thumb ${state.mode === 'US' ? 'mode-toggle__thumb--right' : ''}"></div>
          <button class="mode-toggle__opt ${state.mode === 'BR' ? 'active' : ''}" data-action="mode" data-value="BR" title="Brasil">
            ${FLAG_BR}
          </button>
          <button class="mode-toggle__opt ${state.mode === 'US' ? 'active' : ''}" data-action="mode" data-value="US" title="United States">
            ${FLAG_US}
          </button>
        </div>
        <div class="nav-dropdown-wrap">
          <button class="nav-icon-btn" data-action="toggle-notif">
            <i data-lucide="bell" style="width:15px;height:15px"></i>
            ${NOTIFICATIONS.some(n => n.unread) ? '<span class="notif-badge"></span>' : ''}
          </button>
          <div class="notif-dropdown">
            <div class="notif-dropdown__header">
              <span class="notif-dropdown__title">Notificações</span>
              <span class="notif-dropdown__count">${NOTIFICATIONS.filter(n => n.unread).length} novas</span>
            </div>
            <div class="notif-dropdown__list">
              ${NOTIFICATIONS.map(n => `
                <div class="notif-item ${n.unread ? 'notif-item--unread' : ''}">
                  <div class="notif-item__icon notif-item__icon--${n.color}">
                    <i data-lucide="${n.icon}" style="width:14px;height:14px"></i>
                  </div>
                  <div class="notif-item__body">
                    <div class="notif-item__title">${n.title}</div>
                    <div class="notif-item__desc">${n.desc}</div>
                  </div>
                  <div class="notif-item__time">${n.time}</div>
                  ${n.unread ? '<span class="notif-item__dot"></span>' : ''}
                </div>`).join('')}
            </div>
          </div>
        </div>
        <div class="nav-dropdown-wrap">
          <button class="nav-user-btn" data-action="toggle-user-menu">
            <span class="nav-user-btn__avatar">${state.user.name[0]}${state.user.lastName[0]}</span>
            ${state.user.name} ${state.user.lastName}
            <i data-lucide="chevron-down" style="width:12px;height:12px;opacity:0.5"></i>
          </button>
          <div class="user-menu-dropdown">
            <div class="user-menu__profile">
              <div class="user-menu__avatar">${state.user.name[0]}${state.user.lastName[0]}</div>
              <div>
                <div class="user-menu__name">${state.user.name} ${state.user.lastName}</div>
                <div class="user-menu__email">${state.user.email}</div>
              </div>
            </div>
            <div class="user-menu__divider"></div>
            <button class="user-menu__item" data-action="edit-profile">
              <i data-lucide="user-pen" style="width:14px;height:14px"></i>
              Editar perfil
            </button>
            <button class="user-menu__item" data-action="set-screen" data-value="configuracoes">
              <i data-lucide="settings" style="width:14px;height:14px"></i>
              Configurações
            </button>
            <button class="user-menu__item" data-action="set-screen" data-value="seguranca">
              <i data-lucide="shield" style="width:14px;height:14px"></i>
              Segurança
            </button>
            <div class="user-menu__divider"></div>
            <button class="user-menu__item user-menu__item--danger" data-action="logout">
              <i data-lucide="log-out" style="width:14px;height:14px"></i>
              Sair
            </button>
          </div>
        </div>
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
              <input type="text" placeholder="DD/MM/AAAA" />
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
const SUIT_QUESTIONS = [
  { q: 'Olá! Vou fazer algumas perguntas rápidas para entender seu perfil de investidor. Qual é seu objetivo de investimento?', opts: ['Preservar patrimônio', 'Render acima da inflação', 'Buscar retornos maiores'], multi: false },
  { q: 'Em quantos anos você planeja se aposentar?', opts: ['0–2 anos', '2–4 anos', '5–9 anos', 'Mais de 10 anos'], multi: false },
  { q: 'Por quanto tempo planeja manter seu dinheiro investido?', opts: ['Até 1 semana', 'Até 2 meses', 'Até 6 meses', 'Até 1 ano', 'Mais de 1 ano'], multi: false },
  { q: 'Quais produtos você conhece os riscos? Selecione todos que se aplicam.', opts: ['Poupança / Títulos Públicos / Fundos DI', 'CDB / LCI / LCA / Renda Fixa', 'Fundos Multimercados / Cambiais', 'Ações / ETF / BDR / FII', 'Derivativos / COEs', 'Fundos de Participações'], multi: true },
  { q: 'Há quantos anos você investe em ações?', opts: ['0 anos', '1–5 anos', '5–10 anos', 'Mais de 10 anos'], multi: false },
  { q: 'Quantos trades de ações você realiza por ano?', opts: ['0 trades', '1–10', '11–25', '26–50', '51–100', 'Mais de 100'], multi: false },
  { q: 'Qual é seu nível de conhecimento em ações?', opts: ['Nenhum', 'Limitado', 'Bom', 'Extenso'], multi: false },
  { q: 'Qual das opções melhor descreve você?', opts: ['Superior incompleto, sem experiência financeira', 'Superior completo, sem experiência financeira', 'Superior incompleto, com experiência financeira', 'Superior completo, com experiência financeira'], multi: false },
  { q: 'Prefiro investimentos com menores flutuações e aceito retornos mais baixos.', opts: ['Concordo', 'Neutro', 'Discordo parcialmente', 'Discordo'], multi: false },
  { q: 'Em períodos de crise, costumo vender ativos de risco e migrar para ativos mais seguros.', opts: ['Concordo', 'Neutro', 'Discordo parcialmente', 'Discordo'], multi: false },
  { q: 'Qual plano hipotético seria mais aceitável para você?', opts: ['A — retorno médio 4,13% / pior ano -2,85%', 'B — retorno médio 6,44% / pior ano -3,89%', 'C — retorno médio 7,99% / pior ano -5,64%', 'D — retorno médio 9,56% / pior ano -7,00%', 'E — retorno médio 11,06% / pior ano -8,07%'], multi: false },
];

const KYC_STEPS = [
  { label: 'Identificação', icon: 'user'               },
  { label: 'Documentos',    icon: 'file-check'         },
  { label: 'Endereço',      icon: 'map-pin'            },
  { label: 'Ocupação',      icon: 'briefcase'          },
  { label: 'Perfil',        icon: 'sliders-horizontal' },
  { label: 'Revisão',       icon: 'check-circle-2'     },
];

const KYC_TITLES = [
  'Identificação',
  'Documento de Identidade',
  'Endereço e Contato',
  'Ocupação e Finanças',
  'Perfil de Investidor',
  'Revisão do Cadastro',
];

const KYC_SUBTITLES = [
  'Dados pessoais para abertura de conta',
  'Documento com foto e comprovante de endereço',
  'Endereço residencial e telefone de contato',
  'Situação profissional e patrimônio',
  'Algumas perguntas para definir seu perfil',
  'Confirme seus dados antes de enviar',
];

function buildKycStepContent() {
  switch (state.kycStep) {

    case 1: return `
      <div class="form-fields">
        <div class="form-section-label">Dados pessoais</div>
        <div class="form-grid-2">
          <div class="form-group">
            <label>Primeiro nome *</label>
            <input type="text" placeholder="Ex: João" />
          </div>
          <div class="form-group">
            <label>Sobrenome(s) *</label>
            <input type="text" placeholder="Ex: Silva Santos" />
          </div>
          <div class="form-group">
            <label>CPF *</label>
            <input type="text" placeholder="000.000.000-00" />
          </div>
          <div class="form-group">
            <label>Data de nascimento *</label>
            <input type="date" />
          </div>
        </div>
        <div class="form-group">
          <label>E-mail *</label>
          <input type="email" placeholder="seu@email.com" />
        </div>
        <div class="form-group">
          <label>Gênero *</label>
          <div class="kyc-options kyc-options--3 kyc-options--compact">
            <button class="kyc-option-card" data-action="select-kyc-option">Masculino</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Feminino</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Prefiro não informar</button>
          </div>
        </div>
        <div class="form-group">
          <label>Nacionalidade *</label>
          <div class="kyc-options kyc-options--2 kyc-options--compact">
            <button class="kyc-option-card" data-action="select-kyc-option">Sou cidadão brasileiro</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Tenho CPF, mas sou estrangeiro</button>
          </div>
        </div>
        <div class="form-section-label">Filiação e estado civil</div>
        <div class="form-group">
          <label>Nome completo da mãe *</label>
          <input type="text" placeholder="Sem abreviações, máx. 60 caracteres" maxlength="60" />
        </div>
        <div class="form-group">
          <label>Estado civil *</label>
          <div class="kyc-options kyc-options--compact" style="grid-template-columns:repeat(5,1fr)">
            <button class="kyc-option-card" data-action="select-kyc-option">Solteiro(a)</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Casado(a)</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Separado(a)</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Divorciado(a)</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Viúvo(a)</button>
          </div>
        </div>
      </div>`;

    case 2: return `
      <div class="form-fields">
        <div class="form-group">
          <label>Tipo de documento *</label>
          <div class="kyc-options kyc-options--3 kyc-options--compact">
            <button class="kyc-option-card selected" data-action="select-kyc-option">RG</button>
            <button class="kyc-option-card" data-action="select-kyc-option">CNH</button>
            <button class="kyc-option-card" data-action="select-kyc-option">CIN</button>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label>Número do documento *</label>
            <input type="text" placeholder="Número do RG, CNH ou CIN" />
          </div>
          <div class="form-group">
            <label>Data de emissão *</label>
            <input type="date" />
          </div>
          <div class="form-group">
            <label>Órgão emissor *</label>
            <select>
              <option value="">Selecione...</option>
              <option>SSP</option><option>DETRAN</option><option>DPF</option>
              <option>PC</option><option>RF</option><option>OAB</option>
              <option>CRM</option><option>CREA</option><option>BACEN</option>
              <option>MJU</option><option>OUTROS</option>
            </select>
          </div>
          <div class="form-group">
            <label>País de emissão *</label>
            <select>
              <option>Brasil</option>
              <option>Outro...</option>
            </select>
          </div>
        </div>
        <div class="form-section-label">Documentos para envio</div>
        <div class="upload-cards upload-cards--2">
          <div class="upload-card">
            <i data-lucide="credit-card" style="width:28px;height:28px"></i>
            <div class="upload-card__name">Documento com foto</div>
            <div class="upload-card__hint">RG, CNH ou CIN — PDF/JPG/PNG, máx. 10MB</div>
            <span class="upload-card__status">Aguardando</span>
            <span class="upload-card__cta">Enviar</span>
          </div>
          <div class="upload-card">
            <i data-lucide="file-text" style="width:28px;height:28px"></i>
            <div class="upload-card__name">Comprov. de residência</div>
            <div class="upload-card__hint">Conta de luz, água, gás, TV/internet, extrato bancário ou cartão de crédito. Emitido há no máx. 3 meses. Não aceitamos conta de celular isolada.</div>
            <span class="upload-card__status">Aguardando</span>
            <span class="upload-card__cta">Enviar</span>
          </div>
        </div>
      </div>`;

    case 3: return `
      <div class="form-fields">
        <div class="form-section-label">Endereço residencial</div>
        <div class="form-grid-2">
          <div class="form-group">
            <label>CEP *</label>
            <input type="text" placeholder="00000-000" />
          </div>
          <div class="form-group">
            <label>Estado *</label>
            <select>
              <option value="">Selecione...</option>
              <option>AC</option><option>AL</option><option>AP</option><option>AM</option>
              <option>BA</option><option>CE</option><option>DF</option><option>ES</option>
              <option>GO</option><option>MA</option><option>MT</option><option>MS</option>
              <option>MG</option><option>PA</option><option>PB</option><option>PR</option>
              <option>PE</option><option>PI</option><option>RJ</option><option>RN</option>
              <option>RS</option><option>RO</option><option>RR</option><option>SC</option>
              <option selected>SP</option><option>SE</option><option>TO</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Logradouro *</label>
          <input type="text" placeholder="Rua, Av., Alameda..." />
        </div>
        <div class="form-grid-3">
          <div class="form-group">
            <label>Número *</label>
            <input type="text" placeholder="123" />
          </div>
          <div class="form-group">
            <label>Complemento</label>
            <input type="text" placeholder="Apto, sala..." />
          </div>
          <div class="form-group">
            <label>Bairro *</label>
            <input type="text" placeholder="Auto-preenchido" />
          </div>
        </div>
        <div class="form-group">
          <label>Cidade *</label>
          <input type="text" placeholder="Auto-preenchida pelo CEP" />
        </div>
        <div class="form-section-label">Contato</div>
        <div class="form-group">
          <label>Celular *</label>
          <input type="tel" placeholder="+55 (51) 99999-9999" />
        </div>
      </div>`;

    case 4: return `
      <div class="form-fields">
        <div class="form-group">
          <label>Situação profissional *</label>
          <div class="kyc-options kyc-options--compact" style="grid-template-columns:repeat(3,1fr)">
            <button class="kyc-option-card" data-action="select-kyc-option">Empregado</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Autônomo</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Aposentado</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Desempregado</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Pessoa do lar</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Estudante</button>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label>Renda anual (BRL) *</label>
            <select>
              <option value="">Selecione...</option>
              <option>Até R$ 18.000</option>
              <option>R$ 18.000 – R$ 36.000</option>
              <option>R$ 36.000 – R$ 60.000</option>
              <option>R$ 60.000 – R$ 120.000</option>
              <option>R$ 120.000 – R$ 240.000</option>
              <option>Acima de R$ 240.000</option>
            </select>
          </div>
          <div class="form-group">
            <label>Patrimônio líquido total (BRL) *</label>
            <select>
              <option value="">Selecione...</option>
              <option>Até R$ 50.000</option>
              <option>R$ 50.000 – R$ 100.000</option>
              <option>R$ 100.000 – R$ 250.000</option>
              <option>R$ 250.000 – R$ 500.000</option>
              <option>R$ 500.000 – R$ 1.000.000</option>
              <option>Acima de R$ 1.000.000</option>
            </select>
          </div>
          <div class="form-group">
            <label>Fonte dos recursos</label>
            <select>
              <option value="">Selecione...</option>
              <option>Salário / rendimentos</option>
              <option>Economias acumuladas</option>
              <option>Herança</option>
              <option>Renda de aluguel</option>
              <option>Recursos de investimentos</option>
              <option>Venda de imóvel ou empresa</option>
              <option>Cônjuge / Pais / Familiar</option>
              <option>Outros</option>
            </select>
          </div>
          <div class="form-group">
            <label>Pessoa Politicamente Exposta (PEP) *</label>
            <select>
              <option>Não</option>
              <option>Sim — cargo público</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Possui residência fiscal fora do Brasil?</label>
          <div class="kyc-options kyc-options--2 kyc-options--compact">
            <button class="kyc-option-card selected" data-action="select-kyc-option">Não</button>
            <button class="kyc-option-card" data-action="select-kyc-option">Sim</button>
          </div>
        </div>
      </div>`;

    case 5: return `
      <div class="suit-chat-wrap">
        <div class="suit-chat" id="suit-chat"></div>
      </div>`;

    case 6: return `
      <div class="form-fields">
        <div class="kyc-review-grid">
          <div class="kyc-review-card">
            <div class="kyc-review-card__head">
              <i data-lucide="user" style="width:13px;height:13px"></i>
              <span>Identificação</span>
              <button class="kyc-review-card__edit" data-action="kyc-goto" data-value="1">Editar</button>
            </div>
            <div class="kyc-review-card__rows">
              <div class="kyc-review-row"><span>Nome</span><span>Érico Monteiro</span></div>
              <div class="kyc-review-row"><span>CPF</span><span>000.000.000-00</span></div>
              <div class="kyc-review-row"><span>Nascimento</span><span>01/01/1990</span></div>
              <div class="kyc-review-row"><span>E-mail</span><span>erico@email.com</span></div>
            </div>
          </div>
          <div class="kyc-review-card">
            <div class="kyc-review-card__head">
              <i data-lucide="file-check" style="width:13px;height:13px"></i>
              <span>Documentos</span>
              <button class="kyc-review-card__edit" data-action="kyc-goto" data-value="2">Editar</button>
            </div>
            <div class="kyc-review-card__rows">
              <div class="kyc-review-row"><span>Tipo</span><span>RG</span></div>
              <div class="kyc-review-row"><span>Documento</span><span>Enviado</span></div>
              <div class="kyc-review-row"><span>Comprovante</span><span>Enviado</span></div>
            </div>
          </div>
          <div class="kyc-review-card">
            <div class="kyc-review-card__head">
              <i data-lucide="map-pin" style="width:13px;height:13px"></i>
              <span>Endereço</span>
              <button class="kyc-review-card__edit" data-action="kyc-goto" data-value="3">Editar</button>
            </div>
            <div class="kyc-review-card__rows">
              <div class="kyc-review-row"><span>CEP</span><span>04538-132</span></div>
              <div class="kyc-review-row"><span>Endereço</span><span>Av. Paulista, 1000</span></div>
              <div class="kyc-review-row"><span>Celular</span><span>+55 (51) 99999-9999</span></div>
            </div>
          </div>
          <div class="kyc-review-card">
            <div class="kyc-review-card__head">
              <i data-lucide="briefcase" style="width:13px;height:13px"></i>
              <span>Ocupação</span>
              <button class="kyc-review-card__edit" data-action="kyc-goto" data-value="4">Editar</button>
            </div>
            <div class="kyc-review-card__rows">
              <div class="kyc-review-row"><span>Situação</span><span>Empregado</span></div>
              <div class="kyc-review-row"><span>Renda anual</span><span>R$ 60k–120k</span></div>
              <div class="kyc-review-row"><span>Patrimônio</span><span>R$ 100k–250k</span></div>
            </div>
          </div>
        </div>
        ${kycSuit.profile ? `
        <div class="kyc-review-profile">
          <div class="kyc-review-profile__label">Perfil de investidor</div>
          <div class="kyc-review-profile__name">${kycSuit.profile}</div>
          <button class="kyc-review-card__edit" data-action="kyc-goto" data-value="5">Refazer</button>
        </div>` : `
        <div class="kyc-review-profile kyc-review-profile--warn">
          <i data-lucide="alert-circle" style="width:14px;height:14px"></i>
          <div>Perfil de investidor não definido. Volte para a etapa 5 antes de enviar.</div>
        </div>`}
        <div class="kyc-confirmations">
          <label class="checkbox-label">
            <input type="checkbox" />
            Confirmo que os dados acima são verdadeiros e corretos.
          </label>
          <label class="checkbox-label">
            <input type="checkbox" />
            Concordo com o W-8BEN e autorizo a coleta dos meus dados pela Epik e seus parceiros regulatórios.
          </label>
        </div>
      </div>`;

    default: return '';
  }
}

function buildKycForm() {
  if (state.kycStep === 7) {
    return `
      <div class="kyc-page">
        <div class="kyc-container" style="align-items:center">
          <img src="assets/logo.svg" alt="EPIK" class="kyc-logo" />
          <div class="kyc-card" style="width:100%;max-width:560px;text-align:center">
            <div class="kyc-success">
              <div class="kyc-success__icon-wrap">
                <i data-lucide="check-circle-2" style="width:38px;height:38px"></i>
              </div>
              <h2 class="kyc-success__title">Cadastro enviado!</h2>
              <p class="kyc-success__text">
                Sua documentação foi enviada com sucesso.<br/>
                Os contratos serão enviados por e-mail em até 2 dias úteis.<br/>
                <strong style="color:var(--text-muted);font-size:13px">Protocolo: EPK-2026-00847</strong>
              </p>
              <div class="kyc-success__partners">
                <span>Em processamento em</span>
                <div class="kyc-success__partner-tags">
                  <span class="partner-tag">Ideal DTVM</span>
                  <span class="partner-tag">Ouribank</span>
                  <span class="partner-tag">Plural</span>
                  <span class="partner-tag">IB</span>
                </div>
              </div>
              <button class="btn-primary btn-primary--lg" data-action="kyc-submit">
                Começar a investir
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

  const currentStep   = KYC_STEPS[state.kycStep - 1];
  const isLastStep    = state.kycStep === 6;
  const isSuitStep    = state.kycStep === 5;
  const nextDisabled  = (isSuitStep && !kycSuit.done) ? 'disabled' : '';
  const nextLabel     = isLastStep ? 'Confirmar e enviar' : 'Próximo';
  const slideClass    = kycNavDir >= 0 ? 'kyc-card--fwd' : 'kyc-card--bwd';

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
          <div class="kyc-progress-text">Etapa ${state.kycStep} de ${KYC_STEPS.length}</div>
        </div>
        <div class="kyc-stepper">${stepperHtml}</div>
        <div class="kyc-card ${slideClass}">
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
          <button class="btn-primary btn-primary--lg" id="kyc-next-btn" data-action="kyc-next" ${nextDisabled}>
            ${nextLabel}
          </button>
        </div>
      </div>
    </div>`;
}

// ── Suitability Chat ──
function suitAppendBotMsg(container, text, animate) {
  const div = document.createElement('div');
  div.className = 'suit-msg suit-msg--bot' + (animate ? ' suit-anim' : '');
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function suitAppendUserMsg(container, text) {
  const div = document.createElement('div');
  div.className = 'suit-msg suit-msg--user suit-anim';
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function suitAppendOptions(container, qIdx) {
  const q = SUIT_QUESTIONS[qIdx];
  const wrap = document.createElement('div');
  wrap.className = 'suit-answers suit-anim';
  wrap.dataset.qidx = qIdx;
  wrap.innerHTML = q.opts.map((opt, oi) =>
    `<button class="suit-answer-btn" data-action="suit-answer" data-qidx="${qIdx}" data-oidx="${oi}">${opt}</button>`
  ).join('');
  container.appendChild(wrap);
  wrap.querySelectorAll('[data-action]').forEach(el => {
    el.removeEventListener('click', handleAction);
    el.addEventListener('click', handleAction);
  });
  if (q.multi) {
    const confirmWrap = document.createElement('div');
    confirmWrap.className = 'suit-confirm-wrap suit-anim';
    confirmWrap.innerHTML = `<button class="suit-confirm-btn" data-action="suit-confirm" data-qidx="${qIdx}" disabled>Confirmar</button>`;
    container.appendChild(confirmWrap);
    confirmWrap.querySelectorAll('[data-action]').forEach(el => {
      el.removeEventListener('click', handleAction);
      el.addEventListener('click', handleAction);
    });
  }
  container.scrollTop = container.scrollHeight;
}

function suitAppendResult(container) {
  const isApproved = kycSuit.profile === 'Arrojado';
  const div = document.createElement('div');
  div.className = 'suit-result suit-anim ' + (isApproved ? 'suit-result--ok' : 'suit-result--warn');
  div.innerHTML =
    `<div class="suit-result__badge">${kycSuit.profile}</div>` +
    `<div class="suit-result__desc">${
      isApproved
        ? 'Perfil aprovado. Você terá acesso completo aos produtos da plataforma.'
        : 'Com este perfil, alguns produtos poderão estar indisponíveis. Você pode continuar e atualizar seu perfil depois.'
    }</div>` +
    (!isApproved
      ? `<button class="suit-retry-btn" data-action="suit-retry">Refazer questionário</button>`
      : '');
  container.appendChild(div);
  div.querySelectorAll('[data-action]').forEach(el => {
    el.removeEventListener('click', handleAction);
    el.addEventListener('click', handleAction);
  });
  container.scrollTop = container.scrollHeight;
  const nextBtn = document.getElementById('kyc-next-btn');
  if (nextBtn) nextBtn.removeAttribute('disabled');
}

function suitAdvanceChat(container) {
  const nextIdx = kycSuit.answers.length;
  const typing = document.createElement('div');
  typing.className = 'suit-typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
  if (nextIdx >= SUIT_QUESTIONS.length) {
    kycSuit.done = true;
    const last = kycSuit.answers[10].a;
    kycSuit.profile = last.startsWith('A') ? 'Conservador' : last.startsWith('B') ? 'Moderado' : 'Arrojado';
    setTimeout(() => { typing.remove(); suitAppendResult(container); }, 1000);
    return;
  }
  setTimeout(() => {
    typing.remove();
    suitAppendBotMsg(container, SUIT_QUESTIONS[nextIdx].q, true);
    suitAppendOptions(container, nextIdx);
  }, 700);
}

function initSuitChat() {
  const container = document.getElementById('suit-chat');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < kycSuit.answers.length; i++) {
    suitAppendBotMsg(container, kycSuit.answers[i].q, false);
    suitAppendUserMsg(container, kycSuit.answers[i].a);
  }
  if (kycSuit.done) { suitAppendResult(container); return; }
  const qIdx = kycSuit.answers.length;
  const q = SUIT_QUESTIONS[qIdx];
  if (qIdx === 0) {
    const typing = document.createElement('div');
    typing.className = 'suit-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(typing);
    setTimeout(() => {
      typing.remove();
      suitAppendBotMsg(container, q.q, true);
      suitAppendOptions(container, qIdx);
    }, 900);
  } else {
    suitAppendBotMsg(container, q.q, false);
    suitAppendOptions(container, qIdx);
  }
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
      ${kycPrompt}
      <div class="home-br__top">
        <div class="home-br__banner">
          <div class="banner-blob"></div>
          <div class="banner-content">
            <div class="banner-eyebrow">Plataforma de Investimentos</div>
            <h2 class="banner-title">Invista nos melhores mercados do mundo</h2>
            <p class="banner-subtitle">De ações americanas a renda fixa, tudo em um só lugar com a segurança da EPIK.</p>
            <button class="banner-cta" data-action="nav" data-value="cambio">
              Explorar produtos
              <i data-lucide="arrow-right" style="width:14px;height:14px"></i>
            </button>
          </div>
        </div>
        ${buildAvisosPanel()}
      </div>
    </div>`;
}

// ── Home US ──
const CHART_PERIODS = {
  '1M': {
    line: 'M44,100 C90,95 130,98 170,88 C210,78 245,82 280,70 C315,58 355,55 390,44 C425,33 460,26 500,20',
    start: '$46,200', current: '$48,400', ret: '+4.8%', div: '$120',
    labels: ['Dia 1','Dia 5','Dia 10','Dia 15','Dia 20','Dia 25','Dia 30','',''],
  },
  '3M': {
    line: 'M44,112 C80,108 115,104 155,92 C195,80 228,86 265,74 C302,62 336,66 373,52 C410,38 450,32 500,22',
    start: '$45,100', current: '$48,400', ret: '+7.3%', div: '$340',
    labels: ['Abr','','Mai','','Jun','','Jul','',''],
  },
  '6M': {
    line: 'M44,118 C70,112 85,100 100,105 C122,112 138,82 160,68 C182,54 196,62 218,52 C240,42 255,48 278,36 C301,24 316,28 340,18 C364,8 390,6 416,5 C438,4 470,5 500,4',
    start: '$44,200', current: '$48,400', ret: '+9.5%', div: '$840',
    labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set'],
  },
  '1A': {
    line: 'M44,128 C70,124 100,120 130,116 C160,112 190,108 220,100 C250,92 270,96 300,82 C330,68 355,72 385,56 C415,42 445,34 470,24 C485,18 492,14 500,10',
    start: '$38,500', current: '$48,400', ret: '+25.7%', div: '$1,620',
    labels: ['Jul\'24','Set','Nov','Jan','Mar','Mai','Jul\'25','',''],
  },
};

function buildHomeUS() {
  const legendItems = [
    { color: 'var(--accent)', name: 'ETFs',       pct: '68%', value: '$32,912' },
    { color: '#00BCD4',       name: 'Ações',      pct: '18%', value: '$8,712'  },
    { color: '#7C4DFF',       name: 'Opções',     pct: '9%',  value: '$4,356'  },
    { color: '#FF7043',       name: 'Renda Fixa', pct: '5%',  value: '$2,420'  },
  ];
  const legend = legendItems.map(l => `
    <div class="carteira-legend-item">
      <div class="carteira-legend-dot" style="background:${l.color}"></div>
      <span class="carteira-legend-item__name">${l.name}</span>
      <span class="carteira-legend-item__value">${l.value}</span>
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
              <button class="chart-period-pill" data-action="toggle-chart-period" data-value="1M">1M</button>
              <button class="chart-period-pill" data-action="toggle-chart-period" data-value="3M">3M</button>
              <button class="chart-period-pill active" data-action="toggle-chart-period" data-value="6M">6M</button>
              <button class="chart-period-pill" data-action="toggle-chart-period" data-value="1A">1A</button>
            </div>
          </div>
          <div class="chart-svg-wrap">
            <svg class="rentabilidade-svg" viewBox="0 0 544 142" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stop-color="rgba(251,189,11,0.32)"/>
                  <stop offset="100%" stop-color="rgba(251,189,11,0)"/>
                </linearGradient>
              </defs>
              <line x1="44" y1="10"  x2="500" y2="10"  stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
              <line x1="44" y1="48"  x2="500" y2="48"  stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
              <line x1="44" y1="86"  x2="500" y2="86"  stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
              <line x1="44" y1="124" x2="500" y2="124" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
              <text x="2"  y="13"  fill="rgba(255,255,255,0.28)" font-size="9" font-family="Inter,sans-serif">62k</text>
              <text x="2"  y="51"  fill="rgba(255,255,255,0.28)" font-size="9" font-family="Inter,sans-serif">55k</text>
              <text x="2"  y="89"  fill="rgba(255,255,255,0.28)" font-size="9" font-family="Inter,sans-serif">49k</text>
              <text x="2"  y="127" fill="rgba(255,255,255,0.28)" font-size="9" font-family="Inter,sans-serif">44k</text>
              <path id="chart-fill" d="${chartFill}" class="chart-fill-path" fill="url(#rGrad)"/>
              <path id="chart-line" d="${chartLine}" class="chart-line-path" stroke="rgba(251,189,11,0.9)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              <circle id="chart-dot-halo" cx="500" cy="4" r="7" fill="rgba(251,189,11,0.22)"/>
              <circle id="chart-dot" cx="500" cy="4" r="3.5" fill="#FBBD0B"/>
              <text x="56"  y="137" class="chart-x-label" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Jan</text>
              <text x="110" y="137" class="chart-x-label" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Fev</text>
              <text x="164" y="137" class="chart-x-label" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Mar</text>
              <text x="218" y="137" class="chart-x-label" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Abr</text>
              <text x="272" y="137" class="chart-x-label" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Mai</text>
              <text x="326" y="137" class="chart-x-label" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Jun</text>
              <text x="380" y="137" class="chart-x-label" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Jul</text>
              <text x="434" y="137" class="chart-x-label" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Ago</text>
              <text x="480" y="137" class="chart-x-label" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,sans-serif">Set</text>
            </svg>
          </div>
          <div class="chart-stats-row">
            <div class="chart-stat" id="chart-stat-start">
              <div class="chart-stat__label">Início do período</div>
              <div class="chart-stat__value">$44,200</div>
            </div>
            <div class="chart-stat" id="chart-stat-current">
              <div class="chart-stat__label">Valor atual</div>
              <div class="chart-stat__value">$48,400</div>
            </div>
            <div class="chart-stat" id="chart-stat-ret">
              <div class="chart-stat__label">Rentabilidade</div>
              <div class="chart-stat__value"><span class="chart-stat__delta">+9.5%</span></div>
            </div>
            <div class="chart-stat" id="chart-stat-div">
              <div class="chart-stat__label">Dividendos recebidos</div>
              <div class="chart-stat__value">$840</div>
            </div>
          </div>
        </div>
        <div class="carteira-panel">
          <div class="carteira-panel__header">
            <div class="carteira-panel__title">Minha Carteira</div>
            <span class="carteira-panel__total-badge">+25.7%</span>
          </div>
          <div class="carteira-donut-wrap">
            <div class="donut-placeholder"></div>
            <div class="carteira-donut-label">
              <div class="carteira-donut-label__value">$48,400</div>
              <div class="carteira-donut-label__sub">total</div>
            </div>
          </div>
          <div class="carteira-legend">${legend}</div>
          <div class="carteira-panel__footer">
            <span class="carteira-panel__footer-label">Rentabilidade 12m</span>
            <span class="carteira-panel__footer-val">+$9,900</span>
          </div>
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

// ── Editar Perfil ──
function buildEditarPerfil() {
  const u = state.user;
  return `
    <div class="settings-page">
      <div class="settings-page__header">
        <button class="settings-back-btn" data-action="set-screen" data-value="home">
          <i data-lucide="arrow-left" style="width:15px;height:15px"></i>
          Voltar
        </button>
        <h2 class="settings-page__title">Editar perfil</h2>
      </div>

      <div class="settings-sections">
        <div class="settings-col">
          <div class="settings-section">
            <div class="settings-section__title">Dados pessoais</div>
            <div class="settings-card">
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">Nome</div>
                </div>
                <input class="settings-input" type="text" value="${u.name}">
              </div>
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">Sobrenome</div>
                </div>
                <input class="settings-input" type="text" value="${u.lastName}">
              </div>
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">Data de nascimento</div>
                </div>
                <input class="settings-input" type="text" placeholder="DD/MM/AAAA" value="14/03/1990">
              </div>
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">CPF</div>
                </div>
                <input class="settings-input" type="text" value="382.109.740-55" disabled>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section__title">Contato</div>
            <div class="settings-card">
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">E-mail</div>
                </div>
                <input class="settings-input" type="email" value="${u.email}">
              </div>
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">Telefone</div>
                </div>
                <input class="settings-input" type="text" value="+55 (11) 99204-7731">
              </div>
            </div>
          </div>
        </div>

        <div class="settings-col">
          <div class="settings-section">
            <div class="settings-section__title">Endereço</div>
            <div class="settings-card">
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">CEP</div>
                </div>
                <input class="settings-input" type="text" value="01310-100">
              </div>
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">Logradouro</div>
                </div>
                <input class="settings-input" type="text" value="Av. Paulista">
              </div>
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">Número</div>
                </div>
                <input class="settings-input" type="text" value="1374">
              </div>
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">Complemento</div>
                </div>
                <input class="settings-input" type="text" placeholder="Apto, sala, bloco…">
              </div>
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">Cidade</div>
                </div>
                <input class="settings-input" type="text" value="São Paulo">
              </div>
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">Estado</div>
                </div>
                <select class="settings-select settings-select--full">
                  <option>SP — São Paulo</option>
                  <option>RJ — Rio de Janeiro</option>
                  <option>MG — Minas Gerais</option>
                  <option>RS — Rio Grande do Sul</option>
                </select>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section__title">Perfil de investidor</div>
            <div class="settings-card">
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">Perfil</div>
                  <div class="settings-row__desc">Definido na abertura de conta</div>
                </div>
                <select class="settings-select">
                  <option>Moderado</option>
                  <option>Conservador</option>
                  <option>Arrojado</option>
                </select>
              </div>
              <div class="settings-row settings-row--field">
                <div class="settings-row__info">
                  <div class="settings-row__label">Renda mensal</div>
                </div>
                <select class="settings-select">
                  <option>R$ 5.001 – R$ 10.000</option>
                  <option>Até R$ 5.000</option>
                  <option>R$ 10.001 – R$ 20.000</option>
                  <option>Acima de R$ 20.000</option>
                </select>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <button class="settings-save-btn">Salvar alterações</button>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Configurações ──
function buildConfiguracoes() {
  return `
    <div class="settings-page">
      <div class="settings-page__header">
        <button class="settings-back-btn" data-action="set-screen" data-value="home">
          <i data-lucide="arrow-left" style="width:15px;height:15px"></i>
          Voltar
        </button>
        <h2 class="settings-page__title">Configurações</h2>
      </div>

      <div class="settings-sections">
        <div class="settings-col">
          <div class="settings-section">
            <div class="settings-section__title">Preferências</div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Idioma da plataforma</div>
                  <div class="settings-row__desc">Idioma exibido em menus e textos</div>
                </div>
                <select class="settings-select">
                  <option>Português (BR)</option>
                  <option>English (US)</option>
                </select>
              </div>
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Moeda de exibição</div>
                  <div class="settings-row__desc">Moeda padrão para exibição de valores</div>
                </div>
                <select class="settings-select">
                  <option>BRL — Real</option>
                  <option>USD — Dólar</option>
                </select>
              </div>
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Fuso horário</div>
                  <div class="settings-row__desc">Utilizado para horários de ordens e alertas</div>
                </div>
                <select class="settings-select">
                  <option>América/São Paulo (UTC-3)</option>
                  <option>America/New York (UTC-5)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section__title">Privacidade</div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Ocultar saldo na home</div>
                  <div class="settings-row__desc">Esconde valores financeiros por padrão ao abrir o app</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox">
                  <span class="settings-toggle__track"></span>
                </label>
              </div>
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Compartilhar dados de uso</div>
                  <div class="settings-row__desc">Ajuda a melhorar a plataforma com dados anônimos</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" checked>
                  <span class="settings-toggle__track"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-col">
          <div class="settings-section">
            <div class="settings-section__title">Notificações</div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Alertas de preço</div>
                  <div class="settings-row__desc">Notificar quando ativos atingirem os limites configurados</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" checked>
                  <span class="settings-toggle__track"></span>
                </label>
              </div>
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Ordens executadas</div>
                  <div class="settings-row__desc">Notificar quando uma ordem for preenchida ou cancelada</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" checked>
                  <span class="settings-toggle__track"></span>
                </label>
              </div>
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Novidades EPIK</div>
                  <div class="settings-row__desc">Comunicados, lançamentos e promoções</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox">
                  <span class="settings-toggle__track"></span>
                </label>
              </div>
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Relatórios mensais</div>
                  <div class="settings-row__desc">Resumo mensal de rentabilidade e operações</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" checked>
                  <span class="settings-toggle__track"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Segurança ──
function buildSeguranca() {
  return `
    <div class="settings-page">
      <div class="settings-page__header">
        <button class="settings-back-btn" data-action="set-screen" data-value="home">
          <i data-lucide="arrow-left" style="width:15px;height:15px"></i>
          Voltar
        </button>
        <h2 class="settings-page__title">Segurança</h2>
      </div>

      <div class="settings-sections">
        <div class="settings-col">
          <div class="settings-section">
            <div class="settings-section__title">Acesso</div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Senha</div>
                  <div class="settings-row__desc">Última alteração há 47 dias</div>
                </div>
                <button class="settings-action-btn">Alterar</button>
              </div>
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Autenticação em dois fatores</div>
                  <div class="settings-row__desc">Ativa — via aplicativo autenticador</div>
                </div>
                <button class="settings-action-btn">Gerenciar</button>
              </div>
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Biometria</div>
                  <div class="settings-row__desc">Usar impressão digital ou Face ID para entrar</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" checked>
                  <span class="settings-toggle__track"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section__title">Histórico de acessos</div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Login bem-sucedido</div>
                  <div class="settings-row__desc">Chrome — São Paulo, BR</div>
                </div>
                <span class="settings-row__time">Hoje, 09:14</span>
              </div>
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Login bem-sucedido</div>
                  <div class="settings-row__desc">Safari — iPhone 15 — São Paulo, BR</div>
                </div>
                <span class="settings-row__time">Hoje, 07:32</span>
              </div>
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Tentativa bloqueada</div>
                  <div class="settings-row__desc settings-row__desc--danger">IP desconhecido — Frankfurt, DE</div>
                </div>
                <span class="settings-row__time">Ontem, 23:57</span>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-col">
          <div class="settings-section">
            <div class="settings-section__title">Sessões ativas</div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-row__icon settings-row__icon--emerald">
                  <i data-lucide="monitor" style="width:15px;height:15px"></i>
                </div>
                <div class="settings-row__info">
                  <div class="settings-row__label">Chrome — MacOS</div>
                  <div class="settings-row__desc">São Paulo, BR — agora</div>
                </div>
                <span class="settings-badge settings-badge--active">Esta sessão</span>
              </div>
              <div class="settings-row">
                <div class="settings-row__icon settings-row__icon--sky">
                  <i data-lucide="smartphone" style="width:15px;height:15px"></i>
                </div>
                <div class="settings-row__info">
                  <div class="settings-row__label">Safari — iPhone 15</div>
                  <div class="settings-row__desc">São Paulo, BR — 2h atrás</div>
                </div>
                <button class="settings-action-btn settings-action-btn--danger">Encerrar</button>
              </div>
              <div class="settings-row">
                <div class="settings-row__icon settings-row__icon--violet">
                  <i data-lucide="tablet" style="width:15px;height:15px"></i>
                </div>
                <div class="settings-row__info">
                  <div class="settings-row__label">Chrome — iPad</div>
                  <div class="settings-row__desc">Campinas, BR — 3 dias atrás</div>
                </div>
                <button class="settings-action-btn settings-action-btn--danger">Encerrar</button>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section__title">Zona de risco</div>
            <div class="settings-card settings-card--danger">
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Encerrar todas as sessões</div>
                  <div class="settings-row__desc">Desconecta todos os dispositivos exceto o atual</div>
                </div>
                <button class="settings-action-btn settings-action-btn--danger">Encerrar tudo</button>
              </div>
              <div class="settings-row">
                <div class="settings-row__info">
                  <div class="settings-row__label">Excluir conta</div>
                  <div class="settings-row__desc">Ação irreversível — todos os dados serão apagados</div>
                </div>
                <button class="settings-action-btn settings-action-btn--danger">Excluir</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

render();
