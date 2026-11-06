(function () {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.documentElement.classList.add('rd-has-custom-cursor');

    var cursor = document.createElement('div');
    cursor.className = 'rd-cursor';
    document.body.appendChild(cursor);

    var hasGarden = !!document.querySelector('.rd-cat');
    if (hasGarden) {
        var fish = document.createElement('span');
        fish.className = 'rd-cursor__fish';
        fish.textContent = '<><';
        cursor.appendChild(fish);
    }

    var targetX = 0, targetY = 0, x = 0, y = 0;
    var hasMoved = false;
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Over the words themselves (not the space around them), the dot becomes a thin
    // text cursor, as tall as the line it's on. It blinks once the mouse rests.
    var NOT_TEXT = 'a, button, .rd-cat, input, textarea, .rd-canvas, .rd-lock';
    function textUnder(px, py) {
        var node, offset;
        if (document.caretRangeFromPoint) {
            var r = document.caretRangeFromPoint(px, py);
            if (!r) return null;
            node = r.startContainer; offset = r.startOffset;
        } else if (document.caretPositionFromPoint) {
            var c = document.caretPositionFromPoint(px, py);
            if (!c) return null;
            node = c.offsetNode; offset = c.offset;
        } else {
            return null;
        }
        if (!node || node.nodeType !== 3 || !node.textContent.trim()) return null;
        var el = node.parentElement;
        if (!el || el.closest(NOT_TEXT)) return null;
        // the caret lands on the nearest letter even in empty space, so check the
        // pointer is really over that letter's line
        var range = document.createRange();
        var start = Math.max(0, Math.min(offset, node.length - 1));
        range.setStart(node, start);
        range.setEnd(node, Math.min(start + 1, node.length));
        var box = range.getBoundingClientRect();
        if (!box.width || px < box.left - 12 || px > box.right + 12 || py < box.top || py > box.bottom) return null;
        return el;
    }

    var restTimer;
    function rest() {
        cursor.classList.remove('is-resting');
        clearTimeout(restTimer);
        if (!still) restTimer = setTimeout(function () { cursor.classList.add('is-resting'); }, 600);
    }

    window.addEventListener('mousemove', function (e) {
        targetX = e.clientX;
        targetY = e.clientY;
        if (!hasMoved) {
            hasMoved = true;
            x = targetX;
            y = targetY;
        }
        cursor.classList.add('is-visible');
        var textEl = cursor.classList.contains('is-hovering') ? null : textUnder(e.clientX, e.clientY);
        if (textEl) {
            var size = parseFloat(getComputedStyle(textEl).fontSize) || 16;
            cursor.style.setProperty('--caret-h', Math.round(Math.max(14, size * 1.15)) + 'px');
        }
        cursor.classList.toggle('is-text', !!textEl);
        rest();
        if (hasGarden) {
            cursor.classList.toggle('is-fishing', !!(e.target.closest && e.target.closest('.rd-footer, .rd-cat')));
        }
    });

    var throwTimer;
    document.addEventListener('click', function (e) {
        if (!hasGarden || !e.target.closest || !e.target.closest('.rd-cat')) return;
        cursor.classList.add('is-throwing');
        clearTimeout(throwTimer);
        throwTimer = setTimeout(function () {
            cursor.classList.remove('is-throwing');
        }, 700);
    });

    window.addEventListener('mouseout', function (e) {
        if (!e.relatedTarget) cursor.classList.remove('is-visible');
    });

    document.addEventListener('mouseover', function (e) {
        if (e.target.closest && e.target.closest('a, button, .rd-cat')) {
            cursor.classList.add('is-hovering');
        }
    });
    document.addEventListener('mouseout', function (e) {
        if (e.target.closest && e.target.closest('a, button, .rd-cat')) {
            cursor.classList.remove('is-hovering');
        }
    });

    function loop() {
        x += (targetX - x) * 0.18;
        y += (targetY - y) * 0.18;
        cursor.style.transform = 'translate(' + x + 'px, ' + y + 'px) translate(-50%, -50%)';
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
})();
