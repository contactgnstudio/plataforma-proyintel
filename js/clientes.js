// ============================================================
// js/clientes.js — Gestión de Clientes
// ============================================================

function inicializarClientes() {
  var data = getData(STORAGE_KEYS.CLIENTES);
  if (!data || data.length === 0) {
    var clientesEjemplo = [
      { id: generarId(), codigo: 'ACME-001', nombre: 'ACME Corporation', contacto: 'Juan Pérez', telefono: '+507 6000-0001', email: 'juan@acme.com', direccion: 'Ciudad de Panamá' },
      { id: generarId(), codigo: 'TECH-001', nombre: 'TechStart Panamá', contacto: 'María González', telefono: '+507 6000-0002', email: 'maria@techstart.com', direccion: 'Costa del Este' }
    ];
    setData(STORAGE_KEYS.CLIENTES, clientesEjemplo);
  }
}

function obtenerClientes() {
  return getData(STORAGE_KEYS.CLIENTES);
}

function guardarCliente(event) {
  event.preventDefault();
  var feedback = document.getElementById('feedback-cliente');
  
  var codigo = document.getElementById('cli-codigo').value.trim().toUpperCase();
  var clientes = obtenerClientes();
  
  for (var i = 0; i < clientes.length; i++) {
    if (clientes[i].codigo === codigo) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ El código "' + codigo + '" ya existe';
      return false;
    }
  }
  
  var nuevoCliente = {
    id: generarId(),
    codigo: codigo,
    nombre: document.getElementById('cli-nombre').value.trim(),
    contacto: document.getElementById('cli-contacto').value.trim(),
    telefono: document.getElementById('cli-telefono').value.trim(),
    email: document.getElementById('cli-email').value.trim(),
    direccion: document.getElementById('cli-direccion').value.trim()
  };
  
  clientes.push(nuevoCliente);
  clientes.sort(function(a, b) { return a.nombre.localeCompare(b.nombre); });
  setData(STORAGE_KEYS.CLIENTES, clientes);
  
  feedback.className = 'form-feedback success';
  feedback.textContent = '✅ Cliente "' + nuevoCliente.nombre + '" guardado';
  document.getElementById('formCliente').reset();
  
  renderClientes();
  actualizarSelectClientes();
  return false;
}

function eliminarCliente(id) {
  if (!confirm('¿Eliminar este cliente?')) return;
  deleteItem(STORAGE_KEYS.CLIENTES, id);
  renderClientes();
  actualizarSelectClientes();
}

function renderClientes(filtro) {
  var clientes = obtenerClientes();
  var tbody = document.getElementById('tbodyClientes');
  if (!tbody) return;
  
  if (filtro) {
    var term = filtro.toLowerCase();
    clientes = clientes.filter(function(c) {
      return c.nombre.toLowerCase().indexOf(term) !== -1 ||
             c.codigo.toLowerCase().indexOf(term) !== -1 ||
             c.contacto.toLowerCase().indexOf(term) !== -1;
    });
  }
  
  var html = '';
  for (var i = 0; i < clientes.length; i++) {
    var c = clientes[i];
    html += '<tr>' +
      '<td><strong style="color:#4f8cff">' + c.codigo + '</strong></td>' +
      '<td>' + c.nombre + '</td>' +
      '<td>' + (c.contacto || '-') + '</td>' +
      '<td>' + (c.telefono || '-') + '</td>' +
      '<td>' + (c.email || '-') + '</td>' +
      '<td class="td-actions">' +
        '<button class="btn-icon" onclick="eliminarCliente(\'' + c.id + '\')" title="Eliminar">🗑</button>' +
      '</td>' +
      '</tr>';
  }
  
  tbody.innerHTML = html;
}

function filtrarClientes() {
  var texto = document.getElementById('buscar-cliente').value;
  renderClientes(texto);
}

function actualizarSelectClientes() {
  var selects = [
    document.getElementById('cot-cliente')
  ];
  var clientes = obtenerClientes();
  
  for (var s = 0; s < selects.length; s++) {
    var select = selects[s];
    if (!select) continue;
    var valActual = select.value;
    select.innerHTML = '<option value="">Selecciona un cliente</option>';
    for (var i = 0; i < clientes.length; i++) {
      var c = clientes[i];
      select.innerHTML += '<option value="' + c.id + '">' + c.codigo + ' — ' + c.nombre + '</option>';
    }
    select.value = valActual;
  }
}

function actualizarInfoCliente() {
  var clienteId = document.getElementById('cot-cliente').value;
  if (!clienteId) return;
  var cliente = findItem(STORAGE_KEYS.CLIENTES, clienteId);
  if (cliente && cliente.contacto) {
    var atencion = document.getElementById('cot-atencion');
    if (atencion && !atencion.value) {
      atencion.value = cliente.contacto;
    }
  }
}
