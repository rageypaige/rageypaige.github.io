(function () {
    var items = document.querySelectorAll('.rd-reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('is-visible'); });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    // No negative bottom margin: elements at the very end of the page could never reach it.
    }, { threshold: 0.1 });

    items.forEach(function (el) { observer.observe(el); });
})();
