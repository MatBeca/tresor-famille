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
const num = v => parseFloat(String(v).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.'));
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
const POST = {
  none: { name: 'Je ne joue pas', short: 'Pas de bourse', faces: [0, 0, 0, 0, 0, 0], txt: 'Ton argent ne bouge pas : ni gain, ni perte. Seul le bonus le fait grandir.', like: 'Comme de l’argent rangé dans une boîte' },
  prudent: { name: 'Prudent', short: 'Prudent', faces: [-0.5, 0, 0, 0, 0.5, 0.6], txt: 'Petits gains, presque jamais de pertes.', like: 'Comme un livret d’épargne' },
  equilibre: { name: 'Équilibré', short: 'Équilibré', faces: [-1.5, -0.5, 0, 0.5, 1, 1.7], txt: 'Des hauts et des bas, et plus de gains en moyenne.', like: 'Comme un placement mélangé' },
  aventurier: { name: 'Aventurier', short: 'Aventurier', faces: [-6, -3, -1, 1, 4, 6.8], txt: 'Les plus gros gains possibles, mais tu peux vraiment perdre de l’argent.', like: 'Comme des actions en Bourse' }
};
const DICE = POST;
const CAPS = [20, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000];
const PIPS = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]], 6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]] };
const LOGO = `<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><path d="M30.5 32C30 26 30.6 21 32 16.5" stroke="#0b5e33" stroke-width="3.2" stroke-linecap="round" fill="none"/><path d="M31 22.5C24.5 23.5 18.5 20.5 16.5 13.5 23.5 12 29.5 15.5 31 22.5Z" fill="#2fc275" stroke="#0b5e33" stroke-width="2.2" stroke-linejoin="round"/><path d="M31.8 18C33.5 11 39.5 6.5 47 7 46 14.5 39.5 18.5 31.8 18Z" fill="#13a05a" stroke="#0b5e33" stroke-width="2.2" stroke-linejoin="round"/><defs><clipPath id="nc"><path d="M6.5 46 10 36.5 20 31 29.5 33 38 28 50.5 29.5 57.5 38 58 48.5 50 55 36 57.5 22 56.5 11 54Z"/></clipPath></defs><g clip-path="url(#nc)"><rect width="64" height="64" fill="#f0a71a"/><path d="M10 36.5 20 31 29.5 33 25 41.5 13 42.5Z" fill="#ffd95a"/><path d="M29.5 33 38 28 50.5 29.5 44 38.5 33 39.5Z" fill="#ffe991"/><path d="M50.5 29.5 57.5 38 58 48.5 47 46 44 38.5Z" fill="#e39a10"/><path d="M25 41.5 29.5 33 33 39.5 44 38.5 47 46 34 48.5Z" fill="#f5b323"/><path d="M6.5 46 10 36.5 13 42.5 25 41.5 34 48.5 22 56.5 11 54Z" fill="#eba216"/><path d="M34 48.5 47 46 58 48.5 50 55 36 57.5 22 56.5Z" fill="#c27c00"/></g><path d="M6.5 46 10 36.5 20 31 29.5 33 38 28 50.5 29.5 57.5 38 58 48.5 50 55 36 57.5 22 56.5 11 54Z" fill="none" stroke="#6e4400" stroke-width="3" stroke-linejoin="round"/><path d="M13.5 39 19 34.5" stroke="#fffbe6" stroke-width="2.6" stroke-linecap="round"/><path d="M33 32.5 37 30.5" stroke="#fffbe6" stroke-width="2.2" stroke-linecap="round"/><path d="M54 14l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#ffc531" stroke="#6e4400" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const WM = `<svg class="wm" role="img" aria-label="Pépite" viewBox="-10 -1010 2892 1260"><path d="M126 8Q81 8 62.0 -5.5Q43 -19 39.0 -40.5Q35 -62 35 -84V-600Q35 -622 39.0 -643.0Q43 -664 62.0 -677.5Q81 -691 127 -691H326Q364 -691 408.0 -675.5Q452 -660 491.5 -628.0Q531 -596 556.0 -548.0Q581 -500 581 -434Q581 -369 556.0 -321.0Q531 -273 491.5 -241.5Q452 -210 408.0 -194.5Q364 -179 325 -179H218V-83Q218 -61 214.0 -40.0Q210 -19 191.0 -5.5Q172 8 126 8ZM218 -362H326Q339 -362 356.0 -368.5Q373 -375 386.0 -391.0Q399 -407 399 -435Q399 -456 389.0 -472.5Q379 -489 362.5 -498.5Q346 -508 325 -508H218Z M883 20Q808 20 756.0 -4.5Q704 -29 672.0 -68.5Q640 -108 625.0 -154.0Q610 -200 610 -243Q610 -322 645.0 -382.0Q680 -442 742.0 -476.0Q804 -510 884 -510Q946 -510 990.0 -490.0Q1034 -470 1061.5 -439.0Q1089 -408 1102.0 -373.0Q1115 -338 1115 -308Q1115 -251 1087.0 -221.0Q1059 -191 1015 -191H802Q806 -175 818.5 -163.5Q831 -152 850.0 -145.5Q869 -139 891 -139Q913 -139 930.0 -141.5Q947 -144 959.5 -148.0Q972 -152 982.5 -156.0Q993 -160 1001.5 -162.5Q1010 -165 1018 -165Q1036 -165 1051.0 -153.0Q1066 -141 1078 -117Q1085 -104 1088.0 -92.5Q1091 -81 1091 -71Q1091 -41 1066.5 -21.0Q1042 -1 996.0 9.5Q950 20 883 20ZM802 -285H914Q928 -285 934.5 -291.0Q941 -297 941 -309Q941 -322 933.5 -331.0Q926 -340 913.0 -344.5Q900 -349 882 -349Q858 -349 840.0 -339.5Q822 -330 812.5 -315.5Q803 -301 802 -285Z M1430 -3Q1381 -3 1345 -23Q1340 -26 1335 -29V132Q1337 154 1332.5 174.5Q1328 195 1309.0 208.0Q1290 221 1245 221Q1201 221 1182.0 208.0Q1163 195 1159.5 175.0Q1156 155 1156 133V-410Q1156 -432 1159.5 -452.0Q1163 -472 1181.5 -485.5Q1200 -499 1244 -499Q1279 -499 1302 -490Q1321 -482 1331 -467Q1339 -473 1347 -478Q1382 -498 1430 -498Q1474 -498 1515.5 -477.0Q1557 -456 1590.0 -420.5Q1623 -385 1642.0 -340.0Q1661 -295 1661 -247Q1661 -197 1642.0 -152.5Q1623 -108 1590.5 -74.5Q1558 -41 1516.5 -22.0Q1475 -3 1430 -3ZM1406 -173Q1426 -173 1442.5 -183.0Q1459 -193 1469.0 -209.5Q1479 -226 1479 -245Q1479 -265 1469.5 -281.5Q1460 -298 1443.5 -307.5Q1427 -317 1407.0 -317.0Q1387 -317 1370.5 -307.0Q1354 -297 1344.5 -281.0Q1335 -265 1335 -245Q1335 -226 1345.0 -209.5Q1355 -193 1371.0 -183.0Q1387 -173 1406 -173Z M1789 9Q1744 9 1725.0 -4.5Q1706 -18 1702.5 -39.0Q1699 -60 1699 -82V-408Q1699 -430 1703.0 -450.5Q1707 -471 1726.0 -484.5Q1745 -498 1790 -498Q1835 -498 1853.5 -484.5Q1872 -471 1876.0 -450.0Q1880 -429 1880 -406V-81Q1880 -59 1876.0 -38.0Q1872 -17 1853.5 -4.0Q1835 9 1789 9Z M2210 9Q2157 9 2118.0 -3.0Q2079 -15 2053.5 -40.0Q2028 -65 2015.5 -103.0Q2003 -141 2003 -192V-319H1978Q1944 -321 1931.0 -341.0Q1918 -361 1918 -407Q1918 -450 1934.0 -471.5Q1950 -493 1982 -493H2003V-580Q2003 -603 2007.0 -622.5Q2011 -642 2030.0 -654.5Q2049 -667 2094 -667Q2138 -667 2157.0 -653.5Q2176 -640 2180.0 -619.0Q2184 -598 2184 -576V-496L2237 -498Q2259 -498 2279.5 -494.0Q2300 -490 2313.5 -471.0Q2327 -452 2327 -406Q2327 -364 2313.5 -345.0Q2300 -326 2279.5 -321.0Q2259 -316 2236 -316L2184 -317V-201Q2184 -190 2185.5 -182.5Q2187 -175 2190.0 -171.0Q2193 -167 2198.0 -165.0Q2203 -163 2211 -163Q2237 -163 2257.5 -159.0Q2278 -155 2289.5 -138.0Q2301 -121 2301 -81Q2301 -36 2287.0 -17.0Q2273 2 2252.0 5.5Q2231 9 2210 9Z M2625 20Q2550 20 2498.0 -4.5Q2446 -29 2414.0 -68.5Q2382 -108 2367.0 -154.0Q2352 -200 2352 -243Q2352 -322 2387.0 -382.0Q2422 -442 2484.0 -476.0Q2546 -510 2626 -510Q2688 -510 2732.0 -490.0Q2776 -470 2803.5 -439.0Q2831 -408 2844.0 -373.0Q2857 -338 2857 -308Q2857 -251 2829.0 -221.0Q2801 -191 2757 -191H2544Q2548 -175 2560.5 -163.5Q2573 -152 2592.0 -145.5Q2611 -139 2633 -139Q2655 -139 2672.0 -141.5Q2689 -144 2701.5 -148.0Q2714 -152 2724.5 -156.0Q2735 -160 2743.5 -162.5Q2752 -165 2760 -165Q2778 -165 2793.0 -153.0Q2808 -141 2820 -117Q2827 -104 2830.0 -92.5Q2833 -81 2833 -71Q2833 -41 2808.5 -21.0Q2784 -1 2738.0 9.5Q2692 20 2625 20ZM2544 -285H2656Q2670 -285 2676.5 -291.0Q2683 -297 2683 -309Q2683 -322 2675.5 -331.0Q2668 -340 2655.0 -344.5Q2642 -349 2624 -349Q2600 -349 2582.0 -339.5Q2564 -330 2554.5 -315.5Q2545 -301 2544 -285Z" fill="currentColor"/><path d="M752.5 -590C782.5 -720 932.5 -770 1022.5 -735C992.5 -610 862.5 -550 752.5 -590Z" fill="#13a05a"/><g transform="translate(1642.3 -837.8) scale(4.6)"><defs><clipPath id="wn"><path d="M6.5 46 10 36.5 20 31 29.5 33 38 28 50.5 29.5 57.5 38 58 48.5 50 55 36 57.5 22 56.5 11 54Z"/></clipPath></defs><g clip-path="url(#wn)"><rect width="64" height="64" fill="#f0a71a"/><path d="M10 36.5 20 31 29.5 33 25 41.5 13 42.5Z" fill="#ffd95a"/><path d="M29.5 33 38 28 50.5 29.5 44 38.5 33 39.5Z" fill="#ffe991"/><path d="M50.5 29.5 57.5 38 58 48.5 47 46 44 38.5Z" fill="#e39a10"/><path d="M25 41.5 29.5 33 33 39.5 44 38.5 47 46 34 48.5Z" fill="#f5b323"/><path d="M6.5 46 10 36.5 13 42.5 25 41.5 34 48.5 22 56.5 11 54Z" fill="#eba216"/><path d="M34 48.5 47 46 58 48.5 50 55 36 57.5 22 56.5Z" fill="#c27c00"/></g><path d="M6.5 46 10 36.5 20 31 29.5 33 38 28 50.5 29.5 57.5 38 58 48.5 50 55 36 57.5 22 56.5 11 54Z" fill="none" stroke="#6e4400" stroke-width="3.4" stroke-linejoin="round"/><path d="M13.5 39 19 34.5" stroke="#fffbe6" stroke-width="2.6" stroke-linecap="round"/><path d="M33 32.5 37 30.5" stroke="#fffbe6" stroke-width="2.2" stroke-linecap="round"/></g></svg>`;
const WMFULL = `<span class="wmfull" role="img" aria-label="C’est Pépite"><span class="cest" aria-hidden="true">c’est</span>${WM.replace('role="img" aria-label="Pépite"', 'aria-hidden="true"')}</span>`;
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

/* ---------- apparence (par appareil, clair par défaut) ---------- */
let theme = 'light';
try { theme = localStorage.getItem('pepite-theme') === 'dark' ? 'dark' : 'light'; } catch (e) {}
function applyTheme() { document.documentElement.dataset.theme = theme; }
applyTheme();

/* ---------- état ---------- */
let user, auth, fdb;
let F = null, famLoaded = false, famServer = false, lastF = '';
const EV = {}, GOAL = {}, PAUSE = {}, KL = {}, lastK = {}, kidUnsubs = {};
let goalEdit = false, goalDropArm = false, resetFor = null, payHelp = null;
let famUnsub = null, ready = false, status = '', offlineTimer = null;
let view = 'home', cur = null, lock = null, pinOk = false, pinBuf = '', pinBad = false;
let tray = 0, inv = 0, dep = 0, rolling = false;
let toast = null, toastT = null, undoArm = false, wipeArm = false, delArm = null;
const projInv = {}, sel = {};
const form = { preason: '', pdur: '1', resetname: '', goalname: '', goalbudget: '', gamount: '', gfrom: '', plabel: '', pamount: '', pkid: '', email: '', pass: '', newpin: '' };
let loginMode = 'in', loginMsg = '', loginErr = '', busy = false;
let ob = null;
try { lock = localStorage.getItem('pepite-lock'); cur = localStorage.getItem('pepite-cur'); } catch (e) {}

const kids = () => (F && F.kids) || [];
const kidOf = id => kids().find(k => k.id === id);
const P = () => PAR[(F && F.parents) || 'parents'] || PAR.parents;
const evs = id => EV[id] || [];
const postOf = id => { const k = kidOf(id); return k && POST[k.posture] ? k.posture : (POST[F.diceName] ? F.diceName : 'equilibre'); };
const facesOf = id => POST[postOf(id)].faces;
const meanOf = id => facesOf(id).reduce((a, b) => a + b, 0) / 6;
const simCache = {};
function simYear(post, start) {
  const key = post + ':' + start; if (simCache[key]) return simCache[key];
  const faces = POST[post].faces, n = 1500, out = [];
  let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  for (let i = 0; i < n; i++) { let x = start; for (let w = 0; w < 52; w++) x *= 1 + faces[Math.floor(rnd() * 6)] / 100; out.push(x); }
  out.sort((a, b) => a - b);
  const r = { lo: out[Math.floor(n * 0.1)], mid: out.reduce((a, b) => a + b, 0) / n, hi: out[Math.floor(n * 0.9)], worst: out[0], best: out[n - 1], loss: out.filter(v => v < start - 0.005).length / n };
  return (simCache[key] = r);
}
const lossTxt = p => p <= 0 ? 'jamais' : p < 0.02 ? 'presque jamais' : `environ 1 fois sur ${Math.max(2, Math.round(1 / p))}`;
const gm = () => (typeof F.giftMatch === 'number' ? F.giftMatch : 10);
function ensureCur() {
  if (lock && !kidOf(lock)) { lock = null; try { localStorage.removeItem('pepite-lock'); } catch (e) {} }
  if (lock) cur = lock;
  if (!kidOf(cur)) cur = kids()[0] ? kids()[0].id : null;
}
function resetCoins() { const k = kidOf(cur); tray = k ? k.weekly : 0; inv = 0; dep = 0; }
function say(msg, sub) { toast = { msg, sub }; clearTimeout(toastT); toastT = setTimeout(() => { toast = null; render(); }, 4500); }

const BACKLOG = 4;
const normWk = ms => wk(new Date(ms + 12 * 3600e3));
function startWeek(id) {
  const k = kidOf(id); if (k && k.start) return wk(k.start);
  const first = evs(id).find(e => e.t === 'paie'); return first ? wk(first.w || first.d) : wk(new Date());
}
function pausedWeeks(id) {
  const iv = []; let open = null;
  for (const e of evs(id)) {
    if (e.t === 'pause') { open = { from: wk(e.d), to: e.until ? new Date(e.until).getTime() : Infinity }; iv.push(open); }
    else if (e.t === 'reprise' && open) { open.to = Math.min(open.to, wk(e.d)); open = null; }
  }
  return w => iv.some(x => w >= x.from && w < x.to);
}
function owed(id) {
  const cw = wk(new Date()), st = startWeek(id), isPaused = pausedWeeks(id);
  const paid = new Set(evs(id).filter(e => e.t === 'paie').map(e => e.w ? wk(e.w) : wk(e.d)));
  const out = [];
  for (let i = BACKLOG - 1; i >= 0; i--) { const w = normWk(cw - i * 7 * 864e5); if (w >= st && !paid.has(w) && !isPaused(w)) out.push(w); }
  return out;
}
const weekTxt = w => w === wk(new Date()) ? 'de cette semaine' : 'de la semaine du ' + new Date(w).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

function tot(id) {
  const t = { own: 0, bonus: 0, gains: 0, out: 0, pig: 0, purse: 0, given: 0, vire: 0, fromL: 0, paie: null, bourse: null, pays: [], rolls: [] };
  for (const e of evs(id)) {
    if (e.t === 'paie' || e.t === 'recu') { t.own += e.inv; t.bonus += e.bonus; t.pig += e.dep; if (e.t === 'paie') { t.purse += e.dep; t.paie = e.d; t.pays.push(e.inv); } }
    else if (e.t === 'donne') { t.given += e.amount; }
    else if (e.t === 'bourse') { t.gains += e.gain; t.bourse = e; t.rolls.push(e); }
    else if (e.t === 'projet') { t.out += e.amount; t.fromL += (e.fromLivret ?? e.amount); }
    else if (e.t === 'vire') { t.vire += e.amount; }
  }
  t.total = r2(t.own + t.bonus + t.gains - t.out);
  t.purseDue = r2(Math.max(0, t.purse - t.given));
  t.livret = r2(t.vire - t.fromL); t.due = r2(t.total - t.livret);
  return t;
}
const goalOf = id => GOAL[id] || null;
const pauseOf = id => { const p = PAUSE[id]; if (!p) return null; if (p.until && Date.now() >= new Date(p.until).getTime()) return null; return p; };
const untilTxt = p => p.until ? 'jusqu’au ' + new Date(new Date(p.until).getTime() - 864e5).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' inclus' : 'jusqu’à nouvel ordre';
const MS = [0.25, 0.5, 0.75, 1];
function eta(id, perWeek) {
  const g = goalOf(id), t = tot(id); if (!g) return null; if (t.total >= g.budget) return 0;
  const m = meanOf(id) / 100, match = F.match / 100; let x = Math.max(0, t.total);
  for (let w = 1; w <= 520; w++) { x += x * m + perWeek * (1 + match); if (x >= g.budget) return w; }
  return null;
}
const avgInv = id => { const p = tot(id).pays.slice(-8); return p.length ? p.reduce((a, b) => a + b, 0) / p.length : kidOf(id).weekly; };
const etaTxt = w => w === null ? null : w <= 1 ? 'dès la semaine prochaine' : `dans ${w} semaines, vers ${new Date(Date.now() + w * 7 * 864e5).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
function milestone(before, after) {
  const g = goalOf(cur);
  if (!g) { const c = CAPS.find(x => before < x && after >= x); return c ? `C’est pépite ! Ta tirelire passe les ${f(c)}.` : ''; }
  const b = before / g.budget, a = after / g.budget;
  for (const m of [1, 0.75, 0.5, 0.25]) if (b < m && a >= m) return m === 1 ? `C’est pépite ! Objectif « ${esc(g.name)} » atteint !` : `Palier ${m * 100} % atteint pour « ${esc(g.name)} » !`;
  return '';
}
function sayMs(before, msg, sub) { const ms = milestone(before, tot(cur).total); if (ms) say(ms, msg); else say(msg, sub); }
function project(id, perWeek) {
  const k = kidOf(id), t = tot(id), m = meanOf(id) / 100, match = F.match / 100, now = new Date(), birth = new Date(k.birth + 'T12:00:00');
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
  let y = 266, layers = '', gy = 266;
  h.forEach((v, i) => { y -= v; if (i === 2) gy = y; layers += `<rect x="16" y="${y.toFixed(1)}" width="188" height="${v.toFixed(1)}" style="fill:${fills[i]}"/>`; });
  const yb = y + h[2]; // bas de la couche « gagné tout seul »
  const reached = !!g && t.total >= g.budget;
  const star = (x, yy, r) => `<path d="M${x} ${yy - r}l${r * 0.28} ${r * 0.72} ${r * 0.72} ${r * 0.28}-${r * 0.72} ${r * 0.28}-${r * 0.28} ${r * 0.72}-${r * 0.28}-${r * 0.72}-${r * 0.72}-${r * 0.28} ${r * 0.72}-${r * 0.28}z" fill="#fff3b0" stroke="#6e4400" stroke-width="2" stroke-linejoin="round"/>`;
  const svg = `<svg class="jar" viewBox="0 0 220 290" role="img" aria-label="${reached ? 'Tirelire pleine : c’est pépite !' : `Tirelire remplie à ${Math.round((266 - y) / H * 100)} %`}">
<defs><clipPath id="jc"><rect x="22" y="56" width="176" height="214" rx="40"/></clipPath>
<pattern id="pc" width="26" height="18" patternUnits="userSpaceOnUse"><circle cx="13" cy="9" r="7" fill="#fff" fill-opacity=".2"/></pattern>
<pattern id="pn" width="30" height="20" patternUnits="userSpaceOnUse"><path d="M5 12 7 7 12 5 18 6 21 10 20 14 14 16 8 15z" fill="#f5b323" stroke="#6e4400" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 9 11 7" stroke="#fff6cf" stroke-width="1.4" stroke-linecap="round"/></pattern></defs>
<ellipse cx="110" cy="278" rx="80" ry="8" fill="#000" fill-opacity=".08"/>
<rect x="22" y="56" width="176" height="214" rx="40" style="fill:var(--glass)"/>
<g clip-path="url(#jc)">${layers}<rect x="16" y="${gy.toFixed(1)}" width="188" height="${(266 - gy).toFixed(1)}" fill="url(#pc)"/>${h[2] > 0.5 ? `<rect x="16" y="${y.toFixed(1)}" width="188" height="${h[2].toFixed(1)}" fill="url(#pn)"/>` : ''}</g>
<line x1="34" x2="186" y1="70" y2="70" stroke-dasharray="7 7" style="stroke:var(--soft)" stroke-width="2.5" stroke-linecap="round"/>
<rect x="38" y="84" width="14" height="140" rx="7" fill="#fff" fill-opacity=".55"/>${g ? [0.25, 0.5, 0.75].map(m => { const yy = (266 - m * g.budget / cap * H).toFixed(1); return `<line x1="168" x2="192" y1="${yy}" y2="${yy}" style="stroke:var(--ink)" stroke-width="4" stroke-linecap="round"/>`; }).join('') : ''}
<rect x="22" y="56" width="176" height="214" rx="40" fill="none" style="stroke:${reached ? '#c98a00' : 'var(--ink)'}" stroke-width="6"/>
<rect x="40" y="20" width="140" height="38" rx="13" style="fill:var(--kid);stroke:var(--ink)" stroke-width="6"/>
<rect x="74" y="29" width="72" height="11" rx="5.5" style="fill:var(--ink)"/>
<rect x="50" y="44" width="34" height="6" rx="3" fill="#fff" fill-opacity=".4"/>
${reached ? star(14, 120, 13) + star(206, 170, 11) + star(196, 96, 7) + star(26, 214, 8) : ''}</svg>`;
  return { cap, svg };
}

/* ---------- vues ---------- */
function splash(msg) { return `<div class="splash"><div>${LOGO}<h1 style="font-size:46px;margin-top:8px">${WMFULL}</h1><p class="soft">${esc(msg || 'L’argent de poche qui pousse')}</p></div></div>`; }

function loginView() {
  const up = loginMode === 'up';
  return `<main class="view full"><div class="welcome">${LOGO}<h1>${WMFULL}</h1><p>L’argent de poche qui pousse</p></div>
<div class="intro"><p class="story">Pièce après pièce, la tirelire se remplit… jusqu’à devenir une vraie pépite.</p><p>Pépite aide les parents à montrer à leurs enfants, avec leur argent de poche, pourquoi épargner et investir tôt change tout.</p><p class="soft small">Bonus, bourse et intérêts sont un jeu financé par vous, les parents : ce n’est pas un vrai placement.</p></div>
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
  const o = ob, st = `<div class="stepper"><span>Étape ${o.step} sur 3 · ${['Bienvenue', 'Vos enfants', 'Les règles du jeu'][o.step - 1]}</span><div class="sbar"><i style="width:${(o.step / 3 * 100).toFixed(0)}%"></i></div></div>`;
  let body = '';
  if (o.step === 1) {
    body = `${st}<div class="welcome">${LOGO}<h1>Bienvenue !</h1><p>Avec leur argent de poche, vos enfants découvrent pourquoi épargner et investir tôt change tout. Pièce après pièce, leur tirelire se remplit… jusqu’à devenir une vraie pépite.</p></div>
<div class="why"><div>${I.coin}<span><b>Une paie chaque semaine</b>Votre enfant décide librement ce qu’il fait de son argent : tout dépenser, tout faire pousser, ou un peu des deux. Et s’il le fait pousser, il découvre peu à peu les arcanes de l’investissement.</span></div>
<div>${I.die}<span><b>Un bonus et une bourse</b>Vous ajoutez un bonus sur l’argent qu’il place. Ensuite, chaque semaine, il peut lancer un dé qui fait varier sa tirelire, à la hausse ou à la baisse, comme les cours en Bourse. Il choisit lui-même son niveau de risque, ou décide de ne pas jouer.</span></div>
<div>${I.flag}<span><b>Des projets et un horizon</b>Il se fixe un objectif, comme l’achat d’un vélo, et fait grossir sa pépite jusqu’à ses 18 ans.</span></div></div>
<div class="msg">Ce que l’argent « gagne » dans Pépite (bonus, bourse) est payé par vous : c’est un jeu pour apprendre, pas un vrai placement.</div>
<div class="card"><h3>Comment vos enfants vous appellent-ils ?</h3><p class="soft small" style="margin:0">C’est le nom utilisé dans l’appli, par exemple « le bonus de papa ».</p>
<div class="pills">${Object.entries(PAR).filter(([k]) => k !== 'papamaman').map(([k, v]) => `<button class="pill" data-act="obpar" data-k="${k}" aria-pressed="${o.parents === k}">${v.label}</button>`).join('')}</div></div>
${o.legacy ? '<div class="msg">Les données déjà saisies pour vos enfants seront reprises.</div>' : ''}`;
  } else if (o.step === 2) {
    body = `${st}<h2 class="title">Vos enfants</h2><p class="lead">Chacun aura sa tirelire, sa couleur et son argent de poche.</p>
<div class="card help" style="margin-top:12px"><h3>Comment fonctionne la paie ?</h3><p style="margin:0;font-size:16px">Chaque semaine, l’enfant reçoit son argent de poche sous forme de pièces de 1 € dans l’appli, et range chaque pièce :</p>
<ul class="plain"><li><b>Dans son porte-monnaie</b> : il les dépense librement. Vous lui donnez cet argent en vrai quand vous voulez, chaque semaine ou une fois par mois : l’appli vous dit combien.</li><li><b>Dans sa tirelire</b>, pour faire pousser : l’argent reste chez vous, mis de côté. Il reçoit votre bonus et varie avec la bourse de la semaine.</li></ul>
<p class="soft small" style="margin:8px 0 0">Plus il fait pousser tôt, plus son trésor grossit : c’est toute la leçon.</p></div>
${o.kids.map((k, i) => `<div class="kidform"><header><h3>Enfant ${i + 1}</h3>${o.kids.length > 1 ? `<button class="link" data-act="obdel" data-k="${k.id}">Retirer</button>` : ''}</header>
<label>Prénom<input id="ob-n-${k.id}" type="text" autocomplete="off" maxlength="20" data-ob="name:${k.id}" value="${esc(k.name)}"></label>
<div class="grid2"><label>Date de naissance<input id="ob-b-${k.id}" type="date" data-ob="birth:${k.id}" value="${esc(k.birth)}"></label>
<label>Argent de poche par semaine (€)<input id="ob-w-${k.id}" type="number" inputmode="numeric" min="1" max="50" data-ob="weekly:${k.id}" value="${esc(k.weekly)}" placeholder="${suggest(k.birth)}"></label></div>
<label>Sa couleur</label><div class="swatches">${PAL.map(c => `<button class="sw" style="--c:${c}" data-act="obcolor" data-k="${k.id}" data-c="${c}" aria-pressed="${k.color === c}" aria-label="Couleur"></button>`).join('')}</div></div>`).join('')}
<div class="row"><button class="btn ghost full" data-act="obadd">Ajouter un enfant</button></div>
<p class="soft small" style="margin:10px 4px 0">Repère courant : 0,50 € à 1 € par semaine et par année d’âge.</p>`;
  } else {
    body = `${st}<h2 class="title">Les règles du jeu</h2><p class="lead">Tout reste modifiable plus tard dans l’espace parents.</p>
<div class="card"><h3>Bonus sur l’argent de poche placé</h3><p class="soft small" style="margin:0">Versé uniquement sur les pièces que l’enfant fait pousser. Rien sur celles qu’il met dans son porte-monnaie pour les dépenser : c’est ce qui rend le choix intéressant.</p>
<div class="pills">${[10, 25, 50].map(n => `<button class="pill" data-act="obmatch" data-n="${n}" aria-pressed="${o.match === n}">${n} %</button>`).join('')}</div></div>
<div class="card"><h3>Bonus sur l’argent reçu</h3><p class="soft small" style="margin:0">Cadeaux, anniversaires, petits services. Là aussi, seulement sur la part qu’il fait pousser.</p>
<div class="pills">${[0, 10, 25].map(n => `<button class="pill" data-act="obgift" data-n="${n}" aria-pressed="${o.giftMatch === n}">${n ? n + ' %' : 'Aucun'}</button>`).join('')}</div></div>
<div class="card"><h3>La bourse de la semaine</h3><p class="soft small" style="margin:0">Chaque semaine, l’enfant peut lancer un dé qui fait monter ou baisser sa tirelire. Il choisit lui-même sa stratégie dans l’onglet Bourse, et peut aussi décider de ne pas jouer. Plus la stratégie est risquée, plus elle rapporte en moyenne, mais plus elle peut faire perdre. Stratégie de départ :</p>
<div class="preset">${Object.entries(POST).map(([k, d]) => `<button data-act="obdice" data-n="${k}" aria-pressed="${o.dice === k}"><b>${d.name}</b><span>${d.txt}</span></button>`).join('')}</div></div>
<div class="card"><h3>Où va l’argent placé ?</h3><p class="soft small" style="margin:0">L’appli tient les comptes, mais l’argent doit exister en vrai. Quand vous le voulez, mettez de côté ce que l’appli indique (Livret A au nom de l’enfant, compte épargne ou boîte fermée à la maison) : l’espace parents vous dit combien, et vous n’aurez pas de surprise le jour d’un projet.</p></div>
<div class="card"><h3>Code parents</h3><p class="soft small" style="margin:0">4 chiffres pour ouvrir l’espace parents sur l’appareil d’un enfant.</p>
<label>Code à 4 chiffres<input id="ob-pin" class="secret" type="text" inputmode="numeric" autocomplete="off" maxlength="4" data-ob="pin" value="${esc(o.pin)}"></label></div>`;
  }
  return `<main class="view full">${body}${o.err ? `<p class="neg" style="font-weight:800;margin:14px 4px 0">${esc(o.err)}</p>` : ''}
<div class="row">${o.step > 1 ? '<button class="btn ghost" data-act="obprev">Retour</button>' : ''}<button class="btn" data-act="${o.step < 3 ? 'obnext' : 'obfinish'}" ${busy ? 'disabled' : ''}>${o.step < 3 ? 'Continuer' : 'C’est parti !'}</button></div></main>`;
}

function topbar() {
  const av = lock ? '' : kids().map(k => `<button class="av" style="--c:${k.color}" data-act="kid" data-k="${k.id}" aria-pressed="${k.id === cur}" aria-label="${esc(k.name)}">${esc(k.name.slice(0, 1).toUpperCase())}</button>`).join('');
  return `<header class="topbar"><div class="brand">${LOGO}${WM}</div>${kids().length > 1 ? av : ''}<button class="iconbtn" data-act="go" data-v="parents" aria-label="Espace parents">${I.gear}</button></header>`;
}
function tabbar() {
  const tabs = [['home', 'Tirelire', I.jar], ['paie', 'Paie', I.coin], ['bourse', 'Bourse', I.die], ['projet', 'Projet', I.flag], ['futur', 'Futur', I.chart]];
  return `<nav class="tabbar" aria-label="Navigation"><div>${tabs.map(([v, l, ic]) => `<button class="tab" data-act="go" data-v="${v}" ${view === v ? 'aria-current="page"' : ''}>${ic}${l}</button>`).join('')}</div></nav>`;
}

function homeView(k, t) {
  const g = goalOf(cur), J = jar(t, g), due = owed(cur).length, paid = due === 0, rolled = sameWeek(t.bourse && t.bourse.d);
  const prog = Math.min(100, Math.max(0, t.total / (g ? g.budget : J.cap) * 100));
  const hint = g ? (t.total >= g.budget ? `Objectif « ${esc(g.name)} » atteint !` : `Encore ${f(g.budget - t.total)} pour « ${esc(g.name)} »`) : (t.total >= J.cap ? `Palier de ${f(J.cap)} atteint !` : `Encore ${f(J.cap - t.total)} pour le palier de ${f(J.cap)}`);
  return `<section class="hero"><div><p class="hi">Salut ${esc(k.name)} !</p><p class="lbl">${g && t.total >= g.budget ? 'C’est pépite ! Ta tirelire est pleine' : 'Ta tirelire qui pousse'}</p><div class="amount">${f(t.total)}</div>
<div class="prog">${g ? '<b style="left:25%"></b><b style="left:50%"></b><b style="left:75%"></b>' : ''}<i style="width:${prog.toFixed(1)}%"></i></div><p class="small">${hint}</p></div>${J.svg}</section>
<div class="tiles"><div class="tile"><small><i style="background:var(--kid)"></i>Mon argent</small><b>${f(t.own)}</b></div>
<div class="tile"><small><i style="background:var(--gold)"></i>Bonus ${P().de}</small><b>${f(t.bonus)}</b></div>
<div class="tile"><small><i style="background:var(--grow)"></i>Mes pépites</small><b class="${t.gains < 0 ? 'neg' : 'g'}">${f(t.gains)}</b><span class="tsub">gagnées toutes seules</span></div>
<div class="tile"><small><i style="background:var(--purse)"></i>Porte-monnaie à recevoir</small><b>${f(t.purseDue)}</b></div></div>
${t.out > 0 ? `<p class="soft small" style="margin:8px 4px 0">Projets réalisés : ${f(t.out)}</p>` : ''}
<h3 class="sec">Mon projet</h3><div class="list"><button class="item" data-act="go" data-v="projet"><span class="ic" style="background:var(--kidt);color:var(--kidtxt)">${I.flag}</span><span>${g ? `<b>${esc(g.name)} : ${Math.floor(Math.min(1, Math.max(0, t.total) / g.budget) * 100)} %</b><small>${t.total >= g.budget ? 'Atteint : prépare ta présentation !' : `${f(Math.max(0, t.total))} sur ${f(g.budget)}`}</small>` : '<b>Choisis un projet</b><small>Un vélo, un jeu ? Fixe-toi un objectif.</small>'}</span><span class="end">${I.chev}</span></button></div>
<h3 class="sec">Cette semaine</h3><div class="list">
<button class="item" data-act="go" data-v="paie"><span class="ic" style="background:#fff3c4;color:#a87300">${I.coin}</span><span><b>Ma paie</b><small>${pauseOf(cur) ? 'En pause ' + untilTxt(pauseOf(cur)) : paid ? 'Rangée, bravo !' : due > 1 ? `${due} paies t’attendent` : `${k.weekly} pièce${k.weekly > 1 ? 's' : ''} t’attendent`}</small></span><span class="end ${paid && !pauseOf(cur) ? 'done' : ''}">${paid && !pauseOf(cur) ? I.check : I.chev}</span></button>
<button class="item" data-act="go" data-v="bourse"><span class="ic" style="background:var(--glass)">${I.die}</span><span><b>La bourse</b><small>${postOf(cur) === 'none' ? 'Tu ne joues pas la bourse' : rolled ? `Dé ${t.bourse.face} : ${pct(t.bourse.rate)}` : 'Lance le dé de la semaine'}</small></span><span class="end ${rolled ? 'done' : ''}">${rolled ? I.check : I.chev}</span></button>
<button class="item" data-act="go" data-v="recu"><span class="ic" style="background:color-mix(in srgb,var(--grow) 14%,transparent);color:var(--grow)">${I.gift}</span><span><b>J’ai reçu de l’argent</b><small>Un cadeau, un anniversaire ?</small></span><span class="end">${I.chev}</span></button>
<button class="item" data-act="go" data-v="carnet"><span class="ic" style="background:var(--glass)">${I.book}</span><span><b>Mon carnet</b><small>Tout ce qui est entré et sorti</small></span><span class="end">${I.chev}</span></button></div>`;
}

function payView(k, t) {
  const pz = pauseOf(cur);
  if (pz) return `<h2 class="title">Jour de paie</h2><section class="card paused"><h3>Ta paie est en pause</h3><p style="margin:0">${P().label} ${F.parents === 'parents' ? 'ont' : 'a'} mis ta paie en pause ${untilTxt(pz)}.</p>
${pz.reason ? `<p class="msg">« ${esc(pz.reason)} »</p>` : ''}<p class="soft" style="margin:10px 0 0">Ta tirelire reste à toi : elle continue de pousser avec la bourse, et tu peux toujours ranger l’argent que tu reçois.</p></section>`;
  const ow = owed(cur), blocked = ow.length === 0, bonusNow = r2(inv * F.match / 100), dis = ready ? '' : 'disabled';
  const coin = (act) => `<button class="coin" data-act="${act}" aria-label="Reprendre cette pièce" ${dis}>1&nbsp;€</button>`;
  const help = payHelp === null ? !t.paie : payHelp, m = String(F.match).replace('.', ',');
  return `<h2 class="title">Jour de paie</h2><p class="lead">${k.weekly} pièce${k.weekly > 1 ? 's' : ''} de 1 € à ranger, une par une.</p>
<section class="card help"><button class="helphead" data-act="payhelp" aria-expanded="${help}"><span>Comment ça marche ?</span>${help ? '<span class="soft small">Masquer</span>' : I.chev}</button>
${help ? `<ol class="howto"><li><b>Chaque semaine, tu reçois ta paie</b>${k.weekly} pièce${k.weekly > 1 ? 's' : ''} de 1 €, ton argent de poche.</li>
<li><b>Pour chaque pièce, tu choisis</b><span class="choice"><span><i class="dot" style="background:var(--purse)"></i><b>Dans mon porte-monnaie</b> : elle est à toi pour la dépenser comme tu veux. ${P().label} ${F.parents === 'parents' ? 'te la donnent' : 'te la donne'} en vrai, chaque semaine ou un peu plus tard.</span>
<span><i class="dot" style="background:var(--grow)"></i><b>Dans ma tirelire</b> : elle est placée pour pousser. ${P().aj.charAt(0).toUpperCase() + P().aj.slice(1)} ${m} % de bonus, et elle peut grossir chaque semaine avec la bourse.</span></span></li>
<li><b>Ta tirelire est mise de côté</b>Pour récupérer cet argent, tu choisis un projet et tu le présentes ${P().a}.</li></ol>` : ''}</section>
<section class="card">${blocked ? `<p class="result" style="text-align:center">Ta paie de la semaine est rangée.<br><span class="soft" style="font-size:17px">Rendez-vous lundi !</span></p>` : `
<p class="result" style="margin:0 0 4px">Paie ${weekTxt(ow[0])}</p>${ow.length > 1 ? `<p class="msg" style="margin-top:6px">Tu as ${ow.length} paies à ranger. On commence par la plus ancienne.</p>` : ''}
<div class="tray" aria-label="Pièces à ranger">${Array.from({ length: tray }, () => '<span class="coin">1&nbsp;€</span>').join('') || '<span class="soft">Toutes les pièces sont rangées !</span>'}</div>
<div class="moves"><button class="btn ghost" data-act="toPig" ${tray && ready ? '' : 'disabled'}>Dans mon porte-monnaie</button><button class="btn gr" data-act="toGrow" ${tray && ready ? '' : 'disabled'}>Dans ma tirelire</button></div>
<div class="zones"><div class="zone"><strong>Mon porte-monnaie : ${f(dep)}</strong>${Array.from({ length: dep }, () => coin('backPig')).join('')}</div>
<div class="zone gz"><strong class="g">Ma tirelire : ${f(inv)}</strong>${Array.from({ length: inv }, () => coin('backGrow')).join('')}${inv ? `<span class="chip">+${f(bonusNow)}</span>` : ''}</div></div>
<div class="row"><button class="btn full" data-act="pay" ${tray === 0 && ready ? '' : 'disabled'}>${tray ? `Encore ${tray} pièce${tray > 1 ? 's' : ''} à ranger` : 'Valider ma paie'}</button></div>
<p class="soft small" style="margin:6px 0 0;text-align:center">Touche une pièce rangée pour la reprendre.</p>`}</section>`;
}

function giftView(k) {
  const dis = ready ? '' : 'disabled';
  return `<h2 class="title">J’ai reçu de l’argent</h2><p class="lead">Range-le comme ta paie : dans ton porte-monnaie pour le dépenser, ou dans ta tirelire pour le faire pousser${gm() > 0 ? ` (+${String(gm()).replace('.', ',')} % de bonus ${P().de})` : ''}.</p>
<section class="card"><div class="grid2"><label>Combien (€)<input id="g-amount" type="text" inputmode="decimal" autocomplete="off" data-f="gamount" value="${esc(form.gamount)}" placeholder="Ex. : 10"></label>
<label>De qui ?<input id="g-from" type="text" autocomplete="off" maxlength="40" data-f="gfrom" value="${esc(form.gfrom)}" placeholder="Mamie, un anniversaire…"></label></div>
<div class="list" style="margin-top:16px"><button class="btn ghost" data-act="gift" data-r="0" ${dis}>Tout dans mon porte-monnaie</button><button class="btn gold" data-act="gift" data-r="0.5" ${dis}>Moitié porte-monnaie, moitié tirelire</button><button class="btn gr" data-act="gift" data-r="1" ${dis}>Tout dans ma tirelire</button></div></section>`;
}

function postureCard(p, sel, start, own) {
  const d = POST[p], r = simYear(p, start);
  return `<button class="post ${sel ? 'on' : ''}" data-act="posture" data-n="${p}" aria-pressed="${sel}">
<span class="ph"><b>${d.name}</b>${sel ? `<span class="tag">Ma stratégie</span>` : ''}</span><span class="pt">${d.txt}</span>
${p === 'none' ? `<span class="pr">Dans 1 an : <b>${f(start)}</b>, ni plus ni moins.</span>`
  : `<span class="pfaces">${d.faces.map(v => `<i class="${v < 0 ? 'neg' : v > 0 ? 'g' : ''}">${pct(v)}</i>`).join('')}</span>
<span class="pr">Dans 1 an, ${own ? 'avec tes' : 'pour'} ${f(start)} : <b>${f(r.mid)}</b> en moyenne. 8 fois sur 10 entre ${f(r.lo)} et ${f(r.hi)}.</span>
<span class="pr ${r.loss >= 0.15 ? 'neg' : 'soft'}">Finir l’année en perte : ${lossTxt(r.loss)}${r.loss >= 0.15 ? ` (jusqu’à ${f(r.worst)} dans le pire des cas)` : ''}.</span>`}
<span class="soft small">${d.like}</span></button>`;
}
function bourseView(k, t) {
  const p = postOf(cur), rolled = sameWeek(t.bourse && t.bourse.d), recent = t.rolls.slice(-8).reverse();
  const own = t.total >= 20, start = own ? r2(t.total) : 100;
  const pays = F.parents === 'parents' || F.parents === 'papamaman' ? 'nt' : '';
  return `<h2 class="title">La bourse de la semaine</h2><p class="lead">Une fois par semaine, un dé fait monter ou baisser ta tirelire. C’est un jeu : ce que ton argent gagne ici, c’est ${P().label.toLowerCase()} qui le paie${pays}.</p>
<section class="card dicebox">${p === 'none' ? `<p class="result">Tu ne joues pas la bourse.</p><p style="margin:0">Ta tirelire ne bouge pas : pas de gain, pas de perte. Tu peux changer d’avis quand tu veux, juste en dessous.</p>`
  : `<p class="soft small" style="margin:0">Ta stratégie : <b>${POST[p].name}</b></p><div id="die">${die(rolled ? t.bourse.face : 6, 132)}</div>
${rolled ? `<p class="result">Dé ${t.bourse.face} : ${t.bourse.rate < 0 ? 'semaine difficile' : t.bourse.rate === 0 ? 'semaine calme' : 'belle semaine'} !</p><p style="margin:0">Ta tirelire a ${t.bourse.gain < 0 ? 'perdu' : 'gagné'} <b class="${t.bourse.gain < 0 ? 'neg' : 'g'}">${f(Math.abs(t.bourse.gain))}</b>. Prochain lancer lundi.</p>`
    : t.total > 0 ? `<button class="btn full" data-act="roll" ${ready ? '' : 'disabled'}>Lancer le dé</button>` : `<p style="margin:0">Fais d’abord pousser quelques pièces : le dé agit sur ce qu’il y a dans ta tirelire.</p>`}
${recent.length ? `<div class="recent">${recent.map(e => `<span class="${e.rate < 0 ? 'neg' : e.rate > 0 ? 'g' : ''}">${pct(e.rate)}</span>`).join('')}</div>` : ''}`}
</section>
<h3 class="sec">Choisis ta stratégie</h3><p class="lead">Plus tu prends de risques, plus tu peux gagner… ou perdre. ${own ? 'Calculé avec ce qu’il y a dans ta tirelire, si tu n’ajoutes rien.' : 'Exemple pour 100 € placés pendant 1 an.'}</p>
<div class="list">${Object.keys(POST).map(q => postureCard(q, q === p, start, own)).join('')}</div>
<p class="soft small" style="margin:10px 4px 0">${rolled && p !== 'none' ? 'Un changement de stratégie comptera pour le prochain lancer. ' : ''}Les pourcentages du jeu sont plus généreux que la réalité, pour qu’on voie l’effet plus vite.</p>`;
}

function futurView(k, t) {
  if (projInv[cur] === undefined) { const p = t.pays.slice(-8); projInv[cur] = p.length ? Math.round(p.reduce((a, b) => a + b, 0) / p.length) : k.weekly; }
  projInv[cur] = Math.max(0, Math.min(500, projInv[cur]));
  const pts = project(cur, projInv[cur]);
  if (!pts.length) return `<h2 class="title">Ton futur</h2><section class="card"><p>Tu as 18 ans : le trésor est à toi !</p></section>`;
  if (!pts.some(p => p.age === sel[cur])) sel[cur] = pts[pts.length - 1].age;
  const max = Math.max(1, ...pts.map(p => p.total)), Pt = pts.find(p => p.age === sel[cur]);
  const bars = pts.map(p => { const pos = p.own + p.bonus + Math.max(0, p.gains) || 1, s = v => (Math.max(0, v) / pos * 100).toFixed(2);
    return `<button class="bar ${p.age === sel[cur] ? 'on' : ''}" data-act="bar" data-age="${p.age}" aria-label="À ${p.age} ans : ${f(p.total)}"><span class="area"><span class="stk" style="height:${(p.total / max * 100).toFixed(2)}%"><i style="height:${s(p.own)}%;background:var(--kid)"></i><i style="height:${s(p.bonus)}%;background:var(--gold)"></i><i style="height:${s(p.gains)}%;background:var(--grow)"></i></span></span><span class="age">${p.age}</span></button>`; }).join('');
  const full = projInv[cur] !== k.weekly ? project(cur, k.weekly).find(p => p.age === sel[cur]) : null;
  const quick = [...new Set([k.weekly, 10, 20, 50])].sort((a, b) => a - b);
  return `<h2 class="title">Et si tu continuais jusqu’à 18 ans ?</h2><p class="lead">Touche une barre pour voir ton trésor à cet âge.</p>
<section class="card"><div class="step">Je fais pousser <button data-act="pm" aria-label="Moins">−</button><span class="n">${projInv[cur]} €</span><button data-act="pp" aria-label="Plus">+</button> par semaine</div>
<div class="pills">${quick.map(n => `<button class="pill" data-act="pset" data-n="${n}" aria-pressed="${projInv[cur] === n}">${n === k.weekly ? `Ma paie (${n} €)` : n + ' €'}</button>`).join('')}</div>
${projInv[cur] > k.weekly ? `<p class="soft small" style="margin:10px 0 0">C’est plus que ton argent de poche : il faudrait y ajouter l’argent que tu reçois (cadeaux, anniversaires, petits services).</p>` : ''}
<div class="bars" style="grid-template-columns:repeat(${pts.length},minmax(0,1fr))">${bars}</div>
<p class="cap">À <b>${Pt.age} ans</b>, ta tirelire contiendrait <b>${f(Pt.total)}</b> : ${f(Pt.own)} de ton argent, ${f(Pt.bonus)} de bonus ${P().de} et <b class="g">${f(Math.max(0, Pt.gains))} gagnés tout seuls</b>.</p>
<p class="soft" style="margin:0">Regarde le vert : plus tu attends, plus il grossit vite, parce que ce que ton argent a gagné se met à gagner lui aussi.${full ? ` Avec ta paie de ${k.weekly} € chaque semaine, tu aurais ${f(full.total)} à ${full.age} ans.` : ''}</p>
<p class="soft small" style="margin:8px 0 0">${postOf(cur) === 'none' ? 'Tu ne joues pas la bourse : seuls ton argent et le bonus comptent.' : `Calcul fait avec la moyenne de ta stratégie ${POST[postOf(cur)].name} (${pct(r2(meanOf(cur)))} par semaine). Le vrai résultat dépendra de tes lancers.`}</p></section>`;
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
${reached ? `<section class="card celebrate"><h3>C’est pépite ! Objectif atteint</h3><p style="margin:0">Prépare ta présentation ${P().a} : pourquoi tu le veux, combien il coûte, ce qu’il va t’apporter. S’ils sont convaincus, ils débloqueront ton argent.</p></section>` : ''}
<section class="card"><h3>Les paliers</h3><ul class="log">${MS.map(m => { const v = r2(g.budget * m), ok = have >= v; return `<li><span class="${ok ? 'g' : 'soft'}" style="width:26px;flex:none">${ok ? I.check : '○'}</span><span>${m === 1 ? 'Objectif complet' : 'Palier ' + m * 100 + ' %'} : ${f(v)}</span><b class="${ok ? 'g' : 'soft'}">${ok ? 'atteint' : 'encore ' + f(v - have)}</b></li>`; }).join('')}</ul></section>
<div class="row"><button class="btn ghost sm" data-act="goaledit">Modifier</button><button class="btn ghost sm" data-act="goaldrop">${goalDropArm ? 'Confirmer l’abandon' : 'Abandonner ce projet'}</button></div>${doneHtml}`;
}

function carnetView(k) {
  const ev = evs(cur).slice(-40).reverse().map(e => {
    if (e.t === 'paie') return `<li><time>${dateFr(e.d)}</time><span>Paie : ${f(e.inv)} placés, ${f(e.dep)} dans le porte-monnaie</span><b class="g">+${f(e.inv + e.bonus)}</b></li>`;
    if (e.t === 'recu') return `<li><time>${dateFr(e.d)}</time><span>Reçu${e.from ? ' de ' + esc(e.from) : ''} : ${f(e.inv)} placés, ${f(e.dep)} dans le porte-monnaie</span><b class="g">+${f(e.inv + e.bonus)}</b></li>`;
    if (e.t === 'bourse') return `<li><time>${dateFr(e.d)}</time><span>Bourse : dé ${e.face} (${pct(e.rate)})</span><b class="${e.gain < 0 ? 'neg' : 'g'}">${e.gain < 0 ? '−' : '+'}${f(Math.abs(e.gain))}</b></li>`;
    if (e.t === 'posture') return `<li><time>${dateFr(e.d)}</time><span>Stratégie de bourse : ${POST[e.p] ? POST[e.p].name : e.p}</span><b class="soft">—</b></li>`;
    if (e.t === 'pause') return `<li><time>${dateFr(e.d)}</time><span>Paie mise en pause${e.reason ? ' : ' + esc(e.reason) : ''}</span><b class="soft">—</b></li>`;
    if (e.t === 'reprise') return `<li><time>${dateFr(e.d)}</time><span>Paie reprise</span><b class="soft">—</b></li>`;
    if (e.t === 'donne') return `<li><time>${dateFr(e.d)}</time><span>Porte-monnaie reçu en vrai</span><b class="soft">${f(e.amount)}</b></li>`;
    if (e.t === 'vire') return `<li><time>${dateFr(e.d)}</time><span>Mis en lieu sûr ${P().de}</span><b class="soft">${f(e.amount)}</b></li>`;
    return `<li><time>${dateFr(e.d)}</time><span>Projet : ${esc(e.label)}</span><b class="neg">−${f(e.amount)}</b></li>`;
  }).join('') || '<li class="soft">Rien encore : ta première paie arrive bientôt.</li>';
  return `<h2 class="title">Mon carnet</h2><p class="lead">Tout ce qui est entré et sorti de ta tirelire.</p><section class="card"><ul class="log">${ev}</ul></section>`;
}

function pinView() {
  return `<section class="pin"><h2 class="title">Espace parents</h2><p class="lead">Tape le code parents.</p>
<div class="dots">${[0, 1, 2, 3].map(i => `<i class="${i < pinBuf.length ? 'on' : ''}"></i>`).join('')}</div>${pinBad ? '<p class="neg" style="margin:0;font-weight:800">Mauvais code</p>' : ''}
<div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="key" data-act="pin" data-n="${n}">${n}</button>`).join('')}<span></span><button class="key" data-act="pin" data-n="0">0</button><button class="key" data-act="pinback" style="font-size:16px">Effacer</button></div></section>`;
}

function parentsView() {
  if (lock && !pinOk) return pinView();
  const dis = ready ? '' : 'disabled', K = kidOf(cur), last = evs(cur)[evs(cur).length - 1];
  const lastTxt = last ? ({ paie: 'la paie du ', bourse: 'le lancer du ', recu: 'l’argent reçu le ', vire: 'le virement du ', donne: 'le porte-monnaie donné le ', projet: 'le projet du ', pause: 'la pause du ', reprise: 'la reprise du ', posture: 'le choix de stratégie du ' }[last.t] || '') + dateFr(last.d) : '';
  const pk = form.pkid && kidOf(form.pkid) ? form.pkid : cur;
  return `<h2 class="title">Espace parents</h2>
${lock ? `<div class="msg">Cet appareil est verrouillé sur ${esc(K.name)}.<div class="row" style="margin-top:8px"><button class="btn sm" data-act="unlockdev">Déverrouiller l’appareil</button></div></div>` : ''}
<section class="card"><h3>L’argent, en vrai</h3>
<p class="soft small" style="margin:0">Pépite tient les comptes, et vous réglez quand vous voulez : chaque semaine, une fois par mois… Deux compteurs par enfant :</p>
<ul class="plain small" style="margin-bottom:6px"><li><b>Porte-monnaie à donner</b> : l’argent de poche qu’il a choisi de dépenser. Donnez-le-lui, puis touchez « C’est donné ».</li><li><b>Tirelire à mettre de côté</b> : l’argent placé, à garder en lieu sûr (Livret A à son nom, compte épargne, boîte fermée) pour qu’il soit là le jour d’un projet. Puis touchez « C’est rangé ».</li></ul>
${kids().map(k => { const T = tot(k.id); return `<div style="padding:12px 0;border-bottom:1px solid var(--line)"><b>${esc(k.name)}</b>
<div class="ledger"><span><i class="dot" style="background:var(--purse)"></i>Porte-monnaie à donner</span><b>${f(T.purseDue)}</b><button class="btn ghost sm" data-act="donne" data-k="${k.id}" ${T.purseDue > 0 && ready ? '' : 'disabled'}>C’est donné</button></div>
<div class="ledger"><span><i class="dot" style="background:var(--grow)"></i>Tirelire à mettre de côté</span><b class="${T.due > 0 ? 'g' : ''}">${f(Math.max(0, T.due))}</b><button class="btn gr sm" data-act="vire" data-k="${k.id}" ${T.due > 0 && ready ? '' : 'disabled'}>C’est rangé</button></div>
<p class="soft small" style="margin:4px 0 0">Déjà mis de côté au total : ${f(T.livret)}</p>
${T.due < 0 ? `<p class="soft small" style="margin:2px 0 0">Vous avez ${f(-T.due)} d’avance après de mauvaises semaines en bourse : rien à ajouter.</p>` : ''}
</div>`; }).join('')}</section>
<section class="card"><h3>Mettre la paie en pause</h3><p class="soft small" style="margin:0">En cas de conflit, la paie peut être suspendue. Les semaines en pause ne sont pas rattrapées. La tirelire, elle, reste à l’enfant : elle continue de pousser et il peut toujours y ranger l’argent reçu.</p>
${kids().map(k => { const pz = pauseOf(k.id); return `<div style="padding:12px 0;border-bottom:1px solid var(--line)"><b>${esc(k.name)}</b>${pz ? `<p style="margin:2px 0 0">En pause ${untilTxt(pz)}${pz.reason ? ` · « ${esc(pz.reason)} »` : ''}</p><div class="row" style="margin-top:8px"><button class="btn gr sm" data-act="presume" data-k="${k.id}" ${dis}>Reprendre la paie maintenant</button></div>`
  : `<div class="pills">${[['1', 'Cette semaine'], ['2', '2 semaines'], ['0', 'Jusqu’à nouvel ordre']].map(([v, l]) => `<button class="pill" data-act="pdur" data-n="${v}" aria-pressed="${form.pdur === v}">${l}</button>`).join('')}</div>
<label>Message pour ${esc(k.name)} (facultatif)<input id="pr-${k.id}" type="text" autocomplete="off" maxlength="80" data-f="preason:${k.id}" value="${esc(form['preason:' + k.id] || '')}" placeholder="Ex. : on en reparle ensemble dimanche"></label>
<div class="row" style="margin-top:8px"><button class="btn ghost sm" data-act="ppause" data-k="${k.id}" ${dis}>Mettre la paie ${de(k.name)} en pause</button></div>`}</div>`; }).join('')}</section>
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
<section class="card"><h3>Les règles du jeu</h3><p class="soft small" style="margin:0">Une paie par semaine, du lundi au dimanche. Si vous la versez en retard, les paies non rangées restent disponibles ${BACKLOG} semaines, puis elles sont perdues. </p><p class="soft small" style="margin:6px 0 0">Les bonus ne s’appliquent qu’à l’argent placé (les pièces que l’enfant fait pousser), jamais à celui qui va dans le porte-monnaie.</p>
<label>Les enfants vous appellent<select data-set="parents">${Object.entries(PAR).filter(([k]) => k !== 'papamaman' || F.parents === k).map(([k, v]) => `<option value="${k}" ${F.parents === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
<div class="grid2"><label>Bonus argent de poche (%)<input id="r-m" type="number" min="0" max="100" value="${F.match}" data-set="match"></label>
<label>Bonus argent reçu (%)<input id="r-g" type="number" min="0" max="100" value="${gm()}" data-set="giftMatch"></label></div>
<p style="margin:14px 0 4px;font-weight:800">La bourse : stratégie de chaque enfant</p><p class="soft small" style="margin:0">L’enfant la choisit lui-même dans l’onglet Bourse ; vous pouvez aussi la changer ici. En moyenne par semaine : ${Object.values(POST).map(d => `${d.short} ${pct(r2(d.faces.reduce((a, b) => a + b, 0) / 6))}`).join(' · ')}.</p>
${kids().map(k => `<label>${esc(k.name)}<select data-set="kpost:${k.id}">${Object.entries(POST).map(([q, d]) => `<option value="${q}" ${postOf(k.id) === q ? 'selected' : ''}>${d.name}</option>`).join('')}</select></label>`).join('')}</section>
<section class="card"><h3>Mode enfant</h3><p class="soft small" style="margin:0">Verrouille cet appareil sur un enfant : plus d’accès aux autres bocaux ni à l’espace parents, une paie et un lancer par semaine.</p>
<label>Code parents (4 chiffres)<input id="r-pin" class="secret" type="text" inputmode="numeric" autocomplete="off" maxlength="4" value="${esc(form.newpin || F.pin || '')}" data-set="pin"></label>
<div class="row">${kids().map(k => `<button class="btn ghost sm" data-act="lock" data-k="${k.id}" ${/^\d{4}$/.test(F.pin || '') ? '' : 'disabled'}>Verrouiller sur ${esc(k.name)}</button>`).join('')}</div></section>
<section class="card"><h3>Corriger une erreur</h3>
${last ? `<div class="row" style="margin-top:4px"><button class="btn ghost sm" data-act="undo" ${dis}>${undoArm ? 'Confirmer : annuler ' + lastTxt : 'Annuler la dernière opération ' + de(K.name)}</button></div>
<div class="row"><button class="btn danger sm" data-act="resetopen" ${dis}>Vider la tirelire et tout remettre à zéro pour ${esc(K.name)}</button></div>` : `<p class="soft">Rien à annuler pour ${esc(K.name)}.</p>`}</section>
<section class="card"><h3>Apparence</h3><p class="soft small" style="margin:0">Réglage propre à cet appareil.</p>
<div class="pills">${[['light', 'Clair'], ['dark', 'Sombre']].map(([v, l]) => `<button class="pill" data-act="theme" data-n="${v}" aria-pressed="${theme === v}">${l}</button>`).join('')}</div></section>
<section class="card"><h3>Compte</h3><p class="soft small" style="margin:0">Connecté avec ${esc(user.email || '')}.</p><div class="row"><button class="btn ghost sm" data-act="logout">Déconnecter cet appareil</button></div></section>`;
}

function resetModal() {
  const k = kidOf(resetFor); if (!k) return '';
  const T = tot(k.id), g = goalOf(k.id), n = evs(k.id).length, okName = form.resetname.trim().toLowerCase() === k.name.toLowerCase();
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="rt"><div class="sheet">
<h3 id="rt">Tout remettre à zéro pour ${esc(k.name)} ?</h3>
<p style="margin:6px 0 0">Cette action efface définitivement :</p>
<ul style="margin:6px 0 0;padding-left:20px"><li>la tirelire : <b>${f(Math.max(0, T.total))}</b></li><li>tout l’historique : <b>${n} opération${n > 1 ? 's' : ''}</b></li>${g ? `<li>le projet en cours : <b>${esc(g.name)}</b></li>` : ''}</ul>
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

let lastKey = '';
function render() {
  if (rolling) return;
  let html, color = '#2f5fe0', key;
  if (user === undefined) { html = splash(); key = 'splash'; }
  else if (!user) { html = loginView(); key = 'login'; }
  else if (!famLoaded) { html = splash('Ouverture de la banque…'); key = 'splash2'; }
  else if (!F) { key = 'ob' + (ob ? ob.step : 1); if (!ob) { ob = newOb(); tryLegacy(); } html = obView(); color = ob.step === 2 && ob.kids[0] ? ob.kids[0].color : PAL[1]; }
  else { html = mainView(); key = 'main:' + view + ':' + cur + ':' + (lock && !pinOk ? 'pin' : '') + (resetFor ? ':modal' : ''); const k = kidOf(cur); if (k) color = k.color; }
  document.documentElement.style.setProperty('--kid', color);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', color);
  const app = document.getElementById('app');
  // Changement d'écran : on remplace tout ; sinon on ne met à jour que ce qui change (clics et saisies préservés).
  if (key !== lastKey) { app.innerHTML = html; lastKey = key; }
  else Idiomorph.morph(app, html, { morphStyle: 'innerHTML', ignoreActiveValue: true });
}

/* ---------- données ---------- */
const chains = {};
function queue(key, fn) { chains[key] = (chains[key] || Promise.resolve()).then(fn).catch(() => { status = 'Enregistrement impossible : vérifie ta connexion.'; render(); }); return chains[key]; }
function saveF() { const body = clone(F); lastF = JSON.stringify(body); return queue('F', () => setDoc(doc(fdb, 'familles', user.uid), body)); }
function saveK(id) { const body = { events: clone(evs(id)), goal: goalOf(id) ? clone(goalOf(id)) : null, pause: PAUSE[id] ? clone(PAUSE[id]) : null }; lastK[id] = JSON.stringify(body); return queue(id, () => setDoc(doc(fdb, 'familles', user.uid, 'enfants', id), body)); }
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
      if (snap.exists()) { const d = snap.data(), body = { events: d.events || [], goal: d.goal || null, pause: d.pause || null }, s = JSON.stringify(body); if (s !== lastK[id]) { lastK[id] = s; EV[id] = clone(body.events); GOAL[id] = body.goal ? clone(body.goal) : null; PAUSE[id] = body.pause ? clone(body.pause) : null; ch = true; } }
      if (!snap.metadata.fromCache && !KL[id]) { KL[id] = true; ch = true; }
      if (updateReady()) ch = true;
      if (ch) render();
    }, () => { status = 'La banque ne répond plus : relance l’application.'; render(); });
  }
  for (const id of Object.keys(kidUnsubs)) if (!ids.includes(id)) { kidUnsubs[id](); delete kidUnsubs[id]; delete EV[id]; delete GOAL[id]; delete PAUSE[id]; delete KL[id]; delete lastK[id]; }
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
  for (const o of [EV, GOAL, PAUSE, KL, lastK]) for (const k of Object.keys(o)) delete o[k];
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
  if (!ready || rolling || postOf(cur) === 'none' || sameWeek(t0.bourse && t0.bourse.d)) return;
  rolling = true;
  const el = document.getElementById('die'), face = 1 + Math.floor(Math.random() * 6), quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0;
  const spin = quick || !el ? null : setInterval(() => { el.innerHTML = die(1 + Math.floor(Math.random() * 6), 132); el.style.transform = `rotate(${(i++ % 2 ? -1 : 1) * 16}deg) scale(1.08)`; }, 85);
  setTimeout(() => {
    if (spin) clearInterval(spin);
    if (el) el.style.transform = '';
    const before = tot(cur).total, rate = facesOf(cur)[face - 1], gain = r2(Math.max(0, before) * rate / 100);
    EV[cur] = [...evs(cur), { t: 'bourse', d: iso(), face, rate, gain }];
    rolling = false; saveK(cur);
    sayMs(before, rate > 0 ? `Dé ${face} : +${f(gain)} dans ta tirelire !` : rate < 0 ? `Dé ${face} : ta tirelire perd ${f(Math.abs(gain))}.` : `Dé ${face} : rien ne bouge cette semaine.`, rate < 0 ? 'Ça arrive, la semaine prochaine sera peut-être meilleure.' : '');
    render();
  }, quick ? 30 : 1300);
}
function doGift(ratio) {
  const amt = r2(num(form.gamount));
  if (!(amt > 0)) { say('Écris d’abord combien tu as reçu.'); return; }
  if (amt > 100000) { say('Montant trop élevé : 100 000 € maximum.'); return; }
  const inv2 = r2(amt * ratio), dep2 = r2(amt - inv2), bonus = r2(inv2 * gm() / 100), from = form.gfrom.trim();
  const before = tot(cur).total;
  EV[cur] = [...evs(cur), { t: 'recu', d: iso(), from, inv: inv2, dep: dep2, bonus }];
  saveK(cur);
  sayMs(before, inv2 ? `Super ! ${f(inv2 + bonus)} rejoignent ta tirelire.` : `${f(dep2)} dans ton porte-monnaie.`, inv2 ? `${dep2 ? `Garde ${f(dep2)} dans ton porte-monnaie et donne` : 'Donne'} ${f(inv2)} ${P().a} pour qu’ils soient mis en lieu sûr.` : '');
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
    const fam = { v: 1, parents: ob.parents, kids: ob.kids.map(k => ({ id: k.id, start: iso(), name: k.name, birth: k.birth, weekly: k.weekly, color: k.color, posture: ob.dice })), match: ob.match, giftMatch: ob.giftMatch, dice: POST[ob.dice].faces.slice(), diceName: ob.dice, defaultPosture: ob.dice, pin: ob.pin, created: iso() };
    await Promise.all(fam.kids.map(k => setDoc(doc(fdb, 'familles', user.uid, 'enfants', k.id), { events: (ob.legacy && ob.legacy[k.id]) || [], goal: null, pause: null })));
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
      const ow = owed(cur);
      if (!ready || tray || pauseOf(cur) || !ow.length) break;
      const bonus = r2(inv * F.match / 100);
      const before = t.total;
      EV[cur] = [...evs(cur), { t: 'paie', d: iso(), w: new Date(ow[0]).toISOString(), inv, dep, bonus }];
      saveK(cur);
      sayMs(before, inv ? `Bravo ! ${f(inv + bonus)} rejoignent ta tirelire.` : 'Paie rangée : tout est dans ton porte-monnaie.', dep ? `${f(dep)} pour ton porte-monnaie : ${P().label.toLowerCase()} ${F.parents === 'parents' ? 'te les donneront' : 'te les donnera'}.` : '');
      resetCoins(); if (ow.length <= 1) { view = 'home'; window.scrollTo(0, 0); } break;
    }
    case 'gift': if (ready) doGift(parseFloat(b.dataset.r)); break;
    case 'payhelp': payHelp = !(payHelp === null ? !tot(cur).paie : payHelp); break;
    case 'pm': projInv[cur] = Math.max(0, projInv[cur] - (projInv[cur] > 20 ? 5 : 1)); break;
    case 'pp': projInv[cur] = Math.min(500, projInv[cur] + (projInv[cur] >= 20 ? 5 : 1)); break;
    case 'pset': projInv[cur] = +b.dataset.n; break;
    case 'bar': sel[cur] = +b.dataset.age; break;
    case 'pin':
      if (pinBuf.length < 4) pinBuf += b.dataset.n; pinBad = false;
      if (pinBuf.length === 4) { if (pinBuf === F.pin) pinOk = true; else pinBad = true; pinBuf = ''; }
      break;
    case 'pinback': pinBuf = pinBuf.slice(0, -1); break;
    case 'unlockdev': lock = null; pinOk = false; try { localStorage.removeItem('pepite-lock'); } catch (e) {} say('Appareil déverrouillé.'); break;
    case 'lock': if (/^\d{4}$/.test(F.pin || '')) { lock = cur = k; pinOk = false; view = 'home'; resetCoins(); try { localStorage.setItem('pepite-lock', lock); } catch (e) {} window.scrollTo(0, 0); say(`Appareil réservé à ${esc(kidOf(k).name)}.`, 'Le code parents rouvre tout.'); } break;
    case 'donne': if (ready) { const T = tot(k); if (T.purseDue > 0) { EV[k] = [...evs(k), { t: 'donne', d: iso(), amount: T.purseDue }]; saveK(k); say(`${f(T.purseDue)} donnés à ${esc(kidOf(k).name)} pour son porte-monnaie.`, 'Le compteur repart de zéro.'); } } break;
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
      say(g0 ? 'Projet mis à jour.' : `C’est parti pour « ${esc(name)} » !`, g0 ? '' : 'Ta tirelire affiche maintenant tes paliers.');
      break;
    }
    case 'goaldrop': if (ready) { if (!goalDropArm) goalDropArm = true; else { GOAL[cur] = null; saveK(cur); goalDropArm = false; say('Projet abandonné.', 'Tu peux en choisir un autre quand tu veux.'); } } break;
    case 'goalunlock': if (ready) { const g = goalOf(k), T = tot(k); if (g && T.total >= g.budget) { const amount = r2(g.budget), fromLivret = r2(Math.max(0, amount - Math.max(0, T.due))); EV[k] = [...evs(k), { t: 'projet', d: iso(), label: g.name, amount, fromLivret, goal: true }]; GOAL[k] = null; saveK(k); say(`« ${esc(g.name)} » débloqué : ${f(amount)} pour ${esc(kidOf(k).name)}.`, fromLivret > 0 ? `Reprenez ${f(fromLivret)} dans l’argent mis de côté.` : ''); } } break;
    case 'theme': theme = b.dataset.n; try { localStorage.setItem('pepite-theme', theme); } catch (e) {} applyTheme(); break;
    case 'pdur': form.pdur = b.dataset.n; break;
    case 'ppause': if (ready) { const n = +form.pdur, until = n ? new Date(wk(new Date()) + n * 7 * 864e5).toISOString() : null, reason = (form['preason:' + k] || '').trim().slice(0, 80); PAUSE[k] = { since: iso(), until, reason }; EV[k] = [...evs(k), { t: 'pause', d: iso(), until, reason }]; saveK(k); form['preason:' + k] = ''; say(`Paie ${de(kidOf(k).name)} en pause ${untilTxt(PAUSE[k])}.`); } break;
    case 'presume': if (ready) { PAUSE[k] = null; EV[k] = [...evs(k), { t: 'reprise', d: iso() }]; saveK(k); say(`La paie ${de(kidOf(k).name)} reprend.`); if (k === cur) resetCoins(); } break;
    case 'undo': if (ready) { if (!undoArm) undoArm = true; else { const lastEv = evs(cur)[evs(cur).length - 1]; if (lastEv && lastEv.t === 'pause') PAUSE[cur] = null; if (lastEv && lastEv.t === 'posture' && POST[lastEv.prev]) { kidOf(cur).posture = lastEv.prev; saveF(); } EV[cur] = evs(cur).slice(0, -1); saveK(cur); undoArm = false; say('Dernière opération annulée.'); } } break;
    case 'resetopen': resetFor = cur; form.resetname = ''; break;
    case 'resetclose': resetFor = null; form.resetname = ''; break;
    case 'resetdo': {
      const x = kidOf(resetFor);
      if (!ready || !x || form.resetname.trim().toLowerCase() !== x.name.toLowerCase()) break;
      EV[x.id] = []; GOAL[x.id] = null; saveK(x.id); if (x.id === cur) resetCoins();
      resetFor = null; form.resetname = ''; say(`La tirelire ${de(x.name)} est remise à zéro.`);
      break;
    }
    case 'kcolor': { const x = kidOf(k); if (x && ready) { x.color = b.dataset.c; saveF(); } break; }
    case 'kadd': if (ready) { const id = uid6(); const used = kids().map(z => z.color); F.kids.push({ id, start: iso(), posture: F.defaultPosture || 'equilibre', name: 'Nouvel enfant', birth: '2018-01-01', weekly: 3, color: PAL.find(c => !used.includes(c)) || PAL[0] }); EV[id] = []; KL[id] = true; saveK(id); saveF(); syncKids(); cur = id; say('Enfant ajouté : complétez sa fiche.'); } break;
    case 'kdel': if (ready) { if (delArm !== k) delArm = k; else { F.kids = F.kids.filter(z => z.id !== k); saveF(); queue('del' + k, () => deleteDoc(doc(fdb, 'familles', user.uid, 'enfants', k))); syncKids(); delArm = null; ensureCur(); say('Enfant supprimé.'); } } break;
    case 'posture': if (ready && POST[b.dataset.n] && postOf(cur) !== b.dataset.n) { const x = kidOf(cur), prev = postOf(cur); x.posture = b.dataset.n; saveF(); EV[cur] = [...evs(cur), { t: 'posture', d: iso(), p: b.dataset.n, prev }]; saveK(cur); say(b.dataset.n === 'none' ? 'Tu ne joues plus la bourse.' : `Stratégie ${POST[b.dataset.n].name} choisie !`, b.dataset.n === 'aventurier' ? 'Attention : tu peux gagner gros, mais aussi perdre.' : ''); } break;
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
  else if (key === 'kpost' && x && POST[v]) { const prev = postOf(id); if (prev !== v) { x.posture = v; saveF(); EV[id] = [...evs(id), { t: 'posture', d: iso(), p: v, prev }]; saveK(id); } }
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
