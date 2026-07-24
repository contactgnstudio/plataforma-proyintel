// ============================================================
// js/negocio-radar.js — GN Studio OS v2.0
// Radar de Oportunidades: consume la Edge Function radar-jobs
// y renderiza tarjetas con trabajos reales (o fallback mock).
// Los jobs se abren en target="_blank" — sin iframes embebidos
// (X-Frame-Options bloquea Upwork/Workana/Fiverr/Behance/etc.)
// ============================================================

// ─── Config ─────────────────────────────────────────────────
var RADAR_SUPABASE_URL       = 'https://smbphmmaswqcwmacfdxg.supabase.co';
var RADAR_FETCH_TIMEOUT_MS   = 8000;
var RADAR_FETCH_RETRIES      = 2;
var RADAR_REFRESH_INTERVAL   = 5 * 60 * 1000;
var _radarRefreshTimer       = null;
var _radarCategoriaActiva    = null;
var _radarUltimaRespuesta    = null;

// ─── URL de la Edge Function ─────────────────────────────────
function radarGetApiUrl() {
  // Prioridad: variable global inyectada en runtime → constante hardcoded
  var base = ((window.SUPABASE_FUNCTIONS_URL || '').toString().trim()) || RADAR_SUPABASE_URL;
  if (!base || !/^https?:\/\//i.test(base)) return null;
  return base.replace(/\/+$/, '') + '/functions/v1/radar-jobs';
}

// ─── Datos mock (fallback mientras no hay integración real) ──
var RADAR_MOCK_JOBS = {
  upwork:     [
    { titulo: 'Brand Identity Designer needed',      presupuesto: '$500–$1,500',   fecha_publicacion: null, url: 'https://www.upwork.com/nx/search/jobs/?q=brand+design+identity&sort=recency' },
    { titulo: 'Logo & Visual Identity for Startup',   presupuesto: '$300–$800',     fecha_publicacion: null, url: 'https://www.upwork.com/nx/search/jobs/?q=logo+design+branding&sort=recency' },
    { titulo: 'UI/UX Web Designer – Remote',          presupuesto: '$1,000–$3,000', fecha_publicacion: null, url: 'https://www.upwork.com/nx/search/jobs/?q=web+design+ui+ux&sort=recency' }
  ],
  workana:    [
    { titulo: 'Diseño de identidad corporativa completa', presupuesto: '$400–$1,200', fecha_publicacion: null, url: 'https://www.workana.com/jobs?category=design&subcategory=brand-design&language=es' },
    { titulo: 'Rediseño de sitio web para empresa',       presupuesto: '$600–$2,000', fecha_publicacion: null, url: 'https://www.workana.com/jobs?category=design&subcategory=web-design&language=es' },
    { titulo: 'Pack de redes sociales – Branding',        presupuesto: '$200–$500',   fecha_publicacion: null, url: 'https://www.workana.com/jobs?category=design&subcategory=social-media-design&language=es' }
  ],
  fiverr:     [
    { titulo: 'Brand Identity Package – Full',  presupuesto: 'Desde $350', fecha_publicacion: null, url: 'https://www.fiverr.com/search/gigs?query=brand+identity+design&sort_by=rating' },
    { titulo: 'Professional Logo Design',        presupuesto: 'Desde $150', fecha_publicacion: null, url: 'https://www.fiverr.com/search/gigs?query=logo+branding&sort_by=rating' },
    { titulo: 'Custom Website UI/UX Design',     presupuesto: 'Desde $500', fecha_publicacion: null, url: 'https://www.fiverr.com/search/gigs?query=website+design+ui&sort_by=rating' }
  ],
  linkedin:   [
    { titulo: 'Senior Brand Designer – Remote',    presupuesto: '$80k–$110k/yr', fecha_publicacion: null, url: 'https://www.linkedin.com/jobs/search/?keywords=brand+designer&f_TPR=r86400&sortBy=DD' },
    { titulo: 'Freelance Graphic Designer',         presupuesto: 'Negociable',    fecha_publicacion: null, url: 'https://www.linkedin.com/jobs/search/?keywords=graphic+designer+freelance&f_TPR=r86400&sortBy=DD' },
    { titulo: 'UI/UX Designer – Contract Remote',   presupuesto: '$60–$90/hr',    fecha_publicacion: null, url: 'https://www.linkedin.com/jobs/search/?keywords=ui+ux+designer+remote&f_TPR=r86400&sortBy=DD' }
  ],
  freelancer: [
    { titulo: 'Logo Design for Tech Company',        presupuesto: '$30–$250',    fecha_publicacion: null, url: 'https://www.freelancer.com/jobs/graphic-design/?q=branding+logo' },
    { titulo: 'Landing Page Design – Responsive',    presupuesto: '$100–$400',   fecha_publicacion: null, url: 'https://www.freelancer.com/jobs/website-design/?q=web+design' },
    { titulo: 'Brand Identity Contest – $500 prize', presupuesto: '$500 premio', fecha_publicacion: null, url: 'https://www.freelancer.com/contest/?q=logo+brand' }
  ],
  behance:    [
    { titulo: 'Brand & Visual Identity Designer',  presupuesto: 'Full-time / Remote', fecha_publicacion: null, url: 'https://www.behance.net/joblist?tracking_source=nav20&field=132' },
    { titulo: 'Senior Motion Designer',             presupuesto: '$75k–$95k',          fecha_publicacion: null, url: 'https://www.behance.net/joblist?tracking_source=nav20&field=135' },
    { titulo: 'Visual Designer – Creative Studio',  presupuesto: 'Contract Remote',    fecha_publicacion: null, url: 'https://www.behance.net/joblist?tracking_source=nav20&field=132&location=remote' }
  ]
};

// ─── Helpers ─────────────────────────────────────────────────
function radarFormatFecha(iso) {
  if (!iso) return null;
  var d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  var diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1)    return 'ahora mismo';
  if (diff < 60)   return 'hace ' + diff + ' min';
  if (diff < 1440) return 'hace ' + Math.floor(diff / 60) + 'h';
  return 'hace ' + Math.floor(diff / 1440) + 'd';
}

// ─── Abrir job en nueva pestaña (reemplaza el iframe viewer) ─
// Los iframes de Upwork/Workana/Fiverr/Behance/LinkedIn son
// bloqueados por X-Frame-Options. La solución correcta es
// abrir el link directamente en una pestaña nueva.
function radarAbrirJob(url, plataformaId) {
  if (plataformaId) radarTrackLanzamiento(plataformaId, url);
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ─── Tracking de lanzamiento (best-effort) ───────────────────
function radarTrackLanzamiento(plataformaId, jobUrl) {
  var apiUrl = radarGetApiUrl();
  if (!apiUrl) return;
  fetch(apiUrl + '/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plataforma_id: plataformaId, job_url: jobUrl })
  }).catch(function() {});
}

// ─── Fetch con timeout + retry ───────────────────────────────
function radarFetchConTimeout(url, timeoutMs) {
  return new Promise(function(resolve, reject) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function() {
      if (controller) controller.abort();
      reject(new Error('timeout'));
    }, timeoutMs);

    var opts = controller ? { signal: controller.signal } : {};
    fetch(url, opts)
      .then(function(res) {
        clearTimeout(timer);
        if (!res.ok) reject(new Error('HTTP ' + res.status));
        else resolve(res);
      })
      .catch(function(err) {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function radarFetchConRetry(url, intentosRestantes) {
  return radarFetchConTimeout(url, RADAR_FETCH_TIMEOUT_MS)
    .catch(function(err) {
      if (intentosRestantes > 0) {
        return new Promise(function(resolve) { setTimeout(resolve, 1200); })
          .then(function() { return radarFetchConRetry(url, intentosRestantes - 1); });
      }
      throw err;
    });
}

// ─── Fetch principal de plataformas ──────────────────────────
function radarFetchPlataformas(callback, opciones) {
  var apiUrl = radarGetApiUrl();
  if (!apiUrl) {
    callback(null, 'no_url');
    return;
  }

  var params = new URLSearchParams({ limit: '3' });
  if (opciones && opciones.categoria) params.set('categoria', opciones.categoria);
  if (opciones && opciones.plataforma) params.set('plataforma', opciones.plataforma);

  radarFetchConRetry(apiUrl + '?' + params.toString(), RADAR_FETCH_RETRIES)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var plataformas = (data && Array.isArray(data.plataformas)) ? data.plataformas : null;
      callback(plataformas, plataformas ? 'ok' : 'empty');
    })
    .catch(function(err) {
      var tipo = (err && err.message === 'timeout') ? 'timeout' : 'error';
      callback(null, tipo);
    });
}

// ─── Refresh automático ───────────────────────────────────────
function radarIniciarRefresh() {
  radarDetenerRefresh();
  _radarRefreshTimer = setInterval(function() {
    var container = document.getElementById('radar-plataformas-grid');
    if (!container) { radarDetenerRefresh(); return; }
    radarRenderSilencioso();
  }, RADAR_REFRESH_INTERVAL);
}

function radarDetenerRefresh() {
  if (_radarRefreshTimer) {
    clearInterval(_radarRefreshTimer);
    _radarRefreshTimer = null;
  }
}

function radarRenderSilencioso() {
  var apiUrl = radarGetApiUrl();
  if (!apiUrl) return;

  var opciones = {};
  if (_radarCategoriaActiva) opciones.categoria = _radarCategoriaActiva;

  radarFetchPlataformas(function(plataformas, estado) {
    if (plataformas && plataformas.length > 0) {
      _radarUltimaRespuesta = plataformas;
      radarRenderConData(plataformas);
      radarActualizarTimestamp();
    }
  }, opciones);
}

// ─── Timestamp del último refresco ───────────────────────────
function radarActualizarTimestamp() {
  var el = document.getElementById('radar-ultima-actualizacion');
  if (!el) return;
  var hora = new Date();
  el.textContent = 'Actualizado: '
    + String(hora.getHours()).padStart(2, '0') + ':'
    + String(hora.getMinutes()).padStart(2, '0');
}

// ─── Render filtros de categoría ─────────────────────────────
function radarRenderFiltros(categorias, categoriaActiva) {
  var wrap = document.getElementById('radar-filtros-wrap');
  if (!wrap) return;

  var html = '<button onclick="radarCambiarCategoria(null)" '
    + 'style="padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;'
    + 'border:1px solid rgba(255,255,255,0.18);margin-right:6px;transition:all 0.15s;'
    + (categoriaActiva ? 'background:transparent;color:rgba(255,255,255,0.5);'
                       : 'background:rgba(255,255,255,0.12);color:#fff;')
    + '">Todas</button>';

  categorias.forEach(function(cat) {
    var activa = cat === categoriaActiva;
    html += '<button onclick="radarCambiarCategoria(\'' + cat + '\')" '
      + 'style="padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;'
      + 'border:1px solid rgba(255,255,255,0.18);margin-right:6px;transition:all 0.15s;'
      + (activa ? 'background:rgba(255,255,255,0.12);color:#fff;'
                : 'background:transparent;color:rgba(255,255,255,0.5);')
      + '">' + cat.charAt(0).toUpperCase() + cat.slice(1) + '</button>';
  });

  wrap.innerHTML = html;
}

// ─── Cambiar categoría activa ─────────────────────────────────
function radarCambiarCategoria(categoria) {
  _radarCategoriaActiva = categoria;
  radarRender();
}

// ─── Badge de fuente de datos ────────────────────────────────
function radarBadgeFuente(p, usandoMock) {
  if (!usandoMock) {
    if (p.fuente === 'rss' || p.fuente === 'api') {
      return '<span style="font-size:9px;color:#4ade80;margin-left:auto;padding:2px 7px;'
        + 'background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);'
        + 'border-radius:4px;white-space:nowrap;">● En vivo</span>';
    }
    if (p.fuente === 'cache' || p.fuente === 'bd') {
      return '<span style="font-size:9px;color:rgba(255,200,60,0.9);margin-left:auto;padding:2px 7px;'
        + 'background:rgba(255,200,60,0.06);border:1px solid rgba(255,200,60,0.15);'
        + 'border-radius:4px;white-space:nowrap;">⏱ Caché</span>';
    }
    return '<span style="font-size:9px;color:rgba(255,255,255,0.35);margin-left:auto;padding:2px 6px;'
      + 'background:rgba(255,255,255,0.04);border-radius:4px;white-space:nowrap;">datos reales</span>';
  }
  return '<span style="font-size:9px;color:rgba(255,255,255,0.25);margin-left:auto;padding:2px 6px;'
    + 'background:rgba(255,255,255,0.04);border-radius:4px;white-space:nowrap;">datos de ejemplo</span>';
}

// ─── Estado de error en el grid ──────────────────────────────
function radarMostrarError(motivo) {
  var container = document.getElementById('radar-plataformas-grid');
  if (!container) return;

  var mensajes = {
    timeout:  'La API tardó demasiado. Mostrando datos de ejemplo.',
    error:    'No se pudo conectar con la API. Mostrando datos de ejemplo.',
    no_url:   'Supabase no configurado. Mostrando datos de ejemplo.',
    empty:    'La API no devolvió plataformas. Mostrando datos de ejemplo.'
  };
  var msg = mensajes[motivo] || mensajes['error'];

  var banner = document.getElementById('radar-api-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'radar-api-banner';
    banner.style.cssText = [
      'font-size:11px','color:rgba(255,200,60,0.8)','padding:6px 12px',
      'background:rgba(255,200,60,0.06)','border:1px solid rgba(255,200,60,0.15)',
      'border-radius:6px','margin-bottom:12px','display:flex',
      'align-items:center','gap:6px'
    ].join(';');
    container.parentNode.insertBefore(banner, container);
  }
  banner.innerHTML = '<i class="ph ph-warning"></i> ' + msg;
  banner.style.display = 'flex';
}

function radarOcultarBanner() {
  var banner = document.getElementById('radar-api-banner');
  if (banner) banner.style.display = 'none';
}

// ─── Render con datos ────────────────────────────────────────
function radarRenderConData(plataformas) {
  var container = document.getElementById('radar-plataformas-grid');
  if (!container) return;

  if (!document.getElementById('radar-viewer-styles')) {
    var style = document.createElement('style');
    style.id = 'radar-viewer-styles';
    style.textContent = [
      '.radar-job-item:hover{background:rgba(255,255,255,0.07)!important;transform:translateX(3px)}',
      '.radar-job-item{transition:background 0.15s ease,transform 0.15s ease}',
      '.radar-tag:hover{opacity:0.85;transform:translateY(-1px)}',
      '.radar-tag{transition:opacity 0.15s,transform 0.15s}',
      '.radar-btn-viewer:hover{opacity:0.9;transform:translateY(-1px)}',
      '.radar-btn-viewer{transition:opacity 0.15s,transform 0.15s}',
      '.radar-loading{display:flex;align-items:center;justify-content:center;',
      'gap:8px;color:rgba(255,255,255,0.4);font-size:13px;padding:40px;}'
    ].join('');
    document.head.appendChild(style);
  }

  var categsSet = {};
  plataformas.forEach(function(p) { if (p.categoria) categsSet[p.categoria] = true; });
  radarRenderFiltros(Object.keys(categsSet).sort(), _radarCategoriaActiva);

  var html = '';
  plataformas.forEach(function(p) {
    var jobs = (p.jobs && p.jobs.length > 0)
      ? p.jobs
      : (RADAR_MOCK_JOBS[p.id] || []);
    var usandoMock = !(p.jobs && p.jobs.length > 0);
    var fuenteBadge = radarBadgeFuente(p, usandoMock);

    html += '<div class="radar-card" style="border-color:' + p.color_border + ';background:' + p.color_bg + ';padding:0;overflow:hidden;">';

    // Header
    html += '<div class="radar-card-header" style="padding:14px 16px 12px;">';
    html += '<span class="radar-logo">' + (p.logo || '🔗') + '</span>';
    html += '<div class="radar-info">';
    html += '<span class="radar-nombre" style="color:' + p.color + ';">' + p.nombre + '</span>';
    html += '<span class="radar-desc">' + (p.descripcion || '') + '</span>';
    html += '</div>';
    html += fuenteBadge;
    html += '</div>';

    // Lista de jobs
    html += '<div style="padding:0 16px 12px;">';
    html += '<p style="color:rgba(255,255,255,0.45);font-size:10px;font-weight:700;letter-spacing:0.08em;'
           + 'text-transform:uppercase;margin:0 0 8px 0;padding-bottom:6px;'
           + 'border-bottom:1px solid rgba(255,255,255,0.06);">📋 Trabajos recientes</p>';

    if (jobs.length === 0) {
      html += '<div style="display:flex;flex-direction:column;align-items:center;padding:18px 0;gap:8px;">'
             + '<i class="ph ph-binoculars" style="font-size:24px;color:rgba(255,255,255,0.2);"></i>'
             + '<p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin:0;">'
             + 'Sin datos aún — usa el botón de abajo</p>'
             + '</div>';
    } else {
      jobs.forEach(function(job) {
        var jobUrl = job.url || p.search_url || '#';
        var tiempo = radarFormatFecha(job.fecha_publicacion) || '';
        // Abre el job directamente en nueva pestaña (sin iframe)
        html += '<div class="radar-job-item" '
               + 'onclick="radarAbrirJob(\'' + jobUrl.replace(/'/g, "\\'") + '\',\'' + p.id + '\')" '
               + 'style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;'
               + 'border-radius:8px;cursor:pointer;margin-bottom:4px;background:rgba(255,255,255,0.03);">';
        html += '<div style="flex:1;min-width:0;">';
        html += '<p style="color:rgba(255,255,255,0.88);font-size:12px;font-weight:500;margin:0 0 3px 0;'
               + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + job.titulo + '</p>';
        html += '<div style="display:flex;gap:8px;align-items:center;">';
        html += '<span style="color:' + p.color + ';font-size:11px;font-weight:600;">' + (job.presupuesto || 'Negociable') + '</span>';
        if (tiempo) {
          html += '<span style="color:rgba(255,255,255,0.3);font-size:10px;">•</span>';
          html += '<span style="color:rgba(255,255,255,0.35);font-size:10px;">' + tiempo + '</span>';
        }
        html += '</div></div>';
        html += '<span style="color:' + p.color + ';font-size:14px;flex-shrink:0;margin-top:2px;">›</span>';
        html += '</div>';
      });
    }

    // Botón ver todos — abre search_url en nueva pestaña
    var searchUrl = p.search_url || '#';
    html += '<button class="radar-btn-viewer" '
           + 'onclick="radarAbrirJob(\'' + searchUrl.replace(/'/g, "\\'") + '\',\'' + p.id + '\')" '
           + 'style="width:100%;background:rgba(255,255,255,0.05);border:1px solid ' + p.color_border + ';'
           + 'color:' + p.color + ';padding:7px;border-radius:8px;font-size:11px;font-weight:600;'
           + 'cursor:pointer;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:6px;">'
           + '<i class="ph ph-arrow-square-out"></i> Ver todos los trabajos en vivo</button>';
    html += '</div>';

    // Footer
    html += '<div class="radar-card-footer" style="padding:10px 16px;border-top:1px solid rgba(255,255,255,0.06);">';
    html += '<button onclick="radarGuardarOpp(\'' + p.id + '\',\'' + p.nombre + '\')" class="radar-btn-opp" style="border-color:' + p.color_border + ';color:' + p.color + ';">';
    html += '<i class="ph ph-lightning"></i> Guardar Oportunidad</button>';
    html += '<a href="' + searchUrl + '" target="_blank" rel="noopener noreferrer" class="radar-btn-open" style="background:' + p.color + ';"'
           + ' onclick="radarTrackLanzamiento(\'' + p.id + '\',\'' + searchUrl + '\')">';
    html += '<i class="ph ph-arrow-square-out"></i> Abrir ' + p.nombre + '</a>';
    html += '</div>';

    html += '</div>';
  });

  container.innerHTML = html;
}

// ─── Fallback mock local ─────────────────────────────────────
function radarRenderFallback(motivo) {
  radarMostrarError(motivo);

  var fallback = [
    { id:'upwork',     nombre:'Upwork',        color:'#14a800', color_bg:'rgba(20,168,0,0.08)',   color_border:'rgba(20,168,0,0.25)',   logo:'🟢', descripcion:'La plataforma freelance más grande del mundo',  search_url:'https://www.upwork.com/nx/search/jobs/?q=brand+design+identity&sort=recency',    categoria:'branding', fuente:'mock', jobs:[] },
    { id:'workana',    nombre:'Workana',        color:'#0075FF', color_bg:'rgba(0,117,255,0.08)',  color_border:'rgba(0,117,255,0.25)',  logo:'🔵', descripcion:'La plataforma líder en Latinoamérica',           search_url:'https://www.workana.com/jobs?category=design&subcategory=brand-design&language=es', categoria:'branding', fuente:'mock', jobs:[] },
    { id:'fiverr',     nombre:'Fiverr',         color:'#1DBF73', color_bg:'rgba(29,191,115,0.08)', color_border:'rgba(29,191,115,0.25)', logo:'🟠', descripcion:'Marketplace global con millones de compradores', search_url:'https://www.fiverr.com/search/gigs?query=brand+identity+design&sort_by=rating',     categoria:'branding', fuente:'mock', jobs:[] },
    { id:'linkedin',   nombre:'LinkedIn Jobs',  color:'#0077B5', color_bg:'rgba(0,119,181,0.08)',  color_border:'rgba(0,119,181,0.25)',  logo:'🔷', descripcion:'Oportunidades con empresas y agencias',          search_url:'https://www.linkedin.com/jobs/search/?keywords=brand+designer&f_TPR=r86400&sortBy=DD', categoria:'web',      fuente:'mock', jobs:[] },
    { id:'freelancer', nombre:'Freelancer.com', color:'#29B2FE', color_bg:'rgba(41,178,254,0.08)', color_border:'rgba(41,178,254,0.25)', logo:'⚡', descripcion:'Proyectos globales y concursos de diseño',       search_url:'https://www.freelancer.com/jobs/graphic-design/?q=branding+logo',                  categoria:'web',      fuente:'mock', jobs:[] },
    { id:'behance',    nombre:'Behance Jobs',   color:'#1769FF', color_bg:'rgba(23,105,255,0.08)', color_border:'rgba(23,105,255,0.25)', logo:'🎨', descripcion:'Jobs en la comunidad creativa de Adobe',         search_url:'https://www.behance.net/joblist?tracking_source=nav20&field=132',                   categoria:'motion',   fuente:'mock', jobs:[] }
  ];

  var lista = _radarCategoriaActiva
    ? fallback.filter(function(p) { return p.categoria === _radarCategoriaActiva; })
    : fallback;

  radarRenderConData(lista);
}

// ─── Entry point principal ───────────────────────────────────
function radarRender() {
  var container = document.getElementById('radar-plataformas-grid');
  if (!container) return;

  radarOcultarBanner();
  container.innerHTML = '<div class="radar-loading">'
    + '<i class="ph ph-spinner" style="animation:spin 1s linear infinite"></i>'
    + ' Cargando plataformas…</div>';

  var opciones = {};
  if (_radarCategoriaActiva) opciones.categoria = _radarCategoriaActiva;

  var apiUrl = radarGetApiUrl();
  if (!apiUrl) {
    setTimeout(function() {
      var urlReintentar = radarGetApiUrl();
      if (!urlReintentar) {
        radarRenderFallback('no_url');
        return;
      }
      radarFetchPlataformas(radarHandleApiResponse, opciones);
    }, 500);
    return;
  }

  radarFetchPlataformas(radarHandleApiResponse, opciones);
}

function radarHandleApiResponse(plataformas, estado) {
  if (plataformas && plataformas.length > 0) {
    _radarUltimaRespuesta = plataformas;
    radarOcultarBanner();
    radarRenderConData(plataformas);
    radarActualizarTimestamp();
    radarIniciarRefresh();
  } else if (_radarUltimaRespuesta && _radarUltimaRespuesta.length > 0) {
    radarOcultarBanner();
    radarRenderConData(_radarUltimaRespuesta);
  } else {
    radarRenderFallback(estado || 'error');
  }
}

// ─── Guardar oportunidad desde Radar ─────────────────────────
function radarGuardarOpp(plataformaId, plataformaNombre) {
  if (typeof oppAbrirModal === 'function') {
    oppAbrirModal({ plataforma: plataformaId, stage: 'nuevo' });
  }
}

// ─── Exponer globals necesarios ──────────────────────────────
window.radarRender           = radarRender;
window.radarCambiarCategoria = radarCambiarCategoria;
window.radarAbrirJob         = radarAbrirJob;
window.radarTrackLanzamiento = radarTrackLanzamiento;
window.radarGuardarOpp       = radarGuardarOpp;
window.radarDetenerRefresh   = radarDetenerRefresh;
// radarAbrirViewer y radarViewerIframeLoaded eliminados —
// usaban <iframe> bloqueado por X-Frame-Options en todas las plataformas externas.
