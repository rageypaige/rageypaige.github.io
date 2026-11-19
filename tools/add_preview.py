#!/usr/bin/env python3
"""Add a public preview above the password box on a lock page.

Usage:  python3 tools/add_preview.py petro-offer-hub.html [more pages...]

Someone without the password still sees the case study's header and results, then the
password box for the full story. Each page's preview lives in tools/previews/ under the
same name; it's public, so keep it to what's fine to show. The file has two parts,
split by a <!-- LOCK --> line: the preview itself, then the heading and note for the
password box.

The page is rebuilt from tools/lock-template.html with its existing encrypted payload,
so this is safe to run again after editing a preview, and it needs no password.
tools/lock_page.py runs it too, whenever a page it writes has a preview.
"""
import os
import re
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE = os.path.join(ROOT, 'tools', 'lock-template.html')
PREVIEWS = os.path.join(ROOT, 'tools', 'previews')


def preview_path(page):
    return os.path.join(PREVIEWS, os.path.basename(page))


def apply(html, preview):
    """Turn a plain lock page (as written from the template) into one with a preview."""
    teaser, lock_text = preview.split('<!-- LOCK -->', 1)
    indent = lambda text: '\n'.join(('    ' + line) if line.strip() else '' for line in text.strip().splitlines())

    # the preview borrows the case study's header styles
    html = html.replace('    <link rel="stylesheet" href="css/lock.css">',
                        '    <link rel="stylesheet" href="css/case-study.css">\n    <link rel="stylesheet" href="css/lock.css">', 1)
    html = html.replace('    <!-- LOCK -->', indent(teaser) + '\n\n    <!-- LOCK -->', 1)
    html = html.replace('<main class="rd-lock rd-anim" style="--rd-delay: 120ms">',
                        '<main class="rd-lock rd-lock--after-teaser rd-anim" style="--rd-delay: 380ms">', 1)
    html = re.sub(r'(<span class="rd-lock__cat"[^\n]*\n).*?\n(\s*<form )',
                  lambda m: m.group(1) + '\n'.join('        ' + l.strip() for l in lock_text.strip().splitlines()) + '\n\n' + m.group(2),
                  html, count=1, flags=re.S)
    # don't jump straight to the password box and skip past the preview
    html = html.replace(' required autofocus>', ' required>', 1)
    return html


def rebuild(page):
    """Rewrite a lock page from the template, keeping its payload, then add its preview."""
    path = os.path.join(ROOT, page)
    old = open(path, encoding='utf-8').read()
    payload = re.search(r'<script id="rd-locked" type="application/json">(.*?)</script>', old, re.S).group(1)
    title = re.search(r'<title>(.*?) — Paige Latimer</title>', old).group(1)
    source = re.search(r'from private/(\S+?)\. Don', old).group(1)
    html = (open(TEMPLATE, encoding='utf-8').read()
            .replace('__PAYLOAD__', payload)
            .replace('__TITLE_URL__', urllib.parse.quote(title))
            .replace('__TITLE__', title)
            .replace('__SOURCE__', source))
    html = apply(html, open(preview_path(page), encoding='utf-8').read())
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(html)
    print('Preview added to', page)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for page in sys.argv[1:]:
        rebuild(page)
