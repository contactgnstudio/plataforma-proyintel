// ============================================================
// js/storage.js — Capa de datos GN Studio OS
// Supabase como fuente principal + compatibilidad temporal legacy
// ============================================================

(function(window) {
  'use strict';

  var GNUtils = window.GNUtils || {};
  var log = GNUtils.log || function(level, message, meta) {
    if (meta !== undefined) {
      console[level] ? console[level](message, meta) : console.log(message, meta);
      return;
    }
    console[level] ? console[level](message) : console.log(message);
  };

  var STORAGE_KEYS = {
    SERVICIOS: 'servicios',
    CLIENTES: 'clientes',
    COTIZACIONES: 'cotizaciones',
    PROYECTOS: 'proyectos',
    GASTOS: 'proyecto_gastos',
    PAGOS: 'proyecto_pagos',
    TAREAS: 'tareas',
    GRUPOS_SERVICIOS: 'gn_grupos_servicios',
    GRUPO_SERVICIO_MAP: 'gn_grupo_servicio_map'
  };

  var LEGACY_KEYS = {
    gn_grupos_servicios: { type: 'array', fallback: [] },
    gn_grupo_servicio_map: { type: 'object', fallback: {} }
  };

  var TABLE_ALIASES = { gn_tareas: 'tareas' };

  function getSupabase() { return window.supabaseClient || null; }
  function hasOwn(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function isLegacyKey(key) { return hasOwn(LEGACY_KEYS, key); }
  function resolveKey(tableName) { return TABLE_ALIASES[tableName] || tableName; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function getLegacyFallback(key) { return clone(LEGACY_KEYS[key].fallback); }

  function readLegacy(key) {
    if (!isLegacyKey(key)) return null;
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return getLegacyFallback(key);
      var parsed = JSON.parse(raw);
      var expectedType = LEGACY_KEYS[key].type;
      if (expectedType === 'array') return Array.isArray(parsed) ? parsed : [];
      if (expectedType === 'object') {
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
        return parsed;
      }
      return parsed;
    } catch (error) {
      log('error', 'Error leyendo localStorage legacy: ' + key, error);
      return getLegacyFallback(key);
    }
  }

  function writeLegacy(key, value) {
    if (!isLegacyKey(key)) return false;
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { log('error', 'Error guardando localStorage legacy: ' + key, error); return false; }
  }

  async function getSessionUserId() {
    var sb = getSupabase();
    if (!sb) return null;
    try {
      var session = await sb.auth.getSession();
      return session && session.data && session.data.session ? session.data.session.user.id : null;
    } catch (error) { log('error', 'No se pudo obtener la sesión de Supabase', error); return null; }
  }

  async function getData(tableName, options) {
    if (isLegacyKey(tableName)) return readLegacy(tableName);
    var sb = getSupabase();
    var resolvedTable = resolveKey(tableName);
    var settings = options || {};
    if (!sb) { log('error', 'Supabase no disponible para getData: ' + resolvedTable); return []; }
    try {
      var query = sb.from(resolvedTable).select(settings.select || '*');
      if (settings.filters && typeof settings.filters === 'object') {
        for (var key in settings.filters) { query = query.eq(key, settings.filters[key]); }
      }
      if (settings.orderBy) { query = query.order(settings.orderBy, { ascending: !!settings.ascending }); }
      else { query = query.order('created_at', { ascending: false }); }
      var result = await query;
      if (result.error) { log('error', 'Error getData ' + resolvedTable + ': ' + result.error.message); return []; }
      return Array.isArray(result.data) ? result.data : [];
    } catch (error) { log('error', 'Error getData ' + resolvedTable, error); return []; }
  }

  async function getDataFiltered(tableName, filters, options) {
    return await getData(tableName, {
      filters: filters || {},
      orderBy: options && options.orderBy ? options.orderBy : 'created_at',
      ascending: options && options.ascending ? true : false,
      select: options && options.select ? options.select : '*'
    });
  }

  async function findItem(tableName, id) {
    if (!id) return null;
    if (isLegacyKey(tableName)) {
      var source = readLegacy(tableName);
      if (Array.isArray(source)) { for (var i = 0; i < source.length; i++) { if (source[i] && source[i].id === id) return source[i]; } return null; }
      if (source && typeof source === 'object') { return hasOwn(source, id) ? source[id] : null; }
      return null;
    }
    var sb = getSupabase();
    var resolvedTable = resolveKey(tableName);
    if (!sb) { log('error', 'Supabase no disponible para findItem: ' + resolvedTable); return null; }
    try {
      var result = await sb.from(resolvedTable).select('*').eq('id', id).single();
      if (result.error) { log('warn', 'findItem sin resultado en ' + resolvedTable + ': ' + result.error.message); return null; }
      return result.data || null;
    } catch (error) { log('error', 'Error findItem ' + resolvedTable, error); return null; }
  }

  async function addItem(tableName, item) {
    if (isLegacyKey(tableName)) {
      if (LEGACY_KEYS[tableName].type !== 'array') { log('error', 'addItem no aplica a clave legacy tipo object: ' + tableName); return null; }
      var current = readLegacy(tableName);
      var record = Object.assign({}, item || {});
      if (!record.id) { record.id = typeof window.generarId === 'function' ? window.generarId('legacy') : String(Date.now()); }
      current.push(record);
      writeLegacy(tableName, current);
      return record;
    }
    var sb = getSupabase();
    var resolvedTable = resolveKey(tableName);
    if (!sb) { log('error', 'Supabase no disponible para addItem: ' + resolvedTable); return null; }
    try {
      var userId = await getSessionUserId();
      if (!userId) { log('error', 'No hay sesión activa para insertar en ' + resolvedTable); return null; }
      var record = Object.assign({}, item || {});
      delete record.id;
      if (!record.user_id) { record.user_id = userId; }
      var result = await sb.from(resolvedTable).insert(record).select().single();
      if (result.error) { log('error', 'Error addItem ' + resolvedTable + ': ' + result.error.message); return null; }
      return result.data || null;
    } catch (error) { log('error', 'Error addItem ' + resolvedTable, error); return null; }
  }

  async function updateItem(tableName, id, changes) {
    if (!id) return false;
    if (isLegacyKey(tableName)) {
      var expectedType = LEGACY_KEYS[tableName].type;
      if (expectedType === 'array') {
        var list = readLegacy(tableName);
        var updated = false;
        for (var i = 0; i < list.length; i++) { if (list[i] && list[i].id === id) { list[i] = Object.assign({}, list[i], changes || {}); updated = true; break; } }
        if (updated) writeLegacy(tableName, list);
        return updated;
      }
      if (expectedType === 'object') { var map = readLegacy(tableName); map[id] = Object.assign({}, map[id] || {}, changes || {}); writeLegacy(tableName, map); return true; }
      return false;
    }
    var sb = getSupabase();
    var resolvedTable = resolveKey(tableName);
    if (!sb) { log('error', 'Supabase no disponible para updateItem: ' + resolvedTable); return false; }
    try {
      var payload = Object.assign({}, changes || {});
      payload.updated_at = new Date().toISOString();
      var result = await sb.from(resolvedTable).update(payload).eq('id', id);
      if (result.error) { log('error', 'Error updateItem ' + resolvedTable + ': ' + result.error.message); return false; }
      return true;
    } catch (error) { log('error', 'Error updateItem ' + resolvedTable, error); return false; }
  }

  async function deleteItem(tableName, id) {
    if (!id) return false;
    if (isLegacyKey(tableName)) {
      var expectedType = LEGACY_KEYS[tableName].type;
      if (expectedType === 'array') { var list = readLegacy(tableName); var next = list.filter(function(item) { return !item || item.id !== id; }); writeLegacy(tableName, next); return true; }
      if (expectedType === 'object') { var map = readLegacy(tableName); if (hasOwn(map, id)) { delete map[id]; writeLegacy(tableName, map); } return true; }
      return false;
    }
    var sb = getSupabase();
    var resolvedTable = resolveKey(tableName);
    if (!sb) { log('error', 'Supabase no disponible para deleteItem: ' + resolvedTable); return false; }
    try {
      var result = await sb.from(resolvedTable).delete().eq('id', id);
      if (result.error) { log('error', 'Error deleteItem ' + resolvedTable + ': ' + result.error.message); return false; }
      return true;
    } catch (error) { log('error', 'Error deleteItem ' + resolvedTable, error); return false; }
  }

  function setData(tableName, data) {
    if (isLegacyKey(tableName)) {
      if (LEGACY_KEYS[tableName].type === 'array') return writeLegacy(tableName, Array.isArray(data) ? data : []);
      if (LEGACY_KEYS[tableName].type === 'object') { var safeObject = data && typeof data === 'object' && !Array.isArray(data) ? data : {}; return writeLegacy(tableName, safeObject); }
    }
    log('warn', 'setData deshabilitado para tablas Supabase: ' + tableName + '. Usa addItem/updateItem/deleteItem.');
    return false;
  }

  // --- Gastos de Proyecto ---
  function obtenerGastosProyecto(proyectoId) {
    log('info', 'obtenerGastosProyecto: ' + proyectoId);
    return getDataFiltered(STORAGE_KEYS.GASTOS, { proyecto_id: proyectoId });
  }

  // --- Pagos de Proyecto ---
  function obtenerPagosProyecto(proyectoId) {
    log('info', 'obtenerPagosProyecto: ' + proyectoId);
    return getDataFiltered(STORAGE_KEYS.PAGOS, { proyecto_id: proyectoId });
  }

  // --- Cotización de Proyecto ---
  async function obtenerCotizacionProyecto(proyectoId) {
    log('info', 'obtenerCotizacionProyecto: ' + proyectoId);
    if (!proyectoId) return null;
    var rows = await getDataFiltered(STORAGE_KEYS.COTIZACIONES, { proyecto_id: proyectoId }, { orderBy: 'created_at', ascending: false });
    return rows && rows.length ? rows[0] : null;
  }

  // --- Items de Cotización (desde JSONB items) ---
  async function obtenerItemsCotizacion(cotizacionId) {
    log('info', 'obtenerItemsCotizacion (desde JSONB): ' + cotizacionId);
    if (!cotizacionId) return [];
    var cot = await findItem(STORAGE_KEYS.COTIZACIONES, cotizacionId);
    if (!cot || !cot.items) return [];
    try {
      var items = typeof cot.items === 'string' ? JSON.parse(cot.items) : cot.items;
      return Array.isArray(items) ? items : [];
    } catch (e) { return []; }
  }

  window.STORAGE_KEYS = STORAGE_KEYS;
  window.getData = getData;
  window.getDataFiltered = getDataFiltered;
  window.findItem = findItem;
  window.addItem = addItem;
  window.updateItem = updateItem;
  window.deleteItem = deleteItem;
  window.setData = setData;
  window.obtenerGastosProyecto = obtenerGastosProyecto;
  window.obtenerPagosProyecto = obtenerPagosProyecto;
  window.obtenerCotizacionProyecto = obtenerCotizacionProyecto;
  window.obtenerItemsCotizacion = obtenerItemsCotizacion;

  if (!window.GNStudio) { window.GNStudio = {}; }
  window.GNStudio.storage = {
    STORAGE_KEYS: STORAGE_KEYS,
    getData: getData, getDataFiltered: getDataFiltered, findItem: findItem,
    addItem: addItem, updateItem: updateItem, deleteItem: deleteItem, setData: setData,
    obtenerGastosProyecto: obtenerGastosProyecto, obtenerPagosProyecto: obtenerPagosProyecto,
    obtenerCotizacionProyecto: obtenerCotizacionProyecto, obtenerItemsCotizacion: obtenerItemsCotizacion
  };

  log('info', 'storage.js cargado correctamente (v2.3)');
})(window);
