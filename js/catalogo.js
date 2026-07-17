// ============================================================
// js/catalogo.js — Catálogo de Servicios + Supabase
// Versión estable sobre storage.js
// ============================================================

(function(window, document) {
  'use strict';

  var GNUtils = window.GNUtils || {};
  var byId = GNUtils.byId || function(id) { return document.getElementById(id); };
  var escapeHtml = GNUtils.escapeHtml || function(value) { return String(value || ''); };
  var formatMoney = GNUtils.formatMoney || function(value) {
    var num = parseFloat(value || 0) || 0;
    return 'USD ' + num.toFixed(2);
  };
  var showFeedback = GNUtils.showFeedback || function(target, message, type) {
    var el = typeof target === 'string' ? byId(target) : target;
    if (!el) return;
    el.className = 'form-feedback ' + (type || 'error');
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
  };
  var log = GNUtils.log || function(level, message, meta) {
    if (meta !== undefined) {
      console[level] ? console[level](message, meta) : console.log(message, meta);
      return;
    }
    console[level] ? console[level](message) : console.log(message);
  };

  var serviciosEjemplo = [
    { codigo: 'WEB-001', categoria: 'diseno_web', nombre: 'Landing page de alto impacto', descripcion: 'Landing page de alto impacto', unidad: 'und', precio: 450.00, itbms: 1 },
    { codigo: 'WEB-002', categoria: 'diseno_web', nombre: 'Sitio web corporativo hasta 5 páginas', descripcion: 'Sitio web corporativo hasta 5 páginas', unidad: 'proyecto', precio: 1800.00, itbms: 1 },
    { codigo: 'DEV-001', categoria: 'desarrollo_web', nombre: 'Desarrollo frontend HTML/CSS/JS', descripcion: 'Desarrollo frontend HTML/CSS/JS', unidad: 'hr', precio: 45.00, itbms: 1 },
    { codigo: 'DEV-002', categoria: 'desarrollo_web', nombre: 'Desarrollo backend', descripcion: 'Desarrollo backend', unidad: 'hr', precio: 55.00, itbms: 1 },
    { codigo: 'BRD-001', categoria: 'branding', nombre: 'Diseño de logotipo', descripcion: 'Diseño de logotipo', unidad: 'proyecto', precio: 650.00, itbms: 1 },
    { codigo: 'BRD-002', categoria: 'branding', nombre: 'Manual de marca', descripcion: 'Manual de marca', unidad: 'proyecto', precio: 1200.00, itbms: 1 },
    { codigo: 'MKT-001', categoria: 'marketing', nombre: 'Estrategia de marketing digital mensual', descripcion: 'Estrategia de marketing digital mensual', unidad: 'mes', precio: 800.00, itbms: 1 },
    { codigo: 'SEO-001', categoria: 'seo', nombre: 'Auditoría SEO completa', descripcion: 'Auditoría SEO completa', unidad: 'proyecto', precio: 500.00, itbms: 1 },
    { codigo: 'SM-001', categoria: 'social_media', nombre: 'Gestión mensual de redes sociales', descripcion: 'Gestión mensual de redes sociales', unidad: 'mes', precio: 600.00, itbms: 1 },
    { codigo: 'HOS-001', categoria: 'hosting', nombre: 'Hosting compartido anual', descripcion: 'Hosting compartido anual', unidad: 'und', precio: 120.00, itbms: 1 }
  ];

  function getStorageKey() {
    return window.STORAGE_KEYS && window.STORAGE_KEYS.SERVICIOS
      ? window.STORAGE_KEYS.SERVICIOS
      : 'servicios';
  }

  function obtenerGrupoIdFormularioServicio() {
    var select = byId('serv-grupo') || byId('serv-categoria');
    return select ? select.value : '';
  }

  function obtenerNombreGrupoPorId(grupoId) {
    if (!grupoId || typeof window.obtenerGrupos !== 'function') return '';
    var grupos = window.obtenerGrupos() || [];

    for (var i = 0; i < grupos.length; i++) {
      if (grupos[i].id === grupoId) return grupos[i].nombre || '';
    }

    return '';
  }

  function obtenerMapaGruposSeguro() {
    return typeof window.obtenerMapaGrupos === 'function'
      ? (window.obtenerMapaGrupos() || {})
      : {};
  }

  function sincronizarGrupoServicio(servicioId, grupoId) {
    if (typeof window.guardarMapaGrupos !== 'function') return;

    var map = obtenerMapaGruposSeguro();

    if (grupoId) {
      map[servicioId] = grupoId;
    } else {
      delete map[servicioId];
    }

    window.guardarMapaGrupos(map);
  }

  function normalizarCategoriaDesdeGrupo(grupoNombre) {
    return String(grupoNombre || 'general')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_');
  }

  function nombreServicio(servicio) {
    return (servicio && (servicio.descripcion || servicio.nombre || servicio.codigo)) || 'Servicio';
  }

  async function obtenerServicios() {
    if (typeof window.getData !== 'function') return [];

    var servicios = await window.getData(getStorageKey(), {
      orderBy: 'codigo',
      ascending: true
    });

    return Array.isArray(servicios) ? servicios : [];
  }

  async function sembrarServiciosSiVacio() {
    if (typeof window.getData !== 'function' || typeof window.addItem !== 'function') return false;

    var servicios = await obtenerServicios();
    if (servicios.length > 0) return true;

    for (var i = 0; i < serviciosEjemplo.length; i++) {
      var item = serviciosEjemplo[i];
      var payload = {
        codigo: item.codigo,
        categoria: item.categoria,
        nombre: item.nombre || item.descripcion || 'Servicio',
        descripcion: item.descripcion || item.nombre || 'Servicio',
        unidad: item.unidad || 'und',
        precio: parseFloat(item.precio || 0) || 0,
        itbms: parseInt(item.itbms, 10) === 1 ? 1 : 0
      };

      var inserted = await window.addItem(getStorageKey(), payload);
      if (!inserted) {
        log('warn', 'No se pudo insertar un servicio de ejemplo', payload);
      }
    }

    return true;
  }

  async function inicializarCatalogo() {
    await sembrarServiciosSiVacio();
    await renderServicios();
    await actualizarVistaJSON();
  }

  async function guardarServicio(event) {
    if (event) event.preventDefault();

    var feedback = byId('feedback-servicio');
    var codigo = ((byId('serv-codigo') || {}).value || '').trim().toUpperCase();
    var descripcion = ((byId('serv-descripcion') || {}).value || '').trim();
    var unidad = ((byId('serv-unidad') || {}).value || 'und').trim() || 'und';
    var precio = parseFloat(((byId('serv-precio') || {}).value || '0'));
    var itbms = parseInt(((byId('serv-itbms') || {}).value || '1'), 10);
    var grupoId = obtenerGrupoIdFormularioServicio();
    var grupoNombre = obtenerNombreGrupoPorId(grupoId);

    if (!codigo || !descripcion || !precio || precio <= 0) {
      showFeedback(feedback, '❌ Completa código, descripción y precio válido', 'error');
      return false;
    }

    var servicios = await obtenerServicios();
    for (var i = 0; i < servicios.length; i++) {
      if (String(servicios[i].codigo || '').toUpperCase() === codigo) {
        showFeedback(feedback, '❌ El código "' + codigo + '" ya existe', 'error');
        return false;
      }
    }

    if (typeof window.addItem !== 'function') {
      showFeedback(feedback, '❌ No hay conexión de datos disponible', 'error');
      return false;
    }

    var payload = {
      codigo: codigo,
      categoria: normalizarCategoriaDesdeGrupo(grupoNombre),
      nombre: descripcion,
      descripcion: descripcion,
      unidad: unidad,
      precio: precio,
      itbms: itbms === 1 ? 1 : 0
    };

    var created = await window.addItem(getStorageKey(), payload);
    if (!created) {
      showFeedback(feedback, '❌ No se pudo guardar el servicio', 'error');
      return false;
    }

    sincronizarGrupoServicio(created.id, grupoId);
    showFeedback(feedback, '✅ Servicio "' + codigo + '" guardado correctamente', 'success');

    var form = byId('formServicio');
    if (form) form.reset();

    await renderServicios();
    await actualizarVistaJSON();

    if (typeof window.actualizarSelectServicios === 'function') {
      await window.actualizarSelectServicios();
    }

    if (typeof window.renderServiciosPorGrupo === 'function') {
      window.renderServiciosPorGrupo();
    }

    if (typeof window.renderServiciosSinGrupo === 'function') {
      window.renderServiciosSinGrupo();
    }

    return false;
  }

  async function eliminarServicio(id) {
    if (!id) return;
    if (!window.confirm('¿Eliminar este servicio?')) return;
    if (typeof window.deleteItem !== 'function') return;

    var ok = await window.deleteItem(getStorageKey(), id);
    if (!ok) {
      window.alert('No se pudo eliminar el servicio.');
      return;
    }

    sincronizarGrupoServicio(id, '');
    await renderServicios();
    await actualizarVistaJSON();

    if (typeof window.actualizarSelectServicios === 'function') {
      await window.actualizarSelectServicios();
    }

    if (typeof window.renderServiciosPorGrupo === 'function') {
      window.renderServiciosPorGrupo();
    }

    if (typeof window.renderServiciosSinGrupo === 'function') {
      window.renderServiciosSinGrupo();
    }
  }

  async function renderServicios(filtroTexto, filtroGrupo) {
    var servicios = await obtenerServicios();
    var tbody = byId('tbodyServicios');
    if (!tbody) return;

    if (filtroTexto) {
      var term = String(filtroTexto).toLowerCase();
      servicios = servicios.filter(function(servicio) {
        var nombre = nombreServicio(servicio).toLowerCase();
        var codigo = String(servicio.codigo || '').toLowerCase();
        return nombre.indexOf(term) !== -1 || codigo.indexOf(term) !== -1;
      });
    }

    if (filtroGrupo && filtroGrupo !== 'todos') {
      var map = obtenerMapaGruposSeguro();
      servicios = servicios.filter(function(servicio) {
        return (map[servicio.id] || '') === filtroGrupo;
      });
    }

    if (!servicios.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay servicios registrados</td></tr>';
      return;
    }

    var map = obtenerMapaGruposSeguro();
    var html = servicios.map(function(servicio) {
      var grupoId = map[servicio.id] || '';
      var grupoNombre = obtenerNombreGrupoPorId(grupoId) || 'Sin grupo';
      var nombre = nombreServicio(servicio);

      return ''
        + '<tr>'
        + '<td>' + escapeHtml(servicio.codigo || '-') + '</td>'
        + '<td>'
        + '<div style="font-weight:600;">' + escapeHtml(nombre) + '</div>'
        + '<div style="opacity:.75;font-size:.9em;">' + escapeHtml(grupoNombre) + '</div>'
        + '</td>'
        + '<td>' + escapeHtml(servicio.unidad || 'und') + '</td>'
        + '<td>' + formatMoney(parseFloat(servicio.precio || 0) || 0) + '</td>'
        + '<td>' + (parseInt(servicio.itbms, 10) === 1 ? 'Sí' : 'No') + '</td>'
        + '<td><button type="button" class="btn-table danger" onclick="eliminarServicio(\'' + escapeHtml(servicio.id || '') + '\')">Eliminar</button></td>'
        + '</tr>';
    }).join('');

    tbody.innerHTML = html;
  }

  async function filtrarServicios() {
    var input = byId('buscar-servicio');
    var filtroGrupo = byId('filtro-grupo-servicio') || byId('filtro-servicio-grupo');

    await renderServicios(
      input ? input.value : '',
      filtroGrupo ? filtroGrupo.value : ''
    );
  }

  async function actualizarVistaJSON() {
    var target = byId('jsonServicios') || byId('vista-json') || byId('servicios-json');
    if (!target) return;

    var servicios = await obtenerServicios();
    target.textContent = JSON.stringify(servicios, null, 2);
  }

  window.inicializarCatalogo = inicializarCatalogo;
  window.obtenerServicios = obtenerServicios;
  window.guardarServicio = guardarServicio;
  window.eliminarServicio = eliminarServicio;
  window.renderServicios = renderServicios;
  window.filtrarServicios = filtrarServicios;
  window.actualizarVistaJSON = actualizarVistaJSON;
})(window, document);
