# Pleurniche — site vitrine

Salon de tatouage à Toulouse. Site statique (HTML / CSS / JS, aucune dépendance, aucun build).

## Arborescence

```
index.html                 page d'accueil
tatouages.html             page « Nos tatouages » (galerie)
rendez-vous.html           étapes de réservation + aide à rédiger le message
contact.html               Instagram, adresse, disponibilités, plan
css/style.css              tout le style
js/main.js                 commun : menu mobile, bande défilante, apparitions au scroll
js/galerie.js              galerie + visionneuse de la page « Nos tatouages »
js/rendez-vous.js          aide au message (rien n'est envoyé, tout reste dans le navigateur)
images/logo.jpg            logo (affiché en négatif via un filtre CSS)
images/hero.webp           visuel de la bannière (placeholder, à remplacer)
images/realisations/       visuels de la bande de l'accueil (tattoo-01..08.webp)
images/tatouages/          visuels de la page « Nos tatouages » + galerie.json
outils/galerie.py          met à jour galerie.json d'après le dossier
.claude/launch.json        config du serveur de preview local
```

Le header et le footer sont identiques sur les 4 pages : toute modification
doit être reportée dans chacune d'elles.

Reste à faire : les pages « Mentions légales » et « Confidentialité » (liens
du footer pour l'instant vides).

## Lancer en local

```bash
python -m http.server 5173
```

Puis ouvrir http://localhost:5173

## Ajouter des photos à « Nos tatouages »

1. Déposer les images dans `images/tatouages/` (webp, jpg, png… n'importe quel nom).
2. Lancer :

   ```bash
   python outils/galerie.py
   ```

3. Recharger la page : elle affiche autant d'images que le dossier en contient.

Pourquoi un script : un navigateur ne peut pas lire le contenu d'un dossier.
La page lit donc `images/tatouages/galerie.json`, que le script réécrit.

- La page alterne **cadres** (dessins encadrés) et **tatouages** (photos sur
  peau) : chaque colonne alterne de haut en bas, et deux colonnes voisines
  sont décalées. S'il y a plus d'images d'un type, le surplus est réparti sur
  toute la page (au pire deux images du même type l'une sous l'autre, jamais
  une pile en fin de page). La disposition se recalcule selon la largeur
  d'écran (4 colonnes sur ordinateur, 3 sur tablette, 2 sur téléphone).
- Chaque image porte un champ `type` dans `galerie.json` : `"cadre"` ou
  `"tatouage"`. Pour une nouvelle image, le script devine : un nom contenant
  « cadre » (ex. `cadre-meduse.webp`) donne un cadre, sinon un tatouage. Il
  affiche ce qu'il a deviné ; corriger le `type` si besoin puis relancer.
- Au sein de chaque type, l'ordre suit les noms de fichiers (tri naturel :
  `2` avant `10`).
- Les textes alternatifs se complètent dans `galerie.json` (champ `alt`) ;
  ils sont conservés à chaque relance du script. Sans `alt`, la page affiche
  « Réalisation Pleurniche n°X ».
- Une image supprimée du dossier disparaît de la page, même si on oublie de
  relancer le script.

## Comportements de la page d'accueil

- **Bande de réalisations** : elle défile en boucle et déborde sous le hero.
  On peut l'attraper à la souris, la swiper au doigt, la faire défiler au
  trackpad ou avec les flèches du clavier ; le défilement auto reprend ~2 s
  après. Vitesse et délai : `SPEED` et `RESUME_DELAY` dans `js/main.js`.
- **Bannière** : `images/hero.webp` en fond, assombri par des dégradés CSS
  (`.hero__media::after`). Pour changer d'image, écraser le fichier —
  un format paysage d'environ 2000 px de large donne le meilleur rendu.

## À personnaliser

- **Photos** : 8 visuels dans `images/realisations/` (`tattoo-01..08.webp`).
  Pour en changer, écraser le fichier ou ajouter une `<figure class="shot">`
  dans `index.html` — penser à l'`alt`. Les visuels sont recadrés en 3/4 par
  `object-fit: cover`, donc un format portrait est le plus sûr.
  Elles sont affichées telles quelles, sans filtre : tout le reste du site est mat
  et sans couleur, ce sont les photos qui portent le visuel.
- **Coordonnées** : adresse (23 rue du 14 Juillet, 31100 Toulouse) et Instagram
  (@pleurnichetattoo) sont les bons. Pas de téléphone ni d'e-mail pour l'instant,
  pas d'horaires fixes (rendez-vous convenus au cas par cas).
- **Carte** : iframe Google Maps sans clé d'API, l'adresse est dans l'URL `q=`.
  Si le repère ne tombe pas pile sur la boutique, remplacer l'adresse par les
  coordonnées GPS (`q=43.60,1.44`).
- **Polices** : tout passe par `--font-titre` et `--font-texte` en haut de
  `css/style.css`. Alternatives listées en commentaire (Caveat Brush, Amatic SC,
  Bungee, Shadows Into Light, Titan One) — penser à mettre à jour le lien
  Google Fonts dans le `<head>`.
- **Couleurs** : `--noir-0` à `--noir-6` (du plus profond au plus clair) pour les
  fonds et bordures, `--encre`, `--encre-2`, `--encre-3` pour les textes.
  Aucun dégradé, aucune couleur d'accent : uniquement des aplats.
# pleurniche
