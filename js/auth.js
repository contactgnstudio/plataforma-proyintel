// ============================================================
// js/auth.js — GN Studio + Supabase Auth
// ============================================================

const SUPABASE_URL = 'https://smbphmmaswqcwmacfdxg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PUCx7VxzdeB75l1FqrvKSA_WbBha9mE';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

function gnEsCorreoValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function gnTraducirError(error) {
  const msg = (error && error.message ? error.message : '').toLowerCase();

  if (msg.includes('failed to fetch')) {
    return 'No se pudo conectar con Supabase. Revisa tu conexión, las Redirect URLs y prueba en incógnito.';
  }

  if (msg.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }

  if (msg.includes('email not confirmed')) {
    return 'Tu correo aún no está confirmado en Supabase.';
  }

  if (msg.includes('invalid api key')) {
    return 'La Publishable key de Supabase es inválida o está mal copiada.';
  }

  if (msg.includes('network')) {
    return 'Hay un problema de red al conectar con Supabase.';
  }

  return error && error.message ? error.message : 'Ocurrió un error inesperado.';
}

function gnCrearOverlaySiNoExiste() {
  let overlay = document.getElementById('gn-login-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'gn-login-overlay';
    overlay.className = 'gn-login-overlay';
    overlay.innerHTML = `
      <div class="gn-login-card">
        <div class="gn-login-logo">GN Studio OS</div>
        <h2>Acceso privado</h2>
        <p>Ingresa con tu correo y contraseña para ver la información interna.</p>

        <form id="login-form" onsubmit="return false;">
          <div class="form-group">
            <label for="login-usuario">CORREO</label>
            <input
              type="email"
              id="login-usuario"
              placeholder="contact@gnstudio.space"
              autocomplete="email"
              required
            >
          </div>

          <div class="form-group">
            <label for="login-password">CONTRASEÑA</label>
            <input
              type="password"
              id="login-password"
              placeholder="Tu contraseña"
              autocomplete="current-password"
              required
            >
          </div>

          <div class="form-feedback" id="feedback-login"></div>

          <div class="gn-login-actions">
            <button type="submit" class="btn-primary">Entrar</button>
            <a href="#" class="gn-login-link" onclick="return gnRecuperarPassword()">Olvidé mi contraseña</a>
          </div>
        </form>
      </div>
    `;
    document.body.prepend(overlay);
  }

  let logoutBtn = document.getElementById('gn-logout-btn');
  if (!logoutBtn) {
    logoutBtn = document.createElement('button');
    logoutBtn.id = 'gn-logout-btn';
    logoutBtn.className = 'gn-logout-btn';
    logoutBtn.textContent = 'Cerrar sesión';
    logoutBtn.onclick = gnCerrarSesion;
    document.body.appendChild(logoutBtn);
  }
}

function gnMostrarLogin() {
  gnCrearOverlaySiNoExiste();

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

  if (!gnEsCorreoValido(email)) {
    gnSetFeedback('Escribe un correo válido.', 'error');
    return false;
  }

  try {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      gnSetFeedback(gnTraducirError(error), 'error');
      return false;
    }

    gnSetFeedback('Acceso correcto.', 'success');
    gnOcultarLogin();

    if (typeof onSuccess === 'function') {
      onSuccess();
    }

    return false;
  } catch (error) {
    gnSetFeedback(gnTraducirError(error), 'error');
    return false;
  }
}

async function gnCerrarSesion() {
  try {
    await supabaseClient.auth.signOut();
  } catch (error) {}

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

  if (!gnEsCorreoValido(email)) {
    gnSetFeedback('Escribe un correo válido.', 'error');
    return false;
  }

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password.html'
    });

    if (error) {
      gnSetFeedback(gnTraducirError(error), 'error');
      return false;
    }

    gnSetFeedback('Te enviamos un enlace para cambiar tu contraseña.', 'success');
    return false;
  } catch (error) {
    gnSetFeedback(gnTraducirError(error), 'error');
    return false;
  }
}

async function gnAuthInit(onAuthenticated) {
  gnCrearOverlaySiNoExiste();

  const form = document.getElementById('login-form');

  gnSetFeedback('');

  if (form && !form.dataset.authBound) {
    form.addEventListener('submit', function(event) {
      gnProcesarLogin(event, onAuthenticated);
    });
    form.dataset.authBound = '1';
  }

  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      gnSetFeedback(gnTraducirError(error), 'error');
      gnMostrarLogin();
      return;
    }

    if (data && data.session) {
      gnOcultarLogin();
      if (typeof onAuthenticated === 'function') onAuthenticated();
      return;
    }

    gnMostrarLogin();
  } catch (error) {
    gnSetFeedback(gnTraducirError(error), 'error');
    gnMostrarLogin();
  }
}
