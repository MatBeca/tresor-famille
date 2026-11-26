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

// ---------- Envie ou besoin ? ----------
const BESOINS = [['🪥', 'une brosse à dents'], ['🧼', 'du savon'], ['🧥', 'un manteau pour l’hiver'], ['📓', 'un cahier pour l’école'], ['🍞', 'du pain'], ['👓', 'des lunettes pour bien voir'], ['🧦', 'des chaussettes à ta taille'], ['☂️', 'un parapluie quand il pleut']];
const ENVIES = [['🍬', 'des bonbons'], ['🎮', 'un nouveau jeu vidéo'], ['🧸', 'une peluche de plus'], ['🍭', 'une sucette'], ['🃏', 'des cartes à collectionner'], ['🦖', 'une figurine'], ['✨', 'des autocollants brillants'], ['🎈', 'un ballon de baudruche']];
function envieRound(lv) {
  if (lv === 'p') {
    const b = Math.random() < 0.5, [ic, name] = pick(b ? BESOINS : ENVIES);
    return { kind: 'deal', ic, q: `${name[0].toUpperCase() + name.slice(1)} : c’est un besoin ou une envie ?`, opts: [['besoin', 'Un besoin'], ['envie', 'Une envie']], answer: b ? 'besoin' : 'envie',
      why: b ? 'C’est un besoin : on en a vraiment besoin pour vivre, être propre, au chaud ou apprendre.' : 'C’est une envie : ça fait plaisir, mais on peut s’en passer. Les envies, on les achète quand il reste de l’argent !' };
  }
  if (lv === 'm') {
    const [bi, bn, pb] = pick([['🪥', 'une brosse à dents', 2], ['🧼', 'du savon', 2], ['📓', 'un cahier pour l’école', 3], ['🍞', 'du pain', 1], ['🧦', 'des chaussettes', 4], ['✏️', 'des crayons pour l’école', 3]]), e = shuffle([['🍬', 'des bonbons', 2], ['🍭', 'une sucette', 1], ['🃏', 'des cartes à collectionner', 3], ['🦖', 'une figurine', 6], ['✨', 'des autocollants brillants', 3], ['🎈', 'un ballon de baudruche', 2], ['🧸', 'une petite peluche', 8]]).slice(0, 2), pe = [e[0][2], e[1][2]];
    return { kind: 'deal', ic: '👛', q: `Il te reste 10 € pour la semaine. Qu’achètes-tu en premier ?`, opts: shuffle([['besoin', `${bi} ${bn} (${pb} €)`], ['envie1', `${e[0][0]} ${e[0][1]} (${pe[0]} €)`], ['envie2', `${e[1][0]} ${e[1][1]} (${pe[1]} €)`]]), answer: 'besoin',
      why: `D’abord le besoin : ${bn}. Il reste ensuite ${10 - pb} € pour une envie, si tu veux. Dans l’autre sens, tu risques de ne plus avoir assez pour l’essentiel.` };
  }
  const t = R(0, 3);
  if (t === 0) { const m = pick([2, 3, 5]), y = m * 12; return { kind: 'mcq', ic: '📱', q: `Un jeu sur tablette coûte ${m} € par mois. Combien ça fait sur une année ?`, opts: shuffle([[String(y), `${y} €`], [String(m), `${m} €`], [String(m * 4), `${m * 4} €`]]), answer: String(y), why: `12 mois × ${m} € = ${y} €. Un petit prix chaque mois, ça finit par faire beaucoup : c’est le piège des abonnements !` }; }
  if (t === 1) return { kind: 'mcq', ic: '🧸', q: 'Tu vois un jouet à 20 € qui te fait très envie. Que fais-tu ?', opts: shuffle([['envie', 'Je l’achète tout de suite'], ['attendre', 'J’attends une semaine et je vois si j’en ai toujours envie'], ['envie2', 'J’emprunte de l’argent pour l’acheter']]), answer: 'attendre', why: 'Attendre une semaine, c’est l’astuce des pros : souvent, l’envie passe toute seule. Et si elle est toujours là, tu achèteras sans regret.' };
  if (t === 2) return { kind: 'mcq', ic: '📢', q: 'Une pub crie : « Dernière chance, plus que 2 heures ! » Qu’en penses-tu ?', opts: shuffle([['envie', 'Il faut vite acheter'], ['ruse', 'C’est une astuce pour me faire acheter sans réfléchir'], ['envie2', 'C’est forcément une bonne affaire']]), answer: 'ruse', why: 'Les pubs pressées veulent t’empêcher de réfléchir. Une vraie bonne affaire supporte bien une nuit de réflexion !' };
  return { kind: 'mcq', ic: '💶', q: 'Tu reçois 10 € d’argent de poche. Quel plan est le plus malin ?', opts: shuffle([['envie', 'Tout dépenser le jour même'], ['plan', 'En mettre une partie de côté et garder le reste pour se faire plaisir'], ['envie2', 'Tout dépenser, et emprunter si ça ne suffit pas']]), answer: 'plan', why: 'Un peu de côté, un peu pour le plaisir : c’est l’équilibre qui marche, et c’est exactement ce que tu fais avec ta paie !' };
}

// ---------- Le Défi de la guimauve ----------
const TREATS = [['🍬', 'bonbon', 'bonbons'], ['🍪', 'biscuit', 'biscuits'], ['⭐', 'autocollant', 'autocollants'], ['🧁', 'petit gâteau', 'petits gâteaux']];
const plural = (n, a, b) => `${n} ${n > 1 ? b : a}`;
function guimRound(lv) {
  if (lv === 'p') {
    const [ic, one, many] = pick(TREATS), d = pick(['dans 5 minutes', 'après le goûter', 'demain']), later = Math.random() < 0.65, n = R(1, 2), m = later ? n + R(1, 2) : pick([n, Math.max(1, n - 1)]);
    return { kind: 'deal', ic, q: `${plural(n, one, many)} maintenant, ou ${plural(m, one, many)} ${d} ?`, opts: [['now', `Maintenant : ${plural(n, one, many)}`], ['later', `J’attends : ${plural(m, one, many)}`]], answer: m > n ? 'later' : 'now',
      why: m > n ? `En attendant un peu, tu en as ${m} au lieu de ${n}. La patience rapporte !` : `Attendre pour avoir ${m === n ? 'pareil' : 'moins'} ? Pas la peine : ici, autant le prendre tout de suite.` };
  }
  if (lv === 'm') {
    const x = pick([5, 10, 20]), good = Math.random() < 0.6;
    const [y, d] = good ? pick([[x * 1.2, 'dans une semaine'], [x * 1.5, 'dans un mois'], [x * 2, 'dans un mois']]) : pick([[x, 'dans un mois'], [x + 0.1, 'dans un an'], [x * 0.9, 'dans une semaine']]);
    const yv = Math.round(y * 100) / 100, ys = eu(Math.round(yv * 100));
    return { kind: 'deal', ic: '⏳', q: `${x} € maintenant, ou ${ys} ${d} ?`, opts: [['now', `${x} € maintenant`], ['later', `${ys} ${d}`]], answer: good ? 'later' : 'now',
      why: good ? `Attendre ${d.replace('dans ', '')} pour gagner ${eu(Math.round((yv - x) * 100))} de plus : ça vaut le coup !` : `Attendre ${d.replace('dans ', '')} pour ${yv > x ? 'quelques centimes' : yv === x ? 'la même chose' : 'moins'} ? Ça ne vaut pas la peine.` };
  }
  // grands : comparer l'offre à ce que rapporterait un livret
  const r = pick([2, 3]), n = pick([1, 2]), x = 100, good = Math.random() < 0.55, k = good ? pick([10, 15, 20]) * n / 1 : pick([1, 2]) * n / 2;
  const y = Math.round(x * (1 + k / 100)), liv = Math.round(x * (1 + r * n / 100));
  return { kind: 'deal', ic: '🏦', q: `On te propose ${x} € aujourd’hui, ou ${y} € dans ${n} an${n > 1 ? 's' : ''}. Ton livret rapporte ${r} % par an. Que choisis-tu ?`, opts: [['now', `${x} € aujourd’hui, que je place sur mon livret`], ['later', `${y} € dans ${n} an${n > 1 ? 's' : ''}`]], answer: y > liv ? 'later' : 'now',
    why: `Sur le livret, ${x} € deviennent environ ${liv} € en ${n} an${n > 1 ? 's' : ''}. ${y > liv ? `L’offre de ${y} € est meilleure : attendre rapporte plus.` : `L’offre de ${y} € rapporte moins : mieux vaut prendre l’argent et le placer.`}` };
}

// ---------- Les Paniers : ne pas mettre tous ses œufs dans le même panier ----------
function panierRound(lv) {
  if (lv === 'g') return { kind: 'basket', mode: 'risk', eggs: 6, baskets: [['🧺', 'Panier sûr', '+1 œuf à la fin'], ['🎲', 'Panier risqué', '2 fois sur 3 : double ! 1 fois sur 3 : tout perdu']], dist: [0, 0],
    q: 'Répartis tes 6 œufs. Le panier sûr rapporte toujours 1 œuf. Le risqué peut doubler… ou tout perdre. Garde au moins 6 œufs pour réussir !' };
  const n = lv === 'p' ? 4 : 6, b = lv === 'p' ? 2 : 3, thr = lv === 'p' ? 2 : 3, ev = pick([['🦊', 'Un renard'], ['⛈️', 'Un orage'], ['🦝', 'Un raton laveur']]);
  return { kind: 'basket', mode: 'storm', eggs: n, thr, ev, baskets: Array.from({ length: b }, (_, i) => ['🧺', `Panier ${i + 1}`, '']), dist: Array(b).fill(0),
    q: `Range tes ${n} œufs dans les paniers. Attention : ${ev[1].toLowerCase()} va passer et casser les œufs d’un panier au hasard ! Sauve au moins ${thr} œufs.` };
}
export function resolveBasket(r) {
  if (r.res) return r.res;
  const N = r.eggs;
  if (r.mode === 'storm') {
    const hit = Math.floor(Math.random() * r.dist.length), lost = r.dist[hit], saved = N - lost, ok = saved >= r.thr;
    return (r.res = { ok, lost, hit, msg: `${r.ev[0]} ${r.ev[1]} a visité le panier ${hit + 1} : ${lost ? `${plural(lost, 'œuf cassé', 'œufs cassés')}.` : 'il était vide !'} Tu sauves ${saved} œuf${saved > 1 ? 's' : ''} sur ${N}.`,
      why: r.dist.some(v => v === N) ? 'Tout dans le même panier, c’est tout ou rien ! En répartissant, tu es sûr d’en sauver.' : 'En répartissant tes œufs, un seul coup du sort ne peut pas tout casser. C’est pareil avec l’argent !' });
  }
  const [safe, risky] = r.dist, win = Math.random() < 2 / 3, hit = win ? -1 : 1, fin = safe + (safe > 0 ? 1 : 0) + (win ? risky * 2 : 0), ok = fin >= N, lost = win ? 0 : risky;
  return (r.res = { ok, lost, hit, msg: `${win ? 'Le panier risqué a doublé !' : 'Aïe, le panier risqué a tout perdu.'} Tu finis avec ${fin} œuf${fin > 1 ? 's' : ''}.`,
    why: 'Beaucoup dans le sûr et un peu de risque, c’est la recette des investisseurs prudents : tu ne perds jamais gros, et parfois tu gagnes plus.' });
}

export const GAMES = {
  marche: { name: 'Le Marché', ic: '🏪', idea: 'Payer, rendre la monnaie, trouver la bonne affaire.', round: marcheRound },
  kilo: { name: 'Le Prix au kilo', ic: '⚖️', idea: 'Le gros paquet est-il vraiment moins cher ? Compare avant d’acheter.', round: kiloRound, unlock: 's2' },
  course: { name: 'La Course des tirelires', ic: '🏁', idea: 'Qui gagne : celui qui commence tôt ou celui qui met plus ?', round: courseRound, unlock: 's3' },
  envie: { name: 'Envie ou besoin ?', ic: '🛍️', idea: 'D’abord l’essentiel, ensuite le plaisir.', round: envieRound, unlock: 's5' },
  paniers: { name: 'Les Paniers', ic: '🧺', idea: 'Ne mets pas tous tes œufs dans le même panier !', round: panierRound, unlock: 'bourse' },
  guimauve: { name: 'Le Défi de la guimauve', ic: '🍡', idea: 'Maintenant, ou plus tard mais plus ? Sais-tu attendre quand ça vaut le coup ?', round: guimRound, unlock: 's10' },
};
export const newParty = (id, lv) => ({ id, lv, i: 0, score: 0, rounds: Array.from({ length: ROUNDS }, () => GAMES[id].round(lv)), ans: null, done: false });
export const traySum = r => r.tray.reduce((a, c) => a + c, 0);
export const target = r => r.kind === 'pay' ? r.price : r.kind === 'change' ? r.given - r.price : null;
export const isRight = (r, a) => r.kind === 'basket' ? resolveBasket(r).ok : (r.kind === 'pay' || r.kind === 'change') ? traySum(r) === target(r) : a === r.answer;
export const explain = r => r.kind === 'basket' ? `${r.res.msg} ${r.res.why}` : r.kind === 'pay' ? `Il fallait ${eu(r.price)}.` : r.kind === 'change' ? `${eu(r.given)} − ${eu(r.price)} = ${eu(r.given - r.price)} à rendre.` : r.why;
