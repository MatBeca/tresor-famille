import { articles, features, lessons, bonusPlan, bonusVis } from './articles.js';
import { Idiomorph } from './vendor/idiomorph.esm.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, onSnapshot, setDoc, getDoc, deleteDoc, collection, collectionGroup, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig, CONTACT, ADMIN } from './config.js';
import { privacyHTML, PRIVACY_VERSION } from './legal.js';
import { MATS, matSVG, mystSVG } from './pepites.js';
const VERSION = '115'; // à garder égal au cache du service worker (sw.js)

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
const r50 = v => Math.sign(v) * Math.round(Math.abs(v) * 2) / 2 || 0; // le dé ne compte qu'en pièces de 50 centimes
const eurS = v => { const a = Math.abs(v); return a === 0 ? 'rien' : (v > 0 ? '+' : '−') + f(a); };
const pct = r => (r > 0 ? '+' : r < 0 ? '−' : '') + String(Math.abs(r)).replace('.', ',') + ' %';
const num = v => parseFloat(String(v).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.'));
const de = n => (/^[aeiouyéèêh]/i.test(n) ? 'd’' : 'de ') + esc(n);
function ageAt(birth, date) { const b = new Date(birth + 'T12:00:00'); let a = date.getFullYear() - b.getFullYear(); const m = date.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && date.getDate() < b.getDate())) a--; return a; }
const validBirth = b => /^\d{4}-\d{2}-\d{2}$/.test(b || '') && !isNaN(new Date(b)) && ageAt(b, new Date()) >= 3 && ageAt(b, new Date()) < 18;
const suggest = b => validBirth(b) ? Math.min(50, Math.max(1, 1.5 + 0.5 * (ageAt(b, new Date()) - 6))) : 2;

const PAL = ['#f0505a', '#2f6feb', '#8e5ce6', '#f07c00', '#e0438f', '#139fb5',
  '#7cc242', '#f7c600', '#38aef0', '#24408e', '#a3214f', '#8a5a35'];
const PALN = ['Rouge', 'Bleu', 'Violet', 'Orange', 'Rose', 'Turquoise', 'Vert pomme', 'Jaune', 'Bleu ciel', 'Bleu marine', 'Bordeaux', 'Chocolat'];
// Texte lisible sur la couleur de l'enfant : foncé sur les couleurs claires (jaune, vert pomme, ciel), blanc sinon.
// Couleur de « mon argent » dans les graphiques : celle de l'enfant, sauf si elle se confond avec le vert des gains ou l'or du bonus.
const OWN_ALT = '#5b5fd6';
const ownColor = c => { const n = parseInt((c || '#000000').slice(1), 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2, sat = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  let h = !d ? 0 : mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4); if (h < 0) h += 360;
  return sat > 0.35 && ((h >= 70 && h <= 175) || (h >= 25 && h <= 60 && sat > 0.6)) ? OWN_ALT : c; };
const onColor = c => { const n = parseInt(c.slice(1), 16), l = [n >> 16, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2] > 0.36 ? '#22203a' : '#fff'; };
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
// Paliers sans projet : le bocal se remplit jusqu'au palier, puis repart sur l'échelle suivante.
const CAPS = [20, 50, 100, 200, 500, 1000, 1500, 2000, 3500, 5000, 10000, 20000, 30000, 40000, 50000];
const PIPS = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]], 6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]] };
const NUGB = `<g transform=""><path d="M14 24 30 15 28 30Z" fill="#ffe68a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M30 15 46 17 42 32 28 30Z" fill="#fff4bd" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M46 17 58 30 42 32Z" fill="#ffd24a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M6 40 14 24 28 30 30 44Z" fill="#f7b52a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M28 30 42 32 30 44Z" fill="#ffcb3a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M58 30 56 46 42 32Z" fill="#e39a10" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M42 32 56 46 42 55 30 44Z" fill="#d08a00" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M6 40 30 44 20 54Z" fill="#eba216" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M30 44 42 55 20 54Z" fill="#b87400" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/></g><path transform="" d="M6 40 14 24 30 15 46 17 58 30 56 46 42 55 20 54Z" fill="none" stroke="#6e4400" stroke-width="3" stroke-linejoin="round"/><g transform=""><path d="M20 27 26 21" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M33 17.5Q33.81 21.19 37.5 22Q33.81 22.81 33 26.5Q32.19 22.81 28.5 22Q32.19 21.19 33 17.5Z" fill="#fff8d6" stroke="#6e4400" stroke-width="1.4" stroke-linejoin="round"/></g>`;
const NUGP = NUGB.replace('<path d="M33 17.5Q33.81 21.19 37.5 22Q33.81 22.81 33 26.5Q32.19 22.81 28.5 22Q32.19 21.19 33 17.5Z" fill="#fff8d6" stroke="#6e4400" stroke-width="1.4" stroke-linejoin="round"/>', ''); // sans l'étoile
const NUG = (cls, lbl) => `<svg class="${cls}" viewBox="2 8 60 52" ${lbl ? `role="img" aria-label="${lbl}"` : 'aria-hidden="true"'}>${NUGB}</svg>`;
const LOGO = NUG('logo');
const LOGOBIG = `<svg class="logo big" viewBox="0 14 124 50" aria-hidden="true"><g transform="translate(0 38) scale(.4)"><path d="M14 24 30 15 28 30Z" fill="#ffe68a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M30 15 46 17 42 32 28 30Z" fill="#fff4bd" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M46 17 58 30 42 32Z" fill="#ffd24a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M6 40 14 24 28 30 30 44Z" fill="#f7b52a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M28 30 42 32 30 44Z" fill="#ffcb3a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M58 30 56 46 42 32Z" fill="#e39a10" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M42 32 56 46 42 55 30 44Z" fill="#d08a00" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M6 40 30 44 20 54Z" fill="#eba216" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M30 44 42 55 20 54Z" fill="#b87400" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/></g><path transform="translate(0 38) scale(.4)" d="M6 40 14 24 30 15 46 17 58 30 56 46 42 55 20 54Z" fill="none" stroke="#6e4400" stroke-width="3" stroke-linejoin="round"/><g transform="translate(24 24.25) scale(.65)"><path d="M14 24 30 15 28 30Z" fill="#ffe68a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M30 15 46 17 42 32 28 30Z" fill="#fff4bd" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M46 17 58 30 42 32Z" fill="#ffd24a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M6 40 14 24 28 30 30 44Z" fill="#f7b52a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M28 30 42 32 30 44Z" fill="#ffcb3a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M58 30 56 46 42 32Z" fill="#e39a10" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M42 32 56 46 42 55 30 44Z" fill="#d08a00" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M6 40 30 44 20 54Z" fill="#eba216" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M30 44 42 55 20 54Z" fill="#b87400" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/></g><path transform="translate(24 24.25) scale(.65)" d="M6 40 14 24 30 15 46 17 58 30 56 46 42 55 20 54Z" fill="none" stroke="#6e4400" stroke-width="3" stroke-linejoin="round"/><g transform="translate(62 5) scale(1)"><path d="M14 24 30 15 28 30Z" fill="#ffe68a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M30 15 46 17 42 32 28 30Z" fill="#fff4bd" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M46 17 58 30 42 32Z" fill="#ffd24a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M6 40 14 24 28 30 30 44Z" fill="#f7b52a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M28 30 42 32 30 44Z" fill="#ffcb3a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M58 30 56 46 42 32Z" fill="#e39a10" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M42 32 56 46 42 55 30 44Z" fill="#d08a00" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M6 40 30 44 20 54Z" fill="#eba216" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M30 44 42 55 20 54Z" fill="#b87400" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/></g><path transform="translate(62 5) scale(1)" d="M6 40 14 24 30 15 46 17 58 30 56 46 42 55 20 54Z" fill="none" stroke="#6e4400" stroke-width="3" stroke-linejoin="round"/><g transform="translate(62 5) scale(1)"><path d="M20 27 26 21" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M33 17.5Q33.81 21.19 37.5 22Q33.81 22.81 33 26.5Q32.19 22.81 28.5 22Q32.19 21.19 33 17.5Z" fill="#fff8d6" stroke="#6e4400" stroke-width="1.4" stroke-linejoin="round"/></g></svg>`;
const WM = `<svg class="wm" role="img" aria-label="Pépite" viewBox="-10 -1010 2892 1260"><path d="M126 8Q81 8 62.0 -5.5Q43 -19 39.0 -40.5Q35 -62 35 -84V-600Q35 -622 39.0 -643.0Q43 -664 62.0 -677.5Q81 -691 127 -691H326Q364 -691 408.0 -675.5Q452 -660 491.5 -628.0Q531 -596 556.0 -548.0Q581 -500 581 -434Q581 -369 556.0 -321.0Q531 -273 491.5 -241.5Q452 -210 408.0 -194.5Q364 -179 325 -179H218V-83Q218 -61 214.0 -40.0Q210 -19 191.0 -5.5Q172 8 126 8ZM218 -362H326Q339 -362 356.0 -368.5Q373 -375 386.0 -391.0Q399 -407 399 -435Q399 -456 389.0 -472.5Q379 -489 362.5 -498.5Q346 -508 325 -508H218Z M883 20Q808 20 756.0 -4.5Q704 -29 672.0 -68.5Q640 -108 625.0 -154.0Q610 -200 610 -243Q610 -322 645.0 -382.0Q680 -442 742.0 -476.0Q804 -510 884 -510Q946 -510 990.0 -490.0Q1034 -470 1061.5 -439.0Q1089 -408 1102.0 -373.0Q1115 -338 1115 -308Q1115 -251 1087.0 -221.0Q1059 -191 1015 -191H802Q806 -175 818.5 -163.5Q831 -152 850.0 -145.5Q869 -139 891 -139Q913 -139 930.0 -141.5Q947 -144 959.5 -148.0Q972 -152 982.5 -156.0Q993 -160 1001.5 -162.5Q1010 -165 1018 -165Q1036 -165 1051.0 -153.0Q1066 -141 1078 -117Q1085 -104 1088.0 -92.5Q1091 -81 1091 -71Q1091 -41 1066.5 -21.0Q1042 -1 996.0 9.5Q950 20 883 20ZM802 -285H914Q928 -285 934.5 -291.0Q941 -297 941 -309Q941 -322 933.5 -331.0Q926 -340 913.0 -344.5Q900 -349 882 -349Q858 -349 840.0 -339.5Q822 -330 812.5 -315.5Q803 -301 802 -285Z M1430 -3Q1381 -3 1345 -23Q1340 -26 1335 -29V132Q1337 154 1332.5 174.5Q1328 195 1309.0 208.0Q1290 221 1245 221Q1201 221 1182.0 208.0Q1163 195 1159.5 175.0Q1156 155 1156 133V-410Q1156 -432 1159.5 -452.0Q1163 -472 1181.5 -485.5Q1200 -499 1244 -499Q1279 -499 1302 -490Q1321 -482 1331 -467Q1339 -473 1347 -478Q1382 -498 1430 -498Q1474 -498 1515.5 -477.0Q1557 -456 1590.0 -420.5Q1623 -385 1642.0 -340.0Q1661 -295 1661 -247Q1661 -197 1642.0 -152.5Q1623 -108 1590.5 -74.5Q1558 -41 1516.5 -22.0Q1475 -3 1430 -3ZM1406 -173Q1426 -173 1442.5 -183.0Q1459 -193 1469.0 -209.5Q1479 -226 1479 -245Q1479 -265 1469.5 -281.5Q1460 -298 1443.5 -307.5Q1427 -317 1407.0 -317.0Q1387 -317 1370.5 -307.0Q1354 -297 1344.5 -281.0Q1335 -265 1335 -245Q1335 -226 1345.0 -209.5Q1355 -193 1371.0 -183.0Q1387 -173 1406 -173Z M1789 9Q1744 9 1725.0 -4.5Q1706 -18 1702.5 -39.0Q1699 -60 1699 -82V-408Q1699 -430 1703.0 -450.5Q1707 -471 1726.0 -484.5Q1745 -498 1790 -498Q1835 -498 1853.5 -484.5Q1872 -471 1876.0 -450.0Q1880 -429 1880 -406V-81Q1880 -59 1876.0 -38.0Q1872 -17 1853.5 -4.0Q1835 9 1789 9Z M2210 9Q2157 9 2118.0 -3.0Q2079 -15 2053.5 -40.0Q2028 -65 2015.5 -103.0Q2003 -141 2003 -192V-319H1978Q1944 -321 1931.0 -341.0Q1918 -361 1918 -407Q1918 -450 1934.0 -471.5Q1950 -493 1982 -493H2003V-580Q2003 -603 2007.0 -622.5Q2011 -642 2030.0 -654.5Q2049 -667 2094 -667Q2138 -667 2157.0 -653.5Q2176 -640 2180.0 -619.0Q2184 -598 2184 -576V-496L2237 -498Q2259 -498 2279.5 -494.0Q2300 -490 2313.5 -471.0Q2327 -452 2327 -406Q2327 -364 2313.5 -345.0Q2300 -326 2279.5 -321.0Q2259 -316 2236 -316L2184 -317V-201Q2184 -190 2185.5 -182.5Q2187 -175 2190.0 -171.0Q2193 -167 2198.0 -165.0Q2203 -163 2211 -163Q2237 -163 2257.5 -159.0Q2278 -155 2289.5 -138.0Q2301 -121 2301 -81Q2301 -36 2287.0 -17.0Q2273 2 2252.0 5.5Q2231 9 2210 9Z M2625 20Q2550 20 2498.0 -4.5Q2446 -29 2414.0 -68.5Q2382 -108 2367.0 -154.0Q2352 -200 2352 -243Q2352 -322 2387.0 -382.0Q2422 -442 2484.0 -476.0Q2546 -510 2626 -510Q2688 -510 2732.0 -490.0Q2776 -470 2803.5 -439.0Q2831 -408 2844.0 -373.0Q2857 -338 2857 -308Q2857 -251 2829.0 -221.0Q2801 -191 2757 -191H2544Q2548 -175 2560.5 -163.5Q2573 -152 2592.0 -145.5Q2611 -139 2633 -139Q2655 -139 2672.0 -141.5Q2689 -144 2701.5 -148.0Q2714 -152 2724.5 -156.0Q2735 -160 2743.5 -162.5Q2752 -165 2760 -165Q2778 -165 2793.0 -153.0Q2808 -141 2820 -117Q2827 -104 2830.0 -92.5Q2833 -81 2833 -71Q2833 -41 2808.5 -21.0Q2784 -1 2738.0 9.5Q2692 20 2625 20ZM2544 -285H2656Q2670 -285 2676.5 -291.0Q2683 -297 2683 -309Q2683 -322 2675.5 -331.0Q2668 -340 2655.0 -344.5Q2642 -349 2624 -349Q2600 -349 2582.0 -339.5Q2564 -330 2554.5 -315.5Q2545 -301 2544 -285Z" fill="currentColor"/><path d="M816 -520Q798 -520 785.0 -535.0Q772 -550 762 -581Q749 -623 757.0 -643.5Q765 -664 801 -675L985 -729Q1003 -729 1016.0 -714.0Q1029 -699 1038 -668Q1052 -628 1043.0 -607.0Q1034 -586 1000 -575Z" fill="currentColor"/><g transform="translate(1623.1 -846.0) scale(5.2)"><g transform=""><path d="M14 24 30 15 28 30Z" fill="#ffe68a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M30 15 46 17 42 32 28 30Z" fill="#fff4bd" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M46 17 58 30 42 32Z" fill="#ffd24a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M6 40 14 24 28 30 30 44Z" fill="#f7b52a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M28 30 42 32 30 44Z" fill="#ffcb3a" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M58 30 56 46 42 32Z" fill="#e39a10" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M42 32 56 46 42 55 30 44Z" fill="#d08a00" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M6 40 30 44 20 54Z" fill="#eba216" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/><path d="M30 44 42 55 20 54Z" fill="#b87400" stroke="#6e4400" stroke-width="1.1" stroke-linejoin="round"/></g><path transform="" d="M6 40 14 24 30 15 46 17 58 30 56 46 42 55 20 54Z" fill="none" stroke="#6e4400" stroke-width="3" stroke-linejoin="round"/><path d="M20 27 26 21" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></g></svg>`;
const WMFULL = `<span class="wmfull" role="img" aria-label="C’est Pépite"><span class="cest" aria-hidden="true">c’est</span>${WM.replace('role="img" aria-label="Pépite"', 'aria-hidden="true"')}</span>`;
const LOCK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const I = {
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
  speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
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
let view = 'home', cur = null, lock = null, pinOk = false, pinBuf = '', pinBad = false, pinAsk = false, pinFor = null;
const KID_UNDO = ['paie', 'recu', 'posture']; // ce qu'un enfant peut annuler seul sur un appareil verrouillé
let tray = [], invC = [], depC = [], rolling = false;
let toast = null, toastT = null, undoArm = false, wipeArm = false, delArm = null;
const projInv = {}, sel = {}, projStrat = {}; // projStrat : stratégie essayée dans Futur (simulation, ne change pas la vraie)
const form = { avis: '', ok: false, delpass: '', preason: '', pdur: '1', resetname: '', goalname: '', goalbudget: '', gamount: '', gfrom: '', plabel: '', pamount: '', pkid: '', email: '', pass: '', newpin: '' };
let loginMode = 'in', loginMsg = '', loginErr = '', busy = false;
let avisSent = false, avisMood = '', installEv = null, installed = false, relatedApp = false, delAcct = false, delErr = '', adminData = null, adminErr = '';
const UA = navigator.userAgent;
const isMobile = /Android|iPhone|iPad|iPod/i.test(UA) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(UA));
const isIOS = /iPhone|iPad|iPod/i.test(UA) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(UA));
const inApp = /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Snapchat|musical_ly|TikTok|Line\/|; wv\)/i.test(UA);
let gateOff = false; try { gateOff = sessionStorage.getItem('pepite-gate') === '1'; } catch (e) {}
// Source d'arrivée (lien ?src=…), gardée sur l'appareil jusqu'à la création du compte
try { const q = new URLSearchParams(location.search), src = (q.get('src') || q.get('utm_source') || '').slice(0, 40).replace(/[^\w.-]/g, ''); if (src && !localStorage.getItem('pepite-src')) localStorage.setItem('pepite-src', src); } catch (e) {}
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let ob = null, artId = null, lessonId = null, lessonFrom = null, kq = {}, tour = null, tourAuto = false, guide = null, guidePlan = null, guideKind = 'pay', guidePaid = false, guideShown = -1, guideOff = {}, guideHold = null, guideViews = [];
const BOURSE_MIN = 15; // la bourse s'ouvre quand la tirelire atteint 15 € (dès là, Équilibré et Aventurier font bouger le dé)
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
function resetCoins() { const k = kidOf(cur); tray = k ? coinsOf(k.weekly) : []; invC = []; depC = []; }
const sumC = a => Math.round(a.reduce((x, y) => x + y, 0) * 100) / 100;
function coinsOf(w) { const n = Math.floor(w + 1e-9); return [...Array(n).fill(1), ...(w - n >= 0.5 - 1e-9 ? [0.5] : [])]; }
function coinsTxt(w) { const c = coinsOf(w), n = c.filter(v => v === 1).length, h = c.length > n; return [n ? `${n} pièce${n > 1 ? 's' : ''} de 1 €` : '', h ? '1 pièce de 50 centimes' : ''].filter(Boolean).join(' et '); }
const halfNum = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? Math.round(n * 2) / 2 : NaN; };
function coinSVG(v) {
  const half = v < 1, o = half ? { b: '#f0ae1c', l: '#ffd760', d: '#c78300', s: '#6e4400' } : { b: '#d7dde7', l: '#f6f8fb', d: '#a7afbe', s: '#3f4558' };
  const body = `<circle cx="32" cy="32" r="29" fill="${o.d}"/><circle cx="30.6" cy="30.6" r="27.4" fill="${o.b}"/><path d="M6.5 27A26 26 0 0 1 27 6.5L30.5 15.5 15.5 30.5Z" fill="${o.l}"/><circle cx="32" cy="32" r="29" fill="none" stroke="${o.s}" stroke-width="3"/>`;
  const core = half ? `<circle cx="32" cy="32" r="21.5" fill="none" stroke="${o.d}" stroke-width="1.8"/><text x="32" y="38.5" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="18" fill="#6e4400">50<tspan font-size="12" dx="1">c</tspan></text>`
    : `<circle cx="32" cy="32" r="17.5" fill="#d08a00"/><circle cx="31.2" cy="31.2" r="16.3" fill="#f5b323"/><path d="M15.6 29A16 16 0 0 1 29 15.6L31 22.5 22.5 31Z" fill="#ffe68a"/><circle cx="32" cy="32" r="17.5" fill="none" stroke="#6e4400" stroke-width="2.4"/><text x="32" y="39.5" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="20" fill="#6e4400">1<tspan font-size="13" dx="1">€</tspan></text>`;
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${body}${core}<path d="M13.5 21.5 18.5 15.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;
}
const coinEl = (v, act) => { const lbl = v < 1 ? '50 centimes' : '1 euro'; return act ? `<button class="coin${v < 1 ? ' half' : ''}" data-act="${act}" aria-label="Reprendre cette pièce de ${lbl}" ${ready ? '' : 'disabled'}>${coinSVG(v)}</button>` : `<span class="coin${v < 1 ? ' half' : ''}" role="img" aria-label="Pièce de ${lbl}">${coinSVG(v)}</span>`; };
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
// Série : semaines de paie consécutives jusqu'à cette semaine (ou la précédente si celle-ci n'est pas encore rangée). Les semaines en pause ne cassent pas la série.
function paidWeeks(id) { return new Set(evs(id).filter(e => e.t === 'paie').map(e => normWk(e.w ? wk(e.w) : wk(e.d)))); }
function streakOf(id) {
  const set = paidWeeks(id); if (!set.size) return 0;
  const isPaused = pausedWeeks(id), back = w => normWk(w - 7 * 864e5);
  let w = wk(new Date()); if (!set.has(w)) w = back(w);
  let n = 0;
  for (let i = 0; i < 260; i++) { if (set.has(w)) n++; else if (!isPaused(w)) break; w = back(w); }
  return n;
}
// Leçons : une de plus à chaque semaine de paie rangée (toutes visibles côté parent).
const lessonsOpen = id => lessonFrom === 'parents' ? 99 : Math.min(99, 1 + paidWeeks(id).size);
const weekTxt = w => w === wk(new Date()) ? 'de cette semaine' : 'de la semaine du ' + new Date(w).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

function tot(id) {
  const t = { peak: 0, jpeak: 0, own: 0, bonus: 0, gains: 0, out: 0, pig: 0, purse: 0, given: 0, vire: 0, fromL: 0, paie: null, bourse: null, pays: [], rolls: [], waiting: [] };
  for (const e of evs(id)) {
    if (e.t === 'recu' && (e.pending || e.refused)) { if (e.pending) t.waiting.push(e); }
    else if (e.t === 'paie' || e.t === 'recu') { t.own += e.inv; t.bonus += e.bonus; t.pig += e.dep; if (e.t === 'paie') { t.purse += e.dep; t.paie = e.d; t.pays.push(e.inv); } }
    else if (e.t === 'donne') { t.given += e.amount; }
    else if (e.t === 'bourse') { t.gains += e.gain; t.bourse = e; t.rolls.push(e); }
    else if (e.t === 'projet') { t.out += e.amount; t.fromL += (e.fromLivret ?? e.amount); }
    else if (e.t === 'vire') { t.vire += e.amount; }
    const now$ = t.own + t.bonus + t.gains - t.out;
    t.peak = Math.max(t.peak, now$); t.jpeak = e.t === 'projet' ? now$ : Math.max(t.jpeak, now$); // jpeak : plus haut depuis le dernier achat de projet
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
// Stratégie retenue pour les projections : celle de l'enfant, ou Équilibré s'il ne joue pas encore (bourse fermée ou « Je ne joue pas »).
const projPost = id => { const p = postOf(id); return p === 'none' || !bourseOpen(id) ? 'equilibre' : p; };
const projMean = id => POST[projPost(id)].faces.reduce((a, b) => a + b, 0) / 6 / 100;
// Semaines (à partir d'aujourd'hui) où tombent les prochains anniversaires, pour la hausse de 0,50 € par an.
function bdWeeks(k, maxW) { const out = []; if (!F.raise || !validBirth(k.birth)) return out; const now = new Date(), b = new Date(k.birth + 'T12:00:00'); for (let a = ageAt(k.birth, now) + 1; a <= 18; a++) { const d = new Date(b); d.setFullYear(b.getFullYear() + a); const w = Math.round((d - now) / (7 * 864e5)); if (w > maxW) break; out.push(w); } return out; }
function eta(id, perWeek) {
  const g = goalOf(id), t = tot(id); if (!g) return null; if (t.total >= g.budget) return 0;
  const k = kidOf(id), m = projMean(id), match = F.match / 100, share = k.weekly ? Math.min(1, perWeek / k.weekly) : 1, bds = bdWeeks(k, 520); let x = Math.max(0, t.total), pw = perWeek;
  for (let w = 1; w <= 520; w++) { if (bds.includes(w)) pw += share * 0.5; x += (x >= BOURSE_MIN || bourseOpen(id) ? x * m : 0) + pw * (1 + match); if (x >= g.budget) return w; }
  return null;
}
const avgInv = id => { const p = tot(id).pays.slice(-8); return p.length ? p.reduce((a, b) => a + b, 0) / p.length : kidOf(id).weekly; };
const etaTxt = w => w === null ? null : w <= 1 ? 'dès la semaine prochaine' : `dans ${w} semaines, vers ${new Date(Date.now() + w * 7 * 864e5).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
// Les paliers se disent selon l'âge : étapes avant 9 ans, fractions de 9 à 10 ans, pourcentages ensuite.
const msBand = id => { const k = kidOf(id); if (!k || !validBirth(k.birth)) return 'pct'; const a = ageAt(k.birth, new Date()); return a < 9 ? 'step' : a < 11 ? 'frac' : 'pct'; };
const FRAC = { 0.25: 'un quart', 0.5: 'la moitié', 0.75: 'trois quarts' };
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const msShort = (m, id) => ({ step: `${m * 4}`, frac: { 0.25: '¼', 0.5: '½', 0.75: '¾' }[m], pct: `${m * 100} %` })[msBand(id)];
const msLong = (m, id) => ({ step: `Étape ${m * 4}`, frac: cap1(FRAC[m]), pct: `Palier ${m * 100} %` })[msBand(id)];
const msHow = id => ({ step: 'Ton projet est coupé en 4 étapes. À chaque étape franchie, ta pépite grossit !', frac: 'Ton projet est coupé en 4 parts : un quart, la moitié, trois quarts, puis tout. À chaque part, ta pépite grossit !', pct: '25 %, c’est un quart du prix ; 50 %, la moitié ; 75 %, les trois quarts. À chaque palier, ta pépite grossit.' })[msBand(id)];
// Le bonus en mots d'enfant : « pour 4 pièces placées, papa ajoute 1 pièce » tant que l'enfant ne manie pas les pourcentages.
const bonusKid = (m, unit = 'pièces placées', one = '1 pièce') => { const p = bonusPlan(m); if (msBand(cur) !== 'pct' && p && p.n > 1) { const gift = p.g === 1 ? one : one.replace(/^1 (\S+)/, (_, w) => `${p.g} ${w === '€' ? w : w + 's'}`); return `pour ${p.n} ${unit}, ${P().aj} ${gift}`; } return `${P().aj} ${String(m).replace('.', ',')} % de bonus`; };
function milestone(before, after) {
  const g = goalOf(cur);
  if (!g) { const c = [...CAPS].reverse().find(x => before < x && after >= x); return c ? `C’est pépite ! Ton bocal est plein à ${eur0(c)} : il grandit !` : ''; }
  const b = before / g.budget, a = after / g.budget;
  for (const m of [1, 0.75, 0.5, 0.25]) if (b < m && a >= m) return m === 1 ? `C’est pépite ! Objectif « ${esc(g.name)} » atteint !` : ({ step: `Étape ${m * 4} sur 4 franchie pour « ${esc(g.name)} » : ta pépite grossit !`, frac: `${cap1(FRAC[m])} du chemin pour « ${esc(g.name)} » : ta pépite grossit !`, pct: `Palier ${m * 100} % atteint pour « ${esc(g.name)} » !` })[msBand(cur)];
  return '';
}
function sayMs(before, msg, sub) { markBourse(true); const after = tot(cur).total, ms = milestone(before, after); if (ms) { say(ms, msg); const g = goalOf(cur), c = CAPS.find(x => before < x && after >= x); if (g ? before < g.budget && after >= g.budget : c) queuePush(g ? 'objectif' : 'palier', { kid: cur, amount: g ? r2(g.budget) : c, goal: g ? g.name : null }); } else say(msg, sub); }
function project(id, perWeek, strat) {
  const k = kidOf(id), t = tot(id), m = strat ? POST[strat].faces.reduce((x, y) => x + y, 0) / 6 / 100 : projMean(id), match = F.match / 100, now = new Date(), birth = new Date(k.birth + 'T12:00:00'), share = k.weekly ? Math.min(1, perWeek / k.weekly) : 1;
  let own = t.own, bonus = t.bonus, gains = t.gains, w = 0, pw = perWeek; const pts = [];
  for (let a = ageAt(k.birth, now) + 1; a <= 18; a++) {
    const bd = new Date(birth); bd.setFullYear(birth.getFullYear() + a);
    const target = Math.max(0, Math.round((bd - now) / (7 * 864e5)));
    while (w < target) { const cap = Math.max(0, own + bonus + gains - t.out); gains += cap >= BOURSE_MIN || bourseOpen(id) ? cap * m : 0; own += pw; bonus += pw * match; w++; }
    if (F.raise) pw += share * 0.5;
    pts.push({ age: a, own, bonus, gains, total: Math.max(0, own + bonus + gains - t.out) });
  }
  return pts;
}

/* ---------- dessins ---------- */
function die(n, size) { return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Dé : ${n}"><rect x="6" y="9" width="88" height="88" rx="22" fill="#d9d3e6"/><rect x="6" y="4" width="88" height="88" rx="22" fill="#fff" stroke="#22203a" stroke-width="5"/>${PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y - 2}" r="9" fill="#22203a"/>`).join('')}</svg>`; }
const eur0 = n => `${Math.round(n).toLocaleString('fr-FR')}\u00a0€`;
const capOf = v => CAPS.find(c => c > v) || Math.ceil((v + 1) / 10000) * 10000;
// Passage de palier sans projet : on mémorise sur l'appareil la dernière échelle vue pour rejouer l'animation une seule fois.
let jarAnim = null;
function jarLevel(t, g) {
  if (g || !ready) return null; // pas avant que les comptes de l'enfant soient chargés
  const sc = capOf(Math.max(t.jpeak, t.total)), key = 'pepite-jar-' + cur; let seen = null;
  try { seen = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
  if (seen && sc > seen.s && !(jarAnim && jarAnim.kid === cur && jarAnim.to === sc) && guide === null) {
    jarAnim = { kid: cur, from: seen.s, to: sc, l0: Math.min(1, Math.max(0, seen.v) / seen.s), until: Date.now() + 3000, msgUntil: Date.now() + 15000 };
    setTimeout(() => sfx('up'), 150); setTimeout(render, 3100);
  }
  if (!seen || seen.s !== sc || seen.v !== t.total) try { localStorage.setItem(key, JSON.stringify({ s: sc, v: t.total })); } catch (e) {}
  return jarAnim && jarAnim.kid === cur && Date.now() < jarAnim.until ? jarAnim : null;
}
const capPill = (v, cls) => `<g class="jl ${cls}"><rect x="72" y="60" width="76" height="21" rx="10.5" style="fill:var(--card);stroke:var(--ink)" stroke-width="3"/><text x="110" y="75.5" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="13.5" style="fill:var(--ink)">${eur0(v)}</text></g>`;
function jar(t, g, A = null) {
  const cap = g ? Math.max(g.budget, t.total) : capOf(Math.max(t.jpeak, t.total));
  const pos = t.own + t.bonus + Math.max(0, t.gains), k = pos > 0 ? Math.max(0, t.total) / pos : 0, H = 196;
  const h = [t.own * k / cap * H, t.bonus * k / cap * H, Math.max(0, t.gains) * k / cap * H];
  const fills = ['var(--own)', 'var(--gold)', 'var(--grow)'];
  let y = 266, layers = '', gy = 266;
  h.forEach((v, i) => { y -= v; if (i === 2) gy = y; layers += `<rect x="16" y="${y.toFixed(1)}" width="188" height="${v.toFixed(1)}" style="fill:${fills[i]}"/>`; if (v > 0.5 && y < 268) layers += `<rect x="16" y="${(y - 1).toFixed(1)}" width="188" height="2" style="fill:#fff;opacity:.9"/>`; });
  const yb = y + h[2]; // bas de la couche « gagné tout seul »
  const reached = !!g && t.total >= g.budget;
  const star = (x, yy, r) => `<path d="M${x} ${yy - r}l${r * 0.28} ${r * 0.72} ${r * 0.72} ${r * 0.28}-${r * 0.72} ${r * 0.28}-${r * 0.28} ${r * 0.72}-${r * 0.28}-${r * 0.72}-${r * 0.72}-${r * 0.28} ${r * 0.72}-${r * 0.28}z" fill="#fff3b0" stroke="#6e4400" stroke-width="2" stroke-linejoin="round"/>`;
  const svg = `<svg class="jar${A ? ' jup' : ''}" viewBox="0 0 220 290" role="img" aria-label="${reached ? 'Tirelire pleine : c’est pépite !' : `Tirelire remplie à ${Math.round((266 - y) / H * 100)} %${g ? '' : ` d’un bocal de ${eur0(cap)}`}`}">
<defs><clipPath id="jc"><rect x="22" y="56" width="176" height="214" rx="40"/></clipPath>
<pattern id="pc" width="26" height="18" patternUnits="userSpaceOnUse"><circle cx="13" cy="9" r="7" fill="#fff" fill-opacity=".2"/></pattern>
<pattern id="pn" width="30" height="20" patternUnits="userSpaceOnUse"><path d="M5 12 7 7 12 5 18 6 21 10 20 14 14 16 8 15z" fill="#f5b323" stroke="#6e4400" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 9 11 7" stroke="#fff6cf" stroke-width="1.4" stroke-linecap="round"/></pattern></defs>
<ellipse cx="110" cy="278" rx="80" ry="8" fill="#000" fill-opacity=".08"/>
<rect x="22" y="56" width="176" height="214" rx="40" style="fill:var(--glass)"/>
<g clip-path="url(#jc)"><g class="jlv"${A ? ` style="--a:${(A.l0 * H / Math.max(1, 266 - y)).toFixed(3)};--b:${(H / Math.max(1, 266 - y)).toFixed(3)}"` : ''}>${layers}<rect x="16" y="${gy.toFixed(1)}" width="188" height="${(266 - gy).toFixed(1)}" fill="url(#pc)"/>${h[2] > 0.5 ? `<rect x="16" y="${y.toFixed(1)}" width="188" height="${h[2].toFixed(1)}" fill="url(#pn)"/>` : ''}</g>${A ? '<rect class="jflash" x="22" y="56" width="176" height="214" fill="#fff"/>' : ''}</g>
<line x1="34" x2="186" y1="70" y2="70" stroke-dasharray="7 7" style="stroke:var(--soft)" stroke-width="2.5" stroke-linecap="round"/>${g ? '' : (A ? capPill(A.from, 'jl-old') + capPill(A.to, 'jl-new') : capPill(cap, ''))}
<rect x="38" y="84" width="14" height="140" rx="7" fill="#fff" fill-opacity=".55"/>${g ? [0.25, 0.5, 0.75].map(m => { const yy = (266 - m * g.budget / cap * H).toFixed(1); return `<line x1="168" x2="192" y1="${yy}" y2="${yy}" style="stroke:var(--ink)" stroke-width="4" stroke-linecap="round"/>`; }).join('') : ''}
<rect x="22" y="56" width="176" height="214" rx="40" fill="none" style="stroke:${reached ? '#c98a00' : 'var(--ink)'}" stroke-width="6"/>
<rect x="40" y="20" width="140" height="38" rx="13" style="fill:var(--kid);stroke:var(--ink)" stroke-width="6"/>
<rect x="74" y="29" width="72" height="11" rx="5.5" style="fill:var(--ink)"/>
<rect x="50" y="44" width="34" height="6" rx="3" fill="#fff" fill-opacity=".4"/>
${reached ? star(14, 120, 13) + star(206, 170, 11) + star(196, 96, 7) + star(26, 214, 8) : ''}${A ? [[14, 110, 13], [206, 150, 11], [198, 80, 8], [24, 220, 9], [110, 8, 9]].map(([x, yy, r]) => `<g class="jspark">${star(x, yy, r)}</g>`).join('') : ''}</svg>`;
  return { cap, svg };
}

/* ---------- vues ---------- */
function splash(msg) { return `<div class="splash"><div>${LOGOBIG}<h1 style="font-size:46px;margin-top:8px">${WMFULL}</h1><p class="soft">${esc(msg || 'Pièce après pièce, ta pépite grandit')}</p></div></div>`; }

function loginView() {
  const up = loginMode === 'up';
  return `<main class="view full"><div class="welcome">${LOGOBIG}<h1>${WMFULL}</h1><p>Pièce après pièce, ta pépite grandit</p></div>
<div class="intro"><p class="story">Semaine après semaine, la tirelire se remplit… jusqu’à devenir une vraie pépite.</p><p>Pépite aide les parents à montrer à leurs enfants, avec leur argent de poche, pourquoi épargner et investir tôt change tout.</p><p class="soft small">Bonus, bourse et intérêts sont un jeu financé par vous, les parents : ce n’est pas un vrai placement.</p></div>
<div class="row" style="margin-top:14px"><button class="btn gold full" data-act="tour">Découvrir Pépite en 1 minute</button></div><div class="row" style="margin-top:8px"><button class="btn ghost full vbtn" data-act="video"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>Voir le tuto vidéo (2 min 30)</button></div>
<div class="tabs2"><button data-act="lmode" data-m="in" aria-pressed="${!up}">J’ai un compte</button><button data-act="lmode" data-m="up" aria-pressed="${up}">Créer un compte</button></div>
<form class="card" id="loginf" autocomplete="on">
<h3>${up ? 'Créer le compte de la famille' : 'Connexion de cet appareil'}</h3>
<label>E-mail d’un parent<input id="l-email" type="email" autocomplete="username" data-f="email" value="${esc(form.email)}" required></label>
<label>Mot de passe${up ? ' (6 caractères minimum)' : ''}<input id="l-pass" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" data-f="pass" value="${esc(form.pass)}" required minlength="6"></label>
${loginErr ? `<p class="neg" style="margin:10px 0 0;font-weight:700">${esc(loginErr)}</p>` : ''}${loginMsg ? `<div class="msg">${esc(loginMsg)}</div>` : ''}
${up ? `<label class="chk"><input type="checkbox" id="l-ok" data-f="ok" ${form.ok ? 'checked' : ''} required><span>Je suis parent ou titulaire de l’autorité parentale des enfants que j’inscris, et j’accepte la <button class="link" type="button" data-act="go" data-v="confidentialite">politique de confidentialité</button>.</span></label>` : ''}
<div class="row"><button class="btn full" type="submit" ${busy ? 'disabled' : ''}>${up ? 'Créer le compte' : 'Se connecter'}</button></div>
${up ? '' : '<button class="link" type="button" data-act="reset">Mot de passe oublié ?</button>'}
<p class="soft small" style="margin:8px 0 0">Un seul compte pour toute la famille : un parent se connecte une fois sur chaque appareil.</p></form>
<button class="item art-item" data-act="go" data-v="lire" style="margin:18px 0 4px"><span class="ic artn">${NUG('', '')}</span><span><small>Toi, parent · 5 lectures courtes</small><b>Pourquoi ça marche\u00a0: la méthode Pépite expliquée</b></span><span class="end">${I.chev}</span></button>
<div class="footlinks"><button class="link" data-act="go" data-v="apropos">Qui a créé Pépite ?</button><button class="link" data-act="go" data-v="confidentialite">Confidentialité</button></div></main>`;
}

function newOb() { return { step: 1, parents: 'parents', kids: [{ id: uid6(), name: '', birth: '', weekly: '', color: PAL[0] }], match: 25, giftMatch: 10, dice: 'equilibre', pin: '', legacy: null, err: '' }; }
function obView() {
  const o = ob, st = `<div class="stepper"><span>Étape ${o.step} sur 3 · ${['Bienvenue', 'Vos enfants', 'Les règles du jeu'][o.step - 1]}</span><div class="sbar"><i style="width:${(o.step / 3 * 100).toFixed(0)}%"></i></div></div>`;
  let body = '';
  if (o.step === 1) {
    body = `${st}<div class="welcome">${LOGOBIG}<h1>Bienvenue !</h1><p>Avec leur argent de poche, vos enfants découvrent pourquoi épargner et investir tôt change tout. Pièce après pièce, leur tirelire se remplit… jusqu’à devenir une vraie pépite.</p></div>
<div class="why"><div>${I.coin}<span><b>Une paie chaque semaine</b>Votre enfant décide librement ce qu’il fait de son argent : tout dépenser, tout placer, ou un peu des deux. Et s’il le place, il découvre peu à peu les arcanes de l’investissement.</span></div>
<div>${I.die}<span><b>Un bonus et une bourse</b>Vous ajoutez un bonus sur l’argent qu’il place. Ensuite, chaque semaine, il peut lancer un dé qui fait varier sa tirelire, à la hausse ou à la baisse, comme les cours en Bourse. Il choisit lui-même son niveau de risque, ou décide de ne pas jouer.</span></div>
<div>${I.flag}<span><b>Des projets et un horizon</b>Il se fixe un objectif, comme l’achat d’un vélo, et fait grossir sa pépite jusqu’à ses 18 ans.</span></div></div>
<div class="msg">Ce que l’argent « gagne » dans Pépite (bonus, bourse) est payé par vous : c’est un jeu pour apprendre, pas un vrai placement.</div>
<div class="card"><h3>Comment vos enfants vous appellent-ils ?</h3><p class="soft small" style="margin:0">C’est le nom utilisé dans l’appli, par exemple « le bonus de papa ».</p>
<div class="pills">${Object.entries(PAR).filter(([k]) => k !== 'papamaman').map(([k, v]) => `<button class="pill" data-act="obpar" data-k="${k}" aria-pressed="${o.parents === k}">${v.label}</button>`).join('')}</div></div>
${o.legacy ? '<div class="msg">Les données déjà saisies pour vos enfants seront reprises.</div>' : ''}`;
  } else if (o.step === 2) {
    body = `${st}<h2 class="title">Vos enfants</h2><p class="lead">Chacun aura sa tirelire, sa couleur et son argent de poche.</p>
<div class="card help" style="margin-top:12px"><h3>Comment fonctionne la paie ?</h3><p style="margin:0;font-size:16px">Chaque semaine, l’enfant reçoit son argent de poche sous forme de pièces de 1 € dans l’appli, et range chaque pièce :</p>
<ul class="plain"><li><b>Dans son porte-monnaie</b> : il les dépense librement. Vous lui donnez cet argent en vrai quand vous voulez, chaque semaine ou une fois par mois : l’appli vous dit combien.</li><li><b>Dans sa tirelire</b>, pour le placer : l’argent reste chez vous, mis de côté. Il reçoit votre bonus et varie avec la bourse de la semaine.</li></ul>
<p class="soft small" style="margin:8px 0 0">Plus il place tôt, plus sa pépite grossit : c’est toute la leçon.</p></div>
${o.kids.map((k, i) => `<div class="kidform"><header><h3>Enfant ${i + 1}</h3>${o.kids.length > 1 ? `<button class="link" data-act="obdel" data-k="${k.id}">Retirer</button>` : ''}</header>
<label>Prénom<input id="ob-n-${k.id}" type="text" autocomplete="off" maxlength="20" data-ob="name:${k.id}" value="${esc(k.name)}"></label>
<div class="grid2"><label>Date de naissance<input id="ob-b-${k.id}" type="date" data-ob="birth:${k.id}" value="${esc(k.birth)}"></label>
<label>Argent de poche par semaine (€)<input id="ob-w-${k.id}" type="number" inputmode="decimal" min="1" max="50" step="0.5" data-ob="weekly:${k.id}" value="${esc(k.weekly)}" placeholder="${String(suggest(k.birth)).replace('.', ',')}"></label></div>
<label>Sa couleur</label><div class="swatches">${PAL.map((c, ci) => `<button class="sw" style="--c:${c}" title="${PALN[ci]}" data-act="obcolor" data-k="${k.id}" data-c="${c}" aria-pressed="${k.color === c}" aria-label="${PALN[ci]}"></button>`).join('')}</div></div>`).join('')}
<div class="row"><button class="btn ghost full" data-act="obadd">Ajouter un enfant</button></div>
<button class="item art-item" data-act="art" data-n="rythme" style="margin-top:12px"><span class="ic artn">3</span><span><small>Notre repère : 1,50 € par semaine à 6 ans, puis 50 centimes de plus chaque année</small><b>Quand commencer, combien donner ?</b></span><span class="end">${I.chev}</span></button>`;
  } else {
    body = `${st}<h2 class="title">Les règles du jeu</h2><p class="lead">Tout reste modifiable plus tard dans l’espace parents.</p>
<div class="card"><h3>Bonus sur l’argent de poche placé</h3><p class="soft small" style="margin:0">Versé uniquement sur les pièces que l’enfant place. Rien sur celles qu’il met dans son porte-monnaie pour les dépenser : c’est ce qui rend le choix intéressant.</p>
<div class="pills">${[10, 25, 50].map(n => `<button class="pill" data-act="obmatch" data-n="${n}" aria-pressed="${o.match === n}">${n} %</button>`).join('')}</div></div>
<div class="card"><h3>Bonus sur l’argent reçu</h3><p class="soft small" style="margin:0">Cadeaux, anniversaires, petits services. Là aussi, seulement sur la part qu’il place.</p>
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
  const av = lock ? '' : kids().map(k => `<button class="av" style="--c:${k.color};color:${onColor(k.color)}" data-act="kid" data-k="${k.id}" aria-pressed="${k.id === cur}" aria-label="${esc(k.name)}">${esc(k.name.slice(0, 1).toUpperCase())}</button>`).join('');
  return `<header class="topbar"><div class="brand">${LOGO}${WM}</div>${kids().length > 1 ? av : ''}<button class="iconbtn" data-act="go" data-v="parents" aria-label="${lock ? 'Paramètres' : 'Espace parents'}">${I.gear}</button></header>`;
}
function tabbar() {
  const tabs = [['home', 'Tirelire', I.jar], ['paie', 'Paie', I.coin], ['bourse', 'Bourse', I.die], ['projet', 'Projet', I.flag], ['futur', 'Futur', I.chart]];
  return `<nav class="tabbar" aria-label="Navigation"><div>${tabs.map(([v, l, ic]) => `<button class="tab" data-act="go" data-v="${v}" ${view === v ? 'aria-current="page"' : ''}>${ic}${l}</button>`).join('')}</div></nav>`;
}

function growNug(prog) {
  const st = prog >= 100 ? 4 : prog >= 75 ? 3 : prog >= 50 ? 2 : prog >= 25 ? 1 : 0, sc = [0.42, 0.55, 0.7, 0.85, 1][st];
  const lbl = st === 4 ? 'Ta pépite est complète : c’est pépite !' : `Ta pépite : taille ${st + 1} sur 5`;
  return `<svg class="gnug${st === 4 ? ' full' : ''}" viewBox="2 8 60 52" role="img" aria-label="${lbl}"><g transform="translate(${(32 - 32 * sc).toFixed(1)} ${(57 - 55 * sc).toFixed(1)}) scale(${sc})">${st === 4 ? NUGB : NUGP}</g></svg>`;
}
function pepCard() {
  const ms = medals(cur), won = ms.filter(m => m.ok), k = kidOf(cur), last = won.find(m => m.id === (k && k.pm)) || won[won.length - 1];
  const ic = last ? matNug(last, 'pnug') : `<svg class="pnug" viewBox="2 8 60 52" aria-hidden="true">${mystSVG()}</svg>`;
  return `<button class="todo pep" data-act="go" data-v="pepites"${last ? ` style="--m:${last.c}"` : ''}><span class="ic">${ic}</span><span>${last ? `<small>Ta dernière pépite</small><b>${last.name}</b>` : '<b>Mes pépites</b>'}<small>${last ? `${won.length} / ${ms.length} pépites débloquées` : 'Range ta première paie pour gagner ta première pépite'}</small></span><span class="end">${I.chev}</span></button>`;
}
function homeView(k, t) {
  const g = goalOf(cur), J = jar(t, g, jarLevel(t, g)), due = owed(cur).length, paid = due === 0, rolled = sameWeek(t.bourse && t.bourse.d);
  const prog = Math.min(100, Math.max(0, t.total / (g ? g.budget : J.cap) * 100)), up = jarAnim && jarAnim.kid === cur && Date.now() < jarAnim.msgUntil;
  const hint = g ? (t.total >= g.budget ? `Objectif « ${esc(g.name)} » atteint !` : `Encore ${f(g.budget - t.total)} pour « ${esc(g.name)} »`) : (up ? `Ton bocal a grandi : il va maintenant jusqu’à ${eur0(J.cap)}. Il paraît moins rempli, mais tu n’as rien perdu !` : `Encore ${f(J.cap - t.total)} pour le palier de ${eur0(J.cap)}`);
  return `<section class="hero"><div><p class="hi">Salut ${esc(k.name)} !</p><p class="lbl">${g && t.total >= g.budget ? 'C’est pépite ! Ta tirelire est pleine' : 'Ta tirelire'}</p><div class="amount">${f(t.total)}</div>
<div class="progrow"><div class="prog">${g ? '<b style="left:25%"></b><b style="left:50%"></b><b style="left:75%"></b>' : ''}<i style="width:${prog.toFixed(1)}%"></i></div>${growNug(prog)}</div><p class="small">${hint}</p></div>${J.svg}</section>
${!paid && !pauseOf(cur) ? `<button class="todo" data-act="go" data-v="paie"><span class="ic">${I.coin}</span><span><b>Ta paie t’attend !</b><small>${due > 1 ? `${due} paies à ranger` : streakOf(cur) >= 2 ? `Range-la pour garder ta série de ${streakOf(cur)} semaines` : 'Range tes pièces de la semaine'}</small></span><span class="end">${I.chev}</span></button>` : bourseOpen(cur) && postOf(cur) !== 'none' && !rolled && t.rolls.length ? `<button class="todo" data-act="go" data-v="bourse"><span class="ic">${I.die}</span><span><b>Ton dé de la semaine t’attend</b><small>Va-t-il faire monter ta tirelire ?</small></span><span class="end">${I.chev}</span></button>` : ''}
<div class="tiles"><div class="tile"><small><i style="background:var(--own)"></i>Mon argent</small><b>${f(t.own)}</b></div>
<div class="tile"><small><i style="background:var(--gold)"></i>Bonus ${P().de}</small><b>${f(t.bonus)}</b></div>
<div class="tile"><small><i style="background:var(--grow)"></i>Gagné tout seul</small><b class="${t.gains < 0 ? 'neg' : 'g'}">${f(t.gains)}</b></div>
<div class="tile"><small><i style="background:var(--purse)"></i>Porte-monnaie à recevoir</small><b>${f(t.purseDue)}</b></div></div>
${t.out > 0 ? `<p class="soft small" style="margin:8px 4px 0">Projets réalisés : ${f(t.out)}</p>` : ''}
${pepCard()}
<h3 class="sec">Mon projet</h3><div class="list"><button class="item" data-act="go" data-v="projet"><span class="ic" style="background:var(--kidt);color:var(--kidtxt)">${I.flag}</span><span>${g ? `<b>${esc(g.name)}${msBand(cur) === 'pct' ? ` : ${Math.floor(Math.min(1, Math.max(0, t.total) / g.budget) * 100)} %` : ''}</b><small>${t.total >= g.budget ? 'Atteint : prépare ta présentation !' : `${f(Math.max(0, t.total))} sur ${f(g.budget)}`}</small>` : '<b>Choisis un projet</b><small>Un vélo, un jeu, ton futur permis ? Pas obligatoire, mais motivant.</small>'}</span><span class="end">${I.chev}</span></button></div>
<h3 class="sec">Cette semaine</h3><div class="list">
<button class="item" data-act="go" data-v="paie"><span class="ic" style="background:#fff3c4;color:#a87300">${I.coin}</span><span><b>Ma paie</b><small>${pauseOf(cur) ? 'En pause ' + untilTxt(pauseOf(cur)) : paid ? 'Rangée, bravo !' : due > 1 ? `${due} paies t’attendent` : `${f(k.weekly)} t’attendent`}</small></span><span class="end ${paid && !pauseOf(cur) ? 'done' : ''}">${paid && !pauseOf(cur) ? I.check : I.chev}</span></button>
<button class="item" data-act="go" data-v="bourse"><span class="ic" style="background:var(--glass)">${I.die}</span><span><b>La bourse</b><small>${!bourseOpen(cur) ? `S’ouvre quand ta tirelire aura ${f(BOURSE_MIN)}` : !t.rolls.length && !rolled ? 'Nouveau : la bourse est ouverte !' : postOf(cur) === 'none' ? 'Tu ne joues pas la bourse' : rolled ? `Dé ${t.bourse.face} : ${eurS(t.bourse.gain)}` : 'Lance le dé de la semaine'}</small></span><span class="end ${rolled ? 'done' : ''}">${rolled ? I.check : I.chev}</span></button>
<button class="item" data-act="go" data-v="recu"><span class="ic" style="background:color-mix(in srgb,var(--grow) 14%,transparent);color:var(--grow)">${I.gift}</span><span><b>J’ai reçu de l’argent</b><small>${t.waiting.length ? `${t.waiting.length} en attente de validation` : 'Un cadeau, un anniversaire ?'}</small></span><span class="end">${I.chev}</span></button>
<button class="item" data-act="go" data-v="lecons"><span class="ic" style="background:color-mix(in srgb,var(--gold) 22%,var(--card));color:#6e4400">${NUG('', '')}</span><span><b>Comprendre l’argent</b><small>6 petites leçons et des quiz</small></span><span class="end">${I.chev}</span></button>
<button class="item" data-act="go" data-v="carnet"><span class="ic" style="background:var(--glass)">${I.book}</span><span><b>Mon carnet</b><small>Tout ce qui est entré et sorti</small></span><span class="end">${I.chev}</span></button></div>`;
}

function payView(k, t) {
  const pz = pauseOf(cur);
  if (pz) return `<h2 class="title">Jour de paie</h2><section class="card paused"><h3>Ta paie est en pause</h3><p style="margin:0">${P().label} ${F.parents === 'parents' ? 'ont' : 'a'} mis ta paie en pause ${untilTxt(pz)}.</p>
${pz.reason ? `<p class="msg">« ${esc(pz.reason)} »</p>` : ''}<p class="soft" style="margin:10px 0 0">Ta tirelire reste à toi : elle continue de travailler avec la bourse, et tu peux toujours ranger l’argent que tu reçois.</p></section>`;
  const ow = owed(cur), blocked = ow.length === 0, inv = sumC(invC), dep = sumC(depC), bonusNow = r2(inv * F.match / 100), dis = ready ? '' : 'disabled';
  const help = payHelp === null ? !t.paie : payHelp, m = String(F.match).replace('.', ',');
  return `<h2 class="title">Jour de paie</h2><p class="lead">${blocked ? `Ta paie : ${coinsTxt(k.weekly)} chaque semaine.` : `${coinsTxt(k.weekly)} à ranger, une par une.`}</p>
<section class="card help"><button class="helphead" data-act="payhelp" aria-expanded="${help}"><span>Comment ça marche ?</span>${help ? '<span class="soft small">Masquer</span>' : I.chev}</button>
${help ? `<ol class="howto"><li><b>Chaque semaine, tu reçois ta paie</b>${coinsTxt(k.weekly)}, ton argent de poche.</li>
<li><b>Pour chaque pièce, tu choisis</b><span class="choice"><span><i class="dot" style="background:var(--purse)"></i><b>Dans mon porte-monnaie</b> : elle est à toi pour la dépenser comme tu veux. ${P().label} ${F.parents === 'parents' ? 'te la donnent' : 'te la donne'} en vrai, chaque semaine ou un peu plus tard.</span>
<span><i class="dot" style="background:var(--grow)"></i><b>Dans ma tirelire</b> : elle est placée. ${cap1(bonusKid(m))}, et elle peut grossir chaque semaine avec la bourse.</span></span></li>
<li><b>Ta tirelire est mise de côté</b>Pour récupérer cet argent, tu choisis un projet et tu le présentes ${P().a}.</li></ol>` : ''}</section>
<section class="card">${blocked ? `<p class="result" style="text-align:center">Ta paie de la semaine est rangée.<br><span class="soft" style="font-size:17px">Rendez-vous la semaine prochaine !</span></p>${F.match > 0 && bonusPlan(F.match) ? `<div class="paybonus"><p class="soft small" style="margin:10px 0 4px;text-align:center">Rappel : ${bonusKid(F.match)}.</p>${bonusVis(H(), F.match)}</div>` : ''}` : `
<p class="result" style="margin:0 0 4px">Paie ${weekTxt(ow[0])}</p>${ow.length > 1 ? `<p class="msg" style="margin-top:6px">Tu as ${ow.length} paies à ranger. On commence par la plus ancienne.</p>` : ''}
<div class="tray" aria-label="Pièces à ranger">${tray.map(v => coinEl(v, 'coinhint')).join('') || '<span class="soft">Toutes les pièces sont rangées !</span>'}</div>
<div class="moves"><button class="btn ghost" data-act="toPig" ${tray.length && ready ? '' : 'disabled'}>Dans mon porte-monnaie</button><button class="btn gr" data-act="toGrow" ${tray.length && ready ? '' : 'disabled'}>Dans ma tirelire</button></div>
<div class="zones"><div class="zone"><strong>Mon porte-monnaie : ${f(dep)}</strong>${depC.map(v => coinEl(v, 'backPig')).join('')}</div>
<div class="zone gz"><strong class="g">Ma tirelire : ${f(inv)}</strong>${invC.map(v => coinEl(v, 'backGrow')).join('')}${inv ? `<span class="chip">+${f(bonusNow)}</span>` : ''}</div></div>
<div class="row"><button class="btn full" data-act="pay" ${tray.length === 0 && ready ? '' : 'disabled'}>${tray.length ? `Encore ${tray.length} pièce${tray.length > 1 ? 's' : ''} à ranger` : 'Valider ma paie'}</button></div>
<p class="soft small" style="margin:6px 0 0;text-align:center">Touche une pièce rangée pour la reprendre.</p>`}</section>`;
}

function giftView(k) {
  const dis = ready ? '' : 'disabled', W = tot(cur).waiting;
  if (pinFor) return pinView();
  const wait = W.length ? `<section class="card waitcard"><h3>En attente de validation</h3><p class="soft small" style="margin:0">${askParent(false)}</p>
<ul class="log">${W.map(e => `<li><span>${giftLine(e)}</span><button class="btn sm" data-act="gval" data-d="${e.d}" ${dis}>Un parent valide</button></li>`).join('')}</ul></section>` : '';
  return `${wait}<h2 class="title">J’ai reçu de l’argent</h2><p class="lead">Range-le comme ta paie : dans ton porte-monnaie pour le dépenser, ou dans ta tirelire pour le placer${gm() > 0 ? ` (${bonusKid(gm(), '€ placés', '1 €')})` : ''}.</p>
<section class="card"><div class="grid2"><label>Combien (€)<input id="g-amount" type="text" inputmode="decimal" autocomplete="off" data-f="gamount" value="${esc(form.gamount)}" placeholder="Ex. : 10"></label>
<label>De qui ?<input id="g-from" type="text" autocomplete="off" maxlength="40" data-f="gfrom" value="${esc(form.gfrom)}" placeholder="Mamie, un anniversaire…"></label></div>
<div class="list" style="margin-top:16px"><button class="btn ghost" data-act="gift" data-r="0" ${dis}>Tout dans mon porte-monnaie</button><button class="btn gold" data-act="gift" data-r="0.5" ${dis}>Moitié porte-monnaie, moitié tirelire</button><button class="btn gr" data-act="gift" data-r="1" ${dis}>Tout dans ma tirelire</button></div></section>`;
}

function miniDie(n, c) { return `<svg viewBox="0 0 100 100" width="30" height="30" aria-hidden="true"><rect x="6" y="6" width="88" height="88" rx="22" fill="#fff" stroke="${c}" stroke-width="8"/>${PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#22203a"/>`).join('')}</svg>`; }
// À partir de combien d'euros dans la tirelire au moins une face du dé rapporte ou coûte 50 centimes.
// Montant de chaque face en pièces de 50 c. L'arrondi peut effacer la moyenne d'une stratégie (petites tirelires) :
// on corrige la face la plus haute (ou la plus basse) pour que la somme des 6 faces reste fidèle au pourcentage moyen.
function faceEur(total, faces) {
  const v = faces.map(x => r50(total * x / 100)), sum = v.reduce((a, b) => a + b, 0);
  const diff = r50(total * faces.reduce((a, b) => a + b, 0) / 100 - sum);
  if (diff && v.some(x => x)) {
    const hi = v.indexOf(Math.max(...v)), lo = v.indexOf(Math.min(...v)), second = [...v].sort((a, b) => b - a)[1];
    if (diff > 0) v[hi] = r2(v[hi] + diff);
    else if (v[hi] + diff >= second && v[hi] + diff > 0) v[hi] = r2(v[hi] + diff);
    else v[lo] = r2(v[lo] + diff);
  }
  return v;
}
const diceFrom = p => { const mx = Math.max(...POST[p].faces.map(Math.abs)); return mx ? Math.ceil(0.25 / (mx / 100) * 2) / 2 : null; };
function postureCard(p, sel, start, own) {
  const d = POST[p];
  if (p === 'none') return `<button class="post ${sel ? 'on' : ''}" data-act="posture" data-n="none" aria-pressed="${sel}"><span class="ph"><b>${d.name}</b>${sel ? `<span class="tag">Ma stratégie</span>` : ''}</span><span class="pt">${d.txt}</span><span class="pr">Les 6 faces ne changent rien : ta tirelire ne bouge pas.</span><span class="soft small">${d.like}</span></button>`;
  const v = faceEur(start, d.faces), tot6 = r2(v.reduce((a, b) => a + b, 0)), up = v.filter(x => x > 0).length, dn = v.filter(x => x < 0).length, eq = 6 - up - dn;
  const still = up + dn === 0;
  const cnt = still ? `Avec ${f(start)} dans ta tirelire, le dé ne change encore rien. Il commencera à bouger à partir de <b>${f(diceFrom(p))}</b>.` : [up ? `<span class="g">${up} face${up > 1 ? 's' : ''} sur 6 ${up > 1 ? 'font' : 'fait'} gagner</span>` : '', eq ? `${eq} ne change${eq > 1 ? 'nt' : ''} rien` : '', dn ? `<span class="neg">${dn} ${dn > 1 ? 'font' : 'fait'} perdre</span>` : ''].filter(Boolean).join(' · ');
  return `<button class="post ${sel ? 'on' : ''}" data-act="posture" data-n="${p}" aria-pressed="${sel}">
<span class="ph"><b>${d.name}</b>${sel ? `<span class="tag">Ma stratégie</span>` : ''}</span><span class="pt">${d.txt}</span>
<span class="dfaces">${v.map((x, i) => `<span class="df ${x > 0 ? 'up' : x < 0 ? 'dn' : ''}">${miniDie(i + 1, x > 0 ? '#13a05a' : x < 0 ? '#e0434f' : '#a39cb8')}<b>${eurS(x)}</b></span>`).join('')}</span>
<span class="pr">${cnt}</span>${still ? '' : `<span class="pr small">Si chaque face sort une fois : <b class="${tot6 > 0 ? 'g' : tot6 < 0 ? 'neg' : ''}">${tot6 > 0 ? '+' : ''}${f(tot6)}</b> en tout.</span>`}<span class="soft small">${d.like}</span></button>`;
}
function bourseView(k, t) {
  if (!bourseOpen(cur)) {
    const pct = Math.min(100, Math.max(0, t.total) / BOURSE_MIN * 100);
    return `<h2 class="title">La bourse</h2><p class="lead">Elle s’ouvre quand ta tirelire aura <b>${f(BOURSE_MIN)}</b>. Encore ${f(Math.max(0, BOURSE_MIN - t.total))} à placer !</p>
<section class="card"><div class="prog"><i style="width:${pct.toFixed(1)}%"></i></div><p class="soft small" style="margin:8px 0 0">${f(Math.max(0, t.total))} sur ${f(BOURSE_MIN)}</p></section>
<h3 class="sec">Comment ça marche ?</h3>
<section class="card"><p style="margin:0 0 10px">Imagine une tirelire de 100 €. Chaque semaine, tu lances un dé. Selon la face, ta tirelire gagne ou perd un petit bout de ce qu’il y a dedans.</p>
<div class="demoin" inert aria-hidden="true">${postureCard('equilibre', true, 100, true)}</div>
<p style="margin:10px 0 0">En vert, tu gagnes. En rouge, tu perds. Plus ta tirelire est pleine, plus le dé compte : c’est comme ça que marche la vraie Bourse.</p></section>`;
  }
  const p = postOf(cur), rolled = sameWeek(t.bourse && t.bourse.d), recent = t.rolls.slice(-8).reverse();
  const own = true, start = Math.max(0, r2(t.total)); // toujours la vraie tirelire de l'enfant
  const pays = F.parents === 'parents' || F.parents === 'papamaman' ? 'nt' : '';
  const diceH = `<h3 class="sec">${rolled ? 'Le dé de la semaine' : '2. Lance le dé'}</h3><section class="card dicebox">${p === 'none' ? `<p class="result">Tu ne joues pas la bourse.</p><p style="margin:0">Ta tirelire ne bouge pas : pas de gain, pas de perte. Tu peux changer d’avis quand tu veux, juste en dessous.</p>`
  : `<p class="soft small" style="margin:0">Ta stratégie : <b>${POST[p].name}</b></p><div id="die">${die(rolled ? t.bourse.face : 6, 132)}</div>
${rolled ? `<p class="result">Dé ${t.bourse.face} : ${t.bourse.rate < 0 ? 'semaine difficile' : t.bourse.rate === 0 ? 'semaine calme' : 'belle semaine'} !</p><p style="margin:0">Ta tirelire a ${t.bourse.gain < 0 ? 'perdu' : 'gagné'} <b class="${t.bourse.gain < 0 ? 'neg' : 'g'}">${f(Math.abs(t.bourse.gain))}</b>. Prochain lancer la semaine prochaine.</p>`
    : t.total > 0 ? `<button class="btn full" data-act="roll" ${ready ? '' : 'disabled'}>Lancer le dé</button>` : `<p style="margin:0">Place d’abord quelques pièces dans ta tirelire : le dé agit sur ce qu’il y a dans ta tirelire.</p>`}
${recent.length ? `<div class="recent">${recent.map(e => `<span class="${e.gain < 0 ? 'neg' : e.gain > 0 ? 'g' : ''}">${eurS(e.gain)}</span>`).join('')}</div>` : ''}`}
</section>`;
  const stratH = `<h3 class="sec">${rolled ? 'Ta stratégie' : '1. Choisis ta stratégie'}</h3><p class="lead">Chaque face du dé te dit ce qui arrive à ${own ? `ta tirelire de ${f(start)}` : 'une tirelire de 100 € (exemple)'} : en vert tu gagnes, en rouge tu perds. Compte les faces ! Plus ta tirelire est pleine, plus les montants sont gros : le dé gagne, ou perd, une part de tout ce qu’il y a dedans.</p>
<div class="list">${Object.keys(POST).map(q => postureCard(q, q === p, start, own)).join('')}</div>`;
  return `<h2 class="title">La bourse de la semaine</h2><p class="lead">Une fois par semaine, tu lances le dé : il fait monter ou baisser ta tirelire. C’est un jeu : ce que ton argent gagne ici, c’est ${P().label.toLowerCase()} qui le paie${pays}.</p>
${rolled ? diceH + stratH : stratH + diceH}
<p class="soft small" style="margin:10px 4px 0">${rolled && p !== 'none' ? 'Un changement de stratégie comptera pour le prochain lancer. ' : ''}Le dé est plus généreux que la vraie Bourse, pour qu’on voie l’effet plus vite. Avec une petite tirelire, prendre plus de risques rapporte à peine plus : l’écart se creuse quand la tirelire grossit, et avec le temps. Regarde « Futur ».</p>`;
}

function futurView(k, t) {
  if (projInv[cur] === undefined) { const p = t.pays.slice(-8); projInv[cur] = p.length ? r50(p.reduce((a, b) => a + b, 0) / p.length) : k.weekly; }
  projInv[cur] = Math.max(0, Math.min(500, projInv[cur]));
  if (!projStrat[cur]) projStrat[cur] = projPost(cur);
  const ps = projStrat[cur], pts = project(cur, projInv[cur], ps);
  if (!pts.length) return `<h2 class="title">Ton futur</h2><section class="card"><p>Tu as 18 ans : le trésor est à toi !</p></section>`;
  if (!pts.some(p => p.age === sel[cur])) sel[cur] = pts[pts.length - 1].age;
  // Même échelle pour toutes les stratégies : sinon la plus haute barre fait toujours la même taille et on ne voit pas la différence.
  const max = Math.max(1, ...Object.keys(POST).flatMap(q => project(cur, projInv[cur], q).map(p => p.total))), Pt = pts.find(p => p.age === sel[cur]);
  const bars = pts.map(p => { const pos = p.own + p.bonus + Math.max(0, p.gains) || 1, s = v => (Math.max(0, v) / pos * 100).toFixed(2);
    return `<button class="bar ${p.age === sel[cur] ? 'on' : ''}" data-act="bar" data-age="${p.age}" aria-label="À ${p.age} ans : ${f(r50(p.total))}"><span class="area"><span class="stk" style="height:${(p.total / max * 100).toFixed(2)}%"><i style="height:${s(p.own)}%;background:var(--own)"></i><i style="height:${s(p.bonus)}%;background:var(--gold)"></i><i style="height:${s(p.gains)}%;background:var(--grow)"></i></span></span><span class="age">${p.age}</span></button>`; }).join('');
  const full = projInv[cur] !== k.weekly ? project(cur, k.weekly, ps).find(p => p.age === sel[cur]) : null;
  const cmp = Object.keys(POST).map(q => ({ q, v: r50(project(cur, projInv[cur], q).find(p => p.age === sel[cur]).total) })), cmax = Math.max(1, ...cmp.map(c => c.v));
  const quick = [...new Set([k.weekly, 10, 20, 50])].sort((a, b) => a - b);
  return `<h2 class="title">Et si tu continuais jusqu’à 18 ans ?</h2><p class="lead">Touche une barre pour voir ton trésor à cet âge.</p>
<section class="card"><div class="step">Je place <button data-act="pm" aria-label="Moins">−</button><span class="n">${f(projInv[cur])}</span><button data-act="pp" aria-label="Plus">+</button> par semaine</div>
<div class="pills">${quick.map(n => `<button class="pill" data-act="pset" data-n="${n}" aria-pressed="${projInv[cur] === n}">${n === k.weekly ? `Ma paie (${f(n)})` : f(n)}</button>`).join('')}</div>
<p style="margin:14px 0 6px;font-weight:800">Avec la stratégie</p><div class="pills">${Object.keys(POST).map(q => `<button class="pill" data-act="pstrat" data-n="${q}" aria-pressed="${ps === q}">${POST[q].name}</button>`).join('')}</div>
<p class="soft small" style="margin:6px 0 0">C’est pour essayer : ta vraie stratégie ne change pas, tu la choisis dans « Bourse ».</p>
${projInv[cur] > k.weekly ? `<p class="soft small" style="margin:10px 0 0">C’est plus que ton argent de poche : il faudrait y ajouter l’argent que tu reçois (cadeaux, anniversaires, petits services).</p>` : ''}
<div class="bars" style="grid-template-columns:repeat(${pts.length},minmax(0,1fr))">${bars}</div>
<p class="cap">À <b>${Pt.age} ans</b>, ta tirelire contiendrait <b>${f(r50(Pt.total))}</b> : ${f(r50(Pt.own))} de ton argent, ${f(r50(Pt.bonus))} de bonus ${P().de} et <b class="g">${f(r50(Math.max(0, Pt.gains)))} gagnés tout seuls</b>.</p>
<p class="soft" style="margin:0">Regarde le vert : plus tu attends, plus il grossit vite, parce que ce que ton argent a gagné se met à gagner lui aussi.${full ? ` Avec ta paie de ${f(k.weekly)} chaque semaine, tu aurais ${f(r50(full.total))} à ${full.age} ans.` : ''}</p>
${calcHow(cur, projInv[cur], 'ce que tu choisis de placer ci-dessus', ps)}</section>
<h3 class="sec">À ${Pt.age} ans, selon ta stratégie</h3>
<section class="card"><ul class="cmp">${cmp.map(c => `<li class="${c.q === ps ? 'on' : ''}"><button data-act="pstrat" data-n="${c.q}"><span class="cn">${POST[c.q].name}</span><span class="cb"><i style="width:${(c.v / cmax * 100).toFixed(1)}%"></i></span><b>${f(c.v)}</b></button></li>`).join('')}</ul>
<p class="soft small" style="margin:8px 0 0">Même argent placé chaque semaine : la différence, c’est ce que la bourse a fait grossir, et ce que ces gains ont gagné à leur tour. Mais attention : plus on peut gagner, plus les semaines peuvent être mauvaises.</p></section>`;
}


/* Explication du calcul des projections, en mots d'enfant. */
function calcHow(id, perWeek, label, strat) {
  const t = tot(id), have = Math.max(0, t.total), p = strat || postOf(id), pp = strat || projPost(id), open = bourseOpen(id), m = strat ? POST[strat].faces.reduce((x, y) => x + y, 0) / 6 / 100 : projMean(id), bonus = r2(perWeek * F.match / 100);
  const month = r50(have * m * 52 / 12); // gain moyen du dé sur un mois, en pièces de 50 c
  const dice = pp === 'none'
    ? 'Avec « Je ne joue pas », le dé ne compte pas : seuls ton argent et le bonus font grossir la tirelire.'
    : `Pour le dé, on imagine des semaines moyennes de la stratégie <b>${POST[pp].name}</b>${!strat && pp !== postOf(id) ? ', celle du milieu, même si tu ne joues pas en ce moment' : ''}${!open ? `, à partir du moment où ta bourse s’ouvrira (quand ta tirelire aura ${f(BOURSE_MIN)})` : ''}. En moyenne, le dé fait gagner un peu plus qu’il ne fait perdre.${open ? (month > 0 ? ` Avec ta tirelire actuelle, ça fait environ <b class="g">${f(month)} de plus par mois</b>.` : ' Avec ta tirelire actuelle, c’est encore presque rien.') : ''}`;
  return `<details class="how"><summary>Comment on calcule ?</summary><ol>
<li>On part de ce qu’il y a dans ta tirelire aujourd’hui : <b>${f(have)}</b>.</li>
<li>Chaque semaine, on ajoute ${label} : <b>${f(perWeek)}</b>${bonus > 0 ? `, plus le bonus ${P().de} : <b>${f(bonus)}</b>` : ''}.${F.raise ? ' Et à chaque anniversaire, ta paie augmente de 0,50 € : on en tient compte.' : ''}</li>
<li>${dice}${pp === 'none' ? '' : ' Plus la tirelire grossit, plus ce petit plus grossit aussi.'}</li>
</ol><p>Si tu changes de stratégie, le calcul prend tout de suite la nouvelle. Et en vrai, tes lancers seront parfois meilleurs, parfois moins bons : c’est une estimation, pas une promesse.</p></details>`;
}
function projetView(k, t) {
  const g = goalOf(cur), done = evs(cur).filter(e => e.t === 'projet').reverse(), dis = ready ? '' : 'disabled';
  const doneHtml = done.length ? `<section class="card"><h3>Mes projets réalisés</h3><ul class="log">${done.map(e => `<li><time>${dateFr(e.d)}</time><span>${esc(e.label)}</span><b>${f(e.amount)}</b></li>`).join('')}</ul></section>` : '';
  if (!g || goalEdit) {
    return `<h2 class="title">${g ? 'Modifier mon projet' : 'Mon projet'}</h2><p class="lead">Un vélo, un jeu, une sortie ? Fixe-toi un objectif et regarde-toi avancer, palier après palier. Pas d’idée pour l’instant ? Ce n’est pas obligatoire : ta tirelire grossit quand même. Et pourquoi pas commencer à financer ton permis de conduire ?</p>
<section class="card"><label>Mon projet<input id="go-name" type="text" autocomplete="off" maxlength="30" data-f="goalname" value="${esc(form.goalname)}" placeholder="Ex. : un vélo"></label>
<div class="pills">${['Vélo', 'Trottinette', 'Jeu vidéo', 'Livres', 'Sortie', 'Cadeau', 'Permis de conduire'].map(n => `<button class="pill" data-act="goalpick" data-n="${n}" aria-pressed="${form.goalname === n}">${n}</button>`).join('')}</div>
<label>Combien ça coûte ? (€)<input id="go-budget" type="text" inputmode="decimal" autocomplete="off" data-f="goalbudget" value="${esc(form.goalbudget)}" placeholder="Ex. : 150"></label>
<div class="row">${g ? '<button class="btn ghost" data-act="goalcancel">Annuler</button>' : ''}<button class="btn" data-act="goalset" ${dis}>${g ? 'Enregistrer' : 'Créer mon projet'}</button></div></section>${doneHtml}`;
  }
  const have = Math.max(0, t.total), p = Math.min(1, have / g.budget), reached = have >= g.budget;
  const w1 = eta(cur, avgInv(cur)), wAll = eta(cur, k.weekly);
  const flags = MS.map(m => `<span class="flag ${p >= m ? 'on' : ''}" style="left:${m * 100}%">${p >= m ? I.check : ''}</span><span class="flagl" style="left:${m * 100}%">${m === 1 ? esc(g.name) : msShort(m, cur)}</span>`).join('');
  return `<h2 class="title">Mon projet</h2>
<section class="card goal"><p class="lbl" style="margin:0">Objectif</p><h3 class="gname">${esc(g.name)}</h3>
<div class="gnum">${msBand(cur) === 'pct' ? `<span class="amount">${Math.floor(p * 100)} %</span><span>${f(have)} sur ${f(g.budget)}</span>` : `<span class="amount">${f(have)}</span><span>sur ${f(g.budget)}</span>`}</div>
<div class="track"><div class="road"><i style="width:${(p * 100).toFixed(1)}%"></i></div>${flags}<span class="me" style="left:${(p * 100).toFixed(1)}%">${esc(k.name.slice(0, 1).toUpperCase())}</span></div>
${reached ? '' : `<p style="margin:6px 0 0">Il te manque <b>${f(g.budget - have)}</b>.${etaTxt(w1) ? ` Si tu continues comme ça, tu l’auras ${etaTxt(w1)}.` : ' Place un peu chaque semaine pour avancer.'}</p>${wAll !== null && w1 !== null && wAll < w1 ? `<p class="soft small" style="margin:6px 0 0">En plaçant toute ta paie (${f(k.weekly)} par semaine) : ${etaTxt(wAll)}.</p>` : ''}${calcHow(cur, avgInv(cur), avgInv(cur) === k.weekly && !tot(cur).pays.length ? 'ta paie' : 'ce que tu places d’habitude (la moyenne de tes dernières paies)')}`}</section>
${reached ? `<section class="card celebrate"><h3>C’est pépite ! Objectif atteint</h3><p style="margin:0">Prépare ta présentation ${P().a} : pourquoi tu le veux, combien il coûte, ce qu’il va t’apporter. S’ils sont convaincus, ils débloqueront ton argent.</p></section>` : ''}
<section class="card"><h3>${msBand(cur) === 'step' ? 'Les étapes' : 'Les paliers'}</h3><p class="soft small" style="margin:0 0 6px">${msHow(cur)}</p><ul class="log mslog">${MS.map(m => { const v = r2(g.budget * m), ok = have >= v; return `<li><span class="msi ${ok ? 'g' : 'soft'}">${ok ? I.check : '○'}</span><span class="mst"><b>${m === 1 ? 'Objectif complet' : msLong(m, cur)} : ${f(v)}</b><small class="${ok ? 'g' : 'soft'}">${ok ? 'atteint' : 'encore ' + f(v - have)}</small></span></li>`; }).join('')}</ul></section>
<div class="row"><button class="btn ghost sm" data-act="goaledit">Modifier</button><button class="btn ghost sm" data-act="goaldrop">${goalDropArm ? 'Confirmer l’abandon' : 'Abandonner ce projet'}</button></div>${doneHtml}`;
}

function carnetView(k) {
  const ev = evs(cur).slice(-40).reverse().map(e => {
    if (e.t === 'paie') return `<li><time>${dateFr(e.d)}</time><span>Paie : ${f(e.inv)} placés, ${f(e.dep)} dans le porte-monnaie</span><b class="g">+${f(e.inv + e.bonus)}</b></li>`;
    if (e.t === 'recu' && (e.pending || e.refused)) return `<li><time>${dateFr(e.d)}</time><span>Reçu${e.from ? ' de ' + esc(e.from) : ''} : ${f(e.inv + e.dep)}</span><b class="soft">${e.pending ? 'en attente' : 'refusé'}</b></li>`;
    if (e.t === 'recu') return `<li><time>${dateFr(e.d)}</time><span>Reçu${e.from ? ' de ' + esc(e.from) : ''} : ${f(e.inv)} placés, ${f(e.dep)} dans le porte-monnaie</span><b class="g">+${f(e.inv + e.bonus)}</b></li>`;
    if (e.t === 'bourse') return `<li><time>${dateFr(e.d)}</time><span>Bourse : dé ${e.face}</span><b class="${e.gain < 0 ? 'neg' : 'g'}">${e.gain < 0 ? '−' : '+'}${f(Math.abs(e.gain))}</b></li>`;
    if (e.t === 'posture') return `<li><time>${dateFr(e.d)}</time><span>Stratégie de bourse : ${POST[e.p] ? POST[e.p].name : e.p}</span><b class="soft">—</b></li>`;
    if (e.t === 'pause') return `<li><time>${dateFr(e.d)}</time><span>Paie mise en pause${e.reason ? ' : ' + esc(e.reason) : ''}</span><b class="soft">—</b></li>`;
    if (e.t === 'reprise') return `<li><time>${dateFr(e.d)}</time><span>Paie reprise</span><b class="soft">—</b></li>`;
    if (e.t === 'donne') return `<li><time>${dateFr(e.d)}</time><span>Porte-monnaie reçu en vrai</span><b class="soft">${f(e.amount)}</b></li>`;
    if (e.t === 'vire') return `<li><time>${dateFr(e.d)}</time><span>Mis en lieu sûr ${P().de}</span><b class="soft">${f(e.amount)}</b></li>`;
    return `<li><time>${dateFr(e.d)}</time><span>Projet : ${esc(e.label)}</span><b class="neg">−${f(e.amount)}</b></li>`;
  }).join('') || '<li class="soft">Rien encore : ta première paie arrive bientôt.</li>';
  return `<h2 class="title">Mon carnet</h2><p class="lead">Tout ce qui est entré et sorti de ta tirelire.</p><section class="card"><ul class="log">${ev}</ul></section>`;
}

const lastTxtOf = last => last ? ({ paie: 'la paie du ', bourse: 'le lancer du ', recu: 'l’argent reçu le ', vire: 'le virement du ', donne: 'le porte-monnaie donné le ', projet: 'le projet du ', pause: 'la pause du ', reprise: 'la reprise du ', posture: 'le choix de stratégie du ' }[last.t] || '') + dateFr(last.d) : '';
function pinView() {
  return `<section class="pin">${pinFor ? `<button class="backlink" data-act="pinout">${I.chev}<span>Retour</span></button>` : ''}${lock && pinAsk ? `<button class="backlink" data-act="pinout">${I.chev}<span>Paramètres</span></button>` : ''}<h2 class="title">${pinFor ? 'Validation par un parent' : lock && pinAsk ? 'Déverrouiller l’appareil' : 'Espace parents'}</h2><p class="lead">Tape le code parents.</p>
<div class="dots">${[0, 1, 2, 3].map(i => `<i class="${i < pinBuf.length ? 'on' : ''}"></i>`).join('')}</div>${pinBad ? '<p class="neg" style="margin:0;font-weight:800">Mauvais code</p>' : ''}
<div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="key" data-act="pin" data-n="${n}">${n}</button>`).join('')}<span></span><button class="key" data-act="pin" data-n="0">0</button><button class="key" data-act="pinback" style="font-size:16px">Effacer</button></div></section>`;
}


/* ---------- Leçons de l'enfant ---------- */
const lessonList = () => lessons({ ...H(), bonusKid, match: F.match });
function leconsView() {
  const L = lessonList();
  const par = lessonFrom === 'parents';
  return `${par ? `<button class="backlink" data-act="go" data-v="parents">${I.chev}<span>Espace parents</span></button><p class="kicker">Côté enfant</p>` : ''}<h2 class="title">Comprendre l’argent</h2><p class="lead">${par ? `Les ${L.length} leçons que lit votre enfant, avec leur quiz. Les mêmes notions que vos articles, à hauteur d’enfant : de quoi en reparler ensemble à table.` : `${L.length} petites leçons pour devenir un as de l’argent. Chacune se lit, ou s’écoute, en deux minutes.`}</p><button class="item art-item vitem" data-act="video" style="margin-bottom:12px"><span class="ic artn vic"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg></span><span><small>La vidéo · 2 min 30</small><b>Comment marche Pépite</b></span><span class="end">${I.chev}</span></button>
<div class="list">${L.map((x, i) => { const done = kq[x.id] === x.quiz.ok || !!(kidOf(cur) && kidOf(cur).lq && kidOf(cur).lq[x.id]); if (i >= lessonsOpen(cur)) return `<div class="item art-item locked"><span class="ic artn">${LOCK}</span><span><small>${x.term}</small><b>${i === lessonsOpen(cur) ? 'Se débloque à ta prochaine paie' : 'Bientôt débloquée'}</b></span></div>`; return `<button class="item art-item" data-act="lecon" data-n="${x.id}"><span class="ic artn">${done ? I.check : x.n}</span><span><small>${x.term}</small><b>${x.title}</b></span><span class="end">${I.chev}</span></button>`; }).join('')}</div>${lessonFrom !== 'parents' && lessonsOpen(cur) < L.length ? '<p class="soft small" style="margin:10px 4px 0">Une nouvelle leçon se débloque chaque fois que tu ranges ta paie de la semaine.</p>' : ''}`;
}
function leconView() {
  const L = lessonList(), i = Math.max(0, L.findIndex(x => x.id === lessonId)), x = L[i], next = L[i + 1], ans = kq[x.id];
  return `<button class="backlink" data-act="go" data-v="lecons">${I.chev}<span>${lessonFrom === 'parents' ? 'Les leçons' : 'Mes leçons'}</span></button>
<article class="art lesson"><p class="kicker">Leçon ${x.n} · ${x.term}</p><h2>${x.title}</h2>
<button class="link gspeak" data-act="kread" style="margin:6px 0 4px">${I.speak}Écoute la leçon</button>
<p class="alead">${x.intro}</p>${x.body}
<div class="keep"><h4>Le savais-tu ?</h4><p style="margin:0">${x.know}</p></div>
<section class="quiz"><h4>Petit quiz</h4><p>${x.quiz.q}</p><div class="list">${x.quiz.a.map((t, j) => `<button class="btn ${ans === j ? (j === x.quiz.ok ? 'gr' : 'danger') : 'ghost'} full" data-act="kq" data-n="${j}">${t}</button>`).join('')}</div>
${ans !== undefined ? `<p class="qfb ${ans === x.quiz.ok ? 'g' : 'neg'}">${ans === x.quiz.ok ? x.quiz.yes : x.quiz.no + ' Essaie encore !'}</p>` : ''}</section>
</article>
${next && i + 1 < lessonsOpen(cur) ? `<button class="item art-item nextart" data-act="lecon" data-n="${next.id}"><span class="ic artn">${next.n}</span><span><small>Leçon suivante</small><b>${next.title}</b></span><span class="end">${I.chev}</span></button>` : `${next ? '<p class="soft small" style="margin:14px 4px 0;text-align:center">La leçon suivante se débloque à ta prochaine paie.</p>' : ''}<div class="row"><button class="btn full" data-act="go" data-v="lecons">${lessonFrom === 'parents' ? 'Toutes les leçons' : 'Toutes mes leçons'}</button></div>`}`;
}
function lockedView() {
  const dis = ready ? '' : 'disabled', K = kidOf(cur), last = evs(cur)[evs(cur).length - 1], can = last && KID_UNDO.includes(last.t);
  return `<h2 class="title">Paramètres</h2>
<section class="card"><h3>Cet appareil est verrouillé</h3><p class="soft small" style="margin:0">Il est réservé à ${esc(K.name)}. Pour revenir à l’espace parents, un parent tape son code.</p>
<div class="row"><button class="btn sm" data-act="askpin">Déverrouiller l’appareil</button></div></section>
<section class="card"><h3>Corriger une erreur</h3>
${!last ? `<p class="soft" style="margin:0">Rien à annuler.</p>` : can ? `<p class="soft small" style="margin:0">Une erreur en rangeant tes pièces\u00a0? Tu peux annuler ${lastTxtOf(last)} et recommencer.</p><div class="row"><button class="btn ghost sm" data-act="undo" ${dis}>${undoArm ? 'Confirmer : annuler ' + lastTxtOf(last) : 'Annuler ' + lastTxtOf(last)}</button></div>`
  : `<p class="soft small" style="margin:0">Seul un parent peut annuler ${lastTxtOf(last)}.</p>`}</section>
<section class="card"><h3>Mes leçons</h3><p class="soft small" style="margin:0">6 petites leçons pour comprendre l’argent, avec un quiz.</p><div class="row"><button class="btn ghost sm" data-act="go" data-v="lecons">Ouvrir mes leçons</button></div></section>
<section class="card"><h3>Le guide de Pépite</h3><p class="soft small" style="margin:0">Pépite te remontre tout, pas à pas.</p><div class="row"><button class="btn ghost sm" data-act="gstart">Revoir le guide</button></div></section>
<section class="card"><h3>Ma couleur</h3><p class="soft small" style="margin:0">Choisis la couleur de ta tirelire et de ton appli.</p>
<div class="swatches">${PAL.map((c, ci) => `<button class="sw" style="--c:${c}" title="${PALN[ci]}" data-act="mycolor" data-c="${c}" aria-pressed="${K.color === c}" aria-label="${PALN[ci]}" ${dis}></button>`).join('')}</div></section>
<section class="card"><h3>Apparence et sons</h3><p class="soft small" style="margin:0">Réglages propres à cet appareil.</p>
<div class="pills">${[['light', 'Clair'], ['dark', 'Sombre']].map(([v, l]) => `<button class="pill" data-act="theme" data-n="${v}" aria-pressed="${theme === v}">${l}</button>`).join('')}</div>
<div class="pills">${[['on', 'Sons activés'], ['off', 'Sons coupés']].map(([v, l]) => `<button class="pill" data-act="sons" data-n="${v}" aria-pressed="${(v === 'on') === sndOn()}">${l}</button>`).join('')}</div></section>`;
}
// Petit sondage aux parents (jamais aux enfants) : après 3 semaines et 2 paies rangées. Réponses gardées dans la fiche famille.
const SV_WTP = [['0', 'Rien, seulement si c’est gratuit'], ['1', '1 € par mois'], ['2', '2 € par mois'], ['3-5', '3 à 5 € par mois'], ['5+', 'Plus de 5 € par mois']];
const SV_SRC = [['ami', 'Un ami ou la famille'], ['reseaux', 'Les réseaux sociaux'], ['ecole', 'L’école ou une association'], ['autre', 'Autrement']];
function surveyShow() {
  if (!F || F.survey || !ready || (F.svN || 0) >= 3) return false;
  const born = new Date((F.stats && F.stats.created) || F.created || iso()).getTime();
  if (Date.now() - born < 21 * 864e5) return false;
  if (F.svLater && Date.now() - new Date(F.svLater).getTime() < 14 * 864e5) return false;
  return kids().reduce((a, k) => a + paidWeeks(k.id).size, 0) >= 2;
}
function surveyCard() {
  if (form.svDone) return '<section class="card survey"><h3>Merci !</h3><p class="small" style="margin:0">Vos réponses sont bien arrivées. Elles servent directement à décider de la suite de Pépite.</p></section>';
  if (!surveyShow()) return '';
  const pill = (act, v, l, on) => `<button class="pill" data-act="${act}" data-n="${v}" aria-pressed="${on}">${l}</button>`;
  return `<section class="card survey"><h3>3 questions pour améliorer Pépite</h3>
<p class="svq">Recommanderiez-vous Pépite à un autre parent ?</p><div class="nps">${Array.from({ length: 11 }, (_, i) => pill('svnps', i, i, form.svnps === i)).join('')}</div><div class="npsl"><small>Pas du tout</small><small>Sans hésiter</small></div>
<p class="svq">Si Pépite devenait payant un jour, combien seriez-vous prêt à payer pour toute la famille ?</p><div class="pills">${SV_WTP.map(([v, l]) => pill('svwtp', v, l, form.svwtp === v)).join('')}</div>
<p class="svq">Comment avez-vous connu Pépite ?</p><div class="pills">${SV_SRC.map(([v, l]) => pill('svsrc', v, l, form.svsrc === v)).join('')}</div>
<label style="margin-top:10px">Un mot pour expliquer ? (facultatif)<textarea data-f="svtxt" rows="3" maxlength="600">${esc(form.svtxt || '')}</textarea></label>
<div class="row"><button class="btn sm" data-act="svsend" ${form.svnps === undefined || !form.svwtp ? 'disabled' : ''}>Envoyer</button><button class="btn ghost sm" data-act="svlater">Plus tard</button></div></section>`;
}
function parentsView() {
  if (lock && !pinOk) return pinAsk ? pinView() : lockedView();
  const dis = ready ? '' : 'disabled', K = kidOf(cur), last = evs(cur)[evs(cur).length - 1];
  const lastTxt = lastTxtOf(last);
  const pk = form.pkid && kidOf(form.pkid) ? form.pkid : cur;
  const toOk = kids().flatMap(k => tot(k.id).waiting.map(e => ({ k, e })));
  const okCard = toOk.length ? `<section class="card waitcard"><h3>À valider</h3><p class="soft small" style="margin:0">Argent reçu déclaré par les enfants. Il ne compte qu’une fois validé.</p><ul class="log">${toOk.map(({ k, e }) => `<li><span><b>${esc(k.name)}</b> · ${dateFr(e.d)}<br>${giftLine(e)}</span><span class="row" style="margin:0;gap:6px;flex-wrap:nowrap"><button class="btn gr sm" data-act="gok" data-k="${k.id}" data-d="${e.d}" ${ready ? '' : 'disabled'}>Valider</button><button class="btn ghost sm" data-act="gno" data-k="${k.id}" data-d="${e.d}" ${ready ? '' : 'disabled'}>Refuser</button></span></li>`).join('')}</ul></section>` : '';
  return `<h2 class="title">Espace parents</h2>${okCard}${surveyCard()}
<button class="item art-item vitem" data-act="video"><span class="ic artn vic"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg></span><span><small>Le tuto vidéo · 2 min 30</small><b>Comment marche Pépite, à regarder avec votre enfant</b></span><span class="end">${I.chev}</span></button>
<button class="item art-item parentread" data-act="go" data-v="lire"><span class="ic artn">${NUG('', '')}</span><span><small>Toi, parent · 5 lectures courtes</small><b>La méthode Pépite, pour bien accompagner votre enfant</b></span><span class="end">${I.chev}</span></button>
<button class="item art-item parentkid" data-act="go" data-v="lecons" data-from="parents"><span class="ic artn">${I.book}</span><span><small>Côté enfant · 6 leçons et quiz</small><b>Ce que lit votre enfant, pour en parler ensemble</b></span><span class="end">${I.chev}</span></button>
<button class="item art-item" data-act="go" data-v="avis"><span class="ic artn">${I.gift}</span><span><small>Ton avis compte</small><b>Donner mon avis sur Pépite</b></span><span class="end">${I.chev}</span></button>
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
<section class="card"><h3>Mettre la paie en pause</h3><p class="soft small" style="margin:0">En cas de conflit, la paie peut être suspendue. Les semaines en pause ne sont pas rattrapées. La tirelire, elle, reste à l’enfant : elle continue de travailler avec la bourse et il peut toujours y ranger l’argent reçu.</p>
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
<section class="card"><h3>Les enfants</h3>${kids().map(k => `<div class="kidform"><header><h3 style="font-size:19px">${esc(k.name)}</h3><button class="link" data-act="gstart" data-k="${k.id}">Lancer le guide</button>${kids().length > 1 ? `<button class="link" data-act="kdel" data-k="${k.id}">${delArm === k.id ? 'Confirmer la suppression' : 'Supprimer'}</button>` : ''}</header>
<label>Prénom<input id="k-n-${k.id}" type="text" autocomplete="off" maxlength="20" value="${esc(k.name)}" data-set="kname:${k.id}"></label>
<div class="grid2"><label>Naissance<input id="k-b-${k.id}" type="date" value="${esc(k.birth)}" data-set="kbirth:${k.id}"></label>
<label>Par semaine (€)<input id="k-w-${k.id}" type="number" inputmode="decimal" min="1" max="50" step="0.5" value="${k.weekly}" data-set="kweekly:${k.id}"></label></div>
<div class="swatches">${PAL.map((c, ci) => `<button class="sw" style="--c:${c}" title="${PALN[ci]}" data-act="kcolor" data-k="${k.id}" data-c="${c}" aria-pressed="${k.color === c}" aria-label="${PALN[ci]}"></button>`).join('')}</div></div>`).join('')}
<div class="row"><button class="btn ghost full" data-act="kadd" ${dis}>Ajouter un enfant</button></div></section>
<section class="card"><h3>Les règles du jeu</h3><p class="soft small" style="margin:0">Une paie par semaine, à ranger le jour qui vous arrange (la semaine va du lundi au dimanche). Si vous la versez en retard, les paies non rangées restent disponibles ${BACKLOG} semaines, puis elles sont perdues. </p><p class="soft small" style="margin:6px 0 0">Les bonus ne s’appliquent qu’à l’argent placé (les pièces que l’enfant place), jamais à celui qui va dans le porte-monnaie.</p>
<p style="margin:12px 0 4px;font-weight:800">Faire valider l’argent reçu par un parent</p><div class="pills">${[[true, 'Oui'], [false, 'Non']].map(([v, l]) => `<button class="pill" data-act="giftcheck" data-n="${v}" aria-pressed="${giftCheck() === v}" ${ready ? '' : 'disabled'}>${l}</button>`).join('')}</div>
<p class="soft small" style="margin:4px 0 0">Quand un enfant déclare de l’argent reçu, il ne compte qu’après votre validation : avec le code parents sur son écran, ou ici, dans « À valider ».</p>
<p style="margin:12px 0 4px;font-weight:800">Augmenter la paie de 0,50 € à chaque anniversaire</p><div class="pills">${[[true, 'Oui'], [false, 'Non']].map(([v, l]) => `<button class="pill" data-act="raise" data-n="${v}" aria-pressed="${!!F.raise === v}" ${ready ? '' : 'disabled'}>${l}</button>`).join('')}</div>
<p class="soft small" style="margin:4px 0 0">Le jour de son anniversaire, la paie de l’enfant augmente toute seule. Elle est aussi prise en compte dans les projections.</p>
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
${standalone() ? '' : `<section class="card"><h3>Installer Pépite sur ce téléphone</h3>${installEv ? `<p class="soft small" style="margin:0">Une icône sur l’écran d’accueil, et l’appli s’ouvre en plein écran comme les autres.</p><div class="row"><button class="btn sm" data-act="install">Installer l’appli</button></div>` : `<p class="soft small" style="margin:0">Dans Chrome, touchez le menu ⋮ en haut à droite, puis « Ajouter à l’écran d’accueil » ou « Installer l’application ». Sur iPhone, dans Safari : bouton Partager, puis « Sur l’écran d’accueil ».</p>`}</section>`}
<section class="card"><h3>Apparence et sons</h3><p class="soft small" style="margin:0">Réglages propres à cet appareil.</p>
<div class="pills">${[['light', 'Clair'], ['dark', 'Sombre']].map(([v, l]) => `<button class="pill" data-act="theme" data-n="${v}" aria-pressed="${theme === v}">${l}</button>`).join('')}</div>
<div class="pills">${[['on', 'Sons activés'], ['off', 'Sons coupés']].map(([v, l]) => `<button class="pill" data-act="sons" data-n="${v}" aria-pressed="${(v === 'on') === sndOn()}">${l}</button>`).join('')}</div></section>
<button class="item art-item" data-act="go" data-v="apropos"><span class="ic artn aboutic"><img src="img/matthieu.jpg" alt="" width="40" height="40"></span><span><small>À propos</small><b>Qui a créé Pépite\u00a0?</b></span><span class="end">${I.chev}</span></button>
${pushCard()}
<section class="card" id="compte"><h3>Compte</h3><p class="soft small" style="margin:0">Connecté avec ${esc(user.email || '')}. Version de l’appli : ${VERSION}.</p><div class="row"><button class="btn ghost sm" data-act="logout">Déconnecter cet appareil</button></div>
<h4 style="margin:16px 0 4px">Vos données</h4><p class="soft small" style="margin:0">Statistiques d’usage, pour améliorer Pépite (jamais de publicité).</p>
<div class="pills">${[['on', 'Activées'], ['off', 'Désactivées']].map(([v, l]) => `<button class="pill" data-act="stats" data-n="${v}" aria-pressed="${(v === 'off') === !!F.noStats}" ${dis}>${l}</button>`).join('')}</div>
<div class="row"><button class="btn ghost sm" data-act="export" ${dis}>Télécharger l’historique de la famille</button></div><p class="soft small" style="margin:4px 0 0">Un tableau à ouvrir dans Excel ou Google Sheets : toutes les opérations de chaque enfant, ligne par ligne.</p>
${delAcct ? `<div class="danger-zone"><p style="margin:0"><b>Supprimer le compte de la famille</b><br><span class="soft small">Le compte et l’historique de tous les enfants seront effacés définitivement, sur tous les appareils. Pensez à télécharger les données avant si vous voulez les garder.</span></p>
<label>Votre mot de passe, pour confirmer<input id="del-pass" type="password" autocomplete="current-password" data-f="delpass" value="${esc(form.delpass)}"></label>${delErr ? `<p class="neg small" style="margin:6px 0 0;font-weight:700">${esc(delErr)}</p>` : ''}
<div class="row"><button class="btn ghost sm" data-act="delcancel">Annuler</button><button class="btn danger sm" data-act="deldo" ${busy ? 'disabled' : ''}>Supprimer définitivement</button></div></div>` : `<div class="row"><button class="btn ghost sm dangertxt" data-act="delopen">Supprimer le compte de la famille</button></div>`}
<div class="row"><button class="link" data-act="go" data-v="confidentialite">Politique de confidentialité</button>${isAdmin() ? '<button class="link" data-act="go" data-v="admin">Tableau de bord d’usage</button>' : ''}</div></section>`;
}



/* ---------- installation, confidentialité, données, mesure ---------- */
const isAdmin = () => !!(user && user.email && user.email.toLowerCase() === ADMIN.toLowerCase());
const srcOf = () => { try { return localStorage.getItem('pepite-src') || ''; } catch (e) { return ''; } };
const showGate = () => isMobile && !standalone() && !gateOff && view !== 'confidentialite';
function gateView() {
  const url = location.href.split('#')[0], host = url.replace(/^https?:\/\//, '');
  const chrome = /Android/i.test(UA) ? `intent://${host}#Intent;scheme=https;package=com.android.chrome;end` : url;
  let body;
  if (installed) body = `<h2>C’est installé !</h2><p>Ouvre Pépite depuis l’écran d’accueil de ton téléphone : elle s’y trouve maintenant, comme tes autres applis.</p>`;
  else if (relatedApp) body = `<h2>Pépite est déjà installée</h2><p>Ouvre-la depuis l’écran d’accueil de ce téléphone : tu y retrouveras toute ta famille.</p>`;
  else if (inApp) body = `<h2>Ouvre Pépite dans ${isIOS ? 'Safari' : 'Chrome'}</h2><p>Ce lien s’est ouvert dans une messagerie, qui ne permet pas d’installer l’appli.</p>
${isIOS ? '' : `<div class="row"><a class="btn full" href="${chrome}">Ouvrir dans Chrome</a></div>`}<div class="row"><button class="btn ghost full" data-act="gatecopy">Copier le lien</button></div>${isIOS ? '<p class="soft small">Puis colle-le dans Safari.</p>' : ''}`;
  else if (installEv) body = `<h2>Installe Pépite sur ton téléphone</h2><p>Une icône sur l’écran d’accueil, l’appli en plein écran et tes comptes qui t’attendent, même hors connexion.</p>
<div class="row"><button class="btn gold full big" data-act="install">Installer Pépite</button></div><p class="soft small" style="text-align:center">Gratuit, sans publicité, moins de 1 Mo.</p>`;
  else if (isIOS) body = `<h2>Installe Pépite sur ton iPhone</h2><ol class="steps"><li>Touche le bouton <b>Partager</b> (le carré avec une flèche vers le haut).</li><li>Choisis <b>Sur l’écran d’accueil</b>.</li><li>Touche <b>Ajouter</b>, puis ouvre Pépite depuis ton écran d’accueil.</li></ol>`;
  else body = `<h2>Installe Pépite sur ton téléphone</h2><ol class="steps"><li>Touche le menu <b>⋮</b> en haut à droite de Chrome.</li><li>Choisis <b>Installer l’application</b> ou <b>Ajouter à l’écran d’accueil</b>.</li><li>Ouvre Pépite depuis ton écran d’accueil.</li></ol><p class="soft small" style="margin:8px 0 0">Tu ne vois pas ce choix ? Touche d’abord « Ouvrir dans Chrome » dans le même menu.</p>`;
  return `<main class="view full gate"><div class="welcome">${LOGOBIG}<h1>${WMFULL}</h1></div><section class="card">${body}</section>
<button class="link" data-act="gateskip" style="display:block;margin:14px auto 0">Continuer dans le navigateur</button></main>`;
}
function privacyView() { return privacyHTML({ contact: CONTACT, I, user }); }
// Repères d'usage : une écriture par jour au plus, rien si la famille a refusé les statistiques.
// ---------- Mesure d'usage (désactivable par chaque famille) ----------
// Par semaine : [ouvertures, ouvertures sur un appareil d'enfant, visites de l'Espace parents]. Appareils : système, appareil d'enfant, appli installée.
const ymdL = ms => { const x = new Date(ms); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const osOf = () => /android/i.test(navigator.userAgent) ? 'android' : /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'ios' : 'ordinateur';
const devLocal = () => { try { let d = localStorage.getItem('pepite-dev'); if (!d) { d = Math.random().toString(16).slice(2, 10); localStorage.setItem('pepite-dev', d); } return d; } catch (e) { return 'x'; } };
// Ouverture depuis une notification : ?n=type, retiré de l'adresse aussitôt.
let notifOpen = (() => { try { const q = new URLSearchParams(location.search), n = (q.get('n') || '').replace(/[^\w-]/g, '').slice(0, 20); if (n) { q.delete('n'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); } return n; } catch (e) { return ''; } })();
let hiddenAt = 0, parentSeen = false;
function touchSession() {
  if (!F || F.noStats || !ready || !F.stats) return;
  const st = F.stats, w = st.wk || (st.wk = {}), key = ymdL(wk(new Date())), r = w[key] || (w[key] = [0, 0, 0]);
  r[0]++; if (lock) r[1]++;
  const ks = Object.keys(w).sort(); while (ks.length > 104) delete w[ks.shift()];
  const dv = st.dv || (st.dv = {}); dv[devLocal()] = { os: osOf(), k: lock ? 1 : 0, i: standalone() ? 1 : 0, l: iso().slice(0, 10) };
  const dk = Object.keys(dv).sort((a, b) => (dv[a].l || '').localeCompare(dv[b].l || '')); while (dk.length > 12) delete dv[dk.shift()];
  if (notifOpen) { const nc = st.nc || (st.nc = {}); nc[notifOpen] = (nc[notifOpen] || 0) + 1; notifOpen = ''; }
  parentSeen = false;
  saveF();
}
function markParent() {
  if (parentSeen || !F || F.noStats || !ready || !F.stats || !F.stats.wk) return;
  const r = F.stats.wk[ymdL(wk(new Date()))]; if (!r) return;
  r[2]++; parentSeen = true; saveF();
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 30 * 60e3) { hiddenAt = 0; touchSession(); } });
function touchStats(force) {
  if (!F || F.noStats) return;
  const today = iso().slice(0, 10), first = kids().flatMap(k => evs(k.id)).map(e => e.d).sort()[0];
  const st = F.stats || (F.stats = { created: F.created || first || iso(), days: 0 });
  let ch = !!force;
  if (st.seen !== today) { st.seen = today; st.days = (st.days || 0) + 1; ch = true; }
  if (standalone() && !st.inst) { st.inst = today; ch = true; }
  if (!st.src && srcOf()) { st.src = srcOf(); ch = true; }
  if (ch && !force) saveF();
}
// Export RGPD lisible : un tableau (CSV) qui s'ouvre dans Excel ou Google Sheets, une ligne par opération.
function exportData() {
  const n = v => typeof v === 'number' && v ? String(r2(v)).replace('.', ',') : '';
  const cell = v => { const t = String(v ?? ''); return /[;"\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  const day = d => d ? new Date(d).toLocaleDateString('fr-FR') : '';
  const rows = [['Enfant', 'Date', 'Opération', 'Placé dans la tirelire (€)', 'Porte-monnaie (€)', 'Bonus des parents (€)', 'Gain ou perte bourse (€)', 'Sorti de la tirelire (€)', 'Détail']];
  for (const k of kids()) {
    rows.push([k.name, day(k.start), 'Inscription', '', '', '', '', '', `${validBirth(k.birth) ? 'né(e) le ' + day(k.birth + 'T12:00:00') + ', ' : ''}paie de ${f(k.weekly)} par semaine`]);
    for (const e of evs(k.id)) {
      const r = [k.name, day(e.d)];
      if (e.t === 'paie') r.push('Paie rangée', n(e.inv), n(e.dep), n(e.bonus), '', '', '');
      else if (e.t === 'recu') r.push('Argent reçu', n(e.inv), n(e.dep), n(e.bonus), '', '', [e.from ? 'de ' + e.from : '', e.pending ? 'en attente de validation' : e.refused ? 'refusé par un parent' : ''].filter(Boolean).join(', '));
      else if (e.t === 'bourse') r.push('Dé de la bourse', '', '', '', String(r2(e.gain)).replace('.', ','), '', `face ${e.face}`);
      else if (e.t === 'projet') r.push('Projet acheté', '', '', '', '', n(e.amount), e.label || '');
      else if (e.t === 'vire') r.push('Rangé en lieu sûr par les parents', '', '', '', '', '', f(e.amount || 0));
      else if (e.t === 'donne') r.push('Porte-monnaie donné', '', '', '', '', '', f(e.amount || 0));
      else if (e.t === 'pause') r.push('Paie en pause', '', '', '', '', '', e.reason || '');
      else if (e.t === 'reprise') r.push('Reprise de la paie', '', '', '', '', '', '');
      else if (e.t === 'posture') r.push('Stratégie de bourse', '', '', '', '', '', POST[e.p] ? POST[e.p].name : e.p || '');
      else continue;
      rows.push(r);
    }
    if (goalOf(k.id)) rows.push([k.name, '', 'Projet en cours', '', '', '', '', '', `${goalOf(k.id).name} (${f(goalOf(k.id).budget)})`]);
  }
  rows.push([], ['Famille', '', 'Réglages', '', '', '', '', '', `bonus de ${F.match} % sur la paie placée, ${F.giftMatch} % sur l’argent reçu ; compte ${user.email} ; export du ${day(iso())}`]);
  const csv = '﻿' + rows.map(r => r.map(cell).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'pepite-historique-' + iso().slice(0, 10) + '.csv';
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function deleteAccount() {
  if (!user || busy) return;
  if (!form.delpass) { delErr = 'Tapez votre mot de passe pour confirmer.'; return render(); }
  busy = true; delErr = ''; render();
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, form.delpass));
    const uid = user.uid, ids = kids().map(k => k.id);
    stopSync();
    await Promise.all(ids.map(id => deleteDoc(doc(fdb, 'familles', uid, 'enfants', id))));
    await deleteDoc(doc(fdb, 'familles', uid));
    await deleteUser(user);
    try { ['pepite-lock', 'pepite-consent', 'pepite-src'].forEach(k => localStorage.removeItem(k)); } catch (e) {}
    lock = null; delAcct = false; form.delpass = ''; view = 'home'; loginMsg = 'Le compte de la famille et toutes ses données ont été supprimés.';
  } catch (e) {
    const c = e && e.code || '';
    delErr = c.includes('wrong-password') || c.includes('invalid-credential') ? 'Mot de passe incorrect.' : c.includes('too-many-requests') ? 'Trop d’essais : réessayez dans quelques minutes.' : 'Suppression impossible pour le moment : vérifiez la connexion.';
    if (user && !famUnsub) startSync();
  }
  busy = false; render();
}

/* ---------- tableau de bord d'usage (réservé au créateur) ---------- */
async function loadAdmin() {
  if (!isAdmin()) return;
  adminErr = ''; adminData = null; render();
  try {
    const [fs, ks, av] = await Promise.all([getDocs(collection(fdb, 'familles')), getDocs(collectionGroup(fdb, 'enfants')), getDocs(collection(fdb, 'avis')).catch(() => null)]);
    const fams = [], kd = {};
    fs.forEach(d => fams.push({ id: d.id, ...d.data() }));
    ks.forEach(d => { const fid = d.ref.parent.parent.id; (kd[fid] = kd[fid] || {})[d.id] = d.data(); });
    const avis = []; if (av) av.forEach(d => avis.push(d.data())); avis.sort((a, b) => (b.d || '').localeCompare(a.d || ''));
    adminData = { at: Date.now(), fams, kd, avis };
    getDoc(doc(fdb, 'config', 'push')).then(c => { vapidReady = c.exists() && !!c.data().publicKey; render(); }).catch(() => {});
  } catch (e) { adminErr = 'Lecture impossible : publiez d’abord les nouvelles règles Firestore (accès du tableau de bord).'; }
  render();
}
function adminStats() {
  const now = Date.now(), D = 864e5, day = d => d ? new Date(d).getTime() : 0, P = (a, b) => b ? Math.round(100 * a / b) + ' %' : '–';
  const fams = adminData.fams.filter(x => x.id !== user.uid && Array.isArray(x.kids));
  const rows = fams.map(x => {
    const kd = adminData.kd[x.id] || {}, ev = Object.values(kd).flatMap(k => k.events || []), dates = ev.map(e => day(e.d)).filter(Boolean);
    const st = x.stats || {}, created = day(st.created || x.created) || Math.min(...dates, now);
    const last = Math.max(day(st.seen), ...dates, created);
    const kids = x.kids.map(k => {
      const e = (kd[k.id] || {}).events || [];
      const w = [...new Set(e.filter(z => z.t === 'paie').map(z => wk(z.d)))].sort((a, b) => a - b);
      let run = w.length ? 1 : 0, best = run; for (let i = 1; i < w.length; i++) { run = w[i] - w[i - 1] <= 8 * D ? run + 1 : 1; best = Math.max(best, run); }
      let tot = 0, peak = 0; for (const z of e) { if (z.t === 'paie' || (z.t === 'recu' && !z.pending && !z.refused)) tot += z.inv + z.bonus; else if (z.t === 'bourse') tot += z.gain; else if (z.t === 'projet') tot -= z.amount; peak = Math.max(peak, tot); }
      return { age: validBirth(k.birth) ? ageAt(k.birth, new Date()) : null, streak: best, rolls: e.filter(z => z.t === 'bourse').length, open: peak >= BOURSE_MIN, goal: !!(kd[k.id] || {}).goal, bought: e.some(z => z.t === 'projet'), guided: !!k.guided, lq: Object.keys(k.lq || {}).length, post: k.posture || 'none', tot };
    });
    const wks = new Set([...dates, last].map(d => wk(d)));
    return { wks, created, last, inst: !!st.inst, src: st.src || 'direct', days: st.days || 0, match: x.match, kids, noStats: !!x.noStats };
  });
  const K = rows.flatMap(r => r.kids), n = rows.length;
  const act7 = rows.filter(r => now - r.last < 7 * D).length, act30 = rows.filter(r => now - r.last < 30 * D).length;
  const old7 = rows.filter(r => now - r.created >= 7 * D), old28 = rows.filter(r => now - r.created >= 28 * D);
  const ret = (arr, d) => arr.filter(r => r.last - r.created >= d * D).length;
  const weeks = Array.from({ length: 8 }, (_, i) => { const x = new Date(wk(new Date())); x.setDate(x.getDate() - 7 * (7 - i)); const start = x.getTime(); return { label: dateFr(start), v: rows.filter(r => r.wks.has(start)).length }; });
  const srcs = Object.entries(rows.reduce((m, r) => (m[r.src] = (m[r.src] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]);
  const posts = Object.entries(K.filter(k => k.open).reduce((m, k) => (m[k.post] = (m[k.post] || 0) + 1, m), {}));
  return { n, act7, act30, new7: rows.filter(r => now - r.created < 7 * D).length, new30: rows.filter(r => now - r.created < 30 * D).length, inst: P(rows.filter(r => r.inst).length, n),
    ret1: P(ret(old7, 7), old7.length), ret4: P(ret(old28, 28), old28.length), old7: old7.length, old28: old28.length,
    kids: K.length, perFam: n ? (K.length / n).toFixed(1).replace('.', ',') : '–', ages: [[6, 8], [9, 11], [12, 17]].map(([a, b]) => [a + '–' + b + ' ans', K.filter(k => k.age >= a && k.age <= b).length]),
    habit: P(K.filter(k => k.streak >= 3).length, K.length), open: P(K.filter(k => k.open).length, K.length), rolled: P(K.filter(k => k.rolls > 0).length, K.filter(k => k.open).length),
    goal: P(K.filter(k => k.goal).length, K.length), bought: K.filter(k => k.bought).length, guided: P(K.filter(k => k.guided).length, K.length), lq: P(K.filter(k => k.lq > 0).length, K.length),
    avg: K.length ? f(K.reduce((a, k) => a + k.tot, 0) / K.length) : '–', match: n ? Math.round(rows.reduce((a, r) => a + (r.match || 0), 0) / n) + ' %' : '–', weeks, srcs, posts, optout: rows.filter(r => r.noStats).length };
}
// ---------- Analyse détaillée (tableau de bord et exports CSV du créateur) ----------
const wOf = z => { const t = new Date(z.w || z.d); return isNaN(t) ? new Date(z.d) : t; };
const pseudo = uid => { let h = 2166136261; for (const ch of uid) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return 'F' + h.toString(16).padStart(8, '0').slice(0, 6); };
const W7 = 7 * 864e5;
function adminDeep() {
  const now = Date.now(), cw = wk(new Date());
  const fams = adminData.fams.filter(x => x.id !== user.uid && Array.isArray(x.kids) && !x.noStats);
  return fams.map(x => {
    const kd = adminData.kd[x.id] || {}, st = x.stats || {}, evAll = Object.values(kd).flatMap(k => k.events || []);
    const firstEv = evAll.map(e => e.d).filter(Boolean).sort()[0];
    const created = new Date(st.created || x.created || firstEv || new Date()).getTime(), sw = wk(new Date(created));
    const weeks = Math.max(1, Math.round((cw - sw) / W7) + 1);
    // semaines actives : ouvertures mesurées + semaines où quelque chose s'est passé
    const wkMap = {}; for (const [k, r] of Object.entries(st.wk || {})) wkMap[wk(new Date(k + 'T12:00:00'))] = r;
    const evW = {}; for (const e of evAll) { if (!e.d) continue; const w = wk(new Date(e.d)); const o = evW[w] || (evW[w] = { paie: 0, de: 0, recu: 0 }); if (e.t === 'paie') o.paie++; else if (e.t === 'bourse') o.de++; else if (e.t === 'recu') o.recu++; }
    const act = new Set([...Object.keys(wkMap), ...Object.keys(evW)].map(Number));
    const sum = i => Object.values(st.wk || {}).reduce((a, r) => a + (r[i] || 0), 0);
    const dv = Object.values(st.dv || {});
    const kids = x.kids.map((k, i) => {
      const K = kd[k.id] || {}, e = K.events || [], paid = new Set(e.filter(z => z.t === 'paie').map(z => normWk(wk(wOf(z))))).size;
      const ks = wk(new Date(k.start || created)), kw = Math.max(1, Math.round((cw - ks) / W7) + 1);
      let tot = 0, peak = 0, bonus = 0, gains = 0, inv = 0, dep = 0, out = 0; const pw = [];
      for (const z of e) {
        if (z.t === 'paie' || (z.t === 'recu' && !z.pending && !z.refused)) { tot += z.inv + z.bonus; bonus += z.bonus || 0; if (z.t === 'paie') { inv += z.inv; dep += z.dep; pw.push(normWk(wk(wOf(z)))); } }
        else if (z.t === 'bourse') { tot += z.gain; gains += z.gain; } else if (z.t === 'projet') { tot -= z.amount; out += z.amount; }
        peak = Math.max(peak, tot);
      }
      const ws = [...new Set(pw)].sort((a, b) => a - b); let run = ws.length ? 1 : 0, best = run; for (let j = 1; j < ws.length; j++) { run = ws[j] - ws[j - 1] <= 8 * 864e5 ? run + 1 : 1; best = Math.max(best, run); }
      const fp = e.find(z => z.t === 'paie');
      return { n: i + 1, age: validBirth(k.birth) ? ageAt(k.birth, new Date()) : '', start: k.start || '', weekly: k.weekly, paid, kw, rate: Math.min(100, Math.round(100 * paid / kw)), best, first: fp ? Math.max(0, Math.round((new Date(fp.d) - new Date(k.start || created)) / 864e5)) : '',
        keep: inv + dep ? Math.round(100 * inv / (inv + dep)) : '', tot: r2(tot), peak: r2(peak), bonus: r2(bonus), gains: r2(gains), out: r2(out),
        recus: e.filter(z => z.t === 'recu').length, rolls: e.filter(z => z.t === 'bourse').length, post: k.posture || x.diceName || '', goal: K.goal ? 1 : 0, budget: K.goal ? K.goal.budget : '', projets: e.filter(z => z.t === 'projet').length,
        lq: Object.keys(k.lq || {}).length, peps: Array.isArray(k.ms) ? k.ms.length : '', guided: k.guided ? 1 : 0 };
    });
    return { id: pseudo(x.id), created, sw, weeks, act, wkMap, evW, last: st.seen || '', days: st.days || 0, opens: sum(0), kidOpens: sum(1), parentVisits: sum(2),
      devs: dv.length, os: [...new Set(dv.map(d => d.os))].join('+'), kidDev: dv.some(d => d.k) ? 1 : 0, inst: st.inst ? 1 : 0, push: x.push ? 1 : 0, nc: st.nc || {}, src: st.src || '',
      sv: x.survey || null, match: x.match, gmatch: x.giftMatch, kids };
  });
}
function adminDeepStats(R) {
  const P = (a, b) => b ? Math.round(100 * a / b) + ' %' : '–', med = a => { const v = a.filter(x => x !== '' && x != null).sort((p, q) => p - q); return v.length ? v[Math.floor(v.length / 2)] : '–'; };
  const coh = [1, 2, 4, 8, 12].map(i => { const el = R.filter(r => r.weeks > i); return [i, P(el.filter(r => r.act.has(normWk(r.sw + i * W7))).length, el.length), el.length]; });
  const K = R.flatMap(r => r.kids), sv = R.map(r => r.sv).filter(Boolean);
  const nps = sv.length ? Math.round(100 * (sv.filter(v => v.nps >= 9).length - sv.filter(v => v.nps <= 6).length) / sv.length) : '–';
  const dist = (arr, keys) => keys.map(([k, l]) => [l, arr.filter(v => v === k).length]);
  const nc = R.reduce((m, r) => { for (const [k, v] of Object.entries(r.nc)) m[k] = (m[k] || 0) + v; return m; }, {});
  const os = R.reduce((m, r) => { for (const o of (r.os || '').split('+').filter(Boolean)) m[o] = (m[o] || 0) + 1; return m; }, {});
  return { coh, actRatio: R.length ? Math.round(100 * R.reduce((a, r) => a + Math.min(1, r.act.size / r.weeks), 0) / R.length) + ' %' : '–',
    rate: K.length ? Math.round(K.reduce((a, k) => a + k.rate, 0) / K.length) + ' %' : '–', firstPay: med(K.map(k => k.first)), keep: K.filter(k => k.keep !== '').length ? Math.round(K.filter(k => k.keep !== '').reduce((a, k) => a + k.keep, 0) / K.filter(k => k.keep !== '').length) + ' %' : '–',
    kidDev: P(R.filter(r => r.kidDev).length, R.length), push: P(R.filter(r => r.push).length, R.length), nc, os, parentPerWeek: R.length ? (R.reduce((a, r) => a + r.parentVisits / Math.max(1, r.act.size), 0) / R.length).toFixed(1).replace('.', ',') : '–',
    peps: K.filter(k => k.peps !== '').length ? (K.filter(k => k.peps !== '').reduce((a, k) => a + k.peps, 0) / K.filter(k => k.peps !== '').length).toFixed(1).replace('.', ',') : '–',
    saved: f(K.reduce((a, k) => a + k.tot, 0)), bonus: f(K.reduce((a, k) => a + k.bonus, 0)), spent: f(K.reduce((a, k) => a + k.out, 0)),
    nSv: sv.length, nps, wtp: dist(sv.map(v => v.wtp), SV_WTP), svSrc: dist(sv.map(v => v.src), SV_SRC) };
}
function csvDownload(name, rows) {
  const cell = v => { const t = typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? ''); return /[;"\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  a.download = `pepite-${name}-${iso().slice(0, 10)}.csv`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function adminCsv(kind) {
  const R = adminDeep(), day = ms => ms ? ymdL(ms) : '';
  if (kind === 'enfants') {
    const head = ['famille', 'enfant', 'age', 'inscription_famille', 'semaines_depuis_inscription', 'semaines_actives', 'part_semaines_actives_pct', 'derniere_visite', 'jours_ouverture', 'ouvertures', 'ouvertures_appareil_enfant', 'visites_espace_parents', 'appareils', 'systemes', 'appareil_enfant', 'appli_installee', 'notifications', 'clics_notifications', 'source_lien', 'source_sondage', 'recommandation_0_10', 'prix_accepte', 'commentaire_sondage', 'bonus_paie_pct', 'bonus_cadeaux_pct',
      'debut_enfant', 'argent_de_poche_hebdo', 'semaines_enfant', 'paies_rangees', 'taux_paie_rangee_pct', 'meilleure_serie', 'jours_avant_premiere_paie', 'part_paie_mise_de_cote_pct', 'tirelire', 'plus_haut', 'bonus_recus', 'gains_bourse', 'depense_projets', 'argent_recu_declare', 'lancers_de', 'style_bourse', 'projet_en_cours', 'budget_projet', 'projets_realises', 'lecons_reussies', 'pepites', 'guide_termine'];
    const rows = [head];
    for (const r of R) for (const k of r.kids) rows.push([r.id, k.n, k.age, day(r.created), r.weeks, r.act.size, Math.round(100 * Math.min(1, r.act.size / r.weeks)), r.last, r.days, r.opens, r.kidOpens, r.parentVisits, r.devs, r.os, r.kidDev, r.inst, r.push, Object.entries(r.nc).map(([a, b]) => a + ':' + b).join(' '), r.src, r.sv ? r.sv.src : '', r.sv ? r.sv.nps : '', r.sv ? r.sv.wtp : '', r.sv ? r.sv.txt : '', r.match, r.gmatch,
      (k.start || '').slice(0, 10), k.weekly, k.kw, k.paid, k.rate, k.best, k.first, k.keep, k.tot, k.peak, k.bonus, k.gains, k.out, k.recus, k.rolls, k.post, k.goal, k.budget, k.projets, k.lq, k.peps, k.guided]);
    return csvDownload('enfants', rows);
  }
  if (kind === 'semaines') {
    const rows = [['famille', 'semaine_du', 'semaine_n', 'ouvertures', 'ouvertures_appareil_enfant', 'visites_espace_parents', 'paies_rangees', 'lancers_de', 'argent_recu_declare', 'active']];
    const cw = wk(new Date());
    for (const r of R) for (let w = r.sw, i = 0; w <= cw; w = normWk(w + W7), i++) { const o = r.wkMap[w] || [], e = r.evW[w] || {}; rows.push([r.id, day(w), i, o[0] || 0, o[1] || 0, o[2] || 0, e.paie || 0, e.de || 0, e.recu || 0, r.act.has(w) ? 1 : 0]); }
    return csvDownload('semaines', rows);
  }
  const rows = [['date', 'type', 'famille', 'humeur', 'recommandation_0_10', 'prix_accepte', 'source', 'texte', 'version', 'enfants']];
  for (const a of adminData.avis) rows.push([(a.d || '').slice(0, 10), 'avis', a.uid ? pseudo(a.uid) : '', a.mood || '', '', '', '', a.text || '', a.v || '', a.kids || '']);
  for (const x of adminData.fams) if (x.survey && x.id !== user.uid) rows.push([(x.survey.d || '').slice(0, 10), 'sondage', pseudo(x.id), '', x.survey.nps, x.survey.wtp, x.survey.src || '', x.survey.txt || '', x.survey.v || '', (x.kids || []).length]);
  csvDownload('avis', rows);
}
function adminDeepView() {
  const R = adminDeep(), d = adminDeepStats(R), line = (l, v) => `<li><span>${l}</span><b>${v}</b></li>`;
  const lab = { cadeau: 'Argent reçu à valider', palier: 'Palier', objectif: 'Projet atteint', serie: 'Série', bourse: 'Bourse ouverte', lundi: 'Récap du lundi', mercredi: 'Rappel du mercredi', test: 'Test' };
  return `<section class="card"><h3>Rétention par semaine</h3><p class="soft small" style="margin:0 0 6px">Part des familles revenues pendant la Ne semaine après leur inscription (parmi celles assez anciennes).</p><ul class="kv">${d.coh.map(([i, v, n]) => line(`Semaine ${i}`, `${v} <small class="soft">(${n})</small>`)).join('')}${line('Semaines actives sur semaines écoulées', d.actRatio)}</ul></section>
<section class="card"><h3>Habitude et usage</h3><ul class="kv">${line('Paies rangées sur semaines écoulées', d.rate)}${line('Délai médian avant la première paie', d.firstPay === '–' ? '–' : d.firstPay + ' j')}${line('Part de la paie mise de côté', d.keep)}${line('Familles où l’enfant a son propre appareil', d.kidDev)}${line('Visites de l’Espace parents par semaine active', d.parentPerWeek)}${line('Pépites par enfant', d.peps)}</ul></section>
<section class="card"><h3>Notifications</h3><ul class="kv">${line('Familles abonnées', d.push)}${Object.entries(d.nc).map(([k, v]) => line('Ouvertures · ' + esc(lab[k] || k), v)).join('') || line('Ouvertures depuis une notification', 0)}</ul></section>
<section class="card"><h3>Valeur</h3><ul class="kv">${line('Argent dans les tirelires', d.saved)}${line('Bonus versés par les parents', d.bonus)}${line('Dépensé pour des projets', d.spent)}${line('Score de recommandation (NPS)', d.nSv ? `${d.nps} <small class="soft">(${d.nSv} réponses)</small>` : '–')}${d.wtp.map(([l, v]) => line('Prix · ' + l, v)).join('')}${d.svSrc.map(([l, v]) => line('Connu par · ' + l, v)).join('')}</ul></section>
<section class="card"><h3>Appareils</h3><ul class="kv">${Object.entries(d.os).map(([k, v]) => line(esc(k), v)).join('') || line('Aucune donnée', '')}</ul></section>
<section class="card"><h3>Télécharger les données</h3><p class="soft small" style="margin:0">Fichiers pour Excel ou Google Sheets, sans nom ni e-mail : chaque famille a un code (F…). Les familles qui ont désactivé les statistiques sont exclues.</p>
<div class="row"><button class="btn sm" data-act="admcsv" data-n="enfants">Une ligne par enfant</button><button class="btn sm ghost" data-act="admcsv" data-n="semaines">Activité semaine par semaine</button><button class="btn sm ghost" data-act="admcsv" data-n="avis">Avis et sondages</button></div></section>`;
}
function adminView() {
  if (!isAdmin()) return '<p>Accès réservé.</p>';
  const head = `<button class="backlink" data-act="go" data-v="parents">${I.chev}<span>Espace parents</span></button><p class="kicker">Réservé au créateur</p><h2 class="title">Tableau de bord d’usage</h2>`;
  if (adminErr) return head + `<div class="msg">${esc(adminErr)}</div><div class="row"><button class="btn sm" data-act="adminreload">Réessayer</button></div>`;
  if (!adminData) return head + '<p class="soft">Chargement des familles…</p>';
  const s = adminStats(), max = Math.max(1, ...s.weeks.map(w => w.v));
  const kpi = (v, l, sub) => `<div class="kpi"><b>${v}</b><span>${l}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const line = (l, v) => `<li><span>${l}</span><b>${v}</b></li>`;
  return head + `<p class="lead">Toutes les familles, hors la tienne. Mis à jour le ${new Date(adminData.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}. <button class="link" data-act="adminreload">Actualiser</button></p>
<div class="kpis">${kpi(s.n, 'familles inscrites', `+${s.new7} en 7 j · +${s.new30} en 30 j`)}${kpi(s.act7, 'actives cette semaine', `${s.act30} sur 30 jours`)}${kpi(s.ret4, 'encore là après 4 semaines', `sur ${s.old28} familles assez anciennes`)}${kpi(s.inst, 'ont installé l’appli', '')}</div>
<section class="card"><h3>Familles actives par semaine</h3><div class="wbars">${s.weeks.map(w => `<div><i style="height:${Math.round(100 * w.v / max)}%"></i><b>${w.v}</b><small>${w.label}</small></div>`).join('')}</div></section>
${adminDeepView()}
<section class="card"><h3>Rétention</h3><ul class="kv">${line('Encore actives après 1 semaine', `${s.ret1} <small class="soft">(${s.old7} familles)</small>`)}${line('Encore actives après 4 semaines', `${s.ret4} <small class="soft">(${s.old28} familles)</small>`)}${line('Enfants qui ont rangé leur paie 3 semaines de suite', s.habit)}</ul></section>
<section class="card"><h3>Ce qui est utilisé</h3><ul class="kv">${line('Enfants inscrits', `${s.kids} <small class="soft">(${s.perFam} par famille)</small>`)}${s.ages.map(([l, v]) => line('· ' + l, v)).join('')}${line('Guide terminé', s.guided)}${line('Au moins un quiz réussi', s.lq)}${line('Un projet en cours', s.goal)}${line('Projets achetés', s.bought)}${line('Bourse ouverte (15 € atteints)', s.open)}${line('Dé lancé, parmi les bourses ouvertes', s.rolled)}${s.posts.map(([p, v]) => line('· ' + (POST[p] ? POST[p].name : p), v)).join('')}${line('Tirelire moyenne', s.avg)}${line('Bonus moyen des parents', s.match)}</ul></section>
<section class="card"><h3>D’où viennent les familles</h3><ul class="kv">${s.srcs.map(([k, v]) => line(esc(k), v)).join('') || '<li><span class="soft">Aucune donnée</span></li>'}</ul><p class="soft small" style="margin:8px 0 0">Ajoute <b>?src=nom</b> à tes liens (ex. ?src=whatsapp, ?src=instagram) pour savoir lesquels marchent.</p></section>
<section class="card"><h3>Avis des familles (${adminData.avis.length})</h3>${adminData.avis.length ? `<ul class="avislist">${adminData.avis.slice(0, 40).map(a => `<li><small class="soft">${dateFr(a.d)} · v${esc(a.v)} · ${a.kids} enfant(s)${a.mood ? ' · ' + esc((MOODS.find(m => m[0] === a.mood) || [, a.mood])[1]) : ''}</small><p>${esc(a.text || '(sans message)')}</p></li>`).join('')}</ul>` : '<p class="soft" style="margin:0">Aucun avis pour l’instant.</p>'}</section>
<section class="card"><h3>Notifications</h3><p class="small" style="margin:0">${vapidReady ? 'Les clés des notifications sont en place.' : 'Avant que les familles puissent activer les notifications, créez une fois les clés (elles restent dans votre compte).'}</p><div class="row"><button class="btn sm ${vapidReady ? 'ghost' : ''}" data-act="vapidgen">${vapidReady ? 'Recréer les clés' : 'Créer les clés des notifications'}</button></div></section>
<section class="card"><h3>Comment lire ces chiffres</h3><p class="small" style="margin:0">Repères indicatifs, à ajuster avec l’expérience. Le chiffre qui compte le plus est la rétention à 4 semaines : au-delà de 40 %, l’habitude est installée et tu peux tester une offre payante. Si l’installation reste sous 50 %, travaille l’écran d’installation avant tout. Si beaucoup de familles s’inscrivent mais peu d’enfants rangent leur paie trois semaines de suite, c’est la promesse ou l’accompagnement des parents qui coince, pas l’acquisition. Le score de recommandation (NPS) va de −100 à +100 : c’est la part de parents qui donnent 9 ou 10, moins celle qui donne 6 ou moins ; au-dessus de +30, le bouche-à-oreille travaille pour toi. La question du prix mesure une intention, pas un achat : en pratique, seule une partie de ceux qui disent oui paiera vraiment. Pour le détail famille par famille, télécharge le fichier « Une ligne par enfant ».</p>${s.optout ? `<p class="soft small" style="margin:8px 0 0">${s.optout} famille(s) ont désactivé les statistiques : leurs repères d’usage manquent.</p>` : ''}</section>`;
}


/* ---------- avis des familles (enregistrés dans la base, lus seulement par le créateur) ---------- */
const MOODS = [['top', 'J’adore'], ['ok', 'Pas mal'], ['bof', 'Bof']];
function avisView() {
  const back = `<button class="backlink" data-act="go" data-v="parents">${I.chev}<span>Espace parents</span></button>`;
  if (avisSent) return back + `<section class="card"><h2 class="title" style="margin:0 0 6px">Merci !</h2><p style="margin:0">Ton avis est bien arrivé. Chaque retour est lu, et c’est comme ça que Pépite s’améliore.</p><div class="row"><button class="btn sm" data-act="go" data-v="parents">Retour à l’Espace parents</button></div></section>`;
  return back + `<p class="kicker">Ton avis compte</p><h2 class="title">Donner mon avis</h2><p class="lead">Ce qui marche, ce qui coince, ce que ton enfant a compris ou pas, une idée… Tout est utile.</p>
<section class="card"><h3>Ton impression</h3><div class="pills">${MOODS.map(([v, l]) => `<button class="pill" data-act="amood" data-n="${v}" aria-pressed="${avisMood === v}">${l}</button>`).join('')}</div>
<label style="margin-top:12px">Ton message<textarea id="avis-txt" data-f="avis" rows="6" maxlength="2000" placeholder="Par exemple : ma fille a compris le bonus tout de suite, mais pas la bourse…">${esc(form.avis)}</textarea></label>
<p class="soft small" style="margin:6px 0 0">Ton message est lu par le créateur de Pépite, avec la version de l’appli et le nombre d’enfants. Évite d’y mettre des informations personnelles.</p>
<div class="row"><button class="btn full" data-act="avissend" ${busy || !ready ? 'disabled' : ''}>Envoyer</button></div></section>`;
}
async function sendAvis() {
  const txt = (form.avis || '').trim().slice(0, 2000);
  if (!txt && !avisMood) { say('Écris un petit mot ou choisis une impression.'); return render(); }
  busy = true; render();
  try {
    const id = user.uid.slice(0, 8) + '-' + Date.now();
    await setDoc(doc(fdb, 'avis', id), { uid: user.uid, d: iso(), mood: avisMood || null, text: txt, v: VERSION, kids: kids().length, inst: standalone() });
    form.avis = ''; avisMood = ''; avisSent = true;
  } catch (e) { say('Envoi impossible pour le moment : vérifie la connexion.'); }
  busy = false; render();
}


/* ---------- tuto vidéo : lecteur posé hors du rendu de l'appli, pour ne jamais être relancé ---------- */
function openVideo() {
  if (document.querySelector('.vmodal')) return;
  const m = document.createElement('div');
  m.className = 'vmodal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Tuto vidéo de Pépite');
  m.innerHTML = `<div class="vbox"><video src="video/tuto.mp4" poster="video/tuto.jpg" controls playsinline autoplay preload="auto"></video><button class="btn ghost full" data-vclose>Fermer la vidéo</button></div>`;
  const close = () => { const v = m.querySelector('video'); if (v) v.pause(); m.remove(); document.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-vclose]')) close(); });
  document.addEventListener('keydown', esc);
  document.body.append(m);
}


/* ---------- notifications (Web Push) : seuls les téléphones des parents s'abonnent ---------- */
let pushState = 'unknown', pushBusy = false; // unknown | unsupported | ios-install | denied | off | on
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
async function checkPush() {
  if (!pushSupported()) { pushState = isIOS && !standalone() ? 'ios-install' : 'unsupported'; return render(); }
  if (Notification.permission === 'denied') { pushState = 'denied'; return render(); }
  try { const r = await navigator.serviceWorker.ready, sub = await r.pushManager.getSubscription(); pushState = sub ? 'on' : 'off'; } catch (e) { pushState = 'unsupported'; }
  render();
}
const b64u = s => { const p = '='.repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
async function devId(endpoint) { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint)); return [...new Uint8Array(h)].slice(0, 12).map(x => x.toString(16).padStart(2, '0')).join(''); }
async function pushOn() {
  if (pushBusy || !ready) return;
  const permP = Notification.requestPermission(); pushBusy = true; render();
  try {
    const perm = await permP;
    if (perm !== 'granted') { pushState = perm === 'denied' ? 'denied' : 'off'; return; }
    const cfg = await getDoc(doc(fdb, 'config', 'push')), pub = cfg.exists() && cfg.data().publicKey;
    if (!pub) { say('Les notifications ne sont pas encore prêtes.', 'Réessayez un peu plus tard.'); return; }
    const r = await navigator.serviceWorker.ready;
    const sub = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(pub) });
    const j = sub.toJSON();
    await setDoc(doc(fdb, 'familles', user.uid, 'push', await devId(j.endpoint)), { endpoint: j.endpoint, keys: j.keys, d: iso(), ua: /Android/i.test(UA) ? 'Android' : isIOS ? 'iPhone' : 'Ordinateur' });
    if (!F.push) { F.push = true; saveF(); }
    syncDue(); pushState = 'on'; say('Notifications activées sur ce téléphone.');
  } catch (e) { say('Activation impossible pour le moment.', 'Vérifiez la connexion, puis réessayez.'); }
  finally { pushBusy = false; render(); }
}
async function pushOff() {
  if (pushBusy) return; pushBusy = true; render();
  try { const r = await navigator.serviceWorker.ready, sub = await r.pushManager.getSubscription(); if (sub) { await deleteDoc(doc(fdb, 'familles', user.uid, 'push', await devId(sub.endpoint))).catch(() => {}); await sub.unsubscribe(); } pushState = 'off'; say('Notifications désactivées sur ce téléphone.'); }
  catch (e) { say('Désactivation impossible pour le moment.'); }
  finally { pushBusy = false; render(); }
}
// File d'envoi : une ligne par événement, lue et vidée par la tâche planifiée (GitHub Actions).
function queuePush(type, data) {
  if (!ready || !F || !F.push || !user) return;
  const k = data.kid ? kidOf(data.kid) : null;
  setDoc(doc(fdb, 'push_queue', `${user.uid.slice(0, 10)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`), { uid: user.uid, type, d: iso(), ...data, ...(k ? { kidName: k.name } : {}) }).catch(() => {});
}
// Ce que les parents doivent encore, gardé dans la fiche famille pour le récap du lundi.
function syncDue() {
  if (!ready || !F || !F.push) return;
  const ymd = ms => { const x = new Date(ms); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const d = Object.fromEntries(kids().map(k => {
    const T = tot(k.id), pw = [...paidWeeks(k.id)], nx = nextSerie(k.id);
    // Pour le rappel du mercredi : dernière semaine rangée, série en cours, paies restantes avant la prochaine pépite de série.
    return [k.id, { name: k.name, give: T.purseDue, keep: r2(Math.max(0, T.due)), lw: pw.length ? ymd(Math.max(...pw)) : '', st: streakOf(k.id), left: nx ? nx.left : 0, pz: !!pauseOf(k.id) }];
  }));
  if (JSON.stringify(d) !== JSON.stringify(F.due || {})) { F.due = d; saveF(); }
}
// La bourse vient de s'ouvrir (15 € atteints) : prévenir les parents une seule fois.
function markBourse(notify) {
  if (!ready || !F) return; let ch = false;
  for (const k of kids()) if (bourseOpen(k.id) && !k.bopen) { k.bopen = iso(); ch = true; if (notify && k.id === cur) queuePush('bourse', { kid: k.id }); }
  if (ch) saveF();
}
function pushCard() {
  const what = '<p class="soft small" style="margin:0">Le lundi, un récap de ce que vous devez à vos enfants. Le mercredi, un rappel si une paie n’est pas encore rangée. Une alerte quand un enfant déclare de l’argent reçu. Et les grands moments : palier atteint, objectif, bourse ouverte, séries de semaines.</p>';
  let body;
  if (pushState === 'on') body = `<p style="margin:0 0 6px"><b>Activées sur ce téléphone.</b></p>${what}<div class="row"><button class="btn ghost sm" data-act="pushtest" ${ready ? '' : 'disabled'}>Envoyer un test</button><button class="btn ghost sm" data-act="pushoff" ${pushBusy ? 'disabled' : ''}>Désactiver</button></div>`;
  else if (pushState === 'off') body = `${what}<div class="row"><button class="btn sm" data-act="pushon" ${pushBusy || !ready ? 'disabled' : ''}>Activer sur ce téléphone</button></div>`;
  else if (pushState === 'denied') body = `${what}<p class="small" style="margin:8px 0 0">Les notifications sont bloquées pour Pépite sur ce téléphone. Autorisez-les dans les réglages du navigateur (cadenas à gauche de l’adresse, puis Notifications), puis revenez ici.</p>`;
  else if (pushState === 'ios-install') body = `${what}<p class="small" style="margin:8px 0 0">Sur iPhone, installez d’abord Pépite sur l’écran d’accueil (Partager, puis « Sur l’écran d’accueil ») et ouvrez-la depuis l’icône.</p>`;
  else if (pushState === 'unsupported') body = `${what}<p class="small" style="margin:8px 0 0">Ce navigateur ne permet pas les notifications. Sur Android, ouvrez Pépite dans Chrome.</p>`;
  else return '';
  return `<section class="card" id="notifs"><h3>Notifications</h3>${body}</section>`;
}


// Clés des notifications, créées dans le navigateur du créateur : la clé privée ne quitte jamais son compte
// (document lisible uniquement par lui et par la tâche planifiée, qui y accède avec la clé de service Firebase).
const b64e = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function genVapid() {
  if (!isAdmin()) return;
  try {
    const old = await getDoc(doc(fdb, 'config', 'push'));
    if (old.exists() && old.data().publicKey && !confirmVapid) { confirmVapid = true; say('Des clés existent déjà.', 'Touchez encore une fois pour les remplacer (les téléphones abonnés devront réactiver).'); return render(); }
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey), raw = await crypto.subtle.exportKey('raw', kp.publicKey);
    await setDoc(doc(fdb, 'config', 'pushPrivate'), { privateKey: jwk.d, publicKey: b64e(raw), d: iso() });
    await setDoc(doc(fdb, 'config', 'push'), { publicKey: b64e(raw), d: iso() });
    confirmVapid = false; vapidReady = true; say('Clés des notifications créées.');
  } catch (e) { say('Création impossible : publiez d’abord les nouvelles règles Firestore.'); }
  render();
}
let confirmVapid = false, vapidReady = null;


/* ---------- collection de pépites : chaque pépite récompense un réflexe d'épargnant ---------- */
function bestStreak(id) {
  const ws = [...paidWeeks(id)].sort((a, b) => a - b), isPaused = pausedWeeks(id); let best = 0, run = 0, prev = null;
  for (const w of ws) {
    if (prev === null) run = 1;
    else { let x = normWk(prev + 7 * 864e5), gap = false; for (let i = 0; x < w && i < 260; i++) { if (!isPaused(x)) { gap = true; break; } x = normWk(x + 7 * 864e5); } run = gap ? 1 : run + 1; }
    best = Math.max(best, run); prev = w;
  }
  return best;
}
// Les 100 pépites, rangées par familles. Chaque test lit le résumé `c` calculé par medals().
const M = (g, id, name, how, test, x = {}) => ({ g, id, name, how, test, ...x });
const capT = i => `Faire passer ta tirelire au-dessus de ${f(CAPS[i])}.`;
const sem = n => `Ranger ta paie ${n} semaines d’affilée.`;
// Fêtes et saisons : la paie de la semaine où tombe ce jour (elle compte même rangée en retard).
const easter = y => { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, g = Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3), h = (19 * a + b - d - g + 15) % 30, l = (32 + 2 * e + 2 * Math.floor(c / 4) - h - c % 4) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451); return new Date(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, (h + l - 7 * m + 114) % 31 + 1); };
const addD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const nthSun = (y, m, n) => { const d = new Date(y, m, 1); return addD(d, (7 - d.getDay()) % 7 + 7 * (n - 1)); };
const lastSun = (y, m) => { const d = new Date(y, m + 1, 0); return addD(d, -d.getDay()); };
const meresDay = y => { const d = lastSun(y, 4), p = addD(easter(y), 49); return d.getTime() === p.getTime() ? nthSun(y, 5, 1) : d; };
const blackFriday = y => { const d = new Date(y, 10, 1); return addD(d, (4 - d.getDay() + 7) % 7 + 22); };
const SEASONS = [
  ['nouvelan', 'Bonne année !', 'la semaine du Nouvel An', y => new Date(y, 0, 1)],
  ['galette', 'Galette des rois', 'la semaine de l’Épiphanie (6 janvier)', y => new Date(y, 0, 6)],
  ['chandeleur', 'Chandeleur', 'la semaine de la Chandeleur (2 février)', y => new Date(y, 1, 2)],
  ['neige', 'Vacances de neige', 'la semaine du 15 février', y => new Date(y, 1, 15)],
  ['mardigras', 'Mardi gras', 'la semaine de Mardi gras', y => addD(easter(y), -47)],
  ['grandmeres', 'Fête des grands-mères', 'la semaine de la fête des grands-mères', y => nthSun(y, 2, 1)],
  ['printemps', 'Premier jour du printemps', 'la semaine du 20 mars', y => new Date(y, 2, 20)],
  ['poisson', 'Poisson d’avril', 'la semaine du 1er avril', y => new Date(y, 3, 1)],
  ['paques', 'Joyeuses Pâques', 'la semaine de Pâques', y => easter(y)],
  ['muguet', 'Brin de muguet', 'la semaine du 1er mai', y => new Date(y, 4, 1)],
  ['meres', 'Fête des mères', 'la semaine de la fête des mères', meresDay],
  ['peres', 'Fête des pères', 'la semaine de la fête des pères', y => nthSun(y, 5, 3)],
  ['musique', 'Fête de la musique', 'la semaine du 21 juin', y => new Date(y, 5, 21)],
  ['quatorze', '14 Juillet', 'la semaine du 14 juillet', y => new Date(y, 6, 14)],
  ['aout', 'Plein été', 'la semaine du 15 août', y => new Date(y, 7, 15)],
  ['rentree', 'Rentrée des classes', 'la semaine de la rentrée (début septembre)', y => new Date(y, 8, 2)],
  ['automne', 'Premier jour de l’automne', 'la semaine du 23 septembre', y => new Date(y, 8, 23)],
  ['halloween', 'Halloween', 'la semaine d’Halloween (31 octobre)', y => new Date(y, 9, 31)],
  ['blackfriday', 'Résiste au Black Friday', 'la semaine du Black Friday', blackFriday, 1],
  ['avent', 'Calendrier de l’Avent', 'la semaine du 1er décembre', y => new Date(y, 11, 1)],
  ['noel', 'Joyeux Noël', 'la semaine de Noël', y => new Date(y, 11, 25)],
];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const COLLEC = ['collec', 'collec40', 'collec60', 'collec80', 'legende'];
const MEDAL_GROUPS = [['debut', 'Tes débuts'], ['regul', 'Régularité'], ['tirelire', 'Ta tirelire'], ['bourse', 'La bourse'], ['savoir', 'Savoir et projets'], ['saison', 'Fêtes et saisons'], ['mois', 'Mois complets'], ['collec', 'Collection']];
const MEDALS = [
  M('debut', 'paie1', 'Premier pas', 'Ranger ta toute première paie.', c => c.paid >= 1),
  M('debut', 'projet0', 'Un rêve en tête', 'Choisir le projet pour lequel tu mets de côté.', c => c.goal),
  M('debut', 'bonus1', 'Premier bonus', 'Mettre des pièces dans ta tirelire et recevoir le bonus de tes parents.', c => c.bonus > 0),
  M('debut', 'recu1', 'Cadeau bien rangé', 'Ranger dans ta tirelire de l’argent que tu as reçu.', c => c.recu >= 1),
  M('debut', 'lecon1', 'Curieux', 'Réussir le quiz d’une première leçon.', c => c.lq >= 1),
  M('debut', 'style', 'Mon style', 'Choisir ta façon de jouer à la bourse.', c => c.style),
  ...[[2, 's2', 'Bien parti'], [3, 's3', 'Régulier'], [5, 's5', 'Fidèle'], [10, 's10', 'Infatigable'], [15, 's15', 'Persévérant'], [26, 's26', 'Six mois sans faillir'], [39, 's39', 'Trois saisons'], [52, 's52', 'Une année entière'], [78, 's78', 'Un an et demi'], [104, 's104', 'Deux ans sans faillir']].map(([n, id, name]) => M('regul', id, name, sem(n), c => c.best >= n, { serie: n })),
  ...[[10, 'p10', 'Dix paies rangées'], [25, 'p25', 'Vingt-cinq paies'], [50, 'p50', 'Cinquante paies'], [75, 'p75', 'Soixante-quinze paies'], [100, 'p100', 'Cent paies !'], [150, 'p150', 'Cent cinquante paies'], [200, 'p200', 'Deux cents paies']].map(([n, id, name]) => M('regul', id, name, `Ranger ${n} paies en tout.`, c => c.paid >= n)),
  M('tirelire', 'tout', 'Tout dans la tirelire', 'Ranger toute une paie dans ta tirelire, sans rien garder pour dépenser.', c => c.tout),
  ...[[10, 'bonus10', 'Bonus fidèle'], [25, 'bonus25', 'Joli bonus'], [50, 'bonus50', 'Gros bonus'], [100, 'bonus100', 'Méga bonus']].map(([n, id, name]) => M('tirelire', id, name, `Recevoir ${f(n)} de bonus en tout.`, c => c.bonus >= n)),
  ...[[5, 'recu5', 'Cadeaux bien gardés'], [10, 'recu10', 'Dix cadeaux rangés'], [20, 'recu20', 'Vingt cadeaux rangés']].map(([n, id, name]) => M('tirelire', id, name, `Ranger ${n} fois de l’argent reçu.`, c => c.recu >= n)),
  ...[[0, 'cap', 'Premier palier'], [1, 'cap2', 'Deuxième palier'], [2, 'cap3', 'Trois chiffres'], [3, 'cap4', 'Deux cents euros'], [4, 'cap5', 'Cinq cents euros'], [5, 'cap6', 'Mille euros !'], [7, 'cap7', 'Deux mille euros'], [9, 'cap8', 'Cinq mille euros']].map(([i, id, name]) => M('tirelire', id, name, capT(i), c => c.peak >= CAPS[i])),
  M('bourse', 'bourse', 'La bourse s’ouvre', `Atteindre ${f(BOURSE_MIN)} dans ta tirelire.`, c => c.peak >= BOURSE_MIN),
  M('bourse', 'de1', 'Premier lancer', 'Lancer le dé de la bourse une première fois.', c => c.rolls >= 1),
  M('bourse', 'chance', 'Coup de chance', 'Faire gagner ta tirelire avec le dé.', c => c.won),
  M('bourse', 'six', 'Le six !', 'Faire sortir le 6 au dé de la bourse.', c => c.six),
  M('bourse', 'calme', 'Garder son calme', 'Continuer la bourse après une semaine où le dé t’a fait perdre.', c => c.calm),
  M('bourse', 'trois', 'Trois de suite', 'Faire gagner ta tirelire 3 semaines de suite avec le dé.', c => c.run >= 3),
  M('bourse', 'cinq', 'Cinq de suite', 'Faire gagner ta tirelire 5 semaines de suite avec le dé.', c => c.run >= 5),
  ...[[10, 'de10', 'Investisseur patient'], [25, 'de25', 'Marathonien'], [50, 'de50', 'Cinquante lancers'], [100, 'de100', 'Cent lancers']].map(([n, id, name]) => M('bourse', id, name, `Lancer le dé de la bourse ${n} semaines.`, c => c.rolls >= n)),
  ...[[1, 'gain1', 'Ton argent travaille'], [10, 'gain10', 'Argent qui bosse'], [25, 'gain25', 'Ça pousse'], [50, 'gain50', 'Petit chêne'], [100, 'gain100', 'Grand arbre']].map(([n, id, name]) => M('bourse', id, name, `Gagner ${f(n)} grâce à la bourse.`, c => c.gains >= n)),
  M('savoir', 'lecon3', 'Apprenti', 'Réussir le quiz de 3 leçons.', c => c.lq >= 3),
  M('savoir', 'savant', 'Petit savant', 'Réussir le quiz des 6 leçons.', c => c.lq >= 6),
  M('savoir', 'projet', 'Projet réalisé', 'Réunir tout l’argent de ton projet.', c => c.goalDone),
  ...[[2, 'proj2', 'Deux projets réalisés'], [3, 'proj3', 'Trois projets réalisés'], [5, 'proj5', 'Cinq projets réalisés']].map(([n, id, name]) => M('savoir', id, name, `Réaliser ${n} projets.`, c => c.proj >= n)),
  ...SEASONS.map(([id, name, when, , tout]) => M('saison', id, name, tout ? `Ranger toute ta paie dans ta tirelire ${when}, sans rien garder pour dépenser.` : `Ranger ta paie de ${when}.`, c => c.sea.has(id))),
  M('saison', 'unan', 'Un an avec Pépite', 'Ranger ta paie de la semaine où tu fêtes un an avec Pépite.', c => c.sea.has('unan')),
  ...MOIS.map((mo, i) => M('mois', 'm' + i, `${mo[0].toUpperCase() + mo.slice(1)} au complet`, `Ranger toutes tes paies du mois de ${mo}.`, c => c.months.has(i))),
  M('collec', 'collec', 'Collectionneur', 'Gagner 20 autres pépites.', c => c.n >= 20),
  M('collec', 'collec40', 'Grand collectionneur', 'Gagner 40 autres pépites.', c => c.n >= 40),
  M('collec', 'collec60', 'Chasseur de pépites', 'Gagner 60 autres pépites.', c => c.n >= 60),
  M('collec', 'collec80', 'Maître des pépites', 'Gagner 80 autres pépites.', c => c.n >= 80),
  M('collec', 'legende', 'Légende de Pépite', 'Gagner toutes les autres pépites.', c => c.n >= 95),
];

MEDALS.forEach(m => Object.assign(m, MATS[m.id]));
const matNug = (m, cls = 'mnug') => `<svg class="${cls}" viewBox="2 8 60 52" aria-hidden="true">${matSVG(m)}</svg>`;
const pepOf = m => `pépite\u00a0${m.mat.replace(' ', '\u00a0')}`;
function medals(id) {
  const k = kidOf(id); if (!k) return [];
  const E = evs(id), T = tot(id), g = goalOf(id), B = E.filter(e => e.t === 'bourse').sort((a, b) => (a.d < b.d ? -1 : 1));
  const c = { paid: paidWeeks(id).size, bonus: E.reduce((a, e) => a + ((e.t === 'paie' || (e.t === 'recu' && !e.pending && !e.refused)) ? e.bonus || 0 : 0), 0), best: bestStreak(id), peak: r2(T.peak), rolls: E.filter(e => e.t === 'bourse').length, goalDone: E.some(e => e.t === 'projet') || (g && T.total >= g.budget), lq: Object.keys(k.lq || {}).length, goal: !!g || E.some(e => e.t === 'projet'), recu: E.filter(e => e.t === 'recu' && !e.pending && !e.refused).length, won: B.some(e => e.gain > 0), calm: B.some((e, i) => e.gain < 0 && i < B.length - 1), gains: r2(T.gains || 0), style: E.some(e => e.t === 'posture' && e.p !== 'none'), six: B.some(e => e.face === 6), trois: B.some((e, i) => i >= 2 && e.gain > 0 && B[i - 1].gain > 0 && B[i - 2].gain > 0), tout: E.some(e => e.t === 'paie' && e.inv > 0 && !e.dep) };
  const PW = paidWeeks(id), sw = startWeek(id), cw = wk(new Date()), isP = pausedWeeks(id), sea = new Set(), months = new Set();
  const toutW = new Set(E.filter(e => e.t === 'paie' && e.inv > 0 && !e.dep).map(e => normWk(wk(e.w || e.d))));
  for (const w of PW) {
    const y0 = new Date(w).getFullYear();
    for (const y of [y0, y0 + 1]) for (const [sid, , , at, tout] of SEASONS) if (normWk(wk(at(y))) === w && (!tout || toutW.has(w))) sea.add(sid);
  }
  if (PW.has(normWk(sw + 364 * 864e5))) sea.add('unan');
  for (let y = new Date(sw).getFullYear(); y <= new Date().getFullYear(); y++) for (let m = 0; m < 12; m++) {
    const mons = []; for (let d = 1; d <= 31; d++) { const x = new Date(y, m, d); if (x.getMonth() !== m) break; if (x.getDay() === 1) mons.push(normWk(x.getTime())); }
    if (mons[0] >= sw && mons[mons.length - 1] <= cw && mons.every(w => PW.has(w) || isP(w)) && mons.some(w => PW.has(w))) months.add(m);
  }
  let run = 0, best = 0; for (const e of B) { run = e.gain > 0 ? run + 1 : 0; best = Math.max(best, run); }
  Object.assign(c, { sea, months, run: best, proj: E.filter(e => e.t === 'projet').length });
  // Une pépite gagnée reste gagnée, même si sa condition n'est plus vraie (projet supprimé, tirelire redescendue…).
  const kk = kidOf(id), got = new Set(kk && Array.isArray(kk.ms) ? kk.ms : []), has = m => got.has(m.id) || !!m.test(c);
  c.n = MEDALS.filter(m => !COLLEC.includes(m.id) && has(m)).length;
  return MEDALS.map(m => ({ ...m, ok: has(m) }));
}
const medalSet = id => new Set(medals(id).filter(m => m.ok).map(m => m.id));
// Après une action de l'enfant : annonce la pépite gagnée (et prévient les parents pour les séries).
function newMedal(id, before) {
  const got = medals(id).filter(m => m.ok && !before.has(m.id));
  const sm = got.filter(x => x.serie).pop();
  if (sm) queuePush('serie', { kid: id, n: sm.serie });
  return ''; // l'annonce se fait par l'animation (checkMedals)
}
// Pépites gagnées depuis la dernière fois : on les met en file pour l'animation, une par une.
let medalQ = [], medalSeq = 0;
const KID_VIEWS = ['home', 'paie', 'bourse', 'projet', 'futur', 'pepites', 'lecons', 'lecon', 'recu', 'carnet'];
function checkMedals(k) {
  if (!ready || !F || !k || guide !== null || tour !== null || !KID_VIEWS.includes(view) || lessonFrom === 'parents' || (jarAnim && Date.now() < jarAnim.until)) return;
  const ids = medals(k.id).filter(m => m.ok).map(m => m.id);
  if (!Array.isArray(k.ms)) { k.ms = ids; saveF(); return; } // première fois : pas d'avalanche pour les pépites déjà gagnées
  const nw = ids.filter(x => !k.ms.includes(x) && !medalQ.some(q => q.kid === k.id && q.id === x));
  if (!nw.length) return;
  medalQ.push(...nw.map(id => ({ kid: k.id, id })));
  k.ms = [...k.ms, ...nw]; k.pm = nw[nw.length - 1];
  saveF();
  try { navigator.vibrate && navigator.vibrate([40, 60, 40]); } catch (e) {}
  setTimeout(() => sfx('pep'), 250);
}
// Petits sons synthétisés (aucun fichier à télécharger). Coupables dans l'Espace parents, réglage propre à l'appareil.
let AC = null;
const sndOn = () => { try { return localStorage.getItem('pepite-sons') !== '0'; } catch (e) { return true; } };
function beep(freq, at, dur, type = 'sine', vol = 0.12, to = null) {
  const t = AC.currentTime + at, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
}
function sfx(name) {
  if (!sndOn()) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
    const seq = (notes, step, dur, type, vol) => notes.forEach((n, i) => beep(n, i * step, dur, type, vol));
    switch (name) {
      case 'coin': beep(1500, 0, 0.09, 'triangle', 0.1, 2100); beep(2400, 0.035, 0.08, 'sine', 0.05); break;
      case 'back': beep(900, 0, 0.07, 'triangle', 0.07, 600); break;
      case 'pay': seq([523, 659, 784, 1047], 0.085, 0.2, 'triangle', 0.1); break;
      case 'dice': for (let i = 0; i < 7; i++) beep(180 + Math.random() * 260, i * 0.16 + Math.random() * 0.05, 0.035, 'square', 0.035); break;
      case 'win': seq([784, 1175], 0.09, 0.22, 'triangle', 0.11); break;
      case 'lose': beep(392, 0, 0.28, 'sine', 0.1, 247); break;
      case 'flat': beep(660, 0, 0.12, 'sine', 0.07); break;
      case 'pep': seq([784, 988, 1175, 1568, 1976], 0.07, 0.25, 'sine', 0.09); beep(2637, 0.38, 0.4, 'sine', 0.04); break;
      case 'good': seq([660, 990], 0.08, 0.16, 'triangle', 0.1); break;
      case 'up': beep(330, 0, 0.7, 'sine', 0.07, 990); seq([784, 1047, 1319, 1568], 0.09, 0.3, 'triangle', 0.08); break;
      case 'bad': beep(280, 0, 0.22, 'triangle', 0.08, 210); break;
    }
  } catch (e) {}
}
function medalModal() {
  const q = medalQ[0], m = MEDALS.find(x => x.id === q.id), kk = kidOf(q.kid), n = medalQ.length;
  if (!m) { medalQ.shift(); return ''; }
  const cols = [m.c, '#ffd24a', '#ff6b8b', '#4d96ff', '#6bcb77', '#ffffff'];
  const conf = Array.from({ length: 22 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--c:${cols[i % cols.length]};--d:${(2.2 + (i % 5) * 0.35).toFixed(2)}s;--dl:${((i * 0.13) % 0.9).toFixed(2)}s;--r:${(i * 47) % 360}deg"></i>`).join('');
  return `<div class="mreveal" id="mr-${medalSeq}" role="dialog" aria-modal="true" aria-labelledby="mrt" style="--m:${m.c}"><div class="mrays" aria-hidden="true"></div><div class="mconf" aria-hidden="true">${conf}</div>
<div class="mbox"><p class="mkick">${kids().length > 1 && kk ? `Bravo ${esc(kk.name)} !` : 'Bravo !'} Nouvelle pépite</p>${matNug(m, 'mbig')}<h2 id="mrt">${m.name}</h2><p class="mmat">Pépite ${m.mat}</p><p class="mhow">${m.how}</p>
<button class="btn full" data-act="mednext">${n > 1 ? `Pépite suivante (${n - 1})` : 'Super !'}</button></div></div>`;
}
function nextSerie(id) { const st = streakOf(id), m = MEDALS.find(x => x.serie && x.serie > st && x.serie > bestStreak(id)); return m ? { m, left: m.serie - st } : null; }
function pepitesView() {
  const L = medals(cur), n = L.filter(m => m.ok).length, st = streakOf(cur), nx = nextSerie(cur);
  const card = m => `<div class="medal ${m.ok ? 'on' : ''}" style="--m:${m.c}">${m.ok ? matNug(m) : `<svg class="mnug" viewBox="2 8 60 52" aria-hidden="true">${mystSVG()}</svg>`}${m.ok ? `<b>${m.name}</b>` : ''}<em>${m.ok ? `Pépite ${m.mat}` : 'Pépite mystère'}</em><small>${m.how}</small></div>`;
  return `<button class="backlink" data-act="go" data-v="home">${I.chev}<span>Ma tirelire</span></button><h2 class="title">Mes pépites</h2>
<p class="lead">Chaque pépite récompense un réflexe de bon épargnant. Tu en as ${n} sur ${L.length}.</p>
${st >= 1 ? `<section class="card serie"><b>${st} semaine${st > 1 ? 's' : ''} d’affilée</b><span>${nx ? `Encore ${nx.left} paie${nx.left > 1 ? 's' : ''} rangée${nx.left > 1 ? 's' : ''} pour gagner une nouvelle pépite.` : 'Tu as toutes les pépites de régularité. Respect !'}</span></section>` : ''}
${MEDAL_GROUPS.map(([g, t]) => { const G = L.filter(m => m.g === g); return `<h3 class="sec mgroup">${t}<span>${G.filter(m => m.ok).length}/${G.length}</span></h3><div class="medals">${G.map(card).join('')}</div>`; }).join('')}`;
}


// Demande des notifications : une fenêtre avec un seul bouton, sur les téléphones des parents (jamais sur un appareil d'enfant verrouillé).
function pushAskShow() {
  if (!ready || !F || lock || pushState !== 'off' || guide !== null || tour !== null || view !== 'home') return false;
  let a = null; try { a = JSON.parse(localStorage.getItem('pepite-pushask') || 'null'); } catch (e) {}
  if (!a) return true;
  return a.later && a.n < 3 && Date.now() - a.t > 10 * 864e5;
}
function pushAsked(later) { let a = null; try { a = JSON.parse(localStorage.getItem('pepite-pushask') || 'null'); } catch (e) {} const v = { t: Date.now(), n: ((a && a.n) || 0) + 1, later }; try { localStorage.setItem('pepite-pushask', JSON.stringify(v)); } catch (e) {} }
function pushAskModal() {
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="pt"><div class="sheet pushask">${NUG('pask', '')}<h2 id="pt">On vous prévient ?</h2>
<p>Le lundi, un petit récap de la paie et de ce que vous devez. Le mercredi, un rappel si la paie n’est pas rangée, avec la série et la pépite en jeu. Et une alerte quand l’un d’eux déclare de l’argent reçu.</p>
<div class="row"><button class="btn full" data-act="pushask">Oui, me prévenir</button></div><div class="row" style="margin-top:6px"><button class="btn ghost full" data-act="pushlater">Plus tard</button></div></div></div>`;
}

const H = () => ({ jar, miniDie, growNug, f, eurS, r50, I, coinEl });
function artList() { return articles(H()); }
const tourLen = () => features(H()).length + 2;
function tourSeen() { tour = null; try { localStorage.setItem('pepite-tour', '1'); } catch (e) {} }
function tourModal() {
  const fs = features(H()), n = fs.length + 2, i = Math.max(0, Math.min(n - 1, tour)), last = i === n - 1;
  const s = i === 0 ? { title: 'Bienvenue dans Pépite\u00a0!', short: 'L’appli qui apprend à vos enfants à épargner et à investir, avec leur vrai argent de poche. Le tour complet en une minute.', visual: `<div class="tintro">${LOGOBIG}<div class="wmfull">${WMFULL}</div></div>` }
    : last ? { title: 'C’est parti\u00a0?', short: 'Créez le compte de la famille en deux minutes. Et pour aller plus loin, la méthode complète vous attend dans «\u00a0Toi, parent\u00a0».', visual: `<div class="nugrow big">${growNug(100)}</div>` }
    : fs[i - 1];
  return `<div class="modal tourm" role="dialog" aria-modal="true" aria-labelledby="tt"><div class="sheet tour">
<div class="ttop"><span class="tcount">${last ? 'Prêt\u00a0?' : i ? `${i} / ${n - 2}` : 'Le tour en 1 minute'}</span><button class="link" data-act="tskip">${last ? 'Fermer' : 'Passer'}</button></div>
<div class="tvis"><div class="demoin" inert aria-hidden="true">${s.visual}</div></div>
<h3 id="tt">${s.title}</h3><p>${s.short}</p>
<div class="tdots" aria-hidden="true">${Array.from({ length: n }, (_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
${last ? `<div class="list"><button class="btn full" data-act="tend">Créer le compte de ma famille</button></div>`
  : `<div class="row"><button class="btn ghost" data-act="tprev" ${i ? '' : 'disabled'}>Retour</button><button class="btn" data-act="tnext">${i ? 'Suivant' : 'C’est parti'}</button></div>`}
</div></div>`;
}

function aproposView() {
  const back = user ? 'parents' : 'home';
  return `<button class="backlink" data-act="go" data-v="${back}">${I.chev}<span>${user ? 'Espace parents' : 'Retour'}</span></button>
<article class="art about"><div class="aboutid"><img src="img/matthieu.jpg" alt="Portrait de Matthieu, créateur de Pépite" width="96" height="96"><div><p class="kicker" style="margin:0">À propos</p><h2>Qui a créé Pépite\u00a0?</h2><p class="soft" style="margin:2px 0 0">Matthieu, papa de trois enfants</p></div></div>
<p>J’ai découvert l’investissement à 35\u00a0ans. Avant, rien\u00a0: pas un euro placé pendant 25\u00a0ans, faute de savoir comment faire. Personne ne me l’avait appris, et j’aurais rêvé que mes parents le fassent.</p>
<p>Alors j’ai appris à la dure. Je me suis formé au métier de conseiller en investissements financiers (CIF), puis j’ai suivi avec ORICA les formations IOBSP niveau\u00a01 et IAS niveau\u00a03, pour comprendre ces arcanes de l’intérieur.</p>
<div class="chips"><span>Formé au métier de CIF</span><span>IOBSP niveau 1</span><span>IAS niveau 3 · ORICA</span></div>
<p>À la maison, je mettais chaque mois de l’argent de côté pour mes deux grandes, 7 et 9\u00a0ans, avec un bonus de ma part dans leur tirelire. Mais c’était compliqué à tenir, et il manquait l’essentiel\u00a0: les intérêts composés, ceux-là mêmes qui m’ont tant manqué en démarrant à 35\u00a0ans.</p>
<blockquote>Pépite, c’est l’outil que j’aurais aimé avoir\u00a0: pour leur donner 25\u00a0ans d’avance.</blockquote>
<p class="note">Pépite est un outil pédagogique. Il ne constitue pas un conseil en investissement.</p></article>
${user ? '' : `<div class="row"><button class="btn full" data-act="signup">Créer le compte de ma famille</button></div>`}`;
}
function lireView() {
  const back = user ? 'parents' : 'home';
  return `<button class="backlink" data-act="go" data-v="${back}">${I.chev}<span>${user ? 'Espace parents' : 'Retour'}</span></button>
<p class="kicker">Toi, parent</p><h2 class="title">La méthode Pépite, expliquée aux parents</h2><p class="lead">Pourquoi commencer si tôt, comment l’argent fait des petits, ce que votre enfant apprend vraiment, combien donner, et tout ce que fait l’appli. Cinq lectures courtes pour tout comprendre et bien accompagner votre enfant.</p>
<div class="list">${artList().map(x => `<button class="item art-item" data-act="art" data-n="${x.id}"><span class="ic artn">${x.n}</span><span><small>${x.theme} · ${x.min} min</small><b>${x.title}</b></span><span class="end">${I.chev}</span></button>`).join('')}</div>`;
}
function artView() {
  const L = artList(), i = Math.max(0, L.findIndex(x => x.id === artId)), x = L[i], next = L[i + 1];
  const body = typeof x.body === 'function' ? x.body() : x.body;
  const inOb = user && !F;
  return `<button class="backlink" data-act="go" data-v="${inOb ? 'home' : 'lire'}">${I.chev}<span>${inOb ? 'Revenir à l’inscription' : 'La méthode'}</span></button>
<article class="art"><p class="kicker">Article ${x.n} sur ${L.length} · ${x.theme} · ${x.min} min</p><h2>${x.title}</h2><p class="alead">${x.lead}</p>${body}
${x.sources.length ? `<details class="src"><summary>Sources (${x.sources.length})</summary><ol>${x.sources.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('')}</ol></details>` : ''}</article>
${!user ? `<div class="row"><button class="btn full" data-act="signup">Créer le compte de ma famille</button></div>` : ''}${next ? `<button class="item art-item nextart" data-act="art" data-n="${next.id}"><span class="ic artn">${next.n}</span><span><small>Article suivant</small><b>${next.title}</b></span><span class="end">${I.chev}</span></button>` : (user ? `<div class="row"><button class="btn full" data-act="go" data-v="${inOb ? 'home' : 'parents'}">${inOb ? 'Revenir à l’inscription' : 'Retour à l’espace parents'}</button></div>` : '')}`;
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


/* ---------- Première paie guidée (onboarding de l'enfant) ---------- */
// La bourse s'ouvre quand la tirelire atteint 15 € et reste ouverte ensuite, même si elle redescend (perte au dé, achat d'un projet).
const bourseOpen = id => r2(tot(id).peak) >= BOURSE_MIN;
function bonusTxt() { const m = F.match, n = 100 / m; return Number.isInteger(n) && n > 1 ? `pour ${n} pièces placées dans ta tirelire, ${P().aj} 1 pièce` : `${P().aj} ${m} % de ce que tu places dans ta tirelire`; }
function planOf() { const t = tot(cur); return { pay: owed(cur).length > 0 && !pauseOf(cur), paused: !!pauseOf(cur), open: bourseOpen(cur), rolled: sameWeek(t.bourse && t.bourse.d), goal: !!goalOf(cur) }; }
function guideSteps(k) {
  const t = tot(cur), ow = owed(cur), noPay = !ow.length || !!pauseOf(cur), rolled = sameWeek(t.bourse && t.bourse.d);
  if (guideKind === 'bourse') return [
    { text: 'La bourse est ouverte ! Chaque semaine, tu lances un dé : il fait gagner ou perdre un petit bout de ta tirelire.', parent: 'lancez ce premier dé ensemble et parlez des faces rouges : perdre un peu fait partie du jeu.', target: '.post.on', next: 'Suivant' },
    { text: 'Les faces vertes te font gagner, les rouges te font perdre. Compte-les et choisis ta stratégie.', target: '.post.on', next: 'J’ai choisi' },
    { text: 'Maintenant, lance le dé !', target: '.dicebox', done: () => sameWeek(tot(cur).bourse && tot(cur).bourse.d), skip: () => postOf(cur) === 'none', next: 'Plus tard' },
    { text: 'Bravo ! Tu relanceras le dé chaque semaine. Plus ta tirelire grossit, plus il compte.', target: '.dicebox', next: 'Terminer', end: true }
  ];
  // Le parcours est figé au lancement (guidePlan) : il ne change pas de forme si la paie est rangée en cours de route.
  const pl = guidePlan || { pay: !noPay, paused: !!pauseOf(cur), open: bourseOpen(cur), rolled, goal: !!goalOf(cur) };
  const S = [{ text: `Salut ${esc(k.name)} ! Moi, c’est Pépite. Voici ta tirelire : elle va se remplir, semaine après semaine.`, parent: 'faites ce tour avec votre enfant, il dure deux minutes.', target: '.hero > svg', next: 'C’est parti !' }];
  if (pl.pay) S.push(
    { text: 'Ta paie t’attend : appuie sur « Paie ».', target: '.tab[data-v=paie]', done: () => view === 'paie' },
    { text: 'Lis l’explication en haut. Puis range chaque pièce avec ces deux boutons.', target: '.moves', done: () => view === 'paie' && tray.length === 0 },
    { text: invC.length ? `Regarde la pastille dorée : +${f(r2(sumC(invC) * F.match / 100))} ! C’est le bonus : ${bonusTxt()}. L’argent du porte-monnaie, lui, n’a pas de bonus.` : `Ici, pas de bonus : tout est dans ton porte-monnaie. Si tu mets des pièces dans ta tirelire, ${bonusTxt()}. Tu peux reprendre une pièce pour essayer !`,
      parent: 'c’est le moment de lui expliquer votre bonus, avec de vraies pièces si vous en avez sous la main.', target: invC.length ? '.zone.gz .chip' : '.zone.gz', skip: () => guidePaid, next: 'Compris !' },
    { text: 'Bien rangé ! Appuie sur « Valider ma paie ».', target: '[data-act=pay]', done: () => guidePaid });
  else S.push(
    { text: pl.paused ? 'Ta paie est en pause pour l’instant. Quand elle reviendra, tu la rangeras ici, dans « Paie ».' : 'Ta paie de la semaine est déjà rangée. Chaque semaine, elle t’attendra ici, dans « Paie ».', target: '.tab[data-v=paie]', next: 'Suivant' },
    { text: `Et ça, c’est le bonus : ${bonusTxt()}. L’argent du porte-monnaie, lui, n’a pas de bonus.`, parent: 'c’est le moment de lui rappeler votre bonus, avec de vraies pièces si vous en avez sous la main.', target: view === 'paie' ? '.paybonus' : '.tiles .tile:nth-child(2)', next: 'Compris !' });
  if (pl.open) S.push(
    { text: 'Ta tirelire a atteint 15 € : la bourse est ouverte ! Appuie sur « Bourse ».', target: '.tab[data-v=bourse]', done: () => view === 'bourse' },
    { text: 'Chaque semaine, tu lances un dé : il fait gagner ou perdre un petit bout de ta tirelire. Les faces vertes font gagner, les rouges font perdre. Ici, tu choisis ta stratégie.', target: '.post.on', next: 'Suivant' },
    pl.rolled || postOf(cur) === 'none'
      ? { text: pl.rolled ? 'Tu as déjà lancé le dé cette semaine : tu le relanceras la semaine prochaine.' : 'Tu ne joues pas à la bourse en ce moment. Tu peux changer de stratégie quand tu veux.', target: '.dicebox', next: 'Suivant' }
      : { text: 'Maintenant, lance le dé de la semaine !', target: '.dicebox', done: () => sameWeek(tot(cur).bourse && tot(cur).bourse.d), next: 'Plus tard' });
  else S.push({ text: `Quand ta tirelire aura ${BOURSE_MIN} €, la bourse s’ouvrira : je t’expliquerai le dé.`, target: '.tab[data-v=bourse]', next: 'Suivant' });
  S.push({ text: pl.goal ? 'Et maintenant, ton projet : appuie sur « Projet ».' : 'Et maintenant, ton rêve : appuie sur « Projet ».', target: '.tab[data-v=projet]', done: () => view === 'projet' });
  S.push(pl.goal
    ? { text: 'Voici ton projet. À chaque palier, ta pépite grandit. Et « Comment on calcule ? » te dit quand tu l’auras.', target: 'section.goal', next: 'Suivant' }
    : { text: 'Choisis ton projet et son prix, puis valide. Pas d’idée ? Ce n’est pas obligatoire : ta tirelire grossit quand même. Tu peux même commencer à mettre de côté pour ton permis de conduire !', target: 'section.card:has(#go-name)', done: () => !!goalOf(cur), next: 'Plus tard' });
  S.push({ text: `Bravo ${esc(k.name)}, tu sais tout ! Reviens chaque semaine ranger ta paie${pl.open ? ' et lancer le dé' : ''}. C’est comme ça qu’une tirelire devient une pépite.`, next: 'Terminer', end: true });
  return S;
}
function guideSync(k) {
  const S = guideSteps(k);
  while (guide !== null && guide < S.length - 1 && guide !== guideHold) { const s = S[guide]; if ((s.skip && s.skip()) || (s.done && s.done())) guide++; else break; }
  return S;
}
function guideEnd(k) { const field = guideKind === 'bourse' ? 'bguided' : 'guided'; if (k && guideKind === 'pay' && guidePlan && guidePlan.open && !k.bguided) k.bguided = true; guidePlan = null; guide = null; guidePaid = false; guideShown = -1; guideHold = null; guideViews = []; try { speechSynthesis.cancel(); } catch (e) {} if (k && !k[field]) { k[field] = true; if (ready) saveF(); } }
function guideView(k) {
  const S = guideSync(k), s = S[guide], n = S.length, held = guide === guideHold && !s.next;
  guideViews[guide] = view;
  return `<div class="guide low" role="dialog" aria-label="Guide de Pépite" aria-live="polite"><div class="gmascot">${NUG('', '')}</div><div class="gbody">
<p>${s.text}</p>${s.parent ? `<p class="gpar"><b>Parent :</b> ${s.parent}</p>` : ''}
<div class="gact"><button class="link gspeak" data-act="gspeak">${I.speak}Écoute</button><button class="link" data-act="gskip" aria-label="Passer le guide">${s.end ? '' : 'Passer le guide'}</button><span class="gnav">${guide > 0 ? `<button class="gprev" data-act="gprev" aria-label="Étape précédente">${I.chev}</button>` : ''}${s.next || held ? `<button class="btn sm" data-act="${s.end ? 'gend' : 'gnext'}">${held ? 'Suivant' : s.next}</button>` : ''}</span></div>
<div class="tdots" aria-hidden="true">${S.map((_, j) => `<i class="${j === guide ? 'on' : ''}"></i>`).join('')}</div></div></div>`;
}
function guideMark() {
  document.querySelectorAll('.gtarget').forEach(e => e.classList.remove('gtarget'));
  if (guide === null || !F) return;
  const k = kidOf(cur); if (!k) return;
  const s = guideSteps(k)[guide]; const el = s && document.querySelector(s.target);
  if (el) { el.classList.add('gtarget'); if (guideShown !== guide) { guideShown = guide; if (!el.closest('.tabbar')) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }
}
function guideSpeak() {
  const k = kidOf(cur); if (!k || guide === null) return;
  const txt = guideSteps(k)[guide].text.replace(/<[^>]+>/g, '').replace(/&#39;|’/g, '\'');
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = 'fr-FR'; u.rate = 0.95; const v = speechSynthesis.getVoices().find(x => /^fr/i.test(x.lang)); if (v) u.voice = v; speechSynthesis.speak(u); } catch (e) {}
}
function mainView() {
  ensureCur();
  const k = kidOf(cur);
  if (!k) return splash('Aucun enfant');
  if (guide === null && ready && !guideOff[cur]) {
    if (!k.guided && !evs(cur).length && !goalOf(cur) && view === 'home') { guideKind = 'pay'; guidePlan = planOf(); guide = 0; guideHold = null; guideViews = []; }
    else if (!k.bguided && view === 'bourse' && bourseOpen(cur) && !evs(cur).some(e => e.t === 'bourse')) { guideKind = 'bourse'; guide = 0; guideHold = null; guideViews = []; }
  }
  const t = tot(cur);
  const content = view === 'paie' ? payView(k, t) : view === 'recu' ? giftView(k) : view === 'bourse' ? bourseView(k, t) : view === 'futur' ? futurView(k, t) : view === 'carnet' ? carnetView(k) : view === 'projet' ? projetView(k, t) : view === 'parents' ? parentsView() : view === 'lire' ? lireView() : view === 'art' ? artView() : view === 'apropos' ? aproposView() : view === 'lecons' ? leconsView() : view === 'lecon' ? leconView() : view === 'confidentialite' ? privacyView() : view === 'pepites' ? pepitesView() : view === 'avis' ? (lock && !pinOk ? lockedView() : avisView()) : view === 'admin' ? (lock && !pinOk ? lockedView() : adminView()) : homeView(k, t);
  checkMedals(k); // après le rendu de l'écran : laisse passer l'animation du bocal avant celle des pépites
  return `${topbar()}${status ? `<div style="padding:0 16px"><div class="status">${esc(status)}</div></div>` : ''}<main class="view${guide !== null ? ' guided' : ''}">${content}</main>${guide !== null && (guideKind === 'bourse' ? view === 'bourse' : ['home', 'paie', 'bourse', 'projet'].includes(view)) ? guideView(k) : ''}${tabbar()}${resetFor ? resetModal() : ''}${!resetFor && !medalQ.length && pushAskShow() ? pushAskModal() : ''}${!resetFor && medalQ.length ? medalModal() : ''}${toast ? `<div class="toast" role="status">${toast.msg}${toast.sub ? `<small>${toast.sub}</small>` : ''}</div>` : ''}`;
}

let lastKey = '';
function render() {
  if (rolling) return;
  let html, color = '#2f5fe0', key;
  if (showGate()) { html = gateView(); key = 'gate:' + !!installEv + installed + relatedApp; }
  else if (user === undefined) { html = splash(); key = 'splash'; }
  else if (!user) { if (!tourAuto && view === 'home') { tourAuto = true; let seen = null; try { seen = localStorage.getItem('pepite-tour'); } catch (e) {} if (!seen) tour = 0; } const pub = view === 'lire' || view === 'art' || view === 'apropos' || view === 'confidentialite'; html = pub ? `<main class="view full">${view === 'lire' ? lireView() : view === 'apropos' ? aproposView() : view === 'confidentialite' ? privacyView() : artView()}</main>` : loginView() + (tour !== null ? tourModal() : ''); key = 'login:' + (pub ? view + ':' + artId : '') + (!pub && tour !== null ? ':tour' + tour : ''); }
  else if (!famLoaded) { html = splash('Ouverture de la banque…'); key = 'splash2'; }
  else if (!F) { if (!ob) { ob = newOb(); tryLegacy(); } if (view === 'art') { key = 'obart:' + artId; html = `<main class="view full">${artView()}</main>`; } else { key = 'ob' + ob.step; html = obView(); } color = ob.step === 2 && ob.kids[0] ? ob.kids[0].color : PAL[1]; }
  else { html = mainView(); key = 'main:' + view + ':' + (view === 'art' ? artId : view === 'lecon' ? lessonId : '') + ':' + cur + ':' + (lock && !pinOk ? (pinAsk ? 'pin' : 'lk') : '') + (resetFor ? ':modal' : ''); const k = kidOf(cur); if (k) color = k.color; if (view === 'admin') key += ':' + (adminData ? adminData.at : '') + adminErr; }
  document.documentElement.style.setProperty('--kid', color); document.documentElement.style.setProperty('--kidon', onColor(color)); document.documentElement.style.setProperty('--own', ownColor(color));
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', color);
  const app = document.getElementById('app');
  // Changement d'écran : on remplace tout ; sinon on ne met à jour que ce qui change (clics et saisies préservés).
  if (key !== lastKey) { app.innerHTML = html; lastKey = key; }
  else Idiomorph.morph(app, html, { morphStyle: 'innerHTML', ignoreActiveValue: true });
  guideMark();
}

/* ---------- données ---------- */
const chains = {};
function queue(key, fn) { chains[key] = (chains[key] || Promise.resolve()).then(fn).catch(() => { status = 'Enregistrement impossible : vérifie ta connexion.'; render(); }); return chains[key]; }
function saveF() { const body = clone(F); lastF = JSON.stringify(body); return queue('F', () => setDoc(doc(fdb, 'familles', user.uid), body)); }
function saveK(id) { setTimeout(syncDue, 0); const body = { events: clone(evs(id)), goal: goalOf(id) ? clone(goalOf(id)) : null, pause: PAUSE[id] ? clone(PAUSE[id]) : null }; lastK[id] = JSON.stringify(body); return queue(id, () => setDoc(doc(fdb, 'familles', user.uid, 'enfants', id), body)); }
// Hausse automatique de la paie aux anniversaires (si la famille l'a activée).
function applyRaises() {
  let ch = false; const now = new Date(), msgs = [];
  for (const k of kids()) {
    if (!validBirth(k.birth)) continue;
    const age = ageAt(k.birth, now);
    if (typeof k.raisedAge !== 'number') { k.raisedAge = age; ch = true; continue; }
    if (age > k.raisedAge) { if (F.raise) { k.weekly = Math.min(50, Math.round((k.weekly + 0.5 * (age - k.raisedAge)) * 2) / 2); msgs.push(`${k.name} a ${age} ans : sa paie passe à ${f(k.weekly)} par semaine.`); } k.raisedAge = age; ch = true; }
  }
  if (ch) saveF(); if (msgs.length) say(msgs.join(' '));
}
function updateReady() {
  const r = !!(F && famServer && kids().every(k => KL[k.id]));
  if (r !== ready) { ready = r; if (r) { status = ''; clearTimeout(offlineTimer); applyRaises(); touchStats(); touchSession(); markBourse(); resetCoins(); checkPush(); } return true; }
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
  if (!ready || rolling || postOf(cur) === 'none' || !bourseOpen(cur) || sameWeek(t0.bourse && t0.bourse.d)) return;
  rolling = true; sfx('dice');
  const el = document.getElementById('die'), face = 1 + Math.floor(Math.random() * 6), quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0;
  const spin = quick || !el ? null : setInterval(() => { el.innerHTML = die(1 + Math.floor(Math.random() * 6), 132); el.style.transform = `rotate(${(i++ % 2 ? -1 : 1) * 16}deg) scale(1.08)`; }, 85);
  setTimeout(() => {
    if (spin) clearInterval(spin);
    if (el) el.style.transform = '';
    const before = tot(cur).total, md0 = medalSet(cur), rate = facesOf(cur)[face - 1], gain = faceEur(Math.max(0, before), facesOf(cur))[face - 1];
    EV[cur] = [...evs(cur), { t: 'bourse', d: iso(), face, rate, gain }];
    rolling = false; saveK(cur); sfx(rate > 0 ? 'win' : rate < 0 ? 'lose' : 'flat');
    sayMs(before, rate > 0 ? `Dé ${face} : +${f(gain)} dans ta tirelire !` : rate < 0 ? `Dé ${face} : ta tirelire perd ${f(Math.abs(gain))}.` : `Dé ${face} : rien ne bouge cette semaine.`, rate < 0 ? 'Ça arrive, la semaine prochaine sera peut-être meilleure.' : '');
    { const nm = newMedal(cur, md0); if (nm) say(nm, toast && toast.msg); }
    render();
  }, quick ? 30 : 1300);
}
const giftCheck = () => F.giftCheck !== false; // l'argent reçu doit être validé par un parent (oui par défaut)
// Message à l'enfant quand un parent doit valider : prévenu par notification si elles sont activées, sinon on l'invite à aller le dire.
function askParent(fresh) {
  const pl = ['parents', 'papamaman'].includes(F.parents), qui = pl ? 'ils' : F.parents === 'maman' ? 'elle' : 'il';
  if (F.push) return `${fresh ? 'C’est noté ! ' : ''}${P().label} ${pl ? 'vont' : 'va'} recevoir une notification pour valider. Tu peux aussi ${pl ? 'leur' : 'lui'} en parler, ça ira plus vite !`;
  return `${fresh ? 'C’est noté ! ' : ''}Va vite le dire ${P().a} pour qu’${qui} valide${pl ? 'nt' : ''}. L’argent comptera ensuite dans ta tirelire.`;
}
function doGift(ratio) {
  const amt = r2(num(form.gamount));
  if (!(amt > 0)) { say('Écris d’abord combien tu as reçu.'); return; }
  if (amt > 100000) { say('Montant trop élevé : 100 000 € maximum.'); return; }
  const inv2 = r2(amt * ratio), dep2 = r2(amt - inv2), bonus = r2(inv2 * gm() / 100), from = form.gfrom.trim();
  const before = tot(cur).total;
  const need = giftCheck();
  EV[cur] = [...evs(cur), { t: 'recu', d: iso(), from, inv: inv2, dep: dep2, bonus, ...(need ? { pending: true } : {}) }];
  sfx('coin');
  saveK(cur);
  if (need) queuePush('cadeau', { kid: cur, amount: amt, from: from.slice(0, 40) });
  if (need) { say(askParent(true)); form.gamount = ''; form.gfrom = ''; return; }
  sayMs(before, inv2 ? `Super ! ${f(inv2 + bonus)} rejoignent ta tirelire.` : `${f(dep2)} dans ton porte-monnaie.`, inv2 ? `${dep2 ? `Garde ${f(dep2)} dans ton porte-monnaie et donne` : 'Donne'} ${f(inv2)} ${P().a} pour qu’ils soient mis en lieu sûr.` : '');
  form.gamount = ''; form.gfrom = ''; view = 'home';
}
function okGift(id, d, yes) {
  const e = evs(id).find(x => x.t === 'recu' && x.d === d && x.pending); if (!e || !ready) return;
  const before = tot(id).total;
  EV[id] = evs(id).map(x => x === e ? (yes ? { ...x, pending: false, ok: iso() } : { ...x, pending: false, refused: iso() }) : x);
  saveK(id);
  if (!yes) { say(`Refusé : ${f(e.inv + e.dep)}${e.from ? ' de ' + esc(e.from) : ''} ne compte pas.`); return; }
  if (id === cur && view === 'recu') { view = 'home'; window.scrollTo(0, 0); }
  if (id === cur) sayMs(before, e.inv ? `Validé ! ${f(e.inv + e.bonus)} rejoignent ta tirelire.` : `Validé ! ${f(e.dep)} dans ton porte-monnaie.`, e.inv ? `Pense à mettre ${f(e.inv)} en lieu sûr.` : '');
  else say(`Validé pour ${esc(kidOf(id).name)}.`);
}
const giftLine = e => `${f(e.inv + e.dep)}${e.from ? ' de ' + esc(e.from) : ''} : ${e.inv ? f(e.inv) + ' dans la tirelire' : ''}${e.inv && e.dep ? ', ' : ''}${e.dep ? f(e.dep) + ' dans le porte-monnaie' : ''}`;
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
      const w = halfNum(k.weekly || suggest(k.birth));
      if (!(w >= 1 && w <= 50)) { ob.err = `Argent de poche entre 1 et 50 € pour ${k.name} (par pas de 50 centimes).`; return false; }
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
    const fam = { v: 1, parents: ob.parents, kids: ob.kids.map(k => ({ id: k.id, start: iso(), name: k.name, birth: k.birth, weekly: k.weekly, color: k.color, posture: ob.dice })), match: ob.match, giftMatch: ob.giftMatch, raise: true, dice: POST[ob.dice].faces.slice(), diceName: ob.dice, defaultPosture: ob.dice, pin: ob.pin, created: iso(), consent: { d: (() => { try { return localStorage.getItem('pepite-consent'); } catch (e) { return null; } })() || iso(), v: PRIVACY_VERSION }, stats: { created: iso(), seen: iso().slice(0, 10), days: 1, ...(standalone() ? { inst: iso().slice(0, 10) } : {}), ...(srcOf() ? { src: srcOf() } : {}) } };
    await Promise.all(fam.kids.map(k => setDoc(doc(fdb, 'familles', user.uid, 'enfants', k.id), { events: (ob.legacy && ob.legacy[k.id]) || [], goal: null, pause: null })));
    await setDoc(doc(fdb, 'familles', user.uid), fam);
    view = 'home'; cur = fam.kids[0].id;
  } catch (e) { ob.err = 'Impossible d’enregistrer : vérifiez la connexion et les règles Firestore.'; }
  busy = false; render();
}

document.addEventListener('keydown', ev => {
  if (tour === null || user) return;
  if (ev.key === 'Escape') tourSeen(); else if (ev.key === 'ArrowRight') tour = Math.min(tourLen() - 1, tour + 1); else if (ev.key === 'ArrowLeft') tour = Math.max(0, tour - 1); else return;
  render();
});
let tx0 = null;
document.addEventListener('touchstart', ev => { tx0 = tour !== null && !user ? ev.touches[0].clientX : null; }, { passive: true });
document.addEventListener('touchend', ev => {
  if (tx0 === null || tour === null) return; const dx = ev.changedTouches[0].clientX - tx0; tx0 = null;
  if (Math.abs(dx) < 50) return; tour = dx < 0 ? Math.min(tourLen() - 1, tour + 1) : Math.max(0, tour - 1); render();
}, { passive: true });
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, k = b.dataset.k;
  if (a === 'roll') { roll(); return; }
  if (a !== 'undo') undoArm = false;
  if (a !== 'wipe') wipeArm = false;
  if (a !== 'kdel') delArm = null;
  if (a !== 'goaldrop') goalDropArm = false;
  switch (a) {
    case 'coinhint': say('Pour ranger une pièce, utilise les deux boutons juste en dessous : porte-monnaie ou tirelire.'); break;
    case 'gnext': { const k = kidOf(cur); if (k && guide !== null) { guide++; guideHold = null; if (guideViews[guide] && guideViews[guide] !== view) { view = guideViews[guide]; guideShown = -1; window.scrollTo(0, 0); } } break; }
    case 'gprev': { const k = kidOf(cur); if (!k || guide === null || guide < 1) break; const S = guideSteps(k); let j = guide - 1; while (j > 0 && ((S[j].skip && S[j].skip()) || !guideViews[j])) j--; guide = j; guideHold = j; guideShown = -1; if (guideViews[j] && guideViews[j] !== view) { view = guideViews[j]; window.scrollTo(0, 0); } break; }
    case 'gskip': { const k = kidOf(cur); guideOff[cur] = true; guideEnd(k); break; }
    case 'gend': { const k = kidOf(cur); guideEnd(k); break; }
    case 'gspeak': guideSpeak(); return;
    case 'gstart': { const id = b.dataset.k || cur; if (kidOf(id)) { cur = id; resetCoins(); view = 'home'; guideKind = 'pay'; guidePlan = planOf(); guide = 0; delete guideOff[id]; guidePaid = false; guideShown = -1; guideHold = null; guideViews = []; pinOk = false; pinAsk = false; window.scrollTo(0, 0); } break; }
    case 'tour': tour = 0; break;
    case 'tnext': tour = Math.min(tourLen() - 1, tour + 1); break;
    case 'tprev': tour = Math.max(0, tour - 1); break;
    case 'tskip': tourSeen(); break;
    case 'tend': tourSeen(); loginMode = 'up'; window.scrollTo(0, 0); break;
    case 'tread': tourSeen(); view = 'lire'; window.scrollTo(0, 0); break;
    case 'signup': view = 'home'; loginMode = 'up'; window.scrollTo(0, 0); break;
    case 'art': view = 'art'; artId = b.dataset.n; window.scrollTo(0, 0); break;
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
    case 'go': pinFor = null; view = b.dataset.v; if (view === 'parents') markParent(); if (view === 'admin') loadAdmin(); if (view !== 'parents') { delAcct = false; delErr = ''; } if (view === 'avis') { avisSent = false; } if (b.dataset.from) lessonFrom = b.dataset.from; else if (!['lecons', 'lecon'].includes(view)) lessonFrom = null; if (!['parents', 'lire', 'art', 'apropos', 'confidentialite', 'admin', 'avis'].includes(view) && !(lessonFrom === 'parents' && ['lecons', 'lecon'].includes(view))) { pinOk = false; } pinAsk = false; pinBuf = ''; pinBad = false; window.scrollTo(0, 0); break;
    case 'kid': cur = k; goalEdit = false; resetCoins(); try { localStorage.setItem('pepite-cur', cur); } catch (e) {} break;
    case 'toPig': if (tray.length) depC.push(tray.shift()), sfx('coin'); break;
    case 'toGrow': if (tray.length) invC.push(tray.shift()), sfx('coin'); break;
    case 'backPig': if (depC.length) { sfx('back'); tray.push(depC.pop()); tray.sort((x, y) => y - x); } break;
    case 'backGrow': if (invC.length) { sfx('back'); tray.push(invC.pop()); tray.sort((x, y) => y - x); } break;
    case 'pay': {
      const t = tot(cur);
      const ow = owed(cur);
      if (!ready || tray.length || pauseOf(cur) || !ow.length) break;
      const inv = sumC(invC), dep = sumC(depC);
      const bonus = r2(inv * F.match / 100);
      const before = t.total;
      const md0 = medalSet(cur), ln0 = lessonsOpen(cur);
      EV[cur] = [...evs(cur), { t: 'paie', d: iso(), w: new Date(ow[0]).toISOString(), inv, dep, bonus }];
      sfx('pay');
      const nx = nextSerie(cur), st1 = streakOf(cur);
      const cel = newMedal(cur, md0) || (lessonsOpen(cur) > ln0 && lessonsOpen(cur) <= lessonList().length ? 'Nouvelle leçon débloquée !' : '') || (st1 >= 2 && nx ? `${st1} semaines d’affilée ! Encore ${nx.left} pour une nouvelle pépite.` : '');
      if (guide !== null) guidePaid = true;
      saveK(cur);
      sayMs(before, inv ? `Bravo ! ${f(inv + bonus)} rejoignent ta tirelire.` : 'Paie rangée : tout est dans ton porte-monnaie.', dep ? `${f(dep)} pour ton porte-monnaie : ${P().label.toLowerCase()} ${F.parents === 'parents' ? 'te les donneront' : 'te les donnera'}.` : '');
      if (cel) say(cel, toast && toast.msg);
      resetCoins(); if (ow.length <= 1) { view = 'home'; window.scrollTo(0, 0); } break;
    }
    case 'gift': if (ready) doGift(parseFloat(b.dataset.r)); break;
    case 'payhelp': payHelp = !(payHelp === null ? !tot(cur).paie : payHelp); break;
    case 'pm': { const v = projInv[cur]; projInv[cur] = Math.max(0, r50(v - (v > 20 ? 5 : v > 10 ? 1 : 0.5))); break; }
    case 'pp': { const v = projInv[cur]; projInv[cur] = Math.min(500, r50(v + (v >= 20 ? 5 : v >= 10 ? 1 : 0.5))); break; }
    case 'pset': projInv[cur] = +b.dataset.n; break;
    case 'bar': sel[cur] = +b.dataset.age; break;
    case 'pin':
      if (pinBuf.length < 4) pinBuf += b.dataset.n; pinBad = false;
      if (pinBuf.length === 4) { if (pinBuf === F.pin) { if (pinFor) { const pf = pinFor; pinFor = null; okGift(pf.k, pf.d, true); } else if (pinAsk) { lock = null; pinAsk = false; pinOk = false; try { localStorage.removeItem('pepite-lock'); } catch (e) {} say('Appareil déverrouillé.'); } else pinOk = true; } else pinBad = true; pinBuf = ''; }
      break;
    case 'pinback': pinBuf = pinBuf.slice(0, -1); break;
    case 'askpin': pinAsk = true; pinBuf = ''; pinBad = false; window.scrollTo(0, 0); break;
    case 'pinout': pinFor = null; pinAsk = false; pinBuf = ''; pinBad = false; break;
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
    case 'undo': if (lock && !pinOk) { const le = evs(cur)[evs(cur).length - 1]; if (!le || !KID_UNDO.includes(le.t)) break; } if (ready) { if (!undoArm) undoArm = true; else { const lastEv = evs(cur)[evs(cur).length - 1]; if (lastEv && lastEv.t === 'pause') PAUSE[cur] = null; if (lastEv && lastEv.t === 'posture' && POST[lastEv.prev]) { kidOf(cur).posture = lastEv.prev; saveF(); } EV[cur] = evs(cur).slice(0, -1); saveK(cur); undoArm = false; say('Dernière opération annulée.'); } } break;
    case 'resetopen': resetFor = cur; form.resetname = ''; break;
    case 'resetclose': resetFor = null; form.resetname = ''; break;
    case 'resetdo': {
      const x = kidOf(resetFor);
      if (!ready || !x || form.resetname.trim().toLowerCase() !== x.name.toLowerCase()) break;
      EV[x.id] = []; GOAL[x.id] = null; saveK(x.id); if (x.id === cur) resetCoins();
      resetFor = null; form.resetname = ''; say(`La tirelire ${de(x.name)} est remise à zéro.`);
      break;
    }
    case 'raise': if (ready) { F.raise = b.dataset.n === 'true'; kids().forEach(k => { if (validBirth(k.birth)) k.raisedAge = ageAt(k.birth, new Date()); }); saveF(); say(F.raise ? 'La paie augmentera de 0,50 € à chaque anniversaire.' : 'La paie ne changera plus toute seule.'); } break;
    case 'gval': if (ready) { if (F.pin) { pinFor = { k: cur, d: b.dataset.d }; pinBuf = ''; pinBad = false; window.scrollTo(0, 0); } else okGift(cur, b.dataset.d, true); } break;
    case 'gok': okGift(b.dataset.k, b.dataset.d, true); break;
    case 'gno': okGift(b.dataset.k, b.dataset.d, false); break;
    case 'giftcheck': if (ready) { F.giftCheck = b.dataset.n === 'true'; saveF(); } break;
    case 'pstrat': if (POST[b.dataset.n]) projStrat[cur] = b.dataset.n; break;
    case 'amood': avisMood = b.dataset.n; break;
    case 'avissend': sendAvis(); return;
    case 'video': openVideo(); return;
    case 'pushon': pushOn(); return;
    case 'pushask': pushAsked(false); pushOn(); return;
    case 'pushlater': pushAsked(true); break;
    case 'admcsv': if (adminData) adminCsv(b.dataset.n); return;
    case 'svnps': form.svnps = +b.dataset.n; break;
    case 'svwtp': form.svwtp = b.dataset.n; break;
    case 'svsrc': form.svsrc = b.dataset.n; break;
    case 'svsend': if (ready && form.svnps !== undefined && form.svwtp) { F.survey = { d: iso(), nps: form.svnps, wtp: form.svwtp, src: form.svsrc || '', txt: (form.svtxt || '').trim().slice(0, 600), v: VERSION }; form.svDone = true; saveF(); } break;
    case 'svlater': if (ready) { F.svLater = iso(); F.svN = (F.svN || 0) + 1; saveF(); } break;
    case 'sons': try { localStorage.setItem('pepite-sons', b.dataset.n === 'on' ? '1' : '0'); } catch (e) {} sfx('good'); break;
    case 'mednext': medalQ.shift(); medalSeq++; if (medalQ.length) setTimeout(() => sfx('pep'), 250); break;
    case 'pushoff': pushOff(); return;
    case 'pushtest': queuePush('test', {}); say('Notification de test demandée.', 'Elle arrive dans les 15 minutes environ.'); break;
    case 'install': if (installEv) { const e = installEv; installEv = null; e.prompt(); e.userChoice.finally(() => render()); } break;
    case 'stats': if (ready) { if (b.dataset.n === 'off') { F.noStats = true; delete F.stats; } else { delete F.noStats; touchStats(true); } saveF(); } break;
    case 'export': exportData(); break;
    case 'delopen': delAcct = true; delErr = ''; form.delpass = ''; break;
    case 'delcancel': delAcct = false; delErr = ''; form.delpass = ''; break;
    case 'deldo': deleteAccount(); return;
    case 'gateskip': gateOff = true; try { sessionStorage.setItem('pepite-gate', '1'); } catch (e) {} break;
    case 'gatecopy': try { navigator.clipboard.writeText(location.href.split('#')[0]); say('Lien copié : colle-le dans Chrome.'); } catch (e) {} break;
    case 'adminreload': loadAdmin(); break;
    case 'vapidgen': genVapid(); return;
    case 'lecon': { const L = lessonList(), ix = L.findIndex(x => x.id === b.dataset.n); if (ix >= lessonsOpen(cur)) break; } view = 'lecon'; lessonId = b.dataset.n; window.scrollTo(0, 0); break;
    case 'kq': { const x = lessonList().find(l => l.id === lessonId); if (x) { kq[x.id] = +b.dataset.n; sfx(kq[x.id] === x.quiz.ok ? 'good' : 'bad'); const k = kidOf(cur); if (k && ready && lessonFrom !== 'parents' && kq[x.id] === x.quiz.ok && !(k.lq && k.lq[x.id])) { const md0 = medalSet(cur); k.lq = { ...(k.lq || {}), [x.id]: 1 }; saveF(); const nm = newMedal(cur, md0); if (nm) say(nm); } } break; }
    case 'kread': { const el = document.querySelector('.lesson'); if (!el) return; try { if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; } const txt = [...el.querySelectorAll('h2, .alead, p:not(.kicker):not(.qfb), h4')].filter(e => !e.closest('.quiz') && !e.closest('figure')).map(e => e.innerText).join('. '); const u = new SpeechSynthesisUtterance(txt); u.lang = 'fr-FR'; u.rate = 0.95; const v = speechSynthesis.getVoices().find(z => /^fr/i.test(z.lang)); if (v) u.voice = v; speechSynthesis.speak(u); } catch (e) {} return; }
    case 'mycolor': { const x = kidOf(cur); if (x && ready && PAL.includes(b.dataset.c)) { x.color = b.dataset.c; saveF(); } break; }
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
  if (fk) form[fk] = t.type === 'checkbox' ? t.checked : t.value;
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
  else if (key === 'kweekly' && x) { const n = halfNum(v); if (n >= 1 && n <= 50) { x.weekly = n; saveF(); if (id === cur) resetCoins(); } }
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
    if (loginMode === 'up') { if (!form.ok) { loginErr = 'Cochez la case pour confirmer que vous êtes le parent.'; busy = false; return render(); } try { localStorage.setItem('pepite-consent', iso()); } catch (e) {} await createUserWithEmailAndPassword(auth, form.email.trim(), form.pass); }
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
  if (u) startSync(); else { stopSync(); if (view !== 'confidentialite') view = 'home'; }
  render();
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
// Installation : on garde l'invitation du navigateur pour la proposer depuis l'espace parents
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEv = e; render(); });
addEventListener('appinstalled', () => { installEv = null; installed = true; render(); });
// Appli déjà installée sur ce téléphone ? (Chrome Android, grâce à related_applications du manifeste)
if (navigator.getInstalledRelatedApps) navigator.getInstalledRelatedApps().then(a => { if (a && a.length) { relatedApp = true; render(); } }).catch(() => {});
// Ouverture depuis une notification : ?go=parents mène à l'Espace parents (le code est demandé si l'appareil est verrouillé).
try { if (new URLSearchParams(location.search).get('go') === 'parents') { view = 'parents'; history.replaceState(null, '', location.pathname); } } catch (e) {}
// Lien direct vers la politique de confidentialité (exigé par le Play Store)
if (/^#(confidentialite|suppression)/.test(location.hash)) { view = 'confidentialite'; gateOff = true; render(); }
