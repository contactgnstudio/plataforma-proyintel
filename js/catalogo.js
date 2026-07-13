// ============================================================
// js/catalogo.js - Catálogo de Items/Servicios
// ============================================================

const STORAGE_CATALOGO = 'proyintel_catalogo_items';

// Items de ejemplo basados en los Excel reales
const itemsEjemplo = [
  { codigo: 'ELEC-001', categoria: 'electricidad', descripcion: 'Suministro e instalación de lámparas LED 2x2', unidad: 'und', precio: 60.00, itbms: 1 },
  { codigo: 'ELEC-002', categoria: 'electricidad', descripcion: 'Suministro e instalación de lámparas redondas de 6"', unidad: 'und', precio: 21.00, itbms: 1 },
  { codigo: 'ELEC-003', categoria: 'electricidad', descripcion: 'Suministro e instalación de switch doble de luces', unidad: 'und', precio: 15.00, itbms: 1 },
  { codigo: 'ELEC-004', categoria: 'electricidad', descripcion: 'Instalación de ojos de buey', unidad: 'und', precio: 8.00, itbms: 1 },
  { codigo: 'ELEC-005', categoria: 'electricidad', descripcion: 'Suministro e instalación de salida eléctrica 110V-60Hz', unidad: 'und', precio: 40.00, itbms: 1 },
  { codigo: 'ELEC-006', categoria: 'electricidad', descripcion: 'Suministro e instalación de salida eléctrica 220V', unidad: 'und', precio: 230.00, itbms: 1 },
  { codigo: 'ELEC-007', categoria: 'electricidad', descripcion: 'Suministro e instalación de interruptor sencillo', unidad: 'und', precio: 25.02, itbms: 1 },
  { codigo: 'ELEC-008', categoria: 'electricidad', descripcion: 'Suministro de cableado estructurado CAT6', unidad: 'm', precio: 2.60, itbms: 1 },
  { codigo: 'ELEC-009', categoria: 'electricidad', descripcion: 'Suministro e instalación de breaker trifásico 120/208V', unidad: 'und', precio: 850.00, itbms: 1 },
  { codigo: 'ELEC-010', categoria: 'electricidad', descripcion: 'Mantenimiento de tableros eléctricos', unidad: 'und', precio: 350.00, itbms: 1 },
  
  { codigo: 'PINT-001', categoria: 'pintura', descripcion: 'Suministro y aplicación de pintura impermeabilizante en pared', unidad: 'm2', precio: 3.00, itbms: 1 },
  { codigo: 'PINT-002', categoria: 'pintura', descripcion: 'Suministro y aplicación de pintura impermeabilizante Koraza Sol & Lluvia', unidad: 'm2', precio: 3.00, itbms: 1 },
  { codigo: 'PINT-003', categoria: 'pintura', descripcion: 'Suministro y aplicación de pintura en puertas enrollables', unidad: 'und', precio: 120.00, itbms: 1 },
  { codigo: 'PINT-004', categoria: 'pintura', descripcion: 'Suministro y aplicación de pintura para delimitación líneas amarillas', unidad: 'm2', precio: 3.21, itbms: 1 },
  { codigo: 'PINT-005', categoria: 'pintura', descripcion: 'Lavado de paredes de fachada con hidrolavadora', unidad: 'm2', precio: 1.50, itbms: 1 },
  { codigo: 'PINT-006', categoria: 'pintura', descripcion: 'Tratamiento para hongos en paredes externas', unidad: 'm2', precio: 2.00, itbms: 1 },
  
  { codigo: 'PLOM-001', categoria: 'plomeria', descripcion: 'Suministro e instalación de lavamanos', unidad: 'und', precio: 120.00, itbms: 1 },
  { codigo: 'PLOM-002', categoria: 'plomeria', descripcion: 'Suministro e instalación de grifería para lavamanos', unidad: 'und', precio: 120.00, itbms: 1 },
  { codigo: 'PLOM-003', categoria: 'plomeria', descripcion: 'Suministro e instalación de inodoro', unidad: 'und', precio: 270.00, itbms: 1 },
  { codigo: 'PLOM-004', categoria: 'plomeria', descripcion: 'Suministro e instalación de urinal', unidad: 'und', precio: 220.00, itbms: 1 },
  { codigo: 'PLOM-005', categoria: 'plomeria', descripcion: 'Reparación de fuga en plomería', unidad: 'und', precio: 75.00, itbms: 1 },
  { codigo: 'PLOM-006', categoria: 'plomeria', descripcion: 'Suministro e instalación de bomba de llenado', unidad: 'und', precio: 550.00, itbms: 1 },
  
  { codigo: 'CONST-001', categoria: 'construccion', descripcion: 'Suministro e instalación de laminas EPS', unidad: 'm2', precio: 55.00, itbms: 1 },
  { codigo: 'CONST-002', categoria: 'construccion', descripcion: 'Suministro e instalación de cielo raso suspendido', unidad: 'm2', precio: 11.00, itbms: 1 },
  { codigo: 'CONST-003', categoria: 'construccion', descripcion: 'Suministro e instalación de revestimiento de paredes', unidad: 'm2', precio: 45.00, itbms: 1 },
  { codigo: 'CONST-004', categoria: 'construccion', descripcion: 'Suministro e instalación de revestimiento de piso', unidad: 'm2', precio: 9.00, itbms: 1 },
  { codigo: 'CONST-005', categoria: 'construccion', descripcion: 'Demolición y construcción de paredes', unidad: 'm2', precio: 26.00, itbms: 1 },
  { codigo: 'CONST-006', categoria: 'construccion', descripcion: 'Resane de grietas y obra gris', unidad: 'm2', precio: 2.50, itbms: 1 },
  
  { codigo: 'MANT-001', categoria: 'mantenimiento', descripcion: 'Mantenimiento de sistema de bombeo general', unidad: 'und', precio: 125.00, itbms: 1 },
  { codigo: 'MANT-002', categoria: 'mantenimiento', descripcion: 'Mantenimiento de A/A de 12,000 BTU', unidad: 'und', precio: 30.00, itbms: 1 },
  { codigo: 'MANT-003', categoria: 'mantenimiento', descripcion: 'Mantenimiento de A/A de 24,000 BTU', unidad: 'und', precio: 40.00, itbms: 1 },
  { codigo: 'MANT-004', categoria: 'mantenimiento', descripcion: 'Mantenimiento de puertas enrollables internas', unidad: 'und', precio: 120.00, itbms: 1 },
  { codigo: 'MANT-005', categoria: 'mantenimiento', descripcion: 'Mantenimiento de puertas enrollables externas', unidad: 'und', precio: 250.00, itbms: 1 },
  { codigo: 'MANT-006', categoria: 'mantenimiento', descripcion: 'Mantenimiento de sistemas eléctricos mensual', unidad: 'und', precio: 165.00, itbms: 1 },
  
  { codigo: 'ILUM-001', categoria: 'iluminacion', descripcion: 'Suministro e instalación de lámparas tipo LED UFO 100W', unidad: 'und', precio: 40.00, itbms: 1 },
  { codigo: 'ILUM-002', categoria: 'iluminacion', descripcion: 'Suministro e instalación de lámparas tipo fotocelda', unidad: 'und', precio: 40.00, itbms: 1 },
  { codigo: 'ILUM-003', categoria: 'iluminacion', descripcion: 'Conversión de lámparas de tubo a LED', unidad: 'und', precio: 4000.00, itbms: 1 },
  
  { codigo: 'TECHO-001', categoria: 'techo', descripcion: 'Suministro e instalación de láminas de zinc galvanizadas', unidad: 'm2', precio: 7.50, itbms: 1 },
  { codigo: 'TECHO-002', categoria: 'techo', descripcion: 'Suministro de M/O por instalación de techo', unidad: 'm2', precio: 6.50, itbms: 1 },
  { codigo: 'TECHO-003', categoria: 'techo', descripcion: 'Suministro e instalación de soportería y tornillería', unidad: 'und', precio: 1500.00, itbms: 1 },
  { codigo: 'TECHO-004', categoria: 'techo', descripcion: 'Impermeabilización de cumbrera', unidad: 'm', precio: 2.10, itbms: 1 },
  
  { codigo: 'PUERT-001', categoria: 'puertas', descripcion: 'Suministro, fabricación e instalación de puerta corrediza 2.40x1.50', unidad: 'und', precio: 575.00, itbms: 1 },
  { codigo: 'PUERT-002', categoria: 'puertas', descripcion: 'Suministro, fabricación e instalación de puerta abatible 2.40x1.50', unidad: 'und', precio: 850.00, itbms: 1 },
  { codigo: 'PUERT-003', categoria: 'puertas', descripcion: 'Suministro e instalación de guías para puerta corrediza', unidad: 'und', precio: 125.00, itbms: 1 },
  { codigo: 'PUERT-004', categoria: 'puertas', descripcion: 'Suministro e instalación de cerradura para puerta', unidad: 'und', precio: 120.00, itbms: 1 },
  
  { codigo: 'ACI-001', categoria: 'sistemas_aci', descripcion: 'Mantenimiento de panel de ACI - Revisión de zonas', unidad: 'und', precio: 160.00, itbms: 1 },
  { codigo: 'ACI-002', categoria: 'sistemas_aci', descripcion: 'Mantenimiento de detectores de humo fotoelectricos', unidad: 'und', precio: 25.00, itbms: 1 },
  { codigo: 'ACI-003', categoria: 'sistemas_aci', descripcion: 'Suministro e instalación de baterías de respaldo 12VDC-5Ah', unidad: 'und', precio: 60.00, itbms: 1 },
  
  { codigo: 'BOMB-001', categoria: 'bombeo', descripcion: 'Suministro e instalación de controlador de presión', unidad: 'und', precio: 140.00, itbms: 1 },
  { codigo: 'BOMB-002', categoria: 'bombeo', descripcion: 'Suministro e instalación de bomba de llenado', unidad: 'und', precio: 550.00, itbms: 1 },
  { codigo: 'BOMB-003', categoria: 'bombeo', descripcion: 'Suministro e instalación de manómetro de presión', unidad: 'und', precio: 120.00, itbms: 1 },
  
  { codigo: 'VENT-001', categoria: 'ventilacion', descripcion: 'Suministro e instalación de ventilador de pared', unidad: 'und', precio: 150.00, itbms: 1 },
  { codigo: 'VENT-002', categoria: 'ventilacion', descripcion: 'Suministro e instalación de ventilador tipo campana', unidad: 'und', precio: 150.00, itbms: 1 },
  { codigo: 'VENT-003', categoria: 'ventilacion', descripcion: 'Suministro de M/O por desmonte de ventiladores', unidad: 'und', precio: 650.00, itbms: 1 },
  
  { codigo: 'IMPER-001', categoria: 'construccion', descripcion: 'Suministro y aplicación de impermeabilización en ventanas', unidad: 'und', precio: 15.00, itbms: 1 },
  { codigo: 'IMPER-002', categoria: 'construccion', descripcion: 'Suministro y aplicación de impermeabilización en techo', unidad: 'm2', precio: 3.75, itbms: 1 },
  
  { codigo: 'MO-001', categoria: 'otros', descripcion: 'Suministro de mano de obra general', unidad: 'hr', precio: 25.00, itbms: 1 },
  { codigo: 'MO-002', categoria: 'otros', descripcion: 'Suministro de mano de obra especializada', unidad: 'hr', precio: 45.00, itbms: 1 },
  { codigo: 'MO-003', categoria: 'otros', descripcion: 'Suministro de mano de obra por desmonte', unidad: 'und', precio: 250.00, itbms: 1 },
  { codigo: 'MO-004', categoria: 'otros', descripcion: 'Suministro de mano de obra por instalación', unidad: 'und', precio: 350.00, itbms: 1 },
  
  { codigo: 'MAT-001', categoria: 'otros', descripcion: 'Suministro de tornillería y parcho para techo', unidad: 'm2', precio: 1.15, itbms: 1 },
  { codigo: 'MAT-002', categoria: 'otros', descripcion: 'Suministro de laminas translucidas', unidad: 'und', precio: 120.00, itbms: 1 },
  { codigo: 'MAT-003', categoria: 'otros', descripcion: 'Suministro de canalización y alambrado', unidad: 'm', precio: 15.00, itbms: 1 },
  
  { codigo: 'EQUIP-001', categoria: 'otros', descripcion: 'Alquiler de grúa RT 100 toneladas', unidad: 'dia', precio: 1480.00, itbms: 1 },
  { codigo: 'EQUIP-002', categoria: 'otros', descripcion: 'Alquiler de telehandler 4.5 toneladas', unidad: 'dia', precio: 750.00, itbms: 1 },
  { codigo: 'EQUIP-003', categoria: 'otros', descripcion: 'Alquiler de plataforma de tijera 12mts', unidad: 'dia', precio: 180.00, itbms: 1 },
  
  { codigo: 'TRANS-001', categoria: 'otros', descripcion: 'Transporte de equipo a sitio de proyecto ida y vuelta', unidad: 'viaje', precio: 3000.00, itbms: 1 },
  { codigo: 'TRANS-002', categoria: 'otros', descripcion: 'Entrada y salida de Zona Libre', unidad: 'viaje', precio: 250.00, itbms: 1 },
  { codigo: 'PERM-001', categoria: 'otros', descripcion: 'Permisología de operación', unidad: 'und', precio: 350.00, itbms: 1 }
];

// ============================================================
// INICIALIZACIÓN
// ============================================================
function inicializarCatalogo() {
  var data = localStorage.getItem(STORAGE_CATALOGO);
  if (!data) {
    localStorage.setItem(STORAGE_CATALOGO, JSON.stringify(itemsEjemplo));
    console.log('[Catalogo] Items de ejemplo cargados');
  }
}

function obtenerItems() {
  try {
    var data = localStorage.getItem(STORAGE_CATALOGO);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function guardarItems(items) {
  localStorage.setItem(STORAGE_CATALOGO, JSON.stringify(items));
}

// ============================================================
// CRUD
// ============================================================
function guardarItem(event) {
  event.preventDefault();
  var feedback = document.getElementById('feedback-item');
  
  var codigo = document.getElementById('item-codigo').value.trim().toUpperCase();
  var items = obtenerItems();
  
  // Verificar código único
  for (var i = 0; i < items.length; i++) {
    if (items[i].codigo === codigo) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ El código "' + codigo + '" ya existe';
      return false;
    }
  }
  
  var nuevoItem = {
    codigo: codigo,
    categoria: document.getElementById('item-categoria').value,
    descripcion: document.getElementById('item-descripcion').value.trim(),
    unidad: document.getElementById('item-unidad').value,
    precio: parseFloat(document.getElementById('item-precio').value),
    itbms: parseInt(document.getElementById('item-itbms').value)
  };
  
  items.push(nuevoItem);
  items.sort(function(a, b) { return a.codigo.localeCompare(b.codigo); });
  guardarItems(items);
  
  feedback.className = 'form-feedback success';
  feedback.textContent = '✅ Item "' + codigo + '" guardado correctamente';
  document.getElementById('formItem').reset();
  
  renderItems();
  actualizarVistaJSON();
  return false;
}

function eliminarItem(codigo) {
  if (!confirm('¿Eliminar el item "' + codigo + '"?')) return;
  var items = obtenerItems().filter(function(item) { return item.codigo !== codigo; });
  guardarItems(items);
  renderItems();
  actualizarVistaJSON();
}

// ============================================================
// RENDER
// ============================================================
function renderItems(filtroTexto, filtroCategoria) {
  var items = obtenerItems();
  var tbody = document.getElementById('tbodyItems');
  if (!tbody) return;
  
  // Filtrar
  if (filtroTexto) {
    var term = filtroTexto.toLowerCase();
    items = items.filter(function(item) {
      return item.descripcion.toLowerCase().indexOf(term) !== -1 ||
             item.codigo.toLowerCase().indexOf(term) !== -1;
    });
  }
  
  if (filtroCategoria && filtroCategoria !== 'todos') {
    items = items.filter(function(item) { return item.categoria === filtroCategoria; });
  }
  
  var catLabels = {
    electricidad: 'Electricidad', plomeria: 'Plomería', pintura: 'Pintura',
    construccion: 'Construcción', mantenimiento: 'Mantenimiento',
    iluminacion: 'Iluminación', sistemas_aci: 'Sistemas ACI',
    bombeo: 'Bombeo', ventilacion: 'Ventilación', techo: 'Techo',
    puertas: 'Puertas', otros: 'Otros'
  };
  
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var catClass = 'cat-' + item.categoria.replace('_', '-');
    html += '<tr>' +
      '<td><strong style="color:#6bbd45">' + item.codigo + '</strong></td>' +
      '<td><span class="td-categoria ' + catClass + '">' + (catLabels[item.categoria] || item.categoria) + '</span></td>' +
      '<td>' + item.descripcion + '</td>' +
      '<td>' + item.unidad + '</td>' +
      '<td class="td-monto">' + fmt.format(item.precio) + '</td>' +
      '<td>' + (item.itbms ? 'Sí (7%)' : 'No') + '</td>' +
      '<td class="td-actions">' +
        '<button class="btn-icon" onclick="eliminarItem(\'' + item.codigo + '\')" title="Eliminar">🗑</button>' +
      '</td>' +
      '</tr>';
  }
  
  tbody.innerHTML = html;
}

function filtrarItems() {
  var texto = document.getElementById('buscar-item').value;
  renderItems(texto, null);
}

function filtrarItemsCategoria(cat) {
  var btns = document.querySelectorAll('#catalogo-items .filter-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  if (event && event.target) event.target.classList.add('active');
  renderItems(null, cat);
}

function actualizarVistaJSON() {
  var preview = document.getElementById('json-preview');
  if (preview) {
    preview.textContent = JSON.stringify(obtenerItems(), null, 2);
  }
}

// ============================================================
// IMPORT/EXPORT JSON
// ============================================================
function exportarCatalogoJSON() {
  var items = obtenerItems();
  var data = {
    catalogo_items: items,
    exportado: new Date().toISOString(),
    total_items: items.length
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'proyintel-catalogo-' + new Date().toISOString().split('T')[0] + '.json';
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
      var nuevosItems = data.catalogo_items || data.items || [];
      if (!Array.isArray(nuevosItems) || nuevosItems.length === 0) {
        alert('❌ El archivo no contiene items válidos');
        return;
      }
      
      var itemsActuales = obtenerItems();
      var codigosExistentes = {};
      for (var i = 0; i < itemsActuales.length; i++) {
        codigosExistentes[itemsActuales[i].codigo] = true;
      }
      
      var agregados = 0;
      for (var i = 0; i < nuevosItems.length; i++) {
        var nuevo = nuevosItems[i];
        if (!codigosExistentes[nuevo.codigo]) {
          itemsActuales.push(nuevo);
          codigosExistentes[nuevo.codigo] = true;
          agregados++;
        }
      }
      
      itemsActuales.sort(function(a, b) { return a.codigo.localeCompare(b.codigo); });
      guardarItems(itemsActuales);
      
      renderItems();
      actualizarVistaJSON();
      alert('✅ ' + agregados + ' items nuevos importados. Total: ' + itemsActuales.length);
    } catch (err) {
      alert('❌ Error al importar: ' + err.message);
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// ============================================================
// INICIALIZAR AL CARGAR
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarCatalogo();
  if (document.getElementById('tbodyItems')) {
    renderItems();
    actualizarVistaJSON();
  }
});
