(function () {
    // Data Body's tile: numbers falling down a dark projection around a human
    // figure, like the installation, with a soft glow where the heart and brain
    // were touch points. Runs only while the tile is on screen; with reduced motion
    // it draws one still frame.
    var canvases = document.querySelectorAll('canvas.rd-data-rain');
    if (!canvases.length) return;
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    Array.prototype.forEach.call(canvases, function (canvas) {
        var ctx = canvas.getContext('2d');
        var size = 12, cols = [], w = 0, h = 0, running = false, last = 0, tick = 0;

        function resize() {
            var r = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
            w = r.width; h = r.height;
            canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            cols = [];
            for (var x = size; x < w; x += size * 2.4) {
                cols.push({ x: x, y: Math.random() * h, speed: 0.3 + Math.random() * 0.9, len: 5 + Math.floor(Math.random() * 12) });
            }
        }

        // the figure: head, neck and shoulders as one outline, centred and running off the bottom
        function figure() {
            var cx = w / 2, headR = h * 0.12, headY = h * 0.3;
            var neck = headR * 0.42, shoulderY = headY + headR * 1.75, sw = Math.min(w * 0.3, h * 0.42);
            var a = Math.asin(neck / headR), neckTop = headY + headR * Math.cos(a);
            ctx.beginPath();
            // from where the neck meets the head on the left, over the top, to the right
            ctx.arc(cx, headY, headR, Math.PI / 2 + a, Math.PI / 2 - a);
            ctx.lineTo(cx + neck, shoulderY - headR * 0.3);
            ctx.bezierCurveTo(cx + neck, shoulderY, cx + sw * 0.7, shoulderY, cx + sw * 0.88, shoulderY + headR * 0.25);
            ctx.bezierCurveTo(cx + sw, shoulderY + headR * 0.4, cx + sw, shoulderY + headR * 0.9, cx + sw, shoulderY + headR * 1.3);
            ctx.lineTo(cx + sw, h + 2);
            ctx.lineTo(cx - sw, h + 2);
            ctx.lineTo(cx - sw, shoulderY + headR * 1.3);
            ctx.bezierCurveTo(cx - sw, shoulderY + headR * 0.9, cx - sw, shoulderY + headR * 0.4, cx - sw * 0.88, shoulderY + headR * 0.25);
            ctx.bezierCurveTo(cx - sw * 0.7, shoulderY, cx - neck, shoulderY, cx - neck, shoulderY - headR * 0.3);
            ctx.lineTo(cx - neck, neckTop);
            ctx.closePath();
            return { cx: cx, headY: headY, heartY: shoulderY + headR * 1.1, sw: sw };
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            ctx.font = size + 'px "IBM Plex Mono", ui-monospace, Menlo, monospace';
            // numbers fade in just below the top edge, as if falling into the light
            var fade = h * 0.12;
            cols.forEach(function (c) {
                for (var i = 0; i < c.len; i++) {
                    var y = c.y - i * size * 1.3;
                    if (y < -size || y > h + size) continue;
                    var a = (i === 0 ? 0.7 : 0.35 * (1 - i / c.len)) * Math.pow(Math.min(1, Math.max(0, y / fade)), 2);
                    ctx.fillStyle = 'rgba(238, 240, 244,' + a + ')';
                    ctx.fillText(Math.floor(Math.random() * 10), c.x, y);
                }
            });
            var f = figure();
            ctx.fillStyle = '#191d27';
            ctx.fill();
            ctx.strokeStyle = 'rgba(238, 240, 244, 0.28)';
            ctx.lineWidth = 1;
            ctx.stroke();
            // the two touch points, breathing slowly
            var pulse = still ? 0.6 : 0.45 + 0.35 * Math.sin(tick / 9);
            [[f.cx + f.sw * 0.18, f.heartY], [f.cx, f.headY]].forEach(function (p) {
                var g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], h * 0.06);
                g.addColorStop(0, 'rgba(255, 107, 74,' + pulse + ')');
                g.addColorStop(1, 'rgba(255, 107, 74, 0)');
                ctx.fillStyle = g;
                ctx.fillRect(p[0] - h * 0.06, p[1] - h * 0.06, h * 0.12, h * 0.12);
            });
        }

        function step(t) {
            if (!running) return;
            if (t - last > 70) {
                last = t;
                tick++;
                cols.forEach(function (c) {
                    c.y += c.speed * size;
                    if (c.y - c.len * size * 1.25 > h) c.y = -Math.random() * h * 0.5;
                });
                draw();
            }
            requestAnimationFrame(step);
        }

        resize(); draw();
        window.addEventListener('resize', function () { resize(); draw(); });
        if (still || !('IntersectionObserver' in window)) return;
        new IntersectionObserver(function (entries) {
            var on = entries[0].isIntersecting;
            if (on && !running) { running = true; requestAnimationFrame(step); }
            else if (!on) running = false;
        }).observe(canvas);
    });
})();
