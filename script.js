/* ---------- Helpers ---------- */
function esc(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(text) {
  return String(text || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function safeUrl(url) {
  const u = String(url || '').trim();
  if (!u) return '';
  if (/^(javascript|data|vbscript):/i.test(u)) return '';
  return u;
}

async function loadJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('File not found');
    return await res.json();
  } catch (err) {
    console.warn('Could not load ' + path, err);
    return null;
  }
}

/* ---------- Contact buttons ---------- */
async function renderContacts() {
  const box = document.getElementById('contactLinks');
  if (!box) return;
  const site = await loadJSON('data/site.json');
  if (!site) return;

  const links = [];
  const phone = String(site.whatsapp || '').replace(/\D/g, '');
  if (phone) links.push({ label: 'WhatsApp', href: 'https://wa.me/' + phone, external: true });

  if (site.email) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const gmail = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(site.email);
    links.push({
      label: 'Email',
      href: isMobile ? 'mailto:' + site.email : gmail,
      external: !isMobile
    });
  }

  if (site.linkedin) links.push({ label: 'LinkedIn', href: site.linkedin, external: true });
  if (site.facebook) links.push({ label: 'Facebook', href: site.facebook, external: true });

  box.innerHTML = links.map(function (l) {
    return '<a class="contact-btn" href="' + esc(l.href) + '"' +
      (l.external ? ' target="_blank" rel="noopener"' : '') + '>' + l.label + '</a>';
  }).join('');
}

/* ---------- Services ---------- */
async function renderServices() {
  const full = document.getElementById('servicesGrid');
  const preview = document.getElementById('servicesPreview');
  if (!full && !preview) return;

  const data = await loadJSON('data/services.json');
  if (!data || !data.items) return;

  function num(i) { return String(i + 1).padStart(2, '0'); }

  if (full) {
    full.innerHTML = data.items.map(function (s, i) {
      const points = (s.points || []).map(function (p) {
        return '<li>' + esc(p) + '</li>';
      }).join('');
      return '<div class="card service-card">' +
        '<div class="service-num">' + num(i) + '</div>' +
        '<h3>' + esc(s.title) + '</h3>' +
        '<p>' + esc(s.description) + '</p>' +
        (points ? '<ul class="service-list">' + points + '</ul>' : '') +
        '</div>';
    }).join('');
  }

  if (preview) {
    preview.innerHTML = data.items.slice(0, 4).map(function (s, i) {
      return '<div class="card service-card">' +
        '<div class="service-num">' + num(i) + '</div>' +
        '<h3>' + esc(s.title) + '</h3>' +
        '<p>' + esc(s.description) + '</p>' +
        '</div>';
    }).join('');
  }
}

/* ---------- Projects ---------- */
const CATEGORY_LABELS = {
  marketing: 'Marketing',
  branding: 'Branding',
  social: 'Social media',
  research: 'Research'
};

function projectSlug(p, i) {
  return slugify(p.title) || ('project-' + (i + 1));
}

function projectCard(p, i) {
  const slug = projectSlug(p, i);
  const cover = safeUrl(p.cover);
  const img = cover
    ? '<div class="card-img"><img src="' + esc(cover) + '" alt="' + esc(p.title) + '"></div>'
    : '<div class="card-img">Project image</div>';
  const tagList = (p.tags && p.tags.length) ? p.tags : [CATEGORY_LABELS[p.category] || 'Project'];
  const tags = tagList.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');

  return '<a class="card project-card" data-category="' + esc(p.category) + '" href="project.html?p=' + encodeURIComponent(slug) + '">' +
    img +
    '<div class="card-body">' +
    '<h3>' + esc(p.title) + '</h3>' +
    '<p>' + esc(p.summary) + '</p>' +
    '<div class="card-tags">' + tags + '</div>' +
    '</div></a>';
}

async function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  const featured = document.getElementById('featuredProjects');
  if (!grid && !featured) return;

  const data = await loadJSON('data/projects.json');
  const items = (data && data.items) || [];

  if (grid) {
    grid.innerHTML = items.length
      ? items.map(projectCard).join('')
      : '<p class="no-results" style="display:block">No projects yet.</p>';
  }
  if (featured) {
    featured.innerHTML = items.slice(0, 3).map(projectCard).join('');
  }
}

function youtubeId(url) {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

function videoHtml(p) {
  let html = '';
  const url = safeUrl(p.video_url);

  if (url) {
    const yt = youtubeId(url);
    if (yt) {
      html += '<div class="video-wrap"><iframe src="https://www.youtube.com/embed/' + yt + '" title="Project video" allowfullscreen loading="lazy"></iframe></div>';
    } else if (/facebook\.com|fb\.watch/i.test(url)) {
      html += '<div class="video-wrap"><iframe src="https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url) + '&show_text=false" title="Project video" allowfullscreen loading="lazy"></iframe></div>';
    } else {
      html += '<p><a class="btn btn-outline" href="' + esc(url) + '" target="_blank" rel="noopener">Watch the video</a></p>';
    }
  }

  const file = safeUrl(p.video_file);
  if (file) {
    html += '<div class="video-wrap"><video controls preload="metadata" src="' + esc(file) + '"></video></div>';
  }
  return html;
}

function paragraphs(text) {
  return String(text || '').split(/\n\s*\n/).map(function (block) {
    const clean = block.trim();
    return clean ? '<p>' + esc(clean).replace(/\n/g, '<br>') + '</p>' : '';
  }).join('');
}

async function renderProjectDetail() {
  const box = document.getElementById('projectDetail');
  if (!box) return;

  const data = await loadJSON('data/projects.json');
  const items = (data && data.items) || [];
  const slug = new URLSearchParams(window.location.search).get('p');
  const index = items.findIndex(function (p, i) { return projectSlug(p, i) === slug; });

  if (index === -1) {
    box.innerHTML = '<section class="page-header">' +
      '<h1>Project not found</h1>' +
      '<p class="hero-desc">This project may have been moved or removed.</p>' +
      '<a class="btn btn-primary" href="projects.html">Back to all projects</a>' +
      '</section>';
    return;
  }

  const p = items[index];
  document.title = p.title + ' | Tuaha';

  const tagList = (p.tags && p.tags.length) ? p.tags : [];
  const tags = tagList.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
  const cover = safeUrl(p.cover);
  const video = videoHtml(p);
  const gallery = (p.gallery || []).map(safeUrl).filter(Boolean);
  const results = p.results || [];
  const link = safeUrl(p.link_url);

  let html = '<section class="page-header">' +
    '<a class="back-link" href="projects.html">← All projects</a>' +
    '<p class="hero-tag">' + esc(CATEGORY_LABELS[p.category] || 'Project') + (p.date ? ' · ' + esc(p.date) : '') + '</p>' +
    '<h1>' + esc(p.title) + '</h1>' +
    '<p class="hero-desc">' + esc(p.summary) + '</p>' +
    (tags ? '<div class="card-tags detail-tags">' + tags + '</div>' : '') +
    '</section>';

  if (cover) {
    html += '<section class="section detail-cover"><img src="' + esc(cover) + '" alt="' + esc(p.title) + '"></section>';
  }

  if (p.description) {
    html += '<section class="section"><p class="section-tag">Overview</p>' +
      '<h2 class="section-title">About this project</h2>' +
      '<div class="prose">' + paragraphs(p.description) + '</div></section>';
  }

  if (results.length) {
    html += '<section class="section"><p class="section-tag">Impact</p>' +
      '<h2 class="section-title">Results</h2><div class="stats">' +
      results.map(function (r) {
        return '<div class="stat"><div class="stat-num">' + esc(r.number) + '</div><div class="stat-label">' + esc(r.label) + '</div></div>';
      }).join('') + '</div></section>';
  }

  if (video) {
    html += '<section class="section"><p class="section-tag">Watch</p>' +
      '<h2 class="section-title">Project video</h2>' + video + '</section>';
  }

  if (gallery.length) {
    html += '<section class="section"><p class="section-tag">Gallery</p>' +
      '<h2 class="section-title">Project photos</h2><div class="gallery">' +
      gallery.map(function (src) {
        return '<a href="' + esc(src) + '" target="_blank" rel="noopener"><img src="' + esc(src) + '" alt="' + esc(p.title) + '" loading="lazy"></a>';
      }).join('') + '</div></section>';
  }

  if (link) {
    html += '<section class="section"><a class="btn btn-primary" href="' + esc(link) + '" target="_blank" rel="noopener">' +
      esc(p.link_label || 'View the full project') + ' →</a></section>';
  }

  box.innerHTML = html;
}

/* ---------- Projects filter ---------- */
const buttons = document.querySelectorAll('.filter-btn');

buttons.forEach(function (btn) {
  btn.addEventListener('click', function () {
    buttons.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    document.querySelectorAll('.project-card').forEach(function (card) {
      const show = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('hide', !show);
    });
  });
});

/* ---------- Blog search and filter ---------- */
const searchInput = document.getElementById('blogSearch');
const catButtons = document.querySelectorAll('.cat-btn');
const blogCards = document.querySelectorAll('.blog-card');

if (searchInput && blogCards.length) {
  let activeCat = 'all';
  const noResults = document.getElementById('noResults');

  function applyBlogFilter() {
    const query = searchInput.value.trim().toLowerCase();
    let visible = 0;

    blogCards.forEach(function (card) {
      const matchCat = activeCat === 'all' || card.dataset.category === activeCat;
      const matchText = card.textContent.toLowerCase().includes(query);
      const show = matchCat && matchText;
      card.classList.toggle('hide', !show);
      if (show) visible++;
    });

    noResults.style.display = visible === 0 ? 'block' : 'none';
  }

  searchInput.addEventListener('input', applyBlogFilter);

  catButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      catButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeCat = btn.dataset.cat;
      applyBlogFilter();
    });
  });
}

/* ---------- Subscribe box ---------- */
const subForm = document.getElementById('subscribeForm');
if (subForm) {
  subForm.addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('subMsg').textContent = 'Thanks! Subscriptions will be live soon.';
    subForm.reset();
  });
}

/* ---------- Mobile menu ---------- */
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

function closeMenu() {
  menuToggle.classList.remove('open');
  navLinks.classList.remove('open');
  document.body.classList.remove('menu-open');
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', function () {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
  });

  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', function (e) {
    const clickedInside = navLinks.contains(e.target) || menuToggle.contains(e.target);
    if (!clickedInside) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
}

/* ---------- Scroll reveal animation ---------- */
function setupReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduceMotion) return;

  const targets = Array.from(document.querySelectorAll(
    '.section-tag, .section-title, .card, .stat, .timeline-item, .process-step, .skill-group, .cta-box, .filters, .search-box, .all-btn, .footer-desc, .contact-btn, .copyright, .video-wrap, .gallery a, .prose'
  )).filter(function (el) {
    return !el.closest('.hero, .page-header');
  });

  targets.forEach(function (el) {
    const siblings = Array.from(el.parentElement.children).filter(function (c) {
      return targets.includes(c);
    });
    const index = siblings.indexOf(el);
    el.style.setProperty('--delay', (Math.min(index, 6) * 0.12) + 's');
    el.classList.add('reveal');
  });

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('visible');
      observer.unobserve(el);

      setTimeout(function () {
        el.classList.remove('reveal', 'visible');
        el.style.removeProperty('--delay');
      }, 1800);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(function (el) { observer.observe(el); });
}

/* ---------- Start ---------- */
async function boot() {
  await Promise.all([
    renderContacts(),
    renderServices(),
    renderProjects(),
    renderProjectDetail()
  ]);
  setupReveal();
}
boot();