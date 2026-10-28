// Plays the looping screen recordings in the homepage windows only while they're on
// screen, and leaves them on their first frame for people who prefer reduced motion.
(function () {
    var videos = document.querySelectorAll('.rd-window__screen');
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    videos.forEach(function (video) {
        if (still) { video.removeAttribute('autoplay'); video.pause(); return; }
        if (!('IntersectionObserver' in window)) return;
        new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
                var playing = video.play();
                if (playing && playing.catch) playing.catch(function () {});
            } else {
                video.pause();
            }
        }, { threshold: 0.2 }).observe(video);
    });
})();
