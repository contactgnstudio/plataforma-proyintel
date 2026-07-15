// ============================================================
// js/storage.js — Gestión de localStorage
// ============================================================

var STORAGE_KEYS = {
  SERVICIOS: 'gn_catalogo_servicios',
  CLIENTES: 'gn_clientes',
  COTIZACIONES: 'gn_cotizaciones',
  PROYECTOS: 'gn_proyectos',
  GASTOS: 'gn_gastos',
  PAGOS: 'gn_pagos',
  SESSION: 'gn_session'
  TAREAS: 'gn_tareas',
};

function getData(key) {
  try {
    var data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error leyendo ' + key + ':', e);
    return [];
  }
}

function setData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error guardando ' + key + ':', e);
    return false;
  }
}

function addItem(key, item) {
  var items = getData(key);
  items.push(item);
  return setData(key, items);
}

function updateItem(key, id, newData) {
  var items = getData(key);
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === id) {
      items[i] = Object.assign({}, items[i], newData);
      return setData(key, items);
    }
  }
  return false;
}

function deleteItem(key, id) {
  var items = getData(key).filter(function(item) { return item.id !== id; });
  return setData(key, items);
}

function findItem(key, id) {
  var items = getData(key);
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === id) return items[i];
  }
  return null;
}

function exportarTodo() {
  var data = {
    exportado: new Date().toISOString(),
    servicios: getData(STORAGE_KEYS.SERVICIOS),
    clientes: getData(STORAGE_KEYS.CLIENTES),
    cotizaciones: getData(STORAGE_KEYS.COTIZACIONES),
    proyectos: getData(STORAGE_KEYS.PROYECTOS),
    gastos: getData(STORAGE_KEYS.GASTOS),
    pagos: getData(STORAGE_KEYS.PAGOS)
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'gn-studio-backup-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
}
