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

function getData(key) {
  try {
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error leyendo ' + key + ':', e);
    return [];
  }
}

function setData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error guardando ' + key + ':', e);
  }
}

function addItem(key, item) {
  var data = getData(key);
  data.push(item);
  setData(key, data);
}

function findItem(key, id) {
  var data = getData(key);
  for (var i = 0; i < data.length; i++) {
    if (data[i].id === id) return data[i];
  }
  return null;
}

function updateItem(key, id, changes) {
  var data = getData(key);
  for (var i = 0; i < data.length; i++) {
    if (data[i].id === id) {
      for (var prop in changes) {
        data[i][prop] = changes[prop];
      }
      setData(key, data);
      return true;
    }
  }
  return false;
}

function deleteItem(key, id) {
  var data = getData(key);
  var filtered = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].id !== id) filtered.push(data[i]);
  }
  setData(key, filtered);
}

function generarId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatMoney(amount) {
  var num = parseFloat(amount) || 0;
  return '$' + num.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
}

var CAT_LABELS = {
  diseno_web: 'Diseño Web',
  desarrollo: 'Desarrollo',
  branding: 'Branding & Identidad',
  marketing: 'Marketing Digital',
  social_media: 'Social Media',
  seo: 'SEO & Posicionamiento',
  fotografia: 'Fotografía & Video',
  consultoria: 'Consultoría',
  mantenimiento: 'Mantenimiento Web',
  hosting: 'Hosting & Dominio',
  otros: 'Otros'
};

var GASTO_LABELS = {
  software: 'Software & Herramientas',
  hosting: 'Hosting & Dominios',
  marketing: 'Marketing & Ads',
  equipo: 'Equipo & Hardware',
  oficina: 'Oficina & Suministros',
  transporte: 'Transporte & Logística',
  capacitacion: 'Capacitación',
  servicios: 'Servicios Profesionales',
  impuestos: 'Impuestos',
  otros: 'Otros'
};
