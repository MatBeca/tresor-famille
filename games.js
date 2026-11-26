// Jeux de Pépite : génération des manches (logique pure, sans affichage).
// Montants en centimes pour éviter les erreurs d'arrondi. Trois niveaux : p (6-7 ans), m (8-9 ans), g (10-12 ans).
export const LEVELS = [['p', 'Petits', '6-7 ans'], ['m', 'Moyens', '8-9 ans'], ['g', 'Grands', '10-12 ans']];
export const levelOfAge = a => (a === '' || a == null) ? 'm' : a <= 7 ? 'p' : a <= 9 ? 'm' : 'g';
export const ROUNDS = 5, WIN = 4, PER_DAY = 3;

const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const eu = c => (c % 100 ? (c / 100).toFixed(2).replace('.', ',') : String(c / 100)) + ' €';

const ITEMS = [['🍎', 'une pomme'], ['📕', 'un livre'], ['🎈', 'un ballon'], ['🧸', 'un ours en peluche'], ['⚽', 'un ballon de foot'], ['🍦', 'une glace'], ['🖍️', 'des crayons'], ['🧃', 'un jus de fruits'], ['🪁', 'un cerf-volant'], ['🎲', 'un jeu de dés'], ['🥐', 'un croissant'], ['🔦', 'une lampe de poche'], ['🧩', 'un puzzle'], ['🎨', 'une boîte de peinture']];
const PRODUCTS = [['✏️', 'stylo', 'stylos', 'un'], ['🍪', 'paquet de biscuits', 'paquets de biscuits', 'un'], ['🧃', 'jus de fruits', 'jus de fruits', 'un'], ['📒', 'cahier', 'cahiers', 'un'], ['🎾', 'balle de tennis', 'balles de tennis', 'une'], ['🍫', 'tablette de chocolat', 'tablettes de chocolat', 'une']];

// ---------- Le Marché ----------
function marcheRound(lv) {
  if (lv === 'p') { // payer le compte juste
    const [ic, name] = pick(ITEMS), price = R(3, 12) * 100;
    return { kind: 'pay', ic, name, price, coins: [100, 200, 500], tray: [], q: `Paie ${name} : il coûte ${eu(price)}. Pose le compte juste sur le comptoir.` };
  }
  if (lv === 'm') { // rendre la monnaie
    const [ic, name] = pick(ITEMS), price = R(3, 19) * 50, given = price < 500 ? pick([500, 1000]) : price < 1000 ? pick([1000, 2000]) : 2000;
    return { kind: 'change', ic, name, price, given, coins: [50, 100, 200, 500], tray: [], q: `Tu es le marchand ! Le client achète ${name} à ${eu(price)} et paie avec un billet de ${eu(given)}. Rends-lui la monnaie.` };
  }
  // g : le meilleur prix
  const [ic, one, many, art] = pick(PRODUCTS), t = R(0, 2);
  let a, b, best, why;
  if (t === 0) { // lot contre unité
    const u = R(8, 20) * 10, n = R(2, 4), lotU = Math.round(u * (Math.random() < 0.5 ? R(70, 92) : R(105, 125)) / 100 / 10) * 10, lot = lotU * n;
    a = `1 ${one} à ${eu(u)}`; b = `Le lot de ${n} à ${eu(lot)}`; best = lotU < u ? 'b' : 'a';
    why = `Dans le lot, ${art} ${one} revient à ${eu(lotU)}, contre ${eu(u)} à l’unité.`;
    if (lotU === u) return marcheRound(lv);
  } else if (t === 1) { // pourcentage contre prix barré
    const P = R(10, 40) * 100, r = pick([10, 20, 25, 30, 50]), after = Math.round(P * (100 - r) / 100), Q = after + pick([-1, 1]) * R(3, 12) * 10;
    a = `${one[0].toUpperCase() + one.slice(1)} à ${eu(P)}, −${r} %`; b = `Le même chez le voisin : ${eu(Q)}`; best = after < Q ? 'a' : 'b';
    why = `−${r} % sur ${eu(P)}, ça fait ${eu(P - after)} de moins : ${eu(after)}. ${after < Q ? 'C’est moins que' : 'C’est plus que'} ${eu(Q)}.`;
  } else { // offert contre pourcentage
    const [buy, free] = pick([[2, 1], [3, 1], [4, 1]]), eq = Math.round(100 * free / (buy + free)), r = pick([20, 25, 30, 40].filter(x => x !== eq));
    a = `${buy} ${many} achetés, ${free} offert`; b = `−${r} % sur chaque ${one}`; best = eq > r ? 'a' : 'b';
    why = `${buy} achetés et ${free} offert, c’est payer ${buy} ${many} sur ${buy + free} : environ −${eq} %. ${eq > r ? 'Mieux que' : 'Moins bien que'} −${r} %.`;
  }
  return { kind: 'deal', ic, q: `Quelle est la meilleure affaire pour acheter des ${many} ?`, opts: [['a', a], ['b', b]], answer: best, why };
}

// ---------- La Course des tirelires ----------
const NAMES = [['Inès', 'Hugo'], ['Léa', 'Sami'], ['Jade', 'Noé'], ['Lina', 'Tom']];
function courseRound(lv) {
  const [A, B] = pick(NAMES);
  if (lv === 'p') { // régularité et temps, sans intérêts
    let pa, wa, pb, wb;
    do { pa = R(1, 3); wa = R(6, 12); pb = R(pa + 1, 6); wb = R(2, 5); } while (pa * wa === pb * wb && Math.random() < 0.7 || Math.abs(pa * wa - pb * wb) === 1 && Math.random() < 0.5);
    const va = pa * wa, vb = pb * wb, ans = va > vb ? 'a' : vb > va ? 'b' : 'e';
    return { kind: 'race', q: `${A} met ${pa} € de côté chaque semaine pendant ${wa} semaines. ${B} met ${pb} € par semaine, mais seulement pendant ${wb} semaines. Qui aura la plus grosse tirelire ?`, opts: [['a', A], ['b', B], ['e', 'Égalité']], answer: ans,
      bars: [[A, va], [B, vb]], unit: 'semaines', why: `${A} : ${wa} × ${pa} € = ${va} €. ${B} : ${wb} × ${pb} € = ${vb} €.` };
  }
  if (lv === 'm') { // commencer tôt avec des intérêts
    const r = pick([5, 8, 10]), ya = R(10, 16), yb = R(3, Math.max(4, ya - 6)), sa = pick([100, 200]), sb = sa + pick([50, 100, 150]);
    const va = sa * (1 + r / 100) ** ya, vb = sb * (1 + r / 100) ** yb;
    if (Math.abs(va - vb) / Math.max(va, vb) < 0.06) return courseRound(lv);
    return { kind: 'race', q: `Leur argent rapporte ${r} % par an. ${A} place ${sa} € pendant ${ya} ans. ${B} place ${sb} €, mais seulement pendant ${yb} ans. Qui aura le plus à la fin ?`, opts: [['a', A], ['b', B]], answer: va > vb ? 'a' : 'b',
      bars: [[A, Math.round(va)], [B, Math.round(vb)]], unit: 'ans', why: `${A} finit avec environ ${Math.round(va)} €, ${B} avec environ ${Math.round(vb)} €. ${va > vb ? 'Le temps a fait la différence : c’est ça, les intérêts composés.' : 'Cette fois, la plus grosse mise l’emporte.'}` };
  }
  // g : calculer
  const t = R(0, 2);
  if (t === 0) { // intérêts composés
    const r = pick([5, 6, 8, 10]), n = pick([5, 8, 10]), v = 100 * (1 + r / 100) ** n, simple = 100 + 100 * r / 100 * n, big = v * 1.25;
    const ok = Math.round(v), opts = shuffle([[String(ok), `${ok} €`], [String(Math.round(simple)), `${Math.round(simple)} €`], [String(Math.round(big)), `${Math.round(big)} €`]]);
    return { kind: 'mcq', q: `${A} place 100 € à ${r} % par an, et laisse les intérêts dans sa tirelire. Combien aura-t-elle au bout de ${n} ans ?`, opts, answer: String(ok),
      why: `Chaque année, les intérêts s’ajoutent et rapportent à leur tour : 100 × ${(1 + r / 100).toFixed(2).replace('.', ',')}^${n} ≈ ${ok} €. Sans cet effet boule de neige, on n’aurait que ${Math.round(simple)} €.` };
  }
  if (t === 1) { // règle de 72
    const r = pick([4, 6, 8, 9, 12]), y = 72 / r, opts = shuffle([[String(y), `${y} ans`], [String(y * 2), `${y * 2} ans`], [String(Math.round(100 / r)), `${Math.round(100 / r)} ans`]].filter((o, i, a) => a.findIndex(x => x[0] === o[0]) === i));
    return { kind: 'mcq', q: `À ${r} % par an, en combien de temps ton argent double-t-il ?`, opts, answer: String(y), why: `La règle de 72 : 72 ÷ ${r} = ${y} ans. Une astuce de pro pour calculer de tête !` };
  }
  const m = pick([5, 10, 20]), n = pick([12, 24, 36]), tot = m * n; // épargne régulière
  const opts = shuffle([[String(tot), `${tot} €`], [String(tot + m * 6), `${tot + m * 6} €`], [String(Math.round(tot * 0.75)), `${Math.round(tot * 0.75)} €`]]);
  return { kind: 'mcq', q: `${B} met ${m} € de côté chaque mois, sans y toucher, pendant ${n} mois. Combien a-t-il, sans compter les intérêts ?`, opts, answer: String(tot), why: `${n} mois × ${m} € = ${tot} €. Petit à petit, ça finit par faire beaucoup !` };
}

export const GAMES = {
  marche: { name: 'Le Marché', ic: '🏪', idea: 'Payer, rendre la monnaie, trouver la bonne affaire.', round: marcheRound },
  course: { name: 'La Course des tirelires', ic: '🏁', idea: 'Qui gagne : celui qui commence tôt ou celui qui met plus ?', round: courseRound, unlock: 's3' },
};
export const newParty = (id, lv) => ({ id, lv, i: 0, score: 0, rounds: Array.from({ length: ROUNDS }, () => GAMES[id].round(lv)), ans: null, done: false });
export const traySum = r => r.tray.reduce((a, c) => a + c, 0);
export const target = r => r.kind === 'pay' ? r.price : r.kind === 'change' ? r.given - r.price : null;
export const isRight = (r, a) => (r.kind === 'pay' || r.kind === 'change') ? traySum(r) === target(r) : a === r.answer;
export const explain = r => r.kind === 'pay' ? `Il fallait ${eu(r.price)}.` : r.kind === 'change' ? `${eu(r.given)} − ${eu(r.price)} = ${eu(r.given - r.price)} à rendre.` : r.why;
