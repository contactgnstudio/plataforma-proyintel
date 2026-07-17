// ============================================================
// js/utils.js — Utilidades base de GN Studio OS
// Núcleo compartido para formateo, IDs, DOM y manejo de errores
// ============================================================

(function(window) {
  'use strict';

  if (!window.GNStudio) {
    window.GNStudio = {};
  }

  var GNStudio = window.GNStudio;

  var GN_CONFIG = {
    APP_NAME: 'GN Studio OS',
    VERSION: '2.0.0-core',
    DEBUG: true,
    LOCALE: 'es-PA',
    CURRENCY: 'USD',
    TIMEZONE: 'America/Panama'
  };

  function log(level, message, meta) {
    if (!GN_CONFIG.DEBUG && level === 'debug') return;
    var prefix = '[GN ' + level.toUpperCase() + '] ' + message;
    if (meta !== undefined) {
      console[level] ? console[level](prefix, meta) : console.log(prefix, meta);
      return;
    }
    console[level] ? console[level](prefix) : console.log(prefix);
  }

  function safeString(value) {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  function escapeHtml(value) {
    return safeString(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function generateId(prefix) {
    var base = Date.now().toString(36);
    var rand = Math.random().toString(36).slice(2, 8);
    return (prefix || 'gn') + '-' + base + '-' + rand;
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function getTodayISO() {
    var now = new Date();
    return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  }

  function formatDate(value) {
    if (!value) return '-';
    var date = new Date(value);
    if (isNaN(date.getTime())) return safeString(value);
    return date.toLocaleDateString(GN_CONFIG.LOCALE, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  function formatDateTime(value) {
    if (!value) return '-';
    var date = new Date(value);
    if (isNaN(date.getTime())) return safeString(value);
    return date.toLocaleString(GN_CONFIG.LOCALE, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function parseNumber(value) {
    var number = parseFloat(value);
    return isNaN(number) ? 0 : number;
  }

  function formatMoney(value) {
    var number = parseNumber(value);
    return GN_CONFIG.CURRENCY + ' ' + number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function debounce(fn, wait) {
    var timeout = null;
    return function() {
      var args = arguments;
      var context = this;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        fn.apply(context, args);
      }, wait || 200);
    };
  }

  function showFeedback(target, message, type) {
    var el = typeof target === 'string' ? byId(target) : target;
    if (!el) return;

    if (!message) {
      el.className = 'form-feedback';
      el.textContent = '';
      el.style.display = 'none';
      return;
    }

    el.className = 'form-feedback ' + (type || 'error');
    el.textContent = message;
    el.style.display = 'block';
  }

  function assertArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function noop() {
    return null;
  }

  GNStudio.config = GN_CONFIG;
  GNStudio.utils = {
    log: log,
    safeString: safeString,
    escapeHtml: escapeHtml,
    byId: byId,
    qs: qs,
    qsa: qsa,
    generateId: generateId,
    getTodayISO: getTodayISO,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    parseNumber: parseNumber,
    formatMoney: formatMoney,
    clone: clone,
    debounce: debounce,
    showFeedback: showFeedback,
    assertArray: assertArray,
    noop: noop
  };

  window.GN_CONFIG = GN_CONFIG;
  window.GNUtils = GNStudio.utils;

  window.generarId = generateId;
  window.formatMoney = formatMoney;
  window.formatDate = formatDate;
  window.escapeHtml = escapeHtml;
  window.gnById = byId;
  window.gnDebounce = debounce;

  log('info', 'utils.js cargado correctamente');
})(window);
