# Pépite, l'argent de poche qui pousse

Application installable (PWA) qui apprend aux enfants à épargner et à investir : paie hebdomadaire en pièces, bocal qui se remplit, bonus des parents, bourse de la semaine au dé, projection jusqu'à 18 ans, argent reçu, suivi des virements vers le Livret A et mode enfant verrouillé par code.

Chaque famille crée son compte, configure ses enfants et ses règles au premier lancement.

- `index.html`, `app.js`, `app.css` : l'application
- `config.js` : configuration Firebase (identifiants publics)
- `firestore.rules` : règles de sécurité à coller dans la console Firebase
- `sw.js`, `manifest.webmanifest`, `icons/` : installation et démarrage hors ligne
- `vendor/idiomorph.esm.js` : mise à jour fluide de l'affichage (licence 0BSD)

Installation sur Android : ouvrir https://matbeca.github.io/tresor-famille/ dans Chrome, menu ⋮, « Installer l'application ».
