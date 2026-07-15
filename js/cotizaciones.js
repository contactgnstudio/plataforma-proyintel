// ============================================================
// js/cotizaciones.js — Módulo de Cotizaciones
// ============================================================

var itemsCotizacionActual = [];

function ctGetServicios() {
  if (typeof obtenerServicios === 'function') {
    var servicios = obtenerServicios();
    return Array.isArray(servicios) ? servicios : [];
  }

  if (typeof getData === 'function' && typeof STORAGE_KEYS !== 'undefined') {
    var data = getData(STORAGE_KEYS.SERVICIOS, []);
    return Array.isArray(data) ? data : [];
  }

  return [];
}

function ctGetClientes() {
  if (typeof obtenerClientes === 'function') {
    var clientes = obtenerClientes();
    return Array.isArray(clientes) ? clientes : [];
  }

  if (typeof getData === 'function' && typeof STORAGE_KEYS !== 'undefined') {
    var data = getData(STORAGE_KEYS.CLIENTES, []);
    return Array.isArray(data) ? data : [];
  }

  return [];
}

function ctGetCotizaciones() {
  if (typeof getData === 'function' && typeof STORAGE_KEYS !== 'undefined') {
    var data = getData(STORAGE_KEYS.COTIZACIONES, []);
    return Array.isArray(data) ? data : [];
  }

  return [];
}

function ctSetCotizaciones(data) {
  if (typeof setData === 'function' && typeof STORAGE_KEYS !== 'undefined') {
    return setData(STORAGE_KEYS.COTIZACIONES, data);
  }
  return false;
}

function ctFindServicio(id) {
  var servicios = ctGetServicios();
  for (var i = 0; i < servicios.length; i++) {
    if (servicios[i].id === id) return servicios[i];
  }
  return null;
}

function ctFindCliente(id) {
  var clientes = ctGetClientes();
  for (var i = 0; i < clientes.length; i++) {
    if (clientes[i].id === id) return clientes[i];
  }
  return null;
}

function ctEscape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ctMoney(value) {
  if (typeof formatMoney === 'function') return formatMoney(value);
  var num = parseFloat(value) || 0;
  return '$' + num.toFixed(2);
}

function ctDate(value) {
  if (typeof formatDate === 'function') return formatDate(value);
  return value || '—';
}

function ctId() {
  if (typeof generarId === 'function') return generarId();
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function ctNumero(fecha) {
  if (typeof generarNumeroCotizacion === 'function') return generarNumeroCotizacion(fecha);
  var d = fecha ? new Date(fecha) : new Date();
  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var yy = String(d.getFullYear()).slice(-2);
  return 'COT-' + dd + mm + yy + '-' + Math.floor(Math.random() * 900 + 100);
}

function inicializarCotizaciones() {
  var data = ctGetCotizaciones();
  if (!Array.isArray(data)) {
    ctSetCotizaciones([]);
  }

  var fechaInput = document.getElementById('cot-fecha');
  if (fechaInput && !fechaInput.value) {
    var hoy = new Date();
    fechaInput.value = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  }

  actualizarSelectClientes();
  actualizarSelectServicios();
  renderItemsCotizacion();
  renderCotizacionesGuardadas();
}

function actualizarSelectClientes() {
  var selectIds = ['cot-cliente', 'proy-cliente'];
  var clientes = ctGetClientes();

  for (var i = 0; i < selectIds.length; i++) {
    var select = document.getElementById(selectIds[i]);
    if (!select) continue;

    var currentValue = select.value;
    var html = '<option value="">Selecciona un cliente</option>';

    for (var j = 0; j < clientes.length; j++) {
      html += '<option value="' + ctEscape(clientes[j].id) + '">' + ctEscape(clientes[j].nombre) + '</option>';
    }

    select.innerHTML = html;
    select.value = currentValue;
  }
}

function actualizarSelectServicios() {
  var select = document.getElementById('cot-item-servicio');
  if (!select) return;

  var currentValue = select.value;
  var servicios = ctGetServicios();
  var html = '<option value="">Selecciona un servicio</option>';

  for (var i = 0; i < servicios.length; i++) {
    var s = servicios[i];
    html += '<option value="' + ctEscape(s.id) + '">' + ctEscape(s.codigo + ' — ' + s.descripcion) + '</option>';
  }

  select.innerHTML = html;
  select.value = currentValue;
}

function cargarPrecioServicio() {
  var select = document.getElementById('cot-item-servicio');
  if (!select || !select.value) return;

  var servicio = ctFindServicio(select.value);
  if (!servicio) return;
}

function agregarItemDesdeCatalogo() {
  var servicioId = document.getElementById('cot-item-servicio') ? document.getElementById('cot-item-servicio').value : '';
  var cantidad = document.getElementById('cot-item-cantidad-catalogo') ? parseFloat(document.getElementById('cot-item-cantidad-catalogo').value) || 1 : 1;

  if (!servicioId) {
    alert('Selecciona un servicio del catálogo');
    return;
  }

  var servicio = ctFindServicio(servicioId);
  if (!servicio) {
    alert('No se encontró el servicio seleccionado');
    return;
  }

  itemsCotizacionActual.push({
    id: ctId(),
    tipo: 'catalogo',
    servicioId: servicio.id,
    codigo: servicio.codigo,
    descripcion: servicio.descripcion,
    cantidad: cantidad,
    unidad: servicio.unidad || 'und',
    precioUnitario: parseFloat(servicio.precio) || 0,
    aplicaItbms: Number(servicio.itbms) === 1
  });

  if (document.getElementById('cot-item-servicio')) {
    document.getElementById('cot-item-servicio').value = '';
  }
  if (document.getElementById('cot-item-cantidad-catalogo')) {
    document.getElementById('cot-item-cantidad-catalogo').value = '1';
  }

  renderItemsCotizacion();
}

function agregarItemManual() {
  var descripcion = document.getElementById('cot-item-desc-manual') ? document.getElementById('cot-item-desc-manual').value.trim() : '';
  var cantidad = document.getElementById('cot-item-cantidad-manual') ? parseFloat(document.getElementById('cot-item-cantidad-manual').value) || 1 : 1;
  var unidad = document.getElementById('cot-item-unidad-manual') ? document.getElementById('cot-item-unidad-manual').value : 'und';
  var precio = document.getElementById('cot-item-precio-manual') ? parseFloat(document.getElementById('cot-item-precio-manual').value) || 0 : 0;
  var itbms = document.getElementById('cot-item-itbms-manual') ? parseInt(document.getElementById('cot-item-itbms-manual').value, 10) : 1;

  if (!descripcion) {
    alert('Ingresa una descripción para el servicio');
    return;
  }

  if (precio <= 0) {
    alert('Ingresa un precio unitario válido');
    return;
  }

  itemsCotizacionActual.push({
    id: ctId(),
    tipo: 'manual',
    servicioId: null,
    codigo: 'MANUAL',
    descripcion: descripcion,
    cantidad: cantidad,
    unidad: unidad || 'und',
    precioUnitario: precio,
    aplicaItbms: itbms === 1
  });

  if (document.getElementById('cot-item-desc-manual')) document.getElementById('cot-item-desc-manual').value = '';
  if (document.getElementById('cot-item-cantidad-manual')) document.getElementById('cot-item-cantidad-manual').value = '1';
  if (document.getElementById('cot-item-unidad-manual')) document.getElementById('cot-item-unidad-manual').value = 'und';
  if (document.getElementById('cot-item-precio-manual')) document.getElementById('cot-item-precio-manual').value = '';

  renderItemsCotizacion();
}

function eliminarItemCotizacion(id) {
  var nextItems = [];
  for (var i = 0; i < itemsCotizacionActual.length; i++) {
    if (itemsCotizacionActual[i].id !== id) {
      nextItems.push(itemsCotizacionActual[i]);
    }
  }
  itemsCotizacionActual = nextItems;
  renderItemsCotizacion();
}

function calcularTotalesCotizacion() {
  var subtotal = 0;
  var itbmsMonto = 0;
  var descuentoPct = document.getElementById('cot-descuento') ? parseFloat(document.getElementById('cot-descuento').value) || 0 : 0;

  for (var i = 0; i < itemsCotizacionActual.length; i++) {
    var item = itemsCotizacionActual[i];
    var totalItem = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precioUnitario) || 0);
    subtotal += totalItem;

    if (item.aplicaItbms) {
      itbmsMonto += totalItem * 0.07;
    }
  }

  var descuentoMonto = subtotal * (descuentoPct / 100);
  var total = subtotal + itbmsMonto - descuentoMonto;

  return {
    subtotal: subtotal,
    itbmsMonto: itbmsMonto,
    descuentoPct: descuentoPct,
    descuentoMonto: descuentoMonto,
    total: total
  };
}

function renderItemsCotizacion() {
  var tbody = document.getElementById('tbodyItemsCotizacion');
  var totals = calcularTotalesCotizacion();

  if (tbody) {
    if (!itemsCotizacionActual.length) {
      tbody.innerHTML = '<tr><td colspan="8">No hay items agregados</td></tr>';
    } else {
      var html = '';

      for (var i = 0; i < itemsCotizacionActual.length; i++) {
        var item = itemsCotizacionActual[i];
        var totalItem = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precioUnitario) || 0);
        var itbmsItem = item.aplicaItbms ? totalItem * 0.07 : 0;

        html += ''
          + '<tr>'
          +   '<td>' + (i + 1) + '</td>'
          +   '<td>' + ctEscape((item.tipo === 'catalogo' ? '[' + item.codigo + '] ' : '') + item.descripcion) + '</td>'
          +   '<td>' + ctEscape(item.cantidad) + '</td>'
          +   '<td>' + ctEscape(item.unidad) + '</td>'
          +   '<td>' + ctMoney(item.precioUnitario) + '</td>'
          +   '<td>' + ctMoney(totalItem) + '</td>'
          +   '<td>' + (item.aplicaItbms ? ctMoney(itbmsItem) : '—') + '</td>'
          +   '<td><button type="button" onclick="eliminarItemCotizacion(\'' + ctEscape(item.id) + '\')">Quitar</button></td>'
          + '</tr>';
      }

      tbody.innerHTML = html;
    }
  }

  var subtotalEl = document.getElementById('cot-subtotal');
  var itbmsEl = document.getElementById('cot-itbms');
  var descuentoEl = document.getElementById('cot-descuento-monto');
  var totalEl = document.getElementById('cot-total');

  if (subtotalEl) subtotalEl.textContent = ctMoney(totals.subtotal);
  if (itbmsEl) itbmsEl.textContent = ctMoney(totals.itbmsMonto);
  if (descuentoEl) descuentoEl.textContent = ctMoney(totals.descuentoMonto);
  if (totalEl) totalEl.textContent = ctMoney(totals.total);
}

function guardarCotizacion(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  var feedback = document.getElementById('feedback-cotizacion');
  var clienteId = document.getElementById('cot-cliente') ? document.getElementById('cot-cliente').value : '';
  var proyecto = document.getElementById('cot-proyecto') ? document.getElementById('cot-proyecto').value.trim() : '';
  var fecha = document.getElementById('cot-fecha') ? document.getElementById('cot-fecha').value : '';
  var atencion = document.getElementById('cot-atencion') ? document.getElementById('cot-atencion').value.trim() : '';
  var alcance = document.getElementById('cot-alcance') ? document.getElementById('cot-alcance').value.trim() : '';

  if (!clienteId) {
    if (feedback) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ Debes seleccionar un cliente';
    }
    return false;
  }

  if (!proyecto) {
    if (feedback) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ Debes ingresar el nombre del proyecto';
    }
    return false;
  }

  if (!itemsCotizacionActual.length) {
    if (feedback) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ Agrega al menos un item a la cotización';
    }
    return false;
  }

  var cliente = ctFindCliente(clienteId);
  var totals = calcularTotalesCotizacion();
  var cotizaciones = ctGetCotizaciones();

  var nuevaCotizacion = {
    id: ctId(),
    numero: ctNumero(fecha),
    fecha: fecha,
    clienteId: clienteId,
    clienteNombre: cliente ? cliente.nombre : '',
    proyecto: proyecto,
    atencion: atencion,
    alcance: alcance,
    items: itemsCotizacionActual.slice(),
    subtotal: totals.subtotal,
    itbmsMonto: totals.itbmsMonto,
    descuentoPct: totals.descuentoPct,
    descuentoMonto: totals.descuentoMonto,
    total: totals.total,
    estado: 'cotizado',
    creadoEn: new Date().toISOString()
  };

  cotizaciones.push(nuevaCotizacion);
  ctSetCotizaciones(cotizaciones);

  itemsCotizacionActual = [];
  renderItemsCotizacion();
  renderCotizacionesGuardadas();

  var form = document.getElementById('formCotizacion');
  if (form) form.reset();

  var fechaInput = document.getElementById('cot-fecha');
  if (fechaInput && !fechaInput.value) {
    var hoy = new Date();
    fechaInput.value = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  }

  actualizarSelectClientes();
  actualizarSelectServicios();

  if (feedback) {
    feedback.className = 'form-feedback success';
    feedback.textContent = '✅ Cotización guardada correctamente';
  }

  return false;
}

function eliminarCotizacion(id) {
  if (!confirm('¿Eliminar esta cotización?')) return;

  var data = ctGetCotizaciones();
  var next = [];

  for (var i = 0; i < data.length; i++) {
    if (data[i].id !== id) next.push(data[i]);
  }

  ctSetCotizaciones(next);
  renderCotizacionesGuardadas();
}

function cambiarEstadoCotizacion(id, estado) {
  var data = ctGetCotizaciones();

  for (var i = 0; i < data.length; i++) {
    if (data[i].id === id) {
      data[i].estado = estado;
      break;
    }
  }

  ctSetCotizaciones(data);
  renderCotizacionesGuardadas();
}

function renderCotizacionesGuardadas() {
  var tbody = document.getElementById('tbodyCotizaciones');
  if (!tbody) return;

  var data = ctGetCotizaciones();
  data.sort(function(a, b) {
    return new Date(b.creadoEn || b.fecha) - new Date(a.creadoEn || a.fecha);
  });

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="7">No hay cotizaciones registradas</td></tr>';
    return;
  }

  var html = '';

  for (var i = 0; i < data.length; i++) {
    var c = data[i];

    html += ''
      + '<tr>'
      +   '<td>' + ctEscape(c.numero) + '</td>'
      +   '<td>' + ctEscape(c.clienteNombre || '—') + '</td>'
      +   '<td>' + ctEscape(c.proyecto || '—') + '</td>'
      +   '<td>' + ctMoney(c.total) + '</td>'
      +   '<td>' + ctEscape(c.estado || 'cotizado') + '</td>'
      +   '<td>' + ctDate(c.fecha) + '</td>'
      +   '<td>'
      +     '<button type="button" onclick="cambiarEstadoCotizacion(\'' + ctEscape(c.id) + '\', \'aprobado\')">Aprobar</button> '
      +     '<button type="button" onclick="cambiarEstadoCotizacion(\'' + ctEscape(c.id) + '\', \'rechazado\')">Rechazar</button> '
      +     '<button type="button" onclick="eliminarCotizacion(\'' + ctEscape(c.id) + '\')">Eliminar</button>'
      +   '</td>'
      + '</tr>';
  }

  tbody.innerHTML = html;
}
