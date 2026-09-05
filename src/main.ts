import './style.css';
import heroUrl from './assets/range-field-map.webp';
import { canFinishFromFirstRelay, cellKey, createMap, hexDistance, isLegalRelayCell, isSolved, isValidDay, isoToday, routeDistances, type Cell, type MapData } from './game';

const app = document.querySelector<HTMLDivElement>('#app')!;
const glyphs = { open: '·', water: '≈', ridge: '▲', lookout: '✦' } as const;
const terrainNames = { open: 'open ground', water: 'water — cannot place', ridge: 'ridge — cannot place', lookout: 'lookout' } as const;
const today = isoToday();
const sampleDay = '2026-08-28';
const sampleFirstRelay = '2,1';

let day = today;
let map: MapData;
let relays: Cell[] = [];
let teammateKey: string | null = null;
let attempts = 0;
let solved = false;
let demoMode = false;
let recoveryNotice = '';
let shareFallback: { text: string; url?: string } | null = null;

function storageKey() {
  return `${demoMode ? 'demo:' : ''}daily-range:${day}`;
}

function clearDemoStorage() {
  try {
    Object.keys(localStorage).filter((key) => key.startsWith('demo:daily-range:')).forEach((key) => localStorage.removeItem(key));
  } catch { /* storage is optional */ }
}

function formatDay(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function parseState() {
  relays = [];
  teammateKey = null;
  attempts = 0;
  solved = false;
  shareFallback = null;
  recoveryNotice = '';
  const params = new URLSearchParams(location.search);
  demoMode = location.pathname === '/demo' || location.pathname === '/demo/' || params.get('demo') === '1';
  const sampleStarter = params.get('starter') === '1';
  const requestedDay = params.get('day');
  if (requestedDay && !isValidDay(requestedDay, today)) recoveryNotice = 'That date is not available. Showing a playable map instead.';
  day = isValidDay(requestedDay, today) ? requestedDay : (demoMode ? sampleDay : today);
  map = createMap(day);
  const shared = params.get('relay');
  if (shared) {
    const cell = map.cells.find((item) => cellKey(item) === shared);
    if (cell && isLegalRelayCell(map, cell) && canFinishFromFirstRelay(map, cell)) {
      teammateKey = shared;
      relays = [cell];
    } else {
      recoveryNotice = 'This shared first move cannot be finished. Start a new route from this map.';
    }
  } else {
    restoreSaved();
    if (demoMode && !sampleStarter && !solved && relays.length === 0) {
      const sampleRelay = map.cells.find((cell) => cellKey(cell) === sampleFirstRelay);
      if (sampleRelay && canFinishFromFirstRelay(map, sampleRelay)) {
        teammateKey = sampleFirstRelay;
        relays = [sampleRelay];
      }
    }
  }
}

function restoreSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()) ?? 'null') as { solved?: boolean; attempts?: number; relays?: string[] } | null;
    if (!saved?.solved || saved.relays?.length !== 2) return;
    const restored = saved.relays.map((key) => map.cells.find((cell) => cellKey(cell) === key)).filter((cell): cell is Cell => Boolean(cell));
    if (isSolved(map, restored)) {
      relays = restored;
      attempts = Math.max(saved.attempts ?? 1, 1);
      solved = true;
    }
  } catch { /* storage is optional and untrusted */ }
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
  if (solved) return 'Route complete. All three hops are within 3 km.';
  if (relays.length === 0) return 'Choose relay 1. Your two relays need at least one lookout.';
  if (relays.length === 1) {
    const distance = hexDistance(map.start, relays[0]);
    if (teammateKey) return `${demoMode ? 'The sample route starts' : 'A friend starts'} ${distance} km from camp. Place relay 2.`;
    if (!canFinishFromFirstRelay(map, relays[0])) return 'This relay cannot complete a route. Undo it and choose another tile.';
    return `Relay 1 is ${distance} km from camp. It can be shared or followed by relay 2.`;
  }
  const distances = routeDistances(map, relays);
  const issue = distances.findIndex((distance) => distance > 3);
  if (!relays.some((cell) => cell.terrain === 'lookout')) return 'Your route needs at least one relay on a ✦ lookout.';
  if (issue >= 0) return `Hop ${issue + 1} is ${distances[issue]} km, over the 3 km range. Move a relay.`;
  return 'Checking the route.';
}

function cellMarkup(cell: Cell): string {
  const key = cellKey(cell);
  const relayIndex = relays.findIndex((item) => cellKey(item) === key);
  const special = key === cellKey(map.start) ? 'start' : key === cellKey(map.target) ? 'target' : '';
  const unavailable = !isLegalRelayCell(map, cell);
  const label = special === 'start'
    ? 'Camp, route start'
    : special === 'target'
      ? 'Beacon, route goal'
      : `Column ${cell.col + 1}, row ${cell.row + 1}, ${terrainNames[cell.terrain]}${relayIndex >= 0 ? `, relay ${relayIndex + 1}${key === teammateKey ? demoMode ? ' from the sample route' : ' from teammate' : ''}` : ''}`;
  return `<button class="hex terrain-${cell.terrain} ${special} ${relayIndex >= 0 ? 'has-relay' : ''}" data-cell="${key}" data-col="${cell.col}" data-row="${cell.row}" aria-label="${label}" aria-pressed="${relayIndex >= 0}" ${unavailable ? 'aria-disabled="true"' : ''} ${solved ? 'disabled' : ''}>
    <span class="terrain-glyph" aria-hidden="true">${special === 'start' ? '⌂' : special === 'target' ? '◆' : glyphs[cell.terrain]}</span>
    ${relayIndex >= 0 ? `<span class="relay-token" aria-hidden="true">${relayIndex + 1}</span>` : ''}
  </button>`;
}

function shareFallbackMarkup() {
  if (!shareFallback) return '';
  const copyText = shareFallback.url ? `${shareFallback.text}\n${shareFallback.url}` : shareFallback.text;
  return `<section class="share-fallback" aria-labelledby="share-fallback-title"><h3 id="share-fallback-title">Copy this message yourself</h3><p>Your browser blocked automatic copying. Select the text below, then send it to your friend.</p><textarea id="share-fallback-text" readonly aria-label="Message to copy manually">${copyText}</textarea><div class="game-actions"><button class="button secondary" id="select-share-text">Select message</button><button class="button secondary" id="close-share-fallback">Close</button></div></section>`;
}

function gameMarkup(): string {
  const distances = routeDistances(map, relays);
  const shareable = relays.length === 1 && !teammateKey && canFinishFromFirstRelay(map, relays[0]);
  const pageHeading = demoMode ? 'Sample route ready' : day === today ? 'Today’s map' : formatDay(day);
  return `<section class="game-shell" aria-labelledby="map-title">
    <div class="game-head">
      <div><p class="eyebrow">${demoMode ? 'Sample map' : `Daily map ${map.number}`}</p><h2 id="map-title">${pageHeading}</h2></div>
      <label class="date-control">Replay a date<input id="day-picker" type="date" min="2026-01-01" max="${today}" value="${day}" /></label>
    </div>
    ${recoveryNotice ? `<p class="recovery-note" role="status">${recoveryNotice}</p>` : ''}
    ${teammateKey ? `<div class="teammate-note"><span aria-hidden="true">✦</span><span><strong>${demoMode ? 'A sample player started this route.' : 'A friend started this route.'}</strong> Their relay 1 is pinned. Place relay 2 to finish it.</span></div>` : ''}
    <div class="map-wrap">
      <svg class="routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${routeSvg()}</svg>
      <div class="board" role="group" aria-label="Daily 7 column by 5 row hex map. Arrow keys move between tiles; Enter or Space plants a relay.">${map.cells.map(cellMarkup).join('')}</div>
    </div>
    <div class="legend" aria-label="Map legend"><span><b>⌂</b> Camp</span><span><b>◆</b> Beacon</span><span><b>✦</b> Lookout</span><span><b>▲</b> Ridge</span><span><b>≈</b> Water</span></div>
    <div class="route-readout"><div><span>Hop 1</span><strong>${distances[0] ?? '—'} km</strong></div><div><span>Hop 2</span><strong>${distances[1] ?? '—'} km</strong></div><div><span>Hop 3</span><strong>${distances[2] ?? '—'} km</strong></div></div>
    <p class="status" id="game-status" tabindex="-1" aria-live="polite">${statusText()}</p>
    <div class="game-actions">
      <button class="button secondary" id="undo" ${relays.length === 0 || solved || (relays.length === 1 && Boolean(teammateKey)) ? 'disabled' : ''}>Undo last relay</button>
      ${shareable ? '<button class="button primary" id="share-move">Send a finishable first move</button>' : ''}
      ${solved ? '<button class="button primary" id="share-result">Share result</button><button class="button secondary" id="copy-result">Copy result</button>' : ''}
    </div>
    ${shareFallbackMarkup()}
    <p class="board-help">Keyboard: use arrow keys to move, Enter or Space to place a relay, and Backspace to undo.</p>
  </section>`;
}

function chrome(content: string): string {
  return `<header class="site-header"><a class="brand" href="/" data-route aria-label="Daily Range home"><span class="brand-mark" aria-hidden="true">↗</span><span>Daily Range</span></a><nav aria-label="Main navigation"><a href="/demo" data-route>Demo</a><a href="/#how">How to play</a><a href="/privacy" data-route>Privacy</a></nav></header>
  ${demoMode ? '<aside class="demo-banner" aria-label="Demo status"><strong>Demo — sample data, nothing is saved to your real game.</strong><span><button class="text-button" id="reset-demo">Reset demo</button><a href="/" data-route>Start for real</a></span></aside>' : ''}
  ${navigator.onLine ? '' : '<div class="offline-note" role="status"><strong>Offline:</strong> cached maps and prior dates still work.</div>'}
  <main id="main">${content}</main>
  <footer><p>Daily Range is a cooperative relay map for friends.</p><p><a href="/privacy" data-route>Privacy</a><a href="/terms" data-route>Terms</a><span>Built by Param Factory</span><span>Build 1.1.0</span></p></footer>
  <div class="toast" id="toast" role="status" aria-live="polite"></div><div class="route-announcer" aria-live="polite" aria-atomic="true"></div>`;
}

function legalPage(kind: 'privacy' | 'terms') {
  const privacy = `<article class="legal"><p class="eyebrow">Privacy</p><h1 tabindex="-1">How Daily Range stores game data</h1><p>Daily Range does not ask for an account. It does not include analytics, advertising, or third-party scripts.</p><h2>Game storage</h2><p>Completed real maps are stored in this browser. Sample maps use separate demo storage. Clear site data in your browser to remove both.</p><h2>Shared links</h2><p>A shared link contains a public date and one relay coordinate. It does not contain a name or device identifier.</p><h2>Network use</h2><p>The service worker caches this site’s files for offline replay. Gameplay does not send events to a server. Static hosting can record standard request logs.</p><p><a class="text-link" href="/" data-route>Back to today’s map</a></p></article>`;
  const terms = `<article class="legal"><p class="eyebrow">Terms</p><h1 tabindex="-1">Terms for playing Daily Range</h1><p>Daily Range is free to play and provided as is. It comes without warranties.</p><h2>Use the site safely</h2><p>Do not disrupt the site or use it to harm others. You decide where to post a shared link.</p><h2>Availability</h2><p>Maps are generated in your browser. Hosting can change or become unavailable.</p><h2>Source license</h2><p>The source code is available under the MIT License.</p><p><a class="text-link" href="/" data-route>Back to today’s map</a></p></article>`;
  app.innerHTML = chrome(kind === 'privacy' ? privacy : terms);
}

function landingMarkup(): string {
  return `<section class="hero">
    <div class="hero-copy"><p class="eyebrow">A cooperative distance puzzle</p><h1 tabindex="-1">Solve today’s relay map together</h1><p class="lede">For friends who want a short map to solve and share each day.</p><div class="hero-actions"><a class="button primary" href="/demo" data-route>Try it with sample data</a><span>Opens a pre-started route you can finish.</span></div><a class="real-start" href="#puzzle">Play today’s map</a><ul class="facts"><li>Free to play</li><li>No account or tracking</li><li>Works offline after your first visit</li></ul></div>
    <div class="hero-art"><img src="${heroUrl}" width="768" height="512" alt="An abstract field map showing relay flags and a route" fetchpriority="high" decoding="async" /><span class="art-stamp">1 hex = 1 km</span></div>
  </section>
  <section class="rules" id="how" aria-labelledby="rules-title"><p class="eyebrow">How to play</p><h2 id="rules-title">Finish the route in three steps</h2><ol><li><span>1</span><p>Choose two relay tiles.</p></li><li><span>2</span><p>Keep every hop at 3 km or less.</p></li><li><span>3</span><p>Use at least one ✦ lookout.</p></li></ol></section>
  <section class="privacy-summary" aria-labelledby="privacy-title"><h2 id="privacy-title">What stays on this device</h2><p>Completed maps stay in your browser. Shared links contain only a date and one relay tile.</p><a href="/privacy" data-route>Read the privacy details</a></section>
  <div id="puzzle">${gameMarkup()}</div>`;
}

function demoMarkup(): string {
  return `<section class="demo-intro"><p class="eyebrow">Try the sample</p><h1 tabindex="-1">Finish this sample relay route</h1><p>The first relay is set. Place relay 2 to reach the beacon.</p></section><div id="puzzle">${gameMarkup()}</div><section class="rules" aria-labelledby="demo-rules-title"><p class="eyebrow">How to play</p><h2 id="demo-rules-title">Keep each route hop short</h2><ol><li><span>1</span><p>Choose a tile for relay 2.</p></li><li><span>2</span><p>Keep each hop at 3 km or less.</p></li><li><span>3</span><p>Use a ✦ lookout in the route.</p></li></ol></section>`;
}

function renderGame(focusKey?: string) {
  app.innerHTML = chrome(demoMode ? demoMarkup() : landingMarkup());
  bindGame();
  if (focusKey) document.querySelector<HTMLElement>(`[data-cell="${focusKey}"]`)?.focus();
  if (solved) document.querySelector<HTMLElement>('#game-status')?.focus();
}

function selectCell(cell: Cell) {
  if (!isLegalRelayCell(map, cell) || solved) return;
  const existing = relays.findIndex((item) => cellKey(item) === cellKey(cell));
  if (existing >= 0) {
    if (cellKey(cell) !== teammateKey) relays.splice(existing, 1);
  } else if (relays.length < 2) {
    relays.push(cell);
    if (relays.length === 2) {
      attempts += 1;
      solved = isSolved(map, relays);
      if (solved) {
        try { localStorage.setItem(storageKey(), JSON.stringify({ solved: true, attempts, relays: relays.map(cellKey) })); } catch { /* storage is optional */ }
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
  try {
    await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
    showToast('Copied to clipboard.');
  } catch {
    shareFallback = { text, url };
    renderGame();
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>('#share-fallback-text')?.focus(), 0);
  }
}

function resultText(): string {
  const mode = teammateKey ? 'Solved together' : 'Route complete';
  return `Daily Range #${map.number}\n${mode} in ${Math.max(attempts, 1)} ${Math.max(attempts, 1) === 1 ? 'check' : 'checks'}\n⌂━━①━━②━━◆\nNo map spoilers`;
}

function showToast(message: string) {
  const toast = document.querySelector<HTMLElement>('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 2200);
}

function gameUrl(nextDay: string) {
  const url = new URL(demoMode ? '/demo' : '/', location.origin);
  if (nextDay !== (demoMode ? sampleDay : today)) url.searchParams.set('day', nextDay);
  return `${url.pathname}${url.search}`;
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
    if (!isValidDay(value, today)) { showToast('Choose a real date from 2026 through today.'); return; }
    navigate(gameUrl(value), false);
  });
  document.querySelector('#share-move')?.addEventListener('click', () => {
    const url = new URL('/', location.origin);
    url.searchParams.set('day', day);
    url.searchParams.set('relay', cellKey(relays[0]));
    copyOrShare(`I planted relay 1 on Daily Range #${map.number}. Can you finish the route?`, url.toString());
  });
  document.querySelector('#share-result')?.addEventListener('click', () => copyOrShare(resultText(), `${location.origin}/?day=${day}`));
  document.querySelector('#copy-result')?.addEventListener('click', () => copyOrShare(resultText()));
  document.querySelector('#close-share-fallback')?.addEventListener('click', () => { shareFallback = null; renderGame(); });
  document.querySelector('#select-share-text')?.addEventListener('click', () => document.querySelector<HTMLTextAreaElement>('#share-fallback-text')?.select());
  document.querySelector('#reset-demo')?.addEventListener('click', () => { clearDemoStorage(); navigate('/demo', false); });
}

function undo() {
  if (solved || relays.length === 0 || (relays.length === 1 && teammateKey)) return;
  relays.pop();
  renderGame();
}

function pageKind() {
  if (location.pathname === '/privacy' || location.pathname === '/privacy/') return 'privacy';
  if (location.pathname === '/terms' || location.pathname === '/terms/') return 'terms';
  return 'game';
}

function setDocumentMeta(kind: 'game' | 'privacy' | 'terms') {
  const demo = kind === 'game' && demoMode;
  const title = kind === 'privacy' ? 'Privacy — Daily Range' : kind === 'terms' ? 'Terms — Daily Range' : demo ? 'Demo — Daily Range' : 'Daily Range — solve a daily relay map';
  document.title = title;
  const description = kind === 'privacy' ? 'How Daily Range stores local game data.' : kind === 'terms' ? 'Terms for playing the Daily Range puzzle.' : demo ? 'Try a sample cooperative relay map without changing your real game.' : 'Solve a short daily relay map with a friend in your browser.';
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${location.origin}${demo ? '/demo' : kind === 'privacy' ? '/privacy' : kind === 'terms' ? '/terms' : '/'}`);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
}

function renderRoute(moveFocus = false) {
  const kind = pageKind();
  if (kind === 'game') {
    parseState();
    setDocumentMeta('game');
    renderGame();
  } else {
    demoMode = false;
    setDocumentMeta(kind);
    legalPage(kind);
  }
  if (moveFocus) {
    const heading = document.querySelector<HTMLElement>('h1');
    heading?.focus();
    const announcer = document.querySelector<HTMLElement>('.route-announcer');
    if (announcer) announcer.textContent = document.title;
  }
}

function navigate(path: string, moveFocus = true) {
  history.pushState({}, '', path);
  renderRoute(moveFocus);
}

document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-route]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(link.getAttribute('href') ?? '/');
});

window.addEventListener('offline', () => showToast('Offline mode is active. Cached maps still work.'));
window.addEventListener('online', () => showToast('Back online.'));
window.addEventListener('popstate', () => renderRoute(true));

renderRoute();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').then(async (registration) => {
    await navigator.serviceWorker.ready;
    const cachedUrls = [location.href, ...performance.getEntriesByType('resource').map((entry) => entry.name)]
      .filter((url) => url.startsWith(location.origin));
    await caches.open('daily-range-v4').then((cache) => Promise.all(cachedUrls.map((url) => cache.add(url).catch(() => undefined))));
    (window as Window & { __dailyRangeOfflineReady?: boolean }).__dailyRangeOfflineReady = true;
    registration.active?.postMessage({ type: 'cache-page-assets', urls: cachedUrls });
  }).catch(() => undefined);
}
