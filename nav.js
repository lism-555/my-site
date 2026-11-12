/* nav.js — one navigation, four pages.
 *
 * The navigation is written once, in nav.html. This script pulls that file
 * in and drops it into every page, so the menu never has to be copied by
 * hand and the pages can never drift apart.
 *
 * Browsers refuse to let a page read another file when you open it
 * straight off the disk (a file:// page has no shared origin with its
 * neighbours), so the identical markup is also kept below as a fallback.
 * tools/check-nav.mjs compares the two and fails if they ever differ.
 */

const NAV_FALLBACK = `<!-- nav.html — the one and only copy of the site navigation.
     nav.js fetches this file and drops it into every page, so the menu
     is written once and never copied by hand. -->
<nav class="site-nav" aria-label="Main">
  <a class="site-nav__mark" href="index.html">
    <span class="site-nav__seal" aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <circle cx="24" cy="24" r="22" fill="#5f1d2a"/>
        <circle cx="24" cy="24" r="22" fill="none" stroke="#3c1119" stroke-width="2"/>
        <circle cx="24" cy="24" r="17" fill="none" stroke="#d9b45f" stroke-width="1.3" opacity="0.85"/>
        <path d="M24 13.5l5.4 9.2h-3.3l3.5 5.8H18.4l3.5-5.8h-3.3z" fill="#e8cf92"/>
        <rect x="22.6" y="28.4" width="2.8" height="3.4" fill="#e8cf92"/>
      </svg>
    </span>
    <span class="site-nav__word">The Attic Desk</span>
  </a>

  <button class="site-nav__toggle" type="button" aria-expanded="false" aria-controls="site-nav-list">
    <span></span><span></span><span></span>
    <span class="sr-only">Menu</span>
  </button>

  <ul class="site-nav__list" id="site-nav-list">
    <li><a href="index.html">The Desk</a></li>
    <li><a href="quotes.html">Notebook</a></li>
    <li><a href="project.html">Workbench</a></li>
    <li><a href="machine.html">The Machine</a></li>
  </ul>
</nav>
`;

/* the page we are on, so the right link can be marked */
function currentPage() {
  const file = window.location.pathname.split('/').pop();
  return file === '' ? 'index.html' : file;
}

async function mountNav() {
  const host = document.querySelector('[data-nav]');
  if (!host) return;

  let markup = '';
  try {
    const response = await fetch('nav.html', { cache: 'no-store' });
    if (!response.ok) throw new Error('nav.html responded ' + response.status);
    markup = await response.text();
  } catch (err) {
    markup = NAV_FALLBACK;
  }

  host.innerHTML = markup;

  const page = currentPage();
  host.querySelectorAll('a[href]').forEach(function (link) {
    if (link.getAttribute('href') === page) {
      link.setAttribute('aria-current', 'page');
    }
  });

  wireToggle(host);
}

function wireToggle(host) {
  const toggle = host.querySelector('.site-nav__toggle');
  const list = host.querySelector('.site-nav__list');
  if (!toggle || !list) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    list.classList.toggle('is-open', open);
  }

  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  list.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setOpen(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 720) setOpen(false);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountNav);
} else {
  mountNav();
}
