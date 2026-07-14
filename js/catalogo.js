// ============================================================
// js/catalogo.js — Catálogo de Servicios
// ============================================================

var serviciosEjemplo = [
  { id: generarId(), codigo: 'WEB-001', categoria: 'diseno_web', descripcion: 'Diseño de landing page de alto impacto (1 sección)', unidad: 'und', precio: 450.00, itbms: 1 },
  { id: generarId(), codigo: 'WEB-002', categoria: 'diseno_web', descripcion: 'Diseño de página web corporativa (hasta 5 páginas)', unidad: 'proyecto', precio: 1800.00, itbms: 1 },
  { id: generarId(), codigo: 'WEB-003', categoria: 'diseno_web', descripcion: 'Diseño de página web e-commerce (hasta 20 productos)', unidad: 'proyecto', precio: 3200.00, itbms: 1 },
  { id: generarId(), codigo: 'WEB-004', categoria: 'diseno_web', descripcion: 'Diseño UI/UX de aplicación móvil', unidad: 'proyecto', precio: 2500.00, itbms: 1 },
  { id: generarId(), codigo: 'WEB-005', categoria: 'diseno_web', descripcion: 'Rediseño completo de sitio web existente', unidad: 'proyecto', precio: 2200.00, itbms: 1 },
  { id: generarId(), codigo: 'WEB-006', categoria: 'diseno_web', descripcion: 'Diseño de página adicional', unidad: 'pagina', precio: 350.00, itbms: 1 },
  { id: generarId(), codigo: 'WEB-007', categoria: 'diseno_web', descripcion: 'Diseño responsive (adaptación móvil)', unidad: 'proyecto', precio: 600.00, itbms: 1 },
  
  { id: generarId(), codigo: 'DEV-001', categoria: 'desarrollo', descripcion: 'Desarrollo frontend (HTML/CSS/JS)', unidad: 'hr', precio: 45.00, itbms: 1 },
  { id: generarId(), codigo: 'DEV-002', categoria: 'desarrollo', descripcion: 'Desarrollo backend (PHP/Node)', unidad: 'hr', precio: 55.00, itbms: 1 },
  { id: generarId(), codigo: 'DEV-003', categoria: 'desarrollo', descripcion: 'Desarrollo web completo (frontend + backend)', unidad: 'proyecto', precio: 4500.00, itbms: 1 },
  { id: generarId(), codigo: 'DEV-004', categoria: 'desarrollo', descripcion: 'Integración de CMS (WordPress/Strapi)', unidad: 'proyecto', precio: 800.00, itbms: 1 },
  { id: generarId(), codigo: 'DEV-005', categoria: 'desarrollo', descripcion: 'Desarrollo de API REST', unidad: 'proyecto', precio: 1500.00, itbms: 1 },
  { id: generarId(), codigo: 'DEV-006', categoria: 'desarrollo', descripcion: 'Configuración de hosting y deploy', unidad: 'und', precio: 200.00, itbms: 1 },
  { id: generarId(), codigo: 'DEV-007', categoria: 'desarrollo', descripcion: 'Optimización de velocidad (Core Web Vitals)', unidad: 'proyecto', precio: 600.00, itbms: 1 },
  
  { id: generarId(), codigo: 'BRD-001', categoria: 'branding', descripcion: 'Diseño de logotipo (3 propuestas + revisiones)', unidad: 'proyecto', precio: 650.00, itbms: 1 },
  { id: generarId(), codigo: 'BRD-002', categoria: 'branding', descripcion: 'Manual de marca completo', unidad: 'proyecto', precio: 1200.00, itbms: 1 },
  { id: generarId(), codigo: 'BRD-003', categoria: 'branding', descripcion: 'Paleta de colores y tipografía', unidad: 'proyecto', precio: 300.00, itbms: 1 },
  { id: generarId(), codigo: 'BRD-004', categoria: 'branding', descripcion: 'Tarjetas de presentación (diseño)', unidad: 'und', precio: 80.00, itbms: 1 },
  { id: generarId(), codigo: 'BRD-005', categoria: 'branding', descripcion: 'Papelería corporativa completa', unidad: 'paquete', precio: 450.00, itbms: 1 },
  { id: generarId(), codigo: 'BRD-006', categoria: 'branding', descripcion: 'Identidad visual para redes sociales', unidad: 'paquete', precio: 350.00, itbms: 1 },
  
  { id: generarId(), codigo: 'MKT-001', categoria: 'marketing', descripcion: 'Estrategia de marketing digital mensual', unidad: 'mes', precio: 800.00, itbms: 1 },
  { id: generarId(), codigo: 'MKT-002', categoria: 'marketing', descripcion: 'Campaña Google Ads (setup + 1 mes)', unidad: 'paquete', precio: 600.00, itbms: 1 },
  { id: generarId(), codigo: 'MKT-003', categoria: 'marketing', descripcion: 'Campaña Meta Ads (setup + 1 mes)', unidad: 'paquete', precio: 550.00, itbms: 1 },
  { id: generarId(), codigo: 'MKT-004', categoria: 'marketing', descripcion: 'Email marketing (diseño + envío)', unidad: 'paquete', precio: 400.00, itbms: 1 },
  { id: generarId(), codigo: 'MKT-005', categoria: 'marketing', descripcion: 'Copywriting para landing page', unidad: 'und', precio: 150.00, itbms: 1 },
  
  { id: generarId(), codigo: 'SM-001', categoria: 'social_media', descripcion: 'Gestión mensual de redes sociales (4 plataformas)', unidad: 'mes', precio: 600.00, itbms: 1 },
  { id: generarId(), codigo: 'SM-002', categoria: 'social_media', descripcion: 'Diseño de post para redes (12 piezas)', unidad: 'paquete', precio: 300.00, itbms: 1 },
  { id: generarId(), codigo: 'SM-003', categoria: 'social_media', descripcion: 'Diseño de stories/reels (8 piezas)', unidad: 'paquete', precio: 250.00, itbms: 1 },
  { id: generarId(), codigo: 'SM-004', categoria: 'social_media', descripcion: 'Calendario editorial mensual', unidad: 'mes', precio: 200.00, itbms: 1 },
  
  { id: generarId(), codigo: 'SEO-001', categoria: 'seo', descripcion: 'Auditoría SEO completa', unidad: 'proyecto', precio: 500.00, itbms: 1 },
  { id: generarId(), codigo: 'SEO-002', categoria: 'seo', descripcion: 'Optimización SEO on-page mensual', unidad: 'mes', precio: 450.00, itbms: 1 },
  { id: generarId(), codigo: 'SEO-003', categoria: 'seo', descripcion: 'Estrategia de link building', unidad: 'mes', precio: 350.00, itbms: 1 },
  
  { id: generarId(), codigo: 'FOT-001', categoria: 'fotografia', descripcion: 'Sesión fotográfica de producto (20 fotos)', unidad: 'paquete', precio: 400.00, itbms: 1 },
  { id: generarId(), codigo: 'FOT-002', categoria: 'fotografia', descripcion: 'Video corporativo (hasta 2 min)', unidad: 'proyecto', precio: 1200.00, itbms: 1 },
  { id: generarId(), codigo: 'FOT-003', categoria: 'fotografia', descripcion: 'Edición de video profesional', unidad: 'hr', precio: 60.00, itbms: 1 },
  { id: generarId(), codigo: 'FOT-004', categoria: 'fotografia', descripcion: 'Motion graphics / animación', unidad: 'hr', precio: 70.00, itbms: 1 },
  
  { id: generarId(), codigo: 'CON-001', categoria: 'consultoria', descripcion: 'Consultoría de marca (sesión 1hr)', unidad: 'hr', precio: 120.00, itbms: 1 },
  { id: generarId(), codigo: 'CON-002', categoria: 'consultoria', descripcion: 'Consultoría de UX/UI', unidad: 'hr', precio: 100.00, itbms: 1 },
  { id: generarId(), codigo: 'CON-003', categoria: 'consultoria', descripcion: 'Auditoría de presencia digital', unidad: 'proyecto', precio: 350.00, itbms: 1 },
  
  { id: generarId(), codigo: 'MNT-001', categoria: 'mantenimiento', descripcion: 'Mantenimiento web mensual (básico)', unidad: 'mes', precio: 150.00, itbms: 1 },
  { id: generarId(), codigo: 'MNT-002', categoria: 'mantenimiento', descripcion: 'Mantenimiento web mensual (premium)', unidad: 'mes', precio: 350.00, itbms: 1 },
  { id: generarId(), codigo: 'MNT-003', categoria: 'mantenimiento', descripcion: 'Soporte técnico por hora', unidad: 'hr', precio: 50.00, itbms: 1 },
  
  { id: generarId(), codigo: 'HOS-001', categoria: 'hosting', descripcion: 'Hosting compartido (1 año)', unidad: 'und', precio: 120.00, itbms: 1 },
  { id: generarId(), codigo: 'HOS-002', categoria: 'hosting', descripcion: 'Hosting VPS (1 año)', unidad: 'und', precio: 350.00, itbms: 1 },
  { id: generarId(), codigo: 'HOS-003', categoria: 'hosting', descripcion: 'Registro de dominio (.com)', unidad: 'und', precio: 15.00, itbms: 1 },
  { id: generarId(), codigo: 'HOS-004', categoria: 'hosting', descripcion: 'Certificado SSL', unidad: 'und', precio: 50.00, itbms: 1 }
];

function inicializarCatalogo() {
  var data = getData(STORAGE_KEYS.SERVICIOS);
  if (!data || data.length === 0) {
    setData(STORAGE_KEYS.SERVICIOS, serviciosEjemplo);
    console.log('[Catalogo] Servicios de ejemplo cargados');
  }
}

function obtenerServicios() {
  return getData(STORAGE_KEYS.SERVICIOS);
}

function guardarServicios(servicios) {
  setData(STORAGE_KEYS.SERVICIOS, servicios);
}

// ============================================================
// CRUD
// ============================================================
function guardarServicio(event) {
  event.preventDefault();
  var feedback = document.getElementById('feedback-servicio');
  
  var codigo = document.getElementById('serv-codigo').value.trim().toUpperCase();
  var servicios = obtenerServicios();
  
  for (var i = 0; i < servicios.length; i++) {
    if (servicios[i].codigo === codigo) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ El código "' + codigo + '" ya existe';
      return false;
    }
  }
  
  var nuevoServicio = {
    id: generarId(),
    codigo: codigo,
    categoria: document.getElementById('serv-categoria').value,
    descripcion: document.getElementById('serv-descripcion').value.trim(),
    unidad: document.getElementById('serv-unidad').value,
    precio: parseFloat(document.getElementById('serv-precio').value),
    itbms: parseInt(document.getElementById('serv-itbms').value)
  };
  
  servicios.push(nuevoServicio);
  servicios.sort(function(a, b) { return a.codigo.localeCompare(b.codigo); });
  guardarServicios(servicios);
  
  feedback.className = 'form-feedback success';
  feedback.textContent = '✅ Servicio "' + codigo + '" guardado correctamente';
  document.getElementById('formServicio').reset();
  
  renderServicios();
  actualizarVistaJSON();
  return false;
}

function eliminarServicio(id) {
  if (!confirm('¿Eliminar este servicio?')) return;
  deleteItem(STORAGE_KEYS.SERVICIOS, id);
  renderServicios();
  actualizarVistaJSON();
}

// ============================================================
// RENDER
// ============================================================
function renderServicios(filtroTexto, filtroCategoria) {
  var servicios = obtenerServicios();
  var tbody = document.getElementById('tbodyServicios');
  if (!tbody) return;
  
  if (filtroTexto) {
    var term = filtroTexto.toLowerCase();
    servicios = servicios.filter(function(s) {
      return s.descripcion.toLowerCase().indexOf(term) !== -1 ||
             s.codigo.toLowerCase().indexOf(term) !== -1;
    });
  }
  
  if (filtroCategoria && filtroCategoria !== 'todos') {
    servicios = servicios.filter(function(s) { return s.categoria === filtroCategoria; });
  }
  
  var html = '';
  for (var i = 0; i < servicios.length; i++) {
    var s = servicios[i];
    var catClass = 'cat-' + s.categoria.replace('_', '-');
    html += '<tr>' +
      '<td><strong style="color:#6bbd45">' + s.codigo + '</strong></td>' +
      '<td><span class="td-categoria ' + catClass + '">' + (CAT_LABELS[s.categoria] || s.categoria) + '</span></td>' +
      '<td>' + s.descripcion + '</td>' +
      '<td>' + s.unidad + '</td>' +
      '<td class="td-monto">' + formatMoney(s.precio) + '</td>' +
      '<td>' + (s.itbms ? 'Sí (7%)' : 'No') + '</td>' +
      '<td class="td-actions">' +
        '<button class="btn-icon" onclick="eliminarServicio(\'' + s.id + '\')" title="Eliminar">🗑</button>' +
      '</td>' +
      '</tr>';
  }
  
  tbody.innerHTML = html;
}

function filtrarServicios() {
  var texto = document.getElementById('buscar-servicio').value;
  renderServicios(texto, null);
}

function filtrarServiciosCategoria(cat) {
  var btns = document.querySelectorAll('#catalogo-servicios .filter-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  if (event && event.target) event.target.classList.add('active');
  renderServicios(null, cat);
}

function actualizarVistaJSON() {
  var preview = document.getElementById('json-preview');
  if (preview) {
    var data = {
      catalogo_servicios: obtenerServicios(),
      exportado: new Date().toISOString(),
      total: obtenerServicios().length
    };
    preview.textContent = JSON.stringify(data, null, 2);
  }
}

// ============================================================
// IMPORT/EXPORT
// ============================================================
function exportarCatalogoJSON() {
  var servicios = obtenerServicios();
  var data = {
    catalogo_servicios: servicios,
    exportado: new Date().toISOString(),
    total: servicios.length
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'gn-catalogo-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importarCatalogoJSON(input) {
  var file = input.files[0];
  if (!file) return;
  
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      var nuevos = data.catalogo_servicios || data.servicios || data.items || [];
      if (!Array.isArray(nuevos) || nuevos.length === 0) {
        alert('❌ El archivo no contiene servicios válidos');
        return;
      }
      
      var actuales = obtenerServicios();
      var codigosExistentes = {};
      for (var i = 0; i < actuales.length; i++) {
        codigosExistentes[actuales[i].codigo] = true;
      }
      
      var agregados = 0;
      for (var i = 0; i < nuevos.length; i++) {
        var nuevo = nuevos[i];
        if (!nuevo.id) nuevo.id = generarId();
        if (!codigosExistentes[nuevo.codigo]) {
          actuales.push(nuevo);
          codigosExistentes[nuevo.codigo] = true;
          agregados++;
        }
      }
      
      actuales.sort(function(a, b) { return a.codigo.localeCompare(b.codigo); });
      guardarServicios(actuales);
      
      renderServicios();
      actualizarVistaJSON();
      alert('✅ ' + agregados + ' servicios nuevos importados. Total: ' + actuales.length);
    } catch (err) {
      alert('❌ Error al importar: ' + err.message);
    }
  };
  reader.readAsText(file);
  input.value = '';
}
