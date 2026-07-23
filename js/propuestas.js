// ============================================================
// js/propuestas.js — Plantillas de Propuestas
// Sección: Negocio > Plantillas de Propuestas
// Fase 6 — GN Studio OS v2.6
// ============================================================
// Funcionalidades:
//   • CRUD de plantillas reutilizables (Supabase: propuestas_plantillas)
//   • Secciones configurables: Portada, Alcance, Entregables,
//     Inversión, Condiciones, Cierre
//   • Vista previa en modal antes de usar
//   • Insertar plantilla al crear una cotización nueva
//   • Filtro por categoría y búsqueda por nombre
// ============================================================

(function (window, document) {
  'use strict';

  var byId = function (id) { return document.getElementById(id); };

  function log(level, msg, meta) {
    if (window.GNUtils && typeof window.GNUtils.log === 'function') {
      window.GNUtils.log(level, msg, meta); return;
    }
    meta !== undefined ? console[level](msg, meta) : console[level](msg);
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(type, title, message, actions) {
    if (window.showToast) window.showToast({ type, title, message, actions });
  }

  async function getSessionUserId() {
    if (typeof window.getSessionUserId === 'function') return await window.getSessionUserId();
    var sb = window.supabaseClient;
    if (!sb) return null;
    try {
      var s = await sb.auth.getSession();
      return s?.data?.session?.user?.id || null;
    } catch (e) { return null; }
  }

  async function sbFrom(table) {
    var sb = window.supabaseClient;
    if (!sb) throw new Error('Sin conexión a Supabase.');
    return sb.from(table);
  }

  // ============================================================
  // ESTADO
  // ============================================================
  var _plantillas = [];
  var _editandoId = null;
  var _secciones  = [];

  var CATEGORIAS = [
    { value: 'branding',    label: 'Branding & Identidad' },
    { value: 'web',         label: 'Diseño Web' },
    { value: 'editorial',   label: 'Editorial & Print' },
    { value: 'audiovisual', label: 'Audiovisual & Motion' },
    { value: 'render',      label: 'Arquitectura & Render' },
    { value: 'general',     label: 'General' }
  ];

  var SECCIONES_DEFAULT = [
    { key: 'portada',      label: 'Portada / Presentación',   contenido: '' },
    { key: 'alcance',      label: 'Alcance del Proyecto',      contenido: '' },
    { key: 'entregables',  label: 'Entregables',               contenido: '' },
    { key: 'inversion',    label: 'Inversión & Condiciones',   contenido: '' },
    { key: 'proceso',      label: 'Proceso de Trabajo',        contenido: '' },
    { key: 'cierre',       label: 'Cierre & CTA',              contenido: '' }
  ];

  // ============================================================
  // INIT
  // ============================================================
  async function iniciarModulo() {
    _poblarSelects();
    await cargarPlantillas();
    _bindFormulario();
    _bindBuscador();
  }

  function _poblarSelects() {
    var selsFiltro = [byId('pp-filtro-cat'), byId('pp-categoria')];
    selsFiltro.forEach(function (sel) {
      if (!sel) return;
      var isFilter = sel.id === 'pp-filtro-cat';
      if (isFilter) sel.innerHTML = '<option value="">Todas las categorías</option>';
      else          sel.innerHTML = '';
      CATEGORIAS.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.value;
        opt.textContent = c.label;
        sel.appendChild(opt);
      });
    });
  }

  // ============================================================
  // CARGAR PLANTILLAS
  // ============================================================
  async function cargarPlantillas() {
    try {
      var sb = await sbFrom('propuestas_plantillas');
      var userId = await getSessionUserId();
      var q = sb.select('*').order('created_at', { ascending: false });
      if (userId) q = q.eq('user_id', userId);
      var { data, error } = await q;
      if (error) throw error;
      _plantillas = Array.isArray(data) ? data : [];
    } catch (e) {
      log('error', '[PP] Error cargando plantillas', e);
      _plantillas = [];
    }
    renderTarjetas();
  }

  // ============================================================
  // RENDER TARJETAS
  // ============================================================
  function renderTarjetas(filtroTexto, filtroCategoria) {
    var contenedor = byId('pp-grid');
    if (!contenedor) return;

    var lista = _plantillas.slice();

    if (filtroCategoria) {
      lista = lista.filter(function (p) { return p.categoria === filtroCategoria; });
    }
    if (filtroTexto) {
      var f = filtroTexto.toLowerCase();
      lista = lista.filter(function (p) {
        return (p.nombre || '').toLowerCase().includes(f) ||
               (p.descripcion || '').toLowerCase().includes(f);
      });
    }

    if (!lista.length) {
      contenedor.innerHTML = [
        '<div style="grid-column:1/-1;text-align:center;padding:48px 24px;color:var(--gn-text-muted,#8FAB9A);">',
          '<i class="ph ph-file-text" style="font-size:40px;display:block;margin-bottom:12px;"></i>',
          '<p style="margin:0;font-size:14px;">No hay plantillas aún. Crea la primera.</p>',
        '</div>'
      ].join('');
      return;
    }

    contenedor.innerHTML = lista.map(function (p) {
      var catLabel = (CATEGORIAS.find(function(c){ return c.value === p.categoria; }) || {}).label || p.categoria || 'General';
      var secs = 0;
      try { secs = (typeof p.secciones === 'string' ? JSON.parse(p.secciones) : p.secciones || []).length; }
      catch(e) {}

      return [
        '<div class="pp-card" style="background:var(--gn-card-bg,#111E17);border:1px solid rgba(197,162,83,0.18);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:10px;transition:border-color .2s;" onmouseover="this.style.borderColor=\'rgba(197,162,83,0.45)\'" onmouseout="this.style.borderColor=\'rgba(197,162,83,0.18)\'">',
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">',
            '<div>',
              '<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:rgba(197,162,83,0.12);color:#C5A253;">' + esc(catLabel) + '</span>',
            '</div>',
            '<div style="display:flex;gap:6px;">',
              '<button class="btn-secondary" style="padding:4px 8px;font-size:12px;" onclick="ppPrevisualizar(\'' + p.id + '\')" title="Previsualizar"><i class="ph ph-eye"></i></button>',
              '<button class="btn-secondary" style="padding:4px 8px;font-size:12px;" onclick="ppEditar(\'' + p.id + '\')" title="Editar"><i class="ph ph-pencil"></i></button>',
              '<button class="btn-secondary" style="padding:4px 8px;font-size:12px;color:#F87171;" onclick="ppEliminar(\'' + p.id + '\')" title="Eliminar"><i class="ph ph-trash"></i></button>',
            '</div>',
          '</div>',
          '<div>',
            '<h4 style="margin:0 0 4px;font-size:15px;color:var(--gn-text,#F0F0F5);">' + esc(p.nombre || 'Sin nombre') + '</h4>',
            '<p style="margin:0;font-size:12px;color:var(--gn-text-muted,#8FAB9A);line-height:1.5;">' + esc((p.descripcion || '').slice(0, 90) + ((p.descripcion || '').length > 90 ? '...' : '')) + '</p>',
          '</div>',
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:10px;border-top:1px solid rgba(143,171,154,0.1);">',
            '<span style="font-size:12px;color:var(--gn-text-muted,#8FAB9A);"><i class="ph ph-list-bullets"></i> ' + secs + ' sección' + (secs !== 1 ? 'es' : '') + '</span>',
            '<button class="btn-primary" style="font-size:12px;padding:6px 14px;" onclick="ppUsarPlantilla(\'' + p.id + '\')" title="Usar en cotización">',
              '<i class="ph ph-arrow-square-out"></i> Usar',
            '</button>',
          '</div>',
        '</div>'
      ].join('');
    }).join('');
  }

  // ============================================================
  // SECCIONES EN EL FORMULARIO
  // ============================================================
  function renderSecciones() {
    var contenedor = byId('pp-secciones-wrap');
    if (!contenedor) return;

    if (!_secciones.length) {
      contenedor.innerHTML = '<p style="text-align:center;color:var(--gn-text-muted,#8FAB9A);font-size:13px;padding:16px;">Agrega secciones con el botón de arriba.</p>';
      return;
    }

    contenedor.innerHTML = _secciones.map(function (sec, i) {
      return [
        '<div class="pp-seccion" style="border:1px solid rgba(143,171,154,0.15);border-radius:8px;padding:14px;margin-bottom:10px;background:rgba(0,0,0,0.15);">',
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">',
            '<input type="text" class="nc-item-input" placeholder="Título de sección" value="' + esc(sec.label) + '" style="flex:1;font-weight:600;" oninput="ppSeccionChange(' + i + ',\'label\',this.value)">',
            '<button type="button" class="btn-secondary" style="padding:4px 8px;color:#F87171;" onclick="ppEliminarSeccion(' + i + ')"><i class="ph ph-trash"></i></button>',
          '</div>',
          '<textarea class="nc-item-input" rows="4" placeholder="Contenido de la sección (texto o HTML básico)..." style="width:100%;resize:vertical;font-size:13px;" oninput="ppSeccionChange(' + i + ',\'contenido\',this.value)">' + esc(sec.contenido) + '</textarea>',
        '</div>'
      ].join('');
    }).join('');
  }

  window.ppSeccionChange = function (idx, campo, valor) {
    if (_secciones[idx]) _secciones[idx][campo] = valor;
  };

  window.ppEliminarSeccion = function (idx) {
    _secciones.splice(idx, 1);
    renderSecciones();
  };

  // ============================================================
  // BIND FORMULARIO
  // ============================================================
  function _bindFormulario() {
    var btnNueva = byId('pp-btn-nueva');
    if (btnNueva) btnNueva.addEventListener('click', ppAbrirFormulario);

    var btnCancelar = byId('pp-btn-cancelar');
    if (btnCancelar) btnCancelar.addEventListener('click', ppCerrarFormulario);

    var btnAddSecDefault = byId('pp-btn-add-secciones-default');
    if (btnAddSecDefault) btnAddSecDefault.addEventListener('click', function () {
      _secciones = SECCIONES_DEFAULT.map(function (s) {
        return { key: s.key, label: s.label, contenido: s.contenido };
      });
      renderSecciones();
    });

    var btnAddSec = byId('pp-btn-add-seccion');
    if (btnAddSec) btnAddSec.addEventListener('click', function () {
      _secciones.push({ key: 'seccion_' + Date.now(), label: 'Nueva Sección', contenido: '' });
      renderSecciones();
    });

    var form = byId('pp-form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); ppGuardar(); });
  }

  function _bindBuscador() {
    var inp = byId('pp-buscar');
    if (inp) inp.addEventListener('input', function () {
      var cat = (byId('pp-filtro-cat') || {}).value || '';
      renderTarjetas(this.value, cat);
    });

    var sel = byId('pp-filtro-cat');
    if (sel) sel.addEventListener('change', function () {
      var txt = (byId('pp-buscar') || {}).value || '';
      renderTarjetas(txt, this.value);
    });
  }

  // ============================================================
  // ABRIR / CERRAR FORMULARIO
  // ============================================================
  window.ppAbrirFormulario = function () {
    _editandoId = null;
    _secciones  = [];
    var form = byId('pp-form');
    if (form) form.reset();
    renderSecciones();
    var panel = byId('pp-panel-form');
    if (panel) { panel.style.display = 'block'; panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };

  window.ppCerrarFormulario = function () {
    var panel = byId('pp-panel-form');
    if (panel) panel.style.display = 'none';
    _editandoId = null;
    _secciones  = [];
  };

  // ============================================================
  // GUARDAR PLANTILLA
  // ============================================================
  window.ppGuardar = async function () {
    var nombre     = (byId('pp-nombre')      || {}).value || '';
    var descripcion= (byId('pp-descripcion') || {}).value || '';
    var categoria  = (byId('pp-categoria')   || {}).value || 'general';

    if (!nombre.trim()) { toast('warning', 'Campo requerido', 'El nombre de la plantilla es obligatorio.'); return; }

    var userId = await getSessionUserId();
    var payload = {
      user_id:     userId,
      nombre:      nombre.trim(),
      descripcion: descripcion.trim(),
      categoria:   categoria,
      secciones:   JSON.stringify(_secciones)
    };

    try {
      var sb = window.supabaseClient;
      if (!sb) throw new Error('Sin conexión a Supabase.');

      var res;
      if (_editandoId) {
        res = await sb.from('propuestas_plantillas').update(payload).eq('id', _editandoId);
        if (res.error) throw res.error;
        toast('success', 'Plantilla actualizada', '"' + nombre + '" actualizada correctamente.');
      } else {
        res = await sb.from('propuestas_plantillas').insert(payload);
        if (res.error) throw res.error;
        toast('success', 'Plantilla creada', '"' + nombre + '" guardada en Supabase.');
      }

      ppCerrarFormulario();
      await cargarPlantillas();
    } catch (e) {
      log('error', '[PP] Error guardando plantilla', e);
      toast('error', 'Error', 'No se pudo guardar la plantilla: ' + (e.message || e));
    }
  };

  // ============================================================
  // EDITAR
  // ============================================================
  window.ppEditar = function (id) {
    var p = _plantillas.find(function (x) { return String(x.id) === String(id); });
    if (!p) { toast('error', 'Error', 'Plantilla no encontrada.'); return; }

    _editandoId = id;
    var set = function (elId, val) { var el = byId(elId); if (el) el.value = val || ''; };
    set('pp-nombre',      p.nombre);
    set('pp-descripcion', p.descripcion);
    set('pp-categoria',   p.categoria);

    try { _secciones = typeof p.secciones === 'string' ? JSON.parse(p.secciones) : (p.secciones || []); }
    catch(e) { _secciones = []; }

    renderSecciones();
    var panel = byId('pp-panel-form');
    if (panel) { panel.style.display = 'block'; panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };

  // ============================================================
  // ELIMINAR
  // ============================================================
  window.ppEliminar = async function (id) {
    if (!confirm('¿Eliminar esta plantilla? Esta acción no se puede deshacer.')) return;
    try {
      var sb = window.supabaseClient;
      if (!sb) throw new Error('Sin conexión a Supabase.');
      var res = await sb.from('propuestas_plantillas').delete().eq('id', id);
      if (res.error) throw res.error;
      toast('success', 'Eliminada', 'La plantilla fue eliminada.');
      await cargarPlantillas();
    } catch (e) {
      log('error', '[PP] Error eliminando', e);
      toast('error', 'Error', 'No se pudo eliminar: ' + (e.message || e));
    }
  };

  // ============================================================
  // PREVISUALIZAR
  // ============================================================
  window.ppPrevisualizar = function (id) {
    var p = _plantillas.find(function (x) { return String(x.id) === String(id); });
    if (!p) return;

    var secs = [];
    try { secs = typeof p.secciones === 'string' ? JSON.parse(p.secciones) : (p.secciones || []); }
    catch(e) {}

    var catLabel = (CATEGORIAS.find(function(c){ return c.value === p.categoria; }) || {}).label || p.categoria;

    var html = [
      '<div id="pp-preview-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10500;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;">',
        '<div style="background:#111E17;border-radius:14px;width:100%;max-width:680px;max-height:85vh;overflow-y:auto;border:1px solid rgba(197,162,83,0.25);display:flex;flex-direction:column;">',
          // Header del modal
          '<div style="padding:20px 24px;border-bottom:1px solid rgba(143,171,154,0.15);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#111E17;z-index:2;">',
            '<div>',
              '<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:rgba(197,162,83,0.12);color:#C5A253;margin-bottom:4px;display:inline-block;">' + esc(catLabel) + '</span>',
              '<h3 style="margin:0;font-size:17px;color:#F0F0F5;">' + esc(p.nombre) + '</h3>',
            '</div>',
            '<button onclick="document.getElementById(\'pp-preview-overlay\').remove()" style="background:rgba(248,113,113,0.1);border:none;color:#F87171;font-size:20px;cursor:pointer;border-radius:8px;padding:6px 10px;line-height:1;">✕</button>',
          '</div>',
          // Descripcion
          p.descripcion ? '<div style="padding:12px 24px;background:rgba(143,171,154,0.05);border-bottom:1px solid rgba(143,171,154,0.1);"><p style="margin:0;color:#8FAB9A;font-size:13px;">' + esc(p.descripcion) + '</p></div>' : '',
          // Secciones
          '<div style="padding:24px;">',
            secs.length
              ? secs.map(function (sec, i) {
                  return [
                    '<div style="margin-bottom:20px;' + (i < secs.length - 1 ? 'padding-bottom:20px;border-bottom:1px solid rgba(143,171,154,0.1);' : '') + '">',
                      '<h4 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#C5A253;text-transform:uppercase;letter-spacing:0.05em;">' + esc(sec.label || sec.key) + '</h4>',
                      '<div style="font-size:13px;color:#8FAB9A;line-height:1.7;white-space:pre-wrap;">' + esc(sec.contenido || '(sin contenido)') + '</div>',
                    '</div>'
                  ].join('');
                }).join('')
              : '<p style="text-align:center;color:#8FAB9A;font-size:13px;">Esta plantilla no tiene secciones aún.</p>',
          '</div>',
          // Footer
          '<div style="padding:16px 24px;border-top:1px solid rgba(143,171,154,0.1);display:flex;justify-content:flex-end;gap:10px;background:#111E17;position:sticky;bottom:0;">',
            '<button onclick="document.getElementById(\'pp-preview-overlay\').remove()" class="btn-secondary" style="font-size:13px;">Cerrar</button>',
            '<button onclick="ppUsarPlantilla(\'' + p.id + '\');document.getElementById(\'pp-preview-overlay\').remove();" class="btn-primary" style="font-size:13px;"><i class="ph ph-arrow-square-out"></i> Usar esta plantilla</button>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');

    var existing = document.getElementById('pp-preview-overlay');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    // Cerrar al hacer click fuera
    document.getElementById('pp-preview-overlay').addEventListener('click', function (e) {
      if (e.target.id === 'pp-preview-overlay') this.remove();
    });
  };

  // ============================================================
  // USAR PLANTILLA → Inicia cotización con notas pre-llenadas
  // ============================================================
  window.ppUsarPlantilla = function (id) {
    var p = _plantillas.find(function (x) { return String(x.id) === String(id); });
    if (!p) return;

    // Guardar la plantilla seleccionada para que cotizaciones.js la lea
    window._ppPlantillaActiva = p;

    // Navegar a la sección Cotizaciones y abrir el formulario
    var fue = false;
    if (typeof window.switchSection === 'function') {
      window.switchSection('negocio-cotizaciones');
      fue = true;
    }
    if (!fue) {
      var link = document.querySelector('[data-section="negocio-cotizaciones"], [href="#negocio-cotizaciones"]');
      if (link) { link.click(); fue = true; }
    }

    // Pequeño delay para asegurar que el formulario está en el DOM
    setTimeout(function () {
      if (typeof window.ncAbrirFormulario === 'function') {
        window.ncAbrirFormulario();
        // Pre-llenar notas con el contenido textual de las secciones
        var secs = [];
        try { secs = typeof p.secciones === 'string' ? JSON.parse(p.secciones) : (p.secciones || []); }
        catch(e) {}
        var notaContent = secs.map(function (s) {
          return '=== ' + (s.label || s.key).toUpperCase() + ' ===\n' + (s.contenido || '');
        }).join('\n\n');
        var notasEl = document.getElementById('nc-notas');
        if (notasEl && notaContent) notasEl.value = notaContent;
      }
      window._ppPlantillaActiva = null;
    }, 350);

    toast('info', 'Plantilla cargada', '"' + (p.nombre || 'Plantilla') + '" aplicada. Completa los datos de la cotización.');
  };

  // ============================================================
  // EXPONER INIT
  // ============================================================
  window.ppIniciarModulo = iniciarModulo;

  document.addEventListener('DOMContentLoaded', function () {
    var sec = byId('pp-section') || byId('negocio-propuestas') || document.querySelector('[data-section-id="propuestas"]');
    if (sec) iniciarModulo();
  });

})(window, document);
