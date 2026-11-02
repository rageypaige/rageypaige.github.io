// The two headline tiles on the home page each play one small moment from the product
// on a loop: adding a Petro-Points offer, and taking a Duet Booth strip. Each is drawn
// on a 560px square stage that's scaled to fit its tile. A loop only starts while the
// tile is on screen; with reduced motion, each shows a single still moment instead.
(function () {
    var STAGE = 560;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function wait(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    function setup(mini, run, still) {
        var stage = mini.querySelector('.rd-mini__stage');
        var scale = 1;
        var visible = false;
        var waiting = [];

        function fit() {
            var w = mini.clientWidth, h = mini.clientHeight;
            scale = Math.min(w, h) / STAGE;
            stage.style.transform = 'translate(' + (w - STAGE * scale) / 2 + 'px,' + (h - STAGE * scale) / 2 + 'px) scale(' + scale + ')';
        }
        fit();
        if ('ResizeObserver' in window) new ResizeObserver(fit).observe(mini);
        else window.addEventListener('resize', fit);

        var ctx = {
            stage: stage,
            // an element's box in stage pixels, whatever the stage is scaled to
            rel: function (el) {
                var r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
                return { x: (r.left - s.left) / scale, y: (r.top - s.top) / scale, w: r.width / scale, h: r.height / scale };
            },
            onScreen: function () {
                return visible ? Promise.resolve() : new Promise(function (resolve) { waiting.push(resolve); });
            }
        };

        if (reduceMotion || !('IntersectionObserver' in window)) {
            still(ctx);
            return;
        }

        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            if (visible) waiting.splice(0).forEach(function (resolve) { resolve(); });
        }, { threshold: 0.25 }).observe(mini);

        (async function () {
            for (;;) {
                await ctx.onScreen();
                await run(ctx);
            }
        })();
    }

    /* PETRO: tap "Add offer", it turns into "Offer added", confetti */

    var petro = document.querySelector('[data-mini="petro"]');
    if (petro) {
        var offer = petro.querySelector('.rd-mini-offer');
        var btn = petro.querySelector('.rd-mini-btn');
        var add = petro.querySelector('.rd-mini-btn__add');
        var tap = petro.querySelector('.rd-mini-tap');
        var OFFER = 'translate(-50%, -50%) scale(1.3)';
        var COLORS = ['#e4002b', '#e4002b', '#f2b84b', '#f5a3b0', '#ffffff', '#c8102e'];

        var burst = function (ctx, x, y) {
            for (var i = 0; i < 22; i++) {
                var bit = document.createElement('span');
                bit.className = 'rd-mini-bit';
                bit.style.background = COLORS[i % COLORS.length];
                if (COLORS[i % COLORS.length] === '#ffffff') bit.style.boxShadow = '0 0 0 .5px rgba(0,0,0,.12)';
                bit.style.left = x + 'px';
                bit.style.top = y + 'px';
                ctx.stage.appendChild(bit);
                var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 90 + Math.random() * 90;
                var dx = Math.cos(a) * v, dy = Math.sin(a) * v, r = (Math.random() - 0.5) * 540;
                bit.animate([
                    { transform: 'translate(-50%,-50%) rotate(0) scale(.6)', opacity: 1 },
                    { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) rotate(' + r / 2 + 'deg) scale(1)', opacity: 1, offset: 0.45 },
                    { transform: 'translate(calc(-50% + ' + dx * 1.15 + 'px), calc(-50% + ' + (dy + 90) + 'px)) rotate(' + r + 'deg) scale(.9)', opacity: 0 }
                ], { duration: 1100 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = function () { this.effect.target.remove(); };
            }
        };

        setup(petro, async function (ctx) {
            btn.classList.remove('is-added');
            await wait(300);
            await offer.animate([
                { opacity: 0, transform: 'translate(-50%, -38%) scale(1.22)', filter: 'blur(4px)' },
                { opacity: 1, transform: OFFER, filter: 'blur(0)' }
            ], { duration: 800, easing: 'cubic-bezier(.16,.8,.3,1)', fill: 'forwards' }).finished;
            var b = ctx.rel(add), x = b.x + b.w / 2, y = b.y + b.h / 2;
            tap.style.left = x + 'px';
            tap.style.top = y + 'px';
            await wait(500);
            tap.classList.add('is-on');
            await wait(450);
            tap.classList.add('is-down');
            btn.classList.add('is-pressed');
            await wait(160);
            tap.classList.remove('is-down');
            btn.classList.remove('is-pressed');
            btn.classList.add('is-added');
            burst(ctx, x, y);
            await wait(250);
            tap.classList.remove('is-on');
            await wait(2400);
            await offer.animate([
                { opacity: 1, transform: OFFER, filter: 'blur(0)' },
                { opacity: 0, transform: 'translate(-50%, -62%) scale(1.26)', filter: 'blur(4px)' }
            ], { duration: 600, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).finished;
        }, function () {
            offer.style.opacity = 1;
        });
    }

    /* DUET BOOTH: four shots drop into the booth, then gather into a tilted strip */

    var duet = document.querySelector('[data-mini="duet"]');
    if (duet) {
        var booth = duet.querySelector('.rd-mini-booth');
        var shutter = duet.querySelector('.rd-mini-shutter');
        var flash = duet.querySelector('.rd-mini-flash');
        var art = duet.querySelector('.rd-mini-art');
        var strip = duet.querySelector('.rd-mini-strip');
        var note = duet.querySelector('.rd-mini-note');
        var arrow = duet.querySelector('.rd-mini-arrow');
        var cursor = duet.querySelector('.rd-mini-cursor');
        var photos = [].slice.call(duet.querySelectorAll('.rd-mini-photo'));
        var slots = [].slice.call(duet.querySelectorAll('.rd-mini-slot'));
        var BOOTH = 'translate(-50%, -50%) scale(1.3)';

        // the finished strip: tilted, a little left of centre, with the note to its right
        var PW = 80, PH = 104, PAD = 6, GAP = 6, TILT = -4, SX = 150, SY = 58;
        var stripAt = function (i) {
            var lx = PAD, ly = PAD + i * (PH + GAP), t = TILT * Math.PI / 180;
            return { x: SX + lx * Math.cos(t) - ly * Math.sin(t), y: SY + lx * Math.sin(t) + ly * Math.cos(t) };
        };
        var toStrip = function (stagger) {
            strip.style.width = (PW + PAD * 2) + 'px';
            strip.style.height = (PH * 4 + GAP * 3 + PAD * 2) + 'px';
            strip.style.transform = 'translate(' + SX + 'px,' + SY + 'px) rotate(' + TILT + 'deg)';
            photos.forEach(function (p, i) {
                var q = stripAt(i);
                p.style.transitionDelay = stagger ? (i * 60) + 'ms' : '0ms';
                p.style.width = PW + 'px';
                p.style.height = PH + 'px';
                p.style.transform = 'translate(' + q.x + 'px,' + q.y + 'px) rotate(' + TILT + 'deg)';
            });
            arrow.style.left = (SX + PW + 24) + 'px';
            arrow.style.top = (SY + 38) + 'px';
            note.style.left = (SX + PW + 70) + 'px';
            note.style.top = (SY + 4) + 'px';
        };
        // the photos wait, hidden, inside their slots
        var toSlots = function (ctx) {
            photos.forEach(function (p, i) {
                p.style.transition = 'none';
                p.classList.remove('is-in');
                var r = ctx.rel(slots[i]);
                p.style.width = (r.w - 4) + 'px';
                p.style.height = (r.h - 4) + 'px';
                p.style.transform = 'translate(' + (r.x + 2) + 'px,' + (r.y + 2) + 'px)';
                p.offsetWidth;
                p.style.transition = '';
            });
        };
        var fontReady = document.fonts ? Promise.race([document.fonts.load('500 30px Caveat'), wait(3000)]) : Promise.resolve();

        setup(duet, async function (ctx) {
            await fontReady;
            slots.forEach(function (s) { s.style.opacity = 1; });
            [strip, note, arrow].forEach(function (el) { el.classList.remove('is-on'); });
            await wait(300);
            await booth.animate([
                { opacity: 0, transform: 'translate(-50%, -38%) scale(1.2)', filter: 'blur(4px)' },
                { opacity: 1, transform: BOOTH, filter: 'blur(0)' }
            ], { duration: 800, easing: 'cubic-bezier(.16,.8,.3,1)', fill: 'forwards' }).finished;
            toSlots(ctx);
            art.animate([{ opacity: 1, transform: 'none', filter: 'none' }], { duration: 1, fill: 'forwards' });

            // the cursor comes in and takes four shots
            var sh = ctx.rel(shutter);
            cursor.style.transition = 'none';
            cursor.style.transform = 'translate(' + (sh.x + 150) + 'px,' + (sh.y + 90) + 'px)';
            cursor.offsetWidth;
            cursor.style.transition = '';
            cursor.classList.add('is-on');
            cursor.style.transform = 'translate(' + (sh.x + sh.w / 2 - 4) + 'px,' + (sh.y + sh.h / 2 - 2) + 'px)';
            await wait(1000);
            for (var i = 0; i < 4; i++) {
                shutter.classList.add('is-down');
                await wait(110);
                shutter.classList.remove('is-down');
                flash.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 380, easing: 'ease-out' });
                photos[i].classList.add('is-in');
                slots[i].style.opacity = 0;
                await wait(i < 3 ? 600 : 450);
            }
            cursor.classList.remove('is-on');
            await wait(250);

            // the booth steps back and the shots gather into one strip
            booth.animate([
                { opacity: 1, transform: BOOTH },
                { opacity: 0, transform: 'translate(-50%, -46%) scale(1.22)' }
            ], { duration: 600, easing: 'ease', fill: 'forwards' });
            toStrip(true);
            await wait(700);
            strip.classList.add('is-on');
            await wait(500);
            arrow.classList.add('is-on');
            note.classList.add('is-on');
            await wait(2800);
            await art.animate([
                { opacity: 1, transform: 'none', filter: 'blur(0)' },
                { opacity: 0, transform: 'translateY(-36px)', filter: 'blur(4px)' }
            ], { duration: 650, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).finished;
        }, function () {
            // still: just the finished strip
            photos.forEach(function (p) { p.style.transition = 'none'; p.classList.add('is-in'); p.style.animation = 'none'; });
            toStrip(false);
            [strip, note, arrow].forEach(function (el) { el.style.transition = 'none'; el.classList.add('is-on'); });
        });
    }
})();
