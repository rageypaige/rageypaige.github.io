(function () {
    // Two bits of stop-motion in the home headline:
    // - "actually think." waves on its own: each letter hops in turn, on a loop with a
    //   short pause between waves, while the headline is on screen
    // - the rest of the sentence gives a small hop, a letter at a time, as the cursor
    //   passes over it
    // Screen readers keep the plain sentence.

    var title = document.querySelector('.rd-hero__title');
    if (!title) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var FIRST = 1600;    // first wave, after the headline has faded in
    var EVERY = 2600;    // then again on a loop: about a second of wave, then a pause
    var STAGGER = 55;    // between one letter and the next in a wave

    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());

    // wrap each word (so words never break across lines) and each letter in a span
    function split(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
            if (child.nodeType === 1) { split(child); return; }
            if (child.nodeType !== 3) return;
            var frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(function (part) {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                var word = document.createElement('span');
                word.className = 'rd-hop-word';
                word.setAttribute('aria-hidden', 'true');
                Array.prototype.forEach.call(part, function (ch) {
                    var letter = document.createElement('span');
                    letter.className = 'rd-hop';
                    letter.textContent = ch;
                    word.appendChild(letter);
                });
                frag.appendChild(word);
            });
            node.replaceChild(frag, child);
        });
    }
    split(title);

    var all = Array.prototype.slice.call(title.querySelectorAll('.rd-hop'));
    var waving = all.filter(function (el) { return el.closest('em'); });
    var nudging = all.filter(function (el) { return !el.closest('em'); });

    // the wave
    waving.forEach(function (el, i) {
        el.style.animationDelay = (i * STAGGER) + 'ms';
        el.addEventListener('animationend', function () {
            el.classList.remove('is-hopping');
        });
    });

    var visible = true;
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
        }).observe(title);
    }

    setTimeout(function () {
        function wave() {
            waving.forEach(function (el) { el.classList.add('is-hopping'); });
        }
        wave();
        setInterval(function () {
            if (visible && !document.hidden) wave();
        }, EVERY);
    }, FIRST);

    // the hover hop (only where there's a cursor)
    if (!window.matchMedia('(hover: hover)').matches) return;
    nudging.forEach(function (el) {
        el.addEventListener('mouseenter', function () {
            el.classList.add('is-nudged');
        });
        el.addEventListener('animationend', function () {
            el.classList.remove('is-nudged');
        });
    });
})();
