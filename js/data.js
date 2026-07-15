// ============================================================
// js/data.js — Utilidades y helpers globales
// ============================================================

var fmt = new Intl.NumberFormat('es-PA', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatMoney(valor) {
  var num = parseFloat(valor);
  if (isNaN(num)) num = 0;
  return fmt.format(num);
}

function formatNumber(valor) {
  var num = parseFloat(valor);
  if (isNaN(num)) num = 0;
  return new Intl.NumberFormat('es-PA').format(num);
}

function formatDate(fecha) {
  if (!fecha) return '';

  var d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;

  return d.toLocaleDateString('es-PA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function generarId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function generarNumeroCotizacion(fecha) {
  var d = fecha ? new Date(fecha) : new Date();

  if (isNaN(d.getTime())) {
    d = new Date();
  }

  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var yy = String(d.getFullYear()).slice(-2);
  var rnd = Math.floor(Math.random() * 900 + 100);

  return 'COT-' + dd + mm + yy + '-' + rnd;
}

function slugify(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function debounce(func, wait) {
  var timeout;

  return function() {
    var context = this;
    var args = arguments;

    clearTimeout(timeout);

    timeout = setTimeout(function() {
      func.apply(context, args);
    }, wait || 300);
  };
}

function clamp(value, min, max) {
  var num = parseFloat(value);
  if (isNaN(num)) num = 0;
  return Math.min(Math.max(num, min), max);
}

function toMoneyNumber(valor) {
  var num = parseFloat(valor);
  return isNaN(num) ? 0 : num;
}

function sumBy(arr, field) {
  if (!Array.isArray(arr)) return 0;

  var total = 0;

  for (var i = 0; i < arr.length; i++) {
    total += toMoneyNumber(arr[i] && arr[i][field]);
  }

  return total;
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

function getCategoriaLabel(cat) {
  return CAT_LABELS[cat] || cat || 'Sin categoría';
}

function getGastoLabel(cat) {
  return GASTO_LABELS[cat] || cat || 'Sin categoría';
}
