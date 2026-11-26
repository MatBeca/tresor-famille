// Les 20 pépites de la collection : une matière et une forme par pépite (dessins SVG, viewBox "2 8 60 52").
const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixc = (a, b, t) => '#' + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
export const tone = (c, t) => t >= 0 ? mixc(c, '#ffffff', t) : mixc(c, '#000000', -t);
const ell = (cx, cy, rx, ry, n, a0 = -Math.PI / 2) => Array.from({ length: n }, (_, i) => { const a = a0 + i * 2 * Math.PI / n; return [+(cx + rx * Math.cos(a)).toFixed(2), +(cy + ry * Math.sin(a)).toFixed(2)]; });
const pts = a => a.map(p => p.join(' ')).join(' ');
const poly = (a, fill, line, w = 1.1) => `<path d="M${pts(a)}Z" fill="${fill}" stroke="${line}" stroke-width="${w}" stroke-linejoin="round"/>`;
const edge = (a, line) => `<path d="M${pts(a)}Z" fill="none" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>`;
const shine = (d, w = 2.6, o = 1) => `<path d="${d}" stroke="#fff" stroke-width="${w}" stroke-linecap="round" fill="none" opacity="${o}"/>`;
const spark = (x, y, r, fill, line) => `<path d="M${x} ${y - r}Q${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y}Q${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r}Q${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y}Q${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r}Z" fill="${fill}" stroke="${line}" stroke-width="1.2" stroke-linejoin="round"/>`;
// Facettes en éventail autour d'un centre : tons alternés, plus clairs en haut à gauche.
function fan(outer, cx, cy, c, line) {
  return outer.map((p, i) => {
    const q = outer[(i + 1) % outer.length], mx = (p[0] + q[0]) / 2 - cx, my = (p[1] + q[1]) / 2 - cy;
    const lit = (-mx - my) / Math.hypot(mx, my); // éclairé depuis le haut à gauche
    return poly([p, q, [cx, cy]], tone(c, lit * 0.42 + (i % 2 ? 0.08 : -0.04)), line);
  }).join('');
}
const GOLD = ['#ffe68a', '#fff4bd', '#ffd24a', '#f7b52a', '#ffcb3a', '#e39a10', '#d08a00', '#eba216', '#b87400'];
const NUGF = ['M14 24 30 15 28 30Z', 'M30 15 46 17 42 32 28 30Z', 'M46 17 58 30 42 32Z', 'M6 40 14 24 28 30 30 44Z', 'M28 30 42 32 30 44Z', 'M58 30 56 46 42 32Z', 'M42 32 56 46 42 55 30 44Z', 'M6 40 30 44 20 54Z', 'M30 44 42 55 20 54Z'];

const D = {
  chocolat(c, L) { // morceau de tablette, deux carreaux en relief
    const top = [[8, 28], [33, 18], [58, 27], [33, 38]], A = [[8, 28], [20.5, 23], [45.5, 32.5], [33, 38]], B = [[20.5, 23], [33, 18], [58, 27], [45.5, 32.5]];
    const inset = (q, k = 0.24) => { const cx = q.reduce((s, p) => s + p[0], 0) / 4, cy = q.reduce((s, p) => s + p[1], 0) / 4; return q.map(([x, y]) => [x + (cx - x) * k, y + (cy - y) * k]); };
    const bevel = q => { const i = inset(q); return poly([q[0], q[1], i[1], i[0]], tone(c, 0.32), L, 0.8) + poly([q[1], q[2], i[2], i[1]], tone(c, 0.18), L, 0.8) + poly([q[2], q[3], i[3], i[2]], tone(c, -0.22), L, 0.8) + poly([q[3], q[0], i[0], i[3]], tone(c, -0.08), L, 0.8) + poly(i, tone(c, 0.1), L, 0.8); };
    const left = [[8, 28], [33, 38], [33, 51], [8, 41]], right = [[33, 38], [58, 27], [56, 31], [59, 34], [56.5, 38], [58, 41], [33, 51]];
    return poly(left, tone(c, -0.3), L) + poly(right, tone(c, -0.42), L) + bevel(A) + bevel(B) + edge([[8, 28], [33, 18], [58, 27], [56, 31], [59, 34], [56.5, 38], [58, 41], [33, 51], [8, 41]], L) + shine('M13 28.5 19 26.2', 2.2, 0.85);
  },
  ambre(c, L) { // goutte de résine avec une bulle et une petite feuille
    const d = 'M30 12Q36 12 42 22Q55 36 51 47Q47 56 31 56Q15 56 12 46Q9 35 21 22Q25 12 30 12Z';
    return `<path d="${d}" fill="${c}"/><path d="M51 47Q47 56 31 56Q16 56 12 46Q24 52 34 51Q46 50 51 47Z" fill="${tone(c, -0.25)}"/><path d="M36 38q5-6 9-3q-2 6-9 3zM36 38l7-2.5" fill="${tone(c, -0.45)}" stroke="${tone(c, -0.55)}" stroke-width="1" stroke-linejoin="round"/><circle cx="24" cy="44" r="2.4" fill="${tone(c, 0.55)}" stroke="${tone(c, -0.2)}" stroke-width="0.8"/><circle cx="29" cy="49" r="1.3" fill="${tone(c, 0.55)}"/><path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M22 30Q24 24 28 20') + shine('M19 36.5 19.6 35', 2.6);
  },
  quartz(c, L) { // une pointe de cristal hexagonale
    const f = [[[20, 27], [27, 23], [27, 55], [20, 51]], [[27, 23], [37, 23], [37, 55], [27, 55]], [[37, 23], [44, 27], [44, 51], [37, 55]]], t = [[[20, 27], [32, 9], [27, 23]], [[27, 23], [32, 9], [37, 23]], [[37, 23], [32, 9], [44, 27]]];
    const g = f.map((q, i) => poly(q, tone(c, [0.35, 0.05, -0.25][i]), L)).join('') + t.map((q, i) => poly(q, tone(c, [0.6, 0.4, 0.05][i]), L)).join('');
    return `<g transform="rotate(14 32 34)">${g}${edge([[20, 27], [32, 9], [44, 27], [44, 51], [37, 55], [27, 55], [20, 51]], L)}${shine('M23.5 30 23.5 44', 2.4, 0.9)}</g>${spark(49, 15, 4, tone(c, 0.85), L)}`;
  },
  perle(c, L) { // perle ronde et nacrée
    return `<ellipse cx="32" cy="55" rx="16" ry="3" fill="#000" opacity=".12"/><circle cx="32" cy="33" r="20" fill="${c}"/><path d="M48 24A20 20 0 0 1 22 50A20 20 0 0 0 52 33A20 20 0 0 0 48 24Z" fill="${tone(c, -0.14)}"/><path d="M14 38A20 20 0 0 0 30 52" stroke="#f6c8d8" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/><path d="M40 16A20 20 0 0 1 50 26" stroke="#c8e4f6" stroke-width="3" fill="none" opacity=".8" stroke-linecap="round"/><circle cx="32" cy="33" r="20" fill="none" stroke="${L}" stroke-width="3"/><ellipse cx="25" cy="25" rx="5.5" ry="3.6" transform="rotate(-35 25 25)" fill="#fff"/>`;
  },
  jade(c, L) { // disque de jade percé (pendentif)
    return `<path d="M32 13A21 21 0 1 1 31.9 13ZM32 26A8 8 0 1 0 32.1 26Z" fill="${c}" fill-rule="evenodd"/><path d="M50 28A21 21 0 0 1 16 48A21 21 0 0 0 53 34A21 21 0 0 0 50 28ZM26 39A8 8 0 0 0 40 37A8 8 0 0 1 26 39Z" fill="${tone(c, -0.2)}"/><path d="M32 13A21 21 0 1 1 31.9 13ZM32 26A8 8 0 1 0 32.1 26Z" fill="none" stroke="${L}" stroke-width="3" fill-rule="evenodd"/><path d="M14.5 27A19 19 0 0 1 24 16.5M36.5 26.5A8 8 0 0 1 39.5 30" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/><path d="M22 44q4 3 7 1" stroke="${tone(c, 0.35)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  },
  bronze(c, L) { // galet de métal lisse
    const d = 'M11 40C8 28 22 17 35 19C50 20 59 31 55 43C51 54 33 58 22 54C16 52 12 47 11 40Z';
    return `<path d="${d}" fill="${c}"/><path d="M55 43C51 54 33 58 22 54C16 52 12 47 11 40C20 49 34 50 44 46C50 43 53 38 54 33C56 36 56 40 55 43Z" fill="${tone(c, -0.3)}"/><path d="M20 30C26 24 33 23 40 25" stroke="${tone(c, 0.45)}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/><path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M21 28.5Q25 25 30 24');
  },
  argent(c, L) { // roche anguleuse taillée grossièrement
    const o = [[8, 42], [13, 26], [27, 17], [44, 19], [56, 31], [53, 47], [36, 56], [17, 53]];
    return fan(o, 31, 36, c, L) + edge(o, L) + shine('M15 27.5 22 22') + spark(40, 26, 4, tone(c, 0.85), L);
  },
  or(c, L) { // la pépite de la marque
    return NUGF.map((d, i) => `<path d="${d}" fill="${GOLD[i]}" stroke="${L}" stroke-width="1.1" stroke-linejoin="round"/>`).join('') + edge([[6, 40], [14, 24], [30, 15], [46, 17], [58, 30], [56, 46], [42, 55], [20, 54]], L) + shine('M20 27 26 21') + spark(33, 22, 4.5, '#fff8d6', L);
  },
  platine(c, L) { // petit lingot
    const top = [[17, 22], [42, 15], [53, 23], [28, 31]], fr = [[28, 31], [53, 23], [58, 40], [30, 50]], lf = [[17, 22], [28, 31], [30, 50], [9, 38]];
    return poly(lf, tone(c, -0.12), L) + poly(fr, tone(c, -0.3), L) + poly(top, tone(c, 0.45), L) + poly([[24, 23], [40, 18.6], [45, 22.5], [29, 27]], tone(c, 0.2), L, 0.9) + edge([[17, 22], [42, 15], [53, 23], [58, 40], [30, 50], [9, 38]], L) + shine('M33 36 41 33.5', 2.4, 0.9) + shine('M12.5 37 15 34', 2.2, 0.8) + spark(52, 13, 4, '#fff', L);
  },
  diamant(c, L) { // diamant taille brillant
    const f = [[[8, 28], [20, 16], [24, 28]], [[20, 16], [44, 16], [40, 28], [24, 28]], [[44, 16], [56, 28], [40, 28]], [[8, 28], [24, 28], [32, 56]], [[24, 28], [40, 28], [32, 56]], [[40, 28], [56, 28], [32, 56]]];
    const tn = [0.6, 0.75, 0.25, 0.2, -0.05, -0.3];
    return f.map((q, i) => poly(q, tone(c, tn[i]), L)).join('') + edge([[8, 28], [20, 16], [44, 16], [56, 28], [32, 56]], L) + shine('M24 20 29 20', 2.6) + spark(55, 13, 5, '#fff', L) + spark(9, 15, 3.5, '#fff', L) + spark(50, 47, 3, '#fff', L);
  },
  emeraude(c, L) { // taille émeraude : rectangle à pans coupés et gradins
    const o = [[17, 12], [47, 12], [53, 18], [53, 52], [47, 58], [17, 58], [11, 52], [11, 18]], i = [[22, 20], [42, 20], [45, 23], [45, 47], [42, 50], [22, 50], [19, 47], [19, 23]];
    const seg = (a, b, t) => poly([o[a], o[b], i[b], i[a]], tone(c, t), L);
    return seg(0, 1, 0.4) + seg(1, 2, 0.25) + seg(2, 3, -0.2) + seg(3, 4, -0.3) + seg(4, 5, -0.38) + seg(5, 6, -0.15) + seg(6, 7, 0.15) + seg(7, 0, 0.35) + poly(i, tone(c, 0.12), L) + poly([[22, 27], [42, 27], [42, 43], [22, 43]], tone(c, 0.02), L, 0.8) + edge(o, L) + shine('M24 31 31 24', 2.4, 0.85);
  },
  peridot(c, L) { // taille coussin
    const o = [[16, 13], [48, 13], [55, 20], [55, 48], [48, 55], [16, 55], [9, 48], [9, 20]];
    return fan(o, 32, 34, c, L) + poly([[24, 25], [40, 25], [43, 34], [40, 43], [24, 43], [21, 34]], tone(c, 0.3), L) + edge(o, L) + shine('M14 22 19 17') + spark(32, 30, 3.6, tone(c, 0.85), L);
  },
  rubis(c, L) { // cœur facetté
    const o = [[32, 21], [37, 15], [46, 13], [54, 18], [56, 27], [51, 39], [32, 56], [13, 39], [8, 27], [10, 18], [18, 13], [27, 15]];
    return fan(o, 32, 32, c, L) + edge(o, L) + shine('M14 21 18 17') + spark(41, 21, 3.6, tone(c, 0.85), L);
  },
  saphir(c, L) { // taille poire
    const o = [[32, 10], [41, 20], [49, 33], [49, 45], [42, 55], [22, 55], [15, 45], [15, 33], [23, 20]];
    return fan(o, 32, 40, c, L) + poly([[32, 27], [39, 37], [36, 46], [28, 46], [25, 37]], tone(c, 0.28), L) + edge(o, L) + shine('M21 30 26 22.5');
  },
  opale(c, L) { // œuf laiteux avec des éclats arc-en-ciel
    const fl = [['#ff8fb8', 'M24 26l6-3 2 5-6 2z'], ['#7fe0a8', 'M36 22l6 2-2 5-5-2z'], ['#ffd45c', 'M27 38l6-1 1 5-6 1z'], ['#7cc3ff', 'M38 34l6 1-1 6-5-2z'], ['#c99bff', 'M22 45l5-2 2 4-5 2z'], ['#7fe0d0', 'M34 47l5 0 0 4-5 0z']];
    return `<ellipse cx="32" cy="34" rx="19" ry="23" fill="${c}"/>${fl.map(([f, d]) => `<path d="${d}" fill="${f}" opacity=".85"/>`).join('')}<path d="M51 34A19 23 0 0 1 20 52A19 23 0 0 0 50 40Z" fill="${tone(c, -0.12)}"/><ellipse cx="32" cy="34" rx="19" ry="23" fill="none" stroke="${L}" stroke-width="3"/>` + shine('M18 30Q19 21 26 15');
  },
  lapis(c, L) { // pierre roulée bleu nuit pailletée d'or
    const d = 'M9 38C7 27 17 18 30 18C40 17 52 21 55 31C58 42 50 54 36 55C22 57 11 50 9 38Z';
    const dots = [[22, 30, 1.4], [35, 27, 1], [42, 38, 1.6], [28, 44, 1.2], [47, 30, 1], [18, 42, 1], [37, 48, 1.1], [31, 35, 0.9]];
    return `<path d="${d}" fill="${c}"/><path d="M55 31C58 42 50 54 36 55C22 57 11 50 9 38C19 47 33 49 43 45C50 42 54 37 55 31Z" fill="${tone(c, -0.3)}"/><path d="M16 36q8-6 16-2t16-4" stroke="${tone(c, 0.25)}" stroke-width="1.6" fill="none"/>${dots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffd24a"/>`).join('')}<path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M16 29Q20 23 27 21.5');
  },
  meteorite(c, L) { // roche venue de l'espace : cratères et étoiles
    const d = 'M10 36L15 24L26 18L40 19L52 26L56 38L50 50L36 56L22 54L12 47Z';
    const cr = [[25, 30, 4.5], [41, 33, 3.2], [33, 45, 5], [46, 46, 2.4], [19, 43, 2.2]];
    return `<path d="${d}" fill="${c}"/><path d="M56 38L50 50L36 56L22 54L12 47C24 51 36 50 46 44C51 41 54 38 56 38Z" fill="${tone(c, -0.35)}"/>${cr.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${tone(c, -0.3)}"/><path d="M${x - r * 0.8} ${y + r * 0.5}A${r} ${r} 0 0 0 ${x + r * 0.8} ${y + r * 0.5}" stroke="${tone(c, 0.35)}" stroke-width="1.2" fill="none"/>`).join('')}<path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M16 27 22 22.5') + spark(55, 14, 4.5, '#ffe68a', L) + spark(8, 17, 3, '#ffe68a', L) + spark(14, 56, 2.6, '#ffe68a', L);
  },
  cuivre(c, L) { // pépite bosselée, quelques taches de vert-de-gris
    const d = 'M10 38C8 30 14 26 19 27C20 20 28 17 33 21C38 16 47 18 48 25C55 25 59 32 55 38C58 45 52 52 45 50C40 56 30 55 27 51C20 54 11 50 13 44C9 43 9 40 10 38Z';
    return `<path d="${d}" fill="${c}"/><path d="M55 38C58 45 52 52 45 50C40 56 30 55 27 51C20 54 11 50 13 44C24 48 36 47 46 42C51 40 54 38 55 38Z" fill="${tone(c, -0.3)}"/><circle cx="43" cy="41" r="2.4" fill="#4fb59a"/><circle cx="24" cy="46" r="1.7" fill="#4fb59a"/><circle cx="47" cy="30" r="1.3" fill="#4fb59a"/><path d="M28 31q6-3 10 1" stroke="${tone(c, -0.25)}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M15 31.5 18 30') + shine('M25 24Q28 21 31 22') + shine('M41 22.5 44 22.5', 2.2);
  },
  amethyste(c, L) { // grappe de cristaux sur sa roche
    const cry = (dx, rot, s, k) => { const f = [[[-7, -16], [0, -28], [0, 0], [-7, 0]], [[0, -28], [7, -16], [7, 0], [0, 0]]]; return `<g transform="translate(${32 + dx} 50) rotate(${rot}) scale(${s})">${poly(f[0], tone(c, 0.3 - k), L)}${poly(f[1], tone(c, -0.15 - k), L)}${poly([[-7, -16], [0, -28], [7, -16], [0, -13]], tone(c, 0.55 - k), L, 0.9)}${edge([[-7, 0], [-7, -16], [0, -28], [7, -16], [7, 0]], L)}</g>`; };
    return cry(-11, -28, 0.85, 0.08) + cry(12, 26, 0.8, 0.1) + cry(0, 0, 1.15, 0) + `<path d="M9 52Q10 45 18 46Q24 43 32 46Q40 43 46 46Q54 45 55 52Q55 57 32 57Q9 57 9 52Z" fill="#8f8a99" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M27.5 33 27.5 40', 2.2, 0.9);
  },
  turquoise(c, L) { // cabochon ovale veiné
    return `<ellipse cx="32" cy="35" rx="25" ry="18" fill="${c}"/><path d="M57 35A25 18 0 0 1 9 39A25 18 0 0 0 56 39Z" fill="${tone(c, -0.25)}"/><path d="M14 33q6-5 11 0t9-2q4-3 8 1M24 44q5-3 9 1t9-3M37 22q3 4 1 8" stroke="#5a4a3a" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".75"/><ellipse cx="32" cy="35" rx="25" ry="18" fill="none" stroke="${L}" stroke-width="3"/>` + shine('M15 28Q19 21 28 19');
  },
  citrine(c, L) { // taille trillion
    const o = [[32, 10], [44, 29], [55, 50], [32, 54], [9, 50], [20, 29]];
    return fan(o, 32, 39, c, L) + poly([[32, 27], [42, 45], [22, 45]], tone(c, 0.35), L) + edge(o, L) + shine('M24 27 29 19') + spark(32, 39, 3.4, tone(c, 0.85), L);
  },
  topaze(c, L) { // ovale facetté
    const o = ell(32, 34, 24, 18, 14), i = ell(32, 34, 12, 8, 7);
    return fan(o, 32, 34, c, L) + poly(i, tone(c, 0.3), L) + edge(o, L) + shine('M14 27Q18 21 24 18.5');
  },
  aigue(c, L) { // baguette à gradins
    const o = [[12, 22], [52, 22], [52, 46], [12, 46]], i = [[18, 27], [46, 27], [46, 41], [18, 41]];
    const seg = (a, b, t) => poly([o[a], o[b], i[b], i[a]], tone(c, t), L);
    return `<g transform="rotate(-22 32 34)">${seg(0, 1, 0.45) + seg(1, 2, -0.2) + seg(2, 3, -0.35) + seg(3, 0, 0.2) + poly(i, tone(c, 0.12), L) + poly([[22, 31], [42, 31], [42, 37], [22, 37]], tone(c, 0.25), L, 0.8) + edge(o, L) + shine('M15.5 30 15.5 38', 2.4)}</g>`;
  },
  grenat(c, L) { // rond brillant vu de dessus
    const o = ell(32, 34, 23, 23, 16), i = ell(32, 34, 11, 11, 8, Math.PI / 8);
    return fan(o, 32, 34, c, L) + poly(i, tone(c, 0.22), L) + edge(o, L) + shine('M15 26Q18 20 23 17') + spark(36, 30, 3.4, tone(c, 0.8), L);
  },
  tourmaline(c, L) { // tranche « pastèque » : bord vert, cœur rose
    const o = ell(32, 34, 23, 23, 6, Math.PI / 6), w = ell(32, 34, 17.5, 17.5, 6, Math.PI / 6), i = ell(32, 34, 15.5, 15.5, 6, Math.PI / 6), k = ell(32, 34, 6, 6, 6, Math.PI / 6);
    return poly(o, '#3fae5c', L) + poly(w, '#f3f6ea', L, 0.8) + poly(i, c, L, 0.8) + poly(k, tone(c, -0.25), L, 0.8) + `<path d="M${pts(i)}Z" fill="${tone(c, 0.35)}" opacity=".5" transform="translate(-3 -3) scale(.55) translate(26 28)"/>` + edge(o, L) + shine('M14 24 20 17.5');
  },
  obsidienne(c, L) { // éclat de pierre volcanique, noir et brillant
    const o = [[30, 9], [46, 25], [43, 44], [30, 57], [17, 41], [20, 22]];
    return fan(o, 31, 34, c, L) + edge(o, L) + shine('M23 24 28 15') + shine('M37 42 40 36', 2.2, 0.8) + spark(48, 14, 4, '#fff', L);
  },
  malachite(c, L) { // pierre polie aux bandes vertes
    const d = 'M10 36C10 24 22 16 34 17C48 18 56 28 54 40C52 52 40 57 28 55C16 53 10 46 10 36Z';
    const bands = [0.78, 0.56, 0.34].map((k, j) => `<path d="${d}" transform="translate(${32 * (1 - k)} ${36 * (1 - k)}) scale(${k})" fill="${tone(c, j % 2 ? 0.25 : -0.22)}"/>`).join('');
    return `<path d="${d}" fill="${c}"/>${bands}<path d="M54 40C52 52 40 57 28 55C16 53 10 46 10 36C18 48 32 52 44 48C50 46 53 43 54 40Z" fill="#000" opacity=".15"/><path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M15 29Q19 22 26 19.5');
  },
  corail(c, L) { // branche de corail
    const br = 'M32 55V37M32 47Q24 41 21 31Q20 25 16 19M21 33Q14 31 11 25M32 40Q38 32 43 26Q46 20 45 13M43 27Q50 26 53 20M32 38Q31 29 33 21';
    return `<path d="${br}" stroke="${L}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${br}" stroke="${c}" stroke-width="5.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.5 29Q19 25 16 20.5M41.5 25Q44 20 44 15.5" stroke="${tone(c, 0.5)}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M20 57Q22 51 32 51Q42 51 44 57Z" fill="#e8d2a8" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>`;
  },
  glace(c, L) { // cristal de glace en flocon
    const arm = a => `M32 34L${32 + 22 * Math.cos(a)} ${34 + 22 * Math.sin(a)}M${32 + 13 * Math.cos(a)} ${34 + 13 * Math.sin(a)}L${32 + 13 * Math.cos(a) + 7 * Math.cos(a - 0.9)} ${34 + 13 * Math.sin(a) + 7 * Math.sin(a - 0.9)}M${32 + 13 * Math.cos(a)} ${34 + 13 * Math.sin(a)}L${32 + 13 * Math.cos(a) + 7 * Math.cos(a + 0.9)} ${34 + 13 * Math.sin(a) + 7 * Math.sin(a + 0.9)}`;
    const d = [0, 1, 2, 3, 4, 5].map(i => arm(-Math.PI / 2 + i * Math.PI / 3)).join('');
    return `<path d="${d}" stroke="${L}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>${poly(ell(32, 34, 7, 7, 6, Math.PI / 6), tone(c, 0.5), L, 1.6)}` + spark(52, 14, 3.6, '#fff', L);
  },
  tigre(c, L) { // œil-de-tigre : cabochon rayé et chatoyant
    return `<rect x="9" y="17" width="46" height="36" rx="15" fill="${c}"/><path d="M12 30Q22 26 32 30T54 29M10 39Q22 35 32 39T55 38M13 47Q22 44 32 47T52 46" stroke="${tone(c, -0.3)}" stroke-width="2.6" fill="none"/><path d="M14 34Q24 30 32 34T54 33" stroke="#ffe08a" stroke-width="3.4" fill="none" opacity=".85"/><rect x="9" y="17" width="46" height="36" rx="15" fill="none" stroke="${L}" stroke-width="3"/>` + shine('M16 23Q20 20 26 19.5');
  },
  fluorite(c, L) { // octaèdre violet et vert
    const g = '#5fd0b5';
    return poly([[32, 9], [10, 33], [29, 38]], tone(c, 0.35), L) + poly([[32, 9], [29, 38], [54, 32]], tone(c, -0.1), L) + poly([[10, 33], [29, 38], [32, 58]], tone(g, 0.2), L) + poly([[29, 38], [54, 32], [32, 58]], tone(g, -0.2), L) + edge([[32, 9], [54, 32], [32, 58], [10, 33]], L) + shine('M18 28 25 20') + spark(50, 14, 3.6, '#fff', L);
  },
  pyrite(c, L) { // cube : l'« or des fous »
    const top = [[32, 13], [54, 23], [32, 33], [10, 23]], lf = [[10, 23], [32, 33], [32, 56], [10, 46]], rt = [[32, 33], [54, 23], [54, 46], [32, 56]];
    const st = (a, b, n) => Array.from({ length: n }, (_, j) => { const k = (j + 1) / (n + 1); return `M${a[0][0] + (a[1][0] - a[0][0]) * k} ${a[0][1] + (a[1][1] - a[0][1]) * k}L${b[0][0] + (b[1][0] - b[0][0]) * k} ${b[0][1] + (b[1][1] - b[0][1]) * k}`; }).join('');
    return poly(top, tone(c, 0.35), L) + poly(lf, tone(c, -0.05), L) + poly(rt, tone(c, -0.3), L) + `<path d="${st([[10, 23], [32, 13]], [[32, 33], [54, 23]], 3)}${st([[10, 23], [10, 46]], [[32, 33], [32, 56]], 3)}${st([[54, 23], [54, 46]], [[32, 33], [32, 56]], 3)}" stroke="${L}" stroke-width=".7" opacity=".45"/>` + edge([[32, 13], [54, 23], [54, 46], [32, 56], [10, 46], [10, 23]], L) + shine('M16 25 24 21.5', 2.2) + spark(53, 12, 4, '#fff8d6', L);
  },
  labradorite(c, L) { // pierre sombre aux reflets bleus
    const d = 'M9 40C7 28 18 18 31 18C44 17 56 24 55 37C54 50 42 56 29 55C18 54 10 49 9 40Z';
    return `<path d="${d}" fill="${c}"/><path d="M14 40Q24 28 40 30T52 26Q48 40 32 42T14 40Z" fill="#4fc3f7" opacity=".85"/><path d="M20 47Q32 40 46 44Q40 50 30 50T20 47Z" fill="#5ee0b0" opacity=".7"/><path d="M24 33Q32 28 42 31" stroke="#b5f0ff" stroke-width="1.6" fill="none" opacity=".9"/><path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M15 30Q19 23 26 21');
  },
  lune(c, L) { // pierre de lune en croissant
    const d = 'M40 12A22 22 0 1 0 40 56A42 42 0 0 1 40 12Z';
    return `<path d="${d}" fill="${c}"/><path d="M22 21Q15 34 22 47" stroke="#9ec5ff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/><path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M25 17Q29 14.5 33 13.6') + spark(50, 26, 4, '#fff', L) + spark(48, 42, 2.6, '#fff', L);
  },
  tanzanite(c, L) { // taille marquise
    const o = [[6, 34], [14, 26], [24, 21], [32, 20], [40, 21], [50, 26], [58, 34], [50, 42], [40, 47], [32, 48], [24, 47], [14, 42]];
    return `<g transform="rotate(-24 32 34) translate(32 34) scale(.86) translate(-32 -34)">${fan(o, 32, 34, c, L)}${poly([[20, 34], [32, 28], [44, 34], [32, 40]], tone(c, 0.3), L)}${edge(o, L)}${shine('M15 30 22 25.5')}</g>`;
  },
  soleil(c, L) { // pierre de soleil : un petit soleil pailleté
    const rays = Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4 - Math.PI / 2, b = 0.32; return poly([[32 + 16 * Math.cos(a - b), 34 + 16 * Math.sin(a - b)], [32 + 25 * Math.cos(a), 34 + 25 * Math.sin(a)], [32 + 16 * Math.cos(a + b), 34 + 16 * Math.sin(a + b)]], tone(c, i % 2 ? 0.25 : -0.05), L, 2); }).join('');
    const dots = [[27, 30], [36, 28], [38, 38], [29, 40], [33, 34], [24, 36], [40, 33]];
    return rays + `<circle cx="32" cy="34" r="15" fill="${c}" stroke="${L}" stroke-width="3"/>${dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="${tone(c, -0.35)}"/>`).join('')}` + shine('M23 30Q25 25 30 23.5');
  },
  ammonite(c, L) { // fossile en spirale
    const P = []; for (let a = 0; a <= 4 * Math.PI; a += 0.2) { const r = 2.5 + 20 * a / (4 * Math.PI); P.push([32 + r * Math.cos(a), 34 + r * Math.sin(a)]); }
    const sp = 'M' + P.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L');
    const ribs = P.filter((_, i) => i > 30 && i % 2 === 0).map(([x, y]) => { const dx = x - 32, dy = y - 34, r = Math.hypot(dx, dy), k = (r - 9) / r; return `M${x.toFixed(1)} ${y.toFixed(1)}L${(32 + dx * k).toFixed(1)} ${(34 + dy * k).toFixed(1)}`; }).join('');
    return `<circle cx="32" cy="34" r="22.5" fill="${c}"/><path d="${ribs}" stroke="${tone(c, -0.3)}" stroke-width="1.2"/><path d="${sp}" stroke="${L}" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="32" cy="34" r="22.5" fill="none" stroke="${L}" stroke-width="3"/>` + shine('M15 26Q19 19 26 15.5');
  },
  rose(c, L) { // rose des sables : pétales de pierre
    const pet = [[18, 41, 12, 4.8, -60, -0.05], [46, 41, 12, 4.8, 60, -0.2], [24, 30, 12, 4.8, -25, 0.18], [40, 30, 12, 4.8, 25, 0.02], [32, 33, 13, 4.6, 90, 0.3], [32, 48, 16, 5.5, 0, -0.1], [22, 45, 11, 4.5, -15, 0.12], [42, 45, 11, 4.5, 15, -0.02]];
    return pet.map(([x, y, rx, ry, r, t]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${y})" fill="${tone(c, t)}" stroke="${L}" stroke-width="2"/>`).join('') + shine('M24 25.5 30 23.5', 2.2);
  },
  agate(c, L) { // tranche de géode aux bandes bleues
    const d = 'M10 34C9 22 20 14 33 15C46 16 56 25 54 38C52 50 41 56 29 55C17 54 11 45 10 34Z';
    const bands = [[0.82, 0.55], [0.66, 0.05], [0.5, 0.6], [0.36, 0.25]].map(([k, t]) => `<path d="${d}" transform="translate(${32 * (1 - k)} ${35 * (1 - k)}) scale(${k})" fill="${tone(c, t)}"/>`).join('');
    const cry = [[30, 33], [34, 36], [31, 38], [35, 32]].map(([x, y]) => poly([[x, y - 2.5], [x + 2, y + 1.5], [x - 2, y + 1.5]], '#fff', tone(c, -0.2), 0.6)).join('');
    return `<path d="${d}" fill="${c}"/>${bands}${cry}<path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M15 27Q18 21 24 18');
  },
  arcenciel(c, L) { // la pépite de la marque, en couleurs
    const R = ['#ffd93b', '#fff1a8', '#ff9f43', '#ff6b6b', '#ffc56b', '#6bcb77', '#4d96ff', '#ff8fc7', '#9b6bff'];
    return NUGF.map((d, i) => `<path d="${d}" fill="${R[i]}" stroke="${L}" stroke-width="1.1" stroke-linejoin="round"/>`).join('') + edge([[6, 40], [14, 24], [30, 15], [46, 17], [58, 30], [56, 46], [42, 55], [20, 54]], L) + shine('M20 27 26 21') + spark(33, 22, 4.5, '#fff', L) + spark(55, 13, 4, '#ffd93b', L) + spark(8, 15, 3, '#4d96ff', L);
  },
};

// Matière, couleur, trait et dessin de chaque pépite (même ordre que la liste des pépites).
export const MATS = {
  paie1: { mat: 'de chocolat', c: '#7a4524', line: '#3a1d0c', draw: 'chocolat' },
  projet0: { mat: 'd’ambre', c: '#f0921c', line: '#7a3f00', draw: 'ambre' },
  bonus1: { mat: 'de quartz rose', c: '#f08cab', line: '#8a2c4c', draw: 'quartz' },
  recu1: { mat: 'de nacre', c: '#f7f1e8', line: '#857a6a', draw: 'perle' },
  lecon1: { mat: 'de jade', c: '#7cc79a', line: '#2e6b45', draw: 'jade' },
  s3: { mat: 'de bronze', c: '#ad8340', line: '#53380f', draw: 'bronze' },
  s5: { mat: 'd’argent', c: '#a9b4c2', line: '#47505c', draw: 'argent' },
  s10: { mat: 'd’or', c: '#f2b01e', line: '#6e4400', draw: 'or' },
  s26: { mat: 'de platine', c: '#d6dce8', line: '#5d6880', draw: 'platine' },
  s52: { mat: 'de diamant', c: '#9fe3f5', line: '#2b6f86', draw: 'diamant' },
  cap: { mat: 'd’émeraude', c: '#13a060', line: '#0b4d2f', draw: 'emeraude' },
  cap2: { mat: 'de péridot', c: '#a5cf2e', line: '#4d6610', draw: 'peridot' },
  bourse: { mat: 'de rubis', c: '#e0294f', line: '#6e0f24', draw: 'rubis' },
  de1: { mat: 'de saphir', c: '#2f63d8', line: '#132e6e', draw: 'saphir' },
  chance: { mat: 'd’opale', c: '#eef4f8', line: '#5b6f85', draw: 'opale' },
  calme: { mat: 'de lapis-lazuli', c: '#2b45a8', line: '#121f52', draw: 'lapis' },
  de10: { mat: 'de météorite', c: '#5d5866', line: '#25222b', draw: 'meteorite' },
  gain1: { mat: 'de cuivre', c: '#d0643a', line: '#5e2410', draw: 'cuivre' },
  projet: { mat: 'd’améthyste', c: '#9a5ce0', line: '#44206e', draw: 'amethyste' },
  savant: { mat: 'de turquoise', c: '#20bcc6', line: '#0c5a60', draw: 'turquoise' },
  s2: { mat: 'de citrine', c: '#ffd83b', line: '#7a5f00', draw: 'citrine' },
  s15: { mat: 'de grenat', c: '#a81d3f', line: '#4a0817', draw: 'grenat' },
  s78: { mat: 'de pierre de soleil', c: '#ff9a3c', line: '#8a3d00', draw: 'soleil' },
  s104: { mat: 'd’ammonite', c: '#dcbc8c', line: '#5e4220', draw: 'ammonite' },
  p10: { mat: 'de pyrite', c: '#c9b04a', line: '#5a4a10', draw: 'pyrite' },
  p25: { mat: 'd’aigue-marine', c: '#7fd6d9', line: '#1f6a70', draw: 'aigue' },
  p50: { mat: 'de topaze', c: '#f28a5a', line: '#7a321a', draw: 'topaze' },
  tout: { mat: 'd’agate', c: '#5b8fd6', line: '#23406e', draw: 'agate' },
  bonus10: { mat: 'de corail', c: '#ff6f61', line: '#8a2a20', draw: 'corail' },
  recu5: { mat: 'de rose des sables', c: '#e3b98a', line: '#7a5230', draw: 'rose' },
  cap3: { mat: 'd’œil-de-tigre', c: '#b5781f', line: '#4a2c06', draw: 'tigre' },
  cap4: { mat: 'de fluorite', c: '#b48cf0', line: '#3b2a6b', draw: 'fluorite' },
  cap5: { mat: 'de tanzanite', c: '#5b4fd6', line: '#241a6b', draw: 'tanzanite' },
  style: { mat: 'de labradorite', c: '#4d5866', line: '#1d232b', draw: 'labradorite' },
  six: { mat: 'de tourmaline', c: '#f27aa0', line: '#5a2030', draw: 'tourmaline' },
  trois: { mat: 'de pierre de lune', c: '#eef2fa', line: '#5a6a8a', draw: 'lune' },
  de25: { mat: 'd’obsidienne', c: '#3a3544', line: '#0d0b10', draw: 'obsidienne' },
  gain10: { mat: 'de malachite', c: '#2fa36b', line: '#0f4a2e', draw: 'malachite' },
  lecon3: { mat: 'de glace', c: '#bfe9ff', line: '#2f7fb0', draw: 'glace' },
  collec: { mat: 'arc-en-ciel', c: '#9b6bff', line: '#3a2a5a', draw: 'arcenciel' },
};
// ——— Pépites 41 à 100 : saisons, mois complets et grands paliers ———
const blob = (circles, fill, line, w = 3) => circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${line}" stroke-width="${w * 2}"/>`).join('') + circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
const thick = (d, c, line, w = 6) => `<path d="${d}" stroke="${line}" stroke-width="${w + 4.5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const star = (cx, cy, R, r, n = 5, a0 = -Math.PI / 2) => Array.from({ length: n * 2 }, (_, i) => { const a = a0 + i * Math.PI / n, k = i % 2 ? r : R; return [+(cx + k * Math.cos(a)).toFixed(2), +(cy + k * Math.sin(a)).toFixed(2)]; });
const cubeAt = (x, y, s, c, L) => { const h = s * 0.5; return poly([[x, y - h], [x + s, y], [x, y + h], [x - s, y]], tone(c, 0.3), L) + poly([[x - s, y], [x, y + h], [x, y + h + s], [x - s, y + s]], tone(c, -0.05), L) + poly([[x, y + h], [x + s, y], [x + s, y + s], [x, y + h + s]], tone(c, -0.22), L); };

const D2 = {
  // Saisons
  disco(c, L) { // boule à facettes du Nouvel An
    const rows = [16, 22, 28, 34, 40, 46, 52], tiles = [];
    rows.forEach((y, j) => { const half = Math.sqrt(Math.max(0, 21 * 21 - (y + 3 - 34) ** 2)); for (let x = 32 - half; x < 32 + half - 5; x += 6) tiles.push(`<rect x="${(x + 0.6).toFixed(1)}" y="${y + 0.6}" width="4.8" height="4.8" rx="1" fill="${tone(c, ((x * 7 + j * 13) % 5) / 5 - 0.35)}"/>`); });
    return `<path d="M32 6V12" stroke="${L}" stroke-width="2"/><circle cx="32" cy="34" r="21" fill="${tone(c, -0.3)}"/>${tiles.join('')}<circle cx="32" cy="34" r="21" fill="none" stroke="${L}" stroke-width="3"/>` + spark(24, 25, 4, '#fff', L) + spark(53, 14, 3.4, '#ffd93b', L) + spark(10, 50, 3, '#ff8fc7', L);
  },
  galette(c, L) { // galette des rois avec sa couronne
    const grid = [-10, 0, 10].map(o => `M${24 + o} 33L${34 + o} 45M${40 - o} 33L${30 - o} 45`).join('');
    return `<ellipse cx="32" cy="44" rx="25" ry="12" fill="${tone(c, -0.3)}" stroke="${L}" stroke-width="3"/><ellipse cx="32" cy="39" rx="25" ry="12" fill="${c}" stroke="${L}" stroke-width="3"/><path d="${grid}" stroke="${tone(c, -0.25)}" stroke-width="1.4" opacity=".8"/>` + poly([[22, 28], [21, 14], [27, 20], [32, 11], [37, 20], [43, 14], [42, 28]], '#ffd24a', '#6e4400', 2) + `<circle cx="32" cy="22" r="2" fill="#e0294f"/>` + shine('M14 36Q18 31 26 29', 2.2);
  },
  crepe(c, L) { // crêpe pliée en quatre et sucrée
    const d = 'M12 54V14A40 40 0 0 1 52 54Z';
    return `<path d="${d}" fill="${c}"/><path d="M12 54L46 22" stroke="${tone(c, -0.18)}" stroke-width="2" fill="none"/>${[[22, 26, 2.4], [36, 32, 3], [24, 42, 2], [40, 46, 2.6], [30, 20, 1.6], [18, 36, 1.8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${tone(c, -0.25)}"/>`).join('')}${[[28, 30], [33, 40], [20, 47], [42, 40], [26, 24], [37, 50]].map(([x, y]) => `<rect x="${x}" y="${y}" width="2" height="2" fill="#fff" transform="rotate(30 ${x} ${y})"/>`).join('')}<path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M16 20Q22 18 28 19.5', 2.2);
  },
  neige(c, L) { // boule de neige
    const b = [[32, 35, 19], [20, 30, 7], [44, 28, 7], [26, 48, 7], [42, 47, 7], [32, 18, 6], [14, 40, 5], [50, 38, 6]];
    return blob(b, c, L, 1.6) + `<path d="M46 40A16 16 0 0 1 24 50" stroke="${tone(c, -0.18)}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>` + shine('M22 27Q25 23 30 22') + spark(55, 15, 3.6, '#fff', L);
  },
  beignet(c, L) { // beignet glacé de Mardi gras
    const ice = 'M32 15C40 14 50 19 51 28C54 33 50 38 51 44C47 51 38 53 32 52C25 54 17 50 14 44C11 38 14 33 13 28C15 20 24 15 32 15ZM32 28A6.5 6.5 0 1 0 32.1 28Z';
    const spr = [[24, 22, 20], [40, 21, -30], [46, 34, 60], [20, 38, -50], [27, 46, 10], [40, 46, 80], [17, 28, 40]].map(([x, y, r], i) => `<rect x="${x}" y="${y}" width="5" height="1.8" rx=".9" fill="${['#ffd93b', '#4d96ff', '#6bcb77', '#fff', '#ff6b6b', '#9b6bff', '#ffd93b'][i]}" transform="rotate(${r} ${x} ${y})"/>`).join('');
    return `<path d="M32 13A22 22 0 1 1 31.9 13ZM32 28A6.5 6.5 0 1 0 32.1 28Z" fill="#e2a35a" fill-rule="evenodd" stroke="${L}" stroke-width="3"/><path d="${ice}" fill="${c}" fill-rule="evenodd" stroke="${L}" stroke-width="1.6"/>${spr}` + shine('M19 25Q22 20 27 18');
  },
  miel(c, L) { // alvéoles de miel avec une goutte
    const hex = (x, y) => ell(x, y, 10, 10, 6, 0);
    return [[22, 26], [41, 26], [31.5, 42.5]].map(([x, y], i) => poly(hex(x, y), tone(c, [0.1, -0.05, -0.15][i]), L, 2.4) + poly(ell(x, y, 6, 6, 6, 0), tone(c, 0.35), tone(c, -0.3), 1)).join('') + `<path d="M43 35Q46 42 46 47A3.4 3.4 0 0 1 39.2 47Q39.5 42 43 35Z" fill="${c}" stroke="${L}" stroke-width="2"/>` + shine('M17 23 19 20', 2.2);
  },
  fleur(c, L) { // fleur de printemps
    const pet = [0, 1, 2, 3, 4].map(i => { const a = i * 72 - 90; return `<ellipse cx="32" cy="22" rx="8" ry="12" transform="rotate(${a + 90} 32 34)" fill="${tone(c, i % 2 ? 0.15 : 0)}" stroke="${L}" stroke-width="2.4"/>`; }).join('');
    return pet + `<circle cx="32" cy="34" r="7.5" fill="#ffd24a" stroke="${L}" stroke-width="2.4"/><circle cx="30" cy="32" r="1.3" fill="#c98a00"/><circle cx="34" cy="35" r="1.3" fill="#c98a00"/>` + shine('M27 16Q29 13 32 13', 2);
  },
  poisson(c, L) { // poisson d'avril
    const d = 'M8 34Q20 16 38 20Q48 23 54 34Q48 45 38 48Q20 52 8 34Z';
    return poly([[50, 34], [60, 22], [58, 34], [60, 46]], tone(c, -0.15), L, 2.4) + `<path d="${d}" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>${[[26, 30], [32, 36], [26, 42], [38, 30], [38, 42], [44, 36]].map(([x, y]) => `<path d="M${x - 3} ${y - 3}Q${x + 2} ${y} ${x - 3} ${y + 3}" stroke="${tone(c, -0.25)}" stroke-width="1.4" fill="none"/>`).join('')}<circle cx="17" cy="31" r="3.2" fill="#fff" stroke="${L}" stroke-width="1.4"/><circle cx="17.6" cy="31" r="1.5" fill="${L}"/><path d="M28 21Q32 14 40 16" stroke="${L}" stroke-width="2" fill="${tone(c, -0.1)}"/>` + shine('M20 25Q24 22 29 21.5', 2.2);
  },
  cloche(c, L) { // cloche de Pâques en chocolat
    const d = 'M18 46Q18 22 32 18Q46 22 46 46L52 50L12 50Z';
    return `<circle cx="32" cy="53" r="4" fill="${tone(c, -0.2)}" stroke="${L}" stroke-width="2.4"/><path d="${d}" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M16 44H48" stroke="${tone(c, -0.25)}" stroke-width="2"/><path d="M19 38H45" stroke="#ff8fb8" stroke-width="4"/><path d="M32 18Q24 8 21 14Q22 19 32 18Q42 19 43 14Q40 8 32 18Z" fill="#ff6b8b" stroke="${L}" stroke-width="2"/>` + shine('M23 40Q22 30 26 25', 2.4);
  },
  muguet(c, L) { // brin de muguet
    const bell = (x, y) => `<path d="M${x - 5} ${y}Q${x - 5} ${y - 7} ${x} ${y - 7}Q${x + 5} ${y - 7} ${x + 5} ${y}Q${x + 3} ${y + 2} ${x + 2} ${y}Q${x} ${y + 2.5} ${x - 2} ${y}Q${x - 3} ${y + 2} ${x - 5} ${y}Z" fill="#fff" stroke="${L}" stroke-width="2"/>`;
    return `<path d="M44 58Q50 30 30 16Q46 26 44 58Z" fill="${tone(c, 0.15)}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>` + thick('M24 56Q24 30 36 14', c, L, 2.6) + [[30, 24], [21, 30], [32, 36], [20, 42], [30, 47]].map(([x, y]) => `<path d="M${x} ${y - 7}Q${x + 3} ${y - 10} ${(x < 26 ? 25 : 28)} ${y - 9}" stroke="${L}" stroke-width="1.6" fill="none"/>` + bell(x, y)).join('');
  },
  rose(c, L) { // rose de la fête des mères
    return `<path d="M32 50Q18 54 12 46Q20 44 26 48Z" fill="#4caf50" stroke="${L}" stroke-width="2"/><path d="M32 50Q46 54 52 46Q44 44 38 48Z" fill="#4caf50" stroke="${L}" stroke-width="2"/><path d="M14 30Q12 14 32 14Q52 14 50 30Q48 48 32 50Q16 48 14 30Z" fill="${c}" stroke="${L}" stroke-width="3"/><path d="M32 22Q42 22 41 31Q39 39 31 39Q24 38 24 31Q25 26 31 27Q36 28 35 32" stroke="${tone(c, -0.3)}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M18 26Q22 18 30 18M46 28Q46 38 38 44" stroke="${tone(c, -0.25)}" stroke-width="1.8" fill="none"/>` + shine('M19 24Q21 20 25 18.5', 2.2);
  },
  cravate(c, L) { // cravate de la fête des pères
    const body = [[27, 22], [37, 22], [44, 48], [32, 58], [20, 48]];
    return `<path d="M${pts(body)}Z" fill="${c}"/><path d="M24 30L40 38M22 40L42 50M30 23L38 27" stroke="${tone(c, 0.35)}" stroke-width="3" opacity=".8"/>` + edge(body, L) + poly([[25, 11], [39, 11], [37, 22], [27, 22]], tone(c, -0.15), L, 2.4) + shine('M29 14 33 14', 2);
  },
  notes(c, L) { // notes de musique
    return `<path d="M24 46V18L48 12V40" stroke="${L}" stroke-width="5.4" fill="none" stroke-linejoin="round"/><path d="M24 18L48 12V19L24 25Z" fill="${c}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><path d="M24 46V22M48 40V16" stroke="${c}" stroke-width="2"/><ellipse cx="18" cy="47" rx="8" ry="6" transform="rotate(-20 18 47)" fill="${c}" stroke="${L}" stroke-width="2.6"/><ellipse cx="42" cy="41" rx="8" ry="6" transform="rotate(-20 42 41)" fill="${c}" stroke="${L}" stroke-width="2.6"/>` + shine('M14 45Q16 42 20 42', 2) + shine('M38 39Q40 36 44 36', 2) + spark(10, 20, 3.4, '#ffd93b', L) + spark(56, 52, 3, '#ff8fc7', L);
  },
  feuartifice(c, L) { // feu d'artifice bleu, blanc, rouge
    const col = ['#3b6fe0', '#ffffff', '#e0294f'];
    return Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, x1 = 32 + 8 * Math.cos(a), y1 = 34 + 8 * Math.sin(a), x2 = 32 + 21 * Math.cos(a), y2 = 34 + 21 * Math.sin(a); return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${L}" stroke-width="5.5" stroke-linecap="round"/><path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${col[i % 3]}" stroke-width="2.6" stroke-linecap="round"/><circle cx="${(32 + 25 * Math.cos(a)).toFixed(1)}" cy="${(34 + 25 * Math.sin(a)).toFixed(1)}" r="1.8" fill="${col[(i + 1) % 3]}" stroke="${L}" stroke-width=".8"/>`; }).join('') + poly(star(32, 34, 7, 3), '#ffd93b', L, 1.6);
  },
  coquillage(c, L) { // coquille Saint-Jacques
    const d = 'M32 52L11 31Q11 13 32 12Q53 13 53 31Z';
    const ribs = [-16, -9, -3, 3, 9, 16].map(o => `M32 52L${32 + o * 1.2} 14`).join('');
    return poly([[24, 50], [32, 52], [40, 50], [38, 57], [26, 57]], tone(c, -0.15), L, 2.4) + `<path d="${d}" fill="${c}"/><path d="${ribs}" stroke="${tone(c, -0.25)}" stroke-width="1.6"/><path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M15 28Q17 19 24 16', 2.2);
  },
  crayon(c, L) { // crayon de la rentrée
    return `<g transform="rotate(-38 32 34)">${poly([[14, 28], [44, 28], [44, 40], [14, 40]], c, L, 2.4)}<path d="M14 32H44" stroke="${tone(c, 0.35)}" stroke-width="2.4"/><path d="M14 37H44" stroke="${tone(c, -0.2)}" stroke-width="2"/>${poly([[44, 28], [56, 34], [44, 40]], '#f2c99a', L, 2.4)}${poly([[52, 32], [56, 34], [52, 36]], '#3a3036', L, 1.4)}${poly([[8, 28], [14, 28], [14, 40], [8, 40]], '#b8bcc4', L, 2.4)}<path d="M4 30Q4 28 6 28H8V40H6Q4 40 4 38Z" fill="#ff8fb8" stroke="${L}" stroke-width="2.4"/>${edge([[4, 28], [44, 28], [56, 34], [44, 40], [4, 40]], L)}</g>`;
  },
  erable(c, L) { // feuille d'automne
    const R = [[32, 8], [36, 19], [42, 15], [41, 26], [51, 22], [47, 31], [57, 33], [47, 39], [49, 46], [38, 43], [34, 50]];
    const o = [...R, ...R.slice(1).reverse().map(([x, y]) => [64 - x, y])];
    return `<path d="M32 49V59" stroke="${L}" stroke-width="3" stroke-linecap="round"/><path d="M${pts(o)}Z" fill="${c}" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/><path d="M32 48V18M32 38L44 26M32 38L20 26M32 44L45 37M32 44L19 37" stroke="${tone(c, -0.28)}" stroke-width="1.5" fill="none"/>` + shine('M24 22 27 26', 2);
  },
  ecu(c, L) { // pièce d'or : résiste au Black Friday
    return `<ellipse cx="32" cy="38" rx="22" ry="20" fill="${tone(c, -0.35)}" stroke="${L}" stroke-width="3"/><ellipse cx="32" cy="33" rx="22" ry="20" fill="${c}" stroke="${L}" stroke-width="3"/><ellipse cx="32" cy="33" rx="16" ry="14.5" fill="none" stroke="${tone(c, -0.25)}" stroke-width="2"/><text x="32" y="41" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="22" fill="${tone(c, -0.4)}">€</text>` + shine('M16 27Q19 20 26 17') + spark(54, 14, 4, '#fff', L);
  },
  citrouille(c, L) { // citrouille d'Halloween
    return `<path d="M32 18Q31 12 36 9" stroke="#4d7a2a" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="37" rx="12" ry="17" fill="${tone(c, -0.12)}" stroke="${L}" stroke-width="2.6"/><ellipse cx="44" cy="37" rx="12" ry="17" fill="${tone(c, -0.12)}" stroke="${L}" stroke-width="2.6"/><ellipse cx="32" cy="37" rx="12" ry="18" fill="${c}" stroke="${L}" stroke-width="2.6"/>` + poly([[22, 33], [27, 28], [29, 34]], '#3a2410', L, 1) + poly([[42, 33], [37, 28], [35, 34]], '#3a2410', L, 1) + `<path d="M21 41Q32 50 43 41Q38 44 36 43L34 46L32 43L29 46L27 43Q24 44 21 41Z" fill="#3a2410"/>` + shine('M26 25Q28 21 31 20', 2);
  },
  painepice(c, L) { // bonhomme en pain d'épices
    const d = 'M32 9A7.5 7.5 0 0 1 38 21L49 23A4 4 0 0 1 48 31L40 31L44 52A4.5 4.5 0 0 1 36 55L32 45L28 55A4.5 4.5 0 0 1 20 52L24 31L16 31A4 4 0 0 1 15 23L26 21A7.5 7.5 0 0 1 32 9Z';
    return `<path d="${d}" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><circle cx="29.5" cy="15" r="1.3" fill="${L}"/><circle cx="34.5" cy="15" r="1.3" fill="${L}"/><path d="M29.5 18Q32 20 34.5 18M18 25.5Q19 27 18 28.5M46 25.5Q45 27 46 28.5M23 50.5Q24.5 49 26 50.5M38 50.5Q39.5 49 41 50.5" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="32" cy="29" r="1.8" fill="#e0294f"/><circle cx="32" cy="36" r="1.8" fill="#3fae5c"/>`;
  },
  sucreorge(c, L) { // sucre d'orge de Noël
    const d = 'M26 56V24A8 8 0 0 1 42 24V27';
    return `<path d="${d}" stroke="${L}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="8" fill="none" stroke-dasharray="4 5"/><path d="M23.5 50V25" stroke="#fff" stroke-width="1.6" opacity=".9"/>` + `<path d="M42 28Q50 26 52 32Q46 34 42 28Z" fill="#3fae5c" stroke="${L}" stroke-width="1.8"/><circle cx="44" cy="32" r="2.4" fill="#e0294f" stroke="${L}" stroke-width="1.2"/>`;
  },
  gateau(c, L) { // petit gâteau d'anniversaire
    return `<path d="M32 9Q36 14 32 17Q28 14 32 9Z" fill="#ffb02e" stroke="${L}" stroke-width="1.4"/><rect x="30" y="17" width="4" height="10" fill="#4d96ff" stroke="${L}" stroke-width="1.6"/>` + poly([[15, 38], [49, 38], [45, 57], [19, 57]], '#f2c99a', L, 2.6) + `<path d="M24 39L26 57M32 39V57M40 39L38 57" stroke="${L}" stroke-width="1.2" opacity=".5"/><path d="M13 39Q11 31 18 30Q20 24 27 26Q32 22 37 26Q44 24 46 30Q53 31 51 39Z" fill="${c}" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/>${[[22, 33], [30, 30], [38, 33], [44, 35], [26, 36]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${['#ffd93b', '#4d96ff', '#6bcb77', '#fff', '#9b6bff'][i]}"/>`).join('')}` + shine('M18 33Q20 31 23 30.5', 1.8);
  },
  // Mois complets
  givre(c, L) { // stalactites de givre
    return poly([[10, 22], [16, 22], [13, 46]], tone(c, 0.2), L, 2.2) + poly([[18, 22], [28, 22], [23, 57]], tone(c, 0), L, 2.2) + poly([[30, 22], [38, 22], [34, 48]], tone(c, 0.15), L, 2.2) + poly([[40, 22], [50, 22], [45, 54]], tone(c, -0.1), L, 2.2) + `<rect x="7" y="13" width="50" height="10" rx="5" fill="#fff" stroke="${L}" stroke-width="2.6"/>` + shine('M21 27 22 38', 1.8) + shine('M42 27 43 36', 1.8) + spark(55, 36, 3.2, '#fff', L);
  },
  sucre(c, L) { // deux morceaux de sucre
    return cubeAt(22, 34, 12, c, L) + cubeAt(42, 26, 11, c, L) + [[20, 42], [16, 37], [24, 47], [40, 34], [46, 30], [37, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="${tone(c, -0.3)}"/>`).join('') + spark(54, 47, 3, '#fff', L);
  },
  rosee(c, L) { // goutte de rosée
    const d = 'M32 9C40 22 50 31 50 41A18 18 0 0 1 14 41C14 31 24 22 32 9Z';
    return `<path d="${d}" fill="${c}"/><path d="M50 41A18 18 0 0 1 14 41Q22 52 36 50Q47 48 50 41Z" fill="${tone(c, -0.2)}"/><path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M21 40Q21 32 27 25') + `<circle cx="22" cy="46" r="1.8" fill="#fff"/>`;
  },
  nuage(c, L) { // nuage et giboulées d'avril
    return [[20, 50], [32, 54], [44, 50]].map(([x, y]) => `<path d="M${x} ${y - 6}Q${x + 3} ${y - 1} ${x} ${y + 1}Q${x - 3} ${y - 1} ${x} ${y - 6}Z" fill="#4d96ff" stroke="${L}" stroke-width="1.4"/>`).join('') + blob([[20, 34, 9], [32, 28, 12], [44, 33, 9], [32, 37, 8], [24, 38, 7], [40, 38, 7]], c, L, 1.5) + shine('M25 24Q28 20 32 19.5', 2.2);
  },
  cerise(c, L) { // deux cerises
    return `<path d="M22 40Q26 24 38 12M44 42Q42 26 38 12" stroke="#5a7a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M38 13Q48 8 54 14Q46 20 38 13Z" fill="#4caf50" stroke="${L}" stroke-width="1.8"/><circle cx="21" cy="45" r="10" fill="${c}" stroke="${L}" stroke-width="2.8"/><circle cx="44" cy="46" r="10" fill="${tone(c, -0.08)}" stroke="${L}" stroke-width="2.8"/>` + shine('M16 42Q17 39 20 38', 2.2) + shine('M39 43Q40 40 43 39', 2.2);
  },
  fraise(c, L) { // fraise de juin
    const d = 'M14 26Q32 18 50 26Q52 42 32 57Q12 42 14 26Z';
    return `<path d="${d}" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>${[[22, 31], [32, 29], [42, 31], [26, 39], [38, 39], [32, 46], [20, 36], [44, 36]].map(([x, y]) => `<path d="M${x} ${y}l1 2.2" stroke="#ffe08a" stroke-width="1.6" stroke-linecap="round"/>`).join('')}` + poly([[32, 26], [22, 16], [28, 23], [32, 13], [36, 23], [42, 16]], '#4caf50', L, 2) + shine('M18 30Q20 27 23 26.5', 2);
  },
  sorbet(c, L) { // glace à l'eau de juillet
    return `<rect x="29" y="40" width="6" height="18" rx="3" fill="#e8c38f" stroke="${L}" stroke-width="2.4"/><path d="M18 44V22A14 14 0 0 1 46 22V44Q43 47 40 44Q37 48 34 44Q31 48 28 44Q25 48 22 44Q20 46 18 44Z" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M18 30Q32 26 46 30V36Q32 32 18 36Z" fill="#ffd45c" opacity=".9"/>` + shine('M22 28V21Q23 15 28 13', 2.4);
  },
  sablier(c, L) { // sablier du mois d'août
    return `<path d="M18 16H46Q46 30 34 34Q46 38 46 52H18Q18 38 30 34Q18 30 18 16Z" fill="#e9f6ff" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/><path d="M24 22H40Q38 28 32 31Q26 28 24 22ZM21 50Q22 42 32 40Q42 42 43 50Z" fill="${c}"/><path d="M32 31V40" stroke="${c}" stroke-width="1.6"/>` + `<rect x="12" y="10" width="40" height="7" rx="3" fill="#a0623a" stroke="${L}" stroke-width="2.4"/><rect x="12" y="51" width="40" height="7" rx="3" fill="#a0623a" stroke="${L}" stroke-width="2.4"/>` + shine('M22 20Q22 26 26 29', 1.8);
  },
  raisin(c, L) { // grappe de raisin des vendanges
    return `<path d="M31 19Q31 13 36 9" stroke="#6b4a2a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M34 15Q44 7 52 13Q44 21 34 15Z" fill="#6bb04a" stroke="${L}" stroke-width="1.8"/>` + [[19, 24], [31, 24], [43, 24], [25, 34], [37, 34], [31, 44], [31, 53]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="6.4" fill="${tone(c, (i % 3) * 0.07 - 0.05)}" stroke="${L}" stroke-width="2"/><circle cx="${x - 2}" cy="${y - 2}" r="1.4" fill="#fff" opacity=".85"/>`).join('');
  },
  chataigne(c, L) { // châtaigne dans sa bogue
    const spikes = Array.from({ length: 16 }, (_, i) => { const a = Math.PI + i * Math.PI / 15, x = 32 + 20 * Math.cos(a), y = 40 + 18 * Math.sin(a); return `M${x.toFixed(1)} ${y.toFixed(1)}L${(32 + 26 * Math.cos(a)).toFixed(1)} ${(40 + 24 * Math.sin(a)).toFixed(1)}`; }).join('');
    return `<path d="${spikes}" stroke="#6b8a2a" stroke-width="2" stroke-linecap="round"/><path d="M12 40A20 18 0 0 1 52 40Q52 50 32 52Q12 50 12 40Z" fill="#9cc25a" stroke="${L}" stroke-width="2.6"/><path d="M20 42Q20 26 32 22Q44 26 44 42Q38 49 32 49Q26 49 20 42Z" fill="${c}" stroke="${L}" stroke-width="2.6"/><path d="M21 42Q32 48 43 42Q38 50 32 50Q26 50 21 42Z" fill="#e8d2a8" stroke="${L}" stroke-width="1.6"/><path d="M32 22L32 18" stroke="${L}" stroke-width="2"/>` + shine('M25 36Q25 29 30 26', 2.2);
  },
  champignon(c, L) { // cèpe de novembre
    return `<path d="M25 36Q22 50 26 56H38Q42 50 39 36Z" fill="#f2e2c4" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/><path d="M9 36Q10 14 32 13Q54 14 55 36Q44 40 32 39Q20 40 9 36Z" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M11 35Q32 42 53 35" stroke="${tone(c, -0.3)}" stroke-width="2" fill="none"/>` + shine('M17 27Q20 19 28 17') + `<path d="M28 44Q27 50 29 54" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/>`;
  },
  houx(c, L) { // feuilles de houx et baies
    const leaf = 'M8 30Q12 26 12 22Q16 25 20 22Q21 27 26 27Q24 31 28 34Q22 35 22 40Q17 37 14 40Q14 34 8 30Z';
    return `<path d="${leaf}" fill="${c}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round" transform="translate(2 4)"/><path d="${leaf}" fill="${tone(c, -0.1)}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round" transform="translate(64 2) scale(-1 1) rotate(-10 18 30)"/><path d="M14 32L28 37M50 30L37 36" stroke="${tone(c, 0.3)}" stroke-width="1.4"/>${[[28, 44], [37, 44], [32.5, 51]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.6" fill="#e0294f" stroke="${L}" stroke-width="2.2"/><circle cx="${x - 1.8}" cy="${y - 1.8}" r="1.3" fill="#fff"/>`).join('')}`;
  },
  // Grands paliers
  quartzfume(c, L) { // cristal à deux pointes
    const o = [[6, 34], [16, 25], [48, 25], [58, 34], [48, 43], [16, 43]];
    return `<g transform="rotate(-24 32 34)">${poly([[16, 25], [48, 25], [44, 33], [20, 33]], tone(c, 0.35), L)}${poly([[20, 33], [44, 33], [48, 43], [16, 43]], tone(c, -0.15), L)}${poly([[6, 34], [16, 25], [20, 33]], tone(c, 0.5), L)}${poly([[6, 34], [20, 33], [16, 43]], tone(c, 0.05), L)}${poly([[58, 34], [48, 25], [44, 33]], tone(c, 0.1), L)}${poly([[58, 34], [44, 33], [48, 43]], tone(c, -0.35), L)}${edge(o, L)}${shine('M20 29 36 29', 2.2, 0.9)}</g>`;
  },
  jaspe(c, L) { // galet de jaspe tacheté
    return `<rect x="10" y="17" width="44" height="36" rx="13" transform="rotate(-10 32 35)" fill="${c}"/>${[[22, 30, 4], [38, 26, 3], [42, 42, 5], [26, 44, 3], [33, 36, 2.4], [18, 40, 2]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="${tone(c, -0.3)}"/>`).join('')}<rect x="10" y="17" width="44" height="36" rx="13" transform="rotate(-10 32 35)" fill="none" stroke="${L}" stroke-width="3"/>` + shine('M16 26Q18 21 24 19.5');
  },
  spinelle(c, L) { // taille hexagonale
    const o = ell(32, 34, 24, 23, 6, 0), i = ell(32, 34, 12, 11.5, 6, 0);
    return fan(o, 32, 34, c, L) + poly(i, tone(c, 0.3), L) + edge(o, L) + shine('M15 24 20 18') + spark(36, 30, 3.4, tone(c, 0.85), L);
  },
  hematite(c, L) { // taille étoile
    const o = star(32, 35, 25, 11);
    return fan(o, 32, 35, c, L) + edge(o, L) + shine('M24 26 28 21', 2.2) + spark(32, 35, 3.6, '#fff', L);
  },
  zircon(c, L) { // taille écusson
    const o = [[11, 14], [53, 14], [53, 32], [32, 57], [11, 32]];
    return fan(o, 32, 30, c, L) + poly([[20, 21], [44, 21], [44, 31], [32, 45], [20, 31]], tone(c, 0.3), L) + edge(o, L) + shine('M15 26 15 19', 2.4) + spark(50, 50, 3.4, '#fff', L);
  },
  bague(c, L) { // bague en or blanc
    return `<ellipse cx="32" cy="40" rx="18" ry="15" fill="none" stroke="${L}" stroke-width="10"/><ellipse cx="32" cy="40" rx="18" ry="15" fill="none" stroke="${c}" stroke-width="5.4"/><path d="M17 36Q20 29 27 27" stroke="#fff" stroke-width="1.8" fill="none"/>` + poly([[24, 24], [28, 18], [36, 18], [40, 24], [32, 32]], '#bfeaff', L, 2.2) + poly([[24, 24], [40, 24], [32, 32]], '#8fd3f5', L, 1.2) + spark(46, 13, 4, '#fff', L);
  },
  alexandrite(c, L) { // taille demi-lune, verte et violette
    const o = [[8, 44], ...Array.from({ length: 9 }, (_, i) => { const a = Math.PI + (i + 1) * Math.PI / 10; return [+(32 + 24 * Math.cos(a)).toFixed(1), +(44 + 26 * Math.sin(a)).toFixed(1)]; }), [56, 44]];
    return o.slice(0, -1).map((p, i) => poly([p, o[i + 1], [32, 44]], i < 5 ? tone(c, 0.3 - i * 0.06) : tone('#8a4fd6', 0.1 - (i - 5) * 0.08), L)).join('') + poly([[8, 44], [56, 44], [32, 54]], tone(c, -0.3), L) + edge([...o, [32, 54]], L) + shine('M14 36 18 29');
  },
  princesse(c, L) { // diamant rose, taille princesse
    const o = [[10, 12], [54, 12], [54, 56], [10, 56]];
    return poly([[10, 12], [54, 12], [32, 34]], tone(c, 0.45), L) + poly([[54, 12], [54, 56], [32, 34]], tone(c, -0.1), L) + poly([[54, 56], [10, 56], [32, 34]], tone(c, -0.3), L) + poly([[10, 56], [10, 12], [32, 34]], tone(c, 0.2), L) + poly([[22, 24], [42, 24], [42, 44], [22, 44]], tone(c, 0.25), L) + `<path d="M22 24L42 44M42 24L22 44" stroke="${L}" stroke-width="1"/>` + edge(o, L) + shine('M15 22 20 17') + spark(56, 10, 4, '#fff', L);
  },
  cairn(c, L) { // galets empilés
    return [[32, 50, 20, 6.5, 0], [31, 39, 15, 5.5, -0.06], [33, 29.5, 11, 4.8, 0.1], [32, 21, 7, 4, 0.22]].map(([x, y, rx, ry, t]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${tone(c, t)}" stroke="${L}" stroke-width="2.6"/><path d="M${x - rx * 0.6} ${y - ry * 0.3}Q${x - rx * 0.2} ${y - ry * 0.8} ${x + rx * 0.2} ${y - ry * 0.75}" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/>`).join('');
  },
  tetra(c, L) { // cristal pyramide
    return poly([[32, 9], [8, 52], [36, 57]], tone(c, 0.3), L) + poly([[32, 9], [36, 57], [56, 46]], tone(c, -0.15), L) + edge([[32, 9], [56, 46], [36, 57], [8, 52]], L) + shine('M27 20 18 38', 2.4, 0.9) + spark(50, 18, 4, '#fff', L) + spark(14, 20, 2.8, '#fff', L);
  },
  lingots(c, L) { // pile de lingots d'or
    const bar = (x, y) => poly([[x - 9, y], [x + 9, y], [x + 12, y + 9], [x - 12, y + 9]], tone(c, -0.1), L, 2.2) + poly([[x - 7, y - 4], [x + 7, y - 4], [x + 9, y], [x - 9, y]], tone(c, 0.4), L, 1.8);
    return bar(19, 46) + bar(45, 46) + bar(32, 33) + bar(32, 20) + shine('M26 24 30 24', 1.8) + spark(52, 16, 4, '#fff8d6', L);
  },
  cadeau(c, L) { // paquet cadeau
    return poly([[12, 30], [52, 30], [52, 56], [12, 56]], c, L, 2.6) + poly([[9, 22], [55, 22], [55, 31], [9, 31]], tone(c, 0.15), L, 2.6) + `<rect x="28" y="22" width="8" height="34" fill="#ffd24a" stroke="${L}" stroke-width="2"/><path d="M32 22Q20 8 16 16Q18 22 32 22Q46 22 48 16Q44 8 32 22Z" fill="#ffd24a" stroke="${L}" stroke-width="2.2"/>` + shine('M15 35V41', 2.2);
  },
  bourse(c, L) { // petite bourse en velours
    return `<path d="M20 22Q14 30 12 42Q11 56 32 56Q53 56 52 42Q50 30 44 22Z" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M18 22H46" stroke="${L}" stroke-width="2"/><path d="M20 22Q24 12 26 14Q29 18 32 12Q35 18 38 14Q40 12 44 22" fill="${tone(c, 0.15)}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><path d="M22 24Q32 28 42 24" stroke="#ffd24a" stroke-width="2.4" fill="none"/><circle cx="44" cy="26" r="2.4" fill="#ffd24a" stroke="${L}" stroke-width="1.2"/>` + `<ellipse cx="32" cy="42" rx="7" ry="7" fill="#ffd24a" stroke="${L}" stroke-width="2"/><text x="32" y="46" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="10" fill="#8a5a00">€</text>` + shine('M17 36Q18 30 21 27', 2.2);
  },
  d20(c, L) { // dé à vingt faces
    const o = ell(32, 34, 24, 24, 6, -Math.PI / 2), t = [[32, 22], [43, 41], [21, 41]];
    const f = [[o[0], o[1], t[0]], [o[1], t[1], t[0]], [o[1], o[2], t[1]], [o[2], o[3], t[1]], [o[3], t[2], t[1]], [o[3], o[4], t[2]], [o[4], o[5], t[2]], [o[5], t[0], t[2]], [o[5], o[0], t[0]]];
    return f.map((q, i) => poly(q, tone(c, [0.35, 0.1, -0.15, -0.3, -0.2, -0.05, 0.15, 0.2, 0.45][i]), L)).join('') + poly(t, tone(c, 0.2), L) + edge(o, L) + `<text x="32" y="39" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="10" fill="#fff">20</text>`;
  },
  basalte(c, L) { // orgues de basalte
    const col = (x, top, h, t) => { const hx = [[x - 7, top], [x - 3.5, top - 3], [x + 3.5, top - 3], [x + 7, top], [x + 3.5, top + 3], [x - 3.5, top + 3]]; return poly([[x - 7, top], [x - 3.5, top + 3], [x - 3.5, top + 3 + h], [x - 7, top + h]], tone(c, 0.05 + t), L, 1.8) + poly([[x - 3.5, top + 3], [x + 3.5, top + 3], [x + 3.5, top + 3 + h], [x - 3.5, top + 3 + h]], tone(c, -0.12 + t), L, 1.8) + poly([[x + 3.5, top + 3], [x + 7, top], [x + 7, top + h], [x + 3.5, top + 3 + h]], tone(c, -0.3 + t), L, 1.8) + poly(hx, tone(c, 0.35 + t), L, 1.8); };
    return col(18, 30, 24, 0) + col(46, 26, 28, 0) + col(32, 16, 38, 0.05);
  },
  pousse(c, L) { // jeune pousse qui sort des pièces
    return `<ellipse cx="32" cy="52" rx="20" ry="6" fill="#ffd24a" stroke="${L}" stroke-width="2.4"/><ellipse cx="32" cy="48" rx="20" ry="6" fill="#ffe68a" stroke="${L}" stroke-width="2.4"/>` + thick('M32 48V24', c, L, 3) + `<path d="M32 32Q18 32 14 18Q28 16 32 32Z" fill="${c}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><path d="M32 26Q42 26 50 12Q36 10 32 26Z" fill="${tone(c, 0.15)}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><path d="M30 30Q22 26 18 20M34 24Q40 20 46 14" stroke="${tone(c, 0.4)}" stroke-width="1.4" fill="none"/>`;
  },
  gland(c, L) { // gland de chêne
    return `<path d="M18 30Q18 50 32 56Q46 50 46 30Z" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M14 30Q14 17 32 16Q50 17 50 30Q40 34 32 33Q24 34 14 30Z" fill="#7a5230" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M20 24l4 3M27 21l4 3M35 21l4 3M42 24l4 3M23 28l3 2M38 28l3 2" stroke="#b5875a" stroke-width="1.6" stroke-linecap="round"/><path d="M32 16Q33 10 38 9" stroke="#7a5230" stroke-width="3" fill="none" stroke-linecap="round"/>` + shine('M23 38Q23 46 27 50', 2.4);
  },
  arbre(c, L) { // grand arbre
    return `<path d="M28 58L29 42H35L36 58Z" fill="#8a5a33" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>` + blob([[32, 24, 13], [20, 32, 10], [44, 32, 10], [32, 38, 10], [24, 18, 8], [41, 18, 8]], c, L, 1.5) + [[24, 26], [38, 22], [32, 34], [44, 34], [20, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${tone(c, 0.35)}"/>`).join('') + shine('M18 22Q21 15 27 13', 2.2);
  },
  eclair(c, L) { // éclair
    const o = [[36, 8], [16, 36], [30, 36], [24, 59], [48, 28], [34, 28], [42, 8]];
    return poly(o, c, L, 3) + poly([[36, 8], [42, 8], [34, 28], [30, 28]], tone(c, 0.4), L, 0.1) + edge(o, L) + spark(52, 44, 3.4, '#fff', L) + spark(12, 18, 3, '#fff', L);
  },
  brique(c, L) { // brique
    const top = [[8, 28], [36, 18], [58, 26], [30, 36]], f = [[8, 28], [30, 36], [30, 50], [8, 42]], r = [[30, 36], [58, 26], [58, 40], [30, 50]];
    return poly(f, tone(c, -0.05), L, 2.4) + poly(r, tone(c, -0.28), L, 2.4) + poly(top, tone(c, 0.2), L, 2.4) + [[23, 26], [33, 23], [43, 25.5], [27, 30], [37, 27.5]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="1.6" fill="${tone(c, -0.45)}"/>`).join('') + shine('M12 31 12 38', 2);
  },
  vitrail(c, L) { // rosace de vitrail
    const cols = ['#e0294f', '#2f63d8', '#ffd24a', '#3fae5c', '#9a5ce0', '#20bcc6', '#ff9a3c', '#2f63d8'];
    const seg = Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4, b = a + Math.PI / 4, p = (r, x) => [+(32 + r * Math.cos(x)).toFixed(1), +(34 + r * Math.sin(x)).toFixed(1)]; return poly([p(9, a), p(22, a), p(22, b), p(9, b)], cols[i], L, 1.6) + poly([[32, 34], p(9, a), p(9, b)], cols[(i + 3) % 8], L, 1.4); }).join('');
    return seg + `<circle cx="32" cy="34" r="22" fill="none" stroke="${L}" stroke-width="3.4"/><circle cx="32" cy="34" r="9" fill="none" stroke="${L}" stroke-width="2"/>` + shine('M15 26Q18 20 23 17', 2, 0.85);
  },
  mosaique(c, L) { // carreau de mosaïque
    const cols = ['#ff6b6b', '#ffd93b', '#4d96ff', '#6bcb77', '#9b6bff', '#ff9f43'];
    let t = ''; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) t += `<rect x="${13 + i * 9.6}" y="${15 + j * 9.6}" width="8.4" height="8.4" rx="1.6" fill="${cols[(i * 5 + j * 3) % 6]}" stroke="${L}" stroke-width="1"/>`;
    return `<g transform="rotate(-10 32 34)"><rect x="10" y="12" width="44" height="44" rx="6" fill="${c}" stroke="${L}" stroke-width="3"/>${t}</g>` + shine('M14 20 18 16', 2);
  },
  etoile(c, L) { // saphir étoilé
    const rays = [0, 1, 2].map(i => { const a = i * Math.PI / 3; return `M${(32 - 17 * Math.cos(a)).toFixed(1)} ${(34 - 17 * Math.sin(a)).toFixed(1)}L${(32 + 17 * Math.cos(a)).toFixed(1)} ${(34 + 17 * Math.sin(a)).toFixed(1)}`; }).join('');
    return `<circle cx="32" cy="34" r="22" fill="${c}"/><path d="M54 34A22 22 0 0 1 14 46Q30 54 46 46Q53 40 54 34Z" fill="${tone(c, -0.3)}"/><path d="${rays}" stroke="#fff" stroke-width="1.8" opacity=".85" stroke-linecap="round"/><circle cx="32" cy="34" r="3" fill="#fff" opacity=".9"/><circle cx="32" cy="34" r="22" fill="none" stroke="${L}" stroke-width="3"/>` + shine('M15 28Q18 19 26 15');
  },
  aurore(c, L) { // aurore boréale
    return `<ellipse cx="32" cy="34" rx="25" ry="20" fill="#16224a"/><path d="M8 34Q18 18 30 28T56 24L56 30Q44 32 32 38T8 42Z" fill="${c}" opacity=".85"/><path d="M10 40Q22 30 34 38T56 34" stroke="#ff8fc7" stroke-width="3" fill="none" opacity=".8"/>${[[20, 22], [40, 18], [46, 44], [16, 46], [30, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#fff"/>`).join('')}<path d="M8 46Q32 40 56 46L52 50Q32 56 12 50Z" fill="#0c1430"/><ellipse cx="32" cy="34" rx="25" ry="20" fill="none" stroke="${L}" stroke-width="3"/>`;
  },
  comete(c, L) { // comète
    return `<path d="M44 22L8 52M40 18L10 40M48 28L20 56" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity=".55"/><path d="M42 20L14 46" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/><circle cx="46" cy="20" r="10" fill="#fff8d6" stroke="${L}" stroke-width="3"/><circle cx="46" cy="20" r="6" fill="${tone(c, 0.5)}"/>` + spark(14, 16, 3.4, '#ffd93b', L) + spark(56, 46, 3, '#ffd93b', L);
  },
  galaxie(c, L) { // galaxie spirale
    const arm = k => { const P = []; for (let a = 0; a <= 2.6 * Math.PI; a += 0.25) { const r = 3 + 3.2 * a; P.push([32 + r * Math.cos(a + k), 34 + r * Math.sin(a + k) * 0.75]); } return 'M' + P.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L'); };
    return `<ellipse cx="32" cy="34" rx="26" ry="20" fill="#1b1440" stroke="${L}" stroke-width="3"/><path d="${arm(0)}" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/><path d="${arm(Math.PI)}" stroke="#ff8fc7" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/><circle cx="32" cy="34" r="5" fill="#fff8d6"/>${[[14, 26], [50, 40], [44, 20], [20, 46], [52, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#fff"/>`).join('')}` + spark(56, 12, 4, '#ffd93b', L) + spark(8, 52, 3, '#fff', L);
  },
};
Object.assign(D, D2);

Object.assign(MATS, {
  nouvelan: { mat: 'de paillettes', c: '#c7d2e8', line: '#3b4a6b', draw: 'disco' },
  galette: { mat: 'de frangipane', c: '#f0b84f', line: '#6e4400', draw: 'galette' },
  chandeleur: { mat: 'de crêpe', c: '#f3c36b', line: '#7a4a10', draw: 'crepe' },
  neige: { mat: 'de neige', c: '#f6faff', line: '#4a6d90', draw: 'neige' },
  mardigras: { mat: 'de beignet', c: '#ff9ec4', line: '#6e3a1a', draw: 'beignet' },
  grandmeres: { mat: 'de miel', c: '#f5b301', line: '#6e4400', draw: 'miel' },
  printemps: { mat: 'de fleur', c: '#ffb3d1', line: '#8a2c4c', draw: 'fleur' },
  poisson: { mat: 'd’écaille', c: '#5ec4e8', line: '#1a5a78', draw: 'poisson' },
  paques: { mat: 'de praliné', c: '#a0623a', line: '#3a1d0c', draw: 'cloche' },
  muguet: { mat: 'de muguet', c: '#4caf50', line: '#24502a', draw: 'muguet' },
  meres: { mat: 'de rose', c: '#e8436b', line: '#6e1530', draw: 'rose' },
  peres: { mat: 'de soie', c: '#3f7be0', line: '#162f6b', draw: 'cravate' },
  musique: { mat: 'd’ébène', c: '#4a4050', line: '#151018', draw: 'notes' },
  quatorze: { mat: 'd’étincelle', c: '#ffffff', line: '#1d2550', draw: 'feuartifice' },
  aout: { mat: 'de coquillage', c: '#ffb08a', line: '#7a3a1e', draw: 'coquillage' },
  rentree: { mat: 'de graphite', c: '#ffc93c', line: '#4a3a10', draw: 'crayon' },
  automne: { mat: 'de feuille d’automne', c: '#e8662c', line: '#6e2a0a', draw: 'erable' },
  blackfriday: { mat: 'd’écu', c: '#f2b01e', line: '#6e4400', draw: 'ecu' },
  halloween: { mat: 'de citrouille', c: '#ff8a1f', line: '#6e3300', draw: 'citrouille' },
  avent: { mat: 'de pain d’épices', c: '#c4793a', line: '#4a2a10', draw: 'painepice' },
  noel: { mat: 'de sucre d’orge', c: '#e8344d', line: '#5a1020', draw: 'sucreorge' },
  unan: { mat: 'de gâteau', c: '#ff9ec4', line: '#6e2a40', draw: 'gateau' },
  m0: { mat: 'de givre', c: '#cfeeff', line: '#2f7fb0', draw: 'givre' },
  m1: { mat: 'de sucre', c: '#ffffff', line: '#7a8494', draw: 'sucre' },
  m2: { mat: 'de rosée', c: '#7fd0ff', line: '#1f5f8a', draw: 'rosee' },
  m3: { mat: 'de nuage', c: '#eef3fb', line: '#4a5f80', draw: 'nuage' },
  m4: { mat: 'de cerise', c: '#e0294f', line: '#5a0a1e', draw: 'cerise' },
  m5: { mat: 'de fraise', c: '#f2384f', line: '#6e0f1e', draw: 'fraise' },
  m6: { mat: 'de sorbet', c: '#ff7fa8', line: '#6e2040', draw: 'sorbet' },
  m7: { mat: 'de sable', c: '#e9c46a', line: '#4a3a1a', draw: 'sablier' },
  m8: { mat: 'de raisin', c: '#8a4fd6', line: '#2e1550', draw: 'raisin' },
  m9: { mat: 'de châtaigne', c: '#8a4a24', line: '#3a1a08', draw: 'chataigne' },
  m10: { mat: 'de cèpe', c: '#9a5b2e', line: '#3e2210', draw: 'champignon' },
  m11: { mat: 'de houx', c: '#2f8f4a', line: '#123a20', draw: 'houx' },
  s39: { mat: 'de quartz fumé', c: '#9a8676', line: '#3e3026', draw: 'quartzfume' },
  p75: { mat: 'de jaspe', c: '#c0573b', line: '#5a1f10', draw: 'jaspe' },
  p100: { mat: 'de spinelle', c: '#d9488f', line: '#5e1238', draw: 'spinelle' },
  p150: { mat: 'd’hématite', c: '#7d828c', line: '#2a2d33', draw: 'hematite' },
  p200: { mat: 'de zircon', c: '#4fc0e8', line: '#14506a', draw: 'zircon' },
  cap6: { mat: 'd’or blanc', c: '#e9ecf2', line: '#5d6880', draw: 'bague' },
  cap7: { mat: 'd’alexandrite', c: '#2fae8a', line: '#1f2a4a', draw: 'alexandrite' },
  cap8: { mat: 'de diamant rose', c: '#ffb3d1', line: '#8a2c4c', draw: 'princesse' },
  bonus25: { mat: 'de galet', c: '#b9b2a6', line: '#4a443c', draw: 'cairn' },
  bonus50: { mat: 'de cristal', c: '#dff3ff', line: '#2f6f90', draw: 'tetra' },
  bonus100: { mat: 'd’or massif', c: '#f2b01e', line: '#6e4400', draw: 'lingots' },
  recu10: { mat: 'de papier doré', c: '#e0294f', line: '#5a0a1e', draw: 'cadeau' },
  recu20: { mat: 'de velours', c: '#8a3ab9', line: '#36124f', draw: 'bourse' },
  de50: { mat: 'de résine', c: '#3fc1a5', line: '#10503f', draw: 'd20' },
  de100: { mat: 'de basalte', c: '#6b7078', line: '#23262b', draw: 'basalte' },
  gain25: { mat: 'de sève', c: '#5cc46b', line: '#1f5a2a', draw: 'pousse' },
  gain50: { mat: 'de chêne', c: '#c98a3d', line: '#4a2c08', draw: 'gland' },
  gain100: { mat: 'de séquoia', c: '#2f9e55', line: '#123f22', draw: 'arbre' },
  cinq: { mat: 'd’éclair', c: '#ffd43b', line: '#6e5200', draw: 'eclair' },
  proj2: { mat: 'de brique', c: '#c8553d', line: '#4a1a0e', draw: 'brique' },
  proj3: { mat: 'de vitrail', c: '#ffd24a', line: '#2a2030', draw: 'vitrail' },
  proj5: { mat: 'de mosaïque', c: '#f3ead8', line: '#4a3a2a', draw: 'mosaique' },
  collec40: { mat: 'de saphir étoilé', c: '#3a5fd0', line: '#14245a', draw: 'etoile' },
  collec60: { mat: 'd’aurore boréale', c: '#4fe0a0', line: '#0c1430', draw: 'aurore' },
  collec80: { mat: 'de comète', c: '#7fd0ff', line: '#1f2f5a', draw: 'comete' },
  legende: { mat: 'de galaxie', c: '#7fb0ff', line: '#0c0830', draw: 'galaxie' },
});

// ——— Pépites des jeux ———
Object.assign(D, {
  balance(c, L) { // balance du marchand
    const pan = x => `<path d="M${x - 11} 36H${x + 11}Q${x + 9} 45 ${x} 45Q${x - 9} 45 ${x - 11} 36Z" fill="${c}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x - 10} 36L${x} 22L${x + 10} 36" stroke="${L}" stroke-width="1.6" fill="none"/>`;
    return `<path d="M32 16V52" stroke="${L}" stroke-width="6" stroke-linecap="round"/><path d="M32 16V52" stroke="${tone(c, 0.2)}" stroke-width="2.6" stroke-linecap="round"/><path d="M14 22H50" stroke="${L}" stroke-width="5" stroke-linecap="round"/><path d="M14 22H50" stroke="${c}" stroke-width="2" stroke-linecap="round"/>${pan(15)}${pan(49)}<path d="M20 55Q32 48 44 55Z" fill="${tone(c, -0.15)}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="32" cy="15" r="3.6" fill="${tone(c, 0.3)}" stroke="${L}" stroke-width="2"/><circle cx="15" cy="34" r="3" fill="#ffd24a" stroke="${L}" stroke-width="1.2"/><circle cx="49" cy="34" r="3" fill="#ffd24a" stroke="${L}" stroke-width="1.2"/>` + spark(56, 12, 3.6, '#fff', L);
  },
  panier(c, L) { // panier d'osier du marché
    const weave = [0, 1, 2, 3].map(i => `<path d="M${12 + i * 1.5} ${36 + i * 5}H${52 - i * 1.5}" stroke="${tone(c, -0.3)}" stroke-width="1.4"/>`).join('') + [18, 25, 32, 39, 46].map(x => `<path d="M${x} 33V${54}" stroke="${tone(c, 0.25)}" stroke-width="1.6"/>`).join('');
    return `<path d="M18 33Q18 12 32 12Q46 12 46 33" stroke="${L}" stroke-width="6.5" fill="none"/><path d="M18 33Q18 12 32 12Q46 12 46 33" stroke="${c}" stroke-width="3" fill="none"/><circle cx="25" cy="29" r="5" fill="#e0294f" stroke="${L}" stroke-width="1.8"/><circle cx="36" cy="28" r="5" fill="#6bcb77" stroke="${L}" stroke-width="1.8"/><path d="M9 33H55L50 56H14Z" fill="${c}" stroke="${L}" stroke-width="2.8" stroke-linejoin="round"/>${weave}<rect x="8" y="30" width="48" height="6" rx="3" fill="${tone(c, 0.15)}" stroke="${L}" stroke-width="2.4"/>`;
  },
  chrono(c, L) { // chronomètre
    return `<rect x="28" y="9" width="8" height="6" rx="2" fill="${tone(c, -0.1)}" stroke="${L}" stroke-width="2.2"/><path d="M45 17L49 13" stroke="${L}" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="36" r="20" fill="${c}" stroke="${L}" stroke-width="3"/><circle cx="32" cy="36" r="15" fill="#fff" stroke="${L}" stroke-width="1.6"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${(32 + 12.5 * Math.cos(a)).toFixed(1)} ${(36 + 12.5 * Math.sin(a)).toFixed(1)}L${(32 + 14.5 * Math.cos(a)).toFixed(1)} ${(36 + 14.5 * Math.sin(a)).toFixed(1)}" stroke="${L}" stroke-width="1.4"/>`; }).join('')}<path d="M32 36L32 25M32 36L39 40" stroke="#e0294f" stroke-width="2.4" stroke-linecap="round"/><circle cx="32" cy="36" r="2" fill="${L}"/>` + shine('M17 28Q19 22 24 19', 2.2);
  },
  trophee(c, L) { // trophée du champion
    return `<path d="M19 18H45V28Q45 44 32 44Q19 44 19 28Z" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M19 22H11Q10 34 22 36M45 22H53Q54 34 42 36" stroke="${L}" stroke-width="2.6" fill="none"/><path d="M28 44H36V50H28Z" fill="${tone(c, -0.15)}" stroke="${L}" stroke-width="2.2"/><rect x="20" y="50" width="24" height="7" rx="2" fill="${tone(c, -0.3)}" stroke="${L}" stroke-width="2.4"/>${poly(star(32, 29, 6.5, 2.8), '#fff8d6', L, 1.4)}` + shine('M23 23V31', 2.4) + spark(53, 12, 4, '#fff', L) + spark(10, 46, 3, '#fff', L);
  },
});
Object.assign(MATS, {
  g_marche1: { mat: 'de laiton', c: '#d4a937', line: '#5a4310', draw: 'balance' },
  g_marche3: { mat: 'd’osier', c: '#c8955a', line: '#4a2c10', draw: 'panier' },
  g_course1: { mat: 'de chrome', c: '#c3ced9', line: '#3d4a58', draw: 'chrono' },
  g_course3: { mat: 'de vermeil', c: '#f0b53a', line: '#6e3f00', draw: 'trophee' },
});

Object.assign(D, {
  poids(c, L) { // poids d'un kilo en fonte
    return `<path d="M26 22Q26 12 32 12Q38 12 38 22" stroke="${L}" stroke-width="6.5" fill="none"/><path d="M26 22Q26 12 32 12Q38 12 38 22" stroke="${tone(c, 0.25)}" stroke-width="3" fill="none"/><path d="M18 22H46L55 55H9Z" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M18 22H46L48 30H16Z" fill="${tone(c, 0.25)}"/><text x="32" y="47" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="13" fill="#fff">1 kg</text>` + shine('M17 30 14 42', 2.2, 0.8) + spark(54, 14, 3.6, '#fff', L);
  },
  bouteille(c, L) { // bouteille en verre
    const d = 'M27 9H37V18Q37 22 42 26Q47 30 47 37V52Q47 57 42 57H22Q17 57 17 52V37Q17 30 22 26Q27 22 27 18Z';
    return `<path d="${d}" fill="${c}" opacity=".9"/><path d="M17 40H47V52Q47 57 42 57H22Q17 57 17 52Z" fill="#ffd45c" opacity=".85"/><rect x="20" y="34" width="24" height="12" rx="2" fill="#fff" stroke="${L}" stroke-width="1.4"/><text x="32" y="43" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="7.5" fill="${L}">1 L</text><path d="${d}" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><rect x="26" y="6" width="12" height="5" rx="1.5" fill="#e0294f" stroke="${L}" stroke-width="2"/>` + shine('M22 32V50', 2.4, 0.85) + spark(53, 16, 3.6, '#fff', L);
  },
});
Object.assign(MATS, {
  g_kilo1: { mat: 'de verre', c: '#bfe6f2', line: '#2c5f74', draw: 'bouteille' },
  g_kilo3: { mat: 'de fonte', c: '#4f5560', line: '#1a1d22', draw: 'poids' },
});

Object.assign(D, {
  calendrier(c, L) { // page de calendrier, 3 jours cochés
    const cells = []; for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) cells.push([14 + q * 9.5, 30 + r * 8.5, r === 1 && q < 3]);
    return `<rect x="9" y="14" width="46" height="42" rx="5" fill="${c}" stroke="${L}" stroke-width="3"/><path d="M9 19Q9 14 14 14H50Q55 14 55 19V25H9Z" fill="#e0294f" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M20 10V18M44 10V18" stroke="${L}" stroke-width="3.4" stroke-linecap="round"/>${cells.map(([x, y, on]) => `<rect x="${x}" y="${y}" width="7" height="6" rx="1.4" fill="${on ? '#6bcb77' : tone(c, -0.12)}"/>${on ? `<path d="M${x + 1.4} ${y + 3}l1.8 1.8 2.6-3.4" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>` : ''}`).join('')}`;
  },
  bille(c, L) { // bille de verre soufflé
    return `<circle cx="32" cy="34" r="21" fill="${c}"/><path d="M14 30Q24 22 32 34T50 38" stroke="#ff6b8b" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/><path d="M16 42Q28 46 36 38T48 24" stroke="#ffd24a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/><path d="M53 34A21 21 0 0 1 18 49Q34 52 46 44Q51 40 53 34Z" fill="#000" opacity=".12"/><circle cx="32" cy="34" r="21" fill="none" stroke="${L}" stroke-width="3"/><ellipse cx="24" cy="24" rx="5" ry="3.4" transform="rotate(-35 24 24)" fill="#fff"/>`;
  },
  cible(c, L) { // cible en liège, une flèche en plein centre
    return `<circle cx="30" cy="36" r="21" fill="${c}" stroke="${L}" stroke-width="3"/><circle cx="30" cy="36" r="14.5" fill="#e0294f" stroke="${L}" stroke-width="2"/><circle cx="30" cy="36" r="8.5" fill="#fff" stroke="${L}" stroke-width="2"/><circle cx="30" cy="36" r="3.5" fill="#e0294f" stroke="${L}" stroke-width="1.6"/><path d="M31 35L55 13" stroke="${L}" stroke-width="4.4" stroke-linecap="round"/><path d="M31 35L55 13" stroke="#a0623a" stroke-width="2"/><path d="M52 10L58 10L56 16Z M50 14L55 18" fill="#4d96ff" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>` + [[14, 30], [42, 48], [20, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="${tone(c, -0.3)}"/>`).join('');
  },
  couronne(c, L) { // couronne en or rose
    const o = [[10, 48], [8, 20], [21, 33], [32, 14], [43, 33], [56, 20], [54, 48]];
    return poly(o, c, L, 3) + poly([[10, 48], [54, 48], [54, 55], [10, 55]], tone(c, -0.2), L, 3) + [[8, 20], [32, 14], [56, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#fff8d6" stroke="${L}" stroke-width="2"/>`).join('') + `<circle cx="32" cy="40" r="4.2" fill="#e0294f" stroke="${L}" stroke-width="2"/><circle cx="19" cy="41" r="3" fill="#4d96ff" stroke="${L}" stroke-width="1.6"/><circle cx="45" cy="41" r="3" fill="#6bcb77" stroke="${L}" stroke-width="1.6"/>` + shine('M14 44 13 30', 2.2, 0.8) + spark(56, 10, 3.6, '#fff', L);
  },
  gant(c, L) { // gant de boxe
    return `<path d="M20 50Q12 46 12 34Q12 18 30 16Q48 15 52 28Q55 40 46 46L46 50Z" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M18 36Q14 26 22 24Q28 24 28 32" fill="${tone(c, 0.12)}" stroke="${L}" stroke-width="2.4"/><rect x="18" y="48" width="30" height="10" rx="3" fill="#fff" stroke="${L}" stroke-width="2.6"/><path d="M24 48V58M32 48V58" stroke="${L}" stroke-width="1.2" opacity=".5"/>` + shine('M30 21Q38 19 44 23', 2.4);
  },
  basket(c, L) { // chaussure de course
    return `<path d="M8 48Q8 38 14 34L24 24Q28 20 32 24L38 32Q46 34 52 36Q58 38 58 46V48Z" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M6 48H58Q58 54 52 55H12Q6 55 6 48Z" fill="#fff" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/><path d="M26 28L32 33M23 31L29 36M20 34L26 39" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M38 40Q46 38 52 42" stroke="${tone(c, -0.3)}" stroke-width="3" fill="none" stroke-linecap="round"/>` + `<path d="M2 30H10M0 38H8M4 22H12" stroke="${L}" stroke-width="2" stroke-linecap="round" opacity=".5"/>`;
  },
  domino(c, L) { // domino en bakélite
    const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${L}"/>`;
    return `<g transform="rotate(-14 32 34) translate(32 34) scale(.88) translate(-32 -34)"><rect x="18" y="10" width="28" height="50" rx="5" fill="${tone(c, -0.25)}"/><rect x="16" y="8" width="28" height="50" rx="5" fill="${c}" stroke="${L}" stroke-width="3"/><path d="M19 33H41" stroke="${L}" stroke-width="2"/>${dot(24, 16) + dot(30, 21) + dot(36, 26)}${[[24, 40], [36, 40], [24, 50], [36, 50], [30, 45]].map(([x, y]) => dot(x, y)).join('')}${shine('M20 14V24', 2, 0.8)}</g>`;
  },
  puzzle(c, L) { // pièce de puzzle
    const d = 'M14 22H26Q24 12 32 12Q40 12 38 22H50V34Q60 32 60 40Q60 48 50 46V58H38Q40 50 32 50Q24 50 26 58H14V46Q6 48 6 40Q6 32 14 34Z';
    return `<path d="${d}" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M14 46V58H26Q24 50 32 50Q40 50 38 58H50V46" fill="${tone(c, -0.15)}" stroke="none"/>` + shine('M18 27V36', 2.4);
  },
  pion(c, L) { // pion d'échecs en buis
    return `<circle cx="32" cy="18" r="7.5" fill="${c}" stroke="${L}" stroke-width="2.8"/><path d="M26 26H38L36 30H28Z" fill="${tone(c, -0.1)}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><path d="M28 30Q27 42 21 48H43Q37 42 36 30Z" fill="${c}" stroke="${L}" stroke-width="2.8" stroke-linejoin="round"/><rect x="15" y="48" width="34" height="8" rx="3" fill="${tone(c, -0.2)}" stroke="${L}" stroke-width="2.8"/>` + shine('M28 15Q29 12 32 11.5', 2) + shine('M29 36 27 44', 2, 0.8);
  },
  manette(c, L) { // manette de jeu
    return `<path d="M14 24H50Q58 24 59 36Q60 50 52 52Q46 53 42 44H22Q18 53 12 52Q4 50 5 36Q6 24 14 24Z" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M16 31V41M11 36H21" stroke="${L}" stroke-width="3.6" stroke-linecap="round"/>${[[45, 32, '#e0294f'], [51, 37, '#4d96ff'], [45, 42, '#6bcb77'], [39, 37, '#ffd24a']].map(([x, y, f]) => `<circle cx="${x}" cy="${y}" r="3" fill="${f}" stroke="${L}" stroke-width="1.6"/>`).join('')}<rect x="27" y="30" width="4" height="2.6" rx="1" fill="${L}"/><rect x="33" y="30" width="4" height="2.6" rx="1" fill="${L}"/>` + shine('M12 28Q16 26 20 26', 2.2);
  },
  gomme(c, L) { // gomme : on efface et on recommence
    return `<g transform="rotate(-20 32 36)">${poly([[10, 28], [42, 28], [42, 46], [10, 46]], c, L, 3)}${poly([[42, 28], [56, 28], [56, 46], [42, 46]], '#4d96ff', L, 3)}${poly([[10, 28], [16, 22], [62, 22], [56, 28]], tone(c, 0.25), L, 2.4)}${poly([[56, 28], [62, 22], [62, 40], [56, 46]], tone(c, -0.25), L, 2.4)}${shine('M14 32H30', 2, 0.85)}</g><path d="M10 56Q18 52 26 56T42 56" stroke="${tone(c, -0.2)}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  },
  gruyere(c, L) { // part de gruyère pleine de trous
    return `${poly([[8, 46], [52, 18], [56, 46]], tone(c, -0.12), L, 3)}${poly([[8, 46], [56, 46], [56, 56], [8, 56]], c, L, 3)}${poly([[8, 46], [52, 18], [56, 18], [56, 46]], tone(c, -0.2), L, 0.1)}${[[26, 41, 3.4], [40, 36, 2.6], [46, 42, 2], [20, 51, 2.6], [36, 52, 3], [48, 52, 1.8]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="${tone(c, -0.35)}"/>`).join('')}` + `<path d="M8 46L52 18L56 18" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` + shine('M14 50H22', 2, 0.8);
  },
  trefle(c, L) { // trèfle à trois feuilles (pas de chance !)
    const leaf = a => `<path d="M32 33Q${32 + 22 * Math.cos(a - 0.5)} ${33 + 22 * Math.sin(a - 0.5)} ${32 + 20 * Math.cos(a)} ${33 + 20 * Math.sin(a)}Q${32 + 22 * Math.cos(a + 0.5)} ${33 + 22 * Math.sin(a + 0.5)} 32 33Z" fill="${c}" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/>`;
    return `<path d="M32 34Q34 46 42 56" stroke="${L}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M32 34Q34 46 42 56" stroke="${tone(c, -0.1)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>${[-Math.PI / 2, Math.PI / 6 - 0.2, Math.PI * 5 / 6 + 0.2].map(leaf).join('')}<circle cx="32" cy="33" r="2.4" fill="${tone(c, -0.3)}"/>` + `<path d="M48 16q3-4 6 0M48 16q3 4 6 0" stroke="${L}" stroke-width="1.6" fill="none" opacity=".6"/>`;
  },
});
Object.assign(MATS, {
  g_jour3: { mat: 'de papier', c: '#ffffff', line: '#4a4a5a', draw: 'calendrier' },
  g_jour7: { mat: 'de verre soufflé', c: '#8fd8ff', line: '#1f5a80', draw: 'bille' },
  g_trois: { mat: 'de liège', c: '#d9b07a', line: '#5a3a1a', draw: 'cible' },
  g_parfait: { mat: 'd’or rose', c: '#f2a6a0', line: '#7a3a34', draw: 'couronne' },
  g_acharne: { mat: 'de cuir', c: '#e0294f', line: '#5a0a1e', draw: 'gant' },
  g_marathon: { mat: 'de caoutchouc', c: '#4d96ff', line: '#143a7a', draw: 'basket' },
  g_p10: { mat: 'de bakélite', c: '#fff4e0', line: '#3a2a1a', draw: 'domino' },
  g_p25: { mat: 'de carton', c: '#6bcb77', line: '#1f5a2a', draw: 'puzzle' },
  g_p50: { mat: 'de buis', c: '#e8c88a', line: '#5a3e14', draw: 'pion' },
  g_p100: { mat: 'de plastique', c: '#9b6bff', line: '#3a1f7a', draw: 'manette' },
  g_perdu: { mat: 'de gomme', c: '#ff9ec4', line: '#6e2a40', draw: 'gomme' },
  g_boulette: { mat: 'de gruyère', c: '#ffd45c', line: '#7a5a00', draw: 'gruyere' },
  de_pire: { mat: 'de trèfle', c: '#5cbf5c', line: '#1f4a1f', draw: 'trefle' },
});

Object.assign(D, {
  chaussette(c, L) { // chaussette en coton
    const d = 'M24 10H42V36Q42 44 36 50L30 56Q24 60 18 55Q13 50 18 45L26 38Z';
    return `<path d="${d}" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M24 10H42V18H24Z" fill="${tone(c, -0.2)}" stroke="${L}" stroke-width="2.4"/><path d="M24 24H42M24 30H42" stroke="#e0294f" stroke-width="3"/><path d="M18 45Q13 50 18 55Q24 60 30 56L32 54Q24 54 22 47Z" fill="#e0294f" stroke="${L}" stroke-width="2"/>` + shine('M28 34 28 40', 2);
  },
  caddie(c, L) { // caddie en osier tressé
    const weave = [0, 1, 2].map(i => `<path d="M${16 + i * 2} ${26 + i * 7}H${50 - i * 2}" stroke="${tone(c, -0.3)}" stroke-width="1.4"/>`).join('') + [22, 30, 38, 46].map(x => `<path d="M${x} 21L${x - 2} 44" stroke="${tone(c, 0.3)}" stroke-width="1.4"/>`).join('');
    return `<path d="M4 14H12L16 21" stroke="${L}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 21H54L48 45H20Z" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>${weave}<path d="M20 45L18 50H50" stroke="${L}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="22" cy="55" r="3.6" fill="${tone(c, -0.3)}" stroke="${L}" stroke-width="2"/><circle cx="46" cy="55" r="3.6" fill="${tone(c, -0.3)}" stroke="${L}" stroke-width="2"/>`;
  },
  dentelle(c, L) { // cœur en dentelle
    const heart = 'M32 54C20 44 10 36 10 25C10 17 16 12 22 12C27 12 30 15 32 18C34 15 37 12 42 12C48 12 54 17 54 25C54 36 44 44 32 54Z';
    const holes = [[22, 22], [32, 26], [42, 22], [27, 34], [37, 34], [32, 43], [17, 29], [47, 29]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="none" stroke="${tone(c, -0.3)}" stroke-width="1.4"/>`).join('');
    return `<path d="${heart}" fill="${c}" stroke="${L}" stroke-width="3" stroke-dasharray="4 2.2" stroke-linejoin="round"/>${holes}` + shine('M16 21Q18 16 23 15.5', 2.2);
  },
  guimauve(c, L) { // guimauve rose et blanche
    return `<ellipse cx="32" cy="48" rx="18" ry="6" fill="${tone(c, -0.15)}" stroke="${L}" stroke-width="2.6"/><path d="M14 48V24H50V48" fill="${c}" stroke="${L}" stroke-width="2.6"/><path d="M14 36H50" stroke="#fff" stroke-width="6" opacity=".9"/><ellipse cx="32" cy="24" rx="18" ry="6" fill="${tone(c, 0.35)}" stroke="${L}" stroke-width="2.6"/><path d="M20 30V44" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>` + spark(52, 14, 3.4, '#fff', L);
  },
  gousset(c, L) { // montre à gousset en or
    return `<rect x="28" y="10" width="8" height="5" rx="1.5" fill="${tone(c, -0.15)}" stroke="${L}" stroke-width="2"/><circle cx="32" cy="36" r="21" fill="${c}" stroke="${L}" stroke-width="3"/><circle cx="32" cy="36" r="16" fill="#fff8e6" stroke="${tone(c, -0.3)}" stroke-width="2"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<circle cx="${(32 + 13 * Math.cos(a)).toFixed(1)}" cy="${(36 + 13 * Math.sin(a)).toFixed(1)}" r="${i % 3 ? 0.9 : 1.6}" fill="${L}"/>`; }).join('')}<path d="M32 36V26M32 36L39 39" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>` + shine('M16 29Q18 22 24 19');
  },
  etoilesucre(c, L) { // sablé étoile au sucre glace
    const o = star(32, 35, 25, 12);
    return poly(o, '#d9a35a', L, 3) + poly(star(32, 35, 19, 9), c, tone(c, -0.15), 1.4) + [[26, 30], [36, 28], [30, 40], [38, 38], [32, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#fff"/>`).join('') + spark(54, 12, 3.6, '#fff', L);
  },
  coquetier(c, L) { // œuf dans son coquetier
    return `<path d="M20 22Q20 10 32 10Q44 10 44 24Q44 34 32 34Q20 34 20 22Z" fill="${c}" stroke="${L}" stroke-width="3"/><path d="M16 32H48Q48 44 38 46L40 52H24L26 46Q16 44 16 32Z" fill="#4d96ff" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><rect x="20" y="51" width="24" height="6" rx="2" fill="#3a7ad8" stroke="${L}" stroke-width="2.6"/><circle cx="26" cy="39" r="1.6" fill="#fff"/><circle cx="32" cy="40" r="1.6" fill="#fff"/><circle cx="38" cy="39" r="1.6" fill="#fff"/>` + shine('M25 17Q27 13 31 12.5', 2.2);
  },
  nid(c, L) { // nid de paille avec ses œufs
    const straw = Array.from({ length: 9 }, (_, i) => `<path d="M${10 + i * 5} ${40 + (i % 2) * 3}Q${14 + i * 5} ${34 + (i % 3) * 4} ${18 + i * 5} ${42 - (i % 2) * 2}" stroke="${tone(c, i % 2 ? -0.25 : 0.2)}" stroke-width="2" fill="none"/>`).join('');
    return `<ellipse cx="24" cy="32" rx="7" ry="9" fill="#f3efe6" stroke="${L}" stroke-width="2.2"/><ellipse cx="40" cy="31" rx="7" ry="9" fill="#bfe6f2" stroke="${L}" stroke-width="2.2"/><ellipse cx="32" cy="34" rx="7" ry="9" fill="#fff" stroke="${L}" stroke-width="2.2"/><path d="M6 38Q8 54 32 54Q56 54 58 38Q46 44 32 44Q18 44 6 38Z" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>${straw}`;
  },
  oeufor(c, L) { // œuf d'or décoré
    return `<path d="M32 9Q48 9 50 34Q51 56 32 56Q13 56 14 34Q16 9 32 9Z" fill="${c}" stroke="${L}" stroke-width="3"/><path d="M15 30Q32 36 49 30M14.5 40Q32 46 49.5 40" stroke="${tone(c, -0.3)}" stroke-width="2" fill="none"/>${[[22, 35], [32, 37], [42, 35], [27, 45], [37, 45]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2" fill="${['#e0294f', '#4d96ff', '#6bcb77', '#9b6bff', '#e0294f'][i]}" stroke="${L}" stroke-width="1"/>`).join('')}<path d="M32 14L34 19L39 19.5L35.5 23L36.5 28L32 25.5L27.5 28L28.5 23L25 19.5L30 19Z" fill="#fff8d6" stroke="${L}" stroke-width="1.2"/>` + shine('M20 24Q22 16 27 13') + spark(54, 12, 4, '#fff', L);
  },
});
Object.assign(MATS, {
  g_envie1: { mat: 'de coton', c: '#f3efe6', line: '#4a4438', draw: 'chaussette' },
  g_envie3: { mat: 'd’osier tressé', c: '#d9a35a', line: '#5a3a10', draw: 'caddie' },
  g_envieS: { mat: 'de dentelle', c: '#ffe3ee', line: '#8a2c4c', draw: 'dentelle' },
  g_pan1: { mat: 'de coquille', c: '#f6f0e4', line: '#5a4a30', draw: 'coquetier' },
  g_pan3: { mat: 'de paille', c: '#e6c46a', line: '#5a4310', draw: 'nid' },
  g_panS: { mat: 'de coquille dorée', c: '#f5c542', line: '#6e4a00', draw: 'oeufor' },
  g_guim1: { mat: 'de guimauve', c: '#ffb3cf', line: '#8a2c4c', draw: 'guimauve' },
  g_guim3: { mat: 'd’or vieilli', c: '#e0a628', line: '#5a3a00', draw: 'gousset' },
  g_guimS: { mat: 'de sucre glace', c: '#ffffff', line: '#6e4a20', draw: 'etoilesucre' },
});

export const matSVG = m => D[m.draw](m.c, m.line);
// Pépite pas encore gagnée : une pépite grise avec un point d'interrogation.
export const mystSVG = () => NUGF.map((d, i) => `<path d="${d}" fill="${['#e9e6e1', '#f3f1ed', '#e2ded8', '#d9d4cd', '#e0dcd5', '#cfc9c1', '#c7c0b7', '#d6d1ca', '#bfb8ae'][i]}" stroke="#a29a8e" stroke-width="1.1" stroke-linejoin="round"/>`).join('') + edge([[6, 40], [14, 24], [30, 15], [46, 17], [58, 30], [56, 46], [42, 55], [20, 54]], '#a29a8e') + '<text x="32" y="43" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="21" fill="#7d7468" stroke="#fff" stroke-width="3" paint-order="stroke">?</text>';
