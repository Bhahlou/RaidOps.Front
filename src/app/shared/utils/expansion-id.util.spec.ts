import { expansionIdFromShortCode } from './expansion-id.util';

describe('expansionIdFromShortCode', () => {
  it.each([
    ['Classic', 1],
    ['TBC', 2],
    ['WotLK', 3],
    ['Cata', 4],
    ['MoP', 5],
    ['WoD', 6],
    ['Legion', 7],
    ['BfA', 8],
    ['SL', 9],
    ['DF', 10],
    ['TWW', 11],
    ['Forever', 12],
  ])('resolves %s to expansion id %i', (shortCode, id) => {
    expect(expansionIdFromShortCode(shortCode)).toBe(id);
  });

  it('returns null for an unrecognized short code', () => {
    expect(expansionIdFromShortCode('Unknown')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(expansionIdFromShortCode(undefined)).toBeNull();
  });
});
