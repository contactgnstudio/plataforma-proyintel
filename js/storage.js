// ============================================================
// js/storage.js — LocalStorage utilities
// ============================================================

var STORAGE_KEYS = {
  SERVICIOS: 'gn_servicios',
  CLIENTES: 'gn_clientes',
  COTIZACIONES: 'gn_cotizaciones',
  PROYECTOS: 'gn_proyectos',
  GASTOS: 'gn_gastos',
  PAGOS: 'gn_pagos',
  TAREAS: 'gn_tareas'
};

function storageClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (e) {
    return value;
  }
}

function getData(key, fallback) {
  var defaultValue = typeof fallback === 'undefined' ? [] : fallback;

  try {
    var raw = localStorage.getItem(key);

    if (raw === null || raw === undefined || raw === '') {
      return storageClone(defaultValue);
    }

    return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo "' + key + '":', e);
    return storageClone(defaultValue);
  }
}

function setData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error guardando "' + key + '":', e);
    return false;
  }
}

function addItem(key, item) {
  var data = getData(key, []);

  if (!Array.isArray(data)) {
    console.warn('addItem esperaba un array en "' + key + '"');
    data = [];
  }

  data.push(item);
  return setData(key, data);
}

function findItem(key, id) {
  var data = getData(key, []);

  if (!Array.isArray(data)) return null;

  for (var i = 0; i < data.length; i++) {
    if (data[i] && data[i].id === id) {
      return data[i];
    }
  }

  return null;
}

function updateItem(key, id, changes) {
  var data = getData(key, []);

  if (!Array.isArray(data)) return false;

  for (var i = 0; i < data.length; i++) {
    if (data[i] && data[i].id === id) {
      for (var prop in changes) {
        if (Object.prototype.hasOwnProperty.call(changes, prop)) {
          data[i][prop] = changes[prop];
        }
      }

      return setData(key, data);
    }
  }

  return false;
}

function deleteItem(key, id) {
  var data = getData(key, []);

  if (!Array.isArray(data)) return false;

  var filtered = [];

  for (var i = 0; i < data.length; i++) {
    if (data[i] && data[i].id !== id) {
      filtered.push(data[i]);
    }
  }

  return setData(key, filtered);
}

function upsertItem(key, item) {
  if (!item || !item.id) return false;

  var data = getData(key, []);

  if (!Array.isArray(data)) {
    data = [];
  }

  var found = false;

  for (var i = 0; i < data.length; i++) {
    if (data[i] && data[i].id === item.id) {
      data[i] = item;
      found = true;
      break;
    }
  }

  if (!found) {
    data.push(item);
  }

  return setData(key, data);
}

function clearData(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Error eliminando "' + key + '":', e);
    return false;
  }
}

function resetStorage() {
  var keys = Object.keys(STORAGE_KEYS);

  for (var i = 0; i < keys.length; i++) {
    clearData(STORAGE_KEYS[keys[i]]);
  }

  clearData('gn_grupos_servicios');
  clearData('gn_grupo_servicio_map');

  console.log('✅ Storage reiniciado');
}
