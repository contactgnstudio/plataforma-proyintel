// ============================================================
// js/cotizaciones.js — Módulo de Cotizaciones (GN Studio OS v2.3)
// Integrado con Supabase: tabla cotizaciones + cotizacion_items
// ============================================================

(function(window, document) {
  'use strict';

  var byId = function(id) { return document.getElementById(id); };

  var STORAGE_KEYS = window.STORAGE_KEYS || {
    COTIZACIONES: 'cotizaciones',
    COTIZACION_ITEMS: 'cotizacion_items'
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

  async function getCotizacionItems(cotizacionId) {
    if (!cotizacionId) return [];
    if (typeof window.obtenerItemsCotizacion === 'function') {
      return await window.obtenerItemsCotizacion(cotizacionId);
    }
    if (typeof window.getDataFiltered === 'function') {
      return await window.getDataFiltered(STORAGE_KEYS.COTIZACION_ITEMS, { cotizacion_id: cotizacionId }, { orderBy: 'orden', ascending: true });
    }
    return [];
  }

  async function getCotizacionPorProyecto(proyectoId) {
    if (!proyectoId) return null;
    if (typeof window.obtenerCotizacionProyecto === 'function') {
      return await window.obtenerCotizacionProyecto(proyectoId);
    }
    var rows = await getDataFiltered(STORAGE_KEYS.COTIZACIONES, { proyecto_id: proyectoId }, { orderBy: 'created_at', ascending: false });
    return rows && rows.length ? rows[0] : null;
  }

  async function getDataFiltered(tableName, filters, options) {
    if (typeof window.getDataFiltered === 'function') {
      return await window.getDataFiltered(tableName, filters, options);
    }
    return [];
  }

  async function addItem(tableName, item) {
    if (typeof window.addItem === 'function') {
      return await window.addItem(tableName, item);
    }
    return null;
  }

  async function updateItem(tableName, id, changes) {
    if (typeof window.updateItem === 'function') {
      return await window.updateItem(tableName, id, changes);
    }
    return false;
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

  function money(value) {
    var n = parseMonto(value);
    if (typeof window.formatMoney === 'function') return window.formatMoney(n);
    return 'USD ' + n.toFixed(2);
  }

  // ============================================================
  // Crear cotización en Supabase vinculada a proyecto
  // ============================================================
  async function crearCotizacionDesdeProforma(datosProforma) {
    try {
      // 1. Crear cotización principal en Supabase
      var codigo = generarCodigoCotizacion();
      var now = new Date().toISOString();

      var payloadCotizacion = {
        user_id: datosProforma.userId || null,
        proyecto_id: datosProforma.proyectoId || null,
        codigo: codigo,
        cliente_id: datosProforma.clienteId || null,
        cliente_nombre: datosProforma.clienteNombre || 'Cliente',
        fecha: datosProforma.fecha || now.slice(0, 10),
        nombre_proyecto: datosProforma.nombreProyecto || '',
        alcance: datosProforma.alcanceHtml || '',
        subtotal: parseMonto(datosProforma.subtotal || 0),
        itbms: parseMonto(datosProforma.itbms || 0),
        total: parseMonto(datosProforma.total || 0),
        estado: 'cotizado',
        items: JSON.stringify(datosProforma.items || []),
        created_at: now,
        updated_at: now
      };

      var cotizacion = await addItem(STORAGE_KEYS.COTIZACIONES, payloadCotizacion);

      if (!cotizacion) {
        log('error', 'No se pudo crear la cotización en Supabase');
        return null;
      }

      // 2. Crear items de cotización en tabla cotizacion_items
      var items = datosProforma.items || [];
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var payloadItem = {
          cotizacion_id: cotizacion.id,
          servicio_id: item.servicioId || null,
          descripcion: item.descripcion || 'Servicio',
          cantidad: parseMonto(item.cantidad || 0),
          precio_unitario: parseMonto(item.precio || 0),
          aplica_itbms: !!item.itbms,
          subtotal: parseMonto(item.total || 0),
          orden: i + 1,
          unidad: item.unidad || 'und',
          total: parseMonto(item.total || 0),
          user_id: datosProforma.userId || null
        };
        await addItem(STORAGE_KEYS.COTIZACION_ITEMS, payloadItem);
      }

      // 3. Actualizar proyecto con cotizacion_id
      if (datosProforma.proyectoId && typeof window.updateItem === 'function') {
        await updateItem('proyectos', datosProforma.proyectoId, {
          cotizacion_id: cotizacion.id
        });
      }

      if (typeof window.actualizarKPIs === 'function') {
        window.actualizarKPIs();
      }

      if (window.showToast) {
        window.showToast({
          type: 'success',
          title: 'Cotización creada',
          message: 'La cotización ' + codigo + ' se guardó en Supabase vinculada al proyecto.'
        });
      }

      return cotizacion;
    } catch (error) {
      log('error', 'Error creando cotización desde proforma', error);
      if (window.showToast) {
        window.showToast({
          type: 'error',
          title: 'Error al crear cotización',
          message: 'No se pudo guardar la cotización. Revisa la conexión.'
        });
      }
      return null;
    }
  }

  // ============================================================
  // Obtener cotización completa con items para mostrar
  // ============================================================
  async function obtenerCotizacionCompleta(cotizacionId) {
    if (!cotizacionId) return null;

    try {
      var cotizacion = await findItem(STORAGE_KEYS.COTIZACIONES, cotizacionId);
      if (!cotizacion) return null;

      var items = await getCotizacionItems(cotizacionId);

      return {
        id: cotizacion.id,
        codigo: cotizacion.codigo || '',
        clienteNombre: cotizacion.cliente_nombre || 'Cliente',
        fecha: cotizacion.fecha || '',
        nombreProyecto: cotizacion.nombre_proyecto || '',
        alcance: cotizacion.alcance || '',
        subtotal: parseMonto(cotizacion.subtotal),
        itbms: parseMonto(cotizacion.itbms),
        total: parseMonto(cotizacion.total),
        estado: cotizacion.estado || 'cotizado',
        items: items || [],
        raw: cotizacion
      };
    } catch (error) {
      log('error', 'Error obteniendo cotización completa', error);
      return null;
    }
  }

  async function findItem(tableName, id) {
    if (typeof window.findItem === 'function') {
      return await window.findItem(tableName, id);
    }
    return null;
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
      if (parts.length === 3) {
        fechaStr = parts[2] + '/' + parts[1] + '/' + parts[0];
      }
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
        if (item.aplica_itbms) {
          itbmsItems += totalItem * 0.07;
        }

        itemsHtml += '<tr>';
        itemsHtml += '<td>' + esc(desc) + '</td>';
        itemsHtml += '<td style="text-align:center;">' + esc(unidad) + '</td>';
        itemsHtml += '<td style="text-align:center;">' + cant + '</td>';
        itemsHtml += '<td style="text-align:right;">' + money(precio) + '</td>';
        itemsHtml += '<td style="text-align:right;font-weight:600;">' + money(totalItem) + '</td>';
        itemsHtml += '</tr>';
      }

      itemsHtml += '</tbody></table>';
    } else {
      // Si no hay items en tabla, usar los del JSONB
      var jsonItems = [];
      try {
        if (cot.raw && cot.raw.items) {
          jsonItems = typeof cot.raw.items === 'string' ? JSON.parse(cot.raw.items) : cot.raw.items;
        }
      } catch (e) { jsonItems = []; }

      if (jsonItems && jsonItems.length) {
        itemsHtml += '<table class="cot-doc-items-table">';
        itemsHtml += '<thead><tr><th>Descripción</th><th>Unidad</th><th>Cant.</th><th>Precio Unit.</th><th>Total</th></tr></thead>';
        itemsHtml += '<tbody>';

        for (var j = 0; j < jsonItems.length; j++) {
          var ji = jsonItems[j];
          var jCant = parseMonto(ji.cantidad || 0);
          var jPrecio = parseMonto(ji.precio || 0);
          var jTotal = parseMonto(ji.total || 0);
          var jUnidad = ji.unidad || 'und';
          var jDesc = ji.descripcion || 'Servicio';

          subtotalItems += jTotal;
          if (ji.itbms) {
            itbmsItems += jTotal * 0.07;
          }

          itemsHtml += '<tr>';
          itemsHtml += '<td>' + esc(jDesc) + '</td>';
          itemsHtml += '<td style="text-align:center;">' + esc(jUnidad) + '</td>';
          itemsHtml += '<td style="text-align:center;">' + jCant + '</td>';
          itemsHtml += '<td style="text-align:right;">' + money(jPrecio) + '</td>';
          itemsHtml += '<td style="text-align:right;font-weight:600;">' + money(jTotal) + '</td>';
          itemsHtml += '</tr>';
        }

        itemsHtml += '</tbody></table>';
      }
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
    html += '<div class="cot-doc-codigo">' + esc(cot.codigo) + '</div>';
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

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ============================================================
  // Exponer funciones
  // ============================================================
  window.crearCotizacionDesdeProforma = crearCotizacionDesdeProforma;
  window.obtenerCotizacionCompleta = obtenerCotizacionCompleta;
  window.renderCotizacionDocumento = renderCotizacionDocumento;
  window.generarCodigoCotizacion = generarCodigoCotizacion;

})(window, document);
