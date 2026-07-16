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

// ============================================================
// Modal de cliente — Nuevo y Editar
// ============================================================

function abrirModalCliente(id) {
  // Remover modal anterior si existe
  var existing = document.getElementById('gn-modal-cliente');
  if (existing) existing.remove();

  var esEdicion = !!id;
  var titulo = esEdicion ? 'Editar Cliente' : 'Nuevo Cliente';

  var modal = document.createElement('div');
  modal.id = 'gn-modal-cliente';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';

  modal.innerHTML = `
    <div style="background:#1a1a2e;border-radius:12px;padding:32px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;border:1px solid #2a2a4a;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <h3 style="margin:0;color:#fff;font-size:18px;">${titulo}</h3>
        <button onclick="cerrarModalCliente()" style="background:none;border:none;color:#aaa;font-size:24px;cursor:pointer;">&#x2715;</button>
      </div>
      <form id="form-cliente" onsubmit="return false;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div style="grid-column:1/-1;">
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">NOMBRE *</label>
            <input id="cli-nombre" type="text" placeholder="Nombre completo o razón social" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;" />
          </div>
          <div>
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">NOMBRE COMERCIAL</label>
            <input id="cli-nombre-comercial" type="text" placeholder="Nombre comercial" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;" />
          </div>
          <div>
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">RUC</label>
            <input id="cli-ruc" type="text" placeholder="Ej: 8-123-456" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;" />
          </div>
          <div>
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">DÍGITO VERIFICADOR</label>
            <input id="cli-dv" type="text" placeholder="DV" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;" />
          </div>
          <div>
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">TIPO CONTRIBUYENTE</label>
            <select id="cli-tipo-contrib" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;">
              <option value="">-- Seleccionar --</option>
              <option value="natural">Persona Natural</option>
              <option value="juridico">Persona Jurídica</option>
            </select>
          </div>
          <div>
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">CORREO</label>
            <input id="cli-correo" type="email" placeholder="correo@empresa.com" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;" />
          </div>
          <div>
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">TELÉFONO</label>
            <input id="cli-telefono" type="text" placeholder="+507 6000-0000" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;" />
          </div>
          <div>
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">TELÉFONO 2</label>
            <input id="cli-telefono2" type="text" placeholder="Secundario" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;" />
          </div>
          <div>
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">PERSONA DE CONTACTO</label>
            <input id="cli-contacto" type="text" placeholder="Nombre del contacto" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;" />
          </div>
          <div>
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">PROVINCIA</label>
            <select id="cli-provincia" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;">
              <option value="">-- Seleccionar --</option>
              <option>Panamá</option><option>Panamá Oeste</option><option>Colon</option>
              <option>Chiriqí</option><option>Bocas del Toro</option><option>Coclé</option>
              <option>Her rera</option><option>Los Santos</option><option>Ver aguas</option>
              <option>Darién</option><option>Ngäbe-Buglé</option><option>Guna Yala</option>
            </select>
          </div>
          <div style="grid-column:1/-1;">
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">DIRECCIÓN</label>
            <input id="cli-direccion" type="text" placeholder="Dirección completa" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;" />
          </div>
          <div style="grid-column:1/-1;">
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px;">NOTAS</label>
            <textarea id="cli-notas" rows="3" placeholder="Notas internas" style="width:100%;padding:10px;background:#0f0f23;border:1px solid #333;border-radius:8px;color:#fff;box-sizing:border-box;resize:vertical;"></textarea>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:24px;justify-content:flex-end;">
          <button type="button" onclick="cerrarModalCliente()" style="padding:10px 20px;background:#333;border:none;border-radius:8px;color:#fff;cursor:pointer;">Cancelar</button>
          <button type="button" onclick="${esEdicion ? 'actualizarCliente(event)' : 'guardarCliente(event)'}" style="padding:10px 24px;background:#4caf50;border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:600;">${esEdicion ? 'Actualizar' : 'Guardar Cliente'}</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Si es edición, cargar datos
  if (esEdicion) {
    findItem(STORAGE_KEYS.CLIENTES, id).then(function(cliente) {
      if (!cliente) return;
      var set = function(elId, val) { var el = document.getElementById(elId); if (el) el.value = val || ''; };
      set('cli-nombre', cliente.nombre);
      set('cli-nombre-comercial', cliente.nombre_comercial);
      set('cli-ruc', cliente.ruc);
      set('cli-dv', cliente.dv);
      set('cli-tipo-contrib', cliente.tipo_contribuyente);
      set('cli-correo', cliente.correo);
      set('cli-telefono', cliente.telefono);
      set('cli-telefono2', cliente.telefono_secundario);
      set('cli-contacto', cliente.contacto_nombre);
      set('cli-provincia', cliente.provincia);
      set('cli-direccion', cliente.direccion);
      set('cli-notas', cliente.notas);
      var form = document.getElementById('form-cliente');
      if (form) form.dataset.editingId = id;
    });
  }

  // Cerrar al hacer clic fuera
  modal.addEventListener('click', function(e) {
    if (e.target === modal) cerrarModalCliente();
  });
}

function cerrarModalCliente() {
  var modal = document.getElementById('gn-modal-cliente');
  if (modal) modal.remove();
}

// Sobrescribir guardarCliente para cerrar modal al terminar
var _guardarClienteOriginal = guardarCliente;
async function guardarCliente(event) {
  await _guardarClienteOriginal(event);
  cerrarModalCliente();
}
  });
}
