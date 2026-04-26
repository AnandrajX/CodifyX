const apiKey = 'AIzaSyBS1MZYT8a0DUaEpKj6bQOIQkJB7pStRfU';
const maxResults = 12;

const CHANNELS = [
  'UCBwmMxybNva6P_5VmxjzwqA', // Apna College
  'UCDrf0V4fcBr5FlCtKwvpfwA', // College Wallah
  'UCeVMnSShP_Iviwkknt83cww', // Code With Harry
  'UCYO_jab_esuFRV4b17AJtAw'  // 3Blue1Brown
];

const PLAYLISTS = [
  ['PLxgZQoSe9cg1drBnejUaDD9GEJBGQ5hMt','C PW'],
  ['PLBlnK6fEyqRggZZgYpPMUxdY1CYkZtARR','C NA'],
  ['PLP9IO4UYNF0VdAajP_5pYG-jG2JRrG72s','HTML W3S'],
  ['PLP9IO4UYNF0UCaUSF3XNZ1U9f01E5h5PM','CSS W3S'],
  ['PLP9IO4UYNF0WWmZpE3W33vVPRl2GvjEqz','JS W3S'],
  ['PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW','JS AP'],
  ['PLkDaE6sCZn6FNC6YRfRQc_FbeQrF8BwGI','ML Andrew Ng'],
  ['PLhQjrBD2T380hlTqAU8HfvVepCcjCqTg6','CS50 2026']
];

let nextPageToken = '';
let currentSource = null;
let allCards = []; // {videoId, title, date, thumb}
let activeSort = 'date';
let isListView = false;

/* ===== DOM REFS ===== */
const $channels  = document.getElementById('channelButtons');
const $playlists = document.getElementById('playlistButtons');
const $grid      = document.getElementById('videosContainer');
const $loadMore  = document.getElementById('loadMoreBtn');
const $search    = document.getElementById('searchInput');
const $clear     = document.getElementById('searchClear');
const $empty     = document.getElementById('emptyState');
const $emptyQ    = document.getElementById('emptyQuery');
const $count     = document.getElementById('resultCount');
const $modal     = document.getElementById('playerModal');
const $frame     = document.getElementById('playerFrame');
const $mTitle    = document.getElementById('modalTitle');

/* ===== TOAST ===== */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/* ===== THEME ===== */
const html = document.documentElement;
const savedTheme = localStorage.getItem('cxTheme') || 'dark';
html.setAttribute('data-theme', savedTheme);
document.getElementById('themeIcon').textContent = savedTheme === 'dark' ? '☀️' : '🌙';

document.getElementById('themeBtn').addEventListener('click', () => {
  const cur = html.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  document.getElementById('themeIcon').textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('cxTheme', next);
  showToast(next === 'dark' ? 'Dark mode on' : 'Light mode on');
});

/* ===== SCROLL TOP ===== */
const $scrollTop = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
  $scrollTop.classList.toggle('visible', window.scrollY > 500);
});
$scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ===== SEARCH ===== */
let searchTimer;
$search.addEventListener('input', () => {
  const q = $search.value.trim();
  $clear.hidden = !q;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => renderCards(), 250);
});

$clear.addEventListener('click', clearSearch);

function clearSearch() {
  $search.value = '';
  $clear.hidden = true;
  renderCards();
  $search.focus();
}
window.clearSearch = clearSearch;

/* ===== SORT ===== */
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeSort = btn.dataset.sort;
    renderCards();
  });
});

/* ===== VIEW TOGGLE ===== */
document.getElementById('gridViewBtn').addEventListener('click', () => {
  isListView = false;
  $grid.classList.remove('list-view');
  document.getElementById('gridViewBtn').classList.add('active');
  document.getElementById('listViewBtn').classList.remove('active');
});
document.getElementById('listViewBtn').addEventListener('click', () => {
  isListView = true;
  $grid.classList.add('list-view');
  document.getElementById('listViewBtn').classList.add('active');
  document.getElementById('gridViewBtn').classList.remove('active');
});

/* ===== SKELETON LOADER ===== */
function showSkeletons(count = 6) {
  $grid.innerHTML = Array(count).fill(0).map(() => `
    <div class="skeleton">
      <div class="sk-thumb"></div>
      <div class="sk-body">
        <div class="sk-line" style="height:10px;width:40%"></div>
        <div class="sk-line" style="height:13px;width:90%;margin-top:4px"></div>
        <div class="sk-line" style="height:13px;width:70%"></div>
        <div class="sk-line" style="height:10px;width:35%;margin-top:6px"></div>
      </div>
    </div>
  `).join('');
}

/* ===== RENDER ===== */
function renderCards() {
  const q = $search.value.trim().toLowerCase();
  let cards = [...allCards];

  // Filter by search
  if (q) {
    cards = cards.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.channelTitle || '').toLowerCase().includes(q)
    );
  }

  // Sort
  if (activeSort === 'date') {
    cards.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (activeSort === 'title') {
    cards.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Update count
  $count.textContent = q ? `${cards.length} result${cards.length !== 1 ? 's' : ''} for "${q}"` : `${cards.length} video${cards.length !== 1 ? 's' : ''}`;

  // Empty state
  if (!cards.length && q) {
    $grid.innerHTML = '';
    $empty.hidden = false;
    $emptyQ.textContent = q;
    return;
  }
  $empty.hidden = true;

  $grid.innerHTML = '';
  cards.forEach((c, i) => renderCard(c, i));
}

/* ===== CARD ===== */
function renderCard({ videoId, title, date, thumb, channelTitle, embeddable }, idx) {
  const article = document.createElement('article');
  article.className = 'card';
  article.style.animationDelay = `${Math.min(idx * 0.04, 0.4)}s`;

  const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const thumbSrc = thumb || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  article.innerHTML = `
    <div class="thumb" role="button" tabindex="0" data-video="${videoId}" aria-label="Play ${escapeHtml(title)}">
      <img loading="lazy" src="${thumbSrc}" alt="Thumbnail for ${escapeHtml(title)}" />
      <div class="overlay">
        ${embeddable === false
          ? '<div class="playbtn lock-btn" title="Opens on YouTube"><span style="font-size:20px">↗</span></div>'
          : '<div class="playbtn"></div>'}
      </div>
    </div>
    <div class="meta">
      <div class="date-tag">
        ${dateStr ? `<span>${dateStr}</span>` : ''}
        ${channelTitle ? `<span class="tag-pill">${escapeHtml(channelTitle)}</span>` : ''}
      </div>
      <div class="title">${escapeHtml(title)}</div>
    </div>`;

  const thumb$ = article.querySelector('.thumb');
  thumb$.addEventListener('click', () => openModal(videoId, title, embeddable !== false));
  thumb$.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(videoId, title, embeddable !== false); }
  });

  $grid.appendChild(article);
}

/* ===== CHANNEL BUTTON ===== */
function makeBtn(label, img) {
  const b = document.createElement('button');
  b.className = 'btn';
  if (img) {
    const i = document.createElement('img');
    i.src = img; i.alt = label;
    b.appendChild(i);
  }
  const t = document.createElement('strong');
  t.textContent = label;
  b.appendChild(t);
  return b;
}

/* ===== LOAD CHANNELS ===== */
async function loadChannels() {
  for (const id of CHANNELS) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${id}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      const channel = data.items?.[0]?.snippet;
      if (channel) {
        const b = makeBtn(channel.title, channel.thumbnails.high.url);
        b.onclick = () => {
          document.querySelectorAll('#channelButtons .btn').forEach(x => x.classList.remove('active-source'));
          document.querySelectorAll('#playlistButtons .btn').forEach(x => x.classList.remove('active-source'));
          b.classList.add('active-source');
          fetchChannel(id);
        };
        $channels.appendChild(b);
      }
    } catch (err) {
      console.error('Error loading channel', id, err);
    }
  }
  document.getElementById('statChannels').textContent = CHANNELS.length;
}

/* ===== PLAYLIST BUTTONS ===== */
PLAYLISTS.forEach(([id, label]) => {
  const b = makeBtn(label);
  b.onclick = () => {
    document.querySelectorAll('#channelButtons .btn, #playlistButtons .btn').forEach(x => x.classList.remove('active-source'));
    b.classList.add('active-source');
    fetchPlaylist(id);
  };
  $playlists.appendChild(b);
});

/* ===== CHECK EMBEDDABLE (batch) ===== */
// Fetches video status for up to 50 IDs at once.
// Returns a Set of videoIds that are embeddable.
async function getEmbeddableIds(videoIds) {
  if (!videoIds.length) return new Set();
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.search = new URLSearchParams({
      key: apiKey,
      id: videoIds.join(','),
      part: 'status,contentDetails'
    });
    const res = await fetch(url);
    const data = await res.json();
    const embeddable = new Set();
    (data.items || []).forEach(item => {
      if (item.status?.embeddable !== false) {
        embeddable.add(item.id);
      }
    });
    return embeddable;
  } catch {
    // If the check itself fails, allow all (fail open)
    return new Set(videoIds);
  }
}

/* ===== FETCH CHANNEL ===== */
async function fetchChannel(id, pageToken = '') {
  currentSource = { type: 'channel', id };
  $grid.setAttribute('aria-busy', 'true');
  if (!pageToken) { allCards = []; showSkeletons(); }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.search = new URLSearchParams({ key: apiKey, channelId: id, part: 'snippet,id', order: 'date', maxResults: String(maxResults), pageToken });

  try {
    const res = await fetch(url);
    const data = await res.json();
    nextPageToken = data.nextPageToken || '';
    $loadMore.style.visibility = nextPageToken ? 'visible' : 'hidden';
    if (!pageToken) allCards = [];

    // Collect video IDs and check embeddability
    const items = (data.items || []).filter(item => item?.id?.videoId);
    const videoIds = items.map(item => item.id.videoId);
    const embeddable = await getEmbeddableIds(videoIds);

    items.forEach(item => {
      const vid = item.id.videoId;
      const s = item.snippet;
      allCards.push({
        videoId: vid,
        title: s.title,
        date: s.publishedAt,
        thumb: (s.thumbnails?.high || s.thumbnails?.medium)?.url,
        channelTitle: s.channelTitle,
        embeddable: embeddable.has(vid)
      });
    });
    renderCards();
  } catch (e) {
    showToast('Failed to load videos. Check API key.');
    $grid.innerHTML = '';
  }
  $grid.setAttribute('aria-busy', 'false');
}

/* ===== FETCH PLAYLIST ===== */
async function fetchPlaylist(id, pageToken = '') {
  currentSource = { type: 'playlist', id };
  $grid.setAttribute('aria-busy', 'true');
  if (!pageToken) { allCards = []; showSkeletons(); }

  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  url.search = new URLSearchParams({ key: apiKey, playlistId: id, part: 'snippet', maxResults: String(maxResults), pageToken });

  try {
    const res = await fetch(url);
    const data = await res.json();
    nextPageToken = data.nextPageToken || '';
    $loadMore.style.visibility = nextPageToken ? 'visible' : 'hidden';
    if (!pageToken) allCards = [];
    (data.items || []).forEach(item => {
      const s = item.snippet;
      allCards.push({
        videoId: s?.resourceId?.videoId,
        title: s.title, date: s.publishedAt,
        thumb: (s.thumbnails?.high || s.thumbnails?.medium)?.url,
        channelTitle: s.videoOwnerChannelTitle,
        embeddable: true
      });
    });
    renderCards();
  } catch (e) {
    showToast('Failed to load playlist.');
    $grid.innerHTML = '';
  }
  $grid.setAttribute('aria-busy', 'false');
}

/* ===== LOAD MORE ===== */
function loadMore() {
  if (!currentSource || !nextPageToken) return;
  if (currentSource.type === 'channel') fetchChannel(currentSource.id, nextPageToken);
  else fetchPlaylist(currentSource.id, nextPageToken);
}
window.loadMore = loadMore;

/* ===== MODAL ===== */
function openModal(videoId, title = '', embeddable = true) {
  if (!embeddable) {
    showToast("This video cannot be embedded — opening on YouTube");
    setTimeout(() => window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank", "noopener"), 400);
    return;
  }
  $frame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  $mTitle.textContent = title;
  $modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  $frame.src = '';
  $modal.classList.remove('open');
  document.body.style.overflow = '';
}
window.closeModal = closeModal;

$modal.addEventListener('click', e => { if (e.target === $modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ===== ESC KEY HINT ===== */
function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

/* ===== INIT ===== */
$loadMore.style.visibility = 'hidden';
loadChannels();
fetchChannel('UCYO_jab_esuFRV4b17AJtAw');
