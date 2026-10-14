(function () {
    var cats = document.querySelectorAll('.rd-cat');
    if (!cats.length) return;

    var counterEl = document.getElementById('rd-fish-counter');
    var STORAGE_KEY = 'rd-cats-fed';
    var count = 0;

    try {
        count = parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0;
    } catch (e) {
        count = 0;
    }

    function renderCount() {
        if (!counterEl) return;
        counterEl.textContent = count === 0
            ? 'Cats fed so far: 0 — go on, try one'
            : 'Cats fed so far: ' + count;
    }
    renderCount();

    function setFrame(inner, face) {
        inner.textContent = face;
    }

    function feed(cat) {
        var inner = cat.querySelector('.rd-cat__inner');
        if (!inner || cat.classList.contains('is-feeding')) return;

        cat.classList.add('is-feeding');
        setFrame(inner, inner.dataset.fed);
        inner.classList.add('is-fed');

        var treat = document.createElement('span');
        treat.className = 'rd-cat__treat';
        treat.textContent = '<><';
        cat.appendChild(treat);

        count += 1;
        try { localStorage.setItem(STORAGE_KEY, String(count)); } catch (e) { /* no-op */ }
        renderCount();

        setTimeout(function () {
            setFrame(inner, inner.dataset.face);
            inner.classList.remove('is-fed');
            cat.classList.remove('is-feeding');
        }, 650);

        treat.addEventListener('animationend', function () {
            treat.remove();
        });
        setTimeout(function () { if (treat.parentNode) treat.remove(); }, 1200);
    }

    var blinkers = Array.prototype.filter.call(cats, function (cat) {
        var inner = cat.querySelector('.rd-cat__inner');
        return inner && inner.dataset.blink;
    });

    function blinkRandomCat() {
        var cat = blinkers[Math.floor(Math.random() * blinkers.length)];
        var inner = cat.querySelector('.rd-cat__inner');
        if (!cat.classList.contains('is-feeding')) {
            setFrame(inner, inner.dataset.blink);
            setTimeout(function () {
                if (!cat.classList.contains('is-feeding')) {
                    setFrame(inner, inner.dataset.face);
                }
            }, 220);
        }
        setTimeout(blinkRandomCat, 800 + Math.random() * 2200);
    }

    if (blinkers.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setTimeout(blinkRandomCat, 1000);
    }

    cats.forEach(function (cat) {
        cat.addEventListener('click', function () { feed(cat); });
        cat.setAttribute('role', 'button');
        cat.setAttribute('tabindex', '0');
        cat.setAttribute('aria-label', 'Feed this cat a fish');
        cat.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                feed(cat);
            }
        });
    });
})();
