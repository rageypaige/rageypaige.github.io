(function () {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.documentElement.classList.add('rd-has-custom-cursor');

    var cursor = document.createElement('div');
    cursor.className = 'rd-cursor';
    document.body.appendChild(cursor);

    var hasGarden = !!document.querySelector('.rd-cat');
    if (hasGarden) {
        var fish = document.createElement('span');
        fish.className = 'rd-cursor__fish';
        fish.textContent = '<><';
        cursor.appendChild(fish);
    }

    var targetX = 0, targetY = 0, x = 0, y = 0;
    var hasMoved = false;

    window.addEventListener('mousemove', function (e) {
        targetX = e.clientX;
        targetY = e.clientY;
        if (!hasMoved) {
            hasMoved = true;
            x = targetX;
            y = targetY;
        }
        cursor.classList.add('is-visible');
        if (hasGarden) {
            cursor.classList.toggle('is-fishing', !!(e.target.closest && e.target.closest('.rd-footer, .rd-cat')));
        }
    });

    var throwTimer;
    document.addEventListener('click', function (e) {
        if (!hasGarden || !e.target.closest || !e.target.closest('.rd-cat')) return;
        cursor.classList.add('is-throwing');
        clearTimeout(throwTimer);
        throwTimer = setTimeout(function () {
            cursor.classList.remove('is-throwing');
        }, 700);
    });

    window.addEventListener('mouseout', function (e) {
        if (!e.relatedTarget) cursor.classList.remove('is-visible');
    });

    document.addEventListener('mouseover', function (e) {
        if (e.target.closest && e.target.closest('a, button, .rd-cat')) {
            cursor.classList.add('is-hovering');
        }
    });
    document.addEventListener('mouseout', function (e) {
        if (e.target.closest && e.target.closest('a, button, .rd-cat')) {
            cursor.classList.remove('is-hovering');
        }
    });

    function loop() {
        x += (targetX - x) * 0.18;
        y += (targetY - y) * 0.18;
        cursor.style.transform = 'translate(' + x + 'px, ' + y + 'px) translate(-50%, -50%)';
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
})();
