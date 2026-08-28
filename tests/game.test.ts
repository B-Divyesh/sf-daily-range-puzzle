import { describe, expect, it } from 'vitest';
import { createMap, hashSeed, hexDistance, isSolved, isValidDay, routeDistances } from '../src/game';

describe('daily map generation', () => {
  it('is stable for the same public date seed', () => {
    expect(createMap('2026-08-28')).toEqual(createMap('2026-08-28'));
    expect(createMap('2026-08-28')).not.toEqual(createMap('2026-08-27'));
    expect(hashSeed('daily-range:2026-08-28')).toBe(3778120998);
  });

  it('always contains a valid two-relay route with a lookout', () => {
    for (let day = 1; day <= 60; day += 1) {
      const date = `2026-02-${String((day % 28) + 1).padStart(2, '0')}`;
      const map = createMap(date);
      const land = map.cells.filter((cell) => !['water', 'ridge'].includes(cell.terrain));
      const solution = land.flatMap((a) => land.map((b) => [a, b])).find(([a, b]) => a !== b && isSolved(map, [a, b]));
      expect(solution, `expected a solution for ${date}`).toBeTruthy();
    }
  });
});

describe('range rules', () => {
  it('measures odd-row offset hex distance', () => {
    expect(hexDistance({ col: 0, row: 2 }, { col: 2, row: 2 })).toBe(2);
    expect(hexDistance({ col: 0, row: 2 }, { col: 2, row: 1 })).toBe(3);
  });

  it('reports each route hop', () => {
    const map = createMap('2026-08-28');
    const relays = [map.cells.find((cell) => cell.col === 2 && cell.row === 2)!, map.cells.find((cell) => cell.col === 4 && cell.row === 2)!];
    expect(routeDistances(map, relays)).toEqual([2, 2, 2]);
    expect(routeDistances(map, [])).toEqual([]);
  });

  it('accepts only real, non-future archive dates', () => {
    expect(isValidDay('2026-02-02', '2026-08-28')).toBe(true);
    expect(isValidDay('2026-12-01', '2026-08-28')).toBe(false);
    expect(isValidDay('not-a-date', '2026-08-28')).toBe(false);
  });
});
