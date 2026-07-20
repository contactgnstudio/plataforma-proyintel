/* ================================================================
   DASHBOARD WIDGETS — GN Studio OS
   1. Saludo contextual con fecha
   2. Card "Por Cobrar" (deuda pendiente)
   3. Quick Actions (accesos rápidos)
   4. Tareas urgentes del día
   5. Próximos eventos del mes
   6. Meta mensual de ingresos
   ================================================================ */

// ── CONFIG ──────────────────────────────────────────────────────
const GN_META_MENSUAL_KEY = 'gn_meta_mensual_usd';
const GN_META_DEFAULT     = 3000; // USD — cambia aquí o en settings

// ── 1. SALUDO CONTEXTUAL ─────────────────────────────────────────
function gnRenderSaludo() {
  const el = document.getElementById('widget-saludo-texto');
  const subEl = document.getElementById('widget-saludo-sub');
  if (!el) return;

  const ahora = new Date();
  const hora  = ahora.getHours();
  let turno   = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  const dias   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses  = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const fechaTxt = `${dias[ahora.getDay()]} ${ahora.getDate()} de ${meses[ahora.getMonth()]}`;

  el.textContent = `${turno}, GN Studio — ${fechaTxt}`;

  // Sub-línea: urgentes + por cobrar
  const urgentes = gnContarTareasUrgentes();
  const porCobrar = gnCalcularPorCobrarTotal();
  const partes = [];
  if (urgentes > 0) partes.push(`${urgentes} tarea${urgentes > 1 ? 's' : ''} urgente${urgentes > 1 ? 's' : ''}`);
  if (porCobrar > 0) partes.push(`USD ${gnFmt(porCobrar)} por cobrar`);
  subEl.textContent = partes.length > 0 ? 'Tienes ' + partes.join(' y ') + '.' : 'Todo al día. ¡Buen trabajo!';
}

// ── 2. CARD POR COBRAR ───────────────────────────────────────────
function gnCalcularPorCobrarTotal() {
  try {
    const proyectos = (typeof gnData !== 'undefined' && gnData.proyectos) ? gnData.proyectos : [];
    let total = 0;
    proyectos.forEach(p => {
      if (!p || p.estado === 'completado' || p.estado === 'cancelado') return;
      const presupuesto = parseFloat(p.monto_total || p.presupuesto || 0);
      const cobrado     = (p.pagos || []).reduce((s, pg) => s + parseFloat(pg.monto || 0), 0);
      const diff = presupuesto - cobrado;
      if (diff > 0) total += diff;
    });
    return total;
  } catch(e) { return 0; }
}

function gnRenderPorCobrar() {
  const el = document.getElementById('widget-por-cobrar-monto');
  if (!el) return;
  const total = gnCalcularPorCobrarTotal();
  el.textContent = 'USD ' + gnFmt(total);
  el.style.color = total > 0 ? '#C5A253' : '#2D8B5E';
}

// ── 3. QUICK ACTIONS — solo renderiza (botones ya están en HTML) ─
function gnRenderQuickActions() {
  // Nada que calcular, los botones usan funciones ya existentes
}

// ── 4. TAREAS URGENTES ───────────────────────────────────────────
function gnContarTareasUrgentes() {
  try {
    const proyectos = (typeof gnData !== 'undefined' && gnData.proyectos) ? gnData.proyectos : [];
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    let cnt = 0;
    proyectos.forEach(p => {
      if (!p || p.estado === 'completado' || p.estado === 'cancelado') return;
      (p.tareas || []).forEach(t => {
        if (t.estado === 'completada') return;
        if (!t.fecha_limite) {
          if (t.prioridad === 'urgente') cnt++;
          return;
        }
        const lim = new Date(t.fecha_limite + 'T00:00:00');
        if (lim <= hoy) cnt++;
      });
    });
    return cnt;
  } catch(e) { return 0; }
}

function gnRenderTareasUrgentes() {
  const cont = document.getElementById('widget-tareas-urgentes-lista');
  if (!cont) return;
  try {
    const proyectos = (typeof gnData !== 'undefined' && gnData.proyectos) ? gnData.proyectos : [];
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const urgentes = [];
    proyectos.forEach(p => {
      if (!p || p.estado === 'completado' || p.estado === 'cancelado') return;
      (p.tareas || []).forEach(t => {
        if (t.estado === 'completada') return;
        let incluir = false;
        let vencida = false;
        if (t.fecha_limite) {
          const lim = new Date(t.fecha_limite + 'T00:00:00');
          if (lim <= hoy) { incluir = true; vencida = lim < hoy; }
        }
        if (t.prioridad === 'urgente') incluir = true;
        if (incluir) urgentes.push({ tarea: t, proyecto: p, vencida });
      });
    });
    urgentes.sort((a,b) => {
      const fa = a.tarea.fecha_limite ? new Date(a.tarea.fecha_limite) : new Date('2099-01-01');
      const fb = b.tarea.fecha_limite ? new Date(b.tarea.fecha_limite) : new Date('2099-01-01');
      return fa - fb;
    });
    const mostrar = urgentes.slice(0, 5);
    if (mostrar.length === 0) {
      cont.innerHTML = '<div class="gn-widget-empty"><i class="ph ph-check-circle"></i> Sin tareas urgentes hoy</div>';
      return;
    }
    cont.innerHTML = mostrar.map(({tarea, proyecto, vencida}) => `
      <div class="gn-tarea-item" onclick="gnAbrirProyecto('${proyecto.id}')">
        <span class="gn-tarea-badge ${vencida ? 'gn-badge-vencida' : 'gn-badge-hoy'}">${vencida ? 'Vencida' : 'Hoy'}</span>
        <span class="gn-tarea-titulo">${gnEscape(tarea.titulo || tarea.nombre || 'Sin título')}</span>
        <span class="gn-tarea-proyecto">${gnEscape(proyecto.nombre || '')}</span>
      </div>
    `).join('');
  } catch(e) {
    cont.innerHTML = '<div class="gn-widget-empty">Sin datos disponibles</div>';
  }
}

// ── 5. PRÓXIMOS EVENTOS ──────────────────────────────────────────
function gnRenderProximosEventos() {
  const cont = document.getElementById('widget-proximos-eventos-lista');
  if (!cont) return;
  try {
    const proyectos = (typeof gnData !== 'undefined' && gnData.proyectos) ? gnData.proyectos : [];
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const fin = new Date(hoy); fin.setDate(fin.getDate() + 31);
    const eventos = [];
    proyectos.forEach(p => {
      if (!p || p.estado === 'completado' || p.estado === 'cancelado') return;
      // Fecha de entrega del proyecto
      if (p.fecha_entrega || p.fecha_fin) {
        const fe = new Date((p.fecha_entrega || p.fecha_fin) + 'T00:00:00');
        if (fe >= hoy && fe <= fin) {
          const cliente = gnNombreCliente(p.cliente_id);
          eventos.push({ fecha: fe, tipo: 'Entrega', nombre: p.nombre || '', cliente });
        }
      }
      // Tareas con fecha límite próxima
      (p.tareas || []).forEach(t => {
        if (t.estado === 'completada' || !t.fecha_limite) return;
        const ft = new Date(t.fecha_limite + 'T00:00:00');
        if (ft >= hoy && ft <= fin) {
          const cliente = gnNombreCliente(p.cliente_id);
          eventos.push({ fecha: ft, tipo: 'Tarea', nombre: t.titulo || t.nombre || '', cliente, proyecto: p.nombre || '' });
        }
      });
    });
    eventos.sort((a,b) => a.fecha - b.fecha);
    const mostrar = eventos.slice(0, 3);
    if (mostrar.length === 0) {
      cont.innerHTML = '<div class="gn-widget-empty"><i class="ph ph-calendar-check"></i> Sin eventos próximos</div>';
      return;
    }
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    cont.innerHTML = mostrar.map(ev => `
      <div class="gn-evento-item">
        <div class="gn-evento-fecha">
          <span class="gn-evento-dia">${ev.fecha.getDate()}</span>
          <span class="gn-evento-mes">${meses[ev.fecha.getMonth()]}</span>
        </div>
        <div class="gn-evento-info">
          <span class="gn-evento-tipo">${gnEscape(ev.tipo)}</span>
          <span class="gn-evento-nombre">${gnEscape(ev.nombre)}</span>
          <span class="gn-evento-cliente">${gnEscape(ev.cliente || ev.proyecto || '')}</span>
        </div>
      </div>
    `).join('');
  } catch(e) {
    cont.innerHTML = '<div class="gn-widget-empty">Sin datos disponibles</div>';
  }
}

// ── 6. META MENSUAL ──────────────────────────────────────────────
function gnGetMeta() {
  return parseFloat(localStorage.getItem(GN_META_MENSUAL_KEY) || GN_META_DEFAULT);
}
function gnSetMeta(valor) {
  localStorage.setItem(GN_META_MENSUAL_KEY, valor);
  gnRenderMetaMensual();
}

function gnRenderMetaMensual() {
  const barEl    = document.getElementById('widget-meta-barra');
  const pctEl    = document.getElementById('widget-meta-pct');
  const montoEl  = document.getElementById('widget-meta-monto');
  const metaEl   = document.getElementById('widget-meta-objetivo');
  const inputEl  = document.getElementById('widget-meta-input');
  if (!barEl) return;

  const meta      = gnGetMeta();
  const ingresos  = gnIngresosDelMes();
  const pct       = meta > 0 ? Math.min(Math.round((ingresos / meta) * 100), 100) : 0;
  const color     = pct >= 100 ? '#2D8B5E' : pct >= 60 ? '#C5A253' : '#F87171';

  barEl.style.width  = pct + '%';
  barEl.style.background = color;
  pctEl.textContent  = pct + '%';
  pctEl.style.color  = color;
  montoEl.textContent = 'USD ' + gnFmt(ingresos);
  if (metaEl)  metaEl.textContent = 'USD ' + gnFmt(meta);
  if (inputEl) inputEl.value = meta;
}

function gnGuardarMeta() {
  const inputEl = document.getElementById('widget-meta-input');
  if (!inputEl) return;
  const val = parseFloat(inputEl.value);
  if (!isNaN(val) && val > 0) {
    gnSetMeta(val);
    gnMostrarToast('Meta actualizada a USD ' + gnFmt(val), 'success');
  }
}

function gnIngresosDelMes() {
  try {
    const ahora = new Date();
    const mes = ahora.getMonth();
    const anio = ahora.getFullYear();
    const proyectos = (typeof gnData !== 'undefined' && gnData.proyectos) ? gnData.proyectos : [];
    let total = 0;
    proyectos.forEach(p => {
      (p.pagos || []).forEach(pg => {
        if (!pg.fecha) return;
        const fd = new Date(pg.fecha + 'T00:00:00');
        if (fd.getMonth() === mes && fd.getFullYear() === anio) {
          total += parseFloat(pg.monto || 0);
        }
      });
    });
    return total;
  } catch(e) { return 0; }
}

// ── HELPERS ──────────────────────────────────────────────────────
function gnFmt(n) {
  return Number(n).toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function gnEscape(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function gnNombreCliente(id) {
  try {
    const clientes = (typeof gnData !== 'undefined' && gnData.clientes) ? gnData.clientes : [];
    const c = clientes.find(cl => cl.id === id);
    return c ? (c.nombre || c.name || '') : '';
  } catch(e) { return ''; }
}
function gnAbrirProyecto(id) {
  if (typeof switchSection === 'function') switchSection('proyectos');
  setTimeout(() => {
    const proyectos = (typeof gnData !== 'undefined' && gnData.proyectos) ? gnData.proyectos : [];
    const p = proyectos.find(x => x.id === id);
    if (p && typeof renderDetalleProyecto === 'function') renderDetalleProyecto(p);
  }, 300);
}
function gnMostrarToast(msg, tipo) {
  if (typeof mostrarToast === 'function') { mostrarToast(msg, tipo); return; }
  console.log('[GN]', msg);
}

// ── RENDER GLOBAL — llama todo junto ─────────────────────────────
function gnRenderWidgets() {
  gnRenderSaludo();
  gnRenderPorCobrar();
  gnRenderTareasUrgentes();
  gnRenderProximosEventos();
  gnRenderMetaMensual();
}

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Esperar a que gnData cargue (max 5 intentos cada 800ms)
  let intentos = 0;
  const intervalo = setInterval(() => {
    intentos++;
    const listo = typeof gnData !== 'undefined' && gnData !== null;
    if (listo || intentos >= 5) {
      clearInterval(intervalo);
      gnRenderWidgets();
    }
  }, 800);

  // Re-renderizar si gnData se actualiza globalmente
  const _orig = window.gnRenderDashboard;
  if (typeof _orig === 'function') {
    window.gnRenderDashboard = function(...args) {
      _orig.apply(this, args);
      gnRenderWidgets();
    };
  }
});
