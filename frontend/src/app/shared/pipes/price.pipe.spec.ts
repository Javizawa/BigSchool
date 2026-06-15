import { PricePipe } from './price.pipe';

describe('PricePipe', () => {
  const pipe = new PricePipe();

  it('formats a positive integer as EUR currency', () => {
    const result = pipe.transform(120);
    expect(result).toContain('120');
    expect(result).toContain('€');
  });

  it('formats a decimal price', () => {
    const result = pipe.transform(99.99);
    expect(result).toContain('99');
    expect(result).toContain('€');
  });

  it('returns empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('formats zero as currency', () => {
    const result = pipe.transform(0);
    expect(result).toContain('0');
    expect(result).toContain('€');
  });
});
