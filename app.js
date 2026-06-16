// app.js
const state = {
  authState: 'login',   // 'login' | 'pre-cadastro' | 'authenticated'
  mode: 'BR',           // 'BR' | 'US'
  screen: 'home',       // 'home' | 'cambio' | 'posicao' | 'trading' | 'atendimento' | 'tax-center'
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
}

function buildApp() {
  if (state.authState === 'login') return buildLogin();
  if (state.authState === 'pre-cadastro') return buildShell(buildPreCadastro());
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
  const action = e.currentTarget.dataset.action;
  const value  = e.currentTarget.dataset.value;
  switch (action) {
    case 'login':        setState({ authState: 'pre-cadastro' }); break;
    case 'continuar':    setState({ authState: 'authenticated', screen: 'home', mode: 'BR' }); break;
    case 'nav':          setState({ screen: value }); break;
    case 'mode':         setState({ mode: value, screen: 'home' }); break;
  }
}

const NAV_ITEMS = [
  { id: 'home',        label: 'HOME',                  modes: ['BR','US'] },
  { id: 'cambio',      label: 'Câmbio / Transferência', modes: ['BR']      },
  { id: 'posicao',     label: 'Posição',                modes: ['US']      },
  { id: 'trading',     label: 'Trading',                modes: ['US']      },
  { id: 'atendimento', label: 'Atendimento',            modes: ['BR','US'] },
  { id: 'tax-center',  label: 'Tax Center',             modes: ['BR','US'] },
];

function buildHeader() {
  return `
    <header class="app-header">
      <img src="assets/logo.svg" alt="EPIK" class="app-header__logo" />
      <div class="app-header__right">
        <button class="app-header__user">${state.user.name}</button>
        <button class="app-header__bell">🔔</button>
      </div>
    </header>`;
}

function buildSidebar() {
  const items = NAV_ITEMS
    .filter(item => item.modes.includes(state.mode))
    .map(item => `
      <button
        class="sidebar__item ${state.screen === item.id && state.authState === 'authenticated' ? 'active' : ''}"
        data-action="nav"
        data-value="${item.id}">
        ${item.label}
      </button>`).join('');
  return `<nav class="sidebar">${items}</nav>`;
}

function buildShell(contentHtml) {
  return `
    <div class="app-shell">
      ${buildHeader()}
      ${buildSidebar()}
      <main class="content-area">${contentHtml}</main>
    </div>
    <div class="chat-widget" title="Atendimento">💬</div>`;
}

function buildFlagSwitcher() {
  return `
    <div class="flag-switcher">
      <button class="flag-btn ${state.mode === 'BR' ? 'active' : ''}" data-action="mode" data-value="BR" title="Brasil">🇧🇷</button>
      <button class="flag-btn ${state.mode === 'US' ? 'active' : ''}" data-action="mode" data-value="US" title="United States">🇺🇸</button>
    </div>`;
}

const AVISOS = [
  'Missão NY 2026 — Participe!',
  'Alugue suas ações. Saiba como.',
  'Renda Fixa com a EPIK. Clique aqui.',
  'Siga a EPIK nas redes!',
];

function buildAvisosPanel() {
  const items = AVISOS.map(a => `<div class="aviso-item">${a}</div>`).join('');
  return `
    <div class="avisos-panel">
      <div class="avisos-panel__title">Central de Avisos</div>
      ${items}
    </div>`;
}

// ── Stubs — substituídos nas tasks seguintes ──
function buildLogin() {
  return `
    <div class="login-page">
      <div class="login-card">
        <img src="assets/logo.svg" alt="EPIK" class="login-card__logo" />
        <p class="login-card__title">Acesse sua conta</p>
        <div class="form-fields">
          <div class="form-group">
            <label for="email">E-mail</label>
            <input type="email" id="email" placeholder="seu@email.com" />
          </div>
          <div class="form-group">
            <label for="senha">Senha</label>
            <input type="password" id="senha" placeholder="••••••••" />
          </div>
        </div>
        <button class="btn-primary" data-action="login">Entrar</button>
        <p class="login-footer">Não tem conta? <a href="#">Criar conta</a></p>
      </div>
    </div>`;
}
function buildPreCadastro() {
  return `
    <div class="pre-cadastro">
      <div>
        ${buildFlagSwitcher()}
        <div class="pre-cadastro__main">
          <div class="pre-cadastro__icon">📋</div>
          <p class="pre-cadastro__text">Finalize seu cadastro para iniciar sua jornada com a EPIK</p>
          <button class="pre-cadastro__cta" data-action="continuar">Continuar</button>
          <p style="font-size:11px;color:var(--text-dim)">Tela de cadastro integrada com KYC e Suitability</p>
        </div>
      </div>
      ${buildAvisosPanel()}
    </div>`;
}
function buildHomeBR() {
  return `
    <div class="home-br">
      <div class="home-br__main">
        ${buildFlagSwitcher()}
        <div class="home-br__banner">Banner EPIK</div>
      </div>
      ${buildAvisosPanel()}
    </div>`;
}
function buildHomeUS()     { return '<p style="color:white">Home US (em breve)</p>'; }
function buildCambio()     { return '<p style="color:white">Câmbio (em breve)</p>'; }
function buildPosicao()    { return '<p style="color:white">Posição (em breve)</p>'; }
function buildTrading()    { return '<p style="color:white">Trading (em breve)</p>'; }
function buildAtendimento(){ return '<p style="color:white">Atendimento (em breve)</p>'; }
function buildTaxCenter()  { return '<p style="color:white">Tax Center (em breve)</p>'; }

render();
