// ============================================================
// js/app.js — Núcleo de inicialización y navegación
// GN Studio OS 0.2 — Dashboard KPIs + Tendencias + UI
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
  var formatMoney = GNUtils.formatMoney || function(value) {
    return 'USD ' + (parseFloat(value || 0) || 0).toFixed(2);
  };
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
      negocio: ['crm', 'catalogo'],
      finanzas: ['estado-cuenta', 'itbms', 'reportes']
    },
    currentSection: 'dashboard',
    currentSub: {
      negocio: 'crm',
      finanzas: 'estado-cuenta'
    }
  };

  // ============================================================
  // Helpers de ejecución segura
  // ============================================================
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

    // ============================================================
  // TOASTS (success, error, info, warning) — GN Studio OS
  // ============================================================
  var toastIdCounter = 0;

  function showToast(options) {
    var container = document.getElementById('toast-container');
    if (!container) return;

    // Aseguramos que el contenedor sea visible
    container.style.display = 'block';

    var opts = typeof options === 'string'
      ? { message: options }
      : (options || {});

    var type = opts.type || 'info';
    var title = opts.title || (type === 'success'
      ? 'Acción completada'
      : type === 'error'
      ? 'Ocurrió un problema'
      : type === 'warning'
      ? 'Atención'
      : 'Información');
    var message = opts.message || '';
    var duration = typeof opts.duration === 'number' ? opts.duration : 4000;

    var toast = document.createElement('div');
    var id = 'toast-' + (++toastIdCounter);

    toast.className = 'toast toast-' + type;
    toast.setAttribute('data-toast-id', id);

    toast.innerHTML =
      '<div class="toast-icon">' + getToastEmoji(type) + '</div>' +
      '<div class="toast-body">' +
        '<div class="toast-title">' + title + '</div>' +
        (message ? '<div class="toast-message">' + message + '</div>' : '') +
      '</div>' +
      '<button class="toast-close" type="button" aria-label="Cerrar">×</button>';

    container.appendChild(toast);

    // Animación de entrada (si quieres usarla en CSS)
    requestAnimationFrame(function() {
      toast.classList.add('toast-visible');
    });

    var closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        hideToast(toast);
      });
    }

    if (duration > 0) {
      setTimeout(function () {
        hideToast(toast);
      }, duration);
    }
  }

  function hideToast(toast) {
    var container = document.getElementById('toast-container');
    if (!toast || !toast.parentNode) return;

    // Opcional: clases para animación de salida
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-leaving');

    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      // Si ya no quedan toasts, ocultamos el contenedor
      if (container && !container.hasChildNodes()) {
        container.style.display = 'none';
      }
    }, 200);
  }

  function getToastEmoji(type) {
    switch (type) {
      case 'success': return '<i class="ph ph-check"></i>';
      case 'error':   return '<i class="ph ph-warning"></i>';
      case 'warning': return '<i class="ph ph-warning"></i>';
      default:        return '<i class="ph ph-info"></i>';
    }
  }

  function mostrarToastOSListo() {
    showToast({
      type: 'success',
      title: 'GN Studio OS listo',
      message: 'La plataforma se inicializó correctamente.',
      duration: 5000
    });
  }

  // Cierre manual desde otros sitios (por ejemplo, si añades un botón "Cerrar todo")
  function cerrarToast() {
    var container = document.getElementById('toast-container');
    if (!container) return;

    Array.prototype.slice.call(container.children).forEach(function (toast) {
      hideToast(toast);
    });
  }

  // ============================================================
  // Navegación: secciones, sub-secciones, breadcrumb y título
  // ============================================================
  function hideAllSections() {
    APP_STATE.sections.forEach(function(sectionId) {
      var el = byId(sectionId);
      if (el) {
        el.classList.remove('active');
        el.style.display = 'none';
      }
    });
  }

  function showSection(sectionId) {
    var el = byId(sectionId);
    if (el) {
      el.style.display = 'block';
      el.classList.add('active');
    }
  }

  function setActiveNav(sectionId) {
    qsa('.nav-link').forEach(function(link) {
      var target = link.getAttribute('data-section');
      if (target === sectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    qsa('.mobile-nav-link').forEach(function(link) {
      var target = link.getAttribute('data-section');
      if (target === sectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function updateHeader(sectionId) {
    var titleMap = {
      dashboard: 'Dashboard',
      negocio: 'Negocio',
      proyectos: 'Proyectos',
      finanzas: 'Finanzas'
    };

    var breadcrumbMap = {
      dashboard: 'Inicio · Dashboard',
      negocio: 'Negocio · CRM · Catálogo · Cotizaciones',
      proyectos: 'Proyectos · Estado y detalle',
      finanzas: 'Finanzas · Estado de cuenta · ITBMS · Reportes'
    };

    var titleEl = byId('page-title');
    var breadcrumbEl = byId('breadcrumb');

    if (titleEl) {
      titleEl.textContent = titleMap[sectionId] || 'GN Studio OS';
    }
    if (breadcrumbEl) {
      breadcrumbEl.textContent = breadcrumbMap[sectionId] || '';
    }
  }

  function switchSection(sectionId) {
    if (APP_STATE.sections.indexOf(sectionId) === -1) {
      log('warn', 'Sección desconocida: ' + sectionId);
      return;
    }

    APP_STATE.currentSection = sectionId;

    hideAllSections();
    showSection(sectionId);
    setActiveNav(sectionId);
    updateHeader(sectionId);

    closeMobileNav();

    // Inicializar/refrescar calendario al entrar a Proyectos
    if (sectionId === 'proyectos') {
      setTimeout(function() {
        if (typeof window.initCalendario === 'function') {
          window.initCalendario();
        } else if (typeof window.refreshCalendario === 'function') {
          window.refreshCalendario();
        }
      }, 50);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function switchSubSection(parentId, subId) {
    var sectionIds = APP_STATE.subSections[parentId] || [];

    sectionIds.forEach(function(id) {
      var el = byId(parentId + '-' + id);
      if (el) {
        el.classList.remove('active');
        el.style.display = 'none';
      }
    });

    var active = byId(parentId + '-' + subId);
    if (active) {
      active.style.display = 'block';
      active.classList.add('active');
    }

    var subNavSelector = parentId === 'negocio'
      ? '#negocio .sub-nav .sub-nav-item'
      : parentId === 'finanzas'
      ? '#finanzas .sub-nav .sub-nav-item'
      : '.sub-nav-item';

    qsa(subNavSelector).forEach(function(btn) {
      btn.classList.remove('active');
    });

    qsa(subNavSelector).forEach(function(btn) {
      var onclickAttr = btn.getAttribute('onclick') || '';
      if (
        onclickAttr.indexOf("'" + parentId + "', '" + subId + "'") !== -1 ||
        onclickAttr.indexOf("'" + parentId + "','" + subId + "'") !== -1 ||
        onclickAttr.indexOf('"' + parentId + '", "' + subId + '"') !== -1
      ) {
        btn.classList.add('active');
      }
    });

    APP_STATE.currentSub[parentId] = subId;
  }

  // ============================================================
  // Navegación móvil (overlay)
  // ============================================================
  function toggleMobileNav() {
    var overlay = byId('mobileNav');
    if (!overlay) return;
    var isOpen = overlay.classList.toggle('open');
    if (isOpen) {
      document.body.classList.add('mobile-nav-open');
    } else {
      document.body.classList.remove('mobile-nav-open');
    }
  }

  function closeMobileNav() {
    var overlay = byId('mobileNav');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.classList.remove('mobile-nav-open');
  }

  // ============================================================
  // Menú de usuario (header, logout)
  // ============================================================
  function toggleUserMenu() {
    var menu = document.getElementById('nav-user-menu');
    if (!menu) return;
    menu.classList.toggle('open');
  }

  // ============================================================
  // Fechas por defecto
  // ============================================================
  function setDefaultDates() {
    var today = getTodayISO();

    var dateIds = ['gasto-fecha', 'pago-fecha', 'cot-fecha', 'ec-desde', 'ec-hasta'];
    dateIds.forEach(function(id) {
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

  // ============================================================
  // Dashboard: alertas reales de vencimientos, cobros y proyectos
  // ============================================================
  async function renderAlertas() {
    var container = byId('alertas-container');
    if (!container) return;

    try {
      var proyectos = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.PROYECTOS) : [];
      var pagos = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.PAGOS) : [];
      var cotizaciones = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.COTIZACIONES) : [];

      var esc = window.escapeHtml || function(v) { return v; };
      var fmtMoney = window.formatMoney || function(v) { return '$' + (v || 0).toFixed(2); };
      var hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      var alertas = [];

      // 1) Cotizaciones por vencer o ya vencidas (aún en estado "cotizado")
      (cotizaciones || []).forEach(function(c) {
        if ((c.estado || 'cotizado') !== 'cotizado') return;
        if (!c.fecha_vencimiento) return;
        var vence = new Date(c.fecha_vencimiento + 'T00:00:00');
        if (isNaN(vence.getTime())) return;
        var diasRestantes = Math.round((vence - hoy) / 86400000);
        if (diasRestantes > 7) return; // fuera de la ventana de aviso

        var color = diasRestantes < 0 ? '#F87171' : '#C5A253';
        var texto = diasRestantes < 0
          ? 'Cotización ' + (c.numero || '') + ' venció hace ' + Math.abs(diasRestantes) + ' día(s)'
          : diasRestantes === 0
            ? 'Cotización ' + (c.numero || '') + ' vence hoy'
            : 'Cotización ' + (c.numero || '') + ' vence en ' + diasRestantes + ' día(s)';

        alertas.push({ orden: diasRestantes, color: color, texto: texto });
      });

      // 2) Proyectos con saldo por cobrar
      (proyectos || []).forEach(function(p) {
        if (p.estado === 'cancelado') return;
        var totalPagado = (pagos || [])
          .filter(function(pg) { return pg.proyecto_id === p.id; })
          .reduce(function(acc, pg) { return acc + (parseFloat(pg.monto) || 0); }, 0);
        var presupuesto = parseFloat(p.presupuesto) || 0;
        var porCobrar = presupuesto - totalPagado;

        if (porCobrar > 0.01) {
          alertas.push({
            orden: 100,
            color: '#F87171',
            texto: 'Pago pendiente: Proyecto "' + (p.nombre || 'Proyecto') + '" (' + fmtMoney(porCobrar) + ')'
          });
        }
      });

      // 3) Proyectos completados recientemente (últimos 7 días)
      (proyectos || []).forEach(function(p) {
        if (p.estado !== 'completado') return;
        var fechaRef = p.updated_at || p.fecha_fin_real || p.created_at;
        if (!fechaRef) return;
        var dias = Math.round((hoy - new Date(fechaRef)) / 86400000);
        if (dias >= 0 && dias <= 7) {
          alertas.push({
            orden: 200,
            color: '#2D8B5E',
            texto: 'Proyecto "' + (p.nombre || 'Proyecto') + '" completado al 100%'
          });
        }
      });

      alertas.sort(function(a, b) { return a.orden - b.orden; });
      alertas = alertas.slice(0, 8);

      if (alertas.length === 0) {
        container.innerHTML =
          '<div class="tabla-vacia">' +
            '<div class="tabla-vacia-icon"><i class="ph ph-bell-slash"></i></div>' +
            '<div>No tienes alertas pendientes por ahora.</div>' +
          '</div>';
        return;
      }

      container.innerHTML = alertas.map(function(a) {
        return '<div class="alerta-item">' +
          '<span class="alerta-dot" style="background:' + a.color + ';"></span>' +
          '<span class="alerta-text">' + esc(a.texto) + '</span>' +
          '</div>';
      }).join('');
    } catch (error) {
      log('error', 'No se pudieron renderizar las alertas', error);
    }
  }

  // ============================================================
  // Dashboard: actividad y KPIs
  // ============================================================
  async function renderActividadReciente() {
    var tbody = byId('tbodyActividadReciente');
    if (!tbody) return;

    try {
      var proyectos = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.PROYECTOS) : [];
      var pagos = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.PAGOS) : [];
      var gastos = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.GASTOS) : [];
      var cotizaciones = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.COTIZACIONES) : [];

      var proyectosMap = {};
      (proyectos || []).forEach(function(p) { proyectosMap[p.id] = p.nombre || 'Proyecto'; });

      var nombreProyecto = function(id) {
        return id && proyectosMap[id] ? proyectosMap[id] : 'General';
      };

      var eventos = [];

      (pagos || []).forEach(function(p) {
        eventos.push({
          fecha: p.fecha || p.created_at || '',
          tipo: 'Ingreso',
          descripcion: p.concepto || p.referencia || 'Pago recibido',
          monto: parseFloat(p.monto) || 0,
          proyecto: nombreProyecto(p.proyecto_id)
        });
      });

      (gastos || []).forEach(function(g) {
        eventos.push({
          fecha: g.fecha || g.created_at || '',
          tipo: 'Gasto',
          descripcion: g.descripcion || g.referencia || 'Gasto registrado',
          monto: -(parseFloat(g.monto) || 0),
          proyecto: nombreProyecto(g.proyecto_id)
        });
      });

      (proyectos || []).forEach(function(p) {
        eventos.push({
          fecha: p.created_at || p.fecha_inicio || '',
          tipo: 'Proyecto',
          descripcion: 'Proyecto "' + (p.nombre || 'Proyecto') + '" creado',
          monto: null,
          proyecto: p.nombre || 'Proyecto'
        });
        if (p.estado === 'completado') {
          eventos.push({
            fecha: p.updated_at || p.fecha_fin_real || p.created_at || '',
            tipo: 'Proyecto',
            descripcion: 'Proyecto "' + (p.nombre || 'Proyecto') + '" completado',
            monto: null,
            proyecto: p.nombre || 'Proyecto'
          });
        }
      });

      (cotizaciones || []).forEach(function(c) {
        eventos.push({
          fecha: c.fecha_emision || c.created_at || '',
          tipo: 'Cotización',
          descripcion: 'Cotización ' + (c.numero || '') + ' creada',
          monto: parseFloat(c.total) || 0,
          proyecto: nombreProyecto(c.proyecto_id) !== 'General' ? nombreProyecto(c.proyecto_id) : (c.cliente_nombre || 'General')
        });
      });

      eventos = eventos.filter(function(e) { return e.fecha; });
      eventos.sort(function(a, b) { return new Date(b.fecha) - new Date(a.fecha); });
      eventos = eventos.slice(0, 10);

      if (eventos.length === 0) {
        tbody.innerHTML =
          '<tr>' +
            '<td colspan="5">' +
              '<div class="tabla-vacia">' +
                '<div class="tabla-vacia-icon"><i class="ph ph-file-text"></i></div>' +
                '<div>Aún no hay actividad registrada.</div>' +
                '<div style="margin-top:6px;font-size:13px;">' +
                  'Verás aquí pagos, gastos, proyectos y cotizaciones en cuanto los registres.' +
                '</div>' +
              '</div>' +
            '</td>' +
          '</tr>';
        return;
      }

      var esc = window.escapeHtml || function(v) { return v; };
      var fmtDate = window.formatDate || function(v) { return v; };
      var fmtMoney = window.formatMoney || function(v) { return '$' + (v || 0).toFixed(2); };

      tbody.innerHTML = eventos.map(function(e) {
        var montoTexto = e.monto === null ? '—' : fmtMoney(e.monto);
        var montoColor = e.monto === null ? '' : (e.monto >= 0 ? 'color:#2D8B5E;font-weight:600;' : 'color:#F87171;font-weight:600;');
        return '<tr>' +
          '<td>' + esc(fmtDate(e.fecha)) + '</td>' +
          '<td>' + esc(e.tipo) + '</td>' +
          '<td>' + esc(e.descripcion) + '</td>' +
          '<td style="' + montoColor + '">' + montoTexto + '</td>' +
          '<td>' + esc(e.proyecto) + '</td>' +
          '</tr>';
      }).join('');
    } catch (error) {
      log('error', 'No se pudo renderizar la actividad reciente', error);
    }
  }

// Helpers de conteo para pipeline
    async function obtenerConteosCotizacionesPorEstado() {
      var cotizaciones = await window.getData(window.STORAGE_KEYS.COTIZACIONES || 'cotizaciones');
      var conteos = { cotizado: 0, aprobado: 0, rechazado: 0, vencido: 0 };
      if (Array.isArray(cotizaciones)) {
        cotizaciones.forEach(function(c) {
          var estado = (c.estado || 'cotizado').toLowerCase();
          if (conteos.hasOwnProperty(estado)) conteos[estado]++;
        });
      }
      return conteos;
    }

    async function obtenerConteosProyectosPorEstado() {
      var proyectos = await window.getData(window.STORAGE_KEYS.PROYECTOS || 'proyectos');
      var conteos = { aprobado: 0, en_progreso: 0, completado: 0, cancelado: 0 };
      if (Array.isArray(proyectos)) {
        proyectos.forEach(function(p) {
          var estado = (p.estado || '').toLowerCase().replace(/ /g, '_');
          if (conteos.hasOwnProperty(estado)) conteos[estado]++;
        });
      }
      return conteos;
    }

    async function renderDashboardPipeline() {
      try {
        var cot = await obtenerConteosCotizacionesPorEstado();
        var proy = await obtenerConteosProyectosPorEstado();
        var set = function(id, value) {
          var el = byId(id);
          if (el) el.textContent = String(value || 0);
        };
        set('pipeline-cotizado', cot.cotizado);
        set('pipeline-aprobado', cot.aprobado);
        set('pipeline-en-progreso', proy.en_progreso);
        set('pipeline-completado', proy.completado);
      } catch (e) {
        console.error('Error al renderizar pipeline de ventas', e);
      }
    }

    function renderPipelineMini() {
      // Inicializar KPIs en 0 mientras cargan
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
      resetTrends();
      // Renderizar pipeline con datos reales
      renderDashboardPipeline();
    }

  function resetTrends() {
    var trendIngresos = byId('trend-ingresos');
    var trendGastos = byId('trend-gastos');
    var trendBalance = byId('trend-balance');

    [trendIngresos, trendGastos, trendBalance].forEach(function(el) {
      if (!el) return;
      el.textContent = '→ 0%';
      el.classList.remove('up', 'down');
    });
  }

  function calcularDelta(actual, previo) {
    var a = parseFloat(actual || 0) || 0;
    var p = parseFloat(previo || 0) || 0;
    if (p === 0 && a === 0) return 0;
    if (p === 0 && a !== 0) return 100;
    return ((a - p) / p) * 100;
  }

  function aplicarTrend(el, delta) {
    if (!el) return;
    var d = Math.round(delta);
    if (d > 0) {
      el.textContent = '↑ ' + d + '% vs mes anterior';
      el.classList.remove('down');
      el.classList.add('up');
    } else if (d < 0) {
      el.textContent = '↓ ' + Math.abs(d) + '% vs mes anterior';
      el.classList.remove('up');
      el.classList.add('down');
    } else {
      el.textContent = '→ 0%';
      el.classList.remove('up', 'down');
    }
  }

  async function actualizarKPIs() {
    try {
      var clientes = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.CLIENTES) : [];
      var proyectos = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.PROYECTOS) : [];
      var cotizaciones = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.COTIZACIONES) : [];
      var gastos = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.GASTOS) : [];
      var pagos = typeof window.getData === 'function' ? await window.getData(window.STORAGE_KEYS.PAGOS) : [];

      var ahora = new Date();
      var mesActual = ahora.getMonth();
      var anioActual = ahora.getFullYear();
      var mesPrevio = mesActual === 0 ? 11 : mesActual - 1;
      var anioPrevio = mesActual === 0 ? anioActual - 1 : anioActual;

      function esDelMes(fechaStr, m, y) {
        if (!fechaStr) return false;
        var f = new Date(fechaStr);
        return f.getMonth() === m && f.getFullYear() === y;
      }

      var totalIngresosActual = (pagos || []).reduce(function(acc, item) {
        var monto = parseFloat(item && (item.monto || item.total || 0)) || 0;
        var fecha = item && (item.fecha || item.fechaPago || item.createdAt);
        return esDelMes(fecha, mesActual, anioActual) ? acc + monto : acc;
      }, 0);

      var totalIngresosPrevio = (pagos || []).reduce(function(acc, item) {
        var monto = parseFloat(item && (item.monto || item.total || 0)) || 0;
        var fecha = item && (item.fecha || item.fechaPago || item.createdAt);
        return esDelMes(fecha, mesPrevio, anioPrevio) ? acc + monto : acc;
      }, 0);

      var totalGastosActual = (gastos || []).reduce(function(acc, item) {
        var monto = parseFloat(item && item.monto) || 0;
        var fecha = item && (item.fecha || item.fechaGasto || item.createdAt);
        return esDelMes(fecha, mesActual, anioActual) ? acc + monto : acc;
      }, 0);

      var totalGastosPrevio = (gastos || []).reduce(function(acc, item) {
        var monto = parseFloat(item && item.monto) || 0;
        var fecha = item && (item.fecha || item.fechaGasto || item.createdAt);
        return esDelMes(fecha, mesPrevio, anioPrevio) ? acc + monto : acc;
      }, 0);

      var balanceActual = totalIngresosActual - totalGastosActual;
      var balancePrevio = totalIngresosPrevio - totalGastosPrevio;

      if (byId('kpi-clientes')) byId('kpi-clientes').textContent = String((clientes || []).length);
      if (byId('kpi-proyectos')) byId('kpi-proyectos').textContent = String((proyectos || []).length);
      if (byId('kpi-cotizaciones')) byId('kpi-cotizaciones').textContent = String((cotizaciones || []).length);
      if (byId('kpi-ingresos')) byId('kpi-ingresos').textContent = formatMoney(totalIngresosActual);
      if (byId('kpi-gastos')) byId('kpi-gastos').textContent = formatMoney(totalGastosActual);
      if (byId('kpi-balance')) byId('kpi-balance').textContent = formatMoney(balanceActual);

      var trendIngresos = byId('trend-ingresos');
      var trendGastos = byId('trend-gastos');
      var trendBalance = byId('trend-balance');

      aplicarTrend(trendIngresos, calcularDelta(totalIngresosActual, totalIngresosPrevio));
      aplicarTrend(trendGastos, calcularDelta(totalGastosActual, totalGastosPrevio));
      aplicarTrend(trendBalance, calcularDelta(balanceActual, balancePrevio));

      if ((clientes || []).length === 0 &&
          (proyectos || []).length === 0 &&
          (cotizaciones || []).length === 0 &&
          (pagos || []).length === 0 &&
          (gastos || []).length === 0) {
        renderPipelineMini();
        if (window.showToast) {
          window.showToast({
            type: 'info',
            title: 'Dashboard vacío',
            message: 'Cuando registres clientes, proyectos y finanzas, el dashboard mostrará tus métricas en tiempo real.'
          });
        }
      }
    } catch (error) {
      log('error', 'No se pudieron actualizar los KPIs', error);
      renderPipelineMini();
    }
  }

  // ============================================================
  // Vista JSON de depuración
  // ============================================================
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

  // ============================================================
  // Exportaciones placeholder
  // ============================================================
  function exportarTodo() {
    log('info', 'exportarTodo() pendiente de migración');
    showToast({
      type: 'info',
      title: 'Exportación pendiente',
      message: 'La exportación global se reconectará después de migrar los módulos principales.'
    });
  }

  function exportarEstadoCuentaPDF() {
    showToast({
      type: 'info',
      title: 'PDF pendiente',
      message: 'La exportación a PDF del Estado de Cuenta está pendiente de migración.'
    });
  }

  function exportarEstadoCuentaExcel() {
    showToast({
      type: 'info',
      title: 'Excel pendiente',
      message: 'La exportación a Excel del Estado de Cuenta está pendiente de migración.'
    });
  }

  function exportarITBMSPDF() {
    showToast({
      type: 'info',
      title: 'ITBMS pendiente',
      message: 'La exportación de ITBMS para DGI está pendiente de migración.'
    });
  }

  function sugerirGrupoIA() {
    showToast({
      type: 'info',
      title: 'IA pendiente',
      message: 'La sugerencia automática de grupo con IA se activará en una fase posterior.'
    });
  }

  // ============================================================
  // Inicialización de Finanzas
  // ============================================================
  async function inicializarFinanzas() {
    if (typeof window.actualizarSelectProyectosFinanzas === 'function') {
      await window.actualizarSelectProyectosFinanzas();
    }
    if (typeof window.generarEstadoCuenta === 'function') {
      await window.generarEstadoCuenta();
    }
    if (typeof window.renderITBMS === 'function') {
      await window.renderITBMS();
    }
    if (typeof window.inicializarFormularioGastoFinanzas === 'function') {
      window.inicializarFormularioGastoFinanzas();
    }
    if (typeof window.inicializarFormularioPagoFinanzas === 'function') {
      window.inicializarFormularioPagoFinanzas();
    }
  }

  // ============================================================
  // Inicialización general de módulos
  // ============================================================
  async function inicializarAppGNStudio() {
    if (APP_STATE.initialized) return;
    APP_STATE.initialized = true;

    log('info', 'Inicializando GN Studio OS');

    setDefaultDates();
    setTodayMonth();

    await safeCallAsync('inicializarClientes');
    await safeCallAsync('inicializarCatalogo');
    safeCall('inicializarGrupos');
    // await safeCallAsync('inicializarCotizaciones'); // Eliminado — cotizaciones integradas en Proyectos
    await safeCallAsync('inicializarProyectos');
    await inicializarFinanzas();
    await safeCallAsync('inicializarCharts');

    await actualizarKPIs();
    await renderActividadReciente();
    await renderAlertas();
    await actualizarVistaJSON();

    switchSection('dashboard');
    switchSubSection('negocio', 'crm');
    switchSubSection('finanzas', 'estado-cuenta');

    if (typeof window.switchProyectoTab === 'function') {
      window.switchProyectoTab('resumen');
    }

    // Inicializar calendario (la sección proyectos puede estar oculta,
    // se llamará de nuevo al navegar, pero pre-cargamos el estado)
    if (typeof window.initCalendario === 'function') {
      window.initCalendario();
    }

    showToast({
      type: 'success',
      title: 'GN Studio OS listo',
      message: 'La plataforma se inicializó correctamente.'
    });
  }

  // ============================================================
  // Exponer funciones al global
  // ============================================================
  window.switchSection = switchSection;
  window.switchSubSection = switchSubSection;
  window.toggleMobileNav = toggleMobileNav;
  window.toggleUserMenu = toggleUserMenu;
  window.actualizarKPIs = actualizarKPIs;
  window.actualizarVistaJSON = actualizarVistaJSON;
  window.exportarTodo = exportarTodo;
  window.exportarEstadoCuentaPDF = exportarEstadoCuentaPDF;
  window.exportarEstadoCuentaExcel = exportarEstadoCuentaExcel;
  window.exportarITBMSPDF = exportarITBMSPDF;
  window.sugerirGrupoIA = sugerirGrupoIA;
  window.inicializarAppGNStudio = inicializarAppGNStudio;
  window.renderActividadReciente = renderActividadReciente;
  window.renderAlertas = renderAlertas;
  window.renderPipelineMini = renderPipelineMini;
  window.inicializarFinanzas = inicializarFinanzas;
  window.showToast = showToast;

  document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.gnAuthInit === 'function') {
      window.gnAuthInit(inicializarAppGNStudio);
      return;
    }

    inicializarAppGNStudio();
  });
})(window, document);
