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
export const matSVG = m => D[m.draw](m.c, m.line);
// Pépite pas encore gagnée : une pépite grise avec un point d'interrogation.
export const mystSVG = () => NUGF.map((d, i) => `<path d="${d}" fill="${['#e9e6e1', '#f3f1ed', '#e2ded8', '#d9d4cd', '#e0dcd5', '#cfc9c1', '#c7c0b7', '#d6d1ca', '#bfb8ae'][i]}" stroke="#a29a8e" stroke-width="1.1" stroke-linejoin="round"/>`).join('') + edge([[6, 40], [14, 24], [30, 15], [46, 17], [58, 30], [56, 46], [42, 55], [20, 54]], '#a29a8e') + '<text x="32" y="43" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="21" fill="#7d7468" stroke="#fff" stroke-width="3" paint-order="stroke">?</text>';
