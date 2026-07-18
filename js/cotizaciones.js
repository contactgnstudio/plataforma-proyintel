// ============================================================
// js/cotizaciones.js — Módulo de Cotizaciones (GN Studio OS 0.2)
// Gestión de cotizaciones + empty states + toasts + pipeline
// ============================================================

(function(window, document) {
  'use strict';

  var byId = function(id) { return document.getElementById(id); };
  var qsa = function(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var STORAGE_KEYS = window.STORAGE_KEYS || {
    COTIZACIONES: 'gn_cotizaciones'
  };

  function log(level, msg, meta) {
    if (window.GNUtils && typeof window.GNUtils.log === 'function') {
      window.GNUtils.log(level, msg, meta);
      return;
    }
    if (meta !== undefined) {
      console[level] ? console[level](msg, meta) : console.log(msg, meta);
      return;
    }
    console[level] ? console[level](msg) : console.log(msg);
  }

  // ============================================================
  // Helpers de datos
  // ============================================================
  async function getCotizaciones() {
    if (typeof window.getData === 'function') {
      return (await window.getData(STORAGE_KEYS.COTIZACIONES)) || [];
    }
    return [];
  }

  async function setCotizaciones(lista) {
    if (typeof window.saveData === 'function') {
      return window.saveData(STORAGE_KEYS.COTIZACIONES, lista || []);
    }
  }

  function generarCodigoCotizacion() {
    var now = new Date();
    var y = String(now.getFullYear()).slice(-2);
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var rand = Math.floor(100 + Math.random() * 900);
    return 'COT-' + d + m + y + '-' + rand;
  }

  function parseMonto(value) {
    return parseFloat(value || 0) || 0;
  }

  // ============================================================
  // Empty state para tabla de cotizaciones
  // ============================================================
  function renderEmptyCotizaciones(tbody) {
    if (!tbody) return;
    tbody.innerHTML =
      '<tr>' +
        '<td colspan="6">' +
          '<div class="tabla-vacia">' +
            '<div class="tabla-vacia-icon">📄</div>' +
            '<div>No tienes cotizaciones registradas aún.</div>' +
            '<div style="margin-top:6px;font-size:13px;">' +
              'Crea una nueva cotización usando el formulario de la derecha.' +
            '</div>' +
          '</div>' +
        '</td>' +
      '</tr>';
  }

  // ============================================================
  // Render de tabla de cotizaciones
  // ============================================================
  async function renderTablaCotizaciones() {
    var tbody = byId('tbodyCotizaciones');
    if (!tbody) return;

    try {
      var cotizaciones = await getCotizaciones();
      if (!cotizaciones || cotizaciones.length === 0) {
        renderEmptyCotizaciones(tbody);
        actualizarKpiCotizaciones(0);
        return;
      }

      cotizaciones = cotizaciones.slice().sort(function(a, b) {
        var da = new Date(a.fecha || a.fechaCotizacion || 0).getTime();
        var db = new Date(b.fecha || b.fechaCotizacion || 0).getTime();
        return db - da;
      });

      var html = cotizaciones.map(function(cot) {
        var codigo = cot.codigo || cot.id || generarCodigoCotizacion();
        var clienteNombre = cot.clienteNombre || cot.cliente || '—';
        var fecha = cot.fecha || cot.fechaCotizacion || '—';
        var total = parseMonto(cot.total || cot.montoTotal || 0);
        var estado = cot.estado || 'cotizado';

        var estadoClase = 'estado-cotizado';
        var estadoTexto = 'Cotizado';

        if (estado === 'aprobado') {
          estadoClase = 'estado-aprobado';
          estadoTexto = 'Aprobado';
        } else if (estado === 'rechazado') {
          estadoClase = 'estado-rechazado';
          estadoTexto = 'Rechazado';
        } else if (estado === 'vencido') {
          estadoClase = 'estado-vencido';
          estadoTexto = 'Vencido';
        }

        return (
          '<tr>' +
            '<td>' + codigo + '</td>' +
            '<td>' + fecha + '</td>' +
            '<td>' + clienteNombre + '</td>' +
            '<td class="td-monto">USD ' + total.toFixed(2) + '</td>' +
            '<td><span class="estado-badge ' + estadoClase + '">' + estadoTexto + '</span></td>' +
            '<td class="td-actions">' +
              '<button class="btn-icon" type="button" onclick="editarCotizacion(\'' + codigo + '\')" title="Editar">✏️</button>' +
            '</td>' +
          '</tr>'
        );
      }).join('');

      tbody.innerHTML = html;
      actualizarKpiCotizaciones(cotizaciones.length);
    } catch (error) {
      log('error', 'Error renderizando cotizaciones', error);
      renderEmptyCotizaciones(tbody);
      if (window.showToast) {
        window.showToast({
          type: 'error',
          title: 'No se pudieron cargar las cotizaciones',
          message: 'Ocurrió un problema leyendo los datos. Intenta nuevamente.'
        });
      }
    }
  }

  function actualizarKpiCotizaciones(n) {
    var el = byId('kpi-cotizaciones');
    if (!el) return;
    el.textContent = String(n || 0);
  }

  // ============================================================
  // Manejo de formulario de nueva cotización
  // ============================================================
  async function guardarCotizacion(event) {
    if (event && event.preventDefault) event.preventDefault();

    var form = byId('formCotizacion');
    var feedback = byId('feedback-cotizacion');

    if (feedback) {
      feedback.classList.remove('success', 'error');
      feedback.style.display = 'none';
      feedback.textContent = '';
    }

    if (!form) return false;

    try {
      var clienteSelect = byId('cot-cliente');
      var fechaInput = byId('cot-fecha');
      var descripcionInput = byId('cot-descripcion');
      var opcionTotalInput = byId('cot-total');

      var clienteId = clienteSelect ? clienteSelect.value : '';
      var clienteNombre = clienteSelect ? (clienteSelect.options[clienteSelect.selectedIndex] || {}).text : '';
      var fecha = fechaInput ? fechaInput.value : '';
      var descripcion = descripcionInput ? descripcionInput.value.trim() : '';
      var total = opcionTotalInput ? parseMonto(opcionTotalInput.value) : 0;

      if (!clienteId) {
        setFeedback(feedback, 'Debes seleccionar un cliente.', 'error');
        if (window.showToast) {
          window.showToast({
            type: 'warning',
            title: 'Cliente requerido',
            message: 'Selecciona un cliente antes de guardar la cotización.'
          });
        }
        return false;
      }

      if (!fecha) {
        setFeedback(feedback, 'Debes indicar la fecha de la cotización.', 'error');
        return false;
      }

      if (!descripcion) {
        setFeedback(feedback, 'Agrega una descripción breve de la cotización.', 'error');
        return false;
      }

      if (total <= 0) {
        setFeedback(feedback, 'El total de la cotización debe ser mayor a 0.', 'error');
        return false;
      }

      var codigo = generarCodigoCotizacion();

      var nuevaCotizacion = {
        codigo: codigo,
        clienteId: clienteId,
        clienteNombre: clienteNombre,
        fecha: fecha,
        descripcion: descripcion,
        total: total,
        estado: 'cotizado',
        createdAt: new Date().toISOString()
      };

      var lista = await getCotizaciones();
      lista = Array.isArray(lista) ? lista.slice() : [];
      lista.push(nuevaCotizacion);

      await setCotizaciones(lista);
      await renderTablaCotizaciones();

      if (typeof window.actualizarKPIs === 'function') {
        window.actualizarKPIs();
      }

      setFeedback(feedback, 'Cotización guardada correctamente.', 'success');

      if (window.showToast) {
        window.showToast({
          type: 'success',
          title: 'Cotización creada',
          message: 'La cotización ' + codigo + ' se guardó y está disponible en la lista.'
        });
      }

      form.reset();
      var hoy = (window.GNUtils && typeof window.GNUtils.getTodayISO === 'function')
        ? window.GNUtils.getTodayISO()
        : (new Date()).toISOString().slice(0, 10);
      if (fechaInput) fechaInput.value = hoy;

      return false;
    } catch (error) {
      log('error', 'Error guardando cotización', error);
      setFeedback(feedback, 'Ocurrió un error al guardar la cotización.', 'error');
      if (window.showToast) {
        window.showToast({
          type: 'error',
          title: 'No se pudo guardar',
          message: 'Intenta nuevamente. Si el problema continúa, revisa la conexión de datos.'
        });
      }
      return false;
    }
  }

  function setFeedback(el, message, type) {
    if (!el) return;
    el.textContent = message || '';
    el.classList.remove('success', 'error');
    if (type === 'success') {
      el.classList.add('success');
    } else if (type === 'error') {
      el.classList.add('error');
    }
    el.style.display = message ? 'block' : 'none';
  }

  // ============================================================
  // Edición simple (placeholder 0.2, sin romper lógica actual)
  // ============================================================
  async function editarCotizacion(codigo) {
    var cotizaciones = await getCotizaciones();
    var cot = (cotizaciones || []).find(function(item) {
      return item.codigo === codigo || item.id === codigo;
    });

    if (!cot) {
      if (window.showToast) {
        window.showToast({
          type: 'error',
          title: 'Cotización no encontrada',
          message: 'No se encontró la cotización ' + codigo + ' en el sistema.'
        });
      }
      return;
    }

    var form = byId('formCotizacion');
    if (!form) return;

    var clienteSelect = byId('cot-cliente');
    var fechaInput = byId('cot-fecha');
    var descripcionInput = byId('cot-descripcion');
    var opcionTotalInput = byId('cot-total');

    if (clienteSelect && cot.clienteId) {
      clienteSelect.value = cot.clienteId;
    }
    if (fechaInput && cot.fecha) {
      fechaInput.value = cot.fecha;
    }
    if (descripcionInput && cot.descripcion) {
      descripcionInput.value = cot.descripcion;
    }
    if (opcionTotalInput && cot.total) {
      opcionTotalInput.value = cot.total;
    }

    if (window.showToast) {
      window.showToast({
        type: 'info',
        title: 'Editando cotización',
        message: 'Estás editando la cotización ' + (cot.codigo || codigo) + '. Al guardar se actualizará.'
      });
    }
  }

  // ============================================================
  // Inicialización del módulo
  // ============================================================
  async function inicializarCotizaciones() {
    log('info', 'Inicializando módulo de Cotizaciones');

    var form = byId('formCotizacion');
    if (form) {
      form.addEventListener('submit', guardarCotizacion);
    }

    await renderTablaCotizaciones();
  }

  window.inicializarCotizaciones = inicializarCotizaciones;
  window.guardarCotizacion = guardarCotizacion;
  window.editarCotizacion = editarCotizacion;

})(window, document);
