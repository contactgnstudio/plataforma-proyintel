// ============================================================
// js/negocio-oportunidades.js — GN Studio OS v1.1
// Panel de Oportunidades: leads guardados desde Radar + manual
// Incluye: boton Crear Propuesta en cada tarjeta del Kanban
// ============================================================

var OPPS_KEY = 'gn_oportunidades';

async function opp_getAll() {
  try { return await getData(OPPS_KEY) || []; } catch(e) { return []; }
}

async function opp_save(payload) {
  return await addItem(OPPS_KEY, payload);
}

async function opp_update(id, payload) {
  return await updateItem(OPPS_KEY, id, payload);
}

async function opp_delete(id) {
  return await deleteItem(OPPS_KEY, id);
}

// ── Kanban render ──
var OPP_STAGES = [
  { id:'nuevo',     label:'Nuevo Lead',       color:'#8FAB9A' },
  { id:'contactado',label:'Contactado',        color:'#C5A253' },
  { id:'propuesta', label:'Propuesta Enviada', color:'#60A5FA' },
  { id:'negociando',label:'Negociando',        color:'#A78BFA' },
  { id:'ganado',    label:'Ganado 🎉',          color:'#2D8B5E' },
  { id:'perdido',   label:'Perdido',           color:'#F87171' }
];

async function oppRenderKanban() {
  var container = document.getElementById('opp-kanban-board');
  if (!container) return;
  var opps = await opp_getAll();

  var html = '';
  OPP_STAGES.forEach(function(stage) {
    var items = opps.filter(function(o) { return (o.stage || 'nuevo') === stage.id; });
    html += '<div class="opp-column" data-stage="' + stage.id + '">';
    html += '<div class="opp-col-header" style="border-top-color:' + stage.color + ';">';
    html += '<span class="opp-col-title">' + stage.label + '</span>';
    html += '<span class="opp-col-count">' + items.length + '</span>';
    html += '</div>';
    html += '<div class="opp-col-body">';
    if (items.length === 0) {
      html += '<div class="opp-empty">Sin oportunidades</div>';
    } else {
      items.forEach(function(o) {
        var plataformaIcon = oppPlataformaIcon(o.plataforma);
        var presupuesto = o.presupuesto ? 'USD ' + parseFloat(o.presupuesto).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}) : 'N/D';
        html += '<div class="opp-card" onclick="oppAbrirDetalle(\''+o.id+'\')">';
        html += '<div class="opp-card-top">';
        html += '<span class="opp-plataforma">' + plataformaIcon + ' ' + (o.plataforma || 'Manual') + '</span>';
        html += '<span class="opp-budget">' + presupuesto + '</span>';
        html += '</div>';
        html += '<div class="opp-card-title">' + escH(o.titulo || 'Sin título') + '</div>';
        if (o.cliente) html += '<div class="opp-card-cliente"><i class="ph ph-user"></i> ' + escH(o.cliente) + '</div>';
        html += '<div class="opp-card-actions">';
        OPP_STAGES.forEach(function(s) {
          if (s.id === stage.id) return;
          if (s.id === 'ganado' || s.id === 'perdido') return;
          html += '<button onclick="event.stopPropagation();oppMoverStage(\''+o.id+'\',\''+s.id+'\')" title="Mover a '+s.label+'" style="background:none;border:none;cursor:pointer;color:#8FAB9A;font-size:11px;padding:2px 4px;border-radius:4px;border:1px solid rgba(255,255,255,0.08);">\u2192 '+s.label+'</button> ';
        });
        if (stage.id !== 'ganado') html += '<button onclick="event.stopPropagation();oppMoverStage(\''+o.id+'\',\'ganado\')" style="background:rgba(45,139,94,0.15);border:1px solid rgba(45,139,94,0.3);color:#2D8B5E;font-size:11px;padding:2px 6px;border-radius:4px;cursor:pointer;">✓ Ganado</button> ';
        if (stage.id !== 'perdido') html += '<button onclick="event.stopPropagation();oppMoverStage(\''+o.id+'\',\'perdido\')" style="background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.2);color:#F87171;font-size:11px;padding:2px 6px;border-radius:4px;cursor:pointer;">✗</button> ';
        html += '<button onclick="event.stopPropagation();oppEliminar(\''+o.id+'\')" style="background:none;border:none;cursor:pointer;color:#F87171;font-size:11px;">🗑</button>';
        html += '</div>';
        // ── Botón Crear Propuesta ──
        html += '<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,0.06);padding-top:8px;">';
        html += '<button onclick="event.stopPropagation();oppCrearPropuesta(\''+o.id+'\')" style="width:100%;padding:6px 10px;background:rgba(197,162,83,0.12);border:1px solid rgba(197,162,83,0.3);border-radius:7px;color:#C5A253;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;"><i class="ph ph-file-plus"></i> Crear Propuesta</button>';
        html += '</div>';
        html += '</div>';
      });
    }
    html += '</div></div>';
  });
  container.innerHTML = html;
  oppActualizarKPIs(opps);
}

function oppPlataformaIcon(p) {
  var icons = { upwork:'🟢', workana:'🔵', fiverr:'🟠', linkedin:'🔷', freelancer:'⚡', manual:'✍️', referido:'🤝', otro:'🌐' };
  return icons[String(p||'').toLowerCase()] || '🌐';
}

function oppActualizarKPIs(opps) {
  var total = opps.length;
  var ganadas = opps.filter(function(o){return o.stage==='ganado';}).length;
  var activas = opps.filter(function(o){return o.stage!=='ganado'&&o.stage!=='perdido';}).length;
  var tasaCierre = total > 0 ? Math.round(ganadas/total*100) : 0;
  var valTotal = opps.filter(function(o){return o.stage==='ganado';}).reduce(function(acc,o){return acc+(parseFloat(o.presupuesto)||0);},0);
  var set = function(id, val) { var el = document.getElementById(id); if(el) el.textContent = val; };
  set('opp-kpi-total', total);
  set('opp-kpi-activas', activas);
  set('opp-kpi-ganadas', ganadas);
  set('opp-kpi-tasa', tasaCierre + '%');
  set('opp-kpi-valor', 'USD ' + valTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}));
}

async function oppMoverStage(id, newStage) {
  await opp_update(id, { stage: newStage });
  await oppRenderKanban();
  if (window.showToast) window.showToast({ type:'success', title:'Oportunidad movida', message: 'Movida a ' + newStage });
}

async function oppEliminar(id) {
  if (!confirm('\u00bfEliminar esta oportunidad?')) return;
  await opp_delete(id);
  await oppRenderKanban();
}

// ============================================================
// oppCrearPropuesta(id)
// Toma los datos de la oportunidad y abre el panel de Proyectos
// con el formulario de Nueva Propuesta pre-rellenado.
// ============================================================
async function oppCrearPropuesta(id) {
  var opps = await opp_getAll();
  var o = opps.find(function(x){ return String(x.id) === String(id); });
  if (!o) return;

  // Navegar a Proyectos y abrir el panel de propuesta
  if (typeof window.switchSection === 'function') {
    window.switchSection('proyectos');
  }

  // Esperar a que el panel esté visible antes de rellenar
  setTimeout(function() {
    // Mostrar el panel del formulario
    if (typeof window.togglePanelProforma === 'function') {
      var panel = document.getElementById('proyecto-proforma-panel');
      // Solo abrir si no está ya visible
      if (panel && panel.style.display === 'none') {
        window.togglePanelProforma();
      }
    }

    // Pre-rellenar los campos con datos de la oportunidad
    setTimeout(function() {
      var nombreField = document.getElementById('pf-nombre-proyecto');
      if (nombreField) nombreField.value = o.titulo || '';

      // Intentar seleccionar el cliente si existe en el select
      var clienteSelect = document.getElementById('pf-cliente');
      if (clienteSelect && o.cliente) {
        // Buscar opción que coincida (por texto)
        var opts = Array.prototype.slice.call(clienteSelect.options);
        opts.forEach(function(opt) {
          if (opt.text && opt.text.toLowerCase().indexOf(o.cliente.toLowerCase()) !== -1) {
            clienteSelect.value = opt.value;
          }
        });
      }

      // Pre-rellenar fecha de hoy si está vacía
      var fechaField = document.getElementById('pf-fecha');
      if (fechaField && !fechaField.value) {
        var hoy = new Date();
        fechaField.value = hoy.getFullYear() + '-' +
          String(hoy.getMonth()+1).padStart(2,'0') + '-' +
          String(hoy.getDate()).padStart(2,'0');
      }

      // Agregar nota con presupuesto de referencia y link en el editor de alcance
      var alcanceEditor = document.getElementById('pf-alcance-editor');
      if (alcanceEditor && !alcanceEditor.textContent.trim()) {
        var nota = 'Basado en oportunidad: ' + (o.titulo || '') + '.';
        if (o.presupuesto) nota += ' Presupuesto referencia: USD ' + parseFloat(o.presupuesto).toFixed(2) + '.';
        if (o.notas) nota += '\n' + o.notas;
        if (o.link) nota += '\nLink: ' + o.link;
        alcanceEditor.textContent = nota;
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (window.showToast) {
        window.showToast({
          type: 'info',
          title: 'Propuesta pre-rellenada',
          message: 'Revisa y ajusta los datos desde la oportunidad "' + (o.titulo || '') + '".'
        });
      }
    }, 300);
  }, 400);
}

// ── Modal nueva oportunidad ──
function oppAbrirModal(prefill) {
  var existing = document.getElementById('gn-modal-opp');
  if (existing) existing.remove();
  var d = prefill || {};
  var modal = document.createElement('div');
  modal.id = 'gn-modal-opp';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
  modal.innerHTML = [
    '<div style="background:#111E17;border-radius:16px;padding:32px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;border:1px solid rgba(197,162,83,0.2);">',
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">',
        '<h3 style="margin:0;color:#E8F0EC;font-size:18px;"><i class="ph ph-lightning" style="color:#C5A253;"></i> Nueva Oportunidad</h3>',
        '<button onclick="document.getElementById(\'gn-modal-opp\').remove()" style="background:none;border:none;color:#8FAB9A;font-size:22px;cursor:pointer;">✕</button>',
      '</div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">',
        '<div style="grid-column:1/-1;"><label style="font-size:11px;color:#8FAB9A;display:block;margin-bottom:5px;">TÍTULO / DESCRIPCIÓN DEL TRABAJO *</label>',
        '<input id="opp-titulo" value="'+escH(d.titulo||'')+'" placeholder="Ej: Diseño de branding para startup" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(197,162,83,0.2);border-radius:8px;color:#E8F0EC;box-sizing:border-box;"></div>',
        '<div><label style="font-size:11px;color:#8FAB9A;display:block;margin-bottom:5px;">PLATAFORMA / FUENTE</label>',
        '<select id="opp-plataforma" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(197,162,83,0.2);border-radius:8px;color:#E8F0EC;">',
        ['upwork','workana','fiverr','linkedin','freelancer','referido','manual','otro'].map(function(p){return '<option value="'+p+'"'+(d.plataforma===p?' selected':'')+'>'+p.charAt(0).toUpperCase()+p.slice(1)+'</option>';}).join(''),
        '</select></div>',
        '<div><label style="font-size:11px;color:#8FAB9A;display:block;margin-bottom:5px;">PRESUPUESTO ESTIMADO (USD)</label>',
        '<input id="opp-presupuesto" type="number" value="'+(d.presupuesto||'')+'" placeholder="0.00" step="0.01" min="0" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(197,162,83,0.2);border-radius:8px;color:#E8F0EC;box-sizing:border-box;"></div>',
        '<div><label style="font-size:11px;color:#8FAB9A;display:block;margin-bottom:5px;">CLIENTE / EMPRESA</label>',
        '<input id="opp-cliente" value="'+escH(d.cliente||'')+'" placeholder="Nombre del cliente o empresa" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(197,162,83,0.2);border-radius:8px;color:#E8F0EC;box-sizing:border-box;"></div>',
        '<div><label style="font-size:11px;color:#8FAB9A;display:block;margin-bottom:5px;">ETAPA INICIAL</label>',
        '<select id="opp-stage" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(197,162,83,0.2);border-radius:8px;color:#E8F0EC;">',
        OPP_STAGES.map(function(s){return '<option value="'+s.id+'"'+((!d.stage&&s.id==='nuevo')||d.stage===s.id?' selected':'')+'>'+s.label+'</option>';}).join(''),
        '</select></div>',
        '<div><label style="font-size:11px;color:#8FAB9A;display:block;margin-bottom:5px;">PRIORIDAD</label>',
        '<select id="opp-prioridad" style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(197,162,83,0.2);border-radius:8px;color:#E8F0EC;">',
        '<option value="alta"'+(d.prioridad==='alta'?' selected':'')+'>\uD83D\uDD34 Alta</option>',
        '<option value="media"'+((!d.prioridad||d.prioridad==='media')?' selected':'')+'>\uD83D\uDFE1 Media</option>',
        '<option value="baja"'+(d.prioridad==='baja'?' selected':'')+'>\uD83D\uDFE2 Baja</option>',
        '</select></div>',
        '<div style="grid-column:1/-1;"><label style="font-size:11px;color:#8FAB9A;display:block;margin-bottom:5px;">LINK AL JOB (opcional)</label>',
        '<input id="opp-link" value="'+escH(d.link||'')+'" placeholder="https://www.upwork.com/jobs/..." style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(197,162,83,0.2);border-radius:8px;color:#E8F0EC;box-sizing:border-box;"></div>',
        '<div style="grid-column:1/-1;"><label style="font-size:11px;color:#8FAB9A;display:block;margin-bottom:5px;">NOTAS</label>',
        '<textarea id="opp-notas" rows="3" placeholder="Detalles del proyecto, requisitos, contacto..." style="width:100%;padding:10px;background:#0D1611;border:1px solid rgba(197,162,83,0.2);border-radius:8px;color:#E8F0EC;box-sizing:border-box;resize:vertical;">'+(d.notas||'')+'</textarea></div>',
      '</div>',
      '<div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;">',
        '<button onclick="document.getElementById(\'gn-modal-opp\').remove()" style="padding:10px 20px;background:rgba(18,53,36,0.3);border:1px solid rgba(197,162,83,0.15);border-radius:8px;color:#E8F0EC;cursor:pointer;">Cancelar</button>',
        '<button onclick="oppGuardarDesdeModal()" style="padding:10px 20px;background:#C5A253;border:none;border-radius:8px;color:#111;font-weight:700;cursor:pointer;"><i class="ph ph-floppy-disk"></i> Guardar Oportunidad</button>',
      '</div>',
    '</div>'
  ].join('');
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e){ if(e.target===modal) modal.remove(); });
}

async function oppGuardarDesdeModal() {
  var titulo = (document.getElementById('opp-titulo')||{}).value || '';
  if (!titulo.trim()) { alert('El título es obligatorio.'); return; }
  var payload = {
    titulo:      titulo.trim(),
    plataforma:  (document.getElementById('opp-plataforma')||{}).value || 'manual',
    presupuesto: (document.getElementById('opp-presupuesto')||{}).value || '',
    cliente:     (document.getElementById('opp-cliente')||{}).value || '',
    stage:       (document.getElementById('opp-stage')||{}).value || 'nuevo',
    prioridad:   (document.getElementById('opp-prioridad')||{}).value || 'media',
    link:        (document.getElementById('opp-link')||{}).value || '',
    notas:       (document.getElementById('opp-notas')||{}).value || '',
    fecha:       new Date().toISOString().split('T')[0]
  };
  await opp_save(payload);
  var modal = document.getElementById('gn-modal-opp');
  if (modal) modal.remove();
  await oppRenderKanban();
  if (window.showToast) window.showToast({ type:'success', title:'Oportunidad guardada', message: payload.titulo });
}

async function oppAbrirDetalle(id) {
  var opps = await opp_getAll();
  var o = opps.find(function(x){ return String(x.id)===String(id); });
  if (!o) return;
  oppAbrirModal(o);
  var form = document.getElementById('gn-modal-opp');
  if (!form) return;
  var btn = form.querySelector('button[onclick="oppGuardarDesdeModal()"]');
  if (btn) { btn.onclick = async function(){ await opp_update(id, {
    titulo: (document.getElementById('opp-titulo')||{}).value,
    plataforma: (document.getElementById('opp-plataforma')||{}).value,
    presupuesto: (document.getElementById('opp-presupuesto')||{}).value,
    cliente: (document.getElementById('opp-cliente')||{}).value,
    stage: (document.getElementById('opp-stage')||{}).value,
    prioridad: (document.getElementById('opp-prioridad')||{}).value,
    link: (document.getElementById('opp-link')||{}).value,
    notas: (document.getElementById('opp-notas')||{}).value
  }); var m=document.getElementById('gn-modal-opp'); if(m) m.remove(); await oppRenderKanban(); if(window.showToast) window.showToast({type:'success',title:'Actualizada'}); }; }
}

function escH(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
