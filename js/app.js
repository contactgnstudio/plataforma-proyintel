// ============================================================
// js/app.js — Lógica principal y navegación (v2)
// ============================================================

function inicializarAppGNStudio() {
  if (window.__gnAppInicializada) return;
  window.__gnAppInicializada = true;

  inicializarCatalogo();
  inicializarClientes();
  inicializarGrupos();
  inicializarCotizaciones();
  inicializarCharts();

  if (!getData('gn_tareas')) setData('gn_tareas', []);

  renderServicios();
  actualizarVistaJSON();
  renderClientes();
  actualizarSelectClientes();
  renderCotizacionesGuardadas();
  renderProyectos();
  renderRegistros();
  actualizarKPIs();

  var hoy = new Date();
  var yyyy = hoy.getFullYear();
  var mm = String(hoy.getMonth() + 1).padStart(2, '0');
  var dd = String(hoy.getDate()).padStart(2, '0');
  var fechaHoy = yyyy + '-' + mm + '-' + dd;

  var gf = document.getElementById('gasto-fecha');
  var pf = document.getElementById('pago-fecha');
  var cf = document.getElementById('cot-fecha');
  var ecDesde = document.getElementById('ec-desde');
  var ecHasta = document.getElementById('ec-hasta');

  if (gf && !gf.value) gf.value = fechaHoy;
  if (pf && !pf.value) pf.value = fechaHoy;
  if (cf && !cf.value) cf.value = fechaHoy;

  if (ecDesde) {
    var primerDiaMes = yyyy + '-' + mm + '-01';
    ecDesde.value = primerDiaMes;
  }

  if (ecHasta) ecHasta.value = fechaHoy;

  var itbmsPeriodo = document.getElementById('itbms-periodo');
  if (itbmsPeriodo) itbmsPeriodo.value = yyyy + '-' + mm;

  var ecProyecto = document.getElementById('ec-proyecto');
  if (ecProyecto) {
    var proyectos = getData(STORAGE_KEYS.PROYECTOS);
    ecProyecto.innerHTML = '<option value="">Todos los proyectos</option>';

    for (var i = 0; i < proyectos.length; i++) {
      ecProyecto.innerHTML +=
        '<option value="' + proyectos[i].id + '">' +
        (proyectos[i].nombre || 'Proyecto sin nombre') +
        '</option>';
    }
  }

  if (typeof actualizarSelectProyectosFinanzas === 'function') {
    actualizarSelectProyectosFinanzas();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof gnAuthInit === 'function') {
    gnAuthInit(inicializarAppGNStudio);
  } else {
    inicializarAppGNStudio();
  }
});

// ============================================================
// js/app.js — Lógica principal y compatibilidad global
// ============================================================

document.addEventListener('DOMContentLoaded', bootstrapApp);

// ============================================================
// BOOTSTRAP
// ============================================================

function bootstrapApp() {
  callIfExists('inicializarCatalogo');
  callIfExists('inicializarClientes');
  callIfExists('inicializarGrupos');
  callIfExists('inicializarCotizaciones');
  callIfExists('inicializarCharts');

  if (typeof getData === 'function' && typeof setData === 'function') {
    if (!getData('gn_tareas')) setData('gn_tareas', []);
  }

  asegurarFormularioCliente();
  asegurarFormularioGrupo();
  setFechasPorDefecto();
  poblarFiltroProyectoEstadoCuenta();

  callIfExists('renderServicios');
  callIfExists('actualizarVistaJSON');
  callIfExists('renderClientes');
  callIfExists('actualizarSelectClientes');
  callIfExists('renderCotizacionesGuardadas');
  callIfExists('renderProyectos');
  callIfExists('renderRegistros');
  callIfExists('actualizarKPIs');
  callIfExists('actualizarSelectClientesProyecto');
}

// ============================================================
// HELPERS GENERALES
// ============================================================

function callIfExists(fnName, args) {
  var fn = window[fnName];
  if (typeof fn !== 'function') return null;

  try {
    return fn.apply(window, Array.isArray(args) ? args : []);
  } catch (error) {
    console.error('Error en ' + fnName + ':', error);
    return null;
  }
}

function storageKey(name, fallback) {
  if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS && STORAGE_KEYS[name]) {
    return STORAGE_KEYS[name];
  }
  return fallback;
}

function safeGetArray(keyName, fallback) {
  if (typeof getData !== 'function') return [];
  var data = getData(storageKey(keyName, fallback));
  return Array.isArray(data) ? data : [];
}

function el(id) {
  return document.getElementById(id);
}

function valueOf(id) {
  var node = el(id);
  return node ? node.value : '';
}

function setValue(id, value) {
  var node = el(id);
  if (node) node.value = value;
}

function setText(id, value) {
  var node = el(id);
  if (node) node.textContent = value;
}

function formatCurrencySafe(value) {
  var n = parseFloat(value);
  if (isNaN(n)) n = 0;
  return typeof formatMoney === 'function' ? formatMoney(n) : ('$' + n.toFixed(2));
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str || '').replace(/'/g, '&#39;');
}

function todayYMD() {
  var d = new Date();
  return d.getFullYear()
    + '-' + String(d.getMonth() + 1).padStart(2, '0')
    + '-' + String(d.getDate()).padStart(2, '0');
}

function currentMonthPrefix() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function sumMontoMes(items, fechaKey, montoKey) {
  var prefix = currentMonthPrefix();
  var total = 0;

  items = Array.isArray(items) ? items : [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i] || {};
    if (String(item[fechaKey] || '').indexOf(prefix) === 0) {
      total += parseFloat(item[montoKey]) || 0;
    }
  }

  return total;
}

function findButtonActionContainer(actionName) {
  var buttons = document.querySelectorAll('button');
  for (var i = 0; i < buttons.length; i++) {
    var onclick = buttons[i].getAttribute('onclick') || '';
    if (onclick.indexOf(actionName) !== -1) {
      return buttons[i].closest('.section-actions') || buttons[i].parentNode;
    }
  }
  return null;
}

// ============================================================
// NAVEGACIÓN
// ============================================================

function switchSection(sectionId) {
  var panels = document.querySelectorAll('.section-panel');
  for (var i = 0; i < panels.length; i++) {
    panels[i].classList.remove('active');
  }

  var target = el(sectionId);
  if (target) target.classList.add('active');

  var links = document.querySelectorAll('.nav-link');
  for (var j = 0; j < links.length; j++) {
    links[j].classList.remove('active');
    if (links[j].getAttribute('data-section') === sectionId) {
      links[j].classList.add('active');
    }
  }

  var titles = {
    dashboard: 'Dashboard',
    negocio: 'Negocio',
    proyectos: 'Proyectos',
    finanzas: 'Finanzas'
  };

  if (el('page-title')) {
    el('page-title').textContent = titles[sectionId] || 'Dashboard';
  }

  if (sectionId === 'negocio') {
    switchSubSection('negocio', 'crm');
  }

  if (sectionId === 'finanzas') {
    switchSubSection('finanzas', 'estado-cuenta');
  }

  var mobileNav = document.querySelector('.mobile-nav-overlay');
  if (mobileNav) mobileNav.classList.remove('open');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchSubSection(parent, subId) {
  var subs = document.querySelectorAll('#' + parent + ' .sub-section');
  for (var i = 0; i < subs.length; i++) {
    subs[i].classList.remove('active');
  }

  var target = el(parent + '-' + subId);
  if (target) target.classList.add('active');

  var tabs = document.querySelectorAll('#' + parent + ' .sub-nav-item');
  for (var j = 0; j < tabs.length; j++) {
    tabs[j].classList.remove('active');
    var onclick = tabs[j].getAttribute('onclick') || '';
    if (onclick.indexOf("'" + subId + "'") !== -1) {
      tabs[j].classList.add('active');
    }
  }
}

function toggleMobileNav() {
  var overlay = document.querySelector('.mobile-nav-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'mobile-nav-overlay';

    var navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      var links = navLinks.querySelectorAll('.nav-link');
      for (var i = 0; i < links.length; i++) {
        overlay.appendChild(links[i].cloneNode(true));
      }
    }

    document.body.appendChild(overlay);
  }

  overlay.classList.toggle('open');
}

// ============================================================
// FECHAS Y FILTROS
// ============================================================

function setFechasPorDefecto() {
  var fechaHoy = todayYMD();
  var mesActual = fechaHoy.slice(0, 7);

  if (el('gasto-fecha') && !valueOf('gasto-fecha')) setValue('gasto-fecha', fechaHoy);
  if (el('pago-fecha') && !valueOf('pago-fecha')) setValue('pago-fecha', fechaHoy);
  if (el('cot-fecha') && !valueOf('cot-fecha')) setValue('cot-fecha', fechaHoy);
  if (el('ec-desde') && !valueOf('ec-desde')) setValue('ec-desde', mesActual + '-01');
  if (el('ec-hasta') && !valueOf('ec-hasta')) setValue('ec-hasta', fechaHoy);
  if (el('itbms-periodo') && !valueOf('itbms-periodo')) setValue('itbms-periodo', mesActual);
}

function poblarFiltroProyectoEstadoCuenta() {
  var select = el('ec-proyecto');
  if (!select) return;

  var proyectos = safeGetArray('PROYECTOS', 'gn_proyectos');
  var html = '<option value="">Todos los proyectos</option>';

  for (var i = 0; i < proyectos.length; i++) {
    html += '<option value="' + escapeAttr(proyectos[i].id || '') + '">' + escapeHtml(proyectos[i].nombre || 'Proyecto') + '</option>';
  }

  select.innerHTML = html;
}

// ============================================================
// FORMULARIOS INLINE — CLIENTES Y GRUPOS
// ============================================================

function asegurarFormularioCliente() {
  if (el('formCliente')) return;

  var acciones = findButtonActionContainer('abrirModalCliente');
  if (!acciones || !acciones.parentNode) return;

  var wrap = document.createElement('div');
  wrap.id = 'panelClienteInline';
  wrap.className = 'form-section';
  wrap.style.display = 'none';
  wrap.style.marginTop = '16px';

  wrap.innerHTML = [
    '<div class="form-header"><h3 class="section-title">Nuevo Cliente</h3></div>',
    '<form id="formCliente" onsubmit="return guardarCliente(event)">',
    '<div class="form-grid">',
    '<div class="form-group">',
    '<label for="cli-codigo">Código <span class="required">*</span></label>',
    '<input type="text" id="cli-codigo" maxlength="30" placeholder="Ej. CLI-001" required>',
    '</div>',
    '<div class="form-group">',
    '<label for="cli-nombre">Nombre <span class="required">*</span></label>',
    '<input type="text" id="cli-nombre" maxlength="150" placeholder="Nombre del cliente" required>',
    '</div>',
    '<div class="form-group">',
    '<label for="cli-contacto">Contacto</label>',
    '<input type="text" id="cli-contacto" maxlength="150" placeholder="Persona de contacto">',
    '</div>',
    '<div class="form-group">',
    '<label for="cli-telefono">Teléfono</label>',
    '<input type="text" id="cli-telefono" maxlength="50" placeholder="+507 6000-0000">',
    '</div>',
    '<div class="form-group">',
    '<label for="cli-email">Email</label>',
    '<input type="email" id="cli-email" maxlength="150" placeholder="correo@cliente.com">',
    '</div>',
    '<div class="form-group full-width">',
    '<label for="cli-direccion">Dirección</label>',
    '<input type="text" id="cli-direccion" maxlength="250" placeholder="Dirección del cliente">',
    '</div>',
    '</div>',
    '<div class="form-actions">',
    '<button type="submit" class="btn-primary">Guardar Cliente</button>',
    '<button type="button" class="btn-secondary" onclick="cerrarModalCliente()">Cancelar</button>',
    '</div>',
    '<div class="form-feedback" id="feedback-cliente"></div>',
    '</form>'
  ].join('');

  acciones.parentNode.insertBefore(wrap, acciones.nextSibling);
}

function asegurarFormularioGrupo() {
  if (el('formGrupo')) return;

  var gruposVisual = el('grupos-visual');
  var seccion = gruposVisual ? gruposVisual.parentNode : null;

  if (!seccion) {
    var acciones = findButtonActionContainer('abrirModalGrupo');
    if (acciones) seccion = acciones.closest('.section');
  }

  if (!seccion) return;

  var wrap = document.createElement('div');
  wrap.id = 'panelGrupoInline';
  wrap.className = 'form-section';
  wrap.style.display = 'none';
  wrap.style.marginBottom = '20px';

  wrap.innerHTML = [
    '<div class="form-header"><h3 class="section-title">Nuevo Grupo</h3></div>',
    '<form id="formGrupo" onsubmit="return guardarGrupo(event)">',
    '<div class="form-grid">',
    '<div class="form-group">',
    '<label for="grp-codigo">Código <span class="required">*</span></label>',
    '<input type="text" id="grp-codigo" maxlength="30" placeholder="Ej. DISENO" required>',
    '</div>',
    '<div class="form-group">',
    '<label for="grp-nombre">Nombre <span class="required">*</span></label>',
    '<input type="text" id="grp-nombre" maxlength="150" placeholder="Nombre del grupo" required>',
    '</div>',
    '<div class="form-group full-width">',
    '<label for="grp-descripcion">Descripción</label>',
    '<input type="text" id="grp-descripcion" maxlength="250" placeholder="Descripción breve del grupo">',
    '</div>',
    '<div class="form-group">',
    '<label for="grp-color">Color</label>',
    '<select id="grp-color">',
    '<option value="green">Verde</option>',
    '<option value="blue">Azul</option>',
    '<option value="purple">Púrpura</option>',
    '<option value="orange">Naranja</option>',
    '<option value="red">Rojo</option>',
    '<option value="teal">Turquesa</option>',
    '<option value="pink">Rosa</option>',
    '<option value="gray">Gris</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label for="grp-orden">Orden</label>',
    '<input type="number" id="grp-orden" min="1" step="1" value="99">',
    '</div>',
    '</div>',
    '<div class="form-actions">',
    '<button type="submit" class="btn-primary">Guardar Grupo</button>',
    '<button type="button" class="btn-secondary" onclick="cerrarModalGrupo()">Cancelar</button>',
    '</div>',
    '<div class="form-feedback" id="feedback-grupo"></div>',
    '</form>'
  ].join('');

  if (gruposVisual && gruposVisual.parentNode === seccion) {
    seccion.insertBefore(wrap, gruposVisual);
  } else {
    seccion.appendChild(wrap);
  }
}

function sugerirCodigoCliente() {
  var clientes = safeGetArray('CLIENTES', 'gn_clientes');
  return 'CLI-' + String(clientes.length + 1).padStart(3, '0');
}

function sugerirCodigoGrupo() {
  var grupos = typeof obtenerGrupos === 'function' ? obtenerGrupos() : [];
  grupos = Array.isArray(grupos) ? grupos : [];
  return 'GRUPO-' + String(grupos.length + 1).padStart(3, '0');
}

function abrirModalCliente() {
  switchSection('negocio');
  switchSubSection('negocio', 'crm');
  asegurarFormularioCliente();

  var panel = el('panelClienteInline');
  if (!panel) return false;

  panel.style.display = 'block';

  if (el('cli-codigo') && !valueOf('cli-codigo')) {
    setValue('cli-codigo', sugerirCodigoCliente());
  }

  setTimeout(function () {
    if (el('cli-codigo')) el('cli-codigo').focus();
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);

  return false;
}

function cerrarModalCliente() {
  if (el('panelClienteInline')) el('panelClienteInline').style.display = 'none';
  if (el('formCliente')) el('formCliente').reset();
  if (el('feedback-cliente')) el('feedback-cliente').textContent = '';
  return false;
}

function abrirModalGrupo() {
  switchSection('negocio');
  switchSubSection('negocio', 'catalogo');
  asegurarFormularioGrupo();

  var panel = el('panelGrupoInline');
  if (!panel) return false;

  panel.style.display = 'block';

  if (el('grp-codigo') && !valueOf('grp-codigo')) {
    setValue('grp-codigo', sugerirCodigoGrupo());
  }

  setTimeout(function () {
    if (el('grp-codigo')) el('grp-codigo').focus();
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);

  return false;
}

function cerrarModalGrupo() {
  if (el('panelGrupoInline')) el('panelGrupoInline').style.display = 'none';
  if (el('formGrupo')) el('formGrupo').reset();
  if (el('feedback-grupo')) el('feedback-grupo').textContent = '';
  return false;
}

// ============================================================
// FINANZAS
// ============================================================

function guardarGasto(event) {
  event.preventDefault();

  if (typeof addItem !== 'function') return false;

  var gasto = {
    id: typeof generarId === 'function' ? generarId() : ('gasto_' + Date.now()),
    tipo: 'gasto',
    fecha: valueOf('gasto-fecha'),
    categoria: valueOf('gasto-categoria'),
    descripcion: String(valueOf('gasto-descripcion') || '').trim(),
    monto: parseFloat(valueOf('gasto-monto')) || 0,
    metodo: valueOf('gasto-metodo'),
    proyectoId: el('gasto-proyecto') ? valueOf('gasto-proyecto') : null,
    creadoEn: new Date().toISOString()
  };

  addItem(storageKey('GASTOS', 'gn_gastos'), gasto);

  if (el('feedback-gasto')) {
    el('feedback-gasto').className = 'form-feedback success';
    el('feedback-gasto').textContent = '✅ Gasto guardado: ' + formatCurrencySafe(gasto.monto);
  }

  if (el('formGasto')) el('formGasto').reset();
  setFechasPorDefecto();

  callIfExists('renderRegistros');
  callIfExists('actualizarKPIs');
  callIfExists('renderChartBalance');
  callIfExists('renderChartGastos');

  if (typeof PROYECTO_ACTUAL !== 'undefined' && PROYECTO_ACTUAL && gasto.proyectoId === PROYECTO_ACTUAL.id) {
    callIfExists('cargarFinancieroProyecto', [PROYECTO_ACTUAL]);
    callIfExists('cargarTimelineProyecto', [PROYECTO_ACTUAL]);
  }

  return false;
}

function guardarPago(event) {
  event.preventDefault();

  if (typeof addItem !== 'function') return false;

  var pago = {
    id: typeof generarId === 'function' ? generarId() : ('pago_' + Date.now()),
    tipo: 'pago',
    fecha: valueOf('pago-fecha'),
    cliente: String(valueOf('pago-cliente') || '').trim(),
    concepto: String(valueOf('pago-concepto') || '').trim(),
    monto: parseFloat(valueOf('pago-monto')) || 0,
    metodo: valueOf('pago-metodo'),
    estado: valueOf('pago-estado'),
    proyectoId: el('pago-proyecto') ? valueOf('pago-proyecto') : null,
    creadoEn: new Date().toISOString()
  };

  addItem(storageKey('PAGOS', 'gn_pagos'), pago);

  if (el('feedback-pago')) {
    el('feedback-pago').className = 'form-feedback success';
    el('feedback-pago').textContent = '✅ Pago registrado: ' + formatCurrencySafe(pago.monto);
  }

  if (el('formPago')) el('formPago').reset();
  setFechasPorDefecto();

  callIfExists('renderRegistros');
  callIfExists('actualizarKPIs');
  callIfExists('renderChartBalance');

  if (typeof PROYECTO_ACTUAL !== 'undefined' && PROYECTO_ACTUAL && pago.proyectoId === PROYECTO_ACTUAL.id) {
    callIfExists('cargarFinancieroProyecto', [PROYECTO_ACTUAL]);
    callIfExists('cargarTimelineProyecto', [PROYECTO_ACTUAL]);
  }

  return false;
}

function renderRegistros() {
  return callIfExists('generarEstadoCuenta');
}

function actualizarKPIs() {
  var pagos = safeGetArray('PAGOS', 'gn_pagos');
  var gastos = safeGetArray('GASTOS', 'gn_gastos');
  var cotizaciones = safeGetArray('COTIZACIONES', 'gn_cotizaciones');
  var proyectos = safeGetArray('PROYECTOS', 'gn_proyectos');
  var clientes = safeGetArray('CLIENTES', 'gn_clientes');

  var ingresosMes = sumMontoMes(pagos, 'fecha', 'monto');
  var gastosMes = sumMontoMes(gastos, 'fecha', 'monto');
  var balanceMes = ingresosMes - gastosMes;

  var cotPendientes = 0;
  for (var i = 0; i < cotizaciones.length; i++) {
    var estadoCot = String((cotizaciones[i] && cotizaciones[i].estado) || '').toLowerCase();
    if (!estadoCot || estadoCot === 'pendiente' || estadoCot === 'borrador' || estadoCot === 'enviada') {
      cotPendientes++;
    }
  }

  var proyectosActivos = 0;
  for (var j = 0; j < proyectos.length; j++) {
    var estadoProy = String((proyectos[j] && proyectos[j].estado) || '').toLowerCase();
    if (estadoProy !== 'completado' && estadoProy !== 'cancelado' && estadoProy !== 'cerrado') {
      proyectosActivos++;
    }
  }

  setText('kpi-ingresos', formatCurrencySafe(ingresosMes));
  setText('kpi-gastos', formatCurrencySafe(gastosMes));
  setText('kpi-balance', formatCurrencySafe(balanceMes));
  setText('kpi-cotizaciones', String(cotPendientes));
  setText('kpi-proyectos', String(proyectosActivos));
  setText('kpi-clientes', String(clientes.length));

  if (el('trend-ingresos')) setText('trend-ingresos', '0%');
  if (el('trend-gastos')) setText('trend-gastos', '0%');
  if (el('trend-balance')) setText('trend-balance', '0%');

  return true;
}

// ============================================================
// PROYECTOS → ACCIONES DE PAGO / GASTO
// ============================================================

function abrirModalGastoProyecto() {
  switchSection('finanzas');
  switchSubSection('finanzas', 'estado-cuenta');

  var proyectoId = null;

  if (typeof PROYECTO_ACTUAL !== 'undefined' && PROYECTO_ACTUAL) {
    proyectoId = PROYECTO_ACTUAL.id || null;
  }

  if (proyectoId) {
    if (el('gasto-proyecto')) setValue('gasto-proyecto', proyectoId);
    if (el('ec-proyecto')) setValue('ec-proyecto', proyectoId);
  }

  if (el('gasto-fecha') && !valueOf('gasto-fecha')) {
    setValue('gasto-fecha', todayYMD());
  }

  var target = el('gasto-monto') || el('gasto-descripcion');
  if (target) {
    setTimeout(function () {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus();
    }, 80);
  }

  return false;
}

function cerrarModalGastoProyecto() {
  return false;
}

function abrirModalPagoProyecto() {
  switchSection('finanzas');
  switchSubSection('finanzas', 'estado-cuenta');

  var proyectoId = null;
  var clienteNombre = '';

  if (typeof PROYECTO_ACTUAL !== 'undefined' && PROYECTO_ACTUAL) {
    proyectoId = PROYECTO_ACTUAL.id || null;
    clienteNombre = PROYECTO_ACTUAL.clienteNombre || PROYECTO_ACTUAL.cliente || '';
  }

  if (proyectoId) {
    if (el('pago-proyecto')) setValue('pago-proyecto', proyectoId);
    if (el('ec-proyecto')) setValue('ec-proyecto', proyectoId);
  }

  if (el('pago-fecha') && !valueOf('pago-fecha')) {
    setValue('pago-fecha', todayYMD());
  }

  var pagoCliente = el('pago-cliente');
  if (pagoCliente && clienteNombre) {
    if (pagoCliente.tagName === 'SELECT') {
      for (var i = 0; i < pagoCliente.options.length; i++) {
        if (pagoCliente.options[i].text === clienteNombre || pagoCliente.options[i].value === clienteNombre) {
          pagoCliente.selectedIndex = i;
          break;
        }
      }
    } else {
      pagoCliente.value = clienteNombre;
    }
  }

  if (el('pago-concepto') && !valueOf('pago-concepto') && typeof PROYECTO_ACTUAL !== 'undefined' && PROYECTO_ACTUAL) {
    setValue('pago-concepto', 'Pago - ' + (PROYECTO_ACTUAL.nombre || 'Proyecto'));
  }

  var target = el('pago-monto') || el('pago-concepto') || el('pago-cliente');
  if (target) {
    setTimeout(function () {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus();
    }, 80);
  }

  return false;
}

function cerrarModalPagoProyecto() {
  return false;
}

// ============================================================
// COTIZACIONES — COMPATIBILIDAD GLOBAL
// ============================================================

function obtenerClientePorId(clienteId) {
  if (!clienteId) return null;

  var clientes = safeGetArray('CLIENTES', 'gn_clientes');
  for (var i = 0; i < clientes.length; i++) {
    if (clientes[i].id === clienteId) return clientes[i];
  }

  return null;
}

function actualizarInfoCliente() {
  var clienteId = valueOf('cot-cliente');
  var cliente = obtenerClientePorId(clienteId);

  if (el('cot-atencion') && cliente && !valueOf('cot-atencion').trim()) {
    setValue('cot-atencion', cliente.contacto || '');
  }

  var posiblesInfoIds = [
    'cot-cliente-info',
    'cot-info-cliente',
    'info-cliente-cot',
    'cliente-info-cot'
  ];

  var infoBox = null;
  for (var i = 0; i < posiblesInfoIds.length; i++) {
    if (el(posiblesInfoIds[i])) {
      infoBox = el(posiblesInfoIds[i]);
      break;
    }
  }

  if (infoBox) {
    if (!cliente) {
      infoBox.innerHTML = '';
      infoBox.style.display = 'none';
    } else {
      infoBox.style.display = 'block';
      infoBox.innerHTML = [
        '<div><strong>Cliente:</strong> ' + escapeHtml(cliente.nombre || '—') + '</div>',
        '<div><strong>Contacto:</strong> ' + escapeHtml(cliente.contacto || '—') + '</div>',
        '<div><strong>Teléfono:</strong> ' + escapeHtml(cliente.telefono || '—') + '</div>',
        '<div><strong>Email:</strong> ' + escapeHtml(cliente.email || '—') + '</div>',
        '<div><strong>Dirección:</strong> ' + escapeHtml(cliente.direccion || '—') + '</div>'
      ].join('');
    }
  }

  return false;
}

function obtenerResumenCotizacionDOM() {
  return {
    subtotal: el('cot-subtotal') ? el('cot-subtotal').textContent : formatCurrencySafe(0),
    itbms: el('cot-itbms-monto') ? el('cot-itbms-monto').textContent : formatCurrencySafe(0),
    descuento: el('cot-descuento-monto') ? el('cot-descuento-monto').textContent : formatCurrencySafe(0),
    total: el('cot-total') ? el('cot-total').textContent : formatCurrencySafe(0)
  };
}

function obtenerItemsCotizacionPreview() {
  var rows = [];
  var tbody = el('tbodyItemsCotizacion');

  if (tbody) {
    var trs = tbody.querySelectorAll('tr');
    for (var i = 0; i < trs.length; i++) {
      var tds = trs[i].querySelectorAll('td');
      if (tds.length >= 6) {
        rows.push({
          descripcion: tds[1] ? tds[1].textContent.trim() : '',
          cantidad: tds[2] ? tds[2].textContent.trim() : '',
          unidad: tds[3] ? tds[3].textContent.trim() : '',
          precio: tds[4] ? tds[4].textContent.trim() : '',
          total: tds[5] ? tds[5].textContent.trim() : ''
        });
      }
    }
  }

  if (rows.length === 0 && typeof itemsCotizacionActual !== 'undefined' && Array.isArray(itemsCotizacionActual)) {
    for (var j = 0; j < itemsCotizacionActual.length; j++) {
      var item = itemsCotizacionActual[j];
      rows.push({
        descripcion: (item.codigo ? '[' + item.codigo + '] ' : '') + (item.descripcion || ''),
        cantidad: item.cantidad || 0,
        unidad: item.unidad || '',
        precio: formatCurrencySafe(item.precioUnitario || 0),
        total: formatCurrencySafe((item.cantidad || 0) * (item.precioUnitario || 0))
      });
    }
  }

  return rows;
}

function vistaPreviaCotizacion() {
  var clienteId = valueOf('cot-cliente');
  var cliente = obtenerClientePorId(clienteId);
  var proyecto = String(valueOf('cot-proyecto') || '').trim();
  var atencion = String(valueOf('cot-atencion') || '').trim();
  var fecha = valueOf('cot-fecha') || todayYMD();
  var alcance = String(valueOf('cot-alcance') || '').trim();
  var resumen = obtenerResumenCotizacionDOM();
  var items = obtenerItemsCotizacionPreview();

  if (!clienteId) {
    alert('Selecciona un cliente antes de ver la vista previa');
    return false;
  }

  if (!proyecto) {
    alert('Ingresa el nombre del proyecto');
    return false;
  }

  var rows = '';
  for (var i = 0; i < items.length; i++) {
    rows += [
      '<tr>',
      '<td style="padding:8px;border:1px solid #ddd;">' + (i + 1) + '</td>',
      '<td style="padding:8px;border:1px solid #ddd;">' + escapeHtml(items[i].descripcion) + '</td>',
      '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + escapeHtml(items[i].cantidad) + '</td>',
      '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + escapeHtml(items[i].unidad) + '</td>',
      '<td style="padding:8px;border:1px solid #ddd;text-align:right;">' + escapeHtml(items[i].precio) + '</td>',
      '<td style="padding:8px;border:1px solid #ddd;text-align:right;">' + escapeHtml(items[i].total) + '</td>',
      '</tr>'
    ].join('');
  }

  if (!rows) {
    rows = '<tr><td colspan="6" style="padding:12px;border:1px solid #ddd;text-align:center;color:#666;">No hay items agregados</td></tr>';
  }

  var html = [
    '<!DOCTYPE html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="UTF-8">',
    '<title>Vista Previa Cotización</title>',
    '<style>',
    'body{font-family:Arial,sans-serif;margin:30px;color:#222;}',
    'h1,h2,h3{margin:0 0 12px;}',
    '.top{display:flex;justify-content:space-between;gap:20px;margin-bottom:24px;}',
    '.box{margin-bottom:18px;}',
    'table{width:100%;border-collapse:collapse;margin-top:16px;}',
    '.totales{width:360px;margin-left:auto;margin-top:20px;border-collapse:collapse;}',
    '.totales td{padding:8px;border:1px solid #ddd;}',
    '.muted{color:#666;}',
    '.actions{margin-bottom:20px;}',
    'button{padding:10px 14px;margin-right:8px;border:none;border-radius:8px;cursor:pointer;}',
    '.print{background:#6bbd45;color:#fff;}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="actions"><button class="print" onclick="window.print()">Imprimir / PDF</button></div>',
    '<div class="top">',
    '<div><h1>GN Studio</h1><div class="muted">Vista previa de cotización</div></div>',
    '<div>',
    '<div><strong>Fecha:</strong> ' + escapeHtml(typeof formatDate === 'function' ? formatDate(fecha) : fecha) + '</div>',
    '<div><strong>Proyecto:</strong> ' + escapeHtml(proyecto) + '</div>',
    '</div>',
    '</div>',
    '<div class="box">',
    '<h3>Cliente</h3>',
    '<div><strong>Nombre:</strong> ' + escapeHtml(cliente ? cliente.nombre : '—') + '</div>',
    '<div><strong>Contacto:</strong> ' + escapeHtml(atencion || (cliente ? cliente.contacto : '—')) + '</div>',
    '<div><strong>Teléfono:</strong> ' + escapeHtml(cliente ? cliente.telefono : '—') + '</div>',
    '<div><strong>Email:</strong> ' + escapeHtml(cliente ? cliente.email : '—') + '</div>',
    '<div><strong>Dirección:</strong> ' + escapeHtml(cliente ? cliente.direccion : '—') + '</div>',
    '</div>',
    '<div class="box">',
    '<h3>Alcance</h3>',
    '<div>' + escapeHtml(alcance || 'Sin descripción de alcance') + '</div>',
    '</div>',
    '<table>',
    '<thead>',
    '<tr>',
    '<th style="padding:8px;border:1px solid #ddd;">#</th>',
    '<th style="padding:8px;border:1px solid #ddd;">Descripción</th>',
    '<th style="padding:8px;border:1px solid #ddd;">Cant.</th>',
    '<th style="padding:8px;border:1px solid #ddd;">Unidad</th>',
    '<th style="padding:8px;border:1px solid #ddd;">Precio Unit.</th>',
    '<th style="padding:8px;border:1px solid #ddd;">Total</th>',
    '</tr>',
    '</thead>',
    '<tbody>' + rows + '</tbody>',
    '</table>',
    '<table class="totales">',
    '<tr><td><strong>Subtotal</strong></td><td style="text-align:right;">' + escapeHtml(resumen.subtotal) + '</td></tr>',
    '<tr><td><strong>ITBMS</strong></td><td style="text-align:right;">' + escapeHtml(resumen.itbms) + '</td></tr>',
    '<tr><td><strong>Descuento</strong></td><td style="text-align:right;">' + escapeHtml(resumen.descuento) + '</td></tr>',
    '<tr><td><strong>TOTAL</strong></td><td style="text-align:right;color:#6bbd45;"><strong>' + escapeHtml(resumen.total) + '</strong></td></tr>',
    '</table>',
    '</body>',
    '</html>'
  ].join('');

  var preview = window.open('', '_blank');
  if (!preview) {
    alert('El navegador bloqueó la ventana emergente de vista previa');
    return false;
  }

  preview.document.open();
  preview.document.write(html);
  preview.document.close();

  return false;
}

function limpiarCotizacion() {
  if (el('cot-cliente')) setValue('cot-cliente', '');
  if (el('cot-proyecto')) setValue('cot-proyecto', '');
  if (el('cot-atencion')) setValue('cot-atencion', '');
  if (el('cot-fecha')) setValue('cot-fecha', todayYMD());
  if (el('cot-alcance')) setValue('cot-alcance', '');
  if (el('cot-itbms')) setValue('cot-itbms', '1');
  if (el('cot-descuento')) setValue('cot-descuento', '0');

  if (el('cot-item-servicio')) setValue('cot-item-servicio', '');
  if (el('cot-item-cantidad-catalogo')) setValue('cot-item-cantidad-catalogo', '1');

  if (el('cot-item-desc-manual')) setValue('cot-item-desc-manual', '');
  if (el('cot-item-cantidad-manual')) setValue('cot-item-cantidad-manual', '1');
  if (el('cot-item-unidad-manual')) setValue('cot-item-unidad-manual', 'und');
  if (el('cot-item-precio-manual')) setValue('cot-item-precio-manual', '');
  if (el('cot-item-itbms-manual')) setValue('cot-item-itbms-manual', '1');

  if (typeof itemsCotizacionActual !== 'undefined' && Array.isArray(itemsCotizacionActual)) {
    itemsCotizacionActual.length = 0;
  }

  if (el('tbodyItemsCotizacion')) el('tbodyItemsCotizacion').innerHTML = '';

  if (el('items-agrupados-container')) {
    el('items-agrupados-container').innerHTML = '<div class="tabla-vacia"><div class="tabla-vacia-icon">🧾</div>No hay items agregados</div>';
  }

  if (el('resumen-grupos')) el('resumen-grupos').innerHTML = '';

  setText('cot-subtotal', formatCurrencySafe(0));
  setText('cot-itbms-monto', formatCurrencySafe(0));
  setText('cot-descuento-monto', formatCurrencySafe(0));
  setText('cot-total', formatCurrencySafe(0));

  if (el('feedback-cotizacion')) {
    el('feedback-cotizacion').className = 'form-feedback';
    el('feedback-cotizacion').textContent = '';
  }

  actualizarInfoCliente();
  return false;
}

// ============================================================
// EXPORTAR
// ============================================================

function exportarTodo() {
  if (typeof localStorage === 'undefined') return false;

  var data = {};
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key && key.indexOf('gn_') === 0) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        data[key] = localStorage.getItem(key);
      }
    }
  }

  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');

  a.href = url;
  a.download = 'gnstudio-backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
  return false;
}
