(function () {
    // Swaps the browser's video controls for two small round buttons in the top-right
    // corner (pause/play and replay) that appear on hover. Markup: a <video controls>
    // inside .rd-video, optionally with data-speed. Without JavaScript, the browser's
    // own controls stay.

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ICONS = {
        pause: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
        play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>',
        replay: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/></svg>'
    };

    function button(label, icon) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'rd-video__button';
        b.setAttribute('aria-label', label);
        b.innerHTML = icon;
        return b;
    }

    Array.prototype.forEach.call(document.querySelectorAll('.rd-video'), function (wrap) {
        var video = wrap.querySelector('video');
        if (!video) return;
        video.controls = false;

        // data-speed="2" plays the video faster, e.g. to tighten a long demo.
        var speed = parseFloat(video.getAttribute('data-speed'));
        if (speed > 0) {
            video.defaultPlaybackRate = speed;
            video.playbackRate = speed;
            // some browsers reset the rate when the video loads, so set it again then
            video.addEventListener('loadedmetadata', function () { video.playbackRate = speed; });
        }

        var tools = document.createElement('div');
        tools.className = 'rd-video__tools';
        var toggle = button('Pause video', ICONS.pause);
        var replay = button('Replay video', ICONS.replay);
        tools.appendChild(toggle);
        tools.appendChild(replay);
        wrap.appendChild(tools);

        function sync() {
            var playing = !video.paused;
            toggle.innerHTML = playing ? ICONS.pause : ICONS.play;
            toggle.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
            wrap.classList.toggle('is-paused', !playing);
        }

        function togglePlay() {
            if (video.paused) video.play(); else video.pause();
        }

        toggle.addEventListener('click', togglePlay);
        replay.addEventListener('click', function () {
            video.currentTime = 0;
            video.play();
        });
        video.addEventListener('click', togglePlay);
        video.addEventListener('play', sync);
        video.addEventListener('pause', sync);

        // Fade in once there's a frame to show, rather than flashing an empty box.
        function ready() { wrap.classList.add('is-ready'); }
        if (video.readyState >= 2) ready(); else video.addEventListener('loadeddata', ready);

        if (reduceMotion) {
            video.autoplay = false;
            video.pause();
        }
        sync();
    });
})();
