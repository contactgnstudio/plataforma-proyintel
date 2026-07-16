// ============================================================
// js/finanzas.js — Estado de Cuenta + ITBMS
// ============================================================

function finEl(id) {
  return document.getElementById(id);
}

function finGetFirst(ids) {
  for (var i = 0; i < ids.length; i++) {
    var node = document.getElementById(ids[i]);
    if (node) return node;
  }
  return null;
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
  var proyectos = finGetData('PROYECTOS', 'gn_proyectos');
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

function actualizarSelectProyectosFinanzas() {
  var select = finEl('ec-proyecto');
  if (!select) return;

  var proyectos = finGetData('PROYECTOS', 'gn_proyectos');
  var actual = select.value || '';
  var html = '<option value="">Todos los proyectos</option>';

  for (var i = 0; i < proyectos.length; i++) {
    html += '<option value="' + finEscapeHtml(proyectos[i].id || '') + '">' + finEscapeHtml(proyectos[i].nombre || 'Proyecto') + '</option>';
  }

  select.innerHTML = html;
  if (actual) select.value = actual;
}

function finSetText(ids, value) {
  for (var i = 0; i < ids.length; i++) {
    var node = document.getElementById(ids[i]);
    if (node) node.textContent = value;
  }
}

function finSetHtml(ids, value) {
  for (var i = 0; i < ids.length; i++) {
    var node = document.getElementById(ids[i]);
    if (node) node.innerHTML = value;
  }
}

// ============================================================
// ESTADO DE CUENTA
// ============================================================

function generarEstadoCuenta() {
  var desde = finEl('ec-desde') ? finEl('ec-desde').value : '';
  var hasta = finEl('ec-hasta') ? finEl('ec-hasta').value : '';
  var tipo = finEl('ec-tipo') ? finEl('ec-tipo').value : 'todos';
  var proyectoId = finEl('ec-proyecto') ? finEl('ec-proyecto').value : '';

  var gastos = finGetData('GASTOS', 'gn_gastos');
  var pagos = finGetData('PAGOS', 'gn_pagos');
  var proyectosMap = finGetProjectsMap();

  if (desde) {
    gastos = gastos.filter(function(g) { return String(g.fecha || '') >= desde; });
    pagos = pagos.filter(function(p) { return String(p.fecha || '') >= desde; });
  }

  if (hasta) {
    gastos = gastos.filter(function(g) { return String(g.fecha || '') <= hasta; });
    pagos = pagos.filter(function(p) { return String(p.fecha || '') <= hasta; });
  }

  if (proyectoId) {
    gastos = gastos.filter(function(g) { return (g.proyectoId || '') === proyectoId; });
    pagos = pagos.filter(function(p) { return (p.proyectoId || '') === proyectoId; });
  }

  var movimientos = [];

  if (tipo !== 'ingresos') {
    for (var i = 0; i < gastos.length; i++) {
      movimientos.push({
        fecha: gastos[i].fecha || '',
        tipo: 'gasto',
        proyecto: finProjectLabel(gastos[i].proyectoId, proyectosMap),
        descripcion: gastos[i].descripcion || 'Gasto',
        ingreso: 0,
        gasto: parseFloat(gastos[i].monto) || 0,
        metodo: gastos[i].metodo || ''
      });
    }
  }

  if (tipo !== 'gastos') {
    for (var j = 0; j < pagos.length; j++) {
      movimientos.push({
        fecha: pagos[j].fecha || '',
        tipo: 'pago',
        proyecto: finProjectLabel(pagos[j].proyectoId, proyectosMap) || pagos[j].cliente || 'General',
        descripcion: pagos[j].concepto || 'Pago',
        ingreso: parseFloat(pagos[j].monto) || 0,
        gasto: 0,
        metodo: pagos[j].metodo || ''
      });
    }
  }

  movimientos.sort(function(a, b) {
    return new Date(a.fecha) - new Date(b.fecha);
  });

  var tbody = finGetFirst([
    'tbodyMovimientos',
    'tbodyEstadoCuenta',
    'estadoCuentaBody',
    'movimientos-body'
  ]);

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

  finSetText(['ec-total-ingresos', 'ec-ingresos-total', 'resumen-ingresos'], finMoney(totalIngresos));
  finSetText(['ec-total-gastos', 'ec-gastos-total', 'resumen-gastos'], finMoney(totalGastos));
  finSetText(['ec-balance-total', 'ec-total-balance', 'resumen-balance'], finMoney(balance));

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

  var pagos = finGetData('PAGOS', 'gn_pagos').filter(function(p) {
    return String(p.fecha || '').indexOf(periodo) === 0;
  });

  var gastos = finGetData('GASTOS', 'gn_gastos').filter(function(g) {
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

  finSetText(['itbms-ventas-gravadas', 'itbms-base-imponible'], finMoney(data.ventasGravadas));
  finSetText(['itbms-debito-fiscal', 'itbms-por-cobrar'], finMoney(data.debitoFiscal));
  finSetText(['itbms-credito-fiscal', 'itbms-por-descontar'], finMoney(data.creditoFiscal));
  finSetText(['itbms-total-pagar', 'itbms-pagar'], finMoney(data.itbmsPagar));

  var container = finGetFirst([
    'itbms-resultado',
    'itbms-resumen',
    'itbms-html',
    'itbmsResultado'
  ]);

  if (container) {
    container.innerHTML = ''
      + '<div class="itbms-card" style="border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;">'
      + '<div style="font-weight:700;margin-bottom:10px;">Resumen ITBMS ' + finEscapeHtml(data.periodo) + '</div>'
      + '<div style="display:grid;gap:8px;">'
      + '<div><strong>Total cobrado:</strong> ' + finMoney(data.totalCobrado) + '</div>'
      + '<div><strong>Ventas gravadas estimadas:</strong> ' + finMoney(data.ventasGravadas) + '</div>'
      + '<div><strong>Débito fiscal estimado:</strong> ' + finMoney(data.debitoFiscal) + '</div>'
      + '<div><strong>Crédito fiscal:</strong> ' + finMoney(data.creditoFiscal) + '</div>'
      + '<div><strong>ITBMS estimado a pagar:</strong> <span style="color:#6bbd45;font-weight:700;">' + finMoney(data.itbmsPagar) + '</span></div>'
      + '<div style="opacity:.75;font-size:.92em;margin-top:6px;">Nota: este cálculo usa los pagos registrados del período y no descuenta crédito fiscal de gastos porque los gastos actuales no guardan ITBMS desglosado.</div>'
      + '</div>'
      + '</div>';
  }

  return data;
}

function generarITBMS() {
  return renderITBMS();
}

function generarDeclaracionITBMS() {
  return renderITBMS();
}

function generarReporteITBMS() {
  return renderITBMS();
}
