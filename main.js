/* =====================================================================
   main.js — navegación, header, FAB, scrollspy. Sin dependencias.
   ===================================================================== */
document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Menú móvil ---------- */
    var toggle = document.getElementById('menuToggle');
    var nav = document.getElementById('mainNav');
    var overlay = document.getElementById('navOverlay');

    function openNav() {
        nav.classList.add('is-open');
        overlay.classList.add('is-show');
        document.body.classList.add('nav-open');
        toggle.setAttribute('aria-expanded', 'true');
    }
    function closeNav() {
        nav.classList.remove('is-open');
        overlay.classList.remove('is-show');
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
    }
    if (toggle) {
        toggle.addEventListener('click', function () {
            nav.classList.contains('is-open') ? closeNav() : openNav();
        });
        overlay.addEventListener('click', closeNav);
        nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeNav); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
        window.addEventListener('resize', function () { if (window.innerWidth > 1000) closeNav(); });
    }

    /* ---------- Header: sombra + ocultar al bajar ---------- */
    var header = document.getElementById('siteHeader');
    // En páginas con sub-nav pegajosa (productos) el header NO se oculta,
    // así la barra de categorías siempre queda justo debajo y no "flota".
    var canHide = !document.body.classList.contains('page-productos');
    var lastY = window.scrollY, hidden = false, scrolled = false;
    window.addEventListener('scroll', function () {
        var y = window.scrollY;
        var s = y > 12;
        if (s !== scrolled) { scrolled = s; header.classList.toggle('is-scrolled', s); }
        // ocultar solo tras pasar el hero y al desplazarse hacia abajo
        var goingDown = canHide && y > lastY && y > 320;
        if (goingDown !== hidden && !nav.classList.contains('is-open')) {
            hidden = goingDown;
            header.classList.toggle('is-hidden', goingDown);
        }
        lastY = y;
    }, { passive: true });

    /* ---------- FAB de contacto ---------- */
    var fab = document.getElementById('fab');
    var fabToggle = document.getElementById('fabToggle');
    if (fab && fabToggle) {
        fabToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = fab.classList.toggle('is-open');
            fabToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('click', function (e) {
            if (fab.classList.contains('is-open') && !fab.contains(e.target)) {
                fab.classList.remove('is-open');
                fabToggle.setAttribute('aria-expanded', 'false');
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') fab.classList.remove('is-open');
        });
    }

    /* ---------- Anclas suaves con compensación de header ---------- */
    var HEADER_OFF = document.getElementById('catNav') ? 138 : 92;
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            var id = a.getAttribute('href');
            if (id.length < 2) return;
            var t = document.querySelector(id);
            if (!t) return;
            e.preventDefault();
            var top = t.getBoundingClientRect().top + window.scrollY - HEADER_OFF;
            window.scrollTo({ top: top, behavior: 'smooth' });
            history.replaceState(null, '', id);
        });
    });

    /* ---------- Scrollspy para la navegación de categorías ---------- */
    var catNav = document.getElementById('catNav');
    if (catNav) {
        var links = [].slice.call(catNav.querySelectorAll('.cat-nav-link'));
        var sections = links.map(function (l) { return document.querySelector(l.getAttribute('href')); });
        var spy = new IntersectionObserver(function (ents) {
            ents.forEach(function (en) {
                if (!en.isIntersecting) return;
                var i = sections.indexOf(en.target);
                links.forEach(function (l, k) { l.classList.toggle('is-active', k === i); });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(function (s) { if (s) spy.observe(s); });
    }
});
