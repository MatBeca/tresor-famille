import { Idiomorph } from './vendor/idiomorph.esm.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, onSnapshot, setDoc, getDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './config.js';

/* ---------- outils ---------- */
const EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const r2 = n => Math.round(n * 100) / 100;
const f = n => EUR.format(r2(n));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const iso = () => new Date().toISOString();
const uid6 = () => 'k' + Math.random().toString(36).slice(2, 8);
const dateFr = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const daysSince = d => Math.floor((Date.now() - new Date(d)) / 864e5);
const wk = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); };
const sameWeek = d => !!d && wk(d) === wk(new Date());
const pct = r => (r > 0 ? '+' : r < 0 ? '−' : '') + String(Math.abs(r)).replace('.', ',') + ' %';
const num = v => parseFloat(String(v).replace(',', '.'));
const de = n => (/^[aeiouyéèêh]/i.test(n) ? 'd’' : 'de ') + esc(n);
function ageAt(birth, date) { const b = new Date(birth + 'T12:00:00'); let a = date.getFullYear() - b.getFullYear(); const m = date.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && date.getDate() < b.getDate())) a--; return a; }
const validBirth = b => /^\d{4}-\d{2}-\d{2}$/.test(b || '') && !isNaN(new Date(b)) && ageAt(b, new Date()) >= 3 && ageAt(b, new Date()) < 18;
const suggest = b => validBirth(b) ? Math.max(1, Math.round(ageAt(b, new Date()) * 0.5)) : 3;

const PAL = ['#f0505a', '#2f6feb', '#8e5ce6', '#f07c00', '#e0438f', '#139fb5'];
const PAR = {
  parents: { label: 'Les parents', de: 'des parents', a: 'à tes parents', aj: 'tes parents ajoutent' },
  papa: { label: 'Papa', de: 'de papa', a: 'à papa', aj: 'papa ajoute' },
  maman: { label: 'Maman', de: 'de maman', a: 'à maman', aj: 'maman ajoute' },
  papamaman: { label: 'Papa et maman', de: 'de papa et maman', a: 'à papa et maman', aj: 'papa et maman ajoutent' }
};
const DICE = {
  prudent: { name: 'Prudent', faces: [-0.5, 0, 0, 0.5, 0.5, 1], txt: 'Petites variations, rarement des pertes.' },
  equilibre: { name: 'Équilibré', faces: [-1, -0.5, 0, 0.5, 1, 1.5], txt: 'Des hauts et des bas, comme un vrai placement.' },
  aventurier: { name: 'Aventurier', faces: [-3, -2, 0, 1, 2, 3.5], txt: 'Ça secoue fort, pour les plus grands.' }
};
const CAPS = [20, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000];
const PIPS = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]], 6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]] };
const LOGO = `<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 40v6a22 14 0 0 0 44 0v-6z" fill="#d99a0b" stroke="#a87300" stroke-width="3" stroke-linejoin="round"/><ellipse cx="32" cy="40" rx="22" ry="14" fill="#f5b323" stroke="#a87300" stroke-width="3"/><ellipse cx="32" cy="40" rx="14" ry="8.5" fill="none" stroke="#ffe08a" stroke-width="2.5"/><path d="M32 40V16" stroke="#0b7440" stroke-width="4" stroke-linecap="round"/><path d="M32 24C25 14 15 14 12 18c4 7 13 9 20 6z" fill="#2fc275"/><path d="M32 20c6-10 16-11 19-7-3 7-12 10-19 7z" fill="#13a05a"/><path d="M15 48a22 14 0 0 0 7 4" stroke="#fff3c4" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`;
const I = {
  jar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2.5" width="8" height="3" rx="1"/><path d="M6.5 7.5c0-1.1.9-2 2-2h7c1.1 0 2 .9 2 2V19a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 6.5 19z"/><path d="M6.5 13.5h11"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>',
  die: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20h16"/><path d="M7 16v-3M12 16V9M17 16V5"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="M9 7.5h6M9 11h6"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v7a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-7M12 8.5V21"/><path d="M12 8.5C10 4 6.5 4.5 7.5 7c.5 1.2 2.5 1.5 4.5 1.5zM12 8.5c2-4.5 5.5-4 4.5-1.5-.5 1.2-2.5 1.5-4.5 1.5z"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>',
  sprout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-9"/><path d="M12 12C12 7 8 5 4 5c0 5 4 7 8 7zM12 10c0-4 3-6 8-6 0 4-3 6-8 6z"/></svg>'
};

/* ---------- état ---------- */
let user, auth, fdb;
let F = null, famLoaded = false, famServer = false, lastF = '';
const EV = {}, GOAL = {}, KL = {}, lastK = {}, kidUnsubs = {};
let goalEdit = false, goalDropArm = false, resetFor = null;
let famUnsub = null, ready = false, status = '', offlineTimer = null;
let view = 'home', cur = null, lock = null, pinOk = false, pinBuf = '', pinBad = false;
let tray = 0, inv = 0, dep = 0, rolling = false;
let toast = null, toastT = null, undoArm = false, wipeArm = false, delArm = null;
const projInv = {}, sel = {};
const form = { resetname: '', goalname: '', goalbudget: '', gamount: '', gfrom: '', plabel: '', pamount: '', pkid: '', email: '', pass: '', newpin: '' };
let loginMode = 'in', loginMsg = '', loginErr = '', busy = false;
let ob = null;
try { lock = localStorage.getItem('pepite-lock'); cur = localStorage.getItem('pepite-cur'); } catch (e) {}

const kids = () => (F && F.kids) || [];
const kidOf = id => kids().find(k => k.id === id);
const P = () => PAR[(F && F.parents) || 'parents'] || PAR.parents;
const evs = id => EV[id] || [];
const mean = () => F.dice.reduce((a, b) => a + b, 0) / 6;
const gm = () => (typeof F.giftMatch === 'number' ? F.giftMatch : 10);
function ensureCur() {
  if (lock && !kidOf(lock)) { lock = null; try { localStorage.removeItem('pepite-lock'); } catch (e) {} }
  if (lock) cur = lock;
  if (!kidOf(cur)) cur = kids()[0] ? kids()[0].id : null;
}
function resetCoins() { const k = kidOf(cur); tray = k ? k.weekly : 0; inv = 0; dep = 0; }
function say(msg, sub) { toast = { msg, sub }; clearTimeout(toastT); toastT = setTimeout(() => { toast = null; render(); }, 4500); }

function tot(id) {
  const t = { own: 0, bonus: 0, gains: 0, out: 0, pig: 0, vire: 0, fromL: 0, paie: null, bourse: null, pays: [], rolls: [] };
  for (const e of evs(id)) {
    if (e.t === 'paie' || e.t === 'recu') { t.own += e.inv; t.bonus += e.bonus; t.pig += e.dep; if (e.t === 'paie') { t.paie = e.d; t.pays.push(e.inv); } }
    else if (e.t === 'bourse') { t.gains += e.gain; t.bourse = e; t.rolls.push(e); }
    else if (e.t === 'projet') { t.out += e.amount; t.fromL += (e.fromLivret ?? e.amount); }
    else if (e.t === 'vire') { t.vire += e.amount; }
  }
  t.total = r2(t.own + t.bonus + t.gains - t.out);
  t.livret = r2(t.vire - t.fromL); t.due = r2(t.total - t.livret);
  return t;
}
const goalOf = id => GOAL[id] || null;
const MS = [0.25, 0.5, 0.75, 1];
function eta(id, perWeek) {
  const g = goalOf(id), t = tot(id); if (!g) return null; if (t.total >= g.budget) return 0;
  const m = mean() / 100, match = F.match / 100; let x = Math.max(0, t.total);
  for (let w = 1; w <= 520; w++) { x += x * m + perWeek * (1 + match); if (x >= g.budget) return w; }
  return null;
}
const avgInv = id => { const p = tot(id).pays.slice(-8); return p.length ? p.reduce((a, b) => a + b, 0) / p.length : kidOf(id).weekly; };
const etaTxt = w => w === null ? null : w <= 1 ? 'dès la semaine prochaine' : `dans ${w} semaines, vers ${new Date(Date.now() + w * 7 * 864e5).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
function milestone(before, after) {
  const g = goalOf(cur); if (!g) return '';
  const b = before / g.budget, a = after / g.budget;
  for (const m of [1, 0.75, 0.5, 0.25]) if (b < m && a >= m) return m === 1 ? `Objectif « ${esc(g.name)} » atteint !` : `Palier ${m * 100} % atteint pour « ${esc(g.name)} » !`;
  return '';
}
function sayMs(before, msg, sub) { const ms = milestone(before, tot(cur).total); if (ms) say(ms, msg); else say(msg, sub); }
function project(id, perWeek) {
  const k = kidOf(id), t = tot(id), m = mean() / 100, match = F.match / 100, now = new Date(), birth = new Date(k.birth + 'T12:00:00');
  let own = t.own, bonus = t.bonus, gains = t.gains, w = 0; const pts = [];
  for (let a = ageAt(k.birth, now) + 1; a <= 18; a++) {
    const bd = new Date(birth); bd.setFullYear(birth.getFullYear() + a);
    const target = Math.max(0, Math.round((bd - now) / (7 * 864e5)));
    while (w < target) { gains += Math.max(0, own + bonus + gains - t.out) * m; own += perWeek; bonus += perWeek * match; w++; }
    pts.push({ age: a, own, bonus, gains, total: Math.max(0, own + bonus + gains - t.out) });
  }
  return pts;
}

/* ---------- dessins ---------- */
function die(n, size) { return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Dé : ${n}"><rect x="6" y="9" width="88" height="88" rx="22" fill="#d9d3e6"/><rect x="6" y="4" width="88" height="88" rx="22" fill="#fff" stroke="#22203a" stroke-width="5"/>${PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y - 2}" r="9" fill="#22203a"/>`).join('')}</svg>`; }
function jar(t, g) {
  const cap = g ? Math.max(g.budget, t.total) : t.total <= 0 ? 20 : (CAPS.find(c => c >= t.total) || Math.ceil(t.total / 10000) * 10000);
  const pos = t.own + t.bonus + Math.max(0, t.gains), k = pos > 0 ? Math.max(0, t.total) / pos : 0, H = 196;
  const h = [t.own * k / cap * H, t.bonus * k / cap * H, Math.max(0, t.gains) * k / cap * H];
  const fills = ['var(--kid)', 'var(--gold)', 'var(--grow)'];
  let y = 266, layers = '';
  h.forEach((v, i) => { y -= v; layers += `<rect x="16" y="${y.toFixed(1)}" width="188" height="${v.toFixed(1)}" style="fill:${fills[i]}"/>`; });
  const svg = `<svg class="jar" viewBox="0 0 220 290" role="img" aria-label="Bocal rempli à ${Math.round((266 - y) / H * 100)} %">
<defs><clipPath id="jc"><rect x="22" y="56" width="176" height="214" rx="40"/></clipPath>
<pattern id="pc" width="26" height="18" patternUnits="userSpaceOnUse"><circle cx="13" cy="9" r="7" fill="#fff" fill-opacity=".2"/></pattern></defs>
<ellipse cx="110" cy="278" rx="80" ry="8" fill="#000" fill-opacity=".08"/>
<rect x="22" y="56" width="176" height="214" rx="40" style="fill:var(--glass)"/>
<g clip-path="url(#jc)">${layers}<rect x="16" y="${y.toFixed(1)}" width="188" height="${(266 - y).toFixed(1)}" fill="url(#pc)"/></g>
<line x1="34" x2="186" y1="70" y2="70" stroke-dasharray="7 7" style="stroke:var(--soft)" stroke-width="2.5" stroke-linecap="round"/>
<rect x="38" y="84" width="14" height="140" rx="7" fill="#fff" fill-opacity=".55"/>${g ? [0.25, 0.5, 0.75].map(m => { const yy = (266 - m * g.budget / cap * H).toFixed(1); return `<line x1="168" x2="192" y1="${yy}" y2="${yy}" style="stroke:var(--ink)" stroke-width="4" stroke-linecap="round"/>`; }).join('') : ''}
<rect x="22" y="56" width="176" height="214" rx="40" fill="none" style="stroke:var(--ink)" stroke-width="6"/>
<rect x="52" y="20" width="116" height="38" rx="12" style="fill:var(--kid);stroke:var(--ink)" stroke-width="6"/>
<rect x="64" y="28" width="40" height="7" rx="3.5" fill="#fff" fill-opacity=".45"/></svg>`;
  return { cap, svg };
}

/* ---------- vues ---------- */
function splash(msg) { return `<div class="splash"><div>${LOGO}<h1 style="font-size:40px;margin-top:8px">Pépite</h1><p class="soft">${esc(msg || 'L’argent de poche qui pousse')}</p></div></div>`; }

function loginView() {
  const up = loginMode === 'up';
  return `<main class="view full"><div class="welcome">${LOGO}<h1>Pépite</h1><p>L’argent de poche qui pousse</p></div>
<div class="tabs2"><button data-act="lmode" data-m="in" aria-pressed="${!up}">J’ai un compte</button><button data-act="lmode" data-m="up" aria-pressed="${up}">Créer un compte</button></div>
<form class="card" id="loginf" autocomplete="on">
<h3>${up ? 'Créer le compte de la famille' : 'Connexion de cet appareil'}</h3>
<label>E-mail d’un parent<input id="l-email" type="email" autocomplete="username" data-f="email" value="${esc(form.email)}" required></label>
<label>Mot de passe${up ? ' (6 caractères minimum)' : ''}<input id="l-pass" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" data-f="pass" value="${esc(form.pass)}" required minlength="6"></label>
${loginErr ? `<p class="neg" style="margin:10px 0 0;font-weight:700">${esc(loginErr)}</p>` : ''}${loginMsg ? `<div class="msg">${esc(loginMsg)}</div>` : ''}
<div class="row"><button class="btn full" type="submit" ${busy ? 'disabled' : ''}>${up ? 'Créer le compte' : 'Se connecter'}</button></div>
${up ? '' : '<button class="link" type="button" data-act="reset">Mot de passe oublié ?</button>'}
<p class="soft small" style="margin:8px 0 0">Un seul compte pour toute la famille : un parent se connecte une fois sur chaque appareil.</p></form></main>`;
}

function newOb() { return { step: 1, parents: 'parents', kids: [{ id: uid6(), name: '', birth: '', weekly: '', color: PAL[0] }], match: 25, giftMatch: 10, dice: 'equilibre', pin: '', legacy: null, err: '' }; }
function obView() {
  const o = ob, st = `<div class="steps">${[1, 2, 3].map(i => `<i class="${i <= o.step ? 'on' : ''}"></i>`).join('')}</div>`;
  let body = '';
  if (o.step === 1) {
    body = `<div class="welcome">${LOGO}<h1>Bienvenue !</h1><p>Pépite apprend aux enfants à épargner et à investir, en jouant.</p></div>${st}
<div class="why"><div>${I.coin}<span>Chaque semaine, une paie en pièces : on dépense ou on fait pousser.</span></div>
<div>${I.die}<span>L’argent placé reçoit un bonus, puis la bourse de la semaine le fait monter ou baisser.</span></div>
<div>${I.chart}<span>On voit son trésor grandir jusqu’à ses 18 ans.</span></div></div>
<div class="card"><h3>Comment vos enfants vous appellent-ils ?</h3><p class="soft small" style="margin:0">C’est le nom utilisé dans l’appli, par exemple « le bonus de papa ».</p>
<div class="pills">${Object.entries(PAR).map(([k, v]) => `<button class="pill" data-act="obpar" data-k="${k}" aria-pressed="${o.parents === k}">${v.label}</button>`).join('')}</div></div>
${o.legacy ? '<div class="msg">Les données déjà saisies pour vos enfants seront reprises.</div>' : ''}`;
  } else if (o.step === 2) {
    body = `${st}<h2 class="title">Vos enfants</h2><p class="lead">Chacun aura son bocal, sa couleur et son argent de poche.</p>
${o.kids.map((k, i) => `<div class="kidform"><header><h3>Enfant ${i + 1}</h3>${o.kids.length > 1 ? `<button class="link" data-act="obdel" data-k="${k.id}">Retirer</button>` : ''}</header>
<label>Prénom<input id="ob-n-${k.id}" type="text" autocomplete="off" maxlength="20" data-ob="name:${k.id}" value="${esc(k.name)}"></label>
<div class="grid2"><label>Date de naissance<input id="ob-b-${k.id}" type="date" data-ob="birth:${k.id}" value="${esc(k.birth)}"></label>
<label>Argent de poche par semaine (€)<input id="ob-w-${k.id}" type="number" inputmode="numeric" min="1" max="50" data-ob="weekly:${k.id}" value="${esc(k.weekly)}" placeholder="${suggest(k.birth)}"></label></div>
<label>Sa couleur</label><div class="swatches">${PAL.map(c => `<button class="sw" style="--c:${c}" data-act="obcolor" data-k="${k.id}" data-c="${c}" aria-pressed="${k.color === c}" aria-label="Couleur"></button>`).join('')}</div></div>`).join('')}
<div class="row"><button class="btn ghost full" data-act="obadd">Ajouter un enfant</button></div>
<p class="soft small" style="margin:10px 4px 0">Repère courant : 0,50 € à 1 € par semaine et par année d’âge.</p>`;
  } else {
    body = `${st}<h2 class="title">Les règles du jeu</h2><p class="lead">Tout reste modifiable plus tard dans l’espace parents.</p>
<div class="card"><h3>Bonus sur l’argent de poche placé</h3><p class="soft small" style="margin:0">Ce que vous ajoutez quand l’enfant fait pousser une pièce.</p>
<div class="pills">${[10, 25, 50].map(n => `<button class="pill" data-act="obmatch" data-n="${n}" aria-pressed="${o.match === n}">${n} %</button>`).join('')}</div></div>
<div class="card"><h3>Bonus sur l’argent reçu</h3><p class="soft small" style="margin:0">Cadeaux, anniversaires, petits services.</p>
<div class="pills">${[0, 10, 25].map(n => `<button class="pill" data-act="obgift" data-n="${n}" aria-pressed="${o.giftMatch === n}">${n ? n + ' %' : 'Aucun'}</button>`).join('')}</div></div>
<div class="card"><h3>Le dé de la bourse</h3><p class="soft small" style="margin:0">Lancé une fois par semaine. Tous rapportent en moyenne +0,25 % par semaine, seul le risque change.</p>
<div class="preset">${Object.entries(DICE).map(([k, d]) => `<button data-act="obdice" data-n="${k}" aria-pressed="${o.dice === k}"><b>${d.name}</b><span>${d.faces.map(pct).join(' · ')}<br>${d.txt}</span></button>`).join('')}</div></div>
<div class="card"><h3>Où va l’argent placé ?</h3><p class="soft small" style="margin:0">L’appli tient les comptes, mais l’argent doit exister en vrai. Quand vous le voulez, mettez de côté ce que l’appli indique (Livret A au nom de l’enfant, compte épargne ou tirelire fermée) : l’espace parents vous dit combien, et vous n’aurez pas de surprise le jour d’un projet.</p></div>
<div class="card"><h3>Code parents</h3><p class="soft small" style="margin:0">4 chiffres pour ouvrir l’espace parents sur l’appareil d’un enfant.</p>
<label>Code à 4 chiffres<input id="ob-pin" class="secret" type="text" inputmode="numeric" autocomplete="off" maxlength="4" data-ob="pin" value="${esc(o.pin)}"></label></div>`;
  }
  return `<main class="view full">${body}${o.err ? `<p class="neg" style="font-weight:800;margin:14px 4px 0">${esc(o.err)}</p>` : ''}
<div class="row">${o.step > 1 ? '<button class="btn ghost" data-act="obprev">Retour</button>' : ''}<button class="btn" data-act="${o.step < 3 ? 'obnext' : 'obfinish'}" ${busy ? 'disabled' : ''}>${o.step < 3 ? 'Continuer' : 'C’est parti !'}</button></div></main>`;
}

function topbar() {
  const av = lock ? '' : kids().map(k => `<button class="av" style="--c:${k.color}" data-act="kid" data-k="${k.id}" aria-pressed="${k.id === cur}" aria-label="${esc(k.name)}">${esc(k.name.slice(0, 1).toUpperCase())}</button>`).join('');
  return `<header class="topbar"><div class="brand">${LOGO}<span>Pépite</span></div>${kids().length > 1 ? av : ''}<button class="iconbtn" data-act="go" data-v="parents" aria-label="Espace parents">${I.gear}</button></header>`;
}
function tabbar() {
  const tabs = [['home', 'Bocal', I.jar], ['paie', 'Paie', I.coin], ['bourse', 'Bourse', I.die], ['projet', 'Projet', I.flag], ['futur', 'Futur', I.chart]];
  return `<nav class="tabbar" aria-label="Navigation"><div>${tabs.map(([v, l, ic]) => `<button class="tab" data-act="go" data-v="${v}" ${view === v ? 'aria-current="page"' : ''}>${ic}${l}</button>`).join('')}</div></nav>`;
}

function homeView(k, t) {
  const g = goalOf(cur), J = jar(t, g), paid = sameWeek(t.paie), rolled = sameWeek(t.bourse && t.bourse.d);
  const prog = Math.min(100, Math.max(0, t.total / (g ? g.budget : J.cap) * 100));
  const hint = g ? (t.total >= g.budget ? `Objectif « ${esc(g.name)} » atteint !` : `Encore ${f(g.budget - t.total)} pour « ${esc(g.name)} »`) : (t.total >= J.cap ? `Palier de ${f(J.cap)} atteint !` : `Encore ${f(J.cap - t.total)} pour le palier de ${f(J.cap)}`);
  return `<section class="hero"><div><p class="hi">Salut ${esc(k.name)} !</p><p class="lbl">Dans ton bocal</p><div class="amount">${f(t.total)}</div>
<div class="prog">${g ? '<b style="left:25%"></b><b style="left:50%"></b><b style="left:75%"></b>' : ''}<i style="width:${prog.toFixed(1)}%"></i></div><p class="small">${hint}</p></div>${J.svg}</section>
<div class="tiles"><div class="tile"><small><i style="background:var(--kid)"></i>Mon argent</small><b>${f(t.own)}</b></div>
<div class="tile"><small><i style="background:var(--gold)"></i>Bonus ${P().de}</small><b>${f(t.bonus)}</b></div>
<div class="tile"><small><i style="background:var(--grow)"></i>Gagné tout seul</small><b class="${t.gains < 0 ? 'neg' : 'g'}">${f(t.gains)}</b></div>
<div class="tile"><small><i style="background:var(--line)"></i>Ma tirelire</small><b>${f(t.pig)}</b></div></div>
${t.out > 0 ? `<p class="soft small" style="margin:8px 4px 0">Projets réalisés : ${f(t.out)}</p>` : ''}
<h3 class="sec">Mon projet</h3><div class="list"><button class="item" data-act="go" data-v="projet"><span class="ic" style="background:var(--kidt);color:var(--kidtxt)">${I.flag}</span><span>${g ? `<b>${esc(g.name)} : ${Math.floor(Math.min(1, Math.max(0, t.total) / g.budget) * 100)} %</b><small>${t.total >= g.budget ? 'Atteint : prépare ta présentation !' : `${f(Math.max(0, t.total))} sur ${f(g.budget)}`}</small>` : '<b>Choisis un projet</b><small>Un vélo, un jeu ? Fixe-toi un objectif.</small>'}</span><span class="end">${I.chev}</span></button></div>
<h3 class="sec">Cette semaine</h3><div class="list">
<button class="item" data-act="go" data-v="paie"><span class="ic" style="background:#fff3c4;color:#a87300">${I.coin}</span><span><b>Ma paie</b><small>${paid ? 'Rangée, bravo !' : `${k.weekly} pièce${k.weekly > 1 ? 's' : ''} t’attendent`}</small></span><span class="end ${paid ? 'done' : ''}">${paid ? I.check : I.chev}</span></button>
<button class="item" data-act="go" data-v="bourse"><span class="ic" style="background:var(--glass)">${I.die}</span><span><b>La bourse</b><small>${rolled ? `Dé ${t.bourse.face} : ${pct(t.bourse.rate)}` : 'Lance le dé de la semaine'}</small></span><span class="end ${rolled ? 'done' : ''}">${rolled ? I.check : I.chev}</span></button>
<button class="item" data-act="go" data-v="recu"><span class="ic" style="background:color-mix(in srgb,var(--grow) 14%,transparent);color:var(--grow)">${I.gift}</span><span><b>J’ai reçu de l’argent</b><small>Un cadeau, un anniversaire ?</small></span><span class="end">${I.chev}</span></button>
<button class="item" data-act="go" data-v="carnet"><span class="ic" style="background:var(--glass)">${I.book}</span><span><b>Mon carnet</b><small>Tout ce qui est entré et sorti</small></span><span class="end">${I.chev}</span></button></div>`;
}

function payView(k, t) {
  const blocked = !!lock && sameWeek(t.paie), since = t.paie ? daysSince(t.paie) : null, bonusNow = r2(inv * F.match / 100), dis = ready ? '' : 'disabled';
  const coin = (act) => `<button class="coin" data-act="${act}" aria-label="Reprendre cette pièce" ${dis}>1&nbsp;€</button>`;
  return `<h2 class="title">Jour de paie</h2><p class="lead">${k.weekly} pièce${k.weekly > 1 ? 's' : ''} de 1 €. Range chacune : tu la dépenses, ou tu la fais pousser et ${P().aj} ${String(F.match).replace('.', ',')} %.</p>
<section class="card">${blocked ? `<p class="result" style="text-align:center">Ta paie de la semaine est rangée.<br><span class="soft" style="font-size:17px">Rendez-vous lundi !</span></p>` : `
${since !== null && since < 5 ? `<p class="msg" style="margin-top:0">Déjà payée il y a ${since === 0 ? 'moins d’un jour' : since + ' jour' + (since > 1 ? 's' : '')}.</p>` : ''}
<div class="tray" aria-label="Pièces à ranger">${Array.from({ length: tray }, () => '<span class="coin">1&nbsp;€</span>').join('') || '<span class="soft">Toutes les pièces sont rangées !</span>'}</div>
<div class="moves"><button class="btn ghost" data-act="toPig" ${tray && ready ? '' : 'disabled'}>Dans ma tirelire</button><button class="btn gr" data-act="toGrow" ${tray && ready ? '' : 'disabled'}>À faire pousser</button></div>
<div class="zones"><div class="zone"><strong>Ma tirelire : ${f(dep)}</strong>${Array.from({ length: dep }, () => coin('backPig')).join('')}</div>
<div class="zone gz"><strong class="g">Je fais pousser : ${f(inv)}</strong>${Array.from({ length: inv }, () => coin('backGrow')).join('')}${inv ? `<span class="chip">+${f(bonusNow)}</span>` : ''}</div></div>
<div class="row"><button class="btn full" data-act="pay" ${tray === 0 && ready ? '' : 'disabled'}>${tray ? `Encore ${tray} pièce${tray > 1 ? 's' : ''} à ranger` : 'Valider ma paie'}</button></div>
<p class="soft small" style="margin:6px 0 0;text-align:center">Touche une pièce rangée pour la reprendre.</p>`}</section>`;
}

function giftView(k) {
  const dis = ready ? '' : 'disabled';
  return `<h2 class="title">J’ai reçu de l’argent</h2><p class="lead">Ajoute-le quand tu veux${gm() > 0 ? `. Ce que tu fais pousser reçoit un bonus ${P().de} de ${String(gm()).replace('.', ',')} %` : ''}.</p>
<section class="card"><div class="grid2"><label>Combien (€)<input id="g-amount" type="text" inputmode="decimal" autocomplete="off" data-f="gamount" value="${esc(form.gamount)}" placeholder="Ex. : 10"></label>
<label>De qui ?<input id="g-from" type="text" autocomplete="off" maxlength="40" data-f="gfrom" value="${esc(form.gfrom)}" placeholder="Mamie, un anniversaire…"></label></div>
<div class="list" style="margin-top:16px"><button class="btn ghost" data-act="gift" data-r="0" ${dis}>Tout dans ma tirelire</button><button class="btn gold" data-act="gift" data-r="0.5" ${dis}>Moitié-moitié</button><button class="btn gr" data-act="gift" data-r="1" ${dis}>Tout faire pousser</button></div></section>`;
}

function bourseView(k, t) {
  const rolled = sameWeek(t.bourse && t.bourse.d), dn = DICE[F.diceName] ? DICE[F.diceName].name : 'Personnalisé';
  const recent = t.rolls.slice(-8).reverse();
  return `<h2 class="title">La bourse de la semaine</h2><p class="lead">Comme à la vraie Bourse : parfois ton bocal baisse, mais en moyenne il monte.</p>
<section class="card dicebox"><div id="die">${die(rolled ? t.bourse.face : 6, 132)}</div>
${rolled ? `<p class="result">Dé ${t.bourse.face} : ${t.bourse.rate < 0 ? 'semaine difficile' : t.bourse.rate === 0 ? 'semaine calme' : 'belle semaine'} !</p><p style="margin:0">Ton bocal a ${t.bourse.gain < 0 ? 'perdu' : 'gagné'} <b class="${t.bourse.gain < 0 ? 'neg' : 'g'}">${f(Math.abs(t.bourse.gain))}</b>. Prochain lancer lundi.</p>`
    : t.total > 0 ? `<button class="btn full" data-act="roll" ${ready ? '' : 'disabled'}>Lancer le dé</button>` : `<p style="margin:0">Fais d’abord pousser quelques pièces : le dé agit sur ce qu’il y a dans ton bocal.</p>`}
</section>
<section class="card"><h3>Ton dé : ${dn}</h3><div class="faces">${F.dice.map((r, i) => `<div>${die(i + 1, 38)}<span class="${r < 0 ? 'neg' : r > 0 ? 'g' : ''}">${pct(r)}</span></div>`).join('')}</div>
${recent.length ? `<p class="soft small" style="margin:14px 0 0">Tes derniers lancers</p><div class="recent">${recent.map(e => `<span class="${e.rate < 0 ? 'neg' : e.rate > 0 ? 'g' : ''}">${pct(e.rate)}</span>`).join('')}</div>` : ''}</section>`;
}

function futurView(k, t) {
  if (projInv[cur] === undefined) { const p = t.pays.slice(-8); projInv[cur] = p.length ? Math.round(p.reduce((a, b) => a + b, 0) / p.length) : k.weekly; }
  projInv[cur] = Math.min(projInv[cur], k.weekly);
  const pts = project(cur, projInv[cur]);
  if (!pts.length) return `<h2 class="title">Ton futur</h2><section class="card"><p>Tu as 18 ans : le trésor est à toi !</p></section>`;
  if (!pts.some(p => p.age === sel[cur])) sel[cur] = pts[pts.length - 1].age;
  const max = Math.max(1, ...pts.map(p => p.total)), Pt = pts.find(p => p.age === sel[cur]);
  const bars = pts.map(p => { const pos = p.own + p.bonus + Math.max(0, p.gains) || 1, s = v => (Math.max(0, v) / pos * 100).toFixed(2);
    return `<button class="bar ${p.age === sel[cur] ? 'on' : ''}" data-act="bar" data-age="${p.age}" aria-label="À ${p.age} ans : ${f(p.total)}"><span class="area"><span class="stk" style="height:${(p.total / max * 100).toFixed(2)}%"><i style="height:${s(p.own)}%;background:var(--kid)"></i><i style="height:${s(p.bonus)}%;background:var(--gold)"></i><i style="height:${s(p.gains)}%;background:var(--grow)"></i></span></span><span class="age">${p.age}</span></button>`; }).join('');
  const full = projInv[cur] < k.weekly ? project(cur, k.weekly).find(p => p.age === sel[cur]) : null;
  return `<h2 class="title">Et si tu continuais jusqu’à 18 ans ?</h2><p class="lead">Touche une barre pour voir ton trésor à cet âge.</p>
<section class="card"><div class="step">Je fais pousser <button data-act="pm" aria-label="Moins">−</button><span class="n">${projInv[cur]} €</span><button data-act="pp" aria-label="Plus">+</button> par semaine</div>
<div class="bars" style="grid-template-columns:repeat(${pts.length},minmax(0,1fr))">${bars}</div>
<p class="cap">À <b>${Pt.age} ans</b>, ton bocal contiendrait <b>${f(Pt.total)}</b> : ${f(Pt.own)} de ton argent, ${f(Pt.bonus)} de bonus ${P().de} et <b class="g">${f(Math.max(0, Pt.gains))} gagnés tout seuls</b>.</p>
<p class="soft" style="margin:0">Regarde le vert : plus tu attends, plus il grossit vite, parce que ce que ton argent a gagné se met à gagner lui aussi.${full ? ` En faisant pousser tes ${k.weekly} € chaque semaine, tu aurais ${f(full.total)} à ${full.age} ans.` : ''}</p>
<p class="soft small" style="margin:8px 0 0">Calcul fait avec la moyenne du dé (${pct(r2(mean()))} par semaine). Le vrai résultat dépendra de tes lancers.</p></section>`;
}

function projetView(k, t) {
  const g = goalOf(cur), done = evs(cur).filter(e => e.t === 'projet').reverse(), dis = ready ? '' : 'disabled';
  const doneHtml = done.length ? `<section class="card"><h3>Mes projets réalisés</h3><ul class="log">${done.map(e => `<li><time>${dateFr(e.d)}</time><span>${esc(e.label)}</span><b>${f(e.amount)}</b></li>`).join('')}</ul></section>` : '';
  if (!g || goalEdit) {
    return `<h2 class="title">${g ? 'Modifier mon projet' : 'Mon projet'}</h2><p class="lead">Un vélo, un jeu, une sortie ? Fixe-toi un objectif et regarde-toi avancer, palier après palier.</p>
<section class="card"><label>Mon projet<input id="go-name" type="text" autocomplete="off" maxlength="30" data-f="goalname" value="${esc(form.goalname)}" placeholder="Ex. : un vélo"></label>
<div class="pills">${['Vélo', 'Trottinette', 'Jeu vidéo', 'Livres', 'Sortie', 'Cadeau'].map(n => `<button class="pill" data-act="goalpick" data-n="${n}" aria-pressed="${form.goalname === n}">${n}</button>`).join('')}</div>
<label>Combien ça coûte ? (€)<input id="go-budget" type="text" inputmode="decimal" autocomplete="off" data-f="goalbudget" value="${esc(form.goalbudget)}" placeholder="Ex. : 150"></label>
<div class="row">${g ? '<button class="btn ghost" data-act="goalcancel">Annuler</button>' : ''}<button class="btn" data-act="goalset" ${dis}>${g ? 'Enregistrer' : 'Créer mon projet'}</button></div></section>${doneHtml}`;
  }
  const have = Math.max(0, t.total), p = Math.min(1, have / g.budget), reached = have >= g.budget;
  const w1 = eta(cur, avgInv(cur)), wAll = eta(cur, k.weekly);
  const flags = MS.map(m => `<span class="flag ${p >= m ? 'on' : ''}" style="left:${m * 100}%">${p >= m ? I.check : ''}</span><span class="flagl" style="left:${m * 100}%">${m === 1 ? esc(g.name) : m * 100 + ' %'}</span>`).join('');
  return `<h2 class="title">Mon projet</h2>
<section class="card goal"><p class="lbl" style="margin:0">Objectif</p><h3 class="gname">${esc(g.name)}</h3>
<div class="gnum"><span class="amount">${Math.floor(p * 100)} %</span><span>${f(have)} sur ${f(g.budget)}</span></div>
<div class="track"><div class="road"><i style="width:${(p * 100).toFixed(1)}%"></i></div>${flags}<span class="me" style="left:${(p * 100).toFixed(1)}%">${esc(k.name.slice(0, 1).toUpperCase())}</span></div>
${reached ? '' : `<p style="margin:6px 0 0">Il te manque <b>${f(g.budget - have)}</b>.${etaTxt(w1) ? ` Si tu continues comme ça, tu l’auras ${etaTxt(w1)}.` : ' Fais pousser un peu chaque semaine pour avancer.'}</p>${wAll !== null && w1 !== null && wAll < w1 ? `<p class="soft small" style="margin:6px 0 0">En faisant pousser toute ta paie : ${etaTxt(wAll)}.</p>` : ''}`}</section>
${reached ? `<section class="card celebrate"><h3>Objectif atteint, bravo !</h3><p style="margin:0">Prépare ta présentation ${P().a} : pourquoi tu le veux, combien il coûte, ce qu’il va t’apporter. S’ils sont convaincus, ils débloqueront ton argent.</p></section>` : ''}
<section class="card"><h3>Les paliers</h3><ul class="log">${MS.map(m => { const v = r2(g.budget * m), ok = have >= v; return `<li><span class="${ok ? 'g' : 'soft'}" style="width:26px;flex:none">${ok ? I.check : '○'}</span><span>${m === 1 ? 'Objectif complet' : 'Palier ' + m * 100 + ' %'} : ${f(v)}</span><b class="${ok ? 'g' : 'soft'}">${ok ? 'atteint' : 'encore ' + f(v - have)}</b></li>`; }).join('')}</ul></section>
<div class="row"><button class="btn ghost sm" data-act="goaledit">Modifier</button><button class="btn ghost sm" data-act="goaldrop">${goalDropArm ? 'Confirmer l’abandon' : 'Abandonner ce projet'}</button></div>${doneHtml}`;
}

function carnetView(k) {
  const ev = evs(cur).slice(-40).reverse().map(e => {
    if (e.t === 'paie') return `<li><time>${dateFr(e.d)}</time><span>Paie : ${f(e.inv)} placés, ${f(e.dep)} dans la tirelire</span><b class="g">+${f(e.inv + e.bonus)}</b></li>`;
    if (e.t === 'recu') return `<li><time>${dateFr(e.d)}</time><span>Reçu${e.from ? ' de ' + esc(e.from) : ''} : ${f(e.inv)} placés, ${f(e.dep)} dans la tirelire</span><b class="g">+${f(e.inv + e.bonus)}</b></li>`;
    if (e.t === 'bourse') return `<li><time>${dateFr(e.d)}</time><span>Bourse : dé ${e.face} (${pct(e.rate)})</span><b class="${e.gain < 0 ? 'neg' : 'g'}">${e.gain < 0 ? '−' : '+'}${f(Math.abs(e.gain))}</b></li>`;
    if (e.t === 'vire') return `<li><time>${dateFr(e.d)}</time><span>Mis en lieu sûr ${P().de}</span><b class="soft">${f(e.amount)}</b></li>`;
    return `<li><time>${dateFr(e.d)}</time><span>Projet : ${esc(e.label)}</span><b class="neg">−${f(e.amount)}</b></li>`;
  }).join('') || '<li class="soft">Rien encore : ta première paie arrive bientôt.</li>';
  return `<h2 class="title">Mon carnet</h2><p class="lead">Tout ce qui est entré et sorti de ton bocal.</p><section class="card"><ul class="log">${ev}</ul></section>`;
}

function pinView() {
  return `<section class="pin"><h2 class="title">Espace parents</h2><p class="lead">Tape le code parents.</p>
<div class="dots">${[0, 1, 2, 3].map(i => `<i class="${i < pinBuf.length ? 'on' : ''}"></i>`).join('')}</div>${pinBad ? '<p class="neg" style="margin:0;font-weight:800">Mauvais code</p>' : ''}
<div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="key" data-act="pin" data-n="${n}">${n}</button>`).join('')}<span></span><button class="key" data-act="pin" data-n="0">0</button><button class="key" data-act="pinback" style="font-size:16px">Effacer</button></div></section>`;
}

function parentsView() {
  if (lock && !pinOk) return pinView();
  const dis = ready ? '' : 'disabled', K = kidOf(cur), last = evs(cur)[evs(cur).length - 1];
  const lastTxt = last ? ({ paie: 'la paie du ', bourse: 'le lancer du ', recu: 'l’argent reçu le ', vire: 'le virement du ', projet: 'le projet du ' }[last.t] || '') + dateFr(last.d) : '';
  const pk = form.pkid && kidOf(form.pkid) ? form.pkid : cur;
  return `<h2 class="title">Espace parents</h2>
${lock ? `<div class="msg">Cet appareil est verrouillé sur ${esc(K.name)}.<div class="row" style="margin-top:8px"><button class="btn sm" data-act="unlockdev">Déverrouiller l’appareil</button></div></div>` : ''}
<section class="card"><h3>L’argent placé, en vrai</h3>
<p class="soft small" style="margin:0">Pépite tient les comptes, mais l’argent placé doit exister quelque part : sinon, le jour où un projet est débloqué, la somme n’est pas là. Mettez le montant « À mettre de côté » en lieu sûr (un Livret A au nom de l’enfant, un compte épargne ou une vraie tirelire fermée), puis touchez « C’est rangé ». Le compteur repart de zéro.</p>
${kids().map(k => { const T = tot(k.id); return `<div style="padding:12px 0;border-bottom:1px solid var(--line)"><b>${esc(k.name)}</b>
<p style="margin:2px 0 0">Déjà mis de côté : <b>${f(T.livret)}</b> · À mettre de côté : <b class="${T.due > 0 ? 'g' : ''}">${f(Math.max(0, T.due))}</b></p>
${T.due < 0 ? `<p class="soft small" style="margin:2px 0 0">Vous avez ${f(-T.due)} d’avance après de mauvaises semaines en bourse : rien à ajouter.</p>` : ''}
<div class="row" style="margin-top:8px"><button class="btn gr sm" data-act="vire" data-k="${k.id}" ${T.due > 0 && ready ? '' : 'disabled'}>C’est rangé (${f(Math.max(0, T.due))})</button></div></div>`; }).join('')}</section>
<section class="card"><h3>Débloquer pour un projet</h3>${kids().filter(k => goalOf(k.id)).map(k => { const g = goalOf(k.id), T = tot(k.id); return `<div class="msg" style="margin-top:6px">${esc(k.name)} vise « ${esc(g.name)} » : ${f(Math.max(0, T.total))} sur ${f(g.budget)}.<div class="row" style="margin-top:8px"><button class="btn gr sm" data-act="goalunlock" data-k="${k.id}" ${T.total >= g.budget && ready ? '' : 'disabled'}>${T.total >= g.budget ? `Débloquer ${f(g.budget)} pour « ${esc(g.name)} »` : 'Pas encore atteint'}</button></div></div>`; }).join('')}
<p class="soft small" style="margin:10px 0 0">Autre projet, ou montant différent :</p>
<label>Pour<select data-f="pkid">${kids().map(k => `<option value="${k.id}" ${k.id === pk ? 'selected' : ''}>${esc(k.name)} (${f(tot(k.id).total)})</option>`).join('')}</select></label>
<label>Le projet présenté<input id="p-label" type="text" autocomplete="off" maxlength="60" data-f="plabel" value="${esc(form.plabel)}" placeholder="Un vélo, un cadeau, une sortie…"></label>
<label>Montant (€)<input id="p-amount" type="text" inputmode="decimal" autocomplete="off" data-f="pamount" value="${esc(form.pamount)}"></label>
<div class="row"><button class="btn" data-act="project" ${dis}>Débloquer le montant</button></div></section>
<section class="card"><h3>Les enfants</h3>${kids().map(k => `<div class="kidform"><header><h3 style="font-size:19px">${esc(k.name)}</h3>${kids().length > 1 ? `<button class="link" data-act="kdel" data-k="${k.id}">${delArm === k.id ? 'Confirmer la suppression' : 'Supprimer'}</button>` : ''}</header>
<label>Prénom<input id="k-n-${k.id}" type="text" autocomplete="off" maxlength="20" value="${esc(k.name)}" data-set="kname:${k.id}"></label>
<div class="grid2"><label>Naissance<input id="k-b-${k.id}" type="date" value="${esc(k.birth)}" data-set="kbirth:${k.id}"></label>
<label>Par semaine (€)<input id="k-w-${k.id}" type="number" min="1" max="50" value="${k.weekly}" data-set="kweekly:${k.id}"></label></div>
<div class="swatches">${PAL.map(c => `<button class="sw" style="--c:${c}" data-act="kcolor" data-k="${k.id}" data-c="${c}" aria-pressed="${k.color === c}" aria-label="Couleur"></button>`).join('')}</div></div>`).join('')}
<div class="row"><button class="btn ghost full" data-act="kadd" ${dis}>Ajouter un enfant</button></div></section>
<section class="card"><h3>Les règles du jeu</h3>
<label>Les enfants vous appellent<select data-set="parents">${Object.entries(PAR).map(([k, v]) => `<option value="${k}" ${F.parents === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
<div class="grid2"><label>Bonus argent de poche (%)<input id="r-m" type="number" min="0" max="100" value="${F.match}" data-set="match"></label>
<label>Bonus argent reçu (%)<input id="r-g" type="number" min="0" max="100" value="${gm()}" data-set="giftMatch"></label></div>
<label>Le dé de la bourse</label><div class="pills">${Object.entries(DICE).map(([k, d]) => `<button class="pill" data-act="dicepreset" data-n="${k}" aria-pressed="${F.diceName === k}">${d.name}</button>`).join('')}</div>
<div class="grid2" style="grid-template-columns:repeat(3,minmax(0,1fr))">${F.dice.map((r, i) => `<label>Face ${i + 1}<input id="r-d${i}" type="number" step="0.5" min="-50" max="50" value="${r}" data-set="dice:${i}"></label>`).join('')}</div>
<p class="soft small" style="margin:8px 0 0">Moyenne : ${pct(r2(mean()))} par semaine.</p></section>
<section class="card"><h3>Mode enfant</h3><p class="soft small" style="margin:0">Verrouille cet appareil sur un enfant : plus d’accès aux autres bocaux ni à l’espace parents, une paie et un lancer par semaine.</p>
<label>Code parents (4 chiffres)<input id="r-pin" class="secret" type="text" inputmode="numeric" autocomplete="off" maxlength="4" value="${esc(form.newpin || F.pin || '')}" data-set="pin"></label>
<div class="row">${kids().map(k => `<button class="btn ghost sm" data-act="lock" data-k="${k.id}" ${/^\d{4}$/.test(F.pin || '') ? '' : 'disabled'}>Verrouiller sur ${esc(k.name)}</button>`).join('')}</div></section>
<section class="card"><h3>Corriger une erreur</h3>
${last ? `<div class="row" style="margin-top:4px"><button class="btn ghost sm" data-act="undo" ${dis}>${undoArm ? 'Confirmer : annuler ' + lastTxt : 'Annuler la dernière opération ' + de(K.name)}</button></div>
<div class="row"><button class="btn danger sm" data-act="resetopen" ${dis}>Vider le bocal et tout remettre à zéro pour ${esc(K.name)}</button></div>` : `<p class="soft">Rien à annuler pour ${esc(K.name)}.</p>`}</section>
<section class="card"><h3>Compte</h3><p class="soft small" style="margin:0">Connecté avec ${esc(user.email || '')}.</p><div class="row"><button class="btn ghost sm" data-act="logout">Déconnecter cet appareil</button></div></section>`;
}

function resetModal() {
  const k = kidOf(resetFor); if (!k) return '';
  const T = tot(k.id), g = goalOf(k.id), n = evs(k.id).length, okName = form.resetname.trim().toLowerCase() === k.name.toLowerCase();
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="rt"><div class="sheet">
<h3 id="rt">Tout remettre à zéro pour ${esc(k.name)} ?</h3>
<p style="margin:6px 0 0">Cette action efface définitivement :</p>
<ul style="margin:6px 0 0;padding-left:20px"><li>le bocal : <b>${f(Math.max(0, T.total))}</b></li><li>tout l’historique : <b>${n} opération${n > 1 ? 's' : ''}</b></li>${g ? `<li>le projet en cours : <b>${esc(g.name)}</b></li>` : ''}</ul>
${T.livret > 0 ? `<p class="msg">Vous avez déjà mis ${f(T.livret)} de côté pour ${esc(k.name)}. Cet argent existe toujours en vrai : décidez ce que vous en faites avant de remettre à zéro.</p>` : ''}
<label>Pour confirmer, tapez le prénom « ${esc(k.name)} »<input id="reset-name" type="text" autocomplete="off" data-f="resetname" value="${esc(form.resetname)}"></label>
<div class="row"><button class="btn ghost" data-act="resetclose">Annuler</button><button class="btn danger" data-act="resetdo" ${okName && ready ? '' : 'disabled'}>Tout remettre à zéro</button></div></div></div>`;
}

function mainView() {
  ensureCur();
  const k = kidOf(cur);
  if (!k) return splash('Aucun enfant');
  const t = tot(cur);
  const content = view === 'paie' ? payView(k, t) : view === 'recu' ? giftView(k) : view === 'bourse' ? bourseView(k, t) : view === 'futur' ? futurView(k, t) : view === 'carnet' ? carnetView(k) : view === 'projet' ? projetView(k, t) : view === 'parents' ? parentsView() : homeView(k, t);
  return `${topbar()}${status ? `<div style="padding:0 16px"><div class="status">${esc(status)}</div></div>` : ''}<main class="view">${content}</main>${tabbar()}${resetFor ? resetModal() : ''}${toast ? `<div class="toast" role="status">${toast.msg}${toast.sub ? `<small>${toast.sub}</small>` : ''}</div>` : ''}`;
}

function render() {
  if (rolling) return;
  let html, color = PAL[1];
  if (user === undefined) html = splash();
  else if (!user) html = loginView();
  else if (!famLoaded) html = splash('Ouverture de la banque…');
  else if (!F) { if (!ob) { ob = newOb(); tryLegacy(); } html = obView(); color = ob.step === 2 && ob.kids[0] ? ob.kids[0].color : PAL[1]; }
  else { html = mainView(); const k = kidOf(cur); if (k) color = k.color; }
  document.documentElement.style.setProperty('--kid', color);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', color);
  Idiomorph.morph(document.getElementById('app'), html, { morphStyle: 'innerHTML', ignoreActiveValue: true });
}

/* ---------- données ---------- */
const chains = {};
function queue(key, fn) { chains[key] = (chains[key] || Promise.resolve()).then(fn).catch(() => { status = 'Enregistrement impossible : vérifie ta connexion.'; render(); }); return chains[key]; }
function saveF() { const body = clone(F); lastF = JSON.stringify(body); return queue('F', () => setDoc(doc(fdb, 'familles', user.uid), body)); }
function saveK(id) { const body = { events: clone(evs(id)), goal: goalOf(id) ? clone(goalOf(id)) : null }; lastK[id] = JSON.stringify(body); return queue(id, () => setDoc(doc(fdb, 'familles', user.uid, 'enfants', id), body)); }
function updateReady() {
  const r = !!(F && famServer && kids().every(k => KL[k.id]));
  if (r !== ready) { ready = r; if (r) { status = ''; clearTimeout(offlineTimer); resetCoins(); } return true; }
  return false;
}
function syncKids() {
  const ids = kids().map(k => k.id);
  for (const id of ids) if (!kidUnsubs[id]) {
    kidUnsubs[id] = onSnapshot(doc(fdb, 'familles', user.uid, 'enfants', id), { includeMetadataChanges: true }, snap => {
      let ch = false;
      if (snap.exists()) { const d = snap.data(), body = { events: d.events || [], goal: d.goal || null }, s = JSON.stringify(body); if (s !== lastK[id]) { lastK[id] = s; EV[id] = clone(body.events); GOAL[id] = body.goal ? clone(body.goal) : null; ch = true; } }
      if (!snap.metadata.fromCache && !KL[id]) { KL[id] = true; ch = true; }
      if (updateReady()) ch = true;
      if (ch) render();
    }, () => { status = 'La banque ne répond plus : relance l’application.'; render(); });
  }
  for (const id of Object.keys(kidUnsubs)) if (!ids.includes(id)) { kidUnsubs[id](); delete kidUnsubs[id]; delete EV[id]; delete GOAL[id]; delete KL[id]; delete lastK[id]; }
}
function startSync() {
  stopSync();
  offlineTimer = setTimeout(() => { if (!ready) { status = 'Pas de connexion : tu peux regarder ton trésor, les actions reviendront avec Internet.'; render(); } }, 10000);
  famUnsub = onSnapshot(doc(fdb, 'familles', user.uid), { includeMetadataChanges: true }, snap => {
    let ch = false;
    if (snap.exists()) { const d = snap.data(), s = JSON.stringify(d); if (s !== lastF) { lastF = s; F = clone(d); syncKids(); ch = true; } }
    else if (!snap.metadata.fromCache && F) { F = null; ch = true; }
    if (!snap.metadata.fromCache && !famServer) { famServer = true; ch = true; }
    if (!famLoaded && (snap.exists() || !snap.metadata.fromCache)) { famLoaded = true; ch = true; }
    if (updateReady()) ch = true;
    if (ch) render();
  }, err => { status = err && err.code === 'permission-denied' ? 'Accès refusé : vérifie les règles Firestore.' : 'La banque ne répond plus : relance l’application.'; famLoaded = true; render(); });
}
function stopSync() {
  if (famUnsub) famUnsub(); famUnsub = null;
  for (const id of Object.keys(kidUnsubs)) { kidUnsubs[id](); delete kidUnsubs[id]; }
  F = null; famLoaded = false; famServer = false; ready = false; lastF = ''; ob = null;
  for (const o of [EV, GOAL, KL, lastK]) for (const k of Object.keys(o)) delete o[k];
  clearTimeout(offlineTimer);
}
async function tryLegacy() {
  try {
    const [e, a, r] = await Promise.all(['erin', 'ava', 'regles'].map(k => getDoc(doc(fdb, 'tresor', k))));
    if (!ob || (!e.exists() && !a.exists())) return;
    const ed = e.exists() ? e.data() : null, ad = a.exists() ? a.data() : null, rd = r.exists() ? r.data() : {};
    ob.kids = [];
    if (ed) ob.kids.push({ id: 'erin', name: ed.name || 'Erin', birth: ed.birth || '', weekly: ed.weekly || '', color: PAL[0] });
    if (ad) ob.kids.push({ id: 'ava', name: ad.name || 'Ava', birth: ad.birth || '', weekly: ad.weekly || '', color: PAL[1] });
    ob.legacy = { erin: ed ? ed.events || [] : [], ava: ad ? ad.events || [] : [] };
    if (typeof rd.match === 'number') ob.match = rd.match;
    if (typeof rd.giftMatch === 'number') ob.giftMatch = rd.giftMatch;
    if (rd.pin) ob.pin = rd.pin;
    ob.parents = 'papa';
    render();
  } catch (err) { /* pas d'anciennes données accessibles */ }
}

/* ---------- actions ---------- */
function roll() {
  const t0 = tot(cur);
  if (!ready || rolling || sameWeek(t0.bourse && t0.bourse.d)) return;
  rolling = true;
  const el = document.getElementById('die'), face = 1 + Math.floor(Math.random() * 6), quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0;
  const spin = quick || !el ? null : setInterval(() => { el.innerHTML = die(1 + Math.floor(Math.random() * 6), 132); el.style.transform = `rotate(${(i++ % 2 ? -1 : 1) * 16}deg) scale(1.08)`; }, 85);
  setTimeout(() => {
    if (spin) clearInterval(spin);
    if (el) el.style.transform = '';
    const before = tot(cur).total, rate = F.dice[face - 1], gain = r2(Math.max(0, before) * rate / 100);
    EV[cur] = [...evs(cur), { t: 'bourse', d: iso(), face, rate, gain }];
    rolling = false; saveK(cur);
    sayMs(before, rate > 0 ? `Dé ${face} : +${f(gain)} dans ton bocal !` : rate < 0 ? `Dé ${face} : ton bocal perd ${f(Math.abs(gain))}.` : `Dé ${face} : rien ne bouge cette semaine.`, rate < 0 ? 'Ça arrive, la semaine prochaine sera peut-être meilleure.' : '');
    render();
  }, quick ? 30 : 1300);
}
function doGift(ratio) {
  const amt = r2(num(form.gamount));
  if (!(amt > 0) || amt > 2000) { say('Écris d’abord combien tu as reçu.'); return; }
  const inv2 = r2(amt * ratio), dep2 = r2(amt - inv2), bonus = r2(inv2 * gm() / 100), from = form.gfrom.trim();
  const before = tot(cur).total;
  EV[cur] = [...evs(cur), { t: 'recu', d: iso(), from, inv: inv2, dep: dep2, bonus }];
  saveK(cur);
  sayMs(before, inv2 ? `Super ! ${f(inv2 + bonus)} rejoignent ton bocal.` : `${f(dep2)} rangés dans ta tirelire.`, inv2 ? `Donne ${f(inv2)} ${P().a} pour qu’ils soient mis en lieu sûr.` : '');
  form.gamount = ''; form.gfrom = ''; view = 'home';
}
function doProject() {
  const k = form.pkid && kidOf(form.pkid) ? form.pkid : cur, a = r2(num(form.pamount)), label = form.plabel.trim(), T = tot(k);
  if (!label) { say('Indiquez le projet présenté.'); return; }
  if (!(a > 0) || a > T.total) { say(`Montant possible : entre 0 et ${f(T.total)}.`); return; }
  const fromLivret = r2(Math.max(0, a - Math.max(0, T.due)));
  EV[k] = [...evs(k), { t: 'projet', d: iso(), label, amount: a, fromLivret }];
  saveK(k);
  say(`Projet « ${esc(label)} » validé : ${f(a)} pour ${esc(kidOf(k).name)}.`, fromLivret > 0 ? `Reprenez ${f(fromLivret)} dans l’argent mis de côté.` : '');
  form.plabel = ''; form.pamount = '';
}
function obValidate() {
  ob.err = '';
  if (ob.step === 2) {
    for (const k of ob.kids) {
      k.name = (k.name || '').trim();
      if (!k.name) { ob.err = 'Indiquez le prénom de chaque enfant.'; return false; }
      if (!validBirth(k.birth)) { ob.err = `Date de naissance à vérifier pour ${k.name} (entre 3 et 17 ans).`; return false; }
      const w = parseInt(k.weekly || suggest(k.birth), 10);
      if (!(w >= 1 && w <= 50)) { ob.err = `Argent de poche entre 1 et 50 € pour ${k.name}.`; return false; }
      k.weekly = w;
    }
  }
  if (ob.step === 3 && !/^\d{4}$/.test(ob.pin)) { ob.err = 'Choisissez un code parents à 4 chiffres.'; return false; }
  return true;
}
async function obFinish() {
  if (!obValidate()) return render();
  busy = true; render();
  try {
    const fam = { v: 1, parents: ob.parents, kids: ob.kids.map(k => ({ id: k.id, name: k.name, birth: k.birth, weekly: k.weekly, color: k.color })), match: ob.match, giftMatch: ob.giftMatch, dice: DICE[ob.dice].faces.slice(), diceName: ob.dice, pin: ob.pin, created: iso() };
    await Promise.all(fam.kids.map(k => setDoc(doc(fdb, 'familles', user.uid, 'enfants', k.id), { events: (ob.legacy && ob.legacy[k.id]) || [], goal: null })));
    await setDoc(doc(fdb, 'familles', user.uid), fam);
    view = 'home'; cur = fam.kids[0].id;
  } catch (e) { ob.err = 'Impossible d’enregistrer : vérifiez la connexion et les règles Firestore.'; }
  busy = false; render();
}

document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, k = b.dataset.k;
  if (a === 'roll') { roll(); return; }
  if (a !== 'undo') undoArm = false;
  if (a !== 'wipe') wipeArm = false;
  if (a !== 'kdel') delArm = null;
  if (a !== 'goaldrop') goalDropArm = false;
  switch (a) {
    case 'lmode': loginMode = b.dataset.m; loginErr = ''; loginMsg = ''; break;
    case 'reset':
      if (!form.email.trim()) { loginErr = 'Indiquez d’abord votre e-mail.'; break; }
      sendPasswordResetEmail(auth, form.email.trim()).then(() => { loginMsg = 'Un e-mail de réinitialisation vient d’être envoyé.'; loginErr = ''; render(); }).catch(() => { loginErr = 'Envoi impossible : vérifiez l’adresse.'; render(); });
      return;
    case 'obpar': ob.parents = k; break;
    case 'obcolor': { const x = ob.kids.find(z => z.id === k); if (x) x.color = b.dataset.c; break; }
    case 'obadd': ob.kids.push({ id: uid6(), name: '', birth: '', weekly: '', color: PAL[ob.kids.length % PAL.length] }); break;
    case 'obdel': ob.kids = ob.kids.filter(z => z.id !== k); break;
    case 'obmatch': ob.match = +b.dataset.n; break;
    case 'obgift': ob.giftMatch = +b.dataset.n; break;
    case 'obdice': ob.dice = b.dataset.n; break;
    case 'obnext': if (obValidate()) { ob.step++; window.scrollTo(0, 0); } break;
    case 'obprev': ob.step--; ob.err = ''; window.scrollTo(0, 0); break;
    case 'obfinish': obFinish(); return;
    case 'go': view = b.dataset.v; if (view !== 'parents') { pinOk = false; } pinBuf = ''; pinBad = false; window.scrollTo(0, 0); break;
    case 'kid': cur = k; goalEdit = false; resetCoins(); try { localStorage.setItem('pepite-cur', cur); } catch (e) {} break;
    case 'toPig': if (tray) { tray--; dep++; } break;
    case 'toGrow': if (tray) { tray--; inv++; } break;
    case 'backPig': if (dep) { dep--; tray++; } break;
    case 'backGrow': if (inv) { inv--; tray++; } break;
    case 'pay': {
      const t = tot(cur);
      if (!ready || tray || (lock && sameWeek(t.paie))) break;
      const bonus = r2(inv * F.match / 100);
      const before = t.total;
      EV[cur] = [...evs(cur), { t: 'paie', d: iso(), inv, dep, bonus }];
      saveK(cur);
      sayMs(before, inv ? `Bravo ! ${f(inv + bonus)} rejoignent ton bocal.` : 'Paie rangée : tout est dans ta tirelire.', dep ? `${f(dep)} en pièces pour ta tirelire.` : '');
      resetCoins(); view = 'home'; window.scrollTo(0, 0); break;
    }
    case 'gift': if (ready) doGift(parseFloat(b.dataset.r)); break;
    case 'pm': projInv[cur] = Math.max(0, projInv[cur] - 1); break;
    case 'pp': projInv[cur] = Math.min(kidOf(cur).weekly, projInv[cur] + 1); break;
    case 'bar': sel[cur] = +b.dataset.age; break;
    case 'pin':
      if (pinBuf.length < 4) pinBuf += b.dataset.n; pinBad = false;
      if (pinBuf.length === 4) { if (pinBuf === F.pin) pinOk = true; else pinBad = true; pinBuf = ''; }
      break;
    case 'pinback': pinBuf = pinBuf.slice(0, -1); break;
    case 'unlockdev': lock = null; pinOk = false; try { localStorage.removeItem('pepite-lock'); } catch (e) {} say('Appareil déverrouillé.'); break;
    case 'lock': if (/^\d{4}$/.test(F.pin || '')) { lock = cur = k; pinOk = false; view = 'home'; resetCoins(); try { localStorage.setItem('pepite-lock', lock); } catch (e) {} window.scrollTo(0, 0); say(`Appareil réservé à ${esc(kidOf(k).name)}.`, 'Le code parents rouvre tout.'); } break;
    case 'vire': if (ready) { const T = tot(k); if (T.due > 0) { EV[k] = [...evs(k), { t: 'vire', d: iso(), amount: T.due }]; saveK(k); say(`${f(T.due)} mis de côté pour ${esc(kidOf(k).name)}.`, 'Le compteur repart de zéro.'); } } break;
    case 'project': if (ready) doProject(); break;
    case 'goalpick': form.goalname = b.dataset.n; break;
    case 'goaledit': { const g = goalOf(cur); goalEdit = true; form.goalname = g.name; form.goalbudget = String(g.budget).replace('.', ','); break; }
    case 'goalcancel': goalEdit = false; form.goalname = ''; form.goalbudget = ''; break;
    case 'goalset': {
      if (!ready) break;
      const name = form.goalname.trim(), bud = r2(num(form.goalbudget));
      if (!name) { say('Donne un nom à ton projet.'); break; }
      if (!(bud >= 1 && bud <= 10000)) { say('Indique un prix entre 1 € et 10 000 €.'); break; }
      const g0 = goalOf(cur);
      GOAL[cur] = { name: name.slice(0, 30), budget: bud, created: g0 ? g0.created : iso() };
      saveK(cur); goalEdit = false; form.goalname = ''; form.goalbudget = '';
      say(g0 ? 'Projet mis à jour.' : `C’est parti pour « ${esc(name)} » !`, g0 ? '' : 'Ton bocal affiche maintenant tes paliers.');
      break;
    }
    case 'goaldrop': if (ready) { if (!goalDropArm) goalDropArm = true; else { GOAL[cur] = null; saveK(cur); goalDropArm = false; say('Projet abandonné.', 'Tu peux en choisir un autre quand tu veux.'); } } break;
    case 'goalunlock': if (ready) { const g = goalOf(k), T = tot(k); if (g && T.total >= g.budget) { const amount = r2(g.budget), fromLivret = r2(Math.max(0, amount - Math.max(0, T.due))); EV[k] = [...evs(k), { t: 'projet', d: iso(), label: g.name, amount, fromLivret, goal: true }]; GOAL[k] = null; saveK(k); say(`« ${esc(g.name)} » débloqué : ${f(amount)} pour ${esc(kidOf(k).name)}.`, fromLivret > 0 ? `Reprenez ${f(fromLivret)} dans l’argent mis de côté.` : ''); } } break;
    case 'undo': if (ready) { if (!undoArm) undoArm = true; else { EV[cur] = evs(cur).slice(0, -1); saveK(cur); undoArm = false; say('Dernière opération annulée.'); } } break;
    case 'resetopen': resetFor = cur; form.resetname = ''; break;
    case 'resetclose': resetFor = null; form.resetname = ''; break;
    case 'resetdo': {
      const x = kidOf(resetFor);
      if (!ready || !x || form.resetname.trim().toLowerCase() !== x.name.toLowerCase()) break;
      EV[x.id] = []; GOAL[x.id] = null; saveK(x.id); if (x.id === cur) resetCoins();
      resetFor = null; form.resetname = ''; say(`Le bocal ${de(x.name)} est remis à zéro.`);
      break;
    }
    case 'kcolor': { const x = kidOf(k); if (x && ready) { x.color = b.dataset.c; saveF(); } break; }
    case 'kadd': if (ready) { const id = uid6(); const used = kids().map(z => z.color); F.kids.push({ id, name: 'Nouvel enfant', birth: '2018-01-01', weekly: 3, color: PAL.find(c => !used.includes(c)) || PAL[0] }); EV[id] = []; KL[id] = true; saveK(id); saveF(); syncKids(); cur = id; say('Enfant ajouté : complétez sa fiche.'); } break;
    case 'kdel': if (ready) { if (delArm !== k) delArm = k; else { F.kids = F.kids.filter(z => z.id !== k); saveF(); queue('del' + k, () => deleteDoc(doc(fdb, 'familles', user.uid, 'enfants', k))); syncKids(); delArm = null; ensureCur(); say('Enfant supprimé.'); } } break;
    case 'dicepreset': if (ready && DICE[b.dataset.n]) { F.dice = DICE[b.dataset.n].faces.slice(); F.diceName = b.dataset.n; saveF(); } break;
    case 'logout': try { localStorage.removeItem('pepite-lock'); } catch (e) {} lock = null; view = 'home'; signOut(auth); return;
  }
  render();
});

document.addEventListener('input', ev => {
  const t = ev.target, fk = t.dataset.f, ok = t.dataset.ob;
  if (fk) form[fk] = t.value;
  if (fk === 'resetname') { const x = kidOf(resetFor), btn = document.querySelector('[data-act=resetdo]'); if (x && btn) btn.disabled = !(ready && t.value.trim().toLowerCase() === x.name.toLowerCase()); }
  if (ok && ob) { const [key, id] = ok.split(':'); if (id) { const x = ob.kids.find(z => z.id === id); if (x) x[key] = t.value; } else ob[key] = t.value.replace(/\D/g, '').slice(0, 4); }
  if (t.dataset.set === 'pin') form.newpin = t.value.replace(/\D/g, '').slice(0, 4);
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.ob && t.dataset.ob.startsWith('birth:')) { render(); return; }
  if (t.dataset.f === 'pkid') { form.pkid = t.value; render(); return; }
  const s = t.dataset.set; if (!s || !ready) return;
  const [key, id] = s.split(':'), v = t.value, x = id ? kidOf(id) : null;
  if (key === 'kname' && x && v.trim()) { x.name = v.trim().slice(0, 20); saveF(); }
  else if (key === 'kbirth' && x && validBirth(v)) { x.birth = v; saveF(); }
  else if (key === 'kweekly' && x) { const n = parseInt(v, 10); if (n >= 1 && n <= 50) { x.weekly = n; saveF(); if (id === cur) resetCoins(); } }
  else if (key === 'parents' && PAR[v]) { F.parents = v; saveF(); }
  else if (key === 'match') { const n = num(v); if (n >= 0 && n <= 100) { F.match = n; saveF(); } }
  else if (key === 'giftMatch') { const n = num(v); if (n >= 0 && n <= 100) { F.giftMatch = n; saveF(); } }
  else if (key === 'dice') { const n = num(v); if (n >= -50 && n <= 50) { F.dice[+id] = n; F.diceName = 'perso'; saveF(); } }
  else if (key === 'pin') { const p = v.replace(/\D/g, ''); if (/^\d{4}$/.test(p)) { F.pin = p; form.newpin = ''; saveF(); say('Code parents enregistré.'); } }
  render();
});
document.addEventListener('submit', async ev => {
  if (ev.target.id !== 'loginf') return;
  ev.preventDefault();
  loginErr = ''; loginMsg = ''; busy = true; render();
  try {
    if (loginMode === 'up') await createUserWithEmailAndPassword(auth, form.email.trim(), form.pass);
    else await signInWithEmailAndPassword(auth, form.email.trim(), form.pass);
    form.pass = '';
  } catch (e) {
    const c = e && e.code || '';
    loginErr = c.includes('email-already-in-use') ? 'Un compte existe déjà avec cet e-mail : connectez-vous.' : c.includes('weak-password') ? 'Mot de passe trop court (6 caractères minimum).' : c.includes('invalid-email') ? 'Adresse e-mail invalide.' : loginMode === 'up' ? 'Création impossible pour le moment.' : 'E-mail ou mot de passe incorrect.';
  }
  busy = false; render();
});
addEventListener('online', () => { if (user && !ready) startSync(); });

/* ---------- démarrage ---------- */
render();
const app = initializeApp(firebaseConfig);
auth = getAuth(app);
fdb = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
onAuthStateChanged(auth, u => {
  user = u;
  if (u) startSync(); else { stopSync(); view = 'home'; }
  render();
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
