import { getLastVisitedBranchId, setLastVisitedBranchId } from './last-visited-branch.util';

describe('last-visited-branch.util', () => {
  afterEach(() => localStorage.clear());

  describe('getLastVisitedBranchId', () => {
    it('returns null when nothing is recorded for this guild', () => {
      expect(getLastVisitedBranchId('g1')).toBeNull();
    });

    it('returns the recorded branch id as a number', () => {
      localStorage.setItem('guild-last-branch:g1', '7');

      expect(getLastVisitedBranchId('g1')).toBe(7);
    });

    it('returns null for a malformed stored value', () => {
      localStorage.setItem('guild-last-branch:g1', 'not-a-number');

      expect(getLastVisitedBranchId('g1')).toBeNull();
    });

    it('keys by guild id — does not leak another guild\'s value', () => {
      localStorage.setItem('guild-last-branch:g1', '7');

      expect(getLastVisitedBranchId('g2')).toBeNull();
    });
  });

  describe('setLastVisitedBranchId', () => {
    it('stores the branch id, readable back via getLastVisitedBranchId', () => {
      setLastVisitedBranchId('g1', 12);

      expect(getLastVisitedBranchId('g1')).toBe(12);
    });

    it('overwrites a previous value for the same guild', () => {
      setLastVisitedBranchId('g1', 12);
      setLastVisitedBranchId('g1', 5);

      expect(getLastVisitedBranchId('g1')).toBe(5);
    });
  });
});
