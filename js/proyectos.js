// ============================================================
// js/proyectos.js — Módulo de Proyectos
// ============================================================

var PROYECTO_ACTUAL = null;
var chartProyectoInstance = null;

// ============================================================
// HELPERS
// ============================================================

function proyEl(id) {
  return document.getElementById(id);
}

function proySafeArray(value) {
  return Array.isArray(value) ? value : [];
}

function proyMoney(value) {
  var n = parseFloat(value) || 0;
  return typeof formatMoney === 'function' ? formatMoney(n) : ('$' + n.toFixed(2));
}

function proyDate(value) {
  if (!value) return '—';
  return typeof formatDate === 'function' ? formatDate(value) : value;
}

function proyEscapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function proyStorageKey(name, fallback) {
  if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS && STORAGE_KEYS[name]) {
    return STORAGE_KEYS[name];
  }
  return fallback;
}

function proyGetData(name, fallback) {
  if (typeof getData !== 'function') return [];
  return proySafeArray(getData(proyStorageKey(name, fallback)));
}

function proySetData(name, fallback, value) {
  if (typeof setData !== 'function') return;
  setData(proyStorageKey(name, fallback), value);
}

function proyToday() {
  var hoy = new Date();
  return hoy.getFullYear()
    + '-' + String(hoy.getMonth() + 1).padStart(2, '0')
    + '-' + String(hoy.getDate()).padStart(2, '0');
}

function obtenerProyectos() {
  return proyGetData('PROYECTOS', 'gn_proyectos');
}

function guardarProyectosData(proyectos) {
  proySetData('PROYECTOS', 'gn_proyectos', proyectos);
}

function obtenerClientesProyecto() {
  return proyGetData('CLIENTES', 'gn_clientes');
}

function obtenerGastosProyecto(proyectoId) {
  var gastos = proyGetData('GASTOS', 'gn_gastos');
  return gastos.filter(function(g) {
    return (g.proyectoId || '') === proyectoId;
  });
}

function obtenerPagosProyecto(proyectoId) {
  var pagos = proyGetData('PAGOS', 'gn_pagos');
  return pagos.filter(function(p) {
    return (p.proyectoId || '') === proyectoId;
  });
}

function obtenerTareasProyecto(proyectoId) {
  if (typeof getData !== 'function') return [];
  var tareas = getData('gn_tareas');
  tareas = Array.isArray(tareas) ? tareas : [];
  return tareas.filter(function(t) {
    return (t.proyectoId || '') === proyectoId;
  });
}

function actualizarProyectoLocal(id, patch) {
  var proyectos = obtenerProyectos();
  for (var i = 0; i < proyectos.length; i++) {
    if (proyectos[i].id === id) {
      for (var key in patch) {
        proyectos[i][key] = patch[key];
      }
      break;
    }
  }
  guardarProyectosData(proyectos);
}

function obtenerProyectoPorId(id) {
  var proyectos = obtenerProyectos();
  for (var i = 0; i < proyectos.length; i++) {
    if (proyectos[i].id === id) return proyectos[i];
  }
  return null;
}

function ensureProyectoDetalleContainer() {
  var existing = proyEl('proyecto-detalle');
  if (existing) return existing;

  var grid = proyEl('proyectos-grid');
  if (!grid || !grid.parentNode) return null;

  var wrap = document.createElement('div');
  wrap.id = 'proyecto-detalle';
  wrap.className = 'project-detail-panel';
  wrap.style.marginTop = '20px';

  grid.parentNode.insertBefore(wrap, grid.nextSibling);
  return wrap;
}

// ============================================================
// DATOS DE EJEMPLO
// ============================================================

function inicializarProyectosEjemplo() {
  var proyectos = obtenerProyectos();
  if (proyectos.length > 0) return;

  var hoy = new Date();
  var fechaHoy = proyToday();

  var mesPasadoDate = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 15);
  var dosMesesDate = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);

  function ymd(d) {
    return d.getFullYear()
      + '-' + String(d.getMonth() + 1).padStart(2, '0')
      + '-' + String(d.getDate()).padStart(2, '0');
  }

  var mesPasado = ymd(mesPasadoDate);
  var dosMeses = ymd(dosMesesDate);

  var proyectosEjemplo = [
    {
      id: 'proy-001',
      nombre: 'Rediseño Web Corporativo ACME',
      clienteNombre: 'ACME Corporation',
      clienteId: '',
      presupuesto: 3500,
      avance: 75,
      estado: 'en_progreso',
      fechaInicio: mesPasado,
      alcance: 'Rediseño completo del sitio web corporativo, responsive y optimizado para SEO.',
      notas: 'Cliente aprobó mockups principales.',
      creadoEn: mesPasado
    },
    {
      id: 'proy-002',
      nombre: 'E-commerce Boutique Luna',
      clienteNombre: 'Boutique Luna',
      clienteId: '',
      presupuesto: 5800,
      avance: 30,
      estado: 'en_progreso',
      fechaInicio: fechaHoy,
      alcance: 'Tienda online con pasarela de pagos, inventario y panel de administración.',
      notas: 'Esperando materiales del cliente.',
      creadoEn: fechaHoy
    },
    {
      id: 'proy-003',
      nombre: 'Branding Completo - Café Central',
      clienteNombre: 'Café Central',
      clienteId: '',
      presupuesto: 2200,
      avance: 100,
      estado: 'completado',
      fechaInicio: dosMeses,
      alcance: 'Logo, manual de marca, papelería corporativa y packaging.',
      notas: 'Proyecto entregado.',
      creadoEn: dosMeses
    }
  ];

  guardarProyectosData(proyectosEjemplo);

  var gastos = proyGetData('GASTOS', 'gn_gastos');
  if (gastos.length === 0) {
    gastos = [
      { id: generarId(), tipo: 'gasto', fecha: mesPasado, categoria: 'software', descripcion: 'Licencia Adobe - ACME', monto: 79.99, metodo: 'tarjeta', proyectoId: 'proy-001', creadoEn: new Date().toISOString() },
      { id: generarId(), tipo: 'gasto', fecha: fechaHoy, categoria: 'software', descripcion: 'Licencia Figma - Luna', monto: 45.00, metodo: 'tarjeta', proyectoId: 'proy-002', creadoEn: new Date().toISOString() },
      { id: generarId(), tipo: 'gasto', fecha: dosMeses, categoria: 'equipo', descripcion: 'Impresión papelería - Café Central', monto: 180.00, metodo: 'efectivo', proyectoId: 'proy-003', creadoEn: new Date().toISOString() }
    ];
    proySetData('GASTOS', 'gn_gastos', gastos);
  }

  var pagos = proyGetData('PAGOS', 'gn_pagos');
  if (pagos.length === 0) {
    pagos = [
      { id: generarId(), tipo: 'pago', fecha: mesPasado, cliente: 'ACME Corporation', concepto: 'Pago inicial', monto: 1750.00, metodo: 'transferencia', estado: 'recibido', proyectoId: 'proy-001', creadoEn: new Date().toISOString() },
      { id: generarId(), tipo: 'pago', fecha: fechaHoy, cliente: 'Boutique Luna', concepto: 'Pago inicial', monto: 2900.00, metodo: 'transferencia', estado: 'recibido', proyectoId: 'proy-002', creadoEn: new Date().toISOString() },
      { id: generarId(), tipo: 'pago', fecha: dosMeses, cliente: 'Café Central', concepto: 'Pago final', monto: 2200.00, metodo: 'transferencia', estado: 'recibido', proyectoId: 'proy-003', creadoEn: new Date().toISOString() }
    ];
    proySetData('PAGOS', 'gn_pagos', pagos);
  }

  if (typeof getData === 'function' && typeof setData === 'function') {
    var tareas = getData('gn_tareas');
    if (!Array.isArray(tareas) || tareas.length === 0) {
      setData('gn_tareas', [
        { id: generarId(), proyectoId: 'proy-001', titulo: 'Wireframes', asignado: 'Ana', fechaLimite: mesPasado, estado: 'completada', creadoEn: new Date().toISOString() },
        { id: generarId(), proyectoId: 'proy-001', titulo: 'Desarrollo frontend', asignado: 'María', fechaLimite: fechaHoy, estado: 'en_progreso', creadoEn: new Date().toISOString() },
        { id: generarId(), proyectoId: 'proy-002', titulo: 'Setup del proyecto', asignado: 'Carlos', fechaLimite: fechaHoy, estado: 'pendiente', creadoEn: new Date().toISOString() }
      ]);
    }
  }
}

// ============================================================
// LISTA DE PROYECTOS
// ============================================================

function renderProyectos(filtro) {
  inicializarProyectosEjemplo();

  var grid = proyEl('proyectos-grid');
  if (!grid) return;

  var proyectos = obtenerProyectos();

  if (filtro && filtro !== 'todos') {
    proyectos = proyectos.filter(function(p) {
      return p.estado === filtro;
    });
  }

  proyectos.sort(function(a, b) {
    return new Date(b.creadoEn || b.fechaInicio || 0) - new Date(a.creadoEn || a.fechaInicio || 0);
  });

  if (proyectos.length === 0) {
    grid.innerHTML = '<div class="empty-state">No hay proyectos registrados</div>';
    return;
  }

  var html = '';

  for (var i = 0; i < proyectos.length; i++) {
    var p = proyectos[i];
    var estadoLabel = obtenerLabelEstadoProyecto(p.estado);
    var pagos = obtenerPagosProyecto(p.id);
    var cobrado = 0;

    for (var j = 0; j < pagos.length; j++) {
      cobrado += parseFloat(pagos[j].monto) || 0;
    }

    html += ''
      + '<div class="project-card" style="border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;margin-bottom:14px;">'
      + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">'
      + '<div>'
      + '<div style="font-weight:700;font-size:1.05rem;">' + proyEscapeHtml(p.nombre) + '</div>'
      + '<div style="opacity:.8;margin-top:4px;">' + proyEscapeHtml(p.clienteNombre || 'Sin cliente') + '</div>'
      + '</div>'
      + '<span style="padding:6px 10px;border-radius:999px;background:rgba(107,189,69,0.15);border:1px solid rgba(107,189,69,0.35);font-size:.88rem;">' + proyEscapeHtml(estadoLabel) + '</span>'
      + '</div>'
      + '<div style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">'
      + '<div><strong>Presupuesto:</strong><br>' + proyMoney(p.presupuesto) + '</div>'
      + '<div><strong>Cobrado:</strong><br>' + proyMoney(cobrado) + '</div>'
      + '<div><strong>Inicio:</strong><br>' + proyDate(p.fechaInicio) + '</div>'
      + '<div><strong>Avance:</strong><br>' + (parseInt(p.avance) || 0) + '%</div>'
      + '</div>'
      + '<div style="margin-top:12px;">'
      + '<div style="height:10px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;">'
      + '<div style="height:100%;width:' + (parseInt(p.avance) || 0) + '%;background:#6bbd45;"></div>'
      + '</div>'
      + '</div>'
      + '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button type="button" class="btn-secondary" onclick="verProyecto(\'' + p.id + '\')">Ver detalle</button>'
      + '<button type="button" class="btn-secondary" onclick="abrirModalGastoProyectoDesdeId(\'' + p.id + '\')">Registrar gasto</button>'
      + '<button type="button" class="btn-primary" onclick="abrirModalPagoProyectoDesdeId(\'' + p.id + '\')">Registrar pago</button>'
      + '</div>'
      + '</div>';
  }

  grid.innerHTML = html;
}

// ============================================================
// DETALLE DE PROYECTO
// ============================================================

function obtenerLabelEstadoProyecto(estado) {
  var labels = {
    en_progreso: 'En progreso',
    completado: 'Completado',
    pausado: 'Pausado',
    cancelado: 'Cancelado',
    pendiente: 'Pendiente'
  };
  return labels[estado] || 'En progreso';
}

function verProyecto(id) {
  var proyecto = obtenerProyectoPorId(id);
  if (!proyecto) return false;

  PROYECTO_ACTUAL = proyecto;
  renderDetalleProyecto(proyecto);
  return false;
}

function renderDetalleProyecto(proyecto) {
  var container = ensureProyectoDetalleContainer();
  if (!container) return;

  var tareas = obtenerTareasProyecto(proyecto.id);
  var pagos = obtenerPagosProyecto(proyecto.id);
  var gastos = obtenerGastosProyecto(proyecto.id);

  var tareasHtml = '';
  if (tareas.length === 0) {
    tareasHtml = '<div class="empty-state">No hay tareas registradas</div>';
  } else {
    for (var i = 0; i < tareas.length; i++) {
      tareasHtml += ''
        + '<div style="border:1px solid rgba(255,255,255,0.08);padding:10px 12px;border-radius:12px;margin-bottom:8px;">'
        + '<div style="font-weight:600;">' + proyEscapeHtml(tareas[i].titulo || 'Tarea') + '</div>'
        + '<div style="opacity:.8;margin-top:4px;">' + proyEscapeHtml(tareas[i].asignado || 'Sin asignar') + ' · ' + proyEscapeHtml(tareas[i].estado || 'pendiente') + '</div>'
        + '</div>';
    }
  }

  container.innerHTML = ''
    + '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:18px;">'
    + '<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;">'
    + '<div>'
    + '<h3 style="margin:0 0 8px;">' + proyEscapeHtml(proyecto.nombre) + '</h3>'
    + '<div style="opacity:.8;">' + proyEscapeHtml(proyecto.clienteNombre || 'Sin cliente') + '</div>'
    + '</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    + '<button type="button" class="btn-secondary" onclick="abrirModalGastoProyecto()">Registrar gasto</button>'
    + '<button type="button" class="btn-primary" onclick="abrirModalPagoProyecto()">Registrar pago</button>'
    + '</div>'
    + '</div>'

    + '<div style="margin-top:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;">'
    + '<div><strong>Estado</strong><br>' + proyEscapeHtml(obtenerLabelEstadoProyecto(proyecto.estado)) + '</div>'
    + '<div><strong>Fecha de inicio</strong><br>' + proyDate(proyecto.fechaInicio) + '</div>'
    + '<div><strong>Presupuesto</strong><br>' + proyMoney(proyecto.presupuesto) + '</div>'
    + '<div><strong>Avance</strong><br>' + (parseInt(proyecto.avance) || 0) + '%</div>'
    + '</div>'

    + '<div style="margin-top:16px;">'
    + '<strong>Alcance</strong>'
    + '<div style="margin-top:6px;opacity:.9;">' + proyEscapeHtml(proyecto.alcance || 'Sin alcance definido') + '</div>'
    + '</div>'

    + '<div style="margin-top:18px;">'
    + '<strong>Resumen financiero</strong>'
    + '<div id="proyecto-financiero" style="margin-top:10px;"></div>'
    + '</div>'

    + '<div style="margin-top:18px;">'
    + '<strong>Timeline</strong>'
    + '<div id="proyecto-timeline" style="margin-top:10px;"></div>'
    + '</div>'

    + '<div style="margin-top:18px;">'
    + '<strong>Tareas</strong>'
    + '<div style="margin-top:10px;">' + tareasHtml + '</div>'
    + '</div>'

    + '<div style="margin-top:18px;">'
    + '<strong>Notas</strong>'
    + '<textarea id="proyecto-notas" rows="5" style="width:100%;margin-top:10px;">' + proyEscapeHtml(proyecto.notas || '') + '</textarea>'
    + '<div style="margin-top:10px;">'
    + '<button type="button" class="btn-primary" onclick="guardarNotasProyecto()">Guardar notas</button>'
    + '</div>'
    + '</div>'
    + '</div>';

  cargarFinancieroProyecto(proyecto);
  cargarTimelineProyecto(proyecto);

  setTimeout(function() {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 60);
}

function cargarFinancieroProyecto(proyecto) {
  var container = proyEl('proyecto-financiero');
  if (!container || !proyecto) return;

  var pagos = obtenerPagosProyecto(proyecto.id);
  var gastos = obtenerGastosProyecto(proyecto.id);

  var ingresos = 0;
  var egresos = 0;

  for (var i = 0; i < pagos.length; i++) ingresos += parseFloat(pagos[i].monto) || 0;
  for (var j = 0; j < gastos.length; j++) egresos += parseFloat(gastos[j].monto) || 0;

  var presupuesto = parseFloat(proyecto.presupuesto) || 0;
  var pendiente = presupuesto - ingresos;
  var utilidad = ingresos - egresos;

  container.innerHTML = ''
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;">'
    + '<div style="border:1px solid rgba(255,255,255,0.08);padding:12px;border-radius:12px;"><strong>Ingresos</strong><br>' + proyMoney(ingresos) + '</div>'
    + '<div style="border:1px solid rgba(255,255,255,0.08);padding:12px;border-radius:12px;"><strong>Gastos</strong><br>' + proyMoney(egresos) + '</div>'
    + '<div style="border:1px solid rgba(255,255,255,0.08);padding:12px;border-radius:12px;"><strong>Pendiente</strong><br>' + proyMoney(pendiente) + '</div>'
    + '<div style="border:1px solid rgba(255,255,255,0.08);padding:12px;border-radius:12px;"><strong>Resultado</strong><br>' + proyMoney(utilidad) + '</div>'
    + '</div>';
}

function cargarTimelineProyecto(proyecto) {
  var container = proyEl('proyecto-timeline');
  if (!container || !proyecto) return;

  var movimientos = [];
  var gastos = obtenerGastosProyecto(proyecto.id);
  var pagos = obtenerPagosProyecto(proyecto.id);

  for (var i = 0; i < pagos.length; i++) {
    movimientos.push({
      fecha: pagos[i].fecha,
      tipo: 'Pago',
      descripcion: pagos[i].concepto || 'Pago recibido',
      monto: parseFloat(pagos[i].monto) || 0,
      color: '#6bbd45'
    });
  }

  for (var j = 0; j < gastos.length; j++) {
    movimientos.push({
      fecha: gastos[j].fecha,
      tipo: 'Gasto',
      descripcion: gastos[j].descripcion || 'Gasto registrado',
      monto: parseFloat(gastos[j].monto) || 0,
      color: '#ef4444'
    });
  }

  movimientos.sort(function(a, b) {
    return new Date(b.fecha) - new Date(a.fecha);
  });

  if (movimientos.length === 0) {
    container.innerHTML = '<div class="empty-state">No hay actividad financiera registrada</div>';
    return;
  }

  var html = '';
  for (var k = 0; k < movimientos.length; k++) {
    html += ''
      + '<div style="border-left:3px solid ' + movimientos[k].color + ';padding:10px 12px;margin-bottom:10px;background:rgba(255,255,255,0.03);border-radius:10px;">'
      + '<div style="font-weight:600;">' + proyEscapeHtml(movimientos[k].tipo) + ' · ' + proyDate(movimientos[k].fecha) + '</div>'
      + '<div style="opacity:.85;margin-top:4px;">' + proyEscapeHtml(movimientos[k].descripcion) + '</div>'
      + '<div style="margin-top:6px;color:' + movimientos[k].color + ';font-weight:700;">' + proyMoney(movimientos[k].monto) + '</div>'
      + '</div>';
  }

  container.innerHTML = html;
}

// ============================================================
// NOTAS
// ============================================================

function guardarNotasProyecto() {
  if (!PROYECTO_ACTUAL) return false;

  var notas = proyEl('proyecto-notas') ? proyEl('proyecto-notas').value : '';
  actualizarProyectoLocal(PROYECTO_ACTUAL.id, { notas: notas });

  PROYECTO_ACTUAL = obtenerProyectoPorId(PROYECTO_ACTUAL.id);

  var feedback = document.createElement('div');
  feedback.className = 'form-feedback success';
  feedback.textContent = '✅ Notas guardadas';
  feedback.style.display = 'block';
  feedback.style.marginTop = '10px';

  var container = proyEl('proyecto-detalle');
  if (container) {
    var existing = container.querySelector('.form-feedback');
    if (existing) existing.remove();
    container.appendChild(feedback);
    setTimeout(function() {
      if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
    }, 3000);
  }

  return false;
}

// ============================================================
// FORMULARIO CREAR PROYECTO
// ============================================================

function actualizarSelectClientesProyecto() {
  var select = proyEl('proy-cliente');
  if (!select) return;

  var clientes = obtenerClientesProyecto();
  var html = '<option value="">Selecciona un cliente</option>';

  for (var i = 0; i < clientes.length; i++) {
    html += '<option value="' + proyEscapeHtml(clientes[i].id || '') + '">' + proyEscapeHtml(clientes[i].nombre || 'Cliente') + '</option>';
  }

  select.innerHTML = html;
}

function guardarProyecto(event) {
  event.preventDefault();

  var clienteSelect = proyEl('proy-cliente');
  var nombre = proyEl('proy-nombre') ? proyEl('proy-nombre').value.trim() : '';
  var clienteId = clienteSelect ? clienteSelect.value : '';
  var clienteNombre = '';

  if (clienteSelect && clienteSelect.selectedIndex >= 0) {
    clienteNombre = clienteSelect.options[clienteSelect.selectedIndex].text || '';
  }

  if (!nombre || !clienteId) {
    var errorFeedback = proyEl('feedback-proyecto');
    if (errorFeedback) {
      errorFeedback.className = 'form-feedback error';
      errorFeedback.textContent = '❌ Completa al menos nombre y cliente del proyecto';
    }
    return false;
  }

  var proyecto = {
    id: typeof generarId === 'function' ? generarId() : ('proy_' + Date.now()),
    nombre: nombre,
    clienteId: clienteId,
    clienteNombre: clienteNombre,
    presupuesto: parseFloat(proyEl('proy-presupuesto') ? proyEl('proy-presupuesto').value : 0) || 0,
    fechaInicio: proyEl('proy-fecha') ? proyEl('proy-fecha').value : proyToday(),
    estado: 'en_progreso',
    avance: 0,
    alcance: proyEl('proy-alcance') ? proyEl('proy-alcance').value.trim() : '',
    notas: '',
    creadoEn: new Date().toISOString()
  };

  if (typeof addItem === 'function') {
    addItem(proyStorageKey('PROYECTOS', 'gn_proyectos'), proyecto);
  } else {
    var proyectos = obtenerProyectos();
    proyectos.push(proyecto);
    guardarProyectosData(proyectos);
  }

  var feedback = proyEl('feedback-proyecto');
  if (feedback) {
    feedback.className = 'form-feedback success';
    feedback.textContent = '✅ Proyecto "' + proyecto.nombre + '" creado';
  }

  if (proyEl('formProyecto')) proyEl('formProyecto').reset();
  if (proyEl('proy-fecha')) proyEl('proy-fecha').value = proyToday();

  renderProyectos();
  if (typeof actualizarKPIs === 'function') actualizarKPIs();
  if (typeof actualizarSelectProyectosFinanzas === 'function') actualizarSelectProyectosFinanzas();

  return false;
}

// ============================================================
// PUENTES DESDE TARJETAS
// ============================================================

function abrirModalGastoProyectoDesdeId(id) {
  var proyecto = obtenerProyectoPorId(id);
  if (!proyecto) return false;
  PROYECTO_ACTUAL = proyecto;
  if (typeof abrirModalGastoProyecto === 'function') return abrirModalGastoProyecto();
  return false;
}

function abrirModalPagoProyectoDesdeId(id) {
  var proyecto = obtenerProyectoPorId(id);
  if (!proyecto) return false;
  PROYECTO_ACTUAL = proyecto;
  if (typeof abrirModalPagoProyecto === 'function') return abrirModalPagoProyecto();
  return false;
}
// ============================================================
// FILTROS DE PROYECTOS
// ============================================================

function filtrarProyectos(estado) {
  renderProyectos(estado || 'todos');

  var botones = document.querySelectorAll('[onclick*="filtrarProyectos("]');
  for (var i = 0; i < botones.length; i++) {
    botones[i].classList.remove('active');
    var onclick = botones[i].getAttribute('onclick') || '';
    if (onclick.indexOf("'" + (estado || 'todos') + "'") !== -1 || onclick.indexOf('"' + (estado || 'todos') + '"') !== -1) {
      botones[i].classList.add('active');
    }
  }

  return false;
}

function buscarProyectos() {
  var input = document.getElementById('buscar-proyecto');
  var term = input ? input.value.trim().toLowerCase() : '';
  var grid = document.getElementById('proyectos-grid');
  if (!grid) return false;

  inicializarProyectosEjemplo();

  var proyectos = obtenerProyectos().filter(function(p) {
    return (p.nombre || '').toLowerCase().indexOf(term) !== -1
      || (p.clienteNombre || '').toLowerCase().indexOf(term) !== -1
      || (p.alcance || '').toLowerCase().indexOf(term) !== -1;
  });

  if (proyectos.length === 0) {
    grid.innerHTML = '<div class="empty-state">No se encontraron proyectos</div>';
    return false;
  }

  var html = '';

  for (var i = 0; i < proyectos.length; i++) {
    var p = proyectos[i];
    var estadoLabel = obtenerLabelEstadoProyecto(p.estado);
    var pagos = obtenerPagosProyecto(p.id);
    var cobrado = 0;

    for (var j = 0; j < pagos.length; j++) {
      cobrado += parseFloat(pagos[j].monto) || 0;
    }

    html += ''
      + '<div class="project-card" style="border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;margin-bottom:14px;">'
      + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">'
      + '<div>'
      + '<div style="font-weight:700;font-size:1.05rem;">' + proyEscapeHtml(p.nombre) + '</div>'
      + '<div style="opacity:.8;margin-top:4px;">' + proyEscapeHtml(p.clienteNombre || 'Sin cliente') + '</div>'
      + '</div>'
      + '<span style="padding:6px 10px;border-radius:999px;background:rgba(107,189,69,0.15);border:1px solid rgba(107,189,69,0.35);font-size:.88rem;">' + proyEscapeHtml(estadoLabel) + '</span>'
      + '</div>'
      + '<div style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">'
      + '<div><strong>Presupuesto:</strong><br>' + proyMoney(p.presupuesto) + '</div>'
      + '<div><strong>Cobrado:</strong><br>' + proyMoney(cobrado) + '</div>'
      + '<div><strong>Inicio:</strong><br>' + proyDate(p.fechaInicio) + '</div>'
      + '<div><strong>Avance:</strong><br>' + (parseInt(p.avance) || 0) + '%</div>'
      + '</div>'
      + '<div style="margin-top:12px;">'
      + '<div style="height:10px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;">'
      + '<div style="height:100%;width:' + (parseInt(p.avance) || 0) + '%;background:#6bbd45;"></div>'
      + '</div>'
      + '</div>'
      + '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button type="button" class="btn-secondary" onclick="verProyecto(\'' + p.id + '\')">Ver detalle</button>'
      + '<button type="button" class="btn-secondary" onclick="abrirModalGastoProyectoDesdeId(\'' + p.id + '\')">Registrar gasto</button>'
      + '<button type="button" class="btn-primary" onclick="abrirModalPagoProyectoDesdeId(\'' + p.id + '\')">Registrar pago</button>'
      + '</div>'
      + '</div>';
  }

  grid.innerHTML = html;
  return false;
}
