// ============================================================
// js/grupos.js — Gestión de Grupos de Servicios
// ============================================================

var GRUPOS_KEY = 'gn_grupos_servicios';
var GRUPO_SERVICIOS_KEY = 'gn_grupo_servicio_map';

var COLORES_GRUPO = {
  green:  { bg: 'rgba(107,189,69,0.15)',  border: '#6bbd45', label: 'Verde',     icon: '🟢' },
  blue:   { bg: 'rgba(79,140,255,0.15)',  border: '#4f8cff', label: 'Azul',      icon: '🔵' },
  purple: { bg: 'rgba(168,85,247,0.15)',  border: '#a855f7', label: 'Púrpura',   icon: '🟣' },
  orange: { bg: 'rgba(245,158,11,0.15)',  border: '#f59e0b', label: 'Naranja',   icon: '🟠' },
  red:    { bg: 'rgba(239,68,68,0.15)',   border: '#ef4444', label: 'Rojo',      icon: '🔴' },
  teal:   { bg: 'rgba(20,184,166,0.15)',  border: '#14b8a6', label: 'Turquesa',  icon: '🩵' },
  pink:   { bg: 'rgba(236,72,153,0.15)',  border: '#ec4899', label: 'Rosa',      icon: '🩷' },
  gray:   { bg: 'rgba(100,116,139,0.15)', border: '#64748b', label: 'Gris',      icon: '⚪' }
};

function $grp(id) {
  return document.getElementById(id);
}

function grupoEscapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function contenedorPrimero(ids) {
  for (var i = 0; i < ids.length; i++) {
    var node = document.getElementById(ids[i]);
    if (node) return node;
  }
  return null;
}

// ============================================================
// INICIALIZAR
// ============================================================

function inicializarGrupos() {
  var grupos = getData(GRUPOS_KEY);
  if (!Array.isArray(grupos) || grupos.length === 0) {
    grupos = [
      { id: 'grp-desarrollo',  codigo: 'DESARROLLO',  nombre: 'Desarrollo Web',      descripcion: 'Programación, APIs, CMS y deploy', color: 'green',  orden: 1, creadoEn: new Date().toISOString() },
      { id: 'grp-diseno',      codigo: 'DISENO',      nombre: 'Diseño Web',          descripcion: 'UI/UX, landing pages y responsive', color: 'blue',   orden: 2, creadoEn: new Date().toISOString() },
      { id: 'grp-branding',    codigo: 'BRANDING',    nombre: 'Branding',            descripcion: 'Logotipos, manuales y papelería', color: 'purple', orden: 3, creadoEn: new Date().toISOString() },
      { id: 'grp-marketing',   codigo: 'MARKETING',   nombre: 'Marketing Digital',   descripcion: 'Ads, SEO y automatización', color: 'orange', orden: 4, creadoEn: new Date().toISOString() },
      { id: 'grp-social',      codigo: 'SOCIAL',      nombre: 'Social Media',        descripcion: 'Gestión de redes y contenido', color: 'pink',   orden: 5, creadoEn: new Date().toISOString() },
      { id: 'grp-consultoria', codigo: 'CONSULTORIA', nombre: 'Consultoría',         descripcion: 'Estrategia, auditorías y asesoría', color: 'teal',  orden: 6, creadoEn: new Date().toISOString() },
      { id: 'grp-soporte',     codigo: 'SOPORTE',     nombre: 'Soporte & Hosting',   descripcion: 'Mantenimiento, hosting y dominios', color: 'gray',  orden: 7, creadoEn: new Date().toISOString() }
    ];
    setData(GRUPOS_KEY, grupos);
  }

  var map = getData(GRUPO_SERVICIOS_KEY);
  if (!map || typeof map !== 'object' || Array.isArray(map)) {
    setData(GRUPO_SERVICIOS_KEY, {});
  }

  renderGrupos();
  renderGruposVisuales();
  actualizarSelectGrupos();
  renderServiciosPorGrupo();
  renderServiciosSinGrupo();
}

// ============================================================
// DATOS
// ============================================================

function obtenerGrupos() {
  var grupos = getData(GRUPOS_KEY);
  grupos = Array.isArray(grupos) ? grupos : [];
  grupos.sort(function(a, b) {
    return (parseInt(a.orden) || 99) - (parseInt(b.orden) || 99);
  });
  return grupos;
}

function obtenerMapaGrupos() {
  var map = getData(GRUPO_SERVICIOS_KEY);
  return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
}

function guardarMapaGrupos(map) {
  setData(GRUPO_SERVICIOS_KEY, map || {});
}

function obtenerGrupoDeServicio(servicioId) {
  var map = obtenerMapaGrupos();
  var grupoId = map[servicioId];
  if (!grupoId) return null;

  var grupos = obtenerGrupos();
  for (var i = 0; i < grupos.length; i++) {
    if (grupos[i].id === grupoId) return grupos[i];
  }

  return null;
}

// ============================================================
// CRUD
// ============================================================

function guardarGrupo(event) {
  event.preventDefault();

  var feedback = $grp('feedback-grupo');
  var codigo = ($grp('grp-codigo') ? $grp('grp-codigo').value : '').trim().toUpperCase();
  var nombre = ($grp('grp-nombre') ? $grp('grp-nombre').value : '').trim();
  var descripcion = ($grp('grp-descripcion') ? $grp('grp-descripcion').value : '').trim();
  var color = $grp('grp-color') ? $grp('grp-color').value : 'blue';
  var orden = parseInt($grp('grp-orden') ? $grp('grp-orden').value : 99) || 99;

  if (!codigo || !nombre) {
    if (feedback) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ Completa código y nombre del grupo';
    }
    return false;
  }

  var grupos = obtenerGrupos();

  for (var i = 0; i < grupos.length; i++) {
    if (grupos[i].codigo === codigo) {
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = '❌ El código "' + codigo + '" ya existe';
      }
      return false;
    }
  }

  grupos.push({
    id: generarId(),
    codigo: codigo,
    nombre: nombre,
    descripcion: descripcion,
    color: color,
    orden: orden,
    creadoEn: new Date().toISOString()
  });

  grupos.sort(function(a, b) {
    return (parseInt(a.orden) || 99) - (parseInt(b.orden) || 99);
  });

  setData(GRUPOS_KEY, grupos);

  if (feedback) {
    feedback.className = 'form-feedback success';
    feedback.textContent = '✅ Grupo "' + nombre + '" creado';
  }

  if ($grp('formGrupo')) $grp('formGrupo').reset();

  renderGrupos();
  renderGruposVisuales();
  actualizarSelectGrupos();
  renderServiciosPorGrupo();
  renderServiciosSinGrupo();

  return false;
}

function eliminarGrupo(id) {
  if (!confirm('¿Eliminar este grupo? Los servicios asignados quedarán sin grupo.')) return;

  var grupos = obtenerGrupos().filter(function(g) {
    return g.id !== id;
  });
  setData(GRUPOS_KEY, grupos);

  var map = obtenerMapaGrupos();
  for (var sid in map) {
    if (map[sid] === id) delete map[sid];
  }
  guardarMapaGrupos(map);

  renderGrupos();
  renderGruposVisuales();
  actualizarSelectGrupos();
  renderServicios();
  renderServiciosPorGrupo();
  renderServiciosSinGrupo();
}

// ============================================================
// SELECTS
// ============================================================

function actualizarSelectGrupos() {
  var grupos = obtenerGrupos();

  var selects = [
    $grp('serv-grupo'),
    $grp('serv-categoria'),
    $grp('filtro-grupo-servicio'),
    $grp('filtro-servicio-grupo')
  ];

  for (var s = 0; s < selects.length; s++) {
    var select = selects[s];
    if (!select) continue;

    var esFiltro = select.id.indexOf('filtro') !== -1;
    var html = esFiltro
      ? '<option value="todos">Todos los grupos</option>'
      : '<option value="">Sin grupo</option>';

    for (var i = 0; i < grupos.length; i++) {
      html += '<option value="' + grupos[i].id + '">' + grupoEscapeHtml(grupos[i].nombre) + '</option>';
    }

    select.innerHTML = html;
  }
}

// ============================================================
// MAPEAR SERVICIOS
// ============================================================

function asignarServicioAGrupo(servicioId, grupoId) {
  var map = obtenerMapaGrupos();

  if (grupoId) {
    map[servicioId] = grupoId;
  } else {
    delete map[servicioId];
  }

  guardarMapaGrupos(map);

  renderServicios();
  renderServiciosPorGrupo();
  renderServiciosSinGrupo();
}

function quitarServicioDeGrupo(servicioId) {
  asignarServicioAGrupo(servicioId, '');
}

// ============================================================
// RENDER TABLA
// ============================================================

function renderGrupos(filtro) {
  var tbody = $grp('tbodyGrupos');
  if (!tbody) return;

  var grupos = obtenerGrupos();
  var map = obtenerMapaGrupos();
  var conteo = {};

  for (var sid in map) {
    var gid = map[sid];
    conteo[gid] = (conteo[gid] || 0) + 1;
  }

  if (filtro) {
    var term = filtro.toLowerCase();
    grupos = grupos.filter(function(g) {
      return (g.nombre || '').toLowerCase().indexOf(term) !== -1
        || (g.codigo || '').toLowerCase().indexOf(term) !== -1;
    });
  }

  if (grupos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay grupos registrados</td></tr>';
    return;
  }

  var html = '';

  for (var i = 0; i < grupos.length; i++) {
    var g = grupos[i];
    var color = COLORES_GRUPO[g.color] || COLORES_GRUPO.blue;

    html += ''
      + '<tr>'
      + '<td>' + grupoEscapeHtml(g.codigo) + '</td>'
      + '<td>' + grupoEscapeHtml(g.nombre) + '</td>'
      + '<td>' + grupoEscapeHtml(g.descripcion || '—') + '</td>'
      + '<td><span style="display:inline-block;padding:4px 8px;border-radius:999px;background:' + color.bg + ';border:1px solid ' + color.border + ';">' + color.icon + ' ' + color.label + '</span></td>'
      + '<td>' + (conteo[g.id] || 0) + '</td>'
      + '<td><button type="button" class="btn-table danger" onclick="eliminarGrupo(\'' + g.id + '\')">Eliminar</button></td>'
      + '</tr>';
  }

  tbody.innerHTML = html;
}

// ============================================================
// RENDER VISUAL
// ============================================================

function renderGruposVisuales() {
  var container = $grp('grupos-visual');
  if (!container) return;

  var grupos = obtenerGrupos();

  if (grupos.length === 0) {
    container.innerHTML = '<div class="empty-state">No hay grupos creados</div>';
    return;
  }

  var map = obtenerMapaGrupos();
  var conteo = {};

  for (var sid in map) {
    var gid = map[sid];
    conteo[gid] = (conteo[gid] || 0) + 1;
  }

  var html = '';

  for (var i = 0; i < grupos.length; i++) {
    var g = grupos[i];
    var color = COLORES_GRUPO[g.color] || COLORES_GRUPO.blue;

    html += ''
      + '<div class="grupo-card" style="background:' + color.bg + ';border:1px solid ' + color.border + ';border-radius:16px;padding:16px;margin-bottom:12px;">'
      + '<div style="font-weight:700;">' + color.icon + ' ' + grupoEscapeHtml(g.nombre) + '</div>'
      + '<div style="opacity:.8;margin-top:6px;">' + grupoEscapeHtml(g.descripcion || 'Sin descripción') + '</div>'
      + '<div style="margin-top:8px;font-size:.95em;"><strong>' + (conteo[g.id] || 0) + '</strong> servicios asignados</div>'
      + '</div>';
  }

  container.innerHTML = html;
}

// ============================================================
// SERVICIOS POR GRUPO
// ============================================================

function renderServiciosPorGrupo() {
  var container = contenedorPrimero(['servicios-por-grupo', 'serviciosPorGrupo']);
  if (!container) return;

  if (typeof obtenerServicios !== 'function') {
    container.innerHTML = '';
    return;
  }

  var grupos = obtenerGrupos();
  var servicios = obtenerServicios();
  var map = obtenerMapaGrupos();

  if (grupos.length === 0) {
    container.innerHTML = '<div class="empty-state">No hay grupos creados</div>';
    return;
  }

  var html = '';

  for (var i = 0; i < grupos.length; i++) {
    var g = grupos[i];
    var lista = [];

    for (var j = 0; j < servicios.length; j++) {
      var s = servicios[j];
      if (map[s.id] === g.id) lista.push(s);
    }

    html += '<div style="margin-bottom:18px;">';
    html += '<h4 style="margin-bottom:10px;">' + grupoEscapeHtml(g.nombre) + ' <span style="opacity:.7;">(' + lista.length + ')</span></h4>';

    if (lista.length === 0) {
      html += '<div class="empty-state">Sin servicios asignados</div>';
    } else {
      html += '<div>';
      for (var k = 0; k < lista.length; k++) {
        html += ''
          + '<div style="border:1px solid rgba(255,255,255,0.08);padding:10px 12px;border-radius:12px;margin-bottom:8px;">'
          + '<div style="font-weight:600;">[' + grupoEscapeHtml(lista[k].codigo) + '] ' + grupoEscapeHtml(lista[k].descripcion) + '</div>'
          + '<div style="opacity:.8;margin-top:4px;">' + grupoEscapeHtml(lista[k].unidad) + ' · ' + formatMoney(parseFloat(lista[k].precio) || 0) + '</div>'
          + '</div>';
      }
      html += '</div>';
    }

    html += '</div>';
  }

  container.innerHTML = html;
}

function renderServiciosSinGrupo() {
  var container = contenedorPrimero(['servicios-sin-grupo', 'serviciosSinGrupo']);
  if (!container) return;

  if (typeof obtenerServicios !== 'function') {
    container.innerHTML = '';
    return;
  }

  var servicios = obtenerServicios();
  var map = obtenerMapaGrupos();
  var sinGrupo = [];

  for (var i = 0; i < servicios.length; i++) {
    if (!map[servicios[i].id]) sinGrupo.push(servicios[i]);
  }

  if (sinGrupo.length === 0) {
    container.innerHTML = '<div class="empty-state">✅ Todos los servicios tienen un grupo asignado</div>';
    return;
  }

  var grupos = obtenerGrupos();
  var html = '';

  for (var j = 0; j < sinGrupo.length; j++) {
    var s = sinGrupo[j];

    html += '<div style="border:1px dashed rgba(255,255,255,0.15);padding:12px;border-radius:12px;margin-bottom:10px;">';
    html += '<div style="font-weight:600;">[' + grupoEscapeHtml(s.codigo) + '] ' + grupoEscapeHtml(s.descripcion) + '</div>';
    html += '<div style="opacity:.8;margin:6px 0 10px;">' + grupoEscapeHtml(s.unidad) + ' · ' + formatMoney(parseFloat(s.precio) || 0) + '</div>';
    html += '<select onchange="asignarServicioAGrupo(\'' + s.id + '\', this.value)">';
    html += '<option value="">Asignar a grupo...</option>';

    for (var g = 0; g < grupos.length; g++) {
      html += '<option value="' + grupos[g].id + '">' + grupoEscapeHtml(grupos[g].nombre) + '</option>';
    }

    html += '</select>';
    html += '</div>';
  }

  container.innerHTML = html;
}
// ============================================================
// SUGERENCIA AUTOMÁTICA DE GRUPO
// ============================================================

function sugerirGrupoIA() {
  var descripcionEl = document.getElementById('serv-descripcion');
  var grupoSelect = document.getElementById('serv-grupo') || document.getElementById('serv-categoria');
  var feedback = document.getElementById('feedback-servicio');

  if (!descripcionEl || !grupoSelect) return false;

  var texto = (descripcionEl.value || '').trim().toLowerCase();

  if (!texto) {
    if (feedback) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ Escribe primero la descripción del servicio para sugerir un grupo';
    }
    return false;
  }

  var grupos = typeof obtenerGrupos === 'function' ? obtenerGrupos() : [];
  if (!Array.isArray(grupos) || grupos.length === 0) {
    if (feedback) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ No hay grupos creados para sugerir';
    }
    return false;
  }

  var reglas = [
    { match: ['web', 'landing', 'ui', 'ux', 'responsive', 'figma', 'diseño', 'diseno'], codigo: 'DISENO', nombre: 'Diseño Web' },
    { match: ['frontend', 'backend', 'api', 'cms', 'wordpress', 'strapi', 'deploy', 'desarrollo', 'app'], codigo: 'DESARROLLO', nombre: 'Desarrollo Web' },
    { match: ['logo', 'branding', 'marca', 'identidad', 'papelería', 'papeleria'], codigo: 'BRANDING', nombre: 'Branding' },
    { match: ['marketing', 'ads', 'campaña', 'campana', 'email', 'embudo'], codigo: 'MARKETING', nombre: 'Marketing Digital' },
    { match: ['social', 'redes', 'instagram', 'facebook', 'contenido', 'reels', 'stories'], codigo: 'SOCIAL', nombre: 'Social Media' },
    { match: ['consultoría', 'consultoria', 'auditoría', 'auditoria', 'estrategia', 'asesoría', 'asesoria'], codigo: 'CONSULTORIA', nombre: 'Consultoría' },
    { match: ['hosting', 'dominio', 'ssl', 'mantenimiento', 'soporte', 'servidor'], codigo: 'SOPORTE', nombre: 'Soporte & Hosting' }
  ];

  var mejorRegla = null;
  var mejorPuntaje = 0;

  for (var i = 0; i < reglas.length; i++) {
    var puntaje = 0;

    for (var j = 0; j < reglas[i].match.length; j++) {
      if (texto.indexOf(reglas[i].match[j]) !== -1) {
        puntaje++;
      }
    }

    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejorRegla = reglas[i];
    }
  }

  if (!mejorRegla) {
    if (feedback) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ No pude sugerir un grupo con esa descripción';
    }
    return false;
  }

  var grupoEncontrado = null;

  for (var k = 0; k < grupos.length; k++) {
    var g = grupos[k];
    if (g.codigo === mejorRegla.codigo || g.nombre === mejorRegla.nombre) {
      grupoEncontrado = g;
      break;
    }
  }

  if (!grupoEncontrado) {
    if (feedback) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ Se detectó "' + mejorRegla.nombre + '" pero ese grupo no existe en tu lista';
    }
    return false;
  }

  grupoSelect.value = grupoEncontrado.id;

  if (feedback) {
    feedback.className = 'form-feedback success';
    feedback.textContent = '💡 Grupo sugerido: ' + grupoEncontrado.nombre;
  }

  return false;
}
