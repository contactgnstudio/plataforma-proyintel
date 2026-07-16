// ============================================================
// js/auth.js — GN Studio + Supabase Auth
// ============================================================

const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_PUBLICA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function gnGetOverlay() {
  return document.getElementById('gn-login-overlay');
}

function gnGetLogoutBtn() {
  return document.getElementById('gn-logout-btn');
}

function gnGetFeedback() {
  return document.getElementById('feedback-login');
}

function gnSetFeedback(msg, type) {
  const feedback = gnGetFeedback();
  if (!feedback) return;

  if (!msg) {
    feedback.className = 'form-feedback';
    feedback.textContent = '';
    feedback.style.display = 'none';
    return;
  }

  feedback.className = 'form-feedback ' + (type || 'error');
  feedback.textContent = msg;
  feedback.style.display = 'block';
}

function gnMostrarLogin() {
  const overlay = gnGetOverlay();
  const logoutBtn = gnGetLogoutBtn();

  if (overlay) {
    overlay.style.display = 'flex';
    overlay.classList.add('is-visible');
  }

  if (logoutBtn) logoutBtn.style.display = 'none';
  document.body.classList.add('gn-auth-locked');
}

function gnOcultarLogin() {
  const overlay = gnGetOverlay();
  const logoutBtn = gnGetLogoutBtn();

  if (overlay) {
    overlay.style.display = 'none';
    overlay.classList.remove('is-visible');
  }

  if (logoutBtn) logoutBtn.style.display = 'inline-flex';
  document.body.classList.remove('gn-auth-locked');
}

async function gnProcesarLogin(event, onSuccess) {
  if (event) event.preventDefault();

  const emailInput = document.getElementById('login-usuario');
  const passwordInput = document.getElementById('login-password');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!email || !password) {
    gnSetFeedback('Completa correo y contraseña.', 'error');
    return false;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    gnSetFeedback(error.message || 'No se pudo iniciar sesión.', 'error');
    return false;
  }

  gnSetFeedback('Acceso correcto.', 'success');
  gnOcultarLogin();

  if (typeof onSuccess === 'function') {
    onSuccess();
  }

  return false;
}

async function gnCerrarSesion() {
  await supabaseClient.auth.signOut();
  gnMostrarLogin();
  gnSetFeedback('');

  const passwordInput = document.getElementById('login-password');
  if (passwordInput) passwordInput.value = '';
}

async function gnRecuperarPassword() {
  const emailInput = document.getElementById('login-usuario');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email) {
    gnSetFeedback('Escribe tu correo primero para enviarte el enlace.', 'error');
    return false;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password.html'
  });

  if (error) {
    gnSetFeedback(error.message || 'No se pudo enviar el correo.', 'error');
    return false;
  }

  gnSetFeedback('Te enviamos un enlace para cambiar tu contraseña.', 'success');
  return false;
}

async function gnAuthInit(onAuthenticated) {
  const form = document.getElementById('login-form');

  gnSetFeedback('');

  if (form && !form.dataset.authBound) {
    form.addEventListener('submit', function(event) {
      gnProcesarLogin(event, onAuthenticated);
    });
    form.dataset.authBound = '1';
  }

  const { data } = await supabaseClient.auth.getSession();

  if (data && data.session) {
    gnOcultarLogin();
    if (typeof onAuthenticated === 'function') onAuthenticated();
    return;
  }

  gnMostrarLogin();
}
