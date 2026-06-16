/* ============================================================
   BigQuery Release Notes — script.js
   ============================================================ */

'use strict';

// ── DOM references ──────────────────────────────────────────────────────────
const el = (id) => document.getElementById(id);

const stateInitial  = el('state-initial');
const stateLoading  = el('state-loading');
const stateError    = el('state-error');
const notesGrid     = el('notes-grid');
const statsBar      = el('stats-bar');
const statCount     = el('stat-count');
const lastUpdated   = el('last-updated');
const refreshBtn    = el('refresh-btn');
const refreshIcon   = el('refresh-icon');
const refreshLabel  = el('refresh-label');
const errorMessage  = el('error-message');
const tweetModal    = el('tweet-modal');
const tweetTextarea = el('tweet-text');
const charCount     = el('char-count');
const charWarn      = el('char-warn');

// ── State ───────────────────────────────────────────────────────────────────
let isLoading = false;

// ── Visibility helpers ───────────────────────────────────────────────────────
function showOnly(element) {
  [stateInitial, stateLoading, stateError, notesGrid].forEach((el) => {
    el.style.display = 'none';
  });
  if (element) element.style.display = '';
}

// ── Date badge colour helper ────────────────────────────────────────────────
function getDateBadgeLabel(dateStr) {
  // Returns a short category label e.g. "Feature", "Fix", "Preview"
  return 'Update';
}

// ── Build a single card element ─────────────────────────────────────────────
function buildCard(entry, index) {
  const card = document.createElement('article');
  card.className = 'note-card';
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Release note: ${entry.title}`);
  card.dataset.index = index;

  // Truncate summary for display
  const summaryText = entry.summary && entry.summary.length > 0
    ? entry.summary
    : 'No summary available.';

  card.innerHTML = `
    <div class="card-header">
      <span class="card-date">${escHtml(entry.date || 'No date')}</span>
      <span class="card-badge">BigQuery</span>
    </div>
    <h3 class="card-title">${escHtml(entry.title)}</h3>
    <p class="card-summary">${escHtml(summaryText)}</p>
    <div class="card-footer">
      ${entry.link && entry.link !== '#'
        ? `<a class="card-link" href="${escHtml(entry.link)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
               <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>
             View details
           </a>`
        : '<span></span>'
      }
      <button class="btn-share" onclick="openTweetModal(event, ${index})" aria-label="Share on X / Twitter">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.632L18.245 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Share
      </button>
    </div>
  `;

  // Click on card body to open tweet modal (but not clicks on buttons/links)
  card.addEventListener('click', (e) => {
    if (!e.target.closest('a, button')) {
      openTweetModal(e, index);
    }
  });

  card.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a, button')) {
      openTweetModal(e, index);
    }
  });

  return card;
}

// ── Escape HTML to prevent XSS ───────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Render all cards ─────────────────────────────────────────────────────────
let cachedEntries = [];

function renderNotes(entries) {
  cachedEntries = entries;
  notesGrid.innerHTML = '';

  if (!entries || entries.length === 0) {
    showOnly(stateError);
    errorMessage.textContent = 'No release notes were found in the feed.';
    return;
  }

  const fragment = document.createDocumentFragment();
  entries.forEach((entry, i) => {
    fragment.appendChild(buildCard(entry, i));
  });
  notesGrid.appendChild(fragment);

  showOnly(notesGrid);
  statsBar.style.display = '';
  statCount.textContent = entries.length;
}

// ── Fetch from Flask API ──────────────────────────────────────────────────────
async function loadReleaseNotes() {
  if (isLoading) return;
  isLoading = true;

  // Update UI to loading state
  setRefreshLoading(true);
  showOnly(stateLoading);
  statsBar.style.display = 'none';

  try {
    const res = await fetch('/api/release-notes');
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    renderNotes(data.entries || []);

    // Update last-refreshed timestamp
    const now = new Date();
    lastUpdated.textContent = `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  } catch (err) {
    showOnly(stateError);
    errorMessage.textContent = err.message || 'Could not load release notes. Please try again.';
    console.error('[BigQuery Notes] Fetch error:', err);
  } finally {
    isLoading = false;
    setRefreshLoading(false);
  }
}

function setRefreshLoading(loading) {
  refreshBtn.disabled = loading;
  if (loading) {
    refreshIcon.classList.add('spinning');
    refreshLabel.textContent = 'Loading…';
  } else {
    refreshIcon.classList.remove('spinning');
    refreshLabel.textContent = 'Refresh';
  }
}

// ── Tweet modal ───────────────────────────────────────────────────────────────
function buildTweetText(entry) {
  const title   = entry.title   || '';
  const date    = entry.date    || '';
  const summary = entry.summary || '';
  const link    = entry.link && entry.link !== '#' ? entry.link : '';

  // Build tweet: title + (optional) a brief snippet + link + hashtags
  const hashtags = '#BigQuery #GoogleCloud';
  const baseText = link
    ? `${title}\n\n${link}\n\n${hashtags}`
    : `${title}\n\n${hashtags}`;

  if (baseText.length <= 280) return baseText;

  // Fallback: no link, just title + tags
  const compact = `${title}\n\n${hashtags}`;
  if (compact.length <= 280) return compact;

  // Last resort: truncate title
  const maxTitle = 280 - hashtags.length - 4;
  return `${title.slice(0, maxTitle)}…\n\n${hashtags}`;
}

function openTweetModal(event, entryIndex) {
  event.stopPropagation();
  const entry = cachedEntries[entryIndex];
  if (!entry) return;

  // Highlight selected card
  document.querySelectorAll('.note-card').forEach((c) => c.classList.remove('selected'));
  const card = document.querySelector(`.note-card[data-index="${entryIndex}"]`);
  if (card) card.classList.add('selected');

  tweetTextarea.value = buildTweetText(entry);
  updateCharCount();

  tweetModal.style.display = 'flex';
  tweetModal.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';

  // Focus textarea after animation
  requestAnimationFrame(() => {
    setTimeout(() => tweetTextarea.focus(), 50);
  });
}

function closeTweetModal(event) {
  // If clicking backdrop (not the modal itself), close
  if (event && event.target !== tweetModal) return;

  tweetModal.style.display = 'none';
  tweetModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  // Deselect cards
  document.querySelectorAll('.note-card').forEach((c) => c.classList.remove('selected'));
}

function updateCharCount() {
  const len = tweetTextarea.value.length;
  charCount.textContent = `${len} / 280`;

  charCount.classList.remove('near-limit', 'at-limit');
  charWarn.style.display = 'none';

  if (len >= 280) {
    charCount.classList.add('at-limit');
  } else if (len >= 240) {
    charCount.classList.add('near-limit');
    charWarn.style.display = '';
  }
}

function sendTweet() {
  const text = tweetTextarea.value.trim();
  if (!text) return;

  const encoded = encodeURIComponent(text);
  const url = `https://twitter.com/intent/tweet?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer,width=580,height=440');
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // Escape closes modal
  if (e.key === 'Escape' && tweetModal.style.display !== 'none') {
    tweetModal.style.display = 'none';
    tweetModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.querySelectorAll('.note-card').forEach((c) => c.classList.remove('selected'));
  }

  // R key triggers refresh (when not focused on input)
  if (e.key === 'r' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    loadReleaseNotes();
  }
});
