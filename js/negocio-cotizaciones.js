// ============================================================
// js/negocio-cotizaciones.js — Cotizaciones Independientes
// Sección: Negocio > Cotizaciones
// Funciones: Formulario, tabla con estados, Convertir en Proyecto
// GN Studio OS v2.4
// ============================================================

(function (window, document) {
  'use strict';

  /* ── helpers ── */
  var byId = function (id) { return document.getElementById(id); };

  function log(level, msg, meta) {
    if (window.GNUtils && typeof window.GNUtils.log === 'function') {
      window.GNUtils.log(level, msg, meta); return;
    }
    if (meta !== undefined) { console[level] ? console[level](msg, meta) : console.log(msg, meta); return; }
    console[level] ? console[level](msg) : console.log(msg);
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function money(v) {
    var n = parseFloat(v || 0) || 0;
    if (typeof window.formatMoney === 'function') return window.formatMoney(n);
    return 'USD ' + n.toFixed(2);
  }

  function parseMonto(v) { return parseFloat(v || 0) || 0; }

  async function getSessionUserId() {
    if (typeof window.getSessionUserId === 'function') return await window.getSessionUserId();
    var sb = window.supabaseClient || null;
    if (!sb) return null;
    try {
      var s = await sb.auth.getSession();
      return s && s.data && s.data.session ? s.data.session.user.id : null;
    } catch (e) { return null; }
  }

  async function addItem(table, item) {
    if (typeof window.addItem === 'function') return await window.addItem(table, item);
    return null;
  }

  async function updateItem(table, id, changes) {
    if (typeof window.updateItem === 'function') return await window.updateItem(table, id, changes);
    return false;
  }

  async function getDataFiltered(table, filters, options) {
    if (typeof window.getDataFiltered === 'function') return await window.getDataFiltered(table, filters, options);
    return [];
  }

  function toast(type, title, message) {
    if (window.showToast) window.showToast({ type: type, title: title, message: message });
  }

  /* ── estado local ── */
  var _cotizaciones = [];
  var _clientes = [];
  var _editandoId = null;
  var _items = [];   // filas de la propuesta económica

  /* ── generador de número ── */
  function generarNumero() {
    if (typeof window.generarNumeroCotizacion === 'function') return window.generarNumeroCotizacion();
    var now = new Date();
    var d = String(now.getDate()).padStart(2, '0');
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var y = String(now.getFullYear()).slice(-2);
    return 'COT-' + d + m + y + '-' + Math.floor(1000 + Math.random() * 9000);
  }

  // ============================================================
  // CARGA INICIAL
  // ============================================================
  async function iniciarModulo() {
    await cargarClientesSelect();
    await cargarCotizaciones();
    _bindFormulario();
    _bindBuscador();
  }

  async function cargarClientesSelect() {
    try {
      var rows = await getDataFiltered('clientes', [], { order: 'nombre', ascending: true });
      _clientes = Array.isArray(rows) ? rows : [];
    } catch (e) { _clientes = []; }

    var sel = byId('nc-cliente');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Selecciona cliente —</option>';
    _clientes.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nombre || c.razon_social || 'Sin nombre';
      sel.appendChild(opt);
    });
  }

  async function cargarCotizaciones() {
    try {
      var rows = await getDataFiltered('cotizaciones', [], { order: 'created_at', ascending: false });
      // Filtrar solo las que NO tienen proyecto_id (independientes)
      _cotizaciones = Array.isArray(rows)
        ? rows.filter(function (r) { return !r.proyecto_id; })
        : [];
    } catch (e) {
      log('error', '[NC] Error cargando cotizaciones', e);
      _cotizaciones = [];
    }
    renderTabla();
  }

  // ============================================================
  // RENDER TABLA
  // ============================================================
  var ESTADOS = {
    cotizado:   { label: 'Cotizado',   color: '#C5A253' },
    enviado:    { label: 'Enviado',    color: '#60A5FA' },
    aprobado:   { label: 'Aprobado',   color: '#2D8B5E' },
    rechazado:  { label: 'Rechazado', color: '#F87171' },
    convertido: { label: 'Convertido', color: '#8FAB9A' }
  };

  function badgeEstado(estado) {
    var e = ESTADOS[estado] || { label: estado, color: '#8FAB9A' };
    return '<span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;'
      + 'background:' + e.color + '22;color:' + e.color + ';">' + esc(e.label) + '</span>';
  }

  function renderTabla(filtro) {
    var tbody = byId('nc-tbody');
    if (!tbody) return;

    var lista = _cotizaciones;
    if (filtro) {
      var f = filtro.toLowerCase();
      lista = lista.filter(function (c) {
        return (c.numero || '').toLowerCase().includes(f)
          || (c.cliente_nombre || '').toLowerCase().includes(f)
          || (c.titulo || '').toLowerCase().includes(f);
      });
    }

    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gn-text-muted,#8FAB9A);">'
        + '<i class="ph ph-file-text" style="font-size:24px;display:block;margin-bottom:8px;"></i>'
        + 'No hay cotizaciones independientes aún.</td></tr>';
      return;
    }

    tbody.innerHTML = lista.map(function (c) {
      var estado = c.estado || 'cotizado';
      var esConvertido = estado === 'convertido';
      var btnConvertir = esConvertido
        ? '<span style="font-size:11px;color:var(--gn-text-muted,#8FAB9A);"><i class="ph ph-check"></i> Convertido</span>'
        : '<button class="btn-secondary" style="font-size:12px;padding:5px 10px;" onclick="ncConvertirEnProyecto(\'' + c.id + '\')" title="Convertir en Proyecto">'
          + '<i class="ph ph-arrow-square-out"></i> Convertir</button>';

      return '<tr>'
        + '<td><span style="font-family:monospace;font-size:12px;color:#C5A253;">' + esc(c.numero || '—') + '</span></td>'
        + '<td>' + esc(c.cliente_nombre || '—') + '</td>'
        + '<td>' + esc(c.titulo || c.nombre_proyecto || '—') + '</td>'
        + '<td style="text-align:right;font-weight:600;">' + money(c.total) + '</td>'
        + '<td>' + esc(c.fecha_emision || c.fecha || '—') + '</td>'
        + '<td style="text-align:center;">' + badgeEstado(estado) + '</td>'
        + '<td style="white-space:nowrap;">' + btnConvertir
        + ' <button class="btn-secondary" style="font-size:12px;padding:5px 10px;" onclick="ncEditarCotizacion(\'' + c.id + '\')"><i class="ph ph-pencil"></i></button>'
        + ' <button class="btn-secondary" style="font-size:12px;padding:5px 10px;color:#F87171;" onclick="ncEliminarCotizacion(\'' + c.id + '\')"><i class="ph ph-trash"></i></button>'
        + '</td>'
        + '</tr>';
    }).join('');
  }

  // ============================================================
  // FORMULARIO — ITEMS
  // ============================================================
  function renderItems() {
    var tbody = byId('nc-items-tbody');
    if (!tbody) return;

    if (!_items.length) {
      tbody.innerHTML = '<tr id="nc-items-empty"><td colspan="6" style="text-align:center;padding:12px;color:var(--gn-text-muted,#8FAB9A);font-size:13px;">Agrega ítems a la propuesta económica</td></tr>';
      _recalcular();
      return;
    }

    tbody.innerHTML = _items.map(function (it, i) {
      return '<tr>'
        + '<td><input class="nc-item-input" type="text" value="' + esc(it.descripcion) + '" placeholder="Descripción" oninput="ncItemChange(' + i + ',\'descripcion\',this.value)"></td>'
        + '<td><select class="nc-item-select" onchange="ncItemChange(' + i + ',\'unidad\',this.value)">'
        + ['und','hr','día','mes','pág','proy','paq'].map(function(u){ return '<option value="'+u+'"'+(it.unidad===u?' selected':'')+'>'+u+'</option>'; }).join('')
        + '</select></td>'
        + '<td><input class="nc-item-input" type="number" value="' + it.cantidad + '" min="0" step="0.01" style="width:70px;" oninput="ncItemChange(' + i + ',\'cantidad\',this.value)"></td>'
        + '<td><input class="nc-item-input" type="number" value="' + it.precio_unitario + '" min="0" step="0.01" style="width:100px;" oninput="ncItemChange(' + i + ',\'precio_unitario\',this.value)"></td>'
        + '<td><select class="nc-item-select" onchange="ncItemChange(' + i + ',\'aplica_itbms\',this.value)">'
        + '<option value="0"'+(it.aplica_itbms===0?' selected':'')+'>No</option>'
        + '<option value="1"'+(it.aplica_itbms===1?' selected':'')+'>Sí 7%</option>'
        + '</select></td>'
        + '<td style="text-align:right;font-weight:600;color:#C5A253;">' + money(it.total) + '</td>'
        + '<td><button type="button" class="btn-secondary" style="padding:4px 8px;color:#F87171;" onclick="ncEliminarItem(' + i + ')"><i class="ph ph-trash"></i></button></td>'
        + '</tr>';
    }).join('');

    _recalcular();
  }

  window.ncItemChange = function (idx, campo, valor) {
    if (!_items[idx]) return;
    if (campo === 'cantidad' || campo === 'precio_unitario') {
      _items[idx][campo] = parseMonto(valor);
    } else if (campo === 'aplica_itbms') {
      _items[idx].aplica_itbms = parseInt(valor);
    } else {
      _items[idx][campo] = valor;
    }
    _items[idx].total = _items[idx].cantidad * _items[idx].precio_unitario;
    renderItems();
  };

  window.ncEliminarItem = function (idx) {
    _items.splice(idx, 1);
    renderItems();
  };

  function _recalcular() {
    var subtotal = 0, itbms = 0;
    _items.forEach(function (it) {
      subtotal += it.total || 0;
      if (it.aplica_itbms) itbms += (it.total || 0) * 0.07;
    });
    var total = subtotal + itbms;
    var el = function(id){ return byId(id); };
    if (el('nc-subtotal')) el('nc-subtotal').textContent = money(subtotal);
    if (el('nc-itbms'))    el('nc-itbms').textContent    = money(itbms);
    if (el('nc-total'))    el('nc-total').textContent    = money(total);
  }

  // ============================================================
  // BIND BOTONES DEL FORMULARIO
  // ============================================================
  function _bindFormulario() {
    var btnAgregar = byId('nc-btn-agregar-item');
    if (btnAgregar) {
      btnAgregar.addEventListener('click', function () {
        _items.push({ descripcion: '', unidad: 'und', cantidad: 1, precio_unitario: 0, aplica_itbms: 0, total: 0 });
        renderItems();
      });
    }

    var btnCatalogo = byId('nc-btn-add-catalogo');
    if (btnCatalogo) {
      btnCatalogo.addEventListener('click', function () {
        var sel = byId('nc-select-catalogo');
        if (!sel || !sel.value) return;
        var opt = sel.options[sel.selectedIndex];
        var precio = parseMonto(opt.dataset.precio);
        var itbms  = parseInt(opt.dataset.itbms || '0');
        var unidad = opt.dataset.unidad || 'und';
        _items.push({ descripcion: opt.textContent.split('—')[0].trim(), unidad: unidad, cantidad: 1, precio_unitario: precio, aplica_itbms: itbms, total: precio });
        sel.value = '';
        renderItems();
      });
    }

    var form = byId('nc-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        ncGuardar();
      });
    }

    var btnNueva = byId('nc-btn-nueva');
    if (btnNueva) {
      btnNueva.addEventListener('click', ncAbrirFormulario);
    }

    var btnCancelar = byId('nc-btn-cancelar');
    if (btnCancelar) {
      btnCancelar.addEventListener('click', ncCerrarFormulario);
    }
  }

  function _bindBuscador() {
    var inp = byId('nc-buscar');
    if (inp) inp.addEventListener('input', function () { renderTabla(this.value); });

    var sel = byId('nc-filtro-estado');
    if (sel) sel.addEventListener('change', function () {
      var est = this.value;
      if (!est) { renderTabla(); return; }
      var f = _cotizaciones.filter(function(c){ return (c.estado||'cotizado') === est; });
      var tbody = byId('nc-tbody');
      if (tbody) {
        // render temporal con subset
        var orig = _cotizaciones;
        _cotizaciones = f;
        renderTabla();
        _cotizaciones = orig;
      }
    });
  }

  // ============================================================
  // ABRIR / CERRAR FORMULARIO
  // ============================================================
  window.ncAbrirFormulario = function () {
    _editandoId = null;
    _items = [];
    var form = byId('nc-form');
    if (form) form.reset();
    renderItems();
    _cargarCatalogoEnSelect();
    var panel = byId('nc-panel-form');
    if (panel) { panel.style.display = 'block'; panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    var num = byId('nc-numero');
    if (num) num.value = generarNumero();
    var fecha = byId('nc-fecha');
    if (fecha) fecha.value = new Date().toISOString().slice(0, 10);
    var venc = byId('nc-fecha-vencimiento');
    if (venc) {
      var d = new Date(); d.setDate(d.getDate() + 15);
      venc.value = d.toISOString().slice(0, 10);
    }
  };

  window.ncCerrarFormulario = function () {
    var panel = byId('nc-panel-form');
    if (panel) panel.style.display = 'none';
    _editandoId = null;
    _items = [];
  };

  function _cargarCatalogoEnSelect() {
    var sel = byId('nc-select-catalogo');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Agregar desde catálogo —</option>';
    var servicios = window._catalogoServicios || [];
    if (!servicios.length && typeof window.getDataFiltered === 'function') {
      window.getDataFiltered('catalogo', [], {}).then(function (rows) {
        if (!Array.isArray(rows)) return;
        window._catalogoServicios = rows;
        rows.forEach(function (s) {
          var opt = document.createElement('option');
          opt.value = s.id;
          opt.textContent = (s.descripcion || s.nombre || 'Servicio') + ' — ' + money(s.precio_unitario || s.precio || 0);
          opt.dataset.precio = s.precio_unitario || s.precio || 0;
          opt.dataset.itbms  = s.aplica_itbms || s.itbms || 0;
          opt.dataset.unidad = s.unidad || 'und';
          sel.appendChild(opt);
        });
      });
    } else {
      servicios.forEach(function (s) {
        var opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = (s.descripcion || s.nombre || 'Servicio') + ' — ' + money(s.precio_unitario || s.precio || 0);
        opt.dataset.precio = s.precio_unitario || s.precio || 0;
        opt.dataset.itbms  = s.aplica_itbms || s.itbms || 0;
        opt.dataset.unidad = s.unidad || 'und';
        sel.appendChild(opt);
      });
    }
  }

  // ============================================================
  // GUARDAR COTIZACIÓN
  // ============================================================
  window.ncGuardar = async function () {
    var numero   = (byId('nc-numero')    || {}).value || generarNumero();
    var clienteId = (byId('nc-cliente')  || {}).value || null;
    var titulo   = (byId('nc-titulo')    || {}).value || '';
    var fecha    = (byId('nc-fecha')     || {}).value || new Date().toISOString().slice(0,10);
    var venc     = (byId('nc-fecha-vencimiento') || {}).value || null;
    var notas    = (byId('nc-notas')     || {}).value || '';

    if (!titulo) { toast('warning', 'Campo requerido', 'El título es obligatorio.'); return; }

    var clienteNombre = '';
    if (clienteId) {
      var cl = _clientes.find(function(c){ return String(c.id) === String(clienteId); });
      clienteNombre = cl ? (cl.nombre || cl.razon_social || '') : '';
    }

    var subtotal = 0, itbms = 0;
    _items.forEach(function(it){
      subtotal += it.total || 0;
      if (it.aplica_itbms) itbms += (it.total || 0) * 0.07;
    });
    var total = subtotal + itbms;

    var userId = await getSessionUserId();

    var payload = {
      user_id:          userId,
      proyecto_id:      null,          // independiente
      numero:           numero,
      cliente_id:       clienteId || null,
      cliente_nombre:   clienteNombre,
      titulo:           titulo,
      nombre_proyecto:  titulo,
      fecha_emision:    fecha,
      fecha_vencimiento: venc || null,
      items:            JSON.stringify(_items),
      subtotal:         subtotal,
      itbms:            itbms,
      total:            total,
      estado:           'cotizado',
      notas:            notas,
      notas_internas:   ''
    };

    var fbEl = byId('nc-feedback');
    if (fbEl) fbEl.textContent = 'Guardando...';

    var result;
    if (_editandoId) {
      result = await updateItem('cotizaciones', _editandoId, payload);
      if (result !== false) {
        toast('success', 'Cotización actualizada', numero + ' actualizada correctamente.');
      } else {
        toast('error', 'Error', 'No se pudo actualizar la cotización.');
        if (fbEl) fbEl.textContent = '';
        return;
      }
    } else {
      result = await addItem('cotizaciones', payload);
      if (result) {
        toast('success', 'Cotización creada', numero + ' guardada en Supabase.');
      } else {
        toast('error', 'Error', 'No se pudo guardar la cotización.');
        if (fbEl) fbEl.textContent = '';
        return;
      }
    }

    if (fbEl) fbEl.textContent = '';
    ncCerrarFormulario();
    await cargarCotizaciones();
  };

  // ============================================================
  // EDITAR COTIZACIÓN
  // ============================================================
  window.ncEditarCotizacion = async function (id) {
    var cot = _cotizaciones.find(function(c){ return String(c.id) === String(id); });
    if (!cot) { toast('error', 'Error', 'Cotización no encontrada.'); return; }

    _editandoId = id;
    var panel = byId('nc-panel-form');
    if (panel) { panel.style.display = 'block'; panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    _cargarCatalogoEnSelect();

    var set = function(id, val) { var el = byId(id); if (el) el.value = val || ''; };
    set('nc-numero', cot.numero);
    set('nc-cliente', cot.cliente_id);
    set('nc-titulo', cot.titulo || cot.nombre_proyecto);
    set('nc-fecha', cot.fecha_emision || cot.fecha);
    set('nc-fecha-vencimiento', cot.fecha_vencimiento);
    set('nc-notas', cot.notas);

    try {
      _items = typeof cot.items === 'string' ? JSON.parse(cot.items) : (Array.isArray(cot.items) ? cot.items : []);
    } catch(e) { _items = []; }
    _items = _items.map(function(it) {
      it.total = parseMonto(it.cantidad) * parseMonto(it.precio_unitario);
      return it;
    });
    renderItems();
  };

  // ============================================================
  // ELIMINAR COTIZACIÓN
  // ============================================================
  window.ncEliminarCotizacion = async function (id) {
    if (!confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) return;
    try {
      var sb = window.supabaseClient;
      if (!sb) { toast('error', 'Error', 'Sin conexión a Supabase.'); return; }
      var res = await sb.from('cotizaciones').delete().eq('id', id);
      if (res.error) throw res.error;
      toast('success', 'Eliminada', 'La cotización fue eliminada.');
      await cargarCotizaciones();
    } catch(e) {
      log('error', '[NC] Error eliminando cotización', e);
      toast('error', 'Error', 'No se pudo eliminar la cotización.');
    }
  };

  // ============================================================
  // CAMBIAR ESTADO
  // ============================================================
  window.ncCambiarEstado = async function (id, nuevoEstado) {
    try {
      var ok = await updateItem('cotizaciones', id, { estado: nuevoEstado });
      if (ok !== false) {
        var cot = _cotizaciones.find(function(c){ return String(c.id) === String(id); });
        if (cot) cot.estado = nuevoEstado;
        renderTabla();
        toast('success', 'Estado actualizado', 'Cotización marcada como ' + nuevoEstado + '.');
      } else {
        toast('error', 'Error', 'No se pudo actualizar el estado.');
      }
    } catch(e) {
      log('error', '[NC] Error cambiando estado', e);
    }
  };

  // ============================================================
  // CONVERTIR EN PROYECTO
  // ============================================================
  window.ncConvertirEnProyecto = async function (id) {
    var cot = _cotizaciones.find(function(c){ return String(c.id) === String(id); });
    if (!cot) { toast('error', 'Error', 'Cotización no encontrada.'); return; }
    if (cot.estado === 'convertido') { toast('info', 'Ya convertida', 'Esta cotización ya fue convertida en proyecto.'); return; }
    if (!confirm('¿Convertir "' + (cot.titulo || cot.numero) + '" en un proyecto? Se creará automáticamente en la sección Proyectos.')) return;

    try {
      var userId = await getSessionUserId();
      var items  = [];
      try {
        items = typeof cot.items === 'string' ? JSON.parse(cot.items) : (Array.isArray(cot.items) ? cot.items : []);
      } catch(e) { items = []; }

      // Crear proyecto en Supabase
      var proyectoPayload = {
        user_id:        userId,
        nombre:         cot.titulo || cot.nombre_proyecto || 'Proyecto desde ' + cot.numero,
        cliente_id:     cot.cliente_id || null,
        cliente_nombre: cot.cliente_nombre || '',
        fecha_inicio:   cot.fecha_emision || new Date().toISOString().slice(0,10),
        estado:         'cotizado',
        presupuesto:    parseMonto(cot.total),
        descripcion:    cot.notas || '',
        cotizacion_id:  cot.id
      };

      var nuevoProyecto = await addItem('proyectos', proyectoPayload);
      if (!nuevoProyecto) throw new Error('No se pudo crear el proyecto.');

      // Vincular cotización al proyecto recién creado
      await updateItem('cotizaciones', id, {
        proyecto_id: nuevoProyecto.id,
        estado: 'convertido'
      });

      // Crear cotización formal vinculada al proyecto (re-usa crearCotizacionDesdeProforma si existe)
      if (typeof window.crearCotizacionDesdeProforma === 'function') {
        await window.crearCotizacionDesdeProforma({
          proyectoId:     nuevoProyecto.id,
          clienteId:      cot.cliente_id,
          clienteNombre:  cot.cliente_nombre,
          nombreProyecto: cot.titulo || cot.nombre_proyecto,
          alcanceHtml:    cot.descripcion || '',
          items:          items,
          subtotal:       parseMonto(cot.subtotal),
          itbms:          parseMonto(cot.itbms),
          total:          parseMonto(cot.total)
        });
      }

      toast('success', '¡Convertido!', 'El proyecto "' + proyectoPayload.nombre + '" fue creado. Ve a la sección Proyectos para verlo.');

      // Recargar lista
      await cargarCotizaciones();

      // Ofrecer ir a Proyectos
      setTimeout(function () {
        if (confirm('¿Ir a la sección Proyectos ahora?')) {
          if (typeof window.switchSection === 'function') window.switchSection('proyectos');
        }
      }, 400);
    } catch (e) {
      log('error', '[NC] Error convirtiendo en proyecto', e);
      toast('error', 'Error', 'No se pudo convertir la cotización: ' + (e.message || e));
    }
  };

  // ============================================================
  // EXPONER INIT
  // ============================================================
  window.ncIniciarModulo = iniciarModulo;

  // Auto-init cuando la sub-sección es visible
  document.addEventListener('DOMContentLoaded', function () {
    // Se inicializa cuando el usuario entra a negocio > cotizaciones
    // El llamado real lo hace switchSubSection en app.js (ver integración en index.html)
    if (byId('negocio-cotizaciones')) {
      iniciarModulo();
    }
  });

})(window, document);
