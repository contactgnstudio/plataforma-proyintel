// ============================================================
// js/storage.js — GN Studio OS + Supabase Database
// ============================================================

// Mapeo de claves internas a nombres de tablas en Supabase
var STORAGE_KEYS = {
  SERVICIOS:    'servicios',
  CLIENTES:     'clientes',
  COTIZACIONES: 'cotizaciones',
  PROYECTOS:    'proyectos',
  GASTOS:       'gastos',
  PAGOS:        'pagos',
  TAREAS:       'tareas'
};

// Helper: obtener cliente Supabase
function gnSupabase() {
  return window.supabaseClient || null;
}

// ============================================================
// getData — Obtener todos los registros de una tabla
// ============================================================
async function getData(tableName) {
  var sb = gnSupabase();
  if (!sb) { console.error('Supabase no disponible'); return []; }
  try {
    var result = await sb.from(tableName).select('*').order('created_at', { ascending: false });
    if (result.error) { console.error('Error getData ' + tableName + ':', result.error.message); return []; }
    return result.data || [];
  } catch (e) {
    console.error('Error getData ' + tableName + ':', e);
    return [];
  }
}

// ============================================================
// setData — Reemplazar todos los registros (uso interno)
// En Supabase no existe un "setAll", se usa solo para compatibilidad
// ============================================================
async function setData(tableName, dataArray) {
  console.warn('setData es una operación de reemplazo masivo. Usar addItem/updateItem/deleteItem en su lugar.');
  return true;
}

// ============================================================
// addItem — Insertar un nuevo registro
// ============================================================
async function addItem(tableName, item) {
  var sb = gnSupabase();
  if (!sb) return null;
  // Agregar user_id automáticamente
  var session = await sb.auth.getSession();
  var userId = session.data.session ? session.data.session.user.id : null;
  if (!userId) { console.error('Usuario no autenticado'); return null; }
  var record = Object.assign({}, item);
  delete record.id; // Supabase genera el UUID
  record.user_id = userId;
  // Remover campos que no existen en Supabase
  delete record.codigo;
  try {
    var result = await sb.from(tableName).insert(record).select().single();
    if (result.error) { console.error('Error addItem ' + tableName + ':', result.error.message); return null; }
    return result.data;
  } catch (e) {
    console.error('Error addItem ' + tableName + ':', e);
    return null;
  }
}

// ============================================================
// findItem — Buscar un registro por ID
// ============================================================
async function findItem(tableName, id) {
  var sb = gnSupabase();
  if (!sb) return null;
  try {
    var result = await sb.from(tableName).select('*').eq('id', id).single();
    if (result.error) return null;
    return result.data;
  } catch (e) {
    return null;
  }
}

// ============================================================
// updateItem — Actualizar un registro por ID
// ============================================================
async function updateItem(tableName, id, changes) {
  var sb = gnSupabase();
  if (!sb) return false;
  var updates = Object.assign({}, changes);
  updates.updated_at = new Date().toISOString();
  try {
    var result = await sb.from(tableName).update(updates).eq('id', id);
    if (result.error) { console.error('Error updateItem ' + tableName + ':', result.error.message); return false; }
    return true;
  } catch (e) {
    console.error('Error updateItem ' + tableName + ':', e);
    return false;
  }
}

// ============================================================
// deleteItem — Eliminar un registro por ID
// ============================================================
async function deleteItem(tableName, id) {
  var sb = gnSupabase();
  if (!sb) return false;
  try {
    var result = await sb.from(tableName).delete().eq('id', id);
    if (result.error) { console.error('Error deleteItem ' + tableName + ':', result.error.message); return false; }
    return true;
  } catch (e) {
    console.error('Error deleteItem ' + tableName + ':', e);
    return false;
  }
}

// ============================================================
// getDataFiltered — Obtener registros con filtros
// ============================================================
async function getDataFiltered(tableName, filters) {
  var sb = gnSupabase();
  if (!sb) return [];
  try {
    var query = sb.from(tableName).select('*');
    if (filters) {
      for (var key in filters) {
        query = query.eq(key, filters[key]);
      }
    }
    var result = await query.order('created_at', { ascending: false });
    if (result.error) return [];
    return result.data || [];
  } catch (e) {
    return [];
  }
}
