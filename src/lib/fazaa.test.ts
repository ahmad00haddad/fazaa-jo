import { describe, it, expect } from 'vitest';
import { distanceKm } from './fazaa';

describe('distanceKm', () => {
  it('calculates distance between two identical points as 0', () => {
    expect(distanceKm({ lat: 31.9522, lng: 35.9334 }, { lat: 31.9522, lng: 35.9334 })).toBeCloseTo(0, 4);
  });

  it('calculates distance between Amman and Zarqa correctly (~20km)', () => {
    // Amman: 31.9522, 35.9334
    // Zarqa: 32.0653, 36.0895
    const dist = distanceKm({ lat: 31.9522, lng: 35.9334 }, { lat: 32.0653, lng: 36.0895 });
    expect(dist).toBeGreaterThan(18);
    expect(dist).toBeLessThan(22);
  });

  it('calculates distance between Amman and Aqaba correctly (~280km)', () => {
    // Amman: 31.9522, 35.9334
    // Aqaba: 29.5319, 35.0061
    const dist = distanceKm({ lat: 31.9522, lng: 35.9334 }, { lat: 29.5319, lng: 35.0061 });
    expect(dist).toBeGreaterThan(270);
    expect(dist).toBeLessThan(290);
  });
});
