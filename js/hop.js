(function () {
    // "actually think." in the home headline does a little stop-motion wave on its own:
    // each letter hops in turn, three times with a short pause between, then it rests.
    // It only waves while the headline is on screen. Screen readers keep the plain sentence.

    var title = document.querySelector('.rd-hero__title');
    var words = title && title.querySelector('em');
    if (!words) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var FIRST = 1600;    // after the headline has faded in
    var EVERY = 2600;    // then again: about a second of wave, then a pause
    var TIMES = 3;       // and then it stops
    var STAGGER = 55;    // between one letter and the next

    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());

    // wrap each word (so words never break across lines) and each letter in a span
    Array.prototype.slice.call(words.childNodes).forEach(function (child) {
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
        words.replaceChild(frag, child);
    });

    var letters = Array.prototype.slice.call(words.querySelectorAll('.rd-hop'));
    letters.forEach(function (el, i) {
        el.style.animationDelay = (i * STAGGER) + 'ms';
        el.addEventListener('animationend', function () {
            el.classList.remove('is-hopping');
        });
    });

    function wave() {
        letters.forEach(function (el) { el.classList.add('is-hopping'); });
    }

    // only wave while the headline is on screen and the tab is in view
    var visible = true;
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
        }).observe(title);
    }

    var waved = 0;
    function tick() {
        if (visible && !document.hidden) {
            wave();
            waved++;
        }
        if (waved < TIMES) setTimeout(tick, EVERY);
    }
    setTimeout(tick, FIRST);
})();
