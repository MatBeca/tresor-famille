/* « Toi, parent » : les articles qui expliquent le sens de Pépite.
   Les visuels de l'article 4 sont fabriqués avec les composants de l'appli (h = helpers),
   ils suivent donc le design au fil des versions. */

const fig = (n, t) => `<div class="fig"><b>${n}</b><span>${t}</span></div>`;
const keep = items => `<div class="keep"><h4>À retenir</h4><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
const demo = (html, cap) => `<figure class="demo"><div class="demoin" inert aria-hidden="true">${html}</div><figcaption>${cap}</figcaption></figure>`;
const eur = v => v.toFixed(2).replace('.', ',') + ' €';

function compoundChart() {
  const rows = [[0, 100, 100], [10, 150, 163], [20, 200, 265], [30, 250, 432]];
  return `<div class="cchart" role="img" aria-label="100 € à 5 % par an : 250 € en intérêts simples, 432 € en intérêts composés au bout de 30 ans">
${rows.map(([y, s, c]) => `<div class="ccol"><div class="cbars"><i class="cs" style="height:${(s / 432 * 100).toFixed(1)}%"><em>${s} €</em></i><i class="cc" style="height:${(c / 432 * 100).toFixed(1)}%"><em>${c} €</em></i></div><span>${y ? y + ' ans' : 'Départ'}</span></div>`).join('')}
</div><p class="clegend"><span><i class="cs"></i>Intérêts simples</span><span><i class="cc"></i>Intérêts composés</span></p>`;
}

function grid() {
  const ages = [5, 6, 7, 8, 10, 12, 15, 17];
  return `<table class="agrid"><thead><tr><th>Âge</th><th>Par semaine</th><th>Soit par mois</th></tr></thead><tbody>${ages.map(a => { const w = 1 + 0.5 * (a - 5); return `<tr><td>${a} ans</td><td><b>${eur(w)}</b></td><td>${eur(w * 52 / 12)}</td></tr>`; }).join('')}</tbody></table>`;
}

export function articles(h) {
  return [
    {
      id: 'pedagogie', n: 1, theme: 'La pédagogie', min: 3,
      title: 'On ne nous a pas appris l’argent. Eux, si.',
      lead: 'À l’école, on apprend à calculer l’aire d’un trapèze. Personne ne nous apprend à faire travailler 100 €. Résultat : un pays qui épargne beaucoup… et investit peu.',
      body: `
<div class="figs">${fig('12,8/20', 'la note de culture financière des Français')}${fig('4 sur 10', 'foyers sans aucun produit d’investissement')}${fig('7 sur 10', 'Français jugent la Bourse réservée aux initiés')}</div>
<h3>De bons épargnants, de mauvais investisseurs</h3>
<p>Mettre de côté, les Français savent faire. Mais cet argent dort surtout là où il ne risque rien, et où il ne rapporte presque rien. Selon l’Autorité des marchés financiers, 4 foyers sur 10 ne détiennent aucun produit d’investissement. Et 7 Français sur 10 estiment que les actions sont réservées « à des gens qui s’y connaissent ». Ce n’est pas un manque d’intelligence : c’est un manque d’apprentissage. Interrogés avec le questionnaire de l’OCDE, les Français obtiennent 12,8 sur 20 en culture financière ; lors de la dernière comparaison internationale, la France se classait 14e sur 39 pays.</p>
<h3>Le piège de l’argent « en sécurité »</h3>
<p>Depuis août 2026, le Livret A rapporte 1,7 % par an. Or en octobre 2026, les prix avaient augmenté de 3,4 % sur un an (Insee). Traduction : 1 000 € placés gagnent 17 € en un an, pendant que ce qu’ils permettent d’acheter coûte 34 € de plus. L’argent « en sécurité » recule sans faire de bruit. Le Livret A reste parfait pour l’épargne de précaution. Pour préparer l’avenir lointain, il ne suffit pas.</p>
<h3>Et la retraite de nos enfants ?</h3>
<p>Le Conseil d’orientation des retraites prévoit que la pension moyenne passera de 54,6 % du revenu moyen des actifs en 2025 à 45,3 % en 2070. Nos enfants partiront à la retraite vers 2085. Ils auront besoin d’un complément construit par eux-mêmes, et pour cela une ressource compte plus que toutes les autres : le temps. Or le temps, c’est précisément ce qu’ils ont.</p>
<h3>Pourquoi commencer par les enfants</h3>
<p>Une étude de l’Université de Cambridge pour le Money Advice Service britannique conclut que l’essentiel de nos habitudes d’argent se forme avant 7 ans. Et dans les pays évalués par l’OCDE, les élèves de 15 ans les plus solides en culture financière sont 72 % plus susceptibles d’épargner que les plus faibles (PISA 2022). Ce qu’on apprend tôt, on le garde.</p>
<p>Pépite part de là. Pas de cours magistral : une paie, des choix, un dé, un projet. L’enfant fait, se trompe pour 2 €, recommence. Il apprend à 8 ans ce que beaucoup d’adultes découvrent à 40, le jour où une erreur coûte 20 000 €.</p>
<blockquote>On ne peut pas rattraper ce qu’on ne nous a pas appris. On peut changer ce qu’on leur apprend.</blockquote>
${keep(['L’épargne des Français dort, et l’inflation la grignote.', 'Les retraites vont baisser par rapport aux salaires : le temps sera leur meilleur allié.', 'Les habitudes d’argent se prennent avant 7 ans. Pépite en fait un jeu.'])}
<p class="note">Pépite est un terrain d’entraînement, pas un placement : les gains du jeu sont payés par les parents.</p>`,
      sources: [
        ['Banque de France, Semaine de l’éducation financière 2026 (enquête CSA, questionnaire OCDE)', 'https://www.banque-france.fr/fr/communiques-de-presse/semaine-de-leducation-financiere-une-mobilisation-nationale-portee-par-la-banque-de-france-et-les'],
        ['Banque de France, enquête 2023 sur la culture financière (classement OCDE)', 'https://www.banque-france.fr/fr/communiques-de-presse/la-culture-financiere-des-francais-sameliore-progressivement-dapres-de-nouvelles-etudes-menees-par'],
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
      id: 'interets', n: 2, theme: 'Les intérêts composés', min: 4,
      title: 'Quand l’argent fait des petits',
      lead: 'C’est le mécanisme le plus puissant de la finance, et il tient en une phrase : les gains rapportent à leur tour des gains. Pépite est construite pour qu’un enfant le voie de ses propres yeux.',
      body: `
<h3>Simple contre composé</h3>
<p>Placez 100 € à 5 % par an. Si l’on vous verse vos 5 € chaque année sans les réinvestir, vous aurez 250 € au bout de 30 ans. Si les gains restent placés et rapportent à leur tour, vous aurez 432 €. Même départ, même taux : 182 € d’écart, uniquement grâce au temps.</p>
${compoundChart()}
<p>Une règle de poche pour le dîner : divisez 72 par le taux, vous obtenez le nombre d’années pour doubler votre mise. À 5 %, un peu plus de 14 ans.</p>
<h3>Le vrai super-pouvoir : commencer tôt</h3>
<p>Inès et Hugo placent 2 € par semaine jusqu’à leurs 18 ans, à 5 % par an. Inès commence à 6 ans, Hugo à 12. Inès a versé deux fois plus (1 248 € contre 624 €), mais ses gains sont plus de quatre fois plus gros : 448 € contre 101 €. Et 1 000 € laissés de côté à 18 ans deviennent environ 9 900 € à 65 ans au même rythme, sans rien ajouter.</p>
<p>Pourquoi 5 % ? Parce que c’est un ordre de grandeur honnête : de 1900 à 2023, les actions mondiales ont rapporté en moyenne 5,1 % par an après inflation (Global Investment Returns Yearbook). En moyenne seulement, avec des années à −30 %. D’où le dé.</p>
<h3>Ce que Pépite fait apprendre</h3>
<div class="mech"><h4>La paie en pièces</h4><p>Chaque lundi, l’enfant range ses pièces une par une : porte-monnaie ou tirelire. Il ne subit pas une règle, il arbitre. Et il recommence 52 fois par an : c’est la répétition qui fait l’habitude.</p></div>
<div class="mech"><h4>Le bonus des parents</h4><p>« Tu places 4 pièces, on t’en donne 1. » C’est l’abondement, le même mécanisme que l’employeur qui complète un plan d’épargne salariale. Il ne s’applique qu’à l’argent placé : épargner devient visiblement plus intéressant que dépenser.</p></div>
<div class="mech"><h4>Le dé de la bourse</h4><p>Chaque semaine, un lancer fait monter ou baisser la tirelire. Trois stratégies, plus le droit de ne pas jouer. L’enfant compte les faces vertes et rouges et découvre seul que plus on peut gagner, plus on peut perdre. Le jeu est volontairement accéléré : en moyenne, Prudent rapporte environ 5 % par an, Équilibré 11 % et Aventurier 17 %, avec de vraies semaines de pertes. On voit en mois ce que la vraie Bourse montre en décennies.</p></div>
<div class="mech"><h4>La couche verte</h4><p>Dans la tirelire, trois couleurs : son argent, le bonus, et ce qui a été gagné tout seul. Ce vert qui épaissit, c’est l’intérêt composé rendu visible. L’onglet Futur montre jusqu’où il peut monter si l’enfant continue.</p></div>
<div class="mech"><h4>L’argent bloqué, le projet présenté</h4><p>L’argent placé ne se dépense pas sur un coup de tête. Pour le récupérer, l’enfant se fixe un projet, franchit des paliers, puis le présente à ses parents : pourquoi, combien, ce que ça va lui apporter. Il apprend à attendre et à convaincre.</p></div>
<h3>Attendre, ça s’apprend… si la promesse est tenue</h3>
<p>Le célèbre test du marshmallow a longtemps fait croire que la patience était un don. La recherche a nuancé. En 2018, une réplication sur plus de 900 enfants a trouvé des liens bien plus faibles avec la réussite future (Watts, Duncan et Quan). Et en 2013, des chercheurs de l’Université de Rochester ont montré que des enfants à qui l’on avait tenu parole attendaient en moyenne 12 minutes, contre 3 pour ceux à qui l’on avait fait faux bond (Kidd, Palmeri et Aslin). La patience dépend d’abord de la confiance.</p>
<p>C’est pour cela que Pépite tient un registre : chaque pièce est notée, chaque bonus calculé, rien ne se perd. L’enfant attend parce qu’il sait que ce qui est promis arrive.</p>
${keep(['Les gains qui restent placés rapportent à leur tour : c’est l’intérêt composé.', 'Commencer tôt compte plus que mettre beaucoup.', 'Chaque mécanisme de Pépite (paie, bonus, dé, couche verte, projet) entraîne un réflexe d’investisseur.'])}`,
      sources: [
        ['Dimson, Marsh et Staunton, Global Investment Returns Yearbook (UBS), synthèse 1900-2023', 'https://allnews.ch/node/118784'],
        ['Cambridge Judge Business School, 125 ans de rendements (2025)', 'https://www.jbs.cam.ac.uk/2025/report-stocks-have-far-outperformed-over-the-past-125-years/'],
        ['Watts, Duncan et Quan (2018), Psychological Science, présentation APS', 'https://www.psychologicalscience.org/publications/observer/obsonline/a-new-approach-to-the-marshmallow-test-yields-complex-findings.html'],
        ['Kidd, Palmeri et Aslin (2013), Rational snacking, Cognition', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3730121/'],
        ['Université de Rochester, communiqué sur l’étude Kidd et al.', 'https://www.rochester.edu/news/printable.php?id=4622']
      ]
    },
    {
      id: 'rythme', n: 3, theme: 'Le bon rythme', min: 4,
      title: 'Quand commencer, combien donner ?',
      lead: 'Notre proposition tient en une ligne : on commence à 5 ans avec 1 € par semaine, et on ajoute 50 centimes à chaque anniversaire. Voici pourquoi, et pourquoi vous restez libre de tout.',
      body: `
<h3>Pourquoi dès 5 ans ?</h3>
<p>Avant 6 ans, un enfant ne mesure pas encore vraiment la valeur de l’argent, rappelle La finance pour tous. C’est justement l’intérêt de commencer à 5 ans : on apprend d’abord les gestes, ranger, attendre, choisir, avec une seule pièce. Quand la valeur des choses devient claire, vers 6 ou 7 ans, le rituel est déjà installé. Or c’est avant 7 ans que se forme l’essentiel des habitudes d’argent (Université de Cambridge, 2013). Deux ans d’entraînement avant que tout se fige : c’est le bon moment.</p>
<h3>La grille Pépite</h3>
${grid()}
<p>Est-ce la norme ? Les repères publiés vont dans le même sens. La finance pour tous, le site de l’Institut pour l’éducation financière du public, suggère 1 à 2 € par semaine dès 6 ans. Le canton de Fribourg, en Suisse, conseille 1 franc par semaine à 6 ans, 2 à 7 ans, 3 à 8 ans. À l’adolescence, les montants observés en France sont un peu plus élevés : 20 € par mois en moyenne entre 10 et 12 ans, 34 € entre 16 et 18 ans (baromètre Pixpay 2025), souvent parce qu’ils couvrent déjà des dépenses du quotidien.</p>
<p>Les repères varient du simple au double selon les sources et les familles. Notre grille se tient volontairement dans le bas de la fourchette : avec le bonus et la bourse, la tirelire grossit plus vite que la paie. Et le montant compte moins que la régularité.</p>
<h3>Pourquoi chaque semaine ?</h3>
<p>Pour un enfant de 6 ans, un mois est une éternité. Une semaine, il la voit passer. C’est pourquoi les recommandations suisses ne passent au versement mensuel que vers 10 ans. Dans Pépite, la paie tombe chaque lundi : un rendez-vous fixe, un petit rituel.</p>
<h3>Vous donnez quand vous voulez</h3>
<p>Pas besoin de sortir une pièce chaque lundi. Pépite ne prélève rien et ne vous impose aucun calendrier : l’appli tient les comptes, vous réglez à votre rythme. Chaque semaine, une fois par mois, au retour des vacances. Dans l’espace parents, deux compteurs font le point : le porte-monnaie à donner (ce qu’il a choisi de dépenser) et la tirelire à mettre de côté (ce qu’il a placé, à ranger sur un Livret A à son nom, un compte épargne ou une boîte fermée). L’enfant vit sa paie chaque semaine. Vous, vous gérez la trésorerie.</p>
<p>Une dispute, une bêtise ? La paie peut être mise en pause, avec un petit mot. La tirelire, elle, reste à lui.</p>
<h3>Et les tâches ménagères ?</h3>
<p>Les avis divergent, et La finance pour tous ne tranche pas : elle suggère de combiner l’argent donné sans contrepartie et l’argent gagné. Notre parti pris : la paie Pépite est un apprentissage, pas un salaire. Si un vrai coup de main mérite récompense, il s’ajoute en « argent reçu ».</p>
<h3>La règle d’or : tenir parole</h3>
<p>Les chercheurs de Rochester l’ont montré : un enfant patiente quand il a confiance (Kidd et al., 2013). Une paie qui tombe toujours, un bonus toujours versé, un projet débloqué dès qu’il est atteint. C’est la fiabilité des parents qui fabrique la patience des enfants.</p>
${keep(['On démarre à 5 ans avec 1 € par semaine, puis 50 centimes de plus par an.', 'La régularité compte plus que le montant.', 'Pépite suit la paie chaque semaine, vous réglez quand vous voulez.'])}`,
      sources: [
        ['La finance pour tous (IEFP), L’argent de poche', 'https://www.lafinancepourtous.com/p/parler-d-argent-avec-ses-enfants/largent-de-poche/'],
        ['État de Fribourg, Faut-il donner de l’argent de poche aux enfants ?', 'https://www.fr.ch/sante/prevention-et-promotion/sante-et-prevention-a-lecole-informations-pour-les-parents/faut-il-donner-de-largent-de-poche-aux-enfants'],
        ['La finance pour tous, baromètre Pixpay 2025 sur l’argent de poche des ados', 'https://www.lafinancepourtous.com/2025/09/08/argent-de-poche-des-adolescents-26-euros-par-mois-en-baisse-de-10-en-2025/'],
        ['Université de Cambridge et Money Advice Service (2013)', 'https://www.yourmoney.com/investing/adult-money-habits-are-set-by-the-age-of-seven'],
        ['Kidd, Palmeri et Aslin (2013), Rational snacking, Cognition', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3730121/']
      ]
    },
    {
      id: 'fonctions', n: 4, theme: 'Les fonctionnalités', min: 3,
      title: 'Pépite, mode d’emploi en images',
      lead: 'Tout ce que fait l’appli, écran par écran. Les aperçus ci-dessous sont dessinés par l’appli elle-même : ils évoluent avec elle.',
      body: () => {
        const t = { own: 40, bonus: 10, gains: 6, total: 56 };
        const faces = [-1.5, -0.5, 0, 0.5, 1, 1.7].map(x => Math.round(50 * x) / 100);
        return `
<h3>1. La paie, pièce par pièce</h3>
<p>Chaque lundi, la paie arrive en pièces de 1 €. L’enfant les range une par une : dans son porte-monnaie pour les dépenser, ou dans sa tirelire pour les placer. Le bonus s’affiche aussitôt sur les pièces placées. S’il a oublié une semaine, ses paies l’attendent jusqu’à quatre semaines.</p>
${demo(`<div class="tray">${h.coinEl(1)}</div><div class="zones"><div class="zone"><strong>Mon porte-monnaie : 1,00 €</strong>${h.coinEl(1)}</div><div class="zone gz"><strong class="g">Ma tirelire : 2,00 €</strong>${h.coinEl(1)}${h.coinEl(1)}<span class="chip">+0,50 €</span></div></div>`, 'Deux pièces placées, une gardée : le bonus apparaît tout de suite.')}
<h3>2. La tirelire à trois couches</h3>
<p>Son argent, le bonus des parents, ce qui a été gagné tout seul : trois couleurs empilées pour comparer d’un coup d’œil. Quand l’objectif est atteint, le bocal s’illumine.</p>
${demo(`<div class="demojar">${h.jar(t, { budget: 100 }).svg}<div class="tiles"><div class="tile"><small><i style="background:var(--kid)"></i>Mon argent</small><b>${h.f(40)}</b></div><div class="tile"><small><i style="background:var(--gold)"></i>Bonus</small><b>${h.f(10)}</b></div><div class="tile"><small><i style="background:var(--grow)"></i>Gagné tout seul</small><b class="g">${h.f(6)}</b></div></div></div>`, 'La tirelire telle que la voit l’enfant.')}
<h3>3. Un projet, des paliers, une pépite qui grandit</h3>
<p>Un vélo, un jeu, une sortie : l’enfant fixe son objectif. À chaque palier (25, 50, 75 %), sa pépite prend une taille. Objectif atteint ? Il présente son projet, et vous débloquez l’argent depuis l’espace parents. Sans projet, les paliers suivent les seuils de la tirelire.</p>
${demo(`<div class="nugrow">${[0, 25, 50, 75, 100].map(p => h.growNug(p)).join('')}</div>`, 'De la petite pépite à « C’est pépite ! »')}
<h3>4. La bourse au dé</h3>
<p>Une fois par semaine, l’enfant choisit sa stratégie puis lance le dé. Chaque face affiche ce qu’elle ferait gagner ou perdre sur sa vraie tirelire, sans un seul pourcentage. « Je ne joue pas » est un choix respecté.</p>
${demo(`<div class="post on" style="pointer-events:none"><span class="ph"><b>Équilibré</b></span><span class="dfaces">${faces.map((x, i) => `<span class="df ${x > 0 ? 'up' : x < 0 ? 'dn' : ''}">${h.miniDie(i + 1, x > 0 ? '#13a05a' : x < 0 ? '#e0434f' : '#a39cb8')}<b>${h.eurS(x)}</b></span>`).join('')}</span><span class="pr"><span class="g">3 faces sur 6 font gagner</span> · 1 ne change rien · <span class="neg">2 font perdre</span></span></div>`, 'Avec une tirelire de 50 € : on compte les faces, on choisit.')}
<h3>5. « J’ai reçu de l’argent »</h3>
<p>Un billet de mamie, un anniversaire ? L’enfant l’ajoute lui-même et choisit : tout dépenser, moitié-moitié ou tout placer. Vous décidez si l’argent reçu a droit à un bonus, et à combien.</p>
${demo(`<div class="item"><span class="ic" style="background:color-mix(in srgb,var(--grow) 14%,transparent);color:var(--grow)">${h.I.gift}</span><span><b>J’ai reçu de l’argent</b><small>Un cadeau, un anniversaire ?</small></span><span class="end">${h.I.chev}</span></div>`, 'Depuis l’écran d’accueil de l’enfant.')}
<h3>6. Le mode enfant, idéal pour un premier téléphone</h3>
<p>Verrouillez l’appli sur un enfant : il ne voit que sa tirelire, ne peut pas ouvrir celle de ses frères et sœurs ni l’espace parents, et ne range qu’une paie et un lancer par semaine. Pour revenir aux réglages, un code parents à 4 chiffres. Pas besoin de compte Google ni d’adresse e-mail pour l’enfant.</p>
${demo(`<div class="pin" style="padding:0"><div class="dots"><i class="on"></i><i class="on"></i><i></i><i></i></div><div class="keys mini">${[1, 2, 3, 4, 5, 6].map(n => `<span class="key">${n}</span>`).join('')}</div></div>`, 'Le code parents protège les réglages.')}
<h3>7. L’argent, en vrai</h3>
<p>Pépite tient les comptes, vous réglez quand vous voulez. Deux compteurs par enfant : le porte-monnaie à donner et la tirelire à mettre de côté. Un geste pour dire « c’est donné » ou « c’est rangé », et le compteur repart à zéro.</p>
${demo(`<div class="ledger"><span><i class="dot" style="background:var(--purse)"></i>Porte-monnaie à donner</span><b>${h.f(6)}</b><span class="btn ghost sm">C’est donné</span></div><div class="ledger"><span><i class="dot" style="background:var(--grow)"></i>Tirelire à mettre de côté</span><b class="g">${h.f(12.5)}</b><span class="btn gr sm">C’est rangé</span></div>`, 'Dans l’espace parents.')}
<h3>8. Et aussi</h3>
<p>La paie mise en pause en cas de conflit, avec un message pour l’enfant. L’onglet Futur qui projette la tirelire jusqu’à ses 18 ans. Le carnet qui garde tout l’historique. Plusieurs enfants, chacun sa couleur. Un mode sombre. Et un bouton pour annuler la dernière opération quand quelqu’un s’est trompé.</p>`;
      },
      sources: []
    }
  ];
}
