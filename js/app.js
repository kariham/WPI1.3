/* =====================================================================
   QHSE Inspectietool — app.js
   Vanilla JS, geen framework nodig. Werkt 100% offline (IndexedDB).
   ===================================================================== */

const state = {
  view: 'home',        // home | form | history | view | dashboard
  checklistId: null,
  draft: null,          // huidige inspectie in bewerking
  inspections: [],       // cache van alle opgeslagen inspecties (metadata only, geen foto's)
  viewingId: null
};

const $app = document.getElementById('app');

function uid(prefix) {
  return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getChecklist(id) {
  return QHSE_CHECKLISTS.find(c => c.id === id);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------------------------------------------------------------------
   Init
--------------------------------------------------------------------- */
async function init() {
  state.inspections = await QHSE_DB.getAllInspections();
  render();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

/* ---------------------------------------------------------------------
   Nieuwe inspectie starten
--------------------------------------------------------------------- */
function newInspection(checklistId) {
  const checklist = getChecklist(checklistId);
  const metaValues = {};
  checklist.meta.forEach(f => {
    if (f.type === 'hoses') metaValues[f.id] = [];
    else if (f.type === 'multiselect') metaValues[f.id] = [];
    else if (f.type === 'date') metaValues[f.id] = todayISO();
    else metaValues[f.id] = '';
  });
  const answers = {};
  checklist.sections.forEach(sec => sec.questions.forEach(q => {
    answers[q.id] = { status: null, note: '', photos: [], checks: [] };
  }));

  state.draft = {
    id: uid('insp'),
    checklistId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    meta: metaValues,
    answers,
    samples: checklist.sample ? [] : null,
    samples2: checklist.sample2 ? [] : null,
    signature: null,
    finished: false
  };
  state.view = 'form';
  render();
}

function openInspection(id) {
  const insp = state.inspections.find(i => i.id === id);
  if (!insp) return;
  state.draft = JSON.parse(JSON.stringify(insp));
  state.checklistId = insp.checklistId;
  state.view = 'form';
  render();
}

function viewInspection(id) {
  state.viewingId = id;
  state.view = 'view';
  render();
}

async function saveDraft(silent) {
  state.draft.updatedAt = new Date().toISOString();
  await QHSE_DB.saveInspection(state.draft);
  state.inspections = await QHSE_DB.getAllInspections();
  if (!silent) toast('Opgeslagen ✓');
}

async function deleteInspection(id) {
  if (!confirm('Deze inspectie definitief verwijderen?')) return;
  await QHSE_DB.deleteInspection(id);
  state.inspections = await QHSE_DB.getAllInspections();
  render();
}

function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------------------------------------------------------------------
   RENDER: router
--------------------------------------------------------------------- */
function render() {
  if (state.view === 'home') return renderHome();
  if (state.view === 'form') return renderForm();
  if (state.view === 'history') return renderHistory();
  if (state.view === 'dashboard') return renderDashboard();
  if (state.view === 'view') return renderViewInspection();
}

function logoImg(cls) {
  return `<img src="${QHSE_LOGO}" class="${cls || 'logo'}" alt="Scandinavian Oil Services">`;
}

/* ---------------------------------------------------------------------
   HOME
--------------------------------------------------------------------- */
function renderHome() {
  const openCount = state.inspections.filter(i => !i.finished).length;
  const nokCount = countAllNok(state.inspections);

  $app.innerHTML = `
    <header class="topbar">
      <button class="icon-btn ghost-btn" data-action="go-dashboard" title="Dashboard">📊</button>
      <div class="brand">
        ${logoImg('brand-logo')}
        <span class="brand-sub">Inspectietool</span>
      </div>
      <span class="icon-btn ghost-btn spacer"></span>
    </header>

    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-value">${state.inspections.length}</div>
        <div class="stat-label">Inspecties totaal</div>
      </div>
      <div class="stat-card warn">
        <div class="stat-value">${nokCount}</div>
        <div class="stat-label">Openstaande NOK's</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${openCount}</div>
        <div class="stat-label">Niet afgewerkt</div>
      </div>
    </div>

    <h2 class="section-title">Kies een checklist</h2>
    <div class="checklist-grid">
      ${QHSE_CHECKLISTS.map(c => `
        <button class="checklist-card" style="--accent:${c.color}" data-action="new" data-id="${c.id}">
          <span class="cc-title">${c.title}</span>
          <span class="cc-sub">${c.subtitle}</span>
        </button>
      `).join('')}
    </div>

    <button class="link-btn" data-action="go-history">📁 Bekijk alle inspecties (${state.inspections.length})</button>

    <footer class="footnote">Scandinavian Oil Services — Blending &amp; Logistics B.V. · werkt volledig offline</footer>
  `;
  bindGlobal();
}

function countAllNok(list) {
  let n = 0;
  list.forEach(insp => {
    Object.values(insp.answers || {}).forEach(a => { if (a.status === 'NOK') n++; });
  });
  return n;
}

/* ---------------------------------------------------------------------
   HISTORY
--------------------------------------------------------------------- */
function renderHistory() {
  const sorted = [...state.inspections].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  $app.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-action="go-home">←</button>
      <div class="brand"><span class="brand-mark">Alle inspecties</span></div>
      <span></span>
    </header>
    <div class="list">
      ${sorted.length === 0 ? '<p class="empty">Nog geen inspecties opgeslagen.</p>' : sorted.map(insp => {
        const cl = getChecklist(insp.checklistId);
        const nok = Object.values(insp.answers || {}).filter(a => a.status === 'NOK').length;
        return `
        <div class="list-item" style="--accent:${cl.color}">
          <div class="li-main" data-action="open-view" data-id="${insp.id}">
            <div class="li-title">${cl.title}${insp.finished ? '' : ' <span class="badge draft">concept</span>'}</div>
            <div class="li-sub">${insp.meta.naam || ''} · ${insp.meta.datum || ''}</div>
          </div>
          <div class="li-side">
            ${nok > 0 ? `<span class="badge nok">${nok} NOK</span>` : '<span class="badge ok">OK</span>'}
            <button class="icon-btn small" data-action="open-edit" data-id="${insp.id}" title="Bewerken">✏️</button>
            <button class="icon-btn small" data-action="delete" data-id="${insp.id}" title="Verwijderen">🗑️</button>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
  bindGlobal();
}

/* ---------------------------------------------------------------------
   DASHBOARD — alle actiepunten (NOK's)
--------------------------------------------------------------------- */
function renderDashboard() {
  const rows = [];
  state.inspections.forEach(insp => {
    const cl = getChecklist(insp.checklistId);
    cl.sections.forEach(sec => sec.questions.forEach(q => {
      const a = insp.answers[q.id];
      if (a && a.status === 'NOK') {
        rows.push({ insp, cl, sec, q, a });
      }
    }));
    (insp.samples || []).forEach(s => {
      if (s.conform === 'NOK') rows.push({ insp, cl, sample: s, sampleLabel: cl.sampleTitle });
    });
    (insp.samples2 || []).forEach(s => {
      if (s.opmerking) rows.push({ insp, cl, sample: s, sampleLabel: cl.sample2Title });
    });
  });
  rows.sort((r1, r2) => (r2.insp.updatedAt || '').localeCompare(r1.insp.updatedAt || ''));

  $app.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-action="go-home">←</button>
      <div class="brand"><span class="brand-mark">Actiepunten (NOK)</span></div>
      <span></span>
    </header>
    <div class="list">
      ${rows.length === 0 ? '<p class="empty">Geen openstaande NOK-punten 🎉</p>' : rows.map(r => `
        <div class="list-item" style="--accent:${r.cl.color}">
          <div class="li-main" data-action="open-view" data-id="${r.insp.id}">
            <div class="li-title">${r.cl.title} · ${r.insp.meta.naam || ''}</div>
            <div class="li-sub">${r.sample ? (r.sampleLabel + ': ' + (r.sample.naam || '-') + ' (UN ' + (r.sample.un || '-') + ')') : (r.q.num ? r.q.num + '. ' : '') + r.q.text}</div>
            <div class="li-date">${r.insp.meta.datum || ''}</div>
          </div>
          <span class="badge nok">NOK</span>
        </div>
      `).join('')}
    </div>
  `;
  bindGlobal();
}

/* ---------------------------------------------------------------------
   VIEW (read-only) van een opgeslagen inspectie + PDF/deel-knoppen
--------------------------------------------------------------------- */
function renderViewInspection() {
  const insp = state.inspections.find(i => i.id === state.viewingId);
  if (!insp) { state.view = 'history'; return render(); }
  const cl = getChecklist(insp.checklistId);

  $app.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-action="go-history">←</button>
      <div class="brand"><span class="brand-mark">${cl.title}</span></div>
      <button class="icon-btn" data-action="open-edit" data-id="${insp.id}">✏️</button>
    </header>
    <div class="form-wrap" id="viewWrap"><p class="empty">Bezig met laden…</p></div>
    <div class="action-bar">
      <button class="btn secondary" data-action="export-pdf" data-id="${insp.id}">📄 PDF genereren</button>
      <button class="btn primary" data-action="share-pdf" data-id="${insp.id}">📤 Delen met team</button>
    </div>
  `;
  bindGlobal();
  renderSummaryHtml(insp, cl);
}

function renderSummaryHtml(insp, cl) {
  const metaHtml = cl.meta.map(f => {
    let val = insp.meta[f.id];
    if (f.type === 'hoses') {
      val = (val || []).map(h => `${h.naam || 'slang'} — cert. ${h.cert || '-'} (${h.keuring === 'ok' ? 'gekeurd OK' : h.keuring === 'nok' ? 'NIET conform' : 'onbekend'})${h.keuring === 'nok' && h.note ? ' — ' + h.note : ''}`).join('<br>');
    } else if (Array.isArray(val)) val = val.join(', ');
    return `<div class="meta-row"><span>${f.label}</span><strong>${val || '-'}</strong></div>`;
  }).join('');

  const sectionsHtml = cl.sections.map(sec => `
    <div class="view-section">
      <h3>${sec.name}</h3>
      ${sec.questions.map(q => {
        const a = insp.answers[q.id] || {};
        return `<div class="view-q ${a.status === 'NOK' ? 'is-nok' : ''}">
          <div class="vq-text">${q.num ? `<strong>${q.num}.</strong> ` : ''}${q.text}</div>
          ${q.hint ? `<div class="vq-hint">${q.hint}</div>` : ''}
          <div class="vq-status status-${(a.status || 'leeg').toLowerCase()}">${a.status || '—'}</div>
          ${(a.checks && a.checks.length) ? `<div class="vq-checks">${a.checks.join(' · ')}</div>` : ''}
          ${a.note ? `<div class="vq-note">${a.note}</div>` : ''}
          ${(a.photos && a.photos.length) ? `<div class="vq-photos" data-photo-ids="${a.photos.join(',')}"></div>` : ''}
        </div>`;
      }).join('')}
    </div>
  `).join('');

  const sampleHtml = cl.sample ? `
    <div class="view-section">
      <h3>${cl.sampleTitle}</h3>
      ${(insp.samples || []).map(s => `
        <div class="view-q ${s.conform === 'NOK' ? 'is-nok' : ''}">
          <div class="vq-text"><strong>${s.naam || '-'}</strong> — UN ${s.un || '-'}</div>
          <div class="vq-note">Aanwezig: ${s.aanwezig || '-'} / Limiet: ${s.limiet || '-'} · Conform: ${s.conform || '-'}${s.opmerking ? ' · ' + s.opmerking : ''}</div>
        </div>
      `).join('') || '<p class="empty">Geen steekproef geregistreerd.</p>'}
    </div>
  ` : '';

  const sample2Html = cl.sample2 ? `
    <div class="view-section">
      <h3>${cl.sample2Title}</h3>
      ${(insp.samples2 || []).map(s => `
        <div class="view-q">
          <div class="vq-text"><strong>${s.naam || '-'}</strong> — UN ${s.un || '-'}</div>
          <div class="vq-note">Gevaar (CLP): ${s.gevaarclp || '-'}${s.opmerking ? ' · ' + s.opmerking : ''}</div>
        </div>
      `).join('') || '<p class="empty">Geen steekproef geregistreerd.</p>'}
    </div>
  ` : '';

  const sigHtml = insp.signature ? `<div class="view-section"><h3>Handtekening inspecteur</h3><img class="sig-img" src="${insp.signature}"></div>` : '';

  document.getElementById('viewWrap').innerHTML = `
    <div class="meta-block">${metaHtml}</div>
    ${sectionsHtml}
    ${sampleHtml}
    ${sample2Html}
    ${sigHtml}
  `;

  // foto's asynchroon inladen vanuit IndexedDB
  document.querySelectorAll('.vq-photos').forEach(async el => {
    const ids = el.dataset.photoIds.split(',').filter(Boolean);
    for (const id of ids) {
      const url = await QHSE_DB.getPhoto(id);
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'thumb';
        el.appendChild(img);
      }
    }
  });
}

/* ---------------------------------------------------------------------
   FORM — invullen van een checklist
--------------------------------------------------------------------- */
function renderForm() {
  const cl = getChecklist(state.draft.checklistId);
  const d = state.draft;

  $app.innerHTML = `
    <header class="topbar" style="--accent:${cl.color}">
      <button class="icon-btn" data-action="go-home-confirm">←</button>
      <div class="brand"><span class="brand-mark">${cl.title}</span></div>
      <button class="icon-btn" data-action="save-draft">💾</button>
    </header>
    <div class="form-wrap">

      <section class="card">
        <h3>Gegevens</h3>
        ${cl.meta.map(f => renderMetaField(f, d)).join('')}
      </section>

      ${cl.sections.map(sec => `
        <section class="card">
          <h3>${sec.name}</h3>
          ${sec.questions.map(q => renderQuestion(q, d)).join('')}
        </section>
      `).join('')}

      ${cl.sample ? renderSampleSection(cl, d) : ''}
      ${cl.sample2 ? renderSample2Section(cl, d) : ''}

      <section class="card">
        <h3>Handtekening inspecteur</h3>
        <canvas id="sigPad" class="sig-pad" width="600" height="200"></canvas>
        <div class="sig-actions">
          <button class="btn secondary" data-action="clear-sig">Wissen</button>
        </div>
      </section>

      <div class="action-bar column">
        <button class="btn primary large" data-action="finish">✅ Inspectie afronden &amp; opslaan</button>
        <button class="btn secondary" data-action="save-draft">Opslaan als concept</button>
      </div>
    </div>
  `;
  bindGlobal();
  initSignaturePad(d.signature);
}

function renderMetaField(f, d) {
  const val = d.meta[f.id];
  if (f.type === 'hoses') {
    const hoses = val || [];
    return `
      <div class="field">
        <label>${f.label}</label>
        <div class="hose-list" data-meta="${f.id}">
          ${hoses.map((h, i) => renderHoseRow(f.id, h, i)).join('')}
        </div>
        ${hoses.length < f.max ? `<button class="btn tiny" data-action="add-hose" data-meta="${f.id}">+ Slang toevoegen</button>` : ''}
      </div>`;
  }
  if (f.type === 'multiselect') {
    const selected = val || [];
    return `
      <div class="field">
        <label>${f.label}</label>
        <div class="chip-row" data-meta="${f.id}">
          ${f.options.map(opt => `<button class="chip ${selected.includes(opt) ? 'active' : ''}" data-action="toggle-multiselect" data-meta="${f.id}" data-opt="${opt}">${opt}</button>`).join('')}
        </div>
      </div>`;
  }
  if (f.type === 'date') {
    return `<div class="field"><label>${f.label}</label><input type="date" data-meta="${f.id}" value="${val || ''}"></div>`;
  }
  return `<div class="field"><label>${f.label}</label><input type="text" data-meta="${f.id}" value="${escapeAttr(val || '')}" placeholder="${f.label}"></div>`;
}

function renderHoseRow(metaId, h, i) {
  const isNok = h.keuring === 'nok';
  return `
    <div class="hose-row-wrap ${isNok ? 'is-nok' : ''}" data-hose-index="${i}">
      <div class="hose-row">
        <input type="text" placeholder="Omschrijving slang ${i + 1}" data-hose-field="naam" value="${escapeAttr(h.naam || '')}">
        <input type="text" placeholder="Cert. nr." data-hose-field="cert" value="${escapeAttr(h.cert || '')}">
        <button class="icon-btn small" data-action="remove-hose" data-meta="${metaId}" data-index="${i}">✕</button>
      </div>
      <div class="hose-keuring-row">
        <span class="hose-keuring-label">Keuring:</span>
        <button class="status-btn status-ok ${h.keuring === 'ok' ? 'active' : ''}" data-action="set-hose-keuring" data-meta="${metaId}" data-index="${i}" data-value="ok">Gekeurd OK</button>
        <button class="status-btn status-nok ${h.keuring === 'nok' ? 'active' : ''}" data-action="set-hose-keuring" data-meta="${metaId}" data-index="${i}" data-value="nok">Niet conform</button>
      </div>
      ${isNok ? `
        <div class="hose-extra">
          <textarea placeholder="Opmerking bij niet-conforme slang…" data-action="hose-note" data-meta="${metaId}" data-index="${i}">${h.note || ''}</textarea>
          <div class="photo-row">
            ${(h.photos || []).map(pid => `<span class="photo-chip"><img data-photo-thumb="${pid}" class="thumb"><button data-action="remove-hose-photo" data-meta="${metaId}" data-index="${i}" data-pid="${pid}">✕</button></span>`).join('')}
            <label class="btn tiny photo-add">📷 Foto toevoegen
              <input type="file" accept="image/*" capture="environment" multiple style="display:none" data-action="add-hose-photo" data-meta="${metaId}" data-index="${i}">
            </label>
          </div>
        </div>
      ` : ''}
    </div>`;
}

function renderQuestion(q, d) {
  const a = d.answers[q.id];
  return `
    <div class="question ${a.status === 'NOK' ? 'is-nok' : ''}" data-qid="${q.id}">
      <div class="q-text">${q.num ? `<span class="q-num">${q.num}.</span> ` : ''}${q.text}</div>
      ${q.hint ? `<div class="q-hint">${q.hint}</div>` : ''}
      ${q.checkboxOptions ? `
        <div class="check-row">
          ${q.checkboxOptions.map(opt => `<button class="chip ${a.checks && a.checks.includes(opt) ? 'active' : ''}" data-action="toggle-check" data-qid="${q.id}" data-opt="${escapeAttr(opt)}">${opt}</button>`).join('')}
        </div>
      ` : ''}
      <div class="q-status-row">
        ${QHSE_STATUS.map(s => `
          <button class="status-btn status-${s.toLowerCase()} ${a.status === s ? 'active' : ''}" data-action="set-status" data-qid="${q.id}" data-status="${s}">${s}</button>
        `).join('')}
      </div>
      <div class="q-extra" style="${a.status === 'NOK' ? '' : 'display:none'}">
        <textarea placeholder="Opmerking / vaststelling…" data-action="note" data-qid="${q.id}">${a.note || ''}</textarea>
        <div class="photo-row" data-qid="${q.id}">
          ${(a.photos || []).map(pid => `<span class="photo-chip" data-photo-id="${pid}"><img data-photo-thumb="${pid}" class="thumb"><button data-action="remove-photo" data-qid="${q.id}" data-pid="${pid}">✕</button></span>`).join('')}
          <label class="btn tiny photo-add">📷 Foto toevoegen
            <input type="file" accept="image/*" capture="environment" multiple style="display:none" data-action="add-photo" data-qid="${q.id}">
          </label>
        </div>
      </div>
    </div>`;
}

function renderSampleSection(cl, d) {
  const samples = d.samples || [];
  return `
    <section class="card">
      <h3>${cl.sampleTitle}</h3>
      <p class="hint">${cl.sampleHint || ''}</p>
      <p class="hint">${samples.length} / ${cl.sampleMin} geregistreerd</p>
      ${samples.map((s, i) => `
        <div class="sample-row" data-sample-group="samples" data-sample-index="${i}">
          ${cl.sampleFields.map(f => f.type === 'select'
            ? `<select data-sample-field="${f.id}">${f.options.map(o => `<option ${s[f.id] === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`
            : `<input type="text" placeholder="${f.label}" data-sample-field="${f.id}" value="${escapeAttr(s[f.id] || '')}">`
          ).join('')}
          <button class="icon-btn small" data-action="remove-sample" data-index="${i}">✕</button>
        </div>
      `).join('')}
      <button class="btn tiny" data-action="add-sample">+ Product toevoegen</button>
    </section>`;
}

function renderSample2Section(cl, d) {
  const samples = d.samples2 || [];
  return `
    <section class="card">
      <h3>${cl.sample2Title}</h3>
      <p class="hint">${cl.sample2Hint || ''}</p>
      <p class="hint">${samples.length} / ${cl.sample2Min} geregistreerd</p>
      ${samples.map((s, i) => `
        <div class="sample-row sample-row-2" data-sample-group="samples2" data-sample-index="${i}">
          ${cl.sample2Fields.map(f => `<input type="text" placeholder="${f.label}" data-sample-field="${f.id}" value="${escapeAttr(s[f.id] || '')}">`).join('')}
          <button class="icon-btn small" data-action="remove-sample2" data-index="${i}">✕</button>
        </div>
      `).join('')}
      <button class="btn tiny" data-action="add-sample2">+ Product toevoegen</button>
    </section>`;
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}

/* ---------------------------------------------------------------------
   Signature pad (canvas)
--------------------------------------------------------------------- */
let sigCtx = null, sigDrawing = false;
function initSignaturePad(existingDataUrl) {
  const canvas = document.getElementById('sigPad');
  if (!canvas) return;
  sigCtx = canvas.getContext('2d');
  sigCtx.lineWidth = 2.5;
  sigCtx.lineCap = 'round';
  sigCtx.strokeStyle = '#1a1a1a';
  if (existingDataUrl) {
    const img = new Image();
    img.onload = () => sigCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = existingDataUrl;
  }
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * (canvas.width / r.width), y: (t.clientY - r.top) * (canvas.height / r.height) };
  };
  const start = (e) => { sigDrawing = true; const p = pos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x, p.y); e.preventDefault(); };
  const move = (e) => { if (!sigDrawing) return; const p = pos(e); sigCtx.lineTo(p.x, p.y); sigCtx.stroke(); e.preventDefault(); };
  const end = () => { if (!sigDrawing) return; sigDrawing = false; state.draft.signature = canvas.toDataURL('image/png'); };

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);
}

/* ---------------------------------------------------------------------
   Photo helpers — resize/compress before opslag
--------------------------------------------------------------------- */
function fileToCompressedDataUrl(file, maxDim) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const c = document.createElement('canvas');
      c.width = width; c.height = height;
      c.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(c.toDataURL('image/jpeg', 0.7));
    }; img.onerror = reject; img.src = reader.result; };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadThumb(imgEl, photoId) {
  const url = await QHSE_DB.getPhoto(photoId);
  if (url) imgEl.src = url;
}

/* ---------------------------------------------------------------------
   Event delegation
   LET OP: alle event-handlers worden hier als PROPERTY toegewezen
   ($app.onclick = ..., $app.onchange = ...) i.p.v. met addEventListener.
   Dit is bewust zo: bindGlobal() wordt na élke render() opnieuw
   aangeroepen, en addEventListener zou dan telkens een EXTRA listener
   stapelen bovenop de vorige (met als gevolg: foto's die meermaals
   verwerkt/opgeslagen worden). Door te werken met een property-
   toewijzing vervangt elke aanroep gewoon de vorige handler.
--------------------------------------------------------------------- */
function bindGlobal() {
  $app.querySelectorAll('[data-photo-thumb]').forEach(img => loadThumb(img, img.dataset.photoThumb));

  $app.onclick = async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'new') return newInspection(btn.dataset.id);
    if (action === 'go-home') { state.view = 'home'; return render(); }
    if (action === 'go-home-confirm') {
      await saveDraft(true);
      state.view = 'home'; return render();
    }
    if (action === 'go-history') { state.view = 'history'; return render(); }
    if (action === 'go-dashboard') { state.view = 'dashboard'; return render(); }
    if (action === 'open-view') return viewInspection(btn.dataset.id);
    if (action === 'open-edit') return openInspection(btn.dataset.id);
    if (action === 'delete') return deleteInspection(btn.dataset.id);
    if (action === 'save-draft') return saveDraft(false);

    if (action === 'finish') {
      const cl = getChecklist(state.draft.checklistId);
      const missing = Object.entries(state.draft.answers).filter(([, a]) => !a.status).length;
      if (missing > 0 && !confirm(`${missing} vraag/vragen nog niet beantwoord. Toch afronden?`)) return;
      if (cl.sample && (state.draft.samples || []).length < cl.sampleMin) {
        if (!confirm(`Minder dan ${cl.sampleMin} producten in de steekproef "${cl.sampleTitle}". Toch afronden?`)) return;
      }
      if (cl.sample2 && (state.draft.samples2 || []).length < cl.sample2Min) {
        if (!confirm(`Minder dan ${cl.sample2Min} producten in de steekproef "${cl.sample2Title}". Toch afronden?`)) return;
      }
      state.draft.finished = true;
      await saveDraft(true);
      state.viewingId = state.draft.id;
      state.view = 'view';
      toast('Inspectie afgerond ✓');
      return render();
    }

    if (action === 'set-status') {
      const qid = btn.dataset.qid;
      state.draft.answers[qid].status = btn.dataset.status;
      renderForm(); initSignaturePad(state.draft.signature); return;
    }

    if (action === 'toggle-check') {
      const qid = btn.dataset.qid, opt = btn.dataset.opt;
      const a = state.draft.answers[qid];
      a.checks = a.checks || [];
      const i = a.checks.indexOf(opt);
      if (i === -1) a.checks.push(opt); else a.checks.splice(i, 1);
      renderForm(); initSignaturePad(state.draft.signature); return;
    }

    if (action === 'add-hose') return mutateMetaArray(btn.dataset.meta, arr => arr.push({ naam: '', cert: '', keuring: '', note: '', photos: [] }));
    if (action === 'remove-hose') return mutateMetaArray(btn.dataset.meta, arr => arr.splice(Number(btn.dataset.index), 1));
    if (action === 'toggle-multiselect') return mutateMetaArray(btn.dataset.meta, arr => {
      const opt = btn.dataset.opt;
      const i = arr.indexOf(opt);
      if (i === -1) arr.push(opt); else arr.splice(i, 1);
    });
    if (action === 'set-hose-keuring') {
      const metaId = btn.dataset.meta, idx = Number(btn.dataset.index), value = btn.dataset.value;
      const hose = state.draft.meta[metaId][idx];
      hose.keuring = hose.keuring === value ? '' : value;
      renderForm(); initSignaturePad(state.draft.signature); return;
    }
    if (action === 'remove-hose-photo') {
      const metaId = btn.dataset.meta, idx = Number(btn.dataset.index), pid = btn.dataset.pid;
      const hose = state.draft.meta[metaId][idx];
      hose.photos = (hose.photos || []).filter(p => p !== pid);
      await QHSE_DB.deletePhoto(pid);
      renderForm(); initSignaturePad(state.draft.signature); return;
    }

    if (action === 'add-sample') {
      state.draft.samples = state.draft.samples || [];
      state.draft.samples.push({});
      renderForm(); initSignaturePad(state.draft.signature); return;
    }
    if (action === 'remove-sample') {
      state.draft.samples.splice(Number(btn.dataset.index), 1);
      renderForm(); initSignaturePad(state.draft.signature); return;
    }
    if (action === 'add-sample2') {
      state.draft.samples2 = state.draft.samples2 || [];
      state.draft.samples2.push({});
      renderForm(); initSignaturePad(state.draft.signature); return;
    }
    if (action === 'remove-sample2') {
      state.draft.samples2.splice(Number(btn.dataset.index), 1);
      renderForm(); initSignaturePad(state.draft.signature); return;
    }

    if (action === 'remove-photo') {
      const qid = btn.dataset.qid, pid = btn.dataset.pid;
      state.draft.answers[qid].photos = state.draft.answers[qid].photos.filter(p => p !== pid);
      await QHSE_DB.deletePhoto(pid);
      renderForm(); initSignaturePad(state.draft.signature); return;
    }

    if (action === 'clear-sig') {
      const canvas = document.getElementById('sigPad');
      sigCtx.clearRect(0, 0, canvas.width, canvas.height);
      state.draft.signature = null;
      return;
    }

    if (action === 'export-pdf') {
      const insp = state.inspections.find(i => i.id === btn.dataset.id);
      toast('PDF wordt gegenereerd…');
      const blob = await QHSE_PDF.build(insp, getChecklist(insp.checklistId));
      downloadBlob(blob, pdfFileName(insp));
      return;
    }
    if (action === 'share-pdf') {
      const insp = state.inspections.find(i => i.id === btn.dataset.id);
      toast('PDF wordt voorbereid…');
      const blob = await QHSE_PDF.build(insp, getChecklist(insp.checklistId));
      const file = new File([blob], pdfFileName(insp), { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'QHSE inspectierapport', text: pdfFileName(insp) }); return; }
        catch (err) { /* gebruiker annuleerde, val terug op download */ }
      }
      downloadBlob(blob, pdfFileName(insp));
      toast('Delen niet ondersteund op dit toestel — PDF gedownload');
      return;
    }
  };

  // Eén gecombineerde handler voor input+change events (tekstvelden, datums,
  // selects, notitievelden EN foto-inputs). Property-toewijzing i.p.v.
  // addEventListener — zie uitleg hierboven.
  const handleFieldChange = async (e) => {
    const el = e.target;

    if (el.dataset.action === 'add-photo') {
      const qid = el.dataset.qid;
      const files = Array.from(el.files || []);
      el.value = ''; // voorkomt her-verwerking als hetzelfde change-event ooit opnieuw zou bubbelen
      for (const file of files) {
        const dataUrl = await fileToCompressedDataUrl(file, 1000);
        const pid = uid('photo');
        await QHSE_DB.savePhoto(pid, dataUrl);
        state.draft.answers[qid].photos.push(pid);
      }
      renderForm(); initSignaturePad(state.draft.signature);
      return;
    }

    if (el.dataset.action === 'add-hose-photo') {
      const metaId = el.dataset.meta, idx = Number(el.dataset.index);
      const files = Array.from(el.files || []);
      el.value = '';
      const hose = state.draft.meta[metaId][idx];
      hose.photos = hose.photos || [];
      for (const file of files) {
        const dataUrl = await fileToCompressedDataUrl(file, 1000);
        const pid = uid('photo');
        await QHSE_DB.savePhoto(pid, dataUrl);
        hose.photos.push(pid);
      }
      renderForm(); initSignaturePad(state.draft.signature);
      return;
    }

    if (el.dataset.action === 'hose-note') {
      const metaId = el.dataset.meta, idx = Number(el.dataset.index);
      state.draft.meta[metaId][idx].note = el.value;
      return;
    }

    if (el.dataset.meta && !el.closest('.hose-row-wrap')) {
      state.draft.meta[el.dataset.meta] = el.value;
      return;
    }
    if (el.dataset.action === 'note') {
      state.draft.answers[el.dataset.qid].note = el.value;
      return;
    }
    if (el.closest('.hose-row-wrap') && el.dataset.hoseField) {
      const row = el.closest('.hose-row-wrap');
      const metaId = row.closest('[data-meta]').dataset.meta;
      const idx = Number(row.dataset.hoseIndex);
      state.draft.meta[metaId][idx][el.dataset.hoseField] = el.value;
      return;
    }
    if (el.closest('.sample-row') && el.dataset.sampleField) {
      const row = el.closest('.sample-row');
      const group = row.dataset.sampleGroup; // 'samples' of 'samples2'
      const idx = Number(row.dataset.sampleIndex);
      state.draft[group][idx][el.dataset.sampleField] = el.value;
      return;
    }
  };

  $app.oninput = handleFieldChange;
  $app.onchange = handleFieldChange;
}

function mutateMetaArray(metaId, fn) {
  const arr = state.draft.meta[metaId] || [];
  fn(arr);
  state.draft.meta[metaId] = arr;
  renderForm();
  initSignaturePad(state.draft.signature);
}

function pdfFileName(insp) {
  const cl = getChecklist(insp.checklistId);
  return `QHSE_${cl.title.replace(/\s+/g, '_')}_${(insp.meta.naam || 'inspectie').replace(/\s+/g, '_')}_${insp.meta.datum || ''}.pdf`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

init();
