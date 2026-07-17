// ============================================================
// js/cotizaciones.js — Módulo de Cotizaciones
// Versión temporal estable para evitar llamadas legacy a setData
// ============================================================

(function(window, document) {
  'use strict';

  var GNUtils = window.GNUtils || {};
  var byId = GNUtils.byId || function(id) { return document.getElementById(id); };
  var formatMoney = GNUtils.formatMoney || function(value) {
    var num = parseFloat(value || 0) || 0;
    return 'USD ' + num.toFixed(2);
  };
  var escapeHtml = GNUtils.escapeHtml || function(value) { return String(value || ''); };

  var itemsCotizacionActual = [];

  function obtenerFechaHoy() {
    var hoy = new Date();
    return hoy.getFullYear()
      + '-' + String(hoy.getMonth() + 1).padStart(2, '0')
      + '-' + String(hoy.getDate()).padStart(2, '0');
  }

  async function inicializarCotizaciones() {
    var fechaInput = byId('cot-fecha');
    if (fechaInput && !fechaInput.value) {
      fechaInput.value = obtenerFechaHoy();
    }

    await actualizarSelectServicios();
    await actualizarSelectClientesCotizacion();
    renderItemsCotizacion();
    await renderCotizacionesGuardadas();
  }

  async function obtenerCotizaciones() {
    if (typeof window.getData !== 'function') return [];
    var key = window.STORAGE_KEYS && window.STORAGE_KEYS.COTIZACIONES ? window.STORAGE_KEYS.COTIZACIONES : 'cotizaciones';
    var rows = await window.getData(key);
    return Array.isArray(rows) ? rows : [];
  }

  async function actualizarSelectClientesCotizacion() {
    var select = byId('cot-cliente');
    if (!select || typeof window.obtenerClientes !== 'function') return;

    var clientes = await window.obtenerClientes();
    var current = select.value;
    select.innerHTML = '<option value="">Selecciona un cliente</option>';

    clientes.forEach(function(cliente) {
      var opt = document.createElement('option');
      opt.value = cliente.id;
      opt.textContent = cliente.nombre || cliente.nombre_comercial || 'Cliente';
      select.appendChild(opt);
    });

    if (current) select.value = current;
  }

  async function actualizarSelectServicios() {
    var select = byId('cot-item-servicio');
    if (!select || typeof window.obtenerServicios !== 'function') return;

    var servicios = await window.obtenerServicios();
    var current = select.value;
    select.innerHTML = '<option value="">Selecciona un servicio</option>';

    servicios.forEach(function(servicio) {
      var opt = document.createElement('option');
      opt.value = servicio.id;
      opt.textContent = (servicio.codigo || 'SRV') + ' — ' + (servicio.descripcion || servicio.nombre || 'Servicio');
      opt.dataset.precio = String(parseFloat(servicio.precio || 0) || 0);
      opt.dataset.unidad = servicio.unidad || 'und';
      opt.dataset.itbms = parseInt(servicio.itbms, 10) === 1 ? '1' : '0';
      select.appendChild(opt);
    });

    if (current) select.value = current;
  }

  function cargarPrecioServicio() {
    var select = byId('cot-item-servicio');
    var precioInput = byId('cot-item-precio-manual');
    var unidadInput = byId('cot-item-unidad-manual');
    var itbmsInput = byId('cot-item-itbms-manual');

    if (!select) return;

    var option = select.options[select.selectedIndex];
    if (!option) return;

    if (precioInput && option.dataset.precio) precioInput.value = option.dataset.precio;
    if (unidadInput && option.dataset.unidad) unidadInput.value = option.dataset.unidad;
    if (itbmsInput && option.dataset.itbms) itbmsInput.value = option.dataset.itbms;
  }

  async function actualizarInfoCliente() {
    return await actualizarSelectClientesCotizacion();
  }

  function recalcularTotalesCotizacion() {
    var subtotal = itemsCotizacionActual.reduce(function(acc, item) {
      return acc + ((parseFloat(item.cantidad || 0) || 0) * (parseFloat(item.precio || 0) || 0));
    }, 0);

    var itbms = itemsCotizacionActual.reduce(function(acc, item) {
      var base = (parseFloat(item.cantidad || 0) || 0) * (parseFloat(item.precio || 0) || 0);
      return acc + (parseInt(item.itbms, 10) === 1 ? base * 0.07 : 0);
    }, 0);

    var descuento = parseFloat((byId('cot-descuento-monto') || {}).value || 0) || 0;
    var total = Math.max(0, subtotal + itbms - descuento);

    if (byId('cot-subtotal')) byId('cot-subtotal').textContent = formatMoney(subtotal);
    if (byId('cot-itbms-monto')) byId('cot-itbms-monto').textContent = formatMoney(itbms);
    if (byId('cot-total')) byId('cot-total').textContent = formatMoney(total);

    return {
      subtotal: subtotal,
      itbms: itbms,
      descuento: descuento,
      total: total
    };
  }

  function renderItemsCotizacion() {
    var tbody = byId('tbodyItemsCotizacion');
    if (!tbody) {
      recalcularTotalesCotizacion();
      return;
    }

    if (!itemsCotizacionActual.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay ítems agregados</td></tr>';
      recalcularTotalesCotizacion();
      return;
    }

    tbody.innerHTML = itemsCotizacionActual.map(function(item, index) {
      var cantidad = parseFloat(item.cantidad || 0) || 0;
      var precio = parseFloat(item.precio || 0) || 0;
      var total = cantidad * precio;

      return ''
        + '<tr>'
        + '<td>' + escapeHtml(item.descripcion || 'Servicio') + '</td>'
        + '<td>' + escapeHtml(item.unidad || 'und') + '</td>'
        + '<td>' + escapeHtml(String(cantidad)) + '</td>'
        + '<td>' + formatMoney(precio) + '</td>'
        + '<td>' + (parseInt(item.itbms, 10) === 1 ? 'Sí' : 'No') + '</td>'
        + '<td>'
        + formatMoney(total)
        + ' <button type="button" class="btn-table danger" onclick="eliminarItemCotizacion(' + index + ')">Eliminar</button>'
        + '</td>'
        + '</tr>';
    }).join('');

    recalcularTotalesCotizacion();
  }

  function agregarItemDesdeCatalogo() {
    var select = byId('cot-item-servicio');
    var cantidad = parseFloat((byId('cot-item-cantidad-catalogo') || {}).value || 0) || 0;

    if (!select || !select.value || cantidad <= 0) {
      window.alert('Selecciona un servicio y una cantidad válida.');
      return;
    }

    var option = select.options[select.selectedIndex];
    itemsCotizacionActual.push({
      servicio_id: select.value,
      descripcion: option ? option.textContent : 'Servicio',
      unidad: option && option.dataset.unidad ? option.dataset.unidad : 'und',
      cantidad: cantidad,
      precio: option && option.dataset.precio ? parseFloat(option.dataset.precio) : 0,
      itbms: option && option.dataset.itbms ? parseInt(option.dataset.itbms, 10) : 1
    });

    if (byId('cot-item-cantidad-catalogo')) byId('cot-item-cantidad-catalogo').value = '';
    renderItemsCotizacion();
  }

  function agregarItemManual() {
    var descripcion = ((byId('cot-item-desc-manual') || {}).value || '').trim();
    var unidad = ((byId('cot-item-unidad-manual') || {}).value || 'und').trim() || 'und';
    var cantidad = parseFloat((byId('cot-item-cantidad-manual') || {}).value || 0) || 0;
    var precio = parseFloat((byId('cot-item-precio-manual') || {}).value || 0) || 0;
    var itbms = parseInt((byId('cot-item-itbms-manual') || {}).value || 1, 10);

    if (!descripcion || cantidad <= 0 || precio <= 0) {
      window.alert('Completa descripción, cantidad y precio válidos.');
      return;
    }

    itemsCotizacionActual.push({
      servicio_id: null,
      descripcion: descripcion,
      unidad: unidad,
      cantidad: cantidad,
      precio: precio,
      itbms: itbms === 1 ? 1 : 0
    });

    ['cot-item-desc-manual', 'cot-item-unidad-manual', 'cot-item-cantidad-manual', 'cot-item-precio-manual'].forEach(function(id) {
      var field = byId(id);
      if (field) field.value = '';
    });

    renderItemsCotizacion();
  }

  function eliminarItemCotizacion(index) {
    itemsCotizacionActual.splice(index, 1);
    renderItemsCotizacion();
  }

  async function renderCotizacionesGuardadas() {
    var tbody = byId('tbodyCotizaciones');
    if (!tbody) return;

    var rows = await obtenerCotizaciones();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay cotizaciones registradas</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function(row) {
      return ''
        + '<tr>'
        + '<td>' + escapeHtml(row.codigo || row.id || '-') + '</td>'
        + '<td>' + escapeHtml(row.proyecto || row.titulo || '-') + '</td>'
        + '<td>' + escapeHtml(row.estado || 'borrador') + '</td>'
        + '<td>' + escapeHtml(row.fecha || '-') + '</td>'
        + '<td>' + formatMoney(row.total || 0) + '</td>'
        + '<td>En migración</td>'
        + '</tr>';
    }).join('');
  }

  async function guardarCotizacion() {
    window.alert('El guardado completo de cotizaciones se reconectará en la siguiente fase de migración.');
    return false;
  }

  function vistaPreviaCotizacion() {
    recalcularTotalesCotizacion();
    window.alert('Vista previa temporal disponible después de completar la migración de cotizaciones.');
  }

  function limpiarCotizacion() {
    itemsCotizacionActual = [];

    ['cot-proyecto', 'cot-atencion', 'cot-alcance', 'cot-descuento', 'cot-descuento-monto'].forEach(function(id) {
      var field = byId(id);
      if (field) field.value = '';
    });

    if (byId('cot-cliente')) byId('cot-cliente').value = '';
    if (byId('cot-item-servicio')) byId('cot-item-servicio').value = '';
    renderItemsCotizacion();
  }

  window.itemsCotizacionActual = itemsCotizacionActual;
  window.inicializarCotizaciones = inicializarCotizaciones;
  window.obtenerCotizaciones = obtenerCotizaciones;
  window.actualizarSelectServicios = actualizarSelectServicios;
  window.actualizarInfoCliente = actualizarInfoCliente;
  window.cargarPrecioServicio = cargarPrecioServicio;
  window.renderItemsCotizacion = renderItemsCotizacion;
  window.agregarItemDesdeCatalogo = agregarItemDesdeCatalogo;
  window.agregarItemManual = agregarItemManual;
  window.eliminarItemCotizacion = eliminarItemCotizacion;
  window.renderCotizacionesGuardadas = renderCotizacionesGuardadas;
  window.guardarCotizacion = guardarCotizacion;
  window.vistaPreviaCotizacion = vistaPreviaCotizacion;
  window.limpiarCotizacion = limpiarCotizacion;
})(window, document);
