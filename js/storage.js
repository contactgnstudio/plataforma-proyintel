// ============================================================
// js/storage.js — GN Studio OS + Supabase Database
// Compatibilidad híbrida:
// - Supabase: servicios, clientes, cotizaciones, proyectos, gastos, pagos, tareas
// - localStorage legacy temporal: gn_grupos_servicios, gn_grupo_servicio_map
// ============================================================

// Mapeo de claves internas a nombres de tablas / claves legacy
var STORAGE_KEYS = {
  SERVICIOS: 'servicios',
  CLIENTES: 'clientes',
  COTIZACIONES: 'cotizaciones',
  PROYECTOS: 'proyectos',
  GASTOS: 'gastos',
  PAGOS: 'pagos',
  TAREAS: 'tareas',
  GRUPOS_SERVICIOS: 'gn_grupos_servicios',
  GRUPO_SERVICIO_MAP: 'gn_grupo_servicio_map'
};

// Claves legacy que todavía viven en localStorage
var LEGACY_LOCAL_KEYS = {
  gn_grupos_servicios: {
    type: 'array',
    fallback: []
  },
  gn_grupo_servicio_map: {
    type: 'object',
    fallback: {}
  }
};

// Alias para compatibilidad con código viejo
var TABLE_ALIASES = {
  gn_tareas: 'tareas'
};

// ============================================================
// Helpers
// ============================================================

function gnSupabase() {
  return window.supabaseClient || null;
}

function gnHasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function gnIsLegacyLocalKey(key) {
  return gnHasOwn(LEGACY_LOCAL_KEYS, key);
}

function gnResolveTableName(tableName) {
  return TABLE_ALIASES[tableName] || tableName;
}

function gnCloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function gnLegacyFallback(key) {
  if (!gnIsLegacyLocalKey(key)) return [];
  return gnCloneValue(LEGACY_LOCAL_KEYS[key].fallback);
}

function gnReadLegacyLocal(key) {
  if (!gnIsLegacyLocalKey(key)) return null;

  try {
    var raw = localStorage.getItem(key);
    if (!raw) return gnLegacyFallback(key);

    var parsed = JSON.parse(raw);
    var expectedType = LEGACY_LOCAL_KEYS[key].type;

    if (expectedType === 'array') {
      return Array.isArray(parsed) ? parsed : [];
    }

    if (expectedType === 'object') {
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
      }
      return parsed;
    }

    return parsed;
  } catch (e) {
    console.error('Error leyendo localStorage ' + key + ':', e);
    return gnLegacyFallback(key);
  }
}

function gnWriteLegacyLocal(key, value) {
  if (!gnIsLegacyLocalKey(key)) return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Error guardando localStorage ' + key + ':', e);
    return false;
  }
}

function gnGenerateLegacyId(prefix) {
  return (prefix || 'id') + '-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
}

function gnNormalizeLegacyArrayItem(item) {
  var record = Object.assign({}, item || {});
  if (!record.id) {
    record.id = gnGenerateLegacyId('legacy');
  }
  return record;
}

// ============================================================
// getData — Obtener todos los registros
// NOTA:
// - Si la clave es legacy, responde en modo síncrono para no romper grupos.js
// - Si la clave es Supabase, responde una Promise como hasta ahora
// ============================================================

function getData(tableName) {
  if (gnIsLegacyLocalKey(tableName)) {
    return gnReadLegacyLocal(tableName);
  }

  var resolvedTable = gnResolveTableName(tableName);
  var sb = gnSupabase();

  if (!sb) {
    console.error('Supabase no disponible');
    return [];
  }

  return sb
    .from(resolvedTable)
    .select('*')
    .order('created_at', { ascending: false })
    .then(function(result) {
      if (result.error) {
        console.error('Error getData ' + resolvedTable + ':', result.error.message);
        return [];
      }
      return result.data || [];
    })
    .catch(function(e) {
      console.error('Error getData ' + resolvedTable + ':', e);
      return [];
    });
}

// ============================================================
// setData — Reemplazar registros completos
// - localStorage legacy: sí reemplaza
// - Supabase: solo warning de compatibilidad
// ============================================================

function setData(tableName, dataArray) {
  if (gnIsLegacyLocalKey(tableName)) {
    var expectedType = LEGACY_LOCAL_KEYS[tableName].type;

    if (expectedType === 'array') {
      var safeArray = Array.isArray(dataArray) ? dataArray : [];
      return gnWriteLegacyLocal(tableName, safeArray);
    }

    if (expectedType === 'object') {
      var safeObject = dataArray && typeof dataArray === 'object' && !Array.isArray(dataArray)
        ? dataArray
        : {};
      return gnWriteLegacyLocal(tableName, safeObject);
    }

    return gnWriteLegacyLocal(tableName, dataArray);
  }

  console.warn('setData es una operación de reemplazo masivo. Usar addItem/updateItem/deleteItem en su lugar.');
  return true;
}

// ============================================================
// addItem — Insertar un nuevo registro
// ============================================================

function addItem(tableName, item) {
  if (gnIsLegacyLocalKey(tableName)) {
    if (LEGACY_LOCAL_KEYS[tableName].type !== 'array') {
      console.error('addItem no aplica sobre clave legacy tipo object: ' + tableName);
      return Promise.resolve(null);
    }

    var current = gnReadLegacyLocal(tableName);
    var record = gnNormalizeLegacyArrayItem(item);
    current.push(record);
    gnWriteLegacyLocal(tableName, current);
    return Promise.resolve(record);
  }

  var resolvedTable = gnResolveTableName(tableName);
  var sb = gnSupabase();
  if (!sb) return Promise.resolve(null);

  return sb.auth.getSession().then(function(session) {
    var userId = session && session.data && session.data.session
      ? session.data.session.user.id
      : null;

    if (!userId) {
      console.error('Usuario no autenticado');
      return null;
    }

    var record = Object.assign({}, item);
    delete record.id;
    record.user_id = userId;

    delete record.codigo;

    return sb
      .from(resolvedTable)
      .insert(record)
      .select()
      .single()
      .then(function(result) {
        if (result.error) {
          console.error('Error addItem ' + resolvedTable + ':', result.error.message);
          return null;
        }
        return result.data;
      });
  }).catch(function(e) {
    console.error('Error addItem ' + resolvedTable + ':', e);
    return null;
  });
}

// ============================================================
// findItem — Buscar un registro por ID
// ============================================================

function findItem(tableName, id) {
  if (gnIsLegacyLocalKey(tableName)) {
    var current = gnReadLegacyLocal(tableName);

    if (Array.isArray(current)) {
      for (var i = 0; i < current.length; i++) {
        if (current[i] && current[i].id === id) return current[i];
      }
      return null;
    }

    if (current && typeof current === 'object') {
      return gnHasOwn(current, id) ? current[id] : null;
    }

    return null;
  }

  var resolvedTable = gnResolveTableName(tableName);
  var sb = gnSupabase();
  if (!sb) return Promise.resolve(null);

  return sb
    .from(resolvedTable)
    .select('*')
    .eq('id', id)
    .single()
    .then(function(result) {
      if (result.error) return null;
      return result.data;
    })
    .catch(function() {
      return null;
    });
}

// ============================================================
// updateItem — Actualizar un registro por ID
// ============================================================

function updateItem(tableName, id, changes) {
  if (gnIsLegacyLocalKey(tableName)) {
    var expectedType = LEGACY_LOCAL_KEYS[tableName].type;

    if (expectedType === 'array') {
      var list = gnReadLegacyLocal(tableName);
      var updated = false;

      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].id === id) {
          list[i] = Object.assign({}, list[i], changes || {});
          updated = true;
          break;
        }
      }

      if (updated) {
        gnWriteLegacyLocal(tableName, list);
      }

      return Promise.resolve(updated);
    }

    if (expectedType === 'object') {
      var map = gnReadLegacyLocal(tableName);
      map[id] = Object.assign({}, map[id] || {}, changes || {});
      gnWriteLegacyLocal(tableName, map);
      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  }

  var resolvedTable = gnResolveTableName(tableName);
  var sb = gnSupabase();
  if (!sb) return Promise.resolve(false);

  var updates = Object.assign({}, changes || {});
  updates.updated_at = new Date().toISOString();

  return sb
    .from(resolvedTable)
    .update(updates)
    .eq('id', id)
    .then(function(result) {
      if (result.error) {
        console.error('Error updateItem ' + resolvedTable + ':', result.error.message);
        return false;
      }
      return true;
    })
    .catch(function(e) {
      console.error('Error updateItem ' + resolvedTable + ':', e);
      return false;
    });
}

// ============================================================
// deleteItem — Eliminar un registro por ID
// ============================================================

function deleteItem(tableName, id) {
  if (gnIsLegacyLocalKey(tableName)) {
    var expectedType = LEGACY_LOCAL_KEYS[tableName].type;

    if (expectedType === 'array') {
      var list = gnReadLegacyLocal(tableName);
      var next = list.filter(function(item) {
        return !item || item.id !== id;
      });
      gnWriteLegacyLocal(tableName, next);
      return Promise.resolve(true);
    }

    if (expectedType === 'object') {
      var map = gnReadLegacyLocal(tableName);
      if (gnHasOwn(map, id)) {
        delete map[id];
        gnWriteLegacyLocal(tableName, map);
      }
      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  }

  var resolvedTable = gnResolveTableName(tableName);
  var sb = gnSupabase();
  if (!sb) return Promise.resolve(false);

  return sb
    .from(resolvedTable)
    .delete()
    .eq('id', id)
    .then(function(result) {
      if (result.error) {
        console.error('Error deleteItem ' + resolvedTable + ':', result.error.message);
        return false;
      }
      return true;
    })
    .catch(function(e) {
      console.error('Error deleteItem ' + resolvedTable + ':', e);
      return false;
    });
}

// ============================================================
// getDataFiltered — Obtener registros con filtros
// ============================================================

function getDataFiltered(tableName, filters) {
  if (gnIsLegacyLocalKey(tableName)) {
    var data = gnReadLegacyLocal(tableName);

    if (!Array.isArray(data)) {
      return data || {};
    }

    if (!filters || typeof filters !== 'object') {
      return data;
    }

    return data.filter(function(item) {
      for (var key in filters) {
        if (item[key] !== filters[key]) {
          return false;
        }
      }
      return true;
    });
  }

  var resolvedTable = gnResolveTableName(tableName);
  var sb = gnSupabase();
  if (!sb) return Promise.resolve([]);

  try {
    var query = sb.from(resolvedTable).select('*');

    if (filters) {
      for (var key in filters) {
        query = query.eq(key, filters[key]);
      }
    }

    return query
      .order('created_at', { ascending: false })
      .then(function(result) {
        if (result.error) return [];
        return result.data || [];
      })
      .catch(function() {
        return [];
      });
  } catch (e) {
    return Promise.resolve([]);
  }
}
