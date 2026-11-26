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
// Petits : la régularité, avec de tout petits nombres. Moyens : commencer tôt. Grands : les intérêts, avec des nombres ronds.
const NAMES = [['Inès', 'Hugo'], ['Léa', 'Sami'], ['Jade', 'Noé'], ['Lina', 'Tom']];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin'];
function courseRound(lv) {
  const [A, B] = pick(NAMES), sw = Math.random() < 0.5; // qui est en tête change d'une manche à l'autre
  if (lv === 'p') {
    let pa, wa, pb, wb;
    do { pa = R(1, 2); wa = R(3, 6); pb = R(1, 3); wb = R(1, 2); } while (pa * wa - pb * wb < 2);
    const [X, Y, px, wx, py, wy] = sw ? [A, B, pa, wa, pb, wb] : [B, A, pb, wb, pa, wa], vx = px * wx, vy = py * wy;
    const t = (n, p, w) => `${n} met ${p} € ${w === 1 ? 'une seule fois' : `chaque semaine, pendant ${w} semaines`}`;
    return { kind: 'race', q: `${t(X, px, wx)}. ${t(Y, py, wy)}. Qui a le plus d’argent à la fin ?`, opts: [['a', X], ['b', Y]], answer: vx > vy ? 'a' : 'b',
      bars: [[X, vx], [Y, vy]], why: `${X} : ${vx} €. ${Y} : ${vy} €. Mettre un peu de côté souvent, ça finit par faire beaucoup !` };
  }
  if (lv === 'm') {
    const p = R(1, 3), m1 = R(0, 1), m2 = R(m1 + 2, 4), end = 5, w1 = (end - m1 + 1) * 4, w2 = (end - m2 + 1) * 4;
    const [X, Y, mx, my, wx, wy] = sw ? [A, B, m1, m2, w1, w2] : [B, A, m2, m1, w2, w1];
    return { kind: 'race', q: `${X} et ${Y} mettent chacun ${p} € de côté chaque semaine. ${X} commence en ${MOIS[mx]}, ${Y} en ${MOIS[my]}. En juin, qui a la plus grosse tirelire ?`, opts: [['a', X], ['b', Y]], answer: mx < my ? 'a' : 'b',
      bars: [[X, p * wx], [Y, p * wy]], why: `Même argent chaque semaine, mais ${mx < my ? X : Y} a commencé plus tôt : environ ${p * Math.max(wx, wy)} € contre ${p * Math.min(wx, wy)} €. Commencer tôt, c’est le secret !` };
  }
  const t = R(0, 2);
  if (t === 0) { // les intérêts de la première année
    const s0 = pick([100, 200, 500]), r = pick([5, 10]), g = s0 * r / 100;
    const opts = shuffle([[String(g), `${g} €`], [String(g * 10), `${g * 10} €`], [String(r), `${r} €`]].filter((o, i, x) => x.findIndex(y => y[0] === o[0]) === i));
    if (opts.length < 3) return courseRound(lv);
    return { kind: 'mcq', q: `${A} a ${s0} € qui rapportent ${r} % par an. Combien gagne-t-elle la première année ?`, opts, answer: String(g), why: `${r} %, c’est ${r} € pour chaque 100 €. Avec ${s0} €, ça fait ${g} € en un an, sans rien faire !` };
  }
  if (t === 1) { // l'effet boule de neige
    const r = 10;
    return { kind: 'mcq', q: `${A} a 100 € à ${r} % par an. La première année, elle gagne 10 €. Et la deuxième année, si elle laisse tout dans sa tirelire ?`, opts: shuffle([['plus', 'Un peu plus que 10 €'], ['pareil', 'Pareil : 10 €'], ['moins', 'Moins que 10 €']]), answer: 'plus',
      why: `La deuxième année, les intérêts se calculent sur 110 € : elle gagne 11 €. Les intérêts rapportent à leur tour : c’est l’effet boule de neige !` };
  }
  // commencer tôt avec des intérêts, écarts nets
  const ya = pick([15, 20]), yb = pick([5, 8]), sa = 100, sb = 200, va = Math.round(sa * 1.1 ** ya), vb = Math.round(sb * 1.1 ** yb);
  const [X, Y, x, y, vx, vy, sx, sy] = sw ? [A, B, ya, yb, va, vb, sa, sb] : [B, A, yb, ya, vb, va, sb, sa];
  return { kind: 'race', q: `Leur argent rapporte 10 % par an. ${X} place ${sx} € pendant ${x} ans. ${Y} place ${sy} € pendant ${y} ans. Qui a le plus à la fin ?`, opts: [['a', X], ['b', Y]], answer: vx > vy ? 'a' : 'b',
    bars: [[X, vx], [Y, vy]], why: `${va > vb ? A : B} a mis moins d’argent mais l’a laissé plus longtemps : environ ${Math.max(va, vb)} € contre ${Math.min(va, vb)} €. Le temps est ton super pouvoir !` };
}

// ---------- Le Prix au kilo : comparer pour la même quantité ----------
// Petits : même prix ou même taille, il suffit de regarder. Moyens : 2 petits ou 1 grand, en euros ronds. Grands : comparer au kilo avec des formats simples.
// [icône, partitif, contenant, unité, prix réaliste au kilo ou au litre en centimes (min, max)]
const KPROD = [['🥣', 'des céréales', 'paquet', 'kg', [400, 800]], ['🍝', 'des pâtes', 'paquet', 'kg', [200, 400]], ['🍚', 'du riz', 'paquet', 'kg', [200, 500]], ['🍪', 'des biscuits', 'paquet', 'kg', [600, 1000]], ['🧃', 'du jus d’orange', 'bouteille', 'L', [200, 300]], ['🥛', 'du lait', 'bouteille', 'L', [100, 200]], ['💧', 'de l’eau', 'bouteille', 'L', [50, 100]]];
const qty = (g, u) => u === 'kg' ? (g < 1000 ? `${g} g` : `${String(g / 1000).replace('.', ',')} kg`) : (g < 1000 ? `${g / 10} cl` : `${String(g / 1000).replace('.', ',')} L`);
const cap = t => t[0].toUpperCase() + t.slice(1);
function kiloRound(lv) {
  const [ic, part, box, u, [lo, hi]] = pick(KPROD), fem = box === 'bouteille', small = fem ? 'petite bouteille' : 'petit paquet', big = fem ? 'grande bouteille' : 'grand paquet';
  const s1 = u === 'kg' ? 500 : 1000, s2 = s1 * 2;
  if (lv === 'p') {
    if (Math.random() < 0.5) { // même prix : on prend le plus grand
      const p = R(2, 4) * 100;
      return { kind: 'deal', ic, q: `${cap(part)} : les deux coûtent ${eu(p)}. Lequel te donne le plus pour ton argent ?`, opts: shuffle([['a', `${cap(small)} de ${qty(s1, u)}`], ['b', `${cap(big)} de ${qty(s2, u)}`]]), answer: 'b',
        why: `Même prix, mais ${fem ? 'la grande bouteille' : 'le grand paquet'} contient deux fois plus. Pour ${eu(p)}, tu en as plus !` };
    }
    const p1 = R(1, 3) * 100, p2 = p1 + R(1, 2) * 100; // même taille : on prend le moins cher
    return { kind: 'deal', ic, q: `${cap(part)} : ${fem ? 'deux bouteilles' : 'deux paquets'} de ${qty(s1, u)}, exactement ${fem ? 'les mêmes' : 'les mêmes'}. Lequel choisis-tu ?`, opts: shuffle([['a', `Celui à ${eu(p1)}`], ['b', `Celui à ${eu(p2)}`]]), answer: 'a',
      why: `Même quantité : le moins cher, c’est celui à ${eu(p1)}. Tu gardes ${eu(p2 - p1)} pour ta tirelire !` };
  }
  if (lv === 'm') { // 2 petits ou 1 grand, euros ronds
    const p1 = R(1, 3) * 100, p2 = 2 * p1 + pick([-1, 1]) * 100, best = p2 < 2 * p1 ? 'b' : 'a';
    return { kind: 'deal', ic, q: `${cap(part)} : pour avoir ${qty(s2, u)}, que vaut-il mieux acheter ?`, opts: [['a', `2 ${fem ? 'petites bouteilles' : 'petits paquets'} de ${qty(s1, u)} à ${eu(p1)} ${fem ? 'chacune' : 'chacun'}`], ['b', `1 ${big} de ${qty(s2, u)} à ${eu(p2)}`]], answer: best,
      why: `2 × ${eu(p1)} = ${eu(2 * p1)}, contre ${eu(p2)} pour ${fem ? 'la grande' : 'le grand'}. ${best === 'b' ? (fem ? 'La grande bouteille gagne !' : 'Le grand paquet gagne !') : (fem ? 'Ici, la grande bouteille coûte plus cher !' : 'Ici, le grand paquet coûte plus cher !')}` };
  }
  // grands : prix au kilo avec des formats simples (500 g et 1 kg, 1 L et 2 L)
  const p1 = Math.max(30, Math.round(R(lo, hi) * s1 / 1000 / 10) * 10), k1 = p1 * 1000 / s1, f = pick([0.75, 0.85, 1.2, 1.3]), p2 = Math.round(k1 * s2 / 1000 * f / 10) * 10, k2 = p2 * 1000 / s2;
  if (Math.abs(k1 - k2) / Math.max(k1, k2) < 0.1) return kiloRound(lv);
  const le = u === 'kg' ? 'le kilo' : 'le litre';
  return { kind: 'deal', ic, q: `${cap(part)} : lequel coûte le moins cher ${u === 'kg' ? 'au kilo' : 'au litre'} ?`, opts: shuffle([['a', `${qty(s1, u)} à ${eu(p1)}`], ['b', `${qty(s2, u)} à ${eu(p2)}`]]), answer: k1 < k2 ? 'a' : 'b',
    why: `${qty(s1, u)} à ${eu(p1)}, ça fait ${eu(Math.round(k1))} ${le}. ${qty(s2, u)} à ${eu(p2)}, ça fait ${eu(Math.round(k2))} ${le}. Le prix ${u === 'kg' ? 'au kilo' : 'au litre'} est écrit en petit sur les étiquettes : regarde la prochaine fois !` };
}

export const GAMES = {
  marche: { name: 'Le Marché', ic: '🏪', idea: 'Payer, rendre la monnaie, trouver la bonne affaire.', round: marcheRound },
  kilo: { name: 'Le Prix au kilo', ic: '⚖️', idea: 'Le gros paquet est-il vraiment moins cher ? Compare avant d’acheter.', round: kiloRound, unlock: 's2' },
  course: { name: 'La Course des tirelires', ic: '🏁', idea: 'Qui gagne : celui qui commence tôt ou celui qui met plus ?', round: courseRound, unlock: 's3' },
};
export const newParty = (id, lv) => ({ id, lv, i: 0, score: 0, rounds: Array.from({ length: ROUNDS }, () => GAMES[id].round(lv)), ans: null, done: false });
export const traySum = r => r.tray.reduce((a, c) => a + c, 0);
export const target = r => r.kind === 'pay' ? r.price : r.kind === 'change' ? r.given - r.price : null;
export const isRight = (r, a) => (r.kind === 'pay' || r.kind === 'change') ? traySum(r) === target(r) : a === r.answer;
export const explain = r => r.kind === 'pay' ? `Il fallait ${eu(r.price)}.` : r.kind === 'change' ? `${eu(r.given)} − ${eu(r.price)} = ${eu(r.given - r.price)} à rendre.` : r.why;
