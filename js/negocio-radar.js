// ============================================================
// js/negocio-radar.js — GN Studio OS v2.0
// Radar de Oportunidades: tarjetas con trabajos disponibles
// y mini-viewer embebido para navegar sin salir de la plataforma
// ============================================================

var RADAR_PLATAFORMAS = [
  {
    id: 'upwork',
    nombre: 'Upwork',
    logo: '🟢',
    color: '#14a800',
    colorBg: 'rgba(20,168,0,0.08)',
    colorBorder: 'rgba(20,168,0,0.25)',
    descripcion: 'La plataforma freelance más grande del mundo',
    iframeSupport: false,
    busquedas: [
      { label: 'Brand Design', url: 'https://www.upwork.com/nx/search/jobs/?q=brand+design+identity&sort=recency' },
      { label: 'Logo Design', url: 'https://www.upwork.com/nx/search/jobs/?q=logo+design+branding&sort=recency' },
      { label: 'Web Design', url: 'https://www.upwork.com/nx/search/jobs/?q=web+design+ui+ux&sort=recency' },
      { label: 'Social Media Design', url: 'https://www.upwork.com/nx/search/jobs/?q=social+media+design+content&sort=recency' },
      { label: 'Motion Graphics', url: 'https://www.upwork.com/nx/search/jobs/?q=motion+graphics+animation&sort=recency' },
      { label: 'Packaging Design', url: 'https://www.upwork.com/nx/search/jobs/?q=packaging+design+label&sort=recency' }
    ],
    jobsApi: [
      { titulo: 'Brand Identity Designer needed', presupuesto: '$500–$1,500', tiempo: 'hace 2h', url: 'https://www.upwork.com/nx/search/jobs/?q=brand+design+identity&sort=recency' },
      { titulo: 'Logo & Visual Identity for Startup', presupuesto: '$300–$800', tiempo: 'hace 5h', url: 'https://www.upwork.com/nx/search/jobs/?q=logo+design+branding&sort=recency' },
      { titulo: 'UI/UX Web Designer – Remote', presupuesto: '$1,000–$3,000', tiempo: 'hace 8h', url: 'https://www.upwork.com/nx/search/jobs/?q=web+design+ui+ux&sort=recency' }
    ]
  },
  {
    id: 'workana',
    nombre: 'Workana',
    logo: '🔵',
    color: '#0075FF',
    colorBg: 'rgba(0,117,255,0.08)',
    colorBorder: 'rgba(0,117,255,0.25)',
    descripcion: 'La plataforma líder en Latinoamérica',
    iframeSupport: false,
    busquedas: [
      { label: 'Diseño de Marca', url: 'https://www.workana.com/jobs?category=design&subcategory=brand-design&language=es' },
      { label: 'Diseño Web', url: 'https://www.workana.com/jobs?category=design&subcategory=web-design&language=es' },
      { label: 'Identidad Visual', url: 'https://www.workana.com/jobs?category=design&subcategory=corporate-identity&language=es' },
      { label: 'Redes Sociales', url: 'https://www.workana.com/jobs?category=design&subcategory=social-media-design&language=es' },
      { label: 'Diseño Gráfico', url: 'https://www.workana.com/jobs?category=design&language=es&sort=recent' }
    ],
    jobsApi: [
      { titulo: 'Diseño de identidad corporativa completa', presupuesto: '$400–$1,200', tiempo: 'hace 1h', url: 'https://www.workana.com/jobs?category=design&subcategory=brand-design&language=es' },
      { titulo: 'Rediseño de sitio web para empresa', presupuesto: '$600–$2,000', tiempo: 'hace 3h', url: 'https://www.workana.com/jobs?category=design&subcategory=web-design&language=es' },
      { titulo: 'Pack de redes sociales – Branding', presupuesto: '$200–$500', tiempo: 'hace 6h', url: 'https://www.workana.com/jobs?category=design&subcategory=social-media-design&language=es' }
    ]
  },
  {
    id: 'fiverr',
    nombre: 'Fiverr',
    logo: '🟠',
    color: '#1DBF73',
    colorBg: 'rgba(29,191,115,0.08)',
    colorBorder: 'rgba(29,191,115,0.25)',
    descripcion: 'Marketplace global con millones de compradores',
    iframeSupport: false,
    busquedas: [
      { label: 'Brand Identity', url: 'https://www.fiverr.com/search/gigs?query=brand+identity+design&sort_by=rating' },
      { label: 'Logo & Branding', url: 'https://www.fiverr.com/search/gigs?query=logo+branding&sort_by=rating' },
      { label: 'Web Design', url: 'https://www.fiverr.com/search/gigs?query=website+design+ui&sort_by=rating' },
      { label: 'Social Media Kit', url: 'https://www.fiverr.com/search/gigs?query=social+media+design+kit&sort_by=rating' },
      { label: 'Motion Graphics', url: 'https://www.fiverr.com/search/gigs?query=motion+graphics+animation&sort_by=rating' }
    ],
    jobsApi: [
      { titulo: 'Brand Identity Package – Full', presupuesto: 'Desde $350', tiempo: 'Popular', url: 'https://www.fiverr.com/search/gigs?query=brand+identity+design&sort_by=rating' },
      { titulo: 'Professional Logo Design', presupuesto: 'Desde $150', tiempo: 'En demanda', url: 'https://www.fiverr.com/search/gigs?query=logo+branding&sort_by=rating' },
      { titulo: 'Custom Website UI/UX Design', presupuesto: 'Desde $500', tiempo: 'Trending', url: 'https://www.fiverr.com/search/gigs?query=website+design+ui&sort_by=rating' }
    ]
  },
  {
    id: 'linkedin',
    nombre: 'LinkedIn Jobs',
    logo: '🔷',
    color: '#0077B5',
    colorBg: 'rgba(0,119,181,0.08)',
    colorBorder: 'rgba(0,119,181,0.25)',
    descripcion: 'Oportunidades con empresas y agencias',
    iframeSupport: false,
    busquedas: [
      { label: 'Brand Designer', url: 'https://www.linkedin.com/jobs/search/?keywords=brand+designer&f_TPR=r86400&sortBy=DD' },
      { label: 'Graphic Designer', url: 'https://www.linkedin.com/jobs/search/?keywords=graphic+designer+freelance&f_TPR=r86400&sortBy=DD' },
      { label: 'UI/UX Designer', url: 'https://www.linkedin.com/jobs/search/?keywords=ui+ux+designer+remote&f_TPR=r86400&sortBy=DD' },
      { label: 'Creative Director', url: 'https://www.linkedin.com/jobs/search/?keywords=creative+director+contract&f_TPR=r86400&sortBy=DD' },
      { label: 'Design Agency', url: 'https://www.linkedin.com/jobs/search/?keywords=design+agency+contract+remote&f_TPR=r86400&sortBy=DD' }
    ],
    jobsApi: [
      { titulo: 'Senior Brand Designer – Remote', presupuesto: '$80k–$110k/yr', tiempo: 'hace 4h', url: 'https://www.linkedin.com/jobs/search/?keywords=brand+designer&f_TPR=r86400&sortBy=DD' },
      { titulo: 'Freelance Graphic Designer', presupuesto: 'Negociable', tiempo: 'hace 7h', url: 'https://www.linkedin.com/jobs/search/?keywords=graphic+designer+freelance&f_TPR=r86400&sortBy=DD' },
      { titulo: 'UI/UX Designer – Contract Remote', presupuesto: '$60–$90/hr', tiempo: 'hace 12h', url: 'https://www.linkedin.com/jobs/search/?keywords=ui+ux+designer+remote&f_TPR=r86400&sortBy=DD' }
    ]
  },
  {
    id: 'freelancer',
    nombre: 'Freelancer.com',
    logo: '⚡',
    color: '#29B2FE',
    colorBg: 'rgba(41,178,254,0.08)',
    colorBorder: 'rgba(41,178,254,0.25)',
    descripcion: 'Proyectos globales y concursos de diseño',
    iframeSupport: false,
    busquedas: [
      { label: 'Logo & Branding', url: 'https://www.freelancer.com/jobs/graphic-design/?q=branding+logo' },
      { label: 'Web Design', url: 'https://www.freelancer.com/jobs/website-design/?q=web+design' },
      { label: 'Design Contests', url: 'https://www.freelancer.com/contest/?q=logo+brand' },
      { label: 'Social Media', url: 'https://www.freelancer.com/jobs/graphic-design/?q=social+media' }
    ],
    jobsApi: [
      { titulo: 'Logo Design for Tech Company', presupuesto: '$30–$250', tiempo: 'hace 1h', url: 'https://www.freelancer.com/jobs/graphic-design/?q=branding+logo' },
      { titulo: 'Landing Page Design – Responsive', presupuesto: '$100–$400', tiempo: 'hace 3h', url: 'https://www.freelancer.com/jobs/website-design/?q=web+design' },
      { titulo: 'Brand Identity Contest – $500 prize', presupuesto: '$500 premio', tiempo: 'Concurso activo', url: 'https://www.freelancer.com/contest/?q=logo+brand' }
    ]
  },
  {
    id: 'behance',
    nombre: 'Behance Jobs',
    logo: '🎨',
    color: '#1769FF',
    colorBg: 'rgba(23,105,255,0.08)',
    colorBorder: 'rgba(23,105,255,0.25)',
    descripcion: 'Jobs en la comunidad creativa de Adobe',
    iframeSupport: false,
    busquedas: [
      { label: 'Brand Designer', url: 'https://www.behance.net/joblist?tracking_source=nav20&field=132' },
      { label: 'Visual Designer', url: 'https://www.behance.net/joblist?tracking_source=nav20&field=132&location=remote' },
      { label: 'Motion Designer', url: 'https://www.behance.net/joblist?tracking_source=nav20&field=135' }
    ],
    jobsApi: [
      { titulo: 'Brand & Visual Identity Designer', presupuesto: 'Full-time / Remote', tiempo: 'hace 2h', url: 'https://www.behance.net/joblist?tracking_source=nav20&field=132' },
      { titulo: 'Senior Motion Designer', presupuesto: '$75k–$95k', tiempo: 'hace 9h', url: 'https://www.behance.net/joblist?tracking_source=nav20&field=135' },
      { titulo: 'Visual Designer – Creative Studio', presupuesto: 'Contract Remote', tiempo: 'hace 14h', url: 'https://www.behance.net/joblist?tracking_source=nav20&field=132&location=remote' }
    ]
  }
];

// ─── Mini-Viewer Modal ───────────────────────────────────────
function radarAbrirViewer(url, nombre, color) {
  var existente = document.getElementById('radar-viewer-overlay');
  if (existente) existente.remove();

  var overlay = document.createElement('div');
  overlay.id = 'radar-viewer-overlay';
  overlay.style.cssText = [
    'position:fixed','top:0','left:0','width:100vw','height:100vh',
    'background:rgba(0,0,0,0.75)','z-index:99999',
    'display:flex','align-items:center','justify-content:center',
    'animation:radarFadeIn 0.2s ease'
  ].join(';');

  overlay.innerHTML = [
    '<div style="width:92vw;max-width:1100px;height:82vh;background:#0f1117;border-radius:14px;',
    'border:1px solid rgba(255,255,255,0.1);display:flex;flex-direction:column;overflow:hidden;',
    'box-shadow:0 24px 64px rgba(0,0,0,0.6);">',

    // Header del viewer
    '<div style="display:flex;align-items:center;justify-content:space-between;',
    'padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.08);',
    'background:rgba(255,255,255,0.03);">',
    '<div style="display:flex;align-items:center;gap:10px;">',
    '<span style="width:10px;height:10px;border-radius:50%;background:'+color+';display:inline-block;box-shadow:0 0 8px '+color+'"></span>',
    '<span style="color:#fff;font-size:14px;font-weight:600;">'+nombre+'</span>',
    '<span style="color:rgba(255,255,255,0.4);font-size:12px;">— Trabajos disponibles</span>',
    '</div>',
    '<div style="display:flex;gap:8px;align-items:center;">',
    '<a href="'+url+'" target="_blank" rel="noopener noreferrer" ',
    'style="background:'+color+';color:#fff;border:none;padding:6px 14px;border-radius:6px;',
    'font-size:12px;cursor:pointer;text-decoration:none;font-weight:500;',
    'display:flex;align-items:center;gap:5px;">',
    '<i class="ph ph-arrow-square-out"></i> Abrir en nueva pestaña</a>',
    '<button onclick="document.getElementById(\'radar-viewer-overlay\').remove()" ',
    'style="background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);',
    'padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;">✕ Cerrar</button>',
    '</div>',
    '</div>',

    // Aviso de restricción iframe
    '<div id="radar-viewer-notice" style="display:none;flex:1;flex-direction:column;align-items:center;',
    'justify-content:center;padding:40px;text-align:center;">',
    '<span style="font-size:48px;margin-bottom:16px;display:block;">🔒</span>',
    '<p style="color:rgba(255,255,255,0.8);font-size:16px;margin-bottom:8px;font-weight:600;">',
    'Esta plataforma bloquea la vista embebida</p>',
    '<p style="color:rgba(255,255,255,0.5);font-size:13px;margin-bottom:24px;">',
    'Por seguridad, '+nombre+' no permite mostrarse dentro de otras apps.<br>',
    'Puedes abrirla directamente en una nueva pestaña.</p>',
    '<a href="'+url+'" target="_blank" rel="noopener noreferrer" ',
    'style="background:'+color+';color:#fff;padding:10px 24px;border-radius:8px;',
    'text-decoration:none;font-weight:600;font-size:14px;">',
    '<i class="ph ph-arrow-square-out"></i> Abrir '+nombre+'</a>',
    '</div>',

    // Iframe
    '<iframe id="radar-viewer-iframe" src="'+url+'" ',
    'style="flex:1;border:none;width:100%;" ',
    'sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" ',
    'onerror="radarViewerIframeError()" ',
    'onload="radarViewerIframeLoaded(this)">',
    '</iframe>',
    '</div>'
  ].join('');

  // Cerrar al click en overlay
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);

  // Timeout: si el iframe no carga en 4s, mostrar aviso
  setTimeout(function() {
    var iframe = document.getElementById('radar-viewer-iframe');
    var notice = document.getElementById('radar-viewer-notice');
    if (iframe && notice) {
      try {
        var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc || iframeDoc.body === null || iframeDoc.body.innerHTML === '') {
          iframe.style.display = 'none';
          notice.style.display = 'flex';
        }
      } catch(err) {
        // Cross-origin bloqueado = la página cargó (buena señal)
      }
    }
  }, 4000);
}

function radarViewerIframeLoaded(iframe) {
  // Si se puede leer el contenido y está vacío, mostrar fallback
  try {
    var doc = iframe.contentDocument || iframe.contentWindow.document;
    if (doc && doc.body && doc.body.innerHTML.trim() === '') {
      iframe.style.display = 'none';
      var notice = document.getElementById('radar-viewer-notice');
      if (notice) notice.style.display = 'flex';
    }
  } catch(e) {
    // Cross-origin = la página cargó correctamente, no hacer nada
  }
}

// ─── Render principal de tarjetas ────────────────────────────
function radarRender() {
  var container = document.getElementById('radar-plataformas-grid');
  if (!container) return;

  // Inyectar estilos de animación si no existen
  if (!document.getElementById('radar-viewer-styles')) {
    var style = document.createElement('style');
    style.id = 'radar-viewer-styles';
    style.textContent = [
      '@keyframes radarFadeIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}',
      '.radar-job-item:hover{background:rgba(255,255,255,0.07)!important;transform:translateX(3px)}',
      '.radar-job-item{transition:background 0.15s ease,transform 0.15s ease}',
      '.radar-tag:hover{opacity:0.85;transform:translateY(-1px)}',
      '.radar-tag{transition:opacity 0.15s,transform 0.15s}',
      '.radar-btn-viewer:hover{opacity:0.9;transform:translateY(-1px)}',
      '.radar-btn-viewer{transition:opacity 0.15s,transform 0.15s}'
    ].join('');
    document.head.appendChild(style);
  }

  var html = '';
  RADAR_PLATAFORMAS.forEach(function(p) {
    html += '<div class="radar-card" style="border-color:'+p.colorBorder+';background:'+p.colorBg+';padding:0;overflow:hidden;">';

    // Header
    html += '<div class="radar-card-header" style="padding:14px 16px 12px;">';
    html += '<span class="radar-logo">'+p.logo+'</span>';
    html += '<div class="radar-info">';
    html += '<span class="radar-nombre" style="color:'+p.color+';">'+p.nombre+'</span>';
    html += '<span class="radar-desc">'+p.descripcion+'</span>';
    html += '</div>';
    html += '</div>';

    // ── Sección de JOBS DISPONIBLES ──
    html += '<div style="padding:0 16px 12px;">';
    html += '<p style="color:rgba(255,255,255,0.45);font-size:10px;font-weight:700;letter-spacing:0.08em;';
    html += 'text-transform:uppercase;margin:0 0 8px 0;padding-bottom:6px;';
    html += 'border-bottom:1px solid rgba(255,255,255,0.06);">📋 Trabajos recientes</p>';

    p.jobsApi.forEach(function(job) {
      html += '<div class="radar-job-item" onclick="radarAbrirViewer(\''+job.url+'\',\''+p.nombre+'\',\''+p.color+'\')" ';
      html += 'style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;';
      html += 'border-radius:8px;cursor:pointer;margin-bottom:4px;background:rgba(255,255,255,0.03);">';

      html += '<div style="flex:1;min-width:0;">';
      html += '<p style="color:rgba(255,255,255,0.88);font-size:12px;font-weight:500;margin:0 0 3px 0;';
      html += 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+job.titulo+'</p>';
      html += '<div style="display:flex;gap:8px;align-items:center;">';
      html += '<span style="color:'+p.color+';font-size:11px;font-weight:600;">'+job.presupuesto+'</span>';
      html += '<span style="color:rgba(255,255,255,0.3);font-size:10px;">•</span>';
      html += '<span style="color:rgba(255,255,255,0.35);font-size:10px;">'+job.tiempo+'</span>';
      html += '</div></div>';

      html += '<span style="color:'+p.color+';font-size:14px;flex-shrink:0;margin-top:2px;">›</span>';
      html += '</div>';
    });

    // Botón ver todos los jobs
    html += '<button class="radar-btn-viewer" onclick="radarAbrirViewer(\''+p.busquedas[0].url+'\',\''+p.nombre+'\',\''+p.color+'\')" ';
    html += 'style="width:100%;background:rgba(255,255,255,0.05);border:1px solid '+p.colorBorder+';';
    html += 'color:'+p.color+';padding:7px;border-radius:8px;font-size:11px;font-weight:600;';
    html += 'cursor:pointer;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:6px;">';
    html += '<i class="ph ph-eye"></i> Ver todos los trabajos en vivo';
    html += '</button>';
    html += '</div>';

    // Filtros rápidos
    html += '<div style="padding:10px 16px;border-top:1px solid rgba(255,255,255,0.06);">';
    html += '<p style="color:rgba(255,255,255,0.35);font-size:10px;font-weight:700;';
    html += 'letter-spacing:0.08em;text-transform:uppercase;margin:0 0 7px 0;">🔍 Búsquedas rápidas</p>';
    html += '<div class="radar-busquedas">';
    p.busquedas.forEach(function(b) {
      html += '<a href="'+b.url+'" target="_blank" rel="noopener noreferrer" class="radar-tag" ';
      html += 'style="border-color:'+p.colorBorder+';color:'+p.color+';">';
      html += '<i class="ph ph-magnifying-glass"></i> '+b.label;
      html += '</a>';
    });
    html += '</div></div>';

    // Footer
    html += '<div class="radar-card-footer" style="padding:10px 16px;border-top:1px solid rgba(255,255,255,0.06);">';
    html += '<button onclick="radarGuardarOpp(\''+p.id+'\',\''+p.nombre+'\')" class="radar-btn-opp" style="border-color:'+p.colorBorder+';color:'+p.color+';">';
    html += '<i class="ph ph-lightning"></i> Guardar Oportunidad';
    html += '</button>';
    html += '<a href="'+p.busquedas[0].url+'" target="_blank" rel="noopener noreferrer" class="radar-btn-open" style="background:'+p.color+';">';
    html += '<i class="ph ph-arrow-square-out"></i> Abrir '+p.nombre;
    html += '</a>';
    html += '</div>';

    html += '</div>';
  });

  container.innerHTML = html;
}

function radarGuardarOpp(plataformaId, plataformaNombre) {
  if (typeof oppAbrirModal === 'function') {
    oppAbrirModal({ plataforma: plataformaId, stage: 'nuevo' });
  }
}
