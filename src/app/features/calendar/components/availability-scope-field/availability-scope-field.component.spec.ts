import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { AvailabilityScopeFieldComponent } from './availability-scope-field.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { User } from '../../../../core/models/user.model';
import { GuildAccessLevel } from '../../../../core/models/guild-access-level.enum';

const fakeUser: User = {
  discordId: 'user-1',
  name: 'Thrall',
  avatarHash: null,
  guilds: [
    {
      id: 'guild-1',
      name: 'Horde Guild',
      iconHash: null,
      isRegistered: true,
      isConfigured: true,
      isAdmin: false,
      accessLevel: GuildAccessLevel.Roster,
      branches: [{ id: 10, branchId: 1, branchName: 'Classic', accessLevel: GuildAccessLevel.Roster, hasActiveCharacter: true }],
    },
  ],
  notifications: [],
};

describe('AvailabilityScopeFieldComponent', () => {
  const setup = (user: User | null, guildId: string | null = null, guildBranchId: number | null = null) => {
    const translate = vi.fn((key: string) => key);

    TestBed.configureTestingModule({
      imports: [AvailabilityScopeFieldComponent],
      providers: [
        { provide: AuthStore, useValue: { user: signal(user) } },
        { provide: TranslocoService, useValue: { translate } },
      ],
    }).overrideComponent(AvailabilityScopeFieldComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(AvailabilityScopeFieldComponent);
    fixture.componentRef.setInput('editable', true);
    fixture.componentRef.setInput('guildId', guildId);
    fixture.componentRef.setInput('guildBranchId', guildBranchId);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  // ── options ───────────────────────────────────────────────────────────────

  describe('options', () => {
    it('lists the Global option plus one per active-character branch when a user is authenticated', () => {
      const component = setup(fakeUser);

      expect(component.options()).toEqual([
        { value: '__global__', label: 'calendar.scope.global' },
        { value: 'guild-1:10', label: 'Classic', group: 'Horde Guild' },
      ]);
    });

    it('falls back to no branches when there is no authenticated user', () => {
      const component = setup(null);

      expect(component.options()).toEqual([{ value: '__global__', label: 'calendar.scope.global' }]);
    });
  });

  // ── readonlyLabel ─────────────────────────────────────────────────────────

  describe('readonlyLabel', () => {
    it('returns the Global label when guildId is null', () => {
      const component = setup(fakeUser, null);

      expect(component.readonlyLabel()).toBe('calendar.scope.global');
    });

    it('returns the Global label when there is no authenticated user', () => {
      const component = setup(null, 'guild-1', 10);

      expect(component.readonlyLabel()).toBe('calendar.scope.global');
    });

    it('returns the Global label when the guild is not found', () => {
      const component = setup(fakeUser, 'guild-missing', 10);

      expect(component.readonlyLabel()).toBe('calendar.scope.global');
    });

    it('returns the Global label when the branch is not found within the guild', () => {
      const component = setup(fakeUser, 'guild-1', 999);

      expect(component.readonlyLabel()).toBe('calendar.scope.global');
    });

    it('returns "guild — branch" when both are found', () => {
      const component = setup(fakeUser, 'guild-1', 10);

      expect(component.readonlyLabel()).toBe('Horde Guild — Classic');
    });
  });
});
