/* « Toi, parent » : les articles qui expliquent le sens de Pépite.
   Les visuels de l'article 4 sont fabriqués avec les composants de l'appli (h = helpers),
   ils suivent donc le design au fil des versions. */

const fig = (n, t) => `<div class="fig"><b>${n}</b><span>${t}</span></div>`;
const keep = items => `<div class="keep"><h4>À retenir</h4><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
export const demo = (html, cap) => `<figure class="demo"><div class="demoin" inert aria-hidden="true">${html}</div><figcaption>${cap}</figcaption></figure>`;
const eur = v => v.toFixed(2).replace('.', ',') + ' €';

function compoundChart() {
  const rows = [[0, 100, 100], [10, 150, 163], [20, 200, 265], [30, 250, 432]];
  return `<div class="cchart" role="img" aria-label="100 € à 5 % par an : 250 € en intérêts simples, 432 € en intérêts composés au bout de 30 ans">
${rows.map(([y, s, c]) => `<div class="ccol"><div class="cbars"><i class="cs" style="height:${(s / 432 * 100).toFixed(1)}%"><em>${s} €</em></i><i class="cc" style="height:${(c / 432 * 100).toFixed(1)}%"><em>${c} €</em></i></div><span>${y ? y + ' ans' : 'Départ'}</span></div>`).join('')}
</div><p class="clegend"><span><i class="cs"></i>Intérêts simples</span><span><i class="cc"></i>Intérêts composés</span></p>`;
}

const e0 = n => n.toLocaleString('fr-FR').replace(/\s/g, '\u00a0') + '\u00a0€';
function twoKids() {
  const rows = [['Inès, dès 6\u00a0ans', 1248, 1696], ['Hugo, dès 12\u00a0ans', 624, 725]];
  return `<div class="kids2" role="img" aria-label="À 18 ans, Inès a versé 1 248 € et en a 1 696 € ; Hugo a versé 624 € et en a 725 €">${rows.map(([n, v, t]) => `<div class="k2"><b>${n}</b><div class="k2bar"><i class="kv" style="width:${(v / 1696 * 100).toFixed(1)}%"></i><i class="kg" style="width:${((t - v) / 1696 * 100).toFixed(1)}%"></i></div><span>${e0(v)} versés · <b class="g">+${e0(t - v)} de gains</b> · ${e0(t)} à 18\u00a0ans</span></div>`).join('')}</div>
<p class="clegend"><span><i class="cs"></i>Argent versé</span><span><i class="cc"></i>Gains du placement</span></p>`;
}

function grid() {
  const ages = [6, 7, 8, 9, 10, 12, 15, 17];
  return `<table class="agrid"><thead><tr><th>Âge</th><th>Par semaine</th><th>Soit par mois</th></tr></thead><tbody>${ages.map(a => { const w = 1.5 + 0.5 * (a - 6); return `<tr><td>${a} ans</td><td><b>${eur(w)}</b></td><td>${eur(w * 52 / 12)}</td></tr>`; }).join('')}</tbody></table>`;
}


/* Les fonctionnalités, partagées entre l'article 4 et le tutoriel d'avant inscription. */
export function features(h) {
  const t = { own: 40, bonus: 10, gains: 6, total: 56 };
  const faces = [-1.5, -0.5, 0, 0.5, 1, 1.7].map(x => h.r50(x));
  return [
    { title: 'La paie, pièce par pièce', short: 'Une fois par semaine, le jour qui vous arrange, l’enfant reçoit sa paie en pièces virtuelles et décide pour chacune\u00a0: dans le porte-monnaie pour la dépenser, ou dans la tirelire pour la placer. À ce moment-là, aucun vrai argent ne bouge.',
      long: 'Une fois par semaine, le jour qui vous arrange, la paie arrive en pièces virtuelles de 1\u00a0€ et de 50\u00a0centimes. L’enfant les range une par une\u00a0: dans son porte-monnaie pour les dépenser, ou dans sa tirelire pour les placer. S’il a oublié une semaine, ses paies l’attendent jusqu’à quatre semaines.',
      visual: `<div class="tray">${h.coinEl(0.5)}</div><div class="zones"><div class="zone"><strong>Mon porte-monnaie\u00a0: 1,00\u00a0€</strong>${h.coinEl(1)}</div><div class="zone gz"><strong class="g">Ma tirelire\u00a0: 2,00\u00a0€</strong>${h.coinEl(1)}${h.coinEl(1)}</div></div>`,
      cap: 'Une pièce à ranger, une gardée, deux placées.' },
    { title: 'Vous payez quand vous voulez', short: 'Les pièces sont virtuelles\u00a0: Pépite tient les comptes à votre place, semaine après semaine. Vous donnez le vrai argent quand ça vous arrange, chaque semaine, chaque mois ou au retour des vacances. Deux compteurs vous disent combien donner et combien mettre de côté. Zéro charge mentale.',
      long: 'Les pièces de l’appli sont virtuelles\u00a0: Pépite tient les comptes à votre place, et vous réglez en vrai quand vous voulez. Plus besoin de se souvenir de qui doit quoi à qui. Deux compteurs par enfant\u00a0: le porte-monnaie à donner et la tirelire à mettre de côté. Un geste pour dire «\u00a0c’est donné\u00a0» ou «\u00a0c’est rangé\u00a0», et le compteur repart à zéro.',
      visual: `<div class="ledger"><span><i class="dot" style="background:var(--purse)"></i>Porte-monnaie à donner</span><b>${h.f(6)}</b><span class="btn ghost sm">C’est donné</span></div><div class="ledger"><span><i class="dot" style="background:var(--grow)"></i>Tirelire à mettre de côté</span><b class="g">${h.f(12.5)}</b><span class="btn gr sm">C’est rangé</span></div>`,
      cap: 'Dans l’espace parents.' },
    { title: 'Le bonus des parents', short: 'Chaque pièce placée dans la tirelire rapporte un bonus, payé par les parents. Avec 25\u00a0%, c’est simple\u00a0: tu places 4\u00a0pièces, on t’en donne 1. L’argent dépensé, lui, n’a pas de bonus.',
      long: 'Pour chaque pièce placée dans la tirelire, les parents ajoutent un bonus\u00a0: c’est l’abondement, comme un employeur qui complète l’épargne de ses salariés. Avec 25\u00a0%, un enfant de 7\u00a0ans comprend tout de suite\u00a0: «\u00a0tu places 4\u00a0pièces, on t’en donne 1\u00a0». Le bonus ne s’applique qu’à l’argent placé, jamais à celui qui part dans le porte-monnaie. Vous choisissez le taux (10, 25 ou 50\u00a0%), et un autre pour l’argent reçu.',
      visual: `<div class="bonusdemo"><div class="bcoins">${h.coinEl(1)}${h.coinEl(1)}${h.coinEl(1)}${h.coinEl(1)}</div><span class="bplus">+</span><div class="bgift">${h.coinEl(1)}<small>offerte par les parents</small></div></div>`,
      cap: 'Avec un bonus de 25\u00a0%\u00a0: 4\u00a0pièces placées, 1\u00a0pièce offerte.' },
    { title: 'La bourse au dé', short: 'L’argent placé peut grossir, comme un vrai placement en Bourse. Une fois par semaine, l’enfant choisit sa stratégie puis lance le dé. Chaque face montre ce qu’il peut gagner ou perdre, en vraies pièces. Ces montants suivent la taille de sa tirelire\u00a0: plus elle est pleine, plus le dé fait gagner, ou perdre, gros.',
      long: 'Une fois par semaine, l’enfant choisit sa stratégie puis lance le dé. Chaque face affiche ce qu’elle ferait gagner ou perdre sur sa vraie tirelire, par pièces de 50\u00a0centimes, sans un seul pourcentage. Comme chaque face joue sur toute la tirelire, les montants grandissent avec elle\u00a0: la même face rapporte 10\u00a0fois plus avec 1\u00a0000\u00a0€ qu’avec 100\u00a0€. «\u00a0Je ne joue pas\u00a0» est un choix respecté.',
      visual: `<div class="post on" style="pointer-events:none"><span class="ph"><b>Équilibré</b></span><span class="dfaces">${faces.map((x, i) => `<span class="df ${x > 0 ? 'up' : x < 0 ? 'dn' : ''}">${h.miniDie(i + 1, x > 0 ? '#13a05a' : x < 0 ? '#e0434f' : '#a39cb8')}<b>${h.eurS(x)}</b></span>`).join('')}</span><span class="pr"><span class="g">3 faces sur 6 font gagner</span> · 1 ne change rien · <span class="neg">2 font perdre</span></span></div>`,
      cap: 'Avec une tirelire de 100\u00a0€\u00a0: on compte les faces, on choisit.' },
    { title: 'La tirelire à trois couches', short: 'Trois couches dans le même bocal\u00a0: son argent, le bonus des parents, et en vert ce que son argent a rapporté tout seul grâce à la bourse, comme un placement. Pas un service rendu\u00a0: de l’argent qui travaille.',
      long: 'Son argent, le bonus des parents, et en vert ce que son argent placé a rapporté tout seul grâce à la bourse, comme un placement (ce n’est pas la récompense d’un service rendu)\u00a0: trois couleurs empilées pour comparer d’un coup d’œil. Quand l’objectif est atteint, le bocal s’illumine.',
      visual: `<div class="demojar">${h.jar(t, { budget: 100 }).svg}<div class="tiles"><div class="tile"><small><i style="background:var(--kid)"></i>Mon argent</small><b>${h.f(40)}</b></div><div class="tile"><small><i style="background:var(--gold)"></i>Bonus</small><b>${h.f(10)}</b></div><div class="tile"><small><i style="background:var(--grow)"></i>Gagné tout seul</small><b class="g">${h.f(6)}</b></div></div></div>`,
      cap: 'La tirelire telle que la voit l’enfant.' },
    { title: 'Un projet, et sa pépite qui grandit', short: 'Un vélo, un jeu\u00a0? L’enfant se fixe un objectif. À chaque palier, sa pépite grossit. Objectif atteint\u00a0: il vous présente son projet et vous débloquez l’argent.',
      long: 'Un vélo, un jeu, une sortie\u00a0: l’enfant fixe son objectif. À chaque palier (25, 50, 75\u00a0%), sa pépite prend une taille. Objectif atteint\u00a0? Il présente son projet, et vous débloquez l’argent depuis l’espace parents. Sans projet, les paliers suivent les seuils de la tirelire.',
      visual: `<div class="nugrow">${[0, 25, 50, 75, 100].map(p => h.growNug(p)).join('')}</div>`,
      cap: 'De la petite pépite à «\u00a0C’est pépite\u00a0!\u00a0»' },
    { title: '«\u00a0J’ai reçu de l’argent\u00a0»', short: 'Un billet de mamie, un anniversaire, ou une récompense pour un service rendu, comme une prime d’employeur\u00a0? L’enfant l’ajoute lui-même et choisit ce qu’il en fait. Vous décidez si l’argent reçu a droit à un bonus.',
      long: 'Un billet de mamie, un anniversaire, ou une récompense pour un service rendu, à la façon d’une prime d’employeur\u00a0? L’enfant l’ajoute lui-même et choisit\u00a0: tout dépenser, moitié-moitié ou tout placer. Vous décidez si l’argent reçu a droit à un bonus, et à combien.',
      visual: `<div class="item"><span class="ic" style="background:color-mix(in srgb,var(--grow) 14%,transparent);color:var(--grow)">${h.I.gift}</span><span><b>J’ai reçu de l’argent</b><small>Un cadeau, un anniversaire\u00a0?</small></span><span class="end">${h.I.chev}</span></div>`,
      cap: 'Depuis l’écran d’accueil de l’enfant.' },
    { title: 'Avec ou sans téléphone', short: 'Verrouillez l’appli sur un enfant\u00a0: il ne voit que sa tirelire. Les réglages sont protégés par un code parents. Pas encore de téléphone\u00a0? Aucun problème\u00a0: l’enfant utilise le vôtre, avec vous, comme un petit rituel de la semaine.',
      long: 'Verrouillez l’appli sur un enfant\u00a0: il ne voit que sa tirelire, ne peut pas ouvrir celle de ses frères et sœurs ni l’espace parents, et ne range qu’une paie et un lancer par semaine. Pour revenir aux réglages, un code parents à 4\u00a0chiffres. Pas besoin de compte Google ni d’adresse e-mail pour l’enfant. Et s’il n’a pas de téléphone, tout marche aussi bien sur le vôtre\u00a0: vous rangez la paie et lancez le dé ensemble, c’est même l’occasion de parler d’argent.',
      visual: `<div class="pin" style="padding:0"><div class="dots"><i class="on"></i><i class="on"></i><i></i><i></i></div><div class="keys mini">${[1, 2, 3, 4, 5, 6].map(n => `<span class="key">${n}</span>`).join('')}</div></div>`,
      cap: 'Le code parents protège les réglages.' }
  ];
}

export function articles(h) {
  return [
    {
      id: 'pedagogie', n: 1, theme: 'La pédagogie', min: 3,
      title: 'L’école ne leur apprend pas l’argent. Vous, si.',
      lead: 'À l’école, on apprend à calculer l’aire d’un trapèze. Personne ne nous apprend à mettre de côté, ni à faire travailler 100 €. Résultat : beaucoup de familles n’y arrivent pas, et celles qui épargnent le font souvent à l’aveugle.',
      body: `
<div class="figs">${fig('1 sur 4', 'Français n’épargne pas du tout')}${fig('4 sur 10', 'foyers sans aucun produit d’investissement')}${fig('12,8/20', 'la note de culture financière des Français')}</div>
<h3>Épargner, investir : deux réflexes qu’on ne nous a jamais appris</h3>
<p>Mettre de côté chaque mois n’a rien d’évident. Un Français sur quatre n’épargne pas du tout, et 14 % n’ont aucune réserve (Ipsos pour Distingo Bank, 2026). Et quand on épargne, c’est souvent par réflexe de prudence plus que par choix : 51 % des Français privilégient les produits sûrs et peu rémunérateurs (Ipsos pour le Cercle des épargnants, 2026).</p>
<p>Investir est encore plus intimidant. Selon l’Autorité des marchés financiers, 4 foyers sur 10 ne détiennent aucun produit d’investissement, et 7 Français sur 10 pensent que la Bourse (les actions) est réservée « à des gens qui s’y connaissent ». Ce n’est pas un manque d’intelligence : c’est un manque d’apprentissage. Interrogés avec le questionnaire de l’OCDE, les Français obtiennent 12,8 sur 20 en culture financière ; lors de la dernière comparaison internationale, la France se classait 14e sur 39 pays.</p>
<h3>Le piège de l’argent « en sécurité »</h3>
<p>Depuis août 2026, le Livret A rapporte 1,7 % par an. Or en octobre 2026, les prix avaient augmenté de 3,4 % sur un an (Insee). Traduction : 1 000 € placés gagnent 17 € en un an, pendant que ce qu’ils permettent d’acheter coûte 34 € de plus. L’argent « en sécurité » recule sans faire de bruit, et beaucoup l’ignorent : 51 % des 18-27 ans ne savaient pas que leur Livret A perdait de la valeur face à l’inflation (sondage Yomoni, 2026). Le Livret A reste parfait pour l’épargne de précaution. Pour préparer l’avenir lointain, il ne suffit pas.</p>
<h3>Et la retraite de nos enfants ?</h3>
<p>Le Conseil d’orientation des retraites prévoit que la pension moyenne passera de 54,6 % du revenu moyen des actifs en 2025 à 45,3 % en 2070. Nos enfants partiront à la retraite vers 2085. Ils auront besoin d’un complément construit par eux-mêmes, et pour cela une ressource compte plus que toutes les autres : le temps. Or le temps, c’est précisément ce qu’ils ont.</p>
<h3>Pourquoi commencer par les enfants</h3>
<p>Une étude de l’Université de Cambridge pour le Money Advice Service britannique conclut que l’essentiel de nos habitudes d’argent se forme avant 7 ans. Et dans les pays évalués par l’OCDE, les élèves de 15 ans les plus solides en culture financière sont 72 % plus susceptibles d’épargner que les plus faibles (PISA 2022). Ce qu’on apprend tôt, on le garde.</p>
<p>Pépite part de là. Pas de cours magistral : une paie, des choix, un dé, un projet. L’enfant fait, se trompe pour 2 €, recommence. Il apprend à 8 ans ce que beaucoup d’adultes découvrent à 40, le jour où une erreur coûte 20 000 €.</p>
<blockquote>On ne peut pas rattraper ce qu’on ne nous a pas appris. On peut changer ce qu’on leur apprend.</blockquote>
${keep(['Épargner et investir ne s’improvisent pas : la plupart d’entre nous ne l’ont jamais appris.', 'Les retraites vont baisser par rapport aux salaires : le temps sera leur meilleur allié.', 'Les habitudes d’argent se prennent avant 7 ans. Pépite en fait un jeu.'])}
<p class="note">Pépite est un terrain d’entraînement, pas un placement : les gains du jeu sont payés par les parents.</p>`,
      sources: [
        ['Banque de France, Semaine de l’éducation financière 2026 (enquête CSA, questionnaire OCDE)', 'https://www.banque-france.fr/fr/communiques-de-presse/semaine-de-leducation-financiere-une-mobilisation-nationale-portee-par-la-banque-de-france-et-les'],
        ['Banque de France, enquête 2023 sur la culture financière (classement OCDE)', 'https://www.banque-france.fr/fr/communiques-de-presse/la-culture-financiere-des-francais-sameliore-progressivement-dapres-de-nouvelles-etudes-menees-par'],
        ['Ipsos.Digital pour Distingo Bank, septembre 2026 (via Tout sur mes finances)', 'https://www.toutsurmesfinances.com/actualites/?p=2793'],
        ['Ipsos pour le Cercle des épargnants, baromètre 2026', 'https://www.ipsos.com/fr-fr/les-francais-renforcent-leur-epargne-de-precaution-et-sinquietent-de-lavenir-des-retraites'],
        ['Sondage Yomoni, octobre 2026 (via MonImmeuble)', 'https://monimmeuble.com/?p=109844'],
        ['AMF, Baromètre de l’épargne et de l’investissement 2025', 'https://www.amf-france.org/fr/actualites-publications/communiques/communiques-de-lamf/barometre-amf-2025-en-quete-dautonomie-les-francais-sont-nombreux-recourir-lintelligence'],
        ['AMF, Baromètre de l’épargne 2022', 'https://www.amf-france.org/sites/institutionnel/files/pdf/69955/fr/Les_Francais_un_peu_moins_enclins_a_investir_en_bourse_selon_le_barometre_de_l%27epargne_de_l%27AMF_.pdf'],
        ['Gouvernement, taux du Livret A au 1er août 2026', 'https://www.info.gouv.fr/public/index.php/actualite/augmentation-du-taux-du-livret-a-a-compter-du-1er-aout-2026'],
        ['Insee, indice des prix à la consommation, octobre 2026', 'https://insee.fr/fr/statistiques/9131332'],
        ['COR, rapport annuel juin 2026, partie 2', 'https://www.cor-retraites.fr/sites/default/files/2026-06/RA_Part2_Chap1.pdf'],
        ['Université de Cambridge et Money Advice Service, Habit Formation and Learning in Young Children (2013)', 'https://www.yourmoney.com/investing/adult-money-habits-are-set-by-the-age-of-seven'],
        ['OCDE, PISA 2022 : culture financière des élèves', 'https://www.oecd.org/en/topics/student-financial-literacy']
      ]
    },
    {
      id: 'interets', n: 2, theme: 'Les intérêts composés', min: 3,
      title: 'Quand l’argent fait des petits',
      lead: 'Un placement, c’est de l’argent qu’on laisse de côté et qui rapporte. Pour qu’il rapporte beaucoup, il y a un secret en deux mots, intérêts composés, et un ingrédient, le temps. Explication sans jargon.',
      body: `
<h3>Un placement, c’est quoi ?</h3>
<p>Vous connaissez le Livret A. Vous y laissez 100 €, et au bout d’un an la banque vous verse 1,70 €. Ces 1,70 €, ce sont des intérêts : une sorte de loyer que l’on vous paie parce que votre argent reste de côté au lieu d’être dépensé. Un placement, c’est exactement ça.</p>
<p>Certains placements rapportent plus que le Livret A, mais en échange ils peuvent aussi baisser. C’est le cas de la Bourse (les actions) : de 1900 à 2023, elle a rapporté en moyenne 5,1 % par an de plus que la hausse des prix, avec pourtant des années à −30 %. Dans nos exemples, on retient donc 5 % par an : c’est un ordre de grandeur réaliste sur longue période, pas une promesse.</p>
<h3>Les intérêts composés : l’effet boule de neige</h3>
<p>Une boule de neige qui roule ramasse d’autant plus de neige qu’elle est grosse. L’argent placé fait pareil. La première année, 100 € placés à 5 % rapportent 5 €. La deuxième année, ce ne sont plus 100 € qui travaillent, mais 105 € : ils rapportent 5,25 €. Puis 5,51 €, puis 5,79 €… Les gains se mettent eux-mêmes à rapporter.</p>
${compoundChart()}
<p>Au bout de 30 ans, vous avez 432 €. Si vous aviez dépensé vos 5 € de gains chaque année, vous n’auriez que 250 €. La différence, 182 €, vient uniquement de la boule de neige.</p>
<h3>Pourquoi commencer le plus tôt possible</h3>
<p>La boule de neige a besoin d’une seule chose : du temps. Plus elle roule longtemps, plus elle grossit vite à la fin. Prenons Inès et Hugo. Chacun met 2 € de côté par semaine jusqu’à ses 18 ans, placés à 5 % par an. Inès commence à 6 ans, Hugo à 12 ans.</p>
${twoKids()}
<p>Inès a mis deux fois plus d’argent que Hugo, mais son argent lui a rapporté plus de quatre fois plus : 448 € contre 101 €. Ce n’est pas le montant qui a fait la différence, ce sont ses six années d’avance. Et la boule continue de rouler : 1 000 € laissés de côté à 18 ans deviennent environ 9 900 € à 65 ans, sans rien ajouter.</p>
<p>Une règle de poche pour le dîner : divisez 72 par le taux, vous obtenez le nombre d’années qu’il faut pour doubler votre argent. À 5 %, un peu plus de 14 ans.</p>
${keep(['Un placement, c’est de l’argent qui rapporte parce qu’on ne le dépense pas.', 'Les gains rapportent à leur tour : c’est l’effet boule de neige des intérêts composés.', 'Le temps compte plus que le montant : commencer tôt est le vrai super-pouvoir.'])}`,
      sources: [
        ['Dimson, Marsh et Staunton, Global Investment Returns Yearbook (UBS), synthèse 1900-2023', 'https://allnews.ch/node/118784'],
        ['Cambridge Judge Business School, 125 ans de rendements (2025)', 'https://www.jbs.cam.ac.uk/2025/report-stocks-have-far-outperformed-over-the-past-125-years/']
      ]
    },
    {
      id: 'notions', n: 3, theme: 'Ce que Pépite fait apprendre', min: 3,
      title: 'Cinq notions d’investisseur, apprises en jouant',
      lead: 'Épargne régulière, abondement, risque, intérêts composés, horizon de placement : les mots des grands, et la fonctionnalité de Pépite qui fait vivre chacun.',
      body: `
<div class="mech"><h4>L’épargne régulière</h4><p class="mdef">Mettre de côté une somme à intervalle fixe, plutôt qu’au hasard de ce qui reste en fin de mois.</p><p><b>Dans Pépite :</b> la paie en pièces. Chaque semaine, l’enfant range ses pièces une par une : dans le porte-monnaie pour dépenser, ou dans la tirelire pour placer. Il fait un vrai choix, 52 fois par an. C’est cette répétition qui transforme le geste en habitude.</p></div>
<div class="mech"><h4>L’abondement</h4><p class="mdef">Un complément versé par quelqu’un d’autre, souvent l’employeur, sur l’argent que vous épargnez.</p><p><b>Dans Pépite :</b> le bonus des parents. « Tu places 4 pièces, on t’en donne 1. » Il ne s’applique qu’à l’argent placé, jamais à celui qui part dans le porte-monnaie : l’enfant voit tout de suite qu’épargner rapporte plus que dépenser.</p></div>
<div class="mech"><h4>Le couple risque / rendement</h4><p class="mdef">Plus un placement peut rapporter, plus il peut aussi baisser. Moins de risque, c’est moins de surprises, mais aussi moins de gains.</p><p><b>Dans Pépite :</b> le dé de la bourse. Chaque semaine, l’enfant choisit son niveau de risque, puis lance le dé. En Prudent, il gagne peu mais ne perd presque jamais. En Aventurier, il peut gagner gros, mais il connaîtra de vraies semaines rouges. Équilibré est entre les deux, et « Je ne joue pas » ne rapporte rien mais ne risque rien. En moyenne, Prudent rapporte environ 5 % par an, Équilibré 11 % et Aventurier 17 % : c’est volontairement plus rapide que la vraie Bourse, pour voir en quelques mois ce qu’elle montre en plusieurs années.</p></div>
<div class="mech"><h4>Les intérêts composés</h4><p class="mdef">Les gains d’un placement rapportent à leur tour des gains : c’est l’effet boule de neige.</p><p><b>Dans Pépite :</b> la couche verte de la tirelire et l’onglet Futur. La couche verte montre tout ce que la bourse a rapporté, pertes déduites. Comme le dé joue sur toute la tirelire, elle grossit de plus en plus vite à mesure que la tirelire se remplit. Dans Futur, l’enfant compare ce qu’il aurait à 18 ans selon sa stratégie, pour le même argent placé chaque semaine.</p></div>
<div class="mech"><h4>L’horizon de placement</h4><p class="mdef">Le temps pendant lequel on accepte de ne pas toucher à son argent. Plus il est long, plus l’argent peut travailler.</p><p><b>Dans Pépite :</b> l’argent bloqué et le projet. L’argent placé ne se dépense pas sur un coup de tête : l’enfant se fixe un projet, franchit des paliers, puis le présente à ses parents pour le débloquer. Il apprend à attendre, et à convaincre.</p></div>
<h3>Attendre, ça s’apprend… si la promesse est tenue</h3>
<p>C’est l’une des expériences les plus célèbres de la psychologie. À la fin des années 1960, à l’université Stanford, le psychologue Walter Mischel pose un marshmallow devant un enfant de 4 ou 5 ans et lui propose un marché : il peut le manger tout de suite, ou attendre quelques minutes seul dans la pièce et en recevoir deux. Les enfants qui attendaient semblaient mieux réussir plus tard, et l’on en a longtemps conclu que la patience était un don.</p>
<p>La recherche a depuis nuancé. En 2018, l’expérience refaite avec plus de 900 enfants a trouvé un lien bien plus faible avec la réussite future (Watts, Duncan et Quan). Et en 2013, à l’université de Rochester, des chercheurs ont ajouté une étape juste avant le test : l’adulte faisait une petite promesse à l’enfant, de plus beaux crayons par exemple. Avec la moitié des enfants, il la tenait. Avec les autres, non. Les premiers ont ensuite attendu en moyenne 12 minutes devant le marshmallow, les seconds 3 minutes (Kidd, Palmeri et Aslin). La patience dépend d’abord de la confiance.</p>
<p>C’est pour cela que Pépite tient un registre : chaque pièce est notée, chaque bonus calculé, rien ne se perd. L’enfant attend parce qu’il sait que ce qui est promis arrive.</p>
${keep(['Chaque fonctionnalité de Pépite entraîne un vrai réflexe d’investisseur.', 'Ce qu’on fait de ses mains, on le comprend mieux.', 'La patience s’apprend quand la promesse est tenue : c’est le rôle du registre.'])}`,
      sources: [
        ['Watts, Duncan et Quan (2018), Psychological Science, présentation APS', 'https://www.psychologicalscience.org/publications/observer/obsonline/a-new-approach-to-the-marshmallow-test-yields-complex-findings.html'],
        ['Kidd, Palmeri et Aslin (2013), Rational snacking, Cognition', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3730121/'],
        ['Université de Rochester, communiqué sur l’étude Kidd et al.', 'https://www.rochester.edu/news/printable.php?id=4622']
      ]
    },
    {
      id: 'rythme', n: 4, theme: 'Le bon rythme', min: 4,
      title: 'Quand commencer, combien donner ?',
      lead: 'Notre proposition tient en une ligne : on commence à 6 ans avec 1,50 € par semaine, et on ajoute 50 centimes à chaque anniversaire. Voici pourquoi, et pourquoi vous restez libre de tout.',
      body: `
<h3>Pourquoi 6 ans ?</h3>
<p>Avant 6 ans, un enfant ne mesure pas encore vraiment la valeur de l’argent, rappelle La finance pour tous. À 6 ans, il entre au CP, apprend à compter et comprend qu’une pièce s’échange contre quelque chose : c’est le bon moment pour lui confier sa première paie. Et l’essentiel des habitudes d’argent est en place dès 7 ans (Université de Cambridge, 2013) : commencer à 6 ans, c’est installer le rituel juste avant que tout se fige.</p>
<h3>La grille Pépite</h3>
${grid()}
<p>Est-ce la norme ? Les repères publiés vont dans le même sens. La finance pour tous, le site de l’Institut pour l’éducation financière du public, suggère 1 à 2 € par semaine dès 6 ans. Le canton de Fribourg, en Suisse, conseille 1 franc par semaine à 6 ans, 2 à 7 ans, 3 à 8 ans. À l’adolescence, les montants observés en France sont un peu plus élevés : 20 € par mois en moyenne entre 10 et 12 ans, 34 € entre 16 et 18 ans (baromètre Pixpay 2025), souvent parce qu’ils couvrent déjà des dépenses du quotidien.</p>
<p>Les repères varient du simple au double selon les sources et les familles. Notre grille se tient volontairement dans le bas de la fourchette : avec le bonus et la bourse, la tirelire grossit plus vite que la paie. Et le montant compte moins que la régularité.</p>
<h3>Pourquoi chaque semaine ?</h3>
<p>Pour un enfant de 6 ans, un mois est une éternité. Une semaine, il la voit passer. C’est pourquoi les recommandations suisses ne passent au versement mensuel que vers 10 ans. Dans Pépite, il y a une paie par semaine, à ranger le jour qui vous arrange : le mercredi, le samedi, peu importe. L’idéal est de garder le même jour : un rendez-vous fixe devient vite un petit rituel.</p>
<h3>Vous donnez quand vous voulez</h3>
<p>Pas besoin de sortir une pièce chaque semaine. Pépite ne prélève rien et ne vous impose aucun calendrier : l’appli tient les comptes, vous réglez à votre rythme. Chaque semaine, une fois par mois, au retour des vacances. Dans l’espace parents, deux compteurs font le point : le porte-monnaie à donner (ce qu’il a choisi de dépenser) et la tirelire à mettre de côté (ce qu’il a placé, à ranger sur un Livret A à son nom, un compte épargne ou une boîte fermée). L’enfant vit sa paie chaque semaine. Vous, vous gérez la trésorerie.</p>
<p>Une dispute, une bêtise ? La paie peut être mise en pause, avec un petit mot. La tirelire, elle, reste à lui.</p>
<h3>Et les tâches ménagères ?</h3>
<p>Les avis divergent, et La finance pour tous ne tranche pas : elle suggère de combiner l’argent donné sans contrepartie et l’argent gagné. Notre parti pris : la paie Pépite est un apprentissage, pas un salaire. Si un vrai coup de main mérite récompense, il s’ajoute en « argent reçu ».</p>
<h3>La règle d’or : tenir parole</h3>
<p>Les chercheurs de Rochester l’ont montré : un enfant patiente quand il a confiance (Kidd et al., 2013). Une paie qui tombe toujours, un bonus toujours versé, un projet débloqué dès qu’il est atteint. C’est la fiabilité des parents qui fabrique la patience des enfants.</p>
${keep(['On démarre à 6 ans avec 1,50 € par semaine, puis 50 centimes de plus par an.', 'La régularité compte plus que le montant.', 'Pépite suit la paie chaque semaine, vous réglez quand vous voulez.'])}`,
      sources: [
        ['La finance pour tous (IEFP), L’argent de poche', 'https://www.lafinancepourtous.com/p/parler-d-argent-avec-ses-enfants/largent-de-poche/'],
        ['État de Fribourg, Faut-il donner de l’argent de poche aux enfants ?', 'https://www.fr.ch/sante/prevention-et-promotion/sante-et-prevention-a-lecole-informations-pour-les-parents/faut-il-donner-de-largent-de-poche-aux-enfants'],
        ['La finance pour tous, baromètre Pixpay 2025 sur l’argent de poche des ados', 'https://www.lafinancepourtous.com/2025/09/08/argent-de-poche-des-adolescents-26-euros-par-mois-en-baisse-de-10-en-2025/'],
        ['Université de Cambridge et Money Advice Service (2013)', 'https://www.yourmoney.com/investing/adult-money-habits-are-set-by-the-age-of-seven'],
        ['Kidd, Palmeri et Aslin (2013), Rational snacking, Cognition', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3730121/']
      ]
    },
    {
      id: 'fonctions', n: 5, theme: 'Les fonctionnalités', min: 3,
      title: 'Pépite, mode d’emploi en images',
      lead: 'Tout ce que fait l’appli, écran par écran.',
      body: () => features(h).map((x, i) => `<h3>${i + 1}. ${x.title}</h3>\n<p>${x.long}</p>\n${demo(x.visual, x.cap)}`).join('\n') + `
<h3>${features(h).length + 1}. Et aussi</h3>
<p>La paie mise en pause en cas de conflit, avec un message pour l’enfant. L’onglet Futur qui projette la tirelire jusqu’à ses 18\u00a0ans. Le carnet qui garde tout l’historique. Plusieurs enfants, chacun sa couleur. Un mode sombre. Et un bouton pour annuler la dernière opération quand quelqu’un s’est trompé.</p>`,
      sources: []
    }
  ];
}


/* ---------- Leçons pour les enfants (versions vulgarisées des articles parents) ---------- */
// Bonus illustré selon le taux réel de la famille : n pièces placées, g offertes
export function bonusPlan(m) {
  if (!(m > 0)) return null;
  for (let n = 1; n <= 10; n++) { const g = n * m / 100; if (Number.isInteger(g) && g >= 1) return { n, g }; }
  return null;
}
export function bonusVis(h, m) {
  const p = bonusPlan(m); if (!p) return '';
  const w = p.n > 6 || p.g > 6 ? 38 : 50;
  const many = k => `<div class="bcoins" style="grid-template-columns:repeat(${Math.min(k, k > 4 ? Math.ceil(k / 2) : 2)},${w}px)">${Array.from({ length: k }, () => h.coinEl(1)).join('')}</div>`;
  return `<div class="bonusdemo${w < 50 ? ' sm' : ''}">${many(p.n)}<span class="bplus">+</span><div class="bgift">${many(p.g)}<small>${p.g > 1 ? 'offertes' : 'offerte'} par les parents</small></div></div>`;
}
export function lessons(h) {
  const bonusTxt = h.bonusKid(h.match), fe = features(h);
  h = { ...h, demo, payDemo: fe[0].visual, bonusDemo: fe[2].visual, diceDemo: fe[3].visual, nugDemo: fe[5].visual, kidsDemo: twoKids() };
  return [
    { id: 'epargne', n: 1, term: 'L’épargne', title: 'Pourquoi garder de l’argent pour plus tard ?',
      intro: 'Ton argent a deux maisons : le porte-monnaie et la tirelire. Chacune a son rôle.',
      body: `<p>Le <b>porte-monnaie</b>, c’est pour maintenant : un goûter, une petite surprise, un cadeau pour un copain.</p>
<p>La <b>tirelire</b>, c’est pour plus tard : quelque chose de plus grand, que tu ne pourrais pas acheter avec une seule paie.</p>
${h.demo(h.payDemo, 'Une pièce gardée pour maintenant, deux pièces mises de côté.')}
<p>Garder un peu d’argent pour plus tard, ça s’appelle <b>épargner</b>. Pas besoin de tout mettre de côté : l’important, c’est de le faire un peu chaque semaine. C’est comme le brossage des dents, ça devient une habitude.</p>`,
      know: 'Un adulte sur quatre en France ne met pas du tout d’argent de côté. Toi, tu apprends dès maintenant !',
      quiz: { q: 'Tu rêves d’une trottinette à 60 € et ta paie est de 2 € par semaine. Que fais-tu ?', a: ['Je dépense toute ma paie chaque semaine', 'Je mets une partie dans ma tirelire chaque semaine'], ok: 1, yes: 'Bravo ! Semaine après semaine, ta tirelire grossit jusqu’à la trottinette.', no: 'Si tu dépenses tout, ta tirelire reste vide et la trottinette ne viendra jamais.' },
      act: ['paie', 'Ranger ma paie'] },
    { id: 'bonus', n: 2, term: 'L’abondement', title: 'Le bonus : des pièces en cadeau',
      intro: 'Quand tu mets des pièces dans ta tirelire, on t’en ajoute. C’est le bonus !',
      body: `<p>${h.match > 0 ? `Voici la règle chez toi : <b>${bonusTxt}</b>.` : 'Chez toi, tes parents n’ont pas encore mis de bonus. Mais voici comment ça marche.'}</p>
${(() => { const p = bonusPlan(h.match); return p ? h.demo(bonusVis(h, h.match), `${p.n} pièce${p.n > 1 ? 's' : ''} placée${p.n > 1 ? 's' : ''}, ${p.g} pièce${p.g > 1 ? 's' : ''} offerte${p.g > 1 ? 's' : ''}.`) : ''; })()}
<p>Pourquoi ? Pour te récompenser d’avoir pensé à plus tard. Attention : l’argent que tu mets dans ton porte-monnaie, lui, n’a pas de bonus.</p>
<p>Chez les grands, ça existe aussi : certaines entreprises ajoutent de l’argent quand leurs employés en mettent de côté. Ça s’appelle <b>l’abondement</b>. Tu connais déjà un mot de grand !</p>`,
      know: 'Le bonus, c’est de l’argent gagné sans rien faire de plus : juste en choisissant la tirelire.',
      quiz: { q: 'Sur quel argent reçois-tu un bonus ?', a: ['L’argent du porte-monnaie', 'L’argent de la tirelire', 'Les deux'], ok: 1, yes: 'Exact ! Le bonus récompense l’argent que tu gardes pour plus tard.', no: 'Pas tout à fait : le bonus ne tombe que sur l’argent mis dans la tirelire.' },
      act: ['paie', 'Voir mon bonus'] },
    { id: 'risque', n: 3, term: 'Le risque et le rendement', title: 'Le dé : prudent ou aventurier ?',
      intro: 'Avec la bourse, ton argent peut grossir… ou rétrécir un peu. À toi de choisir jusqu’où tu oses aller.',
      body: `<p><b>Prudent</b> : tu gagnes un tout petit peu, et tu ne perds presque jamais.</p>
<p><b>Aventurier</b> : tu peux gagner gros, mais certaines semaines, tu perds vraiment.</p>
<p><b>Équilibré</b> : entre les deux.</p>
<p><b>Je ne joue pas</b> : rien ne bouge, ni gain ni perte.</p>
${h.demo(h.diceDemo, 'Avec 100 € : les faces vertes font gagner, les rouges font perdre.')}
<p>Voici la règle d’or de l’argent : <b>plus tu peux gagner gros, plus tu peux perdre gros</b>. Les grands appellent ça <b>le risque et le rendement</b>.</p>
<p>Et une mauvaise semaine, ce n’est pas grave : ce qui compte, c’est toute l’année.</p>`,
      know: 'Même les champions de la Bourse ont des mauvaises semaines. Ils ne paniquent pas : ils attendent.',
      quiz: { q: 'Quelle stratégie peut te faire perdre le plus ?', a: ['Prudent', 'Équilibré', 'Aventurier'], ok: 2, yes: 'Oui ! Aventurier peut rapporter le plus… et faire perdre le plus.', no: 'Non : c’est Aventurier, la stratégie qui ose le plus.' },
      act: ['bourse', 'Aller à la bourse'] },
    { id: 'composes', n: 4, term: 'Les intérêts composés', title: 'La boule de neige de l’argent',
      intro: 'Imagine une boule de neige qui roule : plus elle est grosse, plus elle ramasse de neige. L’argent placé fait pareil.',
      body: `<p>Quand le dé te fait gagner, ce gain reste dans ta tirelire. La semaine d’après, le dé joue aussi sur lui : ton gain peut gagner à son tour !</p>
<p>C’est la <b>couche verte</b> de ta tirelire. Plus ta tirelire est pleine, plus elle grossit vite. Les grands appellent ça <b>les intérêts composés</b>.</p>
<p>Et le temps est ton super-pouvoir.</p>
<p>Prenons l’exemple de deux enfants, Inès et Hugo. Ils mettent la même chose de côté chaque semaine. Inès commence à 6 ans, Hugo à 12 ans :</p>
${h.kidsDemo}
<p>Inès a gagné <b>quatre fois plus</b> que Hugo, juste parce qu’elle a commencé plus tôt. Ce n’est pas le montant qui compte le plus, c’est le temps.</p>`,
      know: 'Toi, tu commences avant tes 18 ans. Beaucoup de grands n’ont commencé qu’à 35 ans !',
      quiz: { q: 'Qui gagne le plus avec la boule de neige ?', a: ['Celui qui commence tôt', 'Celui qui commence tard'], ok: 0, yes: 'Oui ! Plus la boule roule longtemps, plus elle grossit.', no: 'Non : celui qui commence tôt laisse plus de temps à sa boule de neige.' },
      act: ['futur', 'Voir mon futur'] },
    { id: 'patience', n: 5, term: 'L’horizon de placement', title: 'Attendre pour avoir mieux',
      intro: 'Un jour, un savant a proposé un marché à des enfants : un bonbon tout de suite, ou deux bonbons s’ils attendaient quelques minutes. Toi, tu aurais fait quoi ?',
      body: `<p>Ta tirelire, c’est un peu pareil : l’argent que tu laisses travailler longtemps grossit plus que celui que tu dépenses tout de suite.</p>
<p>C’est pour ça que l’argent de ta tirelire est <b>bloqué</b>. Pour le récupérer, tu choisis un projet. À chaque étape, ta pépite grossit :</p>
${h.demo(h.nugDemo, 'De la petite pépite à « C’est pépite ! »')}
<p>Quand ton projet est atteint, tu le présentes à tes parents : pourquoi tu le veux, combien il coûte, ce qu’il va t’apporter. S’ils sont convaincus, ils débloquent ton argent.</p>
<p>Le temps pendant lequel on ne touche pas à son argent, les grands l’appellent <b>l’horizon de placement</b>.</p>`,
      know: 'Pas d’idée de projet ? Pas grave : ta tirelire grossit quand même. Certains commencent même à mettre de côté pour leur permis de conduire !',
      quiz: { q: 'Que dois-tu faire pour récupérer l’argent de ta tirelire ?', a: ['Le prendre quand je veux', 'Présenter mon projet à mes parents'], ok: 1, yes: 'C’est ça ! Un projet bien expliqué débloque ton argent.', no: 'Non : l’argent de la tirelire attend ton projet, c’est ce qui le fait grossir.' },
      act: ['projet', 'Voir mon projet'] },
    { id: 'bourse', n: 6, term: 'La Bourse', title: 'C’est quoi, la vraie Bourse ?',
      intro: 'Ton dé imite quelque chose qui existe pour de vrai : la Bourse. Voici comment elle marche.',
      body: `<p>Pense à une entreprise que tu connais : celle qui fabrique tes céréales, tes baskets ou ton jeu vidéo préféré. Pour grandir, elle a besoin d’argent.</p>
<p>Alors elle se découpe en tout petits morceaux, appelés <b>actions</b>, que tout le monde peut acheter. Avoir une action, c’est posséder un minuscule bout de l’entreprise !</p>
<p>Si l’entreprise marche bien, ton morceau vaut plus cher. Si elle a des difficultés, il peut baisser. <b>La Bourse</b>, c’est le grand marché où l’on achète et vend ces morceaux.</p>
<p>Il existe aussi des placements qui ne baissent jamais, comme le <b>Livret A</b> à la banque. Mais ils grossissent très lentement. Sur de longues années, la Bourse a rapporté beaucoup plus, avec des hauts et des bas. Exactement comme ton dé.</p>`,
      know: 'Ton dé est plus rapide que la vraie Bourse : il montre en quelques mois ce qu’elle met des années à faire.',
      quiz: { q: 'Une action, c’est…', a: ['Un petit morceau d’entreprise', 'Un jeu de cartes', 'Une pièce de monnaie spéciale'], ok: 0, yes: 'Exactement ! Avec une action, tu possèdes un minuscule bout d’entreprise.', no: 'Non : une action, c’est un petit morceau d’une entreprise.' },
      act: ['bourse', 'Aller à la bourse'] }
  ];
}
