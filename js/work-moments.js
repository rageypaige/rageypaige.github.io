// One small moment inside each headline tile on the home page: on the Petro phone, the
// first offer's "Add offer" is tapped and turns into "Offer added"; in the Duet Booth
// window, the countdown runs out, the camera flashes and the third shot lands. Each plays
// once when its tile comes into view, then again whenever the tile is hovered.
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function wait(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    var moments = {
        petro: async function (el) {
            var press = el.querySelector('.rd-moment--press');
            if (el.classList.contains('is-added')) {
                el.classList.remove('is-added');
                await wait(450);
            }
            el.classList.add('is-tapping');
            await wait(420);
            el.classList.add('is-pressing');
            press.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out' });
            await wait(150);
            el.classList.remove('is-pressing');
            el.classList.add('is-added');
            await wait(300);
            el.classList.remove('is-tapping');
            await wait(300);
        },
        duet: function (el) {
            var video = el.querySelector('video');
            return new Promise(function (resolve) {
                video.currentTime = 0;
                video.onended = resolve;
                var playing = video.play();
                if (playing && playing.catch) playing.catch(resolve);
            });
        }
    };

    document.querySelectorAll('[data-moment]').forEach(function (el) {
        var play = moments[el.getAttribute('data-moment')];
        var tile = el.closest('.rd-work__item');
        if (!play || !tile) return;

        var busy = false;
        function run() {
            if (busy) return;
            busy = true;
            Promise.resolve(play(el)).then(function () { busy = false; });
        }

        if ('IntersectionObserver' in window) {
            var seen = new IntersectionObserver(function (entries) {
                if (!entries[0].isIntersecting) return;
                seen.disconnect();
                setTimeout(run, 700);
            }, { threshold: 0.35 });
            seen.observe(el);
        }
        tile.addEventListener('mouseenter', run);
    });
})();
