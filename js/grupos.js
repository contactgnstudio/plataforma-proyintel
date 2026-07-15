// ============================================================
// js/grupos.js — Gestión de Grupos de Servicios
// ============================================================

var GRUPOS_KEY = 'gn_grupos_servicios';
var GRUPO_SERVICIOS_KEY = 'gn_grupo_servicio_map'; // { servicioId: grupoId }

var COLORES_GRUPO = {
  green:  { bg: 'rgba(107,189,69,0.15)',  border: '#6bbd45',  label: '🟢 Verde' },
  blue:   { bg: 'rgba(79,140,255,0.15)',  border: '#4f8cff',  label: '🔵 Azul' },
  purple: { bg: 'rgba(168,85,247,0.15)',  border: '#a855f7',  label: '🟣 Púrpura' },
  orange: { bg: 'rgba(245,158,11,0.15)',  border: '#f59e0b',  label: '🟠 Naranja' },
  red:    { bg: 'rgba(239,68,68,0.15)',   border: '#ef4444',  label: '🔴 Rojo' },
  teal:   { bg: 'rgba(20,184,166,0.15)',  border: '#14b8a6',  label: '🩵 Turquesa' },
  pink:   { bg: 'rgba(236,72,153,0.15)',  border: '#ec4899',  label: '🩷 Rosa' },
  gray:   { bg: 'rgba(100,116,139,0.15)', border: '#64748b',  label: '⚪ Gris' }
};

var gruposEjemplo = [
  { id: generarId(), codigo: 'DESARROLLO', nombre: 'Desarrollo Web', descripcion: 'Programación, APIs, CMS, deploy', color: 'green', orden: 1, creadoEn: new Date().toISOString() },
  { id: generarId(), codigo: 'DISENO',     nombre: 'Diseño Web',     descripcion: 'UI/UX, landing pages, responsive', color: 'blue', orden: 2, creadoEn: new Date().toISOString() },
  { id: generarId(), codigo: 'BRANDING',   nombre: 'Branding',       descripcion: 'Logotipos, manual de marca, papelería', color: 'purple', orden: 3, creadoEn: new Date().toISOString() },
  { id: generarId(), codigo: 'MARKETING',  nombre: 'Marketing Digital', descripcion: 'Ads, SEO, email marketing', color: 'orange', orden: 4, creadoEn: new Date().toISOString() },
  { id: generarId(), codigo: 'SOCIAL',     nombre: 'Social Media',   descripcion: 'Gestión de redes, contenido', color: 'pink', orden: 5, creadoEn: new Date().toISOString() },
  { id: generarId(), codigo: 'CONSULTORIA', nombre: 'Consultoría',   descripcion: 'Auditorías, estrategia, asesoría', color: 'teal', orden: 6, creadoEn: new Date().toISOString() },
  { id: generarId(), codigo: 'SOPORTE',    nombre: 'Soporte & Hosting', descripcion: 'Mantenimiento, hosting, dominios', color: 'gray', orden: 7, creadoEn: new Date().toISOString() }
];

// ============================================================
// INICIALIZAR
// ============================================================
function inicializarGrupos() {
  var grupos = getData(GRUPOS_KEY);
  if (!grupos || grupos.length === 0) {
    setData(GRUPOS_KEY, gruposEjemplo);
    console.log('[Grupos] Grupos de ejemplo cargados');
  }
  
  var map = getData(GRUPO_SERVICIOS_KEY);
  if (!map) setData(GRUPO_SERVICIOS_KEY, {});
  
  renderGrupos();
  actualizarSelectGrupos();
  renderServiciosSinGrupo();
}

function obtenerGrupos() {
  return getData(GRUPOS_KEY);
}

function obtenerMapaGrupos() {
  return getData(GRUPO_SERVICIOS_KEY) || {};
}

function guardarMapaGrupos(map) {
  setData(GRUPO_SERVICIOS_KEY, map);
}

// ============================================================
// CRUD GRUPOS
// ============================================================
function guardarGrupo(event) {
  event.preventDefault();
  var feedback = document.getElementById('feedback-grupo');
  
  var codigo = document.getElementById('grp-codigo').value.trim().toUpperCase();
  var grupos = obtenerGrupos();
  
  for (var i = 0; i < grupos.length; i++) {
    if (grupos[i].codigo === codigo) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ El código "' + codigo + '" ya existe';
      return false;
    }
  }
  
  var nuevoGrupo = {
    id: generarId(),
    codigo: codigo,
    nombre: document.getElementById('grp-nombre').value.trim(),
    descripcion: document.getElementById('grp-descripcion').value.trim(),
    color: document.getElementById('grp-color').value,
    orden: parseInt(document.getElementById('grp-orden').value) || 99,
    creadoEn: new Date().toISOString()
  };
  
  grupos.push(nuevoGrupo);
  grupos.sort(function(a, b) { return a.orden - b.orden; });
  setData(GRUPOS_KEY, grupos);
  
  feedback.className = 'form-feedback success';
  feedback.textContent = '✅ Grupo "' + nuevoGrupo.nombre + '" creado';
  document.getElementById('formGrupo').reset();
  
  renderGrupos();
  actualizarSelectGrupos();
  renderServiciosSinGrupo();
  return false;
}

function eliminarGrupo(id) {
  if (!confirm('¿Eliminar este grupo? Los servicios asignados quedarán sin grupo.')) return;
  
  // Quitar asignaciones de servicios a este grupo
  var map = obtenerMapaGrupos();
  var nuevoMap = {};
  for (var sid in map) {
    if (map[sid] !== id) nuevoMap[sid] = map[sid];
  }
  guardarMapaGrupos(nuevoMap);
  
  var grupos = obtenerGrupos().filter(function(g) { return g.id !== id; });
  setData(GRUPOS_KEY, grupos);
  
  renderGrupos();
  actualizarSelectGrupos();
  renderServiciosSinGrupo();
}

// ============================================================
// RENDER GRUPOS
// ============================================================
function renderGrupos(filtro) {
  var tbody = document.getElementById('tbodyGrupos');
  if (!tbody) return;
  
  var grupos = obtenerGrupos();
  var map = obtenerMapaGrupos();
  
  // Contar servicios por grupo
  var conteo = {};
  for (var sid in map) {
    var gid = map[sid];
    conteo[gid] = (conteo[gid] || 0) + 1;
  }
  
  if (filtro) {
    var term = filtro.toLowerCase();
    grupos = grupos.filter(function(g) {
      return g.nombre.toLowerCase().indexOf(term) !== -1 ||
             g.codigo.toLowerCase().indexOf(term) !== -1;
    });
  }
  
  if (grupos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="tabla-vacia"><div class="tabla-vacia-icon">📁</div>No hay grupos creados</td></tr>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < grupos.length; i++) {
    var g = grupos[i];
    var color = COLORES_GRUPO[g.color] || COLORES_GRUPO.gray;
    var cantidad = conteo[g.id] || 0;
    
    html += '<tr>' +
      '<td>' + g.orden + '</td>' +
      '<td><strong style="color:' + color.border + '">' + g.codigo + '</strong></td>' +
      '<td>' + g.nombre + '</td>' +
      '<td>' + (g.descripcion || '—') + '</td>' +
      '<td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + color.border + ';margin-right:6px;"></span>' + color.label + '</td>' +
      '<td>' + cantidad + ' servicio' + (cantidad !== 1 ? 's' : '') + '</td>' +
      '<td class="td-actions">' +
        '<button class="btn-icon" onclick="eliminarGrupo(\'' + g.id + '\')" title="Eliminar">🗑</button>' +
      '</td>' +
      '</tr>';
  }
  
  tbody.innerHTML = html;
}

function filtrarGrupos() {
  var texto = document.getElementById('buscar-grupo').value;
  renderGrupos(texto);
}

// ============================================================
// ASIGNAR SERVICIOS A GRUPOS
// ============================================================
function actualizarSelectGrupos() {
  var select = document.getElementById('asig-grupo');
  if (!select) return;
  
  var grupos = obtenerGrupos();
  var valActual = select.value;
  select.innerHTML = '<option value="">Selecciona un grupo</option>';
  
  for (var i = 0; i < grupos.length; i++) {
    var g = grupos[i];
    select.innerHTML += '<option value="' + g.id + '">' + g.codigo + ' — ' + g.nombre + '</option>';
  }
  
  select.value = valActual;
}

function renderServiciosSinGrupo() {
  var container = document.getElementById('servicios-sin-grupo');
  if (!container) return;
  
  var servicios = obtenerServicios();
  var map = obtenerMapaGrupos();
  var grupos = obtenerGrupos();
  
  // Servicios sin grupo asignado
  var sinGrupo = [];
  for (var i = 0; i < servicios.length; i++) {
    if (!map[servicios[i].id]) {
      sinGrupo.push(servicios[i]);
    }
  }
  
  if (sinGrupo.length === 0) {
    container.innerHTML = '<p class="tabla-vacia" style="padding:20px;">✅ Todos los servicios tienen un grupo asignado</p>';
    return;
  }
  
  var html = '<div class="checklist-grid">';
  for (var i = 0; i < sinGrupo.length; i++) {
    var s = sinGrupo[i];
    html += '<label class="checklist-item">' +
      '<input type="checkbox" value="' + s.id + '" class="chk-servicio-grupo">' +
      '<span class="checkmark"></span>' +
      '<span class="checklist-text">' +
        '<strong style="color:#6bbd45">' + s.codigo + '</strong> — ' + s.descripcion +
        '<small style="color:#8a8a96;display:block;">' + (CAT_LABELS[s.categoria] || s.categoria) + ' | ' + formatMoney(s.precio) + '</small>' +
      '</span>' +
      '</label>';
  }
  html += '</div>';
  
  container.innerHTML = html;
}

function asignarServiciosAGrupo() {
  var feedback = document.getElementById('feedback-asignacion');
  var grupoId = document.getElementById('asig-grupo').value;
  
  if (!grupoId) {
    feedback.className = 'form-feedback error';
    feedback.textContent = '❌ Selecciona un grupo primero';
    return;
  }
  
  var checkboxes = document.querySelectorAll('.chk-servicio-grupo:checked');
  if (checkboxes.length === 0) {
    feedback.className = 'form-feedback error';
    feedback.textContent = '❌ Selecciona al menos un servicio';
    return;
  }
  
  var map = obtenerMapaGrupos();
  for (var i = 0; i < checkboxes.length; i++) {
    map[checkboxes[i].value] = grupoId;
  }
  guardarMapaGrupos(map);
  
  feedback.className = 'form-feedback success';
  feedback.textContent = '✅ ' + checkboxes.length + ' servicio(s) asignado(s) al grupo';
  
  renderGrupos();
  renderServiciosSinGrupo();
}

// ============================================================
// FUNCIONES PARA COTIZACIONES (agrupar items)
// ============================================================
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

function sugerirGrupoParaServicio(descripcion, categoria) {
  // FASE 1: Manual — retorna null (no hay sugerencia automática aún)
  // FASE 2: Aquí irá la lógica de aprendizaje
  return null;
}
