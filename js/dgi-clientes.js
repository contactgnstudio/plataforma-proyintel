// ============================================================
// js/dgi-clientes.js — Búsqueda de Contribuyentes DGI Panamá
// Integración con portal DGI / MEF via proxy CORS
// GN Studio OS v2.5
// ============================================================
// La API directa de api.mef.gob.pa no tiene DNS público válido
// y etax2.mef.gob.pa bloquea peticiones cross-origin (CORS).
// Solución: pasar las llamadas por un proxy CORS (allorigins.win)
// que actúa de intermediario y devuelve la respuesta sin restricciones.
// ============================================================

(function (window, document) {
  'use strict';

  var byId = function (id) { return document.getElementById(id); };

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(type, title, message) {
    if (window.showToast) window.showToast({ type: type, title: title, message: message });
    else console.log('[' + type + '] ' + title + ': ' + message);
  }

  // ============================================================
  // Proxy CORS — envuelve cualquier URL para evitar bloqueos
  // allorigins.win retorna { contents: "...", status: {...} }
  // ============================================================
  var CORS_PROXY = 'https://api.allorigins.win/get?url=';

  // Endpoint DGI real (portal e-Tax MEF)
  var DGI_PORTAL = 'https://etax2.mef.gob.pa/esb/portaltrib/consultaRucService';

  // ============================================================
  // Buscar contribuyente en la DGI via proxy CORS
  // query puede ser RUC (ej: 8-123-456) o nombre/razón social
  // ============================================================
  async function buscarEnDGI(query) {
    if (!query || query.trim().length < 2) return [];
    var q = query.trim();

    // Detectar si es RUC (contiene guiones o solo dígitos)
    var esRuc = /^[\d-]+$/.test(q);
    var paramKey = esRuc ? 'ruc' : 'nombre';

    // URL destino real en DGI
    var targetUrl = DGI_PORTAL + '?' + paramKey + '=' + encodeURIComponent(q);

    // URL proxificada
    var proxyUrl = CORS_PROXY + encodeURIComponent(targetUrl);

    try {
      var resp = await fetch(proxyUrl, { method: 'GET' });
      if (!resp.ok) throw new Error('Proxy HTTP ' + resp.status);

      var wrapper = await resp.json();
      // allorigins devuelve { contents: "<respuesta del servidor>" }
      var contents = wrapper && wrapper.contents ? wrapper.contents : null;
      if (!contents) return _resultadoVacio();

      // Intentar parsear como JSON
      var data;
      try { data = JSON.parse(contents); } catch (e) { data = null; }

      if (!data) return _resultadoVacio();

      var lista = Array.isArray(data) ? data : (data.data || data.contribuyentes || data.results || []);

      if (!lista.length) return _resultadoVacio();

      return lista.map(function (item) {
        return {
          ruc:               item.ruc || item.numero_ruc || '',
          dv:                item.dv || item.digito_verificador || '',
          nombre:            item.nombre || item.razon_social || item.nombre_razon_social || '',
          tipo_contribuyente: item.tipo || item.tipo_contribuyente || item.tipo_persona || '',
          nombre_comercial:  item.nombre_comercial || item.nombre_fantasia || '',
          estado:            item.estado || item.estado_contribuyente || 'Activo',
          actividad:         item.actividad || item.actividad_economica || ''
        };
      });

    } catch (e) {
      console.warn('[DGI] Error consultando vía proxy:', e);
      return [];
    }
  }

  function _resultadoVacio() { return []; }

  // ============================================================
  // MODAL DE BÚSQUEDA DGI
  // ============================================================
  function abrirModalDGI() {
    var existing = byId('gn-modal-dgi');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'gn-modal-dgi';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';

    modal.innerHTML = [
      '<div style="background:#111E17;border-radius:14px;padding:32px;width:100%;max-width:680px;max-height:88vh;overflow-y:auto;border:1px solid rgba(197,162,83,0.2);">',
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">',
          '<div>',
            '<h3 style="margin:0;color:#F0F0F5;font-size:18px;"><i class="ph ph-magnifying-glass"></i> Buscar en DGI Panamá</h3>',
            '<p style="margin:4px 0 0;color:#8FAB9A;font-size:12px;">Consulta el RUC o nombre en la base de datos pública de la DGI / MEF</p>',
          '</div>',
          '<button type="button" id="dgi-modal-close" style="background:none;border:none;color:#9CA3AF;font-size:24px;cursor:pointer;">&#x2715;</button>',
        '</div>',
        '<div style="margin:20px 0 16px;display:flex;gap:10px;">',
          '<input id="dgi-buscar-input" type="text" placeholder="Ej: 8-123-4567 o Nombre empresa" style="flex:1;padding:10px 14px;background:#0D1611;border:1px solid rgba(197,162,83,0.3);border-radius:8px;color:#F0F0F5;font-size:14px;outline:none;" />',
          '<button id="dgi-btn-buscar" style="padding:10px 20px;background:#C5A253;border:none;border-radius:8px;color:#111;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="ph ph-magnifying-glass"></i> Buscar</button>',
        '</div>',
        '<div id="dgi-resultados">',
          '<div style="text-align:center;padding:24px;color:#8FAB9A;font-size:13px;"><i class="ph ph-info" style="font-size:20px;display:block;margin-bottom:8px;"></i>Ingresa un RUC o nombre para buscar contribuyentes registrados en la DGI.</div>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);

    byId('dgi-modal-close').addEventListener('click', cerrarModalDGI);
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrarModalDGI(); });

    var inp = byId('dgi-buscar-input');
    var btn = byId('dgi-btn-buscar');

    btn.addEventListener('click', function () { _ejecutarBusqueda(); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') _ejecutarBusqueda(); });

    setTimeout(function () { if (inp) inp.focus(); }, 100);
  }

  function cerrarModalDGI() {
    var m = byId('gn-modal-dgi');
    if (m) m.remove();
  }

  async function _ejecutarBusqueda() {
    var inp = byId('dgi-buscar-input');
    var resultados = byId('dgi-resultados');
    if (!inp || !resultados) return;

    var q = inp.value.trim();
    if (!q) { toast('warning', 'Ingresa un término', 'Escribe un RUC o nombre para buscar.'); return; }

    resultados.innerHTML = '<div style="text-align:center;padding:24px;color:#8FAB9A;"><i class="ph ph-spinner" style="animation:spin 1s linear infinite;font-size:24px;display:block;margin-bottom:8px;"></i>Consultando DGI...</div>';

    var lista = await buscarEnDGI(q);

    if (!lista || !lista.length) {
      resultados.innerHTML = '<div style="text-align:center;padding:24px;color:#F87171;font-size:13px;">'
        + '<i class="ph ph-warning" style="font-size:24px;display:block;margin-bottom:8px;"></i>'
        + 'No se encontraron contribuyentes con ese término.<br>'
        + '<span style="color:#8FAB9A;font-size:12px;margin-top:8px;display:block;">Verifica el RUC o prueba con el nombre exacto.</span>'
        + '</div>';
      return;
    }

    var html = '<div style="font-size:12px;color:#8FAB9A;margin-bottom:12px;">' + lista.length + ' resultado(s) encontrado(s)</div>';
    html += '<div style="display:flex;flex-direction:column;gap:10px;">';

    lista.forEach(function (item, i) {
      var rucCompleto = item.ruc + (item.dv ? '-' + item.dv : '');
      var estadoColor = (item.estado || '').toLowerCase().includes('activ') ? '#2D8B5E' : '#F87171';

      html += '<div style="background:#0D1611;border:1px solid rgba(18,53,36,0.4);border-radius:10px;padding:16px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">';
      html += '<div style="flex:1;">';
      html += '<div style="font-weight:700;color:#F0F0F5;font-size:14px;margin-bottom:4px;">' + esc(item.nombre) + '</div>';
      if (item.nombre_comercial) html += '<div style="font-size:12px;color:#C5A253;margin-bottom:4px;">' + esc(item.nombre_comercial) + '</div>';
      html += '<div style="font-size:12px;color:#8FAB9A;">';
      html += '<span style="margin-right:12px;"><i class="ph ph-identification-card"></i> RUC: <strong style="color:#C5A253;">' + esc(rucCompleto) + '</strong></span>';
      html += '<span style="margin-right:12px;"><i class="ph ph-user"></i> ' + esc(item.tipo_contribuyente || '—') + '</span>';
      if (item.actividad) html += '<span><i class="ph ph-briefcase"></i> ' + esc(item.actividad) + '</span>';
      html += '</div>';
      html += '<div style="margin-top:6px;">';
      html += '<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:' + estadoColor + '22;color:' + estadoColor + ';">' + esc(item.estado || 'Activo') + '</span>';
      html += '</div>';
      html += '</div>';
      html += '<button class="dgi-btn-agregar" data-idx="' + i + '" style="padding:8px 14px;background:rgba(197,162,83,0.15);border:1px solid rgba(197,162,83,0.3);border-radius:8px;color:#C5A253;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;"><i class="ph ph-star"></i> Guardar</button>';
      html += '</div>';
    });

    html += '</div>';
    resultados.innerHTML = html;

    window._dgiResultados = lista;

    var btns = document.querySelectorAll('.dgi-btn-agregar');
    Array.prototype.forEach.call(btns, function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.dataset.idx);
        _guardarClienteDGI(window._dgiResultados[idx], btn);
      });
    });
  }

  // ============================================================
  // GUARDAR CLIENTE DGI EN SUPABASE
  // ============================================================
  async function _guardarClienteDGI(item, btnEl) {
    if (!item) return;
    try {
      if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Guardando...'; }

      var userId = null;
      if (typeof window.getSessionUserId === 'function') userId = await window.getSessionUserId();

      var payload = {
        user_id:           userId,
        nombre:            item.nombre || '',
        nombre_comercial:  item.nombre_comercial || '',
        ruc:               item.ruc || '',
        dv:                item.dv || '',
        tipo_contribuyente: item.tipo_contribuyente || '',
        actividad:         item.actividad || '',
        tipo:              'activo',
        fuente:            'dgi',
        notas:             'Importado desde DGI Panamá'
      };

      var CLIENTES_TABLE = (window.STORAGE_KEYS && window.STORAGE_KEYS.CLIENTES) ? window.STORAGE_KEYS.CLIENTES : 'clientes';

      var resultado = null;
      if (typeof window.addItem === 'function') {
        resultado = await window.addItem(CLIENTES_TABLE, payload);
      }

      if (resultado) {
        toast('success', '¡Cliente guardado!', item.nombre + ' fue agregado a tus clientes.');
        if (btnEl) { btnEl.style.background = 'rgba(45,139,94,0.2)'; btnEl.style.color = '#2D8B5E'; btnEl.style.borderColor = '#2D8B5E'; btnEl.innerHTML = '<i class="ph ph-check"></i> Guardado'; }
        if (typeof window.renderClientes === 'function') window.renderClientes();
        if (typeof window.actualizarSelectClientes === 'function') window.actualizarSelectClientes();
      } else {
        toast('error', 'Error', 'No se pudo guardar el cliente.');
        if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = '<i class="ph ph-star"></i> Guardar'; }
      }
    } catch (e) {
      console.error('[DGI] Error guardando cliente:', e);
      toast('error', 'Error', 'Error al guardar: ' + (e.message || e));
      if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = '<i class="ph ph-star"></i> Guardar'; }
    }
  }

  // ============================================================
  // EXPONER
  // ============================================================
  window.abrirModalDGI = abrirModalDGI;
  window.cerrarModalDGI = cerrarModalDGI;
  window.buscarEnDGI = buscarEnDGI;

})(window, document);
