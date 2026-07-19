// ============================================================
// js/clientes.js — GN Studio OS + Supabase
// CRM con tabla simplificada y conteo de proyectos por cliente
// ============================================================

async function inicializarClientes() {
  await renderClientes();
  await actualizarSelectClientes();
}

// Obtener clientes desde Supabase
async function obtenerClientes() {
  return await getData(STORAGE_KEYS.CLIENTES);
}

// Obtener proyectos para conteo por cliente (usa STORAGE_KEYS.PROYECTOS)
async function obtenerProyectos() {
  const key = STORAGE_KEYS.PROYECTOS || 'proyectos';
  return await getData(key);
}

// Construir mapa clienteId -> cantidad de proyectos
async function obtenerConteoProyectosPorCliente() {
  const proyectos = await obtenerProyectos();
  const mapa = {};

  (proyectos || []).forEach(function(p) {
    const cid = String(p.cliente_id || p.clienteId || '').trim();
    if (!cid) return;
    if (!mapa[cid]) mapa[cid] = 0;
    mapa[cid] += 1;
  });

  return mapa;
}

async function guardarCliente(event) {
  if (event) event.preventDefault();

  var form = document.getElementById('form-cliente');
  var editingId = form ? form.dataset.editingId || '' : '';
  var nombre = (document.getElementById('cli-nombre') || {}).value;

  if (!nombre || !nombre.trim()) {
    alert('El nombre del cliente es obligatorio.');
    return false;
  }

  var payload = {
    nombre: (document.getElementById('cli-nombre') || {}).value || '',
    nombre_comercial: (document.getElementById('cli-nombre-comercial') || {}).value || '',
    ruc: (document.getElementById('cli-ruc') || {}).value || '',
    dv: (document.getElementById('cli-dv') || {}).value || '',
    tipo_contribuyente: (document.getElementById('cli-tipo-contrib') || {}).value || '',
    correo: (document.getElementById('cli-correo') || {}).value || '',
    telefono: (document.getElementById('cli-telefono') || {}).value || '',
    telefono_secundario: (document.getElementById('cli-telefono2') || {}).value || '',
    contacto_nombre: (document.getElementById('cli-contacto') || {}).value || '',
    direccion: (document.getElementById('cli-direccion') || {}).value || '',
    provincia: (document.getElementById('cli-provincia') || {}).value || '',
    tipo: 'activo',
    notas: (document.getElementById('cli-notas') || {}).value || ''
  };

  if (editingId) {
    var okUpdate = await updateItem(STORAGE_KEYS.CLIENTES, editingId, payload);
    if (!okUpdate) {
      alert('No se pudo actualizar el cliente.');
      return false;
    }
    cerrarModalCliente();
    await renderClientes();
    await actualizarSelectClientes();
    alert('Cliente actualizado exitosamente.');
    return false;
  }

  var resultado = await addItem(STORAGE_KEYS.CLIENTES, payload);
  if (!resultado) {
    alert('No se pudo guardar el cliente en Supabase.');
    return false;
  }

  cerrarModalCliente();
  await renderClientes();
  await actualizarSelectClientes();
  alert('Cliente guardado exitosamente.');
  return false;
}

async function editarCliente(id) {
  abrirModalCliente(id);
}

async function eliminarCliente(id) {
  if (!confirm('¿Seguro que deseas eliminar este cliente?')) return;

  var ok = await deleteItem(STORAGE_KEYS.CLIENTES, id);
  if (!ok) {
    alert('No se pudo eliminar el cliente.');
    return;
  }

  await renderClientes();
  await actualizarSelectClientes();
}

// Render de la tabla de clientes con conteo de proyectos
async function renderClientes() {
  var tbody = document.getElementById('tbodyClientes');
  if (!tbody) return;

  var clientes = await obtenerClientes();
  var mapaProyectos = await obtenerConteoProyectosPorCliente();

  if (!Array.isArray(clientes) || clientes.length === 0) {
    // ahora la tabla tiene 6 columnas
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay clientes registrados</td></tr>';
    return;
  }

  var html = '';

  clientes.forEach(function(c) {
    var rucCompleto = c.ruc
      ? (c.ruc + (c.dv ? '-' + c.dv : ''))
      : '-';

    var telefonoPrincipal = c.telefono || c.telefono_secundario || '-';
    var contactoWhats = telefonoPrincipal;

    var clienteId = String(c.id || '').trim();
    var proyectosCount = clienteId && mapaProyectos[clienteId]
      ? mapaProyectos[clienteId]
      : 0;

    html += '<tr>';
    // Nombre del cliente (razón social / comercial)
    html += '<td>' + escapeHtmlCliente(c.nombre || c.nombre_comercial || 'Sin nombre') + '</td>';
    // RUC
    html += '<td>' + escapeHtmlCliente(rucCompleto) + '</td>';
    // Correo
    html += '<td>' + escapeHtmlCliente(c.correo || '-') + '</td>';
    // Teléfono / WhatsApp
    html += '<td>' + escapeHtmlCliente(contactoWhats) + '</td>';
    // Proyectos (conteo)
    html += '<td>' + escapeHtmlCliente(String(proyectosCount)) + '</td>';
    // Acciones
    html += '<td>';
    html += '<button class="btn-accion" onclick="editarCliente(\'' + c.id + '\')" title="Editar">✏️</button> ';
    html += '<button class="btn-accion btn-danger" onclick="eliminarCliente(\'' + c.id + '\')" title="Eliminar">🗑️</button>';
    html += '</td>';
    html += '</tr>';
  });

  tbody.innerHTML = html;
}

// Selects de clientes usados por otros módulos (cotizaciones, proyectos, etc.)
async function actualizarSelectClientes() {
  var clientes = await obtenerClientes();
  var selects = Array.prototype.slice.call(document.querySelectorAll('.select-cliente'));
  var selectCotizacion = document.getElementById('cot-cliente');

  if (selectCotizacion) {
    selects.push(selectCotizacion);
  }

  selects.forEach(function(sel) {
    if (!sel) return;

    var current = sel.value;
    var placeholder = sel.id === 'cot-cliente'
      ? '<option value="">Selecciona un cliente</option>'
      : '<option value="">-- Seleccionar cliente --</option>';

    sel.innerHTML = placeholder;

    clientes.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = (c.nombre || c.nombre_comercial || 'Sin nombre') +
        (c.ruc ? ' (' + c.ruc + ')' : '');
      sel.appendChild(opt);
    });

    if (current) sel.value = current;
  });
}

function escapeHtmlCliente(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================
// Modal de cliente — Nuevo y Editar (sin cambios de estructura)
// ============================================================

function abrirModalCliente(id) {
  var existing = document.getElementById('gn-modal-cliente');
  if (existing) existing.remove();

  var esEdicion = !!id;
  var titulo = esEdicion ? 'Editar Cliente' : 'Nuevo Cliente';

  var modal = document.createElement('div');
  modal.id = 'gn-modal-cliente';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';

  modal.innerHTML = `
    <div style="background:#111E17;border-radius:12px;padding:32px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;border:1px solid rgba(18,53,36,0.25);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <h3 style="margin:0;color:#F0F0F5;font-size:18px;">${titulo}</h3>
        <button type="button" onclick="cerrarModalCliente()" style="background:none;border:none;color:#9CA3AF;font-size:24px;cursor:pointer;">&#x2715;</button>
      </div>

      <form id="form-cliente" onsubmit="return guardarCliente(event);">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div style="grid-column:1/-1;">
            <label style="color:#9CA3AF;font-size:12px;display:block;margin-bottom:6px;">NOMBRE *</label>
            <input id="cli-nombre" type="text" placeholder="Nombre completo o razón social" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(18,53,36,0.25);border-radius:8px;color:#F0F0F5;box-sizing:border-box;" />
          </div>

          <div>
            <label style="color:#9CA3AF;font-size:12px;display:block;margin-bottom:6px;">NOMBRE COMERCIAL</label>
            <input id="cli-nombre-comercial" type="text" placeholder="Nombre comercial" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(18,53,36,0.25);border-radius:8px;color:#F0F0F5;box-sizing:border-box;" />
          </div>

          <div>
            <label style="color:#9CA3AF;font-size:12px;display:block;margin-bottom:6px;">CONTACTO</label>
            <input id="cli-contacto" type="text" placeholder="Persona de contacto" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(18,53,36,0.25);border-radius:8px;color:#F0F0F5;box-sizing:border-box;" />
          </div>

          <div>
            <label style="color:#9CA3AF;font-size:12px;display:block;margin-bottom:6px;">RUC</label>
            <input id="cli-ruc" type="text" placeholder="RUC" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(18,53,36,0.25);border-radius:8px;color:#F0F0F5;box-sizing:border-box;" />
          </div>

          <div>
            <label style="color:#9CA3AF;font-size:12px;display:block;margin-bottom:6px;">DV</label>
            <input id="cli-dv" type="text" placeholder="DV" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(18,53,36,0.25);border-radius:8px;color:#F0F0F5;box-sizing:border-box;" />
          </div>

          <div>
            <label style="color:#9CA3AF;font-size:12px;display:block;margin-bottom:6px;">TIPO CONTRIBUYENTE</label>
            <input id="cli-tipo-contrib" type="text" placeholder="Natural / Jurídico" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(18,53,36,0.25);border-radius:8px;color:#F0F0F5;box-sizing:border-box;" />
          </div>

          <div>
            <label style="color:#9CA3AF;font-size:12px;display:block;margin-bottom:6px;">CORREO</label>
            <input id="cli-correo" type="email" placeholder="correo@cliente.com" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(18,53,36,0.25);border-radius:8px;color:#F0F0F5;box-sizing:border-box;" />
          </div>

          <div>
            <label style="color:#9CA3AF;font-size:12px;display:block;margin-bottom:6px;">TELÉFONO</label>
            <input id="cli-telefono" type="text" placeholder="Teléfono principal / WhatsApp" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(18,53,36,0.25);border-radius:8px;color:#F0F0F5;box-sizing:border-box;" />
          </div>

          <div>
            <label style="color:#9CA3AF;font-size:12px;display:block;margin-bottom:6px;">TELÉFONO SECUNDARIO</label>
            <input id="cli-telefono2" type="text" placeholder="Teléfono secundario" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(18,53,36,0.25);border-radius:8px;color:#F0F0F5;box-sizing:border-box;" />
          </div>

          <div>
            <label style="color:#9CA3AF;font-size:12px;display:block;margin-bottom:6px;">PROVINCIA</label>
            <input id="cli-provincia" type="text" placeholder="Provincia" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(18,53,36,0.25);border-radius:8px;color:#F0F0F5;box-sizing:border-box;" />
          </div>

          <div style="grid-column:1/-1;">
            <label style="color:#9CA3AF;font-size:12px;display:block;margin-bottom:6px;">DIRECCIÓN</label>
            <input id="cli-direccion" type="text" placeholder="Dirección completa" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(18,53,36,0.25);border-radius:8px;color:#F0F0F5;box-sizing:border-box;" />
          </div>

          <div style="grid-column:1/-1;">
            <label style="color:#9CA3AF;font-size:12px;display:block;margin-bottom:6px;">NOTAS</label>
            <textarea id="cli-notas" rows="4" placeholder="Notas internas del cliente" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(18,53,36,0.25);border-radius:8px;color:#F0F0F5;box-sizing:border-box;resize:vertical;"></textarea>
          </div>
        </div>

        <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;">
          <button type="button" onclick="cerrarModalCliente()" style="padding:10px 20px;background:rgba(18,53,36,0.25);border:none;border-radius:8px;color:#F0F0F5;cursor:pointer;">Cancelar</button>
          <button type="submit" style="padding:10px 20px;background:#C5A253;border:none;border-radius:8px;color:#F0F0F5;cursor:pointer;">Guardar Cliente</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  if (esEdicion) {
    findItem(STORAGE_KEYS.CLIENTES, id).then(function(cliente) {
      if (!cliente) return;

      var set = function(elId, val) {
        var el = document.getElementById(elId);
        if (el) el.value = val || '';
      };

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

  modal.addEventListener('click', function(e) {
    if (e.target === modal) cerrarModalCliente();
  });
}

function cerrarModalCliente() {
  var modal = document.getElementById('gn-modal-cliente');
  if (modal) modal.remove();
}
