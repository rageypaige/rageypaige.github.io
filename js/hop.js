(function () {
    // Letters in the home headline give a small stop-motion hop as the cursor passes
    // over them, like a cat batting at them. Only the letter under the cursor moves.
    // Screen readers keep the plain sentence.

    var title = document.querySelector('.rd-hero__title');
    if (!title) return;
    if (!window.matchMedia('(hover: hover)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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

    var letters = Array.prototype.slice.call(title.querySelectorAll('.rd-hop'));

    letters.forEach(function (el) {
        el.addEventListener('mouseenter', function () {
            el.classList.add('is-hopping');
        });
        el.addEventListener('animationend', function () {
            el.classList.remove('is-hopping');
        });
    });
})();
