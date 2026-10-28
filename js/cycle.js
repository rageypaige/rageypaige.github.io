// Cycles a stack of frames ([data-cycle], e.g. the Duet Booth window on the homepage):
// every few seconds the next frame fades in on top of the last. Only runs while the
// stack is on screen, and not at all for people who prefer reduced motion.
(function () {
    var HOLD = 2800;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('[data-cycle]').forEach(function (stack) {
        var frames = stack.querySelectorAll('img');
        if (frames.length < 2) return;
        var current = 0, z = 1, timer = null;

        function next() {
            var prev = frames[current];
            current = (current + 1) % frames.length;
            var frame = frames[current];
            if (!frame.complete) frame.loading = 'eager';
            frame.style.zIndex = ++z;
            frame.classList.add('is-shown');
            setTimeout(function () { prev.classList.remove('is-shown'); }, 900);
        }

        function play() { if (!timer) timer = setInterval(next, HOLD); }
        function pause() { clearInterval(timer); timer = null; }

        frames[0].classList.add('is-shown');
        stack.classList.add('is-cycling');

        if (!('IntersectionObserver' in window)) { play(); return; }
        new IntersectionObserver(function (entries) {
            entries[0].isIntersecting ? play() : pause();
        }, { threshold: 0.3 }).observe(stack);
    });
})();
