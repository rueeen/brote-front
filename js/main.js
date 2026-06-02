const API_BASE = 'http://localhost:8000/api';

// ── SMOOTH SCROLL HELPER ──
function scrollTo_(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── NAVBAR SCROLL ──
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

// ── HAMBURGER ──
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobile-menu').classList.toggle('open');
});
function closeMobile() { document.getElementById('mobile-menu').classList.remove('open'); }

// ── FAQ ──
function toggleFaq(btn) {
  const item = btn.parentElement;
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

// ── CONTACT FORM ──
function submitContact() {
  const n = document.getElementById('cf-nombre').value;
  const e = document.getElementById('cf-email').value;
  if (!n || !e) { alert('Por favor completa nombre y email.'); return; }
  document.getElementById('contact-form-wrap').querySelector('.cf-submit').style.display = 'none';
  document.getElementById('cf-success').style.display = 'block';
}

// ── EVALUADOR ──
const MIN_DESCRIPTION_CHARS = 30;
let currentIdea = '';
let currentStep = 1;
let isStepAnimating = false;
const evalSessionData = {};

const rubroLabels = {
  tecnologia: 'Tecnología',
  gastronomia: 'Gastronomía',
  retail: 'Retail',
  salud: 'Salud',
  educacion: 'Educación',
  servicios: 'Servicios',
  sustentabilidad: 'Sustentabilidad',
  otro: 'Otro'
};

const evalForm = document.getElementById('eval-form');
const evalError = document.getElementById('eval-error');
const descriptionInput = document.getElementById('descripcion');
const descriptionCounter = document.getElementById('descripcion-counter');

document.querySelectorAll('.form-step').forEach(step => {
  step.style.display = step.dataset.step === '1' ? 'block' : 'none';
});

function showEvalError(message) {
  evalError.textContent = message;
  evalError.style.display = 'block';
}

function clearEvalError() {
  evalError.textContent = '';
  evalError.style.display = 'none';
}

function updateDescriptionCounter() {
  const count = descriptionInput.value.trim().length;
  descriptionCounter.textContent = `${count} / ${MIN_DESCRIPTION_CHARS} mínimo`;
  descriptionCounter.classList.toggle('ok', count >= MIN_DESCRIPTION_CHARS);
}

function saveEvalSessionData() {
  const data = new FormData(evalForm);
  evalSessionData.rubro = data.get('rubro') || '';
  evalSessionData.ciudad = data.get('ciudad') || '';
  evalSessionData.publico = data.get('publico') || '';
  evalSessionData.descripcion = data.get('descripcion') || '';
  evalSessionData.presupuesto_disponible = data.get('presupuesto_disponible') || '';
}

function restoreEvalSessionData() {
  Object.entries(evalSessionData).forEach(([name, value]) => {
    const field = evalForm.elements[name];
    if (!field) return;
    if (field instanceof RadioNodeList) {
      const radio = Array.from(field).find(input => input.value === value);
      if (radio) radio.checked = true;
      return;
    }
    field.value = value;
  });
  updateDescriptionCounter();
}

function focusFirstField(step) {
  const target = step.querySelector('input:not([type="hidden"]), textarea, select, button');
  if (target) target.focus({ preventScroll: true });
}

function updateProgress(stepNumber) {
  document.querySelectorAll('.progress-step').forEach(step => {
    const isActive = Number(step.dataset.step) === stepNumber;
    step.classList.toggle('active', isActive);
    if (isActive) {
      step.setAttribute('aria-current', 'step');
    } else {
      step.removeAttribute('aria-current');
    }
  });
}

function getStep(stepNumber) {
  return document.querySelector(`.form-step[data-step="${stepNumber}"]`);
}

function validateStep(stepNumber) {
  saveEvalSessionData();
  if (stepNumber === 1 && !evalSessionData.rubro) {
    showEvalError('Elige un rubro antes de continuar.');
    document.querySelector('input[name="rubro"]')?.focus();
    return false;
  }
  if (stepNumber === 2) {
    const ciudad = document.getElementById('ciudad');
    const publico = document.getElementById('publico');
    if (!ciudad.value.trim() || !publico.value.trim()) {
      showEvalError('Completa ciudad y público objetivo antes de continuar.');
      (ciudad.value.trim() ? publico : ciudad).focus();
      return false;
    }
  }
  if (stepNumber === 3 && evalSessionData.descripcion.trim().length < MIN_DESCRIPTION_CHARS) {
    showEvalError('La descripción debe tener al menos 30 caracteres.');
    descriptionInput.focus();
    return false;
  }
  clearEvalError();
  return true;
}

function updateReview() {
  saveEvalSessionData();
  document.getElementById('review-rubro').textContent = rubroLabels[evalSessionData.rubro] || '—';
  document.getElementById('review-ciudad').textContent = evalSessionData.ciudad || '—';
  document.getElementById('review-publico').textContent = evalSessionData.publico || '—';
  document.getElementById('review-descripcion').textContent = evalSessionData.descripcion || '—';
  document.getElementById('review-presupuesto').textContent = evalSessionData.presupuesto_disponible || 'Sin definir';
}

function goToStep(nextStepNumber) {
  if (isStepAnimating || nextStepNumber === currentStep) return;
  const fromStep = getStep(currentStep);
  const toStep = getStep(nextStepNumber);
  if (!fromStep || !toStep) return;

  saveEvalSessionData();
  restoreEvalSessionData();
  if (nextStepNumber === 4) updateReview();

  const isBack = nextStepNumber < currentStep;
  isStepAnimating = true;
  fromStep.classList.toggle('reverse', isBack);
  toStep.classList.toggle('reverse', isBack);
  toStep.style.display = 'block';
  toStep.classList.add('active');
  fromStep.classList.remove('active');
  fromStep.classList.add('leaving');
  updateProgress(nextStepNumber);

  window.setTimeout(() => {
    fromStep.classList.remove('leaving', 'reverse');
    fromStep.style.display = 'none';
    toStep.classList.remove('reverse');
    currentStep = nextStepNumber;
    isStepAnimating = false;
    focusFirstField(toStep);
  }, 250);
}

document.querySelectorAll('[data-next]').forEach(btn => {
  btn.addEventListener('click', () => {
    const nextStep = Number(btn.dataset.next);
    if (validateStep(currentStep)) goToStep(nextStep);
  });
});

document.querySelectorAll('[data-prev]').forEach(btn => {
  btn.addEventListener('click', () => goToStep(Number(btn.dataset.prev)));
});

evalForm.addEventListener('input', () => {
  saveEvalSessionData();
  updateDescriptionCounter();
  if (currentStep === 4) updateReview();
});

evalForm.addEventListener('change', () => {
  saveEvalSessionData();
  if (currentStep === 4) updateReview();
});

evalForm.addEventListener('keydown', event => {
  if (event.key !== 'Enter' || event.isComposing) return;
  if (event.target.tagName === 'TEXTAREA') return;
  event.preventDefault();
  if (currentStep === 4) {
    runEval();
    return;
  }
  if (validateStep(currentStep)) goToStep(currentStep + 1);
});

updateDescriptionCounter();

async function runEval() {
  if (!validateStep(3)) {
    goToStep(3);
    return;
  }
  updateReview();
  clearEvalError();

  const formData = new FormData(evalForm);
  const rubroSlugs = {
    tecnologia: 'tecnologia',
    tecnología: 'tecnologia',
    gastronomia: 'gastronomia',
    gastronomía: 'gastronomia',
    retail: 'retail',
    salud: 'salud',
    educacion: 'educacion',
    educación: 'educacion',
    servicios: 'servicios',
    sustentabilidad: 'sustentabilidad',
    otro: 'otro'
  };
  const rubroRaw = (formData.get('rubro') || '').toString().trim().toLowerCase();
  const payload = {
    rubro: rubroSlugs[rubroRaw] || rubroRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    publico: (formData.get('publico') || '').toString().trim(),
    descripcion: (formData.get('descripcion') || '').toString().trim(),
    ciudad: (formData.get('ciudad') || '').toString().trim(),
    presupuesto_disponible: (formData.get('presupuesto_disponible') || '').toString().trim()
  };

  const btn = document.getElementById('eval-btn');
  btn.disabled = true; btn.classList.add('loading');
  document.getElementById('eval-dashboard').classList.remove('visible');

  try {
    const res = await fetch(`${API_BASE}/evaluar/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const messagesByStatus = {
        400: 'Revisa los datos del formulario',
        429: 'Alcanzaste el límite de evaluaciones por hora',
        502: 'La IA no pudo procesar tu idea, intenta de nuevo'
      };
      showEvalError(messagesByStatus[res.status] || 'Error al evaluar. Por favor intenta de nuevo.');
      return;
    }

    const data = await res.json();
    renderDash(data.resultado);
  } catch(e) {
    showEvalError('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
  } finally {
    btn.disabled = false; btn.classList.remove('loading');
  }
}

function renderDash(r) {
  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  const safeScore = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const labels = { innovacion:'Innovación', escalabilidad:'Escalabilidad', mercado:'Mercado', originalidad:'Originalidad', viabilidad:'Viabilidad' };
  const colors = { innovacion:'#FF6B2B', escalabilidad:'#FF6B2B', mercado:'#ffb43c', originalidad:'#bf5fff', viabilidad:'#3de0ff' };
  const foda = r.foda || {};
  const presupuesto = r.presupuesto || {};
  const factibilidad = r.factibilidad || {};

  const scores = document.getElementById('dash-scores');
  scores.innerHTML = '';
  Object.entries(r.puntajes || {}).forEach(([k, v]) => {
    const score = safeScore(v);
    const label = labels[k] || k;
    const color = colors[k] || 'var(--orange)';
    scores.innerHTML += `<div class="dash-score-card"><div class="dsc-label">${escapeHtml(label)}</div><div class="dsc-val" style="color:${color}">${score}</div><div class="dsc-bar-bg"><div class="dsc-bar" style="width:0%;background:${color}" data-w="${score}"></div></div></div>`;
  });
  const globalScore = safeScore(r.puntaje_global);
  scores.innerHTML += `<div class="dash-score-card" style="border-color:rgba(255,107,43,0.25)"><div class="dsc-label">Global</div><div class="dsc-val" style="color:var(--orange)">${globalScore}</div><div class="dsc-bar-bg"><div class="dsc-bar" style="width:0%;background:var(--orange)" data-w="${globalScore}"></div></div></div>`;

  document.getElementById('verdict-panel').innerHTML = `<div class="v-emoji">${escapeHtml(r.veredicto_emoji || '🌱')}</div><div><div class="v-title">${escapeHtml(r.veredicto_titulo || 'Resultado BROTE')}</div><div class="v-text">${escapeHtml(r.veredicto_texto || '')}</div></div>`;

  document.getElementById('budget-grid').innerHTML = `
    <div class="bg-card"><div class="bg-label">MVP</div><div class="bg-val">${escapeHtml(presupuesto.mvp || '—')}</div></div>
    <div class="bg-card"><div class="bg-label">Lanzamiento</div><div class="bg-val">${escapeHtml(presupuesto.lanzamiento || '—')}</div></div>
    <div class="bg-card"><div class="bg-label">Escalar</div><div class="bg-val">${escapeHtml(presupuesto.escala || '—')}</div></div>`;

  const budgetNotes = document.getElementById('budget-notes');
  const notes = Array.isArray(presupuesto.notas) ? presupuesto.notas.join(' ') : presupuesto.notas;
  budgetNotes.textContent = notes || '';
  budgetNotes.style.display = notes ? 'block' : 'none';

  const levelClass = nivel => {
    const normalized = String(nivel || '').toLowerCase();
    if (normalized === 'alta') return 'level-high';
    if (normalized === 'media') return 'level-medium';
    if (normalized === 'baja') return 'level-low';
    return '';
  };
  const feasibilityLabels = {
    tecnica: 'Técnica',
    financiera: 'Financiera',
    legal: 'Legal',
    mercado: 'Mercado'
  };
  document.getElementById('feasibility-grid').innerHTML = Object.entries(feasibilityLabels).map(([key, label]) => {
    const item = factibilidad[key] || {};
    const nivel = item.nivel || '—';
    return `<div class="feasibility-card">
      <div class="feasibility-head">
        <div class="feasibility-title">${escapeHtml(label)}</div>
        <span class="feasibility-level ${levelClass(nivel)}">${escapeHtml(nivel)}</span>
      </div>
      <p>${escapeHtml(item.descripcion || 'Sin descripción disponible.')}</p>
    </div>`;
  }).join('');

  const cl = document.getElementById('comp-list');
  cl.innerHTML = '';
  (r.competencia || []).slice(0, 4).forEach(c => {
    const cls = c.tipo === 'directa' ? 'comp-direct' : c.tipo === 'indirecta' ? 'comp-indirect' : 'comp-none';
    const lbl = c.tipo === 'directa' ? 'Directa' : c.tipo === 'indirecta' ? 'Indirecta' : 'Sin rival';
    const url = c.url ? `<a class="comp-url" href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">Visitar</a>` : '';
    cl.innerHTML += `<div class="comp-item"><div><div class="comp-name">${escapeHtml(c.nombre || 'Competidor')}</div><div class="comp-desc">${escapeHtml(c.descripcion || '')}</div>${url}</div><span class="comp-tag ${cls}">${lbl}</span></div>`;
  });

  const pillList = (items, className, icon) => (Array.isArray(items) ? items : []).map(item => `<span class="pill ${className}">${icon} ${escapeHtml(item)}</span>`).join('');
  document.getElementById('strengths').innerHTML = pillList(foda.fortalezas, 'pill-g', '✓');
  document.getElementById('risks').innerHTML = pillList(foda.amenazas, 'pill-r', '⚠');
  document.getElementById('opportunities').innerHTML = pillList(foda.oportunidades, 'pill-o', '↗');
  document.getElementById('weaknesses').innerHTML = pillList(foda.debilidades, 'pill-w', '!');

  const tl = document.getElementById('tips-list');
  tl.innerHTML = (r.recomendaciones || []).map((t, i) => `<div class="tip-item"><span class="tip-n">${String(i + 1).padStart(2, '0')}</span><span>${escapeHtml(t)}</span></div>`).join('');

  const dash = document.getElementById('eval-dashboard');
  dash.classList.add('visible');

  setTimeout(() => {
    dash.querySelectorAll('.dsc-bar').forEach(b => { b.style.width = b.dataset.w + '%'; });
    dash.scrollIntoView({ behavior:'smooth', block:'start' });
  }, 100);
}

function resetEvalForm() {
  evalForm.reset();
  Object.keys(evalSessionData).forEach(key => delete evalSessionData[key]);
  currentIdea = '';
  clearEvalError();
  document.getElementById('eval-dashboard').classList.remove('visible');
  updateDescriptionCounter();
  updateReview();
  if (currentStep === 1) {
    focusFirstField(getStep(1));
  } else {
    goToStep(1);
  }
}

function askDeep() {
  alert('Esta función abre el chat de orientación personalizada con la IA. Disponible en el plan Brote.');
}
