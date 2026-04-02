const STORAGE_KEY = 'flash_sheet_url';

// ── Analytics ─────────────────────────────────────────────────────────────
function track(event, props) {
  if (window.posthog) posthog.capture(event, props);
}

// ── State ────────────────────────────────────────────────────────────────
const state = {
  sheetId: '',
  fullDeck: [],      // all cards fetched from the sheet
  deck: [],          // the sliced/shuffled session deck
  currentTab: '',
  currentDeckTitle: '',
  currentDeckDesc: '',
  index: 0,
  known: 0,
  flipped: false,
  hasFlipped: false,
  selectedSize: 0,   // 0 = All
  shuffled: true,
  reversed: false,
};

// ── DOM refs ─────────────────────────────────────────────────────────────
const screens = {
  url:     document.getElementById('screen-url'),
  decks:   document.getElementById('screen-decks'),
  ready:   document.getElementById('screen-ready'),
  study:   document.getElementById('screen-study'),
  summary: document.getElementById('screen-summary'),
};

const el = {
  sheetUrl:           document.getElementById('sheet-url'),
  btnLoad:            document.getElementById('btn-load'),
  urlError:           document.getElementById('url-error'),
  btnBackUrl:         document.getElementById('btn-back-url'),
  deckList:           document.getElementById('deck-list'),
  btnBackReady:       document.getElementById('btn-back-ready'),
  readyDeckName:      document.getElementById('ready-deck-name'),
  readyDeckDesc:      document.getElementById('ready-deck-desc'),
  sessionSizeOptions: document.getElementById('session-size-options'),
  btnStart:           document.getElementById('btn-start'),
  btnBackDecks:       document.getElementById('btn-back-decks'),
  progressBar:        document.getElementById('progress-bar'),
  progressText:       document.getElementById('progress-text'),
  card:               document.getElementById('card'),
  cardInner:          document.querySelector('.card-inner'),
  cardFrontText:      document.getElementById('card-front-text'),
  cardBackText:       document.getElementById('card-back-text'),
  cardNotesText:      document.getElementById('card-notes-text'),
  cardHint:           document.querySelector('.card-hint'),
  answerButtons:      document.getElementById('answer-buttons'),
  btnKnow:            document.getElementById('btn-know'),
  btnMiss:            document.getElementById('btn-miss'),
  summaryScoreNum:    document.getElementById('summary-score-num'),
  btnRepeat:          document.getElementById('btn-repeat'),
  btnStudyAgain:      document.getElementById('btn-study-again'),
  btnPickDeck:        document.getElementById('btn-pick-deck'),
};

// ── Screens ───────────────────────────────────────────────────────────────
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ── Utilities ─────────────────────────────────────────────────────────────
function extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function showUrlError(msg) {
  el.urlError.textContent = msg;
  el.urlError.classList.remove('hidden');
}

function clearUrlError() {
  el.urlError.classList.add('hidden');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Google Sheets fetching ────────────────────────────────────────────────
async function parseGviz(text) {
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/);
  if (!match) throw new Error('Unexpected response from Google Sheets.');
  const json = JSON.parse(match[1]);
  if (json.status === 'error') throw new Error(json.errors?.[0]?.message ?? 'Sheet returned an error.');
  return json;
}

// gviz doesn't always detect the header row (parsedNumHeaders: 0).
// This normalises both cases into { headers: string[], rows: Row[] }.
function normalizeTable(table) {
  if (table.parsedNumHeaders > 0) {
    return { headers: table.cols.map(c => c.label), rows: table.rows };
  }
  // First row is the header row masquerading as data
  const headerRow = table.rows[0]?.c ?? [];
  return {
    headers: headerRow.map(cell => cell?.v ?? ''),
    rows: table.rows.slice(1),
  };
}

async function fetchIndex(sheetId) {
  // No &sheet= param → gviz returns the first tab by default
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`
  );
  if (!res.ok) throw new Error('Could not reach Google Sheets. Is it set to public?');

  const json = await parseGviz(await res.text());
  const { headers, rows } = normalizeTable(json.table);

  const idIdx    = headers.findIndex(h => h.toLowerCase() === 'id');
  const titleIdx = headers.findIndex(h => h.toLowerCase() === 'title');
  const descIdx  = headers.findIndex(h => h.toLowerCase() === 'description');

  if (idIdx === -1 || titleIdx === -1) throw new Error('First tab must have "id" and "title" columns.');

  return rows
    .filter(row => row.c[idIdx]?.v)
    .map(row => ({
      id:          String(row.c[idIdx].v),
      title:       String(row.c[titleIdx]?.v ?? ''),
      description: descIdx >= 0 ? String(row.c[descIdx]?.v ?? '') : '',
    }));
}

async function fetchCards(sheetId, tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not reach Google Sheets. Check your internet connection.');

  const json = await parseGviz(await res.text());
  const { headers, rows } = normalizeTable(json.table);

  const idx = label => headers.findIndex(h => h.toLowerCase() === label.toLowerCase());
  const frontIdx = idx('front');
  const backIdx  = idx('back');
  const notesIdx = idx('notes');

  if (frontIdx === -1 || backIdx === -1) {
    throw new Error('Tab must have "front" and "back" column headers in row 1.');
  }

  return rows
    .filter(row => row.c[frontIdx]?.v)
    .map(row => ({
      front: String(row.c[frontIdx].v),
      back:  String(row.c[backIdx]?.v  ?? ''),
      notes: notesIdx >= 0 ? String(row.c[notesIdx]?.v ?? '') : '',
    }));
}

// ── URL screen ────────────────────────────────────────────────────────────
async function handleLoadDecks() {
  clearUrlError();
  const url = el.sheetUrl.value.trim();
  if (!url) { showUrlError('Please enter a Google Sheets URL.'); return; }

  const sheetId = extractSheetId(url);
  if (!sheetId) { showUrlError('Could not find a sheet ID in that URL.'); return; }

  el.btnLoad.disabled = true;
  el.btnLoad.textContent = 'Loading...';

  try {
    const decks = await fetchIndex(sheetId);
    state.sheetId = sheetId;
    localStorage.setItem(STORAGE_KEY, url);
    track('sheet_loaded', { sheet_id: sheetId, deck_count: decks.length });
    renderDeckList(decks);
    showScreen('decks');
  } catch (e) {
    track('sheet_load_error', { message: e.message });
    showUrlError(e.message);
  } finally {
    el.btnLoad.disabled = false;
    el.btnLoad.textContent = 'Load decks';
  }
}

// ── Deck picker ───────────────────────────────────────────────────────────
function renderDeckList(decks) {
  el.deckList.innerHTML = '';
  decks.forEach(({ id, title, description }) => {
    const btn = document.createElement('button');
    btn.className = 'deck-item';
    btn.innerHTML = `<span class="deck-item-name">${title}</span>${description ? `<span class="deck-item-desc">${description}</span>` : ''}`;
    btn.addEventListener('click', () => handleSelectDeck(id, title, description));
    el.deckList.appendChild(btn);
  });
}

async function handleSelectDeck(tabName, title, description) {
  try {
    const cards = await fetchCards(state.sheetId, tabName);
    if (cards.length === 0) {
      throw new Error('No cards found. Check that row 1 has "front" and "back" headers.');
    }
    state.currentTab = tabName;
    state.currentDeckTitle = title;
    state.currentDeckDesc = description;
    state.fullDeck = cards;
    track('deck_selected', { deck: title, card_count: cards.length });
    showReadyScreen();
  } catch (e) {
    alert(e.message);
  }
}

// ── Ready screen ──────────────────────────────────────────────────────────
function showReadyScreen() {
  const total = state.fullDeck.length;

  el.readyDeckName.textContent = state.currentDeckTitle;
  el.readyDeckDesc.textContent = state.currentDeckDesc;
  el.readyDeckDesc.classList.toggle('hidden', !state.currentDeckDesc);

  // Build size slider
  const defaultVal = total >= 20 ? 20 : total >= 10 ? 10 : total;
  state.selectedSize = defaultVal === total ? 0 : defaultVal;

  const sliderLabel = val => val === total ? 'All' : String(val);

  el.sessionSizeOptions.innerHTML = `
    <div class="size-slider-wrap">
      <input type="range" id="session-size-slider" class="size-slider"
             min="1" max="${total}" value="${defaultVal}">
      <span id="session-size-value" class="size-slider-value">${sliderLabel(defaultVal)}</span>
    </div>
  `;

  document.getElementById('session-size-slider').addEventListener('input', e => {
    const val = Number(e.target.value);
    state.selectedSize = val === total ? 0 : val;
    document.getElementById('session-size-value').textContent = sliderLabel(val);
  });

  // Sync order toggle to current state
  document.querySelectorAll('[data-order]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.order === (state.shuffled ? 'shuffled' : 'ordered'));
  });

  // Sync direction toggle to current state
  document.querySelectorAll('[data-direction]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.direction === (state.reversed ? 'reverse' : 'forward'));
  });

  showScreen('ready');
}


// ── Study session ─────────────────────────────────────────────────────────
function startSession() {
  const ordered = state.shuffled ? shuffle(state.fullDeck) : [...state.fullDeck];
  state.deck = state.selectedSize === 0 ? ordered : ordered.slice(0, state.selectedSize);
  state.index = 0;
  state.known = 0;
  track('session_started', { deck: state.currentDeckTitle, deck_size: state.deck.length, shuffled: state.shuffled, reversed: state.reversed });
  showScreen('study');
  showCard(0);
}

function updateProgress() {
  const total = state.deck.length;
  const done  = state.index;
  el.progressBar.style.width = total > 0 ? `${(done / total) * 100}%` : '0%';
  el.progressText.textContent = `${done} / ${total}`;
}

function showCard(index) {
  const card = state.deck[index];
  state.flipped = false;

  // Snap back to front without animating to avoid briefly showing the next card's answer
  el.cardInner.style.transition = 'none';
  el.cardInner.classList.remove('flipped');
  el.cardInner.offsetHeight; // force reflow before restoring transition
  el.cardInner.style.transition = '';

  el.cardFrontText.textContent = state.reversed ? card.back  : card.front;
  el.cardBackText.textContent  = state.reversed ? card.front : card.back;
  el.cardNotesText.textContent = card.notes;
  el.cardNotesText.classList.toggle('hidden', !card.notes);
  el.answerButtons.classList.remove('visible');
  el.cardHint.textContent = 'tap to reveal';
  state.hasFlipped = false;

  updateProgress();
}

function flipCard() {
  state.flipped = !state.flipped;
  el.cardInner.classList.toggle('flipped', state.flipped);
  if (state.flipped) {
    setTimeout(() => el.answerButtons.classList.add('visible'), 350);
    if (!state.hasFlipped) {
      state.hasFlipped = true;
      el.cardHint.textContent = 'tap to flip';
      track('card_flipped', { deck: state.currentDeckTitle, card_index: state.index });
    }
  }
}

function handleAnswer(known) {
  track('card_rated', { deck: state.currentDeckTitle, card_index: state.index, result: known ? 'know' : 'learning' });
  if (known) state.known++;
  state.index++;

  if (state.index >= state.deck.length) {
    updateProgress();
    setTimeout(showSummary, 300);
  } else {
    showCard(state.index);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────
function repeatSession() {
  if (state.shuffled) state.deck = shuffle(state.deck);
  state.index = 0;
  state.known = 0;
  track('session_started', { deck: state.currentDeckTitle, deck_size: state.deck.length, shuffled: state.shuffled });
  showScreen('study');
  showCard(0);
}

function showSummary() {
  track('session_completed', { deck: state.currentDeckTitle, score: state.known, total: state.deck.length });
  el.summaryScoreNum.textContent = `${state.known} / ${state.deck.length}`;
  showScreen('summary');
}

// ── Events ────────────────────────────────────────────────────────────────
el.btnLoad.addEventListener('click', handleLoadDecks);
el.sheetUrl.addEventListener('keydown', e => { if (e.key === 'Enter') handleLoadDecks(); });

el.btnBackUrl.addEventListener('click', () => showScreen('url'));
el.btnBackReady.addEventListener('click', () => showScreen('decks'));
el.btnStart.addEventListener('click', startSession);

document.querySelectorAll('[data-order]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.shuffled = btn.dataset.order === 'shuffled';
    document.querySelectorAll('[data-order]').forEach(b => {
      b.classList.toggle('active', b === btn);
    });
  });
});

document.querySelectorAll('[data-direction]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.reversed = btn.dataset.direction === 'reverse';
    document.querySelectorAll('[data-direction]').forEach(b => {
      b.classList.toggle('active', b === btn);
    });
  });
});

el.btnBackDecks.addEventListener('click', () => showScreen('decks'));

el.card.addEventListener('click', flipCard);
el.card.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); }
});

el.btnKnow.addEventListener('click', () => handleAnswer(true));
el.btnMiss.addEventListener('click', () => handleAnswer(false));

el.btnRepeat.addEventListener('click', repeatSession);
el.btnStudyAgain.addEventListener('click', () => showReadyScreen());
el.btnPickDeck.addEventListener('click', () => showScreen('decks'));

// Keyboard shortcuts during study (right = know it, left = still learning)
document.addEventListener('keydown', e => {
  if (!screens.study.classList.contains('active') || !state.flipped) return;
  if (e.key === 'ArrowRight') handleAnswer(true);
  if (e.key === 'ArrowLeft')  handleAnswer(false);
});

// ── Init ──────────────────────────────────────────────────────────────────
const savedUrl = localStorage.getItem(STORAGE_KEY);
if (savedUrl) el.sheetUrl.value = savedUrl;

// ?sheet=SHEET_ID — pre-load a sheet and skip the URL input screen
const sheetParam = new URLSearchParams(window.location.search).get('sheet');
if (sheetParam) {
  // Accept either a bare sheet ID or a full Google Sheets URL
  const sheetId = extractSheetId(sheetParam) ?? sheetParam;
  el.sheetUrl.value = `https://docs.google.com/spreadsheets/d/${sheetId}`;
  handleLoadDecks();
}
