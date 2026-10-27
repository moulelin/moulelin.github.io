"""Generate the static blog from _src/posts.json.

Usage (from the repo root):  python _src/build.py

posts.json is a list of {slug, title, date, tags, summary, body, old_paths}.
`body` is an HTML fragment. To add a post, append an entry and re-run.
Writes blog/index.html, blog/<slug>/index.html, and redirect stubs at each
of the old Hexo URLs listed in `old_paths`.
"""
import html
import io
import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS = json.load(io.open(os.path.join(ROOT, '_src', 'posts.json'), encoding='utf8'))
POSTS.sort(key=lambda p: (p['date'], p['slug']), reverse=True)

HEAD = '''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="icon" href="/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap">
  <link rel="stylesheet" href="/assets/style.css">{extra}
  <script>try{{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)}}catch(e){{}}</script>
</head>
<body>
<header class="topbar">
  <div class="inner">
    <a class="brand" href="/">Moule Lin</a>
    <nav class="nav">
      <a class="hide-sm" href="/#about">About</a>
      <a href="/#publications">Publications</a>
      <a class="active" href="/blog/">Blog</a>
      <a href="/files/Moule_Lin_CV.pdf">CV</a>
      <button class="theme-btn" type="button" aria-label="Toggle dark mode">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </nav>
  </div>
</header>
'''

FOOT = '''
<footer class="site">
  <div class="inner">
    <span>© 2026 Moule Lin</span>
    <span>Notes are personal study material, originally written in Chinese.</span>
  </div>
</footer>
<script src="/assets/theme.js"></script>{extra}
</body>
</html>
'''

POST_HEAD_EXTRA = '''
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">'''

POST_FOOT_EXTRA = '''
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"></script>
<script>
  document.querySelectorAll('.prose pre code').forEach(function (el) { hljs.highlightElement(el); });
  renderMathInElement(document.querySelector('.prose'), {
    delimiters: [{left: '$$', right: '$$', display: true}, {left: '\\\\(', right: '\\\\)', display: false}],
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'], throwOnError: false
  });
</script>'''

INDEX_FOOT_EXTRA = '''
<script>
(function () {
  var q = document.querySelector('.search'), items = [].slice.call(document.querySelectorAll('.posts li')),
      years = [].slice.call(document.querySelectorAll('.yblock')), empty = document.querySelector('.empty'), tag = '';
  function apply() {
    var s = q.value.trim().toLowerCase(), shown = 0;
    items.forEach(function (li) {
      var ok = (!s || li.dataset.text.indexOf(s) >= 0) && (!tag || li.dataset.tags.split('|').indexOf(tag) >= 0);
      li.hidden = !ok; if (ok) shown++;
    });
    years.forEach(function (y) { y.hidden = !y.querySelector('li:not([hidden])'); });
    empty.style.display = shown ? 'none' : 'block';
  }
  q.addEventListener('input', apply);
  document.querySelectorAll('.tag').forEach(function (b) {
    b.addEventListener('click', function () {
      tag = b.classList.contains('on') ? '' : b.dataset.tag;
      document.querySelectorAll('.tag').forEach(function (x) { x.classList.toggle('on', x.dataset.tag === tag); });
      apply();
    });
  });
})();
</script>'''

esc = html.escape


def write(rel, text):
    path = os.path.join(ROOT, *rel.split('/'))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    io.open(path, 'w', encoding='utf8', newline='\n').write(text)


def fmt_date(d):
    import datetime
    return datetime.date.fromisoformat(d).strftime('%B %-d, %Y' if os.name != 'nt' else '%B %#d, %Y')


def build_post(i, p):
    newer = POSTS[i - 1] if i > 0 else None
    older = POSTS[i + 1] if i + 1 < len(POSTS) else None
    chips = ''.join('<span class="chip">%s</span>' % esc(t) for t in p['tags'])
    nav = '<nav class="post-nav">'
    nav += ('<a href="/blog/%s/"><span>← Older</span>%s</a>' % (older['slug'], esc(older['title']))) if older else '<div></div>'
    nav += ('<a class="next" href="/blog/%s/"><span>Newer →</span>%s</a>' % (newer['slug'], esc(newer['title']))) if newer else '<div></div>'
    nav += '</nav>'
    page = HEAD.format(title=esc(p['title']) + ' · Moule Lin', desc=esc(p['summary']), extra=POST_HEAD_EXTRA)
    page += '''
<main class="page">
  <a class="back" href="/blog/">← All notes</a>
  <header class="post-head">
    <h1>{title}</h1>
    <div class="post-meta"><time datetime="{date}">{pretty}</time>{chips}</div>
  </header>
  <article class="prose">
{body}
  </article>
  {nav}
</main>
'''.format(title=esc(p['title']), date=p['date'], pretty=fmt_date(p['date']), chips=chips, body=p['body'], nav=nav)
    page += FOOT.format(extra=POST_FOOT_EXTRA)
    write('blog/%s/index.html' % p['slug'], page)


def build_index():
    counts = {}
    for p in POSTS:
        for t in p['tags']:
            counts[t] = counts.get(t, 0) + 1
    tags = sorted((t for t in counts if counts[t] > 1), key=lambda t: (-counts[t], t.lower()))
    tag_html = ''.join('<button class="tag" type="button" data-tag="%s">%s</button>' % (esc(t), esc(t)) for t in tags)
    blocks, year = [], None
    for p in POSTS:
        y = p['date'][:4]
        if y != year:
            if year:
                blocks.append('</ul></div>')
            blocks.append('<div class="yblock"><div class="year">%s</div><ul class="posts">' % y)
            year = y
        text = (p['title'] + ' ' + p['summary'] + ' ' + ' '.join(p['tags'])).lower()
        blocks.append(
            '<li data-text="%s" data-tags="%s"><time datetime="%s">%s</time><div><a href="/blog/%s/">%s</a><p class="sum">%s</p></div></li>'
            % (esc(text), esc('|'.join(p['tags'])), p['date'], p['date'][5:].replace('-', '/'), p['slug'], esc(p['title']), esc(p['summary'])))
    blocks.append('</ul></div>')
    page = HEAD.format(title='Notes · Moule Lin', desc='Study notes by Moule Lin on machine learning, CUDA, C++, algorithms and English.', extra='')
    page += '''
<main class="page">
  <header class="page-head">
    <h1>Notes</h1>
    <p>{n} study notes on machine learning, CUDA, C++, algorithms and English, written 2020–2023.</p>
  </header>
  <input class="search" type="search" placeholder="Search notes…" aria-label="Search notes">
  <div class="tags">{tags}</div>
  {blocks}
  <p class="empty">No notes match.</p>
</main>
'''.format(n=len(POSTS), tags=tag_html, blocks='\n  '.join(blocks))
    page += FOOT.format(extra=INDEX_FOOT_EXTRA)
    write('blog/index.html', page)


def build_redirects():
    stub = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved</title>'
            '<link rel="canonical" href="{u}"><meta http-equiv="refresh" content="0; url={u}">'
            '</head><body><p>This page has moved to <a href="{u}">{u}</a>.</p></body></html>\n')
    for p in POSTS:
        for old in p.get('old_paths', []):
            write(old + '/index.html', stub.format(u='/blog/%s/' % p['slug']))


if __name__ == '__main__':
    shutil.rmtree(os.path.join(ROOT, 'blog'), ignore_errors=True)
    for i, p in enumerate(POSTS):
        build_post(i, p)
    build_index()
    build_redirects()
    print('built %d posts' % len(POSTS))
