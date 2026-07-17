// ============================================================
// js/proyectos.js — Módulo de Proyectos (Supabase estable)
// Mantiene lista + detalle, elimina seeds automáticos y setData en tablas migradas
// ============================================================

(function(window, document) {
  'use strict';

  var PROYECTO_ACTUAL = null;

  function el(id) {
    return document.getElementById(id);
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function money(value) {
    var n = parseFloat(value || 0) || 0;
    if (typeof window.formatMoney === 'function') return window.formatMoney(n);
    return 'USD ' + n.toFixed(2);
  }

  function dateFmt(value) {
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
      en_progreso: 'En progreso',
      pausado: 'Pausado',
      completado: 'Completado',
      cancelado: 'Cancelado'
    };
    return map[estado] || estado || 'Pendiente';
  }

  function proyKey(name, fallback) {
    if (window.STORAGE_KEYS && window.STORAGE_KEYS[name]) return window.STORAGE_KEYS[name];
    return fallback;
  }

  async function getAll(tableName, options) {
    if (typeof window.getData !== 'function') return [];
    var data = await window.getData(tableName, options || {});
    return Array.isArray(data) ? data : [];
  }

  async function getFiltered(tableName, filters, options) {
    if (typeof window.getDataFiltered !== 'function') return [];
    var data = await window.getDataFiltered(tableName, filters || {}, options || {});
    return Array.isArray(data) ? data : [];
  }

  async function obtenerProyectos() {
    return await getAll(proyKey('PROYECTOS', 'proyectos'));
  }

  async function obtenerProyectoPorId(id) {
    var proyectos = await obtenerProyectos();
    for (var i = 0; i < proyectos.length; i++) {
      if (proyectos[i].id === id) return proyectos[i];
    }
    return null;
  }

  async function obtenerClientesProyecto() {
    return await getAll(proyKey('CLIENTES', 'clientes'));
  }

  async function obtenerGastosProyecto(proyectoId) {
    if (!proyectoId) return [];
    var rows = await getFiltered(proyKey('GASTOS', 'gastos'), { proyecto_id: proyectoId }, { orderBy: 'created_at', ascending: false });
    return rows.map(function(row) {
      return Object.assign({}, row, {
        proyectoId: row.proyectoId || row.proyecto_id || '',
        creadoEn: row.creadoEn || row.created_at || row.fecha || ''
      });
    });
  }

  async function obtenerPagosProyecto(proyectoId) {
    if (!proyectoId) return [];
    var rows = await getFiltered(proyKey('PAGOS', 'pagos'), { proyecto_id: proyectoId }, { orderBy: 'created_at', ascending: false });
    return rows.map(function(row) {
      return Object.assign({}, row, {
        proyectoId: row.proyectoId || row.proyecto_id || '',
        creadoEn: row.creadoEn || row.created_at || row.fecha || ''
      });
    });
  }

  async function obtenerTareasProyecto(proyectoId) {
    if (!proyectoId) return [];
    var key = window.STORAGE_KEYS && window.STORAGE_KEYS.TAREAS ? window.STORAGE_KEYS.TAREAS : 'tareas';
    var rows = await getFiltered(key, { proyecto_id: proyectoId }, { orderBy: 'created_at', ascending: false });
    return rows.map(function(row) {
      return Object.assign({}, row, {
        proyectoId: row.proyectoId || row.proyecto_id || '',
        titulo: row.titulo || row.nombre || 'Tarea',
        asignado: row.asignado || row.responsable || 'Sin asignar'
      });
    });
  }

  async function actualizarSelectClientesProyecto() {
    var select = el('proy-cliente');
    if (!select) return;

    var clientes = await obtenerClientesProyecto();
    var current = select.value;
    select.innerHTML = '<option value="">Selecciona un cliente</option>';

    clientes.forEach(function(cliente) {
      var opt = document.createElement('option');
      opt.value = cliente.id;
      opt.textContent = cliente.nombre || cliente.nombre_comercial || cliente.empresa || 'Cliente';
      select.appendChild(opt);
    });

    if (current) select.value = current;
  }

  async function guardarProyecto(event) {
    if (event) event.preventDefault();

    var clienteSelect = el('proy-cliente');
    var nombre = el('proy-nombre') ? el('proy-nombre').value.trim() : '';
    var clienteId = clienteSelect ? clienteSelect.value : '';
    var feedback = el('feedback-proyecto');

    if (!nombre || !clienteId) {
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = '❌ Completa al menos nombre y cliente del proyecto';
        feedback.style.display = 'block';
      }
      return false;
    }

    var clienteNombre = '';
    if (clienteSelect && clienteSelect.selectedIndex >= 0) {
      clienteNombre = clienteSelect.options[clienteSelect.selectedIndex].text || '';
    }

    var payload = {
      nombre: nombre,
      cliente_id: clienteId,
      cliente_nombre: clienteNombre,
      presupuesto: parseFloat(el('proy-presupuesto') ? el('proy-presupuesto').value : 0) || 0,
      fecha_inicio: el('proy-fecha') ? el('proy-fecha').value : todayISO(),
      estado: 'en_progreso',
      avance: 0,
      alcance: el('proy-alcance') ? el('proy-alcance').value.trim() : '',
      notas: '',
      created_at: new Date().toISOString()
    };

    if (typeof window.addItem !== 'function') {
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = '❌ No hay conexión de datos disponible';
        feedback.style.display = 'block';
      }
      return false;
    }

    var result = await window.addItem(proyKey('PROYECTOS', 'proyectos'), payload);
    if (!result) {
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = '❌ No se pudo guardar el proyecto';
        feedback.style.display = 'block';
      }
      return false;
    }

    if (feedback) {
      feedback.className = 'form-feedback success';
      feedback.textContent = '✅ Proyecto guardado correctamente';
      feedback.style.display = 'block';
    }

    if (el('formProyecto')) el('formProyecto').reset();
    if (el('proy-fecha')) el('proy-fecha').value = todayISO();

    await renderProyectos();
    if (typeof window.actualizarKPIs === 'function') await window.actualizarKPIs();
    if (typeof window.actualizarSelectProyectosFinanzas === 'function') await window.actualizarSelectProyectosFinanzas();

    return false;
  }

  async function renderProyectos(filtro) {
    var grid = el('proyectos-grid');
    if (!grid) return;

    var proyectos = await obtenerProyectos();
    proyectos = proyectos.map(function(row) {
      return Object.assign({}, row, {
        clienteId: row.clienteId || row.cliente_id || '',
        clienteNombre: row.clienteNombre || row.cliente_nombre || 'Sin cliente',
        fechaInicio: row.fechaInicio || row.fecha_inicio || row.created_at || '',
        creadoEn: row.creadoEn || row.created_at || row.fecha_inicio || '',
        avance: parseInt(row.avance || 0, 10) || 0,
        presupuesto: parseFloat(row.presupuesto || 0) || 0,
        alcance: row.alcance || '',
        notas: row.notas || ''
      });
    });

    if (filtro && filtro !== 'todos') {
      proyectos = proyectos.filter(function(p) {
        return (p.estado || '') === filtro;
      });
    }

    proyectos.sort(function(a, b) {
      return new Date(b.creadoEn || 0) - new Date(a.creadoEn || 0);
    });

    if (!proyectos.length) {
      grid.innerHTML = '<div class="empty-state">No hay proyectos registrados</div>';
      return;
    }

    var html = '';

    for (var i = 0; i < proyectos.length; i++) {
      var p = proyectos[i];
      html += ''
        + '<div class="project-card" style="border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;margin-bottom:14px;">'
        + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">'
        + '<div>'
        + '<div style="font-weight:700;font-size:1.05rem;">' + esc(p.nombre || 'Proyecto') + '</div>'
        + '<div style="opacity:.8;margin-top:4px;">' + esc(p.clienteNombre || 'Sin cliente') + '</div>'
        + '</div>'
        + '<span style="padding:6px 10px;border-radius:999px;background:rgba(107,189,69,0.15);border:1px solid rgba(107,189,69,0.35);font-size:.88rem;">' + esc(estadoLabel(p.estado)) + '</span>'
        + '</div>'
        + '<div style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">'
        + '<div><strong>Presupuesto:</strong><br>' + money(p.presupuesto) + '</div>'
        + '<div><strong>Inicio:</strong><br>' + dateFmt(p.fechaInicio) + '</div>'
        + '<div><strong>Avance:</strong><br>' + (parseInt(p.avance, 10) || 0) + '%</div>'
        + '</div>'
        + '<div style="margin-top:12px;">'
        + '<div style="height:10px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;">'
        + '<div style="height:100%;width:' + Math.min(100, Math.max(0, parseInt(p.avance, 10) || 0)) + '%;background:linear-gradient(90deg,#6bbd45,#4f8cff);"></div>'
        + '</div>'
        + '</div>'
        + '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">'
        + '<button type="button" class="btn-secondary" onclick="verProyecto(\'' + esc(p.id || '') + '\')">Ver detalle</button>'
        + '</div>'
        + '</div>';
    }

    grid.innerHTML = html;
  }

  async function verProyecto(id) {
    var proyecto = await obtenerProyectoPorId(id);
    if (!proyecto) return false;
    PROYECTO_ACTUAL = Object.assign({}, proyecto, {
      clienteId: proyecto.clienteId || proyecto.cliente_id || '',
      clienteNombre: proyecto.clienteNombre || proyecto.cliente_nombre || 'Sin cliente',
      fechaInicio: proyecto.fechaInicio || proyecto.fecha_inicio || proyecto.created_at || '',
      creadoEn: proyecto.creadoEn || proyecto.created_at || proyecto.fecha_inicio || '',
      avance: parseInt(proyecto.avance || 0, 10) || 0,
      presupuesto: parseFloat(proyecto.presupuesto || 0) || 0,
      alcance: proyecto.alcance || '',
      notas: proyecto.notas || ''
    });
    await renderDetalleProyecto(PROYECTO_ACTUAL);
    return false;
  }

  async function renderDetalleProyecto(proyecto) {
    var container = el('proyecto-detalle');
    if (!container) return;

    var tareas = await obtenerTareasProyecto(proyecto.id);
    var pagos = await obtenerPagosProyecto(proyecto.id);
    var gastos = await obtenerGastosProyecto(proyecto.id);

    var totalGastos = gastos.reduce(function(acc, item) { return acc + (parseFloat(item.monto || 0) || 0); }, 0);
    var totalPagos = pagos.reduce(function(acc, item) { return acc + (parseFloat(item.monto || 0) || 0); }, 0);
    var porCobrar = Math.max(0, (parseFloat(proyecto.presupuesto || 0) || 0) - totalPagos);
    var utilidad = totalPagos - totalGastos;

    var tareasHtml = tareas.length
      ? tareas.map(function(t) {
          return ''
            + '<div style="border:1px solid rgba(255,255,255,0.08);padding:10px 12px;border-radius:12px;margin-bottom:8px;">'
            + '<div style="font-weight:600;">' + esc(t.titulo || 'Tarea') + '</div>'
            + '<div style="opacity:.8;margin-top:4px;">' + esc(t.asignado || 'Sin asignar') + ' · ' + esc(t.estado || 'pendiente') + '</div>'
            + '</div>';
        }).join('')
      : '<div class="empty-state">No hay tareas registradas</div>';

    var gastosHtml = gastos.length
      ? gastos.map(function(g) {
          return '<tr><td>' + esc(dateFmt(g.fecha || g.created_at || '')) + '</td><td>' + esc(g.descripcion || 'Gasto') + '</td><td>' + money(g.monto || 0) + '</td></tr>';
        }).join('')
      : '<tr><td colspan="3" class="empty-state">No hay gastos registrados</td></tr>';

    var pagosHtml = pagos.length
      ? pagos.map(function(p) {
          return '<tr><td>' + esc(dateFmt(p.fecha || p.created_at || '')) + '</td><td>' + esc(p.descripcion || p.metodo || 'Pago') + '</td><td>' + money(p.monto || 0) + '</td></tr>';
        }).join('')
      : '<tr><td colspan="3" class="empty-state">No hay pagos registrados</td></tr>';

    container.style.display = 'block';
    container.innerHTML = ''
      + '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:18px;">'
      + '<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;">'
      + '<div>'
      + '<h3 style="margin:0 0 8px;">' + esc(proyecto.nombre || 'Proyecto') + '</h3>'
      + '<div style="opacity:.8;">' + esc(proyecto.clienteNombre || 'Sin cliente') + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button type="button" class="btn-secondary" onclick="volverAListaProyectos()">Volver</button>'
      + '</div>'
      + '</div>'
      + '<div style="margin-top:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;">'
      + '<div><strong>Estado</strong><br>' + esc(estadoLabel(proyecto.estado)) + '</div>'
      + '<div><strong>Fecha de inicio</strong><br>' + dateFmt(proyecto.fechaInicio) + '</div>'
      + '<div><strong>Presupuesto</strong><br>' + money(proyecto.presupuesto) + '</div>'
      + '<div><strong>Avance</strong><br>' + (parseInt(proyecto.avance, 10) || 0) + '%</div>'
      + '</div>'
      + '<div style="margin-top:16px;">'
      + '<strong>Alcance</strong>'
      + '<div style="margin-top:6px;opacity:.9;">' + esc(proyecto.alcance || 'Sin alcance definido') + '</div>'
      + '</div>'
      + '<div style="margin-top:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">'
      + '<div><strong>Gastos</strong><br>' + money(totalGastos) + '</div>'
      + '<div><strong>Pagos</strong><br>' + money(totalPagos) + '</div>'
      + '<div><strong>Por cobrar</strong><br>' + money(porCobrar) + '</div>'
      + '<div><strong>Utilidad</strong><br>' + money(utilidad) + '</div>'
      + '</div>'
      + '<div style="margin-top:20px;">'
      + '<h4 style="margin:0 0 10px;">Notas</h4>'
      + '<textarea id="proyecto-notas" rows="4" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:10px;color:#fff;box-sizing:border-box;">' + esc(proyecto.notas || '') + '</textarea>'
      + '<div style="margin-top:10px;"><button type="button" class="btn-primary" onclick="guardarNotasProyecto()">Guardar notas</button></div>'
      + '</div>'
      + '<div style="margin-top:24px;">'
      + '<h4 style="margin:0 0 10px;">Tareas</h4>'
      + tareasHtml
      + '</div>'
      + '<div style="margin-top:24px;">'
      + '<h4 style="margin:0 0 10px;">Gastos</h4>'
      + '<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Descripción</th><th>Monto</th></tr></thead><tbody>' + gastosHtml + '</tbody></table></div>'
      + '</div>'
      + '<div style="margin-top:24px;">'
      + '<h4 style="margin:0 0 10px;">Pagos</h4>'
      + '<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Descripción</th><th>Monto</th></tr></thead><tbody>' + pagosHtml + '</tbody></table></div>'
      + '</div>'
      + '</div>';
  }

  function volverAListaProyectos() {
    var detalle = el('proyecto-detalle');
    if (detalle) detalle.style.display = 'none';
    PROYECTO_ACTUAL = null;
    return false;
  }

  function switchProyectoTab(tab) {
    return tab || false;
  }

  async function buscarProyectos() {
    var input = el('buscar-proyecto');
    var term = input ? input.value.trim().toLowerCase() : '';
    var grid = el('proyectos-grid');
    if (!grid) return false;

    var proyectos = await obtenerProyectos();
    proyectos = proyectos.map(function(row) {
      return Object.assign({}, row, {
        clienteNombre: row.clienteNombre || row.cliente_nombre || 'Sin cliente',
        alcance: row.alcance || ''
      });
    }).filter(function(p) {
      if (!term) return true;
      return (p.nombre || '').toLowerCase().indexOf(term) !== -1
        || (p.clienteNombre || '').toLowerCase().indexOf(term) !== -1
        || (p.alcance || '').toLowerCase().indexOf(term) !== -1;
    });

    if (!proyectos.length) {
      grid.innerHTML = '<div class="empty-state">No se encontraron proyectos</div>';
      return false;
    }

    var html = '';
    for (var i = 0; i < proyectos.length; i++) {
      var p = proyectos[i];
      html += ''
        + '<div class="project-card" style="border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;margin-bottom:14px;">'
        + '<div style="font-weight:700;font-size:1.05rem;">' + esc(p.nombre || 'Proyecto') + '</div>'
        + '<div style="opacity:.8;margin-top:4px;">' + esc(p.clienteNombre || 'Sin cliente') + '</div>'
        + '<div style="margin-top:14px;"><button type="button" class="btn-secondary" onclick="verProyecto(\'' + esc(p.id || '') + '\')">Ver detalle</button></div>'
        + '</div>';
    }
    grid.innerHTML = html;
    return false;
  }

  async function filtrarProyectos(estado) {
    await renderProyectos(estado || 'todos');
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

  async function guardarNotasProyecto() {
    if (!PROYECTO_ACTUAL || typeof window.updateItem !== 'function') return false;

    var notasEl = el('proyecto-notas');
    var notas = notasEl ? notasEl.value : '';
    var ok = await window.updateItem(proyKey('PROYECTOS', 'proyectos'), PROYECTO_ACTUAL.id, { notas: notas });
    if (!ok) return false;

    PROYECTO_ACTUAL = await obtenerProyectoPorId(PROYECTO_ACTUAL.id);

    var container = el('proyecto-detalle');
    if (container) {
      var existing = container.querySelector('.form-feedback');
      if (existing) existing.remove();
      var feedback = document.createElement('div');
      feedback.className = 'form-feedback success';
      feedback.textContent = '✅ Notas guardadas';
      feedback.style.display = 'block';
      feedback.style.marginTop = '10px';
      container.appendChild(feedback);
      setTimeout(function() {
        if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
      }, 3000);
    }

    return false;
  }

  async function inicializarProyectos() {
    await actualizarSelectClientesProyecto();
    await renderProyectos('todos');
  }

  window.inicializarProyectos = inicializarProyectos;
  window.obtenerProyectos = obtenerProyectos;
  window.actualizarSelectClientesProyecto = actualizarSelectClientesProyecto;
  window.guardarProyecto = guardarProyecto;
  window.renderProyectos = renderProyectos;
  window.verProyecto = verProyecto;
  window.buscarProyectos = buscarProyectos;
  window.filtrarProyectos = filtrarProyectos;
  window.guardarNotasProyecto = guardarNotasProyecto;
  window.volverAListaProyectos = volverAListaProyectos;
  window.switchProyectoTab = switchProyectoTab;
})(window, document);
