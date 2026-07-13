import { describe, it, expect } from 'vitest';
import { isValidJordanPhone, normalizeJordanPhone } from './phone';

describe('isValidJordanPhone', () => {
  it('accepts valid Zain numbers', () => {
    expect(isValidJordanPhone('0791234567')).toBe(true);
    expect(isValidJordanPhone('+962791234567')).toBe(true);
    expect(isValidJordanPhone('962791234567')).toBe(true);
  });

  it('accepts valid Orange numbers', () => {
    expect(isValidJordanPhone('0771234567')).toBe(true);
    expect(isValidJordanPhone('+962771234567')).toBe(true);
  });

  it('accepts valid Umniah numbers', () => {
    expect(isValidJordanPhone('0781234567')).toBe(true);
    expect(isValidJordanPhone('+962781234567')).toBe(true);
  });

  it('rejects invalid prefixes', () => {
    expect(isValidJordanPhone('0761234567')).toBe(false);
    expect(isValidJordanPhone('0751234567')).toBe(false);
  });

  it('rejects invalid lengths', () => {
    expect(isValidJordanPhone('079123456')).toBe(false); // too short
    expect(isValidJordanPhone('07912345678')).toBe(false); // too long
  });

  it('handles spaces and dashes', () => {
    expect(isValidJordanPhone('079 123 4567')).toBe(true);
    expect(isValidJordanPhone('079-123-4567')).toBe(true);
    expect(isValidJordanPhone('+962 79 123 4567')).toBe(true);
  });
});

describe('normalizeJordanPhone', () => {
  it('normalizes to 962 format', () => {
    expect(normalizeJordanPhone('0791234567')).toBe('962791234567');
    expect(normalizeJordanPhone('962791234567')).toBe('962791234567');
    expect(normalizeJordanPhone('+962791234567')).toBe('962791234567');
    expect(normalizeJordanPhone('079 123 4567')).toBe('962791234567');
  });
});
