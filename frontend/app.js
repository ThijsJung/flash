const STORAGE_KEY = 'flash_sheet_url';

// ── State ────────────────────────────────────────────────────────────────
const state = {
  sheetId: '',
  deck: [],
  currentTab: '',
  index: 0,
  known: 0,
  flipped: false,
};

// ── DOM refs ─────────────────────────────────────────────────────────────
const screens = {
  url:     document.getElementById('screen-url'),
  decks:   document.getElementById('screen-decks'),
  study:   document.getElementById('screen-study'),
  summary: document.getElementById('screen-summary'),
};

const el = {
  sheetUrl:        document.getElementById('sheet-url'),
  btnLoad:         document.getElementById('btn-load'),
  urlError:        document.getElementById('url-error'),
  btnBackUrl:      document.getElementById('btn-back-url'),
  deckList:        document.getElementById('deck-list'),
  btnBackDecks:    document.getElementById('btn-back-decks'),
  progressBar:      document.getElementById('progress-bar'),
  progressText:     document.getElementById('progress-text'),
  card:             document.getElementById('card'),
  cardInner:        document.querySelector('.card-inner'),
  cardFrontText:    document.getElementById('card-front-text'),
  cardBackText:     document.getElementById('card-back-text'),
  cardNotesText:    document.getElementById('card-notes-text'),
  answerButtons:    document.getElementById('answer-buttons'),
  btnKnow:          document.getElementById('btn-know'),
  btnMiss:          document.getElementById('btn-miss'),
  summaryScoreNum:  document.getElementById('summary-score-num'),
  btnStudyAgain:    document.getElementById('btn-study-again'),
  btnPickDeck:      document.getElementById('btn-pick-deck'),
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

  const deckIdx = headers.findIndex(h => h.toLowerCase() === 'deck');
  const descIdx = headers.findIndex(h => h.toLowerCase() === 'description');

  if (deckIdx === -1) throw new Error('First tab must have a "deck" column listing your deck names.');

  return rows
    .filter(row => row.c[deckIdx]?.v)
    .map(row => ({
      name:        String(row.c[deckIdx].v),
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
    renderDeckList(decks);
    showScreen('decks');
  } catch (e) {
    showUrlError(e.message);
  } finally {
    el.btnLoad.disabled = false;
    el.btnLoad.textContent = 'Load decks';
  }
}

// ── Deck picker ───────────────────────────────────────────────────────────
function renderDeckList(decks) {
  el.deckList.innerHTML = '';
  decks.forEach(({ name, description }) => {
    const btn = document.createElement('button');
    btn.className = 'deck-item';
    btn.innerHTML = `<span class="deck-item-name">${name}</span>${description ? `<span class="deck-item-desc">${description}</span>` : ''}`;
    btn.addEventListener('click', () => handleSelectDeck(name));
    el.deckList.appendChild(btn);
  });
}

async function handleSelectDeck(tabName) {
  try {
    const cards = await fetchCards(state.sheetId, tabName);
    if (cards.length === 0) {
      throw new Error('No cards found. Check that row 1 has "front" and "back" headers.');
    }
    state.currentTab = tabName;
    state.deck = cards;
    startSession();
  } catch (e) {
    alert(e.message);
  }
}

// ── Study session ─────────────────────────────────────────────────────────
function startSession() {
  state.index = 0;
  state.known = 0;
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

  el.cardInner.classList.remove('flipped');
  el.cardFrontText.textContent = card.front;
  el.cardBackText.textContent  = card.back;
  el.cardNotesText.textContent = card.notes;
  el.cardNotesText.classList.toggle('hidden', !card.notes);
  el.answerButtons.classList.add('hidden');

  updateProgress();
}

function flipCard() {
  if (state.flipped) return;
  state.flipped = true;
  el.cardInner.classList.add('flipped');
  setTimeout(() => el.answerButtons.classList.remove('hidden'), 350);
}

function handleAnswer(known) {
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
function showSummary() {
  el.summaryScoreNum.textContent = `${state.known} / ${state.deck.length}`;
  showScreen('summary');
}

// ── Events ────────────────────────────────────────────────────────────────
el.btnLoad.addEventListener('click', handleLoadDecks);
el.sheetUrl.addEventListener('keydown', e => { if (e.key === 'Enter') handleLoadDecks(); });

el.btnBackUrl.addEventListener('click', () => showScreen('url'));
el.btnBackDecks.addEventListener('click', () => showScreen('decks'));

el.card.addEventListener('click', flipCard);
el.card.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); }
});

el.btnKnow.addEventListener('click', () => handleAnswer(true));
el.btnMiss.addEventListener('click', () => handleAnswer(false));

el.btnStudyAgain.addEventListener('click', startSession);
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
