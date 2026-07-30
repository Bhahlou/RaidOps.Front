import { GuildAccessLevel } from '../../../core/models/guild-access-level.enum';
import { UserGuild } from '../../../core/models/user-guild.model';
import { buildScopeOptions, scopeFromKey, scopeToKey } from './availability-scope.util';

const makeGuild = (overrides?: Partial<UserGuild>): UserGuild => ({
  id: 'guild-1',
  name: 'Dah Boo',
  iconHash: null,
  isRegistered: true,
  isConfigured: true,
  isAdmin: false,
  accessLevel: GuildAccessLevel.Roster,
  branches: [],
  ...overrides,
});

describe('scopeToKey', () => {
  it('encodes the Global scope as the global sentinel key', () => {
    expect(scopeToKey({ guildId: null, guildBranchId: null })).toBe('__global__');
  });

  it('encodes a branch scope as "guildId:guildBranchId"', () => {
    expect(scopeToKey({ guildId: 'guild-1', guildBranchId: 7 })).toBe('guild-1:7');
  });
});

describe('scopeFromKey', () => {
  it('decodes the global sentinel key back to the Global scope', () => {
    expect(scopeFromKey('__global__')).toEqual({ guildId: null, guildBranchId: null });
  });

  it('decodes a "guildId:guildBranchId" key back to a branch scope', () => {
    expect(scopeFromKey('guild-1:7')).toEqual({ guildId: 'guild-1', guildBranchId: 7 });
  });

  it('round-trips through scopeToKey for a branch scope', () => {
    const scope = { guildId: 'guild-2', guildBranchId: 42 };
    expect(scopeFromKey(scopeToKey(scope))).toEqual(scope);
  });
});

describe('buildScopeOptions', () => {
  it('returns only the Global option when there are no guilds', () => {
    expect(buildScopeOptions([], 'Global')).toEqual([{ value: '__global__', label: 'Global' }]);
  });

  it('lists the Global option first, then one entry per active-character branch, grouped by guild', () => {
    const guilds: UserGuild[] = [
      makeGuild({
        id: 'guild-1',
        name: 'Dah Boo',
        branches: [
          { id: 10, branchId: 1, branchName: 'Retail', accessLevel: GuildAccessLevel.Roster, hasActiveCharacter: true },
          { id: 11, branchId: 2, branchName: 'Classic', accessLevel: GuildAccessLevel.Roster, hasActiveCharacter: false },
        ],
      }),
      makeGuild({
        id: 'guild-2',
        name: 'Horde Guild',
        branches: [
          { id: 20, branchId: 1, branchName: 'Retail', accessLevel: GuildAccessLevel.Officer, hasActiveCharacter: true },
        ],
      }),
    ];

    expect(buildScopeOptions(guilds, 'Global')).toEqual([
      { value: '__global__', label: 'Global' },
      { value: 'guild-1:10', label: 'Retail', group: 'Dah Boo' },
      { value: 'guild-2:20', label: 'Retail', group: 'Horde Guild' },
    ]);
  });

  it('excludes branches without an active roster character', () => {
    const guilds: UserGuild[] = [
      makeGuild({
        branches: [
          { id: 10, branchId: 1, branchName: 'Retail', accessLevel: GuildAccessLevel.Roster, hasActiveCharacter: false },
        ],
      }),
    ];

    expect(buildScopeOptions(guilds, 'Global')).toEqual([{ value: '__global__', label: 'Global' }]);
  });
});
