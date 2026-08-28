import './style.css';
import heroUrl from './assets/range-field-map.webp';
import { cellKey, createMap, hexDistance, isSolved, isValidDay, isoToday, routeDistances, type Cell, type MapData } from './game';

const app = document.querySelector<HTMLDivElement>('#app')!;
const glyphs = { open: '·', water: '≈', ridge: '▲', lookout: '✦' } as const;
const terrainNames = { open: 'open ground', water: 'water — cannot place', ridge: 'ridge — cannot place', lookout: 'lookout' } as const;
const today = isoToday();
let day = today;
let map: MapData;
let relays: Cell[] = [];
let teammateKey: string | null = null;
let attempts = 0;
let solved = false;

function parseState() {
  relays = [];
  teammateKey = null;
  attempts = 0;
  solved = false;
  const params = new URLSearchParams(location.search);
  day = isValidDay(params.get('day'), today) ? params.get('day')! : today;
  map = createMap(day);
  const shared = params.get('relay');
  if (shared) {
    const cell = map.cells.find((item) => cellKey(item) === shared && item.terrain !== 'water' && item.terrain !== 'ridge' && cellKey(item) !== cellKey(map.start) && cellKey(item) !== cellKey(map.target));
    if (cell) {
      teammateKey = shared;
      relays = [cell];
    }
  } else {
    restoreSaved();
  }
}

function restoreSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(`daily-range:${day}`) ?? 'null') as { solved?: boolean; attempts?: number; relays?: string[] } | null;
    if (!saved?.solved || saved.relays?.length !== 2) return;
    const restored = saved.relays.map((key) => map.cells.find((cell) => cellKey(cell) === key)).filter((cell): cell is Cell => Boolean(cell));
    if (isSolved(map, restored)) {
      relays = restored;
      attempts = Math.max(saved.attempts ?? 1, 1);
      solved = true;
    }
  } catch { /* storage is optional and untrusted */ }
}

function legalCell(cell: Cell): boolean {
  return !['water', 'ridge'].includes(cell.terrain) && ![cellKey(map.start), cellKey(map.target)].includes(cellKey(cell));
}

function point(cell: Cell): { x: number; y: number } {
  return { x: 7.2 + cell.col * 13.1 + (cell.row % 2) * 6.55, y: 12 + cell.row * 19 };
}

function routeSvg(): string {
  const route = [map.start, ...relays, ...(relays.length === 2 ? [map.target] : [])];
  return route.slice(1).map((cell, index) => {
    const a = point(route[index]);
    const b = point(cell);
    const distance = hexDistance(route[index], cell);
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="route-line ${distance <= 3 ? 'in-range' : 'over-range'}" />`;
  }).join('');
}

function statusText(): string {
  if (solved) return `Signal linked. All three hops are within 3 km.`;
  if (relays.length === 0) return 'Plant relay 1. Use a lookout somewhere in your route.';
  if (relays.length === 1) {
    const distance = hexDistance(map.start, relays[0]);
    return `${teammateKey ? 'A teammate planted' : 'Relay 1 is'} ${distance} km from camp. Plant relay 2.`;
  }
  const distances = routeDistances(map, relays);
  const issue = distances.findIndex((distance) => distance > 3);
  if (!relays.some((cell) => cell.terrain === 'lookout')) return 'Route needs at least one relay on a ✦ lookout.';
  if (issue >= 0) return `Hop ${issue + 1} is ${distances[issue]} km—over the 3 km range. Move a relay.`;
  return 'Checking the route…';
}

function cellMarkup(cell: Cell): string {
  const key = cellKey(cell);
  const relayIndex = relays.findIndex((item) => cellKey(item) === key);
  const special = key === cellKey(map.start) ? 'start' : key === cellKey(map.target) ? 'target' : '';
  const unavailable = !legalCell(cell);
  const label = special === 'start' ? 'Camp, route start' : special === 'target' ? 'Beacon, route goal' : `Column ${cell.col + 1}, row ${cell.row + 1}, ${terrainNames[cell.terrain]}${relayIndex >= 0 ? `, relay ${relayIndex + 1}${key === teammateKey ? ' from teammate' : ''}` : ''}`;
  return `<button class="hex terrain-${cell.terrain} ${special} ${relayIndex >= 0 ? 'has-relay' : ''}" style="--col:${cell.col};--row:${cell.row};--offset:${cell.row % 2}" data-cell="${key}" aria-label="${label}" aria-pressed="${relayIndex >= 0}" ${unavailable ? 'aria-disabled="true"' : ''} ${solved ? 'disabled' : ''}>
    <span class="terrain-glyph" aria-hidden="true">${special === 'start' ? '⌂' : special === 'target' ? '◆' : glyphs[cell.terrain]}</span>
    ${relayIndex >= 0 ? `<span class="relay-token" aria-hidden="true">${relayIndex + 1}</span>` : ''}
  </button>`;
}

function gameMarkup(): string {
  const distances = routeDistances(map, relays);
  return `<section class="game-shell" aria-labelledby="map-title">
    <div class="game-head">
      <div><p class="eyebrow">Field sheet ${map.number}</p><h2 id="map-title">${day === today ? 'Today’s survey' : new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</h2></div>
      <label class="date-control">Replay a date<input id="day-picker" type="date" min="2026-01-01" max="${today}" value="${day}" /></label>
    </div>
    ${teammateKey ? '<div class="teammate-note"><span aria-hidden="true">✦</span><span><strong>A friend started this route.</strong> Their relay 1 is pinned. Place relay 2 to finish it together.</span></div>' : ''}
    <div class="map-wrap">
      <svg class="routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${routeSvg()}</svg>
      <div class="board" role="group" aria-label="Daily 7 column by 5 row hex map. Arrow keys move between tiles; Enter or Space plants a relay.">${map.cells.map(cellMarkup).join('')}</div>
    </div>
    <div class="legend" aria-label="Map legend"><span><b>⌂</b> Camp</span><span><b>◆</b> Beacon</span><span><b>✦</b> Lookout</span><span><b>▲</b> Ridge</span><span><b>≈</b> Water</span></div>
    <div class="route-readout">
      <div><span>Hop 1</span><strong>${distances[0] ?? '—'} km</strong></div><div><span>Hop 2</span><strong>${distances[1] ?? '—'} km</strong></div><div><span>Hop 3</span><strong>${distances[2] ?? '—'} km</strong></div>
    </div>
    <p class="status" id="game-status" tabindex="-1" aria-live="polite">${statusText()}</p>
    <div class="game-actions">
      <button class="button secondary" id="undo" ${relays.length === 0 || solved || (relays.length === 1 && Boolean(teammateKey)) ? 'disabled' : ''}>Undo last relay</button>
      ${relays.length === 1 && !teammateKey ? '<button class="button primary" id="share-move">Send first move</button>' : ''}
      ${solved ? '<button class="button primary" id="share-result">Share result</button><button class="button secondary" id="copy-result">Copy result</button>' : ''}
    </div>
    <p class="board-help">Keyboard: use arrow keys to move across the map, Enter or Space to plant, and Backspace to undo.</p>
  </section>`;
}

function chrome(content: string): string {
  return `<header class="site-header"><a class="brand" href="/" aria-label="Daily Range home"><span class="brand-mark" aria-hidden="true">↗</span><span>Daily Range</span></a><nav aria-label="Main navigation"><a href="/#how">How to play</a><a href="/privacy">Privacy</a></nav></header>
  ${navigator.onLine ? '' : '<div class="offline-note" role="status"><strong>Offline field kit:</strong> cached maps and past dates still work.</div>'}
  <main id="main">${content}</main>
  <footer><p>Made for two curious minds. No accounts, ads, analytics, or streak pressure.</p><p><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · AI-assisted original artwork</p></footer>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

function legalPage(kind: 'privacy' | 'terms') {
  const privacy = `<p class="eyebrow">The short version</p><h1>Nothing leaves your map.</h1><p>Daily Range has no accounts, analytics, advertising, or third-party scripts. Puzzle progress and preferences are stored only in your browser. Shared links contain a public puzzle date and a map coordinate—never a name or identifier.</p><h2>Local storage</h2><p>We may save completed puzzle dates on this device so a replay can remember its state. You can remove that data at any time by clearing site storage in your browser.</p><h2>Network and offline use</h2><p>The site uses a service worker to cache its own files for offline replay. It does not send gameplay events to a server. Hosting logs may temporarily contain standard request information such as an IP address, as is normal for static website delivery.</p><h2>Questions</h2><p>This policy is effective 28 August 2026. The project source and issue tracker are the contact channel.</p>`;
  const terms = `<p class="eyebrow">Plain-language terms</p><h1>Play fair. Have fun.</h1><p>Daily Range is a free puzzle provided “as is,” without warranties. You may play, share result text, and inspect or adapt the open-source code under its MIT License.</p><h2>Acceptable use</h2><p>Do not attempt to disrupt the service or use it to harm others. Shared links encode only puzzle state; you are responsible for where you post them.</p><h2>Availability</h2><p>Daily maps are deterministically generated in your browser. We may improve rules or presentation over time and cannot promise uninterrupted hosting.</p><h2>Changes</h2><p>These terms are effective 28 August 2026. Material changes will be reflected on this page.</p>`;
  app.innerHTML = chrome(`<article class="legal">${kind === 'privacy' ? privacy : terms}<p><a class="text-link" href="/">← Back to today’s map</a></p></article>`);
}

function renderGame(focusKey?: string) {
  const content = `<section class="hero">
    <div class="hero-copy"><p class="eyebrow">A tiny daily co-op puzzle</p><h1>Close the distance.</h1><p class="lede">Plant two relays. Keep every hop within range. Send the first move to a friend and let them bring the signal home.</p><a class="button primary jump" href="#puzzle">Play today’s map <span aria-hidden="true">↓</span></a></div>
    <div class="hero-art"><img src="${heroUrl}" width="768" height="512" alt="Abstract risograph field map with blue islands, orange route marks, and paper texture" fetchpriority="high" decoding="async" /><span class="art-stamp">1 hex = 1 km</span></div>
  </section>
  <section class="rules" id="how" aria-labelledby="rules-title"><p class="eyebrow">Your field notes</p><h2 id="rules-title">Two relays. Three short hops.</h2><ol><li><span>01</span><p>Plant exactly <strong>two relays</strong> on open ground.</p></li><li><span>02</span><p>Keep camp → relay → relay → beacon at <strong>3 km or less</strong> per hop.</p></li><li><span>03</span><p>Place at least one relay on a <strong>✦ lookout</strong>. Ridges and water are blocked.</p></li></ol></section>
  <div id="puzzle">${gameMarkup()}</div>`;
  app.innerHTML = chrome(content);
  bindGame();
  if (focusKey) document.querySelector<HTMLElement>(`[data-cell="${focusKey}"]`)?.focus();
  if (solved) document.querySelector<HTMLElement>('#game-status')?.focus();
}

function selectCell(cell: Cell) {
  if (!legalCell(cell) || solved) return;
  const existing = relays.findIndex((item) => cellKey(item) === cellKey(cell));
  if (existing >= 0) {
    if (cellKey(cell) !== teammateKey) relays.splice(existing, 1);
  } else if (relays.length < 2) {
    relays.push(cell);
    if (relays.length === 2) {
      attempts += 1;
      solved = isSolved(map, relays);
      if (solved) {
        try { localStorage.setItem(`daily-range:${day}`, JSON.stringify({ solved: true, attempts, relays: relays.map(cellKey) })); } catch { /* storage is optional */ }
      }
    }
  }
  renderGame(cellKey(cell));
}

function moveFocus(current: Cell, key: string) {
  const odd = current.row % 2;
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [odd ? 0 : -1, -1], ArrowDown: [odd ? 0 : -1, 1],
  };
  const [dc, dr] = moves[key];
  const next = map.cells.find((cell) => cell.col === current.col + dc && cell.row === current.row + dr);
  document.querySelector<HTMLElement>(`[data-cell="${cellKey(next ?? current)}"]`)?.focus();
}

async function copyOrShare(text: string, url?: string) {
  if (navigator.share) {
    try { await navigator.share({ title: 'Daily Range', text, url }); return; } catch (error) { if ((error as DOMException).name === 'AbortError') return; }
  }
  await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
  showToast('Copied to clipboard');
}

function resultText(): string {
  const mode = teammateKey ? 'Solved together' : 'Signal linked';
  return `Daily Range #${map.number}\n${mode} in ${Math.max(attempts, 1)} ${Math.max(attempts, 1) === 1 ? 'check' : 'checks'}\n⌂━━①━━②━━◆\nNo map spoilers`;
}

function showToast(message: string) {
  const toast = document.querySelector<HTMLElement>('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 2200);
}

function bindGame() {
  document.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach((button) => {
    const cell = map.cells.find((item) => cellKey(item) === button.dataset.cell)!;
    button.addEventListener('click', () => selectCell(cell));
    button.addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); moveFocus(cell, event.key); }
      if (event.key === 'Backspace') { event.preventDefault(); undo(); }
    });
  });
  document.querySelector('#undo')?.addEventListener('click', undo);
  document.querySelector<HTMLInputElement>('#day-picker')?.addEventListener('change', (event) => {
    const value = (event.target as HTMLInputElement).value;
    if (!isValidDay(value, today)) { showToast('Choose a date from 2026 through today.'); return; }
    history.pushState({}, '', value === today ? '/' : `/?day=${value}`);
    reset(value);
  });
  document.querySelector('#share-move')?.addEventListener('click', () => {
    const url = new URL(location.href); url.search = ''; url.searchParams.set('day', day); url.searchParams.set('relay', cellKey(relays[0]));
    copyOrShare(`I planted relay 1 on Daily Range #${map.number}. Can you close the signal?`, url.toString());
  });
  document.querySelector('#share-result')?.addEventListener('click', () => copyOrShare(resultText(), `${location.origin}/?day=${day}`));
  document.querySelector('#copy-result')?.addEventListener('click', () => copyOrShare(resultText()));
}

function undo() {
  if (solved || relays.length === 0 || (relays.length === 1 && teammateKey)) return;
  relays.pop();
  renderGame();
}

function reset(nextDay = day) {
  day = nextDay; map = createMap(day); relays = []; teammateKey = null; attempts = 0; solved = false; restoreSaved(); renderGame();
}

window.addEventListener('offline', () => showToast('Offline field kit active — cached maps still work.'));
window.addEventListener('online', () => showToast('Back online.'));
window.addEventListener('popstate', () => { parseState(); renderGame(); });

if (location.pathname === '/privacy' || location.pathname === '/privacy/') legalPage('privacy');
else if (location.pathname === '/terms' || location.pathname === '/terms/') legalPage('terms');
else {
  parseState(); renderGame();
  if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
}
