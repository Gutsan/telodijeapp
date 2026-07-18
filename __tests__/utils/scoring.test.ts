import { calculatePoints } from '../../utils/scoring';

describe('Scoring Utils', () => {
  describe('calculatePoints', () => {
    it('should return 3 points for exact match', () => {
      expect(calculatePoints(2, 1, 2, 1)).toBe(3);
      expect(calculatePoints(0, 0, 0, 0)).toBe(3);
      expect(calculatePoints(3, 2, 3, 2)).toBe(3);
    });

    it('should return 1 point for correct trend (home wins)', () => {
      expect(calculatePoints(1, 0, 3, 1)).toBe(1);
      expect(calculatePoints(2, 1, 5, 3)).toBe(1);
    });

    it('should return 1 point for correct trend (away wins)', () => {
      expect(calculatePoints(0, 1, 1, 3)).toBe(1);
      expect(calculatePoints(1, 2, 2, 4)).toBe(1);
    });

    it('should return 1 point for correct trend (draw)', () => {
      expect(calculatePoints(1, 1, 2, 2)).toBe(1);
      expect(calculatePoints(0, 0, 1, 1)).toBe(1);
    });

    it('should return 0 points for wrong prediction', () => {
      expect(calculatePoints(2, 1, 0, 3)).toBe(0);
      expect(calculatePoints(1, 0, 0, 1)).toBe(0);
      expect(calculatePoints(0, 1, 1, 0)).toBe(0);
    });
  });
});
