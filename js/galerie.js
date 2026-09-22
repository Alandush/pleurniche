/* =====================================================================
   PLEURNICHE — page « Nos tatouages »
   Construit la galerie à partir de images/tatouages/galerie.json :
   autant d'images dans la page que dans le dossier.
   (Pour mettre à jour le fichier : python outils/galerie.py)
   ===================================================================== */
(function () {
  'use strict';

  var DOSSIER = 'images/tatouages/';

  var grille = document.getElementById('galerie');
  var compte = document.getElementById('galerieCompte');
  var etat = document.getElementById('galerieEtat');
  if (!grille) return;

  // Toutes les images affichables, dans l'ordre du fichier
  // (une image introuvable est retirée)
  var items = [];
  // Les mêmes, dans l'ordre d'affichage : c'est l'ordre de la visionneuse
  var images = [];
  var colonnes = 0;

  function texteCompte(n) {
    if (n === 0) return '';
    return n + (n > 1 ? ' pièces' : ' pièce');
  }

  function afficherEtat(message) {
    etat.textContent = message;
    etat.hidden = false;
  }

  function majCompte() {
    compte.textContent = texteCompte(images.length);
    if (images.length === 0) afficherEtat('Aucune réalisation à afficher pour le moment.');
  }

  /* ---------- Hauteur de chaque case ----------
     La grille avance par rangées de 4px : chaque case en occupe autant que
     sa hauteur réelle. Recalculé dès que la case change de taille
     (image chargée, fenêtre redimensionnée). */
  function caler(li) {
    var rangee = parseFloat(getComputedStyle(grille).gridAutoRows) || 4;
    // on mesure le contenu (image + écart), pas la case déjà étirée
    var hauteur = li.firstElementChild.getBoundingClientRect().height
      + parseFloat(getComputedStyle(li).paddingBottom);
    li.style.gridRowEnd = 'span ' + Math.max(1, Math.ceil(hauteur / rangee));
  }

  var observateur = 'ResizeObserver' in window
    ? new ResizeObserver(function (entrees) {
        entrees.forEach(function (e) { caler(e.target.parentNode); });
      })
    : null;

  if (!observateur) {
    window.addEventListener('resize', function () {
      Array.prototype.forEach.call(grille.children, caler);
    });
  }

  /* ---------- Alternance cadre / tatouage ----------
     Laissée à elle-même, la mosaïque met chaque image dans la colonne la
     plus courte : les cadres (portrait) étant plus hauts que les photos,
     les tatouages finissent par s'empiler dans la même colonne. On choisit
     donc nous-mêmes la colonne de chaque image, en deux temps :

     1. Séquence : cadres et tatouages sont entrelacés en étalant chaque type
        régulièrement sur toute la séquence (l'image k d'un type de n images
        se place à (k + 0,5) / n). S'il y a plus d'un type, le surplus est
        réparti tout du long au lieu de s'empiler à la fin.
     2. Colonnes : chaque image va dans la colonne la moins remplie parmi
        celles qui ne se terminent PAS par le même type. Chaque colonne
        alterne ainsi de haut en bas ; deux images du même type ne
        s'empilent que si aucune autre colonne n'est possible. */
  function nbColonnes() {
    // Une image placée en colonne 4 sur un écran qui n'en prévoit que 2 crée
    // des colonnes « fantômes », que gridTemplateColumns compte aussi : on
    // libère les images le temps de mesurer (aucun affichage entre-temps).
    var avant = items.map(function (it) { return it.li.style.gridColumn; });
    items.forEach(function (it) { it.li.style.gridColumn = ''; });
    var n = getComputedStyle(grille).gridTemplateColumns.split(' ').length;
    items.forEach(function (it, i) { it.li.style.gridColumn = avant[i]; });
    return n;
  }

  function sequenceAlternee() {
    var files = { cadre: [], tatouage: [] };
    items.forEach(function (it) { files[it.type].push(it); });

    var places = [];
    ['cadre', 'tatouage'].forEach(function (type, rang) {
      var liste = files[type];
      liste.forEach(function (it, k) {
        places.push({ pos: (k + 0.5) / liste.length, rang: rang, it: it });
      });
    });
    // à égalité, le cadre passe devant
    places.sort(function (a, b) { return a.pos - b.pos || a.rang - b.rang; });
    return places.map(function (p) { return p.it; });
  }

  function disposer(forcer) {
    var n = nbColonnes();
    if (!forcer && n === colonnes) return;
    colonnes = n;

    var cols = [];
    for (var k = 0; k < n; k++) cols.push({ nb: 0, dernier: null });

    images = [];
    sequenceAlternee().forEach(function (it) {
      var choix = -1, c;
      for (c = 0; c < n; c++) {
        if (cols[c].dernier === it.type) continue;
        if (choix < 0 || cols[c].nb < cols[choix].nb) choix = c;
      }
      if (choix < 0) {   // toutes les colonnes finissent par ce type
        choix = 0;
        for (c = 1; c < n; c++) if (cols[c].nb < cols[choix].nb) choix = c;
      }
      cols[choix].nb++;
      cols[choix].dernier = it.type;
      it.li.style.gridColumn = String(choix + 1);
      grille.appendChild(it.li);   // déplace l'élément : le DOM suit l'ordre d'affichage
      images.push(it);
    });
  }

  // Un redimensionnement déclenche des dizaines d'événements : un seul
  // recalcul par image affichée suffit.
  var attente = false;
  window.addEventListener('resize', function () {
    if (attente) return;
    attente = true;
    window.requestAnimationFrame(function () {
      attente = false;
      disposer(false);
    });
  });

  /* ---------- Construction de la mosaïque ---------- */
  function construire(liste) {
    liste.forEach(function (entree, i) {
      if (!entree || !entree.fichier) return;

      var alt = entree.alt || ('Réalisation Pleurniche n°' + (i + 1));
      var item = {
        src: DOSSIER + encodeURIComponent(entree.fichier),
        alt: alt,
        type: entree.type === 'cadre' ? 'cadre' : 'tatouage'
      };

      var li = document.createElement('li');
      li.className = 'galerie__item';
      li.dataset.type = item.type;
      item.li = li;

      var bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'galerie__btn';
      bouton.setAttribute('aria-label', 'Agrandir : ' + alt);

      var img = document.createElement('img');
      img.loading = 'lazy';     // avant src, sinon le chargement démarre tout de suite
      img.decoding = 'async';
      img.alt = alt;
      img.src = item.src;
      img.draggable = false;

      img.addEventListener('load', function () {
        bouton.classList.add('is-loaded');
        if (!observateur) caler(li);
      });
      img.addEventListener('error', function () {
        // Listée dans galerie.json mais absente du dossier : on la retire
        // et on refait le damier pour ne pas casser l'alternance
        li.remove();
        items.splice(items.indexOf(item), 1);
        disposer(true);
        majCompte();
      });

      bouton.addEventListener('click', function () {
        ouvrir(images.indexOf(item), bouton);
      });

      bouton.appendChild(img);
      li.appendChild(bouton);
      items.push(item);
    });

    disposer(true);
    images.forEach(function (it) {
      if (observateur) observateur.observe(it.li.firstElementChild);
      else caler(it.li);
    });
    majCompte();
  }

  fetch(DOSSIER + 'galerie.json', { cache: 'no-cache' })
    .then(function (rep) {
      if (!rep.ok) throw new Error('HTTP ' + rep.status);
      return rep.json();
    })
    .then(function (donnees) {
      construire((donnees && donnees.images) || []);
    })
    .catch(function () {
      afficherEtat(location.protocol === 'file:'
        ? 'La galerie ne peut pas se charger en ouvrant le fichier directement : lancez le site avec « python -m http.server ».'
        : 'La galerie n’a pas pu être chargée. Réessayez dans un instant.');
    });

  /* ---------- Visionneuse ---------- */
  var lb = document.getElementById('lightbox');
  if (!lb) return;

  var lbImg = document.getElementById('lightboxImg');
  var lbAlt = document.getElementById('lightboxAlt');
  var lbCompteur = document.getElementById('lightboxCompteur');
  var btnFermer = lb.querySelector('.lightbox__close');
  var btnPrec = lb.querySelector('.lightbox__nav--prev');
  var btnSuiv = lb.querySelector('.lightbox__nav--next');

  var courant = 0;
  var declencheur = null;

  function afficher(i) {
    var n = images.length;
    if (!n) return;
    courant = (i + n) % n;
    var item = images[courant];
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    lbAlt.textContent = item.alt;
    lbCompteur.textContent = (courant + 1) + ' / ' + n;
    btnPrec.hidden = btnSuiv.hidden = n < 2;

    // Précharge les voisines pour une navigation sans attente
    [courant - 1, courant + 1].forEach(function (k) {
      var voisine = images[(k + n) % n];
      if (voisine) (new Image()).src = voisine.src;
    });
  }

  function ouvrir(i, origine) {
    if (i < 0) return;
    declencheur = origine || null;
    afficher(i);
    lb.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    btnFermer.focus();
  }

  function fermer() {
    lb.hidden = true;
    lbImg.removeAttribute('src');
    document.documentElement.style.overflow = '';
    if (declencheur) declencheur.focus();
  }

  btnFermer.addEventListener('click', fermer);
  btnPrec.addEventListener('click', function () { afficher(courant - 1); });
  btnSuiv.addEventListener('click', function () { afficher(courant + 1); });

  // Un clic sur le fond (hors image et boutons) ferme
  lb.addEventListener('click', function (e) {
    if (e.target === lb) fermer();
  });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') { fermer(); return; }
    if (e.key === 'ArrowRight') { afficher(courant + 1); return; }
    if (e.key === 'ArrowLeft') { afficher(courant - 1); return; }

    // Le focus reste dans la visionneuse
    if (e.key === 'Tab') {
      var cibles = [btnFermer, btnPrec, btnSuiv].filter(function (b) { return !b.hidden; });
      var pos = cibles.indexOf(document.activeElement);
      e.preventDefault();
      var suivant = e.shiftKey ? pos - 1 : pos + 1;
      cibles[(suivant + cibles.length) % cibles.length].focus();
    }
  });

  // Glissé tactile gauche / droite
  var departX = 0, departY = 0;
  lb.addEventListener('touchstart', function (e) {
    departX = e.touches[0].clientX;
    departY = e.touches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - departX;
    var dy = e.changedTouches[0].clientY - departY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      afficher(courant + (dx < 0 ? 1 : -1));
    }
  });
})();
