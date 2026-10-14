(function () {
    // Highlights the section you're reading in the left-hand list.
    var links = Array.prototype.slice.call(document.querySelectorAll('.rd-cs-toc ol a[href^="#"]'));
    var sections = links.map(function (a) {
        return document.getElementById(a.hash.slice(1));
    });
    if (!links.length || sections.indexOf(null) !== -1) return;

    var ticking = false;

    function update() {
        ticking = false;
        // The current section is the last one whose top has passed a third of the way down.
        var line = window.innerHeight / 3;
        var current = 0;
        sections.forEach(function (s, i) {
            if (s.getBoundingClientRect().top <= line) current = i;
        });
        // At the very bottom, the last section is current even if it's too short to reach the line.
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
            current = sections.length - 1;
        }
        links.forEach(function (a, i) {
            a.classList.toggle('is-active', i === current);
            if (i === current) a.setAttribute('aria-current', 'location');
            else a.removeAttribute('aria-current');
        });
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
})();

(function () {
    // Live embeds (.rd-cs-embed) render at a real window size and are scaled down to
    // fit the column: a laptop window normally, a phone screen when the column is narrow.
    var boxes = document.querySelectorAll('.rd-cs-embed');
    if (!boxes.length) return;

    function fit() {
        Array.prototype.forEach.call(boxes, function (box) {
            var width = box.clientWidth;
            var phone = width < 600;
            var w = phone ? 390 : 1200;
            var h = phone ? 780 : 860;
            box.style.setProperty('--embed-w', w);
            box.style.setProperty('--embed-h', h);
            box.style.setProperty('--embed-scale', width / w);
        });
    }

    fit();
    window.addEventListener('resize', fit);
})();
