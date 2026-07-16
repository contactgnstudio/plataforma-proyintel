// ============================================================
// js/app.js — Lógica principal y navegación (v2)
// ============================================================

function gnSafeCall(fnName) {
  if (typeof window[fnName] === 'function') {
    return window[fnName].apply(null, Array.prototype.slice.call(arguments, 1));
  }
  return null;
}

function gnGetFechaHoyISO() {
  var hoy = new Date();
  var yyyy = hoy.getFullYear();
  var mm = String(hoy.getMonth() + 1).padStart(2, '0');
  var dd = String(hoy.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function gnFormatMoney(valor) {
  if (typeof formatMoney === 'function') return formatMoney(valor);
  var num = parseFloat(valor || 0);
  return 'USD ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function gnFormatDate(fecha) {
  if (typeof formatDate === 'function') return formatDate(fecha);
  if (!fecha) return '-';
  var d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString('es-PA');
}

function gnGetDataByKey(keyName, fallback) {
  fallback = fallback || [];
  if (typeof STORAGE_KEYS === 'undefined' || !STORAGE_KEYS[keyName]) return fallback;
  if (typeof getData !== 'function') return fallback;
  return getData(STORAGE_KEYS[keyName]) || fallback;
}

function gnRenderDashboardExtras() {
  renderActividadReciente();
  renderPipelineMini();
}

function gnConfigurarFechasIniciales() {
  var fechaHoy = gnGetFechaHoyISO();
  var hoy = new Date();
  var yyyy = hoy.getFullYear();
  var mm = String(hoy.getMonth() + 1).padStart(2, '0');

  var gf = document.getElementById('gasto-fecha');
  var pf = document.getElementById('pago-fecha');
  var cf = document.getElementById('cot-fecha');
  var ecDesde = document.getElementById('ec-desde');
  var ecHasta = document.getElementById('ec-hasta');
  var itbmsPeriodo = document.getElementById('itbms-periodo');

  if (gf && !gf.value) gf.value = fechaHoy;
  if (pf && !pf.value) pf.value = fechaHoy;
  if (cf && !cf.value) cf.value = fechaHoy;

  if (ecDesde && !ecDesde.value) {
    ecDesde.value = yyyy + '-' + mm + '-01';
  }

  if (ecHasta && !ecHasta.value) {
    ecHasta.value = fechaHoy;
  }

  if (itbmsPeriodo && !itbmsPeriodo.value) {
    itbmsPeriodo.value = yyyy + '-' + mm;
  }
}

function gnActualizarSelectProyectoEstadoCuenta() {
  var ecProyecto = document.getElementById('ec-proyecto');
  if (!ecProyecto) return;

  var proyectos = gnGetDataByKey('PROYECTOS', []);
  ecProyecto.innerHTML = '<option value="">Todos los proyectos</option>';

  for (var i = 0; i < proyectos.length; i++) {
    ecProyecto.innerHTML +=
      '<option value="' + proyectos[i].id + '">' +
      (proyectos[i].nombre || 'Proyecto sin nombre') +
      '</option>';
  }
}

function inicializarAppGNStudio() {
  if (window.__gnAppInicializada) return;
  window.__gnAppInicializada = true;

  gnSafeCall('inicializarCatalogo');
  gnSafeCall('inicializarClientes');
  gnSafeCall('inicializarGrupos');
  gnSafeCall('inicializarCotizaciones');
  gnSafeCall('inicializarCharts');

  if (typeof getData === 'function' && typeof setData === 'function') {
    if (!getData('gn_tareas')) setData('gn_tareas', []);
  }

  gnSafeCall('renderServicios');
  actualizarVistaJSON();
  gnSafeCall('renderClientes');
  gnSafeCall('actualizarSelectClientes');
  gnSafeCall('renderCotizacionesGuardadas');

  if (typeof renderProyectos === 'function') {
    renderProyectos();
  } else {
    renderProyectosSimple();
  }

  renderRegistros();
  actualizarKPIs();
  gnRenderDashboardExtras();
  gnConfigurarFechasIniciales();
  gnActualizarSelectProyectoEstadoCuenta();

  gnSafeCall('actualizarSelectProyectosFinanzas');
  gnSafeCall('generarEstadoCuenta');
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof gnAuthInit === 'function') {
    gnAuthInit(inicializarAppGNStudio);
  } else {
    inicializarAppGNStudio();
  }
});

// ============================================================
// NAVEGACIÓN PRINCIPAL
// ============================================================

function switchSection(sectionId) {
  var panels = document.querySelectorAll('.section-panel');
  for (var i = 0; i < panels.length; i++) {
    panels[i].classList.remove('active');
  }

  var target = document.getElementById(sectionId);
  if (target) target.classList.add('active');

  var links = document.querySelectorAll('.nav-link');
  for (var j = 0; j < links.length; j++) {
    links[j].classList.remove('active');
    if (links[j].getAttribute('data-section') === sectionId) {
      links[j].classList.add('active');
    }
  }

  var titulos = {
    dashboard: 'Dashboard',
    negocio: 'Negocio',
    proyectos: 'Proyectos',
    finanzas: 'Finanzas'
  };

  var pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = titulos[sectionId] || 'Dashboard';

  if (sectionId === 'negocio') switchSubSection('negocio', 'crm');
  if (sectionId === 'finanzas') switchSubSection('finanzas', 'estado-cuenta');

  var mobileNav = document.querySelector('.mobile-nav-overlay');
  if (mobileNav) mobileNav.classList.remove('open');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchSubSection(parent, subId) {
  var subs = document.querySelectorAll('#' + parent + ' .sub-section');
  for (var i = 0; i < subs.length; i++) {
    subs[i].classList.remove('active');
  }

  var target = document.getElementById(parent + '-' + subId);
  if (target) target.classList.add('active');

  var tabs = document.querySelectorAll('#' + parent + ' .sub-nav-item');
  for (var j = 0; j < tabs.length; j++) {
    tabs[j].classList.remove('active');
    var onclick = tabs[j].getAttribute('onclick');
    if (onclick && onclick.indexOf("'" + subId + "'") !== -1) {
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
// GASTOS
// ============================================================

function guardarGasto(event) {
  event.preventDefault();

  var feedback = document.getElementById('feedback-gasto');
  var gasto = {
    id: typeof generarId === 'function' ? generarId() : String(Date.now()),
    tipo: 'gasto',
    fecha: document.getElementById('gasto-fecha').value,
    categoria: document.getElementById('gasto-categoria').value,
    descripcion: document.getElementById('gasto-descripcion').value.trim(),
    monto: parseFloat(document.getElementById('gasto-monto').value || 0),
    metodo: document.getElementById('gasto-metodo').value,
    proyectoId: document.getElementById('gasto-proyecto') ? document.getElementById('gasto-proyecto').value : null,
    creadoEn: new Date().toISOString()
  };

  if (typeof addItem === 'function' && typeof STORAGE_KEYS !== 'undefined') {
    addItem(STORAGE_KEYS.GASTOS, gasto);
  }

  if (feedback) {
    feedback.className = 'form-feedback success';
    feedback.textContent = '✅ Gasto guardado: ' + gnFormatMoney(gasto.monto);
  }

  var form = document.getElementById('formGasto');
  if (form) form.reset();

  var gastoFecha = document.getElementById('gasto-fecha');
  if (gastoFecha) gastoFecha.value = gnGetFechaHoyISO();

  renderRegistros();
  actualizarKPIs();
  gnRenderDashboardExtras();

  if (typeof renderChartBalance === 'function') renderChartBalance();
  if (typeof renderChartGastos === 'function') renderChartGastos();

  if (typeof PROYECTO_ACTUAL !== 'undefined' && PROYECTO_ACTUAL && gasto.proyectoId === PROYECTO_ACTUAL.id) {
    if (typeof cargarFinancieroProyecto === 'function') cargarFinancieroProyecto(PROYECTO_ACTUAL);
    if (typeof cargarTimelineProyecto === 'function') cargarTimelineProyecto(PROYECTO_ACTUAL);
  }

  return false;
}

// ============================================================
// PAGOS
// ============================================================

function guardarPago(event) {
  event.preventDefault();

  var feedback = document.getElementById('feedback-pago');
  var pago = {
    id: typeof generarId === 'function' ? generarId() : String(Date.now()),
    tipo: 'pago',
    fecha: document.getElementById('pago-fecha').value,
    cliente: document.getElementById('pago-cliente').value.trim(),
    concepto: document.getElementById('pago-concepto').value.trim(),
    monto: parseFloat(document.getElementById('pago-monto').value || 0),
    metodo: document.getElementById('pago-metodo').value,
    estado: document.getElementById('pago-estado').value,
    proyectoId: document.getElementById('pago-proyecto') ? document.getElementById('pago-proyecto').value : null,
    creadoEn: new Date().toISOString()
  };

  if (typeof addItem === 'function' && typeof STORAGE_KEYS !== 'undefined') {
    addItem(STORAGE_KEYS.PAGOS, pago);
  }

  if (feedback) {
    feedback.className = 'form-feedback success';
    feedback.textContent = '✅ Pago registrado: ' + gnFormatMoney(pago.monto);
  }

  var form = document.getElementById('formPago');
  if (form) form.reset();

  var pagoFecha = document.getElementById('pago-fecha');
  if (pagoFecha) pagoFecha.value = gnGetFechaHoyISO();

  renderRegistros();
  actualizarKPIs();
  gnRenderDashboardExtras();

  if (typeof renderChartBalance === 'function') renderChartBalance();

  if (typeof PROYECTO_ACTUAL !== 'undefined' && PROYECTO_ACTUAL && pago.proyectoId === PROYECTO_ACTUAL.id) {
    if (typeof cargarFinancieroProyecto === 'function') cargarFinancieroProyecto(PROYECTO_ACTUAL);
    if (typeof cargarTimelineProyecto === 'function') cargarTimelineProyecto(PROYECTO_ACTUAL);
  }

  return false;
}

// ============================================================
// PROYECTOS (lista simple para compatibilidad)
// ============================================================

function renderProyectosSimple() {
  var tbody = document.getElementById('tbodyProyectos');
  if (!tbody) return;

  var proyectos = gnGetDataByKey('PROYECTOS', []);
  proyectos.sort(function(a, b) {
    return new Date(b.creadoEn || 0) - new Date(a.creadoEn || 0);
  });

  if (proyectos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="tabla-vacia">' +
      '<div class="tabla-vacia-icon">📁</div>No hay proyectos registrados' +
      '</td></tr>';
    return;
  }

  var html = '';

  for (var i = 0; i < proyectos.length; i++) {
    var p = proyectos[i];
    var avancePct = Math.round(p.avance || 0);
    var estadoClass =
      p.estado === 'en_progreso' ? 'estado-cotizado' :
      p.estado === 'completado' ? 'estado-aprobado' :
      'estado-vencido';

    var estadoText =
      p.estado === 'en_progreso' ? 'En Progreso' :
      p.estado === 'completado' ? 'Completado' :
      'Pausado';

    html +=
      '<tr>' +
        '<td><strong style="color:#a855f7;">#' + (i + 1) + '</strong></td>' +
        '<td>' + (p.clienteNombre || '-') + '</td>' +
        '<td>' + (p.nombre || '-') + '</td>' +
        '<td class="td-monto">' + gnFormatMoney(p.presupuesto || 0) + '</td>' +
        '<td>' +
          '<div style="background:rgba(255,255,255,0.05);border-radius:4px;height:8px;overflow:hidden;">' +
            '<div style="background:linear-gradient(90deg,#6bbd45,#4f8cff);height:100%;width:' + avancePct + '%;border-radius:4px;transition:width 0.5s;"></div>' +
          '</div>' +
          '<span style="font-size:11px;color:#8a8a96;margin-top:4px;display:block;">' + avancePct + '%</span>' +
        '</td>' +
        '<td><span class="estado-badge ' + estadoClass + '">' + estadoText + '</span></td>' +
        '<td>' + gnFormatDate(p.fechaInicio) + '</td>' +
        '<td class="td-actions">' +
          '<button class="btn-icon" onclick="avanzarProyecto(\'' + p.id + '\')" title="Avanzar" style="background:rgba(107,189,69,0.1);color:#6bbd45;">➜</button>' +
          '<button class="btn-icon" onclick="eliminarProyecto(\'' + p.id + '\')" title="Eliminar" style="margin-left:4px;">🗑️</button>' +
        '</td>' +
      '</tr>';
  }

  tbody.innerHTML = html;
}

function avanzarProyecto(id) {
  if (typeof findItem !== 'function' || typeof updateItem !== 'function' || typeof STORAGE_KEYS === 'undefined') return;

  var proyecto = findItem(STORAGE_KEYS.PROYECTOS, id);
  if (!proyecto) return;

  var nuevoAvance = Math.min((proyecto.avance || 0) + 25, 100);
  var nuevoEstado = nuevoAvance >= 100 ? 'completado' : (proyecto.estado || 'en_progreso');

  updateItem(STORAGE_KEYS.PROYECTOS, id, {
    avance: nuevoAvance,
    estado: nuevoEstado
  });

  if (typeof renderProyectos === 'function') {
    renderProyectos();
  } else {
    renderProyectosSimple();
  }

  actualizarKPIs();
}

function eliminarProyecto(id) {
  if (!confirm('¿Eliminar este proyecto?')) return;
  if (typeof deleteItem !== 'function' || typeof STORAGE_KEYS === 'undefined') return;

  deleteItem(STORAGE_KEYS.PROYECTOS, id);

  if (typeof renderProyectos === 'function') {
    renderProyectos();
  } else {
    renderProyectosSimple();
  }

  actualizarKPIs();
}

// ============================================================
// REGISTROS
// ============================================================

function renderRegistros(filtro) {
  var tbody = document.getElementById('tbodyRegistros');
  if (!tbody) return;

  var gastos = gnGetDataByKey('GASTOS', []);
  var pagos = gnGetDataByKey('PAGOS', []);
  var todos = [];

  for (var i = 0; i < gastos.length; i++) {
    todos.push(Object.assign({}, gastos[i], {
      tipoLabel: 'Gasto',
      categoriaLabel:
        (typeof GASTO_LABELS !== 'undefined' && GASTO_LABELS[gastos[i].categoria]) ?
        GASTO_LABELS[gastos[i].categoria] :
        (gastos[i].categoria || 'Gasto')
    }));
  }

  for (var j = 0; j < pagos.length; j++) {
    todos.push(Object.assign({}, pagos[j], {
      tipoLabel: 'Pago',
      categoriaLabel: pagos[j].concepto || 'Pago'
    }));
  }

  todos.sort(function(a, b) {
    return new Date(b.fecha || 0) - new Date(a.fecha || 0);
  });

  if (filtro && filtro !== 'todos') {
    todos = todos.filter(function(r) {
      return r.tipo === filtro;
    });
  }

  if (todos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="tabla-vacia">' +
      '<div class="tabla-vacia-icon">📭</div>No hay registros' +
      '</td></tr>';
    return;
  }

  var html = '';

  for (var k = 0; k < todos.length; k++) {
    var r = todos[k];
    var tipoColor = r.tipo === 'gasto' ? '#ef4444' : '#6bbd45';

    html +=
      '<tr>' +
        '<td>' + gnFormatDate(r.fecha) + '</td>' +
        '<td><span style="color:' + tipoColor + ';font-weight:600;font-size:11px;text-transform:uppercase;">' + r.tipoLabel + '</span></td>' +
        '<td>' + (r.categoriaLabel || '-') + '</td>' +
        '<td>' + (r.descripcion || r.concepto || '-') + '</td>' +
        '<td class="td-monto" style="color:' + tipoColor + ';">' + (r.tipo === 'gasto' ? '- ' : '') + gnFormatMoney(r.monto || 0) + '</td>' +
        '<td>' + (r.metodo || '-') + '</td>' +
      '</tr>';
  }

  tbody.innerHTML = html;
}

function filtrarRegistros(tipo) {
  renderRegistros(tipo);
}

// ============================================================
// KPIs
// ============================================================

function actualizarKPIs() {
  var gastos = gnGetDataByKey('GASTOS', []);
  var pagos = gnGetDataByKey('PAGOS', []);
  var cotizaciones = gnGetDataByKey('COTIZACIONES', []);
  var proyectos = gnGetDataByKey('PROYECTOS', []);
  var clientes = gnGetDataByKey('CLIENTES', []);

  var totalGastos = 0;
  for (var i = 0; i < gastos.length; i++) {
    totalGastos += parseFloat(gastos[i].monto || 0);
  }

  var totalPagos = 0;
  for (var j = 0; j < pagos.length; j++) {
    totalPagos += parseFloat(pagos[j].monto || 0);
  }

  var cotizacionesActivas = 0;
  for (var k = 0; k < cotizaciones.length; k++) {
    if (cotizaciones[k].estado === 'cotizado') cotizacionesActivas++;
  }

  var proyectosEnCurso = 0;
  for (var m = 0; m < proyectos.length; m++) {
    if (proyectos[m].estado === 'en_progreso') proyectosEnCurso++;
  }

  var kpiIngresos = document.getElementById('kpi-ingresos');
  var kpiGastos = document.getElementById('kpi-gastos');
  var kpiBalance = document.getElementById('kpi-balance');
  var kpiCot = document.getElementById('kpi-cotizaciones');
  var kpiProy = document.getElementById('kpi-proyectos');
  var kpiCli = document.getElementById('kpi-clientes');

  if (kpiIngresos) kpiIngresos.textContent = gnFormatMoney(totalPagos);
  if (kpiGastos) kpiGastos.textContent = gnFormatMoney(totalGastos);
  if (kpiBalance) kpiBalance.textContent = gnFormatMoney(totalPagos - totalGastos);
  if (kpiCot) kpiCot.textContent = cotizacionesActivas;
  if (kpiProy) kpiProy.textContent = proyectosEnCurso;
  if (kpiCli) kpiCli.textContent = clientes.length;
}

// ============================================================
// ACTIVIDAD RECIENTE
// ============================================================

function renderActividadReciente() {
  var tbody = document.getElementById('tbodyActividadReciente');
  if (!tbody) return;

  var gastos = gnGetDataByKey('GASTOS', []);
  var pagos = gnGetDataByKey('PAGOS', []);
  var cotizaciones = gnGetDataByKey('COTIZACIONES', []);
  var todos = [];

  for (var i = 0; i < Math.min(gastos.length, 5); i++) {
    todos.push({
      fecha: gastos[i].fecha,
      tipo: 'gasto',
      descripcion: gastos[i].descripcion || '-',
      monto: gastos[i].monto || 0,
      estado: 'Completado'
    });
  }

  for (var j = 0; j < Math.min(pagos.length, 5); j++) {
    todos.push({
      fecha: pagos[j].fecha,
      tipo: 'pago',
      descripcion: pagos[j].concepto || '-',
      monto: pagos[j].monto || 0,
      estado: pagos[j].estado || 'Recibido'
    });
  }

  for (var k = 0; k < Math.min(cotizaciones.length, 5); k++) {
    todos.push({
      fecha: cotizaciones[k].fecha,
      tipo: 'cotizacion',
      descripcion: cotizaciones[k].proyecto || '-',
      monto: cotizaciones[k].total || 0,
      estado: cotizaciones[k].estado || 'Cotizado'
    });
  }

  todos.sort(function(a, b) {
    return new Date(b.fecha || 0) - new Date(a.fecha || 0);
  });

  todos = todos.slice(0, 10);

  if (todos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="tabla-vacia">No hay actividad reciente</td></tr>';
    return;
  }

  var html = '';

  for (var m = 0; m < todos.length; m++) {
    var r = todos[m];
    var tipoColor = r.tipo === 'gasto' ? '#ef4444' : (r.tipo === 'pago' ? '#6bbd45' : '#4f8cff');
    var tipoLabel = r.tipo === 'gasto' ? 'Gasto' : (r.tipo === 'pago' ? 'Pago' : 'Cotización');
    var estadoClass =
      r.estado === 'aprobado' || r.estado === 'recibido' || r.estado === 'Completado'
        ? 'estado-aprobado'
        : 'estado-cotizado';

    html +=
      '<tr>' +
        '<td>' + gnFormatDate(r.fecha) + '</td>' +
        '<td><span style="color:' + tipoColor + ';font-weight:600;font-size:11px;text-transform:uppercase;">' + tipoLabel + '</span></td>' +
        '<td>' + (r.descripcion || '-') + '</td>' +
        '<td class="td-monto">' + gnFormatMoney(r.monto || 0) + '</td>' +
        '<td><span class="estado-badge ' + estadoClass + '">' + (r.estado || '-') + '</span></td>' +
      '</tr>';
  }

  tbody.innerHTML = html;
}

// ============================================================
// PIPELINE MINI
// ============================================================

function renderPipelineMini() {
  var container = document.getElementById('pipeline-mini');
  if (!container) return;

  var cotizaciones = gnGetDataByKey('COTIZACIONES', []);
  var counts = {
    cotizado: 0,
    aprobado: 0,
    en_progreso: 0,
    vencido: 0,
    rechazado: 0
  };

  for (var i = 0; i < cotizaciones.length; i++) {
    var estado = cotizaciones[i].estado;
    if (counts[estado] !== undefined) counts[estado]++;
  }

  var total = cotizaciones.length || 1;
  var pctCotizado = Math.round((counts.cotizado / total) * 100);
  var pctAprobado = Math.round((counts.aprobado / total) * 100);
  var pctProgreso = Math.round((counts.en_progreso / total) * 100);
  var pctVencido = Math.round((counts.vencido / total) * 100);

  container.innerHTML =
    '<div class="pipeline-bar">' +
      '<div class="pipeline-segment" style="width:' + pctCotizado + '%;background:#4f8cff;">' + counts.cotizado + ' Cotizados</div>' +
      '<div class="pipeline-segment" style="width:' + pctAprobado + '%;background:#6bbd45;">' + counts.aprobado + ' Aprobados</div>' +
      '<div class="pipeline-segment" style="width:' + pctProgreso + '%;background:#a855f7;">' + counts.en_progreso + ' En Progreso</div>' +
      '<div class="pipeline-segment" style="width:' + pctVencido + '%;background:#64748b;">' + counts.vencido + ' Vencidos</div>' +
    '</div>' +
    '<div class="pipeline-legend">' +
      '<span><span class="dot" style="background:#4f8cff;"></span> Cotizado</span>' +
      '<span><span class="dot" style="background:#6bbd45;"></span> Aprobado</span>' +
      '<span><span class="dot" style="background:#a855f7;"></span> En Progreso</span>' +
      '<span><span class="dot" style="background:#ef4444;"></span> Rechazado</span>' +
    '</div>';
}

// ============================================================
// JSON PREVIEW
// ============================================================

function actualizarVistaJSON() {
  var el =
    document.getElementById('json-preview') ||
    document.getElementById('vista-json') ||
    document.getElementById('jsonPreview');

  if (!el || typeof getData !== 'function') return;

  var data = {
    servicios: gnGetDataByKey('SERVICIOS', []),
    clientes: gnGetDataByKey('CLIENTES', []),
    cotizaciones: gnGetDataByKey('COTIZACIONES', []),
    proyectos: gnGetDataByKey('PROYECTOS', []),
    gastos: gnGetDataByKey('GASTOS', []),
    pagos: gnGetDataByKey('PAGOS', []),
    grupos: getData('gn_grupos_servicios') || [],
    tareas: getData('gn_tareas') || []
  };

  el.textContent = JSON.stringify(data, null, 2);
}

// ============================================================
// EXPORTAR
// ============================================================

function exportarTodo() {
  if (typeof getData !== 'function') return;

  var data = {
    servicios: gnGetDataByKey('SERVICIOS', []),
    clientes: gnGetDataByKey('CLIENTES', []),
    cotizaciones: gnGetDataByKey('COTIZACIONES', []),
    proyectos: gnGetDataByKey('PROYECTOS', []),
    gastos: gnGetDataByKey('GASTOS', []),
    pagos: gnGetDataByKey('PAGOS', []),
    grupos: getData('gn_grupos_servicios') || [],
    tareas: getData('gn_tareas') || [],
    exportadoEn: new Date().toISOString()
  };

  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');

  a.href = url;
  a.download = 'gn-studio-backup-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();

  URL.revokeObjectURL(url);
}
