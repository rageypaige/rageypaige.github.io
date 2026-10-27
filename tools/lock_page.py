#!/usr/bin/env python3
"""Password-protect a page: encrypt a private HTML file into a public lock page.

Usage:  python3 tools/lock_page.py [SOURCE] [OUTPUT] [TITLE]
        (defaults: private/petro-canada.html  petro-protected.html  Petro-Canada)

Asks for the password twice (it's never shown or saved), encrypts SOURCE, and writes
OUTPUT from tools/lock-template.html, plus the encrypted page itself as OUTPUT's name
with .bin (e.g. petro-protected.bin). Keeping the ciphertext in its own file keeps the
lock screen tiny, so it shows straight away while the case study downloads behind it.
Visitors type the password on the lock screen and js/lock.js decrypts the page in
their browser.

Keep SOURCE in private/, which .gitignore keeps out of the public repo; only the
encrypted OUTPUT and its .bin get committed. Re-run this whenever you edit SOURCE.

Encryption: PBKDF2-SHA256 turns the password into two keys; the page is encrypted
with AES-256-CBC (via the system's openssl) and signed with HMAC-SHA256, so a wrong
password is detected cleanly. Uses only Python's standard library and macOS's openssl.
"""
import base64
import getpass
import hashlib
import hmac
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, sys.argv[1] if len(sys.argv) > 1 else 'private/petro-canada.html')
OUTPUT = os.path.join(ROOT, sys.argv[2] if len(sys.argv) > 2 else 'petro-protected.html')
TITLE = sys.argv[3] if len(sys.argv) > 3 else 'Petro-Canada'
TEMPLATE = os.path.join(ROOT, 'tools', 'lock-template.html')
ITERATIONS = 300000


def b64(raw):
    return base64.b64encode(raw).decode('ascii')


def main():
    if not os.path.exists(SOURCE):
        sys.exit(f'No file at {SOURCE}')
    password = getpass.getpass('Password for the page: ')
    if not password:
        sys.exit('No password given; nothing written.')
    if getpass.getpass('Same password again: ') != password:
        sys.exit("Those didn't match; nothing written.")

    plain = open(SOURCE, 'rb').read()
    salt = os.urandom(16)
    iv = os.urandom(16)
    keys = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, ITERATIONS, dklen=64)
    enc_key, mac_key = keys[:32], keys[32:]

    data = subprocess.run(
        ['openssl', 'enc', '-aes-256-cbc', '-K', enc_key.hex(), '-iv', iv.hex()],
        input=plain, capture_output=True, check=True).stdout
    tag = hmac.new(mac_key, salt + iv + data, hashlib.sha256).digest()

    data_path = os.path.splitext(OUTPUT)[0] + '.bin'
    with open(data_path, 'wb') as fh:
        fh.write(data)
    # the tag changes on every lock, so it busts any cached copy of the old .bin
    src = os.path.basename(data_path) + '?v=' + tag.hex()[:12]
    payload = json.dumps({'v': 2, 'iter': ITERATIONS, 'salt': b64(salt), 'iv': b64(iv),
                          'tag': b64(tag), 'src': src})
    page = (open(TEMPLATE, encoding='utf-8').read()
            .replace('__PAYLOAD__', payload)
            .replace('__TITLE__', TITLE)
            .replace('__SOURCE__', os.path.basename(SOURCE)))
    with open(OUTPUT, 'w', encoding='utf-8') as fh:
        fh.write(page)
    print(f'Locked {os.path.relpath(SOURCE, ROOT)} -> {os.path.relpath(OUTPUT, ROOT)}'
          f' + {os.path.relpath(data_path, ROOT)}')


if __name__ == '__main__':
    main()
