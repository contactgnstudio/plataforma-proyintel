// ============================================================
// js/proyectos.js — ProjectOS v2.3 con Cotizaciones Supabase
// Tabs: Resumen (KPIs reales), Financiero, Tareas (auto), Documentos (cotización)
// Usa columnas Supabase: numero, fecha_emision, items (JSONB), proyecto_id
// ============================================================

(function(window, document) {
  'use strict';

  var PROYECTO_ACTUAL = null;
  var CLIENTES_CACHE = [];
  var CHART_PROYECTO = null;

  function byId(id) { return document.getElementById(id); }
  function qsa(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function text(value, fallback) { if (value === null || value === undefined || value === '') return fallback || '—'; return String(value); }
  function num(value) { var n = parseFloat(value); return isNaN(n) ? 0 : n; }
  function intVal(value) { var n = parseInt(value, 10); return isNaN(n) ? 0 : n; }
  function money(value) { var n = num(value); if (typeof window.formatMoney === 'function') return window.formatMoney(n); return '$' + n.toFixed(2); }
  function formatDateSafe(value) { if (!value) return '—'; if (typeof window.formatDate === 'function') return window.formatDate(value); return value; }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function estadoLabel(estado) {
    var map = { pendiente: 'Pendiente', en_progreso: 'En Progreso', pausado: 'Pausado', completado: 'Completado', cancelado: 'Cancelado', registrado: 'Registrado', confirmado: 'Confirmado', reversado: 'Reversado' };
    return map[estado] || estado || 'Pendiente';
  }
  function estadoColor(estado) {
    var map = { pendiente: '#C5A253', en_progreso: '#C5A253', pausado: '#6B7280', completado: '#2D8B5E', cancelado: '#F87171', registrado: '#C5A253', confirmado: '#2D8B5E', reversado: '#F87171' };
    return map[estado] || '#2D8B5E';
  }

  function getStorageKey(name, fallback) { if (window.STORAGE_KEYS && window.STORAGE_KEYS[name]) return window.STORAGE_KEYS[name]; return fallback; }

  async function getAll(tableName, options) { if (typeof window.getData !== 'function') return []; var rows = await window.getData(tableName, options || {}); return Array.isArray(rows) ? rows : []; }
  async function getFiltered(tableName, filters, options) { if (typeof window.getDataFiltered !== 'function') return []; var rows = await window.getDataFiltered(tableName, filters || {}, options || {}); return Array.isArray(rows) ? rows : []; }
  async function insertRow(tableName, payload) { if (typeof window.addItem !== 'function') return null; return await window.addItem(tableName, payload); }
  async function updateRow(tableName, id, payload) { if (typeof window.updateItem !== 'function') return false; return await window.updateItem(tableName, id, payload); }
  async function findItem(tableName, id) { if (typeof window.findItem !== 'function') return null; return await window.findItem(tableName, id); }
  async function getSessionUserId() { if (typeof window.getSessionUserId === 'function') return await window.getSessionUserId(); var sb = window.supabaseClient || null; if (!sb) return null; try { var session = await sb.auth.getSession(); return session && session.data && session.data.session ? session.data.session.user.id : null; } catch (e) { return null; } }

  function deriveAvance(row) {
    var estado = row.estado || 'pendiente';
    var presupuesto = num(row.presupuesto);
    var cobrado = num(row.total_cobrado);
    if (estado === 'completado') return 100;
    if (estado === 'cancelado') return 0;
    if (presupuesto > 0 && cobrado > 0) return Math.max(0, Math.min(99, Math.round((cobrado / presupuesto) * 100)));
    if (estado === 'en_progreso') return 25;
    if (estado === 'pausado') return 50;
    return 0;
  }

  function normalizeCliente(row) {
    return { id: row && row.id ? row.id : '', nombre: row && (row.nombre || row.nombre_comercial || row.empresa || row.razon_social) ? (row.nombre || row.nombre_comercial || row.empresa || row.razon_social) : 'Cliente' };
  }
  function normalizeProyecto(row) {
    return { id: row.id, userId: row.user_id || '', cotizacionId: row.cotizacion_id || '', clienteId: row.cliente_id || '', nombre: row.nombre || 'Proyecto', descripcion: row.descripcion || '', fechaInicio: row.fecha_inicio || '', fechaFin: row.fecha_fin || '', fechaFinReal: row.fecha_fin_real || '', estado: row.estado || 'en_progreso', presupuesto: num(row.presupuesto), totalCobrado: num(row.total_cobrado), totalGastado: num(row.total_gastado), notas: row.notas || '', createdAt: row.created_at || '', updatedAt: row.updated_at || '', avance: deriveAvance(row), raw: row };
  }
  function normalizeGasto(row) { return { id: row.id, proyectoId: row.proyecto_id || '', fecha: row.fecha || row.created_at || '', categoria: row.tipo || 'General', descripcion: row.descripcion || row.referencia || 'Gasto registrado', monto: num(row.monto), metodo: row.metodo_pago || row.metodo || '—', referencia: row.referencia || '', createdAt: row.created_at || '' }; }
  function normalizePago(row) { return { id: row.id, proyectoId: row.proyecto_id || '', fecha: row.fecha || row.created_at || '', concepto: row.concepto || row.descripcion || row.referencia || 'Pago recibido', monto: num(row.monto), metodo: row.metodo_pago || row.metodo || row.forma_pago || '—', estado: row.estado || 'registrado', referencia: row.referencia || '', createdAt: row.created_at || '' }; }
  function normalizeTarea(row) { return { id: row.id, proyectoId: row.proyecto_id || '', titulo: row.titulo || row.nombre || 'Tarea', asignado: row.responsable || '', fechaLimite: row.fecha_limite || '', estado: row.estado || 'pendiente', descripcion: row.descripcion || '', createdAt: row.created_at || '' }; }

  async function obtenerClientes() { var rows = await getAll(getStorageKey('CLIENTES', 'clientes'), { orderBy: 'created_at', ascending: false }); CLIENTES_CACHE = rows.map(normalizeCliente); return CLIENTES_CACHE; }
  async function ensureClientesCache() { if (!CLIENTES_CACHE.length) await obtenerClientes(); return CLIENTES_CACHE; }
  async function getClienteNombre(clienteId) { if (!clienteId) return 'Sin cliente'; await ensureClientesCache(); for (var i = 0; i < CLIENTES_CACHE.length; i++) { if (String(CLIENTES_CACHE[i].id) === String(clienteId)) return CLIENTES_CACHE[i].nombre; } return 'Sin cliente'; }

  async function obtenerProyectos() {
    var rows = await getAll(getStorageKey('PROYECTOS', 'proyectos'), { orderBy: 'created_at', ascending: false });
    var proyectos = rows.map(normalizeProyecto);
    for (var i = 0; i < proyectos.length; i++) { proyectos[i].clienteNombre = await getClienteNombre(proyectos[i].clienteId); }
    return proyectos;
  }

  async function obtenerProyectoPorId(id) {
    if (!id) return null;
    if (typeof window.findItem === 'function') {
      var row = await window.findItem(getStorageKey('PROYECTOS', 'proyectos'), id);
      if (row) { var proyecto = normalizeProyecto(row); proyecto.clienteNombre = await getClienteNombre(proyecto.clienteId); return proyecto; }
    }
    var proyectos = await obtenerProyectos();
    for (var i = 0; i < proyectos.length; i++) { if (String(proyectos[i].id) === String(id)) return proyectos[i]; }
    return null;
  }

  async function obtenerFilasProyectoCompat(tableKey, proyectoId) { var tableName = getStorageKey(tableKey, tableKey.toLowerCase()); var rows = await getFiltered(tableName, { proyecto_id: proyectoId }, { orderBy: 'created_at', ascending: false }); return rows.length ? rows : []; }
  async function obtenerGastosProyecto(proyectoId) { var rows = await obtenerFilasProyectoCompat('GASTOS', proyectoId); return rows.map(normalizeGasto); }
  async function obtenerPagosProyecto(proyectoId) { var rows = await obtenerFilasProyectoCompat('PAGOS', proyectoId); return rows.map(normalizePago); }
  async function obtenerTareasProyecto(proyectoId) { var rows = await obtenerFilasProyectoCompat('TAREAS', proyectoId); return rows.map(normalizeTarea); }

  async function obtenerCotizacionProyecto(proyectoId) {
    if (!proyectoId) return null;
    if (typeof window.obtenerCotizacionProyecto === 'function') return await window.obtenerCotizacionProyecto(proyectoId);
    var rows = await getFiltered('cotizaciones', { proyecto_id: proyectoId }, { orderBy: 'created_at', ascending: false });
    return rows && rows.length ? rows[0] : null;
  }

  async function actualizarSelectClientesProyecto() {
    var select = byId('proy-cliente');
    if (!select) return;
    var clientes = await obtenerClientes();
    var currentValue = select.value;
    var html = '<option value="">Selecciona un cliente</option>';
    for (var i = 0; i < clientes.length; i++) { html += '<option value="' + esc(clientes[i].id) + '">' + esc(clientes[i].nombre) + '</option>'; }
    select.innerHTML = html;
    if (currentValue) select.value = currentValue;
  }

  function generarIdProyectoLegible(proyecto) {
    var fecha = proyecto.fechaInicio || proyecto.createdAt || todayISO();
    var d = new Date(fecha);
    if (isNaN(d.getTime())) d = new Date();
    var dia = String(d.getDate()).padStart(2, '0');
    var mes = String(d.getMonth() + 1).padStart(2, '0');
    var ano = String(d.getFullYear()).slice(-2);
    return 'PRO-' + dia + mes + ano;
  }

  async function renderProyectos(filtro) {
    var tbody = byId('tbodyProyectos');
    if (!tbody) return false;
    var proyectos = await obtenerProyectos();
    if (filtro && filtro !== 'todos') { proyectos = proyectos.filter(function(p) { return p.estado === filtro; }); }
    if (!proyectos.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay proyectos registrados</td></tr>'; return false; }
    var html = '';
    proyectos.forEach(function(p) {
      var fecha = formatDateSafe(p.fechaInicio || p.createdAt || '');
      var idLegible = generarIdProyectoLegible(p);
      html += '<tr>';
      html += '<td>' + esc(fecha) + '</td>';
      html += '<td>' + esc(idLegible) + '</td>';
      html += '<td><button type="button" class="link-button" onclick="verProyecto(&#39;' + esc(p.id) + '&#39;)">' + esc(p.nombre || 'Proyecto') + '</button></td>';
      html += '<td>' + esc(p.clienteNombre || 'Sin cliente') + '</td>';
      html += '<td>' + money(p.presupuesto) + '</td>';
      html += '<td>' + money(p.totalCobrado) + '</td>';
      html += '<td>' + money(p.totalGastado) + '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
    return false;
  }

  async function buscarProyectos() {
    var input = byId('buscar-proyecto');
    var term = input ? input.value.trim().toLowerCase() : '';
    var proyectos = await obtenerProyectos();
    proyectos = proyectos.filter(function(p) { if (!term) return true; return (p.nombre || '').toLowerCase().indexOf(term) !== -1 || (p.clienteNombre || '').toLowerCase().indexOf(term) !== -1 || (p.descripcion || '').toLowerCase().indexOf(term) !== -1; });
    var tbody = byId('tbodyProyectos');
    if (!tbody) return false;
    if (!proyectos.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No se encontraron proyectos</td></tr>'; return false; }
    var html = '';
    proyectos.forEach(function(p) {
      var fecha = formatDateSafe(p.fechaInicio || p.createdAt || '');
      var idLegible = generarIdProyectoLegible(p);
      html += '<tr>';
      html += '<td>' + esc(fecha) + '</td>';
      html += '<td>' + esc(idLegible) + '</td>';
      html += '<td><button type="button" class="link-button" onclick="verProyecto(&#39;' + esc(p.id) + '&#39;)">' + esc(p.nombre || 'Proyecto') + '</button></td>';
      html += '<td>' + esc(p.clienteNombre || 'Sin cliente') + '</td>';
      html += '<td>' + money(p.presupuesto) + '</td>';
      html += '<td>' + money(p.totalCobrado) + '</td>';
      html += '<td>' + money(p.totalGastado) + '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
    return false;
  }

  async function filtrarProyectos(estado) {
    await renderProyectos(estado || 'todos');
    qsa('[onclick*="filtrarProyectos("]').forEach(function(btn) {
      btn.classList.remove('active');
      var onclick = btn.getAttribute('onclick') || '';
      if (onclick.indexOf("'" + (estado || 'todos') + "'") !== -1 || onclick.indexOf('"' + (estado || 'todos') + '"') !== -1) btn.classList.add('active');
    });
    return false;
  }

  function setText(id, value) { var el = byId(id); if (el) el.textContent = value; }
  function setValue(id, value) { var el = byId(id); if (el) el.value = value; }
  function setDisplay(id, show) { var el = byId(id); if (el) el.style.display = show ? 'block' : 'none'; }

  function actualizarProgresoVisual(avance) {
    var pct = Math.max(0, Math.min(100, intVal(avance)));
    var txt = byId('proyecto-progreso-pct');
    if (txt) txt.textContent = pct + '%';
    var wrap = byId('proyecto-progreso-visual');
    if (wrap) {
      var circles = wrap.querySelectorAll('circle');
      if (circles.length > 1) { var circumference = 283; var offset = circumference - (pct / 100) * circumference; circles[1].setAttribute('stroke-dashoffset', String(offset)); }
    }
    var kpiAvance = byId('resumen-kpi-avance');
    if (kpiAvance) kpiAvance.textContent = pct + '%';
  }

  function renderTimeline(proyecto, tareas, gastos, pagos) {
    var container = byId('proyecto-timeline');
    if (!container) return;
    var eventos = [];
    if (proyecto.fechaInicio) { eventos.push({ fecha: proyecto.fechaInicio, tipo: 'inicio', titulo: 'Inicio del proyecto', descripcion: proyecto.nombre }); }
    if (proyecto.fechaFin) { eventos.push({ fecha: proyecto.fechaFin, tipo: 'meta', titulo: 'Fecha fin estimada', descripcion: 'Fecha objetivo del proyecto' }); }
    if (proyecto.fechaFinReal) { eventos.push({ fecha: proyecto.fechaFinReal, tipo: 'cierre', titulo: 'Fecha fin real', descripcion: 'Cierre real del proyecto' }); }
    tareas.forEach(function(t) { eventos.push({ fecha: t.fechaLimite || t.createdAt || '', tipo: 'tarea', titulo: t.titulo, descripcion: 'Tarea ' + (t.estado || 'pendiente') + (t.asignado ? ' · ' + t.asignado : '') }); });
    gastos.forEach(function(g) { eventos.push({ fecha: g.fecha || g.createdAt || '', tipo: 'gasto', titulo: g.descripcion, descripcion: 'Gasto ' + money(g.monto) }); });
    pagos.forEach(function(p) { eventos.push({ fecha: p.fecha || p.createdAt || '', tipo: 'pago', titulo: p.concepto, descripcion: 'Pago recibido ' + money(p.monto) }); });
    eventos = eventos.filter(function(e) { return e.fecha; });
    eventos.sort(function(a, b) { return new Date(b.fecha) - new Date(a.fecha); });
    if (!eventos.length) { container.innerHTML = '<div class="empty-state">No hay actividad registrada en la línea de tiempo</div>'; return; }
    var iconos = { inicio: 'ph-rocket', meta: 'ph-calendar', cierre: 'ph-check-circle', tarea: 'ph-puzzle-piece', gasto: 'ph-currency-dollar', pago: 'ph-coins' };
    var colores = { inicio: '#2D8B5E', meta: '#C5A253', cierre: '#2D8B5E', tarea: '#C5A253', gasto: '#F87171', pago: '#2D8B5E' };
    var html = '';
    for (var i = 0; i < eventos.length; i++) {
      var ev = eventos[i];
      var icono = iconos[ev.tipo] || 'ph-circle';
      var color = colores[ev.tipo] || '#C5A253';
      html += '<div class="timeline-item" style="border-left:3px solid ' + color + ';padding:10px 14px;margin-bottom:12px;background:rgba(255,255,255,0.02);border-radius:10px;">';
      html += '<div style="font-weight:700;display:flex;align-items:center;gap:8px;"><i class="ph ' + icono + '" style="color:' + color + ';"></i> ' + esc(ev.titulo) + '</div>';
      html += '<div style="opacity:.8;margin-top:4px;font-size:12px;">' + esc(formatDateSafe(ev.fecha)) + '</div>';
      html += '<div style="margin-top:6px;font-size:13px;">' + esc(ev.descripcion) + '</div>';
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function renderTablaGastos(gastos) {
    var tbody = byId('tbodyGastosProyecto');
    if (!tbody) return;
    if (!gastos.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay gastos registrados</td></tr>'; return; }
    var html = '';
    for (var i = 0; i < gastos.length; i++) { html += '<tr><td>' + esc(formatDateSafe(gastos[i].fecha)) + '</td><td>' + esc(gastos[i].categoria) + '</td><td>' + esc(gastos[i].descripcion) + '</td><td>' + money(gastos[i].monto) + '</td><td>' + esc(gastos[i].metodo) + '</td></tr>'; }
    tbody.innerHTML = html;
  }

  function renderTablaPagos(pagos) {
    var tbody = byId('tbodyPagosProyecto');
    if (!tbody) return;
    if (!pagos.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay pagos registrados</td></tr>'; return; }
    var html = '';
    for (var i = 0; i < pagos.length; i++) { var color = estadoColor(pagos[i].estado); html += '<tr><td>' + esc(formatDateSafe(pagos[i].fecha)) + '</td><td>' + esc(pagos[i].concepto) + '</td><td>' + money(pagos[i].monto) + '</td><td>' + esc(pagos[i].metodo) + '</td><td><span class="estado-badge" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '55;">' + esc(estadoLabel(pagos[i].estado)) + '</span></td></tr>'; }
    tbody.innerHTML = html;
  }

  function renderKanbanTareas(tareas) {
    var container = byId('tareas-kanban');
    if (!container) return;
    var estados = ['pendiente', 'en_progreso', 'revision', 'completada'];
    var titulos = { pendiente: 'Pendiente', en_progreso: 'En Progreso', revision: 'En Revisión', completada: 'Completada' };
    var coloresHeader = { pendiente: '#6B7280', en_progreso: '#C5A253', revision: '#C5A253', completada: '#123524' };
    var html = '';
    for (var e = 0; e < estados.length; e++) {
      var estado = estados[e];
      var tareasEstado = tareas.filter(function(t) { return t.estado === estado; });
      html += '<div class="kanban-column">';
      html += '<div class="kanban-col-header ' + estado + '" style="border-top:3px solid ' + coloresHeader[estado] + ';">';
      html += '<span>' + titulos[estado] + '</span>';
      html += '<span style="background:rgba(255,255,255,0.06);padding:2px 10px;border-radius:12px;font-size:12px;">' + tareasEstado.length + '</span>';
      html += '</div>';
      html += '<div class="kanban-col-body">';
      if (!tareasEstado.length) { html += '<div style="text-align:center;padding:20px;color:var(--gn-text-muted);font-size:12px;">Sin tareas</div>'; }
      else {
        for (var i = 0; i < tareasEstado.length; i++) {
          var t = tareasEstado[i];
          html += '<div class="kanban-card" onclick="editarTareaProyecto(&#39;' + esc(t.id) + '&#39;)">';
          html += '<div class="kanban-card-title">' + esc(t.titulo) + '</div>';
          html += '<div class="kanban-card-meta">';
          if (t.asignado) html += '<span><i class="ph ph-user"></i> ' + esc(t.asignado) + '</span>';
          if (t.fechaLimite) html += '<span><i class="ph ph-calendar"></i> ' + esc(formatDateSafe(t.fechaLimite)) + '</span>';
          html += '</div>';
          html += '</div>';
        }
      }
      html += '</div></div>';
    }
    container.innerHTML = html;
  }

  function destroyProyectoChart() { if (CHART_PROYECTO && typeof CHART_PROYECTO.destroy === 'function') { CHART_PROYECTO.destroy(); CHART_PROYECTO = null; } }

  function renderProyectoChart(totalPagos, totalGastos, porCobrar) {
    var canvas = byId('chartProyectoBalance');
    if (!canvas || typeof window.Chart === 'undefined') return;
    destroyProyectoChart();
    var ctx = canvas.getContext('2d');
    CHART_PROYECTO = new window.Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['Pagos', 'Gastos', 'Por Cobrar'], datasets: [{ data: [totalPagos, totalGastos, porCobrar], backgroundColor: ['#2D8B5E', '#F87171', '#C5A253'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#F0F0F5' } } } }
    });
  }

  async function renderDetalleProyecto(proyecto) {
    var gastos = await obtenerGastosProyecto(proyecto.id);
    var pagos = await obtenerPagosProyecto(proyecto.id);
    var tareas = await obtenerTareasProyecto(proyecto.id);
    var cotizacion = await obtenerCotizacionProyecto(proyecto.id);

    var totalGastosFiltrado = gastos.reduce(function(acc, item) { return acc + item.monto; }, 0);
    var totalPagosFiltrado = pagos.reduce(function(acc, item) { return acc + item.monto; }, 0);

    var totalGastos = totalGastosFiltrado > 0 ? totalGastosFiltrado : num(proyecto.totalGastado);
    var totalPagos = totalPagosFiltrado > 0 ? totalPagosFiltrado : num(proyecto.totalCobrado);
    var presupuesto = num(proyecto.presupuesto);
    var porCobrar = Math.max(0, presupuesto - totalPagos);
    var utilidad = totalPagos - totalGastos;
    var avance = proyecto.avance || deriveAvance(proyecto.raw);

    // Header
    setText('detalle-proyecto-nombre', text(proyecto.nombre, 'Proyecto'));
    setText('detalle-proyecto-estado', estadoLabel(proyecto.estado));
    setText('detalle-proyecto-cliente', text(proyecto.clienteNombre, 'Sin cliente'));
    setText('detalle-proyecto-fecha', formatDateSafe(proyecto.fechaInicio));
    setText('detalle-proyecto-presupuesto', money(proyecto.presupuesto));

    // KPIs
    setText('resumen-kpi-presupuesto', money(presupuesto));
    setText('resumen-kpi-gastos', money(totalGastos));
    setText('resumen-kpi-pagos', money(totalPagos));
    setText('resumen-kpi-utilidad', money(utilidad));
    setText('resumen-kpi-por-cobrar', money(porCobrar));

    // Resumen financiero
    setText('resumen-presupuesto', money(presupuesto));
    setText('resumen-gastos', money(totalGastos));
    setText('resumen-pagos', money(totalPagos));
    setText('resumen-por-cobrar', money(porCobrar));
    setText('resumen-utilidad', money(utilidad));

    setValue('proyecto-notas', proyecto.notas || '');
    actualizarProgresoVisual(avance);
    renderTimeline(proyecto, tareas, gastos, pagos);
    renderTablaGastos(gastos);
    renderTablaPagos(pagos);
    renderKanbanTareas(tareas);
    renderProyectoChart(totalPagos, totalGastos, porCobrar);

    // Documentos: renderizar cotización
    if (typeof window.renderCotizacionDocumento === 'function') {
      await window.renderCotizacionDocumento('cotizacion-documento-container', proyecto.cotizacionId || (cotizacion ? cotizacion.id : null));
    } else {
      var docContainer = byId('cotizacion-documento-container');
      if (docContainer) {
        if (cotizacion) { docContainer.innerHTML = '<div class="empty-state">Cotización: ' + esc(cotizacion.numero || '') + ' — Función de renderizado no disponible</div>'; }
        else { docContainer.innerHTML = '<div class="empty-state">No hay cotización asociada a este proyecto.</div>'; }
      }
    }

    setDisplay('proyecto-detalle', true);
    var panel = byId('proyecto-detalle');
    if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    switchProyectoTab('resumen');
  }

  async function verProyecto(id) {
    var proyecto = await obtenerProyectoPorId(id);
    if (!proyecto) return false;
    PROYECTO_ACTUAL = proyecto;
    await renderDetalleProyecto(proyecto);
    return false;
  }

  function volverAListaProyectos() { setDisplay('proyecto-detalle', false); PROYECTO_ACTUAL = null; destroyProyectoChart(); return false; }

  function switchProyectoTab(tabId) {
    ['resumen', 'financiero', 'tareas', 'documentos'].forEach(function(key) {
      var pane = byId('proyecto-tab-' + key);
      if (pane) { pane.style.display = key === tabId ? 'block' : 'none'; pane.classList.toggle('active', key === tabId); }
    });
    qsa('.proyecto-tab').forEach(function(btn) {
      var onclick = btn.getAttribute('onclick') || '';
      var active = onclick.indexOf("'" + tabId + "'") !== -1 || onclick.indexOf('"' + tabId + '"') !== -1;
      btn.classList.toggle('active', active);
    });
    return false;
  }

  async function guardarNotasProyecto() {
    if (!PROYECTO_ACTUAL) return false;
    var notasEl = byId('proyecto-notas');
    var notas = notasEl ? notasEl.value : '';
    var ok = await updateRow(getStorageKey('PROYECTOS', 'proyectos'), PROYECTO_ACTUAL.id, { notas: notas });
    if (!ok) { alert('No se pudieron guardar las notas del proyecto.'); return false; }
    PROYECTO_ACTUAL.notas = notas;
    if (window.showToast) { window.showToast({ type: 'success', title: 'Notas guardadas', message: 'Las notas del proyecto se actualizaron correctamente.' }); }
    return false;
  }

  async function guardarTareaProyecto(event) {
    if (event) event.preventDefault();
    if (!PROYECTO_ACTUAL) return false;
    var titulo = byId('tarea-titulo') ? byId('tarea-titulo').value.trim() : '';
    var responsable = byId('tarea-asignado') ? byId('tarea-asignado').value.trim() : '';
    var fechaLimite = byId('tarea-fecha-limite') ? byId('tarea-fecha-limite').value : '';
    var estado = byId('tarea-estado') ? byId('tarea-estado').value : 'pendiente';
    var form = byId('formTareaProyecto');
    if (!titulo) { alert('Completa el título de la tarea.'); return false; }

    var payload = { proyecto_id: PROYECTO_ACTUAL.id, titulo: titulo, estado: estado };
    if (responsable) payload.responsable = responsable;
    if (fechaLimite) payload.fecha_limite = fechaLimite;

    var result = await insertRow(getStorageKey('TAREAS', 'tareas'), payload);
    if (!result) { 
      alert('No se pudo guardar la tarea. Error de conexión con Supabase.'); 
      return false; 
    }
    if (form) form.reset();
    await verProyecto(PROYECTO_ACTUAL.id);
    if (typeof window.actualizarKPIs === 'function') await window.actualizarKPIs();
    return false;
  }

  function editarTareaProyecto(tareaId) {
    if (!tareaId || !PROYECTO_ACTUAL) return false;
    if (window.showToast) { window.showToast({ type: 'info', title: 'Editar tarea', message: 'Función de edición de tareas en desarrollo.' }); }
    return false;
  }

  function seleccionarProyectoEnFinanzas(proyecto) {
    if (!proyecto) return;
    var selectGasto = byId('gasto-proyecto'); if (selectGasto) selectGasto.value = proyecto.id;
    var selectPago = byId('pago-proyecto'); if (selectPago) selectPago.value = proyecto.id;
    var selectEstadoCuenta = byId('ec-proyecto'); if (selectEstadoCuenta) selectEstadoCuenta.value = proyecto.id;
  }

  function navegarAFinanzasConProyecto(tipo) {
    if (!PROYECTO_ACTUAL) { alert('No hay proyecto activo seleccionado.'); return false; }
    if (typeof window.switchSection === 'function') window.switchSection('finanzas');
    if (typeof window.switchSubSection === 'function') window.switchSubSection('finanzas', 'estado-cuenta');
    if (typeof window.actualizarSelectProyectosFinanzas === 'function') window.actualizarSelectProyectosFinanzas();
    setTimeout(function() {
      seleccionarProyectoEnFinanzas(PROYECTO_ACTUAL);
      if (typeof window.generarEstadoCuenta === 'function') window.generarEstadoCuenta();
      var targetId = tipo === 'gasto' ? 'form-gasto-finanzas' : 'form-pago-finanzas';
      var target = byId(targetId);
      if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return false;
  }

  function abrirModalGastoProyecto() { return navegarAFinanzasConProyecto('gasto'); }
  function abrirModalPagoProyecto() { return navegarAFinanzasConProyecto('pago'); }

  // ============================================================
  // Generar tareas automáticas desde items de cotización (JSONB)
  // ============================================================
  async function generarTareasDesdeCotizacion(proyectoId, cotizacionId) {
    if (!proyectoId || !cotizacionId) return;
    try {
      var cot = await findItem('cotizaciones', cotizacionId);
      if (!cot || !cot.items) return;
      var items = [];
      try { items = typeof cot.items === 'string' ? JSON.parse(cot.items) : cot.items; } catch (e) { items = []; }
      if (!items || !items.length) return;
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var payload = { proyecto_id: proyectoId, titulo: (item.descripcion || 'Servicio').substring(0, 100), estado: 'pendiente', descripcion: 'Generada desde cotización' };
        await insertRow(getStorageKey('TAREAS', 'tareas'), payload);
      }
      if (window.showToast) { window.showToast({ type: 'success', title: 'Tareas generadas', message: 'Se crearon ' + items.length + ' tareas desde la cotización.' }); }
    } catch (error) { console.error('Error generando tareas desde cotización', error); }
  }

  // ============================================================
  // Guardar proyecto + cotización desde proforma
  // ============================================================
  async function guardarProformaProyecto(event) {
    if (event) event.preventDefault();
    var form = byId('formProformaProyecto');
    var feedback = byId('feedback-proforma');
    if (!form) return false;
    if (feedback) { feedback.className = 'form-feedback'; feedback.style.display = 'none'; feedback.textContent = ''; }

    try {
      var nombreProyecto = byId('pf-nombre-proyecto') ? byId('pf-nombre-proyecto').value.trim() : '';
      var fecha = byId('pf-fecha') ? byId('pf-fecha').value : todayISO();
      var clienteSelect = byId('pf-cliente');
      var alcanceEditor = byId('pf-alcance-editor');
      var alcanceTextarea = byId('pf-alcance');

      if (!nombreProyecto || !clienteSelect || !clienteSelect.value) {
        if (feedback) { feedback.className = 'form-feedback error'; feedback.textContent = 'Completa nombre de proyecto y cliente.'; feedback.style.display = 'block'; }
        return false;
      }

      var clienteId = clienteSelect.value;
      var clienteNombre = (clienteSelect.options[clienteSelect.selectedIndex] || {}).text || 'Cliente';
      if (alcanceEditor && alcanceTextarea) alcanceTextarea.value = alcanceEditor.innerHTML;
      var alcanceHtml = alcanceTextarea ? alcanceTextarea.value : '';

      var tbody = byId('tbodyProformaServicios');
      var items = [];
      var subtotal = 0;
      var itbmsTotal = 0;

      if (tbody) {
        Array.prototype.slice.call(tbody.querySelectorAll('tr')).forEach(function(tr) {
          var nombreInput = tr.querySelector('.pf-input-nombre');
          var unidadSelect = tr.querySelector('.pf-select-unidad');
          var cantInput = tr.querySelector('.pf-input-cantidad');
          var precioInput = tr.querySelector('.pf-input-precio');
          var itbmsCheck = tr.querySelector('.pf-check-itbms');
          if (!nombreInput) return;
          var descripcion = (nombreInput.value || '').trim();
          var unidad = (unidadSelect ? unidadSelect.value : 'und').trim() || 'und';
          var cant = parseFloat(cantInput ? cantInput.value : '0') || 0;
          var precio = parseFloat(precioInput ? precioInput.value : '0') || 0;
          var aplicaItbms = itbmsCheck ? itbmsCheck.checked : false;
          var totalFila = cant * precio;
          if (!descripcion) return;
          subtotal += totalFila;
          if (aplicaItbms) itbmsTotal += totalFila * 0.07;
          items.push({ descripcion: descripcion, unidad: unidad, cantidad: cant, precio: precio, total: totalFila, itbms: aplicaItbms });
        });
      }

      var itbmsGlobal = byId('pf-aplica-itbms');
      if (itbmsGlobal && itbmsGlobal.checked) itbmsTotal = subtotal * 0.07;
      var totalPropuesta = subtotal + itbmsTotal;

      if (!items.length || subtotal <= 0) {
        if (feedback) { feedback.className = 'form-feedback error'; feedback.textContent = 'Añade al menos un servicio a la propuesta económica.'; feedback.style.display = 'block'; }
        return false;
      }

      // 1. Crear proyecto
      var payloadProyecto = { cliente_id: clienteId, nombre: nombreProyecto, descripcion: alcanceHtml, fecha_inicio: fecha || todayISO(), estado: 'en_progreso', presupuesto: totalPropuesta, total_cobrado: 0, total_gastado: 0, notas: '' };
      var proyecto = await insertRow(getStorageKey('PROYECTOS', 'proyectos'), payloadProyecto);
      if (!proyecto) {
        if (feedback) { feedback.className = 'form-feedback error'; feedback.textContent = 'No se pudo guardar el proyecto.'; feedback.style.display = 'block'; }
        return false;
      }

      // 2. Crear cotización vinculada al proyecto
      var userId = await getSessionUserId();
      var cotizacion = null;
      if (typeof window.crearCotizacionDesdeProforma === 'function') {
        cotizacion = await window.crearCotizacionDesdeProforma({
          userId: userId, proyectoId: proyecto.id, clienteId: clienteId, clienteNombre: clienteNombre,
          fecha: fecha, nombreProyecto: nombreProyecto, alcanceHtml: alcanceHtml,
          items: items, subtotal: subtotal, itbms: itbmsTotal, total: totalPropuesta
        });
      }

      // 3. Generar tareas automáticas desde cotización
      if (cotizacion && cotizacion.id) { await generarTareasDesdeCotizacion(proyecto.id, cotizacion.id); }

      if (feedback) { feedback.className = 'form-feedback success'; feedback.textContent = 'Proyecto, cotización y tareas creados correctamente.'; feedback.style.display = 'block'; }

      form.reset();
      if (byId('pf-fecha')) byId('pf-fecha').value = todayISO();
      if (alcanceEditor) alcanceEditor.innerHTML = '';
      if (byId('tbodyProformaServicios')) byId('tbodyProformaServicios').innerHTML = '';
      actualizarTotalesProforma();

      await renderProyectos('todos');
      if (typeof window.actualizarKPIs === 'function') window.actualizarKPIs();
      if (typeof window.actualizarSelectProyectosFinanzas === 'function') window.actualizarSelectProyectosFinanzas();

      return false;
    } catch (error) {
      console.error('Error guardando proforma de proyecto', error);
      if (feedback) { feedback.className = 'form-feedback error'; feedback.textContent = 'Ocurrió un error al guardar la proforma.'; feedback.style.display = 'block'; }
      return false;
    }
  }

  // ============================================================
  // Imprimir / Descargar cotización
  // ============================================================
  function imprimirCotizacionProyecto() {
    if (!PROYECTO_ACTUAL) return false;
    var container = byId('cotizacion-documento-container');
    if (!container) return false;
    var cotDoc = container.querySelector('.cot-doc-container');
    if (!cotDoc) { alert('No hay cotización para imprimir.'); return false; }
    var printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Cotización ' + esc(PROYECTO_ACTUAL.nombre || '') + '</title>');
    printWindow.document.write('<style>body{font-family:Inter,sans-serif;margin:0;padding:20px;background:#f5f5f5;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(cotDoc.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() { printWindow.print(); }, 500);
    return false;
  }

  function descargarCotizacionPDF() {
    if (!PROYECTO_ACTUAL) return false;
    if (window.showToast) { window.showToast({ type: 'info', title: 'Descargar PDF', message: 'Función de descarga PDF en desarrollo. Usa Imprimir > Guardar como PDF.' }); }
    return false;
  }

  // ============================================================
  // Funciones de proforma (sin cambios)
  // ============================================================
  function togglePanelProforma() {
    var panel = byId('proyecto-proforma-panel');
    if (!panel) return;
    var isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    if (isHidden) { panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); cargarSelectClientesProforma(); cargarSelectServiciosCatalogo(); }
  }

  async function cargarSelectClientesProforma() {
    var select = byId('pf-cliente');
    if (!select) return;
    var clientes = await obtenerClientes();
    var currentValue = select.value;
    var html = '<option value="">Selecciona un cliente</option>';
    for (var i = 0; i < clientes.length; i++) html += '<option value="' + esc(clientes[i].id) + '">' + esc(clientes[i].nombre) + '</option>';
    select.innerHTML = html;
    if (currentValue) select.value = currentValue;
  }

  async function cargarSelectServiciosCatalogo() {
    var select = byId('pf-select-servicio-catalogo');
    if (!select) return;
    var servicios = [];
    if (typeof window.obtenerServicios === 'function') servicios = await window.obtenerServicios();
    servicios = Array.isArray(servicios) ? servicios : [];
    var html = '<option value="">-- Selecciona un servicio del catalogo --</option>';
    for (var i = 0; i < servicios.length; i++) {
      var s = servicios[i];
      var nombre = s.descripcion || s.nombre || s.codigo || 'Servicio';
      var precio = parseFloat(s.precio || 0) || 0;
      var unidad = s.unidad || 'und';
      var itbms = parseInt(s.itbms, 10) === 1 ? 1 : 0;
      html += '<option value="' + esc(s.id || '') + '" data-nombre="' + esc(nombre) + '" data-precio="' + precio + '" data-unidad="' + esc(unidad) + '" data-itbms="' + itbms + '">' + esc(nombre) + ' — ' + money(precio) + ' / ' + esc(unidad) + '</option>';
    }
    select.innerHTML = html;
  }

  function agregarServicioCatalogoAProforma() {
    var select = byId('pf-select-servicio-catalogo');
    if (!select || !select.value) { if (window.showToast) window.showToast({ type: 'warning', title: 'Selecciona un servicio', message: 'Elige un servicio del catalogo para agregarlo a la propuesta.' }); return; }
    var option = select.options[select.selectedIndex];
    var nombre = option.getAttribute('data-nombre') || 'Servicio';
    var precio = parseFloat(option.getAttribute('data-precio') || 0) || 0;
    var unidad = option.getAttribute('data-unidad') || 'und';
    var itbms = parseInt(option.getAttribute('data-itbms') || '0', 10);
    agregarFilaProforma(nombre, unidad, '', precio.toFixed(2), itbms);
    select.value = '';
  }

  function agregarFilaProformaVacia() { agregarFilaProforma('', '', '', '', 0); }

  var UNIDADES_OPCIONES = [
    { value: 'und', label: 'und', step: '1' }, { value: 'hr', label: 'hr', step: '1' },
    { value: 'dia', label: 'día', step: '0.01' }, { value: 'mes', label: 'mes', step: '0.01' },
    { value: 'pagina', label: 'pág', step: '1' }, { value: 'proyecto', label: 'proy', step: '1' },
    { value: 'paquete', label: 'paq', step: '1' }
  ];

  function buildUnidadSelect(selectedValue) {
    var html = '<select class="pf-select-unidad" style="width:100px;padding:6px 8px;background:transparent;border:1px solid rgba(18,53,36,0.25);border-radius:6px;color:#F0F0F5;font-size:13px;">';
    for (var i = 0; i < UNIDADES_OPCIONES.length; i++) { var opt = UNIDADES_OPCIONES[i]; var sel = opt.value === selectedValue ? ' selected' : ''; html += '<option value="' + opt.value + '"' + sel + '>' + opt.label + '</option>'; }
    html += '</select>';
    return html;
  }

  function agregarFilaProforma(nombre, unidad, cantidad, precio, itbms) {
    var tbody = byId('tbodyProformaServicios');
    if (!tbody) return;
    var tr = document.createElement('tr');
    var stepInicial = '0.01';
    for (var u = 0; u < UNIDADES_OPCIONES.length; u++) { if (UNIDADES_OPCIONES[u].value === unidad) { stepInicial = UNIDADES_OPCIONES[u].step; break; } }
    var html = '';
    html += '<td><input type="text" class="pf-input-nombre" value="' + esc(nombre) + '" placeholder="Descripcion del servicio" style="width:100%;padding:6px 8px;background:transparent;border:1px solid rgba(18,53,36,0.25);border-radius:6px;color:#F0F0F5;font-size:13px;"></td>';
    html += '<td>' + buildUnidadSelect(unidad) + '</td>';
    html += '<td><input type="number" class="pf-input-cantidad" value="' + esc(cantidad) + '" placeholder="0" min="0" step="' + stepInicial + '" style="width:80px;padding:6px 8px;background:transparent;border:1px solid rgba(18,53,36,0.25);border-radius:6px;color:#F0F0F5;font-size:13px;text-align:center;"></td>';
    html += '<td><input type="number" class="pf-input-precio" value="' + esc(precio) + '" placeholder="0.00" min="0" step="0.01" style="width:100px;padding:6px 8px;background:transparent;border:1px solid rgba(18,53,36,0.25);border-radius:6px;color:#F0F0F5;font-size:13px;text-align:right;"></td>';
    html += '<td style="text-align:center;"><input type="checkbox" class="pf-check-itbms" ' + (itbms ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:#C5A253;cursor:pointer;"></td>';
    html += '<td class="pf-total-fila" style="font-weight:600;text-align:right;">0.00</td>';
    html += '<td style="text-align:center;"><button type="button" class="btn-eliminar-fila" style="background:none;border:none;color:#F87171;cursor:pointer;font-size:16px;"><i class="ph ph-trash"></i></button></td>';
    tr.innerHTML = html;

    var btnEliminar = tr.querySelector('.btn-eliminar-fila');
    if (btnEliminar) btnEliminar.addEventListener('click', function() { tr.remove(); actualizarTotalesProforma(); });

    var selectUnidad = tr.querySelector('.pf-select-unidad');
    var inputCantidad = tr.querySelector('.pf-input-cantidad');
    if (selectUnidad && inputCantidad) {
      selectUnidad.addEventListener('change', function() {
        for (var u = 0; u < UNIDADES_OPCIONES.length; u++) { if (UNIDADES_OPCIONES[u].value === selectUnidad.value) { inputCantidad.setAttribute('step', UNIDADES_OPCIONES[u].step); break; } }
        actualizarTotalesProforma();
      });
    }

    var inputs = tr.querySelectorAll('input, select');
    for (var k = 0; k < inputs.length; k++) { if (inputs[k] === selectUnidad) continue; inputs[k].addEventListener('input', function() { actualizarTotalesProforma(); }); inputs[k].addEventListener('change', function() { actualizarTotalesProforma(); }); }
    tbody.appendChild(tr);
    actualizarTotalesProforma();
  }

  function actualizarTotalesProforma() {
    var tbody = byId('tbodyProformaServicios');
    if (!tbody) return;
    var filas = tbody.querySelectorAll('tr');
    var subtotal = 0;
    var itbmsTotal = 0;
    for (var i = 0; i < filas.length; i++) {
      var tr = filas[i];
      var cantidadInput = tr.querySelector('.pf-input-cantidad');
      var precioInput = tr.querySelector('.pf-input-precio');
      var itbmsCheck = tr.querySelector('.pf-check-itbms');
      var totalCell = tr.querySelector('.pf-total-fila');
      var cantidad = parseFloat(cantidadInput ? cantidadInput.value : 0) || 0;
      var precio = parseFloat(precioInput ? precioInput.value : 0) || 0;
      var aplicaItbms = itbmsCheck ? itbmsCheck.checked : false;
      var totalFila = cantidad * precio;
      if (totalCell) totalCell.textContent = totalFila.toFixed(2);
      subtotal += totalFila;
      if (aplicaItbms) itbmsTotal += totalFila * 0.07;
    }
    var itbmsGlobal = byId('pf-aplica-itbms');
    if (itbmsGlobal && itbmsGlobal.checked) itbmsTotal = subtotal * 0.07;
    var total = subtotal + itbmsTotal;
    var elSubtotal = byId('pf-subtotal-propuesta');
    var elItbms = byId('pf-itbms-total');
    var elTotal = byId('pf-total-propuesta');
    var elItbmsMonto = byId('pf-itbms-monto');
    if (elSubtotal) elSubtotal.textContent = money(subtotal);
    if (elItbms) elItbms.textContent = money(itbmsTotal);
    if (elTotal) elTotal.textContent = money(total);
    if (elItbmsMonto) elItbmsMonto.textContent = itbmsTotal > 0 ? 'ITBMS incluido: ' + money(itbmsTotal) : '';
  }

  function inicializarEditorAlcance() {
    var toolbar = document.querySelector('.editor-toolbar');
    var editor = byId('pf-alcance-editor');
    if (!toolbar || !editor) return;
    toolbar.addEventListener('click', function(e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      e.preventDefault();
      var cmd = btn.getAttribute('data-cmd');
      if (!cmd) return;
      editor.focus();
      if (cmd === 'bold') document.execCommand('bold', false, null);
      else if (cmd === 'italic') document.execCommand('italic', false, null);
      else if (cmd === 'unorderedList') document.execCommand('insertUnorderedList', false, null);
      else if (cmd === 'orderedList') document.execCommand('insertOrderedList', false, null);
    });
  }

  async function inicializarProyectos() {
    await ensureClientesCache();
    await actualizarSelectClientesProyecto();
    await renderProyectos('todos');
    if (byId('proy-fecha') && !byId('proy-fecha').value) byId('proy-fecha').value = todayISO();
    if (byId('buscar-proyecto')) byId('buscar-proyecto').addEventListener('input', function() { buscarProyectos(); });
    var itbmsGlobal = byId('pf-aplica-itbms');
    if (itbmsGlobal) itbmsGlobal.addEventListener('change', actualizarTotalesProforma);
    inicializarEditorAlcance();
    var pfFecha = byId('pf-fecha');
    if (pfFecha && !pfFecha.value) pfFecha.value = (new Date()).toISOString().slice(0, 10);
  }

  // Exponer funciones
  window.inicializarProyectos = inicializarProyectos;
  window.actualizarSelectClientesProyecto = actualizarSelectClientesProyecto;
  window.obtenerProyectos = obtenerProyectos;
  window.renderProyectos = renderProyectos;
  window.buscarProyectos = buscarProyectos;
  window.filtrarProyectos = filtrarProyectos;
  window.verProyecto = verProyecto;
  window.renderDetalleProyecto = renderDetalleProyecto;
  window.volverAListaProyectos = volverAListaProyectos;
  window.switchProyectoTab = switchProyectoTab;
  window.guardarNotasProyecto = guardarNotasProyecto;
  window.guardarTareaProyecto = guardarTareaProyecto;
  window.editarTareaProyecto = editarTareaProyecto;
  window.guardarProformaProyecto = guardarProformaProyecto;
  window.togglePanelProforma = togglePanelProforma;
  window.cargarSelectClientesProforma = cargarSelectClientesProforma;
  window.cargarSelectServiciosCatalogo = cargarSelectServiciosCatalogo;
  window.agregarServicioCatalogoAProforma = agregarServicioCatalogoAProforma;
  window.agregarFilaProformaVacia = agregarFilaProformaVacia;
  window.agregarFilaProforma = agregarFilaProforma;
  window.actualizarTotalesProforma = actualizarTotalesProforma;
  window.inicializarEditorAlcance = inicializarEditorAlcance;
  window.imprimirCotizacionProyecto = imprimirCotizacionProyecto;
  window.descargarCotizacionPDF = descargarCotizacionPDF;
  window.abrirModalGastoProyecto = abrirModalGastoProyecto;
  window.abrirModalPagoProyecto = abrirModalPagoProyecto;
  window.generarTareasDesdeCotizacion = generarTareasDesdeCotizacion;

})(window, document);
