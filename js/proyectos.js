// ============================================================
// js/proyectos.js — ProjectOS ajustado al esquema real Supabase
// Integrado con Finanzas para registrar gastos y pagos
// ============================================================

(function(window, document) {
  'use strict';

  var PROYECTO_ACTUAL = null;
  var CLIENTES_CACHE = [];
  var CHART_PROYECTO = null;
  // ============================================================
  // Toggle del panel de proforma
  // ============================================================
  function togglePanelProforma() {
    var panel = byId('proyecto-proforma-panel');
    if (!panel) return;
    var isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Cargar clientes y servicios del catálogo cuando se abre
      cargarSelectClientesProforma();
      cargarSelectServiciosCatalogo();
    }
  }

  // ============================================================
  // Cargar clientes en el select de proforma
  // ============================================================
  async function cargarSelectClientesProforma() {
    var select = byId('pf-cliente');
    if (!select) return;

    var clientes = await obtenerClientes();
    var currentValue = select.value;

    var html = '<option value="">Selecciona un cliente</option>';
    for (var i = 0; i < clientes.length; i++) {
      html += '<option value="' + esc(clientes[i].id) + '">' + esc(clientes[i].nombre) + '</option>';
    }

    select.innerHTML = html;
    if (currentValue) select.value = currentValue;
  }

  // ============================================================
  // Cargar servicios del catálogo en el select de proforma
  // ============================================================
  async function cargarSelectServiciosCatalogo() {
    var select = byId('pf-select-servicio-catalogo');
    if (!select) return;

    var servicios = [];
    if (typeof window.obtenerServicios === 'function') {
      servicios = await window.obtenerServicios();
    }
    servicios = Array.isArray(servicios) ? servicios : [];

    var html = '<option value="">-- Selecciona un servicio del catálogo --</option>';
    for (var i = 0; i < servicios.length; i++) {
      var s = servicios[i];
      var nombre = s.descripcion || s.nombre || s.codigo || 'Servicio';
      var precio = parseFloat(s.precio || 0) || 0;
      var unidad = s.unidad || 'und';
      var itbms = parseInt(s.itbms, 10) === 1 ? 1 : 0;
      html += '<option value="' + esc(s.id || '') + '" ' +
              'data-nombre="' + esc(nombre) + '" ' +
              'data-precio="' + precio + '" ' +
              'data-unidad="' + esc(unidad) + '" ' +
              'data-itbms="' + itbms + '">' +
              esc(nombre) + ' — ' + money(precio) + ' / ' + esc(unidad) +
              '</option>';
    }

    select.innerHTML = html;
  }

  // ============================================================
  // Agregar servicio del catálogo a la proforma
  // ============================================================
  function agregarServicioCatalogoAProforma() {
    var select = byId('pf-select-servicio-catalogo');
    if (!select || !select.value) {
      if (window.showToast) {
        window.showToast({ type: 'warning', title: 'Selecciona un servicio', message: 'Elige un servicio del catálogo para agregarlo a la propuesta.' });
      }
      return;
    }

    var option = select.options[select.selectedIndex];
    var nombre = option.getAttribute('data-nombre') || 'Servicio';
    var precio = parseFloat(option.getAttribute('data-precio') || 0) || 0;
    var unidad = option.getAttribute('data-unidad') || 'und';
    var itbms = parseInt(option.getAttribute('data-itbms') || '0', 10);

    agregarFilaProforma(nombre, unidad, '', '', itbms);
    select.value = '';
  }

  // ============================================================
  // Agregar fila vacía a la proforma (línea manual)
  // ============================================================
  function agregarFilaProformaVacia() {
    agregarFilaProforma('', '', '', '', 0);
  }

  // ============================================================
  // Agregar fila a la proforma con datos
  // ============================================================
  function agregarFilaProforma(nombre, unidad, cantidad, precio, itbms) {
    var tbody = byId('tbodyProformaServicios');
    if (!tbody) return;

    var tr = document.createElement('tr');
    tr.innerHTML = [
      '<td><input type="text" class="pf-input-nombre" value="' + esc(nombre) + '" placeholder="Descripción del servicio" style="width:100%;padding:6px 8px;background:transparent;border:1px solid var(--gn-border);border-radius:6px;color:var(--gn-text);font-size:13px;"></td>',
      '<td><input type="text" class="pf-input-unidad" value="' + esc(unidad) + '" placeholder="und" style="width:80px;padding:6px 8px;background:transparent;border:1px solid var(--gn-border);border-radius:6px;color:var(--gn-text);font-size:13px;text-align:center;"></td>',
      '<td><input type="number" class="pf-input-cantidad" value="' + esc(cantidad) + '" placeholder="0" min="0" step="0.01" style="width:80px;padding:6px 8px;background:transparent;border:1px solid var(--gn-border);border-radius:6px;color:var(--gn-text);font-size:13px;text-align:center;"></td>',
      '<td><input type="number" class="pf-input-precio" value="' + esc(precio) + '" placeholder="0.00" min="0" step="0.01" style="width:100px;padding:6px 8px;background:transparent;border:1px solid var(--gn-border);border-radius:6px;color:var(--gn-text);font-size:13px;text-align:right;"></td>',
      '<td style="text-align:center;"><input type="checkbox" class="pf-check-itbms" ' + (itbms ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:#C5A253;cursor:pointer;"></td>',
      '<td class="pf-total-fila" style="font-weight:600;text-align:right;">0.00</td>',
      '<td style="text-align:center;"><button type="button" onclick="this.closest('tr').remove();actualizarTotalesProforma();" style="background:none;border:none;color:#F87171;cursor:pointer;font-size:16px;"><i class="ph ph-trash"></i></button></td>'
    ].join('');

    // Event listeners para calcular totales
    var inputs = tr.querySelectorAll('input');
    inputs.forEach(function(inp) {
      inp.addEventListener('input', function() { actualizarTotalesProforma(); });
      inp.addEventListener('change', function() { actualizarTotalesProforma(); });
    });

    tbody.appendChild(tr);
    actualizarTotalesProforma();
  }

  // ============================================================
  // Actualizar totales de la proforma
  // ============================================================
  function actualizarTotalesProforma() {
    var tbody = byId('tbodyProformaServicios');
    if (!tbody) return;

    var filas = tbody.querySelectorAll('tr');
    var subtotal = 0;
    var itbmsTotal = 0;

    filas.forEach(function(tr) {
      var cantidad = parseFloat(tr.querySelector('.pf-input-cantidad')?.value || 0) || 0;
      var precio = parseFloat(tr.querySelector('.pf-input-precio')?.value || 0) || 0;
      var aplicaItbms = tr.querySelector('.pf-check-itbms')?.checked || false;
      var totalFila = cantidad * precio;

      var totalCell = tr.querySelector('.pf-total-fila');
      if (totalCell) totalCell.textContent = totalFila.toFixed(2);

      subtotal += totalFila;
      if (aplicaItbms) {
        itbmsTotal += totalFila * 0.07;
      }
    });

    // Verificar ITBMS global
    var itbmsGlobal = byId('pf-aplica-itbms');
    if (itbmsGlobal && itbmsGlobal.checked) {
      // ITBMS global: 7% sobre todo el subtotal
      itbmsTotal = subtotal * 0.07;
    } else {
      // Solo ITBMS por línea
    }

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

  // ============================================================
  // Reemplazar agregarFilaProformaServicio por la nueva versión
  // ============================================================


  function byId(id) {
    return document.getElementById(id);
  }

  function qsa(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function text(value, fallback) {
    if (value === null || value === undefined || value === '') return fallback || '—';
    return String(value);
  }

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function intVal(value) {
    var n = parseInt(value, 10);
    return isNaN(n) ? 0 : n;
  }

  function money(value) {
    var n = num(value);
    if (typeof window.formatMoney === 'function') return window.formatMoney(n);
    return '$' + n.toFixed(2);
  }

  function formatDateSafe(value) {
    if (!value) return '—';
    if (typeof window.formatDate === 'function') return window.formatDate(value);
    return value;
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function estadoLabel(estado) {
    var map = {
      pendiente: 'Pendiente',
      en_progreso: 'En Progreso',
      pausado: 'Pausado',
      completado: 'Completado',
      cancelado: 'Cancelado',
      registrado: 'Registrado',
      confirmado: 'Confirmado',
      reversado: 'Reversado'
    };
    return map[estado] || estado || 'Pendiente';
  }

  function estadoColor(estado) {
    var map = {
      pendiente: '#C5A253',
      en_progreso: '#C5A253',
      pausado: '#6B7280',
      completado: '#2D8B5E',
      cancelado: '#F87171',
      registrado: '#C5A253',
      confirmado: '#2D8B5E',
      reversado: '#F87171'
    };
    return map[estado] || '#2D8B5E';
  }

  function getStorageKey(name, fallback) {
    if (window.STORAGE_KEYS && window.STORAGE_KEYS[name]) return window.STORAGE_KEYS[name];
    return fallback;
  }

  async function getAll(tableName, options) {
    if (typeof window.getData !== 'function') return [];
    var rows = await window.getData(tableName, options || {});
    return Array.isArray(rows) ? rows : [];
  }

  async function getFiltered(tableName, filters, options) {
    if (typeof window.getDataFiltered !== 'function') return [];
    var rows = await window.getDataFiltered(tableName, filters || {}, options || {});
    return Array.isArray(rows) ? rows : [];
  }

  async function insertRow(tableName, payload) {
    if (typeof window.addItem !== 'function') return null;
    return await window.addItem(tableName, payload);
  }

  async function updateRow(tableName, id, payload) {
    if (typeof window.updateItem !== 'function') return false;
    return await window.updateItem(tableName, id, payload);
  }

  function deriveAvance(row) {
    var estado = row.estado || 'pendiente';
    var presupuesto = num(row.presupuesto);
    var cobrado = num(row.total_cobrado);

    if (estado === 'completado') return 100;
    if (estado === 'cancelado') return 0;
    if (presupuesto > 0 && cobrado > 0) {
      return Math.max(0, Math.min(99, Math.round((cobrado / presupuesto) * 100)));
    }
    if (estado === 'en_progreso') return 25;
    if (estado === 'pausado') return 50;
    return 0;
  }

  function normalizeCliente(row) {
    return {
      id: row && row.id ? row.id : '',
      nombre: row && (row.nombre || row.nombre_comercial || row.empresa || row.razon_social)
        ? (row.nombre || row.nombre_comercial || row.empresa || row.razon_social)
        : 'Cliente'
    };
  }

  function normalizeProyecto(row) {
    return {
      id: row.id,
      userId: row.user_id || '',
      cotizacionId: row.cotizacion_id || '',
      clienteId: row.cliente_id || '',
      nombre: row.nombre || 'Proyecto',
      descripcion: row.descripcion || '',
      fechaInicio: row.fecha_inicio || '',
      fechaFin: row.fecha_fin || '',
      fechaFinReal: row.fecha_fin_real || '',
      estado: row.estado || 'en_progreso',
      presupuesto: num(row.presupuesto),
      totalCobrado: num(row.total_cobrado),
      totalGastado: num(row.total_gastado),
      notas: row.notas || '',
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || '',
      avance: deriveAvance(row),
      raw: row
    };
  }

  function normalizeGasto(row) {
    return {
      id: row.id,
      proyectoId: row.proyecto_id || '',
      fecha: row.fecha || row.created_at || '',
      categoria: row.tipo || 'General',
      descripcion: row.descripcion || row.referencia || 'Gasto registrado',
      monto: num(row.monto),
      metodo: row.metodo_pago || row.metodo || '—',
      referencia: row.referencia || '',
      clienteId: row.cliente_id || '',
      cotizacionId: row.cotizacion_id || '',
      createdAt: row.created_at || ''
    };
  }

  function normalizePago(row) {
    return {
      id: row.id,
      proyectoId: row.proyecto_id || '',
      fecha: row.fecha || row.created_at || '',
      concepto: row.concepto || row.descripcion || row.referencia || 'Pago recibido',
      monto: num(row.monto),
      metodo: row.metodo_pago || row.metodo || row.forma_pago || '—',
      estado: row.estado || 'registrado',
      referencia: row.referencia || '',
      clienteId: row.cliente_id || '',
      cotizacionId: row.cotizacion_id || '',
      createdAt: row.created_at || ''
    };
  }

  function normalizeTarea(row) {
    return {
      id: row.id,
      proyectoId: row.proyecto_id || '',
      titulo: row.titulo || row.nombre || 'Tarea',
      asignado: row.asignado || row.responsable || '',
      fechaLimite: row.fecha_limite || '',
      estado: row.estado || 'pendiente',
      descripcion: row.descripcion || '',
      createdAt: row.created_at || ''
    };
  }

  async function obtenerClientes() {
    var rows = await getAll(getStorageKey('CLIENTES', 'clientes'), { orderBy: 'created_at', ascending: false });
    CLIENTES_CACHE = rows.map(normalizeCliente);
    return CLIENTES_CACHE;
  }

  async function ensureClientesCache() {
    if (!CLIENTES_CACHE.length) {
      await obtenerClientes();
    }
    return CLIENTES_CACHE;
  }

  async function getClienteNombre(clienteId) {
    if (!clienteId) return 'Sin cliente';
    await ensureClientesCache();

    for (var i = 0; i < CLIENTES_CACHE.length; i++) {
      if (String(CLIENTES_CACHE[i].id) === String(clienteId)) {
        return CLIENTES_CACHE[i].nombre;
      }
    }

    return 'Sin cliente';
  }

  async function obtenerProyectos() {
    var rows = await getAll(getStorageKey('PROYECTOS', 'proyectos'), { orderBy: 'created_at', ascending: false });
    var proyectos = rows.map(normalizeProyecto);

    for (var i = 0; i < proyectos.length; i++) {
      proyectos[i].clienteNombre = await getClienteNombre(proyectos[i].clienteId);
    }

    return proyectos;
  }

  async function obtenerProyectoPorId(id) {
    if (!id) return null;

    if (typeof window.findItem === 'function') {
      var row = await window.findItem(getStorageKey('PROYECTOS', 'proyectos'), id);
      if (row) {
        var proyecto = normalizeProyecto(row);
        proyecto.clienteNombre = await getClienteNombre(proyecto.clienteId);
        return proyecto;
      }
    }

    var proyectos = await obtenerProyectos();
    for (var i = 0; i < proyectos.length; i++) {
      if (String(proyectos[i].id) === String(id)) return proyectos[i];
    }

    return null;
  }

  async function obtenerFilasProyectoCompat(tableKey, proyectoId) {
    var tableName = getStorageKey(tableKey, tableKey.toLowerCase());

    var rows = await getFiltered(tableName, { proyecto_id: proyectoId }, {
      orderBy: 'created_at',
      ascending: false
    });

    return rows.length ? rows : [];
  }

  async function obtenerGastosProyecto(proyectoId) {
    var rows = await obtenerFilasProyectoCompat('GASTOS', proyectoId);
    return rows.map(normalizeGasto);
  }

  async function obtenerPagosProyecto(proyectoId) {
    var rows = await obtenerFilasProyectoCompat('PAGOS', proyectoId);
    return rows.map(normalizePago);
  }

  async function obtenerTareasProyecto(proyectoId) {
    var rows = await obtenerFilasProyectoCompat('TAREAS', proyectoId);
    return rows.map(normalizeTarea);
  }

  async function actualizarSelectClientesProyecto() {
    var select = byId('proy-cliente');
    if (!select) return;

    var clientes = await obtenerClientes();
    var currentValue = select.value;
    var html = '<option value="">Selecciona un cliente</option>';

    for (var i = 0; i < clientes.length; i++) {
      html += '<option value="' + esc(clientes[i].id) + '">' + esc(clientes[i].nombre) + '</option>';
    }

    select.innerHTML = html;
    if (currentValue) select.value = currentValue;
  }

  async function guardarProyecto(event) {
    if (event) event.preventDefault();

    var form = byId('formProyecto');
    if (!form) return false;

    var nombre = byId('proy-nombre') ? byId('proy-nombre').value.trim() : '';
    var clienteId = byId('proy-cliente') ? byId('proy-cliente').value : '';
    var presupuesto = byId('proy-presupuesto') ? byId('proy-presupuesto').value : 0;
    var fechaInicio = byId('proy-fecha') ? byId('proy-fecha').value : todayISO();
    var descripcion = byId('proy-alcance') ? byId('proy-alcance').value.trim() : '';
    var feedback = byId('feedback-proyecto');

    if (!nombre || !clienteId) {
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = 'Completa nombre y cliente del proyecto';
        feedback.style.display = 'block';
      }
      return false;
    }

    var payload = {
      cliente_id: clienteId,
      nombre: nombre,
      descripcion: descripcion,
      fecha_inicio: fechaInicio || todayISO(),
      estado: 'en_progreso',
      presupuesto: num(presupuesto),
      total_cobrado: 0,
      total_gastado: 0,
      notas: ''
    };

    var result = await insertRow(getStorageKey('PROYECTOS', 'proyectos'), payload);

    if (!result) {
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = 'No se pudo guardar el proyecto';
        feedback.style.display = 'block';
      }
      return false;
    }

    if (feedback) {
      feedback.className = 'form-feedback success';
      feedback.textContent = 'Proyecto creado correctamente';
      feedback.style.display = 'block';
    }

    form.reset();
    if (byId('proy-fecha')) byId('proy-fecha').value = todayISO();

    await renderProyectos('todos');

    if (typeof window.actualizarKPIs === 'function') {
      await window.actualizarKPIs();
    }

    if (typeof window.actualizarSelectProyectosFinanzas === 'function') {
      window.actualizarSelectProyectosFinanzas();
    }

    return false;
  }

  function renderProyectoCard(p) {
    var progreso = Math.max(0, Math.min(100, intVal(p.avance)));
    var color = estadoColor(p.estado);

    return ''
      + '<div class="project-card" style="border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;background:rgba(255,255,255,0.02);">'
      + '  <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;">'
      + '    <div>'
      + '      <h3 style="margin:0 0 6px;">' + esc(p.nombre) + '</h3>'
      + '      <div style="opacity:.8;">' + esc(p.clienteNombre || 'Sin cliente') + '</div>'
      + '    </div>'
      + '    <span class="estado-badge" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '55;">' + esc(estadoLabel(p.estado)) + '</span>'
      + '  </div>'
      + '  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:14px;">'
      + '    <div><small>Presupuesto</small><br><strong>' + money(p.presupuesto) + '</strong></div>'
      + '    <div><small>Cobrado</small><br><strong>' + money(p.totalCobrado) + '</strong></div>'
      + '    <div><small>Gastado</small><br><strong>' + money(p.totalGastado) + '</strong></div>'
      + '  </div>'
      + '  <div style="margin-top:12px;height:10px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;">'
      + '    <div style="width:' + progreso + '%;height:100%;background:linear-gradient(90deg,#2D8B5E,#C5A253);"></div>'
      + '  </div>'
      + '  <div style="margin-top:8px;font-size:.92rem;opacity:.85;">Avance estimado: ' + progreso + '%</div>'
      + '  <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">'
      + '    <button type="button" class="btn-primary" onclick="verProyecto(\'' + esc(p.id) + '\')">Ver Detalle</button>'
      + '  </div>'
      + '</div>';
  }

// ID legible de proyecto basado en fecha: PRO-DDMMAA
    function generarIdProyectoLegible(proyecto) {
      var fecha = proyecto.fechaInicio || proyecto.createdAt || todayISO();
      var d = new Date(fecha);
      if (isNaN(d.getTime())) { d = new Date(); }
      var dia = String(d.getDate()).padStart(2, '0');
      var mes = String(d.getMonth() + 1).padStart(2, '0');
      var ano = String(d.getFullYear()).slice(-2);
      return 'PRO-' + dia + mes + ano;
    }

async function renderProyectos(filtro) {
      var tbody = byId('tbodyProyectos');
      if (!tbody) return false;

      var proyectos = await obtenerProyectos();

      if (filtro && filtro !== 'todos') {
        proyectos = proyectos.filter(function(p) { return p.estado === filtro; });
      }

      if (!proyectos.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay proyectos registrados</td></tr>';
        return false;
      }

      var html = '';
      proyectos.forEach(function(p) {
        var fecha = formatDateSafe(p.fechaInicio || p.createdAt || '');
        var idLegible = generarIdProyectoLegible(p);
        var presupuesto = money(p.presupuesto);
        var cobrado = money(p.totalCobrado);
        var gastado = money(p.totalGastado);
        html += '<tr>';
        html += '<td>' + esc(fecha) + '</td>';
        html += '<td>' + esc(idLegible) + '</td>';
        html += '<td><button type="button" class="link-button" onclick="verProyecto(\'' + esc(p.id) + '\')">' + esc(p.nombre || 'Proyecto') + '</button></td>';
        html += '<td>' + esc(p.clienteNombre || 'Sin cliente') + '</td>';
        html += '<td>' + esc(presupuesto) + '</td>';
        html += '<td>' + esc(cobrado) + '</td>';
        html += '<td>' + esc(gastado) + '</td>';
        html += '</tr>';
      });
      tbody.innerHTML = html;
      return false;
    }

    
async function buscarProyectos() {
      var input = byId('buscar-proyecto');
      var term = input ? input.value.trim().toLowerCase() : '';

      var proyectos = await obtenerProyectos();

      proyectos = proyectos.filter(function(p) {
        if (!term) return true;
        return (p.nombre || '').toLowerCase().indexOf(term) !== -1
          || (p.clienteNombre || '').toLowerCase().indexOf(term) !== -1
          || (p.descripcion || '').toLowerCase().indexOf(term) !== -1;
      });

      var tbody = byId('tbodyProyectos');
      if (!tbody) return false;

      if (!proyectos.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No se encontraron proyectos</td></tr>';
        return false;
      }

      var html = '';
      proyectos.forEach(function(p) {
        var fecha = formatDateSafe(p.fechaInicio || p.createdAt || '');
        var idLegible = generarIdProyectoLegible(p);
        var presupuesto = money(p.presupuesto);
        var cobrado = money(p.totalCobrado);
        var gastado = money(p.totalGastado);
        html += '<tr>';
        html += '<td>' + esc(fecha) + '</td>';
        html += '<td>' + esc(idLegible) + '</td>';
        html += '<td><button type="button" class="link-button" onclick="verProyecto(\'' + esc(p.id) + '\')">' + esc(p.nombre || 'Proyecto') + '</button></td>';
        html += '<td>' + esc(p.clienteNombre || 'Sin cliente') + '</td>';
        html += '<td>' + esc(presupuesto) + '</td>';
        html += '<td>' + esc(cobrado) + '</td>';
        html += '<td>' + esc(gastado) + '</td>';
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
      if (
        onclick.indexOf("'" + (estado || 'todos') + "'") !== -1 ||
        onclick.indexOf('"' + (estado || 'todos') + '"') !== -1
      ) {
        btn.classList.add('active');
      }
    });

    return false;
  }

  function setText(id, value) {
    var el = byId(id);
    if (el) el.textContent = value;
  }

  function setValue(id, value) {
    var el = byId(id);
    if (el) el.value = value;
  }

  function setDisplay(id, show) {
    var el = byId(id);
    if (el) el.style.display = show ? 'block' : 'none';
  }

  function actualizarProgresoVisual(avance) {
    var pct = Math.max(0, Math.min(100, intVal(avance)));
    var txt = byId('proyecto-progreso-pct');
    if (txt) txt.textContent = pct + '%';

    var wrap = byId('proyecto-progreso-visual');
    if (wrap) {
      var circles = wrap.querySelectorAll('circle');
      if (circles.length > 1) {
        var circumference = 283;
        var offset = circumference - (pct / 100) * circumference;
        circles[1].setAttribute('stroke-dashoffset', String(offset));
      }
    }
  }

  function renderTimeline(proyecto, tareas, gastos, pagos) {
    var container = byId('proyecto-timeline');
    if (!container) return;

    var eventos = [];

    if (proyecto.fechaInicio) {
      eventos.push({
        fecha: proyecto.fechaInicio,
        icono: '<i class="ph ph-rocket"></i>',
        titulo: 'Inicio del proyecto',
        descripcion: proyecto.nombre
      });
    }

    if (proyecto.fechaFin) {
      eventos.push({
        fecha: proyecto.fechaFin,
        icono: '<i class="ph ph-calendar"></i>',
        titulo: 'Fecha fin estimada',
        descripcion: 'Fecha objetivo del proyecto'
      });
    }

    if (proyecto.fechaFinReal) {
      eventos.push({
        fecha: proyecto.fechaFinReal,
        icono: '<i class="ph ph-check-circle"></i>',
        titulo: 'Fecha fin real',
        descripcion: 'Cierre real del proyecto'
      });
    }

    tareas.forEach(function(t) {
      eventos.push({
        fecha: t.fechaLimite || t.createdAt || '',
        icono: '<i class="ph ph-puzzle-piece"></i>',
        titulo: t.titulo,
        descripcion: 'Tarea ' + (t.estado || 'pendiente') + (t.asignado ? ' · ' + t.asignado : '')
      });
    });

    gastos.forEach(function(g) {
      eventos.push({
        fecha: g.fecha || g.createdAt || '',
        icono: '<i class="ph ph-currency-dollar"></i>',
        titulo: g.descripcion,
        descripcion: 'Gasto ' + money(g.monto)
      });
    });

    pagos.forEach(function(p) {
      eventos.push({
        fecha: p.fecha || p.createdAt || '',
        icono: '<i class="ph ph-coins"></i>',
        titulo: p.concepto,
        descripcion: 'Pago recibido ' + money(p.monto)
      });
    });

    eventos = eventos.filter(function(e) { return e.fecha; });

    eventos.sort(function(a, b) {
      return new Date(b.fecha) - new Date(a.fecha);
    });

    if (!eventos.length) {
      container.innerHTML = '<div class="empty-state">No hay actividad registrada en la línea de tiempo</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < eventos.length; i++) {
      html += ''
        + '<div class="timeline-item" style="border-left:3px solid rgba(18,53,36,0.4);padding:10px 14px;margin-bottom:12px;background:rgba(255,255,255,0.02);border-radius:10px;">'
        + '  <div style="font-weight:700;">' + esc(eventos[i].icono + ' ' + eventos[i].titulo) + '</div>'
        + '  <div style="opacity:.8;margin-top:4px;">' + esc(formatDateSafe(eventos[i].fecha)) + '</div>'
        + '  <div style="margin-top:6px;">' + esc(eventos[i].descripcion) + '</div>'
        + '</div>';
    }

    container.innerHTML = html;
  }

  function renderTablaGastos(gastos) {
    var tbody = byId('tbodyGastosProyecto');
    if (!tbody) return;

    if (!gastos.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay gastos registrados</td></tr>';
      return;
    }

    var html = '';
    for (var i = 0; i < gastos.length; i++) {
      html += ''
        + '<tr>'
        + '  <td>' + esc(formatDateSafe(gastos[i].fecha)) + '</td>'
        + '  <td>' + esc(gastos[i].categoria) + '</td>'
        + '  <td>' + esc(gastos[i].descripcion) + '</td>'
        + '  <td>' + money(gastos[i].monto) + '</td>'
        + '  <td>' + esc(gastos[i].metodo) + '</td>'
        + '</tr>';
    }

    tbody.innerHTML = html;
  }

  function renderTablaPagos(pagos) {
    var tbody = byId('tbodyPagosProyecto');
    if (!tbody) return;

    if (!pagos.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay pagos registrados</td></tr>';
      return;
    }

    var html = '';
    for (var i = 0; i < pagos.length; i++) {
      html += ''
        + '<tr>'
        + '  <td>' + esc(formatDateSafe(pagos[i].fecha)) + '</td>'
        + '  <td>' + esc(pagos[i].concepto) + '</td>'
        + '  <td>' + money(pagos[i].monto) + '</td>'
        + '  <td>' + esc(pagos[i].metodo) + '</td>'
        + '  <td>' + esc(estadoLabel(pagos[i].estado)) + '</td>'
        + '</tr>';
    }

    tbody.innerHTML = html;
  }

  function renderListaTareas(tareas) {
    var container = byId('lista-tareas-proyecto') || byId('listaTareasProyecto') || byId('tareasProyectoLista');

    if (!container) {
      var form = byId('formTareaProyecto');
      if (form && form.parentNode) {
        var wrap = document.createElement('div');
        wrap.id = 'lista-tareas-proyecto';
        wrap.style.marginTop = '18px';
        form.parentNode.appendChild(wrap);
        container = wrap;
      }
    }

    if (!container) return;

    if (!tareas.length) {
      container.innerHTML = '<div class="empty-state">No hay tareas registradas</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < tareas.length; i++) {
      var color = estadoColor(tareas[i].estado);
      html += ''
        + '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;margin-bottom:10px;background:rgba(255,255,255,0.02);">'
        + '  <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;">'
        + '    <div>'
        + '      <div style="font-weight:700;">' + esc(tareas[i].titulo) + '</div>'
        + '      <div style="opacity:.8;margin-top:4px;">' + esc(tareas[i].descripcion || 'Sin descripción') + '</div>'
        + '    </div>'
        + '    <span class="estado-badge" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '55;">' + esc(estadoLabel(tareas[i].estado)) + '</span>'
        + '  </div>'
        + '  <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;opacity:.9;">'
        + '    <span>👤 ' + esc(tareas[i].asignado || 'Sin asignar') + '</span>'
        + '    <span>📅 ' + esc(formatDateSafe(tareas[i].fechaLimite || '')) + '</span>'
        + '  </div>'
        + '</div>';
    }

    container.innerHTML = html;
  }

  function destroyProyectoChart() {
    if (CHART_PROYECTO && typeof CHART_PROYECTO.destroy === 'function') {
      CHART_PROYECTO.destroy();
      CHART_PROYECTO = null;
    }
  }

  function renderProyectoChart(totalPagos, totalGastos, porCobrar) {
    var canvas = byId('chartProyectoBalance');
    if (!canvas || typeof window.Chart === 'undefined') return;

    destroyProyectoChart();

    var ctx = canvas.getContext('2d');
    CHART_PROYECTO = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pagos', 'Gastos', 'Por Cobrar'],
        datasets: [{
          data: [totalPagos, totalGastos, porCobrar],
          backgroundColor: ['#2D8B5E', '#F87171', '#C5A253'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#F0F0F5' }
          }
        }
      }
    });
  }

  async function renderDetalleProyecto(proyecto) {
    var gastos = await obtenerGastosProyecto(proyecto.id);
    var pagos = await obtenerPagosProyecto(proyecto.id);
    var tareas = await obtenerTareasProyecto(proyecto.id);

    var totalGastosFiltrado = gastos.reduce(function(acc, item) { return acc + item.monto; }, 0);
    var totalPagosFiltrado = pagos.reduce(function(acc, item) { return acc + item.monto; }, 0);

    var totalGastos = totalGastosFiltrado > 0 ? totalGastosFiltrado : num(proyecto.totalGastado);
    var totalPagos = totalPagosFiltrado > 0 ? totalPagosFiltrado : num(proyecto.totalCobrado);
    var presupuesto = num(proyecto.presupuesto);
    var porCobrar = Math.max(0, presupuesto - totalPagos);
    var utilidad = totalPagos - totalGastos;

    setText('detalle-proyecto-nombre', text(proyecto.nombre, 'Proyecto'));
    setText('detalle-proyecto-estado', estadoLabel(proyecto.estado));
    setText('detalle-proyecto-cliente', text(proyecto.clienteNombre, 'Sin cliente'));
    setText('detalle-proyecto-fecha', formatDateSafe(proyecto.fechaInicio));
    setText('detalle-proyecto-presupuesto', money(proyecto.presupuesto));

    setText('resumen-presupuesto', money(presupuesto));
    setText('resumen-gastos', money(totalGastos));
    setText('resumen-pagos', money(totalPagos));
    setText('resumen-por-cobrar', money(porCobrar));
    setText('resumen-utilidad', money(utilidad));

    setValue('proyecto-notas', proyecto.notas || '');
    actualizarProgresoVisual(proyecto.avance);
    renderTimeline(proyecto, tareas, gastos, pagos);
    renderTablaGastos(gastos);
    renderTablaPagos(pagos);
    renderListaTareas(tareas);
    renderProyectoChart(totalPagos, totalGastos, porCobrar);

    setDisplay('proyecto-detalle', true);

    var panel = byId('proyecto-detalle');
    if (panel && panel.scrollIntoView) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    switchProyectoTab('resumen');
  }

  async function verProyecto(id) {
    var proyecto = await obtenerProyectoPorId(id);
    if (!proyecto) return false;

    PROYECTO_ACTUAL = proyecto;
    await renderDetalleProyecto(proyecto);
    return false;
  }

  function volverAListaProyectos() {
    setDisplay('proyecto-detalle', false);
    PROYECTO_ACTUAL = null;
    destroyProyectoChart();
    return false;
  }

  function switchProyectoTab(tabId) {
    ['resumen', 'financiero', 'tareas', 'documentos'].forEach(function(key) {
      var pane = byId('proyecto-tab-' + key);
      if (pane) {
        pane.style.display = key === tabId ? 'block' : 'none';
        pane.classList.toggle('active', key === tabId);
      }
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

    var ok = await updateRow(getStorageKey('PROYECTOS', 'proyectos'), PROYECTO_ACTUAL.id, {
      notas: notas
    });

    if (!ok) {
      alert('No se pudieron guardar las notas del proyecto.');
      return false;
    }

    PROYECTO_ACTUAL.notas = notas;

    var existing = document.querySelector('#proyecto-detalle .form-feedback');
    if (existing) existing.remove();

    var container = byId('proyecto-detalle');
    if (container) {
      var feedback = document.createElement('div');
      feedback.className = 'form-feedback success';
      feedback.textContent = 'Notas guardadas';
      feedback.style.display = 'block';
      feedback.style.marginTop = '12px';
      container.appendChild(feedback);

      setTimeout(function() {
        if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
      }, 3000);
    }

    return false;
  }

  async function guardarTareaProyecto(event) {
    if (event) event.preventDefault();
    if (!PROYECTO_ACTUAL) return false;

    var titulo = byId('tarea-titulo') ? byId('tarea-titulo').value.trim() : '';
    var asignado = byId('tarea-asignado') ? byId('tarea-asignado').value.trim() : '';
    var fechaLimite = byId('tarea-fecha-limite') ? byId('tarea-fecha-limite').value : '';
    var estado = byId('tarea-estado') ? byId('tarea-estado').value : 'pendiente';
    var descripcion = byId('tarea-descripcion') ? byId('tarea-descripcion').value.trim() : '';
    var form = byId('formTareaProyecto');

    if (!titulo) {
      alert('Completa el título de la tarea.');
      return false;
    }

    var payload = {
      proyecto_id: PROYECTO_ACTUAL.id,
      titulo: titulo,
      asignado: asignado,
      fecha_limite: fechaLimite || null,
      estado: estado,
      descripcion: descripcion
    };

    var result = await insertRow(getStorageKey('TAREAS', 'tareas'), payload);

    if (!result) {
      alert('No se pudo guardar la tarea.');
      return false;
    }

    if (form) form.reset();
    await verProyecto(PROYECTO_ACTUAL.id);
    if (typeof window.actualizarKPIs === 'function') {
      await window.actualizarKPIs();
    }
    return false;
  }

  function seleccionarProyectoEnFinanzas(proyecto) {
    if (!proyecto) return;

    var selectGasto = byId('gasto-proyecto');
    if (selectGasto) selectGasto.value = proyecto.id;

    var selectPago = byId('pago-proyecto');
    if (selectPago) selectPago.value = proyecto.id;

    var selectEstadoCuenta = byId('ec-proyecto');
    if (selectEstadoCuenta) selectEstadoCuenta.value = proyecto.id;
  }

  function navegarAFinanzasConProyecto(tipo) {
    if (!PROYECTO_ACTUAL) {
      alert('No hay proyecto activo seleccionado.');
      return false;
    }

    if (typeof window.switchSection === 'function') {
      window.switchSection('finanzas');
    }

    if (typeof window.switchSubSection === 'function') {
      window.switchSubSection('finanzas', 'estado-cuenta');
    }

    if (typeof window.actualizarSelectProyectosFinanzas === 'function') {
      window.actualizarSelectProyectosFinanzas();
    }

    setTimeout(function() {
      seleccionarProyectoEnFinanzas(PROYECTO_ACTUAL);

      if (typeof window.generarEstadoCuenta === 'function') {
        window.generarEstadoCuenta();
      }

      var targetId = tipo === 'gasto' ? 'form-gasto-finanzas' : 'form-pago-finanzas';
      var target = byId(targetId);

      if (target && target.scrollIntoView) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);

    return false;
  }

  function abrirModalGastoProyecto() {
    return navegarAFinanzasConProyecto('gasto');
  }

  function abrirModalPagoProyecto() {
    return navegarAFinanzasConProyecto('pago');
  }

  async function inicializarProyectos() {
    await ensureClientesCache();
    await actualizarSelectClientesProyecto();
    await renderProyectos('todos');

    // Cargar selects de proforma
    await cargarSelectClientesProforma();
    await cargarSelectServiciosCatalogo();

    if (byId('proy-fecha') && !byId('proy-fecha').value) {
      byId('proy-fecha').value = todayISO();
    }

    if (byId('buscar-proyecto')) {
      byId('buscar-proyecto').addEventListener('input', function() {
        buscarProyectos();
      });
    }

    // Listener para checkbox de ITBMS global
    var itbmsGlobal = byId('pf-aplica-itbms');
    if (itbmsGlobal) {
      itbmsGlobal.addEventListener('change', actualizarTotalesProforma);
    }
  }

  window.inicializarProyectos = inicializarProyectos;
  window.actualizarSelectClientesProyecto = actualizarSelectClientesProyecto;
  window.guardarProyecto = guardarProyecto;
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
  window.togglePanelProforma = togglePanelProforma;
  window.cargarSelectClientesProforma = cargarSelectClientesProforma;
  window.cargarSelectServiciosCatalogo = cargarSelectServiciosCatalogo;
  window.agregarServicioCatalogoAProforma = agregarServicioCatalogoAProforma;
  window.agregarFilaProformaVacia = agregarFilaProformaVacia;
  window.agregarFilaProforma = agregarFilaProforma;
  window.actualizarTotalesProforma = actualizarTotalesProforma;

    // ============================================================
  // Guardar proyecto + cotización desde formulario de proforma
  // ============================================================
  async function guardarProformaProyecto(event) {
    if (event) event.preventDefault();

    var form = byId('formProformaProyecto');
    var feedback = byId('feedback-proforma');

    if (!form) return false;

    if (feedback) {
      feedback.className = 'form-feedback';
      feedback.style.display = 'none';
      feedback.textContent = '';
    }

    try {
      var nombreProyecto = byId('pf-nombre-proyecto') ? byId('pf-nombre-proyecto').value.trim() : '';
      var fecha = byId('pf-fecha') ? byId('pf-fecha').value : todayISO();
      var clienteSelect = byId('pf-cliente');
      var alcanceEditor = byId('pf-alcance-editor');
      var alcanceTextarea = byId('pf-alcance');

      if (!nombreProyecto || !clienteSelect || !clienteSelect.value) {
        if (feedback) {
          feedback.className = 'form-feedback error';
          feedback.textContent = 'Completa nombre de proyecto y cliente.';
          feedback.style.display = 'block';
        }
        return false;
      }

      var clienteId = clienteSelect.value;
      var clienteNombre = (clienteSelect.options[clienteSelect.selectedIndex] || {}).text || 'Cliente';

      if (alcanceEditor && alcanceTextarea) {
        alcanceTextarea.value = alcanceEditor.innerHTML;
      }

      var alcanceHtml = alcanceTextarea ? alcanceTextarea.value : '';

      var tbody = byId('tbodyProformaServicios');
      var items = [];
      var subtotal = 0;
      var itbmsTotal = 0;

      if (tbody) {
        Array.prototype.slice.call(tbody.querySelectorAll('tr')).forEach(function(tr) {
          var nombreInput = tr.querySelector('.pf-input-nombre');
          var unidadInput = tr.querySelector('.pf-input-unidad');
          var cantInput = tr.querySelector('.pf-input-cantidad');
          var precioInput = tr.querySelector('.pf-input-precio');
          var itbmsCheck = tr.querySelector('.pf-check-itbms');

          if (!nombreInput) return;

          var descripcion = (nombreInput.value || '').trim();
          var unidad = (unidadInput ? unidadInput.value : 'und').trim() || 'und';
          var cant = parseFloat(cantInput ? cantInput.value : '0') || 0;
          var precio = parseFloat(precioInput ? precioInput.value : '0') || 0;
          var aplicaItbms = itbmsCheck ? itbmsCheck.checked : false;
          var totalFila = cant * precio;

          if (!descripcion) return;

          subtotal += totalFila;
          if (aplicaItbms) {
            itbmsTotal += totalFila * 0.07;
          }

          items.push({
            descripcion: descripcion,
            unidad: unidad,
            cantidad: cant,
            precio: precio,
            total: totalFila,
            itbms: aplicaItbms
          });
        });
      }

      // Verificar ITBMS global
      var itbmsGlobal = byId('pf-aplica-itbms');
      if (itbmsGlobal && itbmsGlobal.checked) {
        itbmsTotal = subtotal * 0.07;
      }

      var totalPropuesta = subtotal + itbmsTotal;

      if (!items.length || subtotal <= 0) {
        if (feedback) {
          feedback.className = 'form-feedback error';
          feedback.textContent = 'Añade al menos un servicio a la propuesta económica.';
          feedback.style.display = 'block';
        }
        return false;
      }

      if (typeof window.crearCotizacionDesdeProforma !== 'function') {
        alert('No está disponible la función para crear cotizaciones desde la proforma.');
        return false;
      }

      var cotizacion = await window.crearCotizacionDesdeProforma({
        clienteId: clienteId,
        clienteNombre: clienteNombre,
        fecha: fecha,
        nombreProyecto: nombreProyecto,
        alcanceHtml: alcanceHtml,
        items: items,
        total: totalPropuesta
      });

      var payloadProyecto = {
        cliente_id: clienteId,
        cotizacion_id: cotizacion.codigo || '',
        nombre: nombreProyecto,
        descripcion: alcanceHtml,
        fecha_inicio: fecha || todayISO(),
        estado: 'en_progreso',
        presupuesto: totalPropuesta,
        subtotal: subtotal,
        itbms: itbmsTotal,
        total_cobrado: 0,
        total_gastado: 0,
        notas: ''
      };

      var result = await insertRow(getStorageKey('PROYECTOS', 'proyectos'), payloadProyecto);

      if (!result) {
        if (feedback) {
          feedback.className = 'form-feedback error';
          feedback.textContent = 'No se pudo guardar el proyecto.';
          feedback.style.display = 'block';
        }
        return false;
      }

      if (feedback) {
        feedback.className = 'form-feedback success';
        feedback.textContent = 'Proyecto y cotización creados correctamente.';
        feedback.style.display = 'block';
      }

      form.reset();
      if (byId('pf-fecha')) byId('pf-fecha').value = todayISO();
      if (alcanceEditor) alcanceEditor.innerHTML = '';

      await renderProyectos('todos');

      if (typeof window.actualizarKPIs === 'function') window.actualizarKPIs();
      if (typeof window.actualizarSelectProyectosFinanzas === 'function') window.actualizarSelectProyectosFinanzas();

      return false;
    } catch (error) {
      console.error('Error guardando proforma de proyecto', error);
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = 'Ocurrió un error al guardar la proforma.';
        feedback.style.display = 'block';
      }
      return false;
    }
  }

  window.guardarProformaProyecto = guardarProformaProyecto;
  window.abrirModalGastoProyecto = abrirModalGastoProyecto;

    // Función legacy — ahora usa agregarFilaProformaVacia
  function agregarFilaProformaServicio() {
    agregarFilaProformaVacia();
  }

  window.agregarFilaProformaServicio = agregarFilaProformaServicio;
  window.abrirModalPagoProyecto = abrirModalPagoProyecto;

    // ============================================================
  // Conectar botones del editor de alcance con comandos de formato
  // ============================================================
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

      if (cmd === 'bold') {
        document.execCommand('bold', false, null);
      } else if (cmd === 'italic') {
        document.execCommand('italic', false, null);
      } else if (cmd === 'unorderedList') {
        document.execCommand('insertUnorderedList', false, null);
      } else if (cmd === 'orderedList') {
        document.execCommand('insertOrderedList', false, null);
      }
    });
  }

  window.inicializarEditorAlcance = inicializarEditorAlcance;

  // Inicializar editor al cargar el documento
  document.addEventListener('DOMContentLoaded', function() {
    inicializarEditorAlcance();
    // Inicializar fecha con valor de hoy
    var pfFecha = byId('pf-fecha');
    if (pfFecha && !pfFecha.value) {
      pfFecha.value = (new Date()).toISOString().slice(0, 10);
    }
  });

})(window, document);
