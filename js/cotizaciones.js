// ============================================================
// js/cotizaciones.js — Módulo de Cotizaciones (GN Studio OS v2.3)
// Integrado con Supabase: usa columnas existentes (numero, fecha_emision, items JSONB)
// ============================================================

(function(window, document) {
  'use strict';

  var byId = function(id) { return document.getElementById(id); };

  var STORAGE_KEYS = window.STORAGE_KEYS || { COTIZACIONES: 'cotizaciones' };

  function log(level, msg, meta) {
    if (window.GNUtils && typeof window.GNUtils.log === 'function') {
      window.GNUtils.log(level, msg, meta); return;
    }
    if (meta !== undefined) { console[level] ? console[level](msg, meta) : console.log(msg, meta); return; }
    console[level] ? console[level](msg) : console.log(msg);
  }

  // ============================================================
  // Helpers
  // ============================================================
  async function getDataFiltered(tableName, filters, options) {
    if (typeof window.getDataFiltered === 'function') return await window.getDataFiltered(tableName, filters, options);
    return [];
  }

  async function addItem(tableName, item) {
    if (typeof window.addItem === 'function') return await window.addItem(tableName, item);
    return null;
  }

  async function updateItem(tableName, id, changes) {
    if (typeof window.updateItem === 'function') return await window.updateItem(tableName, id, changes);
    return false;
  }

  async function findItem(tableName, id) {
    if (typeof window.findItem === 'function') return await window.findItem(tableName, id);
    return null;
  }

  async function getSessionUserId() {
    if (typeof window.getSessionUserId === 'function') return await window.getSessionUserId();
    var sb = window.supabaseClient || null;
    if (!sb) return null;
    try { var session = await sb.auth.getSession(); return session && session.data && session.data.session ? session.data.session.user.id : null; }
    catch (e) { return null; }
  }

  function parseMonto(value) { return parseFloat(value || 0) || 0; }

  function money(value) {
    var n = parseMonto(value);
    if (typeof window.formatMoney === 'function') return window.formatMoney(n);
    return 'USD ' + n.toFixed(2);
  }

  function generarNumeroCotizacion() {
    var now = new Date();
    var y = String(now.getFullYear()).slice(-2);
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var rand = Math.floor(1000 + Math.random() * 9000);
    return 'COT-' + d + m + y + '-' + rand;
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ============================================================
  // Crear cotización en Supabase vinculada a proyecto
  // Usa columnas: numero, fecha_emision, items (JSONB), proyecto_id
  // ============================================================
  async function crearCotizacionDesdeProforma(datosProforma) {
    try {
      var numero = generarNumeroCotizacion();
      var now = new Date().toISOString();
      var userId = await getSessionUserId();

      var payload = {
        user_id: userId,
        proyecto_id: datosProforma.proyectoId || null,
        numero: numero,
        cliente_id: datosProforma.clienteId || null,
        cliente_nombre: datosProforma.clienteNombre || 'Cliente',
        fecha_emision: datosProforma.fecha || now.slice(0, 10),
        fecha_vencimiento: null,
        titulo: datosProforma.nombreProyecto || 'Cotización',
        nombre_proyecto: datosProforma.nombreProyecto || '',
        descripcion: datosProforma.alcanceHtml || '',
        alcance: datosProforma.alcanceHtml || '',
        atencion: datosProforma.clienteNombre || '',
        items: JSON.stringify(datosProforma.items || []),
        subtotal: parseMonto(datosProforma.subtotal || 0),
        itbms: parseMonto(datosProforma.itbms || 0),
        total: parseMonto(datosProforma.total || 0),
        descuento: 0,
        estado: 'cotizado',
        notas: '',
        notas_internas: ''
      };

      var cotizacion = await addItem(STORAGE_KEYS.COTIZACIONES, payload);

      if (!cotizacion) {
        log('error', 'No se pudo crear la cotización en Supabase');
        return null;
      }

      if (window.showToast) {
        window.showToast({
          type: 'success',
          title: 'Cotización creada',
          message: 'La cotización ' + numero + ' se guardó en Supabase vinculada al proyecto.'
        });
      }

      return cotizacion;
    } catch (error) {
      log('error', 'Error creando cotización desde proforma', error);
      if (window.showToast) {
        window.showToast({ type: 'error', title: 'Error al crear cotización', message: 'No se pudo guardar la cotización. Revisa la conexión.' });
      }
      return null;
    }
  }

  // ============================================================
  // Obtener cotización completa con items
  // ============================================================
  async function obtenerCotizacionCompleta(cotizacionId) {
    if (!cotizacionId) return null;
    try {
      var cot = await findItem(STORAGE_KEYS.COTIZACIONES, cotizacionId);
      if (!cot) return null;

      // Extraer items desde JSONB
      var items = [];
      try {
        if (cot.items) { items = typeof cot.items === 'string' ? JSON.parse(cot.items) : cot.items; }
      } catch (e) { items = []; }

      return {
        id: cot.id,
        numero: cot.numero || '',
        clienteNombre: cot.cliente_nombre || cot.atencion || 'Cliente',
        fecha: cot.fecha_emision || cot.fecha || '',
        nombreProyecto: cot.nombre_proyecto || cot.titulo || '',
        alcance: cot.alcance || cot.descripcion || '',
        subtotal: parseMonto(cot.subtotal),
        itbms: parseMonto(cot.itbms),
        total: parseMonto(cot.total),
        estado: cot.estado || 'cotizado',
        items: Array.isArray(items) ? items : [],
        raw: cot
      };
    } catch (error) {
      log('error', 'Error obteniendo cotización completa', error);
      return null;
    }
  }

  // ============================================================
  // Render de cotización en formato profesional (para Documentos)
  // ============================================================
  async function renderCotizacionDocumento(containerId, cotizacionId) {
    var container = byId(containerId);
    if (!container) return;

    if (!cotizacionId) {
      container.innerHTML = '<div class="empty-state">No hay cotización asociada a este proyecto.</div>';
      return;
    }

    var cot = await obtenerCotizacionCompleta(cotizacionId);
    if (!cot) {
      container.innerHTML = '<div class="empty-state">No se encontró la cotización.</div>';
      return;
    }

    // Formato de fecha
    var fechaStr = cot.fecha || '';
    if (fechaStr) {
      var parts = fechaStr.split('-');
      if (parts.length === 3) { fechaStr = parts[2] + '/' + parts[1] + '/' + parts[0]; }
    }

    // Items HTML
    var itemsHtml = '';
    var subtotalItems = 0;
    var itbmsItems = 0;

    if (cot.items && cot.items.length) {
      itemsHtml += '<table class="cot-doc-items-table">';
      itemsHtml += '<thead><tr><th>Descripción</th><th>Unidad</th><th>Cant.</th><th>Precio Unit.</th><th>Total</th></tr></thead>';
      itemsHtml += '<tbody>';

      for (var i = 0; i < cot.items.length; i++) {
        var item = cot.items[i];
        var cant = parseMonto(item.cantidad || item.cantidad || 0);
        var precio = parseMonto(item.precio_unitario || item.precio || 0);
        var totalItem = parseMonto(item.total || item.subtotal || 0);
        var unidad = item.unidad || 'und';
        var desc = item.descripcion || 'Servicio';

        subtotalItems += totalItem;
        if (item.itbms || item.aplica_itbms) { itbmsItems += totalItem * 0.07; }

        itemsHtml += '<tr>';
        itemsHtml += '<td>' + esc(desc) + '</td>';
        itemsHtml += '<td style="text-align:center;">' + esc(unidad) + '</td>';
        itemsHtml += '<td style="text-align:center;">' + cant + '</td>';
        itemsHtml += '<td style="text-align:right;">' + money(precio) + '</td>';
        itemsHtml += '<td style="text-align:right;font-weight:600;">' + money(totalItem) + '</td>';
        itemsHtml += '</tr>';
      }

      itemsHtml += '</tbody></table>';
    }

    // Totales
    var subtotal = cot.subtotal > 0 ? cot.subtotal : subtotalItems;
    var itbms = cot.itbms > 0 ? cot.itbms : itbmsItems;
    var total = cot.total > 0 ? cot.total : (subtotal + itbms);

    var html = '';
    html += '<div class="cot-doc-container">';

    // Header
    html += '<div class="cot-doc-header">';
    html += '<div class="cot-doc-logo-area">';
    html += '<div class="cot-doc-logo">GN Studio</div>';
    html += '<div class="cot-doc-tagline">Diseño · Desarrollo · Branding</div>';
    html += '</div>';
    html += '<div class="cot-doc-info">';
    html += '<div class="cot-doc-label">COTIZACIÓN</div>';
    html += '<div class="cot-doc-codigo">' + esc(cot.numero) + '</div>';
    html += '<div class="cot-doc-fecha">Fecha: ' + esc(fechaStr) + '</div>';
    html += '</div>';
    html += '</div>';

    // Cliente
    html += '<div class="cot-doc-cliente">';
    html += '<div class="cot-doc-section-title">Atención:</div>';
    html += '<div class="cot-doc-cliente-nombre">' + esc(cot.clienteNombre) + '</div>';
    html += '<div class="cot-doc-proyecto-nombre">' + esc(cot.nombreProyecto) + '</div>';
    html += '</div>';

    // Alcance
    if (cot.alcance) {
      html += '<div class="cot-doc-alcance">';
      html += '<div class="cot-doc-section-title">Alcance de Trabajos:</div>';
      html += '<div class="cot-doc-alcance-content">' + cot.alcance + '</div>';
      html += '</div>';
    }

    // Items
    if (itemsHtml) {
      html += '<div class="cot-doc-items">';
      html += '<div class="cot-doc-section-title">Propuesta Económica:</div>';
      html += itemsHtml;
      html += '</div>';
    }

    // Totales
    html += '<div class="cot-doc-totales">';
    html += '<div class="cot-doc-total-row"><span>Subtotal:</span><span>' + money(subtotal) + '</span></div>';
    if (itbms > 0) {
      html += '<div class="cot-doc-total-row"><span>ITBMS (7%):</span><span>' + money(itbms) + '</span></div>';
    }
    html += '<div class="cot-doc-total-row cot-doc-grand-total"><span>TOTAL:</span><span>' + money(total) + '</span></div>';
    html += '</div>';

    // Footer
    html += '<div class="cot-doc-footer">';
    html += '<div class="cot-doc-footer-info">';
    html += '<span><i class="ph ph-phone"></i> 6534-2794 / 6894-7758</span>';
    html += '<span><i class="ph ph-envelope"></i> contact@gnstudio.space</span>';
    html += '<span><i class="ph ph-instagram-logo"></i> @contact.gnstudio</span>';
    html += '</div>';
    html += '<div class="cot-doc-footer-banco">';
    html += 'Transferencias a GN Studio, Banco General, Cuenta de Ahorro 04-72-96-352240-4';
    html += '</div>';
    html += '<div class="cot-doc-footer-gracias">¡Gracias por su confianza!</div>';
    html += '</div>';

    html += '</div>';

    container.innerHTML = html;
  }

  // ============================================================
  // Exponer funciones
  // ============================================================
  window.crearCotizacionDesdeProforma = crearCotizacionDesdeProforma;
  window.obtenerCotizacionCompleta = obtenerCotizacionCompleta;
  window.renderCotizacionDocumento = renderCotizacionDocumento;
  window.generarNumeroCotizacion = generarNumeroCotizacion;

})(window, document);
