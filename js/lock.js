(function () {
    // Unlocks a page built by tools/lock_page.py. #rd-locked holds the key settings, and
    // the encrypted case study itself is a separate file (payload.src) that starts
    // downloading as soon as the lock screen shows. A password-derived key checks the
    // HMAC (so a wrong password is caught cleanly), then decrypts the HTML, which
    // replaces this lock screen. Older pages (v1) carry the ciphertext inline instead.

    var payloadEl = document.getElementById('rd-locked');
    var lock = document.querySelector('.rd-lock');
    var form = document.querySelector('.rd-lock__form');
    if (!payloadEl || !lock || !form) return;

    var input = form.querySelector('.rd-lock__input');
    var button = form.querySelector('.rd-lock__button');
    var message = form.querySelector('.rd-lock__message');
    var cat = lock.querySelector('.rd-lock__cat');
    var payload = JSON.parse(payloadEl.textContent);
    var STORE_KEY = 'rd-unlock:' + location.pathname;

    function bytes(b64) {
        var bin = atob(b64);
        var out = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    function b64(buf) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
    }

    var salt = bytes(payload.salt);
    var iv = bytes(payload.iv);
    var tag = bytes(payload.tag);
    var dataReady = payload.src
        ? fetch(payload.src).then(function (r) {
            if (!r.ok) throw new Error('could not load the case study');
            return r.arrayBuffer();
        }).then(function (buf) { return new Uint8Array(buf); })
        : Promise.resolve(bytes(payload.data));

    // 64 bytes from PBKDF2: the first half decrypts, the second half checks the HMAC.
    function deriveBits(password) {
        return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
            .then(function (base) {
                return crypto.subtle.deriveBits(
                    { name: 'PBKDF2', salt: salt, iterations: payload.iter, hash: 'SHA-256' }, base, 512);
            });
    }

    // Resolves to the page's HTML, or rejects if the key is wrong.
    function open(bits) {
        return dataReady.then(function (data) { return decrypt(bits, data); });
    }

    function decrypt(bits, data) {
        bits = new Uint8Array(bits);
        var signed = new Uint8Array(salt.length + iv.length + data.length);
        signed.set(salt, 0);
        signed.set(iv, salt.length);
        signed.set(data, salt.length + iv.length);
        return crypto.subtle.importKey('raw', bits.slice(32), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
            .then(function (macKey) { return crypto.subtle.verify('HMAC', macKey, tag, signed); })
            .then(function (ok) {
                if (!ok) throw new Error('wrong password');
                return crypto.subtle.importKey('raw', bits.slice(0, 32), { name: 'AES-CBC' }, false, ['decrypt']);
            })
            .then(function (aesKey) { return crypto.subtle.decrypt({ name: 'AES-CBC', iv: iv }, aesKey, data); })
            .then(function (plain) { return new TextDecoder().decode(plain); });
    }

    // Swap this lock screen for the case study, as if it had loaded normally. The browser
    // ignores the swap while this page is still loading, so wait for that first.
    function show(html) {
        if (document.readyState !== 'complete') {
            window.addEventListener('load', function () { show(html); });
            return;
        }
        document.open();
        document.write(html);
        document.close();
    }

    if (!window.crypto || !crypto.subtle) {
        input.disabled = button.disabled = true;
        message.textContent = 'This page can only be unlocked over a secure (https) connection.';
        return;
    }

    // Unlocked earlier in this tab? Reopen without asking again.
    var saved = null;
    try { saved = sessionStorage.getItem(STORE_KEY); } catch (e) { /* storage blocked */ }
    if (saved) {
        document.documentElement.style.visibility = 'hidden';
        open(bytes(saved)).then(show, function () {
            try { sessionStorage.removeItem(STORE_KEY); } catch (e) { /* no-op */ }
            document.documentElement.style.visibility = '';
        });
    }

    var wrongTimer;
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!input.value) return;
        input.disabled = button.disabled = true;
        message.textContent = 'Unlocking…';
        lock.classList.remove('is-wrong');

        var bits;
        deriveBits(input.value)
            .then(function (b) { bits = b; return open(b); })
            .then(function (html) {
                try { sessionStorage.setItem(STORE_KEY, b64(bits)); } catch (err) { /* no-op */ }
                cat.textContent = 'ᓚ₍ ^ω^₎';
                message.textContent = 'Come on in.';
                setTimeout(function () { show(html); }, 450);
            }, function () {
                input.disabled = button.disabled = false;
                input.value = '';
                input.focus();
                message.textContent = 'That’s not it. Try again?';
                void lock.offsetWidth; // restart the head-shake if it's already playing
                lock.classList.add('is-wrong');
                clearTimeout(wrongTimer);
                wrongTimer = setTimeout(function () { lock.classList.remove('is-wrong'); }, 2400);
            });
    });
})();
