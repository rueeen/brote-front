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
  const idea = [
    `Rubro: ${rubroLabels[formData.get('rubro')] || formData.get('rubro')}`,
    `Ciudad: ${formData.get('ciudad')}`,
    `Público objetivo: ${formData.get('publico')}`,
    `Descripción: ${formData.get('descripcion')}`,
    `Presupuesto disponible: ${formData.get('presupuesto_disponible') || 'Sin definir'}`
  ].join('\n');

  currentIdea = idea;
  const btn = document.getElementById('eval-btn');
  btn.disabled = true; btn.classList.add('loading');
  document.getElementById('eval-dashboard').classList.remove('visible');

  const prompt = `Eres un experto en análisis de startups e innovación. Evalúa esta idea:

"${idea}"

Responde SOLO con JSON válido, sin backticks ni texto extra:
{
  "puntajes": { "innovacion": <0-100>, "escalabilidad": <0-100>, "mercado": <0-100>, "originalidad": <0-100>, "viabilidad": <0-100> },
  "puntaje_global": <0-100>,
  "veredicto_emoji": "<emoji>",
  "veredicto_titulo": "<título corto>",
  "veredicto_texto": "<2-3 oraciones>",
  "presupuesto": { "mvp": "<rango USD>", "lanzamiento": "<rango USD>", "escala": "<rango USD>" },
  "competencia": [{ "nombre": "<nombre>", "descripcion": "<1 frase>", "tipo": "directa|indirecta|ninguna" }],
  "fortalezas": ["<f1>","<f2>","<f3>"],
  "riesgos": ["<r1>","<r2>","<r3>"],
  "recomendaciones": ["<rec1>","<rec2>","<rec3>"]
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const r = JSON.parse(clean);
    renderDash(r);
  } catch(e) {
    showEvalError('Error al evaluar. Por favor intenta de nuevo.');
  } finally {
    btn.disabled = false; btn.classList.remove('loading');
  }
}

function renderDash(r) {
  const labels = { innovacion:'Innovación', escalabilidad:'Escalabilidad', mercado:'Mercado', originalidad:'Originalidad', viabilidad:'Viabilidad' };
  const colors = { innovacion:'#FF6B2B', escalabilidad:'#FF6B2B', mercado:'#ffb43c', originalidad:'#bf5fff', viabilidad:'#3de0ff' };

  const scores = document.getElementById('dash-scores');
  scores.innerHTML = '';
  Object.entries(r.puntajes).forEach(([k, v]) => {
    scores.innerHTML += `<div class="dash-score-card"><div class="dsc-label">${labels[k]}</div><div class="dsc-val" style="color:${colors[k]}">${Math.round(v)}</div><div class="dsc-bar-bg"><div class="dsc-bar" style="width:0%;background:${colors[k]}" data-w="${Math.round(v)}"></div></div></div>`;
  });
  scores.innerHTML += `<div class="dash-score-card" style="border-color:rgba(255,107,43,0.25)"><div class="dsc-label">Global</div><div class="dsc-val" style="color:var(--orange)">${Math.round(r.puntaje_global)}</div><div class="dsc-bar-bg"><div class="dsc-bar" style="width:0%;background:var(--orange)" data-w="${Math.round(r.puntaje_global)}"></div></div></div>`;

  document.getElementById('verdict-panel').innerHTML = `<div class="v-emoji">${r.veredicto_emoji}</div><div><div class="v-title">${r.veredicto_titulo}</div><div class="v-text">${r.veredicto_texto}</div></div>`;

  document.getElementById('budget-grid').innerHTML = `
    <div class="bg-card"><div class="bg-label">MVP</div><div class="bg-val">${r.presupuesto.mvp}</div></div>
    <div class="bg-card"><div class="bg-label">Lanzamiento</div><div class="bg-val">${r.presupuesto.lanzamiento}</div></div>
    <div class="bg-card"><div class="bg-label">Escalar</div><div class="bg-val">${r.presupuesto.escala}</div></div>`;

  const cl = document.getElementById('comp-list');
  cl.innerHTML = '';
  (r.competencia||[]).slice(0,4).forEach(c => {
    const cls = c.tipo==='directa'?'comp-direct':c.tipo==='indirecta'?'comp-indirect':'comp-none';
    const lbl = c.tipo==='directa'?'Directa':c.tipo==='indirecta'?'Indirecta':'Sin rival';
    cl.innerHTML += `<div class="comp-item"><div><div class="comp-name">${c.nombre}</div><div class="comp-desc">${c.descripcion}</div></div><span class="comp-tag ${cls}">${lbl}</span></div>`;
  });

  document.getElementById('strengths').innerHTML = (r.fortalezas||[]).map(f=>`<span class="pill pill-g">✓ ${f}</span>`).join('');
  document.getElementById('risks').innerHTML = (r.riesgos||[]).map(f=>`<span class="pill pill-r">⚠ ${f}</span>`).join('');

  const tl = document.getElementById('tips-list');
  tl.innerHTML = (r.recomendaciones||[]).map((t,i)=>`<div class="tip-item"><span class="tip-n">0${i+1}</span><span>${t}</span></div>`).join('');

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
