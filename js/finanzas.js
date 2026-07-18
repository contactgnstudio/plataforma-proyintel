// ============================================================
// js/finanzas.js — Estado de Cuenta + ITBMS + Registro
// de Gastos y Pagos enlazados a proyectos
// ============================================================

function finEl(id) {
  return document.getElementById(id);
}

function finSafeArray(value) {
  return Array.isArray(value) ? value : [];
}

function finMoney(value) {
  var n = parseFloat(value) || 0;
  return typeof formatMoney === 'function' ? formatMoney(n) : ('$' + n.toFixed(2));
}

function finDate(value) {
  if (!value) return '—';
  return typeof formatDate === 'function' ? formatDate(value) : value;
}

function finEscapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function finStorageKey(name, fallback) {
  if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS && STORAGE_KEYS[name]) {
    return STORAGE_KEYS[name];
  }
  return fallback;
}

function finGetData(name, fallback) {
  if (typeof getData !== 'function') return [];
  return finSafeArray(getData(finStorageKey(name, fallback)));
}

function finGetProjectsMap() {
  var proyectos = finGetData('PROYECTOS', 'proyectos');
  var map = {};

  for (var i = 0; i < proyectos.length; i++) {
    map[proyectos[i].id] = proyectos[i];
  }

  return map;
}

function finProjectLabel(proyectoId, proyectosMap) {
  if (!proyectoId) return 'General';
  if (proyectosMap && proyectosMap[proyectoId]) {
    return proyectosMap[proyectoId].nombre || proyectoId;
  }
  return proyectoId;
}

// ============================================================
// Selects de proyecto en Finanzas
// ============================================================

function actualizarSelectProyectosFinanzas() {
  var proyectos = finGetData('PROYECTOS', 'proyectos');
  var proyectosMap = finGetProjectsMap();

  var selects = [
    finEl('ec-proyecto'),
    finEl('gasto-proyecto'),
    finEl('pago-proyecto')
  ];

  for (var s = 0; s < selects.length; s++) {
    var select = selects[s];
    if (!select) continue;

    var current = select.value || '';

    var html = '';
    if (select.id === 'gasto-proyecto') {
      html += '<option value="">Sin proyecto (general)</option>';
    } else {
      html += '<option value="">Todos los proyectos</option>';
    }

    for (var i = 0; i < proyectos.length; i++) {
      var id = proyectos[i].id || '';
      var nombre = proyectos[i].nombre || finProjectLabel(id, proyectosMap);
      html += '<option value="' + finEscapeHtml(id) + '">' + finEscapeHtml(nombre) + '</option>';
    }

    select.innerHTML = html;
    if (current) select.value = current;
  }
}

function finSetText(ids, value) {
  for (var i = 0; i < ids.length; i++) {
    var node = document.getElementById(ids[i]);
    if (node) node.textContent = value;
  }
}

// ============================================================
// Helpers de Supabase / Storage
// ============================================================

function finGetStorageKey(name, fallback) {
  if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS && STORAGE_KEYS[name]) {
    return STORAGE_KEYS[name];
  }
  return fallback;
}

async function finInsertRow(tableKey, payload) {
  var tableName = finGetStorageKey(tableKey, tableKey.toLowerCase());

  if (typeof window.addItem !== 'function') {
    console.error('addItem no está disponible para', tableName);
    return null;
  }

  try {
    return await window.addItem(tableName, payload);
  } catch (error) {
    console.error('Error insertando en', tableName, error);
    return null;
  }
}

async function finRefreshAfterChange() {
  // Refresca KPIs
  if (typeof window.actualizarKPIs === 'function') {
    await window.actualizarKPIs();
  }

  // Refresca Estado de Cuenta
  if (typeof window.generarEstadoCuenta === 'function') {
    window.generarEstadoCuenta();
  }

  // Refresca detalle del proyecto actual (si existe)
  if (typeof window.PROYECTO_ACTUAL !== 'undefined' && window.PROYECTO_ACTUAL && typeof window.verProyecto === 'function') {
    await window.verProyecto(window.PROYECTO_ACTUAL.id);
  }

  // Refresca ITBMS
  renderITBMS();
}

// ============================================================
// ESTADO DE CUENTA
// ============================================================

function generarEstadoCuenta() {
  var desde = finEl('ec-desde') ? finEl('ec-desde').value : '';
  var hasta = finEl('ec-hasta') ? finEl('ec-hasta').value : '';
  var tipo = finEl('ec-tipo') ? finEl('ec-tipo').value : 'todos';
  var proyectoId = finEl('ec-proyecto') ? finEl('ec-proyecto').value : '';

  var gastos = finGetData('GASTOS', 'gastos');
  var pagos = finGetData('PAGOS', 'pagos');
  var proyectosMap = finGetProjectsMap();

  if (desde) {
    gastos = gastos.filter(function(g) { return String(g.fecha || '') >= desde; });
    pagos = pagos.filter(function(p) { return String(p.fecha || '') >= desde; });
  }

  if (hasta) {
    gastos = gastos.filter(function(g) { return String(g.fecha || '') <= hasta; });
    pagos = pagos.filter(function(p) { return String(p.fecha || '') <= hasta; });
  }

  // Filtro por proyecto: compatible con proyecto_id y legacy
  if (proyectoId) {
    gastos = gastos.filter(function(g) {
      var pid = g.proyecto_id || g.proyectoId || '';
      return String(pid) === String(proyectoId);
    });

    pagos = pagos.filter(function(p) {
      var pid = p.proyecto_id || p.proyectoId || '';
      return String(pid) === String(proyectoId);
    });
  }

  var movimientos = [];

  // GASTOS → movimientos tipo gasto
  if (tipo !== 'ingresos') {
    for (var i = 0; i < gastos.length; i++) {
      var gid = gastos[i].proyecto_id || gastos[i].proyectoId || '';
      movimientos.push({
        fecha: gastos[i].fecha || '',
        tipo: 'gasto',
        proyecto: finProjectLabel(gid, proyectosMap),
        descripcion: gastos[i].descripcion || gastos[i].referencia || 'Gasto',
        ingreso: 0,
        gasto: parseFloat(gastos[i].monto) || 0,
        metodo: gastos[i].metodo_pago || gastos[i].metodo || ''
      });
    }
  }

  // PAGOS → movimientos tipo pago/ingreso
  if (tipo !== 'gastos') {
    for (var j = 0; j < pagos.length; j++) {
      var pid = pagos[j].proyecto_id || pagos[j].proyectoId || '';
      movimientos.push({
        fecha: pagos[j].fecha || '',
        tipo: 'pago',
        proyecto: finProjectLabel(pid, proyectosMap) || pagos[j].cliente || 'General',
        descripcion: pagos[j].concepto || pagos[j].referencia || 'Pago',
        ingreso: parseFloat(pagos[j].monto) || 0,
        gasto: 0,
        metodo: pagos[j].metodo_pago || pagos[j].metodo || ''
      });
    }
  }

  movimientos.sort(function(a, b) {
    return new Date(a.fecha) - new Date(b.fecha);
  });

  var tbody = document.getElementById('tbodyEstadoCuenta') ||
              document.getElementById('tbodyMovimientos') ||
              document.getElementById('estadoCuentaBody') ||
              document.getElementById('movimientos-body');

  var saldo = 0;
  var totalIngresos = 0;
  var totalGastos = 0;
  var html = '';

  if (movimientos.length === 0) {
    html = '<tr><td colspan="7" class="empty-state">No hay movimientos para los filtros seleccionados</td></tr>';
  } else {
    for (var k = 0; k < movimientos.length; k++) {
      var m = movimientos[k];
      totalIngresos += m.ingreso;
      totalGastos += m.gasto;
      saldo += m.ingreso - m.gasto;

      html += ''
        + '<tr>'
        + '<td>' + finDate(m.fecha) + '</td>'
        + '<td>' + (m.tipo === 'pago' ? 'Ingreso' : 'Gasto') + '</td>'
        + '<td>' + finEscapeHtml(m.proyecto || 'General') + '</td>'
        + '<td>' + finEscapeHtml(m.descripcion || '—') + '</td>'
        + '<td style="color:#6bbd45;font-weight:600;">' + (m.ingreso > 0 ? finMoney(m.ingreso) : '—') + '</td>'
        + '<td style="color:#ef4444;font-weight:600;">' + (m.gasto > 0 ? finMoney(m.gasto) : '—') + '</td>'
        + '<td style="font-weight:700;">' + finMoney(saldo) + '</td>'
        + '</tr>';
    }
  }

  if (tbody) tbody.innerHTML = html;

  var balance = totalIngresos - totalGastos;

  finSetText(['ec-total-ingresos', 'resumen-ingresos'], finMoney(totalIngresos));
  finSetText(['ec-total-gastos', 'resumen-gastos'], finMoney(totalGastos));
  finSetText(['ec-balance', 'resumen-balance'], finMoney(balance));

  return {
    movimientos: movimientos,
    totalIngresos: totalIngresos,
    totalGastos: totalGastos,
    balance: balance
  };
}

// ============================================================
// ITBMS
// ============================================================

function calcularITBMSPeriodo() {
  var periodo = finEl('itbms-periodo') ? finEl('itbms-periodo').value : '';
  if (!periodo) {
    var hoy = new Date();
    periodo = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0');
  }

  var pagos = finGetData('PAGOS', 'pagos').filter(function(p) {
    return String(p.fecha || '').indexOf(periodo) === 0;
  });

  var gastos = finGetData('GASTOS', 'gastos').filter(function(g) {
    return String(g.fecha || '').indexOf(periodo) === 0;
  });

  var totalCobrado = 0;
  var totalGastos = 0;

  for (var i = 0; i < pagos.length; i++) {
    totalCobrado += parseFloat(pagos[i].monto) || 0;
  }

  for (var j = 0; j < gastos.length; j++) {
    totalGastos += parseFloat(gastos[j].monto) || 0;
  }

  var ventasGravadas = totalCobrado > 0 ? (totalCobrado / 1.07) : 0;
  var debitoFiscal = totalCobrado - ventasGravadas;

  return {
    periodo: periodo,
    totalCobrado: totalCobrado,
    totalGastos: totalGastos,
    ventasGravadas: ventasGravadas,
    debitoFiscal: debitoFiscal,
    creditoFiscal: 0,
    itbmsPagar: debitoFiscal
  };
}

function renderITBMS() {
  var data = calcularITBMSPeriodo();

  finSetText(['itbms-ventas-gravadas'], finMoney(data.ventasGravadas));
  finSetText(['itbms-debito'], finMoney(data.debitoFiscal));
  finSetText(['itbms-credito'], finMoney(data.creditoFiscal));
  finSetText(['itbms-a-pagar'], finMoney(data.itbmsPagar));

  var container = document.getElementById('itbms-resumen-container');
  if (container) {
    container.style.display = 'block';
  }

  return data;
}

function generarDeclaracionITBMS() {
  return renderITBMS();
}

// ============================================================
// Registro de Gastos y Pagos — Formularios Finanzas
// ============================================================

function finGetProyectoIdDesdeSelectGasto() {
  var select = document.getElementById('gasto-proyecto');
  return select ? (select.value || null) : null;
}

function finGetProyectoIdDesdeSelectPago() {
  var select = document.getElementById('pago-proyecto');
  return select ? (select.value || null) : null;
}

function inicializarFormularioGastoFinanzas() {
  var form = document.getElementById('form-gasto-finanzas');
  if (!form) return;

  var feedback = document.getElementById('feedback-gasto-finanzas');

  function setFeedback(msg, type) {
    if (!feedback) return;
    feedback.className = 'form-feedback ' + (type || 'error');
    feedback.textContent = msg || '';
    feedback.style.display = msg ? 'block' : 'none';
  }

  // Fecha por defecto
  var fecha = document.getElementById('gasto-fecha');
  if (fecha && !fecha.value && typeof GNUtils !== 'undefined' && typeof GNUtils.getTodayISO === 'function') {
    fecha.value = GNUtils.getTodayISO();
  }

  form.addEventListener('submit', async function(event) {
    event.preventDefault();

    var fechaVal = fecha ? fecha.value : '';
    var referencia = document.getElementById('gasto-referencia') ? document.getElementById('gasto-referencia').value.trim() : '';
    var descripcion = document.getElementById('gasto-descripcion') ? document.getElementById('gasto-descripcion').value.trim() : '';
    var tipo = document.getElementById('gasto-tipo') ? document.getElementById('gasto-tipo').value.trim() : 'operativo';
    var montoStr = document.getElementById('gasto-monto') ? document.getElementById('gasto-monto').value : '';
    var metodoPago = document.getElementById('gasto-metodo') ? document.getElementById('gasto-metodo').value.trim() : 'efectivo';
    var proyectoId = finGetProyectoIdDesdeSelectGasto();

    var monto = parseFloat(montoStr || '0');

    if (!fechaVal || !descripcion || !montoStr || monto <= 0) {
      setFeedback('❌ Completa fecha, descripción y monto del gasto.', 'error');
      return;
    }

    var payload = {
      fecha: fechaVal,
      proyecto_id: proyectoId || null,
      tipo: tipo,
      descripcion: descripcion,
      referencia: referencia || null,
      monto: monto,
      metodo_pago: metodoPago
    };

    var result = await finInsertRow('GASTOS', payload);

    if (!result) {
      setFeedback('❌ No se pudo guardar el gasto.', 'error');
      return;
    }

    setFeedback('✅ Gasto registrado correctamente.', 'success');

    if (fecha && typeof GNUtils !== 'undefined' && typeof GNUtils.getTodayISO === 'function') {
      fecha.value = GNUtils.getTodayISO();
    }
    document.getElementById('gasto-descripcion').value = '';
    document.getElementById('gasto-referencia').value = '';
    document.getElementById('gasto-monto').value = '';
    document.getElementById('gasto-tipo').value = 'operativo';
    document.getElementById('gasto-metodo').value = 'efectivo';

    await finRefreshAfterChange();
  });
}

function inicializarFormularioPagoFinanzas() {
  var form = document.getElementById('form-pago-finanzas');
  if (!form) return;

  var feedback = document.getElementById('feedback-pago-finanzas');

  function setFeedback(msg, type) {
    if (!feedback) return;
    feedback.className = 'form-feedback ' + (type || 'error');
    feedback.textContent = msg || '';
    feedback.style.display = msg ? 'block' : 'none';
  }

  var fecha = document.getElementById('pago-fecha');
  if (fecha && !fecha.value && typeof GNUtils !== 'undefined' && typeof GNUtils.getTodayISO === 'function') {
    fecha.value = GNUtils.getTodayISO();
  }

  form.addEventListener('submit', async function(event) {
    event.preventDefault();

    var fechaVal = fecha ? fecha.value : '';
    var proyectoId = finGetProyectoIdDesdeSelectPago();
    var concepto = document.getElementById('pago-concepto') ? document.getElementById('pago-concepto').value.trim() : '';
    var referencia = document.getElementById('pago-referencia') ? document.getElementById('pago-referencia').value.trim() : '';
    var montoStr = document.getElementById('pago-monto') ? document.getElementById('pago-monto').value : '';
    var metodoPago = document.getElementById('pago-metodo') ? document.getElementById('pago-metodo').value.trim() : 'transferencia';
    var estado = document.getElementById('pago-estado') ? document.getElementById('pago-estado').value : 'registrado';

    var monto = parseFloat(montoStr || '0');

    if (!fechaVal || !proyectoId || !concepto || !montoStr || monto <= 0) {
      setFeedback('❌ Completa fecha, proyecto, concepto y monto del pago.', 'error');
      return;
    }

    var payload = {
      fecha: fechaVal,
      proyecto_id: proyectoId,
      concepto: concepto,
      referencia: referencia || null,
      monto: monto,
      metodo_pago: metodoPago,
      estado: estado
    };

    var result = await finInsertRow('PAGOS', payload);

    if (!result) {
      setFeedback('❌ No se pudo guardar el pago.', 'error');
      return;
    }

    setFeedback('✅ Pago registrado correctamente.', 'success');

    if (fecha && typeof GNUtils !== 'undefined' && typeof GNUtils.getTodayISO === 'function') {
      fecha.value = GNUtils.getTodayISO();
    }
    document.getElementById('pago-concepto').value = '';
    document.getElementById('pago-referencia').value = '';
    document.getElementById('pago-monto').value = '';
    document.getElementById('pago-metodo').value = 'transferencia';
    document.getElementById('pago-estado').value = 'registrado';

    await finRefreshAfterChange();
  });
}

// ============================================================
// Exportaciones mínimas a window
// ============================================================

window.actualizarSelectProyectosFinanzas = actualizarSelectProyectosFinanzas;
window.generarEstadoCuenta = generarEstadoCuenta;
window.renderITBMS = renderITBMS;
window.generarDeclaracionITBMS = generarDeclaracionITBMS;
window.inicializarFormularioGastoFinanzas = inicializarFormularioGastoFinanzas;
window.inicializarFormularioPagoFinanzas = inicializarFormularioPagoFinanzas;
window.finRefreshAfterChange = finRefreshAfterChange;
