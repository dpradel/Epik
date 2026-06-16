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

// ── Stubs — substituídos nas tasks seguintes ──
function buildLogin()      { return '<p style="padding:20px;color:white">Login (em breve)</p>'; }
function buildShell(c)     { return `<div style="padding:20px;color:white">${c}</div>`; }
function buildPreCadastro(){ return '<p style="color:white">Pré-cadastro (em breve)</p>'; }
function buildHomeBR()     { return '<p style="color:white">Home BR (em breve)</p>'; }
function buildHomeUS()     { return '<p style="color:white">Home US (em breve)</p>'; }
function buildCambio()     { return '<p style="color:white">Câmbio (em breve)</p>'; }
function buildPosicao()    { return '<p style="color:white">Posição (em breve)</p>'; }
function buildTrading()    { return '<p style="color:white">Trading (em breve)</p>'; }
function buildAtendimento(){ return '<p style="color:white">Atendimento (em breve)</p>'; }
function buildTaxCenter()  { return '<p style="color:white">Tax Center (em breve)</p>'; }

render();
