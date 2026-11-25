// Envoi des notifications de Pépite. Lancé par GitHub Actions :
// - toutes les 15 minutes : vide la file `push_queue` (argent reçu à valider, palier, objectif, bourse, série, test) ;
// - le lundi matin (MODE=weekly) : récap de jour de paie pour chaque famille abonnée ;
// - le mercredi en fin d'après-midi (MODE=streak) : rappel pour chaque enfant dont la paie de la semaine n'est pas encore rangée (série et pépite à la clé).
// Seuls les téléphones des parents sont abonnés (familles/{uid}/push/{appareil}).
import admin from 'firebase-admin';
import webpush from 'web-push';

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!sa.project_id) { console.error('Secret FIREBASE_SERVICE_ACCOUNT manquant.'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const keys = await db.doc('config/pushPrivate').get();
if (!keys.exists) { console.log('Clés des notifications pas encore créées : rien à faire.'); process.exit(0); }
const { publicKey, privateKey } = keys.data();
webpush.setVapidDetails('mailto:' + (process.env.CONTACT || 'contact@pepite.app'), publicKey, privateKey);

const eur = v => (Math.round(v * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const names = list => list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' et ' + list[list.length - 1];

async function sendFamily(uid, msg) {
  const subs = await db.collection(`familles/${uid}/push`).get();
  let sent = 0;
  for (const s of subs.docs) {
    const { endpoint, keys } = s.data();
    try { await webpush.sendNotification({ endpoint, keys }, JSON.stringify(msg), { TTL: 60 * 60 * 24, urgency: 'normal' }); sent++; }
    catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) await s.ref.delete(); // abonnement expiré ou retiré
      else console.error('Envoi refusé', uid.slice(0, 6), e.statusCode || e.message);
    }
  }
  return sent;
}

function message(q) {
  const k = q.kidName || 'Votre enfant';
  switch (q.type) {
    case 'cadeau': return { title: 'Argent reçu à valider', body: `${k} a déclaré ${eur(q.amount || 0)}${q.from ? ' de ' + q.from : ''}. Validez-le dans l’Espace parents.`, url: './?go=parents', tag: 'cadeau' };
    case 'palier': return { title: 'C’est pépite !', body: `${k} a passé le palier de ${eur(q.amount || 0)} dans sa tirelire.`, tag: 'palier' };
    case 'objectif': return { title: 'Objectif atteint !', body: `${k} a réuni ${eur(q.amount || 0)} pour « ${q.goal || 'son projet'} ».`, tag: 'objectif' };
    case 'serie': return { title: `${q.n} semaines de suite !`, body: `${k} a rangé sa paie ${q.n} semaines d’affilée. C’est le moment de le féliciter !`, tag: 'serie' };
    case 'bourse': return { title: 'La bourse est ouverte', body: `La tirelire de ${k} a atteint 15 € : le dé de la bourse est débloqué. Le bon moment pour en parler ensemble.`, tag: 'bourse' };
    case 'test': return { title: 'Notifications activées', body: 'Pépite pourra vous prévenir le lundi et lors des grands moments de vos enfants.', tag: 'test' };
    default: return null;
  }
}

async function drainQueue() {
  const q = await db.collection('push_queue').orderBy('d').limit(300).get();
  let n = 0;
  for (const d of q.docs) {
    const item = d.data(), msg = message(item);
    if (msg && item.uid) n += await sendFamily(item.uid, msg);
    await d.ref.delete();
  }
  console.log(`File : ${q.size} événement(s), ${n} notification(s) envoyée(s).`);
}

async function weekly() {
  const subs = await db.collectionGroup('push').get();
  const uids = [...new Set(subs.docs.map(s => s.ref.parent.parent && s.ref.parent.parent.id).filter(Boolean))];
  let n = 0;
  for (const uid of uids) {
    const f = await db.doc(`familles/${uid}`).get();
    if (!f.exists) continue;
    const F = f.data(), kids = (F.kids || []).filter(k => !k.archived);
    if (!kids.length) continue;
    const due = Object.values(F.due || {}), give = due.reduce((a, x) => a + (x.give || 0), 0), keep = due.reduce((a, x) => a + (x.keep || 0), 0);
    const extra = [give > 0 ? `${eur(give)} de porte-monnaie à leur donner` : '', keep > 0 ? `${eur(keep)} à mettre de côté` : ''].filter(Boolean).join(', ');
    const who = names(kids.map(k => k.name));
    const body = `${who} ${kids.length > 1 ? 'ont leur paie' : 'a sa paie'} de la semaine à ranger.${extra ? ' En attente de vous : ' + extra + '.' : ''}`;
    n += await sendFamily(uid, { title: 'C’est jour de paie !', body, url: './?go=parents', tag: 'lundi' });
  }
  console.log(`Récap du lundi : ${uids.length} famille(s), ${n} notification(s).`);
}

// Lundi de la semaine en cours, à l'heure de Paris, au format AAAA-MM-JJ.
function mondayParis() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const d = new Date(Date.UTC(+p.year, +p.month - 1, +p.day)), back = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday);
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
}

function streakMsg(x) {
  const k = x.name || 'Votre enfant', st = x.st || 0, left = x.left || 0;
  const pep = left === 1 ? `En la rangeant, ${k} gagne une nouvelle pépite !` : left > 1 ? `Plus que ${left} paies rangées pour sa prochaine pépite.` : '';
  if (st >= 1) return { title: `${k} : ${st + 1} semaines d’affilée à portée de main`, body: `Sa paie de la semaine attend toujours d’être rangée.${pep ? ' ' + pep : ''}`, url: './', tag: 'rappel-' + k };
  return { title: `La paie de ${k} l’attend`, body: `Sa paie de la semaine n’est pas encore rangée.${pep ? ' ' + pep : ' Une nouvelle pépite est peut-être à la clé !'}`, url: './', tag: 'rappel-' + k };
}

async function streakReminders() {
  const subs = await db.collectionGroup('push').get();
  const uids = [...new Set(subs.docs.map(s => s.ref.parent.parent && s.ref.parent.parent.id).filter(Boolean))], mon = mondayParis();
  let n = 0, k = 0;
  for (const uid of uids) {
    const f = await db.doc(`familles/${uid}`).get();
    if (!f.exists) continue;
    const F = f.data(), live = new Set((F.kids || []).filter(x => !x.archived).map(x => x.id));
    for (const [id, x] of Object.entries(F.due || {})) {
      if (!live.has(id) || x.pz || !x.lw || x.lw >= mon) continue; // en pause, jamais payé, ou déjà rangée cette semaine
      k++; n += await sendFamily(uid, streakMsg(x));
    }
  }
  console.log(`Rappel du mercredi : ${k} enfant(s), ${n} notification(s).`);
}

if (process.env.MODE === 'weekly') await weekly();
if (process.env.MODE === 'streak') await streakReminders();
await drainQueue();
process.exit(0);
