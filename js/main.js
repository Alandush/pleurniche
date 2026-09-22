/* =====================================================================
   PLEURNICHE — scripts communs à toutes les pages
   (chaque bloc ne s'active que si ses éléments sont présents)
   ===================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menu mobile ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ---------- Header au scroll ---------- */
  var header = document.getElementById('header');
  var onScroll = function () {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Bande de réalisations ----------
     Défile toute seule, en boucle infinie, et se laisse attraper :
     glissé à la souris, swipe tactile, trackpad et flèches du clavier. */
  var showcase = document.getElementById('showcase');
  var track = document.getElementById('showcaseTrack');

  if (showcase && track) {
    // Les visuels sont dupliqués : la boucle se referme sans saut visible.
    Array.prototype.slice.call(track.children).forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      var img = clone.querySelector('img');
      if (img) img.alt = '';
      track.appendChild(clone);
    });

    var SPEED = 0.45;          // pixels par frame
    var RESUME_DELAY = 1800;   // reprise auto après une interaction (ms)
    var paused = false;
    var resumeTimer = null;
    var half = 0;

    function measure() { half = track.scrollWidth / 2; }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    // Reboucle d'un jeu de visuels à l'autre, dans les deux sens.
    // Les deux bornes ne doivent jamais se renvoyer la balle : on repart
    // à half - 1 (et non half), sinon la position rebondit entre 0 et half.
    function wrap() {
      if (half <= 0) return;
      if (showcase.scrollLeft >= half) showcase.scrollLeft -= half;
      else if (showcase.scrollLeft <= 0) showcase.scrollLeft = half - 1;
    }

    function pause() { paused = true; window.clearTimeout(resumeTimer); }
    function resumeLater(delay) {
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(function () { paused = false; }, delay || RESUME_DELAY);
    }

    function tick() {
      if (!paused && !reduceMotion) {
        showcase.scrollLeft += SPEED;
        wrap();
      }
      window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);

    showcase.addEventListener('scroll', wrap, { passive: true });

    // Survol : on stoppe pour laisser regarder
    showcase.addEventListener('mouseenter', pause);
    showcase.addEventListener('mouseleave', function () {
      if (!scDragging) resumeLater(400);
    });

    // Glissé à la souris
    var scDragging = false, scLastX = 0;

    showcase.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pause();
      if (e.pointerType !== 'mouse') return;   // tactile : défilement natif
      scDragging = true;
      scLastX = e.clientX;
      showcase.classList.add('is-dragging');
      showcase.setPointerCapture(e.pointerId);
    });

    showcase.addEventListener('pointermove', function (e) {
      if (!scDragging) return;
      e.preventDefault();
      showcase.scrollLeft -= (e.clientX - scLastX);
      scLastX = e.clientX;
      wrap();
    });

    function endDrag(e) {
      if (scDragging) {
        scDragging = false;
        showcase.classList.remove('is-dragging');
        try { showcase.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      resumeLater();
    }
    showcase.addEventListener('pointerup', endDrag);
    showcase.addEventListener('pointercancel', endDrag);
    showcase.addEventListener('lostpointercapture', endDrag);

    // Un glissé rapide peut déclencher le drag natif du navigateur (l'image
    // se décolle et le pointerup n'arrive jamais) : on le coupe, et on garde
    // un filet de sécurité au cas où le glissé se termine hors de la bande.
    showcase.addEventListener('dragstart', function (e) { e.preventDefault(); });
    window.addEventListener('pointerup', function (e) { if (scDragging) endDrag(e); });
    window.addEventListener('blur', function () {
      if (scDragging) {
        scDragging = false;
        showcase.classList.remove('is-dragging');
        resumeLater();
      }
    });

    // Tactile
    showcase.addEventListener('touchstart', pause, { passive: true });
    showcase.addEventListener('touchend', function () { resumeLater(); }, { passive: true });

    // Clavier (la bande est focusable)
    showcase.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      pause();
      showcase.scrollLeft += (e.key === 'ArrowRight' ? 240 : -240);
      wrap();
      resumeLater();
    });
  }

  /* ---------- Apparition au scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealables.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 90 + 'ms';
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Année du footer ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
