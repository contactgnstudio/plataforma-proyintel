// ============================================================
// js/cotizaciones.js — Módulo de Cotizaciones
// ============================================================

var itemsCotizacionActual = [];

function inicializarCotizaciones() {
  var data = getData(STORAGE_KEYS.COTIZACIONES);
  if (!data) setData(STORAGE_KEYS.COTIZACIONES, []);
  
  // Set fecha actual por defecto
  var fechaInput = document.getElementById('cot-fecha');
  if (fechaInput && !fechaInput.value) {
    fechaInput.valueAsDate = new Date();
  }
  
  actualizarSelectServicios();
  renderCotizacionesGuardadas();
}

function actualizarSelectServicios() {
  var select = document.getElementById('cot-item-servicio');
  if (!select) return;
  var servicios = obtenerServicios();
  select.innerHTML = '<option value="">Selecciona del catálogo</option>';
  for (var i = 0; i < servicios.length; i++) {
    var s = servicios[i];
    select.innerHTML += '<option value="' + s.id + '">' + s.codigo + ' — ' + s.descripcion + ' (' + formatMoney(s.precio) + ')</option>';
  }
}

function cargarPrecioServicio() {
  var servicioId = document.getElementById('cot-item-servicio').value;
  if (!servicioId) return;
  var servicio = findItem(STORAGE_KEYS.SERVICIOS, servicioId);
  if (servicio) {
    // El precio se carga automáticamente al agregar, no necesitamos mostrarlo
  }
}

// ============================================================
// AGREGAR ITEM DESDE CATÁLOGO
// ============================================================
function agregarItemDesdeCatalogo() {
  var servicioId = document.getElementById('cot-item-servicio').value;
  var cantidad = parseFloat(document.getElementById('cot-item-cantidad-catalogo').value) || 1;
  
  if (!servicioId) {
    alert('Selecciona un servicio del catálogo');
    return;
  }
  
  var servicio = findItem(STORAGE_KEYS.SERVICIOS, servicioId);
  if (!servicio) return;
  
  var item = {
    id: generarId(),
    tipo: 'catalogo',
    servicioId: servicio.id,
    codigo: servicio.codigo,
    descripcion: servicio.descripcion,
    cantidad: cantidad,
    unidad: servicio.unidad,
    precioUnitario: servicio.precio,
    aplicaItbms: servicio.itbms === 1
  };
  
  itemsCotizacionActual.push(item);
  renderItemsCotizacion();
  
  // Limpiar selects
  document.getElementById('cot-item-servicio').value = '';
  document.getElementById('cot-item-cantidad-catalogo').value = '1';
}

// ============================================================
// AGREGAR ITEM MANUAL
// ============================================================
function agregarItemManual() {
  var descripcion = document.getElementById('cot-item-desc-manual').value.trim();
  var cantidad = parseFloat(document.getElementById('cot-item-cantidad-manual').value) || 1;
  var unidad = document.getElementById('cot-item-unidad-manual').value;
  var precio = parseFloat(document.getElementById('cot-item-precio-manual').value);
  var itbms = parseInt(document.getElementById('cot-item-itbms-manual').value);
  
  if (!descripcion) {
    alert('Ingresa una descripción para el servicio');
    return;
  }
  if (!precio || precio <= 0) {
    alert('Ingresa un precio unitario válido');
    return;
  }
  
  var item = {
    id: generarId(),
    tipo: 'manual',
    servicioId: null,
    codigo: 'MANUAL',
    descripcion: descripcion,
    cantidad: cantidad,
    unidad: unidad,
    precioUnitario: precio,
    aplicaItbms: itbms === 1
  };
  
  itemsCotizacionActual.push(item);
  renderItemsCotizacion();
  
  // Limpiar campos
  document.getElementById('cot-item-desc-manual').value = '';
  document.getElementById('cot-item-cantidad-manual').value = '1';
  document.getElementById('cot-item-precio-manual').value = '';
}

// ============================================================
// RENDER ITEMS DE COTIZACIÓN
// ============================================================
function renderItemsCotizacion() {
  var tbody = document.getElementById('tbodyItemsCotizacion');
  if (!tbody) return;
  
  var html = '';
  var subtotal = 0;
  var itbmsTotal = 0;
  
  for (var i = 0; i < itemsCotizacionActual.length; i++) {
    var item = itemsCotizacionActual[i];
    var totalItem = item.cantidad * item.precioUnitario;
    subtotal += totalItem;
    
    var itbmsItem = 0;
    if (item.aplicaItbms) {
      itbmsItem = totalItem * 0.07;
      itbmsTotal += itbmsItem;
    }
    
    html += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + (item.tipo === 'catalogo' ? '<span style="color:#6bbd45;font-size:11px;">[' + item.codigo + ']</span> ' : '') + item.descripcion + '</td>' +
      '<td>' + item.cantidad + '</td>' +
      '<td>' + item.unidad + '</td>' +
      '<td class="td-monto">' + formatMoney(item.precioUnitario) + '</td>' +
      '<td class="td-monto">' + formatMoney(totalItem) + '</td>' +
      '<td>' + (item.aplicaItbms ? formatMoney(itbmsItem) : '—') + '</td>' +
      '<td class="td-actions">' +
        '<button class="btn-icon" onclick="eliminarItemCotizacion(' + i + ')" title="Eliminar">🗑</button>' +
      '</td>' +
      '</tr>';
  }
  
  tbody.innerHTML = html;
  
  // Calcular totales
  var aplicaItbmsGlobal = document.getElementById('cot-itbms').value === '1';
  var descuentoPct = parseFloat(document.getElementById('cot-descuento').value) || 0;
  
  var itbmsMonto = aplicaItbmsGlobal ? itbmsTotal : 0;
  var descuentoMonto = subtotal * (descuentoPct / 100);
  var total = subtotal + itbmsMonto - descuentoMonto;
  
  document.getElementById('cot-subtotal').textContent = formatMoney(subtotal);
  document.getElementById('cot-itbms-monto').textContent = formatMoney(itbmsMonto);
  document.getElementById('cot-descuento-monto').textContent = '-' + formatMoney(descuentoMonto);
  document.getElementById('cot-total').textContent = formatMoney(total);
}

function eliminarItemCotizacion(index) {
  itemsCotizacionActual.splice(index, 1);
  renderItemsCotizacion();
}

// ============================================================
// GUARDAR COTIZACIÓN
// ============================================================
function guardarCotizacion() {
  var feedback = document.getElementById('feedback-cotizacion');
  var clienteId = document.getElementById('cot-cliente').value;
  var proyecto = document.getElementById('cot-proyecto').value.trim();
  var fecha = document.getElementById('cot-fecha').value;
  
  if (!clienteId) {
    feedback.className = 'form-feedback error';
    feedback.textContent = '❌ Selecciona un cliente';
    return;
  }
  if (!proyecto) {
    feedback.className = 'form-feedback error';
    feedback.textContent = '❌ Ingresa el nombre del proyecto';
    return;
  }
  if (itemsCotizacionActual.length === 0) {
    feedback.className = 'form-feedback error';
    feedback.textContent = '❌ Agrega al menos un item a la cotización';
    return;
  }
  
  var cliente = findItem(STORAGE_KEYS.CLIENTES, clienteId);
  var aplicaItbms = document.getElementById('cot-itbms').value === '1';
  var descuentoPct = parseFloat(document.getElementById('cot-descuento').value) || 0;
  
  // Calcular totales
  var subtotal = 0;
  var itbmsTotal = 0;
  for (var i = 0; i < itemsCotizacionActual.length; i++) {
    var item = itemsCotizacionActual[i];
    var totalItem = item.cantidad * item.precioUnitario;
    subtotal += totalItem;
    if (item.aplicaItbms) itbmsTotal += totalItem * 0.07;
  }
  
  var itbmsMonto = aplicaItbms ? itbmsTotal : 0;
  var descuentoMonto = subtotal * (descuentoPct / 100);
  var total = subtotal + itbmsMonto - descuentoMonto;
  
  var cotizacion = {
    id: generarId(),
    numero: generarNumeroCotizacion(fecha),
    clienteId: clienteId,
    clienteNombre: cliente ? cliente.nombre : '',
    clienteCodigo: cliente ? cliente.codigo : '',
    proyecto: proyecto,
    atencion: document.getElementById('cot-atencion').value.trim(),
    fecha: fecha,
    alcance: document.getElementById('cot-alcance').value.trim(),
    aplicaItbms: aplicaItbms,
    descuentoPct: descuentoPct,
    subtotal: subtotal,
    itbmsMonto: itbmsMonto,
    descuentoMonto: descuentoMonto,
    total: total,
    estado: 'cotizado',
    items: JSON.parse(JSON.stringify(itemsCotizacionActual)),
    creadoEn: new Date().toISOString()
  };
  
  addItem(STORAGE_KEYS.COTIZACIONES, cotizacion);
  
  feedback.className = 'form-feedback success';
  feedback.textContent = '✅ Cotización ' + cotizacion.numero + ' guardada. Total: ' + formatMoney(total);
  
  // Limpiar
  limpiarCotizacion();
  renderCotizacionesGuardadas();
  actualizarKPIs();
}

function limpiarCotizacion() {
  itemsCotizacionActual = [];
  document.getElementById('formCotizacionInfo').reset();
  document.getElementById('cot-fecha').valueAsDate = new Date();
  document.getElementById('cot-item-desc-manual').value = '';
  document.getElementById('cot-item-cantidad-manual').value = '1';
  document.getElementById('cot-item-precio-manual').value = '';
  renderItemsCotizacion();
  document.getElementById('feedback-cotizacion').style.display = 'none';
}

function vistaPreviaCotizacion() {
  if (itemsCotizacionActual.length === 0) {
    alert('Agrega items para ver la vista previa');
    return;
  }
  // Abrir en nueva ventana con formato de proforma
  var ventana = window.open('', '_blank');
  var clienteId = document.getElementById('cot-cliente').value;
  var cliente = findItem(STORAGE_KEYS.CLIENTES, clienteId);
  var proyecto = document.getElementById('cot-proyecto').value || 'Sin nombre';
  var fecha = document.getElementById('cot-fecha').value;
  var atencion = document.getElementById('cot-atencion').value;
  var alcance = document.getElementById('cot-alcance').value;
  
  var aplicaItbms = document.getElementById('cot-itbms').value === '1';
  var descuentoPct = parseFloat(document.getElementById('cot-descuento').value) || 0;
  
  var subtotal = 0;
  var itbmsTotal = 0;
  var itemsHtml = '';
  
  for (var i = 0; i < itemsCotizacionActual.length; i++) {
    var item = itemsCotizacionActual[i];
    var totalItem = item.cantidad * item.precioUnitario;
    subtotal += totalItem;
    if (item.aplicaItbms) itbmsTotal += totalItem * 0.07;
    
    itemsHtml += '<tr>' +
      '<td style="padding:10px;border:1px solid #ddd;">' + (i+1) + '</td>' +
      '<td style="padding:10px;border:1px solid #ddd;">' + item.descripcion + '</td>' +
      '<td style="padding:10px;border:1px solid #ddd;text-align:center;">' + item.cantidad + '</td>' +
      '<td style="padding:10px;border:1px solid #ddd;text-align:center;">' + item.unidad + '</td>' +
      '<td style="padding:10px;border:1px solid #ddd;text-align:right;">' + formatMoney(item.precioUnitario) + '</td>' +
      '<td style="padding:10px;border:1px solid #ddd;text-align:right;">' + formatMoney(totalItem) + '</td>' +
      '</tr>';
  }
  
  var itbmsMonto = aplicaItbms ? itbmsTotal : 0;
  var descuentoMonto = subtotal * (descuentoPct / 100);
  var total = subtotal + itbmsMonto - descuentoMonto;
  
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cotización - ' + proyecto + '</title>' +
    '<style>body{font-family:Inter,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#333}' +
    '.header{text-align:center;padding:30px;border-bottom:3px solid #6bbd45;margin-bottom:30px}' +
    '.header h1{color:#6bbd45;font-size:28px;margin-bottom:8px}' +
    '.header p{color:#666;font-size:14px}' +
    '.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}' +
    '.info-box{background:#f8f9fa;padding:16px;border-radius:8px}' +
    '.info-box h4{margin:0 0 8px;color:#6bbd45;font-size:12px;text-transform:uppercase}' +
    '.info-box p{margin:0;font-size:14px}' +
    'table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}' +
    'th{background:#6bbd45;color:#fff;padding:12px;text-align:left}' +
    '.totals{margin-left:auto;width:300px}' +
    '.totals td{padding:8px 12px}' +
    '.totals .grand{font-size:18px;font-weight:700;color:#6bbd45;border-top:2px solid #6bbd45}' +
    '.footer{margin-top:40px;padding-top:20px;border-top:1px solid #ddd;text-align:center;color:#999;font-size:12px}' +
    '@media print{body{margin:0}}</style></head><body>' +
    '<div class="header"><h1>GN Studio</h1><p>Diseñamos experiencias que venden</p></div>' +
    '<div class="info-grid">' +
    '<div class="info-box"><h4>Cliente</h4><p>' + (cliente ? cliente.nombre : '—') + '</p><p>' + (cliente ? cliente.direccion : '') + '</p></div>' +
    '<div class="info-box"><h4>Cotización</h4><p><strong>Proyecto:</strong> ' + proyecto + '</p><p><strong>Fecha:</strong> ' + formatDate(fecha) + '</p><p><strong>Atención:</strong> ' + (atencion || '—') + '</p></div>' +
    '</div>' +
    (alcance ? '<div style="margin-bottom:20px;padding:16px;background:#f8f9fa;border-radius:8px;"><h4 style="margin:0 0 8px;color:#6bbd45;font-size:12px;text-transform:uppercase;">Alcance</h4><p style="margin:0;font-size:14px;">' + alcance + '</p></div>' : '') +
    '<table><thead><tr><th>#</th><th>Descripción</th><th style="text-align:center">Cant.</th><th style="text-align:center">Unid.</th><th style="text-align:right">Precio Unit.</th><th style="text-align:right">Total</th></tr></thead><tbody>' + itemsHtml + '</tbody></table>' +
    '<table class="totals"><tr><td style="text-align:right"><strong>Subtotal:</strong></td><td style="text-align:right">' + formatMoney(subtotal) + '</td></tr>' +
    (aplicaItbms ? '<tr><td style="text-align:right"><strong>ITBMS (7%):</strong></td><td style="text-align:right">' + formatMoney(itbmsMonto) + '</td></tr>' : '') +
    (descuentoPct > 0 ? '<tr><td style="text-align:right"><strong>Descuento (' + descuentoPct + '%):</strong></td><td style="text-align:right">-' + formatMoney(descuentoMonto) + '</td></tr>' : '') +
    '<tr class="grand"><td style="text-align:right"><strong>TOTAL:</strong></td><td style="text-align:right">' + formatMoney(total) + '</td></tr></table>' +
    '<div class="footer"><p>GN Studio — Diseño Web, Branding & Desarrollo</p><p>Esta cotización tiene validez de 15 días calendario.</p></div>' +
    '</body></html>';
  
  ventana.document.write(html);
  ventana.document.close();
}

// ============================================================
// RENDER COTIZACIONES GUARDADAS
// ============================================================
function renderCotizacionesGuardadas(filtro) {
  var tbody = document.getElementById('tbodyCotizaciones');
  var tbodyDash = document.getElementById('tbodyCotizacionesDashboard');
  var cotizaciones = getData(STORAGE_KEYS.COTIZACIONES);
  
  if (filtro) {
    var term = filtro.toLowerCase();
    cotizaciones = cotizaciones.filter(function(c) {
      return c.proyecto.toLowerCase().indexOf(term) !== -1 ||
             c.numero.toLowerCase().indexOf(term) !== -1 ||
             (c.clienteNombre && c.clienteNombre.toLowerCase().indexOf(term) !== -1);
    });
  }
  
  // Ordenar por fecha descendente
  cotizaciones.sort(function(a, b) {
    return new Date(b.creadoEn) - new Date(a.creadoEn);
  });
  
  var html = '';
  var htmlDash = '';
  
  for (var i = 0; i < cotizaciones.length; i++) {
    var c = cotizaciones[i];
    var estadoClass = 'estado-' + c.estado;
    var estadoText = c.estado === 'cotizado' ? 'Cotizado' : 
                     c.estado === 'aprobado' ? 'Aprobado' :
                     c.estado === 'rechazado' ? 'Rechazado' : 'Vencido';
    
    var row = '<tr>' +
      '<td><strong style="color:#4f8cff">' + c.numero + '</strong></td>' +
      '<td>' + (c.clienteNombre || '—') + '</td>' +
      '<td>' + c.proyecto + '</td>' +
      '<td class="td-monto">' + formatMoney(c.total) + '</td>' +
      '<td><span class="estado-badge ' + estadoClass + '">' + estadoText + '</span></td>' +
      '<td>' + formatDate(c.fecha) + '</td>' +
      '<td class="td-actions">' +
        '<button class="btn-icon" onclick="verCotizacion(\'' + c.id + '\')" title="Ver">👁</button>' +
        '<button class="btn-icon" onclick="cambiarEstadoCotizacion(\'' + c.id + '\')" title="Cambiar estado" style="background:rgba(79,140,255,0.1);color:#4f8cff;margin-left:4px;">✓</button>' +
        '<button class="btn-icon" onclick="eliminarCotizacion(\'' + c.id + '\')" title="Eliminar" style="margin-left:4px;">🗑</button>' +
      '</td>' +
      '</tr>';
    
    html += row;
    
    if (i < 5) {
      htmlDash += '<tr>' +
        '<td><strong style="color:#4f8cff">' + c.numero + '</strong></td>' +
        '<td>' + (c.clienteNombre || '—') + '</td>' +
        '<td>' + c.proyecto + '</td>' +
        '<td class="td-monto">' + formatMoney(c.total) + '</td>' +
        '<td><span class="estado-badge ' + estadoClass + '">' + estadoText + '</span></td>' +
        '<td>' + formatDate(c.fecha) + '</td>' +
        '</tr>';
    }
  }
  
  if (tbody) tbody.innerHTML = html;
  if (tbodyDash) tbodyDash.innerHTML = htmlDash;
}

function filtrarCotizaciones() {
  var texto = document.getElementById('buscar-cotizacion').value;
  renderCotizacionesGuardadas(texto);
}

function verCotizacion(id) {
  var cotizacion = findItem(STORAGE_KEYS.COTIZACIONES, id);
  if (!cotizacion) return;
  
  var ventana = window.open('', '_blank');
  var cliente = findItem(STORAGE_KEYS.CLIENTES, cotizacion.clienteId);
  
  var itemsHtml = '';
  for (var i = 0; i < cotizacion.items.length; i++) {
    var item = cotizacion.items[i];
    var totalItem = item.cantidad * item.precioUnitario;
    itemsHtml += '<tr>' +
      '<td style="padding:10px;border:1px solid #ddd;">' + (i+1) + '</td>' +
      '<td style="padding:10px;border:1px solid #ddd;">' + item.descripcion + '</td>' +
      '<td style="padding:10px;border:1px solid #ddd;text-align:center;">' + item.cantidad + '</td>' +
      '<td style="padding:10px;border:1px solid #ddd;text-align:center;">' + item.unidad + '</td>' +
      '<td style="padding:10px;border:1px solid #ddd;text-align:right;">' + formatMoney(item.precioUnitario) + '</td>' +
      '<td style="padding:10px;border:1px solid #ddd;text-align:right;">' + formatMoney(totalItem) + '</td>' +
      '</tr>';
  }
  
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cotización ' + cotizacion.numero + '</title>' +
    '<style>body{font-family:Inter,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#333}' +
    '.header{text-align:center;padding:30px;border-bottom:3px solid #6bbd45;margin-bottom:30px}' +
    '.header h1{color:#6bbd45;font-size:28px;margin-bottom:8px}' +
    '.header p{color:#666;font-size:14px}' +
    '.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}' +
    '.info-box{background:#f8f9fa;padding:16px;border-radius:8px}' +
    '.info-box h4{margin:0 0 8px;color:#6bbd45;font-size:12px;text-transform:uppercase}' +
    '.info-box p{margin:0;font-size:14px}' +
    'table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}' +
    'th{background:#6bbd45;color:#fff;padding:12px;text-align:left}' +
    '.totals{margin-left:auto;width:300px}' +
    '.totals td{padding:8px 12px}' +
    '.totals .grand{font-size:18px;font-weight:700;color:#6bbd45;border-top:2px solid #6bbd45}' +
    '.footer{margin-top:40px;padding-top:20px;border-top:1px solid #ddd;text-align:center;color:#999;font-size:12px}' +
    '@media print{body{margin:0}}</style></head><body>' +
    '<div class="header"><h1>GN Studio</h1><p>Diseñamos experiencias que venden</p></div>' +
    '<div class="info-grid">' +
    '<div class="info-box"><h4>Cliente</h4><p>' + (cliente ? cliente.nombre : '—') + '</p><p>' + (cliente ? cliente.direccion : '') + '</p></div>' +
    '<div class="info-box"><h4>Cotización ' + cotizacion.numero + '</h4><p><strong>Proyecto:</strong> ' + cotizacion.proyecto + '</p><p><strong>Fecha:</strong> ' + formatDate(cotizacion.fecha) + '</p><p><strong>Atención:</strong> ' + (cotizacion.atencion || '—') + '</p></div>' +
    '</div>' +
    (cotizacion.alcance ? '<div style="margin-bottom:20px;padding:16px;background:#f8f9fa;border-radius:8px;"><h4 style="margin:0 0 8px;color:#6bbd45;font-size:12px;text-transform:uppercase;">Alcance</h4><p style="margin:0;font-size:14px;">' + cotizacion.alcance + '</p></div>' : '') +
    '<table><thead><tr><th>#</th><th>Descripción</th><th style="text-align:center">Cant.</th><th style="text-align:center">Unid.</th><th style="text-align:right">Precio Unit.</th><th style="text-align:right">Total</th></tr></thead><tbody>' + itemsHtml + '</tbody></table>' +
    '<table class="totals"><tr><td style="text-align:right"><strong>Subtotal:</strong></td><td style="text-align:right">' + formatMoney(cotizacion.subtotal) + '</td></tr>' +
    (cotizacion.aplicaItbms ? '<tr><td style="text-align:right"><strong>ITBMS (7%):</strong></td><td style="text-align:right">' + formatMoney(cotizacion.itbmsMonto) + '</td></tr>' : '') +
    (cotizacion.descuentoPct > 0 ? '<tr><td style="text-align:right"><strong>Descuento (' + cotizacion.descuentoPct + '%):</strong></td><td style="text-align:right">-' + formatMoney(cotizacion.descuentoMonto) + '</td></tr>' : '') +
    '<tr class="grand"><td style="text-align:right"><strong>TOTAL:</strong></td><td style="text-align:right">' + formatMoney(cotizacion.total) + '</td></tr></table>' +
    '<div class="footer"><p>GN Studio — Diseño Web, Branding & Desarrollo</p><p>Esta cotización tiene validez de 15 días calendario.</p></div>' +
    '</body></html>';
  
  ventana.document.write(html);
  ventana.document.close();
}

function cambiarEstadoCotizacion(id) {
  var cotizacion = findItem(STORAGE_KEYS.COTIZACIONES, id);
  if (!cotizacion) return;
  
  var estados = ['cotizado', 'aprobado', 'rechazado', 'vencido'];
  var estadoActual = cotizacion.estado;
  var idx = estados.indexOf(estadoActual);
  var nuevoEstado = estados[(idx + 1) % estados.length];
  
  updateItem(STORAGE_KEYS.COTIZACIONES, id, { estado: nuevoEstado });
  
  // Si se aprueba, crear proyecto automáticamente
  if (nuevoEstado === 'aprobado') {
    var proyecto = {
      id: generarId(),
      cotizacionId: id,
      clienteId: cotizacion.clienteId,
      clienteNombre: cotizacion.clienteNombre,
      nombre: cotizacion.proyecto,
      presupuesto: cotizacion.total,
      avance: 0,
      estado: 'en_progreso',
      fechaInicio: new Date().toISOString().split('T')[0],
      creadoEn: new Date().toISOString()
    };
    addItem(STORAGE_KEYS.PROYECTOS, proyecto);
    alert('✅ Cotización aprobada. Se ha creado el proyecto automáticamente.');
  }
  
  renderCotizacionesGuardadas();
  renderProyectos();
  actualizarKPIs();
}

function eliminarCotizacion(id) {
  if (!confirm('¿Eliminar esta cotización?')) return;
  deleteItem(STORAGE_KEYS.COTIZACIONES, id);
  renderCotizacionesGuardadas();
  actualizarKPIs();
}
