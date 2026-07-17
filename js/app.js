// ============================================================
// js/app.js — Núcleo de inicialización y navegación
// Versión limpia sobre utils.js + storage.js
// ============================================================

(function(window, document) {
  'use strict';

  var GNUtils = window.GNUtils || {};
  var byId = GNUtils.byId || function(id) { return document.getElementById(id); };
  var qsa = GNUtils.qsa || function(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  };
  var getTodayISO = GNUtils.getTodayISO || function() {
    var now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  };
  var formatMoney = GNUtils.formatMoney || function(value) { return 'USD ' + (parseFloat(value || 0) || 0).toFixed(2); };
  var log = GNUtils.log || function(level, message, meta) {
    if (meta !== undefined) {
      console[level] ? console[level](message, meta) : console.log(message, meta);
      return;
    }
    console[level] ? console[level](message) : console.log(message);
  };

  var APP_STATE = {
    initialized: false,
    sections: ['dashboard', 'negocio', 'proyectos', 'finanzas'],
    subSections: {
      negocio: ['crm', 'catalogo', 'cotizaciones'],
      finanzas: ['estado-cuenta', 'itbms', 'reportes']
    }
  };

  function safeCall(fnName) {
    if (typeof window[fnName] !== 'function') return null;
    var args = Array.prototype.slice.call(arguments, 1);
    try {
      return window[fnName].apply(window, args);
    } catch (error) {
      log('error', 'Error ejecutando ' + fnName, error);
      return null;
    }
  }

  async function safeCallAsync(fnName) {
    if (typeof window[fnName] !== 'function') return null;
    var args = Array.prototype.slice.call(arguments, 1);
    try {
      return await window[fnName].apply(window, args);
    } catch (error) {
      log('error', 'Error async ejecutando ' + fnName, error);
      return null;
    }
  }

  function hideAllSections() {
    APP_STATE.sections.forEach(function(sectionId) {
      var el = byId(sectionId);
      if (el) el.style.display = 'none';
    });
  }

  function showSection(sectionId) {
    var el = byId(sectionId);
    if (el) el.style.display = 'block';
  }

  function setActiveNav(sectionId) {
    qsa('.nav-link, .mobile-nav-link').forEach(function(link) {
      link.classList.remove('active');
      var attr = link.getAttribute('onclick') || '';
      if (attr.indexOf("'" + sectionId + "'") !== -1 || attr.indexOf('"' + sectionId + '"') !== -1) {
        link.classList.add('active');
      }
    });
  }

  function switchSection(sectionId) {
    hideAllSections();
    showSection(sectionId);
    setActiveNav(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function switchSubSection(parentId, subId) {
    var sectionIds = APP_STATE.subSections[parentId] || [];

    sectionIds.forEach(function(id) {
      var el = byId(parentId + '-' + id);
      if (el) el.style.display = 'none';
    });

    var active = byId(parentId + '-' + subId);
    if (active) active.style.display = 'block';

    qsa('.sub-nav-link').forEach(function(link) {
      link.classList.remove('active');
      var attr = link.getAttribute('onclick') || '';
      if (attr.indexOf("'" + parentId + "', '" + subId + "'") !== -1 || attr.indexOf("'" + parentId + "','" + subId + "'") !== -1) {
        link.classList.add('active');
      }
    });
  }

  function toggleMobileNav() {
    var nav = byId('mobileNav');
    if (!nav) return;
    nav.classList.toggle('is-open');
  }

  function setDefaultDates() {
    var today = getTodayISO();
    var ids = ['gasto-fecha', 'pago-fecha', 'cot-fecha', 'ec-desde', 'ec-hasta', 'itbms-periodo'];

    ids.forEach(function(id) {
      var field = byId(id);
      if (field && !field.value) {
        field.value = today;
      }
    });
  }

  function setTodayMonth() {
    var field = byId('itbms-periodo');
    if (!field || field.value) return;

    var now = new Date();
    field.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  }

  function renderActividadReciente() {
    var tbody = byId('tbodyActividadReciente');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">La actividad reciente se actualizará al completar la migración de módulos.</td></tr>';
  }

  function renderPipelineMini() {
    var targets = {
      cotizaciones: byId('kpi-cotizaciones'),
      proyectos: byId('kpi-proyectos'),
      clientes: byId('kpi-clientes'),
      ingresos: byId('kpi-ingresos'),
      gastos: byId('kpi-gastos'),
      balance: byId('kpi-balance')
    };

    Object.keys(targets).forEach(function(key) {
      if (!targets[key]) return;
      if (key === 'ingresos' || key === 'gastos' || key === 'balance') {
        targets[key].textContent = formatMoney(0);
      } else {
        targets[key].textContent = '0';
      }
    });
  }

  async function actualizarKPIs() {
    try {
      var clientes = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.CLIENTES) : [];
      var proyectos = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.PROYECTOS) : [];
      var cotizaciones = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.COTIZACIONES) : [];
      var gastos = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.GASTOS) : [];
      var pagos = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.PAGOS) : [];

      var totalIngresos = (pagos || []).reduce(function(acc, item) {
        return acc + (parseFloat(item && (item.monto || item.total || 0)) || 0);
      }, 0);

      var totalGastos = (gastos || []).reduce(function(acc, item) {
        return acc + (parseFloat(item && item.monto) || 0);
      }, 0);

      var balance = totalIngresos - totalGastos;

      if (byId('kpi-clientes')) byId('kpi-clientes').textContent = String((clientes || []).length);
      if (byId('kpi-proyectos')) byId('kpi-proyectos').textContent = String((proyectos || []).length);
      if (byId('kpi-cotizaciones')) byId('kpi-cotizaciones').textContent = String((cotizaciones || []).length);
      if (byId('kpi-ingresos')) byId('kpi-ingresos').textContent = formatMoney(totalIngresos);
      if (byId('kpi-gastos')) byId('kpi-gastos').textContent = formatMoney(totalGastos);
      if (byId('kpi-balance')) byId('kpi-balance').textContent = formatMoney(balance);
    } catch (error) {
      log('error', 'No se pudieron actualizar los KPIs', error);
      renderPipelineMini();
    }
  }

  async function actualizarVistaJSON() {
    var el = byId('jsonServicios') || byId('vista-json') || byId('servicios-json');
    if (!el) return;

    try {
      var payload = {
        servicios: typeof window.obtenerServicios === 'function' ? await window.obtenerServicios() : [],
        clientes: typeof window.obtenerClientes === 'function' ? await window.obtenerClientes() : [],
        grupos: typeof window.obtenerGrupos === 'function' ? window.obtenerGrupos() : [],
        tareas: typeof window.getData === 'function' ? await window.getData('gn_tareas') : []
      };

      el.textContent = JSON.stringify(payload, null, 2);
    } catch (error) {
      log('error', 'No se pudo actualizar la vista JSON', error);
    }
  }

  function exportarTodo() {
    log('info', 'exportarTodo() pendiente de migración');
    alert('La exportación global se reconectará después de migrar los módulos principales.');
  }

  // Estas funciones de Finanzas ahora existen en js/finanzas.js,
  // así que no redefinimos aquí su lógica para no pisarlas.

  function exportarEstadoCuentaPDF() {
    alert('Exportación PDF pendiente de migración.');
  }

  function exportarEstadoCuentaExcel() {
    alert('Exportación Excel pendiente de migración.');
  }

  function exportarITBMSPDF() {
    alert('Exportación ITBMS PDF pendiente de migración.');
  }

  // Módulo de Proyectos: estas funciones ya se implementan en js/proyectos.js,
  // aquí solo dejamos wrappers ligeros donde hace falta.

  function filtrarProyectos(estado) {
    // Wrapper para botones que llaman filtrarProyectos() sin argumento.
    if (typeof window.filtrarProyectos === 'function') {
      window.filtrarProyectos(estado || 'todos');
    }
  }

  function volverAListaProyectos() {
    if (typeof window.volverAListaProyectos === 'function') {
      window.volverAListaProyectos();
    } else {
      safeCall('renderProyectos');
    }
  }

  function switchProyectoTab(tabId) {
    if (typeof window.switchProyectoTab === 'function') {
      window.switchProyectoTab(tabId);
      return;
    }

    // Fallback visual mínimo
    ['resumen', 'financiero', 'tareas', 'documentos'].forEach(function(key) {
      var pane = byId('proyecto-tab-' + key);
      if (pane) pane.style.display = key === tabId ? 'block' : 'none';
    });
  }

  function abrirModalGastoProyecto() {
    if (typeof window.abrirModalGastoProyecto === 'function') {
      window.abrirModalGastoProyecto();
      return;
    }
    alert('Modal de gasto por proyecto pendiente de migración.');
  }

  function abrirModalPagoProyecto() {
    if (typeof window.abrirModalPagoProyecto === 'function') {
      window.abrirModalPagoProyecto();
      return;
    }
    alert('Modal de pago por proyecto pendiente de migración.');
  }

  function guardarNotasProyecto() {
    if (typeof window.guardarNotasProyecto === 'function') {
      window.guardarNotasProyecto();
      return;
    }
    alert('Notas de proyecto pendientes de migración.');
  }

  function sugerirGrupoIA() {
    alert('Sugerencia IA pendiente de migración.');
  }

  async function inicializarFinanzas() {
    // Inicializa módulo Finanzas: select de proyectos, estado de cuenta, ITBMS y formularios.
    if (typeof window.actualizarSelectProyectosFinanzas === 'function') {
      window.actualizarSelectProyectosFinanzas();
    }
    if (typeof window.generarEstadoCuenta === 'function') {
      window.generarEstadoCuenta();
    }
    if (typeof window.renderITBMS === 'function') {
      window.renderITBMS();
    }
    if (typeof window.inicializarFormularioGastoFinanzas === 'function') {
      window.inicializarFormularioGastoFinanzas();
    }
    if (typeof window.inicializarFormularioPagoFinanzas === 'function') {
      window.inicializarFormularioPagoFinanzas();
    }
  }

  async function inicializarAppGNStudio() {
    if (APP_STATE.initialized) return;
    APP_STATE.initialized = true;

    log('info', 'Inicializando GN Studio OS');

    setDefaultDates();
    setTodayMonth();

    // Inicializamos módulos principales
    await safeCallAsync('inicializarClientes');
    await safeCallAsync('inicializarCatalogo');
    safeCall('inicializarGrupos');
    await safeCallAsync('inicializarCotizaciones');
    await safeCallAsync('inicializarProyectos');
    await safeCallAsync('inicializarFinanzas');
    safeCall('inicializarCharts');

    await actualizarKPIs();
    renderActividadReciente();
    renderPipelineMini();
    await actualizarVistaJSON();

    switchSection('dashboard');
    switchSubSection('negocio', 'crm');
    switchSubSection('finanzas', 'estado-cuenta');
    switchProyectoTab('resumen');
  }

  window.switchSection = switchSection;
  window.switchSubSection = switchSubSection;
  window.toggleMobileNav = toggleMobileNav;
  window.actualizarKPIs = actualizarKPIs;
  window.actualizarVistaJSON = actualizarVistaJSON;
  window.exportarTodo = exportarTodo;
  window.exportarEstadoCuentaPDF = exportarEstadoCuentaPDF;
  window.exportarEstadoCuentaExcel = exportarEstadoCuentaExcel;
  window.exportarITBMSPDF = exportarITBMSPDF;
  window.filtrarProyectos = filtrarProyectos;
  window.volverAListaProyectos = volverAListaProyectos;
  window.switchProyectoTab = switchProyectoTab;
  window.abrirModalGastoProyecto = abrirModalGastoProyecto;
  window.abrirModalPagoProyecto = abrirModalPagoProyecto;
  window.guardarNotasProyecto = guardarNotasProyecto;
  window.sugerirGrupoIA = sugerirGrupoIA;
  window.inicializarAppGNStudio = inicializarAppGNStudio;
  window.renderActividadReciente = renderActividadReciente;
  window.renderPipelineMini = renderPipelineMini;
  window.inicializarFinanzas = inicializarFinanzas;

  document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.gnAuthInit === 'function') {
      window.gnAuthInit(inicializarAppGNStudio);
      return;
    }

    inicializarAppGNStudio();
  });
})(window, document);
