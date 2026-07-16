// ============================================================
// js/clientes.js — GN Studio OS + Supabase
// ============================================================

// Inicializar clientes (carga desde Supabase)
async function inicializarClientes() {
  await renderClientes();
}

// Obtener todos los clientes
async function obtenerClientes() {
  return await getData(STORAGE_KEYS.CLIENTES);
}

// Guardar nuevo cliente
async function guardarCliente(event) {
  if (event) event.preventDefault();

  var nombre = (document.getElementById('cli-nombre') || {}).value;
  if (!nombre || !nombre.trim()) {
    alert('El nombre del cliente es obligatorio.');
    return;
  }

  var nuevoCliente = {
    nombre:               (document.getElementById('cli-nombre') || {}).value || '',
    nombre_comercial:     (document.getElementById('cli-nombre-comercial') || {}).value || '',
    ruc:                  (document.getElementById('cli-ruc') || {}).value || '',
    dv:                   (document.getElementById('cli-dv') || {}).value || '',
    tipo_contribuyente:   (document.getElementById('cli-tipo-contrib') || {}).value || '',
    correo:               (document.getElementById('cli-correo') || {}).value || '',
    telefono:             (document.getElementById('cli-telefono') || {}).value || '',
    telefono_secundario:  (document.getElementById('cli-telefono2') || {}).value || '',
    contacto_nombre:      (document.getElementById('cli-contacto') || {}).value || '',
    direccion:            (document.getElementById('cli-direccion') || {}).value || '',
    provincia:            (document.getElementById('cli-provincia') || {}).value || '',
    tipo:                 'activo',
    notas:                (document.getElementById('cli-notas') || {}).value || ''
  };

  var resultado = await addItem(STORAGE_KEYS.CLIENTES, nuevoCliente);
  if (!resultado) {
    alert('Error al guardar el cliente. Verifica tu conexión.');
    return;
  }

  limpiarFormularioCliente();
  await renderClientes();
  await actualizarSelectClientes();
  alert('Cliente guardado exitosamente.');
}

// Editar cliente existente
async function editarCliente(id) {
  var cliente = await findItem(STORAGE_KEYS.CLIENTES, id);
  if (!cliente) return;

  var setVal = function(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('cli-nombre', cliente.nombre);
  setVal('cli-nombre-comercial', cliente.nombre_comercial);
  setVal('cli-ruc', cliente.ruc);
  setVal('cli-dv', cliente.dv);
  setVal('cli-tipo-contrib', cliente.tipo_contribuyente);
  setVal('cli-correo', cliente.correo);
  setVal('cli-telefono', cliente.telefono);
  setVal('cli-telefono2', cliente.telefono_secundario);
  setVal('cli-contacto', cliente.contacto_nombre);
  setVal('cli-direccion', cliente.direccion);
  setVal('cli-provincia', cliente.provincia);
  setVal('cli-notas', cliente.notas);

  // Guardar ID para update
  var form = document.getElementById('form-cliente');
  if (form) form.dataset.editingId = id;

  // Scroll al formulario
  var formSection = document.getElementById('cli-nombre');
  if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
}

// Actualizar cliente existente
async function actualizarCliente(event) {
  if (event) event.preventDefault();
  var form = document.getElementById('form-cliente');
  var id = form ? form.dataset.editingId : null;
  if (!id) return;

  var cambios = {
    nombre:              (document.getElementById('cli-nombre') || {}).value || '',
    nombre_comercial:    (document.getElementById('cli-nombre-comercial') || {}).value || '',
    ruc:                 (document.getElementById('cli-ruc') || {}).value || '',
    dv:                  (document.getElementById('cli-dv') || {}).value || '',
    tipo_contribuyente:  (document.getElementById('cli-tipo-contrib') || {}).value || '',
    correo:              (document.getElementById('cli-correo') || {}).value || '',
    telefono:            (document.getElementById('cli-telefono') || {}).value || '',
    telefono_secundario: (document.getElementById('cli-telefono2') || {}).value || '',
    contacto_nombre:     (document.getElementById('cli-contacto') || {}).value || '',
    direccion:           (document.getElementById('cli-direccion') || {}).value || '',
    provincia:           (document.getElementById('cli-provincia') || {}).value || '',
    notas:               (document.getElementById('cli-notas') || {}).value || ''
  };

  var ok = await updateItem(STORAGE_KEYS.CLIENTES, id, cambios);
  if (!ok) { alert('Error al actualizar el cliente.'); return; }

  if (form) delete form.dataset.editingId;
  limpiarFormularioCliente();
  await renderClientes();
  await actualizarSelectClientes();
  alert('Cliente actualizado.');
}

// Eliminar cliente
async function eliminarCliente(id) {
  if (!confirm('\u00bfEliminar este cliente? Esta acción no se puede deshacer.')) return;
  var ok = await deleteItem(STORAGE_KEYS.CLIENTES, id);
  if (!ok) { alert('Error al eliminar el cliente.'); return; }
  await renderClientes();
  await actualizarSelectClientes();
}

// Limpiar formulario
function limpiarFormularioCliente() {
  var ids = ['cli-nombre','cli-nombre-comercial','cli-ruc','cli-dv','cli-tipo-contrib',
    'cli-correo','cli-telefono','cli-telefono2','cli-contacto','cli-direccion','cli-provincia','cli-notas'];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var form = document.getElementById('form-cliente');
  if (form) delete form.dataset.editingId;
}

// Buscar clientes
function buscarClientes(valor) {
  renderClientes(valor || '');
}

function filtrarClientes() {
  var input = document.getElementById('buscador-clientes');
  buscarClientes(input ? input.value : '');
}

// Renderizar tabla de clientes
async function renderClientes(filtro) {
  var tbody = document.getElementById('tbodyClientes');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Cargando...</td></tr>';

  var clientes = await obtenerClientes();
  filtro = (filtro || '').toLowerCase();

  if (filtro) {
    clientes = clientes.filter(function(c) {
      return (c.nombre || '').toLowerCase().includes(filtro) ||
             (c.ruc || '').toLowerCase().includes(filtro) ||
             (c.correo || '').toLowerCase().includes(filtro) ||
             (c.contacto_nombre || '').toLowerCase().includes(filtro) ||
             (c.telefono || '').toLowerCase().includes(filtro);
    });
  }

  clientes.sort(function(a, b) {
    return (a.nombre || '').localeCompare(b.nombre || '');
  });

  if (clientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">No se encontraron clientes.</td></tr>';
    return;
  }

  var html = '';
  clientes.forEach(function(c) {
    html += '<tr>';
    html += '<td>' + (c.nombre || '-') + '</td>';
    html += '<td>' + (c.ruc ? c.ruc + (c.dv ? '-' + c.dv : '') : '-') + '</td>';
    html += '<td>' + (c.correo || '-') + '</td>';
    html += '<td>' + (c.telefono || '-') + '</td>';
    html += '<td>' + (c.tipo || 'activo') + '</td>';
    html += '<td>';
    html += '<button class="btn-accion" onclick="editarCliente(\'' + c.id + '\')" title="Editar">\u270f\ufe0f</button> ';
    html += '<button class="btn-accion btn-danger" onclick="eliminarCliente(\'' + c.id + '\')" title="Eliminar">\uD83D\uDDD1\uFE0F</button>';
    html += '</td>';
    html += '</tr>';
  });
  tbody.innerHTML = html;
}

// Actualizar select de clientes en formularios
async function actualizarSelectClientes() {
  var clientes = await obtenerClientes();
  var selects = document.querySelectorAll('.select-cliente');
  selects.forEach(function(sel) {
    var current = sel.value;
    sel.innerHTML = '<option value="">-- Seleccionar cliente --</option>';
    clientes.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nombre + (c.ruc ? ' (' + c.ruc + ')' : '');
      sel.appendChild(opt);
    });
    if (current) sel.value = current;
  });
}
