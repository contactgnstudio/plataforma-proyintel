// ============================================================
// js/clientes.js — Gestión de Clientes
// ============================================================

function inicializarClientes() {
  var data = getData(STORAGE_KEYS.CLIENTES);

  if (!Array.isArray(data) || data.length === 0) {
    var clientesEjemplo = [
      {
        id: generarId(),
        codigo: 'ACME-001',
        nombre: 'ACME Corporation',
        contacto: 'Juan Pérez',
        telefono: '+507 6000-0001',
        email: 'juan@acme.com',
        direccion: 'Ciudad de Panamá'
      },
      {
        id: generarId(),
        codigo: 'TECH-001',
        nombre: 'TechStart Panamá',
        contacto: 'María González',
        telefono: '+507 6000-0002',
        email: 'maria@techstart.com',
        direccion: 'Costa del Este'
      }
    ];

    setData(STORAGE_KEYS.CLIENTES, clientesEjemplo);
  }
}

function obtenerClientes() {
  var clientes = getData(STORAGE_KEYS.CLIENTES);
  return Array.isArray(clientes) ? clientes : [];
}

function guardarCliente(event) {
  if (event) event.preventDefault();

  var feedback = document.getElementById('feedback-cliente');
  var form = document.getElementById('formCliente');

  var codigoEl = document.getElementById('cli-codigo');
  var nombreEl = document.getElementById('cli-nombre');
  var contactoEl = document.getElementById('cli-contacto');
  var telefonoEl = document.getElementById('cli-telefono');
  var emailEl = document.getElementById('cli-email');
  var direccionEl = document.getElementById('cli-direccion');

  if (!codigoEl || !nombreEl) {
    console.error('Faltan campos del formulario de clientes');
    return false;
  }

  var codigo = codigoEl.value.trim().toUpperCase();
  var nombre = nombreEl.value.trim();
  var contacto = contactoEl ? contactoEl.value.trim() : '';
  var telefono = telefonoEl ? telefonoEl.value.trim() : '';
  var email = emailEl ? emailEl.value.trim() : '';
  var direccion = direccionEl ? direccionEl.value.trim() : '';

  if (!codigo || !nombre) {
    if (feedback) {
      feedback.className = 'form-feedback error';
      feedback.textContent = '❌ Completa al menos código y nombre del cliente';
    }
    return false;
  }

  var clientes = obtenerClientes();

  for (var i = 0; i < clientes.length; i++) {
    if (clientes[i].codigo === codigo) {
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = '❌ El código "' + codigo + '" ya existe';
      }
      return false;
    }
  }

  var nuevoCliente = {
    id: generarId(),
    codigo: codigo,
    nombre: nombre,
    contacto: contacto,
    telefono: telefono,
    email: email,
    direccion: direccion
  };

  clientes.push(nuevoCliente);
  clientes.sort(function(a, b) {
    return a.nombre.localeCompare(b.nombre);
  });

  setData(STORAGE_KEYS.CLIENTES, clientes);

  if (feedback) {
    feedback.className = 'form-feedback success';
    feedback.textContent = '✅ Cliente "' + nuevoCliente.nombre + '" guardado correctamente';
  }

  if (form) form.reset();

  renderClientes();
  actualizarSelectClientes();

  return false;
}

function eliminarCliente(id) {
  if (!id) return;
  if (!confirm('¿Eliminar este cliente?')) return;

  deleteItem(STORAGE_KEYS.CLIENTES, id);
  renderClientes();
  actualizarSelectClientes();
}

function renderClientes(filtro) {
  var tbody = document.getElementById('tbodyClientes');
  if (!tbody) return;

  var clientes = obtenerClientes();

  if (filtro) {
    var term = filtro.toLowerCase();
    clientes = clientes.filter(function(c) {
      return (
        (c.nombre || '').toLowerCase().indexOf(term) !== -1 ||
        (c.codigo || '').toLowerCase().indexOf(term) !== -1 ||
        (c.contacto || '').toLowerCase().indexOf(term) !== -1 ||
        (c.email || '').toLowerCase().indexOf(term) !== -1
      );
    });
  }

  clientes.sort(function(a, b) {
    return (a.nombre || '').localeCompare(b.nombre || '');
  });

  if (clientes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="tabla-vacia">
            <div class="tabla-vacia-icon">📭</div>
            <div>No hay clientes registrados</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  var html = '';

  for (var i = 0; i < clientes.length; i++) {
    var c = clientes[i];

    html += `
      <tr>
        <td>${escapeHTML(c.codigo || '—')}</td>
        <td>${escapeHTML(c.nombre || '—')}</td>
        <td>${escapeHTML(c.contacto || '—')}</td>
        <td>${escapeHTML(c.telefono || '—')}</td>
        <td>
          <span class="estado-badge estado-aprobado">Activo</span>
        </td>
        <td class="td-actions">
          <button class="btn-icon" type="button" onclick="eliminarCliente('${c.id}')" title="Eliminar">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = html;
}

function actualizarSelectClientes() {
  var clientes = obtenerClientes();
  var selects = [
    document.getElementById('cot-cliente')
  ];

  for (var s = 0; s < selects.length; s++) {
    var select = selects[s];
    if (!select) continue;

    var valorActual = select.value;
    var html = '<option value="">Seleccionar cliente</option>';

    clientes.sort(function(a, b) {
      return (a.nombre || '').localeCompare(b.nombre || '');
    });

    for (var i = 0; i < clientes.length; i++) {
      var c = clientes[i];
      html += '<option value="' + c.id + '">' +
        escapeHTML(c.codigo + ' — ' + c.nombre) +
      '</option>';
    }

    select.innerHTML = html;

    if (valorActual) {
      select.value = valorActual;
    }
  }
}

function buscarClientes(valor) {
  renderClientes(valor || '');
}

function escapeHTML(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
