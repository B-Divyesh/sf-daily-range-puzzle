import { describe, expect, it } from 'vitest';
import { canFinishFromFirstRelay, createMap, hashSeed, hexDistance, isLegalRelayCell, isSolved, isValidDay, routeDistances } from '../src/game';

describe('daily map generation', () => {
  it('@claim:daily-map creates a stable, date-specific map', () => {
    const august28 = createMap('2026-08-28');
    const august29 = createMap('2026-08-29');
    expect(august28).toEqual(createMap('2026-08-28'));
    expect(august28.day).toBe('2026-08-28');
    expect(august29.day).toBe('2026-08-29');
    expect(august28.cells).not.toEqual(august29.cells);
    expect(hashSeed('daily-range:2026-08-28')).toBe(3778120998);
  });

  it('guarantees a valid two-relay route across the available archive', () => {
    for (let day = 1; day <= 248; day += 1) {
      const date = new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10);
      const map = createMap(date);
      const land = map.cells.filter((cell) => isLegalRelayCell(map, cell));
      const solution = land.flatMap((a) => land.map((b) => [a, b] as const)).find(([a, b]) => a !== b && isSolved(map, [a, b]));
      expect(solution, `expected a solution for ${date}`).toBeTruthy();
    }
  });
});

describe('range rules', () => {
  it('@claim:map-scale measures each adjacent hex step as 1 km', () => {
    expect(hexDistance({ col: 0, row: 2 }, { col: 1, row: 2 })).toBe(1);
    expect(hexDistance({ col: 0, row: 2 }, { col: 2, row: 2 })).toBe(2);
    expect(hexDistance({ col: 0, row: 2 }, { col: 2, row: 1 })).toBe(3);
  });

  it('@claim:route-rules requires two relays, a lookout, and short hops', () => {
    const map = createMap('2026-08-28');
    const first = map.cells.find((cell) => cell.col === 2 && cell.row === 1)!;
    const second = map.cells.find((cell) => cell.col === 4 && cell.row === 2)!;
    expect(routeDistances(map, [first, second])).toEqual([3, 2, 2]);
    expect(isSolved(map, [first, second])).toBe(true);
    expect(isSolved(map, [first])).toBe(false);
    expect(isSolved(map, [second, first])).toBe(false);
  });

  it('accepts only real, non-future archive dates', () => {
    expect(isValidDay('2026-02-02', '2026-08-28')).toBe(true);
    expect(isValidDay('2026-02-31', '2026-08-28')).toBe(false);
    expect(isValidDay('2026-13-01', '2026-08-28')).toBe(false);
    expect(isValidDay('2026-12-01', '2026-08-28')).toBe(false);
    expect(isValidDay('not-a-date', '2026-08-28')).toBe(false);
  });
});

describe('cooperative first moves', () => {
  it('classifies every legal first relay by whether an independent second relay can finish it', () => {
    for (let day = 1; day <= 248; day += 1) {
      const date = new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10);
      const map = createMap(date);
      for (const first of map.cells.filter((cell) => isLegalRelayCell(map, cell))) {
        const independentResult = map.cells.some((second) => isLegalRelayCell(map, second) && second !== first && isSolved(map, [first, second]));
        expect(canFinishFromFirstRelay(map, first), `${date} ${first.col},${first.row}`).toBe(independentResult);
      }
    }
  });
});
