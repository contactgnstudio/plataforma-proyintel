// ============================================================
// js/grupos.js — Gestión de Grupos de Servicios
// Versión compatible con storage.js actual
// ============================================================

(function(window, document) {
  'use strict';

  var GNUtils = window.GNUtils || {};
  var byId = GNUtils.byId || function(id) { return document.getElementById(id); };
  var escapeHtml = GNUtils.escapeHtml || function(value) { return String(value || ''); };
  var generateId = GNUtils.generateId || function(prefix) {
    return (prefix || 'grp') + '-' + Date.now();
  };
  var showFeedback = GNUtils.showFeedback || function(target, message, type) {
    var el = typeof target === 'string' ? byId(target) : target;
    if (!el) return;
    el.className = 'form-feedback ' + (type || 'error');
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
  };

  var GRUPOS_KEY = 'gn_grupos_servicios';
  var GRUPO_SERVICIOS_KEY = 'gn_grupo_servicio_map';

  var COLORES_GRUPO = {
    green:  { bg: 'rgba(107,189,69,0.15)',  border: '#6bbd45', label: 'Verde',     icon: '🟢' },
    blue:   { bg: 'rgba(79,140,255,0.15)',  border: '#4f8cff', label: 'Azul',      icon: '🔵' },
    purple: { bg: 'rgba(168,85,247,0.15)',  border: '#a855f7', label: 'Púrpura',   icon: '🟣' },
    orange: { bg: 'rgba(245,158,11,0.15)',  border: '#f59e0b', label: 'Naranja',   icon: '🟠' },
    red:    { bg: 'rgba(239,68,68,0.15)',   border: '#ef4444', label: 'Rojo',      icon: '🔴' },
    teal:   { bg: 'rgba(20,184,166,0.15)',  border: '#14b8a6', label: 'Turquesa',  icon: '🩵' },
    pink:   { bg: 'rgba(236,72,153,0.15)',  border: '#ec4899', label: 'Rosa',      icon: '🩷' },
    gray:   { bg: 'rgba(100,116,139,0.15)', border: '#64748b', label: 'Gris',      icon: '⚪' }
  };

  function gruposBase() {
    return [
      { id: 'grp-desarrollo',  codigo: 'DESARROLLO',  nombre: 'Desarrollo Web',    descripcion: 'Programación, APIs, CMS y deploy', color: 'green',  orden: 1, creadoEn: new Date().toISOString() },
      { id: 'grp-diseno',      codigo: 'DISENO',      nombre: 'Diseño Web',        descripcion: 'UI/UX, landing pages y responsive', color: 'blue',   orden: 2, creadoEn: new Date().toISOString() },
      { id: 'grp-branding',    codigo: 'BRANDING',    nombre: 'Branding',          descripcion: 'Logotipos, manuales y papelería', color: 'purple', orden: 3, creadoEn: new Date().toISOString() },
      { id: 'grp-marketing',   codigo: 'MARKETING',   nombre: 'Marketing Digital', descripcion: 'Ads, SEO y automatización', color: 'orange', orden: 4, creadoEn: new Date().toISOString() },
      { id: 'grp-social',      codigo: 'SOCIAL',      nombre: 'Social Media',      descripcion: 'Gestión de redes y contenido', color: 'pink', order: 5, creadoEn: new Date().toISOString() },
      { id: 'grp-consultoria', codigo: 'CONSULTORIA', nombre: 'Consultoría',       descripcion: 'Estrategia, auditorías y asesoría', color: 'teal', orden: 6, creadoEn: new Date().toISOString() },
      { id: 'grp-soporte',     codigo: 'SOPORTE',     nombre: 'Soporte & Hosting', descripcion: 'Mantenimiento, hosting y dominios', color: 'gray', orden: 7, creadoEn: new Date().toISOString() }
    ].map(function(item) {
      if (typeof item.order !== 'undefined' && typeof item.orden === 'undefined') {
        item.orden = item.order;
        delete item.order;
      }
      return item;
    });
  }

  async function inicializarGrupos() {
    var grupos = await obtenerGruposRaw();
    if (!grupos.length) {
      window.setData(GRUPOS_KEY, gruposBase());
    }

    var map = await obtenerMapaGruposRaw();
    if (!map || typeof map !== 'object' || Array.isArray(map)) {
      window.setData(GRUPO_SERVICIOS_KEY, {});
    }

    renderGrupos();
    renderGruposVisuales();
    actualizarSelectGrupos();
    renderServiciosPorGrupo();
    renderServiciosSinGrupo();
  }

  async function obtenerGruposRaw() {
    if (typeof window.getData !== 'function') return [];
    var grupos = await window.getData(GRUPOS_KEY);
    return Array.isArray(grupos) ? grupos : [];
  }

  async function obtenerMapaGruposRaw() {
    if (typeof window.getData !== 'function') return {};
    var map = await window.getData(GRUPO_SERVICIOS_KEY);
    return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  }

  function obtenerGrupos() {
    var raw = localStorage.getItem(GRUPOS_KEY);
    if (!raw) return [];
    try {
      var grupos = JSON.parse(raw);
      grupos = Array.isArray(grupos) ? grupos : [];
      grupos.sort(function(a, b) {
        return (parseInt(a.orden, 10) || 99) - (parseInt(b.orden, 10) || 99);
      });
      return grupos;
    } catch (error) {
      return [];
    }
  }

  function obtenerMapaGrupos() {
    var raw = localStorage.getItem(GRUPO_SERVICIOS_KEY);
    if (!raw) return {};
    try {
      var map = JSON.parse(raw);
      return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
    } catch (error) {
      return {};
    }
  }

  function guardarMapaGrupos(map) {
    window.setData(GRUPO_SERVICIOS_KEY, map || {});
  }

  function obtenerGrupoDeServicio(servicioId) {
    var map = obtenerMapaGrupos();
    var grupoId = map[servicioId];
    if (!grupoId) return null;

    var grupos = obtenerGrupos();
    for (var i = 0; i < grupos.length; i++) {
      if (grupos[i].id === grupoId) return grupos[i];
    }

    return null;
  }

  function cerrarModalGrupo() {
    var modal = byId('gn-modal-grupo');
    if (modal) modal.remove();
  }

  function abrirModalGrupo() {
    var existing = byId('gn-modal-grupo');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'gn-modal-grupo';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';

    modal.innerHTML = `
      <div style="background:#1a1a2e;border-radius:12px;padding:32px;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;border:1px solid #2a2a4a;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <h3 style="margin:0;color:#fff;font-size:18px;">Nuevo Grupo</h3>
          <button type="button" onclick="cerrarModalGrupo()" style="background:none;border:none;color:#aaa;font-size:24px;cursor:pointer;">&#x2715;</button>
        </div>

        <form id="formGrupo" onsubmit="return guardarGrupo(event)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
              <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">CÓDIGO *</label>
              <input id="grp-codigo" type="text" placeholder="Ej: DESARROLLO" maxlength="30" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;" />
            </div>

            <div>
              <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">ORDEN</label>
              <input id="grp-orden" type="number" min="1" step="1" value="99" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;" />
            </div>

            <div style="grid-column:1/-1;">
              <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">NOMBRE *</label>
              <input id="grp-nombre" type="text" placeholder="Nombre del grupo" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;" />
            </div>

            <div style="grid-column:1/-1;">
              <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">DESCRIPCIÓN</label>
              <textarea id="grp-descripcion" rows="3" placeholder="Descripción breve del grupo" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;resize:vertical;"></textarea>
            </div>

            <div style="grid-column:1/-1;">
              <label style="color:#aaa;font-size:12px;display:block;margin-bottom:10px;">COLOR</label>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                ${Object.keys(COLORES_GRUPO).map(function(key, index) {
                  var c = COLORES_GRUPO[key];
                  return `
                    <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid #333;border-radius:8px;background:#0f0f23;cursor:pointer;">
                      <input type="radio" name="grp-color" value="${key}" ${index === 0 ? 'checked' : ''} />
                      <span>${c.icon}</span>
                      <span style="color:#fff;font-size:13px;">${c.label}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <div id="feedback-grupo" class="form-feedback" style="display:none;margin-top:16px;"></div>

          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;">
            <button type="button" onclick="cerrarModalGrupo()" style="padding:10px 20px;background:#333;border:none;border-radius:8px;color:#fff;cursor:pointer;">Cancelar</button>
            <button type="submit" style="padding:10px 20px;background:#2563eb;border:none;border-radius:8px;color:#fff;cursor:pointer;">Guardar Grupo</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
      if (e.target === modal) cerrarModalGrupo();
    });
  }

  function guardarGrupo(event) {
    if (event) event.preventDefault();

    var feedback = byId('feedback-grupo');
    var codigo = ((byId('grp-codigo') || {}).value || '').trim().toUpperCase();
    var nombre = ((byId('grp-nombre') || {}).value || '').trim();
    var descripcion = ((byId('grp-descripcion') || {}).value || '').trim();
    var orden = parseInt(((byId('grp-orden') || {}).value || '99'), 10) || 99;
    var colorNode = document.querySelector('input[name="grp-color"]:checked');
    var color = colorNode ? colorNode.value : 'green';

    if (!codigo || !nombre) {
      showFeedback(feedback, '❌ Completa código y nombre', 'error');
      return false;
    }

    var grupos = obtenerGrupos();
    for (var i = 0; i < grupos.length; i++) {
      if ((grupos[i].codigo || '').toUpperCase() === codigo) {
        showFeedback(feedback, '❌ Ya existe un grupo con ese código', 'error');
        return false;
      }
    }

    grupos.push({
      id: generateId('grp'),
      codigo: codigo,
      nombre: nombre,
      descripcion: descripcion,
      color: color,
      orden: orden,
      creadoEn: new Date().toISOString()
    });

    grupos.sort(function(a, b) {
      return (parseInt(a.orden, 10) || 99) - (parseInt(b.orden, 10) || 99);
    });

    window.setData(GRUPOS_KEY, grupos);

    showFeedback(feedback, '✅ Grupo guardado correctamente', 'success');

    setTimeout(function() {
      cerrarModalGrupo();
      renderGrupos();
      renderGruposVisuales();
      actualizarSelectGrupos();
      renderServiciosPorGrupo();
      renderServiciosSinGrupo();
    }, 300);

    return false;
  }

  function eliminarGrupo(id) {
    if (!window.confirm('¿Eliminar este grupo?')) return;

    var grupos = obtenerGrupos().filter(function(grupo) {
      return grupo.id !== id;
    });

    var map = obtenerMapaGrupos();
    Object.keys(map).forEach(function(servicioId) {
      if (map[servicioId] === id) {
        delete map[servicioId];
      }
    });

    window.setData(GRUPOS_KEY, grupos);
    window.setData(GRUPO_SERVICIOS_KEY, map);

    renderGrupos();
    renderGruposVisuales();
    actualizarSelectGrupos();
    renderServiciosPorGrupo();
    renderServiciosSinGrupo();
  }

  function actualizarSelectGrupos() {
    var selects = [
      byId('serv-grupo'),
      byId('serv-categoria'),
      byId('filtro-grupo-servicio'),
      byId('filtro-servicio-grupo')
    ].filter(Boolean);

    var grupos = obtenerGrupos();

    selects.forEach(function(select) {
      var current = select.value;
      var esFiltro = (select.id || '').indexOf('filtro') !== -1;

      select.innerHTML = esFiltro
        ? '<option value="todos">Todos</option>'
        : '<option value="">Sin grupo</option>';

      grupos.forEach(function(grupo) {
        var opt = document.createElement('option');
        opt.value = grupo.id;
        opt.textContent = grupo.nombre;
        select.appendChild(opt);
      });

      if (current) select.value = current;
    });
  }

  function renderGrupos() {
    var tbody = byId('tbodyGrupos');
    if (!tbody) return;

    var grupos = obtenerGrupos();

    if (!grupos.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay grupos registrados</td></tr>';
      return;
    }

    tbody.innerHTML = grupos.map(function(grupo) {
      var color = COLORES_GRUPO[grupo.color] || COLORES_GRUPO.gray;
      return ''
        + '<tr>'
        + '<td>' + escapeHtml(grupo.codigo || '-') + '</td>'
        + '<td>' + escapeHtml(grupo.nombre || '-') + '</td>'
        + '<td>' + escapeHtml(grupo.descripcion || '-') + '</td>'
        + '<td><span style="display:inline-flex;align-items:center;gap:6px;"><span>' + color.icon + '</span>' + escapeHtml(color.label) + '</span></td>'
        + '<td>' + escapeHtml(String(grupo.orden || 99)) + '</td>'
        + '<td><button type="button" class="btn-table danger" onclick="eliminarGrupo(\'' + escapeHtml(grupo.id) + '\')">Eliminar</button></td>'
        + '</tr>';
    }).join('');
  }

  function renderGruposVisuales() {
    var container = byId('gruposVisuales');
    if (!container) return;

    var grupos = obtenerGrupos();
    if (!grupos.length) {
      container.innerHTML = '<div class="empty-state">No hay grupos disponibles</div>';
      return;
    }

    container.innerHTML = grupos.map(function(grupo) {
      var color = COLORES_GRUPO[grupo.color] || COLORES_GRUPO.gray;
      return ''
        + '<div style="background:' + color.bg + ';border:1px solid ' + color.border + ';border-radius:12px;padding:16px;">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
        + '<span>' + color.icon + '</span>'
        + '<strong style="color:#fff;">' + escapeHtml(grupo.nombre || '-') + '</strong>'
        + '</div>'
        + '<div style="color:#aaa;font-size:13px;">' + escapeHtml(grupo.descripcion || 'Sin descripción') + '</div>'
        + '</div>';
    }).join('');
  }

  function renderServiciosPorGrupo() {
    var container = byId('serviciosPorGrupo');
    if (!container) return;

    var grupos = obtenerGrupos();
    var map = obtenerMapaGrupos();
    var servicios = [];

    try {
      var raw = localStorage.getItem('servicios');
      servicios = raw ? JSON.parse(raw) : [];
      servicios = Array.isArray(servicios) ? servicios : [];
    } catch (error) {
      servicios = [];
    }

    if (!grupos.length) {
      container.innerHTML = '<div class="empty-state">No hay grupos registrados</div>';
      return;
    }

    container.innerHTML = grupos.map(function(grupo) {
      var items = servicios.filter(function(servicio) {
        return map[servicio.id] === grupo.id;
      });

      return ''
        + '<div style="margin-bottom:20px;">'
        + '<h4 style="color:#fff;margin-bottom:10px;">' + escapeHtml(grupo.nombre) + ' (' + items.length + ')</h4>'
        + (items.length
          ? '<div style="display:grid;gap:8px;">' + items.map(function(servicio) {
              return '<div style="padding:10px;border:1px solid #333;border-radius:8px;background:#0f0f23;color:#fff;">'
                + escapeHtml(servicio.descripcion || servicio.nombre || servicio.codigo || 'Servicio')
                + '</div>';
            }).join('') + '</div>'
          : '<div class="empty-state">Sin servicios asignados</div>')
        + '</div>';
    }).join('');
  }

  function renderServiciosSinGrupo() {
    var container = byId('serviciosSinGrupo');
    if (!container) return;

    var map = obtenerMapaGrupos();
    var servicios = [];

    try {
      var raw = localStorage.getItem('servicios');
      servicios = raw ? JSON.parse(raw) : [];
      servicios = Array.isArray(servicios) ? servicios : [];
    } catch (error) {
      servicios = [];
    }

    var sinGrupo = servicios.filter(function(servicio) {
      return !map[servicio.id];
    });

    if (!sinGrupo.length) {
      container.innerHTML = '<div class="empty-state">Todos los servicios tienen grupo asignado</div>';
      return;
    }

    container.innerHTML = sinGrupo.map(function(servicio) {
      return '<div style="padding:10px;border:1px solid #333;border-radius:8px;background:#0f0f23;color:#fff;margin-bottom:8px;">'
        + escapeHtml(servicio.descripcion || servicio.nombre || servicio.codigo || 'Servicio')
        + '</div>';
    }).join('');
  }

  window.inicializarGrupos = inicializarGrupos;
  window.obtenerGrupos = obtenerGrupos;
  window.obtenerMapaGrupos = obtenerMapaGrupos;
  window.guardarMapaGrupos = guardarMapaGrupos;
  window.obtenerGrupoDeServicio = obtenerGrupoDeServicio;
  window.abrirModalGrupo = abrirModalGrupo;
  window.cerrarModalGrupo = cerrarModalGrupo;
  window.guardarGrupo = guardarGrupo;
  window.eliminarGrupo = eliminarGrupo;
  window.actualizarSelectGrupos = actualizarSelectGrupos;
  window.renderGrupos = renderGrupos;
  window.renderGruposVisuales = renderGruposVisuales;
  window.renderServiciosPorGrupo = renderServiciosPorGrupo;
  window.renderServiciosSinGrupo = renderServiciosSinGrupo;
})(window, document);
