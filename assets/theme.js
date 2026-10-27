// Light/dark toggle. The initial theme is applied by an inline snippet in <head> to avoid a flash.
(function () {
  var btn = document.querySelector('.theme-btn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var root = document.documentElement;
    var cur = root.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();
