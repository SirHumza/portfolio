document.documentElement.classList.add('js');

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Cursor glow — small layer moved with translate3d, compositor-only */
try {
  const glow = document.querySelector('.cursor-glow');
  let raf = 0;
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;

  function tick() {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) {
      raf = requestAnimationFrame(tick);
      return;
    }
    raf = 0;
  }

  if (glow && finePointer && !reducedMotion) {
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    window.addEventListener('pointermove', (event) => {
      tx = event.clientX;
      ty = event.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  }
} catch (err) {
  console.warn('cursor glow disabled:', err);
}

/* Magnetic pills — CSS transition does the easing, no rAF needed */
if (finePointer && !reducedMotion) {
  for (const btn of document.querySelectorAll('.link-btn')) {
    btn.addEventListener('pointermove', (event) => {
      try {
        const r = btn.getBoundingClientRect();
        const dx = event.clientX - (r.left + r.width / 2);
        const dy = event.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.18}px, ${dy * 0.3}px)`;
      } catch {}
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
  }
}

/* Project cards — rAF-batched spotlight + subtle 3D tilt */
for (const card of document.querySelectorAll('.project')) {
  let frame = 0;

  card.addEventListener('pointermove', (event) => {
    if (!finePointer || reducedMotion) return;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      try {
        const r = card.getBoundingClientRect();
        const px = event.clientX - r.left;
        const py = event.clientY - r.top;
        card.style.setProperty('--mx', `${px}px`);
        card.style.setProperty('--my', `${py}px`);
        const rotX = (0.5 - py / r.height) * 4;
        const rotY = (px / r.width - 0.5) * 4;
        card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-3px)`;
      } catch {}
    });
  });

  card.addEventListener('pointerleave', () => {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    card.style.transform = '';
  });
}

/* Scroll reveal — progressive enhancement; content stays visible without JS. */
try {
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      }
    }, { threshold: 0.15 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }
} catch (err) {
  console.warn('reveal disabled:', err);
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
}

/* Back to top */
try {
  const toTop = document.getElementById('to-top');
  if (toTop) {
    let scrollFrame = 0;
    window.addEventListener('scroll', () => {
      if (!scrollFrame) {
        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = 0;
          toTop.classList.toggle('visible', window.scrollY > 600);
        });
      }
    }, { passive: true });

    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }
} catch (err) {
  console.warn('back-to-top disabled:', err);
}

/* Live repos — fetched from the GitHub API so the section stays current.
   Cached in localStorage for an hour; falls back to the static cards on failure. */
const LANG_COLORS = {
  C: '#555555', 'C++': '#f34b7d', 'C#': '#178600', Java: '#b07219',
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c', Go: '#00ADD8',
  Rust: '#dea584', Swift: '#F05138', Kotlin: '#A97BFF',
};

const CACHE_KEY = 'gh-repos-v3';
const CACHE_TTL = 60 * 60 * 1000;

function getCached() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.at < CACHE_TTL && Array.isArray(cached.repos)) return cached.repos;
  } catch {}
  return null;
}

function buildCard(repo) {
  const card = document.createElement('a');
  card.className = 'project';
  card.href = repo.html_url;
  card.target = '_blank';
  card.rel = 'noreferrer';

  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';

  const title = document.createElement('h3');
  title.textContent = repo.name;

  const desc = document.createElement('p');
  desc.textContent = repo.description || 'No description yet.';

  const meta = document.createElement('div');
  meta.className = 'meta';

  if (repo.language) {
    const lang = document.createElement('span');
    lang.className = 'lang';
    const dot = document.createElement('span');
    dot.className = 'lang-dot';
    dot.style.background = LANG_COLORS[repo.language] || 'rgba(244,239,232,.45)';
    lang.append(dot, document.createTextNode(repo.language));
    meta.append(lang);
  }

  if (repo.stars > 0) {
    const stars = document.createElement('span');
    stars.className = 'stars';
    stars.textContent = `★ ${repo.stars}`;
    meta.append(stars);
  }

  if (repo.pushed_at) {
    const upd = document.createElement('span');
    upd.className = 'upd';
    upd.textContent = `updated ${timeAgo(repo.pushed_at)}`;
    meta.append(upd);
  }

  card.append(arrow, title, desc);
  if (meta.childElementCount) card.append(meta);
  return card;
}

function timeAgo(dateStr) {
  const secs = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 2592000) return `${Math.floor(secs / 86400)}d ago`;
  return `${Math.floor(secs / 2592000)}mo ago`;
}

async function loadRepos() {
  const grid = document.querySelector('#projects .project-grid');
  const moreCard = grid?.querySelector('.more');
  if (!grid || !moreCard) return;

  let repos = getCached();
  if (!repos) {
    try {
      const res = await fetch('https://api.github.com/users/SirHumza/repos?per_page=100&sort=pushed');
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const data = await res.json();
      repos = data
        .filter((r) => !r.archived && r.name !== 'portfolio')
        .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, 12)
        .map((r) => ({
          name: r.name,
          html_url: r.html_url,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count,
          pushed_at: r.pushed_at,
        }));
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos }));
      } catch {}
    } catch (err) {
      console.warn('repo feed unavailable, keeping static cards:', err);
      return;
    }
  }

  if (!repos.length) return;
  grid.replaceChildren(...repos.map(buildCard), moreCard);
  const status = document.getElementById('repo-status');
  if (status) status.textContent = `${repos.length} public repo${repos.length === 1 ? '' : 's'} · live from GitHub`;
}

loadRepos();

/* Discord presence via Lanyard — shows status + current activity (e.g. PS4 RPC).
   Stays hidden until the account is opted in at discord.gg/lanyard. */
const DISCORD_ID = '1383038753236582542';
const STATUS_COLORS = {
  online: '#23a55a',
  idle: '#f0b232',
  dnd: '#f23f43',
  offline: '#80848e',
};

async function loadPresence() {
  const el = document.getElementById('rpc');
  if (!el) return;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
    const json = await res.json();
    if (!json.success) return; // not monitored yet: keep badge hidden
    const data = json.data;
    const activities = data.activities || [];
    const custom = activities.find((a) => a.type === 4);
    const act =
      activities.find((a) => a.type === 0) ||
      activities.find((a) => a.type === 2) ||
      activities.find((a) => a.type === 3 || a.type === 5);

    let text;
    if (act) {
      const verb = { 0: 'Playing', 2: 'Listening to', 3: 'Watching', 5: 'Competing in' }[act.type] || '';
      text = `${verb} ${act.name}`.trim();
    } else if (custom && custom.state) {
      text = custom.state;
    } else if (data.discord_status === 'offline') {
      return; // no badge when offline
    } else {
      text = { online: 'Online', idle: 'Idle', dnd: 'Do not disturb' }[data.discord_status] || data.discord_status;
    }

    const dot = document.getElementById('rpc-dot');
    const label = document.getElementById('rpc-text');
    if (dot) dot.style.background = STATUS_COLORS[data.discord_status] || STATUS_COLORS.offline;
    if (label) label.textContent = text;
    el.hidden = false;
  } catch {}
}

loadPresence();
setInterval(loadPresence, 60000);
