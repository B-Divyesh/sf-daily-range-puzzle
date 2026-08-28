export type Terrain = 'open' | 'water' | 'ridge' | 'lookout';
export type Cell = { col: number; row: number; terrain: Terrain };
export type MapData = { day: string; number: number; cells: Cell[]; start: Cell; target: Cell };

const LAUNCH_DAY = '2026-01-01';

export function dayNumber(day: string): number {
  return Math.floor((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${LAUNCH_DAY}T00:00:00Z`)) / 86400000) + 1;
}

export function hashSeed(value: string): number {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let out = Math.imul(state ^ (state >>> 15), 1 | state);
    out = (out + Math.imul(out ^ (out >>> 7), 61 | out)) ^ out;
    return ((out ^ (out >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexDistance(a: Pick<Cell, 'col' | 'row'>, b: Pick<Cell, 'col' | 'row'>): number {
  const aq = a.col - (a.row - (a.row & 1)) / 2;
  const bq = b.col - (b.row - (b.row & 1)) / 2;
  const ar = a.row;
  const br = b.row;
  return (Math.abs(aq - bq) + Math.abs(ar - br) + Math.abs(aq + ar - bq - br)) / 2;
}

export function cellKey(cell: Pick<Cell, 'col' | 'row'>): string {
  return `${cell.col},${cell.row}`;
}

export function createMap(day: string): MapData {
  const rand = random(hashSeed(`daily-range:${day}`));
  const cells: Cell[] = [];
  const start = { col: 0, row: 2, terrain: 'open' as Terrain };
  const target = { col: 6, row: 2, terrain: 'open' as Terrain };
  const solutionA = { col: 2, row: 1 + Math.floor(rand() * 3) };
  const candidatesB = [1, 2, 3].map((row) => ({ col: 4, row }));
  const solutionB = candidatesB.filter((cell) => hexDistance(solutionA, cell) <= 3 && hexDistance(cell, target) <= 3)[Math.floor(rand() * candidatesB.filter((cell) => hexDistance(solutionA, cell) <= 3 && hexDistance(cell, target) <= 3).length)];
  const guaranteed = new Set([cellKey(start), cellKey(target), cellKey(solutionA), cellKey(solutionB)]);

  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const key = `${col},${row}`;
      let terrain: Terrain = 'open';
      if (key === cellKey(solutionA)) terrain = 'lookout';
      else if (!guaranteed.has(key)) {
        const roll = rand();
        if (roll < 0.18) terrain = 'water';
        else if (roll < 0.34) terrain = 'ridge';
        else if (roll < 0.43) terrain = 'lookout';
      }
      cells.push({ col, row, terrain });
    }
  }
  return { day, number: dayNumber(day), cells, start: cells.find((cell) => cellKey(cell) === cellKey(start))!, target: cells.find((cell) => cellKey(cell) === cellKey(target))! };
}

export function routeDistances(map: MapData, relays: Cell[]): number[] {
  const route = [map.start, ...relays, ...(relays.length === 2 ? [map.target] : [])];
  return route.slice(1).map((cell, index) => hexDistance(route[index], cell));
}

export function isSolved(map: MapData, relays: Cell[]): boolean {
  return relays.length === 2 && relays.some((cell) => cell.terrain === 'lookout') && routeDistances(map, relays).every((distance) => distance <= 3);
}

export function isoToday(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isValidDay(value: string | null, today = isoToday()): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && value <= today && value >= LAUNCH_DAY);
}
