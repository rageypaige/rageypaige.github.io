(function () {
    // Skip photos that aren't uploaded yet (js/film-hidden.js).
    var hidden = window.FILM_HIDDEN || [];
    var photos = (window.FILM_PHOTOS || []).filter(function (p) { return hidden.indexOf(p.src) === -1; });
    var canvas = document.getElementById('film-canvas');
    var lightbox = document.getElementById('film-lightbox');
    if (!photos.length || !canvas || !lightbox) return;

    function pad(n) {
        return String(n).padStart(3, '0');
    }

    function makeFrame(photo, index, className, large) {
        var el;
        if (photo.src) {
            el = document.createElement('img');
            el.src = (large && photo.full) || photo.src;
            el.alt = photo.caption || 'Film photo ' + (index + 1);
            el.width = photo.w;
            el.height = photo.h;
            el.loading = 'lazy';
            el.decoding = 'async';
            el.draggable = false;
        } else {
            el = document.createElement('div');
            el.className = 'rd-film-ph';
            el.textContent = pad(index + 1);
            el.style.aspectRatio = photo.w + ' / ' + photo.h;
            el.setAttribute('role', 'img');
            el.setAttribute('aria-label', 'Placeholder for photo ' + (index + 1));
        }
        el.classList.add(className);
        return el;
    }

    // Deterministic pseudo-random, so the layout is the same on every visit.
    function rand(seed) {
        var x = Math.sin(seed * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    /* CANVAS: photos scattered on a jittered grid; the grid wraps, so panning never ends.
       Each print stays inside its own cell, less PRINT_GAP, so no two prints can
       overlap, including across the wrap. */

    var CELL_W = 340;
    var CELL_H = 410;
    var PRINT_GAP = 36;
    var CAPTION_H = 28;
    var WRAP_MARGIN = 450;
    var cols = Math.ceil(Math.sqrt(photos.length * 1.2));
    var rows = Math.ceil(photos.length / cols);
    var worldW = cols * CELL_W;
    var worldH = rows * CELL_H;

    // Sizes and places one print inside its own cell, for a given shape (height / width).
    // Whatever the shape, the print is shrunk to fit the cell less PRINT_GAP, which is
    // what guarantees no two prints can ever touch.
    function place(it, ratio) {
        var width = Math.round((ratio > 1 ? 200 : 290) * (0.85 + rand(it.index + 1) * 0.3));
        width = Math.min(width, CELL_W - PRINT_GAP, Math.floor((CELL_H - PRINT_GAP - CAPTION_H) / ratio));
        var height = Math.round(width * ratio) + CAPTION_H;
        var slackX = CELL_W - PRINT_GAP - width;
        var slackY = CELL_H - PRINT_GAP - height;
        // Each column is slid down by its own amount (a whole column moves together, so
        // cells still never overlap), which keeps prints from lining up in rows.
        var colShift = mod(it.col * 0.618 + rand(it.col + 301) * 0.2, 1) * CELL_H;
        it.ratio = ratio;
        it.w = width;
        it.h = height;
        it.x = it.col * CELL_W + rand(it.index + 101) * slackX;
        it.y = it.row * CELL_H + colShift + rand(it.index + 201) * slackY;
        it.el.style.width = width + 'px';
    }

    var items = photos.map(function (photo, index) {
        var fig = document.createElement('figure');
        fig.className = 'rd-canvas__item';

        var print = document.createElement('button');
        print.type = 'button';
        print.className = 'rd-canvas__print';
        print.setAttribute('aria-label', 'Open photo ' + (index + 1));
        var frame = makeFrame(photo, index, 'rd-canvas__img');
        print.appendChild(frame);
        print.addEventListener('click', function () { openLightbox(index); });
        fig.appendChild(print);

        var cap = document.createElement('figcaption');
        cap.className = 'rd-canvas__caption rd-film-type';
        var no = document.createElement('span');
        no.className = 'rd-frame-no';
        no.textContent = pad(index + 1);
        cap.appendChild(no);
        if (photo.caption) {
            cap.appendChild(document.createTextNode(photo.caption));
        }
        fig.appendChild(cap);

        // Easter egg: one print has a tiny cat lounging on top of it. It's outside the
        // print's button, so feeding it (js/cat-garden.js) doesn't open the photo.
        if (photo.cat) {
            var cat = document.createElement('span');
            cat.className = 'rd-cat rd-cat--on-top rd-film-cat';
            cat.innerHTML = '<span class="rd-cat__inner" data-face="ᓚᘏᗢ" data-fed="ᓚᘏᗢ nom" data-blink="ᓚᘏᗢ zᶻ">ᓚᘏᗢ</span>';
            fig.appendChild(cat);
        }

        var it = { el: fig, group: photo.group, index: index, col: index % cols, row: Math.floor(index / cols) };
        place(it, photo.h / photo.w);

        // Safety net: if a photo turns out to be a different shape once it loads (a
        // rotation flag in the file, say), re-fit it to its cell so it still can't
        // spill into its neighbours.
        if (frame.tagName === 'IMG') {
            frame.addEventListener('load', function () {
                var ratio = frame.naturalHeight / frame.naturalWidth;
                if (!ratio || Math.abs(ratio - it.ratio) < 0.01) return;
                place(it, ratio);
                if (organized) layoutGroups();
                render(); // at once, not on the next frame: its new size is already showing
            });
        }

        return it;
    });

    /* ORGANIZED: prints sorted into labelled group blocks, on a bounded canvas */

    var GROUP_GAP = 120;
    var ITEM_GAP = 24;
    var LABEL_H = 64;
    var TOP_EDGE = 48;
    var SIDE_EDGE = 60;
    var BOTTOM_EDGE = 200;
    var groupNames = (window.FILM_GROUPS || []).filter(function (g) {
        return items.some(function (it) { return it.group === g; });
    });
    var labels = groupNames.map(function (name) {
        var count = items.filter(function (it) { return it.group === name; }).length;
        var el = document.createElement('div');
        el.className = 'rd-canvas__group';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = '<span class="rd-canvas__group-name"></span><span class="rd-canvas__group-count rd-film-type"></span>';
        el.firstChild.textContent = name;
        el.lastChild.textContent = count;
        return { el: el, name: name, x: 0, y: 0 };
    });
    var layoutW = 0;
    var layoutH = 0;

    function layoutGroups() {
        var vw = canvas.clientWidth;
        var blockW = Math.min(1000, vw - SIDE_EDGE * 2);
        var cols = Math.max(1, Math.min(3, Math.floor((vw - SIDE_EDGE * 2 + GROUP_GAP) / (blockW + GROUP_GAP))));
        var colHeights = [];
        for (var c = 0; c < cols; c++) colHeights.push(0);

        labels.forEach(function (label) {
            var c = colHeights.indexOf(Math.min.apply(null, colHeights));
            var ox = c * (blockW + GROUP_GAP);
            var oy = colHeights[c];
            label.x = ox;
            label.y = oy;

            var x = 0, y = LABEL_H, rowH = 0;
            items.filter(function (it) { return it.group === label.name; }).forEach(function (it) {
                if (x > 0 && x + it.w > blockW) {
                    x = 0;
                    y += rowH + ITEM_GAP;
                    rowH = 0;
                }
                it.ox = ox + x;
                it.oy = oy + y;
                x += it.w + ITEM_GAP;
                rowH = Math.max(rowH, it.h);
            });
            colHeights[c] = oy + y + rowH + GROUP_GAP;
        });

        layoutW = cols * blockW + (cols - 1) * GROUP_GAP;
        layoutH = Math.max.apply(null, colHeights) - GROUP_GAP;
    }

    var organized = false;
    var scatterCam = null;
    var frameRequested = false;

    /* CAMERA: the view floats towards where you've scrolled or dragged it (the goal),
       covering a share of the remaining distance each frame, so it eases to a stop. */

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var FLOAT = reduceMotion ? 1 : 0.07;      // scrolling and throws: slow, floaty
    var DRAG_FLOAT = reduceMotion ? 1 : 0.2;  // while dragging: follows the hand more closely
    var THROW = reduceMotion ? 0 : 14;        // how far a flick carries, in frames of its speed
    var camX = -80;
    var camY = -40;
    var goalX = camX;
    var goalY = camY;
    var ease = FLOAT;
    var floating = false;
    var lastFrame = 0;

    // Keep the organized view from panning off into empty space.
    function clampToLayout(p) {
        if (!organized) return p;
        var maxX = Math.max(-SIDE_EDGE, layoutW + SIDE_EDGE - canvas.clientWidth);
        var maxY = Math.max(-TOP_EDGE, layoutH + BOTTOM_EDGE - canvas.clientHeight);
        return {
            x: Math.min(Math.max(p.x, -SIDE_EDGE), maxX),
            y: Math.min(Math.max(p.y, -TOP_EDGE), maxY)
        };
    }

    function clampCamera() {
        var cam = clampToLayout({ x: camX, y: camY });
        var goal = clampToLayout({ x: goalX, y: goalY });
        camX = cam.x;
        camY = cam.y;
        goalX = goal.x;
        goalY = goal.y;
    }

    function floatFrame(now) {
        // Scale the step by frame time, so it floats the same on 60Hz and 120Hz screens.
        var dt = lastFrame ? Math.min(64, now - lastFrame) : 16.7;
        lastFrame = now;
        var k = 1 - Math.pow(1 - ease, dt / 16.7);
        var dx = goalX - camX;
        var dy = goalY - camY;
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
            camX = goalX;
            camY = goalY;
            floating = false;
        } else {
            camX += dx * k;
            camY += dy * k;
        }
        render();
        if (floating) requestAnimationFrame(floatFrame);
    }

    function floatTo(x, y) {
        var goal = clampToLayout({ x: x, y: y });
        goalX = goal.x;
        goalY = goal.y;
        if (!floating) {
            floating = true;
            lastFrame = 0;
            requestAnimationFrame(floatFrame);
        }
    }

    // Move the view at once, with no float (switching between Organize and Scatter).
    function jumpTo(x, y) {
        camX = goalX = x;
        camY = goalY = y;
    }

    function render() {
        frameRequested = false;
        clampCamera();
        items.forEach(function (it) {
            var sx, sy;
            if (organized) {
                sx = it.ox - camX;
                sy = it.oy - camY;
            } else {
                sx = mod(it.x - camX + WRAP_MARGIN, worldW) - WRAP_MARGIN;
                sy = mod(it.y - camY + WRAP_MARGIN, worldH) - WRAP_MARGIN;
            }
            it.el.style.transform = 'translate(' + sx + 'px, ' + sy + 'px)';
        });
        labels.forEach(function (label) {
            label.el.style.transform = 'translate(' + (label.x - camX) + 'px, ' + (label.y - camY) + 'px)';
        });
    }

    var arrangeTimer = null;
    function setOrganized(on) {
        if (on === organized) return;
        if (on) {
            scatterCam = { x: goalX, y: goalY };
            layoutGroups();
            jumpTo(-SIDE_EDGE, -TOP_EDGE);
        } else if (scatterCam) {
            jumpTo(scatterCam.x, scatterCam.y);
        }
        organized = on;
        canvas.classList.add('is-arranging');
        canvas.classList.toggle('is-organized', on);
        clearTimeout(arrangeTimer);
        arrangeTimer = setTimeout(function () { canvas.classList.remove('is-arranging'); }, 900);
        render();
    }

    var organizeBtn = document.querySelector('.rd-film-organize');
    if (organizeBtn && labels.length) {
        organizeBtn.hidden = false;
        organizeBtn.addEventListener('click', function () {
            setOrganized(!organized);
            organizeBtn.setAttribute('aria-pressed', String(organized));
            organizeBtn.textContent = organized ? 'Scatter' : 'Organize';
        });
    }

    function requestRender() {
        if (!frameRequested) {
            frameRequested = true;
            requestAnimationFrame(render);
        }
    }

    // Position every print before it goes on the page. Added unpositioned, they'd all
    // sit at the top-left for a moment, count as on screen, and all lazy-load at once.
    render();
    items.forEach(function (it) { canvas.appendChild(it.el); });
    labels.forEach(function (label) { canvas.appendChild(label.el); });
    window.addEventListener('resize', function () {
        if (organized) layoutGroups();
        requestRender();
    });

    // Drag to pan. Pointer capture only starts once the pointer has actually moved,
    // so a plain click on a photo still reaches its button.
    var dragging = false;
    var moved = false;
    var startX, startY, startGoalX, startGoalY, lastX, lastY, lastT;
    var vx = 0;
    var vy = 0;

    canvas.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        dragging = true;
        moved = false;
        startX = lastX = e.clientX;
        startY = lastY = e.clientY;
        lastT = performance.now();
        // Grabbing mid-float catches the canvas where it's heading, not where it is.
        startGoalX = goalX;
        startGoalY = goalY;
        vx = vy = 0;
    });

    canvas.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        if (!moved) {
            if (dx * dx + dy * dy < 25) return;
            moved = true;
            canvas.setPointerCapture(e.pointerId);
            canvas.classList.add('is-dragging');
        }
        var now = performance.now();
        var dt = Math.max(1, now - lastT);
        vx = (e.clientX - lastX) / dt * 16;
        vy = (e.clientY - lastY) / dt * 16;
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = now;
        ease = DRAG_FLOAT;
        floatTo(startGoalX - dx, startGoalY - dy);
    });

    // On release, a flick throws the goal ahead and the canvas floats after it.
    function endDrag() {
        if (!dragging) return;
        dragging = false;
        canvas.classList.remove('is-dragging');
        ease = FLOAT;
        if (!moved) return;
        if (performance.now() - lastT > 80) vx = vy = 0; // held still before letting go
        floatTo(goalX - vx * THROW, goalY - vy * THROW);
    }

    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    canvas.addEventListener('wheel', function (e) {
        e.preventDefault();
        if (!dragging) ease = FLOAT;
        floatTo(goalX + e.deltaX, goalY + e.deltaY);
    }, { passive: false });

    // Tabbing to a photo floats it to the middle. Keyboard focus only: a click also
    // focuses the button, and re-centering then would make the canvas jump.
    canvas.addEventListener('focusin', function (e) {
        if (!e.target.matches(':focus-visible')) return;
        var fig = e.target.closest('.rd-canvas__item');
        var it = items.find(function (i) { return i.el === fig; });
        if (!it) return;
        var x = (organized ? it.ox : it.x) + it.w / 2 - canvas.clientWidth / 2;
        var y = (organized ? it.oy : it.y) + it.h / 2 - canvas.clientHeight / 2;
        if (!organized) {
            // The scatter wraps, so head for whichever copy of the photo is nearest.
            x = goalX + mod(x - goalX + worldW / 2, worldW) - worldW / 2;
            y = goalY + mod(y - goalY + worldH / 2, worldH) - worldH / 2;
        }
        ease = FLOAT;
        floatTo(x, y);
    });

    /* LIGHTBOX */

    var lbFrame = lightbox.querySelector('.rd-lightbox__frame');
    var lbCaption = lightbox.querySelector('.rd-lightbox__caption');
    var lbCount = lightbox.querySelector('.rd-lightbox__count');
    var lbClose = lightbox.querySelector('.rd-lightbox__close');
    var current = 0;
    var lastFocus = null;

    function renderLightbox() {
        var photo = photos[current];
        lbFrame.innerHTML = '';
        var el = makeFrame(photo, current, 'rd-lightbox__img', true);
        if (!photo.src) {
            // Placeholders have no intrinsic size, so size them to fit the viewport.
            el.style.width = 'min(80vw, calc((100vh - 220px) * ' + (photo.w / photo.h) + '))';
        }
        lbFrame.appendChild(el);
        lbCaption.textContent = photo.caption || '';
        lbCount.textContent = pad(current + 1) + ' / ' + pad(photos.length);
    }

    function openLightbox(index) {
        current = index;
        lastFocus = document.activeElement;
        renderLightbox();
        lightbox.hidden = false;
        lbClose.focus();
    }

    function closeLightbox() {
        lightbox.hidden = true;
        if (lastFocus) lastFocus.focus({ preventScroll: true });
    }

    function step(delta) {
        current = (current + delta + photos.length) % photos.length;
        renderLightbox();
    }

    lbClose.addEventListener('click', closeLightbox);
    lightbox.querySelector('.rd-lightbox__prev').addEventListener('click', function () { step(-1); });
    lightbox.querySelector('.rd-lightbox__next').addEventListener('click', function () { step(1); });
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
        if (lightbox.hidden) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
    });
})();
