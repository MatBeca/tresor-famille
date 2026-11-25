// Politique de confidentialité de Pépite, affichée dans l'appli et accessible sans compte (lien #confidentialite).
export const PRIVACY_VERSION = '2026-11-22';

export function privacyHTML({ contact, I, user }) {
  const N = ' ';
  const mail = `<a href="mailto:${contact}">${contact}</a>`;
  return `<button class="backlink" data-act="go" data-v="${user ? 'parents' : 'home'}">${I.chev}<span>${user ? 'Espace parents' : 'Retour'}</span></button>
<article class="art legal"><p class="kicker">Vos données</p><h2>Confidentialité</h2>
<p class="alead">Pépite garde le strict nécessaire pour faire tourner la tirelire de vos enfants. Pas de publicité, pas de revente, pas de pistage.</p>

<h3>Qui est responsable${N}?</h3>
<p>Matthieu Becamel, créateur de Pépite, est responsable du traitement de vos données. Pour toute question ou demande${N}: ${mail}.</p>

<h3>Ce que Pépite enregistre</h3>
<p><b>Le compte du parent</b>${N}: une adresse e-mail et un mot de passe. Le mot de passe est conservé chiffré par Google, personne ne peut le lire, pas même nous.</p>
<p><b>La famille</b>${N}: le prénom, la date de naissance et la couleur de chaque enfant, sa paie, vos règles de bonus et le code parents. Jamais de nom de famille, de photo, d’adresse ou de localisation.</p>
<p><b>L’historique de la tirelire</b>${N}: paies rangées, bonus, lancers de dé, projets, argent reçu et corrections.</p>
<p><b>Des repères d’usage</b>${N}: la date de création du compte, le nombre de jours d’utilisation, si l’appli est installée sur l’écran d’accueil, le lien par lequel vous êtes arrivé et les quiz réussis. Ils servent uniquement à des statistiques d’ensemble pour améliorer Pépite.</p>
<p><b>Vos avis</b>${N}: les messages envoyés depuis «${N}Donner mon avis${N}», avec la date, la version de l’appli et le nombre d’enfants. Seul le créateur de Pépite les lit.</p>
<p><b>Les notifications</b>${N}: si vous les activez, l’adresse technique d’abonnement fournie par le navigateur de votre téléphone, pour vous envoyer le récap du lundi, le rappel du mercredi, les argents reçus à valider et les grands moments de vos enfants. Le message passe par le service de notification du navigateur (Google pour Android, Apple pour iPhone). Vous pouvez les désactiver à tout moment dans l’Espace parents.</p>
<p><b>Sur votre téléphone seulement</b>${N}: le thème clair ou sombre, le verrouillage de l’appareil et le tutoriel déjà vu. Ces réglages restent sur l’appareil et ne nous sont jamais envoyés.</p>

<h3>Pourquoi</h3>
<p>Pour faire fonctionner le service que vous avez demandé en créant votre compte${N}: tenir les comptes de vos enfants et les retrouver sur tous vos appareils. Et, dans notre intérêt légitime, pour mesurer globalement ce qui marche et ce qui ne marche pas dans l’appli. Aucune donnée ne sert à faire de la publicité ni à établir un profil commercial, et aucune n’est vendue.</p>

<h3>Et les enfants${N}?</h3>
<p>Pépite est utilisé par les enfants, mais toujours sous la responsabilité d’un parent. C’est le parent qui crée le compte, en déclarant être titulaire de l’autorité parentale, et qui décide de ce qui est enregistré. L’appli ne demande à l’enfant ni e-mail, ni nom, ni photo, et ne contient ni messagerie, ni publicité, ni achat.</p>

<h3>Où sont les données</h3>
<p>Les données de la famille sont stockées par Google Firebase dans un centre de données situé à Paris. Le service de connexion de Google peut traiter l’adresse e-mail hors de l’Union européenne, dans le cadre des clauses contractuelles types de la Commission européenne. L’appli elle-même est hébergée par GitHub, qui reçoit, comme tout hébergeur, l’adresse IP des visiteurs.</p>

<h3>Combien de temps</h3>
<p>Tant que votre compte existe. Quand vous le supprimez, toutes les données de la famille sont effacées immédiatement et définitivement. Un compte resté inactif pendant trois ans est supprimé, après un e-mail de prévenance.</p>

<h3>Vos droits</h3>
<p>Vous pouvez à tout moment consulter, corriger, exporter ou supprimer vos données, et vous opposer aux statistiques d’usage. Depuis l’appli${N}: Espace parents, carte «${N}Compte${N}», ou un message via «${N}Donner mon avis${N}». Ou par e-mail${N}: ${mail}. Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (<a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener">cnil.fr</a>).</p>

<h3 id="suppression">Supprimer votre compte</h3>
<p>Dans l’appli${N}: ouvrez l’Espace parents, puis la carte «${N}Compte${N}», et touchez «${N}Supprimer le compte de la famille${N}». Votre mot de passe vous est demandé pour confirmer. Le compte et toutes les données des enfants sont effacés aussitôt.</p>
<p>Sans l’appli${N}: écrivez à ${mail} depuis l’adresse du compte, en demandant la suppression. Elle est faite sous 30${N}jours au plus tard, et nous vous le confirmons.</p>

<h3>Cookies</h3>
<p>Pépite n’utilise aucun cookie publicitaire ni traceur. Le stockage local du téléphone sert seulement à garder vos réglages et votre connexion.</p>

<p class="soft small">Mise à jour le 22${N}novembre 2026.</p>
</article>`;
}
