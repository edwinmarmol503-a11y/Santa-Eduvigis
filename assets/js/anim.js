/* =====================================================================
   anim.js — capa de animación "de cine" para Panadería Santa Eduvigis.
   Sin librerías. Todo degrada con prefers-reduced-motion y si el JS falla
   el contenido ya es visible (las clases .reveal se fuerzan visibles).
   ===================================================================== */
(function () {
    'use strict';

    window.__seAnim = true; // señal para el fallback de footer (si este archivo no cargara)

    var MQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduce = MQ.matches;
    try { MQ.addEventListener('change', function (e) { reduce = e.matches; }); } catch (e) {}
    var FINE = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

    function onReady(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }
    var lerp = function (a, b, n) { return a + (b - a) * n; };
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

    /* ================================================================
       1. Preloader
       ================================================================ */
    function initPreloader() {
        var pre = document.getElementById('preloader');
        if (!pre) return;
        function done() {
            pre.classList.add('is-done');
            setTimeout(function () { pre.remove(); }, 700);
        }
        if (reduce) { done(); return; }
        var fired = false;
        var go = function () { if (fired) return; fired = true; setTimeout(done, 380); };
        window.addEventListener('load', go);
        setTimeout(go, 2600); // red de seguridad
    }

    /* ================================================================
       2. Cursor personalizado
       ================================================================ */
    function initCursor() {
        if (!FINE || reduce) return;
        var cur = document.querySelector('.cursor');
        if (!cur) return;
        document.body.classList.add('cursor-on');
        cur.style.opacity = '1';
        var rx = window.innerWidth / 2, ry = window.innerHeight / 2;
        var x = rx, y = ry, dx = rx, dy = ry;
        window.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; }, { passive: true });
        (function loop() {
            dx = lerp(dx, x, .2); dy = lerp(dy, y, .2);
            cur.style.transform = 'translate(' + x + 'px,' + y + 'px)';
            var ring = cur.querySelector('.cursor-ring');
            ring.style.transform = 'translate(' + (dx - x) + 'px,' + (dy - y) + 'px) translate(-50%,-50%)';
            requestAnimationFrame(loop);
        })();
        var hoverSel = 'a,button,.tilt,.magnet,input,textarea,[data-cursor]';
        document.addEventListener('mouseover', function (e) {
            if (e.target.closest(hoverSel)) cur.classList.add('is-hover');
        });
        document.addEventListener('mouseout', function (e) {
            if (e.target.closest(hoverSel)) cur.classList.remove('is-hover');
        });
        document.addEventListener('mousedown', function () { cur.classList.add('is-down'); });
        document.addEventListener('mouseup', function () { cur.classList.remove('is-down'); });
        document.addEventListener('mouseleave', function () { cur.style.opacity = '0'; });
        document.addEventListener('mouseenter', function () { cur.style.opacity = '1'; });
    }

    /* ================================================================
       3. Revelado al hacer scroll (con stagger entre hermanos)
       ================================================================ */
    var revealIO = null;
    function initReveal() {
        var els = [].slice.call(document.querySelectorAll('.reveal, .clip-reveal')).filter(function (el) { return !el.__r; });
        if (!els.length) return;
        if (reduce || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.__r = 1; el.classList.add('in-view'); });
            return;
        }
        els.forEach(function (el) {
            el.__r = 1;
            var sibs = el.parentElement ? [].filter.call(el.parentElement.children, function (c) {
                return c.classList.contains('reveal') || c.classList.contains('clip-reveal');
            }) : [el];
            var i = sibs.indexOf(el);
            if (i > 0) el.style.transitionDelay = Math.min(i * 80, 480) + 'ms';
        });
        if (!revealIO) {
            revealIO = new IntersectionObserver(function (ents) {
                ents.forEach(function (en) {
                    if (!en.isIntersecting) return;
                    en.target.classList.add('in-view');
                    revealIO.unobserve(en.target);
                });
            }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
        }
        els.forEach(function (el) { revealIO.observe(el); });
    }

    /* ================================================================
       4. Contadores (data-countup) — respeta data-plain para años
       ================================================================ */
    function runCount(el) {
        var target = parseFloat(el.getAttribute('data-countup'));
        if (isNaN(target)) return;
        var suffix = el.getAttribute('data-suffix') || '';
        var plain = el.getAttribute('data-plain') === '1';
        var fmt = function (n) {
            var v = Math.round(n);
            return plain ? String(v) : v.toLocaleString('es-SV');
        };
        if (reduce) { el.textContent = fmt(target) + suffix; return; }
        var dur = 1500, t0 = null;
        (function frame(now) {
            if (t0 === null) t0 = now;
            var p = Math.min((now - t0) / dur, 1);
            var e = 1 - Math.pow(1 - p, 4);
            el.textContent = fmt(target * e) + (p > .15 ? suffix : '');
            if (p < 1) requestAnimationFrame(frame);
            else el.textContent = fmt(target) + suffix;
        })(performance.now());
    }
    function initCount() {
        var nums = [].slice.call(document.querySelectorAll('[data-countup]')).filter(function (n) { return !n.__c; });
        if (!nums.length) return;
        nums.forEach(function (n) { n.__c = 1; });
        if (!('IntersectionObserver' in window)) { nums.forEach(runCount); return; }
        var io = new IntersectionObserver(function (ents) {
            ents.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); io.unobserve(en.target); } });
        }, { threshold: 0.6 });
        nums.forEach(function (n) { io.observe(n); });
    }

    /* ================================================================
       5. Hero — titular por palabras + parallax + bento 3D + partículas
       ================================================================ */
    function splitHeadline(h) {
        if (!h || h.dataset.split) return;
        h.dataset.split = '1';
        var frag = document.createDocumentFragment(), wi = 0;
        [].forEach.call(h.childNodes, function (node) {
            if (node.nodeType === 3) {
                node.textContent.split(/(\s+)/).forEach(function (chunk) {
                    if (!chunk.trim()) { frag.appendChild(document.createTextNode(chunk)); return; }
                    var w = document.createElement('span'); w.className = 'hl-word';
                    var inner = document.createElement('span'); inner.className = 'hl-word-in';
                    inner.textContent = chunk;
                    inner.style.transitionDelay = (0.15 + wi * 0.07) + 's';
                    w.appendChild(inner); frag.appendChild(w); wi++;
                });
            } else if (node.nodeName === 'BR') {
                frag.appendChild(node.cloneNode());
            } else {
                var w2 = document.createElement('span'); w2.className = 'hl-word';
                var in2 = document.createElement('span'); in2.className = 'hl-word-in';
                in2.innerHTML = node.innerHTML;
                if (node.tagName === 'SPAN') in2.style.fontStyle = 'italic';
                in2.style.transitionDelay = (0.15 + wi * 0.07) + 's';
                w2.appendChild(in2); frag.appendChild(w2); wi++;
            }
        });
        h.innerHTML = ''; h.appendChild(frag);
    }

    function initHero() {
        var hero = document.querySelector('.hero');
        if (!hero) return;
        var title = hero.querySelector('.hero-title');
        if (!reduce) splitHeadline(title);

        var fired = false;
        function ready() { if (fired) return; fired = true; hero.classList.add('hero-ready'); }
        requestAnimationFrame(function () { requestAnimationFrame(ready); });
        setTimeout(ready, 1400);
        if (reduce) return;

        var bentos = [].slice.call(hero.querySelectorAll('.bento'));
        var copy = hero.querySelector('.hero-copy');
        var mx = 0, my = 0, cx = 0, cy = 0, active = false, onScreen = true;
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) {
                es.forEach(function (e) { onScreen = e.isIntersecting; });
            }, { threshold: 0.01 }).observe(hero);
        }

        hero.addEventListener('pointermove', function (e) {
            if (e.pointerType === 'touch') return;
            var r = hero.getBoundingClientRect();
            mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
            my = ((e.clientY - r.top) / r.height - 0.5) * 2;
            active = true;
        });
        hero.addEventListener('pointerleave', function () { mx = 0; my = 0; });

        (function loop() {
            if (document.hidden || !onScreen) { requestAnimationFrame(loop); return; }
            cx = lerp(cx, mx, .06); cy = lerp(cy, my, .06);
            bentos.forEach(function (b) {
                var d = parseFloat(b.dataset.depth || '0.08');
                var tx = -cx * d * 130, ty = -cy * d * 130;
                var rx = cy * d * 22, ry = -cx * d * 22;
                b.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
            });
            if (copy) copy.style.transform = 'translate3d(' + (cx * 12).toFixed(1) + 'px,' + (cy * 8).toFixed(1) + 'px,0)';
            requestAnimationFrame(loop);
        })();

        // Parallax de scroll sobre el hero completo
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return; ticking = true;
            requestAnimationFrame(function () {
                var y = window.scrollY || 0, vh = window.innerHeight || 1;
                if (y < vh * 1.15) {
                    var p = y / vh;
                    if (copy) copy.style.opacity = String(clamp(1 - p * 1.1, 0, 1));
                    hero.style.setProperty('--sy', (p * 40).toFixed(1) + 'px');
                }
                ticking = false;
            });
        }, { passive: true });
    }

    /* ================================================================
       6. Partículas de "harina" (canvas ligero, se pausa fuera de vista)
       ================================================================ */
    function initParticles() {
        var hosts = [].slice.call(document.querySelectorAll('.hero-particles'));
        if (!hosts.length || reduce) return;
        hosts.forEach(function (host) {
            var canvas = document.createElement('canvas');
            host.appendChild(canvas);
            var ctx = canvas.getContext('2d');
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var W = 0, H = 0, parts = [], raf = 0, running = false;
            var COUNT = window.innerWidth < 700 ? 26 : 54;

            function resize() {
                W = host.clientWidth; H = host.clientHeight;
                canvas.width = W * dpr; canvas.height = H * dpr;
                canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
            function mk() {
                return {
                    x: Math.random() * W, y: Math.random() * H,
                    r: 0.6 + Math.random() * 2.2,
                    vy: -(0.12 + Math.random() * 0.5),
                    vx: -0.25 + Math.random() * 0.5,
                    a: 0.05 + Math.random() * 0.32,
                    drift: Math.random() * Math.PI * 2
                };
            }
            function tick() {
                if (!running) return;
                ctx.clearRect(0, 0, W, H);
                for (var i = 0; i < parts.length; i++) {
                    var p = parts[i];
                    p.drift += 0.01;
                    p.y += p.vy; p.x += p.vx + Math.sin(p.drift) * 0.3;
                    if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
                    if (p.x < -6) p.x = W + 6; else if (p.x > W + 6) p.x = -6;
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(255,247,235,' + p.a + ')';
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                raf = requestAnimationFrame(tick);
            }
            function start() { if (running) return; running = true; raf = requestAnimationFrame(tick); }
            function stop() { running = false; cancelAnimationFrame(raf); }

            resize();
            for (var i = 0; i < COUNT; i++) parts.push(mk());
            window.addEventListener('resize', resize);
            document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
            if ('IntersectionObserver' in window) {
                new IntersectionObserver(function (es) {
                    es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
                }, { threshold: 0.01 }).observe(host);
            } else start();
        });
    }

    /* ================================================================
       7. Tilt 3D en tarjetas (.tilt) + glare
       ================================================================ */
    function initTilt() {
        if (!FINE || reduce) return;
        [].forEach.call(document.querySelectorAll('.tilt'), function (card) {
            var rect = null, raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
            // Foto interior: se hunde/flota levemente en sentido contrario al
            // giro de la tarjeta, el mismo lenguaje del "agua" del hero, pero
            // aplicado a las tarjetas de categorías, sucursales y testimonios.
            var img = card.querySelector('.cat-media img, .prod-section-media img, img');
            var ix = 0, iy = 0, icx = 0, icy = 0;
            function enter() { rect = card.getBoundingClientRect(); card.classList.add('is-tilting'); }
            function move(e) {
                if (!rect) rect = card.getBoundingClientRect();
                var px = (e.clientX - rect.left) / rect.width;
                var py = (e.clientY - rect.top) / rect.height;
                tx = (py - 0.5) * -10; ty = (px - 0.5) * 10;
                ix = (px - 0.5) * -18; iy = (py - 0.5) * -18;
                card.style.setProperty('--gx', (px * 100) + '%');
                card.style.setProperty('--gy', (py * 100) + '%');
                if (!raf) raf = requestAnimationFrame(render);
            }
            function render() {
                raf = 0;
                cx = lerp(cx, tx, .18); cy = lerp(cy, ty, .18);
                card.style.transform = 'perspective(900px) rotateX(' + cx.toFixed(2) + 'deg) rotateY(' + cy.toFixed(2) + 'deg) translateZ(0)';
                if (img) {
                    icx = lerp(icx, ix, .14); icy = lerp(icy, iy, .14);
                    img.style.transform = 'scale(1.1) translate(' + icx.toFixed(1) + 'px,' + icy.toFixed(1) + 'px)';
                }
                var settled = Math.abs(cx - tx) < 0.05 && Math.abs(cy - ty) < 0.05 &&
                    (!img || (Math.abs(icx - ix) < 0.2 && Math.abs(icy - iy) < 0.2));
                if (!settled) raf = requestAnimationFrame(render);
            }
            function leave() {
                rect = null; tx = ty = 0; ix = iy = 0;
                card.classList.remove('is-tilting');
                card.style.transform = '';
                if (img) img.style.transform = '';
            }
            card.addEventListener('pointerenter', enter);
            card.addEventListener('pointermove', move);
            card.addEventListener('pointerleave', leave);
        });
    }

    /* ================================================================
       8. Botones magnéticos (.magnet) + ripple
       ================================================================ */
    function initMagnet() {
        if (!FINE || reduce) return;
        [].forEach.call(document.querySelectorAll('.magnet'), function (el) {
            el.addEventListener('pointermove', function (e) {
                var r = el.getBoundingClientRect();
                var x = (e.clientX - r.left - r.width / 2) * 0.3;
                var y = (e.clientY - r.top - r.height / 2) * 0.4;
                el.style.transition = 'transform .12s linear';
                el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
            });
            el.addEventListener('pointerleave', function () {
                el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
                el.style.transform = '';
            });
        });
    }
    function initRipple() {
        document.addEventListener('click', function (e) {
            var b = e.target.closest && e.target.closest('.btn, .nav-cta, .prod-add');
            if (!b || reduce) return;
            var r = b.getBoundingClientRect();
            var d = Math.max(r.width, r.height) * 2;
            var s = document.createElement('span');
            s.className = 'btn-ripple';
            s.style.width = s.style.height = d + 'px';
            s.style.left = (e.clientX - r.left - d / 2) + 'px';
            s.style.top = (e.clientY - r.top - d / 2) + 'px';
            b.appendChild(s);
            setTimeout(function () { s.remove(); }, 620);
        });
    }

    /* ================================================================
       9. Marquee — ritmo constante (la animación vive solo en CSS)
       ================================================================ */
    function initMarquee() { /* sin JS: el marquee avanza a velocidad fija por CSS */ }

    /* ================================================================
       9b. Trazo de líneas SVG a mano — inspirado en el ícono animado de
       "The Symphony of Vines" (stroke-dasharray/dashoffset). Sin inline
       styles no hay nada que ocultar: el trazo ya se ve completo por defecto.
       ================================================================ */
    function initDrawSvg() {
        var svgs = [].slice.call(document.querySelectorAll('.draw-flourish'));
        if (!svgs.length) return;
        svgs.forEach(function (svg) {
            var paths = [].slice.call(svg.querySelectorAll('.draw-path'));
            paths.forEach(function (p, i) {
                var len;
                try { len = p.getTotalLength(); } catch (e) { return; }
                p.style.strokeDasharray = len;
                p.style.strokeDashoffset = len;
                p.style.transitionDelay = (i * 0.11) + 's';
            });
        });
        if (reduce || !('IntersectionObserver' in window)) {
            svgs.forEach(function (svg) {
                svg.querySelectorAll('.draw-path').forEach(function (p) { p.style.strokeDashoffset = 0; });
            });
            return;
        }
        var io = new IntersectionObserver(function (ents) {
            ents.forEach(function (en) {
                if (!en.isIntersecting) return;
                en.target.querySelectorAll('.draw-path').forEach(function (p) { p.style.strokeDashoffset = '0'; });
                io.unobserve(en.target);
            });
        }, { threshold: 0.4 });
        svgs.forEach(function (svg) { io.observe(svg); });
    }

    /* ================================================================
       9c. Momentos — galería fija con crossfade al hacer scroll
       (inspirado en la sección de fotos fijas de LoZio Osteria)
       ================================================================ */
    function initMomentos() {
        var wrap = document.querySelector('.momentos');
        if (!wrap) return;
        var steps = [].slice.call(wrap.querySelectorAll('.momentos-step'));
        var imgs = [].slice.call(wrap.querySelectorAll('.momentos-img'));
        var dots = [].slice.call(wrap.querySelectorAll('.momentos-dots span'));
        if (!steps.length) return;

        function activate(idx) {
            steps.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
            imgs.forEach(function (im, i) {
                im.classList.toggle('is-active', i === idx);
                // opacidad también inline: las imágenes ya traen opacity:0/1 en el
                // atributo style como red de seguridad si el CSS no cargara.
                im.style.opacity = i === idx ? '1' : '0';
            });
            dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
        }
        if (!('IntersectionObserver' in window)) return; // el paso 0 ya viene activo en el HTML

        var io = new IntersectionObserver(function (ents) {
            ents.forEach(function (en) {
                if (en.isIntersecting) activate(steps.indexOf(en.target));
            });
        }, { threshold: 0.55 });
        steps.forEach(function (s) { io.observe(s); });
    }

    /* ================================================================
       10. Rail de productos — arrastre con inercia + auto-deriva
       ================================================================ */
    function initRail() {
        var rail = document.getElementById('rail');
        var track = rail && rail.querySelector('.rail-track');
        if (!rail || !track) return;

        var half = 0;
        function measure() { half = track.scrollWidth / 2; }
        measure();
        window.addEventListener('resize', measure);
        track.querySelectorAll('img').forEach(function (im) {
            if (!im.complete) im.addEventListener('load', measure, { once: true });
        });
        function wrap() {
            if (!half) return;
            if (rail.scrollLeft >= half) rail.scrollLeft -= half;
            else if (rail.scrollLeft <= 0) rail.scrollLeft += half;
        }
        rail.addEventListener('scroll', wrap, { passive: true });

        var paused = reduce;
        (function drift() {
            if (!paused) { rail.scrollLeft += 0.4; wrap(); }
            requestAnimationFrame(drift);
        })();
        rail.addEventListener('pointerenter', function () { paused = true; });
        rail.addEventListener('pointerleave', function () { paused = reduce; });
        rail.addEventListener('touchstart', function () { paused = true; }, { passive: true });

        // arrastre con mouse
        var down = false, sx = 0, sl = 0, moved = 0;
        rail.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'touch') return;
            down = true; moved = 0; sx = e.clientX; sl = rail.scrollLeft;
            rail.classList.add('is-grabbing'); paused = true;
        });
        window.addEventListener('pointermove', function (e) {
            if (!down) return;
            var dx = e.clientX - sx; moved = Math.abs(dx);
            rail.scrollLeft = sl - dx; wrap();
        });
        window.addEventListener('pointerup', function () {
            if (!down) return;
            down = false; rail.classList.remove('is-grabbing');
            setTimeout(function () { paused = reduce; }, 1200);
        });
        rail.addEventListener('click', function (e) {
            if (moved > 8) { e.preventDefault(); e.stopPropagation(); }
        }, true);
    }

    /* ================================================================
       11. Slider de testimonios — arrastrable + dots + autoplay
       ================================================================ */
    function initTestimonials() {
        var slider = document.getElementById('tstSlider');
        var track = slider && slider.querySelector('.tst-track');
        var dotsWrap = document.getElementById('tstDots');
        if (!slider || !track) return;
        var cards = [].slice.call(track.children);
        var idx = 0, timer = 0;

        function cardStep() {
            if (cards.length < 2) return slider.clientWidth;
            return cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
        }
        function go(i) {
            idx = (i + cards.length) % cards.length;
            track.style.transform = 'translateX(' + (-idx * cardStep()) + 'px)';
            if (dotsWrap) [].forEach.call(dotsWrap.children, function (d, k) {
                d.classList.toggle('is-active', k === idx);
            });
        }
        if (dotsWrap) {
            cards.forEach(function (_, i) {
                var b = document.createElement('button');
                b.type = 'button'; b.setAttribute('aria-label', 'Testimonio ' + (i + 1));
                b.addEventListener('click', function () { go(i); restart(); });
                dotsWrap.appendChild(b);
            });
        }
        function restart() {
            if (reduce) return;
            clearInterval(timer);
            timer = setInterval(function () { go(idx + 1); }, 5200);
        }
        go(0); restart();
        window.addEventListener('resize', function () { go(idx); });
        slider.addEventListener('pointerenter', function () { clearInterval(timer); });
        slider.addEventListener('pointerleave', restart);

        // arrastre
        var down = false, sx = 0, moved = 0;
        track.addEventListener('pointerdown', function (e) {
            down = true; sx = e.clientX; moved = 0;
            track.classList.add('is-grabbing'); clearInterval(timer);
        });
        window.addEventListener('pointermove', function (e) {
            if (!down) return;
            moved = e.clientX - sx;
            track.style.transform = 'translateX(' + (-idx * cardStep() + moved) + 'px)';
        });
        window.addEventListener('pointerup', function () {
            if (!down) return;
            down = false; track.classList.remove('is-grabbing');
            if (Math.abs(moved) > 60) go(idx + (moved < 0 ? 1 : -1));
            else go(idx);
            restart();
        });
    }

    /* ================================================================
       12. Cortina de transición entre páginas internas
       ================================================================ */
    function initPageTransition() {
        var curtain = document.querySelector('.page-curtain');
        if (!curtain || reduce) return;

        // Entrada al cargar (si venimos de otra página con la marca puesta)
        try {
            if (sessionStorage.getItem('se-nav') === '1') {
                sessionStorage.removeItem('se-nav');
                curtain.classList.add('is-in');
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        curtain.classList.remove('is-in');
                        curtain.classList.add('is-out');
                        setTimeout(function () { curtain.classList.remove('is-out'); }, 620);
                    });
                });
            }
        } catch (e) {}

        document.addEventListener('click', function (e) {
            var a = e.target.closest('a[data-transition]');
            if (!a) return;
            var href = a.getAttribute('href');
            if (!href || href.charAt(0) === '#' || a.target === '_blank' || e.metaKey || e.ctrlKey) return;
            if (a.hostname && a.hostname !== location.hostname) return;
            e.preventDefault();
            curtain.classList.add('is-in');
            try { sessionStorage.setItem('se-nav', '1'); } catch (err) {}
            setTimeout(function () { location.href = href; }, 520);
        });
    }

    /* ================================================================
       Init
       ================================================================ */
    function forceVisible() {
        [].forEach.call(document.querySelectorAll('.reveal'), function (el) { el.classList.add('in-view'); });
        var hero = document.querySelector('.hero');
        if (hero) hero.classList.add('hero-ready');
        var pre = document.getElementById('preloader');
        if (pre) pre.classList.add('is-done');
    }

    onReady(function () {
        try {
            document.documentElement.classList.add('anim-on');
            initPreloader();
            initCursor();
            initReveal();
            initCount();
            initHero();
            initParticles();
            initTilt();
            initMagnet();
            initRipple();
            initMarquee();
            initDrawSvg();
            initMomentos();
            initRail();
            initTestimonials();
            initPageTransition();
        } catch (err) {
            // si algo revienta, el contenido NUNCA debe quedar oculto
            forceVisible();
            if (window.console) console.error('anim.js:', err);
        }
    });

    window.SE = { rescan: function () { initReveal(); initCount(); } };
})();
